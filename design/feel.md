# Feel & camera juice - Void Runner

Tuning home for feedback effects: screen shake, camera punch, hit-stop,
FOV kick, damage vignette. All tunables live in src/core/config.js
(CONFIG.fx / CONFIG.music); this doc records the intent behind each
system and the evidence for each change.

## ST-175 unified screen-shake table (I175)

### Combat Goal
Every screen-shake strength is tuned from one data-driven table in
CONFIG (CONFIG.fx.shakeTable). Before ST-175 the juice dispatch carried
six hardcoded shake.trigger(0.x) literals plus two config values
(scattered over 8 events), so feel tuning meant code archaeology and the
ST-179 balance pass had no single surface to work on. Behavior preserved
exactly: same 8 events, same values.

### Tuning
- CONFIG.fx.shakeTable (src/core/config.js, replaces shakeHit/shakeBomb):
  | event | energy |
  |---|---|
  | hit | 0.5 |
  | bomb | 1.0 |
  | mineExplode | 0.4 |
  | droneExplode | 0.35 |
  | bossSpawn | 0.7 |
  | bossDeath | 1.0 |
  | wardenSpawn | 0.5 |
  | wardenDeath | 0.8 |
- Envelope unchanged (CONFIG.fx.shake = 1 master, shakeDecay = 6,
  shakeAmplitude = 0.5): the table holds per-event energy, the
  envelope shapes it (max-stacking, exponential decay, 0.002 settle).
- src/core/shakeTable.js (new, pure, DOM-free): shakeEnergy(type, table)
  - one lookup; 0 for unmapped events or invalid tables/entries
  (negative, NaN, non-number).

### Feedback
- 8 juice call sites (src/main.js) - mineExplode, droneExplode,
  bossSpawn, bossDeath, wardenSpawn, wardenDeath, hit, bomb - now call
  shakeEnergy('<event>', CONFIG.fx.shakeTable). Non-shaking events
  (droneDecay, beltHit, rockShieldHit, shieldPop, pickups, ...) have no
  table row and shake 0 by construction.
- Probes: __vr.shakeEnergy(type), __vr.shakeMag() (current energy 0..1).

### QA Scenario
- Unit (tests/shakeTable.test.js, 9 tests): key set is exactly the 8
  events; value preservation vs the pre-ST-175 call-site values; values
  in (0, 1]; unknown events -> 0; invalid tables -> 0 (no throw);
  invalid entries -> 0; explicit-0 entry; integration with createShake
  (table energy feeds the envelope, max-stacking, master scale);
  master 0 no-op.
- Browser smoke ?nocache=175a (real Enter keypress -> PLAYING, ship
  invulnerable, settle loop): probe table matches all 8 values exactly;
  unknown -> 0; emit droneExplode + advance(0.05) -> magnitude 0.25929
  (= 0.35*exp(-6*0.05), the exact decay model); emit hit + advance ->
  0.37041 (= 0.5*exp(-6*0.05) - proves max-stacking re-peak; additive
  would give ~0.56); settles to exactly 0 after 18 advances. Console
  0 errors / 0 warnings; NaN scan (ship + 6 rocks) 0; screenshot
  .evidence/I175/I175_1_shake_table.png.

### Changed files
- src/core/config.js - shakeHit/shakeBomb replaced by shakeTable
- src/core/shakeTable.js - NEW pure lookup
- src/main.js - import, 8 call sites, 2 probes
- tests/shakeTable.test.js - NEW (9 tests)
- design/feel.md - NEW (this doc)

### Risks
- None material: behavior-preserving (identical values), pure lookup,
  no new nodes/timers/sim changes. The table is the single tuning
  surface for the ST-179 feel balance pass; future shake events get a
  table row, not a new literal.

## ST-176 damage vignette, reduced-motion aware (I176)

### Combat Goal
Under reduced motion, per-hit damage feedback must exist without motion or
strobe. Before ST-176 a hit with reduced motion produced zero vignette or
flash feedback (the juice spike and the #flash burst are motion-gated) -
only the steady last-life tint (0.55) existed. ST-176 adds a
reduced-motion-only steady-then-fade damage vignette: same severities as
the I85 juice (0.6 normal / 1.0 last life), opacity only, no flash, no
positional motion. Motion-ON behavior is unchanged (the juice spike +
flash stay as they were; the new path is simply not armed).

### Tuning
- CONFIG.fx.dangerVignette = { hold: 0.5, fade: 0.5 } - hold the hit
  severity for 0.5s, then fall linearly to 0 over 0.5s (1.0s total).
- src/core/dangerVignette.js (new, pure, DOM-free): dangerVignetteX(t,
  hold, fade) - the steady-then-fade multiplier (1 -> 0); 0 for invalid
  hold/fade; fade = 0 degenerates to a pure step; hold = 0 to a pure fade.
- Severities mirror the I85 juice: 1.0 on the last-life hit, 0.6 otherwise.

### Feedback
- Armed in the state-always-advances chain (the same line as the I174
  death-warp arm) and ONLY when motionOff: hit -> _rmHitT = 0, _rmHitSev =
  severity.
- Decayed in the vignette render section, state-agnostic: the final hit
  plays through the GAME_OVER frames (the visual half of the I174 death
  beat).
- Composition: dangerOp = max(steady last-life 0.55, juice dangerA, rm
  steady vignette) - the same #vignette-danger element and the same
  change-cached opacity write.
- #flash (full-screen burst) stays motion-gated - it is the strobe-class
  effect the reduced-motion policy exists to kill.
- Probe: __vr.dangerOp() (current composed opacity 0..1).

### QA Scenario
- Unit (tests/dangerVignette.test.js, 10 tests): start/hold/fade/end
  values, negative-t clamp, monotonicity + [0,1] range, fade = 0 pure
  step, hold = 0 pure fade, invalid hold/fade -> 0, shipped CONFIG
  validity.
- Browser smoke part 1 ?nocache=176a (reducedMotion: true seeded in
  localStorage, then reload; real Enter keypress -> PLAYING): baseline op
  0 with shake 0; hit (lives 3) + advance(0.05) -> op exactly 0.6 (hold)
  with shake still 0; still 0.6 at t = 13/60 (hold); op 0.54 at t = 33/60
  (mid-fade = 0.6*(1-(0.55-0.5)/0.5)); settles to exactly 0; a fresh
  last-life hit window runs exactly 60 advances (1.0s), peak exactly 1.0,
  end exactly 0; final-death hit (lives 0) peaks at 1.0 and decays fully.
  Console 0 errors / 0 warnings; NaN scan 0; screenshot
  .evidence/I176/I176_1_damage_vignette_hit.png.
- Browser smoke part 2 ?nocache=176b (reducedMotion: false): hit +
  advance(0.05) -> op 0.576667 = 0.6 - 1.4*(1/60) exactly (the I85 juice
  linear decay - proves the rm path is not armed with motion on); shake
  fires (0.37041); baseline 0; settles to exactly 0. Console 0/0; NaN
  scan 0.

### Changed files
- src/core/dangerVignette.js - NEW pure envelope
- src/core/config.js - +CONFIG.fx.dangerVignette { hold: 0.5, fade: 0.5 }
- src/main.js - import, 3 states, arm line, vignette composition + probe
- tests/dangerVignette.test.js - NEW (10 tests)
- design/feel.md - this section

### Risks
- None material: reduced-motion-only path (zero motion-on change - proven
  by the part-2 smoke), opacity-only (no motion, no strobe), no new
  elements/nodes/timers.

## Next
ST-177 (I177): Particles: pickup burst + magnet trails.