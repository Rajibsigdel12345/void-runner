// probe536b.mjs - VERBATIM clone of tests/assetPerf.test.js parseGlb/accBytes/sums (I536 ST-502 gunship v2 landing fleet re-measure)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets');
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
console.log('FILES', glbs.length, 'totalFilesKB', (totalSize / 1024).toFixed(2), 'totalFilesB', totalSize);
console.log('totalGeoKB', (totalGeo / 1024).toFixed(2), 'totalGeoB', totalGeo);
console.log('totalTris', totalTris);
for (const p of parsed) if (p.file.includes('gunship') || p.file === 'ship.glb' || p.file === 'enemy_wasp.glb' || p.file === 'enemy_hauler.glb') console.log('FILE', p.file, (p.size / 1024).toFixed(2), 'KB', p.size, 'B tris', p.tris, 'geoB', p.geoBytes, 'mats', p.mats);
console.log('MAXFILE', parsed.reduce((a, p) => (p.size > a.size ? p : a)).file, parsed.reduce((a, p) => (p.size > a.size ? p : a)).size, 'B');


