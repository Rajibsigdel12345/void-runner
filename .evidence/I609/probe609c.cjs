const fs = require('fs');
const { MeshoptEncoder } = require('E:/Game/node_modules/meshoptimizer/meshopt_encoder.js');
const MeshoptDecoder = require('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs');
(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  const buf = fs.readFileSync('E:/Game/assets/arena_ring.glb');
  const jsonLen = buf.readUInt32LE(12);
  const off = 20 + jsonLen + 4 + 8; // header12 + jsonchunk8 + binchunk8
  const src = new Uint8Array(buf.subarray(off, off + 576)); // view 0 POSITION
  const e = MeshoptEncoder.encodeGltfBuffer(src, 48, 12, 'ATTRIBUTES');
  console.log('enc len: ' + e.length);
  const dec = new Uint8Array(48 * 12);
  MeshoptDecoder.decodeGltfBuffer(dec, 48, 12, new Uint8Array(e), 'ATTRIBUTES');
  let same = true, first = -1;
  for (let i = 0; i < 576; i++) if (dec[i] !== src[i]) { same = false; if (first < 0) first = i; break; }
  console.log('equal: ' + same + ' firstDiff: ' + first);
  if (!same) {
    console.log('src @' + first + ': ' + Array.from(src.slice(first, first+12)).join(','));
    console.log('dec @' + first + ': ' + Array.from(dec.slice(first, first+12)).join(','));
    // also try level 1
    const e1 = MeshoptEncoder.encodeVertexBufferLevel(src, 48, 12, 1);
    const d1 = new Uint8Array(576);
    MeshoptDecoder.decodeGltfBuffer(d1, 48, 12, new Uint8Array(e1), 'ATTRIBUTES');
    let same1 = Buffer.from(d1).equals(Buffer.from(src));
    console.log('level1 equal: ' + same1);
    // try level 0
    const e0 = MeshoptEncoder.encodeVertexBufferLevel(src, 48, 12, 0);
    const d0 = new Uint8Array(576);
    MeshoptDecoder.decodeGltfBuffer(d0, 48, 12, new Uint8Array(e0), 'ATTRIBUTES');
    console.log('level0 equal: ' + Buffer.from(d0).equals(Buffer.from(src)));
  }
})().catch(e => console.error('FAIL ' + (e && e.stack || e)));