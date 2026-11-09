// Void Runner - procedural ship mesh (ST-006). Low-poly, no external assets.
import * as THREE from 'three';

export function createShipMesh() {
  const group = new THREE.Group();
  group.name = 'ship';

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8fd8ff, metalness: 0.35, roughness: 0.35, flatShading: true });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x2f5aa8, metalness: 0.3, roughness: 0.5, flatShading: true });
  const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x0b1830, emissive: 0x59d8ff, emissiveIntensity: 1.4, roughness: 0.2 });

  const bodyGeo = new THREE.ConeGeometry(0.55, 1.7, 4);
  bodyGeo.rotateX(Math.PI / 2); // tip toward +Z (forward in render space)
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1, 0.5, 1);
  group.add(body);

  const wingGeo = new THREE.BoxGeometry(2.5, 0.1, 1.0);
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.set(0, 0, -0.45);
  group.add(wings);

  const finGeo = new THREE.BoxGeometry(0.12, 0.5, 0.7);
  const fin = new THREE.Mesh(finGeo, wingMat);
  fin.position.set(0, 0.2, -0.6);
  group.add(fin);

  const cockpitGeo = new THREE.SphereGeometry(0.22, 12, 10);
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(0, 0.12, 0.15);
  group.add(cockpit);

  // ST-063: rear engine flame (additive, thrust-reactive). Apex anchored at the
  // hull rear (+Z end toward the body) so it only grows backward (-Z) with
  // thrust. Two cones: orange plume + hot near-white core. No per-frame allocs.
  const FLAME_LEN = 1.5;
  const flameOuterGeo = new THREE.ConeGeometry(0.3, FLAME_LEN, 10, 1, true);
  flameOuterGeo.rotateX(Math.PI / 2);
  flameOuterGeo.translate(0, 0, -FLAME_LEN / 2); // pivot at apex
  const flameOuterMat = new THREE.MeshBasicMaterial({
    color: 0xff9a3d, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide,
  });
  const flameOuter = new THREE.Mesh(flameOuterGeo, flameOuterMat);
  flameOuter.position.set(0, 0, -0.8);
  flameOuter.visible = false;
  group.add(flameOuter);

  const CORE_LEN = 1.0;
  const flameCoreGeo = new THREE.ConeGeometry(0.15, CORE_LEN, 8, 1, true);
  flameCoreGeo.rotateX(Math.PI / 2);
  flameCoreGeo.translate(0, 0, -CORE_LEN / 2);
  const flameCoreMat = new THREE.MeshBasicMaterial({
    color: 0xfff2d6, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide,
  });
  const flameCore = new THREE.Mesh(flameCoreGeo, flameCoreMat);
  flameCore.position.set(0, 0, -0.8);
  flameCore.visible = false;
  group.add(flameCore);

  group.position.y = 0.4; // hover just above the arena plane

  function setFlame(thrustMag, t, motionOn) {
    const on = thrustMag > 0.05;
    flameOuter.visible = on;
    flameCore.visible = on;
    if (!on) return;
    // Length tracks thrust; flicker (two incommensurate sines) only when motion is allowed.
    let len = thrustMag;
    if (motionOn) len *= 0.8 + 0.2 * Math.sin(t * 40) + 0.1 * Math.sin(t * 77);
    len = Math.max(0.12, len);
    const w = 0.55 + 0.45 * thrustMag;
    flameOuter.scale.set(w, w, len);
    flameCore.scale.set(w * 0.78, w * 0.78, len * 0.7);
  }

  function sync(ship, t, motionOn, thrustMag) {
    group.position.x = ship.pos.x;
    group.position.z = ship.pos.y;
    group.rotation.y = Math.PI / 2 - ship.aim;
    // Invuln blink (ST-025): ~6 Hz toggle; disabled under reduced motion.
    group.visible = !(motionOn && ship.isInvulnerable && Math.floor(t * 12) % 2 === 1);
    setFlame(thrustMag || 0, t, motionOn); // ST-063: engine flame
  }

  return { group, sync, flame: flameOuter, flameCore };
}
