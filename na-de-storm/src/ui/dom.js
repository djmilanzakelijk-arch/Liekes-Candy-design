// Kleine DOM-hulpjes. `esc` voorkomt dat tekst als HTML wordt gelezen.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function show(el, on = true) { el.hidden = !on; }

export const TAG_LABEL = {
  FEIT: 'Feit',
  INTERPRETATIE: 'Interpretatie',
  KEUZE: 'Curatoriële keuze',
  UITLEG: 'Uitleg',
  BESCHRIJVING: 'Beschrijving',
  ANALYSE: 'Analyse'
};

export function tag(t) {
  return `<span class="tag tag-${esc(t.toLowerCase())}">${esc(TAG_LABEL[t] || t)}</span>`;
}

export function link(url, label) {
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}
