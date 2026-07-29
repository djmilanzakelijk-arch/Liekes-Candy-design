/* ============================================================
   Seasons and the Candy Pass.

   A season runs four weeks. Everything you do in the shop earns
   season points, and every 80 points is a tier. Every tier hands out
   something on the free track; the Candy Pass adds a second, richer
   track on top of it — bought once per season with gems.

   Deliberately not a treadmill: thirty tiers over four weeks is about
   six or seven orders a day, the free track always gives something,
   and nothing you earn is ever taken back when the season turns.
   ============================================================ */

import { clamp } from '../core/utils.js';

/** Four weeks, anchored so every player is on the same clock. */
export const SEASON_DAYS = 28;
const EPOCH = Date.UTC(2026, 0, 5);      // a Monday

export const TIERS = 30;
export const POINTS_PER_TIER = 80;
export const PASS_COST_GEMS = 60;

/** Season number since the epoch, 0-based. */
export function seasonIndex(now = Date.now()){
  return Math.max(0, Math.floor((now - EPOCH) / (SEASON_DAYS * 86400000)));
}
export const seasonStart = idx => EPOCH + idx * SEASON_DAYS * 86400000;
export const seasonEnd = idx => seasonStart(idx + 1);

/** Milliseconds left in the current season. */
export function seasonLeft(now = Date.now()){
  return Math.max(0, seasonEnd(seasonIndex(now)) - now);
}

/* ══════════════ themes ══════════════ */

export const THEMES = [
  { id:'blossom',  emoji:'🌸', grad:['#ffd9ec', '#fff2f8'],
    decos:['sp_petal_fall', 'sp_dew_pearls', 'sp_blossom_bow'],
    freeDeco:'blossom', pack:'heartbox', color:'purple' },
  { id:'sunshine', emoji:'☀️', grad:['#ffe9b0', '#fff8e4'],
    decos:['sp_sun_glaze', 'sp_citrus_spr', 'sp_sun_crown'],
    freeDeco:'daisy', pack:'jar', color:'yellow' },
  { id:'harvest',  emoji:'🍂', grad:['#ffd0a8', '#fff0e2'],
    decos:['sp_caramel_lace', 'sp_spice_dust', 'sp_amber_gem'],
    freeDeco:'caramel_pool', pack:'bag', color:'orange' },
  { id:'frost',    emoji:'❄️', grad:['#dbeeff', '#f2f9ff'],
    decos:['sp_frost_lace', 'sp_icicle_drip', 'sp_polar_dust'],
    freeDeco:'nonpareil', pack:'crystal', color:'silver' },
];

export const themeFor = idx => THEMES[idx % THEMES.length];

/* ══════════════ what you earn ══════════════ */

/**
 * Season points per thing you do. Kept modest and spread across the
 * whole game, so nothing has to be farmed to keep up.
 */
export const POINTS = {
  order: 6,          // any completed order
  perStarOver3: 2,   // …plus this per star above three
  perfect: 8,
  delivery: 10,
  brandDeal: 40,
  wish: 20,
  post: 8,
  mission: 25,
};

/* ══════════════ the track ══════════════ */

/**
 * Build a season's thirty tiers.
 *
 * The free track always gives something — mostly coins, with gems at
 * the round numbers and one real decoration you keep forever. The pass
 * adds bigger coin drops, gems, the three season decorations, a
 * packaging style, and a golden ticket that hires a legend outright.
 */
export function buildTrack(idx){
  const theme = themeFor(idx);
  const rows = [];

  for (let tier = 1; tier <= TIERS; tier++){
    const late = tier / TIERS;
    const free = { kind:'coins', n: Math.round((160 + late * 520) / 10) * 10 };
    const pass = { kind:'coins', n: Math.round((340 + late * 1400) / 10) * 10 };

    if (tier % 10 === 0) Object.assign(free, { kind:'gems', n: 3 });
    else if (tier % 5 === 0) Object.assign(free, { kind:'gems', n: 1 });
    if (tier === 15) Object.assign(free, { kind:'deco', id: theme.freeDeco });

    if (tier === 3)  Object.assign(pass, { kind:'deco', id: theme.decos[0] });
    if (tier === 8)  Object.assign(pass, { kind:'pack', id: theme.pack });
    if (tier === 12) Object.assign(pass, { kind:'gems', n: 8 });
    if (tier === 17) Object.assign(pass, { kind:'deco', id: theme.decos[1] });
    if (tier === 22) Object.assign(pass, { kind:'ticket' });
    if (tier === 26) Object.assign(pass, { kind:'gems', n: 12 });
    if (tier === 30) Object.assign(pass, { kind:'deco', id: theme.decos[2] });

    rows.push({ tier, free, pass });
  }
  return rows;
}

/** Tier reached with this many points (0 → not started, TIERS → done). */
export const tierFor = points => clamp(Math.floor(points / POINTS_PER_TIER), 0, TIERS);

/** Progress through the tier you are on, 0..1. */
export const tierProgress = points =>
  tierFor(points) >= TIERS ? 1 : (points % POINTS_PER_TIER) / POINTS_PER_TIER;
