/* ============================================================
   Delivery — the job board and the parcels out on the road.

   Hire a courier in the staff screen and this opens up: people who
   cannot get to the shop order from home, you make their candy, and
   your courier rides it over. The money lands when they arrive.
   ============================================================ */

import { el, $, fmt, clamp } from '../core/utils.js';
import {
  S, roster, canDeliver, courierStaff, courierSlots, DELIVERY_LEVEL,
} from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti, coinFly, bumpPill } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { drawDesign } from '../render/candy.js';
import {
  ensureBoard, store, jobById, claimJob, declineJob, nextJobIn, dispatch,
  activeParcels, parcelSlots, roadIsFull, arrivedParcels, collect, collectAll,
  minutesLeft, parcelArrived,
  subs, subOffer, acceptOffer, declineOffer, cancelSub, subDueIn,
} from '../game/delivery.js';
import { courierStats } from '../data/staff.js';
import { getCandy } from '../data/candies.js';
import { go, subHeader } from './nav.js';
import { t, tName } from '../core/i18n.js';

let tickTimer = 0;

export function mountDelivery(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('deliv.title'), '🚚'));

  if (S.level < DELIVERY_LEVEL){
    wrap.append(lockedCard(t('deliv.lockedLevel', { n: DELIVERY_LEVEL })));
    host.append(wrap);
    return;
  }

  const crew = courierStaff();
  if (!crew.length){
    wrap.append(lockedCard(t('deliv.noCourier')));
    wrap.append(el('button.btn.gold.block', { onclick: () => go('staff') }, t('deliv.hireCourier')));
    host.append(wrap);
    return;
  }

  ensureBoard();

  /* ── the crew ── */
  const crewCard = el('div.card',
    el('div.card-title', el('span.ico', '🛵'), t('deliv.crew'), el('span.spacer'),
      el('span.sub', t('deliv.slotsUsed', { a: crew.length, b: courierSlots() }))));
  for (const c of crew){
    const cs = courierStats(c);
    crewCard.append(el('div.row', { style:{
      padding:'8px 10px', borderRadius:'13px', background:'var(--surface-2)',
      border:'1.5px solid var(--line)', marginTop:'6px',
    }},
      el('span', { style:{ fontSize:'19px' } }, c.face),
      el('span', { style:{ fontSize:'13px', fontWeight:'800', flex:'1' } }, c.name),
      el('span.tiny', { style:{ fontWeight:'800', color:'var(--pink-600)' } },
        `📦 ${cs.slots} · ⚡ ×${cs.speed.toFixed(2)} · 🪙 ×${cs.payMult.toFixed(2)}`),
    ));
  }
  wrap.append(crewCard);

  /* ── parcels on the road ── */
  const active = activeParcels();
  const road = el('div.card',
    el('div.card-title', el('span.ico', '📦'), t('deliv.onRoad'), el('span.spacer'),
      el('span.sub', t('deliv.roadUsed', { a: active.length, b: parcelSlots() }))));

  if (!active.length){
    road.append(el('p.tiny.muted.center', { style:{ padding:'8px 0' } }, t('deliv.roadEmpty')));
  } else {
    for (const p of active) road.append(parcelRow(p));
    if (arrivedParcels().length > 1){
      road.append(el('button.btn.mint.block.sm', { style:{ marginTop:'8px' }, onclick: () => {
        const { count, coins } = collectAll();
        if (!count) return;
        sfx('coin'); confetti(30); bumpPill('#hudCoins');
        toast(t('deliv.collectedAll', { n: count, coins: fmt(coins) }), 'good', '🪙');
        go('delivery');
      }}, t('deliv.collectAll')));
    }
  }
  wrap.append(road);

  /* ── standing orders ── */
  const offer = subOffer();
  if (offer){
    wrap.append(el('div.card.shine', { style:{
      background:'linear-gradient(125deg,#e8f7ff,#f4ecff)',
    }},
      el('div.card-title', el('span.ico', offer.face), t('sub.offerTitle', { name: offer.name })),
      el('p.tiny', { style:{ fontWeight:'800', lineHeight:'1.45' } },
        t('sub.offerBody', { every: offer.every, addr: offer.address, n: fmt(offer.fee) })),
      el('div.row', { style:{ gap:'8px', marginTop:'10px' } },
        el('button.btn.ghost.grow.sm', { onclick: () => {
          declineOffer(); sfx('remove'); go('delivery');
        }}, t('sub.decline')),
        el('button.btn.mint.grow.sm', { onclick: () => {
          acceptOffer(); sfx('unlock'); haptic(12); confetti(24);
          toast(t('sub.accepted', { name: offer.name }), 'good', '📬');
          go('delivery');
        }}, t('sub.accept')),
      ),
    ));
  }

  const list = subs();
  if (list.length){
    const card = el('div.card',
      el('div.card-title', el('span.ico', '📬'), t('sub.title'), el('span.spacer'),
        el('span.sub', t('sub.count', { n: list.length }))));
    for (const sub of list){
      card.append(el('div.row', { style:{
        padding:'9px 11px', borderRadius:'13px', background:'var(--surface-2)',
        border:'1.5px solid var(--line)', marginTop:'6px',
      }},
        el('span', { style:{ fontSize:'19px' } }, sub.face),
        el('div', { style:{ flex:'1', minWidth:'0' } },
          el('b', { style:{ fontSize:'13px', fontWeight:'800' } }, sub.name),
          el('div.tiny.muted', t('sub.every', { n: sub.every, addr: sub.address })),
          el('div.tiny', { style:{ fontWeight:'800', color:'var(--pink-600)' } },
            t('sub.due', { n: subDueIn(sub) }) + ' · ' + '💛'.repeat(Math.max(0, sub.health ?? 3))),
        ),
        el('button.upg-sell', { onclick: () => confirmModal({
          icon:'📬', title:t('sub.cancelTitle', { name: sub.name }), sub:t('sub.cancelSub'),
          yes:t('sub.cancelYes'),
          onYes: () => { cancelSub(sub.id); sfx('remove'); go('delivery'); },
        })}, '🚫'),
      ));
    }
    wrap.append(card);
  }

  /* ── the board ── */
  const d = store();
  const board = el('div.card',
    el('div.card-title', el('span.ico', '📋'), t('deliv.board'), el('span.spacer'),
      el('span.sub', t('deliv.boardSub'))));

  if (roadIsFull()){
    board.append(el('p.tiny.center', { style:{ padding:'6px 0', fontWeight:'800', color:'var(--pink-600)' } },
      t('deliv.roadFull')));
  }
  if (!d.board.length){
    board.append(el('p.tiny.muted.center', { style:{ padding:'8px 0' } }, t('deliv.boardEmpty')));
  } else {
    for (const job of d.board) board.append(jobRow(job));
  }
  // the board is meant to run empty — say when the next one is due
  const soon = nextJobIn();
  if (soon != null){
    board.append(el('p.tiny.muted.center', { style:{ marginTop:'4px' } },
      soon <= 1 ? t('deliv.nextSoon') : t('deliv.nextIn', { n: soon })));
  }
  wrap.append(board);

  /* ── lifetime ── */
  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '📊'), t('deliv.stats')),
    el('div.stat-grid',
      el('div.stat', el('b', fmt(d.done || 0)), el('span', t('deliv.delivered'))),
      el('div.stat', el('b', '🪙 ' + fmt(d.earned || 0)), el('span', t('deliv.earned'))),
      el('div.stat', el('b', String(parcelSlots())), el('span', t('deliv.capacity'))),
    ),
  ));

  host.append(wrap);

  // live countdowns
  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (!document.body.contains(wrap)){ clearInterval(tickTimer); return; }
    let anyLanded = false;
    for (const p of activeParcels()){
      const node = $('#pt-' + p.id);
      if (!node) continue;
      if (parcelArrived(p)) anyLanded = true;
      node.textContent = parcelArrived(p)
        ? t('deliv.arrived')
        : t('deliv.inMinutes', { n: minutesLeft(p) });
    }
    if (anyLanded) go('delivery');
  }, 5000);

  return () => clearInterval(tickTimer);
}

function lockedCard(text){
  return el('div.card',
    el('div.card-title', el('span.ico', '🔒'), t('deliv.title')),
    el('p.tiny.muted.center', { style:{ padding:'10px 4px', lineHeight:'1.5' } }, text));
}

function parcelRow(p){
  const arrived = parcelArrived(p);
  const total = Math.max(1, p.arrivesAt - p.sentAt);
  const frac = clamp(1 - (p.arrivesAt - Date.now()) / total, 0, 1);

  return el('div.staff-slot' + (arrived ? '.rar-legendary' : ''),
    el('div.staff-face', p.courierFace),
    el('div.staff-info',
      el('div.s-name', p.name, el('span.staff-tier', '📍 ' + p.address)),
      el('div.tiny.muted', { style:{ marginTop:'2px' } },
        `${p.courierName} · ${'⭐'.repeat(p.stars)}`),
      el('div.bar' + (arrived ? '.mint' : ''), { style:{ height:'7px', margin:'5px 0 3px' } },
        el('i', { style:{ width:(frac * 100) + '%' } })),
      el('div.tiny', { id:'pt-' + p.id, style:{ fontWeight:'800', color:'var(--pink-600)' } },
        arrived ? t('deliv.arrived') : t('deliv.inMinutes', { n: minutesLeft(p) })),
    ),
    arrived
      ? el('button.staff-action.hire', { onclick: () => {
          const got = collect(p.id);
          if (!got) return;
          sfx('coin'); haptic([10, 25, 10]); confetti(24);
          coinFly(window.innerWidth / 2, window.innerHeight * .5, 10);
          bumpPill('#hudCoins');
          toast(t('deliv.collected', { n: fmt(got.coins) }), 'good', '🪙');
          go('delivery');
        }}, '🪙 ' + fmt(p.coins))
      : el('div.staff-action.maxed', '🛵'),
  );
}

function jobRow(job){
  const c = job.customer;
  const full = roadIsFull();
  const distLabel = [t('deliv.near'), t('deliv.town'), t('deliv.far')][job.distance];

  return el('div.cust-card' + (c.vip ? '.vip' : '') + (job.sub ? '.subbed' : ''),
    { style:{ width:'100%', marginBottom:'8px' } },
    el('div.cust-face', c.face),
    el('div.cust-name', job.sub ? job.subName : c.name),
    job.sub ? el('div.cust-tag', '📬 ' + t('sub.tag')) : null,
    el('div.cust-pers', `📍 ${job.address} · ${distLabel} · ~${job.minutes}m`),
    el('div.cust-want', c.order.line),
    el('div', { style:{ display:'flex', gap:'8px', alignItems:'center', marginTop:'8px' } },
      el('span.tiny', { style:{ fontWeight:'900', color:'#c98f14', flex:'1' } },
        `🪙 +${fmt(job.fee)} ${t('deliv.fee')}`),
      // turning one down clears it for good — the board is yours to empty
      el('button.btn.ghost.sm', { onclick: () => {
        declineJob(job.id);
        sfx('remove'); haptic(10);
        toast(t('deliv.declined'), '', '🚫');
        go('delivery');
      }}, '🚫'),
      el('button.btn' + (full ? '.ghost' : '.mint') + '.sm', {
        onclick: () => startJob(job, full),
      }, full ? t('deliv.roadFullShort') : t('deliv.make')),
    ),
  );
}

function startJob(job, full){
  if (full){
    sfx('error');
    return toast(t('deliv.roadFull'), 'warn', '📦');
  }
  claimJob(job.id);
  sfx('door'); haptic(12);
  // the shop screen owns the studio → grade → reward flow
  import('./shopScreen.js').then(({ startOrder }) => {
    startOrder(job.customer, { delivery: job });
  });
}

/** Called by the shop screen once a delivery order has been graded. */
export function finishDelivery(job, pay, stars, design, onDone){
  const parcel = dispatch(job, pay, stars, design);
  sfx('whoosh');

  const prev = el('canvas', { width:300, height:300, style:{
    width:'128px', height:'128px', margin:'0 auto', display:'block',
  }});
  drawDesign(prev.getContext('2d'), 300, design, 0);

  openModal({
    icon:'🛵',
    title: t('deliv.sentTitle'),
    sub: t('deliv.sentSub', { name: parcel.courierName || t('deliv.courier'), n: parcel.minutes }),
    body: [
      prev,
      el('p.center', { style:{ fontSize:'19px', fontWeight:'900', color:'#c98f14', marginTop:'6px' } },
        `🪙 ${fmt(parcel.coins)}`),
      el('p.center.tiny.muted', { style:{ marginTop:'4px' } },
        t('deliv.sentHint', { addr: parcel.address })),
    ],
    dismissable:false,
    actions:[{ label:t('deliv.sentOk'), cls:'mint', onClick: () => onDone?.() }],
  });
}

/** Badge for the More hub: parcels waiting to be collected. */
export const deliveryBadge = () => (canDeliver() ? arrivedParcels().length : 0);
