// ST-418: HUNTER stalker rendering - a pooled flat swept manta/dart body (rust
// 0x9c5a46) with a W-REAR fin (fin-dark 0x4a2a22) that DEPLOYS (spreads) during
// the telegraph and CLOSES during the dash (a render-only pose change = the
// reduced-motion-safe cue; the W-fin rear signature), and a separate emissive
// threat-red core (0xff4a2a) that ramps white-hot through the telegraph.
// Procedural fallback (manta + fin + core); the Blender GLB lands in ST-421 via
// useGLB (a /core/i node = glow slot, /fin/i = fin-dark slot, every other mesh = hull).
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

function bakeHullGeometry() {
  // flat swept manta dart: octahedron squashed in Y (low profile), stretched forward
  const geo = new THREE.OctahedronGeometry(CONFIG.hunter.radius, 0);
  geo.scale(1.9, 0.34, 1.15);
  geo.computeVertexNormals();
  const col = new Float32Array(geo.attributes.position.count * 3).fill(1);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function bakeFinGeometry() {
  // wide thin W-fin plate at the rear (deploy = spread wide, close = tucked)
  const geo = new THREE.BoxGeometry(CONFIG.hunter.radius * 0.5, CONFIG.hunter.radius * 0.12, CONFIG.hunter.radius * 2.4, 1, 1, 1);
  geo.computeVertexNormals();
  return geo;
}

function bakeCoreGeometry() {
  const geo = new THREE.OctahedronGeometry(CONFIG.hunter.radius * 0.36, 0);
  geo.scale(1.3, 1.1, 1.1);
  geo.computeVertexNormals();
  return geo;
}

const CORE_RED = { r: 1.0, g: 0.29, b: 0.16 }; // threat-red 0xff4a2a (approx linear base)

export function createHunterRenderer(scene) {
  const POOL = CONFIG.hunter.maxConcurrent + 2; // cap 2 + 2 spare
  let hullGeo = bakeHullGeometry(); // reassigned by useGLB when the hunter GLB resolves
  let finGeo = bakeFinGeometry();
  let coreGeo = bakeCoreGeometry();
  const hullMat = new THREE.MeshStandardMaterial({
    color: CONFIG.hunter.palette.body.color, roughness: 0.55, metalness: 0.5, flatShading: true, vertexColors: true,
    emissive: 0x2a120c, emissiveIntensity: 0.25,
  });
  const finMat = new THREE.MeshStandardMaterial({
    color: CONFIG.hunter.palette.fin.color, roughness: 0.7, metalness: 0.35, flatShading: true,
  });
  const coreMats = [];
  for (let i = 0; i < POOL; i++) {
    coreMats.push(new THREE.MeshStandardMaterial({
      color: 0x140604, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(CORE_RED.r, CORE_RED.g, CORE_RED.b), emissiveIntensity: 0.5,
    }));
  }
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(hullGeo, hullMat);
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.x = -CONFIG.hunter.radius * 0.9;
    const core = new THREE.Mesh(coreGeo, coreMats[i]);
    core.position.x = CONFIG.hunter.radius * 0.55;
    g.add(hull);
    g.add(fin);
    g.add(core);
    g.visible = false;
    scene.add(g);
    pool.push(g);
  }

  /** sync(hunterField, t, motionOff): place the pool; fin deploys + core ramps with the state. */
  function sync(field, t, motionOff) {
    const cfg = CONFIG.hunter;
    let i = 0;
    for (const h of field.hunters) {
      if (h.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(h.pos.x, 0.5, h.pos.y);
      // heading: face the aim direction during telegraph/dash, the velocity otherwise
      let dx = h.vel ? h.vel.x : 0, dy = h.vel ? h.vel.y : 0;
      if (h.state === 'telegraph' || h.state === 'dash') { dx = h.aimDir ? h.aimDir.x : 0; dy = h.aimDir ? h.aimDir.y : 0; }
      const len = Math.hypot(dx, dy);
      if (len > 1e-6) g.rotation.y = Math.atan2(-(dy / len), dx / len);
      // fin deploy: spread during telegraph (the cue), close hard during dash, subtle idle at rest
      const fin = g.children[1];
      let spread;
      if (h.state === 'telegraph') spread = 0.5 + 0.5 * Math.min(1, h.t / cfg.telegraph); // 0.5 -> 1.0
      else if (h.state === 'dash') spread = 0.28; // closed (a streamlined lunge)
      else if (h.state === 'recover') spread = 0.4 + 0.1 * Math.max(0, 1 - h.t / cfg.recover);
      else spread = 0.4 + (motionOff ? 0 : 0.08 * Math.sin(t * 3 + h.tumblePhase)); // subtle idle (motion-gated)
      fin.scale.z = 0.4 + 1.5 * spread;
      fin.scale.y = 0.6 + 0.8 * spread;
      // core glow: dim red idle -> white-hot through the telegraph -> hold on dash -> cool-down on recover
      const mat = coreMats[i];
      let k;
      if (h.state === 'telegraph') k = Math.min(1, h.t / cfg.telegraph);
      else if (h.state === 'dash') k = 1;
      else if (h.state === 'recover') k = Math.max(0, 1 - h.t / cfg.recover) * 0.4;
      else k = 0;
      mat.emissive.setRGB(CORE_RED.r, CORE_RED.g + (1 - CORE_RED.g) * k, CORE_RED.b + (1 - CORE_RED.b) * k);
      mat.emissiveIntensity = 0.5 + 2.4 * k; // dash/telegraph-end clears the 0.72 bloom threshold (white-hot tip)
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  // ST-421 hook: swap the manta geometry to the Blender hunter GLB. Matches a
  // /core/i node for the glow slot and a /fin/i node for the fin-dark slot;
  // every other mesh feeds the hull. In-code materials kept (wardenMesh, I220).
  function useGLB(obj) {
    let hull = null, fin = null, core = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/core/i.test(n)) { if (!core) core = o; }
      else if (/fin/i.test(n)) { if (!fin) fin = o; }
      else if (!hull) hull = o;
    });
    if (!hull) obj.traverse((o) => { if (!hull && o.isMesh && o !== core && o !== fin) hull = o; });
    if (hull) {
      if (!hull.geometry.hasAttribute('color')) {
        const col = new Float32Array(hull.geometry.attributes.position.count * 3).fill(1);
        hull.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      hullGeo = hull.geometry; for (const g of pool) { const m = g.children[0]; if (m) m.geometry = hullGeo; }
    }
    if (fin) { finGeo = fin.geometry; for (const g of pool) { const m = g.children[1]; if (m) m.geometry = finGeo; } }
    if (core) { coreGeo = core.geometry; for (const g of pool) { const m = g.children[2]; if (m) m.geometry = coreGeo; } }
  }

  return { sync, pool, useGLB };
}
