const fs = require('fs');
let t = fs.readFileSync('E:/Game/.evidence/I597/run_closegate597.cjs', 'utf8');
const subs = [
  ['// I597 (E85 ST-563 G85.0 CLOSE): close gate 5/5 re-run - identical harness set + ports to the I593 runner, I597 outputs.', '// I602 (E86 ST-567 G86.0 CLOSE): close gate 5/5 re-run - identical harness set + ports to the I593/I597 runners, I602 outputs.'],
  ['// EXPECTED: all 5 EXACT with NO re-pin (config value swaps only since I596; dist 6,851,951 B expected byte-identical).', '// EXPECTED: all 5 EXACT with NO re-pin (probe/docs only since I596; dist 6,853,589 B / 204 expected byte-identical to I600/I601).'],
  ['const OUTDIR = ".evidence/I597/";', 'const OUTDIR = ".evidence/I602/";'],
  ['"CLOSEGATE597 HARNESS PASS" : "CLOSEGATE597 HARNESS FAIL"', '"CLOSEGATE602 HARNESS PASS" : "CLOSEGATE602 HARNESS FAIL"']
];
for (const [a, b] of subs) {
  if (t.split(a).length !== 2) { console.error('ANCHOR NOT UNIQUE/MISSING: ' + a.slice(0, 60)); process.exit(1); }
  t = t.slice(0, t.indexOf(a)) + b + t.slice(t.indexOf(a) + a.length);
}
fs.writeFileSync('E:/Game/.evidence/I602/run_closegate602.cjs', t, 'utf8');
console.log('CLONED OK, bytes', Buffer.byteLength(t));