const fs = require('fs');
const d = fs.readFileSync('E:/Game/node_modules/meshoptimizer/meshopt_encoder.d.ts','utf8');
console.log('=== encoder d.ts (tail) ===\n' + d.slice(-2200));
// node decoder cjs API
const c = fs.readFileSync('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs','utf8');
const i = c.indexOf('module.exports');
console.log('\n=== decoder cjs exports region ===\n' + c.slice(i-400, i+400));