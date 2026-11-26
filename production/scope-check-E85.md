# E85 scope check - Remastered-4 render-luma re-tune (I593 DIVERGENCE 1 residual)

Opened I595 (ST-562/ST-563 pre-sketch). E84 CLOSED at I594 (G84.0; c9b48aa) with the v2 legacy-4 swap live (dist 6,851,950 B / 203; CLOSE FLOOR E84 548,050 B; fleet 34 GLB 4,431,160 B / 123,188 t). DIVERGENCE 1 (I593, src delta = 0 B, carried as residual): the v2 bakes are 1.0-CENTERED bright bakes (domain [0.25, 1.55]) vs the legacy I508 dark bakes, so the remastered-4 render ~1.1-2.05x brighter than the ladder rungs the I511 renderLumaGain tuning (validated by the I519 in-game audit) established: warden hull bake p50 0.9697 vs legacy 0.4737 (2.05x), drone 1.0186 vs 0.5332 (1.91x), stinger 0.5573 vs 0.4504 (1.24x), flyer 0.6421 vs 0.5741 (1.12x) [per-face GLB luma, I593 re-pins in tests/assetGlbs.test.js ENEMY_FACET]. The in-code levers (config.js only) must be re-pinned so the fleet renders back on the approved ladder.

## Scope Fit

- The I594 close entry registers exactly this residual as the E85 head: "drone/warden renderLumaGain re-tune (DIVERGENCE 1: v2 bakes ~2x brighter, warden p50 0.9697 vs 0.4737, gain 4.5 legacy-tuned)". I595 recon confirmed all 4 remastered roles are affected (stinger/flyer gains + drone palette hex, not just drone/warden), so the re-tune set = {warden, stinger, flyer, drone} = the exact I593 swap set.
- Gain mechanism (tree-verified I595): wardenMesh.js L39/47/64 = hardcoded 0x2c3548/0x8fa3c8 x CONFIG.warden.renderLumaGain; stingerMesh.js L38 = CONFIG.stinger.palette.body.color x CONFIG.stinger.renderLumaGain; flyerMesh.js L39 = CONFIG.flyer.palette.body.color x CONFIG.flyer.renderLumaGain; droneMesh.js = CONFIG.drone.palette.body.color raw (NO gain lever - the hex IS the lever). GLB COLOR_0 multiplies on top (vertexColors: true).
- Target set = the I519 in-game audit (.evidence/I519/luma_i519.json): the last full-fleet in-game measurement, taken AFTER the I511 gain tuning, on the legacy GLBs. Its sky p50s are the approved ladder rungs: warden 119.49 (hue 179.1) / stinger 108.89 (hue 221.0) / flyer 94.22 (hue 335.8) / drone 184.08 (hue 189.5); floor 113.37 / 113.61 / 93.79 / 184.01.
- Test-safety (tree-verified I595): NO test pins any of the 4 levers (grep tests/ for renderLumaGain = zero hits; paletteHarmony.test.js asserts fx.palette/ship/boss/ship-flame only; assetGlbs.test.js ENEMY_FACET pins the GLB COLOR_0 bakes which stay UNTOUCHED - no re-bake).
- OUT (deferral, NOT E85): the P1/P2/P3 Splicer pattern levers (E80 design sec.6 handoff - separate balance workstream, still registered) / WebGPU default-arm switch (E66 frozen) / any GLB re-bake / emissive/rim levers / other 9 fleet roles (their GLBs + gains are the regression baseline) / new enemy types.

## Re-tune set (PRE-REGISTERED)

| role    | lever (config.js)                       | current | I519 target p50 (sky/floor) | I519 hue (sky) | expected pre-tune p50 (sky) |
|---------|------------------------------------------|---------|------------------------------|----------------|------------------------------|
| warden  | renderLumaGain (L360)                     | 4.5     | 119.49 / 113.37              | 179.1          | ~244 (~2.05x)                |
| stinger | renderLumaGain (L421)                     | 2.2     | 108.89 / 113.61              | 221.0          | ~135 (~1.24x)                |
| flyer   | renderLumaGain (L750)                     | 1.3     | 94.22 / 93.79                | 335.8          | ~105 (~1.12x)                |
| drone   | palette.body.color (L402)                 | 0x6f8796| 184.08 / 184.01              | 189.5          | ~350 (~1.91x)                |

Expected values are projections from the per-face bake ratio; the PRE audit (first action of ST-562) supersedes them. If a pre-tune p50 lands within the no-churn band (see rule N1), that role's lever stays untouched.

## Frozen bounds

- IN: the 4 levers above, one property each, in src/core/config.js ONLY; the audit harness clone + pre/post runs; E57 rule-1 re-check; worldR re-pin inside the AUDIT harness only (it is a mask-window parameter, not a game parameter - no src impact); 5-harness close gate; G85.0 close.
- OUT: any other config property; mesh modules; GLB files; tests/ (expect zero re-pins - if a test fails for a luma reason, RECORD the divergence + re-pin WITH MEASUREMENT before proceeding, I570 pattern); the 9 regression roles.

## Measurement protocol (FROZEN)

- Harness: .evidence/I595/luma_audit595.mjs = clone of .evidence/I519/luma_audit519.mjs with ONLY these changes: OUT -> .evidence/I595/; nocache tag i595; TARGETS worldR: drone 1.5 -> 1.6, stinger 2.0 -> 2.6, flyer 1.75 -> 1.9 (WITH MEASUREMENT from I592 v2 extents: stinger x -1.67..2.345 maxR ~2.43, flyer maxR ~1.72 [extent x 1.3 / y 1.0492 / z 0.58], drone v2 per I591); warden 3.2 unchanged (v3 maxR 2.4790 covered). Everything else verbatim: 13 targets, sky/floor backdrops, fx=high, 16-asset ready wait, statsMasked.
- Runs: luma_i595_pre.json (BEFORE any config change) + luma_i595_post.json (AFTER the patch). Both must contain all 13 targets x 2 backdrops, n > 0.
- Re-pin rules (PRE-REGISTERED):
  - G1 (gain roles): new_gain = round2(old_gain x target_sky_p50 / pre_sky_p50). Pin on SKY. FLOOR sanity: post floor p50 within 15% of I519 floor p50; if violated, pin on the mean of the two I519 backdrops and record.
  - H1 (drone hex): per channel new_channel = clamp(round(old_channel x target_sky_p50 / pre_sky_p50), 0, 255); post hue within 15 degrees of 189.5.
  - N1 (no gratuitous churn): if |pre_sky_p50 - target_sky_p50| <= 5, the role's lever stays UNTOUCHED.
  - T1 (post tolerance): |post_sky_p50 - target_sky_p50| <= 8 per re-pinned role (2-dec rounding + ACES tone-map nonlinearity). One extra re-pin iteration per role allowed (C1); then accept-with-documentation + residual registration.
  - R1 (regression): the 9 unchanged roles (hunter/sentry/wasp/phantom/hauler/bulwark/gunship/boss/ship): |pre_sky_p50 - post_sky_p50| <= 2 (bit-identical config => expect ~0; 2 = readPixels noise floor).
  - E1 (E57 rule-1 re-check, post): for each re-tuned role vs every other audit role: collision iff dluma <= 10 AND dhue <= 40 (sky p50 + hue). Max ONE hue-nudge iteration per colliding role (rotate its palette hex toward its I519 hue, keeping the pin). If 2+ collisions survive the nudge for one role -> C2: revert that role's lever via git restore + register the residual.
- Servers: dev :5173 self-start/self-kill around each run; ports 4200/4173/5199 untouched; hygiene verified after.

## Budget + pin expectations (PRE-REGISTERED)

- src delta: config.js, 4 one-line value edits => dist delta <= ~200 B. No geometry/draw-call/RNG change => playframe A 22/62,472 + 11/180, B 52/132,682, causal495/483 (score 11334), pwa491 11/11 all EXPECTED EXACT, zero re-pins.
- Quality bar: npm test 1,237/1,237 / npm run build 0 / fresh dist re-measure (expect 6,851,950 +- 200 B) / vendor 4/4 EXACT / 5-harness close gate / hygiene (all 4 ports free, zero tabs, zero terminals).
- Tripwire 7,297,600 B / ceiling 7,400,000 B.

## Stories

- ST-562 (I596) measure + re-pin: harness clone + pre-audit + config.js re-pin WITH MEASUREMENT (G1/H1/N1) + post-audit + E57 re-check (E1) + full quality bar. CUTTABLE to a zero-patch accept if N1 fires for all 4 (not expected: projected deltas 13-165 p50).
- ST-563 (I597) G85.0 close: close gate 5/5 re-run (clone of the .evidence/I594 runner) + dist re-measure + CLOSE FLOOR E85 WITH MEASUREMENT + AGENTS.md item-4 refresh + E85 CLOSED + push delegate.

## Cut ladder

- C1 (a role misses T1 after the first re-pin): ONE second re-pin iteration computed from the post-audit; then accept-with-documentation + residual.
- C2 (E57: 2+ surviving collisions for one role after the single hue-nudge): git restore that role's lever + register the residual for E86+.
- C3 (any unexpected gate re-pin): material divergence -> RECORD + REGISTER (I570 pattern), re-pin WITH MEASUREMENT, continue.

## Risks

- R-1 p50 product nonlinearity under ACES (bake x gain x light is not strictly multiplicative at the median): mitigated by T1 tolerance 8 + C1 second iteration.
- R-2 v2 bake hue drift (different greeble/panel mix shifts the mean hue): caught by E1; the nudge rule keeps identity within one step.
- R-3 drone per-channel hex scaling can drift the hue (steel-cyan identity): H1 clamps channels + 15-degree hue check; drone sits at the TOP of the ladder (184) so a downward pin only increases separation from the mid bands.
- R-4 audit noise between pre/post runs (SwiftShader variance): R1 tolerance 2 + the regression roles are untouched config => any systematic shift flags an environment problem, not a lever.

## Changed-or-proposed files

- src/core/config.js (4 lines: warden.renderLumaGain, stinger.renderLumaGain, flyer.renderLumaGain, drone.palette.body.color - each a value swap, comment refreshed with the I595/I596 measurement).
- .evidence/I595/ (gitignored: luma_audit595.mjs, luma_i595_pre.json, luma_i595_post.json, retune calc + close-gate runner for I597).
- production/scope-check-E85.md (this file) / production/epics.md (E85 block) / production/stories.md (ST-562/563) / production/iterations.md (I595/I596/I597) / production/timeline.md / production/session-state/active.md / CHANGELOG.md / AGENTS.md (item-4 refresh at the G85.0 close).

## Verification evidence

- (filled as ST-562/ST-563 land: pre/post JSONs, the 4 computed levers WITH MEASUREMENT, E57 table, test/build/dist/vendor results, close-gate 5/5, CLOSE FLOOR E85.)

## DoD

1. luma_i595_pre.json + luma_i595_post.json exist, all 13 targets x 2 backdrops, n > 0, console 0/0.
2. Every re-pinned role within T1 (<= 8 p50) of its I519 target; the 9 regression roles within R1 (<= 2 p50) pre vs post.
3. E57 re-check: zero surviving collisions (or a C2-documented residual).
4. npm test 1,237/1,237; npm run build 0; dist re-measured; vendor 4/4 EXACT.
5. G85.0 close gate 5/5 EXACT (zero re-pins expected); CLOSE FLOOR E85 = 7,400,000 - dist WITH MEASUREMENT; AGENTS.md item-4 refreshed (E85 clause at head, E84 demoted to prior); E85 CLOSED (2/2: ST-562/563); push delegated.