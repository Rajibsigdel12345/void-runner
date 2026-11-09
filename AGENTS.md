# AGENTS.md - Void Runner

## Project

Void Runner is a 3D arcade space-asteroid shooter built with **three.js** (Vite + ES modules, no build-time framework).

- Genre: arcade survival / asteroids-style, 3D arena
- Platform: desktop web (keyboard), touch-friendly fallback later
- Engine: three.js (r160+), Vite dev server + build
- Test runner: `node --test tests/` (pure-logic modules are DOM-free and unit-testable)
- No external art assets: procedural geometry + canvas textures; WebAudio-synthesized SFX

## Commands

- `npm run dev` - start Vite dev server
- `npm run build` - production build to dist/
- `npm run preview` - serve the production build
- `npm test` - run unit tests (node --test)

## Layout

- `src/core/` - pure game logic (NO three.js, NO DOM). Unit-testable.
- `src/render/` - three.js rendering layer (scene, meshes, particles, post fx)
- `src/audio/` - WebAudio synthesized sound
- `src/main.js` - boot, input, game loop, wiring
- `tests/` - node --test unit tests for core modules
- `design/` - GDD + system designs
- `production/` - epics, stories, timeline, session state, iteration log
- `docs/architecture/` - architecture notes

## Conventions

- ES modules everywhere; `class` + plain functions over singletons where possible.
- Core modules must not import three or touch the DOM (keeps tests fast + portable).
- All tunables live in `src/core/config.js` (one file, commented, data-driven).
- Determinism: all randomness flows through `src/core/rng.js` (seeded) so tests can pin seeds.
- Game state machine: `MENU -> PLAYING -> PAUSED -> GAME_OVER -> PLAYING`.
- Iteration log: every meaningful change gets an entry in `production/iterations.md` (iter #, goal, changed files, test result).
- Keep draw calls low: reuse geometries/materials, pool bullets and particles.

## Quality bar (per iteration)

1. `npm test` passes (green) before declaring done.
2. `npm run build` succeeds.
3. Manual smoke in browser where rendering changed (console clean, no NaN).
