# E104 scope check - TTK round: re-landed E103 set (P2+P3+Q1+R1+S1+G1+K1) + T1 splicer.maxHp 30 -> 24 in ONE pass

Opened I670 (ST-628). Follows the I669 close (E103 G103.0 CLOSED: CLOSEGATE669 6/6 EXACT zero re-pins, CLOSE FLOOR E103 = 329,615 B WITH MEASUREMENT, dist 6,967,985 B / 205 fresh re-measured; byte-identical I667->I669).

## Why a TTK round (the E103 outcome / the wall record)
- The E103 frozen set (re-landed P2+P3+Q1+R1+S1+G1 + NEW K1 splicer.boltSpeed 7.0 -> 6.0) applied ONE pass at I668 passed (a) B56 3/30 (NEW LINEAGE BEST) / (c) median 10 / (d) reach13 5/30 but FAILED exactly one gate: (b) SPLICER wave-10 primary 11/30 vs <= 7 (sweep667) -> straight C1 per the frozen adjudication (byte-identical revert at I668; E103 closed as an accept round at I669).
- THE E103 LESSON (measured): spiral-bolt SPEED (-14%) is NOT the binding constraint of the wave-10 Splicer wall. SPLICER record 7/7/7/11/11 - K1 produced zero movement (11/30 -> 11/30). The speed axis has been tested and did not move the wall.
- Secondary positives from sweep667: B56 5/30 -> 3/30 (7-point lineage record 4/8/12/8/5/5/3 - best-ever), wave-10 cleared 7/21 -> 9/21.
- E104 attacks the Splicer wall from a different axis: TTK (splicer.maxHp 30 -> 24) - shorten the fight so the ship weaves the spiral for less total time.

## The E104 finding (measured this session, WITH MEASUREMENT)
- sweep667 record (the E104 starting record): 30/30 died, median 10, reach13 5/30, B56 3/30 (NEW LINEAGE BEST; 7-point record 4/8/12/8/5/5/3), SPLICER 11/30 (UNCHANGED vs sweep664 - K1 did NOT move the wall), w10 21 started / 9 cleared, H 14/30, wall ms 6,777. Tally {"sentry":3,"MONOLITH":3,"gunship":2,"SPLICER":11,"mine":1,"rock_M":2,"phantom":2,"rock_S":3,"bullet_unknown":1,"bulwark":1,"drone":1}.
- The SPLICER (config.js:321-351): maxHp 30 [T1 target :326], hpFirstWave 15, hpStep 8, hpCap 72, radius 2.6, score 600, split 2xM, holdRadius 11, orbitSpeed 0.5, enterTime 1.2, arms 2, armSpin 1.2, spiralEvery 0.6, boltSpeed 7.0, aimEvery 2.6, phase2 {hpFrac 0.5, orbitSpeedMult 1.4, armSpinMult 1.5, spiralEveryMult 0.65, aimEveryMult 0.7, spin 1.2}.
- HP mechanics (src/core/splicer.js, read verbatim this session): splicerHpForWave(cfg, wave) returns s.maxHp when wave < s.hpFirstWave (15) - i.e. the wave-10 Splicer has EXACTLY base maxHp (30), zero scaling. game.js:643 spawns the boss with splicerHpForWave(cfg, wave) - the spawner path is verified. hit() decrements hp by 1 per bullet hit, THEN checks this.hp / this.maxHp < phase2.hpFrac (0.5) one-way -> phase 2 (faster: orbit x1.4, armSpin x1.5, spiralEvery x0.65, aimEvery x0.7, spin 1.2).
- T1 mechanism (maxHp 30 -> 24), the wave-10 fight, exact:
  - Total exposure: 30 hits to kill -> 24 hits = -20% total time inside the spiral.
  - Enrage (phase-2) exposure: at 30 HP, enrage triggers when hp < 15, i.e. at hp 14 = after 16 hits -> phase-2 exposure 14 hits. At 24 HP, enrage triggers when hp < 12, i.e. at hp 11 = after 13 hits -> phase-2 exposure 11 hits. -21% time in the faster phase (where spiralEvery is x0.65 = the tightest, fastest weave).
  - Blast radius: wave < 15 Splicer HP only (wave 10 is the wall wave); wave-15+ Splicers scale from the same base (24 + 8 x steps, capped 72) and stay under the Monolith curve at every wave (24/32/40/48/56/64/72 vs 64/76/88/88/88/88/88 - the e8cBatch:169 invariant holds).

## The lever adjudication (T1 selected; K1 kept as a measured constant; alternatives rejected - all WITH MEASUREMENT)
- T1 (NEW) splicer.maxHp 30 -> 24 (config.js:326, occurrence==1 verified this session; the only other maxHp in config is boss :270 = 64): the fight-duration lever. The E103 lesson says the wall is not a weave-speed problem (K1 measured: zero movement); the remaining axes are fight length (T1) and arm geometry (K1b). T1 is chosen: it is DETERMINISTIC (the HP math above is exact, not a rate estimate), single-enemy blast radius (no other code reads splicer.maxHp - verified: only splicer.js constructor default + splicerHpForWave + the game.js:643 spawner), and it cuts exposure over the WHOLE fight including the phase-2 window.
- K1 KEPT as a measured constant (not new this round): the full E103 set P2+P3+Q1+R1+S1+G1+K1 is re-landed as the round base; T1 is the ONLY new lever. KEEP rationale (measured): (1) K1 was measured in sweep667 (SPLICER 11/30 unchanged - neutral, not harmful), so it is a constant like the other re-lands, satisfying the P4-confound lesson (one new lever; everything else at measured values); (2) sweep668 inherits sweep667's harness VERBATIM - BASE_SPEEDS [6,8,9,10,15] + resolve s===6 is exactly right for the re-landed set (the P2 Monolith burst 6.0 + the K1 Splicer spiral 6.0); dropping K1 would force a new harness split (Monolith 6.0 vs Splicer 7.0 attribution divergence) = a second variable this round.
- Why NOT the alternatives (measured):
  - K1b armSpin 1.2 -> 0.9: a SECOND concurrent SPLICER lever in the same round as T1 = attribution confound (the P4 lesson). Arm geometry changes the WEAVE SHAPE; if TTK works, the geometry question is clean next round. Defers to E105 as the primary geometry variant.
  - enterTime 1.2 -> 2.0: a cosmetic grace (more lead-in before the first bolt) - it does not reduce spiral exposure DURING the fight; rejected as cosmetic in E103.
  - Q5 orbitSpeed 0.5 -> 0.35: a second SPLICER lever - confound; deferral queue.
  - P5 burst.everyMult 0.65 -> 0.75: a Monolith lever - not targeting the Splicer wall; demoted (E101).
  - P6 enemyBullets.speed 9 -> 8: the boss AIMED bolt is SHARED with the Monolith (game.js:406) - a shared lever with blast radius beyond the Splicer.
  - P4 burst.offsetSpin 0.45 -> 0.30: DEMOTED (E101, sweep653).
  - S1 variant (deeper 0.5 taper or wave-5-only): S1 re-landed at 0.67 is a measured constant - sweep667 (with S1) produced the best-ever B56 (3/30); changing it now = confound. REJECTED WITH MEASUREMENT.

## Why re-land P2+P3+Q1+R1+S1+G1+K1 (the whole E103 set)
- The E103 C1 (I668) reverted the set as a ROUND verdict ((b) FAIL), not a rejection of any lever: no lever moved a wall in the wrong direction in sweep667.
- (a) B56 3/30 (NEW LINEAGE BEST), (c) median 10, (d) reach13 5/30 all PASSED in sweep667 - the set holds those gates at best-ever levels.
- K1 measured neutral (SPLICER unchanged) - not a liability; and keeping it is what makes sweep668's harness a zero-change clone (the harness-section point).
- The set is the measured base T1 is layered on; sweeping T1 alone would re-expose the wave-8 gunship wall (G1's job) and confound the Splicer measurement. Fresh experiment: set P2+P3+Q1+R1+S1+G1+K1+T1, fresh seeds 66800+i, frozen acceptance adjudicates.

## Wall record (measured; 10-sweep table)
- sweep642 (baseline, no levers): median 9 / reach13 1/30 / SPLICER 11/30 / B56 10/30 / w10 cleared 1/30 / H 21/30 / wall ms 5,649.
- sweep647 (P2+P3): median 10 / reach13 2/30 / SPLICER 13/30 / B56 4/30 (lineage-best then) / w10 cleared 5/30 / wall ms 5,483.
- sweep649 (Q1): median 9 / reach13 2/30 / SPLICER 6/30 / B56 12/30 / w10 cleared 3/30 / wall ms 5,458.
- sweep650 (Q1+Q2): median 8 / reach13 3/30 / SPLICER 5/30 / B56 13/30 / wall ms 4,919 (Q2 REJECTED).
- sweep651 (P2+P3+Q1): median 10 / reach13 2/30 / SPLICER 7/30 / B56 8/30 / w10 started 17 / cleared 3 / H 10/30 / wall ms 5,302.
- sweep653 (+P4): 30/30 died / median 10 / reach13 2/30 / SPLICER 7/30 / B56 12/30 / wall ms 4,748 (P4 DEMOTED).
- sweep659 (P2+P3+Q1+R1): 30/30 / median 10 / reach13 5/30 / SPLICER 7/30 / B56 8/30 / M56 0/30 / H 7/30 / w10 cleared 5/30 / wall ms 20,531.
- sweep661 (+S1@0.67): 30/30 / median 9.5 / reach13 3/30 / SPLICER 7/30 / B56 5/30 / M56 3/30 / H 11/30 / w10 cleared 8/30 / wall ms 7,866 ((c) FAIL -> C1).
- sweep664 (+G1, the E102 set): 30/30 / median 10 / reach13 6/30 / SPLICER 11/30 / B56 5/30 (best-in-lineage then) / M56 3/30 / gunship 1/30 / H 16/30 / w10 21 started / 7 cleared / wall ms 8,638 ((b) FAIL 11/30 -> C1).
- sweep667 (+K1, the E103 set): 30/30 / median 10 / reach13 5/30 / SPLICER 11/30 (UNCHANGED vs sweep664 - K1 did NOT move the wall) / B56 3/30 (NEW LINEAGE BEST; 7-point record 4/8/12/8/5/5/3) / M56 3/30 / gunship 1/30 / H 14/30 / w10 21 started / 9 cleared / wall ms 6,777 ((b) FAIL 11/30 -> C1; THE E104 record - the SPLICER wall stands on a speed-immune axis).

## The harness section (INHERITED verbatim from sweep667 - NO change; that is the point of keeping K1)
- sweep668.mjs = a content-asserted clone of sweep667.mjs (19,422 B): identical kiter, cap 36,000 ticks @ 1/60, BULLET_LIFE_TICKS 3/DT (R1 re-landed), attribution BASE_SPEEDS [6,8,9,10,15] + resolve s===6 (the E103 measured correction - exactly right for the re-landed set: P2 Monolith burst 6.0 + K1 Splicer spiral 6.0; the aimed bolt stays 9.0 via the separate s===9 branch, P6 untouched).
- The ONLY harness diff: seed base 66700+i -> 66800+i (fresh 30 seeds) + the label. ZERO logic changes - any harness drift would invalidate the comparison against the sweep667 record.

## Test-pinning map (measured this session, all occurrence==1 on disk, CRLF-aware)
Re-land (13 sites - the EXACT I668 set):
1-5. bossBurst.test.js: :28 b.speed 7.0 -> 6.0 [P2] + 4 geometry sites (ring cos/sin, offset cos/sin) "x 7.0" -> "x 6.0" [P2].
6-8. e9Batch.test.js: the data-driven life test (loop bound + final step, the single "4.0" reference) [R1] + rim-cull title + premise comment (assert unchanged) [R1].
9-11. endless.test.js: :40 contentFor(10) 14 -> 9 / :42 contentFor(50) cap -> 24 [S1] + :111 director-run wave-10 14 -> 9 (the I662 amendment) [S1].
12. config.js:496 gunship boltSpeed 5.5 -> 5.0 [G1] - the config lever itself (re-land).
13. gunship.test.js:34 boltSpeed 5.5 -> 5.0 [G1].
T1 (1 test site - the ONLY new re-pin):
14. splicer.test.js:29 "assert.equal(s.maxHp, 30);" -> "assert.equal(s.maxHp, 24);" (occurrence==1; the file is LF; single-line pair - no CRLF concerns).
NOT re-pinned (verified this session, data-driven or inputs):
- splicer.test.js :40-44 (the splicerHpForWave curve vs s.maxHp - data-driven, holds at 24: base 24, scales after hpFirstWave 15, caps at hpCap 72).
- splicer.test.js :92-103 (the enrage model: threshold = Math.ceil(s.maxHp x phase2.hpFrac) - data-driven; the hit-loop bound s.maxHp - threshold).
- splicer.test.js :123 "new Splicer(new RNG(3), CONFIG, v2(10,0), 30)" + :140 "..., 12)" - constructor INPUTS (explicit hp), not config pins - left as-is.
- splicer.test.js :157-171 (gap / steady-state - data-driven from boltSpeed/spiralEvery/aimEvery, untouched by T1).
- Cross-file coupling verified clean: e8cBatch.test.js :150-155 (hp-curve loop asserts w.boss.maxHp === splicerHpForWave - data-driven), :169 (the splicerHpForWave <= bossHpForWave invariant - holds at 24 at every wave 10..500: 24/32/40/48/56/64/72 vs 64/76/88/88/88/88/88), :174-175 (base + scale invariants vs s.maxHp), :385 (s.maxHp === CONFIG.splicer.maxHp - data-driven). bossTally.test.js :47/:97 "hp: 52" = synthetic event input. bossPhase2.test.js :223 (enrage-through-single-emit - data-driven). campaignBoss.js uses its own cb.hp[level] table (0 references to cfg.splicer - grep-verified; the campaign boss is NOT affected by T1). kind-pins in campaignBoss.test.js / level-flow / level / regressionA / e8cBatch unaffected.

## Scope Fit
- Code-only: 8 config lines (re-land P2 :306 / P3 :281 / Q1 :340 / K1 :341 / G1 :496 / R1 :770 + S1 NEW :216 bossContentFrac 0.67 + NEW T1 :326 maxHp 30 -> 24) + 2 waves.js sites (contentFor taper + isBossWave, from S1) + 14 test re-pin sites (13 re-land + 1 T1) in ONE pass. ONE new lever this round (T1) - the P4 lesson; the re-landed block is the measured E103 set (K1 measured neutral in sweep667). No Blender (fleet FROZEN), no new dist files (205).
- I670 = docs-only -> dist byte-identical 6,967,985 B / 205. I671 = CODE change -> dist delta NON-zero expected (a few hundred B - config value lines + waves.js taper; test/harness files are not shipped); budget +1,000 B worst case, measured.

## Research (FROZEN at open I670)
- cgs-scope-check + cgs-balance-check applied (scope pre-registration, cut ladder, measurement protocol; the lever chosen by the in-repo sweep record + the code-verified mechanism, not by pre-round hypothesis - the cgs-balance-check measurement-over-invention rule; the T1 enrage math was DERIVED from the verbatim hit() read, not assumed).
- NO new external research this round: the lever is an in-repo config change with the mechanism verified in code (config.js:321-351 / splicer.js splicerHpForWave + hit() / game.js:643 / the 10-sweep in-repo record) - E101/E102 finding: no purpose-matched content.

## Landing plan (PRE-REGISTERED)
- ST-628 (I670): this open - scope FROZEN (docs-only, dist byte-identical).
- ST-629 (I671): apply P2+P3+Q1+R1+S1+G1+K1+T1 ONE pass (patch671.cjs = clone of patch668.cjs [22 pairs] + 2 T1 pairs [config.js:326 full-line from-string "maxHp: 30,         // base HP (Monolith 40); scaled up by wave" -> "maxHp: 24,         // E104 (ST-629) T1: 30 -> 24 TTK (wave-10 Splicer wall: -20% total spiral exposure, -21% enrage exposure)" + splicer.test.js "assert.equal(s.maxHp, 30);" -> "assert.equal(s.maxHp, 24);"] = 24 sites over 7 files; dry-run first) + fresh lever-applied npm test (expected 1,261/1,261; any additional red beyond the 14 pre-registered sites = AMENDMENT, recorded) + GATE670 (clone .evidence/I668/run_gate667.cjs -> run_gate670.cjs, label GATE670, OUTDIR .evidence/I671/, PRE-RUN 6/6 marker re-verify against the current gate .outs) + sweep668 (clone sweep667.mjs -> .evidence/I671/sweep668.mjs; harness UNCHANGED [K1 kept]; seeds 66800+i; rules668.md FROZEN PRE-RUN, line-asserted before first run [I583/I570]) + acceptance (a)-(e). NO escalation lever pre-registered this round.
- ST-630 (I672): G104.0 close gate (clone the I669 close kit -> run_close672.cjs, label CLOSEGATE672, OUTDIR .evidence/I672/, PRE-RUN 6/6 marker re-verify against the I671 GATE670 .out files) + CLOSE FLOOR E104 WITH MEASUREMENT + AGENTS.md refresh.

## Frozen bounds
- splicer block: EXACTLY three changes - maxHp 30 -> 24 [T1 NEW] + spiralEvery 0.6 -> 0.7 [re-landed Q1] + boltSpeed 7.0 -> 6.0 [re-landed K1]. Frozen: radius 2.6 / hpFirstWave 15 / hpStep 8 / hpCap 72 / holdRadius 11 / orbitSpeed 0.5 [Q5] / spin 0.4 / enterTime 1.2 / arms 2 / armSpin 1.2 [K1b] / aimEvery 2.6 / score 600 / split 2xM / the entire phase2 block.
- wave block / gunship block / boss block / enemyBullets / mines / hp scale both blocks / warden / other enemy blocks / spawn mix / E94 pacing / campaign (flightPath / levelState / campaign boss / checkpoint / storage) / vendor / PWA / audio / camera / input / all 34 GLBs (201,245 t) frozen - bossContentFrac 0.67 re-landed is the ONLY wave-block change; gunship boltSpeed 5.5 -> 5.0 the ONLY gunship-block change; boss burst.speed 7.0 -> 6.0 [P2] + fireEvery 2.2 -> 2.6 [P3] the ONLY boss-block changes; enemyBullets life 4.0 -> 3.0 [R1] the ONLY enemyBullets-block change.

## Frozen acceptance (FROZEN)
- (a) B56 <= 7/30 / (b) SPLICER wave-10 primary <= 7/30 [T1's target; sweep667 = 11/30] / (c) median death wave >= 10 / (d) reach wave >= 13 >= 3/30 / (e) 6-harness gate EXACT (causal483 13,350 / playframe A 22/92,435 + P 11/2,076 / B 52/200,808 / pwa491 11/11 / fleet628 34/34 GLB 201,245 t / causal495 3-arm - T1 is wave-10 material, NO gate sees a boss, so all EXPECTED EXACT unchanged; the pre-registered re-pin contingency stays documented but is NOT expected to fire).
- Frozen adjudication (FROZEN): (a)/(b) FAIL, or (c)/(d)-only FAIL -> straight C1; all PASS -> accept (-> I672 close). NO escalation lever.

## Measurement protocol
- sweep668: 30 fresh seeds 66800+i, full director + kiter, cap 36,000 ticks @ 1/60, headless node (in-process, zero servers/tabs); rules668.md FROZEN PRE-RUN in .evidence/I671/ (the frozen acceptance + the wall definitions + the death-source tally format + the per-wave started/cleared table + the K1-kept harness note); harness = content-asserted clone of sweep667.mjs with zero logic changes (seeds only).
- Gate harnesses (ST-629 + ST-630): causal495 (dist :4200) / causal483 (dev :5173, DEMO PILOT) / playframe491 (dev :5173) / playframe483 (shares the playframe491 windows) / pwa491 (dist :5199) / fleet628 (34/34 GLB / 201,245 t).
- Every run: wall ms + per-run lines + tallies recorded in .evidence/I671/results668.txt.

## Budget (pre-registered)
- Start (I669 close, fresh dist re-measured): 6,967,985 B / 205 files.
- Close target: 7,297,600 B (7,400,000 ceiling - 102,400 B close-floor).
- Envelope at open: 329,615 B.
- ST-629 expected delta: a few hundred B (config.js value lines + waves.js taper; test/harness files not shipped to dist). Worst-case budget: +1,000 B (measured, documented).
- Cut ladder floor: 102,400 B (never cross the close target).

## Cut ladder (pre-registered)
- C1 (frozen): git restore src/core/config.js src/core/waves.js tests/bossBurst.test.js tests/e9Batch.test.js tests/endless.test.js tests/gunship.test.js tests/splicer.test.js (ONE atomic restore of ALL SEVEN - reverts P2, P3, Q1, R1, S1, G1, K1, T1 and all 14 re-pins; sweep668.mjs is .evidence scratch, not committed, so the harness needs no revert) + accept-with-documentation + deferrals to E105 WITH the sweep668 record: K1b (armSpin 1.2 -> 0.9 - now the primary Splicer geometry variant after TTK measures) / splicer.enterTime 1.2 -> 1.6 (smaller grace) / Q5 (orbitSpeed 0.5 -> 0.35) / P5 (everyMult 0.65 -> 0.75) / P6 (enemyBullets.speed 9 -> 8) / P4 DEMOTED / S1 variant (deeper 0.5 taper or wave-5-only) - WITH the sweep668 SPLICER attribution record.
- No second fiddle: one pass per landing; each ladder invocation recorded as an AMENDMENT.

## REJECTED at open
- K1b armSpin 1.2 -> 0.9 as the E104 lever: a SECOND concurrent SPLICER lever in the same round as T1 = attribution confound (the P4 lesson). T1 (the TTK lever) is the single new Splicer lever this round; K1b defers as the E105 geometry variant.
- splicer.enterTime 1.2 -> 2.0: a cosmetic grace (more lead-in) - it does not reduce spiral exposure during the fight.
- Q5 orbitSpeed 0.5 -> 0.35: a second SPLICER lever - confound; deferral queue.
- P5 burst.everyMult 0.65 -> 0.75: a Monolith lever - not targeting the Splicer wall; demoted.
- P6 enemyBullets.speed 9 -> 8: the boss AIMED bolt is SHARED with the Monolith (game.js:406) - a shared lever with blast radius beyond the Splicer.
- P4 burst.offsetSpin 0.45 -> 0.30: DEMOTED (E101).
- S1 variant (deeper 0.5 or wave-5-only): S1@0.67 is a measured constant (sweep667 with S1 = B56 3/30 best) - a change now is a confound; REJECTED WITH MEASUREMENT.

## Deferrals (out of E104, queue intact)
- K1b splicer.armSpin 1.2 -> 0.9 (now the primary Splicer geometry variant) / Q5 splicer.orbitSpeed 0.5 -> 0.35 / P5 burst.everyMult 0.65 -> 0.75 / P6 enemyBullets.speed 9 -> 8 (boss-aimed-bolt semantics) / P4 burst.offsetSpin 0.45 -> 0.30 (DEMOTED) / S1 variant (deeper 0.5 or wave-5-only) IF (a) regresses / splicer.enterTime 1.2 -> 1.6 (smaller grace) / the baseline-variance question IF sweep668 (c) FAILs.

## Risks
- R-1: T1 has never been swept - the frozen acceptance (a)-(e) is the arbiter, no pre-derivation (I570 pattern).
- R-2: seed variance - the SPLICER 11/30 (sweep664/667) is ONE run each (n=30); sweep668 uses a fresh seed set (66800+i). T1's -20% total / -21% enrage exposure is exact deterministic HP math (verified against the verbatim hit()/splicerHpForWave), not a rate estimate.
- R-3: S1 is MODE-SHARED (campaign boss waves taper too) - no campaign test pins boss-wave rock content (level-flow.test.js pins only w.field.count == 0); T1 is mode-gated in practice (the campaign boss has its own cb.hp[level] table - campaignBoss.js 0 references to cfg.splicer, grep-verified) - no campaign test pins splicer.maxHp (re-scanned). The fresh lever-applied npm test (the R-7 designed catch) is the final arbiter, campaign suite included.
- R-4: gate (e) - T1 is wave-10 material; no gate harness reaches a boss (causal495/483 demo pilot ends wave 2; playframe B frame 50 wave 1) -> all 6 EXPECTED EXACT unchanged. If any gate shifts, that is UNEXPECTED -> C1 input (a Splicer config change must not touch the wave-1/2 boot/pilot path).
- R-5: re-pin correctness - 14 sites, every string occurrence==1 verified on disk this session (CRLF-aware; splicer.test.js is LF - the T1 pair is a single line, ending-agnostic); the pre-registered fresh lever-applied npm test catches a wrong re-pin; C1's atomic restore covers all seven files.
- R-6: K1 kept as a measured constant - if sweep668 (b) PASSES, the attribution is "set + T1", not "T1 alone" - the documented E105 follow-up (K1b geometry round on the same base) keeps the set; a TTK-only isolation sweep is NOT pre-registered (the set is the measured base; dismantling it re-exposes the gunship wall).

## Verification evidence (measured this session)
- I669 close (lineage anchor): CLOSEGATE669 6/6 EXACT zero re-pins (causal495 3-arm + causal483 EXACT 13,350; playframe483/491 EXACT A 22/92,435 + P 11/2,076 / B 52/200,808; pwa491 11/11; fleet628 34/34 GLB / 201,245 t); dist 6,967,985 B / 205 fresh re-measured; CLOSE FLOOR E103 329,615 B WITH MEASUREMENT; npm test 1,261/1,261.
- sweep667 record (the E104 starting record): SPLICER 11/30 (UNCHANGED vs sweep664 - K1 did NOT move the wall); w10 21 started / 9 cleared; tally {"sentry":3,"MONOLITH":3,"gunship":2,"SPLICER":11,"mine":1,"rock_M":2,"phantom":2,"rock_S":3,"bullet_unknown":1,"bulwark":1,"drone":1}; median 10; reach13 5/30; B56 3/30 (NEW LINEAGE BEST; 7-point record 4/8/12/8/5/5/3); H 14/30; wall ms 6,777; 30/30 died.
- config.js (CRLF-aware, occurrence==1 each, post-C1 = original values verified on disk): :281 fireEvery 2.2 / :306 burst.speed 7.0 / :326 splicer.maxHp 30 [T1 target; full line "    maxHp: 30,         // base HP (Monolith 40); scaled up by wave" occurrence==1; the only other maxHp = boss :270 64] / :340 spiralEvery 0.6 / :341 splicer.boltSpeed 7.0 / :496 gunship boltSpeed 5.5 / :770 life 4.0; bossContentFrac ABSENT (occurrence 0).
- splicer.test.js pins (occurrence==1, file LF): :29 maxHp 30 [T1 re-pin] / :40-44 hp curve (data-driven) / :92-103 enrage model (data-driven) / :123 + :140 constructor inputs (left as-is) / :36 boltSpeed < ship.maxSpeed (14) / :134 boltSpeed data-driven / :157-171 gap / steady-state (data-driven).
- splicer.js (read verbatim): splicerHpForWave (wave < hpFirstWave 15 -> s.maxHp; wave-10 HP = maxHp exactly) / hit() (decrements hp by 1, THEN checks hp/maxHp < 0.5 one-way; enrage math: at 30 HP -> hp 14 after 16 hits, phase-2 exposure 14; at 24 HP -> hp 11 after 13 hits, phase-2 exposure 11).
- game.js:643 (the splicer spawn with splicerHpForWave(cfg, wave) - verified verbatim).
- Cross-file (grep-verified): src/core maxHp consumers = splicer.js (constructor default + splicerHpForWave) + game.js:643 ONLY; campaignBoss.js 0 references to cfg.splicer (own cb.hp[level] table); e8cBatch :150-155/:169/:174-175/:385 data-driven (the :169 splicer <= Monolith invariant holds at 24 at every wave 10..500); bossTally :47/:97 hp:52 synthetic input; bossPhase2 :223 data-driven.
- sweep667.mjs: BASE_SPEEDS [6,8,9,10,15] + resolve s===6 (the E103 measured correction) - inherited verbatim by sweep668 (zero harness change); seed base 66700 occurrence==4 -> 66800 in the clone.
- scope-check-E104.md absent before this write (this file, NEW).

## DoD
- ST-628 (I670): 7-file bookkeeping, ONE atomic commit, dist byte-identical 6,967,985 B / 205, npm test 1,261/1,261, vendor 4/4 + decoder D428E73A000057C6.
- ST-629 (I671): lever pass (8 config lines + 2 waves.js sites) + 14 re-pins + fresh lever-applied npm test 1,261/1,261 + GATE670 6/6 + sweep668 record + acceptance (a)-(e) verdict (OR AMENDMENT for additional red sites; an (a) or (b) wall failure -> straight C1).
- ST-630 (I672): G104.0 close gate 6/6 + CLOSE FLOOR E104 WITH MEASUREMENT + AGENTS.md refresh.

## Next owner
- ST-629 (I671) per the landing plan.
