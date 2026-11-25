const fs = require("fs");
const p = (f) => "E:/Game/.evidence/I586/" + f;
function patch(file, anchor, repl) {
  let s = fs.readFileSync(p(file), "utf8");
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(file + " anchor count " + n + " for: " + anchor.slice(0, 60));
  s = s.replace(anchor, repl);
  fs.writeFileSync(p(file), s);
  console.log("patched", file, "|", anchor.slice(0, 48));
}
patch("v8c4.py",
  "    print(\"WING8 final tris\", sum(len(f.verts) - 2 for f in bm.faces))",
  "    print(\"WING8 final tris\", tris_of(ob))");
patch("v8c4.py",
  "    print(\"ENG8 final tris\", sum(len(f.verts) - 2 for f in bm.faces))",
  "    print(\"ENG8 final tris\", tris_of(ob))");
patch("v8c4.py",
  "    displace(bm, 0.006, 0.002, 3.5, SEED + 1)",
  "    if V8_WING_SUB2B:\n" +
  "        cands = [f for f in bm.faces if 0.75 < abs(f.calc_center_median().x) < 1.45]\n" +
  "        cands.sort(key=lambda f: abs(abs(f.calc_center_median().x) - 1.10))\n" +
  "        sel = set(e for f in cands[:V8_WING_SUB2B_N] for e in f.edges)\n" +
  "        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)\n" +
  "        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()\n" +
  "        print(\"WING8 post-sub2B tris\", sum(len(f.verts) - 2 for f in bm.faces), \"sel\", min(V8_WING_SUB2B_N, len(cands)))\n" +
  "    displace(bm, 0.006, 0.002, 3.5, SEED + 1)");
patch("v8c4.py",
  "    displace(bm, 0.005, 0.0, 3.0, SEED + 2)",
  "    if V8_ENG_SUB2B:\n" +
  "        cands = [f for f in bm.faces if f.calc_center_median().y > 0.95]\n" +
  "        cands.sort(key=lambda f: -f.calc_center_median().y)\n" +
  "        sel = set(e for f in cands[:V8_ENG_SUB2B_N] for e in f.edges)\n" +
  "        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)\n" +
  "        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()\n" +
  "        print(\"ENG8 post-sub2B tris\", sum(len(f.verts) - 2 for f in bm.faces), \"sel\", min(V8_ENG_SUB2B_N, len(cands)))\n" +
  "    displace(bm, 0.005, 0.0, 3.0, SEED + 2)");
patch("v8c3.py",
  "    displace(bm, 0.008, 0.002, 3.0, SEED)",
  "    if V8_HULL_SUB2B:\n" +
  "        cands = [f for f in bm.faces if -0.50 < f.calc_center_median().y < 0.30]\n" +
  "        cands.sort(key=lambda f: abs(f.calc_center_median().y + 0.10))\n" +
  "        sel = set(e for f in cands[:V8_HULL_SUB2B_N] for e in f.edges)\n" +
  "        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)\n" +
  "        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()\n" +
  "        print(\"HULL8 post-sub2B tris\", sum(len(f.verts) - 2 for f in bm.faces), \"sel\", min(V8_HULL_SUB2B_N, len(cands)))\n" +
  "    displace(bm, 0.008, 0.002, 3.0, SEED)");
patch("v8c1b.py",
  "V8_FIN_DORSAL2  = False   # fin dorsal2 band z > 0.75 [tune-up lever]",
  "V8_FIN_DORSAL2  = False   # fin dorsal2 band z > 0.75 [tune-up lever]\n" +
  "V8_HULL_SUB2B = True      # hull: nearest-N faces to y=-0.10 within (-0.50,0.30) [sized from run2]\n" +
  "V8_HULL_SUB2B_N = 2549\n" +
  "V8_WING_SUB2B = True      # wing: nearest-N faces to |x|=1.10 within (0.75,1.45) [sized from run2]\n" +
  "V8_WING_SUB2B_N = 565\n" +
  "V8_ENG_SUB2B  = False     # engine: nearest-N faces y>0.95 sorted by -y [insurance, off]\n" +
  "V8_ENG_SUB2B_N = 0");
console.log("PATCH586B DONE");
