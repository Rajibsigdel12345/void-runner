// ST-485 (E69): BULWARK shield-enforcer rendering - a pooled shield-magenta
// frontal slab (0xaa3c96, gain 1.4) on a dark spine (0x4a1a3d) with a
// shield-core accent (0xff7de8) that ramps white-hot over the 0.6 s bolt
// telegraph and DIMS while stunned (the overload read - 6 frontal negations
// -> 1.5 s stun; RM-safe: a held dim, never a strobe). The rig yaws onto the
// core's 0.5 rad/s slew (the frontal +/-50 deg negation arc follows the
// heading). A hit flash ramps the core white. Procedural fallback (slab +
// spine + core box) is baked in the SAME absolute part-space as the GLB (all
// pool children sit at the origin - the E69 GLBs are authored with identity
// node transforms); the Blender GLB (ST-482, I516) lands in via useGLB (a
// /core/i node = glow slot, a /spine/i node = spine slot, a /shield|hull/i
// node = slab slot). In-code materials kept (I220 / gunshipMesh precedent);
// the GLB COLOR_0 value bakes multiply through vertexColors.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { applyEnemyRim } from './enemyRim.js'; // I460/ST-429 A2: shared fresnel silhouette rim
import { standardMat } from './fxArm.js'; // I497 (ST-463): node material on the webgpu arm

function ensureColor(geo) {
  if (!geo.hasAttribute('color')) {
    const col = new Float32Array(geo.attributes.position.count * 3).fill(1);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  return geo;
}

function bakeShieldGeometry() {
  const geo = new THREE.BoxGeometry(0.24, 2.1, 2.14); // GLB VR_Shield: x 0.00..0.24, y -1.05..1.05, z -1.07..1.07
  geo.translate(0.12, 0, 0);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

function bakeSpineGeometry() {
  const geo = new THREE.BoxGeometry(0.87, 0.56, 0.84); // GLB VR_Spine: x -0.82..0.05, y -0.28..0.28, z -0.42..0.42
  geo.translate(-0.385, 0, 0);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

function bakeCoreGeometry() {
  const geo = new THREE.BoxGeometry(0.22, 0.32, 0.38); // GLB VR_Core: x 0.08..0.30, y -0.16..0.16, z -0.19..0.19
  geo.translate(0.19, 0, 0);
  geo.computeVertexNormals();
  return geo;
}

const CORE = { r: 1.0, g: 0.49, b: 0.91 }; // shield-core 0xff7de8 (approx linear base)

export function createBulwarkRenderer(scene) {
  const POOL = CONFIG.bulwark.maxConcurrent + 2; // cap 1 + 2 spare
  let shieldGeo = bakeShieldGeometry(); // reassigned by useGLB when the bulwark GLB resolves
  let spineGeo = bakeSpineGeometry();
  let coreGeo = bakeCoreGeometry();
  const bodyColor = new THREE.Color(CONFIG.bulwark.palette.body.color).multiplyScalar(CONFIG.bulwark.renderLumaGain); // I519 rendered-luma audit (E69 12-rung ladder)
  const shieldMat = standardMat({ // I497 (ST-463)
    color: bodyColor, roughness: 0.45, metalness: 0.3, flatShading: true, vertexColors: true,
    emissive: 0x1a0a14, emissiveIntensity: 0.25,
  });
  const spineMat = new THREE.MeshStandardMaterial({
    color: CONFIG.bulwark.palette.spine, roughness: 0.7, metalness: 0.2, flatShading: true, vertexColors: true,
  });
  const coreMats = [];
  for (let i = 0; i < POOL; i++) {
    coreMats.push(new THREE.MeshStandardMaterial({
      color: 0x14060f, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(CORE.r, CORE.g, CORE.b), emissiveIntensity: 0.5,
    }));
  }
  const r = CONFIG.bulwark.radius;
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const g = new THREE.Group();
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    const spine = new THREE.Mesh(spineGeo, spineMat);
    const core = new THREE.Mesh(coreGeo, coreMats[i]);
    g.add(shield); g.add(spine); g.add(core); // all at the origin (absolute part-space)
    g.visible = false;
    scene.add(g);
    pool.push(g);
  }

  // I460/ST-429 A2: hull silhouette rim (shared pattern; per-role color in CONFIG.enemyRim).
  applyEnemyRim(shieldMat, 'bulwark');

  /** sync(bulwarkField, t, motionOff): place the pool; yaw = -heading (the
   *  game-space heading angle maps to world yaw with forward +X); the core
   *  ramps over the bolt telegraph and dims while stunned. */
  function sync(field, t, motionOff) {
    const s = CONFIG.bulwark;
    let i = 0;
    for (const b of field.bulwarks) {
      if (b.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(b.pos.x, 0.5, b.pos.y);
      g.rotation.y = -b.heading;
      const mat = coreMats[i];
      let k = b.charged ? Math.min(1, 1 - b.fireTimer / s.boltTelegraph) : 0;
      let base = 0.5;
      if (b.stunT > 0) { k = 0; base = 0.15; } // overload: held dim (RM-safe - no strobe)
      const hf = b.hitFlash || 0;
      const ramp = Math.max(k, hf * 0.5);
      mat.emissive.setRGB(CORE.r + (1 - CORE.r) * ramp, CORE.g + (1 - CORE.g) * ramp, CORE.b + (1 - CORE.b) * ramp);
      mat.emissiveIntensity = base + 1.4 * k + hf * 1.4;
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  function useGLB(obj) {
    let shield = null, spine = null, core = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/core/i.test(n)) { if (!core) core = o; }
      else if (/spine/i.test(n)) { if (!spine) spine = o; }
      else if (/shield|hull/i.test(n)) { if (!shield) shield = o; }
      else if (!shield) shield = o;
    });
    if (!shield) obj.traverse((o) => { if (!shield && o.isMesh && o !== core && o !== spine) shield = o; });
    if (shield) { shieldGeo = ensureColor(shield.geometry); for (const g of pool) { const m = g.children[0]; if (m) m.geometry = shieldGeo; } }
    if (spine) { spineGeo = ensureColor(spine.geometry); for (const g of pool) { const m = g.children[1]; if (m) m.geometry = spineGeo; } }
    if (core) { coreGeo = ensureColor(core.geometry); for (const g of pool) { const m = g.children[2]; if (m) m.geometry = coreGeo; } }
  }

  return { sync, pool, useGLB };
}
