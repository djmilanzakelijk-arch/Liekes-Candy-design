/* ============================================================
   The shop pet.

   Somebody to look after between orders. Feeding and playing keep the
   two little meters up; a well-kept pet lifts the shop's mood and the
   tips, and turns up a coin now and then.

   It cannot starve and it cannot leave. The meters bottom out at zero
   and the only cost of neglect is losing the bonus.
   ============================================================ */

import { S, save, emit, addCoins, spend, canAfford, bump } from '../core/state.js';
import {
  PETS, PET_BY_ID, PET_LEVEL, FED_PER_HOUR, HAPPY_PER_HOUR, MAX_DECAY_HOURS,
  FEED_COST, FEED_GAIN, PLAY_GAIN, PLAY_COOLDOWN_MS, metersNow, moodOf, moodTone,
  bonusFor,
} from '../data/pet.js';
import { clamp, pick, randI } from '../core/utils.js';

export { PET_LEVEL, FEED_COST, PLAY_COOLDOWN_MS, moodTone };

export const pet = () => S.pet || null;
export const hasPet = () => !!S.pet;
export const unlocked = () => S.level >= PET_LEVEL;

/* ══════════════ adopting ══════════════ */

export const adoptable = () => PETS;

export function adopt(kind, name){
  const def = PET_BY_ID[kind];
  if (!def || hasPet()) return null;
  if (!canAfford(def.cost)) return null;
  if (!spend(def.cost)) return null;

  S.pet = {
    kind,
    name: (name || '').trim().slice(0, 16) || defaultName(kind),
    fed: 80,
    happy: 80,
    since: Date.now(),
    lastTick: Date.now(),
    lastPlay: 0,
    meals: 0,
    found: 0,
  };
  bump('pets');
  save(); emit('state');
  return S.pet;
}

const NAMES = {
  cat:    ['Mimi', 'Pluis', 'Muis', 'Saffie', 'Koekje'],
  dog:    ['Bo', 'Wafel', 'Pepper', 'Bram', 'Fudge'],
  bunny:  ['Nootje', 'Wolkje', 'Pom', 'Snoes', 'Vlok'],
  parrot: ['Kiwi', 'Mango', 'Piep', 'Coco', 'Fien'],
};
const defaultName = kind => pick(NAMES[kind] || NAMES.cat);

export function rename(name){
  if (!hasPet()) return;
  S.pet.name = (name || '').trim().slice(0, 16) || S.pet.name;
  save(); emit('state');
}

/* ══════════════ the meters ══════════════ */

/**
 * Bring the meters up to date. Safe to call as often as you like.
 * @returns { dropped } how much was lost since last time
 */
export function tickPet(){
  const p = pet();
  if (!p) return { dropped: 0 };
  const before = p.fed ?? 0;
  const m = metersNow(p);
  p.fed = m.fed;
  p.happy = m.happy;
  p.lastTick = Date.now();
  save();
  return { dropped: Math.round(before - m.fed) };
}

/** 0..1 — how well looked after they are. */
export const mood = () => moodOf(pet());

export function feed(){
  const p = pet();
  if (!p) return null;
  if (!canAfford(FEED_COST)) return null;
  if (!spend(FEED_COST)) return null;
  tickPet();
  p.fed = clamp(p.fed + FEED_GAIN, 0, 100);
  p.happy = clamp(p.happy + 6, 0, 100);
  p.meals = (p.meals || 0) + 1;
  bump('petMeals');
  save(); emit('state');
  return p;
}

export const canPlay = () => {
  const p = pet();
  return !!p && Date.now() - (p.lastPlay || 0) >= PLAY_COOLDOWN_MS;
};
export const playReadyIn = () => {
  const p = pet();
  if (!p) return 0;
  return Math.max(0, PLAY_COOLDOWN_MS - (Date.now() - (p.lastPlay || 0)));
};

/**
 * Play with them. Sometimes they dig up a coin while they are at it.
 * @returns { found } coins they turned up, if any
 */
export function play(){
  const p = pet();
  if (!p || !canPlay()) return null;
  tickPet();
  p.happy = clamp(p.happy + PLAY_GAIN, 0, 100);
  p.lastPlay = Date.now();

  let found = 0;
  if (Math.random() < .35 + mood() * .3){
    found = randI(40, 120) * Math.max(1, Math.round(S.level / 4));
    p.found = (p.found || 0) + found;
    addCoins(found);
  }
  bump('petPlays');
  save(); emit('state');
  return { found };
}

/* ══════════════ what they are worth ══════════════ */

/**
 * A happy pet makes the shop nicer to be in and loosens the tips a
 * little. Never negative — a neglected pet simply gives nothing.
 */
export const petBonus = () => bonusFor(mood());

export function abandon(){
  S.pet = null;
  save(); emit('state');
}
