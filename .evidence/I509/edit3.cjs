const fs = require("fs");
const p = "E:/Game/.evidence/I509/build_remaster4.py";
const t = fs.readFileSync(p, "utf8");
const startMarker = "plate(bm, (0.10, 0.06, 0.10), (0.10, 1.18, 0.14),";
const si = t.indexOf(startMarker);
if (si < 0) throw new Error("start marker not found");
const bm = t.lastIndexOf("bm = bmesh.new()", si);
if (bm < 0 || si - bm > 40) throw new Error("bmesh.new() not adjacent above start");
const before = bm === 0 ? "" : t[bm - 1];
if (before !== "\n" && before !== "\r") throw new Error("bm = bmesh.new() not at line start: " + JSON.stringify(t.slice(bm - 10, bm + 20)));
const endStr = "box(bm, 0.10, 1.19, -0.12, 0.04, 0.035, 0.025)";
const ei = t.indexOf(endStr, si);
if (ei < 0) throw new Error("end marker not found");
const eEnd = ei + endStr.length;
const nl = [
"bm = bmesh.new()",
"# I509 FIX (wing mirror): the first build dropped the -Y mirror of the \"WingL+R",
"# (double blade)\" spec - both airfoil plates sat at +Y and spar/rib/tip details",
"# were +Y-only (the s-loop collapsed to s*0.0 / (1 if s>0 else 1)). Rebuilt as an",
"# explicit per-side loop; spar half-extent 0.9 -> 0.6 keeps the spar under the",
"# blade (tip 1.10 < blade tip 1.18) so the silhouette span stays the approved 2.36",
"# (mirrored spar at 0.9 would stick 0.27 past the blade and blow the RAD gate).",
"for s in (-1, 1):",
"    plate(bm, (0.10, s * 0.06, 0.10), (0.10, s * 1.18, 0.14),",
"          (-0.16, s * 0.06, 0.10), (-0.16, s * 1.18, 0.16), 14, 9, t=0.013)",
"    plate(bm, (0.10, s * 0.06, -0.10), (0.10, s * 1.18, -0.14),",
"          (-0.16, s * 0.06, -0.10), (-0.16, s * 1.18, -0.16), 14, 9, t=0.013)",
"    for i in range(3):",
"        box(bm, -0.03, s * (0.30 + i * 0.30), 0.0, 0.13, 0.05, 0.05)",
"    for i in range(8):",
"        box(bm, -0.02 + (i % 2) * 0.05, s * (0.20 + i * 0.12), 0.125, 0.09, 0.02, 0.018)",
"    box(bm, 0.115, s * 0.55, 0.0, 0.03, 0.6, 0.02)",
"    box(bm, -0.16, s * 1.19, 0.13, 0.05, 0.04, 0.03)",
"    box(bm, -0.16, s * 1.19, -0.13, 0.05, 0.04, 0.03)",
"    box(bm, 0.10, s * 1.19, 0.12, 0.04, 0.035, 0.025)",
"    box(bm, 0.10, s * 1.19, -0.12, 0.04, 0.035, 0.025)"
].join("\n");
let out = t.slice(0, bm) + nl + t.slice(eEnd);
const budgetOld = '"VR_Wasp_Wing": (1180, 1380)';
const budgetNew = '"VR_Wasp_Wing": (2200, 2500)';
if (out.indexOf(budgetOld) < 0) throw new Error("budget marker not found");
out = out.replace(budgetOld, budgetNew);
fs.writeFileSync(p, out);
const v = fs.readFileSync(p, "utf8");
console.log("OK: region replaced. BOM count:", (v.match(/\uFEFF/g) || []).length, "size:", v.length);