const fs = require("fs");
const p = "E:/Game/.evidence/I509/build_remaster4.py";
let s = fs.readFileSync(p, "utf8");
function rep(old, neu) {
  const i = s.indexOf(old);
  if (i < 0) { console.error("MISS", JSON.stringify(old.slice(0, 60))); process.exit(1); }
  s = s.slice(0, i) + neu + s.slice(i + old.length);
}
// 1. hunter hull +38 ribs (+456 -> 2138)
rep("made[\"hunter_hull\"] = [to_obj(bm, \"VR_Hunter_Hull\")]",
`for i in range(38):
    a = i * 2.0 * math.pi / 38 + 0.08
    box(bm, -0.05 + (i % 5) * 0.05, 0.47 * math.cos(a), 0.125 * math.sin(a), 0.045, 0.028, 0.024)
made["hunter_hull"] = [to_obj(bm, "VR_Hunter_Hull")]`);
// 2. gunship hull -4 ribs (-48 -> 1732)
rep("for i in range(18):\n    a = i * 2.0 * math.pi / 18 + 0.17",
    "for i in range(14):\n    a = i * 2.0 * math.pi / 14 + 0.17");
// 3. sentry platform +panels/corners/antenna/detail (+912 -> ~1772)
rep("made[\"sentry_platform\"] = [to_obj(bm, \"VR_Sentry_Platform\")]",
`for i in range(6):
    a = i * 2.0 * math.pi / 6 + math.pi / 6
    ca, sa = math.cos(a), math.sin(a)
    plate(bm, (0.18, 0.88 * ca - 0.35 * sa, 0.88 * sa + 0.35 * ca), (0.18, 0.88 * ca + 0.35 * sa, 0.88 * sa - 0.35 * ca),
              (-0.18, 0.88 * ca - 0.35 * sa, 0.88 * sa + 0.35 * ca), (-0.18, 0.88 * ca + 0.35 * sa, 0.88 * sa - 0.35 * ca), 5, 4, t=0.012)
for i in range(6):
    a = i * 2.0 * math.pi / 6
    ca, sa = math.cos(a), math.sin(a)
    plate(bm, (0.19, 0.96 * ca - 0.22 * sa, 0.96 * sa + 0.22 * ca), (0.19, 0.96 * ca + 0.22 * sa, 0.96 * sa - 0.22 * ca),
              (-0.19, 0.96 * ca - 0.22 * sa, 0.96 * sa + 0.22 * ca), (-0.19, 0.96 * ca + 0.22 * sa, 0.96 * sa - 0.22 * ca), 3, 3, t=0.011)
for i in range(10):
    box(bm, -0.40 + i * 0.09, 0.42 * math.cos(i * 1.3), 0.55 + 0.10 * math.sin(i * 0.9), 0.025, 0.025, 0.06)
for i in range(8):
    box(bm, 0.0, 0.62 * math.cos(i * 0.785), 0.30 + 0.20 * math.sin(i * 0.785), 0.03, 0.028, 0.05)
made["sentry_platform"] = [to_obj(bm, "VR_Sentry_Platform")]`);
// 4. sentry base +8 boxes (+96 -> 324)
rep("made[\"sentry_base\"] = [to_obj(bm, \"VR_Sentry_Base\")]",
`for i in range(8):
    box(bm, -1.05 + i * 0.30, 0.29, 0.02, 0.05, 0.02, 0.03)
made["sentry_base"] = [to_obj(bm, "VR_Sentry_Base")]`);
// 5. torus: wrap i (-> 256 tris)
rep("def torus(bm, cx, R, r, nm, nn):\n    prev = None\n",
    "def torus(bm, cx, R, r, nm, nn):\n    prev = None\n    first = None\n");
rep("        if prev is not None:", "        if first is None: first = row\n        if prev is not None:");
rep("        prev = row\ndef hash3", "        prev = row\n    for j in range(nn):\n        j2 = (j + 1) % nn\n        bm.faces.new((prev[j], prev[j2], first[j2], first[j]))\ndef hash3");
// 6. wasp hull +16 boxes (+192 -> 1356)
rep("made[\"wasp_hull\"] = [to_obj(bm, \"VR_Wasp_Hull\")]",
`for i in range(16):
    a = i * 2.0 * math.pi / 16 + 0.1
    box(bm, -0.10 + (i % 4) * 0.06, 0.13 * math.cos(a), 0.14 * math.sin(a), 0.035, 0.022, 0.02)
made["wasp_hull"] = [to_obj(bm, "VR_Wasp_Hull")]`);
// 7. sentry RAD per-axis diagnostics
rep("    print(\"RAD\", asset, round(diag, 3), \"target\", tgt, \"class\", round(diag / tgt, 3), flush=True)",
`    print("RAD", asset, round(diag, 3), "target", tgt, "class", round(diag / tgt, 3),
          "mn", [round(v, 2) for v in mn], "mx", [round(v, 2) for v in mx], flush=True)`);
fs.writeFileSync(p, s);
console.log("EDITED_OK", s.length);
