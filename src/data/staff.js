/* ============================================================
   Staff — hireable employees.

   Pure data + maths only (no state import) so it can be used
   from core/state.js without a circular dependency.

   The "Employee" upgrade buys SLOTS; the people who fill those
   slots are hired here and can be fired again at any time.
   ============================================================ */

import { pick, rand, randI, uid, clamp } from '../core/utils.js';

export const TIERS = {
  rookie:  { id:'rookie',  order:0, rarity:'common',    idle:[10, 16], tip:[.00, .03], calm:[.00, .02], fee:[300, 700],     stars:[1, 2] },
  skilled: { id:'skilled', order:1, rarity:'rare',      idle:[18, 26], tip:[.02, .06], calm:[.01, .04], fee:[1200, 2200],   stars:[2, 3] },
  expert:  { id:'expert',  order:2, rarity:'epic',      idle:[28, 42], tip:[.05, .10], calm:[.03, .07], fee:[3200, 5200],   stars:[3, 4] },
  legend:  { id:'legend',  order:3, rarity:'legendary', idle:[55, 78], tip:[.13, .20], calm:[.08, .13], fee:[9000, 14000],  stars:[5, 5] },
};
export const TIER_ORDER = ['rookie', 'skilled', 'expert', 'legend'];

/** Perks and flaws. Negative ones are exactly why firing exists. */
export const TRAITS = {
  earlybird:  { id:'earlybird',  emoji:'🌅', good:true,  idleMult:1.20 },
  charmer:    { id:'charmer',    emoji:'💐', good:true,  tipAdd:.035 },
  zen:        { id:'zen',        emoji:'🧘', good:true,  calmAdd:.035 },
  tidy:       { id:'tidy',       emoji:'🧽', good:true,  calmAdd:.02, idleMult:1.06 },
  quickhands: { id:'quickhands', emoji:'⚡', good:true,  idleMult:1.12, tipAdd:.015 },
  clumsy:     { id:'clumsy',     emoji:'🤕', good:false, idleMult:.80 },
  moody:      { id:'moody',      emoji:'🌧️', good:false, tipAdd:-.035 },
  sweettooth: { id:'sweettooth', emoji:'🍬', good:false, idleMult:.86 },
  late:       { id:'late',       emoji:'⏰', good:false, idleMult:.88, calmAdd:-.02 },
};
export const GOOD_TRAITS = Object.values(TRAITS).filter(t => t.good).map(t => t.id);
export const BAD_TRAITS  = Object.values(TRAITS).filter(t => !t.good).map(t => t.id);

const NAMES = [
  'Fenna','Joris','Bo','Nout','Hidde','Sara','Timo','Ise','Vera','Stijn',
  'Pim','Lise','Wout','Nova','Jill','Teun','Maya','Sef','Robin','Eva',
  'Kaya','Bram','Iris','Levi','Fay','Dex','Sien','Job','Noor','Ravi',
];
const FACES = ['🧑‍🍳','👩‍🍳','👨‍🍳','🧑‍🎨','👩‍🎨','👨‍🎨','🧑‍🏭','👩‍🔬','🧙','🦸','🧑‍🚀','🕺'];

const between = ([a, b], q) => a + (b - a) * q;

/**
 * Roll a new employee.
 * @param tier one of TIER_ORDER
 * @param opt  { forceTrait, noBadTraits }
 */
export function makeEmployee(tier = 'rookie', opt = {}){
  const T = TIERS[tier] || TIERS.rookie;
  const quality = clamp(rand(0, 1) * rand(.55, 1.15), 0, 1);   // skewed: great rolls are rare

  // legends never carry a flaw; everyone else might
  let trait = null;
  if (opt.forceTrait) trait = opt.forceTrait;
  else if (tier === 'legend' || opt.noBadTraits) trait = pick(GOOD_TRAITS);
  else if (Math.random() < .62) trait = Math.random() < (quality > .6 ? .72 : .38) ? pick(GOOD_TRAITS) : pick(BAD_TRAITS);

  const tr = trait ? TRAITS[trait] : null;

  const idle = Math.round(between(T.idle, quality) * (tr?.idleMult ?? 1));
  const tip  = Math.max(0, between(T.tip, quality) + (tr?.tipAdd ?? 0));
  const calm = Math.max(0, between(T.calm, quality) + (tr?.calmAdd ?? 0));

  return {
    id: uid(),
    name: pick(NAMES),
    face: pick(FACES),
    tier,
    quality: Math.round(quality * 100) / 100,
    trait,
    idle,
    tip: Math.round(tip * 1000) / 1000,
    calm: Math.round(calm * 1000) / 1000,
    fee: Math.round(between(T.fee, quality) / 10) * 10,
    hiredAt: 0,
    shifts: 0,
  };
}

/** 1–5 stars used everywhere in the UI. */
export function employeeStars(emp){
  const T = TIERS[emp.tier] || TIERS.rookie;
  const base = between(T.stars, emp.quality);
  const traitShift = emp.trait ? (TRAITS[emp.trait].good ? .4 : -.6) : 0;
  return clamp(Math.round(base + traitShift), 1, 5);
}

/** Which tier an applicant rolls, weighted by the player's level. */
export function rollTier(level){
  const r = Math.random();
  if (level >= 14 && r < .10) return 'expert';
  if (level >= 8  && r < .30) return 'expert';
  if (r < .55) return 'skilled';
  return 'rookie';
}

/** Chance a legendary applicant turns up in today's list. */
export function legendChance(level){
  return level >= 6 ? .12 : 0;
}

/** How long a legendary applicant sticks around, in ms. */
export const LEGEND_WINDOW = 6 * 3600 * 1000;

/**
 * Combined bonus from a hired roster.
 * Pure — safe to call from state.js.
 */
export function staffBonuses(roster = []){
  let idleCoins = 0, tipMult = 1, patienceMult = 1;
  for (const e of roster){
    if (!e) continue;
    const m = moraleMult(e);
    idleCoins += (e.idle || 0) * m;
    tipMult += (e.tip || 0) * m;
    patienceMult += (e.calm || 0) * m;
  }
  return { idleCoins: Math.round(idleCoins), tipMult, patienceMult };
}

/* ── morale ──────────────────────────────────────────
   Kept here (rather than with the events) so it stays pure and
   state.js can use it without a circular import. */

export const moraleOf = emp => clamp(emp?.morale ?? 75, 0, 100);

/** 0 morale → 60 % output, 75 → 100 %, 100 → 112 %. */
export function moraleMult(emp){
  return clamp(.6 + (moraleOf(emp) / 100) * .52, .6, 1.12);
}

export const moraleTone = m =>
  m >= 85 ? 'great' : m >= 65 ? 'good' : m >= 40 ? 'okay' : m >= 20 ? 'low' : 'awful';

/** Cost to throw the applicant list away and draw a fresh one. */
export const REROLL_COST = 350;
