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

## G10.0 - E10 closeout gate (I222)

### Summary
Closeout gate for the E10 Post-E9 Polish milestone (ST-218..220) per cgs-gate-check. ST-218 (I220) closed the Warden Blender model; ST-219 (I221) closed the camera/feel lever; this iteration runs the E10 regression round and closes the epic. Advisory gate.

### Gate Criteria
1. All E10 stories complete: ST-218..220 (3 stories), each with iteration evidence in production/iterations.md.
2. Warden GLB (16th asset) loads and the armor-state visual is intact: screenshot-compare armored vs spent.
3. Camera/feel deltas subtle + stable-view verified: scripted-pilot parity (no core change), frame-time delta ~0 vs pre-lever.
4. Quality: fresh test matrix green (in-process + cross-process), fresh build green, dist within budget.
5. Regression: state machine, persistence, demo pin (seed 1909 / step 2169 / 2220 / score 11334 / t=36.15), finiteness, console clean.
6. Documentation: milestone review final + epics CLOSED + timeline + changelog + stories + log audit sequential (no gaps/dups).
7. Risk register disposition: R-E10-1..3 closed or explicitly carried.

### Evidence
- (1) Stories: ST-218 (I220), ST-219 (I221), ST-220 (I222) - 3/3 closed across 4 iterations (I219..I222).
- (2) I222 Warden A/B (criterion 2): .evidence/I222/03-warden-armored-sameframe.png (teal hull + full plate ring) vs .evidence/I222/02-warden-spent.png (orange exposed core, 8 spike silhouette cues, armor ring retracted to scale 0.62) - same staging (ship (0,0), warden (0,3.13), camera (0,9,13)); the I155/ST-137 armor-state animation drives the GLB nodes unchanged; .evidence/I222/01-warden-armored.png (earlier 222a far view) supplementary.
- (3) I222 fresh pilot parity (criterion 3) ?nocache=222c: 1080-tick scripted pilot (291.9 ms loop) -> PLAYING at sim t=31.47 s, 7449 pts / 35 kills, ship + 6 live rocks all finite; frame probe 400 f (370 after 30 warm-up) avg 16.93 / p50 16.7 / p95 20.5 ms (one 59.5 ms outlier, no pattern; 60 fps locked, delta ~0 vs I221 16.57). I221 lever measurements carry: aim-lead in/cap/out exact (+0.223/+0.334, cap EXACTLY 1.2), boss zoom 60 -> 62.134 -> 60.01, menu orbit 0.06 rad/s.
- (4) I222 node matrix 3/3 (.evidence/I222/matrix.txt + run3.txt): npm test 677/677 x2 (in-process) + cross-process node --test "tests/*.test.js" 677/677. Build exit 0; dist 1954.9 KB raw / 506.2 KB gzip (budget <=2048/<=550, ~43.8 KB headroom).
- (5) I222 regression ?nocache=222a: 16/16 assets + skybox; state machine 6/6 (MENU -> PLAYING -> PAUSED sim-frozen -> PLAYING -> MENU via Q); persistence intact (best 36426 + settings object); demo pin via REAL UI path (menu REPLAYS -> DEMO PILOT -> key 3 x4) EXACT: GAME_OVER idx 2169/2220, score 11334, t=36.15.
- (6) I222 log audit: 221 entries 1..221 sequential, 0 dupes, 0 missing (.evidence/I222/log-audit.txt); I222 appended -> 1..222.
- (7) Risks: R-E10-1 CLOSED (armored + spent screenshots, I220 + I222 same-frame A/B), R-E10-2 CLOSED (lead exact + 1.2 cap + pilot parity + frames delta ~0; view fixed during normal play by construction), R-E10-3 CLOSED (dist in budget; assetPerf pinned at 16 assets).
- (8) 600 s soak decision: NOT WARRANTED - E10 changes are render-layer only (no new per-frame allocation path beyond the pre-existing intent path, no new long-lived state; memory-growth pattern identical to pre-E10; I185 soak precedent).

### Concerns
- Low-end physical device / GPU validation untested (adaptive quality I73 mitigates; carried).
- 8 HUMAN-PENDING perception items remain the player-experience evidence gap (non-blocking).
- One 59.5 ms frame outlier in the I222c frame probe (single frame, no pattern; average still 16.93 ms = 60 fps locked).

### Verdict
**PASS - E10 CLOSED.** 3/3 stories (ST-218..220) complete with per-iteration evidence; fresh matrix/build/dist green; regression + demo pin + pilot parity + same-frame Warden A/B clean; log 1..222 sequential; risk register closed.

### Risks
- Carried: 8 HUMAN-PENDING perception items (production/bug-triage.md), low-end physical device / GPU validation.

### Changed files
- production/gates.md (this block), production/milestone-review.md (E10 CLOSED section), production/epics.md (E10 header + Result CLOSED), production/timeline.md, production/stories.md (ST-218..220 DONE + E10 CLOSED line), CHANGELOG.md (+I222), production/iterations.md (+I222), production/session-state/active.md. No src changes (closeout iteration).

### Verification evidence
- npm test 677/677 x2 in-process + node --test "tests/*.test.js" 677/677 cross-process (this iteration, .evidence/I222/); node scripts/build.mjs exit 0 (this iteration); dist 1954.9/506.2 KB (this iteration); log audit 1..222 sequential (this iteration); browser smokes ?nocache=222a/222b/222c (this iteration).

### Next owner / decision
- I223: open E11 - scope check + stories (cgs-scope-check + cgs-create-stories). Candidates: carried polish (8 HUMAN-PENDING-informed items), new content arc, or low-end device validation plan. 8 HUMAN-PENDING items parked for a human session.

## G11.0 - E11 closeout gate (I226)

### Summary
Closeout gate for the E11 Combat Juice & Low-End Validation milestone (ST-221..223) per cgs-gate-check. ST-221 (I224) closed the T4 kill-juice hole; ST-222 (I225) closed the bot-verifiable half of the carried low-end device validation; this iteration runs the E11 regression round and closes the epic. Advisory gate.

### Gate Criteria
Per epics.md (verbatim): "kill juice unit-tested + browser-verified (juiceTally deltas, A/B screenshots, pilot parity, frame delta ~0, reduced-motion gated), low-end tier matrix documented (all tiers stable, adaptive ladder fires + stabilizes, DPR cap honored), fresh tests + build + dist in budget, demo pin re-verified exact, regression round green, log audit sequential."

### Evidence
- (1) Kill juice (I224, ST-221): pure core killPunch.js + CONFIG.fx.killPunch + 12 unit tests; browser: juiceTally 8 rock kills -> kill:{punch:8} with all other channels 0, live class rungs EXACT (S 0.0655 / M 0.0982 / L 0.1474 = rung x e^-0.2 after the in-tick step; overdrive x1.5 exact, reverts off), decay settles ~0.5 s, rm A/B (tally unchanged + magnitude 0; screenshots .evidence/I224/), pilot parity 1080 ticks finite, frame delta ~0 (punch = camera offset only, no sim freeze).
- (2) Low-end tier matrix (I225, ST-222): production/perf-profile.md "## I225" - FX high/low dense worst case at the 60 Hz vsync floor (p95 16.8 ms both tiers; sporadic single-frame drops only: 1/167 high, 4/170 low, 0/451 in the 8 s follow-up with 19 live enemy bolts), bloom composer = 12-14 call premium (MENU 24 -> 10), cold first frame inside the standing one-time init range; adaptive ladder verified end-to-end (downgrade after 2 bad 2 s windows + toast + exact console line; 6 s of 120 fps holds low = hysteresis; user lock blocks re-downgrade; reset clean; F path re-applies settings before userSet); DPR cap min(dpr,2) code-verified + runtime honored (1.25 -> 1.25); rm + FX-low combo playable (2 kills under rm -> zero kill punch = I224 gate in combo); 3 scope-vs-code flags + labeled HARDWARE-pending checklist.
- (3) I226 fresh: npm test 689/689 x2 (in-process) + node --test over the tests glob 689/689 (cross-process); node scripts/build.mjs exit 0; dist 1958.4 KB raw / 507.8 KB gzip (budget <=2048/<=550, ~42 KB headroom).
- (4) I226 regression ?nocache=226b/226c (fresh loads; this session's display 60 Hz): assets 16/16 + skybox on both; state machine 10/10 (MENU->Enter->PLAYING; P->PAUSED sim-frozen (dt 0 over 2 frames); P->PLAYING; P->PAUSED; Q->MENU; Enter->PLAYING; forced death -> GAME_OVER in 1 tick; Enter -> PLAYING live restart) + replay branch (REPLAY -> death -> GAME_OVER -> Enter -> MENU); persistence intact (tutorial seen, scores, best 36426, full settings object); demo pin EXACT via REAL UI path (menu REPLAYS button -> DEMO PILOT button -> key 3 = 4x): GAME_OVER idx 2169/2220, score 11334, t=36.15, 57 kills; fresh scripted pilot 1080 ticks (113.8 ms loop) -> PLAYING dt=18.0 s / 2690 pts / 15 kills / 3 lives all finite + kill-punch tally EXACT (15 punches / 15 kills, all other channels 0 = I224 gate re-confirmed live); frame probe 301 f (30 warm-up excluded) avg 16.65 / p50 16.7 / p95 16.8 / max 17.1 ms (0 drops >17.5 ms, 0 doubles >30 ms; 60 fps locked, delta ~0 vs I222 16.93 / I225 16.75); console 0/0 (no adaptive line - the ladder never triggers at a stable 60 fps).
- (5) I226 log audit: 225 entries 1..225 sequential, 0 dupes, 0 missing (pre-append); I226 appended -> 1..226.
- (6) Risks: R-E11-1 CLOSED (juiceTally deltas exact in I224 + 15/15 re-confirmed in the I226 pilot; A/B screenshots .evidence/I224/), R-E11-2 CLOSED (core scoring untouched; pilot parity finite + comparable across I221-I226), R-E11-3 CLOSED (ladder verified headlessly with the proven load-injection pattern; headless-only observations labeled; hardware remainder HARDWARE-pending in perf-profile.md).
- (7) 600 s soak decision: NOT WARRANTED - E11 changes are a render-layer juice channel + config + one pure-core mapping (no new per-frame allocation path beyond the pre-existing punch path, no new long-lived state; memory pattern identical to pre-E11; I185 soak precedent).

### Concerns
- Physical low-end device / GPU validation (phone, dpr 2-3, thermal) remains HARDWARE-pending (labeled checklist in perf-profile.md "## I225").
- 3 scope-vs-code flags from I225 (no FX off tier; no load-reactive DPR 1.5; auto-downgrade does not update the stored settings tier - minor UX, F path correct) are E12 candidates.
- 8 HUMAN-PENDING perception items remain the player-experience evidence gap (non-blocking; need a human session).
- PROBE FIX recorded: w.lives is a getter-only property delegating to livesMgr.count; a sloppy-mode w.lives = N in page evaluate silently no-ops - forced-death staging must set w.livesMgr.count (the one early "forced death" success on ?nocache=226b was a fluke: the idle ship had already lost 2 lives in the wild, so the real count happened to be 1).

### Verdict
**PASS - E11 CLOSED.** 3/3 stories (ST-221..223) complete with per-iteration evidence (I224..I226); kill juice unit-tested + browser-verified + motion-gated; low-end tier matrix documented with the adaptive ladder firing + stabilizing and the DPR cap honored; fresh 689/689 x3 + build 0 + dist in budget; demo pin re-verified exact via the real UI path; regression round green; log 1..226 sequential.

### Risks
- Carried: 8 HUMAN-PENDING perception items (production/bug-triage.md), low-end physical device / GPU validation (HARDWARE-pending checklist), the 3 I225 scope-vs-code flags (E12 candidates).

### Changed files
- production/gates.md (this block), production/milestone-review.md (E11 CLOSED section), production/epics.md (E11 Result CLOSED), production/timeline.md (+E11 closed line), production/stories.md (ST-221..223 DONE + E11 CLOSED line), CHANGELOG.md (+I226), production/iterations.md (+I226), production/session-state/active.md. No src changes (closeout iteration).

### Verification evidence
- npm test 689/689 x2 in-process + node --test over the tests glob 689/689 cross-process (this iteration); node scripts/build.mjs exit 0 (this iteration); dist 1958.4/507.8 KB (this iteration); log audit 1..226 sequential (this iteration); browser smokes ?nocache=226b/226c (this iteration).

### Next owner / decision
- I227: open E12 - scope check + stories (cgs-scope-check + cgs-create-stories). Candidates: the 3 I225 scope-vs-code flags as small stories (FX off tier, load-reactive DPR 1.5, auto-downgrade settings-tier sync), art levers (research-backed), new content. 8 HUMAN-PENDING items parked for a human session.
## G12.0 - E12 closeout gate (I231)

### Summary
E12 (Quality Settings Consistency & Skybox Art Pass) closeout gate over 4 iterations (I228..I231, ST-224..227). Closes the 3 I225 scope-vs-code flags (FX off tier, load-reactive DPR 1.5, effective-tier settings sync) + the carried 512x256 skybox deferral (standing user art/Blender directive). One 1-line gate fix found live and closed in-gate (F-marker ordering, the R-E12-4 surface).

### Gate Criteria (epics.md)
1. FX off tier unit + browser verified (zero particle/trail leak at off, F cycle + persistence + user-lock semantics).
2. DPR + tier sync unit + browser verified (dprForTier exact; dpr-2 emulation downgrade 2.0 -> 1.5 -> restore; panel AUTO marker in/out; storage untouched).
3. Skybox A/B (MENU + in-flight, readability preserved both FX tiers) + dist in budget + frame delta ~0 + IBL probe.
4. Fresh tests + build + dist in budget.
5. Demo pin re-verified exact via the real UI.
6. Regression round green.
7. Log audit sequential.

### Evidence
- (1) ST-224/I228: F cycle exact + 3 options + reload persistence + panel sync (228a/228b); off zero-leak: scripted kills at off -> live 0 + trail 0 + bloom off (kill channel browser-verified exactly 0 over 5 scripted S-rock kills; I231a re-confirm: idle 0 / thrust 0 / kill-burst 0 / trail 0; readability floors powerup 8 / belt 4 / shield 6 / muzzle 4-8 still emit by design); user-lock: off never auto-produced (ladder fires only from high; unit test) + 231b: userLocked true holds high under 165 x noteFrame(50) (0 fps, belowStreak 165, no downgrade); I231c re-ran the F cycle live (low -> off -> high, exact toasts + storage round-trip + bloom on at high).
- (2) ST-225/I229: dprForTier 6 unit tests; 229a dpr-2 boot 2.0 -> forced downgrade 'DPR 2.00 -> 1.50 (FX low, auto-downgrade)' + both markers + storage untouched + no-revert via applySettings(stored high); 231c (post-fix): downgrade -> markers 1+1 + storage 'high' untouched -> FIRST user F clears both markers (the I231 gate fix) + autoLow false / userLocked true -> restore F 'DPR 1.50 -> 2.00 (FX high, hotkey)' + bloom on; 229b native dpr 1.25: silent no-op boot + stored-low reload no line (cap not binding, correct).
- (3) ST-226/I230: skybox v5 JPEG 73.2 KB (net +32.0 KB raw, within the <= 40 KB budget); 230a + 231a: skybox.ready on the new URL, MENU A/B vs I227 baseline (layered subordinate sky, UI pops), in-flight readable at FX high/low/off + IBL tints on rock faces; frames 787 f avg 16.67 (I230) + 312 f avg 16.65 / p95 16.9 / max 17.4 (I231, 0 drops >17.5) = delta ~0; no upload hitch; accepted art note (warm-brown magenta x gold overlap) holds.
- (4) I231 fresh: npm test 697/697 x2 in-process + node --test over the tests glob 697/697 cross-process; node scripts/build.mjs exit 0; dist 105 files, 1994.7 raw / 543.4 gzip KB (<=2048/<=550; gzip headroom 6.6 KB = WATCH).
- (5) Demo pin: EXACT via REAL UI at 231a (REPLAYS button -> DEMO PILOT button -> key 3 x4): GAME_OVER idx 2169/2220, score 11334, kills 57, t=36.15, wave 2, 'SHOTS 57/198'; structurally untouched across E12 (render/settings/asset layer only) + unit-covered in 697.
- (6) Regression 231a/231b/231c (60 Hz; dpr 1.25 native + dpr-2 emulation): state machine 10/10 (incl. forced death 1 tick + live restart + replay exit branch), persistence intact (tutorial, best 36426, 5 scores, settings object), fresh scripted pilot 1080 ticks PLAYING dt=18.1 s / 2711 pts / 16 kills all finite, console 0/0 on every tab (231c: 7 lines total, all accounted - lone 'adaptive quality' line without a DPR line = reset()-re-armed downgrade whose 1.5 target already equaled the current pixelRatio, correct no-op).
- (7) Log audit: 230 entries 1..230 sequential pre-append, 0 dupes / 0 missing; +I231 -> 1..231.
- (8) Risks: R-E12-1 CLOSED (off zero-leak browser-verified twice + CONFIG single source + unit tests), R-E12-2 CLOSED (single labeled resize; frame probes after every switch: one 67 ms hitch at 229a, 0 hitches >30 at 231b/231c restore probes), R-E12-3 CLOSED (JPEG 73.2 KB staged within the <= 40 KB net budget; dist 543.4/550 KB pinned by the skybox JPEG audit test), R-E12-4 CLOSED (marker semantics verified live: chip shows only while autoLow, cleared on the first user F - the in-gate 1-line fix made the F-hotkey path match the panel path; storage-untouched re-verified every cycle; pre-fix repro 231b + post-fix verify 231c + pause-panel screenshot .evidence/I231/03).

### Concerns
- Gzip headroom 6.6 KB (WATCH): the skybox JPEG does not re-compress under gzip; future asset stories need a size review before landing (carry-forward rule from I214).
- 8 HUMAN-PENDING perception items remain the player-experience evidence gap (non-blocking; need a human session).
- Physical low-end device / GPU validation remains HARDWARE-pending (labeled checklist in perf-profile.md '## I225').

### Verdict
**PASS - E12 CLOSED.** 4/4 stories (ST-224..227) complete with per-iteration evidence (I228..I231); all 3 I225 scope-vs-code flags closed in code + browser; skybox art pass landed within budget; one 1-line gate fix (F-marker ordering) found live, fixed, and re-verified in-gate; fresh 697/697 x3 + build 0 + dist in budget; demo pin re-verified exact via the real UI; log 1..231 sequential.

### Risks
- Carried: 8 HUMAN-PENDING perception items (production/bug-triage.md), low-end physical device / GPU validation (HARDWARE-pending checklist), gzip headroom WATCH.

### Changed files
- src/main.js (1-line reorder: F-hotkey userSet before applyFxTier), production/gates.md (this block), production/milestone-review.md (E12 CLOSED section), production/epics.md (E12 Result CLOSED + risks CLOSED), production/timeline.md (+E12 closed line), production/stories.md (ST-224..227 DONE + E12 CLOSED line), CHANGELOG.md (+I231), production/iterations.md (+I231), production/session-state/active.md.

### Verification evidence
- npm test 697/697 x2 in-process + node --test over the tests glob 697/697 cross-process (this iteration); node scripts/build.mjs exit 0 (this iteration); dist 1994.7/543.4 KB (this iteration); log audit 1..231 sequential (this iteration); browser smokes ?nocache=231a (regression + demo pin), ?nocache=231b (dpr-2 user-lock + pre-fix repro), ?nocache=231c (post-fix marker path + pause-panel screenshot .evidence/I231/03).

### Next owner / decision
- I232: open E13 (cgs-scope-check + cgs-create-stories). Candidates from carryover: new content arc, combo cap (demo-pin compatible), music quality (HP #5), hardware remainder, + any new feel/art levers. 8 HUMAN-PENDING items parked for a human session.

## G13.0 - E13 closeout gate (I236)

### Summary
E13 (Mid-Run Content Arc) closeout gate over 4 iterations (I233..I236, ST-228..231). Closes the wave 3-9 content valley: the HEAVY ROCKS modifier (the BIG counterweight to SMALL), the STINGER charger enemy (the rammer archetype), the 17th Blender asset (the STINGER dart GLB), and the skybox JPEG re-encode that restored the gzip headroom. Headline: the demo pin re-verified EXACT via the real UI.

### Gate Criteria (epics.md)
1. Modifier unit + browser (4-way roll determinism, HEAVY ROCKS live + banner, W1-2 plain + breather invariants).
2. Stinger unit + browser (full lifecycle, kill +250 + feed + juice, contact death, 6-charge fizzle, cap 2, W7+ 15 u, rm glow kept / wobble gated, FX-off no extra particles).
3. GLB loads 17/17 + fallback proven.
4. Skybox A/B readability-equivalent + dist in budget (net delta <= 0, headroom >= 8 KB).
5. Demo pin EXACT via real UI (2169/2220, 11334, 57, 36.15, wave 2).
6. Fresh tests + build + dist in budget.
7. Regression green.
8. Log audit sequential.

### Evidence
- (1) ST-228/I233: node scan of the 4-way roll determinism + the daily seed pin (new canonical 2026-11-10 seed 1312111789); browser 233a (seed 393 staged via reset+reseed+begin fast-forward): rolls 3:big 4:small 5:big 6:none 7:big 8:big 9:fast; wave 3 banner + violet HUD tag live, in-page pickSize probe n=2000 matches the config rows exactly, wave 7 re-staged banner 'WAVE 7 HEAVY ROCKS' + field 5L/5M/1S + screenshot .evidence/I233/01; W1-2 plain + breather invariants pinned by unit tests (697 -> 699: big/L mix n=400 + daily seed pin).
- (2) ST-229/I234: +11 stinger tests + 2 table pins; browser 234a/234b (seed 393, 937-tick stage to wave 7): toast in DOM, telegraph ramp exact 1.4 @ t=0.3 + wobble +/-0.14/0.1 (RM ON: offset exactly 0, glow still ramps - FX-independent), charge 7.5 exact + white core 2.9, kill +250 + STINGER +250 feed row, contact 1 life no score + invuln 1.8, wave 8 cap 2, FX matrix HIGH 120 / LOW 40 / OFF 0 (3.0x, zero-FX live), NaN 0, console 0/0; screenshots .evidence/I234/01-02. ST-230/I235 re-verified the GLB swap live (235a/235b): telegraph ramp 1.45 @ t=0.317 + GLB dart glow visible, natural charge 7.5 exact + white 2.9, kill +250 + feed row + pool hidden.
- (3) GLB: 17/17 assets load (235a/235b + 236a __vr.assetLoader.names), the pool shares the GLB geometry (32/8 tris across the pool), procedural fallback path unchanged + unit-covered (assetPerf 17-pin).
- (4) Skybox A/B: I235 A/B visually identical (q80 re-encode of the I230 stage-1024 master; the I230 staged q75/q80/q85 all landed at the identical 74915 B - Blender quality not applied; PIL q55..q85 staged, q80 = 59.4 KB gz = highest under the <=60 target); 74915 -> 60905 B; dist net -12.3 KB; headroom 1.8 -> 13.0 KB (>= 8 KB restored); dist 108 files 2002.7 raw / 537.0 gz (cap 2048/550).
- (5) Demo pin: EXACT via REAL UI at 236a (MENU -> REPLAYS button -> DEMO PILOT row -> key 3 x4): GAME_OVER after ~11.3 s wall at x4 - idx 2169/2220, score 11334, kills 57, wave 2, t=36.15 (display 0:36), 'MAX COMBO 15', 'ACCURACY 29% SHOTS 57/198', best unchanged 36426; t=36.15 = 2169/60 structurally; screenshot .evidence/I236/01-demo-pin.png.
- (6) I236 fresh: npm test 710/710 x2 in-process + node --test over the tests glob 710/710 cross-process; node scripts/build.mjs exit 0; dist 108 files / 2002.7 raw KB (headroom 45.3) / 537.0 gzip KB (headroom 13.0 KB) - matches I235 exactly.
- (7) Regression 236a/236b/236c/236d: state machine 10/10 EXACT from verified MENU (second run with a capture-phase event probe: only the 9 synthetic keydowns fired; the first run started at PLAYING from a probe-verified MENU - 67+ s instrumented idle monitoring showed zero drift + zero events and no auto-start path exists in code, attributed to one-off external input on this user-active machine; documented environmental); persistence intact (best 36426, 5 scores, settings, tutorialSeen; the forced-death 0-score did not pollute the list); FX-off zero-leak re-confirmed via the real F-key path (idle/thrust/kill-burst live 0; readability floor EXACT 8 at off; player shots emit no particles by design at any tier); user-lock holds (165 x noteFrame(0.05) @ 20 fps: tier stayed off, userLocked true, autoLow false); fresh scripted pilot 1080 ticks all finite (0 non-finite across all pools); frame probe fast windows: full 300f PLAYING probe avg 16.99 / p50 16.8 / p95 20.3 / p99 26.5 / max 31.3 (90 frames in the 17.5-20 ms VM frame-grid jitter band, 2 > 30 ms, 0 > 100 ms) + micro-probes 90f avg 16.47 / p95 18.4 / max 18.8 and 60f avg 16.34 / p50 16.7 / max 18.5 - p50 holds the 60 fps grid; '0 drops > 17.5' not reproducible this session (VM 1-fps rAF throttle + full rAF pause in occluded tabs; 2 probe calls lost to the 300 s tool cap; one 14 s deadline-guarded probe saw 0 rAF frames) - documented as an environment caveat, not a regression; the game's throttle handling (clamped-dt fixed-step clock + adaptive auto-downgrade - it fired live as 'FX AUTO-SET TO LOW (LOW FPS)' during the x4 demo - + visibility auto-pause) verified live; console 0/0 on all tabs (the lone 236a log line = the designed 'adaptive quality: FX high -> low' INFO toast during the x4 demo).
- (8) Log audit: 235 entries 1..235 sequential pre-append, 0 dupes / 0 missing; +I236 -> 1..236.
- (9) Risks: R-E13-1 CLOSED (pin re-verified EXACT via real UI at I236 + gating: modifier W3+ / stinger W7+ vs the demo wave 2 + the unit check that the demo seed never reaches W3); R-E13-2 CLOSED (telegraph 0.8 s + FX-tier-independent glow verified live incl. RM-on offset exactly 0; perception parked at HUMAN-PENDING #9); R-E13-3 CLOSED (skybox re-encode funds the GLB: net -12.3 KB, headroom 13.0 KB >= 8, dist pinned by the size audits); R-E13-4 CLOSED (pinned-roll unit tests updated intentionally + documented, determinism harness green, roll invariants pinned); R-E13-5 CLOSED (pool 4 / cap 2, no new per-frame allocations, 17/17 loads, frame-probe evidence above).

### Concerns
- Frame probe '0-over-17.5' not reproducible this session: the VM oscillates between 60 fps fast windows (~1-2 s after a tab opens) and a hard 1 fps rAF throttle (p50 ~1015 ms) and full rAF pause in occluded tabs. p50 holds the 60 fps grid at 16.3-16.8 ms across every fast-window probe; no sustained stalls / GC spikes; the throttle handling fired live as designed. Documented as an environment caveat, not a regression.
- One state-machine run started at PLAYING from an instrumented-idle MENU (67+ s zero drift, zero events; no auto-start path exists in code - startRun reachable only via Enter or the menu buttons); attributed to one-off external input on this user-active machine. Environmental, not a code defect; the verified-MENU run was 10/10 exact.
- 9 HUMAN-PENDING perception items (incl. #9 stinger telegraph/charge feel) remain the player-experience evidence gap (non-blocking; need a human session).
- Low-end physical device / GPU validation remains HARDWARE-pending (checklist in perf-profile.md '## I225').

### Verdict
**PASS - E13 CLOSED.** 4/4 stories (ST-228..231) complete with per-iteration evidence (I233..I236); the wave 3-9 content valley filled (HEAVY ROCKS modifier + STINGER charger + 17th Blender asset); the gzip headroom restored (1.8 -> 13.0 KB) with the story net-negative (-12.3 KB); fresh 710/710 x3 + build 0 + dist in budget; demo pin re-verified EXACT via the real UI; log 1..236 sequential.

### Risks
- Carried: 9 HUMAN-PENDING perception items (production/bug-triage.md, incl. #9 stinger telegraph/charge feel), low-end physical device / GPU validation (HARDWARE-pending checklist), frame-probe environment caveat (VM rAF throttle/pause; p50 evidence above).

### Changed files
- production/gates.md (this block), production/milestone-review.md (E13 CLOSED section), production/epics.md (E13 Result CLOSED + risks CLOSED), production/stories.md (E13 header + CLOSED line), production/timeline.md (+E13 closed line), CHANGELOG.md (+I236), production/iterations.md (+I236), production/session-state/active.md.

### Verification evidence
- npm test 710/710 x2 in-process + node --test over the tests glob 710/710 cross-process (this iteration); node scripts/build.mjs exit 0 (this iteration); dist 108 files / 2002.7 raw / 537.0 gzip KB (this iteration); log audit 1..236 sequential (this iteration); browser smokes ?nocache=236a (regression round + demo pin + screenshot), ?nocache=236b (pilot + micro frame probes), ?nocache=236c/236d (frame-probe environment characterization).

### Next owner / decision
- Next epic: pick up from carryover - candidates: combo cap (demo-pin compatible), music quality (HUMAN-PENDING #5), hardware remainder, evasive flyer enemy (E14 candidate), touch fallback. 9 HUMAN-PENDING items parked for a human session.

## G14.0 - E14 closeout gate (I241)

### Summary
E14 (Late-Run Mastery Arc) closeout gate over 4 iterations (I238..I241, ST-232..235). Closes the late-run mastery band: the FLYER evasive enemy (the sine-weave lead-shot skill target - the game's one pure aim verb), the combo cap wave-scaling (the T1 combo flatline fixed where mastery matters), the 18th Blender asset (the FLYER saucer GLB) and the skybox q75 re-encode. Headline: the demo pin re-verified EXACT via the real UI.

### Gate Criteria (epics.md)
1. Flyer unit + browser (weave determinism at pinned times, 2-hit +400 + feed + juice, lifetime fizzle, cap 2, W9+ 15 u, RM amp gated, FX high/low/off matrix, no contact lethality, GLB 18/18 + fallback).
2. Combo capFor unit + browser (W1-2 cap 15 exact, W3+ cap 20, multiplier table, HUD tiers, pin test tests/replay.test.js:246 passing UNMODIFIED, real-UI re-verify).
3. GLB 18/18.
4. dist headroom >= 8 KB after the story.
5. Demo pin EXACT via real UI (2169/2220, 11334, 57, 36.15, wave 2).
6. Fresh tests + build + dist in budget.
7. Regression green.
8. Log audit sequential (1..241 at close).

### Evidence
- (1) ST-232/I238: +14 flyer tests (seeds 91-103); browser smoke (seed 393, 1205-tick stage to wave 9): toast + pool 4 + determinism 54/100-tick bit-identical, weave maxOff 1.194 <= 1.32 / 7 sign changes / 3 s, cruise 2e-14, reduced-motion identity 1.62e-14, combat via the real UI path (hit1 + hitFlash, hit2 kill +400 -> +440 combo, feed #ffb3ec, particles 44-48), cap 2, RM ampScale 0.4 (1.2 -> 0.489 in ~2 s, motion kept), contact non-lethality CLEAN (lives 3->3, flyer on ship, invuln 0, zero hit events), FX matrix via real F keydowns high 132 > low 44 > off 0, NaN 0 / 240 ticks, console 0/0. 4 real bugs fixed (rim-spawn death, rescale drift, hit-event routing, missing killPunch rung).
- (2) ST-233/I239: capFor(wave, cfg) pure export + ScoreKeeper cap (W1-2 15 EXACT / W3+ 20 = 2.9x; I111 tier width cap-relative W1-2 2.8 / W3+ 3.8); +7 tests (724 -> 731); browser 401-tick stage: live cap 20, 20-kill chain mult 2.9 + tier 5 + HUD x2.9 DOM, fresh begin cap 15 at W1 AND W2, NaN 0 / 240 ticks, console 0/0. Re-verified live at I241: cap transitions W1 15 / W2 15 / W3 20 / W4..W9 20 on the same 401-tick recipe. Pin test tests/replay.test.js:246 green UNMODIFIED across the whole matrix.
- (3) ST-234/I240: assets/flyer.glb (18th asset; 4940 B raw / 1.6 KB gz; 52 tris; 2 materials; POSITION+NORMAL only, flat, Y-up) swapped through the pre-wired ST-232 hook (assetLoader ASSETS += flyer; zero main.js changes; in-code domeMats kept - hitFlash unchanged); skybox q80 -> q75 re-encode from the same I230 1024x512 master (60905 -> 50004 B); assetPerf pin 17 -> 18; pool shares the GLB geometry (hull 24 / dome 28 tris) + hitFlash through the GLB. 731/731; dist 111 files 2014.0 raw / 534.0 gzip KB.
- (4) dist headroom after the story: 16.0 KB gzip (cap 550) / 34.0 KB raw (cap 2048) >= the 8 KB floor.
- (5) Demo pin: EXACT via the REAL UI at I241 (MENU -> REPLAYS button -> DEMO PILOT row -> key 3 x4): GAME_OVER screen - SCORE 11334, KILLS 57, WAVE 2, MAX COMBO 15, TIME 0:36 (= 36.15 s = 2169/60), BEST 36426; screenshot .evidence/I241/01-demo-pin.png; the pin test (idx 2169/2220) green UNMODIFIED.
- (6) I241 fresh: npm test 731/731 x2 in-process + node --test 'tests/*.test.js' 731/731 cross-process; node scripts/build.mjs exit 0; dist 111 files / 2014.0 raw KB (headroom 34.0) / 534.0 gzip KB (headroom 16.0) - matches I240 exactly.
- (7) Regression I241: state machine 10/10 EXACT from verified MENU (capture-phase event probe: received = dispatched = 10, zero external input; ONE PROBE ARTIFACT documented - the first forced-death probe called ship.damage(1) with a scalar where a knockback vector {x,y} is expected; the scalar NaN-poisoned ship.pos, sticky through the camera damp; reload + 240-tick NaN check INCLUDING camera fields = 0 non-finite -> probe artifact, not a regression, camera code healthy; the second forced death used livesMgr.count = 1 + a real rock at ship position -> GAME_OVER in ~2 s, score 50, far below the TOP 5 floor of 25394 - no pollution); persistence intact (TOP 5 36426/29543/28045/26132/25394 + BEST 36426); FX-off zero-leak via the real F-key path (idle/thrust/kill-burst live 0; readability floor EXACT 8 at off; player shots emit no particles by design at any tier); user-lock holds (165 x noteFrame(50) @ 20 fps: tier stayed off, userLocked true); fresh 1080-tick scripted pilot all finite (0 non-finite across ship pos / time / rocks pos+radius / bullets pos+vel; wave 8 / t 18.13 s); E14-specific live: cap transitions W1-2 15 / W3+ 20 (401-tick recipe) + flyer live at wave 9 (1 of cap 2; 1204-tick stage bit-matches I238/I240) + pool shares GLB geometry (24/28 tris) + assets 18/18; frame probe - environment caveat (the VM tab's rAF was fully paused while occluded this session: 1 frame in 95 s wall in the 300-frame window, dt 203.6 ms; last measurable fast-window p50 = 16.3-16.8 ms at I236, structurally untouched by I239/I240 - no loop changes; the clamped-dt fallback + adaptive + visibility auto-pause stayed live - sim clock advanced ~0.13 s game-time / 1.5 s wall) - documented environment caveat, not a regression; console 0/0 (4 INFO lines = the designed 'adaptive quality: FX high -> low' toast from the first page load only).
- (8) Log audit: 240 top-level headers 1..240 sequential pre-append (the 8 inline '## I' references in entry bodies are not headers); +I241 -> 1..241.
- (9) Risks: R-E14-1 CLOSED (weave tuned against the bot lead-shot model at I238; HP #10 perception parked); R-E14-2 CLOSED (pin re-verified EXACT via real UI + pin test UNMODIFIED + gating: flyer W9+ / cap W3+ vs the demo's wave 2); R-E14-3 CLOSED (GLB 1.6 KB gz; skybox q75 re-encode; dist headroom 34.0/16.0 >= 8); R-E14-4 CLOSED (cap 2, 1/wave, 9-12 s lifetime, pool 4; 1204-tick staged soak clean + 1080-tick pilot 0 non-finite); R-E14-5 CLOSED (W1-2 flat onboarding band accepted; cap-relative tier math tested I239 + live-verified W1-2 2.8 / W3+ 3.8 bands).

### Concerns
- Frame probe not measurable this session: the VM tab's rAF was fully paused while occluded (1 frame in 95 s wall; the sim clock advanced ~0.13 s game-time / 1.5 s wall = the clamped-dt fallback working as designed; adaptive + visibility auto-pause verified live). Last measurable fast-window p50 = 16.3-16.8 ms at I236; I239/I240 made no loop changes (core scoring + render assets only). Documented as an environment caveat, not a regression.
- One probe artifact in the state-machine round (ship.damage() scalar -> NaN poison, sticky through the camera damp; reload + 240-tick camera-inclusive NaN check clean). Probe bug, not a code defect; the camera code is healthy.
- 10 HUMAN-PENDING perception items (incl. #10 flyer weave feel, #5 music quality) remain the player-experience evidence gap (non-blocking; need a human session).
- Low-end physical device / GPU validation remains HARDWARE-pending (checklist in perf-profile.md '## I225').

### Verdict
**PASS - E14 CLOSED.** 4/4 stories (ST-232..235) complete with per-iteration evidence (I238..I241); the late-run mastery band shipped (FLYER sine-weave lead-shot target + combo cap wave-scaling + 18th Blender asset); dist headroom grew (13.0 -> 16.0 KB gzip) with the story net-negative (-9.0 KB); fresh 731/731 x3 + build 0 + dist in budget; demo pin re-verified EXACT via the real UI; log 1..241 sequential.

### Risks
- Carried: 10 HUMAN-PENDING perception items (production/bug-triage.md, incl. #10 flyer weave feel + #5 music quality), low-end physical device / GPU validation (HARDWARE-pending checklist), frame-probe environment caveat (VM rAF pause; p50 evidence at I236).

### Changed files
- production/gates.md (this block), production/milestone-review.md (E14 CLOSED section), production/epics.md (E14 Result CLOSED + risks CLOSED), production/stories.md (E14 header + CLOSED line), production/timeline.md (+E14 closed line), CHANGELOG.md (+I241), production/iterations.md (+I241), production/session-state/active.md.

### Verification evidence
- npm test 731/731 x2 in-process + node --test 'tests/*.test.js' 731/731 cross-process (this iteration); node scripts/build.mjs exit 0 (this iteration); dist 111 files / 2014.0 raw / 534.0 gzip KB (this iteration); log audit 1..241 sequential (this iteration); browser smokes ?nocache=i241 (regression round + demo pin + screenshot) + the seeded 401/1204-tick E14-specific stages.

### Next owner / decision
- Next epic: pick up from carryover - candidates: music quality (HUMAN-PENDING #5), hardware remainder, touch fallback (own arc), art improvements (user standing suggestion - research -> task list). 10 HUMAN-PENDING items parked for a human session.
