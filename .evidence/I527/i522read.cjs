const fs = require('fs');
const t = fs.readFileSync('E:/Game/production/iterations.md').toString('latin1');
const i = t.indexOf('## I522');
const j = t.indexOf('## I523');
console.log(t.slice(i, j).slice(0, 6000));