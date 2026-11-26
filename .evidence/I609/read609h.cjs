const m = require('E:/Game/node_modules/meshoptimizer/meshopt_encoder.js');
console.log('type: ' + typeof m);
console.log('keys: ' + Object.keys(m).join(', '));
console.log('has MeshoptEncoder prop: ' + (typeof m.MeshoptEncoder));
if (m.default) console.log('default keys: ' + Object.keys(m.default).join(', '));