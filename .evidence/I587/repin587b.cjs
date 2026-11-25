// I587 asset-test re-pins WITH MEASUREMENT (ship v8 swap): assetGlbs + assetPerf + iterations addendum.
// Byte-safe: unique-anchor assert + BOM-count assert per file (delta 0). ASCII-only content.
const fs = require("fs");
function read(p) { return fs.readFileSync(p, "utf8"); }
function bomCount(s) { let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++; return n; }
function assertOnce(s, anchor, label) { const i = s.indexOf(anchor); if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label); if (s.indexOf(anchor, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label); }
function replaceOnce(s, anchor, repl, label) { assertOnce(s, anchor, label); return s.replace(anchor, repl); }
function assertAscii(s, label) { for (let i = 0; i < s.length; i++) { if (s.charCodeAt(i) > 126) throw new Error("NON-ASCII in " + label + " at " + i); } }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

// ---------- tests/assetGlbs.test.js (CRLF, BOM 8, no trailing NL) ----------
{
  const p = "tests/assetGlbs.test.js";
  const s0 = read(p);
  const b0 = bomCount(s0);
  let s1 = s0;
  s1 = replaceOnce(s1, "const BUDGETS = { ship: 32499,", "const BUDGETS = { ship: 62254,", "glbs BUDGETS.ship");
  s1 = replaceOnce(s1, "phantom/bulwark 2336/2700, pinned tight to measurement) + I517 (ST-483 E69 hauler 3506, pinned tight to measurement)\r\n", "phantom/bulwark 2336/2700, pinned tight to measurement) + I517 (ST-483 E69 hauler 3506, pinned tight to measurement) + I587 (ST-554 E83 ship v8 swap) ship 32499 -> 62254 (measured 62,254 t post-GLB-import / 1,402,896 B; build-space 64,884 t, GLTF export dedupe -2,630; span 4.0125 / len 2.7160 hold the I454 windows; .evidence/I587/repin_measure587b.mjs)\r\n", "glbs BUDGETS tail comment");
  s1 = replaceOnce(s1, "const MAX_FILE_BYTES = 1048576;", "const MAX_FILE_BYTES = 1500000; // I587 (ST-554 E83 ship v8 swap) EXPLICIT re-pin WITH MEASUREMENT: 1,048,576 -> 1,500,000 (ship v8 1,402,896 B; scope-check-E83 pre-registered 1,400,000 B target / 1,500,000 B hard; max non-ship stays boss 75.26 KB)", "glbs MAX_FILE_BYTES");
  s1 = replaceOnce(s1, "assert.ok(buf.length < MAX_FILE_BYTES, 'ship.glb under 100 KB');", "assert.ok(buf.length < MAX_FILE_BYTES, 'ship.glb under the 1,500,000 B cap (I587)');", "glbs ship assert msg");
  s1 = replaceOnce(s1, "const SHIP_FACET = { hull: { p10: 0.4603, p50: 0.8009, p90: 1.3020 }, wings: { p10: 0.3891, p50: 0.9271, p90: 1.5464 } };", "const SHIP_FACET = { hull: { p10: 0.4305, p50: 0.7753, p90: 1.1998 }, wings: { p10: 0.3898, p50: 0.8562, p90: 1.5392 } }; // I587 (ST-554 E83 ship v8 swap) EXPLICIT re-pin WITH MEASUREMENT: I541 hull {0.4603/0.8009/1.3020} + wings {0.3891/0.9271/1.5464} -> measured on the 62,254-tri GLB (.evidence/I587/repin_measure587b.mjs; hull spread 0.7693 / wings spread 1.1494; k_hull 0.60 / k_wings 0.80, L = (-0.45,-0.55,0.70).normalized(), domain [0.30,1.55])", "glbs SHIP_FACET");
  if (bomCount(s1) !== b0) throw new Error("glbs BOM delta");
  write(p, s1);
  console.log("assetGlbs.test.js OK");
}

// ---------- tests/assetPerf.test.js (LF, BOM 0, trailing LF) ----------
{
  const p = "tests/assetPerf.test.js";
  const s0 = read(p);
  const b0 = bomCount(s0);
  let s1 = s0;
  s1 = replaceOnce(s1,
    "totalFilesKB: 3940,  // [I561 (ST-527 E76 D5) RE-PIN WITH MEASUREMENT 3900 -> 3940: +38,600 B 3-ship enemy remaster (724,156 -> 762,756 B); measured 3,915.41 KB (4,009,384 B); headroom 24.59 KB; prior I554: 3,877.72 KB (3,970,784 B)]",
    "totalFilesKB: 4563,  // [I587 (ST-554 E83 ship v8 swap) RE-PIN WITH MEASUREMENT 3940 -> 4563: +662,884 B ship v8 (740,012 -> 1,402,896 B); measured 4,562.76 KB (4,672,268 B); cap = the AGENTS contract 4,563 KiB (4,672,268 B) so the measured IS the cap (headroom 244 B); prior I561: 3,915.41 KB (4,009,384 B)]",
    "perf totalFilesKB");
  s1 = replaceOnce(s1,
    "  totalGeoKB: 3870,    // [I561 (ST-527 E76 D5) RE-PIN WITH MEASUREMENT 3830 -> 3870: +40,752 B remaster geometry (3,899,694 -> 3,940,446 B); measured 3,848.09 KB; headroom 21.91 KB; prior I554: 3,808.29 KB (3,899,694 B)]",
    "  totalGeoKB: 4500,    // [I587 (ST-554 E83 ship v8 swap) RE-PIN WITH MEASUREMENT 3870 -> 4500: +662,874 B ship v8 geometry (3,940,446 -> 4,603,320 B); measured 4,495.43 KB; headroom 4.57 KB; prior I561: 3,848.09 KB (3,940,446 B)]",
    "perf totalGeoKB");
  s1 = replaceOnce(s1,
    "  perFileKB: 760,      // [I541 re-pin WITH MEASUREMENT 600 -> 760 (ST-507 ship v7); max = ship.glb 722.67 KB (740,012 B); max enemy = wasp 302.77 KB (310,036 B)]",
    "  perFileKB: 1400,      // [I587 (ST-554 E83 ship v8 swap) RE-PIN WITH MEASUREMENT 760 -> 1400: max = ship.glb 1,370.02 KB (1,402,896 B); headroom 29.98 KB; max non-ship stays wasp 302.77 KB (310,036 B); prior I541: 760 (ship v7 722.67 KB)]",
    "perf perFileKB");
  s1 = replaceOnce(s1,
    "  totalTris: 91050,    // [I561 (ST-527 E76 D5) RE-PIN WITH MEASUREMENT 90,800 -> 91,050: +240 t remaster (9,974 -> 10,214 t across phantom/sweeper/hauler); measured 90,977 t; headroom 73 t; prior I554: 90,737 t]",
    "  totalTris: 120732,    // [I587 (ST-554 E83 ship v8 swap) RE-PIN WITH MEASUREMENT 91,050 -> 120,732: +29,755 t ship v8 (32,499 -> 62,254 t post-GLB-import); measured 120,732 t; cap = the AGENTS contract 120,732 t (the measured IS the cap); prior I561: 90,977 t]",
    "perf totalTris");
  if (bomCount(s1) !== b0) throw new Error("perf BOM delta");
  write(p, s1);
  console.log("assetPerf.test.js OK");
}

// ---------- iterations.md (tail-LF, BOM 5): I587 addendum bullet (the re-pins were discovered at the quality bar) ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const line = "- Asset test re-pins WITH MEASUREMENT (quality-bar catch, same commit): tests/assetGlbs.test.js [ship 32499 -> 62254 t + BUDGETS tail note; MAX_FILE_BYTES 1,048,576 -> 1,500,000 (scope-check pre-registered hard; ship v8 1,402,896 B); SHIP_FACET hull {0.4305/0.7753/1.1998} + wings {0.3898/0.8562/1.5392} (spreads 0.7693/1.1494, both >= 0.35); ship assert message] + tests/assetPerf.test.js [totalFilesKB 3940 -> 4563 (cap = AGENTS contract 4,563 KiB); totalGeoKB 3870 -> 4500 (measured 4,495.43 KB / 4,603,320 B); perFileKB 760 -> 1400 (ship 1,370.02 KB); totalTris 91050 -> 120732 (cap = AGENTS contract)]. Probe: .evidence/I587/repin_measure587b.mjs. span 4.0125 / len 2.7160 hold the I454 windows WITHOUT re-pin; 34-file count + COLOR_0 roster + perFileMats 5 unchanged.\n";
  assertAscii(line, "iterations I587 addendum");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("iterations BOM delta");
  write(p, s1);
  console.log("iterations.md addendum OK");
}

console.log("REPIN587B DONE");