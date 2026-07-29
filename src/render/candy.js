/* ============================================================
   The compositor — turns a design object into a finished candy.

   design = {
     candy:'bar', color:'pink', flavor:'milk', pack:'none', text:'',
     items:[{ id, x, y, rot, scale, color, seed }]
   }
   ============================================================ */

import { drawCandyBase } from './candyArt.js';
import { drawDeco } from './decoArt.js';
import { U, alpha, mix, roundRect, heartPath, gloss, specular, domeFill, linearFill } from './shade.js';
import { getCandy } from '../data/candies.js';
import { getDeco, getPack } from '../data/decorations.js';
import { getColor } from '../data/palette.js';
import { pruneTools } from '../data/tools.js';
import { applyTools, drawPipedStroke } from './tools.js';
import { drawBackdrop, drawFrame, frameInset } from './backdrop.js';
import { TAU, rngFrom } from '../core/utils.js';

/* ══════════════ packaging ══════════════ */

function packBack(ctx, art, colorId){
  const c = getColor(colorId);
  switch (art){
    case 'giftbox': case 'window': case 'luxury': {
      roundRect(ctx, 130, 300, 740, 620, 40);
      ctx.fillStyle = linearFill(ctx, art === 'luxury' ? 'gold' : colorId, 130, 300, 700, 900, { flip:true });
      ctx.globalAlpha = .85; ctx.fill(); ctx.globalAlpha = 1;
      break;
    }
    case 'heartbox': {
      ctx.save(); ctx.translate(0, 40);
      heartPath(ctx, 500, 520, 820, 700);
      ctx.fillStyle = linearFill(ctx, colorId, 100, 200, 900, 900, { flip:true });
      ctx.globalAlpha = .9; ctx.fill();
      ctx.restore();
      break;
    }
    case 'jar': {
      roundRect(ctx, 205, 235, 590, 700, 90);
      ctx.fillStyle = 'rgba(226,241,255,.5)'; ctx.fill();
      break;
    }
    case 'bag': {
      ctx.beginPath();
      ctx.moveTo(180, 250); ctx.lineTo(820, 250); ctx.lineTo(860, 940); ctx.lineTo(140, 940);
      ctx.closePath();
      const g = ctx.createLinearGradient(140, 0, 860, 0);
      g.addColorStop(0, '#c9a184'); g.addColorStop(.4, '#e8cdb2'); g.addColorStop(1, '#b98d6c');
      ctx.fillStyle = g; ctx.fill();
      break;
    }
    case 'crystal': {
      ctx.beginPath();
      ctx.moveTo(500, 120); ctx.lineTo(890, 400); ctx.lineTo(790, 930);
      ctx.lineTo(210, 930); ctx.lineTo(110, 400); ctx.closePath();
      ctx.fillStyle = 'rgba(220,238,255,.32)'; ctx.fill();
      break;
    }
  }
}

function packFront(ctx, art, colorId, t){
  const c = getColor(colorId);
  switch (art){
    case 'cello': {
      ctx.save();
      roundRect(ctx, 120, 150, 760, 760, 90);
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 8; ctx.stroke();
      ctx.save(); roundRect(ctx, 120, 150, 760, 760, 90); ctx.clip();
      for (let i = -3; i < 6; i++){
        const g = ctx.createLinearGradient(i * 200, 0, i * 200 + 130, 1000);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(.5, 'rgba(255,255,255,.30)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(i * 200, 0, 150, 1000);
      }
      ctx.restore();
      // twisted ends
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (const y of [120, 940]){
        ctx.beginPath(); ctx.ellipse(500, y, 130, 34, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'foil': {
      ctx.save();
      roundRect(ctx, 140, 170, 720, 720, 70);
      ctx.clip();
      const g = ctx.createLinearGradient(140, 170, 860, 890);
      g.addColorStop(0, alpha(c.light, .55));
      g.addColorStop(.22, 'rgba(255,255,255,.5)');
      g.addColorStop(.42, alpha(c.base, .35));
      g.addColorStop(.62, 'rgba(255,255,255,.45)');
      g.addColorStop(.85, alpha(c.dark, .35));
      g.addColorStop(1, 'rgba(255,255,255,.4)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, U, U);
      // crinkle creases
      const rng = rngFrom('foil');
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 4;
      for (let i = 0; i < 16; i++){
        ctx.beginPath();
        let x = 140 + rng() * 720, y = 170;
        ctx.moveTo(x, y);
        while (y < 890){ x += (rng() - .5) * 90; y += 60 + rng() * 60; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'giftbox': case 'window': case 'luxury': {
      const gold = art === 'luxury';
      // front panel (lower half so the candy still shows)
      roundRect(ctx, 130, 600, 740, 330, 36);
      ctx.fillStyle = linearFill(ctx, gold ? 'gold' : colorId, 130, 600, 700, 930);
      ctx.fill();
      ctx.lineWidth = 10; ctx.strokeStyle = alpha(gold ? '#8a5c05' : c.dark, .45); ctx.stroke();
      if (art === 'window'){
        roundRect(ctx, 250, 640, 500, 240, 24);
        ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 7; ctx.stroke();
      }
      if (gold){
        ctx.strokeStyle = 'rgba(255,245,200,.85)'; ctx.lineWidth = 6;
        roundRect(ctx, 158, 628, 684, 274, 24); ctx.stroke();
        // ribbon over the box
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillRect(468, 600, 64, 330);
      }
      gloss(ctx, 300, 680, 180, 60, -.2, .35);
      break;
    }
    case 'heartbox': {
      ctx.save();
      heartPath(ctx, 500, 560, 800, 680);
      ctx.clip();
      ctx.fillStyle = alpha(c.base, .28); ctx.fillRect(0, 500, U, U);
      ctx.restore();
      ctx.lineWidth = 16; ctx.strokeStyle = alpha(c.dark, .5);
      heartPath(ctx, 500, 560, 800, 680); ctx.stroke();
      break;
    }
    case 'jar': {
      ctx.save();
      roundRect(ctx, 205, 235, 590, 700, 90);
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 12; ctx.stroke();
      ctx.save(); roundRect(ctx, 205, 235, 590, 700, 90); ctx.clip();
      const g = ctx.createLinearGradient(205, 0, 795, 0);
      g.addColorStop(0, 'rgba(255,255,255,.42)');
      g.addColorStop(.2, 'rgba(255,255,255,.05)');
      g.addColorStop(.72, 'rgba(255,255,255,.30)');
      g.addColorStop(1, 'rgba(180,205,230,.35)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, U, U);
      ctx.restore();
      // cork
      roundRect(ctx, 320, 130, 360, 130, 26);
      const cg = ctx.createLinearGradient(320, 0, 680, 0);
      cg.addColorStop(0, '#a9784e'); cg.addColorStop(.45, '#d8ab7c'); cg.addColorStop(1, '#8b5e3c');
      ctx.fillStyle = cg; ctx.fill();
      ctx.restore();
      break;
    }
    case 'crystal': {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(500, 120); ctx.lineTo(890, 400); ctx.lineTo(790, 930);
      ctx.lineTo(210, 930); ctx.lineTo(110, 400); ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 10; ctx.stroke();
      ctx.save(); ctx.clip();
      const g = ctx.createLinearGradient(110, 120, 890, 930);
      g.addColorStop(0, 'rgba(255,255,255,.42)');
      g.addColorStop(.35, 'rgba(200,230,255,.10)');
      g.addColorStop(.6, 'rgba(255,255,255,.35)');
      g.addColorStop(1, 'rgba(210,190,255,.30)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, U, U);
      // facet edges
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 5;
      [[500,120,500,930],[110,400,890,400],[110,400,790,930],[890,400,210,930]].forEach(([a,b,cx,d]) => {
        ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(cx,d); ctx.stroke();
      });
      ctx.restore();
      // travelling rainbow glint
      ctx.globalCompositeOperation = 'lighter';
      const gx = 300 + Math.sin(t * .7) * 260;
      const sg = ctx.createLinearGradient(gx - 90, 0, gx + 90, 1000);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(.5, 'rgba(255,220,255,.28)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(110, 120, 780, 810);
      ctx.restore();
      break;
    }
    case 'bag': {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(180, 620); ctx.lineTo(820, 620); ctx.lineTo(860, 940); ctx.lineTo(140, 940);
      ctx.closePath();
      const g = ctx.createLinearGradient(140, 0, 860, 0);
      g.addColorStop(0, '#b98d6c'); g.addColorStop(.4, '#e8cdb2'); g.addColorStop(1, '#a97f5e');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(110,75,45,.35)'; ctx.lineWidth = 6; ctx.stroke();
      // fold line
      ctx.beginPath(); ctx.moveTo(190, 700); ctx.lineTo(812, 700); ctx.stroke();
      ctx.restore();
      break;
    }
  }
}

/* ══════════════ personalised text ══════════════ */
function drawText(ctx, text, colorId){
  if (!text) return;
  const c = getColor(colorId);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const size = text.length > 14 ? 54 : text.length > 9 ? 66 : 80;
  ctx.font = `800 ${size}px 'Baloo 2', ui-rounded, system-ui, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * .34;
  ctx.strokeStyle = 'rgba(255,255,255,.92)';
  ctx.strokeText(text, 500, 872);
  const g = ctx.createLinearGradient(0, 830, 0, 910);
  g.addColorStop(0, mix(c.light, '#ffffff', .35));
  g.addColorStop(.5, c.base);
  g.addColorStop(1, c.dark);
  ctx.fillStyle = g;
  ctx.fillText(text, 500, 872);
  ctx.restore();
}

/* ══════════════ main entry ══════════════ */

/**
 * @param ctx     2D context
 * @param size    pixel size of the (square) target
 * @param design  design object
 * @param t       time in seconds, drives animated decorations
 */
/* ══════════════ cached candy base ══════════════
   The base (candy + tools) never animates, so it is rendered once per
   configuration and reused every frame. Without this, the tool effects
   would repaint several full-size canvases 60 times a second. */
const baseCache = new Map();
/* Physical tools nudge the settings continuously while you drag, so the
   cache has to hold a handful of neighbouring steps to stay useful. */
const BASE_CACHE_MAX = 20;

function baseSignature(design, size){
  return [
    size, design.candy, design.color, design.flavor,
    JSON.stringify(design.tools || {}),
    JSON.stringify(design.toolFx || {}),
  ].join('|');
}

/** Offscreen canvas holding just the candy with its tool effects applied. */
export function renderCandyBase(size, design){
  const sig = baseSignature(design, size);
  const hit = baseCache.get(sig);
  if (hit){
    // refresh LRU position
    baseCache.delete(sig); baseCache.set(sig, hit);
    return hit;
  }

  const candy = getCandy(design.candy);
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const c2 = cv.getContext('2d');
  c2.save();
  c2.scale(size / U, size / U);
  drawCandyBase(c2, candy.art, { color: design.color, flavor: design.flavor, t: 0 });
  c2.restore();

  const tools = pruneTools(design.tools, design.candy);
  if (Object.keys(tools).length) applyTools(cv, size, tools, design, candy.zone);

  baseCache.set(sig, cv);
  while (baseCache.size > BASE_CACHE_MAX){
    baseCache.delete(baseCache.keys().next().value);
  }
  return cv;
}

/** Drop cached bases — call after a language/theme change or on reset. */
export function clearBaseCache(){ baseCache.clear(); }

/**
 * How much bigger than its box the candy is drawn in the studio.
 * The art leaves a margin inside the 1000-unit space, so without this
 * the candy reads as small even when the stage fills the screen.
 * The studio applies the same factor when mapping touches back to
 * design coordinates, so dragging stays pixel-accurate.
 */
export const STUDIO_ZOOM = 1.22;

export function drawDesign(ctx, size, design, t = 0,
                           { clear = true, background = null, zoom = 1 } = {}){
  ctx.save();
  if (clear) ctx.clearRect(0, 0, size, size);
  if (background){
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
  }

  // The whole design lives in a square of `px` pixels centred in the canvas.
  // Rendering the cached base at that exact size keeps it pin sharp instead
  // of upscaling a smaller bitmap.
  const px = Math.round(size * zoom);
  const off = (size - px) / 2;
  const pack = getPack(design.pack);
  const unit = px / U;

  // Everything below is relative to whatever transform the caller set up —
  // the studio slides and shrinks the whole design while you dip it, so we
  // must never reset the matrix here.
  ctx.translate(off, off);

  ctx.save();
  ctx.scale(unit, unit);
  packBack(ctx, pack.art, design.color);
  ctx.restore();

  // the cached base is already px×px, so it goes down before the unit scale
  ctx.drawImage(renderCandyBase(px, design), 0, 0);

  ctx.scale(unit, unit);

  // piped cream sits on the candy, under the charms and stickers
  for (const stroke of design.strokes || []) drawPipedStroke(ctx, stroke, t);

  const items = [...(design.items || [])].sort(
    (a, b) => (getDeco(a.id)?.layer ?? 4) - (getDeco(b.id)?.layer ?? 4)
  );
  for (const it of items) drawItem(ctx, it, t);

  drawText(ctx, design.text, design.color);
  packFront(ctx, pack.art, design.color, t);

  ctx.restore();
}

/**
 * A finished photo: the set it was shot on, the candy, and the frame
 * around it. Used by the photo studio and by every post on the feed.
 */
export function drawPhoto(ctx, size, design, t = 0, { backdrop = 'none', frame = 'none' } = {}){
  ctx.save();
  drawBackdrop(ctx, size, backdrop, t);

  const inset = frameInset(frame);
  const inner = size * (1 - inset * 2);
  ctx.save();
  // a polaroid's fat bottom lip would swallow the candy — sit it higher
  ctx.translate(size * inset, size * inset - (frame === 'polaroid' ? size * .045 : 0));
  drawDesign(ctx, inner, design, t, { clear: false });
  ctx.restore();

  drawFrame(ctx, size, frame, t);
  ctx.restore();
}

/** Decorations read as accents, not blankets — this is the master scale. */
export const DECO_SCALE = 0.6;

/** World-space radius of a placed item, as a fraction of the candy. */
export function itemRadius(item){
  const deco = getDeco(item.id);
  const sc = (item.scale || 1) * (deco?.size || 1) * DECO_SCALE;
  return Math.max(0.075, 0.11 * sc);
}

/** Draw a single placed decoration in the 1000-unit space. */
export function drawItem(ctx, item, t = 0){
  const deco = getDeco(item.id);
  if (!deco) return;
  const colorId = deco.fixed || item.color || 'pink';
  const c = { ...getColor(colorId), id: colorId };
  ctx.save();
  ctx.translate(item.x * U, item.y * U);
  ctx.rotate(item.rot || 0);
  const sc = (item.scale || 1) * (deco.size || 1) * DECO_SCALE;
  ctx.scale(sc, sc);
  drawDeco(ctx, deco.art, {
    c, t,
    rng: rngFrom(item.seed || item.id),
    glyph: deco.glyph,
    velvet: deco.velvet,
  });
  ctx.restore();
}

/** Thumbnail of a single decoration, centred in a square canvas. */
export function drawDecoThumb(ctx, size, decoId, colorId = 'pink', t = 0){
  const deco = getDeco(decoId);
  if (!deco) return;
  ctx.clearRect(0, 0, size, size);
  const cid = deco.fixed || colorId;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  const sc = (size / 250) / (deco.size || 1) * (deco.size || 1);
  ctx.scale(size / 250, size / 250);
  drawDeco(ctx, deco.art, {
    c: { ...getColor(cid), id: cid },
    t,
    rng: rngFrom(decoId),
    glyph: deco.glyph,
    velvet: deco.velvet,
  });
  ctx.restore();
}

/** Thumbnail of a packaging style. */
export function drawPackThumb(ctx, size, packId, colorId = 'pink', t = 0){
  ctx.clearRect(0, 0, size, size);
  const s = size / U;
  ctx.save(); ctx.scale(s, s);
  const art = getPack(packId).art;
  packBack(ctx, art, colorId);
  if (art === 'none'){
    ctx.font = '360px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🚫', 500, 520);
  }
  packFront(ctx, art, colorId, t);
  ctx.restore();
}

/** Thumbnail of a candy type. */
export function drawCandyThumb(ctx, size, candyId, colorId = 'pink', flavorId = 'milk', t = 0){
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.scale(size / U, size / U);
  drawCandyBase(ctx, getCandy(candyId).art, { color: colorId, flavor: flavorId, t });
  ctx.restore();
}

/** True when a design contains at least one animated decoration. */
export function designIsAnimated(design){
  return (design.items || []).some(it => {
    const d = getDeco(it.id);
    return d && ['glitter','starDust','gem','diamond','crown','butterfly','candle','orchid','silkWrap','pumpkin','snowflake','balloon'].includes(d.art);
  }) || ['crystal'].includes(getPack(design.pack).art);
}
