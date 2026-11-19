# AGENTS.md - Void Runner

## Project

Void Runner is a 3D arcade space-asteroid shooter built with **three.js** (no bundler: ES module import maps over vendored modules).

- Genre: arcade survival / asteroids-style, 3D arena - two modes: ENDLESS (wave-based arena survival) and CAMPAIGN (4 linear levels (E69 level 4 'Necro Reef'): per-zone identity, per-level bosses, checkpoint continue, localStorage highest-level persistence)
- Platform: desktop web (keyboard), touch-friendly fallback later
- Engine: three.js r187 (vendored), no bundler (import maps + vendored modules; scripts/serve.mjs + scripts/build.mjs). Dual renderer arm (E66, closed I498): default = classic WebGLRenderer (I495 C3 measured decision) / ?fx=webgl frozen classic reference (A/B + emergency rollback) / ?fx=webgpu experimental opt-in = WebGPURenderer + TSL FX (src/render/webgpuFx.js + fxArm.js + tslMaterials.js). Stable rollback tag: stable-webgl2-r160 @ 835381c.
- Test runner: `npm test` (scripts/run-tests.mjs, in-process node:test over tests/*.test.js; pure-logic modules are DOM-free and unit-testable. A bare `node --test tests/` directory run is NOT the runner in this environment)
- Art assets: 31 Blender-made GLBs in assets/ (~2,857 KB (2,925,988 B) / 63,617 tris (I517 measurement)): ship v6 "real airship" 25,563 tris (I501/ST-467 remaster; v5 17,143 tris superseded), asteroid L/M/S + B-variants + comet, boss v2 398 t (I503/ST-469 remaster; v1 1,425 t superseded), enemy fleet E68 real-spaceship remaster (I508 legacy-4: stinger 1,732 / drone 1,516 / warden 1,556 / flyer 1,770 t; I509 remaster-4: hunter 3,366 / gunship 2,596 / sentry 2,934 / wasp 4,020 t; 8 ships 19,490 t; E69 new fleet I516/I517: phantom 2,336 / hauler 3,506 / bulwark 2,700 t; 11 ships, all Blender 5.2.3 headless) - the mine stays procedural, 7 powerups, shield, 2 debris chunks, arena ring - loaded at runtime via GLTFLoader (src/render/assetLoader.js) with procedural fallback; everything else stays procedural: canvas textures, WebAudio-synthesized SFX

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
4. `npm run build` dist/ total stays under 6,100,000 B (ceiling; I516/ST-482 E69 renegotiation WITH MEASUREMENT from 4,700,000 per the E69 scope-check §5 / enemy spec I7 pre-registration (6,100,000 B pre-registered for the E69 asset growth, applied early at the first E69 asset landing per the pre-registered rule): measured 4,956,989 B / 177 files (I516: +phantom 183,724 B +bulwark 149,884 B); chain 3,747,372 (I507) -> 4,190,132 (I508 legacy-4) -> 4,623,044 (I509 remaster-4) -> 4,623,381 (I511) -> 4,956,989 (I516) -> 5,254,934 (I518-I522, code-only growth); CLOSE FLOOR E69 = 845,066 B measured at G69.0 (I522: 6,100,000 - 5,254,934; headroom >= 102,400 B floor -> cut ladder C1..C5 NOT invoked); prior: I510/ST-476 E68 from 3,850,000 WITH MEASUREMENT 4,623,044 B / 175 (I509) [CLOSE FLOOR E68 = 76,619 B at G68.0]; I501 ST-467 from 3,650,000 = 3,747,372 B / 175).
5. Vendor pins (dist-minified sha256 first-16, r187): three.module.js A65DE049A7F38B40 + three.core.js 7AB0784CD2532367 + three.webgpu.js F549248412C62B9A + three.tsl.js 7FF9ACF50F006017. (Pre-E66 r160 ref 76DEA8151BC9352A is obsolete.)
6. Regressions: `node .evidence/I495/causal495.mjs` (dist server :4200) -> 'CAUSAL495 PASS' (3 arms: webgl + default EXACT on the seed-9876 pin set; webgpu report-only) and `node .evidence/I491/playframe491.mjs` (dev server :5173) -> 'PLAYFRAME456 PASS' (A 22/25,781 + 11/180, B 52/55,400 - re-pinned WITH MEASUREMENT at I501 for ship v6: A 17,361 -> 25,781 = +8,420 ship tris (fx=off single pass); B 38,560 -> 55,400 = +16,840 = 2x (fx=high 2-pass scene); A previously re-pinned at I497 for the I494 r187 ConeGeometry degenerate-tip-tri skip) must stay EXACT - re-pin WITH measurement only when a shipped mesh/geometry changes; plus `node .evidence/I491/pwa491.mjs` (dist server :5199) -> 'SUMMARY 11/11' (SW + manifest + offline boot - the 5th harness of the G69.0 gate set per the E69 scope-check).
