/* ============================================================
   The decorations she puts around the shop, drawn into the diorama.

   Each piece draws inside a box `s` wide, anchored at (x, y) with its
   feet (or its hanging point) on that spot.
   ============================================================ */

import { roundRect, alpha, mix, specular, gloss } from './shade.js';
import { TAU, rngFrom } from '../core/utils.js';

/**
 * @param x,y  anchor in canvas pixels
 * @param s    how wide the piece is drawn
 * @param w,h  the whole diorama, for the pieces that span it
 */
export function drawDecorPiece(ctx, id, x, y, s, t = 0, w = 0, h = 0){
  ctx.save();
  switch (id){
    case 'bunting':   bunting(ctx, w, h, t); break;
    case 'balloons':  balloons(ctx, w, h, t); break;
    case 'lanterns':  lanterns(ctx, w, h, t); break;
    case 'poster':    poster(ctx, x, y, s); break;
    case 'clock':     clock(ctx, x, y, s, t); break;
    case 'neon':      neon(ctx, x, y, s, t); break;
    case 'plant':     plant(ctx, x, y, s, t); break;
    case 'gumball':   gumball(ctx, x, y, s); break;
    case 'lamp':      lamp(ctx, x, y, s); break;
    case 'cakestand': cakestand(ctx, x, y, s); break;
    case 'tipjar':    tipjar(ctx, x, y, s); break;
    case 'vase':      vase(ctx, x, y, s, t); break;
  }
  ctx.restore();
}

/* ══════════════ across the ceiling ══════════════ */

function bunting(ctx, w, h, t){
  const cols = ['#ff8ec0', '#ffcf47', '#48cfa6', '#5aabff', '#9a6bff'];
  const y0 = h * .02, sag = h * .06;
  ctx.strokeStyle = 'rgba(120,80,110,.4)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-4, y0);
  ctx.quadraticCurveTo(w / 2, y0 + sag + Math.sin(t) * 3, w + 4, y0);
  ctx.stroke();

  const n = 11;
  for (let i = 0; i <= n; i++){
    const p = i / n;
    // the same quadratic, sampled
    const bx = (1 - p) * (1 - p) * -4 + 2 * (1 - p) * p * (w / 2) + p * p * (w + 4);
    const by = (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * (y0 + sag + Math.sin(t) * 3) + p * p * y0;
    const fw = w * .028, fh = h * .055;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.sin(t * 1.4 + i) * .05);
    ctx.beginPath();
    ctx.moveTo(-fw / 2, 0); ctx.lineTo(fw / 2, 0); ctx.lineTo(0, fh);
    ctx.closePath();
    ctx.fillStyle = cols[i % cols.length];
    ctx.fill();
    ctx.restore();
  }
}

function balloons(ctx, w, h, t){
  const cols = ['#ff8ec0', '#ffcf47', '#5aabff', '#9a6bff'];
  for (let i = 0; i < 5; i++){
    const bx = w * (.12 + i * .19);
    const drift = Math.sin(t * .9 + i) * h * .012;
    const by = h * (.08 + (i % 2) * .04) + drift;
    const r = w * .028;
    ctx.strokeStyle = 'rgba(120,80,110,.35)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.quadraticCurveTo(bx + 6, by * .6, bx, by - r);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(bx, by, r, r * 1.18, 0, 0, TAU);
    const g = ctx.createRadialGradient(bx - r * .3, by - r * .4, r * .1, bx, by, r * 1.2);
    g.addColorStop(0, mix(cols[i % 4], '#ffffff', .55));
    g.addColorStop(1, cols[i % 4]);
    ctx.fillStyle = g; ctx.fill();
    specular(ctx, bx - r * .3, by - r * .45, r * .26, .8);
  }
}

function lanterns(ctx, w, h, t){
  ctx.strokeStyle = 'rgba(120,80,110,.4)';
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(0, h * .025); ctx.lineTo(w, h * .025); ctx.stroke();
  for (let i = 0; i < 6; i++){
    const lx = w * (.09 + i * .165);
    const ly = h * .025 + h * .055 + Math.sin(t * 1.1 + i) * 2;
    const r = w * .026;
    ctx.strokeStyle = 'rgba(120,80,110,.35)';
    ctx.beginPath(); ctx.moveTo(lx, h * .025); ctx.lineTo(lx, ly - r); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(lx, ly, r, r * .82, 0, 0, TAU);
    ctx.fillStyle = i % 2 ? alpha('#ff8ea8', .92) : alpha('#ffd166', .92);
    ctx.fill();
    ctx.strokeStyle = alpha('#a4302f', .35); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(lx, ly, r * .45, r * .82, 0, 0, TAU); ctx.stroke();
    // a warm little glow
    const g = ctx.createRadialGradient(lx, ly, 1, lx, ly, r * 3);
    g.addColorStop(0, 'rgba(255,200,140,.20)');
    g.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(lx, ly, r * 3, 0, TAU); ctx.fill();
  }
}

/* ══════════════ on the wall ══════════════ */

function poster(ctx, x, y, s){
  const wdt = s, hgt = s * 1.3;
  roundRect(ctx, x - wdt / 2, y - hgt / 2, wdt, hgt, s * .06);
  ctx.fillStyle = '#8b5e3c'; ctx.fill();
  roundRect(ctx, x - wdt / 2 + s * .05, y - hgt / 2 + s * .05, wdt - s * .1, hgt - s * .1, s * .04);
  const g = ctx.createLinearGradient(x, y - hgt / 2, x, y + hgt / 2);
  g.addColorStop(0, '#ffe6f2'); g.addColorStop(1, '#e2f1ff');
  ctx.fillStyle = g; ctx.fill();
  // a big cupcake on it
  ctx.font = `${s * .55}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🧁', x, y - s * .08);
  ctx.fillStyle = alpha('#c93f76', .8);
  ctx.fillRect(x - wdt * .3, y + hgt * .22, wdt * .6, s * .045);
}

function clock(ctx, x, y, s, t){
  const r = s * .5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = '#8b5e3c'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r * .84, 0, TAU);
  ctx.fillStyle = '#fffdf8'; ctx.fill();
  ctx.strokeStyle = 'rgba(90,60,80,.5)';
  ctx.lineWidth = Math.max(1, r * .05);
  for (let i = 0; i < 12; i++){
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * .72, y + Math.sin(a) * r * .72);
    ctx.lineTo(x + Math.cos(a) * r * .62, y + Math.sin(a) * r * .62);
    ctx.stroke();
  }
  // hands that actually turn
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#4b3346';
  ctx.lineWidth = Math.max(1.5, r * .09);
  const hh = t * .05, mm = t * .6;
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(hh - Math.PI / 2) * r * .38, y + Math.sin(hh - Math.PI / 2) * r * .38);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, r * .06);
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(mm - Math.PI / 2) * r * .6, y + Math.sin(mm - Math.PI / 2) * r * .6);
  ctx.stroke();
  ctx.fillStyle = '#e0417b';
  ctx.beginPath(); ctx.arc(x, y, r * .09, 0, TAU); ctx.fill();
}

function neon(ctx, x, y, s, t){
  const pulse = .72 + Math.abs(Math.sin(t * 1.4)) * .28;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 1, x, y, s * .9);
  g.addColorStop(0, `rgba(255,140,200,${.24 * pulse})`);
  g.addColorStop(1, 'rgba(255,140,200,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, s * .9, 0, TAU); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = `rgba(255,120,190,${pulse})`;
  ctx.lineWidth = Math.max(2, s * .07);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255,120,190,.9)';
  ctx.shadowBlur = s * .3;
  // a heart in neon tubing
  const r = s * .38;
  ctx.beginPath();
  ctx.moveTo(x, y + r * .75);
  ctx.bezierCurveTo(x - r * 1.4, y - r * .2, x - r * .5, y - r * 1.1, x, y - r * .35);
  ctx.bezierCurveTo(x + r * .5, y - r * 1.1, x + r * 1.4, y - r * .2, x, y + r * .75);
  ctx.stroke();
  ctx.restore();
}

/* ══════════════ on the floor ══════════════ */

function plant(ctx, x, y, s, t){
  const potW = s * .5, potH = s * .42;
  // pot
  ctx.beginPath();
  ctx.moveTo(x - potW / 2, y - potH);
  ctx.lineTo(x + potW / 2, y - potH);
  ctx.lineTo(x + potW * .38, y);
  ctx.lineTo(x - potW * .38, y);
  ctx.closePath();
  const g = ctx.createLinearGradient(x - potW / 2, 0, x + potW / 2, 0);
  g.addColorStop(0, '#d98a6a'); g.addColorStop(.4, '#f2b294'); g.addColorStop(1, '#c07050');
  ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = alpha('#8b4b34', .5);
  ctx.fillRect(x - potW / 2, y - potH, potW, s * .06);

  // leaves
  for (let i = 0; i < 7; i++){
    const a = -Math.PI / 2 + (i - 3) * .34 + Math.sin(t * .8 + i) * .05;
    const len = s * (.5 + (i % 2) * .18);
    ctx.save();
    ctx.translate(x, y - potH);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, -len / 2, s * .09, len / 2, 0, 0, TAU);
    ctx.fillStyle = i % 2 ? '#4fae7c' : '#63c78f';
    ctx.fill();
    ctx.restore();
  }
}

function gumball(ctx, x, y, s){
  const r = s * .34;
  // stand
  ctx.fillStyle = '#b9b0bb';
  roundRect(ctx, x - s * .1, y - s * .5, s * .2, s * .5, s * .04); ctx.fill();
  ctx.fillStyle = '#8d8496';
  roundRect(ctx, x - s * .22, y - s * .07, s * .44, s * .07, s * .03); ctx.fill();
  // base
  ctx.fillStyle = '#e0417b';
  roundRect(ctx, x - s * .3, y - s * .72, s * .6, s * .24, s * .05); ctx.fill();
  // glass globe with sweets inside
  ctx.beginPath(); ctx.arc(x, y - s * .95, r, 0, TAU);
  ctx.fillStyle = 'rgba(226,241,255,.55)'; ctx.fill();
  const rng = rngFrom('gum');
  const cols = ['#ff8ec0', '#ffcf47', '#48cfa6', '#5aabff', '#9a6bff'];
  for (let i = 0; i < 16; i++){
    const a = rng() * TAU, rr = Math.sqrt(rng()) * r * .8;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * rr, y - s * .95 + Math.sin(a) * rr, r * .17, 0, TAU);
    ctx.fillStyle = cols[i % 5]; ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  ctx.lineWidth = Math.max(1.5, s * .035);
  ctx.beginPath(); ctx.arc(x, y - s * .95, r, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#e0417b';
  ctx.beginPath(); ctx.arc(x, y - s * 1.3, r * .22, 0, TAU); ctx.fill();
}

function lamp(ctx, x, y, s){
  ctx.fillStyle = '#8d8496';
  roundRect(ctx, x - s * .18, y - s * .07, s * .36, s * .07, s * .03); ctx.fill();
  ctx.strokeStyle = '#a99fa7';
  ctx.lineWidth = Math.max(2, s * .05);
  ctx.beginPath(); ctx.moveTo(x, y - s * .07); ctx.lineTo(x, y - s * 1.0); ctx.stroke();
  // shade
  ctx.beginPath();
  ctx.moveTo(x - s * .3, y - s * .98);
  ctx.lineTo(x + s * .3, y - s * .98);
  ctx.lineTo(x + s * .2, y - s * 1.34);
  ctx.lineTo(x - s * .2, y - s * 1.34);
  ctx.closePath();
  const g = ctx.createLinearGradient(x - s * .3, 0, x + s * .3, 0);
  g.addColorStop(0, '#ffd9a8'); g.addColorStop(.45, '#fff0d0'); g.addColorStop(1, '#f2bd82');
  ctx.fillStyle = g; ctx.fill();
  // pool of light
  const lg = ctx.createRadialGradient(x, y - s * .95, 1, x, y - s * .95, s * 1.1);
  lg.addColorStop(0, 'rgba(255,225,150,.20)');
  lg.addColorStop(1, 'rgba(255,225,150,0)');
  ctx.fillStyle = lg;
  ctx.beginPath(); ctx.arc(x, y - s * .95, s * 1.1, 0, TAU); ctx.fill();
}

/* ══════════════ on the counter ══════════════ */

function cakestand(ctx, x, y, s){
  ctx.fillStyle = '#e6e0ea';
  roundRect(ctx, x - s * .26, y - s * .06, s * .52, s * .06, s * .03); ctx.fill();
  ctx.fillStyle = '#d8d2e2';
  ctx.fillRect(x - s * .05, y - s * .3, s * .1, s * .24);
  // plate
  ctx.beginPath();
  ctx.ellipse(x, y - s * .32, s * .42, s * .1, 0, 0, TAU);
  ctx.fillStyle = '#fffdf8'; ctx.fill();
  ctx.strokeStyle = alpha('#c9a184', .5); ctx.lineWidth = Math.max(1, s * .02); ctx.stroke();
  // cakes
  ctx.font = `${s * .3}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('🍰', x - s * .16, y - s * .33);
  ctx.fillText('🧁', x + s * .16, y - s * .33);
  // glass dome
  ctx.beginPath();
  ctx.ellipse(x, y - s * .34, s * .38, s * .46, 0, Math.PI, TAU);
  ctx.fillStyle = 'rgba(226,241,255,.32)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(1, s * .022); ctx.stroke();
}

function tipjar(ctx, x, y, s){
  const jw = s * .34, jh = s * .42;
  roundRect(ctx, x - jw / 2, y - jh, jw, jh, s * .05);
  ctx.fillStyle = 'rgba(226,241,255,.55)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(1, s * .025); ctx.stroke();
  // coins inside
  const cols = ['#ffd166', '#ffc94d', '#e0a13c'];
  for (let i = 0; i < 6; i++){
    ctx.beginPath();
    ctx.ellipse(x - jw * .22 + (i % 3) * jw * .22, y - s * .06 - Math.floor(i / 3) * s * .06,
                s * .055, s * .028, 0, 0, TAU);
    ctx.fillStyle = cols[i % 3]; ctx.fill();
  }
  // lid + label
  ctx.fillStyle = '#c9a184';
  roundRect(ctx, x - jw * .58, y - jh - s * .05, jw * 1.16, s * .06, s * .02); ctx.fill();
  ctx.fillStyle = alpha('#e0417b', .85);
  ctx.fillRect(x - jw * .34, y - jh * .62, jw * .68, s * .07);
}

function vase(ctx, x, y, s, t){
  const vw = s * .26, vh = s * .38;
  ctx.beginPath();
  ctx.moveTo(x - vw / 2, y - vh);
  ctx.quadraticCurveTo(x - vw * .8, y - vh * .4, x - vw * .42, y);
  ctx.lineTo(x + vw * .42, y);
  ctx.quadraticCurveTo(x + vw * .8, y - vh * .4, x + vw / 2, y - vh);
  ctx.closePath();
  const g = ctx.createLinearGradient(x - vw, 0, x + vw, 0);
  g.addColorStop(0, '#9ad6f0'); g.addColorStop(.45, '#d6f2fb'); g.addColorStop(1, '#7ec2df');
  ctx.fillStyle = g; ctx.fill();

  // flowers
  const cols = ['#ff8ec0', '#ffcf47', '#f2a0d4'];
  for (let i = 0; i < 3; i++){
    const a = -Math.PI / 2 + (i - 1) * .42 + Math.sin(t * .7 + i) * .04;
    const len = s * (.42 + (i === 1 ? .12 : 0));
    const fx = x + Math.cos(a) * len, fy = y - vh + Math.sin(a) * len;
    ctx.strokeStyle = '#4fae7c';
    ctx.lineWidth = Math.max(1.2, s * .022);
    ctx.beginPath();
    ctx.moveTo(x, y - vh); ctx.quadraticCurveTo(x, y - vh - len * .5, fx, fy);
    ctx.stroke();
    for (let p = 0; p < 5; p++){
      const pa = (p / 5) * TAU;
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(pa) * s * .05, fy + Math.sin(pa) * s * .05,
                  s * .045, s * .032, pa, 0, TAU);
      ctx.fillStyle = cols[i]; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(fx, fy, s * .033, 0, TAU);
    ctx.fillStyle = '#ffe9a8'; ctx.fill();
  }
}
