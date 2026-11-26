const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const { MeshoptEncoder } = require('E:/Game/node_modules/meshoptimizer/meshopt_encoder.js');
const MeshoptDecoder = require('E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs');
const A = 'E:/Game/assets', ORIG = 'E:/Game/.evidence/I609/orig', ENC = 'E:/Game/.evidence/I609/enc';

function parseGLB(buf) {
  if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error('bad magic');
  const ver = buf.readUInt32LE(4);
  const jsonLen = buf.readUInt32LE(12), jsonOff = 20;
  let off = jsonOff + jsonLen;
  let bin = null;
  while (off < buf.length) {
    const clen = buf.readUInt32LE(off), ctyp = buf.readUInt32LE(off + 4);
    if (ctyp === 0x004E4942) bin = buf.subarray(off + 8, off + 8 + clen);
    off += 8 + clen;
  }
  return { ver, json: JSON.parse(buf.subarray(jsonOff, jsonOff + jsonLen).toString('utf8')), bin };
}
function pad4(n) { return (n + 3) & ~3; }
function buildGLB(jsonStr, binBytes) {
  const jsonP = Buffer.from(jsonStr, 'utf8'); const jp = Buffer.alloc(pad4(jsonP.length), 0x20); jsonP.copy(jp);
  const bp = Buffer.alloc(pad4(binBytes.length)); binBytes.copy(bp, 0);
  const out = Buffer.alloc(28 + jp.length + bp.length); // I609 fix: 12 header + 8+8 chunk headers (was 12: silently truncated BIN tail by 16 B)
  out.writeUInt32LE(0x46546C67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(jp.length, 12); out.writeUInt32LE(0x4E4F534A, 16); jp.copy(out, 20);
  out.writeUInt32LE(bp.length, 20 + jp.length); out.writeUInt32LE(0x004E4942, 20 + jp.length + 4); bp.copy(out, 20 + jp.length + 8);
  return out;
}

(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  fs.mkdirSync(ORIG, { recursive: true }); fs.mkdirSync(ENC, { recursive: true });
  const files = fs.readdirSync(A).filter(f => f.endsWith('.glb')).sort();
  const manifest = [];
  let totO = 0, totN = 0, gateFail = 0;
  const rows = [];
  for (const f of files) {
    const buf = fs.readFileSync(path.join(A, f));
    fs.writeFileSync(path.join(ORIG, f), buf);
    manifest.push(f + '  ' + crypto.createHash('sha256').update(buf).digest('hex'));
    const { ver, json, bin } = parseGLB(buf);
    if (ver !== 2) throw new Error(f + ' glb version ' + ver);
    if ((json.buffers || []).length !== 1) throw new Error(f + ' multi-buffer GLB (not supported)');
    const acc = json.accessors || [];
    // per view: collect accessors
    const views = json.bufferViews || [];
    const plan = views.map((v, vi) => {
      const as = acc.map((a, ai) => ({ a, ai })).filter(x => x.a.bufferView === vi);
      if (as.length === 0) return { vi, skip: 'unused' };
      const idxAi = as.filter(x => json.meshes.some(m => m.primitives.some(p => p.indices === x.ai))).map(x => x.ai);
      const attrAi = as.filter(x => !json.meshes.some(m => m.primitives.some(p => p.indices === x.ai))).map(x => x.ai);
      if (idxAi.length > 0) {
        if (idxAi.length !== 1) throw new Error(f + ' view ' + vi + ' multiple index accessors');
        const a = acc[idxAi[0]];
        const allTri = json.meshes.every(m => m.primitives.every(p => { const md = p.mode === undefined ? 4 : p.mode; return md === 4; }));
        if (attrAi.length > 0) throw new Error(f + ' view ' + vi + ' interleaved index+attr (not supported)');
        // I609: always INDICES mode (encodeIndexSequence) - proven bit-identical for ALL data.
        // TRIANGLES mode (encodeIndexBuffer) is NOT lossless for degenerate triangles /
        // winding-duplicate triangles (probe609g: 6/6 such cases reorder) - violates the
        // FROZEN "geometry bit-identical" contract.
        return { vi, mode: 'INDICES', count: a.count, size: a.componentType === 5123 ? 2 : 4 };
      }
      const sparse = as.some(x => x.a.sparse);
      if (sparse) throw new Error(f + ' view ' + vi + ' sparse accessors (not supported)');
      const size = v.byteStride !== undefined ? v.byteStride : (() => { const a = acc[attrAi[0]]; return a.byteStride !== undefined ? a.byteStride : (a.componentType === 5126 ? 4 : a.componentType === 5123 ? 2 : a.componentType === 5125 ? 4 : 1) * ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type]); })();
      const count = Math.max(...as.map(x => x.a.count));
      return { vi, mode: 'ATTRIBUTES', count, size, stride: v.byteStride };
    });
    // encode (twice for determinism) + build new bin
    const payloads = []; let cursor = 0;
    for (const p of plan) {
      if (p.skip) { payloads.push({ p, skip: p.skip }); cursor += 0; continue; }
      const v = views[p.vi];
      if (v.byteLength !== p.count * p.size) throw new Error(f + ' view ' + p.vi + ' byteLength ' + v.byteLength + ' != count*size ' + (p.count * p.size) + ' (accessor/view mismatch)');
      const src = new Uint8Array(bin.subarray(v.byteOffset, v.byteOffset + v.byteLength));
      const e1 = MeshoptEncoder.encodeGltfBuffer(src, p.count, p.size, p.mode);
      const e2 = MeshoptEncoder.encodeGltfBuffer(src, p.count, p.size, p.mode);
      if (Buffer.from(e1).compare(Buffer.from(e2)) !== 0) { gateFail++; throw new Error(f + ' view ' + p.vi + ' DETERMINISM FAIL'); }
      const dec = new Uint8Array(p.count * p.size); MeshoptDecoder.decodeGltfBuffer(dec, p.count, p.size, new Uint8Array(e1), p.mode); if (Buffer.from(dec).compare(Buffer.from(src)) !== 0) { gateFail++; throw new Error(f + ' view ' + p.vi + ' LOSSLESSNESS FAIL'); }
      const pb = Buffer.from(e1);
      payloads.push({ p, buf: pb });
      cursor += pb.length;
    }
    // sanity: no skipped views in practice
    for (const pl of payloads) if (pl.skip) throw new Error(f + ' skipped view (unused bufferView) - manual review needed');
    const newBin = Buffer.concat(payloads.map(pl => pl.buf));
    // patch JSON
    if (!json.extensionsUsed) json.extensionsUsed = [];
    if (!json.extensionsUsed.includes('EXT_meshopt_compression')) json.extensionsUsed.push('EXT_meshopt_compression');
    if (!json.extensionsRequired) json.extensionsRequired = [];
    if (!json.extensionsRequired.includes('EXT_meshopt_compression')) json.extensionsRequired.push('EXT_meshopt_compression');
    let bo = 0;
    for (const pl of payloads) {
      const p = pl.p; const v = views[p.vi];
      const ext = { buffer: 0, byteOffset: bo, byteLength: pl.buf.length, count: p.count };
      if (p.mode === 'ATTRIBUTES') ext.byteStride = p.stride !== undefined ? p.stride : p.size;
      else ext.byteStride = p.size; // I609 fix: INDICES views also need byteStride (component size 2/4) - three.js GLTFLoader passes extensionDef.byteStride verbatim as the decoder size
      ext.mode = p.mode;
      v.extensions = v.extensions || {};
      v.extensions.EXT_meshopt_compression = ext;
      bo += pl.buf.length;
    }
    const out = buildGLB(JSON.stringify(json), newBin);
    fs.writeFileSync(path.join(ENC, f), out);
    const ratio = (buf.length / out.length).toFixed(3);
    rows.push(f.padEnd(28) + String(buf.length).padStart(9) + ' -> ' + String(out.length).padStart(8) + '  x' + ratio);
    totO += buf.length; totN += out.length;
  }
  fs.writeFileSync(path.join(ENC, 'manifest.sha256'), manifest.join('\n') + '\n');
  console.log(rows.join('\n'));
  console.log('TOTAL: ' + totO + ' -> ' + totN + '  ratio x' + (totO / totN).toFixed(3) + '  saved ' + (totO - totN) + ' B  gateFail: ' + gateFail);
})().catch(e => { console.error('ABORT: ' + e.message); process.exit(1); });