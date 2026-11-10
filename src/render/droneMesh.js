// ST-117: homing drone rendering - pooled angular seeker darts, shared geometry/material, no per-frame allocs.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

function bakeDroneGeometry() {
  // angular seeker dart: an octahedron stretched along +X; spins about Y in sync()
  const geo = new THREE.OctahedronGeometry(CONFIG.drone.radius, 0);
  geo.scale(1.6, 0.85, 0.85); // ST-118 tuning: taller cross-section so it reads edge-on, not a flat plate
  geo.computeVertexNormals();
  return geo;
}

export function createDroneRenderer(scene) {
  const max = CONFIG.drone.maxConcurrent;
  let geo = bakeDroneGeometry(); // I211: reassigned by useGLB when the drone GLB resolves
  // dark steel body + cold cyan core glow; sync() pulses emissiveIntensity (shared = all blink together)
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1f3340, roughness: 0.45, metalness: 0.55, flatShading: true,
    emissive: 0x37d5ff, emissiveIntensity: 0.7,
  });
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    scene.add(m);
    pool.push(m);
  }

  /** sync(droneField, t): place the pool, pulse the seeker blink. */
  function sync(field, t) {
    mat.emissiveIntensity = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 7)); // agitated fast blink
    let i = 0;
    for (const d of field.drones) {
      if (d.dead || i >= max) continue;
      const m = pool[i++];
      m.position.set(d.pos.x, 0.6, d.pos.y);
      m.rotation.y = d.rot;
      m.visible = true;
    }
    for (; i < max; i++) pool[i].visible = false;
  }

  // I211: swap the pooled dart geometry to the Blender drone GLB (first mesh).
  // Pool meshes captured geo at creation, so re-point every pooled mesh on swap
  // (same pattern as asteroidRenderer.setShieldGLB, I210).
  function useGLB(obj) {
    let g = null;
    obj.traverse((o) => {
      if (!g && o.isMesh) g = o.geometry;
    });
    if (!g) return;
    geo = g;
    for (const m of pool) m.geometry = g;
  }

  return { sync, pool, useGLB };
}
