const fs = require('fs');
const p = 'E:/Game/.evidence/I529/edit529.cjs';
let s = fs.readFileSync(p, 'latin1');
const bad = '  "  "only fade (reduced-motion safe), 0 per-frame JS, 0 new 3D draw calls. Each tick toggles",';
const good = '  "  // only fade (reduced-motion safe), 0 per-frame JS, 0 new 3D draw calls. Each tick toggles",';
if (s.split(bad).length - 1 !== 1) throw new Error('bad line not found exactly once');
s = s.replace(bad, good);
fs.writeFileSync(p, s, 'latin1');
console.log('FIXED');