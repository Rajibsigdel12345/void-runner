// Void Runner - procedural starfield (I04; I60: twinkle + parallax). No
// external assets; deterministic via RNG. Two depth shells: the near shell
// keeps 75% of the camera's motion (bigger apparent shift), the far shell
// only 40% - the gap reads as depth. Twinkle is per-star (phase + speed +
// size attributes); reduced motion freezes twinkle and parallax.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';

const NEAR_SHELL = { count: 280, rMin: 90, rMax: 130, size: 3.2, color: 0xe8f1ff, opacity: 0.95, parallax: 0.25 };
const FAR_SHELL = { count: 520, rMin: 140, rMax: 230, size: 2.2, color: 0x9db4ff, opacity: 0.7, parallax: 0.6 };

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
    const u = rng.next() * 2 - 1;
    const theta = rng.next() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = rng.range(cfg.rMin, cfg.rMax);
    pos[i * 3 + 0] = s * Math.cos(theta) * r;
    pos[i * 3 + 1] = u * r * 0.7; // flatten slightly toward a galactic-plane feel
    pos[i * 3 + 2] = s * Math.sin(theta) * r;
    phase[i] = rng.next() * Math.PI * 2;
    speed[i] = rng.range(0.5, 2.2);
    scale[i] = rng.range(0.7, 1.4);
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

export function createStarfield(seed = 1337) {
  const rng = new RNG(seed);
  const glow = makeGlowTexture();
  const group = new THREE.Group();
  group.name = 'starfield';
  const near = makeShell(NEAR_SHELL, rng, glow);
  const far = makeShell(FAR_SHELL, rng, glow);
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
