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
  return geo;
}

export function createAsteroidRenderer(scene) {
  const max = CONFIG.asteroid.maxConcurrent;
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
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a7f72, roughness: 0.95, metalness: 0.05, flatShading: true });
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
  const matGold = new THREE.MeshStandardMaterial({ color: 0xffc94d, emissive: 0xffa018, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.55, flatShading: true });
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geos.L[0], mat);
    m.visible = false;
    scene.add(m);
    pool.push(m);
  }

  function sync(field) {
    let i = 0;
    for (const r of field.rocks) {
      if (r.dead || i >= max) continue;
      const m = pool[i++];
      m.geometry = glbGeo[r.size] || geos[r.size][r.variant]; // I104: GLB when loaded
      m.material = r.golden ? matGold : mat; // ST-052
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
    if (g) glbGeo[size] = g;
  }

  return { sync, pool, setGLB };
}
