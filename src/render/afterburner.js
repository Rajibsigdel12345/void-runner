// Void Runner - afterburner ribbon (ST-434 (I466) B4). Motion trail at sustained
// thrust: a ring-buffer Points fed from the ship nozzle while thrusting. Pooled,
// preallocated Float32Arrays, zero per-frame allocs (the 10 s probe gates it).
// Clears on death (main.js gameover). RM-gated at the feed site (main.js only
// feeds it when motion is on and PLAYING). Complements the I213 engine-trail
// puffs: this adds the motion channel, not the flame. All tunables:
// CONFIG.fx.afterburner.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { isWebGPU, getFxState } from './fxArm.js'; // I497 (ST-463): TSL arm (webgpu-only ribbon branch)

// 32px radial glow (procedural; smaller than the 64px starfield one - the
// ribbon points are dense).
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const VERT = [
  'attribute float aFade;',
  'uniform float uSize;',
  'varying float vFade;',
  'void main() {',
  '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
  '  gl_PointSize = uSize * aFade * (350.0 / -mvPosition.z);',
  '  gl_Position = projectionMatrix * mvPosition;',
  '  vFade = aFade;',
  '}'
].join('\n');

const FRAG = [
  'uniform vec3 uColor;',
  'uniform float uOpacity;',
  'uniform sampler2D uGlow;',
  'varying float vFade;',
  'void main() {',
  '  vec4 tex = texture2D(uGlow, gl_PointCoord);',
  '  gl_FragColor = vec4(uColor, tex.a * vFade * uOpacity);',
  '}'
].join('\n');

export function createAfterburner() {
  const A = CONFIG.fx.afterburner;
  const N = A.ring;
  const pos = new Float32Array(N * 3);
  const fade = new Float32Array(N); // 0 = dead slot (gl_PointSize 0 -> invisible)
  const vel = new Float32Array(N * 2); // per-slot drift velocity (x, z)
  const age = new Float32Array(N);
  const life = new Float32Array(N);
  const jit = new Float32Array(N * 3); // precomputed per-slot jitter (x, y, z) - zero per-frame allocs
  for (let i = 0; i < N; i++) {
    const a = i * 2.399963; // golden angle - deterministic, no RNG (sim stream untouched)
    const r = 0.3 + 0.7 * ((i * 0.618034) % 1);
    jit[i * 3 + 0] = Math.cos(a) * r;
    jit[i * 3 + 1] = Math.sin(a * 1.7) * 0.5;
    jit[i * 3 + 2] = Math.sin(a) * r;
    life[i] = A.life * (i % 2 === 0 ? 1.0 : 0.8);
  }
  let geo, posAttr, fadeAttr, mat, points;
  if (isWebGPU()) {
    // I497 (ST-463): TSL instanced sprite ribbon (webgpu arm only) - the probe-verified
    // starfield recipe: node-bound instanced attrs + unit quad, Mesh not Points. No uTime:
    // the ring advances slots in place, so only the per-slot fade varies per frame.
    const { webgpu: W, tsl: T } = getFxState();
    posAttr = new THREE.InstancedBufferAttribute(pos, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    fadeAttr = new THREE.InstancedBufferAttribute(fade, 1);
    fadeAttr.setUsage(THREE.DynamicDrawUsage);
    const uSize = T.uniform(A.size);
    const uColor = T.uniform(new THREE.Color(A.color));
    const uOpacity = T.uniform(A.opacity);
    const uGlow = T.uniformTexture(makeGlowTexture());
    const aPos = T.instancedBufferAttribute(posAttr, 'vec3');
    const aFade = T.instancedBufferAttribute(fadeAttr, 'float');
    const vFade = T.varying(aFade, 'vFade');
    mat = new W.PointsNodeMaterial();
    mat.positionNode = aPos;
    mat.sizeNode = uSize.mul(aFade).mul(T.float(700.0).div(T.viewportSize.y)); // 2x the classic 350/-z formula (WebGPU sizeNode = H/2/-z)
    mat.colorNode = uColor;
    mat.opacityNode = T.texture(uGlow, T.positionGeometry.xy.add(T.vec2(0.5, 0.5))).a.mul(vFade).mul(uOpacity);
    mat.fog = false;
    mat.lights = false;
    mat.transparent = true;
    mat.blending = THREE.AdditiveBlending;
    mat.depthWrite = false;
    const quad = new THREE.PlaneGeometry(1, 1);
    geo = new THREE.InstancedBufferGeometry();
    geo.index = quad.index;
    geo.setAttribute('position', quad.attributes.position);
    geo.instanceCount = N;
    points = new THREE.Mesh(geo, mat);
  } else {
  geo = new THREE.BufferGeometry();
  posAttr = new THREE.BufferAttribute(pos, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  fadeAttr = new THREE.BufferAttribute(fade, 1);
  fadeAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('aFade', fadeAttr);
  mat = new THREE.ShaderMaterial({
    uniforms: {
      uSize: { value: A.size },
      uColor: { value: new THREE.Color(A.color) },
      uOpacity: { value: A.opacity },
      uGlow: { value: makeGlowTexture() }
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  points = new THREE.Points(geo, mat);
  } // I497 (ST-463): end webgpu branch (classic ribbon inside the else above)
  points.name = 'afterburner';
  points.frustumCulled = false; // rides the ship - no pop-in near the camera
  points.visible = false;
  let head = 0;
  let emitAcc = 0;
  let live = 0;

  // update(dt, thrustFrac, px, py, pz, fx, fz): feed while sustained thrust, advance
  // all live slots in place. Zero per-frame allocs (all buffers preallocated).
  function update(dt, thrustFrac, px, py, pz, fx, fz) {
    let dirty = false;
    if (thrustFrac >= A.minThrust) {
      emitAcc += dt * A.rate;
      while (emitAcc >= 1) {
        emitAcc -= 1;
        const i = head;
        head = (head + 1) % N;
        if (fade[i] <= 0) live++; // overwriting a live slot (ring full) leaves live unchanged
        pos[i * 3 + 0] = px - fx * A.offset + jit[i * 3 + 0] * A.spread;
        pos[i * 3 + 1] = py + jit[i * 3 + 1] * A.spread;
        pos[i * 3 + 2] = pz - fz * A.offset + jit[i * 3 + 2] * A.spread;
        vel[i * 2 + 0] = -fx * A.drift;
        vel[i * 2 + 1] = -fz * A.drift;
        age[i] = 0;
        fade[i] = 1;
        dirty = true;
      }
    } else if (emitAcc > 0) {
      emitAcc = 0; // thrust dropped - don't bank emissions for a later burst
    }
    for (let i = 0; i < N; i++) {
      if (fade[i] <= 0) continue;
      age[i] += dt;
      const lf = life[i];
      if (age[i] >= lf) { fade[i] = 0; live--; continue; }
      pos[i * 3 + 0] += vel[i * 2 + 0] * dt;
      pos[i * 3 + 2] += vel[i * 2 + 1] * dt;
      const f = 1 - age[i] / lf;
      fade[i] = f * f; // ease-out: bright at the nozzle, soft at the tail
      dirty = true;
    }
    if (dirty) {
      posAttr.needsUpdate = true;
      fadeAttr.needsUpdate = true;
    }
    points.visible = live > 0; // 0 live -> no draw call (idle playframe pins stable)
  }

  function clear() {
    for (let i = 0; i < N; i++) { fade[i] = 0; }
    head = 0;
    emitAcc = 0;
    live = 0;
    posAttr.needsUpdate = true;
    fadeAttr.needsUpdate = true;
    points.visible = false;
  }

  return { points, update, clear, live: () => live };
}
