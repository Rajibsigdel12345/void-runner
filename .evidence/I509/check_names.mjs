import fs from "node:fs";
for (const f of ["hunter.glb","gunship.glb","sentry.glb","wasp.glb"]) {
  const buf = fs.readFileSync("E:/Game/.evidence/I509/" + f);
  let off = 12, json = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off); const type = buf.readUInt32LE(off + 4);
    if (type === 0x4e4f534a) json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString("utf8"));
    off += 8 + len;
  }
  console.log("== " + f);
  console.log("  nodes:", (json.nodes || []).map((n) => n.name).join(", "));
  console.log("  meshes:", (json.meshes || []).map((m) => m.name).join(", "));
  console.log("  materials:", (json.materials || []).map((m) => m.name).join(", "));
  for (const m of json.meshes || []) for (const p of m.primitives || []) {
    const c = json.accessors[p.attributes.COLOR_0];
    const pos = json.accessors[p.attributes.POSITION];
    console.log("  prim", m.name, "COLOR_0:", c ? (c.componentType + " " + c.type + " count=" + c.count + " (pos " + pos.count + ")") : "NONE", "mat=" + json.materials[p.material].name);
  }
}