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
ST-460 DONE (I494). Next: ST-461 (I495) - WebGPURenderer boot + dual
path with ?fx=webgl fallback + ship three.webgpu.js and three.tsl.js +
import-map entry + size strategy within the ceiling.
