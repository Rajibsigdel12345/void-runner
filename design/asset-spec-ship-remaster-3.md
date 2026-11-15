# Void Runner - Ship Remaster v3 "Dense Real Airship" Asset Spec (I439 / cgs-asset-spec) - ST-410 contract

## Summary
This spec is the ST-410 (I440) contract for the Blender remaster v3 of assets/ship.glb:
the player ship grows from the I435 3,254-tri "real airship" v2 (190,544 B; measured) into a
substantially DENSER "real airship" v3 (~11,800 tris sweet, cap 14,000) - the same craft,
built out: a displacement-plated hull (subdivide + low-amplitude displace for plating/rib
read), denser TWIN engine nacelles (cowl panels, fan rings, cooling fins, struts), a richer
multi-pane canopy, twin tail fins with strakes + finlets, winglets with tip plates, and the
REAL-AIRSHIP detail language (belly catwalk, stay cables, antenna masts, filler plates) -
achieved with displacement-driven hyper-detail + NON-BOOLEAN panel/greeble passes, NOT a
high-poly sculpt. This is the MAIN deliverable of E56 (production/scope-check-E56.md, I438).
The user says the v2 airship still reads small/undersetailed - the goal is a ship that reads
DENSE and heavily built at gameplay scale, 2.5-4x the triangle density of v2.

The remaster is GEOMETRY-only + a re-baked per-facet grayscale value map, same as v1/v2
(design/asset-spec-ship-remaster.md I428, design/asset-spec-ship-remaster-2.md I434).
Everything else stays: the in-code palette tint (CONFIG.ship.palette), the FROZEN cockpit
cyan emissive, the collision model (radius 0.9, unchanged), the 3 material names, the 6
VR_Ship_* node names, COLOR_0 on EXACTLY the hull + wings prims, and the in-code flame
anchored at x=0, y=0, z=-0.8 (shipMesh.js:122/134/142 - a single CENTRAL flame column; the
twin nacelles flank the dominant central bell). The renderer (src/render/shipMesh.js useGLB
material-name routing + ensureWhiteColors) is untouched. Grounded in fresh YouTube
hard-surface references (I438, all UNVERIFIED-BY-PLAY): displacement hyper-detail
(CPwTrMi4nRk) + non-boolean panels/greebles, no paid addons (xUDwvLeL7vM) + real-airship
detail language: catwalks/cables/antennas/filler (hSo1EE0pZnc) + detail-without-overwork
guard (DX36hit2g0s); reused from I433: greebles-as-function (zit7UmzcSgU) + non-boolean
panel insets (k2vTtHj0MME).

Core principle (unchanged from design/asset-spec.md): the GLB supplies GEOMETRY + the
grayscale per-facet COLOR_0 value map; all dynamic material behavior (palette tint, cockpit
emissive, invuln blink, additive engine flame) stays in code.

## Asset Purpose
- Keep the v2 SILHOUETTE LANGUAGE (the CG gate compares v2 vs v3: it must read as the SAME
  craft, clearly denser and more built-up - not a different ship and not a noisier one):
  pointed nose, chunky multi-bulge fuselage, wide swept wings with strakes + winglets,
  TWIN swept tail fins, TWIN engine nacelles flanking a dominant central exhaust bell.
- Add DENSITY in three layers, in priority order:
  (1) PLATING - displacement subdiv + low-amplitude displace on hull + wings so the
  surfaces read as built-up plating/ribs at play distance (CPwTrMi4nRk method);
  (2) PANELS - BOLD non-boolean panel insets (inset/outset + bubble/solidify -0.01, no
  booleans) on hull + wings + cowl (k2vTtHj0MME + xUDwvLeL7vM);
  (3) GREEBLES - the real-airship vocabulary (hSo1EE0pZnc): belly catwalk + struts, stay
  cables (thin 4-6 sided cylinders), antenna masts, filler plates, vent grilles - bounded
  by the greeble budget below (DX36hit2g0s anti-overwork guard: detail must not become
  unreadable noise).
- "Denser" is achieved INSIDE the fixed x/z test bands (wingspan 2.5 +/-0.25, length
  1.9 +/-0.19) and the ship-box y headroom (-0.275..+0.45) - displacement AMPLITUDE is
  capped so the bands hold; the read comes from surface + part count, not size.
- Keep the ship the player's "hero" accent: the FROZEN cockpit cyan emissive is the
  identity; the warm body + umber wing palette (E19) is the tone; the value bake gives the
  bright-nose / dark-belly form read on top of the plating.
- Read as a substantial fast attack AIRSHIP (asteroids-style arcade) - denser and heavier
  than v2, still NOT a realistic zeppelin and NOT a carrier.

## States
- Single static state. No animation, no rig, no morph targets, no skin - all motion is
  in-code transform (shipMesh.js moves the group) + in-code material (flame, invuln blink).
  The GLB is a plain static glTF 2.0 mesh set.
- No weapon / weapon-charge / powerup state on the ship model itself (separate emblems).
- Container: 6 nodes -> 6 meshes -> 3 materials, static, no UVs.

## Technical Constraints (the load-bearing contract - PRESERVED from v1/v2)
Container:
- glTF Binary (.glb), glTF 2.0, Y-up, 1 Blender unit = 1 world unit.
- No rig / animation / morph targets / skins / UVs (UV-free by design - value bake;
  export_texcoords=False + strip uv_layers).
- Every mesh needs POSITION + NORMAL (assetPerf hard rule, assetPerf.test.js:85-93).
  f32 POSITION + f32 NORMAL everywhere (v2 measured byte model: 4,905 verts -> 190,544 B
  = 38.85 B/vert avg incl. u16 indices); f32 COLOR_0 on hull + wings corner-domain bake.
  int8 NORMALs are a REGISTERED byte-mitigation (I420 precedent; render-inert for the
  flatShading bodyMat/wingMat; only the smooth cockpit reads normals) - use only if the
  measured file exceeds 393,216 B, then record it here at I440.
- Byte budget: ship.glb target ~310-380 KB (v3 projected at ~8,000-9,500 verts), HARD cap
  = the re-pinned assetGlbs MAX_FILE_BYTES 393,216 (384 KB).

Naming (EXACT - load-bearing; verified against the live GLB + code + tests at I438):
- 6 nodes (objects): VR_Ship_Hull, VR_Ship_Wings, VR_Ship_Cockpit, VR_Ship_Fin,
  VR_Ship_Engine, VR_Ship_Nozzle. Do NOT add a 7th node - twin + dense elements are merged
  INTO their node (both fins in VR_Ship_Fin, both nacelles + cowl detail in VR_Ship_Engine,
  central bell + outer port rings in VR_Ship_Nozzle, catwalk/cables/antennas join the node
  whose surface they attach to: belly catwalk + stay cables -> VR_Ship_Hull, wing cables ->
  VR_Ship_Wings, fin antenna -> VR_Ship_Fin, cowl struts -> VR_Ship_Engine).
- 3 materials: VR_Ship_Hull, VR_Ship_Wing, VR_Ship_Cockpit.
- Facet test keys off MESH names (assetGlbs.test.js:135-137, verified I438): the hull MESH
  must be named 'VR_Ship_Hull.001' or 'VR_Ship_Hull', the wings MESH 'VR_Ship_Wings.001' or
  'VR_Ship_Wings'. The Blender exporter appends '.001' when the object already takes the
  bare name. KEEP these mesh names so the facet keys still resolve.
- Node -> material mapping (PRESERVE exactly - it drives useGLB routing + the rendered
  look; shipMesh.js:159-162 routes by MATERIAL name substring):

  Node            Material          COLOR_0   useGLB route
  --------------  ----------------  --------  ----------------------------------------
  VR_Ship_Hull    VR_Ship_Hull      YES       bodyMat (keeps the GLB COLOR_0 value bake)
  VR_Ship_Wings   VR_Ship_Wing      YES       wingMat (keeps the GLB COLOR_0 value bake)
  VR_Ship_Cockpit VR_Ship_Cockpit   no        cockpitMat (FROZEN cyan emissive)
  VR_Ship_Engine  VR_Ship_Cockpit   no        cockpitMat (CURRENT state - the engine
                                              nacelles are a cyan-glow accent beside
                                              the warm flame; do NOT "fix" to
                                              VR_Ship_Hull)
  VR_Ship_Fin     VR_Ship_Wing      no        wingMat (white-identity COLOR_0 added in code)
  VR_Ship_Nozzle  VR_Ship_Hull      no        bodyMat (white-identity COLOR_0 added in code)

COLOR_0 value bake (EXACTLY 2 prims - hull + wings):
- Per-facet grayscale, corner-domain, FLOAT VEC3, count == POSITION count, r==g==b within
  0.02, values in [0.30, 1.55] (assetGlbs.test.js checks).
- Formula (unchanged I292/ST-275/I429/I435): v = clamp(1.0 + k*dot(n, L), 0.30, 1.55) where
  n is the face normal in the ship's LOCAL space (nose +Z, up +Y, engine -Z), L the fixed
  bake light (-0.45, 0.70, 0.55), SEED 42117 (I421/I425/I429/I435 precedent). k = 0.55
  (hull) / 0.80 (wings) unless the denser geometry reads flat - in that case tune k and
  record it here at I440 (measured, never silent).
- Bake ORDER for v3: bake AFTER the displacement pass is applied (so the plating/rib
  normals drive the value variation - that is what makes the plating read) but the p50
  spread must stay >= 0.35 (assetGlbs.test.js:139-140) - if the fine displacement flattens
  the spread, bake on the pre-fine-displacement normal field and record it here.
- Only the Hull and Wings meshes carry COLOR_0. Cockpit / Engine / Fin / Nozzle must NOT
  carry COLOR_0 (Fin / Nozzle / Engine get white-identity in code via ensureWhiteColors;
  Cockpit uses its own emissive).

Extent (keep inside the ship box so collision + flame + camera alignment hold):
- Test bands (assetGlbs.test.js:94-95, over the WHOLE ship bounding box): wingspan(x)
  2.5 +/- 0.25 (i.e. [2.25, 2.75]); length(z) 1.9 +/- 0.19 (i.e. [1.71, 2.09]). The current
  v2 ship is 2.500 / 1.850 (I435 measured) - v3 must stay inside these bands; the v2
  mid-band position gives ~0.05-0.12 of displacement headroom before a band break.
- y is NOT test-banded: allow the twin fins / canopy / antenna masts to use the ship-box
  headroom y in [-0.275, +0.45] (v2 top ~0.44 is already near the fin-top allowance;
  antennas may use the last millimeters, the hull belly must stay >= -0.275).
- Orientation: nose +Z, engine/nozzle -Z (back), fins up (+Y), wings swept back.
- The in-code flame apex is anchored at x=0, y=0, z=-0.8 (shipMesh.js:122/134; glow at
  z=-0.88). The CENTRAL nozzle bell mouth MUST contain (0, 0, -0.8) and be open toward -Z
  so the flame emerges from it, and the central bell MUST stay the DOMINANT aft feature
  (the single central flame column is the read); the two OUTER port mouths are decorative
  (closed rings acceptable), sit at similar z, and stay SMALL relative to the central bell
  (v2 rim r0.190 was the reference; the central bell rim stays >= 0.19).

Poly budget (per node; sweet 11,800 total; band ~9,650-14,000; cap = re-pinned
BUDGETS.ship 14000; land at ~9,000 - still 2.7x v2 - if the byte/ceiling fight hits):
- VR_Ship_Hull    ~3,800 tris (3,200-4,400): v2 chunky multi-bulge fuselage, refined -
  subdivision + low-amplitude displacement plating (ribs + plate seams), 5-8 BOLD
  non-boolean panel insets, 2-3 side vent-grille plate insets, stepped heavy belly +
  BELLY CATWALK (plank plate + 2-3 struts + rail posts), top antenna mast + 2 short
  struts + 2-3 stay cables, nose sensor greeble, rear taper to the engine mount (-Z).
  COLOR_0.
- VR_Ship_Wings   ~2,400 tris (2,000-2,800): larger swept-back wings (span 2.5, x
  +/-1.25) - thicker airfoil cross-section (4-6 vertical segments), leading-edge strakes
  near the fuselage, winglet tips with small tip plates, 3-6 large panel insets on the
  wing faces + 2-4 greeble ribs, 2 short stay cables from wing root to fuselage.
  COLOR_0.
- VR_Ship_Cockpit ~750 tris (600-900): multi-pane canopy - faceted dome + 5-8 frame
  mullions as geometry on the SAME mesh, a small sensor greeble + 1 thin antenna on the
  canopy base.
- VR_Ship_Fin     ~1,200 tris (900-1,500): TWIN swept vertical tail fins (BOTH fins in
  this one node) flanking the aft fuselage - each with a leading-edge strake + 1 finlet +
  1-2 plate insets; 1 thin antenna between the fin roots.
- VR_Ship_Engine  ~2,800 tris (2,300-3,300): TWIN engine nacelles (BOTH nacelles in this
  one node) flanking the rear fuselage - each: rounded intake lip (4-6 segments), denser
  fan-ring detail, cowl panel seams (displacement), 1-2 side exhaust greebles, 3-6 small
  cooling-fin plates, 1-2 cowl struts to the fuselage. Chunky; these are the "big" read.
- VR_Ship_Nozzle  ~850 tris (650-1,100): the CENTRAL main nozzle bell (mouth contains
  (0,0,-0.8), open toward -Z, rim r >= 0.19, 8-12 rim segments - the DOMINANT aft feature)
  + two small outer port rings on the nacelles (decorative). All in this one node.
- Sweet total 11,800 tris (band ~9,650-14,000; cap = re-pinned BUDGETS.ship 14000).
- Greeble budget (anti-over-detail, function-first, DX36hit2g0s guard): at most ~40
  greeble elements total across the 6 nodes, each >= ~12 tris; cables as thin 4-6 sided
  cylinders; every greeble must read at gameplay scale in the in-game tint A/B or be cut.
  Silhouette mass first, plating second, greebles third.

Re-pins (pre-registered in production/scope-check-E56.md + the E56 epic block; ALL explicit
old -> new at I440, NEVER silent; measured values fill the "actual" column):
- BUDGETS.ship (assetGlbs.test.js:18): 4500 -> 14000 (actual expected ~9,000-13,000,
  sweet ~11,800).
- MAX_FILE_BYTES (assetGlbs.test.js:19; the ship check is :74): 262,144 -> 393,216 (384 KB;
  actual expected ~310-380 KB). NOTE: MAX_FILE_BYTES is shared by many assets - the raise
  only gives the ship headroom; every OTHER asset stays far below it (current max non-ship
  = boss 75.26 KB).
- SHIP_FACET (assetGlbs.test.js:138): v2 hull {p10 0.5644, p50 1.0165, p90 1.4302} + wings
  {p10 0.3612, p50 0.9469, p90 1.55} (spread hull 0.8657 / wings 1.1888) -> re-measured on
  the v3 re-bake (tol 0.005 at :142; spread >= 0.35 floor at :139-140 must hold).
- assetPerf BUDGET (assetPerf.test.js:50-54): totalTris 8000 -> 20000 / totalFilesKB
  560 -> 768 / totalGeoKB 520 -> 700 / perFileKB 256 -> 400 (actuals expected:
  totalTris 6384 - 3254 + ~11,800 ~= 14,930; totalFilesKB 424.34 - 186.08 + ~350 ~= 588;
  perFileKB ~= 350-380 - ship.glb). perFileMats 3 + exactly-24-GLBs (assetPerf.test.js:
  57-58) UNCHANGED (ship stays exactly 1 file; the COLOR_0 withColor list already includes
  ship.glb).
- dist ceiling (DOC-ONLY; VERIFIED no test asserts it or the 102,400 B headroom floor):
  RAISED 2,460,000 B -> 2,700,000 B (ONE-TIME re-negotiation executed at the E56 build
  stories ST-410/ST-411, not this spec story; floor 102,400 B kept; projected post-E56
  ~2.5-2.55 MB).
- playframe (PROBE-ONLY, .evidence/I*/playframe.mjs, NOT in tests/): L 21/3508 + B 50/7872
  WILL MOVE (the ship IS in the playframe: expect L + (newShip - 3254) and B +
  2x(newShip - 3254), plus the L-rock delta if ST-411 lands before ST-413) -> RE-MEASURE +
  decompose + document at ST-413 (I443), same decomp pattern as I437
  (.evidence/I437/decomp.json). P 10/180 expected unchanged (overhead frame, no ship).
- Expect ZERO (re-run exact at ST-413): causal p1 (seed 9876: 18/18 - 11334/57/W2/combo
  15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed
  4/MENU), rockab radii 2.2/1.3/0.7 (reseed 30201), PWA 11/11.
- Out of scope for THIS asset: asteroid L/L_B + comet densify (ST-411, I441; its re-pins
  BUDGETS.L 500 -> 2100 + BUDGETS.comet 200 -> 650 + ROCK_FACET.L/_B.L re-bakes live in
  scope-check-E56.md) and the WebGPU re-eval (ST-412, I442, DOCS-only).

## Displacement + detail plan (v3-specific, static per E41)
- Technique (CPwTrMi4nRk, grounded I438): start from the I435 v2 deterministic build
  (.evidence/I435/build_ship_v2.py) so the silhouette language carries over; refine the
  HULL and WINGS with a bmesh subdivision pass (2 levels) + a SEEDED noise/Voronoi
  displacement at LOW world-unit strength (hull plating <= ~0.012, wings <= ~0.008) so the
  surfaces read as plating/ribs, not grain; bold forms first, texture second
  (DX36hit2g0s guard).
- Manifold discipline: keep the mesh welded + manifold through the subdiv/displace; run
  bmesh.ops.recalc_face_normals before ANY bevel (I435 lesson - inconsistent winding fed
  bmesh.ops.bevel and produced the mid-build nozzle defect); no booleans anywhere
  (k2vTtHj0MME + xUDwvLeL7vM): panels are inset/outset + bubble + solidify(-0.01).
- All random selection (panel face picks, cable endpoint jitter, greeble placement) flows
  through ONE fixed seed so the build script is deterministic and reproducible.
- Extent cap is part of the build: after each detail pass, assert the bounding box stays
  inside the test bands (span [2.25, 2.75], len [1.71, 2.09], y [-0.275, +0.45]) and the
  central bell mouth contains (0, 0, -0.8); if a pass breaks a band, reduce that pass's
  amplitude/placement, never scale the whole ship in code (out of scope - collision/camera/
  flame would move).
- Export (Blender 5.2.3, I436 pitfall registered): all-polygons use_smooth=True, NO
  auto-30 modifier (shade_auto_smooth + export_apply splits verts at 30-deg creases);
  export_texcoords=False + strip uv_layers; triangulate per node with bmesh.ops.triangulate
  (Blender 5.2 has no bpy.ops.mesh.triangulate).

## Facet value-bake plan
- After the remaster geometry is joined per node + triangulated, run the per-facet
  grayscale bake on the Hull and Wings meshes only (corner-domain, count == POSITION
  count, r==g==b): for each face, v = clamp(1.0 + k*dot(n, L), 0.30, 1.55) with the fixed
  light L = (-0.45, 0.70, 0.55), SEED 42117, k per part (hull 0.55 / wings 0.80) - see the
  bake-order note under COLOR_0 (bake after displacement; fall back to the pre-fine-
  displacement normal field if the spread < 0.35).
- Reuse .evidence/I425_buildEmblems.py (value-bake template) + the I435 v2 build
  (deterministic ship build = the v3 STARTING POINT) + .evidence/I425/scan_emblems.cjs
  (facet p10/p50/p90 + spread scanner) .
- After export, MEASURE hull & wings facet p10/p50/p90 + spread, then set SHIP_FACET to
  those exact values (explicit old -> new, never silent).

## Acceptance Criteria
Silhouette / read (CG A/B SHIP gate, grayscale-clay + in-game tint, OLD v2 3,254-tri vs
NEW v3):
- 3/4 view + face-on + closeup: the new ship reads as the SAME craft, CLEARLY denser and
  more heavily built - plating/rib read on hull + wings, denser twin nacelles with cowl
  panels + cooling fins, richer multi-pane canopy, straked twin fins, winglets with tip
  plates, visible non-boolean insets, catwalk/cables/antennas at the silhouette - WITHOUT
  fragmenting into unreadable noise and WITHOUT losing the v2 silhouette language.
- In-game tint A/B (2 angles, ~34 deg + face-on, harness .evidence/I437/tint_437.mjs
  pattern - ship kept via whitelist, freeze + settle + double-render): the E19 warm body +
  umber wings + FROZEN cyan cockpit/nacelles read correctly; the central flame emerges
  from the dominant central bell mouth; the value bake gives the bright-nose / dark-belly
  form read on top of the plating; greebles that do not read at gameplay scale are cut,
  not kept.

Contract (ALL must hold, else ROLL BACK to the I435 ship.glb - backups in .evidence/I435/):
- Extent inside the test bands (wingspan(x) 2.5 +/- 0.25; length(z) 1.9 +/- 0.19) and the
  ship box (y -0.275..+0.45); central nozzle bell mouth contains (0,0,-0.8), open toward
  -Z, rim r >= 0.19, dominant over the outer decorative ports.
- Exactly 6 VR_Ship_* nodes, exactly 3 materials, node -> material mapping preserved
  (table above, incl. Engine -> VR_Ship_Cockpit).
- COLOR_0 on EXACTLY 2 prims (hull + wings); the other 4 meshes carry NO COLOR_0.
- Mesh names VR_Ship_Hull(.001) + VR_Ship_Wings(.001) preserved (facet keys resolve).
- No floating islands / non-manifold / boundary / degenerate tris / ngons
  (blender-asset-qa, game profile). Duplicate-verts (color-split corners) and no-UV are
  ACCEPTED by design; in-flight ground_z is accepted (the ship hovers).
- All re-pins explicit old -> new in CHANGELOG + iterations.md + this file's lineage
  (never silent).
- assetGlbs + assetPerf green; npm test green (972/972, or the re-pinned count);
  npm run build 0; dist within the (re-negotiated) 2,700,000 B ceiling with a >= 102,400 B
  headroom floor; vendor sha 76DEA8151BC9352A unchanged; hygiene (ports free, no orphan
  chrome/node).
- Procedural fallback (src/render/shipMesh.js) still reads like the GLB (I211 contract) -
  IF the new density diverges enough that the fallback misreads, update the fallback geos
  + header comment in the same story (only if needed).

## Risks
- Displacement reads as grain/noise instead of plating -> low amplitude (<= ~0.012 hull /
  <= ~0.008 wings), bold forms first, seeded so it is reproducible; the CG A/B gate is the
  arbiter (must read denser, not noisier); if it fails, ROLL BACK to the I435 ship.glb and
  re-scope (amplitude/levels), never ship noise.
- Vertex bloat from corner-domain COLOR_0 at v3 density -> measured v2 byte model is
  38.85 B/vert; v3 projected ~8,000-9,500 verts ~= 310-380 KB. If the measured file
  exceeds 393,216 B: (1) switch NORMALs to int8 (I420 precedent, saves 9 B/vert,
  render-inert), (2) drop one subdivision level, (3) land at the ~9,000-tri variant
  (still 2.7x v2), (4) only as a last resort re-pin MAX_FILE_BYTES EXPLICITLY - never
  silent.
- Facet spread < 0.35 after the displacement pass (fine normals flatten the value range)
  -> bake-order note above (bake after displacement; fall back to the pre-fine-
  displacement normal field); MEASURE, do not assume.
- Twin / dense elements accidentally split into new nodes (7th/8th node) -> the node check
  (assetGlbs.test.js) + the contract table; both fins join into VR_Ship_Fin, both nacelles
  into VR_Ship_Engine, central bell + outer ports into VR_Ship_Nozzle, attach-surface
  rule for catwalk/cables/antennas (Technical Constraints).
- A node / material / MESH name rename breaking useGLB routing or the facet keys -> keep
  the 6 node names, 3 material names, and the hull + wings mesh names; verify by
  re-running assetGlbs.
- Accidentally "fixing" the Engine -> VR_Ship_Cockpit mapping -> that mapping produces the
  cyan-glow nacelle accent beside the warm flame (current committed look); changing it
  alters the rendered look and requires a fresh CG A/B. Do not change it.
- The flame reading detached from the denser aft -> keep the CENTRAL bell dominant (rim
  r >= 0.19, mouth contains (0,0,-0.8) open toward -Z) and the outer ports small; verify
  in the in-game tint A/B (the flame shows in PLAYING, so use the playframe harness, not a
  menu shot).
- Over-detail fragmenting into tiny tris that do not read -> greeble budget (<= ~40
  elements, each >= ~12 tris) + the in-game tint A/B trims the rest + the DX36hit2g0s
  guard; favor PLATING + PANELS over greeble noise.
- dist ceiling: the one-time DOC-ONLY raise to 2,700,000 B happens at ST-410/ST-411 with
  measured dist; if the projection (~2.5-2.55 MB) is wrong in the bad direction, the
  102,400 B headroom floor is hard and the poly landing drops to ~9,000 (scope-cut), not
  the floor.

## Changed files or proposed files
- I439 (this iteration, DOCS-only): design/asset-spec-ship-remaster-3.md (this file) - new.
- I440 (ST-410, Blender remaster v3):
  - assets/ship.glb (in place - the v3 remaster).
  - tests/assetGlbs.test.js - BUDGETS.ship 4500 -> 14000 + MAX_FILE_BYTES 262,144 ->
    393,216 + SHIP_FACET re-pin (measured on the v3 re-bake).
  - tests/assetPerf.test.js - BUDGET totalFilesKB 560 -> 768 / totalGeoKB 520 -> 700 /
    perFileKB 256 -> 400 / totalTris 8000 -> 20000 re-pins (measured).
  - src/render/shipMesh.js - silhouette-matched procedural fallback geos + header comment
    IF the v3 density diverges from the fallback (I211 contract). Only if needed.
  - production/docs (iterations.md, CHANGELOG.md, stories.md, epics.md, timeline.md,
    active.md, scope-check-E56 notes) + the one-time dist-ceiling doc re-negotiation note.

## Verification evidence
- I439 (this iteration, DOCS-only): npm test 972/972 unchanged (no src/assets touched);
  npm run build 0 + dist byte-identical 2,251,526 B (headroom 208,474 vs the current
  2,460,000 B ceiling); vendor sha 76DEA8151BC9352A; hygiene (no server started, 0 chrome,
  node MCP-only).
- Ground-truth facts re-verified this iteration (I439, not assumed):
  - assets/ship.glb (I435 v2, git HEAD 5c59766) = 190,544 B / 3,254 tris / 4,905 verts;
    per-node: Hull 958t / Wings 672t / Cockpit 212t / Fin 432t / Engine 740t / Nozzle
    240t; mats VR_Ship_Hull/Wing/Cockpit; extent [2.5, 1.85, 0.70]; central nozzle mouth
    (0,0,-0.8) rim r0.190.
  - assetGlbs.test.js pins (re-read I439): BUDGETS.ship 4500 (:18) + BUDGETS.L 500 +
    BUDGETS.comet 200 (:18); MAX_FILE_BYTES 262144 (:19; ship check :74); span band
    2.5+/-0.25 (:94); length band 1.9+/-0.19 (:95); SHIP_FACET hull
    {0.5644/1.0165/1.4302} + wings {0.3612/0.9469/1.55} (:138, tol 0.005 at :142, spread
    >= 0.35 at :139-140).
  - assetPerf.test.js pins (re-read I439): BUDGET totalFilesKB 560 [424.34 actual] /
    totalGeoKB 520 [388.09] / perFileKB 256 [max 186.08 - ship.glb] / totalTris 8000
    [6384] / perFileMats 3 (:50-54); exactly 24 GLBs (:57-58); POSITION+NORMAL hard rule
    (:85-93).
  - Byte model: v2 measured 4,905 verts -> 190,544 B = 38.85 B/vert avg (f32
    POSITION+NORMAL, f32 COLOR_0 on hull+wings corner-domain, u16 indices). v3 at
    ~8,000-9,500 verts projects ~310-380 KB vs the 393,216 B cap.
  - shipMesh.js anchors (unchanged since I435): useGLB material-name routing (159-162);
    ensureWhiteColors skip-if-COLOR_0-present (39); flame apex (0,0,-0.8) single central
    column (122/134), glow sprite (0,0,-0.88) (142); shipGroup.visible re-set every frame
    at :190 (tint-harness gotcha).
  - config.js: ship palette body 0xab9374 / wing 0x54402e / cockpit 0x0b1830 + FROZEN
    cyan emissive 0x59d8ff @ 1.4 (pinned by the paletteHarmony test - do NOT change);
    collision radius 0.9.
  - dist: 2,251,526 B / ceiling 2,460,000 B (DOC-ONLY) / headroom 208,474 B / floor
    102,400 B; no test asserts the ceiling or floor (I429/I430/I437 precedent).

## Next owner or decision
- Next: ST-410 (I440) - Blender ship remaster v3 per this spec (re-read cgs-dev-story +
  blender-asset-qa + blender-hardsurface-modeling + blender-export FIRST). Deterministic
  build starting from .evidence/I435/build_ship_v2.py; clay renders (3/4 + face-on +
  closeup) + in-game tint A/B vs the v2 3,254-tri ship (harness .evidence/I437/
  tint_437.mjs pattern); CG A/B SHIP gate; ROLL BACK to the I435 ship.glb (.evidence/I435/
  backups) if not clearly denser + more built-up; execute the explicit re-pins with
  measured values (BUDGETS.ship, MAX_FILE_BYTES, SHIP_FACET, assetPerf BUDGET, dist-ceiling
  doc note).
- After ST-410: ST-411 (I441, CUTTABLE - asteroid L/L_B + comet densify per
  scope-check-E56.md) -> ST-412 (I442, WebGPU re-eval DOCS-only) -> ST-413 (I443, fresh
  R1-R5 + G56.0 + close E56).
