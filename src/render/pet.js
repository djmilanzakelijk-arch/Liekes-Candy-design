/* ============================================================
   The shop pet.

   Four little animals, drawn procedurally in a 1000-unit square like
   everything else, so they scale from a tab badge to a full screen.
   They blink, breathe, wag and look happier when they are looked
   after.
   ============================================================ */

import { alpha, mix, roundRect, specular, gloss } from './shade.js';
import { TAU } from '../core/utils.js';
import { PETS, PET_BY_ID } from '../data/pet.js';

export { PETS, PET_BY_ID } from '../data/pet.js';

/**
 * @param mood 0..1 — droops when neglected, bouncy when looked after
 */
export function drawPet(ctx, size, kind = 'cat', t = 0, mood = 1){
  const pet = PET_BY_ID[kind] || PETS[0];
  const s = size / 1000;

  ctx.save();
  ctx.scale(s, s);

  // breathing, and a bounce that only a happy animal does
  const breathe = 1 + Math.sin(t * 1.6) * .012;
  const bounce = Math.sin(t * 2.4) * 14 * mood;
  ctx.translate(500, 560 + bounce);
  ctx.scale(1, breathe);
  ctx.translate(-500, -560);

  // a blink every few seconds
  const blink = Math.max(0, 1 - Math.abs(((t * .55) % 1) - .5) * 26);
  const eyeOpen = 1 - blink;

  switch (pet.id){
    case 'cat':    drawCat(ctx, pet, t, mood, eyeOpen); break;
    case 'dog':    drawDog(ctx, pet, t, mood, eyeOpen); break;
    case 'bunny':  drawBunny(ctx, pet, t, mood, eyeOpen); break;
    case 'parrot': drawParrot(ctx, pet, t, mood, eyeOpen); break;
  }
  ctx.restore();
}

/* ── shared bits ─────────────────────────────────────── */

function shadow(ctx){
  ctx.save();
  ctx.fillStyle = 'rgba(150,110,140,.16)';
  ctx.beginPath();
  ctx.ellipse(500, 830, 210, 34, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function body(ctx, pet, w = 250, h = 220, cy = 660){
  const g = ctx.createLinearGradient(500 - w, cy - h, 500 + w, cy + h);
  g.addColorStop(0, mix(pet.coat, '#ffffff', .35));
  g.addColorStop(.55, pet.coat);
  g.addColorStop(1, mix(pet.coat, '#000000', .16));
  ctx.beginPath();
  ctx.ellipse(500, cy, w, h, 0, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(500, cy + h * .22, w * .58, h * .55, 0, 0, TAU);
  ctx.fillStyle = alpha(pet.belly, .9);
  ctx.fill();
}

function head(ctx, pet, cy = 380, r = 190){
  const g = ctx.createRadialGradient(500 - r * .3, cy - r * .35, r * .1, 500, cy, r);
  g.addColorStop(0, mix(pet.coat, '#ffffff', .45));
  g.addColorStop(.7, pet.coat);
  g.addColorStop(1, mix(pet.coat, '#000000', .12));
  ctx.beginPath();
  ctx.arc(500, cy, r, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
}

function eyes(ctx, cy, open, dx = 62){
  ctx.fillStyle = '#2b2029';
  for (const sx of [-dx, dx]){
    ctx.save();
    ctx.translate(500 + sx, cy);
    ctx.scale(1, Math.max(.06, open));
    ctx.beginPath(); ctx.arc(0, 0, 25, 0, TAU); ctx.fill();
    ctx.restore();
    if (open > .5){
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(500 + sx - 8, cy - 9, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2b2029';
    }
  }
}

function blush(ctx, cy, mood){
  if (mood < .45) return;
  ctx.fillStyle = `rgba(255,140,180,${.18 + mood * .22})`;
  for (const sx of [-118, 118]){
    ctx.beginPath(); ctx.ellipse(500 + sx, cy + 24, 34, 20, 0, 0, TAU); ctx.fill();
  }
}

function smile(ctx, cy, mood){
  ctx.strokeStyle = '#2b2029';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  // a happy animal smiles; a sad one does not
  const curve = -18 + (1 - mood) * 36;
  ctx.moveTo(468, cy);
  ctx.quadraticCurveTo(500, cy - curve, 532, cy);
  ctx.stroke();
}

function nose(ctx, cy, color = '#e0708f'){
  ctx.beginPath();
  ctx.moveTo(500, cy + 12);
  ctx.lineTo(478, cy - 8);
  ctx.lineTo(522, cy - 8);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/* ── the animals ─────────────────────────────────────── */

function drawCat(ctx, pet, t, mood, open){
  shadow(ctx);

  // tail, flicking more when content
  ctx.save();
  ctx.strokeStyle = pet.coat;
  ctx.lineWidth = 40; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(720, 700);
  ctx.quadraticCurveTo(870 + Math.sin(t * 2.2) * 40 * mood, 620,
                       840 + Math.sin(t * 2.2) * 60 * mood, 460);
  ctx.stroke();
  ctx.restore();

  body(ctx, pet);

  // ears
  ctx.fillStyle = pet.coat;
  for (const sx of [-1, 1]){
    ctx.beginPath();
    ctx.moveTo(500 + sx * 96, 250);
    ctx.lineTo(500 + sx * 176, 138);
    ctx.lineTo(500 + sx * 186, 288);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(500 + sx * 112, 252);
    ctx.lineTo(500 + sx * 162, 178);
    ctx.lineTo(500 + sx * 168, 272);
    ctx.closePath();
    ctx.fillStyle = '#ffc0d4'; ctx.fill();
    ctx.fillStyle = pet.coat;
  }

  head(ctx, pet);
  eyes(ctx, 372, open);
  nose(ctx, 432);
  smile(ctx, 468, mood);
  blush(ctx, 400, mood);

  // whiskers
  ctx.strokeStyle = 'rgba(60,40,55,.35)';
  ctx.lineWidth = 5;
  for (const sx of [-1, 1]){
    for (const dy of [-14, 6, 26]){
      ctx.beginPath();
      ctx.moveTo(500 + sx * 130, 440 + dy);
      ctx.lineTo(500 + sx * 250, 424 + dy * 1.5);
      ctx.stroke();
    }
  }
}

function drawDog(ctx, pet, t, mood, open){
  shadow(ctx);

  ctx.save();
  ctx.strokeStyle = pet.coat;
  ctx.lineWidth = 46; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(730, 690);
  const wag = Math.sin(t * 7) * 70 * mood;
  ctx.quadraticCurveTo(850, 600, 830 + wag, 500);
  ctx.stroke();
  ctx.restore();

  body(ctx, pet);
  head(ctx, pet);

  // floppy ears, drawn over the head
  ctx.fillStyle = mix(pet.coat, '#000000', .18);
  for (const sx of [-1, 1]){
    ctx.save();
    ctx.translate(500 + sx * 172, 340);
    ctx.rotate(sx * (.18 + Math.sin(t * 2) * .05 * mood));
    ctx.beginPath();
    ctx.ellipse(0, 60, 62, 128, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // muzzle
  ctx.beginPath();
  ctx.ellipse(500, 462, 112, 84, 0, 0, TAU);
  ctx.fillStyle = alpha(pet.belly, .95); ctx.fill();

  eyes(ctx, 360, open);
  nose(ctx, 440, '#4a3630');
  smile(ctx, 492, mood);
  blush(ctx, 396, mood);
  // a lolling tongue when very happy
  if (mood > .7){
    ctx.beginPath();
    ctx.ellipse(500, 520 + Math.sin(t * 3) * 5, 30, 44, 0, 0, TAU);
    ctx.fillStyle = '#ff8ea8'; ctx.fill();
  }
}

function drawBunny(ctx, pet, t, mood, open){
  shadow(ctx);

  // long ears
  ctx.fillStyle = pet.coat;
  for (const sx of [-1, 1]){
    ctx.save();
    ctx.translate(500 + sx * 74, 250);
    ctx.rotate(sx * (.16 + Math.sin(t * 1.7 + (sx > 0 ? 1 : 0)) * .09 * mood));
    ctx.beginPath();
    ctx.ellipse(0, -150, 48, 168, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -150, 26, 128, 0, 0, TAU);
    ctx.fillStyle = '#ffd0e2'; ctx.fill();
    ctx.fillStyle = pet.coat;
    ctx.restore();
  }

  body(ctx, pet, 236, 208);
  head(ctx, pet, 400, 178);
  eyes(ctx, 388, open, 58);
  nose(ctx, 446);
  smile(ctx, 482, mood);
  blush(ctx, 412, mood);

  // a fluffy tail peeking out
  ctx.beginPath();
  ctx.arc(742, 700, 46, 0, TAU);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  specular(ctx, 728, 686, 16, .8);
}

function drawParrot(ctx, pet, t, mood, open){
  shadow(ctx);

  // tail feathers
  ctx.save();
  ctx.translate(500, 760);
  ctx.rotate(Math.sin(t * 1.5) * .06 * mood);
  for (const [dx, col] of [[-46, '#ffd166'], [0, '#ff8ec0'], [46, '#5aabff']]){
    ctx.beginPath();
    ctx.ellipse(dx, 96, 26, 116, dx * .003, 0, TAU);
    ctx.fillStyle = col; ctx.fill();
  }
  ctx.restore();

  body(ctx, pet, 220, 210, 640);

  // a folded wing
  ctx.save();
  ctx.translate(360, 640);
  ctx.rotate(-.25 + Math.sin(t * 2.6) * .12 * mood);
  ctx.beginPath();
  ctx.ellipse(0, 0, 78, 150, 0, 0, TAU);
  ctx.fillStyle = mix(pet.coat, '#000000', .18); ctx.fill();
  ctx.restore();

  head(ctx, pet, 380, 172);

  // crest
  ctx.fillStyle = '#ffd166';
  for (const [dx, h] of [[-46, 96], [0, 128], [46, 96]]){
    ctx.beginPath();
    ctx.ellipse(500 + dx, 232 - h * .4, 22, h * .5,
                dx * .004 + Math.sin(t * 2) * .05, 0, TAU);
    ctx.fill();
  }

  eyes(ctx, 366, open, 56);

  // beak
  ctx.beginPath();
  ctx.moveTo(456, 424);
  ctx.quadraticCurveTo(500, 388, 544, 424);
  ctx.quadraticCurveTo(516, 496, 468, 462);
  ctx.closePath();
  ctx.fillStyle = '#e0a13c'; ctx.fill();
  gloss(ctx, 496, 420, 30, 14, -.2, .5);

  blush(ctx, 400, mood);
}

/** Little thumbnail for the adoption list. */
export function drawPetThumb(ctx, size, kind, t = 0){
  ctx.clearRect(0, 0, size, size);
  drawPet(ctx, size, kind, t, 1);
}
