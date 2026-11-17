// Void Runner - power-up rendering (ST-020). Pooled meshes, shared geo/materials per type.
// Distinct silhouette + color per type (I064 adds colorblind glyph decals):
//   rapid = octahedron/gold (I288: distinct from spread orange), spread = trident cone/orange, shield = hex ring/cyan,
//   bomb = cube/amber (I464/ST-432 C1: was red - sat in the threat family), magnet = horseshoe/green, overdrive = hex prism/magenta (ST-057; I425/ST-395: spread/shield/magnet
//   fallbacks silhouette-match the re-baked Blender emblems).
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

// I70: colorblind-friendly letter badge - draws a letter on a small canvas,
// used as a billboard sprite above each power-up so a pickup is identifiable
// by letter, not just shape + color.
function letterTexture(letter, ringHex) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(6,10,22,0.80)';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = ringHex;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 68px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const TYPES = {
  rapid:  { color: 0xffc300, emissive: 0x7a5a00, make: () => new THREE.OctahedronGeometry(0.45) }, // I288/ST-272: distinct gold (was 0xffe066 - hue-collided with spread orange)
  spread: { color: 0xff9f43, emissive: 0x7a4a00, make: () => new THREE.ConeGeometry(0.35, 0.85, 3) }, // I425/ST-395: 3-sided trident fallback
  shield: { color: 0x53d8ff, emissive: 0x0e5a75, make: () => new THREE.TorusGeometry(0.34, 0.13, 3, 6) }, // I425/ST-395: hex-ring fallback
  bomb:   { color: 0xffa84a, emissive: 0x7a4210, make: () => new THREE.BoxGeometry(0.58, 0.58, 0.58) }, // I464/ST-432 C1: threat red (H0, ~9deg from hazard 0xff4a2a) -> warm amber (H31, ~22deg from threat red; box + B badge keep the silhouette) - busy-frame A/B in .evidence/I464/
  magnet: { color: 0x69f0ae, emissive: 0x0f5c37, make: () => new THREE.TorusGeometry(0.29, 0.13, 6, 10, Math.PI) }, // I425/ST-395: horseshoe fallback (half-torus, arch opens -Y)
  overdrive: { color: 0xff4dd8, emissive: 0x6d0f52, make: () => new THREE.CylinderGeometry(0.42, 0.42, 0.3, 6) },
  slowmo: { color: 0x9fe8ff, emissive: 0x1a5a7a, make: () => new THREE.IcosahedronGeometry(0.45) }, // ST-115: ice-blue icosahedron (safety entry; tint lands in I116)
};

const LETTERS = { rapid: 'R', spread: 'S', shield: 'H', bomb: 'B', magnet: 'M', overdrive: 'O', slowmo: 'T' }; // I70 (+ST-115 slow-mo)

export function createPowerupRenderer(scene) {
  const max = 4; // pool headroom over maxActiveDrops (I078 audits pools)
  const geos = {}, mats = {};
  const glbGeo = {}; // I211: per-type Blender emblem geometry, swapped in when the asset resolves
  for (const [t, def] of Object.entries(TYPES)) {
    geos[t] = def.make();
    { // I288/ST-272: white value identity for the procedural fallback geos (material now uses vertexColors)
      const col = new Float32Array(geos[t].attributes.position.count * 3).fill(1);
      geos[t].setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    mats[t] = new THREE.MeshStandardMaterial({
      color: def.color, emissive: def.emissive, emissiveIntensity: 0.9,
      roughness: 0.35, metalness: 0.15, vertexColors: true, // I288/ST-272: GLB COLOR_0 facet-value bake multiplies on top of the base tint
    });
  }
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geos.rapid, mats.rapid);
    m.visible = false;
    scene.add(m);
    pool.push(m);
  }

  // I70: letter badges (R/S/H/B/M/O) - one shared SpriteMaterial per type
  // (shared canvas texture), pooled to the mesh size; depthTest off so the
  // label always reads. Zero per-frame allocation.
  const badgeMats = {};
  for (const tt of Object.keys(TYPES)) {
    const ringHex = '#' + TYPES[tt].color.toString(16).padStart(6, '0');
    badgeMats[tt] = new THREE.SpriteMaterial({ map: letterTexture(LETTERS[tt], ringHex), transparent: true, depthTest: false });
  }
  const badges = [];
  for (let i = 0; i < max; i++) {
    const s = new THREE.Sprite(badgeMats.rapid);
    s.scale.set(0.7, 0.7, 1);
    s.renderOrder = 5;
    s.visible = false;
    scene.add(s);
    badges.push(s);
  }

  let t = 0;
  function sync(powerups, dt) {
    t += dt;
    let i = 0;
    for (const d of powerups.drops) {
      if (d.dead || i >= max) continue;
      const idx = i++;
      const m = pool[idx];
      m.geometry = glbGeo[d.type] || geos[d.type]; // I211: GLB emblem when loaded
      m.material = mats[d.type];
      m.position.set(d.pos.x, 0.45 + Math.sin(t * 2.2 + d.id) * 0.08, d.pos.y);
      m.rotation.y = t * 1.4 + d.id;
      m.rotation.x = d.type === 'shield' ? Math.PI / 2.6 : 0;
      const fade = Math.max(0, Math.min(1, d.life / CONFIG.powerup.fadeTime)); // I130: 1 -> 0 over the last fadeTime seconds
      const pulse = (1 + Math.sin(t * 3.1 + d.id * 1.7) * 0.07) * fade; // I130: shrink-out before expiry (keeps the shared per-type materials intact)
      m.scale.setScalar(Math.max(0.001, pulse));
      m.visible = true;
      const b = badges[idx]; // I70: letter badge above the orb (always readable)
      b.material = badgeMats[d.type];
      b.position.copy(m.position);
      b.position.y += 0.72;
      b.scale.set(0.7 * fade, 0.7 * fade, 1); // I130: badge shrinks with the orb
      b.visible = fade > 0.02;
    }
    for (; i < max; i++) { pool[i].visible = false; badges[i].visible = false; }
  }

  // I211: swap a type's geometry to its Blender emblem (first mesh of the GLB scene).
  // In-code per-type materials stay authoritative (GLB materials unused). I288/ST-272: the emblems carry
  // a COLOR_0 facet-value bake; the guard below keeps a no-COLOR_0 GLB safe under vertexColors.
  function setGLB(type, obj) {
    let g = null;
    obj.traverse((o) => {
      if (!g && o.isMesh) g = o.geometry;
    });
    if (!g) return;
    if (!g.hasAttribute('color')) { // I288/ST-272: keep a GLB without COLOR_0 safe (white identity)
      const col = new Float32Array(g.attributes.position.count * 3).fill(1);
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    glbGeo[type] = g;
  }

  return { sync, pool, badges, setGLB };
}
