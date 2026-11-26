const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
let total = 0, n = 0;
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { total += fs.statSync(p).size; n++; } } })('E:/Game/dist');
console.log('DIST ' + total + ' B / ' + n + ' files');
for (const f of ['three.module.js', 'three.core.js', 'three.webgpu.js', 'three.tsl.js']) {
  const h = crypto.createHash('sha256').update(fs.readFileSync('E:/Game/dist/vendor/' + f)).digest('hex').slice(0, 16).toUpperCase();
  console.log('VENDOR ' + f + ' ' + h);
}