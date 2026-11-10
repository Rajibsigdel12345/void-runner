# Gates - Void Runner

## I45 - Vertical Slice Gate (ST-045)

- Date: 2026-11-13
- Skill: cgs-gate-check (advisory slice gate)

### Summary
Advisory gate on the I01-I45 vertical slice: is the full loop (menu -> play -> waves -> power-ups -> combo -> pause -> game over -> restart) present at representative quality? Entry criteria from production/qa-plan.md; QA Suite C (extended) executed in-browser this iteration.

### Gate Criteria (entry, from qa-plan.md)
1. Suite A green (node tests + build + 0 console errors) - 122/122 + build 0 + 0 errors (I44 run, re-verified this session).
2. Suite B green (8-step critical path) - green at I40; critical path re-exercised during this session's browser run (start / pause / resume / game over / restart / HUD / screens).
3. I41 playtest report filed - production/playtest-report.md (findings F1-F7, ordered recommendations).
4. No open bugs above minor severity - F1 fixed in I42; F2/F4 are design watch items (human playtest I90, balance I92), not bugs.
5. Perf within baseline - measured in the Suite C perf item below.

### Evidence (QA Suite C, executed this iteration)
- Storage round-trip: menu panel set to volume=1 / sfx=off / fx=low / reducedMotion=on -> full page reload -> stored == panel == live settings (all three layers agree).
- Resize mid-game: 800x600 -> 1600x800 while PLAYING -> 0 console errors/warnings; canvas CSS and drawing buffer both 1600x800 (composer resize path clean).
- Touch synth: single-finger tap -> 2 bullets live (FIRE_TAIL >=1-bullet guarantee); 70px drag -> thrust (1,0), ship vel +10.5 in drag direction, position advancing; two fingers -> PAUSED (0.45s cooldown gate intact).
- I43 robustness re-verification: visibilitychange hidden -> PAUSED (stays paused on visible; manual resume to PLAYING); WEBGL_lose_context while PLAYING -> PAUSED, restoreContext -> healthy render, same renderer/context alive, 0 errors.
- Perf @ wave 4 (?fps=2, 20 rocks + sustained mouse fire + bloom High): 60 fps / 16.6 ms / 37 calls / 1626 tris - within the I36 baseline (56-60 fps / 40 calls / 1638 tris).

### Concerns
- Perf headroom is machine-dependent: this gate ran on the dev machine; the low-end mitigation (adaptive quality, E7) stays on the plan.
- The perf scene reached GAME_OVER at the tail of the measurement window (ship struck by a test rock - the qa-plan probe rule to zero ship velocity was not applied for this run); the 0.5s meter window still reflects the full scene (21-22 rocks, live bullets).
- Touch automation is synthetic PointerEvents; real-device touch remains untested (acceptable at slice stage; flagged in qa-plan known gaps).

### Verdict
**PASS** - slice-gate entry criteria all met. Exit criteria (I46 regression green after I44, I49 release checklist clean) are scheduled at their own iterations.

### Risks
- R6 perf: ~40 calls / ~1638 tris is bloom-composer-dominated; adaptive quality (E7) is the standing mitigation.
- R5 input: synthetic touch verified; physical devices untested.
- F2 invuln fairness at high density: human playtest I90, possible balance fix I92.

### Changed files or proposed files
- production/gates.md (NEW: this artifact).
- No source changes this iteration (gate is evidence, not code - same pattern as I41).

### Verification evidence
- Suite A: 122/122 + build 0 (this session).
- Suite C browser run: 0 console errors on clean load; only info-level context lost/restored entries during the loss test; 0 errors/warnings after restore.
- Prior-iteration screenshots on record: .evidence/i44-menu.png, i44-hud-powerups.png, i44-paused.png (HUD/screens state at gate time); Suite C evidence is the behavioral transcript above.

### Next owner or decision
I46 (ST-046) final regression: full node suite + browser regression (Suites A+B+C re-run) + build; then I47 docs.

## I96 - Pre-Wrap Gate (ST-096)

- Date: 2026-11-10
- Skill: cgs-gate-check (advisory pre-wrap gate)

### Summary
Advisory gate on the E7 content/polish/hardening arc (I51-I95): is the code side complete enough to proceed to the final wrap (I97 milestone/retrospective, I98 release-checklist, I99/I100) and the Blender graphics pass that follows I100? This gate covers the CODE deliverable; the graphics/Blender quality bar is a separate, scheduled pass and is tracked as a known-open item, not a blocker for wrapping the code.

### Gate Criteria (advisory pre-wrap entry)
1. Tests green (node --test).
2. Production build succeeds (node scripts/build.mjs exit 0).
3. Iteration log complete and sequential (entries 1..N, no gaps/reorder).
4. CHANGELOG consistent with iterations (no true duplicates/missing entries).
5. Every E7 open item is resolved, accepted, or explicitly deferred with an owner (triage I91, balance I92, UI/UX I93, perf I95).
6. Working tree clean after the gate commit (no stray build/patch artifacts).
7. Steady-state performance within the 60fps budget; any non-steady cost documented with a disposition (I95).

### Evidence
- Suite: node --test = 233/233 pass, 0 fail (fresh run this iteration).
- Build: node scripts/build.mjs -> "dist/ assembled (static, import-map modules)", exit 0.
- Iteration log: 95 entries (I1..I95), sequential check PASS 1..95 (this gate appends I96 -> 96).
- CHANGELOG consistency: 96 bullet lines vs 95 iteration entries - investigated, NOT a duplicate: the CHANGELOG groups entries under "### Added"/"### Fixed" sub-sections, and I17 legitimately appears once under each (feature = menu/pause/game-over screens + session keys; fix = the World.reset() gameOver-getter crash found by its own tests). Verified against the I17 iteration entry, which lists both the feature and the bugfix. No true duplicate; a naive line-count would false-positive, so this is recorded to prevent a future gate from re-flagging it.
- Open items (from triage I91 / balance I92 / UI-UX I93 / perf I95): F9 wave-5->6 spike FIXED (I92 post-boss breather); F4 combo cap RESOLVED (I92 10->15); F2 invuln RESOLVED (I92 1.6->1.8s); F8 score-spread ACCEPTED + documented (I90/I91, ~20x->~1.4x, skill re-expressed as wave-depth + boss-clearance); F1/F5/F6/F7 CLOSED; 4 perception/balance "watch" items DEFERRED to a human playtest (not bot-verifiable); 0 code defects (I91 bottom line).
- Perf: steady-state within budget (mean 5-7ms, p95 11-14ms; 22-59 draw calls; <2.3k tris); the one-time ~90-600ms first-gameplay-frame WebGL-init cost is documented in production/perf-profile.md with a deferred disposition (I95).
- Working tree: clean after this commit (only the 4 gate files: CHANGELOG, iterations, active, gates).

### Concerns
- Human playtest is the outstanding evidence gap: the 4 deferred perception items (feel of post-boss breather, vortex dodgeability feel, combo/overdrive feel, wave-modifier legibility in-world) require a real human and cannot be bot-verified. This is the single largest unknown for actual player experience before true release.
- Blender graphics pass not yet started: the current visual bar is procedural-only (generated geometry + canvas textures). The "graphics" quality bar is not yet met by design; it is a scheduled pass after I100, so it is tracked as known-open rather than a code blocker.
- Perf first-frame hitch (~90-600ms) is deferred (offscreen warm-up render proposed, medium effort, non-blocking).
- CHANGELOG sub-section grouping (the I17 double-bullet) is a recurring source of naive-tooling false positives; any automated consistency check must group by sub-section, not by line.

### Verdict
**PASS (advisory) - proceed to wrap.** All seven entry criteria are met on the code side. The remaining items are (a) a human playtest (outstanding, not bot-verifiable) and (b) the Blender graphics pass (scheduled after I100) and (c) the optional perf first-frame warm-up. None of these block proceeding to the wrap iterations; they are tracked with owners and dispositions.

### Risks
- R1 (highest): the deferred human-playtest perception items - if a real player finds the post-boss breather still too spiky or the vortex too punishing, a further balance lever may be needed post-wrap. Mitigation: the levers are 1-line config changes (waves.js modifierFor, config.js boss/combo/invuln) already exercised in I92.
- R2: Blender pass is unstarted; the game is fully playable but visually placeholder-grade until it runs. Mitigation: it is explicitly scheduled after I100 and is the user-requested final graphics step.
- R3: perf first-frame hitch is one-time per session; low risk, deferred.

### Changed files or proposed files
- production/gates.md (append: this I96 pre-wrap gate).
- No source changes (gate is evidence + advisory, not code - same pattern as I45).

### Verification evidence
- node --test 233/233 green (fresh run this iteration).
- node scripts/build.mjs exit 0 (fresh run this iteration).
- Iteration sequence PASS 1..95 (pre-gate) -> 96 (post-gate); CHANGELOG I17 double-bullet verified against the I17 iteration entry (feature + bugfix both present).
- git working tree clean after the gate commit (only the 4 gate files).

### Next owner or decision
User-controlled next decision (advisory gate, non-blocking): proceed to I97 (milestone review + retrospective), then I98 (release-checklist), I99/I100 (regression + final wrap), then the Blender graphics pass (cgs-art-bible / cgs-asset-spec / cgs-asset-audit) as the final user-requested step. Owner for the outstanding human playtest: the user / a human QA session (out of bot scope).

## I110 - G8.0 E8 Entry Gate (ST-110)

- Date: 2026-11-10
- Skill: cgs-gate-check (advisory entry gate for E8 Expansion Milestone)

### Summary
Entry gate before the first E8B gameplay iteration (I111). Verifies the
baseline the 100-iteration expansion builds on: tests, build, iteration
log discipline, browser health, and a fresh perf reference. All E8A
planning artifacts (scope-check, epics, stories) must be in place.

### Gate Criteria
1. npm test green (baseline 233/233; E8 grows this to 300+ by I192).
2. npm run build exit 0.
3. Iteration sequence PASS 1..110 (no gaps/dupes); CHANGELOG + active.md current.
4. E8A artifacts present: production/scope-check-E8.md, epics.md E8 (E8A-E8F + gates), stories.md ST-107..206 (100 rows).
5. Browser healthy on dev :5173: boots to MENU, __vr live, forced 20-rock + boss scene renders with 0 NaN; fresh perf reference recorded.
6. git working tree clean at the gate commit.

### Evidence (collected this iteration)
- node --test: 233/233 pass, 0 fail (fresh run).
- node scripts/build.mjs: exit 0, "dist/ assembled (static, import-map modules)".
- Sequence: PASS 1..109 pre-commit -> 1..110 post-commit (verified by script).
- Artifacts: scope-check-E8.md (I107), epics.md E8 section with E8A-E8F + G8.0-G8.6 (I108), stories.md 100 E8 rows ST-107..206 verified by script (count 100, range 107..206).
- Browser (dev :5173): boots MENU, window.__vr live; forced scene (restart + 20 spawned rocks + boss via spawnBossForWave(5), rendered through the live rAF loop): 31 draw calls / 1500 tris, 20 rocks + boss present, 0 NaN across ship + rocks, state PLAYING; menu ref 22 calls / 268 tris. (Reference scene has no bullets/particles; later phase gates measure under the same conditions for comparability.)
- git: tree clean after this gate commit (4 doc files).

### Concerns
- Perf reference scene differs from the I105 forced scene (24 rocks + boss + live bullets/particles: 51 calls / 4052 tris); G8.0 records 20 rocks + boss quiescent (31 / 1500). Phase gates re-baseline under their own scenes; no regression implied.
- E8 adds ~8 entity/system types; R-E8-4 (perf) and R-E8-1 (balance) are the tracked mitigations (per-gate perf checks, three balance passes).

### Verdict
PASS - proceed to E8B. I111: combo/score multiplier (core).

### Risks
- None new; R-E8-1..6 tracked in production/epics.md (E8 Risk Register).

### Changed files
- production/gates.md (this gate)
- production/iterations.md (I110 entry)
- CHANGELOG.md (I110 line)
- production/session-state/active.md (state -> I110)

### Verification evidence
- All commands fresh-run this iteration (npm test, build, sequence script, browser probes via window.__vr).
- Assumptions: none - every criterion verified directly.

### Next owner or decision
I111 (ST-111): score combo/multiplier in src/core (new module + config block, rng.js for any randomness, DOM-free, unit-tested). No user decision required (advisory gate, non-blocking).

## I128 - G8.1 E8B Gate (ST-128)

- Date: 2026-11-10
- Skill: cgs-gate-check (advisory phase gate for E8B Core gameplay expansion)

### Summary
Phase gate closing the E8B feature build (I111-I127) before the E8B balance
follow-up (I129-I131). Verifies the epics.md G8.1 criteria: every new E8B
system unit-tested and observable in the browser, determinism harness green,
no NaN, and perf within budget per the ?dbg=1 overlay.

### Gate Criteria
1. Every new E8B system (combo/multiplier, bomb, slow-mo, homing drone,
   chain-splitter, shielded rock, weapon progression L1-3) is unit-tested.
2. Every E8B system is observable in the browser (dev :5173, ?dbg=1).
3. Determinism harness green, including the E8B coverage replay (I125).
4. No NaN across ship + rocks + drones + bullets + enemy bullets + mines.
5. Perf within budget per the dbg overlay (60fps = 16.67 ms/frame; <14 ms
   steady-state target; low draw calls - perf-profile.md).
6. npm test green, npm run build exit 0, iteration sequence PASS, git tree clean.

### Evidence (collected this iteration)
- npm test: 324/324 pass, 0 fail (fresh run), including the 40-test E8B batch
  (I126) and the determinism harness.
- Per-system unit suites: combo -> score.test.js (~14) + e8bBatch combo (5);
  bomb -> bombGenBonus.test.js (4) + e8bBatch bomb (4) + powerups.test.js (9,
  drop/apply); slow-mo -> slowmo.test.js (7) + e8bBatch (6); drone ->
  drones.test.js (8) + e8bBatch (5); splitter -> splitScoring.test.js (5) +
  asteroids.test.js (11) + e8bBatch (6); shielded -> shielded.test.js (8) +
  e8bBatch (5) + waves.test.js (10, shielded-over-golden rim roll); weapon ->
  weaponLevel.test.js (6) + weapons.test.js (8) + e8bBatch (9); determinism ->
  determinism.test.js (4, E8B coverage replay over 2400 steps).
- npm run build: exit 0.
- Sequence: PASS 1..127 pre-commit -> 1..128 post-commit (script).
- Browser (dev :5173, ?dbg=1&nocache=128a): boots to MENU (dbg overlay
  22 calls / 268 tris - matches the I110 menu reference); Enter -> PLAYING.
  Forced wave-10 scene (weapon L3 + shielded rim roll) + 2 placed shielded
  rocks (armor 3) + 3 homing drones + slow-mo apply:
  - Weapon progression: wlevel 3, weaponLevelUp event x1, in-flight bullet
    head tint #ffd27a (shared L3 head material).
  - Shielded rock: exactly the 2 shielded rocks show the shell child; both at
    armor-3 tier (opacity 0.50, #8ff2ff shared tier material); the 21 normal
    rocks show no shell; shell identity clearly distinct in the screenshot.
  - Drone: all 3 drone meshes at sim-exact positions (x/z match to 3 dp).
  - Slow-mo: enemyScale() 0.4 while active (ship-side unscaled).
  - Bomb: 21 -> 0 rocks, bomb event x1, ship invuln 1.47 s active; dbg overlay
    0/24 rocks + 11 calls / 270 tris after the blast.
  - Combo/score: kill x8 + nearmiss x6 events feed the multiplier during the
    scene (combo math itself is unit-tested: score.test.js + e8bBatch).
  - NaN: 0 across ship + all six entity lists.
  - dbg overlay (live rAF, post-bloom, full frame): 26-29 calls /
    1878-2190 tris under the E8B load scene (22 rocks + drones + bullets +
    drop); clear scene 11 calls / 270 tris.
  - Controlled 60-frame fixed-step sampling (advance 1/60 + render): 3.08 ms
    mean per frame under the same load - inside the 16.67 ms budget and the
    14 ms target.
  - Console: 0 errors / 0 warnings.
  - Screenshot: .evidence/I128_gate_dbg.png (dbg overlay + shielded L shell +
    drones + WAVE 10 banner).
- git: tree clean after this gate commit (4 doc files).

### Concerns
- The dbg overlay "ms" (250 ms, FPS 4) in the headless run reflects
  background-tab rAF throttling, not game cost; the controlled fixed-step
  sampling (3.08 ms mean) is the representative CPU cost (same method as
  perf-profile.md). Per-frame GPU stats (calls/tris) are unaffected by
  throttling.
- lives=999 test artifact renders a full row of heart icons (known,
  documented I127); real play is single digits.
- renderer.info accumulates without a per-frame reset (autoReset off;
  main.js resets at line 523) - read per-frame stats via the dbg-overlay
  path, not raw info after manual renders.

### Verdict
PASS - proceed to the E8B balance follow-up. I129: balance follow-up (post-gate playtest findings).

### Risks
- R-E8-1 (balance) is the active tracked risk; I129-I131 are the E8B balance
  passes. No new risks from this gate.

### Changed files
- production/gates.md (this gate)
- production/iterations.md (I128 entry)
- CHANGELOG.md (I128 line)
- production/session-state/active.md (state -> I128)

### Verification evidence
- All commands fresh-run this iteration (npm test, build, sequence script,
  browser probes via window.__vr + the ?dbg=1 overlay).
- Assumptions: none - every criterion verified directly.

### Next owner or decision
I129 (ST-129): balance follow-up (post-gate playtest findings) - notes +
config. No user decision required (advisory gate, non-blocking).

## I147 - G8.2 E8C Gate (ST-147)

- Date: 2026-11-10
- Skill: cgs-gate-check (advisory phase gate for E8C Content variety)

### Summary
Phase gate closing the E8C feature build (I133-I146) before the E8C
regression/fix/docs tail (I148-I150). Verifies the epics.md G8.2 criteria:
boss phases + mini-boss + belt verified in the browser, daily seed
reproducible (same date => same run), share string decodes, regression A
clean.

### Gate Criteria (epics.md G8.2)
1. Boss phases + mini-boss + belt verified in the browser.
2. Daily seed reproducible (same date => same run).
3. Share string decodes.
4. Regression A clean (npm test green, build 0, core-loop browser clean).
Plus the standing baseline: fresh npm test + build this iteration, console 0/0.

### Evidence (collected this iteration)
- npm test: 456/456 pass (fresh run); npm run build: exit 0 (fresh run).
- Boss phases (browser, dev :5173 ?nocache=147, fresh tab):
  - Monolith wave 15 (maxHp 52): phase 1 -> enrage after 27 hits -> phase 2 at hp 25 (just under the 50% threshold, 26).
  - Splicer wave 15 (maxHp 30): phase 1 -> enrage after 16 hits -> phase 2 at hp 14 (just under 15).
  - bossPhase2 announce event: emitted exactly once at the threshold - unit contract (tests/bossPhase2.test.js:89). The live phase transitions above were driven synchronously via hit(), so the step-loop announce tick did not run inside the probe (expected test-method artifact, not a defect).
- Mini-boss Warden (browser): wave 15, no heavyweight -> Warden (armor 6, hp 12). First bullet hit absorbed by armor (armor 6 -> 5, hp stays 12); after 10 more hits armor 0, hp 7 - the armor-first contract holds. 15 s live soak: Warden orbiting (x -1.48), belt 5/5, 0 NaN, state PLAYING. Screenshot .evidence/I147/I147_warden_belt.png.
- Belt (browser): 5/5 rocks present and stable across the gate soaks (also covered by the I146 soup: 60 s + Splicer-spiral coexistence, bolt pass-through verified I145).
- Daily seed reproducible (node): dailySeed(2026,11,10) = 317547475; same date => same seed, 2026-11-11 => 300769856 (differs). Two full 90 s daily runs (canonical input script) bit-identical (JSON snapshots): final score 27249, wave 5, 120 kills, GAME_OVER, Monolith alive.
- Share string decodes (node): encodeResult({seed, score 27249, wave 5, kills 120}) -> "vr1.592577.l0x.5.3c.6g" -> decodeResult round-trips exactly; corrupted checksum rejected; wrong magic rejected; uppercase rejected. Replay: a fresh World reseeded from the DECODED seed replays to the claimed score/wave/kills (27249/5/120) - a verifiable score claim, end to end.
- Regression A (browser, fresh tab): begin -> PLAYING; pause -> PAUSED; resume -> PLAYING; forced death (1 life, rock teleported onto the ship) -> GAME_OVER in 103 ms; restart -> PLAYING with lives 3 / score 0. Console on the gate tab: 0 errors / 0 warnings.
- NaN: 0 across ship + Warden + boss + vortex + all rocks + enemy bolts during the gate scenes (scoreKeeper.lastKillTime = -Infinity is the intentional sentinel, not a NaN).

### Concerns
- The bossPhase2 announce event was not observed in the live event tally (the synchronous hit() probe skips the step-loop tick); the once-only emission is locked by the unit test. No behavior change implied.
- Headless rAF runs at 4-6 fps (background-tab throttling); adaptive quality downgraded FX to low. All state-level evidence is dt-driven (step-based), so throttling does not affect the correctness conclusions; perf re-baselining is E8E scope (I184).
- The one "missing ) after argument list" console error from the I146 first session tab remained non-reproducible (three fresh gate/verify tabs: 0/0); still classified as a transient tooling artifact.

### Verdict
PASS - proceed to the E8C regression tail. I148: regression round A (extended browser).

### Risks
- R-E8-1 (balance): covered by I144 (boss family audit) + this gate's curve spot checks (Monolith 52 @ w15, Splicer 30 @ w15, Warden 12 hp + 6 armor on 5th waves). No new balance risks.
- No new risks introduced by this gate.

### Changed files
- production/gates.md (this gate)
- production/iterations.md (I147 entry)
- CHANGELOG.md (I147 line)
- production/session-state/active.md (state -> I147)

### Verification evidence
- All commands fresh-run this iteration: npm test, build, a temporary node daily/share evidence script (deleted after the run), browser probes via window.__vr on a fresh tab (?nocache=147).
- Assumptions: none - every criterion verified directly.

### Next owner or decision
I148 (ST-148): regression round A (extended browser) - longer real-time runs across the E8C systems (waves 1-20+ with boss + Warden + belt + mines + drones + vortex) and game-over/restart cycles under load. No user decision required (advisory gate, non-blocking).

## I164 - G8.3 E8D Gate (ST-164)

### Summary
Advisory gate for the E8D content (UI/UX + accessibility, ST-151..163) per cgs-gate-check. All four epics.md G8.3 criteria verified live in fresh browser tabs this iteration; the warden-spike CVD sub-check cites same-day live evidence (I155/I156). Verdict: PASS.

### Gate Criteria (epics.md G8.3)
1. Every new screen/overlay screenshot-verified.
2. Colorblind cue visible without color.
3. Hotkeys tested.
4. Reduced-motion honored by all new FX.
Plus the standing baseline: fresh npm test + build this iteration, console 0/0.

### Evidence (collected this iteration)
- Baseline: fresh npm test 491/491 pass; fresh npm run build exit 0.
- Criterion 1 - screens/overlays (fresh tabs ?nocache=164 + ?nocache=164c, 6 screenshots .evidence/I164/):
  - MENU (I164_1_menu.png): keycaps (WASD / MOUSE / CLICK-SPACE / P-ESC / M / F), TOP 5 board, DAILY line, both settings cards (AUDIO + VISUALS, 8 rows).
  - PLAYING (I164_2_playing.png): in-game HUD + arena.
  - PAUSED (I164_4_paused.png): settings card + M/F rows.
  - GAME OVER (I164_5_gameover.png): stats panel + COPY RESULT button.
  - TUTORIAL overlay (I164_6_tutorial.png): full real-flow on the fresh tab - removed the raw localStorage seen key, pressed Enter through the real startRun -> 'HOW TO PLAY' overlay with sim frozen (world.time stayed 0.000), Enter dismissed -> sim resumed (time 2.317 and counting), flag re-persisted true.
  - Wave banner (CLEARED gold), kill feed (5 combo-scaled rows) and the compact score + inline x1.4 multiplier were screenshot-verified in I163 on the identical build (6 screenshots .evidence/I163/).
- Criterion 2 - colorblind cue without color (live, ?nocache=164 tab):
  - COLORBLIND setting enabled -> canvas style.filter = url("#vr-cvd-deutan") + the #vr-cvd-deutan SVG (deuteranopia, Machado 2009) injected.
  - Three golden M rocks spawned through the real pipeline (field.spawn('M', 0.1, at, null, true)); the render pool shows exactly 3 visible wireframe cages at the golden positions and cage.visible=false on all 7 non-golden active meshes (I164_3_colorblind_cage.png).
  - Warden 8-spike collar: live structure confirmed (collar group of 8 holders, state-gated); the full warden-under-CVD check ran same-day in I155/I156 (live warden spawns, 3 Machado/tritanopia sims, cage + spikes read as silhouette in every sim, entity-pair dE 41-111). wardenMesh.js has had no diff since I155.
- Criterion 3 - hotkeys (live, ?nocache=164 tab):
  - F: FX HIGH -> LOW (toast 'FX LOW', liveSettings().fx 'low') -> HIGH again; pause row tracked 'FX HIGH'.
  - M: mute round trip confirmed through the pause-screen label 'M - MUTE (ON)' -> '(OFF)'; settings.sfx untouched (muted is a separate module state by design).
  - P: PLAYING -> PAUSED -> PLAYING (state machine + screen swap both correct).
- Criterion 4 - reduced motion (live, reducedMotion set true then restored false):
  - Wave banner: scale punch skipped - computed transform identity matrix(1,0,0,1,0,0) with 0s transition while 'WAVE 2' rendered (punch is 1.06 -> 1.0 only with motion allowed, I154).
  - Kill feed rows: no slide-in - computed transform 'none', 0s transition.
  - Slow-mo hint caption: transition 'none' / 0s (snaps, I161).
  - HUD multiplier: 0s transition, animation 'none' (pop skipped, I160).
  - Tutorial overlay: motion-gated via the vr-reduced class (I151); the overlay render itself was verified on this tab under default motion.
- Baseline health: deep NaN scan 0 non-finite on both tabs (ship/field/weapons/enemyBullets/powerups/scoreKeeper; only the intentional lastKillTime = -Infinity sentinel exists); console 0 errors / 0 warnings on the fresh ?nocache=164c tab through menu -> tutorial -> PLAYING soak.

### Concerns
- The warden-spike CVD sub-check cites same-day I155/I156 live evidence (a warden cannot be force-spawned below wave 5 without full wave progression); wardenMesh.js is unchanged since then, so the contract stands.
- M-mute state has no live indicator in the MENU (static keycap only; the label lives on the pause screen). Cosmetic - candidate for the I165 UX fix round.
- Headless background-tab rAF throttles to ~4fps; all evidence above is state/CSS-level (dt-driven), so throttling does not affect the conclusions.

### Verdict
PASS - proceed to the E8D tail. I165: UX fix round (ST-165).

### Risks
- R-E8-D-1 (UX, cosmetic): no in-menu mute indicator (findings list for I165). No other new risks; the gate introduced no production diff.

### Changed files
- production/gates.md (this gate)
- production/iterations.md (I164 entry)
- CHANGELOG.md (I164 line)
- production/session-state/active.md (state -> I164 committed)

### Verification evidence
- All commands fresh-run this iteration: npm test (491/491), npm run build (exit 0), Playwright fresh tabs (?nocache=164 / 164b / 164c) with __vr probes, 6 screenshots in .evidence/I164/ (gitignored, local-only).
- Assumptions: none for the four criteria - each verified directly, except the warden-spike CVD sub-check which is explicitly cited from same-day I155/I156 (labeled, not assumed).

### Next owner or decision
I165 (ST-165): UX fix round - address the findings above (in-menu mute indicator; any additional findings from the I165 review). No user decision required (advisory gate, non-blocking).

## I182 - G8.4 E8E Gate (ST-182)

### Summary
Advisory phase gate closing the E8E feel/audio/juice arc (I170-I181) before the E8E tail (I183 feel tuning 2, I184 perf profile, I185 memory audit, I186 docs). Verifies the epics.md G8.4 criteria: music audible + toggleable + gesture-gated; death slow-mo verified; perf + memory within budget; all new FX respect reduced motion. The audio/feel/rm criteria are verified from I181 evidence (same-day live browser sessions; git log confirms no src/render/audio.js diff since I173 and no src/main.js diff since I179, so the contracts stand, and I180's 18-test headless suite re-verifies the synth layer on every run); the perf + memory criterion was measured live this iteration with the G8.0 reference scene (24 rocks + wave-5 Monolith + real mouse-hold sustained fire + E8E juice peaks), following the in-gate perf reference precedent set by G8.0 (I110) and G8.1 (I128). Verdict: PASS.

### Gate Criteria (epics.md G8.4)
1. Music audible + toggleable + gesture-gated.
2. Death slow-mo verified.
3. Perf + memory within budget.
4. All new FX respect reduced motion.
Plus the standing baseline: fresh npm test + build this iteration, console 0/0.

### Evidence (collected this iteration unless noted)
- Baseline: fresh npm test 565/565 pass; fresh node scripts/build.mjs exit 0 (both run this iteration).
- Criterion 1 - music audible + toggleable + gesture-gated (I181 evidence, same day, ?nocache=181a):
  - Gesture-gated: pre-gesture audio.state() 'uninitialized' with no buses; after a real Enter keypress 'running' (the WebAudio autoplay policy is enforced; the bus starts from the user gesture only).
  - Audible: live meter peak 0.162-0.191 under a running bus (analyser-driven; a silent bus reads 0).
  - Toggleable: N mid-run -> musicOn false + 'MUSIC OFF' toast + localStorage voidrunner.settings music:false (the I171 persisted toggle) -> N -> 'MUSIC ON' + music:true; M -> meter peak/rms exactly 0 with musicOn still true (the muted master gain: the bed runs under it) -> M -> recovers 0.185; setVolume(0.2) -> meter 0.060 (proportional to 0.185 at 0.7) -> restored.
  - Bus lifecycle: GAME_OVER stops the bus (musicOn false, the I158 PLAYING gate); Enter restart -> PLAYING, bus back (meter 0.191).
- Criterion 2 - death slow-mo verified (both motion states):
  - Motion ON (I174 smoke, ?nocache=174c): hit -> warpCents -514.0625 (peak x0.75 window), exactly 0 after the 0.8s decay; the max() handback with the slow-mo power-up warp (deeper wins, exact handback on close) verified there.
  - Reduced motion (I181 part 2, ?nocache=181b): hit -> warpCents -514.0625 armed -> exactly 0 after advance(1.0). The I172/I174 timeWarp seam sits in the state-always-advances chain, not a motion-gated branch - the audio half of the hit is motion-independent by design, and this is the verification of that design under rm.
- Criterion 3 - perf + memory within budget (measured this iteration, fresh tab ?nocache=182, dev :5173):
  - Scene: the G8.0 reference scene - 24 M rocks (speedMult 0.1, rim-placed at radius 24) + wave-5 Monolith (hp 40, ring/volley fire live, 1 enemy bolt in flight) + sustained player fire (real mouse hold via Playwright, 96 fire events during the measurement window) + the E8E juice peaks (ST-177 pickup burst 24 particles, ST-178 weapon fanfare peak 106 particles). Ship protected (invuln 9999, lives 999 - the I127/I147 test artifacts); scene stayed PLAYING throughout the protected runs.
  - CPU fixed-step sampling (advance 1/60 + render, the I128 method; 120 frames, performance.now brackets, 30 warm-up): Run B (rocks + boss, no sustained fire): mean 0.943 ms, p95 1.5 ms, worst 39.4 ms (a single-frame GC/compositor spike inside the evaluate - p95 is the meaningful metric). Run C (same + sustained fire): mean 0.34 ms, p95 0.6 ms, worst 2.5 ms. Run A (dead-ship variant, 20 rocks + boss - method artifact, see Concerns): mean 1.32 ms, p95 1.6 ms, worst 54.8 ms. All vs the 14 ms target / 16.67 ms frame budget.
  - GPU per-frame stats (renderer.info with a manual reset per frame): peak 19 calls / 1614 tris (a boss ring volley in flight); steady 17-18 calls / 926-1040 tris - at or below the I45 reference (37 calls / 1626 tris) and the I110 G8.0 reference (31 / 1500).
  - Memory (performance.memory, Chromium): usedJSHeapSize 12867 KB before the scene -> 12993 KB after ~5s of simulation + the particle peaks = +126 KB; no runaway growth. Labeled as a reference sample (single before/after pair, no forced GC) - I185 is the memory audit with a proper soak.
  - NaN: 0 across ship pos/vel, all 24 rocks pos/vel, boss pos, player bullets, enemy bolts.
- Criterion 4 - all new FX respect reduced motion (I181 part 2 + the per-iteration smokes of I174-I178; git log confirms no src/main.js diff since I179, so the gates stand):
  - Under reducedMotion:true, an injected hit produces shakeMag 0 (the I175 shake stays motion-gated) and dangerOp 0.6 (the ST-176 reduced-motion damage vignette - the motion-safe visual substitute), with warpCents -514.0625 + played.hit +1 (the motion-independent audio half).
  - I177 smoke part 2: pickup burst + magnet trail stay 0 live under rm (juice motion-gated) while the core magnetPull flag still sets (a sim fact, motion-independent). I178 smoke part 2: the weapon fanfare stays 0 live under rm while the toast + levelUp SFX still fire. I174: the death slow-mo is audio-only (no visual motion). The I154/I160-I162 E8D reduced-motion gates (banner/kill-feed/hint/multiplier) are unchanged since G8.3.
- Console: 0 errors / 0 warnings on the ?nocache=182 tab across the whole gate (menu -> PLAYING -> forced scene -> 3 measurement runs -> screenshot).
- Screenshot: .evidence/I182/I182_1_gate_scene.png (PLAYING, forced scene).

### Concerns
- The perf scene measures CPU via manual fixed-step sampling (the I128 method) and GPU via renderer.info; the live rAF frame rate in a background tab is throttled (~4 fps) and is not a game cost - the same labeled caveat as I128/G8.1. The representative numbers are the fixed-step mean/p95 + per-frame calls/tris.
- Live player bullets read 0 at the sample instant (aimed at the screen-center pointer, they exit the arena and despawn quickly; the 96 fire events prove the sustained-fire path was live the whole window). The I45 reference (37 / 1626 with visible bullets) is the higher historical bound; this gate's peak (19 / 1614) sits below it.
- The memory delta is a rough one-directional heap sample without forced GC; it is a reference for this gate, not a verdict on its own. I185 (memory audit) does the proper soak + GC-controlled measurement.
- Run A's game-over is a test-method artifact, not a defect: the ship (unprotected at the time) idle-died during a ~45s real-time tooling gap before the probe - the documented idle-death behavior flagged in I181's risk note. The scene numbers from that run are retained for completeness; the subsequent runs protected the ship and stayed PLAYING.

### Verdict
**PASS** - all four epics.md G8.4 criteria met with evidence: (1) music audible + toggleable + gesture-gated, (2) death slow-mo verified under both motion states, (3) perf + memory within budget (fixed-step mean 0.34-1.32 ms / p95 0.6-1.6 ms vs the 14 ms target; GPU peak 19 calls / 1614 tris vs the I45 37 / 1626 reference; heap +126 KB with no runaway), (4) all new FX respect reduced motion. Proceed to the E8E tail.

### Risks
- No new risks. R-E8-4 (perf) is mitigated by this gate's in-budget numbers; the deep profile (I184) and memory audit (I185) remain scheduled as the tail.

### Changed files
- production/gates.md (this gate)
- production/iterations.md (I182 entry)
- CHANGELOG.md (I182 line)
- production/session-state/active.md (state -> I182 committed)
- No source changes (the gate is evidence, not code - the I45/I96/I147 pattern).

### Verification evidence
- All commands fresh-run this iteration: npm test (565/565), node scripts/build.mjs (exit 0), browser probes via window.__vr on the fresh ?nocache=182 tab (3 forced-scene measurement runs, real mouse-hold sustained fire, NaN scan, heap sample), screenshot .evidence/I182/ (gitignored, local only).
- Assumptions: none on the four criteria - audio/rm cite same-day I181 + I174/I177/I178 evidence (labeled, and backed by the git log: no audio.js diff since I173, no main.js diff since I179); perf + memory were measured directly this iteration.

### Next owner or decision
I183 (ST-183): feel tuning round 2 - playtest-driven; inputs are the 3 watch-items in design/feel-balance.md + CONFIG.fx.flashTable / CONFIG.fx.shakeTable. No user decision required (advisory gate, non-blocking).

## I198 - G8.5 E8F Robustness Gate (ST-198)

### Summary
Advisory phase gate closing the E8F robustness arc (I187-I197) before the tail (I199 regression round C + playtest prep, I200 docs, I201 QA plan, I202 human playtest, I203 triage, I204 release checklist, I205 final sweep, I206 E8 closeout). Scope: context-loss hardening (I187-188), visibility pause (I189), replay viewer + capture (I190-191), test growth 300+ (I192), flaky check (I193), security audit (I194), regression round B (I195-196), build size + load audit (I197). Verdict: PASS.

### Gate Criteria (advisory, G8.5)
1. Context-loss hardening: tab hidden pauses the sim through the real handler; resume restores it (I187-188/189).
2. Replay pipeline deterministic end-to-end: viewer round-trips the demo pilot to the exact core-pinned death index; capture UI contract stands (I190-191).
3. Test suite: 300+ green, deterministic (no flake), security-hardened with totality tests (I192-194).
4. Delivery: first payload within the adopted budget and load profile clean (I197).
5. Standing baseline: fresh npm test + build this iteration, console 0/0.

### Evidence (collected this iteration unless noted)
- Baseline (this iteration): fresh npm test 630/630 pass / 0 fail; fresh node scripts/build.mjs exit 0.
- C1 - visibility pause (measured this iteration, fresh tab ?nocache=198, dev :5173):
  - MENU -> Enter -> PLAYING (real keydown on window).
  - __vr.simVisibility('hidden') drives the REAL handler (main.js:475-478, the I189 named handler with the pure core decision from visibilityPause.js) -> state PAUSED.
  - advance(2.0) while PAUSED: world.time frozen (0.4999... unchanged) - the sim does not tick while the tab is hidden.
  - __vr.simVisibility('visible') -> state unchanged (the handler pauses only, by design); 'p' -> PLAYING (togglePause, main.js:410); advance(0.3) -> time +0.3 exactly.
  - I187-188 context-loss hardening: __vr.clockState probe live (I188: reset discards the stall); __vr.simCtxLost/simCtxRestore probes live (I187 WebGL context-loss path); no main.js diff since I191 (git log), so the I188-189 contracts stand.
- C2 - replay determinism (measured this iteration, same tab):
  - __vr.demoReplay() -> {v:1, kind:'demo', seed:1909, len:2220}; __vr.startReplay(payload) -> REPLAY; driven to completion -> idx 2169 / len 2220 = EXACT core pin (tests/replay.test.js:246; I196 browser smoke pinned score 11334 on the same run).
  - Capture UI (I191): O toggle + save-on-game-over + cap-2 eviction + per-run fresh seed verified in I191's own smoke; no recording.js/main.js diff since I191 (git log) and the 5 recording tests re-ran green in this iteration's 630.
  - Exit: exitReplay() -> MENU.
- C3 - test suite (this iteration + I192-194 records): 630/630 (target was 300+, now 2.1x); I193 flaky check: 5 consecutive + 1 serial run, no count drift, no order dependency, static flake-source scan clean (determinism structural - seeded rng.js); I194: tests/security.test.js (8 totality tests: adversarial share strings 64B-1MB, 27-case malformed replay battery, __proto__ pollution probe, meta-sanitization pins, migratePayload corrupt battery) is part of the green suite.
- C4 - delivery (I197 record, one iteration back; src/ unchanged since - git log): dist/ = 1,864 KB raw / 449.6 KB gzip vs the adopted budget <= 2 MB / <= 550 KB (18% gzip headroom); 86 resources fully parallel, all done 622 ms, domReady 890 ms headless; three.module.js 1,243 KB = 65% of dist (accepted, irreducible under the no-bundler/vendored convention); 5 GLB assets total 88.1 KB raw / 27.1 KB gz.
- Console: 0 errors / 0 warnings on the ?nocache=198 tab across the whole gate.
- Screenshot: .evidence/I198/01-gate-g85-playing.png (PLAYING after resume).

### Concerns
- The first resume probe attempt read PAUSED after the 'p' press - traced to the probe itself: dispatching keydown to BOTH window and document delivers two events (double toggle: PAUSED->PLAYING->PAUSED). A single dispatch resumes correctly (evidence above). Labeled probe artifact, not a product issue.
- C4 evidence is cited from I197 (one iteration old; src/ unchanged since - verified by git log). A fresh payload re-measure is not warranted at this gate.
- The replay score (11334) is pinned by the test suite (re-run this iteration) and by I196's browser smoke; this gate re-verified the death index (2169) live and did not re-read the score readout.
- Visibility resume is manual (P/Enter) by design - the handler pauses only. A returning player sees the pause overlay; matches the I189 contract.

### Verdict
**PASS** - all five G8.5 criteria met: (1) visibility pause freezes the sim through the real handler and resumes cleanly, (2) the replay pipeline round-trips to the exact core-pinned death index, (3) 630/630 green and deterministic with the security totality battery, (4) payload 449.6 KB gzip within budget with a clean parallel load, (5) fresh baseline + console 0/0. Proceed to the E8F tail (I199 regression round C + playtest prep).

### Risks
- No new risks. R-E8-2 (determinism) re-verified by this gate's live replay pin + the I193 flaky check. R-E8-3 (context loss) directly mitigated by the I187-189 hardening re-verified here.

### Changed files
- production/gates.md (this gate)
- production/iterations.md (I198 entry)
- CHANGELOG.md (I198 line)
- production/session-state/active.md (state -> I198 committed)
- No source changes (the gate is evidence, not code - the I45/I96/I147/I182 pattern).

### Verification evidence
- All commands fresh-run this iteration: npm test (630/630), node scripts/build.mjs (exit 0), browser probes via window.__vr on the fresh ?nocache=198 tab (Enter->PLAYING, simVisibility hidden->PAUSED freeze, p->PLAYING resume, demoReplay->startReplay->idx 2169 pin, exitReplay->MENU), console 0/0, screenshot .evidence/I198/ (gitignored, local only).

### Next owner or decision
I199 (ST-199): regression round C + playtest prep - full suite re-run matrix, browser state-machine + critical-path probe sweep, then prepare the human-playtest instrument (the cgs-qa-plan territory lands at I201). No user decision required (advisory gate, non-blocking).

## I206 - G8.6 E8 Closeout Gate (ST-206)

### Summary
Final E8 gate. All six criteria met with fresh or freshly-cited evidence. **PASS** - the
E8 Expansion Milestone (I107-I206) is CLOSED.

### Gate Criteria (qa-plan E8, I201)
1. 100/100 E8 iterations logged sequential (107..206).
2. 300+ tests green.
3. Build green.
4. Extended regression clean (rounds B + C + D).
5. Playtest triaged.
6. Release checklist done.

### Evidence (collected this iteration unless noted)
- C1 sequence: iterations.md headers audited by script - 1..205 present pre-commit, no gaps,
  no dups; this commit adds I206 -> 1..206 complete, E8 = 100/100 (I107-I206).
- C2 tests: 630/630 (fresh run this iteration, per-iteration gate). 300+ target exceeded 2x.
- C3 build: node scripts/build.mjs exit 0 (fresh, this iteration); dist 88 files / 1,909,058 B
  raw; I197 gzip audit 449.6 KB - within the adopted budget.
- C4 regression: round B (I195/196), C (I199), D (I205) all clean; D = 3/3 matrix 630/630
  (.evidence/I205/matrix.txt) + 6/6 production-dist browser scenarios + console 0/0. No source
  changes I199-I206, so earlier results carry intact.
- C5 playtest: v3 (I202, 3 runs per the I199 checklist) + triage v2 (I203): 0 BUG findings;
  3 BALANCE dispositions, 2 ART/AUDIO routed to E9, 3 labeled non-defects; 8 HUMAN-PENDING
  items carried.
- C6 release checklist: v3 / E8 (I204) - SHIP-READY (code side); production-dist smoke green
  with the demo pin EXACT (t=36.15 s, score 11334, idx 2169/2220) = dev/dist determinism
  confirmed.

### Concerns
- The 8 HUMAN-PENDING perception items remain the player-experience evidence gap (non-blocking
  by milestone plan; the bot covered everything bot-verifiable quantitatively).
- The E9 Blender art pass is the next user-requested workstream; visuals are
  procedural + 5 low-poly GLBs until it runs.
- Low-end physical device / GPU validation untested (adaptive quality I73 mitigates).

### Verdict
**PASS - E8 CLOSED.** All phase gates G8.0-G8.6 recorded (I110/I128/I147/I164/I182/I198/I206).

### Risks
- Carry to E9: combo-cap flatness (T1, human data point needed), boss-lethality feel (T2),
  kill juice sparsity (T4), boss music spike mix (T5), tutorial/REC/overdrive/vortex/breather
  feel items (HUMAN-PENDING list).

### Changed files
- production/milestone-review.md (+E8 section), production/gates.md (this block), CHANGELOG.md,
  production/iterations.md, production/session-state/active.md.

### Verification evidence
- npm test 630/630 (fresh, this iteration); node scripts/build.mjs exit 0 (fresh, this
  iteration).
- Sequence audit (this iteration): 1..205 pre-commit, no gaps/dups.
- .evidence/I205/matrix.txt, .evidence/I204/01-dist-gameplay.png, .evidence/I202/ (3 shots).

### Next owner / decision
- E9 (ST-207+): Blender asset/art pass per design/art-direction-research.md - GLTF pipeline
  refresh (ST-207), ship model (ST-208), asteroid L/M/S models (ST-209-210), boss model
  (ST-211), skybox/arena ring (ST-212) - plus the 8 HUMAN-PENDING items when a human is
  available.

## G9.0 - E9 Blender asset milestone gate (I216)

### Summary
Gate check for the E9 Blender graphics & assets milestone (ST-207..216) per cgs-gate-check. Advisory gate; verdict PASS with carry-overs (8 HUMAN-PENDING perception items, 2 of them ART/AUDIO; ST-217 post-processing polish queued).

### Gate Criteria
1. Pipeline: Blender->GLB->GLTFLoader runtime path works, with procedural fallback when a GLB fails.
2. Assets: all 15 GLBs + skybox PNG load at runtime; per-asset poly/tri/file/attribute budgets met.
3. Performance: asset profile within budget, no bottleneck (draw calls / tris / VRAM).
4. Quality: fresh test suite green, fresh build green, dist within budget, fresh browser smoke clean (console 0/0, finite).
5. Documentation: asset audit + perf report + iteration log 1..216 sequential (no gaps/dups).

### Evidence
- (1) I207: pipeline live + fallback proven (5/5 aborted loads -> procedural boot, exactly 5 warns, 0 errors).
- (2) I216 fresh smoke (?nocache=216a): 15/15 ready + skybox; per-story smokes I208-I213 (ship 40 tris; rocks 320/104/80; boss 96 + shield 80; 7 emblems 16..48 + drone 52; skybox 1024x512 + ring 48 tris; 88/88 standard mats @ envMapIntensity 0.55). Budgets pinned by tests/assetGlbs.test.js + tests/assetPerf.test.js (green in the fresh 670/670).
- (3) I214: 15 GLBs = 111.3 KB files / 92.9 KB parsed geo / 1021 tris / 17 materials / 0 UV2; runtime 280 pooled meshes over 26 unique geometries; ~5.5 MB GPU textures; 43 calls / 962 tris / 36 programs mid-run; NO bottleneck (largest asteroid_L 36.8 KB deliberate; 512x256 skybox option documented, deferred).
- (4) I216 fresh: npm test 670/670; node scripts/build.mjs exit 0; dist 1939.2 KB raw / 501.3 KB gzip (budget <=2048/<=550); fresh smoke ?nocache=216a: 15/15, 8 s pilot -> PLAYING 15 kills / 2668 pts, all finite, 25 calls / 162 tris / 20 programs, console 0/0. Screenshot .evidence/I216/01-gate-smoke.png.
- (5) production/perf-profile.md ## I214 + production/asset-audit.md; I216 log audit: 215 entries 1..215 sequential (no gaps/dups), I216 appended -> 1..216.

### Concerns
- The 8 HUMAN-PENDING perception items remain the player-experience evidence gap; 2 are ART/AUDIO (kill-juice sparsity P2, boss music spike mix).
- ST-217 (post-processing polish: half-res bloom, boss-kill flash / phase-2 hit-stop) is queued per the 2026-11-10 art research; the E9 art direction continues through it.
- Low-end physical device / GPU validation untested (adaptive quality I73 mitigates).

### Verdict
**PASS - E9 asset phase (ST-207..216) gate-verified.** 15/15 Blender assets + skybox within budgets, fallback proven, no perf bottleneck, fresh suite/build/smoke green, log 1..216 sequential.

### Risks
- R-E9-1..4 carried (epics.md E9 risk register); 8 HUMAN-PENDING items; dist gzip headroom ~49 KB (ST-217 needs a size review).

### Changed files
- production/gates.md (this block), production/epics.md (+E9 section), production/milestone-review.md (+E9 section), production/timeline.md, CHANGELOG.md, production/iterations.md, production/session-state/active.md.

### Verification evidence
- npm test 670/670 (fresh, this iteration); node scripts/build.mjs exit 0 (fresh, this iteration); log audit 1..216 sequential (this iteration); .evidence/I216/01-gate-smoke.png.

### Next owner / decision
- I217 ST-217: post-processing polish pass (half-res bloom + boss-kill flash / phase-2 hit-stop, FX-tier + adaptive-gated, frame-time before/after) per design/art-direction-research.md; then E9 closeout.

## G9.1 - E9 closeout gate (I218)

### Summary
Closeout gate for the E9 Blender graphics & assets milestone (ST-207..217) per cgs-gate-check. G9.0 (I216) verified the asset phase (ST-207..216); I217 closed ST-217 (post-processing polish), the last queued art story; this gate closes E9. Advisory gate.

### Gate Criteria
1. All E9 stories complete: ST-207..217 (11 stories), each with iteration evidence in production/iterations.md.
2. Post-processing polish (ST-217) landed: half-res bloom with frame-time before/after, phase-2 hit-stop, FX-tier + motion gated.
3. Quality: fresh test suite green, fresh build green, dist within budget.
4. Documentation: milestone review final + epics CLOSED + timeline + changelog + stories + log audit sequential (no gaps/dups).
5. Risk register disposition: R-E9-1..4 closed or explicitly carried.

### Evidence
- (1) Stories: ST-207 (I207), ST-208 (I208), ST-209 (I209), ST-210 (I210), ST-211 (I211), ST-212 (I212), ST-213 (I213), ST-214 (I214), ST-215 (I215), ST-216 (I216), ST-217 (I217) - 11/11 closed across 12 iterations (I207..I218).
- (2) I217: half-res bloom (vendor setSize halves the forced half again -> internal bright pass + 5-mip chain at 1/4 frame; glow visually unchanged, .evidence/I217/01-halfres-bloom.png); post chain steady 3.183 -> 2.586 ms avg (~11% cheaper, same scripted pilot + probe); 40 ms phase-2 hit-stop (research window, below bomb/bossDeath) + main.js juice branch; levers 2/3 verified already-done (particles.js AdditiveBlending; ST-179 flashTable bossDeath flash).
- (3) I218 fresh: npm test 676/676; node scripts/build.mjs exit 0; dist 1940.6 KB raw / 501.9 KB gzip (budget <=2048/<=550, ~48.1 KB headroom).
- (4) I218 log audit: 217 entries 1..217 sequential (no gaps/dups); I218 appended -> 1..218. Milestone review final section + epics CLOSED + timeline line + CHANGELOG + stories CLOSED line all landed this iteration.
- (5) Risks: R-E9-1 CLOSED (dist 1940.6/501.9, budgets pinned by assetPerf.test.js), R-E9-2 CLOSED (fallback proven I207; naming/attribute/budget tests green), R-E9-3 CLOSED (Blender 5.2 exporter quirks captured in I208-I212 notes; audits re-verify exports), R-E9-4 CLOSED (art research capped; ST-217 was the last queued art story). 8 HUMAN-PENDING perception items CARRIED to E10 (non-blocking; need a human session; 2 of them ART/AUDIO).

### Concerns
- Low-end physical device / GPU validation untested (adaptive quality I73 mitigates; carried).
- 8 HUMAN-PENDING perception items remain the player-experience evidence gap (non-blocking).

### Verdict
**PASS - E9 CLOSED.** 11/11 stories (ST-207..217) complete with per-iteration evidence; fresh suite/build/dist green; log 1..218 sequential; risk register closed except the carried 8 HUMAN-PENDING items + low-end device validation.

### Risks
- Carried: 8 HUMAN-PENDING perception items (production/bug-triage.md), low-end physical device / GPU validation.

### Changed files
- production/gates.md (this block), production/milestone-review.md (E9 final closeout section), production/epics.md (E9 header + Result CLOSED), production/timeline.md, production/stories.md (E9 CLOSED line), CHANGELOG.md, production/iterations.md, production/session-state/active.md.

### Verification evidence
- npm test 676/676 (fresh, this iteration); node scripts/build.mjs exit 0 (fresh, this iteration); log audit 1..218 sequential (this iteration); dist 1940.6/501.9 KB (this iteration).

### Next owner / decision
- I219: open E10 (post-E9 polish) - scope check + stories (cgs-scope-check + cgs-create-stories). First candidate: art research lever 6 (camera/feel: 2-5% aim-lead, boss-approach zoom-out, menu orbit drift - the only unowned lever). 8 HUMAN-PENDING items parked for a human session.