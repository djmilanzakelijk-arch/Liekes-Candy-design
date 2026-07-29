/* ============================================================
   Candy contests — entering, judging, and paying out.

   One contest a week. You enter a single candy; the field is the same
   rival shops for everybody that week. When the week turns over the
   result is settled on the next launch and the prize is handed over —
   there is nothing to miss.
   ============================================================ */

import { S, save, emit, addCoins, addGems, addXp, grantDeco, bump } from '../core/state.js';
import {
  contestIndex, contestLeft, themeFor, judge, rivalField, prizeFor,
} from '../data/contests.js';

export const store = () => {
  if (!S.contest) S.contest = { idx: null, entry: null, history: [], won: 0 };
  return S.contest;
};

export const currentIndex = () => contestIndex();
export const theme = () => themeFor(currentIndex());
export const timeLeft = () => contestLeft();
export const entry = () => store().entry;
export const hasEntered = () => !!store().entry;
export const history = () => store().history || [];

/** The field for this week, with your entry slotted in if you have one. */
export function standings(){
  const s = store();
  const field = rivalField(currentIndex(), S.level).map(r => ({ ...r, rival: true }));
  if (s.entry) field.push({ name: S.shopName, score: s.entry.score.total, you: true });
  field.sort((a, b) => b.score - a.score || (a.you ? -1 : 1));
  return field;
}

/** Where you would finish right now, or null if you have not entered. */
export function myPlace(){
  if (!hasEntered()) return null;
  return standings().findIndex(r => r.you) + 1;
}

/**
 * Enter (or replace) this week's candy.
 * Re-entering is allowed all week — it is a contest, not a trap.
 */
export function enter(design){
  const s = store();
  s.idx = currentIndex();
  const score = judge(design, theme());
  s.entry = {
    design: JSON.parse(JSON.stringify(design)),
    score,
    ts: Date.now(),
  };
  bump('contestEntries');
  save(); emit('state');
  return s.entry;
}

export function withdraw(){
  const s = store();
  s.entry = null;
  save(); emit('state');
}

/* ══════════════ settling the week ══════════════ */

/**
 * Called on every launch. If the contest week changed and there was an
 * entry, work out where it placed, pay the prize, and file the result.
 *
 * @returns null, or { idx, place, field, prize, entry, theme }
 */
export function settleContest(){
  const s = store();
  const now = currentIndex();

  if (s.idx == null){ s.idx = now; save(); return null; }
  if (s.idx === now) return null;

  const was = s.idx;
  const oldEntry = s.entry;

  s.idx = now;
  s.entry = null;

  if (!oldEntry){ save(); return null; }

  const field = rivalField(was, S.level).map(r => ({ ...r, rival: true }));
  field.push({ name: S.shopName, score: oldEntry.score.total, you: true });
  field.sort((a, b) => b.score - a.score || (a.you ? -1 : 1));
  const place = field.findIndex(r => r.you) + 1;

  const prize = prizeFor(place, S.level);
  addCoins(prize.coins);
  if (prize.gems) addGems(prize.gems);
  addXp(60 + Math.max(0, 12 - place) * 8);
  if (prize.deco) grantDeco(prize.deco);
  if (place === 1) s.won = (s.won || 0) + 1;
  bump('contestPlaces');

  const result = {
    idx: was, place, prize, theme: themeFor(was),
    score: oldEntry.score, design: oldEntry.design,
    field: field.slice(0, 8),
  };
  s.history = [{ idx: was, place, score: oldEntry.score.total }, ...(s.history || [])].slice(0, 12);
  save(); emit('state');
  return result;
}
