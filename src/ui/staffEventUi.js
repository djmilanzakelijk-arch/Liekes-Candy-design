/* ============================================================
   The pop-up that presents a staff incident and its choices.
   ============================================================ */

import { el, fmt } from '../core/utils.js';
import { S, canAfford } from '../core/state.js';
import { sfx, haptic, duck } from '../core/audio.js';
import { toast, confetti, coinFly, bumpPill } from '../core/fx.js';
import { openModal } from './modal.js';
import {
  eventDef, eventEmployee, resolveStaffEvent, pruneStaffEvent,
  raiseCost, moraleOf, moraleTone,
} from '../game/staffEvents.js';
import { TIERS, employeeStars } from '../data/staff.js';
import { t, tName } from '../core/i18n.js';

/** True while a staff pop-up is on screen, so nothing stacks on top. */
let open = false;

/**
 * Show the queued incident, if there is one.
 * @param onDone called after the player decides (or if there is nothing)
 */
export function showPendingStaffEvent(onDone){
  if (open) return false;
  const ev = pruneStaffEvent();
  if (!ev){ onDone?.(); return false; }

  const emp = eventEmployee(ev);
  const def = eventDef(ev);
  if (!emp || !def){ onDone?.(); return false; }

  open = true;
  duck(1200);
  sfx('door');
  haptic(18);

  const cost = raiseCost(emp);

  /* who it is about */
  const tier = TIERS[emp.tier] || TIERS.rookie;
  const card = el('div.staff-slot.rar-' + tier.rarity, { style:{ marginBottom:'12px' } },
    el('div.staff-face.rar-' + tier.rarity, emp.face),
    el('div.staff-info',
      el('div.s-name', emp.name, el('span.staff-tier', t('staff.tier.' + emp.tier))),
      el('div.stars', ...Array.from({ length:5 }, (_, i) =>
        el('span.s' + (i < employeeStars(emp) ? '.on' : ''), '⭐'))),
      moraleRow(emp),
    ),
  );

  const body = [
    card,
    el('p.center', { style:{ fontSize:'13.5px', fontWeight:'800', lineHeight:'1.45' } },
      t(`sev.${def.id}.text`, { name: emp.name })),
  ];

  const actions = def.choices.map(choice => {
    let label = t(`sev.${def.id}.${choice.id}`);
    if (choice.raise) label += ` (🪙 ${fmt(cost)})`;
    else if (choice.costPct) label += ` (🪙 ${fmt(Math.round(emp.fee * choice.costPct / 10) * 10)})`;
    else if (choice.bonusPct) label += ` (+🪙 ${fmt(Math.round(emp.fee * choice.bonusPct / 10) * 10)})`;

    return {
      label,
      cls: choice.fire ? 'ghost' : choice.morale > 0 || choice.raise ? 'mint' : 'ghost',
      onClick: () => {
        // resolveStaffEvent handles "cannot pay" itself and reports it back
        const res = resolveStaffEvent(ev, choice.id);
        open = false;
        reportOutcome(def, res, emp);
        onDone?.();
      },
    };
  });

  openModal({
    icon: def.emoji,
    title: t(`sev.${def.id}.title`, { name: emp.name }),
    sub: t('sev.sub'),
    body,
    dismissable: false,
    actions,
  });
  return true;
}

function moraleRow(emp){
  const m = moraleOf(emp);
  const tone = moraleTone(m);
  const cls = m >= 65 ? 'mint' : m >= 40 ? 'gold' : '';
  return el('div', { style:{ marginTop:'5px' } },
    el('div.tiny.muted', { style:{ marginBottom:'3px' } },
      `${t('staff.morale')}: ${t('morale.' + tone)}`),
    el('div.bar' + (cls ? '.' + cls : ''), { style:{ height:'8px' } },
      el('i', { style:{ width:m + '%' } })),
  );
}

function reportOutcome(def, res, emp){
  if (res.outcome === 'cantafford'){
    toast(t('sev.cantafford', { name: emp.name }), 'bad', '💸');
    return;
  }
  if (res.fired){
    sfx('remove');
    toast(t('staff.fired', { name: emp.name }), '', '📤');
    return;
  }
  if (res.quit){
    sfx('fail');
    toast(t('sev.quit', { name: emp.name }), 'bad', '🚪');
    return;
  }
  if (res.coins > 0){
    sfx('coin');
    coinFly(window.innerWidth / 2, window.innerHeight * .45, 6);
    bumpPill('#hudCoins');
    toast(`+🪙 ${fmt(res.coins)}`, 'good', '💰');
  } else if (res.coins < 0){
    sfx('gem');
    bumpPill('#hudCoins');
    toast(`-🪙 ${fmt(-res.coins)}`, '', '💸');
    if (res.emp?.raises) confetti(20);
  } else {
    sfx('tap');
  }
}

export const staffPopupOpen = () => open;
