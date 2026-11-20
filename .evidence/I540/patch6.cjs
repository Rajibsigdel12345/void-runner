const fs = require("fs");
const p = "E:/Game/.evidence/I540/build_ship_v7.py";
let s = fs.readFileSync(p, "utf8");
function rep(old, next) {
  const i = s.indexOf(old);
  if (i < 0) throw new Error("NOT FOUND: " + old.slice(0, 70));
  s = s.slice(0, i) + next + s.slice(i + old.length);
}
rep("dor = set(e for f in bm.faces if f.calc_center_median().z > 0.85 for e in f.edges)",
    "dor = set(e for f in bm.faces if f.calc_center_median().z > 0.92 for e in f.edges)");
rep(`    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.004, 45.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    for sgn in (1, -1):  # rivets post-bevel (dorsal only)
        _hex_x(bm, sgn * 0.155, sgn * 0.170, 0.62, 1.00, 0.014)
        _hex_x(bm, sgn * 0.155, sgn * 0.170, 0.80, 0.86, 0.014)
    g("Fin", 4)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    return ob`,
`    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.004, 45.0)
    return ob`);
fs.writeFileSync(p, s);
console.log("PATCHED", s.length);
