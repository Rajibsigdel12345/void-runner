const fs = require('fs');
const path = require('path');
function countFiles(d) { let n = 0; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) n += countFiles(f); else n++; } return n; }
const NF = countFiles('dist');

function edit(p, oldStr, newStr) {
  let s = fs.readFileSync(p, 'latin1');
  if (!s.includes(oldStr)) { console.error('OLD NOT FOUND in ' + p + ': ' + oldStr.slice(0, 80)); process.exit(1); }
  if (s.includes(oldStr) && s.split(oldStr).length - 1 !== 1) { console.error('NOT UNIQUE in ' + p); process.exit(1); }
  fs.writeFileSync(p, s.replace(oldStr, newStr), 'latin1');
  console.log('edited ' + p);
}

// 1) iterations.md: append I550 block
{
  const p = 'production/iterations.md';
  let s = fs.readFileSync(p, 'latin1');
  if (s.includes('## I550')) { console.error('I550 already in iterations.md'); process.exit(1); }
  if (!s.endsWith('\n')) s += '\n';
  const block =
'## I550 (ST-516, E75): D1b cockpit bow framing G-c fix - cockpitLookDrop 1.2 -> 4.0 (config-only, zero mesh change) - bow frames the cockpit bottom WITH MEASUREMENT\n' +
'- Goal (ST-516 / D1b): fix the ONE measured gap G-c from I549 - "ship NOT visible in the cockpit view" (nose NDC y -1.50..-0.62, screenshot floor-only) - via cockpit camera config so a portion of the ship frames the first-person view, per user verbatim "show like some portion of the ship to the player to really feel the person is sitting in the cockpit". Per the ST-515 measurements G-a (labels) + G-b (V-switch damped) + the control mapping (W = +fwd, "W moves back" REFUTED) were all CLOSED BY MEASUREMENT -> no change applied; only G-c is fixed.\n' +
'- Changed: src/core/config.js ONLY - cockpitLookDrop 1.2 -> 4.0 (~1.15 deg -> ~3.8 deg down-pitch at lookFar 60; eases to ~2.3 deg at the full-speed lookFar 100). cockpitHeight 1.02 / cockpitSetback 0.15 unchanged (I504). No mesh, no geometry, no cameraModel code, no test changes (cameraModel tests are symbolic vs CFG and pass unmodified). Evidence: .evidence/I550/ (bowprobe550.mjs sweep harness + bowprobe550.json + dbg550*.mjs matrix dumps + verify550.mjs live-tick harness + verify550.json + cockpit_before.png [old config] + cockpit_after.png [new config] + run_closegate550.cjs + 5 harness .out + patch scripts) + production docs (this block + ST-516 DONE + timeline + active) + CHANGELOG (player-facing cockpit line).\n' +
'- Measured (seed 71202, fx=off, 1280x720, headless SwiftShader):\n' +
'  - Bow cloud: 2,405 real bow vertices (ship v7 GLB meshes, slab d -0.05..4.5 u ahead of the seat, lat < 0.65 u, y > 0.05).\n' +
'  - Sweep 4 eye heights x 6 drops = 16 candidates, each projected through a real camera matrix (single boot, .evidence/I550/bowprobe550.mjs): picked h=1.02 (unchanged) / drop=4 - inF 644/2405 (26.8%), yMin -0.967 (bow reaches the frame bottom), centerBand 12 (cleanest crosshair zone of all 16), horizonY 0.109 (horizon above the crosshair band), minD 0.433 (no near-clip; floor 0.15). Runners-up: drop=2 (inF 764 but horizonY 0.052 - horizon glued to the crosshair band) and the h=0.9 row (inF <= 400, weaker bow presence).\n' +
'  - Live verify (.evidence/I550/verify550.mjs - the real tick places the camera from the patched config, cockpit entered via the V cycle): camMode cockpit, camPos (0, 1.047, 0.160) [ship hover bob + 1.02], fov 60, inF 760/2405 (31.6%), yMin -0.961, yMax 0.996 [overhead canopy frames the top], centerBand 15, horizonY 0.110, minD 0.443 -> G-c VERIFY PASS. cockpit_after.png: bow deck fills the bottom of the frame, crosshair centered, bearing strip bottom (vs I549 cockpit.png floor-only). The deck/floor color similarity in the still is an art follow-up, not the G-c camera gap.\n' +
'  - r187 note: three.js r187 Vector3.applyMatrix4 now DIVIDES BY W (perspective division; vendored three.core.js) - a point projected through projectionMatrix is ALREADY NDC; the harnesses account for this (I549 numbers were valid - they never divided by w).\n' +
'- Gate evidence (measured): (1) npm test 1,201/1,201. (2) npm run build 0. (3) Browser: the verify550 run IS the smoke - console err/warn 0/0 + cockpit_after.png. (4) dist 5,559,213 B / ' + NF + ' files (from 5,559,215 B: config comment text; ceiling 6,100,000 B). (5) vendor r187 pins EXACT 4/4 (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017). (6) 5 fresh regression harnesses ALL EXACT (run_closegate550.cjs: causal495 CAUSAL495 PASS + causal483 CAUSAL456 PASS + playframe483 + playframe491 PLAYFRAME456 PASS [A 22/32,717 + 11/180, B 52/69,272 - NO re-pin: camera config only, zero mesh change] + pwa491 SUMMARY 11/11; stdout .evidence/I550/*.out).\n' +
'- Bookkeeping: iterations.md + stories.md (ST-516 DONE) + epics.md (ST-516 DONE in the E75 Stories line) + timeline.md + active.md + CHANGELOG (player-facing cockpit line).\n' +
'- Next: I551 = ST-517 (D2) - campaign Level 5 data (config 5th level row + 4 dhue-checked zone palettes + campaignBoss hp/phases[5] + i18n en/zh/ja + tests) per production/scope-check-E75.md.\n';
  fs.writeFileSync(p, s + block, 'latin1');
  console.log('appended I550 to iterations.md');
}

// 2) stories.md: ST-516 line -> DONE
edit('production/stories.md',
'- ST-516 E75 D1b cockpit/camera polish fixes (I550) - PENDING/E75 (apply only measured gaps: mode-specific control labels [cockpit W=FWD MOUSE=TURN] + damped mode switch IF measured to snap + nose/crosshair tuning IF NDC gap + control-mapping fix ONLY IF probe confirms the w-moves-back report is a real bug; no sim change, no speculative inversion)',
'- ST-516 E75 D1b cockpit/camera polish fixes (I550) - DONE I550 (applied the ONLY measured gap G-c - cockpit bow framing: cockpitLookDrop 1.2 -> 4.0 in config.js ONLY [~3.8 deg down-pitch at lookFar 60; height/setback unchanged]; 2,405-vert bow sweep over 16 candidates + live-tick verify from the patched config: inF 760/2405 [31.6%], yMin -0.961 [bow at frame bottom], yMax 0.996 [canopy frames the top], centerBand 15 [crosshair zone clean], horizonY 0.110, minD 0.443 [no near-clip], camMode cockpit, console 0/0; G-a labels + G-b V-switch + WASD mapping were measured CLOSED in I549 -> no change; zero mesh change -> no re-pin; quality bar 6/6 [tests 1,201/1,201 / build 0 / verify550 smoke [cockpit_after.png] / dist 5,559,213 B / vendor 4/4 / 5 fresh harnesses ALL EXACT via run_closegate550.cjs [A 22/32,717 + 11/180, B 52/69,272 NO re-pin + pwa491 SUMMARY 11/11; stdout .evidence/I550/*.out]])');

// 3) epics.md: ST-516 segment PENDING -> DONE
edit('production/epics.md',
'ST-516 (I550) D1b cockpit/camera polish for measured gaps (mode-specific labels + damped switch-if-snap + nose/crosshair tuning-if-gap + control-mapping fix-if-confirmed) - PENDING.',
'ST-516 (I550) D1b cockpit/camera polish for measured gaps - DONE I550 (only G-c applied: cockpitLookDrop 1.2 -> 4.0 [config-only] - live verify bow in frame [760/2405, yMin -0.961, centerBand 15, horizon 0.110, minD 0.443]; G-a/G-b closed by measurement in I549 -> no change; zero mesh change -> no re-pin; quality bar 6/6).');

// 4) timeline.md: append I550 line
{
  const p = 'production/timeline.md';
  let s = fs.readFileSync(p, 'latin1');
  if (s.includes('I550 (ST-516')) { console.error('I550 already in timeline.md'); process.exit(1); }
  if (!s.endsWith('\n')) s += '\n';
  s += 'I550 (ST-516, E75) - D1b cockpit bow framing G-c fix WITH MEASUREMENT: the ONE measured gap from I549 ["ship NOT visible in the cockpit view" - nose NDC y -1.50..-0.62, floor-only screenshot] -> cockpitLookDrop 1.2 -> 4.0 [src/core/config.js ONLY; ~3.8 deg down-pitch at lookFar 60 easing to ~2.3 deg at full-speed lookFar 100; cockpitHeight 1.02 / setback 0.15 unchanged; zero mesh change] / 2,405-vert bow sweep over 16 candidates [4 heights x 6 drops] through real camera matrices -> pick h=1.02/drop=4 [sweep inF 644/2405, yMin -0.967, centerBand 12, horizon 0.109, minD 0.433] / live-tick verify from the patched config [cockpit via V cycle]: inF 760/2405 [31.6%], yMin -0.961, yMax 0.996 [canopy frames the top], centerBand 15, horizonY 0.110, minD 0.443, fov 60, console 0/0 -> G-c VERIFY PASS [cockpit_after.png: bow deck fills the frame bottom, crosshair centered, bearing strip bottom; deck/floor color similarity = art follow-up] / G-a labels + G-b V-switch + WASD mapping measured CLOSED in I549 -> no change / r187 gotcha documented [Vector3.applyMatrix4 divides by w - NDC after projectionMatrix] / tests 1,201/1,201, build 0, dist 5,559,213 B, vendor 4/4, 5 harnesses fresh EXACT [A 22/32,717 + 11/180, B 52/69,272 no re-pin], pwa 11/11; NEXT I551 (ST-517 D2 campaign Level 5 data)\n';
  fs.writeFileSync(p, s, 'latin1');
  console.log('appended I550 to timeline.md');
}

// 5) active.md: append I550 user-facing paragraph
{
  const p = 'production/session-state/active.md';
  let s = fs.readFileSync(p, 'latin1');
  if (s.includes('I550 (ST-516, E75) done:')) { console.error('I550 already in active.md'); process.exit(1); }
  if (!s.endsWith('\n')) s += '\n';
  s += '\nI550 (ST-516, E75) done: the last cockpit gap is fixed - in the cockpit (first-person) view you can now see your own ship: the bow deck sits at the bottom of the frame in front of the crosshair, so it finally feels like sitting in a cockpit looking over your own bow. The fix is a small camera tuning (the seat view now tilts down ~4 degrees instead of ~1); I swept 16 camera positions against 2,405 points on the bow to pick it, then re-measured in the live game (760 bow points now sit in the frame, nothing near-clipped, the crosshair zone stays clean). Nothing else changed - the controls and the V camera switch were already measured correct last round, so no re-pins. Tests 1,201/1,201, all 5 regression harnesses still exact, dist 5,559,213 B (under the 6.1 MB limit); the push + Pages deploy is delegated. NEXT I551: campaign Level 5 data.\n';
  fs.writeFileSync(p, s, 'latin1');
  console.log('appended I550 to active.md');
}

// 6) CHANGELOG.md: I550 line on top of [Unreleased]
edit('CHANGELOG.md',
'## [Unreleased]\n- I546:',
'## [Unreleased]\n- I550: In the cockpit (first-person) view you can now see your own ship - the bow deck sits at the bottom of the screen in front of the crosshair, so it feels like you are sitting in a cockpit looking over your own bow. A small camera-tuning round; no gameplay, ship, or menu changes. The menu text is available in English, Chinese, and Japanese. The downloadable bundle is 5,559,213 bytes - under the 6.1 MB limit.\n- I546:');

console.log('BOOKKEEPING DONE (dist files: ' + NF + ')');
