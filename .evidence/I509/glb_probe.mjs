import fs from "fs";
function inspect(p) {
  const buf = fs.readFileSync(p);
  const len = buf.readUInt32LE(8);
  let off = 12, json = null;
  while (off + 8 <= len) {
    const cl = buf.readUInt32LE(off), ct = buf.readUInt32LE(off + 4);
    if (ct === 0x4E4F534A) json = JSON.parse(buf.subarray(off + 8, off + 8 + cl).toString("utf8"));
    off += 8 + cl;
  }
  console.log("== " + p + " (" + buf.length + " B)");
  for (const n of (json.nodes || [])) {
    if (n.mesh === undefined) continue;
    const m = json.meshes[n.mesh];
    for (let pi = 0; pi < m.primitives.length; pi++) {
      const acc = json.accessors[m.primitives[pi].attributes.POSITION];
      console.log("  " + (n.name || ("node" + n.mesh)) + " prim" + pi +
        "  min [" + acc.min.map(v => v.toFixed(4)).join(", ") + "]" +
        "  max [" + acc.max.map(v => v.toFixed(4)).join(", ") + "]" +
        "  ext [" + acc.max.map((v, i) => (v - acc.min[i]).toFixed(4)).join(", ") + "]");
    }
  }
}
for (const p of process.argv.slice(2)) inspect(p);