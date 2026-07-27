/* ============================================================
   Staff incidents — the little dilemmas your employees create.

   An event picks one employee and offers 2–3 choices. Every choice
   moves that employee's morale and sometimes your coins. Morale
   scales everything they contribute, and at rock bottom they quit.
   ============================================================ */

import { S, save, addCoins, spend, canAfford, fireEmployee, roster, emit } from '../core/state.js';
import { TIERS, TRAITS, moraleOf, moraleMult, moraleTone } from '../data/staff.js';
import { pick, clamp, randI, uid } from '../core/utils.js';

/** Minimum gap between incidents so they never feel spammy. */
const COOLDOWN_MS = 4 * 60 * 1000;
/** Chance an incident fires after an order, once off cooldown. */
const CHANCE = .22;

/* ══════════════ morale ══════════════ */

export { moraleOf, moraleMult, moraleTone };

export function nudgeMorale(emp, delta){
  emp.morale = clamp(moraleOf(emp) + delta, 0, 100);
  return emp.morale;
}

/* ══════════════ raises ══════════════ */

/** A raise is a one-off payment; it lifts morale and output for good. */
export const raiseLevel = emp => emp.raises || 0;
export const MAX_RAISES = 3;
export const raiseCost = emp =>
  Math.round((emp.fee * (0.55 + raiseLevel(emp) * 0.45)) / 10) * 10;

export function giveRaise(emp){
  emp.raises = raiseLevel(emp) + 1;
  emp.idle = Math.round(emp.idle * 1.10);
  emp.tip = Math.round((emp.tip + .012) * 1000) / 1000;
  nudgeMorale(emp, 26);
  return emp;
}

/* ══════════════ event catalogue ══════════════
   `weight` biases which incident turns up. `when` can veto one.
   Each choice: { id, cost (coins), morale, fire, bonus (coins gained) } */

export const STAFF_EVENTS = [
  {
    id:'raise', emoji:'💰', weight:14,
    when:e => raiseLevel(e) < MAX_RAISES && moraleOf(e) < 92,
    choices:[
      { id:'give',    morale:0,   raise:true  },
      { id:'promise', morale:-6,  repeat:true },
      { id:'refuse',  morale:-20 },
    ],
  },
  {
    id:'atecandy', emoji:'🍭', weight:16,
    when:e => true,
    choices:[
      { id:'laugh',   morale:+6 },
      { id:'notip',   morale:-14, bonusPct:.5 },
      { id:'warn',    morale:-9 },
      { id:'fire',    fire:true },
    ],
  },
  {
    id:'late', emoji:'⏰', weight:12,
    choices:[
      { id:'forgive', morale:+4 },
      { id:'docked',  morale:-11, bonusPct:.35 },
      { id:'warn',    morale:-6 },
    ],
  },
  {
    id:'sick', emoji:'🤒', weight:10,
    choices:[
      { id:'paid',    morale:+14, costPct:.35 },
      { id:'unpaid',  morale:-12 },
    ],
  },
  {
    id:'greatday', emoji:'🌟', weight:12,
    when:e => moraleOf(e) > 30,
    choices:[
      { id:'bonus',   morale:+18, costPct:.30 },
      { id:'praise',  morale:+7 },
      { id:'nothing', morale:-4 },
    ],
  },
  {
    id:'poached', emoji:'📮', weight:8,
    when:e => raiseLevel(e) < MAX_RAISES,
    choices:[
      { id:'counter', morale:0, raise:true },
      { id:'letgo',   fire:true },
    ],
  },
  {
    id:'brokemould', emoji:'💥', weight:11,
    choices:[
      { id:'nevermind', morale:+8 },
      { id:'paydamage', morale:-16, bonusPct:.4 },
      { id:'warn',      morale:-7 },
    ],
  },
  {
    id:'timeoff', emoji:'🏖️', weight:9,
    choices:[
      { id:'grant',   morale:+16 },
      { id:'deny',    morale:-15 },
    ],
  },
  {
    id:'tastetest', emoji:'👅', weight:10,
    choices:[
      { id:'allow',   morale:+9,  costPct:.12 },
      { id:'nomore',  morale:-8 },
    ],
  },
];

const EVENT_BY_ID = Object.fromEntries(STAFF_EVENTS.map(e => [e.id, e]));

/* ══════════════ firing off an event ══════════════ */

/**
 * Maybe create an incident. Returns the queued event or null.
 * Called after an order completes.
 */
export function maybeStaffEvent(force = false){
  const team = roster();
  if (!team.length) return null;

  if (!S.staff.pending) S.staff.pending = null;
  if (S.staff.pending) return S.staff.pending;      // one at a time

  const last = S.staff.lastEventAt || 0;
  if (!force && Date.now() - last < COOLDOWN_MS) return null;
  if (!force && Math.random() > CHANCE) return null;

  const emp = pick(team);
  const options = STAFF_EVENTS.filter(e => !e.when || e.when(emp));
  if (!options.length) return null;

  let total = 0;
  for (const o of options) total += o.weight;
  let r = Math.random() * total;
  let def = options[options.length - 1];
  for (const o of options){ r -= o.weight; if (r <= 0){ def = o; break; } }

  const ev = {
    uid: uid(),
    id: def.id,
    empId: emp.id,
    at: Date.now(),
  };
  S.staff.pending = ev;
  S.staff.lastEventAt = Date.now();
  save();
  return ev;
}

/** The employee an event refers to, or null if they already left. */
export const eventEmployee = ev => roster().find(e => e.id === ev?.empId) || null;

export const eventDef = ev => EVENT_BY_ID[ev?.id];

/**
 * Apply one choice.
 * @returns { outcome, coins, fired, quit }
 */
export function resolveStaffEvent(ev, choiceId){
  const def = eventDef(ev);
  const emp = eventEmployee(ev);
  S.staff.pending = null;

  if (!def || !emp){ save(); return { outcome:'gone' }; }

  const choice = def.choices.find(c => c.id === choiceId) || def.choices[0];
  const result = { outcome: choice.id, coins: 0, fired: false, quit: false, emp };

  // money first — if the player cannot pay, the choice degrades to a refusal
  if (choice.raise){
    const cost = raiseCost(emp);
    if (!canAfford(cost)){
      nudgeMorale(emp, -14);
      result.outcome = 'cantafford';
      save();
      return result;
    }
    spend(cost);
    giveRaise(emp);
    result.coins = -cost;
  }
  if (choice.costPct){
    const cost = Math.round(emp.fee * choice.costPct / 10) * 10;
    if (canAfford(cost)){ spend(cost); result.coins = -cost; }
    else { nudgeMorale(emp, -8); result.outcome = 'cantafford'; }
  }
  if (choice.bonusPct){
    const gain = Math.round(emp.fee * choice.bonusPct / 10) * 10;
    addCoins(gain);
    result.coins = gain;
  }

  if (choice.morale) nudgeMorale(emp, choice.morale);

  if (choice.fire){
    fireEmployee(emp.id);
    result.fired = true;
  } else if (moraleOf(emp) <= 0){
    // pushed too far — they walk out on their own
    fireEmployee(emp.id);
    result.quit = true;
  }

  if (choice.repeat){
    // "I'll think about it" comes back around sooner
    S.staff.lastEventAt = Date.now() - COOLDOWN_MS * .55;
  }

  save();
  emit('state');
  return result;
}

/** Drop a pending event that points at somebody who already left. */
export function pruneStaffEvent(){
  if (S.staff?.pending && !eventEmployee(S.staff.pending)){
    S.staff.pending = null;
    save();
  }
  return S.staff?.pending || null;
}
