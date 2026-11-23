// I579 bookkeeper: epics E81 ST-546 VOID I579 -> VOID DONE I579 + Status/Next -> I580,
// stories ST-546 line append, iterations I579 entry append, timeline I579 line append,
// CHANGELOG insert between the I578 and I576 lines, active NEXT-at-I580 line append.
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

// ---------- epics.md (CRLF, BOM 3): ST-546 VOID DONE I579 + Status/Next -> I580 ----------
{
  const p = "production/epics.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("epics: expected trailing CRLF");

  const a1 = "ST-546 VOID I579 (gap case adjudicated at I578 on sweep577: no code change, no sweep578, E78-lever pattern; the VOID formalized at I579 docs-only [.evidence/I579/void579.md] with the full measurement pointers + the E82+ registrations)";
  assertOnce(s0, a1, "epics ST-546 VOID");
  const r1 = "ST-546 VOID DONE I579 (gap case adjudicated at I578 on sweep577: no code change, no sweep578, E78-lever pattern, C-equivalent VOID; the VOID formalized at I579 docs-only [\u0060.evidence/I579/void579.md\u0060] with the full measurement pointers + the E82+ registrations a-e incl. the process finding [d] [future frozen adjudications must explicitly tile the (B56, M56) space]; zero src confirmed via git diff 78f4cda..HEAD EMPTY)";

  const a2 = "- Status: OPEN (opened I577; ST-545 DONE I578 - sweep577: all three frozen branches false (B56 11/30, M56 7/30 -> uncovered cell, drafting gap in the frozen adjudication) -> RECORD + REGISTER per the frozen divergence rule (I570 pattern), the frozen lever NOT applied, zero src; accept round in progress, E78/E79 pattern). Pre-state local == origin 78f4cda (I577, push-verified). Next owner: I579 (ST-546) VOID execution (docs-only) + then I580 (ST-547) G81.0 close gate.";
  assertOnce(s0, a2, "epics E81 Status line");
  const r2 = "- Status: OPEN (opened I577; ST-545 DONE I578 - sweep577: all three frozen branches false (B56 11/30, M56 7/30 -> uncovered cell, drafting gap in the frozen adjudication) -> RECORD + REGISTER per the frozen divergence rule (I570 pattern), the frozen lever NOT applied, zero src; ST-546 VOID DONE I579 - C-equivalent VOID + accept, docs-only, zero src; accept round in progress, E78/E79 pattern). Pre-state local == origin afde28c (I578, push-verified). Next owner: I580 (ST-547) G81.0 close gate.";

  let s = s0;
  s = s.replace(a1, r1);
  s = s.replace(a2, r2);
  if (bomCount(s) !== b0) throw new Error("epics BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("epics OK, bytes " + fs.statSync(p).size);
}

// ---------- stories.md (tail-LF, BOM 5): append the ST-546 line ----------
{
  const p = "production/stories.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("stories: expected trailing LF");
  const line = "- ST-546 E81 VOID execution (I579) - VOID DONE I579: the frozen E81 lever (boss.burst.every 4.0 -> 4.8, src/core/config.js:300) is NOT applied - the sweep577 pre-lever re-audit (I578) measured (B56 11/30, M56 7/30) - an UNCOVERED CELL of the frozen rules577.md sec.3 adjudication (the three literal branches do not tile the (B56, M56) space - drafting gap): (B) B56 11 >= 12 FALSE / (A*) 10 <= 11 <= 11 TRUE AND M56 7 >= 8 FALSE / (C) 11 <= 9 FALSE -> per the frozen divergence clause: RECORD + REGISTER (executed at I578, I570 pattern) -> C-equivalent outcome: ST-546 VOID + accept (E78 pattern); no code change; NO sweep578 exists or is expected (it only runs if the lever was applied - it was not); config.js:300 stays every: 4.0 - the VOID formalized at I579 docs-only [\u0060.evidence/I579/void579.md\u0060] (clone of the .evidence/I575/void575.md shape, 1,700 B precedent) with the authoritative I578 record pointers (results577.txt 5,808 B / sweep577.json 103,926 B / rules577.md 4,070 B) + the precise caution (results577.txt's else-branch 'B56 11/30 <= 9/30' clause is arithmetically false - literal C failed; the decision of record is the uncovered cell, NOT branch C) + the E82+ registrations a-e incl. the process finding (d) [future frozen adjudications must explicitly tile the (B56, M56) space] - zero src CONFIRMED (git diff 78f4cda..HEAD -- src/ assets/ vendor/ EMPTY; HEAD = afde28c, the I578 commit) - quality bar 6/6 (docs-only: tests 1,237/1,237 / build 0 / dist byte-identical 6,430,174 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene [zero servers/tabs, ports free])\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("stories BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("stories OK, bytes " + fs.statSync(p).size);
}

// ---------- iterations.md (tail-LF, BOM 5): append the I579 entry ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I579 (ST-546, E81): VOID execution (gap case, C-equivalent, E78 pattern) - docs-only\n" +
  "\n" +
  "- Pre-state: local == origin afde28c (I578, E81 OPEN, push-verified). Tree clean apart from the new untracked .evidence/I579/.\n" +
  "- Change: ZERO src/assets/vendor/render/i18n (.evidence + bookkeeping only): .evidence/I579/ [void579.md (2,399 B, clone of the .evidence/I575/void575.md shape with the gap-case text) + bookkeep579.cjs + commit-msg-I579.txt] + bookkeeping (epics E81 ST-546 -> VOID DONE I579 + Status/Next -> I580 / stories ST-546 line / active NEXT at I580 / timeline / CHANGELOG via the I578->I576 anchor).\n" +
  "- VOID of record: the frozen E81 lever (boss.burst.every 4.0 -> 4.8, config.js:300) is NOT applied. The sweep577 pre-lever re-audit (I578) measured (B56 11/30, M56 7/30) - an UNCOVERED CELL of the frozen rules577.md sec.3: (B) B56 11 >= 12 FALSE / (A*) 10 <= 11 <= 11 TRUE AND M56 7 >= 8 FALSE / (C) B56 11 <= 9 FALSE -> the three literal branches do not tile the (B56, M56) space (drafting gap) -> per the frozen divergence clause (RECORD + REGISTER before any code change, I570 pattern; the extension re-derives nothing): the lever is NOT applied - neither apply branch fired and inventing a 4th branch is forbidden; ST-546 = VOID + accept (the C-equivalent outcome - under either reading, gap-cell vs 'C as otherwise', the outcome is identical: no lever). No code change; NO sweep578 exists or is expected (it only runs if the lever was applied - it was not); config.js:300 stays every: 4.0.\n" +
  "- CAUTION carried into the VOID record: results577.txt's else-branch prints 'BRANCH DECISION: C (accept-with-documentation): ST-546 VOID (B56 11/30 <= 9/30; M56 7/30)' - the clause 'B56 11/30 <= 9/30' is arithmetically false (literal C failed; the harness line is misleading as printed). The adjudication of record: all three literal branches false -> uncovered cell -> RECORD + REGISTER -> C-equivalent VOID.\n" +
  "- Zero src confirmed: git diff 78f4cda..HEAD -- src/ assets/ vendor/ EMPTY (HEAD = afde28c, the I578 commit).\n" +
  "- E82+ registrations a-e (full text in the I578 records, unchanged): (a) the wave-5 Monolith wall remains THE live wall (band span 7-12/30 across five samples: 567 10 / 569 7 / 571 9 / 573 12 / 577 11) / (b) the frozen E81 lever stays UNAPPLIED/registered / (c) the E81 pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6] carries to E82+ / (d) PROCESS FINDING: future frozen adjudications must explicitly tile the (B56, M56) space / (e) E81 closes at G81.0 as an accept round.\n" +
  "- Progress: E81 IN PROGRESS (accept round) - ST-544 DONE I577 / ST-545 DONE I578 (gap case) / ST-546 VOID DONE I579 (E78-lever pattern, docs-only) / ST-547 (I580) G81.0 close gate PENDING.\n" +
  "- Quality bar 6/6 (docs-only): npm test 1,237/1,237; npm run build 0; dist 6,430,174 B / 203 byte-identical (re-measured); vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1 / CHANGELOG 7 - splices/appends preserve heads); hygiene (ports 5173/4173/4200/5199 verified free; zero servers/tabs/terminals).\n" +
  "- Next: I580 (ST-547) = G81.0 close gate (CLOSEGATE580, clone of the .evidence/I576 runner pattern: 5 fresh harnesses ALL EXACT NO re-pin [net-zero src since I572] + dist re-measure 6,430,174 B / 203 + CLOSE FLOOR E81 = 969,826 B re-derived WITH MEASUREMENT [7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked] + AGENTS.md item-4 refresh [E81 clause inserted, E80 demoted to prior] + E81 CLOSED I580 as an accept round + push delegate [Dewey 01a20760-b402-74a2-b164-e13208b85f07]).\n";
  const s = s0 + entry;
  if (bomCount(s) !== b0) throw new Error("iterations BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("iterations OK, bytes " + fs.statSync(p).size);
}

// ---------- timeline.md (LF, BOM 3): append the I579 line ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I579 (ST-546, E81) done: the follow-up paperwork for the wave-5 boss round is closed out - since the pre-check landed in a gap between the frozen decision rules, the planned burst-cadence trim is confirmed as not applied this round (it stays registered for a future round, together with the gap in the rules themselves, which future rounds must cover explicitly). Nothing in the game changed; the bundle is unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("timeline BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("timeline OK, bytes " + fs.statSync(p).size);
}

// ---------- CHANGELOG.md (LF, no trailing newline, BOM 7): insert between the I578 and I576 lines ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "the trim is not applied this round and it is recorded for a future round. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n- I576:";
  assertOnce(s0, a, "changelog I578->I576");
  const entry = "- I579: No visible change - the follow-up paperwork for the wave-5 boss round: because the pre-check landed in a gap between the frozen decision rules, the planned burst-cadence trim is confirmed as not applied this round (it stays registered for a future round). Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s = s0.replace(a, "the trim is not applied this round and it is recorded for a future round. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n" + entry + "- I576:");
  if (bomCount(s) !== b0) throw new Error("changelog BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("changelog OK, bytes " + fs.statSync(p).size);
}

// ---------- active.md (CRLF, BOM 0): append the NEXT-at-I580 line ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I580 = ST-547 G81.0 close gate (E81): CLOSEGATE580 = clone the .evidence/I576 runner pattern (clone576.cjs -> .evidence/I580/clone580.cjs: labels CLOSEGATE576 -> CLOSEGATE580, OUTDIR + output names) + run_closegate580.cjs = 5-harness runner (self-kills servers; dist :4200 / dev :5173 / dist-pwa :5199): 5 fresh harnesses ALL EXACT NO re-pin (net-zero src since I572): causal495 (dist :4200, CAUSAL495 PASS 3 arms seed-9876: webgl frozen classic reference + default EXACT; webgpu report-only) / causal483 (dev :5173, CAUSAL456 PASS score 11334) / playframe483+491 (dev :5173; PLAYFRAME456 PASS A 22/32,717 + 11/180, B 52/73,172) / pwa491 (dist :5199, SUMMARY 11/11); port-free verified per step; then dist re-measure (expect byte-identical 6,430,174 B / 203) + CLOSE FLOOR E81 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked) + AGENTS.md item-4 refresh (insert the E81 clause WITH the gap-case accept-round note [the frozen lever stayed UNAPPLIED; E81 closes as an accept round], demote E80 to prior; BOM 1 CRLF byte-safe splice) + bookkeep (E81 CLOSED I580 as an accept round / ST-547 DONE I580 / active / timeline / CHANGELOG) + quality bar 6/6 (the 5-harness gate) + commit + push delegate Dewey 01a20760-b402-74a2-b164-e13208b85f07 (verify via git fetch + log). E81 CLOSED at G81.0; then next epic per the standing queue (scope-check first; candidates: the registered residual wave-5 Monolith wall WITH the gap-case record + the P1/P2/P3 pattern-lever registration + the UNAPPLIED frozen lever / main-character art remaster (Blender) / camera far-framing + cockpit polish / new enemies / linear levels + bosses).\r\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("active BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("active OK, bytes " + fs.statSync(p).size);
}
console.log("BOOKKEEP579 DONE");