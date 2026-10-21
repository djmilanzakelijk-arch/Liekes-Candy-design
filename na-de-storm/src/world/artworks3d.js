import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ROOMS } from '../data/rooms.js';
import { ART_BY_ID } from '../data/artworks.js';
import { IMAGE_SIZES } from '../data/imageSizes.js';
import { wallPlacement } from './layout.js';
import { washTexture, placeholderCanvas, wrapText } from './textures.js';
import { interpretationCanvas, ownPaintingCanvas } from './interpretation.js';

const BASE = import.meta.env.BASE_URL;
export const imageUrl = (file) => `${BASE}beelden/${file}`;

const STATUS_TAG = {
  context: 'HISTORISCHE CONTEXT · vóór 1940',
  vergelijking: 'LATERE VERGELIJKING · na 1950',
  eigen: 'EIGEN PRAKTIJKWERK'
};

// Bepaalt de breedte/hoogte (m) van het beeldvlak zonder vervorming.
function planeSize(art) {
  const w = (art.size?.w || 80) / 100;
  if (art.image && IMAGE_SIZES[art.image.file.replace('.jpg', '')]) {
    const s = IMAGE_SIZES[art.image.file.replace('.jpg', '')];
    if (art.diamond) return { w, h: w };
    return { w, h: w * s.h / s.w };
  }
  const h = (art.size?.h || art.size?.w || 80) / 100;
  return { w, h };
}

export class ArtworkPresenter {
  constructor(scene, renderer, collision) {
    this.scene = scene;
    this.renderer = renderer;
    this.collision = collision;
    this.group = new THREE.Group();
    this.group.name = 'artworks';
    scene.add(this.group);
    this.items = new Map();   // artId → { art, group, canvasMesh, mat, center, normal, w, h, room }
    this.hitMeshes = [];
    this.maxAniso = renderer.capabilities.getMaxAnisotropy();
    this.frameMats = {
      walnut: new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 0.55, metalness: 0.05 }),
      oak: new THREE.MeshStandardMaterial({ color: '#9a7a55', roughness: 0.6 }),
      gilt: new THREE.MeshStandardMaterial({ color: '#b48a46', roughness: 0.32, metalness: 0.9 }),
      black: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.4, metalness: 0.3 }),
      alu: new THREE.MeshStandardMaterial({ color: '#b9bcbf', roughness: 0.3, metalness: 0.9 }),
      white: new THREE.MeshStandardMaterial({ color: '#f1efe9', roughness: 0.6 }),
      mat: new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.95 }),
      box: new THREE.MeshStandardMaterial({ color: '#e9e5dc', roughness: 0.9 }),
      bronze: new THREE.MeshStandardMaterial({ color: '#5b4632', roughness: 0.35, metalness: 0.85 }),
      plinth: new THREE.MeshStandardMaterial({ color: '#efece6', roughness: 0.8 })
    };
    this.fixtureMat = new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.4, metalness: 0.6 });
    this.lensMat = new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#fff1d0', emissiveIntensity: 3 });
  }

  build() {
    this.fixtureParts = [];
    for (const room of ROOMS) {
      for (const slot of room.slots || []) {
        const art = ART_BY_ID[slot.art];
        if (!art) throw new Error('Onbekend kunstwerk: ' + slot.art);
        if (slot.sculpture) this.buildSculpture(room, art);
        else this.buildWallWork(room, slot, art);
      }
    }
    // alle plafondspotjes samenvoegen (per materiaal één mesh)
    for (const mat of [this.fixtureMat, this.lensMat]) {
      const geos = this.fixtureParts.filter((p) => p.material === mat).map((p) => p.geometry);
      if (!geos.length) continue;
      const m = new THREE.Mesh(mergeGeometries(geos, false), mat);
      m.castShadow = mat === this.fixtureMat;
      this.group.add(m);
    }
    this.fixtureParts = null;
  }

  frameStyle(room, art) {
    if (art.type === 'foto') return 'photo';
    if (art.type === 'affiche') return 'poster';
    if (art.type === 'tekening' || art.type === 'grafiek' || art.type === 'ontwerp') return 'paper';
    if (art.type === 'reliëf') return 'box';
    if (room.id === 'zaal3') return 'gilt';
    if (room.id === 'zaal4' || room.id === 'entree' || room.id === 'finale') return 'strip';
    if (room.id === 'zaal5') return 'oak';
    return 'walnut';
  }

  buildWallWork(room, slot, art) {
    const { pos, normal, rotY } = wallPlacement(room, slot.wall, slot.at);
    const { w, h } = planeSize(art);
    const outerH = art.diamond ? w * Math.SQRT2 : h;
    const cy = slot.y ?? Math.max(1.58, 0.5 + outerH / 2 + (art.type === 'foto' || art.type === 'affiche' ? 0.1 : 0));
    const g = new THREE.Group();
    g.position.copy(pos);
    g.position.y = cy;
    g.rotation.y = rotY;
    this.group.add(g);

    const style = this.frameStyle(room, art);
    const depth = style === 'box' ? 0.2 : 0.05;
    let matMargin = 0;
    if (style === 'photo' || style === 'paper') matMargin = Math.max(0.07, Math.min(w, h) * 0.12);

    const fw = { walnut: 0.07, oak: 0.05, gilt: 0.085, strip: 0.022, photo: 0.025, paper: 0.03, poster: 0.018, box: 0.04 }[style];
    const frameMat = { walnut: this.frameMats.walnut, oak: this.frameMats.oak, gilt: this.frameMats.gilt, strip: this.frameMats.black, photo: this.frameMats.black, paper: this.frameMats.oak, poster: this.frameMats.alu, box: this.frameMats.box }[style];

    // beeldvlak
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff', roughness: 0.88, metalness: 0,
      emissive: '#ffffff', emissiveIntensity: 0.0
    });
    let geo;
    if (art.diamond) {
      geo = new THREE.PlaneGeometry(w, w);
      geo.rotateZ(Math.PI / 4);
      // beeldcoördinaten: de ruit vult het vierkante bronbeeld (met kleine marge)
      const uv = geo.attributes.uv, p = geo.attributes.position;
      const half = (w * Math.SQRT2) / 2, inset = 0.035;
      for (let i = 0; i < uv.count; i++) {
        const u = 0.5 + (p.getX(i) / half) * (0.5 - inset);
        const v = 0.5 + (p.getY(i) / half) * (0.5 - inset);
        uv.setXY(i, u, v);
      }
    } else {
      geo = new THREE.PlaneGeometry(w, h);
    }
    const canvasMesh = new THREE.Mesh(geo, mat);
    canvasMesh.position.z = depth + 0.002;
    canvasMesh.receiveShadow = true;
    g.add(canvasMesh);

    // achterplaat / passe-partout
    const backW = (art.diamond ? w * Math.SQRT2 : w) + matMargin * 2;
    const backH = outerH + matMargin * 2;
    if (!art.diamond) {
      const back = new THREE.Mesh(new THREE.BoxGeometry(backW, backH, depth), matMargin ? this.frameMats.mat : this.frameMats.black);
      back.position.z = depth / 2;
      back.castShadow = true;
      back.receiveShadow = true;
      g.add(back);
      this.frameAround(g, backW, backH, fw, depth + (style === 'box' ? 0 : 0.015), frameMat, style === 'box');
    } else {
      const back = new THREE.Mesh(new THREE.BoxGeometry(w, w, depth), this.frameMats.black);
      back.rotation.z = Math.PI / 4;
      back.position.z = depth / 2;
      back.castShadow = true;
      g.add(back);
    }

    // wandbordje
    const label = this.makeLabel(art);
    const lw = 0.3, lh = 0.2;
    label.position.set(backW / 2 + fw + 0.32, Math.min(0, 1.38 - cy), 0.012);
    if (backW > 3.2) label.position.set(backW / 2 + fw + 0.32, 1.38 - cy, 0.012);
    label.scale.set(lw, lh, 1);
    g.add(label);

    // lichtbundel op de wand
    const theme = room.theme;
    const wash = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: washTexture(), color: theme.wash, transparent: true, opacity: theme.washStrength * 0.42, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    wash.scale.set(backW + 1.6, backH + 1.8, 1);
    wash.position.set(0, 0.25, 0.006);
    wash.renderOrder = 2;
    g.add(wash);

    // spotje aan het plafond, gericht op het werk (alleen in lagere zalen)
    if (room.height <= 8) this.fixture(g, room, cy);

    const center = new THREE.Vector3();
    canvasMesh.getWorldPosition(center);
    g.updateMatrixWorld(true);
    canvasMesh.getWorldPosition(center);

    const item = { art, room: room.id, group: g, canvasMesh, mat, wash, center, normal: normal.clone(), w: art.diamond ? w * Math.SQRT2 : w, h: outerH, loaded: false };
    this.items.set(art.id, item);
    g.traverse((o) => { if (o.isMesh && o !== wash) { o.userData.artId = art.id; this.hitMeshes.push(o); } });
    this.setPlaceholder(item);
  }

  frameAround(g, W, H, fw, depth, mat, isBox) {
    const d = isBox ? 0.22 : depth;
    const pieces = [
      [W + fw * 2, fw, 0, H / 2 + fw / 2],
      [W + fw * 2, fw, 0, -H / 2 - fw / 2],
      [fw, H, -W / 2 - fw / 2, 0],
      [fw, H, W / 2 + fw / 2, 0]
    ];
    const geos = pieces.map(([w, h, x, y]) => new THREE.BoxGeometry(w, h, d).translate(x, y, d / 2));
    const m = new THREE.Mesh(mergeGeometries(geos, false), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }

  fixture(g, room, cy) {
    // Het armatuur hangt 1,4 m vóór de wand tegen het plafond en wijst naar het werk.
    const local = new THREE.Vector3(0, room.height - cy - 0.06, 1.45);
    const can = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.2, 16), this.fixtureMat);
    body.rotation.x = Math.PI / 2;
    can.add(body);
    // De lens zit aan de +z-kant; draai +z naar het midden van het werk.
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.052, 16), this.lensMat);
    lens.position.z = 0.101;
    can.add(lens);
    can.position.copy(local);
    can.rotation.x = Math.atan2(local.y - 0.1, -local.z);
    g.add(can);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), this.fixtureMat);
    stem.position.set(local.x, local.y + 0.03, local.z);
    g.add(stem);
    // wereldgeometrie verzamelen en de losse meshes weer weghalen
    g.updateMatrixWorld(true);
    for (const m of [body, lens, stem]) {
      const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
      for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geo.deleteAttribute(name);
      this.fixtureParts.push({ geometry: geo, material: m.material });
    }
    g.remove(can, stem);
  }

  makeLabel(art) {
    const c = document.createElement('canvas');
    c.width = 600; c.height = 400;
    const x = c.getContext('2d');
    x.fillStyle = '#f5f2ea'; x.fillRect(0, 0, 600, 400);
    x.fillStyle = '#1c1b19';
    let y = 62;
    const tag = STATUS_TAG[art.status] || (art.interpretation ? 'KLEURNOTITIE · geen reproductie' : '');
    if (tag) {
      x.font = '700 22px "Inter Variable", Arial, sans-serif';
      x.fillStyle = art.status === 'eigen' ? '#8a5a1a' : '#7a3b2e';
      x.fillText(tag, 34, y - 10);
      y += 26;
      x.fillStyle = '#1c1b19';
    }
    x.font = '700 30px "Inter Variable", Arial, sans-serif';
    x.fillText(art.artist, 34, y);
    y += 48;
    x.font = 'italic 600 36px "Cormorant Garamond", Georgia, serif';
    const lines = wrapText(x, art.title, 34, y, 532, 38);
    y += lines * 38 + 8;
    x.font = '500 25px "Inter Variable", Arial, sans-serif';
    x.fillStyle = '#4a463f';
    x.fillText(art.year, 34, y);
    y += 34;
    x.font = '400 20px "Inter Variable", Arial, sans-serif';
    wrapText(x, art.medium, 34, y, 532, 25);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAniso;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.receiveShadow = true;
    return m;
  }

  buildSculpture(room, art) {
    const s = room.sculptures.find((q) => q.art === art.id);
    const g = new THREE.Group();
    g.position.set(s.x, 0, s.z);
    g.rotation.y = s.rot;
    this.group.add(g);
    const plinthH = 0.55, pw = 1.25, pd = 0.95;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(pw, plinthH, pd), this.frameMats.plinth);
    plinth.position.y = plinthH / 2;
    plinth.castShadow = plinth.receiveShadow = true;
    g.add(plinth);
    // Ruimtelijke impressie: drie afgeronde volumes, uitdrukkelijk geen replica.
    const bronze = this.frameMats.bronze;
    const form = new THREE.Group();
    const cap = (r, len, x, y, z, rx = 0, rz = 0) => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 20), bronze);
      m.position.set(x, y, z); m.rotation.set(rx, 0, rz);
      m.castShadow = true; m.receiveShadow = true;
      form.add(m);
    };
    cap(0.17, 0.62, -0.3, 0.62, 0, 0, 0.08);
    cap(0.16, 0.55, 0.3, 0.58, 0, 0, -0.08);
    cap(0.1, 0.18, 0, 0.62, 0.08, 0, Math.PI / 2);
    cap(0.08, 0.5, 0, 0.36, 0.05, 0, Math.PI / 2);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.7), bronze);
    base.position.y = 0.04;
    base.castShadow = true;
    form.add(base);
    form.position.y = plinthH;
    form.scale.setScalar(1.05);
    g.add(form);
    // bordje op de sokkel
    const label = this.makeLabel(art);
    label.scale.set(0.34, 0.23, 1);
    label.position.set(0, plinthH * 0.55, pd / 2 + 0.003);
    g.add(label);
    const note = this.makeNote('Ruimtelijke impressie door de curatoren – geen replica');
    note.scale.set(0.6, 0.06, 1);
    note.position.set(0, plinthH * 0.16, pd / 2 + 0.003);
    g.add(note);
    this.collision.addOBB(s.x, s.z, pw / 2, pd / 2, s.rot, { tall: true });

    g.updateMatrixWorld(true);
    const center = new THREE.Vector3(s.x, 1.25, s.z);
    const normal = new THREE.Vector3(Math.sin(s.rot), 0, Math.cos(s.rot));
    const item = { art, room: room.id, group: g, canvasMesh: null, mat: null, center, normal, w: 1.5, h: 1.6, loaded: true, sculpture: true };
    this.items.set(art.id, item);
    g.traverse((o) => { if (o.isMesh) { o.userData.artId = art.id; this.hitMeshes.push(o); } });
  }

  makeNote(text) {
    const c = document.createElement('canvas');
    c.width = 1000; c.height = 100;
    const x = c.getContext('2d');
    x.fillStyle = '#efece6'; x.fillRect(0, 0, 1000, 100);
    x.fillStyle = '#5d5850';
    x.font = '600 40px "Inter Variable", Arial, sans-serif';
    x.textAlign = 'center';
    x.fillText(text, 500, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  }

  // ── Texturen ──
  applyCanvas(item, canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAniso;
    this.setTexture(item, tex);
  }

  setTexture(item, tex) {
    const old = item.mat.map;
    item.mat.map = tex;
    item.mat.emissiveMap = tex;
    item.mat.emissiveIntensity = item.baseEmissive ?? 0.5;
    item.mat.needsUpdate = true;
    if (old && old !== tex) old.dispose();
  }

  setPlaceholder(item) {
    const { art } = item;
    item.baseEmissive = 0.5;
    if (art.status === 'eigen' && art.id === 'eigen-doek') {
      this.applyCanvas(item, ownPaintingCanvas());
      item.loaded = true;
    } else if (!art.image && art.interpretation) {
      this.applyCanvas(item, interpretationCanvas(art));
      item.loaded = true;
    } else {
      this.applyCanvas(item, placeholderCanvas(art, 'Afbeelding wordt geladen…'));
    }
  }

  // Laadt de echte afbeeldingen; eerst de opgegeven zalen.
  loadImages(priorityRooms, onProgress) {
    const queue = [...this.items.values()].filter((i) => i.art.image && !i.loaded);
    const rank = (i) => {
      const p = priorityRooms.indexOf(i.room);
      return p === -1 ? 99 : p;
    };
    queue.sort((a, b) => rank(a) - rank(b));
    const firstBatch = queue.filter((i) => rank(i) < 99);
    let done = 0;
    const total = firstBatch.length;
    // De 3D-textuur wordt verkleind tot max. 1024 px (scheelt GPU-geheugen);
    // de detailweergave gebruikt het scherpere originele bestand.
    const loadOne = async (item) => {
      try {
        const img = new Image();
        img.decoding = 'async';
        img.src = imageUrl(item.art.image.file);
        await img.decode();
        const k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k));
        c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        this.applyCanvas(item, c);
        item.loaded = true;
      } catch {
        item.error = true;
        item.loaded = true;
        this.applyCanvas(item, placeholderCanvas(item.art, 'Afbeelding kon niet worden geladen'));
      }
    };
    const first = (async () => {
      for (const item of firstBatch) {
        await loadOne(item);
        done++;
        onProgress?.(done, total);
      }
    })();
    // de rest op de achtergrond, zonder de start te vertragen
    first.then(async () => {
      for (const item of queue) if (!item.loaded) await loadOne(item);
    });
    return first;
  }

  setHover(artId) {
    if (this.hovered === artId) return;
    const prev = this.items.get(this.hovered);
    if (prev?.mat) prev.mat.emissiveIntensity = prev.baseEmissive;
    if (prev?.wash) prev.wash.material.opacity /= 1.35;
    this.hovered = artId;
    const cur = this.items.get(artId);
    if (cur?.mat) cur.mat.emissiveIntensity = cur.baseEmissive + 0.12;
    if (cur?.wash) cur.wash.material.opacity *= 1.35;
  }

  // Waar komt de afbeelding vandaan voor het detailpaneel?
  displaySource(artId) {
    const item = this.items.get(artId);
    const art = ART_BY_ID[artId];
    if (art.image && !item?.error) return { kind: 'img', src: imageUrl(art.image.file) };
    if (art.image && item?.error) return { kind: 'error' };
    if (art.id === 'eigen-doek') return { kind: 'canvas', canvas: ownPaintingCanvas() };
    if (art.id === 'eigen-installatie') return { kind: 'installation' };
    if (art.interpretation) return { kind: 'canvas', canvas: interpretationCanvas(art), interpretation: true };
    return { kind: 'error' };
  }
}
