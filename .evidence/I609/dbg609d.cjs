const fs = require("fs"), path = require("path");
const root = "E:/Game/.evidence/I609";
const { MeshoptEncoder } = require("E:/Game/node_modules/meshoptimizer/meshopt_encoder.js");
const MeshoptDecoder = require("E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs");
(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  const f = "arena_ring.glb";
  const o = fs.readFileSync(path.join(root, "orig", f));
  const e = fs.readFileSync(path.join(root, "enc", f));
  // orig parse
  let off = 12; let ojson = null, obin = -1;
  while (off < o.length) { const len = o.readUInt32LE(off), t = o.readUInt32LE(off + 4); if (t === 0x4e4f534a) ojson = JSON.parse(o.slice(off + 8, off + 8 + len).toString("utf8")); else if (t === 0x004e4942) obin = off + 8; off += 8 + len; }
  let off2 = 12; let ejson = null, ebin = -1;
  while (off2 < e.length) { const len = e.readUInt32LE(off2), t = e.readUInt32LE(off2 + 4); if (t === 0x4e4f534a) ejson = JSON.parse(e.slice(off2 + 8, off2 + 8 + len).toString("utf8")); else if (t === 0x004e4942) ebin = off2 + 8; off2 += 8 + len; }
  const bv0 = ejson.bufferViews[0];
  const ext = bv0.extensions.EXT_meshopt_compression;
  console.log("file0: view0 main byteOffset=" + bv0.byteOffset + " byteLength=" + bv0.byteLength + " ext=" + JSON.stringify(ext));
  // orig view0 raw data
  const ov = ojson.bufferViews[0];
  const oSrc = new Uint8Array(o.buffer, o.byteOffset + obin + ov.byteOffset, ov.byteLength);
  // fresh encode of orig view0 with the same plan (need mode/size/count from ext)
  const fresh = MeshoptEncoder.encodeGltfBuffer(oSrc, ext.count, ext.byteStride, ext.mode);
  // file slice
  const eSrc = new Uint8Array(e.buffer, e.byteOffset + ebin + ext.byteOffset, ext.byteLength);
  console.log("fresh len=" + fresh.length + " file len=" + eSrc.length);
  const cmp = Buffer.from(fresh).compare(Buffer.from(eSrc.buffer, eSrc.byteOffset, eSrc.length));
  console.log("fresh vs fileSlice compare=" + cmp);
  if (cmp !== 0) {
    for (let i = 0; i < Math.min(fresh.length, eSrc.length); i++) {
      if (fresh[i] !== eSrc[i]) { console.log("first diff at " + i + ": fresh=" + fresh[i] + " file=" + eSrc[i]); break; }
    }
    console.log("fresh head:", Buffer.from(fresh).slice(0, 24).toString("hex"));
    console.log("file  head:", Buffer.from(eSrc.buffer, eSrc.byteOffset, Math.min(eSrc.length, 24)).toString("hex"));
  }
  // also try decoding fresh and file slices
  try { const d = new Uint8Array(ext.count * ext.byteStride); MeshoptDecoder.decodeGltfBuffer(d, ext.count, ext.byteStride, new Uint8Array(fresh), ext.mode); console.log("decode FRESH ok"); } catch (err) { console.log("decode FRESH FAIL " + err.message); }
  try { const d = new Uint8Array(ext.count * ext.byteStride); MeshoptDecoder.decodeGltfBuffer(d, ext.count, ext.byteStride, eSrc, ext.mode); console.log("decode FILE ok"); } catch (err) { console.log("decode FILE FAIL " + err.message); }
})();