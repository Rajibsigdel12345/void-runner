// Void Runner - bullet render pool (ST-008). Shared geo/material, zero per-frame allocs.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

export function createBulletPool(scene) {
  const max = CONFIG.weapon.maxBullets;
  const geo = new THREE.SphereGeometry(CONFIG.weapon.bulletRadius, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xbff4ff });
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    scene.add(m);
    pool.push(m);
  }

  function sync(weapons) {
    let idx = 0;
    for (const b of weapons.bullets) {
      if (b.dead) continue;
      const m = pool[idx++];
      m.position.set(b.pos.x, 0.4, b.pos.y);
      m.visible = true;
    }
    for (let i = idx; i < max; i++) pool[i].visible = false;
  }

  return { sync, pool };
}
