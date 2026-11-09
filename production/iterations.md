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
## I26 - settings panel (volume / sfx / fx tier / reduced motion) (ST-026)
- Goal: expose the four saved settings as an on-screen panel (menu + pause) that persists via Storage and re-derives runtime fx values live.
- Changed: src/render/settingsPanel.js (NEW: volume range 0..1 step .05, sfx checkbox, fx-quality select high/low, reduced-motion checkbox; each control emits storage.setSettings(partial) then onChange(merged); sync() re-reads storage so the two mounted instances stay consistent), src/render/screens.js (createScreens(root, settings) mounts settings.menu into the menu panel and settings.pause into the pause panel; showPanel() calls the active instance's sync() on show), src/main.js (fxCount/motionOff are now let, applySettings(s) derives them + caches liveSettings for I27 audio, panels created and wired, __vr += applySettings/liveSettings), tests/storage.test.js (+1: invalid values rejected, numerics clamped).
- Verification: npm test 111/111 pass; build exit 0; browser: menu panel present (VOLUME/SFX/FX QUALITY/REDUCED MOTION rows) screenshot .evidence/i26-settings-menu.png; toggling FX->low persisted {fx:'low'} to localStorage and liveSettings().fx flipped to 'low'; reducedMotion->true + volume->0.2 both persisted (full payload verified); reset to defaults restored; pause panel exists (8 control children) and shows flex after a tick; console 0 errors. Self-review caught a TDZ bug (panels referenced storage before its const init) - moved panel/screens creation below the storage block.
- Result: DONE
- Follow-up: I27 audio synth (WebAudio, init on first gesture, consumes liveSettings.volume/sfx + the existing muted flag).
## I27 - WebAudio synth SFX (ST-027)
- Goal: asset-free sound: every gameplay event gets a short synthesized cue (oscillator + noise envelopes), initialized on first user gesture per autoplay policy, honoring saved volume/sfx + the M-key mute.
- Changed: src/render/audio.js (NEW: createAudio() - 8 cues {shoot, kill, hit, powerup, shieldPop, bomb, wave, gameover} as type/freq-sweep/dur/gain specs with per-cue noise tails; shared 0.5s white-noise buffer; master gain with setTargetAtTime smoothing; per-cue rate limiting via ctx.currentTime to avoid overlap at RAPID fire; played{} probe counters; all calls safe no-ops before init), src/main.js (SFX_CUES event->cue map in the drain loop, gesture listeners pointerdown/keydown {once} -> markAudioReady -> audio.init + setMuted(muted), M key forwards to audio.setMuted, applySettings forwards volume/sfx once audio exists, __vr += audio/markAudioReady).
- Verification: npm test 111/111 pass (browser-layer feature; core unchanged); build exit 0; browser: state 'uninitialized' pre-gesture -> 'running' after markAudioReady; gameplay events scheduled cues (fire->shoot, kill->kill, hit->hit, gameover->gameover observed via played counters across forced kills/hits/game-overs); all 8 cue specs played directly with zero exceptions; setVolume(0.3)/setMuted(true/false) round-trip; console 0 errors. Self-review caught + fixed a TDZ ordering bug (boot applySettings referenced audio before its const) by moving the audio block above applySettings.
- Result: DONE
- Follow-up: I28 "WAVE n" banner + intermission display.
## I28 - WAVE n banner + intermission countdown (ST-028)
- Goal: readable wave pacing - a big "WAVE n" banner when a wave starts, a "WAVE n CLEARED" line, and a live "NEXT WAVE IN x.x" countdown during the 2.2s intermission.
- Changed: src/render/waveBanner.js (NEW: single fixed DOM overlay, z-index 10; showWave(n)/showCleared(n) start a timed fade envelope (0.25s in, 0.6s out) driven by sync(waves, dt, motionOff) - reduced-motion uses hard on/off instead of fades; idle branch renders the intermission countdown from the WaveDirector state and hides on state change; big line hidden (fontSize 0) when only the sub line is shown), src/main.js (banner created, drain hooks wave->showWave / waveCleared->showCleared, syncVisuals calls banner.sync(world.waves, dt, motionOff), __vr += banner).
- Verification: npm test 111/111 pass (render-layer; core unchanged); build exit 0; browser: at game start intermission showed "NEXT WAVE IN 2.1" at opacity 0.6 with the big line empty; after the 2.2s intermission the wave advanced to 1 and the big line read "WAVE 1" with opacity ramping from 0.067; manual showWave(3)+sync(0.4) held opacity 1 / "WAVE 3"; .evidence/i28-wave-banner.png captured the stable intermission countdown; console 0 errors.
- Result: DONE
- Follow-up: I29 audio polish (stingers / layering) or I30 floating score popups per the E1 plan.
## I29 - audio polish: compressor, stereo pan, pitch jitter, stingers (ST-029)
- Goal: make the synth layer feel less flat and survive stacked cues: a master compressor, world-x stereo pan, per-play pitch jitter, and real multi-note stingers for wave-clear and game-over.
- Changed: src/render/audio.js (master chain now gain -> DynamicsCompressor[-18/20/6/0.003/0.25] -> destination; every play routes through a per-cue StereoPanner with pan = clamp(x/26,-1..1)*0.8; scheduleNote adds +-3% pitch jitter so repeated cues never sound looped; CUES gains note arrays - cleared = rising 523/659/784 sine arp, gameover = falling 440/330/196 saw motif with noise tail; sfx(name, pos) takes an optional position, lastPan() probe added), src/main.js (SFX_CUES maps waveCleared->cleared, drain passes e.data.pos when present).
- Verification: npm test 111/111 pass (browser-layer; core unchanged); build exit 0; browser: all 9 cues (incl. both stingers) scheduled with zero exceptions; pan probes with real waits -> left -0.615, center 0, clamped +0.8 (matches clamp(x/26)*0.8); full chain live: shatter field -> waveCleared +1, cleared cue +1, banner "WAVE 1 CLEARED", state -> intermission; console 0 errors. Self-review caught + fixed a swapped gain/time arg in the stinger scheduling loop.
- Result: DONE
- Follow-up: I30 floating score popups (+combo) at kill position.

## I30 - floating score popups on kill (ST-030)
- Goal: per-kill score feedback - a "+N" popup floating up at the kill position; combo-multiplier kills (x2+) show large in gold; reduced motion shows a fade in place instead of a float.
- Changed: src/render/scorePopups.js (NEW: pool of 12 fixed DOM divs; add(x,y,text,{big}) starts a 0.9s popup and recycles the oldest when the pool is exhausted; sync(dt, motionOff) ages each active popup, reprojects world (x, 0.5, y) through the live camera every frame (explicit updateMatrixWorld + matrixWorldInverse so it tracks the follow-camera and shake), hides when behind the camera (z>1), floats up 40px over the life (skipped under reduced motion) and fades over the last 45%; clear() empties the pool), src/main.js (popups created with body + camera, drain loop kill event -> popups.add(pos, '+points', big = multiplier >= 2), syncVisuals calls popups.sync after follow-camera + shake, Enter start/restart clears stale popups, __vr += popups).
- Verification: npm test 111/111 pass (render layer; core unchanged); build exit 0; browser: Enter -> PLAYING; a real bullet kill (killTally 1) produced a "+50" popup at the projected screen position (15px #cfe4ff, mult 1); manual add with big flag rendered 22px gold; .evidence/i30-score-popups.png captured both styles (opacity pinned via stylesheet probe for the still); console 0 errors.
- Result: DONE
- Follow-up: I31 game-over stats (kills, max combo, time survived, wave - story table ST-031 row).
## I31 - game-over stats: kills, max combo, time survived, wave (ST-031)
- Goal: the game-over screen shows the full session summary - kills, max combo, time survived (m:ss), and the wave reached - so a run is readable at a glance (story table ST-031 row).
- Changed: src/core/score.js (ScoreKeeper gains a kills counter: incremented in kill(), cleared in reset(); maxCombo already existed), src/render/screens.js (game-over panel gains two stats rows reading world.scoreKeeper.kills / maxCombo / world.time / world.wave directly; wave shown as max(1, wave) so a death during the opening intermission reports WAVE 1, the wave being attempted; time formatted m:ss from the sim clock, which freezes on pause and at game over so it is accurate survival time).
- Verification: npm test 115/115 pass (4 new: kills counted; reset clears kills+maxCombo; world kills tracked across 3 bullet kills; world time freezes after game over); build exit 0; browser: 3-kill session -> game over showed "KILLS 3 WAVE 1" and "MAX COMBO x3 TIME 0:00"; a death before wave 1 started correctly shows WAVE 1 (not 0); restart (Enter) resets kills/maxCombo/time to 0; .evidence/i31-gameover-stats.png captured the full stats block; console 0 errors.
- Result: DONE
- Follow-up: I32 tutorial hints (first wave only; controls line fades after ~6s - story table ST-032 row).
## I32 - tutorial hints on session start (ST-032)
- Goal: new players see the controls once per session - a bottom-center hint line (WASD/arrows move, mouse aim, hold LMB fire, P pause) shown at start and faded away after ~6s, so it overlaps the opening intermission + first wave only (story table ST-032 row).
- Changed: src/render/tutorialHint.js (NEW: single fixed DOM overlay, z-index 9, 6s lifetime with 2s fade-out tail, reduced motion uses hard on/off; show()/hide()/sync(dt, motionOff)), src/main.js (hint created, Enter start/restart shows it alongside the popup clear, syncVisuals calls hint.sync after popups, __vr += hint).
- Verification: npm test 115/115 pass (render layer; core unchanged); build exit 0; browser: hint text verified ("WASD / ARROWS MOVE . MOUSE AIM . HOLD LMB FIRE . P PAUSE"); opacity 1 at start, ~0.49 at t=5s (fade tail), 0 at t=7s; reduced-motion path holds 1 until the lifetime end (hard off); .evidence/i32-tutorial-hint.png captured the live hint in-wave-1; console 0 errors.
- Result: DONE
- Follow-up: I33 touch + responsive HUD (story table ST-033 row).
## I33 - touch controls (ST-033)
- Goal: playable on touch devices with the story scheme - drag = thrust, tap = fire toward tap, two-finger tap = pause.
- Changed: src/render/input.js (rewritten around pointer events: touch Map tracks active fingers; a single finger drag > 24px sets state.thrust to the normalized drag direction (screen right/down = sim +x/+y) and touches fire; aim follows the finger via NDC; releasing the last finger starts a 0.22s fire tail so a short tap still launches at least one bullet (fire interval ~0.18s); second finger down fires a cooldown-gated (0.45s) onPause callback; tick(dt) decays fire tail + cooldown; keyboard/mouse behavior unchanged; pointercancel/blur clear all touches), src/main.js (createInput({ onPause: togglePause }) with togglePause extracted from the P/Esc handler; resolveAimPoint aims along the drag 10 units ahead of the ship while touchDrag is active (fire forward, not behind the finger); tick() calls input.tick(dt) when running on live input; __vr unchanged - input already exposed).
- Verification: npm test 115/115 pass (render layer; core unchanged); build exit 0; browser with synthetic pointerType:"touch" PointerEvents: drag 200px/-100px -> thrust (0.894, -0.447) == touchDrag, shipDelta (7.28, -3.64) moves 2:1 along the drag; tap release -> firing stays true (fire tail) and >=1 bullet launched (eventTally.fire delta >= 1), firing false after tail decay; two-finger down -> PAUSED, second two-finger (post-cooldown) -> PLAYING; keyboard pause path still uses the same togglePause; console 0 errors. Note: touch UI is input-only (no on-screen controls) per the story; desktop behavior unaffected.
- Result: DONE
- Follow-up: I34 balance pass 1 (ST-034: review numbers vs GDD, adjust fire/asteroid/drop pacing, document rationale in balance-notes).
## I34 - balance pass 1 + spawn safety (ST-034)
- Goal: first balance pass vs GDD - fix the unfair rim-spawn case and tune the two pacing levers with documented rationale.
- Changed: src/core/config.js (combo.window 3.5 -> 4.0; powerup.dropChance 0.22 -> 0.25; NEW wave.spawnMinPlayerDist = 8), src/core/asteroids.js (spawn(size, speedMult, at, noNear) - rim spawns re-roll their angle up to 6x while closer than noNear.min to the player; falls back to the first placement so the concurrent cap keeps priority; explicit-at spawns (splits) untouched; RNG consumption unchanged when noNear is null), src/core/waves.js (step(dt, playerPos) threads a noNear {x, y, min: wave.spawnMinPlayerDist} into field.spawn), src/core/game.js (waves.step receives this.ship.pos), design/gdd.md (authority updated: combo decays after 4s x2, drop chance 25%), production/balance-notes.md (I34 rationale + documented plateaus: concurrent cap 24 from wave 9, speed 1.9 from wave 13), tests/asteroids.test.js (new deterministic test, RNG seed 35: 10 L spawns with a player at the +x rim all land >= 8 units out).
- Verification: npm test 116/116 pass (+1 new); build exit 0; browser smoke: ship parked at (24,0) hugging the rim, forced wave 1 with 12 queued - 8 spawned (wave-1 concurrent limit 6+2*1=8, 4 queued correctly) and min rock-ship distance 10.5 >= 8 after 2s of drift; console 0 errors; screenshot .evidence/i34-spawn-safety.png.
- Result: DONE
- Follow-up: I35 bloom / post-FX (ST-035).
## I35 - bloom post-fx, High quality (ST-035)
- Goal: deliver the GDD-pledged bloom ("FX quality High/Low - Low disables bloom + reduces particles", GDD line 74) - bright game elements glow on High, Low falls back to the direct render path.
- Changed: src/core/config.js (NEW fx.bloom { strength 0.6, radius 0.35, threshold 0.72 }), src/render/bloom.js (NEW module: EffectComposer + RenderPass + UnrealBloomPass + OutputPass; setEnabled toggle; resize() syncs pixel ratio + size; render() uses composer when enabled, else renderer.render), src/main.js (createBloom after camera; applySettings wires bloom.setEnabled(fx === high) - so the existing settings panel + storage persist the choice; resize handler calls bloom.resize; frame() renders via bloom.render(); __vr exposes bloom). No new downloads - the full three.js addons tree (r160) was already vendored at vendor/jsm including postprocessing.
- Verification: npm test 117/117 pass (+1 config bloom sanity test: strength/radius positive finite, threshold in [0,1]); build exit 0; browser: default High -> bloom.enabled true; applySettings fx low -> false, high -> true (settings toggle path proven); gameplay frame with 8 rocks + live bullets rendered through composer, screenshot .evidence/i35-bloom-high.png shows halos on the ship glow and stars; bloom off frame .evidence/i35-bloom-off.png is sharp/dark for comparison; console 0 errors across play -> hit -> game over with the composer active.
- Result: DONE
- Follow-up: I36 perf pass + ?fps=1 meter (ST-036) - measure the bloom cost now that the composer is in the loop.
## I36 - perf pass + ?fps=1 meter (ST-036)
- Goal: measure the post-bloom frame cost with a built-in meter, and remove the per-frame waste found in the hot paths.
- Changed: src/render/fpsMeter.js (NEW: opt-in div meter, 0.5s averaging window, change-cached text; ?fps=1 shows fps + ms, ?fps=2 adds draw calls + triangles), src/render/particles.js (live-particle counter: sync() early-returns with zero GPU attribute uploads when no particle is alive - the menu/wave-break case; burst() increments on parked-slot overwrite, death decrements; exposes get live()), src/main.js (meter wired: created only when the ?fps param is present, sync called at end of syncVisuals, exposed on __vr; renderer.info.autoReset = false + manual info.reset() between the stats read and the render so composer multi-pass frames accumulate one true per-frame count instead of per-pass; hud.render/screens.update now reuse hoisted opts objects instead of allocating two per frame).
- Verification: npm test 117/117 (core unchanged; render layer); build exit 0; browser ?fps=2: menu 60fps/16.6ms; wave 4 with 20 rocks + firing + bloom: 56-60fps, 16.7-17.8ms, 40 calls, 1638 tris (scene ~20 meshes + ~20 bloom-pass quads - the composer cost is now visible and is the standing reason for the later adaptive-quality iteration); particles live counter 0 -> 40 (burst) -> 0 (decay) proving the dirty-flag path; screenshots .evidence/i36-fps-meter-load.png + load2.png; console 0 errors. Bug caught during this iteration: with default info.autoReset the meter only saw the last composer pass (calls 1) - fixed via autoReset=false + per-frame reset after the read.
- Result: DONE
- Follow-up: I37 bugfix A (ST-037).
## I37 - bugfix A: stray Enter mid-game (ST-037)
- Goal: bugfix iteration - hunt real defects in the session-key / touch / core boundary space and fix the first confirmed one with a repro.
- Bug: the Enter keydown handler ran its session side effects (newBest=false, popups.clear(), hint.show()) BEFORE the state check. Repro: start game, let the 6s tutorial hint fade, press Enter mid-game -> the tutorial hint instantly re-appears (opacity 0 -> 1, full 6s overlay) and any live score popups are wiped, while the game keeps running (state stayed PLAYING, no restart - the harmful part was the UX spam). Root cause: side effects outside the MENU/GAME_OVER branches.
- Changed: src/main.js (Enter handler: newBest reset + popups.clear() + hint.show() now only inside the MENU->begin and GAME_OVER->restart branches; stray Enter in PLAYING/PAUSED is a no-op. Also removed a stray double semicolon after audio.setMuted in the M handler).
- Verification: browser repro before fix (mid-game Enter flipped hint opacity 0->1 at PLAYING); after fix, dedicated 9s-fade probe: hint opacity 0 -> stray Enter -> 0, state stays PLAYING (bugFixed=true); regression paths intact - MENU Enter starts game with hint shown (opacity 1), GAME_OVER Enter restarts with score 0 and hint shown; npm test 117/117; build exit 0; console 0 errors. Also probed and cleared (no fix needed): knockback ship-arena clamp (r=25.10 + radius 0.9 <= 26), restart state hygiene (score/combo/kills/wave/time/drops all reset), combo timer freeze on pause (correct: 6 paused sim-seconds did not decay the chain), homing NaN paths (v2Norm zero-vector guarded with l||1; atan2(0,0)=0), one-hit-per-frame ship collision (single best hit resolved), touch second-finger bookkeeping.
- Result: DONE
- Follow-up: I38 code review pass (ST-038).

## I38 - code review pass (ST-038)
- Goal: cgs-code-review iteration - review the whole game source against the architecture contract, fix in-scope findings, document verdict + deferred items.
- Changed: docs/architecture/code-review-i38.md (NEW: full review artifact - Summary/Correctness/Maintainability/Security/Verdict APPROVE/Risks/Verification), src/core/config.js (+powerup.magnetAccel = 40 - magnet pull acceleration was a magic number in powerups.js with a stale "(tune in I34)" comment, violating the tunables-in-config rule), src/core/powerups.js (magnet pull now reads p.magnetAccel; comment fixed), tests/config.test.js (+validity check for powerup.magnetAccel).
- Verification: all 28 modules (14 core, 14 render) + main.js + index.html + tests read line-by-line: core stays DOM/three-free, render only syncs, all pools bounded (bullets 64/rocks 24/particles 512/popups 12/drops 4), no NaN/zero-div paths (v2Norm l||1, homing sp||1, rim normal d||1), no mutation of iterated arrays, fixed-timestep backlog drop verified, composer stats ordering correct, storage validated on read AND write, no innerHTML/eval anywhere (security: no findings). Correctness findings: rim-bounce normal is slightly non-unit but converges (no escape, probed I37), shipHitRock picks first-overlapping rock not nearest (game-feel nit, accepted); deferred: visibilitychange auto-pause + WebGL context-loss recovery + #flash null guard -> I43 (already planned). node scripts/run-tests.mjs 117/117 pass 0 fail; build exit 0; browser smoke: 0 console errors, session started via Enter, the changed magnet line exercised live (drop injected at dist 5.83 inside the 7u magnet ring -> pulled to 3.63, speed exactly 20.00 u/s after 0.5s = 40 x 0.5, behavior identical to the old constant); screenshot .evidence/i38-review-smoke.png.
- Result: DONE
- Follow-up: I39 balance pass 2 (ST-039, producer/design); I42 bugfix-B has no candidates (nothing rose to bug severity in this review).

## I39 - balance pass 2: late-game speed ramp (ST-039)
- Goal: balance iteration - extend difficulty past the wave-13 plateau where the speed ramp hit its cap, as the documented counterweight to the I34 sustain buffs, and close the open I21/I23/I34 tuning revisit notes with analysis.
- Changed: src/core/config.js (wave.speedCap 1.9 -> 2.1 - the primary ramp 1+0.06n now runs to wave 18 instead of stalling at wave 13; late-game S-asteroid peak speed 11.0 -> 12.2 u/s, still below ship maxSpeed 14 with a 1.8 u/s escape margin), design/gdd.md (Waves & Difficulty line: cap 1.9 -> 2.1), production/balance-notes.md (I39 section: rationale + closed-with-analysis: RAPID realized 1.83x accepted (fixed-step quantization, 91% of theoretical, imperceptible), MAGNET homing turn radius 11.3u > 8u range so bullets only bias not loop (slight per GDD), BOMB 24-rock ~1866pt spike bounded and GDD-sanctioned (watch in I41 playtest), concurrency cap stays 24 (pool-sized, E7 territory)), tests/waves.test.js (cap probe wave was hardcoded 17 to exceed the OLD cap reach (13); now derives capWave = ceil((speedCap-1)/speedPerWave)+1 from config so future retunes cannot silently break it).
- Verification: node scripts/run-tests.mjs 117/117 (the waves cap test failed once against the new cap, proving the probe was tied to the old number - fixed symbolically, not by weakening the assertion); build exit 0; browser live probe of the running ramp: wave 13 -> 1.78, wave 18 -> 2.08, wave 19 -> 2.1, wave 30 -> 2.1 (exactly the designed curve; waves 14-18 were flat 1.9 before this change); 0 console errors.
- Result: DONE
- Follow-up: I40 QA plan + regression smoke (ST-040).

## I40 - QA plan + regression suites (ST-040)
- Goal: define the QA coverage that gates the vertical slice (I45) and keep a repeatable regression baseline: what each layer (node / browser / playtest) owns, the critical-path suite that must stay green, and gate entry/exit criteria.
- Changed: production/qa-plan.md (NEW: risk ranking R1-R8, feature x layer test matrix, regression suites - A: automated (tests + build + 0 console errors) every iteration, B: 8-step critical path for any gameplay/UX/render change, C: extended (perf baseline, storage round-trip, resize, touch synth) at gates I45/I96; entry/exit criteria for the slice gate; evidence conventions incl. the probe rule to zero ship velocity when parking test rocks; known gaps - R7 robustness is I43, touch automation joins Suite C at I45).
- Verification: Suite A green (117/117, build exit 0, 0 console errors). Suite B executed live in browser, all 8 steps pass: 1) Enter -> PLAYING + hint shown, 2) live-intent fire -> 2 bullets + fire events, 3) bullet kill -> +160 score (exactly 50x1.0 + 50x1.1: the combo multiplier math verified in-situ) + kill event, 4) rapid/shield/magnet all active after forced apply, 5) P -> PAUSED with sim time frozen over 1s of advance, P -> PLAYING, 6) hit at 1 life -> GAME_OVER + best persisted, 7) Enter -> restart with score 0 / lives 3 / wave 0. First probe run failed step 3 for a probe-sequence reason (ship momentum from the prior thrust drifted it into the parked rock before the bullet arrived - the game resolved the ship collision correctly); the fixed probe (velocity zeroed) is now the canonical Suite B recipe and the lesson is codified in the QA plan evidence conventions. 0 console errors across both runs.
- Result: DONE
- Follow-up: I41 playtest report (ST-041) - first scripted self-play pass feeding balance judgment.

## I41 - playtest report (ST-041)
- Goal: first scripted self-play pass - two bot-driven skill profiles (casual vs skilled, run entirely through __vr.advance with explicit intent) to feed the balance judgment with measured evidence and surface design gaps before the vertical slice gate.
- Changed: production/playtest-report.md (NEW: method, run table, wave pacing, findings F1-F7, comprehension/friction assumptions, loop appeal, ordered recommendations). No source changes - this iteration is evidence, not code.
- Verification: both full sessions executed live in the browser via Playwright. Run A (casual: no lead-aim, no evasion): 180s time-capped, still alive, stalled on wave 1, 5,054 pts / 40 kills / 1 hit / combo 10. Run B (skilled: flight-time lead-aim + perpendicular evade): died wave 15 at 209.2s, 104,955 pts (NEW BEST persisted) / 696 kills / 3 hits (two clustered 2.2s apart in wave 6) / drops 59-58. Game-over screen stats cross-checked against world state. 0 console errors across both runs. Screenshot .evidence/i41-playtest-gameover-wave15.png viewed.
- Result: DONE
- Follow-up: I42 bugfix B (ST-042) - scope decision: clean defect hunt with repro vs implementing the F1 wave-stall fix (needs GDD change).

## I42 - wave stall advance (ST-042, bugfix B)
- Goal: close playtest finding F1 - the top design gap (a wave that is never cleared never advances; Run A camped wave 1 for 180s at 1 hit) - with a config-driven, deterministic stall advance.
- Changed: src/core/waves.js (waveElapsed stall timer: counts active time only, reset on wave start / clear / stall; at wave.stallTime the wave advances regardless - toSpawn set for the new wave, leftover rocks carry (not deleted, not sped up), no intermission; ev.stallAdvance added, ev.startedWave reused so the "WAVE n" banner flow is unchanged). src/core/config.js (wave.stallTime: 45). design/gdd.md ("Waves & Difficulty" advance rule: + stall advance, carryover, skipped intermission). tests/waves.test.js (+3: stall carries leftovers and resets the timer; clear-in-time never stalls; repeated stalls escalate 2->3; seeds 36-38). production/balance-notes.md (I42: 45s is ~2x the skilled early pace; density self-bounds via the concurrent cap 24; watch items I90/I92).
- Verification: node --test 120/120 green; build exit 0. Browser smoke (live dev build, new config confirmed loaded with stallTime 45): start game, wave 1 active (5 rocks), waveElapsed parked at 44s, advanced 2s -> wave advanced to 2 with the "WAVE 2" banner, 5/5 leftover rocks carried (none deleted), toSpawn set for wave 2 (6), waveElapsed reset, wave event x1 / waveCleared x0, lives intact, 0 console errors/warnings. Screenshots: .evidence/i42-stall-advance-wave2.png (mid-play: WAVE 2 banner, score 0, 10 rocks) and .evidence/i42-stall-advance.png (game over after real-time drift reached wave 2 with 0 kills - the stall path end-to-end).
- Result: DONE
- Follow-up: I43 edge cases (ST-043) - visibilitychange auto-pause, resize, WebGL context-loss recovery, #flash null guard (QA plan R7, deferred from I38).
## I43 - edge cases (ST-043)

- Goal: close the I38-deferred robustness gaps (C3/C4/C5) and QA-plan R7 - tab-hide auto-pause, WebGL context-loss recovery, `#flash` null guard - plus a deterministic NaN soak.
- Changed: src/main.js (visibilitychange auto-pause; webglcontextlost preventDefault + auto-pause; webglcontextrestored -> renderer/bloom resize + info reset; `#flash` writes guarded). tests/soak-nan.test.js (NEW: 5-min aggressive seeded soak; NaN always fails, +/-Infinity allowed only at the documented scoreKeeper.lastKillTime sentinel). docs/architecture/code-review-i38.md (C3/C4/C5 closed).
- Verification: 121/121 + build 0. Browser: hidden->PAUSED->resume OK; context loss while PLAYING -> auto-pause, guarded no-op render during loss, full scene recovery after restore (three r160 reinitializes all internals incl. program cache in onContextRestore - no vendor patch needed); 0 console errors (39 harmless INVALID_OPERATION delete warnings from three reinit, documented); `#flash` removed + forced hit -> no exception; resize 1024x600 verified (buffer 1280x750). Screenshot .evidence/i43-context-restore.png.
- Result: DONE
- Follow-up: I44 UI/UX pass (ST-044) - HUD power-up indicators, optional fire-line reticle (playtest rec #3), menu/pause polish.
## I44 - UI/UX pass (ST-044)

- Goal: ST-044 UI/UX review fixes - HUD power-up indicators (deferred since I22), combo-window clarity, icon legibility/contrast, plus playtest rec #3 (fire-line reticle) and menu/pause polish.
- Changed: src/render/hud.js (rewrite: top-right power-up chips = shape + color + label with quantized drain bars, never color alone per GDD accessibility; combo 4s-window drain bar under the chain text; best/wave contrast bumps). src/render/reticle.js (NEW: subtle fire-line from ship nose along the actual fire direction, opacity 0.35, visible only while PLAYING - teaches lead-aim since the nose eases toward the cursor). src/main.js (reticle wiring + __vr debug handle). src/render/screens.js (menu keycap styling for control keys, pause screen session snapshot SCORE/WAVE/KILLS, subtitle/best contrast). design/gdd.md (HUD section: indicators, drain bar, reticle). tests/powerups.test.js (+1 invariant: every timed power-up dur > 0 - HUD divides by it - and bomb is instant).
- Verification: 122/122 + build 0. Browser: 4 chips (» RAPID / ∴ SPREAD / ● SHIELD / ∪ MAGNET) appear with drain bars, bars tick down in real time, chips vanish as timers lapse; combo bar = remaining window (forced 3.5s/4s -> ~0.87); reticle geometry matches ship.aim (aim -pi/2 -> line (0,0.35,-1) to (0,0.35,-6)); reticle PLAYING-only (hidden on pause, restored on resume); pause shows SCORE/WAVE/KILLS snapshot; menu keycaps render; 0 console errors + 0 warnings on clean load (40 INVALID_OPERATION warnings seen once mid-session = Vite HMR full-reload artifact, same documented-harmless class as I43, dev-only). Screenshots .evidence/i44-menu.png, i44-hud-powerups.png, i44-paused.png.
- Result: DONE
- Follow-up: I45 vertical slice gate (ST-045, cgs-gate-check -> production/gates.md; QA Suite C: perf baseline, storage round-trip, resize, touch synth).
## I45 - vertical slice gate (ST-045)

- Goal: cgs-gate-check advisory slice gate - confirm I01-I45 is a full-loop slice at representative quality; execute QA Suite C (qa-plan.md: storage round-trip, resize mid-game, touch synth, I43 robustness re-verification, perf baseline @ wave 4).
- Changed: production/gates.md (NEW: gate artifact - criteria, evidence, concerns, verdict PASS, risks, next owner). No source changes (gate is evidence, not code - same pattern as I41).
- Verification: Suite A green (122/122 + build 0). Suite C: storage round-trip (volume/sfx/fx/motion set in panel -> reload -> stored == panel == live); resize 800x600 -> 1600x800 mid-game (0 errors, canvas buffer 1600x800); touch tap -> 2 bullets, drag -> thrust (1,0) vel +10.5, two-finger -> PAUSED; visibility hidden -> PAUSED (stays paused, manual resume), context loss -> PAUSED -> restore -> healthy render, 0 errors; perf @ wave 4 (20 rocks + fire + bloom High, ?fps=2): 60fps / 16.6ms / 37 calls / 1626 tris - within I36 baseline (56-60fps / 40 calls / 1638 tris).
- Result: PASS (gate) - DONE
- Follow-up: I46 final regression (ST-046): full node suite + browser regression (Suites A+B+C re-run) + build.

## I46 - final regression (ST-046)

- Goal: final regression before docs/milestone (ST-046) - re-run Suites A+B+C after the I44 UI/UX changes.
- Changed: none (regression is evidence, not code - same pattern as I41/I45).
- Verification: Suite A green (122/122 + build 0). Suite B (fresh page, deterministic __vr.advance with parked waves/ship/rocks): start -> PLAYING + hint + wave 1 banner event; fire 3 shots in 0.4s; kill parked S-rock (score 100, "+100" popup); rapid 20 shots in 2s (2x); shield shielding; magnet pulled a drop to pickup (v 17.3 at 0.5s, collected ~0.41s = 1/2*a*t^2 within pickupRadius 1.6 - proof of pull, not a miss); pause froze sim over 900ms of live ticks; hit -> lives 3->2 + invuln + combo 3->0; game over screen with stats (KILLS 1 WAVE 1, MAX COMBO x1) + best persisted (kept pre-existing 104955 > forced 5000 - correct max behavior); restart fresh (score 0 / wave 0 / lives 3 / popups cleared / hint resown). Suite C perf @ wave 4 (parked ship, exactly 20 M rocks held, sustained fire, bloom High, ?fps=2): 60fps / 16.7ms / 34 calls / 1466 tris - within 10% of I36 (40 calls/1638 tris) and I45 (37/1626). Console: 0 errors, 0 warnings on the I46 page load (session-accumulated warnings belong to earlier page loads: HMR reload + I45 context-loss test, both documented-harmless classes).
- Result: DONE
- Follow-up: I47 docs (ST-047) - README (run/build/test/controls), docs/architecture README update, CHANGELOG final pass.

## I47 - docs (ST-047)

- Goal: documentation pass after the vertical slice - full README, architecture README accuracy, CHANGELOG final coverage check.
- Changed: README.md (rewrite: quick start with the real no-bundler dev/build/preview/test commands, full controls table incl. touch fallback, gameplay summary, layout, docs map, dev/debug notes for ?fps=2 and __vr). docs/architecture/README.md (rewrite to match the current file layout: core game.js/fx.js, render module list incl. reticle/scorePopups/waveBanner/tutorialHint/screens/settingsPanel/fpsMeter/bloom, event-queue data flow, perf budget note). CHANGELOG.md: no edits - final pass confirmed I01-I46 all present (47 lines; the single pre-existing duplicate I17 at position 18 is historical and deliberately untouched).
- Verification: Suite A green (122/122 + build 0). No source/rendering changes, so no browser smoke required; README commands cross-checked against package.json scripts and scripts/ entry points; architecture file list cross-checked against the actual src/ tree.
- Result: DONE
- Follow-up: I48 milestone review (ST-048, cgs-milestone-review) + retrospective (cgs-retrospective).

## I48 - milestone review + retrospective (ST-048)

- Goal: close M1 (E1-E6, I01-I48) with the two closing CGS artifacts - cgs-milestone-review (readiness + transition verdict) and cgs-retrospective (went well / did not work / root causes / actions) - plus the doc-accuracy fixes they surfaced.
- Changed: production/milestone-review.md (NEW: per-epic evidence table, no blockers, PASS transition verdict to E7, risks R6/R5/F2/F4). production/retrospective.md (NEW: 6 went-well, 5 friction items, root causes, 6 action items with owner iterations). production/probe-notes.md (NEW: consolidated proven browser probe patterns - __vr surface, scene-pinning helpers, touch synth, env toggles, gotchas, World API, perf probe rule - for I89-100 regression reuse). AGENTS.md (accuracy fix only: no-bundler import-map engine description, dev/preview ports, src/audio/ -> src/render/audio.js; BOM preserved; no instruction semantics changed).
- Verification: Suite A green (122/122 + build 0; no source changes). Milestone evidence cross-checked against iteration headers I01-I48 (sequence 1..48 verified), gates.md (I45 PASS), qa-plan.md, playtest-report.md, package.json scripts.
- Result: DONE (M1 closed; transition to E7 approved)
- Follow-up: I49 release checklist v1 (ST-049, cgs-release-checklist) - dist build size/load/console-clean, SHIP/NO-SHIP call on the slice.

## I49 - release checklist v1 (ST-049)

- Goal: cgs-release-checklist on the slice build - build evidence, dist measurement, QA/a11y/rollback review, SHIP/NO-SHIP call.
- Changed: scripts/build.mjs (vendor whitelist: ship only three.module.js + the 4 postprocessing passes and their Pass/ShaderPass/MaskPass + shader closure instead of the full vendored three package - a real packaging defect found by the checklist: 22,895,455 B -> 1,405,436 B, ~16x). production/release-checklist.md (NEW: checklist artifact, verdict SHIP, warnings W1-W4).
- Verification: 122/122 + build 0. Preview server (serves dist/ only): menu renders (DOMContentLoaded 507ms, full load 519ms), Enter -> PLAYING, wave 1 spawned (5 rocks), no NaN over 2s live play, bloom composer path active (bloom.enabled true - EffectComposer/UnrealBloomPass resolve from the trimmed vendor), 0 console errors + 0 warnings. Screenshot .evidence/i49-preview-playing.png.
- Result: DONE (verdict SHIP)
- Follow-up: I50 final polish sweep + E6 closing commit (ST-050).

## I50 - final polish sweep + E6 closing (ST-050)

- Goal: closing sweep before E7 - release hygiene (version + changelog section), stale docs refresh, repo audit, final green verification; this is the E6/Sprint-1 closing commit.
- Changed: package.json + package-lock.json (version 0.1.0 -> 0.2.0, the SHIP verdict from I49). CHANGELOG.md (I01-I49 entries promoted under a new "## [0.2.0] - 2026-11-13 (M1: vertical slice SHIP)" section; fresh [Unreleased] head for E7). production/timeline.md (M1 close + sprint close + E7 start entries). production/sprints/sprint-1.md (Closeout section: all acceptance criteria met).
- Verification: repo audit - no unreferenced src modules, no TODO/FIXME/HACK in src, .gitignore covers dist/evidence/caches, all 17 test files map to modules. Suite A green: 122/122 + build 0. Browser sanity on the shipped dist (preview server): fresh load 0 console errors/warnings, start -> PLAYING, live play finite (no NaN).
- Result: DONE (E6 + Sprint 1 closed at v0.2.0)
- Follow-up: I51 begins E7A content (ST-051) - first content slice per production/stories.md.
## I51 - wave modifiers (ST-051)

- Goal: ST-051 E7A content - per-wave modifiers (fast rocks, small bias, inward push), deterministic via a seed-derived RNG.
- Changed: src/core/config.js (NEW waveMods section). src/core/waves.js (activeMod, modifierFor pure in (seed,wave), fast speedMult x1.4, small pickSize 50% S, inwardAccel getter, set on both start paths). src/core/asteroids.js (field.step drift pull toward center). src/core/game.js (field.step gets inwardAccel; wave event carries mod). src/render/waveBanner.js (MOD_LABELS + startWave(n,mod)). src/main.js (pass mod). tests/waves.test.js (2 ramp tests probe base ramp with activeMod='none'). tests/wavemods.test.js (NEW, 8 tests, seeds 39-45). design/gdd.md (Waves section). production/balance-notes.md (I51 section).
- Verification: 130/130 + build 0 (was 122). Browser: modifierFor deterministic (1-2 none, 3-6 fast, 7-9 inward, 13 small); INWARD wave 7 parked rock (12,0) vel.x -0.5 + banner "INWARD DRIFT"; FAST wave 3 speedMult 1.652 (exact 1.18x1.4) + banner "FAST ROCKS"; SMALL wave 13 banner "SMALL ROCKS"; 0 console errors/warnings. Screenshot .evidence/i51-wavemods-banner.png.
- Result: DONE
- Follow-up: I52 golden asteroid (ST-052) - rare, 5x score, faster, glowing.
## I52 - golden asteroid (ST-052)

- Goal: ST-052 E7A content - golden asteroid: rare (5%) glowing rim-spawn rock from wave 3, 35% faster, 5x score, never from splits.
- Changed: src/core/config.js (NEW asteroid.golden block). src/core/asteroids.js (spawn() golden flag). src/core/waves.js (per-rim-spawn roll, minWave-gated, speed boost). src/core/game.js (5x base score on both kill paths; kill event carries golden flag). src/render/asteroidRenderer.js (matGold emissive material, pool material swap in sync). src/render/scorePopups.js (gold opt, #ffe27a). src/main.js (golden kills: big+gold popup, particle burst 1.5x count / gold tint; __vr now exposes rockRenders). tests/golden.test.js (NEW, 6 tests, seeds 46-49). design/gdd.md (Asteroids section). production/balance-notes.md (I52 section).
- Verification: 136/136 + build 0 (was 130). Browser: pool material swap verified (2 golden rocks render emissive 0xffa018); director roll rate 91/2000 = 4.55% (expected 5%, within 1 sigma); live-loop kills golden M +250 (50x5) and golden S +500 (100x5); glow visually confirmed (FX high) at .evidence/i52-golden-rock.png; 0 console errors/warnings.
- Result: DONE
- Follow-up: I53 near-miss bonus (ST-053) - close pass = small points + swish.
## I53 - near-miss bonus (ST-053)

- Goal: ST-053 E7A content - graze bonus: a rock skimming past the ship (no hit) pays a flat +15 once per approach, with a swish SFX.
- Changed: src/core/config.js (NEW nearMiss section: radius 2.6, points 15, rearmMult 1.6, spawnImmunity 0.3). src/core/score.js (bonus() - flat score, combo untouched). src/core/game.js (resolveNearMisses: once-per-approach with rearm ring, invuln-suppressed, spawn-immunity-gated; called in step after ship hits). src/core/asteroids.js (nearImmune per rock, set on spawn, decayed in step). src/render/audio.js (swish cue - low-gain noise puff + descending sine, 0.15s min gap). src/main.js (SFX_CUES nearmiss->swish; plain small popup; subtle cyan wisp particles). tests/nearmiss.test.js (NEW, 6 tests, seeds 50-52). design/gdd.md (Scoring & Records). production/balance-notes.md (I53 section).
- Verification: 142/142 + build 0 (was 136). Browser: 3 grazes = +15 each, re-arm after leaving the ring works, no life lost; swish scheduled on live graze (played.swish delta 1, SFX on); split-immunity probe - L killed at (3,0): 0 instant graze points on the kill frame (fragments immune 0.3s), 3 grazes only after immunity; game.test.js original 25-pt expectation holds (would have been 70 without immunity); 0 console errors/warnings. Screenshot .evidence/i53-nearmiss-graze.png.
- Result: DONE
- Follow-up: I54 mine drones (ST-054) - slow homing, 1 hit, explode.
## I54 - mine drones (ST-054)

- Goal: ST-054 E7A content - mine drones: a slow homing enemy that chases the ship, dies to 1 bullet, and explodes on contact (costs a life).
- Changed: src/core/config.js (NEW mine section: firstWave 5, perWave 1, maxConcurrent 10, radius 0.9, speed 3.2, turn 1.6, score 150). src/core/mines.js (NEW MineField - rim spawn, bounded homing turn, rim bounce, 1-hit destroy). src/core/game.js (MineField wiring: spawnMinesForWave on wave start, resolveBulletMines, resolveShipMines, reset). src/render/mineMesh.js (NEW pooled spiky red mine, shared blinking emissive). src/main.js (import/create/sync mineRenders, mineExplode juice - red burst+shake+flash, SFX cue, __vr). src/render/audio.js (mine cue). tests/mines.test.js (NEW, 6 tests, seeds 53-55). design/gdd.md (new Mine Drones section). production/balance-notes.md (I54 section).
- Verification: 148/148 + build 0 (was 142). Browser: 2 mines render (2 visible pool meshes); live bullet kill pays +150 (expected 150), mine SFX fired (delta 1), mineExplode FX, no death; director start at wave 5 spawns a mine (unit). 0 console errors/warnings. Screenshot .evidence/i54-mine-drones.png.
- Result: DONE
- Follow-up: I55 Monolith boss every 5 waves (ST-055) - HP 40, ring burst, splits to 4 M.




## I55 - monolith boss (ST-055)

- Goal: ST-055 E7A content - the Monolith: a huge slow-homing boss every 5 waves, in addition to normal wave content. HP 40, 1 dmg per bullet, ring burst of 8 S rocks every 2s, splits to 4 M rocks on death for +1000, contact costs a life (boss survives).
- Changed: src/core/config.js (NEW boss section: everyWave 5, maxHp 40, radius 3.4, speed 1.6, turn 0.8, ringEvery 2.0, ringCount 8, splitCount 4, score 1000). src/core/boss.js (NEW Monolith - bounded homing + ring timer, 1-damage hit()). src/core/game.js (wiring: spawnBossForWave on wave start, boss step + ring burst, resolveBulletBoss, bossDeath (headline score + 4 M splits), resolveShipBoss, reset). src/render/bossMesh.js (NEW tapered obelisk mesh, pulsing emissive). src/render/bossHealth.js (NEW minimal DOM HP bar + MONOLITH label). src/main.js (import/create/sync, bossSpawn/bossRing/bossDeath SFX + juice, big boss-kill popup, __vr handles). src/render/audio.js (bossSpawn/bossRing/bossDeath cues). tests/boss.test.js (NEW, 6 tests, seeds 56-58). design/gdd.md (new The Monolith section). production/balance-notes.md (I55 section).
- Verification: 154/154 + build 0 (was 148). Browser: boss spawns at wave 5, obelisk mesh visible + MONOLITH HP bar at 100%; ring fires at 2.0s with exactly 8 S rocks (radial-outward verified in unit test); 40-bullet kill pays +1000 (probe delta 1015 = 1000 + 15 near-miss in window), 4 M splits at the death position, bossDeath SFX fired (delta 1), mesh + HP bar hide on death; contact costs a life and the boss survives (unit). 0 console errors/warnings. Screenshot .evidence/i55-monolith-boss.png.
- Result: DONE
- Follow-up: I56 enemy bullets (ST-056) - separate pool, distinct look, damage the ship; boss/mines can fire them.




## I56 - enemy bullets (ST-056)

- Goal: ST-056 E7A content - enemy bolts: the Monolith fires aimed bolts every 2.2s and mine drones fire aimed bolts when the ship is within 7u (3s cadence). Bolts share a separate pool (cap 24, 4.0s life), render as red-orange orbs, and cost a life on contact.
- Changed: src/core/config.js (NEW enemyBullets section: maxConcurrent 24, radius 0.22, life 4.0, speed 9, mineSpeed 8; boss.fireEvery 2.2; mine fireRange 7.0 / fireEvery 3.0). src/core/enemyBullets.js (NEW EnemyBulletField: fire/step/compact/clear/count, rim+2 cull). src/core/mines.js (per-mine fireTimer + pendingFires + takeFires; clear also clears pending). src/core/game.js (drain mine fires -> fireAimedBolt, boss fire timer + aimed bolt, resolveShipEnemyBullets (1 life per bolt, same invuln flow), reset). src/render/enemyBulletMesh.js (NEW pooled red-orange orbs). src/render/audio.js (bossFire / mineFire cues). src/main.js (sync, SFX, muzzle FX, __vr handles). tests/enemyBullets.test.js (NEW, 5 tests, seeds 59-61). design/gdd.md (new Enemy Bullets section). production/balance-notes.md (I56 section).
- Verification: 159/159 + build 0 (was 154). Browser: boss bolt event + SFX on the 2.2s cadence (probe deltas), pooled orb visible; bolt contact costs a life (999->998) and grants invuln; parked mine at 6.5u fires in range (mineFire + SFX deltas) while out-of-range cadence stays silent (unit); mine bolt contact costs a life (998->997); 3 bolts in frame, clean HUD. 0 console errors/warnings. Screenshot .evidence/i56-enemy-bullets.png.
- Result: DONE
- Follow-up: I57 overdrive power-up (ST-057) - 2x score 6s, magenta hex drop.

## I57 - overdrive power-up (ST-057)

- Goal: Overdrive power-up - magenta hex prism drop; 2x all score for 6s (kills + combo multipliers + near-miss bonuses).
- Changed: src/core/config.js, src/core/score.js, src/core/powerups.js, src/core/game.js, src/render/powerupMesh.js, src/render/hud.js, src/render/scorePopups.js, src/render/audio.js, src/main.js, tests/overdrive.test.js (new: 5 tests, seeds 62-66).
- Verification: 164/164 unit tests green; build exit 0 (159 tests before). Browser deterministic vr.advance probes: pickup (powerup event + sweep SFX + OVERDRIVE HUD chip), 6s timer, refresh no-stack, expiry to 1x, double-kill probe (baseline +100 vs +200 with OD active), 0 console errors/warnings. Screenshot .evidence/i57-overdrive.png.
- Result: DONE
- Follow-up: I58 endless difficulty curve (ST-058) - waves 10+ keep scaling with capped rates + banner.

## I58 - endless difficulty curve (ST-058)

- Goal: waves 10+ keep getting harder forever - capped content, shrinking intermissions, rising small-rock share, ENDLESS banner tag.
- Changed: src/core/config.js, src/core/waves.js, src/core/game.js, src/render/waveBanner.js, src/main.js, tests/endless.test.js (new: 5 tests, seeds 67-70).
- Verification: 169/169 unit tests green; build exit 0 (164 before). Browser: wave-10 boundary probe (event endless:true, 14 rocks, boss + mine spawned, intermissionFor(11)=2.12), banner DOM WAVE 10/ENDLESS at full opacity, 0 console. Screenshot .evidence/i58-endless.png.
- Result: DONE
- Follow-up: I59 gravity vortex hazard (ST-059) - periodic pull field that bends rocks and ship.

## I59 - gravity vortex hazard (ST-059)

- Goal: periodic pull-field hazard from wave 8 - seeded mid-arena disk telegraphs 1s, pulls rocks + ship for 4.5s, re-rolls every 12-20s.
- Changed: src/core/config.js, src/core/vortex.js (new: VortexField state machine), src/core/game.js, src/render/vortexFx.js (new: spiral disk + ring, canvas texture), src/render/audio.js, src/main.js, tests/vortex.test.js (new: 6 tests, seeds 71-76).
- Verification: 175/175 unit tests green; build exit 0 (169 before). Browser: deterministic full-cycle probe (event order telegraph->start->end, 270 pull steps = exactly 4.5s, avgDot 1.28 > 0 toward center, 0 telegraph-pull steps, spawn 7.06u from ship >= 6, disk inside arena), wiring probe via vr.advance (eventTally 1/1, fx group at core pos, opacity 0.55), audio cues both played with pan, 0 console. Screenshot .evidence/i59-vortex.png (active spiral, ship inside disk).
- Result: DONE
- Follow-up: I60 starfield twinkle + parallax, rock rim-lit material upgrade (ST-060).

## I60 - starfield twinkle + parallax, rim-lit rocks (ST-060)

- Goal: presentation pass (render-only) - per-star twinkle + two-depth parallax in the starfield, and a cool fresnel rim on rock materials. No gameplay logic change.
- Changed: src/render/starfield.js (rewritten: twinkle shader + parallax group.update), src/render/asteroidRenderer.js (shared rock material onBeforeCompile rim light), src/main.js (stars.update in syncVisuals; stars exposed on __vr).
- Verification: 175/175 unit tests green (render-only; core unchanged); build exit 0. Browser: twinkle uTime advances with motion and freezes under Reduced Motion; parallax shells exactly at cam x 0.25 / cam x 0.6 (far/near = 2.4); 6 rocks show cool periwinkle rim on silhouettes; 15 draw calls (flat vs wave-4 peak); 0 console errors; no NaN. Screenshot .evidence/i60-starfield.png.
- Result: DONE
- Follow-up: I61 bullet trails - additive streak (ST-061).

## I61 - bullet trails (additive streak) (ST-061)

- Goal: presentation pass (render-only) - each player bullet carries a short additive comet streak behind it, laid flat in the arena and oriented along its velocity (head-bright, tail-fade).
- Changed: src/render/bulletPool.js (added pooled gradient-ribbon trail, basis-quaternion orientation, no per-frame allocs), src/main.js (exposed bullets on __vr).
- Verification: 175/175 unit tests green (render-only; core unchanged); build exit 0. Browser: 6-bullet test row - trail head sits exactly on the bullet, tail extends opposite velocity, orientation follows shot direction; unused pool slots hidden; 26 draw calls in the 6-bullet scene; 0 console errors; no NaN. Screenshot .evidence/i61-bullet-trails.png.
- Result: DONE
- Follow-up: I62 shield pulse animation + ring visual (ST-062).

## I62 - shield pulse animation + ring visual (ST-062)

- Goal: presentation pass (render-only) - the active SHIELD now breathes (subtle scale + opacity) with a second additive ring that repeatedly expands outward and fades; absorb flash kept; reduced-motion freezes to a static ring.
- Changed: src/render/shieldRing.js (breathing + expanding pulse ring; motion flag; reduced-motion static fallback), src/main.js (pass !motionOff to shieldRing.sync; shieldRing on __vr).
- Verification: 175/175 unit tests green (render-only; core unchanged); build exit 0. Browser: shield active -> ring visible, scale/opacity oscillate over time (breathing), expanding pulse ring visible (two concentric cyan rings in shot); Reduced Motion -> static ring (opacity 0.5, scale 1, no breathing); 0 console errors. Screenshot .evidence/i62-shield-pulse.png.
- Result: DONE
- Follow-up: I63 ship engine flame - thrust flicker (ST-063).

## I63 - ship engine flame (thrust flicker) (ST-063)

- Goal: presentation pass (render-only) - a rear engine flame that responds to the player's thrust: it appears and scales with thrust magnitude, flickers (two incommensurate sines) over sim time, and is hidden when the ship coasts; steady (no flicker) under Reduced Motion.
- Changed: src/render/shipMesh.js (additive rear plume + hot-core cones, apex-anchored so it only grows backward, thrust-reactive scale + flicker + motion flag; flame exposed on the mesh), src/main.js (pass clamped thrust magnitude from input.state.thrust to shipMesh.sync; shipFlame/shipFlameCore on __vr).
- Verification: 175/175 unit tests green (render-only; core unchanged); build exit 0. Browser: thrust ON -> flame + core visible (scale sx=1.0, sz flickers, ~0.72 sampled); NEUTRAL (thrust 0) -> flame + core hidden; Reduced Motion -> flame steady (identical scale across two sim times, no flicker); 0 console errors; no NaN. Screenshot .evidence/i63-engine-flame.png (orange plume trailing the ship's rear).
- Result: DONE
- Follow-up: I64 balance pass 3 (new content pacing) + doc (ST-064).

## I64 - balance pass 3: new-content pacing (ST-064)

- Goal: balance iteration - review the pacing of all content added since balance pass 2 (wave mods, golden, near-miss, mines, Monolith boss, enemy bolts, overdrive, endless curve, vortex) against the ship's capabilities; make one bounded tuning where a real pacing gap exists and document the rest.
- Changed: src/core/config.js (boss: +hpFirstWave 10 / hpStep 12 / hpCap 88), src/core/boss.js (pure bossHpForWave(cfg, wave); Monolith constructor takes an optional HP override), src/core/game.js (spawnBossForWave threads the wave into the boss HP), tests/boss.test.js (+2 tests: the wave-HP curve incl. cap, and a live wave-15 boss built at base+step), design/gdd.md (Monolith HP note), production/balance-notes.md (I64 full pacing review + closed-with-analysis).
- Rationale: the fixed 40-HP Monolith was a trivial free +1000 by wave 15 while density/mines/vortex all ramped in endless - the 'big threat' beat was disappearing in the mode with no end. HP now climbs +12 per 5 waves from wave 10, capped at 88 (2.2x base, always beatable); speed unchanged so the boss stays always-dodgeable.
- Verification: 177/177 unit tests green (+2, core change); build exit 0. Browser: live world HP-by-wave probe -> wave 5/10 = 40, 15 = 52, 20 = 64, 30/60 = 88 (cap); 0 console errors. No rendering changed (boss HP bar shows hpFrac 0..1, unaffected by absolute HP).
- Result: DONE
- Follow-up: I65 menu polish (ST-065).

## I65 - menu polish: title, controls card, animated backdrop, credits (ST-065)

- Goal: presentation pass (render-only, DOM/CSS) - polish the MENU screen: a gradient glowing title, a drifting nebula backdrop (starfield shows through), the controls in a bordered card, and a credits line; all new motion freezes under Reduced Motion.
- Changed: src/render/screens.js (gradient + glow title via .vr-title; nebula backdrop + .vr-menu-anim pan on the menu panel; controls card; .vr-credit line; .vr-reduced reduced-motion gate in the injected <style>; update() toggles .vr-reduced from opts.reducedMotion), src/main.js (pass screenOpts.reducedMotion = motionOff).
- Verification: 177/177 unit tests green (render-only; core unchanged); build exit 0. Browser: MENU shows gradient title (background-clip:text), controls card, and credits; with Reduced Motion OFF the title (vrTitleGlow) and backdrop (vrMenuPan) animations run, with it ON both compute to 'none'; 0 console errors. Screenshots .evidence/i65-menu-polish.png (reduced motion) and .evidence/i65-menu-polish-motion.png (motion + bloom).
- Result: DONE
- Follow-up: I66 top-5 high-score table (ST-066).

## I66 - top-5 high-score table + NEW BEST (ST-066)

- Goal: persist a top-5 high-score board (score, wave reached, kills) to localStorage behind the existing guarded Storage, show it on the MENU in a two-column layout (controls | TOP 5), and keep the existing game-over NEW BEST! flag.
- Changed: src/core/config.js (storage.highScoresKey/highScoresMax), src/core/storage.js (getHighScores + recordScore; NaN-safe row validation; cap), src/main.js (scoresText module var + refreshScoresText() at boot and on game over; screenOpts.scoresText), src/render/screens.js (two-column menu grid with TOP 5 card; pre-line tabular body; placeholder text), tests/storage.test.js (+5 tests: corrupt payloads, sort/cap, rank/newBest, CONFIG keys/cap, throwing store).
- Verification: 182/182 unit tests green (177 pre-existing + 5 new); build exit 0. Browser: seeded 3 scores -> reload -> MENU TOP 5 card lists them descending (screenshot viewed); corrupted localStorage ('{bad') -> reload -> placeholder shown, 0 console errors; forced game over (rock on ship at 1 life) -> board row {score, wave, kills} written, BEST raised, NEW BEST! flag shown. Screenshots .evidence/i66-highscores.png, .evidence/i66-gameover-board.png.

## I67 - options panel polish: groups, key nav, live FX preview (ST-067)

- Goal: presentation/UX pass on the settings panel (browser-only) - group the four controls (AUDIO / VISUALS) into labeled cards, make the panel fully keyboard operable with visible focus, and show a live particle preview when the FX tier changes.
- Changed: src/render/settingsPanel.js (full rewrite: two group cards, hint line, .vr-settings class + injected focus/checkbox styles, arrow-key focus moves on checkbox controls, game-hotkey guard via stopPropagation, optional onFxPreview callback on FX change; aria-labels), src/main.js (fxPreviewFn wired after particle creation; both panel instances pass the preview callback -> particles.burst at arena center with the new tier's count).
- Verification: 182/182 unit tests green (render-only; core unchanged); build exit 0. Browser: MENU shows AUDIO | VISUALS group cards + hint line (screenshot viewed); focus ring computes to gold (#ffe08a); ArrowDown SFX->select, ArrowUp select stays (native), ArrowUp SFX->range; Enter on the volume slider does not start the game (state stayed MENU); FX change high->low->high applied live (liveSettings) + persisted (voidrunner.settings) + cyan preview burst visible at arena center; 0 console errors. Screenshot .evidence/i67-settings-groups.png.

## I68 - pause overlay: dim + resume/restart/quit, mouse + keys (ST-068)

- Goal: turn the pause screen into a proper overlay - deeper dim, session snapshot, and three explicit actions (RESUME / RESTART / QUIT TO MENU) usable by mouse and keyboard, with visible focus.
- Changed: src/core/state.js (PAUSED -> MENU transition), src/core/game.js (world.quitToMenu()), tests/state.test.js (+2), tests/game.test.js (+2), src/render/screens.js (deeper dim + vignette, .vr-pause-btn styles in the injected stylesheet, three action buttons with arrow-key nav + hotkey guard, settings.actions hook), src/main.js (actions wiring: resume/restart/quit; keys: Enter resumes from PAUSED, R restarts, Q quits - PAUSED-gated).
- Verification: 186/186 unit tests green (182 pre-existing + 4 new); build exit 0. Browser: PAUSED overlay dims scene (bg alpha 0.74) with snapshot + 3 buttons (screenshot viewed); QUIT click -> MENU, RESTART click -> PLAYING (rocks 0, score 0), RESUME click -> PLAYING; P pauses, R restarts, Q quits, Enter resumes; arrow keys move focus resume->restart->quit with gold (#ffe08a) focus ring; Enter on the focused RESTART button did not reach the window handler (state stayed PAUSED - guard held); 0 console errors. Screenshot .evidence/i68-pause-overlay.png.
## I69 - game-over stats + new-best celebration: board rank + confetti (ST-069)

- Goal: make the game-over screen show the full run summary plus this run's board rank, and celebrate a new best with a confetti burst and a pulsing NEW BEST! line.
- Changed: src/main.js (scoreRank captured from storage.recordScore().rank; three-colour confetti bursts at the ship position on NEW BEST, gated by !reducedMotion && fxCount>0; screenOpts.scoreRank wired in syncVisuals), src/render/screens.js (vrBestPulse keyframe + .vr-newbest class + reduced-motion override in the injected stylesheet; rankLine element; update() toggles .vr-newbest and sets overRank "BOARD RANK #N").
- Verification: node --check clean on both files; 186/186 unit tests green (render/main wiring only, no new tests); build exit 0. Browser: forced NEW BEST game overs at 5000/9000/12000/15000 - the panel renders GAME OVER, SCORE/BEST, NEW BEST! (class vr-newbest, computed animationName vrBestPulse), KILLS/WAVE, MAX COMBO/TIME, BOARD RANK #1, PRESS ENTER TO RESTART; confetti confirmed via vr.particles.live === 154 at the game-over frame (three-colour burst, brief ~1.1s life, so the particle counter is the authoritative proof). Board persisted to voidrunner.scores and best raised. 0 console errors. Screenshots .evidence/i69-newbest-confetti.png and .evidence/i69-confetti-flight.png.

## I70 - accessibility: power-up letter glyphs, unified focus ring, font scale (ST-070)

- Goal: an accessibility pass - (1) give every power-up a LETTER badge (R/S/H/B/M/O) on both the in-world pickup and the HUD chip so pickups are identifiable by letter, not just shape + color; (2) a unified gold focus-visible ring across the whole UI overlay; (3) a FONT SCALE setting (NORMAL / LARGE / XL) that scales all DOM UI text.
- Changed: src/core/storage.js (FONT_SCALES = [1,1.25,1.5], DEFAULT_SETTINGS.fontScale=1, getSettings/setSettings validate via FONT_SCALES.includes), tests/storage.test.js (+1 fontScale default/validate/round-trip), src/render/powerupMesh.js (letterTexture() 128x128 canvas, LETTERS map, per-type shared SpriteMaterial badgeMats, 4-sprite badge pool offset +0.72y, sync() binds material+position per drop), src/render/hud.js (PU_STYLE letter: R/S/H/M/O, chip top = em-based letter badge + label, all font-sizes -> calc(Npx * var(--vr-fs,1)), chip width + combo track font-scaled), src/render/settingsPanel.js (FONT_SCALES import, FONT SCALE <select> in VISUALS, fontSel in key-nav order + hotkey guard, sync() sets it, calc() font/widths), src/render/screens.js (injected '#screens :focus-visible' gold-ring catch-all, all 21 font-sizes -> calc()), src/main.js (applySettings sets --vr-fs on documentElement).
- Verification: node --check clean on all 4 changed .js; 187/187 unit tests green (186 pre-existing + 1 new storage fontScale test); build exit 0. Browser: forced 4 pickups (rapid/shield/bomb/overdrive) -> clear letter badges R(gold)/H(cyan)/B(red)/O(magenta) floating above each orb (screenshot .evidence/i70-powerup-letters.png); HUD chips render R RAPID (gold) + H SHIELD (cyan) letter badges with drain bars (screenshot .evidence/i70-hud-chips.png); menu title 46px -> 69px at fontScale 1.5 via calc(46px * var(--vr-fs,1)), --vr-fs tracks the FONT SCALE dropdown (NORMAL/LARGE/XL) end-to-end with a storage round-trip; unified gold focus ring; 0 console errors / no NaN.

## I71 - mobile/responsive HUD + touch pass (ST-071)

- Goal: make the HUD/menus fit phones and give touch devices a discoverable, tappable experience - responsive viewport UI scale, a touch-aware menu card + in-game hint, tappable START/RESTART, and an on-screen pause button.
- Changed: src/main.js (moved coarse detection up before the hint + pass touch into createTutorialHint; uiVwScale/setUiScale compose fontScale x viewport -> --vr-fs; applySettings -> setUiScale; touch:coarse + start action into createScreens; on-screen pause <button> (pointerdown stopPropagation + click -> togglePause); resize -> setUiScale; syncVisuals toggles the pause button on coarse+PLAYING), src/render/screens.js (.vr-start tappable button style + focus/hover/reduced; @media(max-width:620px) collapses the two-column menu to one and hides credits; vr-menu-grid class; CONTROL_ROWS touch (DRAG/TOUCH/2 FINGERS) vs keyboard split; TAP TO START + TAP TO RESTART buttons on touch), src/render/tutorialHint.js (createTutorialHint(root, {touch}) shows touch instructions; font -> calc(15px * var(--vr-fs,1))).
- Verification: node --check clean (main.js, screens.js, tutorialHint.js); 187/187 unit tests (render-only, no new tests); build exit 0. Browser desktop 1280x720 (non-coarse): two-column menu (238px x 238), keyboard control card, PRESS ENTER TO START text line (no button), pause button display:none, --vr-fs = 1. Browser mobile 375x667 (coarse emulated via matchMedia/ontouchstart stub): single-column menu (174px), touch card (DRAG/TOUCH/2 FINGERS), TAP TO START button, --vr-fs = 0.6, in-game hint DRAG TO FLY / AUTO-FIRE / 2-FINGER PAUSE, on-screen pause button flex during PLAYING, tap -> PAUSED (button hidden, overlay shown), TAP TO RESTART present on game-over panel. Console 0 errors/warnings. Screenshots .evidence/i71-mobile-menu.png, i71-mobile-playing.png, i71-mobile-hint.png, i71-mobile-paused.png, i71-mobile-gameover.png, i71-desktop-menu.png.

## I72 - UI text pass: wording/typos/caps consistency (ST-072)

- Goal: wording/typo/caps consistency pass over all UI text, fixing real inconsistencies without churning intentional copy.
- Changed: src/render/hud.js (combo label `${c} CHAIN  ${...}x` -> `COMBO ${c}  ×${...}` = "COMBO 3 ×1.4"), src/render/screens.js (game-over stat "MAX COMBO x" -> "MAX COMBO ").
- Verification: full string audit of 6 render files; confirmed no test asserts on changed strings; node --check clean; 187/187 (render-only); build exit 0. Browser: forced combo 5 -> HUD "COMBO 5 ×1.4" (multiplier 1.4 = 1+0.1*(5-1)); forced game over maxCombo 5 -> "MAX COMBO 5    TIME 0:08" (no stray x); 0 console errors. Screenshots .evidence/i72-combo-hud.png, .evidence/i72-gameover-combo.png.

## I73 - adaptive quality: rolling FPS <45 auto-drops FX to Low (ST-073)

- Goal: keep slow devices playable - a pure rolling-FPS state machine auto-downgrades FX High -> Low when sustained, with a visible toast + console log, fully overridable from options.
- Changed: src/core/adaptiveQuality.js (NEW pure module createAdaptiveQuality: windowed fps accumulator, below-streak confirm, userSet lock, onTier callback), src/core/config.js (adaptive { windowSec 2.0, thresholdFps 45, confirmWindows: 2 }), src/main.js (toast element + apply-on-downgrade wiring in the adaptive callback; panels call adaptive.userSet on user FX change; frame() feeds adaptive.noteFrame(real frameDt) in PLAYING only; __vr exposes adaptive + toastEl), tests/adaptiveQuality.test.js (NEW, 9 tests).
- Verification: node --check clean; 196/196 (9 new); build exit 0. Browser: fed 82 simulated 20fps frames -> autoDowngrade fired (tier low, autoLow, bloom off, toast "FX AUTO-SET TO LOW (LOW FPS)" visible, console.info logged, saved settings untouched); reset + userSet("high") -> 123 bad frames kept tier high (override lock); full DOM panel path (FX select change) -> applySettings + userSet + persist, still locked. 0 console errors. Screenshot .evidence/i73-adaptive-toast.png.

## I74 - pool/memory audit: no per-frame allocs in hot paths (ST-074)

- Goal: audit every per-frame path (core step + event system + render hot paths) and remove unconditional allocations.
- Changed: src/core/powerups.js (per-frame filter+reassign -> guarded in-place compactDrops, array identity stable), src/core/game.js (drainEvents new-array-per-tick -> pre-allocated double-buffer swap with incoming-buffer clear; reset clears both buffers), src/main.js (module-level shipFwd scratch for ship.forward() in the camera math), tests/poolAudit.test.js (NEW, 4 tests: drops identity, no-dead untouched, drain contents + live-buffer clear, steady-state buffer reuse).
- Verification: node --check clean; 200/200 (4 new); build exit 0. Audit notes in balance-notes (incl. verified-clean list). Browser smoke: wave 1 PLAYING, ship finite, render ok, 0 console messages/warnings; screenshot .evidence/i74-playing-smoke.png.

## I75 - WebGL context loss: overlay + restore/reload path (ST-075)

- Goal: when the browser drops the 3D rendering context, tell the player (instead of a silent frozen canvas) and give a working restore/reload recovery path.
- Changed: src/main.js (new #ctx-overlay DOM node - title RENDERING INTERRUPTED + #ctx-status + RELOAD GAME button (location.reload); webglcontextlost now shows the overlay, resets a 10s escalation timer that rewrites the status to a reload prompt, and keeps the existing auto-pause; webglcontextrestored clears the timer, hides the overlay, and keeps the existing renderer.setSize + bloom.resize + info.reset; window.__vr.ctxOverlay exposed after declaration, TDZ-safe).
- Verification: node --check clean; 200/200 (render-only); build exit 0. Browser: dispatched webglcontextlost -> state PAUSED + overlay display:flex (title/status/button present); dispatched webglcontextrestored -> overlay display:none, state still PAUSED; world.resume() -> PLAYING. Clean run (no events): 0 console warnings/errors. Screenshots .evidence/i75-ctx-lost.png (overlay) + i74/i73 prior. Reload button verified present; its navigation not exercised headlessly.

## I76 - determinism harness: fixed seed + input replay => identical state (ST-076)

- Goal: a durable regression harness proving the core sim is fully deterministic (prerequisite for netcode/replay features and for pinning bug reports to seeds).
- Changed: tests/determinism.test.js (NEW: snapshot() exact-float state capture + deterministic aim-at-nearest input script + 3 tests: 90s same-seed replay identical incl. 15s checkpoints; different-seed divergence sanity; mid-replay pause/resume stays identical). No source files touched.
- Verification: node --check clean; 203/203 (3 new); build exit 0. The 90s replay reaches wave 5 with the boss engaged (96 kills, 14354 pts, boss 35/40, GAME_OVER) - full system coverage under bit-exact comparison.

## I77 - soak test: 10-min headless sim, no NaN, pools stable (ST-077)

- Goal: a long headless stress proving the sim never produces non-finite state and no entity pool grows unbounded over waves/bosses/restarts.
- Changed: tests/soak-pools.test.js (NEW: 36000-step aggressive soak with 5s sampling of (a) nonFinite walk (same ALLOWED_INF sentinel as I43) and (b) pool caps for rocks/bullets/enemyBullets/mines/drops, plus empty-event-buffer check after each drain; accumulates kills + peak wave across restarts for a liveness assertion). No source files touched.
- Verification: node --check clean; 204/204 (1 new); build exit 0. Observed run: peaks {rocks 22/24, bullets 6/64, eb 1/24, mines 1/10, drops 1/1}, 7 restarts, peakWave 5, 517 kills, all finite.

## I78 - resume sync: fixed-timestep clock, no fast-forward on unpause (ST-078)

- Goal: make pause/resume timing safe - a paused game must never fast-forward the sim on resume, and huge frame gaps (tab switch) must clamp instead of spiralling.
- Changed: src/core/clock.js (NEW, pure: wall-clock accumulator -> fixed sim steps; dt<0 -> 0 NTP guard, dt>0.25s clamped, backlog dropped past 8 substeps; tick/reset/state). src/main.js (frame() rewired to clock.tick; prevState PAUSED->PLAYING transition calls clock.reset(now) so the first resume frame carries no accumulated dt; removed dead lastNow/acc). tests/clock.test.js (NEW, 6 tests: baseline, steady step, huge-gap clamp+drop, negative-dt guard, reset discards backlog, state shape).
- Verification: node --check clean on all 3 files; 210/210 (6 new); build exit 0. Browser: begin->pause->600ms (rAF running)->resume->400ms: world.time frozen during pause (0 advanced), no jump on resume, post-resume advance 0.367s (real frames only, not ~1.0s a non-reset clock would replay); console 0 errors/0 warnings; screenshot .evidence/i78-playing.png (healthy PLAYING, no NaN).

## I79 - storage versioning + corruption guards (ST-079)

- Goal: make persisted state (best/settings/scores) safe against version drift and hand-edited/corrupt data - a bad payload must fall back to safe defaults, never crash, and never mis-parse a newer client's schema.
- Changed: src/core/storage.js (added pure exported migratePayload(version, data, migrations?, targetVersion?) - rejects non-object, corrupt/non-integer, and future (>target) versions, treats missing version as legacy v1, runs ordered migration steps with abort-on-error; added internal _readVersioned that validates+migrates on read and best-effort rewrites an upgraded older payload; getBest/getSettings/getHighScores now route through it; MIGRATIONS registry stub for future schema bumps). tests/storage.test.js (+13: migratePayload identity/legacy/future/corrupt/non-object/multi-step/missing-step/throwing + real getters rejecting future-versioned payloads while still reading legacy).
- Verification: node --check clean; 223/223 (13 new); build exit 0. Browser (real localStorage adapter): setSettings round-trip 0.33 + stamps version 1, future version 99 -> defaults, legacy unversioned still reads, remove -> defaults; console 0 errors/0 warnings.

## I80 - debug overlay ?dbg=1 (fps, pools, entities, drawcalls) (ST-080)

- Goal: a developer-only on-screen HUD for profiling the live game: FPS/frame time, GPU draw calls + triangles, live entity counts against their pool caps, and the current game state - so balance/perf tuning and pool-leak hunting do not need the console.
- Changed: src/render/debugOverlay.js (NEW: opt-in overlay mounted only when ?dbg=1, throttled ~4 Hz text refresh, aria-hidden, pointer-events none, z-index 90). src/main.js (reads ?dbg=1 from the URL, creates + shows the overlay, samples renderer.info.render + world entity/pool counts after bloom.render() = full frame, exposes __vr.debugOverlay; mines/enemyBullets sampled via their .count getters).
- Verification: node --check clean; 223/223 (render-only, count unchanged); build exit 0. Browser: with ?dbg=1 the overlay shows 'FPS 60 16.7ms 28 calls 666 tris / rocks 5/24 bullets 0/64 eb 0/24 / mines 0/10 drops 0/1 boss 0 / state PLAYING' and updates live; without the flag the overlay is neither created nor in the DOM; console 0 errors/0 warnings; screenshot .evidence/i80-dbg.png.

## I81 - hit-stop (boss/bomb) + camera punch (ST-081)

- Goal: land the high-impact moments (boss death, bomb blast) with game-feel weight - a brief sim freeze (hit-stop) plus a directed camera punch on top of the existing shake, so the arena stops, jolts, and resumes.
- Changed: src/core/fx.js (added pure createPunch(cfg): directed exponential-decay camera-jolt envelope; offset() ADDS into out so it composes after shake, which overwrites). src/core/config.js (fx.punch {decay 12, amplitude 2.0}; fx.hitStop {bossDeath 0.09, bomb 0.07} sim-freeze seconds). src/main.js (punch instance + hitStop accumulator; bossDeath and bomb events set hitStop and trigger the punch, inside the existing !motionOff FX block (motion-gated); punch.step alongside shake.step in tick; punch.offset composed after shake.offset into the camera; frame() freezes the sim while hitStop > 0 and state is PLAYING - decrements by frameDt and clock.reset(now) discards the accumulated time so there is no catch-up burst, rendering keeps going; a freeze requested while not PLAYING is discarded). tests/fx.test.js (+5: idle no-op, max-stack/clamp trigger, zero/negative strength ignored, decay settles, exact offset math + composition with shake on the same target).
- Verification: node --check clean; 228/228 (5 new); build exit 0. Browser (real rAF loop, 60Hz, wall-vs-sim sampling): bomb -> contiguous sim plateau 0.097s (config 0.07 + frame quantization), punch magnitude exactly 0.8*exp(-12/60) = 0.655 at the first post-freeze tick; real Monolith bossDeath -> plateau 0.10s (config 0.09), punch exactly 1.0*exp(-0.2) = 0.819; boss consumed (world.boss null), game stayed PLAYING; console 0 errors/0 warnings; screenshots .evidence/i81-bossdeath-punch.png and .evidence/i81-bomb-punch.png (render healthy, no NaN).

## I82 - dynamic FOV (kick + speed) + speed-scaled look-ahead (ST-082)

- Goal: widen the camera dynamically so speed and impact read in the frame - a brief FOV kick on bomb/boss death on top of the I81 hit-stop/punch, a sustained FOV boost that scales with ship speed (speed-line feel), and a look-ahead that grows with speed so the camera leans into the motion.
- Changed: src/core/fx.js (added pure createFovKick(cfg): degree-valued max-stacking clamp-at-max exponential-decay envelope, sub-perceptible 0.05 deg settle). src/core/config.js (fx.fovKick {decay 5, bomb 6, bossDeath 8, max 12}; NEW camera section {fovBase 60 (pre-ST-082 hardcode), fovSpeed 4, lookAhead 4, lookAheadSpeed 2, fovDamp 8}). src/main.js (camera constructed with CONFIG.camera.fovBase; fovKick instance + step in tick; bomb/bossDeath events trigger the kick inside the !motionOff FX block; syncVisuals computes spdFrac and speed-scaled ahead for camLook, and eases camera.fov toward base + fovSpeed*spdFrac + kick with updateProjectionMatrix() only when the value actually moves (>0.01 deg); exposes __vr.camera/camLook/camPos/fovKick for verification). tests/fx.test.js (+4: idle zero, max-stack/clamp, non-positive ignored, exact decay + settle).
- Verification: node --check clean; 232/232 (4 new); build exit 0. Browser (1280x720): base FOV 60.0 at rest; real-rAF sampling - bomb kick peak 63.8 and boss kick peak 65.13 (kick 6/8 deg through the 8/s ease), both settling back to ~60.2; speed boost at 11.2 u/s -> 62.9 (expected ~63.2 incl. ease lag); look-ahead offset 4.00 exact at rest and scaling with speed (samples 4.11 -> 4.75 -> 6.4 -> 7.6 incl. first-order camLook lag + a knockback spike, steady-state target 6 at full speed); screenshot .evidence/i82-highspeed-fov.png (wider frame + forward lean at speed, render healthy); console 0 errors/0 warnings.

## I83 - audio polish: ambience bed + sidechain duck, boss stinger, jingle, whoosh (ST-083)

- Goal: give the run a continuous audio floor and make the three landmark moments land harder - a quiet space-drone ambience that ducks under every SFX (sidechain), a low tritone stinger for the Monolith spawn, a 4-note rising wave-clear jingle, and a fuller near-miss whoosh.
- Changed: src/render/audio.js (NEW ambience: own gain bus under the master with three detuned low oscillators (55/82.5/110 Hz) plus a 0.08 Hz "breathing" LFO, start/stop with fade + node cleanup, ambience(on) API, and duck(t) sidechain - fast 0.01s dip to 35% of the 0.05 bus base, 0.45s release - called from sfx() on every scheduled cue; cue upgrades: cleared -> 4-note rising jingle C5-E5-G5-C6, bossSpawn -> low tritone stinger (55/82.4/164.8 Hz cluster + noise thump), swish -> wider 300->100 Hz sweep with heavier noise 0.12 -> 0.28; probes ambOn/ambLevel). src/main.js (syncVisuals drives audio.ambience(st === PLAYING) each frame - the bed runs only in play). No core/logic changes.
- Verification: node --check clean; 232/232 (render-only, count unchanged); build exit 0. Browser (real gesture-initiated AudioContext, state running): ambience auto-starts on PLAYING (ambOn true, bus at 0.05 at rest), dips to 0.0176 within 60ms of a cue (target 0.0175) and releases to 0.045 by +0.9s; played counters confirm cleared/swish scheduled directly and bossSpawn scheduled via the real game event path (tick -> sfx); lastPan -0.107 on the boss spawn (world-x pan intact); ambience stops on pause (ambOn false). Console 0 errors/0 warnings.

## I84 - audio: master-chain pass (post-compressor makeup gain + master level-meter probe), pan math verified (ST-084)

- Goal: round out the master audio chain and verify stereo panning. The DynamicsCompressor (ST-029) already limits loud mixes but only pulls level down, so add a post-compressor makeup gain to restore perceived loudness, and add a post-makeup master level-meter probe as the foundation for the I87 sound-level pass. Re-scoped from the original 'pan by x + master compressor' because BOTH already shipped (ST-029 pan + compressor); this iteration adds the genuinely-new pieces and verifies the existing pan math in-browser.
- Changed: src/render/audio.js (master chain now master -> comp -> makeup(gain 1.4) -> destination, with a post-makeup Analyser (fftSize 1024) tapped as a sink (does not forward); new meter() reads the time-domain buffer and returns {peak, rms} in [-1,1] or null pre-init; meter exposed on the audio handle). No core/logic changes.
- Verification: node --check clean; 232/232 (render-only, count unchanged); build exit 0. Browser (gesture-initiated AudioContext, state running): pan math exact - kill@x=+13 -> lastPan +0.4 (13/26*0.8) and hit@x=-13 -> -0.4 (distinct cues so the rate-limit does not mask the flip; two back-to-back identical cues DO rate-limit before lastPan updates, confirmed by played.kill=1); meter probe live - spawning a rock then bombBlast shatters it (rocks 1->0, played.bomb=1) and the analyser reads peak 1.0226 / rms 0.3728 (non-zero, post-makeup). Observation carried to I87: an isolated loudest cue (bomb, gain 0.7) briefly pushes the post-compressor+1.4x chain to ~1.02 at the analyser (inaudible, destination still compressor-limited) - SFX weight vs headroom to revisit in the sound-level pass. Console 0 errors/0 warnings.

## I85 - vignette overlay: static cinematic frame + reduced-motion-safe danger edge (ST-085)

- Goal: add a screen-space vignette that frames the arena cinematically and signals danger - a static neutral frame always on, plus a red danger-edge that holds on the last life and pulses on a hit, with the transient pulse suppressed under the reduced-motion setting (the static last-life tint still shows, since reduced-motion is about movement, not static color state).
- Changed: index.html (NEW #vignette = static neutral radial-gradient frame, z-index 3; #vignette-danger = red radial-gradient, z-index 4, opacity 0, NO CSS transition - opacity is driven per-frame from JS so there is no animation to be reduced-motion-unsafe). src/main.js (vignetteDangerEl handle + dangerA accumulator; the hit event sets dangerA = min(1, dangerA + (last-life ? 1 : 0.6)) inside the existing !motionOff FX block so the transient pulse is gated exactly like the hit-flash; syncVisuals decays dangerA and sets danger opacity = max(steady 0.55 when PLAYING and lives <= 1, dangerA), writing to style only when the value changes). No core/logic changes.
- Verification: node --check clean; 232/232 (render-only, count unchanged); build exit 0. Browser (1280x720): both overlays present with correct gradients; neutral frame opacity 1 always; danger opacity 0 at 3 lives -> 0.55 at last life (real livesMgr state, invulnerable ship held PLAYING); motion ON - a forced real hit (rock placed on the ship, 3->2 lives) spikes danger to 0.577 (0.6 spike minus one frame decay); reduced motion ON (applySettings) - the same forced hit leaves danger at 0 (transient pulse gated off by !motionOff) while the static last-life tint still reads 0.55; computed transitionDuration 0s + animation none on the danger overlay (structural reduced-motion safety). Screenshot .evidence/i85-lastlife-vignette.png (red danger edges, 1 heart, render healthy, no NaN); console 0 errors/0 warnings.

## I86 - per-entity particle palettes + burst shapes (ST-086)

- Goal: give each entity/event its own color signature in the particle FX and add shape variety to the bursts, so rock kills, golden pickups, near-misses, mines, boss beats, shields, ship damage, the bomb, and the overdrive pickup read differently at a glance. Every palette and shape choice is config-driven, and the burst API stays backward-compatible (a bare `color` is a one-item palette; the default shape is radial).
- Changed: src/core/config.js (NEW `fx.palette` sub-section - 10 named hex ramps keyed by entity/event: rock, golden, graze, mine, boss, bossKill, shield, hit, bomb, power; each a 2-3 color ramp; config.test.js untouched since it only checks REQUIRED top-level sections + specific numerics). src/render/particles.js (`burst()` rewritten backward-compatible - now reads `o.palette` (an array picks a color per particle via Math.random; a missing/empty palette falls back to `[o.color ?? 0xffd27a]`, so the old single-color call path is byte-for-byte equivalent) and `o.shape` (radial default | ring | fountain). ring = flat even shockwave (angle k/n*2pi + jitter, near-constant speed, tiny out-of-plane pop); fountain = upward plume (strong +y, moderate xz) for pickups; radial = original isotropic). src/main.js (13 burst call-sites now pass `palette: CONFIG.fx.palette.X`; `shape:'ring'` for bossRing/bossDeath/shieldPop/bomb, `shape:'fountain'` for the overdrive powerup; muzzle flashes bossFire/mineFire use palette.mine; game-over confetti intentionally left single-color - bounded scope). No core/logic changes.
- Verification: node --check clean (all 3 files); 232/232 (config test still green after the fx.palette addition - no test change); build exit 0. Browser (1280x720, __vr.particles): palette - a burst with [red,green,blue,yellow] yields all 4 colors present in the color buffer (paletteSeen {r:1,g:1,b:1,y:1}). Shapes - read off the world-Y buffer (the burst plane is world (x, 0.4, y), so world-Y is the out-of-plane pop axis): after drain + 3 sync steps, radial straddles the 0.4 plane and is widest (0.357-0.440), ring is the tightest around 0.4 (0.387-0.413), fountain rises fully above it (0.686-0.923); assertions fountain.min (0.686) > radial.max (0.440), radial straddles 0.4, ring tightest - all three cleanly distinct. Screenshot .evidence/i86-particle-palettes-shapes.png (three colored clusters - orange-red ring, green-cyan fountain, yellow-magenta radial; render healthy, no NaN). Console 0 errors/0 warnings.
