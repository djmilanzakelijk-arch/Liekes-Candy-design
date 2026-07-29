/* ============================================================
   The Candy Pass — this season's track.

   Two rows per tier: the free one everybody gets, and the pass one you
   unlock with gems. Reaching a tier makes both claimable; buying the
   pass later hands you every pass reward you already passed.
   ============================================================ */

import { el, $, fmt, clamp } from '../core/utils.js';
import { S } from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti, candyRain, bumpPill } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { drawDecoThumb, drawPackThumb } from '../render/candy.js';
import {
  pass, theme, track, points, tier, progress, hasPass, timeLeft,
  isClaimed, claim, claimAll, buyPass, pendingCount, rewardLabel,
} from '../game/seasonPass.js';
import { TIERS, POINTS_PER_TIER, PASS_COST_GEMS, POINTS } from '../data/season.js';
import { getDeco, getPack } from '../data/decorations.js';
import { go, subHeader } from './nav.js';
import { t, tName, tDesc } from '../core/i18n.js';

export function mountSeason(host){
  const wrap = el('div.screen.enter');
  const th = theme();
  wrap.append(subHeader(t('pass.title'), th.emoji));

  /* ── the season banner ── */
  const cur = tier();
  wrap.append(el('div.season-banner', { style:{
    background:`linear-gradient(125deg,${th.grad[0]},${th.grad[1]})`,
  }},
    el('h3', `${th.emoji} ${t('season.' + th.id)}`),
    el('p', t('pass.endsIn', { n: fmtLeft(timeLeft()) })),
    el('div.season-tier', t('pass.tierOf', { a: cur, b: TIERS })),
    el('div.bar.grape', { style:{ height:'10px', marginTop:'8px' } },
      el('i', { style:{ width:(progress() * 100) + '%' } })),
    el('p.tiny', { style:{ marginTop:'4px', fontWeight:'800' } },
      cur >= TIERS
        ? t('pass.maxed')
        : t('pass.toNext', { n: POINTS_PER_TIER - (points() % POINTS_PER_TIER) })),
  ));

  /* ── buy / collect ── */
  const waiting = pendingCount();
  const row = el('div.row', { style:{ gap:'8px', marginBottom:'12px' } });
  if (waiting){
    row.append(el('button.btn.mint.grow', { onclick: collectAll },
      t('pass.collectAll', { n: waiting })));
  }
  if (!hasPass()){
    row.append(el('button.btn.gold.grow', { onclick: askBuy },
      `💎 ${PASS_COST_GEMS} · ${t('pass.buy')}`));
  } else {
    row.append(el('div.btn.ghost.grow', { style:{ pointerEvents:'none' } }, '✅ ' + t('pass.owned')));
  }
  wrap.append(row);

  if (!hasPass()){
    wrap.append(el('p.tiny.muted.center', { style:{ margin:'-6px 0 12px' } }, t('pass.buyHint')));
  }

  /* ── how you earn points ── */
  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '⚡'), t('pass.howTitle')),
    el('div.chipbar', { style:{ flexWrap:'wrap' } },
      chip('🧾', t('pass.p.order'), POINTS.order),
      chip('⭐', t('pass.p.star'), POINTS.perStarOver3),
      chip('💯', t('pass.p.perfect'), POINTS.perfect),
      chip('🚚', t('pass.p.delivery'), POINTS.delivery),
      chip('📱', t('pass.p.post'), POINTS.post),
      chip('💬', t('pass.p.wish'), POINTS.wish),
      chip('🤝', t('pass.p.deal'), POINTS.brandDeal),
      chip('🏆', t('pass.p.mission'), POINTS.mission),
    ),
  ));

  /* ── the track ── */
  wrap.append(el('div.section-head', el('h2', t('pass.track')),
    el('span.spacer'),
    el('span.tiny.muted', t('pass.trackHint'))));

  const lane = el('div.pass-lane');
  for (const rowDef of track()) lane.append(tierCard(rowDef, cur));
  wrap.append(lane);

  host.append(wrap);

  // scroll the next unclaimed tier into view — that is what she came for
  requestAnimationFrame(() => {
    const target = lane.querySelector('.pass-tier.ready') || lane.querySelector('.pass-tier.next');
    target?.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
  });
}

const chip = (ico, label, n) => el('div.chip', `${ico} ${label} +${n}`);

function fmtLeft(ms){
  const d = Math.floor(ms / 86400000);
  const h = Math.floor(ms / 3600000) % 24;
  return d > 0 ? `${d}d ${h}u` : `${h}u`;
}

/* ══════════════ one tier ══════════════ */

function tierCard(row, cur){
  const reached = row.tier <= cur;
  const freeReady = reached && !isClaimed(row.tier, false);
  const passReady = reached && hasPass() && !isClaimed(row.tier, true);
  const ready = freeReady || passReady;

  return el('div.pass-tier' + (reached ? '.reached' : '') + (ready ? '.ready' : '')
            + (row.tier === cur + 1 ? '.next' : ''),
    el('div.pt-no', row.tier),
    rewardCell(row.free, row.tier, false, reached, isClaimed(row.tier, false)),
    rewardCell(row.pass, row.tier, true, reached, isClaimed(row.tier, true)),
  );
}

function rewardCell(reward, tierNo, premium, reached, claimed){
  const label = rewardLabel(reward, t, tName);
  const locked = premium && !hasPass();

  const cell = el('div.pt-cell' + (premium ? '.premium' : '') + (claimed ? '.claimed' : '')
                  + (locked ? '.locked' : ''));

  // decorations and packaging get a proper picture, everything else its icon
  if (reward.kind === 'deco' || reward.kind === 'pack'){
    const cv = el('canvas', { width:88, height:88 });
    cell.append(cv);
    const c2 = cv.getContext('2d');
    if (reward.kind === 'deco'){
      const d = getDeco(reward.id);
      drawDecoThumb(c2, 88, reward.id, d?.fixed || 'pink', 0);
    } else {
      drawPackThumb(c2, 88, reward.id, 'pink', 0);
    }
  } else {
    cell.append(el('span.pt-ico', label.icon));
  }
  cell.append(el('b', label.text));

  if (claimed){
    cell.append(el('span.pt-tick', '✓'));
  } else if (locked){
    cell.append(el('span.pt-lock', '🔒'));
  } else if (reached){
    cell.classList.add('grab');
    cell.addEventListener('click', () => {
      const got = claim(tierNo, premium);
      if (!got) return;
      sfx('unlock'); haptic([10, 25, 10]); confetti(20);
      bumpPill(reward.kind === 'gems' ? '#hudGems' : '#hudCoins');
      toast(t('pass.got', { what: rewardLabel(got, t, tName).text }), 'good', label.icon);
      go('season');
    });
  }
  return cell;
}

/* ══════════════ actions ══════════════ */

function collectAll(){
  const got = claimAll();
  if (!got.length) return;
  sfx('levelup'); confetti(50); candyRain(2); haptic([12, 30, 12, 30]);

  const list = el('div.chipbar', { style:{ justifyContent:'center', flexWrap:'wrap' } });
  for (const r of got){
    const l = rewardLabel(r, t, tName);
    list.append(el('div.chip.on', `${l.icon} ${l.text}`));
  }
  openModal({
    icon:'🎁', title:t('pass.collectedTitle'), sub:t('pass.collectedSub', { n: got.length }),
    body:list,
    actions:[{ label:t('new.ok'), cls:'mint', onClick: () => go('season') }],
  });
}

function askBuy(){
  const th = theme();
  const perks = el('div', { style:{ display:'flex', flexDirection:'column', gap:'6px' } });
  for (const row of track()){
    if (row.pass.kind === 'coins' || row.pass.kind === 'gems') continue;
    const l = rewardLabel(row.pass, t, tName);
    perks.append(el('div.row', { style:{
      padding:'8px 11px', borderRadius:'13px', background:'var(--surface-2)',
      border:'1.5px solid var(--line)',
    }},
      el('span', { style:{ fontSize:'17px' } }, l.icon),
      el('span', { style:{ fontSize:'12.5px', fontWeight:'800', flex:'1' } }, l.text),
      el('span.tiny.muted', t('pass.atTier', { n: row.tier })),
    ));
  }

  confirmModal({
    icon: th.emoji,
    title: t('pass.buyTitle', { name: t('season.' + th.id) }),
    sub: t('pass.buySub', { n: PASS_COST_GEMS }),
    body: [perks, el('p.tiny.muted.center', { style:{ marginTop:'8px' } }, t('pass.buyNote'))],
    yes: `💎 ${PASS_COST_GEMS}`,
    onYes: () => {
      if (!buyPass()){
        sfx('error');
        return toast(t('buy.noGems'), 'bad', '💎');
      }
      sfx('levelup'); confetti(70); candyRain(3);
      toast(t('pass.bought'), 'good', '🎟️');
      go('season');
    },
  });
}

/** Badge for the More hub: rewards waiting to be collected. */
export const seasonBadge = () => pendingCount();
