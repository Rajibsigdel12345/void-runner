const MeshoptDecoder = require('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs');
(async () => {
  await MeshoptDecoder.ready;
  // reach into exports via a decode call trace: instead, inspect via the ready-then closure is impossible;
  // but we can instantiate the same wasm ourselves? Simpler: monkey-patch console and call decodeGltfBuffer to see the error, then read the source table.
  const src = require('fs').readFileSync('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs','utf8');
  const lines = src.split('\n');
  // print lines 70-120 (decoders table + functions)
  console.log(lines.slice(69, 130).map((l,i)=>(i+70)+': '+l).join('\n'));
})().catch(e => console.error('FAIL ' + e));