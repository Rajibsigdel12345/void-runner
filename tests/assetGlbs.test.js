// I207: vendored GLB asset audit (ST-207, cgs-asset-audit). Pure node - no DOM,
// no three. Validates the Blender-authored GLBs in assets/ (I211: fifteen total) against the
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
const BUDGETS = { ship: 300, L: 320, M: 120, S: 80, boss: 250, shield: 120, emblem: 60, drone: 100 }; // I210 + I211
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
      prims.push({ name: m.name || '?', tris, maxRadius: Math.sqrt(maxR), posAcc, hasColor: p.attributes.COLOR_0 !== undefined }); // I209
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

test('boss.glb: naming, poly budget, cross-section and height vs spec', () => {
  const { buf, json, binOff } = parseGlb('boss.glb');
  assert.ok(buf.length < MAX_FILE_BYTES, 'boss.glb under 100 KB');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Boss'), 'VR_Boss node');
  assert.ok(s.matNames.includes('VR_Boss'), 'VR_Boss material');
  for (const p of s.prims) assert.ok(p.hasColor, 'boss primitive has COLOR_0 vertex colors (I210)');
  assert.ok(s.totalTris <= BUDGETS.boss, 'boss tris ' + s.totalTris + ' <= 250');
  // Spec: cross-section ~4.1, height ~8.8 (boss.radius 3.4 * 1.2 / * 2.6), +/-10%.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of s.prims) {
    const bv = json.bufferViews[p.posAcc.bufferView];
    for (let i = 0; i < p.posAcc.count; i++) {
      const o = binOff + (bv.byteOffset || 0) + (p.posAcc.byteOffset || 0) + i * 12;
      const x = buf.readFloatLE(o); const y = buf.readFloatLE(o + 4); const z = buf.readFloatLE(o + 8);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  const w = Math.max(maxX - minX, maxZ - minZ);
  const h = maxY - minY;
  assert.ok(Math.abs(w - 4.1) <= 0.41, 'cross-section ' + w.toFixed(3) + ' ~ 4.1');
  assert.ok(Math.abs(h - 8.8) <= 0.88, 'height ' + h.toFixed(3) + ' ~ 8.8');
  // Origin centered (matches the centered BoxGeometry convention, +/-0.5u).
  assert.ok(Math.abs((minX + maxX) / 2) <= 0.5, 'x centered');
  assert.ok(Math.abs((minY + maxY) / 2) <= 0.5, 'y centered');
  assert.ok(Math.abs((minZ + maxZ) / 2) <= 0.5, 'z centered');
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

test('powerup emblems: naming, poly budgets, normalized extents, no vertex colors (I211)', () => {
  for (const [file, target] of Object.entries(EMBLEM_TARGETS)) {
    const { buf, json, binOff } = parseGlb(file + '.glb');
    assert.ok(buf.length < MAX_FILE_BYTES, file + '.glb under 100 KB');
    const s = meshStats({ buf, json, binOff });
    const node = EMBLEM_NODES[file];
    assert.ok(s.nodeNames.includes(node), node + ' node');
    assert.ok(s.matNames.includes(node), node + ' material');
    for (const p of s.prims) assert.ok(!p.hasColor, file + ': no vertex colors (in-code materials authoritative)');
    assert.ok(s.totalTris <= BUDGETS.emblem, file + ' tris ' + s.totalTris + ' <= 60');
    const e = extents({ buf, json, binOff });
    const maxExt = Math.max(e.x, e.y, e.z);
    assert.ok(Math.abs(maxExt - target) / target <= 0.15,
      file + ' max extent ' + maxExt.toFixed(3) + ' within 15% of target ' + target);
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