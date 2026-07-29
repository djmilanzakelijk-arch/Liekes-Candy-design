/* ============================================================
   The photo studio — backdrops and frames.

   A photo is the candy plus the little set it was shot on. Everything
   is drawn procedurally in the same square as the design, so a photo
   scales from a 90px thumbnail to a full-screen view without any
   assets.
   ============================================================ */

import { alpha, mix, roundRect, heartPath, starPath, specular } from './shade.js';
import { TAU, rngFrom } from '../core/utils.js';

/* ══════════════ backdrops ══════════════ */

export const BACKDROPS = [
  { id:'none',     emoji:'⬜', sky:['#fff6fb', '#ffeaf4'] },
  { id:'dots',     emoji:'🔵', sky:['#fff2f8', '#ffd9ec'] },
  { id:'stripes',  emoji:'🍬', sky:['#fff8ef', '#ffe6cf'] },
  { id:'hearts',   emoji:'💗', sky:['#fff0f4', '#ffd3e2'] },
  { id:'night',    emoji:'🌙', sky:['#2b2350', '#4a3b7a'] },
  { id:'marble',   emoji:'🪨', sky:['#fbfbfd', '#e8e6ef'] },
  { id:'wood',     emoji:'🪵', sky:['#d9ab7b', '#a97a4e'] },
  { id:'confetti', emoji:'🎉', sky:['#f2f7ff', '#e0ecff'] },
  { id:'sunset',   emoji:'🌇', sky:['#ffd9b0', '#ffb0c8'] },
  { id:'mint',     emoji:'🌿', sky:['#eefcf6', '#cdf1e4'] },
];
export const BACKDROP_BY_ID = Object.fromEntries(BACKDROPS.map(b => [b.id, b]));

/** True when the backdrop is dark enough to need pale text on top. */
export const backdropIsDark = id => id === 'night';

export function drawBackdrop(ctx, size, id = 'none', t = 0){
  const b = BACKDROP_BY_ID[id] || BACKDROPS[0];
  const s = size / 1000;

  const g = ctx.createLinearGradient(0, 0, size * .3, size);
  g.addColorStop(0, b.sky[0]);
  g.addColorStop(1, b.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const rng = rngFrom('bd' + id);
  ctx.save();

  switch (id){
    case 'dots': {
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let y = 0; y < 7; y++){
        for (let x = 0; x < 7; x++){
          const off = (y % 2) * 70 * s;
          ctx.beginPath();
          ctx.arc(x * 150 * s + off + 40 * s, y * 150 * s + 40 * s, 22 * s, 0, TAU);
          ctx.fill();
        }
      }
      break;
    }
    case 'stripes': {
      ctx.globalAlpha = .5;
      for (let i = -6; i < 12; i++){
        ctx.fillStyle = i % 2 ? '#ffffff' : '#ffd0a8';
        ctx.save();
        ctx.translate(i * 120 * s, 0);
        ctx.rotate(.32);
        ctx.fillRect(0, -size, 60 * s, size * 3);
        ctx.restore();
      }
      break;
    }
    case 'hearts': {
      ctx.fillStyle = 'rgba(255,255,255,.62)';
      for (let i = 0; i < 22; i++){
        const x = rng() * size, y = rng() * size, w = (40 + rng() * 46) * s;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rng() - .5) * .8);
        heartPath(ctx, 0, 0, w, w * .9);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'night': {
      for (let i = 0; i < 70; i++){
        const x = rng() * size, y = rng() * size * .8;
        const tw = .35 + Math.abs(Math.sin(t * 1.4 + i)) * .65;
        ctx.fillStyle = `rgba(255,255,255,${tw * .9})`;
        ctx.beginPath();
        ctx.arc(x, y, (rng() * 2.6 + 1) * s * 1.6, 0, TAU);
        ctx.fill();
      }
      // a fat moon in the corner
      ctx.fillStyle = 'rgba(255,248,214,.95)';
      ctx.beginPath(); ctx.arc(size * .8, size * .16, size * .075, 0, TAU); ctx.fill();
      ctx.fillStyle = alpha('#4a3b7a', .55);
      ctx.beginPath(); ctx.arc(size * .765, size * .135, size * .062, 0, TAU); ctx.fill();
      break;
    }
    case 'marble': {
      ctx.strokeStyle = 'rgba(150,150,170,.30)';
      ctx.lineCap = 'round';
      for (let v = 0; v < 7; v++){
        ctx.lineWidth = (2 + rng() * 5) * s;
        ctx.beginPath();
        let x = rng() * size, y = -20;
        ctx.moveTo(x, y);
        while (y < size){ x += (rng() - .5) * 150 * s; y += (70 + rng() * 90) * s; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      break;
    }
    case 'wood': {
      ctx.strokeStyle = 'rgba(110,70,40,.24)';
      for (let i = 0; i < 16; i++){
        ctx.lineWidth = (2 + rng() * 4) * s;
        const y0 = rng() * size;
        ctx.beginPath();
        for (let x = 0; x <= size; x += 40 * s){
          ctx.lineTo(x, y0 + Math.sin(x / size * 6 + i) * 12 * s);
        }
        ctx.stroke();
      }
      // plank seams
      ctx.strokeStyle = 'rgba(90,55,30,.35)';
      ctx.lineWidth = 3 * s;
      for (const p of [.28, .58, .86]){
        ctx.beginPath(); ctx.moveTo(0, size * p); ctx.lineTo(size, size * p); ctx.stroke();
      }
      break;
    }
    case 'confetti': {
      const cols = ['#ff8ec0', '#ffcf47', '#48cfa6', '#5aabff', '#9a6bff'];
      for (let i = 0; i < 46; i++){
        ctx.save();
        ctx.translate(rng() * size, rng() * size);
        ctx.rotate(rng() * TAU);
        ctx.fillStyle = alpha(cols[i % cols.length], .75);
        ctx.fillRect(0, 0, 26 * s, 11 * s);
        ctx.restore();
      }
      break;
    }
    case 'sunset': {
      ctx.fillStyle = 'rgba(255,255,255,.34)';
      ctx.beginPath(); ctx.arc(size * .5, size * .62, size * .3, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      for (let i = 0; i < 4; i++){
        ctx.beginPath();
        ctx.ellipse(size * (.2 + i * .22), size * (.16 + (i % 2) * .1),
                    size * .13, size * .045, 0, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'mint': {
      ctx.strokeStyle = 'rgba(80,180,150,.22)';
      ctx.lineWidth = 2.5 * s;
      for (let i = 0; i <= 10; i++){
        ctx.beginPath(); ctx.moveTo(i * size / 10, 0); ctx.lineTo(i * size / 10, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * size / 10); ctx.lineTo(size, i * size / 10); ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();

  // a soft vignette pulls the eye to the candy on every backdrop
  const v = ctx.createRadialGradient(size / 2, size * .46, size * .28, size / 2, size / 2, size * .78);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, backdropIsDark(id) ? 'rgba(0,0,0,.34)' : 'rgba(120,70,110,.13)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, size, size);
}

/* ══════════════ frames ══════════════ */

export const FRAMES = [
  { id:'none',     emoji:'🚫' },
  { id:'polaroid', emoji:'🖼️' },
  { id:'gold',     emoji:'🥇' },
  { id:'hearts',   emoji:'💞' },
  { id:'lace',     emoji:'🧵' },
  { id:'tape',     emoji:'📎' },
  { id:'stars',    emoji:'✨' },
];
export const FRAME_BY_ID = Object.fromEntries(FRAMES.map(f => [f.id, f]));

/**
 * How far the candy is inset by the frame, 0..1 of the square.
 * The composer shrinks the design by this much so nothing is covered.
 */
export const frameInset = id => (id === 'polaroid' ? .10 : id === 'none' ? 0 : .06);

export function drawFrame(ctx, size, id = 'none', t = 0){
  if (!id || id === 'none') return;
  const s = size / 1000;
  const pad = size * .045;
  ctx.save();

  switch (id){
    case 'polaroid': {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * .07;
      ctx.strokeRect(-ctx.lineWidth / 2, -ctx.lineWidth / 2,
                     size + ctx.lineWidth, size + ctx.lineWidth);
      // the fat bottom lip a polaroid has
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, size * .87, size, size * .13);
      ctx.strokeStyle = 'rgba(160,120,150,.18)';
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(size * .03, size * .03, size * .94, size * .84);
      break;
    }
    case 'gold': {
      const g = ctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, '#ffe9a8'); g.addColorStop(.3, '#c9a227');
      g.addColorStop(.55, '#fff3c4'); g.addColorStop(1, '#8a5c05');
      ctx.strokeStyle = g;
      ctx.lineWidth = size * .05;
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, size * .05);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = size * .008;
      roundRect(ctx, pad * 1.9, pad * 1.9, size - pad * 3.8, size - pad * 3.8, size * .035);
      ctx.stroke();
      break;
    }
    case 'hearts': {
      ctx.fillStyle = '#ff8ec0';
      const n = 13;
      for (let i = 0; i < n; i++){
        const p = i / n;
        for (const [x, y] of [[p * size, pad * .6], [p * size, size - pad * .6],
                              [pad * .6, p * size], [size - pad * .6, p * size]]){
          heartPath(ctx, x, y, size * .05, size * .046);
          ctx.fill();
        }
      }
      break;
    }
    case 'lace': {
      ctx.strokeStyle = 'rgba(255,255,255,.95)';
      ctx.lineWidth = size * .018;
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      const n = 22;
      for (let i = 0; i < n; i++){
        const p = (i + .5) / n;
        for (const [x, y] of [[p * size, pad * .5], [p * size, size - pad * .5],
                              [pad * .5, p * size], [size - pad * .5, p * size]]){
          ctx.beginPath(); ctx.arc(x, y, size * .021, 0, TAU); ctx.fill();
        }
      }
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, size * .04);
      ctx.stroke();
      break;
    }
    case 'tape': {
      // washi tape across the corners
      ctx.fillStyle = 'rgba(255,214,232,.85)';
      for (const [x, y, a] of [[0, 0, .78], [size, 0, -.78], [0, size, -.78], [size, size, .78]]){
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.fillRect(-size * .12, -size * .035, size * .24, size * .07);
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = size * .022;
      ctx.strokeRect(size * .012, size * .012, size * .976, size * .976);
      break;
    }
    case 'stars': {
      const n = 16;
      for (let i = 0; i < n; i++){
        const p = (i + .5) / n;
        const tw = .55 + Math.abs(Math.sin(t * 2 + i)) * .45;
        ctx.fillStyle = `rgba(255,215,110,${tw})`;
        for (const [x, y] of [[p * size, pad * .55], [p * size, size - pad * .55],
                              [pad * .55, p * size], [size - pad * .55, p * size]]){
          starPath(ctx, x, y, size * .028, size * .012, 5, -Math.PI / 2);
          ctx.fill();
        }
      }
      break;
    }
  }
  ctx.restore();
}

/** Extra credit a nicely staged photo earns on the feed. */
export const stagingBonus = (backdrop, frame) =>
  (backdrop && backdrop !== 'none' ? .04 : 0) + (frame && frame !== 'none' ? .04 : 0);
