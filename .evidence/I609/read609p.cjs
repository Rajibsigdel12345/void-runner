const fs = require('fs');
const d = fs.readFileSync('E:/Game/vendor/jsm/libs/meshopt_decoder.module.js','utf8');
const i = d.indexOf('decodeGltfBufferAsync');
console.log('=== browser decoder async fn ===\n' + d.slice(i-200, i+500));
// scope check: expectation + flagged
const s = fs.readFileSync('E:/Game/production/scope-check-E88.md','utf8');
const k = s.indexOf('expected close dist');
console.log('\n=== scope context ===\n' + s.slice(Math.max(0,k-700), k+300));