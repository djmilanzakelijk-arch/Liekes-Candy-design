/* ============================================================
   The Candy Pass — earning, claiming, and turning the season over.

   Two rules this file exists to guarantee:
   1. Nothing you have earned is ever taken away. When a season ends,
      every tier you reached but did not claim is handed to you on the
      next launch before the new season starts.
   2. Buying the pass mid-season is never a punishment: it immediately
      unlocks every pass reward for the tiers you already passed.
   ============================================================ */

import {
  S, save, emit, addCoins, addGems, grantDeco, grantPack, spend, canAfford, bump,
} from '../core/state.js';
import {
  seasonIndex, seasonLeft, themeFor, buildTrack, tierFor, tierProgress,
  TIERS, POINTS_PER_TIER, PASS_COST_GEMS, POINTS,
} from '../data/season.js';
import { makeEmployee } from '../data/staff.js';
import { getDeco, getPack } from '../data/decorations.js';

export const pass = () => {
  if (!S.season){
    S.season = { idx: seasonIndex(), points: 0, owned: false, claimed: [], passClaimed: [] };
  }
  return S.season;
};

export const currentIndex = () => seasonIndex();
export const theme = () => themeFor(currentIndex());
export const track = () => buildTrack(currentIndex());
export const points = () => pass().points || 0;
export const tier = () => tierFor(points());
export const progress = () => tierProgress(points());
export const hasPass = () => !!pass().owned;
export const timeLeft = () => seasonLeft();

const claimedSet = () => new Set(pass().claimed || []);
const passClaimedSet = () => new Set(pass().passClaimed || []);

export const isClaimed = (tier, premium) =>
  (premium ? passClaimedSet() : claimedSet()).has(tier);

/** Tiers reached but not yet collected, on whichever tracks are open. */
export function pendingCount(){
  const t = tier();
  let n = 0;
  for (let i = 1; i <= t; i++){
    if (!isClaimed(i, false)) n++;
    if (hasPass() && !isClaimed(i, true)) n++;
  }
  return n;
}

/* ══════════════ earning ══════════════ */

/**
 * Add season points.
 * @returns the tiers newly crossed, so the UI can celebrate
 */
export function addPoints(n){
  if (!n || n <= 0) return [];
  const p = pass();
  const before = tierFor(p.points || 0);
  p.points = (p.points || 0) + n;
  const after = tierFor(p.points);

  const crossed = [];
  for (let i = before + 1; i <= after; i++) crossed.push(i);
  if (crossed.length) emit('seasontier', { tiers: crossed });
  bump('seasonPoints', n);
  emit('state');
  save();
  return crossed;
}

/** Points for a completed order, from its grade. */
export function scoreOrder(stars, perfect){
  return POINTS.order
       + Math.max(0, stars - 3) * POINTS.perStarOver3
       + (perfect ? POINTS.perfect : 0);
}

/* ══════════════ claiming ══════════════ */

/**
 * Collect one reward.
 * @returns the reward that was handed over, or null
 */
export function claim(tierNo, premium = false, rows = track()){
  const p = pass();
  if (tierNo > tier()) return null;
  if (premium && !hasPass()) return null;
  if (isClaimed(tierNo, premium)) return null;

  const row = rows.find(r => r.tier === tierNo);
  if (!row) return null;
  const reward = premium ? row.pass : row.free;

  grant(reward);
  (premium ? (p.passClaimed ||= []) : (p.claimed ||= [])).push(tierNo);
  save(); emit('state');
  return reward;
}

/**
 * Collect everything that is waiting.
 * @param rows  which season's track — the rollover pays out the season
 *              that just ended, not the one starting.
 */
export function claimAll(rows = track()){
  const out = [];
  const t = tier();
  for (let i = 1; i <= t; i++){
    const a = claim(i, false, rows); if (a) out.push(a);
    const b = claim(i, true, rows);  if (b) out.push(b);
  }
  return out;
}

function grant(reward){
  if (!reward) return;
  switch (reward.kind){
    case 'coins': addCoins(reward.n); break;
    case 'gems':  addGems(reward.n); break;
    case 'deco':  grantDeco(reward.id); break;
    case 'pack':  grantPack(reward.id); break;
    case 'ticket': {
      // a golden ticket: a legend joins on the spot, no hiring fee
      const emp = makeEmployee('legend', { noBadTraits: true });
      emp.hiredAt = Date.now();
      emp.morale = 90;
      emp.ticket = true;
      S.staff.roster.push(emp);
      break;
    }
  }
}

/** Human-readable label for a reward, for the UI. */
export function rewardLabel(reward, t, tName){
  switch (reward?.kind){
    case 'coins':  return { icon:'🪙', text: String(reward.n) };
    case 'gems':   return { icon:'💎', text: String(reward.n) };
    case 'deco':   return { icon:'✨', text: tName('deco', reward.id, getDeco(reward.id)?.name ?? reward.id) };
    case 'pack':   return { icon:'🎁', text: tName('pack', reward.id, getPack(reward.id)?.name ?? reward.id) };
    case 'ticket': return { icon:'🎫', text: t('pass.ticket') };
    default:       return { icon:'❔', text:'' };
  }
}

/* ══════════════ buying ══════════════ */

/**
 * Buy the pass for this season. Everything on the pass track for tiers
 * you already reached becomes claimable straight away.
 */
export function buyPass(){
  const p = pass();
  if (p.owned) return false;
  if (!canAfford(PASS_COST_GEMS, 'gem')) return false;
  if (!spend(PASS_COST_GEMS, 'gem')) return false;
  p.owned = true;
  bump('passes');
  save(); emit('state');
  return true;
}

/* ══════════════ turning the season over ══════════════ */

/**
 * Called on every launch. If the season changed, hand over everything
 * that was earned but never collected, then start the new one clean.
 *
 * @returns null, or { from, to, rewards } describing what was posted on
 */
export function rolloverSeason(){
  const p = pass();
  const now = seasonIndex();
  if (p.idx === now) return null;

  // First run after this feature shipped: just adopt the current season.
  if (p.idx == null){ p.idx = now; save(); return null; }

  // pay out against the track of the season that just ended
  const rewards = claimAll(buildTrack(p.idx));
  const from = p.idx;

  p.idx = now;
  p.points = 0;
  p.owned = false;
  p.claimed = [];
  p.passClaimed = [];
  save(); emit('state');

  return { from, to: now, rewards };
}
