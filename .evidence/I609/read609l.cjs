const fs = require('fs');
const src = fs.readFileSync('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs','utf8');
const lines = src.split('\n');
console.log(lines.slice(129, 210).map((l,i)=>(i+130)+': '+l).join('\n'));