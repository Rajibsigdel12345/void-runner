// ST-420 (I450): per-stage arena sky tint - a translucent BackSide dome that washes the
// equirect skybox with the active stage sky color. visible=false whenever no theme is
// active (MENU / endless / stage 1) => 0 draw calls, so the MENU frame budget stays exact.
// Radius sits between the starfield shells (rMax ~230) and the camera far plane (400).
import * as THREE from "three";

export function createThemeDome(scene, radius = 320) {
  const geo = new THREE.SphereGeometry(radius, 32, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff, side: THREE.BackSide, transparent: true, opacity: 0.6,
    depthWrite: false, fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "themeDome";
  mesh.visible = false; // ST-420: only visible when a stage theme is active
  scene.add(mesh);
  function set(theme) {
    if (!theme) { mesh.visible = false; return; }
    mesh.material.color.setHex(theme.sky);
    mesh.visible = true;
  }
  return { mesh, set };
}