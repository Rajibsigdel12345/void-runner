const fs=require('fs');
const s=fs.readFileSync('E:/Game/node_modules/meshoptimizer/meshopt_encoder.js','utf8');
console.log('head:',s.slice(0,600).replace(/\n/g,' | '));
const i=s.indexOf('encodeGltfBuffer');
console.log('\n--- encodeGltfBuffer impl ---\n', s.slice(i-200, i+2500));