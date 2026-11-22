// ST-418: GUNSHIP heavy bomber rendering - a pooled bulky gunmetal hull (0x39424e)
// with two dark engine nacelles (0x232a33) and a forward payload-bay glow
// (0xff9a3d) that ARMS (ramps white-hot) before each lobbed shot and flashes
// white on a hit. Procedural fallback (hull + 2 nacelles + bay); the Blender GLB
// lands in ST-421 via useGLB (a /bay|core/i node = glow slot, /nacelle|engine/i
// = nacelle slots, every other mesh = hull).
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { applyEnemyRim } from './enemyRim.js'; // I460/ST-429 A2: shared fresnel silhouette rim
import { standardMat, isWebGPU } from './fxArm.js'; // I497 (ST-463): node material on the webgpu arm
import { applyTSLGlow } from './tslMaterials.js'; // I557 (ST-523): TSL time-pulsed glow (webgpu arm only)

function bakeHullGeometry() {
  const r = CONFIG.gunship.radius;
  const geo = new THREE.BoxGeometry(r * 2.6, r * 0.8, r * 1.9, 1, 1, 1);
  geo.computeVertexNormals();
  const col = new Float32Array(geo.attributes.position.count * 3).fill(1);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function bakeNacelleGeometry() {
  const r = CONFIG.gunship.radius;
  const geo = new THREE.CylinderGeometry(r * 0.28, r * 0.34, r * 1.2, 6);
  geo.rotateZ(Math.PI / 2); // along X (forward-back)
  geo.computeVertexNormals();
  return geo;
}

function bakeBayGeometry() {
  const r = CONFIG.gunship.radius;
  const geo = new THREE.BoxGeometry(r * 0.5, r * 0.35, r * 0.5, 1, 1, 1);
  geo.computeVertexNormals();
  return geo;
}

const BAY_IDLE = { r: 1.0, g: 0.6, b: 0.24 }; // payload-amber 0xff9a3d (approx linear base)

export function createGunshipRenderer(scene) {
  const POOL = CONFIG.gunship.maxConcurrent + 1; // cap 1 + 1 spare
  let hullGeo = bakeHullGeometry(); // reassigned by useGLB when the gunship GLB resolves
  let nacelleGeo = bakeNacelleGeometry();
  let bayGeo = bakeBayGeometry();
  const hullColor = new THREE.Color(CONFIG.gunship.palette.body.color).multiplyScalar(CONFIG.gunship.renderLumaGain); // I451: rendered-luma audit (render451 Part E) - the palette renders ~0.31x under ACES/exposure/grade; the gain lands the ladder (p50 ~65)
  const hullMat = standardMat({ // I497 (ST-463)
    color: hullColor, roughness: 0.72, metalness: 0.2, flatShading: true, vertexColors: true, // I451: painted gunmetal (metalness 0.55 rendered near-black under the scene light; sRGB palette luma ~65 kept as the design value; renderLumaGain restores the band)
    emissive: 0x101418, emissiveIntensity: 0.2,
  });
  const nacelleMat = standardMat({
    color: CONFIG.gunship.palette.nacelle.color, roughness: 0.65, metalness: 0.25, flatShading: true, // I451: painted (same metalness fix as hull)
  });
  const bayMats = [];
  for (let i = 0; i < POOL; i++) {
    bayMats.push(standardMat({
      color: 0x1a0f04, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(BAY_IDLE.r, BAY_IDLE.g, BAY_IDLE.b), emissiveIntensity: 0.5,
    }));
  }
  const r = CONFIG.gunship.radius;
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(hullGeo, hullMat);
    const nacL = new THREE.Mesh(nacelleGeo, nacelleMat); nacL.position.set(0, -r * 0.35, -r * 0.55);
    const nacR = new THREE.Mesh(nacelleGeo, nacelleMat); nacR.position.set(0, -r * 0.35, r * 0.55);
    const bay = new THREE.Mesh(bayGeo, bayMats[i]); bay.position.set(r * 0.9, r * 0.1, 0);
    g.add(hull); g.add(nacL); g.add(nacR); g.add(bay);
    g.visible = false;
    scene.add(g);
    pool.push(g);
  }

  /** sync(gunshipField, t, motionOff): place the pool; the bay glow reads arm + hit. */
  function sync(field, t, motionOff) {
    const cfg = CONFIG.gunship;
    let i = 0;
    for (const gs of field.gunships) {
      if (gs.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(gs.pos.x, 0.5, gs.pos.y);
      // facing: enter = velocity; hold = the slow circular drift tangent
      let dx = 0, dy = 0;
      if (gs.state === 'enter' && gs.vel) { dx = gs.vel.x; dy = gs.vel.y; }
      else { const ang = gs.holdT * cfg.driftOmega + gs.phase; dx = -Math.sin(ang); dy = Math.cos(ang); }
      const len = Math.hypot(dx, dy);
      if (len > 1e-6) g.rotation.y = Math.atan2(-(dy / len), dx / len);
      // bay glow: amber idle -> arms white-hot before a shot (armK) -> hit flashes white and decays
      const mat = bayMats[i];
      const armK = gs.armed ? Math.min(1, gs.armT / cfg.armDur) : 0;
      const hf = gs.hitFlash || 0;
      const ramp = Math.max(armK, hf);
      mat.emissive.setRGB(BAY_IDLE.r + (1 - BAY_IDLE.r) * ramp, BAY_IDLE.g + (1 - BAY_IDLE.g) * ramp, BAY_IDLE.b + (1 - BAY_IDLE.b) * ramp);
      mat.emissiveIntensity = 0.5 + armK * 1.0 + hf * 1.4;
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  // ST-421 hook: swap the bomber geometry to the Blender gunship GLB. Matches a
  // /bay|core/i node for the glow slot and a /nacelle|engine/i node for the
  // nacelle slots; every other mesh feeds the hull. In-code materials kept (I220).
  // I460/ST-429 A2: hull silhouette rim (shared I278 pattern; per-role color in CONFIG.enemyRim).
  applyEnemyRim(hullMat, 'gunship');
if (isWebGPU()) for (const m of bayMats) applyTSLGlow(m, { color: new THREE.Color(BAY_IDLE.r, BAY_IDLE.g, BAY_IDLE.b), base: 0.22, amp: 0.3, speed: 2.2, speed2: 5.1 }).setPulse(1); // I557 (ST-523): bay glow (webgpu arm only)

  function useGLB(obj) {
    let hull = null, nacelle = null, bay = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/bay|core/i.test(n)) { if (!bay) bay = o; }
      else if (/nacelle|engine/i.test(n)) { if (!nacelle) nacelle = o; }
      else if (!hull) hull = o;
    });
    if (!hull) obj.traverse((o) => { if (!hull && o.isMesh && o !== bay && o !== nacelle) hull = o; });
    if (hull) {
      if (!hull.geometry.hasAttribute('color')) {
        const col = new Float32Array(hull.geometry.attributes.position.count * 3).fill(1);
        hull.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      hullGeo = hull.geometry; for (const g of pool) { const m = g.children[0]; if (m) m.geometry = hullGeo; }
    }
    if (nacelle) { nacelleGeo = nacelle.geometry; for (const g of pool) { const m1 = g.children[1], m2 = g.children[2]; if (m1) m1.geometry = nacelleGeo; if (m2) m2.geometry = nacelleGeo; } }
    if (bay) { bayGeo = bay.geometry; for (const g of pool) { const m = g.children[3]; if (m) m.geometry = bayGeo; } }
  }

  return { sync, pool, useGLB };
}
