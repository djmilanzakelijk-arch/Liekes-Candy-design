/* ============================================================
   Scoring an order: accuracy, speed, stars, coins, tips, XP.
   ============================================================ */

import { S, bonuses } from '../core/state.js';
import { getCandy } from '../data/candies.js';
import { getDeco, getPack } from '../data/decorations.js';
import { RARITY } from '../data/palette.js';
import { getLocation } from '../data/upgrades.js';
import { activeEvent } from '../data/events.js';
import { clamp } from '../core/utils.js';
import { t, tLines } from '../core/i18n.js';

/**
 * Compare a finished design against the order.
 * @returns { parts, accuracy, speed, stars, checks }
 */
export function grade(design, order, { timeLeft = 0, timeTotal = 1 } = {}){
  const checks = {};
  const parts = [];

  /* candy type */
  const candyOk = design.candy === order.candy;
  checks.candy = candyOk;
  parts.push({ key:'candy', label:t('part.candy'), weight:26, score: candyOk ? 1 : 0 });

  /* main colour */
  const colorOk = design.color === order.color;
  checks.color = colorOk;
  parts.push({ key:'color', label:t('part.color'), weight:22, score: colorOk ? 1 : 0 });

  /* decorations */
  const placed = design.items || [];
  let decoScore = 0;
  if (order.wants.length){
    let sum = 0;
    for (const want of order.wants){
      const matches = placed.filter(p => p.id === want.id);
      const deco = getDeco(want.id);
      let s = 0;
      if (matches.length){
        // quantity
        const qty = clamp(matches.length / want.count, 0, 1);
        // colour, when the customer asked for one
        let colScore = 1;
        if (want.color && deco && deco.colorable && !deco.fixed){
          const right = matches.filter(m => (m.color || 'pink') === want.color).length;
          colScore = clamp(right / Math.min(matches.length, want.count), 0, 1);
        }
        s = qty * (0.55 + 0.45 * colScore);
      }
      checks['deco:' + want.id] = s >= .999;
      sum += s;
    }
    decoScore = sum / order.wants.length;
  } else {
    decoScore = 1;
  }
  parts.push({ key:'deco', label:t('part.deco'), weight:30, score: decoScore });

  /* tools — filling, dip, torch, dust, marble, cream */
  const wantTools = Object.entries(order.tools || {});
  if (wantTools.length){
    let sum = 0;
    for (const [id, want] of wantTools){
      let got = (design.tools || {})[id];
      // the cream whipper is painted on rather than switched on: any piped
      // stroke of the requested colour counts as using it
      if (id === 'swirl'){
        const strokes = design.strokes || [];
        got = strokes.some(k => k.color === want) ? want
            : strokes.length ? strokes[0].color : null;
      }
      let s = 0;
      if (got != null){
        if (id === 'dip'){
          // right chocolate matters most, depth is worth a little
          const colorOk = got.color === want.color ? 1 : 0;
          const depthOk = Math.abs((got.depth ?? .45) - (want.depth ?? .45)) < .15 ? 1 : .4;
          s = colorOk * .75 + depthOk * .25;
        } else if (id === 'toast'){
          const diff = Math.abs(got - want);
          s = diff === 0 ? 1 : diff === 1 ? .55 : .15;
        } else {
          s = got === want ? 1 : .2;   // used the tool, wrong setting
        }
      }
      checks['tool:' + id] = s >= .999;
      sum += s;
    }
    parts.push({ key:'tools', label:t('part.tools'), weight:18, score: sum / wantTools.length });
  }

  /* packaging */
  if (order.pack){
    const packOk = design.pack === order.pack;
    checks.pack = packOk;
    parts.push({ key:'pack', label:t('part.pack'), weight:12, score: packOk ? 1 : 0 });
  } else if (design.pack && design.pack !== 'none'){
    // an unrequested wrap is a small bonus, never a penalty
    parts.push({ key:'pack', label:t('part.pack'), weight:4, score: 1 });
  }

  /* personalised text */
  if (order.text){
    const textOk = (design.text || '').trim().toLowerCase() === order.text.toLowerCase();
    checks.text = textOk;
    parts.push({ key:'text', label:t('part.text'), weight:10, score: textOk ? 1 : 0 });
  }

  /* tidiness — a wall of unrequested decorations reads as messy */
  const requested = order.wants.reduce((a, w) => a + w.count, 0);
  const extra = Math.max(0, placed.length - requested);
  const clutter = clamp(1 - Math.max(0, extra - 3) * .06, .55, 1);
  parts.push({ key:'tidy', label:t('part.tidy'), weight:8, score: clutter });

  const totalW = parts.reduce((a, p) => a + p.weight, 0);
  const accuracy = clamp(parts.reduce((a, p) => a + p.weight * p.score, 0) / totalW, 0, 1);

  /* speed — how much patience was left */
  const speed = clamp(timeLeft / Math.max(1, timeTotal), 0, 1);

  const b = bonuses();
  const raw = accuracy * .78 + speed * .22 + b.starBonus;
  const stars = raw >= .94 ? 5 : raw >= .84 ? 4 : raw >= .70 ? 3 : raw >= .52 ? 2 : 1;

  return { parts, accuracy, speed, stars, checks, extra, perfect: accuracy >= .995 };
}

/**
 * Convert a grade into money and experience.
 */
export function payout(design, order, result, customer){
  const b = bonuses();
  const loc = getLocation(S.location);
  const ev = activeEvent();
  const candy = getCandy(order.candy);

  // rarity of everything the player actually used lifts the price
  let rarityMult = 1;
  for (const it of design.items || []){
    const d = getDeco(it.id);
    if (d) rarityMult += (RARITY[d.rarity].mult - 1) * .12;
  }
  const packBonus = 1 + (getPack(design.pack).bonus || 0);

  const base = candy.base * order.quantity
    * b.priceMult * loc.payMult * packBonus * rarityMult
    * (ev ? ev.payMult : 1)
    * (order.vip ? 2.2 : 1);

  // stars scale the actual payment
  const starMult = [0, .35, .6, .9, 1.15, 1.45][result.stars];
  let coins = Math.round(base * starMult);

  // tip: only for good work, boosted by personality and the register upgrade
  const tipBase = result.stars >= 4 ? (result.stars === 5 ? .35 : .18) : result.stars === 3 ? .06 : 0;
  const speedTip = result.speed > .5 ? (result.speed - .5) * .25 : 0;
  let tips = Math.round(base * (tipBase + speedTip) * (customer?.pers.tip ?? 1) * b.tipMult);
  if (tips < 0) tips = 0;

  // streak combo
  const streak = S.streak;
  const comboMult = streak >= 2 ? 1 + Math.min(streak - 1, 9) * .08 : 1;
  const combo = comboMult > 1 ? Math.round((coins + tips) * (comboMult - 1)) : 0;

  const xp = Math.round((14 + result.stars * 9 + (order.vip ? 30 : 0)) * (1 + result.accuracy));

  // gems are rare: only for flawless work, more likely for VIPs
  let gems = 0;
  if (result.stars === 5 && result.perfect) gems += order.vip ? 2 : (Math.random() < .18 ? 1 : 0);

  return {
    coins, tips, combo, gems, xp,
    total: coins + tips + combo,
    comboMult,
  };
}

/** Pick the line the customer says on their way out, in the active language. */
export function reactionLine(customer, stars){
  const p = customer.pers;
  const key = stars >= 5 ? 'happy' : stars >= 3 ? 'okay' : 'sad';
  const bucket = tLines(p.id, key, p[key]);
  return bucket[Math.floor(Math.random() * bucket.length)];
}

/** Star → shop-satisfaction nudge. */
export const satisfactionDelta = stars => [0, -6, -2, 1, 3, 5][stars];
