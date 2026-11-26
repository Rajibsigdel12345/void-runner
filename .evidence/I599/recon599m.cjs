const fs = require('fs');
const m = fs.readFileSync('src/main.js','utf8').split('\n');
const i = m.findIndex(t => t.includes('function resolveAimPoint'));
console.log('resolveAimPoint at L' + (i+1));
for (let j=i-2;j<i+45;j++) console.log(j+1, m[j]);