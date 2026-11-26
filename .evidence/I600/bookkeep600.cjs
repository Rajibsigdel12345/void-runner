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
// 1. scope-check fix-table ST-565 row: fill measured result cell
patch("production/scope-check-E86.md", "scope-fixtable-ST565", s => {
  const a = "~1.5-2.5 KB";
  if(count(s,a)!==1) throw new Error("anchor count");
  const i = s.indexOf(a);
  const j = s.indexOf("|", i);
  if(j < 0) throw new Error("no closing pipe");
  const cell = "+1,672 B (I600 measured: 6,851,917 -> 6,853,589 B / 204 files); smoke600 PASS [z 40, opacity 1<->0 with cockpit mode, 7 static gradient layers, HUD z 55 above frame, RM transition none, consoleErrors 0; 2 art-tune iterations; final struts 35/145deg edge-to-edge] ";
  return s.slice(0, i) + cell + s.slice(j);
});
// 2. epics E86 Stories line: ST-565 -> DONE I600
patch("production/epics.md", "epics-Stories-ST565", s => splice(s,
  "ST-565 (I600) cockpitFrame.js + main.js wiring + smoke600 / ST-566 (I601)",
  "ST-565 (I600) cockpitFrame.js + main.js wiring + smoke600 - DONE I600: smoke600 PASS [z 40, opacity 1<->0 with mode, 7 layers, HUD z 55 above frame, RM transition none, consoleErrors 0] + regression 2/2 EXACT + dist 6,853,589 B / 204 / ST-566 (I601)"));
// 3. stories ST-565 line: PENDING -> DONE I600 + acceptance
patch("production/stories.md", "stories-ST565", s => {
  let t = splice(s, "- ST-565 E86 cockpit interior frame DOM (I600) - PENDING:", "- ST-565 E86 cockpit interior frame DOM (I600) - DONE I600:");
  const acc = "; smoke600 PASS (dev :5173 self-start/self-kill, headless, reseed 71401): frame present z 40, opacity 1 <-> 0 with cockpit mode, rect 1280x720 @ 0,0 (7 static gradient layers), pointer-events none, bearing strip + gauges + crosshair dot z 55 > frame 40, RM transitionInline none + instant opacity 1, consoleErrors 0 (RM toggled in-page via applySettings); 2 art-tune iterations (v1 112deg 46%x62% slab too thick -> v2 143deg 42%x58% blunt block ends -> v3 final 35/145deg edge-to-edge A-pillar bands; visual-cockpit-clear.png / visual-chase.png); regression 2/2 EXACT (playframe A 22/62,472 + P 11/180, B 52/132,682; causal495 3-arm seed-9876 EXACT, webgpu report-only) + quality bar 4/4 (npm test 1,238/1,238 / build 0 / dist 6,853,589 B / 204 [+1,672 B vs 6,851,917 I599; within E86 budget <= 6,856,500 B / 204] / vendor 4/4 EXACT)";
  return splice(t, "playframe A draw calls 22 unchanged) + quality bar.", "playframe A draw calls 22 unchanged) + quality bar" + acc + ".");
});
// 4. iterations: append I600 entry + Push line
patch("production/iterations.md", "iterations-I600", s => {
  if(!s.endsWith("via git ls-remote).")) throw new Error("unexpected tail: " + JSON.stringify(s.slice(-60)));
  const entry = "\r\n- I600 (ST-565, E86): cockpit interior frame DOM - new src/render/cockpitFrame.js (2,572 B src, three-free): one fixed aria-hidden div #vr-cockpit-frame (position fixed inset 0, z 40 < HUD 55, pointer-events none, opacity 0 -> 1 with cockpit mode, transition opacity .3s) with 7 STATIC gradient layers: 2 hairline dashboard edges (cyan 0.10, 40%x15% bottom L/R) + 2 A-pillar struts (linear-gradient 35deg rgba(13,19,33,0.45) band at 17.5/19.3/20.1/21.9% of the 1324px gradient line, left top; mirror 145deg right top = clean edge-to-edge canopy struts: left edge y~50% -> bottom edge x~35%) + 2 dashboard bands (dark navy 0.85 -> 0, 40%x15% L/R, transparent center) + top vignette (9%, 0.40); createCockpitFrame() returns {update, el}; update touches the DOM only on mode/reduced-motion change (opacity 1<->0, transition none under RM); art-tune history (screenshots .evidence/I600/): v1 112deg 46%x62% box slab-like too thick -> v2 143deg 42%x58% blunt floating block ends -> v3 final 35/145deg full-viewport edge-to-edge bands (visual-cockpit-clear.png reads as a canopy; visual-chase.png frame fully gone in chase); main.js 3 splices (len 133,475): import after the createGauges import, const cockpitFrame = createCockpitFrame() after const gauges, cockpitFrame.update({on: st===STATE.PLAYING and camMode=cockpit, reducedMotion: motionOff}) after gauges.update; smoke600 (dev :5173 self-start/self-kill, headless, reseed 71401) SMOKE600 PASS: z 40 / opacity 1<->0 with mode / rect 1280x720 @ 0,0 / 7 layers / pointer-events none / strip+gauges+dot all z 55 > frame 40 / RM transitionInline none + instant opacity 1 / consoleErrors 0 (RM toggled in-page via applySettings); regression 2/2 EXACT (run_regression600.cjs, clone of the 599 runner, OUTDIR .evidence/I600/): playframe491 PLAYFRAME456 PASS [A 22/62,472 + P 11/180, B 52/132,682, console 0/0] + causal495 CAUSAL495 PASS [webgl + default EXACT seed-9876; webgpu report-only, 3 documented warnings] - zero re-pins (DOM-only change; the full 5/5 close gate belongs to I602/ST-567); quality bar 4/4: npm test 1,238/1,238 / build 0 / dist 6,853,589 B / 204 (+1,672 B vs 6,851,917 I599; within E86 budget <= 6,856,500 B / 204, headroom 2,911 B) / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017); I599 push c713cb3 confirmed on origin main (git ls-remote, this turn); PWA precache R4 resolved by recon: dist/sw.js precaches only ./ and ./index.html, everything else runtime-cached after first online load - no explicit module list to update (pwa491 11/11 confirmed at the I602 close gate); bookkeeping 7-patch all count===1 BOM delta 0; hygiene: all 4 ports free, zero tabs, zero terminals.";
  const push = "\r\n- Push: I600 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote; the I599 push c713cb3 confirmed on origin main this turn).";
  return s + entry + push;
});
// 5. timeline: append I600 player-facing paragraph
patch("production/timeline.md", "timeline-I600", s => {
  if(!s.endsWith("never 180 flipped (the old bug's failure mode) can no longer happen.")) throw new Error("unexpected tail: " + JSON.stringify(s.slice(-80)));
  return s + "\r\n\r\nI600 (ST-565, E86) done: the cockpit view now has a subtle dashboard and canopy frame around it, so first-person flight feels like sitting in a real cockpit. It fades in and out with the cockpit camera and never gets in the way of the instruments or the crosshair.";
});
// 6. active: NEXT at I601
patch("production/session-state/active.md", "active-NEXT-I601", s => {
  if(!s.endsWith("+ quality bar + bookkeeping + commit + push delegate.")) throw new Error("unexpected tail: " + JSON.stringify(s.slice(-80)));
  return s + "\r\n- NEXT at I601 = ST-566 (E86): far-framing verification probe - .evidence/I601/farframe601.mjs PURE-NODE (no server/browser): import chaseTargets + projectNdc from src/core/cameraModel.js (FIRST confirm both are exported + the module is DOM-free); fov 60 / aspect 16:9 / arenaR per CONFIG.arena.radius; 4 rim dirs x in/out + center; (a) ship NDC offset invariance tol 0.005, (b) arena center in-frustum from rim, (c) opposite rim in-front; farframe601.json + numbers into scope-check evidence; NO code change (stop-and-reopen-scope if one becomes needed) + quality bar + bookkeeping + commit + push delegate.";
});
// 7. CHANGELOG: insert I600 line above I599
patch("CHANGELOG.md", "changelog-I600", s => splice(s,
  "- I599: Cockpit controls",
  "- I600: The cockpit now has a subtle dashboard and canopy frame around the view, so first-person flight feels like sitting in a real cockpit. It fades in and out with the cockpit camera and never gets in the way of the instruments or the crosshair.\n- I599: Cockpit controls"));
if(fails > 0){ console.log("PATCHES FAILED: " + fails); process.exit(1); }
console.log("ALL 7 PATCHES OK");