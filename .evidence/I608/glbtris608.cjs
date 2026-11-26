const fs = require("fs"), path = require("path");
const dir = "E:/Game/assets";
let total = 0; const rows = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".glb")).sort()) {
  const buf = fs.readFileSync(path.join(dir, f));
  if (buf.readUInt32LE(0) !== 0x46546C67) { rows.push(f + " NOT GLB"); continue; }
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
  let tris = 0;
  for (const m of (json.meshes || [])) for (const p of (m.primitives || [])) {
    if (p.indices !== undefined) {
      const acc = json.accessors[p.indices];
      const n = acc.count;
      const mode = p.mode === undefined ? 4 : p.mode;
      if (mode === 4) tris += Math.floor(n / 3);
    }
  }
  total += tris;
  rows.push(f + " " + tris + " t");
}
console.log(rows.join("\n"));
console.log("GLB TRI TOTAL: " + total + " t over " + rows.length + " files");