const fs = require('fs');
const { MeshoptEncoder } = require('E:/Game/node_modules/meshoptimizer/meshopt_encoder.js');
const MeshoptDecoder = require('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs');
(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  const buf = fs.readFileSync('E:/Game/assets/arena_ring.glb');
  const jsonLen = buf.readUInt32LE(12);
  const off = 20 + jsonLen + 4 + 8;
  const src = new Uint8Array(buf.subarray(off + 1728, off + 1728 + 288));
  const e = MeshoptEncoder.encodeIndexSequence(src, 144, 2);
  const d = new Uint8Array(288);
  MeshoptDecoder.decodeIndexSequence(d, 144, 2, new Uint8Array(e));
  console.log('INDICES mode arena equal: ' + Buffer.from(d).equals(Buffer.from(src)) + '  ratio x' + (288 / e.length).toFixed(3));
  // quick: all 34 index views via the GLB walk
  const dir = 'E:/Game/assets';
  let totSrc = 0, totEnc = 0, fails = 0;
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.glb')).sort()) {
    const b = fs.readFileSync(dir + '/' + f);
    const jl = b.readUInt32LE(12);
    const json = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
    const bo = 20 + jl + 4 + 8;
    for (const m of json.meshes || []) for (const p of m.primitives || []) {
      if (p.indices === undefined) continue;
      const a = json.accessors[p.indices];
      const v = json.bufferViews[a.bufferView];
      const s = new Uint8Array(b.subarray(bo + v.byteOffset, bo + v.byteOffset + v.byteLength));
      const en = MeshoptEncoder.encodeIndexSequence(s, a.count, a.componentType === 5123 ? 2 : 4);
      const dd = new Uint8Array(s.length);
      MeshoptDecoder.decodeIndexSequence(dd, a.count, a.componentType === 5123 ? 2 : 4, new Uint8Array(en));
      if (!Buffer.from(dd).equals(Buffer.from(s))) { fails++; console.log('FAIL ' + f); }
      totSrc += s.length; totEnc += en.length;
    }
  }
  console.log('all-index-views: fails=' + fails + '  raw ' + totSrc + ' -> ' + totEnc + '  x' + (totSrc / totEnc).toFixed(3));
})().catch(e => console.error('ERR ' + (e && e.stack || e)));