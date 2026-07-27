/* ============================================================
   Candy base shapes. Every function draws into a 1000×1000 space
   with the candy roughly centred.
      draw(ctx, { color, flavor, t })
   ============================================================ */

import {
  U, mix, alpha, linearFill, domeFill, dropShadow, gloss, specular,
  roundRect, heartPath, starPath, bead, clipped,
} from './shade.js';
import { getColor, FLAVOR_BY_ID } from '../data/palette.js';
import { TAU, rngFrom, clamp } from '../core/utils.js';

const flavorTint = id => FLAVOR_BY_ID[id]?.tint || '#8b5e3c';

/* ══════════════ CHOCOLATE BAR ══════════════ */
function bar(ctx, { color, flavor }){
  const x = 292, y = 205, w = 416, h = 590, r = 34;
  const c = getColor(color);

  dropShadow(ctx, 500, 815, 230, 44, .3);

  // slab
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = linearFill(ctx, color, x, y, x + w * .7, y + h);
  ctx.fill();

  // raised rim
  ctx.lineWidth = 16;
  ctx.strokeStyle = alpha(c.dark, .45);
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, r - 8);
  ctx.stroke();
  ctx.restore();

  // moulded squares
  const cols = 3, rows = 5;
  const pad = 30, gap = 12;
  const cw = (w - pad * 2 - gap * (cols - 1)) / cols;
  const ch = (h - pad * 2 - gap * (rows - 1)) / rows;
  for (let j = 0; j < rows; j++){
    for (let i = 0; i < cols; i++){
      const sx = x + pad + i * (cw + gap);
      const sy = y + pad + j * (ch + gap);
      // block face
      roundRect(ctx, sx, sy, cw, ch, 10);
      const g = ctx.createLinearGradient(sx, sy, sx + cw, sy + ch);
      g.addColorStop(0, alpha(c.light, .55));
      g.addColorStop(.5, 'rgba(255,255,255,0)');
      g.addColorStop(1, alpha(c.dark, .38));
      ctx.fillStyle = g; ctx.fill();
      // bevel: bright top-left edge, dark bottom-right
      ctx.lineWidth = 5;
      ctx.strokeStyle = alpha('#ffffff', .30);
      ctx.beginPath();
      ctx.moveTo(sx + 6, sy + ch - 6); ctx.lineTo(sx + 6, sy + 6); ctx.lineTo(sx + cw - 6, sy + 6);
      ctx.stroke();
      ctx.strokeStyle = alpha(c.dark, .40);
      ctx.beginPath();
      ctx.moveTo(sx + cw - 6, sy + 6); ctx.lineTo(sx + cw - 6, sy + ch - 6); ctx.lineTo(sx + 6, sy + ch - 6);
      ctx.stroke();
    }
  }

  // wide diagonal sheen
  clipped(ctx, () => roundRect(ctx, x, y, w, h, r), () => {
    gloss(ctx, x + w * .3, y + h * .26, w * .34, h * .3, -.5, .42);
    const g = ctx.createLinearGradient(x, y, x + w, y + h * .5);
    g.addColorStop(0, 'rgba(255,255,255,.22)');
    g.addColorStop(.35, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  });
  specular(ctx, x + 78, y + 66, 46, .6);
}

/* ══════════════ LOLLIPOP ══════════════ */
function lolli(ctx, { color, flavor }){
  const cx = 500, cy = 415, R = 238;
  const c = getColor(color);

  // stick
  dropShadow(ctx, 500, 880, 130, 26, .26);
  ctx.save();
  roundRect(ctx, cx - 26, cy, 52, 490, 26);
  const sg = ctx.createLinearGradient(cx - 26, 0, cx + 26, 0);
  sg.addColorStop(0, '#e6dcd2'); sg.addColorStop(.35, '#fffdfa');
  sg.addColorStop(.7, '#f4ece4'); sg.addColorStop(1, '#cdc2b6');
  ctx.fillStyle = sg; ctx.fill();
  ctx.restore();

  // head
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU);
  ctx.fillStyle = domeFill(ctx, color, cx, cy, R);
  ctx.fill();
  ctx.clip();

  // swirl — alternating cream bands spiralling out
  ctx.lineCap = 'round';
  ctx.lineWidth = R * .21;
  ctx.strokeStyle = alpha('#fffdf8', .92);
  for (const phase of [0, Math.PI]){
    ctx.beginPath();
    for (let i = 0; i <= 200; i++){
      const t = i / 200;
      const a = phase + t * Math.PI * 5.2;
      const rr = t * R * 1.16;
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    // tint the second pass so it reads as two flavours
    ctx.strokeStyle = alpha(mix(c.light, flavorTint(flavor), .45), .55);
  }

  // sugar sheen
  gloss(ctx, cx - R * .3, cy - R * .34, R * .48, R * .34, -.6, .6);
  ctx.restore();

  // rim + specular
  ctx.lineWidth = 12;
  ctx.strokeStyle = alpha(c.dark, .32);
  ctx.beginPath(); ctx.arc(cx, cy, R - 5, 0, TAU); ctx.stroke();
  specular(ctx, cx - R * .38, cy - R * .44, R * .24, .95);

  // little wrapper tie
  ctx.fillStyle = alpha(c.dark, .22);
  roundRect(ctx, cx - 34, cy + R - 22, 68, 40, 14); ctx.fill();
}

/* ══════════════ BONBON ══════════════ */
function bonbon(ctx, { color, flavor }){
  const cx = 500, cy = 545, R = 232;
  const c = getColor(color);
  dropShadow(ctx, 500, 790, 250, 46, .3);

  // fluted paper cup
  const cupTop = cy + 40, cupBot = 790, cupHalf = 268;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - cupHalf, cupTop);
  ctx.lineTo(cx - cupHalf * .78, cupBot);
  ctx.lineTo(cx + cupHalf * .78, cupBot);
  ctx.lineTo(cx + cupHalf, cupTop);
  ctx.closePath();
  const cg = ctx.createLinearGradient(cx - cupHalf, 0, cx + cupHalf, 0);
  cg.addColorStop(0, '#8a6a55'); cg.addColorStop(.5, '#c9a184'); cg.addColorStop(1, '#7b5b46');
  ctx.fillStyle = cg; ctx.fill();
  // pleats
  ctx.strokeStyle = 'rgba(70,44,28,.32)'; ctx.lineWidth = 6;
  for (let i = -4; i <= 4; i++){
    const tx = cx + i * cupHalf * .21;
    ctx.beginPath(); ctx.moveTo(tx, cupTop); ctx.lineTo(cx + i * cupHalf * .17, cupBot); ctx.stroke();
  }
  ctx.restore();

  // chocolate dome
  ctx.beginPath();
  ctx.ellipse(cx, cy, R, R * .92, 0, 0, TAU);
  ctx.fillStyle = domeFill(ctx, color, cx, cy, R);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = alpha(c.dark, .3);
  ctx.stroke();

  // piped curl on top
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = 34;
  ctx.strokeStyle = alpha(c.light, .95);
  ctx.beginPath();
  for (let i = 0; i <= 60; i++){
    const t = i / 60;
    const a = t * Math.PI * 2.6 - Math.PI / 2;
    const rr = 76 * (1 - t * .82);
    const px = cx + Math.cos(a) * rr, py = cy - R * .48 + Math.sin(a) * rr * .5 - t * 46;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = alpha('#ffffff', .35); ctx.lineWidth = 12;
  ctx.stroke();
  ctx.restore();

  gloss(ctx, cx - R * .28, cy - R * .3, R * .5, R * .3, -.5, .5);
  specular(ctx, cx - R * .4, cy - R * .42, R * .2, .9);
}

/* ══════════════ GUMMY BEAR ══════════════ */
function gummy(ctx, { color }){
  const c = getColor(color);
  const cx = 500, cy = 520;
  dropShadow(ctx, cx, 800, 190, 34, .26);

  ctx.save();
  ctx.globalAlpha = .93;

  const body = () => {
    ctx.beginPath();
    // ears
    ctx.arc(cx - 118, cy - 218, 58, 0, TAU);
    ctx.arc(cx + 118, cy - 218, 58, 0, TAU);
    // head
    ctx.moveTo(cx + 132, cy - 132);
    ctx.arc(cx, cy - 132, 132, 0, TAU);
    // torso
    ctx.moveTo(cx + 150, cy + 90);
    ctx.ellipse(cx, cy + 90, 150, 168, 0, 0, TAU);
    // arms
    ctx.moveTo(cx - 150, cy + 20);
    ctx.ellipse(cx - 176, cy + 34, 62, 88, .38, 0, TAU);
    ctx.moveTo(cx + 176, cy + 34);
    ctx.ellipse(cx + 176, cy + 34, 62, 88, -.38, 0, TAU);
    // legs
    ctx.moveTo(cx - 94, cy + 244);
    ctx.ellipse(cx - 88, cy + 234, 74, 62, .12, 0, TAU);
    ctx.moveTo(cx + 88, cy + 234);
    ctx.ellipse(cx + 88, cy + 234, 74, 62, -.12, 0, TAU);
  };

  body();
  ctx.fillStyle = domeFill(ctx, color, cx - 40, cy - 120, 380);
  ctx.fill();

  // translucent inner glow — gummies are lit from within
  ctx.save();
  body(); ctx.clip();
  const ig = ctx.createRadialGradient(cx + 40, cy + 120, 20, cx, cy, 380);
  ig.addColorStop(0, alpha(c.light, .75));
  ig.addColorStop(.6, alpha(c.base, .10));
  ig.addColorStop(1, alpha(c.dark, .40));
  ctx.fillStyle = ig; ctx.fillRect(0, 0, U, U);
  ctx.restore();

  ctx.restore();

  // face
  ctx.fillStyle = alpha(c.dark, .72);
  ctx.beginPath(); ctx.arc(cx - 48, cy - 158, 17, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 48, cy - 158, 17, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy - 96, 26, 20, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = alpha(c.dark, .5); ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy - 96, 42, .5, Math.PI - .5); ctx.stroke();

  // wet highlights
  gloss(ctx, cx - 56, cy - 190, 62, 40, -.5, .8);
  gloss(ctx, cx - 66, cy + 40, 46, 118, -.16, .45);
  specular(ctx, cx - 96, cy - 208, 26, .95);
}

/* ══════════════ MARSHMALLOW ══════════════ */
function marsh(ctx, { color, flavor }){
  const x = 288, y = 320, w = 424, h = 400;
  const c = getColor(color);
  dropShadow(ctx, 500, 740, 210, 40, .26);

  // body
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + 40);
  ctx.lineTo(x, y + h - 60);
  ctx.ellipse(x + w / 2, y + h - 60, w / 2, 66, 0, Math.PI, 0, true);
  ctx.lineTo(x + w, y + 40);
  ctx.closePath();
  ctx.fillStyle = linearFill(ctx, color, x, y, x + w, y + h);
  ctx.fill();
  ctx.restore();

  // top disc
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 40, w / 2, 72, 0, 0, TAU);
  const tg = ctx.createRadialGradient(x + w * .38, y + 14, 10, x + w / 2, y + 40, w / 2);
  tg.addColorStop(0, mix(c.light, '#ffffff', .7));
  tg.addColorStop(.65, c.light);
  tg.addColorStop(1, c.base);
  ctx.fillStyle = tg; ctx.fill();

  // powdered-sugar speckle
  const rng = rngFrom('marsh' + color);
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  for (let i = 0; i < 90; i++){
    const px = x + rng() * w, py = y + 30 + rng() * (h - 70);
    ctx.beginPath(); ctx.arc(px, py, rng() * 4 + 1, 0, TAU); ctx.fill();
  }

  // toasted edges
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const eg = ctx.createLinearGradient(x, 0, x + w, 0);
  eg.addColorStop(0, alpha(c.dark, .35));
  eg.addColorStop(.2, 'rgba(255,255,255,0)');
  eg.addColorStop(.8, 'rgba(255,255,255,0)');
  eg.addColorStop(1, alpha(c.dark, .35));
  ctx.fillStyle = eg; ctx.fillRect(x, y + 20, w, h - 40);
  ctx.restore();

  gloss(ctx, x + w * .3, y + h * .34, w * .28, h * .3, -.4, .38);
}

/* ══════════════ CANDY CANE ══════════════ */
function cane(ctx, { color }){
  const c = getColor(color);
  const half = 62;

  // centreline: straight shaft + hook over the top
  const pts = [];
  for (let i = 0; i <= 40; i++) pts.push([612, 880 - (i / 40) * 400]);         // shaft up
  for (let i = 1; i <= 46; i++){                                               // hook
    const a = (i / 46) * Math.PI;
    pts.push([500 + Math.cos(a) * 112, 480 - Math.sin(a) * 132]);
  }

  const outline = () => {
    ctx.beginPath();
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++){
      const p = pts[i];
      const q = pts[Math.min(i + 1, pts.length - 1)];
      const o = pts[Math.max(i - 1, 0)];
      const dx = q[0] - o[0], dy = q[1] - o[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len * half, ny = dx / len * half;
      left.push([p[0] + nx, p[1] + ny]);
      right.push([p[0] - nx, p[1] - ny]);
    }
    left.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    // round the far end
    const e = pts[pts.length - 1];
    ctx.arc(e[0], e[1], half, Math.atan2(left.at(-1)[1] - e[1], left.at(-1)[0] - e[0]),
            Math.atan2(right.at(-1)[1] - e[1], right.at(-1)[0] - e[0]));
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    const s = pts[0];
    ctx.arc(s[0], s[1], half, Math.atan2(right[0][1] - s[1], right[0][0] - s[0]),
            Math.atan2(left[0][1] - s[1], left[0][0] - s[0]));
    ctx.closePath();
  };

  dropShadow(ctx, 560, 880, 170, 30, .26);

  outline();
  ctx.fillStyle = '#fffcf7';
  ctx.fill();

  // barber stripes
  ctx.save();
  outline(); ctx.clip();
  ctx.strokeStyle = c.base;
  ctx.lineWidth = 42;
  for (let i = -14; i < 26; i++){
    const off = i * 96;
    ctx.beginPath();
    ctx.moveTo(200 + off, 950);
    ctx.lineTo(200 + off + 300, 180);
    ctx.stroke();
  }
  // thin accent stripe alongside each band
  ctx.strokeStyle = alpha(c.dark, .55);
  ctx.lineWidth = 9;
  for (let i = -14; i < 26; i++){
    const off = i * 96 + 34;
    ctx.beginPath();
    ctx.moveTo(200 + off, 950);
    ctx.lineTo(200 + off + 300, 180);
    ctx.stroke();
  }
  // cylindrical shading
  const sg = ctx.createLinearGradient(360, 0, 700, 0);
  sg.addColorStop(0, 'rgba(0,0,0,.16)');
  sg.addColorStop(.32, 'rgba(255,255,255,.55)');
  sg.addColorStop(.62, 'rgba(255,255,255,.05)');
  sg.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, U, U);
  ctx.restore();

  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(160,120,140,.25)';
  outline(); ctx.stroke();
}

/* ══════════════ CHOCOLATE HEART ══════════════ */
function heart(ctx, { color }){
  const c = getColor(color);
  const cx = 500, cy = 470, w = 520, h = 470;
  dropShadow(ctx, cx, 830, 220, 40, .3);

  // thickness — a second heart offset down for depth
  ctx.save();
  ctx.translate(0, 26);
  heartPath(ctx, cx, cy, w, h);
  ctx.fillStyle = getColor(color).dark;
  ctx.fill();
  ctx.restore();

  heartPath(ctx, cx, cy, w, h);
  ctx.fillStyle = linearFill(ctx, color, cx - w / 2, cy - h / 2, cx + w / 2, cy + h);
  ctx.fill();

  // inner moulded rim
  ctx.save();
  ctx.lineWidth = 22;
  ctx.strokeStyle = alpha(c.dark, .30);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(.86, .86); ctx.translate(-cx, -cy);
  heartPath(ctx, cx, cy, w, h); ctx.stroke();
  ctx.restore();
  ctx.restore();

  clipped(ctx, () => heartPath(ctx, cx, cy, w, h), () => {
    gloss(ctx, cx - w * .2, cy - h * .16, w * .26, h * .24, -.55, .55);
    gloss(ctx, cx + w * .16, cy - h * .18, w * .16, h * .16, -.55, .38);
  });
  specular(ctx, cx - w * .21, cy - h * .22, 40, .85);
}

/* ══════════════ COOKIE ══════════════ */
function cookie(ctx, { color, flavor }){
  const cx = 500, cy = 500, R = 250;
  const c = getColor(color);
  const rng = rngFrom('cookie');
  dropShadow(ctx, cx, 790, 235, 42, .3);

  // wobbly dough disc
  const doughPath = () => {
    ctx.beginPath();
    for (let i = 0; i <= 72; i++){
      const a = (i / 72) * TAU;
      const rr = R + Math.sin(a * 5.2) * 9 + Math.sin(a * 11) * 5;
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };
  doughPath();
  const dg = ctx.createRadialGradient(cx - 70, cy - 90, 30, cx, cy, R * 1.1);
  dg.addColorStop(0, '#e8bd85'); dg.addColorStop(.55, '#d3a067'); dg.addColorStop(1, '#a9733f');
  ctx.fillStyle = dg; ctx.fill();

  // crumb texture
  ctx.save(); doughPath(); ctx.clip();
  for (let i = 0; i < 160; i++){
    const a = rng() * TAU, rr = Math.sqrt(rng()) * R;
    ctx.fillStyle = `rgba(${rng() > .5 ? '255,240,215' : '140,95,55'},${.10 + rng() * .18})`;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, rng() * 8 + 2, 0, TAU); ctx.fill();
  }
  ctx.restore();

  // frosted top in the chosen colour
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 72; i++){
    const a = (i / 72) * TAU;
    const rr = R * .80 + Math.sin(a * 4 + 1.2) * 16 + Math.sin(a * 9) * 7;
    const px = cx + Math.cos(a) * rr, py = cy - 8 + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = domeFill(ctx, color, cx, cy - 20, R * .9);
  ctx.fill();
  ctx.strokeStyle = alpha(c.dark, .22); ctx.lineWidth = 8; ctx.stroke();
  ctx.restore();

  // chocolate chunks pressed into the frosting
  const chip = flavorTint(flavor);
  for (let i = 0; i < 9; i++){
    const a = rng() * TAU, rr = Math.sqrt(rng()) * R * .62;
    const px = cx + Math.cos(a) * rr, py = cy - 14 + Math.sin(a) * rr;
    const s = 20 + rng() * 16;
    ctx.save(); ctx.translate(px, py); ctx.rotate(rng() * TAU);
    roundRect(ctx, -s, -s * .8, s * 2, s * 1.6, 8);
    const cg = ctx.createLinearGradient(-s, -s, s, s);
    cg.addColorStop(0, mix(chip, '#ffffff', .35));
    cg.addColorStop(.5, chip);
    cg.addColorStop(1, mix(chip, '#000000', .35));
    ctx.fillStyle = cg; ctx.fill();
    ctx.restore();
  }

  gloss(ctx, cx - 70, cy - 90, 120, 74, -.5, .42);
}

/* ══════════════ GIFT CANDY BOX ══════════════ */
function box(ctx, { color, flavor }){
  const c = getColor(color);
  const bx = 220, by = 400, bw = 560, bh = 330;
  dropShadow(ctx, 500, 760, 280, 46, .32);

  // inside back wall
  roundRect(ctx, bx + 18, by - 96, bw - 36, 150, 14);
  ctx.fillStyle = mix(c.dark, '#000000', .25); ctx.fill();

  // chocolates nestled inside
  const rng = rngFrom('boxfill' + color);
  for (let i = 0; i < 6; i++){
    const px = bx + 96 + (i % 3) * 176;
    const py = by - 30 + Math.floor(i / 3) * 66;
    const r = 56;
    ctx.beginPath(); ctx.ellipse(px, py, r, r * .74, 0, 0, TAU);
    ctx.fillStyle = domeFill(ctx, i % 2 ? 'brown' : color, px, py, r);
    ctx.fill();
    specular(ctx, px - r * .3, py - r * .3, r * .28, .7);
  }

  // box front
  roundRect(ctx, bx, by, bw, bh, 22);
  ctx.fillStyle = linearFill(ctx, color, bx, by, bx + bw * .6, by + bh);
  ctx.fill();
  ctx.lineWidth = 10; ctx.strokeStyle = alpha(c.dark, .35); ctx.stroke();

  // lid resting behind, tilted
  ctx.save();
  ctx.translate(760, 330); ctx.rotate(.34);
  roundRect(ctx, -170, -70, 340, 130, 18);
  ctx.fillStyle = linearFill(ctx, color, -170, -70, 170, 60, { flip:true });
  ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = alpha(c.dark, .3); ctx.stroke();
  ctx.restore();

  // ribbon cross on the front
  const rib = c.kind === 'solid' ? mix(c.light, '#ffffff', .5) : '#fff6d8';
  ctx.fillStyle = alpha(rib, .92);
  ctx.fillRect(bx + bw / 2 - 26, by, 52, bh);
  ctx.fillRect(bx, by + bh * .42, bw, 46);
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.fillRect(bx + bw / 2 - 26, by, 16, bh);
  ctx.fillRect(bx, by + bh * .42, bw, 14);

  gloss(ctx, bx + bw * .28, by + bh * .3, bw * .3, bh * .34, -.45, .4);
}

/* ══════════════ DONUT ══════════════ */
function donut(ctx, { color, flavor }){
  const cx = 500, cy = 500, R = 300, r = 106;
  const c = getColor(color);
  dropShadow(ctx, cx, 820, 260, 44, .3);

  // dough torus
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.arc(cx, cy, r, 0, TAU, true);
  const dg = ctx.createRadialGradient(cx - 90, cy - 100, 40, cx, cy, R);
  dg.addColorStop(0, '#f0c993'); dg.addColorStop(.6, '#d8a568'); dg.addColorStop(1, '#a97440');
  ctx.fillStyle = dg; ctx.fill('evenodd');
  ctx.restore();

  // icing with a drippy edge
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 120; i++){
    const a = (i / 120) * TAU;
    const wob = Math.sin(a * 7) * 16 + Math.sin(a * 3.3 + 1) * 22;
    const rr = R * .93 + wob;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.arc(cx, cy, r * 1.18, 0, TAU, true);
  ctx.fillStyle = domeFill(ctx, color, cx, cy, R);
  ctx.fill('evenodd');
  ctx.strokeStyle = alpha(c.dark, .22); ctx.lineWidth = 7; ctx.stroke();
  ctx.restore();

  // glossy ring highlight
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * .92, 0, TAU); ctx.arc(cx, cy, r * 1.2, 0, TAU, true);
  ctx.clip('evenodd');
  gloss(ctx, cx - 80, cy - 150, 170, 84, -.4, .6);
  gloss(ctx, cx + 120, cy + 110, 110, 60, .5, .3);
  ctx.restore();

  // inner hole shading
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
  const hg = ctx.createRadialGradient(cx, cy, r * .3, cx, cy, r);
  hg.addColorStop(0, 'rgba(120,70,40,.28)');
  hg.addColorStop(1, 'rgba(120,70,40,0)');
  ctx.fillStyle = hg; ctx.fill();
}

/* ══════════════ TRUFFLE ══════════════ */
function truffle(ctx, { color, flavor }){
  const cx = 500, cy = 520, R = 250;
  const c = getColor(color);
  const rng = rngFrom('truffle');
  dropShadow(ctx, cx, 790, 235, 44, .32);

  // slightly irregular hand-rolled ball
  const shape = () => {
    ctx.beginPath();
    for (let i = 0; i <= 80; i++){
      const a = (i / 80) * TAU;
      const rr = R + Math.sin(a * 3.1) * 11 + Math.sin(a * 5.7 + 1) * 7;
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * .96;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = domeFill(ctx, color, cx, cy, R);
  ctx.fill();

  // cocoa-powder grain
  ctx.save(); shape(); ctx.clip();
  for (let i = 0; i < 320; i++){
    const a = rng() * TAU, rr = Math.sqrt(rng()) * R;
    ctx.fillStyle = `rgba(${rng() > .55 ? '255,255,255' : '0,0,0'},${.04 + rng() * .09})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, rng() * 6 + 1.5, 0, TAU);
    ctx.fill();
  }
  // matte finish: soften the highlight rather than a wet gloss
  gloss(ctx, cx - 70, cy - 96, 120, 62, -.45, .22);
  ctx.restore();

  ctx.lineWidth = 8;
  ctx.strokeStyle = alpha(c.dark, .35);
  shape(); ctx.stroke();

  // paper cup rim peeking out at the bottom
  ctx.beginPath();
  ctx.ellipse(cx, 742, 214, 46, 0, 0, TAU);
  ctx.fillStyle = 'rgba(120,80,60,.22)'; ctx.fill();
}

/* ══════════════ CUPCAKE ══════════════ */
function cupcake(ctx, { color, flavor }){
  const c = getColor(color);
  const cx = 500;
  dropShadow(ctx, cx, 852, 220, 40, .3);

  // paper case
  const caseTop = 560, caseBot = 858, halfTop = 232, halfBot = 168;
  ctx.beginPath();
  ctx.moveTo(cx - halfTop, caseTop);
  ctx.lineTo(cx - halfBot, caseBot);
  ctx.quadraticCurveTo(cx, caseBot + 26, cx + halfBot, caseBot);
  ctx.lineTo(cx + halfTop, caseTop);
  ctx.closePath();
  const pg = ctx.createLinearGradient(cx - halfTop, 0, cx + halfTop, 0);
  pg.addColorStop(0, '#b9647f'); pg.addColorStop(.28, '#f5a8bf');
  pg.addColorStop(.55, '#ffd0e0'); pg.addColorStop(1, '#c06c86');
  ctx.fillStyle = pg; ctx.fill();
  // pleats
  ctx.strokeStyle = 'rgba(120,50,75,.28)'; ctx.lineWidth = 7;
  for (let i = -4; i <= 4; i++){
    ctx.beginPath();
    ctx.moveTo(cx + i * halfTop * .23, caseTop + 6);
    ctx.lineTo(cx + i * halfBot * .23, caseBot);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(cx, caseTop, halfTop, 34, 0, 0, TAU);
  ctx.fillStyle = '#ffe0ea'; ctx.fill();

  // sponge peeking over the rim
  ctx.beginPath();
  ctx.ellipse(cx, caseTop - 22, halfTop - 6, 52, 0, Math.PI, 0);
  ctx.fillStyle = '#d8a568'; ctx.fill();

  // piped frosting: three stacked swirls
  const swirl = (yy, rx, ry) => {
    ctx.beginPath();
    for (let i = 0; i <= 90; i++){
      const a = (i / 90) * TAU;
      const wob = 1 + Math.sin(a * 7) * .055;
      const px = cx + Math.cos(a) * rx * wob;
      const py = yy + Math.sin(a) * ry * wob;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = domeFill(ctx, color, cx, yy, rx);
    ctx.fill();
    ctx.strokeStyle = alpha(c.dark, .22); ctx.lineWidth = 6; ctx.stroke();
  };
  swirl(510, 210, 78);
  swirl(432, 168, 66);
  swirl(360, 118, 52);
  // the little peak
  ctx.beginPath();
  ctx.moveTo(cx - 40, 330);
  ctx.quadraticCurveTo(cx - 6, 236, cx + 34, 322);
  ctx.quadraticCurveTo(cx, 350, cx - 40, 330);
  ctx.fillStyle = domeFill(ctx, color, cx, 300, 90); ctx.fill();

  gloss(ctx, cx - 74, 420, 74, 34, -.35, .5);
  specular(ctx, cx - 58, 356, 24, .8);
}

/* ══════════════ ICE CREAM CONE ══════════════ */
function icecream(ctx, { color, flavor }){
  const c = getColor(color);
  const cx = 500;
  dropShadow(ctx, cx, 900, 140, 28, .26);

  // waffle cone
  ctx.beginPath();
  ctx.moveTo(cx - 176, 508);
  ctx.lineTo(cx, 906);
  ctx.lineTo(cx + 176, 508);
  ctx.closePath();
  const cg = ctx.createLinearGradient(cx - 176, 0, cx + 176, 0);
  cg.addColorStop(0, '#a9733f'); cg.addColorStop(.35, '#e8bd85');
  cg.addColorStop(.62, '#d3a067'); cg.addColorStop(1, '#96632f');
  ctx.fillStyle = cg; ctx.fill();
  // waffle lattice
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - 176, 508); ctx.lineTo(cx, 906); ctx.lineTo(cx + 176, 508); ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = 'rgba(110,70,35,.4)'; ctx.lineWidth = 6;
  for (let i = -8; i <= 8; i++){
    ctx.beginPath(); ctx.moveTo(cx - 200 + i * 62, 480); ctx.lineTo(cx + 120 + i * 62, 940); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 200 - i * 62, 480); ctx.lineTo(cx - 120 - i * 62, 940); ctx.stroke();
  }
  ctx.restore();
  // cone rim
  ctx.beginPath();
  ctx.ellipse(cx, 508, 178, 40, 0, 0, TAU);
  ctx.fillStyle = '#e8bd85'; ctx.fill();
  ctx.strokeStyle = 'rgba(110,70,35,.35)'; ctx.lineWidth = 6; ctx.stroke();

  // two scoops
  const scoop = (sx, sy, r) => {
    ctx.beginPath();
    for (let i = 0; i <= 70; i++){
      const a = (i / 70) * TAU;
      const rr = r * (1 + Math.sin(a * 6) * .052 + Math.sin(a * 3 + .7) * .035);
      const px = sx + Math.cos(a) * rr, py = sy + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = domeFill(ctx, color, sx, sy, r);
    ctx.fill();
    ctx.strokeStyle = alpha(c.dark, .22); ctx.lineWidth = 6; ctx.stroke();
    specular(ctx, sx - r * .36, sy - r * .4, r * .22, .85);
  };
  scoop(cx - 8, 396, 176);
  scoop(cx + 6, 250, 132);

  // a drip running down the cone
  ctx.beginPath();
  ctx.moveTo(cx - 120, 500);
  ctx.quadraticCurveTo(cx - 130, 560, cx - 104, 588);
  ctx.quadraticCurveTo(cx - 78, 560, cx - 82, 498);
  ctx.closePath();
  ctx.fillStyle = alpha(c.light, .95); ctx.fill();

  gloss(ctx, cx - 70, 300, 76, 40, -.45, .5);
}

/* ══════════════ CAKE POP ══════════════ */
function cakepop(ctx, { color, flavor }){
  const c = getColor(color);
  const cx = 500, cy = 420, R = 218;
  dropShadow(ctx, cx, 880, 120, 24, .24);

  // stick
  roundRect(ctx, cx - 22, cy + 60, 44, 430, 22);
  const sg = ctx.createLinearGradient(cx - 22, 0, cx + 22, 0);
  sg.addColorStop(0, '#d8cfc4'); sg.addColorStop(.4, '#fffdf8'); sg.addColorStop(1, '#c4b9ac');
  ctx.fillStyle = sg; ctx.fill();

  // coated ball
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU);
  ctx.fillStyle = domeFill(ctx, color, cx, cy, R);
  ctx.fill();

  // thick coating drip round the bottom
  ctx.beginPath();
  ctx.moveTo(cx - R * .98, cy + 20);
  for (let i = 0; i <= 12; i++){
    const p = i / 12;
    const x = cx - R * .98 + p * R * 1.96;
    const y = cy + 20 + Math.sin(p * Math.PI * 5.5) * 26 + 46;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(cx + R * .98, cy + 20);
  ctx.closePath();
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = alpha(c.dark, .28); ctx.fill();
  ctx.restore();

  ctx.lineWidth = 9;
  ctx.strokeStyle = alpha(c.dark, .3);
  ctx.beginPath(); ctx.arc(cx, cy, R - 4, 0, TAU); ctx.stroke();

  gloss(ctx, cx - R * .32, cy - R * .36, R * .44, R * .28, -.5, .55);
  specular(ctx, cx - R * .4, cy - R * .44, R * .2, .95);
}

/* ══════════════ CHOCOLATE PRETZEL ══════════════ */
function pretzel(ctx, { color, flavor }){
  const c = getColor(color);
  const cx = 500, cy = 500;
  dropShadow(ctx, cx, 810, 220, 38, .28);

  const path = () => {
    ctx.beginPath();
    // two upper loops
    ctx.arc(cx - 132, cy - 76, 124, Math.PI * .78, Math.PI * 2.08);
    ctx.arc(cx + 132, cy - 76, 124, Math.PI * .92, Math.PI * 2.22);
    // crossed tails into the belly
    ctx.moveTo(cx - 210, cy + 10);
    ctx.quadraticCurveTo(cx - 40, cy + 250, cx + 96, cy + 178);
    ctx.moveTo(cx + 210, cy + 10);
    ctx.quadraticCurveTo(cx + 40, cy + 250, cx - 96, cy + 178);
    // the wide bottom curve
    ctx.moveTo(cx - 236, cy - 30);
    ctx.quadraticCurveTo(cx, cy + 292, cx + 236, cy - 30);
  };

  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // baked dough underneath
  ctx.strokeStyle = '#a9733f'; ctx.lineWidth = 92;
  path(); ctx.stroke();
  ctx.strokeStyle = '#d3a067'; ctx.lineWidth = 74;
  path(); ctx.stroke();

  // chocolate coat in the chosen colour
  ctx.strokeStyle = c.base; ctx.lineWidth = 60;
  path(); ctx.stroke();
  ctx.strokeStyle = alpha(c.light, .55); ctx.lineWidth = 22;
  ctx.save();
  ctx.translate(-8, -10);
  path(); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = alpha(c.dark, .45); ctx.lineWidth = 12;
  ctx.save();
  ctx.translate(9, 12);
  path(); ctx.stroke();
  ctx.restore();

  // salt crystals
  const rng = rngFrom('pretzel');
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  for (let i = 0; i < 26; i++){
    const a = rng() * TAU, rr = 110 + rng() * 190;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .85, rng() * 7 + 3, 0, TAU);
    ctx.fill();
  }
}

/* ══════════════ registry ══════════════ */
export const CANDY_ART = {
  bar, lolli, bonbon, gummy, marsh, cane, heart, cookie, box, donut,
  truffle, cupcake, icecream, cakepop, pretzel,
};

export function drawCandyBase(ctx, art, opts){
  const fn = CANDY_ART[art] || CANDY_ART.bar;
  ctx.save();
  fn(ctx, opts);
  ctx.restore();
}
