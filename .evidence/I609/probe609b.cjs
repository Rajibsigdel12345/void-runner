const fs = require('fs');
const src = fs.readFileSync('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs','utf8');
const m = src.match(/var wasm_simd =\s*\n\s*'([^']+)'/);
const wasmpack = new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);
function unpack(data) {
  const result = new Uint8Array(data.length);
  for (let i=0;i<data.length;++i) { const ch = data.charCodeAt(i); result[i] = ch>96?ch-97:ch>64?ch-39:ch+4; }
  let write=0;
  for (let i=0;i<data.length;++i) { result[write++] = result[i]<60 ? wasmpack[result[i]] : (result[i]-60)*64 + result[++i]; }
  return result.buffer.slice(0, write);
}
const wasm = unpack(m[1]);
WebAssembly.instantiate(wasm, {}).then(r => {
  const ex = Object.keys(r.instance.exports);
  console.log('exports: ' + ex.join(', '));
}).catch(e => console.error('inst fail: ' + e));