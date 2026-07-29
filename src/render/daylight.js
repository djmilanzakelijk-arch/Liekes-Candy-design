/* ============================================================
   Time of day.

   The shop follows the clock on the phone: morning light through the
   window, a warm amber hour at the end of the afternoon, and a dark blue
   evening where the ceiling lamps do the work. Nothing here changes what
   anything is worth — it is a light pass over the diorama, so the shop
   at half past nine at night does not look like the shop at noon.
   ============================================================ */

import { clamp } from '../core/utils.js';

/**
 * @param {number} hour 0..24, fractional. Defaults to right now.
 * @returns {{
 *   phase:'night'|'dawn'|'day'|'dusk',
 *   dark:number,          // 0 = full daylight, 1 = deepest night
 *   sky:[string,string],  // gradient to mix the window sky towards
 *   skyMix:number,        // how far to pull the location sky towards it
 *   tint:string,          // room wash
 *   tintAlpha:number,
 *   lamp:number,          // extra ceiling-lamp glow, 0..1
 *   stars:boolean,
 *   moon:number,          // 0..1 how much moon instead of sun
 * }}
 */
export function daylight(hour = hourNow()){
  const h = ((hour % 24) + 24) % 24;

  // the four corners of the day, blended between so nothing snaps
  if (h >= 21 || h < 5)  return at('night', 1);
  if (h < 7)             return at('dawn', ramp(h, 5, 7));        // 5→7 night to dawn
  if (h < 9)             return blend(at('dawn', 1), at('day', 1), ramp(h, 7, 9));
  if (h < 17)            return at('day', 1);
  if (h < 19.5)          return blend(at('day', 1), at('dusk', 1), ramp(h, 17, 19.5));
  return blend(at('dusk', 1), at('night', 1), ramp(h, 19.5, 21));
}

const ramp = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
export const hourNow = (d = new Date()) => d.getHours() + d.getMinutes() / 60;

const PHASES = {
  night: { dark:1,   sky:['#1b2452', '#3a3f7a'], skyMix:.88, tint:'#2a3576', tintAlpha:.56, lamp:1,   stars:true,  moon:1 },
  dawn:  { dark:.45, sky:['#ffb98a', '#ffd9c9'], skyMix:.55, tint:'#ff9d6b', tintAlpha:.16, lamp:.45, stars:false, moon:.25 },
  day:   { dark:0,   sky:['#ffffff', '#ffffff'], skyMix:0,   tint:'#ffffff', tintAlpha:0,   lamp:0,   stars:false, moon:0 },
  dusk:  { dark:.55, sky:['#ff8f6d', '#7a5aa8'], skyMix:.66, tint:'#e0774f', tintAlpha:.24, lamp:.7,  stars:false, moon:.4 },
};

function at(phase, k){
  const p = PHASES[phase];
  return { phase, ...p, dark: p.dark * k, skyMix: p.skyMix * k,
           tintAlpha: p.tintAlpha * k, lamp: p.lamp * k };
}

function blend(a, b, k){
  return {
    phase: k < .5 ? a.phase : b.phase,
    dark: lerp(a.dark, b.dark, k),
    sky: [mixHex(a.sky[0], b.sky[0], k), mixHex(a.sky[1], b.sky[1], k)],
    skyMix: lerp(a.skyMix, b.skyMix, k),
    tint: mixHex(a.tint, b.tint, k),
    tintAlpha: lerp(a.tintAlpha, b.tintAlpha, k),
    lamp: lerp(a.lamp, b.lamp, k),
    stars: k < .5 ? a.stars : b.stars,
    moon: lerp(a.moon, b.moon, k),
  };
}

const lerp = (a, b, k) => a + (b - a) * k;

/** Local copy so the render layer does not reach into the palette module. */
export function mixHex(a, b, k){
  const pa = hex(a), pb = hex(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

function hex(s){
  let v = s.replace('#', '');
  if (v.length === 3) v = v.split('').map(c => c + c).join('');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

/** A greeting key for the hour, so the shop can say good morning. */
export function greetKey(hour = hourNow()){
  const h = ((hour % 24) + 24) % 24;
  if (h < 6)  return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  if (h < 22) return 'evening';
  return 'night';
}
