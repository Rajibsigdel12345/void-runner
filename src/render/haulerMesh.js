// ST-485 (E69): HAULER slow ore-truck rendering - a pooled squat armored
// transport (ore-bronze 0x975a2d, gain 1.6) with dark sponsons (0x4a2c17),
// a dorsal stack, and a forward mine-bay hatch (0xffb45e) that ramps white-hot
// over the 0.4 s drop telegraph (the read-your-death cue - the mine ejects
// opposite the heading). The rig yaws onto the core's closed-form plod
// heading (3.5 u/s + 1.2 Hz wobble is in the position, the yaw here). A hit
// flash ramps the hatch white. Procedural fallback (hull box + 2 sponsons +
// hatch + stack) is baked in the SAME absolute part-space as the GLB (all pool
// children sit at the origin - the E69 GLBs are authored with identity node
// transforms); the Blender GLB (ST-483, I517) lands in via useGLB (a /hatch/i
// node = glow slot, /sponson.*l|sponson.*r/i = sponson slots, /stack/i =
// stack slot, every other mesh = hull). In-code materials kept (I220 /
// gunshipMesh precedent); the GLB COLOR_0 value bakes multiply through
// vertexColors.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { applyEnemyRim } from './enemyRim.js'; // I460/ST-429 A2: shared fresnel silhouette rim
import { standardMat, isWebGPU } from './fxArm.js'; // I497 (ST-463): node material on the webgpu arm
import { applyTSLGlow } from './tslMaterials.js'; // I557 (ST-523): TSL time-pulsed glow (webgpu arm only)

function ensureColor(geo) {
  if (!geo.hasAttribute('color')) {
    const col = new Float32Array(geo.attributes.position.count * 3).fill(1);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  return geo;
}

function bakeHullGeometry() {
  const geo = new THREE.BoxGeometry(1.96, 0.49, 0.94); // GLB VR_Hull: x -0.96..1.00, y -0.24..0.25, z -0.47..0.47
  geo.translate(0.02, 0.005, 0);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

function bakeSponsonGeometry(z) {
  const geo = new THREE.BoxGeometry(1.71, 0.33, 0.14); // GLB VR_SponsonL/R: x -0.85..0.86, y -0.32..0.01, z 0.43..0.57 (mirrored)
  geo.translate(0.005, -0.155, z);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

function bakeHatchGeometry() {
  const geo = new THREE.BoxGeometry(0.64, 0.09, 0.64); // GLB VR_Hatch: x 0.03..0.67, y -0.31..-0.22, z -0.32..0.32
  geo.translate(0.35, -0.265, 0);
  geo.computeVertexNormals();
  return geo;
}

function bakeStackGeometry() {
  const geo = new THREE.BoxGeometry(0.36, 0.24, 0.4); // GLB VR_Stack: x -0.68..-0.32, y 0.14..0.38, z -0.20..0.20
  geo.translate(-0.5, 0.26, 0);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

const HATCH = { r: 1.0, g: 0.64, b: 0.3 }; // hatch amber 0xffb45e (approx linear base)

export function createHaulerRenderer(scene) {
  const POOL = CONFIG.hauler.maxConcurrent + 2; // cap 1 + 2 spare
  let hullGeo = bakeHullGeometry(); // reassigned by useGLB when the hauler GLB resolves
  let sponsonLGeo = bakeSponsonGeometry(0.5);
  let sponsonRGeo = bakeSponsonGeometry(-0.5);
  let hatchGeo = bakeHatchGeometry();
  let stackGeo = bakeStackGeometry();
  const bodyColor = new THREE.Color(CONFIG.hauler.palette.body.color).multiplyScalar(CONFIG.hauler.renderLumaGain); // I519 rendered-luma audit (E69 12-rung ladder)
  const hullMat = standardMat({ // I497 (ST-463)
    color: bodyColor, roughness: 0.6, metalness: 0.25, flatShading: true, vertexColors: true,
    emissive: 0x1a1006, emissiveIntensity: 0.2,
  });
  const sponsonMat = standardMat({
    color: CONFIG.hauler.palette.sponson, roughness: 0.75, metalness: 0.2, flatShading: true, vertexColors: true,
  });
  const hatchMats = [];
  for (let i = 0; i < POOL; i++) {
    hatchMats.push(standardMat({
      color: 0x1a0f04, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(HATCH.r, HATCH.g, HATCH.b), emissiveIntensity: 0.35,
    }));
  }
  const r = CONFIG.hauler.radius;
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(hullGeo, hullMat);
    const sponsonL = new THREE.Mesh(sponsonLGeo, sponsonMat);
    const sponsonR = new THREE.Mesh(sponsonRGeo, sponsonMat);
    const hatch = new THREE.Mesh(hatchGeo, hatchMats[i]);
    const stack = new THREE.Mesh(stackGeo, sponsonMat);
    g.add(hull); g.add(sponsonL); g.add(sponsonR); g.add(hatch); g.add(stack); // all at the origin (absolute part-space)
    g.visible = false;
    scene.add(g);
    pool.push(g);
  }

  // I460/ST-429 A2: hull silhouette rim (shared pattern; per-role color in CONFIG.enemyRim).
  applyEnemyRim(hullMat, 'hauler');
if (isWebGPU()) for (const m of hatchMats) applyTSLGlow(m, { color: new THREE.Color(HATCH.r, HATCH.g, HATCH.b), base: 0.22, amp: 0.3, speed: 2, speed2: 4.9 }).setPulse(1); // I557 (ST-523): hatch glow (webgpu arm only)

  /** sync(haulerField, t, motionOff): place the pool; yaw onto the plod
   *  heading; the hatch glow ramps over the mine-drop telegraph (RM-safe). */
  function sync(field, t, motionOff) {
    const s = CONFIG.hauler;
    let i = 0;
    for (const h of field.haulers) {
      if (h.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(h.pos.x, 0.5, h.pos.y);
      const hx = h.headingVec ? h.headingVec.x : 1, hy = h.headingVec ? h.headingVec.y : 0;
      const len = Math.hypot(hx, hy);
      if (len > 1e-6) g.rotation.y = Math.atan2(-(hy / len), hx / len);
      const mat = hatchMats[i];
      const k = h.telegraphed ? Math.min(1, 1 - h.mineTimer / s.dropTelegraph) : 0;
      const hf = h.hitFlash || 0;
      const ramp = Math.max(k, hf * 0.5);
      mat.emissive.setRGB(HATCH.r + (1 - HATCH.r) * ramp, HATCH.g + (1 - HATCH.g) * ramp, HATCH.b + (1 - HATCH.b) * ramp);
      mat.emissiveIntensity = 0.35 + 1.5 * k + hf * 1.4;
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  function useGLB(obj) {
    let hull = null, sponsonL = null, sponsonR = null, hatch = null, stack = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/hatch/i.test(n)) { if (!hatch) hatch = o; }
      else if (/sponsonl/i.test(n)) { if (!sponsonL) sponsonL = o; }
      else if (/sponsonr/i.test(n)) { if (!sponsonR) sponsonR = o; }
      else if (/stack/i.test(n)) { if (!stack) stack = o; }
      else if (!hull) hull = o;
    });
    if (!hull) obj.traverse((o) => { if (!hull && o.isMesh && o !== hatch && o !== sponsonL && o !== sponsonR && o !== stack) hull = o; });
    if (hull) { hullGeo = ensureColor(hull.geometry); for (const g of pool) { const m = g.children[0]; if (m) m.geometry = hullGeo; } }
    if (sponsonL) { sponsonLGeo = ensureColor(sponsonL.geometry); for (const g of pool) { const m = g.children[1]; if (m) m.geometry = sponsonLGeo; } }
    if (sponsonR) { sponsonRGeo = ensureColor(sponsonR.geometry); for (const g of pool) { const m = g.children[2]; if (m) m.geometry = sponsonRGeo; } }
    if (hatch) { hatchGeo = ensureColor(hatch.geometry); for (const g of pool) { const m = g.children[3]; if (m) m.geometry = hatchGeo; } }
    if (stack) { stackGeo = ensureColor(stack.geometry); for (const g of pool) { const m = g.children[4]; if (m) m.geometry = stackGeo; } }
  }

  return { sync, pool, useGLB };
}
