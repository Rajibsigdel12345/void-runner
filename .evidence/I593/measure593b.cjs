const fs = require('node:fs');
const path = require('node:path');
const A = 'E:/Game/assets';
const CT = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const glbs = fs.readdirSync(A).filter((f) => f.endsWith('.glb')).sort();
let totalSize = 0, totalGeo = 0, totalTris = 0, maxFile = [0, ''];
for (const f of glbs) {
  const buf = fs.readFileSync(path.join(A, f));
  const json0 = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + json0).toString('utf8'));
  const accBytes = (acc) => acc.count * NS[acc.type] * CT[acc.componentType];
  let geo = 0, tris = 0, mats = new Set();
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    const idx = p.indices !== undefined ? json.accessors[p.indices] : null;
    tris += Math.floor((idx ? idx.count : 0) / 3);
    for (const ai of Object.values(p.attributes)) geo += accBytes(json.accessors[ai]);
    if (idx) geo += accBytes(idx);
    mats.add(p.material);
  }
  totalSize += buf.length; totalGeo += geo; totalTris += tris;
  if (buf.length > maxFile[0]) maxFile = [buf.length, f];
  console.log('SET ' + f + ' size=' + buf.length + ' tris=' + tris + ' geo=' + geo + ' mats=' + mats.size);
}
console.log('SET TOTALS n=' + glbs.length + ' totalSize=' + totalSize + ' (' + (totalSize / 1024).toFixed(2) + ' KiB) totalGeo=' + totalGeo + ' (' + (totalGeo / 1024).toFixed(2) + ' KiB) totalTris=' + totalTris + ' maxFile=' + maxFile[1] + ' ' + maxFile[0]);