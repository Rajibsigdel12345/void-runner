// Void Runner - bullet render pool (ST-008; I61: additive streak trail).
// Shared geo/material, zero per-frame allocs.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

const TAIL_LEN = 1.15; // I61: streak length (units) behind the bullet head
const TAIL_TH = 0.16;  // I61: streak thickness
const _qx = new THREE.Vector3();
const _qy = new THREE.Vector3();
const _qz = new THREE.Vector3();
const _basis = new THREE.Matrix4();

// I61: head(bright) -> tail(transparent) gradient along the ribbon length (U).
function makeTrailTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 8;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0.0, 'rgba(150,230,255,0)');
  g.addColorStop(0.7, 'rgba(190,240,255,0.55)');
  g.addColorStop(1.0, 'rgba(230,252,255,0.95)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBulletPool(scene) {
  const max = CONFIG.weapon.maxBullets;
  const geo = new THREE.SphereGeometry(CONFIG.weapon.bulletRadius, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: CONFIG.fx.palette.bulletLevel[0] }); // ST-248: cockpit-cyan accent (config)
  const pool = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    scene.add(m);
    pool.push(m);
  }

  // I61: additive streak trail - one flat gradient ribbon per bullet slot.
  const trailTex = makeTrailTexture();
  const trailGeo = new THREE.PlaneGeometry(TAIL_LEN, TAIL_TH);
  const trailMat = new THREE.MeshBasicMaterial({
    map: trailTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const trails = [];
  for (let i = 0; i < max; i++) {
    const m = new THREE.Mesh(trailGeo, trailMat);
    m.visible = false;
    m.renderOrder = 2;
    scene.add(m);
    trails.push(m);
  }

  let curLevel = 0;

  // ST-123: recolor the shared bullet head + trail tint by weapon level (no-op on repeat).
  // ST-248: overdrive heat shift - white-hot variants while overdrive is active (config data-driven).
  function setLevel(level, overdrive) {
    const key = (Math.max(0, level) & 3) * 2 + (overdrive ? 1 : 0);
    if (curLevel === key) return;
    curLevel = key;
    const arr = overdrive ? CONFIG.fx.palette.bulletLevelOverdrive : CONFIG.fx.palette.bulletLevel;
    const c = arr[Math.max(0, Math.min(2, level - 1))] || CONFIG.fx.palette.bulletLevel[0];
    mat.color.setHex(c);
    trailMat.color.setHex(c);
  }

  function sync(weapons) {
    let idx = 0;
    for (const b of weapons.bullets) {
      if (b.dead) continue;
      const m = pool[idx];
      m.position.set(b.pos.x, 0.4, b.pos.y);
      m.visible = true;

      // I61: orient a flat ribbon along the bullet velocity, front end at the head.
      const t = trails[idx];
      const sp = Math.hypot(b.vel.x, b.vel.y) || 1;
      const dx = b.vel.x / sp;
      const dz = b.vel.y / sp; // three space: world y -> three z
      _qx.set(dx, 0, dz);   // ribbon long axis -> velocity
      _qz.set(0, 1, 0);     // ribbon normal -> up (lies flat in the arena)
      _qy.set(dz, 0, -dx);  // _qz x _qx (orthonormal)
      _basis.set(
        _qx.x, _qx.y, _qx.z, 0,
        _qy.x, _qy.y, _qy.z, 0,
        _qz.x, _qz.y, _qz.z, 0,
        0, 0, 0, 1
      );
      t.quaternion.setFromRotationMatrix(_basis);
      t.position.set(b.pos.x - dx * (TAIL_LEN / 2), 0.4, b.pos.y - dz * (TAIL_LEN / 2));
      t.visible = true;
      idx++;
    }
    for (let i = idx; i < max; i++) { pool[i].visible = false; trails[i].visible = false; }
  }

  return { sync, setLevel, pool, trails };
}
