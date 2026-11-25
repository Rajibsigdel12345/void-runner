// I587 bookkeeper (E83 ST-554 done: THE SWAP - ship v8 live in assets/ + playframe A/B re-pins + gate 5/5):
// epics ST-554 PENDING->DONE + E83 Status line refresh, stories ST-554 append, iterations I587 append,
// timeline I587 line append, CHANGELOG insert above the I586 line, active NEXT-at-I588 append.
// Byte-safe: unique-anchor assert + BOM-count assert per file (delta 0). ASCII-only content.
const fs = require("fs");
function read(p) { return fs.readFileSync(p, "utf8"); }
function bomCount(s) { let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++; return n; }
function assertOnce(s, anchor, label) { const i = s.indexOf(anchor); if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label); if (s.indexOf(anchor, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label); }
function replaceOnce(s, anchor, repl, label) { assertOnce(s, anchor, label); return s.replace(anchor, repl); }
function assertAscii(s, label) { for (let i = 0; i < s.length; i++) { if (s.charCodeAt(i) > 126) throw new Error("NON-ASCII in " + label + " at " + i); } }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

// ---------- epics.md (CRLF, BOM 3): ST-554 PENDING->DONE + E83 Status line refresh ----------
{
  const p = "production/epics.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("epics: expected trailing CRLF");
  let s1 = replaceOnce(s0,
    "ST-554 PENDING I587 (THE SWAP: assets/ship.glb = v8 + v7 backup -> .evidence/I587/ + AGENTS asset-cap renegotiation WITH MEASUREMENT + playframe A/B re-pin WITH MEASUREMENT + 5-harness gate)",
    "ST-554 DONE I587 (THE SWAP: ship v8 live in assets/ [1,402,896 B / 62,254 t post-import; v7 backup .evidence/I587/ship_v7_backup.glb] + asset set re-measured 4,672,268 B / 120,732 t + playframe A/B re-pinned 22/62,472 + 52/132,682 + CLOSEGATE587 5/5 EXACT)",
    "epics ST-554 line");
  const statusOld = "- Status: OPEN (opened I585; ST-553 DONE I586). v8 BUILT + P1 gate PASS I586 (evidence-only, net-zero src): 64,884 tris (all 6 nodes in [AIM,CAP]; TOTAL under the 65,000 hard; the TOTAL > 60,000 AIM is warn-only + deterministic, no drift), GLB 1,402,896 B (2,896 B over the 1,400,000 target = WARN documented, under the 1,500,000 hard; expected cost of a 64k-tri hero), pinned windows all pass, v7 contract intact (6 nodes / 3 materials / COLOR_0 on Hull+Wings / export flags / axis). P1 gate verdict + method in .evidence/I586/p1gate586.md (10 audit PNGs viewed). Pre-state local == origin 0fc211c (I585, push-verified). Next owner: I587 (ST-554) = THE SWAP (assets/ship.glb <- v8, v7 backed up to .evidence/I587/ship_v7_backup.glb FIRST, asset-cap renegotiation WITH MEASUREMENT, playframe A/B re-pin WITH MEASUREMENT, 5-harness gate).";
  const statusNew = "- Status: OPEN (opened I585; ST-553 DONE I586; ST-554 DONE I587). THE SWAP landed I587: ship v8 is the live player ship (assets/ship.glb 1,402,896 B / 62,254 t post-GLB-import [64,884 build-space; GLTF export dedupe -2,630; the renderer draws the GLB indices]; v7 740,012 B backup at .evidence/I587/ship_v7_backup.glb until G83.0+). Asset set re-measured WITH MEASUREMENT: 34 GLB 4,672,268 B / 120,732 t (the pre-registered cap 4,771,840 B / 123,550 t over-estimated; the REAL measured values are used and are under it). Playframe A/B re-pinned WITH MEASUREMENT (A 22/62,472 + P 11/180; B 52/132,682; delta +29,755 = 62,254-32,499, B = 2x). dist 6,430,174 -> 7,093,058 B / 203 (under hard ~7,190,162 / tripwire 7,297,600 / ceiling 7,400,000). CLOSEGATE587 5/5 EXACT (causal495/483 + playframe483/491 + pwa491 11/11). Pre-state local == origin 2c53325 (I586, push-verified). Next owner: I588 (ST-555) = G83.0 CLOSE + CLOSE FLOOR E83 WITH MEASUREMENT (7,400,000 - fresh dist re-measure; expect ~306,942 B; headroom >= 102,400 B floor -> cut ladder NOT invoked expected) + E83 CLOSED.";
  s1 = replaceOnce(s1, statusOld, statusNew, "epics E83 Status line");
  if (bomCount(s1) !== b0) throw new Error("epics BOM delta");
  assertAscii(statusNew, "epics E83 statusNew");
  write(p, s1);
  console.log("epics.md OK");
}