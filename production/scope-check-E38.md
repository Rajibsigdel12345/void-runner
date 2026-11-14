# Scope Check E38 - Touch-Fallback Arc (Floating-Stick Visual + Aim-Offset + Haptics + Touch Targets)

- Iteration: I350 (arc open)
- Skills: cgs-scope-check + cgs-create-stories (docs-only)
- Inputs: AGENTS.md, production/session-state/active.md, production/scope-check-E37.md (pattern + G37.0 closeout + the explicit 'touch-fallback -> E38' deferral), production/iterations.md I281 (E23 gap list: (1) no silent move, (2) aim coupled to thrust finger, (3) reticle hides under the finger, (4) no 2-finger-pause confirmation), src/render/input.js (ST-268 dual-zone, 248 lines, read in full), src/core/touchZones.js (1,053 B), src/render/reticle.js (read in full), src/render/tutorialHint.js (read in full), src/render/screens.js (I71 touch paths, button classes), src/main.js (L173 coarse detect, L462-470 pause button, L688-707 resolveAimPoint, L846 coarse gate, L860 reticle sync), design/gdd.md L236 (touch spec), E23 grounding (GDevelop ypu-huHz2P0; griffpatch 9TK8x2nSMPI / cI1mdVVvCWY dual-zone - already captured at I281), I350 fresh grounding (PitiIT NqrJHj9xlqY 108K 'Mobile input/touch control for your Unity game': the engine's own on-screen stick = a visible image sprite at deliberately LOW ALPHA ('not too invasive'), placed away from edges, shown ONLY on mobile platforms; 2 rounds / 27 raw / 1 relevant dev read; NqrJHj9xlqY now burned), .evidence/I349 pins (dist 128/1924616 B, headroom 172536 B, vendor sha 76DEA8151BC9352A, 914/914)

## Summary

E37 (Reach & Final Polish: PWA + E31 HUD minors) closed at I349 with 3/3, G37.0 PASS R1..R5, 914/914, dist 128/1924616 B, vendor sha 76DEA8151BC9352A unchanged. E38 = the deferred TOP-PLATFORM arc - E37 explicitly kept it ('touch-fallback (kept as its own top-platform arc, E38)'; PWA is its shipped precursor). ST-268 (I283) shipped the dual-zone MODEL: left floating stick = silent thrust (deadzone 24 px / MAX 90 px / auto-centre / never fires), right = aim + fire (0.22 s tap tail), 2-finger SAME-zone pause + toast + 0.45 s cooldown, keyboard/mouse byte-identical. E38 closes the REMAINING evidence-verified touch gaps, all input/UX/render-layer only (BY LAYER - zero src/core sim/scoring/replay):

- G1: the floating stick has NO visual representation - no ring, no knob, no canvas, no DOM element anywhere (grep across src/ = 0 hits). The player cannot see where the stick is or how much thrust is applied.
- G2: the right-zone finger sits EXACTLY on the aim point (I281 gap #3 'reticle hides under the finger' - still open): aimFromPoint writes the raw touch position, and the 3D reticle line (nose -> +6 u along fire dir) ends under the finger, so the fingertip physically covers the target.
- G3: zero haptic feedback (navigator.vibrate occurrences in src/ = 0).
- G4: touch tap-targets unmeasured - the pause/settings overlays predate the 44 px tap-target discipline (the I71 pause button is 46 px = OK; TAP TO START and the pause/settings rows are unmeasured).

The GDD touch spec (design/gdd.md L236: TAP TO START/RESTART, on-screen pause PLAYING-only, touch instructions in menu card + in-game hint) is otherwise satisfied (I71/ST-268).

## Grounding (research -> decision)

- E23 (I281) already grounded the dual-zone PATTERN (GDevelop ypu-huHz2P0; griffpatch 9TK8x2nSMPI 673K: 8:39 first touch / 11:12 tracking / 14:16 range -1..1 / 14:56 multi-touch / 18:55 dead zone) and ST-268 implemented it - no re-fetch.
- I350 fresh grounding (2 rounds / 27 raw; consumer noise discarded; 1 relevant dev read; NqrJHj9xlqY now burned): PitiIT NqrJHj9xlqY 108K - the engine's own mobile on-screen stick = a visible image sprite, deliberately LOW ALPHA ('I don't want it to be too invasive so I'm going to decrease the alpha'), placed away from the edges, and the controls are shown ONLY on mobile platforms (Application.isMobilePlatform gate). Decision: the floating-stick visual = a DOM ring + knob at ~0.35 alpha, coarse-pointer-gated, FLOATING (spawns at the touch down-point per the ST-268 auto-centre model, not a fixed corner), knob clamped to MAX_PX.
- Aim occlusion (G2): self-evident from the code review (the finger position IS the aim point; the reticle line ends under the finger). The standard dual-zone remedy = a fixed vertical offset of the aim point ABOVE the fingertip (a fingertip occludes ~30-50 px at typical mobile viewing distance). Chosen offset = 48 px, a local input.js constant in the same tier as DEADZONE 24 / MAX_PX 90 / FIRE_TAIL 0.22. The offset applies ONLY to the right-zone touch writes (new aimFromTouch seam); the mouse path stays byte-identical. Documented spec delta vs ST-268: the probe contract 'ndc == touch position < 3.6e-4' becomes 'ndc == f(x, y-48) < 1e-3'.
- Haptics (G3): no video grounding needed - it is a platform capability (navigator.vibrate: Android yes, iOS Safari absent) and the design is trivially bounded: 4 short pulses (hit 20 ms / death [40,30,60] / bomb 50 ms / pickup 15 ms), coarse + feature-gated, wired at the existing SFX dispatch branches, no-op everywhere else.
- Over-engineering guard: no new enemies/systems, no new art family (Blender NOT needed for E38 - the stick is a DOM element, not a 3D asset), no bloom changes, no salt bump, no settings-UI growth, no i18n, no 3-finger gestures.

## Scope Fit

FIT - bounded (5 iterations: I350 docs + I351..I355), input/UX/render layer only:

- ST-321 (I351) floating-stick visual: new src/render/touchStick.js - DOM ring + knob (~0.35 alpha), coarse only; spawns at the left-zone down-point; knob follows the drag clamped to MAX_PX 90 px; faint rendering inside the dead-zone; fade-in ~120 ms / fade-out ~200 ms on release; hidden on non-PLAYING + pointercancel + blur. Pure extension src/core/touchZones.js: knobOffset(dx, dy, deadzone, maxPx) -> {x, y, mag, active} (unit-tested). main.js wiring coarse-gated (zero DOM on mouse/keyboard). Probe: stick DOM lifecycle + knob offset EXACT vs knobOffset math (incl. MAX_PX clamp) + zero DOM on mouse + all non-PLAYING states.
- ST-322 (I352) aim offset above the finger: src/render/input.js ONLY - right-zone touch writes pointer.ndc from (x, y - 48 px) instead of (x, y) (new aimFromTouch seam); mouse + keyboard paths byte-identical; the ST-268 probe contract is updated in the same iteration (documented spec delta); p1 demo pin EXACT (scripted intent - causally structurally untouched).
- ST-323 (I353) haptics (CUTTABLE): new src/render/haptics.js - createHaptics(coarse), pulse(kind); feature-gated coarse && 'vibrate' in navigator; patterns hit 20 ms / death [40,30,60] / bomb 50 ms / pickup 15 ms; main.js event-dispatch wiring (the branches that already fire SFX); vibrate-mock probe (coarse context fires; desktop no-op; console 0/0). No settings toggle in E38 (deferred).
- ST-324 (I354) touch-target audit + fix (CUTTABLE to a zero-KB docs-only pass if zero findings): headless probe at 390x844 portrait + 740x360 landscape enumerates every interactive element (buttons + [pointer-events:auto]) in MENU/PAUSED/GAME_OVER/REPLAY; flags anything < 44 px in either dimension; fixes via padding/min-height only, coarse-gated CSS where it would collide with the desktop baseline; desktop 1280x720 HUD A/B must re-measure EXACTLY to the I347 baseline (0 px^2 + 23 px gap).
- ST-325 (I355) E38 regression + G38.0 gate + closeout: full 13-probe battery (p1 EXACT causal headline) + the new touch probe suite + ST-268 dual-zone regression re-run (updated offset contract) + PWA probe 11/11 re-run + dist check + G38.0 R1..R5 + R-E38-1..5 closeout -> E38 CLOSED 5/5.

Budget: dist at open 128 files / 1924616 B; headroom 172536 B (>= 102400 B floor). Expected delta: ST-321 ~+2 KB, ST-322 ~+0.2 KB, ST-323 ~+1 KB, ST-324 ~0 KB (CSS-only) => total <= ~4 KB => headroom >= ~168 KB. Vendor sha 76DEA8151BC9352A UNCHANGED (no three bump).

## Cut Options

- ST-323 haptics = CUTTABLE (platform capability, no gameplay impact; iOS no-op by design) if I353 slips.
- ST-324 = CUTTABLE if the audit finds zero < 44 px targets (probe + docs-only pass = a zero-KB closeout).
- ST-321 + ST-322 are NOT cuttable (the two headline gaps).

## Deferrals

- Vibration settings toggle (no toggle in E38; pulses are 15-60 ms; revisit if playtest feedback asks).
- i18n stays plan-only (design/i18n-strings.md exists, implementation deferred).
- 3-finger gestures / gamepad support (no measured demand).
- No new art family: all families shipped E34/E35/E36, no measured gap; Blender NOT needed for E38 (the stick is DOM, not a 3D asset) - the standing Blender directive is satisfied in the art arcs.

## Recommendation

APPROVE - the two headline gaps (stick visual, aim occlusion) are real, code-verified, and each a small bounded layer change; haptics + tap-targets round out the top-platform story without inventing mechanics. Anti-over-engineer preserved: every slice is a layer-local addition with a probe, no new systems, no salt bump.

## Risks

- R-E38-1 (ST-268 probe contract): the I283 probe 'ndc == touch position < 3.6e-4' fails by design after ST-322 -> the probe suite is updated in the SAME iteration with the new offset contract (documented spec delta); keyboard/mouse probes unchanged; regression = ST-268 suite re-run at ST-325.
- R-E38-2 (DOM leak): the stick div could linger on state transitions (PLAYING -> PAUSED/GAME_OVER/MENU) or after pointercancel -> lifecycle tied to the input events + forced hide on non-PLAYING in the render sync + probe counts the stick DOM across every state transition.
- R-E38-3 (haptics availability): iOS Safari has no navigator.vibrate; some Android browsers no-op -> feature-gated + wrapped, desktop no-op verified by probe, console 0/0.
- R-E38-4 (HUD A/B baseline): the ST-324 fixes could shift the measured HUD A/B pairs -> fixes are coarse-gated CSS only; the desktop 1280x720 A/B re-measured after the fix must match the I347 baseline EXACTLY (0 px^2 + 23 px gap, console 0/0).
- R-E38-5 (headroom): worst case +4 KB vs the 172536 B headroom -> the 102400 B floor holds with ~168 KB margin; no vendor bump.

## Gate G38.0 (at ST-325)

- R1 dual-zone regression: the ST-268 suite re-run green with the updated offset contract (silent move: left-only = no fire; right aim + fire + tap tail; 2-finger SAME-zone pause + toast + cooldown; cross-zone no pause; keyboard outranks stick).
- R2 stick visual: probe = ring + knob DOM appears at the left-zone touch point; knob offset EXACT vs knobOffset() math (incl. MAX_PX clamp); faint inside the dead-zone; hidden <= 200 ms after release; zero stick DOM on mouse input + in all non-PLAYING states.
- R3 aim offset: probe = right-zone touch (x,y) -> pointer.ndc == f(x, y-48) < 1e-3; mouse move -> ndc == f(x,y) EXACT (unchanged); p1 demo pin EXACT (11334 / 57 / W2 / combo 15 / shots 198/57 / acc 0.2878787878787879 / 36.14999999999923 s / replay 2169-2220 speed 4 / Q -> MENU / console 0/0) = causal proof (scripted intent untouched).
- R4 haptics: vibrate mock = hit/death/bomb/pickup fire in the coarse context; desktop no-op; console 0/0; no NaN.
- R5 touch targets: every interactive element >= 44 px at 390x844 + 740x360 (post-fix); desktop 1280x720 HUD A/B == I347 baseline EXACT (0 px^2 + 23 px gap, console 0/0).
- Battery: 13/13 (p7a FLOOR-50 230/61/169/0/0; p7b MENU 60@60/60 vendorLowp 0; rockab radii EXACT 2.2/1.3/0.7; puab in-band; floorab rings 48.47/48.47/39.90/29.41 + rim 55.47); PWA probe 11/11 re-run; tests 914+/914+ (new: knobOffset + touchZones extension); build 0; dist headroom >= 102400 B; vendor sha 76DEA8151BC9352A unchanged; servers killed + ports verified free.

## Files

- New: production/scope-check-E38.md; src/render/touchStick.js (ST-321); src/render/haptics.js (ST-323)
- Edit: src/core/touchZones.js (knobOffset, ST-321), tests/touchZones.test.js (ST-321), src/render/input.js (aimFromTouch offset, ST-322), src/main.js (wiring ST-321/323/324), src/render/screens.js or hud.js (ST-324, ONLY if a < 44 px target is found; coarse-gated CSS)
- Docs: epics.md (E38 block), stories.md (ST-321..325), iterations.md (I350..), CHANGELOG.md, session-state/active.md

## Verification

- npm test green per iteration (914 -> ~925+ with the knobOffset/touchZones extension)
- npm run build 0 per iteration
- headless probe per story (one chrome launch, fresh context; reuse + close the tab after; kill the server after; verify the port free)
- I355: full 13-probe battery + PWA re-run + dist check (128/1924616 B + delta <= ~4 KB) + G38.0

## Next

I351 = ST-321 floating-stick visual (cgs-dev-story).
