const fs = require('fs');
let total = 0, files = 0;
(function walk(d) { for (const e of fs.readdirSync(d, {withFileTypes:true})) { const p = d + '/' + e.name; if (e.isDirectory()) walk(p); else { files++; total += fs.statSync(p).size; } } })('E:/Game/dist');
const a = fs.readdirSync('E:/Game/assets').filter(f => f.endsWith('.glb'));
let at = 0; for (const f of a) at += fs.statSync('E:/Game/assets/' + f).size;
console.log('dist:', files, 'files,', total, 'B (expect 7,093,058 byte-identical / tripwire 7,297,600 / ceiling 7,400,000)');
console.log('assets:', a.length, 'glb, total', at, 'B (current cap 4,563 KiB; E84 renegotiation 4,800,512 B / 124,158 t at ST-560)');
const crypto = require('crypto');
const PIN = { 'three.module.js': 'A65DE049A7F38B40', 'three.core.js': '7AB0784CD2532367', 'three.webgpu.js': 'F549248412C62B9A', 'three.tsl.js': '7FF9ACF50F006017' };
let vok = 0;
for (const [f, pin] of Object.entries(PIN)) {
  const h = crypto.createHash('sha256').update(fs.readFileSync('E:/Game/dist/vendor/' + f)).digest('hex').slice(0, 16).toUpperCase();
  console.log(f, h, h === pin ? 'EXACT' : 'MISMATCH (pin ' + pin + ')');
  if (h === pin) vok++;
}
console.log('vendor pins:', vok, '/4');
if (total !== 7093058 || files !== 203 || vok !== 4) { console.log('MEASURE592 FAIL'); process.exit(1); }
console.log('MEASURE592 PASS');