import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { ROOMS, ROOM_BY_ID, ROUTE, DOOR_BY_ID, SPAWN, EYE_HEIGHT } from './data/rooms.js';
import { ARTWORKS, ART_BY_ID, isCounted } from './data/artworks.js';
import { TOUR } from './data/texts.js';
import { TIMELINE_YEARS } from './data/timeline.js';
import { CollisionWorld } from './core/collision.js';
import { Input, Player } from './core/controls.js';
import { CameraRig } from './core/cameraRig.js';
import { AudioEngine } from './core/audio.js';
import { Store } from './core/store.js';
import { Building } from './world/building.js';
import { ArtworkPresenter } from './world/artworks3d.js';
import { Panels } from './world/panels.js';
import { Installation } from './world/installation.js';
import { Lighting } from './world/lighting.js';
import { setAnisotropy } from './world/textures.js';
import { roomAt, doorPointInside } from './world/layout.js';
import { DetailView } from './ui/detail.js';
import { MODALS } from './ui/modals.js';
import { drawMap } from './ui/map.js';
import { $, esc } from './ui/dom.js';

const INTERACT_RANGE = 9.5;   // tot zover kun je een werk aanklikken
const NEAR_RANGE = 3.6;        // E-toets zonder te mikken

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.store = new Store();
    this.settings = this.store.settings;
    this.state = 'loading';
    this.timer = new THREE.Timer();
    this.time = 0;
    this.currentRoom = null;
    this.tourActive = false;
    this.tourIndex = 0;
    this.modalReturn = 'play';
    this.expectUnlock = false;
    this.lastLockPause = 0;
    this.fps = { frames: 0, acc: 0, slow: 0, warned: false };
  }

  // ───────────── opbouw ─────────────
  async init(onProgress) {
    const step = (p, msg) => onProgress?.(p, msg);
    step(0.05, 'Renderer starten…');
    // anti-aliasing kost veel op zwakke apparaten; op 'laag' staat het uit
    const renderer = (this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: this.settings.quality !== 'laag', powerPreference: 'high-performance' }));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = this.settings.quality !== 'laag';
    renderer.shadowMap.type = THREE.PCFShadowMap;
    setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

    const scene = (this.scene = new THREE.Scene());
    scene.background = new THREE.Color('#0d0c0b');
    const camera = (this.camera = new THREE.PerspectiveCamera(this.settings.fov, 1, 0.05, 900));
    this.resize();
    window.addEventListener('resize', () => this.resize());

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.32;

    // wandteksten worden op canvas getekend: eerst de lettertypen laden
    step(0.1, 'Lettertypen laden…');
    await Promise.race([
      Promise.all(['500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"', 'italic 600 40px "Cormorant Garamond"', '400 20px "Inter Variable"', '700 20px "Inter Variable"']
        .map((f) => document.fonts.load(f))),
      new Promise((r) => setTimeout(r, 4000))
    ]).catch(() => {});

    step(0.15, 'Zalen bouwen…');
    await nextFrame();
    this.collision = new CollisionWorld();
    this.building = new Building(scene, this.collision, this.settings.quality);
    this.building.build();

    step(0.35, 'Kunstwerken ophangen…');
    await nextFrame();
    this.art = new ArtworkPresenter(scene, renderer, this.collision);
    this.art.build();
    this.panels = new Panels(scene, renderer, this.collision);
    this.panels.build();
    this.installation = new Installation(scene, ROOM_BY_ID.finale.installation);
    this.art.items.set('eigen-installatie', {
      art: ART_BY_ID['eigen-installatie'], room: 'finale', installation: true,
      center: new THREE.Vector3(ROOM_BY_ID.finale.installation.x, 3.2, ROOM_BY_ID.finale.installation.z),
      normal: new THREE.Vector3(-1, 0, 0), w: 6.4, h: 6.2, loaded: true
    });

    step(0.5, 'Licht en schaduw instellen…');
    await nextFrame();
    this.lighting = new Lighting(scene, this.settings.quality);

    step(0.6, 'Looproutes berekenen…');
    await nextFrame();
    this.collision.buildGrid({ minX: -10.6, maxX: 37.2, minZ: -71.4, maxZ: 22.6 }, 0.4, 0.42);

    this.input = new Input(this.canvas);
    this.player = new Player(camera, this.collision);
    this.rig = new CameraRig(camera);
    this.audio = new AudioEngine();
    this.audio.muted = this.settings.muted;
    this.audio.volume = this.settings.volume;
    this.player.onStep = (run) => this.audio.step(run);

    this.interactives = [...this.art.hitMeshes, ...this.panels.hitMeshes, ...this.installation.hitMeshes];
    this.raycastList = [...this.interactives, ...this.building.blockers];
    this.blockerSet = new Set(this.building.blockers);
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = INTERACT_RANGE + 6;

    this.setupComposer();
    this.applySettings();
    this.bindUI();

    // werkvolgorde per zaal (voor vorig/volgend)
    this.roomOrder = {};
    for (const r of ROOMS) {
      const ids = (r.slots || []).map((s) => s.art);
      if (r.id === 'finale') ids.unshift('eigen-installatie');
      this.roomOrder[r.id] = ids;
    }

    this.player.place(SPAWN.x, SPAWN.z, SPAWN.yaw);
    step(0.7, 'Afbeeldingen laden…');
    await this.art.loadImages(['zaal1', 'entree'], (d, t) => step(0.7 + 0.28 * (d / t), `Afbeeldingen laden… (${d}/${t})`));
    // alle shaders vooraf compileren, zodat er tijdens het lopen niet gehaperd wordt
    step(0.98, 'Bijna klaar…');
    renderer.compile(scene, camera);
    this.renderer.setAnimationLoop(() => this.frame());
    step(1, 'Klaar');
  }

  setupComposer() {
    const size = this.renderer.getSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.22, 0.5, 0.92);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const q = this.settings.quality;
    const dpr = window.devicePixelRatio || 1;
    const ratio = q === 'laag' ? Math.min(dpr, 1) * 0.85 : q === 'hoog' ? Math.min(dpr, 2) : Math.min(dpr, 1.35);
    this.renderer?.setPixelRatio(ratio);
    this.renderer?.setSize(w, h, false);
    this.composer?.setPixelRatio(ratio);
    this.composer?.setSize(w, h);
    if (this.camera) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
  }

  // ───────────── UI-koppeling ─────────────
  bindUI() {
    this.detailHandlers = {
      onClose: (how) => this.closeDetail(how),
      onPrev: () => this.stepDetail(-1),
      onNext: () => this.stepDetail(1),
      getSource: (id) => this.art.displaySource(id)
    };
    this.detail = new DetailView(this.detailHandlers);
    $('#modal-close').addEventListener('click', () => this.closeModal(true));
    $('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') this.closeModal(true); });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-open]');
      if (b) { e.preventDefault(); this.openModal(b.dataset.open); }
    });
    $('#hud-menu').addEventListener('click', () => this.openPause());
    $('#hud-progress').addEventListener('click', () => this.openModal('collection'));
    $('#hud-sound').addEventListener('click', () => this.toggleSound());
    $('#hud-fullscreen').addEventListener('click', () => this.toggleFullscreen());
    $('#minimap').addEventListener('click', () => this.openModal('map'));

    this.input.on('lockchange', (locked) => {
      $('#resume-hint').hidden = locked || this.state !== 'play' || this.settings.dragLook;
      document.body.classList.toggle('locked', locked);
      if (!locked && this.state === 'play' && !this.expectUnlock) {
        this.lastLockPause = performance.now();
        this.openPause();
      }
      this.expectUnlock = false;
    });
    this.input.on('lockerror', () => {
      if (this.state === 'play' && !this.settings.dragLook) this.toast('De muis kon niet worden vergrendeld. Je kunt rondkijken door te slepen.');
      this.lockFailed = true;
    });
    this.input.on('click', (c) => this.onClick(c));
    this.input.on('keydown', (e) => this.onKey(e));
    this.input.on('joystick', (j) => {
      const el = $('#joystick');
      el.hidden = !j.active;
      if (j.active) {
        el.style.left = `${j.x}px`; el.style.top = `${j.y}px`;
        el.firstElementChild.style.transform = `translate(${(j.kx || 0) * 40}px, ${(j.ky || 0) * 40}px)`;
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.audio.suspend(); else if (this.state !== 'start') this.audio.resume();
    });
  }

  // De game-API voor de vensters.
  get api() {
    const g = this;
    return {
      get settings() { return g.settings; },
      get viewed() { return g.store.viewed; },
      get visitedRooms() { return g.store.visitedRooms; },
      get reflection() { return g.store.reflection; },
      get quizBest() { return g.store.quizBest; },
      get startedAt() { return g.store.startedAt; },
      get currentRoom() { return g.currentRoom || 'entree'; },
      get tourActive() { return g.tourActive; },
      resume: (lock) => g.resume(lock),
      startTour: () => g.startTour(),
      stopTour: () => g.stopTour(),
      travelTo: (id) => g.travelTo(id),
      toStartScreen: () => g.toStartScreen(),
      openModal: (k, arg) => g.openModal(k, arg),
      openArtFromList: (id) => g.openArtFromList(id),
      setSetting: (k, v) => g.setSetting(k, v),
      saveReflection: (choice, text) => { g.store.reflection = { choice, text }; g.store.save(); },
      saveQuiz: (score) => { if (g.store.quizBest === null || score > g.store.quizBest) { g.store.quizBest = score; g.store.save(); } },
      restartRoute: () => g.restartRoute(),
      mapState: () => g.mapState()
    };
  }

  // ───────────── toestanden ─────────────
  showStart() {
    this.state = 'start';
    $('#hud').hidden = true;
    $('#start').hidden = false;
    this.input.enabled = false;
    this.player.place(SPAWN.x, SPAWN.z, SPAWN.yaw);
    $('#btn-enter').focus();
  }

  enter() {
    // wordt aangeroepen vanuit een klik: Pointer Lock en audio mogen nu starten
    this.audio.start().then(() => this.audio.setMood(ROOM_BY_ID[this.currentRoom || 'entree'].theme.mood));
    $('#start').hidden = true;
    $('#hud').hidden = false;
    this.state = 'play';
    this.input.enabled = true;
    this.updateRoom(true);
    this.lockIfWanted();
    if (!this.store.visitedRooms.size || !this.store.viewed.size) this.toast('Welkom! Loop met W A S D en kijk rond met de muis. Klik op een werk of druk op E om het te bekijken.', 7000);
    this.canvas.focus();
  }

  toStartScreen() {
    this.stopTour(false);
    this.hideModal();
    this.detail.hide();
    this.input.releaseLock();
    this.expectUnlock = true;
    this.showStart();
  }

  lockIfWanted() {
    if (this.settings.dragLook || this.isTouch) { $('#resume-hint').hidden = true; return; }
    this.input.requestLock();
  }

  resume(lock) {
    this.hideModal();
    this.state = 'play';
    this.input.enabled = true;
    if (lock) this.lockIfWanted();
    else $('#resume-hint').hidden = this.input.locked || this.settings.dragLook;
  }

  openPause() {
    if (this.state === 'detail' || this.state === 'start' || this.state === 'loading') return;
    this.modalReturn = 'play';
    this.openModal('pause');
  }

  openModal(kind, arg) {
    const def = MODALS[kind];
    if (!def) return;
    const fromStart = this.state === 'start';
    if (this.state === 'play' || this.state === 'tour') {
      this.wasTour = this.state === 'tour';
      this.modalReturn = kind === 'pause' ? 'play' : (this.wasTour ? 'tour' : 'play');
      if (this.input.locked) { this.expectUnlock = true; this.input.releaseLock(); }
    } else if (this.state === 'modal' && this.currentModal === 'pause' && kind !== 'pause') {
      this.modalReturn = 'pause';
    } else if (fromStart) {
      this.modalReturn = 'start';
    } else if (this.state === 'gallery') {
      this.modalReturn = 'gallery';
    }
    if (this.state === 'tour') this.rig.cancel();
    this.state = 'modal';
    this.currentModal = kind;
    this.input.enabled = false;
    const m = def(this.api, arg);
    $('#modal-title').textContent = m.title;
    const body = $('#modal-body');
    body.innerHTML = m.html;
    $('#modal-card').classList.toggle('wide', !!m.wide);
    $('#modal').hidden = false;
    $('#resume-hint').hidden = true;
    $('#hint').hidden = true;
    m.bind?.(body);
    body.scrollTop = 0;
    (body.querySelector('.btn.primary, button, a, input') || $('#modal-close')).focus({ preventScroll: true });
  }

  hideModal() {
    $('#modal').hidden = true;
    this.currentModal = null;
  }

  closeModal(byClick) {
    const ret = this.modalReturn;
    if (this.currentModal !== 'pause' && ret === 'pause') { this.openModal('pause'); this.modalReturn = 'play'; return; }
    this.hideModal();
    if (ret === 'start') { this.state = 'start'; return; }
    if (ret === 'gallery') { this.state = 'gallery'; return; }
    if (ret === 'tour' && this.tourActive) { this.state = 'tour'; this.goTourStop(this.tourIndex); return; }
    this.resume(byClick);
  }

  // ───────────── invoer ─────────────
  onKey(e) {
    const k = e.code;
    if (this.detail.lightbox.isOpen) { if (this.detail.lightbox.key(e)) e.preventDefault(); return; }
    if (k === 'Escape') {
      if (performance.now() - this.lastLockPause < 350) return;
      if (this.state === 'detail') this.closeDetail('escape');
      else if (this.state === 'modal') this.closeModal(false);
      else if (this.state === 'tour') this.stopTour();
      else if (this.state === 'play' && !this.input.locked) this.openPause();
      else if (this.state === 'gallery' && this.detail.open) this.galleryCloseDetail?.();
      return;
    }
    if (this.state === 'detail') {
      if (k === 'ArrowLeft') { this.stepDetail(-1); e.preventDefault(); }
      if (k === 'ArrowRight') { this.stepDetail(1); e.preventDefault(); }
      if (k === 'KeyZ') this.detail.openZoom();
      return;
    }
    if (this.state === 'modal') {
      const map = { KeyM: 'map', KeyT: 'timeline', KeyC: 'collection', KeyH: 'help' };
      if (map[k] && this.currentModal === map[k]) this.closeModal(false);
      return;
    }
    if (this.state !== 'play' && this.state !== 'tour') return;
    if (k === 'KeyE') this.interactKey();
    else if (k === 'KeyM') this.openModal('map');
    else if (k === 'KeyT') this.openModal('timeline');
    else if (k === 'KeyC') this.openModal('collection');
    else if (k === 'KeyH') this.openModal('help');
    else if (k === 'KeyG') this.toggleSound();
    else if (k === 'KeyF') this.toggleFullscreen();
    else if (k === 'KeyP') this.openPause();
  }

  onClick(c) {
    if (this.state !== 'play') return;
    const hit = c.center ? this.pick(0, 0) : this.pick(...this.ndc(c.x, c.y));
    if (hit && hit.dist <= INTERACT_RANGE) { this.activate(hit); return; }
    if (hit && hit.dist > INTERACT_RANGE) { this.toast('Loop dichterbij om dit te bekijken.'); return; }
    if (!this.input.locked && !c.touch) this.lockIfWanted();
  }

  ndc(x, y) {
    return [(x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1];
  }

  pick(nx, ny) {
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    const hits = this.raycaster.intersectObjects(this.raycastList, false);
    for (const h of hits) {
      if (this.blockerSet.has(h.object)) return null;
      const o = h.object;
      if (o.userData.artId) return { kind: 'art', id: o.userData.artId, dist: h.distance };
      if (o.userData.panel) return { kind: 'panel', panel: o.userData.panel, uv: h.uv, dist: h.distance };
    }
    return null;
  }

  activate(hit) {
    if (hit.kind === 'art') this.openArt(hit.id);
    else this.panelAction(hit.panel, hit.uv);
  }

  panelAction(p, uv) {
    if (p.action === 'timeline') {
      const i = uv ? Math.min(TIMELINE_YEARS.length - 1, Math.max(0, Math.floor(((uv.x * 4096 - 60) / (4096 - 120)) * TIMELINE_YEARS.length))) : 0;
      this.openModal('timeline', TIMELINE_YEARS[i]);
    } else if (p.action === 'room') this.openModal('room', p.room);
    else this.openModal(p.action);
  }

  interactKey() {
    if (this.state !== 'play') return;
    const hit = this.hoverHit;
    if (hit && hit.dist <= INTERACT_RANGE) { this.activate(hit); return; }
    // dichtstbijzijnde werk vóór je
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    let best = null, bestD = NEAR_RANGE;
    for (const [id, item] of this.art.items) {
      const d = item.center.distanceTo(this.camera.position);
      const dir = item.center.clone().sub(this.camera.position).normalize();
      if (d < bestD && dir.dot(fwd) > 0.45) { best = id; bestD = d; }
    }
    if (best) this.openArt(best);
    else this.toast('Er is hier geen kunstwerk binnen bereik. Kijk naar een werk en druk op E.');
  }

  // ───────────── detailweergave ─────────────
  viewFor(item, { centered = false } = {}) {
    const cam = this.camera;
    const vt = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const ht = vt * cam.aspect;
    const twoPane = !centered && window.innerWidth >= 900;
    const narrow = !centered && !twoPane;
    if (item.sculpture || item.installation) {
      const dist = item.installation ? 10.5 : 3.2;
      const pos = item.center.clone().addScaledVector(item.normal, dist);
      pos.y = item.installation ? 2.4 : 1.6;
      const target = item.center.clone();
      if (twoPane) { const right = new THREE.Vector3().crossVectors(item.normal.clone().negate(), new THREE.Vector3(0, 1, 0)); pos.addScaledVector(right, dist * ht * 0.42); target.addScaledVector(right, dist * ht * 0.42); }
      return { pos, quat: lookQuat(pos, target) };
    }
    const W = item.w + 0.25, H = item.h + 0.25;
    const fracW = twoPane ? 0.4 : 0.86, fracH = twoPane ? 0.76 : narrow ? 0.42 : 0.72;
    let d = Math.max(H / (2 * vt * fracH), W / (2 * ht * fracW));
    d = THREE.MathUtils.clamp(d, 0.75, 9);
    const n = item.normal, f = n.clone().negate();
    const right = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
    // niet verder terug dan de ruimte toelaat
    for (let i = 0; i < 20; i++) {
      const p = item.center.clone().addScaledVector(n, d);
      if (this.collision.inWalkArea(p.x, p.z, 0.3) && !this.collision.blocked(p.x, p.z, 0.15, true)) break;
      d *= 0.9;
    }
    const visW = 2 * d * ht, visH = 2 * d * vt;
    const pos = item.center.clone().addScaledVector(n, d);
    if (twoPane) pos.addScaledVector(right, visW * 0.24);
    if (narrow) pos.y -= visH * 0.2;
    return { pos, quat: lookQuat(pos, pos.clone().add(f)) };
  }

  pathTo(from, to) {
    const pts = this.collision.findPath(from.x, from.z, to.x, to.z);
    return pts.map((p, i) => {
      // tussenpunten op ooghoogte, begin en eind op de echte camerahoogte
      const y = i === 0 ? from.y : i === pts.length - 1 ? to.y : EYE_HEIGHT;
      return new THREE.Vector3(p.x, y, p.z);
    });
  }

  openArt(id, { keepReturn = false } = {}) {
    const item = this.art.items.get(id);
    if (!item) return;
    const fromPlay = this.state === 'play' || this.state === 'tour';
    if (fromPlay && !keepReturn) {
      this.returnState = this.state === 'tour' ? 'tour' : 'play';
      this.returnPose = { pos: this.camera.position.clone(), quat: this.camera.quaternion.clone() };
    }
    if (this.input.locked) { this.expectUnlock = true; this.input.releaseLock(); }
    this.state = 'detail';
    this.input.enabled = false;
    this.input.keys.clear();
    $('#hint').hidden = true;
    $('#resume-hint').hidden = true;
    this.art.setHover(null);
    this.showDetail(id);
    const v = this.viewFor(item);
    this.rig.fly(this.pathTo(this.camera.position, v.pos), v.quat, { speed: 5, minTime: 0.9, maxTime: 3.2, reducedMotion: this.settings.reducedMotion });
    this.audio.chime(true);
    this.markViewed(id);
  }

  showDetail(id) {
    this.detailId = id;
    this.detail.setHandlers(this.detailHandlers);
    const art = ART_BY_ID[id];
    const order = this.roomOrder[art.room];
    const i = order.indexOf(id);
    this.detail.show(art, {
      index: i, total: order.length,
      prev: i > 0 ? ART_BY_ID[order[i - 1]] : null,
      next: i < order.length - 1 ? ART_BY_ID[order[i + 1]] : null
    });
    $('#detail-close').focus({ preventScroll: true });
  }

  stepDetail(dir) {
    if (this.state !== 'detail') return;
    const art = ART_BY_ID[this.detailId];
    const order = this.roomOrder[art.room];
    const j = order.indexOf(this.detailId) + dir;
    if (j < 0 || j >= order.length) return;
    const id = order[j];
    this.showDetail(id);
    const v = this.viewFor(this.art.items.get(id));
    this.rig.fly(this.pathTo(this.camera.position, v.pos), v.quat, { speed: 6, minTime: 0.8, maxTime: 3, reducedMotion: this.settings.reducedMotion });
    this.markViewed(id);
  }

  closeDetail(how) {
    if (this.state !== 'detail') return;
    this.detail.hide();
    this.audio.chime(false);
    const back = this.returnPose;
    this.state = 'returning';
    if (how === 'button' && this.returnState !== 'tour') this.lockIfWanted();
    const done = () => {
      if (this.returnState === 'tour' && this.tourActive) { this.state = 'tour'; this.showTourCard(); return; }
      this.player.syncFromCamera();
      this.state = 'play';
      this.input.enabled = true;
      $('#resume-hint').hidden = this.input.locked || this.settings.dragLook || this.isTouch;
    };
    if (!back) { done(); return; }
    this.rig.fly(this.pathTo(this.camera.position, back.pos), back.quat, { speed: 6, minTime: 0.7, maxTime: 3, reducedMotion: this.settings.reducedMotion }).then(done);
  }

  markViewed(id) {
    if (this.store.markViewed(id)) this.updateProgress();
  }

  // Werk openen vanuit een lijst of de tijdlijn: eerst naar het werk reizen.
  openArtFromList(id) {
    const item = this.art.items.get(id);
    if (!item) return;
    this.hideModal();
    if (this.modalReturn === 'gallery' || this.state === 'gallery') { this.state = 'gallery'; this.galleryOpenArt?.(id); return; }
    this.stopTour(false);
    const near = item.room === this.currentRoom && item.center.distanceTo(this.camera.position) < 16;
    if (near) {
      this.state = 'play';
      this.openArt(id);
      return;
    }
    const stand = this.viewFor(item, { centered: true });
    const standPos = stand.pos.clone();
    standPos.y = EYE_HEIGHT;
    this.state = 'transition';
    this.fade(() => {
      this.camera.position.copy(standPos);
      this.camera.quaternion.copy(stand.quat);
      this.player.syncFromCamera();
      this.updateRoom();
      this.state = 'play';
      this.openArt(id);
    });
  }

  // ───────────── reizen ─────────────
  entryPoint(roomId) {
    if (roomId === 'entree') return { x: SPAWN.x, z: SPAWN.z, yaw: SPAWN.yaw };
    const idx = ROUTE.findIndex((r) => r.next === roomId);
    const door = DOOR_BY_ID[ROUTE[idx].door];
    const p = doorPointInside(door, roomId, 1.6);
    const r = ROOM_BY_ID[roomId].rect;
    const cx = (r[0] + r[1]) / 2, cz = (r[2] + r[3]) / 2;
    return { x: p.x, z: p.z, yaw: Math.atan2(-(cx - p.x), -(cz - p.z)) };
  }

  travelTo(roomId) {
    this.hideModal();
    this.stopTour(false);
    if (this.state === 'modal' || this.state === 'pause') this.lockIfWanted();
    this.state = 'transition';
    this.fade(() => {
      const e = this.entryPoint(roomId);
      this.player.place(e.x, e.z, e.yaw);
      this.updateRoom();
      this.state = 'play';
      this.input.enabled = true;
      $('#resume-hint').hidden = this.input.locked || this.settings.dragLook || this.isTouch;
    });
  }

  restartRoute() {
    this.store.resetProgress();
    this.updateProgress();
    this.currentRoom = null;
    this.travelTo('entree');
    this.toast('De route begint opnieuw bij de entree. Je voortgang is gewist.');
  }

  fade(mid) {
    const f = $('#fade');
    f.classList.add('on');
    setTimeout(() => {
      mid();
      requestAnimationFrame(() => f.classList.remove('on'));
    }, this.settings.reducedMotion ? 120 : 420);
  }

  // ───────────── tour ─────────────
  startTour() {
    this.hideModal();
    this.tourActive = true;
    this.tourIndex = 0;
    this.state = 'tour';
    this.input.enabled = false;
    if (this.input.locked) { this.expectUnlock = true; this.input.releaseLock(); }
    $('#resume-hint').hidden = true;
    this.goTourStop(0);
  }

  stopTour(resume = true) {
    if (!this.tourActive) return;
    this.tourActive = false;
    this.rig.cancel();
    $('#tour-card').hidden = true;
    document.body.classList.remove('tour-open');
    if (resume) {
      this.player.syncFromCamera();
      this.state = 'play';
      this.input.enabled = true;
      $('#resume-hint').hidden = this.input.locked || this.settings.dragLook || this.isTouch;
    }
  }

  tourView(stop) {
    if (stop.kind === 'art') return this.viewFor(this.art.items.get(stop.id), { centered: true });
    const a = this.panels.anchors[stop.id];
    const pos = a.center.clone().addScaledVector(a.normal, 9);
    pos.y = EYE_HEIGHT + 0.4;
    return { pos, quat: lookQuat(pos, a.center.clone().setY(a.center.y - 1.2)) };
  }

  goTourStop(i) {
    this.tourIndex = THREE.MathUtils.clamp(i, 0, TOUR.length - 1);
    const stop = TOUR[this.tourIndex];
    const v = this.tourView(stop);
    this.showTourCard();
    const from = this.camera.position.clone();
    const dist = from.distanceTo(v.pos);
    if (dist > 45) {
      // ver weg: kort vervagen in plaats van een lange vlucht
      this.fade(() => {
        this.camera.position.copy(v.pos);
        this.camera.quaternion.copy(v.quat);
        this.updateRoom();
      });
      return;
    }
    this.rig.fly(this.pathTo(from, v.pos), v.quat, { speed: 7, minTime: 1.2, maxTime: 7, reducedMotion: this.settings.reducedMotion });
    if (stop.kind === 'art') this.markViewed(stop.id);
  }

  showTourCard() {
    const stop = TOUR[this.tourIndex];
    const el = $('#tour-card');
    el.hidden = false;
    document.body.classList.add('tour-open');
    el.innerHTML = `
      <p class="eyebrow">Korte tour · stop ${this.tourIndex + 1} van ${TOUR.length}</p>
      <p class="tour-text">${esc(stop.text)}</p>
      <div class="row-actions">
        <button class="btn ghost small" data-t="prev" ${this.tourIndex === 0 ? 'disabled' : ''}>← Vorige</button>
        ${stop.kind === 'art' ? '<button class="btn ghost small" data-t="detail">Bekijk details</button>' : ''}
        <button class="btn primary small" data-t="next">${this.tourIndex < TOUR.length - 1 ? 'Volgende stop →' : 'Tour afronden'}</button>
        <button class="btn ghost small" data-t="stop">Stop tour</button>
      </div>`;
    el.querySelector('[data-t="prev"]').onclick = () => this.goTourStop(this.tourIndex - 1);
    el.querySelector('[data-t="next"]').onclick = () => {
      if (this.tourIndex < TOUR.length - 1) this.goTourStop(this.tourIndex + 1);
      else { this.stopTour(); this.lockIfWanted(); this.toast('De tour is klaar. Kijk gerust verder rond!'); }
    };
    el.querySelector('[data-t="stop"]').onclick = () => { this.stopTour(); this.lockIfWanted(); };
    el.querySelector('[data-t="detail"]')?.addEventListener('click', () => {
      this.returnState = 'tour';
      this.returnPose = { pos: this.camera.position.clone(), quat: this.camera.quaternion.clone() };
      el.hidden = true;
      this.state = 'tour';
      this.openArt(stop.id, { keepReturn: true });
    });
    el.querySelector('[data-t="next"]').focus({ preventScroll: true });
  }

  // ───────────── instellingen ─────────────
  setSetting(key, value) {
    this.store.set(key, value);
    this.applySettings(key);
  }

  applySettings(changed) {
    const s = this.settings;
    document.documentElement.dataset.text = s.textSize;
    document.documentElement.dataset.contrast = s.highContrast ? 'hoog' : 'normaal';
    this.camera.fov = s.fov;
    this.camera.updateProjectionMatrix();
    this.audio.setVolume(s.volume);
    this.audio.setMuted(s.muted);
    $('#hud-sound').classList.toggle('off', s.muted);
    $('#hud-sound').setAttribute('aria-pressed', String(!s.muted));
    if (changed === 'quality' || changed === undefined) {
      const shadows = s.quality !== 'laag';
      if (this.renderer.shadowMap.enabled !== shadows) {
        this.renderer.shadowMap.enabled = shadows;
        this.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
      }
      this.lighting.applyQuality(s.quality);
      this.resize();
    }
    if (changed === 'dragLook' && s.dragLook) this.input.releaseLock();
  }

  toggleSound() {
    this.setSetting('muted', !this.settings.muted);
    this.toast(this.settings.muted ? 'Geluid uit' : 'Geluid aan', 1500);
  }

  toggleFullscreen() {
    const d = document;
    if (!d.fullscreenElement) d.documentElement.requestFullscreen?.().then(() => this.lockIfWanted()).catch(() => this.toast('Volledig scherm wordt in deze browser niet ondersteund.'));
    else d.exitFullscreen?.();
  }

  // ───────────── HUD ─────────────
  updateProgress() {
    const counted = ARTWORKS.filter(isCounted);
    const seen = counted.filter((a) => this.store.viewed.has(a.id)).length;
    $('#hud-progress-text').textContent = `${seen}/${counted.length}`;
  }

  updateRoom(force = false) {
    const p = this.camera.position;
    const room = roomAt(p.x, p.z);
    if (!room || (room.id === this.currentRoom && !force)) return;
    this.currentRoom = room.id;
    const first = this.store.markRoom(room.id);
    this.lighting.setRoom(room.id);
    this.audio.setMood(room.theme.mood, (room.rect[1] - room.rect[0]) * (room.rect[3] - room.rect[2]) / 60);
    this.audio.setFloor(room.theme.floor);
    $('#hud-room-label').textContent = room.id === 'entree' ? 'Entree' : room.label;
    $('#hud-room-title').textContent = room.title;
    const route = ROUTE.find((r) => r.room === room.id);
    const next = ROOM_BY_ID[route.next];
    $('#hud-next-title').textContent = next.id === 'entree' ? 'terug naar de entree' : `${next.label} · ${next.title}`;
    this.nextDoorPoint = doorPointInside(DOOR_BY_ID[route.door], room.id, -0.3);
    this.updateProgress();
    if (this.state === 'play' || this.state === 'tour') this.showBanner(room, first);
  }

  showBanner(room, first) {
    const b = $('#banner');
    b.querySelector('.banner-label').textContent = room.id === 'entree' ? 'Entree' : room.label;
    b.querySelector('.banner-title').textContent = room.title;
    b.hidden = false;
    b.classList.remove('out');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.hidden = true; }, 600); }, first ? 3800 : 2200);
  }

  toast(msg, ms = 4200) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), ms);
    setTimeout(() => t.remove(), ms + 500);
  }

  mapState() {
    const pts = [];
    for (const [id, item] of this.art.items) if (ART_BY_ID[id].status !== 'eigen' || id === 'eigen-installatie') pts.push({ id, x: item.center.x, z: item.center.z });
    const route = ROUTE.find((r) => r.room === (this.currentRoom || 'entree'));
    return {
      player: { x: this.camera.position.x, z: this.camera.position.z },
      yaw: new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ').y,
      viewed: this.store.viewed,
      currentRoom: this.currentRoom,
      nextRoom: route?.next,
      artPoints: pts
    };
  }

  updateHud(dt) {
    // kompaspijl naar de volgende zaal
    if (this.nextDoorPoint) {
      const p = this.camera.position;
      const dx = this.nextDoorPoint.x - p.x, dz = this.nextDoorPoint.z - p.z;
      const len = Math.hypot(dx, dz) || 1;
      const yaw = this.player.yaw;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const xs = (dx * rx + dz * rz) / len, ys = (dx * fx + dz * fz) / len;
      $('#hud-next-arrow').style.transform = `rotate(${Math.atan2(xs, ys)}rad)`;
    }
    this.mapTimer = (this.mapTimer || 0) - dt;
    if (this.mapTimer <= 0) {
      this.mapTimer = 0.12;
      const c = $('#minimap');
      drawMap(c.getContext('2d'), c.width, c.height, this.mapState());
    }
  }

  updateHover() {
    let hit = null;
    if (this.input.locked) hit = this.pick(0, 0);
    else if (this.input.pointer.inside && !this.input.dragging) hit = this.pick(...this.ndc(this.input.pointer.x, this.input.pointer.y));
    this.hoverHit = hit;
    const inRange = hit && hit.dist <= INTERACT_RANGE;
    this.art.setHover(inRange && hit.kind === 'art' ? hit.id : null);
    $('#crosshair').classList.toggle('active', !!inRange);
    this.canvas.style.cursor = !this.input.locked && inRange ? 'pointer' : '';
    const hint = $('#hint');
    if (!hit) { hint.hidden = true; return; }
    let label;
    if (hit.kind === 'art') {
      const a = ART_BY_ID[hit.id];
      label = inRange ? `<strong>${esc(a.title)}</strong><span>${esc(a.artist)} · ${esc(a.year)}</span><em>Klik om dit werk van dichtbij te bekijken · of druk op <kbd>E</kbd></em>` : `<span>Loop dichterbij om <strong>${esc(a.title)}</strong> te bekijken</span>`;
    } else {
      const txt = { room: 'Klik om de zaaltekst te lezen', about: 'Klik voor de toelichting op de tentoonstelling', credits: 'Klik voor credits en bronnen', timeline: 'Klik op een jaar om de tijdlijn te openen', reflection: 'Klik om je reflectie te geven', end: 'Klik om de tentoonstelling af te ronden' }[hit.panel.action] || 'Klik om te openen';
      label = inRange ? `<em>${txt} · of druk op <kbd>E</kbd></em>` : '<span>Loop dichterbij</span>';
    }
    if (hint.dataset.key !== label) { hint.innerHTML = label; hint.dataset.key = label; }
    hint.hidden = false;
  }

  // ───────────── hoofdlus ─────────────
  frame() {
    this.timer.update();
    const dt = Math.min(0.05, this.timer.getDelta());
    // in de lijstweergave is de 3D-scène onzichtbaar: niets renderen
    if (this.state === 'gallery' || (this.state === 'modal' && this.modalReturn === 'gallery')) return;
    this.time += dt;

    if (this.state === 'play') {
      const look = this.input.consumeLook();
      if (this.input.locked || this.input.dragging || this.input.touchLook.id !== null || this.settings.dragLook) this.player.look(look.dx, look.dy, this.settings);
      this.player.update(dt, this.input.axis(), this.settings);
      this.updateRoom();
      this.hoverTimer = (this.hoverTimer || 0) + 1;
      if (this.hoverTimer % 2 === 0) this.updateHover();
    } else {
      this.input.consumeLook();
      if (this.state !== 'start') $('#crosshair').classList.remove('active');
    }
    if (this.rig.busy) {
      this.rig.update(dt);
      if (this.state === 'tour' || this.state === 'returning') this.updateRoom();
    }
    if (this.state !== 'loading' && this.state !== 'start') this.updateHud(dt);

    this.building.update(dt, this.time);
    if (this.currentRoom === 'finale' || this.currentRoom === 'zaal5' || !this.currentRoom) this.installation.update(dt, this.time, this.settings.reducedMotion);
    this.lighting.update(dt, this.camera.position);

    if (this.state === 'start') {
      // langzaam rondkijken achter het startscherm
      this.camera.position.set(SPAWN.x, EYE_HEIGHT + 0.3, SPAWN.z + 2.5);
      this.camera.rotation.set(0.08, Math.sin(this.time * 0.08) * 0.35, 0);
      if (!this.lighting.keyRoom) this.lighting.setRoom('entree');
    }

    if (this.settings.quality === 'hoog') this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);

    this.monitor(dt);
  }

  monitor(dt) {
    const f = this.fps;
    f.frames++; f.acc += dt;
    if (f.acc >= 1) {
      const fps = f.frames / f.acc;
      this.lastFps = fps;
      f.frames = 0; f.acc = 0;
      if (this.state === 'play' && fps < 24 && this.settings.quality !== 'laag') f.slow++;
      else f.slow = 0;
      if (f.slow >= 6 && !f.warned) {
        f.warned = true;
        this.toast('Het beeld hapert een beetje. Kies bij Instellingen ‘Beeldkwaliteit: laag’ voor een soepelere ervaring.', 8000);
      }
    }
  }

  get isTouch() { return matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches; }

  debugState() {
    return {
      state: this.state, room: this.currentRoom, locked: this.input.locked,
      pos: { x: +this.camera.position.x.toFixed(2), y: +this.camera.position.y.toFixed(2), z: +this.camera.position.z.toFixed(2) },
      yaw: +this.player.yaw.toFixed(3), detail: this.detailId, rigBusy: this.rig.busy,
      viewed: this.store.viewed.size, fps: Math.round(this.lastFps || 0), calls: this.renderer.info.render.calls, tris: this.renderer.info.render.triangles,
      hover: this.hoverHit ? (this.hoverHit.id || this.hoverHit.panel?.action) : null
    };
  }
}

function lookQuat(pos, target) {
  const m = new THREE.Matrix4().lookAt(pos, target, new THREE.Vector3(0, 1, 0));
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

function nextFrame() { return new Promise((r) => requestAnimationFrame(() => r())); }

