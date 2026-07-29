/* ============================================================
   Delivery service.

   Once you hire a courier, orders start coming in from people who
   cannot make it to the shop. You make the candy exactly as you would
   at the counter, then the courier rides off with it and the money
   lands when they get back.

   A delivery pays more than a walk-in — that is the whole point of
   paying a courier a wage — but the parcel takes real minutes to
   arrive, and each courier can only carry so many at once.
   ============================================================ */

import {
  S, save, emit, addCoins, addXp, addGems, bump, roster,
  canDeliver, nudgeSatisfaction,
} from '../core/state.js';
import { courierStats, bestCourier, deliverySlots, couriers } from '../data/staff.js';
import { makeCustomer } from './orders.js';
import { addPoints as seasonPoints } from './seasonPass.js';
import { POINTS as SEASON_POINTS } from '../data/season.js';
import { todayKey, uid, clamp, randI, pick } from '../core/utils.js';

/** How long a parcel is on the road before any courier bonus, in minutes. */
const BASE_MINUTES = [12, 22, 35];
/** A delivery job waits this long on the board before it is withdrawn. */
const JOB_LIFETIME_MS = 3 * 3600 * 1000;
/** Minutes between one order coming in and the next. */
const JOB_GAP_MIN = [14, 38];

/** A standing order pays this much more than a walk-in delivery. */
const SUB_BONUS = 1.55;
/** How often a subscriber's box is due, in hours. */
const SUB_EVERY = [6, 12, 24];
/** Missing this many boxes in a row and they cancel. */
const SUB_HEALTH = 3;

export const store = () => {
  if (!S.delivery){
    S.delivery = { board:[], boardDate:'', active:[], done:0, earned:0,
                   nextJobAt:0, subs:[], offer:null };
  }
  if (!S.delivery.subs) S.delivery.subs = [];
  return S.delivery;
};

const gapMs = () => randI(JOB_GAP_MIN[0], JOB_GAP_MIN[1]) * 60000;

/* ══════════════ the board ══════════════ */

/** Drop jobs nobody took in time. */
function pruneBoard(){
  const d = store();
  const now = Date.now();
  const before = d.board.length;
  d.board = d.board.filter(j => j.expires > now);
  return before !== d.board.length;
}

/** How many jobs are offered at once — bigger teams get a busier board. */
const boardSize = () => clamp(1 + couriers(roster()).length, 2, 5);

/**
 * Let orders trickle in.
 *
 * The board deliberately does NOT top itself back up the moment you take
 * a job: you are meant to be able to work it empty and be done for a
 * while. A new order arrives every quarter of an hour or so, up to the
 * cap your couriers can carry.
 */
export function ensureBoard(){
  const d = store();
  if (!canDeliver()) return d;
  pruneBoard();

  const now = Date.now();
  const cap = boardSize();

  // first visit: put one up straight away so there is something to do
  if (!d.nextJobAt){
    if (!d.board.length) d.board.push(makeJob());
    d.nextJobAt = now + gapMs();
    d.boardDate = todayKey();
    save();
    return d;
  }

  let added = 0;
  let guard = 0;
  while (d.nextJobAt <= now && guard++ < 8){
    if (d.board.length >= cap){
      // full board: stop stacking up a backlog while you were away
      d.nextJobAt = now + gapMs();
      break;
    }
    d.board.push(makeJob());
    added++;
    d.nextJobAt += gapMs();
  }
  if (d.nextJobAt <= now) d.nextJobAt = now + gapMs();

  tickSubs(d);
  maybeOffer(d);

  d.boardDate = todayKey();
  if (added || guard) save();
  return d;
}

/* ══════════════ standing orders ══════════════
   A subscriber wants the same kind of box on a fixed rhythm. Keep it
   up and it pays half again as much, every time, for as long as they
   stay signed up. */

export const subs = () => store().subs;
export const subOffer = () => store().offer;

/** Post the boxes that have come due, and drop subscribers you kept ignoring. */
function tickSubs(d){
  const now = Date.now();
  for (const sub of d.subs){
    if (sub.nextAt > now) continue;

    // last box never got made — that is a strike
    if (sub.pendingJob && !d.board.some(j => j.id === sub.pendingJob)){
      // it left the board without being taken (claimJob clears jobDone)
      if (!sub.jobDone) sub.health = (sub.health || SUB_HEALTH) - 1;
    }
    sub.jobDone = false;
    sub.pendingJob = null;

    if ((sub.health ?? SUB_HEALTH) <= 0){ sub.cancelled = true; continue; }

    if (d.board.length < boardSize() + 1){
      const job = makeJob();
      job.sub = sub.id;
      job.subName = sub.name;
      job.fee = Math.round(job.fee * SUB_BONUS);
      job.expires = now + sub.every * 3600000 * .9;
      d.board.push(job);
      sub.pendingJob = job.id;
    }
    sub.nextAt = now + sub.every * 3600000;
  }
  const before = d.subs.length;
  d.subs = d.subs.filter(s => !s.cancelled);
  if (d.subs.length !== before) save();
}

/** Occasionally somebody asks to sign up for a standing order. */
function maybeOffer(d){
  if (d.offer || d.subs.length >= 3) return;
  if ((d.done || 0) < 3) return;                 // prove you can deliver first
  if (Math.random() > .18) return;

  const customer = makeCustomer({ difficulty: Math.min(1, .3 + S.level / 24) });
  d.offer = {
    id: uid(),
    name: customer.name,
    face: customer.face,
    every: pick(SUB_EVERY),
    address: pick(ADDRESSES),
    fee: Math.round(customer.budget * .4 * SUB_BONUS),
  };
  save();
}

export function acceptOffer(){
  const d = store();
  if (!d.offer) return null;
  const o = d.offer;
  d.offer = null;
  d.subs.push({
    id: o.id, name: o.name, face: o.face, address: o.address,
    every: o.every, fee: o.fee,
    health: SUB_HEALTH, nextAt: Date.now(), boxes: 0,
    pendingJob: null, jobDone: false,
  });
  bump('subs');
  save(); emit('state');
  return d.subs[d.subs.length - 1];
}

export function declineOffer(){
  const d = store();
  d.offer = null;
  save(); emit('state');
}

export function cancelSub(id){
  const d = store();
  d.subs = d.subs.filter(s => s.id !== id);
  save(); emit('state');
}

/** Minutes until a subscriber's next box. */
export const subDueIn = sub => Math.max(0, Math.ceil((sub.nextAt - Date.now()) / 60000));

/** Minutes until the next order comes in, or null when the board is full. */
export function nextJobIn(){
  const d = store();
  if (!d.nextJobAt || d.board.length >= boardSize()) return null;
  return Math.max(0, Math.ceil((d.nextJobAt - Date.now()) / 60000));
}

/** Turn a job down — it leaves the board and does not come back. */
export function declineJob(id){
  const d = store();
  const before = d.board.length;
  d.board = d.board.filter(j => j.id !== id);
  // taking one off does not summon a replacement any sooner
  if (d.board.length !== before) save();
  return d;
}

function makeJob(){
  const customer = makeCustomer({ difficulty: Math.min(1, .25 + S.level / 22) });
  // a delivery customer is not stood at your counter tapping their foot
  customer.patience *= 1.5;
  customer.maxPatience = customer.patience;
  customer.delivery = true;

  const distance = randI(0, 2);           // near / across town / out of town
  return {
    id: uid(),
    customer,
    distance,
    /** paid on top of the normal order payout */
    fee: Math.round(customer.budget * (.25 + distance * .18)),
    minutes: BASE_MINUTES[distance],
    expires: Date.now() + JOB_LIFETIME_MS,
    address: pick(ADDRESSES),
  };
}

const ADDRESSES = [
  'Tulpstraat', 'Molenweg', 'Kersenlaan', 'Havenkade', 'Bloemplein',
  'Zonnehof', 'Dorpsstraat', 'Beukenlaan', 'Sterrenpad', 'Vlinderhof',
];

export const jobById = id => store().board.find(j => j.id === id) || null;

/** Take a job off the board — call this once the studio opens. */
export function claimJob(id){
  const d = store();
  const job = d.board.find(j => j.id === id);
  if (job?.sub){
    const sub = d.subs.find(s => s.id === job.sub);
    if (sub){
      sub.jobDone = true;
      sub.boxes = (sub.boxes || 0) + 1;
      // a box made on time restores their faith
      sub.health = SUB_HEALTH;
    }
  }
  d.board = d.board.filter(j => j.id !== id);
  save();
  return d;
}

/* ══════════════ parcels on the road ══════════════ */

export const activeParcels = () => store().active;
export const parcelSlots = () => deliverySlots(roster());
export const roadIsFull = () => activeParcels().length >= parcelSlots();

/**
 * Hand a finished candy to a courier.
 * @param job    the board job that was served
 * @param pay    the payout object from scoring
 * @param stars  1..5
 */
export function dispatch(job, pay, stars, design){
  const d = store();
  const courier = bestCourier(roster());
  const cs = courier ? courierStats(courier) : { speed:1, payMult:1 };

  const minutes = Math.max(3, Math.round(job.minutes / cs.speed));
  const fee = Math.round(job.fee * cs.payMult * (.6 + stars * .12));

  const parcel = {
    id: uid(),
    address: job.address,
    face: job.customer.face,
    name: job.customer.name,
    courierId: courier?.id || null,
    courierName: courier?.name || '',
    courierFace: courier?.face || '🚴',
    stars,
    coins: pay.total + fee,
    fee,
    xp: Math.round(pay.xp * 1.2),
    gems: pay.gems || 0,
    design: JSON.parse(JSON.stringify(design)),
    sentAt: Date.now(),
    arrivesAt: Date.now() + minutes * 60000,
    minutes,
  };
  d.active.push(parcel);
  save();
  emit('state');
  return parcel;
}

export const parcelArrived = p => Date.now() >= p.arrivesAt;
export const arrivedParcels = () => activeParcels().filter(parcelArrived);

/** Collect one arrived parcel. @returns the parcel, or null if not there yet. */
export function collect(id){
  const d = store();
  const p = d.active.find(x => x.id === id);
  if (!p || !parcelArrived(p)) return null;
  d.active = d.active.filter(x => x.id !== id);
  d.done = (d.done || 0) + 1;
  d.earned = (d.earned || 0) + p.coins;

  addCoins(p.coins);
  addXp(p.xp);
  if (p.gems) addGems(p.gems);
  bump('delivered');
  bump('orders');
  seasonPoints(SEASON_POINTS.delivery);
  nudgeSatisfaction(p.stars >= 4 ? 2 : p.stars >= 3 ? 0 : -2);
  save();
  emit('state');
  return p;
}

/** Collect everything that has landed. @returns { count, coins } */
export function collectAll(){
  let count = 0, coins = 0;
  for (const p of [...arrivedParcels()]){
    const got = collect(p.id);
    if (got){ count++; coins += got.coins; }
  }
  return { count, coins };
}

/** Minutes left, rounded up, for the countdown label. */
export function minutesLeft(p){
  return Math.max(0, Math.ceil((p.arrivesAt - Date.now()) / 60000));
}
