const fs = require("fs");
const p = "E:/Game/.evidence/I533/build_phantom_v2.py";
let s = fs.readFileSync(p, "utf8");
const R = [
 ["sphere(bm, 0.78, 0.0, 0.015, 0.11, 0.085, 0.070, 12, 7)",
  "sphere(bm, 0.745, 0.0, 0.012, 0.062, 0.050, 0.042, 12, 7)"],
 ["torus(bm, 0.72, 0.075, 0.022, 12, 5)",
  "torus(bm, 0.715, 0.048, 0.014, 12, 5)"],
 ["band_inset(bm, 0.74, 0.82)",
  "band_inset(bm, 0.70, 0.82)"],
 ["    plate(bm, (-0.34, s*0.150, -0.010), (-0.34, s*0.260, 0.050), (-0.66, s*0.150, -0.010), (-0.66, s*0.260, 0.050), 6, 3, t=0.012, both=True)",
  "    plate(bm, (-0.26, s*0.100, -0.030), (-0.26, s*0.270, 0.045), (-0.54, s*0.100, -0.030), (-0.54, s*0.270, 0.045), 6, 3, t=0.014, both=True)"],
];
for (const [a, b] of R) {
  if (!s.includes(a)) { console.log("MISS", a.slice(0,60)); process.exit(1); }
  s = s.replace(a, b);
}
fs.writeFileSync(p, s);
console.log("EDITED_OK 4/4");
