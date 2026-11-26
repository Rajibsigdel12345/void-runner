// I606 bookkeeping: 7 files, 12 patches (split/join count===1 or exact-tail endsWith; BOM delta 0; pure ASCII).
const fs = require("fs");
function load(p) { return fs.readFileSync(p, "utf8"); }
function save(p, s) { fs.writeFileSync(p, s, "utf8"); }
let ok = true;
function patch(file, mode, anchor, repl, tag) {
  let s = load(file);
  const bomBefore = s.split("\uFEFF").length - 1;
  if (mode === "rep") {
    const n = s.split(anchor).length - 1;
    if (n !== 1) { console.log("FAIL " + tag + " count=" + n); ok = false; return; }
    s = s.split(anchor).join(repl);
  } else {
    if (!s.endsWith(anchor)) { console.log("FAIL " + tag + " tail mismatch"); ok = false; return; }
    s = s + repl;
  }
  const bomAfter = s.split("\uFEFF").length - 1;
  if (bomBefore !== bomAfter) { console.log("FAIL " + tag + " BOM delta " + (bomAfter - bomBefore)); ok = false; return; }
  save(file, s);
  console.log("ok " + tag);
}
// 1. scope-check-E87.md (LF, no BOM) - 4 patches
const SC = "production/scope-check-E87.md";
patch(SC, "rep",
"| ST-572  | G2 implementation: main.js R2 gate replaced by the damped dolly DIRECTION",
"| ST-572  | DONE I606 - G2 implementation: main.js R2 gate replaced by the damped dolly DIRECTION",
"sc-row-status");
patch(SC, "rep",
"| ~+300 B expected (E87 budget <= 6,858,000 B / 204) |",
"| +335 B measured (6,854,043 B I605 -> 6,854,378 B / 204; within E87 budget <= 6,858,000 B) |",
"sc-row-dist");
patch(SC, "rep",
"- (to be filled at close: ST-572 G2 implementation + farframe604 re-run as acceptance / ST-571 CLOSEGATE 5/5 + fresh dist + CLOSE FLOOR E87)",
"- ST-572 (I606): tests 1,246/1,246 (+3 radialDollyDir). gateq606.mjs: 3,840 pose steps, 0 mismatches (src radialDollyDir bitwise-identical to the farframe604 G2 stepHeld sim). regression606: 2/2 EXACT zero re-pins (playframe A 22/62,472 + P 11/180, B 52/132,682; causal495 3-arm seed-9876). smoke606.json: OK=true, portFree=true, console 0/0, pageerror 0, bad 0; minDist 10.51 / maxDist 23.17 u, maxCamStep 2.613 u/frame; maxStepSettled 5.35 deg/frame at i=360 (the S re-entry swing, amended (d1) <= 30 deg/frame PASS; whole-flight maxStep 172.99 deg at i=5 = the scripted-ship-teleport catch-up artifact, i < settleI=6, documented - the I605 baseline 175.45 was the same artifact, metric refined WITH MEASUREMENT via patch_smoke606b.cjs). build: dist 6,854,378 B / 204 (+335 B from 6,854,043 I605), vendor 4/4 EXACT, within E87 budget <= 6,858,000 B. farframe604 re-run: G2 numbers exact (N2S maxRel 11.61 / S2N 10.86 / W2E 5.82 deg, maxTravel 2.829 / 4.063 / 1.850 u, drift 0.0271 / 0.0390 / 0.0157, shipFrameFail 0/0/0), verdicts a/b/c true, amendedD=true.\n- (to be filled at ST-571 close: G87.0 CLOSEGATE 5/5 + fresh dist re-measure + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh).",
"sc-evidence");
patch(SC, "rep",
"Next owner: I606 = ST-572 (G2 damped dolly direction per the amended design; ST-570 DONE I605, (d) re-frozen (d1)-(d5)).",
"Next owner: I607 = ST-571 (G87.0 close gate; ST-572 DONE I606 - G2 shipped: regression 2/2 EXACT zero re-pins, smoke606 maxStepSettled 5.35 deg/frame, dist 6,854,378 B / 204).",
"sc-nextowner");
// 2. epics.md (CRLF, BOM) - 3 patches
const EP = "production/epics.md";
patch(EP, "rep",
"## E87 - Far-framing fix (banded radial dolly backDir, endless only) - OPEN I605 (ST-568 DONE; ST-569 DONE; ST-570 DONE; ST-571/572 PENDING)",
"## E87 - Far-framing fix (banded radial dolly backDir, endless only) - OPEN I606 (ST-568 DONE; ST-569 DONE; ST-570 DONE; ST-572 DONE; ST-571 PENDING)",
"ep-header");
patch(EP, "rep",
"ST-572 (I606) G2 damped dolly direction implementation (config +1 lever azDeadband + cameraModel radialDollyDir additive + main.js gate replacement + unit tests +3 + farframe604 re-run as acceptance) - PENDING.",
"ST-572 (I606) G2 damped dolly direction implementation (config +1 lever azDeadband + cameraModel radialDollyDir additive + main.js gate replacement + unit tests +3 + farframe604 re-run as acceptance) - DONE I606: radialDollyDir pure additive helper (bit-identical to the farframe604 G2 stepHeld - gateq606 3,840 checks 0 mismatches) + main.js R2 gate replaced (damped dolly DIRECTION, the I604 dist>0.5 guard dropped on purpose = damp always; inside the band target PI/2 -> deadband -> null = exact legacy branch) + 3 unit tests (1,246/1,246) + regression 2/2 EXACT zero re-pins (playframe A 22/62,472 + P 11/180, B 52/132,682; causal495 3-arm) + smoke606 maxStepSettled 5.35 deg/frame at i=360 (S re-entry whip gone; whole-flight 172.99 deg at i=5 = the scripted-ship-teleport catch-up artifact, metric refined WITH MEASUREMENT) + dist 6,854,378 B / 204 (+335 B, within E87 budget <= 6,858,000 B) + farframe604 re-run G2 numbers exact (amendedD=true).",
"ep-stories");
patch(EP, "rep",
"- Status: OPEN I605 (ST-568 DONE I603 docs-only; ST-569 DONE I604 implementation + 5 unit tests + regression 2/2 EXACT zero re-pins; ST-570 DONE I605 verification probe + (d) re-freeze; ST-571/572 PENDING).",
"- Status: OPEN I606 (ST-568 DONE I603 docs-only; ST-569 DONE I604 implementation + 5 unit tests + regression 2/2 EXACT zero re-pins; ST-570 DONE I605 verification probe + (d) re-freeze; ST-572 DONE I606 G2 implementation - regression 2/2 EXACT zero re-pins, smoke maxStepSettled 5.35 deg/frame; ST-571 PENDING).",
"ep-status");
// 3. stories.md (mixed, BOM) - 1 patch
patch("production/stories.md", "rep",
"- ST-572 E87 G2 damped dolly direction implementation (I606) - PENDING: main.js R2 gate replaced by the damped dolly DIRECTION (held azimuth damps toward radial outside the band / legacy +Z PI/2 inside, ALWAYS while endless+PLAYING; backDir = (cos held, sin held) whenever abs(wrap(held - PI/2)) >= camera.dolly.azDeadband else null = exact legacy branch) + config.js +1 lever (camera.dolly.azDeadband 1e-4, commented) + cameraModel.js ADDITIVE pure radialDollyDir(prevHeld, targetAz, dist, band, dt, tau, deadband, out) (no alloc, shortest arc) + tests/cameraModel.test.js +3 (deadband identity -> null / outside-deadband dir / wraparound convergence to legacy inside the band) + acceptance = farframe604 G2 arm re-run against the amended (d1)-(d5) + quality bar (npm test ~1,246 / build 0 / vendor 4/4 / dist ~6,854,3xx within E87 budget <= 6,858,000 B / 204) + regression (pins EXACT expected; re-pin WITH MEASUREMENT per I570 if playframe B moves) + smoke re-run (crossing feel) + bookkeeping + commit + push delegate",
"- ST-572 E87 G2 damped dolly direction implementation (I606) - DONE I606: main.js R2 gate replaced by the damped dolly DIRECTION (radialDollyDir: held azimuth damps toward (dist >= band*arenaR ? radial azimuth : legacy PI/2) ALWAYS while endless+PLAYING - the I604 dist>0.5 guard dropped on purpose to match the G2 sim damp-always; backDir = (cos held, sin held) whenever abs(wrap(held - PI/2)) >= camera.dolly.azDeadband 1e-4 else null = the exact legacy branch) + config.js +1 lever (camera.dolly.azDeadband 1e-4, commented) + cameraModel.js ADDITIVE pure radialDollyDir(prevHeld, targetAz, dist, band, dt, tau, deadband, out) (writes {a, backDir or null, bd}, no alloc, shortest arc) + tests/cameraModel.test.js +3 (deadband identity -> backDir null / outside-deadband -> backDir === bd && (cos a, sin a) && converges to radial / wraparound -PI/2 to PI/2 300 steps -> a ~ PI/2 && backDir null) -> 1,246/1,246. gateq606.mjs: src radialDollyDir bitwise-identical to the farframe604 G2 stepHeld sim (8 helds x 480 poses = 3,840 steps, 0 mismatches). Regression 2/2 EXACT zero re-pins (run_regression606.cjs: playframe A 22/62,472 + P 11/180, B 52/132,682 - the B-window ship stays inside the band so G2 backDir is null there and the frame is bit-identical to legacy; causal495 3-arm seed-9876). smoke606.mjs (reseed 71401, 400 rAF frames scripted N->S rim crossing, dev :5173 self-start/self-kill): OK=true, portFree=true, console 0/0, pageerror 0, bad 0, minDist 10.51 / maxDist 23.17 u, maxCamStep 2.613 u/frame. Whole-flight maxStep 172.99 deg at i=5 = the scripted-ship-teleport catch-up artifact (the camera straight-line catch-up path crosses the teleported ship; i < settleI=6) - documented WITH MEASUREMENT: the I605 baseline 175.45 was the same artifact (identical teleport), so the metric was refined (patch_smoke606b.cjs, 5 patches count===1) to add settleI (first frame with ship-relative cam azimuth within 1 deg of the settled +90 deg) + maxStepSettledDeg (max step for steps whose previous frame is at/after settleI). maxStepSettled = 5.35 deg/frame at i=360 = the S re-entry swing (i=340 azRel +90 -> i=360 +165.1 -> i=380 -122.3 -> i=399 -100.6 = the damped arc across the west side over ~60 frames; amended (d1) <= 30 deg/frame PASS). farframe604.mjs re-run: G2 numbers exact (N2S maxRel 11.61 / S2N 10.86 / W2E 5.82 deg, maxTravel 2.829 / 4.063 / 1.850 u, drift 0.0271 / 0.0390 / 0.0157 = 0 fails, shipFrameFail 0/0/0; verdicts a/b/c true, amendedD=true). Quality bar: npm test 1,246/1,246 / build 0 / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) / dist 6,854,378 B / 204 (+335 B from 6,854,043 I605; within E87 budget <= 6,858,000 B / 204; headroom 3,622 B). Hygiene: 0 tabs, all 4 ports free. I605 push a20529c VERIFIED on origin main this turn.",
"st-572");
// 4. iterations.md (mixed, BOM, no trailing NL) - append
patch("production/iterations.md", "append",
"- Push: I605 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote; the I604 push 500906e confirmed on origin main this turn).",
"\r\n## I606 - ST-572 (E87): G2 damped dolly direction shipped. main.js R2 gate replaced by the damped dolly DIRECTION (config +1 lever camera.dolly.azDeadband 1e-4; cameraModel.js additive pure radialDollyDir; +3 unit tests 1,246/1,246; gateq606 src==G2-sim 3,840 checks 0 mismatches; regression 2/2 EXACT zero re-pins A 22/62,472 + P 11/180, B 52/132,682; smoke606 maxStepSettled 5.35 deg/frame [S re-entry whip gone; whole-flight 172.99 deg at i=5 = teleport artifact, metric refined WITH MEASUREMENT]; farframe604 re-run G2 exact amendedD=true; build 0; dist 6,854,378 B / 204 (+335 B, vendor 4/4 EXACT)).\r\n- Push: I606 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote; the I605 push a20529c confirmed on origin main this turn).",
"it-append");
// 5. timeline.md (LF-dominant, BOM, no trailing NL) - append
patch("production/timeline.md", "append",
"(d) re-frozen as (d1)-(d5) with the (d5) radial-leg re-pin (0,+0.1875) WITH MEASUREMENT; ST-572 (G2 implementation) added to E87; close gate renumbered I607. No src change. dist EXACT 6,854,043 B / 204.",
"\n\n## I606 - ST-572: G2 damped dolly direction shipped. The I605 re-entry whip (169 deg ship-relative / 27.8 u in the design sim; 175.45 deg in the live smoke) is now structurally impossible: the held azimuth ALWAYS damps toward radial-outside / legacy-inside (tau 0.25 s) and falls back to the exact legacy branch inside the azDeadband, so the camera target is continuous across the band crossing. Live smoke: the S-rim re-entry is now a ~60-frame damped arc (max per-frame ship-relative step 5.35 deg vs the 30 deg acceptance; the whole-flight 172.99 deg single frame at i=5 is the scripted-ship-teleport catch-up artifact of the smoke harness - the I605 baseline 175.45 was the same artifact - so the smoke metric gained a settled-window refinement WITH MEASUREMENT). Regression pins EXACT zero re-pins (A 22/62,472 + P 11/180, B 52/132,682; causal495 3-arm). dist 6,854,378 B / 204 (+335 B).",
"tl-append");
// 6. active.md (CRLF, no BOM, no trailing NL) - append
patch("production/session-state/active.md", "append",
"test ~1,246 / build 0 / vendor 4/4 / dist ~6,854,3xx within E87 budget <= 6,858,000 B / 204) + regression pins EXPECTED EXACT or re-pin WITH MEASUREMENT (I570 pattern) + smoke re-run (crossing feel) + bookkeeping + commit + push delegate. Then I607 (ST-571) = G87.0 close gate (run_closegate607.cjs).",
"\r\n- NEXT at I607 = ST-571 (E87): G87.0 close gate - .evidence/I607/run_closegate607.cjs clone of .evidence/I602/run_closegate602.cjs (labels CLOSEGATE602 -> CLOSEGATE607, OUTDIR I602 -> I607; 4 servers self-start/self-kill, 2500 ms settle, port_free poll): causal495 (dist :4200, 3-arm seed-9876) + causal483 (score 11334) + playframe491 (A 22/62,472 + P 11/180, B 52/132,682 EXACT) + pwa491 (dist :5199, 11/11) + fresh dist re-measure (expect 6,854,378 B / 204; E87 budget <= 6,858,000 B) + CLOSE FLOOR E87 WITH MEASUREMENT (7,400,000 - dist; expect ~575,622 B; floor >= 102,400 B -> cut ladder NOT invoked) + scope-check-E87.md Verification evidence ST-571 fill + E87 CLOSED 5/5 (ST-568..572) + epics E87 CLOSED + AGENTS.md item-4 refresh (E87 clause at head with the dist chain appended I604 6,854,043 -> I606 6,854,378, E86 demoted to prior) + bookkeeping 7-file + commit + push delegate (Wegener) + verify next turn. After E87: the user standing queue per the I598 candidate list (richer ship/enemy art via Blender with cap renegotiation / Monolith wave-5 wall / late-wave pacing / 2 E85 luma residuals / WebGPU visuals pass / cockpit ship-portions + cockpit-relative controls).",
"ac-append");
// 7. CHANGELOG.md (LF, BOM-ish head) - insert above I605 line
patch("CHANGELOG.md", "rep",
"- I605: No visible change - the new edge-of-arena camera was checked in the real game",
"- I606: The edge-of-arena camera fix is finished: when you cross the arena from one side to the other, the view now steers around gradually and always eases back to the old view, instead of jumping for a split second.\n- I605: No visible change - the new edge-of-arena camera was checked in the real game",
"cl-insert");
console.log(ok ? "BOOKKEEP606 OK (7 files, 12 patches)" : "BOOKKEEP606 FAILED");
process.exit(ok ? 0 : 1);