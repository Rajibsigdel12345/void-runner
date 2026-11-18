import fs from "node:fs";
for (const f of ["hunter","gunship","sentry","wasp"]) {
  const b = fs.readFileSync("E:/Game/.evidence/I509/"+f+".glb");
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20+jsonLen).toString("utf8"));
  console.log(f, "nodes:", JSON.stringify((json.nodes||[]).map(n=>n.name)));
  console.log(f, "meshes:", JSON.stringify((json.meshes||[]).map(m=>m.name)));
}