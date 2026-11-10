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

## Next
ST-176 (I176): damage vignette (reduced-motion aware).