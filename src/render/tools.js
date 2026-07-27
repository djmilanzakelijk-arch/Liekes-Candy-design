/* ============================================================
   Tool effects.

   Everything except the cream filling is applied with
   `source-atop`, so an effect automatically takes the exact shape
   of whatever candy is underneath — no per-candy code needed.
   ============================================================ */

import { U, alpha, mix, roundRect, gloss, specular, domeFill } from './shade.js';
import { getColor } from '../data/palette.js';
import { FILL_BY_ID, DUST_BY_ID } from '../data/tools.js';
import { TAU, rngFrom, clamp } from '../core/utils.js';

/* Reusable scratch canvases — allocating these per frame is what kills
   canvas performance on phones. */
const scratch = [];
function getScratch(i, size){
  if (!scratch[i]) scratch[i] = document.createElement('canvas');
  const c = scratch[i];
  if (c.width !== size || c.height !== size){ c.width = size; c.height = size; }
  else c.getContext('2d').clearRect(0, 0, size, size);
  return c;
}

/** Copy `src` and flood it with one colour, keeping the silhouette. */
function tintCopy(src, size, index, fill){
  const c = getScratch(index, size);
  const x = c.getContext('2d');
  x.clearRect(0, 0, size, size);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = fill;
  x.fillRect(0, 0, size, size);
  x.globalCompositeOperation = 'source-over';
  return c;
}

/* ══════════════ CREAM FILLER ══════════════
   Takes a bite out of the candy and reveals a shell rim with a
   cream centre behind it. */
function applyFill(canvas, size, fillId, zone, colorId){
  const filling = FILL_BY_ID[fillId];
  if (!filling) return;
  const ctx = canvas.getContext('2d');
  const c = getColor(colorId);
  const s = size / U;

  // layers to sit behind the candy
  const shell = tintCopy(canvas, size, 0, mix(c.dark, '#000000', .2));
  const cream = tintCopy(canvas, size, 1, filling.base);

  // texture the cream so it does not read as a flat silhouette
  {
    const x = cream.getContext('2d');
    x.save();
    x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, alpha(filling.light, .95));
    g.addColorStop(.45, alpha(filling.base, .2));
    g.addColorStop(1, alpha(filling.dark, .8));
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    // little air bubbles
    const rng = rngFrom('fill' + fillId);
    for (let i = 0; i < 40; i++){
      x.fillStyle = alpha(filling.light, .18 + rng() * .3);
      x.beginPath();
      x.arc(rng() * size, rng() * size, (rng() * 9 + 3) * s, 0, TAU);
      x.fill();
    }
    x.restore();
  }

  // A window bitten out of the upper-right, kept fully inside the candy so
  // the cut is ringed by chocolate on every side.
  const bx = (zone.x + zone.w * .20) * U;
  const by = (zone.y - zone.h * .20) * U;
  const br = Math.min(zone.w, zone.h) * U * .34;

  ctx.save();
  ctx.scale(s, s);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  // a nibbled edge rather than a clean circle
  for (let i = 0; i <= 44; i++){
    const a = (i / 44) * TAU;
    const rr = br * (1 + Math.sin(a * 7) * .09 + Math.sin(a * 3.4) * .05);
    const px = bx + Math.cos(a) * rr, py = by + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // keep only a soft round core of cream around the bite, otherwise the
  // filling inherits the candy's outline and reads as a flat block
  {
    const x = cream.getContext('2d');
    x.globalCompositeOperation = 'destination-in';
    // deliberately smaller than the bite, so a ring of dark chocolate
    // shell always frames the cream
    const bg = x.createRadialGradient(bx * s, by * s, br * s * .30,
                                      bx * s, by * s, br * s * .80);
    bg.addColorStop(0, 'rgba(0,0,0,1)');
    bg.addColorStop(.78, 'rgba(0,0,0,1)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = bg;
    x.fillRect(0, 0, size, size);
    x.globalCompositeOperation = 'source-over';
  }

  // slide the two layers underneath: cream inset (so a shell rim stays
  // visible around the bite), shell at full size behind it
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  const inset = .95;
  const off = size * (1 - inset) / 2;
  ctx.drawImage(cream, off, off + size * .008, size * inset, size * inset);
  ctx.drawImage(shell, 0, 0);
  ctx.restore();

  // soft inner shadow around the bite so it reads as depth
  ctx.save();
  ctx.scale(s, s);
  ctx.globalCompositeOperation = 'source-atop';
  const sg = ctx.createRadialGradient(bx, by, br * .55, bx, by, br * 1.5);
  sg.addColorStop(0, 'rgba(60,30,20,.42)');
  sg.addColorStop(1, 'rgba(60,30,20,0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(bx, by, br * 1.5, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ══════════════ MARBLE ══════════════ */
function applyMarble(canvas, size, colorId){
  const ctx = canvas.getContext('2d');
  const c = getColor(colorId);
  const rng = rngFrom('marble' + colorId);
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.lineCap = 'round';
  for (let band = 0; band < 5; band++){
    ctx.strokeStyle = alpha(band % 2 ? c.light : c.base, .78);
    ctx.lineWidth = size * (.045 + rng() * .05);
    ctx.beginPath();
    const y0 = size * (.1 + band * .19);
    for (let i = 0; i <= 24; i++){
      const p = i / 24;
      const x = p * size;
      const y = y0 + Math.sin(p * Math.PI * 2.6 + band) * size * .07;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/* ══════════════ CHOCOLATE DIP ══════════════ */
function applyDip(canvas, size, dip){
  const ctx = canvas.getContext('2d');
  const colorId = dip.color || 'brown';
  const depth = clamp(dip.depth ?? .45, .15, .9);
  const c = getColor(colorId);
  const lineY = size * (1 - depth);

  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';

  // the coating itself, with a wavy meniscus at the top
  ctx.beginPath();
  ctx.moveTo(0, lineY);
  for (let i = 0; i <= 30; i++){
    const p = i / 30;
    ctx.lineTo(p * size, lineY + Math.sin(p * Math.PI * 3.2) * size * .018);
  }
  ctx.lineTo(size, size); ctx.lineTo(0, size);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, lineY, size * .6, size);
  g.addColorStop(0, c.light);
  g.addColorStop(.28, c.base);
  g.addColorStop(1, c.dark);
  ctx.fillStyle = g;
  ctx.fill();

  // thicker lip where the chocolate pooled
  ctx.strokeStyle = alpha(c.light, .55);
  ctx.lineWidth = size * .012;
  ctx.beginPath();
  ctx.moveTo(0, lineY);
  for (let i = 0; i <= 30; i++){
    const p = i / 30;
    ctx.lineTo(p * size, lineY + Math.sin(p * Math.PI * 3.2) * size * .018);
  }
  ctx.stroke();

  // wet sheen down the left of the coating
  const sg = ctx.createLinearGradient(size * .22, lineY, size * .38, size);
  sg.addColorStop(0, 'rgba(255,255,255,.35)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(size * .2, lineY, size * .2, size - lineY);
  ctx.restore();
}

/* ══════════════ TORCH ══════════════ */
function applyToast(canvas, size, level){
  const lv = clamp(level, 0, 3);
  if (!lv) return;
  const ctx = canvas.getContext('2d');
  const rng = rngFrom('toast' + lv);
  const strength = .18 + lv * .16;

  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';

  // browning gathers at the edges and the top, like a real torch
  const g = ctx.createRadialGradient(size * .5, size * .48, size * .18, size * .5, size * .5, size * .62);
  g.addColorStop(0, `rgba(140,80,30,${strength * .25})`);
  g.addColorStop(1, `rgba(120,60,20,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // scorch blotches
  for (let i = 0; i < 26 + lv * 14; i++){
    const x = rng() * size, y = rng() * size;
    const r = (rng() * .06 + .02) * size;
    const a = strength * (.3 + rng() * .7);
    const bg = ctx.createRadialGradient(x, y, 0, x, y, r);
    bg.addColorStop(0, `rgba(90,45,12,${a})`);
    bg.addColorStop(1, 'rgba(90,45,12,0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ══════════════ SUGAR DUSTER ══════════════ */
function applyDust(canvas, size, dustId){
  const dust = DUST_BY_ID[dustId];
  if (!dust) return;
  const ctx = canvas.getContext('2d');
  const rng = rngFrom('dust' + dustId);

  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  // heavier where it settled on top
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, alpha(dust.color, .40));
  g.addColorStop(.55, alpha(dust.color, .12));
  g.addColorStop(1, alpha(dust.color, .03));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 420; i++){
    const x = rng() * size;
    const y = Math.pow(rng(), 1.5) * size;
    ctx.fillStyle = alpha(dust.color, .18 + rng() * .55);
    ctx.beginPath();
    ctx.arc(x, y, rng() * size * .006 + size * .0015, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/* ══════════════ WHIPPED CREAM ══════════════ */
function drawSwirl(ctx, colorId, zone){
  const c = getColor(colorId);
  const cx = zone.x * U;
  const cy = (zone.y - zone.h * .52) * U;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // a stacked cone of piped cream
  for (let ring = 3; ring >= 0; ring--){
    const rr = 118 - ring * 26;
    const yy = ring * 34;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++){
      const a = (i / 60) * TAU;
      const wob = 1 + Math.sin(a * 8) * .07;
      ctx.lineTo(Math.cos(a) * rr * wob, yy + Math.sin(a) * rr * .42 * wob);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, yy - rr * .5, 0, yy + rr * .5);
    g.addColorStop(0, mix(c.light, '#ffffff', .65));
    g.addColorStop(.55, c.light);
    g.addColorStop(1, c.base);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = alpha(c.dark, .18); ctx.lineWidth = 5; ctx.stroke();
  }
  // the peak
  ctx.beginPath();
  ctx.moveTo(-30, -78);
  ctx.quadraticCurveTo(-4, -168, 26, -74);
  ctx.quadraticCurveTo(0, -56, -30, -78);
  ctx.fillStyle = mix(c.light, '#ffffff', .55); ctx.fill();

  specular(ctx, -40, -30, 22, .8);
  ctx.restore();
}

/* ══════════════ public entry ══════════════ */

/**
 * Apply every configured tool to a canvas that already holds the candy.
 * @param canvas offscreen canvas containing ONLY the candy
 */
export function applyTools(canvas, size, tools, design, zone){
  if (!tools) return;
  const ctx = canvas.getContext('2d');

  if (tools.marble) applyMarble(canvas, size, tools.marble);
  if (tools.fill)   applyFill(canvas, size, tools.fill, zone, design.color);
  if (tools.dip)    applyDip(canvas, size, tools.dip);
  if (tools.toast)  applyToast(canvas, size, tools.toast);
  if (tools.dust)   applyDust(canvas, size, tools.dust);

  if (tools.swirl){
    ctx.save();
    ctx.scale(size / U, size / U);
    drawSwirl(ctx, tools.swirl, zone);
    ctx.restore();
  }
}

/** Preview art for a tool button in the tray. */
export function drawToolPreview(ctx, size, toolId, value, colorId = 'pink'){
  ctx.clearRect(0, 0, size, size);
  const r = size * .34;
  const cx = size / 2, cy = size / 2;

  const disc = fill => {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,110,.28)'; ctx.lineWidth = size * .03; ctx.stroke();
  };

  if (toolId === 'fill'){
    const f = FILL_BY_ID[value] || FILL_BY_ID.pistachio;
    disc('#6b4a33');
    ctx.beginPath(); ctx.arc(cx, cy, r * .62, 0, TAU);
    const g = ctx.createRadialGradient(cx - r * .2, cy - r * .2, 1, cx, cy, r * .62);
    g.addColorStop(0, f.light); g.addColorStop(.6, f.base); g.addColorStop(1, f.dark);
    ctx.fillStyle = g; ctx.fill();
  } else if (toolId === 'dust'){
    const d = DUST_BY_ID[value] || DUST_BY_ID.sugar;
    disc('#c9a184');
    const rng = rngFrom('tp' + value);
    ctx.fillStyle = alpha(d.color, .85);
    for (let i = 0; i < 90; i++){
      const a = rng() * TAU, rr = Math.sqrt(rng()) * r;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, size * .012, 0, TAU);
      ctx.fill();
    }
  } else if (toolId === 'dip'){
    const c = getColor(value?.color || 'brown');
    disc('#fdf7fa');
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
    const g = ctx.createLinearGradient(0, cy, 0, cy + r);
    g.addColorStop(0, c.base); g.addColorStop(1, c.dark);
    ctx.fillStyle = g;
    ctx.fillRect(0, cy - r * .1, size, size);
    ctx.restore();
  } else if (toolId === 'toast'){
    disc('#fff6ea');
    applyToastPreview(ctx, cx, cy, r, value || 2);
  } else if (toolId === 'marble'){
    const c = getColor(value || 'white');
    disc('#8b5e3c');
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
    ctx.strokeStyle = c.base; ctx.lineWidth = size * .075; ctx.lineCap = 'round';
    for (let b = 0; b < 3; b++){
      ctx.beginPath();
      for (let i = 0; i <= 16; i++){
        const p = i / 16;
        ctx.lineTo(p * size, cy - r * .5 + b * r * .55 + Math.sin(p * 6 + b) * r * .16);
      }
      ctx.stroke();
    }
    ctx.restore();
  } else if (toolId === 'swirl'){
    const c = getColor(value || 'white');
    ctx.save();
    ctx.translate(cx, cy + r * .5);
    ctx.scale(size / U * 2.1, size / U * 2.1);
    drawSwirl(ctx, value || 'white', { x:0, y:0, w:.4, h:0 });
    ctx.restore();
  }
}

function applyToastPreview(ctx, cx, cy, r, lv){
  const rng = rngFrom('tprev' + lv);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
  for (let i = 0; i < 20 + lv * 12; i++){
    const x = cx + (rng() - .5) * r * 2, y = cy + (rng() - .5) * r * 2;
    const rr = r * (.1 + rng() * .22);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
    g.addColorStop(0, `rgba(140,75,20,${.14 + lv * .11})`);
    g.addColorStop(1, 'rgba(140,75,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ══════════════ PIPED CREAM STROKES ══════════════
   A stroke the player dragged with the piping bag. Drawn as a rope of
   overlapping scallops so it reads as cream squeezed from a star tip,
   rather than a flat line. */

/** Distance below which two points are treated as the same. */
const MIN_STEP = 14;

/**
 * Resample a raw pointer path to evenly spaced points along its length.
 * Walks each segment with a parameter that only ever moves forward, so the
 * loop is guaranteed to terminate however jittery the input is.
 */
function resample(points, step){
  if (points.length < 2) return points.slice();
  const s = Math.max(step, 0.5);
  const out = [points[0]];
  let carry = 0;

  for (let i = 1; i < points.length && out.length < 400; i++){
    const a = points[i - 1], b = points[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) continue;

    let f = 0;                        // 0 → 1 along this segment
    while (carry + (1 - f) * d >= s && out.length < 400){
      f += (s - carry) / d;
      out.push({ x: a.x + dx * f, y: a.y + dy * f });
      carry = 0;
    }
    carry += (1 - f) * d;
  }

  if (out.length < 2) out.push(points[points.length - 1]);
  return out;
}

/**
 * @param stroke { color, width, points:[{x,y}] } in 0..1 design space
 */
export function drawPipedStroke(ctx, stroke, t = 0){
  const pts = (stroke.points || []).map(p => ({ x:p.x * U, y:p.y * U }));
  if (!pts.length) return;

  const c = getColor(stroke.color || 'white');
  const w = (stroke.width || 1) * 44;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const path = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 1){ ctx.lineTo(pts[0].x + .01, pts[0].y); return; }
    // smooth the finger path through the midpoints of each pair
    for (let i = 1; i < pts.length - 1; i++){
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  };

  // contact shadow so the rope sits on the candy rather than floating
  ctx.save();
  ctx.translate(w * .08, w * .13);
  ctx.strokeStyle = 'rgba(110,65,100,.22)';
  ctx.lineWidth = w;
  path(); ctx.stroke();
  ctx.restore();

  // the rope body
  ctx.strokeStyle = c.base;
  ctx.lineWidth = w;
  path(); ctx.stroke();

  // Ridges: overlapping domes along the path. Drawing the rope as beads
  // rather than more offset strokes is what makes it read as squeezed
  // cream — and it survives the stroke crossing over itself.
  const beads = resample(pts, Math.max(6, w * .34));
  for (const p of beads){
    const g = ctx.createRadialGradient(
      p.x - w * .18, p.y - w * .22, w * .03,
      p.x, p.y, w * .50);
    g.addColorStop(0, mix(c.light, '#ffffff', .85));
    g.addColorStop(.42, mix(c.light, '#ffffff', .25));
    g.addColorStop(.82, c.base);
    g.addColorStop(1, alpha(c.dark, .30));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, w * .50, 0, TAU);
    ctx.fill();
  }

  // tiny catch-lights along the crest
  ctx.fillStyle = alpha('#ffffff', .55);
  for (let i = 0; i < beads.length; i += 2){
    const p = beads[i];
    ctx.beginPath();
    ctx.arc(p.x - w * .17, p.y - w * .21, w * .09, 0, TAU);
    ctx.fill();
  }

  // a fatter dollop where the bag first touched down
  const first = pts[0];
  ctx.fillStyle = domeFill(ctx, stroke.color || 'white', first.x, first.y, w * .6);
  ctx.beginPath(); ctx.arc(first.x, first.y, w * .58, 0, TAU); ctx.fill();
  specular(ctx, first.x - w * .22, first.y - w * .26, w * .16, .9);

  // and a soft peak where it lifted off
  if (pts.length > 1){
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const a = Math.atan2(last.y - prev.y, last.x - prev.x);
    ctx.save();
    ctx.translate(last.x, last.y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-w * .1, -w * .46);
    ctx.quadraticCurveTo(w * .52, -w * .22, w * .66, 0);
    ctx.quadraticCurveTo(w * .52, w * .22, -w * .1, w * .46);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -w * .5, 0, w * .5);
    g.addColorStop(0, mix(c.light, '#ffffff', .7));
    g.addColorStop(.55, c.light);
    g.addColorStop(1, c.base);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
