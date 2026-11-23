// I583 bookkeeper (C1 outcome): epics E82 ST-550 VOID I583 (C1) + Status refresh,
// stories ST-550 line append, iterations I583 entry append, timeline I583 line append,
// CHANGELOG insert above the I582 line, active NEXT-at-I584 line append.
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
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

// ---------- epics.md (CRLF, BOM 3): ST-550 VOID I583 (C1) + Status refresh ----------
{
  const p = "production/epics.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("epics: expected trailing CRLF");
  const a1 = "ST-550 PENDING I583 (APPLY confirmed by Branch B at I582 [B56 12/30 >= 12/30]: lever one line [config.js:300 every: 4.0 -> 4.8] + sweep582 [30 fresh seeds 58200+i] + acceptance (a)-(e); C1 on acceptance failure)";
  assertOnce(s0, a1, "epics ST-550 PENDING");
  const r1 = "ST-550 VOID I583 (C1: the FROZEN E82 lever was APPLIED [config.js:300 every: 4.0 -> 4.8; git diff exactly 1 line] then REVERTED [git restore; tree clean] after the frozen post-lever acceptance failed; sweep582 30 FRESH seeds 58200+i MEASURED (a) B56 9/30 PASS [<= 9; baseline sweep577 11/30, sweep581 12/30] / (b) M56' 9/30 FAIL [> 7; M56 E81 def 8/30] / (c) median death wave 9 PASS [>= 9; sweep581 8] / (d) reach wave >= 13: 1/30 FAIL [>= 3; best 58208 wave 13 (207,767 pts)] -> accept-with-documentation, no visible change; the wall is PARTIALLY BROKEN: band deaths 12/30 -> 9/30, postKillResidual 4 -> 1, aimed-class share rose 1/11 -> 4/9 [slower burst cadence lengthens aimed-bolt on-screen residency, carried S3 insight now MEASURED]; P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 REGISTERED to E83+ [ONE chosen by that epic's own frozen rules after its own fresh pre-lever sweep + adjudication; scope-check FIRST per the frozen E70 protocol])";
  let s1 = s0.replace(a1, r1);
  const a2 = "- Status: OPEN (opened I581; ST-548 DONE I581 - open + research + scope-check, docs-only zero src; ST-549 DONE I582 - sweep581: BRANCH B FIRED [B56 12/30 >= 12/30] -> the FROZEN E82 lever boss.burst.every 4.0 -> 4.8 APPLIES at I583 (ST-550), zero src). Pre-state local == origin d1f5a50 (I581, push-verified). dist policy EXPECTED byte-identical 6,430,174 B / 203 (I582 zero src). Next owner: I583 (ST-550) lever apply + sweep582 + acceptance (a)-(e).";
  assertOnce(s1, a2, "epics E82 Status");
  const r2 = "- Status: OPEN (opened I581; ST-548 DONE I581 - open + research + scope-check, docs-only zero src; ST-549 DONE I582 - sweep581: BRANCH B FIRED [B56 12/30 >= 12/30] -> the FROZEN E82 lever applies at I583 (ST-550), zero src; ST-550 VOID I583 (C1) - the lever was applied then REVERTED [git restore; sweep582 acceptance (a) PASS 9/30, (b) FAIL 9/30, (c) PASS 9, (d) FAIL 1/30 -> C1 per the frozen rules]; P1/P2/P3 registered to E83+). Pre-state local == origin 55a83f4 (I582, push-verified). dist policy EXPECTED byte-identical 6,430,174 B / 203 (I583 net-zero src after the C1 revert). Next owner: I584 (ST-551) G82.0 close gate (CLOSEGATE584, accept round).";
  s1 = s1.replace(a2, r2);
  if (bomCount(s1) !== b0) throw new Error("epics BOM delta");
  write(p, s1);
  console.log("epics.md OK");
}

// ---------- stories.md (tail-LF, BOM 5): ST-550 line append ----------
{
  const p = "production/stories.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n") || s0.endsWith("\r\n")) throw new Error("stories: expected trailing bare LF");
  const line = "ST-550 E82 sweep582 post-lever validation (I583) - VOID I583 (C1): the FROZEN E82 lever boss.burst.every 4.0 -> 4.8 (config.js:300, one line) was APPLIED (git diff exactly 1 line) then REVERTED (git restore, tree clean) after the frozen acceptance failed - 30 FRESH seeds 58200+i, full director from wave 1, frozen I328 kiter verbatim, cap 36000 ticks @ 1/60, in-process (wall 15,447 ms), zero servers/tabs; rules582.md FROZEN PRE-RUN in .evidence/I583/ (5,079 B; lineage of .evidence/I582/rules581.md, E82 labels; sec.3 = FROZEN post-lever acceptance (a)-(e); metric code VERBATIM from sweep581.mjs) - MEASURED: 30/30 died, median death wave 9, death-wave dist wave5 x8 / wave6 x1 / wave7 x1 / wave8 x4 / wave9 x3 / wave10 x9 / wave11 x1 / wave12 x2 / wave13 x1, tally (primary) MONOLITH 8 / gunship 6 / SPLICER 5 / bullet_unknown 4 / rock_M 3 / rock_S 2 / sentry 1 / mine 1, H = 13/30 = 0.433 - ACCEPTANCE (a)-(d): (a) B56 <= 9/30 PASS [9/30; baseline 11/30 sweep577, 12/30 sweep581] / (b) M56' <= 7/30 FAIL [9/30; M56 E81 def 8/30] / (c) median death wave >= 9 PASS [9] / (d) >= 3/30 reach wave >= 13 FAIL [1/30; best 58208 wave 13 (207,767 pts); sweep577 6/30, sweep581 1/30] -> C1 FIRES (frozen: any (a)-(d) failure) - band detail (extract582): 9/30 band deaths (8 wave 5 + 1 wave 6), ALL source=bullet; inFight=8 + postKillResidual=1 (seed 58212: Monolith died 30 ticks [0.5 s] before the player - down from 4 post-kill deaths pre-lever); V-DECODE burst-class 5 / aimed-class 4 / ambiguous 0 (aimed share rose vs sweep577 1/11 and sweep581 1/12 - slower burst cadence lengthens the on-screen residency of the aimed bolts, the carried S3 insight) - READING: the cadence lever moved the wall (B56 12 -> 9; median 8 -> 9; postKillResidual 4 -> 1) but not past the frozen bars; the residual wall is now a MIX of burst-class and aimed-class deaths - P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 REGISTERED to E83+ (ONE chosen by that epic's own frozen rules after its own fresh pre-lever sweep + adjudication; scope-check FIRST per the frozen E70 protocol) - net-zero src CONFIRMED (git status clean; config.js:300 back to every: 4.0; the L304 phase-2 comment (4.0 -> 2.6 s) is accurate again post-revert) - quality bar 6/6 (net-zero: tests 1,237/1,237 / build 0 / dist byte-identical 6,430,174 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene [zero servers/tabs])\n";
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("stories BOM delta");
  write(p, s1);
  console.log("stories.md OK");
}

// ---------- iterations.md (tail-LF, BOM 5): I583 entry append ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I583 (ST-550, E82): lever boss.burst.every 4.0 -> 4.8 APPLIED then REVERTED (C1) - sweep582 post-lever validation - MEASURED (a) PASS 9/30 (b) FAIL 9/30 (c) PASS 9 (d) FAIL 1/30 - accept-with-documentation; P1/P2/P3 registered to E83+\n\n"
    + "- Pre-state: local == origin 55a83f4 (I582, E82 OPEN, push-verified). Tree clean apart from the new untracked .evidence/I583/.\n"
    + "- Change: ONE src line during the round, REVERTED by C1 (net zero at commit): src/core/config.js:300 every: 4.0 -> 4.8 (applied via .evidence/I583/apply_lever583.cjs; git diff = exactly 1 insertion / 1 deletion; reverted via git restore after the frozen acceptance failed; the L304 phase-2 comment (4.0 -> 2.6 s) was stale during the lever window only and is accurate again post-revert - the frozen lever is exactly one line).\n"
    + "- .evidence/I583/: rules582.md (5,079 B, FROZEN PRE-RUN - post-lever validation rules; acceptance (a)-(e); C1 definition; invariants: kiter/attribution/metric code VERBATIM) + clone_sweep.cjs (6,955 B; line-asserted clone of .evidence/I582/sweep581.mjs; two MEASURED patches: the source has 327 split elements [no trailing NL, not the assumed 328] + the line-326 predicate needed a doubled backslash [JS escape vs literal source text]) + sweep582.mjs (17,543 B; kiter + bullet attribution + metric code VERBATIM [kiter verbatim OK]; ONLY the header/seeds/output-labels/branch block changed -> the FROZEN acceptance block) + sweep582.json (100,067 B, authoritative per-run) + results582.txt (6,261 B) + extract582.cjs (6,539 B) + extract582.txt (3,520 B) + clone_gate.cjs (1,532 B) + run_gate583.cjs (3,526 B, NOT RUN - the (e) gate runs only on all-(a)-(d)-pass; the C1 branch closes G82.0 via CLOSEGATE584 at I584) + apply_lever583.cjs (615 B) + patch_len.cjs (480 B) + patch_pred.cjs (430 B) + bookkeep583.cjs + commit-msg-I583.txt.\n"
    + "- Sweep582 (30 FRESH seeds 58200+i, full director from wave 1, frozen I328 kiter VERBATIM, cap 36000 ticks @ 1/60; wall ms 15,447; rules582.md FROZEN PRE-RUN; post-lever: boss.burst.every 4.8): 30/30 died, median death wave 9, death-wave dist wave5 x8 / wave6 x1 / wave7 x1 / wave8 x4 / wave9 x3 / wave10 x9 / wave11 x1 / wave12 x2 / wave13 x1, tally (primary) MONOLITH 8 / gunship 6 / SPLICER 5 / bullet_unknown 4 / rock_M 3 / rock_S 2 / sentry 1 / mine 1, H = 13/30 = 0.433. ACCEPTANCE (rules582.md sec.3 FROZEN): (a) B56 <= 9/30 PASS [9/30; baseline sweep577 11/30, sweep581 12/30] / (b) M56' <= 7/30 FAIL [9/30; M56 E81 def 8/30; R-6 comparability only] / (c) median death wave >= 9 PASS [9; sweep577 9, sweep581 8] / (d) >= 3/30 reach wave >= 13 FAIL [1/30; best 58208 wave 13 (207,767 pts); sweep577 6/30, sweep581 1/30] / (e) NOT RUN (C1 branch).\n"
    + "- Band detail (extract582): 9/30 band deaths (8 wave 5 + 1 wave 6), ALL source=bullet; inFight=8 + postKillResidual=1 (seed 58212: the Monolith died 30 ticks [0.5 s] before the player - down from 4 post-kill deaths pre-lever); V-DECODE burst-class=5 / aimed-class=4 / ambiguous=0 - the aimed share ROSE vs sweep577 (1/11) and sweep581 (1/12): slower burst cadence lengthens the on-screen residency of the aimed bolts (the carried S3 insight, now MEASURED); MONOLITHprimary=8 + bullet_unknown=1.\n"
    + "- C1 (FROZEN, rules582.md sec.4 / E82 doc sec.6): git restore src/core/config.js (config.js:300 back to every: 4.0; git status clean) + ST-550 VOID (accept-with-documentation) + P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 REGISTERED to E83+ (ONE chosen by that epic's own frozen rules after its own fresh pre-lever sweep + adjudication; scope-check FIRST per the frozen E70 protocol).\n"
    + "- Reading: the cadence lever moved the wall (B56 12/30 -> 9/30; median 8 -> 9; postKillResidual 4 -> 1) but not past the frozen bars; the residual wall is now a MIX of burst-class (5) and aimed-class (4) deaths -> E83 must choose among P1/P2/P3 on its own fresh measurement; the aimed-class growth gives E83's frozen rules a NEW signal to adjudicate (P3 fireEvery 2.2 -> 2.6 or P1 count 12 -> 9 are the candidates most aligned with the measured mix; P2 was rejected at E81/E82 on S3 residency grounds - revisit only under E83's own frozen rules).\n"
    + "- Quality bar 6/6: npm test 1,237/1,237; npm run build 0; dist re-measured 6,430,174 B / 203 byte-identical (C1 revert -> net-zero src, as expected); vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (AGENTS 1 / epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7); hygiene (all 4 ports 5173/4173/4200/5199 free; zero browser tabs; zero terminals left running). No (e) gate (C1 branch - the gate is an acceptance criterion of the all-pass branch only; G82.0 closes via CLOSEGATE584 at I584).\n"
    + "- Next I584 (ST-551): G82.0 close gate (CLOSEGATE584, accept round - clone of the .evidence/I580 runner pattern: 5 fresh harnesses ALL EXACT NO re-pin + dist re-measure + CLOSE FLOOR E82 = 7,400,000 - measured re-derived WITH MEASUREMENT [headroom >= 102,400 B floor -> cut ladder NOT invoked] + AGENTS.md item-4 refresh [E82 clause: lever REVERTED, wall partially broken, P1/P2/P3 to E83+] + E82 CLOSED + push delegate Russell 01a2074b-ac3f-7112-ad6a-a6c9f5653e27).\n";
  const s1 = s0 + entry;
  if (bomCount(s1) !== b0) throw new Error("iterations BOM delta");
  write(p, s1);
  console.log("iterations.md OK");
}

// ---------- timeline.md (LF, BOM 3, trailing \n): I583 line append ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I583 (ST-550, E82) done: the fresh thirty-run check for the wave-5 boss's burst-cadence trim ran with the trim in place (the boss's big radial bursts every 4.8 s instead of 4.0 s), and the result was mixed: the wall took a real dent - deaths at wave 5/6 dropped from eleven to nine of thirty, the typical pilot now dies at wave 9 instead of wave 8, and only one of the nine wall deaths came from a bolt left over after the boss was already dead (four before) - but the remaining wall deaths now split five-to-four between the wide burst and the boss's aimed single bolts (before, ten of eleven were the wide burst), and two of the frozen pass bars were missed (nine of thirty wall deaths against a bar of seven; one of thirty pilots got past wave 12 against a bar of three). Per the frozen rules the trim was pulled back out of the game and the wall is documented as partially broken, not gone: three candidate follow-up tweaks (fewer bolts per burst, slower bolts, or a slower aimed-bolt rhythm) are registered for a future round, where one will be chosen by that round's own frozen rules. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("timeline BOM delta");
  write(p, s1);
  console.log("timeline.md OK");
}

// ---------- CHANGELOG.md (LF, NO trailing NL, BOM 7): I583 line above the I582 line ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "- I582: ";
  assertOnce(s0, a, "changelog I582 line");
  const entry = "- I583: No visible change - the fresh thirty-run check for the wave-5 boss's burst-cadence trim ran with the trim in place, and the result was mixed: the trim genuinely helped (deaths at the wall dropped from eleven to nine of thirty, the typical pilot now lasts to wave 9 instead of wave 8, and the remaining wall deaths split five-to-four between the wide burst and the boss's aimed single bolts), but two of the frozen pass bars were missed, so per the frozen rules the trim was pulled back out and the game is exactly as before; three candidate follow-up tweaks (fewer bolts per burst, slower bolts, or a slower aimed-bolt rhythm) are registered for a future round, where one will be chosen by that round's own frozen rules. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  const s1 = s0.replace(a, entry + a);
  if (bomCount(s1) !== b0) throw new Error("changelog BOM delta");
  write(p, s1);
  console.log("CHANGELOG.md OK");
}

// ---------- active.md (CRLF, BOM 0, trailing \r\n): NEXT-at-I584 line append ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I584 = ST-551 (E82): G82.0 close gate (CLOSEGATE584, accept round - clone the .evidence/I580 runner pattern: 5 fresh harnesses ALL EXACT NO re-pin + dist re-measure + CLOSE FLOOR E82 = 7,400,000 - measured re-derived WITH MEASUREMENT [headroom >= 102,400 B floor -> cut ladder NOT invoked] + AGENTS.md item-4 refresh [E82 clause inserted: lever REVERTED, wall partially broken, P1/P2/P3 to E83+; E81 demoted to prior] + E82 CLOSED + push delegate Russell 01a2074b-ac3f-7112-ad6a-a6c9f5653e27).\r\n";
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("active BOM delta");
  write(p, s1);
  console.log("active.md OK");
}

console.log("BOOKKEEP583 DONE");