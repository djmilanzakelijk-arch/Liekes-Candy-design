/* ============================================================
   Lieke's Candy Design — bootstrap
   ============================================================ */

import { el, $, $$, fmt, clamp, sleep } from './core/utils.js';
import { S, load, save, on, xpForLevel, collectIdle, syncUnlocks, seedLegacyStaff } from './core/state.js';
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
import { openLevelReward, hasPendingLevelReward } from './ui/levelReward.js';
import { getCandy } from './data/candies.js';
import { activeEvent } from './data/events.js';
import { t, tName, initLang, setLang, getLang, hasChosenLang, LANGS } from './core/i18n.js';

/* ══════════════ boot ══════════════ */
const bootTips = () => [t('boot.1'), t('boot.2'), t('boot.3'), t('boot.4'), t('boot.5')];

async function boot(){
  const bar = $('#boot .boot-bar i');
  const tip = $('#boot .boot-tip');
  let p = 0;
  const step = async (to, label) => {
    if (label) tip.textContent = label;
    while (p < to){ p += 2; bar.style.width = p + '%'; await sleep(6); }
  };

  initLang();
  document.documentElement.lang = getLang();
  localiseChrome();
  const TIPS = bootTips();

  await step(20, TIPS[0]);
  load();
  ensureDailyMissions();
  syncUnlocks();
  seedLegacyStaff();   // existing Employee upgrades become real, fireable staff

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

  $('#hudCoins').addEventListener('click', () => {
    sfx('coin');
    toast(t('toast.coins'), '', '🪙');
  });
  $('#hudGems').addEventListener('click', () => {
    sfx('gem');
    toast(t('toast.gems'), '', '💎');
  });
  $('#hudAvatar').addEventListener('click', () => go('more'));

  on('levelup', ({ level, unlocked }) => {
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
    openModal({
      icon:'🎊', title:t('lvl.title', { n:level }),
      sub:t('lvl.sub'),
      body,
      dismissable:false,
      actions:[{ label:t('lvl.reward'), cls:'mint', onClick: () => {
        setTimeout(() => openLevelReward(), 240);
      }}],
    });
  });
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

  // idle earnings from the Employee upgrade
  const idle = collectIdle();
  if (idle > 0){
    setTimeout(() => {
      openModal({
        icon:'🧑‍🍳', title:t('idle.title'),
        sub:t('idle.sub'),
        body: el('p.center', { style:{ fontSize:'22px', fontWeight:'900', color:'#c98f14' } },
          `🪙 +${fmt(idle)}`),
        actions:[{ label:t('idle.collect'), cls:'gold', onClick: () => { sfx('coin'); bumpPill('#hudCoins'); } }],
      });
    }, 700);
  }

  // seasonal greeting
  const ev = activeEvent();
  if (ev){
    setTimeout(() => toast(t('ev.toast', { name: tName('event', ev.id, ev.name) }), 'good', ev.emoji), 1400);
  }

  if (!S.tutorialDone){
    setTimeout(() => hasChosenLang() ? showTutorial() : askLanguage(), 500);
  } else if (hasPendingLevelReward()){
    // a reward grid was left unopened last session — give it back
    setTimeout(() => openLevelReward(), 900);
  }

  // save on the way out
  window.addEventListener('pagehide', () => save(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });
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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

/* ══════════════ go ══════════════ */
boot().catch(err => {
  console.error(err);
  const tip = $('#boot .boot-tip');
  if (tip) tip.textContent = t('boot.fail');
});
