/* ============================================================
   Payroll — wages, the overdraft, and what the bank does about it.

   Hiring somebody is a one-off fee; keeping them costs a wage every
   shop day. If the till cannot cover the wages the shop goes into the
   red, and every further payday in the red costs you something real:
   interest, then an employee, then a shop upgrade, then the location
   itself.

   Nothing you *collected* is ever taken — candies, decorations,
   packaging, level and photos all survive a bankruptcy untouched.
   Only the shop you built with coins is on the line.
   ============================================================ */

import {
  S, save, emit, addCoins, roster, fireEmployee,
  sellUpgradeLevel, priciestUpgrade, sellLocation, priciestLocation,
  fallbackLocation, debtAmount, inDebt,
} from '../core/state.js';
import { wageOf, payrollOf } from '../data/staff.js';
import { nudgeMorale } from './staffEvents.js';
import { todayKey, daysBetween, clamp } from '../core/utils.js';

/** Being away for a week must not hand you a week-long bill. */
export const MAX_CATCHUP_DAYS = 3;
/** Charged on the outstanding debt for every payday you stay in the red. */
export const INTEREST = .08;

export const finance = () => {
  if (!S.finance) S.finance = { lastPayday:'', redDays:0, interest:0, paidTotal:0, log:[] };
  return S.finance;
};

/** What the team costs per shop day. */
export const wageBill = () => payrollOf(roster());

/** Whole shop days since the last payday, capped. */
export function paydaysDue(){
  const f = finance();
  if (!f.lastPayday) return 0;
  return clamp(daysBetween(f.lastPayday, todayKey()), 0, MAX_CATCHUP_DAYS);
}

/**
 * Pay everybody for the days that have passed.
 *
 * @returns null when nothing was due, otherwise a report the UI shows:
 *   { days, wages, shortfall, redDays, balance, actions:[…] }
 *
 * Each action is { kind, … } — 'interest', 'fired', 'soldUpgrade',
 * 'soldLocation' or 'bankrupt'.
 */
export function runPayroll(){
  const f = finance();
  const today = todayKey();

  // First launch after wages existed: start the clock rather than
  // backdating a bill onto somebody who never agreed to one.
  if (!f.lastPayday){
    f.lastPayday = today;
    save();
    return null;
  }

  const days = paydaysDue();
  if (days <= 0) return null;

  const team = roster();
  const perDay = payrollOf(team);
  const wages = perDay * days;
  f.lastPayday = today;

  const report = {
    days, wages, perDay,
    headcount: team.length,
    shortfall: 0,
    before: S.coins,
    balance: S.coins,
    redDays: f.redDays || 0,
    actions: [],
  };

  if (wages > 0){
    addCoins(-wages, { allowDebt: true });
    f.paidTotal = (f.paidTotal || 0) + wages;
    // paid on time is a small, steady morale lift
    if (S.coins >= 0) for (const e of team) nudgeMorale(e, 2);
  }

  if (S.coins < 0){
    report.shortfall = -S.coins;
    f.redDays = (f.redDays || 0) + 1;
    // an unpaid shift lands badly with everyone
    for (const e of team) nudgeMorale(e, -8);
    escalate(report, f);
    // if what the bank sold covered the debt, the shop is square again —
    // next payday must start from step one, not carry on escalating
    if (S.coins >= 0 && f.redDays){
      f.redDays = 0;
      report.actions.push({ kind:'recovered' });
    }
  } else if (f.redDays){
    // back in the black — the slate is clean
    f.redDays = 0;
    report.actions.push({ kind:'recovered' });
  }

  report.redDays = f.redDays || 0;
  report.balance = S.coins;

  f.log = [{ date: today, wages, balance: S.coins, red: f.redDays }, ...(f.log || [])].slice(0, 14);
  save();
  emit('state');
  return report;
}

/* ══════════════ what the bank does ══════════════
   One step per payday you stay in the red, from cheapest to most
   painful, so there is always a chance to fix it yourself first. */
function escalate(report, f){
  const step = f.redDays;

  // interest is charged from the very first red payday
  const interest = Math.round(debtAmount() * INTEREST);
  if (interest > 0){
    addCoins(-interest, { allowDebt: true });
    f.interest = (f.interest || 0) + interest;
    report.actions.push({ kind:'interest', amount: interest });
  }
  if (step <= 1) return;

  // 2nd red payday — let the most expensive person go
  if (step === 2){
    const team = [...roster()].sort((a, b) => wageOf(b) - wageOf(a));
    const victim = team[0];
    if (victim){
      fireEmployee(victim.id);
      report.actions.push({ kind:'fired', name: victim.name, face: victim.face, wage: wageOf(victim) });
      return;
    }
  }

  // 3rd and onwards — a shop upgrade goes back to the supplier
  const id = priciestUpgrade();
  if (id){
    const back = sellUpgradeLevel(id);
    report.actions.push({ kind:'soldUpgrade', id, amount: back });
    return;
  }

  // 4th — the fancy address goes, and you move back home
  const locId = priciestLocation();
  if (locId){
    const back = sellLocation(locId);
    report.actions.push({ kind:'soldLocation', id: locId, amount: back, movedTo: S.location });
    return;
  }

  // nothing left to sell and still under water — the shop is wound up.
  // Everything she has *collected* stays hers; only the shop resets.
  if (inDebt()){
    const written = debtAmount();
    S.coins = 0;
    S.staff.roster = [];
    S.location = fallbackLocation();
    f.redDays = 0;
    report.actions.push({ kind:'bankrupt', written });
    emit('state'); save();
  }
}

/** Fold a wage into the wallet figure the staff screen shows. */
export const daysOfRunway = () => {
  const bill = wageBill();
  if (bill <= 0) return Infinity;
  return Math.floor(Math.max(0, S.coins) / bill);
};
