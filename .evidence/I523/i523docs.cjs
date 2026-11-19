// I523/ST-489: E70 open bookkeeping (docs-only). Byte-preserving: latin1 round-trip,
// rep1 single-anchor asserts, head16 BOM guard per file (copied from i522docs.cjs).
const fs = require("fs");
let fails = 0;
function hex16(p) { return fs.readFileSync(p).slice(0, 16).toString("hex"); }
function rep1(s, a, r, label) { const n = s.split(a).length - 1; if (n !== 1) { console.log("FAIL " + label + " anchor count " + n); fails++; throw new Error(label); } return s.split(a).join(r); }
function edit(p, fn, label) {
  const before = hex16(p);
  const b = fs.readFileSync(p);
  const s = b.toString("latin1");
  const out = fn(s);
  fs.writeFileSync(p, Buffer.from(out, "latin1"));
  const after = hex16(p);
  if (before !== after) { console.log("FAIL " + label + " BOM/head bytes changed " + before + " -> " + after); fails++; }
  console.log("OK " + label + " head16 " + before);
}
const EP = "E:/Game/production/epics.md";
const ST = "E:/Game/production/stories.md";
const IT = "E:/Game/production/iterations.md";
const TL = "E:/Game/production/timeline.md";
const CL = "E:/Game/CHANGELOG.md";
const AC = "E:/Game/production/session-state/active.md";

const EPICS_BLOCK = "## E70 - Endless Balance Follow-up (R1 phantom TTK + R7 wave-5-12 beatability) WITH MEASUREMENT - IN PROGRESS (opened I523)\n"
+ "- Goal: the two E69 residuals deferred at I522 (spec Appendix A.4) - R1 phantom kiter TTK 1.4667 s < 2.0 s floor + R7 0/10 wave-20 (deaths on waves 5-12, i.e. pre-E69 content) + the R8 re-measure they gate - balanced WITH MEASUREMENT per house culture: pre-registered levers + deterministic branch rules BEFORE any config move, smallest lever first, at most one tuning pass per story, residuals ship documented.\n"
+ "- Research: design/e70-balance-followup-research.md (I523: residuals verbatim + frozen criteria, measured state [incl. the Splicer/Warden alternation finding - the wave-10 heavyweight is NOT the Monolith], S1-S8 web sources + F1-F9 findings, R1 lever analysis [Option B enterDur 1.2 -> 2.0 primary / Option A hp 2 -> 3 fallback + 5-step decision rule], R7 diagnosis [H1 heavyweight wall / H2 leak regime / H3 pilot wall] + ST-491 attribution protocol + frozen deterministic branch rules B/A/C, dist policy, cut ladder, risks, story map + estimates, telemetry) + production/scope-check-E70.md.\n"
+ "- Stories: ST-489 (I523) open/research/scope - DONE I523 (docs-only zero src). ST-490 R1 fix WITH MEASUREMENT (baseline re-confirm -> Option B -> re-measure R1/R2/R5 -> decision rule ship / fallback Option A / accept-with-documentation -> spec Appendix B BEFORE/AFTER). ST-491 R7 diagnosis harness (ship-hit source payload tag, no logic/RNG change; 10-seed sweep 52700+i full wave-1 director cap 36000 ticks; killing-blow histogram + per-wave deaths + resource state). ST-492 R7 lever WITH MEASUREMENT (branch from ST-491 data: B dominant-heavyweight lever from the frozen ordered list / A smallest pressure lever from the frozen candidates / C accept-with-documentation; fresh sweep -> R7 >= 6/10 + R8 recompute). ST-493 G70.0 close gate (fresh 5-harness re-runs + CLOSE FLOOR re-derived WITH MEASUREMENT + quality bar + bookkeeping + commit/push).\n"
+ "- Constraints: core bit-identical - all 5 harness pins EXPECTED EXACT through the epic (every lever gates wave >= 5 [roster/boss] or >= 13 [phantom]; pin windows are wave 1-2 / MENU); config-only levers; at most one tuning pass per story (fallback levers pre-registered, not second fiddle passes); no Blender / no new assets (fleet 31 GLBs unchanged); dist ceiling 6,100,000 B HOLDS (no renegotiation anticipated); no pilot changes (instrument change, branch C only).\n"
+ "- Cut ladder (scope-check): C1 R7 sweep < 6/10 after the allowed pass -> accept-with-documentation (epic still closes) / C2 R1 Option B -> Option A -> accept / C3 drop R8 re-measure if R7 unreachable (derived).\n"
+ "- Risks: K1 pre-E69 core touched (branch A levers) -> wave-gate pin argument + measurement + one-pass cap / K2 pilot-change temptation = instrument change (branch C only) / K3 TTK over-correction > 12 s -> harness band catches / K4 dist negligible (< 10 KB vs 845,066 B headroom) / K5 10-seed artifact -> deterministic branch rules, not discretion.\n"
+ "- Status: OPEN (I523). ST-489 DONE I523 (research + scope + this open, docs-only zero src - dist byte-identical 5,254,934 B/184, vendor UNCHANGED, pins EXPECTED EXACT through the epic; Splicer/Warden alternation finding: wave-10 heavyweight = Splicer 30 hp or Warden, NOT the Monolith - ST-491 attributes before lever choice). Next: I524 = ST-490 (R1 WITH MEASUREMENT; Option B enterDur 1.2->2.0 primary, Option A hp 2->3 fallback).";

edit(EP, (s) => {
  s = rep1(s, "## E69 - New Enemy Fleet (Phantom / Hauler / Bulwark) + Campaign Level 4 - OPEN (opened I514)",
           "## E69 - New Enemy Fleet (Phantom / Hauler / Bulwark) + Campaign Level 4 - CLOSED (opened I514, closed I522)", "B1");
  s = rep1(s, "standing-queue items (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass).",
           "standing-queue items (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass).\n\n" + EPICS_BLOCK, "B2");
  return s;
}, "epics.md");

edit(ST, (s) => {
  const line = "STATUS (I523): ST-489 DONE (I523) - E70 OPEN: endless balance follow-up research + scope WITH pre-registered levers/branches (docs-only, zero src): design/e70-balance-followup-research.md [residuals verbatim from spec Appendix A.4 + frozen criteria from .evidence/I521/rules.md; measured state (RECOUNT 6/10 heavyweight-wave deaths + 4/10 adjacent against [5,10,5,5,12,8,10,11,10,6]; Splicer/Warden alternation finding - wave-10 heavyweight = Splicer (30 hp, undestroyable spiral) or Warden (18), NOT the Monolith [bossSpawnCount parity + Warden substitution, game.js:592]; phantom config facts [8.2 s cycle, targetable ~71%]; pre-E69 roster; build/budget/pin state; S1-S8 web sources + F1-F9 findings; R1 lever analysis sec.3 [Option B PRIMARY phantom.enterDur 1.2 -> 2.0, predicted TTK ~2.27 s UNVERIFIED / Option A FALLBACK phantom.hp 2 -> 3 [identity cost: tougher than the stinger rung] / 5-step decision rule / pin safety wave-13+ gate]; R7 diagnosis sec.4 [H1 heavyweight wall / H2 leak regime / H3 pilot wall; ST-491 attribution protocol: 10 seeds 52700+i, full wave-1 director, cap 36000 ticks, ship-hit source payload tag - payload only, no logic/RNG change; deterministic branches B [heavyweight >= 6/10 -> dominant-class lever from the frozen ordered list] / A [one non-heavyweight source >= 4/10 -> smallest pressure lever from the frozen candidates] / C [accept-with-documentation; pilot trio frozen I328]; success = fresh sweep wave-20 >= 6/10 + R8 recompute]; dist policy sec.5 [code/config-only, ceiling 6,100,000 B HOLDS, zero new assets]; cut ladder sec.6 C1-C3; risks sec.7 K1-K5; story map + estimates sec.8 [ST-489..ST-493, 5-7 iters, strictly linear]; telemetry sec.9 [the ST-491 harness IS the telemetry]; changed files sec.10; verification sec.11] + production/scope-check-E70.md (10 sections mirroring E69) + E69 header doc-fix (epics.md: OPEN (opened I514) -> CLOSED (opened I514, closed I522)) + epics E70 block - dist byte-identical 5,254,934 B/184 (zero src) - 1,187/1,187 + build 0 + vendor pins EXACT 8/8 + BOM delta 0 + hygiene (no server, no tab).\r\n";
  const a = "STATUS (I522): ST-488 DONE (I522)";
  return rep1(s, a, line + a, "C1");
}, "stories.md");

const IT_ENTRY = "## I523 - ST-489: E70 open - endless balance follow-up research + scope WITH pre-registered levers/branches (docs-only, zero src)\n"
+ "- R1 Research doc written: design/e70-balance-followup-research.md (residuals verbatim from spec Appendix A.4 + frozen criteria from .evidence/I521/rules.md; measured state: RECOUNT 6/10 heavyweight-wave deaths + 4/10 adjacent against the recorded array [5,10,5,5,12,8,10,11,10,6]; Splicer/Warden alternation finding - wave-10 heavyweight = Splicer (30 hp, undestroyable spiral) or Warden (18), NOT the Monolith [bossSpawnCount parity + Warden substitution, game.js:592]; phantom config facts (8.2 s cycle, targetable ~71%); pre-E69 roster table; build/budget/pin state; S1-S8 web sources [YouTube chapter-level cites] + F1-F9 findings).\n"
+ "- R2 R1 levers pre-registered (sec.3): Option B PRIMARY phantom.enterDur 1.2 -> 2.0 (predicted TTK ~2.27 s UNVERIFIED; cycle 8.2 -> 9.0 s; targetable 71% -> ~64%) / Option A FALLBACK phantom.hp 2 -> 3 (identity cost: tougher than the stinger rung) / 5-step decision rule (baseline re-confirm -> B -> ship or revert+A -> accept-with-documentation) / pin safety (wave-13+ gate -> EXPECTED EXACT).\n"
+ "- R3 R7 branch rules pre-registered (sec.4): hypotheses H1 heavyweight wall / H2 leak regime / H3 pilot wall; ST-491 attribution protocol frozen (10 seeds 52700+i, full wave-1 director, cap 36000 ticks, ship-hit source payload tag - payload only, no logic/RNG change); deterministic branches B (heavyweight >= 6/10 -> dominant-class lever from the frozen ordered list [Monolith ringEvery 2.0->2.5 first, same-class ladder ringCount/maxHp]) / A (one non-heavyweight source >= 4/10 -> smallest pressure lever from the frozen candidates) / C (accept-with-documentation; pilot trio frozen I328); success = fresh sweep wave-20 >= 6/10 + R8 recompute.\n"
+ "- R4 Scope check written: production/scope-check-E70.md (10 sections mirroring E69: measured state / scope fit / stories ST-489..ST-493 / pin expectations ALL EXPECTED EXACT / dist + asset policy [code/config-only, ceiling 6,100,000 B HOLDS, zero new assets] / cut ladder C1-C3 / deferrals [queue b, queue c - Pages blocked option C stable, enemy art pass, level 5, support-buff] / risks K1-K5 / verification bar / changed files + next).\n"
+ "- R5 E69 header doc-fix: production/epics.md E69 header OPEN (opened I514) -> CLOSED (opened I514, closed I522) (the Status line was already fixed at I522; the header line lagged).\n"
+ "- R6 Bookkeeping: epics E70 block / stories STATUS I523 / iterations I523 / timeline I523 / CHANGELOG I523 / active.md I523 note (finalize after push).\n"
+ "- Quality bar 6/6 (docs-only, measured): 1,187/1,187 + build 0 + dist byte-identical 5,254,934 B/184 + vendor diff empty + BOM delta 0 + hygiene (no server, no tab).\n"
+ "- Next: I524 = ST-490 (R1 WITH MEASUREMENT; decision rule step 1 = baseline re-confirm on 62100+i x 100).\n";
edit(IT, (s) => {
  const a = "standing-queue items (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass).\n";
  return rep1(s, a, a + IT_ENTRY, "D1");
}, "iterations.md");

edit(TL, (s) => {
  const a = "standing queue [camera+FPV / PWA+mobile+menu / enemy art pass].)\n";
  return rep1(s, a, a + "- 2026-11-19  I523 (ST-489: E70 open - endless balance follow-up research + scope WITH pre-registered levers/branches [docs-only zero src]: research doc [RECOUNT 6/10 + 4/10, Splicer/Warden finding, S1-S8/F1-F9, R1 Option B enterDur 1.2->2.0 primary + Option A fallback + decision rule, R7 branches B/A/C + ST-491 protocol] + scope-check-E70 (10 sections) + E69 header doc-fix + E70 block; 1,187 tests; dist 5,254,934 B/184 byte-identical; vendor pins EXACT 8/8. Next: I524 = ST-490 (R1 WITH MEASUREMENT) / standing queue [camera+FPV / PWA+mobile+menu / enemy art pass].)\n", "E1");
}, "timeline.md");

edit(CL, (s) => {
  const a = "## [Unreleased]\r\n";
  const line = "- I523: ST-489 E70 - E70 open: endless balance follow-up research + scope WITH pre-registered levers/branches (docs-only; zero src/assets/vendor change) - design/e70-balance-followup-research.md written (residuals verbatim from spec Appendix A.4 + frozen criteria; measured state [RECOUNT 6/10 heavyweight-wave + 4/10 adjacent deaths; Splicer/Warden alternation finding: wave-10 heavyweight = Splicer 30 hp or Warden, NOT the Monolith]; S1-S8 web sources + F1-F9 findings; R1 lever analysis [Option B phantom.enterDur 1.2 -> 2.0 primary / Option A phantom.hp 2 -> 3 fallback / 5-step decision rule]; R7 diagnosis [H1 heavyweight wall / H2 leak regime / H3 pilot wall] + ST-491 attribution protocol [ship-hit source payload tag, no logic/RNG change] + frozen deterministic branch rules [B/A/C]) + production/scope-check-E70.md (10 sections) + E69 header doc-fix (OPEN -> CLOSED (opened I514, closed I522)) + E70 epic block + quality bar 6/6 (1,187/1,187 + build 0 + dist 5,254,934 B/184 byte-identical + vendor pins EXACT 8/8 + BOM delta 0 + hygiene [no server, no tab]). Next: I524 = ST-490 (R1 WITH MEASUREMENT) / standing-queue items (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass).\r\n";
  return rep1(s, a, a + line, "F1");
}, "CHANGELOG.md");

edit(AC, (s) => {
  const a = "standing queue (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art pass).\n";
  const line = "- notes: I523 in progress (ST-489 E70 - endless balance follow-up research + scope WITH pre-registered levers/branches, docs-only zero src): design/e70-balance-followup-research.md [sec.0-11: residuals verbatim + frozen criteria; measured state (RECOUNT 6/10 heavyweight + 4/10 adjacent; Splicer/Warden alternation finding - wave-10 = Splicer 30 hp or Warden, NOT Monolith); S1-S8 + F1-F9; R1 levers (Option B enterDur 1.2->2.0 primary / Option A hp 2->3 fallback / 5-step decision rule); R7 hypotheses H1-H3 + ST-491 attribution protocol + frozen branch rules B/A/C; dist policy; cut ladder C1-C3; risks K1-K5; story map + estimates 5-7 iters; telemetry = the ST-491 harness] + production/scope-check-E70.md (10 sections) + E69 header doc-fix + epics E70 block. 1,187/1,187 + build 0 + dist byte-identical 5,254,934 B/184 + vendor EXACT 8/8 + BOM delta 0 + hygiene (no server, no tab). Committed (this story) + push pending. Next: I524 = ST-490 (R1 WITH MEASUREMENT; decision rule step 1 = baseline re-confirm 62100+i) / standing queue (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art pass).\n";
  return rep1(s, a, a + line, "G1");
}, "active.md");

console.log(fails === 0 ? "ALL EDITS OK" : "FAILURES: " + fails);
