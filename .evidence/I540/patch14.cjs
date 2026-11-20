const fs = require("fs");
const p = "E:/Game/.evidence/I540/build_ship_v7.py";
let s = fs.readFileSync(p, "latin1");
function rep(old, next) {
  const i = s.indexOf(old);
  if (i < 0) throw new Error("NOT FOUND: " + JSON.stringify(old.slice(0, 70)));
  if (s.indexOf(old, i + 1) >= 0) throw new Error("NOT UNIQUE: " + JSON.stringify(old.slice(0, 70)));
  s = s.slice(0, i) + next + s.slice(i + old.length);
}
rep("            px, pz, nx, nz = decagon_at(yf, th)\n            cx = px + nx * 0.012\n            cz = pz + nz * 0.012\n            rot_box(bm, (cx, yf, cz), (0.030, 0.011, 0.014),\n                    (cx, yf, cz), (0, 1, 0), th + math.pi / 2.0)",
    "            px, pz, nx, nz = decagon_at(yf, th)\n            if nz < -0.8:\n                off, hh = 0.006, 0.008   # belly cell: stay above -0.399 gate\n            else:\n                off, hh = 0.012, 0.014\n            cx = px + nx * off\n            cz = pz + nz * off\n            rot_box(bm, (cx, yf, cz), (0.030, 0.011, hh),\n                    (cx, yf, cz), (0, 1, 0), th + math.pi / 2.0)");
rep("    _h = [o for o in parts if o.name == \"VR_Ship_Hull\"][0]\n    _vv = sorted(_h.data.vertices, key=lambda v: v.co.z)[:5]\n    for v in _vv:\n        print(\"HULLLOW\", round(v.co.x, 4), round(v.co.y, 4), round(v.co.z, 4),\n              (round(v.normal.x, 3), round(v.normal.y, 3), round(v.normal.z, 3)))\n", "");
fs.writeFileSync(p, s, "latin1");
console.log("PATCH14 OK");
