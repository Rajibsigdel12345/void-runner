import fs from "node:fs";
const buf = fs.readFileSync("E:/Game/assets/enemy_phantom.glb");
let off = 12, json = null, binOff = -1;
while (off < buf.length) { const len = buf.readUInt32LE(off); const type = buf.readUInt32LE(off + 4);
  if (type === 0x4e4f534a) json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString("utf8"));
  else if (type === 0x004e4942) binOff = off + 8; off += 8 + len; }
let total = 0;
for (const m of json.meshes || []) for (const p of m.primitives || []) {
  const ia = p.indices ? json.accessors[p.indices] : null;
  const t = ia ? ia.count / 3 : json.accessors[p.attributes.POSITION].count / 3;
  total += t;
  console.log("PRIM", m.name, "indexed", !!ia, "indexType", ia ? ia.componentType : "-", "tris", t);
}
console.log("TOTAL_TRIS", total);
