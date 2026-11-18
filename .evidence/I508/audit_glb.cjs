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
  // per-node tri table
  const nodes = (json.meshes || []).map((m, i) => ({ name: m.name || ("mesh" + i), tris: Math.round((m.primitives || []).reduce((n, pr) => { const c = pr.indices != null ? accs[pr.indices].count : (pr.attributes.POSITION ? accs[pr.attributes.POSITION].count : 0); return n + c; }, 0) / 3) }));
  return { bytes: b.length, tris, prims, mats, colorPrims, attrs: [...attrCount].join(","), nodes };
}
const FLEET = ["enemy_hunter","enemy_gunship","enemy_sentry","enemy_wasp","warden","stinger","drone","flyer","boss"];
for (const f of FLEET) {
  try { console.log(f, JSON.stringify(glbStats("E:/Game/.evidence/I508/" + f + ".glb"))); } catch (e) { console.log(f, "ERR", e.message.slice(0,60)); }
}

