# E96 scope check - wave-5 Monolith Wall IV: aimed-pressure / bolt residency (P2 burst.speed 7.0 -> 6.0 + P3 fireEvery 2.2 -> 2.6)

Opened I646 (ST-604..ST-606 pre-registered). E95 CLOSED at I645 (0943949, remote-verified: git ls-remote origin main == 094394957c243f920627221cecdbfeea8dc838c4 == local HEAD). The wave-5 Monolith wall - the longest-outstanding measured gameplay wall (lineage E77 -> E81 -> E82 -> E95) - is the target of E96, scoped to exactly ONE registered lever pair: P2 boss.burst.speed 7.0 -> 6.0 (src/core/config.js:306) + P3 boss.fireEvery 2.2 -> 2.6 (src/core/config.js:281), the aimed-pressure/bolt-residency pair deferred together by the E95 C1 amendment WITH the sweep643 measurement record. No assets, no new dist files, no campaign/ring/count changes.

## Wall record (measured; design/e95-monolith-wave5-wall-iii-research.md sec. 1 + scope-check-E95.md Amendments)

- B56 band (deaths wave in {5,6}) lineage: sweep567 10 / 569 7 / 571 9 / 573 12 / 577 11 / 581 12 / 582 (post-P0 cadence) 9 / 642 10 / 643 (post-P1 corridors) 13 of 30.
- E95 (I642-I645): P1 (burst.count 12 -> 9) applied per the frozen sweep642 adjudication (BRANCH A*), then sweep643 FAILED frozen acceptance (a)-(d) WITH MEASUREMENT (B56 13/30 / M56' 13/30 / median death wave 8 / reach13 0/30) -> C1 INVOKED (lever reverted, count 12). Verdict (recorded as-is, no re-derivation): MONOLITH primary kills 10 -> 6/30 (the corridor-widener DID reduce direct burst kills) but bullet_unknown 2 -> 9/30 and the band composition got WORSE (10 -> 13/30, median 9 -> 8) - the residual defect is aimed-pressure/bolt residency, not the radial corridors (risk R-1 of E95 named this exact failure mode).
- Pre-lever baseline for E96 = sweep642 numbers (STILL VALID - zero src change since I643; the committed tree is byte-identical to the tree sweep642 measured): B56 10/30, M56' 10/30, M56 9/30 (R-6 comparability), median death wave 9, reach wave >= 13 = 1/30, killing-blow tally (primary) {"bullet_unknown":2,"rock_M":5,"rock_S":1,"SPLICER":11,"MONOLITH":10,"rock_L":1}, H primary 21/30, wall ms 5649. NO new pre-lever sweep required (unlike E95's I643).
- E82 P2 record (I583, purpose-scoped): P2 was REJECTED at E82 for the corridor-widening/density purpose - "slower bolts stay in the field of view LONGER -> HIGHER on-screen spacial density (S3); it shifts the reaction character (reflex -> positioning) without reducing the density the player has to cross." E96 re-tests P2 for the DIFFERENT purpose named by sweep643 (residency / per-bolt reaction time), not corridor widening - the purpose change is recorded here so the I583 rejection is not re-derived and not contradicted.

## Scope Fit

Measured at I646 (on disk, post-I645):
- dist: 6,967,985 B / 205 files (I645 fresh measure, re-verified this round). E96 close target: 7,297,600 B (7,400,000 B ceiling - 102,400 B close-floor) -> envelope 329,615 B (= CLOSE FLOOR E95 measured at G95.0).
- Assets: 34 GLB / 201,245 t - untouched by E96 (no Blender work; the fix is two config numbers).
- The levers are same-length literal swaps in an already-shipped file (config.js:306 '7.0' -> '6.0'; config.js:281 '2.2' -> '2.6') -> file count stays 205, EXPECTED byte-identical dist.
- Feasibility: the code budget (<= 1,000 B worst case, expected actual 0 B) is < 0.02% of the envelope.

## Research (FROZEN at open I646)

- cgs-scope-check + cgs-balance-check applied. The lever pair is pre-registered in the E95 C1 amendment (scope-check-E95.md Amendments, WITH the sweep643 measurement record) and SELECTED as the E96 target as the top candidate of the deferral queue (active.md I645 line: "NEXT I646 = open the next epic (top candidate: E96 running P2/P3 per the sweep643 record)").
- Sources carried verbatim from design/e95-monolith-wave5-wall-iii-research.md (S1-S12; S1-S8 carried from the E82 doc). Purpose-matched extracts: S2 GMTK (the single-cadence-knob precedent - Halo 3 sniper time-between-shots 0.5 -> 0.7 s: P3 is exactly this class of lever for the aimed channel) + S5 Flukz ('Slow bullets are readable and dodgeable with room to spare... at least one safe path should exist at all times' - the P2 residency/reaction read) + S3 Sparen Part 3/3b (slower bolts stay in the field LONGER -> higher spacial density - the TENSION, recorded as R-1) + S7 Gungeon ('stagger attacks so bullets have a chance to EXIT the screen' - the post-kill-residual tension, recorded as R-5) + S4 Flukz (single-knob, geometry-identical parameter change = the frozen E70 lever class; E96 ships both levers as ONE registered pair per the E95 C1 record - ONE pass).
- In-repo lineage: I565/E77 ringEvery 2.5 (shipped) -> E81 P0 registered -> E82 P0 tested + C1 (wall PARTIALLY broken: B56 12 -> 9/30, M56' stuck 9/30) -> E83..E94 left the boss path untouched -> E95 P1 tested + C1 (residual = aimed-pressure/bolt residency) -> E96 runs the registered P2+P3 pair.

## Landing plan (PRE-REGISTERED)

- ST-604 (I646) - open + research + scope-check (docs-only) - this commit.
- ST-605 (I647) - the levers: src/core/config.js - TWO lines (burst.speed 7.0 -> 6.0 at :306; fireEvery 2.2 -> 2.6 at :281), applied as ONE pass per the E95 C1 registration; then sweep647 (30 FRESH seeds 64600+i; rules647.md FROZEN PRE-RUN in .evidence/I647/; line-asserted clone of the .evidence/I644 sweep643 harness - the I583 clone-lesson: assert line counts + record any divergence BEFORE the run; full director from wave 1; I328 kiter verbatim; cap 36000 ticks @ 1/60; in-process, zero servers/tabs) + frozen acceptance (a) B56 <= 9/30 / (b) M56' <= 7/30 / (c) median death wave >= 9 / (d) reach wave >= 13 >= 3/30 / (e) 6/6 harness gate EXACT no re-pin. C1 (git restore src/core/config.js - reverts BOTH levers - + accept-with-documentation + deferrals to E97+ WITH the sweep647 record) on ANY (a)-(d) failure. ONE pass, no second fiddle.
- ST-606 (I648) - G96.0 close gate: clone .evidence/I645/run_close645.cjs -> .evidence/I648/run_close648.cjs (label CLOSEGATE648, OUTDIR .evidence/I648/; every marker string verified against the harness's actual console output - the I632 lesson) + GLB fleet smoke (34/34, 201,245 t WITH MEASUREMENT, console 0/0) + fresh dist re-measure vs 7,297,600 B + CLOSE FLOOR E96 WITH MEASUREMENT + AGENTS.md refresh (item-4 chain + one-liner boss lever note + re-pin notes if any) + E96 CLOSED.

## Frozen bounds

IN (per landing, nothing else):
- ST-605 only: src/core/config.js - exactly TWO lines (burst.speed 7.0 -> 6.0 at :306; fireEvery 2.2 -> 2.6 at :281).
- ST-606: docs-only (AGENTS.md + bookkeeping).
FROZEN: all 34 GLBs (no Blender), vendor 4 + decoder, PWA surface, campaign (structurally endless-only - the cfg.boss.burst / cfg.boss.fireEvery path is never read on the campaign path), ring schedule (ringEvery 2.5 / ringCount 8), burst.count 12 (E95 C1 restored), burst.every 4.0, offsetSpin 0.45 (P4 candidate), everyMult 0.65 (P5 candidate), phase2 block, aimed-bolt speed 9 (enemyBullets, config.js:771; P6 candidate), splicer block, warden block, spawn mix, wave pacing (the E94 shipped state), audio, camera, input, UI.

## Measurement protocol

1. npm test green (1,261/1,261; unchanged - config value swaps are not unit-tested directly; the suite must stay 1,261).
2. npm run build clean; dist measured vs 7,297,600 B close target; file count 205.
3. Vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + decoder raw D428E73A000057C6 29,256 B.
4. Gate harness per code landing (I647 ONLY): causal495 3-arm + causal483 EXPECTED EXACT 13,350 (I639 re-pins) / playframe483/491 EXPECTED EXACT A 22/92,435 + P 11/2,076 / B 52/200,808 / pwa491 11/11 / fleet628 34/34 GLB / 201,245 t. Monolith spawns wave 5, all pins wave <= 2 / MENU, bolts zero-RNG -> EXPECTED EXACT, no re-pin.
5. ONE atomic commit per landing (code + bookkeeping together); push delegated to a fresh subagent (push only, NO Pages [blocked: free runner minutes unavailable], no force, verbatim git ls-remote origin main, agent closed), landing verified via git ls-remote.

## Budget (pre-registered)

- Start (I645 measured): dist 6,967,985 B / 205; assets 34 GLB / 201,245 t (frozen).
- E96 close target: dist <= 7,297,600 B; envelope = 329,615 B (= CLOSE FLOOR E95).
- Code across the epic: <= 1,000 B worst case (two same-length literal swaps; expected actual 0 B - esbuild minifies '7.0'/'6.0' and '2.2'/'2.6' to same-length tokens).
- Worst case: 6,967,985 + 1,000 = 6,968,985 B -> margin 328,615 B to the close target.

## Cut ladder (pre-registered)

C1 (frozen): git restore src/core/config.js (reverts BOTH levers - one atomic restore) + accept-with-documentation + deferrals to E97+ (registered candidates: P4 burst.offsetSpin 0.45 -> 0.30 [spiral drift per volley] / P5 burst.everyMult 0.65 -> 0.75 [enrage cadence] / P6 enemyBullets.speed 9 -> 8 [aimed-bolt speed] / structural aimed-pressure work [aim lead or bolt lifetime]) + close as accept round (E78/E80/E81/E82/E95 pattern). One pair, two lines, one pass - no intermediate cut. Each C1 invocation recorded in this file as an AMENDMENT.

## Deferrals (out of E96, queue intact)

Belt-rock purpose / INCOMING telegraph / clear-bonus-on-grace (skip - rewards the backstop) / campaign + boss-wave pacing / WebGPU default switch (gated) / 2 E85 luma residuals (warden +20.12 / drone +10.41) / E97+ candidates P4-P6 (only if P2+P3 fails, per the C1 record).

## Risks

1. R-1 P2 tension (S3): the I583/E82 rejection recorded slower bolts stay in view LONGER -> higher on-screen spacial density. E96 re-tests P2 for the residency/reaction-time purpose named by sweep643 (S5 'slow bullets are readable and dodgeable with room to spare'), not corridor widening - the purpose change is recorded at open. If (b) still fails, the residual is structural aimed-pressure - C1 executes, P4-P6 to E97+; never a second fiddle inside E96.
2. R-2 seed variance: the frozen acceptance (a)-(e) is the arbiter - no pre-derivation (I570).
3. R-3 late-wave: all Monolith waves (w10/15/20/25) get the same slower bolts + longer aimed gap at their higher HP - the intended same-lever direction (E77 precedent).
4. R-4 enrage: fireEvery is phase-multiplied (phase2 ringEveryMult 0.6 -> 1.32 s aimed gap in phase 2; 1.56 s after P3) and burst speed is phase-independent - enrage preserved in BOTH levers.
5. R-5 post-kill residual (S7): slower burst bolts have LESS chance to exit the screen before the fight ends - could worsen postKillResidual deaths (4/11 in the sweep577 band decode); the frozen acceptance is the arbiter.
6. R-6 harness clone: the sweep643 clone is line-asserted (I583 lesson: 327-vs-328 split + doubled-backslash predicate); any clone divergence is recorded before the run, never patched silently.

## Verification evidence

At open (I646): I645 close gate 6/6 (CLOSEGATE645, zero re-pins) + push 0943949 verified on origin main (git ls-remote == local HEAD); dist re-measured 6,967,985 B / 205 this round; lever lines re-measured (src/core/config.js:281 fireEvery 2.2 [aimed-bolt seconds] / :306 burst.speed 7.0 [u/s radial] / :771 enemyBullets speed 9 [FROZEN]). Per landing: protocol steps 1-5 produce the evidence trail (.evidence/I647..I648/ + harness outputs + dist measures). At close: the G96.0 gate set (6/6 harness + fleet smoke + fresh dist + CLOSE FLOOR E96 WITH MEASUREMENT + AGENTS.md refresh).

## DoD

- ST-604..ST-606 all DONE (ST-605: the lever pair + measured acceptance (a)-(e), or C1 with the sweep647 record); E96 header CLOSED at G96.0.
- npm test 1,261/1,261; npm run build clean; dist measured at close vs 7,297,600 B; CLOSE FLOOR E96 WITH MEASUREMENT recorded.
- 34-GLB fleet unchanged (201,245 t WITH MEASUREMENT at close); vendor 4/4 EXACT + decoder raw pin intact.
- 6/6 harness + fleet smoke at close; causal arms EXACT (re-pin WITH MEASUREMENT only on a documented delta - EXPECTED none); playframe EXACT (same rule); pwa 11/11.
- AGENTS.md item-4 chain + one-liner refreshed WITH MEASUREMENT (only if the levers ship).
- ONE atomic commit per landing + the close-gate commit; every commit pushed (delegated fresh subagent) + verified via git ls-remote.
- Hygiene: 0 tabs, all ports free, no terminals left.

## Next owner

I647 = ST-605: apply P2+P3 (config.js:306 + :281, ONE pass) + sweep647 (30 fresh seeds 64600+i, rules647.md FROZEN PRE-RUN in .evidence/I647/, line-asserted clone of the .evidence/I644 sweep643 harness) + frozen acceptance (a)-(e) OR C1 (git restore config.js [BOTH levers] + accept-with-documentation + P4/P5/P6 to E97+ WITH the sweep647 record).
