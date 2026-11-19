const fs = require('fs');
const t = fs.readFileSync('E:/Game/AGENTS.md').toString('latin1');
const i = t.indexOf('## Quality bar');
console.log(t.slice(i, i + 2600));
console.log('---SIZE', t.length);