const fs = require('fs');
let s = fs.readFileSync('.evidence/I550/bowprobe550.mjs', 'utf8');
const fixes = [
  ['        const nx = q.x / q.w, ny = q.y / q.w;',
   '        const nx = q.x, ny = q.y; // r187: applyMatrix4 already divides by w -> q IS NDC'],
  ['horizonY: +(q.y / q.w).toFixed(3) };',
   'horizonY: +q.y.toFixed(3) }; // r187: q is NDC']
];
for (const [a, b] of fixes) {
  if (!s.includes(a)) { console.error('NOT FOUND: ' + a); process.exit(1); }
  s = s.replace(a, b);
}
fs.writeFileSync('.evidence/I550/bowprobe550.mjs', s);
console.log('patched ok');
