const { MeshoptEncoder } = require('E:/Game/node_modules/meshoptimizer/meshopt_encoder.js');
const MeshoptDecoder = require('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs');
(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  // simple u16: 0,1,2,3,4,5, 6,7,8,9,10,11
  const u16 = new Uint16Array([0,1,2,3,4,5,6,7,8,9,10,11]);
  const src = new Uint8Array(u16.buffer);
  const e = MeshoptEncoder.encodeIndexBuffer(src, 12, 2);
  const d = new Uint8Array(24);
  MeshoptDecoder.decodeIndexBuffer(d, 12, 2, new Uint8Array(e));
  console.log('simple u16 equal: ' + Buffer.from(d).equals(Buffer.from(src)));
  // u32 same data
  const u32 = new Uint32Array([0,1,2,3,4,5,6,7,8,9,10,11]);
  const src2 = new Uint8Array(u32.buffer);
  const e2 = MeshoptEncoder.encodeIndexBuffer(src2, 12, 4);
  const d2 = new Uint8Array(48);
  MeshoptDecoder.decodeIndexBuffer(d2, 12, 4, new Uint8Array(e2));
  console.log('simple u32 equal: ' + Buffer.from(d2).equals(Buffer.from(src2)));
  // the arena data as u32
  const arenaU16 = new Uint16Array(144);
  fs_read: {
    const fs = require('fs');
    const buf = fs.readFileSync('E:/Game/assets/arena_ring.glb');
    const jsonLen = buf.readUInt32LE(12);
    const off = 20 + jsonLen + 4 + 8;
    for (let i = 0; i < 144; i++) arenaU16[i] = buf.readUInt16LE(off + 1728 + i*2);
  }
  const a32 = new Uint32Array(arenaU16);
  const a32src = new Uint8Array(a32.buffer);
  const e3 = MeshoptEncoder.encodeIndexBuffer(a32src, 144, 4);
  const d3 = new Uint8Array(576);
  MeshoptDecoder.decodeIndexBuffer(d3, 144, 4, new Uint8Array(e3));
  const d3u = new Uint32Array(d3.buffer);
  let same = true;
  for (let i = 0; i < 144; i++) if (d3u[i] !== arenaU16[i]) { same = false; break; }
  console.log('arena-as-u32 equal: ' + same);
})().catch(e => console.error('FAIL ' + (e && e.stack || e)));