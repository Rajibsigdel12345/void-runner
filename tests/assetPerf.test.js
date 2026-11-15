// I214: asset perf + memory audit (ST-214, cgs-perf-profile). Pure node -
// pins the per-asset and total geometry/memory budgets measured in the I214
// audit so a future asset pass can't silently blow the memory profile:
// total GLB size, total parsed geometry bytes, per-asset caps, triangle
// count, materials per file, and the no-unused-UV2 rule (TEXCOORD_1 must
// stay absent - it would double texture-fetch pressure for nothing).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const CT = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function parseGlb(buf) {
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  const accBytes = (acc) => acc.count * NS[acc.type] * CT[acc.componentType];
  let geoBytes = 0, tris = 0, verts = 0, uv2 = 0;
  const attrs = new Set();
  const mats = new Set();
  for (const mesh of json.meshes || []) {
    for (const prim of mesh.primitives) {
      const idx = prim.indices !== undefined ? json.accessors[prim.indices] : null;
      tris += Math.floor((idx ? idx.count : 0) / 3);
      for (const [name, ai] of Object.entries(prim.attributes)) {
        const acc = json.accessors[ai];
        attrs.add(name);
        if (name === 'TEXCOORD_1') uv2 += acc.count;
        if (name === 'POSITION') verts += acc.count;
        geoBytes += accBytes(acc);
      }
      if (idx) geoBytes += accBytes(idx);
      mats.add(prim.material);
    }
  }
  return { geoBytes, tris, verts, uv2, attrs, mats: mats.size };
}

const glbs = fs.readdirSync(ASSET_DIR).filter((f) => f.endsWith('.glb')).sort();
const parsed = glbs.map((f) => ({ file: f, size: fs.statSync(path.join(ASSET_DIR, f)).size, ...parseGlb(fs.readFileSync(path.join(ASSET_DIR, f))) }));
const totalSize = parsed.reduce((a, p) => a + p.size, 0);
const totalGeo = parsed.reduce((a, p) => a + p.geoBytes, 0);
const totalTris = parsed.reduce((a, p) => a + p.tris, 0);

// I214 budgets (measured baselines in brackets; caps leave headroom for E9 art growth)
const BUDGET = {
  totalFilesKB: 320,   // [300.67 I430 re-measure: 24 GLBs, boss remaster 6.8 -> 75.3 KB; I429 was 232.26; I420 was 190.44]
  totalGeoKB: 280,     // [264.43 I430 re-measure: 24 GLBs, boss corner-domain COLOR_0 growth; I429 was 196.08; I420 was 153.95]
  perFileKB: 85,       // [max 75.26 - boss.glb I430 remaster; I429 max was ship 62.41]
  totalTris: 4000,     // [I430: 3948 (I429 3442 + 650 new boss - 144 old boss); cap 4000 w/ margin]
  perFileMats: 3,      // [max 3 - ship body/wing/cockpit]
};

test('exactly 24 GLB assets (23 models + arena ring) (I420)', () => {
  assert.equal(glbs.length, 24); // I220: +warden, I235: +stinger, I240: +flyer, I344: +comet, I410: +debris chunk+sliver, I420: +B-variant rocks L/M/S (21 -> 24)
});

test('total GLB file size within budget', () => {
  assert.ok(totalSize <= BUDGET.totalFilesKB * 1024, totalSize / 1024 + ' KB > ' + BUDGET.totalFilesKB + ' KB');
});

test('total parsed geometry within budget', () => {
  assert.ok(totalGeo <= BUDGET.totalGeoKB * 1024, totalGeo / 1024 + ' KB > ' + BUDGET.totalGeoKB + ' KB');
});

test('per-asset file size within budget', () => {
  for (const p of parsed) assert.ok(p.size <= BUDGET.perFileKB * 1024, p.file + ' ' + p.size / 1024 + ' KB exceeds ' + BUDGET.perFileKB + ' KB');
});

test('total triangle count across all assets within budget', () => {
  assert.ok(totalTris <= BUDGET.totalTris, totalTris + ' > ' + BUDGET.totalTris);
});

test('no GLB carries a second UV channel (TEXCOORD_1)', () => {
  for (const p of parsed) assert.equal(p.uv2, 0, p.file + ' has TEXCOORD_1');
});

test('materials per GLB within budget', () => {
  for (const p of parsed) assert.ok(p.mats <= BUDGET.perFileMats, p.file + ' ' + p.mats + ' materials');
});

test('every GLB has POSITION + NORMAL (render layer assumes both)', () => {
  for (const p of parsed) {
    assert.ok(p.attrs.has('POSITION'), p.file + ' missing POSITION');
    assert.ok(p.attrs.has('NORMAL'), p.file + ' missing NORMAL');
  }
});

test('COLOR_0 only on the mottled rocks + boss + ship + enemy bodies + pickup emblems + warden hull/armor + arena ring + debris shards (in-code materials read it; others must not carry it)', () => { // I282: + enemy value bakes; I288/ST-272: + pickup emblem value bakes; I289/ST-273: + warden hull/armor value bakes; I299/ST-281: + arena ring value bake
  const withColor = parsed.filter((p) => p.attrs.has('COLOR_0')).map((p) => p.file).sort();
  assert.deepEqual(withColor, ['arena_ring.glb', 'asteroid_L.glb', 'asteroid_L_B.glb', 'asteroid_M.glb', 'asteroid_M_B.glb', 'asteroid_S.glb', 'asteroid_S_B.glb', 'asteroid_comet.glb', 'boss.glb', 'debris_chunk.glb', 'debris_sliver.glb', 'drone.glb', 'flyer.glb', 'powerup_bomb.glb', 'powerup_magnet.glb', 'powerup_overdrive.glb', 'powerup_rapid.glb', 'powerup_shield.glb', 'powerup_slowmo.glb', 'powerup_spread.glb', 'ship.glb', 'stinger.glb', 'warden.glb']); // I299/ST-281: + arena ring value bake (16 -> 17); I289/ST-273 warden (stinger core + flyer dome stay emissive-driven); I410: + debris chunk/sliver (18 -> 20); I420: + B-variant rocks L/M/S (20 -> 23)
});
