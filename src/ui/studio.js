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
import { activeEvent, eventRunning } from '../data/events.js';
import { TOOLS, FILLINGS, DUSTS, toolsForCandy, pruneTools, TOOL_BY_ID,
         FILL_BY_ID, DUST_BY_ID } from '../data/tools.js';
import { drawToolPreview } from '../render/tools.js';
import { drawChocolateBowl, drawDipRipple, drawPipingBag, drawTorch,
         drawSieve, drawInjector, bowlInnerPath } from '../render/toolProps.js';
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

/* The materials currently loaded into the physical tools. Tapping a chip
   swaps them out; the gesture then applies whatever is loaded. */
let dipColor = 'brown';
let dustSel = 'sugar';
let fillSel = 'pistachio';
let marbleColor = 'white';

/* Dipping: how the candy is framed above the bowl, and how far it travels.
   DIP_TRAVEL is tuned so a full drag submerges about as much of the candy
   as the depth value it writes — what you see is what you get. */
const DIP_SCALE = .72;      // candy shrinks to make room for the bowl
const DIP_CY = .431;        // its centre, as a fraction of the stage
const DIP_TRAVEL = .576;    // full drag distance, same fraction
const DIP_SURFACE = .80;    // where the chocolate surface sits

let gest = null;            // physical tool gesture in progress
let dipOffset = 0;          // px the candy is pushed down; springs back

/* step-by-step mode (Settings → how you design) */
let guided = false;
let stepIx = 0;
let guidedCat = 'icing';

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
    contest: !!opts.contest,
    expired: false,
  };
  onDoneCb = opts.onDone || null;
  elapsed = 0;
  history = [];
  selected = null;
  activeTool = null;
  guided = !!S.settings.guided;
  stepIx = 0;
  guidedCat = DECO_CATS[0].id;
  tabId = 'candy';

  design = opts.design || {
    candy: session.customer ? starterCandyFor(session.customer) : S.owned.candies[0],
    color: 'pink',
    flavor: 'milk',
    pack: 'none',
    text: '',
    items: [],
    tools: {},
    toolFx: {},
    strokes: [],
  };
  if (!design.toolFx) design.toolFx = {};
  accent = design.color;
  gest = null; dipOffset = 0;

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
  resetGestures();
  window.removeEventListener('resize', sizeCanvas);
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
      el('div.o-who', `${c.face} ${c.name}`,
        c.vip ? el('span', { style:{ color:'#c98f14' } }, ' • VIP') : null,
        c.influencer ? el('span', { style:{ color:'var(--grape-500)' } }, ' • 🤳') : null,
        c.brandDeal ? el('span', { style:{ color:'var(--grape-500)' } }, ' • 🤝') : null),
      el('div.o-more', c.influencer ? '🤳 ' + t('soc.influencer')
                     : c.fromSocial ? '📱 ' + t('soc.viaSocial')
                     : t('studio.tapDetails')),
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
    // free play can also bottle a design as a recipe you can make again
    session.freeplay && !session.contest
      ? el('button.btn.ghost.act-icon', { onclick: saveRecipeNow, title: t('rec.save'),
          'aria-label': t('rec.save') }, '📗')
      : null,
    session.contest
      ? el('button.btn.gold.act-main', { id:'serveBtn', onclick: submitContest }, el('span', t('ct.submit')))
      : session.freeplay
        ? el('button.btn.grape.act-main', { onclick: savePhotoNow }, el('span', t('studio.save')))
        : el('button.btn.mint.act-main', { id:'serveBtn', onclick: serve }, el('span', t('studio.serve'))),
  );
  studio.append(actions);

  /* tray */
  const trayEl = el('div.tray');
  trayEl.append(el('div.tray-tabs', { id:'trayTabs' }));
  const trayBody = el('div.tray-body', { id:'trayBody' });
  // one delegated listener: the tray owns scrolling AND lifting (see onTrayDown)
  trayBody.addEventListener('pointerdown', onTrayDown);
  trayEl.append(trayBody);
  studio.append(trayEl);

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

/* ── step-by-step mode ────────────────────────────────
   Some people want the whole table in front of them; some would
   rather be walked through it. Settings picks which, and the studio
   is the same underneath — guided mode just decides which tray is
   showing and adds a Back / Next bar instead of the tab strip.
   The six decoration categories collapse into one step, otherwise
   the walk-through would be eleven steps long. */

function steps(){
  return [
    { id:'candy',  emoji:'🍬', name:t('studio.tab.candy'),  hint:t('step.candy') },
    { id:'color',  emoji:'🎨', name:t('studio.tab.color'),  hint:t('step.color') },
    { id:'flavor', emoji:'🍓', name:t('studio.tab.flavor'), hint:t('step.flavor') },
    ...(toolsForCandy(design.candy).length
        ? [{ id:'tools', emoji:'🔧', name:t('studio.tab.tools'), hint:t('step.tools') }] : []),
    { id:'decos',  emoji:'✨', name:t('step.decosName'), hint:t('step.decos') },
    { id:'pack',   emoji:'🎁', name:t('studio.tab.pack'),  hint:t('step.pack') },
    { id:'text',   emoji:'✍️', name:t('studio.tab.text'),  hint:t('step.text') },
  ];
}

function gotoStep(i){
  const list = steps();
  stepIx = clamp(i, 0, list.length - 1);
  tabId = list[stepIx].id;
  renderTabs(); renderTray();
}

function renderStepBar(host){
  const list = steps();
  // the candy can gain or lose its tools step — keep the index sane
  if (stepIx >= list.length) stepIx = list.length - 1;
  const s = list[stepIx];

  host.append(el('div.step-bar',
    el('button.step-nav' + (stepIx === 0 ? '.off' : ''), {
      onclick: () => { if (stepIx > 0){ sfx('swipe'); gotoStep(stepIx - 1); } },
    }, '←'),
    el('div.step-mid',
      el('div.step-no', t('step.of', { a: stepIx + 1, b: list.length })),
      el('div.step-name', `${s.emoji} ${s.name}`),
    ),
    stepIx === list.length - 1
      ? el('div.step-nav.done', '✓')
      : el('button.step-nav.next', {
          onclick: () => { sfx('swipe'); gotoStep(stepIx + 1); },
        }, '→'),
  ));
  host.append(el('div.step-dots',
    ...list.map((_, i) => el('button.step-dot' + (i === stepIx ? '.on' : '') + (i < stepIx ? '.done' : ''), {
      onclick: () => { sfx('tap'); gotoStep(i); },
    }))));
}

function renderTabs(){
  const host = $('#trayTabs', root); if (!host) return;
  host.innerHTML = '';
  host.classList.toggle('guided', guided);

  if (guided){ renderStepBar(host); return; }

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
  if (tabId === 'decos')      return renderAllDecosTray(host);
  if (tabId.startsWith('cat:')) return renderDecoTray(host, tabId.slice(4));
}

/** Guided mode folds all six decoration categories into one step. */
function renderAllDecosTray(host){
  host.style.flexDirection = 'column';
  host.style.alignItems = 'stretch';

  const cats = el('div.chipbar', { style:{ marginBottom:'2px' } });
  for (const c of DECO_CATS){
    cats.append(el('button.chip' + (guidedCat === c.id ? '.on' : ''), {
      onclick: () => { guidedCat = c.id; sfx('swipe'); renderTray(); },
    }, `${c.emoji} ${tName('cat', c.id, c.name)}`));
  }
  host.append(cats);

  const inner = el('div', { style:{ display:'flex', flexDirection:'column', alignItems:'stretch' } });
  host.append(inner);
  renderDecoTray(inner, guidedCat);
}

/** What the current customer asked for, or an empty order. */
const wanted = () => session?.customer?.order ?? {};

function renderCandyTray(host){
  // The list is long enough to scroll off screen, so bring what the customer
  // actually asked for to the front and mark it — otherwise a request for a
  // truffle looks like a candy she does not have.
  const want = wanted().candy;
  const ordered = [...CANDIES].sort((a, b) => {
    const rank = c => (c.id === want ? 0 : S.owned.candies.includes(c.id) ? 1 : 2);
    return rank(a) - rank(b);
  });

  for (const c of ordered){
    const owned = S.owned.candies.includes(c.id);
    const asked = c.id === want;
    const tool = el('button.tool' + (design.candy === c.id ? '.on' : '') + (asked ? '.asked' : ''), {
      onclick: () => {
        if (!owned) return toast(t('lock.candyLevel', { n:c.unlock, name:tName('candy', c.id, c.name) }), 'warn', '🔒');
        pushHistory();
        design.candy = c.id;
        // drop any tool the new candy cannot use, and refresh the tab strip
        design.tools = pruneTools(design.tools, c.id);
        sfx('place'); haptic(10);
        if (guided) gotoStep(stepIx); else { renderTabs(); renderTray(); }
      },
    });
    const cv = el('canvas', { width:88, height:88 });
    tool.append(cv, el('b', tName('candy', c.id, c.name)));
    if (asked) tool.append(el('span.t-asked', '★'));
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
    if (target === 'candy' && c.id === wanted().color){
      sw.classList.add('asked');
      sw.append(el('span.t-asked', '★'));
    }
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
    // Anything owned is always usable. Event pieces are only *offered*
    // during their season, but once bought they stay in the tray forever —
    // otherwise a Christmas snowflake would vanish every January.
    (ownsDeco(d.id) || (!d.event || eventRunning(d.event)) && !d.reward && !d.season));

  const asks = new Set((wanted().wants || []).map(w => w.id));
  // requested decorations to the front of the row, same reason as the candy
  const sorted = [...list].sort((a, b) => {
    const rank = d => (asks.has(d.id) ? 0 : ownsDeco(d.id) ? 1 : 2);
    return rank(a) - rank(b);
  });

  const grid = el('div', { style:{ display:'flex', gap:'9px' } });
  for (const d of sorted){
    const owned = ownsDeco(d.id);
    const levelOk = S.level >= d.unlock;
    const asked = asks.has(d.id);
    const tool = el('button.tool.rar-' + d.rarity + (activeTool === d.id ? '.on' : '')
                    + (asked ? '.asked' : ''), {
      dataset: { deco: d.id },
    });
    const cv = el('canvas', { width:88, height:88 });
    tool.append(cv, el('b', tName('deco', d.id, d.name)));
    const cc = cv.getContext('2d');
    toolThumbs.push({ ctx: cc, id: d.id, size: 88, animated: RARITY[d.rarity].animated });
    drawDecoThumb(cc, 88, d.id, d.fixed || accent, 0);

    if (asked) tool.append(el('span.t-asked', '★'));
    else if (RARITY[d.rarity].animated) tool.append(el('span.t-anim', '✦'));

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
      // dragging is handled by the tray-wide gesture; this is the tap path
      tool.addEventListener('click', () => {
        // a finished drag also fires a click on some browsers; that must not
        // arm tap-to-place and drop a second decoration on the next touch
        if (suppressClick) return;
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
    const asked = p.id === wanted().pack;
    const tool = el('button.tool.rar-' + p.rarity + (design.pack === p.id ? '.on' : '')
                    + (asked ? '.asked' : ''));
    const cv = el('canvas', { width:88, height:88 });
    tool.append(cv, el('b', tName('pack', p.id, p.name)));
    if (asked) tool.append(el('span.t-asked', '★'));
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
  if (!design.toolFx) design.toolFx = {};
  if (!avail.some(x => x.id === toolSel)) toolSel = avail[0].id;

  // keep the loaded materials in step with whatever is already on the candy
  if (design.tools.dip?.color) dipColor = design.tools.dip.color;
  if (design.tools.dust) dustSel = design.tools.dust;
  if (design.tools.fill) fillSel = design.tools.fill;
  if (design.tools.marble) marbleColor = design.tools.marble;

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
      opts.append(el('button.chip' + (fillSel === f.id ? '.on' : ''), {
        onclick: () => { fillSel = f.id; if (design.tools.fill != null) setVal(f.id); else { sfx('tap'); renderTray(); } },
      }, `${f.emoji} ${tName('filling', f.id, f.name)}`));
    }
  } else if (tool.kind === 'dust'){
    for (const d of DUSTS){
      opts.append(el('button.chip' + (dustSel === d.id ? '.on' : ''), {
        onclick: () => { dustSel = d.id; if (design.tools.dust != null) setVal(d.id); else { sfx('tap'); renderTray(); } },
      }, `${d.emoji} ${tName('dust', d.id, d.name)}`));
    }
  } else if (tool.kind === 'level'){
    [1, 2, 3].forEach(lv => {
      opts.append(el('button.chip' + (design.tools.toast === lv ? '.on' : ''), {
        onclick: () => setVal(lv),
      }, ['', t('studio.toastLight'), t('studio.toastMed'), t('studio.toastDark')][lv]));
    });
  } else if (tool.kind === 'dip'){
    const cur = design.tools.dip || { color: dipColor, depth:.45 };
    for (const c of COLORS){
      if (!colorUnlocked(c.id)) continue;
      opts.append(colorDot(c, dipColor === c.id, () => {
        dipColor = c.id;
        if (design.tools.dip) setVal({ ...cur, color:c.id });
        else { sfx('tap'); renderTray(); }
      }));
    }
    opts.append(el('span', { style:{ width:'6px', flex:'0 0 auto' } }));
    [[.28, t('studio.dipTip')], [.45, t('studio.dipHalf')], [.72, t('studio.dipDeep')]].forEach(([d, label]) => {
      opts.append(el('button.chip' + (Math.abs((design.tools.dip?.depth ?? -1) - d) < .01 ? '.on' : ''), {
        onclick: () => setVal({ color: dipColor, depth:d }),
      }, label));
    });
  } else { // 'color' — marble
    for (const c of COLORS){
      if (!colorUnlocked(c.id)) continue;
      opts.append(colorDot(c, marbleColor === c.id, () => {
        marbleColor = c.id;
        if (design.tools[toolSel] != null) setVal(c.id);
        else { sfx('tap'); renderTray(); }
      }));
    }
  }
  host.append(opts);
  host.append(el('p.tiny', { style:{
    marginTop:'6px', textAlign:'center', fontWeight:'800', color:'var(--pink-600)',
  }}, t('studio.gest.' + tool.id)));
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
    render(now / 1000, dt);
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

function render(t, dt = 0){
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const W = canvas.width, H = canvas.height;
  // the stage is square-ish; centre the 1:1 design inside it
  const box = Math.min(W, H);
  const ox = (W - box) / 2, oy = (H - box) / 2;

  const mode = toolMode();
  const dipMode = mode === 'dip';

  tickToast();
  // the candy sinks while you hold it under, and floats back up after
  const wantOff = gest?.tool === 'dip' ? gest.offset : 0;
  dipOffset += (wantOff - dipOffset) * Math.min(1, dt * 16);
  if (Math.abs(dipOffset - wantOff) < .5) dipOffset = wantOff;

  ctx.save();
  if (dipMode){
    // the candy may only exist above the chocolate or inside the bowl —
    // otherwise a deep dunk hangs out below the rim
    const surfaceY = oy + box * DIP_SURFACE;
    ctx.beginPath();
    ctx.rect(0, 0, W, surfaceY);
    bowlInnerPath(ctx, W, H, surfaceY);
    ctx.clip();
  }
  ctx.translate(ox, oy);
  if (dipMode){
    // lift and shrink the candy so there is a bowl to lower it into
    ctx.translate(box / 2, box * DIP_CY + dipOffset);
    ctx.scale(DIP_SCALE, DIP_SCALE);
    ctx.translate(-box / 2, -box / 2);
  }
  drawDesign(ctx, box, design, t, { clear:false, zoom: STUDIO_ZOOM });

  // selection ring — lives in the same zoomed square as the design
  const side = box * STUDIO_ZOOM;
  const inset = (box - side) / 2;
  if (selected && !mode){
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

  drawProps(t, W, H, box, ox, oy, mode);
}

/* ── the tools you can see in your hand ───────────────── */
function drawProps(t, W, H, box, ox, oy, mode){
  if (mode === 'dip'){
    const surfaceY = oy + box * DIP_SURFACE;
    drawChocolateBowl(ctx, W, H, surfaceY, dipColor, t, !!gest);
    if (gest?.tool === 'dip' && dipOffset > box * .02){
      drawDipRipple(ctx, W / 2, surfaceY, box * .24, dipColor, t);
    }
    return;
  }

  if (mode === 'swirl'){
    // the bag rides the tip of the rope while you squeeze
    if (!piping || !piping.points.length) return;
    const pts = piping.points;
    const last = pts[pts.length - 1];
    const prev = pts[Math.max(0, pts.length - 3)];
    const side = box * STUDIO_ZOOM;
    const inset = (box - side) / 2;
    const x = ox + inset + last.x * side;
    const y = oy + inset + last.y * side;
    const a = pts.length > 2 ? Math.atan2(last.y - prev.y, last.x - prev.x) : -Math.PI / 2;
    drawPipingBag(ctx, x, y, box * .30, piping.color, a, .6 + Math.sin(t * 14) * .4);
    return;
  }

  if (!gest) return;
  const p = toCanvasPx(gest.px, gest.py);

  if (gest.tool === 'toast'){
    drawTorch(ctx, p.x + box * .10, p.y - box * .06, box * .34, t, gest.power || 0);
  } else if (gest.tool === 'dust'){
    drawSieve(ctx, p.x, p.y - box * .16, box * .34,
              DUST_BY_ID[dustSel]?.color || '#ffffff', t, true);
  } else if (gest.tool === 'fill'){
    drawInjector(ctx, p.x, p.y, box * .34, FILL_BY_ID[fillSel]?.base || '#fff0d0', t, true);
  } else if (gest.tool === 'marble' && gest.angle != null){
    const s = toCanvasPx(gest.x0, gest.y0);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = box * .05;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.restore();
  }
}

/* map client coords → canvas pixels (props are drawn in that space) */
function toCanvasPx(clientX, clientY){
  const r = canvas.getBoundingClientRect();
  return {
    x: (clientX - r.left) * canvas.width / r.width,
    y: (clientY - r.top) * canvas.height / r.height,
  };
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
let dragging = null;   // { mode:'new'|'move', deco, item, ghost, pointerId }
let suppressClick = false;   // a real drag must not also fire the tool's click
let tray = null;             // a finger is down in the tray, intent unknown
let flingRaf = 0;

/** Fingers wobble; below this many pixels it is still a tap. */
const DRAG_SLOP = 7;

/**
 * Wipe any half-finished gesture. Phones fire pointercancel whenever the
 * browser decides a touch was a scroll, and without this the studio would
 * stay stuck mid-drag with a ghost on screen and a dead stage.
 */
function resetGestures(){
  if (dragging?.ghost) dragging.ghost.remove();
  dragging = null;
  piping = null;
  gest = null;
  stopFling();
  endTray();
  stageEl?.classList.remove('dropping');
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  document.removeEventListener('pointercancel', onDragEnd);
  document.removeEventListener('pointermove', onPipeMove);
  document.removeEventListener('pointerup', onPipeEnd);
  document.removeEventListener('pointercancel', onPipeEnd);
  document.removeEventListener('pointermove', onGestMove);
  document.removeEventListener('pointerup', onGestEnd);
  document.removeEventListener('pointercancel', onGestEnd);
}

/* ══════════════════════════════════════════════════════
   The tray gesture.

   A row of decorations has to do two things with the same finger:
   scroll sideways, and let you lift a piece out and drop it on the
   candy. Leaving that decision to the browser meant one of the two
   always lost — `touch-action:none` killed scrolling, `pan-x` killed
   dragging, because once the browser claims a touch it stops telling
   us about it.

   So the tray takes the whole gesture (touch-action:none in the CSS)
   and decides for itself: sideways scrolls the row, up or down lifts
   the piece, and neither is a tap.
   ══════════════════════════════════════════════════════ */

/** The nearest thing under the finger that can actually scroll sideways. */
function scrollerFor(node){
  let n = node;
  while (n && n !== document.body){
    if (n.scrollWidth > n.clientWidth + 4) return n;
    n = n.parentElement;
  }
  return null;
}

function onTrayDown(e){
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (dragging || piping || gest) resetGestures();
  endTray();
  stopFling();

  const target = e.target;
  const id = target.closest?.('[data-deco]')?.dataset.deco;
  const scroller = scrollerFor(target);

  tray = {
    pointerId: e.pointerId,
    deco: id && ownsDeco(id) ? getDeco(id) : null,
    x0: e.clientX, y0: e.clientY,
    lastX: e.clientX, lastT: performance.now(), vx: 0,
    scroller, sl0: scroller ? scroller.scrollLeft : 0,
    mode: null,                   // null → undecided | 'scroll' | 'lift'
  };
  document.addEventListener('pointermove', onTrayMove, { passive:false });
  document.addEventListener('pointerup', endTray);
  document.addEventListener('pointercancel', endTray);
}

function onTrayMove(e){
  if (!tray || e.pointerId !== tray.pointerId) return;
  const dx = e.clientX - tray.x0;
  const dy = e.clientY - tray.y0;

  if (!tray.mode){
    if (Math.hypot(dx, dy) < DRAG_SLOP) return;
    // ties go to lifting: dragging a decoration onto the candy is the
    // thing people mean, and the row can always be nudged sideways again
    tray.mode = Math.abs(dy) >= Math.abs(dx) ? 'lift' : 'scroll';

    if (tray.mode === 'lift'){
      const deco = tray.deco;
      endTray();
      if (!deco) return;           // candies and flavours are tap-only
      e.preventDefault();
      beginToolDrag(deco, e);
      return;
    }
  }

  if (tray.mode === 'scroll' && tray.scroller){
    e.preventDefault();
    const now = performance.now();
    const dt = Math.max(1, now - tray.lastT);
    tray.vx = (e.clientX - tray.lastX) / dt;      // px per ms, for the fling
    tray.lastX = e.clientX; tray.lastT = now;
    tray.scroller.scrollLeft = tray.sl0 - dx;
    // a scrolled row must not also fire the button underneath
    suppressClick = true;
  }
}

function endTray(){
  const g = tray;
  tray = null;
  document.removeEventListener('pointermove', onTrayMove);
  document.removeEventListener('pointerup', endTray);
  document.removeEventListener('pointercancel', endTray);

  if (g?.mode === 'scroll'){
    fling(g.scroller, g.vx);
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 320);
  }
}

/* ── momentum, so a flick keeps rolling like a native row ── */
function stopFling(){ cancelAnimationFrame(flingRaf); flingRaf = 0; }

function fling(scroller, vx){
  if (!scroller || Math.abs(vx) < .15) return;
  let v = clamp(vx * 16, -70, 70);            // px per frame
  const step = () => {
    scroller.scrollLeft -= v;
    v *= .93;
    flingRaf = Math.abs(v) > .4 ? requestAnimationFrame(step) : 0;
  };
  flingRaf = requestAnimationFrame(step);
}

/** The finger committed to a drag: show the ghost and take over. */
function beginToolDrag(deco, e){
  const ghost = el('div', { id:'dragGhost' });
  const cv = el('canvas', { width:132, height:132 });
  ghost.append(cv);
  drawDecoThumb(cv.getContext('2d'), 132, deco.id, deco.fixed || accent, elapsed);
  document.body.append(ghost);
  moveGhost(ghost, e.clientX, e.clientY);

  dragging = {
    mode:'new', deco, ghost, moved:true,
    pointerId: e.pointerId, x0: e.clientX, y0: e.clientY,
  };
  sfx('pickup');
  haptic(8);
  listenDrag();
}

function listenDrag(){
  document.addEventListener('pointermove', onDragMove, { passive:false });
  document.addEventListener('pointerup', onDragEnd);
  document.addEventListener('pointercancel', onDragEnd);
}

function moveGhost(ghost, x, y){
  ghost.style.left = x + 'px';
  ghost.style.top = y + 'px';
}

function onDragMove(e){
  if (!dragging) return;
  // ignore a second finger joining in
  if (dragging.pointerId != null && e.pointerId !== dragging.pointerId) return;
  e.preventDefault();

  if (!dragging.moved &&
      Math.hypot(e.clientX - dragging.x0, e.clientY - dragging.y0) < DRAG_SLOP) return;
  dragging.moved = true;

  if (dragging.ghost) moveGhost(dragging.ghost, e.clientX, e.clientY);
  if (dragging.mode === 'move'){
    const p = toDesign(e.clientX, e.clientY);
    dragging.item.x = clamp(p.x, .04, .96);
    dragging.item.y = clamp(p.y, .04, .96);
  } else {
    stageEl.classList.toggle('dropping', overStage(e.clientX, e.clientY));
  }
}

function overStage(x, y){
  const r = canvas.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function onDragEnd(e){
  if (dragging && dragging.pointerId != null &&
      e.pointerId !== dragging.pointerId) return;

  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  document.removeEventListener('pointercancel', onDragEnd);
  stageEl?.classList.remove('dropping');

  if (!dragging) return;
  const d = dragging;
  dragging = null;
  d.ghost?.remove();

  // the browser took the gesture away — drop it quietly
  if (e.type === 'pointercancel'){
    if (d.mode === 'move') showSelTools();
    return;
  }

  if (d.mode === 'new'){
    if (!d.moved) return;                       // a tap: the click handler deals with it
    suppressClick = true;                       // …but a real drag must not click
    setTimeout(() => { suppressClick = false; }, 350);
    if (!overStage(e.clientX, e.clientY)) { sfx('remove'); return; }
    const p = toDesign(e.clientX, e.clientY);
    placeItem(d.deco, p.x, p.y, e.clientX, e.clientY);
  } else {
    if (d.moved){ sfx('place'); haptic(8); }
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
  // a previous gesture the browser cancelled must never block this one
  if (dragging || piping || gest) resetGestures();
  const p = toDesign(e.clientX, e.clientY);

  // With the Tools tab open the stage belongs to the tool in your hand:
  // dip the candy, hold the torch on it, rub the sieve over it, and so on.
  const mode = toolMode();
  if (mode === 'swirl'){ startPiping(p, e); return; }
  if (mode){ startToolGesture(mode, p, e); return; }

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
    dragging = {
      mode:'move', item: hit, moved:false,
      pointerId: e.pointerId, x0: e.clientX, y0: e.clientY,
    };
    sfx('pickup');
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    listenDrag();
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

/** Which physical tool the stage is currently holding, if any. */
function toolMode(){
  if (tabId !== 'tools') return null;
  if (!toolsForCandy(design.candy).some(x => x.id === toolSel)) return null;
  return toolSel;
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

/* ══════════════════════════════════════════════════════
   Physical tools — dip, torch, sieve, injector, marble

   Every one of these is a gesture on the stage rather than a button:
   you push the candy into the chocolate, hold the flame on it, rub the
   powder over it. The chips in the tray only load the material.
   ══════════════════════════════════════════════════════ */

function startToolGesture(mode, p, e){
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  pushHistory();
  if (!design.toolFx) design.toolFx = {};
  selected = null; hideSelTools(); hideHint();

  gest = {
    tool: mode, pointerId: e.pointerId,
    x0: e.clientX, y0: e.clientY,
    px: e.clientX, py: e.clientY,
    p0: p, p, t0: performance.now(),
    travel: 0, offset: 0, power: 0, angle: null,
  };

  try { canvas.setPointerCapture(e.pointerId); } catch {}
  document.addEventListener('pointermove', onGestMove, { passive:false });
  document.addEventListener('pointerup', onGestEnd);
  document.addEventListener('pointercancel', onGestEnd);

  sfx(mode === 'dip' ? 'pickup' : 'pour');
  haptic(8);
}

function onGestMove(e){
  if (!gest || (gest.pointerId != null && e.pointerId !== gest.pointerId)) return;
  e.preventDefault();
  const p = toDesign(e.clientX, e.clientY);
  const prev = gest.p;
  gest.px = e.clientX; gest.py = e.clientY; gest.p = p;

  if (gest.tool === 'dip'){
    const r = canvas.getBoundingClientRect();
    const minSide = Math.min(r.width, r.height);
    const maxT = minSide * DIP_TRAVEL;
    const travel = clamp(e.clientY - gest.y0, 0, maxT);
    gest.offset = travel * (canvas.width / Math.max(1, r.width));
    // quantised, so the cached candy base does not thrash on every pixel
    const depth = Math.round((.12 + (travel / maxT) * .78) * 20) / 20;
    const cur = design.tools.dip;
    if (!cur || cur.depth !== depth || cur.color !== dipColor){
      design.tools.dip = { color: dipColor, depth };
      if (!cur || Math.abs(cur.depth - depth) > .09){ sfx('pour'); haptic(4); }
    }
  } else if (gest.tool === 'dust'){
    gest.travel += dist(p.x, p.y, prev.x, prev.y);
    design.tools.dust = dustSel;
    design.toolFx.dustLv = Math.round(clamp(gest.travel / 1.6, .1, 1) * 10) / 10;
    if (Math.floor(gest.travel * 6) !== Math.floor((gest.travel - .01) * 6)) haptic(3);
  } else if (gest.tool === 'marble'){
    if (dist(p.x, p.y, gest.p0.x, gest.p0.y) > .05){
      gest.angle = Math.atan2(p.y - gest.p0.y, p.x - gest.p0.x);
      design.tools.marble = marbleColor;
      design.toolFx.marbleAngle = Math.round(gest.angle * 24) / 24;
    }
  }
  // 'toast' and 'fill' need no move handling — the torch and the syringe
  // simply follow the finger, and tickToast() counts the hold.
}

/** Holding the torch on the candy browns it further the longer you stay. */
function tickToast(){
  if (gest?.tool !== 'toast') return;
  const hold = (performance.now() - gest.t0) / 1000;
  gest.power = clamp(hold / 1.7, 0, 1);
  if (hold < .22) return;
  const lv = clamp(Math.ceil(gest.power * 3), 1, 3);
  if (design.tools.toast !== lv){
    design.tools.toast = lv;
    sfx('pour'); haptic(6);
  }
}

function onGestEnd(e){
  if (gest && gest.pointerId != null && e?.pointerId != null &&
      e.pointerId !== gest.pointerId) return;

  document.removeEventListener('pointermove', onGestMove);
  document.removeEventListener('pointerup', onGestEnd);
  document.removeEventListener('pointercancel', onGestEnd);

  if (!gest) return;
  const g = gest;
  gest = null;

  if (g.tool === 'fill'){
    // pressing the injector is what cuts the candy open
    design.toolFx.fillAt = { x: clamp(g.p.x, .22, .78), y: clamp(g.p.y, .22, .78) };
    design.tools.fill = fillSel;
    sparkleBurst(g.px, g.py, 8);
  }
  const did = g.tool === 'dip' ? design.tools.dip
            : g.tool === 'dust' ? g.travel > .02
            : g.tool === 'marble' ? g.angle != null
            : g.tool === 'toast' ? design.tools.toast : true;
  if (did){ sfx('place'); haptic(14); bump('decosPlaced'); }
  renderTray();
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
    // point at the tray tab that holds this, so nothing looks unobtainable
    const where = row.key.startsWith('tool:') ? t('studio.tab.tools')
                : row.key.startsWith('deco:')  ? tName('cat', getDeco(row.key.slice(5))?.cat,
                                                   getDeco(row.key.slice(5))?.cat)
                : row.key === 'pack'  ? t('studio.tab.pack')
                : row.key === 'color' ? t('studio.tab.color')
                : row.key === 'candy' ? t('studio.tab.candy')
                : row.key === 'text'  ? t('studio.tab.text') : null;

    list.append(el('div.row', { style:{
      padding:'9px 11px', borderRadius:'14px', background:'var(--surface-2)',
      border:'1.5px solid var(--line)',
    }},
      el('span', { style:{ fontSize:'17px' } }, row.icon),
      el('span', { style:{ fontSize:'13px', fontWeight:'800', flex:'1' } }, row.label),
      where ? el('span', { style:{
        fontSize:'10px', fontWeight:'800', color:'var(--ink-faint)',
        whiteSpace:'nowrap', paddingLeft:'6px',
      }}, where) : null,
    ));
  }
  if (Object.keys(o.tools || {}).length){
    list.append(el('p.tiny.muted', { style:{ marginTop:'4px', textAlign:'center' } },
      t('studio.toolsLive')));
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

/** Enter this candy in the weekly contest. */
function submitContest(){
  const d = JSON.parse(JSON.stringify(design));
  closeStudio();
  import('./contestScreen.js').then(({ submitEntry }) => submitEntry(d));
}

/** Bottle this design as a signature recipe. */
function saveRecipeNow(){
  const input = el('input.text-field', { type:'text', maxlength:22,
    placeholder: t('rec.namePlaceholder') });
  openModal({
    icon:'📗', title:t('rec.saveTitle'), sub:t('rec.saveSub'),
    body: input,
    actions:[
      { label:t('more.cancel'), cls:'ghost' },
      { label:t('rec.save'), cls:'mint', onClick: () => {
        import('../game/recipes.js').then(({ saveRecipe }) => {
          const r = saveRecipe(design, input.value);
          sfx(r ? 'unlock' : 'error');
          toast(r ? t('rec.saved', { name: r.name }) : t('rec.full'), r ? 'good' : 'warn', '📗');
        });
      }},
    ],
  });
  setTimeout(() => input.focus(), 120);
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

// handy from the console when something looks wrong on a real phone
if (typeof window !== 'undefined') window.__studioDesign = currentDesign;
