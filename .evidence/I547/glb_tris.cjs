const fs = require("fs");
const path = require("path");
function glbTris(buf) {
  if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error("not glb");
  const len = buf.readUInt32LE(4);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
  let tris = 0;
  for (const mesh of json.meshes || []) {
    for (const pr of mesh.primitives || []) {
      const idx = pr.indices !== undefined ? json.accessors[pr.indices] : null;
      const pos = json.accessors[pr.attributes.POSITION];
      const n = idx ? idx.count : pos ? pos.count : 0;
      tris += Math.floor(n / 3);
    }
  }
  return tris;
}
const dir = "assets";
let totalB = 0, totalT = 0;
const rows = [];
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith(".glb")) continue;
  const p = path.join(dir, f);
  const b = fs.readFileSync(p);
  const t = glbTris(b);
  totalB += b.length; totalT += t;
  rows.push(f + " " + b.length + " B " + t + " t");
}
console.log(rows.join("\n"));
console.log("TOTAL " + rows.length + " glb " + totalB + " B " + totalT + " t");