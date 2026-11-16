# Campaign Stages - Void Runner

ST-417 (I447) / E57. Reverse-documented from the current implementation
(cgs-reverse-document: observed behavior + evidence paths; no unverified behavior) plus a
spec draft for ST-419/ST-420 (cgs-design-system: rules/edge cases/acceptance tests).

## Summary
A linear CAMPAIGN mode on top of the existing deterministic wave timeline: 3 stages x 5
waves (waves 1..15 - NO new timeline), a stage-end boss at waves 5/10/15, a warp transition
+ themed arena per stage, and VICTORY after the stage-3 boss. NO new state-machine state.
ENDLESS mode is the default and stays behavior-identical.

## 1. Observed behavior (evidence)
- The wave timeline is endless from wave 1: content = base + growth*wave, intermission 2.2 s,
  stall-advance after stallTime - src/core/waves.js (WaveDirector.step).
- The endless difficulty curve engages at wave 10: contentCap 36, minIntermission 1.2,
  spawn-mix L/M/S ramp - src/core/config.js (waveEndless.first = 10, spawnMix).
- Wave modifiers (fast/small/inward/big) from wave 3, seeded per (seed, wave); the wave after
  each boss wave is a modifier-free breather (waves 6/11/16) - waves.js modifierFor /
  isBreatherWave; config.waveMods.first = 3.
- The adaptive director is wave-start-only from wave 3 and NEUTRAL before wave 3 / in replay
  mode - src/core/director.js.
- Enemy first-wave gates: mines 5, stinger 7, drones 8, vortex 8 (interval 12-20 s, telegraph
  1.0 s, duration 4.5 s), flyer 9; indestructible belt from wave 8 - src/core/config.js +
  spawn*ForWave calls in src/core/game.js.
- A boss spawns every 5th wave (5/10/15/...); the variant alternates by boss-spawn count
  (0 = Monolith, 1 = Splicer, ...) - game.js spawnBossForWave (ST-143). So wave 5 = Monolith,
  wave 10 = Splicer, wave 15 = Monolith.
- Monolith: hp 64 (+12 per 5-wave boss after wave 10, cap 88), radius 3.4, speed 1.6,
  radial ring bursts (12 bolts every 4 s; phase 2 x0.65), aimed bolts, splits on death -
  config.boss + src/core/boss.js.
- Splicer: hp 30 (+8 per boss wave after 15, cap 72), radius 2.6, orbits the center at
  holdRadius 11, two-arm spiral + aimed bolt, no rock rings - config.splicer + boss.js.
- The Warden (armored drone mini-boss) spawns on 5th waves only where a Monolith is already
  alive - game.js spawnWardenForWave (ST-136).
- State machine: MENU -> PLAYING -> (PAUSED <-> PLAYING) / PLAYING -> GAME_OVER ->
  PLAYING | MENU; REPLAY branch (ST-190). There is NO VICTORY state - src/core/state.js.
- GAME_OVER shows the score; saving is conditional (shouldSaveOnGameOver, recorded runs) -
  src/main.js + src/core/recording.js.
- The wave banner is a 1.8 s timed envelope (showWave/showCleared/showBoss) -
  src/render/waveBanner.js.
- Arena render stack: equirect skybox texture (assets/skybox_equirect.jpg; flat 0x04060f on
  load failure), procedural two-shell starfield, radial floorDisc (procedural canvas,
  toneMapped:false), line floorGrid, outer arenaRing - src/render/{skybox,starfield,
  floorDisc,floorGrid,arenaRing}.js.
- Camera modes CHASE / OVERVIEW (fixed 0,56,20 -> 0,0,0) / COCKPIT on V -
  src/core/cameraModel.js (I446).
- The menu has no mode selector; Enter starts a run directly - src/render/screens.js.

## 2. Evidence paths
- src/core/waves.js, src/core/director.js, src/core/boss.js, src/core/game.js,
  src/core/state.js, src/core/config.js (wave / waveEndless / spawnMix / boss / splicer /
  mines / drones / stinger / flyer / vortex / waveMods sections)
- src/render/waveBanner.js, src/render/screens.js, src/render/skybox.js,
  src/render/starfield.js, src/render/floorDisc.js, src/render/floorGrid.js,
  src/render/arenaRing.js, src/core/cameraModel.js
- src/core/recording.js (shouldSaveOnGameOver)
- production/scope-check-E57.md (E57 source of truth; pre-registered re-pins)

## 3. Unknowns (decisions for ST-419/420)
- Stage-2 boss identity: the scope-check line reads "stage N boss = monolith variant
  (name/rim color/hp/attack re-tune)", but the current timeline spawns the Splicer at wave 10.
  Options: (a) campaign keeps the Splicer at stage 2's end - zero timeline divergence, the
  "variant" is the existing alternation, and only stage 3 gets a re-tune; (b) campaign
  overrides wave 10 with a re-tuned Monolith variant - the campaign diverges from the endless
  timeline at wave 10. The scope-check's "same deterministic timeline waves 1..15" language
  favors (a). Flagged for ST-419; the stage table below lists both.
- Stage-3 final-boss re-tune numbers (hp / attacks): proposed in 4.2; ST-419 finalizes in
  CONFIG.stages with a beatability ceiling.
- Skybox tint mechanism for three r160: a texture background takes no material color.
  Candidates: per-stage flat-color scene.background swap (supported - the failure path already
  uses flat 0x04060f), a full-screen tint overlay pass, or pre-tinted per-stage textures
  (Blender bake, later epic). ST-420 decides with a probe.
- Victory score-save details: reuse the existing shouldSaveOnGameOver path (proposed) vs a
  separate "cleared" record (out of scope for E57).

## 4. Documentation draft (spec for ST-419/420)

### 4.1 Definitions
- stageForWave(w) = ceil((w-1)/5): stage 1 = waves 1-5, stage 2 = waves 6-10, stage 3 =
  waves 11-15. The campaign ends at the wave-15 boss.
- Mode: 'endless' (default) | 'campaign', selected on the menu (ST-419 state in game.js).
  Enter with no selection starts the DEFAULT = ENDLESS (causal safety).
- Campaign = the same WaveDirector timeline, waves 1..15 - no new spawn table, no new RNG
  draws in either mode. The stage system is a derived view over waves.wave.

### 4.2 Stage table (proposed; CONFIG.stages lands in ST-419)
| Stage | Name (proposed) | Waves | Stage-end boss (wave) | Theme |
|-------|-----------------|-------|------------------------|-------|
| 1 | Outer Drift | 1-5 | Monolith AS-IS (hp 64, purple rim 0x9a5bff) | Identity default (zero visual change) |
| 2 | Debris Field | 6-10 | Option (a): Splicer AS-IS (teal rim 0x2dd4bf). Option (b): re-tuned Monolith variant (name + rim + hp + attack) | Cool teal shift |
| 3 | Core Gate | 11-15 | Re-tuned Monolith variant (PROPOSED: name "Monolith Prime", rim gold 0xffc94d, hp 88 = endless cap with NO new ceiling, phase-2 threshold 0.8 -> 0.6, burst.every 4.0 -> 3.2, splitCount 4 -> 5 M rocks) | Warm ember shift |
- Beatability ceiling (stage 3): mid-skill kiter TTK <= ~15 s (I325 baseline: 64 hp ->
  12.7 s; the re-tune must stay within ~20%). ST-419 verifies with the deterministic-seed
  TTK test method.
- Theme tokens per stage: { name, sky, stars, floor, grid, accent } (ST-420 finalizes hexes):
  - Stage 1: the EXACT current values (identity default - hard requirement, see 4.5).
  - Stage 2: cool shift (sky toward 0x04101a family, stars cool-tinted, floor/grid toward the
    teal 0x2dd4bf family at sub-bloom strength, accent teal).
  - Stage 3: warm ember shift (sky toward 0x0f0705 family, stars warm, floor/grid toward the
    ember 0xff9a3d family dimmed, accent gold 0xffc94d).

### 4.3 Stage-clear sequence (campaign mode only; waves 5 and 10)
1. The stage-end boss dies (existing boss-death flow: split, score, SFX - unchanged).
2. Warp sub-sequence: sim FROZEN (dt = 0 for all sim systems) under a deterministic 1.6 s
   timer (CONFIG.campaign.warpDuration; NO RNG draws - a fixed timeline). Warp FX reuses
   particle/vortex-style effects (ST-420).
3. Stage-cleared banner ("STAGE N CLEARED") through the existing waveBanner envelope (1.8 s
   pattern; ST-420).
4. Arena theme swap to the next stage's tokens (immediate or a fixed 0.3 s crossfade -
   ST-420's call; theme values are deterministic).
5. Sim resumes; the EXISTING intermission before the next wave runs unchanged
   (intermissionFor(wave)).
- The wave-15 boss death goes to the victory sequence (4.4) instead of a warp.

### 4.4 Victory (wave-15 boss death, campaign mode)
- A victory flag is set on the run result. NO new STATE: the PLAYING -> GAME_OVER transition
  is unchanged; the flag rides on the game-over payload.
- GAME_OVER screen victory variant: "VICTORY" title + run summary (time, score) - ST-420,
  screens.js.
- Score save: reuse the existing shouldSaveOnGameOver path (proposed; ST-419 confirms the
  endless save semantics are untouched).
- After GAME_OVER the MENU / PLAYING (restart) transitions are unchanged; a campaign restart
  re-runs waves 1..15 with fresh stage-system state.

### 4.5 Endless invariants (hard)
- Default menu mode = endless; Enter (no click) starts endless.
- Endless: no stage banners, no warps, no theme swaps (identity default forever), no
  victory; the timeline is unchanged at every wave (16 and beyond).
- The stage system adds ZERO RNG draws and ZERO spawn-table changes in endless mode. Gate:
  causal p1 (seed 9876) zero drift + playframe Part A EXACT + a probe asserting
  zero banner/warp events in an endless run. (Playframe B re-measure is pre-registered at
  ST-422 - the I445/I446 camera work already moved it.)

### 4.6 Acceptance tests (ST-419/420)
1. stageForWave math: unit tests at boundary waves 1, 5, 6, 10, 11, 15 + stage-3 boss
   variant selection (deterministic).
2. Warp determinism: two same-seed campaign runs - warp timer timeline + theme-swap point
   bit-identical (unit test + probe).
3. Endless invariance: causal p1 zero drift; playframe A EXACT (21/12,654 + 10/180); probe
   asserts zero stage-banner/warp events in an endless run.
4. Theme probe: headless screenshots of the three stage themes + the stage-3 variant-boss
   rim (viewed); stage-1 theme pixel-identical to the pre-change MENU baseline.
5. Victory: a probe-driven campaign run (deterministic pilot, fast-forward) to the wave-15
   boss death -> GAME_OVER with the victory flag + save behavior per 4.4.
6. No new state: the state.js transition table is unchanged (unit tests pass unmodified +
   manual audit of TRANSITIONS).

## 5. Risks
- Causal-pin drift: any campaign branch leaking into the endless default - mitigated by
  mode-gating every stage hook, Enter-defaults-endless, and the 4.5 gates.
- Warp determinism: the 1.6 s timer must be a fixed timer, not dt-accumulated across the
  frozen window (ST-419 unit test 2).
- Theme tints vs the frozen floor/grid luma audits (ST-177 / E25 family): stage-1 identity
  default protects the baselines; stage 2/3 tints are measured in a fresh probe, no
  re-pinning of existing pins.
- Scope creep: no new state, no new spawn table - the stage system is a derived view
  (enforced by the 4.5 invariants).

## Research (UNVERIFIED-BY-PLAY)
- I444 (scope-check-E57.md): ontcnH1b_vI (Star Fox 64 retrospective - 16 stages with a boss
  at each stage's end; the 3 x 5 structure is a compact version of that pattern),
  qV3UQ69mHQM (EVERSPACE - arena-plus-linear-campaign hybrid), vDLrhwZCQhM (Goras boss #5 -
  per-stage boss variety through re-tuned patterns, the stage-3 re-tune precedent).

## Changed files
- design/campaign-stages.md (this document, new)

## Verification evidence
- Docs-only iteration: npm test 985/985; npm run build 0 errors; dist byte-identical
  (2,411,901 B / 139 files); vendor three r160 sha256-16 76DEA8151BC9352A; ports
  5173/4173/5199 free + chrome 0. (Recorded in production/iterations.md I447 entry.)

## Next owner
ST-418 (I448) - HUNTER + GUNSHIP core (parallel track). ST-419 (I449) consumes section 4
(src/core/stages.js + game.js integration).