# E100 scope check - Structural bolt-residency round: re-landed validated cadence base (P2+P3+Q1) + R1 enemyBullets.life 4.0 -> 3.0 in ONE pass (pre-registered escalation Q4 splicer.phase2.spiralEveryMult 0.65 -> 0.75 ONLY on (d) failure)

Opened I658 (ST-616). Follows the I657 close (E99 G99.0 CLOSED: CLOSEGATE657 6/6 zero re-pins, CLOSE FLOOR E99 329,615 B WITH MEASUREMENT, dist 6,967,985 B / 205 fresh re-measured).

## Why a structural round (the E99 outcome)
- The E99 shape round FAILED (a) on its final measurement: sweep653 (P2+P3+Q1+P4) B56 = 12/30. The 3-point B56 record across the lineage: sweep647 4/30 (P2+P3) / sweep651 8/30 (+Q1) / sweep653 12/30 (+P4) - adding the Monolith SHAPE lever P4 made the wave-5/6 wall WORSE, not better. P4 is DEMOTED (deferral list), not re-landed.
- The decisive detail of sweep653: ALL 12 wave-5 deaths had source=bullet (MONOLITH 6 + bullet_unknown 6), ZERO rock deaths in wave 5, death ticks 5,476-7,440. The wave-5/6 wall is a BULLET wall, measured, not a rock wall.
- Seed-variance band: ~4/30 (sweep647 4/30 vs sweep651 8/30 on the near-identical P2+P3 base with fresh seed sets) - the frozen acceptance (a) at <= 7/30 sits inside the band, as designed.

## The structural finding: steady-state bolt residency
- Residency math: steady-state bolts on screen = fire count x life / cadence. With life = 4.0 s:
  - Monolith burst phase 1: 12 bolts / 4.0 s ring x 4.0 s life = 12 bolts resident AT ALL TIMES. A complete ring never clears.
  - Monolith burst phase 2 (cadence 4.0 x 0.65 = 2.6 s): 12 x 4.0/2.6 = 18.5 resident.
  - Aimed bolts phase 1 (fireEvery 2.2): 4.0/2.2 = 1.81 resident; phase 2: 3.03.
  - Pool saturation: burst + aimed phase 2 = 21.5 of the maxConcurrent 24 cap - the pool is near-saturated in phase 2.
  - Splicer (under Q1, spiralEvery 0.7): (2 arms/0.7 + 1/2.6 aim) x 4.0 = 12.97 resident.
- Every lever round E95-E99 tuned cadence, speed, or geometry. NONE touched the 4.0 s life. The standing 12-bolt ring is the structural floor of the wave-5/6 wall: no timing arrangement can make fewer bolts resident than count x life / cadence.
- R1 (enemyBullets.life 4.0 -> 3.0, config.js:770) cuts residency -25%: phase-1 12 -> 9, phase-2 18.5 -> 13.8, aimed 1.81 -> 1.35 / 3.03 -> 2.27, pool saturation 21.5 -> 16.1, splicer 12.97 -> 9.73. It is the first lever to cut the standing ring itself.
- R1 blast radius: enemyBullets is a World-shared pool - the campaign boss, mine, sentry, and gunship bolts ALL go 4.0 -> 3.0 s (unlike the campaign-isolated E95-E99 levers). NO campaign pin exists in the 6-gate set, and the direction (shorter bolt life = easier to dodge) is a consistent easing, not a difficulty spike. Documented and accepted at open.

## Why re-land P2+P3+Q1 (E99 C1 reverted them)
- The concurrent cadence set is the ONLY configuration ever to move BOTH walls at once (sweep651: B56 10 -> 8/30 AND SPLICER 11 -> 7/30).
- sweep647 (P2+P3) is the lineage-best B56 (4/30); Q1 holds (b) SPLICER at 6-7/30 (the wave-10 baseline is 11/30 - it FAILS (b) without Q1).
- This is a fresh experiment (new lever set P2+P3+Q1+R1, fresh seed set 65900+i, the frozen acceptance adjudicates), not a second fiddle of a rejected round: P2/P3/Q1 left the E99 C1 only as a SHAPE-round base (they failed (a) WITH P4 added), and each individually moved its wall in the direction the goal wants.
- P4 is NOT re-landed: sweep653 shows B56 8 -> 12/30 WITH P4 on top of the identical base. Demoted to the deferral list.

## Wall record (measured; 6-sweep table incl. sweep653)
- sweep642 (I643, baseline, no levers): median 9 / reach13 1/30 / SPLICER primary 11/30 / B56 10/30 / M56' 10/30 / w10 cleared 1/30 (of 14 started) / H primary 21/30 / wall ms 5649. Interpretation: both walls live in the baseline.
- sweep647 (I647, P2+P3 [E96 C1 record]): median 10 / reach13 2/30 / SPLICER primary 13/30 / B56 4/30 (lineage-best) / w10 cleared 5/30 / wall ms 5483. Interpretation: P2+P3 broke wave-5/6 decisively but the wall MOVED to wave-10 SPLICER (13/30).
- sweep649 (I650, Q1 [E97 C1 record]): median 9 / reach13 2/30 / SPLICER primary 6/30 / B56 12/30 / w10 cleared 3/30 (14 started) / wall ms 5458. Interpretation: Q1 broke wave-10 (SPLICER 11 -> 6/30) but B56 12/30 returned, capping the median at 9.
- sweep650 (I650, Q1+Q2 [E97 C1 record]): median 8 / reach13 3/30 / SPLICER primary 5/30 / B56 13/30 / wall ms 4919. Interpretation: Q2 made wave-5/6 WORSE and traded the median 9 -> 8 for reach13 - a depth lever, not a wall lever (REJECTED as the E99 escalation).
- sweep651 (I653, P2+P3+Q1 [E98 C1 record], wall ms 5302): 30/30 died / median 10 / reach13 2/30 / SPLICER primary 7/30 / B56 8/30 / w10 started 17 / cleared 3 / H primary 10/30. Interpretation: the first configuration where BOTH walls moved at once; (b) PASS / (c) PASS / (a) one over (within variance of the sweep647 sibling 4/30) / (d) one short - the E98 C1 trigger was (a).
- sweep653 (I656, P2+P3+Q1+P4 [E99 C1 record], wall ms 4748): 30/30 died / median 10 / reach13 2/30 / SPLICER primary 7/30 / B56 12/30 / ALL 12 wave-5 deaths source=bullet (MONOLITH 6 + bullet_unknown 6), ZERO rock deaths, death ticks 5,476-7,440. Interpretation: the shape lever made the wall worse; the wall is a BULLET-DENSITY wall, measured - the E100 structural thesis.
- Boss alternation: wave 5 Monolith / wave 10 Splicer / wave 15 Monolith (bossSpawnCount even = Monolith, odd = Splicer) - one run crosses BOTH walls; a run killed on wave 10 has already survived wave 5/6.
- Wave-construction grounding (measured this session): game.js:621 spawnBossForWave is a no-op while a boss is alive (the Monolith persists across waves 6-9; the Splicer spawns at wave 10 only if the Monolith is dead; Warden if alive); waves.js:189 wave-clear = toSpawn === 0 && field.killableCount === 0 - the boss is NOT in killableCount, so a boss fight bleeds across waves (the "waiting forever after the wave-8/9 rocks clear" player report IS this rule, plus the standing bolt ring keeping the arena lethal during the bleed). Wave-5 concurrent content: Monolith 64 HP (radius 3.4) + wave rocks (maxConcurrent 24) + mines (start wave 5) + vortex (from wave 8); player L2 from wave 5 (2 bullets @ 5.5/s); arena radius 26.
- R1 blast radius (World-shared pool): campaign boss / mine / sentry / gunship bolts all 4.0 -> 3.0 s; NO campaign pin in the 6-gate set; direction = consistent easing.

## Test-pinning map (measured this session)
- bossBurst.test.js:24-31 "config: boss.burst shape and values": :26 b.every 4.0 [UNTOUCHED], :27 b.count 12 [UNTOUCHED], :28 b.speed 7.0 [RED under P2 -> re-pin to 6.0], :29 b.offsetSpin 0.45 [UNTOUCHED - no P4 in this set], :30 b.everyMult 0.65 [UNTOUCHED].
- bossBurst.test.js:37-38 geometry expectation hardcodes `* 7.0` (the burst ring radius points; bossBurstVectors src/core/boss.js:9-17 reads b.speed from config) [RED under P2 -> re-pin to 6.0].
- e9Batch.test.js:69-76 "bolt dies at exactly cfg life": hardcodes 39 x 0.1 s (3.9 s, assert count 1 "died early") + 1 step (4.0 s, assert count 0) [RED at life 3.0 - the bolt is already dead at 3.9 s -> PRE-REGISTERED data-driven re-pin: steps derived from CONFIG.enemyBullets.life, not hardcoded].
- e9Batch.test.js:78-83 "outward bolts are culled at the rim before their life expires": rimSec = (26+2)/9 = 3.11 s; at life 3.0 the bolt dies by LIFE at 27 u, before the rim at 28 u - the assert (count 0 at ~3.15 s) STILL PASSES but the premise inverts [PRE-REGISTERED premise/comment fix; the assert is unchanged].
- SAFE re-verified: enemyBullets.test.js:35 `e.life > 0` (inequality, PASS at 3.0); splicer.test.js:168 `(arms/spiralEvery + 1/aimEvery) * e.life` (data-driven - follows the config); e8cBatch.test.js:38 snapshot includes x.life but every assert is A/B determinism (assert.equal(run(), run())) - invariant to the value; e8cBatch.test.js:228 "survived 40 steps" = 0.64 s (well under 3.0).
- Suite 1,261: 6 re-pin locations pre-registered, rest SAFE.

## Pre-registered test re-pins (ST-617, WITH MEASUREMENT)
1. bossBurst.test.js:28 `assert.equal(b.speed, 7.0)` -> `assert.equal(b.speed, 6.0)` (occurrence==1 asserted patch) [P2].
2. bossBurst.test.js:37 `Math.cos((i / 12) * TAU) * 7.0` -> `* 6.0` (occurrence==1 asserted patch) [P2].
3. bossBurst.test.js:38 `Math.sin((i / 12) * TAU) * 7.0` -> `* 6.0` (occurrence==1 asserted patch) [P2].
4. e9Batch.test.js:72 loop bound 39 -> derived from CONFIG.enemyBullets.life (Math.ceil(life/0.1) - 1 steps of 0.1 s, assert count 1) [R1].
5. e9Batch.test.js:74 final step comment/step stays 1 x 0.1 s past the derived bound (assert count 0) - the 4.0 s hardcode is gone [R1].
6. e9Batch.test.js:78-83 premise/comment fix only: "culled at the rim before their life expires" -> "life (3.0 s) expires before the rim (3.11 s); the assert verifies the bolt is gone by ~3.15 s either way" - the assert itself is unchanged [R1].
Total: 6 re-pin locations (1 + 2 + 2 + 1). :29 offsetSpin 0.45 stays UNTOUCHED (no P4 in this set).

## Scope Fit
- Code-only: 4 config lines (config.js:281 / :306 / :340 / :770) + 6 test re-pin locations at ST-617 in ONE pass; a 5th config line (Q4, config.js:347) ONLY if the pre-registered (d) escalation fires. No Blender (fleet FROZEN), no new dist files (205), no new source files.
- The levers are same-length literal swaps ('7.0'/'6.0', '2.2'/'2.6', '0.6'/'0.7', '4.0'/'3.0', '0.65'/'0.75' all minify to same-length tokens) - dist EXPECTED byte-identical 6,967,985 B / 205; any delta at ST-617 is measured and documented (worst case +1,000 B budgeted).

## Research (FROZEN at open I658)
- cgs-scope-check + cgs-balance-check applied (scope pre-registration, cut ladder, risk register, measurement protocol).
- YouTube run recorded: 1 search / 3 queries ("bullet hell pattern design bullet density screen coverage" / "Danmaku boss pattern design fairness dodgeable bullet life" / "Hades boss attack pattern design analysis") -> 20 raw results, NO purpose-matched content (closest: a Godot bullet-hell implementation tutorial [code, not density design] + SHMUP player-dodge theory + Hades guides). The in-repo S-library (S3 slower-dodgeable beats fewer; S5 safe-path) + the 6-sweep wall record supersede; nothing invented.
- Balance basis: the in-repo residency math (count x life / cadence) + the 3-point B56 record + the sweep653 wave-5 death-source breakdown (12/12 bullet, 0 rock).

## Landing plan (PRE-REGISTERED)
- ST-616 (I658): this open - scope FROZEN (docs-only).
- ST-617 (I659): apply P2+P3+Q1+R1 ONE pass (config.js:306 + :281 + :340 + :770) + the 6 re-pins + fresh lever-applied npm test (expected 1,261/1,261) + sweep659 (30 fresh seeds 65900+i, rules659.md FROZEN PRE-RUN in .evidence/I659/, content-asserted clone of the sweep653 harness from .evidence/I656/) + acceptance (a)-(e). OR escalation: Q4 (config.js:347 spiralEveryMult 0.65 -> 0.75) + sweep660 (seeds 66000+i, rules660.md FROZEN PRE-RUN in .evidence/I659/) ONLY on (d) failure. OR: an (a) or (b) wall failure -> straight C1 (no Q4 - it is registered for depth, not for the walls).
- ST-618 (I660): G100.0 close gate (clone .evidence/I657/run_close657.cjs -> label CLOSEGATE100, OUTDIR .evidence/I660/) + CLOSE FLOOR E100 WITH MEASUREMENT + AGENTS.md refresh.

## Frozen bounds
- boss: maxHp 64 / radius 3.4 [test-pinned literals, boss.test.js] / burst.every 4.0 [pinned :26] / burst.count 12 [pinned :27] / burst.speed 7.0 [pinned :28 - re-pinned to 6.0 at ST-617] / burst.offsetSpin 0.45 [P4 DEMOTED - untouched] / burst.everyMult 0.65 [pinned :30, P5 deferral] / fireEvery 2.2 [re-pinned lever P3].
- splicer: maxHp 30 / radius 2.6 [test-pinned] / boltSpeed 7.0 / arms 2 / armSpin 1.2 [Q3] / holdRadius 11 / orbitSpeed 0.5 [Q5] / spin 0.4 / enterTime 1.2 / aimEvery 2.6 [Q2 rejected] / spiralEvery 0.6 [re-pinned lever Q1] / phase2.spiralEveryMult 0.65 [Q4 ONLY on (d) escalation].
- enemyBullets: maxConcurrent 24 / radius 0.22 / life 4.0 [re-pinned lever R1] / speed 9 [P6] / mineSpeed 8.
- hp scale both blocks / phase2 blocks (except Q4 if escalation fires) / warden / spawn mix / E94 pacing / vendor / PWA / audio / camera / input / all 34 GLBs (201,245 t) frozen. Campaign path: R1 is the ONE lever that touches campaign bolts via the shared pool - documented blast radius, no campaign pin in the gate set.

## Measurement protocol
- sweep659: 30 fresh seeds 65900+i, full director + kiter, cap 36,000 ticks, headless node; rules659.md FROZEN PRE-RUN in .evidence/I659/ (the frozen acceptance + the wall definitions + the death-source tally format); harness = content-asserted clone of the sweep653 harness (.evidence/I656/) - line-asserted before first run (I583/I570 lessons).
- Acceptance (FROZEN): (a) B56 <= 7/30 / (b) SPLICER wave-10 primary <= 7/30 / (c) median death wave >= 10 / (d) reach wave >= 13 >= 3/30 / (e) 6-harness gate EXACT no re-pin EXCEPT the documented causal483 contingency (EXPECTED EXACT 13,350 per the gate656 precedent; a re-pin is recorded WITH measurement, never silent).
- Gate harnesses (ST-617 + ST-618): causal495 (dist server :4200) / causal483 (dev server :5173, DEMO PILOT) / playframe491 (dev server :5173) / playframe483 (shares the playframe491 windows) / pwa491 (dist server :5199) / fleet628 (34/34 GLB / 201,245 t).
- Every run: wall ms + per-run lines + tallies recorded in .evidence/I659/results659.txt (and results660.txt if escalated).

## Budget (pre-registered)
- Start (I657 close, fresh dist re-measured): 6,967,985 B / 205 files.
- Close target: 7,297,600 B (7,400,000 ceiling - 102,400 B close-floor).
- Envelope at open: 329,615 B.
- ST-617 expected delta: 0 B (same-length literal swaps; test files are not shipped to dist). Worst-case budget: +1,000 B (measured, documented).
- Cut ladder floor: 102,400 B (never cross the close target).

## Cut ladder (pre-registered)
- C1 (frozen): git restore src/core/config.js tests/bossBurst.test.js tests/e9Batch.test.js (ONE atomic restore of ALL THREE files - reverts P2, P3, Q1, R1, any applied Q4, and all 6 re-pins) + accept-with-documentation + deferrals to E101+ WITH the sweep659/660 records: Q3 (armSpin 1.2 -> 0.9) / Q5 (orbitSpeed 0.5 -> 0.35) / P5 (everyMult 0.65 -> 0.75) / P6 (enemyBullets.speed 9 -> 8) / P4 DEMOTED / structural residual (if (a) still fails under R1: the next structural class is wave-5 wave CONSTRUCTION [waves.js:189 clear rule + the concurrent content], not a further bolt lever) + close as accept round (E78/E80/E81/E82/E95/E96/E97/E99 pattern).
- No second fiddle: one pass per landing; each ladder invocation recorded as an AMENDMENT.

## REJECTED at open
- P4 re-land (burst.offsetSpin 0.45 -> 0.30): DATA - sweep653 B56 8 -> 12/30 WITH P4 on the identical base. Demoted, not re-landed.
- burst.count 12 -> 8: violates S3 (fewer-dodgeable beats fewer - count IS the dodgeable structure; life is the density) and is test-pinned at bossBurst.test.js:27.
- ringCount 8 -> 7: S3, same reason.
- boss.maxHp 64 / splicer.maxHp 30: test-pinned literals (boss.test.js / splicer.test.js) - a change ripples into the pin set for no measured benefit.
- wave-5 rock density reduction: a CODE change (waves.js), pin-risk beyond the config-lever class - E101 candidate (the structural-residual deferral names it).
- Warden suppression (wave 10): the Warden is NOT a wall source in the sweep653 death tally - no measured basis.
- R1 4.0 -> 2.0: over-correction, unmeasured jump - 4.0 -> 3.0 is the single measured step (-25% residency); 2.0 would be a second unmeasured leap (phase-1 residency 12 -> 6, a 50% cut with zero sweep data).

## Deferrals (out of E100, queue intact)
- Q3 splicer.armSpin 1.2 -> 0.9 / Q5 splicer.orbitSpeed 0.5 -> 0.35 / P5 burst.everyMult 0.65 -> 0.75 / P6 enemyBullets.speed 9 -> 8 / P4 burst.offsetSpin 0.45 -> 0.30 (DEMOTED - data) / structural residual (wave-5 wave construction: the waves.js:189 clear rule + the concurrent content, IF (a) still fails under R1).

## Risks
- R-1: R1 has never been swept - the frozen acceptance (a)-(e) is the arbiter, no pre-derivation (I570 pattern).
- R-2: the B56 seed-variance band is ~4/30; (a) at <= 7/30 sits mid-band - sweep659's record is the E101 decision input either way (pass or fail).
- R-3: the re-land depends on seed variance (fresh seed set 65900+i); the frozen acceptance bands are tolerance-aware.
- R-4: R1 is a World-shared pool change (campaign boss / mine / sentry / gunship bolts all 4.0 -> 3.0 s) - unlike the campaign-isolated E95-E99 levers; NO campaign pin in the 6-gate set; direction = consistent easing (documented blast radius).
- R-5: causal483 is the DEMO PILOT full browser run - EXPECTED EXACT 13,350 (gate656 precedent: the wave-5 boss levers left it EXACT) with a PRE-REGISTERED documented re-pin WITH MEASUREMENT if the demo pilot reaches wave 5.
- R-6: sweep659 clone line-asserted + content-asserted before first run (I583/I570 lessons).
- R-7: re-pin correctness - a wrong re-pin = red suite at ST-617; the fresh lever-applied npm test (expected 1,261/1,261) catches it before the sweep; C1's atomic restore covers all three files.

## Verification evidence
- I657 close (lineage anchor): CLOSEGATE657 6/6 EXACT zero re-pins; dist 6,967,985 B / 205 fresh re-measured; CLOSE FLOOR E99 329,615 B WITH MEASUREMENT; npm test 1,261/1,261.
- This open: lever lines re-measured on disk (config.js:281 fireEvery 2.2 / :306 burst.speed 7.0 / :307 offsetSpin 0.45 untouched / :340 spiralEvery 0.6 / :347 spiralEveryMult 0.65 / :770 life 4.0); bossBurst.test.js:24-31 / :37-38 re-measured; e9Batch.test.js:69-83 re-measured; sweep653 results re-read (.evidence/I656/results653.txt: 12/12 wave-5 bullet deaths, ticks 5,476-7,440); scope-check-E100.md absent (this file, NEW).

## DoD
- ST-616 (I658): 7-file bookkeeping, ONE atomic commit, dist byte-identical 6,967,985 B / 205, npm test 1,261/1,261, vendor 4/4 + decoder D428E73A000057C6.
- ST-617 (I659): lever pass + 6 re-pins + fresh lever-applied npm test 1,261/1,261 + sweep659 record + acceptance (a)-(e) verdict (OR Q4 + sweep660 OR C1).
- ST-618 (I660): G100.0 close gate 6/6 (with the documented causal483 contingency honored if fired) + CLOSE FLOOR E100 WITH MEASUREMENT + AGENTS.md refresh.

## Next owner
- ST-617 (I659) per the landing plan.
