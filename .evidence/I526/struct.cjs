const fs = require('fs');
const t = fs.readFileSync('E:/Game/design/e70-balance-followup-research.md').toString('latin1');
// section headers
const headers = t.match(/^#{1,3} .*/gm) || [];
console.log(headers.join('\n'));
console.log('---R-wave20 mentions:');
let i = 0;
while ((i = t.indexOf('wave20', i + 1)) > 0) { console.log(t.slice(Math.max(0, i - 200), i + 150).replace(/\n/g, ' | ')); console.log('==='); }
console.log('---tail 300:');
console.log(t.slice(-300));