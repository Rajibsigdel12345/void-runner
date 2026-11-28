# E105 scope check - T1 re-pair round: re-land P2+P3+Q1+R1+S1+G1+K1+T1 in ONE pass with (a)/(c) re-paired as comparability-only

Opened I673 (ST-631). Follows the I672 close (E104 G104.0 CLOSED: CLOSEGATE672 6/6 EXACT zero re-pins, CLOSE FLOOR E104 = 329,615 B WITH MEASUREMENT, dist 6,967,985 B / 205 fresh re-measured; byte-identical I670->I672).

## Why this round (the E104 outcome / the wall record)
- The E104 frozen set (re-landed P2+P3+Q1+R1+S1+G1+K1 + T1 splicer.maxHp 30 -> 24) applied ONE pass at I671 MOVED THE WALL: (b) SPLICER wave-10 primary 11/30 -> 7/30 (sweep668 vs sweep667) - the first lever in the series to crack it. (b) PASS / (d) reach13 5/30 PASS, but the round was C1'd on (a) B56 8/30 (vs <= 7) + (c) median 9.5 (vs >= 10) - both adjudicated SEED-BAND VARIANCE: T1 has ZERO causal path to waves 5-6 (Splicer debuts wave 10; splicerHpForWave returns base maxHp for wave < 15; game.js:643), and B56's 11-point lineage across the sweeps below is 10/4/12/13/8/12/8/5/5/3/8 (best 3, worst 13) - it tracks the seed draw, not the lever set.
- THE E104 LESSON (measured): the wave-10 Splicer wall is a TTK wall, not a bolt-speed wall. And the per-round fresh-seed (a)/(c) comparability problem is now the SECOND binding constraint: the E104 acceptance gated the round on two metrics the round does not control, and the round was lost on that coin flip while its target wall moved.
- E105 = the T1 RE-PAIR round: re-land the identical 8-lever set (NO new lever) ONE pass and adjudicate it under the FIXED acceptance where (a)/(c) are comparability-only. If (b)+(d)+(e) PASS, this is the first lever set to SHIP in the series.

## The E104 finding (measured, WITH MEASUREMENT)
- sweep668 record (the E105 starting record): 30/30 died, median 9.5, reach13 5/30, B56 8/30 (M56 1/30 / M56' 8/30), SPLICER 7/30, w10 15 started / 6 cleared, H 9/30, wall ms 5,025. Tally (primary) {"SPLICER":7,"rock_M":5,"MONOLITH":2,"bullet_unknown":8,"rock_L":2,"sentry":1,"gunship":3,"rock_S":2}.
- T1 (measured effective): SPLICER 11/30 (sweep664/667) -> 7/30 (sweep668). Mechanism: the wave-10 Splicer HP = base maxHp exactly (splicerHpForWave, wave < hpFirstWave 15); 30 hits -> 24 hits = -20% total spiral exposure; enrage (hp < maxHp x 0.5) at hp 14 after 16 hits (30 HP) vs hp 11 after 13 hits (24 HP) = -21% phase-2 exposure (derived from the verbatim hit() read, I670 session).
- (a)/(c) variance (the E105 design input): B56 11-point lineage 10/4/12/13/8/12/8/5/5/3/8 across sweep642/647/649/650/651/653/659/661/664/667/668 (best 3, worst 13, a 4.3x range on comparable sets); median lineage 9/10/9/8/10/10/10/9.5/10/10/9.5 (band 8-10). Neither shows a lever-attributable trend across 11 sweeps; both vary with the seed draw.

## THE E105 DESIGN QUESTION - decision + pre-registration
- Problem: the E104 frozen acceptance gated the round on (a) B56 <= 7/30 and (c) median >= 10 - metrics with NO causal path from this round's levers (the waves 5-6 band + the overall median), whose 11-sweep lineage shows seed-band variance (B56 3-13; median 8-10). E104 was lost on exactly this: the wall moved (b) 11/30 -> 7/30 and the round C1'd on the (a)/(c) coin flip.
- Decision (PRE-REGISTERED, FROZEN): OPTION A - re-pair (a) B56 and (c) median as COMPARABILITY-ONLY. Acceptance gates = (b) SPLICER wave-10 primary <= 7/30 + (d) reach13 >= 3/30 + (e) 6-harness gate EXACT. (a)/(c) remain measured, reported, and lineage-tracked every round; a non-gating R-FLAG (below) keeps the regression canary.
- Rationale (measured):
  - Causal isolation: the levers' causal paths are wave-8+ (gunship wall: G1; boss/Monolith: P2/P3/P4/P5/P6; Splicer wave 10: Q1/K1/T1; S1 tapers BOSS waves from wave 5 - but S1 is present in every sweep since sweep661 and B56 still ranged 5/5/3/8 across sweep661/664/667/668 with S1 constant). Gating on (a)/(c) judges the round on the seed draw.
  - Cost: E104's straight-C1 on (a)/(c) cost one full round (I671) despite the wall moving. Re-pairing converts that coin flip into a reported metric; the round's verdict hinges on what the levers control.
- Option B (fixed seed band) CONSIDERED and REJECTED as the primary design (pre-registered):
  - (i) Cost: two 30-run sweeps per round (base band validation + lever sweep) - doubled process surface per round.
  - (ii) Does not solve the structural problem: band selection is ITSELF one draw from the same seed distribution producing the variance; a band where base (a)/(c) are known-good is known-good for that band only, and since the levers have no causal path to (a)/(c), the band test and the lever run measure the same variance twice.
  - (iii) Adds a second frozen document surface (the band-qualification rule needs its own frozen acceptance) that can itself be adjudicated on a coin flip.
  - Retained as fallback: if sweep669 (b) fails on a comparability question again, E106 MAY pre-register a band-validation round (not pre-registered now).
- R-FLAG (PRE-REGISTERED, non-gating): if (a) B56 >= 14/30 (beyond the 11-point lineage worst 13) or (c) median <= 7 (2+ below the lineage band floor 8), the sweep record carries a REGRESSION-FLAG note for the next round's review. It does NOT trigger C1 by itself.

## The lever set (re-landed; identical to I671; NO new lever)
- P2 boss.burst.speed 7.0 -> 6.0 (config.js:306) / P3 boss.fireEvery 2.2 -> 2.6 (config.js:281) / Q1 splicer.spiralEvery 0.6 -> 0.7 (config.js:340) / R1 enemyBullets.life 4.0 -> 3.0 (config.js:770) / S1 wave.bossContentFrac 0.67 (new config.js line after :215; WaveDirector.contentFor boss-wave taper + isBossWave in waves.js) / G1 gunship.boltSpeed 5.5 -> 5.0 (config.js:496) / K1 splicer.boltSpeed 7.0 -> 6.0 (config.js:341, measured constant - sweep667 neutral) / T1 splicer.maxHp 30 -> 24 (config.js:326, NOW MEASURED-EFFECTIVE - sweep668 SPLICER 11/30 -> 7/30).
- Why the whole set (not T1 alone): the set is the measured base (sweep667/668 ran on it); dismantling it re-exposes the wave-8 gunship wall (G1's job) and confounds the Splicer measurement (the E104 R-6 note, now standing). T1 is layered on the set; the round's verdict is the set's verdict.
- Why NO new lever this round: adding K1b (armSpin 1.2 -> 0.9) alongside the T1 re-land = a second concurrent SPLICER lever = attribution confound (the P4 lesson). If the set ships this round, K1b comes to the SHIPPED base in E106 as a clean single-lever round.

## Wall record (measured; 11-sweep table)
- sweep642 (baseline, no levers): median 9 / reach13 1/30 / SPLICER 11/30 / B56 10/30 / w10 cleared 1/30 / H 21/30 / wall ms 5,649.
- sweep647 (P2+P3): median 10 / reach13 2/30 / SPLICER 13/30 / B56 4/30 / w10 cleared 5/30 / wall ms 5,483.
- sweep649 (Q1): median 9 / reach13 2/30 / SPLICER 6/30 / B56 12/30 / w10 cleared 3/30 / wall ms 5,458.
- sweep650 (Q1+Q2): median 8 / reach13 3/30 / SPLICER 5/30 / B56 13/30 / w10 cleared 3/30 / wall ms 4,919 (Q2 REJECTED).
- sweep651 (P2+P3+Q1): median 10 / reach13 2/30 / SPLICER 7/30 / B56 8/30 / w10 started 17 / cleared 3 / H 10/30 / wall ms 5,302.
- sweep653 (+P4): 30/30 died / median 10 / reach13 2/30 / SPLICER 7/30 / B56 12/30 / wall ms 4,748 (P4 DEMOTED).
- sweep659 (P2+P3+Q1+R1): 30/30 / median 10 / reach13 5/30 / SPLICER 7/30 / B56 8/30 / M56 0/30 / H 7/30 / w10 cleared 5/30 / wall ms 20,531.
- sweep661 (+S1@0.67): 30/30 / median 9.5 / reach13 3/30 / SPLICER 7/30 / B56 5/30 / M56 3/30 / H 11/30 / w10 cleared 8/30 / wall ms 7,866 ((c) FAIL -> C1).
- sweep664 (+G1, the E102 set): 30/30 / median 10 / reach13 6/30 / SPLICER 11/30 / B56 5/30 (best-in-lineage then) / M56 3/30 / gunship 1/30 / H 16/30 / w10 21 started / 7 cleared / wall ms 8,638 ((b) FAIL 11/30 -> C1).
- sweep667 (+K1, the E103 set): 30/30 / median 10 / reach13 5/30 / SPLICER 11/30 (UNCHANGED vs sweep664 - K1 did NOT move the wall) / B56 3/30 (NEW LINEAGE BEST then; 7-point record 4/8/12/8/5/5/3) / M56 3/30 / gunship 1/30 / H 14/30 / w10 21 started / 9 cleared / wall ms 6,777 ((b) FAIL 11/30 -> C1).
- sweep668 (+T1, the E104 set): 30/30 / median 9.5 / reach13 5/30 / SPLICER 7/30 (MOVED THE WALL: 11/30 -> 7/30) / B56 8/30 / M56 1/30 / M56' 8/30 / gunship 3/30 / H 9/30 / w10 15 started / 6 cleared / wall ms 5,025 ((a) FAIL 8/30 + (c) FAIL 9.5 -> straight C1; THE E105 record - T1's effect measured; (a)/(c) = seed-band variance).

## The harness section (sweep669 = content-asserted clone of sweep668.mjs - ZERO logic changes)
- The re-landed set is IDENTICAL to I671's lever-applied tree, so sweep668.mjs's harness (kiter, cap 36,000 ticks @ 1/60, BULLET_LIFE_TICKS 3/DT for R1, attribution BASE_SPEEDS [6,8,9,10,15] + resolve s===6) is exactly right for sweep669 as-is.
- Label fixes ONLY (I583/I570 lesson - sweep668's clone missed 2 output-ref strings, fixed post-run by fix668name.cjs; sweep669's clone fixes ALL of them PRE-RUN, occurrence-asserted on disk at I674 before first run):
  - 66800 (4x) -> 66900
  - sweep668 (5x) -> sweep669
  - results668.txt (1x) -> results669.txt
  - run_gate670.cjs (1x) -> run_gate673.cjs
  - I671 E103 (2x: header comment + results title line) -> I674 E105
  - comment "deferrals to E104" (1x) -> "deferrals to E105" (cosmetic)
  - RESIDUAL CHECK: the clone contains ZERO lines matching 66800|sweep668|results668|run_gate670|I671.
- rules669.md FROZEN PRE-RUN in .evidence/I674/ (the fixed acceptance incl. comparability-only (a)/(c) + R-FLAG + the wall definitions + the death-source tally format + the per-wave started/cleared table + the harness-inherited note); line-asserted before first run.

## Test-pinning map (identical to I671's 24-site patch; all occurrence==1 on disk, CRLF-aware)
Re-land (13 sites - the EXACT I668/I671 set):
1-5. bossBurst.test.js: :28 b.speed 7.0 -> 6.0 [P2] + 4 geometry sites (ring cos/sin, offset cos/sin) "x 7.0" -> "x 6.0" [P2].
6-8. e9Batch.test.js: the data-driven life test (loop bound + final step, the single "4.0" reference) [R1] + rim-cull title + premise comment (assert unchanged) [R1].
9-11. endless.test.js: :40 contentFor(10) 14 -> 9 / :42 contentFor(50) cap -> 24 [S1] + :111 director-run wave-10 14 -> 9 (the I662 amendment) [S1].
12. config.js:496 gunship boltSpeed 5.5 -> 5.0 [G1] - the config lever itself (re-land).
13. gunship.test.js:34 boltSpeed 5.5 -> 5.0 [G1].
T1 (1 test site - same as I671):
14. splicer.test.js:29 "assert.equal(s.maxHp, 30);" -> "assert.equal(s.maxHp, 24);" (occurrence==1; the file is LF; single-line pair - no CRLF concerns).
Config (8 sites): :281 fireEvery 2.2 -> 2.6 / :306 burst.speed 7.0 -> 6.0 / :326 maxHp 30 -> 24 (full-line pair incl. comment) / :340 spiralEvery 0.6 -> 0.7 / :341 boltSpeed 7.0 -> 6.0 / :496 boltSpeed 5.5 -> 5.0 / :770 life 4.0 -> 3.0 / NEW line after :215 wave.bossContentFrac 0.67.
waves.js (2 sites): contentFor boss-wave taper + isBossWave (from S1).
Total 24 sites over 7 files - patch674.cjs = content-asserted clone of patch671.cjs (6,194 B, 24 occurrence-asserted pairs; dry-run first; every occurrence==1 re-verified on disk at I674).
NOT re-pinned (verified I670/I671 sessions, unchanged): splicer.test.js :40-44 (hp curve data-driven - holds at 24: base 24, scales after hpFirstWave 15, caps hpCap 72) / :92-103 (enrage model data-driven) / :123 + :140 (constructor INPUTS, explicit hp) / :157-171 (gap/steady-state data-driven); e8cBatch.test.js :150-155 / :169 (splicerHpForWave <= bossHpForWave invariant holds at 24 at every wave 10..500: 24/32/40/48/56/64/72 vs 64/76/88/88/88/88/88) / :174-175 / :385 (data-driven); bossTally.test.js :47/:97 "hp: 52" synthetic input; bossPhase2.test.js :223 data-driven; campaignBoss.js 0 references to cfg.splicer (own cb.hp[level] table - grep-verified; the campaign boss is NOT affected by T1).

## Scope Fit
- Code-only: 8 config lines (re-land P2 :306 / P3 :281 / Q1 :340 / K1 :341 / G1 :496 / R1 :770 + S1 NEW :216 bossContentFrac 0.67 + T1 :326 maxHp 30 -> 24) + 2 waves.js sites (contentFor taper + isBossWave, from S1) + 14 test re-pin sites in ONE pass - IDENTICAL to I671's applied patch. NO new lever this round. No Blender (fleet FROZEN), no new dist files (205).
- I673 = docs-only -> dist byte-identical 6,967,985 B / 205. I674 = CODE change -> dist delta NON-zero expected (a few hundred B - config value lines + waves.js taper; test/harness files are not shipped); budget +1,000 B worst case, measured.

## Research (FROZEN at open I673)
- cgs-scope-check + cgs-balance-check applied (scope pre-registration, cut ladder, measurement protocol; the acceptance fix is a measurement-METHOD decision derived from the in-repo 11-sweep record + the code-verified causal isolation, not a pre-round hypothesis - the cgs-balance-check measurement-over-invention rule).
- NO new external research this round: the round is a re-adjudication of a measured lever set under a fixed acceptance; the in-repo sweep record supersedes (E101/E102/E104 finding: no purpose-matched content).

## Landing plan (PRE-REGISTERED)
- ST-631 (I673): this open - scope FROZEN (docs-only, dist byte-identical).
- ST-632 (I674): apply the set ONE pass (patch674.cjs = content-asserted clone of patch671.cjs, 24 sites over 7 files, dry-run first) + fresh lever-applied npm test (expected 1,261/1,261; any additional red beyond the 14 pre-registered sites = AMENDMENT, recorded) + GATE673 (clone .evidence/I671/run_gate670.cjs -> run_gate673.cjs, label GATE673, OUTDIR .evidence/I674/, PRE-RUN 6/6 marker re-verify against the current gate .outs in .evidence/I672/) + sweep669 (clone per the harness section; seeds 66900+i; rules669.md FROZEN PRE-RUN, line-asserted before first run [I583/I570]) + acceptance (a)-(e) incl. R-FLAG. NO escalation lever pre-registered.
- ST-633 (I675): ACCEPT path: G105.0 close gate (clone the I672 close kit -> run_close675.cjs, label CLOSEGATE675, OUTDIR .evidence/I675/, PRE-RUN 6/6 marker re-verify against the I674 GATE673 .out files) + CLOSE FLOOR E105 WITH MEASUREMENT + AGENTS.md refresh (item-4 chain + CLOSE FLOOR E105 clause [E104 demoted to prior]) - this is a SHIP round (dist grows a few hundred B; the lever set lands in the shipped tree). FAIL path: C1 (frozen, below) + G105.0 close on the restored tree (byte-identical pattern, E96-E104 precedent).

## Frozen bounds
- splicer block: EXACTLY three changes - maxHp 30 -> 24 [T1] + spiralEvery 0.6 -> 0.7 [Q1] + boltSpeed 7.0 -> 6.0 [K1]. Frozen: radius 2.6 / hpFirstWave 15 / hpStep 8 / hpCap 72 / holdRadius 11 / orbitSpeed 0.5 [Q5] / spin 0.4 / enterTime 1.2 / arms 2 / armSpin 1.2 [K1b] / aimEvery 2.6 / score 600 / split 2xM / the entire phase2 block.
- wave block / gunship block / boss block / enemyBullets / mines / hp scale both blocks / warden / other enemy blocks / spawn mix / E94 pacing / campaign (flightPath / levelState / campaign boss / checkpoint / storage) / vendor / PWA / audio / camera / input / all 34 GLBs (201,245 t) frozen - bossContentFrac 0.67 re-landed is the ONLY wave-block change; gunship boltSpeed 5.5 -> 5.0 the ONLY gunship-block change; boss burst.speed 7.0 -> 6.0 [P2] + fireEvery 2.2 -> 2.6 [P3] the ONLY boss-block changes; enemyBullets life 4.0 -> 3.0 [R1] the ONLY enemyBullets-block change.

## Frozen acceptance (FROZEN)
- (a) B56: COMPARABILITY-ONLY (measured + reported + lineage-tracked; NON-gating). Lineage reference (11-point): 10/4/12/13/8/12/8/5/5/3/8.
- (b) SPLICER wave-10 primary kills <= 7/30 [GATE; sweep668 = 7/30 on this exact set].
- (c) median death wave: COMPARABILITY-ONLY (measured + reported + lineage-tracked; NON-gating). Lineage reference: band 8-10.
- (d) >= 3/30 reach wave >= 13 [GATE; sweep668 = 5/30].
- (e) 6-harness gate EXACT [GATE: causal483 13,350 / playframe A 22/92,435 + P 11/2,076 / B 52/200,808 / pwa491 11/11 / fleet628 34/34 GLB 201,245 t / causal495 3-arm - the re-landed set verified EXACT at GATE670 at I671 (6/6 zero re-pins), so all EXPECTED EXACT unchanged; the pre-registered re-pin contingency stays documented but is NOT expected to fire].
- R-FLAG (non-gating): (a) B56 >= 14/30 (beyond the 11-point lineage worst 13) or (c) median <= 7 (2+ below the lineage band floor 8) -> REGRESSION-FLAG note in the sweep record for the next round's review.
- Frozen adjudication (FROZEN): (b) FAIL -> straight C1. (d) FAIL -> straight C1. (e) any gate non-EXACT -> C1. (b)+(d)+(e) all PASS -> ACCEPT (ship; -> I675 close). R-FLAG never gates. NO escalation lever.

## Measurement protocol
- sweep669: 30 fresh seeds 66900+i, full director + kiter, cap 36,000 ticks @ 1/60, headless node (in-process, zero servers/tabs); rules669.md FROZEN PRE-RUN in .evidence/I674/ (the frozen acceptance incl. the comparability-only (a)/(c) + R-FLAG definitions + the wall definitions + the death-source tally format + the per-wave started/cleared table + the harness-inherited note); harness = content-asserted clone of sweep668.mjs, zero logic changes (labels + seeds only, per the harness section).
- Gate harnesses (ST-632 + ST-633): causal495 (dist :4200) / causal483 (dev :5173, DEMO PILOT) / playframe491 (dev :5173) / playframe483 (shares the playframe491 windows) / pwa491 (dist :5199) / fleet628 (34/34 GLB / 201,245 t).
- Every run: wall ms + per-run lines + tallies recorded in .evidence/I674/results669.txt.

## Budget (pre-registered)
- Start (I672 close, fresh dist re-measured): 6,967,985 B / 205 files.
- Close target: 7,297,600 B (7,400,000 ceiling - 102,400 B close-floor).
- Envelope at open: 329,615 B.
- ST-632 expected delta: a few hundred B (config.js value lines + waves.js taper; test/harness files not shipped to dist). Worst-case budget: +1,000 B (measured, documented).
- Cut ladder floor: 102,400 B (never cross the close target).

## Cut ladder (pre-registered)
- C1 (frozen): git restore src/core/config.js src/core/waves.js tests/bossBurst.test.js tests/e9Batch.test.js tests/endless.test.js tests/gunship.test.js tests/splicer.test.js (ONE atomic restore of ALL SEVEN - reverts P2, P3, Q1, R1, S1, G1, K1, T1 and all 14 re-pins; sweep669.mjs is .evidence scratch, not committed, so the harness needs no revert) + accept-with-documentation + deferrals to E106 WITH the sweep669 record: K1b (Q3 armSpin 1.2 -> 0.9 - the primary Splicer geometry variant, on the shipped base if the set ever lands, else on the restored base) / splicer.enterTime 1.2 -> 1.6 / Q5 (orbitSpeed 0.5 -> 0.35) / P5 (everyMult 0.65 -> 0.75) / P6 (enemyBullets.speed 9 -> 8) / P4 DEMOTED / S1 variant (deeper 0.5 taper or wave-5-only) / IF (b) fails on a comparability question: the Option-B band-validation round (pre-registered fallback from the design section).
- No second fiddle: one pass per landing; each ladder invocation recorded as an AMENDMENT.

## REJECTED at open
- Option B (fixed seed band) as the primary design: REJECTED with the measured cost analysis in the design section (two sweeps per round; band selection is itself one draw of the same seed variance; adds a second frozen document surface). Retained as the E106 fallback.
- K1b armSpin 1.2 -> 0.9 as a concurrent E105 lever: a SECOND concurrent SPLICER lever alongside the T1 re-land = attribution confound (the P4 lesson). Clean single-lever round on the base that ships (or the restored base) in E106.
- Keeping (a)/(c) as gates: REJECTED WITH MEASUREMENT - the 11-sweep lineage (B56 3-13, 4.3x range; median 8-10) + the E104 outcome (round lost on the coin flip while the wall moved 11/30 -> 7/30) + the code-verified causal isolation (no lever path to waves 5-6; S1 constant since sweep661 with B56 still ranging 5/5/3/8).
- A T1-only sweep (set minus the re-lands): dismantling the measured base re-exposes the wave-8 gunship wall (G1's job) and confounds the Splicer measurement (the E104 R-6 note, standing).

## Deferrals (out of E105, queue intact)
- K1b splicer.armSpin 1.2 -> 0.9 (primary Splicer geometry variant - the next axis after TTK measured effective) / Q5 splicer.orbitSpeed 0.5 -> 0.35 / P5 burst.everyMult 0.65 -> 0.75 / P6 enemyBullets.speed 9 -> 8 (boss-aimed-bolt semantics) / P4 burst.offsetSpin 0.45 -> 0.30 (DEMOTED) / S1 variant (deeper 0.5 or wave-5-only) IF (a) R-FLAGS / splicer.enterTime 1.2 -> 1.6 / the Option-B band-validation round IF sweep669 (b) fails on comparability.

## Risks
- R-1: sweep669 is a fresh seed draw - sweep668's (b) 7/30 is ONE run (n=30) on different seeds; T1's effect is deterministic HP math (verified against the verbatim hit()/splicerHpForWave), but the sweep result is still one draw. The frozen acceptance is the arbiter, no pre-derivation.
- R-2: attribution - if (b) PASSES, the verdict is "set + T1", not "T1 alone" (documented; the set is the measured base; E106's K1b round keeps the set).
- R-3: S1 is MODE-SHARED (campaign boss waves taper too) - no campaign test pins boss-wave rock content (level-flow.test.js pins only w.field.count == 0); T1 is mode-gated in practice (campaignBoss.js 0 references to cfg.splicer, grep-verified). The fresh lever-applied npm test (the designed catch) is the final arbiter, campaign suite included.
- R-4: gate (e) - the re-landed set verified EXACT at GATE670 at I671 (6/6 zero re-pins); the set's material is wave-5+ (boss taper) and wave-8+ (gunship/Splicer) - no gate harness reaches those waves (causal495/483 demo pilot ends wave 2; playframe B frame 50 wave 1) -> all 6 EXPECTED EXACT unchanged. If any gate shifts, that is UNEXPECTED -> C1 input.
- R-5: re-pin correctness - 24 sites, every string occurrence==1 verified on disk (CRLF-aware; splicer.test.js is LF); the pre-registered fresh lever-applied npm test catches a wrong re-pin; C1's atomic restore covers all seven files.
- R-6: the comparability fix changes acceptance SEMANTICS - (a)/(c) no longer gate; the non-gating R-FLAG (lineage-envelope canary: (a) >= 14 or (c) <= 7) is the retained regression signal. If a future round R-FLAGS, that is a review input, not a verdict.
- R-7: sweep669 harness label drift - the clone MUST pass the residual check (zero lines matching 66800|sweep668|results668|run_gate670|I671) before first run (the I583/I570 lesson; sweep668's clone was fixed post-run, sweep669's is fixed pre-run).

## Verification evidence (measured this session)
- I672 close (lineage anchor): CLOSEGATE672 6/6 EXACT zero re-pins (causal495 3-arm + causal483 EXACT 13,350; playframe483/491 EXACT A 22/92,435 + P 11/2,076 / B 52/200,808; pwa491 11/11; fleet628 34/34 GLB / 201,245 t); dist 6,967,985 B / 205 fresh re-measured; CLOSE FLOOR E104 329,615 B WITH MEASUREMENT; npm test 1,261/1,261.
- sweep668 record (the E105 starting record, .evidence/I671/results668.txt): 30/30 died, median 9.5, reach13 5/30, B56 8/30 (M56 1/30, M56' 8/30), SPLICER 7/30, w10 15 started / 6 cleared, H 9/30, wall ms 5,025, tally (primary) {"SPLICER":7,"rock_M":5,"MONOLITH":2,"bullet_unknown":8,"rock_L":2,"sentry":1,"gunship":3,"rock_S":2}; acceptance as-run: (a) FAIL 8/30 / (b) PASS 7/30 / (c) FAIL 9.5 / (d) PASS 5/30 / (e) EXTERNAL.
- config.js (CRLF-aware, occurrence==1 each, post-C1 base values verified on disk this session): :281 fireEvery 2.2 / :306 burst.speed 7.0 / :326 splicer.maxHp 30 (full-line pair incl. comment; the only other maxHp = boss :270 64) / :340 spiralEvery 0.6 / :341 splicer.boltSpeed 7.0 / :496 gunship boltSpeed 5.5 / :770 life 4.0; bossContentFrac ABSENT (occurrence 0).
- sweep668.mjs (on disk, 19,422 B, post-fix668name): 66800 x4 / results668.txt x1 / run_gate670.cjs x1 / sweep668 x5 / "I671 E103" x2 / "deferrals to E104" x1 / sweep667 residual 0 / BASE_SPEEDS [6,8,9,10,15] + resolve s===6.
- patch671.cjs (on disk, 6,194 B, the 24-site template) - the I671 applied patch; the I674 clone asserts all 24 pair occurrences again on disk.
- run_close672.cjs + measuredist672.cjs (on disk) - the I675 close-kit clone base.
- scope-check-E105.md ABSENT before this write (this file, NEW).

## DoD
- ST-631 (I673): 7-file bookkeeping, ONE atomic commit, dist byte-identical 6,967,985 B / 205, npm test 1,261/1,261, vendor 4/4 + decoder D428E73A000057C6.
- ST-632 (I674): lever pass (8 config lines + 2 waves.js sites) + 14 re-pins + fresh lever-applied npm test 1,261/1,261 + GATE673 6/6 + sweep669 record + acceptance (a)-(e) verdict (OR AMENDMENT for additional red sites; a (b) or (d) gate failure -> straight C1).
- ST-633 (I675): G105.0 close gate 6/6 + CLOSE FLOOR E105 WITH MEASUREMENT + AGENTS.md refresh (accept: SHIP round, dist grows a few hundred B; fail: byte-identical C1 pattern).

## Next owner
- ST-632 (I674) per the landing plan.
