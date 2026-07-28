/* ============================================================
   Persistent game state + tiny event bus.
   Everything the player owns, earned or configured lives here.
   ============================================================ */

import { todayKey, daysBetween, uid, clamp } from './utils.js';
import { STARTER_CANDIES, CANDIES } from '../data/candies.js';
import { STARTER_DECOS, STARTER_PACKS, DECORATIONS, PACKAGING } from '../data/decorations.js';
import { COLOR_UNLOCK, FLAVORS } from '../data/palette.js';
import { computeBonuses } from '../data/upgrades.js';
import { staffBonuses, makeEmployee } from '../data/staff.js';
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
  for (const key of ['owned','counters','missions','daily','records','settings','staff','levelRewards']){
    merged[key] = { ...base[key], ...(old[key] || {}) };
  }
  merged.staff.roster = [...(old.staff?.roster || [])];
  merged.staff.applicants = [...(old.staff?.applicants || [])];
  merged.levelRewards.pending = [...(old.levelRewards?.pending || [])];
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
export function addCoins(n){
  S.coins = Math.max(0, S.coins + n);
  if (n > 0){
    S.counters.coinsEarned += n;
    bumpDaily('coinsEarned', n);
  }
  emit('coins', n); emit('state'); save();
}
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
  return {
    ...base,
    idleCoins:    base.idleCoins + st.idleCoins,
    tipMult:      base.tipMult * st.tipMult,
    patienceMult: base.patienceMult * st.patienceMult,
  };
};

/* ── staff roster ────────────────────────────────────── */

/** Slots come from the Employee upgrade level. */
export const staffSlots = () => upgLevel('staff');
export const roster = () => S.staff?.roster || [];

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
  if (roster().length >= staffSlots()) return false;
  emp.hiredAt = Date.now();
  S.staff.roster.push(emp);
  S.staff.applicants = S.staff.applicants.filter(a => a.id !== emp.id);
  emit('state'); save();
  return true;
}

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
