// I606 smoke harness refinement: the whole-flight maxStepDeg is contaminated by the scripted
// ship teleport at flight start (the camera's straight-line catch-up path crosses the ship,
// producing a ~175 deg ship-relative azimuth step in one frame; present identically in the
// I605 baseline 175.45). The gameplay whip under test is the SOUTH re-entry swing (ship
// crossing the dolly band at y=-18.2). Add: settleI (first frame where ship-relative cam
// azimuth is within 1 deg of the settled chase az +90 deg) and maxStepSettledDeg = max
// per-frame step for steps whose previous frame is at/after settleI. Whole-flight metric
// kept for continuity.
const fs = require("fs");
const P = "E:/Game/.evidence/I606/smoke606.mjs";
let s = fs.readFileSync(P, "utf8");
const bomDelta = (s.charCodeAt(0) === 0xfeff ? 1 : 0) - (s.charCodeAt(0) === 0xfeff ? 1 : 0);
function rep(a, b, tag) {
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log("FAIL anchor " + tag + " count=" + n); process.exit(1); }
  s = s.split(a).join(b);
  console.log("ok " + tag);
}
rep("let maxStep = 0, maxCamStep = 0, minD = 1e9, maxD = 0, bad = 0, prev = null;",
"let maxStep = 0, maxStepAt = 0, maxCamStep = 0, minD = 1e9, maxD = 0, bad = 0, prev = null, settleI = -1, maxStepS = 0, maxStepSat = -1;",
"decls");
rep("if (st > maxStep) maxStep = st;\n          const cs = Math.hypot(cam.x - prev.cx, cam.z - prev.cz);",
"if (st > maxStep) { maxStep = st; maxStepAt = i; }\n          if (settleI >= 0 && i - 1 >= settleI && st > maxStepS) { maxStepS = st; maxStepSat = i; }\n          const cs = Math.hypot(cam.x - prev.cx, cam.z - prev.cz);",
"step-track");
rep("prev = { az, cx: cam.x, cz: cam.z };",
"prev = { az, cx: cam.x, cz: cam.z };\n        if (settleI < 0 && Math.abs(az - Math.PI / 2) < Math.PI / 180) settleI = i;",
"settle-detect");
rep("return { frames, maxStepDeg: +(maxStep * 180 / Math.PI).toFixed(2), maxCamStep: +maxCamStep.toFixed(3), minDist: +minD.toFixed(2), maxDist: +maxD.toFixed(2), bad, state: world.state };",
"return { frames, maxStepDeg: +(maxStep * 180 / Math.PI).toFixed(2), maxStepAt, settleI, maxStepSettledDeg: +(maxStepS * 180 / Math.PI).toFixed(2), maxStepSettledAt: maxStepSat, maxCamStep: +maxCamStep.toFixed(3), minDist: +minD.toFixed(2), maxDist: +maxD.toFixed(2), bad, state: world.state };",
"return");
rep("if (R.flight) console.log(\"maxStep=\" + R.flight.maxStepDeg + \"deg maxCamStep=\" + R.flight.maxCamStep + \" minDist=\" + R.flight.minDist + \" maxDist=\" + R.flight.maxDist + \" bad=\" + R.flight.bad);",
"if (R.flight) console.log(\"maxStep=\" + R.flight.maxStepDeg + \"deg at i=\" + R.flight.maxStepAt + \" settleI=\" + R.flight.settleI + \" maxStepSettled=\" + R.flight.maxStepSettledDeg + \"deg at i=\" + R.flight.maxStepSettledAt + \" maxCamStep=\" + R.flight.maxCamStep + \" minDist=\" + R.flight.minDist + \" maxDist=\" + R.flight.maxDist + \" bad=\" + R.flight.bad);",
"console");
fs.writeFileSync(P, s, "utf8");
console.log("SMOKE606 REFINE OK");