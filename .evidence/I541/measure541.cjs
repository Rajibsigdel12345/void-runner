// I541 (ST-507, E73): ship v7 swap re-pin table. Verbatim fleet algorithm from
// tests/assetPerf.test.js (CT/NS geoBytes + floor tri count) + ship facet algorithm
// from tests/assetGlbs.test.js (per-triangle rec.709 luma, p10/p50/p90). Pure node, ASCII.
const fs = require('fs');
const path = require('path');
const ASSET_DIR = path.join(__dirname, '..', '..', 'assets');
const CT = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function parseGlbFleet(buf) {
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  const accBytes = (acc) => acc.count * NS[acc.type] * CT[acc.componentType];
  let geoBytes = 0, tris = 0;
  const mats = new Set();
  for (const mesh of json.meshes || []) {
    for (const prim of mesh.primitives) {
      const idx = prim.indices !== undefined ? json.accessors[prim.indices] : null;
      tris += Math.floor((idx ? idx.count : 0) / 3);
      for (const [name, ai] of Object.entries(prim.attributes)) geoBytes += accBytes(json.accessors[ai]);
      if (idx) geoBytes += accBytes(idx);
      mats.add(prim.material);
    }
  }
  return { json, geoBytes, tris };
}
const GLB_MAGIC = 0x46546c67, CHUNK_JSON = 0x4e4f534a, CHUNK_BIN = 0x004e4942;
function parseGlbFull(file) {
  const buf = fs.readFileSync(path.join(ASSET_DIR, file));
  let off = 12; let json = null; let binOff = -1;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off); const type = buf.readUInt32LE(off + 4);
    if (type === CHUNK_JSON) json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString('utf8'));
    else if (type === CHUNK_BIN) binOff = off + 8;
    off += 8 + len;
  }
  return { buf, json, binOff };
}
const glbs = fs.readdirSync(ASSET_DIR).filter((f) => f.endsWith('.glb')).sort();
let totalSize = 0, totalGeo = 0, totalTris = 0, maxFile = { size: 0, file: '' };
for (const f of glbs) {
  const buf = fs.readFileSync(path.join(ASSET_DIR, f));
  const r = parseGlbFleet(buf);
  totalSize += buf.length; totalGeo += r.geoBytes; totalTris += r.tris;
  if (buf.length > maxFile.size) maxFile = { size: buf.length, file: f };
}
const o = [];
o.push('FLEET ' + glbs.length + ' GLBs');
o.push('TOTAL file=' + totalSize + ' (' + (totalSize/1024).toFixed(2) + ' KB)  geo=' + totalGeo + ' (' + (totalGeo/1024).toFixed(2) + ' KB)  tris=' + totalTris);
o.push('MAX FILE ' + maxFile.file + ' ' + maxFile.size + ' B (' + (maxFile.size/1024).toFixed(2) + ' KB)');
const { buf, json, binOff } = parseGlbFull('ship.glb');
let shipTrisRound = 0, shipTrisFloor = 0, colorPrims = 0; const shipFacet = {};
const nodeNames = (json.nodes || []).map((n) => n.name).filter(Boolean);
const matNames = (json.materials || []).map((m) => m.name);
for (const m of json.meshes || []) for (const p of m.primitives || []) {
  const posAcc = json.accessors[p.attributes.POSITION];
  const idxAcc = p.indices !== undefined ? json.accessors[p.indices] : null;
  const cnt = idxAcc ? idxAcc.count : posAcc.count;
  shipTrisRound += Math.round(cnt / 3); shipTrisFloor += Math.floor(cnt / 3);
  if (p.attributes.COLOR_0 === undefined) continue;
  colorPrims++;
  const acc = json.accessors[p.attributes.COLOR_0];
  const bv = json.bufferViews[acc.bufferView];
  const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const iAcc = json.accessors[p.indices];
  const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
  const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i*2) : iAcc.componentType === 5125 ? buf.readUInt32LE(iBase + i*4) : buf.readUInt8(iBase + i));
  const lum = (i) => 0.2126*buf.readFloatLE(base + i*12) + 0.7152*buf.readFloatLE(base + i*12 + 4) + 0.0722*buf.readFloatLE(base + i*12 + 8);
  const fl = [];
  for (let t = 0; t < iAcc.count/3; t++) fl.push((lum(readIdx(t*3)) + lum(readIdx(t*3+1)) + lum(readIdx(t*3+2)))/3);
  fl.sort((a,b)=>a-b);
  const q = (f) => fl[Math.min(fl.length-1, Math.floor(f*fl.length))];
  shipFacet[m.name] = { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
}
const f4 = (x) => x.toFixed(4);
o.push('SHIP nodes=[' + nodeNames.join(', ') + ']');
o.push('SHIP mats=[' + matNames.join(', ') + ']');
o.push('SHIP tris round(meshStats)=' + shipTrisRound + '  floor(fleet)=' + shipTrisFloor + '  colorPrims=' + colorPrims);
const hullF = shipFacet['VR_Ship_Hull.001'] || shipFacet['VR_Ship_Hull'];
const wingF = shipFacet['VR_Ship_Wings.001'] || shipFacet['VR_Ship_Wings'];
if (hullF) o.push('SHIP_FACET hull  p10=' + f4(hullF.p10) + ' p50=' + f4(hullF.p50) + ' p90=' + f4(hullF.p90) + ' spread=' + (hullF.p90-hullF.p10).toFixed(4));
else o.push('SHIP_FACET hull MISSING keys=[' + Object.keys(shipFacet).join(',') + ']');
if (wingF) o.push('SHIP_FACET wings p10=' + f4(wingF.p10) + ' p50=' + f4(wingF.p50) + ' p90=' + f4(wingF.p90) + ' spread=' + (wingF.p90-wingF.p10).toFixed(4));
else o.push('SHIP_FACET wings MISSING keys=[' + Object.keys(shipFacet).join(',') + ']');
o.push('EXPECT playframe A:L tris = 218 + shipFloor(' + shipTrisFloor + ') = ' + (218 + shipTrisFloor));
console.log(o.join('\n'));
