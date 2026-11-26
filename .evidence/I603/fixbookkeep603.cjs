const fs = require("fs");
const L1 = (p) => fs.readFileSync(p, "latin1");
const W1 = (p, s) => fs.writeFileSync(p, s, "latin1");
const bomCount = (s) => (s.match(/\u00EF\u00BB\u00BF/g) || []).length;
function appendTail(file, tail, addendum) {
  const s = L1(file);
  const b0 = bomCount(s);
  if (!s.endsWith(tail)) throw new Error(file + ": tail mismatch: " + JSON.stringify(s.slice(-90)));
  const out = s + addendum;
  if (b0 !== bomCount(out)) throw new Error(file + ": BOM delta");
  W1(file, out);
  console.log("OK " + file + " (bom " + b0 + ")");
}

// 3) iterations.md (bare tail)
appendTail("production/iterations.md",
  "- Push: I602 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote).",
  "\r\n- I603 (E87 open): far-framing fix epic opened - .evidence/I603/farframe603.mjs prediction probe (pure node, exported chaseTargets + projectNdc, fov 60 @ 16:9, arenaR 26, 4 rim directions x in/out + 3 dolly candidates): R0 baseline = I601 reproduced [(b) 3/4 rim + 3/4 in [S (0,-3.463) OUT below, depth 7.06]; (c) 1/4 [S behind depth -12.5975; E/W x-stretch 1.3002 OUT]; a1 invariance maxDx 0 / maxDy 0; a2 ship NDC facing center varies by rim N (0,-0.1428) / E (0.1592,-0.0318) / S (0,0.1875) / W (-0.1592,-0.0318)]; R1 full radial = (b) 4/4 + (c) 4/4 + a2 constant (0,-0.1428) x4 BUT a1 invariance breaks (maxDx 0.2908 / maxDy 0.2473 = the I445 screen-offset contract would be violated in the inner arena); R2 banded radial (dist >= 0.7*26 = 18.2 -> normalize(ship pos), else null) = grid-identical to R1 (all grid points in 20.8 + rim 26 outside the band) AND bit-identical to R0 inside the band -> FROZEN DESIGN; crossing N rim -> S rim 120 steps undamped: max camAz step 90 deg (radial line flips 180 deg at the center) + 180-deg flip risk at the S band exit -> runtime held azimuth with exponential damping tau 0.25 s pre-registered (initial 720 deg/s = 12 deg/frame @ 60 fps, <= 30 deg/frame ceiling). scope-check-E87.md written (FROZEN, 8,741 B; 4 stories; budget dist <= 6,858,000 B / 204; cut option C1 = hard-swap R2 without damping + register the crossing swing). NO src change (docs + probe only). Quality bar: npm test 1,238/1,238; build 0; vendor 4/4 EXACT; dist EXACT 6,853,589 B / 204 (measure603).\r\n- Push: I603 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote; I602 push 4be1ac9 VERIFIED on origin main this turn [git ls-remote = HEAD]).");

// 4) timeline.md (bare tail)
appendTail("production/timeline.md",
  "logged for a future improvement pass.",
  "\r\n\r\nI603 (E87 open): no visible change - the fix for seeing the whole arena from every edge is designed and measured. The numbers show that moving the camera to sit behind the ship along the line through the arena center, but only when the ship is near the edge, lets you see all the way back from every direction while the flight feel in the middle of the arena stays exactly as it is now; it is scoped for the next update.");

// 5) active.md (bare tail)
appendTail("production/session-state/active.md",
  "budget pre-registration if assets grow.",
  "\r\n- NEXT at I604 = ST-569 (E87): R2 banded radial implementation - config.js +2 levers (camera.dolly.band 0.7, camera.dolly.azTau 0.25, commented) + cameraModel.js additive pure azimuthDamp(prev, target, dt, tau) helper (shortest-arc, k = 1 - exp(-dt/tau)) + tests/cameraModel.test.js append (identity / convergence monotone no-overshoot / wraparound / 1-step factor) + main.js endless-only backDir (damped radial normalize(ship pos) when dist >= band*arenaR else null; held-azimuth state reset on mode change; campaign rail-tangent / cockpit / touch / scripted paths byte-untouched) + quality bar (npm test incl. new unit tests / build / vendor 4/4 / dist re-measure, E87 budget <= 6,858,000 B / 204) + causal/playframe pins EXPECTED EXACT or re-pin WITH MEASUREMENT (I570 pattern) if the ship sits outside the band in the pin windows.");

// 6) CHANGELOG.md - insert above - I602: (anchor count verified 1)
const chFile = "CHANGELOG.md";
const ch = L1(chFile);
const b0 = bomCount(ch);
const idx = ch.indexOf("- I602:");
if (idx < 0 || ch.indexOf("- I602:", idx + 1) >= 0) throw new Error("CHANGELOG anchor not unique");
const chOut = ch.slice(0, idx) + "- I603: No visible change - the fix for seeing the whole arena from every edge is designed and measured, and scoped for the next update.\n" + ch.slice(idx);
if (b0 !== bomCount(chOut)) throw new Error("CHANGELOG BOM delta");
W1(chFile, chOut);
console.log("OK CHANGELOG.md (bom " + b0 + ")");
console.log("FIXBOOKKEEP603 DONE");