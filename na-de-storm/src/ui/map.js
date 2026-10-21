import { ROOMS, DOORS, ROOM_BY_ID, WALL_T } from '../data/rooms.js';
import { doorCenter } from '../world/layout.js';

const BOUNDS = { minX: -11, maxX: 37.6, minZ: -71.8, maxZ: 23 };

// Tekent de plattegrond (noorden boven). Retourneert de transformatie,
// zodat klikken op de kaart naar een zaal kan worden vertaald.
export function drawMap(ctx, W, H, state) {
  const pad = state.full ? 24 : 8;
  const sx = (W - pad * 2) / (BOUNDS.maxX - BOUNDS.minX);
  const sz = (H - pad * 2) / (BOUNDS.maxZ - BOUNDS.minZ);
  const s = Math.min(sx, sz);
  const ox = pad + ((W - pad * 2) - (BOUNDS.maxX - BOUNDS.minX) * s) / 2;
  const oz = pad + ((H - pad * 2) - (BOUNDS.maxZ - BOUNDS.minZ) * s) / 2;
  const X = (x) => ox + (x - BOUNDS.minX) * s;
  const Z = (z) => oz + (z - BOUNDS.minZ) * s;

  ctx.clearRect(0, 0, W, H);
  if (!state.full) {
    ctx.fillStyle = 'rgba(14,13,11,0.72)';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 12); ctx.fill();
  }

  for (const r of ROOMS) {
    const [x0, x1, z0, z1] = r.rect;
    const cur = r.id === state.currentRoom;
    const next = r.id === state.nextRoom;
    const hl = r.id === state.highlightRoom;
    ctx.fillStyle = cur ? 'rgba(201,165,106,0.45)' : hl ? 'rgba(201,165,106,0.3)' : next ? 'rgba(239,229,209,0.18)' : 'rgba(239,229,209,0.08)';
    ctx.fillRect(X(x0), Z(z0), (x1 - x0) * s, (z1 - z0) * s);
    ctx.strokeStyle = cur ? '#e2c48c' : 'rgba(239,229,209,0.55)';
    ctx.lineWidth = cur ? 2 : 1;
    ctx.strokeRect(X(x0 - WALL_T), Z(z0 - WALL_T), (x1 - x0 + 2 * WALL_T) * s, (z1 - z0 + 2 * WALL_T) * s);
    for (const p of r.partitions || []) {
      ctx.save();
      ctx.translate(X(p.cx), Z(p.cz));
      ctx.rotate(-p.rot);
      ctx.fillStyle = 'rgba(239,229,209,0.6)';
      ctx.fillRect(-p.len / 2 * s, -0.15 * s, p.len * s, Math.max(1, 0.3 * s));
      ctx.restore();
    }
    if (state.full || s > 2.2) {
      ctx.fillStyle = cur ? '#fff3dc' : 'rgba(239,229,209,0.85)';
      ctx.textAlign = 'center';
      ctx.font = `600 ${state.full ? 15 : 9}px "Inter Variable", Arial, sans-serif`;
      const cx = X((x0 + x1) / 2), cz = Z((z0 + z1) / 2);
      ctx.fillText(r.id === 'entree' ? 'Entree' : r.label, cx, cz - (state.full ? 6 : 0));
      if (state.full) {
        ctx.font = '400 12px "Inter Variable", Arial, sans-serif';
        ctx.fillStyle = 'rgba(239,229,209,0.7)';
        wrapCenter(ctx, r.title, cx, cz + 12, (x1 - x0) * s - 12, 14);
      }
    }
  }

  // doorgangen
  for (const d of DOORS) {
    const c = doorCenter(d);
    const len = (d.to - d.from) * s;
    ctx.fillStyle = '#1b1a17';
    if (d.side === 'N' || d.side === 'S') ctx.fillRect(X(c.x) - len / 2, Z(c.z) - WALL_T * 1.6 * s, len, WALL_T * 3.2 * s);
    else ctx.fillRect(X(c.x) - WALL_T * 1.6 * s, Z(c.z) - len / 2, WALL_T * 3.2 * s, len);
  }

  // kunstwerken
  for (const a of state.artPoints || []) {
    const viewed = state.viewed.has(a.id);
    ctx.beginPath();
    ctx.arc(X(a.x), Z(a.z), state.full ? 4.5 : 2.4, 0, Math.PI * 2);
    if (viewed) { ctx.fillStyle = '#e2c48c'; ctx.fill(); }
    else { ctx.strokeStyle = 'rgba(239,229,209,0.8)'; ctx.lineWidth = 1.2; ctx.stroke(); }
  }

  // bezoeker
  if (state.player) {
    const px = X(state.player.x), pz = Z(state.player.z);
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-state.yaw);
    const k = state.full ? 1.6 : 1;
    ctx.fillStyle = 'rgba(226,196,140,0.25)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 22 * k, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3dc';
    ctx.beginPath(); ctx.moveTo(0, -7 * k); ctx.lineTo(5 * k, 5 * k); ctx.lineTo(0, 2.5 * k); ctx.lineTo(-5 * k, 5 * k); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  return { X, Z, s, toWorld: (px, pz) => ({ x: BOUNDS.minX + (px - ox) / s, z: BOUNDS.minZ + (pz - oz) / s }) };
}

function wrapCenter(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; }
    else line = t;
  }
  if (line) ctx.fillText(line, x, yy);
}

export { BOUNDS, ROOM_BY_ID };
