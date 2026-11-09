# Iteration Log - Void Runner

One entry per iteration. Format:
## I<nn> - <title>
- Story: ST-xxx | Goal: ...
- Changed: files
- Verification: test result / build / browser smoke
- Result: DONE / IN PROGRESS / BLOCKED
- Risk/follow-up: ...

(Entries appended below as work proceeds.)

## I01 - Project scaffold + toolchain (ST-001)
- Goal: repo builds, serves, tests run; renderer boots.
- Changed: package.json, index.html, vite-free static toolchain (scripts/serve.mjs, scripts/build.mjs, scripts/run-tests.mjs, scripts/vendor.mjs), src/main.js (scene+camera+PolarGridHelper arena), vendor/three (import map), AGENTS.md, README.md, CHANGELOG.md, public/favicon.svg
- Notes: sandbox blocks child_process spawn -> replaced Vite/esbuild with pure-JS import-map toolchain; npm install --ignore-scripts; in-process node --test runner.
- Verification: `npm test` 1/1 pass; `npm run build` exit 0; browser http://localhost:5173 console clean (favicon 404 fixed), screenshot .evidence/i01-smoke.png shows arena.
- Result: DONE
- Follow-up: pin three version after vendor (done: 0.160.1 via vendor script).
## I02 - Seeded RNG + math utils (ST-002)
- Goal: deterministic randomness (mulberry32) + frame-rate-safe math helpers for the core simulation.
- Changed: src/core/rng.js, src/core/math.js, tests/rng.test.js, tests/math.test.js
- Verification: npm test 18/18 pass; determinism + range + reset assertions green.
- Result: DONE
- Follow-up: all core randomness must go through RNG instances (no Math.random in src/core).

## I03 - Central CONFIG table (ST-003)
- Goal: single tunable source (arena, ship, weapon, asteroid, wave, combo, powerup, fx, storage) per architecture rules.
- Changed: src/core/config.js, tests/config.test.js
- Verification: npm test 18/18 pass incl. schema sanity, positive-finite checks, L->M->S radius chain, wave ramp vs GDD.
- Result: DONE
- Follow-up: keep in sync with design/gdd.md; any balance change needs a doc note.
## I04 - Starfield + scene polish (ST-004)
- Goal: replace placeholder scene rotation with a procedural two-shell starfield, scene fog, improved lighting; deterministic (RNG seed).
- Changed: src/render/starfield.js (new), src/main.js (fog, hemisphere light, starfield, removed scene spin)
- Verification: npm test 18/18 pass; build exit 0; browser http://localhost:5173 console clean, screenshot .evidence/i04-starfield.png shows two-shell glowing starfield around polar arena.
- Result: DONE
- Follow-up: camera is static until I06 (ship + follow cam).
## I05 - Ship core simulation (ST-005)
- Goal: inertial ship: accel + exponential drag, maxSpeed cap, soft arena clamp, damped aim easing (seam-safe), invulnerability + knockback.
- Changed: src/core/ship.js (new), tests/ship.test.js (new, 7 tests)
- Verification: npm test 25/25 pass; build exit 0.
- Result: DONE
- Follow-up: I06 renders ship + mouse aim + camera follow.
## I06 - Ship mesh + mouse aim + follow camera (ST-006)
- Goal: procedural low-poly ship rendered from core state; raycast mouse aim to arena plane; smooth follow camera with look-ahead.
- Changed: src/render/shipMesh.js (new), src/render/input.js (new: WASD/arrows + Space/mouse fire + pointer NDC), src/main.js (ship wiring, raycast aim, follow cam, window.__vr debug handle)
- Verification: npm test 25/25; build exit 0; browser: console clean, D-key hold moved ship 0 -> 4.74u (speed 10.9), mouse left -> aim -2.94 rad (tracks), screenshot .evidence/i06-ship.png.
- Result: DONE
- Follow-up: firing wired next (I07 weapons core, I08 bullet render + fire input).
## I07 - Weapons core: bullets (ST-007)
- Goal: bullet pool (cap 64), fire cadence with rateMul, spread bursts, life culling, hit marking.
- Changed: src/core/weapons.js (new), tests/weapons.test.js (new, 8 tests)
- Verification: npm test 33/33 pass; build exit 0.
- Result: DONE
- Follow-up: I08 renders bullets + wires Space/click firing.
## I08 - Bullet render pool + fire wiring (ST-008)
- Goal: render bullets from weapons core via pooled shared-geo meshes; Space/click fires toward aim.
- Changed: src/render/bulletPool.js (new), src/main.js (weapons + pool wiring, firing input)
- Verification: npm test 33/33; build exit 0; browser: console clean, Space hold -> 5 live bullets (5.5 rps), cull to 0 after life, screenshot .evidence/i08-fire.png shows bullet trail.
- Result: DONE
- Follow-up: I09 asteroid field core.
## I09 - Asteroid field core (ST-009)
- Goal: rim-spawn asteroids, drift + rim bounce, L->2-3 M / M->2-3 S splits with speedMult inheritance, concurrent cap 24, seeded determinism.
- Changed: src/core/asteroids.js (new), tests/asteroids.test.js (new, 7 tests)
- Verification: npm test 40/40 pass; build exit 0.
- Result: DONE
- Follow-up: I10 renders rocks (3 noise-baked icosahedron variants + tumble).
## I10 - Asteroid rendering (ST-010)
- Goal: render rocks from field core: 3 noise-baked icosahedron variants per size (seeded), pooled meshes, per-rock tumble.
- Changed: src/render/asteroidRenderer.js (new), src/main.js (field + renderer wiring, 4 demo rocks)
- Verification: npm test 40/40; build exit 0; browser: console clean, field.count=4, screenshot .evidence/i10-asteroids.png shows L/M rocks with distinct silhouettes.
- Result: DONE
- Follow-up: demo rocks replaced by wave logic in I14; collisions land in I11/I12.
## I11 - Collision core (ST-011)
- Goal: circle vs circle (touch = hit), bullet->rock first-hit, ship->rock first-hit with knock direction.
- Changed: src/core/collision.js (new), tests/collision.test.js (new, 6 tests)
- Verification: npm test 46/46 pass; build exit 0.
- Result: DONE
- Follow-up: I12 wires collisions into a World orchestrator.
## I12 - World orchestrator + full collision loop (ST-012)
- Goal: single World core owning ship/weapons/field; per-frame intent->step->events; bullet kills (score+fragments), ship hits (life+knockback+invuln), game over, reset.
- Changed: src/core/game.js (new World), tests/game.test.js (new, 7 tests), src/main.js (rewired around World; fixed-timestep 60Hz sim w/ substeps + backlog drop; advance() test hook)
- Notes: headless browser throttles rAF to ~0.66fps -> added fixed-timestep substeps (sim tracks wall time) + deterministic advance() hook for smoke/harness; render layer stays a pure sync.
- Verification: npm test 53/53; build exit 0; browser: console clean, deterministic smoke via advance(): kill->score 175 + 3 kills + fragments, hit->lives 2 + invuln, gameover->event, reset->clean; screenshot .evidence/i12-fullloop.png.
- Result: DONE
- Follow-up: score/combo (I13), waves (I14), lives/state machine (I15), HUD (I16).
## I13 - Score + combo (ST-013)
- Goal: combo chain (window 3.5s, cap 10, +0.1x per step), reset on timeout/damage, maxCombo tracking; World emits combo-aware kill events.
- Changed: src/core/score.js (new), tests/score.test.js (new, 7 tests), src/core/game.js (ScoreKeeper wired), tests/game.test.js (multi-kill combo math)
- Verification: npm test 60/60 pass; build exit 0.
- Result: DONE
- Follow-up: combo meter in HUD (I16); waves next (I14).
## I14 - Wave director (ST-014)
- Goal: escalating waves (count = base+growth*n, speedMult 1+0.06n capped 1.9, concurrency 6+2n capped 24), 2.2s intermission, trickle spawn, wave-clear detection, size mix (no S before wave 3), seeded determinism.
- Changed: src/core/waves.js (new), tests/waves.test.js (new, 7 tests), src/core/game.js (WaveDirector wired, wave/waveCleared events, start()/reset), src/main.js (demo rocks removed; world.start())
- Verification: npm test 67/67 pass; build exit 0.
- Result: DONE
- Follow-up: waves banner (I29); state machine I15; HUD I16.
## I15 - Lives + game state machine (ST-015)
- Goal: lives manager (no negatives, reset) and explicit state machine (MENU/PLAYING/PAUSED/GAME_OVER) with legal-transition table; World only steps in PLAYING; begin() starts a session.
- Changed: src/core/lives.js (new), src/core/state.js (new), tests/lives.test.js + tests/state.test.js (new, 8 tests), src/core/game.js (Lives/GameState wired, begin()/gameOver/lives accessors), tests/game.test.js (begin() in world tests), src/main.js (world.begin())
- Verification: npm test 75/75 pass; build exit 0.
- Result: DONE
- Follow-up: HUD reads state/score/lives/combo/wave (I16); menu/pause screens I17.
## I16 - DOM HUD (ST-016)
- Goal: change-cached DOM overlay showing score (TL), wave (TC), lives (TR), combo meter (BC); text only written on change.
- Changed: src/render/hud.js (new), src/main.js (hud.render(world) in syncVisuals)
- Verification: npm test 75/75 pass; build exit 0; browser: console 0 errors, scripted kill burst -> "490 WAVE 1, 3 hearts, 5 CHAIN 1.4x", screenshot .evidence/i16-hud.png.
- Result: DONE
- Follow-up: menu/pause/game-over screens + key handling (I17).
## I17 - Menu / pause / game-over screens + session keys (ST-017)
- Goal: DOM screens for MENU (title, controls, press-enter), PAUSED (P/Esc + mute state), GAME_OVER (score + restart); Enter start/restart, P/Esc pause, M mute (flag only; audio lands I27); world no longer auto-starts on load; HUD hidden outside PLAYING/PAUSED.
- Changed: src/render/screens.js (new), src/core/game.js (pause/resume/restart on World; resume gated to PAUSED only), src/render/hud.js (setVisible), src/main.js (screens + key handling + mute flag; removed auto begin()), tests/game.test.js (4 new)
- Verification: npm test 79/79 pass; build exit 0; browser full-session smoke: menu -> Enter -> play 3s (score 50) -> P pause (time frozen, overlay) -> M mute (overlay shows ON) -> Escape resume -> forced gameover (screen + event) -> Enter restart (score 0, lives 3, wave 1); console 0 errors; screenshots .evidence/i17-menu.png, .evidence/i17-gameover.png.
- Bugfix (found by new tests): World.reset() assigned to the gameOver getter (TypeError in strict mode) - removed; getter derives from game state after reset.
- Result: DONE
- Follow-up: persistent best score + settings storage (I18).
## I18 - Persistent storage: best score + settings (ST-018)
- Goal: injectable-store persistence (core never touches window.localStorage directly), guarded get/set for best + settings, versioned payloads, NEW BEST flag on game over; HUD best line + menu/game-over BEST shown; survives reload.
- Changed: src/core/storage.js (new), tests/storage.test.js (new, 7 tests), src/main.js (lsStore adapter, bestScore/newBest, gameover hook, storage in __vr), src/render/hud.js (render(world,{best})), src/render/screens.js (BEST + NEW BEST lines)
- Verification: npm test 86/86 pass; build exit 0; browser: clean-slate game to 570 -> GAME OVER "SCORE 570 / BEST 570 / NEW BEST!", raw localStorage {version:1,value:570}; reload -> menu "BEST 570", in-play HUD "BEST 570"; console 0 errors; screenshot .evidence/i18-best.png.
- Result: DONE
- Follow-up: power-ups core + rendering (I19+).

## I19 - Power-up field core (ST-019)
- Goal: drops at kill positions (22% per kill, max 1 active), drift + arena bounce, magnet attraction, pickup radius, timed effects with refresh-not-stacking (rapid 8s / spread 8s / shield 12s+1hit / magnet 6s), instant BOMB queued for World; World emits powerupDrop/powerup/instant and clears on reset.
- Changed: src/core/powerups.js (new), tests/powerups.test.js (new, 8 tests), src/core/game.js (PowerUpField wired: maybeDrop on kill, step + pickup events, reset clear)
- Verification: npm test 94/94 pass; build exit 0; browser (no render changes): chaos loop over 50 kills -> powerupDrop 9, powerup 9, instant 2 (bombs queued); console 0 errors.
- Result: DONE
- Follow-up: power-up render meshes (I20), then RAPID/SPREAD gameplay wiring (I21).
