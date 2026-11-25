// I586 bookkeeper (E83 ST-553 done: ship v8 BUILT + P1 gate PASS, evidence-only net-zero):
// epics ST-553 PENDING->DONE + Status line refresh, stories ST-553 append, iterations I586 append,
// timeline I586 line append, CHANGELOG insert above the I585 line, active NEXT-at-I587 append.
// Byte-safe: unique-anchor assert + BOM-count assert per file (delta 0). ASCII-only content.
const fs = require("fs");
function read(p) { return fs.readFileSync(p, "utf8"); }
function bomCount(s) { let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++; return n; }
function assertOnce(s, anchor, label) { const i = s.indexOf(anchor); if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label); if (s.indexOf(anchor, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label); }
function replaceOnce(s, anchor, repl, label) { assertOnce(s, anchor, label); return s.replace(anchor, repl); }
function assertAscii(s, label) { for (let i = 0; i < s.length; i++) { if (s.charCodeAt(i) > 126) throw new Error("NON-ASCII in " + label + " at " + i); } }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

// ---------- epics.md (CRLF, BOM 3): ST-553 PENDING->DONE + E83 Status line refresh ----------
{
  const p = "production/epics.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("epics: expected trailing CRLF");
  let s1 = replaceOnce(s0,
    "ST-553 PENDING I586 (v8 build + QA + export to .evidence/I586/ ONLY)",
    "ST-553 DONE I586 (v8 BUILT 64,884 tris / GLB 1,402,896 B + P1 gate PASS; export to .evidence/I586/ ONLY)",
    "epics ST-553 line");
  const statusOld = "- Status: OPEN (opened I585). Pre-state local == origin 7eabf24 (I584, E82 CLOSED accept round, push-verified). Next owner: I586 (ST-553) = the v8 Blender build (.evidence/I586/build_ship_v8.py cloned from the .evidence/I540/build_ship_v7.py pattern; EEVEE audit 960x540 dark world 3 suns, 4 views x (clay+tint) + front/rear sil96; P1 gate: must read as a RIGID AIRSHIP at 96 px, esp. rear [chase cam] + side).";
  const statusNew = "- Status: OPEN (opened I585; ST-553 DONE I586). v8 BUILT + P1 gate PASS I586 (evidence-only, net-zero src): 64,884 tris (all 6 nodes in [AIM,CAP]; TOTAL under the 65,000 hard; the TOTAL > 60,000 AIM is warn-only + deterministic, no drift), GLB 1,402,896 B (2,896 B over the 1,400,000 target = WARN documented, under the 1,500,000 hard; expected cost of a 64k-tri hero), pinned windows all pass, v7 contract intact (6 nodes / 3 materials / COLOR_0 on Hull+Wings / export flags / axis). P1 gate verdict + method in .evidence/I586/p1gate586.md (10 audit PNGs viewed). Pre-state local == origin 0fc211c (I585, push-verified). Next owner: I587 (ST-554) = THE SWAP (assets/ship.glb <- v8, v7 backed up to .evidence/I587/ship_v7_backup.glb FIRST, asset-cap renegotiation WITH MEASUREMENT, playframe A/B re-pin WITH MEASUREMENT, 5-harness gate).";
  s1 = replaceOnce(s1, statusOld, statusNew, "epics E83 Status line");
  if (bomCount(s1) !== b0) throw new Error("epics BOM delta");
  assertAscii(statusNew, "epics E83 statusNew");
  write(p, s1);
  console.log("epics.md OK");
}
