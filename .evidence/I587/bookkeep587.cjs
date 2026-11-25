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
}// ---------- stories.md (tail-LF, BOM 5): ST-554 line append ----------
{
  const p = "production/stories.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n") || s0.endsWith("\r\n")) throw new Error("stories: expected trailing bare LF");
  const line = "ST-554 E83 THE SWAP (I587) - DONE I587: assets/ship.glb <- ship v8 (1,402,896 B / 64,884 t build-space / 62,254 t post-GLB-import [GLTF export dedupe -2,630; the renderer draws the GLB indices]) with the v7 (740,012 B / 32,499 t) backed up to .evidence/I587/ship_v7_backup.glb FIRST - asset set re-measured WITH MEASUREMENT: 34 GLB 4,672,268 B / 120,732 t (the pre-registered cap 4,771,840 B / 123,550 t over-estimated the growth; the REAL measured values are under it - the measured values are what AGENTS now carries) - AGENTS.md updated (asset line + cap 4,563 KiB + ship v8 62,254 t post-import line + playframe pins + dist chain -> 7,093,058 B / 203) - dist 6,430,174 -> 7,093,058 B / 203 (delta +662,884 = exactly v8-v7 GLB delta; code delta 0; under hard ~7,190,162 / tripwire 7,297,600 / ceiling 7,400,000) - playframe A/B re-pinned WITH MEASUREMENT (probe .evidence/I587/playframe_probe587.cjs -> A L 22/62,472 [P 11/180 unchanged], B 52/132,682 [hv=0/gv=0]; delta +29,755 = 62,254-32,499, B = 2x that; rock frustum +3,900 (I554) + non-ship 2,137 t unchanged) - re-pins applied to .evidence/I491/playframe491.mjs + .evidence/I483/playframe483.mjs (unique-anchor cjs; notes document the GLTF-dedupe learning) - CLOSEGATE587 5/5 EXACT (causal495 PASS dist :4200 / causal483 PASS score 11334 dev / playframe483 PASS new pins / playframe491 PASS new pins console A 0/0 B 0/0 / pwa491 SUMMARY 11/11 dist :5199) - quality bar 6/6 (tests 1,237/1,237 / build 0 / dist re-measured 7,093,058 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene)\n";
  assertAscii(line, "stories ST-554");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("stories BOM delta");
  write(p, s1);
  console.log("stories.md OK");
}

// ---------- iterations.md (tail-LF, BOM 5): I587 entry append (no blank line before the header) ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I587 (ST-554, E83): THE SWAP - ship v8 \"Rigid Airship Warship\" is now the live player ship + playframe A/B re-pins WITH MEASUREMENT + CLOSEGATE587 5/5 EXACT\n\n"
    + "- Pre-state: local == origin 2c53325 (I586, push-verified). v8 artifact .evidence/I586/ship_v8.glb (1,402,896 B) + P1 gate PASS already landed I586.\n"
    + "- Change: assets/ship.glb = v8 (740,012 B -> 1,402,896 B; +662,884 B, code delta 0). v7 backed up to .evidence/I587/ship_v7_backup.glb (740,012 B) FIRST. Tracked harness files re-pinned: .evidence/I491/playframe491.mjs + .evidence/I483/playframe483.mjs (+ .evidence/I491/playframe483.json). AGENTS.md: asset line 4,672,268 B / 120,732 t + cap 4,563 KiB + ship v8 62,254 t post-import line; playframe pin A 22/62,472 + 11/180, B 52/132,682 (I554 history kept); dist chain appended -> 7,093,058 B / 203.\n"
    + "- Measurements (.evidence/I587/measure587.cjs, house parser .evidence/I547/glb_tris.cjs): ship v8 in-game = 62,254 t post-GLB-import (64,884 build-space; GLTF export dedupe -2,630 - the renderer draws the GLB indices, so the playframe delta uses 62,254 not 64,884). Asset set = 34 GLB 4,672,268 B / 120,732 t (pre-registered cap 4,771,840 B / 123,550 t over-estimated; the REAL measured values are used and are under cap).\n"
    + "- Playframe probe (.evidence/I587/playframe_probe587.cjs -> playframe_probe587.out, dev :5173): A L = 22/62,472 (P 11/180 unchanged) and B = 52/132,682 (hv=0/gv=0) - both EXACTLY as predicted (delta +29,755 = 62,254-32,499; B = 2x that = +59,510). Re-pins via unique-anchor cjs (repin587.cjs -> 491, anchor \"A: L exact 22/32717 (I541\"; repin483.cjs -> 483, the I542 anchor variant - first attempt failed on the wrong anchor). Notes in both files: non-ship 218/2,137 t unchanged, rock frustum 3,900 t (I554) unchanged, GLTF-dedupe learning, probe reference.\n"
    + "- CLOSEGATE587 HARNESS PASS - 5/5 EXACT (.evidence/I587/run_closegate587.cjs, clone of the I584 runner; .out files saved): causal495 PASS (dist :4200, NO re-pin) / causal483 PASS score 11334 (dev :5173, NO re-pin) / playframe483 PASS (new pins) / playframe491 PASS (new pins, console A 0/0 B 0/0) / pwa491 SUMMARY 11/11 (dist :5199, NO re-pin). Servers self-started + self-killed; all 4 ports free after.\n"
    + "- dist: 6,430,174 -> 7,093,058 B / 203 files (delta +662,884 = exactly the v8-v7 GLB delta; under the pre-registered hard ~7,190,162 B / tripwire 7,297,600 B / ceiling 7,400,000 B). Vendor 4/4 EXACT at build (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017, r187).\n"
    + "- Quality bar 6/6 (render changed -> the 5-harness browser runs ARE the smoke: console clean + camFinite verified in the gate, per the I541 ship-swap precedent): npm test 1,237/1,237; npm run build exit 0; dist re-measured 7,093,058 B / 203; vendor 4/4 EXACT; BOM delta 0 (AGENTS 1 / epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7); hygiene (all 4 ports 5173/4173/4200/5199 free; zero browser tabs; zero terminals left running).\n"
    + "- Next I588 (ST-555) = G83.0 CLOSE + CLOSE FLOOR E83 WITH MEASUREMENT (7,400,000 - fresh dist re-measure; expect 306,942 B if 7,093,058 holds; headroom >= 102,400 B floor -> cut ladder NOT invoked expected) + AGENTS item-4 CLOSE FLOOR E83 clause (E82 demoted to prior, .evidence/I584/ag584.cjs pattern) + epics E83 header/Status -> CLOSED + bookkeeping + push delegate Dewey 01a20760-b402-74a2-b164-e13208b85f07.\n";
  assertAscii(entry, "iterations I587");
  const s1 = s0 + entry;
  if (bomCount(s1) !== b0) throw new Error("iterations BOM delta");
  write(p, s1);
  console.log("iterations.md OK");
}// ---------- timeline.md (LF, BOM 3, trailing \n): I587 line append ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I587 (ST-554, E83) done: the new airship is now the game's player ship. It is bigger and heavier than the old one (1.4 MB, 62,254 triangles once the game loads it), so the bundle grew to 7,093,058 bytes - still under the 7.4 MB limit with 306,942 bytes of room to spare. Every automated check passed, including the five rendering, sound and offline-play harnesses, so the ship flies exactly as before; only the model changed. The old ship is kept as a backup in case a rollback is ever needed.\n";
  assertAscii(line, "timeline I587");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("timeline BOM delta");
  write(p, s1);
  console.log("timeline.md OK");
}

// ---------- CHANGELOG.md (LF, NO trailing NL, BOM 7): I587 line above the I586 line ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "- I586: ";
  assertOnce(s0, a, "changelog I586 line");
  const entry = "- I587: The player ship is now the detailed rigid airship: a long riveted envelope with ribbing, a pointed bow, a tall tail fin, four engine nacelles under the wing and a navy command dome. The model grew from 32,499 to 62,254 triangles (bundle 7,093,058 bytes, under the 7.4 MB limit with 306,942 bytes of room). All checks passed; nothing else changed.\n";
  assertAscii(entry, "changelog I587");
  const s1 = s0.replace(a, entry + a);
  if (bomCount(s1) !== b0) throw new Error("changelog BOM delta");
  write(p, s1);
  console.log("CHANGELOG.md OK");
}

// ---------- active.md (CRLF, BOM 0, trailing \r\n): NEXT-at-I588 line append ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I588 = ST-555 (E83): G83.0 CLOSE + CLOSE FLOOR E83 WITH MEASUREMENT (7,400,000 - fresh dist re-measure; expect 306,942 B if 7,093,058 holds; headroom >= 102,400 B floor -> cut ladder NOT invoked expected; follow the .evidence/I584/ag584.cjs pattern for the AGENTS item-4 clause, E82 demoted to prior) + epics E83 header -> CLOSED + Status CLOSED + bookkeeping (epics/stories/iterations/timeline/active/CHANGELOG) + commit + push delegate Dewey 01a20760-b402-74a2-b164-e13208b85f07 (rotation: Arendt I586, Russell I587).\r\n";
  assertAscii(line, "active NEXT I588");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("active BOM delta");
  write(p, s1);
  console.log("active.md OK");
}

console.log("BOOKKEEP587 DONE");