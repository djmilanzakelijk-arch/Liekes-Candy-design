/* ============================================================
   "More" hub — daily rewards, photo mode, leaderboards, settings.
   ============================================================ */

import { el, $, $$, fmt, clamp, pickWeighted, randI, todayKey, rngFrom } from '../core/utils.js';
import {
  S, SAVE_KEY, addCoins, addGems, grantDeco, save, hardReset, dailyStatus, claimDaily,
  deletePhoto, shopSatisfaction, xpForLevel, staffSlots, lockSave,
} from '../core/state.js';
import { sfx, haptic, setVolume, setMusicEnabled } from '../core/audio.js';
import { toast, confetti, coinFly, candyRain, bumpPill } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { drawDesign } from '../render/candy.js';
import { DAILY_REWARDS, MYSTERY_LOOT, EVENTS, activeEvent, eventRunning } from '../data/events.js';
import { DECORATIONS, getDeco } from '../data/decorations.js';
import { RARITY } from '../data/palette.js';
import { getLocation, LOCATIONS } from '../data/upgrades.js';
import { claimableCount, refreshMissionBadge } from './missions.js';
import { go, subHeader } from './nav.js';
import { openStudio } from './studio.js';
import { t, tName, tDesc, LANGS, getLang, setLang } from '../core/i18n.js';
import { BUILD } from '../core/version.js';
import { openTransferSheet, maybeShowMoveBanner } from './transferUi.js';
import { encodeSave, decodeSave, downloadSaveFile, pickSaveFile } from '../core/transfer.js';

/* ══════════════ hub ══════════════ */
export function mountMore(host){
  const wrap = el('div.screen.enter');
  maybeShowMoveBanner(wrap);
  wrap.append(el('div.section-head', el('h2', t('more.title'))));

  const daily = dailyStatus();
  const missions = claimableCount();

  wrap.append(el('div.menu-grid',
    tile('🏆', t('more.missions'), t('more.missionsSub', { n: missions }), () => go('missions'), missions),
    tile('🎁', t('more.daily'), daily.available ? t('more.dailyClaim') : t('more.dailyStreak', { n: S.daily.streak }),
         () => go('daily'), daily.available ? 1 : 0),
    tile('🧑‍🍳', t('more.staff'), t('more.staffSub', { a: (S.staff?.roster || []).length, b: staffSlots() }),
         () => go('staff'), staffBadge()),
    tile('📸', t('more.photos'), t('more.photosSub', { n: S.photos.length }), () => go('photos')),
    tile('🏅', t('more.leaderboard'), t('more.leaderboardSub'), () => go('leaderboard')),
    tile('🎉', t('more.events'),
         activeEvent() ? tName('event', activeEvent().id, activeEvent().name) : t('more.eventsSub'),
         () => go('events')),
    tile('⚙️', t('more.settings'), t('more.settingsSub'), () => go('settings')),
  ));

  /* shop summary */
  const loc = getLocation(S.location);
  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '🏪'), S.shopName),
    el('div.stat-grid',
      el('div.stat', el('b', String(S.level)), el('span', t('stat.level'))),
      el('div.stat', el('b', loc.emoji), el('span', tName('location', loc.id, loc.name))),
      el('div.stat', el('b', shopSatisfaction() + '%'), el('span', t('stat.satisfaction'))),
    ),
    el('div.bar', { style:{ margin:'10px 0 4px' } },
      el('i', { style:{ width:(S.xp / xpForLevel(S.level) * 100) + '%' } })),
    el('p.tiny.muted.center', t('more.xpTo', { a:fmt(S.xp), b:fmt(xpForLevel(S.level)), n:S.level + 1 })),
    el('button.btn.ghost.block.sm', { style:{ marginTop:'10px' }, onclick: renameShop }, t('more.rename')),
  ));

  host.append(wrap);
  refreshMissionBadge();
}

/** A legendary applicant waiting in the wings earns a badge on the tile. */
function legendWaiting(){
  return (S.staff?.applicants || []).some(a => a.tier === 'legend' && a.expires > Date.now());
}

/** Badge count for the staff tile: pending incident + legendary applicant. */
function staffBadge(){
  return (S.staff?.pending ? 1 : 0) + (legendWaiting() ? 1 : 0);
}

function tile(ico, name, sub, onclick, badge = 0){
  const node = el('button.menu-tile', { onclick: () => { sfx('tap'); onclick(); } },
    el('span.mt-ico', ico), el('b', name), el('small', sub));
  if (badge > 0) node.append(el('span.badge', badge > 9 ? '9+' : String(badge)));
  return node;
}

function renameShop(){
  const input = el('input.text-field', { type:'text', maxlength:22, value:S.shopName });
  openModal({
    icon:'✏️', title:t('more.renameTitle'), body:input,
    actions:[
      { label:t('more.cancel'), cls:'ghost' },
      { label:t('more.save'), cls:'mint', onClick: () => {
        const v = input.value.trim();
        if (v){ S.shopName = v.slice(0, 22); save(); toast(t('more.renamed'), 'good', '🏪'); }
        go('more');
      }},
    ],
  });
  setTimeout(() => input.focus(), 120);
}

/* ══════════════ daily rewards ══════════════ */
export function mountDaily(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('daily.title'), '🎁'));

  const st = dailyStatus();
  const cycleDay = st.available ? st.day : ((S.daily.streak - 1) % 7) + 1;

  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '🔥'), t('daily.streak', { n:S.daily.streak }), el('span.spacer'),
      el('span.sub', st.available ? t('daily.ready') : t('daily.tomorrow'))),
    el('div.daily-grid',
      ...DAILY_REWARDS.map(r => {
        const claimed = st.available ? r.day < cycleDay : r.day <= cycleDay;
        const today = st.available && r.day === cycleDay;
        return el('div.daily-cell' + (claimed ? '.claimed' : '') + (today ? '.today' : ''),
          el('div.d-day', t('daily.day', { n:r.day })),
          el('span.d-ico', r.emoji),
          el('div.d-amt', r.kind === 'deco' ? t('daily.ribbon')
                        : r.kind === 'mystery' ? t('daily.mystery') : r.label),
        );
      }),
    ),
    st.available
      ? el('button.btn.gold.block', { style:{ marginTop:'12px' }, onclick: doClaimDaily },
          t('daily.claimBtn', { n:cycleDay }))
      : el('p.tiny.muted.center', { style:{ marginTop:'12px' } }, t('daily.claimed')),
  ));

  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '💡'), t('daily.keepTitle')),
    el('p.tiny.muted', t('daily.keepText')),
  ));

  host.append(wrap);
}

function doClaimDaily(){
  const claim = claimDaily();
  if (!claim) return;
  const reward = DAILY_REWARDS[claim.day - 1];
  let text = '', icon = reward.emoji;

  if (reward.kind === 'coins'){
    addCoins(reward.amount);
    text = t('daily.coins', { n: fmt(reward.amount) });
    coinFly(window.innerWidth / 2, window.innerHeight * .45, 10);
  } else if (reward.kind === 'gems'){
    addGems(reward.amount);
    text = t('daily.gems', { n: reward.amount });
  } else if (reward.kind === 'deco'){
    const got = grantRandomDeco('rare');
    text = got ? t('buy.unlocked', { name: tName('deco', got.id, got.name) })
               : t('daily.coins', { n: 600 });
    if (!got) addCoins(600);
    icon = got ? '🎀' : '🪙';
  } else {
    const loot = openMystery();
    text = loot.text; icon = loot.icon;
  }

  sfx('unlock'); haptic([12, 30, 12, 30]);
  confetti(50); candyRain(2.5);
  bumpPill('#hudCoins');

  openModal({
    icon, title:t('daily.rewardTitle', { n:claim.day }),
    sub:t('daily.rewardSub', { n:claim.streak }),
    body: el('p.center', { style:{ fontSize:'19px', fontWeight:'900', color:'var(--pink-600)' } }, text),
    actions:[{ label:t('daily.thanks'), cls:'mint', onClick: () => go('daily') }],
  });
}

/** Grant a random unowned decoration of at least the given rarity. */
function grantRandomDeco(minRarity = 'common'){
  const order = ['common','rare','epic','legendary','mythic'];
  const min = order.indexOf(minRarity);
  const ev = activeEvent();
  const pool = DECORATIONS.filter(d =>
    !S.owned.decos.includes(d.id) &&
    order.indexOf(d.rarity) >= min &&
    d.unlock <= S.level + 3 &&
    (!d.event || eventRunning(d.event)));
  if (!pool.length) return null;
  const d = pool[Math.floor(Math.random() * pool.length)];
  grantDeco(d.id);
  return d;
}

export function openMystery(){
  const loot = pickWeighted(MYSTERY_LOOT);
  if (loot.kind === 'coins'){
    const n = randI(loot.min, loot.max);
    addCoins(n);
    return { text:t('daily.coins', { n: fmt(n) }), icon:'🪙' };
  }
  if (loot.kind === 'gems'){
    const n = randI(loot.min, loot.max);
    addGems(n);
    return { text:t('daily.gems', { n }), icon:'💎' };
  }
  const d = grantRandomDeco(loot.rarity);
  if (d) return { text:`${tName('rarity', d.rarity, RARITY[d.rarity].name)}: ${tName('deco', d.id, d.name)}!`, icon:loot.emoji };
  addCoins(1200);
  return { text:t('daily.coins', { n: fmt(1200) }), icon:'🪙' };
}

/* ══════════════ photo mode ══════════════ */
let photoSel = 0, photoRaf = 0;

export function mountPhotos(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('photo.title'), '📸'));

  if (!S.photos.length){
    wrap.append(el('div.empty', el('span.big', '📷'),
      t('photo.empty'),
      el('br'),
      el('span.tiny', t('photo.emptyHint'))));
    wrap.append(el('button.btn.grape.block', { style:{ marginTop:'12px' },
      onclick: () => openStudio({ onQuit: () => go('photos') }) }, t('photo.openFree')));
    host.append(wrap);
    return;
  }

  photoSel = clamp(photoSel, 0, S.photos.length - 1);

  const frame = el('div.photo-frame');
  const cv = el('canvas', { width:900, height:900 });
  frame.append(cv);
  wrap.append(frame);

  const info = el('div.card', { id:'photoInfo' });
  wrap.append(info);

  const strip = el('div.photo-strip');
  S.photos.forEach((p, i) => {
    const th = el('div.photo-thumb' + (i === photoSel ? '.on' : ''), {
      onclick: () => { photoSel = i; sfx('tap'); go('photos'); },
    });
    const tc = el('canvas', { width:150, height:150 });
    th.append(tc);
    drawDesign(tc.getContext('2d'), 150, p.design, 0, { background:'#fff6fb' });
    strip.append(th);
  });
  wrap.append(strip);

  wrap.append(el('div.row', { style:{ gap:'8px', marginTop:'6px' } },
    el('button.btn.ghost.grow', { onclick: () => downloadPhoto(cv) }, t('photo.download')),
    el('button.btn.ghost.grow', { onclick: removePhoto }, t('photo.delete')),
  ));

  host.append(wrap);

  /* live-render the selected photo so animated decorations move */
  const c2 = cv.getContext('2d');
  const p = S.photos[photoSel];
  info.append(
    el('div.card-title', el('span.ico', '🍬'),
      p.customer ? t('photo.madeFor', { name: p.customer }) : t('photo.freeDesign'),
      el('span.spacer'),
      p.stars ? el('span.stars', ...Array.from({ length:5 }, (_, i) =>
        el('span.s' + (i < p.stars ? '.on' : ''), '⭐'))) : null),
    el('p.tiny.muted', new Date(p.ts).toLocaleString()),
  );

  const loop = (now) => {
    if (!document.body.contains(cv)) return;
    drawDesign(c2, 900, p.design, now / 1000, { background:'#fff6fb' });
    photoRaf = requestAnimationFrame(loop);
  };
  photoRaf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(photoRaf);
}

function downloadPhoto(cv){
  try {
    const a = document.createElement('a');
    a.download = `liekes-candy-${Date.now()}.png`;
    a.href = cv.toDataURL('image/png');
    a.click();
    sfx('sparkle');
    toast(t('photo.saved'), 'good', '⬇️');
  } catch {
    toast(t('photo.exportFail'), 'bad', '⚠️');
  }
}

function removePhoto(){
  const p = S.photos[photoSel];
  if (!p) return;
  confirmModal({
    icon:'🗑', title:t('photo.deleteTitle'), yes:t('photo.deleteYes'),
    onYes: () => { deletePhoto(p.id); photoSel = 0; sfx('remove'); go('photos'); },
  });
}

/* ══════════════ leaderboard ══════════════ */
const RIVAL_NAMES = ['Bonbon Bay','Sugar & Salt','Choco Atelier','Miss Marshmallow','Le Petit Praline',
                     'Gummy Grove','Velvet Vanilla','Caramel Club','Sprinkle Society','Cocoa Cabana'];

export function mountLeaderboard(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('lb.title'), '🏅'));

  wrap.append(board(t('lb.level'), 'level', S.level, '🏪'));
  wrap.append(board(t('lb.streak'), 'streak', S.bestStreak, '🔥'));
  wrap.append(board(t('lb.endless'), 'endless', S.records.endless || 0, '♾️'));

  wrap.append(el('p.tiny.muted.center', { style:{ marginTop:'8px' } }, t('lb.note')));

  host.append(wrap);
}

function board(title, key, myValue, emoji){
  // deterministic rivals so the table is stable between visits
  const rng = rngFrom('lb-' + key + '-' + todayKey());
  const rivals = RIVAL_NAMES.map(name => ({
    name,
    value: Math.max(1, Math.round(myValue * (0.45 + rng() * 1.5) + rng() * 6)),
    face: ['🧁','🍫','🍭','🍬','🍩','🎀','💎','🌸','⭐','🐻'][Math.floor(rng() * 10)],
  }));
  const me = { name: S.shopName, value: myValue, face:'👑', me:true };
  const rows = [...rivals, me].sort((a, b) => b.value - a.value).slice(0, 8);

  const card = el('div.card', el('div.card-title', el('span.ico', emoji), title));
  rows.forEach((r, i) => {
    card.append(el('div.lb-row' + (r.me ? '.me' : ''),
      el('div.lb-rank', i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1)),
      el('div.lb-face', r.face),
      el('div.lb-name', r.name),
      el('div.lb-val', fmt(r.value)),
    ));
  });
  return card;
}

/* ══════════════ events calendar ══════════════ */
export function mountEvents(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('ev.title'), '🎉'));

  const ev = activeEvent();
  if (ev){
    wrap.append(el('div.event-banner.shine', { style:{
      background:`linear-gradient(120deg,${ev.grad[0]},${ev.grad[1]})`,
    }},
      el('h3', `${ev.emoji} ` + t('ev.live', { name: tName('event', ev.id, ev.name) })),
      el('p', `${tDesc('event', ev.id, ev.blurb)}`),
      el('span.e-emoji', ev.emoji)));
  }

  for (const e of EVENTS){
    const live = ev?.id === e.id;
    const exclusives = DECORATIONS.filter(d => d.event === e.id);
    wrap.append(el('div.card', { style: live ? { borderColor:'var(--pink-300)' } : null },
      el('div.card-title', el('span.ico', e.emoji), tName('event', e.id, e.name), el('span.spacer'),
        el('span.sub', live ? t('ev.liveTag') : `${monthName(e.from[0])} ${e.from[1]} – ${monthName(e.to[0])} ${e.to[1]}`)),
      el('p.tiny.muted', tDesc('event', e.id, e.blurb)),
      el('p.tiny', { style:{ marginTop:'6px', fontWeight:'800', color:'var(--pink-600)' } },
        t('ev.bonus', { n:Math.round((e.payMult - 1) * 100), c:exclusives.length })),
      el('div.chipbar', { style:{ marginTop:'6px' } },
        ...exclusives.map(d => el('div.chip.rar-' + d.rarity, {
          style:{ color:'var(--rar-t)', borderColor:'var(--rar-b)' },
        }, `${S.owned.decos.includes(d.id) ? '✓ ' : ''}${tName('deco', d.id, d.name)}`))),
    ));
  }
  host.append(wrap);
}

const monthName = m => ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];

/* ══════════════ settings ══════════════ */
export function mountSettings(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('set.title'), '⚙️'));

  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '🌍'), t('set.language')),
    el('div.row', { style:{ gap:'8px' } },
      ...LANGS.map(l => el('button.btn' + (getLang() === l.id ? '' : '.ghost'), {
        style:{ flex:'1' },
        onclick: () => {
          if (getLang() === l.id) return;
          setLang(l.id);
          sfx('unlock');
          toast(t('toast.langChanged'), 'good', l.flag);
          go('settings');
        },
      }, `${l.flag} ${l.name}`))),
  ));

  const card = el('div.card');
  card.append(
    toggleRow('🎵', t('set.music'), 'music', v => setMusicEnabled(v)),
    toggleRow('🔊', t('set.sfx'), 'sfx'),
    toggleRow('📳', t('set.haptics'), 'haptics'),
    toggleRow('💡', t('set.hints'), 'hints'),
    el('div.set-row',
      el('span.s-ico', '🔉'),
      el('span.s-lbl', { style:{ flex:'0 0 auto' } }, t('set.volume')),
      volumeSlider(),
    ),
  );
  wrap.append(card);

  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '💾'), t('set.data')),
    el('p.tiny.muted', t('set.dataText')),
    el('div.row', { style:{ gap:'8px', marginTop:'10px' } },
      el('button.btn.ghost.sm.grow', { onclick: exportSave }, t('set.export')),
      el('button.btn.ghost.sm.grow', { onclick: importSave }, t('set.import')),
    ),
    el('button.btn.grape.sm.block', { style:{ marginTop:'8px' }, onclick: openTransferSheet },
      t('mv.button')),
    el('p.tiny.muted', { style:{ marginTop:'6px' } }, t('mv.buttonHint')),
    el('button.btn.sm.block', { style:{ marginTop:'8px',
      background:'linear-gradient(180deg,#ff9a9a,#e2504f)', boxShadow:'0 4px 0 #b93a39' },
      onclick: resetGame }, t('set.reset')),
  ));

  wrap.append(el('div.card',
    el('div.card-title', el('span.ico', '🍬'), "Lieke's Candy Design"),
    el('p.tiny.muted', t('set.aboutText')),
    el('p.tiny.muted', { style:{ marginTop:'6px' } }, t('set.tipText')),
    // makes "which version are you on?" answerable without guessing
    el('p.tiny.muted.center', { style:{ marginTop:'10px', opacity:'.7' } },
      t('set.build', { v: BUILD })),
  ));

  host.append(wrap);
}

function toggleRow(ico, label, key, onChange){
  const sw = el('div.switch' + (S.settings[key] ? '.on' : ''), el('i'));
  sw.addEventListener('click', () => {
    S.settings[key] = !S.settings[key];
    sw.classList.toggle('on', S.settings[key]);
    save();
    sfx('tap');
    onChange?.(S.settings[key]);
  });
  return el('div.set-row', el('span.s-ico', ico), el('span.s-lbl', label), sw);
}

function volumeSlider(){
  const input = el('input.slider', {
    type:'range', min:'0', max:'100', value:String(Math.round((S.settings.volume ?? .65) * 100)),
  });
  input.addEventListener('input', () => {
    S.settings.volume = input.value / 100;
    setVolume(S.settings.volume);
  });
  input.addEventListener('change', () => { save(); sfx('tap'); });
  return input;
}

async function exportSave(){
  let code;
  try { code = await encodeSave(S); }
  catch { toast(t('set.exportFail'), 'bad', '⚠️'); return; }

  // A plain (not readonly) textarea is the one thing every mobile browser
  // reliably lets you select and copy from.
  const ta = el('textarea', {
    spellcheck:'false', autocapitalize:'off', autocorrect:'off',
    style:{
      width:'100%', height:'120px', fontSize:'11px', borderRadius:'12px',
      border:'2px solid var(--line)', padding:'8px', fontFamily:'monospace',
      userSelect:'text', WebkitUserSelect:'text', touchAction:'auto',
      background:'var(--surface-2)', color:'var(--ink)', resize:'none',
    },
  });
  ta.value = code;

  openModal({
    icon:'⬆️', title:t('set.exportTitle'), sub:t('set.exportSub'),
    body:[ta, el('p.tiny.muted', { style:{ marginTop:'6px' } }, t('set.exportHint'))],
    actions:[
      { label:t('set.copy'), cls:'mint', onClick: () => { copyText(ta, code); return false; }, close:false },
      { label:t('set.saveFile'), cls:'ghost', onClick: () => {
          downloadSaveFile(S); toast(t('mv.fileSaved'), 'good', '💾'); return false;
        }, close:false },
      { label:t('set.done'), cls:'ghost' },
    ],
  });
}

/** Clipboard write with a selection-based fallback for older browsers. */
async function copyText(field, text){
  try {
    if (navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(text);
      sfx('sparkle');
      toast(t('set.copied'), 'good', '📋');
      return;
    }
  } catch { /* fall through */ }
  try {
    field.focus();
    field.setSelectionRange(0, text.length);
    if (document.execCommand('copy')){
      sfx('sparkle');
      toast(t('set.copied'), 'good', '📋');
      return;
    }
  } catch { /* fall through */ }
  field.focus();
  field.setSelectionRange(0, text.length);
  toast(t('set.copyManual'), 'warn', '📋');
}

function importSave(){
  const ta = el('textarea', {
    placeholder:t('set.importPlaceholder'),
    spellcheck:'false', autocapitalize:'off', autocorrect:'off',
    style:{
      width:'100%', height:'110px', fontSize:'11px', borderRadius:'12px',
      border:'2px solid var(--line)', padding:'8px', fontFamily:'monospace',
      userSelect:'text', WebkitUserSelect:'text', touchAction:'auto',
      background:'var(--surface-2)', color:'var(--ink)', resize:'none',
    },
  });

  const pasteBtn = el('button.btn.ghost.sm.block', { style:{ marginTop:'8px' }, onclick: async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text){ ta.value = text.trim(); sfx('tap'); toast(t('set.pasted'), 'good', '📋'); }
      else toast(t('set.clipEmpty'), 'warn', '📋');
    } catch {
      ta.focus();
      toast(t('set.pasteManual'), 'warn', '📋');
    }
  }}, t('set.paste'));

  // The dialog stays open on a bad code so the pasted text is not lost,
  // and closes itself the moment an import succeeds.
  const closeImport = openModal({
    icon:'⬇️', title:t('set.importTitle'), sub:t('set.importSub'),
    body:[
      ta,
      pasteBtn,
      el('p.tiny.muted', { style:{ marginTop:'8px' } }, t('set.importHint')),
      el('button.btn.ghost.sm.block', { style:{ marginTop:'6px' },
        onclick: () => loadSaveFromFile(() => closeImport(true)) }, t('mv.loadFile')),
    ],
    actions:[
      { label:t('more.cancel'), cls:'ghost' },
      { label:t('set.importBtn'),
        onClick: () => { runImport(ta.value, () => closeImport(true)); return false; },
        close:false },
    ],
  });
  setTimeout(() => ta.focus(), 120);
}

/** Accepts a bare code, a full transfer link, or an old-style export. */
async function runImport(raw, onSuccess){
  const text = String(raw || '').trim();
  if (!text){ toast(t('set.importEmpty'), 'warn', '⚠️'); return; }

  // people paste the whole link, so pull the payload out of it
  const fromLink = /[#?&]move=([^&\s]+)/.exec(text);
  const payload = fromLink ? fromLink[1] : text.replace(/\s+/g, '');

  let parsed;
  try { parsed = await decodeSave(payload); }
  catch { sfx('error'); toast(t('set.importBad'), 'bad', '⚠️'); return; }

  applyImported(parsed, onSuccess);
}

async function loadSaveFromFile(onSuccess){
  try {
    const parsed = await pickSaveFile();
    applyImported(parsed, onSuccess);
  } catch (e){
    if (e?.message !== 'cancelled') toast(t('mv.badFile'), 'bad', '⚠️');
  }
}

/** Write an imported save and restart, without the old state racing it back. */
function applyImported(parsed, onSuccess){
  const lang = parsed.__lang;
  delete parsed.__lang;
  try {
    if (lang) localStorage.setItem('liekes-candy-design/lang', lang);
    localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
  } catch {
    toast(t('set.importBad'), 'bad', '⚠️');
    return;
  }
  // critical: the reload fires pagehide, which would save the OLD state
  lockSave();
  onSuccess?.();
  sfx('unlock');
  confetti(40);
  openModal({
    icon:'✅', title:t('mv.doneTitle'),
    sub:t('set.importedSub', { n: parsed.level ?? 1 }),
    dismissable:false,
    actions:[{ label:t('mv.reload'), cls:'mint', onClick: () => location.reload() }],
  });
}


function resetGame(){
  confirmModal({
    icon:'⚠️', title:t('set.resetTitle'),
    sub:t('set.resetSub'),
    yes:t('set.resetYes'),
    onYes: () => {
      hardReset();
      toast(t('set.freshStart'), 'good', '🌱');
      location.reload();
    },
  });
}
