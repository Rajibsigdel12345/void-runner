const fs = require('fs');
const t = fs.readFileSync('E:/Game/design/e70-balance-followup-research.md').toString('latin1');
const i = t.indexOf('## 4');
const j = t.indexOf('## 5');
console.log(t.slice(i, j));