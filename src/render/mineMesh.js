// ST-054: mine drone rendering - pooled spiky meshes, shared material, no per-frame allocs.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { CONFIG } from '../core/config.js';

function bakeMineGeometry() {
  // spiky shell: displace each icosahedron vertex outward on a seeded spike pattern
  const rng = new RNG(0xbeef);
  const geo = new THREE.IcosahedronGeometry(CONFIG.mine.radius, 1);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const spike = 1 + (i % 2 === 0 ? 0.34 : -0.12) * (0.8 + rng.next() * 0.4);
    v.multiplyScalar(spike);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createMineRenderer(scene) {
  const max = CONFIG.mine.maxConcurrent;
  const geo = bakeMineGeometry();
  // dark iron body + red core glow; sync() pulses emissiveIntensity (shared = all blink together)
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3a2430, roughness: 0.6, metalness: 0.4, flatShading: true,
    emissive: 0xff2a2a, emissiveIntensity: 0.6,
  });
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    scene.add(m);
    pool.push(m);
  }

  /** sync(mines, t): place the pool, pulse the core blink. */
  function sync(mineField, t) {
    mat.emissiveIntensity = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 5)); // readable "armed" blink
    let i = 0;
    for (const mine of mineField.mines) {
      if (mine.dead || i >= max) continue;
      const m = pool[i++];
      m.position.set(mine.pos.x, 0.4, mine.pos.y);
      m.rotation.y = mine.rot;
      m.visible = true;
    }
    for (; i < max; i++) pool[i].visible = false;
  }

  return { sync, pool };
}
