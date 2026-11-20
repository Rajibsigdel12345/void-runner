const fs = require("fs");
const p = "E:/Game/.evidence/I540/build_ship_v7.py";
let s = fs.readFileSync(p, "utf8");
const old = `    for _pass in range(2):
        for (y0, y1) in bands:
            sel = set(e for f in bm.faces if y0 < f.calc_center_median().y < y1 for e in f.edges)
            bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()`;
const next = `    BANDS2 = [(-0.45, 0.35)]
    for (y0, y1) in BANDS2:
        sel = set(e for f in bm.faces if y0 < f.calc_center_median().y < y1 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()`;
const i = s.indexOf(old);
if (i < 0) throw new Error("NOT FOUND bands2");
s = s.slice(0, i) + next + s.slice(i + old.length);
fs.writeFileSync(p, s);
console.log("PATCHED", s.length);
