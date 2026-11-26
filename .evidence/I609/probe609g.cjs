const { MeshoptEncoder } = require('E:/Game/node_modules/meshoptimizer/meshopt_encoder.js');
const MeshoptDecoder = require('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs');
function rt(u32arr, label) {
  const src = new Uint8Array(new Uint32Array(u32arr).buffer);
  const n = u32arr.length;
  const e = MeshoptEncoder.encodeIndexBuffer(src, n, 4);
  const d = new Uint8Array(n * 4);
  MeshoptDecoder.decodeIndexBuffer(d, n, 4, new Uint8Array(e));
  const du = new Uint32Array(d.buffer);
  let same = true;
  for (let i = 0; i < n; i++) if (du[i] !== u32arr[i]) { same = false; break; }
  console.log(label + ': ' + (same ? 'OK' : 'FAIL  src=' + u32arr.slice(0,12).join(',') + ' dec=' + Array.from(du.slice(0,12)).join(',')));
}
(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  rt([0,1,2, 0,2,3], 'fan2');
  rt([0,1,1, 0,2,2], 'degen-pair');
  rt([0,0,1, 2,2,3], 'degen-pair2');
  rt([25,0,0, 0,25,0], 'arena2');
  rt([25,0,0, 0,25,0, 24,0,1], 'arena3');
  rt([0,1,2, 2,1,1, 1,3,0], 'mixed');
  rt([1,2,0, 0,1,2, 2,0,1], 'strip');
})().catch(e => console.error('FAIL ' + (e && e.stack || e)));