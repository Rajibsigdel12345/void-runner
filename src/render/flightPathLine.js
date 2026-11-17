// ST-454 (E64, I487): the visible race line - a glowing 3D ribbon tracing the flight path
// (curves + elevation) from just behind the ship to well ahead. Render-only, 1 draw call,
// hidden unless update(d, cfg, visible) is called with visible=true. ~segments*2 tris.
import * as THREE from 'three';
import { pathPoint } from '../core/flightPath.js';
export function createFlightPathLine() {
  const dflt = { behind: 6, ahead: 34, width: 0.7, segments: 64, lift: 0.6, color: 0x7fd8ff, opacity: 0.5 };
  let seg = 0, geom = null, mat = null, posAttr = null, mesh = null;
  const group = new THREE.Group(); group.name = 'flightPathLine'; group.visible = false;
  const scratch = { x: 0, y: 0, elev: 0, tx: 0, ty: 0, curv: 0, bankRaw: 0 };
  function ensure(n, cfg) {
    if (geom) geom.dispose(); if (mat) mat.dispose();
    seg = Math.max(2, Math.floor(n));
    geom = new THREE.BufferGeometry();
    posAttr = new THREE.BufferAttribute(new Float32Array((seg + 1) * 2 * 3), 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geom.setAttribute('position', posAttr);
    const idx = new Uint16Array(seg * 6); let k = 0;
    for (let i = 0; i < seg; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
    geom.setIndex(new THREE.BufferAttribute(idx, 1));
    mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: cfg.opacity, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    if (!mesh) { mesh = new THREE.Mesh(geom, mat); mesh.frustumCulled = false; group.add(mesh); }
    else { mesh.geometry = geom; mesh.material = mat; }
  }
  function update(d, cfg, visible) {
    group.visible = !!visible; if (!visible) return;
    const rc = (cfg && cfg.ribbon) || dflt;
    if (!geom || seg !== rc.segments) ensure(rc.segments, rc);
    const arr = posAttr.array, w = rc.width;
    for (let i = 0; i <= seg; i++) {
      const dd = (d - rc.behind) + (i / seg) * (rc.behind + rc.ahead);
      pathPoint(dd, cfg, scratch);
      const px = scratch.x, pz = scratch.y, py = scratch.elev - rc.lift, nx = -scratch.ty, nz = scratch.tx;
      arr[i*6+0] = px + nx*w; arr[i*6+1] = py; arr[i*6+2] = pz + nz*w;
      arr[i*6+3] = px - nx*w; arr[i*6+4] = py; arr[i*6+5] = pz - nz*w;
    }
    posAttr.needsUpdate = true;
  }
  return { group, update, dispose: () => { if (geom) geom.dispose(); if (mat) mat.dispose(); } };
}
