/* ============================================================
   The shop diorama drawn behind the customer queue.
   Reacts to location and to every upgrade the player has bought.
   ============================================================ */

import { roundRect, alpha, mix, specular, gloss } from './shade.js';
import { getLocation } from '../data/upgrades.js';
import { TAU, rngFrom, clamp, easeOutCubic } from '../core/utils.js';
import { ANCHORS } from '../data/shopDecor.js';
import { drawDecorPiece } from './shopDecor.js';
import { daylight, mixHex } from './daylight.js';
import { drawPet } from './pet.js';

const WALLPAPERS = [
  { base:'#f6e7dd', stripe:'#efd8c9', motif:'none' },
  { base:'#ffe9f2', stripe:'#ffd6e6', motif:'stripe' },
  { base:'#e8f2ff', stripe:'#d5e8ff', motif:'dot'  },
  { base:'#f2e9ff', stripe:'#e4d6ff', motif:'heart' },
  { base:'#fff2d9', stripe:'#ffe4b0', motif:'star' },
];

const FLOORS = [
  ['#c9a184','#b58a6a'],
  ['#e0c3a8','#c9a184'],
  ['#e7d7f2','#cbb2e0'],
  ['#ffe0ea','#f2c2d4'],
  ['#f3f0e8','#dcd6c8'],
];

/**
 * @param ctx    2D context sized w×h in CSS pixels (already DPR-scaled)
 * @param w,h    logical size
 * @param opt    { location, upgrades, t, satisfaction }
 */
export function drawShop(ctx, w, h, { location = 'village', upgrades = {}, t = 0, satisfaction = 60, customers = [], decor = {}, hour, pet = null } = {}){
  const loc = getLocation(location);
  const sun = daylight(hour);
  const lv = k => upgrades[k] || 0;
  const wall = WALLPAPERS[Math.min(lv('walls'), WALLPAPERS.length - 1)];
  const floor = FLOORS[Math.min(lv('floor'), FLOORS.length - 1)];

  ctx.clearRect(0, 0, w, h);
  const horizon = h * .62;

  /* ── wall ── */
  const wg = ctx.createLinearGradient(0, 0, 0, horizon);
  wg.addColorStop(0, mix(wall.base, '#ffffff', .35));
  wg.addColorStop(1, wall.base);
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, w, horizon);

  // wallpaper motif
  ctx.save();
  ctx.globalAlpha = .55;
  const step = w / 9;
  if (wall.motif === 'stripe'){
    ctx.fillStyle = wall.stripe;
    for (let x = 0; x < w; x += step * 1.1) ctx.fillRect(x, 0, step * .42, horizon);
  } else if (wall.motif !== 'none'){
    const glyph = { dot:'•', heart:'♥', star:'✦' }[wall.motif];
    ctx.fillStyle = wall.stripe;
    ctx.font = `${step * .42}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let y = step * .5; y < horizon; y += step * .8){
      for (let x = step * .5; x < w; x += step){
        ctx.fillText(glyph, x + (Math.floor(y / (step * .8)) % 2) * step * .5, y);
      }
    }
  }
  ctx.restore();

  /* ── the door customers come through ── */
  const dx = w * .01, dw = w * .155;
  const dTop = horizon - h * .40, dBot = horizon + h * .05;
  roundRect(ctx, dx, dTop, dw, dBot - dTop, 10);
  ctx.fillStyle = mix(loc.accent, '#ffffff', .35); ctx.fill();
  ctx.strokeStyle = alpha('#6d4527', .45); ctx.lineWidth = 5; ctx.stroke();
  // glass panel showing the street
  roundRect(ctx, dx + dw * .16, dTop + h * .05, dw * .68, (dBot - dTop) * .46, 6);
  const dg = ctx.createLinearGradient(0, dTop, 0, dBot);
  dg.addColorStop(0, loc.sky[0]); dg.addColorStop(1, loc.sky[1]);
  ctx.fillStyle = dg; ctx.fill();
  ctx.strokeStyle = '#fffdfa'; ctx.lineWidth = 3; ctx.stroke();
  // handle + little welcome sign
  ctx.fillStyle = '#c98f14';
  ctx.beginPath(); ctx.arc(dx + dw * .82, (dTop + dBot) / 2 + h * .04, 4, 0, TAU); ctx.fill();
  ctx.font = `${h * .045}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🔔', dx + dw / 2, dTop - h * .03);

  /* ── window with the location beyond ── */
  const wx = w * .19, wy = h * .10, ww = w * .26, wh = h * .32;
  roundRect(ctx, wx, wy, ww, wh, 14);
  const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, mixHex(loc.sky[0], sun.sky[0], sun.skyMix));
  sky.addColorStop(1, mixHex(loc.sky[1], sun.sky[1], sun.skyMix));
  ctx.fillStyle = sky; ctx.fill();
  ctx.save();
  roundRect(ctx, wx, wy, ww, wh, 14); ctx.clip();
  // silhouette skyline / scenery
  ctx.fillStyle = alpha(loc.accent, .35);
  const rng = rngFrom(location);
  for (let i = 0; i < 7; i++){
    const bw = ww * (.12 + rng() * .14);
    const bh = wh * (.2 + rng() * .5);
    ctx.fillRect(wx + i * ww * .15, wy + wh - bh, bw, bh);
  }
  // sun by day, moon by night — and stars once it is properly dark
  if (sun.stars){
    const srng = rngFrom('stars' + location);
    ctx.fillStyle = alpha('#ffffff', .85);
    for (let i = 0; i < 14; i++){
      const sxp = wx + srng() * ww, syp = wy + srng() * wh * .7;
      const r = 1 + srng() * 1.4;
      ctx.beginPath(); ctx.arc(sxp, syp, r, 0, TAU); ctx.fill();
    }
  }
  const orbX = wx + ww * .78, orbY = wy + wh * .24, orbR = ww * .09;
  ctx.fillStyle = alpha(sun.moon > .5 ? '#fdf6d8' : '#ffffff', .55 + sun.moon * .35);
  ctx.beginPath(); ctx.arc(orbX, orbY, orbR, 0, TAU); ctx.fill();
  if (sun.moon > .55){
    // bite a crescent out of it with the sky colour behind
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(orbX + orbR * .55, orbY - orbR * .25, orbR * .92, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  ctx.strokeStyle = '#fffdfa'; ctx.lineWidth = 8;
  roundRect(ctx, wx, wy, ww, wh, 14); ctx.stroke();
  ctx.strokeStyle = alpha('#8b5e3c', .3); ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();

  /* ── shelves with candy jars ── */
  const shelves = Math.min(1 + lv('shelves'), 4);
  const sx = w * .46, sw = w * .48;
  for (let s = 0; s < shelves; s++){
    const sy = h * .12 + s * h * .13;
    ctx.fillStyle = '#b98d6c';
    roundRect(ctx, sx, sy + h * .085, sw, 9, 4); ctx.fill();
    ctx.fillStyle = alpha('#6d4527', .25);
    ctx.fillRect(sx, sy + h * .085 + 9, sw, 4);
    // jars
    const jars = 5;
    for (let i = 0; i < jars; i++){
      const jx = sx + 12 + i * (sw - 24) / jars;
      const jw = (sw - 24) / jars - 8, jh = h * .075;
      const jy = sy + h * .085 - jh;
      const hue = ['#ff8ec0','#ffcf47','#5aabff','#48cfa6','#9a6bff'][(i + s) % 5];
      roundRect(ctx, jx, jy, jw, jh, 5);
      ctx.fillStyle = alpha(hue, .8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.fillRect(jx + jw * .18, jy + 3, jw * .16, jh - 6);
      ctx.fillStyle = alpha('#8b5e3c', .8);
      roundRect(ctx, jx - 1, jy - 5, jw + 2, 7, 3); ctx.fill();
    }
  }

  /* ── ceiling lights ── */
  const lampCount = 2 + Math.min(lv('lighting'), 3);
  for (let i = 0; i < lampCount; i++){
    const lx = w * (i + 1) / (lampCount + 1);
    ctx.strokeStyle = 'rgba(90,60,80,.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, h * .055); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx - 22, h * .095); ctx.quadraticCurveTo(lx, h * .04, lx + 22, h * .095);
    ctx.closePath();
    ctx.fillStyle = '#fff0c9'; ctx.fill();
    ctx.strokeStyle = alpha('#c98f14', .5); ctx.lineWidth = 2; ctx.stroke();
    // warm pool of light
    const glow = ctx.createRadialGradient(lx, h * .1, 4, lx, h * .1, h * .34);
    const intensity = (.10 + lv('lighting') * .045) * (1 + sun.lamp * 1.5);
    glow.addColorStop(0, `rgba(255,225,150,${intensity})`);
    glow.addColorStop(1, 'rgba(255,225,150,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(lx, h * .1, h * .34, 0, TAU); ctx.fill();
  }

  /* ── floor ── */
  const fg = ctx.createLinearGradient(0, horizon, 0, h);
  fg.addColorStop(0, floor[0]); fg.addColorStop(1, floor[1]);
  ctx.fillStyle = fg;
  ctx.fillRect(0, horizon, w, h - horizon);
  // perspective tiles
  ctx.strokeStyle = alpha('#000000', .07); ctx.lineWidth = 2;
  for (let i = -6; i <= 12; i++){
    ctx.beginPath();
    ctx.moveTo(w * .5 + (i - 3) * w * .06, horizon);
    ctx.lineTo(w * .5 + (i - 3) * w * .34, h);
    ctx.stroke();
  }
  for (let i = 1; i < 5; i++){
    const y = horizon + (h - horizon) * Math.pow(i / 5, 1.7);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  /* ── waiting-area seating ── */
  if (lv('waiting') > 0){
    const bx = w * .04, by = horizon - h * .02, bw = w * .22, bh = h * .16;
    roundRect(ctx, bx, by, bw, bh * .5, 8);
    ctx.fillStyle = '#e0a5c0'; ctx.fill();
    roundRect(ctx, bx + bw * .05, by - bh * .35, bw * .9, bh * .42, 10);
    ctx.fillStyle = '#f0bdd4'; ctx.fill();
    if (lv('waiting') > 2){
      ctx.font = `${h * .07}px system-ui`; ctx.textAlign = 'center';
      ctx.fillText('🪴', bx + bw + h * .05, by + bh * .45);
    }
  }

  /* ── her own decorations, the ones that sit behind the counter ── */
  drawDecor(ctx, w, h, t, decor, true);

  /* ── counter ── */
  const cx = w * .10, cy = h * .70, cw = w * .80, chh = h * .28;
  ctx.fillStyle = alpha('#000000', .12);
  roundRect(ctx, cx + 6, cy + 10, cw, chh, 14); ctx.fill();

  roundRect(ctx, cx, cy, cw, chh, 14);
  const counterTone = ['#c9a184','#d8b393','#e6c9a8','#f0d9bd','#f6e6d2'][Math.min(lv('counter'), 4)];
  const cg = ctx.createLinearGradient(0, cy, 0, cy + chh);
  cg.addColorStop(0, mix(counterTone, '#ffffff', .35));
  cg.addColorStop(.18, counterTone);
  cg.addColorStop(1, mix(counterTone, '#000000', .28));
  ctx.fillStyle = cg; ctx.fill();
  // counter top edge
  roundRect(ctx, cx - 8, cy - 12, cw + 16, 22, 11);
  ctx.fillStyle = mix(counterTone, '#ffffff', .55); ctx.fill();
  gloss(ctx, cx + cw * .25, cy - 4, cw * .22, 6, 0, .55);

  // display candy resting on the counter top
  const displayN = 3 + Math.min(lv('shelves'), 2);
  ctx.font = `${h * .075}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  for (let i = 0; i < displayN; i++){
    const px = cx + cw * (.10 + i * .72 / displayN);
    ctx.fillText(['🍬','🍭','🧁','🍫','🍩'][i % 5], px, cy + 4);
  }

  // cash register
  const rx = cx + cw * .78, ry = cy - h * .10;
  roundRect(ctx, rx, ry, w * .13, h * .11, 7);
  ctx.fillStyle = ['#b9b0bb','#c9c2d0','#d8d2e2','#eae3f2','#f6f0ff'][Math.min(lv('register'), 4)];
  ctx.fill();
  ctx.fillStyle = '#4b3346';
  roundRect(ctx, rx + w * .015, ry + h * .015, w * .1, h * .04, 4); ctx.fill();
  ctx.fillStyle = alpha('#48cfa6', .9);
  ctx.fillRect(rx + w * .02, ry + h * .025, w * .06, h * .012);

  // decoration table (right of counter) once bought
  if (lv('table') > 0){
    ctx.font = `${h * .08}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('🎨', cx + cw * .52, cy + 4);
  }

  // employee
  if (lv('staff') > 0){
    ctx.font = `${h * .13}px system-ui`; ctx.textAlign = 'center';
    const bob = Math.sin(t * 1.6) * 3;
    ctx.fillText('🧑‍🍳', cx + cw * .22, cy + bob + h * .02);
  }

  /* ── the pieces that sit on the counter, in front of it ── */
  drawDecor(ctx, w, h, t, decor, false);

  /* ── the shop pet, on the floor at the end of the counter ──
     In front of the counter and to the left of where anybody queues, so
     it is never hidden behind a speech bubble. Drawn before the light
     wash, unlike the customers, so the animal is lit by the room rather
     than pasted on top of a dark corner. */
  let petBox = null;
  if (pet){
    const sz = h * .38;
    const gx = w * .105;
    // drawPet fills its box down to about .90, so this stands the animal
    // on the bottom edge of the diorama instead of cropping its paws
    const topY = h - sz * .90;
    ctx.save();
    ctx.translate(gx - sz / 2, topY);
    drawPet(ctx, sz, pet.kind, t, pet.mood ?? 1);
    ctx.restore();
    // asleep once the shop has gone dark
    if (sun.dark > .8){
      ctx.save();
      ctx.globalAlpha = .5 + Math.sin(t * 1.1) * .22;
      ctx.font = `${sz * .2}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('💤', gx + sz * .22, topY + sz * .02);
      ctx.restore();
    }
    petBox = { id:'__pet', x: gx - sz * .30, y: topY, w: sz * .60, h: sz * .86 };
  }

  /* ── the light of the hour, washed over the room ──
     Deliberately before the customers: the room can go properly dark
     at night while faces and patience bars stay readable on top. */
  if (sun.tintAlpha > .002){
    ctx.save();
    ctx.globalCompositeOperation = sun.dark > .5 ? 'multiply' : 'overlay';
    ctx.globalAlpha = sun.tintAlpha;
    ctx.fillStyle = sun.tint;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // the lamps punch back through the wash
    if (sun.lamp > .05){
      const lampCount2 = 2 + Math.min(lv('lighting'), 3);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < lampCount2; i++){
        const lx = w * (i + 1) / (lampCount2 + 1);
        const g2 = ctx.createRadialGradient(lx, h * .1, 4, lx, h * .1, h * .40);
        g2.addColorStop(0, `rgba(255,214,140,${.16 * sun.lamp})`);
        g2.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(lx, h * .1, h * .40, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ── the customers themselves, standing at the counter ── */
  const hitBoxes = drawCustomers(ctx, w, h, customers, t);

  /* ── ambience: floating hearts when the shop is loved ── */
  if (satisfaction > 70){
    ctx.save();
    ctx.globalAlpha = .5;
    ctx.font = `${h * .05}px system-ui`;
    for (let i = 0; i < 3; i++){
      const p = ((t * .18) + i / 3) % 1;
      ctx.globalAlpha = .5 * (1 - p);
      ctx.fillText('💕', w * (.2 + i * .3) + Math.sin(t + i) * 10, horizon - p * h * .5);
    }
    ctx.restore();
  }

  // vignette so the diorama sits back
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, h * .85);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(80,40,70,.22)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

  // the pet goes first in the list, so a customer standing in front of it
  // still wins the tap
  return petBox ? [petBox, ...hitBoxes] : hitBoxes;
}

/**
 * Draw whatever she has put around the shop.
 * @param behind  the pass that goes under the counter, or the one over it
 */
function drawDecor(ctx, w, h, t, decor, behind){
  for (const [slot, id] of Object.entries(decor || {})){
    const a = ANCHORS[slot];
    if (!a || !id || !!a.behind !== behind) continue;
    drawDecorPiece(ctx, id, w * a.x, h * a.y, w * a.size, t, w, h);
  }
}

/* ============================================================
   Customers walk in through the door and queue at the counter.
   Returns tap targets so the shop screen can route clicks.
   ============================================================ */
/** Shirt colours, so the queue is not four of the same person. */
const SHIRTS = ['#ff8ec0', '#5aabff', '#9a6bff', '#48cfa6', '#ffcf47', '#ff9a4d', '#f04f5f'];
const hashId = id => {
  let n = 0;
  for (let i = 0; i < String(id).length; i++) n = (n * 31 + String(id).charCodeAt(i)) | 0;
  return n;
};

function drawCustomers(ctx, w, h, customers, t){
  const boxes = [];
  if (!customers.length) return boxes;

  const footY = h * .935;
  const size  = h * .225;                      // character height
  const doorX = -w * .10;                      // just off-screen, at the door

  customers.forEach((c, i) => {
    // evenly spaced standing spots across the front of the counter
    const span = Math.min(customers.length, 5);
    const slot = span === 1 ? .5 : .26 + (i / (span - 1)) * .48;
    const targetX = w * slot;

    const walk = clamp(c.walk ?? 1, 0, 1);
    const e = easeOutCubic(walk);
    const x = doorX + (targetX - doorX) * e;
    const arrived = walk >= 1;

    // walking bounce while moving, gentle idle sway once in place
    const bob = arrived
      ? Math.sin(t * 1.9 + i * 1.3) * size * .018
      : Math.abs(Math.sin(walk * 22)) * size * .05;
    const lean = arrived ? Math.sin(t * 1.2 + i) * .015 : Math.sin(walk * 22) * .05;

    const y = footY - bob;

    /* contact shadow */
    ctx.save();
    ctx.fillStyle = 'rgba(90,50,80,.20)';
    ctx.beginPath();
    ctx.ellipse(x, footY + 2, size * .27, size * .07, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    /* a soft pool of light under whoever is next in line */
    if (i === 0 && arrived){
      const pulse = .10 + .05 * Math.sin(t * 2.2);
      const g = ctx.createRadialGradient(x, footY, 2, x, footY, size * .5);
      g.addColorStop(0, `rgba(255,200,120,${pulse})`);
      g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, footY, size * .5, size * .16, 0, 0, TAU); ctx.fill();
    }

    /* the customer: a drawn body with the face on top of it.
       The body matters — an emoji-only customer vanishes entirely on a
       phone whose font cannot draw that particular glyph, which is how
       the shop ended up looking empty. */
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    // whatever the rest of the diorama left behind must not leak in here
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    const shirt = SHIRTS[Math.abs(hashId(c.id)) % SHIRTS.length];
    const bw = size * .40, bh = size * .46;

    // arms
    ctx.strokeStyle = mix(shirt, '#000000', .12);
    ctx.lineWidth = size * .085;
    ctx.lineCap = 'round';
    for (const sx of [-1, 1]){
      ctx.beginPath();
      ctx.moveTo(sx * bw * .40, -bh * .78);
      ctx.lineTo(sx * bw * .62, -bh * .26);
      ctx.stroke();
    }
    // torso
    ctx.beginPath();
    ctx.moveTo(-bw / 2, 0);
    ctx.quadraticCurveTo(-bw * .58, -bh * .82, 0, -bh * .92);
    ctx.quadraticCurveTo(bw * .58, -bh * .82, bw / 2, 0);
    ctx.closePath();
    const bg = ctx.createLinearGradient(-bw / 2, -bh, bw / 2, 0);
    bg.addColorStop(0, mix(shirt, '#ffffff', .30));
    bg.addColorStop(1, mix(shirt, '#000000', .14));
    ctx.fillStyle = bg;
    ctx.fill();

    // and the face sitting on the shoulders
    ctx.fillStyle = '#3a2f38';
    ctx.font = `${size * .58}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(c.face, 0, -bh * .74);
    if (c.vip){
      ctx.font = `${size * .28}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
      ctx.fillText('👑', 0, -bh * .74 - size * .52);
    }
    ctx.restore();

    /* speech bubble with what they want + how patient they still are */
    if (arrived){
      const bw = size * .80, bh = size * .50;
      const bx = x, by = y - size * 1.06;
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,.96)';
      ctx.strokeStyle = 'rgba(180,130,165,.35)';
      ctx.lineWidth = 2;
      roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, bh * .34);
      ctx.fill(); ctx.stroke();
      // tail pointing down at the customer
      ctx.beginPath();
      ctx.moveTo(bx - bw * .13, by + bh * .44);
      ctx.lineTo(bx, by + bh * .80);
      ctx.lineTo(bx + bw * .13, by + bh * .44);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.fill();

      ctx.font = `${bh * .52}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(c.want || '🍬', bx, by - bh * .10);

      // patience bar inside the bubble
      const pw = bw * .62, ph = bh * .13;
      const px = bx - pw / 2, py = by + bh * .22;
      const frac = clamp(c.patience ?? 1, 0, 1);
      ctx.fillStyle = '#ffe1ee';
      roundRect(ctx, px, py, pw, ph, ph / 2); ctx.fill();
      ctx.fillStyle = frac > .55 ? '#48cfa6' : frac > .25 ? '#ffc233' : '#e2504f';
      roundRect(ctx, px, py, Math.max(ph, pw * frac), ph, ph / 2); ctx.fill();
      ctx.restore();
    }

    boxes.push({
      id: c.id,
      x: x - size * .32, y: y - size * 1.30,
      w: size * .64,     h: size * 1.34,
    });
  });

  return boxes;
}
