// Void Runner - pooled particle bursts (ST-024). One THREE.Points cloud with
// a CPU-side ring pool; burst() on kill/hit/shieldPop/bomb, fade via color
// scaling under additive blending. No per-frame allocation.
import * as THREE from 'three';

const POOL = 512;

export function createParticles(scene) {
  const positions = new Float32Array(POOL * 3);
  const colors = new Float32Array(POOL * 3);
  const vel = new Float32Array(POOL * 3);
  const life = new Float32Array(POOL);
  const age = new Float32Array(POOL);
  const base = new Float32Array(POOL * 3);
  for (let i = 0; i < POOL; i++) positions[i * 3 + 1] = -9999; // parked out of view
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.32,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  let cursor = 0;
  let live = 0;
  const tmp = new THREE.Color();

  /**
   * Burst at sim (x, y). N particles, ring-buffer overwrite when full.
   * @param {{count?:number,color?:number,speed?:number,life?:number}} o
   */
  function burst(x, y, o = {}) {
    const n = Math.min(o.count ?? 16, POOL);
    tmp.set(o.color ?? 0xffd27a);
    for (let k = 0; k < n; k++) {
      const i = cursor;
      cursor = (cursor + 1) % POOL;
      if (life[i] <= 0) live += 1; // slot was parked
      const i3 = i * 3;
      const a = Math.random() * Math.PI * 2;
      const sp = (0.35 + Math.random() * 0.65) * (o.speed ?? 9);
      positions[i3] = x;
      positions[i3 + 1] = 0.4;
      positions[i3 + 2] = y;
      vel[i3] = Math.cos(a) * sp;
      vel[i3 + 1] = (Math.random() - 0.5) * 2; // slight vertical pop
      vel[i3 + 2] = Math.sin(a) * sp;
      const shade = 0.7 + Math.random() * 0.3;
      base[i3] = tmp.r * shade;
      base[i3 + 1] = tmp.g * shade;
      base[i3 + 2] = tmp.b * shade;
      life[i] = (o.life ?? 0.5) * (0.7 + Math.random() * 0.6);
      age[i] = 0;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }

  function sync(dt) {
    if (live === 0) return; // I36: no live particles -> skip loop + attribute uploads
    const drag = Math.exp(-3 * dt);
    for (let i = 0; i < POOL; i++) {
      if (life[i] <= 0 || age[i] >= life[i]) continue;
      age[i] += dt;
      const i3 = i * 3;
      if (age[i] >= life[i]) {
        positions[i3 + 1] = -9999; // park + blacken (additive => invisible)
        colors[i3] = colors[i3 + 1] = colors[i3 + 2] = 0;
        life[i] = 0;
        live -= 1;
        continue;
      }
      vel[i3] *= drag;
      vel[i3 + 1] *= drag;
      vel[i3 + 2] *= drag;
      positions[i3] += vel[i3] * dt;
      positions[i3 + 1] += vel[i3 + 1] * dt;
      positions[i3 + 2] += vel[i3 + 2] * dt;
      const f = 1 - age[i] / life[i];
      colors[i3] = base[i3] * f;
      colors[i3 + 1] = base[i3 + 1] * f;
      colors[i3 + 2] = base[i3 + 2] * f;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }

  return { points, burst, sync, get live() { return live; } };
}
