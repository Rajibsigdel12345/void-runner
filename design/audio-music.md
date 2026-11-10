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

## Next
ST-170 (I170): wire musicIntensity(x) from world state (wave / boss active) in
src/main.js so tension rises through the run.