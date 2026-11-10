// ST-137: WARDEN mini-boss rendering - one armored drone (not pooled).
// I220 (E10): hull + armor geometry from assets/warden.glb (VR_Warden_Hull /
// VR_Warden_Armor) when the asset loads; the procedural fallback below (jittered
// dodecahedron hull + hex plate ring) stays for a failed load. Armor: the plate
// ring retracts and the glow shifts cyan -> hot orange once the armor is spent.
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

  // I155: shape cues (colorblind-friendly) - a spike collar extends once the armor is spent,
  // so the "exposed" state reads by silhouette, not just by the orange glow.
  let shapeCuesOn = true;
  const spikeGeo = new THREE.ConeGeometry(r * 0.16, r * 0.55, 4);
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x8fa3c8, roughness: 0.3, metalness: 0.85, flatShading: true, emissive: 0xff7a3c, emissiveIntensity: 0.5 });
  const spikes = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const holder = new THREE.Object3D();
    holder.rotation.y = (i / 8) * Math.PI * 2;
    const s = new THREE.Mesh(spikeGeo, spikeMat);
    s.position.set(r * 1.35, 0, 0);
    s.rotation.z = -Math.PI / 2; // cone tip (+Y) points outward along the holder
    holder.add(s);
    spikes.add(holder);
  }
  spikes.visible = false;
  group.add(spikes);

  group.visible = false;
  scene.add(group);

  const ARMORED = new THREE.Color(0x19d3c5);
  const EXPOSED = new THREE.Color(0xff7a3c);

  /** sync(warden, t): place the drone, pulse the glow, show the armor state. */
  function sync(warden, t) {
    if (!warden || !warden.alive) { group.visible = false; armor.scale.setScalar(1); spikes.visible = false; return; }
    group.position.set(warden.pos.x, r * 1.1 + 0.3, warden.pos.y);
    group.rotation.y = warden.rot;
    const armored = warden.armor > 0;
    const c = armored ? ARMORED : EXPOSED;
    hullMat.emissive.copy(c);
    hullMat.emissiveIntensity = (armored ? 0.26 : 0.5) + 0.18 * (0.5 + 0.5 * Math.sin(t * (armored ? 2.2 : 5.0)));
    armorMat.emissive.copy(c);
    armor.scale.setScalar(armored ? 1 : 0.62); // spent armor retracts to a thin skirt
    spikes.visible = shapeCuesOn && !armored; // I155: silhouette cue for the exposed state
    group.visible = true;
  }

  // I220 (E10): useGLB(obj) - swap in the Blender Warden geometry. Two meshes by
  // node name: VR_Warden_Hull -> hull, VR_Warden_Armor -> armor plate (the existing
  // sync() drives the armor retract/glow unchanged). In-code materials are kept, so
  // the GLB's own materials are ignored.
  function useGLB(obj) {
    if (!obj) return;
    let hullG = null;
    let armorG = null;
    obj.traverse((n) => {
      if (!n.isMesh) return;
      const nm = n.name || '';
      if (nm.indexOf('Armor') >= 0 && !armorG) armorG = n.geometry;
      else if (!hullG) hullG = n.geometry;
    });
    if (hullG) hull.geometry = hullG;
    if (armorG) armor.geometry = armorG;
  }

  // I155: shape-cue toggle (settings.shapeCues; on by default for colorblind-friendly play).
  function setShapeCues(on) { shapeCuesOn = on === true; }

  return { sync, mesh: group, useGLB, setShapeCues };
}
