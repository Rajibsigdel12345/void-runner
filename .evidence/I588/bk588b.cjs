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
