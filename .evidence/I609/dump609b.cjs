const fs = require('fs');
function lines(p) { return fs.readFileSync(p, 'utf8').split(/(?<=\n)/); }
const A = 'tests/assetGlbs.test.js';
const L = lines(A);
console.log('===== assetGlbs L15-50 exact =====');
for (let i = 14; i < 50; i++) console.log(String(i+1) + ': ' + JSON.stringify(L[i]));
console.log('===== assetGlbs L655-700 (legacy-4 v2 test) =====');
for (let i = 654; i < 700; i++) console.log(String(i+1) + ': ' + JSON.stringify(L[i]));
console.log('===== scan: byteLength|buffers|CHUNK_BIN|declared|chunk =====');
L.forEach((ln, i) => { if (/byteLength|buffers\[|CHUNK_BIN|declared|chunk/i.test(ln)) console.log(String(i+1) + ': ' + JSON.stringify(ln)); });
const B = lines('scripts/build.mjs');
console.log('===== build.mjs full (' + B.length + ' lines) =====');
B.forEach((ln, i) => console.log(String(i+1) + ': ' + JSON.stringify(ln)));

