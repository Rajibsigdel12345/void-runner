# Void Runner - WebGPU Feasibility (I431 / cgs-reverse-document) - ST-401 COMPLETE

## Summary
This document formalizes the ST-401 (I431) WebGPU feasibility question for Void Runner:
"can we switch the renderer from WebGL2 to WebGPU (so we can spend more polygons/GPU,
e.g. for the E55 ship/airship remaster)?" VERDICT: KEEP WebGL2. Do NOT switch.
three.js r160 (the vendored revision) cannot run this game's frozen FX stack on
WebGPU, and the switch would buy nothing for the stated goal - a few thousand
triangles is trivially within WebGL2. This is a reverse-document: it describes the
observed renderer/FX architecture and the feasibility decision without inventing
unverified behavior. No source, asset, or test changes; renderer stays WebGL2.

## Observed Behavior
Everything below was verified directly in this working tree (grep/read of the
vendored three r160 + src/render), NOT assumed.

Renderer + FX stack that is FROZEN (changing any of it regresses shipped identity):
- src/render/bloom.js:3-6 - imports EffectComposer + RenderPass + UnrealBloomPass
  (from three/addons/postprocessing/) and GradePass (local). The game's real
  per-frame render is composer.render() (the EffectComposer), driven from
  src/main.js (~L1119); the plain renderer.render() is NOT the live path.
- src/render/gradePass.js:41 - "export class GradePass extends OutputPass". The I334
  bit-identical output grade: same tone mapping + output color space as the vendor
  OutputPass, plus a config-driven linear-space level curve. FROZEN identity.
- src/render/starfield.js:139 - "new THREE.ShaderMaterial({...})" (the skybox uses a
  custom ShaderMaterial).
- src/render/asteroidRenderer.js:52 and src/render/bossMesh.js:180 -
  "mat.onBeforeCompile = (shader) => {...}" (the rim/glow shader injection, I257/I272
  pattern).
- The FROZEN bloom threshold is 0.72 (frozen pin; do not move).

Vendor facts (this tree):
- vendor/three.module.js:6 - "const REVISION = '160'".
- vendor/jsm/postprocessing/ = 29 WebGL-only pass files (EffectComposer.js,
  RenderPass.js, UnrealBloomPass.js, OutputPass.js, ShaderPass.js, Pass.js, ...).
  There is NO vendored WebGPU post-processing equivalent.
- vendor/jsm/renderers/webgpu/ = 4 files (the WebGPU renderer node-stack IS vendored),
  but the postprocessing it would pair with (above) is not.

Asset tri budget (measured, I430 re-measure in tests/assetPerf.test.js): the full
set of 24 GLBs is 3,948 triangles total; the largest single file is boss.glb at
77,068 B / 650 tris. WebGL2 renders this in a single frame with enormous headroom.

## Evidence Path
- vendor/three.module.js:6 (REVISION 160).
- src/render/bloom.js:3-6 (EffectComposer/RenderPass/UnrealBloomPass/GradePass import
  block) + :22 "new EffectComposer(renderer)".
- src/render/gradePass.js:41 (extends OutputPass) + :3-15 header (I334 bit-identical).
- src/render/starfield.js:139 (ShaderMaterial).
- src/render/asteroidRenderer.js:52, src/render/bossMesh.js:180 (onBeforeCompile).
- vendor/jsm/postprocessing/*.js (29 files, all WebGL; no webgpu/ subdir there).
- vendor/jsm/renderers/webgpu/ (4 files present).
- tests/assetPerf.test.js:46-74 (tri/size caps) + the I430 re-measure comment (3948
  tris).
- production/scope-check-E54.md "WebGPU feasibility" section (the web-research
  findings this doc formalizes; research was done at I427/I431, verdict identical).

## Unknowns
- Exact WebGPU browser coverage at r160 beyond "Chrome/Edge 113+" (not needed for the
  decision - Firefox/Safari would fall back to WebGL2 anyway, so a switch would not
  even reach them in WebGPU mode).
- The precise node-graph shape needed to re-implement the I334 GradePass + the two
  onBeforeCompile rims in TSL (not needed - the incompat is already dispositive).
- Future three.js (r171+) WebGPU maturity: unknown and out of scope; the vendored
  tree is pinned to r160 and the vendor sha is frozen (76DEA8151BC9352A).

## Documentation Draft (feasibility analysis + recommendation)
Web research (threejs.org WebGPURenderer manual + migration guides + forum; done at
I427, cited in scope-check-E54.md; these are RESEARCH findings, not tree-verified):
WebGPURenderer does NOT support (a) ShaderMaterial / RawShaderMaterial /
onBeforeCompile - those must be re-authored as NodeMaterial + TSL (three/tsl); and
(b) EffectComposer passes - those must be rebuilt as a TSL node graph on
RenderPipeline / PostProcessing (pass() + bloom()). The just-works "three/webgpu" +
"three/tsl" module entry points landed in r171 (Nov 2024); r160 predates them and
still uses the experimental manual node wiring.

Applying that to the FROZEN FX stack observed above, a switch would require:
1. Port the starfield ShaderMaterial (starfield.js:139) to NodeMaterial + TSL.
2. Port BOTH onBeforeCompile rims (asteroidRenderer.js:52, bossMesh.js:180) to TSL.
3. Rebuild the EffectComposer chain (bloom.js: EffectComposer + RenderPass +
   UnrealBloomPass + GradePass) as a TSL RenderPipeline/PostProcessing graph, and
   re-derive the I334 bit-identical OutputPass grade (gradePass.js:41) in TSL.
4. Re-hit the FROZEN 0.72 bloom threshold + the I334 bit-identical GradePass - i.e.
   re-verify the entire frozen visual identity from scratch.
5. Ride the immature r160 node/effects stack (r171-era just-works is not available
   without a vendor upgrade, which is itself a frozen-sha regression).
6. Cut Firefox/Safari: WebGPURenderer auto-falls back to WebGL2 there, so those
   browsers would run the WebGL2 path regardless - the switch does not extend reach.

Cost/benefit: steps 1-6 are a large, risky rewrite of the frozen FX identity; the
benefit for the stated goal (spend more polygons/GPU for the E55 ship remaster) is
ZERO - WebGL2 already renders the current 3,948 asset tris trivially, and the E55
ship (a detailed low-poly airship, likely a few hundred to low-thousand tris) fits
with headroom to spare. A SwiftShader WebGPU probe would not be informative
(SwiftShader has no WebGPU, and the ShaderMaterial/EffectComposer incompat is already
dispositive from the code above).

RECOMMENDATION: KEEP WebGL2. Do NOT switch to WebGPU in this project stage. A real
switch is only revisitable if/when (i) the vendor is upgraded to r171+ (a separate,
explicit ADR that re-examines the frozen vendor sha), AND (ii) the FX stack is
consciously re-scoped (bloom threshold + I334 grade de-frozen), AND (iii) a concrete
WebGL2 perf ceiling is actually hit (none is, at 3,948 tris).

## Risks
- If a future task assumes "WebGPU available", it may plan work on the wrong
  renderer; this doc is the single source of truth that the renderer is WebGL2.
- If the vendor IS ever upgraded past r160, the "keep WebGL2" rationale must be
  re-checked (r171+ WebGPU is materially more capable); do not treat this verdict as
  permanent across a vendor upgrade.
- Frozen identity risk: any partial WebGPU attempt that re-implements bloom/grade is
  very likely to regress the 0.72 threshold / I334 grade; that is exactly the failure
  mode this decision avoids.

## Changed files or proposed files
- design/webgpu-feasibility.md (NEW, this file - the ST-401 deliverable).
- production/scope-check-E54.md (ST-401 marked DONE at I431; pointer to this file).
- production/stories.md (ST-401 [PENDING I431] -> [DONE at I431]; STATUS header I431).
- production/epics.md (E54 Status: ST-401 DONE at I431; next ST-402/I432).
- production/iterations.md (I431 entry), production/timeline.md (I431 line),
  production/session-state/active.md (I431 note), CHANGELOG.md (I431 entry).
- Zero source / asset / test changes. Renderer stays WebGL2.

## Verification evidence
- DOCS-only: no src/asset/test touched, so the code gate is unchanged - npm test
  972/972 + npm run build 0 re-run at I431; dist unchanged from I430 (138 files /
  2,110,034 B) + vendor sha256-16 76DEA8151BC9352A unchanged.
- Every "Observed Behavior" / "Evidence Path" line above was re-read from the tree
  in this session (REVISION 160; bloom.js import block; gradePass.js:41 extends
  OutputPass; starfield.js:139 ShaderMaterial; asteroidRenderer.js:52 +
  bossMesh.js:180 onBeforeCompile; 29 WebGL-only postprocessing files; 4
  renderers/webgpu files).
- Research claims (WebGPURenderer ShaderMaterial/EffectComposer incompat; r171
  three/webgpu+tsl; Chrome/Edge 113+ r160 support; auto WebGL2 fallback) are LABELED
  as web-research findings (scope-check-E54.md), distinct from tree-verified facts.

## Next owner or decision
Decision: KEEP WebGL2 (ST-401 CLOSED as its pre-registered expected outcome:
document + keep). Next: ST-402 (I432) = fresh R1-R5 + G54.0 gate + close E54
(cgs-regression-suite + cgs-gate-check + cgs-milestone-review); this is also where
the deferred playframe B re-measure happens (ship always rendered). E55 (ship
"real airship" remaster) is the next epic, opened after I432.