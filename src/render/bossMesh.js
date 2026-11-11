﻿// ST-055: Monolith boss rendering - obelisk with flared crown + recessed core seam (not pooled).
// I248 (E16, ST-240): 3-node hero pass - hull/crown/core geometry comes from
// assets/boss.glb (VR_Boss_Hull / VR_Boss_Crown / VR_Boss_Core) once the asset
// loads; the procedural fallback below (jittered hex obelisk + flared cap +
// front seam slab, same rings) stays for a failed load. In-code materials are
// kept (pulsing emissive + vertexColors), so the GLB's own materials are
// ignored. First visual phase-2 state: the core seam brightens and shifts
// redder on boss.phase===2 (Splicer: hotter teal).
// I263 (E19, ST-252): silhouette rim on hull + crown (onBeforeCompile, the proven I257
// asteroid-rim pattern) - data-driven in CONFIG.boss.rim, variant-colored (Monolith purple /
// Splicer teal), phase-2 lift. The GLB now carries a stronger grayscale COLOR_0 mottling
// (hull 0.33..0.88) via the material-wired export recipe (see tests/assetGlbs.test.js).
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { CONFIG } from '../core/config.js';

function bakeWithColors(geo, colorFn) {
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const c = colorFn(v.x, v.y, v.z);
    col[i * 3] = c; col[i * 3 + 1] = c; col[i * 3 + 2] = c;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); // I210: materials use vertexColors
  return geo;
}

function hexRing(Rr, y, rng, jitter) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i / 6) * Math.PI * 2; // flat face on +Z
    let x = Rr * Math.cos(a), zz = Rr * Math.sin(a), yy = y;
    if (jitter) { x += (rng.next() - 0.5) * 0.18; zz += (rng.next() - 0.5) * 0.18; yy += (rng.next() - 0.5) * 0.12; }
    out.push([x, yy, zz]);
  }
  return out;
}

// 6-sided column between stacked rings + fan caps (outward winding, checked).
function column(rings, topY, botY) {
  const verts = [];
  rings.forEach((ring) => ring.forEach((p) => verts.push(p)));
  verts.push([0, topY, 0], [0, botY, 0]);
  const tc = rings.length * 6, bc = tc + 1;
  const idx = [];
  for (let s = 0; s < rings.length - 1; s++) {
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      const a = s * 6 + i, b = s * 6 + j, c = (s + 1) * 6 + j, d = (s + 1) * 6 + i;
      idx.push(a, c, b, a, d, c);
    }
  }
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    idx.push(tc, i, j, bc, j, i);
  }
  return { verts, idx };
}

// Fallback hull: 6-sided tapered obelisk, rings R 2.0 @ y-4.35, 1.65 @ y0, 1.15 @ y+3.30
// (the same rings the GLB is built from; jitter keeps the mottled monolith character).
function bakeHullGeometry() {
  const rng = new RNG(0x0bad); // fixed seed: same obelisk every load
  const { verts, idx } = column(
    [hexRing(2.0, -4.35, rng, true), hexRing(1.65, 0, rng, true), hexRing(1.15, 3.3, rng, true)], 3.3, -4.35);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts.flat(), 3));
  geo.setIndex(idx);
  const mottle = new RNG(0x77ad);
  return bakeWithColors(geo, (x, y, z) => {
    const t = Math.max(0, Math.min(1, (y + 4.35) / 8.65));
    return Math.max(0, Math.min(1, 0.72 + 0.28 * t + (mottle.next() - 0.5) * 0.14));
  });
}

// Fallback crown: flared 6-sided cap (R 1.15 @ 3.30 -> 1.65 @ 4.55) + central 4-sided spike to y5.0.
function bakeCrownGeometry() {
  const rng = new RNG(0x5e7e); // fixed seed: same crown every load
  const { verts, idx } = column([hexRing(1.15, 3.3, null, false), hexRing(1.65, 4.55, rng, true)], 4.55, 3.3);
  const base0 = verts.length;
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) verts.push([0.35 * Math.cos(a), 4.55, 0.35 * Math.sin(a)]);
  verts.push([0, 5.0, 0]);
  for (let i = 0; i < 4; i++) idx.push(base0 + i, base0 + (i + 1) % 4, base0 + 5);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts.flat(), 3));
  geo.setIndex(idx);
  const mottle = new RNG(0x77be);
  return bakeWithColors(geo, () => Math.max(0, Math.min(1, 0.86 + (mottle.next() - 0.5) * 0.12)));
}

// Fallback core: recessed front seam slab, an exact lerp between the GLB's two
// rings (y-3.10: x +/-0.30, z 2.43..2.73; y+2.90: x +/-0.225, z 0.997..1.80).
function bakeCoreGeometry() {
  const lerp = (y) => (y + 3.1) / 6.0; // 0 at the bottom ring, 1 at the top ring
  const hw = (y) => 0.15 + (0.1125 - 0.15) * lerp(y);
  const front = (y) => 1.495 + (0.898 - 1.495) * lerp(y);
  const back = (y) => 1.095 + (0.498 - 1.095) * lerp(y);
  const corners = (y) => {
    const w = hw(y), f = front(y), b = back(y);
    return [[-w, y, f], [w, y, f], [w, y, b], [-w, y, b]];
  };
  const verts = [...corners(-3.1), ...corners(2.9)];
  const idx = [0,4,5, 0,5,1, 2,6,3, 2,3,7, 1,5,2, 1,2,6, 3,7,0, 3,0,4, 4,5,6, 4,6,7, 0,3,2, 0,2,1];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts.flat(), 3));
  geo.setIndex(idx);
  return bakeWithColors(geo, () => 1);
}

export function createBossMesh(scene) {
  const group = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x6b5f88, roughness: 0.45, metalness: 0.4, flatShading: true,
    emissive: 0x7a4dff, emissiveIntensity: 0.25, vertexColors: true,
  });
  const hull = new THREE.Mesh(bakeHullGeometry(), hullMat);
  group.add(hull);

  const crownMat = new THREE.MeshStandardMaterial({
    color: 0x7a6f9c, roughness: 0.4, metalness: 0.5, flatShading: true,
    emissive: 0x7a4dff, emissiveIntensity: 0.18, vertexColors: true,
  });
  const crown = new THREE.Mesh(bakeCrownGeometry(), crownMat);
  group.add(crown);

  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x8f86b8, roughness: 0.3, metalness: 0.2, flatShading: true,
    emissive: 0x9a6bff, emissiveIntensity: 0.9, vertexColors: true,
  });
  const core = new THREE.Mesh(bakeCoreGeometry(), coreMat);
  group.add(core);

  // ST-252 (I263): silhouette rim on hull + crown - the obelisk's edges separate from the warm
  // E18 world at distance. Same proven onBeforeCompile pattern as the asteroid rim (I257); data
  // driven in CONFIG.boss.rim. rim.color is a shared Color instance (auto-pushed by the uniform);
  // rim.push() mirrors the per-frame strength once the program has compiled. The core seam
  // carries NO rim - its pulsing emissive IS the distance read.
  const rimState = (strength) => ({ color: new THREE.Color(CONFIG.boss.rim.color), strength, push: null });
  const rimHull = rimState(CONFIG.boss.rim.hull);
  const rimCrown = rimState(CONFIG.boss.rim.crown);
  const addRim = (mat, rim) => {
    let u = null;
    mat.onBeforeCompile = (shader) => {
      u = shader.uniforms;
      shader.uniforms.uRimColor = { value: rim.color };
      shader.uniforms.uRimStrength = { value: rim.strength };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRimViewPos;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvRimViewPos = -mvPosition.xyz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRimViewPos;\nuniform vec3 uRimColor;\nuniform float uRimStrength;')
        .replace('#include <opaque_fragment>',
          'float vRimF = pow(1.0 - clamp(dot(normalize(-vRimViewPos), normal), 0.0, 1.0), 5.0); // ST-252: silhouette-hugging power (I257)' +
          'outgoingLight += uRimColor * (vRimF * uRimStrength);' +
          '#include <opaque_fragment>');
    };
    rim.push = (s) => { if (u) u.uRimStrength.value = s; };
  };
  addRim(hullMat, rimHull);
  addRim(crownMat, rimCrown);
  group.visible = false;
  scene.add(group);

  /** sync(boss, t): place the obelisk, pulse the glow, show the phase-2 core state. */
  function sync(boss, t) {
    if (!boss || !boss.alive) { group.visible = false; group.scale.setScalar(1); return; }
    const isSplicer = boss.kind === 'splicer'; // ST-143: variant 2 - teal identity
    const r = isSplicer ? CONFIG.splicer.radius : CONFIG.boss.radius;
    const sizeScale = r / CONFIG.boss.radius; // geometry is baked at the Monolith radius
    group.position.set(boss.pos.x, r * 1.3 + 0.3, boss.pos.y);
    group.rotation.y = boss.rot;
    const phase2 = boss.phase === 2; // ST-240: first visual phase-2 state
    const bodyPulse = isSplicer
      ? 0.30 + 0.30 * (0.5 + 0.5 * Math.sin(t * 4.2))
      : phase2 ? 0.30 + 0.20 * (0.5 + 0.5 * Math.sin(t * 5.6)) : 0.18 + 0.18 * (0.5 + 0.5 * Math.sin(t * 2.4));
    const bodyHex = isSplicer ? 0x2dd4bf : phase2 ? 0xb44dff : 0x7a4dff; // ST-143: teal vs Monolith purple
    hullMat.emissive.setHex(bodyHex);
    hullMat.emissiveIntensity = bodyPulse;
    crownMat.emissive.setHex(bodyHex);
    crownMat.emissiveIntensity = bodyPulse * 0.9; // the cap carries a touch less
    coreMat.emissive.setHex(isSplicer ? (phase2 ? 0x7dffea : 0x19e8cf) : (phase2 ? 0xff4d6d : 0x9a6bff));
    coreMat.emissiveIntensity = phase2
      ? 1.7 + 0.8 * (0.5 + 0.5 * Math.sin(t * 7.2)) // phase 2: the seam blazes (bloom-threshold cross)
      : 0.85 + 0.45 * (0.5 + 0.5 * Math.sin(t * (isSplicer ? 4.2 : 2.4)));
    // ST-252: rim follows the variant identity (Monolith purple / Splicer teal) with a phase-2 lift.
    const rimHex = isSplicer ? CONFIG.boss.rim.splicerColor : CONFIG.boss.rim.color;
    const rimLift = phase2 ? CONFIG.boss.rim.phase2Lift : 1;
    rimHull.color.setHex(rimHex);
    rimCrown.color.setHex(rimHex);
    rimHull.push(CONFIG.boss.rim.hull * rimLift);
    rimCrown.push(CONFIG.boss.rim.crown * rimLift);

    group.scale.setScalar(Math.max(0.001, (1 - Math.pow(1 - boss.entered, 3))) * sizeScale); // ST-135/143: entrance + variant size
    group.visible = true;
  }

  // I248 (ST-240): useGLB(obj) - swap in the Blender hero geometry. Three meshes
  // by node name: VR_Boss_Hull -> hull, VR_Boss_Crown -> crown, VR_Boss_Core ->
  // core seam (the existing sync() drives all three unchanged). In-code materials
  // are kept, so the GLB's own materials are ignored.
  function useGLB(obj) {
    if (!obj) return;
    let hullG = null, crownG = null, coreG = null;
    obj.traverse((n) => {
      if (!n.isMesh) return;
      const nm = n.name || '';
      if (nm.indexOf('Crown') >= 0 && !crownG) crownG = n.geometry;
      else if (nm.indexOf('Core') >= 0 && !coreG) coreG = n.geometry;
      else if (!hullG) hullG = n.geometry;
    });
    for (const [m, g] of [[hull, hullG], [crown, crownG], [core, coreG]]) {
      if (!g) continue;
      if (!g.hasAttribute('color')) { // materials use vertexColors; keep GLB without COLOR_0 safe
        const col = new Float32Array(g.attributes.position.count * 3).fill(1);
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      m.geometry = g;
    }
  }

  return { sync, mesh: group, useGLB };
}
