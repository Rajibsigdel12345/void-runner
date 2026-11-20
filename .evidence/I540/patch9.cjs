const fs = require("fs");
const p = "E:/Game/.evidence/I540/build_ship_v7.py";
let s = fs.readFileSync(p, "latin1");
function rep(old, next) {
  const i = s.indexOf(old);
  if (i < 0) throw new Error("NOT FOUND: " + JSON.stringify(old.slice(0, 70)));
  if (s.indexOf(old, i + 1) >= 0) throw new Error("NOT UNIQUE: " + JSON.stringify(old.slice(0, 70)));
  s = s.slice(0, i) + next + s.slice(i + old.length);
}
rep("V7_NOZ_BEVEL = 68.0        # nozzle bevel pass-1 angle deg",
    "V7_NOZ_BEVEL = 68.0        # nozzle bevel pass-1 angle deg\nV7_NOZ_SUBDIV = False      # nozzle aft subdiv (no displace on nozzle: pure count, cut)");
rep("    aft = set(e for f in bm.faces if f.calc_center_median().y > 1.10 for e in f.edges)",
    "    aft = set(e for f in bm.faces if f.calc_center_median().y > 1.15 for e in f.edges)");
rep("    displace(bm, 0.005, 0.0, 3.0, SEED + 2)\n    bm.to_mesh(ob.data); bm.free(); ob.data.update()\n    bevel_ob(ob, 0.004, 45.0)",
    "    displace(bm, 0.005, 0.0, 3.0, SEED + 2)\n    bm.to_mesh(ob.data); bm.free(); ob.data.update()\n    bevel_ob(ob, 0.004, 60.0)");
rep("for e in f.edges)\n    bmesh.ops.subdivide_edges(bm, edges=list(cent), cuts=1, smooth=0)",
    "for e in f.edges) if V7_NOZ_SUBDIV else set()\n    bmesh.ops.subdivide_edges(bm, edges=list(cent), cuts=1, smooth=0)");
fs.writeFileSync(p, s, "latin1");
console.log("PATCH9 OK");
