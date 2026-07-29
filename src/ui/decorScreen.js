/* ============================================================
   Decorating the shop itself.

   Six spots around the diorama. Buy a piece, put it where it goes,
   swap it out whenever you feel like it. A live preview of the shop
   sits at the top so you can see what you are doing.
   ============================================================ */

import { el, $, fmt } from '../core/utils.js';
import { S, save, spend, canAfford, emit } from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { drawShop } from '../render/shop.js';
import { drawDecorPiece } from '../render/shopDecor.js';
import {
  SLOTS, SLOT_BY_ID, DECOR, DECOR_BY_ID, decorFor, decorMood, ANCHORS,
} from '../data/shopDecor.js';
import { go, subHeader } from './nav.js';
import { t } from '../core/i18n.js';

let raf = 0;

const store = () => {
  if (!S.decor) S.decor = { owned: [], placed: {} };
  if (!S.decor.owned) S.decor.owned = [];
  if (!S.decor.placed) S.decor.placed = {};
  return S.decor;
};
const owns = id => store().owned.includes(id);
const placedIn = slot => store().placed[slot] || null;

export function mountDecor(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('decor.title'), '🏠'));

  /* live preview of the shop as it stands */
  const stage = el('div.shop-stage', { style:{ height:'200px' } });
  const cv = el('canvas');
  stage.append(cv);
  wrap.append(stage);

  wrap.append(el('p.tiny.center', { style:{ margin:'-6px 0 12px', fontWeight:'800', color:'var(--pink-600)' } },
    t('decor.mood', { n: decorMood(store().placed) })));

  /* the six spots */
  for (const slot of SLOTS){
    wrap.append(slotCard(slot));
  }

  wrap.append(el('p.tiny.muted.center', { style:{ marginTop:'8px' } }, t('decor.hint')));
  host.append(wrap);

  const c2 = cv.getContext('2d');
  const loop = (now) => {
    if (!document.body.contains(cv)) return;
    const r = stage.getBoundingClientRect();
    const d = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(r.width * d)){
      cv.width = r.width * d; cv.height = r.height * d;
      c2.setTransform(d, 0, 0, d, 0, 0);
    }
    drawShop(c2, r.width, r.height, {
      location: S.location, upgrades: S.upgrades, t: now / 1000,
      satisfaction: 60, customers: [], decor: store().placed,
    });
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

function slotCard(slot){
  const current = placedIn(slot.id);
  const def = current ? DECOR_BY_ID[current] : null;

  const card = el('div.card',
    el('div.card-title', el('span.ico', slot.emoji), t('decor.slot.' + slot.id),
      el('span.spacer'),
      el('span.sub', def ? t('decor.item.' + def.id) : t('decor.emptySlot'))));

  const row = el('div.decor-row');
  // "nothing here" is always an option
  row.append(pieceButton(null, slot, current === null));
  for (const d of decorFor(slot.kind)){
    row.append(pieceButton(d, slot, current === d.id));
  }
  card.append(row);
  return card;
}

function pieceButton(d, slot, on){
  const btn = el('button.decor-pick' + (on ? '.on' : ''));

  if (!d){
    btn.append(el('span.dp-none', '🚫'), el('b', t('decor.none')));
    btn.onclick = () => {
      delete store().placed[slot.id];
      save(); emit('state');
      sfx('remove'); go('decor');
    };
    return btn;
  }

  const cv = el('canvas', { width:120, height:120 });
  const c2 = cv.getContext('2d');
  // pieces that span the shop get a squashed preview of the whole thing
  if (d.kind === 'ceiling') drawDecorPiece(c2, d.id, 60, 20, 60, 0, 120, 190);
  else drawDecorPiece(c2, d.id, 60, d.kind === 'wall' ? 60 : 108, 66, 0, 120, 120);
  btn.append(cv, el('b', t('decor.item.' + d.id)));

  const owned = owns(d.id);
  const levelOk = S.level >= d.unlock;

  if (!owned){
    btn.append(el('span.dp-cost', levelOk ? `🪙 ${fmt(d.price)}` : `🔒 ${d.unlock}`));
    if (!levelOk) btn.classList.add('locked');
  }

  btn.onclick = () => {
    if (!owned){
      if (!levelOk){
        sfx('error');
        return toast(t('lock.level', { n: d.unlock }), 'warn', '🔒');
      }
      return askBuy(d, slot);
    }
    store().placed[slot.id] = d.id;
    save(); emit('state');
    sfx('place'); haptic(10);
    go('decor');
  };
  return btn;
}

function askBuy(d, slot){
  if (!canAfford(d.price)){
    sfx('error');
    return toast(t('buy.noCoins'), 'bad', '💸');
  }
  confirmModal({
    icon: d.emoji,
    title: t('buy.title', { name: t('decor.item.' + d.id) }),
    sub: t('decor.buySub', { n: fmt(d.price), mood: d.mood }),
    yes: `🪙 ${fmt(d.price)}`,
    onYes: () => {
      if (!spend(d.price)) return;
      store().owned.push(d.id);
      store().placed[slot.id] = d.id;
      save(); emit('state');
      sfx('unlock'); haptic([12, 30, 12]); confetti(26);
      toast(t('decor.bought', { name: t('decor.item.' + d.id) }), 'good', d.emoji);
      go('decor');
    },
  });
}
