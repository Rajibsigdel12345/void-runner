// Void Runner - procedural ship mesh (ST-006). Low-poly, no external assets.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

export function createShipMesh() {
  const group = new THREE.Group();
  group.name = 'ship';

  // I104: body parts live in a sub-group so a GLB swap (useGLB) can replace
  // the whole procedural hull without touching the in-code additive flames.
  const shipBody = new THREE.Group();
  shipBody.name = 'ship_body';
  group.add(shipBody);

  // ST-251 (I262): palette is data-driven (CONFIG.ship.palette; E19 warm-world hero pass).
  // The cockpit cyan emissive stays the FROZEN identity accent - pinned in
  // tests/paletteHarmony.test.js; retune only via a design pass.
  const P = CONFIG.ship.palette;
  const bodyMat = new THREE.MeshStandardMaterial({ color: P.body.color, metalness: P.body.metalness, roughness: P.body.roughness, flatShading: true });
  const wingMat = new THREE.MeshStandardMaterial({ color: P.wing.color, metalness: P.wing.metalness, roughness: P.wing.roughness, flatShading: true });
  const cockpitMat = new THREE.MeshStandardMaterial({ color: P.cockpit.color, emissive: P.cockpit.emissive, emissiveIntensity: P.cockpit.emissiveIntensity, roughness: P.cockpit.roughness });

  const bodyGeo = new THREE.ConeGeometry(0.55, 1.7, 4);
  bodyGeo.rotateX(Math.PI / 2); // tip toward +Z (forward in render space)
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1, 0.5, 1);
  shipBody.add(body);

  const wingGeo = new THREE.BoxGeometry(2.5, 0.1, 1.0);
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.set(0, 0, -0.45);
  shipBody.add(wings);

  const finGeo = new THREE.BoxGeometry(0.12, 0.5, 0.7);
  const fin = new THREE.Mesh(finGeo, wingMat);
  fin.position.set(0, 0.2, -0.6);
  shipBody.add(fin);

  const cockpitGeo = new THREE.SphereGeometry(0.22, 12, 10);
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(0, 0.12, 0.15);
  shipBody.add(cockpit);

// ST-237 (I244) hero pass: engine nozzle + emissive engine mouth at the flame origin (I213 trail
// origin, z = -0.8). Both sit INSIDE the existing ship box (x +-1.25, y -0.275..0.45,
// z -0.95..0.85: body-diamond bottom .. fin top) so the Blender GLB matches the procedural
// fallbacks exact extent (browser-verified parity; tests/assetPerf.test.js pins the sizes).
const nozzleGeo = new THREE.CylinderGeometry(0.18, 0.3, 0.25, 6);
nozzleGeo.rotateX(Math.PI / 2); // axis along Z: radiusTop (0.18) faces forward +Z, flare 0.3 at the rear
const nozzle = new THREE.Mesh(nozzleGeo, bodyMat);
nozzle.position.set(0, 0, -0.775); // spans z -0.90..-0.65 (flame apex at -0.8 emerges from it)
shipBody.add(nozzle);

const mouthGeo = new THREE.CircleGeometry(0.16, 8);
mouthGeo.rotateY(Math.PI); // face -Z (visible from astern)
const mouth = new THREE.Mesh(mouthGeo, cockpitMat); // the emissive slot - glows like the canopy
mouth.position.set(0, 0, -0.902); // 2 mm proud of the nozzle flare, no z-fight
shipBody.add(mouth);

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

  // I104: useGLB(obj) - swap the procedural body for the Blender ship.
  // Materials are overridden by name to guarantee the exact in-code palette
  // (Blender's sRGB->linear conversion may have shifted the baked colors).
  let glbSwapped = false;
  function useGLB(obj) {
    if (!obj || glbSwapped) return;
    glbSwapped = true;
    group.remove(shipBody);
    shipBody.traverse((n) => { if (n.isMesh) n.geometry.dispose(); });
    obj.traverse((n) => {
      if (!n.isMesh) return;
      const nm = (n.material && n.material.name) || '';
      if (nm.indexOf('Cockpit') !== -1) n.material = cockpitMat;
      else if (nm.indexOf('Wing') !== -1) n.material = wingMat; // wing + fin
      else n.material = bodyMat;
    });
    group.add(obj);
  }

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

  return { group, sync, flame: flameOuter, flameCore, useGLB };
}
