const fs = require("fs");
let fails = 0;
function count(s, sub){ let n=0,i=0; while(true){ i=s.indexOf(sub,i); if(i<0) break; n++; i++; } return n; }
function splice(s, a, b){
  if(count(s,a)!==1) throw new Error("anchor count != 1: " + a.slice(0,60));
  const i = s.indexOf(a);
  return s.slice(0,i) + b + s.slice(i + a.length);
}
function patch(file, name, fn){
  const s = fs.readFileSync(file, "latin1");
  const bomB = count(s, "\u00EF\u00BB\u00BF");
  let t;
  try { t = fn(s); } catch(e){ console.log("FAIL " + name + ": " + e.message); fails++; return; }
  const bomA = count(t, "\u00EF\u00BB\u00BF");
  if(bomB !== bomA){ console.log("FAIL " + name + " BOM delta " + bomB + "->" + bomA); fails++; return; }
  fs.writeFileSync(file, t, "latin1");
  console.log("OK " + name + " " + s.length + " -> " + t.length + " (BOM " + bomA + ")");
}
// 1. scope-check fix-table ST-569 row: fill measured dist delta + results
patch("production/scope-check-E87.md", "scope-fixtable-ST569", s => {
  const a = "~1-3 KB (re-measure)";
  if(count(s,a)!==1) throw new Error("anchor count");
  const i = s.indexOf(a);
  const j = s.indexOf("|", i);
  if(j < 0) throw new Error("no closing pipe");
  const cell = "+454 B (I604 measured: 6,853,589 -> 6,854,043 B / 204 files); unit 1,243/1,243 (+5 azimuthDamp: identity / 1-step factor / convergence monotone no-overshoot / wraparound / 30-deg crossing ceiling); regression 2/2 EXACT zero re-pins (playframe A 22/62,472 + P 11/180, B 52/132,682; causal495 3-arm seed-9876) ";
  return s.slice(0, i) + cell + s.slice(j);
});
// 2. epics E87: header iteration + Stories ST-569 DONE + Status
patch("production/epics.md", "epics-E87-header", s => splice(s,
  "## E87 - Far-framing fix (banded radial dolly backDir, endless only) - OPEN I603 (ST-568 DONE; ST-569/570/571 PENDING)",
  "## E87 - Far-framing fix (banded radial dolly backDir, endless only) - OPEN I604 (ST-568 DONE; ST-569 DONE; ST-570/571 PENDING)"));
patch("production/epics.md", "epics-E87-Stories-ST569", s => splice(s,
  "ST-569 (I604) R2 banded radial implementation (config +2 levers + cameraModel azimuthDamp + main.js endless backDir + unit tests) - PENDING / ST-570",
  "ST-569 (I604) R2 banded radial implementation (config +2 levers + cameraModel azimuthDamp + main.js endless backDir + unit tests) - DONE I604: band 0.7 / azTau 0.25 levers + azimuthDamp pure helper + endless-only held-azimuth backDir (dist >= 18.2 -> damped radial, else null = bit-identical legacy) + 5 unit tests (1,243/1,243) + regression 2/2 EXACT zero re-pins (playframe A 22/62,472 + P 11/180, B 52/132,682; causal495 3-arm seed-9876) + dist 6,854,043 B / 204 (+454 B, within E87 budget <= 6,858,000 B / 204) / ST-570"));
patch("production/epics.md", "epics-E87-Status", s => splice(s,
  "- Status: OPEN I603 (ST-568 DONE I603 docs-only; ST-569/570/571 PENDING).",
  "- Status: OPEN I604 (ST-568 DONE I603 docs-only; ST-569 DONE I604 implementation + 5 unit tests + regression 2/2 EXACT zero re-pins; ST-570/571 PENDING)."));
// 3. stories ST-569: PENDING -> DONE I604 + acceptance
patch("production/stories.md", "stories-ST569", s => {
  let t = splice(s, "- ST-569 E87 R2 banded radial implementation (I604) - PENDING:", "- ST-569 E87 R2 banded radial implementation (I604) - DONE I604:");
  const acc = " implementation as frozen (band 0.7 of arenaR 26 = 18.2; held azimuth {a: PI/2 init = legacy +Z} always damped toward the radial while PLAYING so band entry/exit are continuous, no reset needed by construction); +5 unit tests (identity / 1-step factor / convergence monotone no-overshoot / wraparound shortest-arc / 30-deg crossing ceiling) = 1,243/1,243; regression 2/2 EXACT zero re-pins (playframe A 22/62,472 + P 11/180, B 52/132,682; causal495 3-arm seed-9876) + quality bar 4/4 (dist 6,854,043 B / 204 [+454 B vs 6,853,589 I602; within E87 budget <= 6,858,000 B / 204], vendor 4/4 EXACT)";
  return splice(t, "held-azimuth state, reset on mode change; campaign rail-tangent / cockpit / touch / scripted-intent paths byte-untouched)", "held-azimuth state (always damped toward the radial while PLAYING; continuous by construction, no mode-change reset needed); campaign rail-tangent / cockpit / touch / scripted-intent paths byte-untouched)" + acc);
});
// 4. iterations: append I604 entry + Push line
patch("production/iterations.md", "iterations-I604", s => {
  if(!s.endsWith("[git ls-remote = HEAD]).")) throw new Error("unexpected tail: " + JSON.stringify(s.slice(-60)));
  const entry = "\r\n- I604 (ST-569, E87): R2 banded radial dolly implementation - the first visible change of E87: in the endless arena, once the ship is at least 0.7 x the arena radius (18.2 of 26) from the center, the chase camera now sits behind the ship along the line through the arena center (the damped radial backDir), so the whole arena stays in view from every edge; inside the band the backDir stays null and the view is bit-identical to the legacy fixed world +Z dolly (the I445 screen-offset contract preserved in the inner arena); the held azimuth damps toward the radial with tau 0.25 s so crossing the center never snaps (initial 720 deg/s = 12 deg/frame @ 60 fps, <= 30 deg/frame frozen ceiling, shortest-arc wrap so no 180-deg flip); tracking is endless + PLAYING only (campaign rail-tangent / cockpit / touch / scripted-intent paths byte-untouched; MENU/PAUSED/GAME_OVER/REPLAY stay null). Changes: src/core/config.js +2 commented levers (camera.dolly.band 0.7, camera.dolly.azTau 0.25 after the dolly.speed block); src/core/cameraModel.js additive pure azimuthDamp(prev, target, dt, tau) (k = 1 - exp(-dt/tau), shortest-arc diff with the -PI->+PI wrap convention; existing exports byte-untouched); src/main.js held-azimuth state const heldRadialAzR2 = {a: PI/2} (init = legacy +Z azimuth so band entry is continuous; always damped toward the radial while PLAYING so band exit is continuous too) + no-alloc out endlessBackDirR2 + endless-only backDir gate (st === STATE.PLAYING && shipDistR2 > 0.5 atan2 guard; dist >= band*arenaR -> backDir = (cos a, sin a) else null; onPath campaign branch byte-untouched); tests/cameraModel.test.js +5 (identity at 24 angles / 1-step factor 1 - exp(-dt/tau) 5 cases / convergence 0->PI 120 steps monotone no-overshoot within 1 deg / wraparound -170->+170 through 180 shortest-arc / crossing PI/2->-PI/2 max step <= 30 deg). Quality bar 4/4: npm test 1,243/1,243 / build 0 / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) / dist 6,854,043 B / 204 (+454 B vs I602 6,853,589; within E87 budget <= 6,858,000 B / 204). Regression 2/2 EXACT zero re-pins (run_regression604.cjs, clone of the I600 runner, OUTDIR .evidence/I604/: playframe491 PLAYFRAME456 PASS [A 22/62,472 + P 11/180, B 52/132,682, console 0/0] + causal495 CAUSAL495 PASS [webgl + default EXACT seed-9876; webgpu report-only, 3 documented warnings]) - the pin windows keep the ship inside the band so the view there is bit-identical to the legacy; full 5/5 close gate belongs to I606 (ST-571). Bookkeeping 7-patch all count===1/tail BOM deltas 0 (scope-check fix table ST-569 row + epics E87 header/Stories/Status + stories ST-569 DONE + iterations I604 entry + timeline I604 paragraph + active NEXT at I605 + CHANGELOG I604 line above I603). Hygiene: all 4 ports free, zero tabs, zero terminals. I603 push 13b6591 VERIFIED on origin main this turn (git ls-remote = HEAD).";
  const push = "\r\n- Push: I604 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote; the I603 push 13b6591 confirmed on origin main this turn).";
  return s + entry + push;
});
// 5. timeline: append I604 player-facing paragraph
patch("production/timeline.md", "timeline-I604", s => {
  if(!s.endsWith("it is scoped for the next update.")) throw new Error("unexpected tail: " + JSON.stringify(s.slice(-80)));
  return s + "\r\n\r\nI604 (ST-569, E87) done: the far-framing fix is live in endless. When the ship gets near the edge of the arena, the camera now swings smoothly to sit behind it along the line through the center, so you can see all the way back from every direction instead of the far side slipping out of view. In the middle of the arena the camera behaves exactly as before, the swing is continuous at every edge it crosses, and the campaign, the cockpit, and every automated check came back exactly as they were before.";
});
// 6. active: NEXT at I605
patch("production/session-state/active.md", "active-NEXT-I605", s => {
  if(!s.endsWith("if the ship sits outside the band in the pin windows.")) throw new Error("unexpected tail: " + JSON.stringify(s.slice(-80)));
  return s + "\r\n- NEXT at I605 = ST-570 (E87): farframe604 verification probe - .evidence/I605/farframe604.mjs PURE-NODE (no server/browser; same harness shape as farframe603, R2 only + simulated held-azimuth damping at 60 fps; fov 60 @ 16/9, arenaR 26): (a) inside the band (dist < 18.2) bit-identical to R0 (maxDx 0 / maxDy 0); (b) arena center in-frustum 8/8 (4 rims + 4 in points at 20.8); (c) opp rim in-frustum 8/8; (d) crossing N rim -> S rim at 60 fps: max per-frame camAz step <= 30 deg AND ship NDC within a 0.05 box of (0,-0.1428) at every sampled frame; farframe604.json + headless Chrome smoke (dev :5173 self-start/self-kill, console clean, no NaN, tab closed after) + quality bar + bookkeeping + commit + push delegate.";
});
// 7. CHANGELOG: insert I604 line above I603
patch("CHANGELOG.md", "changelog-I604", s => splice(s,
  "- I603: No visible change - the fix for seeing the whole arena from every edge is designed and measured, and scoped for the next update.",
  "- I604: When your ship is near the edge of the arena, the camera now swings smoothly to sit behind it along the line through the center, so you can see all the way back from every direction instead of the far side slipping out of view; in the middle of the arena the camera behaves exactly as before, and nothing else in the game changed. Bundle now 6,854,043 bytes, under the 7.4 MB limit with 545,957 bytes of room to spare.\n- I603: No visible change - the fix for seeing the whole arena from every edge is designed and measured, and scoped for the next update."));
if(fails > 0){ console.log("PATCHES FAILED: " + fails); process.exit(1); }
console.log("ALL 9 PATCH OPS OK (7 files)");