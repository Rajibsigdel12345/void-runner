const fs = require("fs");
const path = require("path");
const ROOT = "E:/Game";
const done = [], failed = [];
function readBom(file) { const b = fs.readFileSync(path.join(ROOT, file)); return b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf; }
function patch(file, oldStr, newStr, tag) {
  const p = path.join(ROOT, file);
  const s = fs.readFileSync(p, "utf8");
  const n = s.split(oldStr).length - 1;
  if (n !== 1) { failed.push(file + " [" + tag + "] count=" + n); return; }
  fs.writeFileSync(p, s.split(oldStr).join(newStr), "utf8");
  done.push(file + " [" + tag + "]");
}
function append(file, extra, eol) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, "utf8");
  const endsNl = /\r?\n$/.test(s);
  s += (endsNl ? "" : eol) + extra;
  fs.writeFileSync(p, s, "utf8");
  done.push(file + " [append endsNl=" + endsNl + "]");
}
const FILES = ["src/core/config.js", "src/core/cameraModel.js", "src/main.js", "tests/cameraModel.test.js"];
const bomBefore = {};
for (const f of FILES) bomBefore[f] = readBom(f);

// ---------- 1. config.js: +1 lever azDeadband ----------
patch("src/core/config.js",
  "      azTau: 0.25          // ST-569 (I604, E87): held radial-azimuth damping time constant (s) for azimuthDamp - caps the per-frame camera swing across arena-center crossings (12 deg/frame at 60 fps from a 180 deg flip; frozen ceiling 30 deg/frame)",
  "      azTau: 0.25,         // ST-569 (I604, E87): held radial-azimuth damping time constant (s) for radialDollyDir - caps the per-frame camera swing across arena-center crossings (12 deg/frame at 60 fps from a 180 deg flip; frozen ceiling 30 deg/frame)\r\n      azDeadband: 1e-4     // ST-572 (I606, E87): G2 damped dolly direction - the radial backDir applies only while abs(wrap(held - PI/2)) >= azDeadband; inside the deadband backDir = null = the exact legacy world +Z branch (bit-identical; a converged held always falls back to the legacy view)",
  "config-azDeadband");

// ---------- 2. cameraModel.js: additive radialDollyDir ----------
const RDF = "\n/**\n * ST-572 (I606, E87): G2 damped dolly DIRECTION (pure; no DOM/three; no per-frame alloc).\n * The held camera azimuth damps toward the ship's radial line while outside the band\n * (dist >= band) and toward the legacy +Z azimuth (PI/2) while inside it - ALWAYS, so a\n * crossing never re-applies a stale held azimuth in one frame (the I605 re-entry whip:\n * 169 deg ship-relative cam step + 27.8 u teleport at the S band re-entry). The radial\n * backDir applies while abs(wrap(a - PI/2)) >= deadband; inside the deadband\n * out.backDir = null = the exact legacy branch (chaseTargets' null path).\n * @param prevHeld held azimuth from the previous frame (rad)\n * @param targetAz ship radial azimuth Math.atan2(py, px) (rad); used only when dist >= band\n * @param dist ship distance from the arena center\n * @param band band distance (CONFIG.camera.dolly.band * CONFIG.arena.radius)\n * @param dt step (s)\n * @param tau azimuthDamp time constant (s)\n * @param deadband deadband (rad), CONFIG.camera.dolly.azDeadband\n * @param out { a, backDir, bd } - out.a = new held azimuth (always written); out.backDir =\n *        out.bd (the caller's persistent {x,y}, written in place) when the radial dolly\n *        applies, else null; out.bd is never reallocated.\n */\nexport function radialDollyDir(prevHeld, targetAz, dist, band, dt, tau, deadband, out) {\n  const a = azimuthDamp(prevHeld, dist >= band ? targetAz : Math.PI / 2, dt, tau);\n  let diff = a - Math.PI / 2;\n  while (diff > Math.PI) diff -= 2 * Math.PI;\n  while (diff <= -Math.PI) diff += 2 * Math.PI;\n  out.a = a;\n  if (Math.abs(diff) >= deadband) {\n    out.bd.x = Math.cos(a);\n    out.bd.y = Math.sin(a);\n    out.backDir = out.bd;\n  } else {\n    out.backDir = null;\n  }\n  return out;\n}\n";
append("src/core/cameraModel.js", RDF, "\n");

// ---------- 3. main.js: import + decl + gate ----------
patch("src/main.js",
  "import { chaseTargets, overviewTargets, cockpitTargets, flightPathCam, cockpitThrust, cockpitAim, azimuthDamp } from './core/cameraModel.js'; // ST-569 (I604, E87): +azimuthDamp // ST-415 + ST-416 (I445/I446): pure camera targets (chase dolly + overview + cockpit) + ST-525 (I559)",
  "import { chaseTargets, overviewTargets, cockpitTargets, flightPathCam, cockpitThrust, cockpitAim, radialDollyDir } from './core/cameraModel.js'; // ST-572 (I606, E87): azimuthDamp -> radialDollyDir (G2 damped dolly direction; azimuthDamp stays exported, now used inside radialDollyDir) // ST-415 + ST-416 (I445/I446): pure camera targets (chase dolly + overview + cockpit) + ST-525 (I559)",
  "main-import");

patch("src/main.js",
  "const endlessBackDirR2 = { x: 0, y: 1 }; // ST-569 (I604, E87): radial backDir out (no per-frame alloc)",
  "const endlessBackDirR2 = { x: 0, y: 1 }; // ST-569 (I604, E87): radial backDir out (no per-frame alloc)\r\nconst endlessRadialOutR2 = { a: Math.PI / 2, backDir: null, bd: endlessBackDirR2 }; // ST-572 (I606, E87): radialDollyDir persistent out (no per-frame alloc)",
  "main-decl");

const OLD_GATE = [
  "  // ST-569 (I604, E87): endless banded radial dolly (R2, farframe603) - when the ship is near the rim (dist >= band * arenaR) the camera sits behind the ship along the line through the arena center, so the arena center and the opposite rim stay in-frustum from every edge; inside the band the legacy world +Z dolly applies (bit-identical, the I445 invariance). The radial direction is a held azimuth damped via azimuthDamp (tau = dolly.azTau) so arena-center crossings swing smoothly (frozen ceiling 30 deg/frame). Campaign rail / MENU / PAUSED / GAME_OVER / REPLAY paths byte-untouched.",
  "  const shipDistR2 = Math.hypot(ship.pos.x, ship.pos.y);",
  "  let endlessBackDirOutR2 = null;",
  "  if (!onPath && st === STATE.PLAYING && shipDistR2 > 0.5) {",
  "    heldRadialAzR2.a = azimuthDamp(heldRadialAzR2.a, Math.atan2(ship.pos.y, ship.pos.x), dt, CONFIG.camera.dolly.azTau);",
  "    if (shipDistR2 >= CONFIG.camera.dolly.band * CONFIG.arena.radius) {",
  "      endlessBackDirR2.x = Math.cos(heldRadialAzR2.a);",
  "      endlessBackDirR2.y = Math.sin(heldRadialAzR2.a);",
  "      endlessBackDirOutR2 = endlessBackDirR2;",
  "    }",
  "  }",
  "  chaseTargets(ship.pos, f, spdFrac, shipDistR2, CONFIG.arena.radius, CONFIG.camera, camModelOut, onPath ? railBackDir : endlessBackDirOutR2); // ST-525 (I559) campaign rail-aligned; ST-569 (I604, E87) endless banded radial (null inside the band -> bit-identical)"
].join("\r\n");
const NEW_GATE = [
  "  // ST-569 (I604, E87) + ST-572 (I606, E87): endless banded radial dolly - G2 damped dolly DIRECTION (farframe604 amended design): the held camera azimuth damps toward the ship's radial line while outside the band (dist >= band * arenaR) and toward the legacy +Z azimuth while inside it, ALWAYS while endless+PLAYING, so crossing the arena never re-applies a stale held azimuth in one frame (the I605 re-entry whip: 169 deg ship-relative step, 27.8 u teleport at the S band re-entry). The radial backDir applies while abs(wrap(held - PI/2)) >= dolly.azDeadband; inside the deadband the backDir is null = the exact legacy world +Z branch (bit-identical, the I445 invariance). Frozen amended acceptance (d1)-(d5): max ship-relative cam azimuth step 11.61 deg/frame (ceiling 30) / ship NDC |x|,|y| <= 0.85 every frame / per-frame NDC drift <= 0.06. Campaign rail / MENU / PAUSED / GAME_OVER / REPLAY paths byte-untouched.",
  "  const shipDistR2 = Math.hypot(ship.pos.x, ship.pos.y);",
  "  let endlessBackDirOutR2 = null;",
  "  if (!onPath && st === STATE.PLAYING) {",
  "    const r2o = radialDollyDir(heldRadialAzR2.a, Math.atan2(ship.pos.y, ship.pos.x), shipDistR2, CONFIG.camera.dolly.band * CONFIG.arena.radius, dt, CONFIG.camera.dolly.azTau, CONFIG.camera.dolly.azDeadband, endlessRadialOutR2);",
  "    heldRadialAzR2.a = r2o.a;",
  "    endlessBackDirOutR2 = r2o.backDir;",
  "  }",
  "  chaseTargets(ship.pos, f, spdFrac, shipDistR2, CONFIG.arena.radius, CONFIG.camera, camModelOut, onPath ? railBackDir : endlessBackDirOutR2); // ST-525 (I559) campaign rail-aligned; ST-572 (I606, E87) endless damped radial direction (null inside the deadband -> bit-identical legacy)"
].join("\r\n");
patch("src/main.js", OLD_GATE, NEW_GATE, "main-gate");

// ---------- 4. tests: import + 3 tests ----------
patch("tests/cameraModel.test.js",
  "import { clamp01, smoothstep01, dollyFactor, chaseTargets, projectNdc, overviewTargets, cockpitTargets, cockpitThrust, cockpitAim, azimuthDamp } from '../src/core/cameraModel.js'; // ST-569 (I604, E87): +azimuthDamp",
  "import { clamp01, smoothstep01, dollyFactor, chaseTargets, projectNdc, overviewTargets, cockpitTargets, cockpitThrust, cockpitAim, azimuthDamp, radialDollyDir } from '../src/core/cameraModel.js'; // ST-572 (I606, E87): +radialDollyDir",
  "tests-import");

const TESTS = "\n\ntest('radialDollyDir: deadband identity - converged held at the legacy azimuth inside the band -> backDir null (exact legacy branch)', () => {\n  const out = { a: Math.PI / 2, backDir: null, bd: { x: 0, y: 1 } };\n  for (let i = 0; i < 60; i++) radialDollyDir(out.a, Math.atan2(1, 0), 5, CFG.dolly.band * ARENA, 1 / 60, CFG.dolly.azTau, CFG.dolly.azDeadband, out);\n  assert.equal(out.backDir, null, 'converged held at legacy -> backDir null');\n  assert.ok(Math.abs(out.a - Math.PI / 2) < 1e-6, 'held stays at the legacy azimuth, got ' + out.a.toFixed(6));\n});\n\ntest('radialDollyDir: outside the deadband - radial dolly active, backDir = (cos a, sin a) on the persistent slot', () => {\n  const out = { a: Math.PI / 2, backDir: null, bd: { x: 0, y: 1 } };\n  for (let i = 0; i < 5; i++) radialDollyDir(out.a, 0, ARENA, CFG.dolly.band * ARENA, 1 / 60, CFG.dolly.azTau, CFG.dolly.azDeadband, out);\n  assert.equal(out.backDir, out.bd, 'backDir aliases the persistent bd slot (no alloc)');\n  assert.ok(Math.abs(out.backDir.x - Math.cos(out.a)) < 1e-12 && Math.abs(out.backDir.y - Math.sin(out.a)) < 1e-12, 'backDir = (cos a, sin a)');\n  for (let i = 0; i < 295; i++) radialDollyDir(out.a, 0, ARENA, CFG.dolly.band * ARENA, 1 / 60, CFG.dolly.azTau, CFG.dolly.azDeadband, out);\n  assert.ok(Math.abs(out.a) < 1e-3, 'held converges to the radial (0), got ' + out.a.toFixed(6));\n  assert.equal(out.backDir, out.bd, 'dolly still active at the converged radial');\n});\n\ntest('radialDollyDir: wraparound convergence - start -pi/2, target pi/2, 300 steps -> a ~ pi/2 and backDir -> null', () => {\n  const out = { a: -Math.PI / 2, backDir: { x: 1, y: 0 }, bd: { x: 1, y: 0 } };\n  for (let i = 0; i < 300; i++) radialDollyDir(out.a, Math.PI / 2, ARENA, CFG.dolly.band * ARENA, 1 / 60, CFG.dolly.azTau, CFG.dolly.azDeadband, out);\n  assert.ok(Math.abs(out.a - Math.PI / 2) < 1e-4, 'converged to the legacy azimuth, got ' + out.a.toFixed(6));\n  assert.equal(out.backDir, null, 'backDir null once the held is inside the deadband of legacy');\n});\n";
append("tests/cameraModel.test.js", TESTS, "\n");

for (const f of FILES) {
  const after = readBom(f);
  if (after !== bomBefore[f]) failed.push(f + " BOM DELTA: before=" + bomBefore[f] + " after=" + after);
}
console.log("DONE " + done.length + " patches:");
for (const d of done) console.log("  " + d);
if (failed.length) {
  console.log("FAILED " + failed.length + ":");
  for (const f of failed) console.log("  " + f);
  process.exit(1);
}
console.log("BOM deltas 0. PATCH606 OK");