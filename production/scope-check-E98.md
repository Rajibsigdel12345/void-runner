# E98 scope check - Dual Wall Concurrent Landing: Monolith P2+P3 (wave-5/6) + Splicer Q1 (wave-10) in ONE pass (pre-registered escalation Q2 splicer.aimEvery 2.6 -> 3.2)

Opened I652 (ST-610..ST-612 pre-registered). E97 CLOSED at I651 (378039a, remote-verified this session: git ls-remote origin main == 378039a825577efbe83bcc831a1857b084e29132 == local HEAD). The structural finding carried from the E96 + E97 C1 records: the wall moves both directions, it does not shrink - P2+P3 (Monolith) alone broke wave-5/6 decisively (sweep647: B56 10 -> 4/30, best in lineage) but left wave-10 SPLICER the dominant primary killer (13/30); Q1 (Splicer) alone broke wave-10 (sweep649: SPLICER 11 -> 6/30) but left wave-5/6 (B56 12/30) capping the median at 9. E98 lands the two validated lever sets CONCURRENTLY in ONE pass - the top E98 candidate registered by both C1 records: P2 burst.speed 7.0 -> 6.0 (src/core/config.js:306) + P3 fireEvery 2.2 -> 2.6 (src/core/config.js:281) + Q1 splicer.spiralEvery 0.6 -> 0.7 (src/core/config.js:340) - with a pre-registered escalation Q2 splicer.aimEvery 2.6 -> 3.2 (src/core/config.js:342) applied ONLY if the concurrent sweep fails a depth target (c) median or (d) reach-13. No assets, no new dist files, no campaign/ring/spawn changes.

## Wall record (measured; 4-sweep table + tallies; lineage I144 -> E77/E81/E82 -> E95 -> E96 -> E97)

- sweep642 (I643, baseline, no levers): median 9 / reach13 1/30 / SPLICER primary 11/30 / B56 10/30 / M56' 10/30 / w10 cleared 1/30 (of 14 started) / H primary 21/30 / wall ms 5649. Primary tallies: {"bullet_unknown":2,"rock_M":5,"rock_S":1,"SPLICER":11,"MONOLITH":10,"rock_L":1}. Interpretation: both walls are live in the baseline - wave-5/6 MONOLITH and wave-10 SPLICER are the top two primary killers.
- sweep647 (I647, P2+P3 [E96 C1 record]): median 10 / reach13 2/30 (64608 w14, 64622 w15) / SPLICER primary 13/30 / B56 4/30 / M56' 3/30 / w10 cleared 5/30 / H primary 14/30 / wall ms 5483. Primary tallies: {"SPLICER":13,"bullet_unknown":5,"MINE":1,"rock_S":5,"gunship":5,"MONOLITH":1}. Interpretation: P2+P3 broke wave-5/6 decisively (B56 10 -> 4/30, best in lineage) but the wall MOVED to wave-10 SPLICER, which became the dominant primary killer (13/30).
- sweep649 (I650, Q1 [E97 C1 record]): median 9 / reach13 2/30 (64901 w13, 64922 w13) / SPLICER primary 6/30 / B56 12/30 / M56' 12/30 / w10 cleared 3/30 (14 started) / H primary 16/30 / wall ms 5458. Primary tallies: {"MONOLITH":10,"phantom":1,"SPLICER":6,"bullet_unknown":5,"rock_S":2,"gunship":4,"mine":1,"rock_M":1}. Interpretation: Q1 broke wave-10 (SPLICER 11 -> 6/30) but wave-5/6 (B56 12/30) returned and capped the median at 9.
- sweep650 (I650, Q1+Q2 [E97 C1 record]): median 8 / reach13 3/30 (65009 w13, 65011 w15, 65018 w15) / SPLICER primary 5/30 / B56 13/30 / M56' 13/30 / w10 cleared 3/30 (13 started) / H primary 15/30 / wall ms 4919. Primary tallies: {"gunship":4,"SPLICER":5,"MONOLITH":10,"bullet_unknown":6,"rock_S":2,"rock_M":2,"sentry":1}. Interpretation: Q2 left SPLICER at 5/30 but made wave-5/6 WORSE (B56 12 -> 13/30) and traded the median 9 -> 8 for reach13 - Q2 is a depth lever, not a wall lever.
- Conjunction hypothesis (E98 thesis): in the measured band where BOTH walls are scored on the same frozen tally (sweep642/647/649/650), no configuration has ever achieved B56 <= 7/30 AND SPLICER <= 7/30 simultaneously. Every single-lever sweep broke one wall and the other moved to the other wave. P2+P3+Q1 is the first configuration where BOTH walls are softened in the same run - the E98 test.
- Boss alternation: wave 5 Monolith / wave 10 Splicer / wave 15 Monolith (bossSpawnCount even = Monolith, odd = Splicer) - one run crosses BOTH walls; a run killed on wave 10 has already survived wave 5/6.
- Campaign isolation (grep-verified this session): src/core/campaignBoss.js has ZERO reads of cfg.boss / fireEvery / burst; the campaign boss is spawned only at game.js:852 (new CampaignBoss); game.js:622 early-returns spawnBossForWave for campaign, so the :636 Monolith Prime branch (reads cfg.stages.monolithPrime, config.js:1272; spreads ...b.burst overriding only every) is unreachable legacy ST-419 code. The P2/P3 levers are structurally endless-only.
- Test-pinning map (re-verified this session): boss.test.js pins maxHp 64 / radius 3.4 (untouched by P2/P3); enemyBullets.test.js:36 CONFIG.boss.fireEvery >= 1.5 PASS at 2.6, :43 data-driven step loop; burst.speed is NOT literally pinned anywhere (E96 finding); splicer.test.js :29 maxHp 30 / :30 radius 2.6 / :36 boltSpeed literals untouched by Q1; :156-163 I144 balance guards (gap1 = boltSpeed*spiralEvery >= 1.8*obstacle; gap2 = boltSpeed*spiralEvery*phase2.spiralEveryMult >= 1.1*obstacle) - Q1 WIDENS both gaps (4.9u vs floor 4.03u; 3.19u vs 2.46u); :165-171 concurrency guard (steady = (arms/spiralEvery + 1/aimEvery)*life < maxConcurrent 24) - Q1 LOWERS it (22.71 -> 19.78); e8cBatch.test.js:328-345 data-driven (step loops sized from CONFIG); campaignBoss.test.js aimEvery refs are ARCHON's own tables (separate system). Suite 1,261 SAFE.
- Pressure math (obstacle = 2*0.9 + 2*0.22 = 2.24u): P2 - burst radial bullet 7.0 -> 6.0 u/s; the telegraph ring (0.8 s window, radius 10 u) gives reaction 10/7.0 = 1.43 s -> 10/6.0 = 1.67 s (+17%). P3 - aimed bolt cadence 2.2 -> 2.6 s (-18% cadence). Q1 - spiral bolt gap phase-1 4.2u -> 4.9u = 2.19x obstacle (I144 floor 1.8x); phase-2 2.73u -> 3.19u = 1.42x (floor 1.1x); steady concurrency 22.71 -> 19.78 < 24 cap.

## Scope Fit

- dist 6,967,985 B / 205 files (I651 close, re-measured on disk this session). Close target 7,297,600 B. Envelope 329,615 B.
- Assets: 34 GLBs / 201,245 t untouched (fleet frozen; no Blender in E98).
- Code: three same-length numeric literal swaps at ST-611 ('2.2' -> '2.6' at :281, '7.0' -> '6.0' at :306, '0.6' -> '0.7' at :340; a fourth '2.6' -> '3.2' at :342 only if the pre-registered escalation fires) - esbuild minifies them to same-length tokens; EXPECTED byte-identical dist (actual delta expected 0 B). File count 205.
- Code budget <= 1,000 B worst case, expected 0 B.

## Research (FROZEN at open I652)

- cgs-scope-check + cgs-balance-check applied (scope fit, measurement protocol, cut ladder, pre-registered escalation - all frozen here).
- YouTube run recorded at open (1 search / 3 queries: "Hades roguelite difficulty pacing multiple hazards at once" / "bullet hell shmup bullet density fairness pacing design" / "arcade shooter difficulty wall two threats simultaneous design") - 20 results, NO purpose-matched content (playthroughs, roguelike roundups, one generic "3 pillars" video). The in-repo S-library + the four sweep records supersede; not invented.
- S-library mapping (design/e95-monolith-wave5-wall-iii-research.md S1-S12): S2 single-cadence-knob class [P3 fireEvery, Q1 spiralEvery] / S3 density tension - slower-dodgeable beats fewer [P2 speed] / S5 Flukz safe-path design [Q1 gap width].
- Lineage: I144 (balance guards) -> E77/E81/E82 (accept-round pattern, frozen-lever precedent) -> E95 (P1 sweep643 FAILED, C1) -> E96 (P2+P3 validated sweep647, C1) -> E97 (Q1 validated sweep649, Q2 measured sweep650, C1) -> E98 (concurrent landing).

## Landing plan (PRE-REGISTERED)

- ST-610 (I652) - open + scope FROZEN, docs-only (this commit): scope-check-E98.md + 7-file bookkeeping.
- ST-611 (I653) - lever pass, ONE pass, 3 lines in src/core/config.js: P2 :306 speed 7.0 -> 6.0 + P3 :281 fireEvery 2.2 -> 2.6 + Q1 :340 spiralEvery 0.6 -> 0.7 (comment text stays; occurrence==1 line-asserted patch .cjs; re-measure the 4 lever lines after). Then sweep651: 30 FRESH seeds 65100+i, rules651.md FROZEN PRE-RUN in .evidence/I653/, line-asserted clone of .evidence/I650/sweep650.mjs (18,176 B) [full director from wave 1, I328 kiter verbatim, cap 36,000 ticks @ 1/60, in-process, zero servers/tabs]. Acceptance (a) B56 <= 7/30 [sweep647 4/30] / (b) SPLICER wave-10 primary <= 7/30 [sweep649 6/30] / (c) median death wave >= 10 [sweep647 10] / (d) reach wave >= 13 >= 3/30 [sweep650 3/30] / (e) 6-harness gate EXACT no re-pin (levers act from wave 5 on; all pins wave <= 2 / MENU -> EXPECTED EXACT; re-pin WITH MEASUREMENT only on a documented delta).
- Escalation (pre-registered, NOT a second fiddle): ONLY on (c) median OR (d) reach-13 failure (an (a) or (b) wall-specific failure goes straight to C1 - Q2 is registered for depth, not walls; sweep650: Q2 left SPLICER 5/30 and made B56 worse 12 -> 13/30): apply Q2 :342 aimEvery 2.6 -> 3.2 + sweep652 (30 fresh seeds 65200+i, rules652.md FROZEN PRE-RUN in .evidence/I653/) with the SAME acceptance (a)-(e).
- ST-612 (I654) - G98.0 close gate: clone .evidence/I645/run_close645.cjs -> .evidence/I654/run_close654.cjs (label CLOSEGATE654, OUTDIR .evidence/I654/; every marker string re-verified against actual console output PRE-RUN - the I632 lesson) + fleet smoke 34/34 GLB / 201,245 t + fresh dist vs 7,297,600 B + CLOSE FLOOR E98 WITH MEASUREMENT + AGENTS.md refresh (item-4 chain + item-6 + one-liner only if levers shipped).

## Frozen bounds

- IN: ST-611 exactly 3 lines in src/core/config.js (P2 :306, P3 :281, Q1 :340) + a 4th line (Q2 :342) only if the pre-registered escalation fires. ST-610/ST-612 docs-only.
- FROZEN: 34 GLBs (201,245 t) / vendor 4 + meshopt decoder / PWA / campaign (grep-proven isolation) / boss maxHp 64 + splicer maxHp 30 (test-pinned literals) / radius 3.4 + 2.6 (test-pinned) / burst.count 12 / burst.offsetSpin 0.45 [P4 deferral] / burst.every 4.0 / burst.everyMult 0.65 [P5 deferral] / splicer boltSpeed 7.0 / hp scale both blocks / spiral geometry (holdRadius 11 / orbitSpeed 0.5 [Q5] / spin 0.4 / enterTime 1.2 / arms 2 / armSpin 1.2 [Q3]) / splitCount 2 / splitSize M / score 600 / phase2 blocks both / warden / spawn mix / E94 pacing / audio / camera / input / UI.

## Measurement protocol

1. npm test 1,261/1,261 GREEN.
2. npm run build clean; fresh dist vs 7,297,600 B; 205 files; EXPECTED byte-identical (0 B) at ST-611.
3. Vendor pins 4/4 EXACT (dist-minified sha256 first-16, r187): three.module.js A65DE049A7F38B40 + three.core.js 7AB0784CD2532367 + three.webgpu.js F549248412C62B9A + three.tsl.js 7FF9ACF50F006017; decoder D428E73A000057C6 29,256 B at dist/vendor/jsm/libs/meshopt_decoder.module.js.
4. Gate battery per code landing (I653 ONLY, servers briefly on :4200/:5173/:5199, ports free before AND after): causal495 3-arm (webgl + default EXACT seed-9876; webgpu report-only) + causal483 EXPECTED EXACT 13,350 (I639 re-pins) / playframe483 + playframe491 EXPECTED EXACT A 22/92,435 + P 11/2,076 / B 52/200,808 / pwa491 11/11 / fleet628 34/34 GLB / 201,245 t.
5. ONE atomic commit per landing; push delegated to a fresh subagent (push only, NO Pages [blocked: free runner minutes unavailable], no force, verbatim git ls-remote origin main, agent closed after).

## Budget (pre-registered)

- Start: 6,967,985 B / 205 (I651). Close target: 7,297,600 B. Envelope: 329,615 B.
- Code: <= 1,000 B worst case, expected 0 B (same-length literal swaps). Worst case 6,968,985 B -> margin 328,615 B.

## Cut ladder (pre-registered)

- C1 (frozen): git restore src/core/config.js (reverts P2, P3, Q1 and any applied Q2 - one atomic restore) + accept-with-documentation + deferrals to E99+ WITH the sweep651/652 records: Q3 splicer.armSpin 1.2 -> 0.9 / Q4 splicer.phase2.spiralEveryMult 0.65 -> 0.75 [phase-2 gap 3.19u -> 3.68u at Q1] / Q5 splicer.orbitSpeed 0.5 -> 0.35 / P4 burst.offsetSpin 0.45 -> 0.30 / P5 burst.everyMult 0.65 -> 0.75 / P6 enemyBullets.speed 9 -> 8 / structural bolt residency. Close as an accept round (E78/E80/E81/E82/E95/E96 pattern).
- REJECTED at open: burst.count 12 -> 8 (S3: slower-dodgeable beats fewer) and both maxHp (literal test pins).

## Deferrals (out of E98, queue intact)

- Q3 armSpin / Q4 phase2.spiralEveryMult / Q5 orbitSpeed / P4 offsetSpin / P5 everyMult / P6 enemyBullets.speed / structural bolt residency (enter E99+ if C1 fires).
- belt-rock purpose / INCOMING telegraph / clear-bonus-on-grace (skip - rewards backstop) / campaign + boss-wave pacing / WebGPU default switch (gated) / 2 E85 luma residuals (warden +20.12 / drone +10.41).

## Risks

- R-1 interaction unknown: P2+P3+Q1 never swept together - the frozen acceptance (a)-(e) is the arbiter, no pre-derivation (I570). If the wave-5 TTK balance shifts, the median could exceed 10 even if both walls register - (c) passes and the record shows why.
- R-2 depth regression: sweep650 shows Q2 trades the median 9 -> 8 for reach13; the primary landing carries NO Q2.
- R-3 seed variance: 30 fresh seeds per sweep; the frozen acceptance bands are tolerance-aware.
- R-4 campaign untouched (grep-proven this session) - any campaign-path delta = harness bug, not a lever effect; pins EXPECTED EXACT.
- R-5 guards made safer by Q1 (gaps widen; concurrency 19.78 < 24); P2/P3 touch no guard - a red there = harness misread.
- R-6 sweep clone line-asserted (I583 lesson): assert base line count + key markers PRE-RUN; record any divergence in rules651.md BEFORE the run, never patch silently.

## Verification evidence

- At open (I652): I651 close 6/6 gate + push 378039a verified (git ls-remote) + dist re-measured 6,967,985 B / 205 + lever lines re-measured on disk (config.js:281 fireEvery 2.2 / :306 burst.speed 7.0 / :340 spiralEvery 0.6 / :342 aimEvery 2.6) + campaign grep + test-pinning map re-verified.
- Per landing: .evidence/I653/ (rules651.md, sweep651 clone + output, gate battery outputs, bookkeeping) and .evidence/I654/ (close gate).
- At close: G98.0 gate set (6/6 + fleet smoke + fresh dist + CLOSE FLOOR E98 WITH MEASUREMENT).

## DoD

- ST-610..ST-612 DONE; E98 CLOSED at G98.0 (I654).
- npm test 1,261/1,261; dist at close vs 7,297,600 B (205 files); CLOSE FLOOR E98 WITH MEASUREMENT.
- 34 GLBs / 201,245 t fleet smoke; vendor 4/4 + decoder; 6/6 harness + fleet smoke at close; AGENTS.md item-4 chain + one-liner (only if levers ship).
- ONE atomic commit per landing, all pushed + verified (git ls-remote == HEAD).
- Hygiene: 0 browser tabs open at rest, ports 4200/5173/5199/4173 free, no leftover background terminals.

## Next owner

- I653 = ST-611: apply P2+P3+Q1 ONE pass (config.js:306 + :281 + :340, three lines, one commit) + sweep651 (30 fresh seeds 65100+i, rules651.md FROZEN PRE-RUN in .evidence/I653/, line-asserted clone of .evidence/I650/sweep650.mjs) + acceptance (a)-(e) OR escalation Q2 (config.js:342) + sweep652 (seeds 65200+i) OR C1 (git restore config.js + accept-with-documentation + Q3/Q4/Q5 + P4/P5/P6 + structural bolt residency to E99+ WITH the sweep651/652 records).

## Amendments

### C1 AMENDMENT - ST-611 (I653): P2+P3+Q1 swept concurrently, C1 INVOKED, config.js restored

- The FROZEN E98 set was applied in ONE pass (occ===1 full-line patch of src/core/config.js, all 4 lever lines re-measured post-patch): P2 boss.burst.speed 7.0 -> 6.0 (:306) + P3 boss.fireEvery 2.2 -> 2.6 (:281) + Q1 splicer.spiralEvery 0.6 -> 0.7 (:340).
- sweep651 (30 fresh seeds 65100+i, rules651.md FROZEN PRE-RUN, content-asserted clone of the .evidence/I650/sweep650.mjs harness [18,176 B / 329 lines; kiter/attribution/event-capture verbatim; every untouched line byte-identical; the E98 acceptance block swapped in with (e) external], full director, I328 kiter verbatim, cap 36,000 ticks @ 1/60, in-process, wall ms 5302): 30/30 died, median death wave 10, reach wave >= 13 = 2/30 (65110 wave 13 + 65113 wave 15), killing-blow tally (primary) {"SPLICER":7,"rock_S":4,"bullet_unknown":7,"MONOLITH":3,"gunship":5,"rock_M":2,"sentry":1,"mine":1}, H primary 10/30, wave-10 started 17 / cleared 3, B56 8/30, M56 3/30, M56' 7/30, w10cleared 3/30. Acceptance: (a) FAIL 8/30 [<= 7/30; sweep642 10/30; sweep647 (P2+P3) 4/30; sweep649 (Q1) 12/30; sweep650 13/30] / (b) PASS 7/30 [<= 7/30; sweep642 11/30] / (c) PASS 10 [>= 10; sweep642 9; sweep647 10; sweep649 9; sweep650 8] / (d) FAIL 2/30 [>= 3/30; sweep642 1/30; sweep649 2/30; sweep650 3/30] / (e) EXTERNAL. Verdict: (a) is a wall-specific failure (B56 wave-5/6 band) -> frozen adjudication (rules651.md sec.5: an (a) or (b) wall failure goes straight to C1 - Q2 is registered for depth, not walls) -> C1. No escalation run.
- C1 (frozen): git restore src/core/config.js (reverts ALL three levers, one atomic restore: :306 back to 7.0, :281 back to 2.2, :340 back to 0.6; tree byte-identical to I652) + accept-with-documentation + deferrals to E99+ WITH the sweep651 record: Q3 splicer.armSpin 1.2 -> 0.9 / Q4 phase2.spiralEveryMult 0.65 -> 0.75 / Q5 splicer.orbitSpeed 0.5 -> 0.35 / P4 burst.offsetSpin 0.45 -> 0.30 / P5 burst.everyMult 0.65 -> 0.75 / P6 enemyBullets.speed 9 -> 8 / structural bolt residency.
- GATE651 (external runner .evidence/I653/run_gate651.cjs, content-asserted clone of the .evidence/I650 gate base [4,143 B WITH UTF-8 BOM, stripped at read]; 6 markers re-verified PRE-RUN): 6/6 HARNESS PASS (causal495 3-arm CAUSAL495 PASS + causal483 CAUSAL456 PASS EXACT 13,350; playframe483/491 PLAYFRAME456 PASS EXACT A 22/92,435 + P 11/2,076 / B 52/200,808 [cam finite]; pwa491 SUMMARY 11/11 console 0/0; fleet628 GLBSMOKE623 PASS 34/34 GLB / 201,245 t console 0/0); port-free at every step; zero re-pins.
- Recorded fixes (I570 pattern): (1) buildclone651.cjs line-4 assert failed - the base sweep650.mjs line 4 reads "via the sweep647.mjs base" (the protocol lineage base), not "sweep650.mjs base"; fixed the EXPECTED string to the actual file content pre-build (no rule re-derivation). (2) buildclone651.cjs post-write check expected 3 "65100" occurrences; actual is 4 (the line-1 header also carries "seeds 65100+i"); fixed the assertion to 4.
- Structural finding (carry to E99+): the concurrent landing moved the Monolith wall down (B56 10/30 pre -> 8/30, MONOLITH primary 10 -> 3, median 9 -> 10) and the Splicer wall to its own threshold (SPLICER 11/30 pre -> 7/30, wave-10 cleared 1/30 pre -> 3/30), but neither wall cleared its frozen bar simultaneously: B56 8 > 7 and reach13 2 < 3. The dual-wall concurrent-cadence hypothesis is NOT supported by this measurement - the walls move independently. E99+ candidates: re-attack the Monolith side from the P4/P5 burst-geometry levers (shape, not cadence) + the Splicer side from Q3-Q5 + structural bolt residency (bullet_unknown is 7/30 of all kills - attribution + residency is the structural item).
- Landing: byte-identical dist 6,967,985 B / 205 (zero src change at commit); npm test 1,261/1,261; vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + decoder D428E73A000057C6 29,256 B.
