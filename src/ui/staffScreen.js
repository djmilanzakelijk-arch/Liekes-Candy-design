/* ============================================================
   Staff screen — hire, fire and replace your employees.

   Slots come from the Employee upgrade in the store. Everyone who
   already owned that upgrade keeps a matching employee per slot.
   ============================================================ */

import { el, $, fmt, todayKey, clamp } from '../core/utils.js';
import {
  S, save, spend, canAfford, staffSlots, roster,
  hireEmployee, fireEmployee, seedLegacyStaff, bonuses,
} from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti, sparkleBurst } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import {
  makeEmployee, employeeStars, rollTier, legendChance, LEGEND_WINDOW,
  TIERS, TRAITS, REROLL_COST,
} from '../data/staff.js';
import { UPG_BY_ID } from '../data/upgrades.js';
import { go, subHeader } from './nav.js';
import { t, tName } from '../core/i18n.js';

let tickTimer = 0;

/* ══════════════ applicant pool ══════════════ */

function pruneExpired(){
  const now = Date.now();
  const before = (S.staff.applicants || []).length;
  S.staff.applicants = (S.staff.applicants || []).filter(a => !a.expires || a.expires > now);
  return before !== S.staff.applicants.length;
}

/** Refresh the applicant list once per day (or on demand). */
export function ensureApplicants(force = false){
  if (!S.staff) S.staff = { roster:[], applicants:[], applicantsDate:'', seededFromUpgrade:0 };
  pruneExpired();

  const today = todayKey();
  if (!force && S.staff.applicantsDate === today && S.staff.applicants?.length) return;

  const list = [];
  for (let i = 0; i < 3; i++) list.push(makeEmployee(rollTier(S.level)));

  // …and occasionally a legend walks in, but only for a few hours
  if (Math.random() < legendChance(S.level)){
    const legend = makeEmployee('legend');
    legend.expires = Date.now() + LEGEND_WINDOW;
    list.unshift(legend);
  }

  S.staff.applicants = list;
  S.staff.applicantsDate = today;
  save();
}

const legendApplicant = () =>
  (S.staff.applicants || []).find(a => a.tier === 'legend' && a.expires > Date.now());

function fmtRemaining(ms){
  const m = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}u ${m % 60}m` : `${m}m`;
}

/* ══════════════ screen ══════════════ */
export function mountStaff(host){
  seedLegacyStaff();
  ensureApplicants();

  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('staff.title'), '🧑‍🍳'));

  const slots = staffSlots();
  const hired = roster();

  /* legendary alert */
  const legend = legendApplicant();
  if (legend){
    wrap.append(el('div.legend-banner.shine',
      el('h3', t('staff.legendTitle')),
      el('p', t('staff.legendBody', { name: legend.name })),
      el('span.legend-timer', { id:'legendTimer' },
        '⏳ ' + fmtRemaining(legend.expires - Date.now())),
    ));
  }

  /* what the team currently gives you */
  const b = bonuses();
  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '📈'), t('staff.teamBonus'), el('span.spacer'),
      el('span.sub', t('staff.slotsUsed', { a: hired.length, b: slots }))),
    el('div.stat-grid',
      el('div.stat', el('b', '🪙 ' + fmt(b.idleCoins)), el('span', t('staff.perHour'))),
      el('div.stat', el('b', '+' + Math.round((b.tipMult - 1) * 100) + '%'), el('span', t('staff.tips'))),
      el('div.stat', el('b', '+' + Math.round((b.patienceMult - 1) * 100) + '%'), el('span', t('staff.patience'))),
    ),
  ));

  /* the team */
  const team = el('div.card',
    el('div.card-title', el('span.ico', '👥'), t('staff.yourTeam')));

  if (slots === 0){
    team.append(el('p.tiny.muted.center', { style:{ padding:'8px 0' } }, t('staff.noSlots')));
    team.append(el('button.btn.gold.block.sm', { onclick: () => go('store') }, t('staff.goStore')));
  } else {
    for (const emp of hired) team.append(employeeRow(emp, 'fire'));
    for (let i = hired.length; i < slots; i++){
      team.append(el('div.staff-slot.empty', t('staff.emptySlot')));
    }
    if (slots < 4){
      team.append(el('p.tiny.muted.center', { style:{ marginTop:'8px' } }, t('staff.moreSlots')));
    }
  }
  wrap.append(team);

  /* applicants */
  const appl = el('div.card',
    el('div.card-title', el('span.ico', '📋'), t('staff.applicants'), el('span.spacer'),
      el('span.sub', t('staff.refresh'))));

  const list = (S.staff.applicants || []);
  if (!list.length){
    appl.append(el('p.tiny.muted.center', { style:{ padding:'8px 0' } }, t('staff.noApplicants')));
  } else {
    for (const a of list) appl.append(employeeRow(a, 'hire'));
  }
  appl.append(el('button.btn.ghost.block.sm', { style:{ marginTop:'8px' }, onclick: reroll },
    t('staff.reroll', { n: fmt(REROLL_COST) })));
  wrap.append(appl);

  wrap.append(el('p.tiny.muted.center', { style:{ marginTop:'4px' } }, t('staff.tip')));

  host.append(wrap);

  /* live countdown for the legendary applicant */
  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    const l = legendApplicant();
    const node = $('#legendTimer');
    if (!node) return;
    if (!l){ go('staff'); return; }
    node.textContent = '⏳ ' + fmtRemaining(l.expires - Date.now());
  }, 30000);

  return () => clearInterval(tickTimer);
}

/* ══════════════ rows ══════════════ */
function employeeRow(emp, action){
  const tier = TIERS[emp.tier] || TIERS.rookie;
  const stars = employeeStars(emp);
  const trait = emp.trait ? TRAITS[emp.trait] : null;
  const affordable = canAfford(emp.fee);
  const full = roster().length >= staffSlots();

  const row = el('div.staff-slot.rar-' + tier.rarity,
    el('div.staff-face.rar-' + tier.rarity, emp.face),
    el('div.staff-info',
      el('div.s-name', emp.name,
        el('span.staff-tier', t('staff.tier.' + emp.tier)),
        emp.expires ? el('span.staff-tier', { style:{ background:'#ffe9a8', color:'#8a5c05' } }, '⏳') : null),
      el('div.stars', ...Array.from({ length:5 }, (_, i) =>
        el('span.s' + (i < stars ? '.on' : ''), '⭐'))),
      el('div.staff-stats',
        el('span.staff-stat', `🪙 ${emp.idle}/u`),
        el('span.staff-stat', `💰 +${Math.round(emp.tip * 100)}%`),
        el('span.staff-stat', `⏳ +${Math.round(emp.calm * 100)}%`),
        trait ? el('span.staff-trait' + (trait.good ? '.good' : '.bad'),
          `${trait.emoji} ${t('trait.' + trait.id)}`) : null,
      ),
    ),
    action === 'fire'
      ? el('button.staff-action.fire', { onclick: () => askFire(emp) }, t('staff.fire'))
      : el('button.staff-action.hire' + (affordable && !full ? '' : '.cant'), {
          onclick: () => askHire(emp, full, affordable),
        }, '🪙 ' + fmt(emp.fee)),
  );
  return row;
}

/* ══════════════ actions ══════════════ */
function askHire(emp, full, affordable){
  if (full){
    sfx('error');
    return toast(t('staff.fullWarn'), 'warn', '👥');
  }
  if (!affordable){
    sfx('error');
    return toast(t('staff.cantAfford'), 'bad', '💸');
  }
  const stars = employeeStars(emp);
  confirmModal({
    icon: emp.face,
    title: t('staff.hireTitle', { name: emp.name }),
    sub: `${t('staff.tier.' + emp.tier)} · ${'⭐'.repeat(stars)} · 🪙 ${fmt(emp.fee)}`,
    yes: t('staff.hire'),
    onYes: () => {
      if (!spend(emp.fee)) return;
      if (!hireEmployee(emp)){
        toast(t('staff.fullWarn'), 'warn', '👥');
        return;
      }
      sfx('unlock'); haptic([12, 30, 12]);
      confetti(emp.tier === 'legend' ? 60 : 26);
      toast(t('staff.hired', { name: emp.name }), 'good', '🎉');
      go('staff');
    },
  });
}

function askFire(emp){
  confirmModal({
    icon:'📤',
    title: t('staff.fireTitle', { name: emp.name }),
    sub: t('staff.fireSub'),
    yes: t('staff.fireYes'),
    onYes: () => {
      fireEmployee(emp.id);
      sfx('remove'); haptic(25);
      toast(t('staff.fired', { name: emp.name }), '', '📤');
      go('staff');
    },
  });
}

function reroll(){
  if (!canAfford(REROLL_COST)){
    sfx('error');
    return toast(t('staff.cantAfford'), 'bad', '💸');
  }
  // a legendary applicant is never thrown away by a reroll
  const legend = legendApplicant();
  if (!spend(REROLL_COST)) return;
  ensureApplicants(true);
  if (legend && !legendApplicant()){
    S.staff.applicants.unshift(legend);
    save();
  }
  sfx('swipe');
  go('staff');
}
