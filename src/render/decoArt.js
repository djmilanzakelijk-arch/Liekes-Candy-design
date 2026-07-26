/* ============================================================
   Decoration art. Every function draws centred on (0,0) inside a
   roughly 200×200 local box (nominal radius 100), so the compositor
   can translate / rotate / scale freely.
      draw(ctx, { c, t, rng, glyph })
   where `c` is the resolved colour object and `t` is time in seconds.
   ============================================================ */

import { mix, alpha, roundRect, heartPath, starPath, bead, specular, gloss, domeFill } from './shade.js';
import { TAU, rngFrom } from '../core/utils.js';

/* ── ICING ──────────────────────────────────────────── */
function icingSwirl(ctx, { c }){
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [w, col] of [[52, c.dark], [44, c.base], [22, mix(c.light, '#fff', .5)]]){
    ctx.lineWidth = w; ctx.strokeStyle = col;
    ctx.beginPath();
    for (let i = 0; i <= 70; i++){
      const p = i / 70;
      const a = p * Math.PI * 3.1 - Math.PI / 2;
      const r = 78 * (1 - p * .88);
      const x = Math.cos(a) * r, y = Math.sin(a) * r * .82 - p * 34;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  specular(ctx, -22, -46, 18, .8);
  ctx.restore();
}

function drizzle(ctx, { c }){
  ctx.save();
  ctx.lineCap = 'round';
  for (const [w, col, off] of [[26, alpha(c.dark, .55), 5], [20, c.base, 0], [7, alpha('#ffffff', .45), -6]]){
    ctx.lineWidth = w; ctx.strokeStyle = col;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++){
      const p = i / 60;
      const x = -105 + p * 210;
      const y = Math.sin(p * Math.PI * 3.4) * 34 + off;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function glaze(ctx, { c }){
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 90; i++){
    const a = (i / 90) * TAU;
    const r = 92 + Math.sin(a * 6) * 9 + Math.sin(a * 2.6 + .6) * 14;
    const x = Math.cos(a) * r, y = Math.sin(a) * r * .82 + (Math.sin(a) > 0 ? Math.sin(a * 8) * 12 : 0);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = domeFill(ctx, c.id, 0, 0, 100);
  ctx.fill();
  ctx.globalAlpha = .5;
  gloss(ctx, -28, -34, 46, 26, -.5, .9);
  ctx.restore();
}

function icingDots(ctx, { c }){
  for (let i = 0; i < 5; i++) bead(ctx, -80 + i * 40, Math.sin(i * 1.3) * 8, 21, c.id);
}

function caramelPool(ctx, { c, rng }){
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 80; i++){
    const a = (i / 80) * TAU;
    const r = 84 + Math.sin(a * 3.1) * 14 + Math.sin(a * 7) * 7;
    const drip = Math.sin(a) > .5 ? Math.pow(Math.sin(a), 6) * 32 : 0;
    const x = Math.cos(a) * r, y = Math.sin(a) * r * .74 + drip;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(-24, -26, 8, 0, 0, 110);
  g.addColorStop(0, '#ffd98a'); g.addColorStop(.5, '#e0a13c'); g.addColorStop(1, '#a46a16');
  ctx.fillStyle = g; ctx.fill();
  // salt flakes
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 10; i++){
    const a = rng() * TAU, r = Math.sqrt(rng()) * 70;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r * .7, rng() * 4 + 2, 0, TAU); ctx.fill();
  }
  gloss(ctx, -22, -28, 44, 20, -.4, .7);
  ctx.restore();
}

/* ── SPRINKLES ──────────────────────────────────────── */
const SPRINKLE_HUES = ['#ff6b8b','#ffcf47','#5aabff','#48cfa6','#9a6bff','#ff9a4d','#ffffff'];

function sprinkles(ctx, { c, rng }){
  ctx.save();
  for (let i = 0; i < 26; i++){
    const a = rng() * TAU, r = Math.sqrt(rng()) * 92;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rng() * TAU);
    const col = c.kind === 'rainbow' ? SPRINKLE_HUES[Math.floor(rng() * SPRINKLE_HUES.length)]
                                     : (rng() < .3 ? c.light : c.base);
    ctx.fillStyle = col;
    roundRect(ctx, -16, -5.5, 32, 11, 5.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    roundRect(ctx, -13, -4.5, 22, 3.6, 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function nonpareil(ctx, { c, rng }){
  for (let i = 0; i < 40; i++){
    const a = rng() * TAU, r = Math.sqrt(rng()) * 88;
    const col = c.kind === 'rainbow' ? SPRINKLE_HUES[Math.floor(rng() * SPRINKLE_HUES.length)] : c.base;
    const x = Math.cos(a) * r, y = Math.sin(a) * r, rad = 6 + rng() * 3;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.arc(x - rad * .3, y - rad * .35, rad * .34, 0, TAU); ctx.fill();
  }
}

function nuts(ctx, { c, rng }){
  for (let i = 0; i < 22; i++){
    const a = rng() * TAU, r = Math.sqrt(rng()) * 88;
    ctx.save();
    ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(rng() * TAU);
    const s = 9 + rng() * 8;
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * .72, 0, 0, TAU);
    const g = ctx.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, '#e0b184'); g.addColorStop(.55, '#b57a48'); g.addColorStop(1, '#7d4f28');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }
}

function berries(ctx, { rng }){
  for (let i = 0; i < 16; i++){
    const a = rng() * TAU, r = Math.sqrt(rng()) * 86;
    ctx.save();
    ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(rng() * TAU);
    const s = 11 + rng() * 9;
    ctx.beginPath();
    for (let k = 0; k <= 8; k++){
      const aa = (k / 8) * TAU;
      const rr = s * (.7 + (k % 2 ? .35 : 0));
      const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(-s * .3, -s * .3, 1, 0, 0, s);
    g.addColorStop(0, '#ff9aa8'); g.addColorStop(.6, '#e0417b'); g.addColorStop(1, '#8f1440');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }
}

function glitter(ctx, { c, rng, t }){
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++){
    const a = rng() * TAU, r = Math.sqrt(rng()) * 96;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    const ph = rng() * TAU;
    const tw = .35 + .65 * Math.abs(Math.sin(t * 2.4 + ph));
    const s = (7 + rng() * 9) * tw;
    const col = c.kind === 'rainbow' ? SPRINKLE_HUES[Math.floor(rng() * SPRINKLE_HUES.length)] : c.light;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ph);
    // four-point sparkle
    ctx.fillStyle = alpha(col, .95 * tw);
    ctx.beginPath();
    ctx.moveTo(0, -s * 2.4); ctx.quadraticCurveTo(s * .3, -s * .3, s * 2.4, 0);
    ctx.quadraticCurveTo(s * .3, s * .3, 0, s * 2.4);
    ctx.quadraticCurveTo(-s * .3, s * .3, -s * 2.4, 0);
    ctx.quadraticCurveTo(-s * .3, -s * .3, 0, -s * 2.4);
    ctx.fill();
    ctx.fillStyle = alpha('#ffffff', .8 * tw);
    ctx.beginPath(); ctx.arc(0, 0, s * .5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function starDust(ctx, { c, rng, t }){
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++){
    const ph = rng() * TAU;
    const orbit = 34 + rng() * 62;
    const spd = .35 + rng() * .5;
    const a = ph + t * spd;
    const x = Math.cos(a) * orbit, y = Math.sin(a) * orbit * .7;
    const s = 8 + rng() * 7;
    const tw = .5 + .5 * Math.sin(t * 3 + ph);
    ctx.fillStyle = alpha(c.kind === 'rainbow' ? SPRINKLE_HUES[i % 7] : c.light, .55 + .4 * tw);
    starPath(ctx, x, y, s * (.8 + .4 * tw), s * .38, 4, a);
    ctx.fill();
    // comet tail
    ctx.strokeStyle = alpha(c.base, .25);
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(Math.cos(a - .5) * orbit, Math.sin(a - .5) * orbit * .7); ctx.stroke();
  }
  ctx.restore();
}

/* ── RIBBONS ────────────────────────────────────────── */
function ribbon(ctx, { c }){
  ctx.save();
  const h = 44;
  const g = ctx.createLinearGradient(0, -h, 0, h);
  g.addColorStop(0, c.dark); g.addColorStop(.28, c.base);
  g.addColorStop(.46, mix(c.light, '#fff', .6));
  g.addColorStop(.7, c.base); g.addColorStop(1, c.dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-130, -h);
  ctx.quadraticCurveTo(0, -h - 12, 130, -h);
  ctx.lineTo(130, h);
  ctx.quadraticCurveTo(0, h + 12, -130, h);
  ctx.closePath(); ctx.fill();
  // stitched edges
  ctx.strokeStyle = alpha(c.dark, .5); ctx.lineWidth = 3;
  ctx.setLineDash([9, 8]);
  ctx.beginPath(); ctx.moveTo(-124, -h + 9); ctx.quadraticCurveTo(0, -h - 2, 124, -h + 9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-124, h - 9); ctx.quadraticCurveTo(0, h + 2, 124, h - 9); ctx.stroke();
  ctx.restore();
}

function bow(ctx, { c, velvet }){
  ctx.save();
  const loop = (dir) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(dir * 46, -74, dir * 128, -56, dir * 108, -6);
    ctx.bezierCurveTo(dir * 96, 34, dir * 40, 30, 0, 0);
    ctx.closePath();
  };
  const tail = (dir) => {
    ctx.beginPath();
    ctx.moveTo(dir * 6, 8);
    ctx.quadraticCurveTo(dir * 40, 54, dir * 30, 96);
    ctx.lineTo(dir * 60, 84);
    ctx.quadraticCurveTo(dir * 58, 44, dir * 22, 6);
    ctx.closePath();
  };
  const paint = (dir) => {
    const g = ctx.createLinearGradient(0, -60, dir * 110, 30);
    g.addColorStop(0, mix(c.light, '#fff', velvet ? .1 : .45));
    g.addColorStop(.45, c.base);
    g.addColorStop(1, c.dark);
    return g;
  };
  for (const dir of [-1, 1]){
    ctx.fillStyle = paint(dir); tail(dir); ctx.fill();
  }
  for (const dir of [-1, 1]){
    ctx.fillStyle = paint(dir); loop(dir); ctx.fill();
    ctx.strokeStyle = alpha(c.dark, .35); ctx.lineWidth = 4; ctx.stroke();
    if (!velvet){
      ctx.save(); loop(dir); ctx.clip();
      gloss(ctx, dir * 60, -40, 44, 18, dir * .45, .7);
      ctx.restore();
    }
  }
  // knot
  ctx.beginPath(); ctx.ellipse(0, 0, 28, 24, 0, 0, TAU);
  ctx.fillStyle = paint(1); ctx.fill();
  ctx.strokeStyle = alpha(c.dark, .45); ctx.lineWidth = 4; ctx.stroke();
  if (!velvet) specular(ctx, -8, -8, 12, .85);
  ctx.restore();
}

function lace(ctx, { c }){
  ctx.save();
  ctx.strokeStyle = alpha(mix(c.light, '#fff', .5), .95);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-130, -18); ctx.lineTo(130, -18);
  ctx.moveTo(-130, 18); ctx.lineTo(130, 18);
  ctx.stroke();
  for (let i = -6; i <= 6; i++){
    const x = i * 21;
    ctx.beginPath(); ctx.arc(x, -18, 11, Math.PI, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 10, 18, 11, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, 0, 5, 0, TAU); ctx.stroke();
  }
  ctx.fillStyle = alpha(c.base, .22);
  ctx.fillRect(-130, -18, 260, 36);
  ctx.restore();
}

function silkWrap(ctx, { c, t }){
  ctx.save();
  ctx.globalAlpha = .5;
  ctx.beginPath();
  for (let i = 0; i <= 80; i++){
    const a = (i / 80) * TAU;
    const r = 118 + Math.sin(a * 3 + t * .6) * 12;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(-120, -120, 120, 120);
  g.addColorStop(0, alpha(c.light, .8));
  g.addColorStop(.35, alpha('#ffffff', .55));
  g.addColorStop(.6, alpha(c.base, .5));
  g.addColorStop(1, alpha(c.light, .75));
  ctx.fillStyle = g; ctx.fill();
  // moving shimmer band
  ctx.save(); ctx.clip();
  const sx = Math.sin(t * .8) * 130;
  const sg = ctx.createLinearGradient(sx - 60, -130, sx + 60, 130);
  sg.addColorStop(0, 'rgba(255,255,255,0)');
  sg.addColorStop(.5, 'rgba(255,255,255,.55)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(-140, -140, 280, 280);
  ctx.restore();
  ctx.restore();
}

function twine(ctx){
  ctx.save();
  ctx.lineCap = 'round';
  for (const off of [-8, 8]){
    ctx.strokeStyle = off < 0 ? '#c9a184' : '#8b5e3c';
    ctx.lineWidth = 11;
    ctx.beginPath();
    for (let i = 0; i <= 50; i++){
      const p = i / 50, x = -120 + p * 240;
      ctx.lineTo(x, Math.sin(p * Math.PI * 9) * 7 + off * .5);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/* ── FLOWERS ────────────────────────────────────────── */
function rose(ctx, { c }){
  ctx.save();
  for (let layer = 4; layer >= 0; layer--){
    const r = 26 + layer * 17;
    const petals = 5 + layer;
    for (let i = 0; i < petals; i++){
      const a = (i / petals) * TAU + layer * .5;
      ctx.save(); ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, -r * .62, r * .52, r * .68, 0, 0, TAU);
      const g = ctx.createLinearGradient(0, -r * 1.2, 0, 0);
      g.addColorStop(0, layer > 2 ? c.dark : mix(c.light, '#fff', .3));
      g.addColorStop(1, c.base);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = alpha(c.dark, .3); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
    }
  }
  ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU);
  ctx.fillStyle = mix(c.dark, '#000', .15); ctx.fill();
  specular(ctx, -20, -22, 16, .6);
  ctx.restore();
}

function daisy(ctx, { c }){
  ctx.save();
  for (let i = 0; i < 6; i++){
    ctx.save(); ctx.rotate((i / 6) * TAU);
    ctx.beginPath(); ctx.ellipse(0, -56, 26, 44, 0, 0, TAU);
    const g = ctx.createLinearGradient(0, -100, 0, 0);
    g.addColorStop(0, mix(c.light, '#fff', .55)); g.addColorStop(1, c.base);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = alpha(c.dark, .28); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
  bead(ctx, 0, 0, 24, 'yellow');
  ctx.restore();
}

function blossom(ctx, { c }){
  ctx.save();
  for (let i = 0; i < 5; i++){
    ctx.save(); ctx.rotate((i / 5) * TAU);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-34, -40, -24, -84, 0, -74);
    ctx.bezierCurveTo(24, -84, 34, -40, 0, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -80, 0, 0);
    g.addColorStop(0, mix(c.light, '#fff', .6)); g.addColorStop(1, c.base);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = alpha(mix(c.dark, '#fff', .3), .9);
  for (let i = 0; i < 6; i++){
    const a = (i / 6) * TAU;
    ctx.beginPath(); ctx.arc(Math.cos(a) * 13, Math.sin(a) * 13, 5, 0, TAU); ctx.fill();
  }
  bead(ctx, 0, 0, 12, 'yellow');
  ctx.restore();
}

function leaf(ctx, { c }){
  ctx.save(); ctx.rotate(-.4);
  ctx.beginPath();
  ctx.moveTo(-72, 22);
  ctx.quadraticCurveTo(-10, -70, 76, -20);
  ctx.quadraticCurveTo(6, 44, -72, 22);
  ctx.closePath();
  const g = ctx.createLinearGradient(-72, 22, 76, -20);
  g.addColorStop(0, c.dark); g.addColorStop(.5, c.base); g.addColorStop(1, mix(c.light, '#fff', .3));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = alpha(c.dark, .55); ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(-66, 20); ctx.quadraticCurveTo(0, -6, 70, -18); ctx.stroke();
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++){
    const p = i / 5;
    const bx = -66 + p * 136, by = 20 - p * 38 + Math.sin(p * 3) * 4;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 12, by - 20); ctx.stroke();
  }
  ctx.restore();
}

function bouquet(ctx, { c, rng }){
  ctx.save();
  // wrapping cone
  ctx.beginPath();
  ctx.moveTo(-58, 10); ctx.lineTo(0, 104); ctx.lineTo(58, 10); ctx.closePath();
  const wg = ctx.createLinearGradient(-58, 10, 58, 104);
  wg.addColorStop(0, '#fffdf8'); wg.addColorStop(1, '#e8dcd0');
  ctx.fillStyle = wg; ctx.fill();
  ctx.strokeStyle = 'rgba(150,120,130,.35)'; ctx.lineWidth = 3; ctx.stroke();
  // blooms
  const spots = [[-46,-30,.75],[0,-56,.95],[46,-28,.75],[-22,4,.6],[24,2,.6]];
  for (const [x, y, s] of spots){
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(rng() * TAU);
    rose(ctx, { c });
    ctx.restore();
  }
  ctx.restore();
}

function orchid(ctx, { c, t }){
  ctx.save();
  const pulse = 1 + Math.sin(t * 1.6) * .04;
  ctx.scale(pulse, pulse);
  for (let i = 0; i < 5; i++){
    ctx.save(); ctx.rotate((i / 5) * TAU + .3);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-40, -46, -30, -96, 0, -88);
    ctx.bezierCurveTo(30, -96, 40, -46, 0, -6);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -92, 0, 0);
    g.addColorStop(0, '#fff3c4'); g.addColorStop(.5, '#ffc94d'); g.addColorStop(1, '#8a5c05');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,10,.4)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
  bead(ctx, 0, 0, 20, 'gold');
  ctx.globalCompositeOperation = 'lighter';
  const glow = .3 + .3 * Math.sin(t * 2);
  ctx.fillStyle = `rgba(255,220,120,${glow * .35})`;
  ctx.beginPath(); ctx.arc(0, 0, 96, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ── CHARMS ─────────────────────────────────────────── */
function pearls(ctx, { c }){
  for (let i = 0; i < 7; i++){
    const x = -84 + i * 28;
    bead(ctx, x, Math.sin(i * .9) * 10, 17, c.id);
  }
}

function heartCharm(ctx, { c }){
  heartPath(ctx, 0, 4, 150, 132);
  const g = ctx.createLinearGradient(-70, -60, 70, 70);
  g.addColorStop(0, mix(c.light, '#fff', .5)); g.addColorStop(.5, c.base); g.addColorStop(1, c.dark);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = alpha(c.dark, .45); ctx.lineWidth = 5; ctx.stroke();
  specular(ctx, -28, -22, 22, .9);
  gloss(ctx, -22, -14, 32, 20, -.5, .5);
}

function starCharm(ctx, { c }){
  starPath(ctx, 0, 0, 92, 40, 5);
  const g = ctx.createLinearGradient(0, -92, 0, 92);
  g.addColorStop(0, mix(c.light, '#fff', .55)); g.addColorStop(.5, c.base); g.addColorStop(1, c.dark);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = alpha(c.dark, .45); ctx.lineWidth = 5; ctx.stroke();
  starPath(ctx, 0, 0, 46, 20, 5);
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fill();
  specular(ctx, -18, -34, 18, .9);
}

function gem(ctx, { c, t }){
  ctx.save();
  const facets = 6;
  starPath(ctx, 0, 0, 84, 84, facets, -Math.PI / 2);
  const g = ctx.createLinearGradient(-80, -80, 80, 80);
  g.addColorStop(0, mix(c.light, '#fff', .6)); g.addColorStop(.5, c.base); g.addColorStop(1, c.dark);
  ctx.fillStyle = g; ctx.fill();
  // facet lines
  ctx.strokeStyle = alpha('#ffffff', .45); ctx.lineWidth = 3;
  for (let i = 0; i < facets; i++){
    const a = -Math.PI / 2 + (i / facets) * TAU;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 84, Math.sin(a) * 84); ctx.stroke();
  }
  ctx.strokeStyle = alpha(c.dark, .5); ctx.lineWidth = 4;
  starPath(ctx, 0, 0, 84, 84, facets, -Math.PI / 2); ctx.stroke();
  starPath(ctx, 0, 0, 40, 40, facets, -Math.PI / 2);
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fill();
  // travelling glint
  ctx.globalCompositeOperation = 'lighter';
  const a = t * 1.4;
  specular(ctx, Math.cos(a) * 34, Math.sin(a) * 34, 26, .55);
  ctx.restore();
}

function diamond(ctx, { t }){
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -88); ctx.lineTo(64, -26); ctx.lineTo(0, 92); ctx.lineTo(-64, -26); ctx.closePath();
  const g = ctx.createLinearGradient(-64, -88, 64, 92);
  g.addColorStop(0, '#ffffff'); g.addColorStop(.35, '#dce8f7');
  g.addColorStop(.6, '#a8bdd4'); g.addColorStop(1, '#eaf3ff');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(120,150,180,.6)'; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-64, -26); ctx.lineTo(64, -26);
  ctx.moveTo(-32, -26); ctx.lineTo(0, -88); ctx.lineTo(32, -26); ctx.lineTo(0, 92);
  ctx.moveTo(-32, -26); ctx.lineTo(0, 92);
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  const tw = .4 + .6 * Math.abs(Math.sin(t * 2.2));
  specular(ctx, -18, -44, 24 * tw, .9);
  starPath(ctx, 26, -50, 30 * tw, 5, 4, .4);
  ctx.fillStyle = `rgba(255,255,255,${.7 * tw})`; ctx.fill();
  ctx.restore();
}

function crown(ctx, { t }){
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-86, 44);
  ctx.lineTo(-86, -18); ctx.lineTo(-46, 12); ctx.lineTo(0, -52);
  ctx.lineTo(46, 12); ctx.lineTo(86, -18); ctx.lineTo(86, 44);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -52, 0, 44);
  g.addColorStop(0, '#fff3c4'); g.addColorStop(.35, '#ffc94d');
  g.addColorStop(.7, '#e0a13c'); g.addColorStop(1, '#8a5c05');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(120,80,10,.55)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#e0417b';
  [[-46, 26], [0, 26], [46, 26]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.fill(); });
  ctx.globalCompositeOperation = 'lighter';
  const tw = .3 + .7 * Math.abs(Math.sin(t * 1.8));
  specular(ctx, -30, -6, 26 * tw, .8);
  ctx.restore();
}

function butterfly(ctx, { c, t }){
  ctx.save();
  const flap = Math.sin(t * 3.4);
  for (const dir of [-1, 1]){
    ctx.save();
    ctx.scale(dir * (0.55 + 0.45 * Math.abs(Math.cos(flap * .6))), 1);
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.bezierCurveTo(52, -78, 108, -60, 92, -12);
    ctx.bezierCurveTo(84, 14, 40, 12, 4, 0);
    ctx.closePath();
    const g1 = ctx.createLinearGradient(0, -60, 92, 10);
    g1.addColorStop(0, mix(c.light, '#fff', .5)); g1.addColorStop(1, c.base);
    ctx.fillStyle = g1; ctx.fill();
    ctx.strokeStyle = alpha(c.dark, .5); ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.bezierCurveTo(44, 26, 78, 44, 58, 74);
    ctx.bezierCurveTo(40, 92, 12, 44, 4, 4);
    ctx.closePath();
    ctx.fillStyle = alpha(c.dark, .85); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#3a2f38';
  roundRect(ctx, -7, -34, 14, 88, 7); ctx.fill();
  ctx.strokeStyle = '#3a2f38'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, -32); ctx.quadraticCurveTo(-22, -60, -30, -54); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -32); ctx.quadraticCurveTo(22, -60, 30, -54); ctx.stroke();
  ctx.restore();
}

function cherry(ctx){
  ctx.save();
  ctx.strokeStyle = '#5f8f3a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(6, -14); ctx.quadraticCurveTo(26, -66, 54, -78); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 20, 52, 0, TAU);
  const g = ctx.createRadialGradient(-18, 2, 6, 0, 20, 56);
  g.addColorStop(0, '#ff8fa0'); g.addColorStop(.5, '#e2334a'); g.addColorStop(1, '#8f1024');
  ctx.fillStyle = g; ctx.fill();
  specular(ctx, -18, 2, 16, .95);
  ctx.restore();
}

/* ── STICKERS & TOPPERS ─────────────────────────────── */
function sticker(ctx, { c, glyph }){
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 24; i++){
    const a = (i / 24) * TAU;
    const r = 78 + Math.sin(a * 12) * 7;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(-70, -70, 70, 70);
  g.addColorStop(0, '#ffffff'); g.addColorStop(.5, mix(c.light, '#fff', .5)); g.addColorStop(1, c.base);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = alpha(c.dark, .35); ctx.lineWidth = 4; ctx.stroke();
  ctx.font = '78px system-ui, "Apple Color Emoji","Segoe UI Emoji"';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(glyph || '⭐', 0, 6);
  gloss(ctx, -26, -30, 34, 20, -.5, .55);
  ctx.restore();
}

function candle(ctx, { c, t }){
  ctx.save();
  // body
  roundRect(ctx, -18, -20, 36, 116, 8);
  const g = ctx.createLinearGradient(-18, 0, 18, 0);
  g.addColorStop(0, c.dark); g.addColorStop(.4, c.base); g.addColorStop(.6, mix(c.light, '#fff', .5)); g.addColorStop(1, c.dark);
  ctx.fillStyle = g; ctx.fill();
  // stripes
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 7;
  for (let i = 0; i < 4; i++){
    ctx.beginPath(); ctx.moveTo(-18, -6 + i * 28); ctx.lineTo(18, -18 + i * 28); ctx.stroke();
  }
  // wick + flame
  ctx.strokeStyle = '#3a2f38'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -34); ctx.stroke();
  const flick = Math.sin(t * 9) * 4, h = 46 + Math.sin(t * 6.3) * 6;
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.bezierCurveTo(22 + flick, -46, 14, -32 - h, 0 + flick * .5, -34 - h);
  ctx.bezierCurveTo(-14, -32 - h, -22 + flick, -46, 0, -32);
  const fg = ctx.createLinearGradient(0, -34 - h, 0, -32);
  fg.addColorStop(0, '#fff8d0'); fg.addColorStop(.4, '#ffc94d'); fg.addColorStop(1, '#ff7a2e');
  ctx.fillStyle = fg; ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(255,190,80,.22)';
  ctx.beginPath(); ctx.arc(0, -48, 54, 0, TAU); ctx.fill();
  ctx.restore();
}

function wafer(ctx){
  ctx.save(); ctx.rotate(-.5);
  roundRect(ctx, -22, -92, 44, 184, 20);
  const g = ctx.createLinearGradient(-22, 0, 22, 0);
  g.addColorStop(0, '#8b5e3c'); g.addColorStop(.35, '#d8ad7e'); g.addColorStop(.7, '#b9855a'); g.addColorStop(1, '#6d4527');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(80,50,25,.35)'; ctx.lineWidth = 2.5;
  for (let i = -4; i <= 4; i++){
    ctx.beginPath(); ctx.moveTo(-20, i * 22); ctx.lineTo(20, i * 22 - 8); ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(0, -92, 22, 9, 0, 0, TAU);
  ctx.fillStyle = '#e6c39a'; ctx.fill();
  ctx.restore();
}

function macaron(ctx, { c }){
  ctx.save();
  const shell = (y) => {
    ctx.beginPath();
    ctx.ellipse(0, y, 78, 40, 0, 0, TAU);
    ctx.fillStyle = domeFill(ctx, c.id, 0, y, 80);
    ctx.fill();
  };
  shell(34); shell(-34);
  // filling
  ctx.beginPath();
  ctx.moveTo(-72, -4);
  for (let i = 0; i <= 12; i++){
    const x = -72 + (i / 12) * 144;
    ctx.lineTo(x, -4 + (i % 2 ? 9 : -3));
  }
  ctx.lineTo(72, 12);
  for (let i = 12; i >= 0; i--){
    const x = -72 + (i / 12) * 144;
    ctx.lineTo(x, 12 + (i % 2 ? -3 : 9));
  }
  ctx.closePath();
  ctx.fillStyle = mix(c.light, '#fff', .55); ctx.fill();
  // ruffled "feet"
  ctx.fillStyle = alpha(c.dark, .3);
  for (const y of [-14, 22]){
    for (let i = 0; i < 9; i++){
      ctx.beginPath(); ctx.arc(-64 + i * 16, y, 8, 0, TAU); ctx.fill();
    }
  }
  gloss(ctx, -24, -46, 34, 14, -.35, .6);
  ctx.restore();
}

/* ── EVENT ART ──────────────────────────────────────── */
function pumpkin(ctx, { t }){
  ctx.save();
  for (const [ox, rx] of [[-42, 34], [42, 34], [-20, 44], [20, 44], [0, 50]]){
    ctx.beginPath(); ctx.ellipse(ox, 8, rx, 62, 0, 0, TAU);
    const g = ctx.createLinearGradient(ox - rx, 0, ox + rx, 0);
    g.addColorStop(0, '#c4611a'); g.addColorStop(.45, '#ff9a4d'); g.addColorStop(1, '#a84f10');
    ctx.fillStyle = g; ctx.fill();
  }
  ctx.strokeStyle = '#5f8f3a'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -52); ctx.quadraticCurveTo(10, -80, 30, -84); ctx.stroke();
  ctx.fillStyle = '#2a1608';
  ctx.beginPath(); ctx.moveTo(-30, -10); ctx.lineTo(-10, 6); ctx.lineTo(-30, 14); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(30, -10); ctx.lineTo(10, 6); ctx.lineTo(30, 14); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-34, 30);
  for (let i = 0; i <= 6; i++) ctx.lineTo(-34 + i * 11.3, 30 + (i % 2 ? 16 : 0));
  ctx.lineTo(34, 44); ctx.lineTo(-34, 44); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = `rgba(255,160,40,${.12 + .1 * Math.sin(t * 4)})`;
  ctx.beginPath(); ctx.arc(0, 8, 76, 0, TAU); ctx.fill();
  ctx.restore();
}

function web(ctx, { c }){
  ctx.save();
  ctx.strokeStyle = alpha(mix(c.light, '#fff', .4), .95);
  ctx.lineWidth = 5; ctx.lineCap = 'round';
  const spokes = 8;
  for (let i = 0; i < spokes; i++){
    const a = (i / spokes) * TAU;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 118, Math.sin(a) * 118); ctx.stroke();
  }
  for (let ring = 1; ring <= 4; ring++){
    const r = ring * 29;
    ctx.beginPath();
    for (let i = 0; i <= spokes; i++){
      const a = (i / spokes) * TAU;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (!i) ctx.moveTo(x, y);
      else {
        const pa = ((i - .5) / spokes) * TAU;
        ctx.quadraticCurveTo(Math.cos(pa) * r * .82, Math.sin(pa) * r * .82, x, y);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function snowflake(ctx, { c, t }){
  ctx.save();
  ctx.rotate(t * .4);
  ctx.strokeStyle = mix(c.light, '#fff', .6);
  ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.shadowColor = alpha(c.base, .8); ctx.shadowBlur = 14;
  for (let i = 0; i < 6; i++){
    ctx.save(); ctx.rotate((i / 6) * TAU);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -96); ctx.stroke();
    for (const [y, len] of [[-38, 26], [-62, 22], [-84, 16]]){
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(-len, y - len * .8);
      ctx.moveTo(0, y); ctx.lineTo(len, y - len * .8);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  bead(ctx, 0, 0, 13, c.id);
  ctx.restore();
}

function holly(ctx){
  ctx.save();
  for (const [rot, sx] of [[-.5, 1], [.5, -1]]){
    ctx.save(); ctx.rotate(rot); ctx.scale(sx, 1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(24, -18, 40, -8);
    ctx.quadraticCurveTo(52, -30, 66, -18);
    ctx.quadraticCurveTo(84, -26, 88, -4);
    ctx.quadraticCurveTo(70, 6, 74, 22);
    ctx.quadraticCurveTo(52, 20, 44, 34);
    ctx.quadraticCurveTo(28, 22, 0, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -26, 88, 34);
    g.addColorStop(0, '#7fe4c6'); g.addColorStop(.4, '#2e9e6b'); g.addColorStop(1, '#14603f');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(10,60,40,.4)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
  [[-16, 26], [14, 30], [0, 50]].forEach(([x, y]) => bead(ctx, x, y, 15, 'red'));
  ctx.restore();
}

function egg(ctx, { c, rng }){
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -96);
  ctx.bezierCurveTo(58, -76, 72, 6, 0, 92);
  ctx.bezierCurveTo(-72, 6, -58, -76, 0, -96);
  ctx.closePath();
  ctx.fillStyle = domeFill(ctx, c.id, 0, 0, 96);
  ctx.fill();
  ctx.save(); ctx.clip();
  for (let i = 0; i < 40; i++){
    ctx.fillStyle = alpha(c.dark, .18 + rng() * .3);
    ctx.beginPath();
    ctx.arc(rng() * 160 - 80, rng() * 200 - 100, rng() * 7 + 2, 0, TAU); ctx.fill();
  }
  // zig-zag band
  ctx.strokeStyle = mix(c.light, '#fff', .7); ctx.lineWidth = 9;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) ctx.lineTo(-80 + i * 16, (i % 2 ? -8 : 12));
  ctx.stroke();
  ctx.restore();
  gloss(ctx, -28, -44, 28, 42, -.3, .6);
  ctx.restore();
}

function shell(ctx, { c }){
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 66);
  ctx.arc(0, 66, 92, Math.PI, TAU);
  ctx.closePath();
  ctx.fillStyle = domeFill(ctx, c.id, 0, 40, 100);
  ctx.fill();
  ctx.strokeStyle = alpha(c.dark, .45); ctx.lineWidth = 4;
  for (let i = 0; i <= 6; i++){
    const a = Math.PI + (i / 6) * Math.PI;
    ctx.beginPath(); ctx.moveTo(0, 66);
    ctx.lineTo(Math.cos(a) * 92, 66 + Math.sin(a) * 92); ctx.stroke();
  }
  ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 66, 20, Math.PI, TAU); ctx.fillStyle = alpha(c.dark, .3); ctx.fill();
  gloss(ctx, -26, 22, 34, 24, -.3, .55);
  ctx.restore();
}

function balloon(ctx, { c, t }){
  ctx.save();
  ctx.translate(0, Math.sin(t * 1.4) * 5);
  ctx.rotate(Math.sin(t * .9) * .08);
  ctx.beginPath();
  ctx.ellipse(0, -22, 62, 76, 0, 0, TAU);
  ctx.fillStyle = domeFill(ctx, c.id, 0, -22, 76);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-12, 52); ctx.lineTo(12, 52); ctx.lineTo(0, 68); ctx.closePath();
  ctx.fillStyle = c.dark; ctx.fill();
  ctx.strokeStyle = alpha(c.dark, .55); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 68);
  ctx.bezierCurveTo(26, 92, -20, 110, 6, 132);
  ctx.stroke();
  specular(ctx, -22, -50, 18, .95);
  gloss(ctx, -20, -34, 20, 34, -.3, .5);
  ctx.restore();
}

/* ══════════════ registry ══════════════ */
export const DECO_ART = {
  icingSwirl, drizzle, glaze, icingDots, caramelPool,
  sprinkles, nonpareil, nuts, berries, glitter, starDust,
  ribbon, bow, lace, silkWrap, twine,
  rose, daisy, blossom, leaf, bouquet, orchid,
  pearls, heart: heartCharm, star: starCharm, gem, diamond, crown, butterfly, cherry,
  sticker, candle, wafer, macaron,
  pumpkin, web, snowflake, holly, egg, shell, balloon,
};

/**
 * Draw one decoration, already translated/rotated/scaled by the caller.
 */
export function drawDeco(ctx, art, opts){
  const fn = DECO_ART[art] || DECO_ART.star;
  ctx.save();
  fn(ctx, opts);
  ctx.restore();
}
