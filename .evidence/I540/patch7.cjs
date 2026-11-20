const fs = require("fs");
const p = "E:/Game/.evidence/I540/build_ship_v7.py";
let s = fs.readFileSync(p, "latin1");
function rep(old, next) {
  const i = s.indexOf(old);
  if (i < 0) throw new Error("NOT FOUND: " + old.slice(0, 70));
  if (s.indexOf(old, i + 1) >= 0) throw new Error("NOT UNIQUE: " + old.slice(0, 70));
  s = s.slice(0, i) + next + s.slice(i + old.length);
}
rep("V7_NOZ_STEPS = 3          # exhaust lip steps per stack\n",
    "V7_NOZ_STEPS = 3          # exhaust lip steps per stack\nV7_ENG_BEVEL = 60.0        # engine bevel pass-1 angle deg (45 too greedy: sel 1432)\nV7_NOZ_BEVEL = 60.0        # nozzle bevel pass-1 angle deg\n");
rep("        _annular_y(bm, 0.0, 0.18, y - 0.012, y + 0.012, r + 0.015, r + 0.035, 24)",
    "        _annular_y(bm, 0.0, 0.18, y - 0.012, y + 0.012, r + 0.015, r + 0.035, 16)");
rep("            _annular_y(bm, sgn * 1.30, 0.10, y - 0.010, y + 0.010, r + 0.015, r + 0.030, 16)",
    "            _annular_y(bm, sgn * 1.30, 0.10, y - 0.010, y + 0.010, r + 0.015, r + 0.030, 12)");
rep("    g(\"Engine\", 8 + 4 + 6 + 2 + 1 + 2)\n    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])\n    bm.normal_update()\n    bevel_ob(ob_from_bm(bm, ob), 0.005, 45.0)",
    "    g(\"Engine\", 8 + 4 + 6 + 2 + 1 + 2)\n    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])\n    bm.normal_update()\n    print(\"ENG7 pre-bevel1 tris\", tris_of(ob))\n    bevel_ob(ob_from_bm(bm, ob), 0.005, V7_ENG_BEVEL)\n    print(\"ENG7 post-bevel1 tris\", tris_of(ob))");
rep("    displace(bm, 0.005, 0.0, 3.0, SEED + 2)\n    bm.to_mesh(ob.data); bm.free(); ob.data.update()\n    bevel_ob(ob, 0.004, 45.0)",
    "    displace(bm, 0.005, 0.0, 3.0, SEED + 2)\n    bm.to_mesh(ob.data); bm.free(); ob.data.update()\n    bevel_ob(ob, 0.004, 45.0)\n    print(\"ENG7 final tris\", tris_of(ob))");
rep("    g(\"Nozzle\", 12 + 3 + 2)\n    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])\n    bm.normal_update()\n    bevel_ob(ob_from_bm(bm, ob), 0.004, 45.0)",
    "    g(\"Nozzle\", 12 + 3 + 2)\n    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])\n    bm.normal_update()\n    print(\"NOZ7 pre-bevel1 tris\", tris_of(ob))\n    bevel_ob(ob_from_bm(bm, ob), 0.004, V7_NOZ_BEVEL)\n    print(\"NOZ7 post-bevel1 tris\", tris_of(ob))");
rep("    bevel_ob(ob, 0.004, 45.0)\n    return ob# ---------------------------------------------------------------- v7 COCKPIT",
    "    bevel_ob(ob, 0.004, 45.0)\n    print(\"NOZ7 final tris\", tris_of(ob))\n    return ob# ---------------------------------------------------------------- v7 COCKPIT");
fs.writeFileSync(p, s, "latin1");
console.log("PATCH7 OK");
