/* ============================================================
   The decorating studio — drag-and-drop candy design.
   ============================================================ */

import { el, $, $$, clamp, uid, rand, dist, TAU } from '../core/utils.js';
import { S, bonuses, ownsDeco, ownsPack, colorUnlocked, flavorUnlocked, bump, spend, grantDeco, grantPack } from '../core/state.js';
import { sfx, haptic, duck } from '../core/audio.js';
import { toast, sparkleBurst } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { drawDesign, drawItem, drawDecoThumb, drawPackThumb, drawCandyThumb, itemRadius, STUDIO_ZOOM } from '../render/candy.js';
import { CANDIES, getCandy } from '../data/candies.js';
import { DECORATIONS, DECO_CATS, getDeco, PACKAGING, getPack } from '../data/decorations.js';
import { COLORS, FLAVORS, getColor, COLOR_UNLOCK, RARITY } from '../data/palette.js';
import { activeEvent } from '../data/events.js';
import { TOOLS, FILLINGS, DUSTS, toolsForCandy, pruneTools, TOOL_BY_ID } from '../data/tools.js';
import { drawToolPreview } from '../render/tools.js';
import { t, tName, tDesc } from '../core/i18n.js';

/* ── module state ────────────────────────────────────── */
let root = null, canvas = null, ctx = null, stageEl = null;
let design = null, session = null;
let selected = null, activeTool = null, accent = 'pink';
let rafId = 0, lastT = 0, elapsed = 0;
let history = [];
let onDoneCb = null;
let tabId = 'candy';
let toolSel = 'fill';
let pipeColor = 'white';
let pipeWidth = 1;
let piping = null;      // the stroke currently being drawn
let selToolsEl = null;
let toolThumbs = [];

const DPR = () => Math.min(window.devicePixelRatio || 1, 2.5);

/* ══════════════════════════════════════════════════════
   Public entry
   ══════════════════════════════════════════════════════ */
export function openStudio(opts){
  const host = $('#screens');
  session = {
    customer: opts.customer || null,
    mode: opts.mode || 'story',
    timeLimit: opts.timeLimit ?? (opts.customer ? opts.customer.patience : null),
    freeplay: !opts.customer,
    onServe: opts.onServe,
    onQuit: opts.onQuit,
    expired: false,
  };
  onDoneCb = opts.onDone || null;
  elapsed = 0;
  history = [];
  selected = null;
  activeTool = null;
  tabId = 'candy';

  design = opts.design || {
    candy: session.customer ? starterCandyFor(session.customer) : S.owned.candies[0],
    color: 'pink',
    flavor: 'milk',
    pack: 'none',
    text: '',
    items: [],
    tools: {},
    strokes: [],
  };
  accent = design.color;

  host.innerHTML = '';
  document.body.classList.add('studio-open');
  root = buildDom();
  host.append(root);
  sizeCanvas();
  // the tab bar collapses with a transition; re-measure once it has
  setTimeout(sizeCanvas, 300);
  window.addEventListener('resize', sizeCanvas);
  startLoop();
  return () => closeStudio();
}

/** Start the player on a candy they own (not necessarily the right one). */
function starterCandyFor(){
  return S.owned.candies[0] || 'bar';
}

export function closeStudio(){
  cancelAnimationFrame(rafId);
  rafId = 0;
  document.body.classList.remove('studio-open');
  hideSelTools();
  window.removeEventListener('resize', sizeCanvas);
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  root = null; canvas = null; ctx = null;
}

/* ══════════════════════════════════════════════════════
   DOM
   ══════════════════════════════════════════════════════ */
function buildDom(){
  const wrap = el('div.screen.full.enter');
  const studio = el('div.studio');

  /* top bar */
  const back = el('button.icon-btn', { onclick: quit }, '←');
  const strip = el('div.order-strip');
  if (session.customer){
    const c = session.customer;
    strip.append(
      el('div.o-who', `${c.face} ${c.name}`, c.vip ? el('span', { style:{ color:'#c98f14' } }, ' • VIP') : null),
      el('div.o-more', t('studio.tapDetails')),
    );
  } else {
    strip.append(el('div.o-who', '🎨 ' + t('studio.free')));
  }
  strip.addEventListener('click', showChecklist);

  const timer = el('div.timer-ring', { id:'timerRing' });
  if (session.timeLimit){
    timer.innerHTML = `
      <svg width="38" height="38" viewBox="0 0 38 38">
        <circle cx="19" cy="19" r="16" fill="none" stroke="#ffe1ee" stroke-width="5"/>
        <circle id="timerArc" cx="19" cy="19" r="16" fill="none" stroke="#48cfa6"
                stroke-width="5" stroke-linecap="round"
                stroke-dasharray="100.5" stroke-dashoffset="0"/>
      </svg><span id="timerNum">0</span>`;
  } else {
    timer.append(el('span', '∞'));
  }

  studio.append(el('div.studio-top', back, strip, timer));

  /* the order text lives on its own full-width row — always readable */
  const line = el('div.order-line' + (session.customer?.vip ? '.vip' : ''), {
    id:'orderText', onclick: showChecklist,
  }, session.customer ? session.customer.order.line : t('studio.freeSub'));
  studio.append(line);

  /* stage */
  stageEl = el('div.stage');
  canvas = el('canvas');
  stageEl.append(canvas, el('div.stage-plate'));
  if (S.settings.hints){
    stageEl.append(el('div.stage-hint', { id:'stageHint' }, t('studio.hint')));
  }
  studio.append(el('div.stage-wrap', stageEl));

  canvas.addEventListener('pointerdown', onStageDown);

  /* actions */
  const actions = el('div.studio-actions',
    el('button.btn.ghost.act-icon', { onclick: undo, title: t('studio.undo'),
      'aria-label': t('studio.undo') }, '↩︎'),
    el('button.btn.ghost.act-icon', { onclick: clearAll, title: t('studio.clear'),
      'aria-label': t('studio.clear') }, '🧹'),
    session.freeplay
      ? el('button.btn.grape.act-main', { onclick: savePhotoNow }, el('span', t('studio.save')))
      : el('button.btn.mint.act-main', { id:'serveBtn', onclick: serve }, el('span', t('studio.serve'))),
  );
  studio.append(actions);

  /* tray */
  const tray = el('div.tray');
  tray.append(el('div.tray-tabs', { id:'trayTabs' }));
  tray.append(el('div.tray-body', { id:'trayBody' }));
  studio.append(tray);

  wrap.append(studio);
  setTimeout(() => { renderTabs(); renderTray(); }, 0);
  return wrap;
}

/* ══════════════════════════════════════════════════════
   Tray
   ══════════════════════════════════════════════════════ */
function tabs(){
  const list = [
    { id:'candy',  name:t('studio.tab.candy'),  emoji:'🍬' },
    { id:'color',  name:t('studio.tab.color'),  emoji:'🎨' },
    { id:'flavor', name:t('studio.tab.flavor'), emoji:'🍓' },
    ...(toolsForCandy(design.candy).length
        ? [{ id:'tools', name:t('studio.tab.tools'), emoji:'🔧' }] : []),
    ...DECO_CATS.map(c => ({ id:'cat:' + c.id, name:tName('cat', c.id, c.name), emoji:c.emoji })),
    { id:'pack',   name:t('studio.tab.pack'),   emoji:'🎁' },
    { id:'text',   name:t('studio.tab.text'),   emoji:'✍️' },
  ];
  return list;
}

function renderTabs(){
  const host = $('#trayTabs', root); if (!host) return;
  host.innerHTML = '';
  for (const tab of tabs()){
    host.append(el('button.tray-tab' + (tab.id === tabId ? '.on' : ''), {
      onclick: () => { sfx('swipe'); tabId = tab.id; renderTabs(); renderTray(); },
    }, el('span', tab.emoji), el('span', tab.name)));
  }
  const on = host.querySelector('.on');
  if (on) on.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
}

function renderTray(){
  const host = $('#trayBody', root); if (!host) return;
  host.innerHTML = '';
  // some tabs switch the tray to a column — always reset before rebuilding
  host.style.flexDirection = '';
  host.style.alignItems = '';
  toolThumbs = [];
  // the tray changes height per tab — re-fit the stage afterwards
  requestAnimationFrame(sizeCanvas);

  if (tabId === 'candy')      return renderCandyTray(host);
  if (tabId === 'color')      return renderColorTray(host, 'candy');
  if (tabId === 'flavor')     return renderFlavorTray(host);
  if (tabId === 'pack')       return renderPackTray(host);
  if (tabId === 'text')       return renderTextTray(host);
  if (tabId === 'tools')      return renderToolsTray(host);
  if (tabId.startsWith('cat:')) return renderDecoTray(host, tabId.slice(4));
}

function renderCandyTray(host){
  for (const c of CANDIES){
    const owned = S.owned.candies.includes(c.id);
    const tool = el('button.tool' + (design.candy === c.id ? '.on' : ''), {
      onclick: () => {
        if (!owned) return toast(t('lock.candyLevel', { n:c.unlock, name:tName('candy', c.id, c.name) }), 'warn', '🔒');
        pushHistory();
        design.candy = c.id;
        // drop any tool the new candy cannot use, and refresh the tab strip
        design.tools = pruneTools(design.tools, c.id);
        sfx('place'); haptic(10); renderTabs(); renderTray();
      },
    });
    const cv = el('canvas', { width:88, height:88 });
    tool.append(cv, el('b', tName('candy', c.id, c.name)));
    if (!owned) tool.append(el('div.t-lock', '🔒'));
    host.append(tool);
    const cc = cv.getContext('2d');
    drawCandyThumb(cc, 88, c.id, design.color, design.flavor);
  }
}

function renderColorTray(host, target){
  const row = el('div', { style:{ display:'flex', gap:'9px' } });
  for (const c of COLORS){
    const locked = !colorUnlocked(c.id);
    const isOn = target === 'candy' ? design.color === c.id : accent === c.id;
    const sw = el('button.swatch' + (isOn ? '.on' : ''), {
      onclick: () => {
        if (locked) return toast(tName('color', c.id, c.name) + ' — ' + t('lock.level', { n:COLOR_UNLOCK[c.id] }), 'warn', '🔒');
        pushHistory();
        if (target === 'candy'){ design.color = c.id; accent = c.id; }
        else accent = c.id;
        if (selected){ selected.color = c.id; }
        sfx('place'); haptic(8); renderTray();
      },
    });
    const chip = el('i');
    chip.style.background = swatchCss(c);
    sw.append(chip, el('b', tName('color', c.id, c.name)));
    if (locked) sw.append(el('div.t-lock', '🔒'));
    host.append(sw);
  }
}

function swatchCss(c){
  if (c.kind === 'rainbow') return 'linear-gradient(135deg,#ff6b8b,#ffcf47,#48cfa6,#5aabff,#9a6bff)';
  if (c.kind === 'metal') return `linear-gradient(135deg,${c.light},${c.base},${c.dark},${c.base},${c.light})`;
  return `linear-gradient(160deg,${c.light},${c.base} 55%,${c.dark})`;
}

function renderFlavorTray(host){
  for (const f of FLAVORS){
    const locked = !flavorUnlocked(f.id);
    const tool = el('button.tool' + (design.flavor === f.id ? '.on' : ''), {
      onclick: () => {
        if (locked) return toast(tName('flavor', f.id, f.name) + ' — ' + t('lock.level', { n:f.unlock }), 'warn', '🔒');
        pushHistory();
        design.flavor = f.id; sfx('place'); haptic(8); renderTray();
      },
    }, el('span.t-emoji', f.emoji), el('b', tName('flavor', f.id, f.name)));
    if (locked) tool.append(el('div.t-lock', '🔒'));
    host.append(tool);
  }
}

function renderDecoTray(host, cat){
  // accent colour strip sits above the decorations
  const strip = el('div', { style:{
    display:'flex', gap:'6px', overflowX:'auto', padding:'0 0 6px', width:'100%',
  }});
  for (const c of COLORS){
    if (!colorUnlocked(c.id)) continue;
    const b = el('button', { style:{
      flex:'0 0 auto', width:'30px', height:'30px', borderRadius:'10px',
      background: swatchCss(c),
      boxShadow: accent === c.id ? '0 0 0 3px #f95f97' : '0 2px 5px rgba(180,110,150,.25)',
    }, onclick: () => {
      accent = c.id;
      if (selected){ pushHistory(); selected.color = c.id; }
      sfx('tap'); renderTray();
    }});
    strip.append(b);
  }

  const ev = activeEvent();
  const list = DECORATIONS.filter(d =>
    d.cat === cat &&
    (!d.event || d.event === ev?.id) &&
    (!d.reward || ownsDeco(d.id)));      // level rewards only show once earned

  const grid = el('div', { style:{ display:'flex', gap:'9px' } });
  for (const d of list){
    const owned = ownsDeco(d.id);
    const levelOk = S.level >= d.unlock;
    const tool = el('button.tool.rar-' + d.rarity + (activeTool === d.id ? '.on' : ''), {
      dataset: { deco: d.id },
    });
    const cv = el('canvas', { width:88, height:88 });
    tool.append(cv, el('b', tName('deco', d.id, d.name)));
    const cc = cv.getContext('2d');
    toolThumbs.push({ ctx: cc, id: d.id, size: 88, animated: RARITY[d.rarity].animated });
    drawDecoThumb(cc, 88, d.id, d.fixed || accent, 0);

    if (RARITY[d.rarity].animated) tool.append(el('span.t-anim', '✦'));

    if (!owned){
      if (!levelOk){
        tool.append(el('div.t-lock', '🔒'));
        tool.onclick = () => toast(tName('deco', d.id, d.name) + ' — ' + t('lock.level', { n:d.unlock }), 'warn', '🔒');
      } else {
        tool.append(el('div.t-lock', '🛒'));
        tool.append(el('span.t-cost', `${d.currency === 'gem' ? '💎' : '🪙'} ${d.price}`));
        tool.onclick = () => buyInline(d);
      }
    } else {
      tool.addEventListener('pointerdown', e => startToolDrag(e, d));
      tool.addEventListener('click', () => {
        activeTool = activeTool === d.id ? null : d.id;
        sfx('pickup');
        renderTray();
        if (activeTool) toast(t('studio.tapToPlace'), '', '👆');
      });
    }
    grid.append(tool);
  }

  host.style.flexDirection = 'column';
  host.style.alignItems = 'stretch';
  host.append(strip, el('div', { style:{ display:'flex', gap:'9px', overflowX:'auto' } }, grid));
}

function buyInline(d){
  const cur = d.currency === 'gem' ? 'gem' : 'coin';
  const name = tName('deco', d.id, d.name);
  openModal({
    icon:'🛒', title:t('buy.title', { name }), sub:tDesc('deco', d.id, d.desc),
    body: el('p.center.tiny.muted', `${tName('rarity', d.rarity, RARITY[d.rarity].name)} • ${cur === 'gem' ? '💎' : '🪙'} ${d.price}`),
    actions:[
      { label:t('buy.notNow'), cls:'ghost' },
      { label:`${t('buy.confirm')} ${cur === 'gem' ? '💎' : '🪙'} ${d.price}`, cls:'gold', onClick: () => {
        if (!spend(d.price, cur)) return toast(cur === 'gem' ? t('buy.noGems') : t('buy.noCoins'), 'bad', '💸');
        grantDeco(d.id);
        sfx('unlock');
        toast(t('buy.unlocked', { name }), 'good', '✨');
        renderTray();
      }},
    ],
  });
}

function renderPackTray(host){
  for (const p of PACKAGING){
    const owned = ownsPack(p.id);
    const levelOk = S.level >= p.unlock;
    const tool = el('button.tool.rar-' + p.rarity + (design.pack === p.id ? '.on' : ''));
    const cv = el('canvas', { width:88, height:88 });
    tool.append(cv, el('b', tName('pack', p.id, p.name)));
    drawPackThumb(cv.getContext('2d'), 88, p.id, design.color, 0);

    if (!owned){
      if (!levelOk){
        tool.append(el('div.t-lock', '🔒'));
        tool.onclick = () => toast(tName('pack', p.id, p.name) + ' — ' + t('lock.level', { n:p.unlock }), 'warn', '🔒');
      } else {
        tool.append(el('div.t-lock', '🛒'));
        tool.append(el('span.t-cost', `${p.currency === 'gem' ? '💎' : '🪙'} ${p.price}`));
        tool.onclick = () => openModal({
          icon:'🎁', title:t('buy.title', { name:tName('pack', p.id, p.name) }), sub:tDesc('pack', p.id, p.desc),
          actions:[
            { label:t('buy.notNow'), cls:'ghost' },
            { label:`${t('buy.confirm')} ${p.currency === 'gem' ? '💎' : '🪙'} ${p.price}`, cls:'gold', onClick: () => {
              if (!spend(p.price, p.currency === 'gem' ? 'gem' : 'coin'))
                return toast(t('buy.noFunds'), 'bad', '💸');
              grantPack(p.id); sfx('unlock');
              toast(t('buy.unlocked', { name:tName('pack', p.id, p.name) }), 'good', '🎁');
              renderTray();
            }},
          ],
        });
      }
    } else {
      tool.onclick = () => {
        pushHistory();
        design.pack = p.id;
        sfx(p.id === 'none' ? 'remove' : 'whoosh'); haptic(12);
        if (p.id !== 'none') bump('wrapped', 0);
        renderTray();
      };
    }
    host.append(tool);
  }
}

/* ── tools: things you do TO the candy ─────────────────
   Every tool is free — it comes with the candy that supports it. */
function renderToolsTray(host){
  const avail = toolsForCandy(design.candy);
  if (!avail.length){
    host.append(el('p.tiny.muted.center', { style:{ width:'100%', padding:'12px' } },
      t('studio.noTools')));
    return;
  }
  if (!design.tools) design.tools = {};
  if (!avail.some(x => x.id === toolSel)) toolSel = avail[0].id;

  host.style.flexDirection = 'column';
  host.style.alignItems = 'stretch';

  /* row 1 — which tool */
  const row = el('div', { style:{ display:'flex', gap:'9px', overflowX:'auto', paddingBottom:'6px' } });
  for (const tool of avail){
    const on = tool.id === 'swirl'
      ? (design.strokes || []).length > 0
      : design.tools[tool.id] != null;
    const btn = el('button.tool' + (toolSel === tool.id ? '.on' : ''), {
      onclick: () => { toolSel = tool.id; sfx('tap'); renderTray(); },
    });
    const cv = el('canvas', { width:88, height:88 });
    btn.append(cv, el('b', tName('tool', tool.id, tool.name)));
    drawToolPreview(cv.getContext('2d'), 88, tool.id,
      tool.id === 'swirl' ? pipeColor
        : (design.tools[tool.id] ?? defaultToolValue(tool.id)), design.color);
    if (on) btn.append(el('span.t-anim', '✓'));
    row.append(btn);
  }
  host.append(row);

  /* row 2 — options for the selected tool */
  const tool = TOOL_BY_ID[toolSel];
  const opts = el('div', { style:{ display:'flex', gap:'7px', overflowX:'auto', alignItems:'center' } });

  if (toolSel === 'swirl'){
    // the whipper is a brush, not a switch: pick a colour and a nozzle,
    // then drag across the candy
    opts.append(el('button.chip', {
      onclick: () => {
        if (!(design.strokes || []).length) return;
        pushHistory();
        design.strokes = [];
        sfx('remove'); haptic(14);
        renderTray();
      },
    }, t('studio.wipeCream')));

    for (const c of COLORS){
      if (!colorUnlocked(c.id)) continue;
      opts.append(colorDot(c, pipeColor === c.id, () => {
        pipeColor = c.id; sfx('tap'); renderTray();
      }));
    }
    opts.append(el('span', { style:{ width:'6px', flex:'0 0 auto' } }));
    [[.72, t('studio.nozzleS')], [1, t('studio.nozzleM')], [1.4, t('studio.nozzleL')]]
      .forEach(([w, label]) => {
        opts.append(el('button.chip' + (pipeWidth === w ? '.on' : ''), {
          onclick: () => { pipeWidth = w; sfx('tap'); renderTray(); },
        }, label));
      });

    host.append(opts);
    host.append(el('p.tiny', { style:{
      marginTop:'6px', textAlign:'center', fontWeight:'800', color:'var(--pink-600)',
    }}, t('studio.pipeHint')));
    return;
  }

  const clearBtn = el('button.chip' + (design.tools[toolSel] == null ? '.on' : ''), {
    onclick: () => { pushHistory(); delete design.tools[toolSel]; sfx('remove'); renderTray(); },
  }, t('studio.toolOff'));
  opts.append(clearBtn);

  const setVal = v => { pushHistory(); design.tools[toolSel] = v; sfx('pour'); haptic(12); renderTray(); };

  if (tool.kind === 'fill'){
    for (const f of FILLINGS){
      opts.append(el('button.chip' + (design.tools.fill === f.id ? '.on' : ''), {
        onclick: () => setVal(f.id),
      }, `${f.emoji} ${tName('filling', f.id, f.name)}`));
    }
  } else if (tool.kind === 'dust'){
    for (const d of DUSTS){
      opts.append(el('button.chip' + (design.tools.dust === d.id ? '.on' : ''), {
        onclick: () => setVal(d.id),
      }, `${d.emoji} ${tName('dust', d.id, d.name)}`));
    }
  } else if (tool.kind === 'level'){
    [1, 2, 3].forEach(lv => {
      opts.append(el('button.chip' + (design.tools.toast === lv ? '.on' : ''), {
        onclick: () => setVal(lv),
      }, ['', t('studio.toastLight'), t('studio.toastMed'), t('studio.toastDark')][lv]));
    });
  } else if (tool.kind === 'dip'){
    const cur = design.tools.dip || { color:'brown', depth:.45 };
    for (const c of COLORS){
      if (!colorUnlocked(c.id)) continue;
      opts.append(colorDot(c, design.tools.dip?.color === c.id,
        () => setVal({ ...cur, color:c.id })));
    }
    opts.append(el('span', { style:{ width:'6px', flex:'0 0 auto' } }));
    [[.28, t('studio.dipTip')], [.45, t('studio.dipHalf')], [.72, t('studio.dipDeep')]].forEach(([d, label]) => {
      opts.append(el('button.chip' + (Math.abs((design.tools.dip?.depth ?? -1) - d) < .01 ? '.on' : ''), {
        onclick: () => setVal({ ...cur, depth:d }),
      }, label));
    });
  } else { // 'color' — marble and swirl
    for (const c of COLORS){
      if (!colorUnlocked(c.id)) continue;
      opts.append(colorDot(c, design.tools[toolSel] === c.id, () => setVal(c.id)));
    }
  }
  host.append(opts);
  host.append(el('p.tiny.muted', { style:{ marginTop:'6px', textAlign:'center' } },
    tDesc('tool', tool.id, tool.desc)));
}

function colorDot(c, on, onclick){
  return el('button', {
    style:{
      flex:'0 0 auto', width:'32px', height:'32px', borderRadius:'11px',
      background: swatchCss(c),
      boxShadow: on ? '0 0 0 3px #f95f97' : '0 2px 5px rgba(180,110,150,.25)',
    },
    onclick,
  });
}

function defaultToolValue(id){
  switch (id){
    case 'fill':   return 'pistachio';
    case 'dust':   return 'sugar';
    case 'toast':  return 2;
    case 'dip':    return { color:'brown', depth:.45 };
    case 'marble': return 'white';
    case 'swirl':  return 'white';
    default:       return null;
  }
}

function renderTextTray(host){
  host.style.flexDirection = 'column';
  host.style.alignItems = 'stretch';
  const input = el('input.text-field', {
    type:'text', maxlength:16, placeholder:t('studio.textPlaceholder'),
    value: design.text || '',
  });
  input.addEventListener('input', () => {
    design.text = input.value.slice(0, 16);
  });
  input.addEventListener('blur', () => sfx('tap'));
  const quick = el('div.chipbar');
  for (const w of ['Lieke','Love','Thanks','Sorry','Yay','Best','XOXO','Mum']){
    quick.append(el('button.chip', {
      onclick: () => { design.text = w; input.value = w; sfx('place'); },
    }, w));
  }
  host.append(
    el('div', { style:{ padding:'0 4px 8px' } }, input),
    quick,
    el('p.tiny.muted.center', t('studio.textHint')),
  );
}

/* ══════════════════════════════════════════════════════
   Canvas sizing + render loop
   ══════════════════════════════════════════════════════ */
function sizeCanvas(){
  if (!canvas || !stageEl) return;
  // Cap the square by the space actually left between the header and the tray,
  // otherwise short/landscape screens clip the candy.
  const wrapEl = stageEl.parentElement;
  if (wrapEl){
    // Measure without the current cap, otherwise the square props the row open
    // and we keep re-measuring our own height.
    wrapEl.style.setProperty('--stage-max', '0px');
    const avail = wrapEl.clientHeight - 12;
    wrapEl.style.setProperty('--stage-max', Math.max(150, avail) + 'px');
  }
  const r = stageEl.getBoundingClientRect();
  const d = DPR();
  canvas.width = Math.round(r.width * d);
  canvas.height = Math.round(r.height * d);
  ctx = canvas.getContext('2d');
}

function startLoop(){
  lastT = performance.now();
  const frame = (now) => {
    const dt = Math.min(.1, (now - lastT) / 1000);
    lastT = now;
    if (!session.expired && session.timeLimit) tick(dt);
    elapsed += dt;
    render(now / 1000);
    // animated tray thumbnails
    for (const t of toolThumbs){
      if (t.animated) drawDecoThumb(t.ctx, t.size, t.id, getDeco(t.id).fixed || accent, now / 1000);
    }
    rafId = requestAnimationFrame(frame);
  };
  rafId = requestAnimationFrame(frame);
}

function tick(dt){
  const c = session.customer;
  if (!c) return;
  c.patience = Math.max(0, c.patience - dt);
  const arc = $('#timerArc', root);
  const num = $('#timerNum', root);
  const frac = c.patience / c.maxPatience;
  if (arc){
    arc.setAttribute('stroke-dashoffset', String(100.5 * (1 - frac)));
    arc.setAttribute('stroke', frac > .5 ? '#48cfa6' : frac > .22 ? '#ffc233' : '#e2504f');
  }
  if (num) num.textContent = Math.ceil(c.patience);
  $('#timerRing', root)?.classList.toggle('low', frac <= .22);

  if (c.patience <= 0 && !session.expired){
    session.expired = true;
    timeUp();
  }
}

function render(t){
  if (!ctx) return;
  const size = canvas.width;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // the stage is square-ish; centre the 1:1 design inside it
  const box = Math.min(canvas.width, canvas.height);
  const ox = (canvas.width - box) / 2, oy = (canvas.height - box) / 2;
  ctx.save();
  ctx.translate(ox, oy);
  drawDesign(ctx, box, design, t, { clear:false, zoom: STUDIO_ZOOM });

  // selection ring — lives in the same zoomed square as the design
  const side = box * STUDIO_ZOOM;
  const inset = (box - side) / 2;
  if (selected){
    const r = side * itemRadius(selected) * 1.15;
    ctx.save();
    ctx.translate(inset + selected.x * side, inset + selected.y * side);
    ctx.strokeStyle = 'rgba(249,95,151,.95)';
    ctx.lineWidth = Math.max(2, side * .008);
    ctx.setLineDash([side * .03, side * .022]);
    ctx.lineDashOffset = -t * side * .06;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/* map client coords → normalised design coords */
function toDesign(clientX, clientY){
  const r = canvas.getBoundingClientRect();
  // must mirror drawDesign: the design square is scaled by STUDIO_ZOOM
  // and centred, so touches map back through the same factor
  const side = Math.min(r.width, r.height) * STUDIO_ZOOM;
  const ox = r.left + (r.width - side) / 2;
  const oy = r.top + (r.height - side) / 2;
  return { x: (clientX - ox) / side, y: (clientY - oy) / side };
}

/* ══════════════════════════════════════════════════════
   Placing / moving decorations
   ══════════════════════════════════════════════════════ */
let dragging = null;   // { mode:'new'|'move', deco, item, ghost }

function startToolDrag(e, deco){
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  const ghost = el('div', { id:'dragGhost' });
  const cv = el('canvas', { width:132, height:132 });
  ghost.append(cv);
  drawDecoThumb(cv.getContext('2d'), 132, deco.id, deco.fixed || accent, elapsed);
  document.body.append(ghost);
  moveGhost(ghost, e.clientX, e.clientY);

  dragging = { mode:'new', deco, ghost, moved:false };
  sfx('pickup');
  document.addEventListener('pointermove', onDragMove, { passive:false });
  document.addEventListener('pointerup', onDragEnd);
}

function moveGhost(ghost, x, y){
  ghost.style.left = x + 'px';
  ghost.style.top = y + 'px';
}

function onDragMove(e){
  if (!dragging) return;
  e.preventDefault();
  dragging.moved = true;
  if (dragging.ghost) moveGhost(dragging.ghost, e.clientX, e.clientY);
  if (dragging.mode === 'move'){
    const p = toDesign(e.clientX, e.clientY);
    dragging.item.x = clamp(p.x, .04, .96);
    dragging.item.y = clamp(p.y, .04, .96);
  } else {
    const over = overStage(e.clientX, e.clientY);
    stageEl.classList.toggle('dropping', over);
  }
}

function overStage(x, y){
  const r = canvas.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function onDragEnd(e){
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  stageEl?.classList.remove('dropping');
  if (!dragging) return;
  const d = dragging;
  dragging = null;
  d.ghost?.remove();

  if (d.mode === 'new'){
    if (!d.moved) return;                       // treated as a tap → handled by click
    if (!overStage(e.clientX, e.clientY)) { sfx('remove'); return; }
    const p = toDesign(e.clientX, e.clientY);
    placeItem(d.deco, p.x, p.y, e.clientX, e.clientY);
  } else {
    sfx('place'); haptic(8);
    showSelTools();
  }
}

function placeItem(deco, x, y, clientX, clientY){
  const cap = bonuses().maxDecos;
  if (design.items.length >= cap){
    sfx('error');
    return toast(t('studio.tableFull', { n:cap }), 'warn', '🎨');
  }
  pushHistory();
  const item = {
    uid: uid(),
    id: deco.id,
    x: clamp(x, .05, .95),
    y: clamp(y, .05, .95),
    rot: rand(-.22, .22),
    scale: 1,
    color: deco.fixed || accent,
    seed: uid(),
  };
  design.items.push(item);
  selected = item;
  bump('decosPlaced');
  sfx('place'); haptic(14);
  if (clientX != null) sparkleBurst(clientX, clientY, 9);
  hideHint();
  showSelTools();
}

function onStageDown(e){
  if (dragging || piping) return;
  const p = toDesign(e.clientX, e.clientY);

  // piping bag selected: drag to squeeze out a rope of cream
  if (pipeActive()){
    startPiping(p, e);
    return;
  }

  // hit-test existing items, topmost first
  const r = canvas.getBoundingClientRect();
  const side = Math.min(r.width, r.height);
  let hit = null;
  for (let i = design.items.length - 1; i >= 0; i--){
    const it = design.items[i];
    if (dist(p.x, p.y, it.x, it.y) <= itemRadius(it) * 1.2){ hit = it; break; }
  }

  if (hit){
    selected = hit;
    hideSelTools();
    dragging = { mode:'move', item: hit, moved:false };
    sfx('pickup');
    document.addEventListener('pointermove', onDragMove, { passive:false });
    document.addEventListener('pointerup', onDragEnd);
    return;
  }

  if (activeTool){
    const deco = getDeco(activeTool);
    placeItem(deco, p.x, p.y, e.clientX, e.clientY);
    return;
  }

  selected = null;
  hideSelTools();
}

/* ══════════════════════════════════════════════════════
   Piping bag — drag across the candy to squeeze out cream
   ══════════════════════════════════════════════════════ */

/** True while the Cream Whipper tab is open with a colour armed. */
function pipeActive(){
  return tabId === 'tools' && toolSel === 'swirl'
      && toolsForCandy(design.candy).some(x => x.id === 'swirl');
}

/** Points closer together than this are dropped, in design units. */
const PIPE_MIN_STEP = 0.012;

function startPiping(p, e){
  if (!design.strokes) design.strokes = [];
  if (design.strokes.length >= 24){
    sfx('error');
    toast(t('studio.tooMuchCream'), 'warn', '🍦');
    return;
  }
  pushHistory();
  piping = {
    color: pipeColor,
    width: pipeWidth,
    points: [{ x: clamp(p.x, 0, 1), y: clamp(p.y, 0, 1) }],
  };
  design.strokes.push(piping);
  selected = null;
  hideSelTools();
  hideHint();
  sfx('pour');
  haptic(8);
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  document.addEventListener('pointermove', onPipeMove, { passive:false });
  document.addEventListener('pointerup', onPipeEnd);
  document.addEventListener('pointercancel', onPipeEnd);
}

function onPipeMove(e){
  if (!piping) return;
  e.preventDefault();
  const p = toDesign(e.clientX, e.clientY);
  const last = piping.points[piping.points.length - 1];
  if (dist(p.x, p.y, last.x, last.y) < PIPE_MIN_STEP) return;
  piping.points.push({ x: clamp(p.x, -.05, 1.05), y: clamp(p.y, -.05, 1.05) });
  // a little squeeze of sound and buzz every few beads
  if (piping.points.length % 5 === 0){ sfx('pour'); haptic(4); }
}

function onPipeEnd(){
  document.removeEventListener('pointermove', onPipeMove);
  document.removeEventListener('pointerup', onPipeEnd);
  document.removeEventListener('pointercancel', onPipeEnd);
  if (!piping) return;
  // a single tap leaves one rosette rather than nothing at all
  const done = piping;
  piping = null;
  sfx('place');
  haptic(12);
  bump('decosPlaced');
  renderTray();       // refresh the ✓ on the tool button
}

/* ── floating tools for the selected item ────────────── */
function showSelTools(){
  hideSelTools();
  if (!selected) return;
  const r = canvas.getBoundingClientRect();
  const stageRect = stageEl.getBoundingClientRect();
  const side = Math.min(r.width, r.height);
  const ox = (r.width - side) / 2, oy = (r.height - side) / 2;

  const node = el('div.sel-tools',
    el('button', { onclick: () => { pushHistory(); selected.scale = clamp((selected.scale || 1) * 1.18, .45, 2.4); sfx('tap'); } }, '＋'),
    el('button', { onclick: () => { pushHistory(); selected.scale = clamp((selected.scale || 1) / 1.18, .45, 2.4); sfx('tap'); } }, '－'),
    el('button', { onclick: () => { pushHistory(); selected.rot = (selected.rot || 0) + Math.PI / 8; sfx('tap'); } }, '⟳'),
    el('button.del', { onclick: () => {
      pushHistory();
      design.items = design.items.filter(i => i !== selected);
      selected = null; hideSelTools(); sfx('remove'); haptic(18);
    }}, '🗑'),
  );
  const x = clamp(ox + selected.x * side, 70, stageRect.width - 70);
  const y = clamp(oy + selected.y * side - side * .17, 6, stageRect.height - 46);
  node.style.left = (x - 70) + 'px';
  node.style.top = y + 'px';
  stageEl.append(node);
  selToolsEl = node;
}
function hideSelTools(){ selToolsEl?.remove(); selToolsEl = null; }

function hideHint(){
  const h = $('#stageHint', root);
  if (h) h.style.opacity = '0';
}

/* ══════════════════════════════════════════════════════
   History / clearing
   ══════════════════════════════════════════════════════ */
function pushHistory(){
  history.push(JSON.stringify(design));
  if (history.length > 30) history.shift();
}
function undo(){
  if (!history.length) return toast(t('studio.nothingUndo'), '', '↩︎');
  design = JSON.parse(history.pop());
  selected = null; hideSelTools();
  sfx('remove'); renderTray();
}
function clearAll(){
  if (!design.items.length && !design.text) return;
  confirmModal({
    icon:'🧹', title:t('studio.clearTitle'), sub:t('studio.clearSub'),
    yes:t('studio.clearYes'), onYes: () => {
      pushHistory();
      design.items = []; design.text = ''; design.strokes = [];
      selected = null; hideSelTools(); sfx('whoosh');
      renderTray();
    },
  });
}

/* ══════════════════════════════════════════════════════
   Order checklist
   ══════════════════════════════════════════════════════ */
function showChecklist(){
  if (!session.customer) return;
  const o = session.customer.order;
  const list = el('div', { style:{ display:'flex', flexDirection:'column', gap:'7px' } });
  for (const row of o.checklist){
    list.append(el('div.row', { style:{
      padding:'9px 11px', borderRadius:'14px', background:'var(--surface-2)',
      border:'1.5px solid var(--line)',
    }},
      el('span', { style:{ fontSize:'17px' } }, row.icon),
      el('span', { style:{ fontSize:'13px', fontWeight:'800' } }, row.label),
    ));
  }
  openModal({
    icon: session.customer.face,
    title: t('studio.orderOf', { name: session.customer.name }),
    sub: session.customer.order.line,
    body: list,
    actions:[{ label:t('studio.gotIt'), cls:'mint' }],
  });
}

/* ══════════════════════════════════════════════════════
   Finishing
   ══════════════════════════════════════════════════════ */
function serve(){
  if (!session.customer) return;
  const c = session.customer;
  sfx('whoosh');
  cancelAnimationFrame(rafId); rafId = 0;
  session.onServe?.({
    design: JSON.parse(JSON.stringify(design)),
    customer: c,
    timeLeft: c.patience,
    timeTotal: c.maxPatience,
  });
}

function timeUp(){
  sfx('fail'); haptic([30, 60, 30]);
  cancelAnimationFrame(rafId); rafId = 0;
  session.onServe?.({
    design: JSON.parse(JSON.stringify(design)),
    customer: session.customer,
    timeLeft: 0,
    timeTotal: session.customer.maxPatience,
    walkedOut: true,
  });
}

function quit(){
  if (session.freeplay || !design.items.length){
    closeStudio(); session.onQuit?.(); return;
  }
  confirmModal({
    icon:'🚪', title:t('studio.leaveTitle'), sub:t('studio.leaveSub'),
    yes:t('studio.leaveYes'), onYes: () => { closeStudio(); session.onQuit?.(); },
  });
}

function savePhotoNow(){
  import('../core/state.js').then(({ savePhoto }) => {
    savePhoto(design);
    sfx('sparkle');
    toast(t('studio.savedPhoto'), 'good', '📸');
  });
}

/** Read-only access for other screens. */
export const currentDesign = () => design;
