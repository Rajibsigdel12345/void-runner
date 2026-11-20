// I539 (ST-505, E73): fleet measurement, VERBATIM algorithm from
// tests/assetPerf.test.js (parseGlb geoBytes via CT/NS + tri count + mat count).
// Prints per-GLB rows + fleet totals (file bytes / geo bytes / tris) for the
// ST-507 re-pin table. Pure node, ASCII.
const fs = require('fs');
const path = require('path');
const ASSET_DIR = path.join(__dirname, '..', '..', 'assets');
const CT = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function parseGlb(buf) {
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  const accBytes = (acc) => acc.count * NS[acc.type] * CT[acc.componentType];
  let geoBytes = 0, tris = 0, verts = 0, uv2 = 0;
  const attrs = new Set(); const mats = new Set();
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
const maxFile = parsed.reduce((a, p) => (p.size > a.size ? p : a), parsed[0]);
const out = [];
out.push('FLEET ' + glbs.length + ' GLBs');
for (const p of parsed) out.push('  ' + p.file.padEnd(28) + ' file=' + String(p.size).padStart(8) + '  geo=' + String(p.geoBytes).padStart(8) + '  tris=' + String(p.tris).padStart(6) + '  mats=' + p.mats + '  uv2=' + p.uv2);
out.push('TOTAL file=' + totalSize + ' (' + (totalSize / 1024).toFixed(2) + ' KB)  geo=' + totalGeo + ' (' + (totalGeo / 1024).toFixed(2) + ' KB)  tris=' + totalTris);
out.push('MAX FILE ' + maxFile.file + ' ' + maxFile.size + ' B');
out.push('HEADROOM file: ' + (3072000 - totalSize) + ' B  geo: ' + (2995200 - totalGeo) + ' B  tris: ' + (66000 - totalTris) + '  perFile(ship cap 614400): ' + (614400 - maxFile.size) + ' B');
console.log(out.join('\n'));