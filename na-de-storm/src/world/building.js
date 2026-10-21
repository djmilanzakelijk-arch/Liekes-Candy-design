import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ROOMS, DOORS, WALL_T, ROOM_BY_ID } from '../data/rooms.js';
import { doorsOn, partitionFrame } from './layout.js';
import {
  plasterTexture, woodTexture, stoneTexture, checkerTexture, roughnessTexture,
  aoTexture, skyTexture, beamTexture
} from './textures.js';

// Bouwt de architectuur: vloeren, muren met doorgangen, plafonds, wanden,
// banken, pilaren, ramen en het uitzicht. Registreert ook alle botsvlakken.

const WALL_TILE = 2.2;

function scaleUV(geo, su, sv) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  return geo;
}

// Box met UV's in wereldmaat, zodat texturen niet uitrekken.
export function worldBox(w, h, d, tile = WALL_TILE) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = faces[f];
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * su / tile, uv.getY(i) * sv / tile);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

export class Building {
  constructor(scene, collision, quality) {
    this.scene = scene;
    this.collision = collision;
    this.quality = quality;
    this.group = new THREE.Group();
    this.group.name = 'building';
    scene.add(this.group);
    this.blockers = []; // meshes die klikken blokkeren (muren, wanden)
    this.animated = [];  // objecten met een update(dt, t)
    this.mats = new Map();
    this.shared = {
      trimDark: new THREE.MeshStandardMaterial({ color: '#1c1b1a', roughness: 0.5, metalness: 0.6 }),
      bronze: new THREE.MeshStandardMaterial({ color: '#8a6b43', roughness: 0.38, metalness: 0.85 }),
      blackMetal: new THREE.MeshStandardMaterial({ color: '#121212', roughness: 0.45, metalness: 0.7 }),
      oakBench: new THREE.MeshStandardMaterial({ map: woodTexture('#7a5a3c', 21), roughness: 0.55 }),
      ao: new THREE.MeshBasicMaterial({ map: aoTexture(), transparent: true, depthWrite: false, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -2 }),
      threshold: new THREE.MeshStandardMaterial({ color: '#26231f', roughness: 0.4, metalness: 0.5 })
    };
  }

  build() {
    this.staticParts = [];
    for (const room of ROOMS) this.buildRoom(room);
    for (const door of DOORS) this.buildPassage(door);
    this.buildOutside();
    this.registerWalkAreas();
    this.mergeStatic();
  }

  // Alle statische onderdelen met hetzelfde materiaal worden samengevoegd tot
  // één mesh: veel minder draw calls, dus soepeler op gewone laptops.
  mergeStatic() {
    const groups = new Map();
    for (const part of this.staticParts) {
      const { mesh, cast, receive, blocker } = part;
      const key = `${mesh.material.uuid}|${cast}|${receive}|${blocker}|${mesh.renderOrder}`;
      if (!groups.has(key)) groups.set(key, { material: mesh.material, cast, receive, blocker, renderOrder: mesh.renderOrder, geos: [] });
      if (mesh.matrixAutoUpdate) mesh.updateMatrix();
      const g = mesh.geometry.index ? mesh.geometry.clone() : mesh.geometry.clone();
      g.applyMatrix4(mesh.matrix);
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
      if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]);
      g.clearGroups();
      groups.get(key).geos.push(g);
      mesh.geometry.dispose();
    }
    for (const grp of groups.values()) {
      const merged = mergeGeometries(grp.geos, false);
      if (!merged) continue;
      merged.computeBoundingSphere();
      merged.computeBoundingBox();
      const m = new THREE.Mesh(merged, grp.material);
      m.castShadow = grp.cast;
      m.receiveShadow = grp.receive;
      m.renderOrder = grp.renderOrder;
      m.matrixAutoUpdate = false;
      this.group.add(m);
      if (grp.blocker) this.blockers.push(m);
      for (const g of grp.geos) g.dispose();
    }
    this.staticParts = null;
  }

  roomMaterials(room) {
    if (this.mats.has(room.id)) return this.mats.get(room.id);
    const t = room.theme;
    const wall = new THREE.MeshStandardMaterial({ map: plasterTexture(t.wall, room.nr + 3), roughness: t.wallRough, metalness: 0 });
    let floorMap, tile = 4, rough = 0.6;
    switch (t.floor) {
      case 'stone': floorMap = stoneTexture(t.floorColor, { seed: 3, tiles: 2, joint: 0.35 }); tile = 2.4; rough = 0.42; break;
      case 'checker': floorMap = checkerTexture('#17181a', '#d4cdbf'); tile = 1.8; rough = 0.28; break;
      case 'concrete': floorMap = stoneTexture(t.floorColor, { seed: 5, tiles: 1, joint: 0.12 }); tile = 6; rough = 0.45; break;
      case 'terrazzo': floorMap = stoneTexture(t.floorColor, { seed: 8, tiles: 1, speckle: 9000, joint: 0.08 }); tile = 3; rough = 0.35; break;
      default: floorMap = woodTexture(t.floorColor, room.nr + 11); tile = 4.5; rough = 0.5;
    }
    const floor = new THREE.MeshStandardMaterial({ map: floorMap, roughness: rough, roughnessMap: roughnessTexture(room.nr + 1, 200, 40), metalness: 0, envMapIntensity: 0.6 });
    const ceiling = new THREE.MeshStandardMaterial({ color: t.ceilingColor, roughness: 0.95 });
    const trim = new THREE.MeshStandardMaterial({ color: t.trim, roughness: 0.45, metalness: 0.55 });
    const m = { wall, floor, floorTile: tile, ceiling, trim };
    this.mats.set(room.id, m);
    return m;
  }

  add(mesh, { cast = true, receive = true, blocker = false } = {}) {
    if (this.staticParts) {
      this.staticParts.push({ mesh, cast, receive, blocker });
      return mesh;
    }
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    this.group.add(mesh);
    if (blocker) this.blockers.push(mesh);
    return mesh;
  }

  buildRoom(room) {
    const [x0, x1, z0, z1] = room.rect;
    const w = x1 - x0, d = z1 - z0, h = room.height;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const m = this.roomMaterials(room);

    // Vloer
    const floorGeo = scaleUV(new THREE.PlaneGeometry(w + 2 * WALL_T, d + 2 * WALL_T), (w + 2 * WALL_T) / m.floorTile, (d + 2 * WALL_T) / m.floorTile);
    const floor = new THREE.Mesh(floorGeo, m.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0, cz);
    floor.userData.floor = true;
    this.add(floor, { cast: false });

    // Plafond
    this.buildCeiling(room, m);

    // Muren
    for (const side of ['N', 'S', 'E', 'W']) this.buildWall(room, side, m);

    // Vrijstaande wanden
    for (const p of room.partitions || []) this.buildPartition(room, p, m);

    // Pilaren
    for (const [px, pz] of room.pillars || []) {
      const pillar = new THREE.Mesh(worldBox(0.9, h, 0.9), m.wall);
      pillar.position.set(px, h / 2, pz);
      this.add(pillar, { blocker: true });
      this.collision.addBox(px - 0.45, px + 0.45, pz - 0.45, pz + 0.45);
      this.aoStrip(px - 0.45, pz + 0.45, px + 0.45, pz + 0.45, 0, 1, 0.5);
      this.aoStrip(px - 0.45, pz - 0.45, px + 0.45, pz - 0.45, 0, -1, 0.5);
      this.aoStrip(px + 0.45, pz - 0.45, px + 0.45, pz + 0.45, 1, 0, 0.5);
      this.aoStrip(px - 0.45, pz - 0.45, px - 0.45, pz + 0.45, -1, 0, 0.5);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.0), m.trim);
      cap.position.set(px, 0.06, pz);
      this.add(cap);
    }

    // Banken
    for (const b of room.benches || []) this.buildBench(b);

    // Zaalspecifiek
    if (room.windows) this.buildWindows(room, m);
    if (room.id === 'zaal3') this.buildSurreal(room);
    if (room.installation) {
      const { x, z, radius } = room.installation;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 0.15, 0.32, 64), new THREE.MeshStandardMaterial({ color: '#2a2724', roughness: 0.35, metalness: 0.2 }));
      base.position.set(x, 0.16, z);
      this.add(base);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.02, 0.035, 8, 96), this.shared.bronze);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.33, z);
      this.add(ring, { cast: false });
      this.collision.addCircle(x, z, radius + 0.2, { tall: true });
    }
  }

  buildWall(room, side, m) {
    const [x0, x1, z0, z1] = room.rect;
    const h = room.height;
    const horizontal = side === 'N' || side === 'S';
    const start = horizontal ? x0 - WALL_T : z0 - WALL_T;
    const end = horizontal ? x1 + WALL_T : z1 + WALL_T;
    const fixed = side === 'N' ? z0 - WALL_T / 2 : side === 'S' ? z1 + WALL_T / 2 : side === 'W' ? x0 - WALL_T / 2 : x1 + WALL_T / 2;
    const innerFixed = side === 'N' ? z0 : side === 'S' ? z1 : side === 'W' ? x0 : x1;
    const inward = side === 'N' ? 1 : side === 'S' ? -1 : side === 'W' ? 1 : -1;

    const openings = doorsOn(room.id, side).map((d) => ({ from: d.from, to: d.to, top: d.height, door: d }));
    if (room.windows && room.windows.wall === side) {
      openings.push({ from: room.windows.from, to: room.windows.to, window: room.windows });
    }
    openings.sort((a, b) => a.from - b.from);

    const solid = [];
    let cur = start;
    for (const o of openings) {
      if (o.from > cur) solid.push([cur, o.from]);
      cur = Math.max(cur, o.to);
    }
    if (cur < end) solid.push([cur, end]);

    const place = (a, b, y0, y1, mat = m.wall) => {
      const len = b - a, hh = y1 - y0;
      if (len <= 0.001 || hh <= 0.001) return null;
      const geo = horizontal ? worldBox(len, hh, WALL_T) : worldBox(WALL_T, hh, len);
      const mesh = new THREE.Mesh(geo, mat);
      const mid = (a + b) / 2;
      if (horizontal) mesh.position.set(mid, (y0 + y1) / 2, fixed);
      else mesh.position.set(fixed, (y0 + y1) / 2, mid);
      this.add(mesh, { blocker: true });
      return mesh;
    };

    for (const [a, b] of solid) {
      place(a, b, 0, h);
      if (horizontal) this.collision.addBox(a, b, fixed - WALL_T / 2, fixed + WALL_T / 2);
      else this.collision.addBox(fixed - WALL_T / 2, fixed + WALL_T / 2, a, b);
      // plint en schaduwstrook langs de binnenzijde
      const ia = Math.max(a, horizontal ? x0 : z0), ib = Math.min(b, horizontal ? x1 : z1);
      if (ib > ia) {
        this.skirting(horizontal, ia, ib, innerFixed, inward, m.trim);
        if (horizontal) this.aoStrip(ia, innerFixed, ib, innerFixed, 0, inward);
        else this.aoStrip(innerFixed, ia, innerFixed, ib, inward, 0);
      }
    }

    for (const o of openings) {
      if (o.door) {
        place(o.from, o.to, o.top, h);
        // bronzen omlijsting aan de binnenzijde
        this.doorTrim(horizontal, o.from, o.to, o.top, innerFixed, inward, m.trim);
      } else if (o.window) {
        place(o.from, o.to, 0, o.window.sill);
        place(o.from, o.to, o.window.head, h);
        if (horizontal) this.collision.addBox(o.from, o.to, fixed - WALL_T / 2, fixed + WALL_T / 2);
        else this.collision.addBox(fixed - WALL_T / 2, fixed + WALL_T / 2, o.from, o.to);
      }
    }
  }

  skirting(horizontal, a, b, innerFixed, inward, mat) {
    const len = b - a;
    const geo = horizontal ? new THREE.BoxGeometry(len, 0.1, 0.02) : new THREE.BoxGeometry(0.02, 0.1, len);
    const mesh = new THREE.Mesh(geo, mat);
    const mid = (a + b) / 2;
    if (horizontal) mesh.position.set(mid, 0.05, innerFixed + inward * 0.01);
    else mesh.position.set(innerFixed + inward * 0.01, 0.05, mid);
    this.add(mesh, { cast: false });
  }

  // Donkere strook op de vloer langs een wand (nep-ambient-occlusion).
  // (ax,az)-(bx,bz) is de wandvoet; (nx,nz) wijst van de wand de ruimte in.
  aoStrip(ax, az, bx, bz, nx, nz, width = 0.75) {
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 0.05) return;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, width), this.shared.ao);
    const X = new THREE.Vector3((bx - ax) / len, 0, (bz - az) / len);
    const Y = new THREE.Vector3(-nx, 0, -nz); // donkere rand (v = 1) richting de wand
    const Z = new THREE.Vector3().crossVectors(X, Y);
    if (Z.y < 0) { X.negate(); Z.negate(); }
    mesh.matrixAutoUpdate = false;
    mesh.matrix.makeBasis(X, Y, Z);
    mesh.matrix.setPosition((ax + bx) / 2 + nx * width / 2, 0.004, (az + bz) / 2 + nz * width / 2);
    mesh.renderOrder = 1;
    this.add(mesh, { cast: false, receive: false });
  }

  doorTrim(horizontal, a, b, top, innerFixed, inward, mat) {
    const depth = 0.08, t = 0.09;
    const mk = (w, hh, d, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mat);
      mesh.position.set(x, y, z);
      this.add(mesh, { cast: false });
    };
    const off = innerFixed + inward * depth / 2;
    if (horizontal) {
      mk(t, top, depth, a - t / 2, top / 2, off);
      mk(t, top, depth, b + t / 2, top / 2, off);
      mk(b - a + 2 * t, t, depth, (a + b) / 2, top + t / 2, off);
    } else {
      mk(depth, top, t, off, top / 2, a - t / 2);
      mk(depth, top, t, off, top / 2, b + t / 2);
      mk(depth, t, b - a + 2 * t, off, top + t / 2, (a + b) / 2);
    }
  }

  buildPassage(door) {
    // vloerstrook in de doorgang en zijwangen van de doorgang
    const a = ROOM_BY_ID[door.a];
    const [x0, x1, z0, z1] = a.rect;
    const gap = 2 * WALL_T;
    const len = door.to - door.from;
    let geo, pos;
    if (door.side === 'N' || door.side === 'S') {
      const zc = door.side === 'N' ? z0 - WALL_T : z1 + WALL_T;
      geo = new THREE.PlaneGeometry(len, gap + 0.02);
      pos = new THREE.Vector3((door.from + door.to) / 2, 0.006, zc);
    } else {
      const xc = door.side === 'W' ? x0 - WALL_T : x1 + WALL_T;
      geo = new THREE.PlaneGeometry(gap + 0.02, len);
      pos = new THREE.Vector3(xc, 0.006, (door.from + door.to) / 2);
    }
    const mesh = new THREE.Mesh(geo, this.shared.threshold);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos);
    this.add(mesh, { cast: false });
  }

  buildCeiling(room, m) {
    const [x0, x1, z0, z1] = room.rect;
    const w = x1 - x0, d = z1 - z0, h = room.height;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const type = room.theme.ceiling;

    if (type === 'oculus') {
      const { x, z } = room.installation;
      const shape = new THREE.Shape();
      shape.moveTo(x0 - WALL_T, z0 - WALL_T);
      shape.lineTo(x1 + WALL_T, z0 - WALL_T);
      shape.lineTo(x1 + WALL_T, z1 + WALL_T);
      shape.lineTo(x0 - WALL_T, z1 + WALL_T);
      shape.lineTo(x0 - WALL_T, z0 - WALL_T);
      const hole = new THREE.Path();
      hole.absarc(x, z, 2.6, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      const geo = new THREE.ShapeGeometry(shape, 48);
      geo.rotateX(Math.PI / 2);
      const ceil = new THREE.Mesh(geo, m.ceiling);
      ceil.position.y = h;
      this.add(ceil, { cast: false });
      // schacht en hemel boven de opening
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 2.4, 64, 1, true), new THREE.MeshStandardMaterial({ color: '#e8e3d8', side: THREE.BackSide, roughness: 0.9 }));
      shaft.position.set(x, h + 1.2, z);
      this.add(shaft, { cast: false });
      const sky = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshBasicMaterial({ color: '#fff7e6' }));
      sky.rotation.x = Math.PI / 2;
      sky.position.set(x, h + 2.39, z);
      sky.userData.emissiveSky = true;
      this.add(sky, { cast: false, receive: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.08, 10, 96), this.shared.bronze);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, h - 0.02, z);
      this.add(ring, { cast: false });
      // lichtbundel
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.6, h, 48, 1, true), new THREE.MeshBasicMaterial({ map: beamTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.35 }));
      beam.position.set(x, h / 2, z);
      this.add(beam, { cast: false, receive: false });
      return;
    }

    const geo = new THREE.PlaneGeometry(w + 2 * WALL_T, d + 2 * WALL_T);
    const ceil = new THREE.Mesh(geo, m.ceiling);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, h, cz);
    this.add(ceil, { cast: false });

    if (type === 'coffer') {
      const beamMat = new THREE.MeshStandardMaterial({ color: '#2a2826', roughness: 0.8 });
      const step = 2.5;
      for (let x = x0 + step; x < x1 - 0.1; x += step) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.7, d), beamMat);
        b.position.set(x, h - 0.35, cz);
        this.add(b, { cast: false });
      }
      for (let z = z0 + step; z < z1 - 0.1; z += step) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.7, 0.32), beamMat);
        b.position.set(cx, h - 0.35, z);
        this.add(b, { cast: false });
      }
      // grote ringlamp in het midden van de entree
      const ringMat = new THREE.MeshStandardMaterial({ color: '#2b2216', emissive: '#ffd9a0', emissiveIntensity: 2.2, roughness: 0.4 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.06, 10, 128), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(cx, h - 3.2, cz);
      this.add(ring, { cast: false, receive: false });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 3.2, 4), this.shared.blackMetal);
        cable.position.set(cx + Math.cos(a) * 2.6, h - 1.6, cz + Math.sin(a) * 2.6);
        this.add(cable, { cast: false });
      }
    } else if (type === 'track') {
      for (const off of [-0.28, 0.28]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, d - 0.6), this.shared.blackMetal);
        rail.position.set(x0 + w * (0.5 + off), h - 0.02, cz);
        this.add(rail, { cast: false });
      }
      for (const off of [-0.3, 0.3]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 0.04, 0.05), this.shared.blackMetal);
        rail.position.set(cx, h - 0.02, z0 + d * (0.5 + off));
        this.add(rail, { cast: false });
      }
    } else if (type === 'night') {
      const pts = [];
      const r = mulberry(5);
      for (let i = 0; i < 380; i++) pts.push(x0 + r() * w, h - 0.02, z0 + r() * d);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: '#fff4d6', size: 0.05, sizeAttenuation: true }));
      this.group.add(stars);
      const moon = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), new THREE.MeshBasicMaterial({ color: '#f3e8c8' }));
      moon.rotation.x = Math.PI / 2;
      moon.position.set(cx - 3, h - 0.03, cz - 4);
      this.add(moon, { cast: false, receive: false });
      const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.78, 48), m.ceiling);
      shadowDisc.rotation.x = Math.PI / 2;
      shadowDisc.position.set(cx - 2.62, h - 0.035, cz - 3.75);
      this.add(shadowDisc, { cast: false, receive: false });
    } else if (type === 'skylight') {
      const panelMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fffaf0', emissiveIntensity: 1.25, roughness: 1 });
      const beamMat = new THREE.MeshStandardMaterial({ color: '#d9d6cf', roughness: 0.8 });
      const rows = Math.max(2, Math.round(d / 7));
      for (let i = 0; i < rows; i++) {
        const z = z0 + d * (i + 0.5) / rows;
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.72, 2.2), panelMat);
        panel.rotation.x = Math.PI / 2;
        panel.position.set(cx, h - 0.01, z);
        this.add(panel, { cast: false, receive: false });
        for (let k = -4; k <= 4; k++) {
          const louvre = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 2.3), beamMat);
          louvre.position.set(cx + k * w * 0.08, h - 0.25, z);
          this.add(louvre, { cast: false });
        }
        const frame = new THREE.Mesh(new THREE.BoxGeometry(w * 0.74, 0.5, 0.08), beamMat);
        frame.position.set(cx, h - 0.25, z - 1.12);
        this.add(frame, { cast: false });
        const frame2 = frame.clone();
        frame2.position.z = z + 1.12;
        this.add(frame2, { cast: false });
      }
    }
  }

  buildPartition(room, p, m) {
    const f = partitionFrame(p);
    const geo = worldBox(p.len, p.h, WALL_T);
    const mesh = new THREE.Mesh(geo, m.wall);
    mesh.position.set(p.cx, p.h / 2, p.cz);
    mesh.rotation.y = p.rot;
    this.add(mesh, { blocker: true });
    const capGeo = new THREE.BoxGeometry(p.len + 0.02, 0.04, WALL_T + 0.02);
    const cap = new THREE.Mesh(capGeo, m.trim);
    cap.position.set(p.cx, p.h + 0.02, p.cz);
    cap.rotation.y = p.rot;
    this.add(cap, { cast: false });
    this.collision.addOBB(p.cx, p.cz, p.len / 2, WALL_T / 2, p.rot);
    // schaduwstroken aan beide kanten
    for (const sgn of [1, -1]) {
      const o = f.normal.clone().multiplyScalar(sgn * WALL_T / 2);
      const a = f.center.clone().addScaledVector(f.along, -p.len / 2).add(o);
      const b = f.center.clone().addScaledVector(f.along, p.len / 2).add(o);
      this.aoStrip(a.x, a.z, b.x, b.z, f.normal.x * sgn, f.normal.z * sgn, 0.6);
    }
  }

  buildBench(b) {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(b.len, 0.07, 0.5), this.shared.oakBench);
    seat.position.y = 0.44;
    seat.castShadow = seat.receiveShadow = true;
    g.add(seat);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.41, 0.44), this.shared.blackMetal);
      leg.position.set(s * (b.len / 2 - 0.18), 0.205, 0);
      leg.castShadow = true;
      g.add(leg);
    }
    g.position.set(b.x, 0, b.z);
    g.rotation.y = b.rot;
    this.group.add(g);
    this.collision.addOBB(b.x, b.z, b.len / 2, 0.25, b.rot, { tall: false });
  }

  buildWindows(room, m) {
    const win = room.windows;
    const [, x1] = room.rect;
    const x = x1 + WALL_T / 2;
    const glass = new THREE.MeshStandardMaterial({ color: '#cfe2ee', transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0.1, depthWrite: false });
    const mullionMat = this.shared.blackMetal;
    const len = win.to - win.from, hh = win.head - win.sill;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(len, hh), glass);
    pane.rotation.y = -Math.PI / 2;
    pane.position.set(x, (win.sill + win.head) / 2, (win.from + win.to) / 2);
    this.add(pane, { cast: false, receive: false });
    const n = Math.round(len / 2.4);
    for (let i = 0; i <= n; i++) {
      const z = win.from + (len * i) / n;
      const mul = new THREE.Mesh(new THREE.BoxGeometry(0.12, hh, 0.08), mullionMat);
      mul.position.set(x, (win.sill + win.head) / 2, z);
      this.add(mul, { cast: false });
    }
    for (const y of [win.sill, win.head, win.sill + hh * 0.62]) {
      const tr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, len), mullionMat);
      tr.position.set(x, y, (win.from + win.to) / 2);
      this.add(tr, { cast: false });
    }
    // vensterbank
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, len), m.trim);
    sill.position.set(x1 - 0.2, win.sill, (win.from + win.to) / 2);
    this.add(sill);
    // zonnevlekken op de vloer (nep-zonlicht door de ramen)
    const patchMat = new THREE.MeshBasicMaterial({ color: '#fff1d2', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < n; i++) {
      const z = win.from + (len * (i + 0.5)) / n;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(3.4, len / n - 0.35), patchMat);
      p.rotation.x = -Math.PI / 2;
      p.position.set(x1 - 2.4, 0.007, z + 0.6);
      this.add(p, { cast: false, receive: false });
    }
    this.hasOutside = true;
  }

  buildOutside() {
    // Lucht en een stil 'wederopbouw'-silhouet, alleen zichtbaar door ramen en oculus.
    const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.position.set(23, 0, -20);
    sky.renderOrder = -10;
    this.group.add(sky);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#9c9a8c', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(160, -0.02, -20);
    this.add(ground, { cast: false });
    const r = mulberry(31);
    const blockMat = [
      new THREE.MeshStandardMaterial({ color: '#b9b2a6', roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: '#a39a8c', roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: '#cfc8bb', roughness: 0.95 })
    ];
    for (let i = 0; i < 70; i++) {
      const w = 6 + r() * 16, h = 4 + r() * 22, dd = 6 + r() * 14;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), blockMat[i % 3]);
      b.position.set(70 + r() * 220, h / 2, -120 + r() * 200);
      this.add(b, { cast: false, receive: false });
      if (r() > 0.75) {
        // bouwkraan als teken van wederopbouw
        const mast = new THREE.Mesh(new THREE.BoxGeometry(0.6, h + 18, 0.6), this.shared.blackMetal);
        mast.position.set(b.position.x + w / 2 + 2, (h + 18) / 2, b.position.z);
        this.add(mast, { cast: false, receive: false });
        const jib = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 22), this.shared.blackMetal);
        jib.position.set(mast.position.x, h + 17, mast.position.z - 6);
        this.add(jib, { cast: false, receive: false });
      }
    }
  }

  buildSurreal(room) {
    const [x0, x1, z0, z1] = room.rect;
    const h = room.height;
    const gilt = new THREE.MeshStandardMaterial({ color: '#b8914f', roughness: 0.32, metalness: 0.9 });
    const matte = new THREE.MeshStandardMaterial({ color: '#efe9dc', roughness: 0.6 });
    // zwevende bollen
    const spheres = [[-6.5, 5.6, -62, 0.8], [6.8, 4.8, -52, 0.55], [1.5, 6.3, -58, 0.38]];
    for (const [x, y, z, rad] of spheres) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(rad, 48, 24), matte);
      s.position.set(x, y, z);
      s.castShadow = true;
      this.group.add(s);
      const base = y;
      this.animated.push((dt, t) => { s.position.y = base + Math.sin(t * 0.4 + x) * 0.12; });
    }
    // een enorme, lege lijst waar je doorheen kunt lopen
    const fg = new THREE.Group();
    const fw = 3.4, fh = 4.6, ft = 0.22;
    const parts = [[ft, fh, 0, fh / 2, -fw / 2], [ft, fh, 0, fh / 2, fw / 2], [fw + ft, ft, 0, fh, 0]];
    for (const [w, hh, , y, off] of parts) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, hh, 0.18), gilt);
      p.position.set(off, y, 0);
      p.castShadow = true;
      fg.add(p);
    }
    fg.position.set(5.6, 0, -55.5);
    fg.rotation.y = -0.55;
    this.group.add(fg);
    for (const s of [-1, 1]) {
      const px = 5.6 + Math.cos(-0.55) * s * fw / 2;
      const pz = -55.5 - Math.sin(-0.55) * s * fw / 2;
      this.collision.addCircle(px, pz, 0.18);
    }
    // een ladder naar een deur die nergens heen gaat
    const lg = new THREE.Group();
    const wood = this.shared.oakBench;
    for (const s of [-0.28, 0.28]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 6.4, 0.06), wood);
      rail.position.set(s, 3.2, 0);
      rail.castShadow = true;
      lg.add(rail);
    }
    for (let i = 0; i < 18; i++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.04), wood);
      rung.position.set(0, 0.3 + i * 0.34, 0);
      lg.add(rung);
    }
    lg.rotation.z = 0;
    lg.rotation.x = 0.12;
    lg.rotation.y = Math.PI / 2;
    lg.position.set(x0 + 0.45, 0, -66.6);
    this.group.add(lg);
    this.collision.addBox(x0, x0 + 0.9, -67, -66.2);
    const door = new THREE.Group();
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.0), new THREE.MeshBasicMaterial({ color: '#fff3d4' }));
    door.add(glow);
    const fr = [[0.08, 2.16, -0.59, 0], [0.08, 2.16, 0.59, 0], [1.26, 0.08, 0, 1.04]];
    for (const [w, hh, x, y] of fr) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, hh, 0.06), gilt);
      p.position.set(x, y, 0.02);
      door.add(p);
    }
    door.position.set(x0 + 0.02, 6.25, -66.6);
    door.rotation.y = Math.PI / 2;
    this.group.add(door);
    void x1; void z0; void z1; void h;
  }

  registerWalkAreas() {
    const m = 0.0;
    for (const r of ROOMS) {
      const [x0, x1, z0, z1] = r.rect;
      this.collision.addWalkRect(x0 + m, x1 - m, z0 + m, z1 - m);
    }
    for (const d of DOORS) {
      const r = ROOM_BY_ID[d.a].rect;
      const g = 2 * WALL_T + 0.2;
      if (d.side === 'N') this.collision.addWalkRect(d.from, d.to, r[2] - g, r[2] + 0.1);
      if (d.side === 'S') this.collision.addWalkRect(d.from, d.to, r[3] - 0.1, r[3] + g);
      if (d.side === 'W') this.collision.addWalkRect(r[0] - g, r[0] + 0.1, d.from, d.to);
      if (d.side === 'E') this.collision.addWalkRect(r[1] - 0.1, r[1] + g, d.from, d.to);
    }
  }

  update(dt, t) {
    for (const f of this.animated) f(dt, t);
  }
}

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
