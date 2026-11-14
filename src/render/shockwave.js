// ST-238 (I245): pooled additive shockwave rings - the "shockwave" layer of
// the kill recipe (sparks = particles, shockwave = this, debris = the split
// rocks). One shared ring geometry, a fixed pool of meshes with per-entry
// materials; spawn() reuses the pool in ring-buffer order (oldest parked slot
// first, overwrite when all busy) - zero per-kill allocation (R-E15-3).
// The ring stands vertical (faces the low tracking camera), expands from 30%
// of its class radius to 100% and fades to 0 over its life. Additive + depthWrite off so it
// layers over the floor and under the particle burst without z-fighting.
import * as THREE from 'three';

export function createShockwaves(scene, cfg) {
  const poolSize = Math.max(1, Math.min(16, cfg && cfg.pool ? cfg.pool | 0 : 8));
  const life0 = cfg && Number.isFinite(cfg.life) && cfg.life > 0 ? cfg.life : 0.42;
  const op0 = cfg && Number.isFinite(cfg.baseOpacity) && cfg.baseOpacity > 0 ? cfg.baseOpacity : 0.85;
  const height = cfg && Number.isFinite(cfg.height) ? cfg.height : 0.35;

  const geo = new THREE.TorusGeometry(0.9, 0.10, 8, 40); // ST-353 (I389): vertical torus - full ring face to the low tracking camera (flat XZ ring was an edge-on hairline)

  const rings = [];
  for (let i = 0; i < poolSize; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false; // scale/opacity animate; arena always on screen
    scene.add(mesh);
    rings.push({ mesh, mat, age: 0, life: life0, radius: 0, active: false });
  }

  let cursor = 0; // ring-buffer write head (particles.js precedent)
  let live = 0;

  /**
   * Spawn a ring at sim (x, y). No allocation: reuses a pooled mesh.
   * @param {{radius?:number,color?:number,life?:number}} o
   */
  function spawn(x, y, o = {}) {
    const r = rings[cursor];
    cursor = (cursor + 1) % poolSize;
    if (!r.active) live += 1;
    r.radius = Number.isFinite(o.radius) && o.radius > 0 ? o.radius : 2;
    r.life = Number.isFinite(o.life) && o.life > 0 ? o.life : life0;
    r.age = 0;
    r.active = true;
    r.mesh.visible = true;
    r.mesh.position.set(x, height, y); // sim y -> three z (arena plane)
    r.mesh.scale.setScalar(r.radius * 0.3);
    r.mat.color.set(Number.isFinite(o.color) ? o.color : 0xffd27a);
    r.mat.opacity = op0;
  }

  function sync(dt) {
    if (live === 0) return; // no live rings: skip the loop (particles.js precedent)
    for (let i = 0; i < poolSize; i++) {
      const r = rings[i];
      if (!r.active) continue;
      r.age += dt;
      if (r.age >= r.life) {
        r.active = false;
        r.mesh.visible = false;
        r.mat.opacity = 0;
        live -= 1;
        continue;
      }
      const p = r.age / r.life;
      r.mesh.scale.setScalar(r.radius * (0.3 + 0.7 * p));
      r.mat.opacity = op0 * (1 - p);
    }
  }

  return { spawn, sync, rings, get live() { return live; } }; // rings exposed for the __vr probe only
}
