const fs = require('fs'); const path = require('path');
const dir = 'E:/Game/assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.glb')).sort();
let totB = 0, totT = 0;
for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f));
  totB += buf.length;
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const acc = json.accessors || [];
  for (const m of (json.meshes || [])) for (const p of (m.primitives || [])) {
    const mode = p.mode === undefined ? 4 : p.mode;
    if (mode !== 4) throw new Error(f + ' primitive mode ' + mode);
    if (p.indices !== undefined) totT += acc[p.indices].count / 3;
    else totT += acc[p.attributes.POSITION].count / 3;
  }
}
console.log('files: ' + files.length + ' totalB: ' + totB + ' totalTris: ' + totT);