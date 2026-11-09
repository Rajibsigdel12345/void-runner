// Void Runner - shield ring visual (ST-022). Cyan torus around the ship,
// visible while SHIELD protection is live; pop flash when a hit is absorbed
// (the flash outlives the shield itself, which expires on the absorbing hit).
import * as THREE from 'three';

const POP_TIME = 0.3; // pop-flash duration in seconds

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

  let popT = -1; // seconds since pop; -1 = idle

  function pulse() { popT = 0; }

  function sync(world, dt) {
    const on = world.powerups.isShielding();
    ring.position.x = world.ship.pos.x;
    ring.position.y = 0.4; // same hover height as the ship group
    ring.position.z = world.ship.pos.y;
    if (popT >= 0) {
      // pop flash: expand + brighten + fade, runs even though the shield
      // itself is gone after the absorbing hit
      popT += dt;
      const k = Math.min(1, popT / POP_TIME);
      const s = 1 + k * 1.2; // 1x -> 2.2x
      ring.scale.set(s, s, s);
      mat.opacity = 0.9 * (1 - k);
      mat.emissiveIntensity = 0.5 + 2.0 * (1 - k);
      ring.visible = true;
      if (k >= 1) popT = -1;
      return;
    }
    ring.visible = on;
    if (!on) return;
    ring.scale.set(1, 1, 1);
    mat.opacity = 0.5;
    mat.emissiveIntensity = 0.9;
  }

  return { ring, sync, pulse };
}
