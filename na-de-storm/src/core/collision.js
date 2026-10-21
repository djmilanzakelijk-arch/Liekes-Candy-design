// Botsingen in het horizontale vlak (x, z) en padvinding over een raster.
// De speler is een cirkel; muren, wanden, banken en sokkels zijn rechthoeken
// (eventueel gedraaid) of cirkels. Het raster wordt gebruikt om camera-
// animaties en de tour om muren heen te leiden.

const CELL = 4; // grootte van de ruimtelijke hash in meters

export class CollisionWorld {
  constructor() {
    this.colliders = [];
    this.hash = new Map();
    this.walkRects = []; // rechthoeken waar je mag staan (zalen + doorgangen)
    this.grid = null;
  }

  addBox(minX, maxX, minZ, maxZ, opts = {}) {
    this._add({ type: 'box', minX, maxX, minZ, maxZ, tall: opts.tall !== false, tag: opts.tag });
  }

  addOBB(cx, cz, hx, hz, rot, opts = {}) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const ex = Math.abs(c * hx) + Math.abs(s * hz);
    const ez = Math.abs(s * hx) + Math.abs(c * hz);
    this._add({
      type: 'obb', cx, cz, hx, hz, rot, cos: c, sin: s,
      minX: cx - ex, maxX: cx + ex, minZ: cz - ez, maxZ: cz + ez,
      tall: opts.tall !== false, tag: opts.tag
    });
  }

  addCircle(cx, cz, r, opts = {}) {
    this._add({ type: 'circle', cx, cz, r, minX: cx - r, maxX: cx + r, minZ: cz - r, maxZ: cz + r, tall: opts.tall !== false, tag: opts.tag });
  }

  addWalkRect(minX, maxX, minZ, maxZ) {
    this.walkRects.push({ minX, maxX, minZ, maxZ });
  }

  _add(col) {
    const i = this.colliders.push(col) - 1;
    for (let gx = Math.floor(col.minX / CELL); gx <= Math.floor(col.maxX / CELL); gx++) {
      for (let gz = Math.floor(col.minZ / CELL); gz <= Math.floor(col.maxZ / CELL); gz++) {
        const k = gx + ',' + gz;
        if (!this.hash.has(k)) this.hash.set(k, []);
        this.hash.get(k).push(i);
      }
    }
  }

  _nearby(x, z, r) {
    const out = new Set();
    for (let gx = Math.floor((x - r) / CELL); gx <= Math.floor((x + r) / CELL); gx++) {
      for (let gz = Math.floor((z - r) / CELL); gz <= Math.floor((z + r) / CELL); gz++) {
        const list = this.hash.get(gx + ',' + gz);
        if (list) for (const i of list) out.add(i);
      }
    }
    return out;
  }

  // Duwt een cirkel uit alle obstakels. Muteert en retourneert `p` ({x, z}).
  resolveCircle(p, r) {
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const i of this._nearby(p.x, p.z, r + 0.5)) {
        const c = this.colliders[i];
        if (pushOut(c, p, r)) moved = true;
      }
      if (!moved) break;
    }
    return p;
  }

  // Ligt het punt (met marge) binnen een obstakel?
  blocked(x, z, margin = 0, tallOnly = false) {
    for (const i of this._nearby(x, z, margin + 0.5)) {
      const c = this.colliders[i];
      if (tallOnly && !c.tall) continue;
      if (distTo(c, x, z) < margin) return true;
    }
    return false;
  }

  inWalkArea(x, z, margin = 0) {
    for (const r of this.walkRects) {
      if (x >= r.minX + margin && x <= r.maxX - margin && z >= r.minZ + margin && z <= r.maxZ - margin) return true;
    }
    return false;
  }

  // ── Raster voor padvinding (alleen hoge obstakels; de camera zweeft over banken) ──
  buildGrid(bounds, cell = 0.4, margin = 0.45) {
    const nx = Math.ceil((bounds.maxX - bounds.minX) / cell);
    const nz = Math.ceil((bounds.maxZ - bounds.minZ) / cell);
    const free = new Uint8Array(nx * nz);
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const x = bounds.minX + (ix + 0.5) * cell;
        const z = bounds.minZ + (iz + 0.5) * cell;
        free[iz * nx + ix] = this._cellFree(x, z, margin) ? 1 : 0;
      }
    }
    this.grid = { ...bounds, cell, nx, nz, free, margin };
  }

  _cellFree(x, z, margin) {
    // Een cel is vrij als ze in een zaal of doorgang ligt en niet in een hoog obstakel.
    let inside = false;
    for (const r of this.walkRects) {
      if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) { inside = true; break; }
    }
    return inside && !this.blocked(x, z, margin, true);
  }

  _cellOf(x, z) {
    const g = this.grid;
    const ix = Math.max(0, Math.min(g.nx - 1, Math.floor((x - g.minX) / g.cell)));
    const iz = Math.max(0, Math.min(g.nz - 1, Math.floor((z - g.minZ) / g.cell)));
    return [ix, iz];
  }

  _isFree(ix, iz) {
    const g = this.grid;
    return ix >= 0 && iz >= 0 && ix < g.nx && iz < g.nz && g.free[iz * g.nx + ix] === 1;
  }

  _nearestFree(ix, iz) {
    if (this._isFree(ix, iz)) return [ix, iz];
    for (let rad = 1; rad < 12; rad++) {
      for (let dz = -rad; dz <= rad; dz++) {
        for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== rad) continue;
          if (this._isFree(ix + dx, iz + dz)) return [ix + dx, iz + dz];
        }
      }
    }
    return null;
  }

  // Is de rechte lijn a→b vrij (op het raster)?
  lineFree(ax, az, bx, bz) {
    const g = this.grid;
    const d = Math.hypot(bx - ax, bz - az);
    const steps = Math.max(1, Math.ceil(d / (g.cell * 0.5)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const [ix, iz] = this._cellOf(ax + (bx - ax) * t, az + (bz - az) * t);
      if (!this._isFree(ix, iz)) return false;
    }
    return true;
  }

  // A* van a naar b. Retourneert een lijst punten [{x, z}], inclusief begin en eind.
  findPath(ax, az, bx, bz) {
    if (!this.grid) return [{ x: ax, z: az }, { x: bx, z: bz }];
    // Start- en eindpunt mogen zelf in een obstakelmarge liggen (camera vlak voor een wand).
    const directOk = this._segmentClearIgnoringEnds(ax, az, bx, bz);
    if (directOk) return [{ x: ax, z: az }, { x: bx, z: bz }];

    const g = this.grid;
    const s = this._nearestFree(...this._cellOf(ax, az));
    const e = this._nearestFree(...this._cellOf(bx, bz));
    if (!s || !e) return [{ x: ax, z: az }, { x: bx, z: bz }];

    const N = g.nx * g.nz;
    const gScore = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const start = s[1] * g.nx + s[0];
    const goal = e[1] * g.nx + e[0];
    const heap = new MinHeap();
    const h = (i) => {
      const dx = Math.abs((i % g.nx) - e[0]);
      const dz = Math.abs(Math.floor(i / g.nx) - e[1]);
      return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz);
    };
    gScore[start] = 0;
    heap.push(start, h(start));
    const nbrs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, -1, Math.SQRT2]];
    let found = false;
    let guard = 0;
    while (heap.size && guard++ < 200000) {
      const cur = heap.pop();
      if (cur === goal) { found = true; break; }
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % g.nx, cz = Math.floor(cur / g.nx);
      for (const [dx, dz, cost] of nbrs) {
        const nx = cx + dx, nz = cz + dz;
        if (!this._isFree(nx, nz)) continue;
        if (dx && dz && (!this._isFree(cx + dx, cz) || !this._isFree(cx, cz + dz))) continue;
        const ni = nz * g.nx + nx;
        const t = gScore[cur] + cost;
        if (t < gScore[ni]) {
          gScore[ni] = t;
          came[ni] = cur;
          heap.push(ni, t + h(ni));
        }
      }
    }
    if (!found) return [{ x: ax, z: az }, { x: bx, z: bz }];

    const cells = [];
    for (let c = goal; c !== -1; c = came[c]) cells.push(c);
    cells.reverse();
    const pts = cells.map((c) => ({ x: g.minX + ((c % g.nx) + 0.5) * g.cell, z: g.minZ + (Math.floor(c / g.nx) + 0.5) * g.cell }));
    pts[0] = { x: ax, z: az };
    pts[pts.length - 1] = { x: bx, z: bz };
    return this._smooth(pts);
  }

  _segmentClearIgnoringEnds(ax, az, bx, bz) {
    const g = this.grid;
    const d = Math.hypot(bx - ax, bz - az);
    if (d < 0.01) return true;
    const steps = Math.max(1, Math.ceil(d / (g.cell * 0.5)));
    const skip = Math.ceil(0.7 / (d / steps)); // de eerste/laatste 0,7 m mogen in de marge liggen
    for (let i = 0; i <= steps; i++) {
      if (i < skip || i > steps - skip) continue;
      const t = i / steps;
      const [ix, iz] = this._cellOf(ax + (bx - ax) * t, az + (bz - az) * t);
      if (!this._isFree(ix, iz)) return false;
    }
    // ook harde controle zonder marge over de hele lijn (nooit door een muur)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (this.blocked(ax + (bx - ax) * t, az + (bz - az) * t, 0.05, true)) return false;
    }
    return true;
  }

  _smooth(pts) {
    if (pts.length <= 2) return pts;
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !this.lineFree(pts[i].x, pts[i].z, pts[j].x, pts[j].z)) j--;
      out.push(pts[j]);
      i = j;
    }
    return out;
  }
}

function localPoint(c, x, z) {
  const dx = x - c.cx, dz = z - c.cz;
  // inverse rotatie (rotatie om y: x' = x cos + z sin, z' = -x sin + z cos)
  return { lx: dx * c.cos - dz * c.sin, lz: dx * c.sin + dz * c.cos };
}

function distTo(c, x, z) {
  if (c.type === 'circle') return Math.hypot(x - c.cx, z - c.cz) - c.r;
  if (c.type === 'box') {
    const dx = Math.max(c.minX - x, 0, x - c.maxX);
    const dz = Math.max(c.minZ - z, 0, z - c.maxZ);
    if (dx === 0 && dz === 0) return -Math.min(x - c.minX, c.maxX - x, z - c.minZ, c.maxZ - z);
    return Math.hypot(dx, dz);
  }
  const { lx, lz } = localPoint(c, x, z);
  const dx = Math.max(Math.abs(lx) - c.hx, 0);
  const dz = Math.max(Math.abs(lz) - c.hz, 0);
  if (dx === 0 && dz === 0) return -Math.min(c.hx - Math.abs(lx), c.hz - Math.abs(lz));
  return Math.hypot(dx, dz);
}

function pushOut(c, p, r) {
  if (c.type === 'circle') {
    const dx = p.x - c.cx, dz = p.z - c.cz;
    const d = Math.hypot(dx, dz);
    const min = c.r + r;
    if (d >= min) return false;
    const nx = d > 1e-6 ? dx / d : 1, nz = d > 1e-6 ? dz / d : 0;
    p.x = c.cx + nx * min;
    p.z = c.cz + nz * min;
    return true;
  }
  let lx, lz, hx, hz;
  if (c.type === 'box') {
    hx = (c.maxX - c.minX) / 2; hz = (c.maxZ - c.minZ) / 2;
    lx = p.x - (c.minX + hx); lz = p.z - (c.minZ + hz);
  } else {
    ({ lx, lz } = localPoint(c, p.x, p.z));
    hx = c.hx; hz = c.hz;
  }
  const qx = Math.max(-hx, Math.min(hx, lx));
  const qz = Math.max(-hz, Math.min(hz, lz));
  let dx = lx - qx, dz = lz - qz;
  let d = Math.hypot(dx, dz);
  let nlx, nlz;
  if (d < 1e-6) {
    // middelpunt ligt binnen het obstakel: naar de dichtstbijzijnde zijde duwen
    const px = hx - Math.abs(lx), pz = hz - Math.abs(lz);
    if (px < pz) { nlx = Math.sign(lx) || 1; nlz = 0; lx = nlx * (hx + r); }
    else { nlz = Math.sign(lz) || 1; nlx = 0; lz = nlz * (hz + r); }
  } else {
    if (d >= r) return false;
    lx = qx + (dx / d) * r;
    lz = qz + (dz / d) * r;
  }
  if (c.type === 'box') {
    p.x = c.minX + hx + lx;
    p.z = c.minZ + hz + lz;
  } else {
    // terug naar wereldcoördinaten
    p.x = c.cx + lx * c.cos + lz * c.sin;
    p.z = c.cz - lx * c.sin + lz * c.cos;
  }
  return true;
}

class MinHeap {
  constructor() { this.items = []; this.prio = []; }
  get size() { return this.items.length; }
  push(item, p) {
    const a = this.items, b = this.prio;
    a.push(item); b.push(p);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (b[parent] <= b[i]) break;
      [a[parent], a[i]] = [a[i], a[parent]];
      [b[parent], b[i]] = [b[i], b[parent]];
      i = parent;
    }
  }
  pop() {
    const a = this.items, b = this.prio;
    const top = a[0];
    const lastA = a.pop(), lastB = b.pop();
    if (a.length) {
      a[0] = lastA; b[0] = lastB;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && b[l] < b[m]) m = l;
        if (r < a.length && b[r] < b[m]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        [b[m], b[i]] = [b[i], b[m]];
        i = m;
      }
    }
    return top;
  }
}
