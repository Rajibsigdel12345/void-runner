const fs = require("fs");
const p = "E:/Game/.evidence/I540/build_ship_v7.py";
let s = fs.readFileSync(p, "latin1");
function rep(old, next) {
  const i = s.indexOf(old);
  if (i < 0) throw new Error("NOT FOUND: " + JSON.stringify(old.slice(0, 70)));
  if (s.indexOf(old, i + 1) >= 0) throw new Error("NOT UNIQUE: " + JSON.stringify(old.slice(0, 70)));
  s = s.slice(0, i) + next + s.slice(i + old.length);
}
rep("V7_ENG_BEVEL = 60.0        # engine bevel pass-1 angle deg (45 too greedy: sel 1432)",
    "V7_ENG_BEVEL = 68.0        # engine bevel pass-1 angle deg (45 too greedy: sel 1432)");
rep("V7_NOZ_BEVEL = 60.0        # nozzle bevel pass-1 angle deg",
    "V7_NOZ_BEVEL = 68.0        # nozzle bevel pass-1 angle deg");
rep("    aft = set(e for f in bm.faces if f.calc_center_median().y > 1.00 for e in f.edges)\n    bmesh.ops.subdivide_edges(bm, edges=list(aft), cuts=1, smooth=0)",
    "    aft = set(e for f in bm.faces if f.calc_center_median().y > 1.10 for e in f.edges)\n    bmesh.ops.subdivide_edges(bm, edges=list(aft), cuts=1, smooth=0)\n    print(\"ENG7 post-subdiv tris\", sum(len(f.verts) - 2 for f in bm.faces))");
rep("cent = set(e for f in bm.faces\n               if abs(f.calc_center_median().x) < 0.45 for e in f.edges)\n    bmesh.ops.subdivide_edges(bm, edges=list(cent), cuts=1, smooth=0)",
    "cent = set(e for f in bm.faces\n               if abs(f.calc_center_median().x) < 0.45 and f.calc_center_median().y > 1.15\n               for e in f.edges)\n    bmesh.ops.subdivide_edges(bm, edges=list(cent), cuts=1, smooth=0)\n    print(\"NOZ7 post-subdiv tris\", sum(len(f.verts) - 2 for f in bm.faces))");
fs.writeFileSync(p, s, "latin1");
console.log("PATCH8 OK");
