// I575 bookkeeper: epics E80 (ST-542 VOID DONE + Status/Next -> I576), stories ST-542 line,
// iterations I575 entry, timeline I575 line, CHANGELOG insert after the I561 anchor, active NEXT line.
// Byte-safe: unique-anchor asserts + BOM-count asserts per file (delta 0).
const fs = require("fs");

function read(p) { return fs.readFileSync(p, "utf8"); }
function bomCount(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) { n++; }
  return n;
}
function assertOnce(s, anchor, label) {
  const i = s.indexOf(anchor);
  if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label);
  if (s.indexOf(anchor, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label);
}

// ---------- epics.md (CRLF, BOM 3) : 2 in-line splices ----------
{
  const p = "production/epics.md";
  let s = read(p);
  const b0 = bomCount(s);
  const a1 = "ST-542 VOID I575 (Branch C adjudicated at I574 on sweep573: no code change, no sweep574, E78-lever pattern; the VOID is formalized at I575 docs-only with the full measurement pointer + the E81+ registrations)";
  const r1 = "ST-542 VOID DONE I575 (Branch C adjudicated at I574 on sweep573: no code change, no sweep574, E78-lever pattern; the VOID formalized at I575 docs-only [`.evidence/I575/void575.md`] with the full measurement pointers + the E81+ registrations; zero src confirmed via git diff 99098a7..HEAD EMPTY)";
  assertOnce(s, a1, "epics ST-542");
  s = s.replace(a1, r1);
  const a2 = "Status: OPEN (opened I573; ST-541 DONE I574 - Branch C adjudicated on sweep573, lever [2] NOT applied, zero src; accept round in progress, E78/E79 pattern). Next owner: I575 (ST-542) VOID execution (docs-only) + then I576 (ST-543) G80.0 close gate.";
  const r2 = "Status: OPEN (opened I573; ST-541 DONE I574 - Branch C adjudicated on sweep573, lever [2] NOT applied, zero src; ST-542 VOID DONE I575 (docs-only, zero src confirmed); accept round, E78/E79 pattern). Next owner: I576 (ST-543) G80.0 close gate (CLOSEGATE576).";
  assertOnce(s, a2, "epics E80 Status");
  s = s.replace(a2, r2);
  if (bomCount(s) !== b0) throw new Error("epics BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("epics OK, bytes " + fs.statSync(p).size);
}

// ---------- stories.md (LF-ish, BOM 5) : append ST-542 line ----------
{
  const p = "production/stories.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\n")) throw new Error("stories: expected trailing LF");
  const line = "- ST-542 E80 lever [2] execution (I575) - VOID I575 (Branch C adjudicated at I574 on sweep573, per the frozen rules573.md sec.3): lever [2] (splicer.maxHp 30 -> 24, src/core/config.js:322) NOT applied - no code change, no sweep574 (sweep574 only ran if the lever was applied - it was not); zero src CONFIRMED via `git diff 99098a7..HEAD -- src/ assets/ vendor/` = EMPTY (HEAD = 544d7a9, the I574 commit; 99098a7 = I573, the E80-open boundary); the frozen E81+ registrations (wave-5 Monolith live wall 12/30 / 5-sample seed-variance span 0.400-0.667 / Splicer wave-10 cluster below band 9/30 / frozen lever [2] stays UNAPPLIED/registered for a future epic whose own fresh re-audit adjudicates SPLICER-dominant / E80 closes at G80.0 as an accept round) stand as recorded at I574; VOID record: .evidence/I575/void575.md with the full measurement pointers (.evidence/I574/results573.txt + sweep573.json 95,597 B + rules573.md 4,169 B); E78-lever pattern (accept-with-documentation; E78 = Branch C, H 0.400 EXACT at sweep567, CLOSED I568, same shape); quality bar 6/6 (docs-only: tests 1,237/1,237 / build 0 / dist byte-identical 6,430,174 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene zero servers/tabs)\n";
  s += line;
  if (bomCount(s) !== b0) throw new Error("stories BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("stories OK, bytes " + fs.statSync(p).size);
}

// ---------- iterations.md (mixed, BOM 5) : append I575 entry ----------
{
  const p = "production/iterations.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I575 (ST-542, E80): VOID execution - Branch C formalized (lever [2] NOT applied, zero src confirmed via diff, no sweep574) - E78-lever pattern, docs-only\n" +
  "\n" +
  "- Pre-state: local == origin 544d7a9 (I574, Branch C adjudicated, push-verified via subagent). Tree clean apart from the new untracked .evidence/I575/.\n" +
  "- Change: ZERO src/assets/vendor/render/i18n (.evidence + docs only): .evidence/I575/void575.md (1,700 B, LF, no BOM - the VOID record: Branch C per the frozen rules573.md sec.3 with all three C sub-conditions [H 17/30 = 0.567 < 0.600; SPLICER 7/30 NOT the largest single source - MONOLITH 10/30 is; W10 9/30 < W5 12/30], pointers to the authoritative I574 records [results573.txt + sweep573.json 95,597 B + rules573.md 4,169 B], the zero-src diff confirmation, the no-sweep574 confirmation, the RECORD + REGISTER pointer [I570 pattern, registrations a-e on file in the I574 entry], and the E78 precedent [Branch C, H 0.400 EXACT at sweep567, accept-with-documentation, CLOSED I568]) + bookkeeping (epics E80 ST-542 VOID DONE I575 + Status/Next -> I576 / stories ST-542 line / active / timeline / CHANGELOG via the - I561: anchor).\n" +
  "- Zero src CONFIRMED: `git diff 99098a7..HEAD -- src/ assets/ vendor/` EMPTY (HEAD = 544d7a9, the I574 commit). config.js:322 stays maxHp: 30. No sweep574 exists or is expected (it only ran if the lever was applied - it was not).\n" +
  "- Progress: E80 IN PROGRESS (accept round) - ST-540 DONE I573 / ST-541 DONE I574 (Branch C adjudicated) / ST-542 VOID DONE I575 (this) / ST-543 (I576) G80.0 close gate PENDING.\n" +
  "- Quality bar 6/6 (docs-only): npm test 1,237/1,237; npm run build 0; dist 6,430,174 B / 203 byte-identical; vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7); hygiene (zero servers/tabs - no server started this iteration).\n" +
  "- Next: I576 (ST-543) = G80.0 close gate (CLOSEGATE576, clone .evidence/I572/run_closegate572.cjs via the .evidence/I572/clone572.cjs transform pattern; 5 fresh harnesses ALL EXACT NO re-pin [net-zero src since I572] + dist re-measure (expect byte-identical 6,430,174 B / 203) + CLOSE FLOOR E80 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked) + AGENTS.md item-4 refresh (insert the E80 clause, demote E79 to prior) + bookkeep (E80 CLOSED I576, ST-543 DONE) + quality bar 6/6 (the 5-harness gate) + commit + push delegate + verify. E80 CLOSED at G80.0.\n";
  s += entry;
  if (bomCount(s) !== b0) throw new Error("iterations BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("iterations OK, bytes " + fs.statSync(p).size);
}

// ---------- timeline.md (LF, BOM 3) : append I575 line ----------
{
  const p = "production/timeline.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I575 (ST-542, E80) done: the written record for why this round's planned boss health trim was not applied is now on file - the frozen pre-check said the wave-5 boss, not the wave-10 boss, was the biggest killer, and the frozen rules say that means no trim this round. The round is a no-change accept; nothing in the game itself changed, and the bundle is unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  s += line;
  if (bomCount(s) !== b0) throw new Error("timeline BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("timeline OK, bytes " + fs.statSync(p).size);
}

// ---------- CHANGELOG.md (LF, BOM 7) : insert after the I561 line (before I574) ----------
{
  const p = "CHANGELOG.md";
  let s = read(p);
  const b0 = bomCount(s);
  const a = "Nothing else changed.\n- I574:";
  assertOnce(s, a, "changelog I561->I574");
  const entry = "- I575: No visible change - the written record for this round's no-change accept is now on file: our frozen rules looked at the pre-check measurement (the wave-5 boss as the biggest killer) and said the planned wave-10 boss health trim does not apply this round, so there was nothing to apply. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  s = s.replace(a, "Nothing else changed.\n" + entry + "- I574:");
  if (bomCount(s) !== b0) throw new Error("changelog BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("changelog OK, bytes " + fs.statSync(p).size);
}

// ---------- active.md (CRLF, BOM 0) : append NEXT line ----------
{
  const p = "production/session-state/active.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I575 = I576 (ST-543) G80.0 close gate: CLOSEGATE576 = clone .evidence/I572/run_closegate572.cjs via the .evidence/I572/clone572.cjs transform pattern (label CLOSEGATE572 -> CLOSEGATE576, output names); 5 fresh harnesses ALL EXACT NO re-pin (net-zero src since I572): causal495 (dist :4200, expect CAUSAL495 PASS, 3 arms) / causal483 (dev :5173, score 11334) / playframe483+491 (dev :5173; trust the I572 runner's pinned values - read the runner before running) / pwa491 (dist :5199, SUMMARY 11/11); runner self-kills servers, port-free verified per step; then dist re-measure (expect byte-identical 6,430,174 B / 203) + CLOSE FLOOR E80 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked) + AGENTS.md item-4 refresh (insert the E80 clause, demote E79 to prior, BOM 1 mixed - byte-safe splice) + bookkeep (E80 CLOSED I576 / ST-543 DONE / active / timeline / CHANGELOG) + quality bar 6/6 (the 5-harness gate) + commit + push delegate + verify. E80 CLOSED at G80.0; then I577+ next epic per the standing queue (scope-check first).\r\n";
  s += line;
  if (bomCount(s) !== b0) throw new Error("active BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("active OK, bytes " + fs.statSync(p).size);
}
console.log("BOOKKEEP575 DONE");