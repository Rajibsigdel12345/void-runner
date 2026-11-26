const fs = require("fs");
const p = "E:/Game/production/scope-check-E87.md";
let s = fs.readFileSync(p, "utf8");
const E = s.includes("\r\n") ? "\r\n" : "\n";
const L = (a) => a.join(E);
const patches = [];
patches.push([
  L(["| ST-570  | farframe604 verification probe (FROZEN acceptance: (a) inside the band bit-identical to R0 (maxDx 0 / maxDy 0); (b) center in-frustum 8/8 rim+in; (c) opp rim in-frustum 8/8 rim+in; crossing max azimuth step <= 30 deg/frame at 60 fps + ship NDC within 0.05 of (0,-0.1428)) + headless browser smoke (console clean, no NaN) + quality bar | .evidence/I605/ (committed -f) | 0 B on top of ST-569 |"]),
  L([
    "| ST-570  | DONE I605 - farframe604 verification probe (3 arms: G0 shipped R2 gate / G1 damp+apply only outside the band / G2 damped dolly DIRECTION) + headless browser smoke + (d) re-freeze. FROZEN (a)/(b)/(c) PASS on all 3 arms ((a) 0/0 bit-identical inside the band; (b) 8/8 rim (0,0.3788) / in (0,0.4055); (c) 8/8 rim (0,0.5733) / in (0,0.5981)). Frozen (d) FAILED on the shipped G0: the held azimuth converges to the radial EVEN WHILE THE DOLLY IS OFF inside the band, so the S-side band RE-ENTRY re-applies a held azimuth ~180 deg from legacy in one frame = 169.05 deg ship-relative cam-target step + 27.792 u cam-target teleport on N2S (S2N 129.28 deg / 24.806 u; W2E 79.16 / 17.853 u); the runtime rate-5 damper does not save it (live smoke: 175.45 deg ship-relative cam-position step at the S-side re-entry, cam pass-by 9.49 u from the ship, console 0/0, pageerror 0, no NaN). G1 relocates the teleport to the opposite crossing (S2N still 129.28 / 24.806 u) - insufficient. G2 PASSES the amended (d): maxRel 11.61 / 10.86 / 5.82 deg on N2S/S2N/W2E (<= 30 deg ceiling), maxTravel 2.829 / 4.063 / 1.850 u, drift 0.0271 / 0.0390 / 0.0157 (0 fails), shipFrameFail 0/0/0, legacy box holds on dolly-null frames. (d) RE-FROZEN as amended (d1) ship-relative cam azimuth step <= 30 deg/frame on all crossings; (d2) ship NDC abs(x),abs(y) <= 0.85 every frame; (d3) per-frame ship NDC drift <= 0.06; (d4) dolly-null (legacy) frames on the N2S crossing: ship NDC inside a 0.05 box of (0,-0.1428); (d5) converged radial rim pose, ship facing outward: ship NDC (0,+0.1875) RE-PIN WITH MEASUREMENT (the frozen (0,-0.1428) box premise was false for the radial leg - it holds only where the dolly is null). Documented: the absolute atan2(camZ,camX) metric degenerates at camX=0 (a 180 deg flip while the cam path is smooth) - the ship-relative metric is the whip metric. Evidence: .evidence/I605/farframe604.json + smoke605.json + endpins605.mjs (committed -f) | .evidence/I605/ (committed -f) | 0 B on top of ST-569 |",
    "| ST-572  | G2 implementation: main.js R2 gate replaced by the damped dolly DIRECTION - the held azimuth damps toward (dist >= band*arenaR ? radial azimuth : legacy +Z azimuth pi/2) ALWAYS while endless+PLAYING (the damp trigger is no longer gated on the band), and backDir = (cos held, sin held) whenever abs(wrap(held - pi/2)) >= camera.dolly.azDeadband, else null = the exact legacy branch. Properties: bit-identical at steady state inside the band (converged held = pi/2 -> deadband -> null); identical to farframe603 R1/R2 at the rims (converged = exact radial; N rim via the deadband -> legacy branch); crossing: cam target continuous, max swing 180 deg * (1 - exp(-1/15)) = 11.6 deg/frame; no cam-ship pass-by (the dolly angle is continuous and back > 0). config.js +1 lever (camera.dolly.azDeadband 1e-4, commented); cameraModel.js ADDITIVE pure radialDollyDir(prevHeld, targetAz, dist, band, dt, tau, deadband, out) (writes {a, backDir or null}, no alloc, wraps shortest arc); main.js held-state kept (pi/2 init, no-alloc out) + backDir from the helper (endless+PLAYING gate kept); tests/cameraModel.test.js +3 (deadband identity -> null / outside-deadband dir / wraparound convergence to legacy inside the band) | src/core/config.js + src/core/cameraModel.js + src/main.js + tests/cameraModel.test.js | ~+300 B expected (E87 budget <= 6,858,000 B / 204) |"
  ])
]);
patches.push([
  L(["- IN: src/core/config.js (ONLY the 2 new levers camera.dolly.band + camera.dolly.azTau, commented); src/core/cameraModel.js (ONLY the additive exported azimuthDamp - existing exports chaseTargets/cockpitTargets/projectNdc/cockpitThrust byte-untouched); src/main.js (endless backDir compute + held-azimuth state ONLY; the campaign rail-tangent branch, the cockpit branch, and the touch/scripted-intent paths byte-untouched); tests/cameraModel.test.js (append only); .evidence/I604..I606."]),
  L(["- IN: src/core/config.js (ONLY the 3 new levers camera.dolly.band + camera.dolly.azTau + camera.dolly.azDeadband [amendment I605], commented); src/core/cameraModel.js (ONLY the additive exported azimuthDamp + radialDollyDir [amendment I605] - existing exports chaseTargets/cockpitTargets/projectNdc/cockpitThrust byte-untouched); src/main.js (endless backDir compute + held-azimuth state ONLY; the campaign rail-tangent branch, the cockpit branch, and the touch/scripted-intent paths byte-untouched); tests/cameraModel.test.js (append only); .evidence/I604..I607."])
]);
patches.push([
  L(["| ST-571  | G87.0 close gate (clone run_closegate602.cjs -> run_closegate606.cjs) + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate | docs + .evidence/I606/ | 0 B |"]),
  L(["| ST-571  | G87.0 close gate (clone run_closegate602.cjs -> run_closegate607.cjs) + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate | docs + .evidence/I607/ | 0 B |"])
]);
patches.push([
  L(["- ST-571 close gate: .evidence/I606/run_closegate606.cjs = clone of the I602 runner (labels CLOSEGATE602 -> CLOSEGATE606, OUTDIR I602 -> I606): causal495 (dist :4200, 3 arms seed-9876) / causal483 (dev :5173, score 11334) / playframe483+491 (dev :5173, A 22/62,472 + P 11/180, B EXACT) / pwa491 (dist :5199, SUMMARY 11/11); ports self-start/self-kill, all 4 verified free after; fresh dist re-measure; CLOSE FLOOR E87 = 7,400,000 - measured."]),
  L(["- ST-571 close gate: .evidence/I607/run_closegate607.cjs = clone of the I602 runner (labels CLOSEGATE602 -> CLOSEGATE607, OUTDIR I602 -> I607): causal495 (dist :4200, 3 arms seed-9876) / causal483 (dev :5173, score 11334) / playframe483+491 (dev :5173, A 22/62,472 + P 11/180, B EXACT) / pwa491 (dist :5199, SUMMARY 11/11); ports self-start/self-kill, all 4 verified free after; fresh dist re-measure; CLOSE FLOOR E87 = 7,400,000 - measured."])
]);
patches.push([
  L(["- dist: 6,853,589 B / 204 (I602) -> E87 ceiling <= 6,858,000 B / 204 (code-only growth in 3 existing dist files; no new dist files; probes/docs land in gitignored .evidence committed -f + production docs, not dist). Floor check at close: 7,400,000 - measured >= 102,400 B (else cut ladder C1: hard-swap R2 without damping, register the crossing swing as a residual)."]),
  L(["- dist: 6,853,589 B / 204 (I602) -> E87 ceiling <= 6,858,000 B / 204 (code-only growth in 3 existing dist files; no new dist files; probes/docs land in gitignored .evidence committed -f + production docs, not dist). Amendment I605: the 3rd lever camera.dolly.azDeadband reopens the 2-lever bound (ST-572 adds it); expected dist delta ~+300 B (I604 6,854,043 -> ~6,854,3xx). Floor check at close: 7,400,000 - measured >= 102,400 B (else cut ladder C1: hard-swap R2 without damping, register the crossing swing as a residual)."])
]);
patches.push([
  L(["(to be filled at close: ST-569 quality bar + unit results / ST-570 farframe604 + smoke numbers / ST-571 CLOSEGATE606 5/5 + fresh dist + CLOSE FLOOR E87)"]),
  L([
    "- ST-570 (I605): farframe604.json - (a) 0/0 all 3 arms / (b) 8/8 / (c) 8/8; G0 frozen (d) FAIL (N2S maxRel 169.05 deg / maxTravel 27.792 u, S2N 129.28 / 24.806, W2E 79.16 / 17.853, driftFail 1-2, boxFailSampled 1/7/7); G1 FAIL (N2S fixed 11.61 / 2.829 u, S2N 129.28 / 24.806 u - teleport relocated); G2 amended PASS (maxRel 11.61 / 10.86 / 5.82 deg, maxTravel 2.829 / 4.063 / 1.850 u, drift 0.0271 / 0.0390 / 0.0157 = 0 fails, shipFrameFail 0/0/0, legacyBoxOK). smoke605.json - OK=true, portFree=true, console 0/0, pageerror 0, no NaN, minDist 9.49 / maxDist 23.53 u, maxCamStep 2.542 u/frame; live whip documented at the S-side re-entry (i=340 cam z -3.36 -> i=360 cam z -28.34 across the ship, 175.45 deg ship-relative cam-position step). (d) RE-FROZEN amended (d1)-(d5) per the ST-570 row; (d5) re-pin (0,+0.1875) WITH MEASUREMENT (endpins605.mjs: converged radial rim poses, ship facing outward (0,+0.1875); facing center (0,-0.1428) at the S rim).",
    "- (to be filled at close: ST-572 G2 implementation + farframe604 re-run as acceptance / ST-571 CLOSEGATE 5/5 + fresh dist + CLOSE FLOOR E87)"
  ])
]);
patches.push([
  L(["- E87 4/4 stories DONE (ST-568 docs + probe numbers / ST-569 implementation + unit tests / ST-570 farframe604 PASS on the frozen acceptance + smoke / ST-571 G87.0 close)."]),
  L(["- E87 5/5 stories DONE (ST-568 docs + probe numbers / ST-569 implementation + unit tests / ST-570 farframe604 + (d) re-freeze + smoke / ST-571 G87.0 close / ST-572 G2 implementation + amended (d) PASS)."])
]);
patches.push([
  L(["Next owner: I604 = ST-569 (R2 implementation per the frozen design)."]),
  L(["Next owner: I606 = ST-572 (G2 damped dolly direction per the amended design; ST-570 DONE I605, (d) re-frozen (d1)-(d5))."])
]);
for (let i = 0; i < patches.length; i++) {
  const [a, b] = patches[i];
  const n = s.split(a).length - 1;
  if (n !== 1) { console.error("PATCH FAIL #" + (i + 1) + " count=" + n + " anchor: " + a.split(E)[0].slice(0, 70)); process.exit(1); }
  s = s.split(a).join(b);
}
fs.writeFileSync(p, s, "utf8");
console.log("SCOPE-CHECK AMENDED OK (8 patches)");