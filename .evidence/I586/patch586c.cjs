const fs = require("fs");
const p = (f) => "E:/Game/.evidence/I586/" + f;
function patch(file, anchor, repl) {
  let s = fs.readFileSync(p(file), "utf8");
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(file + " anchor count " + n + " for: " + anchor.slice(0, 60));
  s = s.replace(anchor, repl);
  fs.writeFileSync(p(file), s);
  console.log("patched", file, "|", anchor.slice(0, 44).replace(/\n/g, "\\n"));
}
patch("v8c1b.py", "V8_HULL_SUB2B_N = 2549", "V8_HULL_SUB2B_N = 190");
patch("v8c1b.py", "V8_WING_SUB2B_N = 565", "V8_WING_SUB2B_N = 160");
patch("v8c1b.py", "V8_ENG_SUBDIV_Y   = 0.95", "V8_ENG_SUBDIV_Y   = 1.00");
patch("v8c1b.py",
  "V8_ENG_SUB2B_N = 0",
  "V8_ENG_SUB2B_N = 0\nV8_COK_SUBALLZ = True      # cockpit: subdivide all faces with center z < V8_COK_SUBALLZ_Z [sized from run3]\nV8_COK_SUBALLZ_Z = 1.00");
patch("v8c1.py", "V8_NOZ_BEVEL = 68.0", "V8_NOZ_BEVEL = 55.0");
patch("v8c5.py",
  "    sel = [f for f in bm.faces\n           if abs(f.calc_center_median().x) < 0.28 and 0.80 < f.calc_center_median().z < 1.23",
  "    if V8_COK_SUBALLZ:\n" +
  "        sel = set(e for f in bm.faces if f.calc_center_median().z < V8_COK_SUBALLZ_Z for e in f.edges)\n" +
  "        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)\n" +
  "        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()\n" +
  "        print(\"COK8 post-suballz tris\", sum(len(f.verts) - 2 for f in bm.faces))\n" +
  "    sel = [f for f in bm.faces\n           if abs(f.calc_center_median().x) < 0.28 and 0.80 < f.calc_center_median().z < 1.23");
patch("v8c3.py",
  "        cands = [f for f in bm.faces if -0.50 < f.calc_center_median().y < 0.30]\n        cands.sort(key=lambda f: abs(f.calc_center_median().y + 0.10))",
  "        cands = [f for f in bm.faces if -0.50 < f.calc_center_median().y < 0.30]\n" +
  "        cands.sort(key=lambda f: abs(f.calc_center_median().y + 0.10))\n" +
  "        _hist = {}\n" +
  "        for f in cands:\n" +
  "            _hist[len(f.verts)] = _hist.get(len(f.verts), 0) + 1\n" +
  "        print(\"HULL8 sub2B cands\", len(cands), dict(sorted(_hist.items())), \"faces\", len(bm.faces))");
patch("v8c4.py",
  "    displace(bm, 0.006, 0.002, 3.5, SEED + 1)",
  "    print(\"WING8 post-inset tris\", sum(len(f.verts) - 2 for f in bm.faces))\n" +
  "    displace(bm, 0.006, 0.002, 3.5, SEED + 1)");
console.log("PATCH586C DONE");
