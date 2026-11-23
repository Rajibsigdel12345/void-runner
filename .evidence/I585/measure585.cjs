// I585 (ST-552, E83 open): pre-state measurement - assets + ship + dist + pins reference.
const fs = require("fs"), path = require("path");
const ROOT = "E:/Game";
function glbTris(p) {
  const b = fs.readFileSync(p);
  // GLB: JSON chunk, then binary chunk. Parse JSON chunk for node/mesh refs -> count from buffer is complex;
  // instead: reuse the house approach (parse JSON, sum primitive indices/positions). Simplest robust:
  // count via the known parser in .evidence/I547/glb_tris.cjs logic is too coupled; here we only need
  // ship tris + totals that glb_tris.cjs already prints. So this script measures SIZES only.
  return b.length;
}
const assets = fs.readdirSync(path.join(ROOT, "assets")).filter(f => f.endsWith(".glb")).sort();
let tot = 0;
const rows = assets.map(f => { const s = fs.statSync(path.join(ROOT, "assets", f)); tot += s.size; return f + " " + s.size + " B"; });
const ship = fs.statSync(path.join(ROOT, "assets/ship.glb")).size;
const dist = fs.readdirSync(path.join(ROOT, "dist")).filter(f => fs.statSync(path.join(ROOT, "dist", f)).isFile());
let db = 0; for (const f of dist) db += fs.statSync(path.join(ROOT, "dist", f)).size;
const out = [
  "I585 pre-state measurement (E83 open, ST-552)",
  "assets: " + assets.length + " glb, total " + tot + " B",
  rows.join(" | "),
  "ship.glb " + ship + " B",
  "dist: " + dist.length + " files, total " + db + " B",
  "asset cap (current, AGENTS.md I561/ST-527): 3,940 KiB (4,034,560 B) / 91,050 t",
  "dist ceiling 7,400,000 B / tripwire 7,297,600 B / CLOSE FLOOR E82 969,826 B (I584)",
  "v8 budget pre-registration: GLB target <= 1,400,000 B / hard 1,500,000 B; tris AIM 60,000 / HARD 65,000",
  "  dist target ~" + (db - ship + 1400000) + " B / hard ~" + (db - ship + 1500000) + " B (code delta 0 expected)",
  "  close floor at hard ~" + (7400000 - (db - ship + 1500000)) + " B (floor >= 102,400 B)",
  "  asset cap renegotiation: tris " + (91050 - 32499 + 65000) + " -> pre-register 123,550 t; size " + (tot - ship + 1500000) + " B -> pre-register 4,660 KiB (4,771,840 B)",
  "  v7 density " + (ship / 32499).toFixed(2) + " B/tri; 60,000 tris -> ~" + Math.round(60000 * ship / 32499) + " B; 65,000 tris -> ~" + Math.round(65000 * ship / 32499) + " B",
  "playframe pins: A 22/32,717 (ship 32,499 + 218) / B 52/73,172; causal483 score 11334; pwa491 11/11; tests 1,237/1,237"
].join("\n") + "\n";
fs.writeFileSync(path.join(ROOT, ".evidence/I585/measure585.txt"), out, "utf8");
console.log(out);