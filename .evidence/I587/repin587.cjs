// I587 (ST-554): re-pin BOTH playframe harnesses WITH MEASUREMENT for the ship v8 swap.
// Measured (playframe_probe587.out, dev :5173, post-swap): A L=22/62472 (P 11/180 unchanged), B calls/tris=52/132682 (hv=0/gv=0).
const fs = require("fs");
function assertOnce(s, a, label) { const i = s.indexOf(a); if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label); if (s.indexOf(a, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label); }
function rep(s, a, b, label) { assertOnce(s, a, label); return s.replace(a, b); }
const noteA = "A: L exact 22/62472 (I587 (ST-554, E83) EXPLICIT re-pin WITH MEASUREMENT: 22/32717 -> 22/62472, delta +29,755 = ship 32,499 -> 62,254 exactly (fx=off single scene pass: non-ship 218 tris unchanged; v8 GLB post-import 62,254 t vs build-space 64,884 t - GLTF export dedupe -2,630, the in-game renderer draws the GLB indices; I587 probe playframe_probe587.out measured L=22/62472 exactly, P 11/180 unchanged). I541";
const noteB = "B: 52/132682 (I587 (ST-554, E83) RE-PIN WITH MEASUREMENT: 52/73172 -> 52/132682, delta +59,510 = 2 x 29,755 (fx=high two-pass: single-pass scene 34,636 -> 64,391, +29,755 ship 32,499->62,254 only, non-ship 2,137 + rock frustum 3,900 unchanged at reseed 71201; hv=0/gv=0; 52 calls unchanged; I587 probe measured calls/tris=52/132682 exactly). I554";
for (const p of [".evidence/I491/playframe491.mjs", ".evidence/I483/playframe483.mjs"]) {
  const s0 = fs.readFileSync(p, "utf8");
  let s = s0;
  s = rep(s, "A: L exact 22/32717 (I541", noteA, p + " A label");
  s = rep(s, "RA.L.tris === 32717", "RA.L.tris === 62472", p + " A tris");
  s = rep(s, "B: 52/73172 (I554", noteB, p + " B label");
  s = rep(s, "RB.tris === 73172", "RB.tris === 132682", p + " B tris");
  fs.writeFileSync(p, s, "utf8");
  console.log("re-pinned " + p);
}
console.log("REPIN587 DONE");
