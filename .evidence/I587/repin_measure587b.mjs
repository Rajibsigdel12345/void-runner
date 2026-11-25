// I587 re-pin measurement: ship v8 facet percentiles + full asset-set totals (test-identical logic)
import fs from 'node:fs';
import path from 'node:path';
const ASSET_DIR = 'E:/Game/assets';
function parseGlb(file) {
  const buf = fs.readFileSync(path.join(ASSET_DIR, file));
  const json0 = buf.readUInt32LE(12);
  const pad = json0 % 4 ? 4 - json0 % 4 : 0;
  const json = JSON.parse(buf.slice(20, 20 + json0).toString('utf8'));
  const binOff = 20 + json0 + pad + 8;
  return { buf, json, binOff };
}
function shipProbe() {
  const { buf, json, binOff } = parseGlb('ship.glb');
  let totalTris = 0, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    const idx = p.indices !== undefined ? json.accessors[p.indices] : null;
    totalTris += Math.round((idx ? idx.count : json.accessors[p.attributes.POSITION].count) / 3);
    const posAcc = json.accessors[p.attributes.POSITION];
    const bv = json.bufferViews[posAcc.bufferView];
    for (let i = 0; i < posAcc.count; i++) {
      const o = binOff + (bv.byteOffset || 0) + (posAcc.byteOffset || 0) + i * 12;
      const x = buf.readFloatLE(o), z = buf.readFloatLE(o + 8);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    if (p.attributes.COLOR_0 === undefined) continue;
    const acc = json.accessors[p.attributes.COLOR_0];
    const cbv = json.bufferViews[acc.bufferView];
    const base = binOff + (cbv.byteOffset || 0) + (acc.byteOffset || 0);
    const iAcc = json.accessors[p.indices];
    const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
    const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i * 2) : buf.readUInt32LE(iBase + i * 4));
    const lum = (i) => 0.2126 * buf.readFloatLE(base + i * 12) + 0.7152 * buf.readFloatLE(base + i * 12 + 4) + 0.0722 * buf.readFloatLE(base + i * 12 + 8);
    const fl = [];
    for (let t = 0; t < iAcc.count / 3; t++) fl.push((lum(readIdx(t * 3)) + lum(readIdx(t * 3 + 1)) + lum(readIdx(t * 3 + 2))) / 3);
    fl.sort((a, b) => a - b);
    const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
    console.log('FACET ' + m.name + ' p10=' + q(0.1).toFixed(4) + ' p50=' + q(0.5).toFixed(4) + ' p90=' + q(0.9).toFixed(4) + ' spread=' + (q(0.9) - q(0.1)).toFixed(4) + ' ntris=' + fl.length);
  }
  console.log('SHIP totalTris=' + totalTris + ' span=' + (maxX - minX).toFixed(4) + ' len=' + (maxZ - minZ).toFixed(4) + ' bytes=' + buf.length);
  console.log('NODES ' + (json.nodes || []).map((n) => n.name).filter(Boolean).join(','));
  console.log('MATS ' + (json.materials || []).map((m) => m.name).join(','));
}
const CT = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function assetProbe() {
  const glbs = fs.readdirSync(ASSET_DIR).filter((f) => f.endsWith('.glb')).sort();
  let totalSize = 0, totalGeo = 0, totalTris = 0, maxFile = [0, ''];
  for (const f of glbs) {
    const buf = fs.readFileSync(path.join(ASSET_DIR, f));
    const json0 = buf.readUInt32LE(12);
    const json = JSON.parse(buf.slice(20, 20 + json0).toString('utf8'));
    const accBytes = (acc) => acc.count * NS[acc.type] * CT[acc.componentType];
    let geo = 0, tris = 0;
    for (const m of json.meshes || []) for (const p of m.primitives || []) {
      const idx = p.indices !== undefined ? json.accessors[p.indices] : null;
      tris += Math.floor((idx ? idx.count : 0) / 3);
      for (const ai of Object.values(p.attributes)) geo += accBytes(json.accessors[ai]);
      if (idx) geo += accBytes(idx);
    }
    totalSize += buf.length; totalGeo += geo; totalTris += tris;
    if (buf.length > maxFile[0]) maxFile = [buf.length, f];
  }
  console.log('ASSETS n=' + glbs.length + ' totalSize=' + totalSize + ' (' + (totalSize / 1024).toFixed(2) + ' KiB) totalGeo=' + totalGeo + ' (' + (totalGeo / 1024).toFixed(2) + ' KiB) totalTris=' + totalTris + ' maxFile=' + maxFile[1] + ' ' + maxFile[0] + ' (' + (maxFile[0] / 1024).toFixed(2) + ' KiB)');
}
shipProbe();
assetProbe();