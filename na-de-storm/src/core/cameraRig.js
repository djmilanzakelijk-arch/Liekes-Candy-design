import * as THREE from 'three';

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Beweegt de camera vloeiend langs een pad (lijst punten) en draait tegelijk
// naar de gewenste eindrichting. Tijdens een animatie is de besturing uit.
export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.active = null;
  }

  get busy() { return !!this.active; }

  // points: Vector3[] (inclusief huidige positie), endQuat: Quaternion
  fly(points, endQuat, { speed = 6, minTime = 0.7, maxTime = 6, reducedMotion = false } = {}) {
    return new Promise((resolve) => {
      if (this.active) this.active.resolve(false);
      const curve = points.length > 2
        ? new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.3)
        : new THREE.LineCurve3(points[0], points[points.length - 1]);
      const length = curve.getLength();
      let duration = Math.min(maxTime, Math.max(minTime, length / speed + 0.35));
      if (reducedMotion) duration = Math.min(duration, 0.35);
      this.active = {
        curve, length, duration, t: 0,
        startQuat: this.camera.quaternion.clone(),
        endQuat: endQuat.clone(),
        multi: points.length > 2 && length > 4,
        resolve
      };
    });
  }

  update(dt) {
    const a = this.active;
    if (!a) return;
    a.t = Math.min(1, a.t + dt / a.duration);
    const k = easeInOut(a.t);
    const p = a.curve.getPointAt(k);
    this.camera.position.copy(p);
    if (a.multi && a.t < 0.75) {
      // onderweg kijk je in de looprichting, op ooghoogte
      const ahead = a.curve.getPointAt(Math.min(1, k + 0.06));
      const look = new THREE.Matrix4().lookAt(p, new THREE.Vector3(ahead.x, p.y, ahead.z), new THREE.Vector3(0, 1, 0));
      const travelQ = new THREE.Quaternion().setFromRotationMatrix(look);
      const blendIn = Math.min(1, a.t / 0.2);
      const q = a.startQuat.clone().slerp(travelQ, blendIn);
      this.camera.quaternion.slerp(q, Math.min(1, dt * 10));
    } else if (a.multi) {
      const f = (a.t - 0.75) / 0.25;
      this.camera.quaternion.slerp(a.endQuat, Math.min(1, easeInOut(f) * 0.6 + dt * 8));
    } else {
      this.camera.quaternion.copy(a.startQuat).slerp(a.endQuat, k);
    }
    if (a.t >= 1) {
      this.camera.quaternion.copy(a.endQuat);
      this.active = null;
      a.resolve(true);
    }
  }

  cancel() {
    if (this.active) { const r = this.active.resolve; this.active = null; r(false); }
  }
}
