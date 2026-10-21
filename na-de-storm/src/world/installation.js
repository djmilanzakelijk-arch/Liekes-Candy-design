import * as THREE from 'three';

// ‘Na de storm’ – eigen praktijkwerk van Milan, Berend en Polle.
// Onderin donkere, scherpe scherven die onrustig draaien (chaos); naar boven
// toe lichtere, kleurige vlakken die zich rustig ordenen rond een verticale
// lichtlijn (verwijzing naar Newmans ‘zip’), tot in het licht van de oculus.

const COUNT = 260;
const CHAOS = ['#121212', '#2a2420', '#4a3a2c', '#7a3d1d', '#5d5a55'];
const HOPE = ['#c99a3e', '#d4462f', '#2f5d8a', '#efe7d6', '#e7c46a', '#7fa6c9'];

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Installation {
  constructor(scene, { x, z, radius }) {
    this.center = new THREE.Vector3(x, 0, z);
    this.group = new THREE.Group();
    this.group.position.copy(this.center);
    scene.add(this.group);
    const r = mulberry(1945);

    // scherf: een onregelmatige, platte vorm
    const shard = new THREE.BufferGeometry();
    const v = [0, 0.5, 0, 0.32, -0.3, 0.02, -0.38, -0.22, -0.02, 0.05, -0.5, 0, 0, 0.05, 0.06];
    shard.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    shard.setIndex([0, 1, 4, 1, 3, 4, 3, 2, 4, 2, 0, 4, 0, 2, 1, 1, 2, 3]);
    shard.computeVertexNormals();
    const plane = new THREE.BoxGeometry(0.9, 0.6, 0.02);

    const mat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.25, side: THREE.DoubleSide, flatShading: true });
    const matPlane = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05, emissive: '#ffffff', emissiveIntensity: 0.08 });
    const nShards = Math.round(COUNT * 0.55);
    const nPlanes = COUNT - nShards;
    this.shards = new THREE.InstancedMesh(shard, mat, nShards);
    this.planes = new THREE.InstancedMesh(plane, matPlane, nPlanes);
    for (const m of [this.shards, this.planes]) {
      m.castShadow = true;
      m.receiveShadow = true;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.group.add(m);
    }

    this.data = [];
    const color = new THREE.Color();
    const make = (mesh, i, t) => {
      // t: 0 = onderin (chaos), 1 = bovenin (hoop)
      const y = 0.55 + t * 9.2 + (r() - 0.5) * 0.5;
      const rad = (radius - 0.4) * (1 - t * 0.55) * Math.sqrt(r());
      const a = r() * Math.PI * 2;
      const scale = (0.35 + r() * 0.55) * (1 - t * 0.25);
      const chaos = 1 - t;
      const d = {
        mesh, i, y, rad, a, scale, t,
        orbit: (0.05 + r() * 0.12) * (0.35 + chaos) * (r() > 0.5 ? 1 : -1),
        spin: new THREE.Vector3((r() - 0.5), (r() - 0.5), (r() - 0.5)).multiplyScalar(2.2 * chaos + 0.1),
        rot: new THREE.Euler(r() * 6.3 * chaos, a + Math.PI / 2, r() * 6.3 * chaos),
        bob: r() * 6.3
      };
      this.data.push(d);
      const pal = t < 0.45 ? CHAOS : t < 0.6 ? (r() > 0.5 ? CHAOS : HOPE) : HOPE;
      color.set(pal[Math.floor(r() * pal.length)]);
      mesh.setColorAt(i, color);
    };
    for (let i = 0; i < nShards; i++) make(this.shards, i, Math.pow(r(), 1.6) * 0.75);
    for (let i = 0; i < nPlanes; i++) make(this.planes, i, 0.4 + Math.pow(r(), 0.7) * 0.6);
    this.shards.instanceColor.needsUpdate = true;
    this.planes.instanceColor.needsUpdate = true;

    // de verticale lichtlijn
    const zip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 13.6, 8),
      new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#fff1d0', emissiveIntensity: 2.4 })
    );
    zip.position.y = 0.32 + 6.8;
    this.group.add(zip);

    // onzichtbaar klikvolume rond het werk
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 9.6, 24, 1, true), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    hit.position.y = 4.9;
    hit.userData.artId = 'eigen-installatie';
    this.group.add(hit);
    this.hitMeshes = [hit, this.shards, this.planes];
    for (const m of this.hitMeshes) m.userData.artId = 'eigen-installatie';

    this.tmp = new THREE.Object3D();
    this.update(0, 0);
  }

  update(dt, time, reducedMotion = false) {
    const t = reducedMotion ? 0 : time;
    const o = this.tmp;
    for (const d of this.data) {
      const a = d.a + t * d.orbit;
      o.position.set(Math.cos(a) * d.rad, d.y + Math.sin(t * 0.6 + d.bob) * 0.05 * (1 - d.t), Math.sin(a) * d.rad);
      o.rotation.set(d.rot.x + t * d.spin.x, -a + d.rot.y + t * d.spin.y * 0.3, d.rot.z + t * d.spin.z);
      o.scale.setScalar(d.scale);
      o.updateMatrix();
      d.mesh.setMatrixAt(d.i, o.matrix);
    }
    this.shards.instanceMatrix.needsUpdate = true;
    this.planes.instanceMatrix.needsUpdate = true;
    this.shards.computeBoundingSphere();
    this.planes.computeBoundingSphere();
  }
}
