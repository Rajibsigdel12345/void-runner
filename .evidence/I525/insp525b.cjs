const fs = require('fs');
const t = fs.readFileSync('E:/Game/production/epics.md').toString('latin1');
const i = t.lastIndexOf('E70');
console.log('E70 block from last occurrence:');
console.log(t.slice(Math.max(0, i - 300)));