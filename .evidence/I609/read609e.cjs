const fs = require('fs');
const a = fs.readFileSync('E:/Game/docs/architecture/vendor-r187-adr.md','utf8');
const lines = a.split('\n');
console.log(lines.slice(64, 82).map((l,i)=>(i+65)+': '+l).join('\n'));