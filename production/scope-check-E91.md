# E91 scope check - Cockpit presence + cockpit-relative controls

Opened I625 (ST-585..ST-588 pre-registered). E90 CLOSED at I624 (b91087b; push landing verified via git ls-remote before I625 open). The user's most recent explicit critique (cockpit, two parts): (1) presence - "show some portion of the ship to the player to really feel the person is sitting in the cockpit" and "replace that line with the crosshair... it give more vibe"; (2) controls - "the controls donot match... the control architecture cant be same as the one we have in chase since we only see whats in front... w moves back and s moves forward" - W/S/A/D should behave the way they FEEL relative to what is visible.

## Scope Fit

Measured at I625 (on disk, post-I624):
- dist: 6,635,104 B / 205 files (byte-identical to I623; I624 was a docs-only close).
- Close target: 7,297,600 B (7,400,000 ceiling - 102,400 B close-floor). CLOSE FLOOR E90 = 662,496 B (measured at G90.0) -> E91 envelope 662,496 B.
- Assets: 34 GLB / 4,182,504 B / 189,495 t (E90 final). E91 makes NO asset changes: no new GLB, no re-encode, no loader/decoder touch. The nose gun is procedural (1-2 three.js meshes).
- Feasibility: worst-case code-only growth +24,000 B -> dist 6,659,104 B -> margin vs close target 638,496 B (>= 102,400 B floor). Feasible; no cut-ladder trigger expected.

## Research (extracted I625 - YouTube, METADATA-LEVEL label)

Queries: FP cockpit controls / cockpit ship visibility / chase-vs-cockpit aim. Results were mostly metadata-level (titles/snippets, no deep frame analysis). Extracted principles:
1. SINGLE-BASIS RULE (FP-cockpit lineage, Star Citizen FP-cockpit practice): the control basis must equal the camera view basis at all times; any damping divergence between them produces the "controls don't match" feel. -> In this game: fire aims at the undamped pointer while view + thrust follow the damped nose; during a turn that is exactly the divergence the user perceives.
2. SHIP PRESENCE (arcade ship lineage - e.g. Space Battle Ship Gomorrah: gun bottom-center of frame; interior-cam mod practice): the aim point should read as PART of the ship (nose centerline / gun), not a floating crosshair; frame elements (struts, wing roots, engine glow) + FOV sell "sitting in the seat". -> ST-586: procedural nose gun + camera tune framing the ship + aim tick at the gun root.
3. BASIS CHOICE is user-selectable in some cockpit games (camera-relative vs ship-relative movement) -> ST-587 toggle, with the flip guard (a pointer basis can wrap 180 degrees - the I559 incident).

## Code audit (I625, on disk - ST-585 deliverable)

- src/core/cameraModel.js: cockpitTargets(p, fwd, cfg, out, spdFrac) -> cam = p - fwd*cockpitSetback at height cockpitHeight; look = p + fwd*(cockpitLookFar + cockpitLookSpeed*spdFrac) - lookDrop. cockpitThrust(tx, ty, aim, out): out.x = -tx*sin(aim) - ty*cos(aim); out.y = tx*cos(aim) - ty*sin(aim) (fwd = (cos aim, sin aim)). cockpitAim = undamped-pointer basis (ST-525/I559; superseded for thrust by I599).
- src/core/ship.js: default aim = -pi/2 (nose-up); aim = dampAngle(aim, target, aimEase, dt) (config aimEase 9); forward(out) = (cos aim, sin aim).
- src/render/input.js (read I625 - resolves the pre-registered open question): W/Up -> thrust.y -= 1 (forward), S/Down -> +1 (back), A/Left -> x -= 1, D/Right -> +1 - the ST-033 convention (screen right/down = sim +x/+y). Cross-check: cockpitThrust(0, -1, -pi/2) = (0, -1) = the nose direction -> W thrusts nose-forward at the default aim. SIGN CONVENTION CONSISTENT - NO SIGN BUG. The user's "W moves back" was the I559 undamped-pointer 180-degree flip, already fixed for thrust at I599 (damped-nose basis). Residual: fire aims at the undamped pointer while view + thrust follow the damped nose -> during a turn, W moves where the NOSE is, not where the pointer (and the fire) is. That is the "controls don't match" ST-587 addresses.
- src/main.js: L1025 touch-drag -> cockpitThrust(input.touchDrag, ship.aim); L1040 keyboard -> cockpitThrust(input.state.thrust, world.ship.aim) (I599); L1274 ship VISIBLE in cockpit ("nose + canopy frame the seat", I504); L1275 3D reticle fire-line HIDDEN in cockpit -> small screen-center dot; L1344 f = ship.forward(shipFwd) drives the cockpit camera branch L1372-1375.
- config.js camera: cockpitHeight 1.02 / cockpitSetback 0.15 / cockpitLookFar 60 / cockpitLookSpeed 40 / lookDrop (ST-470).
- Ship v9 GLB: 6 flat nodes (VR_Ship_Hull/Wings/Cockpit/Fin/Engine/Nozzle), 3 materials, 82,151 t, 1,441,348 B - NO gun node -> the gun must be procedural.
- .evidence/I495/causal495.mjs: ZERO camMode/cockpit references -> the causal arm never enters cockpit mode (headless probe; scripted intent bypasses the main.js input path). Cockpit changes cannot move the causal score (11334 pin).
- Conclusion: view basis == thrust basis (both the damped nose) - structurally aligned, expected divergence ~0 at any instant. The perceived mismatch = pointer-vs-nose lead during turns + a dot crosshair that does not read as part of the ship.

## Fix set (PRE-REGISTERED)

- ST-585 (I625) - E91 open + audit, ONE atomic commit (docs-only): input.js sign-convention resolution + the audit above; FROZEN scope check; 6-file bookkeeping. dist byte-identical. DONE at I625.
- ST-586 (I626) - cockpit ship presence + ship-part aim, ONE atomic commit: (1) procedural nose gun - 1-2 meshes, ~40-80 t, parented to the ship group, cockpit-only visibility (0 pin impact pre-registered: the pin frames are chase-mode; playframe A/B EXPECTED EXACT enforces it); (2) cockpit camera tune - cockpitSetback 0.15 -> 0.28-0.35, cockpitHeight 1.02 -> 1.20-1.35 (config.js levers, values settled in the screenshot audit; lookDrop kept) so wing roots + engine glow + canopy frame the view; (3) replace the screen-center dot with a small HUD tick at the gun root (project the gun's 3D root to screen; hidden when the gun is behind the camera) - the gun reads as the crosshair; (4) bearing-strip/gauges/cockpitFrame z-order preserved (ST-444/ST-526/I600). Browser screenshot audit before/after (headless first; one tab, closed after). Pins: causal EXPECTED EXACT, playframe EXPECTED EXACT, pwa EXPECTED 11/11.
- ST-587 (I627) - cockpit thrust basis toggle, ONE atomic commit: settings row "Cockpit thrust: Nose (stable, default) | View (pointer-follow)". View = pointer aimPoint basis with the +/-90-degree flip guard (pointer more than 90 degrees from the nose -> fall back to the nose basis; exactly-90-degree tie -> nose, deterministic; the I559 180-degree flip impossible). Pure helper cockpitThrustBasis in cameraModel.js + unit tests (both bases, guard both sides, the tie); keyboard (L1040) + touch (L1025) parity through the same helper; storage key + settings-panel row (storage.js pattern; default Nose = current I599 behavior). Pins: causal EXPECTED EXACT (default = current behavior).
- ST-588 (I628) - G91.0 close gate: 6/6 harness battery (labels CLOSEGATE628) + fresh dist re-measure vs 7,297,600 B + CLOSE FLOOR E91 WITH MEASUREMENT + AGENTS.md refresh (item-4 chain + one-liner) + E91 CLOSED.

## Budget (FROZEN)

- code-only <= 24,000 B -> worst-case dist 6,659,104 B (margin 638,496 B vs the 7,297,600 B close target; >= 102,400 B floor).
- no GLB changes: fleet smoke stays 34/34 / 189,495 t / 4,182,504 B; MAX_FILE_BYTES 1,658,000 B (ship-binding) unchanged.

## Cut ladder (FROZEN triggers)

- C1: gun -> single 40-t cone; drop the camera tune (setback/height stay current).
- C2: drop the View-basis toggle (ST-587 becomes audit + docs only; the nose basis documented as the only option).
- C3: drop the ship-part-aim replacement (keep the screen-center dot; keep the gun presence).
Invoked only on a pre-registered acceptance failure; never silent.

## Constraints / risks

1. Cockpit tune = a visual change in an unpinned mode (cockpit is in no pin frame) -> browser screenshot audit before/after; the config levers make any value easy to revert.
2. Gun cockpit-only visibility must be airtight - chase/overview/MENU frames must not draw it (playframe A/B = chase EXPECTED EXACT is the enforcement).
3. Flip-guard boundary: guard active when the pointer-nose angle is > 90 degrees; exactly 90 degrees ties to the nose basis; unit-tested both sides.
4. Touch parity: the L1025 and L1040 paths share the one helper; the ST-033 screen convention holds for both bases (audit above).
5. Settings persistence: the storage.js pattern, versioned key, default Nose; the causal arm runs the default -> EXACT expected.
6. No EMBLEM_TARGETS / debris assert changes; the arena ring two-pass is INTENDED (E90 finding) - untouched.
7. User standing headless preference: browser opens only for the screenshot audit (I626); one tab, closed after.

## Verification evidence

At open (I625): I624 close gate 6/6 EXACT (CLOSEGATE624) + push b91087b landing verified via git ls-remote before open; the audit above is on disk (code reads + the causal-harness cockpit-reference check). Per story: npm test + build + the pre-registered harness. At close: the G91.0 gate set (6/6 harness + fresh dist + CLOSE FLOOR E91 WITH MEASUREMENT + AGENTS.md refresh).

## DoD

- ST-585..ST-588 all DONE; E91 header CLOSED at the G91.0 gate.
- 34-GLB contract intact (no asset changes; fleet smoke 34/34 / 189,495 t EXACT).
- dist measured <= 7,297,600 B at the close gate; CLOSE FLOOR E91 WITH MEASUREMENT recorded.
- vendor 4/4 EXACT + decoder raw pin intact.
- 6/6 harness at the close gate; causal arms EXACT (webgpu report-only).
- AGENTS.md item-4 chain + one-liner refreshed WITH MEASUREMENT.
- ONE atomic commit per story + the close-gate commit; every commit pushed (delegated) + verified via git ls-remote.
- Hygiene: 0 tabs, all ports free, no terminals left.

## Next owner

I626 = ST-586 cockpit ship presence + ship-part aim (procedural nose gun + camera tune + aim tick at the gun root; browser screenshot audit before/after).