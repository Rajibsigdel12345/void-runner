const fs = require('fs');
const l = fs.readFileSync('src/render/input.js','utf8').split('\n');
for (let i=70;i<100;i++) console.log('input', i+1, l[i]);