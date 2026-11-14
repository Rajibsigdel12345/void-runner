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
  group.add(near, far);
  group.uniforms = [near.userData.uniforms, far.userData.uniforms]; // I60: probe handle
  let frozenTime = 0;
  /** I60: t = sim time, camera for parallax, motion = false freezes twinkle + parallax. */
  group.update = function (t, camera, motion) {
    if (motion) frozenTime = t;
    for (const shell of [near, far]) {
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
