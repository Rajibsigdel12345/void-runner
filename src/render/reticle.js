// Void Runner - fire-line reticle (I44, playtest rec #3). A subtle line from
// the ship nose along the ACTUAL fire direction, so lead-aim is visible while
// the nose eases toward the cursor (aimEase 9). Render-layer only.
import * as THREE from 'three';

const LEN = 5;    // line length beyond the nose (units)
const NOSE = 1.0; // start offset ahead of ship center
const Y = 0.35;   // just above the arena plane

export function createReticle(scene) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(6);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0x6fb8e8, transparent: true, opacity: 0.35 });
  const line = new THREE.Line(geo, mat);
  line.frustumCulled = false;
  line.visible = false;
  scene.add(line);

  function sync(ship, visible) {
    line.visible = !!visible;
    if (!visible) return;
    const f = ship.forward();
    pos[0] = ship.pos.x + f.x * NOSE;          pos[1] = Y; pos[2] = ship.pos.y + f.y * NOSE;
    pos[3] = ship.pos.x + f.x * (NOSE + LEN);  pos[4] = Y; pos[5] = ship.pos.y + f.y * (NOSE + LEN);
    geo.attributes.position.needsUpdate = true;
  }

  return { line, sync };
}
