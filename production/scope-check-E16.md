# Scope Check - E16: Boss Finale Arc (I247)

## Summary
E15 closed at I246 (G15.0 PASS). E16 is the boss finale arc - the three carryover levers
around the wave-5+ boss death and its aftermath, verified in code at I247: (1) boss.glb
(11652 B, 1 node, 96 tris, 1 mat VR_Boss) is the oldest remaining hero asset (power-ups
all gained GLBs at I211) and bossMesh.useGLB takes ONLY the first mesh's geometry - the
silhouette cannot carry the finale, and there is NO visual phase-2 state (main.js:701
bossPhase2 = hit-stop 0.04 s only; boss.phase 1/2 ST-133 + boss.entered 0..1 ST-135 are
available); (2) musicIntensityX (src/core/musicIntensity.js) is a one-tick step for the
boss - T5 measured the spike 0.17 -> 0.90 in a single tick, release on death is instant,
no phase-2 lift - HUMAN-PENDING #5 (music quality) + T5 objective half; (3) the ST-092 F9
post-boss breather sets the wave MODIFIER to 'none' but the open spawn batch is still full
density (waves.js:35-44) - HUMAN-PENDING #1 (post-boss breather feel) objective half. All
three implementation stories are render/asset + pure-core (music curve) + pure-core (wave
open batch); none touch wave timing, ship sim or scoring. The demo pin (seed 1909, idx
2169/2220, score 11334, 57 kills, wave 2, t 36.15) is structurally untouched BY GATING:
the boss story applies at W5+, the breather open-batch change at W6+ (the wave after a
boss), the music curve is audio-only (FLYER W9+ precedent I237, I238/I240 precedent). 4
stories + gate G16.0 over I248..I251: ST-240 boss hero pass (Blender), ST-241 finale music
pass, ST-242 breather open density, ST-243 regression + G16.0 + closeout. Every story
bot-verifiable; the two perception verdicts stay HUMAN-PENDING (#1, #5), labeled
non-blocking. No new dependencies; no daily salt bump (labeled assumption).

## YouTube grounding (I247: 4 queries / 40 unique; metadata + chapters + descriptions; transcripts rate-limited - Coverage note at the end)
1. Grant Abbitt, low-poly game-asset workflow (210K views; youtu.be/7QiewPqkG80) +
   Imphenzia (379K, standing silhouette ref): base-mesh SILHOUETTE FIRST, then decimate to
   budget. The boss reads from the chase camera as an obelisk - the silhouette (3
   separable node masses: hull / crown / core) is the lever; the tri budget (<=250) IS the
   style.
2. RobProductionsGames, boss timelapse (youtu.be/wCCj5D2r_Nk): rough shape carries the
   silhouette - a 3-node rebuild (Hull + Crown + Core) beats a single 96-tri box for
   finale weight; the crown is a separate silhouette cap, not surface detail on the hull.
3. Amadeus Herrera, "Adaptive Boss Music ... 3-Phase HP" (youtu.be/qIaMPQlR0no): adaptive
   boss music tracks the boss HP/PHASE via continuous parameters + transitions - NOT step
   changes. Takeaway: ramp on boss ENTER (boss.entered 0..1), lift in phase 2, release
   after death - exactly the three levers ST-241 implements on the existing musicIntensityX
   seam.
4. Karol Sobczak, "3 Hacks for Epic Final Boss Music" (youtu.be/WXcaa0ng4Dk) + Tawhid
   Composes (tension breakdown 1:21): the finale needs a RELEASE after the peak - a
   one-tick drop on boss death is the opposite of a release; a short decay window is the
   fix.
5. q3 (pacing / breather after the boss): NO direct tutorial found (arcade playthroughs
   only) - labeled NOT over-researched; ST-242 is scoped from internal evidence (ST-092 F9
   breather + HUMAN-PENDING #1 + the recorded canonical run).

## Scope Fit
- Demo pin compatible BY GATING: the boss story applies at wave 5+ (bosses spawn on waves
  5, 10, 15...; the demo dies at wave 2); the breather open-batch change applies to the
  wave after a boss = W6+ (the demo does not reach it); the music change is audio-only (no
  sim state). The FLYER W9+ precedent (I237) is the exact same argument. No daily salt
  bump (labeled assumption: the recorded canonical run is unaffected - W5+/W6+ only).
- Current-state gaps (verified in code at I247):
  (1) assets/boss.glb = 11652 B / 1 node / 96 tris / 1 mat (VR_Boss). bossMesh.useGLB
      traverses and takes ONLY the FIRST mesh's geometry (single-obelisk pattern, adds
      white COLOR_0 if missing); materials are kept in code (emissive pulse Monolith
      0x7a4dff / Splicer 0x2dd4bf). bossPhase2 (main.js:701) = hit-stop
      CONFIG.fx.hitStop.bossPhase2 0.04 s ONLY - no visual phase-2 state. boss.phase
      (1/2, ST-133 one-way, below p2.hpFrac) + boss.entered (ST-135, 0..1) are available
      for the phase-2 core glow + the music entry ramp.
  (2) musicIntensityX (src/core/musicIntensity.js, pure): x = 0.75*(1-exp(-(wave-1)/12));
      if bossAlive x = max(x, 0.9) - a ONE-TICK step. T5 measured: at the boss spawn tick
      0.17 -> 0.90 (a 0.73 step in 1 tick). Release on bossDeath = instant (the max() just
      stops applying). No phase-2 lift. CONFIG.music.intensity { waveK 12, waveCeil 0.75,
      bossFloor 0.9 }; audio.js musicIntensity(x): filter 1200+1400x Hz / bus
      0.13+0.05x; main.js:787 calls it every frame with a 0.02 change-cache.
  (3) waves.js:35-44 modifierFor: wave < m.first -> 'none'; the wave right after a boss
      wave -> 'none' (ST-092 F9 breather); else a seeded RNG modifier pick. The OPEN spawn
      batch at that wave's start is still FULL density (concurrentLimit L51-52:
      min(cap, 6+growth*wave)) - the breather changes which modifier runs, not how many
      rocks open the wave. wavemods.test.js:40/47 already reference the "post-boss breather".
- Bot-verifiable per story: unit tests on the pure functions (musicIntensityX ease-in /
  lift / release; open-batch count determinism), browser A/B (forced boss spawn at wave
  5: pre-change one-tick 0.17->0.90 vs post-change max 1-s window delta <= ~0.25; phase-2
  core emissive shift live; GLB 18/18 + extent parity + assetPerf; wave-6 open-batch count
  vs pre-change; 2x seed-run determinism; the 1200+ tick recipe re-measured per I238/I240).
- Budget: boss GLB rebuild staged <= 10 KB gz (current 4.4 KB - headroom); dist headroom
  at open: 21.5 KB raw / 11.8 KB gzip (caps 2048/550); floor >= 8 KB after the arc.
- Player-experience caveat: the two perception verdicts (#1 breather feel, #5 music
  quality) are ultimately HUMAN-judged - the arc ships the OBJECTIVE halves (measured
  ramp, measured density, budgets) and parks the perception calls as HUMAN-PENDING, not as
  new blockers.

## Cut Option
- If E16 must shrink: ST-242 (breather open density) first, then ST-241 entry-ramp-only
  (skip the phase-2 lift + release decay). ST-240 (boss hero pass) never drops below the
  3-node silhouette - that is the arc's headline.

## Deferral
- The 10 HUMAN-PENDING perception items (production/bug-triage.md) - #1 and #5 get their
  objective half this arc; the perception verdicts stay parked for a human session.
- Hardware remainder (low-end physical device / GPU validation) - needs physical devices
  (perf-profile.md "## I225" checklist).
- Touch fallback (own arc per AGENTS.md "touch-friendly fallback later").
- Vortex / overdrive / wave-mod readability (HP #2-4), tutorial (HP #7), REC chip (HP #8),
  stinger telegraph (HP #9), flyer weave (HP #10) - later arcs.

## Recommendation
APPROVED - E16 Boss Finale Arc: 4 stories ST-240..243 over I248..I251, gate G16.0.
Demo-pin-compatible BY GATING (boss W5+ / breather W6+ / music audio-only); no daily salt
bump (labeled assumption). Cut option: ST-242 first, then ST-241 entry-ramp-only. Risks
R-E16-1..4.

## Risks
- R-E16-1 (med) the GLB rebuild breaks the pulse / Splicer variant / phase-2 read ->
  in-code materials kept (I240/I244 pattern), warden-pattern name-based multi-node swap
  (I220 precedent: VR_Warden_Armor -> armor, first other -> hull), extent parity vs the
  procedural fallback (Box r*1.2 x h=r*2.6 x r*1.2 + seeded jitter 0x0bad), assetPerf
  audit (18 slots, count unchanged) + Splicer teal-pulse live check.
- R-E16-2 (low) the curve retune changes the wave ramp -> only the boss entry / phase-2 /
  release bands change; the wave asymptote stays unit-pinned
  (tests/musicIntensity.test.js).
- R-E16-3 (low) the W6 density shift destabilizes the recorded run -> deterministic
  (seed, wave), W6+ only (the wave after the W5 boss), wave timing unchanged (modifierFor
  untouched), pin + wave-timeline tests structurally unaffected.
- R-E16-4 (low) dist budget -> boss GLB staged <= 10 KB gz; headroom floor >= 8 KB gzip
  after the story (baseline at open: 11.8 KB gzip / 21.5 KB raw).

## Changed files or proposed files
- production/scope-check-E16.md (this file, new)
- production/epics.md (+E16 section + risk register R-E16-1..4)
- production/stories.md (+E16 section ST-240..243)
- production/timeline.md (+E16 opened line)
- CHANGELOG.md (+I247)
- production/iterations.md (+I247)
- production/session-state/active.md

## Verification evidence
- Current-state checks (I247): boss.glb listing (11652 B; 1 node / 96 tris / 1 mat per the
  E9 assetPerf audit record); bossMesh.js read (bakeObeliskGeometry + useGLB first-mesh-
  only + in-code emissive pulse); boss.js read (phase/entered/hpFrac); musicIntensity.js
  read (full pure fn; T5 spike 0.17->0.90); waves.js:35-44 read (modifierFor ST-092 F9
  breather); wavemods.test.js:40/47 (post-boss breather already referenced); asset
  inventory 18 GLBs (power-ups all have GLBs since I211; boss.glb is the oldest remaining
  hero asset); dist at open: 113 files / 2026.5 raw KB / 538.2 gzip KB (headroom 21.5/11.8).
- Docs-only iteration: npm test 742/742 (unchanged - no code change), node
  scripts/build.mjs exit 0, log audit 1..247 sequential on disk.

## Coverage note (YouTube)
4 queries / 40 unique results. Transcripts were rate-limited for the whole pass (same as
I237/I242 - no retry per the I207/I223/I227 discipline) - grounding uses metadata +
chapter maps + descriptions only. q3 (pacing / breather) found no direct tutorial (arcade
playthroughs only) - ST-242 is deliberately scoped from internal evidence, not from
external sources.

## Next owner / decision
- I248: ST-240 (boss hero pass; cgs-dev-story + Blender MCP). E16 stories scheduled
  I248..I251; gate G16.0 at I251.


## G16.0 gate - PASS (I251)

All 7 criteria met (cgs-gate-check):
1. Boss GLB 18/18 + extent parity + assetPerf audit + phase-2 core glow live - I248 (8976 B / 3 nodes / 70 tris / 3 mats; extent w 3.524 / h 9.393 / z 4.059 inside the jittered fallback envelope; Splicer parity exact; forced phase-2 core 0xff4d6d@1.701 crossing the 0.72 bloom threshold).
2. Music ramp A/B (objective 1-s delta) + unit curves - I249 (entry ramp 0.7267 -> 0.8976 monotone, max 1-s delta 0.1496 <= 0.25 vs the pre-change one-tick 0.3327 spike; phase-2 x 1.0000 exact; release decay lands exactly on waveX; unit suite 756/756 at that iteration).
3. Breather open-batch counts deterministic + pin unmodified - I250 (wave 6 opens 5 not 10; 1200-tick FNV-1a e1d99a25 bit-identical to the pre-change baseline; march 1->9: only wave 6 changed).
4. Demo pin EXACT via real UI - I251 (SCORE 11334 / KILLS 57 / WAVE 2 / MAX COMBO 15 / TIME 0:36 / idx 2169/2220 / demoSeed 1909; MENU->REPLAY->GAME_OVER clean; pin test UNMODIFIED and green).
5. Fresh tests + build + dist in budget - I251 (765/765; build 0; dist 113 files 2033.0 raw / 539.1 canonical gzip KB - headroom 10.9 KB, floor >= 8 HOLDS).
6. Regression green - I251 (state machine 25-cell matrix + 11 live real-key transitions; persistence exact; FX-off zero-leak + readability floor 8 live; pool caps documented; fresh 1080-tick pilot 0 NaN incl. the full 1536-float particle scan; console 0/0/0 fresh boot).
7. Log audit sequential 1..251 on disk - I251 (251 headers, no gaps/dups, audited after the patch per the I236 lesson).

Risk register R-E16-1..4 -> CLOSED (I251). E16 CLOSED 4/4 (ST-240..243 over I248..I251).
