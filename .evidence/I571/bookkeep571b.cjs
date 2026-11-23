// I571 bookkeeping part 2 - stories (LF region) + active + timeline (LF tail) + CHANGELOG (LF tail)
const fs = require("fs");
const BOM = "\uFEFF";
function bomCount(s) { let n = 0; for (const ch of s) if (ch === BOM) n++; return n; }

{
  const p = "production/stories.md";
  const before = fs.readFileSync(p, "utf8");
  const b0 = bomCount(before);
  let s = before;
  function replaceLineRegex(re, newLine, label) {
    const m = s.match(re);
    if (!m || m.length !== 1) throw new Error("line regex not unique (" + (m ? m.length : 0) + "): " + label);
    s = s.replace(re, newLine);
  }
  replaceLineRegex(/- ST-537 E79 L-A boss retirement implement[^\n]*/,
    "- ST-537 E79 L-A boss retirement implement + sweep571 WITH MEASUREMENT (I571) - DONE I571 (C1 executed): L-A implemented per the frozen I569 spec (config.js boss block retireAfterWaves: 3, endless-only; game.js wave-start hook in the L255 block BEFORE spawnBossForWave L259; bossRetire() = emit('bossRetire', {pos, kind}) + this.boss = null with NO split/NO score/NO RNG draws; main.js 'bossRetire' FX handler reusing the shockwave pool + fizzle particles + an existing SFX_CUES cue; +6 unit tests in tests/bossRetire.test.js: endless retires wave 8 / campaign unaffected / zero RNG draws / no split + no score on retire) - tests 1,237 -> 1,243 GREEN; build clean; dist 6,430,690 B (+516 B, below the pre-registered est +2-6 KB) - sweep571 (30 FRESH seeds 57100+i, rules571.md FROZEN PRE-RUN, frozen I328 kiter verbatim, full director, cap 36000 ticks, wall ms 12,447): 30/30 died, median death wave 10, death-wave dist wave5 x9 / wave8 x2 / wave9 x3 / wave10 x13 / wave12 x1 / wave13 x1 / wave14 x1, tally (primary == strict) SPLICER 8 / MONOLITH 6 / gunship 4 / rock_S 4 / bullet_unknown 4 / rock_L 1 / wasp 1 / sentry 1 / phantom 1, H = 14/30 = 0.467 - acceptance (frozen I569): (a) median >= 10 PASS (exactly at floor) / (b) wave-10 cluster <= 7/30 FAIL (13/30) / (c) max single source < 0.300 PASS (SPLICER 8/30 = 0.267) / (d) >= 2/30 wave >= 13 PASS (57123 wave 14, 57124 wave 13) / (e) moot (C1) - C1 EXECUTED: full L-A revert (git restore src/core/config.js src/core/game.js src/main.js + Remove-Item tests/bossRetire.test.js); post-revert verified tests 1,237/1,237 + dist 6,430,174 B / 203 byte-identical + vendor 4/4 EXACT + git status clean - L-B trigger read (frozen): wave-8/9 band (gunship+rock_L+rock_M) = 3/30 < 4/30 -> NO TRIGGER -> ST-538 VOID, no second pass - RETIRES telemetry: none (the kiter kills the wave-5 Monolith in 21/21 runs that reach wave 8 - death ticks ~5,000-7,200, waves 5-7 - so the 3-wave retirement window (fires wave 8) never triggers on this tree; sweep569 cross-check: 0/23 Monoliths alive at wave-8 start) - registrations (E80+ backlog WITH the full measurement record): the wave-10 cluster (13/30: SPLICER 8 / rock_S 2 / gunship 2 / bullet_unknown 1) is the Splicer's OWN wave-10 fight (unreachable by a wave-13 retirement) + frozen E70 lever [2] (splicer.maxHp 30 -> 24) REINFORCED (SPLICER = largest single source in sweep569 14/30 AND sweep571 8/30) + seed-variance span 0.40-0.67 (sweep565/567/569/571) + L-A mechanism shown INERT on the current tree (registered, not re-attempted in E79) - quality bar 6/6 (net docs/.evidence-only: tests 1,237/1,237 / build 0 / dist byte-identical 6,430,174 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene [sweep in-process, zero servers/tabs])",
    "ST-537 line");
  replaceLineRegex(/- ST-538 E79 L-B gunship hp conditional lever[^\n]*/,
    "- ST-538 E79 L-B gunship hp conditional lever (I572) - VOID I571: the FROZEN TRIGGER evaluated on the sweep571 results (I571): wave-8/9 band (gunship+rock_L+rock_M) deaths = 3/30 < 4/30 (median = 10 < 11 also holds) -> NO TRIGGER -> story VOID, no code change, trigger measurement recorded (E78-lever pattern), no second pass either way; the gunship hp 10 -> 8 candidate stays frozen/registered for a future epic",
    "ST-538 line");
  replaceLineRegex(/- ST-539 E79 G79.0 close gate[^\n]*/,
    "- ST-539 E79 G79.0 close gate (I572) - PENDING: 5 fresh harnesses EXACT (runner clone .evidence/I568/run_closegate568.cjs -> .evidence/I572/run_closegate572.cjs, label CLOSEGATE572, self-kill servers, port-free verified per step) + dist re-measured + CLOSE FLOOR E79 = 7,400,000 - dist WITH MEASUREMENT (headroom >= 102,400 B floor -> cut ladder NOT expected) + AGENTS.md item-4 chain refresh (CLOSE FLOOR E79 line, E78 line demoted to prior per house pattern; dist chain unchanged - I571 net-zero after C1) + epics E79 CLOSED (accept round, E78 pattern: C1 executed I571 + ST-538 VOID I571) + residual registration (post-E79 live wall = the Splicer's own wave-10 fight, 13/30 in sweep571; frozen lever [2] (splicer.maxHp 30 -> 24) the recorded E70-protocol candidate; L-A retirement shown inert on the current tree) + bookkeeping + quality bar 6/6 + push delegate",
    "ST-539 line");
  if (bomCount(s) !== b0) throw new Error("stories BOM drift");
  fs.writeFileSync(p, s, "utf8");
  console.log("stories.md updated OK (BOM " + b0 + ")");
}

{
  const p = "production/session-state/active.md";
  const before = fs.readFileSync(p, "utf8");
  const b0 = bomCount(before);
  const anchor = "; C1 = full revert + accept + E80+ residual with the full measurement record";
  if (before.split(anchor).length - 1 !== 1) throw new Error("active anchor not unique");
  const s = before.replace(anchor, anchor + " [DONE at I571: L-A implemented per the frozen spec (config retireAfterWaves 3 endless-only + wave-start hook BEFORE spawnBossForWave + bossRetire() emit+null no split/score/RNG + main.js FX reusing the shockwave pool + existing SFX cue + 6 unit tests; tests 1,243 GREEN; dist 6,430,690 B = +516 B) + sweep571 measured (30 FRESH seeds 57100+i, kiter verbatim, cap 36000, wall ms 12,447): 30/30 died, median 10, death-wave dist wave5 x9 / wave8 x2 / wave9 x3 / wave10 x13 / wave12 x1 / wave13 x1 / wave14 x1, tally (primary == strict) SPLICER 8 / MONOLITH 6 / gunship 4 / rock_S 4 / bullet_unknown 4 / rock_L 1 / wasp 1 / sentry 1 / phantom 1, H = 14/30 = 0.467; acceptance (a) PASS (10, at floor) / (b) FAIL (wave-10 cluster 13/30 > 7/30) / (c) PASS (SPLICER 0.267) / (d) PASS (57123 w14, 57124 w13) / (e) moot -> C1 EXECUTED (full L-A revert: git restore config.js+game.js+main.js + remove bossRetire.test.js; post-revert tests 1,237/1,237, dist 6,430,174 B / 203 byte-identical, vendor 4/4 EXACT, git clean) + ST-538 VOID (L-B trigger wave-8/9 band 3/30 < 4/30) + RETIRES telemetry NONE (kiter kills the wave-5 Monolith in 21/21 runs that reach wave 8 - the wave-8 retirement window never fires on this tree; sweep569 cross-check 0/23 alive at wave-8 start) + registrations (E80+ WITH the full measurement record): wave-10 cluster 13/30 = the Splicer's OWN wave-10 fight (unreachable by a wave-13 retirement) + frozen lever [2] (splicer.maxHp 30 -> 24) REINFORCED (SPLICER largest single source in sweep569 14/30 AND sweep571 8/30) + seed-variance span 0.40-0.67 across sweep565/567/569/571 + L-A mechanism shown INERT (not re-attempted in E79)] - NEXT at I572 = ST-539 G79.0 close gate (accept round, E78 pattern): runner clone run_closegate568.cjs -> run_closegate572.cjs label CLOSEGATE572, 5 fresh harnesses ALL EXACT NO re-pin (net-zero src vs I570), dist re-measure, CLOSE FLOOR E79 = 7,400,000 - dist WITH MEASUREMENT, AGENTS.md item-4 refresh, E79 CLOSED, push delegate");
  if (bomCount(s) !== b0) throw new Error("active BOM drift");
  fs.writeFileSync(p, s, "utf8");
  console.log("active.md updated OK (BOM " + b0 + ")");
}

{
  const p = "production/timeline.md";
  const before = fs.readFileSync(p, "utf8");
  const b0 = bomCount(before);
  const line = "I571 (ST-537, E79) done: we built and tested the \"boss leaves the arena three waves after it appears\" fairness fix, but the measurement showed our test pilots kill the wave-5 boss before the fix could ever trigger - and the wave-10 wall it targeted turned out to be the wave-10 boss's own fight, which a retirement rule can't reach. Per our frozen rules we reverted the fix, kept the full measurement record for a future round, and marked the conditional gunship fix void (its trigger wasn't met). No gameplay or bundle changes in the end - test records and design notes only; the bundle is unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  if (!before.endsWith("\n")) throw new Error("timeline does not end with LF");
  const after = before + line;
  if (bomCount(after) !== b0) throw new Error("timeline BOM drift");
  fs.writeFileSync(p, after, "utf8");
  console.log("timeline.md appended OK (BOM " + b0 + ")");
}

{
  const p = "CHANGELOG.md";
  const before = fs.readFileSync(p, "utf8");
  const b0 = bomCount(before);
  const anchor = "- I561: Three enemy ship types (the phantom interceptor, the sweeper and the mine-hauler) now have fully remodeled hulls with more plating and mechanical detail - same shapes, much nicer looks. Nothing else changed.\n";
  if (before.split(anchor).length - 1 !== 1) throw new Error("CHANGELOG anchor not unique");
  const newLine = "- I571: No visible change - we built and tested the \"boss leaves early\" fairness fix, but our measurement showed our test pilots kill the wave-5 boss before the fix could ever trigger, and the wave-10 wall it targeted turned out to be the wave-10 boss's own fight. Per our frozen rules we reverted the fix and filed the full measurement for a future round; the conditional gunship fix didn't meet its trigger, so it's void. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const after = before.replace(anchor, anchor + newLine);
  if (bomCount(after) !== b0) throw new Error("CHANGELOG BOM drift");
  fs.writeFileSync(p, after, "utf8");
  console.log("CHANGELOG.md updated OK (BOM " + b0 + ")");
}
console.log("BOOKKEEP571B OK");
