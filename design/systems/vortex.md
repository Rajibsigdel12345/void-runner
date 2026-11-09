# Vortex System - reverse-engineered design (ST-094 / I94, cgs-reverse-document)

> Reverse-documented from the shipped implementation; nothing below is invented. Behavior is quoted from source and unit tests. Unverified points are listed under Unknowns, not mixed with evidence.

## Summary

A gravity vortex is a periodic pull field that appears mid-arena from wave 8. It telegraphs for 1.0s, then bends rocks and the ship toward its center for 4.5s, then disarms and re-rolls. It is a pressure hazard, not a damage source: it adds velocity toward the center but never deals damage and is always counterable (the ship pull is ~9% of ship accel). It is pure core logic (no DOM/three) driven by the World, with a presentation-only FX layer and SFX.

## Observed Behavior

### Phase machine (src/core/vortex.js)
Four phases, advanced by `VortexField.step(dt, ctx)` with `ctx = {wave, shipPos, rocks}`:
- `idle` (scheduling): if `eligible(wave)` is true, `nextIn -= dt`; when `nextIn <= 0` it calls `spawn(ctx)`. `eligible(wave)` is `wave >= cfg.vortex.firstWave` (= 8).
- `telegraph` (warning): `timer -= dt` (starts at `telegraph` = 1.0). At `timer <= 0` it flips to `active`, sets `timer = duration` (4.5), and emits a `vortexStart` event with the center `pos`.
- `active` (pull): `timer -= dt`. Rocks strictly inside the radius are accelerated toward the center; the ship, if strictly inside, yields a pull vector the World applies. At `timer <= 0` it returns to `idle`, emits `vortexEnd`, and `rearm()`s.
- `rearm()` re-rolls `nextIn = rng.range(intervalMin, intervalMax)` (12..20s) from the seeded RNG, so the inter-vortex gap is deterministic per seed.

### Pull model (constant magnitude, inside-radius only)
- Rocks: for each non-dead rock with distance `d = hypot(pos - rock)` strictly `d < radius` and `d > 0`, the code computes `s = (pullRocks / d) * dt` and adds `dVec * s` to `rock.vel`. Because `|dVec| = d`, the added velocity magnitude is `d * (pullRocks/d) * dt = pullRocks * dt` - i.e. a **constant-magnitude** acceleration of `pullRocks` (1.6) u/s^2 pointing at the center, independent of how far inside the rock is.
- Ship: with `sd = hypot(pos - shipPos)` strictly `sd < radius` and `sd > 0`, `step()` returns `pull = {x: sx*s, y: sy*s}` with `s = pullShip/sd`, so `|pull| = pullShip` (2.4) u/s^2 toward the center (again constant magnitude). When the ship is outside the radius or the vortex is not `active`, `pull` is `null`.
- `pullRocks`/`pullShip` are accelerations; the World multiplies by `dt` when integrating.

### World integration (src/core/game.js)
- Line 86: `const vt = this.vortex.step(dt, { wave: this.waves.wave, shipPos: this.ship.pos, rocks: this.field.rocks })`.
- Line 87: every `vt.events` entry is re-emitted through the World event bus.
- Lines 88-93: if `vt.pull` is present, `ship.vel += pull * dt`, then the ship speed is clamped to `cfg.ship.maxSpeed` - so the vortex can push the ship around but cannot exceed maxSpeed in a single step.
- Line 386: `this.vortex.reset()` on game restart (phase->idle, pos->(0,0), pending cleared, rolls=0, rearm).

### Spawn placement (fair + deterministic)
`spawn(ctx)` picks a center so the full disk fits the arena and stays away from the ship: `R = cfg.arena.radius - cfg.vortex.radius - 4` (= 26 - 11 - 4 = 11). It rolls `a = rng.next() * 2*PI` and `d = rng.next() * R`, giving `pos = (cos(a)*d, sin(a)*d)`, and re-rolls (up to 10 tries) while `hypot(pos - ship) < minDistFromShip` (= 6). It then sets `phase = telegraph`, `timer = telegraph`, `rolls += 1`, and emits `vortexTelegraph` with `{pos, in: telegraph}`.

### Events emitted (three)
Order per cycle is always `vortexTelegraph` -> `vortexStart` -> `vortexEnd`, each carrying `data.pos` (and `in` for the telegraph). They are queued in `pending` and drained once per `step` via `drain()`.

### Presentation + audio (render layer, presentation-only)
- `src/render/vortexFx.js` mirrors the phase machine (telegraph -> active -> fade) using a generated 3-arm spiral canvas texture (no image asset). It exposes `onTelegraph(pos)`, `onStart(pos)`, `onEnd()`, `update(dt)`, `hide()`.
- `src/main.js`: on `vortexTelegraph` it fires a motion-gated particle burst + `vortexFx.onTelegraph`; on `vortexStart` `vortexFx.onStart`; on `vortexEnd` `vortexFx.onEnd`. `vortexFx.hide()` on pause/quit. `vortexFx.update(dt)` runs only in `STATE.PLAYING` (frozen while paused).
- SFX cues map `vortexTelegraph -> 'vortexTelegraph'` and `vortexStart -> 'vortexStart'` (main.js:122).

### Config (src/core/config.js:117-130)
- `firstWave: 8`, `intervalMin: 12`, `intervalMax: 20` (s, seeded), `telegraph: 1.0`, `duration: 4.5`, `radius: 11`, `pullRocks: 1.6` (u/s^2), `pullShip: 2.4` (u/s^2), `minDistFromShip: 6`.

## Evidence Path
- src/core/vortex.js (96 lines) - the whole phase machine, pull math, spawn placement, events.
- src/core/config.js:117-130 - all tunables.
- src/core/game.js:86-93 (step + pull + maxSpeed clamp), :386 (reset on restart).
- src/main.js:14,90,122,375-379,432 (render + SFX + pause gating).
- src/render/vortexFx.js (presentation-only FX, generated texture).
- tests/vortex.test.js (6 tests, seeds 71-76): config sanity; no telegraph before firstWave; rock pull inside / none outside with magnitude = pullRocks*dt; ship drift clamped at maxSpeed; telegraph->start->end order + exact durations + in-band rearm; full-world cycle (no pull during telegraph, net drift toward center while active). All pass.

## Unknowns
- Rocks have no damping in the vortex model (the config comment says the pull is "bounded by the 4.5s phase"); the exact steady rock speed after a full 4.5s active window is not asserted by a test - inferred as `pullRocks * duration` = 1.6 * 4.5 = 7.2 u/s of added drift in the worst case, not verified.
- Whether the vortex ever engages during a wave-modifier wave (e.g. 'inward drift') and how the two inward forces compose is not tested together; the vortex uses its own pull and the wave mod is a separate system, so they simply add - inference, not a test.
- The `activateAt(x, y)` hook is described as a "test/future hook"; it is used by tests (seed 74) but has no shipped gameplay caller - its production use is unverified.
- The FX spiral texture's exact on-screen size/opacity envelope (update/hide curves) was not re-derived here; only its presentation-only role and generated-texture nature are asserted.

## Documentation Draft
This file is the draft. It is a bounded technical design doc for one system (the vortex), written only from source + tests. It intentionally does not touch the balance/UX decisions, which live in production/balance-notes.md and design/ui-ux-review.md.

## Risks
- Constant-magnitude pull (not inverse-square) means a rock just inside the edge is pulled exactly as hard as one near the center; if a future balance pass expects stronger center focus, this is the place it will surprise. Flagged here so it is a conscious choice, not an accident.
- The 10-try spawn cap means in an extreme cornered-ship case the vortex could place a center nearer than minDistFromShip if all 10 rolls fail the ship-distance test; low probability, not currently asserted as a safety bound.
- Docs and code could drift if tunables change; the config line-range cited above (117-130) is a snapshot.

## Changed files or proposed files
- Added: design/systems/vortex.md (this file).
- No source or test changes in this iteration (docs-only reverse-document).

## Verification evidence
- node --test tests/vortex.test.js: 6/6 pass.
- Full suite still green: 233/233 (unchanged, no code touched).
- No build change required (docs-only); build remains exit 0.

## Next owner or decision
- Next: I95 cgs-perf-profile (the systems-map still lists S24 "Perf pass" as the relevant P3 item; a fresh profile of the E7 feature set - boss/mines/vortex/enemy-bullets - is the natural follow-on).
- Open decision (not blocking): whether to add a steady-state rock-speed assertion for the vortex worst case (see Unknowns). Owner: gameplay_programmer if pursued.
