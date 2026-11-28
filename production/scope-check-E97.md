# E97 scope check - Wave-10 Splicer Wall I: spiral gap width (Q1 splicer.spiralEvery 0.6 -> 0.7; pre-registered escalation Q2 splicer.aimEvery 2.6 -> 3.2)

Opened I649 (ST-607..ST-609 pre-registered). E96 CLOSED at I648 (b708710, remote-verified: git ls-remote origin main == b7087107a0ed24fa684c5336e0d170d471cb4e15 == local HEAD). The wall sweep647 (the E96 C1 record) relocated to wave 10 - the SPLICER two-arm spiral - is the target of E97, scoped to exactly ONE registered lever: Q1 splicer.spiralEvery 0.6 -> 0.7 (src/core/config.js:340), the I144 single-cadence-knob class (widens the threadable gap without changing geometry), with a pre-registered escalation Q2 splicer.aimEvery 2.6 -> 3.2 (src/core/config.js:342) applied ONLY if sweep649 (Q1 alone) fails a frozen target. No assets, no new dist files, no campaign/ring/spawn changes.

## Wall record (measured; design/e95-monolith-wave5-wall-iii-research.md S2/S5 + scope-check-E96.md Amendments)

- sweep642 (pre-lever baseline, STILL VALID - zero src change since I643): 30/30 died, median death wave 9, reach wave >= 13 = 1/30, killing-blow tally (primary) {"bullet_unknown":2,"rock_M":5,"rock_S":1,"SPLICER":11,"MONOLITH":10,"rock_L":1}, H primary 21/30, wall ms 5649. SPLICER = 11/30 primary kills; wave-10 cleared = 1/30 (of 14/30 that started wave 10).
- sweep647 (E96 P2+P3 applied then C1-reverted - the "wall moved to wave 10" record, retained in scope-check-E96.md Amendments): 30/30 died, median death wave 10, reach wave >= 13 = 2/30 (64608 wave 14 + 64622 wave 15), killing-blow tally (primary) {"SPLICER":13,"bullet_unknown":5,"MINE":1,"rock_S":5,"gunship":5,"MONOLITH":1}, H primary 14/30, wall ms 5483. The P2+P3 pair decisively broke wave-5/6 (B56 10 -> 4/30, best in band lineage) but the SPLICER became the dominant primary killer (13/30, all wave-10 bolt kills) - the wall moved, it did not shrink.
- Boss alternation: wave 5 Monolith / wave 10 Splicer / wave 15 Monolith Prime (E75) - wave 10 is the SPLICER wave in every run.
- Campaign isolation (grep-verified at open): CONFIG.splicer is read only by src/core/splicer.js (endless boss variant 2) and src/core/game.js (:644 fresh-spawn aimed-timer init, :965 bossAimEvery() with phase2.aimEveryMult). campaignBoss.js is a separate class: its "splicer" is a tint of the Monolith renderer (kind reused) reading its OWN config.campaignBoss.moves.aimEvery/ringEvery tables (config.js:1395/:1408) - zero spiralEvery references anywhere in campaignBoss.js. The Q1/Q2 levers are structurally endless-only - campaign untouched.
- Test-pinning map (verified at open): tests/splicer.test.js pins maxHp===30 (:29) and radius===2.6 (:30) literally, plus boltSpeed<ship.maxSpeed (:36) - none touched by Q1/Q2. spiralEvery/aimEvery are read ONLY via CONFIG.splicer.* (:68/:79/:126 and the guards :158-170) - cfg-driven, adapts safely. The two directional guards are MADE SAFER by the levers, not broken: the I144 balance guard (:156-163: gap1 >= 1.8*obstacle, gap2 >= 1.1*obstacle - raising spiralEvery widens both gaps) and the concurrency-cap guard (:165-171: steady = (arms/spiralEvery + 1/aimEvery)*life < maxConcurrent 24 - raising either value lowers concurrency). e8cBatch.test.js:187-198 behavioral guard (phase-2 60s never exceeds the cap) - the levers reduce concurrency -> stays green. campaignBoss.test.js aimEvery references are the ARCHON's own cb.archon.moves.aimEvery + the campaign moves table - a separate structure, not CONFIG.splicer. Conclusion: Q1+Q2 are SAFE for the 1,261 suite, endless-only.
- Gap math (exact): obstacle = 2*ship.radius(0.9) + 2*enemyBullets.radius(0.22) = 2.24u. Phase-1 gap = boltSpeed(7.0) * spiralEvery: 4.2u = 1.88x obstacle (guard floor 1.8x = 4.03u) -> 4.9u = 2.19x at Q1. Phase-2 gap (x0.65): 2.73u = 1.22x (guard floor 1.1x = 2.46u) -> 3.19u = 1.42x at Q1. Phase-2 steady concurrency: 22.71 -> 19.78 (cap 24).

## Scope Fit

Measured at I649 (on disk, post-I648):
- dist: 6,967,985 B / 205 files (I648 fresh measure, re-verified this round). E97 close target: 7,297,600 B (7,400,000 B ceiling - 102,400 B close-floor) -> envelope 329,615 B (= CLOSE FLOOR E96 measured at G96.0).
- Assets: 34 GLB / 201,245 t - untouched by E97 (no Blender work; the fix is one config number, a second only on escalation).
- The levers are same-length literal swaps in an already-shipped file (config.js:340 '0.6' -> '0.7'; config.js:342 '2.6' -> '3.2') -> file count stays 205, EXPECTED byte-identical dist.
- Feasibility: the code budget (<= 1,000 B worst case, expected actual 0 B) is < 0.2% of the envelope.

## Research (FROZEN at open I649)

- cgs-scope-check + cgs-balance-check applied.
- In-repo S-library (design/e95-monolith-wave5-wall-iii-research.md S1-S12) + the I144 precedent supersede new web research: S2 GMTK (the single-cadence-knob precedent - Halo 3 sniper time-between-shots 0.5 -> 0.7 s: Q1 is exactly this lever class for the spiral channel) + S5 Flukz ('at least one safe path should exist at all times' - the gap-width argument: the phase-1 gap must stay threadable against the 2.24u obstacle) + the I144 in-repo precedent (spiralEvery 0.26 was unthreadable: gap 1.82u < 2.24u obstacle -> 0.6: 4.2u ~ 1.9x, threadable; shipped with the same guard structure now at splicer.test.js:156-171).
- YouTube research was RUN at open (1 search / 3 queries on spiral bullet-hell pattern fairness) and returned generic noise only - no purpose-matched content. The in-repo S-library + I144 precedent supersede (recorded as run, not invented).
- In-repo lineage: I144 (spiralEvery 0.26 -> 0.6 threadable-gap precedent, shipped) -> E82/E95/E96 (Monolith wall attempts; P2+P3 validated at I647, C1-reverted, record retained) -> E97 targets the relocated wave-10 SPLICER wall with the same lever class on the spiral channel.

## Landing plan (PRE-REGISTERED)

- ST-607 (I649) - open + research + scope-check (docs-only) - this commit.
- ST-608 (I650) - the lever: src/core/config.js - Q1 ONE line (spiralEvery 0.6 -> 0.7 at :340), applied as ONE pass; then sweep649 (30 FRESH seeds 64900+i; rules649.md FROZEN PRE-RUN in .evidence/I650/; line-asserted clone of the .evidence/I643/sweep642.mjs harness [17,669 B, 327 lines]; full director from wave 1; I328 kiter verbatim; cap 36,000 ticks @ 1/60; in-process, zero servers/tabs) + frozen acceptance (a) SPLICER wave-10 primary kills <= 7/30 [pre 11/30 sweep642] / (b) wave-10 cleared >= 5/30 [pre 1/30] / (c) median death wave >= 10 [pre 9] / (d) reach wave >= 13 >= 3/30 [pre 1/30] / (e) 6-harness gate EXACT no re-pin. PRE-REGISTERED escalation (NOT a second fiddle - registered at open): if sweep649 fails any of (a)-(d), apply Q2 (aimEvery 2.6 -> 3.2 at :342) as the second registered pass and re-sweep sweep650 (30 FRESH seeds 65000+i, same protocol, rules650.md FROZEN PRE-RUN) evaluating the SAME frozen acceptance (a)-(e). C1 on any remaining failure.
- ST-609 (I651) - G97.0 close gate: clone .evidence/I645/run_close645.cjs -> .evidence/I651/run_close651.cjs (label CLOSEGATE651, OUTDIR .evidence/I651/; every marker string verified against the harness's actual console output - the I632 lesson) + GLB fleet smoke (34/34, 201,245 t WITH MEASUREMENT, console 0/0) + fresh dist re-measure vs 7,297,600 B + CLOSE FLOOR E97 WITH MEASUREMENT + AGENTS.md refresh (item-4 chain + one-liner Splicer lever note + re-pin notes if any) + E97 CLOSED.

## Frozen bounds

IN (per landing, nothing else):
- ST-608 only: src/core/config.js - exactly ONE line (Q1 spiralEvery 0.6 -> 0.7 at :340); a second line (Q2 aimEvery 2.6 -> 3.2 at :342) ONLY if the pre-registered escalation fires.
- ST-609: docs-only (AGENTS.md + bookkeeping).
FROZEN: all 34 GLBs (no Blender), vendor 4 + decoder, PWA surface, campaign (structurally endless-only - grep-proven: campaignBoss.js has no spiralEvery reference and its own moves table), maxHp 30 (splicer.test.js:29 literal pin), radius 2.6 (:30 pin), boltSpeed 7.0 (:36 pin + the gap-math coupling), hpFirstWave 15 / hpStep 8 / hpCap 72, holdRadius 11 / orbitSpeed 0.5 / spin 0.4 / enterTime 1.2 / arms 2 / armSpin 1.2 (spiral geometry), splitCount 2 / splitSize M / score 600, phase2 block (hpFrac 0.5 / orbitSpeedMult 1.4 / armSpinMult 1.5 / spiralEveryMult 0.65 / aimEveryMult 0.7 / spin 1.2), Monolith (boss) block, warden block, spawn mix, wave pacing (the E94 shipped state), audio, camera, input, UI.

## Measurement protocol

1. npm test green (1,261/1,261; unchanged - config value swaps are not unit-tested directly; the directional guards adapt and stay green; the suite must stay 1,261).
2. npm run build clean; dist measured vs 7,297,600 B close target; file count 205.
3. Vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + decoder raw D428E73A000057C6 29,256 B.
4. Gate harness per code landing (I650 ONLY): causal495 3-arm + causal483 EXPECTED EXACT 13,350 (I639 re-pins) / playframe483/491 EXPECTED EXACT A 22/92,435 + P 11/2,076 / B 52/200,808 / pwa491 11/11 / fleet628 34/34 GLB / 201,245 t. The Splicer spawns wave 10, all pins wave <= 2 / MENU, bolts zero-RNG -> EXPECTED EXACT, no re-pin.
5. ONE atomic commit per landing (code + bookkeeping together); push delegated to a fresh subagent (push only, NO Pages [blocked: free runner minutes unavailable], no force, verbatim git ls-remote origin main, agent closed), landing verified via git ls-remote.

## Budget (pre-registered)

- Start (I648 measured): dist 6,967,985 B / 205; assets 34 GLB / 201,245 t (frozen).
- E97 close target: dist <= 7,297,600 B; envelope = 329,615 B (= CLOSE FLOOR E96).
- Code across the epic: <= 1,000 B worst case (one to two same-length literal swaps; expected actual 0 B - esbuild minifies '0.6'/'0.7' and '2.6'/'3.2' to same-length tokens).
- Worst case: 6,967,985 + 1,000 = 6,968,985 B -> margin 328,615 B to the close target.

## Cut ladder (pre-registered)

C1 (frozen): git restore src/core/config.js (reverts Q1 and any applied Q2 - one atomic restore) + accept-with-documentation + deferrals to E98+ WITH the sweep649/650 records (registered candidates: Q3 splicer.armSpin 1.2 -> 0.9 [spiral arm rotation - the geometry twin of the cadence knob] / Q4 phase2.spiralEveryMult 0.65 -> 0.75 [enrage moderation: phase-2 gap 3.19u -> 3.68u at Q1] / Q5 splicer.orbitSpeed 0.5 -> 0.35 [wall-orientation predictability] / structural bolt residency [bolt lifetime / destroyable bolts]). REJECTED at open (recorded, not to be re-derived): boltSpeed 7.0 -> 6.0 (shrinks the phase-1 gap 4.2u -> 3.6u - the I583/E96 P2 lesson + S3 density tension) and maxHp 30 -> 24 (breaks the splicer.test.js:29 literal pin). One lever class, one pass per landing, no intermediate cut; each C1 invocation recorded in this file as an AMENDMENT.

## Deferrals (out of E97, queue intact)

P4 burst.offsetSpin 0.45 -> 0.30 / P5 burst.everyMult 0.65 -> 0.75 / P6 enemyBullets.speed 9 -> 8 (from the E96 C1, WITH the sweep647 record) / belt-rock purpose / INCOMING telegraph / clear-bonus-on-grace (skip - rewards the backstop) / campaign + boss-wave pacing / WebGPU default switch (gated) / 2 E85 luma residuals (warden +20.12 / drone +10.41) / Q3-Q5 + structural bolt residency (only if the E97 C1 fires, per the cut ladder).

## Risks

1. R-1 phase-2 tightness: the phase-2 gap at Q1 is 3.19u = 1.42x obstacle - above the 1.1x guard floor but below the 1.8x comfort band (enrage is hard by design, I144 'tight but fair'). If (c)/(d) fail on enrage-specific deaths, the residual is phase-2 pressure - the escalation Q2 (aimed channel) targets the concurrent aimed-bolt pressure; C1 if both fail.
2. R-2 seed variance: the frozen acceptance (a)-(e) is the arbiter - no pre-derivation (I570).
3. R-3 structural wall: if the wall is the two-arm spiral geometry itself (not its cadence), the cadence-knob class may be insufficient to reach (b) wave-10 cleared >= 5/30 (pre 1/30) - C1 fires and the geometry levers (Q3 armSpin, Q5 orbitSpeed) go to E98+ WITH the sweep649/650 records.
4. R-4 campaign untouched: grep-proven isolation - any campaign-path delta in the harness would be a harness bug, not a lever effect; the causal pins EXPECTED EXACT.
5. R-5 concurrency guards: the levers make BOTH splicer.test.js guards safer (gaps widen; steady concurrency 22.71 -> 19.78 < 24) and the e8cBatch behavioral guard stays green; a red there means a harness misread, not a lever regression.
6. R-6 harness clone: the sweep642 clone is line-asserted (I583 lesson: line counts + markers verified PRE-RUN); any clone divergence is recorded before the run, never patched silently.

## Verification evidence

At open (I649): I648 close gate 6/6 (CLOSEGATE648, zero re-pins) + push b708710 verified on origin main (git ls-remote == local HEAD); dist re-measured 6,967,985 B / 205 this round; lever lines re-measured (src/core/config.js:340 spiralEvery 0.6 / :342 aimEvery 2.6 / :347 spiralEveryMult 0.65 / :348 aimEveryMult 0.7; the campaignBoss moves tables at :1395/:1408 are separate); test-pinning map re-verified (splicer.test.js :29/:30/:36 literal pins untouched; :156-171 directional guards made safer; e8cBatch :187-198 green). Per landing: protocol steps 1-5 produce the evidence trail (.evidence/I650/I651/ + harness outputs + dist measures). At close: the G97.0 gate set (6/6 harness + fleet smoke + fresh dist + CLOSE FLOOR E97 WITH MEASUREMENT + AGENTS.md refresh).

## DoD

- ST-607..ST-609 all DONE (ST-608: Q1 + sweep649, and the escalation Q2 + sweep650 if registered, with measured acceptance (a)-(e), or C1 with the sweep649/650 records); E97 header CLOSED at G97.0.
- npm test 1,261/1,261; npm run build clean; dist measured at close vs 7,297,600 B; CLOSE FLOOR E97 WITH MEASUREMENT recorded.
- 34-GLB fleet unchanged (201,245 t WITH MEASUREMENT at close); vendor 4/4 EXACT + decoder raw pin intact.
- 6/6 harness + fleet smoke at close; causal arms EXACT (re-pin WITH MEASUREMENT only on a documented delta - EXPECTED none); playframe EXACT (same rule); pwa 11/11.
- AGENTS.md item-4 chain + one-liner refreshed WITH MEASUREMENT (only if the levers ship).
- ONE atomic commit per landing + the close-gate commit; every commit pushed (delegated fresh subagent) + verified via git ls-remote.
- Hygiene: 0 tabs, all ports free, no terminals left.

## Next owner

I650 = ST-608: apply Q1 (config.js:340 spiralEvery 0.6 -> 0.7) + sweep649 (30 fresh seeds 64900+i, rules649.md FROZEN PRE-RUN in .evidence/I650/, line-asserted clone of .evidence/I643/sweep642.mjs) + frozen acceptance (a)-(e) OR the pre-registered escalation Q2 (config.js:342 aimEvery 2.6 -> 3.2) + sweep650 (seeds 65000+i) OR C1 (git restore config.js + accept-with-documentation + Q3/Q4/Q5 + structural bolt residency to E98+ WITH the sweep649/650 records).

## Amendments

### C1 AMENDMENT - ST-608 (I650): Q1 + escalation Q2 swept, C1 INVOKED, config.js restored

- Q1 applied ONE pass (src/core/config.js:340 splicer.spiralEvery 0.6 -> 0.7). sweep649 (30 fresh seeds 64900+i, rules649.md FROZEN PRE-RUN, line-asserted clone of the .evidence/I643/sweep642.mjs harness [clone base .evidence/I647/sweep647.mjs 17,898 B / 329 lines, the direct lineage descendant; deviation recorded PRE-RUN in rules649.md sec.2], full director, I328 kiter verbatim, cap 36,000 ticks @ 1/60, in-process, wall ms 5458): 30/30 died, median death wave 9, reach wave >= 13 = 2/30 (64901 wave 13 + 64922 wave 13), killing-blow tally (primary) {"MONOLITH":10,"phantom":1,"SPLICER":6,"bullet_unknown":5,"rock_S":2,"gunship":4,"mine":1,"rock_M":1}, H primary 16/30, wave-10 started 14 / cleared 3, B56 12/30, M56 10/30, M56' 12/30. Acceptance: (a) PASS 6/30 [<= 7/30; pre 11/30] / (b) FAIL 3/30 [>= 5/30; pre 1/30] / (c) FAIL 9 [>= 10; pre 9] / (d) FAIL 2/30 [>= 3/30; pre 1/30] / (e) EXTERNAL. Verdict: (b) + (c) + (d) FAIL -> pre-registered escalation Q2 FIRED.
- Q2 applied as the second registered pass (src/core/config.js:342 splicer.aimEvery 2.6 -> 3.2). sweep650 (30 fresh seeds 65000+i, rules650.md FROZEN PRE-RUN, same protocol, wall ms 4919): 30/30 died, median death wave 8, reach wave >= 13 = 3/30 (65009 wave 13 + 65011 wave 15 + 65018 wave 15), killing-blow tally (primary) {"gunship":4,"SPLICER":5,"MONOLITH":10,"bullet_unknown":6,"rock_S":2,"rock_M":2,"sentry":1}, H primary 15/30, wave-10 started 13 / cleared 3, B56 13/30, M56 8/30, M56' 13/30. Acceptance: (a) PASS 5/30 / (b) FAIL 3/30 / (c) FAIL 8 / (d) PASS 3/30 / (e) EXTERNAL. Verdict: (b) + (c) FAIL -> frozen adjudication (ANY (a)-(d) fail after escalation) -> C1.
- C1 (frozen): git restore src/core/config.js (reverts Q1 + the applied Q2; config.js:340 back to 0.6, :342 back to 2.6; tree byte-identical to I649/I648) + accept-with-documentation.
- GATE650 (external runner .evidence/I650/run_gate650.cjs, line-asserted clone of the .evidence/I647 gate base with the base's UTF-8 BOM stripped at read; 6 markers re-verified PRE-RUN): 6/6 HARNESS PASS (causal495 3-arm CAUSAL495 PASS + causal483 CAUSAL456 PASS EXACT 13,350; playframe483/491 PLAYFRAME456 PASS EXACT A 22/92,435 + P 11/2,076 / B 52/200,808 [cam finite]; pwa491 SUMMARY 11/11 console 0/0; fleet628 GLBSMOKE623 PASS 34/34 GLB / 201,245 t console 0/0); port-free at every step; zero re-pins.
- Recorded fixes (I570 pattern): (1) the first sweep649 draft called H("SPLICER") - H() takes a classifier FUNCTION (param named `primary`), so it crashed pre-simulation, no result produced; fixed the acceptance (a) line to the frozen primary-tally definition tPrimary["SPLICER"] || 0 BEFORE the recorded run (rules unchanged, no re-derivation). (2) buildgate650.cjs failed its L0 header assert because the .evidence/I647 gate base carries a UTF-8 BOM at byte 0 - fixed by stripping it (charCodeAt(0) === 0xFEFF) at read before split.
- Structural finding (carry to E98+): the splicer cadence-knob class improved the wave-10 wall (SPLICER primary kills 11 -> 5, reach-13 1 -> 3, wave-10 cleared 1 -> 3) but (b) wave-10 cleared >= 5/30 and (c) median >= 10 are unreachable with splicer-only levers while the wave-5/6 Monolith wall stays in-tree (B56 12-13/30; E96's P2+P3 Monolith fix was C1-reverted at I647 and its sweep647 record retained). The median is capped by wave-5 deaths before runs reach wave 10. E98+ candidates: Q3 splicer.armSpin 1.2 -> 0.9 / Q4 phase2.spiralEveryMult 0.65 -> 0.75 / Q5 splicer.orbitSpeed 0.5 -> 0.35 / structural bolt residency + re-landing E96's P2+P3 (Monolith) concurrently WITH the sweep647 + sweep649/650 records - the wall moves both directions, it does not shrink.
- Landing: byte-identical dist 6,967,985 B / 205 (zero src change at commit); npm test 1,261/1,261; vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + decoder D428E73A000057C6 29,256 B.
