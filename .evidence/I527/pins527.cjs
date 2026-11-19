const fs = require('fs'), crypto = require('crypto');
for (const f of ['vendor/three.module.js','vendor/three.core.js','vendor/three.webgpu.js','vendor/three.tsl.js']) {
  const h = crypto.createHash('sha256').update(fs.readFileSync('E:/Game/' + f)).digest('hex').slice(0, 16).toUpperCase();
  console.log(f, h);
}
const dist = (fs.readdirSync('E:/Game/dist', { recursive: true, withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.parentPath.replace('E:/Game/dist/', '') + '/' + d.name).map((rel) => fs.statSync('E:/Game/dist/' + rel).size).reduce((a, b) => a + b, 0));
console.log('dist total', dist, 'B; headroom', 6100000 - dist, 'B; floor check', (6100000 - dist) >= 102400 ? 'PASS' : 'FAIL');