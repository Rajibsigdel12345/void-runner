// ST-448 (E63): POD drifting splitter rendering - a pooled teal-green egg
// (0x5f8f86) with a dark seam band (0x2a4a45) wrapped around the equator (the
// split line) and a static payload-amber core glow (0xff9a3d). It tumbles slowly
// around Y (motion-gated) while it drifts inward; on a lethal hit it splits into
// 2 WASP corkscrews (the podDeath FX burst reads the split, the seamGlow is a
// STATIC RM-safe accent - never strobed). PROCEDURAL only - no GLB (the Vortex
// precedent: its children ARE an existing unit), so no useGLB. Geometries are
// baked ONCE at module level and shared by every pool slot (~450 tris total).
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { applyEnemyRim } from './enemyRim.js'; // I460/ST-429 A2: shared fresnel silhouette rim

let eggGeo = null, seamGeo = null, coreGeo = null; // module-level: baked once, shared

function bake() {
  const r = CONFIG.pod.radius;
  const e = new THREE.CapsuleGeometry(1.0, 0.5, 4, 10); // long axis Y (upright egg)
  e.scale(r, r, r * 0.82);
  e.computeVertexNormals();
  const col = new Float32Array(e.attributes.position.count * 3).fill(1);
  e.setAttribute('color', new THREE.BufferAttribute(col, 3));
  eggGeo = e;
  const s = new THREE.TorusGeometry(0.92 * r, 0.09 * r, 6, 16);
  s.rotateX(Math.PI / 2); // lie flat (horizontal) at the equator
  s.scale(1, 1, 0.82);    // follow the egg's flattened Z footprint
  s.computeVertexNormals();
  seamGeo = s;
  const c = new THREE.SphereGeometry(0.2 * r, 8, 6);
  c.computeVertexNormals();
  coreGeo = c;
}

const CORE_AMBER = { r: 1.0, g: 0.6, b: 0.24 }; // payload-amber 0xff9a3d

export function createPodRenderer(scene) {
  if (!eggGeo) bake();
  const POOL = CONFIG.pod.maxConcurrent + 2; // cap 2 + 2 spare
  const bodyColor = new THREE.Color(CONFIG.pod.palette.body.color).multiplyScalar(CONFIG.pod.renderLumaGain); // I480 rendered-luma audit: POD 127 (bottom rung)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor, roughness: 0.5, metalness: 0.2, flatShading: true, vertexColors: true,
    emissive: 0x0f1a17, emissiveIntensity: 0.2,
  });
  const seamMat = new THREE.MeshStandardMaterial({
    color: CONFIG.pod.palette.seam.color, roughness: 0.6, metalness: 0.15, flatShading: true,
  });
  const coreMat = new THREE.MeshStandardMaterial({ // SHARED + STATIC (RM-safe accent, seamGlow <= 1.0)
    color: 0x1a0f04, roughness: 0.3, metalness: 0.2,
    emissive: new THREE.Color(CORE_AMBER.r, CORE_AMBER.g, CORE_AMBER.b), emissiveIntensity: CONFIG.pod.seamGlow,
  });
  const r = CONFIG.pod.radius;
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const g = new THREE.Group();
    const egg = new THREE.Mesh(eggGeo, bodyMat);
    const seam = new THREE.Mesh(seamGeo, seamMat);
    const core = new THREE.Mesh(coreGeo, coreMat); core.position.set(r * 0.9, 0, 0);
    g.add(egg); g.add(seam); g.add(core);
    g.visible = false;
    scene.add(g);
    pool.push(g);
  }

  // I460/ST-429 A2: hull silhouette rim (shared pattern; per-role color in CONFIG.enemyRim).
  applyEnemyRim(bodyMat, 'pod');

  /** sync(podField, t, motionOff): place the pool; slow idle tumble (motion-gated). */
  function sync(field, t, motionOff) {
    let i = 0;
    for (const p of field.pods) {
      if (p.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(p.pos.x, 0.5, p.pos.y);
      g.rotation.y = motionOff ? 0 : (t * 0.25 + (p.wobblePhase || 0));
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  return { sync, pool }; // PROCEDURAL only (Vortex precedent) - no useGLB
}
