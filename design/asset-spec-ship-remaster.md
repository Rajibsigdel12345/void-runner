# Void Runner - Ship Remaster Asset Spec (I428 / cgs-asset-spec) - ST-399 COMPLETE at I429

## Summary
This spec is the ST-399 (I429) contract for the Blender remaster of assets/ship.glb:
the player ship grows from the current 112-tri low-poly "airship" into a detailed
low-poly SPACE FIGHTER (~800-1400 tris, sweet spot ~1000) - the MAIN deliverable of
E54 (production/scope-check-E54.md, I427). "Airship" is read loosely as a proper
fighter: this is an asteroids-style arcade game and the ship is a small, fast fighter.

The remaster is GEOMETRY-only + a re-baked per-facet grayscale value map. Everything
else stays: the in-code palette tint (CONFIG.ship.palette), the FROZEN cockpit cyan
emissive, the collision model, the 3 material names, the 6 VR_Ship_* node names, and
COLOR_0 on EXACTLY the hull + wings prims. The renderer (src/render/shipMesh.js useGLB
material-name routing + ensureWhiteColors) is untouched. Grounded in YouTube ship
hard-surface references (silhouette-first + facet value-bake; NOT high-poly sculpting,
NOT texture-dependent detail).

Core principle (unchanged from design/asset-spec.md): the GLB supplies GEOMETRY + the
grayscale per-facet COLOR_0 value map; all dynamic material behavior (palette tint,
cockpit emissive, invuln blink, additive engine flame) stays in code.

## Asset Purpose
- Replace the 112-tri ship (cone body + box wings + sphere cockpit + box fin + box
  nozzle) with a fighter whose SILHOUETTE reads at gameplay scale - a distinct pointed
  nose, swept wings with winglet/strut tips, a vertical tail fin, and a rear engine
  nacelle + nozzle - and whose SURFACE reads as built-up (a few BOLD hard-surface
  panel insets) without a single texture.
- Keep the ship the player's "hero" accent: the FROZEN cockpit cyan emissive is the
  identity; the warm body + umber wing palette (E19) is the tone; the value bake gives
  the bright-nose / dark-belly form read on top.
- Read as a small, nimble, fast fighter (asteroids-style), NOT a bulky carrier.
  Proportions: long-slim fuselage, wide-ish swept wings, low silhouette.

## States
- Single static state. No animation, no rig, no morph targets, no skin - all motion is
  in-code transform (shipMesh.js moves the group) + in-code material (flame, invuln
  blink). The GLB is a plain static glTF 2.0 mesh set.
- No weapon / weapon-charge / powerup state on the ship model itself (those are
  separate emblems/sprites).
- Container: 6 nodes -> 6 meshes -> 3 materials, static, no UVs.

## Technical Constraints (the load-bearing contract)
Container:
- glTF Binary (.glb), glTF 2.0, Y-up, 1 Blender unit = 1 world unit.
- No rig / animation / morph targets / skins / UVs (UV-free by design - value bake,
  I211/I421/I425 precedent: export_texcoords=False + strip uv_layers).
- Every mesh needs POSITION + NORMAL (assetPerf hard rule).
- Byte budget: ship.glb <= 60 KB (assetPerf perFileKB hard cap; also < 100 KB in
  assetGlbs). Target ~25-45 KB.
- int8 NORMALs recommended (I420 precedent; render-inert for flatShading bodyMat/wingMat;
  only the smooth-shaded cockpit uses normals, and a low-poly canopy is fine with int8).
  Fall back to FLOAT normals only if a normal artifact appears in the A/B.

Naming (EXACT - load-bearing; verified against the live GLB + this session):
- 6 nodes (objects): VR_Ship_Hull, VR_Ship_Wings, VR_Ship_Cockpit, VR_Ship_Fin,
  VR_Ship_Engine, VR_Ship_Nozzle.
- 3 materials: VR_Ship_Hull, VR_Ship_Wing, VR_Ship_Cockpit.
- The facet test keys off MESH names: the hull MESH is 'VR_Ship_Hull.001' (or
  'VR_Ship_Hull') and the wings MESH is 'VR_Ship_Wings.001' (or 'VR_Ship_Wings'). The
  Blender exporter appends '.001' when the object already takes the bare name.
  assetGlbs.test.js:131-132 reads these two mesh names to locate the two COLOR_0 prims;
  KEEP the mesh names so those keys still resolve.
- Node -> material mapping (PRESERVE exactly - it drives useGLB routing + the rendered
  look; shipMesh.js:159-162 routes by MATERIAL name substring, Cockpit->cockpitMat,
  Wing->wingMat, else->bodyMat):

  Node            Material          COLOR_0   useGLB route
  --------------  ----------------  --------  ----------------------------------------
  VR_Ship_Hull    VR_Ship_Hull      YES       bodyMat (keeps the GLB COLOR_0 value bake)
  VR_Ship_Wings   VR_Ship_Wing      YES       wingMat (keeps the GLB COLOR_0 value bake)
  VR_Ship_Cockpit VR_Ship_Cockpit   no        cockpitMat (FROZEN cyan emissive)
  VR_Ship_Engine  VR_Ship_Cockpit   no        cockpitMat (CURRENT state - the engine
                                              housing is a cyan-glow accent beside the
                                              warm flame; do NOT "fix" it to VR_Ship_Hull)
  VR_Ship_Fin     VR_Ship_Wing      no        wingMat (white-identity COLOR_0 added in code)
  VR_Ship_Nozzle  VR_Ship_Hull      no        bodyMat (white-identity COLOR_0 added in code)

COLOR_0 value bake (EXACTLY 2 prims - hull + wings):
- Per-facet grayscale, corner-domain, FLOAT VEC3, count == POSITION count, r==g==b
  within 0.02, values in [0.30, 1.55].
- Formula (unchanged I292/ST-275): v = clamp(1.0 + k*dot(n, L), 0.30, 1.55) where n is
  the face normal in the ship's LOCAL space (nose +Z, up +Y, engine -Z), L the fixed
  bake light (reuse I421/I425: light dir (-0.45, 0.70, 0.55), SEED 42117). k = 0.55
  (hull) / 0.80 (wings).
- Only the Hull and Wings meshes carry COLOR_0. Cockpit / Engine / Fin / Nozzle must
  NOT carry COLOR_0 (Fin / Nozzle / Engine get white-identity in code via
  ensureWhiteColors; Cockpit uses its own emissive).

Extent (keep inside the ship box so collision + flame alignment hold):
- x in [-1.25, +1.25] (wingspan 2.5); y in [-0.275, +0.45]; z in [-0.95, +0.85]
  (length ~1.80).
- Orientation: nose +Z, engine/nozzle -Z (back), fin up (+Y), wings swept back.
- Test bands (assetGlbs.test.js:94-95, measured over the WHOLE ship bounding box):
  wingspan(x) 2.5 +/- 0.25 (i.e. [2.25, 2.75]); length(z) 1.9 +/- 0.19 (i.e.
  [1.71, 2.09]). The current ship is x=2.44 / z=1.722 - the remaster must stay inside
  these bands AND inside the ship box above.
- The in-code engine flame apex is anchored at z = -0.8 (inside the nozzle). Position
  the nozzle so its mouth still contains z = -0.8.

Poly budget (per node; sweet spot ~1000 total; total within the re-pinned BUDGETS.ship):
- VR_Ship_Hull    ~350 tris: tapered faceted fuselage - a distinct pointed nose (+Z), a
                  forward cockpit bulge, a mid-body with 3-4 BOLD panel insets (inset/
                  outset, NOT booleans), a rear taper to the engine mount (-Z). COLOR_0.
- VR_Ship_Wings   ~250 tris: swept-back wings (keep span ~2.5, x +/- 1.25), winglet/strut
                  tips, 1-2 large panel insets. COLOR_0.
- VR_Ship_Cockpit ~64 tris: faceted canopy dome (low-poly sphere/icosahedron); cyan tint
                  comes from code.
- VR_Ship_Fin     ~24 tris: vertical stabilizer, small, up and toward the back (-Z).
- VR_Ship_Engine  ~120 tris: rear nacelle body - a single detailed nacelle. (The
                  scope-check's loose "twin-nacelle" reading is realized WITHIN this
                  single node: the node count is fixed at 6, so no 7th node is added.)
- VR_Ship_Nozzle  ~96 tris: engine nozzle; its mouth must contain the flame apex (z=-0.8).
- Total ~904 tris (inside the 800-1400 band; sweet spot ~1000).

Re-pins (pre-registered in scope-check-E54.md; ALL explicit old -> new at I429, NEVER
silent) - ALL EXECUTED at I429 (measured values, not estimates):
- BUDGETS.ship (assetGlbs.test.js:18): 300 -> 850 (actual 818; tighter than the
  pre-registered ~1200).
- assetPerf BUDGET.totalTris: 3000 -> 3500 (actual 3442 = 2736 pre-remaster [I420 2784
  + I425 emblem re-bake -48] - 112 old ship + 818 new; tighter than pre-registered ~4000).
- SHIP_FACET (assetGlbs.test.js): old hull {p10 0.88, p50 1.0599, p90 1.55} + wings
  {p10 0.7702, p50 1.0, p90 1.1902} -> hull {p10 0.5477, p50 0.9802, p90 1.4414} + wings
  {p10 0.4329, p50 0.9696, p90 1.55} (spread 0.8937/1.1171, both >= the 0.35 floor).
- assetPerf perFileKB 60 -> 65 (max 62.41 = ship) / totalFilesKB 205 -> 235 (232.26) /
  totalGeoKB 165 -> 200 (196.08). perFileMats 3 + exactly-24-GLBs unchanged.
- dist ceiling (DOC-ONLY; VERIFIED no test asserts it or the 102,400 B headroom floor):
  RAISED 2,097,152 B -> 2,200,000 B (new dist 138 files / 2,039,982 B; headroom 160,018 B
  >= 102,400 B floor; the old ceiling would have left 57,170 B < floor, so the raise was
  required per the pre-registration).

## Facet value-bake plan
- After the remaster geometry is joined + triangulated, run the per-facet grayscale bake
  on the Hull and Wings meshes only: for each face, v = clamp(1.0 + k*dot(n, L), 0.30,
  1.55) with the fixed light L and k per part (hull 0.55 / wings 0.80); write v to all 3
  components of COLOR_0 at each face's corner-domain vertices (corner domain keeps the
  facets crisp, matching the current ship).
- Reuse .evidence/I421_buildComet.py / .evidence/I425_buildEmblems.py as the bake
  template (SEED 42117, light (-0.45, 0.70, 0.55), bmesh triangulate - Blender 5.2 has
  no bpy.ops.mesh.triangulate).
- After export, MEASURE hull & wings facet p10/p50/p90 + spread with
  .evidence/I425/scan_emblems.cjs, then set SHIP_FACET to those exact values (explicit
  old -> new).

## Acceptance Criteria
Silhouette / read (CG A/B gate, grayscale-clay + in-game tint, old 112-tri vs new):
- 3/4 view + face-on + closeup: the new ship reads as a CLEARLY more detailed and
  better-proportioned fighter (distinct nose / wings / fin / nacelle + visible panel
  insets), not merely a bigger version of the old one.
- In-game tint A/B: the E19 warm body + umber wings + FROZEN cyan cockpit read correctly;
  the value bake gives a bright-nose / dark-belly form read.

Contract (ALL must hold, else ROLL BACK to the b819fc1 ship.glb):
- Extent within the ship box (x +/- 1.25, y -0.275..0.45, z -0.95..0.85); wingspan(x)
  2.5 +/- 0.25; length(z) 1.9 +/- 0.19.
- Exactly 6 VR_Ship_* nodes, exactly 3 materials, node->material mapping preserved (table
  above, incl. Engine->VR_Ship_Cockpit).
- COLOR_0 on EXACTLY 2 prims (hull + wings); the other 4 meshes carry NO COLOR_0.
- Mesh names VR_Ship_Hull(.001) + VR_Ship_Wings(.001) preserved (facet keys resolve).
- No floating islands / non-manifold / boundary / degenerate tris / ngons
  (blender-asset-qa, game profile). Duplicate-verts (color-split corners) and no-UV are
  ACCEPTED by design; in-flight ground_z is accepted (the ship hovers).
- All re-pins explicit old -> new in CHANGELOG + iterations.md + this file's lineage.
- assetGlbs + assetPerf green; npm test green (972/972, or the re-pinned count);
  npm run build 0; dist within the (re-negotiated) ceiling with a >= 102,400 B headroom
  floor; vendor sha 76DEA8151BC9352A unchanged; hygiene (ports free, no orphan
  chrome/node).

## Risks
- Over-detail fragmenting into many tiny tris that do not read at gameplay scale ->
  favor bold silhouette + a FEW large insets (the grounding); verify in the in-game tint
  A/B.
- A node / material / MESH name rename breaking useGLB routing or the facet keys ->
  keep the 6 node names, 3 material names, and the hull + wings mesh names; verify by
  re-running assetGlbs.
- File exceeding the byte budget -> int8 normals + drop to the lower tri band (~800); if
  still over, re-pin the caps EXPLICITLY or roll back to the 112-tri ship (CG gate).
  Never a silent re-pin.
- Accidentally "fixing" the Engine -> VR_Ship_Cockpit mapping -> that mapping produces a
  cyan-glow engine accent beside the warm flame (current committed look); changing it
  alters the rendered look and requires a fresh CG A/B. Do not change it.
- The dist-ceiling raise being read as scope creep -> it is a one-time user-requested
  asset investment ("use polygons and gpu resource as much as needed"); recorded
  old -> new, still ~2.1 MB total (trivial for a web game).

## Changed files or proposed files
- I428 (this iteration, DOCS-only): design/asset-spec-ship-remaster.md (this file) - new.
- I429 (ST-399, Blender remaster):
  - assets/ship.glb (in place - the remaster).
  - src/render/shipMesh.js - silhouette-matched procedural fallback geos + header comment
    IF the new silhouette diverges from the fallback (I211 contract: the fallback must
    still read like the GLB). Only if needed.
  - tests/assetGlbs.test.js - SHIP_FACET + BUDGETS.ship explicit re-pins.
  - tests/assetPerf.test.js - totalTris + perFileKB / totalFilesKB / totalGeoKB re-pins
    IF the measured file requires.

## Verification evidence
- I428 (this iteration, DOCS-only): npm test 972/972 unchanged (no src/assets touched);
  npm run build 0 + dist byte-identical 138 / 1,990,546 B; vendor sha 76DEA8151BC9352A;
  hygiene (0 listeners on 5173/4173/5199, 0 chrome, 0 orphan serve.mjs).
- Ground-truth facts scanned this session (all re-verified, not assumed):
  - assets/ship.glb = 14,472 B / 112 tris / 6 nodes / 3 mats / 6 prims / 2 COLOR_0 prims
    (hull + wings) / extent x=2.44 y=0.6998 z=1.722 / facet cLo 0.712 cHi 1.55 /
    grayscale grayDev 0. Node->mesh->material map confirmed (Engine -> VR_Ship_Cockpit).
  - assetGlbs.test.js: BUDGETS.ship = 300 (line 18); node checks (76-77); material
    checks (78-79); tri cap (81); wingspan/length bands (94-95); exactly-2 COLOR_0 prims
    (130); facet mesh-name keys (131-132); SHIP_FACET pins (134); spread >= 0.35 (135-136).
  - assetPerf.test.js: BUDGET caps totalFilesKB 205 / totalGeoKB 165 / perFileKB 60 /
    totalTris 3000 / perFileMats 3 (49-55); exactly 24 GLBs (57).
  - shipMesh.js: useGLB material-name routing (159-162); ensureWhiteColors
    skip-if-COLOR_0-present (39); materials bodyMat/wingMat/cockpitMat (60-62).
  - config.js: ship palette body 0xab9374 / wing 0x54402e / cockpit 0x0b1830 + FROZEN
    cyan emissive 0x59d8ff (93-97); flame core/mid/glow (99-101).
  - No test asserts the dist ceiling (2,097,152) or headroom floor (102,400) - grep-
    verified across tests/, src/core/, scripts/; those are documentation-only.

## Next owner or decision
- ST-399 (I429) is COMPLETE: ship.glb remastered to the 818-tri fighter (63,908 B),
  CG A/B SHIP gate PASS (no rollback to b819fc1 needed), and every pre-registered
  re-pin above was executed explicitly with measured values (incl. the dist-ceiling
  raise to 2,200,000 B).
- I430 = ST-400 (CUTTABLE other-asset realism, boss or arena): re-read cgs-dev-story +
  blender-asset-qa FIRST (standing order); CG A/B old vs new gate; explicit re-pins only
  if a cap is crossed; CUT (docs-only) if not clearly improved.
