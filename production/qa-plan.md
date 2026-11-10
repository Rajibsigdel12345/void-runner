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

## E8 QA Plan (I201, ST-201)

Scope: E8 arc (I107-I206) pre-release QA posture - what is already evidenced, what the
human playtest (I202) must add, and the acceptance criteria for the G8.6 closeout gate (I206).
Append-style continuation of the I40 plan; no rewrite of the historical sections.

### Summary
The E7 closeout (I100) left two open QA debts: human-perception playtest evidence and the
Blender art pass (E9). E8 delivered six gated arcs (G8.0 I110, G8.1 I128, G8.2 I147, G8.3 I164,
G8.4 I182, G8.5 I198) with in-gate browser measurements, grew the suite from 233 to 630 tests
(+397, all deterministic/seed-pinned), and added the robustness arc (context-loss, visibility
pause, replay capture/view, security totality) that the I40 plan had left as known gaps (R7).
Remaining QA work is perception-only (human playtest I202) plus the release checklist (I204).

### Test Matrix (E8 features x evidence layer)

| Feature (E8) | node (630 suite) | browser evidence | Gate |
|---|---|---|---|
| Content: endless-arc boss HP, wave caps, breather, vortex v2 | yes | forced-wave probes | G8.0/G8.1 |
| Balance passes E8-1/E8-2/E8-3 (feel) | yes (pinned values) | live runs | G8.0/G8.2 |
| Daily seeded run + share code (ST-140/142) | yes (codec totality) | reproducible daily (I147) | G8.2 |
| i18n string inventory + a11y (I155-166) | yes (storage/keys) | CVD preview, font scale, focus ring | G8.3 |
| Music bed + intensity + slow-mo audio (I157-174) | yes (synth headless, I180) | live meter/chord probes, gesture gate | G8.3/G8.4 |
| Feel/juice: shake, vignette, fanfare, pickup burst (I175-178) | - (render) | per-iteration smokes + rm variants | G8.4 |
| Context-loss: clock stall, WebGL ctx loss (I187-188) | yes (clock) | simCtxLost/Restore probes, ?nocache runs | G8.5 |
| Visibility pause (I189) | yes (visibilityAction) | real-handler freeze/resume (I198) | G8.5 |
| Replay viewer + capture (ST-190/191) | yes (codec, RLE, caps) | idx 2169 pin in-browser (I196/I198/I199) | G8.5 |
| Security: share/replay/storage/daily codecs (I194) | yes (8 totality tests) | - (adversarial inputs are node-side) | G8.5 |
| Build size + load (I197) | - | load profile: 86 resources, 622 ms | G8.5 (cited) |

### Risk Coverage (E8, final posture)
- R1 core loop: 630-suite + regression rounds B (I195/196) + C (I199) - GREEN.
- R2 state machine: node transitions + I196 six-transition walk + I199 hotkey sweep - GREEN.
- R3 restart hygiene: node reset tests + I199 R-restart probe - GREEN.
- R4 persistence: node fake-store + I195 19/19 live probe + I199 battery (best/board/daily/replay/settings) - GREEN.
- R5 input modes: synthetic keys/pointers verified (I199); physical touch + physical device still open (carried from E7; low risk, desktop-first target).
- R6 perf: I95 frame profile + I184 deep profile + I185 memory audit + I197 payload/load audit - GREEN (budgets documented).
- R7 robustness: WAS open gap at I100 - now CLOSED by I187-189 (clock reset, ctx-loss recovery, visibility pause) with G8.5 evidence.
- R8 balance drift: config.js single-source + per-pass balance docs (E8-1/2/3) + I192 config codec pins - GREEN.
- NEW R-E8 (determinism in replay): quantization fidelity pinned (I191 0.0007 ship distance) + demo pilot pinned in suite and re-verified in-browser (I198) - GREEN.

### Acceptance Criteria (for G8.6, I206)
1. 100/100 E8 iterations logged sequentially 107..206 (audit at I206).
2. 300+ tests green - actual: 630/630 (2.1x target).
3. Build green (exit 0) + payload within adopted budget (I197: 449.6 KB gzip vs 550 KB).
4. Regression B (I195/196) + C (I199) clean - done; final sweep at I205.
5. Human playtest (I202) filed + triaged (I203) - PENDING (this plan's I202 section below).
6. Release checklist (I204) done - PENDING.

### I202 Human Playtest - what it must add (the bot-unverifiable perception items)
Carried from E7 (4): post-boss breather feel; vortex dodgeability feel; combo/overdrive feel;
in-world wave-modifier legibility.
New E8 items (6): music bed quality/level over SFX (I157-170); death slow-mo feel (I172/174);
juice intensity (shake/flash/fanfare) too much vs too little (I175-178); replay UX clarity
(WATCH THIS RUN affordance, speed keys discoverability); tutorial card clarity (I151);
REC chip clarity (is it obvious a run is being recorded?).
Protocol + note fields: production/playtest-checklist.md (I199). Triage buckets (I203):
BUG / BALANCE / UX / ART-AUDIO.

### Regression Suite (E8 posture, updated from the I40 definition)
- Suite A (every iteration): npm test (630/630) + build exit 0 + browser console 0/0.
- Suite B (gameplay/UX/render iterations): I40's 8 critical-path probes + the I199 hotkey sweep + replay pin.
- Suite C (gates): I40's extended set + forced-scene perf sample (G8.4 method) + finiteness scan + load profile (I197 method).
Executed for E8F: rounds B (I195/196) and C (I199); round D (final) at I205.

### Evidence
- production/gates.md: G8.0-G8.5 verdicts (I110/I128/I147/I164/I182/I198).
- production/regression-report.md + .evidence/I195/ + .evidence/I196/ + .evidence/I199/ (rounds B/C).
- production/perf-profile.md (I95/I184), production/memory-audit.md (I185), production/build-size-audit.md (I197).
- production/playtest-checklist.md (I199, the I202 instrument).

### Risks
- Physical touch device + low-end physical hardware untested (carried; desktop-first, adaptive FX mitigates).
- Playtest perception findings may force a balance/feel follow-up pass (I203 triage decides; scope-cut candidates: fanfare/shake constants only).

### Changed files
- production/qa-plan.md (append: this E8 plan).

### Verification evidence
- Plan only - no code changes; all cited evidence from committed iteration records (I110-I199).
- Current baseline (I199, one iteration back, no src/ diff since): 630/630, build 0, console 0/0.

### Next owner / decision
I202 (ST-202): human playtest per production/playtest-checklist.md - the perception items above are the explicit output this session must produce.
