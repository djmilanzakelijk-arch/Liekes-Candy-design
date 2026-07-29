/* ============================================================
   Modal dialogs
   ============================================================ */

import { el, $ } from '../core/utils.js';
import { sfx } from '../core/audio.js';

let openCount = 0;

/**
 * @param opt {
 *   icon, title, sub, body (Node|Node[]), actions:[{label,cls,onClick,close}],
 *   dismissable (default true), onClose
 * }
 * @returns close()
 */
export function openModal(opt = {}){
  const host = $('#modals');
  const wrap = el('div.modal-wrap');
  const card = el('div.modal');

  if (opt.icon) card.append(el('span.m-ico', opt.icon));
  if (opt.title) card.append(el('h3', opt.title));
  if (opt.sub) card.append(el('p.m-sub', opt.sub));
  if (opt.body){
    for (const b of [opt.body].flat()) if (b) card.append(b);
  }

  let closed = false;
  const close = (silent) => {
    if (closed) return;
    closed = true;
    openCount--;
    wrap.classList.add('closing');
    setTimeout(() => {
      wrap.remove();
      if (openCount <= 0) host.style.pointerEvents = 'none';
    }, 230);
    if (!silent) opt.onClose?.();
  };

  if (opt.actions?.length){
    // three or more choices never fit side by side on a phone
    const list = opt.actions.filter(Boolean);
    const row = el('div.modal-actions' + (list.length > 2 ? '.stack' : ''));
    for (const a of list){
      row.append(el('button.btn' + (a.cls ? '.' + a.cls : ''), {
        onclick: () => {
          sfx('tap');
          const keep = a.onClick?.();
          if (a.close !== false && keep !== false) close(true);
        },
      }, a.label));
    }
    card.append(row);
  }

  wrap.append(card);
  if (opt.dismissable !== false){
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
  }

  host.style.pointerEvents = 'auto';
  host.append(wrap);
  openCount++;
  return close;
}

/** Simple yes/no, optionally with something to look at in between. */
export function confirmModal({ icon = '❓', title, sub, body, yes = 'Yes', no = 'Cancel', onYes }){
  return openModal({
    icon, title, sub, body,
    actions: [
      { label: no, cls: 'ghost' },
      { label: yes, onClick: onYes },
    ],
  });
}
