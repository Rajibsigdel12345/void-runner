# Void Runner - WebGPU Honest Re-eval in the E56 Higher-Poly Context (I442 / cgs-reverse-document) - ST-412

## Summary
This document re-evaluates, in the NEW higher-poly context created by the E56 asset
remasters (I440 ship v3 12,400 t; I441 rock L/L_B 1,980 t + comet 590 t), the user's
standing suggestion made at the start of E56: "you can switch it to WebGPU from WebGL if
you are on WebGL to make them possible" (i.e. spend more polygons/GPU). VERDICT:
KEEP WebGL2. Do NOT switch. This is the same verdict as ST-401 (I431,
design/webgpu-feasibility.md), RE-DERIVED with the post-E56 numbers rather than
re-quoted: the new evidence (a 5x total-tri remaster shipped on WebGL2 with zero
renderer change and no perf regression) REINFORCES the original decision instead of
weakening it. This is a reverse-document: it describes the observed renderer/FX
architecture from the live tree without inventing unverified behavior. DOCS-only -
zero source, asset, or test changes; the renderer stays WebGL2; there is no silent
switch. Build-on target: design/webgpu-feasibility.md (ST-401) - this doc is the
E56 delta, not a duplicate.

## Observed Behavior
Everything below was re-read from THIS working tree in the I442 session (never
assumed; two historical counts from the ST-401 doc were recounted and are
corrected here):

Renderer (this tree):
- src/main.js:72 - "const renderer = new THREE.WebGLRenderer({ antialias: true,
  powerPreference: 'high-performance' })". The renderer is a WebGLRenderer (WebGL2
  context on r160). No WebGPURenderer is constructed anywhere in src/.

Frozen FX stack (the live per-frame path is the composer, not renderer.render()):
- src/render/bloom.js:3-6 - imports EffectComposer + RenderPass + UnrealBloomPass
  (three/addons/postprocessing/) + local GradePass; src/render/bloom.js:22 -
  "new EffectComposer(renderer)".
- src/render/gradePass.js:41 - "export class GradePass extends OutputPass" (the I334
  bit-identical output grade + config-driven linear-space level curve).
- src/render/starfield.js:139 - "new THREE.ShaderMaterial({...})" (skybox).
- src/render/asteroidRenderer.js:52 and src/render/bossMesh.js:180 -
  "mat.onBeforeCompile = (shader) => {...}" (I257/I272 rim injection, two sites).
- src/core/config.js:582-585 - "bloom: { strength: 0.6, radius: 0.35,
  threshold: 0.72 }" - the FROZEN bloom pin (0.72 threshold is referenced as the
  sub-band/clears-band edge elsewhere, e.g. config.js:100, :516).

Vendor facts (this tree, r160):
- vendor/three.module.js:6 - "const REVISION = '160'".
- vendor/jsm/postprocessing/ = 28 files, ALL WebGL passes (EffectComposer.js,
  RenderPass.js, UnrealBloomPass.js, OutputPass.js, ShaderPass.js, Pass.js, ...).
  NO webgpu/ subdirectory under postprocessing. (I442 recount: 28; the ST-401 doc
  recorded 29 - immaterial, the conclusion holds either way: no vendored WebGPU
  post-processing equivalent exists.)
- vendor/jsm/renderers/webgpu/ = 12 files (top-level WebGPURenderer.js +
  WebGPUBackend.js; nodes/ x3; utils/ x7). The WebGPU renderer node-stack IS
  vendored, but the post-processing that would pair with it is NOT. (I442 recount:
  12; the ST-401 doc recorded 4 - immaterial to the conclusion.)

Geometry ground truth (re-verified against the live test pins this session):
- tests/assetPerf.test.js:50-53 (I441 re-measures) - the full 24-GLB set totals
  19,736 triangles (cap 20,000; 264 tri headroom); totalFilesKB 768 [591.27],
  totalGeoKB 700 [554.94], perFileKB 400 [264.21 = ship].
- tests/assetGlbs.test.js:18 - BUDGETS: ship 14,000 [12,400], L 2,100 [1,980],
  M 520 [500], S 140, comet 650 [590], boss 750 [650].
- Growth vs the ST-401 baseline (3,948 total tris at I430): ship 818 -> 3,254 ->
  12,400; rock L 490 -> 1,980; comet 96 -> 590; total 3,948 -> 19,736 (5.0x).
- Worst-case MEASURED render window (I437 R3, before I440/I441 growth): B
  50 draw calls / 7,872 tris (cumulative 2-render window, fully decomposed in
  .evidence/I437/decomp.json); L 21/3,508; P 10/180. These pins WILL MOVE at I443
  (ST-413 R3) with the new ship + L rocks and will be re-measured + decomposed
  there (predicted B ~32,124 tris = 7,872 + 2x(12,400-3,254) + 4x(1,980-490) -
  a PREDICTION, to be measured, never assumed).

## Evidence Path
- src/main.js:72 (WebGLRenderer construction; no WebGPURenderer in src/).
- src/render/bloom.js:3-6 + :22; src/render/gradePass.js:41;
  src/render/starfield.js:139; src/render/asteroidRenderer.js:52 +
  src/render/bossMesh.js:180; src/core/config.js:582-585 (frozen 0.72).
- vendor/three.module.js:6 (REVISION 160); vendor/jsm/postprocessing/ (28 WebGL
  files, no webgpu subdir); vendor/jsm/renderers/webgpu/ (12 files).
- tests/assetPerf.test.js:50-53 + tests/assetGlbs.test.js:18 (current pins).
- .evidence/I437/decomp.json + decomp.out.txt (I437 measured playframe +
  decomposition recipe; I443 will re-run it).
- design/webgpu-feasibility.md (ST-401 doc this builds on);
  production/scope-check-E56.md (E56 scope + pre-registered flip criteria).
- Web-research findings (LABELED research, not tree-verified; from I427/I431,
  cited in production/scope-check-E54.md): r160 WebGPURenderer does not support
  ShaderMaterial / RawShaderMaterial / onBeforeCompile (re-author as
  NodeMaterial + TSL) and does not support EffectComposer passes (rebuild as a
  TSL node graph on RenderPipeline/PostProcessing); the just-works "three/webgpu"
  + "three/tsl" module entries landed in r171 (Nov 2024); WebGPURenderer support
  is Chrome/Edge 113+ and it auto-falls back to WebGL2 in Firefox/Safari.

## Unknowns
- Exact WebGPU browser coverage at r160 beyond "Chrome/Edge 113+" (research;
  not decision-relevant - the FX incompat is already dispositive).
- The precise TSL node graph that would reproduce the I334 GradePass + the two
  onBeforeCompile rims + the frozen 0.72 bloom (not needed - the incompat is
  already dispositive at r160).
- Future three.js (r171+) WebGPU maturity (out of scope; the vendored tree is
  pinned at r160 and the vendor sha is frozen at 76DEA8151BC9352A).
- Why the ST-401 doc recorded 29 postprocessing / 4 webgpu vendor files vs the
  I442 recounts of 28 / 12 (immaterial; both counts leave "no WebGPU
  post-processing vendored" true).

## Documentation Draft (re-evaluation + recommendation)
The user's suggestion was made when the ship was 3,254 t (v2) and the question was
whether higher-poly remasters were "possible". They now are, and E56 answered it
the cheap way: the remaster SHIPPED on WebGL2 (I440 + I441) with 5.0x the total
tris, no renderer change, no new draw calls, no perf regression, 972/972 tests
green, and dist within its ceiling. That empirical result is the strongest piece
of evidence this re-eval has.

(1) Geometry is NOT the driver. 19,736 total asset tris is a tiny fraction of
what WebGL2 renders comfortably on desktop. The worst measured render window was
7,872 tris / 50 draw calls (I437); even the I443 PREDICTED worst window (~32k
tris, low tens of thousands) is ~3% of a typical ~1M-tri desktop WebGL2 draw
budget, and draw calls (the real CPU cost here) are invariant at 50. If geometry
ever becomes the bottleneck, the pre-registered escape hatches (instancing,
merged static geometry, a real re-pin) all exist BEFORE a renderer switch is
needed.

(2) The frozen FX stack is WebGL-specific on r160 (RESEARCH + tree). A switch at
the vendored revision would require: (a) porting the starfield ShaderMaterial
(starfield.js:139) to NodeMaterial + TSL; (b) porting BOTH onBeforeCompile rims
(asteroidRenderer.js:52, bossMesh.js:180) to TSL; (c) rebuilding the
EffectComposer chain (bloom.js: EffectComposer + RenderPass + UnrealBloomPass +
GradePass) as a TSL RenderPipeline/PostProcessing graph and re-deriving the I334
bit-identical OutputPass grade (gradePass.js:41) in TSL; (d) re-hitting the
FROZEN 0.72 bloom threshold (config.js:585) - i.e. re-verifying the entire frozen
visual identity from scratch; (e) riding the immature r160 node/effects stack
(the just-works r171 "three/webgpu" + "three/tsl" entries are not available
without a vendor upgrade, which is itself a frozen-sha ADR); (f) cutting
Firefox/Safari (RESEARCH: WebGPURenderer auto-falls back to WebGL2 there, so a
switch does not extend reach - those browsers would run the WebGL2 path
regardless).

(3) Vendor freeze. The vendor sha256-16 76DEA8151BC9352A is frozen; the vendored
tree is r160 (vendor/three.module.js:6). Any upgrade past r160 is a separate,
explicit ADR - not part of "switch to WebGPU".

(4) Frozen prior state. The ST-401/I431 verdict (KEEP WebGL2) and the I435-era
pins are frozen; nothing in I440/I441 invalidated them - the new evidence
reinforces them (5x tris shipped fine on WebGL2).

RECOMMENDATION: KEEP WebGL2. Do NOT switch. No silent switch - this decision is
recorded here and in the E56 scope-check.

FLIP CRITERIA (pre-registered from production/scope-check-E56.md; re-confirmed at
I442). Revisit a WebGPU switch only if ANY of these materializes:
  F1 - Geometry driver: sustained per-frame draw need > ~200k tris (~6x the
       current 20,000 tri cap and ~15x the predicted I443 worst window) - not a
       one-off asset spike (those are what re-pins are for).
  F2 - FX equivalents: the vendor is explicitly upgraded to r171+ (a separate
       frozen-sha ADR) AND stable TSL-era FX equivalents reproduce the frozen
       identity - r171+ "three/webgpu" + "three/tsl" with pass() + bloom()
       reproducing the frozen 0.72 bloom + the I334 grade, verified by a CG A/B
       gate - AND the FX identity is consciously re-scoped (0.72 + I334
       de-frozen by explicit decision).
  F3 - Mandate: an explicit user decision to switch, made with the reach tradeoff
       on the table (at r160, Firefox/Safari would still run the WebGL2 fallback
       path - the switch buys nothing for them).

## Risks
- If a future task assumes "WebGPU available", it may plan work on the wrong
  renderer; this doc + design/webgpu-feasibility.md are the source of truth that
  the renderer is WebGL2.
- If the vendor IS ever upgraded past r160 (F2 territory), the "keep WebGL2"
  rationale must be re-checked from scratch; do not treat this verdict as
  permanent across a vendor upgrade.
- Frozen identity risk: any partial WebGPU attempt that re-implements
  bloom/grade is very likely to regress the 0.72 threshold / I334 grade - the
  failure mode this decision avoids.
- The I443 playframe re-measure (R3) may show the predicted B ~32,124 tris; if
  the MEASURED value materially exceeds it, the decomposition (never a silent
  pin move) is the path, and F1's ~200k-tri bar is still ~6x away.

## Changed files or proposed files
- docs/architecture/webgpu-re-eval-E56.md (NEW - this file, the ST-412
  deliverable).
- Bookkeeping (I442): production/stories.md (ST-412 [PENDING I442] -> DONE +
  STATUS line), production/epics.md (E56 note), production/iterations.md
  (I442 entry), production/timeline.md (I442 line), CHANGELOG.md (I442 entry),
  production/session-state/active.md (I442 note).
- Zero source / asset / test changes. Renderer stays WebGL2.

## Verification evidence
- DOCS-only gate (re-run at I442): npm test 972/972 + npm run build 0 + dist
  byte-identical (2,407,614 B / 138 files) + vendor sha256-16 76DEA8151BC9352A
  unchanged + hygiene (no servers, no chrome, node-only).
- Every "Observed Behavior" / "Evidence Path" line above was re-read from the
  tree in this I442 session, including the two corrected vendor recounts (28
  postprocessing files; 12 renderers/webgpu files).
- Research claims (r160 WebGPURenderer ShaderMaterial/EffectComposer/onBefore
  Compile incompat; r171 "three/webgpu"+"three/tsl" just-works; Chrome/Edge 113+;
  auto WebGL2 fallback in Firefox/Safari) are LABELED as web-research findings
  (originally I427/I431, scope-check-E54.md), distinct from tree-verified facts.
- The ~32,124-tri predicted I443 B-window figure is LABELED as a prediction
  (arithmetic from the I437 decomposition), to be measured at I443 R3.

## Next owner or decision
Decision: KEEP WebGL2 (ST-412 closed as its pre-registered expected outcome:
re-eval doc + keep, no silent switch). Next: ST-413 (I443) = fresh R1-R5 +
G56.0 gate + close E56 (cgs-regression-suite + cgs-gate-check +
cgs-milestone-review; harnesses at .evidence/I437/): R1 causal p1 EXACT seed
9876 / R2 rockab EXACT 2.2/1.3/0.7 / R3 playframe RE-MEASURED + decomposed +
ship A/B view (L+B WILL MOVE) / R4 PWA 11/11 / R5 code+build+dist+vendor+hygiene.
