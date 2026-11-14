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