/* ============================================================
   Level-up reward grid — 3×3 cards, pick two.

   Prizes are shop goods, coins/gems, or the reward-only
   decorations. Never candy: that already unlocks by level.
   ============================================================ */

import { el, $, fmt, shuffle, pick, randI, clamp } from '../core/utils.js';
import {
  S, addCoins, addGems, grantDeco, grantPack, ownsDeco, ownsPack, save,
} from '../core/state.js';
import { sfx, haptic, duck } from '../core/audio.js';
import { toast, confetti, sparkleBurst, coinFly, bumpPill } from '../core/fx.js';
import { openModal } from './modal.js';
import { drawDecoThumb, drawPackThumb } from '../render/candy.js';
import { DECORATIONS, PACKAGING, getDeco, getPack } from '../data/decorations.js';
import { RARITY } from '../data/palette.js';
import { activeEvent } from '../data/events.js';
import { t, tName } from '../core/i18n.js';

const PICKS = 2;

/* ── prize pool ──────────────────────────────────────── */

function decoCandidates(level){
  const ev = activeEvent();
  return DECORATIONS.filter(d =>
    !ownsDeco(d.id) &&
    (!d.event || d.event === ev?.id) &&
    (d.reward || d.unlock <= level + 4));
}

function packCandidates(level){
  return PACKAGING.filter(p => p.id !== 'none' && !ownsPack(p.id) && p.unlock <= level + 4);
}

/**
 * Nine prizes for one level-up. Items first, coins/gems fill the rest.
 */
export function buildPool(level){
  const pool = [];

  // reward-only decorations are the headline prize
  const rewardDecos = shuffle(decoCandidates(level).filter(d => d.reward));
  const shopDecos   = shuffle(decoCandidates(level).filter(d => !d.reward));
  const packs       = shuffle(packCandidates(level));

  if (rewardDecos[0]) pool.push({ kind:'deco', id:rewardDecos[0].id });
  if (rewardDecos[1] && level >= 5) pool.push({ kind:'deco', id:rewardDecos[1].id });
  for (const d of shopDecos.slice(0, 3)) pool.push({ kind:'deco', id:d.id });
  if (packs[0]) pool.push({ kind:'pack', id:packs[0].id });

  // currency filler — scales with level so it never feels stingy
  const small = Math.round((260 + level * 110) / 10) * 10;
  const big   = Math.round((small * 2.6) / 10) * 10;
  const fillers = [
    { kind:'coins', amount: small },
    { kind:'coins', amount: Math.round(small * 1.6 / 10) * 10 },
    { kind:'coins', amount: big },
    { kind:'gems',  amount: randI(1, 2) },
    { kind:'gems',  amount: randI(2, 4) },
    { kind:'coins', amount: Math.round(small * .7 / 10) * 10 },
  ];
  let i = 0;
  while (pool.length < 9) pool.push(fillers[i++ % fillers.length]);

  return shuffle(pool).slice(0, 9);
}

/* ── prize presentation ──────────────────────────────── */

function prizeLabel(p){
  if (p.kind === 'coins') return `🪙 ${fmt(p.amount)}`;
  if (p.kind === 'gems')  return `💎 ${p.amount}`;
  if (p.kind === 'deco'){
    const d = getDeco(p.id);
    return `${d ? tName('deco', d.id, d.name) : '?'}`;
  }
  const k = getPack(p.id);
  return `${k ? tName('pack', k.id, k.name) : '?'}`;
}

function prizeRarity(p){
  if (p.kind === 'deco') return getDeco(p.id)?.rarity || 'common';
  if (p.kind === 'pack') return getPack(p.id)?.rarity || 'common';
  if (p.kind === 'gems') return 'rare';
  return 'common';
}

/** Face-up card art. */
function prizeArt(p, size = 96){
  if (p.kind === 'deco' || p.kind === 'pack'){
    const cv = el('canvas', { width:size * 2, height:size * 2,
      style:{ width:size + 'px', height:size + 'px' } });
    const c2 = cv.getContext('2d');
    if (p.kind === 'deco'){
      const d = getDeco(p.id);
      drawDecoThumb(c2, size * 2, p.id, d?.fixed || 'pink', 0);
      if (RARITY[d.rarity].animated){
        let tt = 0;
        const iv = setInterval(() => {
          tt += .09;
          if (!document.body.contains(cv)){ clearInterval(iv); return; }
          drawDecoThumb(c2, size * 2, p.id, d?.fixed || 'pink', tt);
        }, 90);
      }
    } else {
      drawPackThumb(c2, size * 2, p.id, 'pink', 0);
    }
    return cv;
  }
  return el('span.lr-emoji', p.kind === 'gems' ? '💎' : '🪙');
}

/* ── granting ────────────────────────────────────────── */

function grantPrize(p){
  if (p.kind === 'coins'){
    addCoins(p.amount);
    coinFly(window.innerWidth / 2, window.innerHeight * .5, 8);
    bumpPill('#hudCoins');
    return;
  }
  if (p.kind === 'gems'){ addGems(p.amount); bumpPill('#hudGems'); return; }
  if (p.kind === 'deco'){
    // if it somehow got bought in the meantime, pay out instead
    if (!grantDeco(p.id)) addCoins(900);
    return;
  }
  if (!grantPack(p.id)) addCoins(900);
}

/* ── the modal ───────────────────────────────────────── */

/**
 * Open the grid for the next queued level.
 * @param onDone called once the queue is empty
 */
export function openLevelReward(onDone){
  const pending = S.levelRewards?.pending || [];
  if (!pending.length){ onDone?.(); return; }

  const level = pending[0];
  const pool = buildPool(level);
  const picked = [];
  let done = false;

  /* preview of everything in this grid */
  const preview = el('div.lr-preview');
  for (const p of pool){
    preview.append(el('div.lr-chip.rar-' + prizeRarity(p), prizeLabel(p)));
  }

  const counter = el('div.lr-counter', t('lr.picks', { n: PICKS }));
  const grid = el('div.lr-grid');

  const cards = pool.map((p, i) => {
    const card = el('button.lr-card', { dataset:{ i:String(i) } },
      el('div.lr-face.lr-back', el('span', '🍬')),
      el('div.lr-face.lr-front.rar-' + prizeRarity(p)),
    );
    card.addEventListener('click', () => flip(card, p));
    return card;
  });
  cards.forEach(c => grid.append(c));

  function flip(card, p, silent = false){
    if (card.classList.contains('open')) return;
    if (!silent && (done || picked.length >= PICKS)) return;

    card.classList.add('open');
    const front = card.querySelector('.lr-front');
    front.append(prizeArt(p, silent ? 54 : 62), el('b', prizeLabel(p)));

    if (silent){ card.classList.add('dim'); return; }

    picked.push(p);
    grantPrize(p);
    sfx(p.kind === 'coins' ? 'coin' : p.kind === 'gems' ? 'gem' : 'unlock');
    haptic([10, 25]);
    const r = card.getBoundingClientRect();
    sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 12);

    counter.textContent = picked.length >= PICKS
      ? t('lr.done')
      : t('lr.picks', { n: PICKS - picked.length });

    if (picked.length >= PICKS){
      done = true;
      confetti(40);
      grid.classList.add('finished');
      // show what was behind the other cards
      cards.forEach((c, i) => {
        if (!c.classList.contains('open')){
          setTimeout(() => flip(c, pool[i], true), 120 + i * 55);
        }
      });
      collectBtn.disabled = false;
      collectBtn.classList.remove('is-waiting');
    }
  }

  const collectBtn = el('button.btn.mint.block', {
    disabled:true, class:'is-waiting',
    onclick: () => {
      // pop this level off the queue and chain to the next one
      S.levelRewards.pending = (S.levelRewards.pending || []).filter((_, idx) => idx !== 0);
      save();
      close(true);
      setTimeout(() => openLevelReward(onDone), 260);
    },
  }, t('lr.collect'));

  duck(1500);
  const close = openModal({
    icon:'🎁',
    title: t('lr.title', { n: level }),
    sub: t('lr.sub'),
    dismissable:false,
    body: [
      el('p.lr-hint', t('lr.possible')),
      preview,
      counter,
      grid,
      el('div', { style:{ marginTop:'12px' } }, collectBtn),
    ],
  });
}

/** True when the player still has an unopened reward grid. */
export const hasPendingLevelReward = () => (S.levelRewards?.pending || []).length > 0;
