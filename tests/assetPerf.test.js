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

// FINAL fleet budgets (I510/ST-476 E68 close - the fleet is frozen until the next art epic
// re-registers growth WITH MEASUREMENT; caps held at the I509 measured values, headroom for the next epic):
const BUDGET = {
totalFilesKB: 3000,  // [I517 re-pin WITH MEASUREMENT 2700 -> 3000 (ST-483 +hauler); measured 2857.41 KB (2,925,988 B); headroom 142.59 KB]
  totalGeoKB: 2920,    // [I534 re-pin WITH MEASUREMENT 2850 -> 2920 (ST-500 hauler v2 ridge remaster +640 hull tris); measured 2866.07 KB (2,934,858 B); headroom 53.93 KB; ST-501 bulwark + ST-502 gunship v2 re-measure/re-pin at landing + G72.0]
  perFileKB: 600,      // [I517 holds 600; max = ship.glb 567.81 KB (581,440 B); max enemy = wasp 302.77 KB (310,036 B); hauler 258.22 KB (264,416 B)]
  totalTris: 66000,    // [I517 re-pin WITH MEASUREMENT 62,000 -> 66,000 (ST-483 +hauler 3,506 t); measured 63,617 t; headroom 2,383 t]
  perFileMats: 4,      // [I510 FINAL holds 4 (I509 re-pin 3 -> 4); max = enemy_sentry.glb 4 part bakes (R-VALUE 2-3 band rule); ship stays 3]
};

test('exactly 31 GLB assets (29 models + arena ring) (I451 -> I517)', () => {
  assert.equal(glbs.length, 31); // I220: +warden, I235: +stinger, I240: +flyer, I344: +comet, I410: +debris chunk+sliver, I420: +B-variant rocks L/M/S (21 -> 24), I451: +enemy hunter+gunship (24 -> 26), I482 (ST-449): +enemy sentry+wasp (26 -> 28), I516 (ST-482): +enemy phantom+bulwark (28 -> 30), I517 (ST-483): +enemy hauler (30 -> 31)
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
  assert.deepEqual(withColor, ['arena_ring.glb', 'asteroid_L.glb', 'asteroid_L_B.glb', 'asteroid_M.glb', 'asteroid_M_B.glb', 'asteroid_S.glb', 'asteroid_S_B.glb', 'asteroid_comet.glb', 'boss.glb', 'debris_chunk.glb', 'debris_sliver.glb', 'drone.glb', 'enemy_bulwark.glb', 'enemy_gunship.glb', 'enemy_hauler.glb', 'enemy_hunter.glb', 'enemy_phantom.glb', 'enemy_sentry.glb', 'enemy_wasp.glb', 'flyer.glb', 'powerup_bomb.glb', 'powerup_magnet.glb', 'powerup_overdrive.glb', 'powerup_rapid.glb', 'powerup_shield.glb', 'powerup_slowmo.glb', 'powerup_spread.glb', 'ship.glb', 'stinger.glb', 'warden.glb']); // I299/ST-281: + arena ring value bake (16 -> 17); I289/ST-273 warden (stinger core + flyer dome stay emissive-driven); I410: + debris chunk/sliver (18 -> 20); I420: + B-variant rocks L/M/S (20 -> 23); I451/ST-421: + enemy hunter/gunship hull bakes (23 -> 25); I482/ST-449: + enemy sentry (hull bake + barrel identity) + wasp hull bake (25 -> 27); I516/ST-482: + enemy phantom (4-node value bakes) + bulwark (3-node value bakes) (27 -> 29); I517/ST-483: + enemy hauler (5-node value bakes) (29 -> 30)
});
