const fs = require('fs');
const p = 'E:/Game/tests/assetGlbs.test.js';
let s = fs.readFileSync(p, 'utf8');
const old = "    const end = (bv.byteOffset || 0) + (ext ? ext.byteLength : bv.byteLength);";
const n = s.split(old).length - 1;
if (n !== 1) throw new Error('match count ' + n);
s = s.split(old).join("    const end = (bv.byteOffset || 0) + bv.byteLength; // I609 fix: main bufferView fields hold the LOGICAL dims; ext.byteLength is the compressed span");
fs.writeFileSync(p, s, 'utf8');
console.log('parseGlb logicalSize fix applied');
for (const f of ['tests/assetGlbs.test.js','tests/assetPerf.test.js','src/render/assetLoader.js','scripts/build.mjs','scripts/vendor.mjs']) {
  const b = fs.readFileSync('E:/Game/' + f);
  let crlf = 0, lf = 0, bom = 0;
  for (let i = 0; i < b.length; i++) { if (b[i] === 10) { if (i > 0 && b[i-1] === 13) crlf++; else lf++; } }
  const t = b.toString('utf8'); for (const ch of t) if (ch === '\uFEFF') bom++;
  console.log(f + ': CRLF=' + crlf + ' bareLF=' + lf + ' BOMchars=' + bom);
}

