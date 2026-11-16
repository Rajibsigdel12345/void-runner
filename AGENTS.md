﻿# AGENTS.md - Void Runner

## Project

Void Runner is a 3D arcade space-asteroid shooter built with **three.js** (no bundler: ES module import maps over vendored modules).

- Genre: arcade survival / asteroids-style, 3D arena
- Platform: desktop web (keyboard), touch-friendly fallback later
- Engine: three.js (r160+), no bundler (import maps + vendored modules; scripts/serve.mjs + scripts/build.mjs)
- Test runner: `npm test` (scripts/run-tests.mjs, in-process node:test over tests/*.test.js; pure-logic modules are DOM-free and unit-testable. A bare `node --test tests/` directory run is NOT the runner in this environment)
- Art assets: seven Blender-made low-poly GLBs in assets/ (ship, asteroid L/M/S, boss, enemy hunter, enemy gunship) loaded at runtime via GLTFLoader (src/render/assetLoader.js) with procedural fallback; everything else stays procedural: canvas textures, WebAudio-synthesized SFX

## Commands

- `npm run dev` - start the static dev server (http://localhost:5173)
- `npm run build` - production build to dist/ (static import-map bundle)
- `npm run preview` - serve the production build (http://localhost:4173)
- `npm test` - run unit tests (in-process node:test via scripts/run-tests.mjs)

## Layout

- `src/core/` - pure game logic (NO three.js, NO DOM). Unit-testable.
- `src/render/` - three.js rendering layer (scene, meshes, particles, post fx)
- `src/render/audio.js` - WebAudio synthesized sound (browser API, so it lives in render)
- `src/main.js` - boot, input, game loop, wiring
- `tests/` - node --test unit tests for core modules
- `design/` - GDD + system designs
- `production/` - epics, stories, timeline, session state, iteration log
- `docs/architecture/` - architecture notes
- `assets/` - Blender-made GLB models (loaded at runtime from assets/; copied into dist/ by the build)

## Conventions

- ES modules everywhere; `class` + plain functions over singletons where possible.
- Core modules must not import three or touch the DOM (keeps tests fast + portable).
- All tunables live in `src/core/config.js` (one file, commented, data-driven).
- Determinism: all randomness flows through `src/core/rng.js` (seeded) so tests can pin seeds.
- Game state machine: `MENU -> PLAYING -> PAUSED -> GAME_OVER -> PLAYING`, plus the replay branch `MENU -> REPLAY -> GAME_OVER` (ST-190) and exitReplay -> MENU.
- ST-190: `MENU -> REPLAY -> (PAUSED <-> REPLAY) / REPLAY -> GAME_OVER / GAME_OVER -> MENU` (replay viewer; watched runs never write scoreboards).
- Iteration log: every meaningful change gets an entry in `production/iterations.md` (iter #, goal, changed files, test result).
- Keep draw calls low: reuse geometries/materials, pool bullets and particles.

## Quality bar (per iteration)

1. `npm test` passes (green) before declaring done.
2. `npm run build` succeeds.
3. Manual smoke in browser where rendering changed (console clean, no NaN).
