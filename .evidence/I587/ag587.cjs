// I587 (ST-554): AGENTS.md WITH MEASUREMENT updates for the ship v8 swap.
const fs = require("fs");
const p = "AGENTS.md";
const s0 = fs.readFileSync(p, "utf8");
function bomCount(s) { let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++; return n; }
const b0 = bomCount(s0);
function assertOnce(s, a, label) { const i = s.indexOf(a); if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label); if (s.indexOf(a, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label); }
function rep(s, a, b, label) { assertOnce(s, a, label); return s.replace(a, b); }
function assertAscii(s, label) { for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 126) throw new Error("NON-ASCII in " + label); }

let s = s0;
// 1) asset totals + ship v7 -> v8
const a1 = '34 Blender-made GLBs in assets/ (~3,915 KB (4,009,384 B) / 90,977 tris (I561/ST-527 E76 D5 measurement), cap 3,940 KB / 91,050 t): ship v7 "warship airship" 32,499 tris (I541/ST-507 swap; v6 25,563 tris superseded),';
const n1 = '34 Blender-made GLBs in assets/ (4,672,268 B / 120,732 tris (I587/ST-554 E83 swap WITH MEASUREMENT; prior I561/ST-527: 4,009,384 B / 90,977 t), cap 4,563 KiB (4,672,268 B) / 120,732 t): ship v8 "rigid airship warship" 62,254 tris (I587/ST-554 swap; v7 32,499 tris superseded, backed up at .evidence/I587/ship_v7_backup.glb; build-space 64,884 t, GLTF export dedupe -2,630),';
assertAscii(n1, "n1"); s = rep(s, a1, n1, "agents asset line");
// 2) playframe pin
const a2 = "(A 22/32,717 + 11/180, B 52/73,172 - re-pinned WITH MEASUREMENT at I554 for the rock v12 displacement remaster: 69,272 -> 73,172 = +3,900 (the 2 in-frustum B-window pool rocks at reseed 71201: L 3,000->6,000 + M 900->1,800; rocks drawn once per B frame, the 3 other L frustum-culled in both old and new; 52 calls unchanged; A window unchanged at 22/32,717 - MENU draws no rocks)";
const n2 = "(A 22/62,472 + 11/180, B 52/132,682 - re-pinned WITH MEASUREMENT at I587 for the ship v8 swap: A 32,717 -> 62,472 = +29,755 (non-ship 218 + ship 32,499 -> 62,254 GLB post-import; GLTF dedupe -2,630 vs build-space 64,884), B 73,172 -> 132,682 = +59,510 = 2 x 29,755 (fx=high 2-pass; 52 calls unchanged); prior I554 re-pin for the rock v12 displacement remaster: 69,272 -> 73,172 = +3,900 (the 2 in-frustum B-window pool rocks at reseed 71201: L 3,000->6,000 + M 900->1,800; rocks drawn once per B frame, the 3 other L frustum-culled in both old and new; 52 calls unchanged)";
assertAscii(n2, "n2"); s = rep(s, a2, n2, "agents playframe pin");
// 3) dist chain entry after the I565 entry
const a3 = "boss.ringEvery lever [2.0->2.5, esbuild minifies 2.0->2 / 2.5->2.5], 203)";
const n3 = "boss.ringEvery lever [2.0->2.5, esbuild minifies 2.0->2 / 2.5->2.5], 203) -> 7,093,058 (I587, +662,884: ship v8 swap [1,402,896 - 740,012], 203 files)";
assertAscii(n3, "n3"); s = rep(s, a3, n3, "agents dist chain");
if (bomCount(s) !== b0) throw new Error("AGENTS BOM delta");
fs.writeFileSync(p, s, "utf8");
console.log("AGENTS.md OK");
