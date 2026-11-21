// ST-518 (E75): BEACON rendering - the signal island: a stalwart square
// pedestal base (0x332e3a) carrying a raised tower (0x4a4466 x
// renderLumaGain - I552 FROZEN tint, spec base 0x4a4452) and a LAMP near the top (0xd07aff - the ONLY emissive
// element; the lamp IS the 1.5-s charge telegraph). Stationary by shape: no
// wings, no thrusters. The lamp emissive ramps 0 -> 1 over the charge
// (p.t / chargeTime) with a hitFlash white ramp; enter materializes (scale
// 0.4 -> 1 over enterDur). Procedural fallback (square base box + tower box
// + lamp cylinder) is baked in the SAME absolute part-space as the GLB (all
// pool children at the origin - the E69 identity-transform convention); the
// Blender GLB (I552) lands via useGLB (a /lamp/i node = glow slot, a /base/i
// node = base slot, every other mesh = tower). In-code materials kept (I220 /
// gunshipMesh precedent); the GLB COLOR_0 value bakes multiply through
// vertexColors.
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

function bakeBaseGeometry() {
  const geo = new THREE.BoxGeometry(2.3, 0.5, 2.3); // square pedestal (squares = immovable)
  geo.translate(0, 0.25, 0);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

function bakeTowerGeometry() {
  const geo = new THREE.BoxGeometry(0.9, 2.0, 0.9); // vertical island + head
  geo.translate(0, 1.5, 0);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

function bakeLampGeometry() {
  const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.26, 12); // the emitter (circle = energy)
  geo.translate(0, 2.58, 0);
  return geo;
}

const LAMP = { r: 0.82, g: 0.48, b: 1.0 }; // orchid signal 0xd07aff (approx linear base)

export function createBeaconRenderer(scene) {
  const POOL = CONFIG.beacon.maxConcurrent + 2; // cap 1 + 2 spare
  let baseGeo = bakeBaseGeometry(); // reassigned by useGLB when the beacon GLB resolves
  let towerGeo = bakeTowerGeometry();
  let lampGeo = bakeLampGeometry();
  const bodyColor = new THREE.Color(CONFIG.beacon.palette.body.color).multiplyScalar(CONFIG.beacon.renderLumaGain); // ST-518 in-render ladder rung (closing audit freezes the gain)
  const slotMats = []; // per slot: { base, tower, lamp }
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const baseMat = standardMat({ // I497 (ST-463)
      color: CONFIG.beacon.palette.base, roughness: 0.65, metalness: 0.2, flatShading: true, vertexColors: true,
    });
    const towerMat = standardMat({ // I497 (ST-463)
      color: bodyColor, roughness: 0.55, metalness: 0.25, flatShading: true, vertexColors: true,
      emissive: 0x150f1c, emissiveIntensity: 0.2,
    });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0x1a1020, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(LAMP.r, LAMP.g, LAMP.b), emissiveIntensity: 0.25,
    });
    const g = new THREE.Group();
    const base = new THREE.Mesh(baseGeo, baseMat);
    const tower = new THREE.Mesh(towerGeo, towerMat);
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    g.add(base); g.add(tower); g.add(lamp); // all at the origin (absolute part-space)
    g.visible = false;
    scene.add(g);
    pool.push(g);
    slotMats.push({ base: baseMat, tower: towerMat, lamp: lampMat });
  }

  // I460/ST-429 A2: tower silhouette rim (the tower is the body read; the
  // base stays a flat ground-plane element).
  for (const m of slotMats) applyEnemyRim(m.tower, 'beacon');

  /** sync(beaconField, t, motionOff): place the pool at floor level (the base
   *  sits on the deck); enter materializes; the lamp ramps over the charge
   *  telegraph (RM-safe state ramps). */
  function sync(field, t, motionOff) {
    const s = CONFIG.beacon;
    let i = 0;
    for (const p of field.beacons) {
      if (p.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(p.pos.x, 0, p.pos.y);
      g.rotation.y = 0;
      const kEnter = p.state === 'enter' ? Math.max(0, Math.min(1, p.t / s.enterDur)) : 1;
      g.scale.setScalar(0.4 + 0.6 * kEnter);
      const hf = p.hitFlash || 0;
      const k = p.state === 'charge' ? Math.max(0, Math.min(1, p.t / s.chargeTime)) : 0;
      const mats = slotMats[i];
      const wh = Math.min(1, Math.max(k, hf * 0.7));
      mats.lamp.emissive.setRGB(LAMP.r + (1 - LAMP.r) * wh, LAMP.g + (1 - LAMP.g) * wh, LAMP.b + (1 - LAMP.b) * wh);
      mats.lamp.emissiveIntensity = (0.25 + 1.75 * k) * (0.4 + 0.6 * kEnter) + hf * 1.3;
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  function useGLB(obj) {
    let base = null, tower = null, lamp = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/lamp/i.test(n)) { if (!lamp) lamp = o; }
      else if (/base/i.test(n)) { if (!base) base = o; }
      else if (!tower) tower = o;
    });
    if (!tower) obj.traverse((o) => { if (!tower && o.isMesh && o !== base && o !== lamp) tower = o; });
    if (base) { baseGeo = ensureColor(base.geometry); for (const g of pool) { const m = g.children[0]; if (m) m.geometry = baseGeo; } }
    if (tower) { towerGeo = ensureColor(tower.geometry); for (const g of pool) { const m = g.children[1]; if (m) m.geometry = towerGeo; } }
    if (lamp) { lampGeo = ensureColor(lamp.geometry); for (const g of pool) { const m = g.children[2]; if (m) m.geometry = lampGeo; } }
  }

  return { sync, pool, useGLB };
}
