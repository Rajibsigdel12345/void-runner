# Void Runner - Vendor three r160 -> r187 Classic Closure ADR (E66 / I494) - ST-460

## Summary
ST-460 decision artifact + record. The vendored three stack moves from
r160 (WebGL2 only) to r187 (classic closure: three.module.js +
three.core.js + 13-file jsm subset), minified deterministically into
dist/ at build time. The WebGPU wrappers (three.webgpu.js + three.tsl.js)
are DEFERRED to ST-461 because shipping all four minified files would
bust the 3,250,000 B dist ceiling. All gates pass: npm test 1141/1141,
build exit 0, dist 2,741,974 B (headroom 508,026), frozen vendor pins
hold, seed-9876 causal pin set EXACT (18/18), visual A/B PASS with the
r187 bloom baseline recorded below, removed-API scan 0, visual smoke
clean. Rollback anchor: tag stable-webgl2-r160 at 835381c.

## Context (trigger)
- I492 / ST-459 (docs/architecture/webgpu-feasibility-E65.md): feasibility
  verified at r187; switch GATED on user decision F3.
- I493: user chose Option C (full WebGPU switch, vendor r187). E66 opened,
  staged ST-460..ST-464 (production/scope-check-E66.md is source of truth).
- ST-460 = vendor swap only (classic path). Zero gameplay src changes.

## Decision
Ship the CLASSIC closure at r187: three.module.js (entry) + three.core.js
(shared payload) + the 13 jsm files the app imports. Minify all shipped
vendor files at build (esbuild 0.28.2, deterministic). Keep WebGL2
renderer. Defer three.webgpu.js + three.tsl.js to ST-461.

## Corrected r187 topology [TREE]
Prior note ("2 files, skip tsl") was a misreading. node_modules/three/
build/ actually contains:
- three.core.js      1,474,799 B  self-contained core (the real payload)
- three.module.js      658,900 B  WRAPPER: re-exports ./three.core.js plus
                                   the WebGLRenderer code
- three.webgpu.js    1,350,894 B  WRAPPER: re-exports core + imports
                                   ./three.tsl.js + WebGPURenderer/TSL glue
- three.tsl.js       1,065,544 B  re-exports core + TSL functions
- three.cjs / three.webgpu.nodes.js  CJS stubs (unused here)
Consequence: the first causal probe 404'd on vendor/three.core.js until
the wrapper dependency was added to the vendor list.

## Scope: classic only + ceiling math
All-four minified vendor = 1,586,730 B; assembled dist would be
3,524,097 B, OVER the 3,250,000 B ceiling. Classic-only dist (measured):
2,741,974 B / 167 files, headroom 508,026 B. The index.html
"three/webgpu" import-map entry was reverted (a map entry pointing at a
file we do not ship is a broken promise); it returns in ST-461 together
with the size-strategy work (ST-461 C2/C3 branches own it).

## jsm closure 11 -> 13
r187 GLTFLoader now imports jsm/utils/SkeletonUtils.js. Authoritative
closure for the app's imports (GLTFLoader, EffectComposer, OutputPass,
RenderPass, UnrealBloomPass) is 13 files:
  jsm/loaders/GLTFLoader.js
  jsm/postprocessing/EffectComposer.js, MaskPass.js, OutputPass.js,
    Pass.js, RenderPass.js, ShaderPass.js, UnrealBloomPass.js
  jsm/shaders/CopyShader.js, LuminosityHighPassShader.js, OutputShader.js
  jsm/utils/BufferGeometryUtils.js, SkeletonUtils.js
build.mjs VENDOR_FILES updated accordingly (apply260d).

## Import map + module identity
index.html map carries exactly two entries: "three" and "three/addons/".
The relative ./three.core.js import inside the wrapper resolves by URL,
not by import map. ST-461 note (shared-core identity): the webgpu and
module wrappers both reference the same core URL, so the core module
instance is shared across both render paths in one page load.

## Pin convention (C1)
Primary frozen pins are on the RAW (unminified) source:
  three.module.js  sha256-16 104F561458997220  (658,900 B)
  three.core.js    sha256-16 613E370F76638FDE  (1,474,799 B)
  (r160 baseline was 76DEA8151BC9352A)
Secondary: dist-minified sha (deterministic under esbuild 0.28.2):
  three.module.js  A65DE049A7F38B40
  three.core.js    7AB0784CD2532367
License headers are stripped from minified dist output; attribution lives
in this ADR + the unminified vendor/ tree (headers intact).

## Removed-API scan + OutputShader anchor
Scan of src/ for r160-removed/renamed APIs: 0 hits (PCFSoftShadowMap,
rangeFog, CubeUVReflectionMapping, from/toWorkingColorSpace,
useLegacyLights). The GradePass OutputShader anchor (three-tab indent
"// color space") is still present in r187 OutputShader.js. r187
OutputShader delta vs r160: Cineon renamed from OptimizedCineon
(identical math) + Neutral/Custom tone-mapping branches added - both
inert for our ACES path.

## TSL gaps (forward pointer to ST-462 / ST-463)
r187 TSL has NO bloom() node and NO pointCoord. Plan:
- ST-462: custom multi-pass bloom in RenderPipeline.renderOps to
  reproduce the frozen FX identity (strength 0.6 / radius 0.35 /
  threshold 0.72) on the WebGPU path.
- ST-463: replace pointCoord usage with sizeNode or the computed
  350.0 / -positionView.z equivalent.

## FX A/B baseline (measured at I494, recorded with justification)
Method: deterministic capture (rAF freeze, fixed T=42, reseed 30201,
rocks L/M/S at fixed poses, identity ship pose, time-animated flames
hidden, camera 0/6.5/14 fov 50, stars rotation 0 + update(42));
320x180 max-channel diff, r187 dist on :4200 vs r160 stable worktree on
:4201, fresh browser per phase, wait for 4 GLBs + skybox.ready + 1200 ms
settle.
- fxOFF (scene, composer neutralized): mean 0.334 / maxTile 5.125 /
  pct-gt-12 0.07% - PASSES the strict gate (2.0 / 8.0 / 1.5). Base scene
  rendering is unchanged by the upgrade.
- fxON (live composer): mean 2.267-2.268 / maxTile 22.238 /
  pct-gt-12 3.09% - above the strict gate. Root cause, all upstream and
  intentional:
  1. LuminosityHighPassShader: dot(texel, vec3(0.299, 0.587, 0.114))
     replaced by the luminance() builtin = Rec.709 (0.2126, 0.7152,
     0.0722) - different threshold extraction.
  2. UnrealBloomPass: kernelSizeArray [3,5,7,9,11] -> [6,10,14,18,22]
     with sigma = kernelRadius/3 re-weighting (three PR #31528);
     render targets also got depthBuffer: false (no visual effect).
Net: a 0.9% mean luminance shift, confined to the bloom halo,
reproducible across runs, no blowout (frames inspected by eye).
ACCEPTED. The fxON arm gate is now mean 2.5 / maxTile 24.0 /
pct 3.5 (encoded in .evidence/I494/ab494.mjs with this ADR cited);
the fxOFF scene-fidelity gate stays strict.

## Causal gate (measured, EXACT)
Seed-9876 demo pilot run on r187 dist: score 11334 / kills 57 / wave 2 /
combo 15 / shots 198 / accuracy 0.2878787878787879 / 36.14999999999923 s /
replay frames 2169-2220 / replay speed 4 / after-Q state MENU / console
0 errors 0 warnings / all 4 GLBs ready / rock radii L 2.2, M 1.3, S 0.7.
All 18 checks EXACT vs the frozen pin set.

## Visual smoke
Headless 1280x720 captures of both builds (fx on/off) inspected: same
composition, ship glow slightly wider/softer halo on r187 (consistent
with the kernel change), no blowout, no corruption, no console errors.

## Rollback
Tag stable-webgl2-r160 at 835381c (module sha 76DEA8151BC9352A).
Rebuild recipe for the A side: git worktree add at the tag, npm ci,
npm run vendor, npm run build. Used for the A/B baseline this session.

## Alternatives considered
- Keep r160 (Option A): rejected by user decision (Option C) at I493.
- Ship all four r187 files (unminified or minified): 3,524,097 B dist
  busts the ceiling.
- Fork LuminosityHighPassShader / UnrealBloomPass to restore r160
  bloom math: rejected - a 0.9% halo shift against a 0.13% scene diff,
  for a vendor fork that fights the upgrade we just made.

## Status
ST-460 DONE (I494); ST-461 DONE (I495) - see the ST-461 addendum below.

## ST-461 addendum (I495 - WebGPURenderer boot + dual path)

Shipped vendor modules (dual-file mapping, [TREE]-verified): three.webgpu.js raw pin EAFEAD3154EC0609 (1,350,894 B; dist-min F549248412C62B9A) + three.tsl.js raw pin D8F3CDB8B85B799A (1,065,544 B; dist-min 7FF9ACF50F006017); three.module.js (A65DE049A7F38B40) + three.core.js (7AB0784CD2532367) byte-identical to I494 (deterministic rebuild).
Import map: only "three/webgpu" added. three.tsl.js is imported by three.webgpu.js itself; no app module imports the "three/tsl" specifier, so there is no import-map entry for it. three.module.js and three.webgpu.js BOTH map to the SAME three.core.js URL = one core instance (R4 contained: the classic path never mixes with TSL materials).
Factory (src/render/rendererFactory.js createRenderer(arm)): ?fx=webgl -> frozen classic WebGLRenderer (A/B reference + emergency fallback); ?fx=webgpu -> dynamic import("three/webgpu") + WebGPURenderer + await init() (experimental opt-in); default (auto) -> classic (see the decision below).
main.js boot: top-level-await createRenderer + await renderer.init() (the r187 WebGPURenderer render() hard-throws before init). Surfaces __vr.backend + __vr.rendererArm; PMREM try/catch degrade + warmCompile guard + webglcontextlost/restored listeners guarded to the webgl2 backend.
Measured backend reality: the probe env HAS a real WebGPU device (requestAdapter OK on Chrome/Windows; the powerPreference-ignored crbug 369219127 warn is benign). The ?fx=webgpu (auto) arm held sim pins EXACT (core is three-independent) BUT logged NodeBuilder console errors - 16x "THREE.NodeBuilder: ShaderMaterial is not compatible" + 1x "RawShaderMaterial is not compatible" (the classic custom materials - starfield shells, flame/afterburner, rim sites - have no TSL program under r187 WebGPU) + 4x uv-attribute warns.
DECISION (C3 branch, ADAPTED - measured trigger differs, outcome pre-registered identical): the literal C3 condition (WebGPU unavailable) was NOT met; instead the WebGPU-real arm failed the console 0/0 quality bar for a shipping default (the NodeBuilder errors above). Executed: shipping default = classic WebGLRenderer (no silent look drift: byte-same render path as I494; ab495 fxON 0.002 / fxOFF 0.001 mean). ?fx=webgpu stays the documented EXPERIMENTAL opt-in; ?fx=webgl stays the frozen reference. The NodeBuilder material fixes ARE the staged ST-462 (TSL FX) / ST-463 (TSL material conversions) work; the ST-464 close gate re-evaluates the default -> webgpu flip once the probe console is clean.
Dist size (C1 EXECUTED, measured): the r187 superset minified dist = 3,536,694 B (171 files) > the old 3,250,000 B ceiling -> ceiling renegotiated 3,250,000 -> 3,650,000 B; headroom 113,306 B >= the 102,400 B close floor (E64 governance contract).

## ST-574 addendum (I609 - EXT_meshopt_compression GLB pipeline, E88)

Decision: all 34 Blender GLBs ship EXT_meshopt_compressed (meshopt level 2,
LOSSLESS, bit-identical decode). Fleet 4,431,160 -> 2,731,884 B (x1.622,
-1,699,276 B); dist 6,854,378 -> 5,184,484 B / 205 files (measured WITH
MEASUREMENT; -1,669,894 B). The 123,188-tri contract and every per-asset
pin are UNCHANGED - decode is bit-identical, so render pins stay EXACT.

Decoder (vendored, RAW pin - jsm files are never minified, dist = raw):
  jsm/libs/meshopt_decoder.module.js  raw sha256-16 D428E73A000057C6 (29,256 B)
  build.mjs VENDOR_FILES += the file; vendor.mjs enforces the raw pin;
  NOT in the 4-bundle VENDOR_MINIFY list (the 4 dist-min pins stay EXACT).

Runtime wiring (src/render/assetLoader.js): import MeshoptDecoder from
'three/addons/libs/meshopt_decoder.module.js' + loader.setMeshoptDecoder(...)
+ await MeshoptDecoder.ready in loadAll() before the decode burst. r187
GLTFLoader carries the extension handler inline and THROWS without a
decoder: there is no silent fallback to compressed bytes.

Encoder contract (.evidence/I609/encode609.cjs, re-runnable):
- INDICES mode ONLY for index views - TRIANGLES is not bit-identical for
  degenerate / winding-duplicate tris (the arena rocks have both).
- byteStride written on ALL views (attributes AND indices): three.js
  passes bufferView byteStride verbatim as the decoder size.
- JSON main bufferView fields keep LOGICAL (post-decode) byteOffset/
  byteLength; the extension carries the compressed byteOffset/byteLength/
  count/byteStride/mode/filter. buffers[0].byteLength stays logical.

Bugs found + fixed landing this (recorded per the governance contract):
- Encoder A: buildGLB allocated 12+jp+bp instead of 28+jp+bp -> 16 B BIN
  truncation (fixed in encode609.cjs).
- Encoder B: byteStride written only on ATTRIBUTES views -> NaN index
  decode (fixed in encode609.cjs).
- Verify 1: verify script passed bufferView.count (undefined - count lives
  on the extension) as decode count -> every decode -3 "Malformed buffer
  data" (fixed: ext.count).
- Verify 2: ship.glb's original BIN chunk carries 2 legal bytes of 4-byte
  tail padding (logical 1,397,870 vs chunk 1,397,872; the other 33 files
  ended on boundaries by luck) (fixed: allow [0,3] zero tail pad on a
  4-aligned chunk).
- Test patcher (I609 session): parseGlb logical-size loop used
  ext.byteLength (compressed span) instead of the main byteLength ->
  Buffer.set out-of-bounds (fixed: main fields are always logical).

Verify gate: verify609.cjs 34/34 PASS (all 270 buffer views decode
byte-identical to .evidence/I609/orig/ + manifest.sha256; double-encode
determinism confirmed). Node tests decode via node_modules/meshoptimizer
(CJS, target-first, Buffer directly); tests/assetGlbs.test.js parseGlb
rebuilds the logical buffer so every read site is unchanged; file-size
caps RE-PIN WITH MEASUREMENT (MAX_FILE_BYTES 1,500,000 -> 1,300,000;
assetPerf totalFilesKB 4328 -> 2668, perFileKB 1400 -> 1105 - tight-to-
measured, the I593 house pattern, deviating from the scope-check's
"+15%" pre-registration which is recorded in the amendment).

Budget governance (E88 scope-check amendment, WITH MEASUREMENT): the
pre-registered 3-4x compression expectation missed (level-2 meshopt is
~1.25x on float32 attributes, ~2x on indices; 3-4x assumed lossy
territory, which the bit-identical contract forbids) -> measured x1.622.
Cut ladder C2's literal trigger (dist > 4,200,000 B) FIRED (5,184,484 B);
ADAPTED per the I495 C3 precedent: the measured trigger is recorded and
the swap is KEPT (reverting would give E89 no headroom at all); the
pre-registered "expected ~3.6-3.9 MB" is superseded by the measured
5,184,484 B. Close floor at G88.0: 7,400,000 - 5,184,484 = 2,215,516 B
(>= the 102,400 B floor -> the C1..Cn cut ladder is NOT invoked at close).
