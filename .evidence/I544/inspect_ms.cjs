const fs = require('fs');
const s = fs.readFileSync('src/render/screens.js', 'latin1');
console.log('--- 27840 ctx:', JSON.stringify(s.slice(27700, 27990)));
console.log('--- 33577 ctx:', JSON.stringify(s.slice(33400, 33720)));