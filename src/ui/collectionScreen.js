/* ============================================================
   Collection book — every candy, decoration, wrap and sticker.
   ============================================================ */

import { el, $, fmt } from '../core/utils.js';
import { S, ownsDeco, ownsPack, isFresh, clearFresh } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { openModal } from './modal.js';
import { drawDecoThumb, drawPackThumb, drawCandyThumb } from '../render/candy.js';
import { CANDIES } from '../data/candies.js';
import { DECORATIONS, PACKAGING, DECO_CATS } from '../data/decorations.js';
import { RARITY, RARITY_ORDER } from '../data/palette.js';
import { activeEvent } from '../data/events.js';
import { go } from './nav.js';
import { t, tName, tDesc } from '../core/i18n.js';

let collTab = 'all';
let timers = [];

export function mountCollection(host){
  const wrap = el('div.screen.enter');
  wrap.append(el('div.section-head', el('h2', t('coll.title'))));

  /* completion ring */
  const all = allEntries();
  const owned = all.filter(e => e.owned).length;
  const pct = Math.round(owned / all.length * 100);
  wrap.append(el('div.coll-progress',
    ring(pct),
    el('div.grow',
      el('b', { style:{ fontSize:'15px', fontWeight:'800' } }, t('coll.collected', { a:owned, b:all.length })),
      el('div.tiny.muted', t('coll.hint')),
      el('div.bar', { style:{ marginTop:'6px' } }, el('i', { style:{ width:pct + '%' } })),
    ),
  ));

  /* rarity summary */
  const counts = {};
  for (const r of RARITY_ORDER) counts[r] = { n:0, total:0 };
  for (const e of all){ counts[e.rarity].total++; if (e.owned) counts[e.rarity].n++; }
  wrap.append(el('div.chipbar',
    ...RARITY_ORDER.map(r => el('div.chip.rar-' + r, { style:{
      color:'var(--rar-t)', borderColor:'var(--rar-b)',
    }}, `${tName('rarity', r, RARITY[r].name)} ${counts[r].n}/${counts[r].total}`)),
  ));

  /* filters */
  wrap.append(el('div.chipbar',
    ...[['all',t('coll.everything')], ['candy',t('coll.candy')],
        ...DECO_CATS.map(c => [c.id, `${c.emoji} ${tName('cat', c.id, c.name)}`]),
        ['pack',t('coll.packs')]]
      .map(([id, label]) => el('button.chip' + (collTab === id ? '.on' : ''), {
        onclick: () => { sfx('swipe'); collTab = id; go('collection'); },
      }, label)),
  ));

  const shown = all.filter(e =>
    collTab === 'all' ? true :
    collTab === 'candy' ? e.kind === 'candy' :
    collTab === 'pack' ? e.kind === 'pack' :
    e.cat === collTab);

  const grid = el('div.coll-grid');
  for (const e of shown) grid.append(cell(e));
  wrap.append(grid);

  host.append(wrap);
  return () => { timers.forEach(clearInterval); timers = []; };
}

function ring(pct){
  const R = 24, C = 2 * Math.PI * R;
  const node = el('div.coll-ring');
  node.innerHTML = `
    <svg width="58" height="58" viewBox="0 0 58 58" style="transform:rotate(-90deg)">
      <circle cx="29" cy="29" r="${R}" fill="none" stroke="#efe6ff" stroke-width="7"/>
      <circle cx="29" cy="29" r="${R}" fill="none" stroke="#9a6bff" stroke-width="7"
              stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}"/>
    </svg><span>${pct}%</span>`;
  return node;
}

function allEntries(){
  const ev = activeEvent();
  const out = [];
  for (const c of CANDIES){
    out.push({ kind:'candy', id:c.id, name:c.name, rarity: c.unlock >= 15 ? 'legendary' : c.unlock >= 9 ? 'epic' : c.unlock >= 5 ? 'rare' : 'common',
      owned: S.owned.candies.includes(c.id), desc:c.desc, cat:'candy', unlock:c.unlock });
  }
  for (const d of DECORATIONS){
    if (d.event && d.event !== ev?.id && !ownsDeco(d.id)) continue;
    out.push({ kind:'deco', id:d.id, name:d.name, rarity:d.rarity, owned:ownsDeco(d.id),
      desc:d.desc, cat:d.cat, unlock:d.unlock, fixed:d.fixed });
  }
  for (const p of PACKAGING){
    if (p.id === 'none') continue;
    out.push({ kind:'pack', id:p.id, name:p.name, rarity:p.rarity, owned:ownsPack(p.id),
      desc:p.desc, cat:'pack', unlock:p.unlock });
  }
  return out;
}

function cell(e){
  const node = el('div.coll-cell.rar-' + e.rarity + (e.owned ? '' : '.locked'), {
    onclick: () => showEntry(e),
  });
  if (e.owned){
    const cv = el('canvas', { width:140, height:140 });
    node.append(cv);
    const c2 = cv.getContext('2d');
    const paint = time => {
      if (e.kind === 'deco') drawDecoThumb(c2, 140, e.id, e.fixed || 'pink', time);
      else if (e.kind === 'pack') drawPackThumb(c2, 140, e.id, 'pink', time);
      else drawCandyThumb(c2, 140, e.id, 'pink', 'milk', time);
    };
    paint(0);
    if (RARITY[e.rarity].animated){
      let time = 0;
      const iv = setInterval(() => {
        time += .09;
        if (!document.body.contains(cv)){ clearInterval(iv); return; }
        paint(time);
      }, 90);
      timers.push(iv);
    }
    if (isFresh(e.id)) node.append(el('span.new', t('coll.new')));
  } else {
    node.append(el('span.q', '❓'));
  }
  return node;
}

function showEntry(e){
  sfx('tap');
  if (e.owned) clearFresh(e.id);
  const art = el('div.unlock-art.rar-' + e.rarity);
  if (e.owned){
    const cv = el('canvas', { width:200, height:200 });
    art.append(cv);
    const c2 = cv.getContext('2d');
    const paint = time => {
      if (e.kind === 'deco') drawDecoThumb(c2, 200, e.id, e.fixed || 'pink', time);
      else if (e.kind === 'pack') drawPackThumb(c2, 200, e.id, 'pink', time);
      else drawCandyThumb(c2, 200, e.id, 'pink', 'milk', time);
    };
    paint(0);
    if (RARITY[e.rarity].animated){
      let time = 0;
      const iv = setInterval(() => {
        time += .09;
        if (!document.body.contains(cv)){ clearInterval(iv); return; }
        paint(time);
      }, 90);
    }
  } else {
    art.append(el('span.emoji', '❓'));
  }

  const name = tName(e.kind, e.id, e.name);
  const desc = tDesc(e.kind, e.id, e.desc);
  openModal({
    title: e.owned ? name : t('coll.notYet'),
    sub: tName('rarity', e.rarity, RARITY[e.rarity].name)
       + (e.owned ? '' : t('coll.unlockLevel', { n:e.unlock })),
    body: [art, el('p.center.tiny.muted', e.owned ? desc : t('coll.keepPlaying'))],
    actions: [{ label:t('coll.close'), cls:'ghost' }],
  });
}
