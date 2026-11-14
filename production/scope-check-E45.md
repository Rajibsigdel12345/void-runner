# Scope Check - E45 Own-Side Metric Re-Spec & Watch-Items Pass

- Date: 2026-11-15
- Skill: cgs-scope-check (+ cgs-create-stories for the story split)
- Status: OPENED at I391 (docs-only 0 KB, zero src)

## Summary
After E44 closed the own-side readability gaps (I390: hull visibility fixed, shockwave reads from the low cam, zero draw calls, 0 B asset delta), two follow-up surfaces remain, both proven in the E44 record: (1) the G1 p50 metric itself is defective - the I387 body box (half-width Rpx*1.15, ownside_probe.mjs:125-126) is a context crop 2.3x the ship projected radius, so its p50 is background-dominated (box p50 == floor bg p50 10.63 in 3 straight runs; 10.63 < sky bg 28.41) and no material change can move it into the I388 budgets [34,60]/[22,60]; the visibility objective IS met (floor hull p90 sep +107.05, sky accent sepA +51.61) but the metric cannot certify future own-side art; (2) the I387 audit left three documented watch items: shield/reticle box artifacts, the trail ember band 54.26-112.43 overlapping the rock ember pin region, and powerup readability under fx=off. E45 re-specs the metric (ST-356) and runs a bounded audit + fix on the watch items (ST-357/358).

## Scope Fit
- Elements (all existing probe/config modules, zero new systems): .evidence/I391/ownside_probe.mjs (crop geometry: body box half-width Rpx*1.15 -> tight hull crop ~Rpx*0.55, exact value decided from the ship silhouette; accent box Rpx*0.45 kept or re-derived), shield + reticle (box-artifact measure), trail (ember band vs rock pin 112.43/54.26), powerup meshes (fx-off acc90).
- Same proven method as E43/E44: headless per-element luma probe, both backdrops, fx=high/off, in-page-cropped closeups, byte-equal enemy page as the cross-epic guard.
- Bounded: 4 stories, 4/6 iterations, doc+probe (ST-356/357) + config/render-only (ST-358, CUTTABLE); Blender NOT armed (no asset bake is the lever; the I388 Node-side GLB measurement already proved the COLOR_0 bake is neutral-to-bright).

## Cut Option
ST-357 is CUTTABLE-to-docs-only (like E44 ST-351): if the audit finds no actionable gap (box artifacts within tolerance, ember band separation adequate, powerups readable fx-off), E45 closes at ST-357 with ST-358 dropped; ST-359 still runs the full gate.

## Deferral
E39-E44 deferrals untouched (incl. scripts/serve.mjs .webmanifest MIME - the I348 canonical server stays for PWA probes). Touch support remains a future epic.

## Grounding
- P2 (feedback luma separates from body AND background) extended: a readability metric must measure the element, not its context - the I390 box-p50 defect is the proof case (box p50 == floor bg p50 10.63 in 3 straight runs).
- P4 own/enemy bullet disambiguation (MD5 differ both backdrops) held as a frozen invariant through E45.
- Enemy hierarchy FROZEN (drone 200.98 / stinger charge 254 / flyer 197.74 / warden exposed 147.01 / mine 127.0 / boss 182.49) is the cross-epic regression guard (R3b byte-equal).
- No new YouTube grounding: the E44 audit data + the I390 probe runs are the complete evidence base (anti-over-engineer).

## Constraints (FROZEN through E45)
- FEEL frozen (timing/curves/feel-balance values untouched).
- Zero sim src (p1 by causality; last sim-logic commit I366 stays the last).
- Draw calls: 21/366 (fx-off) + 50/1222 (PLAYING fx-high) hold exactly.
- FLOOR-50 battery 230/72/158; floor 32.2/72.07; skybox 70.14; rocks 112.43/54.26/52.76; ring p90 49.04/48.32/38.54/24.41 + rim 52.76.
- Enemy hierarchy frozen + cockpit cyan 0x59d8ff @1.4 + player bullet 219.99 / enemy bullet 152.18 (P4).
- vendor three.module.js sha 76DEA8151BC9352A; target asset delta 0 B.

## Plan (stories in production/stories.md, epic in production/epics.md)
- ST-356 (I392) G1 p50 metric re-spec + symmetric BEFORE/AFTER re-measurement (doc+probe-only, zero src).
- ST-357 watch-item audit: shield/reticle box artifacts + trail ember band + powerups fx-off (doc+probe; CUTTABLE).
- ST-358 bounded fixes (config+render-only, only if ST-357 proves gaps; CUTTABLE).
- ST-359 G45.0 gate + closeout (R1-R5; close E45; open E46).

## Budget
dist at open 131/1,918,997 B; headroom 178,155 B (>= 102400 B); target asset delta 0 B; 4/6 iterations.

## Risks
- R-E45-1 ST-356 BEFORE revert must be temporary and probe-scoped (in-place config.js body revert + probe + git restore; never commit the revert).
- R-E45-2 the tight crop can still be background-affected at the crop edges - the crop is verified against the ship silhouette closeup before any window is pinned.
- R-E45-3 p1 by causality (zero sim src through the epic).
- R-E45-4 no new draw calls (21/366 + 50/1222 hold).

## Verification evidence (at open)
- I391 G44.0 gate: R1 929/929 + causal + build 0 / R2 rockab exact / R3 fresh verbatim (P4 differ + enemy byte-equal + playframe 21/366 + 50/1222 EXACT) / R4 PWA 11/11 / R5 sha + headroom 178,155 B + hygiene. See iterations.md I391 + .evidence/I391/ (rockab_i379.json, ownside_audit_i387.json, probe_i385.json, enemy_audit_i384.json, pwa probe output).

## Recommendation
PROCEED: ST-356 first (it defines the measurement all later own-side art will be judged by); ST-357 audit before any fix; ST-358 only with a proven gap and a pre-specified lever.

## ST-356 re-spec (I392) - tight hull crop + symmetric BEFORE/AFTER
(to be filled by I392: crop geometry, BEFORE/AFTER numbers, published windows)