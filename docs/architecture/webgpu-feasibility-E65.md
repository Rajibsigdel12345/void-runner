# Void Runner - WebGPU / Vendor r171+ Feasibility (E65 Open / I492) - ST-459

## Summary
This document is the ST-459 deliverable that opens E65 (production/epics.md
E65 block; opened by the I472/ST-439 pre-registered trigger branch).
Question: is a move from the vendored three r160 + WebGL2 stack toward
r171+ (WebGPU) now technically feasible, and is it worth it?
VERDICT: TECHNICALLY FEASIBLE at r187 (the bloom() TSL node + RenderPipeline
+ a custom TSL grade all exist and are documented), but it is a LARGE rewrite
of the frozen FX identity with ZERO geometry benefit (F1 unmet) and NO reach
benefit (WebGPURenderer auto-falls back to WebGL2, so one codebase already
covers every user). RECOMMENDATION: KEEP WebGL2 (Option A) unless a concrete
WebGL2 perf ceiling is measured on real hardware or WebGPU-exclusive features
are wanted. The actual switch remains GATED on an explicit user decision
(F3). This is a decision artifact, not a commitment to switch.
Build-on targets (not re-quoted, not duplicated): design/webgpu-
feasibility.md (I431, tree-verified r160 incompat), docs/architecture/
webgpu-re-eval-E56.md (F1/F2/F3 criteria), docs/architecture/webgpu-re-
eval-E61.md (I472 post-remaster re-derivation + trigger record), production/
scope-check-E61.md (pre-registered decision matrix).
Labels: [TREE] = verified in this working tree at I492. [WEB] = web
research at I492 (three.js releases / manual / addons source), NOT
tree-verified.

## Current tree state (I492, [TREE])
- Vendor: three r160; vendor/three.module.js:6 REVISION '160'; sha256
  first-16 76DEA8151BC9352A (working copy + dist identical).
- Renderer: THREE.WebGLRenderer({ antialias, powerPreference:
  'high-performance' }) @ src/main.js:88; no WebGPURenderer anywhere in
  src/.
- Frozen FX stack (changing any of it regresses shipped identity):
  - src/render/bloom.js:3-6 - EffectComposer / RenderPass /
    UnrealBloomPass / GradePass import block; the EffectComposer is the
    live per-frame render path (main.js). Frozen bloom params:
    strength 0.6 / radius 0.35 / threshold 0.72.
  - src/render/gradePass.js:41 - class GradePass extends OutputPass;
    the I334 bit-identical output grade + config-driven linear-space
    level curve.
  - src/render/starfield.js:202 - new THREE.ShaderMaterial (skybox).
  - src/render/asteroidRenderer.js:52 and src/render/bossMesh.js:257 -
    onBeforeCompile rim/glow injections.
  (Line refs re-verified at I492; the I431 doc's starfield.js:139 /
  bossMesh.js:180 citations are STALE - the files grew in later epics.
  bloom.js:3-6 and gradePass.js:41 are unchanged.)
- Assets: 28 GLBs / 1,267,388 B / 34,938 tris (ship v5 17,143 t; hunter
  2,256 / gunship 2,268; sentry 1,096 / wasp 792; + 22 more).
- dist 3,173,343 B / 166 files (ceiling 3,250,000).

## Vendor landscape (I492, [WEB])
- Latest stable: three@0.187.0 (r187), published 2026-10-30; previous
  r186 (2026-09-08). 2026 release cadence ~7-11 weeks. r160 is ~27 minor
  revisions behind.
- three/webgpu + three/tsl just-works entry points landed r171
  (2024-11-29): one import, no bundler or polyfill; init via
  renderer.setAnimationLoop(...) or await renderer.init().
- WebGPURenderer is still documented "experimental" but with "maturity
  greatly improved". WebGLRenderer remains maintained and is the
  "recommended choice for pure WebGL2" but has "no plans to add larger
  new features" - project focus is the WebGPU renderer. In recent
  releases the large majority of changed lines sit on the WebGPU/TSL
  side (public TSL exports grew 638 -> 682 -> 819 across r185-r187).
- forceWebGL: true constructor option exists for testing the fallback
  path.

## FX reproduction path on r171+ (I492, [WEB])
1. Post-processing: RenderPipeline (the name since r183; before that
   it was PostProcessing - the old name warns) replaces EffectComposer
   for WebGPURenderer. Pattern:
       const rp = new THREE.RenderPipeline(renderer);
       const scenePass = pass(scene, camera);
       rp.outputNode = scenePass.color
           .add(bloom(scenePass.color, 0.6, 0.35, 0.72));
       rp.render();
   Tone mapping, sRGB, and resize are handled automatically by the
   pipeline; to insert custom grade / FXAA AFTER the standard output
   transform, set renderPipeline.outputColorTransform = false and
   route through a manual renderOutput(...) node.
2. Bloom: the TSL bloom() node (three/addons/tsl/display/BloomNode.js)
   takes (inputNode, strength, radius, threshold) - a DIRECT parameter
   map to the frozen 0.6 / 0.35 / 0.72. Selective bloom is available via
   MRT + emissive channels if the full-frame pass is ever re-scoped.
   CAVEAT: TSL bloom is a different algorithm from UnrealBloomPass -
   the parameters mapping 1:1 does NOT guarantee identical pixels. The
   CG A/B gate (E65 precondition) is exactly what proves or disproves
   reproduction.
3. I334 grade: GradePass's linear-space level curve re-implements as a
   custom TSL node (or a LUT node where a 3D LUT suffices), applied
   after renderOutput().
4. ShaderMaterial / onBeforeCompile (starfield.js:202,
   asteroidRenderer.js:52, bossMesh.js:257): NOT supported on
   WebGPURenderer - must be re-authored as NodeMaterial + TSL. Confirmed
   incompat, unchanged since the I431 tree verification.

So the technical reproduction path now exists and is documented. What it
costs is the work itself: re-author 1 ShaderMaterial + 2 onBeforeCompile
rims + the whole FX chain in TSL, re-verify the frozen 0.72 bloom + I334
grade from scratch under a CG A/B gate, and re-pin the vendor sha.

## Reach tradeoff (I492, [WEB])
WebGPU is now the DEFAULT in: Chrome/Edge 113+ (Windows / macOS /
ChromeOS); Linux v144 (Intel) / v147 (NVIDIA); Chrome Android 121+;
Firefox 141 (Windows) / 145 (macOS Apple Silicon) / 147 (all Apple-
Silicon Macs; Linux + Android still behind a flag); Safari 26 (Sep 2025,
all Apple platforms). Where WebGPU is unavailable, WebGPURenderer
FALLS BACK TO WebGL2 automatically - one codebase covers every user.
Consequence: the switch does NOT extend reach in either direction; it is
a perf / modernization play, not a reach play. (The E61 doc's note that
"at r160 Firefox/Safari would still run the WebGL2 fallback path - the
switch buys nothing for them" remains true, with the modern WebGPU
baseline now far wider than it was at r160.)

## Vendor migration cost r160 -> r187 (I492, [WEB])
Breaking-ish items seen across the 27 revisions (selection, not
exhaustive):
- r186: removed PCFSoftShadowMap + rangeFog + viewportResolution TSL
  export + minified builds.
- r187: removed CubeUVReflectionMapping + r177-deprecated code;
  ColorManagement.fromWorkingColorSpace / toWorkingColorSpace removed
  (deprecated r177); setViewport / setScissor no longer scale by
  pixel-ratio when a render target is bound; iridescenceThicknessRange
  deprecated; Object3D pivot / applyMatrix4 behavior changes.
src/ scan at I492 ([TREE]): none of the removed APIs above is used
anywhere in src/ (the only ColorManagement mention is a comment at
src/core/floorGrid.js:13) - the only r160-era surfaces at risk are the
frozen FX stack itself. A fresh frozen-sha vendor ADR is mandatory (F2
precondition) for any option that touches the vendor.

## F1/F2/F3 status re-derivation (I492)
- F1 geometry: UNMET. 34,938 tris static across 28 GLBs (up from
  33,050 / 26 GLBs at I472 - E63 sentry/wasp + E64 campaign additions).
  The dense one-off window measured at I472 was 44,740 tris / 314 draw
  calls per frame (4.4x UNDER the ~200k sustained bar, and explicitly a
  one-off spike, which F1 excludes). E63/E64 added campaign-gated pools
  of existing scale - not a geometry driver.
- F2 FX equivalents: still UNMET as a state (no r171+ vendor, no ADR, no
  CG A/B run) - but this document makes the reproduction path CONCRETE:
  the exact node, the exact parameters, and the exact incompat list are
  now identified, so a future switch epic has a work plan, not a guess.
- F3 mandate: OPEN. The user's conditional mandate ("switch to WebGPU if
  needed to make high-poly assets possible") is already SATISFIED without
  a switch: the E61 ship v5 remaster (17,143 tris, the "real airship")
  shipped on WebGL2 with a bounded +0.5 ms / 0 draw-call dense-window
  delta (I472 busy472 A/B, SwiftShader = a SLOWER-than-real-GPU bound).
  No outstanding asset request requires WebGPU.

## Decision matrix (what the user is choosing, on the table per F3)
Option A - KEEP r160 + WebGL2 (status quo; RECOMMENDED).
  Zero risk to the frozen identity; vendor stays frozen; three.js
  advances without us (WebGL renderer is maintenance-only now).
Option B - Vendor upgrade r160 -> r187, KEEP WebGL2Renderer.
  Smaller step: the frozen FX stack (EffectComposer / UnrealBloomPass /
  OutputPass / ShaderMaterial / onBeforeCompile) still exists on the
  WebGL2 side, and none of the r186/r187 removals above is used by src/
  ([TREE] scan). Cost: fresh frozen-sha vendor ADR + CG A/B
  re-verification of the frozen 0.72 bloom + I334 grade against the new
  vendor (pass implementations drift between revisions) + full quality
  bar re-run. Buys: modern three (bug fixes, perf, future optionality).
Option C - Full WebGPU switch (r171+, WebGPURenderer).
  Everything in B, plus the TSL re-author (starfield + 2 rims + FX chain
  as a RenderPipeline) and the CG A/B gate on the REPRODUCED identity.
  Buys WebGPU-exclusive features (SSGI / SSS / compute / 3DGS) if ever
  wanted; reach is unchanged (auto WebGL2 fallback).
GATING: B and C are each a SEPARATE follow-up epic. Preconditions for
either: an explicit user decision (F3) + a fresh frozen-sha vendor ADR +
a CG A/B gate BEFORE any look ships. E65 itself commits to neither.

## RECOMMENDATION
KEEP WebGL2 (Option A) for now. The switch is technically feasible (the
path is concrete) but expensive against a frozen identity, with zero
geometry benefit (F1 unmet) and no reach benefit (auto fallback).
Revisit on: (i) a measured WebGL2 perf ceiling on REAL hardware (the
SwiftShader 8-9 ms busy-window median is a harness artifact, not a GPU
wall - recorded as a bar caveat since I472), (ii) a request for
WebGPU-exclusive features, or (iii) a vendor-level need (bug /
security). At that point Option B is the lower-risk first step; Option C
only with the full TSL re-author budgeted. The actual switch stays GATED
on the user's decision; E65 remains a decision artifact until then.

## Risks
- Stale research: [WEB] findings are point-in-time (r187, 2026-11);
  three.js moves on a 7-11 week cadence - re-verify at DECISION time (and
  again at switch time if months pass), not by re-reading this doc.
- Frozen identity: any partial WebGPU / vendor attempt WITHOUT the CG A/B
  gate risks corrupting the frozen look (0.6/0.35/0.72 + I334). The gate
  is a precondition, not a QA afterthought.
- "Feasible" misread as "should switch": the feasibility verdict (yes at
  r187) and the cost/benefit verdict (not yet) are separate sections;
  the recommendation carries the latter.
- Strategic drift: staying on r160 means a frozen, maintenance-era
  renderer while three.js invests elsewhere. Acceptable while the game
  ships unchanged; the upgrade cost (B or C) grows slowly with each
  revision.

## Evidence
- [TREE] I492: vendor REVISION 160 + sha256-16 76DEA8151BC9352A;
  main.js:88 WebGLRenderer constructor; bloom.js:3-6 import block;
  gradePass.js:41 extends OutputPass; starfield.js:202 ShaderMaterial;
  asteroidRenderer.js:52 + bossMesh.js:257 onBeforeCompile; removed-API
  scan of src/ (0 uses, 1 comment at floorGrid.js:13).
- Build-on docs: design/webgpu-feasibility.md (I431),
  docs/architecture/webgpu-re-eval-E56.md, docs/architecture/webgpu-
  re-eval-E61.md (I472), production/scope-check-E61.md.
- [WEB] I492: three.js npm release history (r187 2026-10-30, r186
  2026-09-08, r171 2024-11-29), official WebGPURenderer manual
  (experimental / auto-fallback / forceWebGL), RenderPipeline + bloom()
  TSL addon source (BloomNode.js; r183 PostProcessing -> RenderPipeline
  rename), r185-r187 release notes (removal list above; TSL export
  counts).

## Changed files
- docs/architecture/webgpu-feasibility-E65.md (NEW, this file - LF, no
  BOM, outside the BOM-audit set).
- production/scope-check-E65.md (NEW - CRLF + BOM).
- production/stories.md (ST-459 + STATUS line), production/epics.md
  (E65 block: Status + Stories + notes), production/iterations.md +
  timeline.md + session-state/active.md (I492 entries), CHANGELOG.md
  (E65 open entry).
- Zero src / asset / test / vendor changes. Renderer stays WebGL2;
  frozen identity untouched.

## Next owner or decision
USER DECISION (F3): Option A (recommended) / B / C. On B or C: open a
follow-up epic whose preconditions are the fresh frozen-sha vendor ADR +
the CG A/B gate. E65 stays IN PROGRESS (decision artifact) until the
decision lands.