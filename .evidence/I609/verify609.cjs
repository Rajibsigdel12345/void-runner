const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = "E:/Game/.evidence/I609";
const MeshoptDecoder = require("E:/Game/node_modules/meshoptimizer/meshopt_decoder.cjs");
(async () => {
  await MeshoptDecoder.ready;
  const files = fs.readdirSync(path.join(root, "orig")).filter(f => f.endsWith(".glb")).sort();
  let fails = 0, totOrig = 0, totEnc = 0;
  for (const f of files) {
    const o = fs.readFileSync(path.join(root, "orig", f));
    const e = fs.readFileSync(path.join(root, "enc", f));
    totOrig += o.length; totEnc += e.length;
    const errs = [];
    // container parse helper
    function chunks(b) {
      if (b.readUInt32LE(0) !== 0x46546c67) throw new Error("magic");
      if (b.readUInt32LE(4) !== 2) throw new Error("version");
      if (b.readUInt32LE(8) !== b.length) throw new Error("declared != len");
      let off = 12; const out = { json: null, binOff: -1, binLen: 0 };
      while (off < b.length) {
        const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4);
        if (type === 0x4e4f534a) out.json = JSON.parse(b.slice(off + 8, off + 8 + len).toString("utf8"));
        else if (type === 0x004e4942) { out.binOff = off + 8; out.binLen = len; }
        off += 8 + len;
      }
      if (off !== b.length) throw new Error("chunk walk overruns/underruns: " + off + " vs " + b.length);
      if (!out.json) throw new Error("no JSON chunk");
      if (out.binOff < 0) throw new Error("no BIN chunk");
      return out;
    }
    const oc = chunks(o), ec = chunks(e);
    const oj = oc.json, ej = ec.json;
    if (!(ej.extensionsUsed || []).includes("EXT_meshopt_compression")) errs.push("enc missing extensionsUsed");
    if (!(ej.extensionsRequired || []).includes("EXT_meshopt_compression")) errs.push("enc missing extensionsRequired");
    if ((oj.extensionsUsed || []).length) errs.push("orig had extensionsUsed (unexpected)");
    // logical size from enc main fields
    let logicalSize = 0;
    for (const bv of ej.bufferViews) logicalSize = Math.max(logicalSize, (bv.byteOffset || 0) + bv.byteLength);
    const padTail = oc.binLen - logicalSize;
    if (!(padTail >= 0 && padTail <= 3 && oc.binLen % 4 === 0)) errs.push("logical size " + logicalSize + " vs orig BIN len " + oc.binLen + " (bad tail padding)");
    // reconstruct
    const logical = new Uint8Array(logicalSize);
    let nExt = 0, nPlain = 0;
    for (const bv of ej.bufferViews) {
      const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;
      if (ext) {
        nExt++;
        const src = new Uint8Array(e.buffer, e.byteOffset + ec.binOff + (ext.byteOffset || 0), ext.byteLength);
        const out = new Uint8Array(ext.count * ext.byteStride);
        MeshoptDecoder.decodeGltfBuffer(out, ext.count, ext.byteStride, src, ext.mode, ext.filter || 0);
        logical.set(out, bv.byteOffset || 0);
      } else {
        nPlain++;
        const s = e.subarray(ec.binOff + (bv.byteOffset || 0), ec.binOff + (bv.byteOffset || 0) + bv.byteLength);
        logical.set(new Uint8Array(s), bv.byteOffset || 0);
      }
    }
    for (let pb = 0; pb < padTail; pb++) if (o[oc.binOff + logicalSize + pb] !== 0) errs.push("non-zero BIN tail padding byte " + pb);
    const oBin = new Uint8Array(o.buffer, o.byteOffset + oc.binOff, logicalSize);
    if (Buffer.from(logical.buffer).compare(Buffer.from(oBin.buffer, oBin.byteOffset, oBin.byteLength)) !== 0) errs.push("LOGICAL BIN MISMATCH vs original");
    // JSON diff: strip extension fields, must be deep-equal
    function strip(j) {
      const c = JSON.parse(JSON.stringify(j));
      for (const bv of c.bufferViews) if (bv.extensions) delete bv.extensions;
      delete c.extensionsUsed; delete c.extensionsRequired;
      return c;
    }
    if (JSON.stringify(strip(oj)) !== JSON.stringify(strip(ej))) errs.push("JSON differs beyond extension fields");
    // sanity: every view has extension + count + byteStride
    for (const bv of ej.bufferViews) {
      const ext = bv.extensions && bv.extensions.EXT_meshopt_compression;
      if (!ext) { nPlain++; continue; }
      if (typeof ext.count !== "number" || typeof ext.byteStride !== "number" || typeof ext.mode !== "string" || typeof ext.byteOffset !== "number" || typeof ext.byteLength !== "number") errs.push("view " + (bv.byteOffset) + " extension fields incomplete: " + JSON.stringify(ext));
      if (ext.byteLength > ec.binLen) errs.push("ext.byteLength exceeds BIN");
    }
    const sha = crypto.createHash("sha256").update(e).digest("hex").slice(0, 16).toUpperCase();
    if (errs.length) { fails++; console.log("FAIL " + f + " [" + o.length + "->" + e.length + "] " + errs.join("; ")); }
    else console.log("PASS " + f + " " + o.length + "->" + e.length + " B x" + (o.length / e.length).toFixed(3) + " extViews=" + nExt + " plainViews=" + nPlain + " sha16=" + sha);
  }
  console.log("=== " + files.length + " files, orig " + totOrig + " B -> enc " + totEnc + " B, x" + (totOrig / totEnc).toFixed(3) + ", FAILS=" + fails);
})();