// I539 (ST-505, E73): deterministic GLB chunk-walker for assets/ship.glb (v6).
// Regenerates the per-node table (tris, per-axis extents, material, COLOR_0),
// the overall span/height/length/min-y, and per-COLOR_0-prim facet p10/p50/p90.
// Measurement code mirrors tests/assetGlbs.test.js (parseGlb/meshStats/facet)
// and tests/assetPerf.test.js (geoBytes via CT/NS) verbatim. Pure node, ASCII.
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'assets', 'ship.glb');
const buf = fs.readFileSync(FILE);
const GLB_MAGIC = 0x46546c67, CHUNK_JSON = 0x4e4f534a, CHUNK_BIN = 0x004e4942;
if (buf.readUInt32LE(0) !== GLB_MAGIC) throw new Error('bad magic');
let off = 12, json = null, binOff = -1, binLen = 0;
while (off < buf.length) {
  const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
  if (type === CHUNK_JSON) json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString('utf8'));
  else if (type === CHUNK_BIN) { binOff = off + 8; binLen = len; }
  off += 8 + len;
}
const posBase = (acc) => { const bv = json.bufferViews[acc.bufferView]; return binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0); };
const f3 = (v) => v.toFixed(3);
const out = [];
out.push('PROBE ship.glb (v6)  file=' + buf.length + ' B  bin=' + binLen + ' B  meshes=' + json.meshes.length + ' nodes=' + json.nodes.length + ' materials=[' + json.materials.map((m) => m.name).join(', ') + ']');
let totalTris = 0;
const g = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
for (const n of json.nodes) {
  if (n.mesh === undefined || !n.name) continue;
  const m = json.meshes[n.mesh];
  let tris = 0; const mats = new Set(); let hasColor = false;
  const e = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (const p of m.primitives) {
    const posAcc = json.accessors[p.attributes.POSITION];
    const idxAcc = p.indices !== undefined ? json.accessors[p.indices] : null;
    tris += Math.round((idxAcc ? idxAcc.count : posAcc.count) / 3);
    if (p.material !== undefined && json.materials[p.material]) mats.add(json.materials[p.material].name);
    if (p.attributes.COLOR_0 !== undefined) hasColor = true;
    const base = posBase(posAcc);
    for (let i = 0; i < posAcc.count; i++) {
      const x = buf.readFloatLE(base + i * 12), y = buf.readFloatLE(base + i * 12 + 4), z = buf.readFloatLE(base + i * 12 + 8);
      if (x < e.minX) e.minX = x; if (x > e.maxX) e.maxX = x;
      if (y < e.minY) e.minY = y; if (y > e.maxY) e.maxY = y;
      if (z < e.minZ) e.minZ = z; if (z > e.maxZ) e.maxZ = z;
    }
  }
  totalTris += tris;
  g.minX = Math.min(g.minX, e.minX); g.maxX = Math.max(g.maxX, e.maxX);
  g.minY = Math.min(g.minY, e.minY); g.maxY = Math.max(g.maxY, e.maxY);
  g.minZ = Math.min(g.minZ, e.minZ); g.maxZ = Math.max(g.maxZ, e.maxZ);
  out.push('NODE ' + n.name + '  mesh=' + m.name + '  tris=' + tris +
    '  x=[' + f3(e.minX) + ', ' + f3(e.maxX) + ']  y=[' + f3(e.minY) + ', ' + f3(e.maxY) + ']  z=[' + f3(e.minZ) + ', ' + f3(e.maxZ) + ']' +
    '  mat=' + [...mats].join('+') + '  color0=' + (hasColor ? 'yes' : 'no'));
}
out.push('TOTAL tris=' + totalTris);
out.push('OVERALL span_x=' + f3(g.maxX - g.minX) + '  height_y=' + f3(g.maxY - g.minY) + '  length_z=' + f3(g.maxZ - g.minZ) +
  '  min-y=' + f3(g.minY) + '  max-y=' + f3(g.maxY) + '  bow_z=' + f3(g.maxZ) + '  tail_z=' + f3(g.minZ));
out.push('FACET (per-triangle mean luma of COLOR_0; q(f)=v[floor(f*len)]):');
for (const m of json.meshes) for (const p of m.primitives) {
  if (p.attributes.COLOR_0 === undefined) continue;
  const acc = json.accessors[p.attributes.COLOR_0];
  const base = posBase(acc);
  const iAcc = json.accessors[p.indices];
  const ibv = json.bufferViews[iAcc.bufferView];
  const ibase = binOff + (ibv.byteOffset || 0) + (iAcc.byteOffset || 0);
  const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(ibase + i * 2) : iAcc.componentType === 5125 ? buf.readUInt32LE(ibase + i * 4) : buf.readUInt8(ibase + i));
  const lum = (i) => 0.2126 * buf.readFloatLE(base + i * 12) + 0.7152 * buf.readFloatLE(base + i * 12 + 4) + 0.0722 * buf.readFloatLE(base + i * 12 + 8);
  const fl = [];
  for (let t = 0; t < iAcc.count / 3; t++) fl.push((lum(readIdx(t * 3)) + lum(readIdx(t * 3 + 1)) + lum(readIdx(t * 3 + 2))) / 3);
  fl.sort((a, b) => a - b);
  const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
  out.push('  ' + m.name + '  p10=' + q(0.1).toFixed(4) + '  p50=' + q(0.5).toFixed(4) + '  p90=' + q(0.9).toFixed(4) + '  (spread ' + (q(0.9) - q(0.1)).toFixed(4) + ')');
}
console.log(out.join('\n'));