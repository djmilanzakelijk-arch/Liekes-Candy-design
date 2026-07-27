/* ============================================================
   Moving a shop between addresses (and between devices).
   ============================================================ */

import { el, fmt, $ } from '../core/utils.js';
import { S, SAVE_KEY, save } from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti } from '../core/fx.js';
import { openModal } from './modal.js';
import {
  encodeSave, decodeSave, buildTransferLink, applyIncoming, discardIncoming,
  describePayload, existingSaveLooksReal, hasIncoming, downloadSaveFile,
  pickSaveFile, NEW_SITE_URL,
} from '../core/transfer.js';
import { t } from '../core/i18n.js';

/* ══════════════ incoming ══════════════ */

/**
 * If the URL carried a shop, offer to install it here.
 * Called once after boot.
 */
export async function handleIncomingTransfer(){
  if (!hasIncoming()) return false;

  const info = await describePayload();
  if (!info.ok){
    discardIncoming();
    toast(t('mv.badLink'), 'bad', '⚠️');
    return false;
  }

  const summary = el('div.card', { style:{ marginBottom:'0' } },
    el('div.card-title', el('span.ico', '🏪'), info.shopName || t('mv.aShop')),
    el('div.stat-grid',
      el('div.stat', el('b', String(info.level)), el('span', t('stat.level'))),
      el('div.stat', el('b', fmt(info.coins)), el('span', t('stat.coins'))),
      el('div.stat', el('b', String(info.decos)), el('span', t('mv.decos'))),
    ),
  );

  // nothing worth keeping here → just bring it in
  if (!existingSaveLooksReal()){
    await install();
    return true;
  }

  openModal({
    icon:'📦', title:t('mv.incomingTitle'), sub:t('mv.incomingSub'),
    dismissable:false,
    body:[summary, el('p.tiny.muted.center', { style:{ marginTop:'10px' } }, t('mv.overwriteWarn'))],
    actions:[
      { label:t('mv.keepMine'), cls:'ghost', onClick: () => { discardIncoming(); } },
      { label:t('mv.installIt'), cls:'mint', onClick: () => install() },
    ],
  });
  return true;
}

async function install(){
  try {
    await applyIncoming();
    sfx('unlock'); haptic([12, 30, 12]);
    confetti(50);
    openModal({
      icon:'🎉', title:t('mv.doneTitle'), sub:t('mv.doneSub'),
      dismissable:false,
      actions:[{ label:t('mv.reload'), cls:'mint', onClick: () => location.reload() }],
    });
  } catch {
    toast(t('mv.badLink'), 'bad', '⚠️');
  }
}

/* ══════════════ outgoing ══════════════ */

/** The "take my shop somewhere else" sheet. */
export function openTransferSheet(){
  const input = el('input.text-field', {
    type:'url', placeholder:'https://…', value: NEW_SITE_URL || '',
    style:{ textAlign:'left', fontSize:'13px' },
  });

  const out = el('div', { style:{ marginTop:'10px' } });

  const makeLink = async () => {
    const target = input.value.trim();
    if (!target){
      toast(t('mv.needUrl'), 'warn', '🔗');
      return;
    }
    let payload;
    try { payload = await encodeSave(S); }
    catch { toast(t('mv.encodeFail'), 'bad', '⚠️'); return; }

    const link = buildTransferLink(target, payload);
    out.innerHTML = '';

    const box = el('textarea', {
      readonly:true, rows:4,
      style:{
        width:'100%', fontSize:'10.5px', fontFamily:'monospace', padding:'9px',
        borderRadius:'12px', border:'2px solid var(--line)', background:'var(--surface-2)',
        color:'var(--ink)', userSelect:'text', WebkitUserSelect:'text', resize:'none',
      },
    });
    box.value = link;

    const row = el('div.row', { style:{ gap:'8px', marginTop:'8px' } },
      el('button.btn.mint.sm.grow', { onclick: () => {
        box.select();
        navigator.clipboard?.writeText(link).then(
          () => toast(t('mv.copied'), 'good', '📋'),
          () => toast(t('mv.copyManual'), 'warn', '📋'));
      }}, t('mv.copy')),
      navigator.share
        ? el('button.btn.ghost.sm.grow', { onclick: () => {
            navigator.share({ title:"Lieke's Candy Design", url:link }).catch(() => {});
          }}, t('mv.share'))
        : null,
    );

    out.append(
      el('p.tiny.muted', { style:{ marginBottom:'6px' } }, t('mv.linkReady')),
      box, row,
      el('p.tiny.muted', { style:{ marginTop:'8px' } }, t('mv.linkNote')),
    );
    sfx('sparkle');
  };

  openModal({
    icon:'📦', title:t('mv.title'), sub:t('mv.sub'),
    body:[
      el('p.tiny.muted', { style:{ marginBottom:'6px' } }, t('mv.step1')),
      input,
      el('button.btn.grape.block.sm', { style:{ marginTop:'9px' }, onclick: makeLink },
        t('mv.makeLink')),
      out,
      el('hr', { style:{ border:'0', borderTop:'1.5px solid var(--line)', margin:'14px 0 10px' } }),
      el('p.tiny.muted', { style:{ marginBottom:'6px' } }, t('mv.fileIntro')),
      el('div.row', { style:{ gap:'8px' } },
        el('button.btn.ghost.sm.grow', { onclick: () => {
          downloadSaveFile(S); sfx('tap'); toast(t('mv.fileSaved'), 'good', '💾');
        }}, t('mv.saveFile')),
        el('button.btn.ghost.sm.grow', { onclick: loadFromFile }, t('mv.loadFile')),
      ),
    ],
    actions:[{ label:t('mv.close'), cls:'ghost' }],
  });
}

async function loadFromFile(){
  try {
    const parsed = await pickSaveFile();
    localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
    sfx('unlock');
    openModal({
      icon:'✅', title:t('mv.doneTitle'), sub:t('mv.doneSub'),
      dismissable:false,
      actions:[{ label:t('mv.reload'), cls:'mint', onClick: () => location.reload() }],
    });
  } catch (e){
    if (e?.message !== 'cancelled') toast(t('mv.badFile'), 'bad', '⚠️');
  }
}

/* ══════════════ "this site is moving" banner ══════════════ */

/**
 * Shown only when NEW_SITE_URL is configured and we are not already there.
 * One tap carries the player's shop to the new address.
 */
export function maybeShowMoveBanner(host){
  if (!NEW_SITE_URL) return;
  try {
    if (new URL(NEW_SITE_URL).origin === location.origin) return;
  } catch { return; }

  const banner = el('div.move-banner',
    el('div.grow',
      el('b', t('mv.bannerTitle')),
      el('small', t('mv.bannerBody')),
    ),
    el('button.btn.sm', { onclick: async () => {
      try {
        const payload = await encodeSave(S);
        location.href = buildTransferLink(NEW_SITE_URL, payload);
      } catch {
        toast(t('mv.encodeFail'), 'bad', '⚠️');
      }
    }}, t('mv.bannerGo')),
  );
  host.prepend(banner);
}
