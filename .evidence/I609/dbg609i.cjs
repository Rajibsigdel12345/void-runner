const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = "E:/Game/.evidence/I609";
function sha16(b) { return crypto.createHash("sha256").update(b).digest("hex").slice(0, 16).toUpperCase(); }
const MeshoptDecoder = require("E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs");
function parseGLB(buf) {
  const jsonLen = buf.readUInt32LE(12); let off = 20 + jsonLen; let bin = null;
  while (off < buf.length) { const clen = buf.readUInt32LE(off), ctyp = buf.readUInt32LE(off + 4); if (ctyp === 0x004e4942) bin = buf.subarray(off + 8, off + 8 + clen); off += 8 + clen; }
  return { json: JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8")), bin };
}
(async () => {
  await MeshoptDecoder.ready;
  const o = fs.readFileSync(path.join(root, "orig", "arena_ring.glb"));
  const disk = fs.readFileSync(path.join(root, "enc", "arena_ring.glb"));
  console.log("on-disk sha16=" + sha16(disk) + " len=" + disk.length);
  // walk on-disk enc file
  let off = 12, ej = null, ebin = -1;
  while (off < disk.length) { const len = disk.readUInt32LE(off), t = disk.readUInt32LE(off + 4); if (t === 0x4e4f534a) ej = JSON.parse(disk.slice(off + 8, off + 8 + len).toString("utf8")); else if (t === 0x004e4942) ebin = off + 8; off += 8 + len; }
  const ext = ej.bufferViews[0].extensions.EXT_meshopt_compression;
  const src = new Uint8Array(disk.buffer, disk.byteOffset + ebin + ext.byteOffset, ext.byteLength);
  const d1 = new Uint8Array(ext.count * ext.byteStride);
  try { MeshoptDecoder.decodeGltfBuffer(d1, ext.count, ext.byteStride, src, ext.mode); console.log("on-disk view0 decode (5-arg): OK; first12=" + Array.from(d1.slice(0,12)).join(",")); }
  catch (e) { console.log("on-disk view0 decode (5-arg): " + e.message); }
  // first bytes of the source slice for inspection
  console.log("src slice first 24B: " + Array.from(src.slice(0,24)).join(","));
  console.log("ext: " + JSON.stringify(ext));
  // original BIN view0 for comparison: orig file, view0 = byteOffset..byteLength
  const oj = parseGLB(o).json;
  const v0 = oj.bufferViews[0];
  const oBin = parseGLB(o).bin;
  const oSrc = oBin.subarray(v0.byteOffset, v0.byteOffset + v0.byteLength);
  console.log("orig BIN view0 first 24B: " + Array.from(oSrc.slice(0,24)).join(","));
})();