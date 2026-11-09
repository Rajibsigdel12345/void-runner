// Void Runner - asteroid rendering (ST-010). Shared noise-baked geo, pooled meshes, no per-frame allocs.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { CONFIG } from '../core/config.js';

function bakeVariant(seed, radius) {
  const rng = new RNG(seed);
  const geo = new THREE.IcosahedronGeometry(radius, 1);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(1 + rng.range(-0.22, 0.3)); // irregular craggy silhouette
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createAsteroidRenderer(scene) {
  const max = CONFIG.asteroid.maxConcurrent;
  const sizes = ['L', 'M', 'S'];
  const geos = {};
  for (const s of sizes) {
    geos[s] = [
      bakeVariant(101 + sizes.indexOf(s), CONFIG.asteroid.sizes[s].radius),
      bakeVariant(211 + sizes.indexOf(s), CONFIG.asteroid.sizes[s].radius),
      bakeVariant(321 + sizes.indexOf(s), CONFIG.asteroid.sizes[s].radius),
    ];
  }
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a7f72, roughness: 0.95, metalness: 0.05, flatShading: true });
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geos.L[0], mat);
    m.visible = false;
    scene.add(m);
    pool.push(m);
  }

  function sync(field) {
    let i = 0;
    for (const r of field.rocks) {
      if (r.dead || i >= max) continue;
      const m = pool[i++];
      m.geometry = geos[r.size][r.variant];
      m.position.set(r.pos.x, 0.4, r.pos.y);
      m.rotation.set(r.rot * 0.7, r.rot, r.rot * 0.31);
      m.visible = true;
    }
    for (; i < max; i++) pool[i].visible = false;
  }

  return { sync, pool };
}
