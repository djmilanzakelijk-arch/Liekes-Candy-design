/* ============================================================
   Signature recipes and the display case.

   Save a candy you are proud of as a recipe. You can make it again in
   one tap, and the three you put in the display case sell quietly to
   passers-by while you are away.
   ============================================================ */

import { S, save, emit, addCoins, bump, bonuses } from '../core/state.js';
import { getCandy } from '../data/candies.js';
import { getDeco } from '../data/decorations.js';
import { getLocation } from '../data/upgrades.js';
import { clamp, uid } from '../core/utils.js';

export const MAX_RECIPES = 20;
/** How many can be on show at once. */
export const CASE_SLOTS = 3;
/** The case only pays for so long unattended — come and empty it. */
const MAX_IDLE_HOURS = 10;

export const recipes = () => {
  if (!S.recipes) S.recipes = { list: [], cased: [], lastSweep: Date.now(), earned: 0 };
  if (!S.recipes.list) S.recipes.list = [];
  if (!S.recipes.cased) S.recipes.cased = [];
  return S.recipes;
};

export const list = () => recipes().list;
export const cased = () => recipes().cased.map(id => byId(id)).filter(Boolean);
export const byId = id => list().find(r => r.id === id) || null;
export const isCased = id => recipes().cased.includes(id);
export const caseFull = () => recipes().cased.length >= CASE_SLOTS;

/* ══════════════ what a recipe is worth ══════════════ */

/**
 * Coins per hour on display. Driven by the same things that make a
 * candy good: how much is on it, how rare, tools, packaging — times
 * the location's payout, so a fancy address sells better.
 */
export function hourlyOf(recipe){
  const d = recipe.design;
  const candy = getCandy(d.candy);
  const items = d.items || [];

  let quality = .25;
  quality += clamp(items.length / 8, 0, 1) * .3;
  quality += Object.keys(d.tools || {}).length ? .12 : 0;
  quality += d.pack && d.pack !== 'none' ? .14 : 0;
  quality += clamp((d.strokes || []).length / 3, 0, 1) * .07;
  const rare = items.filter(i => ['epic', 'legendary', 'mythic'].includes(getDeco(i.id)?.rarity)).length;
  quality += clamp(rare / 4, 0, 1) * .2;

  const loc = getLocation(S.location);
  const b = bonuses();
  return Math.round((candy.base || 40) * quality * 2.6 * loc.payMult * b.priceMult);
}

/** Total the display case earns per hour. */
export const caseHourly = () => cased().reduce((n, r) => n + hourlyOf(r), 0);

/* ══════════════ saving and showing ══════════════ */

export function saveRecipe(design, name){
  const r = recipes();
  if (r.list.length >= MAX_RECIPES) return null;
  const recipe = {
    id: uid(),
    name: (name || '').trim().slice(0, 22) || defaultName(design),
    design: JSON.parse(JSON.stringify(design)),
    ts: Date.now(),
    sold: 0,
  };
  r.list.unshift(recipe);
  bump('recipes');
  save(); emit('state');
  return recipe;
}

function defaultName(design){
  const candy = getCandy(design.candy);
  return candy?.name || 'Recipe';
}

export function renameRecipe(id, name){
  const r = byId(id);
  if (!r) return;
  r.name = (name || '').trim().slice(0, 22) || r.name;
  save(); emit('state');
}

export function deleteRecipe(id){
  const r = recipes();
  r.list = r.list.filter(x => x.id !== id);
  r.cased = r.cased.filter(x => x !== id);
  save(); emit('state');
}

/** Put a recipe on show, or take it off again. @returns true if it is now on show */
export function toggleCase(id){
  const r = recipes();
  if (r.cased.includes(id)){
    r.cased = r.cased.filter(x => x !== id);
    save(); emit('state');
    return false;
  }
  if (r.cased.length >= CASE_SLOTS) return false;
  // bank what the case earned so far before the mix changes
  collectCase();
  r.cased.push(id);
  save(); emit('state');
  return true;
}

/* ══════════════ the case selling itself ══════════════ */

/** Hours the case has been running since the last sweep, capped. */
export function pendingHours(){
  const r = recipes();
  return clamp((Date.now() - (r.lastSweep || Date.now())) / 3600000, 0, MAX_IDLE_HOURS);
}

/** Coins waiting in the display case right now. */
export const pendingCoins = () => Math.floor(caseHourly() * pendingHours());

/**
 * Empty the till under the display case.
 * @returns coins collected (0 if there was nothing)
 */
export function collectCase(){
  const r = recipes();
  const amount = pendingCoins();
  r.lastSweep = Date.now();
  if (amount > 0){
    addCoins(amount);
    r.earned = (r.earned || 0) + amount;
    for (const rec of cased()) rec.sold = (rec.sold || 0) + 1;
    bump('caseSales');
  }
  save(); emit('state');
  return amount;
}
