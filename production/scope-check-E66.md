# Void Runner - E66 Scope Check: Full WebGPU switch (Option C) - opened I493

## Decision on the table (from the E65 decision artifact)
User decision 2026-11-18: **Option C - full WebGPU switch** (vendor r160 -> r187,
WebGPURenderer, TSL re-author of the frozen FX identity). User mandate: keep the
current WebGL2/r160 build as the STABLE version in case we need to switch back.

## Stable anchor (rollback)
- git tag `stable-webgl2-r160` @ 835381c (I492 HEAD, pushed): the last WebGL2/r160
  state. Full rollback = `git reset --hard stable-webgl2-r160`.
- Through this epic the classic FX path (EffectComposer + UnrealBloomPass +
  GradePass + ShaderMaterial/onBeforeCompile) stays in-tree, selectable via
  `?fx=webgl`, doubling as the A/B reference arm for every visual gate.

## Measured state (I493, [TREE])
- Vendor three r160, sha256-16 76DEA8151BC9352A (vendor/three.module.js, 1,272,972 B).
- dist 3,173,343 B / 166 files (ceiling 3,250,000 B, headroom 76,657 B).
- Incompat list (fresh I493 rescan - the I492 doc's list is STALE, 2 more sites):
  1. src/render/starfield.js:202 + :257 - 2x THREE.ShaderMaterial (Points: per-point
     size uSize*aScale*(350/-mvZ) + twinkle/flare rotation + additive glow textures).
  2. src/render/afterburner.js:75 - THREE.ShaderMaterial (dynamic Points, aFade attr).
  3. src/render/asteroidRenderer.js:52 - onBeforeCompile fresnel rim (rock mat).
  4. src/render/bossMesh.js:194 - onBeforeCompile rim (hull + crown, dual-color).
  5. src/render/enemyRim.js:27 - shared onBeforeCompile rim helper (7 enemy roles).
  All rims are the same I278 pattern: outgoingLight += uRimColor*pow(1-NdotV,power)*
  strength - TSL equivalent: emissiveNode.add(rimColor * fresnel^power * strength)
  (emissive feeds outgoingLight in the standard lighting model - same insertion point).
- FX chain (frozen identity): RenderPass -> UnrealBloomPass(0.6, 0.35, 0.72, half-res
  internal targets) -> GradePass (OutputPass + I334 level curve: lift/contrast/gamma
  applied AFTER the ACES tone-map, BEFORE the sRGB OETF). Low FX tier: direct
  renderer.render (no bloom, no grade).
- Probe env: headless system Chrome + playwright-core with --enable-unsafe-swiftshader.
  WebGPU availability in this env = unknown until probed (probe must report the active
  backend); WebGPURenderer auto-falls back to WebGL2 - pins re-baseline to whichever
  path actually runs.

## Scope (5 stages, each a gated iteration)
1. ST-460 (I494): vendor r187. npm three@0.187.0; vendor.mjs copies the build(s) +
   jsm; import map verified [TREE] (three.webgpu.js = the superset build: core + TSL +
   WebGPURenderer, expected to also export WebGLRenderer for the classic path - if it
   does, ONE file maps to three + three/webgpu + three/tsl = one core instance; if not,
   dual-file mapping with the documented two-instance caveat). dist ships the superset
   bundle only (classic path unchanged); NEW frozen-sha pin + ADR
   (docs/architecture/vendor-r187-adr.md). A/B probe vs the stable tag build: classic
   path near-identical (r160->r187 pass drift measured, not assumed). Gate: quality bar.
2. ST-461 (I495): WebGPURenderer boot (async init) + dual-path: `?fx=webgl` forces the
   classic WebGLRenderer path (frozen reference); default = WebGPURenderer (auto
   WebGL2 fallback when no adapter). PMREM/init ordering; renderer.info surface for the
   fps/debug overlays. Probe reports the active backend. Gate: causal EXACT (core
   untouched) + A/B no-regression (FX still classic on both arms at this stage).
3. ST-462 (I496): TSL FX identity on the WebGPU path: RenderPipeline with
   scenePass.color.add(bloom(scenePass.color, 0.6, 0.35, 0.72)) and the I334 grade as a
   TSL op sequence placed AFTER toneMapping(), BEFORE sRGB() (exact I334 order). Low FX
   tier = pipeline without bloom/grade (direct render kept only if cheaper, measured).
   A/B gate #1: stable classic vs new WebGPU (screenshots + delta metrics; identity =
   parameter map + grade curve, NOT pixel-equality - TSL bloom is a different algorithm,
   pre-registered in the E65 doc).
4. ST-463 (I497): TSL material conversions: starfield shells + flares + afterburner
   (PointsNodeMaterial + sizeNode + pointCoord; dynamic aFade via attribute node) + the
   three rim sites -> one shared TSL rim helper (emissiveNode). A/B gate #2 (full scene
   identity, campaign + endless arms).
5. ST-464 (I498): G66.0 close gate: fresh causal 18/18 EXACT (seed-9876 pin set; core
   zero-drift) + playframe RE-PIN WITH MEASUREMENT (renderer change = frame-time
   re-baseline per the I470/I471 precedent) + A/B final + PWA 11/11 + AGENTS.md refresh
   (r187 / WebGPU / new pin) + E66 CLOSED 5/5.

## Cut / renegotiation branches (pre-registered)
- C1 (dist ceiling): if the r187 superset bundle (unminified) breaks the 3,250,000 B
  ceiling, the vendor bundle is MINIFIED in build.mjs (esbuild, version-pinned,
  deterministic) with the frozen sha pinned on the SOURCE vendor file (new convention,
  recorded in the ADR). Renegotiate the ceiling ONLY if minified vendor still exceeds it
  AND measured headroom < the 102,400 B close floor (E64 governance, same contract).
  C1 EXECUTED (I495, measured): the minified superset dist = 3,536,694 B (171 files) > 3,250,000 B
  ceiling -> ceiling renegotiated 3,250,000 -> 3,650,000 B; measured headroom 113,306 B >= 102,400 B
  close floor (E64 contract holds). Dist-min pins: module A65DE049A7F38B40 + core 7AB0784CD2532367
  (byte-identical to I494) + webgpu F549248412C62B9A + tsl 7FF9ACF50F006017 (new).
- C2: if TSL Points (sizeNode/pointCoord) cannot express the starfield point-size
  formula on r187, fall back to per-shell size buckets (N PointsMaterials, size =
  per-bucket uniform) - visual delta measured in gate #2.
- C3: if WebGPU is unavailable in the probe env AND the WebGL2 fallback path shows an
  identity regression vs classic, ship default = classic with WebGPU opt-in (?fx=webgpu)
  and re-open E66 as a perf epic (no silent look drift).
  C3 EXECUTED (I495, ADAPTED - measured trigger differs, outcome identical): the probe env HAS a
  real WebGPU device (requestAdapter OK, Chrome on Windows), so the literal condition (WebGPU
  unavailable) was not met; instead the WebGPU-real arm logged NodeBuilder console errors
  (16x ShaderMaterial + 1x RawShaderMaterial "not compatible" - the classic custom materials,
  which are the staged ST-462/463 TSL work) + 4 uv warns, failing the console 0/0
  bar for a shipping default. Executed: default = classic (auto -> frozen ctor), ?fx=webgpu =
  experimental opt-in (documented degraded), no silent look drift (default is the byte-same
  render path as I494; ab495 fxON 0.002 / fxOFF 0.001 mean). The default -> webgpu flip is
  re-evaluated at the ST-464 close gate once the probe console is clean; no separate perf
  epic needed (the TSL work is already staged as ST-462/ST-463 within E66).

## Risks
- R1 TSL bloom != UnrealBloomPass pixels (pre-registered; the gates measure identity,
  not pixel equality).
- R2 probe env WebGPU availability unknown (SwiftShader headless) -> auto fallback;
  pins re-baseline; real-GPU visual check deferred to a user-side pass.
- R3 vendor bundle size vs dist ceiling (mitigation C1).
- R4 two-core-instance hazard if three + three/webgpu map to DIFFERENT files
  (instanceof / NodeMaterial drift). Mitigation: single superset file when the [TREE]
  export check allows (planned); otherwise dual-file mapping documented in the ADR with
  the classic path confined to ?fx=webgl (never mixes with TSL materials).
- R5 r160->r187 drift on the classic path (Stage 1 A/B gate must pass before any
  renderer work).

## Acceptance (epic level)
- Causal pin set EXACT on the final default path (core zero-drift).
- Playframe re-pinned with measurement; no unexplained frame-time regression vs the
  re-pinned baseline under the probe env.
- A/B gates #1/#2 PASS with delta metrics + screenshots archived in .evidence/.
- Vendor ADR landed with the new frozen sha; dist <= ceiling (or the pre-registered
  renegotiation executed and documented).
- Stable tag reachable; ?fx=webgl reproduces the classic look on r187.

## Next owner
I494 = ST-460 (vendor r187 upgrade + ADR + import map + dist size strategy).