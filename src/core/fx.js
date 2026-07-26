/* ============================================================
   Visual feedback: toasts, floating numbers, confetti, sparkles.
   ============================================================ */

import { el, rand, randI, pick, $ } from './utils.js';

const layer  = () => $('#fx');
const toastsEl = () => $('#toasts');

/* ── toasts ──────────────────────────────────────────── */
export function toast(msg, kind = '', icon = ''){
  const node = el('div.toast' + (kind ? '.' + kind : ''),
    icon ? el('span.t-ico', icon) : null,
    el('span', msg));
  toastsEl().append(node);
  const life = Math.min(4200, 1600 + msg.length * 45);
  setTimeout(() => {
    node.classList.add('out');
    setTimeout(() => node.remove(), 320);
  }, life);
  // never stack more than 3
  const all = [...toastsEl().children];
  if (all.length > 3) all[0].remove();
  return node;
}

/* ── floating "+120 🪙" text ──────────────────────────── */
export function floatText(text, x, y, color = '#fff'){
  const node = el('div.fx-float', { style:{ left:x + 'px', top:y + 'px', color } }, text);
  layer().append(node);
  setTimeout(() => node.remove(), 1100);
}

export function floatFromEl(target, text, color){
  if (!target) return;
  const r = target.getBoundingClientRect();
  floatText(text, r.left + r.width / 2, r.top + r.height / 2, color);
}

/* ── confetti ────────────────────────────────────────── */
const CONFETTI_COLORS = ['#ff8ec0','#9a6bff','#5aabff','#48cfa6','#ffcf47','#ff9a4d','#ffffff'];

export function confetti(count = 40, originX = null, originY = null){
  const L = layer();
  const ox = originX ?? window.innerWidth / 2;
  const oy = originY ?? window.innerHeight * .38;
  for (let i = 0; i < count; i++){
    const size = rand(6, 13);
    const round = Math.random() < .35;
    const piece = el('div.fx-piece', { style:{
      left: ox + 'px', top: oy + 'px',
      width: size + 'px', height: (round ? size : size * .55) + 'px',
      background: pick(CONFETTI_COLORS),
      borderRadius: round ? '50%' : '2px',
      opacity: '1',
    }});
    L.append(piece);
    animatePiece(piece, ox, oy);
  }
}

function animatePiece(node, ox, oy){
  const angle = rand(-Math.PI * .95, -Math.PI * .05);
  const speed = rand(340, 780);
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  let x = 0, y = 0, rot = rand(0, 360);
  const vrot = rand(-520, 520);
  const t0 = performance.now();
  const life = rand(1100, 1900);
  let last = t0;

  requestAnimationFrame(function step(now){
    const dt = Math.min(.048, (now - last) / 1000);
    last = now;
    vy += 1500 * dt;
    vx *= .995;
    x += vx * dt; y += vy * dt; rot += vrot * dt;
    const age = now - t0;
    node.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg)`;
    node.style.opacity = String(Math.max(0, 1 - age / life));
    if (age < life && oy + y < window.innerHeight + 80) requestAnimationFrame(step);
    else node.remove();
  });
}

/* ── sparkle burst (used when a decoration lands) ────── */
export function sparkleBurst(x, y, count = 8, color = '#fff6c9'){
  const L = layer();
  for (let i = 0; i < count; i++){
    const s = rand(4, 9);
    const node = el('div.fx-piece', { style:{
      left:x + 'px', top:y + 'px', width:s + 'px', height:s + 'px',
      background:color, borderRadius:'50%',
      boxShadow:`0 0 ${s * 1.6}px ${color}`,
    }});
    L.append(node);
    const a = rand(0, Math.PI * 2), d = rand(24, 62);
    const t0 = performance.now(), life = rand(380, 720);
    (function step(now){
      const t = (now - t0) / life;
      if (t >= 1){ node.remove(); return; }
      const e = 1 - Math.pow(1 - t, 3);
      node.style.transform = `translate(${Math.cos(a) * d * e}px,${Math.sin(a) * d * e - 12 * e}px) scale(${1 - t * .7})`;
      node.style.opacity = String(1 - t);
      requestAnimationFrame(step);
    })(t0);
  }
}

/* ── coin fly-to-wallet ──────────────────────────────── */
export function coinFly(fromX, fromY, count = 8, targetSel = '#hudCoins'){
  const target = $(targetSel);
  if (!target) return;
  const tr = target.getBoundingClientRect();
  const tx = tr.left + tr.width / 2, ty = tr.top + tr.height / 2;
  const L = layer();
  for (let i = 0; i < count; i++){
    const node = el('div.fx-piece', { style:{
      left:fromX + 'px', top:fromY + 'px', fontSize:'20px', lineHeight:'1',
    }}, '🪙');
    L.append(node);
    const delay = i * 55;
    const cx = fromX + rand(-70, 70), cy = fromY - rand(60, 150);
    const t0 = performance.now() + delay, dur = rand(520, 760);
    (function step(now){
      if (now < t0){ requestAnimationFrame(step); return; }
      const t = Math.min(1, (now - t0) / dur);
      const e = t * t * (3 - 2 * t);
      // quadratic bezier from origin → control → wallet
      const x = (1-e)*(1-e)*fromX + 2*(1-e)*e*cx + e*e*tx;
      const y = (1-e)*(1-e)*fromY + 2*(1-e)*e*cy + e*e*ty;
      node.style.transform = `translate(${x - fromX}px,${y - fromY}px) scale(${1 - e * .45})`;
      node.style.opacity = String(t > .85 ? (1 - t) / .15 : 1);
      if (t < 1) requestAnimationFrame(step);
      else { node.remove(); target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump'); }
    })(performance.now());
  }
}

/** Pop animation on a HUD pill. */
export function bumpPill(sel){
  const n = $(sel); if (!n) return;
  n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump');
}

/* ── falling background candy (menus) ────────────────── */
export function candyRain(seconds = 3, glyphs = ['🍬','🍭','🍫','🧁','⭐']){
  const L = layer();
  const end = performance.now() + seconds * 1000;
  (function spawn(){
    if (performance.now() > end) return;
    const node = el('div.fx-piece', { style:{
      left: rand(0, window.innerWidth) + 'px', top:'-40px',
      fontSize: rand(18, 34) + 'px', opacity:'.9',
    }}, pick(glyphs));
    L.append(node);
    const vy = rand(90, 190), sway = rand(20, 60), rot = rand(-90, 90);
    const t0 = performance.now();
    (function fall(now){
      const t = (now - t0) / 1000;
      const y = vy * t;
      if (y > window.innerHeight + 60){ node.remove(); return; }
      node.style.transform = `translate(${Math.sin(t * 1.6) * sway}px,${y}px) rotate(${rot * t}deg)`;
      requestAnimationFrame(fall);
    })(t0);
    setTimeout(spawn, randI(90, 260));
  })();
}
