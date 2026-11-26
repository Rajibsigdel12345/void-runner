const fs = require('fs');
const t = fs.readFileSync('E:/Game/tests/assetPerf.test.js','utf8');
console.log('=== assetPerf.test.js (first 2200) ===\n' + t.slice(0, 2200));
const g = fs.readFileSync('E:/Game/tests/assetGlbs.test.js','utf8');
console.log('\n=== assetGlbs.test.js (first 2200) ===\n' + g.slice(0, 2200));