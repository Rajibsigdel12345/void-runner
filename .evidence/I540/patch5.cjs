const fs = require("fs");
const p = "E:/Game/.evidence/I540/build_ship_v7.py";
let s = fs.readFileSync(p, "utf8");
function rep(old, next) {
  const i = s.indexOf(old);
  if (i < 0) throw new Error("NOT FOUND: " + old.slice(0, 70));
  s = s.slice(0, i) + next + s.slice(i + old.length);
}
rep("BANDS2 = [(-0.45, 0.35)]", "BANDS2 = [(-0.45, 0.35), (-0.15, 0.15)]");
rep("if f.calc_center_median().z > 1.05 and abs(f.calc_center_median().x) < 0.30",
    "if f.calc_center_median().z > 0.98 and abs(f.calc_center_median().x) < 0.30");
rep("dor = set(e for f in bm.faces if f.calc_center_median().z > 0.75 for e in f.edges)",
    "dor = set(e for f in bm.faces if f.calc_center_median().z > 0.85 for e in f.edges)");
fs.writeFileSync(p, s);
console.log("PATCHED", s.length);
