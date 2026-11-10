// Void Runner - asteroid rendering (ST-010). Shared noise-baked geo, pooled meshes, no per-frame allocs.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { CONFIG } from '../core/config.js';

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
  // procedural 3-variant bakes are used.
  const glbGeo = {};
  let glbShellGeo = false; // I210: shield GLB loaded flag
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a7f72, roughness: 0.95, metalness: 0.05, flatShading: true, vertexColors: true }); // I209: GLB-baked shading
  // ST-139: belt rock - dark cold metal so drifting indestructibles read as "unbreakable".
  const matBelt = new THREE.MeshStandardMaterial({ color: 0x2a313d, roughness: 0.42, metalness: 0.9, flatShading: true, emissive: 0x2f6fd0, emissiveIntensity: 0.6, vertexColors: true }); // I209: vertexColors
  // I60: rim-lit upgrade - cool fresnel edge added on top of the standard lighting.
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: new THREE.Color(0x5f7fd8) };
    shader.uniforms.uRimStrength = { value: 0.5 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRimViewPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvRimViewPos = -mvPosition.xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRimViewPos;\nuniform vec3 uRimColor;\nuniform float uRimStrength;')
      .replace('#include <opaque_fragment>',
        'float vRimF = pow(1.0 - clamp(dot(normalize(-vRimViewPos), normal), 0.0, 1.0), 3.0);\n' +
        'outgoingLight += uRimColor * (vRimF * uRimStrength);\n' +
        '#include <opaque_fragment>');
  };
  // ST-052: golden rock - bright emissive so bloom (High FX) makes it glow.
  const matGold = new THREE.MeshStandardMaterial({ color: 0xffc94d, emissive: 0xffa018, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.55, flatShading: true, vertexColors: true }); // I209: vertexColors
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
    let i = 0;
    for (const r of field.rocks) {
      if (r.dead || i >= max) continue;
      const m = pool[i++];
      m.geometry = glbGeo[r.size] || geos[r.size][r.variant]; // I104: GLB when loaded
      m.material = r.belt ? matBelt : (r.golden ? matGold : mat); // ST-052/ST-139
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

  // I104: setGLB(size, obj) - extract the first mesh geometry from a loaded
  // GLB and use it for every rock of that size (1 geometry per size per
  // design/asset-spec.md; per-rock rotation gives the visual variety).
  function setGLB(size, obj) {
    if (!obj || !size || glbGeo[size]) return;
    let g = null;
    obj.traverse((n) => { if (n.isMesh && !g) g = n.geometry; });
    if (g) {
      if (!g.hasAttribute("color")) { // I209: materials use vertexColors; keep GLBs without COLOR_0 safe
        const col = new Float32Array(g.attributes.position.count * 3).fill(1);
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      }
      glbGeo[size] = g;
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

  // I155: shape-cue toggle (settings.shapeCues; on by default for colorblind-friendly play).
  function setShapeCues(on) { shapeCuesOn = on === true; }

  return { sync, pool, setGLB, setShieldGLB, setShapeCues };
}
