/* ============================================================
   Missions — daily goals + career milestones
   ============================================================ */

import { el, $, fmt, clamp, todayKey, pickN } from '../core/utils.js';
import { S, statValue, addCoins, addGems, save, rolloverDaily } from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti, coinFly, bumpPill } from '../core/fx.js';
import { DAILY_POOL, CAREER, MISSION_BY_ID } from '../data/missions.js';
import { go, subHeader } from './nav.js';
import { t, tName } from '../core/i18n.js';

/** Roll three fresh daily missions when the date changes. */
export function ensureDailyMissions(){
  const t = rolloverDaily();
  if (S.missions.date !== t || !S.missions.daily?.length){
    S.missions.date = t;
    S.missions.daily = pickN(DAILY_POOL, 3).map(m => m.id);
    S.missions.claimed = [];
    save();
  }
}

export function missionProgress(m, scope){
  const val = statValue(m.stat, scope);
  return { val, goal: m.goal, done: val >= m.goal, frac: clamp(val / m.goal, 0, 1) };
}

const isClaimed = (id, career) =>
  (career ? S.missions.careerClaimed : S.missions.claimed).includes(id);

/** How many missions are ready to claim — drives the tab badge. */
export function claimableCount(){
  ensureDailyMissions();
  let n = 0;
  for (const id of S.missions.daily){
    const m = MISSION_BY_ID[id];
    if (m && missionProgress(m, 'daily').done && !isClaimed(id, false)) n++;
  }
  for (const m of CAREER){
    if (missionProgress(m, 'life').done && !isClaimed(m.id, true)) n++;
  }
  return n;
}

let lastNotified = new Set();
/** Called after every order — pops a toast the moment something completes. */
export function checkMissions(){
  ensureDailyMissions();
  for (const id of S.missions.daily){
    const m = MISSION_BY_ID[id];
    if (!m || isClaimed(id, false) || lastNotified.has(id)) continue;
    if (missionProgress(m, 'daily').done){
      lastNotified.add(id);
      toast(t('mis.complete', { text: tName('mission', m.id, m.text) }), 'good', m.emoji);
      sfx('sparkle');
    }
  }
  for (const m of CAREER){
    if (isClaimed(m.id, true) || lastNotified.has(m.id)) continue;
    if (missionProgress(m, 'life').done){
      lastNotified.add(m.id);
      toast(t('mis.milestone', { text: tName('mission', m.id, m.text) }), 'good', '🏆');
      sfx('sparkle');
    }
  }
  emitBadge();
}

function emitBadge(){
  const tab = document.querySelector('#tabbar .tab[data-screen="more"]');
  if (!tab) return;
  const n = claimableCount();
  let dot = tab.querySelector('.dot');
  if (n > 0 && !dot) tab.append(el('span.dot'));
  else if (!n && dot) dot.remove();
}
export { emitBadge as refreshMissionBadge };

function claim(m, career){
  const list = career ? S.missions.careerClaimed : S.missions.claimed;
  if (list.includes(m.id)) return;
  if (!missionProgress(m, career ? 'life' : 'daily').done) return;
  list.push(m.id);
  addCoins(m.coins);
  if (m.gems) addGems(m.gems);
  save();
  sfx('coin'); haptic([10, 25, 10]);
  confetti(24);
  coinFly(window.innerWidth / 2, window.innerHeight * .45, 8);
  bumpPill('#hudCoins');
  toast(t('mis.reward', { coins: fmt(m.coins), gems: m.gems ? ` +${m.gems} 💎` : '' }), 'good', '🎉');
  go('missions');
}

/* ══════════════ screen ══════════════ */
export function mountMissions(host){
  ensureDailyMissions();
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('mis.title'), '🏆'));

  /* daily */
  const dailyCard = el('div.card',
    el('div.card-title', el('span.ico', '📅'), t('mis.today'), el('span.spacer'),
      el('span.sub', t('mis.resets'))));
  for (const id of S.missions.daily){
    const m = MISSION_BY_ID[id];
    if (!m) continue;
    dailyCard.append(missionRow(m, false));
  }
  wrap.append(dailyCard);

  /* career */
  const careerCard = el('div.card',
    el('div.card-title', el('span.ico', '🎖️'), t('mis.career')));
  const sorted = [...CAREER].sort((a, b) => {
    const A = missionProgress(a, 'life'), B = missionProgress(b, 'life');
    const ac = isClaimed(a.id, true) ? 2 : A.done ? 0 : 1;
    const bc = isClaimed(b.id, true) ? 2 : B.done ? 0 : 1;
    return ac - bc || B.frac - A.frac;
  });
  for (const m of sorted) careerCard.append(missionRow(m, true));
  wrap.append(careerCard);

  host.append(wrap);
  emitBadge();
}

function missionRow(m, career){
  const p = missionProgress(m, career ? 'life' : 'daily');
  const claimed = isClaimed(m.id, career);
  const row = el('div.mission' + (p.done ? '.done' : ''),
    el('div.mission-ico', m.emoji),
    el('div.mission-info',
      el('b', tName('mission', m.id, m.text)),
      el('div.bar' + (p.done ? '.mint' : ''), el('i', { style:{ width:(p.frac * 100) + '%' } })),
      el('small', `${fmt(Math.min(p.val, p.goal))} / ${fmt(p.goal)}`
        + `  ·  🪙 ${fmt(m.coins)}${m.gems ? ` 💎 ${m.gems}` : ''}`),
    ),
    claimed
      ? el('div.mission-claim.got', '✓')
      : p.done
        ? el('button.mission-claim', { onclick: () => claim(m, career) }, t('mis.claim'))
        : el('div.mission-claim.wait', `${Math.round(p.frac * 100)}%`),
  );
  return row;
}
