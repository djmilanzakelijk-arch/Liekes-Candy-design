/* ============================================================
   Persistent game state + tiny event bus.
   Everything the player owns, earned or configured lives here.
   ============================================================ */

import { todayKey, daysBetween, uid, clamp } from './utils.js';
import { STARTER_CANDIES, CANDIES } from '../data/candies.js';
import { STARTER_DECOS, STARTER_PACKS, DECORATIONS, PACKAGING } from '../data/decorations.js';
import { COLOR_UNLOCK, FLAVORS } from '../data/palette.js';
import { computeBonuses, UPGRADES, UPG_BY_ID, LOC_BY_ID } from '../data/upgrades.js';
import { staffBonuses, makeEmployee, roleOf, wageOf, payrollOf } from '../data/staff.js';
import { fameTier } from '../data/social.js';
import { moodOf as petMood, bonusFor as petBonus } from '../data/pet.js';
import { decorMood } from '../data/shopDecor.js';
import { CONTENT_REV } from './version.js';

export const SAVE_KEY = 'liekes-candy-design/save/v1';
const SAVE_VERSION = 1;

/* ── event bus ───────────────────────────────────────── */
const listeners = new Map();
export function on(evt, fn){
  if (!listeners.has(evt)) listeners.set(evt, new Set());
  listeners.get(evt).add(fn);
  return () => listeners.get(evt).delete(fn);
}
export function emit(evt, payload){
  const set = listeners.get(evt);
  if (set) for (const fn of [...set]) { try { fn(payload); } catch (e) { console.error(e); } }
}

/* ── defaults ────────────────────────────────────────── */
function freshState(){
  return {
    v: SAVE_VERSION,
    created: Date.now(),
    lastSeen: Date.now(),

    shopName: "Lieke's Candy Shop",
    level: 1,
    xp: 0,
    coins: 500,
    gems: 3,

    location: 'village',
    locations: ['village'],

    owned: {
      candies: [...STARTER_CANDIES],
      decos:   [...STARTER_DECOS],
      packs:   [...STARTER_PACKS],
    },
    /** ids the player has never opened in the collection book */
    fresh: [],

    upgrades: {},

    /* hired employees + today's applicant pool */
    staff: { roster: [], applicants: [], applicantsDate: '', seededFromUpgrade: 0, seedDone: false },

    /* wages, overdraft and everything the bank did about it */
    finance: { lastPayday: '', redDays: 0, interest: 0, paidTotal: 0, log: [] },

    /* delivery service: the board of jobs and the parcels on the road */
    delivery: { board: [], boardDate: '', active: [], done: 0, earned: 0, nextJobAt: 0 },

    /* Sweetgram: the feed, the followers, the brand deals */
    social: { followers: 0, posts: [], likes: 0, viral: 0, deals: [], dealDate: '', unseen: 0, wishes: [] },

    /* Candy Pass: this season's points and what has been collected */
    season: { idx: null, points: 0, owned: false, claimed: [], passClaimed: [] },

    /* the weekly candy contest */
    contest: { idx: null, entry: null, history: [], won: 0 },

    /* the shop pet */
    pet: null,

    /* what she has hung, stood and placed around the shop */
    decor: { owned: [], placed: {} },

    /* today's three-candy menu */
    menu: { date: '', picks: [] },

    /* customers who come back, and the candies she bottled */
    regulars: [],
    recipes: { list: [], cased: [], lastSweep: Date.now(), earned: 0 },

    counters: {
      orders:0, fiveStars:0, perfect:0, coinsEarned:0, decosPlaced:0,
      wrapped:0, tips:0, photos:0, unlocked:0, totalStars:0, served:0,
    },
    /** counters that reset every day (daily missions read these) */
    dailyCounters: {},
    dailyCountersDate: todayKey(),

    streak: 0,
    bestStreak: 0,
    satisfaction: 60,

    missions: { daily: [], date: '', claimed: [], careerClaimed: [] },
    daily: { lastClaim: '', streak: 0, cycleStart: 1 },

    /* levels whose pick-2 reward grid has not been opened yet */
    levelRewards: { pending: [] },

    records: { endless:0, speed:0, challenge:0, shopLevel:1 },
    photos: [],

    settings: { music:true, sfx:true, haptics:true, volume:.65, hints:true },

    tutorialDone: false,
    contentRev: 0,
  };
}

export let S = freshState();

/** Content granted during this boot, for the "what's new" notice. */
let bootGains = [];
export const getBootUnlocks = () => bootGains;

/* ── load / save ─────────────────────────────────────── */
export function load(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw){
      const parsed = JSON.parse(raw);
      S = migrate(parsed);
    }
  } catch (e){
    console.warn('Save was unreadable, starting fresh.', e);
    S = freshState();
  }
  rolloverDaily();
  // Only announce new content to players who were already playing —
  // a first-time save has nothing to catch up on.
  const returning = (S.contentRev || 0) < CONTENT_REV && (S.counters?.orders || 0) > 0;
  bootGains = syncUnlocks();
  S.contentRev = CONTENT_REV;
  if (!returning) bootGains = [];
  return S;
}

function migrate(old){
  const base = freshState();
  const merged = { ...base, ...old, v: SAVE_VERSION };
  // deep-merge the nested objects so new fields appear for old saves
  for (const key of ['owned','counters','missions','daily','records','settings','staff',
                     'levelRewards','finance','delivery','social','season','contest','recipes','menu','decor']){
    merged[key] = { ...base[key], ...(old[key] || {}) };
  }
  merged.social.posts = [...(old.social?.posts || [])];
  merged.social.deals = [...(old.social?.deals || [])];
  merged.social.wishes = [...(old.social?.wishes || [])];
  merged.season.claimed = [...(old.season?.claimed || [])];
  merged.season.passClaimed = [...(old.season?.passClaimed || [])];
  merged.contest.history = [...(old.contest?.history || [])];
  merged.regulars = [...(old.regulars || [])];
  merged.decor.owned = [...(old.decor?.owned || [])];
  merged.decor.placed = { ...(old.decor?.placed || {}) };
  merged.recipes.list = [...(old.recipes?.list || [])];
  merged.recipes.cased = [...(old.recipes?.cased || [])];
  merged.staff.roster = [...(old.staff?.roster || [])];
  merged.staff.applicants = [...(old.staff?.applicants || [])];
  merged.levelRewards.pending = [...(old.levelRewards?.pending || [])];
  merged.finance.log = [...(old.finance?.log || [])];
  merged.delivery.board = [...(old.delivery?.board || [])];
  merged.delivery.active = [...(old.delivery?.active || [])];
  // Everyone hired before roles existed keeps doing exactly what they did.
  for (const e of merged.staff.roster) if (!e.role) e.role = 'shop';
  merged.owned = {
    candies: [...new Set([...base.owned.candies, ...(old.owned?.candies || [])])],
    decos:   [...new Set([...base.owned.decos,   ...(old.owned?.decos   || [])])],
    packs:   [...new Set([...base.owned.packs,   ...(old.owned?.packs   || [])])],
  };
  merged.upgrades = { ...(old.upgrades || {}) };
  return merged;
}

let saveTimer = null;
let saveLocked = false;

/**
 * Stop this session from writing to storage ever again.
 *
 * Call this immediately before importing a save and reloading: the
 * page-hide handler fires during the reload and would otherwise write
 * the old in-memory state straight back over the imported one.
 */
export function lockSave(){
  saveLocked = true;
  if (saveTimer){ clearTimeout(saveTimer); saveTimer = null; }
}
export const isSaveLocked = () => saveLocked;

export function save(immediate = false){
  if (saveLocked) return;
  if (saveTimer) clearTimeout(saveTimer);
  const write = () => {
    S.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }
    catch (e){ console.warn('Could not save', e); }
    saveTimer = null;
  };
  if (immediate) write(); else saveTimer = setTimeout(write, 400);
}

export function hardReset(){
  localStorage.removeItem(SAVE_KEY);
  S = freshState();
  syncUnlocks();
  save(true);
  emit('state');
}

/* ── daily rollover ──────────────────────────────────── */
export function rolloverDaily(){
  const t = todayKey();
  if (S.dailyCountersDate !== t){
    S.dailyCountersDate = t;
    S.dailyCounters = {};
  }
  return t;
}

/* ── levelling ───────────────────────────────────────── */
export const xpForLevel = lv => Math.floor(80 * Math.pow(lv, 1.45));

export function addXp(amount){
  S.xp += amount;
  let leveled = [];
  while (S.xp >= xpForLevel(S.level)){
    S.xp -= xpForLevel(S.level);
    S.level++;
    leveled.push(S.level);
  }
  if (leveled.length){
    S.records.shopLevel = Math.max(S.records.shopLevel, S.level);
    const gained = syncUnlocks();
    // every level earned queues one pick-2 reward grid
    if (!S.levelRewards) S.levelRewards = { pending: [] };
    for (const lv of leveled) S.levelRewards.pending.push(lv);
    emit('levelup', { level: S.level, unlocked: gained, levels: leveled });
  }
  emit('state');
  save();
  return leveled;
}

/**
 * Auto-grant anything gated purely on level (candy, colours, flavours).
 * Decorations and packaging still have to be bought.
 * @returns list of {kind,id,name} newly granted
 */
export function syncUnlocks(){
  const gained = [];
  for (const c of CANDIES){
    if (c.unlock <= S.level && !S.owned.candies.includes(c.id)){
      S.owned.candies.push(c.id);
      markFresh(c.id);
      gained.push({ kind:'candy', id:c.id, name:c.name, emoji:c.emoji });
    }
  }
  // Persist immediately. Leaving the grant in memory meant a player who
  // closed the tab without doing anything else had to earn it again next
  // launch, and any later write could race it away.
  if (gained.length) save(true);
  return gained;
}

export const colorUnlocked = id => (COLOR_UNLOCK[id] ?? 99) <= S.level;
export const flavorUnlocked = id => (FLAVORS.find(f => f.id === id)?.unlock ?? 99) <= S.level;

/* ── currency ────────────────────────────────────────── */

/**
 * @param opt.allowDebt  wages may push the till below zero — that is the
 *                       overdraft the bank then charges you for. Nothing
 *                       else in the game is allowed to.
 *
 * The floor is `min(coins, 0)`, not 0: a shop that is already in the red
 * must keep its debt when it earns, instead of quietly having it wiped.
 */
export function addCoins(n, { allowDebt = false } = {}){
  const next = S.coins + n;
  S.coins = allowDebt ? next : Math.max(Math.min(S.coins, 0), next);
  if (n > 0){
    S.counters.coinsEarned += n;
    bumpDaily('coinsEarned', n);
  }
  emit('coins', n); emit('state'); save();
}

/** True while the shop owes the bank money. */
export const inDebt = () => S.coins < 0;
export const debtAmount = () => Math.max(0, -S.coins);
export function addGems(n){
  S.gems = Math.max(0, S.gems + n);
  emit('gems', n); emit('state'); save();
}
export const canAfford = (cost, currency = 'coin') =>
  currency === 'gem' ? S.gems >= cost : S.coins >= cost;

export function spend(cost, currency = 'coin'){
  if (!canAfford(cost, currency)) return false;
  if (currency === 'gem') S.gems -= cost; else S.coins -= cost;
  emit('state'); save();
  return true;
}

/* ── counters ────────────────────────────────────────── */
export function bump(stat, n = 1){
  S.counters[stat] = (S.counters[stat] || 0) + n;
  bumpDaily(stat, n);
  emit('counter', { stat, n });
}
export function bumpDaily(stat, n = 1){
  rolloverDaily();
  S.dailyCounters[stat] = (S.dailyCounters[stat] || 0) + n;
}

/** Value a mission should read — some stats are lifetime, some derived. */
export function statValue(stat, scope = 'daily'){
  switch (stat){
    case 'level':      return S.level;
    case 'decoOwned':  return S.owned.decos.length;
    case 'candyOwned': return S.owned.candies.length;
    case 'locOwned':   return S.locations.length;
    case 'bestStreak': return scope === 'daily' ? (S.dailyCounters.bestStreak || 0) : S.bestStreak;
    default:
      return scope === 'daily' ? (S.dailyCounters[stat] || 0) : (S.counters[stat] || 0);
  }
}

/* ── ownership ───────────────────────────────────────── */
export const ownsDeco = id => S.owned.decos.includes(id);
export const ownsPack = id => S.owned.packs.includes(id);
export const ownsCandy = id => S.owned.candies.includes(id);

export function grantDeco(id){
  if (!DECORATIONS.some(d => d.id === id) || ownsDeco(id)) return false;
  S.owned.decos.push(id);
  markFresh(id);
  bump('unlocked');
  emit('state'); save();
  return true;
}
export function grantPack(id){
  if (!PACKAGING.some(p => p.id === id) || ownsPack(id)) return false;
  S.owned.packs.push(id);
  markFresh(id);
  bump('unlocked');
  emit('state'); save();
  return true;
}

export function markFresh(id){ if (!S.fresh.includes(id)) S.fresh.push(id); }
export function clearFresh(id){ S.fresh = S.fresh.filter(x => x !== id); save(); }
export const isFresh = id => S.fresh.includes(id);

/* ── upgrades ────────────────────────────────────────── */
export const upgLevel = id => S.upgrades[id] || 0;
export function setUpgLevel(id, lv){ S.upgrades[id] = lv; emit('state'); save(); }
/**
 * Upgrade bonuses with the hired staff layered on top.
 * Staff is purely additive, so nobody who already owned the Employee
 * upgrade can end up worse off than before the roster existed.
 */
export const bonuses = () => {
  const base = computeBonuses(S.upgrades);
  const st = staffBonuses(S.staff?.roster || []);
  // fame is worth something at the till: people tip a shop they follow
  const fame = fameTier(S.social?.followers || 0);
  // …and so is a happy animal by the counter
  const petB = petBonus(petMood(S.pet));
  return {
    ...base,
    idleCoins:    base.idleCoins + st.idleCoins,
    tipMult:      base.tipMult * st.tipMult * fame.tipMult * petB.tipMult,
    patienceMult: base.patienceMult * st.patienceMult,
    queue:        base.queue + fame.queue,
    satisfaction: base.satisfaction + petB.satisfaction + decorMood(S.decor?.placed),
  };
};

/* ── selling the shop back ───────────────────────────────
   You get part of your money back. This is how a shop in trouble digs
   itself out — and how the bank digs for you if you let it slide. */

export const RESALE = .6;

/** Sell one level of an upgrade back. @returns coins refunded */
export function sellUpgradeLevel(id){
  const lv = upgLevel(id);
  if (lv <= 0) return 0;
  const paid = UPG_BY_ID[id]?.cost?.[lv] ?? 0;
  const back = Math.round(paid * RESALE);
  S.upgrades[id] = lv - 1;
  addCoins(back, { allowDebt: true });
  emit('state'); save();
  return back;
}

/** The upgrade level worth the most right now — what the bank takes first. */
export function priciestUpgrade(){
  let best = null, bestVal = 0;
  for (const u of UPGRADES){
    const lv = upgLevel(u.id);
    if (lv <= 0) continue;
    const val = u.cost?.[lv] ?? 0;
    if (val > bestVal){ bestVal = val; best = u.id; }
  }
  return best;
}

/**
 * Sell a location back and move home. The village can never be sold —
 * there has to be somewhere left to make candy.
 */
export function sellLocation(id){
  if (id === 'village' || !S.locations.includes(id)) return 0;
  const loc = LOC_BY_ID[id];
  const back = Math.round((loc?.cost || 0) * RESALE);
  S.locations = S.locations.filter(l => l !== id);
  if (S.location === id) S.location = fallbackLocation();
  addCoins(back, { allowDebt: true });
  emit('state'); save();
  return back;
}

/** The best location still on the books after a forced sale. */
export function fallbackLocation(){
  const owned = S.locations.map(l => LOC_BY_ID[l]).filter(Boolean);
  owned.sort((a, b) => b.payMult - a.payMult);
  return owned[0]?.id || 'village';
}

/** The grandest location you own, village aside — the bank's last resort. */
export function priciestLocation(){
  const owned = S.locations.map(l => LOC_BY_ID[l]).filter(l => l && l.id !== 'village');
  owned.sort((a, b) => b.cost - a.cost);
  return owned[0]?.id || null;
}

/* ── staff roster ────────────────────────────────────── */

/** Level at which the delivery service opens up. */
export const DELIVERY_LEVEL = 3;

/**
 * Counter slots come from the Employee upgrade level.
 *
 * The later levels are worth more than one pair of hands: with wages to
 * pay, a bigger team is a real decision rather than a free upgrade, so
 * the ceiling can be generous. Anybody who already maxed the upgrade
 * simply finds extra slots waiting.
 */
const STAFF_SLOTS = [0, 1, 2, 4, 6];
export const staffSlots = () => STAFF_SLOTS[clamp(upgLevel('staff'), 0, 4)] ?? 0;

/**
 * Couriers ride their own slots, so hiring one never costs you the
 * shop assistant you already had.
 */
export const courierSlots = () =>
  S.level >= DELIVERY_LEVEL ? 1 + Math.floor(upgLevel('staff') / 2) : 0;

export const roster = () => S.staff?.roster || [];
export const shopStaff = () => roster().filter(e => roleOf(e) !== 'courier');
export const courierStaff = () => roster().filter(e => roleOf(e) === 'courier');
export const slotsFor = role => (role === 'courier' ? courierSlots() : staffSlots());
export const usedSlots = role =>
  (role === 'courier' ? courierStaff() : shopStaff()).length;

/** Deliveries need somebody to ride them. */
export const canDeliver = () => S.level >= DELIVERY_LEVEL && courierStaff().length > 0;

/**
 * Players who bought the Employee upgrade before the roster existed
 * get a real employee for every slot they already paid for — their
 * old idle income is preserved and they can now fire/replace them.
 */
export function seedLegacyStaff(){
  if (!S.staff) S.staff = { roster: [], applicants: [], applicantsDate: '', seededFromUpgrade: 0 };
  // Runs exactly once per save. Slots bought *after* this point stay empty —
  // those you fill yourself from the applicant list.
  if (S.staff.seedDone) return [];

  const slots = staffSlots();
  const added = [];
  for (let i = S.staff.roster.length; i < slots; i++){
    const emp = makeEmployee(i >= 2 ? 'expert' : 'skilled', { noBadTraits: true });
    emp.hiredAt = Date.now();
    emp.legacy = true;
    S.staff.roster.push(emp);
    added.push(emp);
  }
  S.staff.seedDone = true;
  S.staff.seededFromUpgrade = slots;
  save();
  return added;
}

export function hireEmployee(emp){
  const role = roleOf(emp);
  if (usedSlots(role) >= slotsFor(role)) return false;
  emp.hiredAt = Date.now();
  emp.role = role;
  S.staff.roster.push(emp);
  S.staff.applicants = S.staff.applicants.filter(a => a.id !== emp.id);
  emit('state'); save();
  return true;
}

/** What the team costs you every shop day. */
export const dailyWages = () => payrollOf(roster());
export { wageOf };

export function fireEmployee(id){
  const before = roster().length;
  S.staff.roster = roster().filter(e => e.id !== id);
  if (S.staff.roster.length !== before){ emit('state'); save(); return true; }
  return false;
}

/* ── shop satisfaction (0-100) ───────────────────────── */
export function nudgeSatisfaction(delta){
  S.satisfaction = clamp(S.satisfaction + delta, 0, 100);
  emit('state');
}
export function shopSatisfaction(){
  return clamp(Math.round(S.satisfaction + bonuses().satisfaction), 0, 100);
}

/* ── streaks ─────────────────────────────────────────── */
export function pushStreak(perfect){
  if (perfect){
    S.streak++;
    if (S.streak > S.bestStreak) S.bestStreak = S.streak;
    const d = S.dailyCounters.bestStreak || 0;
    if (S.streak > d) S.dailyCounters.bestStreak = S.streak;
  } else {
    S.streak = 0;
  }
  emit('state');
  return S.streak;
}

/* ── photos ──────────────────────────────────────────── */
export function savePhoto(design, meta = {}){
  const photo = { id: uid(), ts: Date.now(), design: JSON.parse(JSON.stringify(design)), ...meta };
  S.photos.unshift(photo);
  if (S.photos.length > 40) S.photos.length = 40;
  bump('photos');
  emit('state'); save();
  return photo;
}
export function deletePhoto(id){
  S.photos = S.photos.filter(p => p.id !== id);
  emit('state'); save();
}

/* ── idle earnings from the Employee upgrade ─────────── */
export function collectIdle(){
  const rate = bonuses().idleCoins;
  if (!rate) return 0;
  const hours = clamp((Date.now() - (S.lastSeen || Date.now())) / 3600000, 0, 8);
  const amount = Math.floor(rate * hours);
  if (amount > 0) addCoins(amount);
  return amount;
}

/* ── daily login streak ──────────────────────────────── */
export function dailyStatus(){
  const t = todayKey();
  const last = S.daily.lastClaim;
  if (!last) return { available:true, day:1, streak:0 };
  const gap = daysBetween(last, t);
  if (gap === 0) return { available:false, day:S.daily.streak, streak:S.daily.streak };
  const streak = gap === 1 ? S.daily.streak : 0;
  return { available:true, day:(streak % 7) + 1, streak };
}
export function claimDaily(){
  const st = dailyStatus();
  if (!st.available) return null;
  S.daily.streak = st.streak + 1;
  S.daily.lastClaim = todayKey();
  emit('state'); save();
  return { day: st.day, streak: S.daily.streak };
}
