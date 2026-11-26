const c = require('fs').readFileSync('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs','utf8');
console.log(c.split('\n').slice(0, 70).map((l,i)=>(i+1)+': '+l).join('\n'));