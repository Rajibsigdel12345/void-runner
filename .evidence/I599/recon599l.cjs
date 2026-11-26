const fs = require('fs');
const inp = fs.readFileSync('src/render/input.js','utf8').split('\n');
for (let i=100;i<160;i++) console.log('input', i+1, inp[i]);