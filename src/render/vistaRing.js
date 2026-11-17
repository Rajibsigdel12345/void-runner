// ST-455 (E64, I488): background vista ring - distant low-poly silhouettes (slabs,
// towers, arches, monoliths) that sell the illusion of space around the arena.
// - Deterministic layout from a seeded RNG (cfg.seed) -> identical every load.
// - All boxes merged into ONE BufferGeometry => exactly 1 draw call (~300-600 tris).
// - Visible-not-enterable: sits at r 85-150 (arena r=26), unlit MeshBasicMaterial,
//   static (0 per-frame work), never read by the sim (0 collision cost).
// - The group starts hidden; main.js gates visibility (campaign + PLAYING/PAUSED
//   only) so endless/MENU add 0 draw calls.
import * as THREE from "three";
import { RNG } from "../core/rng.js";

const VISTA_BASE = 0x2a3140; // unlit silhouette base (setTint lerps toward the zone accent)

export function createVistaRing(scene, cfg) {
  const rnd = new RNG(cfg.seed);
  const pos = []; // flat xyz (built once; zero runtime geometry cost)
  const idx = [];
  const _L = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const _F = [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 7, 3], [1, 5, 6, 2], [3, 2, 6, 7], [0, 1, 5, 4]];
  function pushBox(x, z, yBase, w, d, h, rotY) {
    if (h <= 0) return;
    const cos = Math.cos(rotY), sin = Math.sin(rotY);
    const hw = w * 0.5, hd = d * 0.5;
    // 8 corners: x in {-hw,+hw}, y in {0,h}, z in {-hd,+hd}; index = xbit + ybit*2 + zbit*4
    for (let i = 0; i < 8; i++) {
      const lx = (i & 1) ? hw : -hw;
      const ly = (i & 2) ? h : 0;
      const lz = (i & 4) ? hd : -hd;
      _L[i][0] = x + lx * cos - lz * sin;
      _L[i][1] = yBase + ly;
      _L[i][2] = z + lx * sin + lz * cos;
    }
    for (const face of _F) {
      const base = pos.length / 3;
      for (const ci of face) pos.push(_L[ci][0], _L[ci][1], _L[ci][2]);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  for (let i = 0; i < cfg.count; i++) {
    const th = rnd.next() * Math.PI * 2;
    const r = rnd.range(cfg.rMin, cfg.rMax);
    const x = r * Math.sin(th), z = r * Math.cos(th);
    const yBase = rnd.range(cfg.yMin, cfg.yMax * 0.3);
    const s = rnd.range(cfg.minScale, cfg.maxScale);
    const rotY = th + (rnd.next() - 0.5) * 0.7; // face arena-center-ish + jitter
    const hMax = Math.max(1, cfg.yMax - yBase); // keep the top under yMax
    const kind = rnd.int(0, 3);
    if (kind === 0) pushBox(x, z, yBase, s * 1.8, s * 0.9, Math.min(s * 0.5, hMax), rotY); // slab
    else if (kind === 1) pushBox(x, z, yBase, s * 0.55, s * 0.55, Math.min(s * 1.8, hMax), rotY); // tower
    else if (kind === 2) { // arch: 2 pillars + lintel (offset along the box local X)
      const ph = Math.min(s * 1.2, hMax);
      const pw = s * 0.35, gap = s * 1.4;
      const ox = (gap / 2) * Math.cos(rotY), oz = (gap / 2) * Math.sin(rotY);
      pushBox(x - ox, z - oz, yBase, pw, pw, ph, rotY);
      pushBox(x + ox, z + oz, yBase, pw, pw, ph, rotY);
      pushBox(x, z, yBase + ph, gap + pw, pw, Math.min(s * 0.35, hMax - ph), rotY);
    }
    else pushBox(x, z, yBase, s * 0.7, s * 0.4, Math.min(s * 1.2, hMax), th + 0.4); // monolith (fixed lean)
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ color: VISTA_BASE, toneMapped: false, side: THREE.DoubleSide, fog: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "vistaRing";
  const group = new THREE.Group();
  group.name = "vistaRingGroup"; // probe handle (main.js gates group.visible)
  group.add(mesh);
  group.visible = false; // hidden until the caller gates it on
  void scene; // scene accepted for API symmetry; the caller owns group attachment (R2)
  const _base = new THREE.Color(VISTA_BASE);
  const _acc = new THREE.Color();
  function setTint(accentHex, mix) {
    const m = mix < 0 ? 0 : (mix > 1 ? 1 : mix);
    if (m <= 0) { mat.color.copy(_base); return; }
    _acc.setHex((accentHex >>> 0) & 0xffffff);
    mat.color.copy(_base).lerp(_acc, m); // scratch Colors only - no per-call alloc
  }
  function dispose() { geo.dispose(); mat.dispose(); }
  return { group, mesh, geo, setTint, dispose };
}
