// Glass-candy fruit ASMR clip for TikTok (1080×1920).
// Everything is drawn procedurally; render(t) is a pure function of time so
// the clip can be captured frame-by-frame. EVENTS lists every sound cue.

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// ---------- helpers -------------------------------------------------------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const ease = p => p * p * (3 - 2 * p);
const easeOut = p => 1 - Math.pow(1 - p, 3);
const easeIn = p => p * p * p;
const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const backOut = p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function softEllipse(ctx, x, y, rx, ry, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function star(ctx, x, y, s, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s * 0.28, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s * 0.28, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.moveTo(x - s * 0.7, y);
  ctx.quadraticCurveTo(x, y, x, y - s * 0.2);
  ctx.quadraticCurveTo(x, y, x + s * 0.7, y);
  ctx.quadraticCurveTo(x, y, x, y + s * 0.2);
  ctx.quadraticCurveTo(x, y, x - s * 0.7, y);
  ctx.fill();
  softEllipse(ctx, x, y, s * 0.9, s * 0.9, 'rgba(255,255,255,0.9)', 0.6);
  ctx.restore();
}

// ---------- fruit definitions --------------------------------------------
function normalised(fn) {
  let m = 0;
  for (let i = 0; i <= 400; i++) m = Math.max(m, fn(i / 400));
  return u => fn(clamp(u)) / m;
}

const FRUITS = {
  strawberry: {
    x0: 245, x1: 850, cy: 1010, R: 176,
    profile: normalised(u => Math.pow(1 - u, 0.62) * Math.sqrt(Math.max(0, 1 - Math.pow(1 - u, 5)))),
    light: '#ffe1ea', main: '#ff2a55', dark: '#9c0028', glow: '#ff9ab3', rim: '#5c0018',
    caustic: '#ff4f7a',
    cuts: [0.74, 0.535, 0.335],
  },
  kiwi: {
    x0: 240, x1: 840, cy: 1010, R: 170,
    profile: normalised(u => Math.pow(Math.max(0, 1 - Math.pow(2 * u - 1, 2)), 0.42)),
    light: '#fff4d9', main: '#bf8f3f', dark: '#6b4313', glow: '#cdf55f', rim: '#3d2507',
    caustic: '#a8e83c',
    cuts: [0.77, 0.56, 0.35],
  },
};

const xOf = (f, u) => lerp(f.x0, f.x1, u);
const uOf = (f, x) => (x - f.x0) / (f.x1 - f.x0);
const rOf = (f, u) => f.R * f.profile(u);
const BOTTOM = 0.93; // underside is a little flatter: it rests on the board

function bodyPath(ctx, f, uFrom = 0, uTo = 1, fresh = true) {
  const N = 90;
  if (fresh) ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const u = lerp(uFrom, uTo, i / N);
    const x = xOf(f, u), y = f.cy - rOf(f, u);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const u = lerp(uFrom, uTo, i / N);
    ctx.lineTo(xOf(f, u), f.cy + rOf(f, u) * BOTTOM);
  }
  ctx.closePath();
}

// ---------- timeline -----------------------------------------------------
const CUT_LEN = 1.75;
const PH = { approach: 0.3, contact: 0.45, press: 1.3, lift: 1.4, end: 1.75 };
const PRESS_STEPS = 5;
const FALL = 0.62;

export const SCENES = [
  { kind: 'strawberry', t0: 0, intro: 0.45, hook: ['Glazen snoep-aardbei', '🍓'], sub: 'geluid aan 🔊' },
  { kind: 'kiwi', t0: 6.1, intro: 0.6, hook: ['En nu… de kiwi', '🥝'], sub: 'luister naar die crunch' },
];
const PAN = { t0: 6.1, dur: 0.55 };
const END = { t0: 12.25 };
export const DURATION = 14.4;

// Build cuts, pieces, particles and sound events up-front (deterministic).
export const EVENTS = [];
const R = rng(20261020);

for (const [si, sc] of SCENES.entries()) {
  const f = FRUITS[sc.kind];
  sc.f = f;
  sc.cuts = f.cuts.map((u, i) => {
    const start = sc.intro + i * CUT_LEN;
    return { u, start, x: xOf(f, u), r: rOf(f, u) };
  });
  // pieces: piece i is the part right of cut i up to the previous cut
  sc.pieces = sc.cuts.map((c, i) => {
    const uB = i === 0 ? 1 : sc.cuts[i - 1].u;
    const tc = c.start + PH.press;
    const land = {
      x: [770, 590, 390][i],
      y: [1360, 1395, 1420][i],
    };
    return { uA: c.u, uB, tc, land, rot: (R() - 0.5) * 0.25 };
  });
  sc.particles = [];
  sc.cracks = [];
  for (const c of sc.cuts) {
    const yTop = f.cy - c.r, yBot = f.cy + c.r * BOTTOM * 0.96;
    for (let k = 0; k < PRESS_STEPS; k++) {
      const ts = c.start + PH.contact + (k / PRESS_STEPS) * (PH.press - PH.contact);
      const yAt = lerp(yTop, yBot, k / PRESS_STEPS);
      const strength = k === 0 ? 1 : 0.55 + R() * 0.35;
      EVENTS.push({ type: 'crack', t: sc.t0 + ts, strength, scene: si });
      // little sugar-glass shards
      const n = k === 0 ? 14 : 7;
      for (let j = 0; j < n; j++) {
        const dir = R() < 0.5 ? -1 : 1;
        sc.particles.push({
          t0: ts, x: c.x + dir * (4 + R() * 10), y: yAt + R() * 20,
          vx: dir * (90 + R() * 420), vy: -(160 + R() * 520),
          floor: f.cy + f.R * (0.98 + R() * 0.75),
          size: 5 + R() * (k === 0 ? 13 : 9), spin: (R() - 0.5) * 22, a0: R() * 6.28,
          col: R() < 0.3 ? '#ffffff' : R() < 0.6 ? f.glow : f.main,
          dust: R() < 0.35,
        });
      }
      const lines = [];
      const m = 3 + Math.floor(R() * 3);
      for (let j = 0; j < m; j++) {
        const dir = R() < 0.5 ? -1 : 1;
        const pts = [[c.x, yAt + (R() - 0.5) * 16]];
        let ang = (R() - 0.5) * 1.6;
        const len = 40 + R() * 90;
        for (let s = 1; s <= 5; s++) {
          ang += (R() - 0.5) * 0.9;
          const prev = pts[pts.length - 1];
          pts.push([prev[0] + dir * Math.cos(ang) * len / 5, prev[1] + Math.sin(ang) * len / 5]);
        }
        lines.push(pts);
      }
      sc.cracks.push({ t0: ts, lines });
    }
    EVENTS.push({ type: 'board', t: sc.t0 + c.start + PH.press, scene: si });
    EVENTS.push({ type: 'lift', t: sc.t0 + c.start + PH.lift, scene: si });
  }
  for (const p of sc.pieces) EVENTS.push({ type: 'land', t: sc.t0 + p.tc + FALL * 0.82, scene: si });
}
EVENTS.push({ type: 'whoosh', t: PAN.t0 - 0.05 });
EVENTS.push({ type: 'chime', t: END.t0 + 0.1 });

// shards bounce: add a tiny tink for the bigger ones when they first hit the board
for (const [si, sc] of SCENES.entries()) {
  for (const p of sc.particles) {
    if (p.dust || p.size < 9) continue;
    const g = 2400;
    const tHit = (-p.vy + Math.sqrt(p.vy * p.vy + 2 * g * (p.floor - p.y))) / g;
    EVENTS.push({ type: 'tink', t: sc.t0 + p.t0 + tHit, strength: p.size / 18, scene: si });
  }
}
EVENTS.sort((a, b) => a.t - b.t);

// ---------- static layers ------------------------------------------------
let BG, BOARD, FONT_OK = false;

function buildBackground() {
  const c = canvas(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#ffe3f1');
  g.addColorStop(0.5, '#f3e6ff');
  g.addColorStop(1, '#e0efff');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  const r = rng(7);
  const cols = ['#ffb3d4', '#d9c2ff', '#ffd6a8', '#b8e2ff', '#ffc7e3', '#c8f5dc'];
  x.filter = 'blur(26px)';
  for (let i = 0; i < 26; i++) {
    const rad = 40 + r() * 120;
    x.globalAlpha = 0.25 + r() * 0.35;
    x.fillStyle = cols[i % cols.length];
    x.beginPath();
    x.arc(r() * W, r() * 760 + (i % 4 === 0 ? 1500 : 0), rad, 0, Math.PI * 2);
    x.fill();
  }
  x.filter = 'blur(6px)';
  for (let i = 0; i < 40; i++) {
    x.globalAlpha = 0.25 + r() * 0.4;
    x.fillStyle = '#ffffff';
    x.beginPath();
    x.arc(r() * W, r() * 720, 6 + r() * 16, 0, Math.PI * 2);
    x.fill();
  }
  x.filter = 'none';
  x.globalAlpha = 1;
  return c;
}

const BOARD_RECT = { x: 50, y: 700, w: 980, h: 940, r: 70, depth: 46 };

function buildBoard() {
  const b = BOARD_RECT;
  const c = canvas(W, H), x = c.getContext('2d');
  const rr = (yOff, h) => {
    x.beginPath();
    x.roundRect(b.x, b.y + yOff, b.w, h, b.r);
  };
  // drop shadow
  x.save();
  x.filter = 'blur(30px)';
  x.globalAlpha = 0.28;
  x.fillStyle = '#8a3d6b';
  rr(40, b.h + b.depth);
  x.fill();
  x.restore();
  // thickness
  rr(b.depth, b.h);
  const side = x.createLinearGradient(0, b.y + b.h - 40, 0, b.y + b.h + b.depth);
  side.addColorStop(0, '#f0c9dc');
  side.addColorStop(1, '#d99bbb');
  x.fillStyle = side;
  x.fill();
  // marble top
  rr(0, b.h);
  const top = x.createLinearGradient(0, b.y, 0, b.y + b.h);
  top.addColorStop(0, '#fff7fb');
  top.addColorStop(1, '#ffe6f0');
  x.fillStyle = top;
  x.fill();
  x.save();
  rr(0, b.h);
  x.clip();
  const r = rng(99);
  for (let i = 0; i < 16; i++) {
    let px = b.x + r() * b.w, py = b.y + r() * b.h;
    x.beginPath();
    x.moveTo(px, py);
    const ang0 = r() * Math.PI;
    for (let s = 0; s < 12; s++) {
      const a = ang0 + (r() - 0.5) * 1.2;
      px += Math.cos(a) * 70; py += Math.sin(a) * 50;
      x.lineTo(px, py);
    }
    x.strokeStyle = i % 3 ? 'rgba(214,150,186,0.13)' : 'rgba(190,160,220,0.18)';
    x.lineWidth = 2 + r() * 5;
    x.filter = 'blur(2.5px)';
    x.stroke();
  }
  x.filter = 'none';
  // gentle sheen
  const sh = x.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  sh.addColorStop(0, 'rgba(255,255,255,0.55)');
  sh.addColorStop(0.35, 'rgba(255,255,255,0)');
  sh.addColorStop(1, 'rgba(255,255,255,0.15)');
  x.fillStyle = sh;
  x.fillRect(b.x, b.y, b.w, b.h);
  x.restore();
  // rim highlight
  rr(0, b.h);
  x.strokeStyle = 'rgba(255,255,255,0.9)';
  x.lineWidth = 3;
  x.stroke();
  return c;
}

export async function setup() {
  BG = buildBackground();
  BOARD = buildBoard();
  try {
    await document.fonts.load('800 80px "Baloo 2"');
    await document.fonts.load('80px "Noto Color Emoji"');
    FONT_OK = document.fonts.check('800 80px "Baloo 2"');
  } catch { FONT_OK = false; }
  return { fontOk: FONT_OK, events: EVENTS, duration: DURATION };
}

// ---------- fruit painting ----------------------------------------------
function paintSkin(ctx, f, t, uFrom, uTo, sceneKind) {
  const L = f.x1 - f.x0;
  ctx.save();
  bodyPath(ctx, f, uFrom, uTo);
  ctx.clip();
  // base: light falls from the top-left, colour deepens underneath
  const g = ctx.createLinearGradient(0, f.cy - f.R, 0, f.cy + f.R);
  g.addColorStop(0, f.light);
  g.addColorStop(0.3, f.main);
  g.addColorStop(0.78, f.dark);
  g.addColorStop(1, f.main);
  ctx.fillStyle = g;
  ctx.fillRect(f.x0 - 20, f.cy - f.R - 20, L + 40, f.R * 2 + 40);
  // light passing through the candy pools near the bottom
  softEllipse(ctx, f.x0 + L * 0.5, f.cy + f.R * 0.55, L * 0.42, f.R * 0.5, f.glow, 0.85);
  // inner core glow
  softEllipse(ctx, f.x0 + L * 0.42, f.cy + f.R * 0.05, L * 0.3, f.R * 0.42, '#ffffff', 0.18);
  // back-wall refraction line
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const u = lerp(0.06, 0.94, i / 60);
    const y = f.cy + rOf(f, u) * 0.62;
    i ? ctx.lineTo(xOf(f, u), y) : ctx.moveTo(xOf(f, u), y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 6;
  ctx.filter = 'blur(3px)';
  ctx.stroke();
  ctx.filter = 'none';
  // kiwi fuzz speckles
  if (sceneKind === 'kiwi') {
    const r = rng(5);
    for (let i = 0; i < 420; i++) {
      const u = r(), v = r() * 2 - 1;
      const rr = rOf(f, u);
      const x = xOf(f, u), y = f.cy + v * rr * 0.95;
      ctx.globalAlpha = 0.25 + r() * 0.3;
      ctx.fillStyle = r() < 0.7 ? '#6b4a1a' : '#f7ffd6';
      ctx.beginPath();
      ctx.ellipse(x, y, 1.4 + r() * 2.4, (1.4 + r() * 2.2) * Math.sqrt(1 - v * v + 0.05), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // strawberry seeds
  if (sceneKind === 'strawberry') {
    const r = rng(11);
    const rows = 9;
    for (let row = 0; row < rows; row++) {
      const v = lerp(-0.86, 0.86, row / (rows - 1));
      for (let k = 0; k < 13; k++) {
        const u = 0.09 + (k + (row % 2) * 0.5) / 13.6 * 0.86 + (r() - 0.5) * 0.01;
        if (u > 0.96) continue;
        const rr = rOf(f, u);
        const x = xOf(f, u) + (r() - 0.5) * 9, y = f.cy + (v + (r() - 0.5) * 0.07) * rr * 0.9;
        const s = Math.max(0.25, Math.sqrt(1 - v * v)) * Math.min(1, rr / (f.R * 0.55));
        // dimple
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = f.rim;
        ctx.beginPath();
        ctx.ellipse(x, y + 1.5, 8 * s + 1, 10 * s * Math.max(0.5, Math.sqrt(1 - v * v)), 0, 0, Math.PI * 2);
        ctx.fill();
        // golden sugar seed
        ctx.globalAlpha = 1;
        const sg = ctx.createLinearGradient(x, y - 7 * s, x, y + 7 * s);
        sg.addColorStop(0, '#fff3b0');
        sg.addColorStop(0.5, '#ffcf3d');
        sg.addColorStop(1, '#c47d06');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.ellipse(x, y, 4.2 * s + 0.6, 6.4 * s * Math.max(0.55, Math.sqrt(1 - v * v)) + 0.6, -0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(x - 1.2 * s, y - 2.2 * s, 1.3 * s + 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // dark glassy rim
  bodyPath(ctx, f, 0, 1);
  ctx.strokeStyle = f.rim;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 26;
  ctx.filter = 'blur(6px)';
  ctx.stroke();
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  // broad top-left highlight
  softEllipse(ctx, f.x0 + L * 0.3, f.cy - f.R * 0.62, L * 0.32, f.R * 0.3, '#ffffff', 0.55);
  ctx.restore();

  // specular streak along the top contour
  ctx.save();
  bodyPath(ctx, f, uFrom, uTo);
  ctx.clip();
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const u = lerp(0.12, 0.66, i / 40);
    const y = f.cy - rOf(f, u) * 0.74;
    i ? ctx.lineTo(xOf(f, u), y) : ctx.moveTo(xOf(f, u), y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 15;
  ctx.filter = 'blur(2.5px)';
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.filter = 'none';
  ctx.stroke();
  // little sliding glint
  const gp = (t * 0.35) % 1;
  softEllipse(ctx, xOf(f, lerp(0.1, 0.9, gp)), f.cy - rOf(f, lerp(0.1, 0.9, gp)) * 0.5, 60, 26, '#ffffff', 0.35);
  ctx.restore();
}

function paintLeaves(ctx, f) {
  const bx = f.x0 + 22, by = f.cy - 6;
  const leaves = [
    [-2.55, 120, 38], [-3.05, 132, 40], [2.7, 118, 36], [-2.1, 96, 32], [2.25, 98, 32], [3.5, 70, 26],
  ];
  for (const [a, len, w] of leaves) {
    const tx = bx + Math.cos(a) * len, ty = by + Math.sin(a) * len * 0.82;
    const nx = -Math.sin(a), ny = Math.cos(a);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + Math.cos(a) * len * 0.5 + nx * w, by + Math.sin(a) * len * 0.42 + ny * w, tx, ty);
    ctx.quadraticCurveTo(bx + Math.cos(a) * len * 0.5 - nx * w, by + Math.sin(a) * len * 0.42 - ny * w, bx, by);
    const g = ctx.createLinearGradient(bx, by - 60, bx, by + 60);
    g.addColorStop(0, '#c9ffd9');
    g.addColorStop(0.45, '#2fcf72');
    g.addColorStop(1, '#0b7a3a');
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(8,80,40,0.55)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(lerp(bx, tx, 0.85), lerp(by, ty, 0.85));
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // stem
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(bx - 40, by - 40, bx - 52, by - 92);
  ctx.strokeStyle = '#1d9c50';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220,255,230,0.75)';
  ctx.lineWidth = 5;
  ctx.stroke();
}

// Cross-section, drawn in a unit circle then squashed into (rx, ry).
function paintFace(ctx, kind, x, y, rx, ry, rot, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(rx, ry);
  const ring = (r, col) => { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); };
  if (kind === 'strawberry') {
    ring(1, '#c4002d');
    ring(0.9, '#ff5d86');
    ring(0.74, '#ffa7c1');
    ring(0.58, '#ffc49c');
    ring(0.43, '#a9f1cd');
    ring(0.28, '#fff4fa');
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 0.9, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 5;
      const r = 0.04 + 0.86 * (i / 120);
      i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 0.05;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,70,130,0.35)';
    ctx.lineWidth = 0.022;
    ctx.stroke();
    // golden seeds in the skin ring
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0.03, 0.045, a, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd34d';
      ctx.fill();
    }
    ctx.restore();
  } else {
    ring(1, '#6d4a17');
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.94);
    g.addColorStop(0, '#fffbe0');
    g.addColorStop(0.28, '#f0ff9c');
    g.addColorStop(0.55, '#9ee03a');
    g.addColorStop(1, '#3f9c14');
    ring(0.94, g);
    ctx.lineWidth = 0.012;
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 0.3, Math.sin(a) * 0.3);
      ctx.lineTo(Math.cos(a) * 0.9, Math.sin(a) * 0.9);
      ctx.strokeStyle = 'rgba(240,255,190,0.35)';
      ctx.stroke();
    }
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + (i % 2) * 0.05;
      const r = i % 2 ? 0.4 : 0.47;
      ctx.save();
      ctx.translate(Math.cos(a) * r, Math.sin(a) * r);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.055, 0.025, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1206';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-0.012, -0.008, 0.008, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
      ctx.restore();
    }
    ring(0.22, '#fff8d4');
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 ? 0.12 : 0.27;
      i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
  }
  // glassy gloss over the whole face
  const gl = ctx.createRadialGradient(-0.35, -0.45, 0, -0.35, -0.45, 0.9);
  gl.addColorStop(0, 'rgba(255,255,255,0.75)');
  gl.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fillStyle = gl;
  ctx.fill();
  ctx.lineWidth = 0.035;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.stroke();
  ctx.restore();
  // twinkle on the fresh cut
  const tw = 0.5 + 0.5 * Math.sin(t * 5 + x * 0.05);
  star(ctx, x - rx * 0.35, y - ry * 0.4, 14 + 8 * tw, 0.35 + 0.5 * tw);
}

// A piece that has been cut off: a swept stack of ellipses (the chunk),
// tipping from standing (θ=0) to lying flat with its cut face up (θ=1).
function paintPiece(ctx, sc, p, t) {
  const f = sc.f;
  const age = t - p.tc;
  if (age < 0) return;
  const q = clamp(age / FALL);
  const th = q < 0.82 ? easeIn(q / 0.82) : 1;
  const bounce = q >= 0.82 ? Math.sin(((q - 0.82) / 0.18) * Math.PI) * 10 : 0;
  const x0 = xOf(f, p.uA) + 6, y0 = f.cy;
  const mp = easeInOut(Math.min(1, q / 0.82));
  const fx = lerp(x0, p.land.x, mp);
  const fy = lerp(y0, p.land.y, mp) - Math.sin(mp * Math.PI) * 70 - bounce;
  const len = xOf(f, p.uB) - xOf(f, p.uA);
  const thick = Math.min(len, f.R * 0.5) * 0.42;
  const off = { x: len * (1 - th), y: thick * th };
  const rFace = rOf(f, p.uA);
  const rot = p.rot * th;

  // shadow on the board
  const sAlpha = 0.3 * clamp((q - 0.3) / 0.5);
  softEllipse(ctx, p.land.x + 8, p.land.y + thick + rFace * 0.62, rFace * 1.15, rFace * 0.42, '#7a2d55', sAlpha);
  softEllipse(ctx, p.land.x + 30, p.land.y + thick + rFace * 0.55, rFace * 0.9, rFace * 0.32, f.caustic, sAlpha * 1.3);

  const N = 18;
  for (let i = N; i >= 0; i--) {
    const k = i / N;
    const u = lerp(p.uA, p.uB, k);
    const rr = Math.max(2, rOf(f, u));
    const rx = rr * lerp(0.3, 1, th), ry = rr * lerp(1, 0.7, th);
    const cx = fx + off.x * k, cy = fy + off.y * k;
    const g = ctx.createLinearGradient(cx, cy - ry, cx, cy + ry);
    g.addColorStop(0, f.light);
    g.addColorStop(0.35, f.main);
    g.addColorStop(1, f.dark);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }
  // edge highlight on the chunk
  ctx.beginPath();
  ctx.ellipse(fx + off.x * 0.5, fy + off.y * 0.5 - rFace * lerp(0.7, 0.4, th), Math.max(8, len * (1 - th) * 0.4 + rFace * 0.4 * th), 6, rot, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
  paintFace(ctx, sc.kind, fx, fy, rFace * lerp(0.3, 1, th), rFace * lerp(1, 0.7, th), rot, t);
}

function paintCracks(ctx, sc, t, uLimit) {
  const f = sc.f;
  ctx.save();
  bodyPath(ctx, f, 0, uLimit);
  ctx.clip();
  ctx.lineJoin = 'round';
  for (const c of sc.cracks) {
    const age = t - c.t0;
    if (age < 0 || age > 0.7) continue;
    const grow = easeOut(clamp(age / 0.08));
    const a = 1 - clamp((age - 0.25) / 0.45);
    for (const pts of c.lines) {
      const n = Math.max(2, Math.ceil(pts.length * grow));
      ctx.beginPath();
      for (let i = 0; i < n; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.strokeStyle = `rgba(90,0,30,${0.35 * a})`;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * a})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function paintParticles(ctx, sc, t) {
  const g = 2400;
  for (const p of sc.particles) {
    let dt = t - p.t0;
    if (dt < 0) continue;
    let x, y, rest = false;
    const tHit = (-p.vy + Math.sqrt(p.vy * p.vy + 2 * g * (p.floor - p.y))) / g;
    if (dt < tHit) {
      x = p.x + p.vx * dt;
      y = p.y + p.vy * dt + 0.5 * g * dt * dt;
    } else {
      const vy2 = -(p.vy + g * tHit) * 0.3, vx2 = p.vx * 0.45;
      const t2 = -2 * vy2 / g;
      const d2 = dt - tHit;
      const xh = p.x + p.vx * tHit;
      if (d2 < t2) {
        x = xh + vx2 * d2;
        y = p.floor + vy2 * d2 + 0.5 * g * d2 * d2;
      } else {
        const slide = Math.min(d2 - t2, 0.25);
        x = xh + vx2 * t2 + vx2 * 0.5 * (slide - slide * slide * 2);
        y = p.floor;
        rest = true;
      }
    }
    if (p.dust) {
      const a = 1 - clamp(dt / 0.9);
      star(ctx, x, y - 10, p.size * 0.9, a * 0.9);
      continue;
    }
    const ang = p.a0 + (rest ? p.spin * 0.3 : p.spin * Math.min(dt, tHit + 0.3));
    const s = p.size;
    if (rest) softEllipse(ctx, x + 2, y + s * 0.4, s * 1.2, s * 0.45, '#7a2d55', 0.18);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.8, s * 0.5);
    ctx.lineTo(-s * 0.6, s * 0.7);
    ctx.closePath();
    ctx.fillStyle = p.col;
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    if (rest) star(ctx, x, y - s * 0.3, s * 0.7, 0.5 * (0.5 + 0.5 * Math.sin(t * 6 + p.a0 * 3)));
  }
}

// ---------- knife --------------------------------------------------------
const KE = { x: 0.46, y: 0.27 }; // blade-length direction on screen (towards the viewer)

function knifeAt(sc, lt) {
  const f = sc.f;
  const up = c => f.cy - c.r - 95;
  let prev = { x: sc.cuts[0].x + 260, y: -380 };
  for (let i = 0; i < sc.cuts.length; i++) {
    const c = sc.cuts[i];
    const T = lt - c.start;
    const aDur = i === 0 ? PH.approach + sc.intro : PH.approach;
    const aStart = i === 0 ? -sc.intro : 0;
    if (T < PH.end || i === sc.cuts.length - 1) {
      if (T < PH.approach) {
        const p = easeInOut(clamp((T - aStart) / aDur));
        return { x: lerp(prev.x, c.x, p), y: lerp(prev.y, up(c), p), tilt: lerp(0.08, 0, p) };
      }
      const yTop = f.cy - c.r, yBot = f.cy + c.r * BOTTOM * 0.96;
      if (T < PH.contact) {
        const p = easeIn((T - PH.approach) / (PH.contact - PH.approach));
        return { x: c.x, y: lerp(up(c), yTop, p), tilt: 0 };
      }
      if (T < PH.press) {
        // crunchy stepwise press: quick drop then a tiny pause, PRESS_STEPS times
        const p = (T - PH.contact) / (PH.press - PH.contact);
        const k = Math.floor(p * PRESS_STEPS), fr = p * PRESS_STEPS - k;
        const step = (k + easeOut(clamp(fr / 0.35))) / PRESS_STEPS;
        return { x: c.x + Math.sin(T * 60) * 0.8, y: lerp(yTop, yBot, step), tilt: 0 };
      }
      if (T < PH.lift) return { x: c.x, y: yBot, tilt: 0 };
      const p = easeInOut(clamp((T - PH.lift) / (PH.end - PH.lift)));
      if (i === sc.cuts.length - 1) {
        // exit to the top-right
        const p2 = easeIn(clamp((T - PH.lift) / 0.6));
        return { x: lerp(c.x, c.x + 380, p2), y: lerp(yBot, -420, p2), tilt: -0.1 * p2 };
      }
      return { x: c.x, y: lerp(yBot, up(c), p), tilt: 0 };
    }
    prev = { x: c.x, y: up(c) };
  }
  return prev;
}

const BL = { tip: -360, heel: 230 };
const edgeH = s => (s < -200 ? Math.pow((-200 - s) / 160, 2) * 80 : 0);
const spineH = s => (s > -80 ? 175 : lerp(80, 175, clamp((s + 360) / 280) ** 0.6));

function bladePath(ctx, K) {
  const P = (s, h) => [K.x + KE.x * s, K.y + KE.y * s - h * (1 + 0.0008 * s)];
  const pts = [];
  ctx.beginPath();
  for (let s = BL.tip; s <= BL.heel; s += 10) pts.push(P(s, edgeH(s)));
  for (let s = BL.heel; s >= BL.tip; s -= 10) pts.push(P(s, spineH(s)));
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return P;
}

function paintBlade(ctx, K, tint) {
  ctx.save();
  ctx.translate(K.x, K.y);
  ctx.rotate(K.tilt || 0);
  ctx.translate(-K.x, -K.y);
  const P = bladePath(ctx, K);
  const g = ctx.createLinearGradient(K.x, K.y + 40, K.x, K.y - 170);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.08, '#e9eef5');
  g.addColorStop(0.12, '#b9c3cf');
  g.addColorStop(0.55, '#dfe5ec');
  g.addColorStop(1, '#8e98a6');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // scene reflections in the steel
  softEllipse(ctx, K.x - 40, K.y - 50, 170, 50, tint, 0.4);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  const a = P(-150, 0), b = P(-80, 0), c = P(40, 180), d = P(-30, 180);
  ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
  ctx.fill();
  ctx.globalAlpha = 1;
  // bevel edge line
  ctx.beginPath();
  for (let s = BL.tip + 20; s <= BL.heel; s += 10) {
    const p = P(s, edgeH(s) + 8);
    s === BL.tip + 20 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
  }
  // spine shadow
  ctx.moveTo(...P(BL.tip + 30, spineH(BL.tip + 30) - 4));
  for (let s = BL.tip + 40; s <= BL.heel; s += 10) ctx.lineTo(...P(s, spineH(s) - 4));
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(70,80,95,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function paintHandle(ctx, K) {
  ctx.save();
  ctx.translate(K.x, K.y);
  ctx.rotate(K.tilt || 0);
  ctx.translate(-K.x, -K.y);
  const P = (s, h) => [K.x + KE.x * s, K.y + KE.y * s - h * (1 + 0.0008 * s)];
  // bolster
  const b0 = P(226, 172), b1 = P(254, 172), b2 = P(254, 96), b3 = P(226, 96);
  ctx.beginPath();
  ctx.moveTo(...b0); ctx.lineTo(...b1); ctx.lineTo(...b2); ctx.lineTo(...b3); ctx.closePath();
  ctx.fillStyle = '#9aa3ae';
  ctx.fill();
  // candy-pink resin handle, growing slightly as it comes towards the camera
  ctx.beginPath();
  const top = [], bot = [];
  for (let s = 252; s <= 540; s += 8) {
    const w = 28 + (s - 252) * 0.045 + Math.sin(((s - 252) / 288) * Math.PI) * 6;
    top.push(P(s, 134 + w));
    bot.push(P(s, 134 - w));
  }
  top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  const e = P(560, 134);
  ctx.quadraticCurveTo(e[0] + 18, e[1], bot[bot.length - 1][0], bot[bot.length - 1][1]);
  for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
  ctx.closePath();
  const m = P(400, 134);
  const g = ctx.createLinearGradient(m[0], m[1] - 70, m[0], m[1] + 70);
  g.addColorStop(0, '#ffd1e6');
  g.addColorStop(0.35, '#ff7fb3');
  g.addColorStop(1, '#b8326c');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,20,70,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // gloss + rivets
  ctx.beginPath();
  top.forEach((p, i) => { const q = [p[0], p[1] + 11]; i ? ctx.lineTo(...q) : ctx.moveTo(...q); });
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();
  for (const s of [310, 400, 490]) {
    const p = P(s, 134);
    const r = 7 + (s - 252) * 0.01;
    const rg = ctx.createRadialGradient(p[0] - 3, p[1] - 3, 1, p[0], p[1], r);
    rg.addColorStop(0, '#ffffff');
    rg.addColorStop(1, '#8c95a3');
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    ctx.fillStyle = rg;
    ctx.fill();
  }
  ctx.restore();
}

function paintKnife(ctx, sc, lt, uLimit, piecesAttached) {
  const f = sc.f;
  const K = knifeAt(sc, lt);
  if (!K || K.y < -600) return;
  const uK = clamp(uOf(f, K.x));
  const rK = uK > 0 && uK < 1 ? rOf(f, uK) : 0;
  const splitX = K.x + KE.x * rK;
  // the part of the blade inside/behind the candy is seen through the glass
  ctx.save();
  ctx.beginPath();
  ctx.rect(-200, -800, splitX + 200, H + 1600);
  ctx.clip();
  ctx.save();
  bodyPath(ctx, f, 0, piecesAttached);
  ctx.clip();
  ctx.globalAlpha = 0.42;
  paintBlade(ctx, K, f.caustic);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(-200, -800, W + 400, H + 1600);
  bodyPath(ctx, f, 0, piecesAttached, false);
  ctx.clip('evenodd');
  paintBlade(ctx, K, f.caustic);
  ctx.restore();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(splitX, -800, W + 800, H + 1600);
  ctx.clip();
  paintBlade(ctx, K, f.caustic);
  ctx.restore();
  paintHandle(ctx, K);
}

// ---------- world (one fruit on its board) ------------------------------
function paintWorld(ctx, sc, lt) {
  const f = sc.f;
  const L = f.x1 - f.x0;
  ctx.drawImage(BOARD, 0, 0);

  // which part of the fruit is still whole?
  let uBody = 1;
  for (const p of sc.pieces) if (lt >= p.tc) uBody = p.uA;
  // piecesAttached = extent of the silhouette that the knife can be inside
  const attached = uBody;

  // shadow + coloured caustic light under the glass fruit
  const bodyLen = xOf(f, uBody) - f.x0;
  softEllipse(ctx, f.x0 + bodyLen * 0.5, f.cy + f.R * 0.86, bodyLen * 0.56, f.R * 0.3, '#7a2d55', 0.35);
  softEllipse(ctx, f.x0 + bodyLen * 0.62, f.cy + f.R * 0.98, bodyLen * 0.5, f.R * 0.26, f.caustic, 0.55);
  softEllipse(ctx, f.x0 + bodyLen * 0.7, f.cy + f.R * 1.0, bodyLen * 0.2, f.R * 0.1, '#ffffff', 0.5);

  // remaining body
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, xOf(f, uBody) + (uBody < 1 ? 0.5 : 400), H);
  ctx.clip();
  paintSkin(ctx, f, lt, 0, 1, sc.kind);
  ctx.restore();
  if (sc.kind === 'strawberry') paintLeaves(ctx, f);
  if (uBody < 1) {
    const r = rOf(f, uBody);
    paintFace(ctx, sc.kind, xOf(f, uBody), f.cy - r * 0.02, r * 0.3, r * 0.99, 0, lt);
  }
  paintCracks(ctx, sc, lt, attached);

  // ambient sugar twinkles on the skin
  const r = rng(3 + sc.kind.length);
  for (let i = 0; i < 7; i++) {
    const u = 0.1 + r() * Math.max(0, uBody - 0.15);
    const x = xOf(f, u), y = f.cy - rOf(f, u) * (0.2 + r() * 0.6);
    const ph = r() * 6.28;
    const a = Math.max(0, Math.sin(lt * 2.4 + ph));
    star(ctx, x, y, 10 + 10 * a, a * a * 0.9);
  }

  // pieces: far (higher) first
  const order = [...sc.pieces].sort((a, b) => a.land.y - b.land.y);
  for (const p of order) paintPiece(ctx, sc, p, lt);
  paintParticles(ctx, sc, lt);
  paintKnife(ctx, sc, lt, attached, attached);
}

// ---------- text ---------------------------------------------------------
function font(px) {
  return `800 ${px}px ${FONT_OK ? '"Baloo 2"' : '"DejaVu Sans"'}, "Noto Color Emoji", sans-serif`;
}

function pillText(ctx, parts, x, y, px, appear) {
  // parts: [text, emoji?]
  const s = backOut(clamp(appear));
  if (appear <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = clamp(appear * 3);
  ctx.font = font(px);
  ctx.textBaseline = 'middle';
  const [txt, emo = ''] = parts;
  const wt = ctx.measureText(txt).width;
  const we = emo ? ctx.measureText(' ' + emo).width : 0;
  let total = wt + we;
  const fit = Math.min(1, 930 / total);
  ctx.scale(fit, fit);
  ctx.lineJoin = 'round';
  ctx.lineWidth = px * 0.22;
  ctx.strokeStyle = '#e0457f';
  ctx.shadowColor = 'rgba(120,20,70,0.35)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.strokeText(txt, -total / 2, 0);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(txt, -total / 2, 0);
  if (emo) ctx.fillText(' ' + emo, -total / 2 + wt, px * 0.02);
  ctx.restore();
}

function smallTag(ctx, text, x, y, appear) {
  if (appear <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(appear * 2);
  ctx.font = font(40);
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 56;
  ctx.translate(x, y + (1 - easeOut(clamp(appear))) * 20);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -34, w, 68, 34);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fill();
  ctx.fillStyle = '#4b3346';
  ctx.textAlign = 'center';
  ctx.fillText(text, 0, 2);
  ctx.restore();
}

function paintCandyIcon(ctx, x, y, r, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 2) * 0.08);
  const wrap = ctx.createLinearGradient(-r, -r, r, r);
  wrap.addColorStop(0, '#ffd7ea');
  wrap.addColorStop(1, '#c93f76');
  ctx.fillStyle = wrap;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sgn * r * 0.8, 0);
    ctx.lineTo(sgn * r * 1.75, -r * 0.62);
    ctx.lineTo(sgn * r * 1.6, 0);
    ctx.lineTo(sgn * r * 1.75, r * 0.62);
    ctx.closePath();
    ctx.fill();
  }
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0, 0, 0, r * 1.1);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.3, '#ffd7ea');
  g.addColorStop(0.65, '#ff8ec0');
  g.addColorStop(1, '#c93f76');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const a = (i / 60) * Math.PI * 3.2;
    const rr = r * 0.85 * (i / 60);
    i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(0, 0);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = r * 0.12;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

function paintEndCard(ctx, t) {
  const p = clamp((t - END.t0) / 0.5);
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.55 * p;
  ctx.fillStyle = '#ffeef6';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const s = backOut(p);
  ctx.save();
  ctx.translate(W / 2, 880);
  ctx.scale(s, s);
  ctx.globalAlpha = clamp(p * 2);
  ctx.beginPath();
  ctx.roundRect(-420, -260, 840, 520, 64);
  ctx.fillStyle = 'rgba(255,253,251,0.96)';
  ctx.shadowColor = 'rgba(160,40,100,0.25)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 16;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffdcea';
  ctx.stroke();
  paintCandyIcon(ctx, 0, -150, 58, t);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(92);
  ctx.fillStyle = '#4b3346';
  ctx.fillText("Lieke's Candy", 0, -20);
  ctx.font = font(46);
  ctx.fillStyle = '#e0457f';
  ctx.fillText('Welke snoepfruit is de volgende?', 0, 80);
  ctx.font = font(40);
  ctx.fillStyle = '#8b7285';
  ctx.fillText('Laat het weten in de reacties 👇', 0, 160);
  ctx.restore();
}

// ---------- main render -------------------------------------------------
let WORLD;

export function render(ctx, t) {
  if (!WORLD) WORLD = canvas(W, H);
  const wx = WORLD.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // background with a little parallax during the whip-pan
  const pp = clamp((t - PAN.t0) / PAN.dur);
  const pe = easeInOut(pp);
  ctx.drawImage(BG, 0, 0);

  const drawScene = (si, offX) => {
    const sc = SCENES[si];
    const lt = t - sc.t0;
    wx.setTransform(1, 0, 0, 1, 0, 0);
    wx.clearRect(0, 0, W, H);
    // camera: slow push-in + a tiny knock when the knife hits the board
    const zoom = 1.15 + 0.07 * easeInOut(clamp(lt / 6));
    let shake = 0;
    for (const e of EVENTS) {
      if (e.type !== 'board' || e.scene !== si) continue;
      const d = t - e.t;
      if (d >= 0 && d < 0.18) shake += Math.sin(d * 90) * 5 * (1 - d / 0.18);
    }
    wx.translate(W / 2, 1060);
    wx.scale(zoom, zoom);
    wx.translate(-W / 2, -1060 + shake);
    paintWorld(wx, sc, lt);
    wx.setTransform(1, 0, 0, 1, 0, 0);
    if (pp > 0 && pp < 1) {
      // cheap motion blur while panning
      const v = Math.sin(pp * Math.PI) * 70;
      for (let k = 0; k < 5; k++) {
        ctx.globalAlpha = 0.2;
        ctx.drawImage(WORLD, offX + (k - 2) * v * 0.5, 0);
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.drawImage(WORLD, offX, 0);
    }
  };

  if (t < PAN.t0) drawScene(0, 0);
  else if (pp < 1) { drawScene(0, -W * pe); drawScene(1, W * (1 - pe)); }
  else drawScene(1, 0);

  // hook text per scene
  for (const [si, sc] of SCENES.entries()) {
    const lt = t - sc.t0;
    const shown = si === 0 ? t < PAN.t0 + 0.2 : t >= PAN.t0;
    if (!shown) continue;
    const off = si === 0 ? -W * pe : W * (1 - pe);
    const out = si === 0 ? 1 : 1 - clamp((t - END.t0) / 0.3);
    ctx.save();
    ctx.translate(off, 0);
    ctx.globalAlpha = out;
    pillText(ctx, sc.hook, W / 2, 300, 80, si === 0 ? (t + 0.15) / 0.45 : (lt - 0.35) / 0.45);
    smallTag(ctx, sc.sub, W / 2, 405, si === 0 ? (t - 0.35) / 0.4 : (lt - 0.6) / 0.4);
    ctx.restore();
  }

  paintEndCard(ctx, t);
}
