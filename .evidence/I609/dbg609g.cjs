const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = "E:/Game/.evidence/I609";
const { MeshoptEncoder } = require("E:/Game/node_modules/meshoptimizer/meshopt_encoder.js");
const MeshoptDecoder = require("E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs");
function sha16(b) { return crypto.createHash("sha256").update(b).digest("hex").slice(0, 16).toUpperCase(); }
(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  const f = "arena_ring.glb";
  const o = fs.readFileSync(path.join(root, "orig", f));
  const fileOnDisk = fs.readFileSync(path.join(root, "enc", f));
  console.log("file on disk: " + fileOnDisk.length + " B sha16=" + sha16(fileOnDisk));
  // full in-memory re-encode (same logic as encode609)
  function parseGLB(buf) {
    const jsonLen = buf.readUInt32LE(12); let off = 20 + jsonLen; let bin = null;
    while (off < buf.length) { const clen = buf.readUInt32LE(off), ctyp = buf.readUInt32LE(off + 4); if (ctyp === 0x004E4942) bin = buf.subarray(off + 8, off + 8 + clen); off += 8 + clen; }
    return { json: JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8")), bin };
  }
  const pad4 = (n) => (n + 3) & ~3;
  const { json, bin } = parseGLB(o);
  const views = json.bufferViews;
  const acc = json.accessors;
  const payloads = [];
  for (let vi = 0; vi < views.length; vi++) {
    const v = views[vi];
    const as = acc.map((a, ai) => ({ a, ai })).filter(x => x.a.bufferView === vi);
    const idxAi = as.filter(x => json.meshes.some(m => m.primitives.some(p => p.indices === x.ai))).map(x => x.ai);
    let mode, count, size;
    if (idxAi.length > 0) {
      const a = acc[idxAi[0]];
      mode = "INDICES"; count = a.count; size = a.componentType === 5123 ? 2 : 4;
    } else {
      mode = "ATTRIBUTES"; size = v.byteStride !== undefined ? v.byteStride : 12; count = Math.max(...as.map(x => x.a.count));
    }
    const src = new Uint8Array(bin.subarray(v.byteOffset, v.byteOffset + v.byteLength));
    const enc = MeshoptEncoder.encodeGltfBuffer(src, count, size, mode);
    payloads.push({ buf: Buffer.from(enc), count, size, mode, stride: mode === "ATTRIBUTES" ? (v.byteStride !== undefined ? v.byteStride : size) : size });
  }
  const newBin = Buffer.concat(payloads.map(p => p.buf));
  if (!json.extensionsUsed) json.extensionsUsed = [];
  json.extensionsUsed.push("EXT_meshopt_compression");
  if (!json.extensionsRequired) json.extensionsRequired = [];
  json.extensionsRequired.push("EXT_meshopt_compression");
  let bo = 0;
  payloads.forEach((pl, vi) => {
    const ext = { buffer: 0, byteOffset: bo, byteLength: pl.buf.length, count: pl.count, byteStride: pl.stride, mode: pl.mode };
    views[vi].extensions = { EXT_meshopt_compression: ext };
    bo += pl.buf.length;
  });
  const jsonStr = JSON.stringify(json);
  const jsonP = Buffer.from(jsonStr, "utf8"); const jp = Buffer.alloc(pad4(jsonP.length), 0x20); jsonP.copy(jp);
  const bp = Buffer.alloc(pad4(newBin.length)); newBin.copy(bp, 0);
  const out = Buffer.alloc(28 + jp.length + bp.length);
  out.writeUInt32LE(0x46546c67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(jp.length, 12); out.writeUInt32LE(0x4e4f534a, 16); jp.copy(out, 20);
  out.writeUInt32LE(bp.length, 20 + jp.length); out.writeUInt32LE(0x004e4942, 20 + jp.length + 4); bp.copy(out, 20 + jp.length + 8);
  console.log("rebuilt: " + out.length + " B sha16=" + sha16(out));
  console.log("match=" + (sha16(out) === sha16(fileOnDisk)));
  // decode view0 from the file on disk again, twice, same process
  let off = 12, ej = null, ebin = -1;
  while (off < fileOnDisk.length) { const len = fileOnDisk.readUInt32LE(off), t = fileOnDisk.readUInt32LE(off + 4); if (t === 0x4e4f534a) ej = JSON.parse(fileOnDisk.slice(off + 8, off + 8 + len).toString("utf8")); else if (t === 0x004e4942) ebin = off + 8; off += 8 + len; }
  const ext = ej.bufferViews[0].extensions.EXT_meshopt_compression;
  const src = new Uint8Array(fileOnDisk.buffer, fileOnDisk.byteOffset + ebin + ext.byteOffset, ext.byteLength);
  for (let i = 1; i <= 3; i++) {
    const d = new Uint8Array(ext.count * ext.byteStride);
    try { MeshoptDecoder.decodeGltfBuffer(d, ext.count, ext.byteStride, src, ext.mode); console.log("decode attempt " + i + ": OK"); } catch (e) { console.log("decode attempt " + i + ": " + e.message); }
  }
  // and decode the fresh payload
  const d2 = new Uint8Array(payloads[0].count * payloads[0].size);
  try { MeshoptDecoder.decodeGltfBuffer(d2, payloads[0].count, payloads[0].size, new Uint8Array(payloads[0].buf), payloads[0].mode); console.log("decode fresh payload: OK"); } catch (e) { console.log("decode fresh payload: " + e.message); }
})();