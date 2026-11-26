const fs = require("fs");
const MeshoptDecoder = require("E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs");
(async () => {
  await MeshoptDecoder.ready;
  const e = fs.readFileSync("E:/Game/.evidence/I609/enc/arena_ring.glb");
  let off = 12, json = null, binOff = -1;
  while (off < e.length) { const len = e.readUInt32LE(off), t = e.readUInt32LE(off + 4); if (t === 0x4e4f534a) json = JSON.parse(e.slice(off + 8, off + 8 + len).toString("utf8")); else if (t === 0x004e4942) binOff = off + 8; off += 8 + len; }
  console.log("e.byteOffset=" + e.byteOffset + " binOff=" + binOff);
  for (const vi of [0, 3]) {
    const bv = json.bufferViews[vi], ext = bv.extensions.EXT_meshopt_compression;
    const src = new Uint8Array(e.buffer, e.byteOffset + binOff + ext.byteOffset, ext.byteLength);
    const out = new Uint8Array(bv.count * ext.byteStride);
    let r1, r2;
    try { MeshoptDecoder.decodeGltfBuffer(out, bv.count, ext.byteStride, src, ext.mode, 0); r1 = "OK"; } catch (err) { r1 = "FAIL " + err.message; }
    try { MeshoptDecoder.decodeGltfBuffer(out, bv.count, ext.byteStride, src, ext.mode, undefined); r2 = "OK"; } catch (err) { r2 = "FAIL " + err.message; }
    console.log("view" + vi + " mode=" + ext.mode + " filter0=" + r1 + " filterUndef=" + r2 + " srcHead=" + Buffer.from(src.buffer, src.byteOffset, 8).toString("hex"));
  }
})();