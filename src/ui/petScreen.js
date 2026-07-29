/* ============================================================
   The shop pet — adopting, feeding, playing.
   ============================================================ */

import { el, $, fmt, clamp } from '../core/utils.js';
import { S, canAfford } from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti, coinFly, sparkleBurst, bumpPill } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { drawPet } from '../render/pet.js';
import { PETS } from '../render/pet.js';
import {
  pet, hasPet, unlocked, adopt, tickPet, mood, moodTone, feed, play,
  canPlay, playReadyIn, rename, abandon, petBonus,
  FEED_COST, PET_LEVEL,
} from '../game/pet.js';
import { go, subHeader } from './nav.js';
import { t } from '../core/i18n.js';

let raf = 0;

export function mountPet(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('pet.title'), '🐾'));

  if (!unlocked()){
    wrap.append(el('div.card',
      el('div.card-title', el('span.ico', '🔒'), t('pet.title')),
      el('p.tiny.muted.center', { style:{ padding:'10px 4px', lineHeight:'1.5' } },
        t('pet.lockedLevel', { n: PET_LEVEL }))));
    host.append(wrap);
    return;
  }

  if (!hasPet()) return adoptionScreen(host, wrap);

  tickPet();
  const p = pet();
  const m = mood();
  const bonus = petBonus();

  /* the animal itself */
  const stage = el('div.pet-stage');
  const cv = el('canvas', { width:520, height:520 });
  stage.append(cv);
  wrap.append(stage);

  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '🐾'), p.name, el('span.spacer'),
      el('span.sub', t('mood.' + moodTone(m)))),
    meter('🍽️', t('pet.fed'), p.fed),
    meter('💗', t('pet.happy'), p.happy),
    el('p.tiny.center', { style:{ marginTop:'8px', fontWeight:'800', color:'var(--pink-600)' } },
      t('pet.bonus', { s: bonus.satisfaction, tip: Math.round((bonus.tipMult - 1) * 100) })),
  ));

  /* what you can do */
  const row = el('div.row', { style:{ gap:'8px', marginBottom:'12px' } });
  row.append(el('button.btn.gold.grow' + (canAfford(FEED_COST) ? '' : '.ghost'), {
    onclick: () => {
      if (!feed()){ sfx('error'); return toast(t('buy.noCoins'), 'bad', '💸'); }
      sfx('coin'); haptic(12); sparkleBurst(window.innerWidth / 2, window.innerHeight * .35, 10);
      toast(t('pet.fedToast', { name: p.name }), 'good', '🍽️');
      go('pet');
    },
  }, `🍽️ ${t('pet.feed')} · 🪙 ${FEED_COST}`));

  row.append(el('button.btn.mint.grow' + (canPlay() ? '' : '.ghost'), {
    onclick: () => {
      if (!canPlay()){
        sfx('error');
        return toast(t('pet.playWait', { n: Math.ceil(playReadyIn() / 60000) }), 'warn', '⏳');
      }
      const res = play();
      sfx('sparkle'); haptic([10, 20, 10]); confetti(20);
      if (res?.found){
        coinFly(window.innerWidth / 2, window.innerHeight * .4, 8);
        bumpPill('#hudCoins');
        toast(t('pet.found', { name: p.name, n: fmt(res.found) }), 'good', '🪙');
      } else {
        toast(t('pet.played', { name: p.name }), 'good', '💗');
      }
      go('pet');
    },
  }, canPlay() ? `🎾 ${t('pet.play')}` : `⏳ ${Math.ceil(playReadyIn() / 60000)}m`));
  wrap.append(row);

  /* lifetime */
  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '📊'), t('pet.stats')),
    el('div.stat-grid',
      el('div.stat', el('b', fmt(p.meals || 0)), el('span', t('pet.meals'))),
      el('div.stat', el('b', '🪙 ' + fmt(p.found || 0)), el('span', t('pet.foundTotal'))),
      el('div.stat', el('b', String(Math.max(1, Math.round((Date.now() - p.since) / 86400000)))),
        el('span', t('pet.days'))),
    ),
    el('div.row', { style:{ gap:'8px', marginTop:'10px' } },
      el('button.btn.ghost.sm.grow', { onclick: askRename }, t('pet.rename')),
      el('button.btn.ghost.sm.grow', { onclick: askAbandon }, t('pet.rehome')),
    ),
  ));

  host.append(wrap);

  /* keep them breathing */
  const c2 = cv.getContext('2d');
  const loop = (now) => {
    if (!document.body.contains(cv)) return;
    c2.clearRect(0, 0, 520, 520);
    drawPet(c2, 520, p.kind, now / 1000, m);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

function meter(ico, label, value){
  const v = clamp(Math.round(value || 0), 0, 100);
  const cls = v >= 66 ? '.mint' : v >= 33 ? '.gold' : '';
  return el('div', { style:{ marginTop:'8px' } },
    el('div.tiny', { style:{ fontWeight:'800', marginBottom:'3px' } }, `${ico} ${label} — ${v}%`),
    el('div.bar' + cls, { style:{ height:'9px' } }, el('i', { style:{ width: v + '%' } })),
  );
}

/* ══════════════ adopting ══════════════ */

function adoptionScreen(host, wrap){
  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '🏡'), t('pet.adoptTitle')),
    el('p.tiny.muted', t('pet.adoptBlurb')),
  ));

  const grid = el('div.pet-grid');
  const timers = [];
  for (const def of PETS){
    const cv = el('canvas', { width:200, height:200 });
    const c2 = cv.getContext('2d');
    let time = Math.random() * 4;
    const iv = setInterval(() => {
      if (!document.body.contains(cv)){ clearInterval(iv); return; }
      time += .1;
      c2.clearRect(0, 0, 200, 200);
      drawPet(c2, 200, def.id, time, 1);
    }, 100);
    timers.push(iv);
    drawPet(c2, 200, def.id, time, 1);

    grid.append(el('div.pet-card',
      cv,
      el('b', t('pet.kind.' + def.id)),
      el('button.btn' + (canAfford(def.cost) ? '.gold' : '.ghost') + '.sm.block', {
        style:{ marginTop:'6px' },
        onclick: () => askAdopt(def),
      }, `🪙 ${fmt(def.cost)}`),
    ));
  }
  wrap.append(grid);
  host.append(wrap);
  return () => timers.forEach(clearInterval);
}

function askAdopt(def){
  if (!canAfford(def.cost)){
    sfx('error');
    return toast(t('buy.noCoins'), 'bad', '💸');
  }
  const input = el('input.text-field', { type:'text', maxlength:16,
    placeholder: t('pet.namePlaceholder') });
  openModal({
    icon: def.emoji,
    title: t('pet.adoptOne', { kind: t('pet.kind.' + def.id) }),
    sub: t('pet.adoptSub', { n: fmt(def.cost) }),
    body: input,
    actions:[
      { label:t('buy.notNow'), cls:'ghost' },
      { label:t('pet.adopt'), cls:'gold', onClick: () => {
        const p = adopt(def.id, input.value);
        if (!p){ sfx('error'); return toast(t('buy.noCoins'), 'bad', '💸'); }
        sfx('unlock'); confetti(50); haptic([12, 30, 12]);
        toast(t('pet.welcome', { name: p.name }), 'good', def.emoji);
        go('pet');
      }},
    ],
  });
  setTimeout(() => input.focus(), 120);
}

function askRename(){
  const p = pet();
  const input = el('input.text-field', { type:'text', maxlength:16, value: p.name });
  openModal({
    icon:'✏️', title:t('pet.renameTitle'), body: input,
    actions:[
      { label:t('more.cancel'), cls:'ghost' },
      { label:t('more.save'), cls:'mint', onClick: () => { rename(input.value); sfx('tap'); go('pet'); } },
    ],
  });
  setTimeout(() => input.focus(), 120);
}

function askAbandon(){
  const p = pet();
  confirmModal({
    icon:'🏡', title:t('pet.rehomeTitle', { name: p.name }), sub:t('pet.rehomeSub'),
    yes:t('pet.rehome'),
    onYes: () => { abandon(); sfx('remove'); go('pet'); },
  });
}

/** Badge for the More hub: they are hungry or bored. */
export function petBadge(){
  if (!hasPet()) return 0;
  tickPet();
  return mood() < .5 ? 1 : 0;
}
