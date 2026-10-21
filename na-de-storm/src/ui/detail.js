import { $, esc, tag, link } from './dom.js';
import { ROOM_BY_ID } from '../data/rooms.js';
import { ACCESSED } from '../data/artworks.js';

const STATUS_TEXT = {
  periode: null,
  context: 'Historische context – gemaakt vóór 1940; telt niet mee voor de zaal.',
  vergelijking: 'Latere vergelijking – gemaakt na 1950; telt niet mee voor de zaal.',
  eigen: 'Eigen praktijkwerk van Milan, Berend, Polle en Constantijn – ontworpen voor deze tentoonstelling.'
};

// Tweedelige detailweergave: links het werk, rechts de informatie.
export class DetailView {
  constructor(handlers) {
    this.root = $('#detail');
    this.figure = $('#detail-figure');
    this.info = $('#detail-info');
    this.lightbox = new Lightbox();
    this.setHandlers(handlers);
    $('#detail-close').addEventListener('click', () => this.handlers.onClose('button'));
    $('#detail-prev').addEventListener('click', () => this.handlers.onPrev());
    $('#detail-next').addEventListener('click', () => this.handlers.onNext());
    $('#detail-zoom').addEventListener('click', () => this.openZoom());
    this.dataUrlCache = new Map();
  }

  // De game en de lijstweergave delen één detailvenster; wie het opent, bepaalt de acties.
  setHandlers({ onClose, onPrev, onNext, getSource, closeLabel = 'Terug naar het museum' }) {
    this.handlers = { onClose, onPrev, onNext };
    this.getSource = getSource;
    $('#detail-close').textContent = closeLabel;
  }

  get open() { return !this.root.hidden; }

  show(art, nav, { flat = false } = {}) {
    this.art = art;
    this.root.hidden = false;
    document.body.classList.add('detail-open');
    this.root.classList.toggle('flat', flat);
    this.root.classList.remove('visible');
    requestAnimationFrame(() => this.root.classList.add('visible'));
    this.renderMedia(art);
    this.renderInfo(art);
    $('#detail-prev').disabled = !nav.prev;
    $('#detail-next').disabled = !nav.next;
    $('#detail-prev').title = nav.prev ? `Vorig: ${nav.prev.title}` : 'Dit is het eerste werk in deze zaal';
    $('#detail-next').title = nav.next ? `Volgend: ${nav.next.title}` : 'Dit is het laatste werk in deze zaal';
    $('#detail-count').textContent = nav.total ? `${nav.index + 1} / ${nav.total} in ${ROOM_BY_ID[art.room].label.toLowerCase()}` : '';
    this.info.scrollTop = 0;
  }

  hide() {
    document.body.classList.remove('detail-open');
    this.root.classList.remove('visible');
    this.root.hidden = true;
    this.lightbox.close();
  }

  sourceUrl(art) {
    const src = this.getSource(art.id);
    if (src.kind === 'img') return src.src;
    if (src.kind === 'canvas') {
      if (!this.dataUrlCache.has(art.id)) this.dataUrlCache.set(art.id, src.canvas.toDataURL('image/jpeg', 0.9));
      return this.dataUrlCache.get(art.id);
    }
    return null;
  }

  renderMedia(art) {
    const src = this.getSource(art.id);
    this.figure.innerHTML = '';
    $('#detail-zoom').hidden = !(src.kind === 'img' || src.kind === 'canvas');
    if (src.kind === 'installation' || (art.type === 'beeld')) {
      this.figure.innerHTML = `<figcaption class="media-note">${art.type === 'beeld'
        ? 'Je kijkt naar een <strong>ruimtelijke impressie</strong> van dit beeld in de zaal. Het is geen replica; het beeld is auteursrechtelijk beschermd. Bekijk het origineel via de bronnen.'
        : 'Je kijkt naar de installatie in de ruimte. Loop er straks omheen om haar van alle kanten te zien.'}</figcaption>`;
      this.figure.classList.add('see-through');
      return;
    }
    this.figure.classList.remove('see-through');
    if (src.kind === 'error') {
      this.figure.innerHTML = `<div class="media-error"><strong>De afbeelding kon niet worden geladen.</strong><span>Controleer je internetverbinding of bekijk het werk via de bron rechts.</span></div>`;
      return;
    }
    const img = new Image();
    img.alt = `${art.title} – ${art.artist}, ${art.year}${src.interpretation ? ' (kleurnotitie, geen reproductie)' : ''}`;
    img.decoding = 'async';
    img.src = this.sourceUrl(art);
    img.addEventListener('error', () => {
      this.figure.innerHTML = `<div class="media-error"><strong>De afbeelding kon niet worden geladen.</strong><span>Bekijk het werk via de bron rechts.</span></div>`;
    });
    this.figure.appendChild(img);
    if (art.diamond) img.classList.add('diamond');
    if (src.interpretation) {
      const cap = document.createElement('figcaption');
      cap.className = 'interpretation-note';
      cap.innerHTML = '<strong>Kleurnotitie</strong> – een abstracte samenvatting van kleur en compositie door de curatoren. <em>Geen reproductie</em> van het origineel, dat auteursrechtelijk beschermd is.';
      this.figure.appendChild(cap);
    } else if (art.image) {
      const cap = document.createElement('figcaption');
      cap.className = 'credit';
      cap.innerHTML = `Beeld: ${esc(art.image.credit)} · ${esc(art.image.license)}`;
      this.figure.appendChild(cap);
    }
  }

  renderInfo(art) {
    const t = art.texts;
    const room = ROOM_BY_ID[art.room];
    const status = STATUS_TEXT[art.status];
    const firstSource = art.sources[0];
    const plural = / en /.test(art.artist);
    const yr = art.year.charAt(0).toLowerCase() + art.year.slice(1);
    const prep = /^\d{1,2} [a-z]/.test(yr) ? 'op' : 'in';
    const life = art.status === 'eigen' ? '' : ` (${art.artistLife})`;
    const maker = `${art.artist}${life} ${plural ? 'maakten' : 'maakte'} dit werk ${prep} ${yr}.${art.yearNote ? ' ' + art.yearNote : ''}`;
    const sec = (n, h, tg, body) => `
      <section class="info-sec">
        <h3><span class="num">${n}</span>${esc(h)} ${tg ? tag(tg) : ''}</h3>
        <p>${esc(body)}</p>
      </section>`;
    this.info.innerHTML = `
      <p class="eyebrow">${esc(room.label)} · ${esc(room.title)}</p>
      ${status ? `<p class="status-note status-${art.status}">${esc(status)}</p>` : ''}
      <h2 id="detail-title">${esc(art.title)}</h2>
      <p class="artist">${esc(art.artist)} <span>(${esc(art.artistLife)})</span></p>
      <dl class="meta">
        <div><dt>Jaar</dt><dd>${esc(art.year)}</dd></div>
        <div><dt>Materiaal en techniek</dt><dd>${esc(art.medium)}</dd></div>
        <div><dt>Afmetingen</dt><dd>${esc(art.dimensions)}${art.sizeNote ? ` <small>${esc(art.sizeNote)}</small>` : ''}</dd></div>
        <div><dt>Collectie</dt><dd>${esc(art.collection)}</dd></div>
      </dl>
      ${art.interpretation ? `<div class="notice"><strong>Waarom zie je een kleurnotitie?</strong> Dit werk is nog auteursrechtelijk beschermd. We tonen daarom geen reproductie, maar een duidelijk gelabelde abstracte samenvatting. ${art.rightsNote ? esc(art.rightsNote) + ' ' : ''}${firstSource ? `Bekijk het origineel: ${link(firstSource.url, firstSource.label)}.` : ''}</div>` : ''}
      ${art.type === 'beeld' ? `<div class="notice"><strong>Waarom zie je een ruimtelijke impressie?</strong> Dit beeld is nog auteursrechtelijk beschermd. Op de sokkel staat daarom een abstracte vorm van de curatoren, geen replica. ${firstSource ? `Bekijk het origineel: ${link(firstSource.url, firstSource.label)}.` : ''}</div>` : ''}
      ${sec(1, 'Wat zie je?', 'BESCHRIJVING', t.zien)}
      ${sec(2, 'Wie maakte het en wanneer?', 'FEIT', maker)}
      ${sec(3, 'Historische context', art.status === 'eigen' ? 'KEUZE' : 'FEIT', t.context)}
      ${sec(4, 'Beeldaspecten: kleur, lijn, vorm en compositie', 'ANALYSE', t.beeldaspecten)}
      ${sec(5, 'Betekenis en mogelijke interpretatie', 'INTERPRETATIE', t.betekenis)}
      ${sec(6, 'Waarom hangt dit werk in deze zaal?', 'KEUZE', t.zaal)}
      ${sec(7, 'Wat vertelt dit werk over 1940–1950?', 'INTERPRETATIE', t.periode)}
      <section class="info-sec sources">
        <h3><span class="num">8</span>Bron en collectie ${tag('FEIT')}</h3>
        <p><strong>Collectie:</strong> ${esc(art.collection)}</p>
        ${art.sources.length ? `<ul>${art.sources.map((s) => `<li>${link(s.url, s.label)}</li>`).join('')}</ul><p class="small">Geraadpleegd op ${esc(ACCESSED)}.</p>` : '<p>Eigen werk van de curatoren; geen externe bron.</p>'}
        ${art.image ? `<p class="small"><strong>Afbeelding:</strong> ${esc(art.image.credit)} – ${esc(art.image.license)}. ${link(art.image.sourceUrl, 'Bestandspagina')}</p>` : ''}
      </section>`;
  }

  openZoom() {
    if (!this.art) return;
    const url = this.sourceUrl(this.art);
    if (url) this.lightbox.open(url, this.art.title);
  }
}

// Vergrote weergave met zoomen en verschuiven (muis, wiel, toetsen, aanraking).
class Lightbox {
  constructor() {
    this.root = $('#lightbox');
    this.stage = $('#lightbox-stage');
    this.scale = 1; this.x = 0; this.y = 0;
    this.root.addEventListener('click', (e) => {
      const z = e.target.closest('[data-zoom]')?.dataset.zoom;
      if (z === 'in') this.zoom(1.4);
      if (z === 'out') this.zoom(1 / 1.4);
      if (z === 'reset') this.reset();
      if (z === 'close') this.close();
    });
    this.stage.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    let drag = null;
    this.stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; this.stage.setPointerCapture(e.pointerId); });
    this.stage.addEventListener('pointermove', (e) => {
      if (!drag) return;
      this.x += e.clientX - drag.x; this.y += e.clientY - drag.y;
      drag = { x: e.clientX, y: e.clientY };
      this.apply();
    });
    this.stage.addEventListener('pointerup', () => { drag = null; });
  }

  get isOpen() { return !this.root.hidden; }

  open(url, title) {
    this.stage.innerHTML = '';
    const img = new Image();
    img.src = url;
    img.alt = title;
    img.draggable = false;
    this.img = img;
    this.stage.appendChild(img);
    this.root.hidden = false;
    this.reset();
    this.root.querySelector('[data-zoom="close"]').focus();
  }

  close() { this.root.hidden = true; }
  reset() { this.scale = 1; this.x = 0; this.y = 0; this.apply(); }
  zoom(f) { this.scale = Math.max(1, Math.min(8, this.scale * f)); if (this.scale === 1) { this.x = 0; this.y = 0; } this.apply(); }
  apply() { if (this.img) this.img.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.scale})`; }

  key(e) {
    if (e.key === 'Escape') { this.close(); return true; }
    if (e.key === '+' || e.key === '=') { this.zoom(1.4); return true; }
    if (e.key === '-') { this.zoom(1 / 1.4); return true; }
    if (e.key === '0') { this.reset(); return true; }
    const step = 60;
    if (e.key === 'ArrowLeft') { this.x += step; this.apply(); return true; }
    if (e.key === 'ArrowRight') { this.x -= step; this.apply(); return true; }
    if (e.key === 'ArrowUp') { this.y += step; this.apply(); return true; }
    if (e.key === 'ArrowDown') { this.y -= step; this.apply(); return true; }
    return false;
  }
}
