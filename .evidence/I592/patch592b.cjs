// patch592b.cjs - I592 v2b rework patcher (frozen spec, one rework round per ship)
// Reads build_{stinger,flyer}_v2.py (LF, no BOM), applies exact-string replacements
// with count===1 assertions, writes build_{stinger,flyer}_v2b.py (LF, no BOM).
const fs = require("fs");
const path = require("path");
const DIR = "E:/Game/.evidence/I592";

function readL(p) {
  const b = fs.readFileSync(p);
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) throw new Error("BOM in " + p);
  const t = b.toString("utf8");
  if (t.indexOf("\r") !== -1) throw new Error("CRLF in " + p);
  return t;
}
function writeL(p, t) {
  if (t.indexOf("\r") !== -1) throw new Error("CRLF out " + p);
  fs.writeFileSync(p, Buffer.from(t, "utf8"));
}
function rep(t, old, nw, tag) {
  const n = t.split(old).length - 1;
  if (n !== 1) throw new Error("ANCHOR " + tag + " count=" + n);
  return t.split(old).join(nw);
}

const EMBED = readL(path.join(DIR, "embed592b_snippet.py"));
if (EMBED.indexOf("def embed_pass(ob):") !== 0 && EMBED.indexOf("def embed_pass(ob):") === -1) throw new Error("EMBED snippet missing embed_pass");

// ---------------- STINGER ----------------
let s = readL(path.join(DIR, "build_stinger_v2.py"));
s = rep(s,
  "#       with every greeble straddling the surface.",
  "#       with every greeble straddling the surface.\n# v2b (I592 rework): Fix B embed_pass - rigidly settle floating greeble islands into the host hull (post-bevel, pre-bake). See p1gate592.md.",
  "S-HEADER");
s = rep(s, "def main():", EMBED + "\ndef main():", "S-MAIN");
s = rep(s, "    fbh = bake(body, K_BODY)", "    embed_pass(body)\n    fbh = bake(body, K_BODY)", "S-BAKE-BODY");
s = rep(s, "    fbc = bake(core, 0.0, flat=K_CORE)", "    embed_pass(core)\n    fbc = bake(core, 0.0, flat=K_CORE)", "S-BAKE-CORE");
writeL(path.join(DIR, "build_stinger_v2b.py"), s);

// ---------------- FLYER ----------------
let f = readL(path.join(DIR, "build_flyer_v2.py"));
f = rep(f,
  "# Re-work budget: 1 rework per ship max (post-audit-gate change only).",
  "# Re-work budget: 1 rework per ship max (post-audit-gate change only).\n# v2b (I592 rework): Fix A - the -Y blade is a 180deg ROTATION of the +Y blade (pinwheel); greeble coords rotated to sit ON the -Y slab (first build Y-mirrored them: 5 greebles floated). Fix B embed_pass same as stinger.",
  "F-HEADER");
f = rep(f, "def main():", EMBED + "\ndef main():", "F-MAIN");
f = rep(f, "    fbh = bake(body, K_BODY)", "    embed_pass(body)\n    fbh = bake(body, K_BODY)", "F-BAKE-BODY");
const F_OLD = "        else:\n            slab_xy(bm, [(-0.22, -0.655), (0.37, -0.975), (0.37, -1.03), (-0.22, -0.71)], 0.06, 0.19)\n            slab_xy(bm, [(0.424, -0.960), (0.739, -0.9825), (0.731, -1.0475), (0.416, -1.025)], 0.06, 0.19)\n        # tip pod (straddles the blade slab near the tip; hy 0.035 keeps y <= 1.045)\n        box(bm, 1.02, s * 1.01, ZC, 0.05, 0.035, 0.075)\n        # mid panel (inside the blade, straddles the slab)\n        box(bm, 0.15, s * 0.55, ZC, 0.18, 0.10, 0.075)\n        # root fairing (straddles the root edge)\n        box(bm, -0.35, s * 0.17, ZC, 0.15, 0.05, 0.075)\n        # trailing-edge pylon (straddles the blade lower edge at x 0.55)\n        box(bm, 0.55, s * 0.62, ZC, 0.06, 0.05, 0.075)";
const F_NEW = "        else:\n            # FIX A (I592 rework): the -Y blade is a 180deg ROTATION of the +Y\n            # blade (pinwheel), not a Y-mirror: greeble coords rotated 180deg\n            # so they sit ON the -Y blade slab (first build Y-mirrored them;\n            # 5 greebles floated in space, gaps 0.066-0.805)\n            slab_xy(bm, [(0.22, -0.655), (-0.37, -0.975), (-0.37, -1.03), (0.22, -0.71)], 0.06, 0.19)\n            slab_xy(bm, [(-0.424, -0.960), (-0.739, -0.9825), (-0.731, -1.0475), (-0.416, -1.025)], 0.06, 0.19)\n        # tip pod (180deg-rotated for s<0: straddles the -Y blade near the tip)\n        if s > 0:\n            box(bm, 1.02, 1.01, ZC, 0.05, 0.035, 0.075)\n        else:\n            box(bm, -1.02, -1.01, ZC, 0.05, 0.035, 0.075)\n        # mid panel (180deg-rotated for s<0, straddles the slab)\n        if s > 0:\n            box(bm, 0.15, 0.55, ZC, 0.18, 0.10, 0.075)\n        else:\n            box(bm, -0.15, -0.55, ZC, 0.18, 0.10, 0.075)\n        # root fairing (180deg-rotated for s<0: straddles the -Y root edge)\n        if s > 0:\n            box(bm, -0.35, 0.17, ZC, 0.15, 0.05, 0.075)\n        else:\n            box(bm, 0.35, -0.17, ZC, 0.15, 0.05, 0.075)\n        # trailing-edge pylon (180deg-rotated for s<0, on the -Y blade edge)\n        if s > 0:\n            box(bm, 0.55, 0.62, ZC, 0.06, 0.05, 0.075)\n        else:\n            box(bm, -0.55, -0.62, ZC, 0.06, 0.05, 0.075)";
f = rep(f, F_OLD, F_NEW, "F-GREEBLE");
writeL(path.join(DIR, "build_flyer_v2b.py"), f);

// ---------------- report ----------------
for (const nm of ["build_stinger_v2b.py", "build_flyer_v2b.py"]) {
  const t = readL(path.join(DIR, nm));
  const cnt = (re) => (t.match(re) || []).length;
  console.log(nm + " " + Buffer.byteLength(t) + "B lines=" + t.split("\n").length +
    " embed_def=" + cnt(/def embed_pass\(/g) +
    " embed_calls=" + cnt(/    embed_pass\(/g) +
    " v2b_marks=" + cnt(/v2b/g) +
    " def_main=" + cnt(/def main\(\):/g));
}
console.log("PATCH592B DONE");