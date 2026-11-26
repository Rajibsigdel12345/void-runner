const { MeshoptEncoder } = require('E:/Game/node_modules/meshoptimizer/meshopt_encoder.js');
const MeshoptDecoder = require('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs');
(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  console.log('encoder supported: ' + MeshoptEncoder.supported);
  // probe a tiny index buffer: 12 u32 indices
  const idx = new Uint8Array(new Uint32Array([0,1,2, 3,4,5, 6,7,8, 9,10,11]).buffer);
  const e = MeshoptEncoder.encodeGltfBuffer(idx, 12, 4, 'TRIANGLES');
  console.log('encode ok, len: ' + e.length);
  const d = await MeshoptDecoder.decodeGltfBuffer(new Uint8Array(e), 12, 4, 'TRIANGLES');
  console.log('decode ok, equal: ' + Buffer.from(d).equals(Buffer.from(idx)));
  // probe attributes: 4 verts x 12 bytes
  const attr = new Uint8Array(48); for (let i=0;i<48;i++) attr[i]=i;
  const e2 = MeshoptEncoder.encodeGltfBuffer(attr, 4, 12, 'ATTRIBUTES');
  const d2 = await MeshoptDecoder.decodeGltfBuffer(new Uint8Array(e2), 4, 12, 'ATTRIBUTES');
  console.log('attr encode len: ' + e2.length + ' decode equal: ' + Buffer.from(d2).equals(Buffer.from(attr)));
})().catch(e => console.error('PROBE FAIL: ' + (e && e.stack || e)));