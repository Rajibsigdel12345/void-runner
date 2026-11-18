// ST-232: FLYER evasive enemy rendering - a pooled elongated hexa-disc saucer
// with a separate emissive dome (magenta idle; a hit flashes the dome white
// through the 0.72 bloom threshold and decays - the 1-of-2-hp state reads at
// a glance). The weave is simulated in the core (it is the enemy's identity,
// not decoration), so the pool just places and orients; the slow idle yaw
// bob is the only render-only motion and is reduced-motion gated.
// Procedural fallback (hexa-disc + dome); the Blender GLB lands in ST-234 via
// useGLB (VR_Flyer_Body naming; a /dome|core/i node takes the emissive slot).
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { applyEnemyRim } from './enemyRim.js'; // I460/ST-429 A2: shared fresnel silhouette rim
import { standardMat } from './fxArm.js'; // I497 (ST-463): node material on the webgpu arm

function bakeHullGeometry() {
  // elongated hexa-disc: 6-segment cylinder flattened, stretched along +X (forward)
  const geo = new THREE.CylinderGeometry(CONFIG.flyer.radius, CONFIG.flyer.radius * 1.15, CONFIG.flyer.radius * 0.55, 6, 1);
  geo.scale(1.45, 1, 1);
  geo.computeVertexNormals();
  const col = new Float32Array(geo.attributes.position.count * 3).fill(1); // I282/ST-267: white value identity (the hull material now uses vertexColors; the GLB COLOR_0 bake multiplies on top)
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function bakeDomeGeometry() {
  const geo = new THREE.SphereGeometry(CONFIG.flyer.radius * 0.5, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
  geo.scale(1.15, 0.75, 1);
  geo.computeVertexNormals();
  return geo;
}

const DOME_IDLE = { r: 1.0, g: 0.42, b: 0.86 }; // magenta (distinct from the drone cyan family)

export function createFlyerRenderer(scene) {
  const POOL = CONFIG.flyer.maxConcurrent + 2; // cap 2 + 2 spare (stinger pool pattern)
  let hullGeo = bakeHullGeometry(); // reassigned by useGLB when the flyer GLB resolves
  let domeGeo = bakeDomeGeometry();
  const hullMat = standardMat({ // I497 (ST-463)
    color: CONFIG.flyer.palette.body.color, roughness: 0.55, metalness: 0.45, flatShading: true, vertexColors: true, // I282/ST-267: mauve mid (was 0x33202e dark-on-dark) + the GLB COLOR_0 value bake
    emissive: 0x5c1f4a, emissiveIntensity: 0.3,
  });
  const domeMats = [];
  for (let i = 0; i < POOL; i++) {
    domeMats.push(new THREE.MeshStandardMaterial({
      color: 0x140a10, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(DOME_IDLE.r, DOME_IDLE.g, DOME_IDLE.b), emissiveIntensity: 0.7,
    }));
  }
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(hullGeo, hullMat);
    const dome = new THREE.Mesh(domeGeo, domeMats[i]);
    dome.position.y = CONFIG.flyer.radius * 0.28;
    g.add(hull);
    g.add(dome);
    g.visible = false;
    scene.add(g);
    pool.push(g);
  }

  /** sync(flyerField, t, motionOff): place the pool; the dome reads hitFlash. */
  function sync(field, t, motionOff) {
    let i = 0;
    for (const f of field.flyers) {
      if (f.dead || i >= POOL) continue;
      const g = pool[i];
      g.position.set(f.pos.x, 0.5, f.pos.y);
      // face the crossing direction + a slow idle yaw bob (motion-gated)
      let ry = 0;
      const len = Math.hypot(f.dir.x, f.dir.y);
      if (len > 1e-6) ry = Math.atan2(-f.dir.y, f.dir.x);
      if (!motionOff) ry += Math.sin(t * 1.7 + f.id * 1.31) * 0.12;
      g.rotation.y = ry;
      // dome glow: magenta idle; a hit flashes white-hot and decays (f.hitFlash)
      const mat = domeMats[i];
      const k = f.hitFlash;
      mat.emissive.setRGB(DOME_IDLE.r + (1 - DOME_IDLE.r) * k, DOME_IDLE.g + (1 - DOME_IDLE.g) * k, DOME_IDLE.b + (1 - DOME_IDLE.b) * k);
      mat.emissiveIntensity = 0.7 + 1.9 * k; // hit flash clears the 0.72 bloom threshold
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  // ST-234 hook: swap the saucer geometry to the Blender flyer GLB. Matches a
  // /dome|core/i node for the emissive slot (falls back to the second mesh);
  // every other mesh feeds the hull. In-code materials kept (wardenMesh, I220).
  // I460/ST-429 A2: hull silhouette rim (shared I278 pattern; per-role color in CONFIG.enemyRim).
  applyEnemyRim(hullMat, 'flyer');

  function useGLB(obj) {
    let hull = null, dome = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/dome|core/i.test(n)) { if (!dome) dome = o; }
      else if (!hull) hull = o;
    });
    if (!hull) obj.traverse((o) => { if (!hull && o.isMesh && o !== dome) hull = o; });
    if (hull) {
      if (!hull.geometry.hasAttribute('color')) { // I282/ST-267: materials use vertexColors; keep a GLB without COLOR_0 safe (white identity)
        const col = new Float32Array(hull.geometry.attributes.position.count * 3).fill(1);
        hull.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      hullGeo = hull.geometry; for (const g of pool) { const m = g.children[0]; if (m) m.geometry = hullGeo; }
    }
    if (dome) { domeGeo = dome.geometry; for (let i = 0; i < POOL; i++) { const m = pool[i].children[1]; if (m) m.geometry = domeGeo; } }
  }

  return { sync, pool, useGLB };
}
