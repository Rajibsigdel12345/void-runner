const fs = require("fs");
const L1 = (p) => fs.readFileSync(p, "latin1");
const W1 = (p, s) => fs.writeFileSync(p, s, "latin1");
const bomCount = (s) => (s.match(/\u00EF\u00BB\u00BF/g) || []).length;
function patch(file, mode, anchor, replacement, tailCheck) {
  const s = L1(file);
  const b0 = bomCount(s);
  if (tailCheck !== null && !s.endsWith(tailCheck)) throw new Error(file + ": tail mismatch: " + JSON.stringify(s.slice(-80)));
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(file + ": anchor count " + n + " (want 1): " + JSON.stringify(anchor.slice(0, 60)));
  const out = s.replace(anchor, replacement);
  const b1 = bomCount(out);
  if (b0 !== b1) throw new Error(file + ": BOM delta " + (b1 - b0));
  W1(file, out);
  console.log("OK " + file + " (bom " + b0 + ")");
}

// 1) epics.md - append E87 section after the trailing CRLF
const epAnchor = "new enemies / linear levels + bosses].\r\n";
const epLines = [
  "## E87 - Far-framing fix (banded radial dolly backDir, endless only) - OPEN I603 (ST-568 DONE; ST-569/570/571 PENDING)",
  "",
  "- Goal: close the far-framing residuals measured at I601 (S-rim center OUT below / S-rim opp rim behind the camera / E+W-rim opp rim x-stretch 1.30) caused by the fixed world +Z endless dolly direction (backDir null in main.js). FROZEN design from the I603 prediction probe (farframe603): R2 banded radial - backDir = normalize(ship pos) when dist >= 0.7*arenaR (18.2), else null (legacy world +Z), + runtime held azimuth with exponential damping tau 0.25 s (crossing max step <= 30 deg/frame). Measured effect: (b) center in-frustum 3/4 -> 4/4 rim+in; (c) opp rim 1/4 -> 4/4 rim+in; ship NDC constant (0,-0.1428) from all 4 rims (a2); inside the band bit-identical to R0 (the I445 invariance preserved in the inner arena). Endless only; the campaign rail-tangent path untouched; 2 config levers (dolly.band 0.7, dolly.azTau 0.25) + pure additive cameraModel azimuthDamp helper + unit tests.",
  "",
  "- Research: production/scope-check-E87.md (I603, FROZEN, 8,741 B) + .evidence/I603/farframe603.mjs/.json (pure-node prediction probe: R0 baseline reproduces I601 [(b) 3/4 rim+in, S (0,-3.463) OUT depth 7.06; (c) 1/4, S behind depth -12.5975, E/W x-stretch 1.3002; a1 maxDx 0 / maxDy 0; a2 varies N (0,-0.1428) / E (0.1592,-0.0318) / S (0,0.1875) / W (-0.1592,-0.0318)]; R1 full radial [(b)/(c) 4/4 both, a2 constant (0,-0.1428) x4, a1 breaks maxDx 0.2908 / maxDy 0.2473]; R2 banded = grid-identical to R1 + inside-band bit-identical to R0; crossing N->S 120 steps undamped: max camAz step 90 deg + 180-deg flip risk at the S band exit -> damped azimuth tau 0.25 s pre-registered [initial 720 deg/s = 12 deg/frame @ 60 fps]) + I601 farframe601 residuals (this epic = the registered E87+ backlog item).",
  "",
  "- Stories: ST-568 (I603) research + farframe603 prediction probe + scope check + E87 open (docs only) - DONE I603: probe numbers frozen (see Research), scope-check-E87.md FROZEN, dist byte-identical 6,853,589 B / 204 / ST-569 (I604) R2 banded radial implementation (config +2 levers + cameraModel azimuthDamp + main.js endless backDir + unit tests) - PENDING / ST-570 (I605) farframe604 verification probe (frozen acceptance: (a) inside-band bit-identical to R0 maxDx 0 / maxDy 0; (b) 8/8; (c) 8/8; crossing <= 30 deg/frame + ship NDC 0.05 box) + browser smoke + quality bar - PENDING / ST-571 (I606) G87.0 close gate + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate - PENDING.",
  "",
  "- Status: OPEN I603 (ST-568 DONE I603 docs-only; ST-569/570/571 PENDING)."
];
patch("production/epics.md", "append", epAnchor, epAnchor + "\r\n" + epLines.join("\r\n") + "\r\n", "bosses].\r\n");

// 2) stories.md - append 4 story lines after the trailing lone LF
const stAnchor = "I601 push d610bb3 verified on origin main.\n";
const stLines = [
  "- ST-568 E87 research + farframe603 prediction probe + scope check + E87 open (I603) - DONE I603: farframe603 numbers frozen (R2 banded radial, band 0.7 of arenaR 26 = 18.2: (b) center in-frustum 3/4 -> 4/4 rim+in; (c) opp rim 1/4 -> 4/4 rim+in; a2 ship NDC constant (0,-0.1428) from all 4 rims; a1 inside-band bit-identical to R0 maxDx 0 / maxDy 0; undamped crossing N->S max camAz step 90 deg -> held azimuth with exponential damping tau 0.25 s pre-registered [initial 12 deg/frame @ 60 fps <= 30 deg/frame ceiling]) + scope-check-E87.md FROZEN 8,741 B; docs-only, dist byte-identical 6,853,589 B / 204",
  "- ST-569 E87 R2 banded radial implementation (I604) - PENDING: config.js +2 levers (camera.dolly.band 0.7, camera.dolly.azTau 0.25, commented) + cameraModel.js additive pure azimuthDamp(prev, target, dt, tau) (shortest-arc, k = 1 - exp(-dt/tau)) + tests/cameraModel.test.js append (identity / convergence monotone no-overshoot / wraparound / 1-step factor) + main.js endless-only backDir (damped radial when dist >= band*arenaR else null; held-azimuth state, reset on mode change; campaign rail-tangent / cockpit / touch / scripted-intent paths byte-untouched)",
  "- ST-570 E87 farframe604 verification probe (I605) - PENDING: pure-node probe over the frozen R2 design simulating the held-azimuth damping at 60 fps (frozen acceptance: (a) inside the band bit-identical to R0 maxDx 0 / maxDy 0; (b) center in-frustum 8/8 rim+in; (c) opp rim in-frustum 8/8 rim+in; crossing max per-frame azimuth step <= 30 deg + ship NDC inside a 0.05 box around (0,-0.1428)) + headless browser smoke (console clean, no NaN, tab closed after) + quality bar",
  "- ST-571 E87 G87.0 close gate (I606) - PENDING: .evidence/I606/run_closegate606.cjs clone of the I602 runner (5/5: causal495 3-arm seed-9876 / causal483 score 11334 / playframe483+491 A 22/62,472 + P 11/180 B EXACT / pwa491 11/11; pins EXACT or re-pin WITH MEASUREMENT per I570) + fresh dist re-measure (E87 budget <= 6,858,000 B / 204) + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate"
];
patch("production/stories.md", "append", stAnchor, stAnchor + stLines.join("\n") + "\n", "verified on origin main.\n");

// 3) iterations.md - append I603 entry + push line (bare tail)
const itAnchor = "(landing verified next turn via git ls-remote).";
const itAppend = [
  "- I603 (E87 open): far-framing fix epic opened - .evidence/I603/farframe603.mjs prediction probe (pure node, exported chaseTargets + projectNdc, fov 60 @ 16:9, arenaR 26, 4 rim directions x in/out + 3 dolly candidates): R0 baseline = I601 reproduced [(b) 3/4 rim + 3/4 in [S (0,-3.463) OUT below, depth 7.06]; (c) 1/4 [S behind depth -12.5975; E/W x-stretch 1.3002 OUT]; a1 invariance maxDx 0 / maxDy 0; a2 ship NDC facing center varies by rim N (0,-0.1428) / E (0.1592,-0.0318) / S (0,0.1875) / W (-0.1592,-0.0318)]; R1 full radial = (b) 4/4 + (c) 4/4 + a2 constant (0,-0.1428) x4 BUT a1 invariance breaks (maxDx 0.2908 / maxDy 0.2473 = the I445 screen-offset contract would be violated in the inner arena); R2 banded radial (dist >= 0.7*26 = 18.2 -> normalize(ship pos), else null) = grid-identical to R1 (all grid points in 20.8 + rim 26 outside the band) AND bit-identical to R0 inside the band -> FROZEN DESIGN; crossing N rim -> S rim 120 steps undamped: max camAz step 90 deg (radial line flips 180 deg at the center) + 180-deg flip risk at the S band exit -> runtime held azimuth with exponential damping tau 0.25 s pre-registered (initial 720 deg/s = 12 deg/frame @ 60 fps, <= 30 deg/frame ceiling). scope-check-E87.md written (FROZEN, 8,741 B; 4 stories; budget dist <= 6,858,000 B / 204; cut option C1 = hard-swap R2 without damping + register the crossing swing). NO src change (docs + probe only). Quality bar: npm test 1,238/1,238; build 0; vendor 4/4 EXACT; dist EXACT 6,853,589 B / 204 (measure603).",
  "- Push: I603 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote; I602 push 4be1ac9 VERIFIED on origin main this turn [git ls-remote = HEAD])."
];
patch("production/iterations.md", "append", itAnchor, itAnchor + "\r\n" + itAppend.join("\r\n"), "via git ls-remote).");

// 4) timeline.md - append I603 paragraph (bare tail)
const tlAnchor = "logged for a future improvement pass.";
const tlAppend = "I603 (E87 open): no visible change - the fix for seeing the whole arena from every edge is designed and measured. The numbers show that moving the camera to sit behind the ship along the line through the arena center, but only when the ship is near the edge, lets you see all the way back from every direction while the flight feel in the middle of the arena stays exactly as it is now; it is scoped for the next update.";
patch("production/timeline.md", "append", tlAnchor, tlAnchor + "\r\n\r\n" + tlAppend, "improvement pass.");

// 5) active.md - append NEXT line (bare tail)
const acAnchor = "budget pre-registration if assets grow.";
const acAppend = "- NEXT at I604 = ST-569 (E87): R2 banded radial implementation - config.js +2 levers (camera.dolly.band 0.7, camera.dolly.azTau 0.25, commented) + cameraModel.js additive pure azimuthDamp(prev, target, dt, tau) helper (shortest-arc, k = 1 - exp(-dt/tau)) + tests/cameraModel.test.js append (identity / convergence monotone no-overshoot / wraparound / 1-step factor) + main.js endless-only backDir (damped radial normalize(ship pos) when dist >= band*arenaR else null; held-azimuth state reset on mode change; campaign rail-tangent / cockpit / touch / scripted paths byte-untouched) + quality bar (npm test incl. new unit tests / build / vendor 4/4 / dist re-measure, E87 budget <= 6,858,000 B / 204) + causal/playframe pins EXPECTED EXACT or re-pin WITH MEASUREMENT (I570 pattern) if the ship sits outside the band in the pin windows.";
patch("production/session-state/active.md", "append", acAnchor, acAnchor + "\r\n" + acAppend, "if assets grow.");

// 6) CHANGELOG.md - insert I603 line above the I602 line (pure LF)
const chAnchor = "- I602:";
const chInsert = "- I603: No visible change - the fix for seeing the whole arena from every edge is designed and measured, and scoped for the next update.\n";
patch("CHANGELOG.md", "insert", chAnchor, chInsert + chAnchor, "sweep + E6 closing - v0.2.0 (version + CHANGELOG section), timeline/sprint closeout, repo audit clean, all suites green (ST-050).");
console.log("BOOKKEEP603 DONE");