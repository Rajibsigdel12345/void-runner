// Void Runner - procedural starfield (I04; I60: twinkle + parallax; I366: v6
// skybox knot correlation). No external assets; deterministic via RNG. Two
// depth shells: the near shell keeps 75% of the camera's motion (bigger
// apparent shift), the far shell only 40% - the gap reads as depth. Twinkle is
// per-star (phase + speed + size attributes); reduced motion freezes twinkle
// and parallax.
// I366/ST-334: placement correlates with the v6 skybox knots. Each star is
// drawn from a 3-way mix with a fixed per-star RNG count: p_knot stars come
// from a 2D Gaussian clump around the dominant knot, p_sec stars from one
// around the secondary knot, the rest uniform on the sphere (as before).
// Clump sigma is ~2x the bake sigma so the star-rich region matches the
// knot's bright (FWHM) extent; clump stars get a bright scale boost. Total
// count unchanged; non-knot sky sparser. All tunables: src/core/config.js
// (starfield section). The seed drives ONLY the starfield RNG (isolated - the
// sim stream is untouched).
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { CONFIG } from '../core/config.js';
import { isWebGPU, getFxState } from './fxArm.js'; // I497 (ST-463): TSL arm (webgpu-only material branches)

const D2R = Math.PI / 180;
const TWO_PI = Math.PI * 2;

// I366/ST-334: skybox v6 knots mirrored from assets/skybox_equirect.jpg.
// u = equirect width fraction (az deg = (u - 0.5) * 360, from +x toward +z);
// latDeg = sky latitude; sizeUDeg/sizeLatDeg = clump sigma in deg (draw
// distribution, ~2x the bake sigma); p = mix weight (fraction of all stars).
function makeKnotCfg(cfg) {
  return { u: cfg.u, lat: cfg.latDeg * D2R, su: cfg.sizeUDeg / 360, sl: cfg.sizeLatDeg * D2R, p: cfg.p, bright: cfg.bright };
}
const CORE = makeKnotCfg(CONFIG.starfield.knot);
const SEC = makeKnotCfg(CONFIG.starfield.secondary);

// I366: draw one clump direction for knot k. Two Box-Muller uniforms give a
// Gaussian (du in u_tex units, dlat in rad of POST-flatten lat); u is the
// pre-flatten cos(lat) solved from the flattened-plane relation
// (y*0.7 in makeShell): sin^2(latC) = 0.49 u^2 / (1 - 0.51 u^2).
function knotDirection(k, rng) {
  const a = rng.next();
  const b = rng.next();
  const r = Math.sqrt(-2 * Math.log(1 - a));
  const z1 = r * Math.cos(TWO_PI * b);
  const z2 = r * Math.sin(TWO_PI * b);
  let ut = k.u + z1 * k.su;
  ut -= Math.floor(ut); // wrap to [0,1)
  const theta = (ut - 0.5) * TWO_PI; // u_tex -> azimuth (from +x toward +z)
  const LAT_MAX = Math.asin(0.9999); // keep off the poles
  let latC = k.lat + z2 * k.sl;
  if (latC > LAT_MAX) latC = LAT_MAX;
  else if (latC < -LAT_MAX) latC = -LAT_MAX;
  const v = Math.sin(latC) * Math.sin(latC);
  const u = (latC < 0 ? -1 : 1) * Math.sqrt(v / (0.49 + 0.51 * v));
  return { u, theta };
}

// Soft round sprite from a tiny radial-gradient canvas (procedural, no assets).
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// I60: per-star twinkle (src-alpha additive: dst += uColor * glow * twinkle * opacity)
const VERT = [
  'attribute float aPhase;',
  'attribute float aSpeed;',
  'attribute float aScale;',
  'uniform float uTime;',
  'uniform float uSize;',
  'varying float vTwinkle;',
  'void main() {',
  '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
  '  gl_PointSize = uSize * aScale * (350.0 / -mvPosition.z);',
  '  gl_Position = projectionMatrix * mvPosition;',
  '  vTwinkle = 0.72 + 0.28 * sin(uTime * aSpeed + aPhase);',
  '}'
].join('\n');

const FRAG = [
  'uniform vec3 uColor;',
  'uniform float uOpacity;',
  'uniform sampler2D uGlow;',
  'varying float vTwinkle;',
  'void main() {',
  '  vec4 tex = texture2D(uGlow, gl_PointCoord);',
  '  gl_FragColor = vec4(uColor, tex.a * vTwinkle * uOpacity);',
  '}'
].join('\n');

// ST-434 (I466) B3: 4-spike star-flare sprite for the top ~2% brightest stars
// (procedural canvas, shared by all flares - no per-star textures).
function makeFlareTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const rad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rad.addColorStop(0, 'rgba(255,255,255,1)');
  rad.addColorStop(0.18, 'rgba(255,255,255,0.5)');
  rad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  rad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rad;
  g.fillRect(0, 0, 64, 64);
  g.globalCompositeOperation = 'lighter';
  const spike = (dx, dy) => {
    const lg = g.createLinearGradient(32, 32, 32 + dx * 32, 32 + dy * 32);
    lg.addColorStop(0, 'rgba(255,255,255,0.85)');
    lg.addColorStop(0.55, 'rgba(255,255,255,0.22)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.strokeStyle = lg;
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(32, 32);
    g.lineTo(32 + dx * 32, 32 + dy * 32);
    g.stroke();
  };
  spike(1, 0); spike(-1, 0); spike(0, 1); spike(0, -1);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ST-434 (I466) B3: flare shader - per-star aPhase rotation applied in the fragment
// (uTime freezes under reduced motion -> static, no rotation/breathing). Point-size
// attenuation matches the shells (350 / -z).
const FLARE_VERT = [
  'attribute float aPhase;',
  'attribute float aScale;',
  'uniform float uTime;',
  'uniform float uSize;',
  'uniform float uRot;',
  'varying float vRot;',
  'varying float vTwinkle;',
  'void main() {',
  '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
  '  gl_PointSize = uSize * aScale * (350.0 / -mvPosition.z);',
  '  gl_Position = projectionMatrix * mvPosition;',
  '  vRot = aPhase + uTime * uRot;',
  '  vTwinkle = 0.8 + 0.2 * sin(uTime * 1.7 + aPhase * 2.0);',
  '}'
].join('\n');

const FLARE_FRAG = [
  'uniform vec3 uColor;',
  'uniform float uOpacity;',
  'uniform sampler2D uFlare;',
  'varying float vRot;',
  'varying float vTwinkle;',
  'void main() {',
  '  vec2 pc = gl_PointCoord - 0.5;',
  '  float c = cos(vRot);',
  '  float s = sin(vRot);',
  '  pc = mat2(c, -s, s, c) * pc + 0.5;',
  '  vec4 tex = texture2D(uFlare, pc);',
  '  if (tex.a < 0.01) discard;',
  '  gl_FragColor = vec4(uColor, tex.a * vTwinkle * uOpacity);',
  '}'
].join('\n');

// ST-434 (I466) B3: one additive Points layer over the top ~frac (min minCount)
// brightest near-shell stars (aScale rank). Position/phase/scale copied from the
// source stars; rides the near-shell parallax. Built once - zero per-frame allocs.
function makeFlare(near, cfg, flCfg, flareTex, color) {
  const A = near.userData.arrays; // I497 (ST-463): TSL shells carry the raw star arrays (quad geometry has no star attrs)
  const posArr = A ? A.pos : near.geometry.getAttribute('position').array;
  const srcScaleArr = A ? A.scale : near.geometry.getAttribute('aScale').array;
  const srcPhaseArr = A ? A.phase : near.geometry.getAttribute('aPhase').array;
  const total = posArr.length / 3;
  const n = Math.max(flCfg.minCount, Math.round(total * flCfg.frac));
  const order = new Array(total);
  for (let i = 0; i < total; i++) order[i] = i;
  order.sort((a, b) => srcScaleArr[b] - srcScaleArr[a]);
  const fPos = new Float32Array(n * 3);
  const fPhase = new Float32Array(n);
  const fScale = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = order[i];
    fPos[i * 3 + 0] = posArr[s * 3 + 0];
    fPos[i * 3 + 1] = posArr[s * 3 + 1];
    fPos[i * 3 + 2] = posArr[s * 3 + 2];
    fPhase[i] = srcPhaseArr[s];
    fScale[i] = srcScaleArr[s];
  }
  if (isWebGPU()) {
    // I497 (ST-463): TSL flare layer (webgpu arm only) - same recipe as the shells plus
    // the per-flare UV rotation (T.rotate(vec2, float) - vendor-verified). The classic
    // `discard tex.a < 0.01` is dropped: additive blending with alpha 0 is equivalent.
    const { webgpu: W, tsl: T } = getFxState();
    const iPos = new THREE.InstancedBufferAttribute(fPos, 3);
    const iPhase = new THREE.InstancedBufferAttribute(fPhase, 1);
    const iScale = new THREE.InstancedBufferAttribute(fScale, 1);
    const uTime = T.uniform(0);
    const uSize = T.uniform(cfg.size * flCfg.sizeMul);
    const uRot = T.uniform(flCfg.rotSpeed);
    const uColor = T.uniform(new THREE.Color(color));
    const uOpacity = T.uniform(flCfg.opacity);
    const uFlare = T.uniformTexture(flareTex);
    const aPos = T.instancedBufferAttribute(iPos, 'vec3');
    const aPhase = T.instancedBufferAttribute(iPhase, 'float');
    const aScale = T.instancedBufferAttribute(iScale, 'float');
    const vRot = T.varying(aPhase.add(uTime.mul(uRot)), 'vRot');
    const vTwinkle = T.varying(T.float(0.8).add(T.float(0.2).mul(T.sin(uTime.mul(T.float(1.7)).add(aPhase.mul(T.float(2.0)))))), 'vTwinkle');
    const mat = new W.PointsNodeMaterial();
    mat.positionNode = aPos;
    mat.sizeNode = uSize.mul(aScale).mul(T.float(700.0).div(T.viewportSize.y));
    mat.colorNode = uColor;
    mat.opacityNode = T.texture(uFlare, T.rotate(T.positionGeometry.xy, vRot).add(T.vec2(0.5, 0.5))).a.mul(vTwinkle).mul(uOpacity);
    mat.fog = false;
    mat.lights = false;
    mat.transparent = true;
    mat.blending = THREE.AdditiveBlending;
    mat.depthWrite = false;
    const quad = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = quad.index;
    geo.setAttribute('position', quad.attributes.position);
    geo.instanceCount = n;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.name = 'starflares';
    mesh.userData = { parallax: cfg.parallax, uniforms: { uTime, uSize, uRot, uColor, uOpacity, uFlare } };
    return mesh;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(fPhase, 1));
  geo.setAttribute('aScale', new THREE.BufferAttribute(fScale, 1));
  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: cfg.size * flCfg.sizeMul },
    uRot: { value: flCfg.rotSpeed },
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: flCfg.opacity },
    uFlare: { value: flareTex }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: FLARE_VERT,
    fragmentShader: FLARE_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'starflares';
  pts.userData = { parallax: cfg.parallax, uniforms };
  return pts;
}

function makeShell(cfg, rng, glow) {
  const pos = new Float32Array(cfg.count * 3);
  const phase = new Float32Array(cfg.count); // I60: twinkle phase
  const speed = new Float32Array(cfg.count); // I60: twinkle rad/s
  const scale = new Float32Array(cfg.count); // I60: size variation
  for (let i = 0; i < cfg.count; i++) {
    // I366: 3-way mix - direction draw always costs exactly 2 rng calls.
    const t = rng.next();
    let u, theta, bright;
    if (t < CORE.p) {
      const d = knotDirection(CORE, rng);
      u = d.u; theta = d.theta; bright = CORE.bright;
    } else if (t < CORE.p + SEC.p) {
      const d = knotDirection(SEC, rng);
      u = d.u; theta = d.theta; bright = SEC.bright;
    } else {
      u = rng.next() * 2 - 1;
      theta = rng.next() * Math.PI * 2;
      bright = 1.0;
    }
    const s = Math.sqrt(1 - u * u);
    const r = rng.range(cfg.rMin, cfg.rMax);
    pos[i * 3 + 0] = s * Math.cos(theta) * r;
    pos[i * 3 + 1] = u * r * 0.7; // flatten slightly toward a galactic-plane feel
    pos[i * 3 + 2] = s * Math.sin(theta) * r;
    phase[i] = rng.next() * Math.PI * 2;
    speed[i] = rng.range(0.5, 2.2);
    scale[i] = rng.range(0.7, 1.4) * bright; // I366: clump stars slightly brighter
  }
  if (isWebGPU()) {
    // I497 (ST-463): TSL instanced sprite shell (webgpu arm only) - probe-verified recipe
    // (.evidence/I497/tslprobe.html): the instanced attrs are node-bound, so the geometry
    // keeps only the unit-quad position and the shell is a Mesh, not a Points.
    const { webgpu: W, tsl: T } = getFxState();
    const iPos = new THREE.InstancedBufferAttribute(pos, 3);
    const iPhase = new THREE.InstancedBufferAttribute(phase, 1);
    const iSpeed = new THREE.InstancedBufferAttribute(speed, 1);
    const iScale = new THREE.InstancedBufferAttribute(scale, 1);
    const uTime = T.uniform(0);
    const uSize = T.uniform(cfg.size);
    const uColor = T.uniform(new THREE.Color(cfg.color));
    const uOpacity = T.uniform(cfg.opacity);
    const uGlow = T.uniformTexture(glow);
    const aPos = T.instancedBufferAttribute(iPos, 'vec3');
    const aPhase = T.instancedBufferAttribute(iPhase, 'float');
    const aSpeed = T.instancedBufferAttribute(iSpeed, 'float');
    const aScale = T.instancedBufferAttribute(iScale, 'float');
    const vTwinkle = T.varying(T.float(0.72).add(T.float(0.28).mul(T.sin(uTime.mul(aSpeed).add(aPhase)))), 'vTwinkle');
    const mat = new W.PointsNodeMaterial();
    mat.positionNode = aPos;
    mat.sizeNode = uSize.mul(aScale).mul(T.float(700.0).div(T.viewportSize.y));
    mat.colorNode = uColor;
    mat.opacityNode = T.texture(uGlow, T.positionGeometry.xy.add(T.vec2(0.5, 0.5))).a.mul(vTwinkle).mul(uOpacity);
    mat.fog = false;
    mat.lights = false;
    mat.transparent = true;
    mat.blending = THREE.AdditiveBlending;
    mat.depthWrite = false;
    const quad = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = quad.index;
    geo.setAttribute('position', quad.attributes.position);
    geo.instanceCount = cfg.count;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.userData = { parallax: cfg.parallax, uniforms: { uTime, uSize, uColor, uOpacity, uGlow }, arrays: { pos, phase, scale } };
    return mesh;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));
  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: cfg.size },
    uColor: { value: new THREE.Color(cfg.color) },
    uOpacity: { value: cfg.opacity },
    uGlow: { value: glow }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const pts = new THREE.Points(geo, mat);
  pts.userData = { parallax: cfg.parallax, uniforms };
  return pts;
}

export function createStarfield(seed = CONFIG.starfield.seed) {
  const rng = new RNG(seed);
  const glow = makeGlowTexture();
  const group = new THREE.Group();
  group.name = 'starfield';
  const near = makeShell(CONFIG.starfield.near, rng, glow);
  const far = makeShell(CONFIG.starfield.far, rng, glow);
  // ST-434 (I466) B3: flare layer for the top ~2% brightest NEAR-shell stars (far
  // shell deferred). +1 draw call; uTime freezes under reduced motion (static).
  const flare = makeFlare(near, CONFIG.starfield.near, CONFIG.starfield.flare, makeFlareTexture(), CONFIG.starfield.near.color);
  group.add(near, far, flare);
  // I60 probe handle: [near, far] indices stable; flare appended LAST so the
  // theme code (main.js reads [0]/[1]) is untouched.
  group.uniforms = [near.userData.uniforms, far.userData.uniforms, flare.userData.uniforms];
  let frozenTime = 0;
  /** I60: t = sim time, camera for parallax, motion = false freezes twinkle + parallax (+ flare rotation). */
  group.update = function (t, camera, motion) {
    if (motion) frozenTime = t;
    for (const shell of [near, far, flare]) {
      shell.userData.uniforms.uTime.value = frozenTime;
      if (motion && camera) {
        const f = shell.userData.parallax;
        shell.position.set(camera.position.x * f, camera.position.y * f, camera.position.z * f);
      } else {
        shell.position.set(0, 0, 0);
      }
    }
  };
  return group;
}
