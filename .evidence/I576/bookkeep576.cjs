// I576 bookkeeper: AGENTS.md item-4 (E80 clause + E79 demoted), epics E80 CLOSED I576 (header + ST-543 DONE + Status/Next),
// stories ST-543 line, iterations I576 entry, timeline I576 line, CHANGELOG insert after the I561 anchor, active [DONE at I576].
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

// ---------- AGENTS.md (BOM 1, mixed endings) : item-4 E80 clause ----------
{
  const p = "AGENTS.md";
  let s = read(p);
  const b0 = bomCount(s);
  const a1 = "CLOSE FLOOR E79 = 969,826 B measured at G79.0 (I572: 7,400,000 - 6,430,174 fresh dist re-measured EXACT [byte-identical to I571 - E79 accept round, zero src change]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E79 CLOSED I572); prior";
  const r1 = "CLOSE FLOOR E80 = 969,826 B measured at G80.0 (I576: 7,400,000 - 6,430,174 fresh dist re-measured EXACT [byte-identical to I575 - E80 accept round, zero src change]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E80 CLOSED I576); prior CLOSE FLOOR E79 = 969,826 B measured at G79.0 (I572: 7,400,000 - 6,430,174 fresh dist re-measured EXACT [byte-identical to I571 - E79 accept round, zero src change]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E79 CLOSED I572); prior";
  assertOnce(s, a1, "agents item-4 E79 clause");
  s = s.replace(a1, r1);
  if (bomCount(s) !== b0) throw new Error("agents BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("agents OK, bytes " + fs.statSync(p).size);
}

// ---------- epics.md (CRLF, BOM 3) : 3 in-line splices ----------
{
  const p = "production/epics.md";
  let s = read(p);
  const b0 = bomCount(s);
  const a1 = "## E80 - Splicer Wave-10 Wall (frozen E70 lever [2]: splicer.maxHp 30 -> 24) - OPEN (opened I573)";
  const r1 = "## E80 - Splicer Wave-10 Wall (frozen E70 lever [2]: splicer.maxHp 30 -> 24) - CLOSED I576 (opened I573)";
  assertOnce(s, a1, "epics E80 header");
  s = s.replace(a1, r1);
  const a2 = "ST-543 PENDING I576 (G80.0 close gate).";
  const r2 = "ST-543 DONE I576 (G80.0 close gate: CLOSEGATE576 [run_closegate576.cjs, clone of .evidence/I572/run_closegate572.cjs via .evidence/I576/clone576.cjs] 5 fresh harnesses ALL EXACT NO re-pin (net-zero src since I572): causal495 CAUSAL495 PASS 3 arms (webgl frozen classic reference + default EXACT on the seed-9876 pin set; webgpu report-only) on dist :4200 / causal483 CAUSAL456 PASS (score 11334) on dev :5173 / playframe483 + playframe491 PLAYFRAME456 PASS (A 22/32,717 + 11/180, B 52/73,172) on dev :5173 / pwa491 SUMMARY 11/11 on dist :5199; runner self-kills servers, port-free verified per step; dist re-measured EXACT 6,430,174 B / 203 byte-identical [I574/I575 zero src]; CLOSE FLOOR E80 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked); AGENTS.md item-4 refreshed [E80 clause inserted, E79 demoted to prior]; E80 CLOSED I576).";
  assertOnce(s, a2, "epics ST-543");
  s = s.replace(a2, r2);
  const a3 = "Status: OPEN (opened I573; ST-541 DONE I574 - Branch C adjudicated on sweep573, lever [2] NOT applied, zero src; ST-542 VOID DONE I575 (docs-only, zero src confirmed); accept round, E78/E79 pattern). Next owner: I576 (ST-543) G80.0 close gate (CLOSEGATE576).";
  const r3 = "Status: CLOSED I576 (G80.0 close gate; opened I573; accept round - Branch C adjudicated I574 on sweep573 [H 17/30 = 0.567 < 0.600, SPLICER 7/30 NOT largest [MONOLITH 10/30 is], W10 9/30 < W5 12/30], ST-542 VOID I575, zero src throughout, E78/E79 pattern). Residual registration (E81+ backlog, WITH the full measurement record): the live wall on the post-E80 tree = the wave-5 Monolith fight (sweep573: wave-5 band 12/30, MONOLITH 10/30 = largest single source; R-3 realized) - a teach/pacing question, NOT a frozen lever; seed-variance span 0.400-0.667 across five same-tree samples (565/567/569/571/573); the Splicer's wave-10 cluster below the pre-registered band (9/30, SPLICER 6) - the frozen E70 lever [2] (splicer.maxHp 30 -> 24) stays UNAPPLIED/registered for a future epic whose own fresh re-audit adjudicates SPLICER-dominant; the L-A boss-retirement mechanism stays NOT re-attempted (shown inert in E79); E81+ governed by the frozen E70 protocol (fresh research + scope-check first). Next: I577+ next epic per the standing queue [candidates: main-character art remaster (Blender) / camera far-distance framing + cockpit first-person polish / new enemies / linear level design + bosses / the wave-5 Monolith live wall] - scope-check first.";
  assertOnce(s, a3, "epics E80 Status");
  s = s.replace(a3, r3);
  if (bomCount(s) !== b0) throw new Error("epics BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("epics OK, bytes " + fs.statSync(p).size);
}

// ---------- stories.md (LF-ish, BOM 5) : append ST-543 line ----------
{
  const p = "production/stories.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\n")) throw new Error("stories: expected trailing LF");
  const line = "- ST-543 E80 G80.0 close gate (I576) - DONE I576: CLOSEGATE576 (run_closegate576.cjs cloned from .evidence/I572/run_closegate572.cjs via .evidence/I576/clone576.cjs - 4 asserted-unique replacements, identical harness set + ports): 5 fresh harnesses ALL EXACT NO re-pin (net-zero src since I572 - I573/I574/I575 zero src): causal495 (dist :4200) -> CAUSAL495 PASS (3 arms: webgl frozen classic reference + default EXACT on the seed-9876 pin set; webgpu report-only) / causal483 (dev :5173) -> CAUSAL456 PASS (score 11334) / playframe483 + playframe491 (dev :5173) -> PLAYFRAME456 PASS (A 22/32,717 + 11/180, B 52/73,172 - the I572 runner's pinned values, current since the I541/I542 ship v7 re-pin; NO re-pin - impossible: net-zero src) / pwa491 (dist :5199) -> SUMMARY 11/11 (SW + manifest + offline boot); runner self-kills servers, port-free verified per step (all 3 ports 0 listeners pre-run + after); dist re-measured EXACT 6,430,174 B / 203 byte-identical (I574/I575 zero src) -> CLOSE FLOOR E80 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked); AGENTS.md item-4 refreshed (E80 clause inserted, E79 demoted to prior; BOM 1 delta 0, byte-safe unique-anchor splice); E80 DoD 3/3 -> E80 CLOSED I576 (accept round: Branch C I574 + ST-542 VOID I575 + gate I576); quality bar 6/6 (the 5-harness gate set: tests 1,237/1,237 / build 0 / dist byte-identical / vendor 4/4 EXACT / BOM delta 0 / hygiene: runner self-kills servers, port-free verified, zero browser tabs)\n";
  s += line;
  if (bomCount(s) !== b0) throw new Error("stories BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("stories OK, bytes " + fs.statSync(p).size);
}

// ---------- iterations.md (mixed, BOM 5) : append I576 entry ----------
{
  const p = "production/iterations.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I576 (ST-543, E80): G80.0 close gate - E80 CLOSED - CLOSEGATE576 5 fresh harnesses ALL EXACT NO re-pin [causal495 PASS 3 arms (webgl frozen classic + default EXACT seed-9876; webgpu report-only) + causal483 CAUSAL456 PASS (score 11334) + playframe483/491 A 22/32,717 + 11/180, B 52/73,172 + pwa491 SUMMARY 11/11; runner self-kills servers, port-free verified per step] - NO re-pin (net-zero src since I572) - CLOSE FLOOR E80 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174 byte-identical) - AGENTS.md item-4 refreshed (E80 clause inserted, E79 demoted to prior) - zero src/assets/vendor/render/i18n - docs/config-state only\n" +
  "\n" +
  "- Pre-state: local == origin f818342 (I575, ST-542 VOID DONE, push-verified via subagent). Tree clean apart from the new untracked .evidence/I576/.\n" +
  "- Change: ZERO src/assets/vendor/render/i18n (.evidence + docs only): .evidence/I576/ [clone576.cjs (writer: run_closegate576.cjs cloned from .evidence/I572/run_closegate572.cjs via 4 asserted-unique replacements - header/expected/OUTDIR/final label - identical harness set + ports) + run_closegate576.cjs + 5 harness .out + closegate576.console.txt + bookkeep576.cjs + commit-msg artifact] + bookkeeping (epics E80 CLOSED I576 [header + ST-543 DONE + Status/Next with the E81+ residual registration] / stories ST-543 line / active [DONE at I576] / timeline / CHANGELOG via the - I561: anchor / AGENTS.md item-4).\n" +
  "- CLOSEGATE576 (5 fresh harnesses; runner self-kills servers, port-free verified per step; all 3 ports 0 listeners pre-run): causal495 (dist :4200) -> CAUSAL495 PASS (3 arms: webgl frozen classic reference + default EXACT on the seed-9876 pin set; webgpu report-only) / causal483 (dev :5173) -> CAUSAL456 PASS (score 11334) / playframe483 (dev :5173) -> PLAYFRAME456 PASS / playframe491 (dev :5173) -> PLAYFRAME456 PASS (A 22/32,717 + 11/180, B 52/73,172 - the I572 runner's pinned values, current since the I541/I542 ship v7 re-pin; NO re-pin - impossible: net-zero src since I572 [I573/I574/I575 zero src]) / pwa491 (dist :5199) -> SUMMARY 11/11 (SW + manifest + offline boot).\n" +
  "- dist re-measured EXACT 6,430,174 B / 203 (byte-identical to I575) -> CLOSE FLOOR E80 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked).\n" +
  "- AGENTS.md item-4 refresh (BOM 1, byte-safe unique-anchor splice): inserted the E80 clause (CLOSE FLOOR E80 = 969,826 B measured at G80.0), demoted the E79 clause to prior (mirror of the I572 E79 addition); the dist chain line unchanged (ends at I565 6,430,174); item-6 pins unchanged (net-zero src).\n" +
  "- E80 DoD 3/3: (1) the frozen lever round executed per the frozen rules (Branch C adjudicated at I574 on the fresh sweep573 re-audit; lever [2] NOT applied; RECORD + REGISTER for the material divergence, I570 pattern) / (2) the VOID formalized docs-only at I575 (zero src confirmed via git diff 99098a7..HEAD EMPTY) / (3) the G80.0 gate ALL EXACT (this). E80 CLOSED I576 as an accept round (E78/E79 pattern).\n" +
  "- Residual registration (E81+ backlog, WITH the full measurement record): the live wall on the post-E80 tree = the wave-5 Monolith fight (sweep573: wave-5 band 12/30, MONOLITH 10/30 = largest single source; R-3 realized) - a teach/pacing question, NOT a frozen lever; seed-variance span 0.400-0.667 across five same-tree samples (565/567/569/571/573); the Splicer's wave-10 cluster below band (9/30, SPLICER 6) - frozen lever [2] stays UNAPPLIED/registered for a future epic whose own fresh re-audit adjudicates SPLICER-dominant; the L-A retirement stays not re-attempted (inert in E79); E81+ governed by the frozen E70 protocol (fresh research + scope-check first).\n" +
  "- Quality bar 6/6 (the 5-harness gate set): npm test 1,237/1,237; npm run build 0; dist 6,430,174 B / 203 byte-identical; vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1 / CHANGELOG 7); hygiene (runner self-kills servers, port-free verified per step; zero browser tabs).\n" +
  "- Next: I577+ - next epic per the standing queue (scope-check first). Candidates: the registered post-E80 live wall (wave-5 Monolith fight - fresh E70-protocol research + scope-check needed first) / main-character art remaster (Blender) / camera far-distance framing + cockpit first-person polish / new enemies / linear level design + bosses.\n";
  s += entry;
  if (bomCount(s) !== b0) throw new Error("iterations BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("iterations OK, bytes " + fs.statSync(p).size);
}

// ---------- timeline.md (LF, BOM 3) : append I576 line ----------
{
  const p = "production/timeline.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I576 (ST-543, E80) done: the round's final check passed - all five automated play tests came back exactly as they were before the round started, confirming nothing in the game changed. The round is closed as a no-change accept: the planned boss health trim was not applied (the frozen pre-check found the wave-5 boss, not the wave-10 boss, was the bigger obstacle), and that decision is now fully on file. The bundle is unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  s += line;
  if (bomCount(s) !== b0) throw new Error("timeline BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("timeline OK, bytes " + fs.statSync(p).size);
}

// ---------- CHANGELOG.md (LF, BOM 7) : insert after the I561 line (before I575) ----------
{
  const p = "CHANGELOG.md";
  let s = read(p);
  const b0 = bomCount(s);
  const a = "Nothing else changed.\n- I575:";
  assertOnce(s, a, "changelog I561->I575");
  const entry = "- I576: No visible change - this round's final check confirmed nothing changed: all five automated play tests came back exactly as before, the bundle is byte-identical, and the round closes as a no-change accept (the planned boss health trim was not applied because the frozen pre-check found the wave-5 boss, not the wave-10 boss, was the bigger obstacle). Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  s = s.replace(a, "Nothing else changed.\n" + entry + "- I575:");
  if (bomCount(s) !== b0) throw new Error("changelog BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("changelog OK, bytes " + fs.statSync(p).size);
}

// ---------- active.md (CRLF, BOM 0) : append [DONE at I576] to the I575 NEXT line ----------
{
  const p = "production/session-state/active.md";
  let s = read(p);
  const b0 = bomCount(s);
  if (!s.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const a = "E80 CLOSED at G80.0; then I577+ next epic per the standing queue (scope-check first).";
  assertOnce(s, a, "active I575 NEXT tail");
  const r = a + " [DONE at I576: CLOSEGATE576 5/5 EXACT no re-pin [causal495 CAUSAL495 PASS 3 arms seed-9876 + causal483 CAUSAL456 PASS score 11334 + playframe483/491 A 22/32,717 + 11/180, B 52/73,172 + pwa491 SUMMARY 11/11; all ports free; run_closegate576.cjs self-kills servers]; CLOSE FLOOR E80 = 969,826 B WITH MEASUREMENT [7,400,000 - 6,430,174 byte-identical; headroom >= 102,400 B floor -> cut ladder NOT invoked]; AGENTS.md item-4 refreshed [E80 clause inserted, E79 demoted to prior]; E80 CLOSED I576]";
  s = s.replace(a, r);
  if (bomCount(s) !== b0) throw new Error("active BOM delta");
  fs.writeFileSync(p, s, "utf8");
  console.log("active OK, bytes " + fs.statSync(p).size);
}
console.log("BOOKKEEP576 DONE");