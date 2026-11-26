const fs = require("fs"), path = require("path");
const root = "E:/Game/.evidence/I609";
const { MeshoptEncoder } = require("E:/Game/node_modules/meshoptimizer/meshopt_encoder.js");
const MeshoptDecoder = require("E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs");
(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  const f = "arena_ring.glb";
  const o = fs.readFileSync(path.join(root, "orig", f));
  const e = fs.readFileSync(path.join(root, "enc", f));
  function walk(b) { let off = 12; let json = null, bin = -1; while (off < b.length) { const len = b.readUInt32LE(off), t = b.readUInt32LE(off + 4); if (t === 0x4e4f534a) json = JSON.parse(b.slice(off + 8, off + 8 + len).toString("utf8")); else if (t === 0x004e4942) bin = off + 8; off += 8 + len; } return { json, bin }; }
  const { json: oj, bin: obin } = walk(o);
  const { json: ej, bin: ebin } = walk(e);
  console.log("views: " + ej.bufferViews.length);
  for (let vi = 0; vi < ej.bufferViews.length; vi++) {
    const bv = ej.bufferViews[vi];
    const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;
    if (!ext) { console.log("view" + vi + " NO EXT main=" + JSON.stringify(bv)); continue; }
    const ov = oj.bufferViews[vi];
    const oSrc = new Uint8Array(o.buffer, o.byteOffset + obin + (ov.byteOffset || 0), ov.byteLength);
    const fresh = MeshoptEncoder.encodeGltfBuffer(oSrc, ext.count, ext.byteStride, ext.mode);
    const eSrc = new Uint8Array(e.buffer, e.byteOffset + ebin + ext.byteOffset, ext.byteLength);
    const same = Buffer.from(fresh).compare(Buffer.from(eSrc.buffer, eSrc.byteOffset, eSrc.length)) === 0;
    let dec = "ok";
    try { const d = new Uint8Array(ext.count * ext.byteStride); MeshoptDecoder.decodeGltfBuffer(d, ext.count, ext.byteStride, eSrc, ext.mode); } catch (err) { dec = "FAIL " + err.message; }
    console.log("view" + vi + " mode=" + ext.mode + " count=" + ext.count + " stride=" + ext.byteStride + " extOff=" + ext.byteOffset + " extLen=" + ext.byteLength + " freshLen=" + fresh.length + " same=" + same + " decode=" + dec);
  }
})();