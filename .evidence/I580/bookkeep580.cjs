// I580 bookkeeper: AGENTS.md item-4 E81 clause splice (E80 demoted to prior), epics E81 CLOSED I580
// (header + ST-547 DONE + Status/Next with the E82+ residual registration), stories ST-547 line append,
// iterations I580 entry append, timeline I580 line append, CHANGELOG insert between the I579 and I576 lines,
// active NEXT-at-I581+ line append.
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

// ---------- AGENTS.md (CRLF, BOM 1): item-4 - insert the E81 clause, demote E80 to prior ----------
{
  const p = "AGENTS.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "CLOSE FLOOR E80 = 969,826 B measured at G80.0 (I576: 7,400,000 - 6,430,174 fresh dist re-measured EXACT [byte-identical to I575 - E80 accept round, zero src change]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E80 CLOSED I576); prior CLOSE FLOOR E79";
  assertOnce(s0, a, "AGENTS item-4 E80 clause");
  const r = "CLOSE FLOOR E81 = 969,826 B measured at G81.0 (I580: 7,400,000 - 6,430,174 fresh dist re-measured EXACT [byte-identical to I576 - E81 accept round, gap case: the frozen lever boss.burst.every stayed UNAPPLIED, zero src change]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E81 CLOSED I580); prior CLOSE FLOOR E80 = 969,826 B measured at G80.0 (I576: 7,400,000 - 6,430,174 fresh dist re-measured EXACT [byte-identical to I575 - E80 accept round, zero src change]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E80 CLOSED I576); prior CLOSE FLOOR E79";
  const s = s0.replace(a, r);
  if (bomCount(s) !== b0) throw new Error("AGENTS BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("agents OK, bytes " + fs.statSync(p).size);
}

// ---------- epics.md (CRLF, BOM 3): E81 header CLOSED, ST-547 DONE, Status/Next refresh ----------
{
  const p = "production/epics.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("epics: expected trailing CRLF");

  const a1 = "## E81 - Wave-5 Monolith Wall (frozen E81 lever: boss.burst.every 4.0 -> 4.8) - OPEN I577";
  assertOnce(s0, a1, "epics E81 header");
  const r1 = "## E81 - Wave-5 Monolith Wall (frozen E81 lever: boss.burst.every 4.0 -> 4.8) - CLOSED I580 (opened I577)";

  const a2 = "ST-547 PENDING I580 (G81.0 close gate: clone of the .evidence/I576 runner pattern).";
  assertOnce(s0, a2, "epics ST-547 PENDING");
  const r2 = "ST-547 DONE I580 (G81.0 close gate: CLOSEGATE580 5 fresh harnesses ALL EXACT NO re-pin [net-zero src since I572]: causal495 PASS 3 arms seed-9876 [webgl frozen classic + default EXACT; webgpu report-only] / causal483 CAUSAL456 PASS (score 11334) / playframe483+491 PLAYFRAME456 PASS (A 22/32,717 + 11/180, B 52/73,172) / pwa491 SUMMARY 11/11; dist re-measured 6,430,174 B / 203 byte-identical; CLOSE FLOOR E81 = 969,826 B re-derived WITH MEASUREMENT; AGENTS.md item-4 refreshed; E81 CLOSED I580 as an accept round).";

  const a3 = "- Status: OPEN (opened I577; ST-545 DONE I578 - sweep577: all three frozen branches false (B56 11/30, M56 7/30 -> uncovered cell, drafting gap in the frozen adjudication) -> RECORD + REGISTER per the frozen divergence rule (I570 pattern), the frozen lever NOT applied, zero src; ST-546 VOID DONE I579 - C-equivalent VOID + accept, docs-only, zero src; accept round in progress, E78/E79 pattern). Pre-state local == origin afde28c (I578, push-verified). Next owner: I580 (ST-547) G81.0 close gate.";
  assertOnce(s0, a3, "epics E81 Status line");
  const r3 = "- Status: CLOSED I580 (G81.0 close gate; opened I577; accept round - gap case: the sweep577 pre-lever re-audit (I578) landed in an uncovered cell of the frozen adjudication (B56 11/30, M56 7/30: (B) 11 < 12 / (A*) in range but M56 7 < 8 / (C) 11 > 9 - all three literal branches false, drafting gap) -> RECORD + REGISTER (I570 pattern), the frozen lever NOT applied [config.js:300 stays every: 4.0], ST-546 VOID I579, zero src throughout, E78/E79/E80 pattern). Residual registration (E82+ backlog, WITH the full measurement record): the wave-5 Monolith wall remains THE live wall (band span 7-12/30 across five samples: 567 10 / 569 7 / 571 9 / 573 12 / 577 11) - a teach/pacing question, NOT a frozen lever; the frozen E81 lever (boss.burst.every 4.0 -> 4.8) stays UNAPPLIED/registered; the E81 pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6, preference order, ONE chosen by that epic's own frozen rules] carries to E82+; PROCESS FINDING: future frozen adjudications must explicitly tile the (B56, M56) metric space; E82+ governed by the frozen E70 protocol (fresh research + scope-check first). Next: I581+ next epic per the standing queue [candidates: the registered residual wave-5 Monolith wall WITH the gap-case record + the P1/P2/P3 pattern-lever registration + the UNAPPLIED frozen lever / main-character art remaster (Blender) / camera far-framing + cockpit polish / new enemies / linear levels + bosses].";

  let s = s0;
  s = s.replace(a1, r1);
  s = s.replace(a2, r2);
  s = s.replace(a3, r3);
  if (bomCount(s) !== b0) throw new Error("epics BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("epics OK, bytes " + fs.statSync(p).size);
}

// ---------- stories.md (tail-LF, BOM 5): append the ST-547 line ----------
{
  const p = "production/stories.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("stories: expected trailing LF");
  const line = "- ST-547 E81 G81.0 close gate (I580) - DONE I580: CLOSEGATE580 (clone of the .evidence/I576 runner pattern via .evidence/I580/clone580.cjs; run_closegate580.cjs + 5 harness .outs in .evidence/I580/; runner self-kills servers, port-free verified per step; dist :4200 / dev :5173 / dist-pwa :5199) - 5 fresh harnesses ALL EXACT NO re-pin (net-zero src since I572 - I577/I578/I579 zero src): causal495 PASS 3 arms (webgl frozen classic reference + default EXACT on the seed-9876 pin set; webgpu report-only) / causal483 CAUSAL456 PASS (score 11334) / playframe483+491 PLAYFRAME456 PASS (A 22/32,717 + 11/180, B 52/73,172) / pwa491 SUMMARY 11/11 - dist re-measure 6,430,174 B / 203 byte-identical (fresh walk) - CLOSE FLOOR E81 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked) - AGENTS.md item-4 refreshed (E81 clause inserted WITH the gap-case accept-round note, E80 demoted to prior: byte-safe unique-anchor splice; BOM 1 CRLF preserved) - E81 DoD 3/3 -> E81 CLOSED I580 (accept round: gap-case adjudication I578 on sweep577 [all three frozen branches false: B56 11/30, M56 7/30 -> uncovered cell -> RECORD + REGISTER, lever NOT applied], ST-546 VOID I579, gate I580; E78/E79/E80 pattern) - zero src/assets/vendor/render/i18n - quality bar 6/6 (5-harness gate set): tests 1,237/1,237, build 0, dist 6,430,174 B / 203 byte-identical, vendor 4/4 EXACT, BOM delta 0, hygiene (runner self-kills servers, port-free verified; zero browser tabs)\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("stories BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("stories OK, bytes " + fs.statSync(p).size);
}

// ---------- iterations.md (tail-LF, BOM 5): append the I580 entry ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I580 (ST-547, E81): G81.0 close gate - E81 CLOSED (accept round, gap case) - docs-only\n" +
  "\n" +
  "- Pre-state: local == origin 602df95 (I579, ST-546 VOID DONE, push-verified via subagent Russell). Tree clean apart from the new untracked .evidence/I580/.\n" +
  "- Change: ZERO src/assets/vendor/render/i18n (.evidence + docs only): .evidence/I580/ [clone580.cjs (writer: run_closegate580.cjs cloned from .evidence/I576/run_closegate576.cjs via asserted-unique replacements - header/expected/OUTDIR/final label - identical harness set + ports) + run_closegate580.cjs + 5 harness .out + closegate580.console.txt + bookkeep580.cjs + commit-msg artifact] + bookkeeping (AGENTS.md item-4 E81 clause / epics E81 CLOSED I580 [header + ST-547 DONE + Status/Next with the E82+ residual registration] / stories ST-547 line / active NEXT at I581+ / timeline / CHANGELOG via the I579->I576 anchor).\n" +
  "- CLOSEGATE580 (5 fresh harnesses; runner self-kills servers; all 4 ports 5173/4173/4200/5199 re-verified FREE post-run): causal495 (dist :4200) -> CAUSAL495 PASS (3 arms: webgl frozen classic reference + default EXACT on the seed-9876 pin set; webgpu report-only) / causal483 (dev :5173) -> CAUSAL456 PASS (score 11334) / playframe483 (dev :5173) -> PLAYFRAME456 PASS / playframe491 (dev :5173) -> PLAYFRAME456 PASS (A 22/32,717 + 11/180, B 52/73,172 - the I572 runner's pinned values, current since the I541/I542 ship v7 re-pin; NO re-pin - impossible: net-zero src since I572 [I577/I578/I579 zero src]) / pwa491 (dist :5199) -> SUMMARY 11/11 (SW + manifest + offline boot).\n" +
  "- dist re-measured EXACT 6,430,174 B / 203 (byte-identical to I576 - E81 accept round, zero src change) -> CLOSE FLOOR E81 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked).\n" +
  "- AGENTS.md item-4 refresh (BOM 1 CRLF, byte-safe unique-anchor splice): inserted the E81 clause (CLOSE FLOOR E81 = 969,826 B measured at G81.0, WITH the gap-case accept-round note), demoted the E80 clause to prior; the dist chain line unchanged; item-6 pins unchanged (net-zero src).\n" +
  "- E81 DoD 3/3: (1) five fresh harnesses EXACT (this) / (2) dist re-measured + CLOSE FLOOR E81 WITH MEASUREMENT (this) / (3) AGENTS.md item-4 refreshed + E81 CLOSED + residual registration + quality bar 6/6 (this). E81 CLOSED I580 as an accept round (E78/E79/E80 pattern - gap case: the frozen lever boss.burst.every 4.0 -> 4.8 adjudicated UNAPPLIED at I578 on sweep577 - all three frozen branches false -> uncovered cell -> RECORD + REGISTER (I570 pattern); ST-546 VOID DONE I579; zero src throughout).\n" +
  "- Residual registration (E82+ backlog, WITH the full measurement record): (a) the wave-5 Monolith wall remains THE live wall (band span 7-12/30 across five samples: 567 10 / 569 7 / 571 9 / 573 12 / 577 11) - a teach/pacing question, NOT a frozen lever / (b) the frozen E81 lever (boss.burst.every 4.0 -> 4.8) stays UNAPPLIED/registered / (c) the E81 pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6, preference order, ONE chosen by that epic's own frozen rules] carries to E82+ / (d) PROCESS FINDING: future frozen adjudications must explicitly tile the (B56, M56) metric space / (e) E82+ governed by the frozen E70 protocol (fresh research + scope-check first).\n" +
  "- Progress: E81 CLOSED - ST-544 DONE I577 (open + research + scope-check) / ST-545 DONE I578 (sweep577 pre-lever re-audit - gap case) / ST-546 VOID DONE I579 (E78 pattern) / ST-547 DONE I580 (G81.0 close gate, this).\n" +
  "- Quality bar 6/6 (docs-only): npm test 1,237/1,237; npm run build 0; dist 6,430,174 B / 203 byte-identical (re-measured); vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1 / CHANGELOG 7 - splices/appends preserve heads); hygiene (runner self-kills servers, port-free verified per step; zero browser tabs; zero terminals left running).\n" +
  "- Next: I581+ = next epic per the standing queue (scope-check FIRST - frozen E70 protocol: fresh research + scope-check before any freeze). Candidates: (1) the registered residual wave-5 Monolith wall WITH the full gap-case record + the P1/P2/P3 pattern-lever registration + the UNAPPLIED frozen lever / (2) main-character art remaster (Blender) / (3) camera far-framing + cockpit first-person polish / (4) new enemies / (5) linear level design + bosses.\n";
  const s = s0 + entry;
  if (bomCount(s) !== b0) throw new Error("iterations BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("iterations OK, bytes " + fs.statSync(p).size);
}

// ---------- timeline.md (LF, BOM 3): append the I580 line ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I580 (ST-547, E81) done: the round's final check passed - all five automated play tests came back exactly as they were before the round started, confirming nothing in the game changed. The round is closed as a no-change accept: the wave-5 boss's burst-cadence trim stays registered for a future round, along with the gap in the frozen decision rules and a note to make them gap-free next time. The bundle is unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("timeline BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("timeline OK, bytes " + fs.statSync(p).size);
}

// ---------- CHANGELOG.md (LF, no trailing newline, BOM 7): insert between the I579 and I576 lines ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "is confirmed as not applied this round (it stays registered for a future round). Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n- I576:";
  assertOnce(s0, a, "changelog I579->I576");
  const entry = "- I580: No visible change - the round's final check passed: all five automated play tests came back exactly as they were before the round started, and the round is closed as a no-change accept - the wave-5 boss trim we considered stays registered for a future round, together with a note to close the gap in the decision rules. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s = s0.replace(a, "is confirmed as not applied this round (it stays registered for a future round). Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n" + entry + "- I576:");
  if (bomCount(s) !== b0) throw new Error("changelog BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("changelog OK, bytes " + fs.statSync(p).size);
}

// ---------- active.md (CRLF, BOM 0): append the NEXT-at-I581+ line ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I581+ = next epic per the standing queue (scope-check FIRST - frozen E70 protocol: fresh research + scope-check before any freeze). Candidates: (1) the registered residual wave-5 Monolith wall - now WITH the full measurement record: the gap-case record (sweep577: B56 11/30, M56 7/30 -> uncovered cell), the band span 7-12/30 across five samples, the P1/P2/P3 pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6] + the UNAPPLIED frozen lever (boss.burst.every 4.0 -> 4.8) + the PROCESS FINDING (d) [a future epic's frozen adjudication must explicitly tile the (B56, M56) metric space] / (2) main-character art remaster (Blender) / (3) camera far-framing + cockpit first-person polish / (4) new enemies / (5) linear level design + bosses. Art/Blender work is NOT E81 - it is its own new epic.\r\n";
  const s = s0 + line;
  if (bomCount(s) !== b0) throw new Error("active BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("active OK, bytes " + fs.statSync(p).size);
}
console.log("BOOKKEEP580 DONE");