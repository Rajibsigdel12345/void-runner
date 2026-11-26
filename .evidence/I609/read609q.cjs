const fs = require('fs');
const s = fs.readFileSync('E:/Game/production/scope-check-E88.md','utf8');
console.log('len: ' + s.length);
console.log(s.slice(0, 4600));