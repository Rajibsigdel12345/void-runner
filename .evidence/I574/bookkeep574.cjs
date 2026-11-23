// I574 bookkeeper: epics E80 (ST-541 DONE + ST-542 VOID-pending + Status/Next), stories ST-541 line,
// iterations I574 entry, timeline I574 line, CHANGELOG insert after the I561 anchor, active NEXT line.
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
  const a1 = "ST-541 PENDING I574 (sweep573 pre-lever re-audit: 30 FRESH seeds 57300+i, rules573 FROZEN PRE-RUN, adjudication B/A*/C frozen, in-process) / ST-542 PENDING I575 (CONDITIONAL: lever [2] one line + sweep574 (30 fresh seeds 57400+i) + acceptance (a)-(e), or VOID on Branch C; C1 path on acceptance failure)";
  const r1 = "ST-541 DONE I574 (sweep573 pre-lever re-audit: 30 FRESH seeds 57300+i, rules573.md FROZEN PRE-RUN in .evidence/I574/; MEASURED 30/30 died, median death wave 9, death-wave dist wave5 x12 / wave6 x1 / wave8 x1 / wave9 x5 / wave10 x9 / wave11 x2, tally (primary == strict) MONOLITH 10 / SPLICER 7 / bullet_unknown 5 / gunship 3 / rock_S 3 / rock_M 2, H = 17/30 = 0.567; ADJUDICATION INPUTS: SPLICER 7/30 NOT largest [largest = MONOLITH 10/30] | W10 9/30 | W5 12/30 -> BRANCH C (all three C sub-conditions hold) -> ST-542 VOID + accept (E78-lever pattern); MATERIAL divergence from the pre-registered expected outcome [SPLICER largest / W10 11-16/30 -> B or A*] RECORD + REGISTER per the frozen rule (I570 pattern): the wave-5 Monolith band RESURRECTED (R-3 realized, 12/30 vs sweep567 10 / sweep569 7 / sweep571 9) and is now the largest single source; the Splicer's wave-10 cluster is below the pre-registered band (9/30, SPLICER 6 of them); seed-variance span across five same-tree samples 0.400-0.667 (565 0.533 / 567 0.400 / 569 0.667 / 571 0.467 / 573 0.567); lever [2] NOT applied, zero src) / ST-542 VOID I575 (Branch C adjudicated at I574 on sweep573: no code change, no sweep574, E78-lever pattern; the VOID is formalized at I575 docs-only with the full measurement pointer + the E81+ registrations)";
  assertOnce(s, a1, "epics ST-541/542");
  s = s.replace(a1, r1);
  const a2 = "Status: OPEN (opened I573, ST-540 docs-only). Next owner: I574 (ST-541) sweep573 pre-lever re-audit.";
  const r2 = "Status: OPEN (opened I573; ST-541 DONE I574 - Branch C adjudicated on sweep573, lever [2] NOT applied, zero src; accept round in progress, E78/E79 pattern). Next owner: I575 (ST-542) VOID execution (docs-only) + then I576 (ST-543) G80.0 close gate.";
  assertOnce(s, a2, "epics E80 Status");
  s = s.replace(a2, r2);
  if (bomCount(s) !== b0) throw new Error("epics BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("epics OK, bytes " + fs.statSync(p).size);
}

// ---------- stories.md (LF-ish, BOM 5) : append ST-541 line ----------
{
  const p = "production/stories.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\n")) throw new Error("stories: expected trailing LF");
  const line = "- ST-541 E80 sweep573 pre-lever re-audit (I574) - DONE I574: 30 FRESH seeds 57300+i, full director from wave 1, frozen I328 kiter VERBATIM (as carried in .evidence/I570/sweep569.mjs), cap 36000 ticks @ 1/60, in-process zero servers/tabs; rules573.md FROZEN PRE-RUN in .evidence/I574/ (lineage of rules569.md, E80 labels; sec.3 = the FROZEN E80 B/A*/C adjudication verbatim from design/e80-splicer-wave10-wall-research.md sec.6 + the deterministic tie rule [SPLICER must strictly exceed every other class; a tie is not the largest]) - MEASURED: 30/30 died, median death wave 9, death-wave dist wave5 x12 / wave6 x1 / wave8 x1 / wave9 x5 / wave10 x9 / wave11 x2, tally (primary == strict) MONOLITH 10 / SPLICER 7 / bullet_unknown 5 / gunship 3 / rock_S 3 / rock_M 2, H = 17/30 = 0.567; ADJUDICATION INPUTS: SPLICER 7/30 NOT largest [largest = MONOLITH 10/30] | W10 9/30 | W5 12/30 -> BRANCH C (H < 0.600 AND SPLICER not largest AND W10 < W5 - all three C sub-conditions hold) -> ST-542 VOID + accept (E78-lever pattern); MATERIAL divergence from the pre-registered expected outcome (SPLICER largest, W10 11-16/30 -> B or A* most likely) RECORD + REGISTER per the frozen rule (I570 pattern): the wave-5 Monolith band RESURRECTED (R-3 realized, 12/30) and is now the largest single source - the live wall on this fresh sample is the wave-5 Monolith fight, not the Splicer's wave-10 fight; the Splicer's wave-10 cluster is below band (9/30, SPLICER 6 of them); best run seed 57302 wave 11 (169,751 pts / 481 kills, died SPLICER); 2/30 reached wave 11, 0/30 reached wave 12+; lever [2] NOT applied (config.js L322 stays 30), zero src; registrations carried to the E81+ backlog WITH the full measurement record (wave-5 Monolith fairness = teach/pacing question, NOT a frozen lever; the L-A retirement stays not re-attempted [shown inert in E79]; frozen lever [2] stays registered for a future epic whose own fresh re-audit adjudicates SPLICER-dominant; E80 closes at G80.0 as an accept round); quality bar 6/6 (docs-only: tests 1,237/1,237 / build 0 / dist byte-identical 6,430,174 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene zero servers/tabs)\n";
  s += line;
  if (bomCount(s) !== b0) throw new Error("stories BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("stories OK, bytes " + fs.statSync(p).size);
}

// ---------- iterations.md (mixed, BOM 5) : append I574 entry ----------
{
  const p = "production/iterations.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I574 (ST-541, E80): sweep573 pre-lever re-audit - BRANCH C adjudicated (H = 0.567; SPLICER 7/30 NOT the largest single source - MONOLITH 10/30 is; W10 9/30 < W5 12/30) -> ST-542 VOID + accept (E78 pattern); MATERIAL divergence from the pre-registered expected outcome, RECORD + REGISTER per the frozen rules (lever [2] NOT applied, zero src)\n" +
  "\n" +
  "- Pre-state: local == origin 99098a7 (I573, E80 OPEN, push-verified). Tree clean apart from the new untracked .evidence/I574/.\n" +
  "- Change: ZERO src/assets/vendor/render/i18n (.evidence + docs only): .evidence/I574/ [write573.cjs (writer: rules573.md FROZEN PRE-RUN + sweep573.mjs cloned from .evidence/I570/sweep569.mjs via 8 asserted-unique replacements + kiter/attribution VERBATIM asserts) + fix573/fix573b/fix573c.cjs (3 writer anchor repairs) + rules573.md (4,169 B, LF, no BOM - lineage of rules569.md, E80 labels; sec.3 = the FROZEN E80 B/A*/C adjudication verbatim from the research sec.6, incl. the deterministic tie rule: SPLICER must strictly exceed every other single-source class count, a tie is NOT the largest) + sweep573.mjs (17,043 B; kiter + bullet attribution VERBATIM; ONLY the header/seeds/output-labels/branch-decision block changed) + sweep573.json (authoritative per-run record) + results573.txt] + bookkeeping (epics E80 ST-541 DONE + ST-542 VOID-pending-I575 + Status/Next / stories ST-541 line / active / timeline / CHANGELOG via the - I561: anchor).\n" +
  "- Sweep573 (30 FRESH seeds 57300+i, full director from wave 1, frozen I328 kiter VERBATIM, cap 36000 ticks @ 1/60; wall ms 13,304; rules573.md FROZEN PRE-RUN): 30/30 died, median death wave 9, death-wave dist wave5 x12 / wave6 x1 / wave8 x1 / wave9 x5 / wave10 x9 / wave11 x2, tally (primary == strict) MONOLITH 10 / SPLICER 7 / bullet_unknown 5 / gunship 3 / rock_S 3 / rock_M 2, H = 17/30 = 0.567. ADJUDICATION INPUTS: SPLICER 7/30 [NOT largest; largest = MONOLITH 10/30] | W10 9/30 | W5 12/30 -> BRANCH C per the frozen rules (H 0.567 < 0.600; SPLICER not the largest single source; W10 < W5 - all three C sub-conditions hold).\n" +
  "- Band detail: the wave-5 Monolith band RESURRECTED (R-3 materialized): 12/30 (MONOLITH 9 + bullet_unknown 3; sweep567 10/30 / sweep569 7/30 / sweep571 9/30) - the currently-registered live wall is now the wave-5 Monolith fight itself on this fresh sample, not the Splicer's wave-10 fight as E80's premise held. The Splicer's wave-10 cluster = 9/30 (SPLICER 6 / bullet_unknown 1 / gunship 1 / rock_M 1) - below the pre-registered 11-16/30 band. Best run: seed 57302 wave 11 (169,751 pts / 481 kills, died SPLICER); 57301 also wave 11 (148,549 pts, died bullet_unknown); 0/30 reached wave 12+.\n" +
  "- ADJUDICATION (the frozen rules573.md sec.3 governs): the pre-registered expected outcome (SPLICER the largest single source, W10 11-16/30, H in the 0.400-0.667 span -> Branch B or A* most likely) did NOT hold - MONOLITH is the largest single source (10/30 vs SPLICER 7/30), W10 = 9/30 is below the band, and W5 = 12/30 > W10. This is a MATERIAL divergence. Per the frozen rule: RECORD + REGISTER in I574 before any code change (I570 pattern); the frozen lever [2] and the frozen acceptance are NOT re-derived; Branch C -> ST-542 VOID + accept (E78-lever pattern, docs-only close). Zero code change: src/core/config.js L322 stays maxHp: 30.\n" +
  "- Registrations (E81+ backlog, WITH the full measurement record): (a) the wave-5 Monolith band is the largest single source on this fresh sample (MONOLITH 10/30; 9 of the 10 are wave-5/6) - the live wall on the current tree is now the wave-5 Monolith fight (ring burst + residual bolt window), NOT the Splicer's wave-10 fight; (b) seed-variance span re-confirmed across five same-tree 30-seed samples: sweep565 0.533 / sweep567 0.400 / sweep569 0.667 / sweep571 0.467 / sweep573 0.567 - single-sample threshold adjudication is noisy in the diffuse zone (R-2; the frozen deterministic rule on each fresh sample still governs); (c) the Splicer's wave-10 fight persists but smaller than pre-registered (9/30; SPLICER 6 of them) - frozen lever [2] (splicer.maxHp 30 -> 24) stays UNAPPLIED/registered for a future epic whose own fresh re-audit adjudicates SPLICER-dominant; (d) E81+ is governed by the frozen E70 protocol: fresh research + scope-check, levers re-derived against the measured wall (the wave-5 Monolith fairness question is a teach/pacing question, NOT a frozen lever; the L-A retirement mechanism stays not re-attempted - shown inert in E79); (e) E80 closes at G80.0 as an accept round (E78/E79 pattern).\n" +
  "- Progress: E80 IN PROGRESS (accept round) - ST-540 DONE I573 / ST-541 DONE I574 (Branch C adjudicated) / ST-542 VOID I575 (Branch C; no code change, no sweep574) PENDING / ST-543 (I576) G80.0 close gate PENDING.\n" +
  "- Quality bar 6/6 (docs-only): npm test 1,237/1,237; npm run build 0; dist 6,430,174 B / 203 byte-identical; vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7); hygiene (zero servers/tabs - the sweep ran in-process, no server started).\n" +
  "- Next: I575 (ST-542) = VOID execution (docs-only, E78-lever pattern: confirm zero src change + record the Branch-C VOID with the full measurement pointer + no sweep574); then I576 (ST-543) = G80.0 close gate (CLOSEGATE576, clone .evidence/I572/run_closegate572.cjs; 5 fresh harnesses ALL EXACT NO re-pin + dist re-measure + CLOSE FLOOR E80 re-derived WITH MEASUREMENT + AGENTS.md item-4 refresh + E80 CLOSED + push delegate).\n";
  s += entry;
  if (bomCount(s) !== b0) throw new Error("iterations BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("iterations OK, bytes " + fs.statSync(p).size);
}

// ---------- timeline.md (LF, BOM 3) : append I574 line ----------
{
  const p = "production/timeline.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I574 (ST-541, E80) done: the pre-check for the wave-10 boss health trim came back different from the plan's expectation: on thirty fresh test pilots the median survival wave was 9, the wave-5 boss was the single biggest killer (ten of thirty runs, mostly its own wave), and the wave-10 boss's own fight was smaller than pre-registered (nine of thirty, six of them the boss itself). Per the frozen decision rules the planned health trim is not applied this round - the round is recorded as a no-change accept, and the wave-5 boss question is filed for a future round with the full measurement record. No gameplay or bundle changes; the bundle is unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  s += line;
  if (bomCount(s) !== b0) throw new Error("timeline BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("timeline OK, bytes " + fs.statSync(p).size);
}

// ---------- CHANGELOG.md (LF, BOM 7) : insert after the I561 line ----------
{
  const p = "CHANGELOG.md";
  let s = read(p);
  const b0 = bomCount(s);
  const a = "Nothing else changed.\n- I573:";
  assertOnce(s, a, "changelog I561->I573");
  const entry = "- I574: No visible change - before touching the wave-10 boss's health this round, we ran the frozen pre-check: on thirty fresh test pilots the median survival wave was 9, and the wave-5 boss came back as the single biggest killer (ten of thirty), while the wave-10 boss's own fight was smaller than we had pre-registered (nine of thirty, six of them the boss itself). Our frozen rules say that with the wave-5 band this strong the planned boss health trim is not applied this round - we recorded the full measurement, are closing the round as a no-change accept, and filed the wave-5 question for a future round. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  s = s.replace(a, "Nothing else changed.\n" + entry + "- I573:");
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
  const line = "- NEXT at I574 = ST-542 VOID execution (E80, Branch C): the sweep573 pre-lever re-audit (I574) measured 30/30 died, median death wave 9, H = 17/30 = 0.567, SPLICER 7/30 NOT the largest single source (MONOLITH 10/30 is - the wave-5 band RESURRECTED at 12/30, R-3 realized), W10 9/30 < W5 12/30 -> BRANCH C per the frozen rules573 sec.3 (H < 0.600 AND SPLICER not largest AND W10 < W5) -> ST-542 VOID + accept (E78-lever pattern, docs-only close); MATERIAL divergence from the pre-registered expected outcome recorded + registered (I570 pattern): the live wall on this fresh sample is the wave-5 Monolith fight, not the Splicer's wave-10 fight; the Splicer cluster is below the pre-registered band (9/30, SPLICER 6); lever [2] NOT applied (config.js L322 stays 30); registrations to the E81+ backlog WITH the full measurement record (wave-5 Monolith fairness question - teach/pacing, NOT a frozen lever; the L-A retirement stays not re-attempted [shown inert in E79]; frozen lever [2] stays registered for a future epic whose own fresh re-audit adjudicates SPLICER-dominant; E80 closes at G80.0 as an accept round). I575 = the VOID execution docs-only (confirm zero src + full record); then I576 (ST-543) = G80.0 close gate [CLOSEGATE576 clone of .evidence/I572/run_closegate572.cjs; 5 fresh harnesses ALL EXACT NO re-pin + dist re-measure + CLOSE FLOOR E80 re-derived WITH MEASUREMENT + AGENTS.md item-4 refresh + E80 CLOSED + push delegate].\r\n";
  s += line;
  if (bomCount(s) !== b0) throw new Error("active BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("active OK, bytes " + fs.statSync(p).size);
}
console.log("BOOKKEEP574 DONE");
