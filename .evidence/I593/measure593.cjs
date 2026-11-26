// I593 (ST-560) THE SWAP - measure the 4 swapped v2 GLBs + full asset-set totals (test-identical logic)
const fs = require('node:fs');
const path = require('node:path');
const A = 'E:/Game/assets';
function parseGlb(file) {
  const buf = fs.readFileSync(path.join(A, file));
  const json0 = buf.readUInt32LE(12);
  const pad = json0 % 4 ? 4 - json0 % 4 : 0;
  const json = JSON.parse(buf.slice(20, 20 + json0).toString('utf8'));
  const binOff = 20 + json0 + pad + 8;
  return { buf, json, binOff };
}
function probe(file) {
  const { buf, json, binOff } = parseGlb(file);
  let totalTris = 0;
  const perNode = {};
  const min = { x: Infinity, y: Infinity, z: Infinity }, max = { x: -Infinity, y: -Infinity, z: -Infinity };
  let cmin = Infinity, cmax = -Infinity;
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    const idx = p.indices !== undefined ? json.accessors[p.indices] : null;
    const t = Math.round((idx ? idx.count : 0) / 3);
    totalTris += t;
    const mn = m.name || 'mesh';
    perNode[mn] = perNode[mn] || { tris: 0, maxR: 0, facets: [] };
    perNode[mn].tris += t;
    const posAcc = json.accessors[p.attributes.POSITION];
    const bv = json.bufferViews[posAcc.bufferView];
    const pbase = binOff + (bv.byteOffset || 0) + (posAcc.byteOffset || 0);
    for (let i = 0; i < posAcc.count; i++) {
      const o = pbase + i * 12;
      const x = buf.readFloatLE(o), y = buf.readFloatLE(o + 4), z = buf.readFloatLE(o + 8);
      if (x < min.x) min.x = x; if (x > max.x) max.x = x;
      if (y < min.y) min.y = y; if (y > max.y) max.y = y;
      if (z < min.z) min.z = z; if (z > max.z) max.z = z;
      const r = Math.sqrt(x * x + y * y + z * z);
      if (r > perNode[mn].maxR) perNode[mn].maxR = r;
    }
    if (p.attributes.COLOR_0 === undefined) continue;
    const acc = json.accessors[p.attributes.COLOR_0];
    const cbv = json.bufferViews[acc.bufferView];
    const base = binOff + (cbv.byteOffset || 0) + (acc.byteOffset || 0);
    for (let i = 0; i < acc.count; i++) {
      const v = buf.readFloatLE(base + i * 12);
      if (v < cmin) cmin = v; if (v > cmax) cmax = v;
    }
    const iAcc = json.accessors[p.indices];
    const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
    const ri = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i * 2) : buf.readUInt32LE(iBase + i * 4));
    const lum = (i) => 0.2126 * buf.readFloatLE(base + i * 12) + 0.7152 * buf.readFloatLE(base + i * 12 + 4) + 0.0722 * buf.readFloatLE(base + i * 12 + 8);
    const fl = [];
    for (let t2 = 0; t2 < iAcc.count / 3; t2++) fl.push((lum(ri(t2 * 3)) + lum(ri(t2 * 3 + 1)) + lum(ri(t2 * 3 + 2))) / 3);
    fl.sort((a, b) => a - b);
    const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
    perNode[mn].facets = { p10: +q(0.1).toFixed(4), p50: +q(0.5).toFixed(4), p90: +q(0.9).toFixed(4) };
  }
  console.log('FILE ' + file + ' bytes=' + buf.length);
  console.log('  nodes=' + (json.nodes || []).map((n) => n.name).filter(Boolean).join(','));
  console.log('  mats=' + (json.materials || []).map((m) => m.name).join(','));
  console.log('  totalTris=' + totalTris);
  console.log('  extents x=' + (max.x - min.x).toFixed(4) + ' y=' + (max.y - min.y).toFixed(4) + ' z=' + (max.z - min.z).toFixed(4));
  console.log('  COLOR0 domain [' + cmin.toFixed(4) + ',' + cmax.toFixed(4) + ']');
  for (const [mn, d] of Object.entries(perNode)) {
    console.log('  NODE ' + mn + ' tris=' + d.tris + ' maxRadius=' + d.maxR.toFixed(4) + ' facet ' + JSON.stringify(d.facets));
  }
}
for (const f of ['drone.glb', 'warden.glb', 'stinger.glb', 'flyer.glb']) probe(f);
// asset-set totals (identical to tests/assetPerf.test.js)
const CT = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const glbs = fs.readdirSync(A).filter((f) => f.endsWith('.glb')).sort();
let totalSize = 0, totalGeo = 0, totalTris = 0, maxFile = [0, ''];
for (const f of glbs) {
  const { buf, json } = parseGlb(f);
  const accBytes = (acc) => acc.count * NS[acc.type] * CT[acc.componentType];
  let geo = 0, tris = 0, mats = new Set();
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    const idx = p.indices !== undefined ? json.accessors[p.indices] : null;
    tris += Math.floor((idx ? idx.count : 0) / 3);
    for (const ai of Object.values(p.attributes)) geo += accBytes(json.accessors[ai]);
    if (idx) geo += accBytes(json.accessors[ai] || {});
    if (idx) geo += 0; // idx counted below
    mats.add(p.material);
  }
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    if (p.indices !== undefined) geo += accBytes(json.accessors[p.indices]);
  }
  totalSize += buf.length; totalGeo += geo; totalTris += tris;
  if (buf.length > maxFile[0]) maxFile = [buf.length, f];
  console.log('SET ' + f + ' size=' + buf.length + ' tris=' + tris + ' mats=' + mats.size);
}
console.log('SET TOTALS n=' + glbs.length + ' totalSize=' + totalSize + ' (' + (totalSize / 1024).toFixed(2) + ' KiB) totalGeo=' + totalGeo + ' (' + (totalGeo / 1024).toFixed(2) + ' KiB) totalTris=' + totalTris + ' maxFile=' + maxFile[1] + ' ' + maxFile[0]);