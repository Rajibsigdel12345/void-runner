const fs = require('fs');
const l = fs.readFileSync('tests/cameraModel.test.js','utf8').split('\n');
console.log('total lines:', l.length);
for (let i=285;i<340;i++) console.log('t', i+1, l[i]);
console.log('--- head ---');
for (let i=0;i<12;i++) console.log('t', i+1, l[i]);