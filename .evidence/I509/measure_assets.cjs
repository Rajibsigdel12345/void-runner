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
let tS = 0, tG = 0, tT = 0;
for (const f of glbs) {
  const buf = fs.readFileSync(path.join(ASSET_DIR, f));
  const r = parseGlb(buf);
  tS += buf.length; tG += r.geoBytes; tT += r.tris;
  console.log(f.padEnd(22), 'B', String(buf.length).padStart(8), 'KB', (buf.length/1024).toFixed(2).padStart(8), 'tris', String(r.tris).padStart(6), 'geoKB', (r.geoBytes/1024).toFixed(2).padStart(8), 'mats', r.mats, 'C0', r.attrs.has('COLOR_0') ? 1 : 0, 'uv2', r.uv2);
}
console.log('---'.padEnd(22), 'B', String(tS).padStart(8), 'KB', (tS/1024).toFixed(2).padStart(8), 'tris', String(tT).padStart(6), 'geoKB', (tG/1024).toFixed(2).padStart(8));
// per-node tris for the 4 remaster assets
for (const f of ['enemy_hunter.glb','enemy_gunship.glb','enemy_sentry.glb','enemy_wasp.glb']) {
  const buf = fs.readFileSync(path.join(ASSET_DIR, f));
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  const names = [];
  for (const mesh of json.meshes || []) for (const prim of mesh.primitives) {
    const idx = prim.indices !== undefined ? json.accessors[prim.indices] : null;
    names.push(`${mesh.name}:${Math.floor((idx?idx.count:0)/3)}t`);
  }
  console.log('NODES', f, names.join(' | '));
}