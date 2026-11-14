// ST-257 (I269): arena floor grid - one static LineSegments (1 draw call,
// same as the PolarGridHelper it replaced). Layout + radial-falloff colors
// come from src/core/floorGrid.js (pure, unit-tested).
// ST-293 (I315): colors use the two-segment rest-band falloff (restFalloff)
// - a flat readable mid-arena plateau, then a steeper rim depth cut.
// ST-328 (I359): fullRingLayout adds a defined center hub (config hubRings,
// full bright anchor) + one moderate rim ring (config rimRing/rimF) on top of
// the five rest-band main rings - same single LineSegments draw call.
//
// Color pipeline: the core returns sRGB triples; this layer converts each
// UNIQUE stop to linear working space once (setRGB with SRGBColorSpace -
// the 3-arg Color constructor would silently treat the values as linear)
// and writes vertex colors on a toneMapped:false LineBasicMaterial - the
// same material shape as the old helper, so ACES/exposure never touch the
// lines and displayed luma ~ configured sRGB (ST-177 FX-off floor).
import * as THREE from "three";
import { restGridColorAt, gridVertexCount, totalRingCount, fullRingLayout, mixRGB } from "../core/floorGrid.js";

export function createArenaFloorGrid(scene, arena) {
  const { radius } = arena;
  const g = arena.grid;
  const bright = hexToRGB(arena.gridBright);
  const dim = hexToRGB(arena.gridDim);

  // Precompute the (few) unique linear-space color stops - no per-vertex
  // allocation, nothing per-frame (static geometry, like the old helper).
  // ST-328 (I359): main + hub + rim rings from fullRingLayout - each entry
  // carries its own level f (main = rest-band curve, hub = hubF, rim = rimF).
  const rings = fullRingLayout(radius, g).map((ring) => ({ r: ring.r, lin: srgbStop(mixRGB(dim, bright, ring.f)) })).sort((a, b) => a.r - b.r);
  const spokeStops = [];
  for (let s = 0; s <= g.spokeSegs; s++) {
    spokeStops.push(srgbStop(restGridColorAt(dim, bright, s / g.spokeSegs, g.restT, g.restHold, g.restPowA, g.restPowB)));
  }

  const verts = new Float32Array(gridVertexCount(totalRingCount(g), g.sectors, g.divisions, g.spokeSegs) * 3);
  const cols = new Float32Array(verts.length);
  let p = 0;
  const put = (x, z, lin) => {
    verts[p] = x;
    verts[p + 1] = 0;
    verts[p + 2] = z;
    cols[p] = lin.r;
    cols[p + 1] = lin.g;
    cols[p + 2] = lin.b;
    p += 3;
  };

  // Rings (closed loops), innermost first (ST-328: hub + main + rim).
  for (const ring of rings) {
    const r = ring.r;
    const lin = ring.lin;
    for (let j = 0; j < g.divisions; j++) {
      const a0 = (j / g.divisions) * Math.PI * 2;
      const a1 = ((j + 1) / g.divisions) * Math.PI * 2;
      put(Math.cos(a0) * r, Math.sin(a0) * r, lin);
      put(Math.cos(a1) * r, Math.sin(a1) * r, lin);
    }
  }

  // Spokes (center -> edge) with per-vertex radial falloff.
  for (let k = 0; k < g.sectors; k++) {
    const ang = (k / g.sectors) * Math.PI * 2;
    const cx = Math.cos(ang);
    const sz = Math.sin(ang);
    for (let s = 0; s < g.spokeSegs; s++) {
      const r0 = (s / g.spokeSegs) * radius;
      const r1 = ((s + 1) / g.spokeSegs) * radius;
      put(cx * r0, sz * r0, spokeStops[s]);
      put(cx * r1, sz * r1, spokeStops[s + 1]);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  const material = new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false });
  const lines = new THREE.LineSegments(geometry, material);
  lines.name = "arenaFloorGrid"; // ST-257
  scene.add(lines);
  return lines;
}

function hexToRGB(hex) {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function srgbStop(rgb) {
  const c = new THREE.Color();
  c.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace);
  return c;
}
