const fs = require("fs");
const p = "E:/Game/.evidence/I533/build_phantom_v2.py";
let s = fs.readFileSync(p, "utf8");
const old = "# two swept side winglets at the rear\nfor s in (-1, 1):\n    plate(bm, (-0.26, s*0.100, -0.030), (-0.26, s*0.270, 0.045), (-0.54, s*0.100, -0.030), (-0.54, s*0.270, 0.045), 6, 3, t=0.014, both=True)\n";
if (!s.includes(old)) { console.log("MISS winglet block"); process.exit(1); }
s = s.replace(old, "");
fs.writeFileSync(p, s);
console.log("WINGLETS_REMOVED");
