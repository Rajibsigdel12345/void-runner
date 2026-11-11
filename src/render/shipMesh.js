// Void Runner - procedural ship mesh (ST-006). Low-poly, no external assets.
import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { flameScales } from '../core/flame.js'; // ST-256 (I268): layered flame math (pure core)

// ST-256 (I268): canvas textures for the layered flame - built once, no per-frame allocs.
// The falloff map fades the plume toward its tail: cone UV v=1 is the apex and
// CanvasTexture flipY maps canvas y=0 to v=1, so gradient stop 0 (opaque) sits at
// the apex (nozzle root) and fades to clear at the tail (base). No hard prop tip.
function makeFlameFalloffTexture() {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');    // apex (v=1): opaque
  grad.addColorStop(0.75, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');    // base (v=0): soft tail
  g.fillStyle = grad;
  g.fillRect(0, 0, 2, 64);
  return new THREE.CanvasTexture(c);
}
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.4)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
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

  // ST-256 (I268): layered engine flame - a hot white core inside a warm orange plume
  // (soft length falloff, no hard prop tip), + an additive glow sprite at the nozzle
  // root (no new geometry: the two existing cones + one sprite). All sizes come
  // from CONFIG.ship.flame via flameScales() (pure core, unit-tested). Both cones
  // are UNIT (radius 1, length 1, pivot at the apex) so every dimension is
  // data-driven. Apex anchored at the hull rear (z=-0.8, inside the nozzle) so the
  // flame only grows backward (-Z). No per-frame allocs (textures built once).
  const F = CONFIG.ship.flame;
  const flameTex = makeFlameFalloffTexture();
  const midGeo = new THREE.ConeGeometry(1, 1, 10, 1, true);
  midGeo.rotateX(Math.PI / 2);
  midGeo.translate(0, 0, -0.5); // pivot at apex (z=0), base (wide end) at z=-1
  const midMat = new THREE.MeshBasicMaterial({
    color: F.mid.color, map: flameTex, transparent: true, opacity: F.mid.opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const flameMid = new THREE.Mesh(midGeo, midMat);
  flameMid.position.set(0, 0, -0.8);
  flameMid.visible = false;
  group.add(flameMid);

  const coreGeo = new THREE.ConeGeometry(1, 1, 8, 1, true);
  coreGeo.rotateX(Math.PI / 2);
  coreGeo.translate(0, 0, -0.5);
  const coreMat = new THREE.MeshBasicMaterial({
    color: F.core.color, map: flameTex, transparent: true, opacity: F.core.opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const flameCore = new THREE.Mesh(coreGeo, coreMat);
  flameCore.position.set(0, 0, -0.8);
  flameCore.visible = false;
  group.add(flameCore);

  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    color: F.glow.color, map: makeGlowTexture(), transparent: true, opacity: F.glow.opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glowSprite.position.set(0, 0, -0.88); // just behind the nozzle mouth (-0.902 faces -Z)
  glowSprite.visible = false;
  group.add(glowSprite);

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
    const on = thrustMag > 0.05; // ST-063 gate (unchanged)
    flameMid.visible = on;
    flameCore.visible = on;
    glowSprite.visible = on;
    if (!on) return;
    // ST-256: layered scales + deterministic flicker (flameScales, pure core).
    const s = flameScales(thrustMag, t, motionOn);
    flameMid.scale.set(s.midRadius, s.midRadius, s.midLen);
    flameMid.rotation.x = s.swayX;
    flameMid.rotation.y = s.swayY;
    flameCore.scale.set(s.coreRadius, s.coreRadius, s.coreLen);
    flameCore.rotation.x = s.swayX * 1.4;
    flameCore.rotation.y = s.swayY * 1.4;
    glowSprite.scale.setScalar(s.glowScale);
    glowSprite.material.opacity = s.glowOpacity;
  }

  function sync(ship, t, motionOn, thrustMag) {
    group.position.x = ship.pos.x;
    group.position.z = ship.pos.y;
    group.rotation.y = Math.PI / 2 - ship.aim;
    // Invuln blink (ST-025): ~6 Hz toggle; disabled under reduced motion.
    group.visible = !(motionOn && ship.isInvulnerable && Math.floor(t * 12) % 2 === 1);
    setFlame(thrustMag || 0, t, motionOn); // ST-063: engine flame
  }

  return { group, sync, flame: flameMid, flameCore, flameGlow: glowSprite, useGLB };
}
