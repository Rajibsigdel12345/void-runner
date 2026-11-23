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

// FINAL fleet budgets (I561/ST-527 E76 D5 - the fleet is frozen until the next art epic
// re-registers growth WITH MEASUREMENT; caps held at the I561 measured values, headroom for the next epic):
const BUDGET = {
totalFilesKB: 3940,  // [I561 (ST-527 E76 D5) RE-PIN WITH MEASUREMENT 3900 -> 3940: +38,600 B 3-ship enemy remaster (724,156 -> 762,756 B); measured 3,915.41 KB (4,009,384 B); headroom 24.59 KB; prior I554: 3,877.72 KB (3,970,784 B)]
  totalGeoKB: 3870,    // [I561 (ST-527 E76 D5) RE-PIN WITH MEASUREMENT 3830 -> 3870: +40,752 B remaster geometry (3,899,694 -> 3,940,446 B); measured 3,848.09 KB; headroom 21.91 KB; prior I554: 3,808.29 KB (3,899,694 B)]
  perFileKB: 760,      // [I541 re-pin WITH MEASUREMENT 600 -> 760 (ST-507 ship v7); max = ship.glb 722.67 KB (740,012 B); max enemy = wasp 302.77 KB (310,036 B)]
  totalTris: 91050,    // [I561 (ST-527 E76 D5) RE-PIN WITH MEASUREMENT 90,800 -> 91,050: +240 t remaster (9,974 -> 10,214 t across phantom/sweeper/hauler); measured 90,977 t; headroom 73 t; prior I554: 90,737 t]
  perFileMats: 5,      // [I561 (ST-527 E76 D5) RE-PIN WITH MEASUREMENT 4 -> 5: max = enemy_hauler.glb 5 part bakes (hull/sponsonL/sponsonR/hatch/stack); prior max = enemy_sentry.glb 4 part bakes; ship stays 3]
};

test('exactly 34 GLB assets (32 models + arena ring) (I451 -> I553)', () => {
  assert.equal(glbs.length, 34); // I220: +warden, I235: +stinger, I240: +flyer, I344: +comet, I410: +debris chunk+sliver, I420: +B-variant rocks L/M/S (21 -> 24), I451: +enemy hunter+gunship (24 -> 26), I482 (ST-449): +enemy sentry+wasp (26 -> 28), I516 (ST-482): +enemy phantom+bulwark (28 -> 30), I517 (ST-483): +enemy hauler (30 -> 31), I552 (ST-518 E75 D3): +enemy sweeper+beacon (31 -> 33), I553 (ST-519 E75 D4): +boss archon (33 -> 34)
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
  assert.deepEqual(withColor, ['arena_ring.glb', 'asteroid_L.glb', 'asteroid_L_B.glb', 'asteroid_M.glb', 'asteroid_M_B.glb', 'asteroid_S.glb', 'asteroid_S_B.glb', 'asteroid_comet.glb', 'boss.glb', 'boss_archon.glb', 'debris_chunk.glb', 'debris_sliver.glb', 'drone.glb', 'enemy_beacon.glb', 'enemy_bulwark.glb', 'enemy_gunship.glb', 'enemy_hauler.glb', 'enemy_hunter.glb', 'enemy_phantom.glb', 'enemy_sentry.glb', 'enemy_sweeper.glb', 'enemy_wasp.glb', 'flyer.glb', 'powerup_bomb.glb', 'powerup_magnet.glb', 'powerup_overdrive.glb', 'powerup_rapid.glb', 'powerup_shield.glb', 'powerup_slowmo.glb', 'powerup_spread.glb', 'ship.glb', 'stinger.glb', 'warden.glb']); // I299/ST-281: + arena ring value bake (16 -> 17); I289/ST-273 warden (stinger core + flyer dome stay emissive-driven); I410: + debris chunk/sliver (18 -> 20); I420: + B-variant rocks L/M/S (20 -> 23); I451/ST-421: + enemy hunter/gunship hull bakes (23 -> 25); I482/ST-449: + enemy sentry (hull bake + barrel identity) + wasp hull bake (25 -> 27); I516/ST-482: + enemy phantom (4-node value bakes) + bulwark (3-node value bakes) (27 -> 29); I517/ST-483: + enemy hauler (5-node value bakes) (29 -> 30); I552/ST-518 (E75 D3): + enemy sweeper (3-node value bakes) + beacon (3-node value bakes) (30 -> 32); I553/ST-519 (E75 D4): + boss archon (3-node value bakes) (32 -> 33)
});
