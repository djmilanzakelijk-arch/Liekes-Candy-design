import * as THREE from 'three';
import { ROOM_BY_ID, DOORS } from '../data/rooms.js';
import { doorCenter } from './layout.js';

// Lichtregie met weinig lichtbronnen (goed voor gewone laptops):
// - een sleutellicht MET schaduw en een vullicht in de zaal waar je bent;
// - een tweede vullicht in de dichtstbijzijnde buurzaal, zodat je door een
//   deuropening ook daar licht ziet;
// - vaste lichten voor het daglicht in zaal 5 en de oculus in de finale;
// - een hemisfeerlicht en een omgevingskaart voor zacht indirect licht.
// De schaduwkaart wordt alleen opnieuw berekend bij een zaalwissel (het museum
// staat stil), behalve in de finale, waar de installatie beweegt.

function roomLight(room) {
  const [x0, x1, z0, z1] = room.rect;
  const h = room.height;
  const half = Math.min(x1 - x0, z1 - z0) / 2;
  const halfMax = Math.max(x1 - x0, z1 - z0) / 2;
  return {
    pos: new THREE.Vector3((x0 + x1) / 2, h - 0.15, (z0 + z1) / 2),
    target: new THREE.Vector3((x0 + x1) / 2, 0, (z0 + z1) / 2),
    angle: Math.min(1.25, Math.atan((halfMax * 1.05) / h)),
    distance: Math.hypot(h, halfMax) * 1.25,
    intensity: room.theme.key * 1.55 * h * h,
    color: room.theme.keyColor,
    half
  };
}

class Fader {
  constructor(light) { this.light = light; this.room = null; this.next = null; this.target = 0; }
  assign(roomId) { if (roomId !== (this.next ?? this.room)) this.next = roomId; }
  update(dt, apply) {
    const L = this.light;
    if (this.next !== null) {
      L.intensity = Math.max(0, L.intensity - dt * (L.intensity * 7 + 60));
      if (L.intensity <= 0.001) { this.room = this.next; this.next = null; this.target = apply(this.room); }
    } else if (this.room) {
      L.intensity += (this.target - L.intensity) * Math.min(1, dt * 3);
    }
  }
}

export class Lighting {
  constructor(scene, quality) {
    this.scene = scene;
    this.hemi = new THREE.HemisphereLight('#f4ecdf', '#3a3530', 0.6);
    scene.add(this.hemi);

    this.fill = new THREE.SpotLight('#ffffff', 0, 30, 1, 0.9, 2);
    this.neighbor = new THREE.SpotLight('#ffffff', 0, 30, 1, 0.9, 2);
    this.key = new THREE.SpotLight('#ffffff', 0, 40, 1.0, 0.85, 2);
    this.key.castShadow = true;
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.03;
    this.key.shadow.autoUpdate = false;
    for (const l of [this.fill, this.neighbor, this.key]) scene.add(l, l.target);

    // daglicht door de ramen van zaal 5
    const z5 = ROOM_BY_ID.zaal5;
    this.window = new THREE.SpotLight('#fff3dc', 300, 34, 0.95, 1, 2);
    this.window.position.set(z5.rect[1] - 0.8, 6.0, (z5.rect[2] + z5.rect[3]) / 2);
    this.window.target.position.set(z5.rect[0], 1.6, (z5.rect[2] + z5.rect[3]) / 2);
    scene.add(this.window, this.window.target);

    // licht door de oculus in de finale
    const fin = ROOM_BY_ID.finale;
    this.oculus = new THREE.SpotLight('#fff2da', 1100, 26, 0.32, 0.7, 2);
    this.oculus.position.set(fin.installation.x, fin.height + 2, fin.installation.z);
    this.oculus.target.position.set(fin.installation.x, 0, fin.installation.z);
    scene.add(this.oculus, this.oculus.target);

    this.fillFader = new Fader(this.fill);
    this.neighborFader = new Fader(this.neighbor);
    this.keyFader = new Fader(this.key);
    this.ambientTarget = 0.6;
    this.keyRoom = null;
    this.applyQuality(quality);
  }

  applyQuality(q) {
    this.quality = q;
    const size = q === 'hoog' ? 2048 : 1024;
    this.key.shadow.mapSize.set(size, size);
    if (this.key.shadow.map) { this.key.shadow.map.dispose(); this.key.shadow.map = null; }
    this.key.shadow.radius = q === 'hoog' ? 3 : 1.5;
    this.key.castShadow = q !== 'laag';
    this.key.shadow.needsUpdate = true;
  }

  setRoom(roomId) {
    this.keyRoom = roomId;
    this.fillFader.assign(roomId);
    this.keyFader.assign(roomId);
    this.ambientTarget = ROOM_BY_ID[roomId].theme.ambient;
  }

  // Kies de buurzaal waarvan de deur het dichtst bij de bezoeker is.
  updateNeighbor(pos) {
    if (!this.keyRoom) return;
    let best = null, bestD = Infinity;
    for (const d of DOORS) {
      if (d.a !== this.keyRoom && d.b !== this.keyRoom) continue;
      const c = doorCenter(d);
      const dist = Math.hypot(c.x - pos.x, c.z - pos.z);
      if (dist < bestD) { bestD = dist; best = d.a === this.keyRoom ? d.b : d.a; }
    }
    if (best) this.neighborFader.assign(best);
  }

  update(dt, pos) {
    if (pos) this.updateNeighbor(pos);
    const fillApply = (L) => (roomId) => {
      const r = roomLight(ROOM_BY_ID[roomId]);
      L.position.copy(r.pos); L.target.position.copy(r.target); L.target.updateMatrixWorld();
      L.angle = r.angle; L.distance = r.distance; L.color.set(r.color);
      return r.intensity * 0.75;
    };
    this.fillFader.update(dt, fillApply(this.fill));
    this.neighborFader.update(dt, fillApply(this.neighbor));
    this.keyFader.update(dt, (roomId) => {
      const room = ROOM_BY_ID[roomId];
      const [x0, x1, z0, z1] = room.rect;
      const h = room.height;
      const halfMax = Math.max(x1 - x0, z1 - z0) / 2;
      if (room.installation) {
        this.key.position.set(room.installation.x + 0.6, h + 1.6, room.installation.z + 0.4);
        this.key.target.position.set(room.installation.x, 0, room.installation.z);
        this.key.angle = 0.75;
        this.key.distance = h + 14;
      } else {
        // iets uit het midden, zodat schaduwen een richting krijgen
        this.key.position.set((x0 + x1) / 2 + (x1 - x0) * 0.12, h - 0.2, (z0 + z1) / 2 + (z1 - z0) * 0.18);
        this.key.target.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
        this.key.angle = Math.min(1.25, Math.atan((halfMax * 1.1) / h));
        this.key.distance = Math.hypot(h, halfMax) * 1.4;
      }
      this.key.target.updateMatrixWorld();
      this.key.color.set(room.theme.keyColor);
      this.key.shadow.needsUpdate = true;
      return room.theme.key * 0.55 * h * h;
    });
    this.hemi.intensity += (this.ambientTarget - this.hemi.intensity) * Math.min(1, dt * 1.5);
    if (this.keyRoom === 'finale' && this.quality !== 'laag') this.key.shadow.needsUpdate = true;
  }
}
