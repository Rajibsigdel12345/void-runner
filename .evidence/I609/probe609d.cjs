const fs = require('fs');
const { MeshoptEncoder } = require('E:/Game/node_modules/meshoptimizer/meshopt_encoder.js');
const MeshoptDecoder = require('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs');
(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  const buf = fs.readFileSync('E:/Game/assets/arena_ring.glb');
  const jsonLen = buf.readUInt32LE(12);
  const off = 20 + jsonLen + 4 + 8;
  const src = new Uint8Array(buf.subarray(off + 1728, off + 1728 + 288)); // view 3 u16 indices 144
  const e = MeshoptEncoder.encodeGltfBuffer(src, 144, 2, 'TRIANGLES');
  console.log('enc len: ' + e.length);
  const dec = new Uint8Array(144 * 2);
  MeshoptDecoder.decodeGltfBuffer(dec, 144, 2, new Uint8Array(e), 'TRIANGLES');
  console.log('u16 equal: ' + Buffer.from(dec).equals(Buffer.from(src)));
  // encoder index buffer directly
  const e2 = MeshoptEncoder.encodeIndexBuffer(src, 144, 2);
  const d2 = new Uint8Array(288);
  MeshoptDecoder.decodeIndexBuffer(d2, 144, 2, new Uint8Array(e2));
  console.log('encodeIndexBuffer equal: ' + Buffer.from(d2).equals(Buffer.from(src)));
})().catch(e => console.error('FAIL ' + (e && e.stack || e)));