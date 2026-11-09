// ST-055: Monolith boss rendering - one obelisk (not pooled), procedural, pulsing glow.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { CONFIG } from '../core/config.js';

function bakeObeliskGeometry() {
  const r = CONFIG.boss.radius;
  const h = r * 2.6;
  const geo = new THREE.BoxGeometry(r * 1.2, h, r * 1.2, 1, 3, 1);
  const pos = geo.attributes.position;
  const rng = new RNG(0x0bad); // fixed seed: same obelisk every load
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const tTop = (v.y / h + 1) / 2; // 0 at the base, 1 at the tip
    const taper = 1 - 0.45 * tTop;
    v.x *= taper;
    v.z *= taper;
    v.x += (rng.next() - 0.5) * 0.18;
    v.z += (rng.next() - 0.5) * 0.18;
    v.y += (rng.next() - 0.5) * 0.12;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createBossMesh(scene) {
  const geo = bakeObeliskGeometry();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3a3252, roughness: 0.45, metalness: 0.4, flatShading: true,
    emissive: 0x7a4dff, emissiveIntensity: 0.25,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  scene.add(mesh);

  /** sync(boss, t): place the obelisk (tall body, base near the plane), pulse the glow. */
  function sync(boss, t) {
    if (!boss || !boss.alive) { mesh.visible = false; return; }
    const r = CONFIG.boss.radius;
    mesh.position.set(boss.pos.x, r * 1.3 + 0.3, boss.pos.y);
    mesh.rotation.y = boss.rot;
    mat.emissiveIntensity = 0.18 + 0.18 * (0.5 + 0.5 * Math.sin(t * 2.4)); // subtle pulse
    mesh.visible = true;
  }

  return { sync, mesh };
}
