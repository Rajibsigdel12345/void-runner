# Regression Report — Void Runner

## Round C (I89) — pre-wrap regression after the E7 content/polish arc

Skill: `cgs-regression-suite` · Date: 2026-11-10 · Iteration: I89 (ST-089)

### Summary
Full regression pass before the I90-I100 wrap. Node suite green (232/232) plus an extended
in-browser run that drives the previously-lightly-exercised critical paths end-to-end: the Monolith
boss lifecycle, the ST-051 wave modifiers, the full game state machine, and every I81-I88 feature.
**Result: REGRESSION CLEAN — no code changes required, no bugs found.** No NaN in any sim array, zero
console errors/warnings, pools within caps.

### Method
- Node: `npm test` (pure-logic core, DOM-free).
- Browser: Playwright on the live dev server (1280x720). The real rAF game loop keeps running between
  harness `evaluate()` calls with no input, so the harness pins `world.ship.invuln = Infinity` (permanently
  invulnerable; `ship.step` decrements `Infinity - dt` = `Infinity`) so the ambient loop cannot kill the
  ship and push the game to GAME_OVER mid-test. All simulation is driven through `__vr.advance(dt, intent)`.

### Critical Path (verified)
- Game start: `begin()` MENU→PLAYING, wave director starts.
- 8s autopilot: state stays PLAYING, no NaN (ship + all rocks), particle pool 131/512.
- State machine: PAUSE freezes sim time (step gate), RESUME unfreezes + advances, resume-from-not-paused
  is a no-op, lives-drain → GAME_OVER with the step gate frozen, RESTART resets to PLAYING with 3 lives / wave 0.
- Boss (wave 5): spawns (hp 40), fires aimed bolts, ring-bursts S-rocks, homes 4.5s NaN-free, killed by the
  killing bullet, splits into **exactly 4 M-rocks** (clean field), pays exactly 1000 score.

### Wave modifiers (ST-051) — verified
- `modifierFor(wave)`: deterministic (stable across calls), valid values only (fast/small/inward), varied
  across waves, waves 1-2 = none.
- Application: `inward` → `inwardAccel` 2.0; `fast` → `speedMult` ratio 1.4; `small` → S-roll probability 0.5 (bias 0.5).
- Live invariant: at wave ≥ 3, `waves.activeMod === modifierFor(waves.wave)`.

### Feature regression (I81-I88) — verified
- I81/I82: `punch` + `fovKick` present with `step()`.
- I83/I84/I87: audio `state()`=running; true-peak limiter reproduces I87 — isolated bomb peak **0.775** (I87: 0.77),
  worst-case stack (bomb+bossDeath+hit) peak **0.812** (I87: 0.80), no hard clip (≤1.0). `weights()` probe returns
  tiered cue weights; ambience on in play.
- I85/I86: particle per-particle palette pick confirmed (cyan single-color burst maxR 0.000 vs red/white palette
  maxR 0.971); burst shapes confirmed by 3D-Y signature after sync — ring spread 0.113 < radial 0.376 < fountain
  1.201, fountain meanY 2.366 (rises above the 0.4 plane).
- I88: all three panels carry `.vr-panel`; `vrPanelIn`/`vrTitleGlow` keyframes registered; `.vr-reduced` toggled on
  the overlay by the settings→`update()` frame (reduced-motion gate).

### Prior Bug
- I84 loudness clip (bomb ~1.02 pre-limiter): re-verified fixed — isolated bomb now 0.775, stack 0.812.

### Regression Case
- The one nominal anomaly during the run — boss death split showed "+1 rock" instead of "+4" — was a **field
  concurrent-cap artifact** (23 rocks already at the hard cap, so only 1 of the 4 M-split could spawn). Re-run in a
  cleared field confirmed `bossDeath()` spawns exactly 4 M-rocks. **Not a bug.**
- Four harness measurement artifacts (state accessor is a method not a getter; burst colors are written to an internal
  `base[]` and only reach the GPU `color` buffer on `sync`; dead particles scatter through the pool so "first live slots"
  ≠ active slots; `.vr-reduced` applies on the next `update()` frame, not synchronously) were each re-measured with the
  correct method and pass.

### Result
REGRESSION CLEAN. 232/232 node. Extended browser: all critical paths + all I81-I88 features pass. No NaN, console
0, pools within caps. No code changes; no defects to carry into I91.

### Risks
- The real rAF loop co-steps with the harness `advance()` calls, so absolute entity counts are noisy (both step the
  sim). Regression checks use invariants/limits, not exact counts, to stay robust. Not a game defect.
- Boss split is intentionally cap-limited (`spawn` returns null at the concurrent cap), so a boss dying when the field is
  full yields fewer than 4 M-rocks. Acceptable by design; a player rarely has the field at cap on a boss wave.

### Changed / proposed files
- Changed: none (verification-only).
- Added: production/regression-report.md (this file).
- Proposed (none): no fixes required.

### Verification evidence
- `npm test` → 232 pass / 0 fail.
- `.evidence/i89-regression-clean.png` — WAVE 5 MONOLITH health bar + faceted L/M/S rocks + red mine + starfield +
  arena grid + HUD (score/BEST/wave/lives) render healthy; no black screen, no missing geometry.
- Console: 0 errors / 0 warnings across all stages.

### Next owner / decision
- No fix needed. Proceed to I90 (playtest v2 — scripted self-play + notes).

## Round D (I99) - closing regression re-run before the I100 wrap

Skill: cgs-regression-suite | Date: 2026-11-10 | Iteration: I99 (ST-099)

### Summary
Closing extended regression re-run on the current production build (dist/ at I98), after the I92 balance pass
(post-boss breather, combo cap 15, invuln 1.8s) and the I93 UI fix (persistent wave-modifier tag) - the only code
changes since Round C (I89). Node suite green (233/233, +1 test from the I92 breather) plus an extended in-browser
run on the built dist/ that re-verifies the critical path (state machine, fire/kill/score, game-over, pause-freeze,
restart), the prior F1 stall-advance bug, and the I92/I93 changes. **Result: REGRESSION CLEAN - no code changes
required, no bugs found.** No NaN in any sim, zero console errors/warnings on the built artifact (one expected
adaptive-quality INFO).

### Method
- Node: `npm test` (pure-logic core, DOM-free) -> 233/233.
- Build: `node scripts/build.mjs` -> exit 0 (dist/ self-contained 1.44MB).
- Browser: Playwright on the production preview server (http://localhost:4173, serves dist/ ONLY). All simulation is
  driven through a single synchronous `__vr.advance(dt, intent)` call per scenario (event-loop-blocked) so the ambient
  rAF loop cannot double-step or kill the ship mid-test. Lives are controlled through the real `world.livesMgr.count`
  (the `world.lives` accessor is read-only).

### Critical Path (verified)
- Restart: `restart()` -> PLAYING (full reset + begin), 3 lives, wave director armed.
- Begin: `begin()` -> PLAYING, lives 3.
- Fire/kill/score: aim at a spawned L-rock and fire -> bullets spawn (peak 2 live), the rock is destroyed/split, score
  rises to 25 (a kill registered).
- Game over: `livesMgr.count = 1` + a rock overlapping the ship -> hit drains lives to 0 -> state GAME_OVER (step gate frozen).
- Pause: `pause()` -> PAUSED; advancing 0.5s with thrust does NOT move the ship (sim frozen); `resume()` -> PLAYING.

### Prior Bug
- F1 (no-input stall-advance): re-verified fixed on the current build. With no input and an uncleared wave-1 field
  (5 rocks), the wave advances 1 -> 2 after the ~45s stall (state stays PLAYING, ship kept alive via
  `livesMgr.count = 999`). No soft-lock.

### Regression Case (I92 + I93)
- I92 post-boss breather: `modifierFor(6)`, `modifierFor(11)`, `modifierFor(16)` all return `none` (the wave after a
  boss wave 5/10/15 is modifier-free); boss waves themselves keep their modifiers (e.g. wave 5 = small, wave 10 = fast
  under the current seed).
- I92 combo cap: `cfg.combo.cap === 15` (was 10).
- I92 invuln: `cfg.ship.invulnTime === 1.8` (was 1.6).
- I93 wave-modifier tag: with `waves.activeMod = 'fast'` the HUD shows the persistent FAST ROCKS tag; with
  `activeMod = 'none'` the tag is hidden (DOM checked via `document.body.innerText`).

### Result
REGRESSION CLEAN. 233/233 node + build 0. Extended browser on the built dist/: all critical paths + the F1 prior bug +
the I92/I93 changes pass. No NaN, console 0 errors / 0 warnings (one expected adaptive-quality INFO: FX high -> low at
41 fps during the heavy scene). No code changes; no defects to carry into I100.

### Risks
- The real rAF loop co-steps with the harness `advance()` calls, so absolute entity counts are noisy; regression checks
  use invariants/limits, not exact counts. Not a game defect.
- `world.lives` is a read-only getter; tests must drive `world.livesMgr.count` directly (an earlier draft of this run set
  `world.lives` and silently no-op'd, which is what surfaced the correct accessor). Not a game defect.
- The adaptive-quality INFO (FX high -> low) is expected under a synthetic heavy scene in a headless viewport; not a defect.

### Changed / proposed files
- Changed: none (verification-only).
- Added: this Round D section (production/regression-report.md).
- Proposed (none): no fixes required.

### Verification evidence
- `npm test` -> 233 pass / 0 fail.
- `node scripts/build.mjs` -> exit 0 (dist/ 1.44MB self-contained).
- Production preview (:4173) boots clean (window.__vr ready, MENU, 22 calls); 0 console errors / 0 warnings across the whole regression.
- Six in-browser scenarios all pass (critical path, F1 stall-advance, I92 breather/cap/invuln, I93 mod-tag, game-over/pause/restart, render+NaN audit).
- Console: the only message is the expected adaptive-quality INFO.

### Next owner / decision
- No fix needed. Proceed to I100 (ST-100): final wrap + the 100th iteration + cgs-qa-plan closeout. Then the Blender
  graphics pass (cgs-art-bible -> cgs-asset-spec -> cgs-asset-audit).

## Round D (I205) - E8 final sweep (E8 round D; E7s was I99)

### Summary
E8 closing regression. No source changes since I199 (the 630-test baseline). 3/3 test matrix
green; the 6-scenario production-dist browser sweep green; console 0/0. Two S5 probe-assertion
bugs in this rounds own harness (getBest shape, assumed board order) were corrected on re-probe
- product behavior was correct on all four persistence paths. Round D: PASS.

### Method
- Test matrix (.evidence/I205/matrix.txt): R1 in-process npm test, R2 in-process repeat, R3
  cross-process node --test across all 66 test files.
- Browser sweep on the PRODUCTION DIST (Playwright, :4174 serving dist/, ?nocache=e8): S1 boot,
  S2 full lifecycle, S3 pause semantics, S4 demo replay pin (I204, same build), S5 persistence,
  S6 finiteness.

### Critical Path (verified)
- S1 boot -> MENU; console clean (0 errors / 0 warnings; 1 expected adaptive-quality INFO at
  headless ~4 fps rAF, I73).
- S2: exit-replay GAME_OVER -> MENU (Enter) -> PLAYING (Enter) -> play to death (154.2 s, wave
  5) -> GAME_OVER -> restart (Enter) -> PLAYING at t approx 0.13. The game-over auto-recorded
  the run score to the board (43442, wave 5, 170 kills) - live-flow persistence working.
- S3: p -> PAUSED (sim frozen across advance(2.0), dt 0), p -> PLAYING, p + q -> MENU.
- S4: demo replay pin EXACT on dist (I204, same build): t=36.15 s, score 11334, 57 kills, wave
  2, idx 2169/2220.
- S5 persistence: best round-trip (setBest(777777) -> getBest() === 777777); settings round-trip
  (volume 0.4 / fx low); recordScore rank-sorted desc (12345 lands rank 2 under the 43442
  auto-record, board stays sorted desc, newBest false); saveReplay round-trip (saved=true,
  getReplays non-empty). Bonus: invalid setBest(undefined) rejected by the I79 version guard
  (no write, prior best preserved). setBest is high-water-only by design (never lowers).
- S6 finiteness: ship / scoreKeeper / waves scanned - sole non-finite is the documented sentinel
  scoreKeeper.lastKillTime = -Infinity.

### Prior Bug
- F4 (combo never meaningful, I90): re-quantified at I202 (cap reached in ~12 s) - disposition
  deferred to E9 (I203 T1); no regression.
- I151 tutorial key ownership: verified on dist this round (first p dismisses tutorial, second
  p pauses) - no regression.
- I190/191 replay lifecycle: exit / pin / speed verified (I204 + this round) - no regression.
- I79 storage guards: invalid setBest rejected - no regression.

### Regression Case
- No code changes since I199; I195/I196 (round B) + I199 (round C) results carry; this round
  re-confirms on the final build.
- Determinism: the demo pin is identical across the dev server (I196/I198/I199/I202) and the
  production dist (I204/I205).

### Result
PASS. 630/630 x3 (matrix), browser sweep 6/6 scenarios green, console 0/0.

### Risks
- The two S5 probe-assertion bugs were harness errors (wrong getBest shape, assumed board
  order), not product defects - both re-verified with corrected assertions.
- The 4174 test profile held probe residue (board 43442/12345/12345, best 777777);
  localStorage was cleared at the end of the sweep - profile clean again.

### Changed / proposed files
- production/regression-report.md (this section).
- .evidence/I205/matrix.txt (new).
- Bookkeeping: CHANGELOG.md, production/iterations.md, production/session-state/active.md.

### Verification evidence
- .evidence/I205/matrix.txt (3/3 at 630/630, ~7-8 s per run).
- Browser sweep output (this round, Playwright on :4174 dist).
- .evidence/I204/01-dist-gameplay.png (same build).

### Next owner / decision
- I206 (ST-206): E8 closeout (cgs-milestone-review) + G8.6 gate sign-off - all prerequisite
  evidence is now in place: 100 iterations, 630/630, build 0, regression B+C+D clean, playtest
  triaged (0 BUGs), release checklist SHIP-READY.
## Round G48.0 (I402) - E48 Boot & Transition Shader Compile Warm-up closeout

Skill: cgs-regression-suite + cgs-gate-check + cgs-milestone-review / Date: 2026-11-15 / Iteration: I402 (ST-372)

### Summary
Fresh R1-R5 gate before closing E48 (the last open epic; W1 renderer.compile + W2 both-settle-gated 1x1 offscreen warm render, selected by the I401 same-session A/B: s3 MENU->PLAYING spike 91->23.3 ms, 0 new programs mid-transition).

### Results
- R1 p1 demo: EXACT causal (seed 9876: 11334/57/W2/combo 15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed 4). The W1+W2 delta since bc591d2 = src/main.js render-only; last sim-logic commit 93213d2 (I390).
- R2 rockab: radii EXACT 2.2/1.3/0.7 (reseed 30201, 5/5 assets ready, console 0/0).
- R3 playframe (I375 canonical probe, .evidence/I402/): A 21/366 EXACT + FLOOR-50 rings 49.04/48.32/38.54/24.41 + rim 52.76 + spot 112.43/54.26 + band ladder exact; B 50/1222 EXACT with the warm code present (no persistent state - R-E48-4) + floor p50 32.2/p90 72.28 (frozen 72.07, +0.21 render noise) + sky 70.14 + camFinite; console 0/0 x2.
- R4 PWA: 11/11 (sw active root scope + claimed, online + offline boot, manifest standalone + 512 maskable, no NaN, console 0/0).
- R5 quality bar: 929/929 + build 0 + dist 131/1,919,653 B (headroom 177,499 B) + vendor sha256-16 76DEA8151BC9352A + hygiene (chrome 0, ports free, node 13).

### Evidence
- .evidence/I402/causal.json + causal.mjs (R1+R2)
- .evidence/I402/probe_i375.json + i375_overhead_fxoff.png + i375_playing_fxhigh.png (R3)
- PWA run transcript captured in production/iterations.md I402 (R4)

### Next owner / decision
- I403: open the next epic (cgs-scope-check + cgs-create-stories). No open epics remain after E48.

## Round G49.0 (I407) - E49 Localization & Language Selector closeout

Skill: cgs-regression-suite + cgs-gate-check + cgs-milestone-review / Date: 2026-11-15 / Iteration: I407 (ST-377)

### Summary
Fresh R1-R5 gate before closing E49 (the Localization & Language Selector epic: string extraction + 3-way selector + zh/ja locale tables, all data/render-only). Zero source change this iteration - the R1-R3 pins staying EXACT under the full locale code is the sim-inert proof (R-E49-3).

### Results
- R1 p1 demo: EXACT causal (seed 9876: 11334/57/W2/combo 15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed 4; afterQ MENU; console 0/0) = byte-identical to the I402 pin.
- R2 rockab: radii EXACT 2.2/1.3/0.7 (reseed 30201, all GLB incl. rockComet ready, console 0/0).
- R3 playframe (I375 canonical probe, .evidence/I407/): A 21/366 EXACT (MENU fx-off, reseed 71200) + B 50/1222 EXACT (PLAYING fx-high, reseed 71201, rocks 0->5, camFinite) + luma within render noise (ring p50 32.2/8.71/8/8/50.63, floor p50 32.2/p90 72.22, sky 70.14) + console 0/0 x2.
- R4 PWA: 11/11 fresh on :5199 (sw active root scope + claimed, online + offline boot no NaN, manifest standalone + 512 maskable + start_url/scope ".", console 0/0).
- R5 quality bar: 947/947 + build 0 + dist 132/1,947,982 B (headroom 142,040 B) + vendor sha256-16 76DEA8151BC9352A + locale sweep en/zh/ja x 6 screens all console 0/0 no NaN no tofu 0 overflow + en text A/B vs I405 B1 = 0 diff lines + hygiene (5173+5199 servers killed CommandLine-verified, 5173/4173/5199 listeners 0, chrome 0, no orphan node).

### Evidence
- .evidence/I407/causal.json + causal.mjs (R1+R2)
- .evidence/I407/probe_i375.json + i375_overhead_fxoff.png + i375_playing_fxhigh.png (R3)
- .evidence/I407/localesmoke.json + screenshots (R5 locale sweep)
- .evidence/I407/textab_en.json (R5 en A/B; baseline .evidence/I405/textab_B1.json)
- PWA run transcript captured in production/iterations.md I407 (R4)

### Next owner / decision
- I408: open the next epic (cgs-scope-check). No open epics remain after E49.

## Round G50.0 (I413) - E50 Enemy Death Shatter & 3D Debris Fragments closeout

Skill: cgs-regression-suite + cgs-gate-check + cgs-milestone-review / Date: 2026-11-15 / Iteration: I413 (ST-383)

### Summary
Fresh R1-R5 gate before closing E50 (the shatter/debris epic: 2 Blender shard GLBs + instanced debris pool + 9-event death dispatch, all render-only/motion-gated). Zero source change this iteration - the R1-R3 pins staying EXACT under the shipped debris code is the sim-inert proof (R-E50-4).

### Results
- R1 p1 demo: EXACT causal fresh (seed 9876: 11334/57/W2/combo 15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed 4; afterQ MENU; console 0/0) = byte-identical to the I402/I407 pin.
- R2 rockab: radii EXACT 2.2/1.3/0.7 (reseed 30201; all GLB incl. rockComet + debrisChunk/debrisSliver ready; console 0/0).
- R3 playframe: EXACT fresh, 3/3 stable, with the I412 re-pin semantics - L 21/366 (menu-loop frame; legacy A pin attribution) + P 10/180 (overhead probe frame) + B 50/1222 (PLAYING fx-high, rocks 0->5, camFinite) + fresh debris at-rest at BOTH measure points (debrisLive 0, both meshes visible=false, counts [0,0] -> +0 steady-state draw calls) + console 0/0 x2.
- R4 PWA: 11/11 fresh on :5199 (sw active root scope + claimed, online + offline boot no NaN, manifest standalone + 512 maskable + start_url/scope ".", console 0/0).
- R5 quality bar: 953/953 + build 0 + dist 135/1,963,204 B (rebuild byte-identical; headroom 133,948 B) + vendor sha256-16 76DEA8151BC9352A + hygiene (one server at a time: 5199 then 5173, both killed CommandLine-verified; 5173/4173/5199 listeners 0, chrome 0, no orphan node). NOTE: the ST-383 spec's "947/947" is stale - the baseline moved to 953 at I410/I411; the gate asserts the current baseline.

### Evidence
- .evidence/I413/causal.mjs + causal.json + causal_run.txt (R1+R2)
- .evidence/I413/playframe.mjs + playframe_r1/r2/r3.json + playframe_r1/r2/r3.txt (R3, 3/3 stable)
- .evidence/I413/pwa_probe.mjs + pwa.txt (R4)

### Next owner / decision
- I414: open the next epic (cgs-scope-check + cgs-create-stories). No open epics remain after E50.

## Round G51.0 (I417) - E51 Multi-Hit Enemy Hit-Flash closeout

Skill: cgs-regression-suite + cgs-gate-check + cgs-milestone-review / Date: 2026-11-15 / Iteration: I417 (ST-387)

### Summary
Fresh R1-R5 gate before closing E51 (the multi-hit enemy hit-flash epic: warden HP hits + boss-family every-hit (monolith + splicer, incl. killing) + flyer 2-bullet kills; decay 3/s in step(), spike 1.4; core seam/ST-290 telegraph untouched; +0 draw calls). Zero source change this iteration - the R1-R3 pins staying EXACT under the shipped flash code is the sim-inert proof, and the fresh flash-at-rest probe (frozen world, direct flyer spawns) closes the ST-386 harness gap: hitFlash is 0 at rest on every flashable enemy and 30 rest syncs of each hero mesh leave every material EXACTLY stable (regression guard for the I416 warden armorMat.emissiveIntensity accumulation fix + the bossMesh after-setHex placement).

### Results
- R1 p1 demo: EXACT causal fresh (seed 9876: 11334/57/W2/combo 15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed 4; afterQ MENU; console 0/0) = byte-identical to the I402/I407/I413/I416 pin.
- R2 rockab: radii EXACT 2.2/1.3/0.7 (all GLB incl. rockComet + debrisChunk/debrisSliver ready; console 0/0).
- R3 playframe: EXACT fresh - L 21/366 (menu-loop frame) + P 10/180 (overhead probe frame) + B 50/1222 (PLAYING fx-high, rocks 0->5, camFinite) + debris 0 live at both measure points + console 0/0 x2 = +0 steady-state draw calls under the shipped flash code.
- R3 flash-at-rest (fresh, frozen-world v2): state PLAYING at the begin() boundary (rAF stubbed in-evaluate; frames 35/35 dead = the world stepped 0 times); 2 flyers spawned via the public w.flyers.spawn(ship.pos) -> hitFlash [0,0] (all zero); warden freshK 0 + 30 rest syncs EXACT-stable (armor 0.12-base material present, maxI 0.5); monolith freshK 0 + rest-stable; splicer freshK 0 + rest-stable; cfg {decay 3, spike 1.4} confirmed; console 0/0. NOTE: v1 of this probe failed on a harness bug (it waited LIVE up to 20 s for a natural flyer; the idle ship died -> GAME_OVER before any flyer existed). All product asserts had already passed in that failed run; v2 freezes the loop in the same evaluate and spawns flyers directly (root cause + fix documented in the I417 iteration entry).
- R4 PWA: 11/11 fresh on :5199 (sw active root scope + claimed, online + offline boot no NaN, manifest standalone + 512 maskable + start_url/scope ".", console 0/0) = identical to the I413 reference (probe copied verbatim, 0 diff lines).
- R5 quality bar: 969/969 + build 0 + dist 135/1,963,955 B (headroom 133,197 B >= 102,400 B) + vendor sha256-16 76DEA8151BC9352A + hygiene (5199 killed after the probe; 5173 killed at iteration end; 5173/4173/5199 listeners 0, chrome 0, no orphan node - the 7 remaining node procs are Codex session infrastructure, CommandLine-verified). NOTE: the ST-387 story text's "953+N/N" is stale - the baseline moved to 969 at I414+; the gate asserts the current baseline (same stale-baseline pattern as G50.0's "947/947").

### Evidence
- .evidence/I417/causal.mjs + causal.json (R1+R2; retagged from I416 - OUT/nocache + comment only, harness logic byte-identical)
- .evidence/I417/playframe.mjs + playframe.json (R3; retagged from I416 as above)
- .evidence/I417/flashrest.mjs + flashrest.json (R3 flash-at-rest v2, frozen world)
- .evidence/I417/pwa_probe.mjs + pwa.txt (R4; probe verbatim from I413)

### Verdict
- G51.0 gate verdict: PASS - all five rounds green fresh; E51's shipped behavior (I415 impl + I416 CG PASS-DEVIATED + follow-up bug fixes) is regression-locked at I417.
- Milestone transition verdict: E51 CLOSED at I417 (ST-384..387, 4/4 stories shipped).

### Next owner / decision
- I418: open the next epic (cgs-scope-check + cgs-create-stories). Carryover candidates in priority order: (a) art-improvement research + task list (user-suggested; may use Blender for new assets); (b) per-hit impact SFX audio epic (warden/boss HP hits verified silent; SFX_CUES in main.js, WebAudio synth in src/render/audio.js); (c) E49 i18n tail + touch fallback; (d) flyer decay constant unification (flyer.js hardcoded 3/s -> CONFIG.fx.enemyHitFlash.decay).

## Round G52.0 (I422) - E52 Asteroid Silhouette Variety in the GLB Path closeout

Skill: cgs-regression-suite + cgs-gate-check + cgs-milestone-review / Date: 2026-11-15 / Iteration: I422 (ST-392)

### Summary
Fresh R1-R5 gate before closing E52 (the asteroid silhouette variety epic: B silhouettes per size I420 - same icosphere base => same tris 490/134/134, distinct displace seed + anisotropic scale + crater insets, setGLB per-variant with the comet ternary FIRST - plus the I421 comet re-bake: elongated icy nucleus + 8-seg cone ion tail, 96t was 180t, with the pre-registered explicit re-pins xspan 1.5828 -> 2.464 and COMET_FACET -> {0.7312/0.7413/0.8075/0.7547} (maxperp 0.5481 absorbed by the 0.58+/-12% band)). Zero source change this iteration - the sim pins staying EXACT under the shipped I420/I421 asset work is the regression-locked proof. Playframe B stayed EXACT 50/1222 (the reseed-71201 live-5 set contains no comet, so the pre-registered conditional re-pin was not triggered).

### Results
- R1 p1 demo: EXACT causal fresh (seed 9876: 11334/57/W2/combo 15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed 4; afterQ MENU; console 0/0) = byte-identical to the I402/I407/I413/I416/I417 pin.
- R2 rockab: radii EXACT 2.2/1.3/0.7 (reseed 30201; all GLB incl. rockComet ready; console 0/0).
- R3 playframe: EXACT fresh - L 21/366 (menu-loop frame) + P 10/180 (overhead probe frame) + B 50/1222 (PLAYING fx-high, rocks 0->5, camFinite) + debris 0 live at both measure points + console 0/0 x2 = +0 steady-state draw calls under the shipped I420/I421 assets. A/B silhouette re-confirm: CITE I420 (ALL_DIFFERENT 0.4027/0.3992/0.5464) - same tree, zero src since I420 (I421 touched only assets/asteroid_comet.glb + tests + docs; the B silhouette GLBs and the asteroidRenderer setGLB path are byte-unchanged).
- R4 PWA: 11/11 fresh on :5199 (sw active root scope + claimed, online + offline boot no NaN, manifest standalone + 512 maskable + start_url/scope ".", console 0/0) = identical to the I413/I417 reference (probe verbatim).
- R5 quality bar: 971/971 + build 0 + dist 138/1,985,979 B (rebuild byte-identical; headroom 111,173 B >= 102,400 B floor) + vendor sha256-16 76DEA8151BC9352A + hygiene (5173 then 5199 killed CommandLine-verified; 5173/4173/5199 listeners 0, chrome 0, no orphan node). NOTE: the ST-392 story text's "969+N/N" is stale - the baseline moved to 971 at I414+; the gate asserts the current baseline (same stale-baseline pattern as G50.0/G51.0).

### Evidence
- .evidence/I422/causal.mjs + causal.json (R1+R2; retagged from I417 - OUT/nocache only)
- .evidence/I422/rockab_run.mjs + rockab_i422.json (R2; retagged from I391)
- .evidence/I422/playframe.json (R3; harness from I417)
- .evidence/I417/pwa_probe.mjs (R4; probe verbatim from I413, served on :5199 over dist)
- .evidence/I421/playframe.json + comet_bake.png (I421 comet re-bake evidence, CITED in R3)

### Verdict
- G52.0 gate verdict: PASS - all five rounds green fresh; E52's shipped behavior (I420 B silhouettes + setGLB per-variant wire + I421 comet re-bake with the pre-registered explicit re-pins) is regression-locked at I422.
- Milestone transition verdict: E52 CLOSED at I422 (ST-388..392, 4/4 stories shipped). Headroom arc: 133,197 B (I418) -> 106,629 B (I420) -> 111,173 B (I421) >= 102,400 B floor.

### Next owner / decision
- I423: open the next epic (cgs-scope-check + cgs-create-stories). Carryover candidates in priority order: (a) art-improvement research + task list (user-suggested; may use Blender for new assets); (b) per-hit impact SFX audio epic; (c) E49 i18n tail + touch fallback; (d) flyer decay constant unification (flyer.js hardcoded 3/s -> CONFIG.fx.enemyHitFlash.decay); (e) AGENTS.md five-GLBs doc-drift note.

## Round G53.0 (I426) - E53 Glow & Read closeout

Skill: cgs-regression-suite + cgs-gate-check + cgs-milestone-review / Date: 2026-11-15 / Iteration: I426 (ST-396)

### Summary
Fresh R1-R5 gate before closing E53 (the VFX-glow + pickup-read art epic: ST-394 soft radial-gradient particle sprite shared on the existing PointsMaterial via map + size 0.52, in-code, +0 draw calls, no sim change; ST-395 re-bake of the 3 weak powerup emblems in place - spread eye->trident prism 6628B/48t, shield coin->hex-ring+core 3396->7536B/56t, magnet box->horseshoe U-prism 5256->5116B/36t, same VR_PU_* node+mat names, 1 primitive each, UV-free by design, with the pre-registered explicit PU_FACET re-pins spread -> 0.3271/0.6364/1.1556 / shield -> 0.3374/0.3911/1.1793 / magnet -> 0.3271/0.7265/1.250). Zero source change this iteration - the sim pins staying EXACT under the shipped I424/I425 art work is the regression-locked proof. The soft sprite is +0 draw calls (proven in I424 via a focused interleaved-render probe) and the emblems are not in the playframe reseed-71201 live-5 measure set, so playframe B stayed EXACT 50/1222.

### Results
- R1 p1 demo: EXACT causal fresh (seed 9876: 11334/57/W2/combo 15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed 4; afterQ MENU; console 0/0) = byte-identical to the I402/I407/I413/I416/I417/I422 pin.
- R2 rockab: radii EXACT 2.2/1.3/0.7 (reseed 30201; all GLB incl. rockComet ready; console 0/0).
- R3 playframe: EXACT fresh - L 21/366 (menu-loop frame) + P 10/180 (overhead probe frame) + B 50/1222 (PLAYING fx-high, rocks 0->5, camFinite) + debris 0 live at both measure points + console 0/0 x2 = +0 steady-state draw calls under the shipped I424 sprite + I425 emblems (both render-only; no sim change).
- R4 PWA: 11/11 fresh on :5199 (sw active root scope + claimed, online + offline boot no NaN, manifest standalone + 512 maskable + start_url/scope ".", console 0/0) = identical to the I413/I417/I422 reference (probe verbatim).
- R5 quality bar: 972/972 + build 0 + dist 138/1,990,546 B (rebuild byte-identical to I425; headroom 106,606 B >= 102,400 B floor) + vendor sha256-16 76DEA8151BC9352A + hygiene (5173 then 5199 killed port-based; 5173/4173/5199 listeners 0, chrome 0, node = MCP infra only). NOTE: the ST-396 story text placeholder "971+N/N" is the pre-E53 baseline; the current baseline is 972 (moved at I424 with the +1 config sanity test).

### Evidence
- .evidence/I426/causal.mjs + causal.json (R1+R2; retagged from I422 - OUT/nocache only)
- .evidence/I426/playframe.mjs + playframe.json (R3; retagged from I417)
- .evidence/I426/pwa_probe.mjs (R4; probe verbatim from I413, served on :5199 over dist)
- .evidence/I425/{emblem_abClay,emblem_abFace,emblem_closeup,emblem_abTint}.png (I425 emblem A/B, CITED - emblems not in playframe)
- .evidence/I424/{particles_soft,particles_square_i424}.png + probe_drawcalls.mjs (I424 sprite A/B + +0-draw-call proof, CITED)

### Verdict
- G53.0 gate verdict: PASS - all five rounds green fresh; E53 shipped behavior (I424 soft particle sprite +0 draw calls + I425 re-baked emblems with the pre-registered explicit PU_FACET re-pins) is regression-locked at I426. Zero silent re-pins: only the pre-registered assetGlbs PU_FACET pins moved (I425, explicit old->new); playframe/p1/rockab/PWA all EXACT.
- Milestone transition verdict: E53 CLOSED at I426 (ST-393..396, 4/4 stories shipped; pre-registered CUT gate for ST-395 unused - all 3 emblems SHIP). Headroom arc: 111,173 B (I423) -> 110,616 B (I424) -> 106,606 B (I425) -> 106,606 B (I426) >= 102,400 B floor.

### Next owner / decision
- I427: open the next epic per the NEW user directive (cgs-scope-check + cgs-create-stories): remaster the player ship into a detailed "real airship" (more detail, more polygons), make the other assets more realistic (Blender), and probe a WebGL->WebGPU switch if needed - grounded in reference samples (YouTube/web research) rather than invented. Pre-register any SHIP_FACET / playframe L/P/B re-pins the ship-geometry change would force.
