// ST-518 (E75): SWEEPER rendering - a pooled wide flat angular delta hull
// (cobalt 0x434a72 x renderLumaGain - I552 FROZEN tint, spec base 0x2e4a72) with a glowing leading-edge emitter arc
// (0x8fd0ff - the arc IS the attack read: an inline band, never a ball) and a
// dark deck greeble (0x1c2c44). State ramps are RM-safe: enter materializes
// (scale 0.4 -> 1 over enterDur), the arc emissive pulses with the fan
// cadence (bright AT the fire, decaying over the cycle) and hitFlash ramps it
// white-hot. Yaw follows p.facing in sweep/reaim (facing is a game-space
// angle, so yaw = -facing) and p.vel in enter/approach (the phantom atan2
// mapping). Procedural fallback (extruded delta + torus arc band + greeble
// box) is baked in the SAME absolute part-space as the GLB (all pool children
// at the origin - the E69 identity-transform convention); the Blender GLB
// (I552) lands via useGLB (a /arc/i node = glow slot, /greeble/i = greeble
// slot, every other mesh = hull). In-code materials kept (I220 / gunshipMesh
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
  // Wide flat angular delta (X forward, Y up): the leading edge IS the ~120-
  // deg arc the bolt fan sweeps.
  const shape = new THREE.Shape();
  shape.moveTo(1.04, 0);      // nose
  shape.lineTo(-0.78, 0.92);  // right rear corner
  shape.lineTo(-0.78, -0.92); // left rear corner
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2); // deck into XZ, thickness into Y
  geo.translate(0, -0.11, 0);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

function bakeArcGeometry() {
  // The recessed emitter band: a torus arc spanning the full sweep arc,
  // centered on the nose, inlaid in the deck top (R-GLOW inline band).
  const span = CONFIG.sweeper.arcSpan;
  const geo = new THREE.TorusGeometry(0.86, 0.035, 6, 28, span);
  geo.rotateX(Math.PI / 2); // XY -> XZ (arc sweeps from +X toward +Z)
  geo.rotateY(span / 2);    // center the arc on +X (forward)
  geo.translate(0, 0.1, 0); // inlaid in the deck (top face 0.11)
  return geo;
}

function bakeGreebleGeometry() {
  const geo = new THREE.BoxGeometry(0.36, 0.06, 0.56); // rear-deck dressing
  geo.translate(-0.45, 0.14, 0);
  geo.computeVertexNormals();
  return ensureColor(geo);
}

const ARC = { r: 0.56, g: 0.82, b: 1.0 }; // emitter 0x8fd0ff (approx linear base)

export function createSweeperRenderer(scene) {
  const POOL = CONFIG.sweeper.maxConcurrent + 2; // cap 2 + 2 spare
  let hullGeo = bakeHullGeometry(); // reassigned by useGLB when the sweeper GLB resolves
  let arcGeo = bakeArcGeometry();
  let greebleGeo = bakeGreebleGeometry();
  const bodyColor = new THREE.Color(CONFIG.sweeper.palette.body.color).multiplyScalar(CONFIG.sweeper.renderLumaGain); // ST-518 in-render ladder rung (closing audit freezes the gain)
  const slotMats = []; // per slot: { hull, arc, greeble }
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const hullMat = standardMat({ // I497 (ST-463)
      color: bodyColor, roughness: 0.5, metalness: 0.2, flatShading: true, vertexColors: true,
      emissive: 0x0a1424, emissiveIntensity: 0.25,
    });
    const arcMat = standardMat({
      color: 0x101c2c, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(ARC.r, ARC.g, ARC.b), emissiveIntensity: 0.6,
    });
    const greebleMat = standardMat({
      color: CONFIG.sweeper.palette.greeble, roughness: 0.7, metalness: 0.1, flatShading: true, vertexColors: true,
    });
    const g = new THREE.Group();
    const hull = new THREE.Mesh(hullGeo, hullMat);
    const arc = new THREE.Mesh(arcGeo, arcMat);
    const greeble = new THREE.Mesh(greebleGeo, greebleMat);
    g.add(hull); g.add(arc); g.add(greeble); // all at the origin (absolute part-space)
    g.visible = false;
    scene.add(g);
    pool.push(g);
    slotMats.push({ hull: hullMat, arc: arcMat, greeble: greebleMat });
  }

  // I460/ST-429 A2: hull silhouette rim (shared pattern; per-role color in CONFIG.enemyRim).
  for (const m of slotMats) applyEnemyRim(m.hull, 'sweeper');
if (isWebGPU()) for (const m of slotMats) applyTSLGlow(m.arc, { color: new THREE.Color(ARC.r, ARC.g, ARC.b), base: 0.3, amp: 0.4, speed: 3.5, speed2: 8.3 }).setPulse(1); // I557 (ST-523): arc glow (webgpu arm only)

  /** sync(sweeperField, t, motionOff): place the pool (flight level 0.5); yaw
   *  from facing (sweep/reaim) or velocity (enter/approach); enter
   *  materializes; the arc emissive pulses with the fan cadence (RM-safe
   *  state ramps). */
  function sync(field, t, motionOff) {
    const s = CONFIG.sweeper;
    let i = 0;
    for (const p of field.sweepers) {
      if (p.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(p.pos.x, 0.5, p.pos.y);
      let yaw;
      if (p.state === 'sweep' || p.state === 'reaim') {
        yaw = -p.facing;
      } else {
        const dx = p.vel ? p.vel.x : 0, dy = p.vel ? p.vel.y : 0;
        const len = Math.hypot(dx, dy);
        yaw = len > 1e-6 ? Math.atan2(-dy / len, dx / len) : 0;
      }
      g.rotation.y = yaw;
      const hf = p.hitFlash || 0;
      const kEnter = p.state === 'enter' ? Math.max(0, Math.min(1, p.t / s.enterDur)) : 1;
      g.scale.setScalar(0.4 + 0.6 * kEnter);
      const mats = slotMats[i];
      const toFan = p.nextFan !== undefined ? Math.max(0, p.nextFan - p.t) : 0;
      const pulse = p.state === 'sweep' ? Math.max(0, Math.min(1, 1 - toFan / s.cadence)) : 0.25;
      const wh = Math.min(1, hf);
      mats.arc.emissive.setRGB(ARC.r + (1 - ARC.r) * wh, ARC.g + (1 - ARC.g) * wh, ARC.b + (1 - ARC.b) * wh);
      mats.arc.emissiveIntensity = (0.55 + 0.85 * pulse) * (0.35 + 0.65 * kEnter) + hf * 1.2;
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  function useGLB(obj) {
    let hull = null, arc = null, greeble = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/arc/i.test(n)) { if (!arc) arc = o; }
      else if (/greeble/i.test(n)) { if (!greeble) greeble = o; }
      else if (!hull) hull = o;
    });
    if (!hull) obj.traverse((o) => { if (!hull && o.isMesh && o !== arc && o !== greeble) hull = o; });
    if (hull) { hullGeo = ensureColor(hull.geometry); for (const g of pool) { const m = g.children[0]; if (m) m.geometry = hullGeo; } }
    if (arc) { arcGeo = ensureColor(arc.geometry); for (const g of pool) { const m = g.children[1]; if (m) m.geometry = arcGeo; } }
    if (greeble) { greebleGeo = ensureColor(greeble.geometry); for (const g of pool) { const m = g.children[2]; if (m) m.geometry = greebleGeo; } }
  }

  return { sync, pool, useGLB };
}
