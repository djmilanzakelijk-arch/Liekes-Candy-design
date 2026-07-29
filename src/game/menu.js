/* ============================================================
   Today's menu.

   Pick three candies each morning. Anything on the board sells for
   noticeably more when somebody happens to order it.

   The menu deliberately does NOT steer what customers ask for — they
   still walk in wanting anything she owns. It is a bet on the day, not
   a filter on it, and skipping it costs nothing.
   ============================================================ */

import { S, save, emit } from '../core/state.js';
import { CANDIES } from '../data/candies.js';
import { todayKey, pickN } from '../core/utils.js';

export const MENU_SIZE = 3;
/** What a candy on today's menu is worth when one is ordered. */
export const MENU_BONUS = 1.4;

export const menu = () => {
  if (!S.menu) S.menu = { date: '', picks: [] };
  return S.menu;
};

/** Today's picks, or an empty list if none were set today. */
export function picks(){
  const m = menu();
  return m.date === todayKey() ? (m.picks || []) : [];
}

export const isSet = () => picks().length > 0;
export const onMenu = id => picks().includes(id);

/** Only candies she actually owns can go on the board. */
export const available = () => CANDIES.filter(c => S.owned.candies.includes(c.id));

export function setMenu(ids){
  const owned = new Set(S.owned.candies);
  const m = menu();
  m.picks = ids.filter(id => owned.has(id)).slice(0, MENU_SIZE);
  m.date = todayKey();
  save(); emit('state');
  return m.picks;
}

/** A sensible board when she cannot be bothered to choose. */
export function suggestMenu(){
  const list = available();
  return pickN(list, Math.min(MENU_SIZE, list.length)).map(c => c.id);
}
