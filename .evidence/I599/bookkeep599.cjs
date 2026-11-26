const fs = require("fs");
const bomCount = (s) => (s.match(/\u00EF\u00BB\u00BF/g) || []).length;
function patch(path, patches, mode) {
  let s = fs.readFileSync(path, "latin1");
  const before = bomCount(s);
  for (const p of patches) {
    const n = s.split(p.anchor).length - 1;
    if (n !== 1) throw new Error(path + " anchor count " + n + " != 1 for: " + p.anchor.slice(0, 80));
    const i = s.indexOf(p.anchor);
    s = s.slice(0, i) + p.repl + s.slice(i + p.anchor.length);
  }
  if (mode === "append") {
    s = s + p_append;
  }
  const after = bomCount(s);
  if (before !== after) throw new Error(path + " BOM delta " + before + " -> " + after);
  fs.writeFileSync(path, s, "latin1");
  console.log("patched " + path + " (" + s.length + " B, BOM " + before + ")");
}
let p_append = "";
// P1 scope-check-E86.md (pure LF): fix-table ST-564 row + probe599 results
patch("production/scope-check-E86.md", [
  { anchor: `~0 B (swap; re-measure) |\n| ST-565`,
    repl: `~0 B (swap; re-measure); probe599 PASS n=11 (I599: cockpit 8 angles settled, drift 0.012-0.019 deg, diffEnd 0.003-0.004 deg; chase cross-check 3 angles velDir 0.000 deg from world +y; non-gate regression demo no 180 deg flip; consoleErrors 0) |\n| ST-565` },
]);
// P2 epics.md (CRLF): E86 Stories line ST-564 -> DONE I599
patch("production/epics.md", [
  { anchor: `probe599 (8-angle cockpit + 3-angle chase cross-check) / ST-565 (I600)`,
    repl: `probe599 (8-angle cockpit + 3-angle chase cross-check) - DONE I599: probe599 PASS n=11 [diffEnd 0.003-0.004 deg x 8 angles, chase 0.000 deg, no 180 flip in regression demo, consoleErrors 0] / ST-565 (I600)` },
]);
// P3 stories.md (mixed CRLF/LF): ST-564 line PENDING -> DONE I599 + acceptance
patch("production/stories.md", [
  { anchor: `ST-564 E86 cockpit thrust-basis == view direction fix (I599) - PENDING:`,
    repl: `ST-564 E86 cockpit thrust-basis == view direction fix (I599) - DONE I599:` },
  { anchor: `chase cross-check 3 angles velDir == world +y) + quality bar 4/4 + gate-exact.`,
    repl: `chase cross-check 3 angles velDir == world +y) + quality bar 4/4 + gate-exact + acceptance I599: probe599 PASS n=11 (cockpit 8 angles settled, drift 0.012-0.019 deg, diffEnd 0.003-0.004 deg velDir vs nose; chase cross-check velDir 90.00 deg = world +y, diff 0.000; non-gate demo: nose swung 144.5 deg, never 180 flipped; consoleErrors 0) + unit 24-step sweep tol 1e-9 (1,238/1,238) + regression 2/2 EXACT (playframe491 + causal495, .evidence/I599/run_regression599.cjs, zero re-pins) + quality bar (build 0 / dist 6,851,917 B / 203 = -34 B / vendor 4/4 EXACT).` },
]);
// P4 iterations.md (CRLF, bare tail): append I599 entry
p_append = `\r\n- I599 (ST-564, E86): cockpit thrust-basis == view direction fix SHIPPED - src/main.js L1035 now passes world.ship.aim (damped nose == cockpit camera view direction; recon-verified: no separate heading damping, the cockpit camera forward IS (cos ship.aim, sin ship.aim)) as the cockpit keyboard thrust basis instead of the UNDAMPED pointer aim from cockpitAim(ship.pos, ap559, ship.aim) - with the pointer off-axis (normal in combat) the old basis made W read as "back" / S as "forward" at some angles (the user-reported inversion); ap559 STAYS the aimPoint (firing/aiming intent unchanged), the touch path L1020 already used ship.aim (both cockpit input paths now agree), the chase screen-basis is unchanged, and the scripted-intent bypass keeps the causal pins safe; tests/cameraModel.test.js +ST-564 24-step aim sweep (cockpitThrust(0,1,a) == (cos a, sin a) / (0,-1) == -nose / (1,0) == (-sin a, cos a), tol 1e-9; 19,552 B); probe599 (dev :5173 self-start/self-kill, headless, fx=off, consoleErrors 0) PROBE599 PASS n=11: Part A cockpit 8 angles (pointer parked 0.5w/0.53h) ALL settled, drift 0.012-0.019 deg, speed 11.2-11.7, diffEnd 0.003-0.004 deg (velDir == nose exactly; 8 distinct steady noses -41.12..193.23 deg); Part B chase cross-check 3 angles (hold S) velDir 90.00 deg = world +y, diffFromPlusY 0.000 (no regression); Part C non-gate regression demo (pointer 0.35w/0.85h off-axis) nose swung 144.5 deg during hold, velDir along the averaged swing, never 180 flipped (the old bug's failure mode) - evidence only; quality bar 4/4: npm test 1,238/1,238 (was 1,237) / build 0 / dist 6,851,917 B / 203 (-34 B vs the 6,851,951 baseline: minified L1035 call swap, esbuild strips the comment; within E86 budget <= 6,856,500 B / 204) / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017); regression 2/2 EXACT (.evidence/I599/run_regression599.cjs, clone of the I597 close-gate runner, servers self-start/self-kill): playframe491 PLAYFRAME456 PASS [A 22/62,472 + P 11/180, B 52/132,682, console 0/0] + causal495 CAUSAL495 PASS [webgl + default EXACT seed-9876; webgpu report-only, 3 documented warnings] - zero re-pins (cockpit-keyboard-only change; the scripted-intent path bypasses L1035; the full 5/5 close gate belongs to I602/ST-567); bookkeeping 7-patch all count===1 BOM delta 0; hygiene: all 4 ports free, zero tabs, zero terminals.\r\n- Push: I599 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote).`;
patch("production/iterations.md", [], "append");
// P5 timeline.md (bare tail; separator CRLF CRLF): append I599 paragraph
p_append = `\r\n\r\nI599 (ST-564, E86) done: the cockpit controls now point exactly where the view looks - the reported inversion where W read as "back" at some angles is gone (the thrust direction followed the raw pointer while the camera followed the eased nose; both now follow the eased nose). An 8-angle instrumented drive confirmed the ship goes exactly where it faces at every heading, the chase camera is unchanged, and the old 180-degree-flip failure mode can no longer happen.`;
patch("production/timeline.md", [], "append");
// P6 active.md (CRLF, bare tail): append NEXT at I600
p_append = `\r\n- NEXT at I600 = ST-565 (E86): cockpit interior frame DOM - new src/render/cockpitFrame.js (static dashboard band bottom + 2 canopy corner struts + top vignette; z-index 40 < HUD 55; opacity fades with cockpit mode on/off; transition: none under prefers-reduced-motion; NO three.js import; 0 per-frame JS after fade) + main.js wiring ~4 lines (create next to gauges ~L533, update next to gauges.update ~L1342) + smoke600 (frame opacity/rect/z + HUD readability + RM transition + playframe A draw calls 22 unchanged) + quality bar + bookkeeping + commit + push delegate.`;
patch("production/session-state/active.md", [], "append");
// P7 CHANGELOG.md (pure LF): insert I599 line above the I598 line
patch("CHANGELOG.md", [
  { anchor: `- I598: No visible change - the cockpit-feel round opens:`,
    repl: `- I599: Cockpit controls now point exactly where the cockpit view looks: with the pointer off to the side (normal in combat) the old controls could make W steer "back" at some angles - that inversion is fixed (thrust now follows the eased nose, the same direction the camera looks), confirmed by an 8-angle instrumented drive plus a chase-camera re-check showing no regression.\n- I598: No visible change - the cockpit-feel round opens:` },
]);
console.log("ALL 7 PATCHES OK");
