# AGENTS.md - Void Runner

## Project

Void Runner is a 3D arcade space-asteroid shooter built with **three.js** (no bundler: ES module import maps over vendored modules).

- Genre: arcade survival / asteroids-style, 3D arena - two modes: ENDLESS (wave-based arena survival) and CAMPAIGN (3 linear levels: per-zone identity, per-level bosses, checkpoint continue, localStorage highest-level persistence)
- Platform: desktop web (keyboard), touch-friendly fallback later
- Engine: three.js r187 (vendored), no bundler (import maps + vendored modules; scripts/serve.mjs + scripts/build.mjs). Dual renderer arm (E66, closed I498): default = classic WebGLRenderer (I495 C3 measured decision) / ?fx=webgl frozen classic reference (A/B + emergency rollback) / ?fx=webgpu experimental opt-in = WebGPURenderer + TSL FX (src/render/webgpuFx.js + fxArm.js + tslMaterials.js). Stable rollback tag: stable-webgl2-r160 @ 835381c.
- Test runner: `npm test` (scripts/run-tests.mjs, in-process node:test over tests/*.test.js; pure-logic modules are DOM-free and unit-testable. A bare `node --test tests/` directory run is NOT the runner in this environment)
- Art assets: 28 Blender-made GLBs in assets/ (~1,238 KB (1,267,388 B) / 34,938 tris): ship v5 "high-poly real airship" 17,143 tris (E61 remaster, Blender 5.2.3 headless), asteroid L/M/S + B-variants + comet, boss, enemy hunter 2,256 / gunship 2,268 (E61 v5 detail pass) / sentry 1,096 / wasp 792 (E63 I482, Blender 5.2.3 headless) / warden / stinger / drone / flyer - the mine stays procedural, 7 powerups, shield, 2 debris chunks, arena ring - loaded at runtime via GLTFLoader (src/render/assetLoader.js) with procedural fallback; everything else stays procedural: canvas textures, WebAudio-synthesized SFX

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
- Modes: `world.mode = 'endless' | 'campaign'` (E64, ST-452..ST-457). Campaign runs a levelState (forward distance + zones) over a curved race line (src/core/flightPath.js) with per-zone identity palettes/vistas, an end-of-level campaign boss (src/core/campaignBoss.js: weak-point cycle + telegraphed phases + posture), Ikaruga-style checkpoint continue, and a localStorage highest-level continue (storage.js, key 'voidrunner.campaign'). ALL campaign code is campaign-gated - the endless path is bit-identical (guarded by the causal/playframe pins in the quality bar).
- ST-190: `MENU -> REPLAY -> (PAUSED <-> REPLAY) / REPLAY -> GAME_OVER / GAME_OVER -> MENU` (replay viewer; watched runs never write scoreboards).
- Iteration log: every meaningful change gets an entry in `production/iterations.md` (iter #, goal, changed files, test result).
- Keep draw calls low: reuse geometries/materials, pool bullets and particles.

## Quality bar (per iteration)

1. `npm test` passes (green) before declaring done.
2. `npm run build` succeeds.
3. Manual smoke in browser where rendering changed (console clean, no NaN).
4. `npm run build` dist/ total stays under 3,650,000 B (ceiling; I495 C1 renegotiation from 3,250,000; I498: 3,561,659 B / 175 files).
5. Vendor pins (dist-minified sha256 first-16, r187): three.module.js A65DE049A7F38B40 + three.core.js 7AB0784CD2532367 + three.webgpu.js F549248412C62B9A + three.tsl.js 7FF9ACF50F006017. (Pre-E66 r160 ref 76DEA8151BC9352A is obsolete.)
6. Regressions: `node .evidence/I495/causal495.mjs` (dist server :4200) -> 'CAUSAL495 PASS' (3 arms: webgl + default EXACT on the seed-9876 pin set; webgpu report-only) and `node .evidence/I491/playframe491.mjs` (dev server :5173) -> 'PLAYFRAME456 PASS' (A 22/17,361 + 11/180, B 52/38,560 - A re-pinned WITH MEASUREMENT at I497 for the I494 r187 ConeGeometry degenerate-tip-tri skip) must stay EXACT - re-pin WITH measurement only when a shipped mesh/geometry changes.
