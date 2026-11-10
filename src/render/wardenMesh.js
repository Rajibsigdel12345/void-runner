// ST-137: WARDEN mini-boss rendering - one armored drone (not pooled), procedural.
// Hull: jittered dodecahedron. Armor: a hex plate ring around the core that retracts
// and the glow shifts cyan -> hot orange once the armor is spent (visual armor state).
import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { CONFIG } from '../core/config.js';

function bakeDroneGeometry() {
  const r = CONFIG.warden.radius;
  const geo = new THREE.DodecahedronGeometry(r, 0);
  const pos = geo.attributes.position;
  const rng = new RNG(0x5c4e); // fixed seed: same drone every load
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.x += (rng.next() - 0.5) * 0.16;
    v.y += (rng.next() - 0.5) * 0.12;
    v.z += (rng.next() - 0.5) * 0.16;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createWardenMesh(scene) {
  const r = CONFIG.warden.radius;
  const group = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x2c3548, roughness: 0.4, metalness: 0.55, flatShading: true,
    emissive: 0x19d3c5, emissiveIntensity: 0.3,
  });
  const hull = new THREE.Mesh(bakeDroneGeometry(), hullMat);
  group.add(hull);

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x8fa3c8, roughness: 0.3, metalness: 0.85, flatShading: true,
    emissive: 0x19d3c5, emissiveIntensity: 0.12,
  });
  const armor = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.45, r * 1.55, r * 0.28, 6, 1), armorMat);
  armor.rotation.y = Math.PI / 6; // stagger the hex plate from the core facets
  group.add(armor);

  group.visible = false;
  scene.add(group);

  const ARMORED = new THREE.Color(0x19d3c5);
  const EXPOSED = new THREE.Color(0xff7a3c);

  /** sync(warden, t): place the drone, pulse the glow, show the armor state. */
  function sync(warden, t) {
    if (!warden || !warden.alive) { group.visible = false; armor.scale.setScalar(1); return; }
    group.position.set(warden.pos.x, r * 1.1 + 0.3, warden.pos.y);
    group.rotation.y = warden.rot;
    const armored = warden.armor > 0;
    const c = armored ? ARMORED : EXPOSED;
    hullMat.emissive.copy(c);
    hullMat.emissiveIntensity = (armored ? 0.26 : 0.5) + 0.18 * (0.5 + 0.5 * Math.sin(t * (armored ? 2.2 : 5.0)));
    armorMat.emissive.copy(c);
    armor.scale.setScalar(armored ? 1 : 0.62); // spent armor retracts to a thin skirt
    group.visible = true;
  }

  // ST-211 (E9): useGLB(obj) - swap in the Blender drone geometry (hull only); the
  // in-code materials are kept, so a GLB's own materials are ignored.
  function useGLB(obj) {
    if (!obj) return;
    let g = null;
    obj.traverse((n) => { if (n.isMesh && !g) g = n.geometry; });
    if (g) hull.geometry = g;
  }

  return { sync, mesh: group, useGLB };
}
