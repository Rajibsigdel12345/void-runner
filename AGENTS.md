# AGENTS.md - Void Runner

## Project

Void Runner is a 3D arcade space-asteroid shooter built with **three.js** (no bundler: ES module import maps over vendored modules).

- Genre: arcade survival / asteroids-style, 3D arena - two modes: ENDLESS (wave-based arena survival) and CAMPAIGN (4 linear levels (E69 level 4 'Necro Reef'): per-zone identity, per-level bosses, checkpoint continue, localStorage highest-level persistence)
- Platform: desktop web (keyboard), touch-friendly fallback later
- Engine: three.js r187 (vendored), no bundler (import maps + vendored modules; scripts/serve.mjs + scripts/build.mjs). Dual renderer arm (E66, closed I498): default = classic WebGLRenderer (I495 C3 measured decision) / ?fx=webgl frozen classic reference (A/B + emergency rollback) / ?fx=webgpu experimental opt-in = WebGPURenderer + TSL FX (src/render/webgpuFx.js + fxArm.js + tslMaterials.js). Stable rollback tag: stable-webgl2-r160 @ 835381c.
- Test runner: `npm test` (scripts/run-tests.mjs, in-process node:test over tests/*.test.js; pure-logic modules are DOM-free and unit-testable. A bare `node --test tests/` directory run is NOT the runner in this environment)
- Art assets: 31 Blender-made GLBs in assets/ (~3,077 KB (3,150,354 B) / 72,449 tris (I541 measurement, cap 3,080 KB / 73,000 t)): ship v7 "warship airship" 32,499 tris (I541/ST-507 swap; v6 25,563 tris superseded), asteroid L/M/S + B-variants + comet, boss v2 398 t (I503/ST-469 remaster; v1 1,425 t superseded), enemy fleet E68 real-spaceship remaster (I508 legacy-4: stinger 1,732 / drone 1,516 / warden 1,556 / flyer 1,770 t; I509 remaster-4: hunter 3,366 / gunship v2 2,906 (I536) / sentry 2,934 / wasp 4,020 t; 8 ships 19,490 t; E69 new fleet I516/I517: phantom 2,336 / hauler 3,506 / bulwark 2,700 t, E72 remaster I533-I535 superseded to phantom v2 3,048 / hauler v2 3,920 / bulwark v2 3,160 t; 11 ships, all Blender 5.2.3 headless; I537 FLEET537 PASS + 1-char hauler sponsonR bind fix) - the mine stays procedural, 7 powerups, shield, 2 debris chunks, arena ring - loaded at runtime via GLTFLoader (src/render/assetLoader.js) with procedural fallback; everything else stays procedural: canvas textures, WebAudio-synthesized SFX

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
4. `npm run build` dist/ total stays under 6,100,000 B (ceiling; I516/ST-482 E69 renegotiation WITH MEASUREMENT from 4,700,000 per the E69 scope-check §5 / enemy spec I7 pre-registration (6,100,000 B pre-registered for the E69 asset growth, applied early at the first E69 asset landing per the pre-registered rule): measured 4,956,989 B / 177 files (I516: +phantom 183,724 B +bulwark 149,884 B); chain 3,747,372 (I507) -> 4,190,132 (I508 legacy-4) -> 4,623,044 (I509 remaster-4) -> 4,623,381 (I511) -> 4,956,989 (I516) -> 5,254,934 (I518-I522, code-only growth) -> 5,255,258 (I525, +326 B payload telemetry tags) -> 5,255,796 (I529, +538 B cockpit crosshair DOM/CSS) -> 5,286,640 (I533 phantom v2, +30,844) -> 5,326,496 (I534 hauler v2, +39,856) -> 5,367,196 (I535 bulwark v2, +40,700) -> 5,383,468 (I536 gunship v2, +16,272) -> 5,542,040 (I541 ship v7 swap, +158,572) -> 5,542,040 (I542 G73.0 gate, code-only); CLOSE FLOOR E73 = 557,960 B measured at G73.0 (I542: 6,100,000 - 5,542,040; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked); prior: CLOSE FLOOR E72 = 716,532 B measured at G72.0 (I538: 6,100,000 - 5,383,468; headroom >= 102,400 B floor -> cut ladder C1..C3 NOT invoked); prior: CLOSE FLOOR E71 = 844,204 B measured at G71.0 (I531: 6,100,000 - 5,255,796; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked); prior: CLOSE FLOOR E70 = 844,742 B measured at G70.0 (I527: 6,100,000 - 5,255,258; headroom >= 102,400 B floor -> cut ladder C1..C3 NOT invoked); prior: CLOSE FLOOR E69 = 845,066 B measured at G69.0 (I522: 6,100,000 - 5,254,934; headroom >= 102,400 B floor -> cut ladder C1..C5 NOT invoked); prior: I510/ST-476 E68 from 3,850,000 WITH MEASUREMENT 4,623,044 B / 175 (I509) [CLOSE FLOOR E68 = 76,619 B at G68.0]; I501 ST-467 from 3,650,000 = 3,747,372 B / 175).
5. Vendor pins (dist-minified sha256 first-16, r187): three.module.js A65DE049A7F38B40 + three.core.js 7AB0784CD2532367 + three.webgpu.js F549248412C62B9A + three.tsl.js 7FF9ACF50F006017. (Pre-E66 r160 ref 76DEA8151BC9352A is obsolete.)
6. Regressions: `node .evidence/I495/causal495.mjs` (dist server :4200) -> 'CAUSAL495 PASS' (3 arms: webgl + default EXACT on the seed-9876 pin set; webgpu report-only) and `node .evidence/I491/playframe491.mjs` (dev server :5173) -> 'PLAYFRAME456 PASS' (A 22/32,717 + 11/180, B 52/69,272 - re-pinned WITH MEASUREMENT at I541 for ship v7: A 25,781 -> 32,717 = +6,936 ship tris (fx=off single pass); B 55,400 -> 69,272 = +13,872 = 2x (fx=high 2-pass scene); A previously re-pinned at I501 for ship v6 and at I497 for the I494 r187 ConeGeometry degenerate-tip-tri skip) must stay EXACT - re-pin WITH measurement only when a shipped mesh/geometry changes; plus `node .evidence/I491/pwa491.mjs` (dist server :5199) -> 'SUMMARY 11/11' (SW + manifest + offline boot - the 5th harness of the G69.0 gate set per the E69 scope-check).
