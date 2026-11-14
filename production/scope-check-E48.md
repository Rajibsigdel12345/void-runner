# Scope Check - E48 Boot & Transition Shader Compile Warm-up (cgs-scope-check, I399)

## Summary
E48 = the renderer compile/warm-up pass: pre-compile shader programs (and, if proven, one
hidden warm-up render) so first-use shader-compile cost does not land on the user-visible
frame. This is the I95-deferred "offscreen warm-up render" (production/memory-audit.md:
"Deferred decision (unchanged): I95 offscreen warm-up render - owner"), unowned since E8.
Render-layer only (src/main.js); zero sim, zero assets, zero pixel change, no frozen pin re-pin.

## Surface & Evidence
- src/main.js (1006 lines) verified line-by-line: no renderer.compile(), no warm render, no
  pre-warm anywhere. frame() starts at the very end of the file; GLB assets load fire-and-forget
  (all ready < 2.2 s on localhost per the I399 sweep s0), but their materials' shader programs
  compile lazily on first render use.
- I399 full regression sweep (.evidence/I399/full_sweep.mjs + full_sweep.json):
  - s3 MENU -> PLAYING transition (Enter + Space hold + dense staging): one 71.5 ms frame spike
    at frame 4 post-Enter = combat-only material first uses (bullets/enemies) = the target signal.
  - s0 boot: the rAF sampler misses the pre-rAF boot cost (first frame dt=null; steady-state
    ~17 ms under SwiftShader) -> the boot metric needs in-page performance marks or a
    boot-timing probe (decided at ST-370).
- Grounding: local probes primary. Bounded YouTube (I399, 3 queries / 20 raw, GENERIC, unverified
  label for this micro-decision): only relevant signal = STRK Tech "High FPS but Your Game Still
  Stutters?" (LZmLZFXtsMg) ch 6:06 "Storage & Shaders" - shader compilation named as a stutter
  cause (generic corroboration only).

## Scope Fit
- One bounded surface (boot + transition frame cost), render-layer only, 4-iteration budget
  (I399..I402), two pre-registered cut gates, zero sim/asset/pixel change, no re-pins.
- Dist headroom 178,155 B >= 102,400 B (few lines of code; no asset; 0 B asset delta - no Blender).
- FEEL untouched: the warm-up happens before/invisible to gameplay frames; no timing change.
- Rejected/checked surfaces: E12's 3 flags (FX-off tier / DPR / tier-sync) DONE in E12 (ST-224/225);
  hardware-pending checklist = human/QA owner (out of bot scope); own-side art surface exhausted
  (E44/E45/E47 closed); PWA headroom fine.

## Stories (budget I399..I402, gate G48.0 at I402)
- ST-369 (I399): close E47 (CUT branch, docs-only) + E48 before-scan + full regression sweep +
  open E48. [DONE at I399]
- ST-370 (I400): warm-up implementation (cgs-dev-story): decide the metric first (s3 spike via
  the rAF sampler; s0 boot via in-page performance marks or a boot-timing probe), then implement
  W1 (renderer.compile(scene, camera) at boot before the first frame) and/or W2 (compile + hidden
  render on PLAYING entry or the wave-1 intermission); CG1 check; 929/929 + build 0 + smoke.
- ST-371 (I401): A/B measure + selection or CUT (cgs-dev-story): pre-registered CG2 margin -
  >= 25% reduction of the measured transition spike frame (or p90 of the first 60 frames
  post-transition) AND no steady-state regression > 5% (60-frame dt compare); select W1/W2/both;
  else revert + CUT docs-only.
- ST-372 (I402): regression + G48.0 + close (cgs-regression-suite + cgs-gate-check +
  cgs-milestone-review): R1 p1 EXACT causal / R2 rockab EXACT fresh / R3 playframe probe fresh
  (21/366 + 50/1222 EXACT + FLOOR-50 + floorab) / R4 PWA 11/11 fresh / R5 quality bar + hygiene +
  (if not CUT) boot/transition metrics in-band.

## Pre-registered Cut Gates
- CG1 (ST-369/ST-370): if the boot/transition cost cannot be isolated/measured reliably headless
  (SwiftShader distortion), or compile-at-boot proves net-zero (cost merely moved to page load)
  -> CUT docs-only and close E48.
- CG2 (ST-371): the warm-up must beat the pre-registered margin against the measured baseline
  (s3 spike 71.5 ms frame; s0 boot pending quantification); else revert + CUT docs-only.
  A clean no-change CUT is an acceptable outcome (anti-over-engineer).

## Deferrals
- Hardware-pending perf checklist (physical device, human owner).
- E12's 3 adaptive-quality flags (already done in E12).
- Any art/asset surface (exhausted: E44/E45/E47; no Blender re-bake in this epic).

## Verification Plan
- Per iteration: npm test (929/929) + npm run build 0 + dist 131/1,918,997 B (or documented
  delta) + vendor sha 76dea8151bc9352a + hygiene (chrome 0, ports 5173/4173/5199 free, node 13).
- G48.0 at I402: R1-R5 as in the stories above.

## Risks
- R-E48-1 SwiftShader (headless) distorts shader-compile cost; the measured margin may not
  transfer to real GPUs (CG1 guards; document honestly).
- R-E48-2 compile-at-boot moves cost to page load (net-zero for the user) -> CG1.
- R-E48-3 a hidden warm render adds one frame of work; the adaptive-quality monitor must not
  count it as a slow frame (reset renderer.info around it, or prefer compile-only W1).
- R-E48-4 no frozen pin re-pin (render-only, no pixel change, no new steady-state draw calls;
  the frozen playframe stagings are post-warm frames).

## Recommendation
PROCEED - bounded, evidence-backed, render-only surface with two pre-registered cut gates.

## I400 Finding (ST-370)
- Metric decided FIRST: primary = the s3 MENU->PLAYING transition spike via the rAF sampler (I399 baseline 71.5 ms, frame 4 post-Enter); s0 boot pre-rAF cost is invisible to the rAF sampler -> measured externally (navToReady ms + in-page 120-frame sampler), informational. No measurement code ships.
- W1 (renderer.compile after loadAll settles) implemented and measured in .evidence/I400/full_sweep.json: the 71.5 ms spike PERSISTS at 77.4 ms (frame 4; cross-session drift ~+6) and programs go 43 -> 44 during the transition. The spike is therefore NOT pure program compilation: first geometry buffer uploads + the 44th program land on the first combat frames.
- 44th-program suspect (to be named in I401 via renderer.info.programs cacheKey diff): the MeshStandardMaterial env-map variant - the fire-and-forget skybox load sets scene.environment (PMREM IBL) in onReady, which can land AFTER warmCompile, changing every standard material's program cache key.
- W2 design (I401, the I95 surface "one hidden warm-up render", now proven): (1) gate on BOTH loadAll settle AND skybox ready (with a 4 s fallback for the skybox-failure path, which never sets ready); (2) 1x1 WebGLRenderTarget + force-visibility of all visible=false objects for one offscreen render (first geometry uploads + remaining compiles happen at boot; 1x1 = no screen flash, ~zero rasterize); (3) R-E48-3 guard: renderer.info.reset() around the warm render (boot = MENU, so adaptive.noteFrame never sees it - double protection).
- Placement analysis: PLAYING-entry placement would either add ~80 ms input latency (keypress) or move the spike to frame 0 of the CG2 60-frame window (first-frame placement) - neither passes CG2's spike criterion. BOOT placement is the only variant that removes the spike from the transition window entirely -> selected for I401 (a documented refinement within the epic surface: the scope-check's "one hidden warm-up render" was pre-registered, and boot is the I95 surface's original location - during menu load).
- CG1: NOT triggered (measurement reliable: spike reproducible frame-exact across sessions). R-E48-2 net-zero question: boot placement moves the one-shot cost onto menu load - treated as a different UX moment (waiting for the menu vs mid-combat stutter); the I401 A/B quantifies boot delta (navToReady + first-frame dt) vs transition gain and documents the interpretation if W2 is kept.
- CG2 operative-criterion note: p90-of-first-60 is insensitive to a single spike (1 slow frame of 60 -> p90 ~ 17 ms); the operative criterion is effectively the spike frame (max of first 60). Documented here as the decision interpretation; both are reported in the A/B.

## I401 Finding (ST-371)

- W2 implemented as designed (both-settle gate: loadAll settle AND skybox ready, 4 s fallback; 1x1 force-visibility hidden render with renderer.info.reset() guards; boot placement). Root cause NAMED by the A/B cacheKey diff: arm A's 4 mid-transition programs are 2x BasicMaterial (srgb variant) + 2x MeshStandardMaterial (the 131079/131075 envMap-on/off flag flip, one = the asteroid-rim onBeforeCompile) - exactly the predicted skybox-PMREM-IBL cache-key change landing AFTER warmCompile.
- Same-session A/B (.evidence/I401/ab_probe.mjs, headless SwiftShader, 1280x720, 3 arms x 3 pages, VERDICT PASS, console 0/0). s3 MENU->PLAYING transition spike (max of frames 1-60):

  | arm | spike (frame 4) | programs mid-transition | steady p50/p90 (fr 31-90) | CG2 |
  |---|---|---|---|---|
  | A (baseline) | 91 ms | 14->18 (+4 new, named above) | 17.7 / 18.7 | ref |
  | B (W1) | 69 ms | 23->23 (+0) | 17.7 / 18.9 | FAIL (24.2% < 25%) |
  | C (W1+W2) | 23.3 ms | 44->44 (+0 new) | 17.8 / 18.6 | PASS (74.4%; reg +0.6%/-0.5%) |

- SELECTION: C (W1+W2) KEPT. The env-variant programs compile at boot (44 total), so 0 appear mid-transition - the 91 ms hitch (4 env-variant recompiles) collapses to 23.3 ms ~= steady state.
- CG2 interpretation notes: (1) the operative criterion is the spike frame (max of first 60), since p90-of-60 is insensitive to a single slow frame (documented in the I400 section); arm C's spike frame 23.3 ms is the pass signal. (2) R-E48-2 (boot placement moves the one-shot cost onto menu load = a different UX moment than a mid-combat stutter): boot navToReady A 2191 / B 937 / C 1942 ms, boot max120 A 26.8 / B 19.4 / C 19.9 ms, programsAtBootEnd C 44 - the C cost is spread over the menu-load frames (no single >20 ms frame after the first) rather than a 91 ms mid-combat spike; documented as the accepted interpretation of the pre-registered net-zero clause. (3) Same-session arm A is the reference baseline (cross-session drift can move unchanged cells up to ~+8.76 ms, so an arm-A vs arm-C comparison within one probe run is the valid CG2 math).
- Frozen pin held: MENU fx-off 21/366 on all three arms (R-E48-4).
## I402 Gate (G48.0) - cgs-gate-check

- Gate criteria: R1-R5 fresh (p1 EXACT causal / rockab EXACT / playframe EXACT 21/366 + 50/1222 with the W1+W2 warm code present = R-E48-4 no-persistent-state / PWA 11/11 / quality bar + hygiene) + W1+W2 selection ratified by the I401 same-session A/B (CG2 74.4% PASS, CG1 not triggered) + I95 offscreen-warm-up deferral owned.
- Evidence: .evidence/I402/ (causal.json, probe_i375.json + 2 screenshots, pwa run transcript in iterations I402). R1 18/18 checks ok + CAUSAL PASS; R3 A 21/366 EXACT, B 50/1222 EXACT, floor p50 32.2/p90 72.28 (frozen 72.07, +0.21 documented render noise), sky 70.14, FLOOR-50 rings 49.04/48.32/38.54/24.41, spot 112.43/54.26; R4 SUMMARY 11/11 passed; R5 929/929 + build 0 + dist 131/1,919,653 B (headroom 177,499 B >= 102,400 B) + vendor sha256-16 76DEA8151BC9352A + chrome 0 / ports free / node 13.
- Concerns: none blocking. The I401-documented boot cost (navToReady 1942 ms, cost moved from mid-combat to menu load) is the accepted trade; cross-session drift up to ~+8.76 ms on unchanged perf cells is the standing caveat (this gate used same-probe same-session comparisons only).
- VERDICT: G48.0 PASS -> E48 CLOSED at I402 (W1+W2 kept; s3 spike 91->23.3 ms, 0 new programs mid-transition, all 44 programs compiled at boot). The I95 offscreen-warm-up render deferral (unowned since E8) is now OWNED + CLOSED by E48: W2 IS the offscreen warm-up render (1x1 WebGLRenderTarget force-visibility hidden render, both-settle gated, non-fatal).