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

## I62 - shield pulse (ST-062)

- Presentation-only: no config tunables, no changes to shield duration, absorption, damage, or scoring. 175/175 tests unchanged.
- Breathing period (2.1s) and pulse-ring cycle (1.6s) live in src/render/shieldRing.js, not config - visual levers, not balance.
- Cost: one extra additive ring mesh, drawn only while the shield is active (occasional, short-lived). Verified breathing (scale/opacity oscillate over time) and a static ring under Reduced Motion (0.5 opacity, scale 1); 0 console.

## I63 - engine flame (ST-063)

- Presentation-only: no config tunables, no changes to acceleration, max speed, fire cadence, damage, scoring, or waves. 175/175 tests unchanged.
- Flame geometry (1.5u outer / 1.0u core), width (0.3u outer) and the flicker sines (0.8 + 0.2*sin(t*40) + 0.1*sin(t*77)) live in src/render/shipMesh.js, not config - visual levers, not balance.
- Cost: two extra additive cone meshes (plume + hot core), drawn only while thrusting (thrustMag > 0.05), so they are hidden when the ship coasts. Open-ended cones, depthWrite off, one material each; zero per-frame allocs.

## I64 - balance pass 3: new-content pacing (ST-064)

- Scope: pacing review of content added since balance pass 2 (I39): wave mods (I51), golden (I52), near-miss (I53), mines (I54), Monolith boss (I55), enemy bolts (I56), overdrive (I57), endless curve (I58), vortex (I59). Ship: accel 26, maxSpeed 14, damping 1.6, 3 lives, 1.6s invuln.
- Changed lever: boss.maxHp is now wave-scaled in the endless arc (hpFirstWave 10, +hpStep 12 per 5 waves, hpCap 88) via a pure bossHpForWave() in src/core/boss.js, threaded through spawnBossForWave(). Rationale: a fixed 40-HP boss every 5 waves is a ~7s vacuum focus (realistic ~10-15s) that becomes trivial by wave 15 once asteroid density (capped 36, rising S-share), mines (up to 10), and vortex pulls all ramp together - the 'big threat' beat the boss exists to provide was quietly disappearing in the mode that has no end. The cap (88 = 2.2x base) keeps every fight beatable; speed is untouched, so the boss stays 'always dodgeable' (we protect the dodge-math guarantee, not the damage number).
- Mines (I54/56): accepted. speed 3.2 vs ship 14 leaves a 10.8 u/s escape margin; turn radius speed/turn = 2.0u < fire range 7u, so a mine can loop the player but never catch them (chase-without-catch, the intended readable threat). perWave 1 / cap 10 ramps over waves 5-14; bolts are 8-9 u/s (ship 14) at 3.0s cadence, so in-range pressure is bounded.
- Vortex (I59): accepted. pullShip 2.4 is ~9% of ship.accel 26 - always counterable; the disk (radius 11) always fits the arena and telegraphs 1.0s (> the ~0.8s a top-speed ship needs to leave the disk from its center). Seeded 12-20s interval (single state machine) prevents overlap.
- Overdrive (I57): accepted as a *rewards* lever, not a threat lever - 6s of 2x score on a 25% drop. It raises the ceiling on the same hazards, so it cannot by itself create an unfair case.
- Endless curve (I58): accepted. contentCap 36 (base+growth would overshoot by wave 32) + intermission floor 1.2s + S-share 30%->45% keep pressure rising without unbounded totals; live count is still bounded by maxConcurrent 24 (density ceiling).
- Wave mods (I51): accepted. 'fast' (1.4x on top of the wave ramp) at high waves can push a rock past the I39 speed cap - a fast-S at wave 18 is ~2.1*1.4 = 2.94x base = ~17 u/s, above ship 14 for the brief window that rock is in the graze band. This is a *risk* beat (the whole point of 'fast'), mods are seeded per (seed, wave) so deterministic, and every mod wave is banner-announced. Watch in playtest I90 (the one open item).
- Near-miss (I53): accepted. Flat +15, no combo effect, rearm x1.6 + 0.3s spawn immunity close the kill-near-ship farm; score texture, not a difficulty lever.
- Golden (I52): accepted. 5% rim-spawn, wave 3+, 1.35x speed on the (capped) ramp, 5x score - a reward for rim aggression, bounded.
- Net: one new tunable family (boss.hpFirstWave/hpStep/hpCap) + a pure function; +2 unit tests (curve incl. cap, live wave-15 boss HP). 177/177. All other new-content values accepted with rationale above; the 'fast' wave mod is the single open watch item for the I90 playtest.

## I65 - menu polish (ST-065)

- Presentation-only: no config tunables, no gameplay, scoring, or pacing changes. 177/177 tests unchanged.
- The menu (src/render/screens.js) gains: a gradient + softly glowing 'VOID RUNNER' title (.vr-title, background-clip:text + a 3.4s drop-shadow pulse), a drifting nebula backdrop (two low-alpha radial gradients panning via background-position on the menu panel, 34s loop, with the live 3D starfield showing through the semi-transparent panel), the controls wrapped in a bordered rounded card, and a credits line pinned to the bottom.
- Reduced Motion: a .vr-reduced class on the #screens overlay (toggled from screenOpts.reducedMotion, which main.js feeds from motionOff) sets animation:none on the title glow and the backdrop drift. Verified computed animation-name is active (vrTitleGlow/vrMenuPan) with motion on and 'none' with motion off.
- Cost: pure CSS/DOM on a panel only shown in MENU - zero three.js render-layer cost, no per-frame allocs beyond the existing class toggle.

## I66 - top-5 high-score table (ST-066)

- Presentation/data: no gameplay, scoring, or pacing changes. 182/182 tests (177 pre-existing + 5 new storage tests).
- Added a persistent top-5 high-score board: localStorage key `voidrunner.scores`, payload {version, list:[{score, wave, kills}]}. Entries carry no timestamps (core determinism). Every read is guarded: corrupt JSON, non-array payloads, and malformed rows are filtered out; the board never throws (private-browsing safe).
- `Storage.getHighScores()` returns a validated descending list capped at `storage.highScoresMax` (5, CONFIG). `Storage.recordScore(entry)` returns {list, rank, newBest}: rank 1..maxScores or 0 when off the board; score <= 0 never touches the board; a throwing store degrades to in-memory result without an exception.
- Game over records the finished run with live wave + kills (main.js, from world state); the MENU shows the board in a two-column grid (controls | TOP 5) with a 'no scores yet' placeholder. NEW BEST! (stored best raised) is unchanged.

## I67 - options panel polish (ST-067)

- Presentation/UX only: no gameplay, scoring, or pacing changes. 182/182 tests unchanged.
- The settings panel (src/render/settingsPanel.js) is restructured into two grouped cards (AUDIO: volume + SFX; VISUALS: FX quality + reduced motion) with labeled headers, a key-nav hint line, gold :focus-visible rings, and aria-labels on all controls.
- Keyboard operability: Tab moves through the four controls natively; ArrowUp/ArrowDown move focus between the non-native controls (volume slider and FX select keep their native arrow behavior); Space/Enter still run native checkbox/select behavior. While any panel control holds focus, game hotkeys (Enter start, P/Escape pause, M mute, Space fire) are swallowed via stopPropagation so the player can adjust settings without side effects.
- Live FX preview: changing FX QUALITY fires a one-shot particle burst at the arena center using the NEW tier's count (low 16 / high 48), so the difference is visible immediately; applySettings (live re-derive) still runs first, so the burst already uses the new tier.

## I68 - pause overlay (ST-068)

- UX/flow only: no gameplay, scoring, or pacing changes. 186/186 tests (182 pre-existing + 4 new: PAUSED->MENU transition legality x2, world.quitToMenu reset + no-op-outside-PAUSED).
- The pause screen now dims the frozen scene more (0.55 -> 0.74 alpha + soft blue vignette) and offers three explicit actions: RESUME (P/Esc/Enter), RESTART (R), QUIT TO MENU (Q). Each is a DOM button (mouse) with hover/active/focus-visible styling, arrow-key focus moves within the row, and a hotkey guard so a focused button's action wins over the window-level key handler.
- State machine gains PAUSED -> MENU (quit); world.quitToMenu() performs the transition + full system reset and is a no-op outside PAUSED. RESTART from pause reuses the GAME_OVER restart path (reset + begin).
## I69 - game-over stats + new-best celebration (ST-069)

- Presentation/juice only: no gameplay, scoring, or pacing changes. 186/186 tests (no new unit tests - render/main wiring only). No new config tunables.
- The game-over stats panel (existing kills/wave/combo/time from ST-031) now also shows this run's BOARD RANK #N, derived from the persistent top-5 board via storage.recordScore().rank (I66 high-score data).
- A NEW BEST run fires a three-colour confetti burst at the ship position - gold 0xffd27a (count = fxCount tier), cyan 0x7fd0ff and magenta 0xd87fd8 at offset corners (count = ceil(fxCount*0.6), speed 6, life ~1.0s) - and the NEW BEST! line pulses (vrBestPulse 1.2s ease-in-out infinite). Confetti count scales with the current FX tier (particleHigh/particleLow).
- Reduced Motion: no confetti burst and the NEW BEST! pulse is disabled (static line), per the .vr-reduced overrides. The board rank line is always shown (data, not motion).

## I70 - accessibility: power-up letter glyphs, focus ring, font scale (ST-070)

- Accessibility/presentation only: no gameplay, scoring, or pacing changes. 187/187 tests (186 pre-existing + 1 new: storage fontScale default/validation/round-trip).
- No config tunables added. fontScale lives in storage DEFAULT_SETTINGS (not config) and is validated against the allowed set FONT_SCALES = [1, 1.25, 1.5].
- Power-up letter badges: each of the 6 power-up types carries a letter (rapid R, spread S, shield H, bomb B, magnet M, overdrive O) rendered two ways - (a) an in-world billboard sprite floating ~0.72 above the pickup (pooled to 4 sprites, one shared CanvasTexture per type, zero per-frame allocs) and (b) an em-sized letter badge in the HUD chip.
- World letter sprites share 6 canvas textures (128x128) and are pooled (4) ahead of maxActiveDrops=1, so normally 0 extra draw calls and up to 4 only when 4 pickups are on screen.

## I71 - mobile/responsive HUD + touch pass (ST-071)

- Presentation/UX only: no gameplay, scoring, or pacing changes. 187/187 tests (render-only, no new unit tests; core untouched).
- No new config tunables: the viewport UI scale is DERIVED (fontScale x innerWidth/820, floored at 0.6, full at >=820px), a render constant in main.js, not a gameplay knob.
- Reuses I70's --vr-fs CSS var, now = fontScale x viewportScale, so every existing calc(Npx * var(--vr-fs,1)) in hud.js / screens.js / settingsPanel.js / tutorialHint.js becomes responsive with zero per-module edits.
- On-screen pause button is one pooled-free <button>, toggled only on state change in PLAYING on coarse pointers; the touch-aware tutorial hint swaps a single text node. Zero per-frame allocations.

## I72 - UI text pass: wording/typos/caps consistency (ST-072)

- Presentation/wording only: no gameplay, scoring, pacing, or behavior changes. 187/187 (render-only, no new tests; core untouched).
- Review scope: every user-facing string in the render layer (screens.js menu/paused/game-over, hud.js, settingsPanel.js, waveBanner.js, scorePopups.js, tutorialHint.js).
- Convention confirmed: labels/headings/titles/buttons = ALL-CAPS; menu tagline + credits line + control ACTION descriptions = lower-case (intentional, kept); aria-labels stay Title Case (screen-reader channel).
- Fix 1 (hud.js): live combo label was "3 CHAIN  1.3x" -> now "COMBO 3  x1.4". "CHAIN" was an outlier vs the canonical COMBO term (GDD Combo + game-over MAX COMBO); the multiplier now uses the multiplication sign (x) instead of a stray lowercase x, so no UI string carries a bare lowercase letter.
- Fix 2 (screens.js): game-over stat was "MAX COMBO x5" -> now "MAX COMBO 5". The lowercase x prefix was an ambiguous multiplication on a plain count and the only non-caps char in an all-caps stat line.
- Deliberately left: "M — MUTE (OFF)" em-dash, credit-line diamond separators, wave-banner middot, 4-space gaps between stat fields, and the touch ("fly the ship") vs keyboard ("thrust") control wording (clearer per input method).

## I73 - adaptive quality (ST-073)

- No gameplay/scoring/pacing changes: adaptive quality only touches the FX tier (particle count + bloom). 196/196 (9 new unit tests; core logic in pure module).
- New tunables in config.js: adaptive { windowSec 2.0, thresholdFps 45, confirmWindows 2 } - deliberately conservative: two full 2.0s windows below 45fps before dropping, so transient stutters (GC, tab refocus) never trigger it.
- Deliberately one-way automation (High -> Low only): re-enabling High is always a user choice via options (which also locks the automation for the session), avoiding an auto up/down flap loop.
- The auto downgrade is a RUNTIME visual change: it never writes to saved settings (localStorage stays as the user set them) - verified in browser (savedFx stayed "high" after autoLow).
- Cost: one accumulator + integer counters per frame in the rAF loop (PLAYING only); zero allocations, zero extra draw calls.

## I74 - pool/memory audit (ST-074)

- Audit scope: every per-frame path - core step (world/ship/weapons/asteroids/mines/enemyBullets/powerups/waves/boss/mine fields), the event system, and the render hot paths (main.js tick/frame/syncVisuals, particles, bullet/enemy/mine/powerup/rock pools, starfield, banners, HUD).
- Findings FIXED (unconditional per-frame allocs in hot paths):
  1. powerups.js update: `this.drops = this.drops.filter(!dead)` ran EVERY frame (new array + field reassign). Now an in-place compactDrops() guarded by some(dead) - same convention as asteroids/weapons/enemyBullets compaction; array identity is stable.
  2. game.js drainEvents: `this.events = []` allocated a new array every tick (even with zero events). Now a two pre-allocated buffer swap (this.events / this._eventSpare, incoming buffer cleared on swap) - zero steady-state allocations, returned array keeps its events, single-consumer contract unchanged (main.js + tests drain immediately).
  3. main.js camera: `ship.forward()` (default out = v2()) allocated a fresh {x,y} every frame. Now a module-level scratch (shipFwd) is passed in.
- Findings verified clean (no change needed): weapons/enemyBullets/asteroids already use guarded in-place compaction; all render pools are pre-allocated (Float32Array particle pool, fixed mesh pools); hudOpts/screenOpts are reused objects; waveBanner/scorePopups allocate only on state change; bombBlast slice() is a rare event path (documented in code); storage spread-objects are event-level (user action / game over), not per-frame.
- Cost after fixes: steady-state per-frame JS heap growth in the sim/render hot path is ~0 (event DATA objects still allocate at emit time - event-driven and bounded by action rate, by design).
- No gameplay/scoring/pacing changes. 200/200 (4 new poolAudit regression tests pin array identity + buffer reuse).
 - Browser smoke: PLAYING wave 1, ship/camera finite, render ok, 0 console messages (.evidence/i74-playing-smoke.png).

## I75 - WebGL context loss: overlay + restore/reload path (ST-075)

- Resilience/UX only: no gameplay, scoring, or pacing changes. 200/200 (render-only, no new unit tests; core untouched - the sim already auto-pauses on context loss via the existing I43 handler).
- What was added: a user-facing overlay (#ctx-overlay, z-index 80) shown while the 3D context is lost - title RENDERING INTERRUPTED, a status line, and a RELOAD GAME fallback button (location.reload) in case the browser never restores. A 10s timer escalates the status text to "still no signal - reload" if the restore never arrives; it is cleared on restore.
- Restore path: on webglcontextrestored the overlay hides, the existing renderer.setSize + bloom.resize + info.reset re-allocation runs, and the game stays PAUSED (the pause screen takes over; the player resumes explicitly). No auto-resume - a freshly-allocated GL state should not resume mid-run silently.
- Verified in browser by dispatching the real context events on the canvas: lost -> PAUSED + overlay visible; restored -> overlay hidden, still PAUSED; resume -> PLAYING. A clean run (no events) produces 0 console warnings/errors. Note: firing webglcontextrestored on a context that never actually lost makes three.js re-upload textures and log two benign "texImage3D FLIP_Y/PREMULTIPLY_ALPHA" INVALID_OPERATION warnings - a simulation artifact, not a code-path defect (a genuine lost context is gone, so the re-upload targets a fresh live context).
