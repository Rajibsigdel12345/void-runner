# Balance Notes - Void Runner

Tuning changes that touch `src/core/config.js` (or GDD numbers) must be logged here with rationale. GDD `design/gdd.md` stays the authority.

## I21
- `powerup.types.rapid.rate = 2` — RAPID doubles fire cadence (GDD: "fire rate x2 for 8s"). Discrete-timestep effect: shot cycle 11 -> 6 steps at 60Hz (≈1.83x realized shots/s vs theoretical 2x); acceptable arcade feel. Revisit at I34 if it feels weak against wave-4+ concurrency.
- SPREAD uses existing `count: 3, arc: 0.35` (GDD: "3-way shot"); no new values.
## I22
- SHIELD absorbs exactly 1 hit (GDD line 54). Design decisions made in resolveShipRocks:
  - an absorbed hit does NOT break the combo chain (GDD resets combo on damage; absorption is not damage)
  - an absorbed hit grants NO invuln window — a second overlapping rock on the next frame costs a real life (shield is one-hit by design)
  - rock still shatters on absorption (same field.destroy path as a normal hit)
## I23
- BOMB shatter-all: each on-screen rock scores as a kill, feeding the combo chain (same-frame multi-kill multiplier ramp, e.g. 3 rocks = 1.0x/1.1x/1.2x). No fragments spawn (total shatter via field.shatter). One power-up drop can still roll from the blast (22%/kill, maxActiveDrops=1).
  - Tuning note: a bomb on a full L-heavy field is a big score spike; acceptable per GDD ("counts as kills, feeds combo"). Watch for combo-spam with RAPID at I34.
- MAGNET bullet homing (GDD: "slight bullet homing for 6s"): weapon.homing { turn: 3 rad/s, range: 8 }. A full 180-degree reversal takes ~1.05s, so bullets only gently curve toward nearby rocks - they can be guided but not sharply redirected. Kept "slight" per GDD; revisit at I34 if it feels like a free aim-assist.
## I34
- `combo.window 3.5 -> 4.0`: high waves mean more travel between scattered rocks; 3.5s punished pure positioning (dodge) time. 4.0 keeps chains alive without trivializing. GDD lines 11/48 updated to 4s.
- `powerup.dropChance 0.22 -> 0.25`: power-ups are the main sustain/mitigation lever; a slightly higher drop rate eases the mid-wave sustain gap. GDD line 51 updated to 25%.
- NEW `wave.spawnMinPlayerDist = 8`: rim spawns re-roll their angle (up to 6 attempts) to land at least 8 units from the ship. GDD line 40 says rocks spawn "outside visible area", but a rim spawn could land within ~3 units of a ship hugging the rim (unfair instant hit). Falls back to the first placement if all re-rolls are too close, so the concurrent cap keeps priority over fairness.
- Documented, no change: concurrent cap plateaus at 24 from wave 9, speedMult plateaus at 1.9 from wave 13 � deliberate headroom for I39+ tuning and E7 content.
## I39
- `wave.speedCap 1.9 -> 2.1` (balance pass 2): the primary ramp `1 + 0.06n` hit the cap at wave 13, so from wave 13 on difficulty grew only via rock COUNT (toSpawn = 4+n) - concurrency had plateaued at 24 since wave 9 and speed sat flat at 1.9x. Raising the cap to 2.1 extends the speed ramp to wave 18 and lifts late-game S-asteroid peak speed 11.0 -> 12.2 u/s, still below ship maxSpeed 14 (escape margin 1.8 u/s: pressure, not a wall). This is the counterweight to the I34 sustain buffs (combo window 4.0s, drop 25%): sustain got easier, so the late game gets faster. GDD "Waves & Difficulty" line updated to cap 2.1.
- Closed with analysis, no change (open revisit notes from I21/I23/I34):
  - RAPID realized rate (I21): fixed-60Hz substep quantization gives base = 60/ceil(10.9 steps) ~ 5.45 shots/s, RAPID = 60/ceil(5.45) = 10 shots/s -> 1.83x realized vs 2x theoretical. 91% of theoretical is imperceptible; chasing exact 2x would need an ugly rate=2.18 for +1 shot/s. Accepted.
  - MAGNET homing as aim-assist (I23): turn 3 rad/s at bullet speed 34 u/s -> turn radius ~11.3u > search range 8u, so bullets only bias their arc toward a rock and can never loop around. "Slight" per GDD, as intended. Accepted.
  - BOMB combo spike (I23): bomb on a full 24-rock field = 24 same-frame kills, combo ramps to cap (1.9x) instantly -> ~1866 pt spike (57.5 avg base x 24 x ~1.35 avg ramp). Bounded; GDD explicitly says bombs "count as kills, feed combo". Watch for score-exploit feel in the I41 playtest.
  - Concurrency cap (I34 headroom note): stays 24 - the rock renderer pool (24) and bullet pool (64) are sized to it; raising the cap is a pool/perf change that belongs to E7 (adaptive quality, I76+), not this pass.
- Ship vs late-game S-asteroid: maxSpeed 14 vs S@2.1 = 8.0-12.2 u/s - the player can always outrun an S, barely. Intended tension: escapable, never comfortable.
## I42
- `wave.stallTime: 45` (new; closes playtest F1): waves previously advanced only on full clear, so a camped field froze escalation forever (Run A farmed wave 1 for 180s, 1 hit). Now a wave also advances after 45s without a clear (stall advance): wave +1, toSpawn set for the new wave, leftover rocks carry (not deleted, not sped up), no intermission, timer reset. 45s is ~2x the skilled bot's early-wave pace (17-21s), so competent play never sees it; a player who stops clearing starts losing the escalation they were farming.
- Density is self-bounded: carryover rocks count against the concurrent cap 24 (same pool), so repeated stalls converge on a full field rather than unbounded growth; the spawn loop adds nothing while count == cap. No counterweight needed in this pass; watch compound stall-farming density in the I90 human playtest and revisit at I92 (balance pass 4) if it feels strong.
- No new RNG draws, no speed change: stall advance is pure timer logic (deterministic under seeded step). GDD "Waves & Difficulty" updated (advance rule + carryover + skipped intermission).
## I51 - wave modifiers (ST-051)
- FAST: x1.4 spawn speed on top of the ramp (effective max ~2.94x at wave 18+).
  Watch: combined with dense waves (concurrent 24) fast waves feel aggressive; if
  playtest v2 (I90) shows clustering complaints (F2), first retune fastSpeedMult 1.4 -> 1.25.
- SMALL: 50% S spawns (baseline 30%). S rocks do not split, so small waves drain faster -
  pairs with the stall-time safety net (I42).
- INWARD: 2.0 u/s^2 center pull keeps late-game rocks from camping the rim; rim reflection
  bounds the displacement.
- Selection: 1/3 each, pure function of (world seed, wave) - no RNG stream perturbation,
  so existing seeded test streams are unaffected.
## I52 - golden asteroid (ST-052)
- chance 0.05 per eligible rim spawn: at concurrent 12-24 with ~6-12 live spawns per wave
  the expected goldens per wave is low (0.3-0.6); a run of 1-3 goldens per 3 waves feels
  rare-but-regular. Watch: if playtest v2 (I90) reports "never see one", bump 0.05 -> 0.08.
- speedMult 1.35 on top of the ramp (wave 3: 1.18x1.35 = 1.59): chaseable early, spicy late
  (ramp 2.1 -> 2.84x at wave 18+) - intentional: goldens in dense fast waves are the risk
  reward the GDD promises. Watch: late-game goldens may be near-unavoidable; retune down
  to 1.2 before I92 if clustering complaints (F2) persist.
- scoreMult 5: a golden M = 250 (plain S = 100), so one golden is worth 2.5 small rocks -
  strong but not game-breaking vs the combo cap (1.9x); no separate drop/loot hook yet.
- minWave 3 keeps the teaching waves (1-2) visually clean; splits are never golden so the
  5x cannot chain through fragment storms (max 1 golden per rim spawn).
- No new RNG draws beyond one chance() per eligible spawn (shared world stream - seeded
  streams shift from this point; pinned tests use their own seeds). Determinism preserved.
## I53 - near-miss bonus (ST-053)
- +15 flat per graze (no combo multiplier): at dense waves (12-24 rocks) a skilled weave can
  pick up 3-8 grazes/wave = 45-120 pts/wave vs ~300-600 kill pts - meaningful (10-20%) but
  never dominant. Watch: if I90 playtest shows grazes feeling like noise (too frequent),
  tighten radius 2.6 -> 2.2 before I92.
- spawnImmunity 0.3s closes the split-farm: fragments born inside the ring (parent killed
  near the ship) cannot score until they have actually travelled - verified in game.test.js
  (its original 25-pt expectation still holds; 3 fragments at (3,0) would have added 45).
- One award per approach + rearm at radius x 1.6: a rock can score at most twice per orbit
  around the ship; camping the ring is not possible (the ship is the ring's center and the
  rocks keep moving).
- Suppressed while invulnerable: post-hit frames are chaos - awarding grazes there reads as
  luck, and a rock that hit the ship is destroyed anyway.
- Swish cue is low-gain (0.09) with 0.15s min gap so a busy frame never stacks more than ~7/s.
## I54 - mine drones (ST-054)
- 1/wave from wave 5, cap 10: by wave 14 a fully passive player is capped at 10 live mines -
  the cap turns the threat from linear into a plateau, so late waves add pressure without
  turning the arena into a minefield. Watch: if I90 playtest shows mines feeling like 'just
  more rocks', consider perWave 2 from wave 12 before I92.
- speed 3.2 vs ship 14: even a stationary ship outruns a mine 4:1; the threat is attention,
  not speed - mines punish ignoring the edge of the screen. turn 1.6 rad/s makes their path
  a readable slow curve (no instant 180s), which is what makes them dodgeable-feeling rather
  than unfair.
- score 150 (> S=100): killing the thing that hunted you is the highest single-kill reward
  in the game (next: boss in ST-055). Feeds the combo so clearing a mine mid-chain is strictly
  good - no penalty for the risk.
- No split/fragment behavior: mines are atomic. No power-up drop on mine kill (they are the
  hazard, not the loot source - drops stay rock-gated).
- Determinism: spawn bearing + initial wobble come from the world RNG stream (like the
  golden roll), homing is a pure state function - pinned-seed trajectory test guards it.
## I55 - monolith boss (ST-055)
- HP 40 = 7.3s of sustained base fire (5.5 shots/s) or 3.6s under RAPID (11 shots/s): a boss fight
  is a 5-15s commitment, not a nuisance. 1 dmg per bullet keeps the kill purely skill/timing
  gated (no crits, no weak points yet - enemy bullets in ST-056 add the dodge-while-firing loop).
- Ring of 8 S every 2s: a 7.3s base-fire kill lets ~3 rings out (24 S rocks); a cautious 15s
  fight lets ~7 out (56). The field's maxConcurrent (24) is the safety net - late rings skip
  rocks when the field is full, so pressure plateaus instead of snowballing. Density interaction
  (boss + ring + wave content + mines all on wave 5/10) is flagged for the I90 playtest.
- score 1000 = the headline number, ~5-10x a wave's worth of kills: killing the thing that
  dominated the screen must feel like a wave-clear. Feeds the combo (a 40-hit chain caps the
  multiplier, so the last kills pay the most - risk is rewarded).
- Contact fairness: boss contact uses the same 1.6s invuln as rocks (F2 watch item). With a
  ring + boss + dense wave on screen, invuln-window fairness matters more here than anywhere
  else - carried to I90/I92.
- Determinism: spawn bearing comes from the world RNG stream (re-rolled if <10u from ship);
  homing is a pure state function; ring geometry is deterministic (angle = i/ringCount*2pi);
  the pinned-seed trajectory test (seed 58) guards the whole system.

## I56 - enemy bullets (ST-056)

- Boss bolt: one per 2.2s (roughly 3-4 shots over a 7.3s base-fire kill of the 40 HP boss; 9 u/s
  means >=1.5s reaction time from 10u).
- Mine bolt: only within 7u, 3s cadence (up to ~3.3 shots/s with 10 mines = swarm pressure; 8 u/s).
- Cap 24 concurrent bolts; 4.0s life; culled at rim+2.
- Straight-homing mines never fire before contact (fireEvery 3.0 > time-to-contact for any d<7u) -
  they fire when kited/deflected, which is intentional: the bolt threat is on sustained dodging.
- 1 bolt = 1 life, same 1.6s invuln (F2 watch item now sharper: dense bolts + rocks + rings).
- Bullets cannot be shot down (out of scope; note as follow-up candidate).
## I57 - overdrive (ST-057)

- Effect: 2x score for 6s (kills, combo multipliers, flat near-miss bonuses).
- Drop rate: per-type drop prob 25% -> 16.7% (six types now); base dropChance/kill unchanged.
- Math: overdriveMult is multiplicative AFTER the combo multiplier - kill = floor(base * comboMult * odMult); flat bonus = floor(pts * odMult).
- Refresh: re-pickup resets the timer to a full 6s; timers never stack.
- Boundary: a kill resolved in the same step the timer hits 0 still pays doubled (world syncs overdriveMult before powerup timers decay).
- No new hazards; no changes to lives, waves, or other power-ups.

## I58 - endless curve (ST-058)

- contentCap 36: the 4+wave ramp would hit the cap at wave 32, so waves 10-31 scale exactly as pre-endless; only wave 32+ feel the ceiling.
- intermission 2.2s -> 1.2s floor at 0.08s/wave: 1.24 at wave 22, floor reached at wave 23 - pacing pressure without ever removing the beat between waves.
- S-share 0.30 -> 0.45 cap at 0.02/wave, capped by wave 18 (0.44 at 17, 0.45 from 18 on).
- L:M ratio stays 3:4 inside the non-S bucket, so waves 1-9 are byte-identical in behavior to pre-I58 (existing tests pass unchanged).
- Mines (1/wave from 5) and the boss (every 5) are already endless; the curve only adds rock-side pressure - no new hazards, no changes to lives or power-ups.

## I59 - gravity vortex (ST-059)

- pullShip 2.4 u/s^2 ~= 9% of ship.accel (26): the ship out-muscles the pull 10:1; terminal drift under damping ~= 1.5 u/s - noticeable, never punishing.
- pullRocks 1.6 u/s^2 across the 4.5s phase: a rock parked at the center gains up to ~7 u/s; typical transit through the 11u radius is 2-3s, so most rocks gain 3-5 u/s of inward drift. The vortex clumps and funnels; it does not freeze the field (rocks have no damping, so this stays bounded by the phase length).
- firstWave 8: mines (5) and the boss (5) are learned first; the vortex lands just before the endless curve (10) tightens the wave pacing.
- Spawn safety: disk fully inside the arena (center <= 11u from arena center) and >= 6u from the ship at telegraph. The 1.0s telegraph is longer than the ~0.8s a top-speed ship needs to exit the disk from its center - the pull is always avoidable.
- Interval 12-20s seeded from the world RNG: deterministic per seed, no overlap possible (single state machine).
- No changes to lives, scoring, power-ups, or waves; no new damage sources.

## I60 - presentation pass (ST-060)

- Presentation-only iteration: no new tunables in src/core/config.js, no changes to damage, scoring, waves, or power-ups. 175/175 tests unchanged.
- Starfield twinkle (per-star 0.72-1.0 brightness, 0.5-2.2 rad/s) and parallax offsets (near 0.25x / far 0.6x camera) live in src/render/starfield.js, not config - they are visual, not balance, levers.
- Rock rim light (fresnel strength 0.5, #5f7fd8) lives in src/render/asteroidRenderer.js via a single shared material onBeforeCompile - one shader program, no per-rock draw-call cost. Golden material is untouched.

## I61 - bullet trails (ST-061)

- Presentation-only: no config tunables, no changes to fire rate, damage, scoring, or any core rule. 175/175 tests unchanged.
- Trail length (1.15u) and thickness (0.16) live in src/render/bulletPool.js, not config - they are visual, not balance, levers.
- Cost: one additive ribbon per active bullet (+1 draw call each, bounded by weapon.maxBullets=64). Steady state at ~6-8 live bullets is a few calls; verified 26 total in a 6-bullet test scene vs the 15-call I60 baseline (no bullets). Shared geo + one material for all trails; zero per-frame allocs (preallocated basis + scratch vectors).
