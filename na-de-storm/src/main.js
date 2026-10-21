import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource-variable/inter';
import './styles.css';

import { Game } from './game.js';
import { Gallery2D } from './ui/gallery2d.js';
import { MODALS } from './ui/modals.js';
import { $ } from './ui/dom.js';

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch {
    return false;
  }
}

function setProgress(p, msg) {
  const bar = $('#loading .progress');
  bar.firstElementChild.style.width = `${Math.round(p * 100)}%`;
  bar.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  if (msg) $('#loading .loading-status').textContent = msg;
}

// Fallback-vensters voor de lijstweergave (zonder 3D-game).
function standaloneModals() {
  const api = {
    settings: {}, viewed: new Set(), visitedRooms: new Set(), reflection: { choice: null, text: '' }, quizBest: null,
    startedAt: Date.now(), currentRoom: 'entree', tourActive: false,
    openModal: (k, a) => open(k, a), openArtFromList: (id) => { close(); gallery.open(id); },
    saveReflection: () => {}, saveQuiz: () => {}, mapState: () => ({ viewed: new Set(), artPoints: [] })
  };
  try {
    const d = JSON.parse(localStorage.getItem('na-de-storm:v1')) || {};
    api.reflection = d.reflection || api.reflection;
    api.saveReflection = (choice, text) => { d.reflection = { choice, text }; localStorage.setItem('na-de-storm:v1', JSON.stringify(d)); };
  } catch { /* geen opslag */ }
  function open(kind, arg) {
    if (!MODALS[kind] || kind === 'pause' || kind === 'map' || kind === 'settings' || kind === 'end' || kind === 'collection') return;
    const m = MODALS[kind](api, arg);
    $('#modal-title').textContent = m.title;
    $('#modal-body').innerHTML = m.html;
    $('#modal-card').classList.toggle('wide', !!m.wide);
    $('#modal').hidden = false;
    m.bind?.($('#modal-body'));
  }
  function close() { $('#modal').hidden = true; }
  $('#modal-close').addEventListener('click', close);
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) { e.preventDefault(); open(b.dataset.open); } });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#lightbox').hidden) $('#lightbox').hidden = true;
    else if (!$('#modal').hidden) close();
    else if (gallery.current) { gallery.detail.hide(); gallery.current = null; }
  });
  return { open, close };
}

let gallery;

async function boot() {
  const hasGL = webglAvailable();
  if (!hasGL) {
    $('#loading').hidden = true;
    standaloneModals();
    gallery = new Gallery2D({ onBack: () => {}, canGo3D: false });
    gallery.show();
    const warn = document.createElement('p');
    warn.className = 'warning';
    warn.textContent = 'Je browser of apparaat ondersteunt geen WebGL 2, dus het 3D-museum kan niet worden geladen. Je bekijkt nu de lijstweergave met alle werken en teksten. Probeer voor de 3D-ervaring een recente versie van Chrome, Edge of Firefox op een computer.';
    $('#gallery2d').prepend(warn);
    return;
  }

  const game = new Game($('#scene'));
  if (new URLSearchParams(location.search).has('debug')) window.__nds = game;
  try {
    await game.init(setProgress);
  } catch (err) {
    console.error(err);
    $('#loading .loading-status').textContent = 'Het 3D-museum kon niet worden gestart. De lijstweergave wordt geopend.';
    standaloneModals();
    gallery = new Gallery2D({ onBack: () => {}, canGo3D: false });
    setTimeout(() => { $('#loading').hidden = true; gallery.show(); }, 1500);
    return;
  }

  gallery = new Gallery2D({
    onBack: () => { $('#start').hidden = false; game.state = 'start'; $('#btn-enter').focus(); },
    canGo3D: true,
    detail: game.detail
  });
  // in de lijstweergave openen lijsten en de tijdlijn het werk in de lijst
  game.galleryOpenArt = (id) => gallery.open(id);
  game.galleryCloseDetail = () => gallery.closeDetail();

  $('#loading').classList.add('done');
  setTimeout(() => { $('#loading').hidden = true; }, 700);
  game.showStart();

  $('#btn-enter').addEventListener('click', () => game.enter());
  $('#btn-2d').addEventListener('click', () => {
    $('#start').hidden = true;
    game.state = 'gallery';
    gallery.show();
  });
}

boot();
