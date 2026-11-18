const fs = require("fs");
function glbStats(p) {
  const b = fs.readFileSync(p);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString("utf8"));
  let idxCount = 0;
  const accs = json.accessors || [];
  const prims = (json.meshes || []).reduce((n, m) => n + (m.primitives || []).length, 0);
  const attrCount = new Set();
  for (const m of json.meshes || []) for (const pr of m.primitives || []) {
    if (pr.indices != null) idxCount += accs[pr.indices].count;
    for (const a of Object.keys(pr.attributes || {})) attrCount.add(a);
    if (pr.indices == null && pr.attributes.POSITION) idxCount += accs[pr.attributes.POSITION].count;
  }
  const tris = Math.round(idxCount / 3);
  const mats = (json.materials || []).map(m => m.name);
  let colorPrims = 0;
  for (const m of json.meshes || []) for (const pr of m.primitives || []) if (pr.attributes && pr.attributes.COLOR_0) colorPrims++;
  return { bytes: b.length, tris, prims, mats, colorPrims, attrs: [...attrCount].join(",") };
}
for (const f of ["boss.glb","enemy_gunship.glb","enemy_hunter.glb","enemy_wasp.glb","enemy_sentry.glb","warden.glb","stinger.glb","drone.glb"]) {
  try { console.log(f, JSON.stringify(glbStats("assets/" + f))); } catch (e) { console.log(f, "ERR", e.message.slice(0,60)); }
}
