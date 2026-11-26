const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = "E:/Game/.evidence/I609";
function sha16(b) { return crypto.createHash("sha256").update(b).digest("hex").slice(0, 16).toUpperCase(); }
const MeshoptDecoder = require("E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs");
function chunks(b) {
  let off = 12; const out = { json: null, binOff: -1, binLen: 0 };
  while (off < b.length) { const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4); if (type === 0x4e4f534a) out.json = JSON.parse(b.slice(off + 8, off + 8 + len).toString("utf8")); else if (type === 0x004e4942) { out.binOff = off + 8; out.binLen = len; } off += 8 + len; }
  return out;
}
(async () => {
  await MeshoptDecoder.ready;
  const e = fs.readFileSync(path.join(root, "enc", "arena_ring.glb"));
  console.log("file sha16=" + sha16(e));
  const ec = chunks(e);
  const ext = ec.json.bufferViews[0].extensions.EXT_meshopt_compression;
  const src = new Uint8Array(e.buffer, e.byteOffset + ec.binOff + (ext.byteOffset || 0), ext.byteLength);
  // A: 5-arg
  const a = new Uint8Array(ext.count * ext.byteStride);
  try { MeshoptDecoder.decodeGltfBuffer(a, ext.count, ext.byteStride, src, ext.mode); console.log("A 5-arg: OK"); } catch (er) { console.log("A 5-arg: " + er.message); }
  // B: 6-arg filter=0
  const b = new Uint8Array(ext.count * ext.byteStride);
  try { MeshoptDecoder.decodeGltfBuffer(b, ext.count, ext.byteStride, src, ext.mode, 0); console.log("B 6-arg f=0: OK; equal=" + (Buffer.from(a).equals(Buffer.from(b)))); } catch (er) { console.log("B 6-arg f=0: " + er.message); }
  // C: stability pass then 5-arg
  const files = fs.readdirSync(path.join(root, "enc")).filter(f => f.endsWith(".glb")).sort();
  for (const f of files) { sha16(fs.readFileSync(path.join(root, "enc", f))); await new Promise(r => setTimeout(r, 15)); sha16(fs.readFileSync(path.join(root, "enc", f))); }
  const c = new Uint8Array(ext.count * ext.byteStride);
  try { MeshoptDecoder.decodeGltfBuffer(c, ext.count, ext.byteStride, src, ext.mode); console.log("C stability-then-5arg: OK; equal=" + (Buffer.from(a).equals(Buffer.from(c)))); } catch (er) { console.log("C stability-then-5arg: " + er.message); }
})();