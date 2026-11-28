# E103 scope check - SPLICER-targeted round: re-landed E102 set (P2+P3+Q1+R1+S1+G1) + K1 splicer.boltSpeed 7.0 -> 6.0 in ONE pass

Opened I667 (ST-625). Follows the I666 close (E102 G102.0 CLOSED: CLOSEGATE666 6/6 EXACT zero re-pins, CLOSE FLOOR E102 = 329,615 B WITH MEASUREMENT, dist 6,967,985 B / 205 fresh re-measured; byte-identical I640->I666).

## Why a SPLICER-targeted round (the E102 outcome / the wall record)
- The E102 frozen set (P2+P3+Q1+R1+S1+G1) applied ONE pass at I665 passed (a) B56 5/30 / (c) median 10 / (d) reach13 6/30 but FAILED exactly one gate: (b) SPLICER wave-10 primary 11/30 vs <= 7 (sweep664) -> straight C1 per the frozen adjudication (byte-identical revert at I665; E102 closed as an accept round at I666).
- G1 worked as designed (median 9.5 -> 10, reach13 3/30 -> 6/30, gunship 6/30 -> 1/30) BUT moved the wall downstream: the wave-8 gunship is solved, and the wave-10 SPLICER is now the dominant killing blow (11/30, up from 7/30 in sweep661).
- 6-point B56 record (best = 4/30): sweep647 4 / 651 8 / 653 12 / 659 8 / 661 5 / 664 5. B56 (a) is stably PASS at 5/30 - no longer the wall.
- E103 targets the SPLICER directly, per the E102 deferral queue ("the wave-8 gunship is solved, E103 must target the wave-10 SPLICER directly").

## The E103 finding (measured this session, WITH MEASUREMENT)
- sweep664 record: SPLICER primary kills 11/30 = 10 at wave 10 + 1 at wave 11. Wave 10 = 21 started / 7 cleared (14 died; SPLICER = 10 of 14). Tally {"SPLICER":11,"MONOLITH":5,"bullet_unknown":6,"rock_M":5,"gunship":1,"wasp":1,"drone":1}; median 10; reach13 6/30; B56 5/30; 30/30 died; wall ms 8,638.
- The SPLICER (config.js:321-351): maxHp 30 (hpFirstWave 15 -> NO scale at wave 10; hpStep 8; hpCap 72), radius 2.6, score 600, split 2xM, holdRadius 11, orbitSpeed 0.5, enterTime 1.2, arms 2, armSpin 1.2, spiralEvery 0.6 (Q1 -> 0.7), boltSpeed 7.0, aimEvery 2.6, phase2 {hpFrac 0.5, orbitSpeedMult 1.4, armSpinMult 1.5, spiralEveryMult 0.65, aimEveryMult 0.7, spin 1.2}.
- Mechanism (src/core/splicer.js + game.js:954-959): after a 1.2 s entrance the Splicer emits a continuous 2-arm spiral of UNDESTROYABLE bolts via enemyBullets.fire(pos, dir, s.boltSpeed) [game.js:957] + an aimed bolt. The ship must weave the spiral. phase 2 is one-way below hpFrac 0.5.
- The spiral bolts are generic enemy bullets: on ship contact the game emits source 'bullet' [game.js:1046] with sourceSpeed + sourceRadius (0.22). Only the boss BODY contact is directly tagged source 'boss_splicer' [game.js:926].

## The lever adjudication (K1 selected; alternatives rejected - all WITH MEASUREMENT)
- K1 (NEW) splicer.boltSpeed 7.0 -> 6.0 (config.js:341, occurrence==1 verified): the undestroyable spiral-bolt speed. 7.0 -> 6.0 = -14% bolt speed = +14% per-bolt reaction time for the ship weaving the spiral. Blast radius: the Splicer spiral only (game.js:957 is the sole consumer of cfg.splicer.boltSpeed; the aimed bolt uses cfg.enemyBullets.speed [P6], not this). Single-enemy speed lever - the SAME mechanism class as the lineage-best P2 (boss.burst.speed 7.0 -> 6.0; P2+P3 = B56 4/30).
- THE GAP-NEUTRAL FINDING (measured): K1 (7.0 -> 6.0) combined with the re-landed Q1 (spiralEvery 0.6 -> 0.7) PRESERVES the I144 threadable gap EXACTLY: gap1 = boltSpeed x spiralEvery = 6.0 x 0.7 = 4.2u, gap2 = 4.2 x 0.65 = 2.73u - byte-identical to the C1 baseline (7.0 x 0.6 = 4.2u). So the threadable window is unchanged; K1 redistributes it as SLOWER, more-spread bolts = more reaction time without a tighter gap. (The 4.2u gap the config.js:340 comment documents is restored exactly by K1+Q1.)
- Why NOT the alternatives (measured):
  - Q3 armSpin 1.2 -> 0.9: a SECOND concurrent SPLICER lever in the same round = attribution confound (the P4 lesson: concurrent levers blur the wall attribution). One SPLICER lever this round (K1), the speed lever of the proven P2 class.
  - splicer.maxHp 30 -> 24: a TTK lever - it shortens the whole fight + shifts wave-clear timing (broad, structural; the wall is about SURVIVING the spiral, not the fight length). No class precedent as a wall lever.
  - enterTime 1.2 -> 2.0: a cosmetic grace (more lead-in before the first bolt) - it does not improve WEAVING the spiral, the measured kill mechanism.
  - aimed-bolt lever (enemyBullets.speed 9 -> 8): the aimed bolt is the boss AIMED bolt shared with the Monolith (game.js:406); enemyBullets.speed is a SHARED lever (blast radius beyond the Splicer) - this is P6, already in the deferral queue with corrected semantics. Not a Splicer-only lever.
  - Q5 orbitSpeed 0.5 -> 0.35: a second SPLICER lever - confound; deferral queue.

## Why re-land P2+P3+Q1+R1+S1+G1 (the whole E102 set)
- The E102 C1 (I665) reverted the set as a ROUND verdict ((b) FAIL), not a rejection of any lever: no lever moved a wall in the wrong direction in sweep664.
- (a) B56 5/30 (best-in-lineage class), (c) median 10, (d) reach13 6/30 all PASSED in sweep664 - the set holds those gates.
- G1 validated (gunship 6/30 -> 1/30; median 9.5 -> 10; reach13 3/30 -> 6/30).
- The set is the measured base on which K1 (the Splicer lever) is layered; sweeping K1 alone would re-expose the wave-8 gunship wall (G1's job) and confound the SPLICER measurement. Fresh experiment: set P2+P3+Q1+R1+S1+G1+K1, fresh seeds 66700+i, frozen acceptance adjudicates.

## Wall record (measured; 9-sweep table)
- sweep642 (baseline, no levers): median 9 / reach13 1/30 / SPLICER 11/30 / B56 10/30 / w10 cleared 1/30 / H 21/30 / wall ms 5,649.
- sweep647 (P2+P3): median 10 / reach13 2/30 / SPLICER 13/30 / B56 4/30 (lineage-best) / w10 cleared 5/30 / wall ms 5,483.
- sweep649 (Q1): median 9 / reach13 2/30 / SPLICER 6/30 / B56 12/30 / w10 cleared 3/30 / wall ms 5,458.
- sweep650 (Q1+Q2): median 8 / reach13 3/30 / SPLICER 5/30 / B56 13/30 / wall ms 4,919 (Q2 REJECTED).
- sweep651 (P2+P3+Q1): median 10 / reach13 2/30 / SPLICER 7/30 / B56 8/30 / w10 started 17 / cleared 3 / H 10/30 / wall ms 5,302.
- sweep653 (+P4): 30/30 died / median 10 / reach13 2/30 / SPLICER 7/30 / B56 12/30 / wall ms 4,748 (P4 DEMOTED).
- sweep659 (P2+P3+Q1+R1): 30/30 / median 10 / reach13 5/30 / SPLICER 7/30 / B56 8/30 / M56 0/30 / H 7/30 / w10 cleared 5/30 / wall ms 20,531.
- sweep661 (+S1@0.67): 30/30 / median 9.5 / reach13 3/30 / SPLICER 7/30 / B56 5/30 / M56 3/30 / H 11/30 / w10cleared 8/30 / wall ms 7,866 ((c) FAIL -> C1).
- sweep664 (+G1, the E102 set): 30/30 / median 10 / reach13 6/30 / SPLICER 11/30 / B56 5/30 (best-in-lineage) / M56 3/30 / gunship 1/30 / H 16/30 / w10cleared 7/21 / wall ms 8,638 ((b) FAIL 11/30 -> C1; THE E103 record - the SPLICER is now the wall).

## The K1 harness finding (MEASUREMENT - the non-obvious part)
- The sweep harness attributes boss-bolt deaths by SPEED (rules525.md sec.5): attributeBullet matches the killing bolt speed against BASE_SPEEDS and, for the boss speed, returns "boss_" + w.boss.kind (resolve: s === 7 -> boss). The Splicer spiral bolts ARE generic enemy bullets (game.js:1046 source 'bullet'; only the Splicer body is the directly-tagged 'boss_splicer' path, game.js:926).
- After P2 (Monolith burst 7.0 -> 6.0) + K1 (Splicer spiral 7.0 -> 6.0), the boss base bolt speed is uniformly 6.0. The sweep664.mjs harness still has BASE_SPEEDS [7,8,9,10,15] and resolve s===7 -> boss - STALE (its 7.0 no longer matches any live boss bolt).
- In sweep664 this staleness did NOT affect a target gate: the Monolith burst (6.0) undercounted into "bullet_unknown" (6/30), but gate (a) counts the wave-5-6 band under ANY attribution, and the SPLICER was still 7.0 (correctly attributed -> 11/30). So sweep664 (a)-(d) were valid.
- In sweep667 the staleness DOES hit a target gate: K1 makes the Splicer spiral 6.0, and gate (b) (SPLICER wave-10 primary <= 7/30) is the gate K1 is meant to move. Without the harness fix, every Splicer-bolt killing blow (6.0, not in BASE_SPEEDS) would classify "bullet_unknown" (no-speed-match) -> SPLICER primary would undercount to ~0 -> a FALSE (b) PASS for the wrong reason (attribution failure, not improved dodgeability).
- THEREFORE the cloned sweep667.mjs carries a MEASURED harness correction (documented, not silent): BASE_SPEEDS [7,8,9,10,15] -> [6,8,9,10,15] and resolve "s === 7" -> "s === 6" (the boss base bolt speed is now 6.0 for both the Monolith burst [P2] and the Splicer spiral [K1]; the aimed bolt stays 9.0 via the separate s===9 branch, P6 untouched). This restores correct SPLICER + MONOLITH-burst attribution and is the ONLY harness change (kiter, seeds, BULLET_LIFE_TICKS 3/DT all inherited).

## Test-pinning map (measured this session, all occurrence==1 on disk, CRLF-aware)
Re-land (13 sites - the EXACT I665 set):
1-5. bossBurst.test.js: :28 b.speed 7.0 -> 6.0 [P2] + :37-38 + :48-49 "x 7.0" -> "x 6.0" (4 geometry sites, 2 context-qualified pairs) [P2].
6-8. e9Batch.test.js: the data-driven life test (loop bound + final step, the single "4.0" reference) [R1] + rim-cull title + premise comment (assert unchanged) [R1].
9-11. endless.test.js: :40 contentFor(10) 14 -> 9 / :42 contentFor(50) cap -> 24 [S1] + :111 director-run wave-10 14 -> 9 (the I662 amendment) [S1].
12. config.js:496 gunship boltSpeed 5.5 -> 5.0 [G1].
13. gunship.test.js:34 boltSpeed 5.5 -> 5.0 [G1].
K1: ZERO test re-pins (measured this session):
- splicer.test.js:29 maxHp 30 UNTOUCHED (K1 does not change maxHp).
- splicer.test.js:36 "s.boltSpeed < CONFIG.ship.maxSpeed" - inequality, PASS at 6.0 < 14 (ship.maxSpeed = 14, occurrence==1 in config.js).
- splicer.test.js:134 "Math.abs(hypot - CONFIG.splicer.boltSpeed) < 1e-6" - DATA-DRIVEN from CONFIG (reads the live value, not a literal) - PASS at 6.0.
- splicer.test.js:159-162 the I144 gap math - DATA-DRIVEN (gap1 = s.boltSpeed x s.spiralEvery); under K1+Q1 gap1 = 6.0 x 0.7 = 4.2u >= 1.8 x obstacle (2.24u -> 4.03u) PASS; gap2 = 2.73u >= 1.1 x 2.24 = 2.46u PASS. obstacle (2.24u) is data-driven (2 x ship.radius + 2 x enemyBullets.radius), untouched by K1. The gap is gap-neutral (K1 x Q1 preserves the product) - the asserts hold UNCHANGED.
- splicer.test.js:168-170 the steady-state cap math - DATA-DRIVEN (e.life re-landed to 3.0 via R1; arms/spiralEvery/aimEvery live values) - PASS (phase-1 ~9.7 < 24, phase-2 ~14.8 < 24).
- e8cBatch / golden / determinism: no splicer.boltSpeed literals (re-scanned; value-invariant).

## Scope Fit
- Code-only: 7 config lines (P2 :306 / P3 :281 / Q1 :340 / R1 :770 re-land + S1 NEW :216 bossContentFrac 0.67 + G1 :496 + NEW K1 :341 splicer.boltSpeed) + 2 waves.js sites (contentFor body taper + isBossWave, from S1) + 13 test re-pin sites + 1 harness correction (sweep667.mjs BASE_SPEEDS + resolve) in ONE pass. ONE new lever this round (K1) - the P4 lesson (concurrent new levers confound attribution); the re-landed block is the measured E102 set. No Blender (fleet FROZEN), no new dist files (205).
- I667 = docs-only -> dist byte-identical 6,967,985 B / 205. I668 = CODE change -> dist delta NON-zero expected (a few hundred B - config value lines + waves.js taper; test/harness files are not shipped); budget +1,000 B worst case, measured.

## Research (FROZEN at open I667)
- cgs-scope-check + cgs-balance-check applied (scope pre-registration, cut ladder, measurement protocol; the lever chosen by the in-repo sweep record + the code-verified mechanism, not by pre-round hypothesis - the cgs-balance-check measurement-over-invention rule; the K1 harness staleness was CAUGHT by reading game.js:1046 + the sweep attribution, not assumed).
- NO new external research this round: the lever is an in-repo config change with the mechanism verified in code (config.js:321-351 / splicer.js / game.js:954-959 + :1046 + :926 / the sweep attribution rules525 sec.5) and the 9-sweep in-repo record + the two JSON per-seed breakdowns supersede any external source (E101/E102 finding: no purpose-matched content).

## Landing plan (PRE-REGISTERED)
- ST-625 (I667): this open - scope FROZEN (docs-only, dist byte-identical).
- ST-626 (I668): apply P2+P3+Q1+R1+S1+G1+K1 ONE pass (patch668.cjs = patch665.cjs + the K1 config pair "boltSpeed: 7.0," -> "boltSpeed: 6.0," [case-distinct from P2 lowercase "speed: 7.0," - verified occurrence==1 each]) + 13 re-pins + fresh lever-applied npm test (expected 1,261/1,261; any additional red beyond the 13 pre-registered sites = AMENDMENT, recorded) + GATE667 (clone run_gate664.cjs -> run_gate667.cjs; the 6 harnesses EXPECTED EXACT unchanged - none reach a boss [causal495/483 demo pilot ends wave 2; playframe B frame 50 wave 1]) + sweep667 (clone sweep664.mjs -> sweep667.mjs, seeds 66700+i, PLUS the measured K1 harness correction [BASE_SPEEDS 6.0 + resolve s===6]; rules667.md FROZEN PRE-RUN; line-asserted before first run [I583/I570]) + acceptance (a)-(e). NO escalation lever pre-registered this round.
- ST-627 (I669): G103.0 close gate (clone run_close666.cjs -> run_close669.cjs, label CLOSEGATE669, OUTDIR .evidence/I669/, PRE-RUN 6/6 marker re-verify against the I668 GATE667 .out files) + CLOSE FLOOR E103 WITH MEASUREMENT + AGENTS.md refresh.

## Frozen bounds
- splicer block: maxHp 30 / radius 2.6 / holdRadius 11 / orbitSpeed 0.5 [Q5] / spin 0.4 / enterTime 1.2 / arms 2 / armSpin 1.2 [Q3] / aimEvery 2.6 / phase2 block frozen - boltSpeed 7.0 -> 6.0 [K1] + spiralEvery 0.6 -> 0.7 [re-landed Q1] are the ONLY splicer-block changes.
- wave block / gunship block / boss block / enemyBullets / mines / hp scale both blocks / warden / other enemy blocks / spawn mix / E94 pacing / campaign (flightPath / levelState / campaign boss / checkpoint / storage) / vendor / PWA / audio / camera / input / all 34 GLBs (201,245 t) frozen - bossContentFrac 0.67 re-landed is the ONLY wave-block change; gunship boltSpeed 5.5 -> 5.0 the ONLY gunship-block change; boss burst.speed 7.0 -> 6.0 [P2] + fireEvery 2.2 -> 2.6 [P3] the ONLY boss-block changes; enemyBullets life 4.0 -> 3.0 [R1] the ONLY enemyBullets-block change.

## Measurement protocol
- sweep667: 30 fresh seeds 66700+i, full director + kiter, cap 36,000 ticks @ 1/60, headless node (in-process, zero servers/tabs); rules667.md FROZEN PRE-RUN in .evidence/I668/ (the frozen acceptance + the wall definitions + the death-source tally format + the per-wave started/cleared table + the K1 harness-correction note); harness = content-asserted clone of sweep664.mjs with the measured BASE_SPEEDS/resolve correction. BULLET_LIFE_TICKS stays 3/DT (R1 re-landed).
- Acceptance (FROZEN): (a) B56 <= 7/30 / (b) SPLICER wave-10 primary <= 7/30 / (c) median death wave >= 10 / (d) reach wave >= 13 >= 3/30 / (e) 6-harness gate EXACT (causal483 13,350 / playframe A 22/92,435 + P 11/2,076 / B 52/200,808 / pwa491 11/11 / fleet628 34/34 GLB 201,245 t / causal495 3-arm - K1 is wave-10 material, no gate sees a boss, so all EXPECTED EXACT unchanged; the pre-registered re-pin contingency stays documented but is NOT expected to fire).
- Gate harnesses (ST-626 + ST-627): causal495 (dist :4200) / causal483 (dev :5173, DEMO PILOT) / playframe491 (dev :5173) / playframe483 (shares the playframe491 windows) / pwa491 (dist :5199) / fleet628 (34/34 GLB / 201,245 t).
- Every run: wall ms + per-run lines + tallies recorded in .evidence/I668/results667.txt.

## Budget (pre-registered)
- Start (I666 close, fresh dist re-measured): 6,967,985 B / 205 files.
- Close target: 7,297,600 B (7,400,000 ceiling - 102,400 B close-floor).
- Envelope at open: 329,615 B.
- ST-626 expected delta: a few hundred B (config.js value lines + waves.js taper; test/harness files not shipped to dist). Worst-case budget: +1,000 B (measured, documented).
- Cut ladder floor: 102,400 B (never cross the close target).

## Cut ladder (pre-registered)
- C1 (frozen): git restore src/core/config.js src/core/waves.js tests/bossBurst.test.js tests/e9Batch.test.js tests/endless.test.js tests/gunship.test.js (ONE atomic restore of ALL SIX - reverts P2, P3, Q1, R1, S1, G1, K1 and all 13 re-pins; sweep667.mjs is .evidence scratch, not committed, so the harness correction needs no revert) + accept-with-documentation + deferrals to E104 WITH the sweep667 record: Q3 (armSpin 1.2 -> 0.9) / Q5 (orbitSpeed 0.5 -> 0.35) / P5 (everyMult 0.65 -> 0.75) / P6 (enemyBullets.speed 9 -> 8) / P4 DEMOTED / S1 variant (deeper 0.5 taper or wave-5-only) / SPLICER-targeted variants (K1b armSpin 1.2 -> 0.9 [Q3 as the primary now that K1 measured] / splicer.maxHp 30 -> 24 [the TTK variant] / splicer.enterTime 1.2 -> 1.6 [a smaller grace, between the rejected 2.0 and the C1 1.2]) - WITH the sweep667 SPLICER attribution record.
- No second fiddle: one pass per landing; each ladder invocation recorded as an AMENDMENT.

## REJECTED at open
- Q3 armSpin 1.2 -> 0.9 as the E103 lever: a SECOND concurrent SPLICER lever in the same round as K1 = attribution confound (the P4 lesson). K1 (the speed lever, the proven P2 class) is the single Splicer lever this round; Q3 defers as K1b.
- splicer.maxHp 30 -> 24: a TTK / fight-length lever - it shifts wave-clear timing and is structural, not a weave/dodgeability lever; the measured kill mechanism is the spiral weave, not the fight duration. No class precedent as a wall lever.
- splicer.enterTime 1.2 -> 2.0: a cosmetic grace (more lead-in) - it does not improve WEAVING the spiral, the measured kill mechanism.
- aimed-bolt (enemyBullets.speed 9 -> 8): the boss AIMED bolt is SHARED with the Monolith (game.js:406) - a shared lever with blast radius beyond the Splicer. This is P6, already in the deferral queue with corrected semantics.
- Q5 orbitSpeed 0.5 -> 0.35: a second SPLICER lever - confound; deferral queue.

## Deferrals (out of E103, queue intact)
- Q3 splicer.armSpin 1.2 -> 0.9 (now the K1b variant) / Q5 splicer.orbitSpeed 0.5 -> 0.35 / P5 burst.everyMult 0.65 -> 0.75 / P6 enemyBullets.speed 9 -> 8 (boss-aimed-bolt semantics) / P4 burst.offsetSpin 0.45 -> 0.30 (DEMOTED) / S1 variant (deeper 0.5 or wave-5-only) IF (a) regresses / SPLICER.maxHp 30 -> 24 (TTK) / SPLICER.enterTime 1.2 -> 1.6 (smaller grace) / the baseline-variance question IF sweep667 (c) FAILs.

## Risks
- R-1: K1 has never been swept - the frozen acceptance (a)-(e) is the arbiter, no pre-derivation (I570 pattern).
- R-2: the K1 harness correction (BASE_SPEEDS 6.0 + resolve s===6) is MEASURED and documented (game.js:1046 + rules525 sec.5), not assumed; without it gate (b) would be a false pass (SPLICER undercounted to ~0). The correction is line-asserted before the first sweep667 run (I583/I570).
- R-3: seed variance - the SPLICER 11/30 (sweep664) is ONE run (n=30); sweep667 uses a fresh seed set (66700+i). K1's +14% bolt reaction time is a measured mechanism (the P2 class), not just variance.
- R-4: S1 is MODE-SHARED (campaign boss waves taper too) - no campaign test pins boss-wave rock content (level-flow.test.js:184 pins only w.field.count == 0); K1 is also mode-shared (the Splicer is the campaign boss variant too) - no campaign test pins splicer.boltSpeed (re-scanned). The fresh lever-applied npm test (the R-7 designed catch) is the final arbiter, campaign suite included.
- R-5: gate (e) - K1 is wave-10 material; no gate harness reaches a boss (causal495/483 demo pilot ends wave 2; playframe B frame 50 wave 1) -> all 6 EXPECTED EXACT unchanged. If any gate shifts, that is UNEXPECTED -> C1 input (a Splicer config change must not touch the wave-1/2 boot/pilot path).
- R-6: re-pin correctness - 13 sites, every string occurrence==1 verified on disk this session (CRLF-aware); K1 adds ZERO test re-pins (all splicer.boltSpeed references data-driven or inequality); the pre-registered fresh lever-applied npm test catches a wrong re-pin; C1's atomic restore covers all six files.

## Verification evidence (measured this session)
- I666 close (lineage anchor): CLOSEGATE666 6/6 EXACT zero re-pins (causal483 13,350 / playframe A 22/92,435 + P 11/2,076 / B 52/200,808 / pwa491 11/11 / fleet628 34/34 GLB 201,245 t); dist 6,967,985 B / 205 fresh re-measured; CLOSE FLOOR E102 329,615 B WITH MEASUREMENT; npm test 1,261/1,261.
- sweep664 record (the E103 starting record): SPLICER 11/30 (10 at w10 + 1 at w11); w10 21 started / 7 cleared (14 died, SPLICER 10/14); tally {"SPLICER":11,"MONOLITH":5,"bullet_unknown":6,"rock_M":5,"gunship":1,"wasp":1,"drone":1}; median 10; reach13 6/30; B56 5/30; wall ms 8,638; 30/30 died.
- config.js (CRLF-aware, occurrence==1 each, post-C1 = original values verified on disk): :281 fireEvery 2.2 / :306 burst.speed 7.0 / :340 spiralEvery 0.6 / :341 splicer.boltSpeed 7.0 [K1 target] / :496 gunship boltSpeed 5.5 / :770 life 4.0; bossContentFrac ABSENT (occurrence 0); "boltSpeed: 7.0," occurrence==1 (K1); "speed: 7.0," occurrence==1 (P2, lowercase - case-distinct from K1).
- splicer.test.js pins (occurrence==1, data-driven/inequality): :29 maxHp 30 / :36 boltSpeed < ship.maxSpeed (14) / :134 boltSpeed data-driven / :159-162 gap math (gap-neutral under K1+Q1) / :168-170 steady-state cap (data-driven).
- game.js: :954-959 bossSpiralBolts fires cfg.splicer.boltSpeed through enemyBullets.fire [the sole consumer] / :1046 enemy-bullet ship hit emits source 'bullet' + sourceSpeed + sourceRadius / :926 boss BODY contact emits source 'boss_' + kind [the only directly-tagged splicer path] / :406 boss aimed bolt uses cfg.enemyBullets.speed [P6, shared].
- splicer.js: drainBolts() queues undestroyable unit-directions (drained by World).
- sweep664.mjs: :85 BASE_SPEEDS [7,8,9,10,15] / :113 radius-0.22 guard (gunship) / :118-121 speed match -> no-speed-match "bullet_unknown" / :129 resolve s===7 -> boss / :142 bossAlive fallback / :195-198 clsPrimary BMAP boss_splicer -> SPLICER. The K1 correction: :85 -> [6,8,9,10,15] + :129 s===7 -> s===6.
- scope-check-E103.md absent before this write (this file, NEW).

## DoD
- ST-625 (I667): 7-file bookkeeping, ONE atomic commit, dist byte-identical 6,967,985 B / 205, npm test 1,261/1,261, vendor 4/4 + decoder D428E73A000057C6.
- ST-626 (I668): lever pass (7 config lines + 2 waves.js sites) + 13 re-pins + the measured K1 harness correction + fresh lever-applied npm test 1,261/1,261 + GATE667 6/6 + sweep667 record + acceptance (a)-(e) verdict (OR AMENDMENT for additional red sites; an (a) or (b) wall failure -> straight C1).
- ST-627 (I669): G103.0 close gate 6/6 + CLOSE FLOOR E103 WITH MEASUREMENT + AGENTS.md refresh.

## Next owner
- ST-626 (I668) per the landing plan.