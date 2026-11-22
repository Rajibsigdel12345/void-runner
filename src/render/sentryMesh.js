// ST-448 (E63): SENTRY mid-range aimed shooter rendering - a pooled warm-sage
// platform (0x8a8f7a) on a dark-sage spar (0x3a3f34) with a forward barrel and a
// charge node (0xff9a3d) that ramps white-hot over the 0.8 s telegraph and holds
// through the 3-bolt burst. The whole rig SLEWS (group heading) onto the aim
// bearing while aiming/charging/bursting (the read-and-dodge cue); a hit flashes
// the charge white. Procedural fallback (platform + spar + barrel + charge); the
// Blender GLB lands in ST-449 via useGLB (a /charge/i node = glow slot, a
// /barrel/i node = barrel slot, a /base|spar/i node = spar slot, every other mesh
// = hull). In-code materials kept (I220 / gunshipMesh precedent).
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { applyEnemyRim } from './enemyRim.js'; // I460/ST-429 A2: shared fresnel silhouette rim
import { standardMat, isWebGPU } from './fxArm.js'; // I497 (ST-463): node material on the webgpu arm
import { applyTSLGlow } from './tslMaterials.js'; // I557 (ST-523): TSL time-pulsed glow (webgpu arm only)

function bakePlatformGeometry() {
  const r = CONFIG.sentry.radius;
  const geo = new THREE.CylinderGeometry(r * 0.92, r * 1.05, r * 0.35, 8);
  geo.computeVertexNormals();
  const col = new Float32Array(geo.attributes.position.count * 3).fill(1);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function bakeBaseGeometry() {
  const r = CONFIG.sentry.radius;
  const geo = new THREE.BoxGeometry(r * 2.4, r * 0.16, r * 0.55, 1, 1, 1);
  geo.computeVertexNormals();
  return geo;
}

function bakeBarrelGeometry() {
  const r = CONFIG.sentry.radius;
  const geo = new THREE.BoxGeometry(r * 1.2, r * 0.3, r * 0.3, 1, 1, 1);
  geo.computeVertexNormals();
  return geo;
}

function bakeChargeGeometry() {
  const r = CONFIG.sentry.radius;
  const geo = new THREE.SphereGeometry(r * 0.18, 8, 6);
  geo.computeVertexNormals();
  return geo;
}

const CHARGE_IDLE = { r: 1.0, g: 0.6, b: 0.24 }; // payload-amber 0xff9a3d (approx linear base)

export function createSentryRenderer(scene) {
  const POOL = CONFIG.sentry.maxConcurrent + 2; // cap 2 + 2 spare
  let platformGeo = bakePlatformGeometry(); // reassigned by useGLB when the sentry GLB resolves
  let baseGeo = bakeBaseGeometry();
  let barrelGeo = bakeBarrelGeometry();
  let chargeGeo = bakeChargeGeometry();
  const hullColor = new THREE.Color(CONFIG.sentry.palette.body.color).multiplyScalar(CONFIG.sentry.renderLumaGain); // I480 rendered-luma audit: POD 127 < SENTRY 137 < WASP 176
  const hullMat = standardMat({ // I497 (ST-463)
    color: hullColor, roughness: 0.7, metalness: 0.2, flatShading: true, vertexColors: true,
    emissive: 0x14160f, emissiveIntensity: 0.2,
  });
  const baseMat = standardMat({
    color: CONFIG.sentry.palette.base.color, roughness: 0.8, metalness: 0.15, flatShading: true,
  });
  const chargeMats = [];
  for (let i = 0; i < POOL; i++) {
    chargeMats.push(standardMat({
      color: 0x1a0f04, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(CHARGE_IDLE.r, CHARGE_IDLE.g, CHARGE_IDLE.b), emissiveIntensity: 0.5,
    }));
  }
  const r = CONFIG.sentry.radius;
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const g = new THREE.Group();
    const platform = new THREE.Mesh(platformGeo, hullMat);
    const base = new THREE.Mesh(baseGeo, baseMat);
    const barrel = new THREE.Mesh(barrelGeo, hullMat); barrel.position.set(r * 0.9, 0, 0);
    const charge = new THREE.Mesh(chargeGeo, chargeMats[i]); charge.position.set(r * 1.6, 0, 0);
    g.add(platform); g.add(base); g.add(barrel); g.add(charge);
    g.visible = false;
    scene.add(g);
    pool.push(g);
  }

  /** sync(sentryField, t, motionOff): place the pool; heading = aim while aiming,
   *  the velocity otherwise; the charge node ramps over the telegraph. */
  function sync(field, t, motionOff) {
    const cfg = CONFIG.sentry;
    let i = 0;
    for (const q of field.sentries) {
      if (q.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(q.pos.x, 0.5, q.pos.y);
      let dx = q.vel ? q.vel.x : 0, dy = q.vel ? q.vel.y : 0;
      if (q.state === 'aim' || q.state === 'charge' || q.state === 'burst') {
        dx = Math.cos(q.aimAngle); dy = Math.sin(q.aimAngle);
      }
      const len = Math.hypot(dx, dy);
      if (len > 1e-6) g.rotation.y = Math.atan2(-(dy / len), dx / len);
      const mat = chargeMats[i];
      let k;
      if (q.state === 'charge') k = Math.min(1, q.t / cfg.telegraph);
      else if (q.state === 'burst') k = 1;
      else if (q.state === 'cooldown') k = Math.max(0, 1 - q.t / 0.5) * 0.4;
      else k = 0;
      const hf = q.hitFlash || 0;
      const ramp = Math.max(k, hf * 0.5);
      mat.emissive.setRGB(CHARGE_IDLE.r + (1 - CHARGE_IDLE.r) * ramp, CHARGE_IDLE.g + (1 - CHARGE_IDLE.g) * ramp, CHARGE_IDLE.b + (1 - CHARGE_IDLE.b) * ramp);
      mat.emissiveIntensity = 0.5 + 1.4 * k + hf * 1.4;
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  // I460/ST-429 A2: hull silhouette rim (shared pattern; per-role color in CONFIG.enemyRim).
  applyEnemyRim(hullMat, 'sentry');
if (isWebGPU()) for (const m of chargeMats) applyTSLGlow(m, { color: new THREE.Color(CHARGE_IDLE.r, CHARGE_IDLE.g, CHARGE_IDLE.b), base: 0.28, amp: 0.38, speed: 4.1, speed2: 9.7 }).setPulse(1); // I557 (ST-523): charge glow (webgpu arm only)

  function useGLB(obj) {
    let platform = null, base = null, barrel = null, charge = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/charge/i.test(n)) { if (!charge) charge = o; }
      else if (/base|spar/i.test(n)) { if (!base) base = o; }
      else if (/barrel/i.test(n)) { if (!barrel) barrel = o; }
      else if (!platform) platform = o;
    });
    if (!platform) obj.traverse((o) => { if (!platform && o.isMesh && o !== charge && o !== base && o !== barrel) platform = o; });
    if (platform) {
      if (!platform.geometry.hasAttribute('color')) {
        const col = new Float32Array(platform.geometry.attributes.position.count * 3).fill(1);
        platform.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      platformGeo = platform.geometry; for (const g of pool) { const m = g.children[0]; if (m) m.geometry = platformGeo; }
    }
    if (base) { baseGeo = base.geometry; for (const g of pool) { const m = g.children[1]; if (m) m.geometry = baseGeo; } }
    if (barrel) { barrelGeo = barrel.geometry; for (const g of pool) { const m = g.children[2]; if (m) m.geometry = barrelGeo; } }
    if (charge) { chargeGeo = charge.geometry; for (const g of pool) { const m = g.children[3]; if (m) m.geometry = chargeGeo; } }
  }

  return { sync, pool, useGLB };
}
