import * as THREE from 'three';

// Procedurele texturen op <canvas>. Alles wordt in de browser gemaakt, zodat er
// geen externe textuurbestanden nodig zijn.

let anisotropy = 4;
export function setAnisotropy(a) { anisotropy = a; }

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(c, { repeat = true, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = anisotropy;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function shade(hex, amt) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return '#' + c.getHexString();
}

// Gepleisterde wand: zachte, grote variatie plus fijne korrel. Tegel = 2,2 m.
function softBlob(g, x, y, rad, rgb, alpha) {
  const grad = g.createRadialGradient(x, y, 0, x, y, rad);
  grad.addColorStop(0, `rgba(${rgb},${alpha})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
}

export function plasterTexture(base, seed = 1) {
  const S = 512, c = canvas(S, S), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) {
    const x = r() * S, y = r() * S, rad = 40 + r() * 140;
    // ook net over de rand tekenen, zodat de tegel naadloos herhaalt
    for (const [dx, dy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) softBlob(g, x + dx, y + dy, rad, r() > 0.5 ? '255,255,255' : '0,0,0', 0.018);
  }
  const img = g.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 7;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  return toTexture(c);
}

// Houten vloer: planken met nerf. Tegel = 4 m.
export function woodTexture(base, seed = 2) {
  const c = canvas(1024, 1024), g = c.getContext('2d'), r = rng(seed);
  const rows = 16, h = 1024 / rows;
  for (let row = 0; row < rows; row++) {
    let x = -r() * 400;
    while (x < 1024) {
      const len = 260 + r() * 380;
      g.fillStyle = shade(base, (r() - 0.5) * 0.07);
      g.fillRect(x, row * h, len, h);
      for (let k = 0; k < 14; k++) {
        const yy = row * h + r() * h;
        g.strokeStyle = `rgba(0,0,0,${0.04 + r() * 0.08})`;
        g.lineWidth = 0.6 + r() * 1.6;
        g.beginPath();
        g.moveTo(x, yy);
        g.bezierCurveTo(x + len * 0.3, yy + (r() - 0.5) * 6, x + len * 0.7, yy + (r() - 0.5) * 6, x + len, yy + (r() - 0.5) * 4);
        g.stroke();
      }
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(x, row * h, 2, h);
      x += len;
    }
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(0, row * h, 1024, 2);
  }
  return toTexture(c);
}

// Natuursteen / beton / terrazzo. Tegel = 2 tot 4 m.
export function stoneTexture(base, { seed = 3, tiles = 2, speckle = 0, joint = 0.25 } = {}) {
  const S = 1024, c = canvas(S, S), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 420; i++) {
    const x = r() * S, y = r() * S, rad = 20 + r() * 160;
    softBlob(g, x, y, rad, r() > 0.5 ? '255,255,255' : '0,0,0', 0.03);
  }
  const img = g.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 9;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  if (speckle) {
    for (let i = 0; i < speckle; i++) {
      const x = r() * S, y = r() * S, rad = 0.8 + r() * 3.2;
      const v = r();
      g.fillStyle = v > 0.66 ? 'rgba(70,64,58,0.75)' : v > 0.33 ? 'rgba(160,122,92,0.6)' : 'rgba(245,242,235,0.75)';
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
  }
  if (tiles > 0) {
    g.strokeStyle = `rgba(0,0,0,${joint})`;
    g.lineWidth = 2;
    for (let i = 0; i <= tiles; i++) {
      const p = (i / tiles) * S;
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p, S); g.stroke();
      g.beginPath(); g.moveTo(0, p); g.lineTo(S, p); g.stroke();
    }
  }
  return toTexture(c);
}

export function checkerTexture(a = '#1b1c1e', b = '#d9d2c3') {
  const S = 512, c = canvas(S, S), g = c.getContext('2d'), r = rng(9);
  const n = 2;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = (i + j) % 2 ? a : b;
    g.fillRect(i * S / n, j * S / n, S / n, S / n);
  }
  for (let i = 0; i < 200; i++) softBlob(g, r() * S, r() * S, 10 + r() * 50, r() > 0.5 ? '255,255,255' : '0,0,0', 0.035);
  return toTexture(c);
}

// Ruwheidsvariatie voor vloeren (grijswaarden, lineair).
export function roughnessTexture(seed = 5, base = 160, spread = 50) {
  const S = 256, c = canvas(S, S), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 400; i++) {
    const v = Math.max(0, Math.min(255, base + (r() - 0.5) * spread * 2));
    g.fillStyle = `rgba(${v},${v},${v},0.25)`;
    g.beginPath(); g.arc(r() * S, r() * S, 4 + r() * 30, 0, Math.PI * 2); g.fill();
  }
  return toTexture(c, { srgb: false });
}

// Zachte radiale lichtvlek voor 'lichtbundels' op de wand (additief).
let washTex = null;
export function washTexture() {
  if (washTex) return washTex;
  const S = 256, c = canvas(S, S), g = c.getContext('2d');
  const grad = g.createRadialGradient(S / 2, S * 0.42, 0, S / 2, S * 0.5, S * 0.5);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  washTex = toTexture(c, { repeat: false });
  return washTex;
}

// Verloop van donker naar transparant: nep-ambient-occlusion langs muren.
let aoTex = null;
export function aoTexture() {
  if (aoTex) return aoTex;
  const c = canvas(8, 128), g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.25, 'rgba(0,0,0,0.45)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 8, 128);
  aoTex = toTexture(c, { repeat: false });
  return aoTex;
}

// Lichtbundel (verticale gradiënt) voor de oculus in de finale.
export function beamTexture() {
  const c = canvas(64, 256), g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255,248,230,0.55)');
  grad.addColorStop(1, 'rgba(255,248,230,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 256);
  const h = g.createLinearGradient(0, 0, 64, 0);
  h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = h; g.fillRect(0, 0, 64, 256);
  return toTexture(c, { repeat: false });
}

// Lucht voor buiten (gradiënt + wolken), gebruikt achter de ramen.
export function skyTexture() {
  const W = 1024, H = 512, c = canvas(W, H), g = c.getContext('2d'), r = rng(11);
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#7fa6cf');
  grad.addColorStop(0.55, '#c9dbea');
  grad.addColorStop(1, '#efe6d6');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    const x = r() * W, y = 60 + r() * H * 0.45, w = 60 + r() * 220;
    const cg = g.createRadialGradient(x, y, 0, x, y, w);
    cg.addColorStop(0, 'rgba(255,255,255,0.35)');
    cg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = cg;
    g.beginPath(); g.ellipse(x, y, w, w * 0.32, 0, 0, Math.PI * 2); g.fill();
  }
  return toTexture(c, { repeat: false });
}

// Neutraal linnen met tekst, zolang een afbeelding nog laadt of als ze mislukt.
export function placeholderCanvas(art, message) {
  const W = 800, H = Math.max(300, Math.round(800 * ((art.size?.h || 80) / (art.size?.w || 100))));
  const c = canvas(W, Math.min(H, 1400)), g = c.getContext('2d');
  g.fillStyle = '#d8d1c3'; g.fillRect(0, 0, c.width, c.height);
  const r = rng(7);
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(0,0,0,${r() * 0.05})`;
    g.fillRect(r() * c.width, r() * c.height, 1, 2 + r() * 4);
  }
  g.fillStyle = '#3a352d';
  g.textAlign = 'center';
  g.font = '600 34px "Cormorant Garamond", Georgia, serif';
  wrapText(g, art.title, c.width / 2, c.height / 2 - 30, c.width - 120, 38);
  g.font = '500 22px "Inter Variable", Arial, sans-serif';
  g.fillStyle = '#6a6356';
  g.fillText(message, c.width / 2, c.height / 2 + 60);
  return c;
}

export function wrapText(g, text, x, y, maxW, lineH) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => g.fillText(l, x, y + i * lineH));
  return lines.length;
}
