import * as THREE from 'three';
import { EYE_HEIGHT } from '../data/rooms.js';

// Invoer: toetsenbord, muis (Pointer Lock of slepen) en aanraking.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.look = { dx: 0, dy: 0 };
    this.locked = false;
    this.dragging = false;
    this.dragMoved = 0;
    this.pointer = { x: 0, y: 0, inside: false };
    this.touchMove = { x: 0, y: 0, id: null, ox: 0, oy: 0 };
    this.touchLook = { id: null, x: 0, y: 0, moved: 0 };
    this.enabled = false;
    this.listeners = {};

    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      this.emit('lockchange', this.locked);
    });
    document.addEventListener('pointerlockerror', () => this.emit('lockerror'));
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (this.locked) { this.emit('click', { center: true }); return; }
      this.dragging = true;
      this.dragMoved = 0;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      if (this.dragging && !this.locked) {
        this.dragging = false;
        if (this.dragMoved < 6) this.emit('click', { x: e.clientX, y: e.clientY });
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (this.locked) {
        // sommige browsers geven bij het vergrendelen één grote sprong
        if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return;
        this.look.dx += e.movementX; this.look.dy += e.movementY;
      } else {
        this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.pointer.inside = e.target === canvas;
        if (this.dragging) {
          this.dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
          this.look.dx += e.movementX; this.look.dy += e.movementY;
        }
      }
    });
    canvas.addEventListener('mouseleave', () => { this.pointer.inside = false; });

    // aanraking: linkerhelft = lopen, rechterhelft = rondkijken, tik = bekijken
    canvas.addEventListener('touchstart', (e) => this.onTouch(e, 'start'), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.onTouch(e, 'move'), { passive: false });
    canvas.addEventListener('touchend', (e) => this.onTouch(e, 'end'), { passive: false });
    canvas.addEventListener('touchcancel', (e) => this.onTouch(e, 'end'), { passive: false });
  }

  on(name, fn) { (this.listeners[name] ||= []).push(fn); }
  emit(name, arg) { for (const fn of this.listeners[name] || []) fn(arg); }

  onKey(e, down) {
    const tag = (e.target && e.target.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
    if (down) {
      // in tekstvelden en schuifregelaars alleen Esc doorgeven (om te sluiten)
      if (!typing || e.key === 'Escape') this.emit('keydown', e);
      if (typing) return;
      this.keys.add(e.code);
      if (this.enabled && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    } else {
      this.keys.delete(e.code);
    }
  }

  onTouch(e, phase) {
    if (!this.enabled) return;
    e.preventDefault();
    const half = window.innerWidth / 2;
    for (const t of e.changedTouches) {
      if (phase === 'start') {
        if (t.clientX < half && this.touchMove.id === null) {
          Object.assign(this.touchMove, { id: t.identifier, ox: t.clientX, oy: t.clientY, x: 0, y: 0 });
          this.emit('joystick', { active: true, x: t.clientX, y: t.clientY });
        } else if (this.touchLook.id === null) {
          Object.assign(this.touchLook, { id: t.identifier, x: t.clientX, y: t.clientY, moved: 0, sx: t.clientX, sy: t.clientY });
        }
      } else if (phase === 'move') {
        if (t.identifier === this.touchMove.id) {
          const dx = t.clientX - this.touchMove.ox, dy = t.clientY - this.touchMove.oy;
          const len = Math.min(1, Math.hypot(dx, dy) / 60);
          const a = Math.atan2(dy, dx);
          this.touchMove.x = Math.cos(a) * len; this.touchMove.y = Math.sin(a) * len;
          this.emit('joystick', { active: true, x: this.touchMove.ox, y: this.touchMove.oy, kx: this.touchMove.x, ky: this.touchMove.y });
        } else if (t.identifier === this.touchLook.id) {
          const dx = t.clientX - this.touchLook.x, dy = t.clientY - this.touchLook.y;
          this.touchLook.moved += Math.abs(dx) + Math.abs(dy);
          this.look.dx += dx * 1.6; this.look.dy += dy * 1.6;
          this.touchLook.x = t.clientX; this.touchLook.y = t.clientY;
        }
      } else {
        if (t.identifier === this.touchMove.id) {
          this.touchMove.id = null; this.touchMove.x = 0; this.touchMove.y = 0;
          this.emit('joystick', { active: false });
        } else if (t.identifier === this.touchLook.id) {
          if (this.touchLook.moved < 10) this.emit('click', { x: t.clientX, y: t.clientY, touch: true });
          this.touchLook.id = null;
        }
      }
    }
  }

  requestLock() {
    if (this.locked) return Promise.resolve();
    try {
      const p = this.canvas.requestPointerLock?.();
      return p && p.catch ? p.catch(() => this.emit('lockerror')) : Promise.resolve();
    } catch {
      this.emit('lockerror');
      return Promise.resolve();
    }
  }

  releaseLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  consumeLook() {
    const d = { dx: this.look.dx, dy: this.look.dy };
    this.look.dx = 0; this.look.dy = 0;
    return d;
  }

  axis() {
    const k = this.keys;
    let x = 0, y = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (this.touchMove.id !== null) { x += this.touchMove.x; y -= this.touchMove.y; }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, run: k.has('ShiftLeft') || k.has('ShiftRight') };
  }
}

// De bezoeker: positie, kijkrichting, versnelling, botsingen en loopbeweging.
export class Player {
  constructor(camera, collision) {
    this.camera = camera;
    this.collision = collision;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.vel = new THREE.Vector2(0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.radius = 0.36;
    this.bobPhase = 0;
    this.bobAmount = 0;
    this.distance = 0;
    this.onStep = null;
    camera.rotation.order = 'YXZ';
  }

  place(x, z, yaw = 0, pitch = 0) {
    this.pos.set(x, 0, z);
    this.vel.set(0, 0);
    this.yaw = yaw;
    this.pitch = pitch;
    this.applyCamera(0);
  }

  look(dx, dy, settings) {
    const s = 0.0022 * settings.sensitivity;
    this.yaw -= dx * s;
    this.pitch -= dy * s * (settings.invertY ? -1 : 1);
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch));
  }

  update(dt, axis, settings) {
    const walk = 2.7, run = 5.2;
    const target = axis.run ? run : walk;
    // gewenste snelheid in wereldcoördinaten
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const fx = -sin, fz = -cos;   // vooruit
    const rx = cos, rz = -sin;    // rechts
    const wx = (fx * axis.y + rx * axis.x) * target;
    const wz = (fz * axis.y + rz * axis.x) * target;
    const accel = (axis.x || axis.y) ? 10 : 12;
    const k = 1 - Math.exp(-accel * dt);
    this.vel.x += (wx - this.vel.x) * k;
    this.vel.y += (wz - this.vel.y) * k;
    const speed = this.vel.length();
    if (speed < 0.01 && !(axis.x || axis.y)) this.vel.set(0, 0);

    // in kleine stappen bewegen, zodat je nooit door een dunne wand glipt
    const moveX = this.vel.x * dt, moveZ = this.vel.y * dt;
    const dist = Math.hypot(moveX, moveZ);
    const steps = Math.max(1, Math.ceil(dist / 0.08));
    const before = { x: this.pos.x, z: this.pos.z };
    const p = { x: this.pos.x, z: this.pos.z };
    for (let i = 0; i < steps; i++) {
      p.x += moveX / steps;
      p.z += moveZ / steps;
      this.collision.resolveCircle(p, this.radius);
    }
    // vangnet: blijf altijd binnen het museum
    if (!this.collision.inWalkArea(p.x, p.z, 0.05)) { p.x = before.x; p.z = before.z; this.vel.set(0, 0); }
    const moved = Math.hypot(p.x - before.x, p.z - before.z);
    this.pos.x = p.x; this.pos.z = p.z;
    // werkelijke snelheid na botsing, zodat we niet tegen de muur 'aanduwen'
    if (dt > 0) {
      const realSpeed = moved / dt;
      if (realSpeed < speed * 0.5) this.vel.multiplyScalar(0.5);
    }

    // loopbeweging en voetstappen
    this.distance += moved;
    const moving = moved / Math.max(dt, 1e-4) > 0.4;
    this.bobAmount += ((moving && settings.headBob && !settings.reducedMotion ? 1 : 0) - this.bobAmount) * Math.min(1, dt * 6);
    const prevPhase = this.bobPhase;
    this.bobPhase += moved * (axis.run ? 2.2 : 2.6);
    if (moving && Math.floor(prevPhase / Math.PI) !== Math.floor(this.bobPhase / Math.PI)) this.onStep?.(axis.run);
    this.applyCamera(dt);
  }

  applyCamera() {
    const bob = Math.sin(this.bobPhase) * 0.028 * this.bobAmount;
    const sway = Math.cos(this.bobPhase * 0.5) * 0.012 * this.bobAmount;
    this.camera.position.set(this.pos.x, EYE_HEIGHT + bob, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, sway * 0.15);
  }

  // Zet de interne kijkrichting gelijk aan de huidige camera (na een animatie).
  syncFromCamera() {
    const e = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.yaw = e.y;
    this.pitch = Math.max(-1.35, Math.min(1.35, e.x));
    this.pos.set(this.camera.position.x, 0, this.camera.position.z);
    this.vel.set(0, 0);
  }
}
