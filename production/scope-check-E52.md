# Scope Check - E52 Asteroid Silhouette Variety in the GLB Path (cgs-scope-check, I418)

## Summary
Bounded Blender art epic (the user-suggested art-improvement carryover): restore and improve the
tumbling-rock silhouette VARIETY in the shipped GLB rock path. The Blender GLB path
(asteroidRenderer.setGLB -> glbGeo[size], ONE geometry per size) dropped the 3-variant silhouette
variety the procedural fallback already bakes (bakeVariant seeds 101/211/321). When the assets load
(they do), the player sees one rock shape per size - a regression from the many-different-rocks-
tumbling read that every real asteroid game carries. E52 authors a second distinct low-poly
silhouette per rock size (asteroid_L_B / _M_B / _S_B.glb) in the existing flat-shaded neon
language, wires setGLB to per-variant arrays so rendered rocks pick A/B by r.variant, and keeps the
deep E41 relief + value-ladder COLOR_0 bake. GPU-cheap; no sim / palette / feel changes (the E8 feel
freeze and the art-bible palette are contracts).

## Surface & Evidence
- Rock rendering: src/render/asteroidRenderer.js. Procedural fallback geos[s] = [3 bakes]; the GLB
  path glbGeo[size] = single geometry (setGLB, use it for every rock of that size). sync():
  m.geometry = (S && variant==2 && glbComet) ? glbComet : (glbGeo[size] || geos[size][variant]).
  So r.variant (core, 0/1/2) IS already on the rock; the GLB path just ignores it for L/M and
  collapses S to one shape (except the comet at variant 2). NO src/core change is needed.
- GLB tri census (.evidence/I418_glbtris.mjs; 21 GLBs, 2,026 tris / 3,388 verts total - extremely
  light): asteroid_L 490t / 18,592 B, asteroid_M 134t, asteroid_S 134t, asteroid_comet 180t.
  Current BUDGETS (tests/assetGlbs.test.js): L<=500, M<=140, S<=140, comet<=200. The worst case
  (24 concurrent L) is GPU-negligible; draw calls are the real constraint and this adds +0 (pool
  shared, same rock count).
- Pins that could move: ROCK_FACET (per-file facet bakes) + BUDGETS tri ceilings + playframe
  L 21/366 + P 10/180 + B 50/1222 (rocks present -> tri census). The causal p1 pin (sim) is
  renderer-INERT (no src/core change) -> EXACT unchanged.
- Grounding (I418 YouTube MCP pass, 3 queries, 2026-11-15; adds to the I207 genre comps in design/
  art-direction-research.md): the distinct-silhouette lever is video-grounded. August Renders
  (icosphere/cube -> subdivide with a FRACTAL value to randomize each rock + Array + separate-by-
  loose = many distinct rocks); Blender Artifex (cube -> subdivide 5 -> displace Voronoi ->
  dissolve center verts; a different displace seed = a different silhouette); Grant Abbitt (hand-
  modeled low-poly rocks via edge slide + merge = distinct characters); Rod DeWeese (sphere -> Sub-
  D -> Displace, non-destructive; Lattice for overall distortion). Method for A vs B: SAME
  icosphere base + subdivision (=> same tri count) with a DIFFERENT displace noise seed + a
  DIFFERENT non-uniform overall scale (L/M/S each get their own character) + crater insets.
- The rocks ALREADY have craters + bumps (E41 I370: L 5cr+4bump, M/S 4cr+3bump). E52 does NOT
  re-do relief depth (that would duplicate a closed arc). E52 adds a second distinct SILHOUETTE
  per size (a different base shape / character) - the open lever.

## Scope Fit
- In scope (bounded): (1) model asteroid_L_B / _M_B / _S_B.glb (2nd distinct silhouette each; same
  radii 2.2/1.3/0.7, same tri count as primary A [490/134/134], same value-ladder COLOR_0 bake,
  flat-shaded, VR_Rock naming, < ~100 KB each); (2) wire asteroidRenderer.setGLB(size, obj, variant)
  to per-variant arrays (A/B by r.variant%2) preserving the S/variant-2 comet override; (3)
  assetLoader rockL_B / rockM_B / rockS_B entries; (4) assetGlbs.test.js entries for the 3 new GLBs
  (naming, budget, radii, facet band + spread + chroma, mirroring the existing A asserts); (5)
  re-measure playframe + confirm EXACT (same tris per rock, same count).
- NOT in scope: no src/core change (r.variant already exists - no spawn / struct edit); no
  palette / feel change; no relief-depth re-bake (E41); no new asset TYPES; no texture work.
- GPU / compute gate (the user only-if-cheap condition): per-size tri ceiling for the B variant =
  the primary A count (490/134/134) so the per-rock tri count is byte-identical to today; +0 draw
  calls (pool shared, same rock count); 1 material per rock family (the shared rock mat, unchanged);
  3 new GLBs < ~100 KB each (~50 KB typical) -> dist headroom (133,197 B) survives with ~80 KB+
  to spare. GPU-cheap: CONFIRMED.

## Pre-registered Cut Option
- If any B silhouette fails parity (radii within +/-10%), tri budget, facet band, or visual QA
  (it must read as a DIFFERENT shape from A at gameplay scale, color removed), ship the procedural
  fallback for that size (assetLoader per-asset ready:false is already the contract) and drop that
  B from scope. The epic still closes on the sizes that pass.
- Comet differentiation (ST-391) is independently cuttable (an enhancement, not a fix).

## Deferrals (carried, not in E52)
- Per-hit impact SFX audio epic (warden/boss HP hits verified silent; SFX_CUES main.js + WebAudio
  synth src/render/audio.js).
- E49 i18n tail + touch fallback.
- Flyer decay constant unification (flyer.js:74 hardcoded 3/s -> CONFIG.fx.enemyHitFlash.decay).
- AGENTS.md five-GLBs doc-drift note (assets/ now has 21 files; a later docs story).

## Stories (budget I418..I422, gate G52.0 at I422)
- ST-388 (I418, cgs-scope-check + cgs-create-stories): this scope-check + E52 epic + stories. DOCS-only.
- ST-389 (I419, cgs-art-bible): research + art-bible slice - extend design/art-direction-research.md
  with the I418 genre-comp silhouette-variety grounding (icosphere -> subdivide -> displace distinct
  noise seed + non-uniform scale per variant + crater insets) + the per-size A/B silhouette brief +
  confirm GPU-cheap. DOCS-only.
- ST-390 (I420, cgs-dev-story): Blender - model asteroid_{L,M,S}_B.glb (2nd silhouette each; same
  radii + tri count + value-ladder bake + flat-shaded); wire setGLB per-variant + assetLoader
  rockL_B/rockM_B/rockS_B; add assetGlbs.test.js entries; re-measure playframe + confirm EXACT (or
  re-pin if a B tri count drifts). src + assets + tests.
- ST-391 (I421, cgs-dev-story, CUTTABLE): comet differentiation - refresh asteroid_comet.glb
  (elongated icy body + baked ion-tail COLOR_0 gradient, <= 200 tris, same value scheme); re-pin.
- ST-392 (I422, cgs-regression-suite + cgs-gate-check + cgs-milestone-review): fresh R1-R5 + G52.0
  + close E52. DOCS-only.

## Re-pin plan (pre-registered; NEVER silent)
- Expected: ZERO re-pin of existing pins if every B tri count == its primary A (490/134/134): causal
  p1 (sim) EXACT, rockab EXACT, playframe EXACT (same per-rock tris + same rock count). The 3 new B
  files get NEW ROCK_FACET entries (new test code, not a re-pin of A).
- If a B tri count drifts (e.g. decimate changed it), re-pin playframe + BUDGETS at I420 with the
  measured value + a delta note (the I307/I370 precedent), and re-measure in R3 at I422.

## Verification Plan
- Per asset (ST-390): GLB parses (byteLength == count*compSize packing assert), naming VR_Rock,
  tris == A, bounding radius within +/-10% of 2.2/1.3/0.7, COLOR_0 band [0.10,1.20] + warm order
  R>=G>=B + facet spread >= 0.50 + chroma range > 0.05, flat-shaded, < ~100 KB.
- Headless A/B (ST-390): frozen scene with L+M+S rocks of both variants side-by-side, gl.readPixels
  capture, confirm B reads as a distinct silhouette from A at gameplay scale.
- R3 at ST-392: playframe re-measured EXACT (or the re-pin delta); +0 draw calls; R5 test count
  grows (new B asserts) + build 0 + dist headroom >= 102,400 B + vendor sha unchanged.

## Risks
- B silhouette accidentally reads like A (no visible variety). Mitigation: distinct displace seed +
  distinct non-uniform scale + headless A/B silhouette check (ST-390) + cut option.
- GLB tri count drift changes playframe. Mitigation: target A exact tri count; re-pin with a delta
  note if it drifts; re-measure in R3.
- dist growth. Mitigation: 3 small GLBs (~50 KB each), headroom 133,197 B; re-check dist at ST-392.
- setGLB per-variant wiring breaks the comet override (S/variant 2). Mitigation: keep the comet
  ternary FIRST in sync(); a focused unit test on the geometry-selection line.
- Shader program growth. Mitigation: none expected (same shared rock material, geometry-only);
  re-check renderer.info.programs.

## Recommendation
SHIP, bounded, GPU-cheap. This is a genuine fix (the GLB path regressed the procedural silhouette
variety) + a real asteroid-game read (many distinct rocks tumbling), grounded in genre-comp video
research, with a pre-registered cut option + re-pin plan. Not over-engineered: no sim change, no new
asset types, no textures, 3 small GLBs + a ~5-line renderer change.

## Changed files or proposed files
- production/scope-check-E52.md (this file, new; source of truth).
- Proposed ST-389: design/art-direction-research.md (I418 grounding + A/B silhouette brief).
- Proposed ST-390: assets/asteroid_L_B.glb, assets/asteroid_M_B.glb, assets/asteroid_S_B.glb (new);
  src/render/asteroidRenderer.js (setGLB variant param + per-variant arrays + sync selection);
  src/render/assetLoader.js (rockL_B/rockM_B/rockS_B); tests/assetGlbs.test.js (B entries);
  scripts/build.mjs already copies assets/ (no change).
- Proposed ST-391: assets/asteroid_comet.glb (refresh) + tests re-pin.
- Proposed ST-392: production/regression-report.md (Round G52.0) + docs bookkeeping.

## Verification evidence
- I418 (this iteration): DOCS-only. 969/969 green (fresh) + build 0 + dist byte-identical (135 files
  / 1,963,955 B) + vendor sha256-16 76DEA8151BC9352A. No src, no assets, no tests.

## Next owner or decision
- I419 (ST-389): cgs-art-bible research + art-bible slice (extend design/art-direction-research.md
  with the I418 genre-comp silhouette-variety grounding + the A/B per-size silhouette brief).
## Verification evidence (appended I422 at close)
- I419 (ST-389): design/art-direction-research.md extended (4-source silhouette-variety grounding + per-size A/B brief + GPU-cheap confirmed); 969/969 + dist byte-identical 135/1,963,955 B.
- I420 (ST-390): assets/asteroid_{L,M,S}_B.glb new (same icosphere base => same tris 490/134/134; distinct displace seed + anisotropic scale + crater insets; same radii + value-ladder COLOR_0 bake) + setGLB per-variant wire (comet ternary FIRST) + assetLoader rockL_B/M_B/S_B + 2 test groups (ROCK_FACET_B pins; auto-scan floor 17->24) + assetPerf re-measure (24 GLBs); headroom restored via B NORMAL f32->int8 quant (render-inert under flatShading, -6,072 B, ZERO re-pins) -> 106,629 B; playframe EXACT (L 21/366 + P 10/180 + B 50/1222); A/B silhouette ALL_DIFFERENT (0.4027/0.3992/0.5464). 971/971 + dist 138/1,990,523 B.
- I421 (ST-391): assets/asteroid_comet.glb refreshed in place (elongated icy nucleus icosphere 42v/80t 1.35x X + fbm lumps SEED 41107 + 8-seg open cone ion tail 16t = 96t, was 180t; 3,812 B was 8,356 B; COLOR_0 warm (0.74,0.71,0.67) -> coma (0.82,0.86,0.94) -> ion tip (0.52,0.72,1.28) clamped [0.10,1.40]; node no transform; same URL/loader key). Explicit re-pin (pre-registered, never silent): xspan 1.5828 -> 2.464 + COMET_FACET {0.5073/0.6417/0.8270/0.6541} -> {0.7312/0.7413/0.8075/0.7547}; maxperp 0.5481 absorbed by the 0.58+/-12% band (no re-pin). Playframe EXACT unchanged (conditional B re-pin NOT triggered - no comet in reseed-71201 live-5). Headroom -4,544 B -> 111,173 B. One-shot visual OK (icy body + blue-white tail). 971/971 + dist 138/1,985,979 B.
- I422 (ST-392): fresh R1-R5 all EXACT/green (regression-report.md Round G52.0) -> G52.0 PASS -> E52 CLOSED 4/4.