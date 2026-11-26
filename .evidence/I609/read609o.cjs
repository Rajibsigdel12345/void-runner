const fs = require('fs');
const s = fs.readFileSync('E:/Game/production/scope-check-E88.md','utf8');
const i = s.indexOf('C1');
console.log(s.slice(Math.max(0, s.indexOf('Cut ladder') - 100), s.indexOf('Cut ladder') + 1400).replace(/Cut ladder/g, 'CUTLADDERMARKER'));
const j = s.indexOf('CUTLADDERMARKER');
console.log('\n=== section ===\n' + s.slice(j, j + 1500));