# E95 - Wave-5 Monolith Wall III (registered P1 lever: boss.burst.count 12 -> 9) - research

Status: FROZEN (opened I642, ST-600). The lever, the frozen lever-selection rule, the sweep642/sweep643 protocol, the B/A*/G/C adjudication (gap-free tiling of the (B56, M56') space), the acceptance (a)-(e), and the C1 cut path are FROZEN in this doc; the story map ST-600..ST-603 runs I642..I645. Next owner: I643 (ST-601) sweep642 pre-lever re-audit.

## Standing context (E82 C1 record, carried)

The E82 close (I584, G82.0 accept round, C1) registered:

- The wave-5 Monolith wall remains THE live wall. Band (B56 = deaths wave in {5,6}) lineage across the full record: sweep567 10 / 569 7 / 571 9 / 573 12 / 577 11 / sweep581 (pre-lever E82) 12 / sweep582 (post-cadence lever) 9 of 30.
- The E82 frozen lever boss.burst.every 4.0 -> 4.8 (cadence) was APPLIED then REVERTED per the frozen acceptance: sweep582 (a) B56 PASS 9/30, (b) M56' FAIL 9/30, (c) median death wave PASS 9, (d) reach13 FAIL 1/30 (best 58208 wave 13, 207,767 pts).
- MEASURED E82 band decode (I583 extract582): the post-lever 9/30 band deaths are 8 in-fight + 1 post-kill residual (down from 4 pre-lever), V-DECODE burst-class 5 + aimed-class 4 - the AIMED SHARE ROSE vs sweep577 (1/11) and sweep581 (1/12): the slower burst cadence lengthened the on-screen residency of the aimed bolts (the carried S3 insight, now MEASURED at I583).
- CADENCE ALONE IS PROVEN INSUFFICIENT: B56 12/30 -> 9/30 but M56' stuck at 9/30 and reach13 1/30 - the residual wall is ANGULAR (corridor width in the radial wall), not temporal.
- The pattern-lever registration carries: P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 (ONE chosen by that epic's own frozen rules).
- E83..E94 (art remaster / wave-hold pacing / cockpit epics) did NOT touch the boss path: the Monolith config block is byte-identical to the E82 closed tree (re-verified at I642, sec. 3).
- PROCESS FINDING carried (E81(d)): the frozen adjudication must explicitly tile the metric space the branches are defined over (sec. 6 does this).
- E95 picks P1 from the registration: the measured E82 residual plus the fresh I642 research (sec. 2, S9-S12) says the remaining defect is GAP WIDTH in the radial wall - a 12-bolt ring leaves 30deg between adjacent bolts; a 9-bolt ring leaves 40deg (+33%). P1 is the direct corridor-width knob, geometry-identical in the S4 sense (same radial pattern family, one parameter, zero RNG).

## 1. Measured current state (pre-lever lineage; the fresh re-audit is I643)

- Band lineage (B56): 567 10 / 569 7 / 571 9 / 573 12 / 577 11 / 581 12 / 582 (post-P0) 9. Median death wave: 577 9 / 581 8 / 582 9. Reach13: 577 6/30 / 581 1/30 / 582 1/30.
- sweep582 post-lever band composition (I583): 9/30, ALL source=bullet, inFight 8 + postKillResidual 1 (seed 58212, 30 ticks [0.5 s] post-kill), V-DECODE burst 5 / aimed 4 / ambiguous 0; MONOLITHprimary 8 + bullet_unknown 1.
- Honest note: no fresh pre-lever 30-seed sweep exists since sweep582 - E83..E94 were art/pacing/cockpit epics that did not re-audit the band. I643's sweep642 (30 FRESH seeds 64200+i) is the pre-lever re-audit this round runs per the frozen E70 protocol BEFORE any code change.

## 2. Research (FROZEN at open I642; S1-S8 carried verbatim from the E82 doc)

- S1 (FROZEN, carried): Bog Hog, 'Bullet Pattern Design [SHMUP WORKSHOP 03]' (https://youtu.be/ArZRZSYICLo, 17K views, 7:19, 2023-01-13): [3:38-4:09] 'slowly escalate difficulty... lets players get into its flow before fully blasting them'; [2:04-2:34] 'if the player is getting blasted with aimed patterns while stuck in the lane some extra wiggle room can be vital for survival'; [3:06-3:38] pattern roles + 'direct challenge when sufficiently wide, dense, fast'. FRESH I642 highlights (transcript fetch WORKS this session, unlike E82): [2:15] dense patterns are 'a collection of lanes; different lanes are micro challenges'; [1:08] micro-dodging is the LAST RESORT, not the design target; [3:59] telegraph/flow. Extraction: the 9-bolt ring stays a 'lane' pattern - crossing the wall must become a positioning problem (lanes), not a reflex micro-dodge problem.
- S2 (FROZEN, carried): GMTK, 'How Games Get Balanced' (https://youtu.be/WXQzdXPTb2A, 1.3M views, 15:34): [2:43-3:16] Halo 3 sniper 'the best knob to tweak was the time between shots, bumped from 0.5 to 0.7 seconds'; [1:10-1:42] Jeff Kaplan 'the perception of balance is more powerful than balance itself'.
- S3 (FROZEN, carried): Sparen, 'Danmaku Design Studio, Guide A4' (sparen.github.io/ph3tutorials/ddsga4.html): faster bullets lower spacial density; slower bullets stay in the field of view LONGER; spawn timing (temporal density) is what creates/disperses density. Extraction (now MEASURED at I583): P2 (slower bolts) INCREASES on-screen spacial density - the wrong direction.
- S4 (FROZEN, carried): Flukz, 'Bullet Pattern Design in Shmups' (flukz.org/devlog/bullet-pattern-design-shmup): 'Speed, bullet count, spread angle, rotation rate, burst delay... are the core knobs'; 'the pattern geometry stays identical; only the parameters change'; 'players can adapt to one change at a time'. Extraction: bullet COUNT is a core knob of the same single-knob class as the cadence knob E82 tested.
- S5 (FROZEN, carried): Flukz, 'Bullet-Hell Patterns Explained' (flukz.org/devlog/bullet-hell-patterns-explained): 'A pattern with no safe path is not hard - it is broken... at least one safe path should exist at all times'.
- S6 (FROZEN, carried): Giest118, 'Guide to Making Good Bullet Hell Bosses' (shmups.system11.org/viewtopic.php?t=44816): keep bullet density consistent; cadence is a first-class boss-tuning axis; shape frozen, cadence free.
- S7 (FROZEN, carried): RPS, 'Enter the Gungeon' (2016): stagger attacks so bullets have a chance to EXIT the screen.
- S8 (FROZEN, carried): Koshin Studio, 'How to make bullet hell patterns' (koshinstudio.com/en/notes/danmaku-patterns/): the emitter is 4 numbers (interval i, bullets/shot c, speed v, angle r); 'More bullets mean narrower gaps'. Extraction: c (count) is the GAP-WIDTH knob; P1 moves c alone.
- S9 (NEW, I642): Flukz, 'Bullet Pattern Design in Shmups' (flukz.org/devlog/bullet-pattern-design-shmup), density table: Easy: max 12 bullets/burst, min spacing 28 px; Normal: 20/18; Hard: 32/12; 'Measure available corridor width, not inter-center distance'. Extraction: our 12-bolt ring sits AT the Easy cap; a 9-bolt ring moves under the cap and widens every corridor.
- S10 (NEW, I642): Flukz, 'Bullet-Hell Patterns Explained' (flukz.org/devlog/bullet-hell-patterns-explained): 'make the gaps just small enough to be satisfying when found'; ring n -> gap 360/n. Extraction: n 12 -> 9 widens the angular gap 30deg -> 40deg (+33%); the GAP - not the bolt count - is what the player experiences.
- S11 (NEW, I642): npaka, '15 Beautiful Bullet Hell Patterns' (note.com/npaka/n/n5d38b7d84173): 'Design the gaps rather than the density - when players can see a path it feels fair even if difficult'; radial difficulty is tuned 'simply by changing bullet count, angle, and speed'. Extraction: count is the sanctioned radial-difficulty knob; designing the gap is the fairness lever.
- S12 (NEW, I642): Sparen, 'Danmaku Design Studio, Guide A3' (sparen.github.io/ph3tutorials/ddsga3.html): n-ring -> angle 360/n; 'the more bullets, the denser'. Extraction: independent confirmation of the 360/n gap math.

## 3. Code grounding (RE-MEASURED from the tree at I642)

- config.js boss block (L265-316): everyWave 5 (L269) / maxHp 64 (L270; I325's registered 12 s TTK floor) / hpFirstWave 10 (L271) / hpStep 12 (L272) / hpCap 88 (L273) / radius 3.4 (L274) / speed 1.6 (L275) / turn 0.8 (L276) / ringEvery 2.5 (L277; the E77 shipped lever) / ringCount 8 (L279) / splitCount 4 (L280) / fireEvery 2.2 (L281) / enterTime 0.8 (L282) / phase2 { hpFrac 0.5 (L297), speedMult 1.3 (L298), turnMult 1.4 (L299), spin 1.6 (L300), ringEveryMult 0.6 (L301) } / burst { every 4.0 (L304), count 12 (L305 - THE LEVER LINE), speed 7.0 (L306), offsetSpin 0.45 (L307), everyMult 0.65 (L308) } / score 1000 (L310) / telegraph render-only (L311+).
- Bolt geometry (RE-MEASURED): src/core/boss.js:9-17 bossBurstVectors(cfg, offset) - PURE, no rng, no DOM: a = offset + (i / count) * 2*PI for i in 0..count-1, each vector scaled to burst speed; called from game.js:940-949 bossBurst() with offset = bossBursts * offsetSpin (volley counter, time-driven init game.js:68, reset on phase change). Zero RNG on the bolt schedule - count 12 -> 9 re-spaces the same deterministic layout. Angular gap = 2*PI/count: 30deg -> 40deg EXACT (+33.3%).
- Campaign isolation (RE-MEASURED): campaignBoss.js owns its HP path + own moves; spawnBossForWave early-returns on the campaign path (game.js) -> cfg.boss.burst is NEVER read on campaign -> the lever is structurally endless-only (same as E82; stronger than the BAL-4 shared-config pattern, no campaign note needed).
- E81/E82 rejections re-verified (still hold): maxHp 64 -> 56 breaks I325's registered 12 s TTK floor and shifts w15/w20 HP (76 -> 68, 88 -> 80); ringCount / splitCount - zero rock deaths in the band; P2 burst.speed 7.0 -> 6.0 - MEASURED wrong direction at I583 (slower bolts = longer on-screen residency = higher spacial density, S3); P3 fireEvery 2.2 -> 2.6 - aimed cadence is not the registered primary defect (the E82 residual is the burst wall under fire; the raised aimed share is a SYMPTOM of the slower cadence, not an independent wall).
- dist: a 1-char literal swap ("12" -> "9") in shipped config; comments do not ship -> EXPECTED byte-identical 6,967,985 B / 205.

## 4. Scope decision

- Minimal single-lever round (the frozen E70 protocol): ONE lever (P1), ONE pass WITH MEASUREMENT (sweep643), on-failure -> accept (C1), no second fiddle.
- Lever class: a difficulty KNOB (angular gap width = corridor width = S9 'measure available corridor width'), not a fairness RULE (the pattern FAMILY is FROZEN - the radial bolt wall is the intended challenge per S1 [3:06-3:38]; the measured defect is corridor width, not the existence of the wall).
- Frozen lever-selection rule (against the E81/E82 registration P1/P2/P3):
  - P1 (burst.count 12 -> 9) CHOSEN: the measured E82 residual is ANGULAR (M56' stuck 9/30 while cadence moved B56 12 -> 9); S8 ('more bullets mean narrower gaps') + S9 (12 bolts = AT the Easy cap) + S10/S12 (gap = 360/n: 30deg -> 40deg, +33%) + S11 ('design the gaps rather than the density') + S4 (core knob, geometry-identical, one change at a time). Zero RNG. No spacial-density increase (unlike P2).
  - P2 (burst.speed 7.0 -> 6.0) REJECTED: MEASURED wrong direction at I583 (S3 insight, now measured); it also shifts the reaction character (reflex -> positioning) without widening the corridors.
  - P3 (fireEvery 2.2 -> 2.6) REJECTED for E95: aimed cadence is not the registered primary defect (sec. 3); the E82 band shows the residual is the burst wall's corridors, and the aimed share rose as a SYMPTOM of the slower cadence. P3 carries to E96+ if P1 fails.

## 5. Frozen lever

- boss.burst.count 12 -> 9 (src/core/config.js:305, one line). Effect in the wave-5 fight: 12 evenly-spaced bolts (30deg corridors) -> 9 evenly-spaced bolts (40deg corridors, +33% corridor width per S10/S12); the same volley cadence (4.0 s / 2.6 s phase 2), the same bolt speed 7.0, the same spiral drift offsetSpin 0.45. Blast radius (MEASURED): ALL endless Monolith fights (w5/w10/w15/w20/w25/...); enrage preserved (count is phase-INDEPENDENT - no phase-2 count multiplier exists, so phase 2 keeps the same 40deg corridors at the 0.65x cadence); the rock ring (ringEvery 2.5 / ringCount 8) and the aimed bolts (fireEvery 2.2) are UNCHANGED.
- One pass. No companion changes (the single-boss single-lever rule of the frozen E70 protocol).

## 6. Sweeps + adjudication + acceptance (FROZEN)

- Metrics (frozen, carried verbatim from the E82 doc):
  - B56 = deaths on wave in {5,6} (any attribution).
  - M56' (REFINED) = deaths on wave in {5,6} AND (clsPrimary == MONOLITH OR (clsPrimary == bullet_unknown AND a monolithDeath tick exists within 180 ticks (3 s) BEFORE the player death)). The 180-tick window is sized by the MEASURED post-kill residuals (sweep573: 2-90 ticks; sweep577: 4/54/72/77 ticks; sweep582: 30 ticks) with margin.
  - R-6 comparability (carried): report BOTH M56 (clsPrimary == MONOLITH only) and M56' wherever E95 numbers appear so the E81/E82 record stays auditable.
- Baselines for the acceptance: sweep582 (most recent 30-seed same-protocol sample, post-P0): B56 9/30, M56' 9/30, median death wave 9, reach13 1/30 - so acceptance (a) and (c) are NON-REGRESSION floors vs the post-P0 state, while (b) and (d) must IMPROVE on it.
- Gap-free FROZEN adjudication for sweep642 (explicitly tiling the (B56, M56') space - satisfies the E81(d) PROCESS FINDING):
  - (B) B56 >= 12/30 -> apply the lever.
  - (A*) 10 <= B56 <= 11 AND M56' >= 8/30 -> apply the lever (the pre-registered single-boss extension, as at E81 - justified by the MEASURED single-boss premise: the same fight every time; a sub-12 band here is seed variance on a single-boss wall, not wall absence). Recorded WITH MEASUREMENT when used.
  - (G) 10 <= B56 <= 11 AND M56' <= 7/30 -> ST-602 VOID + accept + document (C-equivalent).
  - (C) B56 <= 9/30 -> ST-602 VOID + accept (E78-lever pattern; the wall is below the band even pre-lever - P1 unnecessary).
  - The four cells are mutually exclusive and exhaustive over the (B56, M56') space (B56 in {>= 12} vs {10, 11} vs {<= 9}; within {10, 11}, M56' >= 8 vs M56' <= 7). NO uncovered cell remains.
  - Material divergence from this doc -> RECORD + REGISTER before any code change (I570 pattern); nothing is re-derived.
- sweep642 (ST-601, I643): 30 FRESH seeds 64200+i; rules642.md FROZEN PRE-RUN in .evidence/I643/ (E95 labels, the B56 + M56' metric definitions, the 4-branch block above verbatim); full director from wave 1; frozen I328 kiter verbatim (as carried in .evidence/I574/sweep573.mjs); cap 36000 ticks @ 1/60; in-process, zero servers/tabs. CLONE BASE = .evidence/I582/sweep581.mjs (17,773 B; NOTE: the I581 open dir holds docs-only, the sweep harness landed in I582); the clone is LINE-ASSERTED (the I583 clone found a 327-vs-328 split + a doubled-backslash predicate); ONLY the header/seeds/output-labels/branch block change.
- sweep643 (ST-602, I644, only if the lever applies): 30 fresh seeds 64300+i. Acceptance (frozen):
  - (a) B56 <= 9/30 (non-regression vs sweep582 9/30);
  - (b) M56' <= 7/30 (improvement on sweep582 9/30);
  - (c) median death wave >= 9 (non-regression vs sweep582 9);
  - (d) >= 3/30 reach wave >= 13 (improvement on sweep582 1/30; sweep577 reference 6/30);
  - (e) 6/6 harness gate EXACT, no re-pin.
- C1 (on ANY of (a)-(d) failure): git restore src/core/config.js (one line) + accept-with-documentation + the P2 (burst.speed 7.0 -> 6.0) / P3 (fireEvery 2.2 -> 2.6) residual registration to E96+ WITH the full measurement record + E95 closes at G95.0 as an accept round (E78/E80/E81/E82 pattern). ONE pass, no second fiddle.

## 7. Pin safety (pre-registered)

All harness pins live at wave <= 2 / MENU (causal495 wave 2 on seed-9876; causal483 ~45 s demo window; playframe A MENU / B ~wave 1; pwa491 menu-only). The endless Monolith first spawns at wave 5; the burst bolts are PURE and deterministic per volley (boss.js:9-17 bossBurstVectors - zero RNG; time-driven volley counter) -> count 12 -> 9 draws ZERO extra RNG on any pinned path -> ALL pins EXPECTED EXACT, no re-pin.

## 8. dist policy

The lever is a 1-char literal swap in shipped config ("12" -> "9"); comments do not ship -> EXPECTED byte-identical 6,967,985 B / 205. Ceiling 7,400,000 B (KEEP); close target 7,297,600 B; CLOSE FLOOR E95 re-derived WITH MEASUREMENT at G95.0 (I645), headroom floor >= 102,400 B (cut ladder NOT expected). Vendor pins r187 unchanged (no vendor change this epic).

## 9. Risks

- R-1 count is the wall's SHAPE: 9 bolts instead of 12 changes the visible pattern (S1 [3:06-3:38] 'direct challenge when sufficiently wide, dense, fast') - the INTENDED change (wider corridors per S11); the fight stays a radial wall (rings + aimed unchanged). If (b) still fails, the residual is aimed-pressure or HP/TTK, not corridors; C1 executes and P2/P3 are the E96+ handoff - never a second fiddle inside E95.
- R-2 seed variance: the band lineage spans 7-12/30 across seven same-protocol samples (567 10 / 569 7 / 571 9 / 573 12 / 577 11 / 581 12 / 582 9 post-P0); the adjudication is FROZEN PRE-RUN with the exact story consequence of all four branches pre-registered (E81(d) satisfied).
- R-3 late-wave side effect: the wave-10/15/20/25 Monoliths get the same 40deg corridors at their higher HP (76/88/88) - the intended same-lever direction (the same fight shape gets the same corridor width at every Monolith wave; the E77 ringEvery lever set this precedent).
- R-4 enrage: count is phase-INDEPENDENT (no phase-2 count multiplier exists) -> phase 2 keeps the same 40deg corridors at the 0.65x cadence (2.6 s) - the enrage mechanic is preserved (more frequent volleys, same wider corridors).
- R-5 attribution: frozen since I525/I564 (primary == strict killing-blow attribution); B56 + M56' frozen pre-run here, so the residual ambiguity (the post-kill bullet_unknown deaths) is decided by the frozen 180-tick window, not by post-hoc judgement.
- R-6 (carried) metric comparability: M56' is the E82-refined metric, not the E81 M56; both are reported wherever E95 numbers appear.
- R-7 (NEW) spiral overlap: offsetSpin 0.45 rad = 25.78deg of drift per volley. Drift-per-corridor: 25.78/30 = 0.86 (12 bolts) -> 25.78/40 = 0.64 (9 bolts) - the consecutive volleys' bolts land FURTHER from sitting directly on each other's corridors, so the corridors PERSIST across volleys more (better for S5 'a safe path at all times') - the expected direction, but the frozen acceptance (a)-(e) is the arbiter: no pre-derivation of the outcome (I570 pattern).
- R-8 (NEW) sweep clone: the clone base .evidence/I582/sweep581.mjs (17,773 B) must be line-asserted (the I583 clone found a 327-vs-328 split element count + a doubled-backslash predicate); any clone divergence is recorded before the run, never patched silently.

## 10. Story map

- ST-600 (I642) - open + research + scope-check (docs-only) - this doc.
- ST-601 (I643) - sweep642 pre-lever re-audit + the frozen gap-free adjudication B/A*/G/C.
- ST-602 (I644) - CONDITIONAL: lever one line + sweep643 (30 fresh seeds 64300+i) + acceptance (a)-(e); OR VOID on Branch G or C; C1 on acceptance failure.
- ST-603 (I645) - G95.0 close gate (clone of the .evidence/I641/run_close641.cjs runner pattern, label CLOSEGATE645).

## 11. Changed files (I642, docs-only)

design/e95-monolith-wave5-wall-iii-research.md (NEW, this doc, FROZEN) + production/scope-check-E95.md (NEW, FROZEN) + production/epics.md (E95 OPEN + the stale E93 entry demoted to CLOSED I637) + production/stories.md (ST-600 DONE) + production/iterations.md (I642) + production/timeline.md (I642) + production/session-state/active.md (I642 NEXT) + CHANGELOG.md (I642) + .evidence/I642/ (local-only). ZERO src/assets/vendor/render/i18n.

## 12. Verification bar (quality, docs-only) + next owner

- npm test 1,261/1,261 / npm run build 0 / dist byte-identical 6,967,985 B / 205 / vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017) + decoder D428E73A000057C6 29,256 B / hygiene (zero servers/tabs/terminals).
- Next owner: I643 (ST-601) sweep642 pre-lever re-audit (rules642.md FROZEN PRE-RUN in .evidence/I643/; sweep642.mjs = line-asserted clone of .evidence/I582/sweep581.mjs 17,773 B: E95 labels + seeds 64200+i + the 4-branch decision block verbatim from this doc sec. 6).
