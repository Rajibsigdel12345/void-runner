const MeshoptDecoder = require('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs');
console.log('decoder type: ' + typeof MeshoptDecoder);
console.log('decoder keys: ' + Object.keys(MeshoptDecoder).join(', '));
console.log('ready type: ' + typeof MeshoptDecoder.ready);
// encoder internals
const src = require('fs').readFileSync('E:/Game/node_modules/meshoptimizer/meshopt_encoder.js','utf8');
const i = src.indexOf('encodeGltfBuffer');
console.log('\n=== encoder encodeGltfBuffer impl ===\n' + src.slice(i-100, i+700));