const fs = require("fs");
const p = "E:/Game/.evidence/I540/build_ship_v7.py";
let s = fs.readFileSync(p, "utf8");
function rep(old, next) {
  const i = s.indexOf(old);
  if (i < 0) throw new Error("NOT FOUND: " + old.slice(0, 60));
  s = s.slice(0, i) + next + s.slice(i + old.length);
}
// 1) hull: double the band subdivision passes
rep(
`    for (y0, y1) in bands:
        sel = set(e for f in bm.faces if y0 < f.calc_center_median().y < y1 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    displace(bm, 0.008, 0.002, 3.0, SEED)`,
`    for _pass in range(2):
        for (y0, y1) in bands:
            sel = set(e for f in bm.faces if y0 < f.calc_center_median().y < y1 for e in f.edges)
            bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    displace(bm, 0.008, 0.002, 3.0, SEED)`);
// 2) wings: 9-pt profile
rep(
`AIR7 = [(-0.35, 0.000), (-0.22, 0.030), (-0.06, 0.048), (0.12, 0.046),
        (0.26, 0.034), (0.32, 0.014), (0.30, -0.012), (0.18, -0.030),
        (0.0, -0.038), (-0.16, -0.032), (-0.28, -0.014)]`,
`AIR7 = [(-0.35, 0.000), (-0.20, 0.032), (-0.04, 0.048), (0.14, 0.042),
        (0.28, 0.028), (0.32, 0.010), (0.24, -0.022), (0.02, -0.036),
        (-0.22, -0.018)]`);
// 3) wings: narrow 2nd band
rep("if 0.50 < abs(f.calc_center_median().x) < 1.70 for e in f.edges)",
    "if 0.90 < abs(f.calc_center_median().x) < 1.50 for e in f.edges)");
fs.writeFileSync(p, s);
console.log("PATCHED", s.length);
