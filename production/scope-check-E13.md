# Scope Check - E13: Mid-Run Content Arc (I232)

## Summary
E12 closed at I231 (G12.0 PASS). E13 takes the biggest unowned lever: the wave 3-9 content
valley, extended in a way that is demo-pin-compatible BY GATING (the demo run dies on wave
2; every new content element is gated at wave 3+ or wave 7+ and is structurally unreachable
by the demo). 4 stories + gate G13.0 over 4 iterations (I233..I236): ST-228 fourth wave
modifier HEAVY ROCKS, ST-229 STINGER charger enemy (the missing arcade archetype per the
YouTube grounding), ST-230 Blender STINGER model + skybox JPEG re-encode (restoring the
gzip headroom the I230 skybox consumed), ST-231 regression + G13.0 + closeout. Content
versioning: the daily salt bumps 'daily' -> 'daily:v2' (the ST-140 namespacing exists
exactly for this). No new dependencies; every story bot-verifiable headless.

## YouTube grounding (I232, 2 rounds: 8 queries / 68 unique; transcripts rate-limited -> metadata + chapters + descriptions; Coverage note at the end)
1. GMTK, "What Makes a Good Combat System?" (2M views, 2018-05; youtu.be/8X4fx-YncqA).
   Chapter map: Enemy Design 11:22, Tactical Options 5:30, Attack Range 4:35, Block and
   Dodge 7:34. Takeaway: an enemy earns its place by adding a TACTICAL OPTION (a player
   choice, not another damage number) with a legible range/telegraph.
2. 1up Indie, "Wave flyer + rammer [GMS2 Enemy AI]" (7.4K, 2022-01; youtu.be/IqXsJ90qeW4).
   The description states the full design: both archetypes cruise slowly; the wave flyer
   "has a changed y value all the time" (sine evasion); the rammer "check[s] in a line
   around him if a player is there, if yes go with a faster speed value and if not... a
   regular slower value" - the classic telegraphed charge: slow cruise, line-of-sight
   telegraph, bounded fast dash.
3. Bog Hog, "Enemy Design & Effects [SHMUP WORKSHOP 04]" (12K, 2023; youtu.be/999tBKu8hNE):
   CAVE-style role separation (flyer/bomber/tank) - a roster wants one archetype per
   role, not more variants of the same verb.
4. PepperHead, "What Makes A Good Roguelike/Roguelite?" (921K, 2023-11; youtu.be/rcX9BDgvkws):
   Enemy Design 26:16 / Diversity 9:28 - variety pays when it is a new VERB (a new way to
   interact), not new stats on the same verb.
5. GMTK, "How to Keep Players Engaged" (2.8M): Novelty 3:11 + Anticipation 3:44 - a
   telegraphed threat sells anticipation; a new modifier sells novelty at the banner beat.
6. Roster gap analysis (this project): rocks (split tank: L/M/S + shielded + golden), slow
   homing mine (W5), fast homing seeker (W8), armored Warden, two boss variants,
   indestructible belt, vortex, 3 modifiers. Missing standard archetypes: the evasive
   flyer and the rammer/charger (grounding #2/#3). The rammer adds a timing/dodge VERB the
   game does not have (every non-boss threat is passive or perpetually homing); the evasive
   flyer overlaps the seeker's verb (pursuit) - the rammer wins.
7. Modifier gap: 'small' (S-favored wave, ST-051) has no counterweight; a BIG/HEAVY mirror
   tests the core "break the big rock" loop hard and is the cheapest new wave flavor
   possible (no new entity, no new render, no new SFX).

## Scope Fit
- ST-228 (HEAVY ROCKS modifier): mirror of the existing 'small' modifier. config.waveMods
  gains a 4th list entry 'big' (appended at index 3) + bigLBias 0.5; pickSize gains one
  branch (L with 50% probability, remainder S:M 50/50 - the exact small branch shape).
  Roll stays a pure function of (world seed, wave); the list extension only re-maps the
  wave 3+ index. "HEAVY ROCKS" banner under the WAVE banner (same announce path as the
  existing three). Pure core + unit tests (4-way roll determinism, big spawn mix, waves
  1-2 plain, post-boss breather invariant, lFloor/S-cap invariants untouched). Demo pin:
  structurally unreachable (the demo dies on wave 2; modifierFor is only consulted at
  wave 3+ starts). Content versioning in the same story: config.daily.salt 'daily' ->
  'daily:v2' (the ST-140 salt "namespaces the scheme so the format can evolve"; the GDD
  daily example + the daily unit test update with it). GDD + i18n strings.
- ST-229 (STINGER enemy): the charger archetype as a new mid-tier threat. State machine
  cruise (1.8 u/s, always slower than the ship) -> telegraph (0.8 s: emissive core
  cyan->white + rising SFX + slight wobble; the glow is FX-tier-independent = readability,
  not FX) -> charge (7.5 u/s, 1.4 s, straight line, or until the rim) -> recover (1.2 s
  vulnerable drift) -> cruise; 6-charge lifetime then a fizzle (seeker-battery precedent -
  bounds the pool without a slow-mo-interactive timer). Spawn: wave 7+ (one wave after
  the W6 post-boss breather, honoring the F9 recovery beat), 1 per wave, cap 2
  concurrent, rim spawn 15 u from the ship. Contact: costs 1 life, the stinger is
  destroyed, no score (mine/seeker flow). Kill: +250 (seeker 200 < stinger 250 <
  shielded/warden 400), feeds the combo. src/core/stinger.js (pure) + tests;
  src/render/stingerMesh.js pool 4 (cap 2 + 2 spare) with procedural fallback (dart +
  core) + a GLB hook (the GLB itself lands in ST-230, fallback-first like E9). SFX: 2 new
  cues per the ST-173 pattern (stingerTelegraph rising sweep, stingerDeath mid boom below
  the warden rung); the charge whoosh reuses the existing swish cue. Juice: shakeTable
  'stingerDeath' 0.6 (wardenSpawn 0.5 < stinger 0.6 < wardenDeath 0.8 < boss 1.0) +
  killPunch new rung c.stinger 0.2 (L rock 0.18 < stinger < the 0.35 drone rung); NO
  flash/hit-stop/fovKick (the non-boss readability rule). "STINGER INBOUND" toast on the
  first spawn of a run + a kill-feed entry. All tunables in CONFIG.stinger. GDD section +
  i18n strings + the HUMAN-PENDING checklist gains a new item #9 (stinger telegraph/
  charge feel - perception is not self-served).
- ST-230 (Blender STINGER + asset budget pass): (a) model the STINGER in Blender 5.2.3
  (MCP) per the E9 art direction: silhouette-first faceted dart/wasp, <=200 tris /
  <=40 KB / <=3 materials, a separate emissive core node (state-driven like the warden
  armor node), VR_ naming, procedural fallback preserved; assetGlbs/assetPerf tests
  extend to 17 assets. (b) gzip headroom restoration: re-encode the I230 skybox JPEG
  (73.2 KB) at staged quality (82 -> ~72, same 1024x512) targeting <=60 KB raw, with a
  browser A/B (MENU + in-flight, readability equivalent, star detail intact); net gzip
  delta of the story <= 0 KB (the ~4-6 KB gz new GLB is funded by the ~13 KB skybox cut)
  restoring >= 8 KB headroom before the gate. I232 measurement: dist total 542.3 KB gz
  (zlib level 9) vs the 550 cap; skybox_equirect.jpg = 73.0 KB gz, the single largest
  compressible asset; the small-GLB class runs 3.2-3.8 KB gz.
- ST-231: regression + G13.0 + closeout (the E10/E11/E12 pattern), headlined by the demo
  pin re-verified EXACT via the real UI (the pin-safety proof for the whole epic).
Total: 4 stories, 4 iterations (I233..I236). All bot-verifiable headless; no hardware
needed; no new dependencies.

## Cut Option
If E13 must shrink: (1) ST-230(b) skybox re-encode cuts first - then the STINGER GLB must
budget to <=6 KB gz or the stinger ships procedural-only (the fallback is the floor);
(2) ST-229 juice rungs shrink to the shakeTable entry only (killPunch stays 'unknown' ->
0 for the stinger; documented); (3) ST-228 is the smallest story and always lands first
(I233).

## Deferral
- 8 HUMAN-PENDING perception items (production/bug-triage.md) + a NEW item #9 (stinger
  telegraph/charge feel) appended at ST-229 for the human session.
- Low-end physical device / GPU remainder (HARDWARE-pending checklist, perf-profile.md
  '## I225').
- Combo cap beyond 15 (changes the demo pin's maxCombo; needs a human data point per the
  T1 triage).
- Music quality (HUMAN-PENDING #5). KTX2 (no texture growth beyond the skybox). Touch
  input (later per AGENTS.md).
- The evasive-flyer archetype (grounding #2) - overlaps the seeker's verb; revisit only
  on playtest evidence that the roster is thin.
- Second ship variant / story-mode arc (budget + a bigger pin decision).

## Recommendation
APPROVE as scoped: ST-228..231 + gate G13.0, 4 iterations (I233..I236). Order: ST-228
(I233) -> ST-229 (I234) -> ST-230 (I235, Blender work inside the story) -> ST-231 (I236).
Demo-pin decision (the explicit one the E12 deferral asked for): KEEP the pin - all new
content is gated beyond the demo's wave 2 (modifier W3+, stinger W7+); the demo run (seed
1909, dies wave 2) never reaches it; re-verified via the real UI at ST-231. The daily
canonical run is re-versioned by the salt bump (documented, deterministic, namespaced).

## Risks
- R-E13-1 (med) demo pin drifts from the core content change -> everything gated beyond
  wave 2; stinger spawn code unreachable in the demo; the modifier list extension re-maps
  only wave 3+ rolls; structural argument + a unit check (the demo seed never reaches
  wave 3) + real-UI re-verify at ST-231; the daily salt bump isolates pre/post-content
  daily runs.
- R-E13-2 (med) STINGER readability: telegraph must read at a glance and the charge must
  be dodgeable at 60 fps (bullet-hell rule) -> 0.8 s telegraph (longer than the seeker's
  effective lead), FX-tier-independent emissive glow + dedicated rising SFX, charge
  7.5 u/s x 1.4 s = 10.5 u crossing vs the ship's 6+ u/s escape; scripted-pilot dodge
  scenario in the browser; new HUMAN-PENDING #9 (perception not self-served).
- R-E13-3 (med) gzip budget (headroom ~6.6 KB) -> skybox re-encode funds the GLB; staged
  quality with size evidence + browser A/B; net story delta <= 0 KB; the dist gate is
  hard; the skybox audit test + assetPerf pin the final files.
- R-E13-4 (low) the modifier list extension re-maps the wave 3+ roll (3-way -> 4-way
  index) -> pinned-roll unit tests updated intentionally (documented in the iteration
  log); determinism harness re-run; plain W1-2 + breather invariants unit-pinned.
- R-E13-5 (low) new entity pool/perf growth -> stinger pool 4 (cap 2 + 2 spare), no new
  per-frame allocation path (state on the entity; the drone-renderer pattern is reused),
  memoryBounds tests extended, frame probe at ST-231.

## Changed files (I232, docs only)
- production/scope-check-E13.md (this file, new), production/epics.md (+E13 + risk
  register), production/stories.md (+E13 ST-228..231), production/timeline.md (+E13
  opened line), CHANGELOG.md (+I232), production/iterations.md (+I232),
  production/session-state/active.md. No src changes.

## Verification evidence
- No src changes: npm test 697/697, node scripts/build.mjs exit 0, dist unchanged (105
  files; ~1994.7 KB raw; ~542.3-543.4 KB gzip vs the 550 cap - headroom WATCH carries to
  ST-230), log audit 1..231 sequential pre-append.
- Asset measurement (I232, node + zlib, per-file gzip top list): skybox_equirect.jpg
  73.0 KB (largest compressible asset), three.module.js 250.9 KB (untouchable vendor),
  GLTFLoader.js 22.9 KB, GLB class 3.2-10.9 KB (S/M/warden 3.2-3.8 = the new-small-
  enemy budget class), main.js 21.5 KB.

## Coverage note
YouTube transcript fetches were rate-limited in both rounds (one retry batch, then the
block extended - not retried further per the I207/I223/I227 discipline). Grounding above
uses search metadata + chapter maps + full descriptions (8 queries / 68 unique). The
rammer archetype (grounding #2) is stated in full in the video's own description; the
GMTK enemy-design principles (grounding #1) are chapter-level only. The archetype choice
is corroborated by three independent sources (1up Indie + Bog Hog role separation +
PepperHead verb-based variety) and by the project's own roster gap analysis.

## Next owner / decision
I233: ST-228 (HEAVY ROCKS modifier + daily salt bump) via cgs-dev-story +
cgs-standards-tests.
