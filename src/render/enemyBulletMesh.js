// ST-056: enemy bolt rendering - pooled glowing red-orange orbs, distinct from the
// player's pale bullets. Shared geo/material, no per-frame allocs.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

export function createEnemyBulletRenderer(scene) {
  const max = CONFIG.enemyBullets.maxConcurrent;
  const geo = new THREE.SphereGeometry(CONFIG.enemyBullets.radius * 1.9, 8, 8);
  const EB = CONFIG.fx.enemyBullet || { base: 0x5a1410, emissive: 0xff4a2a, emissiveIntensity: 1.2 }; // ST-248: data-driven (values unchanged)
  const mat = new THREE.MeshStandardMaterial({
    color: EB.base, roughness: 0.4, metalness: 0.1,
    emissive: EB.emissive, emissiveIntensity: EB.emissiveIntensity,
  });
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    scene.add(m);
    pool.push(m);
  }

  /** sync(field, t): place the pool; the glow breathes slightly. */
  function sync(field, t) {
    mat.emissiveIntensity = 1.1 + 0.35 * (0.5 + 0.5 * Math.sin(t * 9));
    let i = 0;
    for (const b of field.bullets) {
      if (b.dead || i >= max) continue;
      const m = pool[i++];
      m.position.set(b.pos.x, 0.55, b.pos.y);
      m.visible = true;
    }
    for (; i < max; i++) pool[i].visible = false;
  }

  return { sync, pool };
}
