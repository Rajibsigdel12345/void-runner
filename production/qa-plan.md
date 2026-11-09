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
