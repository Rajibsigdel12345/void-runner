# E71 Camera Framing + Cockpit FPV - Measured Audit + Research (I528)

Method: cgs-scope-check + cgs-asset-audit (measured audit, WITH MEASUREMENT culture) + cgs-create-stories. LABELED YouTube MCP grounding (chapter-level cites only; transcripts rate-limited per house norm). Docs-only, zero src.

## 0. Why this episode (the audit finding)

The standing-queue item (1) "camera framing + cockpit FPV" was reopened as E71 in the handoff with a full research/implementation plan. A measured audit against the CURRENT HEAD (bf6df5f, I527) found that the user's three verbatim camera/FPV requests were ALREADY SHIPPED in earlier episodes. The genuine residuals are small. This doc records the measured state, the grounding, and the pre-registered residuals/levers/branches so E71 does NOT re-do shipped work (no over-engineering; smallest-lever-first).

The user's verbatim requests (the E71 ask):
  (A) "when the player goes to the very far it cannot see all the way back - can it not be like same view angle wherever the ship moves"
  (B) "add in the cockpit view ... show like some portion of the ship to the player to really feel the person is sitting in the cockpit and replace that line with the crosshair i think it give more vibe"
  (C) "the controls donot match ... the control architecture cant be same as the one we have in chase since we only see whats in front ... w moves back and s moves forward"

## 1. Measured current state (HEAD bf6df5f, I527) - what is ALREADY shipped

(A) Chase stable framing - DONE (ST-415, I445):
  - src/core/cameraModel.js: chaseTargets + dollyFactor. The file header CITES the user's exact report verbatim. The legacy fixed-offset rig (ship.x, 9, ship.y+13) put the camera OUTSIDE the r=26 rim at arena y=+20, dropping the arena behind the ship out of frame. Fix: the chase offset (height, dolly-back) AND look-ahead all scale by ONE uniform factor s(t), t = dist/arenaR, s = 1 + (rimScale-1)*smoothstep((t-startFrac)/(1-startFrac))^pow. Because all three lengths scale by the same s, the camera->ship and camera->look RAY ANGLES are exactly invariant with position (the screen offset + view angle are a strict invariant wherever the ship moves). At center (t<=startFrac) s=1 -> legacy (9,13) framing bit-preserved.
  - CONFIG.camera (config.js): camHeight 9, camBack 13, dolly {startFrac 0.55, rimScale 1.7, pow 2}, lookAhead 2.6, lookAheadSpeed 2.
  - main.js:1306 applies chaseTargets every frame. This is request (A) implemented.
  Far-view magnitude - MEASURED (I504 / ST-470, E67): the far-view behind-ship read was measured at 8.6% at rest, within the pre-registered <= 10% rule. Request (A) is therefore CLOSED-with-measurement from E67. E71 re-verifies it in BOTH modes (R-CAM-2).

(B1) Cockpit shows a portion of the ship - DONE (I504 / ST-470):
  - CONFIG.camera: cockpitHeight 1.02 (SHIP_HOVER 0.4 + 0.62 above ship center; v6 canopy top 0.13 u below the eye = in-frame bottom), cockpitSetback 0.15 (moved forward from 0.55 so the nose + canopy frame the view), cockpitLookDrop 1.2 (gentle ~1.1 deg down-pitch at lookFar 60 frames the nose/canopy at the bottom).
  - main.js:1232 shipMesh.group.visible = true in cockpit (the nose + canopy frame the seat). This is the "show a portion of the ship" implemented.

(B2) "replace that line with the crosshair" - PARTIAL (I504 / ST-470):
  - The 3D fire-line (src/render/reticle.js) is HIDDEN in cockpit (main.js:1233, I504).
  - It is replaced by a SMALL SCREEN-CENTER DOT: src/render/bearingStrip.js element #vr-cockpit-dot - a 4x4 px div at screen center (border-radius 50%, background rgba(235,245,255,0.85), cyan box-shadow), faded with the cockpit mode.
  - GAP: the user asked for a "crosshair"; the shipped state is a plain DOT. This is residual R-CAM-1.

(C) View-relative cockpit controls - DONE (I504 / ST-470):
  - src/core/cameraModel.js: cockpitThrust(tx,ty,aim) rotates the screen-basis thrust into the camera basis (screen-up = along the seat axis, screen-right = camera right), so in the first-person seat W = forward along the heading, S = back, A/D = left/right relative to the heading. Identity at the default aim (-PI/2, nose-up) so the legacy screen-basis convention is preserved where it already worked.
  - main.js:995 applies it to the touch-drag intent; main.js:1009 applies it to the WASD intent in cockpit (the chase path keeps the screen-basis thrust bit-identical, so the causal harness is untouched). This is request (C) implemented.

Other (context, already shipped): overview fixed 3/4 view (ST-416 I446 overviewTargets, overviewHeight 56/back 20); V hotkey cycles chase/overview/cockpit (main.js:797); settings cameraMode (main.js:477); cockpit bearing-strip orientation aid (ST-444 I477 bearingStrip.js, 260x64 canvas, 0 new 3D draw calls); cockpit speed look-ahead + FOV kick (ST-444 I477 cockpitLookSpeed 40, cockpitFovSpeed 9).

## 2. Grounding (LABELED YouTube MCP, chapter-level cites only)

Crosshair / reticle design (grounds R-CAM-1):
  - "E03 - Create A Dynamic Crosshair // Make An FPS in Godot 4" (StayAtHomeDev, https://youtu.be/B-PvZgVdU4o): 1:28 Centering The Crosshair, 1:53 Drawing The Center Dot, 3:33 Setting Up Line2D Nodes, 3:52 Line2D Coordinates -> the canonical minimal crosshair = a screen-centered center dot + four short symmetric line segments (top/bottom/left/right). Direct design reference.
  - "Unity Crosshair Tutorial in Just 3 Minutes" (NightTime Developments, https://youtu.be/fftXP0llnXg): the standard FPS 4-line + center-dot crosshair. Confirms the 4-tick + dot form.
  - "ULTIMATE CROSSHAIR SETTINGS GUIDE ... Overwatch 2" (Baileys OW, https://youtu.be/MCPwrRJmrXM): 1:05 "Crosshair vs Dot" -> a dot and a 4-tick cross are the two standard minimal forms; the cross is the higher-vibe / more-aim-readable option (matches the user's "gives more vibe").
  - "Why Dead Space has the BEST HUD in gaming" (MarksWong, https://youtu.be/CFN5KVibw3k): 3:16 "Dead Space's UI core principle" -> keep the aim indicator small and unobtrusive; do not clutter the crosshair. Constrains the crosshair to be subtle (thin ticks, moderate opacity), not a busy reticle.

Cockpit / first-person ship convention (grounds that the I504 cockpit is on-model):
  - "F/A 18 Hornet Cockpit View" (alwaysonafterburner, https://youtu.be/Ze3HnXxlX-s): a fixed forward-facing seat, the airframe frames the lower frame.
  - "No man's sky ... first person ship ride view" (sanfor1980, https://youtu.be/-KzX47E4M00): a cockpit where a portion of the ship frames the first-person view for immersion.
  - "Eterium - Cockpit Look Gameplay" (RogueEarth, https://youtu.be/hXGuXYR5Isk): a first-person cockpit look-on for a ship.
  Conclusion: the I504 cockpit (eye at 1.02, setback 0.15, down-pitch, nose/canopy framing the bottom) is the standard first-person-ship convention. No change needed to the cockpit framing; only the aiming indicator (dot -> crosshair) is the residual.

Chase framing (confirms the R-CAM-2 approach):
  - The position-invariant chase framing (offset + look-ahead scale by one uniform factor so the screen offset and view angle do not change with position) is the standard game-dev technique; cameraModel.js chaseTargets implements exactly this (the uniform-scale form is the only one that makes the screen offset a strict invariant). Grounding confirms the approach is correct; E71 VERIFIES it holds numerically in both modes (R-CAM-2 probe).

## 3. Genuine residuals (pre-registered)

R-CAM-1 (ship) - cockpit aiming indicator: dot -> crosshair:
  Design (grounded sec.2, DOM-only, 0 new 3D draw calls, 0 core, 0 sim):
  - Keep #vr-cockpit-dot as the center dot (4x4 px, existing color/glow) so the smoke504 probe stays compatible.
  - Add four short ticks (top/bottom/left/right) around the center: length ~11 px, width 1.5 px, opacity ~0.8, same near-white color rgba(235,245,255,0.85), a small gap (~3 px) from the center dot so the dot reads as the aim point.
  - Fades with the cockpit mode (opacity only); reduced-motion disables the opacity transition (static). No per-frame JS (static CSS shapes; the existing update() toggles opacity).
  - Constraint: subtle (Dead Space principle) - thin ticks, no spread, no animation, no image asset.
  Acceptance: headless probe - in cockpit the crosshair (dot + 4 ticks) is present at screen center; in chase/overview it is hidden (opacity 0 / not visible). smoke504 stays 18/18 (the el + id are preserved).

R-CAM-2 (verify, default document-only) - "same view angle wherever the ship moves" + far-view, both modes:
  Probe (WITH MEASUREMENT, headless): measure the chase framing in (a) ENDLESS at the arena rim (t->1, the I445 dolly engages) and (b) CAMPAIGN at the max flight-path excursion (the race line + flightPathCam lift). For each, measure: the camera->ship angle and camera->look angle at two positions (to confirm the invariance) + the behind-ship arena coverage / far-view % (the I504 8.6% was at rest in endless).
  Pre-registered rule: the angle invariance holds (|delta| below a small epsilon) AND the far-view % stays within the I504 band (<= 10%). If both hold -> DOCUMENT (0 src). If a measured gap -> ONE smallest config lever WITH MEASUREMENT (smallest-lever-first; e.g. a dolly.rimScale or a cockpit look param), re-pinning the playframe B pin only on measured drift.
  Default expectation (from the I445 invariant + I504 measurement): document-only, no lever.

## 4. Cut ladder
  C1: R-CAM-1 four ticks -> two ticks (top + bottom only) if a quick A/B read shows the 4-tick is too busy at the rest FOV. (Not expected; the grounded design is 4-tick.)
  C2: R-CAM-2 document-only (the default) if both the angle invariance and the far-view band hold - no lever, no src.

## 5. Risks
  K1: R-CAM-1 adds a DOM element - NOT a 3D draw call (CSS shapes), so the draw-call pins are untouched. Keep the existing #vr-cockpit-dot el + id (probe compatibility).
  K2: R-CAM-1 is cockpit-only - it draws ZERO pin surface (cockpit is not active in the pin windows: MENU, reseed-71201 frame 50 [chase], causal seed-9876 [chase], pwa491). So all 5 harness pins stay EXPECTED EXACT.
  K3: R-CAM-2 is probe-only by default. If a lever IS needed and it touches a chase/cockpit CONFIG value active in a pin window, the playframe B pin may move -> re-pin WITH MEASUREMENT only on measured drift (I482/I501 pattern).
  K4: reduced motion - the crosshair is a static shape; the only motion is the opacity fade, which is disabled under RM (transition: none). RM-safe.
  K5: dist - the crosshair is a few bytes of CSS/JS; negligible vs the 844,742 B close-floor headroom. No ceiling impact.

## 6. Pin-safety summary
  R-CAM-1: cockpit-only, zero pin surface, zero core/sim -> all 5 harness pins EXPECTED EXACT, 1,187 tests unchanged (no core).
  R-CAM-2: probe-only (default). A chase/cockpit lever would re-pin playframe B only on measured drift.

## 7. Story map
  ST-494 (I528) - OPEN: this measured audit + scope-check + pre-registered residuals/levers/branches (docs-only, zero src) - THIS DOC.
  ST-495 (I529) - R-CAM-1 crosshair (render-only: bearingStrip.js dot -> dot + 4 ticks; 0 core, 0 sim; headless probe; smoke504 compat; quality bar 6/6).
  ST-496 (I530) - R-CAM-2 far-view cross-mode verification (headless probe: endless rim + campaign path-excursion; document WITH MEASUREMENT; possible ONE smallest-lever WITH MEASUREMENT if a measured gap; quality bar 6/6).
  ST-497 (I531) - G71.0 close gate (fresh 5-harness re-runs ALL EXPECTED EXACT + CLOSE FLOOR E71 re-derived WITH MEASUREMENT + AGENTS.md refresh + quality bar 6/6 + bookkeeping + commit/push).

## 8. Verification bar (every story)
  1) npm test green (1,187). 2) build exit 0. 3) dist < ceiling 6,100,000 B (close floor E70 = 844,742 B headroom). 4) vendor pins EXACT 8/8 + git diff vendor/ empty. 5) regression pins EXACT (re-pin only WITH measurement on measured drift). 6) hygiene (max 1 browser tab / headless, closed after; no lingering servers - kill + verify ECONNREFUSED on 5173/4200/5199). Crosshair probe (cockpit present / chase+overview hidden). Far-view probe (endless rim + campaign excursion: angle invariance + far-view %).

## 9. Changed files (this open, I528)
  - design/e71-camera-fpv-research.md (NEW, this file; pure ASCII LF no-BOM).
  - production/scope-check-E71.md (NEW; pure ASCII LF no-BOM).
  - 6-file bookkeeping (epics E71 block, stories STATUS I528, iterations I528, timeline I528, CHANGELOG I528, active I528 note).
  Zero src, zero assets.

## 10. Next
  I529 = ST-495 (R-CAM-1: cockpit crosshair, render-only, probed).

## 11. I530 (ST-496) R-CAM-2 measured findings (cross-mode, WITH MEASUREMENT)
Probe: .evidence/I530/probe_farview530.mjs (pure core, DOM-free; steady-state targets; fov 60 @ 16:9; SHIP_HOVER 0.4; behind-point 12 u). Output: .evidence/I530/probe530.out.

A. ENDLESS (arena) - rim (t -> 1, dolly engaged, s 1.000 -> 1.700):
  A1 position invariance (center t=0 vs rim t=1, same heading (0,1) + speed):
    - cam->look angle IDENTICAL at both positions: az 180.00 / el -40.87 at rest, -46.97 at full speed (view angle strictly position-invariant).
    - cam->ship az identical (180.00); el differs by exactly 0.50 deg (-33.49 center -> -33.99 rim): SHIP_HOVER 0.4 does not scale with s (only the cam offset does) - known negligible artifact of the uniform-scale form.
    - max ship-NDC delta center->rim: 0.0154 (rest) / 0.0160 (full speed) = <=1.6% of half-screen. ST-415 invariance VERIFIED in endless.
  A2 far-view % (24 theta x 3 radii x 4 headings x 2 speeds = 576 samples; NEW metric, no pre-registered threshold):
    - behind-12m (ship - fwd*12): RIM 50.0% out (288 behind-cam, 0 oob) vs FULL-ARENA 76.4% -> the rim dolly REDUCES out-of-frame by 26.4pp. The fixed world-angle rig (cam always +z of the ship) puts the behind-point on the camera side for exactly half the headings by construction - a property of the rig, not a framing defect; addressable only by a ship-relative rig rebuild (out of scope: would re-pin all causal/playframe harnesses + change game feel; smallest-lever-first).
    - diametric rim point (far rim, 52 u): 83.3% out at rim - physical fov-60 bound for a 52 u arena in a close chase camera; the OVERVIEW mode (ST-416 I446) is the documented whole-arena view (|NDC| <= 0.85 @ 16:9 / fov 60).
    - arena center point: 72.9% out at rim / 63.5% full arena.
B. CAMPAIGN (flight path; max excursion measured 12.50 u at d=235, maxElev 5.40):
  B1 I504 re-verification EXACT: behind-track-12m out-of-frame 43/500 = 8.6% at rest (I504: 8.6% - reproduced to the sample) => WITHIN the pre-registered <=10% rule; 81/500 = 16.2% at full speed (the rule is rest-scoped; the speed lean [lookAheadSpeed + fovSpeed] intentionally shifts framing forward).
  B2 STRUCTURAL FINDING: max path excursion t = 12.50/26 = 0.481 < dolly.startFrac 0.55 -> s = 1.000 over the ENTIRE campaign path: the rim dolly never engages in campaign; the campaign framing is the base (9, 13) rig everywhere (the flightPathCam lift is a pure translation).
  B3 with the flightPathCam lift, cam->ship angle is EXACTLY invariant between d=0 and d=maxExcursion: (az 180.00, el -33.49) at both positions; camLook differs only by path tangent (heading, by design); ship NDC in-frame at both positions and across the full path (rest x[-0.3146,0.3559] y[-0.2843,0.4657]; full speed x[-0.3853,0.4403] y[-0.3229,0.6015]; 0 NaN).
VERDICT: MEASURE-ONLY - NO LEVER. User request (A) "same view angle wherever the ship moves" is numerically CLOSED in both modes: the view angle is strictly position-invariant (endless A1 + campaign B3) and the behind-track far-view in campaign is within the pre-registered rule (B1). The endless behind-cam % (A2) is a property of the fixed world-angle rig, not of the position-invariant framing; a ship-relative rig is a major, disproportionate rebuild. The whole-arena "see everything" need is served by OVERVIEW (V hotkey).
