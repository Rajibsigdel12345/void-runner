﻿﻿// I207: vendored GLB asset audit (ST-207, cgs-asset-audit). Pure node - no DOM,
// no three. Validates the Blender-authored GLBs in assets/ (I220: sixteen total) against the
// container format, the VR_ naming convention, the poly budgets from
// design/asset-spec.md, and the logical radii in CONFIG (visual/hitbox parity).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../src/core/config.js';

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const GLB_MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a; // 'JSON'
const CHUNK_BIN = 0x004e4942; // 'BIN'

// Poly budgets (design/asset-spec.md; L amended 200 -> 320 at I105).
const BUDGETS = { ship: 300, L: 320, M: 120, S: 80, boss: 250, shield: 120, emblem: 60, drone: 100, arenaRing: 120, warden: 200 }; // I210 + I211 + I212 + I220
const MAX_FILE_BYTES = 100 * 1024;

function parseGlb(file) {
  const buf = fs.readFileSync(path.join(ASSET_DIR, file));
  assert.equal(buf.length > 12, true, file + ': file too small');
  assert.equal(buf.readUInt32LE(0), GLB_MAGIC, file + ': bad magic');
  const version = buf.readUInt32LE(4);
  const declared = buf.readUInt32LE(8);
  assert.equal(version, 2, file + ': expected glTF 2.0');
  assert.equal(declared, buf.length, file + ': declared length != file size');
  let off = 12; let json = null; let binOff = -1;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    if (type === CHUNK_JSON) {
      json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString('utf8'));
    } else if (type === CHUNK_BIN) {
      binOff = off + 8;
    }
    off += 8 + len;
  }
  assert.ok(json, file + ': no JSON chunk');
  assert.ok(binOff >= 0, file + ': no BIN chunk');
  return { buf, json, binOff };
}

function meshStats({ buf, json, binOff }) {
  // Per-primitive triangle count + max vertex radius (world = Blender units).
  const prims = [];
  let totalTris = 0;
  for (const m of json.meshes || []) {
    for (const p of m.primitives || []) {
      const posAcc = json.accessors[p.attributes.POSITION];
      const idxAcc = p.indices !== undefined ? json.accessors[p.indices] : null;
      const count = idxAcc ? idxAcc.count : posAcc.count;
      const tris = Math.round(count / 3);
      totalTris += tris;
      const bv = json.bufferViews[posAcc.bufferView];
      let maxR = 0;
      for (let i = 0; i < posAcc.count; i++) {
        const o = binOff + (bv.byteOffset || 0) + (posAcc.byteOffset || 0) + i * 12;
        const x = buf.readFloatLE(o);
        const y = buf.readFloatLE(o + 4);
        const z = buf.readFloatLE(o + 8);
        const r = x * x + y * y + z * z;
        if (r > maxR) maxR = r;
      }
      prims.push({ name: m.name || '?', tris, maxRadius: Math.sqrt(maxR), posAcc, idxAcc, hasColor: p.attributes.COLOR_0 !== undefined }); // I209 (+idxAcc I254)
    }
  }
  return { prims, totalTris, nodeNames: (json.nodes || []).map((n) => n.name).filter(Boolean), matNames: (json.materials || []).map((m) => m.name) };
}

test('ship.glb: container, naming, poly budget, silhouette dimensions', () => {
  const { buf, json, binOff } = parseGlb('ship.glb');
  assert.ok(buf.length < MAX_FILE_BYTES, 'ship.glb under 100 KB');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Ship_Hull'), 'VR_Ship_Hull node');
  assert.ok(s.nodeNames.includes('VR_Ship_Cockpit'), 'VR_Ship_Cockpit node');
  for (const mat of ['VR_Ship_Hull', 'VR_Ship_Wing', 'VR_Ship_Cockpit']) {
    assert.ok(s.matNames.includes(mat), 'material ' + mat);
  }
  assert.ok(s.totalTris <= BUDGETS.ship, 'ship tris ' + s.totalTris + ' <= 300');
  // Wingspan (x) ~2.5 and length (z) ~1.9 per design/asset-spec.md (+/-10%).
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of s.prims) {
    const bv = json.bufferViews[p.posAcc.bufferView];
    for (let i = 0; i < p.posAcc.count; i++) {
      const o = binOff + (bv.byteOffset || 0) + (p.posAcc.byteOffset || 0) + i * 12;
      const x = buf.readFloatLE(o); const z = buf.readFloatLE(o + 8);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  const span = maxX - minX; const len = maxZ - minZ;
  assert.ok(Math.abs(span - 2.5) <= 0.25, 'wingspan ' + span.toFixed(3) + ' ~ 2.5');
  assert.ok(Math.abs(len - 1.9) <= 0.19, 'length ' + len.toFixed(3) + ' ~ 1.9');
});

test('asteroid L/M/S: naming, poly budgets, radii match CONFIG (+/-5%)', () => {
  for (const size of ['L', 'M', 'S']) {
    const { buf, json, binOff } = parseGlb('asteroid_' + size + '.glb');
    assert.ok(buf.length < MAX_FILE_BYTES, 'asteroid_' + size + '.glb under 100 KB');
    const s = meshStats({ buf, json, binOff });
    assert.ok(s.nodeNames.includes('VR_Rock_' + size), 'VR_Rock_' + size + ' node');
    assert.ok(s.matNames.includes('VR_Rock'), 'VR_Rock material');
    for (const p of s.prims) assert.ok(p.hasColor, size + ' primitive has COLOR_0 vertex colors (I209)');
    assert.ok(s.totalTris <= BUDGETS[size], size + ' tris ' + s.totalTris + ' <= ' + BUDGETS[size]);
    const logical = CONFIG.asteroid.sizes[size].radius;
    const maxR = Math.max(...s.prims.map((p) => p.maxRadius));
    assert.ok(Math.abs(maxR - logical) / logical <= 0.05,
      size + ' max vertex radius ' + maxR.toFixed(4) + ' within 5% of logical ' + logical);
  }
});
// I257 (ST-247 periwinkle incident) -> I264 (ST-253 world micro-pass): pin the COLOR_0
// band of the warm rock bakes. I264 re-baked per-facet value mottling into the SAME
// geometry (Blender 3D value noise, per-size seed; radii/tris/byte budgets unchanged):
// band widens 0.45..1.20 -> 0.30..1.20, warm ordering R>=G>=B unchanged, facet means
// stay at the originals (0.622/0.716/0.636) so brightness is preserved, and the FACET
// luma spread (per-triangle mean luma, p90-p10) becomes a pinned acceptance metric:
// 0.401/0.402/0.418 (L/M/S) vs 0.105/0.083/0.207 pre-bake. I279 (ST-265 rock
// silhouette/value pass) re-baked the SAME geometry with a sign-boosted tanh contrast
// of the re-centered per-size Perlin field (base shifted per rock so the facet-mean
// brightness guard stays solvable): facet means stay within +/-0.005 of the I264
// originals (0.622/0.716/0.636); spreads widen 0.401/0.402/0.418 -> 0.645/0.427/0.489
// (L/M/S) for distance silhouette read at 10u+; POSITION/NORMAL bytes unchanged
// (8956/3764/3188 B). Percentile convention is the
// Blender ground-truth dump convention: sorted, q(f) = v[floor(f*len)].
const ROCK_FACET = {
  L: { p10: 0.319, p50: 0.532, p90: 0.964, mean: 0.6268 },
  M: { p10: 0.501, p50: 0.726, p90: 0.928, mean: 0.721 },
  S: { p10: 0.334, p50: 0.572, p90: 0.823, mean: 0.641 },
};
function facetLumas({ buf, json, binOff }) {
  const p = json.meshes[0].primitives[0];
  const cAcc = json.accessors[p.attributes.COLOR_0];
  const iAcc = json.accessors[p.indices];
  const cBase = binOff + (json.bufferViews[cAcc.bufferView].byteOffset || 0) + (cAcc.byteOffset || 0);
  const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
  const vL = [];
  for (let i = 0; i < cAcc.count; i++) {
    const r = buf.readFloatLE(cBase + i * 12);
    const g = buf.readFloatLE(cBase + i * 12 + 4);
    const b = buf.readFloatLE(cBase + i * 12 + 8);
    vL.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }
  const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i * 2) : iAcc.componentType === 5125 ? buf.readUInt32LE(iBase + i * 4) : buf.readUInt8(iBase + i)); // I264b: glTF spec 5123=UNSIGNED_SHORT (2B), 5121=UNSIGNED_BYTE (1B)
  const fl = [];
  for (let t = 0; t < iAcc.count / 3; t++) {
    fl.push((vL[readIdx(t * 3)] + vL[readIdx(t * 3 + 1)] + vL[readIdx(t * 3 + 2)]) / 3);
  }
  fl.sort((a, b) => a - b);
  const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
  return { p10: q(0.1), p50: q(0.5), p90: q(0.9), mean: fl.reduce((sm, x) => sm + x, 0) / fl.length };
}
test('asteroid L/M/S: COLOR_0 mottling band + warm order + facet luma spread (I257 -> I264 -> I279)', () => {
  for (const size of ['L', 'M', 'S']) {
    const { buf, json, binOff } = parseGlb('asteroid_' + size + '.glb');
    for (const m of json.meshes || []) for (const p of m.primitives || []) {
      assert.ok(p.attributes.COLOR_0 !== undefined, size + ' primitive has COLOR_0');
      const acc = json.accessors[p.attributes.COLOR_0];
      const bv = json.bufferViews[acc.bufferView];
      const stride = parseInt(acc.type.replace('VEC', ''), 10);
      const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);
      let checked = 0;
      for (let i = 0; i < acc.count; i++) {
        const r = buf.readFloatLE(base + i * stride * 4);
        const g = buf.readFloatLE(base + i * stride * 4 + 4);
        const b = buf.readFloatLE(base + i * stride * 4 + 8);
        for (const v of [r, g, b]) {
          assert.ok(v >= 0.30 - 0.01 && v <= 1.20 + 0.01, size + ' COLOR_0 channel in [0.30,1.20] I264 mottling band: ' + v.toFixed(3));
        }
        assert.ok(r >= g - 1e-4 && g >= b - 1e-4, size + ' COLOR_0 warm order R>=G>=B at vertex ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));
        checked++;
      }
      assert.ok(checked > 0, size + ' checked vertices');
    }
    // I264 acceptance metric: measured facet luma spread + brightness preservation.
    const f = facetLumas({ buf, json, binOff });
    const E = ROCK_FACET[size];
    assert.ok(f.p90 - f.p10 >= 0.42, size + ' facet luma spread ' + (f.p90 - f.p10).toFixed(3) + ' >= 0.42 (I279 mottle, was ~0.1-0.2; I264 floor was 0.38)');
    for (const k of ['p10', 'p50', 'p90', 'mean']) {
      assert.ok(Math.abs(f[k] - E[k]) <= 0.005, size + ' facet ' + k + ' ' + f[k].toFixed(3) + ' ~ ' + E[k] + ' (I264 bake pin)');
    }
  }
});

// I264b (ST-253, RULE + correction of the mid-I264 audit misread): glTF componentType is
// 5120 BYTE / 5121 UNSIGNED_BYTE (1B) / 5122 SHORT (2B) / 5123 UNSIGNED_SHORT (2B) /
// 5125 UNSIGNED_INT (4B) / 5126 FLOAT (4B). Blender 5.2.3 declares its u16 index data
// correctly as 5123 - the original GLBs were ALWAYS VALID and three.js r160 rendered
// their true topology. A mid-I264 audit used an inverted table (5123 as 1B) and
// "patched" 5123->5121 in every GLB, which BROKE them (u16 data then read as u8 ->
// scrambled pinwheel topology, caught in the browser A/B; the BEFORE clay-lump shot
// was the TRUE mesh, so the E19 art diagnoses were real critiques, not a bug).
// All 18 GLBs restored: 15 to committed bytes, rocks keep the I264 mottling re-bake
// with the spec-conformant 5123 declaration. RULE: after every Blender GLB export,
// re-parse in Node and assert the packing below (byteLength == count * compSize);
test('all GLBs: index accessors spec-conformant (I264b audit-misread correction + RULE)', () => {
  const COMPSIZE = { 5121: 1, 5123: 2, 5125: 4 }; // glTF spec byte sizes
  const files = fs.readdirSync(ASSET_DIR).filter((f) => f.endsWith('.glb')).sort();
  assert.ok(files.length >= 17, 'expected >= 17 GLBs in assets/');
  for (const file of files) {
    const { buf, json, binOff } = parseGlb(file);
    for (const m of json.meshes || []) {
      for (const p of m.primitives || []) {
        assert.ok(p.indices !== undefined, file + ' ' + (m.name || '?') + ' primitive is indexed');
        const acc = json.accessors[p.indices];
        const bv = json.bufferViews[acc.bufferView];
        assert.ok(COMPSIZE[acc.componentType] !== undefined, file + ' index compType ' + acc.componentType + ' in {5121,5123,5125}');
        assert.equal(bv.byteLength, acc.count * COMPSIZE[acc.componentType],
          file + ' ' + (m.name || '?') + ' index bufferView tightly packed (count ' + acc.count + ' x ' + COMPSIZE[acc.componentType] + ' B)');
        // data sanity in the DECLARED component: every index within the vertex count
        const posCount = json.accessors[p.attributes.POSITION].count;
        const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);
        for (let i = 0; i < acc.count; i++) {
          const v = acc.componentType === 5123 ? buf.readUInt16LE(base + i * 2) : acc.componentType === 5125 ? buf.readUInt32LE(base + i * 4) : buf.readUInt8(base + i);
          assert.ok(v < posCount, file + ' index ' + i + ' = ' + v + ' < vertCount ' + posCount);
        }
      }
    }
  }
});

// I263 (ST-252 boss hero pass): rebuilt in Blender - hull facet mottling re-baked STRONGER
// (hull 0.33..0.88 vs the old 0.72..1.0, crown 0.49..0.93, core 0.72..1.00) as a single
// grayscale COLOR_0 per mesh; crown spikes got real volume; core seam sits in FRONT (+Z,
// the player side, export_yup=True maps Blender -Y -> game +Z). EXPORT RECIPE PIN: the
// material must stay assigned AND the VERTEX_COLOR node wired into Base Color, because
// Blender 5.2's glTF exporter writes GARBAGE COLOR_0 data when the attribute is not used
// by a node tree (I263 incident: export_materials='NONE' produced a zeroed/garbage buffer -
// the JSON declared the accessor but the BIN held uninitialized memory). Materials remain
// in the file; bossMesh.js ignores them (in-code palette, I248 pattern).
test('boss.glb: naming, poly budget, cross-section and height vs spec (ST-252)', () => {
  const { buf, json, binOff } = parseGlb('boss.glb');
  assert.ok(buf.length <= 14 * 1024, 'boss.glb ' + buf.length + ' B <= 14 KB (ST-252 budget)');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Boss_Hull'), 'VR_Boss_Hull node');
  assert.ok(s.nodeNames.includes('VR_Boss_Crown'), 'VR_Boss_Crown node');
  assert.ok(s.nodeNames.includes('VR_Boss_Core'), 'VR_Boss_Core node');
  // The material-present export recipe is what writes real COLOR_0 data (I263 incident).
  for (const n of ['VR_Boss_HullMat', 'VR_Boss_CrownMat', 'VR_Boss_CoreMat']) assert.ok(s.matNames.includes(n), n + ' material (export recipe)');
  assert.ok(s.totalTris <= BUDGETS.boss, 'boss tris ' + s.totalTris + ' <= 250');
  // Exactly one COLOR_0 per primitive - never a COLOR_1 (the duplicate-attribute trap).
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    assert.ok(p.attributes.COLOR_0 !== undefined, m.name + ' primitive has COLOR_0');
    assert.equal(p.attributes.COLOR_1, undefined, m.name + ' has NO COLOR_1 (single-channel mottling)');
  }
  // Spec: same obelisk ring structure as the I248 fallback (rings y -4.35/0/3.30, crown
  // spike to ~5.2): cross-section ~4.0, height ~9.6 (+/-10%). Per-mesh bounds below also
  // pin the ST-252 orientation: core seam in FRONT (+Z, player side), crown ON TOP (+Y).
  const meshB = {};
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const m of json.meshes || []) {
    for (const p of m.primitives || []) {
      const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
      const posAcc = json.accessors[p.attributes.POSITION];
      const bv = json.bufferViews[posAcc.bufferView];
      for (let i = 0; i < posAcc.count; i++) {
        const o = binOff + (bv.byteOffset || 0) + (posAcc.byteOffset || 0) + i * 12;
        const x = buf.readFloatLE(o); const y = buf.readFloatLE(o + 4); const z = buf.readFloatLE(o + 8);
        if (x < b.minX) b.minX = x; if (x > b.maxX) b.maxX = x;
        if (y < b.minY) b.minY = y; if (y > b.maxY) b.maxY = y;
        if (z < b.minZ) b.minZ = z; if (z > b.maxZ) b.maxZ = z;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }
      meshB[m.name || '?'] = b;
    }
  }
  const w = Math.max(maxX - minX, maxZ - minZ);
  const h = maxY - minY;
  assert.ok(Math.abs(w - 4.0) <= 0.40, 'cross-section ' + w.toFixed(3) + ' ~ 4.0');
  assert.ok(Math.abs(h - 9.6) <= 0.96, 'height ' + h.toFixed(3) + ' ~ 9.6');
  // Origin centered (matches the centered BoxGeometry convention, +/-0.5u).
  assert.ok(Math.abs((minX + maxX) / 2) <= 0.5, 'x centered');
  assert.ok(Math.abs((minY + maxY) / 2) <= 0.5, 'y centered');
  assert.ok(Math.abs((minZ + maxZ) / 2) <= 0.5, 'z centered');
  // ST-252 orientation (export_yup=True: tall along +Y, player-facing front = +Z).
  const core = meshB['VR_Boss_CoreMesh'] || meshB['VR_Boss_Core'];
  const crown = meshB['VR_Boss_CrownMesh'] || meshB['VR_Boss_Crown'];
  assert.ok(core && crown, 'core + crown meshes found (' + Object.keys(meshB).join(',') + ')');
  assert.ok(core.minZ > 0.3, 'core seam in FRONT of mid-plane (minZ ' + core.minZ.toFixed(3) + ' > 0.3)');
  assert.ok(core.maxZ > 0.5, 'core reads from the player side (maxZ ' + core.maxZ.toFixed(3) + ' > 0.5)');
  assert.ok(crown.minY > 0, 'crown on TOP (minY ' + crown.minY.toFixed(3) + ' > 0)');
  assert.ok(h > w, 'tall along Y (h ' + h.toFixed(2) + ' > w ' + w.toFixed(2) + ')');
  // I267 (ST-255) hull mottling: grayscale, panelled, in [0.18,1.00] - a WIDER spread than
  // the old ST-252 bake (hull now 0.21..0.95, vs 0.33..0.88) so the obelisk reads against
  // the cool sky. min below 0.30 AND max above 0.90 -> facet value spread > 0.9, not a flat slab.
  for (const m of json.meshes || []) {
    for (const p of m.primitives || []) {
      const acc = json.accessors[p.attributes.COLOR_0];
      const bv = json.bufferViews[acc.bufferView];
      const stride = parseInt(acc.type.replace('VEC', ''), 10); // accessor type, never itemSize (I257)
      const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);
      let cMin = Infinity, cMax = -Infinity;
      for (let i = 0; i < acc.count; i++) {
        const r = buf.readFloatLE(base + i * stride * 4);
        const g = buf.readFloatLE(base + i * stride * 4 + 4);
        const b = buf.readFloatLE(base + i * stride * 4 + 8);
        assert.ok(Math.abs(r - g) <= 0.02 && Math.abs(g - b) <= 0.02, m.name + ' COLOR_0 grayscale at ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));
        assert.ok(r >= 0.18 - 0.01 && r <= 1.0 + 0.01, m.name + ' COLOR_0 in [0.18,1.00] at ' + i + ': ' + r.toFixed(3));
        if (r < cMin) cMin = r; if (r > cMax) cMax = r;
      }
      if ((m.name || '').indexOf('Hull') >= 0) {
        assert.ok(cMin < 0.30, 'hull mottling min ' + cMin.toFixed(3) + ' < 0.30 (I267 darker floor; old bake was 0.33)');
        assert.ok(cMax > 0.90, 'hull mottling max ' + cMax.toFixed(3) + ' > 0.90 (I267 brighter top; old bake was 0.88)');
      }
    }
  }
});
test('shield.glb: naming, poly budget, unit radius (I210)', () => {
  const { buf, json, binOff } = parseGlb('shield.glb');
  assert.ok(buf.length < MAX_FILE_BYTES, 'shield.glb under 100 KB');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Shield'), 'VR_Shield node');
  assert.ok(s.matNames.includes('VR_Shield'), 'VR_Shield material');
  assert.ok(s.totalTris <= BUDGETS.shield, 'shield tris ' + s.totalTris + ' <= 120');
  const maxR = Math.max(...s.prims.map((p) => p.maxRadius));
  assert.ok(Math.abs(maxR - 1.0) <= 0.05, 'shield max vertex radius ' + maxR.toFixed(4) + ' ~ 1.0');
});

// I211: power-up emblems + drone (ST-211, cgs-dev-story).

const EMBLEM_TARGETS = {
  powerup_rapid: 0.9, powerup_spread: 0.85, powerup_shield: 1.0, powerup_bomb: 0.95,
  powerup_magnet: 0.88, powerup_overdrive: 0.85, powerup_slowmo: 0.9,
};
const EMBLEM_NODES = {
  powerup_rapid: 'VR_PU_Rapid', powerup_spread: 'VR_PU_Spread', powerup_shield: 'VR_PU_Shield',
  powerup_bomb: 'VR_PU_Bomb', powerup_magnet: 'VR_PU_Magnet', powerup_overdrive: 'VR_PU_Overdrive',
  powerup_slowmo: 'VR_PU_Slowmo',
};

function extents({ buf, json, binOff }) {
  // Per-axis min/max over all primitives (world = Blender units).
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const m of json.meshes || []) {
    for (const p of m.primitives || []) {
      const acc = json.accessors[p.attributes.POSITION];
      const bv = json.bufferViews[acc.bufferView];
      for (let i = 0; i < acc.count; i++) {
        const o = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0) + i * 12;
        for (let k = 0; k < 3; k++) {
          const v = buf.readFloatLE(o + k * 4);
          if (v < min[k]) min[k] = v;
          if (v > max[k]) max[k] = v;
        }
      }
    }
  }
  return { x: max[0] - min[0], y: max[1] - min[1], z: max[2] - min[2] };
}

// I288 (ST-272 pickup emblem value pass): each emblem now carries a grayscale per-face
// COLOR_0 value bake (Blender 5.2, corner-domain, vertex-split on export - shield +2 verts)
// that multiplies the in-code per-type tint (powerupMesh.js TYPES + vertexColors:true):
// rapid = distinct gold (0xffc300; was 0xffe066 - hue-collided with spread orange), spread =
// orange (0xff9f43 unchanged). Geometry UNCHANGED (extents/tris pins in this test hold).
const PU_FACET = {
  powerup_rapid:     { p10: 0.720, p50: 1.250, p90: 1.250 }, // sRGB-agnostic linear bake domain [0.30, 1.25]
  powerup_spread:    { p10: 0.712, p50: 0.828, p90: 1.161 },
  powerup_shield:    { p10: 0.615, p50: 1.250, p90: 1.250 },
  powerup_bomb:      { p10: 0.703, p50: 1.000, p90: 1.250 },
  powerup_magnet:    { p10: 0.580, p50: 1.000, p90: 1.250 },
  powerup_overdrive: { p10: 0.595, p50: 1.000, p90: 1.250 },
  powerup_slowmo:    { p10: 0.864, p50: 1.000, p90: 1.250 },
};

test('powerup emblems: naming, poly budgets, normalized extents, grayscale COLOR_0 value bake (I211 -> I288)', () => {
  for (const [file, target] of Object.entries(EMBLEM_TARGETS)) {
    const { buf, json, binOff } = parseGlb(file + '.glb');
    assert.ok(buf.length < MAX_FILE_BYTES, file + '.glb under 100 KB');
    const s = meshStats({ buf, json, binOff });
    const node = EMBLEM_NODES[file];
    assert.ok(s.nodeNames.includes(node), node + ' node');
    assert.ok(s.matNames.includes(node), node + ' material');
    assert.ok(s.totalTris <= BUDGETS.emblem, file + ' tris ' + s.totalTris + ' <= 60');
    const e = extents({ buf, json, binOff });
    const maxExt = Math.max(e.x, e.y, e.z);
    assert.ok(Math.abs(maxExt - target) / target <= 0.15,
      file + ' max extent ' + maxExt.toFixed(3) + ' within 15% of target ' + target);
    // I288/ST-272: exactly one primitive carries a grayscale COLOR_0 value bake in [0.30,1.25]
    let bakePrims = 0;
    for (const m of json.meshes || []) for (const p of m.primitives || []) {
      if (p.attributes.COLOR_0 === undefined) continue;
      bakePrims++;
      const acc = json.accessors[p.attributes.COLOR_0];
      const bv = json.bufferViews[acc.bufferView];
      const stride = parseInt(acc.type.replace('VEC', ''), 10);
      assert.equal(acc.componentType, 5126, file + ' COLOR_0 componentType FLOAT');
      assert.equal(acc.type, 'VEC3', file + ' COLOR_0 type VEC3');
      assert.ok(bv.byteLength >= acc.count * stride * 4, file + ' COLOR_0 bufferView spec-size');
      const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);
      for (let i = 0; i < acc.count; i++) {
        const r = buf.readFloatLE(base + i * stride * 4);
        const g = buf.readFloatLE(base + i * stride * 4 + 4);
        const b = buf.readFloatLE(base + i * stride * 4 + 8);
        assert.ok(Math.abs(r - g) <= 0.02 && Math.abs(g - b) <= 0.02, file + ' COLOR_0 grayscale at ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));
        assert.ok(r >= 0.30 - 0.01 && r <= 1.25 + 0.01, file + ' COLOR_0 in [0.30,1.25] value domain at ' + i + ': ' + r.toFixed(3));
      }
    }
    assert.equal(bakePrims, 1, file + ': exactly one primitive carries the value bake');
    // facet luma spread + pins (shared reader with the I282 enemy bodies)
    const f = enemyFacetLumas({ buf, json, binOff });
    const E = PU_FACET[file];
    assert.ok(f.p90 - f.p10 >= 0.35, file + ' facet luma spread ' + (f.p90 - f.p10).toFixed(3) + ' >= 0.35 (I288 value bake; pre-bake was a flat in-code tint)');
    for (const k of ['p10', 'p50', 'p90']) {
      assert.ok(Math.abs(f[k] - E[k]) <= 0.005, file + ' facet ' + k + ' ' + f[k].toFixed(3) + ' ~ ' + E[k] + ' (I288 bake pin)');
    }
  }
});

test('drone.glb: naming, poly budget, dart dimensions vs procedural parity (I211)', () => {
  const { buf, json, binOff } = parseGlb('drone.glb');
  assert.ok(buf.length < MAX_FILE_BYTES, 'drone.glb under 100 KB');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Drone'), 'VR_Drone node');
  assert.ok(s.matNames.includes('VR_Drone'), 'VR_Drone material');
  assert.ok(s.totalTris <= BUDGETS.drone, 'drone tris ' + s.totalTris + ' <= 100');
  const e = extents({ buf, json, binOff });
  // Procedural parity: octahedron r=0.7 scaled (1.6, 0.85, 0.85) -> length 2.24 along X, cross ~1.19.
  assert.ok(Math.abs(e.x - 2.24) / 2.24 <= 0.15, 'drone X extent ' + e.x.toFixed(3) + ' ~ 2.24');
  const cross = Math.max(e.y, e.z);
  assert.ok(Math.abs(cross - 1.19) / 1.19 <= 0.15, 'drone cross ' + cross.toFixed(3) + ' ~ 1.19');
});

// I282 (ST-267 enemy value/shape art pass): the drone/stinger/flyer BODIES carry a
// grayscale per-face COLOR_0 value bake (Blender 5.2, corner-domain, vertex-split on
// export) that multiplies the in-code family tint (CONFIG.{drone,stinger,flyer}.palette.body.color):
// drone = steel-cyan mid (bright nose / dark belly, clears the skybox mid-band), stinger =
// deep-violet needle (dark body, white-hot telegraph tip is the read), flyer = mauve saucer
// (bright deck / dark keel, magenta dome carries the hue). Geometry UNCHANGED (extents/tris
// pins above hold); only the color attribute was added. Core + dome primitives stay without
// COLOR_0 (per-instance emissive materials drive them).
const ENEMY_FACET = {
  drone:   { p10: 0.570, p50: 0.830, p90: 1.180 }, // sRGB-agnostic linear bake domain [0.30, 1.25]
  stinger: { p10: 0.580, p50: 0.760, p90: 0.980 },
  flyer:   { p10: 0.320, p50: 0.820, p90: 1.120 }, // facet-domain p10 (keel faces); the per-corner read was 0.370
};
function enemyFacetLumas({ buf, json, binOff }) {
  // Find the primitive carrying COLOR_0 (the body) and read per-face luma through the
  // index accessor (vertex-split colors: COLOR_0 count == POSITION count).
  let p = null;
  for (const m of json.meshes || []) for (const q of m.primitives || []) if (q.attributes.COLOR_0 !== undefined) p = q;
  assert.ok(p, 'body primitive with COLOR_0');
  const cAcc = json.accessors[p.attributes.COLOR_0];
  const iAcc = json.accessors[p.indices];
  const cBase = binOff + (json.bufferViews[cAcc.bufferView].byteOffset || 0) + (cAcc.byteOffset || 0);
  const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
  const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i * 2) : iAcc.componentType === 5125 ? buf.readUInt32LE(iBase + i * 4) : buf.readUInt8(iBase + i));
  const fl = [];
  for (let t = 0; t < iAcc.count / 3; t++) {
    const i0 = readIdx(t * 3), i1 = readIdx(t * 3 + 1), i2 = readIdx(t * 3 + 2);
    const lum = (i) => {
      const o = cBase + i * 12;
      return 0.2126 * buf.readFloatLE(o) + 0.7152 * buf.readFloatLE(o + 4) + 0.0722 * buf.readFloatLE(o + 8);
    };
    fl.push((lum(i0) + lum(i1) + lum(i2)) / 3);
  }
  fl.sort((a, b) => a - b);
  const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
  return { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
}
test('drone/stinger/flyer bodies: grayscale COLOR_0 value bake band + facet spread (I282)', () => {
  for (const name of ['drone', 'stinger', 'flyer']) {
    const { buf, json, binOff } = parseGlb(name + '.glb');
    let bodyChecked = 0;
    for (const m of json.meshes || []) for (const p of m.primitives || []) {
      if (p.attributes.COLOR_0 === undefined) continue; // core/dome: emissive-driven, no bake
      bodyChecked++;
      const acc = json.accessors[p.attributes.COLOR_0];
      const bv = json.bufferViews[acc.bufferView];
      const stride = parseInt(acc.type.replace('VEC', ''), 10);
      const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);
      for (let i = 0; i < acc.count; i++) {
        const r = buf.readFloatLE(base + i * stride * 4);
        const g = buf.readFloatLE(base + i * stride * 4 + 4);
        const b = buf.readFloatLE(base + i * stride * 4 + 8);
        assert.ok(Math.abs(r - g) <= 0.02 && Math.abs(g - b) <= 0.02, name + ' COLOR_0 grayscale at ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));
        assert.ok(r >= 0.30 - 0.01 && r <= 1.25 + 0.01, name + ' COLOR_0 in [0.30,1.25] value domain at ' + i + ': ' + r.toFixed(3));
      }
    }
    assert.equal(bodyChecked, 1, name + ': exactly one body primitive carries the bake (core/dome stay emissive-driven)');
    const f = enemyFacetLumas({ buf, json, binOff });
    const E = ENEMY_FACET[name];
    assert.ok(f.p90 - f.p10 >= 0.35, name + ' facet luma spread ' + (f.p90 - f.p10).toFixed(3) + ' >= 0.35 (I282 value bake; pre-bake was a flat in-code tint)');
    for (const k of ['p10', 'p50', 'p90']) {
      assert.ok(Math.abs(f[k] - E[k]) <= 0.005, name + ' facet ' + k + ' ' + f[k].toFixed(3) + ' ~ ' + E[k] + ' (I282 bake pin)');
    }
  }
});


// I212: arena boundary ring (ST-212, cgs-dev-story). I254/ST-245 v2: two-node GLB
// (VR_ArenaRing band + VR_ArenaRing_Ticks neon accent). The v1 exact-48-tris pin is
// replaced by the two-node counts (band 48 + ticks 12 = 60), documented here.
test('arena_ring.glb: 2 nodes (band+ticks), 60 tris, flat unit ring, +Y normals, no vertex colors (I212/I254)', () => {
  const { buf, json, binOff } = parseGlb('arena_ring.glb');
  assert.ok(buf.length < MAX_FILE_BYTES, 'arena_ring.glb under 100 KB');
assert.ok(buf.length <= 4096, 'arena_ring.glb v2 <= 4 KB raw (' + buf.length + ' B)'); // I254
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_ArenaRing'), 'VR_ArenaRing node');
assert.ok(s.nodeNames.includes('VR_ArenaRing_Ticks'), 'VR_ArenaRing_Ticks node (I254)');
  assert.ok(s.matNames.includes('VR_ArenaRing'), 'VR_ArenaRing material');
assert.ok(s.matNames.includes('VR_ArenaRing_Ticks'), 'VR_ArenaRing_Ticks material (I254)');
  for (const p of s.prims) assert.ok(!p.hasColor, 'no vertex colors (in-code material authoritative)');
  assert.equal(s.totalTris, 60, 'exactly 60 tris (I254 v2: band 48 + ticks 12; v1 was 48)');
  assert.ok(s.totalTris <= BUDGETS.arenaRing, 'ring tris ' + s.totalTris + ' <= ' + BUDGETS.arenaRing);
  // I254 v2: per-primitive flat/+Y/radius checks (band = outer, ticks = inner accent).
  function primStats(p) {
    const bv = json.bufferViews[p.posAcc.bufferView];
    let maxAbsY = 0, minR = Infinity, maxRR = 0, up = 0, total = 0;
    for (let i = 0; i < p.posAcc.count; i++) {
      const o = binOff + (bv.byteOffset || 0) + (p.posAcc.byteOffset || 0) + i * 12;
      const x = buf.readFloatLE(o); const y = buf.readFloatLE(o + 4); const z = buf.readFloatLE(o + 8);
      if (Math.abs(y) > maxAbsY) maxAbsY = Math.abs(y);
      const r = Math.sqrt(x * x + z * z);
      if (r < minR) minR = r;
      if (r > maxRR) maxRR = r;
    }
    const acc = p.posAcc;
    const idxAcc = p.idxAcc; // I254: v2 GLBs are indexed - face count lives in the index accessor
    const bv2 = json.bufferViews[acc.bufferView];
    const faceCount = idxAcc ? Math.round(idxAcc.count / 3) : Math.round(acc.count / 3);
    for (let f = 0; f < faceCount; f++) {
      const v = (k) => {
        // I264: read indices per DECLARED component (spec-conformant). The I254 version
        // special-cased the unpatched Blender u16-as-u8 exports; now that the accessor is
        // correctly typed, the conformant read IS the true index.
        const iBase = binOff + (json.bufferViews[idxAcc.bufferView].byteOffset || 0) + (idxAcc.byteOffset || 0);
        const vi = idxAcc
          ? (idxAcc.componentType === 5123 ? buf.readUInt16LE(iBase + (f * 3 + k) * 2)
            : idxAcc.componentType === 5125 ? buf.readUInt32LE(iBase + (f * 3 + k) * 4)
            : buf.readUInt8(iBase + (f * 3 + k)))
          : f * 3 + k;
        return binOff + (bv2.byteOffset || 0) + (acc.byteOffset || 0) + vi * 12;
      };
      const ax = buf.readFloatLE(v(1)) - buf.readFloatLE(v(0));
      const az = buf.readFloatLE(v(1) + 8) - buf.readFloatLE(v(0) + 8);
      const bx = buf.readFloatLE(v(2)) - buf.readFloatLE(v(0));
      const bz = buf.readFloatLE(v(2) + 8) - buf.readFloatLE(v(0) + 8);
      total++;
      if (az * bx - ax * bz > 0) up++;
    }
    return { maxAbsY, minR, maxR: maxRR, up, total };
  }
  const bandP = s.prims.find((p) => p.name === 'VR_ArenaRing');
  const tickP = s.prims.find((p) => p.name === 'VR_ArenaRing_Ticks');
  assert.ok(bandP && tickP, 'band + ticks primitives (I254 two-node GLB)');
  assert.equal(bandP.tris, 48, 'band 24 plates x 2 tris');
  assert.equal(tickP.tris, 12, 'ticks 12 wedges x 1 tri');
  const bp = primStats(bandP);
  assert.ok(bp.maxAbsY < 1e-4, 'band flat maxAbsY ' + bp.maxAbsY.toExponential(2));
  assert.ok(Math.abs(bp.maxR - 1.0) <= 0.05, 'band max vertex radius ' + bp.maxR.toFixed(4) + ' ~ 1.0');
  assert.ok(Math.abs(bp.minR - 0.94) <= 0.01, 'band inner radius ' + bp.minR.toFixed(4) + ' ~ 0.94');
  const tp = primStats(tickP);
  assert.ok(tp.maxAbsY < 1e-4, 'ticks flat maxAbsY ' + tp.maxAbsY.toExponential(2));
  assert.ok(tp.maxR < 0.94, 'ticks stay inside the band (maxR ' + tp.maxR.toFixed(4) + ')');
  assert.ok(tp.minR >= 0.88, 'ticks inner extent ' + tp.minR.toFixed(4) + ' >= 0.88');
  assert.equal(bp.up, bp.total, 'band all face normals +Y');
  assert.equal(tp.up, tp.total, 'ticks all face normals +Y');
  });

// I220: Warden mini-boss (ST-218, cgs-dev-story) - armored sentinel: jagged dodeca
// hull with spike accents + separate armor-plate mesh (VR_Warden_Armor) that the
// in-code armor-state animation drives (retract + cyan->orange glow).
test('warden.glb: naming, poly budget, hull/armor radii vs CONFIG (I220)', () => {
  const { buf, json, binOff } = parseGlb('warden.glb');
  assert.ok(buf.length <= 40 * 1024, 'warden.glb under 40 KB');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Warden_Hull'), 'VR_Warden_Hull node');
  assert.ok(s.nodeNames.includes('VR_Warden_Armor'), 'VR_Warden_Armor node');
  assert.ok(s.matNames.includes('VR_Warden_Hull'), 'VR_Warden_Hull material');
  assert.ok(s.matNames.includes('VR_Warden_Armor'), 'VR_Warden_Armor material');
  for (const p of s.prims) assert.ok(!p.hasColor, 'no vertex colors (in-code materials authoritative)');
  assert.ok(s.totalTris <= BUDGETS.warden, 'warden tris ' + s.totalTris + ' <= 200');
  const hull = s.prims.find((p) => p.name.includes('Hull'));
  const armor = s.prims.find((p) => p.name.includes('Armor'));
  const r = CONFIG.warden.radius;
  assert.ok(hull.maxRadius >= r * 0.95, 'hull covers the logical body (' + hull.maxRadius.toFixed(3) + ')');
  assert.ok(hull.maxRadius <= r * 1.25, 'hull max radius ' + hull.maxRadius.toFixed(3) + ' <= r*1.25 (spike accents stay inside the armor ring)');
  assert.ok(Math.abs(armor.maxRadius - r * 1.55) / (r * 1.55) <= 0.10,
    'armor outer radius ' + armor.maxRadius.toFixed(3) + ' ~ r*1.55 (procedural plate-ring parity)');
});