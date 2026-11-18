const fs = require("fs");
const p = "E:/Game/.evidence/I509/build_remaster4.py";
let s = fs.readFileSync(p, "utf8");
function rep(old, neu) {
  const i = s.indexOf(old);
  if (i < 0) { console.error("MISS", JSON.stringify(old.slice(0, 70))); process.exit(1); }
  s = s.slice(0, i) + neu + s.slice(i + old.length);
}
// A. corner struts + edge feet + skirt -> horizontal (x,y) plane
rep(`for i in range(6):
    a = i * 2.0 * math.pi / 6 + math.pi / 6
    box(bm, 0.0, 1.04 * math.cos(a), 1.04 * math.sin(a), 0.30, 0.05, 0.05)
    box(bm, -0.22, 0.90 * math.cos(a), 0.90 * math.sin(a), 0.08, 0.045, 0.045)
for i in range(12):
    a = i * 2.0 * math.pi / 12
    box(bm, 0.0, 1.08 * math.cos(a), 1.08 * math.sin(a), 0.40, 0.035, 0.03)`,
`for i in range(6):
    a = i * 2.0 * math.pi / 6 + math.pi / 6
    box(bm, 1.04 * math.cos(a), 1.04 * math.sin(a), 0.0, 0.05, 0.05, 0.12)
    box(bm, 0.90 * math.cos(a), 0.90 * math.sin(a), -0.14, 0.08, 0.045, 0.045)
for i in range(12):
    a = i * 2.0 * math.pi / 12
    box(bm, 1.08 * math.cos(a), 1.08 * math.sin(a), -0.03, 0.035, 0.035, 0.16)`);
// B. turret detail ring -> on the (x,y) turret circle
rep("    box(bm, 0.52, 0.865 * math.cos(a), 0.865 * math.sin(a), 0.24, 0.05, 0.05)",
    "    box(bm, 0.865 * math.cos(a), 0.865 * math.sin(a), 0.52, 0.05, 0.05, 0.22)");
// C. dome ribs -> meridian fins on the dome surface
rep("    box(bm, 0.0, 0.56 * math.cos(a), 0.60 + 0.30 * math.sin(a) * 0.5, 0.40, 0.045, 0.04)",
    "    box(bm, 0.54 * math.cos(a), 0.54 * math.sin(a), 0.75, 0.03, 0.03, 0.12)");
// D. antennas -> on the pad (x,y), outside the turret
rep(`for i in range(3):
    box(bm, -0.30 + i * 0.30, 0.30 * math.sin(i * 2.1), 0.20 + 0.06 * i, 0.03, 0.03, 0.10)`,
`for i in range(3):
    a = i * 2.0 * math.pi / 3 + 0.5
    box(bm, 0.92 * math.cos(a), 0.92 * math.sin(a), 0.30, 0.025, 0.025, 0.12)`);
// E. column collar ring -> (x,y) plane
rep("    box(bm, 0.0, 0.62 * math.cos(i * 0.785), 0.30 + 0.20 * math.sin(i * 0.785), 0.03, 0.028, 0.05)",
"    box(bm, 0.56 * math.cos(i * 0.785), 0.56 * math.sin(i * 0.785), 0.30, 0.04, 0.04, 0.06)");
// F. side face panels -> flat on the hex faces (x,y plane, z -0.15..0.15)
rep(`    plate(bm, (0.18, 0.88 * ca - 0.35 * sa, 0.88 * sa + 0.35 * ca), (0.18, 0.88 * ca + 0.35 * sa, 0.88 * sa - 0.35 * ca),
              (-0.18, 0.88 * ca - 0.35 * sa, 0.88 * sa + 0.35 * ca), (-0.18, 0.88 * ca + 0.35 * sa, 0.88 * sa - 0.35 * ca), 5, 4, t=0.012)`,
`    x1 = 0.88 * ca + 0.35 * sa; y1 = 0.88 * sa - 0.35 * ca
    x2 = 0.88 * ca - 0.35 * sa; y2 = 0.88 * sa + 0.35 * ca
    plate(bm, (x1, y1, 0.15), (x2, y2, 0.15), (x1, y1, -0.15), (x2, y2, -0.15), 5, 4, t=0.012)`);
// G. corner armor plates -> on the hex vertex tangents
rep(`    plate(bm, (0.19, 0.96 * ca - 0.22 * sa, 0.96 * sa + 0.22 * ca), (0.19, 0.96 * ca + 0.22 * sa, 0.96 * sa - 0.22 * ca),
              (-0.19, 0.96 * ca - 0.22 * sa, 0.96 * sa + 0.22 * ca), (-0.19, 0.96 * ca + 0.22 * sa, 0.96 * sa - 0.22 * ca), 3, 3, t=0.011)`,
`    x1 = 0.96 * ca + 0.22 * sa; y1 = 0.96 * sa - 0.22 * ca
    x2 = 0.96 * ca - 0.22 * sa; y2 = 0.96 * sa + 0.22 * ca
    plate(bm, (x1, y1, 0.17), (x2, y2, 0.17), (x1, y1, -0.17), (x2, y2, -0.17), 3, 3, t=0.011)`);
// H. base edge ring -> along the long x axis
rep(`for i in range(8):
    a = i * 2.0 * math.pi / 8
    box(bm, 0.0, 1.28 * math.cos(a), -0.02 + 0.26 * math.sin(a), 0.06, 0.035, 0.03)`,
`for i in range(8):
    box(bm, -1.10 + i * 0.30, 0.285 * (1 if i % 2 == 0 else -1), -0.02, 0.05, 0.025, 0.045)`);
fs.writeFileSync(p, s);
console.log("EDIT2_OK", s.length);
