const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const dir = 'E:/Game/assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.glb')).sort();
let totB = 0, totT = 0; const report = [];
let oddViews = 0;
for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f));
  totB += buf.length;
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const bin = buf.subarray(20 + jsonLen + 4);
  const bv = json.bufferViews || []; const acc = json.accessors || [];
  const accById = {}; acc.forEach(a => accById[a.index !== undefined ? a.index : acc.indexOf(a)] = a);
  // map accessor index -> accessor (accessors are an array; index = position in array)
  const accArr = acc.slice();
  const bvAccessors = bv.map(v => (v.indices ? null : (v.target ? [] : null)));
  bv.forEach((v, vi) => { bvAccessors[vi] = []; });
  acc.forEach((a, ai) => { if (a.bufferView !== undefined && a.bufferView !== null) bvAccessors[a.bufferView].push(ai); });
  let tris = 0; let bad = null;
  for (const m of (json.meshes || [])) for (const p of (m.primitives || [])) {
    if (p.mode !== 4) { bad = 'primitive mode ' + p.mode; break; }
    if (p.indices !== undefined) { const ia = accArr[p.indices]; tris += ia.count / 3; }
    else { const posAcc = accArr[p.attributes.POSITION]; tris += posAcc.count / 3; }
  }
  totT += tris;
  // classify views
  const cls = bv.map((v, vi) => {
    const as = bvAccessors[vi];
    const allAttr = as.length > 0 && as.every(ai => {
      const a = accArr[ai];
      return json.meshes.some(m => m.primitives.some(p => p.attributes && Object.values(p.attributes).includes(ai)));
    });
    const idx = as.length === 1 && as.every(ai => {
      const a = accArr[ai];
      return json.meshes.some(m => m.primitives.some(p => p.indices === ai));
    });
    const sparse = as.some(ai => accArr[ai].sparse);
    if (idx) return 'idx'; if (allAttr) return 'attr'; if (as.length === 0) return 'unused';
    return 'OTHER(' + (sparse ? 'sparse' : 'mixed') + ')';
  });
  if (cls.some(c => c.startsWith('OTHER'))) oddViews++;
  report.push({ f, b: buf.length, t: tris, bad, views: cls.join(',') });
}
console.log('files: ' + files.length + ' totalB: ' + totB + ' totalTris: ' + totT + ' filesWithOtherViews: ' + oddViews);
for (const r of report) console.log(r.f.padEnd(28) + (r.b).toString().padStart(9) + '  t=' + String(r.t).padStart(7) + (r.bad ? '  BAD:' + r.bad : '') + '  ' + r.views);