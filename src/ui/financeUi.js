/* ============================================================
   Payday — the wage slip, and the bad news when it does not fit.
   ============================================================ */

import { el, fmt } from '../core/utils.js';
import { S, roster, inDebt, debtAmount, sellUpgradeLevel, upgLevel } from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { runPayroll, wageBill, daysOfRunway } from '../game/payroll.js';
import { wageOf } from '../data/staff.js';
import { UPG_BY_ID, LOC_BY_ID } from '../data/upgrades.js';
import { go } from './nav.js';
import { t, tName } from '../core/i18n.js';

/** Run the wages and, if anything happened, show the player. */
export function showPayday(onDone){
  const rep = runPayroll();
  if (!rep || (!rep.wages && !rep.actions.length)){ onDone?.(); return false; }

  const bankrupt = rep.actions.some(a => a.kind === 'bankrupt');
  /** the wages did not fit — that is the news, even if it is sorted now */
  const red = rep.shortfall > 0;
  /** …and this is whether the shop is still under water afterwards */
  const stillRed = rep.balance < 0;
  const body = [];

  body.push(el('div.stat-grid',
    el('div.stat', el('b', '👥 ' + rep.headcount), el('span', t('pay.team'))),
    el('div.stat', el('b', '🪙 ' + fmt(rep.wages)), el('span',
      rep.days > 1 ? t('pay.daysWages', { n: rep.days }) : t('pay.wages'))),
    el('div.stat', el('b', (S.coins < 0 ? '🔴 −' : '🪙 ') + fmt(Math.abs(S.coins))),
      el('span', t('pay.balance'))),
  ));

  /* who got paid what */
  const rows = el('div', { style:{ display:'flex', flexDirection:'column', gap:'5px', marginTop:'8px' } });
  for (const e of roster()){
    rows.append(el('div.row', { style:{
      padding:'7px 10px', borderRadius:'12px', background:'var(--surface-2)',
      border:'1.5px solid var(--line)',
    }},
      el('span', { style:{ fontSize:'16px' } }, e.face),
      el('span', { style:{ fontSize:'12.5px', fontWeight:'800', flex:'1' } },
        e.name, el('span.tiny.muted', '  ' + t('role.' + (e.role === 'courier' ? 'courier' : 'shop')))),
      el('span', { style:{ fontSize:'12.5px', fontWeight:'900', color:'var(--pink-600)' } },
        '🪙 ' + fmt(wageOf(e) * rep.days)),
    ));
  }
  if (rows.children.length) body.push(rows);

  /* what the bank did about it */
  if (rep.actions.length){
    const list = el('div', { style:{ display:'flex', flexDirection:'column', gap:'6px', marginTop:'10px' } });
    for (const a of rep.actions){
      const line = actionLine(a);
      if (line) list.append(el('div.row', { style:{
        padding:'9px 11px', borderRadius:'13px',
        background: a.kind === 'recovered' ? 'var(--mint-50,#e9fbf4)' : '#fff0f2',
        border:'1.5px solid ' + (a.kind === 'recovered' ? 'var(--mint-500)' : '#ffc2ce'),
      }},
        el('span', { style:{ fontSize:'17px' } }, line.icon),
        el('span', { style:{ fontSize:'12.5px', fontWeight:'800', flex:'1' } }, line.text),
      ));
    }
    body.push(list);
  }

  if (bankrupt){
    // the slate is already wiped — no point telling her to sell more
    body.push(el('p.tiny.muted.center', { style:{ marginTop:'10px', lineHeight:'1.55' } },
      t('pay.bankruptHelp')));
  } else if (stillRed){
    body.push(el('p.tiny.center', { style:{
      marginTop:'10px', fontWeight:'900', color:'#c0392b',
    }}, t('pay.redWarn', { n: rep.redDays })));
    body.push(el('p.tiny.muted.center', { style:{ marginTop:'4px' } }, t('pay.redHelp')));
  } else if (red){
    body.push(el('p.tiny.center', { style:{
      marginTop:'10px', fontWeight:'900', color:'var(--mint-500)',
    }}, t('pay.settled')));
  }

  const actions = [];
  if (stillRed && !bankrupt){
    actions.push({ label:t('pay.fixStaff'), cls:'ghost', onClick: () => setTimeout(() => go('staff'), 200) });
    actions.push({ label:t('pay.fixSell'), cls:'ghost', onClick: () => setTimeout(() => go('store'), 200) });
  }
  actions.push({
    label: bankrupt ? t('pay.bankruptOk') : red ? t('pay.okRed') : t('pay.ok'),
    cls: stillRed ? 'gold' : 'mint',
    onClick: () => onDone?.(),
  });

  if (red){ sfx('fail'); haptic([30, 60, 30]); }
  else { sfx('coin'); }

  openModal({
    icon: bankrupt ? '🏚️' : stillRed ? '🔴' : red ? '🏦' : '🧾',
    title: bankrupt ? t('pay.bankruptTitle') : red ? t('pay.redTitle') : t('pay.title'),
    sub: bankrupt ? t('pay.bankruptSub')
       : red ? t('pay.redSub', { n: fmt(rep.shortfall) })
       : t('pay.sub'),
    body,
    dismissable: !stillRed,
    actions,
  });
  return true;
}

function actionLine(a){
  switch (a.kind){
    case 'interest':
      return { icon:'🏦', text: t('pay.act.interest', { n: fmt(a.amount) }) };
    case 'fired':
      return { icon: a.face || '📤', text: t('pay.act.fired', { name: a.name }) };
    case 'soldUpgrade':
      return { icon:'🔧', text: t('pay.act.soldUpgrade', {
        name: tName('upgrade', a.id, UPG_BY_ID[a.id]?.name ?? a.id), n: fmt(a.amount) }) };
    case 'soldLocation':
      return { icon:'🚚', text: t('pay.act.soldLocation', {
        name: tName('location', a.id, LOC_BY_ID[a.id]?.name ?? a.id),
        back: tName('location', a.movedTo, LOC_BY_ID[a.movedTo]?.name ?? a.movedTo),
        n: fmt(a.amount) }) };
    case 'bankrupt':
      return { icon:'🏚️', text: t('pay.act.bankrupt', { n: fmt(a.written) }) };
    case 'recovered':
      return { icon:'🌤️', text: t('pay.act.recovered') };
    default: return null;
  }
}

/* ══════════════ the payroll card ══════════════ */

/** Summary block shared by the staff screen. */
export function payrollCard(){
  const bill = wageBill();
  const runway = daysOfRunway();
  const red = inDebt();

  return el('div.card' + (red ? '.danger' : ''),
    el('div.card-title', el('span.ico', red ? '🔴' : '🧾'), t('pay.cardTitle')),
    el('div.stat-grid',
      el('div.stat', el('b', '🪙 ' + fmt(bill)), el('span', t('pay.perDay'))),
      el('div.stat', el('b', red ? '−' + fmt(debtAmount()) : fmt(S.coins)), el('span', t('pay.till'))),
      el('div.stat', el('b', bill <= 0 ? '∞' : String(runway)), el('span', t('pay.runway'))),
    ),
    red
      ? el('p.tiny.center', { style:{ marginTop:'8px', fontWeight:'900', color:'#c0392b' } },
          t('pay.inRed', { n: fmt(debtAmount()) }))
      : el('p.tiny.muted.center', { style:{ marginTop:'8px' } }, t('pay.cardHint')),
  );
}

/** Sell an upgrade level from the store, with a confirmation. */
export function askSellUpgrade(u, onDone){
  const lv = upgLevel(u.id);
  if (lv <= 0) return;
  const back = Math.round((u.cost?.[lv] ?? 0) * 0.6);
  const name = tName('upgrade', u.id, u.name);
  confirmModal({
    icon:'💸',
    title: t('store.sellTitle', { name }),
    sub: t('store.sellSub', { a: lv, b: lv - 1, n: fmt(back) }),
    yes: t('store.sellYes'),
    onYes: () => {
      const got = sellUpgradeLevel(u.id);
      sfx('coin'); haptic(18);
      toast(t('store.sold', { name, n: fmt(got) }), 'good', '💸');
      onDone?.();
    },
  });
}
