import * as THREE from 'three';
import { ROOMS, DOORS, ROOM_BY_ID, WALL_T } from '../data/rooms.js';
import { EXHIBITION, ABOUT, CURATORS, ROOM_TEXTS } from '../data/texts.js';
import { TIMELINE_YEARS, YEAR_HEADLINES, TIMELINE } from '../data/timeline.js';
import { wallPlacement, doorCenter } from './layout.js';
import { wrapText } from './textures.js';

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Inter Variable", Arial, sans-serif';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

export class Panels {
  constructor(scene, renderer, collision) {
    this.scene = scene;
    this.collision = collision;
    this.aniso = renderer.capabilities.getMaxAnisotropy();
    this.group = new THREE.Group();
    this.group.name = 'panels';
    scene.add(this.group);
    this.hitMeshes = [];
    this.anchors = {}; // panelId → { center, normal, w, h }
  }

  texture(canvas) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = this.aniso;
    return t;
  }

  plane(canvas, w, h, { emissive = 0.4, transparent = false } = {}) {
    const tex = this.texture(canvas);
    const mat = new THREE.MeshStandardMaterial({
      map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: emissive,
      roughness: 0.85, transparent, alphaTest: transparent ? 0.02 : 0
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.receiveShadow = !transparent;
    return m;
  }

  build() {
    for (const room of ROOMS) {
      for (const p of room.panels || []) this.buildPanel(room, p);
      if (room.stele) this.buildStele(room);
    }
    this.buildDoorSigns();
  }

  register(mesh, action, id, center, normal, w, h, extra = {}) {
    mesh.userData.panel = { action, id, ...extra };
    this.hitMeshes.push(mesh);
    this.anchors[id] = { center, normal, w, h, action };
  }

  buildPanel(room, p) {
    if (p.kind === 'kiosk') return this.buildKiosk(room, p);
    const { pos, normal, rotY } = wallPlacement(room, p.wall, p.at);
    let canvas;
    if (p.kind === 'title') canvas = this.drawTitle();
    else if (p.kind === 'intro') canvas = this.drawIntro();
    else if (p.kind === 'credits') canvas = this.drawCredits();
    else if (p.kind === 'timeline') canvas = this.drawTimeline();
    else if (p.kind === 'end') canvas = this.drawEnd();
    const transparent = p.kind === 'title';
    const mesh = this.plane(canvas, p.w, p.h, { emissive: p.kind === 'title' ? 1.1 : 0.45, transparent });
    mesh.position.copy(pos).addScaledVector(normal, 0.032);
    mesh.position.y = p.y;
    mesh.rotation.y = rotY;
    this.group.add(mesh);
    if (!transparent) {
      // dunne bronzen omlijsting
      const frame = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.06, p.h + 0.06, 0.03), new THREE.MeshStandardMaterial({ color: '#6c5434', roughness: 0.4, metalness: 0.8 }));
      frame.position.copy(pos).addScaledVector(normal, 0.01); // voorkant op 0,025 m: achter de tekst
      frame.position.y = p.y;
      frame.rotation.y = rotY;
      frame.receiveShadow = true;
      this.group.add(frame);
    }
    const center = mesh.position.clone();
    if (p.action) this.register(mesh, p.action, p.id, center, normal, p.w, p.h, { kind: p.kind });
    else this.anchors[p.id] = { center, normal, w: p.w, h: p.h };
  }

  drawTitle() {
    const [c, g] = makeCanvas(3000, 1000);
    g.clearRect(0, 0, 3000, 1000);
    g.textAlign = 'center';
    g.fillStyle = '#efe4cf';
    g.font = `600 330px ${SERIF}`;
    g.letterSpacing = '40px';
    g.fillText(EXHIBITION.title, 1500, 400);
    g.letterSpacing = '0px';
    g.fillStyle = '#c9a56a';
    g.fillRect(1100, 470, 800, 4);
    g.font = `500 96px ${SERIF}`;
    g.fillStyle = '#e8dcc4';
    g.fillText(`${EXHIBITION.subtitle} · ${EXHIBITION.period}`, 1500, 610);
    g.font = `500 52px ${SANS}`;
    g.fillStyle = '#bfae90';
    g.fillText(`Een fictieve wereldtentoonstelling samengesteld door ${EXHIBITION.curators.join(', ').replace(/, ([^,]*)$/, ' en $1')}`, 1500, 760);
    g.font = `500 40px ${SANS}`;
    g.fillStyle = '#9a8b72';
    g.fillText(`${EXHIBITION.course} · Begin hier ↓ Zaal 1`, 1500, 860);
    return c;
  }

  darkPanel(w, h) {
    const [c, g] = makeCanvas(w, h);
    g.fillStyle = '#1a1917'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8a6b43'; g.lineWidth = 3; g.strokeRect(24, 24, w - 48, h - 48);
    return [c, g];
  }

  drawIntro() {
    const [c, g] = this.darkPanel(1100, 1180);
    g.fillStyle = '#c9a56a';
    g.font = `700 30px ${SANS}`;
    g.fillText('OVER DEZE TENTOONSTELLING', 80, 120);
    g.fillStyle = '#f0e6d2';
    g.font = `600 64px ${SERIF}`;
    g.fillText('Na de storm', 80, 205);
    g.font = `400 31px ${SANS}`;
    g.fillStyle = '#ddd2bd';
    let y = 270;
    y += wrapText(g, ABOUT.intro, 80, y, 940, 44) * 44 + 26;
    g.fillStyle = '#c9a56a';
    g.font = `700 26px ${SANS}`;
    g.fillText('HOOFDVRAAG', 80, y); y += 52;
    g.fillStyle = '#f0e6d2';
    g.font = `italic 600 42px ${SERIF}`;
    y += wrapText(g, EXHIBITION.question, 80, y, 940, 50) * 50 + 26;
    g.font = `400 25px ${SANS}`;
    g.fillStyle = '#a89c86';
    y += wrapText(g, EXHIBITION.disclaimer, 80, y, 940, 34) * 34 + 30;
    g.fillStyle = '#c9a56a';
    g.font = `600 28px ${SANS}`;
    g.fillText('Klik voor de volledige toelichting →', 80, 1100);
    return c;
  }

  drawCredits() {
    const [c, g] = this.darkPanel(1000, 1200);
    g.fillStyle = '#c9a56a';
    g.font = `700 30px ${SANS}`;
    g.fillText('CURATOREN', 80, 120);
    let y = 200;
    for (const cur of CURATORS) {
      g.fillStyle = '#f0e6d2';
      g.font = `600 58px ${SERIF}`;
      g.fillText(cur.name, 80, y);
      g.fillStyle = '#cfc3ac';
      g.font = `400 27px ${SANS}`;
      y += 46;
      y += wrapText(g, cur.role, 80, y, 840, 36) * 36 + 46;
    }
    g.fillStyle = '#9a8e78';
    g.font = `400 23px ${SANS}`;
    wrapText(g, 'Klik voor credits en bronnen.', 80, 1110, 840, 30);
    return c;
  }

  drawTimeline() {
    const W = 4096, H = 650;
    const [c, g] = makeCanvas(W, H);
    g.fillStyle = '#1b1a18'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#c9a56a';
    g.font = `700 38px ${SANS}`;
    g.fillText('TIJDLIJN 1940–1950 · klik op een jaar voor de interactieve tijdlijn', 60, 70);
    const colW = (W - 120) / TIMELINE_YEARS.length;
    g.strokeStyle = '#8a6b43'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(60, 200); g.lineTo(W - 60, 200); g.stroke();
    TIMELINE_YEARS.forEach((yr, i) => {
      const x = 60 + i * colW;
      g.fillStyle = '#c9a56a';
      g.beginPath(); g.arc(x + 20, 200, 12, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f0e6d2';
      g.font = `600 100px ${SERIF}`;
      g.fillText(String(yr), x, 165);
      g.fillStyle = '#e3d6bd';
      g.font = `600 34px ${SANS}`;
      let y = 270;
      y += wrapText(g, YEAR_HEADLINES[yr], x, y, colW - 40, 42) * 42 + 20;
      g.font = `400 27px ${SANS}`;
      g.fillStyle = '#b8ab92';
      for (const ev of TIMELINE.filter((e) => e.year === yr).slice(0, 3)) {
        y += wrapText(g, '· ' + ev.title, x, y, colW - 40, 34) * 34 + 10;
        if (y > H - 40) break;
      }
      if (i > 0) {
        g.strokeStyle = 'rgba(201,165,106,0.25)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x - 20, 230); g.lineTo(x - 20, H - 40); g.stroke();
      }
    });
    return c;
  }

  drawEnd() {
    const [c, g] = makeCanvas(1200, 980);
    g.fillStyle = '#1f1d1a'; g.fillRect(0, 0, 1200, 980);
    g.strokeStyle = '#c9a56a'; g.lineWidth = 3; g.strokeRect(26, 26, 1148, 928);
    g.fillStyle = '#c9a56a';
    g.font = `700 30px ${SANS}`;
    g.fillText('AFSLUITING', 90, 130);
    g.fillStyle = '#f0e6d2';
    g.font = `600 76px ${SERIF}`;
    g.fillText('Wat neem je mee?', 90, 230);
    g.font = `400 32px ${SANS}`;
    g.fillStyle = '#ddd2bd';
    let y = 310;
    y += wrapText(g, 'Bekijk de belangrijkste inzichten van de tentoonstelling en test je kennis met de quiz.', 90, y, 1020, 46) * 46 + 40;
    g.fillStyle = '#c9a56a';
    g.font = `600 34px ${SANS}`;
    ['Inzichten', 'Quiz', 'Credits', 'Opnieuw beginnen'].forEach((t) => {
      g.fillText('→  ' + t, 90, y); y += 64;
    });
    g.fillStyle = '#a89c86';
    g.font = `400 26px ${SANS}`;
    g.fillText('Klik om af te ronden', 90, 900);
    return c;
  }

  buildStele(room) {
    const s = room.stele;
    const rot = Math.atan2(s.faceTo[0] - s.x, s.faceTo[1] - s.z);
    const W = 1.35, H = 2.3, D = 0.22;
    const g = new THREE.Group();
    g.position.set(s.x, 0, s.z);
    g.rotation.y = rot;
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), new THREE.MeshStandardMaterial({ color: '#1d1c1a', roughness: 0.55, metalness: 0.2 }));
    body.position.y = H / 2 + 0.06;
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.06, D + 0.1), new THREE.MeshStandardMaterial({ color: '#8a6b43', roughness: 0.4, metalness: 0.8 }));
    plinth.position.y = 0.03;
    g.add(plinth);
    const face = this.plane(this.drawStele(room), W - 0.1, H - 0.1, { emissive: 0.55 });
    face.position.set(0, H / 2 + 0.06, D / 2 + 0.003);
    g.add(face);
    this.group.add(g);
    this.collision.addOBB(s.x, s.z, W / 2 + 0.05, D / 2 + 0.05, rot, { tall: true });
    g.updateMatrixWorld(true);
    const center = new THREE.Vector3();
    face.getWorldPosition(center);
    const normal = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot));
    this.register(face, 'room', 'stele-' + room.id, center, normal, W, H, { room: room.id });
    body.userData.panel = face.userData.panel;
    this.hitMeshes.push(body);
  }

  drawStele(room) {
    const W = 760, H = 1300;
    const [c, g] = makeCanvas(W, H);
    const light = room.theme.ambient > 0.7;
    g.fillStyle = light ? '#f3efe6' : '#1d1c1a'; g.fillRect(0, 0, W, H);
    const ink = light ? '#1d1b18' : '#efe5d1';
    const soft = light ? '#5a554c' : '#bdb19b';
    const accent = '#a8834b';
    g.fillStyle = accent;
    g.font = `700 30px ${SANS}`;
    g.fillText(room.label.toUpperCase(), 60, 110);
    g.fillStyle = ink;
    g.font = `600 82px ${SERIF}`;
    let y = 210;
    y += wrapText(g, room.title, 60, y, 640, 86) * 86 + 10;
    g.fillStyle = accent; g.fillRect(60, y - 30, 140, 4);
    g.fillStyle = soft;
    g.font = `400 31px ${SANS}`;
    y += 30;
    y += wrapText(g, ROOM_TEXTS[room.id].lead, 60, y, 640, 45) * 45 + 30;
    g.fillStyle = accent;
    g.font = `600 26px ${SANS}`;
    if (room.curator) {
      const group = / en /.test(room.curator);
      if (group) g.font = `600 22px ${SANS}`;
      g.fillText(`${group ? 'Curatoren' : 'Curator'}: ${room.curator}`, 60, H - 150);
    }
    g.fillStyle = ink;
    g.font = `600 30px ${SANS}`;
    g.fillText('Klik voor de zaaltekst →', 60, H - 90);
    return c;
  }

  buildKiosk(room, p) {
    const rot = Math.atan2(p.faceTo[0] - p.x, p.faceTo[1] - p.z);
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z);
    g.rotation.y = rot;
    const metal = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.4, metalness: 0.6 });
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.4), metal);
    col.position.y = 0.5;
    col.castShadow = true;
    g.add(col);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.75), metal);
    top.position.set(0, 1.08, 0.05);
    top.rotation.x = 0.45; // schuin naar de bezoeker toe
    top.castShadow = true;
    g.add(top);
    const [c, x] = makeCanvas(1100, 750);
    x.fillStyle = '#efe8da'; x.fillRect(0, 0, 1100, 750);
    x.fillStyle = '#8a5a1a'; x.font = `700 34px ${SANS}`;
    x.fillText('REFLECTIE · WAT VIND JIJ?', 60, 100);
    x.fillStyle = '#1d1b18'; x.font = `italic 600 52px ${SERIF}`;
    wrapText(x, 'Moet kunst de werkelijkheid laten zien, of mag kunst juist laten voelen wat niet in woorden uit te drukken is?', 60, 190, 980, 62);
    x.fillStyle = '#8a5a1a'; x.font = `600 34px ${SANS}`;
    x.fillText('Klik om je antwoord te geven →', 60, 680);
    const screen = this.plane(c, 1.0, 0.68, { emissive: 0.7 });
    // het scherm ligt op het schuine blad; normaal wijst omhoog en naar de bezoeker
    const screenHolder = new THREE.Group();
    screenHolder.position.set(0, 1.08, 0.05);
    screenHolder.rotation.x = -(Math.PI / 2 - 0.45);
    screen.position.set(0, 0, 0.035);
    screenHolder.add(screen);
    g.add(screenHolder);
    this.group.add(g);
    this.collision.addOBB(p.x, p.z, 0.55, 0.4, rot, { tall: false });
    g.updateMatrixWorld(true);
    const center = new THREE.Vector3();
    screen.getWorldPosition(center);
    const normal = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot));
    this.register(screen, p.action, p.id, center, normal, 1.0, 0.7, { kind: 'kiosk' });
    for (const m of [col, top]) { m.userData.panel = screen.userData.panel; this.hitMeshes.push(m); }
  }

  buildDoorSigns() {
    for (const d of DOORS) {
      for (const [from, to] of [[d.a, d.b], [d.b, d.a]]) {
        const room = ROOM_BY_ID[from];
        const target = ROOM_BY_ID[to];
        const y = Math.min(d.height + 0.38, room.height - 0.3);
        const c = doorCenter(d);
        const r = room.rect;
        let normal, pos;
        const inner = 0.012;
        if (d.side === 'N' || d.side === 'S') {
          const zFace = (from === d.a) === (d.side === 'N') ? r[2] : r[3];
          normal = new THREE.Vector3(0, 0, zFace === r[2] ? 1 : -1);
          pos = new THREE.Vector3(c.x, y, zFace + normal.z * inner);
        } else {
          const xFace = (from === d.a) === (d.side === 'W') ? r[0] : r[1];
          normal = new THREE.Vector3(xFace === r[0] ? 1 : -1, 0, 0);
          pos = new THREE.Vector3(xFace + normal.x * inner, y, c.z);
        }
        const [cv, g] = makeCanvas(1400, 200);
        g.fillStyle = 'rgba(20,19,17,0.92)'; g.fillRect(0, 0, 1400, 200);
        g.fillStyle = '#c9a56a';
        g.font = `700 48px ${SANS}`;
        const lbl = target.id === 'entree' ? 'ENTREE' : target.label.toUpperCase();
        g.textAlign = 'center';
        g.fillText(lbl, 700, 78);
        g.fillStyle = '#efe5d1';
        g.font = `600 64px ${SERIF}`;
        g.fillText(target.title, 700, 160);
        const sign = this.plane(cv, 2.6, 0.37, { emissive: 0.8 });
        sign.position.copy(pos);
        sign.rotation.y = Math.atan2(normal.x, normal.z);
        this.group.add(sign);
      }
    }
    void WALL_T;
  }
}
