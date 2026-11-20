const fs = require('fs');
const s = fs.readFileSync('production/timeline.md', 'utf8');
const i = s.lastIndexOf('I549');
console.log(JSON.stringify(s.slice(i - 200, i + 300)));
const a = fs.readFileSync('production/session-state/active.md', 'utf8');
console.log('\nACTIVE head:'); console.log(a.slice(0, 700));
