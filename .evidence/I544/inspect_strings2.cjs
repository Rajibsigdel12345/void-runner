const fs = require('fs');
const s = fs.readFileSync('src/core/strings.js', 'latin1');
const lines = s.split('\n');
for (let i = 20; i < 42; i++) console.log((i + 1) + ': ' + JSON.stringify(lines[i]));