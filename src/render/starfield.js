// Void Runner - procedural starfield (I04). No external assets; deterministic via RNG.
import * as THREE from 'three';
import { RNG } from '../core/rng.js';

const NEAR_SHELL = { count: 280, rMin: 90, rMax: 130, size: 3.2, color: 0xe8f1ff, opacity: 0.95 };
const FAR_SHELL = { count: 520, rMin: 140, rMax: 230, size: 2.2, color: 0x9db4ff, opacity: 0.7 };

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

function makeShell(cfg, rng, glow) {
  const pos = new Float32Array(cfg.count * 3);
  for (let i = 0; i < cfg.count; i++) {
    const u = rng.next() * 2 - 1;
    const theta = rng.next() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = rng.range(cfg.rMin, cfg.rMax);
    pos[i * 3 + 0] = s * Math.cos(theta) * r;
    pos[i * 3 + 1] = u * r * 0.7; // flatten slightly toward a galactic-plane feel
    pos[i * 3 + 2] = s * Math.sin(theta) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: cfg.color,
    size: cfg.size,
    map: glow,
    sizeAttenuation: true,
    transparent: true,
    opacity: cfg.opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false, // keep stars crisp through scene fog
  });
  return new THREE.Points(geo, mat);
}

export function createStarfield(seed = 1337) {
  const rng = new RNG(seed);
  const glow = makeGlowTexture();
  const group = new THREE.Group();
  group.name = 'starfield';
  group.add(makeShell(NEAR_SHELL, rng, glow));
  group.add(makeShell(FAR_SHELL, rng, glow));
  return group;
}
