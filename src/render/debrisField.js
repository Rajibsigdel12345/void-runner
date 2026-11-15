// Void Runner - transient 3D debris shatter pool (ST-381, E50). On enemy/asteroid
// death a short burst of tumbling low-poly shards (Blender GLB: faceted flat-shaded,
// luma-neutral COLOR_0, per-class tint) flies out, spins, and fades - the 3D cousin
// of the 2D particles.burst, on top of the existing flash + shake. Render-only,
// motion-gated, additive juice (see design/feel.md; the E8 feel freeze is on tuning
// values, new additive effects are the established E34-50 pattern).
//
// Pool contract (design/asset-spec.md "Debris shards (E50 / ST-380)"):
// - 2 InstancedMesh (chunk + sliver), SHARED live cap = CONFIG.debris.pool. Oldest
//   shard is stolen when full. mesh.count = live-in-mesh; visible = false at 0 live
//   -> +0 steady-state draw calls (the frozen playframe pins are no-death frames).
// - Scripted motion, no physics engine: random unit impulse (y x yBias = outward
//   spray), speed +/- speedJitter, exponential damping (damping per 1/60 s), tumble
//   on a random axis at spinMin..spinMax rad/s, pop-in 0.4 -> 1.0 over popTime
//   (easeOut), fade = scale -> 0 over the final fadeFrac of life + tint dim to
//   tintDim over the full life.
// - Geometry: procedural faceted fallback until the GLB resolves (fire-and-forget,
//   no boot gate - same pattern as every other asset); setGeometry swaps in place.
import * as THREE from 'three';

// module-scope scratch (no per-frame allocation)
const _m = new THREE.Matrix4();
const _spinQ = new THREE.Quaternion();
const _axis = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();
const _tint = new THREE.Color();

function withWhiteColor(geo) {
  // Fallback geometries need a color attribute: the shared material is
  // vertexColors:true (the GLB carries COLOR_0; white = 1.0 neutral).
  const n = geo.attributes.position.count;
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  return geo;
}

export function createDebrisField(scene, cfg) {
  const CAP = Math.max(1, Math.floor(cfg.pool));
  // The in-code material is authoritative (design/asset-spec.md): white Lambert +
  // vertexColors + flatShading; the GLB's VR_Debris material is ignored.
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, flatShading: true });
  const fallbackChunk = withWhiteColor(new THREE.IcosahedronGeometry(0.5, 0)); // 20 tris faceted (GLB = 48)
  const fallbackSliver = withWhiteColor(new THREE.BoxGeometry(0.55, 0.07, 0.35)); // 12 tris plate (GLB = 48)

  function makeMesh(geo) {
    const im = new THREE.InstancedMesh(geo, material, CAP);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3); // pre-allocated (setColorAt would lazily)
    im.instanceColor.setUsage(THREE.DynamicDrawUsage);
    im.count = 0;
    im.visible = false; // +0 draw calls at rest
    im.frustumCulled = false; // shards fly around the death point - skip cull-box recompute
    scene.add(im);
    return im;
  }
  const meshes = [makeMesh(fallbackChunk), makeMesh(fallbackSliver)]; // 0 = chunk, 1 = sliver

  // Per-(mesh, slot) live state - allocated once, compacted on write each update.
  const slots = meshes.map(() => {
    const a = new Array(CAP);
    for (let i = 0; i < CAP; i++) {
      a[i] = { live: false, age: 0, life: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, ax: 1, ay: 0, az: 0, spin: 0, q: new THREE.Quaternion(), base: 1, tr: 1, tg: 1, tb: 1 };
    }
    return a;
  });

  let live = 0;
  let cursor = 0; // alternates chunk/sliver for varied silhouettes

  /**
   * Shatter burst at sim (x, y). Render-layer Math.random - NEVER in sim pins.
   * @param {{count?:number,speed?:number,life?:number,scaleMin?:number,scaleMax?:number,tint?:number}} o
   */
  function spawnShatter(x, y, o) {
    const n = Math.max(0, Math.min(Math.floor(o.count || 0), CAP));
    if (n === 0) return;
    const speed = o.speed != null ? o.speed : 6;
    const life = o.life != null ? o.life : 0.5;
    const sMin = o.scaleMin != null ? o.scaleMin : 0.4;
    const sMax = o.scaleMax != null ? o.scaleMax : 0.8;
    _tint.set(o.tint != null ? o.tint : 0xffffff);
    for (let k = 0; k < n; k++) {
      let mi = cursor & 1;
      cursor++;
      let idx = -1;
      if (live < CAP) {
        // Shared cap not reached: total live < CAP means every mesh holds < CAP,
        // so the preferred (cursor-alternated) mesh always has a free slot.
        for (let i = 0; i < CAP; i++) if (!slots[mi][i].live) { idx = i; break; }
      }
      if (idx < 0) {
        // Shared live cap reached (live >= CAP): steal the OLDEST live shard
        // across both meshes; the new shard takes the stolen slot (spec: shared
        // live cap with oldest steal - per-mesh full is NOT the trigger).
        let bestAge = -1, bestMi = mi, bestI = 0;
        for (let m2 = 0; m2 < 2; m2++) {
          for (let i = 0; i < CAP; i++) {
            const s = slots[m2][i];
            if (s.live && s.age > bestAge) { bestAge = s.age; bestMi = m2; bestI = i; }
          }
        }
        slots[bestMi][bestI].live = false;
        live -= 1;
        mi = bestMi; idx = bestI;
      }
      const s = slots[mi][idx];
      s.live = true;
      s.age = 0;
      s.life = life;
      // Impulse: random direction, y x yBias (outward spray, not straight up), speed +/- speedJitter
      let dx = Math.random() * 2 - 1;
      let dy = (Math.random() * 2 - 1) * cfg.yBias;
      let dz = Math.random() * 2 - 1;
      const il = Math.hypot(dx, dy, dz) || 1;
      const sp = speed * (1 + (Math.random() * 2 - 1) * cfg.speedJitter);
      s.vx = (dx / il) * sp; s.vy = (dy / il) * sp; s.vz = (dz / il) * sp;
      // Death point + 0.15 jitter, 0.1 above the debris plane (particles ride 0.4)
      s.x = x + (Math.random() * 2 - 1) * 0.15;
      s.y = cfg.height + 0.1;
      s.z = y + (Math.random() * 2 - 1) * 0.15;
      // Tumble: random unit axis, spinMin..spinMax rad/s
      let axx = Math.random() * 2 - 1, axy = Math.random() * 2 - 1, axz = Math.random() * 2 - 1;
      const al = Math.hypot(axx, axy, axz) || 1;
      s.ax = axx / al; s.ay = axy / al; s.az = axz / al;
      s.spin = cfg.spinMin + Math.random() * (cfg.spinMax - cfg.spinMin);
      s.q.identity();
      s.base = sMin + Math.random() * (sMax - sMin);
      s.tr = _tint.r; s.tg = _tint.g; s.tb = _tint.b;
      live += 1;
    }
  }

  /**
   * Advance the pool. Safe to call every frame (early-out at 0 live).
   * @param {number} dt seconds
   */
  function update(dt) {
    if (dt <= 0) return;
    const damp = Math.pow(cfg.damping, dt * 60); // damping per 1/60 s, exponential in dt
    const fadeStart = 1 - cfg.fadeFrac;
    for (let mi = 0; mi < 2; mi++) {
      const im = meshes[mi];
      const sl = slots[mi];
      let w = 0; // dense write index (only first `count` instances draw)
      for (let i = 0; i < CAP; i++) {
        const s = sl[i];
        if (!s.live) continue;
        s.age += dt;
        if (s.age >= s.life) { s.live = false; live -= 1; continue; }
        s.vx *= damp; s.vy *= damp; s.vz *= damp;
        s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
        _spinQ.setFromAxisAngle(_axis.set(s.ax, s.ay, s.az), s.spin * dt);
        s.q.premultiply(_spinQ);
        // Scale envelope: pop 0.4 -> 1.0 (easeOut) then -> 0 over the final fadeFrac
        const pu = Math.min(1, s.age / cfg.popTime);
        const pop = 0.4 + 0.6 * (1 - (1 - pu) * (1 - pu));
        const t = s.age / s.life;
        const f = t > fadeStart ? (1 - t) / cfg.fadeFrac : 1;
        const sc = Math.max(0, s.base * pop * f);
        _m.compose(_pos.set(s.x, s.y, s.z), s.q, _scl.set(sc, sc, sc));
        im.setMatrixAt(w, _m);
        const dim = 1 - (1 - cfg.tintDim) * t; // tint dim to tintDim over the full life
        im.setColorAt(w, _tint.setRGB(s.tr * dim, s.tg * dim, s.tb * dim));
        w++;
      }
      im.count = w;
      im.visible = w > 0;
      if (w > 0) {
        im.instanceMatrix.needsUpdate = true;
        im.instanceColor.needsUpdate = true;
      }
    }
  }

  /**
   * Swap in the Blender geometry in place (fire-and-forget GLB resolve). Expects
   * the loaded gltf.scene root; uses the first Mesh with a color attribute
   * (GLB COLOR_0 -> geometry attribute 'color'). Stays procedural on any miss.
   * @param {'chunk'|'sliver'} kind
   * @param {THREE.Object3D} gltfScene
   */
  function setGeometry(kind, gltfScene) {
    let mesh = null;
    gltfScene.traverse((o) => { if (!mesh && o.isMesh) mesh = o; });
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes.color) return; // fallback stays
    const im = kind === 'sliver' ? meshes[1] : meshes[0];
    const old = im.geometry;
    im.geometry = mesh.geometry;
    old.dispose(); // the swap-in geometry is owned by this InstancedMesh alone
  }

  return { meshes, spawnShatter, update, setGeometry, get live() { return live; } };
}
