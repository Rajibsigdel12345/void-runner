const fs = require("fs"), path = require("path");
const root = "E:/Game/.evidence/I609";
const MeshoptDecoder = require("E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs");
(async () => {
  await MeshoptDecoder.ready;
  const files = fs.readdirSync(path.join(root, "orig")).filter(f => f.endsWith(".glb")).sort();
  for (const f of files) {
    try {
      const e = fs.readFileSync(path.join(root, "enc", f));
      let off = 12; let json = null, binOff = -1, binLen = 0;
      while (off < e.length) {
        const len = e.readUInt32LE(off), type = e.readUInt32LE(off + 4);
        if (type === 0x4e4f534a) json = JSON.parse(e.slice(off + 8, off + 8 + len).toString("utf8"));
        else if (type === 0x004e4942) { binOff = off + 8; binLen = len; }
        off += 8 + len;
      }
      for (let vi = 0; vi < json.bufferViews.length; vi++) {
        const bv = json.bufferViews[vi];
        const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;
        if (!ext) continue;
        const src = new Uint8Array(e.buffer, e.byteOffset + binOff + ext.byteOffset, ext.byteLength);
        const out = new Uint8Array(bv.count * ext.byteStride);
        MeshoptDecoder.decodeGltfBuffer(out, bv.count, ext.byteStride, src, ext.mode, ext.filter || 0);
      }
      console.log("OK   " + f);
    } catch (err) {
      console.log("FAIL " + f + " :: " + err.message);
    }
  }
})();