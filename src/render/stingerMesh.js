// ST-229: STINGER charger rendering - pooled dart bodies with a SEPARATE emissive
// core per pool entry (the telegraph glow ramps cyan -> white and is
// FX-tier-independent by design: readability, not decoration). The telegraph
// wobble is a render-only visual offset and is reduced-motion gated.
// Procedural fallback (dart + core); the Blender GLB lands in ST-230 via useGLB
// (VR_Stinger_Body / VR_Stinger_Core node names, in-code materials kept).
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

function bakeBodyGeometry() {
  // needle dart: octahedron stretched hard along +X (forward)
  const geo = new THREE.OctahedronGeometry(CONFIG.stinger.radius, 0);
  geo.scale(2.3, 0.55, 0.55);
  geo.computeVertexNormals();
  const col = new Float32Array(geo.attributes.position.count * 3).fill(1); // I282/ST-267: white value identity (the body material now uses vertexColors; the GLB COLOR_0 bake multiplies on top)
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function bakeCoreGeometry() {
  const geo = new THREE.OctahedronGeometry(CONFIG.stinger.radius * 0.42, 0);
  geo.scale(1.9, 1.2, 1.2); // hot capsule along the dart axis
  geo.computeVertexNormals();
  return geo;
}

// cyan idle (matches the drone family) lerped toward white in sync()
const CORE_IDLE = { r: 0.216, g: 0.835, b: 1.0 };

export function createStingerRenderer(scene) {
  const POOL = CONFIG.stinger.maxConcurrent + 2; // cap 2 + 2 spare
  let bodyGeo = bakeBodyGeometry(); // I230: reassigned by useGLB when the stinger GLB resolves
  let coreGeo = bakeCoreGeometry();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: CONFIG.stinger.palette.body.color, roughness: 0.5, metalness: 0.5, flatShading: true, vertexColors: true, // I282/ST-267: deep-violet mid (was 0x2b2136 dark-on-dark) + the GLB COLOR_0 value bake
    emissive: 0x3c1f5c, emissiveIntensity: 0.35,
  });
  const coreMats = [];
  for (let i = 0; i < POOL; i++) {
    coreMats.push(new THREE.MeshStandardMaterial({
      color: 0x0a0f18, roughness: 0.3, metalness: 0.2,
      emissive: new THREE.Color(CORE_IDLE.r, CORE_IDLE.g, CORE_IDLE.b), emissiveIntensity: 0.5,
    }));
  }
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    const core = new THREE.Mesh(coreGeo, coreMats[i]);
    g.add(body);
    g.add(core);
    g.visible = false;
    scene.add(g);
    pool.push(g);
  }

  /** sync(stingerField, t, motionOff): place the pool; glow ramps with the state. */
  function sync(field, t, motionOff) {
    const cfg = CONFIG.stinger;
    let i = 0;
    for (const s of field.stingers) {
      if (s.dead || i >= POOL) continue;
      const g = pool[i];
      // telegraph wobble: render-only, motion-gated (the core sim stays still)
      let wx = 0, wz = 0;
      if (s.state === 'telegraph' && !motionOff) {
        wx = Math.sin(t * 26 + s.wobblePhase) * 0.14;
        wz = Math.cos(t * 23 + s.wobblePhase) * 0.1;
      }
      g.position.set(s.pos.x + wx, 0.6, s.pos.y + wz);
      // heading: face the aim during telegraph, the velocity otherwise
      let dx = s.vel ? s.vel.x : 0, dy = s.vel ? s.vel.y : 0;
      if (s.state === 'telegraph') { dx = s.aimDir ? s.aimDir.x : 0; dy = s.aimDir ? s.aimDir.y : 0; }
      const len = Math.hypot(dx, dy);
      if (len > 1e-6) g.rotation.y = Math.atan2(-(dy / len), dx / len);
      // core glow: cruise idle -> telegraph cyan->white ramp -> charge white-hot -> recover cool-down
      const mat = coreMats[i];
      let k;
      if (s.state === 'telegraph') k = Math.min(1, s.t / cfg.telegraph);
      else if (s.state === 'charge') k = 1;
      else if (s.state === 'recover') k = Math.max(0, 1 - s.t / cfg.recover) * 0.35;
      else k = 0;
      mat.emissive.setRGB(CORE_IDLE.r + (1 - CORE_IDLE.r) * k, CORE_IDLE.g + (1 - CORE_IDLE.g) * k, CORE_IDLE.b);
      mat.emissiveIntensity = 0.5 + 2.4 * k; // white-hot charge clears the 0.72 bloom threshold
      // I383/E43 G1: the GLB core is modeled origin-centered (buried in the body) - offset it
      // along the dart axis so the white-hot tip pokes out; the scale pulses with the charge ramp.
      const core = g.children[1];
      core.position.x = cfg.coreOffset;
      core.scale.setScalar(1 + (cfg.coreChargeScale - 1) * k);
      g.visible = true;
      i++;
    }
    for (; i < POOL; i++) pool[i].visible = false;
  }

  // ST-230 hook: swap the dart geometry to the Blender stinger GLB. Matches the
  // VR_Stinger_Core node for the glow (falls back to the second mesh); every other
  // mesh feeds the body. In-code materials are kept (same pattern as wardenMesh, I220).
  function useGLB(obj) {
    let body = null, core = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || '';
      if (/core/i.test(n)) { if (!core) core = o; }
      else if (!body) body = o;
    });
    if (!body) obj.traverse((o) => { if (!body && o.isMesh && o !== core) body = o; });
    if (body) {
      if (!body.geometry.hasAttribute('color')) { // I282/ST-267: materials use vertexColors; keep a GLB without COLOR_0 safe (white identity)
        const col = new Float32Array(body.geometry.attributes.position.count * 3).fill(1);
        body.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      bodyGeo = body.geometry; for (const g of pool) { const m = g.children[0]; if (m) m.geometry = bodyGeo; }
    }
    if (core) { coreGeo = core.geometry; for (let i = 0; i < POOL; i++) { const m = pool[i].children[1]; if (m) m.geometry = coreGeo; } }
  }

  return { sync, pool, useGLB };
}