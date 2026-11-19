const fs = require('fs');
const t = fs.readFileSync('E:/Game/design/e70-balance-followup-research.md').toString('latin1');
const i = t.indexOf('## 0.');
const j = t.indexOf('## 1.');
console.log(t.slice(i, j));