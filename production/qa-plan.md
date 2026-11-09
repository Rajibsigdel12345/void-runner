# QA Plan - Void Runner (I40, ST-040)

Scope: everything shippable in the vertical slice (I01-I45). Layers: **node** (117 unit tests, deterministic, seed-pinned) and **browser** (Playwright against the live dev server, driven through `window.__vr`). Manual playtest (scripted self-play) lands in I41; this plan defines what those layers each cover and the regression suite that must stay green at every gate.

## Risk ranking (what breaks the game if it fails)

| # | Risk | Why it matters | Primary guard |
|---|------|----------------|---------------|
| R1 | Core loop corruption (sim desync, NaN, spiral of death) | Unplayable | node: game/world tests; browser: critical-path smoke |
| R2 | State machine holes (Enter/P/Esc cross-talk, pause leaks) | Stuck sessions | node: state transitions; browser: state walk |
| R3 | Restart hygiene (stale score/popups/hint/combo across sessions) | Wrong records, UX spam | node: reset tests; browser: game-over -> restart probe |
| R4 | Persistence (best score / settings corrupt or lost) | Player trust | node: storage fake-store tests; browser: localStorage probe |
| R5 | Input modes diverge (touch vs mouse/keys) | Half the audience broken | browser: synthetic pointer/key sequences |
| R6 | Perf regression (per-frame allocs, pool overflow, composer cost) | Frame drops on low-end | node: pool invariants; browser: ?fps=2 meter |
| R7 | Robustness (tab blur, resize, WebGL context loss) | Real-world crashes | **open - I43** (currently graceful, not guarded) |
| R8 | Balance drift (config changed, GDD not, or vice versa) | Wrong game shipped | convention: config changes require balance-notes + GDD check (enforced in review) |

## Test matrix (feature x layer)

| Feature | node | browser smoke | playtest (I41) |
|---|---|---|---|
| Ship physics / arena clamp | yes | critical path | feel |
| Weapons (fire/spread/homing/cooldown/cap) | yes | critical path | feel |
| Asteroids (spawn/split/rim bounce/noNear) | yes | critical path | fairness |
| Waves (ramp/caps/intermission) | yes | forced-wave probe | pacing |
| Collisions (bullet-rock, ship-rock, one-hit/frame) | yes | forced-kill probe | feel |
| Score/combo (window/cap/multiplier/damage reset) | yes | kill-chain probe | fun |
| Lives/game-over/restart | yes | full cycle | - |
| Power-ups (5 types, drop, magnet, shield absorb, bomb) | yes | forced-apply probes | utility |
| State machine | yes | full state walk | - |
| Storage (best/settings, corrupt payloads, private-mode) | yes (fake store) | localStorage round-trip | - |
| Input (keys/mouse/two-finger touch) | - | synthetic events | feel |
| HUD/screens/popups/banner/hint | - | text assertions | readability |
| Audio (cues, rate limit, mute, gesture init) | - (no node DOM) | state probe | quality |
| FX (particles/shake/bloom/fps meter) | - | ?fps=2 + screenshots | juice |
| Settings (4 options, persistence, live apply) | yes (Storage) | panel probe | - |
| Robustness (blur/resize/context-loss) | - | partial (resize) | - |
| Perf | pool invariants | ?fps=2 baselines | - |

## Regression suite (must be green at every iteration close)

**Suite A - automated (every iteration, non-negotiable):**
1. `node scripts/run-tests.mjs` -> all pass, 0 fail (currently 117).
2. `node scripts/build.mjs` -> exit 0.
3. Browser: navigate -> **0 console errors**.

**Suite B - critical path (every iteration that touches gameplay/UX/render):**
1. MENU -> Enter -> PLAYING (hint shown, wave 1 banner).
2. Fire: live-intent advance -> bullets spawn + `fire` events.
3. Kill: forced rock at ship+1.2 -> `kill` event, score > 0, popup appears.
4. Power-up: forced apply('rapid'/'shield'/'magnet') -> effect active; magnet pull measured (I38 precedent: speed delta = accel x t).
5. Pause: P -> PAUSED (sim frozen: score/wave unchanged over 1s of advance-less real time), P -> PLAYING.
6. Hit: forced rock contact -> lives 3->2, invuln, shake, combo reset.
7. Game over: lives->0 -> GAME_OVER screen with stats; best score persisted.
8. Restart: Enter -> fresh session (score 0, wave reset, hint shown, popups cleared).

**Suite C - extended (gates only: I45 slice gate, I96 100-iteration gate):**
- Suite B + ?fps=2 baseline within 10% of last recorded (wave 4, 20 rocks, bloom): last recorded 56-60 fps / 40 calls / 1638 tris (I36).
- Storage round-trip: set settings in panel -> reload -> values persist.
- Resize mid-game (800x600 -> 1600x800) -> no console errors, composer resize path runs.
- Touch path: synthetic single-finger tap (guaranteed bullet), drag (thrust), two-finger (pause).
- I43 additions will extend Suite C (visibilitychange, context loss).

## Entry / exit criteria

- **Vertical slice gate (I45) entry:** Suite A + B green; I41 playtest report filed; no open bugs above minor severity; perf within baseline.
- **Exit (ship-able slice):** Suite C green; I49 release checklist clean; I46 regression green after I44 fixes.

## Evidence conventions

- Screenshots: `.evidence/i<nn>-<name>.png` (browser viewport, css scale).
- Every iteration log entry cites: test count, build exit, browser console count, and the specific probes run.
- Probes drive the game through `__vr.advance` with explicit intent (default intent is ZERO - always pass live intent for input tests) and assert on world state, not pixels, except for visual regressions (bloom/fps meter).

## Known gaps (tracked, not ignored)

- R7 robustness: no auto-pause on tab blur, no WebGL context-loss recovery, `#flash` element assumed present - all scoped to I43.
- No automated touch regression yet (synthetic PointerEvents work but aren't in the suite) - added to Suite C for I45.
- Audio quality is subjective: covered by playtest notes only.

## Closeout (I100, ST-100) - final QA status at the E7 / 100-iteration gate

Skill: cgs-qa-plan | Date: 2026-11-10 | Iteration: I100 (ST-100)

### Summary
Final QA closeout at the 100-iteration gate. The plan defined at I40 (117 node tests) has grown to 233 node tests
(+116 across E1-E7, including the I92 breather test and the I90+ regression tests). All risk areas (R1-R8) now have an
automated guard or a documented acceptance; the regression suite (A/B/C/D) is green on the production dist/. No open code
defects. The only outstanding items are perception (human playtest) and the scheduled Blender graphics pass - both tracked,
non-blocking, and outside the automated QA scope.

### Test Matrix (final status)
- node: 233/233 green, deterministic, seed-pinned. Covers core loop, state machine, restart hygiene, storage, waves (incl.
  the I92 breather), boss, vortex, mines, powerups, combo/cap, collision, and rng determinism.
- browser (Playwright, production dist/ on :4173): critical path, full state machine, F1 stall-advance, I92/I93 changes,
  boss, wave modifiers, powerups, vortex, mines, render+NaN audit, console-clean. Verified at I98 (release checklist) +
  I99 (round D closing regression).
- playtest: v1 (I41) + v2 (I90) scripted self-play complete; findings F1-F9 triaged (I91), F9/F4/F2 fixed (I92), F8
  accepted, 4 perception items deferred to a human session (not bot-verifiable).

### Risk Coverage (final)
- R1 core loop: node game/world tests + browser critical path - GREEN.
- R2 state machine: node transition tests + browser state walk (pause freeze / resume / game-over step-gate / restart) - GREEN.
- R3 restart hygiene: node reset tests + browser game-over->restart probe - GREEN.
- R4 persistence: node fake-store tests + browser localStorage round-trip (version-guarded) - GREEN.
- R5 input modes: synthetic pointer/key sequences (touch verified via PointerEvents) - GREEN (physical touch still a known gap).
- R6 perf: node pool invariants + in-browser profile (I95: steady-state mean 5-7ms, p95 11-14ms, within the 16.67ms budget)
  - GREEN (low-end physical device untested).
- R7 robustness: graceful handling (blur/resize/context-loss) - ACCEPTED (not auto-guarded; documented).
- R8 balance drift: convention enforced (config changes require balance-notes + GDD sync; I92 synced) - GREEN.

### Acceptance Criteria (E7 / 100-iteration gate)
- 100+ iterations logged: MET (100 at this iteration, sequence 1..100).
- All tests green: MET (233/233).
- Build green: MET (exit 0; dist 1.44MB self-contained).
- Extended regression clean: MET (round C I89 + round D I99, no NaN, console 0).
- Playtested twice: MET (I41 v1 + I90 v2).
**Verdict: E7 GATE CLOSED - all 5 criteria met at I100.**

### Evidence
- npm test 233/233; node scripts/build.mjs exit 0.
- .evidence/i98-dist-boss.png (production dist, WAVE 5 + MONOLITH + ship + HUD, healthy render).
- production/regression-report.md round D (I99) - 6 scenarios, all pass.
- production/playtest-report.md (v1 I41 + v2 I90); production/bug-triage.md (I91); production/balance-notes.md (I92);
  production/perf-profile.md (I95); production/release-checklist.md v2 (I98).

### Risks (carried, non-blocking)
- Human playtest perception items (4): post-boss breather feel, vortex dodgeability feel, combo/overdrive feel, in-world
  wave-modifier legibility - the outstanding player-experience evidence gap (not bot-verifiable).
- Blender graphics pass: unstarted; the game is fully playable but visually placeholder-grade (procedural + canvas) until
  it runs. Scheduled after I100 by user request.
- Perf first-frame init (~90-600ms) deferred (offscreen warm-up proposed, I95); low risk.
- Low-end physical device / GPU validation untested (dev-machine baselines only; adaptive quality mitigates).

### Changed files or proposed files
- production/qa-plan.md (append: this closeout).
- production/milestone-review.md (append: E7 gate CLOSED note).
- No source changes (QA closeout is evidence + gate confirmation, not code).

### Verification evidence
- node --test 233/233 green (fresh run); node scripts/build.mjs exit 0 (fresh run).
- Iteration sequence PASS 1..100.
- Regression round D (I99) clean; release checklist v2 (I98) SHIP-READY (code side).

### Next owner / decision
- E7 code side is COMPLETE. Proceed to the user-requested Blender graphics pass: cgs-art-bible -> cgs-asset-spec ->
  cgs-asset-audit (update graphics/geometry/textures using Blender now that it is available). A human playtest is
  recommended before a final release call.
