# Procedural Music - Ambient Drone Loop (I169, ST-169)

Scope: turn the I158 static generative music bed into an EVOLVING ambient
drone loop for the PLAYING state, re-ground the pluck in the same key, and
leave a clean escalation seam for ST-170. Rendering-neutral: audio only, no
scene, no input, no core-logic diff. Files: src/render/audio.js + two __vr
probes in src/main.js. Research grounding below (YouTube references, metadata
verified; transcripts rate-limited at research time - see Coverage note).

## Baseline (I158, pre-patch)
- Static 4-note A-minor saw pad: [110.00, 130.81, 164.81, 220.00] (A2 C3 E3 A3),
  held constant for the entire run.
- Sparse pluck from a C-MAJOR pentatonic set - tonally clashed with the A-minor
  pad (a major third over a minor root = muddy, "off-key" to the ear).
- 0.05 Hz LFO sweeping a 1200 Hz lowpass (gentle brightness wobble).
- Bus gain 0.13 with a 1.4 s attack; single pad node set + one musicTimer.
- Problem: it was a pad that never moved. After ~30 s the ear locks onto it and
  it stops "playing" and starts "humming in the background" - the exact
  weariness that the procedural-ambience research warns against.

## Research (YouTube; see Coverage note)

| # | Title | Channel | Views | Len | Date | Link |
|---|-------|---------|-------|-----|------|------|
| 1 | How To Create Beautiful Ambient Sounds For A Game | Marshall McGee | ~61K | 14:02 | 2024-05-19 | https://youtu.be/5fJZmO7NdMI |
| 2 | Making a DARK AMBIENT DRONE in Vital Synth | The Ground Noise | ~21K | 16:49 | 2024-03-15 | https://youtu.be/nhN1urALopY |
| 3 | Procedural Audio in Games | Simon Hutchinson | ~4.8K | 7:24 | 2021-04-05 | https://youtu.be/qApTLqu6tno |

Chapter map used for the design (from video metadata + chapters, not transcripts):
- #2 drone recipe: 0:45 white noise, 3:30 pulsing osc, 6:30 delay, 7:00 random
  melody, 10:30 wavetable, 13:00 effects. Design language: a white-noise-based
  drone, EVERYTHING through filters, LFOs + randomizers to keep it moving, all
  oscillators in use. -> basis for our noise-air layer + LFO movement.
- #3 rules: 3:21 Procedural Ambiences, 3:51 System-Driven Audio. Avoid the
  player growing weary of repetitive sound; sound that reflects the action reads
  as immersion. -> basis for the EVOLVING (non-static) chord loop rather than a
  fixed pad.
- Related (context for the ST-170 tension layers): Dead Space Remake OST
  "151/152 Tension Layer" (https://youtu.be/Ea3xyuxSiUA, https://youtu.be/QfslKRdLKa4) -
  tension is carried by adding filtered layers and raising brightness as threat
  rises, not by changing the base. Generative-ambient references: State Azure
  (https://youtu.be/rZgR40IceRM, https://youtu.be/6JeZR13dLLI), Pierre's generative
  ambient (https://youtu.be/Bev6TXDfnvA).

## Design - the drone loop (what shipped)
Chord progression (4 chords, 18 s each = 72 s loop), 4 voices each:
- Am    [110.00, 164.81, 220.00, 329.63]  sub 55.00
- Fmaj7 [ 87.31, 174.61, 220.00, 261.63]  sub 43.65
- Cmaj7 [130.81, 164.81, 196.00, 261.63]  sub 65.41
- G     [ 98.00, 196.00, 246.94, 293.66]  sub 49.00
A classic Am-F-C-G (i-VI-III-VII) pop loop: warm, slightly unresolved, and it
RETURNS to Am so the 72 s loop has no hard seam. Chosen because it is tonally
stable (no tritones, no hard dissonance) so it can sit under gameplay for
minutes without becoming "wrong", while still changing every 18 s to reset the
ear.

Movement = setTargetAtTime frequency GLIDES, not node swaps:
- Every chord change retargets all 4 pad oscillator frequencies (tau
  MUSIC_GLIDE = 2.5 s, ~3.5 s audible glide) plus the sub. No nodes are created
  or destroyed on a chord change (only at start/stop): zero node churn, zero
  click risk, bounded node count for the whole run.
- Sub drone: sine at chord-root/2 (one octave below the chord root), gain 0.08,
  with a 0.1 Hz "breathing" tremolo (depth 0.02). Adds the low-end body the
  4-voice saw pad alone lacks; the slow tremolo keeps the sub alive.
- Noise-air layer: the shared 0.5 s white-noise buffer (already built in init()
  for percussive tails) is looped through a bandpass (400 Hz, Q 0.5) at a very
  low gain (0.02), with a 0.03 Hz LFO wandering the bandpass center +/- 150 Hz.
  This is the "air"/"wind" the #2 recipe calls for - it is what stops a
  filtered drone from sounding synthetic and gives the void a sense of air.
- Pluck re-tuned to A-MINOR pentatonic [220.0, 246.94, 261.63, 293.66, 329.63,
  440.0] so the sparse top melody now sits IN the key of the pad (was C-major -
  the clash above).
- The existing 0.05 Hz lowpass-sweep LFO is kept (1200 Hz base) for brightness
  breathing.

## ST-170 escalation seam (musicIntensity)
New musicIntensity(x) for x in [0,1] - the tension lever ST-170 will drive from
world state (wave number / boss active). It does two SMOOTH retargets:
- musicFilter.frequency: 1200 Hz -> 2600 Hz (open the filter as tension rises -
  the "more air and bite" cue from the tension-layer references).
- musicBus.gain: 0.13 -> 0.18 (+~38%, within the limiter's headroom - the I84
  limiter at -8 dB catches any stacking).
Safe to call anytime (guards on !musicBus) and currently UNWIRED to gameplay;
ST-170 owns the wiring. The seam exists so ST-170 only adds the world-state to x
mapping, not new audio nodes.

## CPU / node cost
- Steady nodes while music is on: 4 pad osc + 4 pad gain + sub + sub-gain +
  trem + trem-gain + noise src + bandpass + noise-gain + bandpass-LFO + LFO-gain
  + lowpass-LFO + LFO-gain ~= 17 nodes plus the existing lowpass. All created
  once at start, all torn down at stop. A chord change touches 0 nodes (only
  setTargetAtTime on existing AudioParams).
- Timers: 2 repeating setTimeouts (chordTick @18 s, pluck tick @~0.95-2.45 s),
  tracked in musicTimers[] and all cleared on stop - no leak on pause/resume.
- setTargetAtTime is cheap (AudioParam automation); the pluck creates 1 osc + 1
  gain per hit, auto-stopped after 1.2 s. No per-frame allocations on the chord
  path.
- Measured (I169 smoke, 60 fps): console 0/0, no NaN, steady. Audio has no
  visual frame cost; the cost is the fixed node set + 2 timers.

## Verification (I169)
- Parse: src/render/audio.js + src/main.js both `node --check` clean (ESM).
- Tests: 491/491 (audio module is browser-only; core-logic tests unchanged).
- Build: 0.
- Browser (?nocache=169, Enter to start): state PLAYING, __vr.musicOn() true,
  __vr.musicChord() read i:0 f:[110,164.81,220,329.63] sub:55; after ~20 s (past
  the 18 s first chordTick) read i:1 f:[87.31,174.61,220,261.63] sub:43.65 - the
  loop advanced. Ship died on its own during the unattended wait -> GAME_OVER ->
  musicOn() dropped to false, confirming the PLAYING-gate. Console 0 errors /
  0 warnings, 0 NaN. Screenshot .evidence/I169/I169_1_playing.png.

## Coverage note (honest gap)
Research used YouTube SEARCH + metadata (title/channel/views/duration/date) and
video CHAPTERS (server-side, no transcript download). Full transcripts were NOT
pulled: the transcript endpoint was rate-limited (per-IP, "transcripts paused
for 60 s", extended by retries) at research time, so the chapter-level claims
above rest on chapter titles + the visible recipe structure, not verbatim
transcript quotes. This does not change the design (it is grounded in the
well-established ambient-drone recipe: filtered drone + noise air + LFO movement
+ a slow chord change), but any verbatim citation is deliberately omitted to
avoid paraphrase-as-quote. Re-pull transcripts (small batch) if a precise quote
is ever needed.

## ST-170 implementation (I170)

The seam above is now WIRED to world state. Tension x in [0,1] = f(wave) with
a boss floor, pushed to musicIntensity(x) from syncVisuals() (src/main.js),
change-cached. The pure mapping lives in src/core/musicIntensity.js (DOM-free,
unit-tested); tunables live in config.js.

Audio Goal
- Escalate the drone bed through a run: at rest at wave 1, tense by the time
  asteroid speed caps, maxed under a boss. Tension is carried by the two
  existing retargets (filter opening + bus lift) - no new elements are added,
  per the ambient-drone recipe (movement, not novelty, signals danger).

Mapping (musicIntensityX(world, opts))
    t = 1 - exp(-max(0, wave-1) / waveK)
    x = waveCeil * t
    if (world.boss && world.boss.alive) x = max(x, bossFloor)
    x = clamp(x, 0, 1)
Grounded in the shipped difficulty curve (config.js):
- boss.everyWave = 5: a boss owns every 5th wave until killed, so the
  bossFloor (0.9) covers every boss window regardless of wave.
- speedMult = min(2.1, 1 + 0.06*wave) caps at wave 19 (2.08 at wave 18);
  the waveK = 12 ramp reaches 0.568 by wave 18 and 0.583 by wave 19, so the
  "arena is maxed" moment of the endless curve lands at ~57-58% intensity,
  then plateaus toward waveCeil (0.75) - leaving headroom so the boss floor
  reads as a STEP up (0.9 > 0.75), not a continuation.
- wave 1 = exactly 0 (a fresh run starts at rest); wave 2 = 0.060 (first
  nudge after the first clear).

Tunables (CONFIG.music.intensity)
- waveK: 12       - exp time-constant in waves (lower = faster build)
- waveCeil: 0.75  - max intensity from wave alone (headroom below 1.0)
- bossFloor: 0.9  - min intensity while a boss is alive

Wiring (syncVisuals in src/main.js)
- mx = musicIntensityX(world, CONFIG.music.intensity); pushed only while
  PLAYING.
- CHANGE-CACHE (same discipline as the I167 write-on-change caches): pushed
  only when |mx - lastApplied| > 0.02. A per-frame setTargetAtTime on an
  unchanged value is a wasted AudioParam automation event; the 0.02 hysteresis
  makes the push rate ~once per wave transition (the smooth ramp takes many
  seconds to accrue 0.02).
- lastApplied resets to 0 off-PLAYING, so a (re)start re-applies from rest
  even if the params already sit where a fresh wave 1 wants them.

Mix Target
- x only retargets the two existing params (filter 1200->2600 Hz, bus gain
  0.13->0.18 via setTargetAtTime). Zero new nodes, zero per-frame allocations.
  The I84 limiter (-8 dB) still catches the +38% bus-gain headroom; nothing
  else in the chain moves.

QA Note
- Unit: tests/musicIntensity.test.js, 8 tests - wave 1 = 0; monotonic
  non-decreasing; asymptotes < 1 and > 0.7 by wave 200; clamps [0,1] across
  waves 1..300 in both boss states; live boss >= bossFloor; low-wave boss
  override; degenerate worlds (null/zero/empty) -> 0; custom tunables (faster
  build, higher floor) take effect.
- Browser: see Verification (wave 1 -> 0.0, wave 2 -> 0.059967 exact).
- No visual change; the only observable is the drone bed getting brighter and
  louder as waves advance and under a boss.

Risks
- If waveK is later tuned low, the ramp hits waveCeil early and mid-run waves
  feel flat; the boss floor still guarantees the boss step.
- Waves only ever advance (no mid-run reset), so the 0.02 hysteresis can never
  hide a needed push; it only coalesces them.

Changed files (I170)
- src/core/config.js            CONFIG.music.intensity tunables
- src/core/musicIntensity.js    NEW pure mapping (DOM-free)
- tests/musicIntensity.test.js  NEW 8 unit tests
- src/main.js                   wiring + change-cache + __vr.musicIntensityVal probe
- design/audio-music.md         this section
- CHANGELOG.md, production/iterations.md, production/session-state/active.md

Verification (I170)
- Parse: src/main.js node --check clean (via .mjs copy); src/core/config.js
  imports OK, CONFIG.music.intensity = {waveK:12, waveCeil:0.75, bossFloor:0.9}.
- Tests: 499/499 (491 prior + 8 new).
- Build: 0.
- Browser (?nocache=170, Enter): baseline state PLAYING, wave 1,
  __vr.musicIntensityVal() = 0; after __vr.advance(50) wave 2 and
  musicIntensityVal() = 0.059967 (= 0.75*(1-e^(-1/12)) exact) - the stored
  target ROSE from 0, proving the world->audio wiring is live. Console 0
  errors / 0 warnings; NaN scan of ship + 10 rocks + warden + boss refs: 0
  NaN. Screenshot .evidence/I170/I170_1_playing.png.

## ST-171 implementation (I171)
Music toggle: hotkey + live status. The options checkbox + persistence already
shipped in I158 (storage seam: DEFAULT_SETTINGS.music, getSettings/setSettings
boolean guard, audio.setMusic + the per-frame PLAYING gate in main.js); ST-171
adds the player-facing toggle surface on top:
- N key (any state) = flip the music bed, PERSISTED like F (not session-only
  like M): storage.setSettings({ music }) -> applySettings -> menu/pause panel
  sync -> toast('MUSIC ON/OFF'). Key choice: N sits next to M in the
  left-hand audio cluster (M = mute ALL audio, N = music bed only); the
  initial-letter mnemonic collides (M), so adjacency is the discovery cue.
- Menu status row (I165 pattern) gains 'N - MUSIC (ON/OFF)'; the menu controls
  grid + the first-run tutorial key list gain ['N', 'music']; the settings
  panel keydown guard swallows N while a control holds focus (F parity - a
  focused checkbox must never trigger the global hotkey).
- Unit: tests/musicToggle.test.js (4 tests: default ON; N-contract persist /
  reload / isolation from other settings; 9-flip round-trip through storage;
  non-boolean partials discarded).
- No new audio: the toggle re-uses the I158 gate (audio.music(PLAYING &&
  settings.music)) + audio.setMusic - a mid-run flip stops/restarts the bed
  on the next syncVisuals frame.

## ST-172 implementation (I172)

Bullet-time audio: while the slow-mo power-up is active (ST-115), the
drone bed drops in pitch and darkens so time dilation is felt aurally,
not just visually (I116 tint + hint). Grounded in the standard
snapshot / time-stretch treatment of bullet-time cues (research table
below): the mix drops by semitones / thirds while time is dilated and
glides back when it snaps forward.

### Audio Goal
- The world "slows down" in the mix: drone pad + sub drop in pitch
  proportional to the dilation amount; the pluck melody inherits the
  same detune so nothing sticks out.
- The drone lowpass closes (darkens) in the same window, composing
  with the I170 intensity filter so the two never fight.
- On expiry everything glides back with tau 0.25s - no click, no
  snap; the seam is safe to call at any time (menu-safe: no-op
  while the bed is stopped).

### Mapping (src/core/timeWarp.js - NEW, pure, DOM-free)
- timeWarpX(scale) = clamp(1 - scale, 0, 1). Game seam:
  world.enemyScale() - 1 normally, 0.4 while slow-mo is active
  (CONFIG.powerup.types.slowmo). Slow-mo therefore lands at x = 0.6.
- timeWarpCents(x, {centsMax}) = -x * centsMax. centsMax = 700 (a
  tritone at full warp); slow-mo lands at exactly -420 cents (a bit
  over a major third down). The proportional alternative (-1586)
  would be sub-bass and inaudibly extreme; real bullet-time cues
  drop by semitones / thirds, not octaves.
- x = 0 returns an explicit 0 (not -0) so strict assertions hold
  (assert/strict compares with Object.is).

### Tunables (CONFIG.music.warp - src/core/config.js)
- centsMax: 700 - max pitch drop in cents at full warp.
- filterKeep: 0.3 - fraction of the intensity-opened filter kept at
  full warp (the rest is darkened away).

### Wiring (src/render/audio.js + src/main.js)
- audio.timeWarp(x, {centsMax, filterKeep}): detunes every pad
  oscillator + the sub drone via o.detune (a separate AudioParam, so
  it composes cleanly with the 18s chord-frequency glides); the pluck
  inherits the current cents at creation; the lowpass retargets to
  (1200 + 1400*intensity) * (1 - x*(1-keep)) - composing with the
  I170 intensity opening. All retargets use setTargetAtTime(tau 0.25).
- main.js syncVisuals: while PLAYING, wx = timeWarpX(
  world.enemyScale()); change-cached with |dx| > 0.02 hysteresis
  (I167/I170 discipline - no per-frame AudioParam churn); _timeWarp
  resets to 0 off-PLAYING so a (re)start re-applies from rest. Two
  new __vr probes: timeWarp(x, o), warpCents().
- Seam note: the handoff referenced world.game.enemyScale(), but
  world.game is the GameState machine; the method lives on World
  (src/core/game.js) - the wiring calls world.enemyScale().

### Mix Target
- Slow-mo window: pad + sub at -420 cents, lowpass from the
  intensity-opened value down to ~30% of its opening - the bed
  recedes while the SFX layer (untouched) stays forward, the
  Max-Payne-lineage "world drops, player stays present" cue.
- Normal time: exactly the I170 mix (0 cents, intensity-only
  filter) - zero drift when the feature is idle.

### QA
- Slow-mo can be triggered from gameplay (the T-labeled drop) AND
  from the __vr world API; both drive the same enemyScale() seam, so
  the audio reacts identically to either.
- No new nodes, no timers: only retargets on existing params -
  nothing to leak on pause/resume or music stop.
- Detune is a separate AudioParam from frequency, so the chord glides
  keep working while warped (no LFO/param fight).

### Research (YouTube; metadata/chapters verified, transcripts
rate-limited - see Coverage note)
| Source | What it grounded |
|---|---|
| Arin Eakins - "Creating Bullet Time Effects in FMOD" (youtu.be/E2NQmKmw-mg) | Snapshot-instrument technique per the description: capture the mix, time-stretch it for the slow-mo window (stretching time down lowers pitch + darkens), restore after. |
| Aftertouch Audio - "Sniper Ghost Warrior Contracts Slow Motion Bullet" SFX demo (youtu.be/8cU9A0mDHjA, ~34K views) | Title/description only: a slow-motion bullet one-shot in the SSGW Contracts style - the genre's standard dilated-time cue. |
| Tom Player Music - "Bullet time" Matrix-style track (youtu.be/WhxbYTMNMxo) | Title/description only: a score-side bullet-time piece - the music itself carries the dilated beat. |

Coverage note: transcripts for all three were rate-limited at
research time (per-IP limit); the findings above come from titles,
descriptions and chapter metadata only. No quotes are used.

### Verification
- tests/timeWarp.test.js: 7 tests (curve values, clamps, explicit 0
  at scale 1, -0 guard, custom centsMax, degenerate inputs).
  npm test: 510/510.
- Parse: node --check clean (audio.js + main.js via .mjs copies).
- Build: node scripts/build.mjs exit 0.
- Browser smoke ?nocache=172 (PLAYING, ship invulnerable): baseline
  warpCents 0 -> world.powerups.apply('slowmo') -> enemyScale 0.4 ->
  next frame warpCents exactly -420 -> advance(2s) still -420
  (3.0s left, active) -> advance(4s) back to 0, enemyScale 1,
  inactive. Console 0 errors / 0 warnings; NaN scan (ship + 5 rocks +
  velocity) 0; screenshot .evidence/I172/I172_1_slowmo_active.png
  (SLOW-MO HUD chip + tint + hint visible).

## ST-173 implementation (I173)

### Audio Goal
E8E SFX pass for new content: the drone, the Warden mini-boss and the
pickups were silently re-using cues from older content (seeker zap for
decay, the full 3-note boss stinger for a mini-boss spawn, the impact-tier
boss boom for a mini-boss death, one generic ding for all seven pickup
types). Each class now has its own voice, sized to its tier, so the mix
stays legible when drones, Wardens and the full boss share a wave.

### Mapping
| Event | Before | After |
|---|---|---|
| droneDecay (I129 seeker battery self-destruct) | drone (saw 520->110, 0.26s, g0.28, noise 0.22) | droneDecay: sine 340->140, 0.18s, g0.14, no noise - a smaller descending blip |
| wardenSpawn (ST-136/137) | bossSpawn (3-note tritone stinger, g0.30) | wardenSpawn: compact 2-note low sting [[55,41,0.5,0,0.26],[82.4,79,0.4,0.1,0.18]], g0.22, noise 0.25 |
| wardenDeath (ST-136/137) | bossDeath (square 80->30, 0.7s, g0.45, noise 0.5 - impact tier) | wardenDeath: square 70->32, 0.45s, g0.34, noise 0.3 - mid boom, below impact tier |
| powerup type slowmo (ST-115, ice-blue T drop) | powerup (sine 660->990, g0.25) | slowmo: sine 880->1320, 0.2s, g0.18 - cold shimmer; rapid/spread/shield/magnet/bomb keep the plain ding, overdrive keeps its own override |
| player bomb (verify only) | bomb (sine 90->40, 0.5s, g0.55, noise 0.4) | unchanged - already impact-tier with its own cue |

### Tunables
None new: all four specs live inline in the CUES table (house style -
one-shot cue shapes are mix values, not CONFIG data).

### Wiring
- src/render/audio.js: +4 CUES entries (droneDecay, wardenSpawn,
  wardenDeath, slowmo) with tier comments.
- src/main.js SFX_CUES: droneDecay 'drone'->'droneDecay', wardenSpawn
  'bossSpawn'->'wardenSpawn', wardenDeath 'bossDeath'->'wardenDeath'
  (wardenArmor + beltHit keep shieldHit).
- src/main.js dispatch: powerup events resolve slowmo -> 'slowmo',
  overdrive -> 'overdrive' (unchanged), everything else -> 'powerup'
  (unchanged).

### Mix Target
- droneDecay sits under the seeker zap it replaces: a quiet battery
  fizzle, background tier, rate-limited (min 0.1s) for rapid decays.
- wardenSpawn is 0.08 lower gain than bossSpawn and 2 notes vs 3 - a
  Warden reads as a smaller Monolith, not a second boss.
- wardenDeath is 0.11 lower gain and 0.25s shorter than bossDeath - mid
  boom; only the full boss reaches the limiter's impact tier.
- slowmo is 0.07 lower gain and brighter (880->1320 vs 660->990) - the
  ice-blue pickup gets a cold shimmer without stealing overdrive's
  rising sweep.

### QA
- All four cues pass through the existing rate-limit (min), stereo pan
  and sidechain-duck chain - no new nodes, timers or state.
- weights() now exposes all four gains for the I180 headless-audio test
  seam.

### Research (YouTube; metadata/chapters verified, transcripts
rate-limited - see Coverage note)
| Source | What it grounded |
|---|---|
| Tender Rondo - Special Infected Spawn Cues (Valve, youtu.be/pUn8HNpiR3w, 2.7M views; chapters: countdown / respawn / end stingers) | Spawn cues are distinct PER enemy class - grounds separate wardenSpawn vs bossSpawn instead of reuse. |
| Sound Around - Dramatic Dun Dun Dun... Classic Suspense Audio Stinger (youtu.be/W6DEnw-h1pw, 25K views) | Stinger = short low tension hit for spawns - grounds the compact low 2-note wardenSpawn over a bright arpeggio. |
| Free Video Sound Effects HD - Epic Retro Game Power-Up Sound (youtu.be/08UkjjAq7Rg); Creator Assets - 8-Bit Powerup Sound Effects (youtu.be/SoZhpnTuQBo, 590K views); Nyonyxx - How to Make: 8bit Power up sound (youtu.be/1kVkyN5ybdQ, 3:33) | Pickup cues are short rising bright dings/arpeggios - grounds slowmo as a brighter, shorter variant of the plain powerup ding. |

Coverage note: titles/snippets/chapters only; transcripts rate-limited at
research time; no quotes used.

### Verification
- Parse: node --check clean (audio.js + main.js via .mjs copies).
- npm test: 510/510 unchanged (no core changes).
- Build: node scripts/build.mjs exit 0.
- Browser smoke ?nocache=173 (real Enter keypress: PLAYING via the menu,
  audio ctx 'running', ship invulnerable): snapshot played{} then
  world.emit x6 (droneDecay, wardenSpawn, wardenDeath, bomb, powerup
  type slowmo, powerup type rapid) -> advance(1s): every new-cue delta
  exactly +1 (rapid -> powerup +1, NOT slowmo) and the old reuse paths
  (drone, bossSpawn, bossDeath, overdrive) all delta 0 - no leakage.
  weights() exposes droneDecay 0.14 / wardenSpawn 0.22 / wardenDeath
  0.34 / slowmo 0.18. Console 0 errors / 0 warnings; NaN scan (ship +
  6 rocks) 0; screenshot .evidence/I173/I173_1_playing_after_sfx_pass.png
  (WAVE 1 arena, HUD, rocks, grid).

## ST-174 implementation (I174)

### Audio Goal
Death slow-mo (ST-174): every ship hit dilates the audio for 0.8s -
a bullet-time death beat that sells the near-death moment. A
world-wide time dilation was scoped out (it would touch the core
sim, not just the audio seam), so the dilation is audio-only and
reuses the I172 timeWarp seam: peak scale 0.25 (x0.75 speed, -525
cents) at the hit frame, linear decay to 0 over 0.8s, composed with
the slow-mo power-up warp via max() so the deeper dilation wins.

### Mapping
| Event | Before | After |
|---|---|---|
| hit (every hit, any life left) | none | 0.8s death window: peak x0.75 (-525 cents) at the hit frame, linear to 0; audio detune only, sim untouched |
| hit while slow-mo power-up active | power-up warp only (x0.6, -420 cents) | max(power-up, death): death deepens it while open; forced exact push on close hands back to -420 |
| final death (GAME_OVER) | bed stops + 3-note gameover stinger | unchanged - state leaves PLAYING, the stinger owns that moment |

### Tunables
- CONFIG.music.warp.death = { scale: 0.25, dur: 0.8 } (inside the
  existing warp block). scale = peak time compression (x0.75 speed),
  dur = window length in seconds. No new nodes or timers: the
  existing detune path carries it.

### Wiring
- src/core/deathWarp.js (new, pure, DOM-free): deathWarpX(remain,
  dur, deathScale) = (1-deathScale)*clamp(remain/dur, 0, 1) - the
  exact composition of timeWarpX (proven by test).
- src/main.js: _deathWarpT (seconds left); armed on hit in the
  state-always-advances chain (state-agnostic like the vortex chain
  - it is audio, not motion, so it also works with reduced motion);
  decayed in syncVisuals; warp line is wx = max(timeWarpX(
  enemyScale), death window) with the 0.02 hysteresis plus a forced
  exact push on window close (see Fix below).
- Probe: __vr.deathWarpT() (seconds left of the window).

### Mix Target
- Peak -525 cents (x0.75) sits between the slow-mo power-up (-420,
  x0.6) and a full stop: a dramatic dip, not a freeze.
- max() means a shallow hit window never masks the power-up warp, and
  a hit on top of the power-up always deepens it (death > pickup).
- On the final death the bed stops and the gameover stinger takes
  over - the window only matters while PLAYING.

### QA
- 8 unit tests (tests/deathWarp.test.js): peak value, explicit 0 via
  Object.is at remain 0, linear mid-values, monotonicity, clamps
  (remain > dur, remain < 0), degenerate dur <= 0 and deathScale 1,
  custom deathScale (float tolerance < 1e-12 - 1-0.9 is not
  binary-exact), exact composition vs timeWarpX.
- Browser smoke covers the full lifecycle including the stale-tail
  regression (see Fix below).

### Fix: stale sub-hysteresis tail (found in the first smoke)
- Symptom: after the window ended, warpCents() sat stale at
  -10.9375 (should be 0) and -426.56 (should be -420 with the
  power-up active).
- Root cause: the 0.02 hysteresis change-cache never pushes the
  final sub-threshold step of a linearly decaying target - the last
  decay increment is below 0.02, so the detune never snaps to the
  exact final value.
- Fix: track the window close this frame (_deathClosed) and force one
  exact push, so the tail always lands on the exact max() value.
- Lesson: any change-cached retarget of a decaying value needs a
  forced exact push at the end.

### Research (YouTube; metadata/chapters verified, transcripts
rate-limited - see Coverage note)
| Source | What it grounded |
|---|---|
| Rockstar Games - Max Payne 3 Design and Technology Series: 'Bullet Time' (youtu.be/td7Y6ISS3nk, 312K views, 3:08) | Dilation exists to even the odds / dramatize danger - grounds an audio dilation on hits. |
| HeavynSent - The Influence Of Bullet Time In Gaming (youtu.be/gbhuqM098Yk, 6.5K views, 21:35) | Slow-mo as the dramatic 'death beat' - grounds a per-hit window, not a persistent state. |
| HoumanRaps - Sandevistan in Real Time (youtu.be/Hn1UpCKrepo, 1.4M views) | Short, self-terminating dilation windows with their own aural identity - grounds the 0.8s auto-decay. |
| 1up Indie - Freeze/bullet time effect [GameMaker Studio 2] (youtu.be/BSzl5aFMddo, 2.4K views; chapters 0:00 preview / 0:37 desaturate + fx layer) | The visual freeze recipe (desaturate + fx layer) - deferred to ST-176 (damage vignette), the visual half of this same beat. |

Coverage note: titles/snippets/chapters only; transcripts rate-limited
at research time; no quotes used.

### Verification
- Parse: node --check clean (main.js via .mjs copy).
- npm test: 518/518 (+8 new deathWarp tests).
- Build: node scripts/build.mjs exit 0.
- Browser smoke ?nocache=174c (real Enter keypress -> PLAYING, audio
  ctx running; ship invulnerable + settle loop): baseline
  warpCents() exactly 0; A: emit hit + advance(0.05) -> deathWarpT
  exactly 0.783333, cents -514.0625; B: 55 advances -> window 0 and
  cents exactly 0 (stale tail gone); C1: slow-mo power-up -> -420;
  C2: hit on top -> -514.0625 (deeper wins); D1: 12 advances ->
  -426.56 (quantized handoff, within 10 of -420); D2: 35 advances to
  close -> exactly -420 with slow-mo still active (forced close
  push); E: 52 advances until slow-mo expires -> cents 0 (zero
  drift at idle). Console 0 errors / 0 warnings; NaN scan (ship +
  6 rocks) 0; screenshot .evidence/I174/I174_1_death_slowmo.png.

## ST-180 headless test suite (I180)

The synth layer got its first automated coverage: 18 headless tests in
tests/audio.test.js over a stub AudioContext (tests/helpers/webaudio.js,
installAudioStub()). Covered: init + master-chain construction
(gain -> comp -> makeup -> limiter -> analyser/dest), idempotent init +
suspended-resume, cue scheduling + counts, per-cue rate limiting (shoot
min 0.04 s), unknown-cue no-op, weights() all-cues finite positive,
setVolume clamp [0,1], setMuted master-gain routing, setSfx gating,
stereo pan from world x (clamped to +-ARENA_R, scaled 0.8, non-finite ->
center), meter peak/rms math (analyser stub returns a flat 0.25 frame, so
peak = rms = 0.25 exact), and the no-bus seams (timeWarp detune-cent
mapping, musicIntensity clamp, musicChord Am start).

Deliberate boundary: the tests NEVER call music(true)/ambience(true) -
those schedule recurring setTimeouts (chord tick 18 s, pluck ~1 s) plus
1.2-1.3 s disconnect tails that would keep the in-process runner alive.
The bus seams are exercised in their no-bus state, which is the same state
main.js starts them in. Fully deterministic: the stub clock starts at 0
and the tests advance ctx.currentTime manually; no real audio, no timers,
no network (~80 ms standalone). Test-only: the runner only loads
tests/*.test.js and the build only bundles src/ + assets/, so the stub is
never shipped or executed.

Re-runs on every npm test (565/565 at I180; re-verified on every
iteration since - the G8.4 gate cites it as the standing synth-layer
re-verification).

## Next
E8E arc (ST-169..186) closed at I186. Audio design is frozen for the E8
milestone: E8F (I187-I206) carries no audio story (robustness / QA only).
The I202 human playtest can surface mix feedback, but any resulting change
goes to the post-E8 backlog.