// I584 bookkeeper (accept-round close): epics E82 header/ST-551/Status refresh,
// stories ST-551 line append, iterations I584 entry append, timeline I584 line append,
// CHANGELOG insert above the I583 line, active NEXT-at-I585 line append.
// Byte-safe: unique-anchor assert + BOM-count assert per file (delta 0). ASCII-only content.
const fs = require("fs");
function read(p) { return fs.readFileSync(p, "utf8"); }
function bomCount(s) { let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++; return n; }
function assertOnce(s, anchor, label) { const i = s.indexOf(anchor); if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label); if (s.indexOf(anchor, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }
// CRLF line-based replace: exactly one line starts with `prefix`; replace the whole line.
function replaceLineCRLF(s, prefix, newLine, label) {
  const parts = s.split("\r\n");
  let hits = 0, idx = -1;
  for (let i = 0; i < parts.length; i++) { if (parts[i].startsWith(prefix)) { hits++; idx = i; } }
  if (hits !== 1) throw new Error(label + ": expected exactly 1 line with prefix, found " + hits);
  parts[idx] = newLine;
  return parts.join("\r\n");
}

// ---------- epics.md (CRLF, BOM 3): E82 header CLOSED + ST-551 DONE + Status refresh ----------
{
  const p = "production/epics.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("epics: expected trailing CRLF");
  let s1 = s0;
  s1 = replaceLineCRLF(s1, "## E82 - Wave-5 Monolith Wall II (frozen E82 lever",
    "## E82 - Wave-5 Monolith Wall II (frozen E82 lever: boss.burst.every 4.0 -> 4.8, carried from E81) - CLOSED I584 (accept round, C1: lever tested + reverted, wall PARTIALLY BROKEN, P1/P2/P3 to E83+; 4/4 stories: ST-548 I581 / ST-549 I582 / ST-550 VOID I583 / ST-551 I584)",
    "epics E82 header");
  const a1 = "ST-551 PENDING I584 (G82.0 close gate: clone of the .evidence/I580 runner pattern).";
  assertOnce(s1, a1, "epics ST-551 PENDING");
  s1 = s1.replace(a1, "ST-551 DONE I584 (G82.0 close gate: CLOSEGATE584 5/5 EXACT no re-pin [causal495 / causal483 / playframe483 / playframe491 / pwa491; servers self-killed, all 4 ports free after] + dist 6,430,174 B / 203 byte-identical (re-measured) + CLOSE FLOOR E82 = 969,826 B WITH MEASUREMENT [7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked] + AGENTS item-4 refresh [E82 clause, E81 demoted to prior]; zero src).");
  s1 = replaceLineCRLF(s1, "- Status: OPEN (opened I581;",
    "- Status: CLOSED I584 (accept round, C1: the frozen lever boss.burst.every 4.0 -> 4.8 was APPLIED at I583 then REVERTED by git restore [sweep582 acceptance (a) PASS 9/30, (b) FAIL 9/30, (c) PASS 9, (d) FAIL 1/30 -> C1 per the frozen rules]; wall PARTIALLY BROKEN: B56 12/30 -> 9/30, median death wave 8 -> 9, postKillResidual 4 -> 1, residual = MIX of burst-class 5 + aimed-class 4 [aimed share rose - new signal]; 4/4 stories: ST-548 DONE I581 / ST-549 DONE I582 / ST-550 VOID I583 / ST-551 DONE I584 [G82.0 close gate: CLOSEGATE584 5/5 EXACT no re-pin + dist 6,430,174 B / 203 byte-identical + CLOSE FLOOR E82 = 969,826 B WITH MEASUREMENT + AGENTS item-4 refresh]; P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 registered to E83+). Pre-state local == origin 68f9e47 (I583, push-verified). E82 CLOSED I584 (accept round). Next owner: I585 (E83 open - cgs-scope-check FIRST: wave-5 wall continuation P1/P2/P3 vs user-queue pivot).",
    "epics E82 Status");
  if (bomCount(s1) !== b0) throw new Error("epics BOM delta");
  write(p, s1);
  console.log("epics.md OK");
}

// ---------- stories.md (tail-LF, BOM 5): ST-551 line append ----------
{
  const p = "production/stories.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n") || s0.endsWith("\r\n")) throw new Error("stories: expected trailing bare LF");
  const line = "ST-551 E82 G82.0 close gate (I584) - DONE I584: CLOSEGATE584 (clone of the .evidence/I580 runner pattern) 5/5 EXACT NO re-pin [causal495 CAUSAL495 PASS (dist :4200) / causal483 CAUSAL456 PASS score 11334 (dev :5173) / playframe483 PLAYFRAME456 PASS A L 22/32717 P 11/180 (dev :5173) / playframe491 PLAYFRAME456 PASS A L 22/32717 P 11/180 (dev :5173) / pwa491 SUMMARY 11/11 (dist :5199); servers self-started + self-killed, all 4 ports free after] + dist 6,430,174 B / 203 byte-identical (re-measured) + CLOSE FLOOR E82 = 969,826 B WITH MEASUREMENT [7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked] + AGENTS.md item-4 refresh [E82 CLOSE FLOOR clause inserted, E81 demoted to prior; 11,660 -> 12,070 B, BOM 1] + E82 CLOSED (accept round, C1) - net-zero src CONFIRMED (git diff EMPTY vs 68f9e47; docs + .evidence only) - quality bar 6/6 (net-zero: tests 1,237/1,237 / build 0 / dist byte-identical 6,430,174 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene [zero servers/tabs])\n";
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("stories BOM delta");
  write(p, s1);
  console.log("stories.md OK");
}
// ---------- iterations.md (tail-LF, BOM 5): I584 entry append ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I584 (ST-551, E82): G82.0 close gate (accept round) - CLOSEGATE584 5/5 EXACT no re-pin + dist byte-identical 6,430,174 B / 203 + CLOSE FLOOR E82 = 969,826 B WITH MEASUREMENT + AGENTS item-4 refresh + E82 CLOSED\n\n"
    + "- Pre-state: local == origin 68f9e47 (I583, E82 OPEN / ST-550 VOID, push-verified). Tree clean apart from the new untracked .evidence/I584/ (plus the AGENTS.md item-4 refresh made in this round).\n"
    + "- Change: net-zero src (I583 = the lever apply-then-revert round; I584 is the accept-round close gate). Files: .evidence/I584/ [run_closegate584.cjs (3,434 B; 4-anchor clone of .evidence/I580/run_closegate580.cjs, each anchor asserted count===1) + clone584.cjs (the clone script) + ag584.cjs (AGENTS item-4 patch) + causal495.out / causal483.out / playframe483.out / playframe491.out / pwa491.out + bookkeep584.cjs + commit-msg-I584.txt] + AGENTS.md item-4 (CLOSE FLOOR E82 clause inserted after the measured-size chain, E81 demoted to prior; 11,660 -> 12,070 B, BOM 1) + the 6 bookkeeping files updated here.\n"
    + "- G82.0 gate (CLOSEGATE584, .evidence/I584/run_closegate584.cjs; 5 fresh harnesses, servers self-started + self-killed, 2.5 s port-free check each): causal495 (dist :4200) CAUSAL495 PASS / causal483 (dev :5173) CAUSAL456 PASS score 11334 / playframe483 (dev :5173) PLAYFRAME456 PASS A L 22/32717 + P 11/180 / playframe491 (dev :5173) PLAYFRAME456 PASS A L 22/32717 + P 11/180 / pwa491 (dist :5199) SUMMARY 11/11. ALL 5 marker=FOUND, port_free=true, exit=0 -> CLOSEGATE584 HARNESS PASS. NO re-pin (net-zero src since I572's shipped tree; the I583 lever was applied then reverted -> byte-identical dist).\n"
    + "- dist re-measure: 6,430,174 B / 203 files byte-identical (re-measured this round, before the quality-bar build).\n"
    + "- CLOSE FLOOR E82 = 7,400,000 - 6,430,174 = 969,826 B WITH MEASUREMENT (headroom >= 102,400 B floor -> cut ladder NOT invoked).\n"
    + "- E82 CLOSED (accept round, C1): the frozen lever boss.burst.every 4.0 -> 4.8 was tested (I583) and reverted per the frozen acceptance failure [(a) PASS 9/30, (b) FAIL 9/30, (c) PASS 9, (d) FAIL 1/30]; the wall is PARTIALLY BROKEN (B56 12/30 -> 9/30, median death wave 8 -> 9, postKillResidual 4 -> 1, residual = MIX of burst-class 5 + aimed-class 4). P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 registered to E83+ (ONE chosen by E83's own frozen rules after a fresh pre-lever sweep).\n"
    + "- Quality bar 6/6: npm test 1,237/1,237; npm run build 0; dist re-measured 6,430,174 B / 203 byte-identical; vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (AGENTS 1 / epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7); hygiene (all 4 ports 5173/4173/4200/5199 free; zero browser tabs; zero terminals left running). No browser smoke (no render change; headless default).\n"
    + "- Next I585 (E83 open): cgs-scope-check FIRST per the frozen E70 protocol - the wave-5 Monolith wall remains THE live wall, PARTIALLY BROKEN after C1 (sweep582: B56 9/30; residual mix burst-class 5 / aimed-class 4; aimed share rose - new signal); candidate levers P1/P2/P3 (ONE chosen by E83's own frozen rules after a fresh pre-lever sweep); user-queue items (1) Blender airship remaster [more detail/poly, real airship, reference samples] / (2) WebGPU visuals / (3) camera far-framing fix + first-person cockpit view [dashboard visible, replace crosshair; cockpit WASD relative to ship facing] / (4) new enemies [YouTube MCP: metadata OK, transcript fetch BROKEN - do NOT retry] / (5) linear levels + bosses [campaign exists: 4 levels incl. E69 Necro Reef, checkpoints] / (6) Monolith wave-clear pacing. Scope-check decides which item E83 takes; balance-arc continuation is the in-flight thread.\n";
  const s1 = s0 + entry;
  if (bomCount(s1) !== b0) throw new Error("iterations BOM delta");
  write(p, s1);
  console.log("iterations.md OK");
}

// ---------- timeline.md (LF, BOM 3, trailing \n): I584 line append ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I584 (ST-551, E82) done: the round's final check passed - all five automated play tests came back exactly as they were before the round started, so nothing needed re-pinning; the wave-5 boss round is now closed as a no-change accept. The burst-cadence trim was tried and measured last round, helped but missed the frozen bars, and stays out of the game; the three follow-up tweaks are registered for a future round. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("timeline BOM delta");
  write(p, s1);
  console.log("timeline.md OK");
}

// ---------- CHANGELOG.md (LF, NO trailing NL, BOM 7): I584 line above the I583 line ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "- I583: ";
  assertOnce(s0, a, "changelog I583 line");
  const entry = "- I584: No visible change - the round's final check passed: all five automated play tests came back exactly as they were before the round started, and the wave-5 boss round is closed as a no-change accept - the trim was tried and measured, helped but missed the frozen bars, and stays out of the game; the three follow-up candidates are registered for a future round. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s1 = s0.replace(a, entry + a);
  if (bomCount(s1) !== b0) throw new Error("changelog BOM delta");
  write(p, s1);
  console.log("CHANGELOG.md OK");
}

// ---------- active.md (CRLF, BOM 0, trailing \r\n): NEXT-at-I585 line append ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I585 = E83 open (cgs-scope-check FIRST per the frozen E70 protocol): the wave-5 Monolith wall remains THE live wall, PARTIALLY BROKEN after C1 (sweep582: B56 9/30; residual mix burst-class 5 / aimed-class 4; aimed share rose - new signal); candidate levers P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 (ONE chosen by E83's own frozen rules after a fresh pre-lever sweep); user-queue order: (1) main-character airship remaster via Blender [more detail/poly, real airship, reference samples] / (2) WebGPU visuals / (3) camera far-framing fix + first-person cockpit view [dashboard visible, replace crosshair; cockpit WASD relative to ship facing] / (4) new enemies [YouTube MCP: metadata OK, transcript fetch BROKEN - do NOT retry] / (5) linear levels + bosses [campaign exists: 4 levels incl. E69 Necro Reef, checkpoints] / (6) Monolith wave-clear pacing [user: after wave 8/9 blue rocks, clearance feels like waiting forever - shorten/fill the transition]. Scope-check decides which item E83 takes; balance-arc continuation is the in-flight thread.\r\n";
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("active BOM delta");
  write(p, s1);
  console.log("active.md OK");
}

console.log("BOOKKEEP584 DONE");