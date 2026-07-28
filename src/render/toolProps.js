/* ============================================================
   Props you hold and dip into.

   These are drawn in the stage's own pixel space (not the 1000-unit
   design space), because they follow the finger and sit around the
   candy rather than on it.
   ============================================================ */

import { alpha, mix, roundRect, specular, gloss } from './shade.js';
import { getColor } from '../data/palette.js';
import { TAU, rngFrom } from '../core/utils.js';

/* ══════════════ bowl of melted chocolate ══════════════ */

/**
 * Trace the pool of chocolate inside the bowl onto the current path.
 * The studio unions this with the area above the surface to clip the
 * candy, so a deep dunk never pokes out under the bowl.
 */
export function bowlInnerPath(ctx, w, h, surfaceY){
  const bowlW = w * .92;
  const x0 = (w - bowlW) / 2;
  const bottom = Math.min(h - 2, surfaceY + h * .30);
  ctx.moveTo(x0 + 6, surfaceY);
  ctx.quadraticCurveTo(w / 2, bottom + h * .085, x0 + bowlW - 6, surfaceY);
  ctx.closePath();
}

/**
 * A tempering bowl across the bottom of the stage.
 * @param surfaceY  y of the chocolate surface, in canvas pixels
 * @param t         seconds, for the lazy ripple
 * @param active    true while the candy is actually in it
 */
export function drawChocolateBowl(ctx, w, h, surfaceY, colorId, t, active = false){
  const c = getColor(colorId);
  const rimY = surfaceY;
  const bowlW = w * .92;
  const x0 = (w - bowlW) / 2;
  const bottom = Math.min(h - 2, surfaceY + h * .30);

  ctx.save();

  /* ceramic bowl behind the chocolate */
  ctx.beginPath();
  ctx.moveTo(x0, rimY);
  ctx.quadraticCurveTo(w / 2, bottom + h * .10, x0 + bowlW, rimY);
  ctx.closePath();
  const bg = ctx.createLinearGradient(x0, rimY, x0 + bowlW, bottom);
  bg.addColorStop(0, '#f2e2ea');
  bg.addColorStop(.45, '#fffdfb');
  bg.addColorStop(1, '#e2cfd9');
  ctx.fillStyle = bg;
  ctx.fill();

  /* the chocolate itself, with a wobbling surface */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0 + 6, rimY);
  ctx.quadraticCurveTo(w / 2, bottom + h * .085, x0 + bowlW - 6, rimY);
  ctx.closePath();
  ctx.clip();

  const wobble = active ? 5 : 2.2;
  ctx.beginPath();
  ctx.moveTo(x0, rimY + 40);
  for (let i = 0; i <= 26; i++){
    const p = i / 26;
    const x = x0 + p * bowlW;
    const y = rimY + Math.sin(p * 7 + t * (active ? 5.5 : 1.6)) * wobble
                   + Math.sin(p * 3.1 - t * 1.1) * wobble * .7;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.lineTo(x0 + bowlW, bottom + 60);
  ctx.lineTo(x0, bottom + 60);
  ctx.closePath();

  const cg = ctx.createLinearGradient(0, rimY - 10, 0, bottom);
  cg.addColorStop(0, c.light);
  cg.addColorStop(.18, c.base);
  cg.addColorStop(1, c.dark);
  ctx.fillStyle = cg;
  ctx.fill();

  /* glossy sheen sliding across the surface */
  const sheen = ctx.createLinearGradient(x0, rimY, x0 + bowlW, rimY + 30);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(.35 + Math.sin(t * .7) * .1, 'rgba(255,255,255,.28)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x0, rimY - 6, bowlW, 26);
  ctx.restore();

  /* rim highlight */
  ctx.strokeStyle = 'rgba(255,255,255,.85)';
  ctx.lineWidth = Math.max(2, w * .008);
  ctx.beginPath();
  ctx.ellipse(w / 2, rimY, bowlW / 2, Math.max(5, h * .018), 0, 0, TAU);
  ctx.stroke();

  ctx.restore();
}

/** Ripples where the candy breaks the surface. */
export function drawDipRipple(ctx, cx, surfaceY, spread, colorId, t){
  const c = getColor(colorId);
  ctx.save();
  ctx.strokeStyle = alpha(c.light, .55);
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i++){
    const p = ((t * 1.6 + i / 3) % 1);
    ctx.globalAlpha = (1 - p) * .6;
    ctx.beginPath();
    ctx.ellipse(cx, surfaceY, spread * (.4 + p * .8), spread * (.12 + p * .2), 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

/* ══════════════ piping bag ══════════════ */

/**
 * A piping bag held above the nozzle point, tilted along the stroke.
 * @param angle  direction of travel, radians
 * @param squeeze 0..1, how hard it is being squeezed
 */
export function drawPipingBag(ctx, x, y, size, colorId, angle = -Math.PI / 2, squeeze = 0){
  const c = getColor(colorId);
  const s = size / 100;

  ctx.save();
  ctx.translate(x, y);
  // the bag hangs back along the direction of travel, tilted up
  ctx.rotate(angle + Math.PI / 2 + .35);
  ctx.scale(s, s);

  ctx.shadowColor = 'rgba(110,60,100,.30)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;

  /* metal nozzle */
  ctx.beginPath();
  ctx.moveTo(-13, 0);
  ctx.lineTo(13, 0);
  ctx.lineTo(20, -34);
  ctx.lineTo(-20, -34);
  ctx.closePath();
  const ng = ctx.createLinearGradient(-20, 0, 20, 0);
  ng.addColorStop(0, '#8d9cae');
  ng.addColorStop(.35, '#f4f7fb');
  ng.addColorStop(.65, '#c9d4e2');
  ng.addColorStop(1, '#7e8c9c');
  ctx.fillStyle = ng;
  ctx.fill();
  ctx.shadowBlur = 0;

  // star-tip notches
  ctx.fillStyle = 'rgba(60,80,100,.35)';
  for (let i = -2; i <= 2; i++){
    ctx.beginPath();
    ctx.arc(i * 6, 0, 2.6, 0, TAU);
    ctx.fill();
  }

  /* the cloth bag, bulging as it is squeezed */
  const bulge = 1 + squeeze * .12;
  ctx.beginPath();
  ctx.moveTo(-20, -34);
  ctx.bezierCurveTo(-52 * bulge, -60, -46 * bulge, -122, -12, -150);
  ctx.lineTo(12, -150);
  ctx.bezierCurveTo(46 * bulge, -122, 52 * bulge, -60, 20, -34);
  ctx.closePath();
  const bg = ctx.createLinearGradient(-40, -100, 40, -40);
  bg.addColorStop(0, mix(c.light, '#ffffff', .55));
  bg.addColorStop(.45, mix(c.light, '#ffffff', .15));
  bg.addColorStop(1, c.base);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = alpha(c.dark, .30);
  ctx.lineWidth = 3;
  ctx.stroke();

  // twisted top
  ctx.beginPath();
  ctx.ellipse(0, -150, 14, 7, 0, 0, TAU);
  ctx.fillStyle = mix(c.dark, '#ffffff', .35);
  ctx.fill();

  // fabric folds
  ctx.strokeStyle = alpha(c.dark, .18);
  ctx.lineWidth = 2.5;
  for (const off of [-16, 0, 16]){
    ctx.beginPath();
    ctx.moveTo(off * .5, -44);
    ctx.quadraticCurveTo(off, -95, off * .6, -142);
    ctx.stroke();
  }
  specular(ctx, -18, -96, 14, .7);

  ctx.restore();
}

/* ══════════════ blow torch ══════════════ */

export function drawTorch(ctx, x, y, size, t, power = 0){
  const s = size / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(-.5);

  /* flame first, pointing down-left at the candy */
  if (power > 0){
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const len = 34 + power * 46 + Math.sin(t * 22) * 5;
    for (const [w, col, a] of [[20, '#5aabff', .55], [13, '#ffd36e', .8], [6, '#fffbe8', .95]]){
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.quadraticCurveTo(-w, len * .5, 0, len);
      ctx.quadraticCurveTo(w, len * .5, 0, 6);
      ctx.fillStyle = alpha(col, a * (.6 + power * .4));
      ctx.fill();
    }
    ctx.fillStyle = `rgba(255,190,90,${.10 + power * .12})`;
    ctx.beginPath(); ctx.arc(0, len * .6, len * .8, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* body */
  ctx.shadowColor = 'rgba(110,60,100,.30)';
  ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
  roundRect(ctx, -17, -104, 34, 96, 12);
  const g = ctx.createLinearGradient(-17, 0, 17, 0);
  g.addColorStop(0, '#7e8c9c'); g.addColorStop(.35, '#eef3f9');
  g.addColorStop(.7, '#c9d4e2'); g.addColorStop(1, '#6f7d8d');
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0;

  // nozzle
  roundRect(ctx, -9, -14, 18, 22, 5);
  ctx.fillStyle = '#5a6673'; ctx.fill();
  // trigger
  ctx.fillStyle = '#e0417b';
  roundRect(ctx, -21, -74, 10, 22, 5); ctx.fill();
  specular(ctx, -6, -84, 10, .8);

  ctx.restore();
}

/* ══════════════ sugar sieve ══════════════ */

export function drawSieve(ctx, x, y, size, dustColor, t, shaking = false){
  const s = size / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 18) * (shaking ? .16 : .03) - .25);
  ctx.scale(s, s);

  ctx.shadowColor = 'rgba(110,60,100,.28)';
  ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;

  /* cup */
  ctx.beginPath();
  ctx.moveTo(-42, -8);
  ctx.lineTo(-34, -62);
  ctx.lineTo(34, -62);
  ctx.lineTo(42, -8);
  ctx.closePath();
  const g = ctx.createLinearGradient(-42, 0, 42, 0);
  g.addColorStop(0, '#8d9cae'); g.addColorStop(.35, '#f4f7fb');
  g.addColorStop(.7, '#c9d4e2'); g.addColorStop(1, '#7e8c9c');
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0;

  /* mesh base */
  ctx.beginPath();
  ctx.ellipse(0, -6, 42, 9, 0, 0, TAU);
  ctx.fillStyle = '#b9c4d2'; ctx.fill();
  ctx.strokeStyle = 'rgba(70,90,110,.5)'; ctx.lineWidth = 1.6;
  for (let i = -4; i <= 4; i++){
    ctx.beginPath(); ctx.moveTo(i * 9, -13); ctx.lineTo(i * 9, 1); ctx.stroke();
  }

  /* handle */
  ctx.strokeStyle = '#8b5e3c'; ctx.lineWidth = 11; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(38, -52); ctx.lineTo(86, -74); ctx.stroke();

  /* powder falling out */
  if (shaking){
    const rng = rngFrom('sieve' + Math.floor(t * 12));
    ctx.fillStyle = alpha(dustColor, .8);
    for (let i = 0; i < 14; i++){
      const px = (rng() - .5) * 74;
      const py = 4 + rng() * 46;
      ctx.globalAlpha = .8 * (1 - py / 52);
      ctx.beginPath(); ctx.arc(px, py, rng() * 2.4 + 1, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

/* ══════════════ filling injector ══════════════ */

export function drawInjector(ctx, x, y, size, fillColor, t, pressing = false){
  const s = size / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(.42);
  ctx.scale(s, s);

  ctx.shadowColor = 'rgba(110,60,100,.28)';
  ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;

  /* needle */
  ctx.beginPath();
  ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(2, -26); ctx.lineTo(-2, -26);
  ctx.closePath();
  ctx.fillStyle = '#c9d4e2'; ctx.fill();

  /* barrel */
  roundRect(ctx, -15, -104, 30, 78, 8);
  ctx.fillStyle = 'rgba(240,248,255,.9)'; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(120,150,180,.6)'; ctx.lineWidth = 2.5; ctx.stroke();

  /* the cream inside */
  const level = pressing ? 34 : 48;
  roundRect(ctx, -11, -30 - level, 22, level, 5);
  ctx.fillStyle = fillColor; ctx.fill();

  /* plunger */
  const push = pressing ? 12 : 0;
  roundRect(ctx, -13, -122 + push, 26, 20, 5);
  ctx.fillStyle = '#e0417b'; ctx.fill();
  roundRect(ctx, -20, -128 + push, 40, 8, 4);
  ctx.fillStyle = '#c8356c'; ctx.fill();

  specular(ctx, -6, -80, 8, .7);
  ctx.restore();
}
