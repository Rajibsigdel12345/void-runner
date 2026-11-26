const fs = require("fs");
function rep(file, anchor, replacement, label) {
  const s = fs.readFileSync(file, "utf8");
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(label + ": anchor count " + n + " in " + file);
  fs.writeFileSync(file, s.slice(0, s.indexOf(anchor)) + replacement + s.slice(s.indexOf(anchor) + anchor.length));
  console.log("OK " + label);
}

// 1) config.js: +2 levers inside camera.dolly (after the speed sub-block)
const NL = "\r\n";
rep("src/core/config.js",
  "boost: 1.10        // uniform extra scale of height+dolly-back at full speed; ss = 1 at rest (rest pins stay EXACT). Audit-tuned I559: rim dolly dormant on the campaign rail (s = 1.000 across all 5 levels) -> boost dolly is the primary depth lever there" + NL + "      }" + NL + "    },",
  "boost: 1.10        // uniform extra scale of height+dolly-back at full speed; ss = 1 at rest (rest pins stay EXACT). Audit-tuned I559: rim dolly dormant on the campaign rail (s = 1.000 across all 5 levels) -> boost dolly is the primary depth lever there" + NL + "      }," + NL + "      band: 0.7,           // ST-569 (I604, E87): banded radial dolly (R2, farframe603) - the radial backDir applies only when dist >= band * arenaR; inside the band the legacy world +Z dolly applies -> the I445 invariance stays bit-identical in the inner arena" + NL + "      azTau: 0.25          // ST-569 (I604, E87): held radial-azimuth damping time constant (s) for azimuthDamp - caps the per-frame camera swing across arena-center crossings (12 deg/frame at 60 fps from a 180 deg flip; frozen ceiling 30 deg/frame)" + NL + "    },",
  "config dolly +2 levers");

// 2) cameraModel.js: append the azimuthDamp helper (file ends LF)
const cm = fs.readFileSync("src/core/cameraModel.js", "utf8");
const add = "\n/**\n * ST-569 (I604, E87): shortest-arc exponential angular damping (pure; no DOM/three).\n * k = 1 - exp(-dt/tau): move a fixed fraction of the remaining (wrapped) angular error\n * per step, independent of frame rate. Identity when prev == target. Drives the endless\n * banded radial dolly held camera azimuth (caps the per-frame swing across\n * arena-center crossings; tau 0.25 s -> 12 deg/frame at 60 fps from a 180 deg flip).\n * @param prev held azimuth (rad)\n * @param target target azimuth (rad)\n * @param dt step (s)\n * @param tau time constant (s); must be > 0\n * @returns damped azimuth (rad)\n */\nexport function azimuthDamp(prev, target, dt, tau) {\n  const k = 1 - Math.exp(-((dt > 0 ? dt : 0) / (tau > 0 ? tau : 1e-6)));\n  let diff = target - prev;\n  while (diff > Math.PI) diff -= 2 * Math.PI;\n  while (diff <= -Math.PI) diff += 2 * Math.PI;\n  return prev + diff * k;\n}\n";
if (cm.includes("azimuthDamp")) throw new Error("cameraModel: azimuthDamp already present");
fs.writeFileSync("src/core/cameraModel.js", cm + add);
console.log("OK cameraModel azimuthDamp");

// 3) main.js import line
rep("src/main.js",
  "import { chaseTargets, overviewTargets, cockpitTargets, flightPathCam, cockpitThrust, cockpitAim } from './core/cameraModel.js';",
  "import { chaseTargets, overviewTargets, cockpitTargets, flightPathCam, cockpitThrust, cockpitAim, azimuthDamp } from './core/cameraModel.js'; // ST-569 (I604, E87): +azimuthDamp",
  "main import azimuthDamp");

// 4) main.js module state after railBackDir
rep("src/main.js",
  "const railBackDir = { x: 0, y: -1 }; // ST-525 D3c (I559): rail back = AGAINST travel (+tangent would place camera in front)" + NL,
  "const railBackDir = { x: 0, y: -1 }; // ST-525 D3c (I559): rail back = AGAINST travel (+tangent would place camera in front)" + NL + "const heldRadialAzR2 = { a: Math.PI / 2 }; // ST-569 (I604, E87): endless banded radial dolly - held camera azimuth (rad); init = the legacy +Z dolly azimuth so band entry is continuous; damped via azimuthDamp (tau = dolly.azTau)" + NL + "const endlessBackDirR2 = { x: 0, y: 1 }; // ST-569 (I604, E87): radial backDir out (no per-frame alloc)" + NL,
  "main held-az state");

// 5) main.js call site
rep("src/main.js",
  "  chaseTargets(ship.pos, f, spdFrac, Math.hypot(ship.pos.x, ship.pos.y), CONFIG.arena.radius, CONFIG.camera, camModelOut, onPath ? railBackDir : null); // ST-525 (I559): campaign rail-aligned (CAM-1); endless null -> bit-identical" + NL,
  "  // ST-569 (I604, E87): endless banded radial dolly (R2, farframe603) - when the ship is near the rim (dist >= band * arenaR) the camera sits behind the ship along the line through the arena center, so the arena center and the opposite rim stay in-frustum from every edge; inside the band the legacy world +Z dolly applies (bit-identical, the I445 invariance). The radial direction is a held azimuth damped via azimuthDamp (tau = dolly.azTau) so arena-center crossings swing smoothly (frozen ceiling 30 deg/frame). Campaign rail / MENU / PAUSED / GAME_OVER / REPLAY paths byte-untouched." + NL + "  const shipDistR2 = Math.hypot(ship.pos.x, ship.pos.y);" + NL + "  let endlessBackDirOutR2 = null;" + NL + "  if (!onPath && st === STATE.PLAYING && shipDistR2 > 0.5) {" + NL + "    heldRadialAzR2.a = azimuthDamp(heldRadialAzR2.a, Math.atan2(ship.pos.y, ship.pos.x), dt, CONFIG.camera.dolly.azTau);" + NL + "    if (shipDistR2 >= CONFIG.camera.dolly.band * CONFIG.arena.radius) {" + NL + "      endlessBackDirR2.x = Math.cos(heldRadialAzR2.a);" + NL + "      endlessBackDirR2.y = Math.sin(heldRadialAzR2.a);" + NL + "      endlessBackDirOutR2 = endlessBackDirR2;" + NL + "    }" + NL + "  }" + NL + "  chaseTargets(ship.pos, f, spdFrac, shipDistR2, CONFIG.arena.radius, CONFIG.camera, camModelOut, onPath ? railBackDir : endlessBackDirOutR2); // ST-525 (I559) campaign rail-aligned; ST-569 (I604, E87) endless banded radial (null inside the band -> bit-identical)" + NL,
  "main chaseTargets call");

// 6) tests: import + append ST-569 block
rep("tests/cameraModel.test.js",
  "import { clamp01, smoothstep01, dollyFactor, chaseTargets, projectNdc, overviewTargets, cockpitTargets, cockpitThrust, cockpitAim } from '../src/core/cameraModel.js';",
  "import { clamp01, smoothstep01, dollyFactor, chaseTargets, projectNdc, overviewTargets, cockpitTargets, cockpitThrust, cockpitAim, azimuthDamp } from '../src/core/cameraModel.js'; // ST-569 (I604, E87): +azimuthDamp",
  "test import");
const t = fs.readFileSync("tests/cameraModel.test.js", "utf8");
const tAdd = "\n// ST-569 (I604, E87): azimuthDamp - held-azimuth exponential damping (endless banded radial dolly)\ntest('azimuthDamp: identity (prev == target)', () => {\n  for (let i = 0; i < 24; i++) {\n    const a = (i / 24) * 2 * Math.PI;\n    assert.ok(Math.abs(azimuthDamp(a, a, 1 / 60, 0.25) - a) < 1e-12, 'identity @' + a.toFixed(3));\n  }\n});\n\ntest('azimuthDamp: 1-step factor == 1 - exp(-dt/tau) (dt-consistent)', () => {\n  const dt = 1 / 60, tau = 0.25;\n  const k = 1 - Math.exp(-dt / tau);\n  const cases = [[0, Math.PI / 2], [0.3, -1.1], [-2.5, 2.5], [3.0, -3.0], [Math.PI / 2, -Math.PI / 2]];\n  for (const [prev, target] of cases) {\n    let diff = target - prev;\n    while (diff > Math.PI) diff -= 2 * Math.PI;\n    while (diff <= -Math.PI) diff += 2 * Math.PI;\n    const got = azimuthDamp(prev, target, dt, tau);\n    assert.ok(Math.abs(got - (prev + diff * k)) < 1e-9, 'factor @' + prev + ',' + target);\n  }\n});\n\ntest('azimuthDamp: convergence 0 -> pi, monotone, no overshoot (120 steps @ 60 fps, tau 0.25)', () => {\n  let a = 0, prevA = 0;\n  for (let i = 0; i < 120; i++) {\n    a = azimuthDamp(a, Math.PI, 1 / 60, 0.25);\n    assert.ok(a >= prevA - 1e-12 && a <= Math.PI + 1e-12, 'monotone/no-overshoot step ' + i);\n    prevA = a;\n  }\n  assert.ok(Math.abs(a - Math.PI) < Math.PI / 180, 'within 1 deg of pi, got ' + a.toFixed(5));\n});\n\ntest('azimuthDamp: wraparound takes the shortest arc (-170 deg -> +170 deg goes through 180)', () => {\n  const from = -170 * Math.PI / 180, to = 170 * Math.PI / 180;\n  const step = azimuthDamp(from, to, 1 / 60, 0.25);\n  assert.ok(step < from, 'moves toward -180 deg (short way), got ' + (step * 180 / Math.PI).toFixed(2) + ' deg');\n  assert.ok(from - step < 1.5 * Math.PI / 180, 'first step ~1.29 deg, got ' + ((from - step) * 180 / Math.PI).toFixed(2) + ' deg');\n});\n\ntest('azimuthDamp: crossing pi/2 -> -pi/2 max per-frame step <= 30 deg (frozen E87 ceiling)', () => {\n  let a = Math.PI / 2;\n  let maxStep = 0;\n  for (let i = 0; i < 180; i++) {\n    const next = azimuthDamp(a, -Math.PI / 2, 1 / 60, 0.25);\n    maxStep = Math.max(maxStep, Math.abs(next - a));\n    a = next;\n    if (Math.abs(a + Math.PI / 2) < 1e-4) break;\n  }\n  assert.ok(maxStep <= (30 * Math.PI) / 180, 'max step ' + (maxStep * 180 / Math.PI).toFixed(2) + ' deg');\n});\n";
if (t.includes("ST-569")) throw new Error("tests: ST-569 block already present");
fs.writeFileSync("tests/cameraModel.test.js", t + tAdd);
console.log("OK tests ST-569 block");
console.log("PATCH604 DONE");