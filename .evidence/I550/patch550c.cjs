const fs = require('fs');
const lines = fs.readFileSync('.evidence/I550/bowprobe550.mjs', 'utf8').split('\n');
// line 106 (idx 105)
if (!lines[105].includes('const nx = q.x / q.w, ny = q.y / q.w;')) { console.error('L106 mismatch: ' + lines[105]); process.exit(1); }
lines[105] = '        const nx = q.x, ny = q.y; // r187: applyMatrix4 already divides by w -> q IS NDC';
// line 116 (idx 115)
if (!lines[115].includes('horizonY: +(q.y / q.w).toFixed(3)')) { console.error('L116 mismatch: ' + lines[115]); process.exit(1); }
lines[115] = lines[115].replace('horizonY: +(q.y / q.w).toFixed(3)', 'horizonY: +q.y.toFixed(3) // r187: q is NDC');
// line 98 (idx 97) dbg: return NDC coords
if (!lines[97].includes('return [qq.x, qq.y, qq.w];')) { console.error('L98 mismatch: ' + lines[97].slice(-120)); process.exit(1); }
lines[97] = lines[97].replace('return [qq.x, qq.y, qq.w];', 'return [qq.x, qq.y, vv.z];');
fs.writeFileSync('.evidence/I550/bowprobe550.mjs', lines.join('\n'));
console.log('patched ok');
