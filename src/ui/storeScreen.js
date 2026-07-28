/* ============================================================
   Store — decorations, packaging, shop upgrades and locations.
   ============================================================ */

import { el, $, $$, fmt } from '../core/utils.js';
import {
  S, spend, canAfford, grantDeco, grantPack, ownsDeco, ownsPack,
  upgLevel, setUpgLevel, save, markFresh,
} from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti, bumpPill } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { drawDecoThumb, drawPackThumb } from '../render/candy.js';
import { DECORATIONS, DECO_CATS, PACKAGING, getDeco } from '../data/decorations.js';
import { RARITY, RARITY_ORDER } from '../data/palette.js';
import { UPGRADES, MAX_UPG_LEVEL, LOCATIONS, getLocation } from '../data/upgrades.js';
import { activeEvent, eventRunning } from '../data/events.js';
import { go, subHeader } from './nav.js';
import { t, tName, tDesc } from '../core/i18n.js';

let storeTab = 'deco';
let decoFilter = 'all';
let thumbTimers = [];

export function mountStore(host){
  const wrap = el('div.screen.enter');

  wrap.append(el('div.section-head', el('h2', t('store.title')), el('span.spacer'),
    el('span.tiny.muted', `🪙 ${fmt(S.coins)}  💎 ${S.gems}`)));

  const tabs = el('div.chipbar',
    ...[['deco',t('store.decorations')], ['pack',t('store.packaging')],
        ['upg',t('store.upgrades')], ['loc',t('store.locations')]]
      .map(([id, label]) => el('button.chip' + (storeTab === id ? '.on' : ''), {
        onclick: () => { sfx('swipe'); storeTab = id; go('store'); },
      }, label)),
  );
  wrap.append(tabs);

  const body = el('div', { id:'storeBody' });
  wrap.append(body);
  host.append(wrap);

  if (storeTab === 'deco') renderDecos(body);
  if (storeTab === 'pack') renderPacks(body);
  if (storeTab === 'upg')  renderUpgrades(body);
  if (storeTab === 'loc')  renderLocations(body);

  return () => { thumbTimers.forEach(clearInterval); thumbTimers = []; };
}

/* ══════════════ decorations ══════════════ */
function renderDecos(host){
  const ev = activeEvent();

  const filters = el('div.chipbar',
    ...[['all',t('store.all')], ...DECO_CATS.map(c => [c.id, `${c.emoji} ${tName('cat', c.id, c.name)}`]), ['owned',t('store.owned')]]
      .map(([id, label]) => el('button.chip' + (decoFilter === id ? '.on' : ''), {
        onclick: () => { sfx('swipe'); decoFilter = id; go('store'); },
      }, label)),
  );
  host.append(filters);

  if (ev){
    host.append(el('div.event-banner.shine', { style:{
      background:`linear-gradient(120deg,${ev.grad[0]},${ev.grad[1]})`, marginTop:'4px',
    }},
      el('h3', `${ev.emoji} ` + t('store.eventTitle', { name: tName('event', ev.id, ev.name) })),
      el('p', t('store.eventSub')),
    ));
  }

  // reward-only decorations are never for sale — they come from level-up grids
  // "Owned" is a shelf of everything she has, including out-of-season event
  // pieces and level rewards that are never for sale.
  let list = decoFilter === 'owned'
    ? DECORATIONS.filter(d => ownsDeco(d.id))
    : DECORATIONS.filter(d => !d.reward && (!d.event || eventRunning(d.event)));
  if (decoFilter !== 'owned' && decoFilter !== 'all'){
    list = list.filter(d => d.cat === decoFilter);
  }

  list.sort((a, b) => (a.unlock - b.unlock) || (RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)));

  if (!list.length){
    host.append(el('div.empty', el('span.big', '🫙'), t('store.empty')));
    return;
  }

  const grid = el('div.store-grid');
  for (const d of list) grid.append(decoCard(d));
  host.append(grid);
}

function decoCard(d){
  const owned = ownsDeco(d.id);
  const levelOk = S.level >= d.unlock;
  const cur = d.currency === 'gem' ? 'gem' : 'coin';
  const affordable = canAfford(d.price, cur);

  const card = el('div.store-item.rar-' + d.rarity);
  const art = el('div.si-art');
  const cv = el('canvas', { width:150, height:150 });
  art.append(cv);
  const c2 = cv.getContext('2d');
  drawDecoThumb(c2, 150, d.id, d.fixed || 'pink', 0);
  if (RARITY[d.rarity].animated){
    let time = 0;
    const iv = setInterval(() => {
      time += .09;
      if (!document.body.contains(cv)) { clearInterval(iv); return; }
      drawDecoThumb(c2, 150, d.id, d.fixed || 'pink', time);
    }, 90);
    thumbTimers.push(iv);
  }

  card.append(art,
    el('b', tName('deco', d.id, d.name)),
    el('div.si-rar', tName('rarity', d.rarity, RARITY[d.rarity].name)),
    el('div.si-desc', tDesc('deco', d.id, d.desc)),
  );

  if (owned){
    card.append(el('div.si-buy.owned', t('store.ownedTag')));
  } else if (!levelOk){
    card.append(el('div.si-lock', `🔒 ${t('stat.level')} ${d.unlock}`));
  } else {
    card.append(el('button.si-buy' + (cur === 'gem' ? '.gem' : '') + (affordable ? '' : '.cant'), {
      onclick: () => buyDeco(d),
    }, cur === 'gem' ? '💎' : '🪙', ' ', fmt(d.price)));
  }
  return card;
}

function buyDeco(d){
  const cur = d.currency === 'gem' ? 'gem' : 'coin';
  if (!canAfford(d.price, cur)){
    sfx('error');
    return toast(cur === 'gem' ? t('buy.noGems') : t('buy.noCoins'), 'bad', '💸');
  }
  confirmModal({
    icon:'🛒', title:t('buy.title', { name:tName('deco', d.id, d.name) }),
    sub:`${tName('rarity', d.rarity, RARITY[d.rarity].name)} · ${cur === 'gem' ? '💎' : '🪙'} ${fmt(d.price)}`,
    yes:t('buy.confirm'),
    onYes: () => {
      if (!spend(d.price, cur)) return;
      grantDeco(d.id);
      sfx('unlock'); haptic([12, 30, 12]);
      confetti(28);
      celebrateUnlock(d);
      go('store');
    },
  });
}

function celebrateUnlock(d){
  const art = el('div.unlock-art.rar-' + d.rarity);
  const cv = el('canvas', { width:200, height:200 });
  art.append(cv);
  drawDecoThumb(cv.getContext('2d'), 200, d.id, d.fixed || 'pink', 0);
  if (RARITY[d.rarity].animated){
    let time = 0;
    const iv = setInterval(() => {
      time += .09;
      if (!document.body.contains(cv)){ clearInterval(iv); return; }
      drawDecoThumb(cv.getContext('2d'), 200, d.id, d.fixed || 'pink', time);
    }, 90);
  }
  openModal({
    title:t('store.newDeco'),
    sub:`${tName('rarity', d.rarity, RARITY[d.rarity].name)} · ${tName('deco', d.id, d.name)}`,
    body:[art, el('p.center.tiny.muted', tDesc('deco', d.id, d.desc))],
    actions:[{ label:t('store.lovely'), cls:'mint' }],
  });
}

/* ══════════════ packaging ══════════════ */
function renderPacks(host){
  const grid = el('div.store-grid');
  for (const p of PACKAGING){
    if (p.id === 'none') continue;
    const owned = ownsPack(p.id);
    const levelOk = S.level >= p.unlock;
    const cur = p.currency === 'gem' ? 'gem' : 'coin';
    const card = el('div.store-item.rar-' + p.rarity);
    const art = el('div.si-art');
    const cv = el('canvas', { width:150, height:150 });
    art.append(cv);
    drawPackThumb(cv.getContext('2d'), 150, p.id, 'pink', 0);
    card.append(art, el('b', tName('pack', p.id, p.name)),
      el('div.si-rar', tName('rarity', p.rarity, RARITY[p.rarity].name)),
      el('div.si-desc', `${tDesc('pack', p.id, p.desc)} ${t('store.value', { n:Math.round(p.bonus * 100) })}`));
    if (owned) card.append(el('div.si-buy.owned', t('store.ownedTag')));
    else if (!levelOk) card.append(el('div.si-lock', `🔒 ${t('stat.level')} ${p.unlock}`));
    else card.append(el('button.si-buy' + (cur === 'gem' ? '.gem' : '') + (canAfford(p.price, cur) ? '' : '.cant'), {
      onclick: () => {
        if (!canAfford(p.price, cur)){ sfx('error'); return toast(t('buy.noFunds'), 'bad', '💸'); }
        confirmModal({
          icon:'🎁', title:t('buy.title', { name:tName('pack', p.id, p.name) }),
          sub:tDesc('pack', p.id, p.desc), yes:t('buy.confirm'),
          onYes: () => {
            if (!spend(p.price, cur)) return;
            grantPack(p.id); sfx('unlock'); confetti(24);
            toast(t('buy.unlocked', { name:tName('pack', p.id, p.name) }), 'good', '🎁');
            go('store');
          },
        });
      },
    }, cur === 'gem' ? '💎' : '🪙', ' ', fmt(p.price)));
    grid.append(card);
  }
  host.append(grid);
}

/* ══════════════ upgrades ══════════════ */
function renderUpgrades(host){
  host.append(el('p.tiny.muted.center', { style:{ margin:'0 0 10px' } },
    t('store.upgradeIntro')));

  for (const u of UPGRADES){
    const lv = upgLevel(u.id);
    const maxed = lv >= MAX_UPG_LEVEL;
    const cost = maxed ? 0 : u.cost[lv + 1];
    const affordable = canAfford(cost);

    const pips = el('div.upg-lv');
    for (let i = 0; i < MAX_UPG_LEVEL; i++) pips.append(el('i' + (i < lv ? '.on' : '')));

    host.append(el('div.upg-row',
      el('div.upg-ico', u.emoji),
      el('div.upg-info',
        el('b', `${tName('upgrade', u.id, u.name)} ${lv ? `· Lv ${lv}` : ''}`),
        el('small', tDesc('upgrade', u.id, u.desc)),
        el('small', { style:{ color:'var(--mint-500)', fontWeight:'800' } },
          lv ? u.label(lv) : t('store.notInstalled')),
        pips,
        // the Employee upgrade buys slots — the people go in the staff screen
        u.id === 'staff' && lv > 0
          ? el('button.btn.ghost.sm', { style:{ marginTop:'6px', minHeight:'30px', fontSize:'11.5px' },
              onclick: e => { e.stopPropagation(); go('staff'); } }, t('store.manageStaff'))
          : null,
      ),
      maxed
        ? el('div.upg-buy.max', t('store.max'))
        : el('button.upg-buy' + (affordable ? '' : '.cant'), {
            onclick: () => buyUpgrade(u, lv, cost),
          }, '🪙 ', fmt(cost)),
    ));
  }
}

function buyUpgrade(u, lv, cost){
  if (!canAfford(cost)){ sfx('error'); return toast(t('buy.noCoins'), 'bad', '💸'); }
  const uname = tName('upgrade', u.id, u.name);
  confirmModal({
    icon:u.emoji, title:t('store.upgradeTitle', { name:uname }),
    sub:t('store.upgradeSub', { a:lv, b:lv + 1, cost:fmt(cost) }),
    yes:t('store.upgradeYes'),
    onYes: () => {
      if (!spend(cost)) return;
      setUpgLevel(u.id, lv + 1);
      sfx('levelup'); haptic([10, 30, 10, 30]);
      confetti(30);
      toast(t('store.upgradeDone', { name:uname, n:lv + 1 }), 'good', u.emoji);
      go('store');
    },
  });
}

/* ══════════════ locations ══════════════ */
function renderLocations(host){
  for (const loc of LOCATIONS){
    const owned = S.locations.includes(loc.id);
    const active = S.location === loc.id;
    const levelOk = S.level >= loc.level;

    const card = el('div.loc-card' + (active ? '.active' : '') + (owned || levelOk ? '' : '.locked'),
      el('div.loc-art', { style:{
        background:`linear-gradient(160deg,${loc.sky[0]},${loc.sky[1]})`,
      }}, loc.emoji),
      el('div.grow',
        el('b', { style:{ fontSize:'14px', fontWeight:'800' } }, tName('location', loc.id, loc.name)),
        el('div.tiny.muted', tDesc('location', loc.id, loc.desc)),
        el('div.tiny', { style:{ color:'var(--pink-600)', fontWeight:'800', marginTop:'3px' } },
          t('store.payout', { n:loc.payMult.toFixed(2) })),
      ),
      owned
        ? (active
            ? el('div.upg-buy.max', t('store.here'))
            : el('button.upg-buy', { onclick: () => moveTo(loc) }, t('store.move')))
        : !levelOk
          ? el('div.si-lock', `🔒 Lv ${loc.level}`)
          : el('button.upg-buy' + (canAfford(loc.cost) ? '' : '.cant'), {
              onclick: () => buyLocation(loc),
            }, '🪙 ', fmt(loc.cost)),
    );
    host.append(card);
  }
}

function moveTo(loc){
  S.location = loc.id;
  save();
  sfx('whoosh');
  toast(t('store.moveDone', { name:tName('location', loc.id, loc.name) }), 'good', loc.emoji);
  go('store');
}

function buyLocation(loc){
  if (!canAfford(loc.cost)){ sfx('error'); return toast(t('buy.noCoins'), 'bad', '💸'); }
  confirmModal({
    icon:loc.emoji, title:t('store.openTitle', { name:tName('location', loc.id, loc.name) }),
    sub:`🪙 ${fmt(loc.cost)} · ×${loc.payMult.toFixed(2)}`,
    yes:t('store.openYes'),
    onYes: () => {
      if (!spend(loc.cost)) return;
      S.locations.push(loc.id);
      S.location = loc.id;
      save();
      sfx('levelup'); confetti(60);
      openModal({
        icon:loc.emoji, title:t('store.openedTitle'),
        sub:`${tName('location', loc.id, loc.name)} — ${tDesc('location', loc.id, loc.desc)}`,
        actions:[{ label:t('store.amazing'), cls:'mint', onClick: () => go('store') }],
      });
    },
  });
}
