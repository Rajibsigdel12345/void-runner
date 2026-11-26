const fs = require('fs');
const path = require('path');
const ROOT = 'E:/Game';
const done = [];
const failed = [];

function readBom(file) {
  const b = fs.readFileSync(path.join(ROOT, file));
  return (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf);
}
function patch(file, oldStr, newStr, tag) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  const n = s.split(oldStr).length - 1;
  if (n !== 1) { failed.push(file + ' [' + tag + '] count=' + n); return; }
  s = s.split(oldStr).join(newStr);
  fs.writeFileSync(p, s, 'utf8');
  done.push(file + ' [' + tag + ']');
}
function append(file, extra, eol) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  const endsNl = /\r?\n$/.test(s);
  s += (endsNl ? '' : eol) + extra;
  fs.writeFileSync(p, s, 'utf8');
  done.push(file + ' [append endsNl=' + endsNl + ']');
}

const FILES = ['production/epics.md','production/stories.md','production/iterations.md','production/timeline.md','production/session-state/active.md','CHANGELOG.md'];
const bomBefore = {};
for (const f of FILES) bomBefore[f] = readBom(f);

// ============ epics.md ============
patch('production/epics.md',
  '## E87 - Far-framing fix (banded radial dolly backDir, endless only) - OPEN I604 (ST-568 DONE; ST-569 DONE; ST-570/571 PENDING)',
  '## E87 - Far-framing fix (banded radial dolly backDir, endless only) - OPEN I605 (ST-568 DONE; ST-569 DONE; ST-570 DONE; ST-571/572 PENDING)',
  'E87-header');

const E_STORIES = '/ ST-570 (I605) farframe604 verification probe (3 arms G0 shipped / G1 gate-only / G2 damped dolly direction) + browser smoke + (d) re-freeze - DONE I605: (a) 0/0 + (b) 8/8 + (c) 8/8 all arms; G0 frozen (d) FAIL (N2S 169.05 deg / 27.792 u re-entry whip; S2N 129.28 / 24.806; W2E 79.16 / 17.853; live smoke 175.45 deg ship-relative cam step + 9.49 u pass-by, console 0/0, no NaN); G1 insufficient (teleport relocated to S2N 129.28 / 24.806 u); G2 amended PASS (maxRel 11.61 / 10.86 / 5.82 deg; drift 0.0271 / 0.0390 / 0.0157; shipFrameFail 0/0/0; legacy box on dolly-null frames OK); (d) RE-FROZEN (d1)-(d5) w/ (d5) re-pin (0,+0.1875) WITH MEASUREMENT / ST-571 (I607) G87.0 close gate + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate - PENDING / ST-572 (I606) G2 damped dolly direction implementation (config +1 lever azDeadband + cameraModel radialDollyDir additive + main.js gate replacement + unit tests +3 + farframe604 re-run as acceptance) - PENDING.';
patch('production/epics.md',
  '/ ST-570 (I605) farframe604 verification probe (frozen acceptance: (a) inside-band bit-identical to R0 maxDx 0 / maxDy 0; (b) 8/8; (c) 8/8; crossing <= 30 deg/frame + ship NDC 0.05 box) + browser smoke + quality bar - PENDING / ST-571 (I606) G87.0 close gate + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate - PENDING.',
  E_STORIES,
  'E87-stories');

patch('production/epics.md',
  '- Status: OPEN I604 (ST-568 DONE I603 docs-only; ST-569 DONE I604 implementation + 5 unit tests + regression 2/2 EXACT zero re-pins; ST-570/571 PENDING).',
  '- Status: OPEN I605 (ST-568 DONE I603 docs-only; ST-569 DONE I604 implementation + 5 unit tests + regression 2/2 EXACT zero re-pins; ST-570 DONE I605 verification probe + (d) re-freeze; ST-571/572 PENDING).',
  'E87-status');

// ============ stories.md ============
const S570 = '- ST-570 E87 farframe604 verification probe (I605) - DONE I605: 3-arm pure-node probe (.evidence/I605/farframe604.mjs -> farframe604.json, 60 fps sim of the shipped R2 held-azimuth damping; 12 inside-band positions + 3 rim crossings per arm). (a) inside-band bit-identical to R0 maxDx 0 / maxDy 0 ALL 3 ARMS; (b) center in-frustum 8/8 rim (0,0.3788) / in (0,0.4055) ALL ARMS; (c) opp rim in-frustum 8/8 rim (0,0.5733) / in (0,0.5981) ALL ARMS. G0 (shipped R2) FROZEN (d) FAIL: N2S maxRel 169.05 deg / maxTravel 27.792 u (driftFail 1, boxFailSampled 1); S2N 129.28 deg / 24.806 u; W2E 79.16 deg / 17.853 u; verdicts frozenD=false amendedD=false - diagnosis: the held azimuth converges to the radial while the dolly is off inside the band, so re-entering the band at the S rim re-applies a held azimuth ~180 deg from legacy in one frame (single-frame re-entry flip = the whip; the rate-5 damper cannot save a pre-converged held). G1 (hold-while-gated-off only) FAIL: N2S fixed (11.61 deg / 2.829 u) but S2N still 129.28 deg / 24.806 u = teleport RELOCATED (stale held ~ -PI/2 across the S->N band re-entry -> 180 deg flip at the N-side re-entry). G2 (damped dolly DIRECTION: held damps toward radial outside the band / legacy PI/2 inside, ALWAYS while endless+PLAYING; backDir from the held azimuth with an azDeadband 1e-4 fallback to the exact legacy branch) AMENDED PASS: maxRel 11.61 (N2S) / 10.86 (S2N) / 5.82 (W2E) deg <= 30 deg ceiling; maxTravel 2.829 / 4.063 / 1.850 u; drift 0.0271 / 0.0390 / 0.0157 (0 fails, <= 0.06); shipFrameFail 0/0/0 (|ndc| <= 0.85 every frame); legacyBoxOK on dolly-null frames (vacuous-true on S2N - no sampled dolly-null frames there, documented). End-pins measured (endpins605.mjs, converged radial rim poses): outward-facing rim ship NDC (0,+0.1875) at S/E/N rims; S rim facing center (0,-0.1428); legacy refs S rim facing south (0,-0.1428) / E rim facing east (-0.1592,-0.0318) -> (d5) re-pin (0,+0.1875) WITH MEASUREMENT. (d) RE-FROZEN as (d1) ship-relative cam azimuth step <= 30 deg/frame all crossings / (d2) ship NDC |x|,|y| <= 0.85 every frame / (d3) per-frame ship NDC drift <= 0.06 / (d4) dolly-null legacy frames on N2S: ship NDC in a 0.05 box around (0,-0.1428) / (d5) converged radial rim pose facing outward: (0,+0.1875) RE-PIN WITH MEASUREMENT; metric-degeneracy documented (absolute atan2(camZ,camX) flips at camX=0; ship-relative is the whip metric). Browser smoke (smoke605.mjs, headless Chrome SwiftShader dev :5173 self-start/self-kill, reseed 71401, 400 rAF frames scripted N->S rim crossing): OK=true, portFree=true, consoleErrors 0, pageerror 0, no NaN (bad=0); minDist 9.49 / maxDist 23.53 u; maxCamStep 2.542 u/frame; documents the live whip (i=340 cam (0,9.15,-3.36) -> i=360 cam (0,10.12,-28.34) = 175.45 deg ship-relative cam-position step, cam passed across the ship 9.49 u at the S-side re-entry). scope-check-E87.md AMENDED (8 patches count===1: ST-570 row DONE + (d) re-freeze (d1)-(d5) + ST-572 row (G2 implementation, I606) + 3rd lever camera.dolly.azDeadband + close gate renumbered I607 + Verification evidence + DoD 5/5 + Next owner I606). Quality bar 4/4: npm test 1,243/1,243 / build 0 / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) / dist EXACT 6,854,043 B / 204 (0 B; within E87 budget <= 6,858,000 B / 204). NO src change. Hygiene: 0 tabs, all 4 ports free. I604 push 500906e VERIFIED on origin main.';
patch('production/stories.md',
  '- ST-570 E87 farframe604 verification probe (I605) - PENDING: pure-node probe over the frozen R2 design simulating the held-azimuth damping at 60 fps (frozen acceptance: (a) inside the band bit-identical to R0 maxDx 0 / maxDy 0; (b) center in-frustum 8/8 rim+in; (c) opp rim in-frustum 8/8 rim+in; crossing max per-frame azimuth step <= 30 deg + ship NDC inside a 0.05 box around (0,-0.1428)) + headless browser smoke (console clean, no NaN, tab closed after) + quality bar',
  S570,
  'ST570-DONE');

const S571 = '- ST-571 E87 G87.0 close gate (I607) - PENDING: .evidence/I607/run_closegate607.cjs clone of the I602 runner (5/5: causal495 3-arm seed-9876 / causal483 score 11334 / playframe483+491 A 22/62,472 + P 11/180 B EXACT / pwa491 11/11; pins EXACT or re-pin WITH MEASUREMENT per I570) + fresh dist re-measure (E87 budget <= 6,858,000 B / 204) + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate';
patch('production/stories.md',
  '- ST-571 E87 G87.0 close gate (I606) - PENDING: .evidence/I606/run_closegate606.cjs clone of the I602 runner (5/5: causal495 3-arm seed-9876 / causal483 score 11334 / playframe483+491 A 22/62,472 + P 11/180 B EXACT / pwa491 11/11; pins EXACT or re-pin WITH MEASUREMENT per I570) + fresh dist re-measure (E87 budget <= 6,858,000 B / 204) + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate',
  S571,
  'ST571-renum');

const S572 = '- ST-572 E87 G2 damped dolly direction implementation (I606) - PENDING: main.js R2 gate replaced by the damped dolly DIRECTION (held azimuth damps toward radial outside the band / legacy +Z PI/2 inside, ALWAYS while endless+PLAYING; backDir = (cos held, sin held) whenever abs(wrap(held - PI/2)) >= camera.dolly.azDeadband else null = exact legacy branch) + config.js +1 lever (camera.dolly.azDeadband 1e-4, commented) + cameraModel.js ADDITIVE pure radialDollyDir(prevHeld, targetAz, dist, band, dt, tau, deadband, out) (no alloc, shortest arc) + tests/cameraModel.test.js +3 (deadband identity -> null / outside-deadband dir / wraparound convergence to legacy inside the band) + acceptance = farframe604 G2 arm re-run against the amended (d1)-(d5) + quality bar (npm test ~1,246 / build 0 / vendor 4/4 / dist ~6,854,3xx within E87 budget <= 6,858,000 B / 204) + regression (pins EXACT expected; re-pin WITH MEASUREMENT per I570 if playframe B moves) + smoke re-run (crossing feel) + bookkeeping + commit + push delegate';
append('production/stories.md', S572, '\n');

// ============ iterations.md ============
const I605 = '- I605 (ST-570, E87): farframe604 verification probe + (d) re-freeze. 3-arm pure-node probe (.evidence/I605/farframe604.mjs -> farframe604.json; 60 fps sim of the shipped I604 R2 held-azimuth damping; 12 inside-band positions + 3 rim crossings per arm): (a) inside-band bit-identical to R0 maxDx 0 / maxDy 0 ALL 3 ARMS (12 inside-band positions x 3 points); (b) center in-frustum 8/8 rim (0,0.3788) / in (0,0.4055) ALL ARMS; (c) opp rim in-frustum 8/8 rim (0,0.5733) / in (0,0.5981) ALL ARMS. G0 (shipped R2) FROZEN (d) FAIL: N2S maxRel 169.05 deg / maxTravel 27.792 u (driftFail 1, boxFailSampled 1); S2N 129.28 deg / 24.806 u; W2E 79.16 deg / 17.853 u; verdicts frozenD=false amendedD=false. Diagnosis: the held azimuth converges to the radial while the dolly is OFF inside the band, so re-entering the band at the S rim re-applies a held azimuth ~180 deg from legacy in ONE frame (the rate-5 damper does not save it - the convergence already happened while the dolly was off). G1 (hold-while-gated-off only) FAIL: N2S fixed (11.61 deg / 2.829 u) but S2N still 129.28 deg / 24.806 u = teleport RELOCATED (stale held ~ -PI/2 across the S->N re-entry -> 180 deg flip at the N-side re-entry). G2 (damped dolly DIRECTION: held damps toward radial outside the band / legacy PI/2 inside, ALWAYS while endless+PLAYING; backDir from the held azimuth with an azDeadband 1e-4 fallback to the exact legacy branch) AMENDED PASS: maxRel 11.61 / 10.86 / 5.82 deg (<= 30 deg ceiling); maxTravel 2.829 / 4.063 / 1.850 u; drift 0.0271 / 0.0390 / 0.0157 (0 fails, <= 0.06); shipFrameFail 0/0/0 (|ndc| <= 0.85 every frame); legacyBoxOK on dolly-null frames (vacuous-true on S2N, documented). End-pins measured (endpins605.mjs, converged radial rim poses): outward-facing rim ship NDC (0,+0.1875) at S/E/N rims; S rim facing center (0,-0.1428); legacy refs S rim facing south (0,-0.1428) / E rim facing east (-0.1592,-0.0318). (d) RE-FROZEN (d1) ship-relative cam azimuth step <= 30 deg/frame all crossings / (d2) ship NDC |x|,|y| <= 0.85 every frame / (d3) per-frame ship NDC drift <= 0.06 / (d4) dolly-null legacy frames on N2S: ship NDC in a 0.05 box around (0,-0.1428) / (d5) converged radial rim pose facing outward: (0,+0.1875) RE-PIN WITH MEASUREMENT; metric-degeneracy documented (absolute atan2(camZ,camX) flips at camX=0; ship-relative is the whip metric). Browser smoke (smoke605.mjs, headless Chrome SwiftShader dev :5173 self-start/self-kill, reseed 71401, 400 rAF frames scripted N->S rim crossing ship y 26 -> -26): OK=true, portFree=true, consoleErrors 0, pageerror 0, no NaN (bad=0); minDist 9.49 / maxDist 23.53 u; maxCamStep 2.542 u/frame; documents the LIVE whip (i=340 cam (0,9.15,-3.36) -> i=360 cam (0,10.12,-28.34) = 175.45 deg ship-relative cam-position step, cam passed across the ship 9.49 u at the S-side re-entry). scope-check-E87.md AMENDED (8 patches count===1: ST-570 row DONE + (d) re-freeze (d1)-(d5) + ST-572 row (G2 implementation, I606) + 3rd lever camera.dolly.azDeadband 1e-4 + close gate renumbered I607 + Verification evidence + DoD 5/5 + Next owner) - NO src change. Quality bar 4/4: npm test 1,243/1,243 / build 0 / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) / dist EXACT 6,854,043 B / 204 (0 B; within E87 budget <= 6,858,000 B / 204). Bookkeeping 7-patch all BOM deltas 0 (scope-check amended / epics header+Stories+Status / stories ST-570 DONE + ST-571 renumber I607 + ST-572 append / iterations I605 entry / timeline I605 paragraph / active NEXT at I606 / CHANGELOG I605 line). Hygiene: 0 tabs, all 4 ports free, no terminals left. I604 push 500906e VERIFIED on origin main this turn (git ls-remote = HEAD).';
append('production/iterations.md', I605 + '\r\n- Push: I605 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote; the I604 push 500906e confirmed on origin main this turn).', '\r\n');

// ============ timeline.md ============
const T605 = '## I605 - ST-570: farframe604 verification probe + (d) re-freeze. The 3-arm probe (G0 shipped gate, G1 gate-only, G2 damped dolly direction) confirmed frozen (a)/(b)/(c) on all arms and exposed a real crossing defect in the shipped implementation: the held azimuth converges to the radial while the dolly is off inside the band, so re-entering the band at the S rim re-applies a held azimuth ~180 deg from legacy in one frame - a 169 deg ship-relative cam-target step + 27.8 u teleport (live smoke: 175 deg cam-position step, pass-by 9.5 u from the ship). G1 relocates the teleport; G2 (damped dolly direction with a deadband fallback to the exact legacy branch) passes the amended acceptance (max 11.6 deg/frame, zero drift fails, ship framed every frame). (d) re-frozen as (d1)-(d5) with the (d5) radial-leg re-pin (0,+0.1875) WITH MEASUREMENT; ST-572 (G2 implementation) added to E87; close gate renumbered I607. No src change. dist EXACT 6,854,043 B / 204.';
append('production/timeline.md', '\n' + T605, '\n');

// ============ active.md ============
const A606 = '- NEXT at I606 = ST-572 (E87): G2 damped dolly direction implementation - main.js R2 gate replaced by the damped dolly DIRECTION (held azimuth damps toward radial outside the band / legacy +Z PI/2 inside, ALWAYS while endless+PLAYING; backDir = (cos held, sin held) whenever abs(wrap(held - PI/2)) >= camera.dolly.azDeadband else null = exact legacy branch) + config.js +1 lever (camera.dolly.azDeadband 1e-4, commented) + cameraModel.js ADDITIVE pure radialDollyDir(prevHeld, targetAz, dist, band, dt, tau, deadband, out) (no alloc, shortest arc, reuses the azimuthDamp math) + tests/cameraModel.test.js +3 (deadband identity -> null / outside-deadband dir / wraparound convergence to legacy inside the band) + acceptance = farframe604 G2 arm vs amended (d1)-(d5) + quality bar (npm test ~1,246 / build 0 / vendor 4/4 / dist ~6,854,3xx within E87 budget <= 6,858,000 B / 204) + regression pins EXPECTED EXACT or re-pin WITH MEASUREMENT (I570 pattern) + smoke re-run (crossing feel) + bookkeeping + commit + push delegate. Then I607 (ST-571) = G87.0 close gate (run_closegate607.cjs).';
append('production/session-state/active.md', A606, '\r\n');

// ============ CHANGELOG.md ============
patch('CHANGELOG.md',
  '- I604: When your ship is near the edge of the arena',
  '- I605: No visible change - the new edge-of-arena camera was checked in the real game and one rough moment was found: when crossing the arena from one edge to the opposite one, the view could jerk for a split second. The fix for that (a smoothly steered camera swing that can always fall back to the old view) is designed, measured, and scoped for the next update.\n- I604: When your ship is near the edge of the arena',
  'I605-line');

// ============ BOM delta check ============
for (const f of FILES) {
  const after = readBom(f);
  if (after !== bomBefore[f]) failed.push(f + ' BOM DELTA: before=' + bomBefore[f] + ' after=' + after);
}

console.log('DONE ' + done.length + ' patches:');
for (const d of done) console.log('  ' + d);
if (failed.length) {
  console.log('FAILED ' + failed.length + ':');
  for (const f of failed) console.log('  ' + f);
  process.exit(1);
}
console.log('BOM deltas 0. BOOKKEEP605B OK');