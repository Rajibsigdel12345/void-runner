# Stories - Void Runner (cgs-create-stories)

Format: ID | story | acceptance criteria | verification

## E1 Foundations
- ST-001 | Vite+three scaffold: package.json, index.html, src/main.js boots empty scene, npm scripts | build green; page serves; console clean | build + browser
- ST-002 | Test harness: node --test wired; src/core/rng.js (seeded LCG) + src/core/math.js (vec2 ops, clamp, lerp, damp) | tests green; determinism test passes | node --test
- ST-003 | src/core/config.js balance table per GDD (ship/asteroid/wave/combo/powerup numbers) | schema sanity test green | node --test
- ST-004 | Renderer: scene, camera, ambient+dir light, procedural starfield, resize handling, clock loop | browser smoke: starfield + 60fps | browser

## E2 Core Loop
- ST-005 | src/core/ship.js: inertial ship model (step(dt, input, aim)) | unit: accel/damping/max-speed/aim easing | node --test
- ST-006 | Ship mesh (procedural low-poly) + aim raycast to y=0 plane + camera follow (lerp + look-ahead) | browser smoke: ship follows mouse | browser
- ST-007 | src/core/weapons.js: bullet pool, fire cadence, update, lifetime | unit: cadence, max bullets, cull | node --test
- ST-008 | Render bullets (shared geometry, pool) + fire on Space/click | browser smoke: bullets fly | browser
- ST-009 | src/core/asteroids.js: spawn at rim, per-size speed, split(L->2-3M, M->2-3S, S none), wave capping | unit: split rules, counts, speeds | node --test
- ST-010 | Render asteroids (shared icosahedron, vertex noise, per-instance tumble) | browser smoke: rocks tumble | browser
- ST-011 | src/core/collision.js: circle-circle tests for bullet/asteroid + player/asteroid | unit: hit/miss/edge | node --test
- ST-012 | Wire collisions: kills score, bullets cull, player takes damage | full loop smoke in browser | browser
- ST-013 | src/core/score.js: combo window + multiplier per GDD | unit: combo math incl. cap + reset | node --test
- ST-014 | src/core/waves.js: wave progression + difficulty table from config | unit: ramp values per GDD | node --test
- ST-015 | src/core/lives.js + src/core/state.js: lives, invuln, knockback; state machine MENU/PLAYING/PAUSED/GAME_OVER | unit: transitions + invuln | node --test
- ST-016 | HUD DOM: score/best/wave/lives/combo + styles | browser smoke: values track sim | browser
- ST-017 | Menu + pause + game over screens wired to state machine; Enter/P/Esc/M keys | browser: full session menu->play->pause->over->restart | browser
- ST-018 | High score persistence (localStorage, guarded) + NEW BEST flag | unit w/ mock storage; browser reload keeps best | node + browser

## E3 Power-ups
- ST-019 | src/core/powerups.js: drop chance, single active drop, pickup radius, types/timers/stacking | unit: drop, timers, stack | node --test
- ST-020 | Render power-ups (shape+color icons: octa/cone/torus/cube/sphere) + pickup | browser smoke: pickup works | browser
- ST-021 | RAPID + SPREAD effects wired into weapons | unit via weapons integration | node --test
- ST-022 | SHIELD (absorbs 1 hit, 12s) + visual ring | unit + browser | node + browser
- ST-023 | BOMB (shatter all, feeds combo) + MAGNET (attract drops + slight homing) | unit + browser | node + browser

## E4 Presentation & Feel
- ST-024 | Particle burst on kills (pooled Points) + debris chunks | browser smoke; Low FX quality halves count | browser
- ST-025 | Screen shake + hit flash + invuln blink (reduced-motion aware) | browser smoke | browser
- ST-026 | Score pop (+points) floating text on kills | browser smoke | browser
- ST-027 | Audio: WebAudio synth SFX (fire, hit, explode, pickup, gameover, wave) + low ambience pad; init on first gesture; mute | manual: sounds play, M mutes, no autoplay error | browser
- ST-028 | Settings (volume, SFX, FX quality, reduced motion) + persistence + settings panel in MENU | unit (mock storage) + browser reload | node + browser
- ST-029 | Wave banner ("WAVE n") + intermission timing from waves.js | browser smoke | browser
- ST-030 | Audio polish: pitch variation, volume envelope, master bus + volume setting live | manual smoke | browser

## E5 Player Systems & Accessibility
- ST-031 | Stats: kills, max combo, time survived tracked; game over shows all + wave | unit for tracker + browser | node + browser
- ST-032 | Tutorial hints (first wave only): controls line fades after 6s | browser smoke | browser
- ST-033 | Touch controls: drag = thrust, tap = fire (toward tap), two-finger tap = pause | manual browser (device emulation) | browser

## E6 Polish, QA, Gates
- ST-034 | Balance pass 1: review balance.js numbers vs GDD, adjust fire/asteroid/drop pacing, document rationale | balance-check doc; tests still green | node + doc
- ST-035 | Bloom post FX (UnrealBloomPass) behind FX-quality=High | browser smoke; Low path unaffected | browser
- ST-036 | Perf pass: verify pooling no-grow, shared materials, frustum cull, draw calls budget; FPS meter (debug ?fps=1) | browser perf note in iteration log | browser
- ST-037 | Bugfix round A from smoke/playtest notes + regression tests for each fix | bugs closed w/ tests | node + browser
- ST-038 | Code review pass (cgs-code-review): naming, dead code, config centralization, comment hotspots | review notes; fixes applied | repo diff
- ST-039 | Balance pass 2 (post-playtest): tune wave ramp + combo window + drop chance; document | balance notes; tests green | node + doc
- ST-040 | QA plan + browser regression script: launch, start, 20s play, pause, resume, mute, settings, game over, restart | regression clean, logged | browser
- ST-041 | Playtest report (cgs-playtest-report): friction, comprehension, loop completion, quotes-as-notes | report in production/ | doc
- ST-042 | Bugfix round B (playtest findings) + regressions | bugs closed w/ tests | node + browser
- ST-043 | Edge cases: tab blur auto-pause, window resize, WebGL context loss guard, NaN guard | browser smoke each | browser
- ST-044 | UI/UX review fixes: contrast, font scale, combo meter clarity, icon legibility | review notes applied | browser
- ST-045 | Vertical slice gate (cgs-gate-check/cgs-vertical-slice): full loop at representative quality | gate verdict PASS | doc
- ST-046 | Final regression: full node suite + browser regression + build | all green | node + browser + build
- ST-047 | Docs: README (run/build/test/controls), architecture README update, CHANGELOG final | docs complete | repo
- ST-048 | Milestone review (cgs-milestone-review) + retrospective (cgs-retrospective) | docs + actions | doc
- ST-049 | Release checklist (cgs-release-checklist): dist build verified, size, load time, no console warnings | ship/no-ship = SHIP | doc + build
- ST-050 | Final polish sweep: last visual/audio nits from release checklist + closing commit | all checklist items checked | repo
