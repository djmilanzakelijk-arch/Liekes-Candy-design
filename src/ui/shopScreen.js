/* ============================================================
   Shop screen — the diorama, the customer queue and game modes.
   Also owns the serve → grade → reward flow.
   ============================================================ */

import { el, $, $$, clamp, fmt, pick, todayKey } from '../core/utils.js';
import {
  S, bonuses, addCoins, addGems, addXp, bump, pushStreak,
  nudgeSatisfaction, shopSatisfaction, save, on, emit,
} from '../core/state.js';
import { sfx, haptic, duck } from '../core/audio.js';
import { toast, confetti, coinFly, floatText, bumpPill } from '../core/fx.js';
import { openModal } from './modal.js';
import { openStudio, closeStudio } from './studio.js';
import { drawShop } from '../render/shop.js';
import { drawDesign } from '../render/candy.js';
import { makeCustomer, makeOrder, makeDailySpecial, describeOrder, orderChecklist } from '../game/orders.js';
import { followersFromCustomer } from '../game/social.js';
import { maybeAdopt, recordVisit, regularChance, nextRegular, findRegular,
         loyaltyTipMult } from '../game/regulars.js';
import { addPoints as seasonPoints, scoreOrder } from '../game/seasonPass.js';
import { POINTS as SEASON_POINTS } from '../data/season.js';
import { grade, payout, reactionLine, satisfactionDelta } from '../game/scoring.js';
import { getLocation } from '../data/upgrades.js';
import { activeEvent } from '../data/events.js';
import { getCandy } from '../data/candies.js';
import { checkMissions } from './missions.js';
import { maybeStaffEvent } from '../game/staffEvents.js';
import { showPendingStaffEvent } from './staffEventUi.js';
import { go } from './nav.js';
import { t, tName, tDesc, tLines, onLangChange } from '../core/i18n.js';

let queue = [];
let shopRaf = 0, shopT = 0, lastNow = 0;
let mounted = false;
let mode = null;          // null | {id,...} for endless/speed/challenge runs
let dailySpecialDone = '';
let hitBoxes = [];

/* ══════════════ queue upkeep ══════════════ */
function queueSize(){ return bonuses().queue + (S.level >= 8 ? 1 : 0); }

function fillQueue(){
  const want = queueSize();
  while (queue.length < want){
    const c = makeCustomer();
    // one of your regulars may be the one who walks in
    if (!c.vip && Math.random() < regularChance()){
      const reg = nextRegular();
      if (reg && !queue.some(q => q.regularId === reg.id)) dressAsRegular(c, reg);
    }
    c.entering = true;
    c.walk = 0;                       // 0 → 1 as they cross the shop floor
    c.wantEmoji = getCandy(c.order.candy).emoji;
    queue.push(c);
    if (mounted) sfx('door');
  }
}

function tickQueue(dt){
  let changed = false;
  for (const c of queue){
    // walk in through the door first — patience only starts once they arrive
    if ((c.walk ?? 1) < 1){
      c.walk = Math.min(1, (c.walk ?? 0) + dt / 1.6);
      continue;
    }
    // waiting customers lose patience slowly — the shop still feels alive
    c.patience -= dt * .32;
    if (c.patience <= 0){
      c.left = true;
      changed = true;
    }
  }
  const before = queue.length;
  queue = queue.filter(c => !c.left);
  if (queue.length !== before){
    nudgeSatisfaction(-4);
    pushStreak(false);
    toast(t('toast.tired'), 'bad', '💨');
    sfx('fail');
    changed = true;
  }
  fillQueue();
  return changed;
}

/* ══════════════ screen ══════════════ */
export function mountShop(host){
  mounted = true;
  fillQueue();

  const wrap = el('div.screen.enter');

  /* event banner */
  const ev = activeEvent();
  if (ev){
    const banner = el('div.event-banner.shine', { style:{
      background:`linear-gradient(120deg,${ev.grad[0]},${ev.grad[1]})`,
    }},
      el('h3', `${ev.emoji} ${tName('event', ev.id, ev.name)}`),
      el('p', `${tDesc('event', ev.id, ev.blurb)} · +${Math.round((ev.payMult - 1) * 100)}%`),
      el('span.e-emoji', ev.emoji),
    );
    wrap.append(banner);
  }

  /* diorama */
  const stage = el('div.shop-stage');
  const cv = el('canvas');
  const loc = getLocation(S.location);
  stage.append(cv,
    el('div.shop-badges',
      el('div.shop-badge', '😊 ', el('b', { id:'satNum' }, String(shopSatisfaction()))),
      el('div.shop-badge', '🔥 ', el('b', { id:'streakNum' }, String(S.streak))),
    ),
    el('div.shop-loc', loc.emoji, ' ', tName('location', loc.id, loc.name)),
  );
  wrap.append(stage);
  wrap.append(el('p.tiny.muted.center', { style:{ margin:'-4px 0 10px' } }, t('shop.tapCustomer')));

  /* queue */
  wrap.append(el('div.section-head', el('h2', t('shop.customers')),
    el('span.spacer'),
    el('span.tiny.muted', { id:'queueCount' }, t('shop.waiting', { n: queue.length }))));
  wrap.append(el('div.queue', { id:'queueRow' }));

  /* today's special */
  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '🌟'), t('shop.special'), el('span.spacer'),
      el('span.sub', t('shop.specialSub'))),
    dailySpecialDone === todayKey()
      ? el('p.tiny.muted.center', t('shop.specialDone'))
      : el('button.btn.gold.block', { onclick: startDailySpecial }, t('shop.specialBtn')),
  ));

  /* modes */
  wrap.append(el('div.section-head', el('h2', t('shop.ways'))));
  wrap.append(el('div.mode-grid',
    modeTile('endless',   '♾️', t('mode.endless'),   t('mode.endlessSub'), 1),
    modeTile('speed',     '⚡', t('mode.speed'),     t('mode.speedSub'), 4),
    modeTile('challenge', '🎯', t('mode.challenge'), t('mode.challengeSub'), 7),
    modeTile('free',      '🎨', t('mode.free'),     t('mode.freeSub'), 1),
  ));

  /* stats */
  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '📊'), t('shop.stats')),
    el('div.stat-grid',
      stat(fmt(S.counters.orders), t('stat.orders')),
      stat(fmt(S.counters.fiveStars), t('stat.five')),
      stat(fmt(S.bestStreak), t('stat.best')),
      stat(fmt(S.counters.perfect), t('stat.perfect')),
      stat(fmt(S.counters.coinsEarned), t('stat.earned')),
      stat(String(shopSatisfaction()) + '%', t('stat.satisfaction')),
    ),
  ));

  host.append(wrap);
  renderQueue();

  // diorama animation
  const c2 = cv.getContext('2d');
  const resize = () => {
    const r = stage.getBoundingClientRect();
    const d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = r.width * d; cv.height = r.height * d;
    c2.setTransform(d, 0, 0, d, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  // tapping a customer in the shop takes their order
  cv.addEventListener('click', ev2 => {
    const r = cv.getBoundingClientRect();
    const px = ev2.clientX - r.left, py = ev2.clientY - r.top;
    // topmost (right-most) first so overlapping figures resolve sensibly
    for (let i = hitBoxes.length - 1; i >= 0; i--){
      const b = hitBoxes[i];
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h){
        const cust = queue.find(c => c.id === b.id);
        if (cust && (cust.walk ?? 1) >= 1) startOrder(cust);
        return;
      }
    }
  });

  lastNow = performance.now();
  const loop = (now) => {
    if (!mounted) return;
    const dt = Math.min(.08, (now - lastNow) / 1000);
    lastNow = now; shopT += dt;
    if (tickQueue(dt)) renderQueue(); else updatePatienceBars();
    const r = stage.getBoundingClientRect();
    hitBoxes = drawShop(c2, r.width, r.height, {
      location: S.location, upgrades: S.upgrades, t: shopT,
      satisfaction: shopSatisfaction(),
      customers: queue.map(c => ({
        id: c.id, face: c.face, vip: c.vip,
        walk: c.walk ?? 1,
        want: c.wantEmoji,
        patience: clamp(c.patience / c.maxPatience, 0, 1),
      })),
    }) || [];
    shopRaf = requestAnimationFrame(loop);
  };
  shopRaf = requestAnimationFrame(loop);

  return () => {
    mounted = false;
    cancelAnimationFrame(shopRaf);
    window.removeEventListener('resize', resize);
  };
}

const stat = (v, label) => el('div.stat', el('b', v), el('span', label));

/**
 * Turn a freshly rolled customer into a visit from a regular: same
 * order machinery, but their name, face and taste come along, and the
 * order leans towards what they are known to like.
 */
function dressAsRegular(c, reg){
  c.regularId = reg.id;
  c.name = reg.name;
  c.face = reg.face;
  c.fromSocial = false;
  c.influencer = false;
  c.order = makeOrder({
    difficulty: Math.min(1, (S.level - 1) / 16),
    forceCandy: S.owned.candies.includes(reg.loves.candy) ? reg.loves.candy : undefined,
    forceColor: reg.loves.color,
    forceDecos: reg.loves.deco && S.owned.decos.includes(reg.loves.deco) ? [reg.loves.deco] : null,
  });
  c.order.line = describeOrder(c.order);
  c.order.checklist = orderChecklist(c.order);
  c.favColor = c.order.color;
  c.favCandy = c.order.candy;
  // they know you, so they wait a little longer and tip better
  c.patience *= 1.2;
  c.maxPatience = c.patience;
  c.budget = Math.round(c.budget * loyaltyTipMult(reg));
}

function modeTile(id, ico, name, desc, minLevel){
  const locked = S.level < minLevel;
  return el('button.mode-tile.' + id + (locked ? '.locked' : ''), {
    onclick: () => locked
      ? toast(t('lock.level', { n:minLevel }), 'warn', '🔒')
      : startMode(id),
  },
    el('span.m-ico', ico),
    el('b', name),
    el('small', locked ? t('mode.locked', { n:minLevel }) : desc),
  );
}

/* ══════════════ queue rendering ══════════════ */
function renderQueue(){
  const row = $('#queueRow');
  if (!row) return;
  row.innerHTML = '';
  for (const c of queue){
    const frac = clamp(c.patience / c.maxPatience, 0, 1);
    const card = el('div.cust-card' + (c.vip ? '.vip' : '') + (c.influencer ? '.influencer' : '')
                    + (c.entering ? '.entering' : ''), {
      onclick: () => { if ((c.walk ?? 1) >= 1) startOrder(c); },
    },
      el('div.cust-face', c.face),
      el('div.cust-name', c.name),
      // people who found the shop online say so — that is what fame looks like
      c.regularId ? el('div.cust-tag.regular', '💛 ' + t('reg.tag'))
        : c.influencer ? el('div.cust-tag.influencer', '🤳 ' + t('soc.influencer'))
        : c.fromSocial ? el('div.cust-tag', '📱 ' + t('soc.viaSocial')) : null,
      el('div.cust-pers', `${c.pers.emoji} ${tName('pers', c.pers.id, c.pers.name)}`),
      el('div.cust-want', c.order.line),
      el('div.bar.cust-patience' + (frac < .3 ? '.low' : frac < .6 ? '.mid' : ''),
        { dataset:{ cid:c.id } }, el('i', { style:{ width:(frac * 100) + '%' } })),
    );
    c.entering = false;
    row.append(card);
  }
  const cnt = $('#queueCount');
  if (cnt) cnt.textContent = t('shop.waiting', { n: queue.length });
  const sn = $('#satNum'); if (sn) sn.textContent = String(shopSatisfaction());
  const st = $('#streakNum'); if (st) st.textContent = String(S.streak);
}

function updatePatienceBars(){
  for (const c of queue){
    const bar = document.querySelector(`.cust-patience[data-cid="${c.id}"]`);
    if (!bar) continue;
    const frac = clamp(c.patience / c.maxPatience, 0, 1);
    bar.firstChild.style.width = (frac * 100) + '%';
    bar.classList.toggle('low', frac < .3);
    bar.classList.toggle('mid', frac >= .3 && frac < .6);
  }
}

/* ══════════════ starting an order ══════════════ */
/**
 * @param opt.delivery  the delivery job this order belongs to, if any
 * @param opt.deal      the brand deal this order belongs to, if any
 */
export function startOrder(customer, opt = {}){
  sfx('door'); haptic(12);
  mounted = false;
  cancelAnimationFrame(shopRaf);
  const job = opt.delivery || null;
  const deal = opt.deal || null;
  const wish = opt.wish || null;
  openStudio({
    customer,
    onServe: res => finishOrder(res, customer, job, deal, wish),
    onQuit: () => { go(job ? 'delivery' : (deal || wish) ? 'social' : 'shop'); },
  });
}

/** A sponsor's order: same studio, paid by the brand instead of a customer. */
export function startBrandDeal(deal){
  const c = makeCustomer({ difficulty: deal.difficulty, forceCandy: deal.candy });
  c.order = makeOrder({ difficulty: deal.difficulty, forceCandy: deal.candy });
  c.order.line = describeOrder(c.order);
  c.order.checklist = orderChecklist(c.order);
  c.face = deal.emoji;
  c.name = t('brand.' + deal.brand);
  c.brandDeal = true;
  // the sponsor is not a passer-by who saw the shop online
  c.fromSocial = false;
  c.influencer = false;
  // a sponsor shoot is not a queue — take the time it needs
  c.patience *= 1.6;
  c.maxPatience = c.patience;
  startOrder(c, { deal });
}

/** A follower asked for something in the comments — make it for them. */
export function startFollowerWish(wish){
  const c = makeCustomer({ difficulty: .4, forceCandy: wish.candy });
  c.order = makeOrder({
    difficulty: .4, forceCandy: wish.candy,
    forceColor: wish.color, forceDecos: wish.deco ? [wish.deco] : null,
    plain: true,
  });
  c.order.line = describeOrder(c.order);
  c.order.checklist = orderChecklist(c.order);
  c.face = wish.face;
  c.name = wish.name;
  c.followerWish = true;
  c.fromSocial = true;
  c.influencer = false;
  c.patience *= 1.5;
  c.maxPatience = c.patience;
  startOrder(c, { wish });
}

/* Order text is generated, not translated at render time — so when the
   player switches language we rebuild every waiting customer's request. */
onLangChange(() => {
  for (const c of queue){
    c.order.line = describeOrder(c.order);
    c.order.checklist = orderChecklist(c.order);
    c.greeting = pick(tLines(c.pers.id, 'greet', c.pers.greet));
  }
  renderQueue();
});

/** The Play tab: jump straight to the customer who has waited longest. */
export function playNext(){
  fillQueue();
  if (!queue.length){ go('shop'); return; }
  const next = [...queue].sort((a, b) => (a.patience / a.maxPatience) - (b.patience / b.maxPatience))[0];
  startOrder(next);
}

function startDailySpecial(){
  if (dailySpecialDone === todayKey()) return;
  const c = makeDailySpecial();
  c.isDailySpecial = true;
  startOrder(c);
}

function startMode(id){
  if (id === 'free'){
    mounted = false;
    cancelAnimationFrame(shopRaf);
    openStudio({ onQuit: () => go('shop') });
    return;
  }
  mode = { id, served:0, stars:0, coins:0, startedAt:Date.now() };
  const conf = {
    endless:   { label:t('mode.endlessTitle'),   timeScale:1.4, difficulty:null },
    speed:     { label:t('mode.speedTitle'),     timeScale:.45, difficulty:null },
    challenge: { label:t('mode.challengeTitle'), timeScale:1.0, difficulty:1 },
  }[id];
  mode.conf = conf;
  openModal({
    icon: id === 'endless' ? '♾️' : id === 'speed' ? '⚡' : '🎯',
    title: conf.label,
    sub: id === 'endless' ? t('mode.endlessBlurb')
       : id === 'speed'   ? t('mode.speedBlurb')
       : t('mode.challengeBlurb'),
    actions:[
      { label:t('mode.notNow'), cls:'ghost', onClick: () => { mode = null; } },
      { label:t('mode.start'), cls:'mint', onClick: nextModeCustomer },
    ],
  });
}

function nextModeCustomer(){
  const c = makeCustomer({
    difficulty: mode.conf.difficulty ?? undefined,
    timeScale: mode.conf.timeScale,
    vip: mode.id === 'challenge' && Math.random() < .35,
  });
  c.modeRun = mode.id;
  startOrder(c);
}

/* ══════════════ result ══════════════ */
function finishOrder(res, customer, job = null, deal = null, wish = null){
  closeStudio();
  const order = customer.order;
  const result = grade(res.design, order, { timeLeft: res.timeLeft, timeTotal: res.timeTotal });

  if (res.walkedOut) result.stars = 1;

  const perfect = result.perfect && result.stars === 5;
  pushStreak(perfect);
  const pay = payout(res.design, order, result, customer);

  // A follower's wish is a thank-you, not a sale.
  if (wish){
    seasonPoints(SEASON_POINTS.wish);
    duck(900);
    import('./socialScreen.js').then(({ finishFollowerWish }) => {
      finishFollowerWish(wish, result.stars, res.design, () => go('social'));
    });
    save();
    return;
  }

  // A brand deal is paid by the sponsor, not out of the till.
  if (deal){
    seasonPoints(SEASON_POINTS.brandDeal);
    duck(900);
    import('./socialScreen.js').then(({ finishBrandDeal }) => {
      finishBrandDeal(deal, result.stars, res.design, () => go('social'));
    });
    save();
    return;
  }

  // A delivery is not paid at the counter — the courier carries the money
  // home with them, so the parcel banks it when it arrives.
  if (job){
    nudgeSatisfaction(satisfactionDelta(result.stars));
    queue = queue.filter(c => c.id !== customer.id);
    duck(900);
    import('./deliveryScreen.js').then(({ finishDelivery }) => {
      finishDelivery(job, pay, result.stars, res.design, () => go('delivery'));
    });
    save();
    return;
  }

  // ── bank it ──
  addCoins(pay.total);
  if (pay.gems) addGems(pay.gems);
  addXp(pay.xp);
  bump('orders');
  bump('served');
  bump('totalStars', result.stars);
  bump('tips', pay.tips);
  if (result.stars === 5) bump('fiveStars');
  if (perfect) bump('perfect');
  if (res.design.pack && res.design.pack !== 'none') bump('wrapped');
  bump('candy_' + res.design.candy);
  nudgeSatisfaction(satisfactionDelta(result.stars));

  // somebody who found the shop online tells the rest of their feed
  const newFans = followersFromCustomer(customer, result.stars);
  seasonPoints(scoreOrder(result.stars, perfect));

  // regulars: a visit recorded, or a stranger deciding to come back
  let regularNews = null;
  if (customer.regularId){
    const res = recordVisit(customer.regularId, result.stars);
    if (res?.gift) regularNews = { kind:'gift', reg: findRegular(customer.regularId), res };
  } else {
    const adopted = maybeAdopt(customer, result.stars);
    if (adopted) regularNews = { kind:'new', reg: adopted };
  }

  if (customer.isDailySpecial) dailySpecialDone = todayKey();
  if (mode){
    mode.served++; mode.stars += result.stars; mode.coins += pay.total;
  }

  // remove from queue
  queue = queue.filter(c => c.id !== customer.id);

  // ── celebrate ──
  duck(1200);
  if (result.stars >= 5) { sfx('perfect'); confetti(60); haptic([15, 40, 15, 40, 40]); }
  else if (result.stars >= 4) { sfx('star'); confetti(24); haptic(20); }
  else if (result.stars >= 3) { sfx('coin'); haptic(12); }
  else sfx('fail');

  showResult({ res, result, pay, customer, order, newFans, regularNews });
  save();
}

function showResult({ res, result, pay, customer, order, newFans = 0, regularNews = null }){
  const body = [];

  /* preview of what the player made */
  const prev = el('canvas', { width:360, height:360, style:{
    width:'150px', height:'150px', margin:'0 auto', display:'block',
    filter:'drop-shadow(0 8px 16px rgba(150,90,130,.28))',
  }});
  drawDesign(prev.getContext('2d'), 360, res.design, 0);
  body.push(prev);

  /* stars */
  const starRow = el('div.result-stars');
  for (let i = 0; i < 5; i++){
    starRow.append(el('span.s' + (i < result.stars ? '.on' : ''), {
      style:{ animationDelay: (i * .11) + 's' },
    }, '⭐'));
  }
  body.push(starRow);

  /* score breakdown */
  const rows = el('div.score-rows');
  for (const p of result.parts){
    if (p.weight < 6) continue;
    rows.append(el('div.score-row',
      el('span.lbl', p.label),
      el('div.bar' + (p.score > .95 ? '.mint' : p.score > .6 ? '.gold' : ''),
        el('i', { style:{ width:(p.score * 100) + '%' } })),
      el('span.val', Math.round(p.score * 100) + '%'),
    ));
  }
  body.push(rows);

  /* rewards */
  const rewards = el('div.reward-row');
  const add = (cls, ico, txt, delay) => rewards.append(
    el('div.reward' + (cls ? '.' + cls : ''), { style:{ animationDelay: delay + 's' } }, ico, ' ', txt));
  add('', '🪙', '+' + fmt(pay.coins), .1);
  if (pay.tips > 0) add('', '💰', '+' + fmt(pay.tips) + ' ' + t('res.tip'), .2);
  if (pay.combo > 0) add('', '🔥', '+' + fmt(pay.combo), .3);
  if (pay.gems > 0) add('gem', '💎', '+' + pay.gems, .4);
  if (newFans > 0) add('gem', '👥', '+' + fmt(newFans), .45);
  add('xp', '⭐', '+' + pay.xp + ' XP', .5);
  body.push(rewards);

  if (newFans > 0){
    body.push(el('p.tiny.center', { style:{ marginTop:'6px', fontWeight:'800', color:'var(--grape-500)' } },
      customer.influencer ? t('soc.postedAbout', { name: customer.name })
                          : t('soc.toldFriends')));
  }

  if (pay.comboMult > 1){
    body.push(el('div.combo-banner', t('res.combo', { n:S.streak, p:Math.round((pay.comboMult - 1) * 100) })));
  }

  /* customer reaction */
  const line = res.walkedOut
    ? t('res.walkedLine')
    : reactionLine(customer, result.stars);
  body.push(el('div.quote', `${customer.face} "${line}"`));

  const actions = [
    { label:t('res.save'), cls:'ghost', onClick: () => {
      import('../core/state.js').then(({ savePhoto }) => {
        savePhoto(res.design, { stars: result.stars, customer: customer.name });
        toast(t('studio.savedPhoto'), 'good', '📸');
      });
      return false;
    }, close:false },
  ];

  // an employee may have got up to something while you were serving
  const incident = maybeStaffEvent();
  const withIncident = next => () => {
    const afterRegular = () => {
      if (incident) setTimeout(() => showPendingStaffEvent(next), 260);
      else next();
    };
    if (regularNews){
      import('./shopLifeScreen.js').then(m => {
        if (regularNews.kind === 'new') m.celebrateNewRegular(regularNews.reg);
        else m.celebrateLoyalty(regularNews.reg, regularNews.res);
        setTimeout(afterRegular, 260);
      });
    } else afterRegular();
  };

  if (mode){
    actions.push({ label:t('mode.next'), cls:'mint', onClick: withIncident(nextModeCustomer) });
    actions.push({ label:t('mode.end'), cls:'ghost', onClick: withIncident(endModeRun) });
  } else {
    actions.push({ label:t('res.next'), cls:'mint', onClick: withIncident(() => go('shop')) });
  }

  openModal({
    icon: res.walkedOut ? '💨' : result.stars === 5 ? '🏆' : '🧾',
    title: res.walkedOut ? t('res.walkedOut') : result.stars === 5 ? t('res.perfect') : t('res.served'),
    sub: `${customer.name} • ${tName('candy', order.candy, getCandy(order.candy).name)}`,
    body,
    dismissable:false,
    actions,
  });

  // coins flying into the wallet
  setTimeout(() => {
    coinFly(window.innerWidth / 2, window.innerHeight * .55, Math.min(12, 4 + result.stars * 2));
    bumpPill('#hudCoins');
  }, 380);

  checkMissions();
}

function endModeRun(){
  const m = mode;
  mode = null;
  if (!m || !m.served){ go('shop'); return; }
  const avg = (m.stars / m.served).toFixed(1);
  const key = m.id === 'speed' ? 'speed' : m.id === 'challenge' ? 'challenge' : 'endless';
  const isRecord = m.served > (S.records[key] || 0);
  if (isRecord){ S.records[key] = m.served; save(); }

  openModal({
    icon: isRecord ? '🏅' : '🏁',
    title: isRecord ? t('mode.record') : t('mode.finished'),
    sub: `${m.conf.label}`,
    body: el('div.stat-grid',
      stat(String(m.served), t('stat.served')),
      stat(avg + '★', t('stat.avg')),
      stat(fmt(m.coins), t('stat.coins')),
    ),
    actions:[{ label:t('mode.back'), cls:'mint', onClick: () => go('shop') }],
  });
  if (isRecord) confetti(50);
}
