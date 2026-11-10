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
  const col = new Float32Array(pos.count * 3).fill(1); // I210: materials use vertexColors
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

export function createBossMesh(scene) {
  const geo = bakeObeliskGeometry();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3a3252, roughness: 0.45, metalness: 0.4, flatShading: true,
    emissive: 0x7a4dff, emissiveIntensity: 0.25, vertexColors: true, // I210: GLB-baked crown gradient
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  scene.add(mesh);

  /** sync(boss, t): place the obelisk (tall body, base near the plane), pulse the glow. */
  function sync(boss, t) {
    if (!boss || !boss.alive) { mesh.visible = false; mesh.scale.setScalar(1); return; }
    const isSplicer = boss.kind === 'splicer'; // ST-143: variant 2 - teal identity
    const r = isSplicer ? CONFIG.splicer.radius : CONFIG.boss.radius;
    const sizeScale = r / CONFIG.boss.radius; // geometry is baked at the Monolith radius
    mesh.position.set(boss.pos.x, r * 1.3 + 0.3, boss.pos.y);
    mesh.rotation.y = boss.rot;
    const ePulse = isSplicer ? 0.30 + 0.30 * (0.5 + 0.5 * Math.sin(t * 4.2)) : 0.18 + 0.18 * (0.5 + 0.5 * Math.sin(t * 2.4));
    mat.emissiveIntensity = ePulse; // ST-143: the Splicer pulses faster and brighter
    mat.emissive.setHex(isSplicer ? 0x2dd4bf : 0x7a4dff); // ST-143: teal vs the Monolith purple
    mesh.scale.setScalar(Math.max(0.001, (1 - Math.pow(1 - boss.entered, 3))) * sizeScale); // ST-135/143: entrance scale-in + variant size
    mesh.visible = true;
  }

  // I104: useGLB(obj) - swap in the Blender obelisk geometry. The in-code
  // material (pulsing emissive) is kept, so the GLB's own material is ignored.
  function useGLB(obj) {
    if (!obj) return;
    let g = null;
    obj.traverse((n) => { if (n.isMesh && !g) g = n.geometry; });
    if (g) {
      if (!g.hasAttribute("color")) { // I210: materials use vertexColors; keep GLBs without COLOR_0 safe
        const col = new Float32Array(g.attributes.position.count * 3).fill(1);
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      }
      mesh.geometry = g;
    }
  }

  return { sync, mesh, useGLB };
}
