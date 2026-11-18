import fs from 'fs';
const dir = 'assets';
const CT = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const glbs = fs.readdirSync(dir).filter((f) => f.endsWith('.glb'));
let totalSize = 0, totalGeo = 0, totalTris = 0;
for (const f of glbs) {
  const buf = fs.readFileSync(dir + '/' + f);
  totalSize += buf.length;
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen));
  let geo = 0, tris = 0;
  for (const mesh of json.meshes || []) for (const prim of mesh.primitives) {
    const idx = prim.indices !== undefined ? json.accessors[prim.indices] : null;
    tris += Math.floor((idx ? idx.count : 0) / 3);
    for (const [name, ai] of Object.entries(prim.attributes)) { const acc = json.accessors[ai]; geo += acc.count * NS[acc.type] * CT[acc.componentType]; }
    if (idx) geo += idx.count * CT[idx.componentType];
  }
  totalGeo += geo; totalTris += tris;
}
console.log('totalSize KB', (totalSize / 1024).toFixed(2), 'B', totalSize);
console.log('totalGeo  KB', (totalGeo / 1024).toFixed(2), 'B', totalGeo);
console.log('totalTris', totalTris);
