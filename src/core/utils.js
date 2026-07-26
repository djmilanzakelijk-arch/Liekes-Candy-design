/* ============================================================
   Small shared helpers
   ============================================================ */

export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

/** Deterministic 32-bit hash of a string → unsigned int. */
export function hash(str){
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 — tiny seeded PRNG. Returns a function producing [0,1). */
export function rngFrom(seed){
  let a = (typeof seed === 'string' ? hash(seed) : seed >>> 0) || 1;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Global (unseeded) helpers. */
export const rand  = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
export const randI = (a, b) => Math.floor(rand(a, b + 1));
export const pick  = arr => arr[Math.floor(Math.random() * arr.length)];

export function pickN(arr, n){
  const c = arr.slice();
  const out = [];
  while (out.length < n && c.length) out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]);
  return out;
}

export function shuffle(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Weighted pick: items must expose a numeric `weight` (default 1). */
export function pickWeighted(items, weightOf = x => x.weight ?? 1){
  let total = 0;
  for (const it of items) total += weightOf(it);
  let r = Math.random() * total;
  for (const it of items){
    r -= weightOf(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** 12 400 → "12.4K" */
export function fmt(n){
  n = Math.floor(n);
  if (n < 10000) return n.toLocaleString('en-US');
  if (n < 1e6) return (n / 1000).toFixed(n < 1e5 ? 1 : 0).replace('.0', '') + 'K';
  return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
}

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function daysBetween(aKey, bKey){
  const a = new Date(aKey + 'T00:00:00'), b = new Date(bKey + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

/** Turn a list into "a, b and c". */
export function listJoin(parts){
  parts = parts.filter(Boolean);
  if (parts.length <= 1) return parts[0] || '';
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}

export const titleCase = s => s.charAt(0).toUpperCase() + s.slice(1);

/** Tiny DOM builder: el('div.card', {onclick}, child, child…) */
export function el(spec, props, ...kids){
  const [tagPart, ...classes] = String(spec).split('.');
  const node = document.createElement(tagPart || 'div');
  if (classes.length) node.className = classes.join(' ');
  if (props && (props.nodeType || typeof props === 'string')){ kids.unshift(props); props = null; }
  if (props){
    for (const [k, v] of Object.entries(props)){
      if (v == null || v === false) continue;
      if (k === 'class') node.className += (node.className ? ' ' : '') + v;
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const kid of kids.flat(3)){
    if (kid == null || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** requestAnimationFrame-driven tween helper. */
export function tween(ms, onStep, ease = t => t){
  const t0 = performance.now();
  return new Promise(resolve => {
    (function step(now){
      const t = clamp((now - t0) / ms, 0, 1);
      onStep(ease(t), t);
      if (t < 1) requestAnimationFrame(step); else resolve();
    })(t0);
  });
}

export const easeOutBack = t => { const c = 1.70158 + 1; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

/** Distance between two points. */
export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
