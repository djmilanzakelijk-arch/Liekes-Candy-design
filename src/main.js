/* ============================================================
   Lieke's Candy Design — bootstrap
   ============================================================ */

import { el, $, $$, fmt, clamp, sleep } from './core/utils.js';
import { S, load, save, on, xpForLevel, syncUnlocks, seedLegacyStaff, getBootUnlocks } from './core/state.js';
import { unlock as unlockAudio, sfx, startMusic, setVolume, duck } from './core/audio.js';
import { toast, confetti, candyRain, bumpPill } from './core/fx.js';
import { openModal } from './ui/modal.js';
import { registerScreen, go, initTabs } from './ui/nav.js';
import { mountShop, playNext } from './ui/shopScreen.js';
import { mountStore } from './ui/storeScreen.js';
import { mountCollection } from './ui/collectionScreen.js';
import { mountMissions, ensureDailyMissions, refreshMissionBadge } from './ui/missions.js';
import {
  mountMore, mountDaily, mountPhotos, mountLeaderboard, mountEvents, mountSettings,
} from './ui/moreScreen.js';
import { mountStaff } from './ui/staffScreen.js';
import { mountDelivery } from './ui/deliveryScreen.js';
import { mountSocial } from './ui/socialScreen.js';
import { mountSeason } from './ui/seasonScreen.js';
import { mountContest, showContestResult } from './ui/contestScreen.js';
import { mountRegulars, mountRecipes } from './ui/shopLifeScreen.js';
import { mountPet } from './ui/petScreen.js';
import { mountDecor } from './ui/decorScreen.js';
import { settleContest } from './game/contest.js';
import { rolloverSeason, rewardLabel } from './game/seasonPass.js';
import { tickSocial } from './game/social.js';
import { showPayday } from './ui/financeUi.js';
import { openLevelReward, hasPendingLevelReward } from './ui/levelReward.js';
import { captureIncoming, hasIncoming } from './core/transfer.js';
import { handleIncomingTransfer } from './ui/transferUi.js';
import { milestonesForLevels } from './game/milestones.js';
import { accrue, catchUp, perHour, OFFLINE_CAP_HOURS } from './game/income.js';
import { getCandy } from './data/candies.js';
import { activeEvent } from './data/events.js';
import { t, tName, initLang, setLang, getLang, hasChosenLang, LANGS } from './core/i18n.js';

/* ══════════════ boot ══════════════ */
const bootTips = () => [t('boot.1'), t('boot.2'), t('boot.3'), t('boot.4'), t('boot.5')];

/** Set at boot when a Candy Pass season turned over while she was away. */
let seasonHandover = null;
/** Set at boot when last week's contest was settled. */
let contestResult = null;

async function boot(){
  const bar = $('#boot .boot-bar i');
  const tip = $('#boot .boot-tip');
  let p = 0;
  const step = async (to, label) => {
    if (label) tip.textContent = label;
    while (p < to){ p += 2; bar.style.width = p + '%'; await sleep(6); }
  };

  // a shop may have arrived in the URL from another address — take it out
  // of the address bar before anything else touches storage
  captureIncoming();

  initLang();
  document.documentElement.lang = getLang();
  localiseChrome();
  const TIPS = bootTips();

  await step(20, TIPS[0]);
  load();
  ensureDailyMissions();
  syncUnlocks();
  seedLegacyStaff();   // existing Employee upgrades become real, fireable staff
  tickSocial();        // likes kept landing while the game was closed
  seasonHandover = rolloverSeason();   // a season may have ended while away
  contestResult = settleContest();     // …and last week's contest judged

  await step(48, TIPS[1]);
  registerScreens();

  await step(72, TIPS[2]);
  setVolume(S.settings.volume ?? .65);
  wireHud();

  await step(92, TIPS[3]);
  initTabs(() => playNext());

  await step(100, TIPS[4]);
  await sleep(180);

  $('#boot').classList.add('gone');
  $('#app').hidden = false;
  go('shop');
  refreshMissionBadge();

  afterBoot();
}

function registerScreens(){
  registerScreen('shop', mountShop);
  registerScreen('store', mountStore);
  registerScreen('collection', mountCollection);
  registerScreen('missions', mountMissions);
  registerScreen('more', mountMore);
  registerScreen('daily', mountDaily);
  registerScreen('photos', mountPhotos);
  registerScreen('leaderboard', mountLeaderboard);
  registerScreen('events', mountEvents);
  registerScreen('settings', mountSettings);
  registerScreen('staff', mountStaff);
  registerScreen('delivery', mountDelivery);
  registerScreen('social', mountSocial);
  registerScreen('season', mountSeason);
  registerScreen('contest', mountContest);
  registerScreen('regulars', mountRegulars);
  registerScreen('recipes', mountRecipes);
  registerScreen('pet', mountPet);
  registerScreen('decor', mountDecor);
}

/* ══════════════ HUD ══════════════ */
function wireHud(){
  const render = () => {
    $('#hudLevel').textContent = String(S.level);
    $('#hudShopName').textContent = S.shopName;
    $('#hudCoins').querySelector('b').textContent = fmt(S.coins);
    $('#hudGems').querySelector('b').textContent = fmt(S.gems);
    const need = xpForLevel(S.level);
    $('#hudXpFill').style.width = clamp(S.xp / need * 100, 0, 100) + '%';
    $('#hudXpText').textContent = `${fmt(S.xp)} / ${fmt(need)}`;
  };
  on('state', render);
  render();

  // ── money coming in while you play ──
  // The employees and the display case earn by the hour. Rather than
  // pooling it somewhere to be collected, it lands in your coins as it
  // is earned, and the pill says so when it does.
  const tickIncome = () => {
    const got = accrue();
    if (got.coins > 0) showEarned(got.coins);
  };
  setInterval(tickIncome, 1000);
  // an app that was backgrounded gets its time back the moment it returns
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tickIncome();
  });

  $('#hudCoins').addEventListener('click', () => {
    sfx('coin');
    const rate = perHour();
    toast(rate > 0 ? t('toast.coinsRate', { n: fmt(rate) }) : t('toast.coins'), '', '🪙');
  });
  $('#hudGems').addEventListener('click', () => {
    sfx('gem');
    toast(t('toast.gems'), '', '💎');
  });
  $('#hudAvatar').addEventListener('click', () => go('more'));

  on('levelup', ({ level, unlocked, levels }) => {
    duck(1600);
    sfx('levelup');
    confetti(70);
    candyRain(3);
    const body = [];
    if (unlocked?.length){
      body.push(el('p.center.tiny.muted', { style:{ marginBottom:'8px' } }, t('lvl.newCandy')));
      const row = el('div.chipbar', { style:{ justifyContent:'center' } });
      for (const u of unlocked) row.append(el('div.chip.on', `${u.emoji} ${tName('candy', u.id, u.name)}`));
      body.push(row);
    }
    // Features are gated in a dozen modules and used to open silently, so
    // a tab just stopped being grey and nobody noticed. Say it out loud.
    const opened = milestonesForLevels(levels || [level]);
    let jumpTo = null;
    if (opened.length){
      body.push(el('p.center.tiny.muted', { style:{ margin:'12px 0 8px' } }, t('lvl.opened')));
      for (const m of opened){
        if (!jumpTo && m.go) jumpTo = m.go;
        body.push(el('div.unlock-row',
          el('span.u-ico', m.emoji),
          el('span.u-txt',
            el('b', m.kind === 'location' ? tName('location', m.id, m.name) : t('ms.' + m.id)),
            el('small', m.kind === 'location' ? t('ms.location.sub') : t('ms.' + m.id + '.sub'))),
        ));
      }
    }
    // the reward grid always comes first; the jump happens once it is done
    const actions = [{ label:t('lvl.reward'), cls:'mint', onClick: () => {
      setTimeout(() => openLevelReward(), 240);
    }}];
    if (jumpTo) actions.push({ label:t('lvl.take'), cls:'gold', onClick: () => {
      setTimeout(() => openLevelReward(() => go(jumpTo)), 240);
    }});
    openModal({
      icon:'🎊', title:t('lvl.title', { n:level }),
      sub:t('lvl.sub'),
      body,
      dismissable:false,
      actions,
    });
  });
}

/**
 * A coin count that just went up, said out loud next to the pill.
 * Batched: several ticks inside a couple of seconds show as one figure,
 * so a well-staffed shop does not machine-gun little numbers.
 */
let earnedPending = 0, earnedTimer = 0;
function showEarned(n){
  earnedPending += n;
  bumpPill('#hudCoins');
  if (earnedTimer) return;
  earnedTimer = setTimeout(() => {
    const amount = earnedPending;
    earnedPending = 0; earnedTimer = 0;
    const pill = $('#hudCoins');
    if (!pill || !amount) return;
    const r = pill.getBoundingClientRect();
    const fly = el('div.coin-tick', '+' + fmt(amount));
    fly.style.left = (r.left + r.width / 2) + 'px';
    fly.style.top  = (r.bottom - 4) + 'px';
    document.body.append(fly);
    setTimeout(() => fly.remove(), 1400);
  }, 1600);
}

/** "While you were away" — the shop kept earning, here is from what. */
function showIdleReport(idle, done){
  const rows = el('div', { style:{ marginTop:'10px' } });
  for (const src of idle.per){
    rows.append(el('div.unlock-row',
      el('span.u-ico', src.emoji),
      el('span.u-txt',
        el('b', t('idle.src.' + src.id)),
        el('small', src.perHour > 0 ? t('idle.perHour', { n: fmt(src.perHour) }) : t('idle.leftover'))),
      el('span', { style:{ marginLeft:'auto', fontWeight:'900', color:'#c98f14', fontSize:'13px' } },
        '🪙 +' + fmt(src.coins)),
    ));
  }

  openModal({
    icon:'🧑‍🍳',
    title: t('idle.title'),
    sub: t('idle.away', { n: awayLabel(idle.hours) }),
    body: [
      el('p.center', { style:{ fontSize:'26px', fontWeight:'900', color:'#c98f14' } },
        `🪙 +${fmt(idle.coins)}`),
      rows,
      idle.capped
        ? el('p.tiny.muted.center', { style:{ marginTop:'9px', lineHeight:'1.45' } },
            t('idle.capped', { n: OFFLINE_CAP_HOURS }))
        : null,
    ],
    actions:[{ label:t('idle.collect'), cls:'gold', onClick: () => {
      sfx('coin'); bumpPill('#hudCoins'); done();
    }}],
  });
}

function awayLabel(hours){
  if (hours < 1) return t('idle.mins', { n: Math.max(1, Math.round(hours * 60)) });
  const h = Math.floor(hours), m = Math.round((hours - h) * 60);
  return m ? t('idle.hoursMins', { h, m }) : t('idle.hours', { h });
}

/* ══════════════ first run + returning ══════════════ */
function afterBoot(){
  // audio needs a gesture on mobile
  const kick = () => {
    unlockAudio();
    document.removeEventListener('pointerdown', kick);
    document.removeEventListener('keydown', kick);
  };
  document.addEventListener('pointerdown', kick);
  document.addEventListener('keydown', kick);

  // idle earnings from the Employee upgrade, then the wage bill for the
  // days that passed — earnings first, so the till has a chance to cover it
  const idle = catchUp();
  // a first-time player has no team and no wages yet; a shop arriving from
  // a transfer link gets its payday on the next launch instead
  const payday = () => {
    if (!S.tutorialDone || hasIncoming()) return;
    showPayday();
  };
  const afterIdle = () => setTimeout(payday, 260);
  if (idle){
    setTimeout(() => showIdleReport(idle, afterIdle), 700);
  } else {
    setTimeout(payday, 1100);
  }

  // seasonal greeting
  const ev = activeEvent();
  if (ev){
    setTimeout(() => toast(t('ev.toast', { name: tName('event', ev.id, ev.name) }), 'good', ev.emoji), 1400);
  }

  // last week's contest was judged while she was away
  if (contestResult && S.tutorialDone && !hasIncoming()){
    setTimeout(() => showContestResult(contestResult), 2100);
  }

  // a Candy Pass season ended while she was away: everything she reached
  // but never collected was already handed over — show what arrived
  if (seasonHandover && S.tutorialDone && !hasIncoming()){
    setTimeout(() => showSeasonHandover(seasonHandover), 1500);
  }

  // an update added candy this player already qualifies for — say so,
  // otherwise it just quietly appears at the end of a long tray
  const fresh = getBootUnlocks();
  if (fresh.length && S.tutorialDone && !hasIncoming()){
    setTimeout(() => showWhatsNew(fresh), 800);
  }

  if (hasIncoming()){
    setTimeout(() => { handleIncomingTransfer(); }, 400);
  } else if (!S.tutorialDone){
    setTimeout(() => hasChosenLang() ? showTutorial() : askLanguage(), 500);
  } else if (hasPendingLevelReward()){
    // a reward grid was left unopened last session — give it back
    setTimeout(() => openLevelReward(), 900);
  }

  // save on the way out
  window.addEventListener('pagehide', () => save(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });
}

/**
 * A season turned over. Anything she reached but never collected has
 * already been added to her shop — this is the receipt, not an offer.
 */
function showSeasonHandover({ rewards }){
  sfx('unlock');
  const body = [];
  if (rewards.length){
    confetti(50);
    const row = el('div.chipbar', { style:{ justifyContent:'center', flexWrap:'wrap' } });
    for (const r of rewards){
      const l = rewardLabel(r, t, tName);
      row.append(el('div.chip.on', `${l.icon} ${l.text}`));
    }
    body.push(el('p.center.tiny.muted', { style:{ marginBottom:'8px' } }, t('pass.handoverBody')));
    body.push(row);
  } else {
    body.push(el('p.center.tiny.muted', t('pass.handoverEmpty')));
  }
  openModal({
    icon:'🗓️', title:t('pass.handoverTitle'), sub:t('pass.handoverSub'),
    body,
    actions:[{ label:t('pass.handoverGo'), cls:'grape', onClick: () => go('season') }],
  });
}

/** "The update brought you these" — shown once per content revision. */
function showWhatsNew(gains){
  const row = el('div.chipbar', { style:{ justifyContent:'center', flexWrap:'wrap' } });
  for (const g of gains){
    row.append(el('div.chip.on', `${g.emoji} ${tName('candy', g.id, g.name)}`));
  }
  sfx('unlock');
  confetti(40);
  openModal({
    icon:'🎁',
    title: t('new.title'),
    sub: t('new.sub', { n: gains.length }),
    body: [row, el('p.center.tiny.muted', { style:{ marginTop:'10px' } }, t('new.where'))],
    actions:[{ label:t('new.ok'), cls:'mint' }],
  });
}

/** Static chrome outside the screen system: tab labels, boot logo. */
function localiseChrome(){
  const labels = {
    shop:'tab.shop', store:'tab.store', play:'tab.play',
    collection:'tab.book', more:'tab.more',
  };
  for (const [screen, key] of Object.entries(labels)){
    const node = document.querySelector(`#tabbar .tab[data-screen="${screen}"] .tab-label`);
    if (node) node.textContent = t(key);
  }
}

/** First launch: let the player confirm the language we guessed. */
function askLanguage(){
  const row = el('div', { style:{ display:'flex', flexDirection:'column', gap:'9px' } });
  const close = openModal({
    icon:'🌍', title:t('lang.title'), sub:t('lang.sub'),
    dismissable:false,
    body: row,
  });
  for (const l of LANGS){
    row.append(el('button.btn' + (getLang() === l.id ? '' : '.ghost') + '.lg.block', {
      onclick: () => {
        setLang(l.id);
        sfx('unlock');
        close(true);                       // proper close: keeps the overlay state sane
        localiseChrome();
        go('shop');
        setTimeout(showTutorial, 300);
      },
    }, `${l.flag}  ${l.name}`));
  }
}

function showTutorial(){
  const steps = [
    { icon:'🍬', title:t('tut.1.t'), text:t('tut.1.b') },
    { icon:'👥', title:t('tut.2.t'), text:t('tut.2.b') },
    { icon:'🎨', title:t('tut.3.t'), text:t('tut.3.b') },
    { icon:'⭐', title:t('tut.4.t'), text:t('tut.4.b') },
    { icon:'🛒', title:t('tut.5.t'), text:t('tut.5.b') },
  ];
  let i = 0;
  const showStep = () => {
    const s = steps[i];
    openModal({
      icon:s.icon, title:s.title,
      body: el('p.center.tiny.muted', { style:{ fontSize:'13px', lineHeight:'1.5' } }, s.text),
      dismissable:false,
      actions:[
        i > 0 ? { label:t('tut.back'), cls:'ghost', onClick: () => { i--; setTimeout(showStep, 60); } } : null,
        { label: i === steps.length - 1 ? t('tut.go') : t('tut.next'), cls:'mint', onClick: () => {
          if (i === steps.length - 1){
            S.tutorialDone = true; save();
            sfx('unlock'); confetti(40);
          } else { i++; setTimeout(showStep, 60); }
        }},
      ].filter(Boolean),
    });
  };
  showStep();
}

/* ══════════════ service worker (offline play) ══════════════ */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load', async () => {
    try {
      // updateViaCache:'none' stops the browser serving sw.js itself from
      // the HTTP cache, which could otherwise pin a player to an old build
      // for a day — long enough to miss newly added candies entirely.
      const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache:'none' });

      // once a new worker takes over, reload so the page runs the new code
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        location.reload();
      });

      reg.update().catch(() => {});
      // and check again whenever the game comes back to the foreground
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) reg.update().catch(() => {});
      });
    } catch { /* offline or unsupported — the game still runs */ }
  });
}

/* ══════════════ go ══════════════ */
boot().catch(err => {
  console.error(err);
  const tip = $('#boot .boot-tip');
  if (tip) tip.textContent = t('boot.fail');
});
