import fs from 'node:fs';
import path from 'node:path';
const A = 'E:/Game/assets';
const CT = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function parseGlb(file) {
  const buf = fs.readFileSync(path.join(A, file));
  let off = 12, json = null, binOff = -1;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    if (type === 0x4e4f534a) json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString('utf8'));
    else if (type === 0x004e4942) binOff = off + 8;
    off += 8 + len;
  }
  return { buf, json, binOff };
}
function facetLumaPrims({ buf, json, binOff }) {
  const out = {};
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    const mn = m.name || '?';
    if (p.attributes.COLOR_0 === undefined) { out[mn] = { color0: false }; continue; }
    const cAcc = json.accessors[p.attributes.COLOR_0];
    const iAcc = json.accessors[p.indices];
    const cBase = binOff + (json.bufferViews[cAcc.bufferView].byteOffset || 0) + (cAcc.byteOffset || 0);
    const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
    const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i * 2) : iAcc.componentType === 5125 ? buf.readUInt32LE(iBase + i * 4) : buf.readUInt8(iBase + i));
    const fl = [], vals = [];
    let vMin = Infinity, vMax = -Infinity;
    let gr = 0, n = cAcc.count;
    for (let i = 0; i < n; i++) {
      const r = buf.readFloatLE(cBase + i * 12), g = buf.readFloatLE(cBase + i * 12 + 4), b = buf.readFloatLE(cBase + i * 12 + 8);
      if (Math.abs(r - g) > 0.02 || Math.abs(g - b) > 0.02) gr++;
      if (r < vMin) vMin = r; if (r > vMax) vMax = r;
    }
    for (let t = 0; t < iAcc.count / 3; t++) {
      const lum = (i) => { const o = cBase + i * 12; return 0.2126 * buf.readFloatLE(o) + 0.7152 * buf.readFloatLE(o + 4) + 0.0722 * buf.readFloatLE(o + 8); };
      fl.push((lum(readIdx(t * 3)) + lum(readIdx(t * 3 + 1)) + lum(readIdx(t * 3 + 2))) / 3);
    }
    fl.sort((a, b) => a - b);
    const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
    out[mn] = { color0: true, p10: q(0.1), p50: q(0.5), p90: q(0.9), vMin, vMax, grayBad: gr };
  }
  return out;
}
const files = ['drone.glb', 'stinger.glb', 'warden.glb', 'flyer.glb'];
for (const f of files) {
  const { buf, json, binOff } = parseGlb(f);
  const nodeNames = (json.nodes || []).map((n) => n.name).filter(Boolean);
  const matNames = (json.materials || []).map((m) => m.name);
  let totalTris = 0; const perPrim = {};
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    const pos = json.accessors[p.attributes.POSITION];
    const idx = p.indices !== undefined ? json.accessors[p.indices] : null;
    const tris = Math.round((idx ? idx.count : pos.count) / 3);
    totalTris += tris;
    const bv = json.bufferViews[pos.bufferView];
    let maxR = 0;
    for (let i = 0; i < pos.count; i++) {
      const o = binOff + (bv.byteOffset || 0) + (pos.byteOffset || 0) + i * 12;
      const x = buf.readFloatLE(o), y = buf.readFloatLE(o + 4), z = buf.readFloatLE(o + 8);
      if (x < min[0]) min[0] = x; if (x > max[0]) max[0] = x;
      if (y < min[1]) min[1] = y; if (y > max[1]) max[1] = y;
      if (z < min[2]) min[2] = z; if (z > max[2]) max[2] = z;
      const r = x * x + y * y + z * z; if (r > maxR) maxR = r;
    }
    perPrim[m.name] = { tris, maxRadius: Math.sqrt(maxR) };
  }
  const ext = { x: max[0] - min[0], y: max[1] - min[1], z: max[2] - min[2] };
  const facets = facetLumaPrims({ buf, json, binOff });
  console.log('=== ' + f + ' ' + buf.length + ' B');
  console.log('nodes: ' + JSON.stringify(nodeNames));
  console.log('mats: ' + JSON.stringify(matNames));
  console.log('totalTris: ' + totalTris);
  for (const [mn, v] of Object.entries(perPrim)) console.log('  prim ' + mn + ': tris=' + v.tris + ' maxRadius=' + v.maxRadius.toFixed(4));
  console.log('extents: x=' + ext.x.toFixed(4) + ' y=' + ext.y.toFixed(4) + ' z=' + ext.z.toFixed(4));
  for (const [mn, v] of Object.entries(facets)) console.log('  facet ' + mn + ': ' + JSON.stringify({ p10: +v.p10.toFixed(4), p50: +v.p50.toFixed(4), p90: +v.p90.toFixed(4), vMin: +v.vMin.toFixed(4), vMax: +v.vMax.toFixed(4), grayBad: v.grayBad }));
}
// assetPerf totals over ALL 28 glbs
let totalSize = 0, totalGeo = 0, totalTris = 0;
const glbs = fs.readdirSync(A).filter((f) => f.endsWith('.glb')).sort();
for (const f of glbs) {
  const { buf, json } = (() => { const r = parseGlb(f); return { buf: r.buf, json: r.json }; })();
  totalSize += buf.length;
  let geo = 0, tris = 0;
  const accBytes = (acc) => acc.count * NS[acc.type] * CT[acc.componentType];
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    const idx = p.indices !== undefined ? json.accessors[p.indices] : null;
    tris += Math.floor((idx ? idx.count : 0) / 3);
    for (const [, ai] of Object.entries(p.attributes)) geo += accBytes(json.accessors[ai]);
    if (idx) geo += accBytes(idx);
  }
  totalGeo += geo; totalTris += tris;
}
console.log('=== TOTALS (' + glbs.length + ' glbs)');
console.log('totalSize: ' + totalSize + ' B = ' + (totalSize / 1024).toFixed(2) + ' KB');
console.log('totalGeo: ' + totalGeo + ' B = ' + (totalGeo / 1024).toFixed(2) + ' KB');
console.log('totalTris: ' + totalTris);