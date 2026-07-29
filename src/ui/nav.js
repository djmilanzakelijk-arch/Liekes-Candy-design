/* ============================================================
   Screen router + tab bar wiring
   ============================================================ */

import { el, $, $$ } from '../core/utils.js';
import { sfx } from '../core/audio.js';

const screens = new Map();
let current = null, cleanup = null;
let history = [];

export function registerScreen(name, mount){ screens.set(name, mount); }

export function go(name, params = {}){
  const mount = screens.get(name);
  if (!mount){ console.warn('No such screen:', name); return; }

  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }

  const host = $('#screens');
  host.innerHTML = '';
  // leaving the studio behind, whichever route got us here
  document.body.classList.remove('studio-open');
  current = name;
  cleanup = mount(host, params) || null;

  // tab highlighting — sub-screens keep their parent tab lit
  const tabFor = { missions:'more', daily:'more', photos:'more', settings:'more',
                   leaderboard:'more', events:'more', staff:'more', delivery:'more', social:'more', season:'more', contest:'more', regulars:'more', recipes:'more', pet:'more',
                   locations:'store', upgrades:'store' }[name] || name;
  $$('#tabbar .tab').forEach(t => t.classList.toggle('active', t.dataset.screen === tabFor));

  if (history[history.length - 1] !== name) history.push(name);
  if (history.length > 20) history.shift();
}

export function back(){
  history.pop();
  const prev = history.pop() || 'shop';
  go(prev);
}

export const currentScreen = () => current;

export function initTabs(onPlay){
  $$('#tabbar .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sfx('tap');
      const target = tab.dataset.screen;
      if (target === 'play') onPlay();
      else go(target);
    });
  });
}

/** Standard sub-screen header with a back button. */
export function subHeader(title, emoji = '', onBack = back){
  return el('div.section-head',
    el('button.icon-btn', { onclick: () => { sfx('tap'); onBack(); } }, '←'),
    el('h2', emoji ? `${emoji} ${title}` : title),
  );
}
