/* ============================================================
   Shop pet — the numbers.

   Pure data and maths, so both the game logic and core/state.js can
   read the pet's mood without importing each other.
   ============================================================ */

import { clamp } from '../core/utils.js';

export const PETS = [
  { id:'cat',    emoji:'🐱', coat:'#f6c48a', belly:'#fff3e0', cost:1800 },
  { id:'dog',    emoji:'🐶', coat:'#c9a184', belly:'#f6e6d6', cost:1800 },
  { id:'bunny',  emoji:'🐰', coat:'#f2e7ef', belly:'#ffffff', cost:2400 },
  { id:'parrot', emoji:'🦜', coat:'#61d39a', belly:'#fff6c9', cost:3200 },
];
export const PET_BY_ID = Object.fromEntries(PETS.map(p => [p.id, p]));

/** Level at which the pet shop opens. */
export const PET_LEVEL = 4;
/** The meters drop this much per hour. */
export const FED_PER_HOUR = 4.5;
export const HAPPY_PER_HOUR = 3.6;
/** Nobody's pet gets hungrier than three days' worth. */
export const MAX_DECAY_HOURS = 72;

export const FEED_COST = 120;
export const FEED_GAIN = 42;
export const PLAY_GAIN = 38;
export const PLAY_COOLDOWN_MS = 25 * 60 * 1000;

/** The two meters brought up to date, without writing anything. */
export function metersNow(p, now = Date.now()){
  if (!p) return { fed: 0, happy: 0 };
  const hours = clamp((now - (p.lastTick || now)) / 3600000, 0, MAX_DECAY_HOURS);
  return {
    fed: clamp((p.fed ?? 0) - hours * FED_PER_HOUR, 0, 100),
    happy: clamp((p.happy ?? 0) - hours * HAPPY_PER_HOUR, 0, 100),
  };
}

/** 0..1 — how well looked after they are. */
export function moodOf(p, now = Date.now()){
  if (!p) return 0;
  const m = metersNow(p, now);
  return clamp((m.fed + m.happy) / 200, 0, 1);
}

export const moodTone = m =>
  m >= .82 ? 'great' : m >= .6 ? 'good' : m >= .35 ? 'okay' : m >= .15 ? 'low' : 'sad';

/**
 * What a pet is worth to the shop. Never negative: a neglected pet
 * simply stops helping.
 */
export function bonusFor(mood){
  return {
    satisfaction: Math.round(mood * 6),
    tipMult: 1 + mood * .07,
  };
}
