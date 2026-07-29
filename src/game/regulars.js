/* ============================================================
   Regulars — the customers who come back.

   Serve somebody well and they may become a regular: a named face who
   turns up again, remembers what they like, and slowly builds a
   loyalty level. High loyalty means bigger tips from them and, at the
   milestones, a proper thank-you gift.

   Regulars are additive. They never replace ordinary customers, and
   nothing about them can make an order harder.
   ============================================================ */

import { S, save, emit, addCoins, addGems, grantDeco, bump } from '../core/state.js';
import { DECORATIONS } from '../data/decorations.js';
import { clamp, pick, uid } from '../core/utils.js';

/** How many can be on the books at once. */
export const MAX_REGULARS = 8;
/** Loyalty needed for each level: 1 visit, then 3, 6, 10, 15. */
const LEVEL_STEPS = [0, 1, 3, 6, 10, 15];
export const MAX_LOYALTY = LEVEL_STEPS.length - 1;

export const regulars = () => {
  if (!S.regulars) S.regulars = [];
  return S.regulars;
};

export const loyaltyLevel = r => {
  let lv = 0;
  for (let i = 1; i < LEVEL_STEPS.length; i++) if ((r.visits || 0) >= LEVEL_STEPS[i]) lv = i;
  return lv;
};
export const visitsToNext = r => {
  const lv = loyaltyLevel(r);
  if (lv >= MAX_LOYALTY) return 0;
  return LEVEL_STEPS[lv + 1] - (r.visits || 0);
};
export const loyaltyProgress = r => {
  const lv = loyaltyLevel(r);
  if (lv >= MAX_LOYALTY) return 1;
  const from = LEVEL_STEPS[lv], to = LEVEL_STEPS[lv + 1];
  return clamp(((r.visits || 0) - from) / (to - from), 0, 1);
};

/** Extra tip a regular leaves, on top of everything else. */
export const loyaltyTipMult = r => 1 + loyaltyLevel(r) * .09;

export const findRegular = id => regulars().find(r => r.id === id) || null;

/* ══════════════ becoming one ══════════════ */

/**
 * A customer you served well might come back for good.
 * @returns the new regular, or null
 */
export function maybeAdopt(customer, stars){
  if (!customer || customer.regularId || customer.brandDeal || customer.followerWish) return null;
  if (stars < 4) return null;
  if (regulars().length >= MAX_REGULARS) return null;
  // roughly one in three well-served customers sticks around
  if (Math.random() > (stars === 5 ? .38 : .22)) return null;

  const owned = DECORATIONS.filter(d => S.owned.decos.includes(d.id));
  const reg = {
    id: uid(),
    name: customer.name,
    face: customer.face,
    persId: customer.pers?.id || null,
    loves: {
      candy: customer.order.candy,
      color: customer.order.color,
      deco: owned.length ? pick(owned).id : null,
    },
    visits: 1,
    since: Date.now(),
    lastSeen: Date.now(),
    claimed: [],
  };
  regulars().push(reg);
  bump('regulars');
  save(); emit('state');
  return reg;
}

/**
 * Record a visit from a regular.
 * @returns { level, levelledUp, gift } — gift is null unless a
 *          milestone was reached this visit
 */
export function recordVisit(id, stars){
  const r = findRegular(id);
  if (!r) return null;
  const before = loyaltyLevel(r);
  r.visits = (r.visits || 0) + 1;
  r.lastSeen = Date.now();
  // a bad job costs a little goodwill, but never their loyalty level
  if (stars <= 2) r.visits = Math.max(LEVEL_STEPS[before], r.visits - 1);
  const after = loyaltyLevel(r);

  let gift = null;
  if (after > before && !(r.claimed || []).includes(after)){
    (r.claimed ||= []).push(after);
    gift = giftFor(after);
    addCoins(gift.coins);
    if (gift.gems) addGems(gift.gems);
    if (gift.deco) grantDeco(gift.deco);
  }
  save(); emit('state');
  return { level: after, levelledUp: after > before, gift };
}

/** What a regular brings you when their loyalty goes up. */
function giftFor(level){
  const scale = 1 + S.level * .1;
  const out = { coins: Math.round(300 * level * scale / 10) * 10, gems: 0, deco: null };
  if (level >= 3) out.gems = level - 2;
  if (level === MAX_LOYALTY){
    // the one thing they always wanted you to have
    const locked = DECORATIONS.filter(d =>
      !d.reward && !d.season && !d.event && !S.owned.decos.includes(d.id) && d.unlock <= S.level);
    if (locked.length) out.deco = pick(locked).id;
  }
  return out;
}

/* ══════════════ them turning up ══════════════ */

/** Chance the next customer in the queue is one of your regulars. */
export function regularChance(){
  const n = regulars().length;
  if (!n) return 0;
  return clamp(.12 + n * .045, 0, .42);
}

/** Pick who comes in — the one who has not been seen for longest. */
export function nextRegular(){
  const list = regulars();
  if (!list.length) return null;
  const sorted = [...list].sort((a, b) => (a.lastSeen || 0) - (b.lastSeen || 0));
  // mostly the one who is overdue, sometimes anybody
  return Math.random() < .65 ? sorted[0] : pick(list);
}

export function forget(id){
  S.regulars = regulars().filter(r => r.id !== id);
  save(); emit('state');
}
