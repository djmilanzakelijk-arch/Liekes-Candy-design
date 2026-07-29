/* ============================================================
   Candy contests — a weekly themed challenge.

   Pure data and rules only. One contest a week on a clock everybody
   shares, judged by the same eye that grades a customer's order plus
   whatever the theme asks for.
   ============================================================ */

import { clamp, rngFrom } from '../core/utils.js';
import { getDeco } from './decorations.js';
import { RARITY_ORDER } from './palette.js';

/** Level at which the weekly contest opens. */
export const CONTEST_LEVEL = 5;

const WEEK = 7 * 86400000;
const EPOCH = Date.UTC(2026, 0, 5);      // the same Monday as the seasons

export const contestIndex = (now = Date.now()) =>
  Math.max(0, Math.floor((now - EPOCH) / WEEK));
export const contestStart = idx => EPOCH + idx * WEEK;
export const contestEnd = idx => contestStart(idx + 1);
export const contestLeft = (now = Date.now()) =>
  Math.max(0, contestEnd(contestIndex(now)) - now);

/* ══════════════ the themes ══════════════
   `check(design)` returns 0..1 for how well the entry follows the brief.
   Rules are always things the player can see and aim for. */

export const THEMES = [
  {
    id:'pinkonly', emoji:'💗',
    check: d => allItemsIn(d, ['pink', 'red', 'white']) * .6
              + (['pink', 'red', 'white'].includes(d.color) ? .4 : 0),
  },
  {
    id:'autumn', emoji:'🍂',
    check: d => allItemsIn(d, ['orange', 'brown', 'yellow', 'gold']) * .6
              + (['orange', 'brown', 'yellow', 'gold'].includes(d.color) ? .4 : 0),
  },
  {
    id:'minimal', emoji:'🕊️',
    // fewer is better: three pieces is perfect, an empty candy is not
    check: d => {
      const n = (d.items || []).length;
      return n === 0 ? .2 : n <= 3 ? 1 : clamp(1 - (n - 3) * .22, 0, 1);
    },
  },
  {
    id:'loaded', emoji:'🎡',
    check: d => clamp((d.items || []).length / 9, 0, 1),
  },
  {
    id:'gift', emoji:'🎁',
    check: d => (d.pack && d.pack !== 'none' ? .6 : 0) + (d.text ? .4 : 0),
  },
  {
    id:'luxury', emoji:'💎',
    check: d => {
      const items = d.items || [];
      if (!items.length) return 0;
      const rare = items.filter(i => RARITY_ORDER.indexOf(getDeco(i.id)?.rarity) >= 3).length;
      return clamp(rare / Math.max(3, items.length * .6), 0, 1);
    },
  },
  {
    id:'toolwork', emoji:'🔧',
    check: d => clamp(Object.keys(d.tools || {}).length / 2, 0, 1) * .7
              + ((d.strokes || []).length ? .3 : 0),
  },
  {
    id:'monochrome', emoji:'🎨',
    // every piece the same colour as the candy itself
    check: d => {
      const items = (d.items || []).filter(i => !getDeco(i.id)?.fixed);
      if (!items.length) return .3;
      return items.filter(i => i.color === d.color).length / items.length;
    },
  },
];

export const themeFor = idx => THEMES[idx % THEMES.length];

function allItemsIn(design, colors){
  const items = (design.items || []).filter(i => !getDeco(i.id)?.fixed);
  if (!items.length) return .3;
  return items.filter(i => colors.includes(i.color)).length / items.length;
}

/* ══════════════ judging ══════════════ */

/**
 * Score an entry out of 100: half how well it follows the brief, half
 * plain craftsmanship, so a beautiful candy that ignores the theme
 * still places — just not first.
 */
export function judge(design, theme){
  const brief = clamp(theme.check(design), 0, 1);

  const items = design.items || [];
  let craft = 0;
  craft += clamp(items.length / 7, 0, 1) * .30;
  craft += clamp((design.strokes || []).length / 3, 0, 1) * .10;
  craft += Object.keys(design.tools || {}).length ? .15 : 0;
  craft += design.pack && design.pack !== 'none' ? .15 : 0;
  craft += design.text ? .05 : 0;
  const rare = items.filter(i => RARITY_ORDER.indexOf(getDeco(i.id)?.rarity) >= 2).length;
  craft += clamp(rare / 4, 0, 1) * .25;

  return {
    brief: Math.round(brief * 100),
    craft: Math.round(clamp(craft, 0, 1) * 100),
    total: Math.round((brief * .5 + clamp(craft, 0, 1) * .5) * 100),
  };
}

/* ══════════════ the field ══════════════ */

export const RIVALS = [
  'Bonbon Bay', 'Sugar & Salt', 'Choco Atelier', 'Miss Marshmallow',
  'Le Petit Praline', 'Gummy Grove', 'Velvet Vanilla', 'Caramel Club',
  'Sprinkle Society', 'Cocoa Cabana', 'Praline Post', 'Sweet Nothing',
];

/**
 * The other shops that entered. Seeded by the contest number, so the
 * field is the same every time you look at it — and stiffer the
 * further along you are.
 */
export function rivalField(idx, level = 1){
  const rng = rngFrom('contest' + idx);
  const strength = clamp(38 + level * 2.1, 38, 88);
  return RIVALS.map(name => ({
    name,
    score: Math.round(clamp(strength + (rng() - .45) * 44, 5, 99)),
  })).sort((a, b) => b.score - a.score);
}

/* ══════════════ prizes ══════════════ */

/** What each finishing position is worth. */
export function prizeFor(place, level = 1){
  const scale = 1 + level * .12;
  if (place === 1) return { coins: Math.round(4000 * scale / 10) * 10, gems: 6, deco:'ct_gold_trophy' };
  if (place <= 3) return { coins: Math.round(2200 * scale / 10) * 10, gems: 3, deco:'ct_silver_trophy' };
  if (place <= 6) return { coins: Math.round(1100 * scale / 10) * 10, gems: 1, deco:'ct_bronze_trophy' };
  return { coins: Math.round(400 * scale / 10) * 10, gems: 0, deco: null };
}
