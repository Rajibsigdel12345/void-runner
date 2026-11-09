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
## I20 - Power-up render meshes (ST-020)
- Goal: pooled, zero-alloc rendering for drops; distinct silhouette + emissive color per type (rapid=octahedron/yellow, spread=cone/orange, shield=torus/cyan, bomb=cube/red, magnet=sphere/green); hover bob + spin + pulse.
- Changed: src/render/powerupMesh.js (new, pool 4, shared geo/mats), src/main.js (powerupRenders.sync in syncVisuals)
- Verification: npm test 94/94 pass; build exit 0; browser: forced 4 drops -> all render with correct shape/color, pool caps at 4, console 0 errors, screenshot .evidence/i20-powerups.png.
- Result: DONE
- Follow-up: wire RAPID (rateMul) + SPREAD (fireSpread) into the World fire path (I21).

## I21 - RAPID + SPREAD fire path (ST-021)
- Goal: power-ups modify firing for real — RAPID doubles fire cadence for 8s, SPREAD fires a 3-way burst (arc 0.35 rad); effects stack (spread fan at 2x cadence).
- Changed: src/core/config.js (powerup.types.rapid.rate=2), src/core/game.js (World.fireWeapon(): rateMul from RAPID, fireSpread when SPREAD active, fire event per shot), tests/game.test.js (+3 tests: baseline 11 vs rapid 6-step shot cycle, spread 3-way arc, rapid+spread stack), production/balance-notes.md (new: rapid rate rationale + realized-ratio note)
- Verification: npm test 97/97 pass; build exit 0; browser (fresh session): baseline 11 shots/2s (5.5/s), RAPID 20 shots/2s (10/s, realized 1.82x on discrete timestep), 3-way spread fan measured -0.553/-0.203/+0.147 rad = ±0.35 about eased aim; console 0 errors; screenshot .evidence/i21-firepath.png.
- Housekeeping: removed duplicate I19 line from CHANGELOG.
- Result: DONE
- Follow-up: SHIELD — absorb first hit (consumeShieldHit in resolveShipRocks) + shield ring visual (I22).

## I22 - SHIELD absorption + ring visual (ST-022)
- Goal: SHIELD (cyan) absorbs 1 hit per GDD ("12s or until hit") — no life lost, no knockback, combo unbroken; visible cyan ring around ship while active, expanding pop flash when it absorbs.
- Changed: src/core/game.js (resolveShipRocks: shield branch before life damage, emits shieldPop), src/render/shieldRing.js (new: torus ring, steady-state glow + 0.3s expand/fade pop pulse that outlives the shield), src/main.js (drain hook shieldRing.pulse + sync), tests/game.test.js (+4 tests: absorb, one-hit second rock, expiry, invuln does not consume). Self-review fix: first ring draft hid itself on the sync after the absorbing hit, so the pop could never render — restructured so the pop animation owns visibility for POP_TIME.
- Verification: npm test 101/101 pass; build exit 0; browser: shield applied -> rock on ship -> lives 3->3, shieldPop=1, shieldHits 0; steady-state ring screenshot .evidence/i22-shield.png (cyan torus around ship); console 0 errors. Pop-flash frame not capturable headless (0.66fps rAF + 0.25s dt clamp skips the 0.3s window) — logic verified by code + steady-state render.
- Result: DONE
- Follow-up: BOMB shatter-all + MAGNET bullet homing (I23); HUD effect indicators deferred to I44 UI/UX pass.

## I23 - BOMB shatter-all + MAGNET bullet homing (ST-023)
- Goal: complete the power-up set gameplay-wise. BOMB shatters all on-screen asteroids, each counting as a kill that feeds the combo (GDD). MAGNET adds slight bullet homing for 6s (GDD) on top of its existing drop-attraction.
- Changed: src/core/config.js (weapon.homing {turn:3, range:8}), src/core/asteroids.js (shatter(): no-fragment bomb kill), src/core/weapons.js (step(dt, homing, rocks): gentle turn-rate steering toward nearest rock in range, speed preserved, zero-alloc), src/core/game.js (weapons.step gets homing args; takeInstant resolves BOMB via bombBlast(); emits bomb {count} + per-rock kill), tests/game.test.js (+4: bomb combo-chain score, inert bomb, homing hit, no-homing control miss).
- Verification: npm test 105/105 pass (1 homing test re-scoped to an S rock after M split its kill into S fragments - field never emptied); build exit 0; browser: bomb on 8 rocks -> 0 left, 8 kills, 1 bomb event, score +732; magnet homing steered an off-axis bullet onto a parked S rock in 14 steps; console 0 errors.
- Result: DONE
- Follow-up: juice pass begins (I24) - particle bursts on kill/hit from the kill/hit events these paths emit.
## I24 - pooled particle bursts on kill/hit/shield-pop/bomb (ST-024)
- Goal: first juice pass - pooled particle bursts on kill/hit/shieldPop/bomb events, honoring the saved FX tier (high=48 / low=16 per burst) and reduced-motion (no particles when set). Settings panel lands I26; values read at boot.
- Changed: src/render/particles.js (NEW: single THREE.Points, 512-slot ring buffer, additive blending, zero per-frame allocation; burst() writes positions/velocities/base-colors, sync(dt) is the only writer of the rendered color attribute - fading by color scale since additive); src/main.js (fxCount + motionOff from saved settings, drain hooks for kill 0xffd27a / hit 0xff6b57 / shieldPop 0x53d8ff / bomb 0xfff3b0 double-count at origin, particles.sync in syncVisuals, __vr gains particles/renderer/render debug hooks for deterministic stills).
- Verification: npm test 105/105 pass (render-layer feature; core unchanged); build exit 0; browser: kill-burst buffer probe showed 48 live particles at the killed rock (3,0) with warm amber colors, blending=2 (additive), renderer.info.render.points=1312 proving the points pass renders; i24-particles.png used a deliberate size-3.0/6s white 80-particle test burst to make the render pass visible in a still - production bursts are size 0.32 / 0.5s per-event colors, subtle by design in stills. Console 0 errors.
- Result: DONE
- Follow-up: I25 screen shake + hit flash + invuln blink (designated browser smoke checkpoint).
## I25 - screen shake + hit flash + invuln blink (ST-025)
- Goal: complete the juice pass - camera screen shake on hit/bomb, red full-screen hit flash, and ship invulnerability blink; all gated by reduced-motion.
- Changed: src/core/fx.js (NEW: createShake envelope - max-stacking energy 0..1, exponential decay with 0.002 settle, seeded-RNG jitter offset bounded by amplitude, pure/DOM-free/three-free, master scale via trigger + setMaster), src/core/config.js (fx.shakeDecay 6, fx.shakeAmplitude 0.5, fx.shakeHit 0.5, fx.shakeBomb 1.0), src/main.js (shake envelope + per-sim-step decay, camera offset applied after follow-camera, #flash DOM overlay with 0.5/0.35 alpha kick on hit/bomb decaying 2.2/s, simT clock, shipMesh.sync(ship, simT, !motionOff), __vr += shipGroup), src/render/shipMesh.js (sync(ship, t, blinkEnabled): ~6 Hz visible toggle while invulnerable, disabled under reduced motion), index.html (#flash overlay div + CSS), tests/fx.test.js (NEW: +5 envelope tests).
- Verification: npm test 110/110 pass; build exit 0; browser (smoke checkpoint): first pass caught a real bug (shakeOff const reassignment -> TypeError in syncVisuals, 84 console errors) - fixed by calling offset() in place; reload: Enter -> PLAYING, parked S rock -> lives 3->2, hit=1, flash opacity 0.4633 (= 0.5 - (1/60)*2.2 exactly) then 0.2433 after 0.6s sim, invuln 1.6->1.5, blink samples false/true/false/true/false (toggles at 12 Hz), .evidence/i25-hitflash.png shows the red overlay (opacity forced 0.45 via temporary stylesheet probe because headless rAF decays the inline opacity between tool calls), console 0 errors.
- Result: DONE
- Follow-up: I26 settings panel (volume/sfx/fx-tier/reduced-motion persisted via storage; values currently read at boot).

