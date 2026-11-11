// Void Runner - arena boundary ring (I212, ST-212; v2 I254/ST-245). The Blender-made flat
// segmented ring (arena_ring.glb, unit radius) placed at the arena edge, just
// above the polar grid. Static (reduced-motion safe), translucent MeshBasic
// (band color luma below the bloom threshold), +2 draw calls (I254: was +1).
// The in-code materials are authoritative (the GLB carries no vertex colors).
//
// I254/ST-245 v2: two-node GLB - VR_ArenaRing (outer band, 24 plates) renders
// slim (I264: 0x4059e0 op 0.42; pre-I264 0x4a6cff op 0.55; DoubleSide, depthWrite false, y 0.03) and
// VR_ArenaRing_Ticks (12 wedge ticks at the major seams, r 0.895-0.93) renders
// a brighter MeshBasic that CROSSES the 0.72 bloom threshold = the intended
// neon accent (band luma stays below). Ticks sit 5 mm above the band -
// no z-fight. Fallback: if the ticks node is missing (v1 GLB) the old
// single-mesh behavior is kept.
import * as THREE from 'three';

// Luma ~0.91 > 0.72 bloom threshold - the intended neon accent.
const TICK_COLOR = 0xdfe9ff;

export function createArenaRing(scene, radius) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x4059e0, // I264 (ST-253): slimmed darker (0x4a6cff pre-I264)
    transparent: true,
    opacity: 0.42, // I264 (ST-253): slimmed (0.55 pre-I264); ticks untouched
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const tickMat = new THREE.MeshBasicMaterial({
    color: TICK_COLOR,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  let group = null;
  let mesh = null;
  let tickMesh = null;
  let geo = null;
  function useGLB(root) {
    let band = null, ticks = null, first = null;
    root.traverse((o) => {
      if (!o.isMesh) return;
      if (first === null) first = o;
      if (o.name === 'VR_ArenaRing_Ticks') ticks = o; // I254
      else if (o.name === 'VR_ArenaRing') band = o;
    });
    if (!band && ticks) band = first;      // ticks consumed the first mesh
    if (!band) band = first;               // v1 GLB (single node) fallback
    if (!band) return;
    group = new THREE.Group();
    group.name = 'ArenaRing';
    group.scale.setScalar(radius);
    scene.add(group);
    geo = band.geometry;
    mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.03; // above the polar grid - no z-fight (I212, unchanged)
    group.add(mesh);
    if (ticks) {
      tickMesh = new THREE.Mesh(ticks.geometry, tickMat); // I254: neon accent (+1 draw call)
      tickMesh.position.y = 0.035; // 5 mm above the band - no z-fight
      group.add(tickMesh);
    }
  }
  return { useGLB, mesh: () => mesh, tickMesh: () => tickMesh, group: () => group, geo: () => geo };
}
