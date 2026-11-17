// ST-055: Monolith boss rendering - obelisk with flared crown + recessed core seam (not pooled).
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
import { teleProgress, teleUrgency } from '../core/bossTelegraph.js';

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
  const FLASH_WHITE = new THREE.Color(1, 1, 1); // ST-385/E51: hit-flash lerp target (white, not a hue)

  // ST-290 (I311): attack telegraph - anticipation reads for the boss volleys (sweep ground
  // truth: anticipation IS the player s reaction window). Two scene-level rings (shared unit
  // geometry, per-mesh material - the shockwave pooling pattern) plus a core-seam pulse that
  // rides on coreMat inside sync(). Kept OUT of `group` on purpose: the entrance scale shrinks
  // the obelisk, never the warning, and the rings sit on the arena floor (shockwave height),
  // not at the obelisk center. Threat red = the enemy-bullet emissive family (ST-248): no new
  // palette hue; opacities capped sub-bloom (183.6 band, R-E29-3). Hidden unless sync() is fed
  // a live window (fx off / MENU / no boss / not this variant = never visible - R-E29-1).
  const teleGeo = new THREE.RingGeometry(0.94, 1.0, 48);
  teleGeo.rotateX(-Math.PI / 2); // flat in XZ (arena plane), facing up (shockwave pattern)
  const teleBase = new THREE.Color(CONFIG.fx.enemyBullet.emissive); // threat red (0xff4a2a family)
  const teleMat0 = new THREE.MeshBasicMaterial({ color: teleBase, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const teleMat1 = teleMat0.clone();
  const teleHeight = (CONFIG.fx.shockwave && Number.isFinite(CONFIG.fx.shockwave.height)) ? CONFIG.fx.shockwave.height : 0.35;
  const ringWarn = { mesh: new THREE.Mesh(teleGeo, teleMat0), on: false };   // (a) rock-ring warning (expanding)
  const ringFlash = { mesh: new THREE.Mesh(teleGeo, teleMat1), on: false };  // (b) radial-burst pre-flash (fixed radius)
  for (const r of [ringWarn, ringFlash]) { r.mesh.visible = false; r.mesh.frustumCulled = false; r.mesh.position.y = teleHeight; scene.add(r.mesh); }
  const teleRed = new THREE.Color(teleBase); // shared lerp target (no per-frame alloc)

  // ST-456 (E64): the campaign weak point - a small emissive orb riding in front of the body
  // (the only place bullets land). Cyan while it telegraphs, white-hot while open, faint while
  // closed (armored). A child of the group so the entrance scale births it with the body;
  // hidden entirely for the endless path (non-campaign bosses never set isCampaignBoss).
  const weakGeo = new THREE.SphereGeometry(0.55, 20, 14);
  const weakMat = new THREE.MeshStandardMaterial({
    color: 0x0b2530, roughness: 0.25, metalness: 0.3,
    emissive: 0x66ffee, emissiveIntensity: 0.2,
  });
  const weakMesh = new THREE.Mesh(weakGeo, weakMat);
  weakMesh.visible = false;
  weakMesh.frustumCulled = false;
  group.add(weakMesh);

  // ST-252 (I263): silhouette rim on hull + crown - the obelisk's edges separate from the warm
  // E18 world at distance. Data-driven in CONFIG.boss.rim. rim.color is a shared Color instance
  // (auto-pushed by the uniform); rim.push() mirrors the per-frame strength once the program has
  // compiled. The core seam carries NO rim - its pulsing emissive IS the distance read.
  // I272 (ST-259) ROOT-CAUSE FIX for the (0,0,0,0) boss silhouette hole: the I263 fragment
  // injection ended its first concat segment with a // comment and NO trailing newline, so the
  // comment swallowed the rest of the one-line concatenation - the rim add-term AND the
  // trailing #include <opaque_fragment>, which is the ONLY place the standard fragment assigns
  // gl_FragColor. The hull/crown programs therefore compiled cleanly but never wrote the
  // fragment output, and the GPU emitted the undefined (0,0,0,0) pixels where the obelisk
  // stands. The rim is now fragment-only: the standard vertex already sets
  // vViewPosition = -mvPosition.xyz (so the custom rim varying + vertex injection were dropped
  // as redundant), and every statement sits on its own line so three's resolveIncludes (regex
  // ^[ 	]*#include) still expands the trailing include. The asteroid rim (I257) already had
  // this safe line structure - which is why rocks always rendered fine.
   // I278 SIGN FIX: vViewPosition (fragment->camera) so (1 - NdotV) is the real fresnel (the old -sign 
   // forced f=1 on every front pixel = a flat coat; the power knob was inert since I60).
  const rimState = (strength) => ({ color: new THREE.Color(CONFIG.boss.rim.color), strength, push: null });
  const rimHull = rimState(CONFIG.boss.rim.hull);
  const rimCrown = rimState(CONFIG.boss.rim.crown);
  const addRim = (mat, rim) => {
    let u = null;
    mat.onBeforeCompile = (shader) => {
      u = shader.uniforms;
      shader.uniforms.uRimColor = { value: rim.color };
      shader.uniforms.uRimStrength = { value: rim.strength };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimStrength;')
        .replace('#include <opaque_fragment>',
          'float vRimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), ' + CONFIG.boss.rim.power.toFixed(2) + '); // I278 (ST-264): power data-driven + SIGN FIX (was -vViewPosition => f=1 flat coat since I60, power knob inert; vViewPosition = true edge fresnel)\n' +
          'outgoingLight += uRimColor * (vRimF * uRimStrength);\n' +
          '#include <opaque_fragment>');
    };
    rim.push = (s) => { if (u) u.uRimStrength.value = s; };
  };
  addRim(hullMat, rimHull);
  addRim(crownMat, rimCrown);
  group.visible = false;
  scene.add(group);

  /** sync(boss, t, ringT, aimT, burstT): place the obelisk, pulse the glow, show the phase-2 core state,
   * and (ST-290) the attack telegraphs. ringT/aimT/burstT are the live game-time attack timers
   * (seconds to fire) fed by main.js; -1 = no window (fx off / not this variant / entrance). */
  function sync(boss, t, ringT = -1, aimT = -1, burstT = -1) {
    if (!boss || !boss.alive) { group.visible = false; group.scale.setScalar(1); return; }
    const isSplicer = boss.kind === 'splicer'; // ST-143: variant 2 - teal identity
    const isPrime = boss.prime === true; // ST-420: Monolith Prime (kind stays 'monolith'; gold identity)
    const r = isSplicer ? CONFIG.splicer.radius : CONFIG.boss.radius;
    const sizeScale = r / CONFIG.boss.radius; // geometry is baked at the Monolith radius
    group.position.set(boss.pos.x, r * 1.3 + 0.3, boss.pos.y);
    group.rotation.y = boss.rot;
    const phase2 = boss.phase === 2; // ST-240: first visual phase-2 state
    const bodyPulse = isSplicer
      ? 0.30 + 0.30 * (0.5 + 0.5 * Math.sin(t * 4.2))
      : phase2 ? 0.30 + 0.20 * (0.5 + 0.5 * Math.sin(t * 5.6)) : 0.18 + 0.18 * (0.5 + 0.5 * Math.sin(t * 2.4));
    const bodyHex = isPrime ? 0xd9a441 : isSplicer ? 0x2dd4bf : phase2 ? 0xb44dff : 0x7a4dff; // ST-420: prime gold; ST-143: teal vs Monolith purple
    hullMat.emissive.setHex(bodyHex);
    hullMat.emissiveIntensity = bodyPulse;
    crownMat.emissive.setHex(bodyHex);
    crownMat.emissiveIntensity = bodyPulse * 0.9; // the cap carries a touch less
    const k = boss.hitFlash || 0; // ST-385/E51: white hit-flash (sim scalar; 0 at rest)
    if (k > 0) {
      const sfx = CONFIG.fx.enemyHitFlash.spike;
      hullMat.emissive.lerp(FLASH_WHITE, k);
      hullMat.emissiveIntensity += sfx * k;
      crownMat.emissive.lerp(FLASH_WHITE, k);
      crownMat.emissiveIntensity += sfx * k;
    }
    coreMat.emissive.setHex(isPrime ? (phase2 ? 0xffe9a8 : 0xffc94d) : isSplicer ? (phase2 ? 0x7dffea : 0x19e8cf) : (phase2 ? 0xff4d6d : 0x9a6bff));
    coreMat.emissiveIntensity = phase2
      ? 1.7 + 0.8 * (0.5 + 0.5 * Math.sin(t * 7.2)) // phase 2: the seam blazes (bloom-threshold cross)
      : 0.85 + 0.45 * (0.5 + 0.5 * Math.sin(t * (isSplicer ? 4.2 : 2.4)));
    // ST-252: rim follows the variant identity (Monolith purple / Splicer teal) with a phase-2 lift.
    const rimHex = isPrime ? CONFIG.stages.monolithPrime.rim : isSplicer ? CONFIG.boss.rim.splicerColor : CONFIG.boss.rim.color; // ST-420: prime gold rim
    const rimLift = phase2 ? CONFIG.boss.rim.phase2Lift : 1;
    rimHull.color.setHex(rimHex);
    rimCrown.color.setHex(rimHex);
    rimHull.push(CONFIG.boss.rim.hull * rimLift);
    rimCrown.push(CONFIG.boss.rim.crown * rimLift);

    // ST-290 (I311): telegraph - map the public game-time timers to anticipation progress
    // (core/bossTelegraph.js). The pulse rides on the core seam the body already drives:
    // setHex above resets the color each frame, so the red lean below cannot bleed.
    const tg = CONFIG.boss.telegraph;
    let corePulse = 0;
    let redMix = 0;
    const aimP = tg ? teleProgress(aimT, tg.aimed.window) : 0; // both variants aim (Monolith + Splicer)
    if (aimP > 0) {
      corePulse = Math.max(corePulse, aimP * aimP * tg.aimed.coreBoost); // sharp: squared ramp into the fire
      redMix = Math.max(redMix, aimP * aimP * (tg.aimed.redLean || 0));   // threat-red lean (color-coded sweep)
    }
    let burstP = 0;
    if (tg && boss.kind === "monolith" && !boss.isCampaignBoss) burstP = teleProgress(burstT, tg.burst.window); // ST-456: the campaign boss rings rocks, never radial bolts
    if (burstP > 0) corePulse = Math.max(corePulse, burstP * tg.burst.coreBoost); // long: linear over the wider window
    coreMat.emissiveIntensity += corePulse;
    if (redMix > 0) coreMat.emissive.lerp(teleRed, redMix);
    // (a) rock-ring telegraph: expanding warning ring, radius boss.radius -> maxRadius, urgency-eased.
    const ringP = (tg && (boss.kind === "monolith" || boss.isCampaignBoss)) ? teleProgress(ringT, tg.ring.window) : 0; // ST-456: the campaign boss telegraphs its rock ring too
    if (ringP > 0) {
      const grow = teleUrgency(ringP, 1.6); // slow start, accelerates into the burst
      const rad = boss.radius + (tg.ring.maxRadius - boss.radius) * grow;
      ringWarn.mesh.visible = true; ringWarn.on = true;
      ringWarn.mesh.position.set(boss.pos.x, teleHeight, boss.pos.y);
      ringWarn.mesh.scale.setScalar(Math.max(0.001, rad));
      teleMat0.opacity = tg.ring.opacity * Math.min(1, ringP * 3); // quick fade-in, holds to the fire
    } else if (ringWarn.on) { ringWarn.mesh.visible = false; teleMat0.opacity = 0; ringWarn.on = false; }
    // (b) radial-burst pre-flash: fixed outer ring, linear rise over the longer window (cadence distinct from (a)).
    if (burstP > 0) {
      ringFlash.mesh.visible = true; ringFlash.on = true;
      ringFlash.mesh.position.set(boss.pos.x, teleHeight, boss.pos.y);
      ringFlash.mesh.scale.setScalar(tg.burst.ringRadius);
      teleMat1.opacity = tg.burst.opacity * burstP;
    } else if (ringFlash.on) { ringFlash.mesh.visible = false; teleMat1.opacity = 0; ringFlash.on = false; }
    const sIn = Math.max(0.001, (1 - Math.pow(1 - boss.entered, 3)));
    const posture = boss.isCampaignBoss ? (boss.postureScale || 1) : 1; // ST-456: per-phase posture change
    const gs = sIn * sizeScale * posture;
    // ST-456 (E64): weak orb placement - local offset divided by the live group scale so the orb
    // sits at its true world offset (front of the body, orbit radius); fades in with the entrance.
    if (boss.isCampaignBoss && boss.entered > 0.5) {
      const wp = boss.weak;
      weakMesh.visible = true;
      weakMesh.position.set((wp.x - boss.pos.x) / gs, 0.15, (wp.y - boss.pos.y) / gs);
      weakMat.emissive.setHex(wp.open ? 0xffffff : 0x66ffee);
      weakMat.emissiveIntensity = wp.open
        ? 2.0 + 0.6 * (0.5 + 0.5 * Math.sin(t * 6.0)) // white-hot pulse while vulnerable
        : (wp.state === 'tele') ? 0.3 + 1.6 * wp.tele : 0.18; // rising cyan telegraph / faint closed
    } else {
      weakMesh.visible = false;
    }
    group.scale.setScalar(gs); // ST-135/143: entrance + variant size; ST-456: campaign posture
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

  return { sync, mesh: group, useGLB, telestate: () => ({ // ST-290: probe (on-demand alloc, __vr precedent)
    ringV: ringWarn.mesh.visible, ringS: ringWarn.mesh.scale.x, ringO: teleMat0.opacity, coreI: coreMat.emissiveIntensity, coreHex: coreMat.emissive.getHexString(),
    flashV: ringFlash.mesh.visible, flashS: ringFlash.mesh.scale.x, flashO: teleMat1.opacity,
  }) };
}
