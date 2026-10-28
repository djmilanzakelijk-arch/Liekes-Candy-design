import { $, esc } from './dom.js';
import { ROOMS, ROOM_BY_ID } from '../data/rooms.js';
import { ART_BY_ID } from '../data/artworks.js';
import { ROOM_TEXTS, EXHIBITION } from '../data/texts.js';
import { DetailView } from './detail.js';
import { interpretationCanvas, ownPaintingCanvas } from '../world/interpretation.js';

import { imageUrl } from '../core/assets.js';

function sourceFor(id) {
  const a = ART_BY_ID[id];
  if (a.image) return { kind: 'img', src: imageUrl(a.image.file) };
  if (id === 'eigen-doek') return { kind: 'canvas', canvas: ownPaintingCanvas() };
  if (id === 'eigen-installatie') return { kind: 'installation' };
  if (a.interpretation) return { kind: 'canvas', canvas: interpretationCanvas(a), interpretation: true };
  return { kind: 'error' };
}

// Lijstweergave zonder 3D: voor apparaten zonder WebGL of voor wie liever leest.
export class Gallery2D {
  constructor({ onBack, canGo3D, openModal, detail }) {
    this.root = $('#gallery2d');
    this.onBack = onBack;
    this.canGo3D = canGo3D;
    this.openModal = openModal;
    this.order = {};
    for (const r of ROOMS) {
      const ids = (r.slots || []).map((s) => s.art);
      if (r.id === 'finale') ids.unshift('eigen-installatie');
      this.order[r.id] = ids;
    }
    this.detail = detail || null;
  }

  ensureDetail() {
    const handlers = {
      onClose: () => this.closeDetail(),
      onPrev: () => this.step(-1),
      onNext: () => this.step(1),
      getSource: sourceFor,
      closeLabel: 'Terug naar de lijst'
    };
    if (!this.detail) this.detail = new DetailView(handlers);
    else this.detail.setHandlers(handlers);
  }

  closeDetail() {
    this.detail?.hide();
    this.current = null;
    this.lastButton?.focus();
  }

  show() {
    this.root.hidden = false;
    document.body.classList.add('mode-2d');
    this.root.innerHTML = `
      <header class="g2d-head">
        <div><p class="eyebrow">${esc(EXHIBITION.course)} · lijstweergave zonder 3D</p>
        <h1 class="display small">${esc(EXHIBITION.title)}</h1><p class="sub">${esc(EXHIBITION.subtitle)} · ${esc(EXHIBITION.period)}</p></div>
        <div class="row-actions">
          ${this.canGo3D ? '<button class="btn primary" data-g="back">Naar het 3D-museum</button>' : ''}
          <button class="btn ghost" data-open="timeline">Tijdlijn</button>
        </div>
      </header>
      ${ROOMS.map((r) => {
        const ids = this.order[r.id];
        if (!ids.length) return '';
        return `<section class="g2d-room"><h2>${esc(r.id === 'entree' ? 'Entree' : r.label)} · ${esc(r.title)}</h2><p class="lead">${esc(ROOM_TEXTS[r.id].lead)}</p>
          <ul class="g2d-grid">${ids.map((id) => {
            const a = ART_BY_ID[id];
            return `<li><button class="g2d-card" data-art="${id}"><span class="thumb" data-thumb="${id}"></span><strong>${esc(a.title)}</strong><span>${esc(a.artist)} · ${esc(a.year)}</span></button></li>`;
          }).join('')}</ul></section>`;
      }).join('')}`;
    this.root.querySelector('[data-g="back"]')?.addEventListener('click', () => this.hide(true));
    this.root.querySelectorAll('[data-art]').forEach((b) => b.addEventListener('click', () => { this.lastButton = b; this.open(b.dataset.art); }));
    // miniaturen
    this.root.querySelectorAll('[data-thumb]').forEach((el) => {
      const src = sourceFor(el.dataset.thumb);
      if (src.kind === 'img') { el.style.backgroundImage = `url("${src.src}")`; }
      else if (src.kind === 'canvas') { el.style.backgroundImage = `url("${src.canvas.toDataURL('image/jpeg', 0.7)}")`; }
      else el.classList.add('none');
    });
    this.root.scrollTop = 0;
  }

  hide(back) {
    this.root.hidden = true;
    document.body.classList.remove('mode-2d');
    this.detail?.hide();
    if (back) this.onBack();
  }

  open(id) {
    this.ensureDetail();
    this.current = id;
    const a = ART_BY_ID[id];
    const order = this.order[a.room];
    const i = order.indexOf(id);
    this.detail.show(a, { index: i, total: order.length, prev: i > 0 ? ART_BY_ID[order[i - 1]] : null, next: i < order.length - 1 ? ART_BY_ID[order[i + 1]] : null }, { flat: true });
  }

  step(dir) {
    if (!this.current) return;
    const order = this.order[ART_BY_ID[this.current].room];
    const j = order.indexOf(this.current) + dir;
    if (j >= 0 && j < order.length) this.open(order[j]);
  }
}

export { ROOM_BY_ID };
