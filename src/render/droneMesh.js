// ST-117: homing drone rendering - pooled angular seeker darts, shared geometry/material, no per-frame allocs.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { applyEnemyRim } from './enemyRim.js'; // I460/ST-429 A2: shared fresnel silhouette rim

function bakeDroneGeometry() {
  // angular seeker dart: an octahedron stretched along +X; spins about Y in sync()
  const geo = new THREE.OctahedronGeometry(CONFIG.drone.radius, 0);
  geo.scale(1.6, 0.85, 0.85); // ST-118 tuning: taller cross-section so it reads edge-on, not a flat plate
  geo.computeVertexNormals();
  const col = new Float32Array(geo.attributes.position.count * 3).fill(1); // I282/ST-267: white value identity (the body material now uses vertexColors; the GLB COLOR_0 bake multiplies on top)
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

export function createDroneRenderer(scene) {
  const max = CONFIG.drone.maxConcurrent;
  let geo = bakeDroneGeometry(); // I211: reassigned by useGLB when the drone GLB resolves
  // dark steel body + cold cyan core glow; sync() pulses emissiveIntensity (shared = all blink together)
  const mat = new THREE.MeshStandardMaterial({
    color: CONFIG.drone.palette.body.color, roughness: 0.45, metalness: 0.55, flatShading: true, vertexColors: true, // I282/ST-267: mid-value steel-cyan (was 0x1f3340 dark-on-dark) + the GLB COLOR_0 value bake
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
  // I460/ST-429 A2: pooled dart silhouette rim (shared I278 pattern; per-role color in CONFIG.enemyRim).
  applyEnemyRim(mat, 'drone');

  function useGLB(obj) {
    let g = null;
    obj.traverse((o) => {
      if (!g && o.isMesh) g = o.geometry;
    });
    if (!g) return;
    if (!g.hasAttribute('color')) { // I282/ST-267: materials use vertexColors; keep a GLB without COLOR_0 safe (white identity)
      const col = new Float32Array(g.attributes.position.count * 3).fill(1);
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    geo = g;
    for (const m of pool) m.geometry = g;
  }

  return { sync, pool, useGLB };
}
