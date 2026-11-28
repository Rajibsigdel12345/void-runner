# E102 scope check - Median-lift round: re-landed E101 set (P2+P3+Q1+R1+S1@0.67) + G1 gunship.boltSpeed 5.5 -> 5.0 in ONE pass

Opened I664 (ST-622). Follows the I663 close (E101 G101.0 CLOSED: CLOSEGATE663 6/6 EXACT zero re-pins, CLOSE FLOOR E101 = 329,615 B WITH MEASUREMENT, dist 6,967,985 B / 205 fresh re-measured; byte-identical I640->I663).

## Why a median-lift round (the E101 outcome)
- The E101 frozen set (P2+P3+Q1+R1+S1@0.67) applied ONE pass at I662 FAILED exactly one gate at its measurement: (c) median 9.5 vs >= 10 (sweep661: (a) B56 5/30 PASS best-in-lineage / (b) SPLICER 7/30 PASS / (d) reach13 3/30 PASS) -> straight C1 per the frozen adjudication (byte-identical revert at I662; E101 closed as an accept round at I663).
- S1's first-ever measurement is DIRECTIONAL: B56 8/30 (sweep659) -> 5/30 (sweep661, best-in-lineage of the 5-point record 4/8/12/8/5) + w10cleared 5/30 -> 8/30 - but (c) median 10 -> 9.5. Thinner boss waves alone do not hold the median.
- The I663 close fork: "(1) pair S1 with a median-lifting lever, or (2) first run a baseline sweep to measure the seed-variance band of the 10 median." This scope check resolves it with measurement (below): the median wall is a LOCATED, measured, leverable enemy window - option (1), with the lever chosen by the per-wave source decomposition, not by the pre-round hypothesis.

## The E102 finding (measured this session, WITH MEASUREMENT)
- Per-wave death derivation: the per-wave tables in .evidence/I659/results659.txt and .evidence/I662/results661.txt report startedRuns monotonically non-increasing (verified both files), so deaths exactly at wave N = started(N) - started(N+1). Both derive to exactly 30/30.
- sweep659 (P2+P3+Q1+R1, no S1; median 10): w5 7 / w6 1 / w7 1 / w8 4 / w9 1 / w10 9 / w11 1 / w12 1 / w13 2 / w14 2 / w18 1.
- sweep661 (+S1; median 9.5): w5 5 / w8 5 / w9 5 / w10 8 / w11 1 / w12 3 / w13 2 / w15 1.
- The shift: S1 thinned wave 5 (9 -> 5 deaths) and the wave-10 window (9 -> 8), but deaths SHIFTED DOWNSTREAM into the wave-8/9 window: 5 -> 10 (doubled). The 15th death moved from wave 10 to wave 9 - that IS the median 10 -> 9.5 (for 30 runs, median >= 10 needs <= 14 deaths at or before wave 9; sweep661 has 15).
- Per-wave death sources (killingBlow.clsPrimary from .evidence/I659/sweep659.json and .evidence/I662/sweep661.json):
  - sweep659 w8/9 (5 deaths): gunship 4 + rock_M 1.
  - sweep661 w8/9 (10 deaths): gunship 4 + rock_M 3 + rock_S 2 + mine 1.
  - sweep661 overall (30 deaths): gunship 6 (w8 2 + w9 2 + w12 1 + w13 1) = the TOP source class in the sweep; SPLICER 7 (all at w10, gate (b) already PASS); rocks 9 total spread w5-w13; mine 1.
- THE DECISIVE MEASUREMENT - the boss is ABSENT from the measured median wall: at the death moment, killingBlow.heavyweight.boss is null in 0/5 (sweep659) and 0/10 (sweep661) of the wave-8/9 deaths (bossAliveAtDeath 0/15 total); the same for warden. The Monolith is killed by the kiter at wave 5/6 in 27/30 sweep661 runs (bossDeaths non-empty). The checkpoint draft's premise "the wave-8/9 window's standing pressure = the persistent Monolith's bolt ring" is NOT supported by the measurement: the wave-8/9 wall is ordinary mid-game pressure - the wave-8-debuting gunship's heavy bolts + the natural rock ramp + one mine.

## The lever adjudication (P5 vetoed, P6 reinterpreted, G1 selected - all WITH MEASUREMENT)
- P5 (boss.burst.everyMult 0.65 -> 0.75, config.js:308) VETOED as the E102 lever: it only moves the Monolith's PHASE-2 (enrage) radial-burst cadence (2.6 s -> 3.0 s). Phase 2 is one-way below hpFrac 0.5 (config.js:296-302; boss.js:93-94) - a state reached, if at all, DURING the wave-5/6 boss fight. The measured median wall (wave 8/9) has NO boss present (0/15), and (a) B56 - the only window where the Monolith's bolts act - already PASSES 5/30. A lever whose mechanism does not intersect the failing gate is not a median-lifting lever. Demoted to the deferral queue WITH this measurement (re-testable if a future round puts the Monolith back on the wall, e.g. via a slower-killing pilot or a TTK lever).
- P6 (enemyBullets.speed 9 -> 8) REINTERPRETED, not the gunship lever: enemyBullets.speed is used ONLY for the boss's AIMED bolts (game.js:391/:406 fireAimedBolt(this.boss.pos, this.cfg.enemyBullets.speed)). The GUNSHIP fires cfg.gunship.boltSpeed (game.js:318) - its own config value. P6 is therefore a boss-aimed-bolt lever (wave-5/wave-10 window material), not a wave-8/9 lever. Deferral queue kept, semantics corrected.
- G1 (NEW) gunship.boltSpeed 5.5 -> 5.0 (config.js:496, occurrence==1 verified): the GUNSHIP (config.js:471-501: firstWave 8 [config.js:477 - it DEBUTS exactly at the measured wall], perWave 1, maxConcurrent 1, radius 1.6, hp 10, fireEvery 2.6, armDur 0.9 telegraph, boltSpeed 5.5, boltRadius 0.5, maxAge 30) is the single largest measured death source in the failing window (4/10 sweep661, 4/5 sweep659) and the top source class overall in sweep661 (6/30). Its heavy 5.5 u/s bolt (radius 0.5, "slower and larger than a normal enemy bolt" - config.js:496-497) is what lands after the 0.9 s arm telegraph. 5.5 -> 5.0 = +10% post-telegraph reaction time on the window's dominant lethal. Single-enemy speed lever - the same class shape as the lineage-best P2 (boss.burst.speed 7.0 -> 6.0; P2+P3 = B56 4/30). Blast radius: the gunship only (firstWave 8+), no other config consumer.
- Why NOT the alternatives (measured): rocks are 5/10 of the window (the natural contentFor ramp - 12/13 at w8/w9) but a rock-ramp lever (speedPerWave 0.06 -> 0.05) touches EVERY wave, not just w8/9 - broader than the single-enemy lever; a non-boss wave-8/9 content taper (S2) is a SECOND structural class concurrent with S1 = attribution confound (the P4 lesson); the mine is 1/10 - no basis. The gunship's concentration (4/10 in-window, debuting exactly at the window) favors the targeted lever first; S2/rock-ramp stay E103 material.

## Why re-land P2+P3+Q1+R1+S1 (E101 C1 reverted them)
- The revert was a ROUND verdict ((c) FAIL on the concurrent set), not a rejection of any lever: no lever in the set moved a wall in the wrong direction in any sweep.
- S1 in particular is directionally validated (B56 8/30 -> 5/30 best-in-lineage; w10cleared 5/30 -> 8/30) - its wave-5 thinning is what EXPOSED the wave-8/9 wall (runs that survived the thinner stack now reach it) and what buys the (a) margin. The median lift must come from the wave-8/9 lever (G1) layered on the thinned stack, not instead of it.
- P2+P3: sweep647 lineage-best B56 4/30. Q1: the only lever holding (b) SPLICER at 6-7/30 (the wave-10 baseline is 11/30 - it fails (b) without Q1). R1: the Monolith-primary wall killer (M56 6/30 -> 0/30).
- P4 stays DEMOTED, not re-landed: sweep653 B56 8 -> 12/30 WITH P4 on the identical base.
- This is a fresh experiment (set P2+P3+Q1+R1+S1+G1, fresh seed set 66400+i, the frozen acceptance adjudicates).

## Wall record (measured; 8-sweep table)
- sweep642 (I643, baseline, no levers): median 9 / reach13 1/30 / SPLICER primary 11/30 / B56 10/30 / M56' 10/30 / w10 cleared 1/30 (of 14 started) / H primary 21/30 / wall ms 5649.
- sweep647 (I647, P2+P3): median 10 / reach13 2/30 / SPLICER primary 13/30 / B56 4/30 (lineage-best) / w10 cleared 5/30 / wall ms 5483.
- sweep649 (I650, Q1): median 9 / reach13 2/30 / SPLICER primary 6/30 / B56 12/30 / w10 cleared 3/30 / wall ms 5458.
- sweep650 (I650, Q1+Q2): median 8 / reach13 3/30 / SPLICER primary 5/30 / B56 13/30 / wall ms 4919 (Q2 REJECTED as an escalation - a depth lever, not a wall lever).
- sweep651 (I653, P2+P3+Q1): median 10 / reach13 2/30 / SPLICER primary 7/30 / B56 8/30 / w10 started 17 / cleared 3 / H primary 10/30 / wall ms 5302.
- sweep653 (I656, +P4): 30/30 died / median 10 / reach13 2/30 / SPLICER primary 7/30 / B56 12/30 / ALL 12 wave-5 deaths source=bullet / wall ms 4748 (P4 DEMOTED - data).
- sweep659 (I659, P2+P3+Q1+R1): 30/30 died / median 10 / reach13 5/30 / SPLICER 7/30 / B56 8/30 / M56 0/30 / H 7/30 / w10 started 16 / cleared 5 / wall ms 20,531 ((a) FAIL 8/30 -> C1; the E101 construction finding).
- sweep661 (I662, +S1@0.67): 30/30 died / median 9.5 / reach13 3/30 / SPLICER 7/30 / B56 5/30 (best-in-lineage) / M56 3/30 / M56' 5/30 / H 11/30 / w10cleared 8/30 / wall ms 7,866 ((c) FAIL 9.5 -> C1; THE E102 record - per-wave shift + sources above).

## Test-pinning map (measured this session, all occurrence==1 on disk, CRLF-aware)
Re-land (11 sites - the EXACT I662 set, with the I662 AMENDMENT now PRE-REGISTERED):
1. bossBurst.test.js:28 `assert.equal(b.speed, 7.0)` -> `6.0` [P2].
2-5. bossBurst.test.js:37-38 even-spacing `* 7.0` -> `* 6.0` x2 + :48-49 offset-rotation `* 7.0` -> `* 6.0` x2 (4 geometry sites, 2 context-qualified pairs - the I662 patch662.cjs pattern; `* 7.0` occurrence==4 total) [P2].
6. e9Batch.test.js:69-76 "bolt dies at exactly cfg life" data-driven re-pin from CONFIG.enemyBullets.life (loop bound + final step; the single `4.0` reference, occurrence==1) [R1].
7-8. e9Batch.test.js:78 rim-cull title + :81 premise comment (assert unchanged - at life 3.0 the bolt dies by life (3.0 s) before the rim (3.11 s), the premise inverts but the assert holds) [R1].
9. endless.test.js:40 `contentFor(10), 14` -> `9` (boss wave 10: round(14 x 0.67)) [S1].
10. endless.test.js:42 `contentFor(50), CONFIG.waveEndless.contentCap` -> `24` (boss wave 50: round(36 x 0.67)) [S1].
11. endless.test.js:111 director-run wave-10 spawned-rock-count `14` -> `9` (the I662 AMENDMENT - the behavioral director-run assert the E101 pin map missed; PRE-REGISTERED this round; C1's atomic restore covers it - it lives in endless.test.js) [S1].
G1 (2 sites):
12. config.js:496 `boltSpeed: 5.5` -> `boltSpeed: 5.0` (occurrence==1 verified; the comment "slower than the normal 9 - lobbed, dodgeable" stays true at 5.0) [G1].
13. gunship.test.js:34 `assert.equal(s.boltSpeed, 5.5, 'slow heavy bolt')` -> `5.0` (occurrence==1 verified) [G1].
SAFE (re-verified this session):
- gunship.test.js:37 `assert.ok(s.boltSpeed < CONFIG.enemyBullets.speed)` - inequality, PASS at 5.0 < 9.0.
- endless.test.js:46 toSpawn pin [wave 41 after step: 41 % 5 = 1, NOT a boss wave -> 36 = contentCap, UNCHANGED].
- waves.test.js: full re-scan (E101) - ALL pins on non-boss waves (1, 2, 4, 6-breather, 10-concurrentLimit, 11, 16, 20) -> ZERO re-pins; G1 does not touch waves.js.
- enemyBullets.test.js:35 `e.speed < CONFIG.ship.maxSpeed` (inequality, PASS); splicer.test.js:159-160 data-driven gap math; e8cBatch.test.js A/B determinism (value-invariant); golden.test.js / determinism.test.js / e9Batch / e8cBatch: ZERO gunship references (re-scanned this session).
- bossBurst.test.js:26 b.every 4.0 + :27 b.count 12 + :29 offsetSpin 0.45 + :30 everyMult 0.65 UNTOUCHED (no P4, no P5 this round).
- assetPerf/assetGlbs GLB pins: no GLB change (34/34 / 201,245 t frozen).
- Campaign: G1 is MODE-SHARED (the gunship is the campaign's wave-8 enemy too) - no campaign test pins gunship.boltSpeed (re-scanned); S1's campaign exposure is unchanged from E101 (level-flow.test.js:184 pins only w.field.count == 0). The fresh lever-applied npm test (the R-7 designed catch) is the final arbiter, campaign suite included; any additional red beyond the 13 pre-registered sites = AMENDMENT (I656/I583/I662 pattern), recorded.

## Scope Fit
- Code-only: 6 config lines (P2 :306 / P3 :281 / Q1 :340 / R1 :770 re-land + S1 NEW :216 bossContentFrac 0.67 + G1 :496) + 2 waves.js sites (contentFor body taper + the new isBossWave method) + 13 test re-pin sites at ST-623 in ONE pass. ONE new lever this round (G1) - the P4 lesson (concurrent new levers confound attribution); the re-landed block is the measured E101 set. No Blender (fleet FROZEN), no new dist files (205).
- I664 = docs-only -> dist byte-identical 6,967,985 B / 205. I665 = CODE change (config.js + waves.js + tests) -> dist delta NON-zero expected (a few hundred B - config values + waves.js taper; test files are not shipped); budget +1,000 B worst case, measured and documented.

## Research (FROZEN at open I664)
- cgs-scope-check + cgs-balance-check applied (scope pre-registration, cut ladder, risk register, measurement protocol; the lever chosen by the per-wave source decomposition, not by pre-round hypothesis - the cgs-balance-check measurement-over-invention rule).
- NO new external research this round: the lever is an in-repo config change with the mechanism verified in code (config.js:471-501 / game.js:318 / boss.js:93-94 / the sweep harness attribution rules) and the 8-sweep in-repo record (sweep642/647/649/650/651/653/659/661) + the two JSON per-seed breakdowns supersede any external source (E101 YouTube finding: no purpose-matched content).

## Landing plan (PRE-REGISTERED)
- ST-622 (I664): this open - scope FROZEN (docs-only, dist byte-identical).
- ST-623 (I665): apply P2+P3+Q1+R1+S1+G1 ONE pass (patch665.cjs modeled on the I662 patch662.cjs + patch662_amend.cjs pattern, every string occurrence==1-asserted, CRLF-aware; 6 config lines + 2 waves.js sites + 13 re-pins) + fresh lever-applied npm test (expected 1,261/1,261; any additional red beyond the 13 pre-registered sites = AMENDMENT, recorded) + sweep664 (30 fresh seeds 66400+i, rules664.md FROZEN PRE-RUN in .evidence/I665/, content-asserted clone of the .evidence/I662/sweep661.mjs harness - line-asserted before first run [I583/I570 lessons]; BULLET_LIFE_TICKS stays 3/DT since R1 is re-landed; G1 needs NO harness change - gunship attribution is radius-based [boltRadius 0.5 != 0.22, sweep661.mjs:113-114] and BASE_SPEEDS [7,8,9,10,15] contains neither 5.5 nor 5.0) + acceptance (a)-(e). NO escalation lever pre-registered this round.
- ST-624 (I666): G102.0 close gate (clone .evidence/I663/run_close663.cjs -> .evidence/I666/run_close666.cjs, label CLOSEGATE666, OUTDIR .evidence/I666/, PRE-RUN 6/6 marker re-verify against the I665 GATE664 .out files) + CLOSE FLOOR E102 WITH MEASUREMENT + AGENTS.md refresh.

## Frozen bounds
- wave block: base 4 / growth 1 / maxConcurrentGrowth 2 / speedPerWave 0.06 / speedCap 2.1 / maxConcurrentCap 24 / intermission 2.2 / stallTime 45 / leftover {max 4, stall 10} / stragglerBeacon / clearBonus / spawnMinPlayerDist 8 / breatherOpenFrac 0.5 / breatherMinRocks 3 ALL untouched - bossContentFrac 0.67 re-landed is the ONLY wave-block change.
- gunship block: firstWave 8 / perWave 1 / maxConcurrent 1 / enterSpeed 3.0 / holdRadiusMin 0.35 / holdRadiusMax 0.65 / holdDist 2.0 / driftOmega 0.25 / driftR 1.5 / hp 10 / fireEvery 2.6 / armDur 0.9 / boltRadius 0.5 / maxAge 30 / rimDist 14 / score 600 ALL untouched - boltSpeed 5.5 -> 5.0 is the ONLY gunship-block change.
- boss: maxHp 64 / radius 3.4 [test-pinned literals, boss.test.js] / burst.every 4.0 [pinned :26] / burst.count 12 [pinned :27] / burst.speed 7.0 [pinned :28 - re-pinned to 6.0 at ST-623] / burst.offsetSpin 0.45 [P4 DEMOTED - untouched] / burst.everyMult 0.65 [pinned :30, UNTOUCHED this round - P5 vetoed] / fireEvery 2.2 [re-landed lever P3] / phase2 block {hpFrac 0.5, speedMult 1.3, turnMult 1.4, spin 1.6, ringEveryMult 0.6} frozen / enterTime 0.8.
- splicer: maxHp 30 / radius 2.6 [test-pinned] / boltSpeed 7.0 / arms 2 / armSpin 1.2 [Q3] / holdRadius 11 / orbitSpeed 0.5 [Q5] / spin 0.4 / enterTime 1.2 / aimEvery 2.6 [Q2 rejected] / spiralEvery 0.6 [re-landed lever Q1] / phase2 block frozen.
- enemyBullets: maxConcurrent 24 / radius 0.22 / life 4.0 [re-landed lever R1] / speed 9.0 [P6 - UNTOUCHED this round, semantics corrected to boss-aimed-bolt] / mineSpeed 8.
- mines: firstWave 5 / perWave 1 / maxConcurrent 10 / radius 0.9 / speed 3.2 / turn 1.6 frozen (REJECTED: firstWave 5 -> 6 - 1 mine death in the window, no basis).
- hp scale both blocks / warden / other enemy blocks (sentry boltSpeed 9.0 at :531 / wasp / phantom / hauler / bulwark / sweeper 10 / beacon) / spawn mix / E94 pacing / campaign (flightPath / levelState / campaign boss / checkpoint / storage) / vendor / PWA / audio / camera / input / all 34 GLBs (201,245 t) frozen.

## Measurement protocol
- sweep664: 30 fresh seeds 66400+i, full director + kiter, cap 36,000 ticks @ 1/60, headless node (in-process, zero servers/tabs); rules664.md FROZEN PRE-RUN in .evidence/I665/ (the frozen acceptance + the wall definitions + the death-source tally format + the per-wave started/cleared table); harness = content-asserted clone of .evidence/I662/sweep661.mjs. BULLET_LIFE_TICKS stays 3/DT (R1 re-landed).
- Acceptance (FROZEN): (a) B56 <= 7/30 / (b) SPLICER wave-10 primary <= 7/30 / (c) median death wave >= 10 / (d) reach wave >= 13 >= 3/30 / (e) 6-harness gate WITH the pre-registered re-pin: causal483 13,350 EXPECTED EXACT, documented re-pin permitted WITH MEASUREMENT if the S1 re-land (wave-5 toSpawn 9 -> 6) moves the demo pilot's frame count - GATE661 saw the PRE-S1 wave 5 because C1 reverted S1 before the gate ran, so the E101 pre-registered contingency is exercised for the first time at GATE664 (a re-pin is recorded WITH measurement, never silent; any UNEXPECTED shift = C1 input); causal495 3-arm / playframe483 / playframe491 / pwa491 / fleet628 EXPECTED EXACT.
- Gate harnesses (ST-623 + ST-624): causal495 (dist server :4200) / causal483 (dev server :5173, DEMO PILOT) / playframe491 (dev server :5173) / playframe483 (shares the playframe491 windows) / pwa491 (dist server :5199) / fleet628 (34/34 GLB / 201,245 t).
- Every run: wall ms + per-run lines + tallies recorded in .evidence/I665/results664.txt.

## Budget (pre-registered)
- Start (I663 close, fresh dist re-measured): 6,967,985 B / 205 files.
- Close target: 7,297,600 B (7,400,000 ceiling - 102,400 B close-floor).
- Envelope at open: 329,615 B.
- ST-623 expected delta: a few hundred B (config.js value lines + waves.js taper; test files are not shipped to dist). Worst-case budget: +1,000 B (measured, documented).
- Cut ladder floor: 102,400 B (never cross the close target).

## Cut ladder (pre-registered)
- C1 (frozen): git restore src/core/config.js src/core/waves.js tests/bossBurst.test.js tests/e9Batch.test.js tests/endless.test.js tests/gunship.test.js (ONE atomic restore of ALL SIX files - reverts P2, P3, Q1, R1, S1, G1 and all 13 re-pins) + accept-with-documentation + deferrals to E103 WITH the sweep664 record: Q3 (armSpin 1.2 -> 0.9) / Q5 (orbitSpeed 0.5 -> 0.35) / P5 (burst.everyMult 0.65 -> 0.75 - VETOED this round WITH the bossAliveAtDeath 0/15 measurement; re-testable with a phase-2 probe if the Monolith returns to the wall) / P6 (enemyBullets.speed 9 -> 8 - boss-aimed-bolt semantics, corrected) / P4 DEMOTED / S1 variant (deeper 0.5 taper or wave-5-only) / G1 variants (G1b fireEvery 2.6 -> 3.0 cadence / G1c boltRadius 0.5 -> 0.45 size) / S2 mid-game content taper (non-boss waves 8-9) / rock-speed ramp (speedPerWave 0.06 -> 0.05) / the baseline-variance question (option (2) of the I663 close fork) IF sweep664 (c) still FAILs - WITH the in-hand w8/9 source decomposition as the starting record.
- No second fiddle: one pass per landing; each ladder invocation recorded as an AMENDMENT.

## REJECTED at open
- P5 as the E102 lever: mechanism does not intersect the measured median wall (bossAliveAtDeath 0/15 - the boss is absent from all wave-8/9 deaths; the Monolith dies at wave 5/6 in 27/30 sweep661 runs; phase 2 is a wave-5/6 state; (a) B56 already PASSES 5/30). Demoted WITH MEASUREMENT, not permanently rejected.
- P6 as a gunship lever: semantic error - enemyBullets.speed is the boss AIMED bolt (game.js:391/:406), NOT the gunship bolt (game.js:318 fires cfg.gunship.boltSpeed). Deferral kept, semantics corrected.
- S2 (non-boss wave-8/9 content taper): a second structural class concurrent with S1 = attribution confound (the P4 lesson: sweep653 B56 8 -> 12/30 with two concurrent changes); the measured gunship concentration (4/10 in-window) favors the targeted single-enemy lever first. E103 material if (c) still fails with G1.
- Rock-speed ramp (speedPerWave 0.06 -> 0.05): touches EVERY wave, not just w8/9 - broader blast radius than the single-enemy lever for the same measured target. E103 material.
- mines.firstWave 5 -> 6: 1 mine death in the window (sweep661) - no measured basis.
- gunship.fireEvery 2.6 -> 3.0 (the G1 cadence variant): ONE lever per round; the speed variant is the pre-registered G1 choice (the P2-class speed lever, the lineage-best class). The cadence variant defers as G1b WITH the sweep664 record.
- gunship.boltRadius 0.5 -> 0.45 (the G1 size variant): a SIZE change alters collision geometry beyond dodgeability (the harness attributes by radius - 0.45 stays != 0.22 so classification is invariant, but the player-facing dodge box changes too) - size levers are a separate class. Defers as G1c.
- A deeper gunship change (maxConcurrent 1 -> 0 on some waves / hp 10 -> 8): construction-class changes to the enemy's presence, not its bolt - a bigger identity change than the measured target warrants; no class precedent in the lineage.

## Deferrals (out of E102, queue intact)
- Q3 splicer.armSpin 1.2 -> 0.9 / Q5 splicer.orbitSpeed 0.5 -> 0.35 / P5 burst.everyMult 0.65 -> 0.75 (vetoed this round WITH MEASUREMENT) / P6 enemyBullets.speed 9 -> 8 (boss-aimed-bolt semantics) / P4 burst.offsetSpin 0.45 -> 0.30 (DEMOTED - data) / S1 variant (deeper 0.5 or wave-5-only) IF sweep664 (a) regresses under 0.67 / G1b gunship.fireEvery 2.6 -> 3.0 / G1c gunship.boltRadius 0.5 -> 0.45 / S2 non-boss wave-8/9 content taper / rock-speed ramp speedPerWave 0.06 -> 0.05 / baseline-variance measurement IF sweep664 (c) FAILs.

## Risks
- R-1: G1 has never been swept - the frozen acceptance (a)-(e) is the arbiter, no pre-derivation (I570 pattern).
- R-2: seed variance - the 0.5-median delta is ONE run each (sweep659 median 10, sweep661 median 9.5, both n=30); sweep664 uses a fresh seed set (66400+i). The w8/9 wall is a measured source (gunship 4/10 + rocks 5/10), not just variance - but if sweep664 (c) still FAILs at 9.5, the baseline-variance measurement (option (2) of the I663 close fork) becomes the E103 question WITH the in-hand source decomposition.
- R-3: S1 is MODE-SHARED (campaign boss waves taper too) - no campaign test pins boss-wave rock content (level-flow.test.js:184 pins only w.field.count == 0); G1 is also mode-shared (the gunship is the campaign's wave-8 enemy) - no campaign test pins gunship.boltSpeed (re-scanned). The fresh lever-applied npm test (the R-7 designed catch) is the final arbiter, campaign suite included.
- R-4: causal483 = the DEMO PILOT full browser run that PASSES WAVE 5 - EXPECTED EXACT 13,350 WITH the PRE-REGISTERED documented re-pin WITH MEASUREMENT if the S1 re-land (wave-5 toSpawn 9 -> 6) moves its frame count. GATE661 (I662) saw the PRE-S1 wave 5 (C1 had reverted S1 before the gate ran), so this is the first gate where the demo pilot sees the thinned wave 5 - the E101 pre-registered contingency applies verbatim (a re-pin is recorded WITH measurement, never silent; any UNEXPECTED shift = C1 input).
- R-5: sweep664 clone line-asserted + content-asserted before first run (I583/I570 lessons). G1 needs NO harness change (radius-based gunship attribution; BASE_SPEEDS invariant to 5.5 -> 5.0).
- R-6: re-pin correctness - 13 sites, every string occurrence==1 verified on disk this session (CRLF-aware); the pre-registered fresh lever-applied npm test (expected 1,261/1,261) catches a wrong re-pin before the sweep; C1's atomic restore covers all six files.

## Verification evidence (measured this session)
- I663 close (lineage anchor): CLOSEGATE663 6/6 EXACT zero re-pins (causal483 13,350 / playframe A 22/92,435 + P 11/2,076 / B 52/200,808 / pwa491 11/11 / fleet628 34/34 GLB 201,245 t); dist 6,967,985 B / 205 fresh re-measured; CLOSE FLOOR E101 329,615 B WITH MEASUREMENT; npm test 1,261/1,261.
- results659.txt / results661.txt per-wave tables: startedRuns monotonicity verified (both files); per-wave deaths derived as started(N) - started(N+1): sweep659 w5 7 / w6 1 / w7 1 / w8 4 / w9 1 / w10 9 / w11 1 / w12 1 / w13 2 / w14 2 / w18 1 = 30; sweep661 w5 5 / w8 5 / w9 5 / w10 8 / w11 1 / w12 3 / w13 2 / w15 1 = 30.
- sweep659.json / sweep661.json killingBlow tallies: per-wave source tables (above); bossAliveAtDeath 0/5 + 0/10 across the wave-8/9 deaths (heavyweight.boss AND warden null in all 15); bossDeaths non-empty 27/30 (sweep661).
- config.js (CRLF-aware, occurrence==1 each): :215 breatherMinRocks 3 [S1 anchor] / :281 fireEvery 2.2 / :296-302 phase2 block {hpFrac 0.5, speedMult 1.3, turnMult 1.4, spin 1.6, ringEveryMult 0.6} / :306 burst.speed 7.0 / :307 offsetSpin 0.45 [untouched] / :308 everyMult 0.65 [untouched - P5 vetoed] / :340 spiralEvery 0.6 / :390 mines firstWave 5 / :477 gunship firstWave 8 / :496 boltSpeed 5.5 / :497 boltRadius 0.5 / :770 life 4.0; bossContentFrac ABSENT (occurrence 0 - C1-verified).
- game.js: :318 gunship fires cfg.gunship.boltSpeed (boltRadius passed) / :391 + :406 boss aimed bolts fire cfg.enemyBullets.speed.
- boss.js: :93-94 the phase-2 one-way trigger (hp/maxHp < p2.hpFrac).
- waves.js: isBossWave ABSENT (occurrence 0 - C1-verified); :189 the clear rule (toSpawn 0 && killableCount 0; the boss is NOT in killableCount).
- Test pins (occurrence==1 each, CRLF-aware): bossBurst :28 b.speed 7.0 / :30 everyMult 0.65 [untouched] / `* 7.0` x4 (the 2 geometry pairs) / e9Batch `4.0` x1 / endless :40 contentFor(10) 14 / :42 contentFor(50) cap / :111 director-run 14 / gunship.test.js:34 boltSpeed 5.5.
- sweep659.mjs (the harness base): :49-81 the kiter (nearest-threat, fires within 18 u, threat-evasion) / :85 BASE_SPEEDS [7,8,9,10,15] / :86 BULLET_LIFE_TICKS 3/DT / :113-114 the radius-based gunship attribution (r != 0.22).
- scope-check-E102.md absent before this write (this file, NEW).

## DoD
- ST-622 (I664): 7-file bookkeeping, ONE atomic commit, dist byte-identical 6,967,985 B / 205, npm test 1,261/1,261, vendor 4/4 + decoder D428E73A000057C6.
- ST-623 (I665): lever pass (6 config lines + 2 waves.js sites) + 13 re-pins + fresh lever-applied npm test 1,261/1,261 + GATE664 6/6 (with the causal483 contingency honored if fired) + sweep664 record + acceptance (a)-(e) verdict (OR AMENDMENT for additional red sites; an (a) or (b) wall failure -> straight C1).
- ST-624 (I666): G102.0 close gate 6/6 (with the documented causal483 contingency honored if fired) + CLOSE FLOOR E102 WITH MEASUREMENT + AGENTS.md refresh.

## Next owner
- ST-623 (I665) per the landing plan.
