# Architecture - Void Runner

## Layering
```
index.html (HUD DOM overlay + canvas host)
   |
src/main.js        boot, input capture, rAF loop, wires core<->render<->audio
   |
src/core/          PURE logic - no three.js, no DOM, no window
   rng.js          seeded LCG (deterministic)
   math.js         vec2 helpers, clamp/lerp/damp
   config.js       ALL tunables (balance table)
   ship.js         player ship state + step()
   weapons.js      bullet pool + fire logic
   asteroids.js    asteroid pool + spawn/split
   powerups.js     drop + effects state
   collision.js    circle-circle tests
   score.js        combo + multiplier
   waves.js        wave progression + difficulty
   lives.js        lives/invuln
   state.js        game state machine
   stats.js        kill/time/combo tracking
   storage.js      guarded localStorage wrapper (injectable for tests)
   |
src/render/        three.js layer - consumes core state, owns meshes/pools
   scene.js, starfield.js, shipMesh.js, asteroidField.js, bulletPool.js,
   powerupMeshes.js, particles.js, shake.js, hud.js (DOM), postfx.js
   |
src/audio/         WebAudio synth (no assets)
   synth.js, sfx.js, bus.js
```

## Data flow (per frame)
1. Input -> intent vectors (thrust, aim, fire, pause...).
2. core.step(world, dt, intent) mutates world (positions, scores, timers).
3. render.sync(world) reconciles meshes to world state (pool reuse, no GC churn).
4. hud.render(world) updates DOM text only when values change.
5. audio triggers on core events (event queue drained each frame).

## Testing
- node --test tests/*.test.js against src/core (DOM-free by contract).
- storage.js takes an injectable store; tests pass a Map-backed fake.
- Browser smoke: dev server + headless check of console errors + DOM assertions.

## Perf rules
- Shared geometry + material per entity class; per-entity only transforms.
- Pools: bullets (64), particles (512 points), asteroids (24), powerups (4).
- No per-frame allocations in hot paths (reuse temp vectors).
