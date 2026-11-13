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
const base2 = new Float32Array(POOL * 3); // ST-291 (I312): ramp end color (warm->cool tail)
const rampFlag = new Uint8Array(POOL); // ST-291: 1 = age-ramp pal[0] -> pal[last]
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
    const pal = Array.isArray(o.palette) && o.palette.length ? o.palette : [o.color ?? 0xffd27a]; // ST-086: per-entity palette (a single color is a 1-item palette)
    const shape = o.shape || 'radial'; // ST-086: radial | ring | fountain
    const speed = o.speed ?? 9;
    for (let k = 0; k < n; k++) {
      const i = cursor;
      cursor = (cursor + 1) % POOL;
      if (life[i] <= 0) live += 1; // slot was parked
      const i3 = i * 3;
      if (o.ramp && pal.length >= 2) { tmp.set(pal[0]); } else { tmp.set(pal[(Math.random() * pal.length) | 0]); } // ST-086 random pick / ST-291 (I312) ramp start = warm core
      let vx, vy, vz;
      if (shape === 'ring') { // ST-086: flat even shockwave ring (small angle jitter, near-constant speed)
        const a = (k / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const sp = (0.85 + Math.random() * 0.3) * speed;
        vx = Math.cos(a) * sp; vz = Math.sin(a) * sp; vy = (Math.random() - 0.5) * 0.6;
      } else if (shape === 'fountain') { // ST-086: upward-biased plume (pickups)
        const a = Math.random() * Math.PI * 2;
        const sp = (0.3 + Math.random() * 0.5) * speed;
        vx = Math.cos(a) * sp; vz = Math.sin(a) * sp; vy = (0.8 + Math.random() * 0.7) * speed;
      } else { // radial (default): isotropic with a slight vertical pop
        const a = Math.random() * Math.PI * 2;
        const sp = (0.35 + Math.random() * 0.65) * speed;
        vx = Math.cos(a) * sp; vz = Math.sin(a) * sp; vy = (Math.random() - 0.5) * 2;
      }
      positions[i3] = x;
      positions[i3 + 1] = 0.4;
      positions[i3 + 2] = y;
      vel[i3] = vx;
      vel[i3 + 1] = vy;
      vel[i3 + 2] = vz;
      const shade = 0.7 + Math.random() * 0.3; // per-particle brightness jitter (shared by both ramp ends)
      base[i3] = tmp.r * shade;
      base[i3 + 1] = tmp.g * shade;
      base[i3 + 2] = tmp.b * shade;
      if (o.ramp && pal.length >= 2) { // ST-291 (I312): ramp end = cool tail (same shade; lerped by age in sync)
        tmp.set(pal[pal.length - 1]);
        base2[i3] = tmp.r * shade; base2[i3 + 1] = tmp.g * shade; base2[i3 + 2] = tmp.b * shade;
        rampFlag[i] = 1;
      } else { rampFlag[i] = 0; }
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
      if (rampFlag[i]) { // ST-291: warm core -> cool tail along the puff lifetime
        const u = age[i] / life[i];
        colors[i3] = (base[i3] + (base2[i3] - base[i3]) * u) * f;
        colors[i3 + 1] = (base[i3 + 1] + (base2[i3 + 1] - base[i3 + 1]) * u) * f;
        colors[i3 + 2] = (base[i3 + 2] + (base2[i3 + 2] - base[i3 + 2]) * u) * f;
      } else {
        colors[i3] = base[i3] * f;
        colors[i3 + 1] = base[i3 + 1] * f;
        colors[i3 + 2] = base[i3 + 2] * f;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }

  return { points, burst, sync, get live() { return live; } };
}
