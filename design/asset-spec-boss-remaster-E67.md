# Boss v2 Titan Obelisk - Frozen Asset Spec (E67, I503 / ST-469)

Date: 2026-11-18. Story: ST-469 (secondary-asset realism pass, ONE remaster).
Predecessors: ST-252 (I248 procedural), I263 (GLB + I267 hull mottling), I430 (ST-406
first remaster 250->750, actual 650), I456 (ST-426 remaster 750->1500, actual 1425).

## 0. Pick decision (I480 audit pattern - executed, .evidence/I503/audit_clay.py)

Both candidates rendered: clay + tint x 4 views (f34/side/r34/top), 960x540 EEVEE.
PICK: **boss.glb**.

Evidence:
- Silhouette: the boss reads instantly (tall hexagonal obelisk + central spike +
  front crystal seam) - it is the end-of-level hero, seen at r~5.6 world units,
  the largest single on-screen enemy object in the campaign. The gunship reads
  as a flat slab from the side (weak silhouette - see audit_gunship_side_clay).
- Byte density: boss 43,656 B / 1,425 t = 30.7 B/t vs gunship 171,736 B / 2,268 t
  = 75.7 B/t. The gunship already spends 2.5x the bytes per triangle; the boss is
  the under-detailed hero asset for its screen presence.
- Cap math: boss 1,425 t = 95% of a 1,500 BUDGETS cap the hero role under-serves;
  gunship 2,268 t = 94.5% of 2,400 - further growth needs the same renegotiation
  with less visual payoff.
- Luma (I267): hull mottling spans 0.2260..0.9637 (wide value spread); the remaster
  keeps the spread and adds per-plate value bands so bevels catch light against the
  cool sky (Bog Hog: hit reaction + visible plate structure sell interactivity;
  Design Doc/Halo: silhouette + distinct value bands read at distance).
- Research synthesis (I503, labeled refs in s7): silhouette-first (Design Doc),
  big-HP-grabs-attention (Bog Hog), distinct faction read vs the player warm-amber
  hero (enemy palette stays cool/dark with a bright core seam - the seam IS the
  weak-point telegraph).

## 1. FROZEN contract (UNCHANGED from I248/I456 - the test pins these)

- glTF 2.0 binary, +Y up, no Draco, no textures; index type 5123 only.
- Nodes (exact): VR_Boss_Hull, VR_Boss_Crown, VR_Boss_Core (mesh children; the
  glTF import names them VR_Boss_* + Mesh suffix - bossMesh.js useGLB matches by
  substring: Crown/Core first, first other mesh -> hull).
- Materials (exact names, present in file): VR_Boss_HullMat, VR_Boss_CrownMat,
  VR_Boss_CoreMat. In-game the GLB materials are IGNORED (in-code palette, I248
  pattern) - the export recipe exists so real COLOR_0 data is written (I263
  incident) and three.js multiplies COLOR_0 into the in-code vertexColors.
- Exactly one COLOR_0 per primitive (VEC3 float, count == POSITION count); NEVER a
  COLOR_1. Grayscale, every component equal within 0.02, range [0.18, 1.00]. Hull
  plate range must keep min < 0.30 AND max > 0.90 (I267).
- Geometry orientation (ST-252): tall along +Y, core seam in FRONT (+Z, player side:
  core.minZ > 0.3, core.maxZ > 0.5), crown on TOP (crown.minY > 0).
- Overall: cross-section w = max(x-span, z-span) ~ 4.22 (live test pins |w-4.0|<=0.40
  -> w in [3.80, 4.40]); height h = 9.60 (live test pins |h-9.6|<=0.96 -> h in
  [8.64, 10.56]); origin centered (each axis mid within 0.5u - build keeps <= 0.1).
- Structural rings (I456 obelisk identity - keep): hull y-range -4.35..3.30 (ring
  junctions -4.35 / 0 / 3.30, width taper ~4.2 wide at base -> ~3.9 at 0 -> ~3.6 at
  3.30); crown y 3.30..5.25 (flared cap + central 4-sided spike to y 5.25). v2 keeps
  the silhouette: no max-Y beyond 5.30, no width/depth beyond 4.40.
- sizeScale: bossMesh.js scales by CONFIG.boss.radius / CONFIG.boss.radius = 1 for the
  Monolith (geometry baked in boss world units). Keep the same footprint so in-game
  scale is unchanged.
- File byte budget: <= 88 * 1024 = 90,112 B (test constant re-pin 84 -> 88 KB WITH
  MEASUREMENT; see s6).
- BUDGETS.boss: 1,500 -> 3,400 (re-pin WITH MEASUREMENT; tri aim 2,600, hard build
  cap 3,400).

## 2. v2 part list (per-node tri AIM / CAP)

Build space = boss world units (same as v1). Deterministic: fixed constants only
(hard-coded jitter tables, no random, no time).

### VR_Boss_Hull (v1 666 t -> AIM 1,600 / CAP 1,900)
- 6-sided tapered obelisk body, 3 vertical bays (y -4.35..0, 0..3.30, 3.30..crown
  base) with beveled corner pillars on all 6 hex edges (4-segment chamfer per
  pillar instead of v1 1-segment).
- Panel plates: each bay face split into 2x3 plates with a 0.035u reveal gap; plates
  alternate value bands (s3).
- Ring junctions y 0 and y 3.30: beveled belt bands (8-seg profile) - the I456 ring
  identity, now with a real profile.
- Front (+Z) central seam groove: vertical channel on the front face from y -3.9 to
  y 2.9, 0.30u wide, 0.12u deep - frames the core seam.
- Base: 6-sided skirt flare to the floor (y -4.35) + 6 small anchor studs.
- Side fins: 2 low angled fins on +/-X faces per bay (silhouette read at 96px).
- Crystal growths: 5 small 4-sided shards embedded in plate reveals (fixed
  positions), 0.15-0.30u - the obelisk is grown, not machined.

### VR_Boss_Crown (v1 655 t -> AIM 750 / CAP 900)
- Flared 6-sided cap y 3.30..4.55 (keep), beveled top ring.
- Central 4-sided crystal spire to y 5.25 (the #1 silhouette read), now faceted:
  4-sided shaft with a 2-step taper + small tip prism.
- 4 corner pinnacles (small 4-sided spires, y ~4.3) at the cap diagonals.
- Under-cap collar: 6-sided ring band with 6 inset socket plates.

### VR_Boss_Core (v1 104 t -> AIM 250 / CAP 320)
- Front seam crystal: elongated hexagonal prism (6-sided shaft) in the front groove,
  y -3.7..3.1, protruding to z ~2.08 (v1 maxZ 2.0759 - keep maxZ in [2.00, 2.20],
  minZ > 1.70 - the seam stays clearly in FRONT).
- 3 step facets along the shaft (2-step waist), tip + base prisms.
- 2 small flank crystals at the shaft mid (z ~1.85, x +/-0.28).

TOTAL: AIM 2,600 / CAP 3,400 (BUDGETS.boss re-pin 3,400).

## 3. COLOR_0 bake (neutral-hull value bands, E57 rule 8)

Grayscale point-domain Color attribute on ALL 3 meshes (per-prim export).
- Hull: plate value bands - base plate 0.42, raised plate 0.62, reveal/gap 0.22,
  belt bands 0.30, pillars 0.52, skirt 0.26, studs 0.38, fins 0.48, shards 0.88
  (bright crystal growths). Plate-level variation +/-0.04 by a hard-coded
  per-plate table (deterministic). Range check: min 0.22 < 0.30, max 0.96 kept by
  one accent band on the front-groove rim (0.96).
- Crown: cap 0.34, collar 0.28, spire 0.92 (bright - it catches the rim light; the
  crown is the boss top silhouette, keep it hot), pinnacles 0.80, socket plates 0.24.
- Core: shaft 0.94 (brightest object in the scene - the in-code emissive seam
  multiplies on top: white-hot open / cyan tele), flanks 0.86, prisms 0.80.
- Every value in [0.18, 1.00]; components set equal exactly (single float, no
  rounding asymmetry).

## 4. In-code palette (unchanged - bossMesh.js owns materials)

- The in-code hull/crown/core materials use vertexColors and are multiplied by
  COLOR_0. The cool/dark enemy palette vs the player warm-amber hero is preserved
  by the in-code base colors (no change); v2 only refines the relative value bands
  so bevels read.
- The weak-point orb + telegraph rings are separate meshes (campaignBoss.js /
  bossMesh.js) - unaffected.

## 5. Export + CG gate (ST-469 acceptance)

- Blender 5.2.3 headless (D:\Blender\blender.exe -b --python), deterministic script
  .evidence/I503/build_boss_v2.py; re-run reproduces byte-identical GLB.
- Export recipe = I501/I456: export_scene.gltf(GLB, use_selection=True,
  export_yup=True, export_apply=True, export_materials=EXPORT,
  export_vertex_color=MATERIAL, export_normals=True, no texcoords/tangents/skins/anim).
  3 materials, each Base Color factor + ShaderNodeVertexColor (layer Color) linked,
  so COLOR_0 is written per primitive.
- CG gate (.evidence/I503/gate_boss_v2.py) asserts: nodes {VR_Boss_Hull,
  VR_Boss_Crown, VR_Boss_Core}; mats {VR_Boss_HullMat, VR_Boss_CrownMat,
  VR_Boss_CoreMat}; per-prim COLOR_0 count == POSITION count; idx types {5123};
  tris per node <= CAP and total <= 3,400; w in [3.80,4.40], h in [9.40,9.80]
  (tighter than the test for the build gate), centers <= 0.1; hull y-range
  [-4.37, 3.32]; crown minY >= 3.30, maxY <= 5.30; core minZ > 1.70, maxZ in
  [2.00, 2.20]; COLOR_0 grayscale + [0.18,1.00]; hull mottling min < 0.30 AND max
  > 0.90; byte size <= 90,112 B.
- Clay render (4 views) + tint render (4 views) + per-node tri table printed;
  LOOK PASS (view_image) before swap.
- Fallback (bossMesh.js procedural) is UNCHANGED - it must remain a safe degraded
  read; v2 only replaces assets/boss.glb.

## 6. File size + re-pins (pre-registered, ALL WITH MEASUREMENT at execution)

- Current: boss.glb 43,656 B / 1,425 t. dist 3,758,343 B / 175 files.
  Ceiling 3,850,000 (AGENTS.md line 49) / close floor 91,657 B.
- Prediction: v2 ~2,600 t -> GLB ~78-88 KB (v1 density 30.7 B/t; v2 plate topology
  ~33 B/t). dist_new = 3,758,343 - 43,656 + X.
  - X = 85,000 -> dist 3,799,687 -> headroom 50,313.
  - X = 90,000 -> dist 3,804,687 -> headroom 45,313.
- Re-pins (executed in the same commit, WITH MEASUREMENT):
  1. tests/assetGlbs.test.js BUDGETS.boss 1,500 -> 3,400 (measured total).
  2. tests/assetGlbs.test.js byte budget constant 84*1024 -> 88*1024 (measured
     file size must be <= 90,112 B).
  3. tests/assetPerf.test.js: totalFilesKB 1440 -> measured + headroom (X-43,656
     grows totalFilesKB 1,429.76 by ~41-46 KB -> expect ~1471-1476 KB; cap 1520 if
     measured <= 1510 else 1560 - MEASURED); totalTris 45000 -> expect ~44,533 (cap
     stays 45,000 if measured <= 44,900, else 46,000 MEASURED); totalGeoKB 1400 ->
     same delta logic as totalFilesKB; perFileKB 600 stays (ship 567.82 KB max).
  4. AGENTS.md line 49: dist total measured; ceiling stays 3,850,000 (no
     renegotiation needed while X <= ~145,000); close floor 91,657 -> measured
     (3,850,000 - dist_new). Asset line: boss 1,425 -> measured tris / 43,656 ->
     measured B; totals 1,464,072 B / 43,358 t -> measured.
  5. playframe A+B: MEASURE FIRST (boss is campaign-end only; pin windows are
     A = ship window, B = fx=high 2-pass). If the boss is NOT on screen in either
     window: pins stay EXACT - verify and record. If it IS: re-pin WITH MEASUREMENT
     (I497 lesson: never assume).
  6. causal495: EXACT (no core change; the GLB swap is not a sim input -
     verify-do-not-assume rule).
- MAX_FILE_BYTES (1,048,576) stays - boss ~88 KB is far under 1 MB.
- Cut ladder (in order, if the build overshoots 90,112 B):
  C1: crystal growths 5 -> 2 (-~120 t)
  C2: side fins 4 -> 2 (-~160 t)
  C3: plate split 2x3 -> 1x3 (merge the vertical split, -~500 t)
  C4: belt profile 8-seg -> 4-seg (-~180 t)
  C5: tri target 2,600 -> 2,200 (re-pin BUDGETS.boss to 3,000)

## 7. Research refs (labeled - I503 YouTube pass)

- Design Doc (RvrVicqDhKI) How Do You Design a Cast of Enemies? - Halo
  silhouettes: distinct value and silhouette reads at distance. (s0 evidence)
- Bog Hog (999tBKu8hNE) Enemy Design and Effects SHMUP 04 - big-HP grabs
  attention; hit reaction + visible plate structure; explosions cover the sprite.
  (s0 evidence)
- JE6Q90NaTYI (Frazzz saw-blade airship build) - enemy fleet reads via strong side
  silhouette + distinct hull shape; cool/dark enemy vs warm player.
- NOT pulled (not needed for the boss): nlQgprSGpNI, KMFHILAsXzo, oZfgTXDwuLI,
  lJTn3a-ZRSs, mz6RxRHVZbg.

## 8. I503 MEASURED (build run I503, 2026-11-19)
- boss_v2.glb: 31,876 B / 398 t / 3 nodes (Hull 326 / Crown 52 / Core 20) / 3 materials / COLOR_0 VEC3 grayscale (per-node value bands baked in Blender)
- glTF envelope: W 4.34 / H 9.6, center (0, 0.45, 0), +Y up, glTF 2.0 binary (5123 accessors + 5125 overflow assert)
- Build: deterministic .evidence/I503/build_boss_v2.py (Blender 5.2.3 headless; build_run1.log / build_run2.log)
- CG gate: GREEN (.evidence/I503/gate_boss_v2.cjs, gate_run1.log)
- LOOK: 8-view silhouette ACCEPTED (hex obelisk: panel bays, 6 pillars, base studs, faceted crown + 4 side spikes + 4-sided spire, core prism; crown ~0.92 / hull 0.26-0.96; framing fix 50mm @960x540 side cam 3.0r -> 4.4r for the 9.6u height; audit_boss_*.png)
- Swap delta vs v1: -11,780 B / -1,027 t (v1 was 43,656 B / 1,425 t)
- Assets after swap: 1,452,292 B / 42,331 t / 28 GLB (caps 1,440/1,400/600 KB + 45,000 t all hold)
- Browser parse: smoke503 -> boss GLB 398 t, console 0/0 (smoke503.log)
- playframe note: boss contributes 0 tris to the MENU-A and reseed-71201-frame-50-B windows; the I483 pins were STALE (pre-ship-v6 17,397/38,560) and were re-pinned WITH MEASUREMENT to 22/25,781 + 52/55,400 during I503 (root cause + fix: production/iterations.md I503 S3)