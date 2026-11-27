# E95 scope check - wave-5 Monolith Wall III: widen the radial-bolt corridors (P1 boss.burst.count 12 -> 9)

Opened I642 (ST-600..ST-603 pre-registered). E94 CLOSED at I641 (0a639b5, remote-verified: git ls-remote origin main == 0a639b5571d3ae654627128a34eb2351a9f79dee == local HEAD). The wave-5 Monolith wall - the longest-outstanding measured gameplay wall in the project (lineage E77 -> E81 -> E82; E82's cadence lever C1-reverted, wall PARTIALLY BROKEN) - is the target of E95, scoped to exactly ONE registered lever: boss.burst.count 12 -> 9 (the angular corridor width 30deg -> 40deg, +33%). No assets, no new dist files, no campaign/ring/aimed changes.

## Wall record (measured; design/e95-monolith-wave5-wall-iii-research.md sec. 1)

- B56 band (deaths wave in {5,6}) lineage: sweep567 10 / 569 7 / 571 9 / 573 12 / 577 11 / 581 12 / 582 (post-P0 cadence) 9 of 30. Median death wave 577 9 / 581 8 / 582 9; reach13 577 6/30 / 581 1/30 / 582 1/30.
- E82 (I583/I584): P0 boss.burst.every 4.0 -> 4.8 applied then reverted (C1): sweep582 (a) B56 9/30 PASS / (b) M56' 9/30 FAIL / (c) median 9 PASS / (d) reach13 1/30 FAIL; band composition burst 5 + aimed 4 (the aimed share ROSE from 1/12 - slower cadence lengthened aimed-bolt residency, S3 MEASURED).
- Diagnosis (FROZEN): the residual wall is ANGULAR - a 12-bolt ring = 30deg corridors, AT the Easy-cap of the Flukz density table (S9); cadence (E82, measured) and speed (P2, measured wrong direction I583) do not widen the corridors; count (P1) is the direct corridor-width knob (S8 'More bullets mean narrower gaps'; S10/S12 gap = 360/n: 30deg -> 40deg, +33%).

## Scope Fit

Measured at I642 (on disk, post-I641):
- dist: 6,967,985 B / 205 files (I641 fresh measure, re-verified this round). E95 close target: 7,297,600 B (7,400,000 B ceiling - 102,400 B close-floor) -> envelope 329,615 B (= CLOSE FLOOR E94 measured at G94.0).
- Assets: 34 GLB / 201,245 t - untouched by E95 (no Blender work; the fix is one config number).
- The lever is a 1-char literal swap in an already-shipped file (src/core/config.js:305) -> file count stays 205, EXPECTED byte-identical dist.
- Feasibility: the code budget (<= 1,000 B worst case, below) is < 0.4% of the envelope.

## Research (FROZEN at open I642)

- cgs-scope-check + cgs-balance-check applied; the lever is pre-registered from the E81/E82 pattern-lever registration (P1/P2/P3) and SELECTED by the frozen rules in the research doc sec. 4.
- Fresh I642 pass (transcript fetch WORKS this session): Bog Hog SHMUP WORKSHOP 03 fresh highlights [2:15] lanes/micro-challenges, [1:08] micro-dodging as last resort, [3:59] telegraph/flow; written sources S9 (Flukz density table: Easy 12 bolts / 28 px; 'measure available corridor width') + S10 (Flukz: 360/n; 'make the gaps just small enough to be satisfying when found') + S11 (npaka: 'design the gaps rather than the density') + S12 (Sparen A3: 360/n). S1-S8 carried verbatim from the E82 doc.
- In-repo lineage: I565/E77 ringEvery 2.5 (shipped) -> E81 P0 registered -> E82 P0 tested + C1 reverted (I583/I584) -> E83..E94 did not touch the boss path (art/pacing/cockpit epics) -> E95 runs P1 on a fresh pre-lever sweep per the frozen E70 protocol.

## Landing plan (PRE-REGISTERED)

- ST-600 (I642) - open + research + scope-check (docs-only) - this commit.
- ST-601 (I643) - sweep642: 30 FRESH seeds 64200+i; rules642.md FROZEN PRE-RUN in .evidence/I643/; line-asserted clone of .evidence/I582/sweep581.mjs (17,773 B; ONLY the header/seeds/output-labels/branch block change); full director from wave 1; I328 kiter verbatim (as carried in .evidence/I574/sweep573.mjs); cap 36000 ticks @ 1/60; in-process, zero servers/tabs. Adjudication (frozen, gap-free): (B) B56 >= 12/30 -> apply P1 / (A*) 10 <= B56 <= 11 AND M56' >= 8/30 -> apply P1 / (G) 10 <= B56 <= 11 AND M56' <= 7/30 -> VOID + accept / (C) B56 <= 9/30 -> VOID + accept. Mutually exclusive + exhaustive (E81(d)).
- ST-602 (I644) - CONDITIONAL (apply the lever only per the adjudication): the lever one line (config.js:305) + sweep643 (30 fresh seeds 64300+i) + frozen acceptance (a) B56 <= 9/30 / (b) M56' <= 7/30 / (c) median death wave >= 9 / (d) >= 3/30 reach wave >= 13 / (e) 6/6 harness gate EXACT no re-pin; C1 (git restore config.js + accept-with-documentation + P2/P3 to E96+ WITH the measurement record) on ANY (a)-(d) failure. ONE pass, no second fiddle.
- ST-603 (I645) - G95.0 close gate: 6/6 harness battery (clone .evidence/I641/run_close641.cjs, label CLOSEGATE645, every marker string verified against the harness's actual console output - the I632 lesson) + GLB fleet smoke (34/34, 201,245 t WITH MEASUREMENT, console 0/0) + fresh dist re-measure vs 7,297,600 B + CLOSE FLOOR E95 WITH MEASUREMENT + AGENTS.md refresh (item-4 chain + one-liner boss lever + re-pin notes if any) + E95 CLOSED.

## Frozen bounds

IN (per landing, nothing else):
- ST-602 only (if the adjudication applies the lever): src/core/config.js - ONE line (burst.count 12 -> 9).
- ST-603: docs-only (AGENTS.md + bookkeeping).
FROZEN: all 34 GLBs (no Blender), vendor 4 + decoder, PWA surface, campaign (structurally endless-only - spawnBossForWave early-returns; cfg.boss.burst never read on the campaign path), ring schedule (ringEvery 2.5 / ringCount 8), aimed fire (fireEvery 2.2 / speed 9), burst.every 4.0 / burst.speed 7.0 / offsetSpin 0.45 / everyMult 0.65, phase2 block, spawn mix, wave pacing (the E94 shipped state), audio, camera, input, UI.

## Measurement protocol

1. npm test green (1,261/1,261; unchanged - a config value swap is not unit-tested directly; the suite must stay 1,261).
2. npm run build clean; dist measured vs 7,297,600 B close target; file count 205.
3. Vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + decoder raw D428E73A000057C6 29,256 B.
4. Gate harness per code landing (I644 ONLY if the lever applies): causal495 3-arm + causal483 EXPECTED EXACT 13,350 (I639 re-pins) / playframe483/491 EXPECTED EXACT A 22/92,435 + P 11/2,076 / B 52/200,808 / pwa491 11/11 / fleet628 34/34 GLB / 201,245 t. Monolith spawns wave 5, all pins wave <= 2 / MENU, bolts zero-RNG -> EXPECTED EXACT, no re-pin.
5. ONE atomic commit per landing (code + bookkeeping together); push delegated to a fresh subagent (push only, NO Pages, no force, verbatim git ls-remote, agent closed), landing verified via git ls-remote.

## Budget (pre-registered)

- Start (I641 measured): dist 6,967,985 B / 205; assets 34 GLB / 201,245 t (frozen).
- E95 close target: dist <= 7,297,600 B; envelope = 329,615 B (= CLOSE FLOOR E94).
- Code across the epic: <= 1,000 B worst case (one 1-char literal swap; expected actual 0 B - esbuild minifies '12' and '9' to single tokens).
- Worst case: 6,967,985 + 1,000 = 6,968,985 B -> margin 328,615 B to the close target.

## Cut ladder (pre-registered)

C1: the E82 C1 path IS the cut ladder for this epic - git restore src/core/config.js + accept-with-documentation + the P2 (burst.speed 7.0 -> 6.0) / P3 (fireEvery 2.2 -> 2.6) residual to E96+ + close as an accept round (E78/E80/E81/E82 pattern). There is no intermediate cut (one lever, one line, one pass). Each C1 invocation recorded in this file as an AMENDMENT.

## Deferrals (out of E95, queue intact)

Belt-rock purpose / INCOMING telegraph / clear-bonus-on-grace (skip - rewards the backstop) / campaign + boss-wave pacing / WebGPU default switch (gated) / 2 E85 luma residuals (warden +20.12 / drone +10.41) / P2 burst.speed 7.0 -> 6.0 + P3 fireEvery 2.2 -> 2.6 (E96+ if P1 fails).

## Risks

1. R-1 count = shape: the intended change (S11 'design the gaps'); if (b) still fails, the residual is aimed-pressure/HP, not corridors - C1 executes, P2/P3 to E96+; never a second fiddle inside E95.
2. R-2 seed variance: the frozen gap-free adjudication pre-registers the exact story consequence of all four branch outcomes (E81(d) process finding satisfied).
3. R-3 late-wave: all Monolith waves (w10/15/20/25) get the same 40deg corridors at their higher HP - the intended same-lever direction (E77 precedent).
4. R-4 enrage: count is phase-INDEPENDENT - the enrage cadence (0.65x) is unchanged; phase 2 keeps the same wider corridors.
5. R-7 spiral: drift-per-corridor 0.86 -> 0.64 (0.45 rad = 25.78deg vs 30/40deg corridors) - corridors persist across volleys MORE (expected direction); the frozen acceptance (a)-(e) is the arbiter - no pre-derivation (I570).
6. Harness clone: the sweep581.mjs clone is line-asserted (the I583 clone found a 327-vs-328 split + a doubled-backslash predicate); any clone divergence is recorded before the run, never patched silently.

## Verification evidence

At open (I642): I641 close gate 6/6 (CLOSEGATE641, zero re-pins) + push 0a639b5 verified on origin main (git ls-remote == local HEAD); dist re-measured 6,967,985 B / 205 this round; config lines re-measured (sec. 3 of the research doc). Per landing: protocol steps 1-5 produce the evidence trail (.evidence/I643..I645/ + harness outputs + dist measures). At close: the G95.0 gate set (6/6 harness + fleet smoke + fresh dist + CLOSE FLOOR E95 WITH MEASUREMENT + AGENTS.md refresh).

## DoD

- ST-600..ST-603 all DONE (ST-602 VOID on Branch G/C or via C1; otherwise the lever + measured acceptance (a)-(e)); E95 header CLOSED at G95.0.
- npm test 1,261/1,261; npm run build clean; dist measured at close vs 7,297,600 B; CLOSE FLOOR E95 WITH MEASUREMENT recorded.
- 34-GLB fleet unchanged (201,245 t WITH MEASUREMENT at close); vendor 4/4 EXACT + decoder raw pin intact.
- 6/6 harness + fleet smoke at close; causal arms EXACT (re-pin WITH MEASUREMENT only on a documented delta - EXPECTED none); playframe EXACT (same rule); pwa 11/11.
- AGENTS.md item-4 chain + one-liner refreshed WITH MEASUREMENT (only if the lever ships).
- ONE atomic commit per landing + the close-gate commit; every commit pushed (delegated fresh subagent) + verified via git ls-remote.
- Hygiene: 0 tabs, all ports free, no terminals left.

## Next owner

I643 = ST-601 sweep642 pre-lever re-audit (rules642.md FROZEN PRE-RUN in .evidence/I643/; clone base .evidence/I582/sweep581.mjs 17,773 B line-asserted; seeds 64200+i; full director from wave 1; I328 kiter verbatim; cap 36000 ticks @ 1/60; in-process zero servers/tabs).
