// Void Runner - shield ring visual (ST-022; I62: breathing pulse + expanding
// pulse ring while shielding; pop flash on an absorbed hit). Reduced motion
// freezes all of it to a static ring.
import * as THREE from 'three';

const POP_TIME = 0.3;      // absorb pop-flash duration (s)
const BREATH = 2.1;        // I62: main-ring breathing period (s)
const PULSE_PERIOD = 1.6;  // I62: expanding pulse-ring cycle (s)

export function createShieldRing(scene) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x53d8ff,
    emissive: 0x53d8ff,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.5,
    metalness: 0.2,
    roughness: 0.4,
  });
  const geo = new THREE.TorusGeometry(1.7, 0.05, 8, 40);
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = Math.PI / 2; // flat in the arena plane
  ring.visible = false;
  scene.add(ring);

  // I62: thin additive ring that repeatedly expands outward and fades.
  const pMat = new THREE.MeshBasicMaterial({
    color: 0x8fe8ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pGeo = new THREE.TorusGeometry(1.7, 0.02, 6, 40);
  const wave = new THREE.Mesh(pGeo, pMat);
  wave.rotation.x = Math.PI / 2;
  wave.visible = false;
  scene.add(wave);

  let popT = -1; // seconds since absorb pop; -1 = idle
  let phase = 0; // I62: animation clock (advances only with motion)

  function pulse() { popT = 0; }

  function sync(world, dt, motion) {
    const on = world.powerups.isShielding();
    const px = world.ship.pos.x, py = world.ship.pos.y;
    ring.position.set(px, 0.4, py);
    wave.position.set(px, 0.4, py);
    if (motion) phase += dt;

    if (popT >= 0) {
      // absorb flash: expand + brighten + fade (runs after the shield is gone)
      popT += dt;
      const k = Math.min(1, popT / POP_TIME);
      const s = 1 + k * 1.2;
      ring.scale.set(s, s, s);
      mat.opacity = 0.9 * (1 - k);
      mat.emissiveIntensity = 0.5 + 2.0 * (1 - k);
      ring.visible = true;
      wave.visible = false;
      if (k >= 1) popT = -1;
      return;
    }

    ring.visible = on;
    wave.visible = on;
    if (!on) { ring.scale.set(1, 1, 1); mat.opacity = 0.5; mat.emissiveIntensity = 0.9; pMat.opacity = 0; return; }

    if (motion) {
      // I62: breathing main ring + repeating expanding pulse ring
      const b = 0.5 + 0.5 * Math.sin((phase / BREATH) * Math.PI * 2);
      const rs = 1 + 0.045 * b;
      ring.scale.set(rs, rs, rs);
      mat.opacity = 0.42 + 0.2 * b;
      mat.emissiveIntensity = 0.75 + 0.65 * b;
      const w = (phase % PULSE_PERIOD) / PULSE_PERIOD; // 0..1
      const ws = 1 + w * 1.3;
      wave.scale.set(ws, ws, ws);
      pMat.opacity = 0.5 * (1 - w);
    } else {
      // reduced motion: static shield, faint static outer ring
      ring.scale.set(1, 1, 1);
      mat.opacity = 0.5;
      mat.emissiveIntensity = 0.9;
      wave.scale.set(1.4, 1.4, 1.4);
      pMat.opacity = 0.2;
    }
  }

  return { ring, sync, pulse };
}
