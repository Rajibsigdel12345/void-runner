const fs = require('fs');
const buf = fs.readFileSync('E:/Game/assets/arena_ring.glb');
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
console.log(JSON.stringify(json.bufferViews, null, 1));
console.log(JSON.stringify(json.accessors, null, 1));
console.log(JSON.stringify((json.meshes||[]).map(m => (m.primitives||[]).map(p => ({ attrs: p.attributes, idx: p.indices, mode: p.mode }))), null, 1));