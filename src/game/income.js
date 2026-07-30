/* ============================================================
   Passive income.

   Everything the shop earns while you are not serving anybody: the
   employees keeping the counter warm and the display case selling
   saved recipes. One clock drives both, so the money lands in your
   coins whether the game is open or not.

   While the app is open it ticks in live — you watch the number go up.
   While it is closed the same clock keeps running (capped, see
   OFFLINE_CAP_HOURS) and hands you the total when you come back.
   ============================================================ */

import { S, save, emit, addCoins, bonuses } from '../core/state.js';
import { caseHourly, pendingCoins, collectCase, creditCase } from './recipes.js';

/** The most you can bank in one go from being away. */
export const OFFLINE_CAP_HOURS = 10;

/** Anything shorter than this at boot is just the app restarting. */
const MIN_OFFLINE_MS = 90 * 1000;

const fin = () => (S.finance ||= {});

/**
 * What is earning right now, and how much per hour each.
 * Only sources that actually pay are listed.
 */
export function sources(){
  const list = [
    { id:'staff', emoji:'🧑‍🍳', perHour: Math.round(bonuses().idleCoins || 0) },
    { id:'case',  emoji:'🪟',  perHour: Math.round(caseHourly() || 0) },
  ];
  return list.filter(s => s.perHour > 0);
}

/** Total coins per hour from everything passive. */
export const perHour = () => sources().reduce((n, s) => n + s.perHour, 0);

/**
 * Move the clock forward and bank whatever whole coins came out of it.
 *
 * Fractions are carried in `finance.incomeFrac` rather than rounded
 * away, so a shop earning 14 coins an hour still earns 14 coins an
 * hour instead of nothing at all.
 *
 * @param {number|null} capHours ceiling on the elapsed time, for the
 *        catch-up at boot. null means "however long it has been".
 * @returns {{ coins:number, hours:number, per:Array }}
 */
export function accrue(capHours = null){
  const f = fin();
  const now = Date.now();
  if (!f.incomeAt) f.incomeAt = now;

  let hours = (now - f.incomeAt) / 3600000;
  f.incomeAt = now;
  if (hours <= 0) return { coins: 0, hours: 0, per: [] };
  if (capHours != null) hours = Math.min(hours, capHours);

  const src = sources();
  if (!src.length){
    // nothing earning: drop the carried fraction rather than banking it later
    f.incomeFrac = 0;
    return { coins: 0, hours, per: [] };
  }

  const per = src.map(s => ({ ...s, exact: s.perHour * hours }));
  const total = per.reduce((n, s) => n + s.exact, 0) + (f.incomeFrac || 0);
  const whole = Math.floor(total);
  f.incomeFrac = total - whole;

  if (whole > 0){
    addCoins(whole);                       // this saves and emits for us
    S.counters.idleEarned = (S.counters.idleEarned || 0) + whole;
    // the case keeps its own books, so the recipes screen can say what
    // the shelf has brought in over its lifetime
    creditCase(Math.round(per.find(s => s.id === 'case')?.exact || 0));
  }
  return { coins: whole, hours, per: per.map(s => ({ ...s, coins: Math.round(s.exact) })) };
}

/**
 * The sweep at launch: what the shop earned while the app was shut.
 * Returns null when you were only away a moment, so restarting the app
 * does not throw up a modal about four coins.
 */
export function catchUp(){
  const f = fin();
  const now = Date.now();

  // state.load() seeds incomeAt from the save's own lastSeen. All that is
  // left to do once is empty the display case's old till by hand: it used
  // to be collected with a button and nobody should lose what was already
  // sitting in it when the case went live.
  if (!f.incomeAt) f.incomeAt = now;
  let legacy = 0;
  if (!f.incomeSwept){
    f.incomeSwept = true;
    legacy = pendingCoins() > 0 ? collectCase() : 0;
  }

  const away = now - f.incomeAt;
  const res = accrue(OFFLINE_CAP_HOURS);
  const coins = res.coins + legacy;
  if (away < MIN_OFFLINE_MS || coins <= 0) return null;

  const per = res.per.filter(s => s.coins > 0);
  if (legacy > 0){
    const row = per.find(s => s.id === 'case');
    if (row) row.coins += legacy;
    else per.push({ id:'case', emoji:'🪟', perHour: 0, coins: legacy });
  }

  return {
    coins,
    hours: Math.min(away / 3600000, OFFLINE_CAP_HOURS),
    capped: away / 3600000 > OFFLINE_CAP_HOURS,
    per,
  };
}

/**
 * Seconds until the next whole coin lands, or null when nothing is
 * earning. Used to tell the player their money is on its way even when
 * the rate is slow enough that nothing visible happens for a while.
 */
export function secondsToNextCoin(){
  const rate = perHour();
  if (rate <= 0) return null;
  const left = 1 - (fin().incomeFrac || 0);
  return Math.max(0, Math.ceil(left / rate * 3600));
}

/** Start the clock from now — used when a save arrives from somewhere else. */
export function resetClock(){
  const f = fin();
  f.incomeAt = Date.now();
  f.incomeFrac = 0;
  save(); emit('state');
}
