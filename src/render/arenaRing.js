// Void Runner - arena boundary ring (I212, ST-212). The Blender-made flat
// segmented ring (arena_ring.glb, unit radius) placed at the arena edge, just
// above the polar grid. Static (reduced-motion safe), translucent MeshBasic
// (bloom-safe: color luma below the bloom threshold), +1 draw call. The
// in-code material is authoritative (the GLB carries no vertex colors).
import * as THREE from 'three';

export function createArenaRing(scene, radius) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x4a6cff,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  let mesh = null;
  let geo = null;
  function useGLB(root) {
    let m = null;
    root.traverse((o) => { if (m === null && o.isMesh) m = o; });
    if (!m) return;
    geo = m.geometry;
    mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(radius);
    mesh.position.y = 0.03; // above the polar grid - no z-fight
    scene.add(mesh);
  }
  return { useGLB, mesh: () => mesh, geo: () => geo };
}
