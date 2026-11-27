﻿﻿﻿﻿﻿﻿﻿// I207: vendored GLB asset audit (ST-207, cgs-asset-audit). Pure node - no DOM,
// no three. Validates the Blender-authored GLBs in assets/ (I220: sixteen total; I410: 21 incl. debris shards; I420: 24 incl. B-variant rocks; I451: 26 incl. enemy hunter/gunship) against the
// container format, the VR_ naming convention, the poly budgets from
// design/asset-spec.md, and the logical radii in CONFIG (visual/hitbox parity).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../src/core/config.js';
import { createRequire } from 'node:module';

const requireCjs = createRequire(import.meta.url);
const MeshoptDecoder = requireCjs(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'meshoptimizer', 'meshopt_decoder.cjs'));
await MeshoptDecoder.ready; // I609 (ST-574 E88): EXT_meshopt_compression - the meshopt wasm must be ready before any decode (same wasm the browser GLTFLoader uses)

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const GLB_MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a; // 'JSON'
const CHUNK_BIN = 0x004e4942; // 'BIN'

// Poly budgets (design/asset-spec.md; L amended 200 -> 320 at I105; L/M/S 320/120/80 -> 500/140/140 at I307 (bump+crater relief); ship 300 -> 850 at I429 (ST-399 remaster, 818-tri fighter; design/asset-spec-ship-remaster.md)).
const BUDGETS = { ship: 82151, L: 12000, M: 4000, S: 1600, comet: 2400, boss: 2352, shield: 120, emblem: 60, drone: 2080, arenaRing: 120, warden: 2290, chunk: 60, stinger: 2396, flyer: 2264, sliver: 50, hunter: 3366, gunship: 2906, sentry: 2934, wasp: 4020, phantom: 6656, bulwark: 7408, hauler: 7722, sweeper: 4004, beacon: 4830, archon: 10740 }; // I622 (ST-582 E90 D2 Archon v2 swap) RE-PIN WITH MEASUREMENT archon 3108 -> 10740 (measured 10,740 t post-GLB: hull 5,688 + crown 3,184 + core 1,868; 241,800 B encoded <= 250,000 B E90 D2 ceiling held via 336 t AMENDMENT trim [24 band studs + 4 rear-exhaust boxes]; RAD 5.7876; .evidence/I622/audit_glb622.cjs + probe622.cjs + encode622.cjs) // I621 (ST-581 E90 D1 rock v13 swap) RE-PIN WITH MEASUREMENT L/M/S/comet 6000/1800/700/1120 -> 12000/4000/1600/2400 (v13 silhouette-break remaster: broad lobes + pinches + ridges + ejecta streaks on the v12 c/mc/b relief; fresh seeds 77101/77203/77307/77409; radii EXACT 2.2/1.3/0.7; encoded 215,880/216,728/74,388/73,968/31,804/31,376/43,872 B = 688,016 B total <= 900,000 B E90 D1 ceiling; .evidence/I621/measure621.cjs + measure621fleet.cjs) // I618 (ST-579 E89 D5 beacon v3 swap) RE-PIN WITH MEASUREMENT beacon 3144 -> 4830 (measured 4,830 t post-GLB on the 172,276 B encoded file; base 2,572 + tower 1,696 + lamp 562; extents X 3.3400 / Y 0.8750 / Z 3.3800 + towerY 2.0800 + lampY 0.7400 hold the I552 extent windows - zero extent re-pins; ENEMY451_FACET base p50 0.3680 -> 0.3716 / tower p10 0.4663 -> 0.4700 p50 0.5000 -> 0.5023 p90 0.7000 -> 0.5195; .evidence/I618/audit_beacon618.cjs) // I617 (ST-579 E89 D4 sweeper v4 swap) RE-PIN WITH MEASUREMENT sweeper 1946 -> 4004 (measured 4,004 t post-GLB on the 116,196 B encoded file; hull 2,170 + arc 1,130 + greeble 704; hull X 2.8400 / Y 0.4925 / Z 2.0000 + arc Z 1.9217 + RAD 1.7655 class 0.9157 hold the I561 extent windows - zero extent re-pins; ENEMY451_FACET hull p50 0.5000 -> 0.4691 / p90 0.5500 -> 0.5000; .evidence/I617/audit_sweeper617.cjs) // I616 (ST-579 E89 D3 bulwark v3 swap) RE-PIN WITH MEASUREMENT bulwark 3160 -> 7408 (measured 7,408 t post-GLB on the 183,852 B encoded file; shield 4,146 + spine 2,140 + core 1,122; envelope held - I535 extent windows unchanged; .evidence/I616/audit_bulwark616.cjs) // I615 (ST-579 E89 D2 hauler v4 swap) RE-PIN WITH MEASUREMENT hauler 3724 -> 7722 (measured 7,722 t post-GLB on the 271,956 B encoded file; hull 5,460 + sponsonL 622 + sponsonR 622 + hatch 456 + stack 562; v3 envelope [x -0.902..0.820 / y -0.597..0.895 / z -0.597..0.597] + RAD 1.2727 class 1.0595 hold the I561 windows; hatch X extent 0.2600 -> 0.3040 re-pin WITH measurement; .evidence/I615/audit_hauler615.cjs) // I614 (ST-579 E89 D1 phantom v6 swap) RE-PIN WITH MEASUREMENT phantom 4544 -> 6656 (measured 6,656 t post-GLB on the 239,140 B encoded file; hull 4,228 + podL 880 + podR 880 + nose 668; envelope [x -0.82..0.86 / y -0.215..0.395 / z -0.375..0.375] + RAD 0.9691 hold the I561 windows; .evidence/I614/audit_phantom614.cjs) // I613 (ST-578 E89 boss v3 swap) RE-PIN WITH MEASUREMENT boss 1500 -> 2352 (measured 2,352 t post-GLB on the 79,996 B encoded file; hull 1,648 + crown 348 + core 356; cross-section 4.3441 / height 10.5000 inside the ST-252 windows; .evidence/I613/audit_boss613.cjs) // I612 (ST-577 E89 ship v9 swap) RE-PIN WITH MEASUREMENT 62254 -> 82151 (measured 82,151 t post-GLB on the 1,441,348 B encoded file; build-space 85,118 t, GLTF export dedupe -2,967; span 4.0111 / len 2.7253 hold the I454 windows; .evidence/I612/measure612.mjs); I554 (ST-520 E75 D5) rock v12 RE-PIN WITH MEASUREMENT: L/M/S/comet 3200/950/380/650 -> 6000/1800/700/1120 (measure554.cjs; pinned tight to measurement; supersedes I456 rock caps) // I553 (ST-519 E75 D4): +archon 3108 t (hull 1916 + crown 752 + core 440), pinned tight to measurement (measure553.mjs) // I552 (ST-518 E75 D3): +sweeper 3006 t (hull 2234 + arc 424 + greeble 348) +beacon 3144 t (base 1564 + tower 1204 + lamp 376), pinned tight to measurement (I552 art phase, measure552.mjs) // I541 (ST-507 E73 ship v7) ship 25563 -> 32499 (measured 32,499 t / 740,012 B; span 4.021 / len 2.600 unchanged, MAX_FILE_BYTES 1,048,576 holds) // + I482 (ST-449 sentry/wasp caps 1800/1200; actual 1096/792) + I501 (ST-467 ship v6 real-airship remaster 19000 -> 25563, measured 25,563 t / 581,440 B; pinned tight to measurement - the asset landed 9,137 t under the 34,700 aim so the pre-registered 38,500 was not needed; future growth requires an explicit re-pin) // I210 + I211 + I212 + I220 + I307 + I344 (comet) + I410 (debris) + I421 (comet re-bake) + I429 (ST-399 ship remaster 300 -> 850, actual 818; tighter than pre-registered ~1200) + I430 (ST-400 boss remaster 250 -> 750, actual 650) + I435 (ST-405 ship remaster v2 850 -> 4500, actual 3254) + I436 (ST-406 M v9 subdivided realism 140 -> 520, actual 500; M_B same topology) + I440 (ST-410 ship remaster v3 4500 -> 14000, actual 12400) + I441 (ST-411 rock L/L_B v10 remaster 500 -> 2100, actual 1980; comet re-bake 200 -> 650, actual 590) + I451 (ST-421 enemy GLBs: hunter 1432t / gunship 1688t, cap 2400) + I454 (ST-424 ship v4 "real airship" 14000 -> 19000, actual 14276) + I456 (ST-426 rock L/M/S v11 density remaster 2100/520/140 -> 3200/950/380, actual 3000/900/350; boss 750 -> 1500, actual 1425) + I508 (ST-474 E68 legacy-4 remaster) drone/warden caps 100/200 -> 1800/1800 (spec aim 1400) + I509 (ST-475 E68 remaster-4 re-pin WITH measurement) hunter/gunship/sentry/wasp 3366/2596/2934/4020 (wasp 1200 -> 4020: wing-mirror rebuild, double blade 2400 t) + I516 (ST-482 E69 phantom/bulwark 2336/2700, pinned tight to measurement) + I517 (ST-483 E69 hauler 3506, pinned tight to measurement) + I587 (ST-554 E83 ship v8 swap) ship 32499 -> 62254 (measured 62,254 t post-GLB-import / 1,402,896 B; build-space 64,884 t, GLTF export dedupe -2,630; span 4.0125 / len 2.7160 hold the I454 windows; .evidence/I587/repin_measure587b.mjs) // I593 (ST-560 E84) legacy-4 v2 RE-PIN WITH MEASUREMENT: drone 1800 -> 2080 / warden 1800 -> 2290; stinger 2396 / flyer 2264 keys ADDED (measure593.cjs post-GLB: set 6,574 -> 9,030 t)
const MAX_FILE_BYTES = 1658000; // I612 (ST-577 E89 ship v9 swap) RE-PIN WITH MEASUREMENT 1,300,000 -> 1,658,000 (measured + 15% per scope-check-E89 rule 5: ship v9 1,441,348 B x 1.15 = 1,657,550 -> 1,658,000; E89 pre-registered encode ceiling 1,650,000 B held at encode) // I609 (ST-574 E88) RE-PIN WITH MEASUREMENT: 1,500,000 -> 1,300,000 (compressed ship file 1,130,488 B; max non-ship enemy_phantom 163,884 B) // I587 (ST-554 E83 ship v8 swap) EXPLICIT re-pin WITH MEASUREMENT: 1,048,576 -> 1,500,000 (ship v8 1,402,896 B; scope-check-E83 pre-registered 1,400,000 B target / 1,500,000 B hard; max non-ship stays boss 75.26 KB) // I501 (ST-467 ship v6) EXPLICIT re-pin: 393216 -> 1048576 (ship v6 581,440 B; spec s5 pre-registered 1,048,576; max non-ship stays boss 75.26 KB) // I440 (ST-410 ship remaster v3) EXPLICIT re-pin: 262144 -> 393216 (ship 190,544 B/3254t -> 270,556 B/12400t; I435 was 100*1024 -> 262144 for v2; max non-ship stays boss 75.26 KB)

function parseGlb(file) {
  const buf = fs.readFileSync(path.join(ASSET_DIR, file));
  assert.equal(buf.length > 12, true, file + ': file too small');
  assert.equal(buf.readUInt32LE(0), GLB_MAGIC, file + ': bad magic');
  const version = buf.readUInt32LE(4);
  const declared = buf.readUInt32LE(8);
  assert.equal(version, 2, file + ': expected glTF 2.0');
  assert.equal(declared, buf.length, file + ': declared length != file size');
  const fileSize = buf.length;
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
  // I609 (ST-574 E88): EXT_meshopt_compression - the BIN chunk holds meshopt-compressed views;
  // rebuild the LOGICAL (post-decode) buffer so every read site below is unchanged.
  if (!(json.extensionsRequired || []).includes('EXT_meshopt_compression')) {
    return { buf, json, binOff, fileSize };
  }
  let logicalSize = 0;
  for (const bv of json.bufferViews || []) {
    const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;
    const end = (bv.byteOffset || 0) + bv.byteLength; // I609 fix: main bufferView fields hold the LOGICAL dims; ext.byteLength is the compressed span
    if (end > logicalSize) logicalSize = end;
  }
  const logical = Buffer.alloc(logicalSize);
  for (const bv of json.bufferViews || []) {
    const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;
    const base = bv.byteOffset || 0;
    if (ext) {
      const out = Buffer.alloc(ext.count * ext.byteStride);
      MeshoptDecoder.decodeGltfBuffer(out, ext.count, ext.byteStride, buf.subarray(binOff + ext.byteOffset, binOff + ext.byteOffset + ext.byteLength), ext.mode, ext.filter || 0);
      logical.set(out, base);
    } else {
      logical.set(buf.subarray(binOff + base, binOff + base + bv.byteLength), base);
    }
  }
  return { buf: logical, json, binOff: 0, fileSize };
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
  const { buf, json, binOff, fileSize } = parseGlb('ship.glb');
  assert.ok(fileSize < MAX_FILE_BYTES, 'ship.glb ' + fileSize + ' B under the 1,658,000 B cap (I612 meshopt file 1,441,348 B)');
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
  assert.ok(Math.abs(span - 4.0) <= 0.4, 'wingspan ' + span.toFixed(3) + ' ~ 4.0'); // I454 (ST-424) EXPLICIT re-pin: 2.5 -> 4.0 (v4 span, 1.55x authored scale)
  assert.ok(Math.abs(len - 2.6) <= 0.26, 'length ' + len.toFixed(3) + ' ~ 2.6'); // I454 (ST-424) EXPLICIT re-pin: 1.9 -> 2.6 (v4 length, nacelle mouth -0.94 .. bow +1.80)

  // I292 (ST-275 ship hero pass): per-facet grayscale COLOR_0 value bakes on the two
  // silhouette-carrying nodes (Blender 5.2, corner domain, v = clamp(1.0 + k*nY, 0.30, 1.55),
  // hull k=0.55 / wings k=0.80 - the flat wing slab's nY range (~0.67) cannot reach the 0.35
  // p10..p90 floor at k=0.55; hull keeps the I282/I288-style k). The bake multiplies the
  // in-code body/wing tint (CONFIG.ship.palette). Exactly these two prims carry COLOR_0
  // (Cockpit/Engine/Fin/Nozzle stay clean - Fin is wingMat-routed and gets the white-identity
  // attr in code, shipMesh.js ensureWhiteColors).
  // I429 (ST-399 ship remaster): re-baked on the new 818-tri fighter geometry with the
  // domain formula v = clamp(1.0 + k*dot(n, L), 0.30, 1.55), fixed light L = (-0.45, -0.55,
  // 0.70).normalized() (supersedes the I292 nY-only bake), k = 0.55 hull / 0.80 wings; still
  // exactly these 2 prims (Cockpit/Engine/Fin/Nozzle stay clean).
  const shipFacet = {};
  let colorPrims = 0;
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    if (p.attributes.COLOR_0 === undefined) continue;
    colorPrims++;
    const acc = json.accessors[p.attributes.COLOR_0];
    const bv = json.bufferViews[acc.bufferView];
    assert.equal(acc.componentType, 5126, m.name + ' COLOR_0 componentType FLOAT');
    assert.equal(acc.type, 'VEC3', m.name + ' COLOR_0 type VEC3');
    assert.equal(acc.count, json.accessors[p.attributes.POSITION].count, m.name + ' COLOR_0 count == POSITION count');
    const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    for (let i = 0; i < acc.count; i++) {
      const r = buf.readFloatLE(base + i * 12), g = buf.readFloatLE(base + i * 12 + 4), b = buf.readFloatLE(base + i * 12 + 8);
      assert.ok(Math.abs(r - g) <= 0.02 && Math.abs(g - b) <= 0.02, m.name + ' COLOR_0 grayscale at ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));
      assert.ok(r >= 0.30 - 0.01 && r <= 1.55 + 0.01, m.name + ' COLOR_0 in [0.30,1.55] value domain at ' + i + ': ' + r.toFixed(3));
    }
    const iAcc = json.accessors[p.indices];
    const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
    const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i * 2) : iAcc.componentType === 5125 ? buf.readUInt32LE(iBase + i * 4) : buf.readUInt8(iBase + i));
    const lum = (i) => 0.2126 * buf.readFloatLE(base + i * 12) + 0.7152 * buf.readFloatLE(base + i * 12 + 4) + 0.0722 * buf.readFloatLE(base + i * 12 + 8);
    const fl = [];
    for (let t = 0; t < iAcc.count / 3; t++) fl.push((lum(readIdx(t * 3)) + lum(readIdx(t * 3 + 1)) + lum(readIdx(t * 3 + 2))) / 3);
    fl.sort((a, b2) => a - b2);
    const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
    shipFacet[m.name] = { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
  }
  assert.equal(colorPrims, 2, 'exactly hull + wings prims carry the I292 value bake (' + colorPrims + ')');
  const hullF = shipFacet['VR_Ship_Hull.001'] || shipFacet['VR_Ship_Hull'];
  const wingF = shipFacet['VR_Ship_Wings.001'] || shipFacet['VR_Ship_Wings'];
  assert.ok(hullF && wingF, 'hull + wings facet data (' + Object.keys(shipFacet).join(',') + ')');
  const SHIP_FACET = { hull: { p10: 0.4098, p50: 0.7606, p90: 1.1488 }, wings: { p10: 0.3946, p50: 0.9328, p90: 1.5402 } }; // I612 (ST-577 E89 ship v9 swap) EXPLICIT re-pin WITH MEASUREMENT: I587 hull {0.4305/0.7753/1.1998} + wings {0.3898/0.8562/1.5392} -> measured on the 82,151-tri GLB (.evidence/I612/measure612.mjs; hull spread 0.7390 / wings spread 1.1456; same v = clamp(1.0 + k*dot(n,L), 0.30, 1.55) formula family, k_hull 0.60 / k_wings 0.80, L = (-0.45,-0.55,0.70).normalized()) // I587 (ST-554 E83 ship v8 swap) EXPLICIT re-pin WITH MEASUREMENT: I541 hull {0.4603/0.8009/1.3020} + wings {0.3891/0.9271/1.5464} -> measured on the 62,254-tri GLB (.evidence/I587/repin_measure587b.mjs; hull spread 0.7693 / wings spread 1.1494; k_hull 0.60 / k_wings 0.80, L = (-0.45,-0.55,0.70).normalized(), domain [0.30,1.55]) // I541 (ST-507 E73 ship v7) EXPLICIT re-pin WITH MEASUREMENT: I501 hull {0.5611/0.9108/1.3070} + wings {0.3869/0.9981/1.55} -> measured on the 32,499-tri GLB (.evidence/I541/measure541.cjs; hull spread 0.8417 / wings spread 1.1572) // I501 (ST-467 ship v6) EXPLICIT re-pin: I470 hull {0.5936/1.0284/1.4453} + wings {0.378/0.9977/1.55} -> measured on the 25,563-tri GLB (.evidence/I501/facet_measure.mjs; hull 12,207t spread 0.7459 / wings 2,644t spread 1.1631; k_hull 0.60 / k_wings 0.80 value bake) // I470 (ST-437 ship v5 high-poly real airship) EXPLICIT re-pin: I454 hull {0.6148/0.9402/1.3888} + wings {0.5346/0.5854/1.4654} -> measured on the 17143-tri GLB (.evidence/I470/measure_glb.py; hull 8423t spread 0.8517 / wings 2260t spread 1.172; k_hull 0.55->0.60, SCALE_XYZ 1.600/1.405/1.260, hull-dominant forward mid-band density)
  assert.ok(hullF.p90 - hullF.p10 >= 0.35, 'hull facet luma spread ' + (hullF.p90 - hullF.p10).toFixed(3) + ' >= 0.35 (I292 value bake; pre-bake was a flat in-code tint)');
  assert.ok(wingF.p90 - wingF.p10 >= 0.35, 'wings facet luma spread ' + (wingF.p90 - wingF.p10).toFixed(3) + ' >= 0.35 (I292 value bake; pre-bake was a flat in-code tint)');
  for (const [k, E] of [['hull', hullF], ['wings', wingF]]) {
    for (const qk of ['p10', 'p50', 'p90']) assert.ok(Math.abs(E[qk] - SHIP_FACET[k][qk]) <= 0.005, 'ship ' + k + ' facet ' + qk + ' ' + E[qk].toFixed(4) + ' ~ ' + SHIP_FACET[k][qk] + ' (I292 bake pin)');
  }
});

test('asteroid L/M/S: naming, poly budgets, radii match CONFIG (+/-5%)', () => {
  for (const size of ['L', 'M', 'S']) {
    const { buf, json, binOff, fileSize } = parseGlb('asteroid_' + size + '.glb');
    assert.ok(fileSize < MAX_FILE_BYTES, 'asteroid_' + size + '.glb under 100 KB');
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
// I302 (ST-283): value-ladder re-bake pins, measured file-level through the facet reader below.
// L darkest / M mid / S lightest inverts the I279 M-brightest identity; per-vertex hue jitter
// makes (r-b) no longer proportional to value (chroma-variety assertion in the test).
// I303 (ST-284): pins re-measured on the NEW displacement geometry (crater + ridge
// silhouette pass; same ST-283 value-ladder scheme with the frange window-bind fix).
// Blender 5.2.3 exporter now writes COLOR_0 as unclamped FLOAT (5126) - I302 patch obsolete.
// I307 (ST-287): pins re-measured on the bump+crater relief geometry (488/134/134 tris);
// same ST-283 value-ladder + warm-order R>=G>=B + per-vertex hue-jitter scheme, denser surface.
const ROCK_FACET = {
  L: { p10: 0.1354, p50: 0.4321, p90: 0.7895, mean: 0.4539 }, // I621 (ST-581 E90 D1) rock v13 RE-PIN WITH MEASUREMENT (6000t/111,008B -> 12000t/215,880B): 0.1559/0.4657/0.7913/0.4735 -> 0.1354/0.4321/0.7895/0.4539 (measure621.cjs, 4-dp truncation; ladder L<M<S holds: L 0.4321 < M 0.5620 < S 0.7183 p50; spread 0.6541 >= 0.50) // I554 (ST-520 E75 D5) rock v12 displacement remaster RE-PIN WITH MEASUREMENT (3000t/73,224B -> 6000t/145,224B, maxR 2.2000 EXACT, craters + convex bumps relief, per-vertex COLOR_0): 0.1491/0.4634/0.8049/0.4750 -> 0.1559/0.4657/0.7913/0.4735 (measured file-level via the test's own facetLumas, .evidence/I554/measure554.cjs, 4-dp truncation; ladder L<M<S holds: L 0.4657 < M 0.6188 < S 0.7027 p50) // I456 (ST-426): 0.1676/0.4645/0.7867/0.4765 -> 0.1491/0.4634/0.8049/0.4750 (v11 3000t)
  M: { p10: 0.3094, p50: 0.5620, p90: 0.9231, mean: 0.5911 }, // I621 (ST-581 E90 D1) rock v13 RE-PIN WITH MEASUREMENT (1800t/35,476B -> 4000t/74,388B): 0.2880/0.6188/0.9135/0.6070 -> 0.3094/0.5620/0.9231/0.5911 (measure621.cjs, 4-dp truncation) // I554 (ST-520 E75 D5) rock v12 RE-PIN WITH MEASUREMENT (900t/22,820B -> 1800t/44,424B): 0.2997/0.6133/0.9084/0.6049 -> 0.2880/0.6188/0.9135/0.6070 (measure554.cjs, 4-dp truncation) // I456 (ST-426): 0.2915/0.6118/0.9056/0.6044 -> 0.2997/0.6133/0.9084/0.6049 (500t -> 900t)
  S: { p10: 0.3450, p50: 0.7183, p90: 1.0119, mean: 0.6929 }, // I621 (ST-581 E90 D1) rock v13 RE-PIN WITH MEASUREMENT (700t/15,240B -> 1600t/31,804B): 0.3962/0.7027/1.0033/0.6934 -> 0.3450/0.7183/1.0119/0.6929 (measure621.cjs, 4-dp truncation) // I554 (ST-520 E75 D5) rock v12 RE-PIN WITH MEASUREMENT (350t/9,616B -> 700t/18,016B): 0.3838/0.7214/0.9432/0.6853 -> 0.3962/0.7027/1.0033/0.6934 (measure554.cjs, 4-dp truncation) // I456 (ST-426): 0.4387/0.7144/1.0090/0.7092 -> 0.3838/0.7214/0.9432/0.6853 (134t -> 350t)
}; // I370 (ST-337 E41 relief re-bake v8): L 18592B/490t 5cr+4bump / M 6336B/134t 4cr+3bump / S 7344B/134t 4cr+3bump - deeper craters (depth x1.4-1.6 vs I343), rim sigma 0.35-0.55, NEW convex bumps, relief-tracking COLOR_0 (relief z-score |v|/r-1 blended 0.7/0.3 with fbm into the tanh value-ladder; wh=0.7 k=2.4 gain=1.75; centers L 0.46 M 0.62 S 0.8137); deltas vs I343 pins: L p10 -0.0773 p50 -0.0236 p90 -0.0171 mean -0.0099 spread +0.0602; M p10 -0.0377 p50 +0.0893 p90 +0.0273 mean +0.0585 spread +0.0650; S p10 +0.0471 p50 +0.0116 p90 +0.0611 mean +0.0285 spread +0.0139; same warm-order R>=G>=B + per-vertex hue-jitter + per-triangle mean-luma convention;
// I436 (ST-406) M v9 subdivided realism pass re-pin: 134t/122v 4cr+3bump 6336B -> 500t/252v 8cr+10bump 13216B (deterministic .evidence/I436/build_rock_m_v9.py; denser relief, welded file); M 0.2610/0.6347/0.8769/0.6098 -> 0.2915/0.6118/0.9056/0.6044 (deltas +0.0305/-0.0229/+0.0287/-0.0054; measured file-level); ladder L<M<S holds (L p50 0.4621 < M 0.6118 < S 0.7144)
// I420 (ST-390 E52): B-variant silhouette GLBs (asteroid_{L,M,S}_B.glb) - same topology as A
// (490/134/134 tris), distinct displacement lobes + anisotropic scale, relief-tracking
// COLOR_0 with a B-specific mottle seed. Same value ladder (L<M<S), same warm order
// R>=G>=B, same [0.10,1.20] band + >= 0.50 facet-spread floor.
const ROCK_FACET_B = {
  L: { p10: 0.1824, p50: 0.4254, p90: 0.7106, mean: 0.4358 }, // I621 (ST-581 E90 D1) L_B v13 RE-PIN WITH MEASUREMENT (6000t/111,100B -> 12000t/216,728B): 0.1724/0.4488/0.6883/0.4392 -> 0.1824/0.4254/0.7106/0.4358 (measure621.cjs; B ladder L<M<S holds: L 0.4254 < M 0.5959 < S 0.6887 p50) // I554 (ST-520 E75 D5) L_B v12 RE-PIN WITH MEASUREMENT (same 6000t topology as A, B lobes + anisotropic scale, 145,232B): 0.1372/0.4462/0.7490/0.4476 -> 0.1724/0.4488/0.6883/0.4392 (measure554.cjs; ladder L<M<S holds: L 0.4488 < M 0.5721 < S 0.6864 p50) // I456 (ST-426): 0.1444/0.4403/0.7442/0.4478 -> 0.1372/0.4462/0.7490/0.4476 (v11)
  M: { p10: 0.3263, p50: 0.5959, p90: 0.8480, mean: 0.5938 }, // I621 (ST-581 E90 D1) M_B v13 RE-PIN WITH MEASUREMENT (1800t/35,428B -> 4000t/73,968B): 0.3042/0.5721/0.9139/0.5834 -> 0.3263/0.5959/0.8480/0.5938 (measure621.cjs) // I554 (ST-520 E75 D5) M_B v12 RE-PIN WITH MEASUREMENT (900t -> 1800t, 44,428B): 0.3324/0.6072/0.8965/0.6104 -> 0.3042/0.5721/0.9139/0.5834 (measure554.cjs) // I456 (ST-426): 0.2863/0.5984/0.9427/0.6075 -> 0.3324/0.6072/0.8965/0.6104 (500t -> 900t)
  S: { p10: 0.4918, p50: 0.6887, p90: 1.0191, mean: 0.7293 }, // I621 (ST-581 E90 D1) S_B v13 RE-PIN WITH MEASUREMENT (700t/15,104B -> 1600t/31,376B): 0.4813/0.6864/1.0183/0.7213 -> 0.4918/0.6887/1.0191/0.7293 (measure621.cjs) // I554 (ST-520 E75 D5) S_B v12 RE-PIN WITH MEASUREMENT (350t -> 700t, 18,024B): 0.4238/0.7137/1.0140/0.7161 -> 0.4813/0.6864/1.0183/0.7213 (measure554.cjs) // I456 (ST-426): 0.3791/0.7133/0.9625/0.6849 -> 0.4238/0.7137/1.0140/0.7161 (134t -> 350t)
}; // I420 (ST-390): B bake pins, measured file-level through facetLumas below; I436 (ST-406) M_B v9 re-pin: 0.2842/0.6402/0.9153/0.6297 -> 0.2863/0.5984/0.9427/0.6075 (deltas +0.0021/-0.0418/+0.0274/-0.0222; B built from NEW M v9 via I420 recipe, same 500t topology; ladder L<M<S holds: L 0.4465 < M 0.5984 < S 0.7133 p50)
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
test('asteroid L/M/S: COLOR_0 mottling band + warm order + facet luma spread (I257 -> I264 -> I279 -> I302 -> I303)', () => {
  for (const size of ['L', 'M', 'S']) {
    const { buf, json, binOff, fileSize } = parseGlb('asteroid_' + size + '.glb');
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
          assert.ok(v >= 0.10 - 0.01 && v <= 1.20 + 0.01, size + ' COLOR_0 channel in [0.10,1.20] I302 mottling band: ' + v.toFixed(3));
        }
        assert.ok(r >= g - 1e-4 && g >= b - 1e-4, size + ' COLOR_0 warm order R>=G>=B at vertex ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));
        checked++;
      }
      assert.ok(checked > 0, size + ' checked vertices');
    }
    // I264 acceptance metric: measured facet luma spread + brightness preservation.
    const f = facetLumas({ buf, json, binOff });
    const E = ROCK_FACET[size];
    assert.ok(f.p90 - f.p10 >= 0.50, size + ' facet luma spread ' + (f.p90 - f.p10).toFixed(3) + ' >= 0.50 (I302 mottle floor; I279 floor was 0.42)');
    for (const k of ['p10', 'p50', 'p90', 'mean']) {
      assert.ok(Math.abs(f[k] - E[k]) <= 0.005, size + ' facet ' + k + ' ' + f[k].toFixed(3) + ' ~ ' + E[k] + ' (I302 bake pin)');
    }
    // I302 (ST-283): per-vertex warm-hue variety. In the I279 bake (r-b) = 0.095*lv exactly, so the
    // proxy ratio (r-b)/((r+g+b)/3.085) was constant 0.0982 (range ~0.0004). I302 adds a per-vertex
    // hue jitter h in [0,1]: r = lv*(1.04+0.10h), g = lv*(1.00-0.06h), b = lv*(0.945-0.20h) -> ratio
    // spans 0.098..0.431 (measured ~0.34). Floor 0.05 discriminates the bakes without coupling to the
    // exact noise field; warm order R>=G>=B still holds for all h in [0,1].
    let ratioMin = Infinity, ratioMax = -Infinity;
    for (const m of json.meshes || []) for (const q of m.primitives || []) {
      if (q.attributes.COLOR_0 === undefined) continue;
      const cacc = json.accessors[q.attributes.COLOR_0];
      const cbv = json.bufferViews[cacc.bufferView];
      const cbase = binOff + (cbv.byteOffset || 0) + (cacc.byteOffset || 0);
      for (let i = 0; i < cacc.count; i++) {
        const r = buf.readFloatLE(cbase + i * 12);
        const g = buf.readFloatLE(cbase + i * 12 + 4);
        const b = buf.readFloatLE(cbase + i * 12 + 8);
        const ratio = (r - b) / ((r + g + b) / 3.085);
        if (ratio < ratioMin) ratioMin = ratio;
        if (ratio > ratioMax) ratioMax = ratio;
      }
    }
    assert.ok(ratioMax - ratioMin > 0.05, size + ' chroma variety: (r-b)/value proxy range ' + (ratioMax - ratioMin).toFixed(4) + ' > 0.05 (I302 hue jitter; I279 bake was ~0.0004)');
  }
});

// I420 (ST-390 E52): B-variant silhouette GLBs - distinct low-poly silhouette per size,
// SAME tri count as primary A (zero re-pin), same radii (visual/hitbox parity), VR_ naming.
test('asteroid L/M/S _B: naming, poly budgets, radii match CONFIG (+/-5%) (I420)', () => {
  const A_TRIS = { L: 12000, M: 4000, S: 1600 }; // I621 (ST-581 E90 D1) rock v13 RE-PIN WITH MEASUREMENT 6000/1800/700 -> 12000/4000/1600 (B built from NEW A via I420 recipe, same topology; measure621.cjs: A 12000/4000/1600 == B 12000/4000/1600) // I554 (ST-520 E75 D5) rock v12 RE-PIN WITH MEASUREMENT 3000/900/350 -> 6000/1800/700 (B built from NEW A via I420 recipe, same topology; measure554.cjs: A 6000/1800/700 == B 6000/1800/700) // I441 (ST-411): L 490 -> 1980 (v10 remaster; L_B same topology -> equal-tris assert holds); I436 (ST-406): M 134 -> 500 (v9 subdivided pass; M_B same topology -> equal-tris assert holds); I456 (ST-426): L/M/S v11 density remaster 1980/500/134 -> 3000/900/350 (B built from NEW A via I420 recipe, same topology)
  for (const size of ['L', 'M', 'S']) {
    const { buf, json, binOff, fileSize } = parseGlb('asteroid_' + size + '_B.glb');
    assert.ok(fileSize < MAX_FILE_BYTES, 'asteroid_' + size + '_B.glb under 100 KB');
    const s = meshStats({ buf, json, binOff });
    assert.ok(s.nodeNames.includes('VR_Rock_' + size + '_B'), 'VR_Rock_' + size + '_B node');
    assert.ok(s.matNames.includes('VR_Rock'), 'VR_Rock material');
    for (const p of s.prims) assert.ok(p.hasColor, size + '_B primitive has COLOR_0 vertex colors (I420)');
    assert.ok(s.totalTris <= BUDGETS[size], size + '_B tris ' + s.totalTris + ' <= ' + BUDGETS[size]);
    assert.equal(s.totalTris, A_TRIS[size], size + '_B tris ' + s.totalTris + ' == A tris ' + A_TRIS[size] + ' (same topology -> zero re-pin)');
    const logical = CONFIG.asteroid.sizes[size].radius;
    const maxR = Math.max(...s.prims.map((p) => p.maxRadius));
    assert.ok(Math.abs(maxR - logical) / logical <= 0.05,
      size + '_B max vertex radius ' + maxR.toFixed(4) + ' within 5% of logical ' + logical);
  }
});

test('asteroid L/M/S _B: COLOR_0 mottling band + warm order + facet luma spread (I420 E52)', () => {
  for (const size of ['L', 'M', 'S']) {
    const { buf, json, binOff, fileSize } = parseGlb('asteroid_' + size + '_B.glb');
    for (const m of json.meshes || []) for (const p of m.primitives || []) {
      assert.ok(p.attributes.COLOR_0 !== undefined, size + '_B primitive has COLOR_0');
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
          assert.ok(v >= 0.10 - 0.01 && v <= 1.20 + 0.01, size + '_B COLOR_0 channel in [0.10,1.20] band: ' + v.toFixed(3));
        }
        assert.ok(r >= g - 1e-4 && g >= b - 1e-4, size + '_B COLOR_0 warm order R>=G>=B at vertex ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));
        checked++;
      }
      assert.ok(checked > 0, size + '_B checked vertices');
    }
    const f = facetLumas({ buf, json, binOff });
    const E = ROCK_FACET_B[size];
    assert.ok(f.p90 - f.p10 >= 0.50, size + '_B facet luma spread ' + (f.p90 - f.p10).toFixed(3) + ' >= 0.50 (I302 mottle floor)');
    for (const k of ['p10', 'p50', 'p90', 'mean']) {
      assert.ok(Math.abs(f[k] - E[k]) <= 0.005, size + '_B facet ' + k + ' ' + f[k].toFixed(3) + ' ~ ' + E[k] + ' (I420 B bake pin)');
    }
    let ratioMin = Infinity, ratioMax = -Infinity;
    for (const m of json.meshes || []) for (const q of m.primitives || []) {
      if (q.attributes.COLOR_0 === undefined) continue;
      const cacc = json.accessors[q.attributes.COLOR_0];
      const cbv = json.bufferViews[cacc.bufferView];
      const cbase = binOff + (cbv.byteOffset || 0) + (cacc.byteOffset || 0);
      for (let i = 0; i < cacc.count; i++) {
        const r = buf.readFloatLE(cbase + i * 12);
        const g = buf.readFloatLE(cbase + i * 12 + 4);
        const b = buf.readFloatLE(cbase + i * 12 + 8);
        const ratio = (r - b) / ((r + g + b) / 3.085);
        if (ratio < ratioMin) ratioMin = ratio;
        if (ratio > ratioMax) ratioMax = ratio;
      }
    }
    assert.ok(ratioMax - ratioMin > 0.05, size + '_B chroma variety: (r-b)/value proxy range ' + (ratioMax - ratioMin).toFixed(4) + ' > 0.05 (I420 hue jitter)');
  }
  // I420 E52 value ladder: L darkest < M mid < S lightest (matches the A ladder).
  for (const k of ['p10', 'p50', 'p90', 'mean']) {
    const Lv = ROCK_FACET_B.L[k], Mv = ROCK_FACET_B.M[k], Sv = ROCK_FACET_B.S[k];
    assert.ok(Lv < Mv && Mv < Sv, 'B value ladder ' + k + ': L ' + Lv + ' < M ' + Mv + ' < S ' + Sv);
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
  assert.ok(files.length >= 24, 'expected >= 24 GLBs in assets/ (I410: 21; I420: 24 incl. B-variant rocks)');
  for (const file of files) {
    const { buf, json, binOff, fileSize } = parseGlb(file);
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
  const { buf, json, binOff, fileSize } = parseGlb('boss.glb');
  assert.ok(fileSize <= 92000, 'boss.glb ' + fileSize + ' B <= 92,000 (I613 boss v3 RE-PIN WITH MEASUREMENT: 79,996 B x 1.15 = 91,995 -> 92,000 per scope-check-E89 rule 5; was 18*1024 I609 meshopt 17,008 B)');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Boss_Hull'), 'VR_Boss_Hull node');
  assert.ok(s.nodeNames.includes('VR_Boss_Crown'), 'VR_Boss_Crown node');
  assert.ok(s.nodeNames.includes('VR_Boss_Core'), 'VR_Boss_Core node');
  // The material-present export recipe is what writes real COLOR_0 data (I263 incident).
  for (const n of ['VR_Boss_HullMat', 'VR_Boss_CrownMat', 'VR_Boss_CoreMat']) assert.ok(s.matNames.includes(n), n + ' material (export recipe)');
  assert.ok(s.totalTris <= BUDGETS.boss, 'boss tris ' + s.totalTris + ' <= 2352 (I613 boss v3 re-pin WITH MEASUREMENT; was 1500 I456 / 750 I430)');
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
  const { buf, json, binOff, fileSize } = parseGlb('shield.glb');
  assert.ok(fileSize < MAX_FILE_BYTES, 'shield.glb under 100 KB');
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
// I425/ST-395: powerup_spread/shield/magnet re-baked in Blender 5.2 (trident prism / hex ring + hex core / horseshoe U-prism)
// with fresh silhouette-matched value bakes; their PU_FACET pins below re-pinned EXPLICITLY old -> new (never silent).
// rapid/bomb/overdrive/slowmo GLBs untouched, pins hold. The I288 "Geometry UNCHANGED" note above is historical and no longer
// holds for the three re-baked emblems (their extent pins are 15% bands, still satisfied).
const PU_FACET = {
  powerup_rapid:     { p10: 0.720, p50: 1.250, p90: 1.250 }, // sRGB-agnostic linear bake domain [0.30, 1.25]
  powerup_spread:    { p10: 0.3271, p50: 0.6364, p90: 1.1556 }, // I425/ST-395 re-bake (trident prism; old pins 0.712/0.828/1.161)
  powerup_shield:    { p10: 0.3374, p50: 0.3911, p90: 1.1793 }, // I425/ST-395 re-bake (hex ring + core; old pins 0.615/1.250/1.250)
  powerup_bomb:      { p10: 0.703, p50: 1.000, p90: 1.250 },
  powerup_magnet:    { p10: 0.3271, p50: 0.7265, p90: 1.250 }, // I425/ST-395 re-bake (horseshoe U-prism; old pins 0.580/1.000/1.250)
  powerup_overdrive: { p10: 0.595, p50: 1.000, p90: 1.250 },
  powerup_slowmo:    { p10: 0.864, p50: 1.000, p90: 1.250 },
};

test('powerup emblems: naming, poly budgets, normalized extents, grayscale COLOR_0 value bake (I211 -> I288)', () => {
  for (const [file, target] of Object.entries(EMBLEM_TARGETS)) {
    const { buf, json, binOff, fileSize } = parseGlb(file + '.glb');
    assert.ok(fileSize < MAX_FILE_BYTES, file + '.glb under 100 KB');
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

// I508 (ST-474, E68 legacy-4 remaster) supersedes the I211 dart-parity contract: the
// procedural dart is GONE. drone.glb is now the "seeker-fly" - 18-gon bug body + 20-gon
// front sensor-eye dome (x 0.72 r 0.34) + stub swept wings + wingtip fins, one merged
// node/prim (VR_Drone), per-face grayscale COLOR_0 value bake (hash3 bands + bright eye).
// Union bbox class target 1.41 (I508 measured half-diag 1.467 = 1.04x). Pin WITH measurement:
// 118,828 B / 1,516 t; extents x 2.1000 / y 1.1421 / z 1.7000 (raw vertex space).
// I593 (ST-560 E84) v2 boomerang SWAP re-pin WITH measurement (measure593.cjs): 52,284 B / 2,080 t;
// extents x 2.0857 / y 1.1354 / z 1.7000 (raw vertex space; y/z swapped vs the I508 build orientation).
test('drone.glb: I508 (ST-474) E68 seeker-fly remaster - naming, poly budget, union extents (I211 superseded)', () => {
  const { buf, json, binOff, fileSize } = parseGlb('drone.glb');
  assert.ok(fileSize < MAX_FILE_BYTES, 'drone.glb under 1 MB');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Drone'), 'VR_Drone node (single merged node)');
  assert.ok(s.matNames.includes('VR_Drone'), 'VR_Drone material (I593 v2: VR_ naming without the I508 Mat suffix - vestigial, in-code JS material governs)');
  assert.ok(s.totalTris <= BUDGETS.drone, 'drone tris ' + s.totalTris + ' <= 2080 (I593 v2 re-pin)');
  assert.ok(s.totalTris >= 1516, 'drone tris ' + s.totalTris + ' >= 1516 (I508 legacy-4 measured floor - no silent simplification)');
  const e = extents({ buf, json, binOff });
  assert.ok(Math.abs(e.x - 2.0857) / 2.0857 <= 0.10, 'drone X extent ' + e.x.toFixed(3) + ' ~ 2.0857 (I593 v2 pin)');
  assert.ok(Math.abs(e.y - 1.1354) / 1.1354 <= 0.10, 'drone Y extent ' + e.y.toFixed(3) + ' ~ 1.1354 (I593 v2 pin)');
  assert.ok(Math.abs(e.z - 1.7000) / 1.7000 <= 0.10, 'drone Z extent ' + e.z.toFixed(3) + ' ~ 1.7000 (I593 v2 pin)');
});


// I282 (ST-267 enemy value/shape art pass) -> I508 (ST-474, E68 legacy-4 remaster) supersedes
// the "one body prim bakes, core/dome clean" contract: EVERY prim on drone/stinger/flyer now
// carries a grayscale per-face COLOR_0 value bake (Blender 5.2, per-node hash3 value bands
// 0.22-0.96 + functional zones; core/dome flat 0.94/0.92 - a near-neutral multiplier so the
// in-code emissive materials still drive those reads). The bake multiplies the in-code family
// tint (CONFIG.{drone,stinger,flyer}.palette.body.color). Value domain measured [0.28, 0.94]
// -> assert [0.25, 1.00]. Per-prim percentile pins are the I508 measurements (pre-I508 I282
// file-level pins were drone 0.570/0.830/1.180, stinger 0.580/0.760/0.980, flyer 0.320/0.820/1.120).
const ENEMY_FACET = {
  drone:   { VR_Drone:        { p10: 0.5167, p50: 1.0186, p90: 1.4275 } }, // I593 (ST-560 E84) v2 re-pin WITH measurement (I508: 0.30/0.5332/0.6467)
  stinger: { VR_Stinger_Body: { p10: 0.55,   p50: 0.5573, p90: 1.00 }, // I593 v2 re-pin WITH measurement (I508: 0.34/0.4504/0.579)
             VR_Stinger_Core: { p10: 0.94,   p50: 0.94,   p90: 0.94 } },
  flyer:   { VR_Flyer_Body:   { p10: 0.55,   p50: 0.6421, p90: 1.00 }, // I593 v2 re-pin WITH measurement (I508: 0.3823/0.5741/0.6275)
             VR_Flyer_Dome:   { p10: 0.94,   p50: 0.94,   p90: 0.94 } }, // I593 v2 re-pin WITH measurement (I508: 0.92 flat)
};
const ENEMY_DOMAIN_MAX = { drone: 1.55, stinger: 1.00, flyer: 1.00 }; // I593 (ST-560 E84) COLOR_0 domain re-pin WITH MEASUREMENT (measure593.cjs): drone v2 1.0-centered bright-bake accents reach 1.55 (I591 P-gate approved); stinger/flyer v2 stay within 1.00. I508 domain was [0.25, 1.00] for all three.
const LEGACY_FLOOR = { drone: 1516, stinger: 1732, flyer: 1770 }; // I593: I508 legacy-4 measured tri floors (no silent simplification below the superseded ships)
function enemyFacetLumasPrim({ buf, json, binOff }, prim) {
  // I508: per-prim per-face luma through the index accessor (vertex-split colors:
  // COLOR_0 count == POSITION count). Replaces the I282 whole-file "last COLOR_0 prim" reader.
  const cAcc = json.accessors[prim.attributes.COLOR_0];
  const iAcc = json.accessors[prim.indices];
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
// Legacy whole-file reader (I451 hunter / I482 wasp): pools per-face luma over every
// COLOR_0 prim (legacy files carry exactly one, so identical to the I508 prim reader).
function enemyFacetLumas({ buf, json, binOff }) {
  const fl = [];
  for (const m of json.meshes || []) for (const pr of m.primitives || []) {
    if (pr.attributes.COLOR_0 === undefined) continue;
    const cAcc = json.accessors[pr.attributes.COLOR_0];
    const iAcc = json.accessors[pr.indices];
    const cBase = binOff + (json.bufferViews[cAcc.bufferView].byteOffset || 0) + (cAcc.byteOffset || 0);
    const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
    const readIdx = (j) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + j * 2) : iAcc.componentType === 5125 ? buf.readUInt32LE(iBase + j * 4) : buf.readUInt8(iBase + j));
    for (let t = 0; t < iAcc.count / 3; t++) {
      const i0 = readIdx(t * 3), i1 = readIdx(t * 3 + 1), i2 = readIdx(t * 3 + 2);
      const lum = (j) => { const o = cBase + j * 12; return 0.2126 * buf.readFloatLE(o) + 0.7152 * buf.readFloatLE(o + 4) + 0.0722 * buf.readFloatLE(o + 8); };
      fl.push((lum(i0) + lum(i1) + lum(i2)) / 3);
    }
  }
  fl.sort((a, b) => a - b);
  const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
  return { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
}
test('drone/stinger/flyer: every prim carries the I508 grayscale COLOR_0 bake; per-prim facet pins (I282 -> I508)', () => {
  for (const name of ['drone', 'stinger', 'flyer']) {
    const { buf, json, binOff, fileSize } = parseGlb(name + '.glb');
    const st = meshStats({ buf, json, binOff });
    assert.ok(st.totalTris <= BUDGETS[name], name + ' tris ' + st.totalTris + ' <= ' + BUDGETS[name] + ' (I593 v2 re-pin)');
    assert.ok(st.totalTris >= LEGACY_FLOOR[name], name + ' tris ' + st.totalTris + ' >= ' + LEGACY_FLOOR[name] + ' (I508 legacy-4 measured floor - no silent simplification)');
    let colorPrims = 0;
    for (const m of json.meshes || []) for (const p of m.primitives || []) {
      const mn = m.name || 'mesh';
      assert.ok(p.attributes.COLOR_0 !== undefined, mn + ' primitive has COLOR_0 (I508 bake - all prims)');
      colorPrims++;
      const acc = json.accessors[p.attributes.COLOR_0];
      const bv = json.bufferViews[acc.bufferView];
      const stride = parseInt(acc.type.replace('VEC', ''), 10);
      assert.equal(acc.componentType, 5126, mn + ' COLOR_0 componentType FLOAT');
      assert.equal(acc.type, 'VEC3', mn + ' COLOR_0 type VEC3');
      assert.ok(bv.byteLength >= acc.count * stride * 4, mn + ' COLOR_0 bufferView spec-size');
      const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);
      for (let i = 0; i < acc.count; i++) {
        const r = buf.readFloatLE(base + i * stride * 4);
        const g = buf.readFloatLE(base + i * stride * 4 + 4);
        const b = buf.readFloatLE(base + i * stride * 4 + 8);
        assert.ok(Math.abs(r - g) <= 0.02 && Math.abs(g - b) <= 0.02, name + ' COLOR_0 grayscale at ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));
        assert.ok(r >= 0.25 && r <= ENEMY_DOMAIN_MAX[name], name + ' COLOR_0 in [0.25,' + ENEMY_DOMAIN_MAX[name] + '] I508->I593 value domain at ' + i + ': ' + r.toFixed(3));
      }
      const f = enemyFacetLumasPrim({ buf, json, binOff }, p);
      const E = ENEMY_FACET[name][mn];
      assert.ok(E, mn + ' has an I508 per-prim facet pin');
      for (const k of ['p10', 'p50', 'p90']) {
        assert.ok(Math.abs(f[k] - E[k]) <= 0.005, name + ' ' + mn + ' facet ' + k + ' ' + f[k].toFixed(4) + ' ~ ' + E[k] + ' (I508 bake pin)');
      }
    }
    assert.equal(colorPrims, Object.keys(ENEMY_FACET[name]).length, name + ': prim count matches the I508 pin table');
  }
});


// I509 (ST-475 E68): remaster-4 fleet GLBs (hunter/gunship/sentry/wasp) - real-spaceship
// Blender 5.2.3 headless rebuild (build_remaster4.py; CG gate + 12-view sheets in
// .evidence/I509/gate_notes.md). Contract (I508 pattern): flat node set, no root nodes;
// EVERY primitive carries a grayscale COLOR_0 value bake (FLOAT 5126 VEC3, count ==
// POSITION count, |r-g|,|g-b| <= 0.02, domain [0.25,1.00]); materials named
// VR_<Asset>_<Part>Mat. Runtime note: game code reads vertexColors only on the hull
// material per asset (S4.6 deviation, documented in gate_notes.md) - accent bakes are a
// harmless superset. Extent pins are the I509 TRUE-AXIS measurements (glb_probe.mjs); the
// v37-checkpoint "axis defect" was an ext_verify.mjs column-rotation artifact - no frame
// change, standard Y-up glTF frame (glTF.x = build.x fwd, glTF.y = build.z up, glTF.z = -build.y).
const ENEMY451_FACET = {
  hunter:  { VR_Hunter_Hull:  { p10: 0.3000, p50: 0.4733, p90: 0.7076 },
             VR_Hunter_Fin:   { p10: 0.3689, p50: 0.3908, p90: 0.4115 },
             VR_Hunter_Core:  { p10: 0.9000, p50: 0.9000, p90: 0.9000 } },
  gunship: { VR_Gunship_Hull:    { p10: 0.3463, p50: 0.4472, p90: 0.5042 },
             VR_Gunship_Nacelle: { p10: 0.2600, p50: 0.3400, p90: 0.5421 },
             VR_Gunship_Bay:     { p10: 0.7800, p50: 0.8400, p90: 0.9500 } },
  sentry:  { VR_Sentry_Platform: { p10: 0.4532, p50: 0.4657, p90: 0.7200 },
             VR_Sentry_Base:     { p10: 0.3400, p50: 0.3400, p90: 0.3400 },
             VR_Sentry_Barrel:   { p10: 0.4727, p50: 0.5202, p90: 0.6600 },
             VR_Sentry_Charge:   { p10: 0.9500, p50: 0.9500, p90: 0.9500 } },
  wasp:    { VR_Wasp_Hull: { p10: 0.3400, p50: 0.5467, p90: 0.7200 },
             VR_Wasp_Wing: { p10: 0.3600, p50: 0.5483, p90: 0.5820 }, // I509 wing-mirror rebuild pin WITH measurement (pre-fix 0.3400/0.5468/0.5815, cz -0.5500)
             VR_Wasp_Nose: { p10: 0.9500, p50: 0.9500, p90: 0.9500 } },
  phantom: { VR_Hull:  { p10: 0.3400, p50: 0.5263, p90: 0.6200 },
              VR_Nose:  { p10: 0.9000, p50: 0.9000, p90: 0.9000 },
               VR_PodL:  { p10: 0.4680, p50: 0.4933, p90: 0.5144 },
               VR_PodR:  { p10: 0.4636, p50: 0.4867, p90: 0.5095 } }, // I614 (ST-579 E89 D1) phantom v6 re-pin WITH measurement (facets614.cjs; dart-hull remaster)
  bulwark: { VR_Shield: { p10: 0.4600, p50: 0.5700, p90: 0.7100 },
              VR_Core:   { p10: 0.9300, p50: 0.9300, p90: 0.9300 },
              VR_Spine:  { p10: 0.2800, p50: 0.3610, p90: 0.3990 } }, // I616 (ST-579 E89 D3) re-pin WITH measurement (facets616.cjs; bulwark v3 hex-shield fortress: shield + core facet domains identical to I535, spine p50 0.3498 -> 0.3610, p90 0.3912 -> 0.3990)
  hauler:  { VR_Hull:     { p10: 0.3400, p50: 0.5185, p90: 0.6000 },
               VR_SponsonL: { p10: 0.4000, p50: 0.4000, p90: 0.4000 },
               VR_SponsonR: { p10: 0.4000, p50: 0.4000, p90: 0.4000 },
               VR_Hatch:    { p10: 0.6200, p50: 0.6200, p90: 0.6200 },
               VR_Stack:    { p10: 0.4208, p50: 0.4416, p90: 0.4680 } }, // I615 (ST-579 E89 D2) hauler v4 re-pin WITH measurement (facets615.cjs; blocky industrial remaster)
  sweeper: { VR_Sweeper_Hull:    { p10: 0.3000, p50: 0.4691, p90: 0.5000 },
               VR_Sweeper_Arc:     { p10: 0.9500, p50: 0.9500, p90: 0.9500 },
               VR_Sweeper_Greeble: { p10: 0.3000, p50: 0.3000, p90: 0.3000 } }, // I617 (ST-579 E89 D4) hull p50/p90 re-pin WITH measurement (facets617.cjs: p10 0.3000 / p50 0.4691 / p90 0.5000); I561 (ST-527 E76 D5) pins WITH measurement (measure561.cjs; remaster)
  beacon:  { VR_Beacon_Base:  { p10: 0.3400, p50: 0.3716, p90: 0.5200 },
              VR_Beacon_Tower: { p10: 0.4700, p50: 0.5023, p90: 0.5195 },
              VR_Beacon_Lamp:  { p10: 0.9500, p50: 0.9500, p90: 0.9500 } }, // I618 (ST-579 E89 D5) base p50 0.3680 -> 0.3716 / tower p10 0.4663 -> 0.4700 p50 0.5000 -> 0.5023 p90 0.7000 -> 0.5195 re-pin WITH measurement (facets618.cjs); I552 (ST-518 E75 D3) pins WITH measurement (measure552.mjs; signal island base + tower + lamp)
  archon:  { VR_Archon_Hull:  { p10: 0.3400, p50: 0.4400, p90: 0.5522 },
              VR_Archon_Crown: { p10: 0.4935, p50: 0.6200, p90: 0.7000 },
              VR_Archon_Core:  { p10: 0.3000, p50: 0.5067, p90: 0.9500 } }, // I622 (ST-582 E90 D2 Archon v2) pins WITH measurement (probe622.cjs; v2 hull + crown + core)
};

function primExtents({ buf, json, binOff }, meshName) {
  const m = (json.meshes || []).find((mm) => mm.name === meshName);
  assert.ok(m, meshName + ' mesh present');
  const pos = json.accessors[m.primitives[0].attributes.POSITION];
  const bv = json.bufferViews[pos.bufferView];
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity, minz = Infinity, maxz = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const o = binOff + (bv.byteOffset || 0) + (pos.byteOffset || 0) + i * 12;
    const x = buf.readFloatLE(o), y = buf.readFloatLE(o + 4), z = buf.readFloatLE(o + 8);
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
    if (z < minz) minz = z; if (z > maxz) maxz = z;
  }
  return { x: maxx - minx, y: maxy - miny, z: maxz - minz, cx: (minx + maxx) / 2, cz: (minz + maxz) / 2 }; // + cx at I482 (ST-449 sentry barrel centering)
}
function remaster4Bake(file, asset) {
  // I509: validate the full remaster-4 COLOR_0 contract per prim and pin per-node facet
  // lumas (reuses enemyFacetLumasPrim - identical algorithm to the I508 legacy-4 test).
  const { buf, json, binOff, fileSize } = parseGlb(file);
  let colorPrims = 0;
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    const mn = m.name || 'mesh';
    assert.ok(p.attributes.COLOR_0 !== undefined, mn + ' primitive has COLOR_0 (I509 bake - all prims)');
    colorPrims++;
    const acc = json.accessors[p.attributes.COLOR_0];
    const posAcc = json.accessors[p.attributes.POSITION];
    const bv = json.bufferViews[acc.bufferView];
    const stride = parseInt(acc.type.replace('VEC', ''), 10);
    assert.equal(acc.componentType, 5126, mn + ' COLOR_0 componentType FLOAT');
    assert.equal(acc.type, 'VEC3', mn + ' COLOR_0 type VEC3');
    assert.equal(acc.count, posAcc.count, mn + ' COLOR_0 count == POSITION count');
    assert.ok(bv.byteLength >= acc.count * stride * 4, mn + ' COLOR_0 bufferView spec-size');
    const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    for (let i = 0; i < acc.count; i++) {
      const r = buf.readFloatLE(base + i * stride * 4);
      const g = buf.readFloatLE(base + i * stride * 4 + 4);
      const b = buf.readFloatLE(base + i * stride * 4 + 8);
      assert.ok(Math.abs(r - g) <= 0.02 && Math.abs(g - b) <= 0.02, file + ' COLOR_0 grayscale at ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));
      assert.ok(r >= 0.25 && r <= 1.00, file + ' COLOR_0 in [0.25,1.00] I509 value domain at ' + i + ': ' + r.toFixed(3));
    }
    const f = enemyFacetLumasPrim({ buf, json, binOff }, p);
    const E = ENEMY451_FACET[asset][mn];
    assert.ok(E, mn + ' has an I509 per-prim facet pin');
    for (const k of ['p10', 'p50', 'p90']) {
      assert.ok(Math.abs(f[k] - E[k]) <= 0.005, file + ' ' + mn + ' facet ' + k + ' ' + f[k].toFixed(4) + ' ~ ' + E[k] + ' (I509 bake pin)');
    }
  }
  assert.equal(colorPrims, Object.keys(ENEMY451_FACET[asset]).length, file + ': prim count matches the I509 pin table');
  return { buf, json, binOff, fileSize };
}
test('enemy_hunter.glb: I509 (ST-475 E68) remaster-4 needle fighter - nodes, per-node tris, extents, all-prim COLOR_0', () => {
  const { buf, json, binOff, fileSize } = remaster4Bake('enemy_hunter.glb', 'hunter');
  assert.ok(fileSize <= 106 * 1024, 'hunter under 106 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 104,884 B; I509 raw 227,496 B)');
  const s = meshStats({ buf, json, binOff });
  for (const n of ['VR_Hunter_Hull', 'VR_Hunter_Fin', 'VR_Hunter_Core']) assert.ok(s.nodeNames.includes(n), n + ' node');
  assert.equal(s.nodeNames.length, 3, 'flat node set (no root nodes)');
  for (const mat of ['VR_Hunter_HullMat', 'VR_Hunter_FinMat', 'VR_Hunter_CoreMat']) assert.ok(s.matNames.includes(mat), mat + ' material');
  assert.equal(s.totalTris, BUDGETS.hunter, 'hunter total tris == ' + BUDGETS.hunter + ' (I509 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Hunter_Hull').tris, 2138, 'hull 2138 tris (I509 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Hunter_Fin').tris, 972, 'fin 972 tris (I509 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Hunter_Core').tris, 256, 'core 256 tris (I509 exact)');
  // Per-node extents: I509 TRUE-AXIS measurements (glb_probe.mjs; 10% band).
  const he = primExtents({ buf, json, binOff }, 'VR_Hunter_Hull');
  assert.ok(Math.abs(he.x - 1.32) / 1.32 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 1.32');
  assert.ok(Math.abs(he.y - 1.0) / 1.0 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 1.0');
  assert.ok(Math.abs(he.z - 1.1593) / 1.1593 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 1.1593');
  const fe = primExtents({ buf, json, binOff }, 'VR_Hunter_Fin');
  assert.ok(Math.abs(fe.y - 1.002) / 1.002 <= 0.1, 'fin Y (dorsal keel) ' + fe.y.toFixed(4) + ' ~ 1.002');
  assert.ok(Math.abs(fe.z - 0.84) / 0.84 <= 0.1, 'fin Z (side plates) ' + fe.z.toFixed(4) + ' ~ 0.84');
  const ce = primExtents({ buf, json, binOff }, 'VR_Hunter_Core');
  assert.ok(Math.abs(ce.y - 0.24) / 0.24 <= 0.1, 'core Y ' + ce.y.toFixed(4) + ' ~ 0.24');
});

test('enemy_gunship.glb: I536 (ST-502 E72) brute bomber v2 - nodes, per-node tris, extents, all-prim COLOR_0', () => {
  const { buf, json, binOff, fileSize } = remaster4Bake('enemy_gunship.glb', 'gunship');
  assert.ok(fileSize <= 106 * 1024, 'gunship under 106 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 105,444 B; I536 raw 215,032 B)');
  const s = meshStats({ buf, json, binOff });
  for (const n of ['VR_Gunship_Hull', 'VR_Gunship_Nacelle', 'VR_Gunship_Bay']) assert.ok(s.nodeNames.includes(n), n + ' node');
  assert.equal(s.nodeNames.length, 3, 'flat node set (no root nodes)');
  for (const mat of ['VR_Gunship_HullMat', 'VR_Gunship_NacelleMat', 'VR_Gunship_BayMat']) assert.ok(s.matNames.includes(mat), mat + ' material');
  assert.equal(s.totalTris, BUDGETS.gunship, 'gunship total tris == ' + BUDGETS.gunship + ' (I509 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Gunship_Hull').tris, 1864, 'hull 1864 tris (I536 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Gunship_Nacelle').tris, 750, 'nacelle 750 tris (I536 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Gunship_Bay').tris, 292, 'bay 292 tris (I536 exact)');
  // Per-node extents: I536 TRUE-AXIS measurements (probe536.mjs; 10% band).
  const he = primExtents({ buf, json, binOff }, 'VR_Gunship_Hull');
  assert.ok(Math.abs(he.x - 2.95) / 2.95 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 2.95');
  assert.ok(Math.abs(he.y - 1.35) / 1.35 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 1.35');
  assert.ok(Math.abs(he.z - 1.94) / 1.94 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 1.94');
  const ne = primExtents({ buf, json, binOff }, 'VR_Gunship_Nacelle');
  assert.ok(Math.abs(ne.x - 1.336) / 1.336 <= 0.1, 'nacelle X ' + ne.x.toFixed(4) + ' ~ 1.336');
  assert.ok(Math.abs(ne.z - 0.87) / 0.87 <= 0.1, 'nacelle Z ' + ne.z.toFixed(4) + ' ~ 0.87');
  const be = primExtents({ buf, json, binOff }, 'VR_Gunship_Bay');
  assert.ok(Math.abs(be.y - 0.43) / 0.43 <= 0.1, 'bay Y ' + be.y.toFixed(4) + ' ~ 0.43');
  assert.ok(Math.abs(be.z - 0.58) / 0.58 <= 0.1, 'bay Z ' + be.z.toFixed(4) + ' ~ 0.58');
});

test('enemy_sentry.glb: I509 (ST-475 E68) remaster-4 floating watchtower - nodes, per-node tris, extents, all-prim COLOR_0', () => {
  const { buf, json, binOff, fileSize } = remaster4Bake('enemy_sentry.glb', 'sentry');
  assert.ok(fileSize <= 89 * 1024, 'sentry under 89 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 88,660 B; I509 raw 203,688 B)');
  const s = meshStats({ buf, json, binOff });
  for (const n of ['VR_Sentry_Platform', 'VR_Sentry_Base', 'VR_Sentry_Barrel', 'VR_Sentry_Charge']) assert.ok(s.nodeNames.includes(n), n + ' node');
  assert.equal(s.nodeNames.length, 4, 'flat node set (no root nodes)');
  for (const mat of ['VR_Sentry_PlatformMat', 'VR_Sentry_BaseMat', 'VR_Sentry_BarrelMat', 'VR_Sentry_ChargeMat']) assert.ok(s.matNames.includes(mat), mat + ' material');
  assert.equal(s.totalTris, BUDGETS.sentry, 'sentry total tris == ' + BUDGETS.sentry + ' (I509 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Sentry_Platform').tris, 1772, 'platform 1772 tris (I509 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Sentry_Base').tris, 324, 'base 324 tris (I509 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Sentry_Barrel').tris, 582, 'barrel 582 tris (I509 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Sentry_Charge').tris, 256, 'charge 256 tris (I509 exact)');
  // Per-node extents: I509 TRUE-AXIS measurements (glb_probe.mjs; 10% band).
  const pe = primExtents({ buf, json, binOff }, 'VR_Sentry_Platform');
  assert.ok(Math.abs(pe.x - 2.23) / 2.23 <= 0.1, 'platform X ' + pe.x.toFixed(4) + ' ~ 2.23');
  assert.ok(Math.abs(pe.z - 2.23) / 2.23 <= 0.1, 'platform Z ' + pe.z.toFixed(4) + ' ~ 2.23');
  const be = primExtents({ buf, json, binOff }, 'VR_Sentry_Base');
  assert.ok(Math.abs(be.x - 2.76) / 2.76 <= 0.1, 'base X ' + be.x.toFixed(4) + ' ~ 2.76');
  const re = primExtents({ buf, json, binOff }, 'VR_Sentry_Barrel');
  assert.ok(Math.abs(re.x - 1.13) / 1.13 <= 0.1, 'barrel X ' + re.x.toFixed(4) + ' ~ 1.13');
  assert.ok(Math.abs(re.cx - (-0.085)) <= 0.01, 'barrel cx pin -0.0850 (I509 TRUE-AXIS, glb_probe.mjs; muzzle-forward barrel, bbox center is not node-centered) (cx ' + re.cx.toFixed(4) + ')');
  const ch = primExtents({ buf, json, binOff }, 'VR_Sentry_Charge');
  assert.ok(Math.abs(ch.y - 0.206) / 0.206 <= 0.1, 'charge dia ' + ch.y.toFixed(4) + ' ~ 0.206');
});

test('enemy_wasp.glb: I509 (ST-475 E68) remaster-4 swift dart + wing-mirror rebuild - nodes, per-node tris, extents, all-prim COLOR_0', () => {
  const { buf, json, binOff, fileSize } = remaster4Bake('enemy_wasp.glb', 'wasp');
  assert.ok(fileSize <= 132 * 1024, 'wasp under 132 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I609 meshopt 131,712 B; I509 raw 310,036 B)');
  const s = meshStats({ buf, json, binOff });
  for (const n of ['VR_Wasp_Hull', 'VR_Wasp_Wing', 'VR_Wasp_Nose']) assert.ok(s.nodeNames.includes(n), n + ' node');
  assert.equal(s.nodeNames.length, 3, 'flat node set (no root nodes)');
  for (const mat of ['VR_Wasp_HullMat', 'VR_Wasp_WingMat', 'VR_Wasp_NoseMat']) assert.ok(s.matNames.includes(mat), mat + ' material');
  assert.equal(s.totalTris, BUDGETS.wasp, 'wasp total tris == ' + BUDGETS.wasp + ' (I509 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Wasp_Hull').tris, 1356, 'hull 1356 tris (I509 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Wasp_Wing').tris, 2400, 'wing 2400 tris (I509 double-blade rebuild pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Wasp_Nose').tris, 264, 'nose 264 tris (I509 exact)');
  // Per-node extents: I509 TRUE-AXIS measurements (glb_probe.mjs; 10% band).
  const he = primExtents({ buf, json, binOff }, 'VR_Wasp_Hull');
  assert.ok(Math.abs(he.x - 1.685) / 1.685 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 1.685');
  assert.ok(Math.abs(he.y - 0.7234) / 0.7234 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 0.7234');
  const we = primExtents({ buf, json, binOff }, 'VR_Wasp_Wing');
  assert.ok(Math.abs(we.z - 2.46) / 2.46 <= 0.1, 'wing span Z ' + we.z.toFixed(4) + ' ~ 2.46 (I509 double blade)');
  assert.ok(Math.abs(we.cz) <= 0.05, 'wing mirror-symmetric about the hull (cz ' + we.cz.toFixed(4) + '; pre-fix was -0.5500 - the wing-mirror regression guard)');
  const ne = primExtents({ buf, json, binOff }, 'VR_Wasp_Nose');
  assert.ok(Math.abs(ne.x - 0.62) / 0.62 <= 0.1, 'nose X ' + ne.x.toFixed(4) + ' ~ 0.62');
});

test('enemy_phantom.glb: I614 (ST-579 E89 D1) phantom v6 dart-hull remaster - nodes, per-node tris, extents, all-prim COLOR_0', () => {
  const { buf, json, binOff, fileSize } = remaster4Bake('enemy_phantom.glb', 'phantom');
  assert.ok(fileSize <= 276000, 'phantom under 276 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I614 meshopt 239,140 B; I614 raw 494,048 B; I613-style measured+15% rule 5 239,140 x 1.15 = 275,011 -> 276,000)');
  const s = meshStats({ buf, json, binOff });
  for (const n of ['VR_Hull', 'VR_PodL', 'VR_PodR', 'VR_Nose']) assert.ok(s.nodeNames.includes(n), n + ' node');
  assert.equal(s.nodeNames.length, 4, 'flat node set (no root nodes)');
  for (const mat of ['VR_HullMat', 'VR_PodLMat', 'VR_PodRMat', 'VR_NoseMat']) assert.ok(s.matNames.includes(mat), mat + ' material');
  assert.equal(s.totalTris, BUDGETS.phantom, 'phantom total tris == ' + BUDGETS.phantom + ' (I614 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Hull').tris, 4228, 'hull 4228 tris (I614 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Nose').tris, 668, 'nose 668 tris (I614 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_PodL').tris, 880, 'pod L 880 tris (I614 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_PodR').tris, 880, 'pod R 880 tris (I614 re-pin WITH measurement)');
  // Per-node extents: I516 TRUE-AXIS measurements (glb_probe.mjs; 10% band).
  const he = primExtents({ buf, json, binOff }, 'VR_Hull');
  assert.ok(Math.abs(he.x - 1.68) / 1.68 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 1.68 (I561)');
  assert.ok(Math.abs(he.y - 0.61) / 0.61 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 0.61 (I561)');
  assert.ok(Math.abs(he.z - 0.75) / 0.75 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 0.75 (I561)');
  const ne = primExtents({ buf, json, binOff }, 'VR_Nose');
  assert.ok(Math.abs(ne.x - 0.205) / 0.205 <= 0.1, 'nose X ' + ne.x.toFixed(4) + ' ~ 0.205 (I561)');
  const pl = primExtents({ buf, json, binOff }, 'VR_PodL');
  const pr = primExtents({ buf, json, binOff }, 'VR_PodR');
  assert.ok(Math.abs(pl.x - 0.261) / 0.261 <= 0.1, 'pod L X ' + pl.x.toFixed(4) + ' ~ 0.261 (I561)');
  assert.ok(Math.abs(pl.cz - 0.215) <= 0.03, 'pod L cz ' + pl.cz.toFixed(4) + ' ~ +0.215 (I561 mirror guard)');
  assert.ok(Math.abs(pr.cz + 0.215) <= 0.03, 'pod R cz ' + pr.cz.toFixed(4) + ' ~ -0.215 (I561 mirror guard)');
});

test('enemy_bulwark.glb: I616 (ST-579 E89 D3) hex-shield fortress v3 - nodes, per-node tris, extents, all-prim COLOR_0', () => {
  const { buf, json, binOff, fileSize } = remaster4Bake('enemy_bulwark.glb', 'bulwark');
  assert.ok(fileSize <= 212000, 'bulwark under 212 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I616 meshopt 183,852 B; I616 raw 435,868 B; I613-style measured+15% rule 5 183,852 x 1.15 = 211,430 -> 212,000)');
  const s = meshStats({ buf, json, binOff });
  for (const n of ['VR_Shield', 'VR_Core', 'VR_Spine']) assert.ok(s.nodeNames.includes(n), n + ' node');
  assert.equal(s.nodeNames.length, 3, 'flat node set (no root nodes)');
  for (const mat of ['VR_ShieldMat', 'VR_CoreMat', 'VR_SpineMat']) assert.ok(s.matNames.includes(mat), mat + ' material');
  assert.equal(s.totalTris, BUDGETS.bulwark, 'bulwark total tris == ' + BUDGETS.bulwark + ' (I616 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Shield').tris, 4146, 'shield 4146 tris (I616 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Core').tris, 1122, 'core 1122 tris (I616 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Spine').tris, 2140, 'spine 2140 tris (I616 exact)');
  // Per-node extents: I535 TRUE-AXIS measurements (probe535.mjs; 10% band).
  const sh = primExtents({ buf, json, binOff }, 'VR_Shield');
  assert.ok(Math.abs(sh.x - 0.4250) / 0.4250 <= 0.1, 'shield X (plate thickness) ' + sh.x.toFixed(4) + ' ~ 0.4250 (I535)');
  assert.ok(Math.abs(sh.y - 2.0811) / 2.0811 <= 0.1, 'shield Y (disc) ' + sh.y.toFixed(4) + ' ~ 2.0811 (I535)');
  assert.ok(Math.abs(sh.z - 2.1800) / 2.1800 <= 0.1, 'shield Z (disc) ' + sh.z.toFixed(4) + ' ~ 2.1800 (I535)');
  const co = primExtents({ buf, json, binOff }, 'VR_Core');
  assert.ok(Math.abs(co.x - 0.2306) / 0.2306 <= 0.1, 'core X ' + co.x.toFixed(4) + ' ~ 0.2306 (I535)');
  assert.ok(Math.abs(co.z - 0.4140) / 0.4140 <= 0.1, 'core Z ' + co.z.toFixed(4) + ' ~ 0.4140 (I535)');
  const sp = primExtents({ buf, json, binOff }, 'VR_Spine');
  assert.ok(Math.abs(sp.x - 0.9400) / 0.9400 <= 0.1, 'spine X ' + sp.x.toFixed(4) + ' ~ 0.9400 (I535)');
  assert.ok(Math.abs(sp.y - 0.4540) / 0.4540 <= 0.1, 'spine Y ' + sp.y.toFixed(4) + ' ~ 0.4540 (I535)');
  assert.ok(Math.abs(sp.z - 0.8000) / 0.8000 <= 0.1, 'spine Z ' + sp.z.toFixed(4) + ' ~ 0.8000 (I535)');
});
test('enemy_hauler.glb: I615 (ST-579 E89 D2) hauler v4 blocky industrial remaster - nodes, per-node tris, extents, sponson mirror guard, all-prim COLOR_0', () => {
  const { buf, json, binOff, fileSize } = remaster4Bake('enemy_hauler.glb', 'hauler');
  assert.ok(fileSize <= 313000, 'hauler under 313 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I615 meshopt 271,956 B; I615 raw 602,348 B; I613-style measured+15% rule 5 271,956 x 1.15 = 312,749 -> 313,000)');
  const s = meshStats({ buf, json, binOff });
  for (const n of ['VR_Hull', 'VR_SponsonL', 'VR_SponsonR', 'VR_Hatch', 'VR_Stack']) assert.ok(s.nodeNames.includes(n), n + ' node');
  assert.equal(s.nodeNames.length, 5, 'flat node set (no root nodes)');
  for (const mat of ['VR_HullMat', 'VR_SponsonLMat', 'VR_SponsonRMat', 'VR_HatchMat', 'VR_StackMat']) assert.ok(s.matNames.includes(mat), mat + ' material');
  assert.equal(s.totalTris, BUDGETS.hauler, 'hauler total tris == ' + BUDGETS.hauler + ' (I615 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Hull').tris, 5460, 'hull 5460 tris (I615 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_SponsonL').tris, 622, 'sponson L 622 tris (I615 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_SponsonR').tris, 622, 'sponson R 622 tris (I615 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Hatch').tris, 456, 'hatch 456 tris (I615 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Stack').tris, 562, 'stack 562 tris (I615 re-pin WITH measurement)');
  // Per-node extents: I517 TRUE-AXIS measurements (measure_facets517.mjs; 10% band).
  const he = primExtents({ buf, json, binOff }, 'VR_Hull');
  assert.ok(Math.abs(he.x - 1.7200) / 1.7200 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 1.7200 (I561)');
  assert.ok(Math.abs(he.y - 1.0887) / 1.0887 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 1.0887 (I561)');
  assert.ok(Math.abs(he.z - 1.1321) / 1.1321 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 1.1321 (I561)');
  const sl = primExtents({ buf, json, binOff }, 'VR_SponsonL');
  const sr = primExtents({ buf, json, binOff }, 'VR_SponsonR');
  assert.ok(Math.abs(sl.x - 1.3300) / 1.3300 <= 0.1, 'sponson L X ' + sl.x.toFixed(4) + ' ~ 1.3300 (I561)');
  assert.ok(Math.abs(sl.y - 0.2350) / 0.2350 <= 0.1, 'sponson L Y ' + sl.y.toFixed(4) + ' ~ 0.2350 (I561)');
  assert.ok(Math.abs(sl.z - 0.2350) / 0.2350 <= 0.1, 'sponson L Z ' + sl.z.toFixed(4) + ' ~ 0.2350 (I561)');
  assert.ok(Math.abs(sr.x - sl.x) <= 0.01 && Math.abs(sr.y - sl.y) <= 0.01 && Math.abs(sr.z - sl.z) <= 0.01, 'sponson R extents mirror L (x ' + sr.x.toFixed(4) + ', y ' + sr.y.toFixed(4) + ', z ' + sr.z.toFixed(4) + ')');
  assert.ok(Math.abs(sl.cz - 0.4783) <= 0.03, 'sponson L cz ' + sl.cz.toFixed(4) + ' ~ +0.4783 (I561 mirror guard)');
  assert.ok(Math.abs(sr.cz + 0.4817) <= 0.03, 'sponson R cz ' + sr.cz.toFixed(4) + ' ~ -0.4817 (I561 mirror guard)');
  const ht = primExtents({ buf, json, binOff }, 'VR_Hatch');
  assert.ok(Math.abs(ht.x - 0.3040) / 0.3040 <= 0.1, 'hatch X ' + ht.x.toFixed(4) + ' ~ 0.3040 (I615 re-pin WITH measurement)');
  assert.ok(Math.abs(ht.y - 0.2769) / 0.2769 <= 0.1, 'hatch Y ' + ht.y.toFixed(4) + ' ~ 0.2769 (I561)');
  assert.ok(Math.abs(ht.z - 0.2500) / 0.2500 <= 0.1, 'hatch Z ' + ht.z.toFixed(4) + ' ~ 0.2500 (I561)');
  const st = primExtents({ buf, json, binOff }, 'VR_Stack');
  assert.ok(Math.abs(st.x - 0.3700) / 0.3700 <= 0.1, 'stack X ' + st.x.toFixed(4) + ' ~ 0.3700 (I561)');
  assert.ok(Math.abs(st.y - 1.4450) / 1.4450 <= 0.1, 'stack Y ' + st.y.toFixed(4) + ' ~ 1.4450 (I561)');
  assert.ok(Math.abs(st.z - 0.3700) / 0.3700 <= 0.1, 'stack Z ' + st.z.toFixed(4) + ' ~ 0.3700 (I561)');
});
test('enemy_sweeper.glb: I617 (ST-579 E89 D4) sweeper v4 arc-sweep delta interceptor remaster - nodes, per-node tris, extents, arc mirror guard, all-prim COLOR_0', () => {
  const { buf, json, binOff, fileSize } = remaster4Bake('enemy_sweeper.glb', 'sweeper');
  assert.ok(fileSize <= 134000, 'sweeper under 134 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I617 meshopt 116,196 B; I609 54,220 B; I616-style measured+15% rule 5 116,196 x 1.15 = 133,625 -> 134,000)');
  const s = meshStats({ buf, json, binOff });
  for (const n of ['VR_Sweeper_Hull', 'VR_Sweeper_Arc', 'VR_Sweeper_Greeble']) assert.ok(s.nodeNames.includes(n), n + ' node');
  assert.equal(s.nodeNames.length, 3, 'flat node set (no root nodes)');
  for (const mat of ['VR_Sweeper_HullMat', 'VR_Sweeper_ArcMat', 'VR_Sweeper_GreebleMat']) assert.ok(s.matNames.includes(mat), mat + ' material');
  assert.equal(s.totalTris, BUDGETS.sweeper, 'sweeper total tris == ' + BUDGETS.sweeper + ' (I617 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Sweeper_Hull').tris, 2170, 'hull 2170 tris (I617 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Sweeper_Arc').tris, 1130, 'arc 1130 tris (I617 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Sweeper_Greeble').tris, 704, 'greeble 704 tris (I617 re-pin WITH measurement)');
  // Per-node extents: I552 TRUE-AXIS measurements (measure552.mjs; 10% band).
  const he = primExtents({ buf, json, binOff }, 'VR_Sweeper_Hull');
  assert.ok(Math.abs(he.x - 2.7950) / 2.7950 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 2.7950 (I561)');
  assert.ok(Math.abs(he.y - 0.5375) / 0.5375 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 0.5375 (I561)');
  assert.ok(Math.abs(he.z - 2.1600) / 2.1600 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 2.1600 (I561)');
  const ae = primExtents({ buf, json, binOff }, 'VR_Sweeper_Arc');
  assert.ok(Math.abs(ae.z - 1.9657) / 1.9657 <= 0.1, 'arc Z ' + ae.z.toFixed(4) + ' ~ 1.9657 (I561 sweep span)');
  assert.ok(Math.abs(ae.cz) <= 0.05, 'arc mirror-symmetric about the hull axis (cz ' + ae.cz.toFixed(4) + '; I552 mirror guard, measured 0.0000)');
  const ge = primExtents({ buf, json, binOff }, 'VR_Sweeper_Greeble');
  assert.ok(Math.abs(ge.cz) <= 0.05, 'greeble centered on the hull axis (cz ' + ge.cz.toFixed(4) + '; I552)');
});
test('enemy_beacon.glb: I618 (ST-579 E89 D5) beacon v3 signal monolith remaster - nodes, per-node tris, extents, all-prim COLOR_0', () => {
  const { buf, json, binOff, fileSize } = remaster4Bake('enemy_beacon.glb', 'beacon');
  assert.ok(fileSize <= 198000, 'beacon under 198 KB (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I618 meshopt 172,276 B; I609 88,204 B; I616-style measured+15% rule 5 172,276 x 1.15 = 198,117 -> 198,000)');
  const s = meshStats({ buf, json, binOff });
  for (const n of ['VR_Beacon_Base', 'VR_Beacon_Tower', 'VR_Beacon_Lamp']) assert.ok(s.nodeNames.includes(n), n + ' node');
  assert.equal(s.nodeNames.length, 3, 'flat node set (no root nodes)');
  for (const mat of ['VR_Beacon_BaseMat', 'VR_Beacon_TowerMat', 'VR_Beacon_LampMat']) assert.ok(s.matNames.includes(mat), mat + ' material');
  assert.equal(s.totalTris, BUDGETS.beacon, 'beacon total tris == ' + BUDGETS.beacon + ' (I618 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Beacon_Base').tris, 2572, 'base 2572 tris (I618 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Beacon_Tower').tris, 1696, 'tower 1696 tris (I618 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Beacon_Lamp').tris, 562, 'lamp 562 tris (I618 re-pin WITH measurement)');
  // Per-node extents: I552 TRUE-AXIS measurements (measure552.mjs; 10% band).
  const be = primExtents({ buf, json, binOff }, 'VR_Beacon_Base');
  assert.ok(Math.abs(be.x - 3.3400) / 3.3400 <= 0.1, 'base X ' + be.x.toFixed(4) + ' ~ 3.3400 (I552)');
  assert.ok(Math.abs(be.y - 0.9000) / 0.9000 <= 0.1, 'base Y ' + be.y.toFixed(4) + ' ~ 0.9000 (I552)');
  assert.ok(Math.abs(be.z - 3.3800) / 3.3800 <= 0.1, 'base Z ' + be.z.toFixed(4) + ' ~ 3.3800 (I552)');
  const te = primExtents({ buf, json, binOff }, 'VR_Beacon_Tower');
  assert.ok(Math.abs(te.y - 1.9450) / 1.9450 <= 0.1, 'tower Y ' + te.y.toFixed(4) + ' ~ 1.9450 (I552)');
  const le = primExtents({ buf, json, binOff }, 'VR_Beacon_Lamp');
  assert.ok(Math.abs(le.y - 0.7750) / 0.7750 <= 0.1, 'lamp Y ' + le.y.toFixed(4) + ' ~ 0.7750 (I552)');
  assert.ok(Math.abs(be.cx) <= 0.05 && Math.abs(be.cz) <= 0.05 && Math.abs(te.cx) <= 0.05 && Math.abs(le.cx) <= 0.05, 'beacon centered on the origin (I552 stationary island)');
});
// I212: arena boundary ring (ST-212, cgs-dev-story). I254/ST-245 v2: two-node GLB
// (VR_ArenaRing band + VR_ArenaRing_Ticks neon accent). The v1 exact-48-tris pin is
// replaced by the two-node counts (band 48 + ticks 12 = 60), documented here.
test('arena_ring.glb: 2 nodes (band+ticks), 60 tris, flat unit ring, +Y normals, COLOR_0 value bake (I212/I254/I299)', () => {
  const { buf, json, binOff, fileSize } = parseGlb('arena_ring.glb');
  assert.ok(fileSize < MAX_FILE_BYTES, 'arena_ring.glb under 100 KB');
assert.ok(fileSize <= 5200, 'arena_ring.glb v3 <= 5.2 KB file (' + fileSize + ' B); I254 4032 -> I299 5544 (COLOR_0 bake) -> I609 5048 (meshopt)'); // I299
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_ArenaRing'), 'VR_ArenaRing node');
assert.ok(s.nodeNames.includes('VR_ArenaRing_Ticks'), 'VR_ArenaRing_Ticks node (I254)');
  assert.ok(s.matNames.includes('VR_ArenaRing'), 'VR_ArenaRing material');
assert.ok(s.matNames.includes('VR_ArenaRing_Ticks'), 'VR_ArenaRing_Ticks material (I254)');
  // I299 (ST-281): both prims now carry a grayscale corner-domain COLOR_0 value bake
  // (band subtle radial darkening 0.92->1.0, ticks bright neon 1.0->1.05) that multiplies
  // the in-code tint (arenaRing.js vertexColors:true). Geometry invariants below unchanged.
  for (const p of s.prims) assert.ok(p.hasColor, p.name + ' primitive has COLOR_0 (I299 value bake)');
  const RING_FACET = { VR_ArenaRing: { p10: 0.92, p50: 1.0, p90: 1.0 }, VR_ArenaRing_Ticks: { p10: 1.0, p50: 1.05, p90: 1.05 } };
  function ringFacetLumas(p) {
    // prims entries carry posAcc, not the raw glTF primitive - resolve it by POSITION accessor identity
    let raw = null;
    for (const m of json.meshes || []) for (const q of m.primitives || []) {
      const pa = json.accessors[q.attributes.POSITION];
      if (pa.bufferView === p.posAcc.bufferView && (pa.byteOffset || 0) === (p.posAcc.byteOffset || 0) && pa.count === p.posAcc.count) raw = q;
    }
    assert.ok(raw, p.name + ' raw primitive resolved');
    const cAcc = json.accessors[raw.attributes.COLOR_0];
    const cbv = json.bufferViews[cAcc.bufferView];
    assert.equal(cAcc.componentType, 5126, p.name + ' COLOR_0 componentType FLOAT');
    assert.equal(cAcc.type, 'VEC3', p.name + ' COLOR_0 type VEC3');
    assert.equal(cAcc.count, p.posAcc.count, p.name + ' COLOR_0 count == POSITION count');
    const vals = [];
    for (let i = 0; i < cAcc.count; i++) {
      const o = binOff + (cbv.byteOffset || 0) + (cAcc.byteOffset || 0) + i * 12;
      const r = buf.readFloatLE(o), g = buf.readFloatLE(o + 4), b = buf.readFloatLE(o + 8);
      assert.ok(Math.abs(r - g) <= 0.02 && Math.abs(g - b) <= 0.02, p.name + ' COLOR_0 grayscale at ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));
      assert.ok(r >= 0.30 - 0.01 && r <= 1.25 + 0.01, p.name + ' COLOR_0 in [0.30,1.25] at ' + i + ': ' + r.toFixed(3));
      vals.push(r);
    }
    vals.sort((a, b) => a - b);
    const pct = (f) => vals[Math.floor(vals.length * f)];
    return { p10: pct(0.1), p50: pct(0.5), p90: pct(0.9) };
  }
  for (const [mn, spec] of Object.entries(RING_FACET)) {
    const pp = s.prims.find((p) => p.name === mn);
    assert.ok(pp, mn + ' primitive present');
    const lum = ringFacetLumas(pp);
    assert.ok(Math.abs(lum.p10 - spec.p10) <= 0.005, mn + ' COLOR_0 p10 ' + lum.p10.toFixed(4) + ' ~ ' + spec.p10);
    assert.ok(Math.abs(lum.p50 - spec.p50) <= 0.005, mn + ' COLOR_0 p50 ' + lum.p50.toFixed(4) + ' ~ ' + spec.p50);
    assert.ok(Math.abs(lum.p90 - spec.p90) <= 0.005, mn + ' COLOR_0 p90 ' + lum.p90.toFixed(4) + ' ~ ' + spec.p90);
  }
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
// I289 (ST-273 warden hull/armor value pass): both prims now carry a grayscale
// per-face COLOR_0 value bake (Blender 5.2, corner-domain, vertex-split on export)
// that multiplies the in-code material tint (wardenMesh.js vertexColors:true).
// Geometry UNCHANGED (tris/radii pins below hold). The 8 in-code spike cones are
// not part of the GLB.
const WARDEN_FACET = {
  VR_Warden_Armor: { p10: 0.5149, p50: 0.9351, p90: 1.3726 },  // I593 (ST-560 E84) v2 re-pin WITH measurement (I508: 0.38/0.38/0.673)
  VR_Warden_Hull:  { p10: 0.6524, p50: 0.9697, p90: 1.3456 }, // I593 v2 re-pin WITH measurement (I508: 0.28/0.4737/0.70)
};
function wardenFacetLumas({ buf, json, binOff }, p) {
  // Per-prim variant of enemyFacetLumas (that reader picks a single primitive; the
  // warden bakes both hull AND armor with distinct value distributions).
  const cAcc = json.accessors[p.attributes.COLOR_0];
  const iAcc = json.accessors[p.indices];
  const cBase = binOff + (json.bufferViews[cAcc.bufferView].byteOffset || 0) + (cAcc.byteOffset || 0);
  const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
  const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i * 2) : iAcc.componentType === 5125 ? buf.readUInt32LE(iBase + i * 4) : buf.readUInt8(iBase + i));
  const fl = [];
  for (let t = 0; t < iAcc.count / 3; t++) {
    const lum = (i) => {
      const o = cBase + i * 12;
      return 0.2126 * buf.readFloatLE(o) + 0.7152 * buf.readFloatLE(o + 4) + 0.0722 * buf.readFloatLE(o + 8);
    };
    fl.push((lum(readIdx(t * 3)) + lum(readIdx(t * 3 + 1)) + lum(readIdx(t * 3 + 2))) / 3);
  }
  fl.sort((a, b) => a - b);
  const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
  return { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
}
test('warden.glb: naming, poly budget, hull/armor radii, grayscale COLOR_0 value bake (I220 -> I289 -> I508)', () => {
  const { buf, json, binOff, fileSize } = parseGlb('warden.glb');
  assert.ok(fileSize <= 49 * 1024, 'warden.glb ' + fileSize + ' B <= 49 KB (I609 meshopt 49,020 B; I508 re-pin 40 -> 96 KB; I593 v2 raw 64,448 B)');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Warden_Hull'), 'VR_Warden_Hull node');
  assert.ok(s.nodeNames.includes('VR_Warden_Armor'), 'VR_Warden_Armor node');
  assert.ok(s.matNames.includes('VR_Warden_Hull'), 'VR_Warden_Hull material (I593 v2: VR_ naming without the I508 Mat suffix - vestigial, in-code JS material governs)');
  assert.ok(s.matNames.includes('VR_Warden_Armor'), 'VR_Warden_Armor material (I593 v2: VR_ naming without the I508 Mat suffix)');
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    const mn = m.name || 'mesh';
    assert.ok(p.attributes.COLOR_0 !== undefined, mn + ' primitive has COLOR_0 (I289/I508 value bake)');
    const acc = json.accessors[p.attributes.COLOR_0];
    const bv = json.bufferViews[acc.bufferView];
    const stride = parseInt(acc.type.replace('VEC', ''), 10);
    assert.equal(acc.componentType, 5126, mn + ' COLOR_0 componentType FLOAT');
    assert.equal(acc.type, 'VEC3', mn + ' COLOR_0 type VEC3');
    assert.ok(bv.byteLength >= acc.count * stride * 4, mn + ' COLOR_0 bufferView spec-size');
    const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    for (let i = 0; i < acc.count; i++) {
      const rv = buf.readFloatLE(base + i * stride * 4);
      const gv = buf.readFloatLE(base + i * stride * 4 + 4);
      const bv2 = buf.readFloatLE(base + i * stride * 4 + 8);
      assert.ok(Math.abs(rv - gv) <= 0.02 && Math.abs(gv - bv2) <= 0.02, mn + ' COLOR_0 grayscale at ' + i + ': ' + [rv, gv, bv2].map((x) => x.toFixed(3)).join(','));
      assert.ok(rv >= 0.25 && rv <= 1.55, mn + ' COLOR_0 in [0.25,1.55] I593 v2 value domain at ' + i + ': ' + rv.toFixed(3));
    }
    const f = wardenFacetLumas({ buf, json, binOff }, p);
    const E = WARDEN_FACET[mn];
    assert.ok(f.p90 - f.p10 >= 0.25, mn + ' facet luma spread ' + (f.p90 - f.p10).toFixed(3) + ' >= 0.25 (I508 value bake; Armor side slabs are flat by design)');
    for (const k of ['p10', 'p50', 'p90']) {
      assert.ok(Math.abs(f[k] - E[k]) <= 0.005, mn + ' facet ' + k + ' ' + f[k].toFixed(4) + ' ~ ' + E[k] + ' (I508 bake pin)');
    }
  }
  assert.ok(s.totalTris <= BUDGETS.warden, 'warden tris ' + s.totalTris + ' <= 2290 (I593 v2 re-pin)');
  assert.ok(s.totalTris >= 1556, 'warden tris ' + s.totalTris + ' >= 1556 (I508 legacy-4 measured floor - no silent simplification)');
  const hull = s.prims.find((p) => p.name.includes('Hull'));
  const armor = s.prims.find((p) => p.name.includes('Armor'));
  const r = CONFIG.warden.radius;
  // I593 (ST-560 E84) v2 re-pins WITH measurement (supersede I508): hull = hex fortress + parapet +
  // turret -> maxRadius 2.4790 (~r*1.458); armor = 3 mounted bracketed slabs -> maxRadius 2.3841
  // (v3 slabs sit ON the hull surface - mounted, not protruding; I508 slabs protruded to 3.4111;
  // the in-code spike collar at r*1.35 = 2.295 now embeds in the hull mass - documented residual).
  assert.ok(hull.maxRadius >= r * 0.95, 'hull covers the logical body (' + hull.maxRadius.toFixed(3) + ')');
  assert.ok(Math.abs(hull.maxRadius - 2.4790) / 2.4790 <= 0.10, 'hull max radius ' + hull.maxRadius.toFixed(3) + ' ~ 2.4790 (I593 v2 pin)');
  assert.ok(Math.abs(armor.maxRadius - 2.3841) / 2.3841 <= 0.10, 'armor outer radius ' + armor.maxRadius.toFixed(3) + ' ~ 2.3841 (I593 v2 pin)');
});

// I371 (ST-338 E41 comet re-bake; supersedes the I344 note): comet rock variant
// (render-only, zero src/core). One mesh/one prim; LUMPY nucleus (4 convex bumps + 2 shallow
// craters, static displacement only, no subdivision) with the ion tail baked into the SAME
// mesh as a COLOR_0 gradient (warm coma base -> bright blue-white ion tip, brighter than I344).
// Renderer swaps it into an existing S pool slot (size S + variant 2) => +0 new draw-call path.
// I421 (ST-391 E52 comet re-bake; supersedes the I371 note): ELONGATED icy nucleus (icosphere 42v/80t, 1.35x X-elongation, fbm icy lumps) + 8-seg open cone ion tail (16t) = 96t; warm nucleus -> bright blue-white ion tip; head maxperp 0.5481 (S-scale).
// I441 (ST-411) comet v3 re-bake: cratered icosphere head (430t) + twisted 16-seg x 6-ring ion-tail tube (160t) = 590t; xspan 2.5716; head maxperp 0.5418 (S-scale); single mesh/prim + VR_Rock_Comet + warm-head/cool-tail contract unchanged.
// Node VR_Rock_Comet, mat VR_Rock_Comet.
const COMET_FACET = { p10: 0.6883, p50: 0.7540, p90: 0.8654, mean: 0.7710 }; // I621 (ST-581 E90 D1) comet v13 RE-PIN WITH MEASUREMENT (1120t/22,052B -> 2400t/43,872B, lobed head 1920t + tapered tail 480t): 0.6946/0.7689/0.8862/0.7817 -> 0.6883/0.7540/0.8654/0.7710 (measure621.cjs; xspan 2.8124 -> 2.6830, head maxperp 0.560 within 0.58 +/-12%, warm 1058 / cool 152) // I554 (ST-520 E75 D5) comet v12 RE-PIN WITH MEASUREMENT (590t/15,968B -> 1120t/28,308B, cratered head + tapered ion tail): 0.7172/0.7606/0.8559/0.7756 -> 0.6946/0.7689/0.8862/0.7817 (measure554.cjs; xspan 2.5716 -> 2.8124, head maxperp 0.560 within 0.58 +/-12%, warm 490 / cool 78) // I441 (ST-411): 0.7312/0.7413/0.8075/0.7547 -> 0.7172/0.7606/0.8559/0.7756 (v3)
test('asteroid_comet.glb: naming, poly budget, single mesh/prim, shape, COLOR_0 warm-head/cool-tail gradient (I344, re-baked I421)', () => {
  const { buf, json, binOff, fileSize } = parseGlb('asteroid_comet.glb');
  assert.ok(fileSize <= 50500, 'asteroid_comet.glb ' + fileSize + ' B <= 50,500 B (I621 rock v13 RE-PIN WITH MEASUREMENT: 43,872 B x 1.15 = 50,453 -> 50,500 per rule 5; I554 v12 was 22,732)');
  const s2 = meshStats({ buf, json, binOff });
  assert.ok(s2.nodeNames.includes('VR_Rock_Comet'), 'VR_Rock_Comet node');
  assert.ok(s2.matNames.includes('VR_Rock_Comet'), 'VR_Rock_Comet material');
  assert.equal((json.meshes || []).length, 1, 'single mesh');
  assert.equal(json.meshes[0].primitives.length, 1, 'single primitive (no tail mesh, +0 draw path)');
  assert.ok(s2.totalTris <= BUDGETS.comet, 'comet tris ' + s2.totalTris + ' <= 650');
  const p = json.meshes[0].primitives[0];
  assert.ok(p.attributes.COLOR_0 !== undefined, 'primitive has COLOR_0 (ion-tail gradient)');
  const acc = json.accessors[p.attributes.COLOR_0];
  assert.equal(acc.componentType, 5126, 'COLOR_0 componentType FLOAT');
  assert.equal(acc.type, 'VEC3', 'COLOR_0 type VEC3');
  assert.equal(acc.count, json.accessors[p.attributes.POSITION].count, 'COLOR_0 count == POSITION count');
  const pbv = json.bufferViews[json.accessors[p.attributes.POSITION].bufferView];
  let minx = Infinity, maxx = -Infinity, maxperp = 0;
  for (let i = 0; i < json.accessors[p.attributes.POSITION].count; i++) {
    const o = binOff + (pbv.byteOffset || 0) + (json.accessors[p.attributes.POSITION].byteOffset || 0) + i * 12;
    const x = buf.readFloatLE(o), y = buf.readFloatLE(o + 4), z = buf.readFloatLE(o + 8);
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    const perp = Math.sqrt(y * y + z * z); if (perp > maxperp) maxperp = perp;
  }
  const xspan = maxx - minx;
  assert.ok(xspan > 2.2 * maxperp, 'comet elongated: x-span ' + xspan.toFixed(3) + ' > 2.2x head ' + maxperp.toFixed(3));
  assert.ok(Math.abs(maxperp - 0.58) / 0.58 <= 0.12, 'head perpendicular radius ' + maxperp.toFixed(3) + ' ~ 0.58 (S-scale)');
  assert.ok(Math.abs(xspan - 2.6830) <= 0.06, 'comet x-span ' + xspan.toFixed(4) + ' ~ 2.6830 (I621 v13 re-pin WITH MEASUREMENT 2.8124 -> 2.6830 [head lobes, fresh seed 77409]; I554 v12 was 2.8124; I421 was 2.464; I344 1.5828)');
  const cbv = json.bufferViews[acc.bufferView]; const cbase = binOff + (cbv.byteOffset || 0) + (acc.byteOffset || 0);
  let warm = 0, cool = 0;
  for (let i = 0; i < acc.count; i++) {
    const r = buf.readFloatLE(cbase + i * 12), g = buf.readFloatLE(cbase + i * 12 + 4), b = buf.readFloatLE(cbase + i * 12 + 8);
    for (const v of [r, g, b]) assert.ok(v >= 0.09 && v <= 1.41, 'comet COLOR_0 channel in [0.10,1.40]: ' + v.toFixed(3));
    if (r >= b - 1e-4) warm++; else cool++;
  }
  assert.ok(warm > 0 && cool > 0, 'comet has warm-head (' + warm + ') and cool ion-tail (' + cool + ') verts');
  const iAcc = json.accessors[p.indices];
  const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
  const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i * 2) : iAcc.componentType === 5125 ? buf.readUInt32LE(iBase + i * 4) : buf.readUInt8LE(iBase + i));
  const vL = []; for (let i = 0; i < acc.count; i++) vL.push(0.2126 * buf.readFloatLE(cbase + i * 12) + 0.7152 * buf.readFloatLE(cbase + i * 12 + 4) + 0.0722 * buf.readFloatLE(cbase + i * 12 + 8));
  const fl = []; for (let t = 0; t < iAcc.count / 3; t++) fl.push((vL[readIdx(t * 3)] + vL[readIdx(t * 3 + 1)] + vL[readIdx(t * 3 + 2)]) / 3);
  fl.sort((a, b2) => a - b2); const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
  const f = { p10: q(0.1), p50: q(0.5), p90: q(0.9), mean: fl.reduce((sm, x) => sm + x, 0) / fl.length };
  for (const k of ['p10', 'p50', 'p90', 'mean']) assert.ok(Math.abs(f[k] - COMET_FACET[k]) <= 0.005, 'comet facet ' + k + ' ' + f[k].toFixed(3) + ' ~ ' + COMET_FACET[k]);
});

test('debris_chunk.glb: naming, poly budget, shard radius, grayscale COLOR_0 value bake (I410/ST-380)', () => {
  const { buf, json, binOff, fileSize } = parseGlb('debris_chunk.glb');
  assert.ok(fileSize <= 12000, 'debris_chunk.glb ' + fileSize + ' B <= 12 KB (I609 meshopt 4,632 B; ST-380 budget)');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Debris_Chunk'), 'VR_Debris_Chunk node');
  assert.ok(s.matNames.includes('VR_Debris'), 'VR_Debris material');
  assert.equal((json.meshes || []).length, 1, 'single mesh');
  assert.equal(json.meshes[0].primitives.length, 1, 'single primitive');
  assert.ok(s.totalTris <= BUDGETS.chunk, 'tris ' + s.totalTris + ' <= 60');
  for (const pr of s.prims) assert.ok(Math.abs(pr.maxRadius - 0.5) / 0.5 <= 0.10, 'maxRadius ' + pr.maxRadius.toFixed(4) + ' ~ 0.5 (+/-10%)');
  const p = json.meshes[0].primitives[0];
  assert.ok(p.attributes.COLOR_0 !== undefined, 'primitive has COLOR_0 (grayscale value bake)');
  const acc = json.accessors[p.attributes.COLOR_0];
  assert.equal(acc.componentType, 5126, 'COLOR_0 componentType FLOAT');
  assert.equal(acc.type, 'VEC3', 'COLOR_0 type VEC3');
  assert.equal(acc.count, json.accessors[p.attributes.POSITION].count, 'COLOR_0 count == POSITION count');
  const cbv = json.bufferViews[acc.bufferView]; const cbase = binOff + (cbv.byteOffset || 0) + (acc.byteOffset || 0);
  for (let i = 0; i < acc.count; i++) {
    const r = buf.readFloatLE(cbase + i * 12), g = buf.readFloatLE(cbase + i * 12 + 4), b = buf.readFloatLE(cbase + i * 12 + 8);
    for (const v of [r, g, b]) assert.ok(v >= 0.89 && v <= 1.11, 'COLOR_0 channel in [0.89,1.11]: ' + v.toFixed(3));
    assert.ok(Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) <= 0.02, 'grayscale dev <= 0.02 at vert ' + i + ': ' + r.toFixed(3) + '/' + g.toFixed(3) + '/' + b.toFixed(3));
  }
});

test('debris_sliver.glb: naming, poly budget, shard radius, grayscale COLOR_0 value bake (I410/ST-380)', () => {
  const { buf, json, binOff, fileSize } = parseGlb('debris_sliver.glb');
  assert.ok(fileSize <= 12000, 'debris_sliver.glb ' + fileSize + ' B <= 12 KB (I609 meshopt 4,588 B; ST-380 budget)');
  const s = meshStats({ buf, json, binOff });
  assert.ok(s.nodeNames.includes('VR_Debris_Sliver'), 'VR_Debris_Sliver node');
  assert.ok(s.matNames.includes('VR_Debris'), 'VR_Debris material');
  assert.equal((json.meshes || []).length, 1, 'single mesh');
  assert.equal(json.meshes[0].primitives.length, 1, 'single primitive');
  assert.ok(s.totalTris <= BUDGETS.sliver, 'tris ' + s.totalTris + ' <= 50');
  for (const pr of s.prims) assert.ok(Math.abs(pr.maxRadius - 0.5) / 0.5 <= 0.10, 'maxRadius ' + pr.maxRadius.toFixed(4) + ' ~ 0.5 (+/-10%)');
  const p = json.meshes[0].primitives[0];
  assert.ok(p.attributes.COLOR_0 !== undefined, 'primitive has COLOR_0 (grayscale value bake)');
  const acc = json.accessors[p.attributes.COLOR_0];
  assert.equal(acc.componentType, 5126, 'COLOR_0 componentType FLOAT');
  assert.equal(acc.type, 'VEC3', 'COLOR_0 type VEC3');
  assert.equal(acc.count, json.accessors[p.attributes.POSITION].count, 'COLOR_0 count == POSITION count');
  const cbv = json.bufferViews[acc.bufferView]; const cbase = binOff + (cbv.byteOffset || 0) + (acc.byteOffset || 0);
  for (let i = 0; i < acc.count; i++) {
    const r = buf.readFloatLE(cbase + i * 12), g = buf.readFloatLE(cbase + i * 12 + 4), b = buf.readFloatLE(cbase + i * 12 + 8);
    for (const v of [r, g, b]) assert.ok(v >= 0.89 && v <= 1.11, 'COLOR_0 channel in [0.89,1.11]: ' + v.toFixed(3));
    assert.ok(Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) <= 0.02, 'grayscale dev <= 0.02 at vert ' + i + ': ' + r.toFixed(3) + '/' + g.toFixed(3) + '/' + b.toFixed(3));
  }
});

test('boss_archon.glb: I553 (ST-519 E75 D4) the Archon throne - nodes, per-node tris, extents, mirror guards, all-prim COLOR_0', () => {
  const { buf, json, binOff, fileSize } = remaster4Bake('boss_archon.glb', 'archon');
  assert.ok(fileSize <= 278100, 'archon under 278,100 B (measured ' + (fileSize / 1024).toFixed(2) + ' KB; I622 AMENDMENT-encoded 241,800 B; I553 58,916 B)');
  const s = meshStats({ buf, json, binOff });
  for (const n of ['VR_Archon_Hull', 'VR_Archon_Crown', 'VR_Archon_Core']) assert.ok(s.nodeNames.includes(n), n + ' node');
  assert.equal(s.nodeNames.length, 3, 'flat node set (no root nodes)');
  for (const mat of ['VR_Archon_HullMat', 'VR_Archon_CrownMat', 'VR_Archon_CoreMat']) assert.ok(s.matNames.includes(mat), mat + ' material');
  assert.equal(s.totalTris, BUDGETS.archon, 'archon total tris == ' + BUDGETS.archon + ' (I622 re-pin WITH measurement)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Archon_Hull').tris, 5688, 'hull 5688 tris (I622 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Archon_Crown').tris, 3184, 'crown 3184 tris (I622 exact)');
  assert.equal(s.prims.find((p) => p.name === 'VR_Archon_Core').tris, 1868, 'core 1868 tris (I622 exact)');
  const he = primExtents({ buf, json, binOff }, 'VR_Archon_Hull');
  assert.ok(Math.abs(he.x - 4.5200) / 4.5200 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 4.5200 (I622)');
  assert.ok(Math.abs(he.y - 8.6150) / 8.6150 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 8.6150 (I622)');
  assert.ok(Math.abs(he.z - 4.5200) / 4.5200 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 4.5200 (I622)');
  const ce = primExtents({ buf, json, binOff }, 'VR_Archon_Crown');
  assert.ok(Math.abs(ce.x - 3.2400) / 3.2400 <= 0.1, 'crown X ' + ce.x.toFixed(4) + ' ~ 3.2400 (I622)');
  assert.ok(Math.abs(ce.y - 3.5250) / 3.5250 <= 0.1, 'crown Y ' + ce.y.toFixed(4) + ' ~ 3.5250 (I622)');
  const co = primExtents({ buf, json, binOff }, 'VR_Archon_Core');
  assert.ok(Math.abs(co.x - 1.3000) / 1.3000 <= 0.1, 'core X ' + co.x.toFixed(4) + ' ~ 1.3000 (I622)');
  assert.ok(Math.abs(co.y - 3.3600) / 3.3600 <= 0.1, 'core Y ' + co.y.toFixed(4) + ' ~ 3.3600 (I622)');
  assert.ok(Math.abs(he.cx) <= 0.05 && Math.abs(ce.cx) <= 0.05 && Math.abs(co.cx) <= 0.05, 'archon centered on the X origin (mirror)');
  assert.ok(co.cz > 0, 'core seam on the +Z face (measured cz ' + co.cz.toFixed(4) + ')');
});