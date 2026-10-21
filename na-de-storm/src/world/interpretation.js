// Kleurnotities: abstracte samenvattingen van kleur en compositie van werken die
// nog auteursrechtelijk beschermd zijn. Ze zijn uitdrukkelijk GEEN reproductie;
// elke notitie draagt dat label in het beeld zelf.
// Daarnaast: het digitaal gegenereerde eigen doek van de curatoren.

function rng(seedStr) {
  let h = 2166136261;
  for (const ch of seedStr) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  let s = h >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 1000003) / 1000003;
  };
}

function dims(art, long = 1024) {
  const w = art.size?.w || 100, h = art.size?.h || 100;
  return w >= h ? [long, Math.round(long * h / w)] : [Math.round(long * w / h), long];
}

const cache = new Map();

export function interpretationCanvas(art) {
  if (cache.has(art.id)) return cache.get(art.id);
  const [W, H] = dims(art);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const r = rng(art.id);
  const pal = art.interpretation.palette;
  const scheme = art.interpretation.scheme;
  const draw = SCHEMES[scheme] || SCHEMES.figuratief;
  draw(g, W, H, pal, r);
  grain(g, W, H, r);
  label(g, W, H);
  cache.set(art.id, c);
  return c;
}

function grain(g, W, H, r) {
  for (let i = 0; i < (W * H) / 220; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() * 0.05})`;
    g.fillRect(r() * W, r() * H, 1.5, 1.5);
  }
}

function label(g, W, H) {
  const bh = Math.max(26, Math.round(H * 0.055));
  g.fillStyle = 'rgba(12,12,12,0.72)';
  g.fillRect(0, H - bh, W, bh);
  g.fillStyle = '#f3efe6';
  const fs = Math.round(bh * 0.42);
  g.font = `600 ${fs}px "Inter Variable", Arial, sans-serif`;
  g.textBaseline = 'middle';
  const text = W > 640 ? 'KLEURNOTITIE · interpretatie door de curatoren · geen reproductie' : 'KLEURNOTITIE · geen reproductie';
  g.fillText(text, Math.round(bh * 0.4), H - bh / 2);
  g.textBaseline = 'alphabetic';
}

function soft(g, x, y, rx, ry, color, alpha = 1) {
  g.save();
  g.translate(x, y);
  g.scale(1, ry / rx);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  grad.addColorStop(0, hexA(color, alpha));
  grad.addColorStop(0.6, hexA(color, alpha * 0.6));
  grad.addColorStop(1, hexA(color, 0));
  g.fillStyle = grad;
  g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
  g.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function stroke(g, pts, color, width, alpha = 1) {
  g.strokeStyle = hexA(color, alpha);
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  g.stroke();
}

function wander(r, x, y, n, step, W, H) {
  const pts = [[x, y]];
  let a = r() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    a += (r() - 0.5) * 1.6;
    x = Math.max(-20, Math.min(W + 20, x + Math.cos(a) * step));
    y = Math.max(-20, Math.min(H + 20, y + Math.sin(a) * step));
    pts.push([x, y]);
  }
  return pts;
}

const SCHEMES = {
  // gestapelde, zachtrandige kleurvlakken
  velden(g, W, H, pal, r) {
    g.fillStyle = pal[0]; g.fillRect(0, 0, W, H);
    const blocks = pal.slice(1);
    const m = W * 0.07;
    const gap = H * 0.035;
    const total = H - m * 2 - gap * (blocks.length - 1);
    const hs = [0.42, 0.18, 0.4].slice(0, blocks.length);
    const sum = hs.reduce((a, b) => a + b, 0);
    let y = m;
    blocks.forEach((col, i) => {
      const bh = total * hs[i] / sum;
      for (let k = 0; k < 26; k++) {
        g.fillStyle = hexA(col, 0.08);
        const j = (r() - 0.5) * 10;
        g.fillRect(m + j, y + j, W - m * 2 - j * 2, bh - j * 2);
      }
      g.fillStyle = hexA(col, 0.65);
      g.fillRect(m + 8, y + 8, W - m * 2 - 16, bh - 16);
      y += bh + gap;
    });
  },
  // één veld met een verticale streep
  zip(g, W, H, pal) {
    g.fillStyle = pal[0]; g.fillRect(0, 0, W, H);
    const grad = g.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, hexA(pal[1], 0.5)); grad.addColorStop(0.5, hexA(pal[0], 0)); grad.addColorStop(1, hexA(pal[1], 0.5));
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    const zw = W * 0.045;
    g.fillStyle = pal[2];
    g.beginPath();
    g.moveTo(W / 2 - zw / 2, 0);
    for (let y = 0; y <= H; y += 12) g.lineTo(W / 2 - zw / 2 + Math.sin(y * 0.13) * 1.6, y);
    for (let y = H; y >= 0; y -= 12) g.lineTo(W / 2 + zw / 2 + Math.cos(y * 0.11) * 1.6, y);
    g.closePath(); g.fill();
  },
  // netwerk van dunne slierten (druiptechniek)
  web(g, W, H, pal, r) {
    g.fillStyle = pal[0]; g.fillRect(0, 0, W, H);
    const cols = pal.slice(1);
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < 70; i++) {
        const col = cols[Math.floor(r() * cols.length)];
        const pts = wander(r, r() * W, r() * H, 18 + r() * 30, 18 + r() * 40, W, H);
        stroke(g, pts, col, 0.6 + r() * (pass === 0 ? 7 : 3), 0.5 + r() * 0.45);
      }
      for (let i = 0; i < 90; i++) {
        g.fillStyle = hexA(cols[Math.floor(r() * cols.length)], 0.7);
        g.beginPath(); g.arc(r() * W, r() * H, 1 + r() * 5, 0, Math.PI * 2); g.fill();
      }
    }
  },
  // brede, krachtige penseelstreken
  gebaar(g, W, H, pal, r) {
    g.fillStyle = pal[0]; g.fillRect(0, 0, W, H);
    const cols = pal.slice(1);
    for (let i = 0; i < 120; i++) {
      const col = cols[Math.floor(r() * cols.length)];
      const x = r() * W, y = r() * H, len = 40 + r() * W * 0.35, a = r() * Math.PI;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        pts.push([x + Math.cos(a) * len * t + (r() - 0.5) * 30, y + Math.sin(a) * len * t + (r() - 0.5) * 30]);
      }
      stroke(g, pts, col, 6 + r() * 26, 0.35 + r() * 0.5);
    }
    for (let i = 0; i < 40; i++) {
      stroke(g, wander(r, r() * W, r() * H, 8, 30, W, H), pal[1] || '#111', 2 + r() * 4, 0.8);
    }
  },
  // raster van kleine, dikke tekens
  raster(g, W, H, pal, r) {
    g.fillStyle = pal[0]; g.fillRect(0, 0, W, H);
    const cols = pal.slice(1);
    const cell = Math.round(W / 14);
    for (let y = cell * 0.6; y < H - cell * 0.4; y += cell) {
      for (let x = cell * 0.6; x < W - cell * 0.4; x += cell) {
        const col = cols[Math.floor(r() * cols.length)];
        g.strokeStyle = hexA(col, 0.9);
        g.lineWidth = 5 + r() * 6;
        g.lineCap = 'round';
        g.beginPath();
        const n = 2 + Math.floor(r() * 3);
        g.moveTo(x + (r() - 0.5) * cell * 0.6, y + (r() - 0.5) * cell * 0.6);
        for (let k = 0; k < n; k++) g.lineTo(x + (r() - 0.5) * cell * 0.7, y + (r() - 0.5) * cell * 0.7);
        g.stroke();
      }
    }
  },
  // lichte ondergrond met zwevende tekens en verbindingslijnen
  tekens(g, W, H, pal, r) {
    g.fillStyle = pal[0]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) soft(g, r() * W, r() * H, 60 + r() * 140, 40 + r() * 90, '#ffffff', 0.12);
    const pts = [];
    for (let i = 0; i < 48; i++) pts.push([W * 0.05 + r() * W * 0.9, H * 0.06 + r() * H * 0.82]);
    g.strokeStyle = hexA(pal[1], 0.85); g.lineWidth = 1.6;
    for (let i = 0; i < pts.length - 1; i += 2) {
      g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[i + 1]); g.stroke();
    }
    pts.forEach(([x, y], i) => {
      const col = pal[1 + (i % (pal.length - 1))];
      const s = 6 + r() * 16;
      g.fillStyle = col;
      if (i % 3 === 0) { g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); }
      else if (i % 3 === 1) {
        g.beginPath();
        for (let k = 0; k < 10; k++) {
          const rr = k % 2 ? s * 0.4 : s;
          const a = (k / 10) * Math.PI * 2;
          g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        g.closePath(); g.fill();
      } else { g.fillRect(x - s / 2, y - s / 6, s, s / 3); }
    });
  },
  // vlakke, omlijnde vormen
  vlakken(g, W, H, pal, r) {
    g.fillStyle = pal[pal.length - 1]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      const col = pal[Math.floor(r() * (pal.length - 1))];
      g.fillStyle = hexA(col, 0.9);
      g.strokeStyle = '#141414'; g.lineWidth = 4;
      const x = r() * W, y = r() * H, w = 40 + r() * W * 0.32, h = 40 + r() * H * 0.32;
      g.beginPath();
      if (r() > 0.45) g.rect(x - w / 2, y - h / 2, w, h);
      else g.ellipse(x, y, w / 2, h / 2, r() * Math.PI, 0, Math.PI * 2);
      g.fill(); g.stroke();
    }
  },
  // zachte kleurmassa's die een sfeer samenvatten
  figuratief(g, W, H, pal, r) {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, pal[pal.length - 2] || pal[0]);
    grad.addColorStop(1, pal[0]);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const col = pal[Math.floor(r() * pal.length)];
      soft(g, r() * W, r() * H, 40 + r() * W * 0.28, 30 + r() * H * 0.25, col, 0.35 + r() * 0.4);
    }
  },
  // papierknipsel: platte, organische vormen
  knipsel(g, W, H, pal, r) {
    g.fillStyle = pal[0]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = pal[2];
      const x = r() * W, y = r() * H, s = 18 + r() * 34;
      g.beginPath();
      for (let k = 0; k < 12; k++) {
        const rr = k % 2 ? s * (0.3 + r() * 0.2) : s;
        const a = (k / 12) * Math.PI * 2;
        g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      g.closePath(); g.fill();
    }
    g.fillStyle = pal[1];
    g.beginPath();
    const cx = W / 2, cy = H / 2;
    for (let k = 0; k <= 40; k++) {
      const a = (k / 40) * Math.PI * 2;
      const rr = Math.min(W, H) * (0.18 + 0.08 * Math.sin(a * 3) + 0.04 * r());
      g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr * 0.75, cy + Math.sin(a) * rr * 1.3);
    }
    g.closePath(); g.fill();
    g.fillStyle = pal[3];
    g.beginPath(); g.arc(cx + W * 0.02, cy - H * 0.06, Math.min(W, H) * 0.035, 0, Math.PI * 2); g.fill();
  },
  // vloeiende contourlijnen (ontwerp)
  contour(g, W, H, pal, r) {
    g.fillStyle = pal[0]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) {
      const col = pal[1 + (i % (pal.length - 1))];
      g.strokeStyle = hexA(col, 0.75);
      g.lineWidth = 10 + r() * 18;
      g.lineCap = 'round';
      g.beginPath();
      const y0 = H * (0.15 + r() * 0.7);
      g.moveTo(W * 0.08, y0);
      g.bezierCurveTo(W * 0.35, y0 - H * (0.2 + r() * 0.3), W * 0.6, y0 + H * (0.2 + r() * 0.3), W * 0.92, y0 - H * 0.05);
      g.stroke();
    }
  },
  // gebroken, hoekige vlakken in grijstinten
  scherven(g, W, H, pal, r) {
    g.fillStyle = pal[2]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = hexA(pal[Math.floor(r() * pal.length)], 0.55 + r() * 0.4);
      const x = r() * W, y = r() * H, s = 30 + r() * W * 0.18;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.3) * s, y + (r() - 0.5) * s);
      g.lineTo(x + (r() - 0.7) * s, y + (r() - 0.2) * s);
      g.closePath(); g.fill();
    }
    g.strokeStyle = hexA(pal[0], 0.8);
    for (let i = 0; i < 30; i++) {
      g.lineWidth = 1 + r() * 3;
      g.beginPath(); g.moveTo(r() * W, r() * H); g.lineTo(r() * W, r() * H); g.stroke();
    }
  }
};

// ── Eigen praktijkwerk: ‘Studie: storm en stilte’ ──
let ownCanvas = null;
export function ownPaintingCanvas() {
  if (ownCanvas) return ownCanvas;
  const W = 1600, H = Math.round(1600 * 260 / 420);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const r = rng('storm-en-stilte');
  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#2a2622');
  grad.addColorStop(0.45, '#6b5a45');
  grad.addColorStop(0.7, '#d9cdb4');
  grad.addColorStop(1, '#efe8da');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  // rustige kleurvelden rechts
  [['#c99a3e', 0.62, 0.18], ['#2f5d8a', 0.78, 0.5], ['#b5463a', 0.9, 0.78]].forEach(([col, x, y]) => {
    for (let k = 0; k < 18; k++) {
      g.fillStyle = hexA(col, 0.06);
      g.fillRect(W * x - 140 + r() * 8, H * y - 70 + r() * 8, 260, 150);
    }
  });
  // chaos links, afnemend naar rechts
  const dark = ['#0f0f0f', '#3a2c22', '#7a3d1d', '#5a5a58', '#c8c0b0'];
  for (let i = 0; i < 900; i++) {
    const x = Math.pow(r(), 1.8) * W;
    const calm = x / W;
    const col = dark[Math.floor(r() * dark.length)];
    const pts = wander(r, x, r() * H, 6 + (1 - calm) * 24, 14 + (1 - calm) * 34, W, H);
    stroke(g, pts, col, 0.5 + (1 - calm) * r() * 7, (1 - calm) * 0.8 + 0.08);
  }
  // de lichte ‘zip’
  g.fillStyle = 'rgba(250,244,228,0.92)';
  g.fillRect(W * 0.71, 0, W * 0.012, H);
  grain(g, W, H, r);
  ownCanvas = c;
  return c;
}
