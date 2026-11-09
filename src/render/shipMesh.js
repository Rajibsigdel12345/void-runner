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

  group.position.y = 0.4; // hover just above the arena plane

  function sync(ship) {
    group.position.x = ship.pos.x;
    group.position.z = ship.pos.y;
    group.rotation.y = Math.PI / 2 - ship.aim;
  }

  return { group, sync };
}
