# E99 scope check - Monolith shape-lever round: validated cadence base (P2+P3+Q1) + P4 burst.offsetSpin 0.45 -> 0.30 in ONE pass (pre-registered escalation Q4 splicer.phase2.spiralEveryMult 0.65 -> 0.75)

Opened I655 (ST-613..ST-615 pre-registered). E98 CLOSED at I654 (2cd1ce0, remote-verified this session: git ls-remote origin main == 2cd1ce05d1e815ea92a351e5386828655c0144c9 == local HEAD). The structural finding carried from the E98 close (sweep651): concurrent cadence levers are not the fix - the walls move independently. The concurrent cadence set is the only configuration ever to move BOTH walls at once (B56 10 -> 8/30, SPLICER primary 11 -> 7/30) and it passed (b) SPLICER 7/30 and (c) median 10; (a) B56 8/30 landed ONE over the line, inside seed-set variance of its sibling run sweep647 (identical levers, different seeds: 4/30); (d) reach13 2/30 landed one short (sweep650 reached 3/30). E99 thesis: the cadence base is validated (both walls move); the (a) miss is seed variance plus residual Monolith pattern-SHAPE pressure. E99 lands the re-landed cadence base - P2 burst.speed 7.0 -> 6.0 (src/core/config.js:306) + P3 fireEvery 2.2 -> 2.6 (src/core/config.js:281) + Q1 splicer.spiralEvery 0.6 -> 0.7 (src/core/config.js:340) - PLUS the Monolith-side shape lever P4 burst.offsetSpin 0.45 -> 0.30 (src/core/config.js:307) in ONE pass, with the pre-registered escalation Q4 splicer.phase2.spiralEveryMult 0.65 -> 0.75 (src/core/config.js:347) applied ONLY if the (d) reach-13 target fails. No assets, no new dist files, no campaign/ring/spawn changes.

## Why re-land the C1-reverted cadence base (E98 amendment record)

- sweep651 (the E98 C1 record) is the only measurement of the concurrent set: (a) B56 8/30 vs <= 7/30 (one over) / (b) SPLICER 7/30 PASS / (c) median 10 PASS / (d) reach13 2/30 vs >= 3/30 (one short).
- Seed-set variance is measured in this lineage: the identical P2+P3 lever pair scored B56 4/30 on the sweep647 seed set (64700+i) and contributed 8/30 on the sweep651 seed set (65100+i). The (a) miss is not evidence the levers failed.
- P2/P3/Q1 were NOT on the E98 C1 deferral list (which carried Q3/Q4/Q5/P4/P5/P6/structural bolt residency) - they were the primary set reverted because the combined run failed two lines. Re-testing them under the new hypothesis ("shape lever P4 pulls (a) under with margin and feeds depth (d)") is a fresh experiment, not a second fiddle: the lever set differs from sweep651 (P4 added), the seed set is fresh (65300+i), and the frozen acceptance (a)-(e) adjudicates.
- Single-lever rounds in this lineage (E95 P1 / E96 P2+P3 / E97 Q1) never passed the frozen acceptance because each left the other wall standing - a single-lever E99 (P4 alone) would leave the SPLICER wall at the sweep642 baseline 11/30, far from (b) <= 7/30. Re-landing the base is the precondition for the shape-round hypothesis to be testable in one round.

## Wall record (measured; 5-sweep table; lineage I144 -> E77/E81/E82 -> E95 -> E96 -> E97 -> E98)

- sweep642 (I643, baseline, no levers): median 9 / reach13 1/30 / SPLICER primary 11/30 / B56 10/30 / M56' 10/30 / w10 cleared 1/30 (of 14 started) / H primary 21/30 / wall ms 5649. Interpretation: both walls live in the baseline.
- sweep647 (I647, P2+P3 [E96 C1 record]): median 10 / reach13 2/30 (64608 w14, 64622 w15) / SPLICER primary 13/30 / B56 4/30 / M56' 3/30 / w10 cleared 5/30 / H primary 14/30 / wall ms 5483. Interpretation: P2+P3 broke wave-5/6 decisively (B56 10 -> 4/30, best in lineage) but the wall MOVED to wave-10 SPLICER (13/30).
- sweep649 (I650, Q1 [E97 C1 record]): median 9 / reach13 2/30 (64901 w13, 64922 w13) / SPLICER primary 6/30 / B56 12/30 / M56' 12/30 / w10 cleared 3/30 (14 started) / H primary 16/30 / wall ms 5458. Interpretation: Q1 broke wave-10 (SPLICER 11 -> 6/30) but B56 12/30 returned, capping the median at 9.
- sweep650 (I650, Q1+Q2 [E97 C1 record]): median 8 / reach13 3/30 (65009 w13, 65011 w15, 65018 w15) / SPLICER primary 5/30 / B56 13/30 / M56' 13/30 / w10 cleared 3/30 (13 started) / H primary 15/30 / wall ms 4919. Interpretation: Q2 left SPLICER 5/30 but made wave-5/6 WORSE (B56 12 -> 13/30) and traded the median 9 -> 8 for reach13 - Q2 is a depth lever, not a wall lever (REJECTED as the E99 escalation).
- sweep651 (I653, P2+P3+Q1 [E98 C1 record], wall ms 5302): 30/30 died / median 10 / reach13 2/30 (65110 w13 + 65113 w15) / SPLICER primary 7/30 / B56 8/30 / M56 3/30 / M56' 7/30 / w10 started 17 / cleared 3 / H primary 10/30. Primary tallies {"SPLICER":7,"rock_S":4,"bullet_unknown":7,"MONOLITH":3,"gunship":5,"rock_M":2,"sentry":1,"mine":1}. Interpretation: the first configuration where BOTH walls moved at once; (b) PASS / (c) PASS / (a) one over (within variance of the sweep647 sibling 4/30) / (d) one short - the E98 C1 trigger was (a).
- Boss alternation: wave 5 Monolith / wave 10 Splicer / wave 15 Monolith (bossSpawnCount even = Monolith, odd = Splicer) - one run crosses BOTH walls; a run killed on wave 10 has already survived wave 5/6.
- Campaign isolation (grep-verified at E98 open, structurally unchanged this session): src/core/campaignBoss.js has ZERO reads of cfg.boss / fireEvery / burst; the campaign boss is spawned only at game.js:852; game.js:622 early-returns spawnBossForWave for campaign. The P2/P3/P4/Q1 levers are structurally endless-only.

## Test-pinning map CORRECTION (measured this session; supersedes the E98 claim)

- bossBurst.test.js:24-31 "config: boss.burst shape and values" pins every 4.0 / count 12 / speed 7.0 / offsetSpin 0.45 / everyMult 0.65 as literals.
- The E98 scope's claim "burst.speed is NOT literally pinned anywhere (E96 finding)" is WRONG: bossBurst.test.js:28 pins `b.speed` (b = CONFIG.boss.burst - the aliased form the E96 grep pattern "burst.speed" missed).
- bossBurst.test.js:37-38 hardcode 7.0 in the geometry expectation (`Math.cos((i/12)*TAU) * 7.0`); bossBurstVectors (src/core/boss.js:9-17) reads b.speed from config, so :37-38 break under P2 as well.
- Process finding: I653's recorded npm test 1,261/1,261 ran on the C1-restored tree (commit tree byte-identical to I652; no test-run artifact in .evidence/I653/). The lever-applied tree was never green-tested in this lineage. ST-614 pre-registers the re-pins + a fresh lever-applied npm test (below).
- Other pins (re-verified this session): boss.test.js maxHp 64 / radius 3.4 untouched; enemyBullets.test.js:36 fireEvery >= 1.5 PASSES at 2.6 (inequality, safe); splicer.test.js :29 maxHp 30 / :30 radius 2.6 / :36 boltSpeed 7.0 untouched by Q1/Q4; splicer.test.js :156-171 gap/concurrency guards MADE SAFER by Q1 (+Q4); bossBurst.test.js:98 (second-volley rotation) data-driven via CONFIG (safe under P4); e8cBatch.test.js data-driven. Suite 1,261 SAFE under the pre-registered re-pin set.

## Pre-registered test re-pins (ST-614, WITH MEASUREMENT)

- bossBurst.test.js:28 `assert.equal(b.speed, 7.0);` -> `assert.equal(b.speed, 6.0);` (occurrence==1 full-line patch)
- bossBurst.test.js:29 `assert.equal(b.offsetSpin, 0.45);` -> `assert.equal(b.offsetSpin, 0.30);` (occurrence==1 full-line patch)
- bossBurst.test.js:37-38 `* 7.0` -> `* 6.0` (two lines, occurrence==1 each)
- All four are same-length literal swaps; the test file is NOT shipped to dist (zero dist impact). Fresh npm test on the lever-applied tree (expected 1,261/1,261) BEFORE the sweep.

## Pressure math (obstacle = 2*0.9 + 2*0.22 = 2.24u)

- P4 (shape, NEW): per-volley ring rotation 0.45 -> 0.30 rad (-33%): a 12-bolt ring (30 deg bolt spacing) shifts its gap 25.8 deg -> 17.2 deg between consecutive volleys; corridor persistence +46%; cumulative drift over 3 volleys (12 s, phase 1) 77.3 deg -> 51.6 deg. A player threaded through a volley-N gap retains a wider residual gap at volley N+1.
- P2 (re-land): burst radial bolt 7.0 -> 6.0 u/s; telegraph ring (0.8 s window, radius 10 u) reaction 10/7.0 = 1.43 s -> 10/6.0 = 1.67 s (+17%).
- P3 (re-land): aimed-bolt cadence 2.2 -> 2.6 s (-18%).
- Q1 (re-land): spiral gap phase-1 4.2u -> 4.9u = 2.19x obstacle (I144 floor 1.8x); phase-2 2.73u -> 3.19u = 1.42x (floor 1.1x); steady concurrency 22.71 -> 19.78 < 24 cap.
- Q4 (escalation, depth only): Splicer phase-2 gap (with Q1 applied) 3.19u -> 3.68u = 1.64x obstacle; affects Splicer enrage (HP < 50%) = deep runs only, no early-wave effect - the narrower depth lever versus rejected Q2 (sweep650: traded median 9 -> 8).

## Scope Fit

- dist 6,967,985 B / 205 files (I654 close, re-measured on disk at open). Close target 7,297,600 B. Envelope 329,615 B.
- Assets: 34 GLBs / 201,245 t untouched (fleet frozen; no Blender in E99).
- Code: four same-length numeric literal swaps in src/core/config.js ('2.2' -> '2.6' at :281, '7.0' -> '6.0' at :306, '0.45' -> '0.30' at :307, '0.6' -> '0.7' at :340; a fifth '0.65' -> '0.75' at :347 only if the pre-registered escalation fires) + four re-pin lines in tests/bossBurst.test.js (not shipped). EXPECTED byte-identical dist (actual delta expected 0 B). File count 205.
- Code budget <= 1,000 B worst case, expected 0 B.

## Research (FROZEN at open I655)

- cgs-scope-check + cgs-balance-check applied (scope fit, measurement protocol, cut ladder, pre-registered escalation - all frozen here).
- YouTube run recorded at open (1 search / 3 queries: "bullet hell boss rotating bullet ring pattern design" / "bullet hell pattern design fair corridor gaps analysis" / "Hades boss attack pattern design analysis") - 30 raw results, NO purpose-matched content (boss guides, playthroughs, non-game recaps; the two boss-design videos are generic boss psychology / double-boss structure, not ring/spiral-drift pattern geometry). The in-repo S-library + the five sweep records supersede; not invented.
- S-library mapping (design/e95-monolith-wave5-wall-iii-research.md S1-S12): S2 single-cadence-knob class [P3 fireEvery, Q1 spiralEvery] / S3 slower-dodgeable beats fewer [P2 speed; REJECTS count reductions] / S5 Flukz safe-path design [P4 corridor persistence, Q1 gap width, Q4 enrage gap].
- Lineage: I144 (balance guards) -> E77/E81/E82 (accept-round pattern, frozen-lever precedent) -> E95 (P1 sweep643 FAILED, C1) -> E96 (P2+P3 validated sweep647, C1) -> E97 (Q1 validated sweep649, Q2 measured sweep650, C1) -> E98 (concurrent sweep651, C1, structural finding) -> E99 (shape round).

## Landing plan (PRE-REGISTERED)

- ST-613 (I655) - open + scope FROZEN, docs-only (this commit): scope-check-E99.md + 7-file bookkeeping.
- ST-614 (I656) - lever pass, ONE pass: 4 lines in src/core/config.js (P2 :306 + P3 :281 + P4 :307 + Q1 :340) + 4 re-pin lines in tests/bossBurst.test.js (:28 / :29 / :37 / :38), each an occurrence==1 full-line-asserted patch .cjs with post-patch re-measure of all 8 lines; fresh npm test on the lever-applied tree (expected 1,261/1,261). Then sweep653: 30 FRESH seeds 65300+i, rules653.md FROZEN PRE-RUN in .evidence/I656/, content-asserted clone of .evidence/I653/sweep651.mjs (full director from wave 1, I328 kiter verbatim, cap 36,000 ticks @ 1/60, in-process, zero servers/tabs). Acceptance (a) B56 <= 7/30 [sweep647 4/30; sweep651 8/30] / (b) SPLICER wave-10 primary <= 7/30 [sweep649 6/30; sweep651 7/30] / (c) median death wave >= 10 [sweep651 10] / (d) reach wave >= 13 >= 3/30 [sweep650 3/30] / (e) 6-harness gate EXACT no re-pin (levers act from wave 5 on; all pins wave <= 2 / MENU -> EXPECTED EXACT; re-pin WITH MEASUREMENT only on a documented delta).
- Escalation (pre-registered, NOT a second fiddle): ONLY on (d) reach-13 failure (an (a) or (b) wall-specific failure goes straight to C1 - Q4 is registered for depth, not for the walls): apply Q4 :347 spiralEveryMult 0.65 -> 0.75 (no test re-pin needed - the splicer guards are made safer) + sweep654 (30 fresh seeds 65400+i, rules654.md FROZEN PRE-RUN in .evidence/I656/) with the SAME acceptance (a)-(e).
- ST-615 (I657) - G99.0 close gate: clone .evidence/I654/run_close654.cjs -> .evidence/I657/run_close657.cjs (label CLOSEGATE657, OUTDIR .evidence/I657/; every marker string re-verified against actual console output PRE-RUN - the I632 lesson) + fleet smoke 34/34 GLB / 201,245 t + fresh dist vs 7,297,600 B + CLOSE FLOOR E99 WITH MEASUREMENT + AGENTS.md refresh (item-4 chain + item-6 + one-liner only if levers shipped).

## Frozen bounds

- IN: ST-614 exactly 4 lines in src/core/config.js (P2 :306, P3 :281, P4 :307, Q1 :340) + 4 re-pin lines in tests/bossBurst.test.js (:28, :29, :37, :38) + a 5th config line (Q4 :347) only if the pre-registered escalation fires. ST-613/ST-615 docs-only.
- FROZEN: 34 GLBs (201,245 t) / vendor 4 + meshopt decoder / PWA / campaign (grep-proven isolation) / boss maxHp 64 + splicer maxHp 30 (test-pinned literals) / radius 3.4 + 2.6 (test-pinned) / burst.every 4.0 [pinned :26] / burst.count 12 [pinned :27] / burst.everyMult 0.65 [pinned :30; P5 deferral] / splicer boltSpeed 7.0 / hp scale both blocks / spiral geometry (holdRadius 11 / orbitSpeed 0.5 [Q5] / spin 0.4 / enterTime 1.2 / arms 2 / armSpin 1.2 [Q3]) / aimEvery 2.6 [Q2 rejected] / enemyBullets.speed 9 [P6 deferral] / enemyBullets.mineSpeed 8 / gunship boltSpeed 9.0 (own literal) / splitCount / splitSize M / score 600 / 1000 / phase2 blocks both (except Q4 if escalation fires) / warden / spawn mix / E94 pacing / audio / camera / input / UI.

## Measurement protocol

1. npm test 1,261/1,261 GREEN (fresh on the lever-applied tree at ST-614, BEFORE the sweep).
2. npm run build clean; fresh dist vs 7,297,600 B; 205 files; EXPECTED byte-identical (0 B) at ST-614.
3. Vendor pins 4/4 EXACT (dist-minified sha256 first-16, r187): three.module.js A65DE049A7F38B40 + three.core.js 7AB0784CD2532367 + three.webgpu.js F549248412C62B9A + three.tsl.js 7FF9ACF50F006017; decoder D428E73A000057C6 29,256 B at dist/vendor/jsm/libs/meshopt_decoder.module.js.
4. Gate battery per code landing (I656 ONLY, servers briefly on :4200/:5173/:5199, ports free before AND after): causal495 3-arm (webgl + default EXACT seed-9876; webgpu report-only) + causal483 EXPECTED EXACT 13,350 / playframe483 + playframe491 EXPECTED EXACT A 22/92,435 + P 11/2,076 / B 52/200,808 / pwa491 11/11 / fleet628 34/34 GLB / 201,245 t.
5. ONE atomic commit per landing; push delegated to a fresh subagent (push only, NO Pages [blocked: free runner minutes unavailable], no force, verbatim git ls-remote origin main, agent closed after).

## Budget (pre-registered)

- Start: 6,967,985 B / 205 (I654). Close target: 7,297,600 B. Envelope: 329,615 B.
- Code: expected 0 B (same-length literal swaps; the test file is not shipped). Worst case 1,000 B -> 6,968,985 B, margin 328,615 B.

## Cut ladder (pre-registered)

- C1 (frozen): git restore src/core/config.js tests/bossBurst.test.js (ONE atomic restore of BOTH files - reverts P2, P3, P4, Q1, any applied Q4, and all four re-pins) + accept-with-documentation + deferrals to E100+ WITH the sweep653/654 records: Q3 splicer.armSpin 1.2 -> 0.9 / Q5 splicer.orbitSpeed 0.5 -> 0.35 / P5 burst.everyMult 0.65 -> 0.75 / P6 enemyBullets.speed 9 -> 8 / structural bolt residency. Close as an accept round (E78/E80/E81/E82/E95/E96/E97 pattern).
- REJECTED at open: burst.count 12 -> 8 (S3: slower-dodgeable beats fewer; pinned :27) and ringCount 8 -> 7 (S3) and both maxHp (literal test pins) and Q2 splicer.aimEvery 2.6 -> 3.2 (sweep650 record: traded median 9 -> 8 AND made B56 worse 12 -> 13/30 - a depth lever that costs the median; Q4 is the narrower depth escalation).

## Deferrals (out of E99, queue intact)

- Q3 armSpin / Q5 orbitSpeed / P5 everyMult / P6 enemyBullets.speed / structural bolt residency (enter E100+ if C1 fires).
- belt-rock purpose / INCOMING telegraph / clear-bonus-on-grace (skip - rewards backstop) / campaign + boss-wave pacing / WebGPU default switch (gated) / 2 E85 luma residuals (warden +20.12 / drone +10.41).

## Risks

- R-1 P4 interaction unknown (never swept) - the frozen acceptance (a)-(e) is the arbiter, no pre-derivation (I570).
- R-2 the re-land depends on seed variance (sweep651 B56 8/30 vs sweep647 sibling 4/30 on the identical P2+P3 pair): if (a) still fails WITH P4 added, C1 with the third B56 data point + the full record - that measurement is the E100 decision input either way.
- R-3 seed variance: 30 fresh seeds per sweep; the frozen acceptance bands are tolerance-aware.
- R-4 campaign untouched (grep-proven; structurally unchanged this session) - any campaign-path delta = harness bug, not a lever effect; pins EXPECTED EXACT.
- R-5 guards made safer by Q1/Q4 (gaps widen; concurrency 19.78 < 24); P2/P3/P4 touch no guard - a red there = harness misread.
- R-6 sweep clone line-asserted (I583/I570 lessons): assert base line count + key markers PRE-RUN; record any divergence in rules653.md BEFORE the run, never patch silently.
- R-7 re-pin correctness: a wrong re-pin = red suite at ST-614 - the pre-registered fresh lever-applied npm test (expected 1,261/1,261) catches it before the sweep; C1's atomic restore covers both files.

## Verification evidence

- At open (I655): I654 close 6/6 gate + push 2cd1ce0 verified (git ls-remote this session) + dist re-measured 6,967,985 B / 205 + lever lines re-measured on disk (config.js:281 fireEvery 2.2 / :306 burst.speed 7.0 / :307 offsetSpin 0.45 / :340 spiralEvery 0.6 / :347 spiralEveryMult 0.65) + bossBurst.test.js:24-31/:37-38/:98 re-measured + bossBurstVectors config-read verified (src/core/boss.js:9-17) + campaign isolation inherited from E98.
- Per landing: .evidence/I656/ (lever patch + post-patch re-measure, lever-applied npm test, rules653.md, sweep653 clone + output, gate battery outputs, bookkeeping) and .evidence/I657/ (close gate).
- At close: G99.0 gate set (6/6 + fleet smoke + fresh dist + CLOSE FLOOR E99 WITH MEASUREMENT).

## DoD

- ST-613..ST-615 DONE; E99 CLOSED at G99.0 (I657).
- npm test 1,261/1,261; dist at close vs 7,297,600 B (205 files); CLOSE FLOOR E99 WITH MEASUREMENT.
- 34 GLBs / 201,245 t fleet smoke; vendor 4/4 + decoder; 6/6 harness + fleet smoke at close; AGENTS.md item-4 chain + one-liner (only if levers ship).
- ONE atomic commit per landing, all pushed + verified (git ls-remote == HEAD).
- Hygiene: 0 browser tabs open at rest, ports 4200/5173/5199/4173 free, no leftover background terminals.

## Next owner

- I656 = ST-614: apply P2+P3+P4+Q1 ONE pass (config.js:306 + :281 + :307 + :340) + bossBurst.test.js re-pins (:28 7.0 -> 6.0 / :29 0.45 -> 0.30 / :37-38 7.0 -> 6.0) + fresh lever-applied npm test (expected 1,261/1,261) + sweep653 (30 fresh seeds 65300+i, rules653.md FROZEN PRE-RUN in .evidence/I656/, content-asserted clone of .evidence/I653/sweep651.mjs) + acceptance (a)-(e) OR escalation Q4 (config.js:347 spiralEveryMult 0.65 -> 0.75) + sweep654 (seeds 65400+i) OR C1 (git restore config.js + bossBurst.test.js + accept-with-documentation + Q3/Q5 + P5/P6 + structural bolt residency to E100+ WITH the sweep653/654 records).
