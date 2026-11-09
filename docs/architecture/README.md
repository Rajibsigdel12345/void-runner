# Architecture - Void Runner

## Layering
```
index.html            canvas host + HUD DOM overlay
   |
src/main.js           boot, scene/camera, rAF loop, wires core<->render<->audio,
                      applies shake (core/fx.js envelopes) to the camera,
                      exposes the __vr debug handle
   |
src/core/             PURE logic - no three.js, no DOM, no window (unit-testable)
   game.js            World aggregate: step(dt, intent), event queue, state transitions
   state.js           MENU -> PLAYING -> PAUSED -> GAME_OVER machine
   rng.js             seeded LCG (deterministic; tests pin seeds)
   math.js            vec2 helpers, clamp/lerp/damp
   config.js          ALL tunables (one commented file, data-driven)
   fx.js              shake/flash/particle envelopes (data only, no rendering)
   ship.js            player ship state + step()
   weapons.js         bullet pool + fire logic (homing option)
   asteroids.js       asteroid pool + spawn/split/reflect
   powerups.js        drops + timed effects state
   collision.js       circle-circle tests
   score.js           combo + multiplier (windowed)
   waves.js           wave progression + difficulty curve + stall advance
   lives.js           lives / invulnerability
   storage.js         guarded localStorage wrapper (injectable store for tests)
   |
src/render/           three.js + DOM layer - consumes world, never mutates rules
   input.js           keyboard/mouse/touch -> intent
   shipMesh.js        player mesh (+ engine glow)
   shieldRing.js      shield visual
   asteroidRenderer.js  pooled asteroid meshes (shared geometry/material)
   bulletPool.js      pooled bullet meshes
   powerupMesh.js     pooled power-up meshes
   particles.js       pooled point particles
   starfield.js       background starfield
   bloom.js           post-fx bloom (high/low quality paths)
   audio.js           WebAudio synth + bus (no assets)
   hud.js             DOM HUD: score/wave/lives, power-up chips, combo drain bar
   scorePopups.js     DOM "+N" popups (pooled)
   waveBanner.js      DOM wave banner
   tutorialHint.js    DOM first-run hint
   screens.js         menu / pause / game-over DOM screens
   settingsPanel.js   DOM settings panel
   reticle.js         fire-line reticle (1 THREE.Line, PLAYING-only)
   fpsMeter.js        DOM meter (enabled with ?fps=2)
```

## Data flow (per frame)
1. input.js collects keyboard/mouse/touch -> intent (thrust, aim point, fire, fire tail).
2. core: world.step(dt, intent) - pure, mutates world (positions, scores, timers),
   pushes discrete events onto world.events.
3. main drains world.events -> audio SFX triggers + render FX requests
   (particles, shake, flash, popups, banner).
4. render syncs meshes to world state (pool reuse, no GC churn).
5. HUD updates DOM text only when values change.

## Testing
- `node --test tests/*.test.js` against src/core (DOM-free by contract).
- Determinism: all randomness flows through rng.js; tests and scripted browser
  runs pin seeds and reproduce exact behavior.
- storage.js takes an injectable store; tests pass a Map-backed fake.
- Browser regression: dev server + scripted `__vr.advance` probes
  (deterministic, no rAF) + console-clean checks. See production/qa-plan.md.

## Perf rules
- Shared geometry + material per entity class; per-entity only transforms.
- Pools: bullets (64), asteroids (24), particles (512), popups (12), power-ups (4).
- No per-frame allocations in hot paths (reuse temp vectors).
- Draw-call budget: keep well under ~40 calls / ~1.7k tris at wave 4
  (measured 34-40 calls / 1466-1638 tris @ 60fps across I36/I45/I46).
