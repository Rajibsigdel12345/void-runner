# Void Runner

3D arcade survival shooter (Asteroids-style) built with **three.js**.
Art: five low-poly Blender-made GLBs (ship, three asteroid sizes, boss) loaded at runtime with a procedural fallback; everything else procedural - canvas textures, WebAudio-synthesized SFX and music.

## Quick start

```
npm install        # installs three + vendors it for import-map usage
npm run dev        # dev server -> http://localhost:5173
npm test           # unit tests (node --test) against the DOM-free core
npm run build      # production build -> dist/
npm run preview    # serve the build -> http://localhost:4173
```

No bundler: the app runs on ES module import maps over vendored modules
(`npm run vendor` copies three into the project). See `scripts/` for the
serve/build/test/vendor entry points.

## Controls

| Input | Action |
| --- | --- |
| W A S D / Arrow keys | thrust |
| Mouse | aim (ship nose eases toward the cursor) |
| Left mouse button / Space | fire |
| Enter | start / restart |
| P or Esc | pause / resume |
| R / Q | restart / quit (from pause) |
| M | mute (session) |
| F | toggle FX quality (high/low; persisted) |
| N | toggle music bed (persisted) |
| O | record this run (watch it back at game over) |
| 1 / 2 / 3 | replay speed x1 / x2 / x4 (during a replay) |

Basic touch fallback: tap = fire, drag = thrust, two-finger tap = pause.

## Gameplay

Waves of asteroids in a bounded 3D arena (rock wall reflects, nothing escapes).
Combo-based scoring with a 4-second chain window; random power-up drops
(rapid fire, spread shot, shield, magnet, bomb). 3 lives with post-hit
invulnerability. Boss waves from wave 5: THE MONOLITH / THE SPLICER
alternate with WARDEN armored escorts; mine + seeker drones and a periodic
gravity vortex. Daily seeded runs (one shared seed per calendar day) and a
reproducible shareable result code. Record any run with O and watch it back at game over - a deterministic replay of the input tape - at 1/2/3 speeds. Settings (volume, SFX, FX quality, reduced motion) and best
score persist in localStorage. A fire-line reticle shows the actual firing
direction.

## Layout

- `src/core/` - pure game logic. No three.js, no DOM: unit-testable, deterministic (seeded RNG in `rng.js`).
- `src/render/` - three.js + DOM rendering layer (meshes, pools, HUD, screens, audio).
- `src/main.js` - boot, scene/camera, game loop, core<->render wiring, `__vr` debug handle.
- `tests/` - `node --test` unit tests for core modules.
- `design/` - GDD, systems map, brainstorm.
- `assets/` - Blender-made GLB models (loaded at runtime; copied into dist/ by the build).
- `production/` - epics, stories, iteration log, QA plan, gates, playtest report, balance notes.
- `docs/architecture/` - architecture notes + code review.

## Docs map

- Game design: `design/gdd.md` (authority on tunables and rules)
- Architecture: `docs/architecture/README.md`
- Iteration history: `production/iterations.md` (one entry per iteration, I01+
- QA: `production/qa-plan.md` (suites A/B/C) and `production/gates.md` (gate verdicts)
- Balance: `production/balance-notes.md`
- Art: `design/art-bible.md` (identity), `design/asset-spec.md` (asset rules), `design/art-direction-research.md` (improvement levers)
- i18n plan: `design/i18n-strings.md`
- Perf: `production/perf-profile.md` (WebGL) + `production/perf-ui-text.md` (DOM/UI)
- Playtest: `production/playtest-report.md`

## Dev / debug

- `?fps=2` URL param shows the FPS / draw-call / triangle meter.
- `window.__vr` exposes the world + helpers (advance, eventTally, storage, ...) for scripted probes and regression suites.
- Determinism: all randomness flows through the seeded RNG, so tests and
  scripted browser runs pin seeds and reproduce exact behavior.
