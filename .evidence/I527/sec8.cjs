const fs = require('fs');
const t = fs.readFileSync('E:/Game/design/e70-balance-followup-research.md').toString('latin1');
const i = t.indexOf('## 8.');
const j = t.indexOf('## 12.');
console.log(t.slice(i, j));