import * as THREE from 'three';
import { WALL_T, DOORS, ROOM_BY_ID } from '../data/rooms.js';

const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };

// Doorgangen die op een bepaalde zijde van een zaal uitkomen.
export function doorsOn(roomId, side) {
  return DOORS.filter((d) => (d.a === roomId && d.side === side) || (d.b === roomId && OPPOSITE[d.side] === side));
}

// Middelpunt van een deur (in de doorgang tussen beide zalen).
export function doorCenter(door) {
  const r = ROOM_BY_ID[door.a].rect;
  const mid = (door.from + door.to) / 2;
  switch (door.side) {
    case 'N': return new THREE.Vector3(mid, 0, r[2] - WALL_T);
    case 'S': return new THREE.Vector3(mid, 0, r[3] + WALL_T);
    case 'W': return new THREE.Vector3(r[0] - WALL_T, 0, mid);
    default: return new THREE.Vector3(r[1] + WALL_T, 0, mid);
  }
}

// Punt net binnen een zaal vóór een deur (om naartoe te navigeren).
export function doorPointInside(door, roomId, inset = 1.2) {
  const c = doorCenter(door);
  const r = ROOM_BY_ID[roomId].rect;
  const cx = (r[0] + r[1]) / 2, cz = (r[2] + r[3]) / 2;
  const dir = new THREE.Vector3(cx - c.x, 0, cz - c.z);
  if (door.side === 'N' || door.side === 'S') dir.x = 0; else dir.z = 0;
  dir.normalize();
  return c.clone().addScaledVector(dir, inset + WALL_T);
}

export function partitionFrame(p) {
  const c = Math.cos(p.rot), s = Math.sin(p.rot);
  return {
    center: new THREE.Vector3(p.cx, 0, p.cz),
    along: new THREE.Vector3(c, 0, -s),
    normal: new THREE.Vector3(s, 0, c)
  };
}

// Positie (op het wandoppervlak), normaal en rotatie voor een ophangplek.
export function wallPlacement(room, wall, at) {
  const [x0, x1, z0, z1] = room.rect;
  let pos, normal;
  if (wall === 'W') { pos = new THREE.Vector3(x0, 0, at); normal = new THREE.Vector3(1, 0, 0); }
  else if (wall === 'E') { pos = new THREE.Vector3(x1, 0, at); normal = new THREE.Vector3(-1, 0, 0); }
  else if (wall === 'N') { pos = new THREE.Vector3(at, 0, z0); normal = new THREE.Vector3(0, 0, 1); }
  else if (wall === 'S') { pos = new THREE.Vector3(at, 0, z1); normal = new THREE.Vector3(0, 0, -1); }
  else {
    const [pid, face] = wall.split(':');
    const p = (room.partitions || []).find((q) => q.id === pid);
    if (!p) throw new Error(`Onbekende wand ${wall} in ${room.id}`);
    const f = partitionFrame(p);
    const sign = face === 'b' ? -1 : 1;
    normal = f.normal.clone().multiplyScalar(sign);
    pos = f.center.clone().addScaledVector(f.along, at).addScaledVector(normal, WALL_T / 2);
  }
  return { pos, normal, rotY: Math.atan2(normal.x, normal.z) };
}

export function roomAt(x, z) {
  for (const id in ROOM_BY_ID) {
    const r = ROOM_BY_ID[id].rect;
    if (x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]) return ROOM_BY_ID[id];
  }
  return null;
}
