// ST-277 (I294): thin radial floor disc under the arena grid - the E25 "arena
// depth cut" (Dota-2 hero ladder / rest area). The grid-only floor let the v7
// lower-hemisphere sky show through, so the perceived floor was a flat ~108-119
// value band with no radial structure (I291 Probe B / I294 baseline bands).
// One CircleGeometry at arena.radius (48 segments = the outer ring's divisions,
// so the rim facets align with the grid's outer ring), one procedural canvas
// radial-gradient texture (in-code 0 KB - no asset), unlit MeshBasic with
// toneMapped:false so displayed luma ~ configured sRGB (same convention as the
// grid lines, ST-177 FX-off floor family). +1 draw call / +48 tris vs the
// grid-only floor: documented spec delta on the MENU 20/318 baseline (I294).
import * as THREE from "three";
import { discGradientStops } from "../core/floorGrid.js";

const SIZE = 256; // canvas texture resolution (procedural)
const SEGMENTS = 48; // = CONFIG.arena.grid.divisions

export function createFloorDisc(scene, arena) {
  const d = arena.floorDisc;
  if (!d) return null;
  const geo = new THREE.CircleGeometry(arena.radius, SEGMENTS);
  const cv = makeRadialCanvas(d);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "arenaFloorDisc"; // ST-277
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = d.y;
  scene.add(mesh);
  return mesh;
}

function makeRadialCanvas(d) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = SIZE;
  const ctx = cv.getContext("2d");
  const g = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2);
  for (const [t, r, gg, b] of discGradientStops(d)) {
    g.addColorStop(t, `rgb(${r},${gg},${b})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  return cv;
}
