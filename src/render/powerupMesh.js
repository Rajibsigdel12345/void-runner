// Void Runner - power-up rendering (ST-020). Pooled meshes, shared geo/materials per type.
// Distinct silhouette + color per type (I064 adds colorblind glyph decals):
//   rapid = octahedron/yellow, spread = cone/orange, shield = torus/cyan,
//   bomb = cube/red, magnet = sphere/green.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

const TYPES = {
  rapid:  { color: 0xffe066, emissive: 0x8a6d00, make: () => new THREE.OctahedronGeometry(0.45) },
  spread: { color: 0xff9f43, emissive: 0x7a4a00, make: () => new THREE.ConeGeometry(0.4, 0.75, 4) },
  shield: { color: 0x53d8ff, emissive: 0x0e5a75, make: () => new THREE.TorusGeometry(0.38, 0.12, 8, 20) },
  bomb:   { color: 0xff5252, emissive: 0x751414, make: () => new THREE.BoxGeometry(0.58, 0.58, 0.58) },
  magnet: { color: 0x69f0ae, emissive: 0x0f5c37, make: () => new THREE.SphereGeometry(0.42, 16, 12) },
};

export function createPowerupRenderer(scene) {
  const max = 4; // pool headroom over maxActiveDrops (I078 audits pools)
  const geos = {}, mats = {};
  for (const [t, def] of Object.entries(TYPES)) {
    geos[t] = def.make();
    mats[t] = new THREE.MeshStandardMaterial({
      color: def.color, emissive: def.emissive, emissiveIntensity: 0.9,
      roughness: 0.35, metalness: 0.15,
    });
  }
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geos.rapid, mats.rapid);
    m.visible = false;
    scene.add(m);
    pool.push(m);
  }

  let t = 0;
  function sync(powerups, dt) {
    t += dt;
    let i = 0;
    for (const d of powerups.drops) {
      if (d.dead || i >= max) continue;
      const m = pool[i++];
      m.geometry = geos[d.type];
      m.material = mats[d.type];
      m.position.set(d.pos.x, 0.45 + Math.sin(t * 2.2 + d.id) * 0.08, d.pos.y);
      m.rotation.y = t * 1.4 + d.id;
      m.rotation.x = d.type === 'shield' ? Math.PI / 2.6 : 0;
      const pulse = 1 + Math.sin(t * 3.1 + d.id * 1.7) * 0.07;
      m.scale.setScalar(pulse);
      m.visible = true;
    }
    for (; i < max; i++) pool[i].visible = false;
  }

  return { sync, pool };
}
