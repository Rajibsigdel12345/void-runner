// ST-485 (E69): PHANTOM flank-ambush cloaker rendering - a pooled slim arrow
// hull (cloaker-green 0x40c055, gain 2.0) with two swept dark-hull canopy pods
// (0x1d5c3f) and a cloak-edge accent nose (0x7dffc8) that ramps white-hot over
// the strike uncloak. The whole group FADES with the entity's cloak opacity
// (enter 0 -> orbit 1 -> cloak 0.12 -> drift -> strike 1): per-slot materials
// are transparent by construction, so opacity is the ONLY visual state the
// render tracks (the core drives the value). A hit flash ramps the nose white.
// Procedural fallback (arrow box + 2 pod boxes + nose sphere) is baked in the
// SAME absolute part-space as the GLB (all pool children sit at the origin -
// the E69 GLBs are authored with identity node transforms, unlike the
// part-local wasp/sentry convention); the Blender GLB (ST-482, I516) lands in
// via useGLB (a /nose/i node = glow slot, /podl/i + /podr/i = pod slots,
// every other mesh = hull). In-code materials kept (I220 / gunshipMesh
// precedent); the GLB COLOR_0 value bakes multiply through vertexColors.
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
  const geo = new THREE.BoxGeometry(1.36, 0.38, 0.48); // GLB VR_Hull: x -0.70..0.66, y -0.18..0.20, z -0.24..0.24
  geo.translate(-0.02, 0.01, 0);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

function bakePodGeometry(z) {
  const geo = new THREE.BoxGeometry(0.34, 0.16, 0.32); // GLB VR_PodL/R: x -0.16..0.17, y 0.02..0.18, z 0.14..0.46 (mirrored)
  geo.translate(0.005, 0.1, z);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

function bakeNoseGeometry() {
  const geo = new THREE.SphereGeometry(0.095, 8, 6); // GLB VR_Nose: x 0.45..0.64, y +/-0.09, z +/-0.10
  geo.translate(0.545, 0.01, 0);
  geo.computeVertexNormals();
  return geo;
}

const ACCENT = { r: 0.49, g: 1.0, b: 0.78 }; // cloak-edge 0x7dffc8 (approx linear base)

export function createPhantomRenderer(scene) {
  const POOL = CONFIG.phantom.maxConcurrent + 2; // cap 2 + 2 spare
  let hullGeo = bakeHullGeometry(); // reassigned by useGLB when the phantom GLB resolves
  let podLGeo = bakePodGeometry(0.3);
  let podRGeo = bakePodGeometry(-0.3);
  let noseGeo = bakeNoseGeometry();
  const bodyColor = new THREE.Color(CONFIG.phantom.palette.body.color).multiplyScalar(CONFIG.phantom.renderLumaGain); // I519 rendered-luma audit (E69 12-rung ladder)
  const r = CONFIG.phantom.radius;
  const slotMats = []; // per slot: { hull, pod, nose } - opacity is per-phantom (cloak)
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const hullMat = standardMat({ // I497 (ST-463)
      color: bodyColor, roughness: 0.5, metalness: 0.2, flatShading: true, vertexColors: true,
      emissive: 0x0f2a14, emissiveIntensity: 0.2, transparent: true, opacity: 0,
    });
    const podMat = standardMat({
      color: CONFIG.phantom.palette.pod, roughness: 0.6, metalness: 0.15, flatShading: true, vertexColors: true,
      transparent: true, opacity: 0,
    });
    const noseMat = standardMat({
      color: 0x10241a, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(ACCENT.r, ACCENT.g, ACCENT.b), emissiveIntensity: 0.6,
      transparent: true, opacity: 0,
    });
    const g = new THREE.Group();
    const hull = new THREE.Mesh(hullGeo, hullMat);
    const podL = new THREE.Mesh(podLGeo, podMat);
    const podR = new THREE.Mesh(podRGeo, podMat);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    g.add(hull); g.add(podL); g.add(podR); g.add(nose); // all at the origin (absolute part-space)
    g.visible = false;
    scene.add(g);
    pool.push(g);
    slotMats.push({ hull: hullMat, pod: podMat, nose: noseMat });
  }

  // I460/ST-429 A2: hull silhouette rim (shared pattern; per-role color in CONFIG.enemyRim).
  // Per-slot hull materials (cloak opacity is per-phantom) -> one rimmed material per slot.
  for (const m of slotMats) applyEnemyRim(m.hull, 'phantom');
if (isWebGPU()) for (const m of slotMats) applyTSLGlow(m.nose, { color: new THREE.Color(ACCENT.r, ACCENT.g, ACCENT.b), base: 0.2, amp: 0.3, speed: 2.4, speed2: 5.9 }).setPulse(1); // I557 (ST-523): nose/cloak-edge glow (webgpu arm only)

  /** sync(phantomField, t, motionOff): place the pool; fade with the cloak
   *  opacity; the nose glow ramps over the strike uncloak (RM-safe state ramp). */
  function sync(field, t, motionOff) {
    const s = CONFIG.phantom;
    let i = 0;
    for (const p of field.phantoms) {
      if (p.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(p.pos.x, 0.5, p.pos.y);
      const dx = p.vel ? p.vel.x : 0, dy = p.vel ? p.vel.y : 0;
      const len = Math.hypot(dx, dy);
      if (len > 1e-6) g.rotation.y = Math.atan2(-(dy / len), dx / len);
      const op = Math.max(0, Math.min(1, p.opacity === undefined ? 0 : p.opacity));
      const hf = p.hitFlash || 0;
      const k = p.state === 'strike' ? Math.min(1, p.t / s.uncloakDur) : 0;
      const mats = slotMats[i];
      mats.hull.opacity = op;
      mats.pod.opacity = op;
      mats.nose.opacity = op;
      const ramp = Math.max(k, hf * 0.6);
      mats.nose.emissive.setRGB(ACCENT.r + (1 - ACCENT.r) * ramp, ACCENT.g + (1 - ACCENT.g) * ramp, ACCENT.b + (1 - ACCENT.b) * ramp);
      mats.nose.emissiveIntensity = 0.6 + 1.2 * k + hf * 1.4;
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  function useGLB(obj) {
    let hull = null, podL = null, podR = null, nose = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/nose/i.test(n)) { if (!nose) nose = o; }
      else if (/podl/i.test(n)) { if (!podL) podL = o; }
      else if (/podr/i.test(n)) { if (!podR) podR = o; }
      else if (!hull) hull = o;
    });
    if (!hull) obj.traverse((o) => { if (!hull && o.isMesh && o !== nose && o !== podL && o !== podR) hull = o; });
    if (hull) { hullGeo = ensureColor(hull.geometry); for (const g of pool) { const m = g.children[0]; if (m) m.geometry = hullGeo; } }
    if (podL) { podLGeo = ensureColor(podL.geometry); for (const g of pool) { const m = g.children[1]; if (m) m.geometry = podLGeo; } }
    if (podR) { podRGeo = ensureColor(podR.geometry); for (const g of pool) { const m = g.children[2]; if (m) m.geometry = podRGeo; } }
    if (nose) { noseGeo = ensureColor(nose.geometry); for (const g of pool) { const m = g.children[3]; if (m) m.geometry = noseGeo; } }
  }

  return { sync, pool, useGLB };
}
