// I578 bookkeeper: epics E81 ST-545 PENDING -> DONE I578 + ST-546 PENDING -> VOID I579 + Status refresh,
// stories ST-545 line append, iterations I578 entry append, timeline I578 line append,
// CHANGELOG insert between the I577 and I576 lines, active NEXT-at-I579 line append.
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

// ---------- epics.md (CRLF, BOM 3): ST-545 DONE I578, ST-546 VOID I579, Status refresh ----------
{
  const p = "production/epics.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("epics: expected trailing CRLF");

  const a1 = "ST-545 PENDING I578 (sweep577 pre-lever re-audit: 30 FRESH seeds 57700+i, rules577.md FROZEN PRE-RUN in .evidence/I578/ [lineage of .evidence/I574/rules573.md, E81 labels]; metrics B56 = deaths on wave in {5,6} any attribution [baseline 13/30] / M56 = deaths on wave in {5,6} AND clsPrimary == MONOLITH [baseline 10/30]; the FROZEN E81 adjudication: (B) B56 >= 12/30 -> lever; (A*) 10 <= B56 <= 11 AND M56 >= 8/30 -> lever [pre-registered single-boss extension, recorded WITH MEASUREMENT when used]; (C) B56 <= 9/30 -> ST-546 VOID + accept [E78-lever pattern]; material divergence -> RECORD + REGISTER [I570 pattern])";
  assertOnce(s0, a1, "epics ST-545 PENDING");
  const r1 = "ST-545 DONE I578 (sweep577 pre-lever re-audit: 30 FRESH seeds 57700+i, rules577.md FROZEN PRE-RUN in .evidence/I578/; MEASURED 30/30 died, median death wave 9, death-wave dist wave5 x11 / wave7 x1 / wave8 x2 / wave9 x2 / wave10 x7 / wave11 x1 / wave13 x3 / wave15 x3, tally (primary) MONOLITH 9 / SPLICER 6 / bullet_unknown 4 / rock_M 2 / rock_S 2 / phantom 2 / gunship 2 / sentry 2 / rock_L 1, H = 15/30 = 0.500; ADJUDICATION INPUTS: B56 11/30 [all wave 5, zero wave 6, all source=bullet: 7 MONOLITH-primary + 4 bullet_unknown] | M56 7/30 -> frozen branches (B) 11 < 12 NOT met / (A*) 10 <= 11 <= 11 in range BUT M56 7 < 8 NOT met / (C) 11 > 9 NOT met literally -> UNCOVERED CELL (B56 in {10,11} AND M56 <= 7): drafting gap in the frozen adjudication -> RECORD + REGISTER per the frozen divergence rule (I570 pattern); the frozen lever NOT applied [neither apply branch fired]; ST-546 VOID + accept [C-equivalent outcome, E78 pattern]; zero src)";

  const a2 = "ST-546 PENDING I579 (CONDITIONAL: the lever one line [config.js:300 every: 4.0 -> 4.8] + sweep578 [30 fresh seeds 57800+i] + acceptance (a) B56 <= 9/30 / (b) M56 <= 7/30 / (c) median death wave >= 9 / (d) >= 3/30 reach wave >= 13 / (e) 5-harness gate EXACT no re-pin; C1 on failure = one-line revert + accept + the E81 pattern-lever registration)";
  assertOnce(s0, a2, "epics ST-546 PENDING");
  const r2 = "ST-546 VOID I579 (gap case adjudicated at I578 on sweep577: no code change, no sweep578, E78-lever pattern; the VOID formalized at I579 docs-only [.evidence/I579/void579.md] with the full measurement pointers + the E82+ registrations)";

  const a3 = "- Status: OPEN I577 (ST-544 done: open + research + scope-check, docs-only zero src). Pre-state local == origin cdca434 (I576, E80 CLOSED, push-verified). dist policy: the lever is a 1-char literal swap in shipped config (comments do not ship) -> EXPECTED byte-identical 6,430,174 B / 203. Next owner: I578 (ST-545) sweep577 pre-lever re-audit.";
  assertOnce(s0, a3, "epics E81 Status line");
  const r3 = "- Status: OPEN (opened I577; ST-545 DONE I578 - sweep577: all three frozen branches false (B56 11/30, M56 7/30 -> uncovered cell, drafting gap in the frozen adjudication) -> RECORD + REGISTER per the frozen divergence rule (I570 pattern), the frozen lever NOT applied, zero src; accept round in progress, E78/E79 pattern). Pre-state local == origin 78f4cda (I577, push-verified). Next owner: I579 (ST-546) VOID execution (docs-only) + then I580 (ST-547) G81.0 close gate.";

  let s = s0;
  s = s.replace(a1, r1);
  s = s.replace(a2, r2);
  s = s.replace(a3, r3);
  if (bomCount(s) !== b0) throw new Error("epics BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("epics OK, bytes " + fs.statSync(p).size);
}

// ---------- stories.md (tail-LF, BOM 5): append the ST-545 line ----------
{
  const p = "production/stories.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("stories: expected trailing LF");
  const line = "- ST-545 E81 sweep577 pre-lever re-audit (I578) - DONE I578: 30 FRESH seeds 57700+i, full director from wave 1, frozen I328 kiter verbatim, cap 36000 ticks @ 1/60, in-process (wall 13,613 ms), zero servers/tabs; rules577.md FROZEN PRE-RUN in .evidence/I578/ (4,070 B; lineage of .evidence/I574/rules573.md, E81 labels; sec.3 = the FROZEN E81 B/A*/C adjudication verbatim from design/e81-monolith-wave5-wall-research.md sec.6; metrics B56 = deaths on wave in {5,6} any attribution [baseline 13/30, sweep573], M56 = deaths on wave in {5,6} AND clsPrimary == MONOLITH [baseline 10/30]) - MEASURED: 30/30 died, median death wave 9, death-wave dist wave5 x11 / wave7 x1 / wave8 x2 / wave9 x2 / wave10 x7 / wave11 x1 / wave13 x3 / wave15 x3, tally (primary) MONOLITH 9 / SPLICER 6 / bullet_unknown 4 / rock_M 2 / rock_S 2 / phantom 2 / gunship 2 / sentry 2 / rock_L 1, H = 15/30 = 0.500 (in the same-tree span 0.400-0.667) - ADJUDICATION INPUTS: B56 11/30 (the wave-5 band: ALL wave 5, ZERO wave 6, ALL source=bullet - 7 MONOLITH-primary + 4 bullet_unknown) | M56 7/30 -> frozen branches: (B) B56 11 >= 12 FALSE / (A*) 10 <= 11 <= 11 TRUE AND M56 7 >= 8 FALSE -> branch FALSE / (C) B56 11 <= 9 FALSE -> NO branch fired -> UNCOVERED CELL (B56 in {10,11} AND M56 <= 7): the frozen adjudication does not tile the (B56, M56) space - a drafting gap -> per the frozen divergence clause (rules577.md sec.3: 'Material divergence from design/e81-monolith-wave5-wall-research.md -> RECORD + REGISTER before any code change (I570 pattern); the extension re-derives nothing') the frozen lever (boss.burst.every 4.0 -> 4.8, config.js:300) is NOT applied (neither apply branch fired; inventing a 4th branch is forbidden) and ST-546 proceeds as VOID + accept (C-equivalent outcome - under either reading, gap-cell vs 'C as otherwise', the outcome is identical: no lever); CAUTION for the records: the harness else-branch printed 'BRANCH DECISION: C (accept-with-documentation): ST-546 VOID (B56 11/30 <= 9/30; M56 7/30)' - the clause 'B56 11/30 <= 9/30' is arithmetically false (literal C failed; the line is misleading as printed; the record states the adjudication precisely: all three literal branches false -> uncovered cell -> RECORD + REGISTER -> C-equivalent VOID) - best runs: 57712 wave 15 (270,908 pts, died phantom) / 57722 wave 15 (254,516, monolithProbable rock_M) / 57713 wave 15 (240,304, died MONOLITH); 6/30 reached wave >= 13 (57704/57715/57720 wave 13; 57712/57713/57722 wave 15); none past wave 15 - REGISTRATIONS (E82+ backlog, WITH the full measurement record): (a) the wave-5 Monolith wall remains THE live wall (band 11/30 = largest wave band on this sample vs wave-10 7/30; same-tree band span now 7-12/30 across five samples: 567 10 / 569 7 / 571 9 / 573 12 / 577 11 - STABLE, R-2 seed variance) / (b) the frozen E81 lever stays UNAPPLIED/registered (E80-lever-[2] pattern) - its cadence premise not confirmed: the MONOLITH-primary band share dropped to 7/11 (baseline 10/13); the 4/11 bullet_unknown band deaths are attribution-ambiguous bolts (frozen M56 counts only clsPrimary == MONOLITH; R-5: metrics frozen pre-run, no post-hoc fudging) / (c) the E81 pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6, preference order, ONE chosen by that epic's own frozen rules] carries to E82+ / (d) PROCESS FINDING: the frozen E81 adjudication did not tile the (B56, M56) space (B56 in {10,11} AND M56 <= 7 is uncovered) - a future epic's frozen adjudication must explicitly tile it (e.g. C as 'otherwise' or an explicit gap branch) / (e) E81 closes at G81.0 as an accept round (E78/E79/E80 pattern) - zero src CONFIRMED (git diff 78f4cda -- src/ assets/ vendor/ EMPTY on the working tree; config.js:300 stays every: 4.0) - quality bar 6/6 (docs-only: tests 1,237/1,237 / build 0 / dist byte-identical 6,430,174 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene [zero servers/tabs])\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("stories BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("stories OK, bytes " + fs.statSync(p).size);
}
// ---------- iterations.md (tail-LF, BOM 5): append the I578 entry ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I578 (ST-545, E81): sweep577 pre-lever re-audit - GAP CASE (all three frozen branches false: B56 11/30, M56 7/30 -> uncovered cell in the frozen adjudication) -> RECORD + REGISTER, the frozen lever NOT applied, ST-546 VOID + accept (C-equivalent, E78 pattern) - docs-only\n" +
  "\n" +
  "- Pre-state: local == origin 78f4cda (I577, E81 OPEN, push-verified). Tree clean apart from the new untracked .evidence/I578/.\n" +
  "- Change: ZERO src/assets/vendor/render/i18n (.evidence + bookkeeping only): .evidence/I578/ [write577.cjs (10,542 B, writer: rules577.md FROZEN PRE-RUN + sweep577.mjs cloned from .evidence/I574/sweep573.mjs via asserted-unique replacements + kiter/attribution VERBATIM asserts) + rules577.md (4,070 B, FROZEN PRE-RUN - lineage of rules573.md, E81 labels; sec.3 = the FROZEN E81 B/A*/C adjudication verbatim from the research sec.6) + sweep577.mjs (16,390 B; kiter + bullet attribution VERBATIM; ONLY the header/seeds/output-labels/branch block changed) + sweep577.json (103,926 B, authoritative per-run) + results577.txt (5,808 B) + bookkeep578.cjs + commit-msg-I578.txt] + bookkeeping (epics E81 ST-545 DONE I578 + ST-546 VOID I579 + Status / stories ST-545 line / active NEXT at I579 / timeline / CHANGELOG via the I577->I576 anchor).\n" +
  "- Sweep577 (30 FRESH seeds 57700+i, full director from wave 1, frozen I328 kiter VERBATIM, cap 36000 ticks @ 1/60; wall ms 13,613; rules577.md FROZEN PRE-RUN): 30/30 died, median death wave 9, death-wave dist wave5 x11 / wave7 x1 / wave8 x2 / wave9 x2 / wave10 x7 / wave11 x1 / wave13 x3 / wave15 x3, tally (primary) MONOLITH 9 / SPLICER 6 / bullet_unknown 4 / rock_M 2 / rock_S 2 / phantom 2 / gunship 2 / sentry 2 / rock_L 1, H = 15/30 = 0.500. ADJUDICATION INPUTS: B56 11/30 (the wave-5 band: ALL wave 5, ZERO wave 6, ALL source=bullet - 7 MONOLITH-primary + 4 bullet_unknown) | M56 7/30.\n" +
  "- Band detail: the wave-5 Monolith wall is STABLE and remains THE live wall: band 11/30 = the largest wave band on this sample (vs wave-10 7/30); same-tree band span 7-12/30 across five samples (567 10 / 569 7 / 571 9 / 573 12 / 577 11). Best runs: 57712 wave 15 (270,908 pts, died phantom) / 57722 wave 15 (254,516, monolithProbable rock_M) / 57713 wave 15 (240,304, died MONOLITH); 6/30 reached wave >= 13 (57704/57715/57720 wave 13; 57712/57713/57722 wave 15); none past wave 15.\n" +
  "- ADJUDICATION (the frozen rules577.md sec.3 governs): (B) B56 11 >= 12 FALSE / (A*) 10 <= 11 <= 11 TRUE AND M56 7 >= 8 FALSE -> branch FALSE / (C) B56 11 <= 9 FALSE -> NO branch fired. The measured point (B56 11, M56 7) is an UNCOVERED CELL of the frozen adjudication - the three literal branches do not tile the (B56, M56) space (drafting gap). Per the frozen divergence clause (RECORD + REGISTER before any code change, I570 pattern; the extension re-derives nothing): the frozen lever (boss.burst.every 4.0 -> 4.8, config.js:300) is NOT applied - neither apply branch fired and inventing a 4th branch is forbidden; ST-546 proceeds as VOID + accept (the C-equivalent outcome - under either reading, gap-cell vs 'C as otherwise', the outcome is identical: no lever). Zero code change: config.js:300 stays every: 4.0.\n" +
  "- CAUTION for the records: results577.txt's else-branch prints 'BRANCH DECISION: C (accept-with-documentation): ST-546 VOID (B56 11/30 <= 9/30; M56 7/30)' - the clause 'B56 11/30 <= 9/30' is arithmetically false (literal C failed; the harness line is misleading as printed). The adjudication of record: all three literal branches false -> uncovered cell -> RECORD + REGISTER -> C-equivalent VOID.\n" +
  "- Registrations (E82+ backlog, WITH the full measurement record): (a) the wave-5 Monolith wall remains THE live wall (band 11/30 = largest wave band on this sample vs wave-10 7/30; same-tree band span 7-12/30 across five samples - STABLE, R-2 seed variance) / (b) the frozen E81 lever stays UNAPPLIED/registered (E80-lever-[2] pattern) - its cadence premise not confirmed: the MONOLITH-primary band share dropped to 7/11 (baseline 10/13); the 4/11 bullet_unknown band deaths are attribution-ambiguous bolts (frozen M56 counts only clsPrimary == MONOLITH; R-5: metrics frozen pre-run, no post-hoc fudging) / (c) the E81 pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6, preference order, ONE chosen by that epic's own frozen rules] carries to E82+ / (d) PROCESS FINDING: the frozen E81 adjudication did not tile the (B56, M56) space - a future epic's frozen adjudication must explicitly tile it (e.g. C as 'otherwise' or an explicit gap branch) / (e) E81 closes at G81.0 as an accept round (E78/E79/E80 pattern).\n" +
  "- Progress: E81 IN PROGRESS (accept round) - ST-544 DONE I577 / ST-545 DONE I578 (gap case) / ST-546 VOID-pending I579 (E78-lever pattern, docs-only) / ST-547 (I580) G81.0 close gate PENDING.\n" +
  "- Quality bar 6/6 (docs-only): npm test 1,237/1,237; npm run build 0; dist 6,430,174 B / 203 byte-identical (re-measured); vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1 / CHANGELOG 7 - splices/appends preserve heads); hygiene (zero servers/tabs - the sweep ran in-process, nothing started).\n" +
  "- Next: I579 (ST-546) = VOID execution (docs-only, E78-lever pattern: .evidence/I579/void579.md cloning the .evidence/I575/void575.md shape with the gap-case text [pointer to the I578 adjudication, zero-src confirmation via git diff 78f4cda..HEAD -- src/ assets/ vendor/ EMPTY, no-sweep578 confirmation, E78 precedent [Branch C at sweep567, CLOSED I568]]; push delegate Russell); then I580 (ST-547) = G81.0 close gate (CLOSEGATE580, clone of the .evidence/I576 runner pattern: 5 fresh harnesses ALL EXACT NO re-pin + dist re-measure 6,430,174 B / 203 + CLOSE FLOOR E81 = 969,826 B re-derived WITH MEASUREMENT [7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked] + AGENTS.md item-4 refresh + E81 CLOSED I580 as an accept round + push delegate [Dewey]).\n";
  const s = s0 + entry;
  if (bomCount(s) !== b0) throw new Error("iterations BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("iterations OK, bytes " + fs.statSync(p).size);
}

// ---------- timeline.md (LF, BOM 3): append the I578 line ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I578 (ST-545, E81) done: the pre-check for the wave-5 boss's burst-cadence trim landed in a gap between the frozen decision rules - the wall was still the biggest obstacle (eleven of thirty pilots died there, all to the boss's bolts), but the boss's directly-attributed share came in just under the bar that would have applied the trim - so, per the frozen rules, the trim is not applied this round; the full measurement is on file, the gap in the rules themselves is registered for a future round, and the round continues as a no-change accept. Nothing in the game changed; the bundle is unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("timeline BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("timeline OK, bytes " + fs.statSync(p).size);
}

// ---------- CHANGELOG.md (LF, no trailing newline, BOM 7): insert between the I577 and I576 lines ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "written down before any test run; no gameplay code changed this round. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n- I576:";
  assertOnce(s0, a, "changelog I577->I576");
  const entry = "- I578: No visible change - the pre-check for the wave-5 boss's burst-cadence trim came back in a gap between the frozen decision rules (the wall was still the biggest obstacle at eleven of thirty, but just below the bar to apply the trim), so per the frozen rules the trim is not applied this round and it is recorded for a future round. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s = s0.replace(a, "written down before any test run; no gameplay code changed this round. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n" + entry + "- I576:");
  if (bomCount(s) !== b0) throw new Error("changelog BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("changelog OK, bytes " + fs.statSync(p).size);
}

// ---------- active.md (CRLF, BOM 0): append the NEXT-at-I579 line ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I579 = ST-546 VOID execution (E81, gap case): .evidence/I579/void579.md (clone the .evidence/I575/void575.md shape, 1,700 B precedent) with the gap-case text: the frozen E81 lever (config.js:300 every: 4.0) is NOT applied because NEITHER apply branch of the frozen rules577.md sec.3 was met [(B) B56 11 < 12; (A*) in range BUT M56 7 < 8] and the literal (C) condition (B56 <= 9) was also unmet -> uncovered cell (B56 in {10,11} AND M56 <= 7) -> RECORD + REGISTER per the frozen divergence clause (I570 pattern) -> C-equivalent outcome: ST-546 VOID + accept; authoritative I578 records pointers (results577.txt / sweep577.json 103,926 B / rules577.md 4,070 B; the harness else-branch 'B56 11/30 <= 9/30' clause is arithmetically false - literal C failed, recorded precisely); zero-src confirmed via git diff 78f4cda..HEAD -- src/ assets/ vendor/ EMPTY (at I579, HEAD = the I578 commit); config.js:300 stays every: 4.0; NO sweep578 exists or is expected (it only runs if the lever was applied - E78 precedent: Branch C at sweep567, accept-with-documentation, CLOSED I568) + bookkeeping (epics E81 ST-546 VOID DONE I579 / stories ST-546 line / iterations I579 / active / timeline / CHANGELOG) + push delegate Russell 01a2074b-ac3f-7112-ad6a-a6c9f5653e27 (verify via git fetch + log); then I580 (ST-547) = G81.0 close gate (CLOSEGATE580, clone the .evidence/I576 runner pattern: 5 fresh harnesses ALL EXACT NO re-pin [net-zero src since I572] + dist re-measure 6,430,174 B / 203 + CLOSE FLOOR E81 = 969,826 B re-derived WITH MEASUREMENT [7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked] + AGENTS.md item-4 refresh [E81 clause inserted, E80 demoted to prior] + E81 CLOSED I580 as an accept round + push delegate Dewey 01a20760-b402-74a2-b164-e13208b85f07).\r\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("active BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("active OK, bytes " + fs.statSync(p).size);
}
console.log("BOOKKEEP578 DONE");