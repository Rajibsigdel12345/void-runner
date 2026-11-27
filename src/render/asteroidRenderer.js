// Void Runner - asteroid rendering (ST-010). Shared noise-baked geo, pooled meshes, no per-frame allocs.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { CONFIG } from '../core/config.js';
import { standardMat, isWebGPU } from './fxArm.js'; // I497 (ST-463): node material + arm query (webgpu-only branches)
import { applyTSLRim } from './tslMaterials.js'; // I497 (ST-463): node rim (webgpu arm only)

function bakeVariant(seed, radius) {
  const rng = new RNG(seed);
  const geo = new THREE.IcosahedronGeometry(radius, 1);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(1 + rng.range(-0.22, 0.3)); // irregular craggy silhouette
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  // I209: white vertex-color identity - the shared rock materials now use
  // vertexColors, so procedural fallback geos must carry the attribute too.
  const col = new Float32Array(pos.count * 3).fill(1);
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

export function createAsteroidRenderer(scene) {
  const max = CONFIG.asteroid.maxConcurrent + CONFIG.belt.max; // ST-139: pool also covers persistent belt rocks
  const sizes = ['L', 'M', 'S'];
  const geos = {};
  for (const s of sizes) {
    geos[s] = [
      bakeVariant(101 + sizes.indexOf(s), CONFIG.asteroid.sizes[s].radius),
      bakeVariant(211 + sizes.indexOf(s), CONFIG.asteroid.sizes[s].radius),
      bakeVariant(321 + sizes.indexOf(s), CONFIG.asteroid.sizes[s].radius),
    ];
  }
  // I104: GLB geometries (Blender pass) swap in as they load; until then the
  // procedural 3-variant bakes are used. I420 (ST-390 E52): per-VARIANT arrays
  // (index = rock variant % variantCount) so the GLB path keeps A/B silhouette
  // variety instead of collapsing to one shape per size.
  const glbGeo = {};
  let glbShellGeo = false; // I210: shield GLB loaded flag
  let glbComet = false; // I344 (ST-316): comet variant GLB loaded flag
  const mat = standardMat({ color: 0x8a7f72, roughness: 0.95, metalness: 0.05, flatShading: true, vertexColors: true }); // I209: GLB-baked shading (I497: node material on the webgpu arm)
  // ST-139: belt rock - dark cold metal so drifting indestructibles read as "unbreakable".
  const matBelt = new THREE.MeshStandardMaterial({ color: 0x2a313d, roughness: 0.42, metalness: 0.9, flatShading: true, emissive: 0x2f6fd0, emissiveIntensity: 0.6, vertexColors: true }); // I209: vertexColors
  // I60: rim-lit upgrade - fresnel edge added on top of the standard lighting.
  // I257: the periwinkle incident (ST-247) WAS the cool rim term itself: even desaturated
  // 0x8fa8d8 @ 0.22 coated whole low-poly rocks blue (A/B: rim-on R112/G111/B133 vs rim-off
  // R79/G55/B37 - the rim was the ENTIRE cool cast; lights/env were innocent). A WARM rim
  // (0xd8a878 @ 0.12, ^5 silhouette falloff) keeps the edge accent, harmonizes with the warm
  // rock palette, and lifts rock-vs-nebula contrast (face luma ~57 no-rim -> ~96).
  let rimU = null; // I278 (ST-264): live uniform handle (set at first compile) - the setRim probe/A-B hook
  let setRimTsl = null; // I497 (ST-463): TSL rim strength setter (webgpu arm only)
  if (isWebGPU()) {
    const tslRim = applyTSLRim(mat, { color: new THREE.Color(CONFIG.asteroid.rim.color), strength: CONFIG.asteroid.rim.strength, power: CONFIG.asteroid.rim.power }); // I497 (ST-463)
    setRimTsl = (s) => { if (typeof s === 'number' && isFinite(s)) tslRim.setStrength(s); };
  } else {
  mat.onBeforeCompile = (shader) => {
    rimU = shader.uniforms;
    shader.uniforms.uRimColor = { value: new THREE.Color(CONFIG.asteroid.rim.color) }; // I257 final warm edge (I278: data-driven in CONFIG, value FROZEN)
    shader.uniforms.uRimStrength = { value: CONFIG.asteroid.rim.strength }; // I257 final (I278: data-driven in CONFIG, value FROZEN)
    // I278 (ST-264): FRAGMENT-ONLY rim (the I272 boss pattern) - the standard vertex already sets
    // vViewPosition = -mvPosition.xyz, so the old custom rim varying + the #include <project_vertex>
    // vertex injection are dropped. Every statement sits on its own line and the trailing #include
    // line-starts its own segment (the I263 comment-swallow regression family; pinned by tests).
     // I278 SIGN FIX: vViewPosition (fragment->camera), so (1 - NdotV) is the real fresnel edge falloff
     // (the old -sign forced f=1 on every front pixel = a flat coat; the power knob was inert since I60).
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimStrength;')
      .replace('#include <opaque_fragment>',
        'float vRimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), ' + CONFIG.asteroid.rim.power.toFixed(2) + '); // I278 (ST-264): power data-driven + SIGN FIX (was -vViewPosition => f=1 flat coat since I60, power knob inert; vViewPosition = true edge fresnel)\n' +
        'outgoingLight += uRimColor * (vRimF * uRimStrength);\n' +
        '#include <opaque_fragment>');
  };
  // I278 (ST-264): probe/A-B hook - live-set the rock rim strength (rim-off A/B per the I257 precedent);
  // no-op until the material has compiled. Belt/gold materials never had a rim (unchanged).
  } // I497 (ST-463): end else (classic onBeforeCompile rim inside)
  function setRim(s) { if (setRimTsl) setRimTsl(s); else if (rimU && typeof s === 'number' && isFinite(s)) rimU.uRimStrength.value = s; } // I497 (ST-463)
  // ST-052: golden rock - bright emissive so bloom (High FX) makes it glow.
  const matGold = new THREE.MeshStandardMaterial({ color: 0xffc94d, emissive: 0xffa018, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.55, flatShading: true, vertexColors: true }); // I209: vertexColors
  // I640 (ST-598): amber straggler beacon - while the wave hold runs (WaveDirector.hold) the surviving
  // normal rocks pulse amber so the clear-in-progress reads at a glance. Plain standard material (no
  // onBeforeCompile rim): same program family as mat/matBelt/matGold -> +0 programs, +0 draw calls
  // (material swap on the pooled meshes). Priority belt > golden > straggler > normal (below).
  const matStraggler = new THREE.MeshStandardMaterial({ color: 0x9a7a4a, roughness: 0.9, metalness: 0.1, flatShading: true, emissive: 0xffa018, emissiveIntensity: 0.5, vertexColors: true });
  let stragglerBeaconOn = false;
  function setStragglerBeacon(on) { stragglerBeaconOn = on === true; } // I640 (ST-598): driven by main.js from WaveDirector.hold
  // ST-127: shielded rock - additive energy shell rendered as a CHILD of the rock mesh (hidden by
  // default; the rock's visible=false hides it with the parent). Three shared materials keyed by
  // armor level: the shell DIMS on every absorbed hit so the player can read hits-left at a glance.
  let shellGeo = new THREE.IcosahedronGeometry(1, 1); // I210: setShieldGLB swaps in the Blender armor plates
  const shellMats = [
    new THREE.MeshBasicMaterial({ color: 0x7fe0ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }), // armor 1: faint
    new THREE.MeshBasicMaterial({ color: 0x66d9ff, transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false }), // armor 2
    new THREE.MeshBasicMaterial({ color: 0x8ff2ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })  // armor 3: bright
  ];
  // I155: shape cues (colorblind-friendly) - golden rocks get a low-poly wireframe cage so
  // the high-value target keeps a distinct silhouette independent of its gold color.
  // Shared geo + material; a child of every pool mesh, visible only for golden rocks when enabled.
  let shapeCuesOn = true;
  const cageGeo = new THREE.IcosahedronGeometry(1, 0);
  const cageMat = new THREE.MeshBasicMaterial({ color: 0xffd24d, wireframe: true, transparent: true, opacity: 0.85, depthWrite: false });
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geos.L[0], mat);
    const shell = new THREE.Mesh(shellGeo, shellMats[2]); // ST-127 (unit sphere; scaled per rock in sync)
    shell.visible = false;
    m.add(shell);
    const cage = new THREE.Mesh(cageGeo, cageMat); // I155: golden-rock silhouette cue
    cage.visible = false;
    m.add(cage);
    m.visible = false;
    scene.add(m);
    pool.push(m);
  }

  function sync(field, t = 0) {
    matBelt.emissiveIntensity = 0.4 + 0.45 * (0.5 + 0.5 * Math.sin((t || 0) * 1.8)); // ST-139: slow cold hum (0.4..0.85)
    matStraggler.emissiveIntensity = 0.4 + 0.45 * (0.5 + 0.5 * Math.sin((t || 0) * 1.8)); // I640 (ST-598): same slow amber hum (0.4..0.85) as the belt
    let i = 0;
    for (const r of field.rocks) {
      if (r.dead || i >= max) continue;
      const m = pool[i++];
      m.geometry = (r.size === 'S' && r.variant === 2 && glbComet) ? glbComet : ((glbGeo[r.size] && glbGeo[r.size][r.variant % glbGeo[r.size].length]) || geos[r.size][r.variant]); // I104 GLB when loaded; I344 (ST-316) comet on S slot 2; I420 (ST-390 E52) per-variant A/B by r.variant%len (comet ternary first; || fallback for load-order holes)
      m.material = r.belt ? matBelt : (r.golden ? matGold : (stragglerBeaconOn ? matStraggler : mat)); // ST-052/ST-139; I640 (ST-598): priority belt > golden > straggler > normal
      const shell = m.children[0]; // ST-127: shield shell tracks armor (dim = 1 hit away)
      if (r.shielded) {
        shell.material = shellMats[Math.max(0, Math.min(2, r.armor - 1))]; // armor 3/2/1 -> bright/mid/faint
        shell.scale.setScalar(r.radius * 1.3);
        shell.visible = true;
      } else {
        shell.visible = false;
      }
      const cage = m.children[1]; // I155: children[0] is the shield shell
      cage.visible = shapeCuesOn && !!r.golden && !r.belt;
      cage.scale.setScalar(r.radius * 1.5);
      m.position.set(r.pos.x, 0.4, r.pos.y);
      m.rotation.set(r.rot * 0.7, r.rot, r.rot * 0.31);
      m.visible = true;
    }
    for (; i < max; i++) pool[i].visible = false;
  }

  // I104: setGLB(size, obj, variant) - extract the first mesh geometry from a
  // loaded GLB and store it PER-VARIANT (variant 0 = primary A, variant 1 =
  // silhouette-variant B, I420 ST-390 E52). sync() picks by r.variant%len.
  function setGLB(size, obj, variant) {
    if (!obj || !size) return;
    const v = (typeof variant === 'number' && variant >= 0) ? variant : 0;
    if (!glbGeo[size]) glbGeo[size] = [];
    if (glbGeo[size][v]) return;
    let g = null;
    obj.traverse((n) => { if (n.isMesh && !g) g = n.geometry; });
    if (g) {
      if (!g.hasAttribute("color")) { // I209: materials use vertexColors; keep GLBs without COLOR_0 safe
        const col = new Float32Array(g.attributes.position.count * 3).fill(1);
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      }
      glbGeo[size][v] = g;
    }
  }

  // I210: setShieldGLB(obj) - swap the Blender armor-plate shell into every pooled
  // shell (they share one geometry; per-rock scale in sync is unchanged).
  function setShieldGLB(obj) {
    if (!obj || glbShellGeo) return;
    let g = null;
    obj.traverse((n) => { if (n.isMesh && !g) g = n.geometry; });
    if (g) { glbShellGeo = true; shellGeo = g; for (const m of pool) m.children[0].geometry = g; }
  }

  // I344 (ST-316): comet variant geometry (render-only rock variant; zero src/core). The
  // ion tail is baked into the SAME mesh as a COLOR_0 gradient, so setCometGLB swaps it into
  // an existing S pool slot (+0 new draw-call path; the slot already drew as a rock).
  function setCometGLB(obj) {
    if (!obj || glbComet) return;
    let g = null;
    obj.traverse((n) => { if (n.isMesh && !g) g = n.geometry; });
    if (g) {
      if (!g.hasAttribute("color")) {
        const col = new Float32Array(g.attributes.position.count * 3).fill(1);
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      }
      glbComet = g;
    }
  }

  // I155: shape-cue toggle (settings.shapeCues; on by default for colorblind-friendly play).
  function setShapeCues(on) { shapeCuesOn = on === true; }

  // I257: rock-specific IBL fill. The I213 boot loop sets CONFIG.fx.env.intensity on EVERY
  // standard material (ship/belt want the nebula reflection); rocks get a lower fill so the
  // warm key light reads instead of the blue-violet nebula washing them periwinkle.
  function setEnvIntensity(v) { if (typeof v === 'number' && isFinite(v)) mat.envMapIntensity = v; }

  return { sync, pool, setGLB, setCometGLB, setShieldGLB, setShapeCues, setEnvIntensity, setRim, setStragglerBeacon }; // I640 (ST-598): +straggler beacon
}
