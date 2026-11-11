# Scope Check - E14: Late-Run Mastery Arc (I237)

## Summary
E13 closed at I236 (G13.0 PASS). E14 takes the two remaining self-serve levers from the
carryover list: the EVASIVE FLYER enemy (the last missing standard archetype per the E13
roster gap analysis) and the COMBO MASTERY REBALANCE (T1 triage: cap 15 is reached in ~12 s
by an active pilot, then flat 2.4x for the rest of the run - a participation ceiling, not a
skill ceiling). Both are demo-pin-compatible BY GATING: the flyer is gated at wave 9+ and
the combo cap change applies only at wave 3+ (the demo run dies on wave 2 - structurally
unreachable). 4 stories + gate G14.0 over 4 iterations (I238..I241): ST-232 FLYER evasive
enemy, ST-233 combo cap wave-scaling, ST-234 Blender FLYER model (18th asset), ST-235
regression + G14.0 + closeout. No daily salt bump needed (the daily run, like the demo, is
wave 1-2 and never consults either new gate). No new dependencies; every story
bot-verifiable headless.

## YouTube grounding (I237: 5 queries / 40 unique; metadata + chapters + descriptions; transcripts rate-limited - Coverage note at the end)
1. Bog Hog, "Enemy Design & Effects [SHMUP WORKSHOP 04]" (12K views, 2023-01; youtu.be/999tBKu8hNE).
   Chapter map (transcript rate-limited, chapters complete): enemy roles and synergy,
   creating dynamic encounters, the life cycle of an enemy, enemy priority mechanics,
   balancing and frustration, enemy feedback and interaction. Takeaway: a roster wants ONE
   archetype per role with a legible life cycle; the flyer (evasive target) is a distinct
   role from the charger (stinger) and the seekers (drone/mine).
2. Stardust (1993, Amiga) - "The Amiga Asteroids Game That Looked Years Ahead" (Cheeky
   Commodore Gamer, 2K, 2025-06; youtu.be/Pd-vYzM9MLc): the asteroids-style genre's
   canonical depth markers are power-ups, boss encounters, high-speed tunnel sequences and
   dense enemy patterns - late-run intensity comes from LAYERED patterns, not one more
   damage number.
3. 1up Indie, "Wave flyer + rammer [GMS2 Enemy AI]" (7.4K, 2022-01; youtu.be/IqXsJ90qeW4)
   (E13 grounding #2, carried): the flyer "has a changed y value all the time" - sine
   evasion around a slow cruise. The rammer half was built in E13 (STINGER); the flyer half
   is this epic's ST-232.
4. Asteroids (1979) canonical UFO archetype (project knowledge, corroborated by the genre
   videos above): a slow, evasive, high-value TARGET with no contact lethality and no
   return fire - the "skill shot" slot. The flyer is this project's UFO.
5. Extra Credits, "Progression Systems - How Good Games Avoid Skinner Boxes" (1.3M,
   2015-11; youtu.be/S5camMoNw-o): flat rewards past a reachable ceiling feel dead; a
   mastery ceiling that RISES in the late run keeps the top band alive (the T1 combo
   flatline is exactly this failure mode).
6. Roster gap re-analysis (this project, post-E13): rocks (split tank + shielded + golden),
   mine (W5 slow homing), stinger (W7 charger = dodge/timing verb), drone (W8 fast homing
   seeker = weave verb), warden (armored), two boss variants (Monolith + Splicer), belt,
   vortex, 4 modifiers. The seeker VERB is now saturated (mine + drone); the missing
   standard archetype is the evasive HIGH-VALUE TARGET - no current target rewards manual
   shot-leading (all targets are static rocks or slow drones; the game has camera lead but
   no aim assist, so hitting a weaving target is a pure skill shot). The flyer wins the
   slot; the E13 "overlaps the seeker verb" objection is obsolete post-rammer (the
   flyer's verb is Hitting a moving target, the seekers' verb is dodging pursuit).

## Scope Fit
- ST-232 (FLYER evasive enemy): the UFO archetype as a new late-run skill target.
  Pure-core src/core/flyer.js FlyerField: enter from the rim (15 u, stinger pattern) ->
  cruise 2.5 u/s across the arena with a perpendicular sine weave (amplitude ~1.2 u,
  period ~0.9 s - the weave continuously re-aims, so leading the shot is required; tune
  window: the bot's lead-shot model should land ~50-70% at max ship speed, ~30% at low)
  -> lifetime ~9-12 s then exit (fade at the rim, NO score - the fizzle precedent of the
  stinger battery) or die: 2 hits (S-bullet), kill +400 (stinger 250; UFO is
  high-value) + distinctive kill burst + high-pitch chime SFX + kill-feed row FLYER.
  NO contact lethality (passing through is harmless - it is a target, not a threat;
  keeps the dodge/aim split clean: stinger = dodge verb, flyer = aim verb, same wave band
  can demand both). Spawn: wave 9+ (after drones at 8; the W7-8 band is already dense),
  1/wave, cap 2 concurrent, pool 4. FX: procedural fallback (elongated hexa-disc) at all
  tiers, GLB swap at high/low via the assetLoader useGLB hook (18th asset, ST-234);
  reduced-motion: weave amplitude reduced (motion kept - it is the enemy's identity,
  stinger-glow-kept/wobble-gated precedent applied to the motion itself). CONFIG.flyer,
  toast on first spawn, 2 SFX cues (spawn chime + kill chime). Deterministic: all motion
  from the seeded rng + world time (pure functions, unit-testable: weave position at
  pinned times, lifetime, cap, hit count, score).
- ST-233 (combo cap wave-scaling): capFor(wave) - pure function in score.js (or config):
  wave 1-2 -> cap 15 (EXACT current behavior - the demo pin is structurally untouched),
  wave 3+ -> cap 20 (step 0.1 unchanged -> multiplier ceiling 2.4x -> 2.9x in the mastery
  band). The T1 flatline is fixed exactly where mastery matters (late run); W1-2 stays a
  flat onboarding band (accepted trade-off, documented - R-E14-5). HUD: the 5 discrete
  tiers (I111) re-map to the 2.9x ceiling (tier boundaries from cap, not hardcoded 15 -
  verify the tier math is cap-relative in score.js before the change; if it is hardcoded,
  one-line fix + test). config.combo.cap stays as the W1-2 value (rename in comment to
  capLow; capHigh 20 new). No storage/codec impact (the cap is not persisted).
- ST-234 (Blender FLYER model + asset budget): 18th GLB - UFO saucer: low-poly disc hull
  (<=120 tris total, <=3 materials, POSITION+NORMAL only, VR_Flyer_Body naming), budget
  <= 10 KB raw / <= 4 KB gz (headroom 13.0 KB after I235; must leave >= 8 KB after the
  story -> spendable ~5 KB gz - comfortably inside). assetGlbs/assetPerf extend 17 -> 18.
  Browser: 18/18 loads + fallback + pool shares GLB geometry (stinger pattern).
- ST-235 (regression + G14.0 + closeout): same template as ST-231 - node matrix 3/3,
  build, dist budget, state machine, persistence, demo pin EXACT via the real UI (the
  headline - the combo cap change is the only E14 piece near the pin), FX-off zero-leak,
  user-lock, fresh pilot, frame probe, console 0/0, log audit.

## Cut Option
If the 4-story arc proves too large: cut ST-233 (combo) - the flyer stands alone as a
complete content story (it does not depend on the combo change) and ST-234/ST-235 follow
it; the combo rebalance carries to E15. The flyer-first ordering is the safe slice.

## Deferral
- Music quality (HUMAN-PENDING #5) and hardware remainder (HARDWARE-pending) stay parked -
  they need a human session / physical device, not this epic.
- Touch fallback: deferred (larger platform arc; needs its own scope check + touch
  emulation evidence).
- The W1-2 combo flatline is ACCEPTED as-is (onboarding band) - not a deferral, a
  documented non-goal (R-E14-5).
- New HUMAN-PENDING item to append at ST-232: #10 flyer weave feel (hit-rate perception
  is not self-served).

## Recommendation
APPROVE E14 as scoped: 4 stories ST-232..235 over I238..I241, gate G14.0. The flyer fills
the last standard archetype slot with a genuinely new player verb (manual shot-leading at
a weaving target - the game has camera lead but no aim assist, so the verb is pure
skill); the combo cap wave-scaling fixes the T1 flatline in the mastery band while keeping
the demo pin structurally untouched by the wave gate. Both pieces are demo-pin-compatible
by gating (flyer W9+, cap W3+; the demo dies on wave 2) and the daily run needs no salt
bump for the same reason.

## Risks
- R-E14-1 (med) flyer hit-rate perception: too easy (no verb) or too hard (frustration)
  -> the weave (amplitude/period/speed) is tuned against a bot lead-shot model measured in
  the browser (hit-rate at pinned ship speeds); HUMAN-PENDING #10 for the feel.
- R-E14-2 (low) demo pin drift from the combo cap change -> wave gate is structural
  (capFor(1)=capFor(2)=15 exact; the demo dies on wave 2), the replay pin test
  (tests/replay.test.js:246) must pass UNMODIFIED, and the pin is re-verified via the
  real UI at ST-235.
- R-E14-3 (low) gzip budget: headroom 13.0 KB -> flyer GLB staged <= 4 KB gz, dist gate
  is a hard criterion, assetPerf audit extends to 18 and pins the final files.
- R-E14-4 (low) late-run density overload (W9+: drones + stinger + flyer concurrent) ->
  cap 2, 1/wave, lifetime-bounded (9-12 s), pool 4; the bot pilot soak at G14.0 covers
  the worst-case stack.
- R-E14-5 (low) the W1-2 combo band stays flat 2.4x (accepted onboarding trade-off;
  documented in the GDD so it is not re-flagged as a bug) + the HUD tier re-map must
  stay cap-relative (unit test on the tier boundaries at both caps).

## Changed files or proposed files
- production/scope-check-E14.md (this file), production/epics.md (+E14 section + risk
  register), production/stories.md (+E14 section), production/timeline.md (+E14 opened
  line), CHANGELOG.md (+I237), production/iterations.md (+I237),
  production/session-state/active.md. No src/, design/ or test changes in this
  iteration (docs-only open; code lands in I238+).

## Verification evidence
- Docs-only iteration: npm test expected 710/710 (count unchanged), build exit 0, dist
  unchanged (108 files / 2002.7 raw / 537.0 gzip KB). Log audit 1..236 -> 1..237.

## Coverage note (YouTube)
Transcript fetches were rate-limited this round (details/chapters/descriptions complete;
the SHMUP workshop transcript retry was still inside the rate-limit window). Grounding
above uses search metadata + chapter maps + full descriptions (5 queries / 40 unique) +
the E13 grounding record (scope-check-E13.md #2/#3, carried). The flyer archetype is
corroborated by four independent sources (1up Indie sine evasion + Bog Hog role
separation + Stardust layered late-run patterns + the canonical Asteroids UFO) and by the
project's own roster re-analysis.

## Next owner / decision
I238: ST-232 (FLYER evasive enemy) via cgs-dev-story + cgs-standards-tests.