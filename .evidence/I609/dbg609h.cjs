const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = "E:/Game/.evidence/I609";
const MeshoptDecoder = require("E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs");
function sha16(b) { return crypto.createHash("sha256").update(b).digest("hex").slice(0, 16).toUpperCase(); }
function chunks(b) {
  let off = 12; const out = { json: null, binOff: -1, binLen: 0 };
  while (off < b.length) { const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4); if (type === 0x4e4f534a) out.json = JSON.parse(b.slice(off + 8, off + 8 + len).toString("utf8")); else if (type === 0x004e4942) { out.binOff = off + 8; out.binLen = len; } off += 8 + len; }
  return out;
}
(async () => {
  await MeshoptDecoder.ready;
  const files = fs.readdirSync(path.join(root, "enc")).filter(f => f.endsWith(".glb")).sort();
  // stability: hash each enc file twice with a small delay
  console.log("--- stability (sha16 at t0 vs t1) ---");
  for (const f of files) {
    const a = sha16(fs.readFileSync(path.join(root, "enc", f)));
    await new Promise(r => setTimeout(r, 15));
    const b = sha16(fs.readFileSync(path.join(root, "enc", f)));
    if (a !== b) console.log("UNSTABLE " + f + " " + a + " vs " + b);
  }
  console.log("stability done");
  let totalViews = 0, totalFail = 0;
  for (const f of files) {
    const e = fs.readFileSync(path.join(root, "enc", f));
    const ec = chunks(e);
    const bad = [];
    for (let vi = 0; vi < ec.json.bufferViews.length; vi++) {
      const bv = ec.json.bufferViews[vi];
      const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;
      if (!ext) continue;
      totalViews++;
      const src = new Uint8Array(e.buffer, e.byteOffset + ec.binOff + (ext.byteOffset || 0), ext.byteLength);
      const out = new Uint8Array(bv.count * ext.byteStride);
      try { MeshoptDecoder.decodeGltfBuffer(out, bv.count, ext.byteStride, src, ext.mode, ext.filter || 0); }
      catch (err) { bad.push(vi + ":" + err.message + " mode=" + ext.mode + " count=" + ext.count + " stride=" + ext.byteStride + " off=" + ext.byteOffset + " len=" + ext.byteLength + " bvLen=" + bv.byteLength); }
    }
    if (bad.length) { totalFail += bad.length; console.log("FAIL " + f + " -> " + bad.join(" | ")); }
  }
  console.log("=== views=" + totalViews + " failViews=" + totalFail);
})();