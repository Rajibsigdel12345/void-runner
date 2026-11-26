# E86 scope check - Cockpit closeout (user standing queue: cockpit controls match the view / "sitting in the cockpit" feel / far-framing end-to-end check)

Opened I598 (ST-564/565/566/567 pre-sketch). E85 CLOSED at I597 (G85.0; eb30c02, remote-verified). E86 takes the TOP of the standing user queue, which the user re-asked in-session: (1) "show some portion of the ship to the player to really feel the person is sitting in the cockpit and replace that line with the crosshair", (2) "the controls donot match ... in some point and the camera angle a key moves towards right and w moves back and s moves forward", (3) "when the player goes to the very far it cannot see all the way back ... same view angle wherever the ship moves".

## Scope Fit

Tree-verified current state (I598 recon - three of the four request items ALREADY SHIPPED; E86 = the residuals):

1. Ship-in-frame (SHIPPED): main.js L1269 keeps the ship visible in cockpit (I504, "per user request") and CONFIG.camera.cockpitLookDrop = 4.0 (I550, ST-516) gives the ~3.8 deg down-pitch; the I550 bow-sweep audit (2405 verts) measured 644 bow verts in-frame, yMin -0.967, centerBand 12, horizonY 0.109, minD 0.433 -> the bow frames the bottom of the first-person view, crosshair zone clean.
2. Crosshair (SHIPPED): bearingStrip.js I504 screen-center dot (#vr-cockpit-dot) + I529 (ST-495, E71 R-CAM-1) "the user asked for a CROSSHAIR, not a plain dot" -> dot + 4 symmetric 11px ticks, cockpit-only, opacity-fade, 0 per-frame JS, 0 draw calls. The 3D fire-line is HIDDEN in cockpit (main.js L1270, I504) - the "line" the user referenced no longer renders there.
3. Cockpit-relative thrust (PARTIAL - the residual bug): main.js L1035 rotates screen-basis thrust by cockpitAim(ship.pos, ap559, ship.aim) = the UNDAMPED pointer-aim direction (I559). But the cockpit CAMERA looks along the DAMPED nose (L1358-1359: cockpitTargets(ship.pos, f, ...) with f = the ship's eased forward). While the pointer is off-axis from the nose (the normal combat state), screen-up (the view direction) != the W-thrust direction, so at some aim/pointer combinations W reads as "back" and S as "forward" - exactly the user-reported symptom. The touch-drag path (L1020) already uses the damped nose -> the two cockpit input paths are INCONSISTENT. Fix = one line: the cockpit thrust basis = world.ship.aim (the damped nose = the direction the cockpit camera looks), making both input paths agree and the basis EXACTLY the view direction for every aim.
4. Far-framing (SHIPPED, never end-to-end verified): chaseTargets dolly factor s(t) (I445, ST-415: camHeight 9 / camBack 13 / lookAhead 2.6 all scale by one uniform s in [1, 1.7], startFrac 0.55, pow 2) -> the ship's screen offset and the camera view angle are invariant wherever the ship moves (invariant by construction; that is the user's "same view angle wherever the ship moves" request, implemented). Plus the speed dolly (I559, boost 1.10) and the campaign rail-tangent backDir (I559 D3a). WHAT IS MISSING: an end-to-end measurement that "all the way back" (the arena center and the opposite rim) is actually in-frustum from the rim. E86 adds the pure-math probe (no code change expected).

Research (I598 fresh): YouTube metadata pass (q1 "first person cockpit HUD crosshair design space shooter", q2 "airship cockpit dashboard 3d game interior"; transcripts unavailable on this MCP - metadata + key moments only, per the standing note): GMTK "The Power of Video Game HUDs" (HUD conventions: diegetic elements may frame the view; the center must stay clean for the aiming line) + sim-POV cockpit immersion builds (the "sitting in the cockpit" feel comes from a dashboard/panel occupying the lower frame, behind the instrumentation). -> ST-565 design frozen from that: a STATIC DOM dashboard band + canopy corner struts, lower-frame only, behind the HUD z (40 < 55), zero animation (reduced-motion safe by construction), zero 3D cost.

Scope-fit verdict: all three residuals are bounded and cheap - one one-line wiring fix + one DOM-only render module + one pure-math probe. No geometry, no draw calls, no RNG, no config levers -> every gate pin EXPECTED EXACT, zero re-pins.

## Fix set (PRE-REGISTERED)

| story   | change                                                                                                                        | files                                                        | expected dist delta |
|---------|-------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|---------------------|
| ST-564  | L1035 cockpit thrust basis: cockpitAim(ship.pos, ap559, ship.aim) -> ship.aim (damped nose = cockpit view direction); ap559 STAYS as aimPoint (firing/aim unchanged); comment updated | src/main.js (1 line + comment)                                | ~0 B (swap; re-measure) |
| ST-565  | new createCockpitFrame(): one DOM element (bottom dashboard band gradient + 2 angled canopy corner struts + faint top canopy vignette), static CSS, opacity-fade with cockpit mode, z-index 40 (behind HUD z 55), 0 per-frame JS after the fade | src/render/cockpitFrame.js (NEW, three-free) + src/main.js (~4 wiring lines next to the gauges) | ~1.5-2.5 KB           |
| ST-566  | NO code change: pure-node probe with the exported chaseTargets + projectNdc; 4 rim directions x 2 orientations + center reference; invariance + in-frustum assertions; numbers to JSON | .evidence/I601/ (committed -f)                                 | 0 B                   |
| ST-567  | G86.0 close gate                                                                                                              | docs + .evidence/I602/                                         | 0 B                   |

## Frozen bounds

- IN: main.js (ST-564's single L1035 basis swap + ST-565 wiring ONLY); src/render/cockpitFrame.js (new module: DOM + CSS only, NO three import, CONFIG import allowed); tests/cameraModel.test.js (append the basis-identity test); the three probe outputs.
- OUT: any config.js property (ZERO lever changes); cameraModel.js (no math changes - cockpitThrust/cockpitTargets/projectNdc/chaseTargets untouched); any other render module (gauges/bearingStrip/reticle untouched - the existing crosshair stays as-is); assets/; the 5-harness runner pins; any other test (zero re-pins expected - if a test fails for a non-cockpit reason, RECORD + re-pin WITH MEASUREMENT, I570 pattern); the campaign rail framing (registered, untouched).

## Measurement protocol (FROZEN)

- ST-564 verification:
  - (a) unit: tests/cameraModel.test.js append - for aim a over 24 steps in [0, 2*pi): cockpitThrust(0,1,a) == (cos a, sin a) and cockpitThrust(0,-1,a) == -(cos a, sin a) and cockpitThrust(1,0,a) == (-sin a, cos a), tol 1e-9. This codifies the wiring contract "screen-up maps to the nose = the cockpit view direction" for EVERY aim.
  - (b) in-page probe .evidence/I599/probe599.mjs (dev :5173 self-start/self-kill, fx=off, console 0/0): seed an endless run; cockpit mode ON; for 8 ship aim angles (0..315 by 45): set the ship aim, park the pointer 30% right of screen center (mouse.move), hold W (thrust 0,1) for 45 ticks, sample ship.pos twice -> velocity direction; assert angle(velDir, noseDir) <= 2 deg at EVERY angle (the ship must accelerate EXACTLY where the view points even with the pointer off-axis). Chase control cross-check (3 angles): thrust (0,1) -> velocity direction == world +y (chase applies input raw, aim-independent) within 2 deg -> the chase path is bit-unchanged.
  - (c) quality bar + 5-harness gate EXACT (the scripted-intent path bypasses L1035 via the intent short-circuit -> causal pins untouched).
- ST-565 verification: .evidence/I600/smoke600.mjs (dev :5173 self-start/self-kill): cockpit ON: #vr-cockpit-frame present, opacity "1", rect bottom-anchored (rect.bottom within 1px of the viewport bottom), z-index 40; the bearing strip + 3 gauges + crosshair dot/ticks all opacity "1" at z 55 (readability: the frame sits BEHIND them); cockpit OFF (chase): frame opacity "0"; reduced motion: the frame's transition == "none". No scene-graph growth: the probe records renderer.info.render.calls in the playframe A window and expects the pinned 22 (DOM-only change).
- ST-566 probe: .evidence/I601/farframe601.mjs (pure node, ZERO servers): import { chaseTargets, projectNdc } from src/core/cameraModel.js; fov 60 (fovBase, spdFrac 0), aspect 16/9, arenaR 26. Cases: ship at the rim in 4 directions (theta = 0/90/180/270 deg, p = (cos, sin) * 26 in arena coords) with the nose facing INWARD (toward the center) and OUTWARD (radial away), plus the center reference (p = 0, fwd = +y, the rest-state pin geometry). Assertions: (a) INVARIANCE: the ship's NDC offset in the rim cases == the center reference offset within 0.005 (the I445 invariant, measured end-to-end); (b) center-visible: with the nose inward, the arena center (0,0,0) projects in front (cz > 0) and |NDC x|, |NDC y| <= 1.0 in all 4 rim directions; (c) back-visible: with the nose outward, the opposite-rim point (-p) projects in front (cz > 0) - in-frustum (|NDC| <= 1) recorded as the stretch metric. All numbers to .evidence/I601/farframe601.json + a summary table. Any FAIL -> RECORD + REGISTER for E87+ (candidate levers: dolly.rimScale / camBack), NO fix inside E86 (scope bounded).
- Close gate (ST-567): .evidence/I602/run_closegate602.cjs = clone of .evidence/I597/run_closegate597.cjs (labels CLOSEGATE597 -> CLOSEGATE602, OUTDIR I597 -> I602): causal495 (dist :4200, expect CAUSAL495 PASS 3 arms seed-9876) / causal483 (dev :5173, score 11334) / playframe483+491 (dev :5173; A 22/62,472 + P 11/180, B 52/132,682) / pwa491 (dist :5199, SUMMARY 11/11); ports self-start/self-kill, all 4 verified free after.

## Budget + pin expectations (PRE-REGISTERED)

- dist: 6,851,951 B / 203 (I596/I597 byte-identical) -> expected <= 6,856,500 B / 204 files across ST-564..566 (cockpitFrame.js + wiring; ST-564's swap ~0 B). RE-MEASURE WITH MEASUREMENT at each iteration. Ceiling 7,400,000 B / tripwire 7,297,600 B.
- Pins: playframe A 22/62,472 + P 11/180, B 52/132,682; causal495 3-arm seed-9876; causal483 score 11334; pwa491 11/11 - ALL EXPECTED EXACT, zero re-pins (DOM-only + input-basis-only changes; no geometry/draw calls/RNG).

## Stories

- ST-564 (I599) cockpit thrust-basis == view-direction fix: the L1035 one-line swap + comment, the unit identity test, probe599 (8-angle cockpit + 3-angle chase cross-check), quality bar 4/4, gate-exact expectation confirmed at the close gate.
- ST-565 (I600) cockpit interior frame (DOM): cockpitFrame.js per the frozen design (dashboard band + 2 canopy struts + top vignette; z 40; opacity fade; RM transition-none; no three import) + main.js wiring (create next to the gauges L533, update next to L1342 with on = inRun && camMode == 'cockpit') + smoke600 + quality bar.
- ST-566 (I601) far-framing verification: farframe601 probe run + JSON + the summary table into the scope-check Verification evidence; NO code change (if a code change becomes "needed", STOP and reopen scope - do not improvise).
- ST-567 (I602) G86.0 close: close gate 5/5 EXACT + fresh dist re-measure + CLOSE FLOOR E86 WITH MEASUREMENT (7,400,000 - dist; headroom >= 102,400 B floor -> cut ladder NOT invoked expected) + AGENTS.md item-4 refresh (E86 clause at head, E85 demoted to prior; byte-safe splice, BOM 1 preserved) + E86 CLOSED (4/4) + push delegate.

## Cut ladder

- C1 (dist pressure or scope slip): drop ST-565 (the DOM vibe item, ~2 KB) -> E86 closes with 2 implementation stories; the interior frame registers for E87+.
- C2 (ST-564 probe fails after 2 iterations): git restore the main.js line, accept-with-documentation + register the control-basis residual WITH the probe data.
- C3 (ST-566 assertion failure): accept-with-documentation (docs-only) + register the far-framing residual (candidate levers dolly.rimScale / camBack) for E87+.
- C4 (any unexpected gate re-pin): material divergence -> RECORD + REGISTER (I570 pattern), re-pin WITH MEASUREMENT, continue.

## Risks

- R1: ST-564 changes the cockpit control feel exactly as the user requested (the reported bug IS the fix); the 8-angle probe bounds the risk; revert cost = 1 line (C2). The no-pointer path is bit-unchanged (the fallback already was the damped nose).
- R2: the dashboard band could visually fight the bearing strip / gauges -> frozen z-order (frame 40 < HUD 55) + smoke600 readability assertions + the band is a lower-14% gradient, transparent in the middle so the strip stays legible.
- R3: the far-framing probe might fail at some rim direction -> record, do NOT fix in E86 (C3).
- R4: the new module must be covered by the PWA service worker precache for offline boot -> pwa491 SUMMARY 11/11 will catch a gap (the build whitelist pattern has covered every new module since I49; expected no action).

## Changed-or-proposed files

- production/scope-check-E86.md (this file, FROZEN, DoD last)
- src/main.js (ST-564: L1035 basis swap + comment; ST-565: ~4 wiring lines)
- src/render/cockpitFrame.js (NEW, ST-565)
- tests/cameraModel.test.js (ST-564: appended identity test)
- .evidence/I599/ (probe599.mjs + outputs), .evidence/I600/ (smoke600.mjs + outputs), .evidence/I601/ (farframe601.mjs + farframe601.json), .evidence/I602/ (close-gate runner + outputs)
- docs: production/epics.md (E86 block), production/stories.md (ST-564..567 lines), production/iterations.md (I598), production/timeline.md (I598), production/session-state/active.md (NEXT at I599), CHANGELOG.md (I598 line); AGENTS.md at close only (ST-567).

## Verification evidence

(to be filled at close: per-story evidence WITH MEASUREMENT + quality bar + the 5-harness gate + CLOSE FLOOR E86)

## DoD

- E86 4/4 stories DONE (ST-564 fix + probe PASS / ST-565 frame + smoke600 PASS / ST-566 probe run + numbers recorded / ST-567 G86.0 close).
- Close gate 5/5 EXACT zero re-pins; fresh dist re-measured under the ceiling; CLOSE FLOOR E86 WITH MEASUREMENT; AGENTS.md refreshed; E86 CLOSED; push delegated + verified; hygiene (all 4 ports free, zero tabs, zero terminals).