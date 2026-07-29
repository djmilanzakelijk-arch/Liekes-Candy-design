/* ============================================================
   The weekly candy contest.
   ============================================================ */

import { el, fmt } from '../core/utils.js';
import { S } from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti, candyRain, bumpPill } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { drawDesign } from '../render/candy.js';
import {
  theme, timeLeft, entry, hasEntered, standings, myPlace,
  enter, withdraw, history, store,
} from '../game/contest.js';
import { judge, prizeFor, CONTEST_LEVEL } from '../data/contests.js';
import { openStudio } from './studio.js';
import { go, subHeader } from './nav.js';
import { t, tName } from '../core/i18n.js';

export function mountContest(host){
  const wrap = el('div.screen.enter');
  const th = theme();
  wrap.append(subHeader(t('ct.title'), '🏆'));

  if (S.level < CONTEST_LEVEL){
    wrap.append(el('div.card',
      el('div.card-title', el('span.ico', '🔒'), t('ct.title')),
      el('p.tiny.muted.center', { style:{ padding:'10px 4px', lineHeight:'1.5' } },
        t('ct.lockedLevel', { n: CONTEST_LEVEL }))));
    host.append(wrap);
    return;
  }

  /* the brief */
  wrap.append(el('div.card.contest-brief',
    el('div.card-title', el('span.ico', th.emoji), t('ct.theme.' + th.id + '.name'),
      el('span.spacer'), el('span.sub', fmtLeft(timeLeft()))),
    el('p.tiny', { style:{ fontWeight:'800', lineHeight:'1.45' } }, t('ct.theme.' + th.id + '.rule')),
    el('p.tiny.muted', { style:{ marginTop:'6px' } }, t('ct.judged')),
  ));

  /* your entry */
  const mine = entry();
  const card = el('div.card',
    el('div.card-title', el('span.ico', '🍬'), t('ct.yourEntry')));

  if (mine){
    const cv = el('canvas', { width:300, height:300, style:{
      width:'132px', height:'132px', margin:'0 auto', display:'block',
    }});
    drawDesign(cv.getContext('2d'), 300, mine.design, 0, { background:'#fff6fb' });
    card.append(cv);
    card.append(el('div.stat-grid', { style:{ marginTop:'10px' } },
      el('div.stat', el('b', mine.score.brief + '%'), el('span', t('ct.brief'))),
      el('div.stat', el('b', mine.score.craft + '%'), el('span', t('ct.craft'))),
      el('div.stat', el('b', String(mine.score.total)), el('span', t('ct.score'))),
    ));
    card.append(el('p.tiny.center', { style:{ marginTop:'8px', fontWeight:'900', color:'var(--pink-600)' } },
      t('ct.standingNow', { n: myPlace() })));
    card.append(el('div.row', { style:{ gap:'8px', marginTop:'10px' } },
      el('button.btn.ghost.grow.sm', { onclick: makeEntry }, t('ct.redo')),
      el('button.btn.ghost.grow.sm', { onclick: askWithdraw }, t('ct.withdraw')),
    ));
  } else {
    card.append(el('p.tiny.muted.center', { style:{ padding:'8px 4px', lineHeight:'1.5' } },
      t('ct.noEntry')));
    card.append(el('button.btn.gold.block', { onclick: makeEntry }, t('ct.makeEntry')));
  }
  wrap.append(card);

  /* the field */
  const board = el('div.card',
    el('div.card-title', el('span.ico', '📋'), t('ct.field'), el('span.spacer'),
      el('span.sub', t('ct.fieldSub'))));
  standings().slice(0, 12).forEach((r, i) => {
    board.append(el('div.lb-row' + (r.you ? '.you' : ''),
      el('span.lb-pos', String(i + 1)),
      el('span.lb-name', r.you ? S.shopName : r.name),
      el('span.lb-val', String(r.score)),
    ));
  });
  if (!hasEntered()){
    board.append(el('p.tiny.muted.center', { style:{ marginTop:'8px' } }, t('ct.enterToSee')));
  }
  wrap.append(board);

  /* what the places are worth */
  const prizes = el('div.card',
    el('div.card-title', el('span.ico', '🎁'), t('ct.prizes')));
  for (const [place, label] of [[1, t('ct.first')], [3, t('ct.top3')], [6, t('ct.top6')], [99, t('ct.rest')]]){
    const pz = prizeFor(place, S.level);
    prizes.append(el('div.row', { style:{
      padding:'8px 11px', borderRadius:'13px', background:'var(--surface-2)',
      border:'1.5px solid var(--line)', marginTop:'6px',
    }},
      el('span', { style:{ fontSize:'12.5px', fontWeight:'800', flex:'1' } }, label),
      el('span.tiny', { style:{ fontWeight:'900', color:'#c98f14' } },
        `🪙 ${fmt(pz.coins)}${pz.gems ? ' · 💎 ' + pz.gems : ''}${pz.deco ? ' · 🏆' : ''}`),
    ));
  }
  wrap.append(prizes);

  /* past results */
  const past = history();
  if (past.length){
    const hist = el('div.card',
      el('div.card-title', el('span.ico', '📜'), t('ct.past'), el('span.spacer'),
        el('span.sub', t('ct.won', { n: store().won || 0 }))));
    for (const h of past){
      hist.append(el('div.lb-row',
        el('span.lb-pos', h.place <= 3 ? ['🥇','🥈','🥉'][h.place - 1] : String(h.place)),
        el('span.lb-name', t('ct.weekNo', { n: h.idx })),
        el('span.lb-val', String(h.score)),
      ));
    }
    wrap.append(hist);
  }

  host.append(wrap);
}

function fmtLeft(ms){
  const d = Math.floor(ms / 86400000);
  const h = Math.floor(ms / 3600000) % 24;
  return d > 0 ? t('ct.leftDays', { d, h }) : t('ct.leftHours', { h });
}

/* ══════════════ entering ══════════════ */

function makeEntry(){
  sfx('door');
  // a contest entry is free play: no customer, no clock, just the candy
  openStudio({
    onQuit: () => go('contest'),
    onDone: null,
    contest: true,
  });
}

/** Called by the studio when a free-play design is submitted. */
export function submitEntry(design){
  const scored = enter(design);
  sfx('unlock'); haptic([10, 25, 10]); confetti(34);

  const cv = el('canvas', { width:300, height:300, style:{
    width:'128px', height:'128px', margin:'0 auto', display:'block',
  }});
  drawDesign(cv.getContext('2d'), 300, design, 0, { background:'#fff6fb' });

  openModal({
    icon:'🏆', title:t('ct.enteredTitle'), sub:t('ct.enteredSub'),
    body:[cv, el('div.stat-grid', { style:{ marginTop:'10px' } },
      el('div.stat', el('b', scored.score.brief + '%'), el('span', t('ct.brief'))),
      el('div.stat', el('b', scored.score.craft + '%'), el('span', t('ct.craft'))),
      el('div.stat', el('b', String(scored.score.total)), el('span', t('ct.score'))),
    ), el('p.center.tiny.muted', { style:{ marginTop:'8px' } },
      t('ct.standingNow', { n: myPlace() }))],
    actions:[{ label:t('ct.enteredOk'), cls:'gold', onClick: () => go('contest') }],
  });
}

function askWithdraw(){
  confirmModal({
    icon:'↩︎', title:t('ct.withdrawTitle'), sub:t('ct.withdrawSub'),
    yes:t('ct.withdraw'),
    onYes: () => { withdraw(); sfx('remove'); go('contest'); },
  });
}

/* ══════════════ the weekly result ══════════════ */

/** Shown at boot when last week's contest was settled. */
export function showContestResult(res){
  const medal = res.place === 1 ? '🥇' : res.place === 2 ? '🥈' : res.place === 3 ? '🥉' : '🎗️';
  if (res.place <= 3){ sfx('perfect'); confetti(70); candyRain(2); }
  else { sfx('star'); confetti(28); }

  const cv = el('canvas', { width:300, height:300, style:{
    width:'124px', height:'124px', margin:'0 auto', display:'block',
  }});
  drawDesign(cv.getContext('2d'), 300, res.design, 0, { background:'#fff6fb' });

  const board = el('div', { style:{ marginTop:'10px' } });
  res.field.forEach((r, i) => {
    board.append(el('div.lb-row' + (r.you ? '.you' : ''),
      el('span.lb-pos', String(i + 1)),
      el('span.lb-name', r.you ? S.shopName : r.name),
      el('span.lb-val', String(r.score)),
    ));
  });

  const rewards = el('div.reward-row', { style:{ marginTop:'10px' } },
    el('div.reward', '🪙 +' + fmt(res.prize.coins)),
    res.prize.gems ? el('div.reward.gem', '💎 +' + res.prize.gems) : null,
    res.prize.deco ? el('div.reward.xp', '🏆 ' + t('ct.trophy')) : null,
  );

  openModal({
    icon: medal,
    title: t('ct.resultTitle', { n: res.place }),
    sub: t('ct.theme.' + res.theme.id + '.name'),
    body: [cv, rewards, board],
    actions:[{ label:t('ct.resultOk'), cls:'gold', onClick: () => go('contest') }],
  });
  bumpPill('#hudCoins');
}

/** Badge for the More hub: a contest you have not entered yet. */
export const contestBadge = () => (S.level < CONTEST_LEVEL || hasEntered() ? 0 : 1);
