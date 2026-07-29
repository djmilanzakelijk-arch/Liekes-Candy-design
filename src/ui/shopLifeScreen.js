/* ============================================================
   Two little corners of shop life:
     • Regulars — the customers who keep coming back
     • Recipes  — the candies you bottled, and the display case
   ============================================================ */

import { el, fmt } from '../core/utils.js';
import { S } from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti, coinFly, bumpPill } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { drawDesign } from '../render/candy.js';
import {
  regulars, loyaltyLevel, loyaltyProgress, visitsToNext, MAX_LOYALTY,
  MAX_REGULARS, forget,
} from '../game/regulars.js';
import {
  list as recipeList, cased, isCased, caseFull, toggleCase, hourlyOf,
  caseHourly, pendingCoins, pendingHours, collectCase, deleteRecipe,
  renameRecipe, recipes, CASE_SLOTS, MAX_RECIPES,
} from '../game/recipes.js';
import { getCandy } from '../data/candies.js';
import { getColor } from '../data/palette.js';
import { getDeco } from '../data/decorations.js';
import { openStudio } from './studio.js';
import { go, subHeader } from './nav.js';
import { t, tName } from '../core/i18n.js';

/* ══════════════════════════════════════════════════════
   Regulars
   ══════════════════════════════════════════════════════ */
export function mountRegulars(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('reg.title'), '💛'));

  const list = regulars();
  if (!list.length){
    wrap.append(el('div.card',
      el('div.card-title', el('span.ico', '💛'), t('reg.title')),
      el('p.tiny.muted.center', { style:{ padding:'10px 4px', lineHeight:'1.5' } }, t('reg.empty'))));
    host.append(wrap);
    return;
  }

  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '👋'), t('reg.yours'), el('span.spacer'),
      el('span.sub', `${list.length}/${MAX_REGULARS}`)),
    el('p.tiny.muted', t('reg.blurb')),
  ));

  const sorted = [...list].sort((a, b) => loyaltyLevel(b) - loyaltyLevel(a) || b.visits - a.visits);
  for (const r of sorted) wrap.append(regularCard(r));

  host.append(wrap);
}

function regularCard(r){
  const lv = loyaltyLevel(r);
  const candy = getCandy(r.loves.candy);
  const deco = r.loves.deco ? getDeco(r.loves.deco) : null;

  return el('div.staff-slot',
    el('div.staff-face', r.face),
    el('div.staff-info',
      el('div.s-name', r.name,
        el('span.staff-tier', t('reg.level', { n: lv })),
        lv >= MAX_LOYALTY ? el('span.staff-tier', { style:{ background:'#ffe9a8', color:'#8a5c05' } }, '👑') : null),
      el('div.tiny.muted', { style:{ marginTop:'2px' } },
        t('reg.visits', { n: r.visits || 0 })),
      el('div.bar' + (lv >= MAX_LOYALTY ? '.gold' : '.mint'), { style:{ height:'7px', margin:'5px 0 3px' } },
        el('i', { style:{ width:(loyaltyProgress(r) * 100) + '%' } })),
      el('div.tiny', { style:{ fontWeight:'800', color:'var(--pink-600)' } },
        lv >= MAX_LOYALTY ? t('reg.maxed') : t('reg.toNext', { n: visitsToNext(r) })),
      el('div.staff-stats',
        el('span.staff-stat', `${candy?.emoji ?? '🍬'} ${tName('candy', r.loves.candy, candy?.name ?? '')}`),
        el('span.staff-stat', `🎨 ${tName('color', r.loves.color, getColor(r.loves.color).name)}`),
        deco ? el('span.staff-stat', `✨ ${tName('deco', r.loves.deco, deco.name)}`) : null,
      ),
    ),
    el('button.upg-sell', { onclick: () => confirmModal({
      icon:'👋', title:t('reg.forgetTitle', { name: r.name }), sub:t('reg.forgetSub'),
      yes:t('reg.forgetYes'),
      onYes: () => { forget(r.id); sfx('remove'); go('regulars'); },
    })}, '👋'),
  );
}

/** Shown after an order when somebody decides to become a regular. */
export function celebrateNewRegular(reg){
  sfx('unlock'); confetti(30); haptic([10, 25, 10]);
  const candy = getCandy(reg.loves.candy);
  openModal({
    icon: reg.face,
    title: t('reg.newTitle', { name: reg.name }),
    sub: t('reg.newSub'),
    body: el('p.center.tiny.muted', { style:{ lineHeight:'1.5' } },
      t('reg.newLoves', {
        candy: tName('candy', reg.loves.candy, candy?.name ?? ''),
        color: tName('colorAdj', reg.loves.color, getColor(reg.loves.color).name.toLowerCase()),
      })),
    actions:[{ label:t('reg.newOk'), cls:'mint' }],
  });
}

/** Shown when a regular's loyalty goes up and they bring something. */
export function celebrateLoyalty(reg, res){
  sfx('coin'); confetti(26);
  const g = res.gift;
  const row = el('div.reward-row', { style:{ marginTop:'8px' } },
    el('div.reward', '🪙 +' + fmt(g.coins)),
    g.gems ? el('div.reward.gem', '💎 +' + g.gems) : null,
    g.deco ? el('div.reward.xp', '✨ ' + tName('deco', g.deco, getDeco(g.deco)?.name ?? '')) : null,
  );
  openModal({
    icon: reg.face,
    title: t('reg.giftTitle', { name: reg.name, n: res.level }),
    sub: t('reg.giftSub'),
    body: row,
    actions:[{ label:t('reg.newOk'), cls:'gold' }],
  });
}

/* ══════════════════════════════════════════════════════
   Recipes + the display case
   ══════════════════════════════════════════════════════ */
export function mountRecipes(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('rec.title'), '📗'));

  /* the display case */
  const waiting = pendingCoins();
  const box = el('div.card',
    el('div.card-title', el('span.ico', '🪟'), t('rec.case'), el('span.spacer'),
      el('span.sub', `${cased().length}/${CASE_SLOTS}`)),
    el('div.stat-grid',
      el('div.stat', el('b', '🪙 ' + fmt(caseHourly())), el('span', t('rec.perHour'))),
      el('div.stat', el('b', '🪙 ' + fmt(waiting)), el('span', t('rec.waiting'))),
      el('div.stat', el('b', fmt(recipes().earned || 0)), el('span', t('rec.earnedTotal'))),
    ),
  );
  if (waiting > 0){
    box.append(el('button.btn.gold.block', { style:{ marginTop:'10px' }, onclick: () => {
      const got = collectCase();
      if (!got) return;
      sfx('coin'); haptic([10, 25, 10]); confetti(24);
      coinFly(window.innerWidth / 2, window.innerHeight * .45, 10);
      bumpPill('#hudCoins');
      toast(t('rec.collected', { n: fmt(got) }), 'good', '🪙');
      go('recipes');
    }}, t('rec.collect', { n: fmt(waiting) })));
  } else {
    box.append(el('p.tiny.muted.center', { style:{ marginTop:'8px' } },
      cased().length ? t('rec.caseRunning') : t('rec.caseEmpty')));
  }
  wrap.append(box);

  /* the recipes themselves */
  const list = recipeList();
  wrap.append(el('div.section-head', el('h2', t('rec.yours')),
    el('span.spacer'), el('span.tiny.muted', `${list.length}/${MAX_RECIPES}`)));

  if (!list.length){
    wrap.append(el('div.empty', el('span.big', '📗'), t('rec.empty'),
      el('br'), el('span.tiny', t('rec.emptyHint'))));
    wrap.append(el('button.btn.grape.block', { style:{ marginTop:'10px' },
      onclick: () => openStudio({ onQuit: () => go('recipes') }) }, t('rec.toStudio')));
    host.append(wrap);
    return;
  }

  const grid = el('div.recipe-grid');
  for (const r of list) grid.append(recipeCard(r));
  wrap.append(grid);
  host.append(wrap);
}

function recipeCard(r){
  const on = isCased(r.id);
  const cv = el('canvas', { width:200, height:200 });
  drawDesign(cv.getContext('2d'), 200, r.design, 0, { background:'#fff6fb' });

  return el('div.recipe' + (on ? '.cased' : ''),
    on ? el('div.rec-badge', '🪟') : null,
    cv,
    el('b', r.name),
    el('div.tiny.muted', `🪙 ${fmt(hourlyOf(r))}/u`),
    el('div.row', { style:{ gap:'5px', marginTop:'6px' } },
      el('button.btn.ghost.sm.grow', { onclick: () => remake(r) }, '🎨'),
      el('button.btn' + (on ? '.mint' : '.ghost') + '.sm.grow', {
        onclick: () => {
          if (!on && caseFull()) { sfx('error'); return toast(t('rec.caseFull', { n: CASE_SLOTS }), 'warn', '🪟'); }
          toggleCase(r.id);
          sfx(on ? 'remove' : 'place'); haptic(10);
          go('recipes');
        },
      }, '🪟'),
      el('button.btn.ghost.sm.grow', { onclick: () => manage(r) }, '⋯'),
    ),
  );
}

/** Open the studio pre-filled with this recipe. */
function remake(r){
  sfx('door');
  openStudio({
    design: JSON.parse(JSON.stringify(r.design)),
    onQuit: () => go('recipes'),
  });
}

function manage(r){
  const input = el('input.text-field', { type:'text', maxlength:22, value: r.name });
  openModal({
    icon:'📗', title: r.name, sub: t('rec.manageSub'),
    body: input,
    actions:[
      { label:t('rec.delete'), cls:'ghost', onClick: () => {
        confirmModal({
          icon:'🗑', title:t('rec.deleteTitle', { name: r.name }), yes:t('rec.delete'),
          onYes: () => { deleteRecipe(r.id); sfx('remove'); go('recipes'); },
        });
      }},
      { label:t('more.save'), cls:'mint', onClick: () => {
        renameRecipe(r.id, input.value);
        sfx('tap'); go('recipes');
      }},
    ],
  });
}

/** Badge for the More hub: coins waiting under the display case. */
export const recipeBadge = () => (pendingCoins() > 0 ? 1 : 0);
