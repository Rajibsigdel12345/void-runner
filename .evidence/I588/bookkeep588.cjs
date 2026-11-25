// I588 bookkeeper (E83 ST-555 done: G83.0 CLOSE + CLOSE FLOOR E83 WITH MEASUREMENT - E83 CLOSED 4/4):
// epics E83 header -> CLOSED + ST-555 PENDING->DONE + Status line -> CLOSED, stories ST-555 append,
// iterations I588 append, timeline I588 line append, CHANGELOG insert above the I587 line, active NEXT-at-I589 append.
// Byte-safe: unique-anchor assert + BOM-count assert per file (delta 0). ASCII-only content.
const fs = require("fs");
function read(p) { return fs.readFileSync(p, "utf8"); }
function bomCount(s) { let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++; return n; }
function assertOnce(s, anchor, label) { const i = s.indexOf(anchor); if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label); if (s.indexOf(anchor, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label); }
function replaceOnce(s, anchor, repl, label) { assertOnce(s, anchor, label); return s.replace(anchor, repl); }
function assertAscii(s, label) { for (let i = 0; i < s.length; i++) { if (s.charCodeAt(i) > 126) throw new Error("NON-ASCII in " + label + " at " + i); } }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

// ---------- epics.md (CRLF, BOM 3): E83 header CLOSED + ST-555 line + Status line ----------
{
  const p = "production/epics.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("epics: expected trailing CRLF");
  let s1 = replaceOnce(s0, "GLB target <= 1,400,000 B / hard 1,500,000 B) - OPEN I585", "GLB target <= 1,400,000 B / hard 1,500,000 B) - CLOSED I588 (G83.0)", "epics E83 header");
  s1 = replaceOnce(s1, "ST-555 PENDING I588 (G83.0 close gate, .evidence/I584 runner clone)", "ST-555 DONE I588 (G83.0 close: CLOSEGATE588 5/5 EXACT + CLOSE FLOOR E83 WITH MEASUREMENT 306,942 B + E83 CLOSED 4/4)", "epics ST-555 line");
  const h = s1.indexOf("## E83 ");
  const h2 = s1.indexOf("## E82 ");
  if (h === -1 || h2 === -1 || h2 < h) throw new Error("epics: E83/E82 section bounds");
  const sl = "- Status: OPEN (opened I585";
  const i = s1.indexOf(sl, h);
  const j = s1.indexOf("\r\n", i);
  if (i === -1 || j === -1 || i < h || i >= h2 || j >= h2) throw new Error("epics: E83 Status line not in section");
  const oldLine = s1.slice(i, j);
  const newLine = "- Status: CLOSED (opened I585; ST-552 DONE I585; ST-553 DONE I586; ST-554 DONE I587; ST-555 DONE I588; E83 CLOSED 4/4 at G83.0). Ship v8 \"Rigid Airship Warship\" is the live player ship (assets/ship.glb 1,402,896 B / 62,254 t post-GLB-import [64,884 build-space; GLTF export dedupe -2,630; the renderer draws the GLB indices]; v7 740,012 B backup at .evidence/I587/ship_v7_backup.glb). Asset set 34 GLB 4,672,268 B / 120,732 t (cap 4,563 KiB / 4,672,268 B). Playframe A 22/62,472 + 11/180, B 52/132,682. CLOSEGATE588 5/5 EXACT (causal495/483 + playframe483/491 + pwa491 11/11; net-zero src; dist byte-identical 7,093,058 B / 203). CLOSE FLOOR E83 = 306,942 B WITH MEASUREMENT (7,400,000 - 7,093,058; headroom >= 102,400 B floor -> cut ladder NOT invoked). P1/P2/P3 balance levers stay registered for E84+. Next owner: I589 (E84 open, cgs-scope-check FIRST) from the user queue (head: cockpit first-person view + camera far-framing fix; then WebGPU visuals / better enemy models / more linear levels + end bosses / Monolith wave-pacing).";
  assertAscii(newLine, "epics E83 statusNew");
  s1 = replaceOnce(s1, oldLine, newLine, "epics E83 Status line");
  if (bomCount(s1) !== b0) throw new Error("epics BOM delta");
  write(p, s1);
  console.log("epics.md OK");
}

// ---------- stories.md (tail-LF, BOM 5): ST-555 line append ----------
{
  const p = "production/stories.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n") || s0.endsWith("\r\n")) throw new Error("stories: expected trailing bare LF");
  const line = "ST-555 E83 G83.0 close (I588) - DONE I588: CLOSEGATE588 5/5 EXACT NO re-pin (causal495 PASS dist :4200 / causal483 PASS score 11334 dev :5173 / playframe483 PASS A L 22/62,472 + 11/180 dev :5173 / playframe491 PASS A L 22/62,472 + 11/180, B 52/132,682 dev :5173 / pwa491 SUMMARY 11/11 dist :5199; servers self-started + self-killed, all 4 ports free after) + fresh dist re-measure 7,093,058 B / 203 byte-identical to I587 (net-zero src: docs + .evidence only) + CLOSE FLOOR E83 = 7,400,000 - 7,093,058 = 306,942 B WITH MEASUREMENT (headroom >= 102,400 B floor -> cut ladder NOT invoked) + AGENTS.md item-4 CLOSE FLOOR E83 clause (E82 demoted to prior) + epics E83 header -> CLOSED I588 (G83.0) + ST-555 DONE + Status CLOSED (E83 CLOSED 4/4) + quality bar 6/6 (tests 1,237/1,237 / build 0 / dist re-measured 7,093,058 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene)\n";
  assertAscii(line, "stories ST-555");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("stories BOM delta");
  write(p, s1);
  console.log("stories.md OK");
}
// ---------- iterations.md (tail-LF, BOM 5): I588 entry append ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I588 (ST-555, E83): G83.0 CLOSE + CLOSE FLOOR E83 WITH MEASUREMENT - E83 CLOSED 4/4 (docs + .evidence only, net-zero src)\n\n"
    + "- Pre-state: local == origin 4818970 (I587, push-verified).\n"
    + "- Change: docs + .evidence only (net-zero src; no assets/ or src/ change). AGENTS.md item-4: CLOSE FLOOR E83 clause inserted, E82 demoted to prior (.evidence/I588/ag588.cjs, ag587 pattern). epics.md E83: header -> CLOSED I588 (G83.0), ST-555 PENDING->DONE, Status line -> CLOSED (E83 CLOSED 4/4).\n"
    + "- CLOSEGATE588 HARNESS PASS - 5/5 EXACT NO re-pin (.evidence/I588/run_closegate588.cjs, clone of the I584 runner; .out files saved): causal495 PASS (dist :4200, NO re-pin) / causal483 PASS score 11334 (dev :5173, NO re-pin) / playframe483 PASS (A 22/62,472 + 11/180, pins from I587) / playframe491 PASS (A 22/62,472 + 11/180, B 52/132,682, pins from I587) / pwa491 SUMMARY 11/11 (dist :5199, NO re-pin). Servers self-started + self-killed; all 4 ports free after.\n"
    + "- dist: 7,093,058 B / 203 files re-measured fresh (.evidence/I588/measure588.cjs) - byte-identical to I587 (net-zero src). CLOSE FLOOR E83 = 7,400,000 - 7,093,058 = 306,942 B WITH MEASUREMENT; headroom >= 102,400 B floor -> cut ladder NOT invoked.\n"
    + "- Quality bar 6/6 (net-zero): npm test 1,237/1,237; npm run build exit 0; dist re-measured 7,093,058 B / 203; vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017, r187); BOM delta 0 (AGENTS 1 / epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7); hygiene (all 4 ports 5173/4173/4200/5199 free; zero browser tabs; zero terminals left running).\n"
    + "- Next I589 (E84 open: cgs-scope-check FIRST) from the user queue - head item: cockpit first-person view (show part of the ship in-frame, replace the crosshair line, cockpit-specific controls distinct from chase) + camera far-framing fix (at long range the player cannot see all the way back); queue behind: WebGPU visuals, better enemy models, more linear levels + end bosses, Monolith wave-pacing (wave 8/9 transition). Push delegate Dewey 01a20760-b402-74a2-b164-e13208b85f07 (rotation: Arendt I586, Russell I587, Dewey I588).\n";
  assertAscii(entry, "iterations I588");
  const s1 = s0 + entry;
  if (bomCount(s1) !== b0) throw new Error("iterations BOM delta");
  write(p, s1);
  console.log("iterations.md OK");
}

// ---------- timeline.md (LF, BOM 3, trailing \n): I588 line append ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I588 (ST-555, E83) done: no visible change - the airship work is officially complete. We re-ran all five automated harnesses (rendering, sound and offline play) on the finished build and everything passed exactly as before, so the ship you fly is confirmed final. The size headroom was re-measured at 306,942 bytes below the 7.4 MB limit.\n";
  assertAscii(line, "timeline I588");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("timeline BOM delta");
  write(p, s1);
  console.log("timeline.md OK");
}

// ---------- CHANGELOG.md (LF, NO trailing NL, BOM 7): I588 line above the I587 line ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "- I587: ";
  assertOnce(s0, a, "changelog I587 line");
  const entry = "- I588: No visible change - the airship update is officially complete. We re-ran every automated check (rendering, sound and offline play) on the finished build, all passed, and the size headroom was re-measured: 306,942 bytes below the 7.4 MB limit. Nothing else changed.\n";
  assertAscii(entry, "changelog I588");
  const s1 = s0.replace(a, entry + a);
  if (bomCount(s1) !== b0) throw new Error("changelog BOM delta");
  write(p, s1);
  console.log("CHANGELOG.md OK");
}

// ---------- active.md (CRLF, BOM 0, trailing \r\n): NEXT-at-I589 line append ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I589 = E84 OPEN (cgs-scope-check FIRST, docs-only open) from the user queue (rotation: Arendt I586, Russell I587, Dewey I588): head item = cockpit first-person view (show part of the ship in-frame, replace the crosshair line, cockpit-specific controls distinct from chase) + camera far-framing fix (at long range the player cannot see all the way back); queue behind: WebGPU visuals, better enemy models, more linear levels + end bosses, Monolith wave-pacing (wave 8/9 transition \"waiting forever\"); scope-check frozen before any src change; P1/P2/P3 balance levers stay registered for E84+ if the queue leaves room.\r\n";
  assertAscii(line, "active NEXT I589");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("active BOM delta");
  write(p, s1);
  console.log("active.md OK");
}

console.log("BOOKKEEP588 DONE");
