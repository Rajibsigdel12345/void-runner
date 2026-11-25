const fs = require("fs");
const B = "E:/Game/.evidence/I586/";
function patch(file, pairs) {
  let s = fs.readFileSync(B + file, "utf8").replace(/^\uFEFF/, "");
  for (const [a, b] of pairs) {
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error(file + " anchor x" + n + ": " + a.slice(0, 60));
    s = s.replace(a, b);
  }
  fs.writeFileSync(B + file, s, "utf8");
  console.log("PATCHED", file, Buffer.byteLength(s), "bytes");
}
patch("v8c1.py", [
  ["V8_NOZ_STEPS_S = 3          # sponson lip steps",
   "V8_NOZ_STEPS_S = 4          # sponson lip steps (tune-up: 3 -> 4, tops 1.25/1.23 <= 1.3005)\nV8_NOZ_SIDES_C = 20        # central lip step sides (match the 20-side central stack)"],
]);
patch("v8c1b.py", [
  ["V8_HULL_BANDD = False     # hull tail band (0.30, 0.86) [tune-up lever]",
   "V8_HULL_BANDD = False     # hull tail band (0.30, 0.86) [tune-up lever]\nV8_HULL_SUB2A = True      # hull 2nd-pass subdiv on the midship band (-0.50, 0.30) [tune-up]"],
  ["V8_WING_SUBDIVB = False   # wing band B |x| 0.95..1.35 [tune-up lever]",
   "V8_WING_SUBDIVB = True    # wing band B |x| 0.95..1.35 [tune-up lever]"],
]);
patch("v8c3.py", [
  ["    displace(bm, 0.008, 0.002, 3.0, SEED)",
   "    if V8_HULL_SUB2A:\n        sel = set(e for f in bm.faces if -0.50 < f.calc_center_median().y < 0.30 for e in f.edges)\n        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)\n        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()\n        print(\"HULL8 post-sub2A tris\", sum(len(f.verts) - 2 for f in bm.faces))\n    displace(bm, 0.008, 0.002, 3.0, SEED)"],
]);
patch("v8c5.py", [
  ["    sr = [0.160, 0.148, 0.136, 0.125]",
   "    sr = [0.160, 0.148, 0.136, 0.125, 0.113]"],
  ["    orr = [0.125, 0.113, 0.104, 0.095]",
   "    orr = [0.125, 0.113, 0.104, 0.095, 0.088]"],
  ["        _annular_y(bm, 0.0, 0.18, y0, y0 + 0.02, cr[i + 1], cr[i], 16)",
   "        _annular_y(bm, 0.0, 0.18, y0, y0 + 0.02, cr[i + 1], cr[i], V8_NOZ_SIDES_C)"],
  ["    print(\"NOZ8 final tris\", sum(len(f.verts) - 2 for f in bm.faces))",
   "    print(\"NOZ8 final tris\", tris_of(ob))"],
  ["    print(\"COK8 final tris\", sum(len(f.verts) - 2 for f in bm.faces))",
   "    print(\"COK8 final tris\", tris_of(ob))"],
  ["    print(\"FIN8 final tris\", sum(len(f.verts) - 2 for f in bm.faces))",
   "    print(\"FIN8 final tris\", tris_of(ob))"],
]);
