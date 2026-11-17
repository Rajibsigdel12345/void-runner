// ST-448 (E63): WASP popcorn dasher rendering - a pooled chartreuse dart
// (0xb9c34d) with a dark-olive wing plate (0x5a6128) and a threat-red nose
// (0xff4a2a) that ramps through the corkscrew anticipation and goes white-hot on
// the dash. The nose glow is the read-your-death cue (the 1.0-1.2 s corkscrew
// floor before a straight lunge at 15.5 u/s). Split-children look identical (the
// same pool serves packs and split wasps). Procedural fallback (dart + wing +
// nose); the Blender GLB lands in ST-449 via useGLB (a /nose|dash/i node = nose
// slot, a /wing/i node = wing slot, every other mesh = hull).
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { applyEnemyRim } from './enemyRim.js'; // I460/ST-429 A2: shared fresnel silhouette rim

function bakeHullGeometry() {
  const r = CONFIG.wasp.radius;
  const geo = new THREE.OctahedronGeometry(r, 0);
  geo.scale(2.2, 0.4, 1.0); // long flat dart, nose toward +X
  geo.computeVertexNormals();
  const col = new Float32Array(geo.attributes.position.count * 3).fill(1);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function bakeWingGeometry() {
  const r = CONFIG.wasp.radius;
  const geo = new THREE.BoxGeometry(r * 1.1, r * 0.18, r * 4.9, 1, 1, 1); // wide thin wing plate
  geo.computeVertexNormals();
  return geo;
}

function bakeNoseGeometry() {
  const r = CONFIG.wasp.radius;
  const geo = new THREE.SphereGeometry(r * 0.36, 8, 6);
  geo.computeVertexNormals();
  return geo;
}

const NOSE_RED = { r: 1.0, g: 0.29, b: 0.16 }; // threat-red 0xff4a2a (approx linear base)

export function createWaspRenderer(scene) {
  const POOL = CONFIG.wasp.maxConcurrent + 4; // cap 6 + 4 split-child headroom
  let hullGeo = bakeHullGeometry(); // reassigned by useGLB when the wasp GLB resolves
  let wingGeo = bakeWingGeometry();
  let noseGeo = bakeNoseGeometry();
  const hullColor = new THREE.Color(CONFIG.wasp.palette.body.color).multiplyScalar(CONFIG.wasp.renderLumaGain); // I480 rendered-luma audit: WASP 176 (top rung)
  const hullMat = new THREE.MeshStandardMaterial({
    color: hullColor, roughness: 0.55, metalness: 0.2, flatShading: true, vertexColors: true,
    emissive: 0x2a2c10, emissiveIntensity: 0.25,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: CONFIG.wasp.palette.wing.color, roughness: 0.7, metalness: 0.15, flatShading: true,
  });
  const noseMats = [];
  for (let i = 0; i < POOL; i++) {
    noseMats.push(new THREE.MeshStandardMaterial({
      color: 0x140604, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(NOSE_RED.r, NOSE_RED.g, NOSE_RED.b), emissiveIntensity: 0.4,
    }));
  }
  const r = CONFIG.wasp.radius;
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(hullGeo, hullMat);
    const wing = new THREE.Mesh(wingGeo, wingMat); wing.position.x = -r * 0.45;
    const nose = new THREE.Mesh(noseGeo, noseMats[i]); nose.position.x = r * 2.4;
    g.add(hull); g.add(wing); g.add(nose);
    g.visible = false;
    scene.add(g);
    pool.push(g);
  }

  /** sync(waspField, t, motionOff): place the pool; nose glow ramps with state. */
  function sync(field, t, motionOff) {
    let i = 0;
    for (const w of field.wasps) {
      if (w.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(w.pos.x, 0.5, w.pos.y);
      const dx = w.vel ? w.vel.x : 0, dy = w.vel ? w.vel.y : 0;
      const len = Math.hypot(dx, dy);
      if (len > 1e-6) g.rotation.y = Math.atan2(-(dy / len), dx / len);
      const mat = noseMats[i];
      let k;
      if (w.state === 'corkscrew') k = Math.min(1, w.t / (w.corkscrewDur || 1));
      else if (w.state === 'dash') k = 1;
      else k = 0;
      mat.emissive.setRGB(NOSE_RED.r, NOSE_RED.g + (1 - NOSE_RED.g) * k, NOSE_RED.b + (1 - NOSE_RED.b) * k);
      mat.emissiveIntensity = 0.4 + 1.0 * k + (w.state === 'dash' ? 0.2 : 0); // dash peak 1.6 clears the 0.72 bloom threshold
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  // I460/ST-429 A2: hull silhouette rim (shared pattern; per-role color in CONFIG.enemyRim).
  applyEnemyRim(hullMat, 'wasp');

  function useGLB(obj) {
    let hull = null, wing = null, nose = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/nose|dash/i.test(n)) { if (!nose) nose = o; }
      else if (/wing/i.test(n)) { if (!wing) wing = o; }
      else if (!hull) hull = o;
    });
    if (!hull) obj.traverse((o) => { if (!hull && o.isMesh && o !== nose && o !== wing) hull = o; });
    if (hull) {
      if (!hull.geometry.hasAttribute('color')) {
        const col = new Float32Array(hull.geometry.attributes.position.count * 3).fill(1);
        hull.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      hullGeo = hull.geometry; for (const g of pool) { const m = g.children[0]; if (m) m.geometry = hullGeo; }
    }
    if (wing) { wingGeo = wing.geometry; for (const g of pool) { const m = g.children[1]; if (m) m.geometry = wingGeo; } }
    if (nose) { noseGeo = nose.geometry; for (const g of pool) { const m = g.children[2]; if (m) m.geometry = noseGeo; } }
  }

  return { sync, pool, useGLB };
}
