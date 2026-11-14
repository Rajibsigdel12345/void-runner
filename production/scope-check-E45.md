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
Metric re-spec (G1v2). The defective I387 "body box" (half-width Rpx*1.15, a context crop ~2.3x the ship projected radius) is replaced by a geometry-derived tight hull crop: traverse the ship group, project every vertex of the body meshes (detected by material.color.getHex() === CFG.ship.palette.body.color, 2 meshes, detect=color-exact; an all-meshes fallback path is recorded if color-matching ever regresses), take the projected pixel bounding box, and crop to 75% of that box centered (half-extents 0.375*span per axis). This is exact, deterministic, and symmetric by construction (the identical mesh geometry is measured in both runs, so BEFORE and AFTER sample the same pixels). No color-thresholding. The crop is verified hull-dominated against the in-page closeups cu_high_sky_ship_idle_tight.png / cu_high_floor_ship_idle_tight.png (brass body + cyan cockpit, minimal background) - R-E45-2 mitigation satisfied.

Symmetric BEFORE/AFTER (fx=high, seed 71382, both backdrops, tight hull crop):

backdrop | metric | BEFORE (0x9a8468 m0.45 no-emissive) | AFTER (0xab9374 m0.15 emissive 0xffb347@0.12) | bg p50
sky | hull tight p50 | 52.16 | 121.53 | 29.12
sky | hull tight p90 | 62.08 | 130.24 | 76.56
sky | sep (hull p50 - bg p50) | +23.04 | +92.41 | -
floor | hull tight p50 | 52.16 | 123.46 | 10.63
floor | hull tight p90 | 62.51 | 129.46 | 16.41
floor | sep (hull p50 - bg p50) | +41.53 | +112.83 | -

Both runs: bodyMeshes=2 (detect=color-exact), nvp=137 projected vertices, console 0/0, state MENU, fx=high. Evidence: .evidence/I392/hullprobe_before.json, hullprobe_after.json, cu_high_{sky,floor}_ship_idle_tight.png.

Why the old metric failed (discrimination proof). The I387 body box p50 was 10.63 on floor (== floor bg p50 10.63, sepB 0) and 10.63 on sky (vs sky bg 29.12, sepB -18.49): the context crop's median is background, so it cannot certify hull readability and no material change can move it. The tight crop fixes this - even the dark BEFORE hull now separates (floor +41.53, sky +23.04) and the AFTER hull separates strongly.

Published G1v2 windows (the gate for all future own-side art; fx=high, both backdrops):
- hull tight p50 in [100, 160]
- hull tight p90 in [120, 200]
- separation (hull tight p50 - bg p50) >= 40
- The accent (cockpit cyan 0x59d8ff @1.4) remains a separate frozen pin and is NOT part of G1v2.

Discrimination test (BEFORE must FAIL, AFTER must PASS with margin):
- BEFORE: hull p50 52.16 (sky and floor) -> below the [100,160] floor -> FAIL on both backdrops; p90 62.08/62.51 below [120,200] -> FAIL; sep sky +23.04 < 40 FAIL, floor +41.53 >= 40 PASS. The brightness floor is the primary gate (it fails BEFORE on both backdrops; separation alone does not on floor).
- AFTER: hull p50 sky 121.53 (margin +21.53 above floor, -38.47 below cap) PASS, floor 123.46 (+23.46 / -36.54) PASS; p90 130.24 / 129.46 in [120,200] PASS; sep 92.41 / 112.83 >= 40 PASS.

G1v2 is now a working own-side hull-readability metric: it measures the hull (geometry crop, not context), it discriminates (BEFORE FAIL / AFTER PASS on both backdrops), and it is symmetric (deterministic geometry, identical sampled pixels both runs). The metric is published and now governs ST-357/358 and all later own-side art. Zero src, zero asset delta.