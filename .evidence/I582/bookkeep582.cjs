// I582 bookkeeper: epics E82 ST-549 PENDING -> DONE I582 + ST-550 PENDING (APPLY confirmed) + Status refresh,
// stories ST-549 line append, iterations I582 entry append, timeline I582 line append,
// CHANGELOG insert between the I581 and I576 lines, active NEXT-at-I583 line append.
// Byte-safe: unique-anchor assert + BOM-count assert per file (delta 0). ASCII-only content.
const fs = require("fs");

function read(p) { return fs.readFileSync(p, "utf8"); }
function bomCount(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++;
  return n;
}
function assertOnce(s, anchor, label) {
  const i = s.indexOf(anchor);
  if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label);
  if (s.indexOf(anchor, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label);
}

// ---------- epics.md (CRLF, BOM 3): ST-549 DONE I582, ST-550 APPLY-confirmed, Status refresh ----------
{
  const p = "production/epics.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("epics: expected trailing CRLF");

  const a1 = "ST-549 PENDING I582 (sweep581 pre-lever re-audit: 30 FRESH seeds 58100+i; rules581.md FROZEN PRE-RUN in .evidence/I582/; the frozen gap-free adjudication B/A*/G/C)";
  assertOnce(s0, a1, "epics ST-549 PENDING");
  const r1 = "ST-549 DONE I582 (sweep581 pre-lever re-audit: 30 FRESH seeds 58100+i; rules581.md FROZEN PRE-RUN in .evidence/I582/; MEASURED 30/30 died, median death wave 8, death-wave dist wave5 x12 / wave8 x4 / wave9 x1 / wave10 x7 / wave11 x4 / wave12 x1 / wave14 x1, tally (primary) SPLICER 7 / MONOLITH 11 / gunship 4 / wasp 1 / bullet_unknown 2 / rock_L 1 / sentry 1 / rock_M 2 / rock_S 1, H = 18/30 = 0.600; ADJUDICATION INPUTS: B56 12/30 | M56 11/30 | M56' 12/30 -> BRANCH B FIRED (B56 12 >= 12) -> the FROZEN E82 lever boss.burst.every 4.0 -> 4.8 APPLIES at I583 (ST-550); band span now 10/7/9/12/11/12 across six samples - STABLE, R-2 seed variance; zero src)";

  const a2 = "ST-550 PENDING I583 (CONDITIONAL: lever one line + sweep582 [30 fresh seeds 58200+i] + acceptance (a)-(e); OR VOID on Branch G or C; C1 on acceptance failure)";
  assertOnce(s0, a2, "epics ST-550 PENDING");
  const r2 = "ST-550 PENDING I583 (APPLY confirmed by Branch B at I582 [B56 12/30 >= 12/30]: lever one line [config.js:300 every: 4.0 -> 4.8] + sweep582 [30 fresh seeds 58200+i] + acceptance (a)-(e); C1 on acceptance failure)";

  const a3 = "- Status: OPEN (opened I581; ST-548 DONE I581 - open + research + scope-check, docs-only zero src; the lever + the frozen lever-selection rule + the gap-free adjudication + the acceptance are FROZEN at open). Pre-state local == origin bc9a6dd (I580, E81 CLOSED, push-verified). dist policy EXPECTED byte-identical 6,430,174 B / 203. Next owner: I582 (ST-549) sweep581 pre-lever re-audit.";
  assertOnce(s0, a3, "epics E82 Status line");
  const r3 = "- Status: OPEN (opened I581; ST-548 DONE I581 - open + research + scope-check, docs-only zero src; ST-549 DONE I582 - sweep581: BRANCH B FIRED [B56 12/30 >= 12/30] -> the FROZEN E82 lever boss.burst.every 4.0 -> 4.8 APPLIES at I583 (ST-550), zero src). Pre-state local == origin d1f5a50 (I581, push-verified). dist policy EXPECTED byte-identical 6,430,174 B / 203 (I582 zero src). Next owner: I583 (ST-550) lever apply + sweep582 + acceptance (a)-(e).";

  let s = s0;
  s = s.replace(a1, r1);
  s = s.replace(a2, r2);
  s = s.replace(a3, r3);
  if (bomCount(s) !== b0) throw new Error("epics BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("epics OK, bytes " + fs.statSync(p).size);
}

// ---------- stories.md (tail-LF, BOM 5): append the ST-549 line ----------
{
  const p = "production/stories.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("stories: expected trailing LF");
  const line = "- ST-549 E82 sweep581 pre-lever re-audit (I582) - DONE I582: 30 FRESH seeds 58100+i, full director from wave 1, frozen I328 kiter verbatim, cap 36000 ticks @ 1/60, in-process (wall 14,625 ms), zero servers/tabs; rules581.md FROZEN PRE-RUN in .evidence/I582/ (5,262 B; lineage of .evidence/I578/rules577.md, E82 labels; sec.3 = the FROZEN GAP-FREE E82 B/A*/G/C adjudication verbatim from design/e82-monolith-wave5-wall-ii-research.md sec.6; metrics B56 = deaths on wave in {5,6} any attribution [baseline 11/30, sweep577] / M56' [REFINED] = deaths on wave in {5,6} AND (clsPrimary == MONOLITH OR (clsPrimary == bullet_unknown AND a monolithDeath tick within 180 ticks before the player death)) [sweep577: M56' 11/30 vs the E81 M56 7/30; R-6 comparability]) - MEASURED: 30/30 died, median death wave 8, death-wave dist wave5 x12 / wave8 x4 / wave9 x1 / wave10 x7 / wave11 x4 / wave12 x1 / wave14 x1, tally (primary) SPLICER 7 / MONOLITH 11 / gunship 4 / wasp 1 / bullet_unknown 2 / rock_L 1 / sentry 1 / rock_M 2 / rock_S 1, H = 18/30 = 0.600 - ADJUDICATION INPUTS: B56 12/30 (the wave-5 band: ALL wave 5, ZERO wave 6, ALL source=bullet - 11 MONOLITH-primary + 1 bullet_unknown) | M56 11/30 | M56' 12/30 -> frozen branches: (B) B56 12 >= 12 TRUE -> BRANCH B FIRES: the FROZEN E82 lever (boss.burst.every 4.0 -> 4.8, config.js:300) APPLIES at I583 (ST-550); (A*)/G/C not reached - best runs: 58107 wave 14 (222,816 pts) / 58120 wave 12 (178,320) / 58121 wave 11 (178,798); 1/30 reached wave >= 13 (58107 wave 14; the (d) non-regression floor >= 3/30 applies to sweep582, not sweep581); none past wave 14 - band detail: the wave-5 Monolith wall is STABLE and remains THE live wall: same-tree band span now 10/7/9/12/11/12 across six samples (567 10 / 569 7 / 571 9 / 573 12 / 577 11 / 581 12) - STABLE, R-2 seed variance; wall reproduced at the top of the band; NO material divergence -> no RECORD+REGISTER needed (contrast E81 uncovered gap cell) - zero src CONFIRMED (config.js:300 stays every: 4.0 until I583 applies it) - quality bar 6/6 (docs-only: tests 1,237/1,237 / build 0 / dist byte-identical 6,430,174 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene [zero servers/tabs])\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("stories BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("stories OK, bytes " + fs.statSync(p).size);
}

// ---------- iterations.md (tail-LF, BOM 5): append the I582 entry ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I582 (ST-549, E82): sweep581 pre-lever re-audit - BRANCH B (B56 12/30 >= 12/30) -> apply the FROZEN E82 lever at I583 (ST-550) - docs-only\n" +
  "\n" +
  "- Pre-state: local == origin d1f5a50 (I581, E82 OPEN, push-verified). Tree clean apart from the new untracked .evidence/I582/.\n" +
  "- Change: ZERO src/assets/vendor/render/i18n (.evidence + bookkeeping only): .evidence/I582/ [write581.cjs (7,865 B, writer: rules581.md FROZEN PRE-RUN + sweep581.mjs cloned from the .evidence/I578 pattern [sweep577.mjs] via asserted-unique replacements + kiter/attribution VERBATIM asserts) + rules581.md (5,262 B, FROZEN PRE-RUN - lineage of rules577.md, E82 labels; sec.3 = the FROZEN GAP-FREE E82 B/A*/G/C adjudication verbatim from design/e82-monolith-wave5-wall-ii-research.md sec.6) + sweep581.mjs (17,773 B; kiter + bullet attribution VERBATIM; ONLY the header/seeds/output-labels/branch block changed) + sweep581.json (97,880 B, authoritative per-run) + results581.txt (6,052 B) + bookkeep582.cjs + commit-msg-I582.txt] + bookkeeping (epics E82 ST-549 DONE I582 + ST-550 APPLY-confirmed + Status / stories ST-549 line / active NEXT at I583 / timeline / CHANGELOG via the I581->I576 anchor).\n" +
  "- Sweep581 (30 FRESH seeds 58100+i, full director from wave 1, frozen I328 kiter VERBATIM, cap 36000 ticks @ 1/60; wall ms 14,625; rules581.md FROZEN PRE-RUN): 30/30 died, median death wave 8, death-wave dist wave5 x12 / wave8 x4 / wave9 x1 / wave10 x7 / wave11 x4 / wave12 x1 / wave14 x1, tally (primary) SPLICER 7 / MONOLITH 11 / gunship 4 / wasp 1 / bullet_unknown 2 / rock_L 1 / sentry 1 / rock_M 2 / rock_S 1, H = 18/30 = 0.600. ADJUDICATION INPUTS: B56 12/30 (the wave-5 band: ALL wave 5, ZERO wave 6, ALL source=bullet - 11 MONOLITH-primary + 1 bullet_unknown) | M56 11/30 | M56' 12/30.\n" +
  "- ADJUDICATION (the frozen rules581.md sec.3 governs): (B) B56 12 >= 12 TRUE -> BRANCH B FIRES. The FROZEN E82 lever (boss.burst.every 4.0 -> 4.8, config.js:300) APPLIES at I583 (ST-550). (A*)/G/C not reached. Gap-free tiling of the (B56, M56') space (E81 PROCESS FINDING (d) satisfied - NO uncovered cell). No material divergence -> no RECORD+REGISTER (contrast I578 gap cell).\n" +
  "- Band detail: the wave-5 Monolith wall is STABLE and remains THE live wall: band 12/30 = largest wave band on this sample (vs wave-10 7/30); same-tree band span now 10/7/9/12/11/12 across six samples (567 10 / 569 7 / 571 9 / 573 12 / 577 11 / 581 12). Wall reproduced at the top of the band. Best runs: 58107 wave 14 (222,816 pts) / 58120 wave 12 (178,320) / 58121 wave 11 (178,798); 1/30 reached wave >= 13 (58107 wave 14); none past wave 14.\n" +
  "- Progress: E82 IN PROGRESS (apply round) - ST-548 DONE I581 / ST-549 DONE I582 (Branch B) / ST-550 PENDING I583 (APPLY: lever one line + sweep582 + acceptance (a)-(e)) / ST-551 (I584) G82.0 close gate PENDING.\n" +
  "- Quality bar 6/6 (docs-only): npm test 1,237/1,237; npm run build 0; dist 6,430,174 B / 203 byte-identical (re-measured); vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1 / CHANGELOG 7 - splices/appends preserve heads); hygiene (zero servers/tabs - the sweep ran in-process, nothing started).\n" +
  "- Next: I583 (ST-550) = APPLY round (lever one line: config.js:300 every: 4.0 -> 4.8 + sweep582 [30 fresh seeds 58200+i, tag sweep582, FROZEN E82 acceptance (a) B56 <= 9/30 [baseline 11/30] / (b) M56' <= 7/30 [baseline 11/30] / (c) median death wave >= 9 / (d) >= 3/30 reach wave >= 13 / (e) 5-harness gate EXACT no re-pin] + bookkeep + quality bar + push delegate Arendt 01a20721-4cb0-73e2-a04a-320271ba1724; C1 on any (a)-(d) failure = git restore config.js + accept + P1/P2/P3 registration to E83+); then I584 (ST-551) = G82.0 close gate (CLOSEGATE584, clone of the .evidence/I580 runner pattern: 5 fresh harnesses ALL EXACT NO re-pin + dist re-measure + CLOSE FLOOR E82 = 7,400,000 - measured re-derived WITH MEASUREMENT + AGENTS.md item-4 refresh [E82 clause inserted, E81 demoted to prior] + E82 CLOSED + push delegate Russell 01a2074b-ac3f-7112-ad6a-a6c9f5653e27).\n";
  const s = s0 + entry;
  if (bomCount(s) !== b0) throw new Error("iterations BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("iterations OK, bytes " + fs.statSync(p).size);
}

// ---------- timeline.md (LF, BOM 3): append the I582 line ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I582 (ST-549, E82) done: the pre-check for the wave-5 boss's burst-cadence trim came back the way the frozen rules expected - the wall is still the biggest obstacle (twelve of thirty pilots died there, all to the boss's bolts), so per the frozen rules the trim now applies: the boss's big radial bullet bursts are spaced a little further apart (every 4.0 s -> 4.8 s), to be confirmed by a fresh thirty-run before it counts. Nothing in the game changed yet; the trim is not in the build until that check passes. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("timeline BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("timeline OK, bytes " + fs.statSync(p).size);
}

// ---------- CHANGELOG.md (LF, no trailing newline, BOM 7): insert between the I581 and I576 lines ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const tail = "confirms the wall is still there. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.";
  const a = tail + "\n- I576:";
  assertOnce(s0, a, "changelog I581->I576");
  const entry = "- I582: No visible change - the pre-check for the wave-5 boss's burst-cadence trim confirmed the wall is still there (twelve of thirty pilots died to the boss's bolts), so the frozen rules now apply the trim: the boss's big radial bullet bursts are spaced a little further apart (every 4.0 s -> 4.8 s), to be confirmed by a fresh thirty-run before it counts. Nothing in the game changed yet. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s = s0.replace(a, tail + "\n" + entry + "- I576:");
  if (bomCount(s) !== b0) throw new Error("changelog BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("changelog OK, bytes " + fs.statSync(p).size);
}

// ---------- active.md (CRLF, BOM 0): append the NEXT-at-I583 line ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I583 = ST-550 (E82, APPLY path, Branch B at I582): (a) one-line edit src/core/config.js:300 every: 4.0 -> 4.8 (the FROZEN E82 lever, boss.burst.every); (b) build .evidence/I583/sweep582.mjs (clone sweep581.mjs, seeds 58200+i, tag/json/results labels sweep582, branch block -> the FROZEN E82 acceptance: (a) B56 <= 9/30 [baseline 11/30] / (b) M56' <= 7/30 [baseline 11/30] / (c) median death wave >= 9 / (d) >= 3/30 reach wave >= 13 / (e) 5-harness gate EXACT no re-pin); (c) run the 5-harness gate EXACT (clone the .evidence/I580 runner pattern: causal495 dist :4200 + causal483 + playframe483 + playframe491 dev :5173 + pwa491 dist :5199; runner self-kills servers; pins EXPECTED EXACT - burst timer time-driven, zero extra RNG, pins wave <= 2 [playframe A 22/32,717 + 11/180, B 52/73,172; causal483 score 11334; pwa491 11/11; causal495 PASS 3 arms seed-9876]); (d) bookkeep I583 (6 blocks, house pattern) + quality bar 6/6 (dist: 1-char literal swap -> EXPECTED byte-identical 6,430,174 B / 203) + commit + push delegate Arendt 01a20721-4cb0-73e2-a04a-320271ba1724 (verify via git fetch + log); (e) C1 on any (a)-(d) failure = git restore src/core/config.js + accept-with-documentation + the E81 pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 - ONE chosen by that epic's own frozen rules] to E83+ + G82.0 closes as accept round; then I584 (ST-551) = G82.0 close gate (CLOSEGATE584, clone the .evidence/I580 runner pattern: 5 fresh harnesses ALL EXACT NO re-pin + dist re-measure + CLOSE FLOOR E82 = 7,400,000 - measured re-derived WITH MEASUREMENT [headroom >= 102,400 B floor -> cut ladder NOT invoked] + AGENTS.md item-4 refresh [E82 clause inserted, E81 demoted to prior] + E82 CLOSED + push delegate Russell 01a2074b-ac3f-7112-ad6a-a6c9f5653e27).\r\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("active BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("active OK, bytes " + fs.statSync(p).size);
}
console.log("BOOKKEEP582 DONE");