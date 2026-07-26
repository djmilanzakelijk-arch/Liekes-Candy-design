/* ============================================================
   Shading helpers — turn a colour id into rich, glossy fills.
   All drawing happens in a 1000×1000 unit space.
   ============================================================ */

import { getColor } from '../data/palette.js';
import { TAU } from '../core/utils.js';

export const U = 1000;                 // unit canvas size

/** Mix two hex colours. */
export function mix(a, b, t){
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

export function alpha(hex, a){
  const p = parseInt(hex.slice(1), 16);
  return `rgba(${(p >> 16) & 255},${(p >> 8) & 255},${p & 255},${a})`;
}

const RAINBOW = ['#ff6b8b','#ff9a4d','#ffcf47','#48cfa6','#5aabff','#9a6bff','#ff6fc7'];

/**
 * Linear gradient for a shape spanning (x0,y0)→(x1,y1).
 * Light source is top-left, so the ramp runs light → base → dark.
 */
export function linearFill(ctx, colorId, x0, y0, x1, y1, { flip = false } = {}){
  const c = getColor(colorId);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  if (c.kind === 'rainbow'){
    RAINBOW.forEach((h, i) => g.addColorStop(i / (RAINBOW.length - 1), h));
    return g;
  }
  if (c.kind === 'metal'){
    // metal needs alternating bright/dark bands to read as reflective
    g.addColorStop(0,    c.light);
    g.addColorStop(.18,  c.base);
    g.addColorStop(.32,  c.light);
    g.addColorStop(.50,  c.base);
    g.addColorStop(.68,  c.dark);
    g.addColorStop(.82,  c.base);
    g.addColorStop(1,    c.dark);
    return g;
  }
  const stops = flip
    ? [[0, c.dark], [.45, c.base], [1, c.light]]
    : [[0, c.light], [.42, c.base], [1, c.dark]];
  stops.forEach(([p, col]) => g.addColorStop(p, col));
  return g;
}

/** Radial gradient with the highlight offset up-left — reads as a dome. */
export function domeFill(ctx, colorId, cx, cy, r){
  const c = getColor(colorId);
  const g = ctx.createRadialGradient(cx - r * .35, cy - r * .42, r * .06, cx, cy, r * 1.12);
  if (c.kind === 'rainbow'){
    g.addColorStop(0, '#ffffff');
    RAINBOW.forEach((h, i) => g.addColorStop(.15 + .85 * (i / (RAINBOW.length - 1)), h));
    return g;
  }
  if (c.kind === 'metal'){
    g.addColorStop(0, '#ffffff');
    g.addColorStop(.22, c.light);
    g.addColorStop(.45, c.base);
    g.addColorStop(.68, c.dark);
    g.addColorStop(.86, c.base);
    g.addColorStop(1, c.dark);
    return g;
  }
  g.addColorStop(0, mix(c.light, '#ffffff', .55));
  g.addColorStop(.28, c.light);
  g.addColorStop(.62, c.base);
  g.addColorStop(1, c.dark);
  return g;
}

/** Soft contact shadow beneath a shape. */
export function dropShadow(ctx, cx, cy, rx, ry, strength = .3){
  ctx.save();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  g.addColorStop(0, `rgba(110,60,95,${strength})`);
  g.addColorStop(1, 'rgba(110,60,95,0)');
  ctx.fillStyle = g;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(1, ry / rx); ctx.translate(-cx, -cy);
  ctx.beginPath(); ctx.arc(cx, cy, rx, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
}

/** Glossy elliptical highlight — the thing that makes candy look wet. */
export function gloss(ctx, cx, cy, rx, ry, rot = -.35, strength = .55){
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(rot);
  const g = ctx.createLinearGradient(0, -ry, 0, ry);
  g.addColorStop(0, `rgba(255,255,255,${strength})`);
  g.addColorStop(.55, `rgba(255,255,255,${strength * .28})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

/** A bright specular dot. */
export function specular(ctx, cx, cy, r, a = .9){
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(.5, `rgba(255,255,255,${a * .4})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
}

/** Rounded-rectangle path. */
export function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Heart path centred on (cx,cy) with the given width/height. */
export function heartPath(ctx, cx, cy, w, h){
  const x = cx, y = cy - h * .28;
  ctx.beginPath();
  ctx.moveTo(x, y + h * .34);
  ctx.bezierCurveTo(x - w * .04, y - h * .12, x - w * .52, y - h * .06, x - w * .5, y + h * .26);
  ctx.bezierCurveTo(x - w * .5, y + h * .58, x - w * .16, y + h * .78, x, y + h * 1.02);
  ctx.bezierCurveTo(x + w * .16, y + h * .78, x + w * .5, y + h * .58, x + w * .5, y + h * .26);
  ctx.bezierCurveTo(x + w * .52, y - h * .06, x + w * .04, y - h * .12, x, y + h * .34);
  ctx.closePath();
}

/** N-pointed star path. */
export function starPath(ctx, cx, cy, outer, inner, points = 5, rot = -Math.PI / 2){
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++){
    const r = i % 2 ? inner : outer;
    const a = rot + (i * Math.PI) / points;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

/** Little glossy sphere — pearls, dots, beads. */
export function bead(ctx, cx, cy, r, colorId){
  ctx.fillStyle = domeFill(ctx, colorId, cx, cy, r);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
  specular(ctx, cx - r * .34, cy - r * .38, r * .38, .95);
  ctx.strokeStyle = alpha(getColor(colorId).dark, .28);
  ctx.lineWidth = r * .09;
  ctx.beginPath(); ctx.arc(cx, cy, r * .96, 0, TAU); ctx.stroke();
}

/** Clip helper: run `fn` with the current path as a clip. */
export function clipped(ctx, pathFn, fn){
  ctx.save(); pathFn(); ctx.clip(); fn(); ctx.restore();
}
