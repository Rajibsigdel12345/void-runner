# Void Runner - Ship Remaster v2 "Real Airship" Asset Spec (I434 / cgs-asset-spec) - ST-405 contract

## Summary
This spec is the ST-405 (I435) contract for the Blender remaster v2 of assets/ship.glb:
the player ship grows from the current 818-tri E54 detailed low-poly fighter
(63,908 B; measured I433) into a substantial "REAL AIRSHIP" (~2800-3600 tris, sweet
~3300) - a big, believable, feature-rich craft: a bulkier/rounder fuselage, TWIN
engine nacelles flanking the rear, larger swept wings with strakes + winglets +
panel insets, a proper multi-pane canopy, TWIN tail fins, and surface GREEBLES
(vents, struts, antenna, plate insets). This is the MAIN deliverable of E55
(production/scope-check-E55.md, I433). The user says the current fighter "still reads
small" - the goal is a ship that reads BIG and built-up at gameplay scale.

The remaster is GEOMETRY-only + a re-baked per-facet grayscale value map, same as
v1 (design/asset-spec-ship-remaster.md, I428). Everything else stays: the in-code
palette tint (CONFIG.ship.palette), the FROZEN cockpit cyan emissive, the collision
model (radius 0.9, unchanged), the 3 material names, the 6 VR_Ship_* node names,
COLOR_0 on EXACTLY the hull + wings prims, and the in-code flame anchored at x=0,
y=0, z=-0.8 (shipMesh.js:122/134/142 - a single CENTRAL flame column; the twin
nacelles therefore flank a central main exhaust port). The renderer
(src/render/shipMesh.js useGLB material-name routing + ensureWhiteColors) is
untouched. Grounded in YouTube ship references (I433, all UNVERIFIED-BY-PLAY):
GREEBLES (zit7UmzcSgU) + non-boolean panel insets (k2vTtHj0MME) + bulky
twin-nacelle structure (QWgKsOF3pB4 / woNKCTvQzXY / nyHbH3Bg1Fs / GucZrV9PSfw).
Detail = greebles + a FEW bold panel insets + a BULKIER silhouette - NOT
high-poly sculpt.

Core principle (unchanged from design/asset-spec.md): the GLB supplies GEOMETRY +
the grayscale per-facet COLOR_0 value map; all dynamic material behavior (palette
tint, cockpit emissive, invuln blink, additive engine flame) stays in code.

## Asset Purpose
- Replace the 818-tri fighter with an airship whose SILHOUETTE reads as a big,
  heavy, built-up craft at gameplay scale: a distinct pointed nose, a chunky
  multi-bulge fuselage, wide swept wings with winglets, TWIN vertical tail fins,
  and TWIN engine nacelles (visual doubling) - plus SURFACE that reads as built-up
  (BOLD hard-surface panel insets + a bounded greeble set) without a single
  texture.
- "Bigger" is achieved INSIDE the fixed x/z test bands (wingspan 2.5 +/-0.25,
  length 1.9 +/-0.19) by: (1) BULK - a thicker fuselage cross-section and wing
  airfoil (y is NOT test-banded; the ship box allows y -0.275..+0.45); (2)
  TWINNING - twin nacelles + twin tail fins double the read mass; (3) MASS
  DISTRIBUTION - a longer heavy nose + a stepped heavy belly + a tall aft
  (twin fins) so the outline fills more of the box; (4) DETAIL - greebles + insets
  that read at distance as surface, not emptiness.
- Keep the ship the player's "hero" accent: the FROZEN cockpit cyan emissive is the
  identity; the warm body + umber wing palette (E19) is the tone; the value bake
  gives the bright-nose / dark-belly form read on top.
- Read as a substantial fast attack airship (asteroids-style arcade), NOT a
  realistic zeppelin and NOT a bulky carrier.

## States
- Single static state. No animation, no rig, no morph targets, no skin - all motion
  is in-code transform (shipMesh.js moves the group) + in-code material (flame,
  invuln blink). The GLB is a plain static glTF 2.0 mesh set.
- No weapon / weapon-charge / powerup state on the ship model itself (those are
  separate emblems/sprites).
- Container: 6 nodes -> 6 meshes -> 3 materials, static, no UVs.

## Technical Constraints (the load-bearing contract - PRESERVED from v1)
Container:
- glTF Binary (.glb), glTF 2.0, Y-up, 1 Blender unit = 1 world unit.
- No rig / animation / morph targets / skins / UVs (UV-free by design - value bake;
  export_texcoords=False + strip uv_layers).
- Every mesh needs POSITION + NORMAL (assetPerf hard rule, assetPerf.test.js:85-93).
- Byte budget: ship.glb target ~180-250 KB, HARD cap = the re-pinned
  assetGlbs MAX_FILE_BYTES (~256 KB; see re-pin table). int8 NORMALs recommended
  (I420 precedent; render-inert for flatShading bodyMat/wingMat; only the smooth
  cockpit uses normals). Fall back to FLOAT normals only if a normal artifact
  appears in the A/B.

Naming (EXACT - load-bearing; verified against the live GLB + code + tests):
- 6 nodes (objects): VR_Ship_Hull, VR_Ship_Wings, VR_Ship_Cockpit, VR_Ship_Fin,
  VR_Ship_Engine, VR_Ship_Nozzle. Do NOT add a 7th node - twin elements are merged
  INTO their node (both fins in VR_Ship_Fin, both nacelles in VR_Ship_Engine, both
  outer ports + the central port in VR_Ship_Nozzle).
- 3 materials: VR_Ship_Hull, VR_Ship_Wing, VR_Ship_Cockpit.
- Facet test keys off MESH names (assetGlbs.test.js:135-137 region, verified I433):
  the hull MESH must be named 'VR_Ship_Hull.001' or 'VR_Ship_Hull', the wings MESH
  'VR_Ship_Wings.001' or 'VR_Ship_Wings'. The Blender exporter appends '.001' when
  the object already takes the bare name. KEEP these mesh names so the facet keys
  still resolve.
- Node -> material mapping (PRESERVE exactly - it drives useGLB routing + the
  rendered look; shipMesh.js:159-162 routes by MATERIAL name substring):

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
- Per-facet grayscale, corner-domain, FLOAT VEC3, count == POSITION count, r==g==b
  within 0.02, values in [0.30, 1.55] (assetGlbs.test.js checks).
- Formula (unchanged I292/ST-275/I429): v = clamp(1.0 + k*dot(n, L), 0.30, 1.55)
  where n is the face normal in the ship's LOCAL space (nose +Z, up +Y, engine -Z),
  L the fixed bake light (-0.45, 0.70, 0.55), SEED 42117 (I421/I425/I429
  precedent). k = 0.55 (hull) / 0.80 (wings) unless the new geometry reads flat -
  in that case tune k and record it here at I435.
- Only the Hull and Wings meshes carry COLOR_0. Cockpit / Engine / Fin / Nozzle
  must NOT carry COLOR_0 (Fin / Nozzle / Engine get white-identity in code via
  ensureWhiteColors; Cockpit uses its own emissive).

Extent (keep inside the ship box so collision + flame + camera alignment hold):
- Test bands (assetGlbs.test.js:94-95, over the WHOLE ship bounding box):
  wingspan(x) 2.5 +/- 0.25 (i.e. [2.25, 2.75]); length(z) 1.9 +/- 0.19 (i.e.
  [1.71, 2.09]). The current ship is 2.504 / 1.770 (I433 measured) - the remaster
  must stay inside these bands.
- y is NOT test-banded: allow the twin fins / canopy to use the ship-box headroom
  y in [-0.275, +0.45] (current 0.440 top is already near the fin-top allowance;
  keep the hull belly >= -0.275).
- Orientation: nose +Z, engine/nozzle -Z (back), fins up (+Y), wings swept back.
- The in-code flame apex is anchored at x=0, y=0, z=-0.8 (shipMesh.js:122/134;
  glow at z=-0.88; mouth at z=-0.902 in the procedural fallback). The CENTRAL
  nozzle port mouth MUST contain (0, 0, -0.8) and be open toward -Z so the flame
  emerges from it; the two OUTER port mouths are decorative (they may be closed
  rings) but should sit at similar z so the aft reads as one exhaust bank.

Poly budget (per node; sweet ~3300 total; within the re-pinned BUDGETS.ship 4500):
- VR_Ship_Hull    ~1200 tris (1000-1450): chunky 10-sided faceted fuselage -
  pointed multi-stage nose (nose cone cap + small sensor greeble), forward cockpit
  bulge, mid-body with 5-7 BOLD panel insets (inset/outset, NOT booleans), stepped
  heavy belly, 2-3 side vent-grille plate insets, top antenna mast + 2 short
  struts, rear taper to the engine mount (-Z). COLOR_0.
- VR_Ship_Wings   ~850 tris (700-1050): larger swept-back wings (span 2.5, x
  +/-1.25), thick airfoil cross-section (3-4 vertical segments), leading-edge
  strakes near the fuselage, winglet tips, 2-4 large panel insets on the wing
  faces. COLOR_0.
- VR_Ship_Cockpit ~220 tris (180-300): multi-pane canopy - faceted dome + 3-5
  frame mullions as geometry on the SAME mesh (the frame reads the canopy as
  paneled, not smooth). Slightly larger than the current 80-tri dome.
- VR_Ship_Fin     ~280 tris (200-380): TWIN swept vertical tail fins (BOTH fins in
  this one node), flanking the aft fuselage, each with a small strake/finlet + 1
  inset; taller than the current single 24-tri fin (fills the y headroom to ~0.45).
- VR_Ship_Engine  ~550 tris (450-700): TWIN engine nacelles (BOTH nacelles in this
  one node) flanking the rear fuselage - each: rounded intake lip (3-4 segments),
  fan-ring detail, 1-2 side exhaust greebles. Chunky; these are the "big" read.
- VR_Ship_Nozzle  ~200 tris (160-300): the CENTRAL main nozzle (mouth contains
  (0,0,-0.8), open toward -Z) + two small outer port rings on the nacelles
  (decorative). All in this one node.
- Sweet total ~3300 tris (band ~2900-4180; cap = re-pinned BUDGETS.ship 4500).
- Greeble budget (anti-over-detail): at most ~15 greeble elements total across
  hull+wings, each >= ~8 tris; every greeble must read at gameplay scale in the
  in-game tint A/B or be cut. Silhouette mass first, greebles second.

Re-pins (pre-registered in scope-check-E55.md + the E55 epic block; ALL explicit
old -> new at I435, NEVER silent; measured values fill the "actual" column):
- BUDGETS.ship (assetGlbs.test.js:18): 850 -> 4500 (actual ~2900-4180).
- MAX_FILE_BYTES (assetGlbs.test.js:19; the ship check is :74): 100*1024 ->
  ~262144 (256 KB; actual ship file expected ~180-250 KB). NOTE: MAX_FILE_BYTES
  is shared by many assets - the raise only gives the ship headroom; every OTHER
  asset stays far below it (current max non-ship = boss 75.26 KB).
- SHIP_FACET (assetGlbs.test.js:138): current hull {p10 0.5477, p50 0.9802,
  p90 1.4414} + wings {p10 0.4329, p50 0.9696, p90 1.55} -> re-measured on the
  v2 re-bake (tol 0.005 at :142; spread >= 0.35 floor at :139-140 must hold).
- assetPerf BUDGET (assetPerf.test.js:49-55): totalFilesKB 320 -> ~560 /
  totalGeoKB 280 -> ~520 / perFileKB 85 -> ~256 / totalTris 4000 -> ~8000
  (actual expected ~3948 - 818 + ~3300 = ~6430). perFileMats 3 + exactly-24-GLBs
  (assetPerf.test.js:57-58) UNCHANGED (ship stays exactly 1 file; the COLOR_0
  withColor list at :94 already includes ship.glb).
- dist ceiling (DOC-ONLY; VERIFIED no test asserts it or the 102,400 B headroom
  floor): RAISED 2,260,000 B -> 2,460,000 B (FINALIZED at I435: measured dist
  138/2,236,670 B; headroom 223,330 B >= 102,400 B floor; also covers the ST-406 asset growth).
- playframe (PROBE-ONLY, .evidence/I*/playframe.mjs, NOT in tests/): L 21/1072 +
  B 50/2634 WILL MOVE (the ship IS in the playframe; expect L +~2482 once and
  B +~4964 in the cumulative 2-render window) -> RE-MEASURE + decompose +
  document at ST-407 (I437). P 10/180 expected unchanged (overhead frame, no
  ship).
- Expect ZERO (re-run exact at ST-407): causal p1 (seed 9876: 11334/57/W2/combo
  15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed
  4/MENU), rockab radii 2.2/1.3/0.7 (reseed 30201), PWA 11/11.

## Facet value-bake plan
- After the remaster geometry is joined per node + triangulated (bmesh.ops
  .triangulate - Blender 5.2 has no bpy.ops.mesh.triangulate), run the per-facet
  grayscale bake on the Hull and Wings meshes only: for each face, v =
  clamp(1.0 + k*dot(n, L), 0.30, 1.55) with the fixed light L + SEED 42117 and k
  per part (hull 0.55 / wings 0.80); write v to all 3 components of COLOR_0 at
  each face's vertices (corner domain where facets meet at different values,
  matching the current ship's crisp facets).
- Reuse .evidence/I425_buildEmblems.py (value-bake template) +
  .evidence/I429/build_ship.py (current 818-tri ship build = the v2 STARTING
  POINT) .
- After export, MEASURE hull & wings facet p10/p50/p90 + spread with
  .evidence/I425/scan_emblems.cjs, then set SHIP_FACET to those exact values
  (explicit old -> new).

## Acceptance Criteria
Silhouette / read (CG A/B gate, grayscale-clay + in-game tint, OLD 818-tri vs NEW):
- 3/4 view + face-on + closeup: the new ship reads as a CLEARLY more detailed AND
  BIGGER airship (chunky multi-bulge fuselage / twin nacelles / larger wings with
  strakes + winglets / twin tail fins / multi-pane canopy / visible insets +
  greebles), not merely a bigger or noisier version of the old fighter.
- In-game tint A/B (2 angles, ~34 deg + face-on, harness .evidence/I430/boss_tint2.mjs
  pattern): the E19 warm body + umber wings + FROZEN cyan cockpit/nacelles read
  correctly; the central flame emerges from the central nozzle mouth; the value
  bake gives the bright-nose / dark-belly form read; greebles read at gameplay
  scale (the ones that do not are cut, not kept).

Contract (ALL must hold, else ROLL BACK to the b015642 ship.glb):
- Extent inside the test bands (wingspan(x) 2.5 +/- 0.25; length(z) 1.9 +/- 0.19)
  and the ship box (y -0.275..+0.45); central nozzle mouth contains (0,0,-0.8).
- Exactly 6 VR_Ship_* nodes, exactly 3 materials, node->material mapping preserved
  (table above, incl. Engine->VR_Ship_Cockpit).
- COLOR_0 on EXACTLY 2 prims (hull + wings); the other 4 meshes carry NO COLOR_0.
- Mesh names VR_Ship_Hull(.001) + VR_Ship_Wings(.001) preserved (facet keys
  resolve).
- No floating islands / non-manifold / boundary / degenerate tris / ngons
  (blender-asset-qa, game profile). Duplicate-verts (color-split corners) and
  no-UV are ACCEPTED by design; in-flight ground_z is accepted (the ship hovers).
- All re-pins explicit old -> new in CHANGELOG + iterations.md + this file's
  lineage (never silent).
- assetGlbs + assetPerf green; npm test green (972/972, or the re-pinned count);
  npm run build 0; dist within the (re-negotiated) ceiling with a >= 102,400 B
  headroom floor; vendor sha 76DEA8151BC9352A unchanged; hygiene (ports free, no
  orphan chrome/node).
- Procedural fallback (src/render/shipMesh.js) still reads like the GLB (I211
  contract) - IF the new silhouette diverges enough that the fallback misreads,
  update the fallback geos + header comment in the same story (only if needed).

## Risks
- "Bigger" inside fixed x/z bands may still read small at gameplay scale ->
  the CG A/B gate is the arbiter: it must read clearly more detailed AND bigger;
  if it fails, ROLL BACK to the b015642 ship.glb and re-scope. Scaling the ship
  GROUP in code (which would move collision/camera/flame) is OUT of E55 scope -
  flag for a later epic if the user still wants more size.
- Over-detail fragmenting into tiny tris that do not read -> greeble budget
  (<= 15 elements, each >= ~8 tris) + the in-game tint A/B trims the rest.
  Favor BULK + TWINNING + a FEW large insets (the grounding).
- Twin elements accidentally split into new nodes (7th/8th node) -> the node
  check (assetGlbs.test.js) + the contract table above; both fins join into
  VR_Ship_Fin, both nacelles into VR_Ship_Engine, central + outer ports into
  VR_Ship_Nozzle.
- A node / material / MESH name rename breaking useGLB routing or the facet keys
  -> keep the 6 node names, 3 material names, and the hull + wings mesh names;
  verify by re-running assetGlbs.
- File exceeding the byte budget -> int8 normals + drop to the lower tri band
  (~2900); if still over, re-pin the caps EXPLICITLY or roll back (CG gate).
  Never a silent re-pin.
- Accidentally "fixing" the Engine -> VR_Ship_Cockpit mapping -> that mapping
  produces the cyan-glow nacelle accent beside the warm flame (current committed
  look); changing it alters the rendered look and requires a fresh CG A/B. Do not
  change it.
- The flame reading detached from the twin nacelles -> keep the CENTRAL main port
  as the flame source (mouth contains (0,0,-0.8) open toward -Z) and the outer
  ports visually continuous with it; verify in the in-game tint A/B (the flame
  shows in PLAYING, so use the playframe harness, not a menu shot).

## Changed files or proposed files
- I434 (this iteration, DOCS-only): design/asset-spec-ship-remaster-2.md (this
  file) - new.
- I435 (ST-405, Blender remaster v2):
  - assets/ship.glb (in place - the v2 remaster).
  - tests/assetGlbs.test.js - BUDGETS.ship 850 -> 4500 + MAX_FILE_BYTES 100*1024
    -> ~262144 + SHIP_FACET re-pin (measured).
  - tests/assetPerf.test.js - BUDGET totalFilesKB / totalGeoKB / perFileKB /
    totalTris re-pins (measured).
  - src/render/shipMesh.js - silhouette-matched procedural fallback geos + header
    comment IF the new silhouette diverges from the fallback (I211 contract).
    Only if needed.
  - production/docs (iterations.md, CHANGELOG.md, stories.md, epics.md,
    timeline.md, active.md, regression-report/scope-check E55 notes).

## Verification evidence
- I434 (this iteration, DOCS-only): npm test 972/972 unchanged (no src/assets
  touched); npm run build 0 + dist byte-identical 138 / 2,110,034 B; vendor sha
  76DEA8151BC9352A; hygiene (no server started, 0 chrome, node MCP-only).
- Ground-truth facts scanned this session (all re-verified, not assumed):
  - assets/ship.glb (b015642) = 63,908 B / 818 tris / 1549 verts; per-mesh:
    Cockpit 80t / Engine 102t / Fin 24t / Hull 386t (1050 v, COLOR_0) / Nozzle
    46t / Wings 180t (359 v, COLOR_0); mats VR_Ship_Hull/Wing/Cockpit; extent
    x -1.252..1.252 (span 2.504) / y -0.250..0.440 / z -0.920..0.850 (len
    1.770). Probes: .evidence/I433/probe_ship.mjs + probe_ship2.mjs.
  - Byte model: ~24 B/uncolored vert (POSITION + NORMAL f32) + ~36 B/colored vert
    (+ COLOR_0 f32) + u16 idx ~2 B/tri. At ~3300 tris the file lands ~180-250 KB
    (the current 818-tri file = 63,908 B at 1549 verts ~ 41 B/vert average,
    including index + container overhead).
  - shipMesh.js: useGLB material-name routing (159-162); ensureWhiteColors
    skip-if-COLOR_0-present (39); flame apex at (0,0,-0.8) single central column
    (122/134), glow sprite (0,0,-0.88) (142), procedural nozzle (0,0,-0.775)
    spans z -0.90..-0.65 (96), mouth (0,0,-0.902) (102).
  - config.js: ship palette body 0xab9374 / wing 0x54402e / cockpit 0x0b1830 +
    FROZEN cyan emissive 0x59d8ff @ 1.4 (93-96; pinned by the paletteHarmony
    test - do NOT change); collision radius 0.9.
  - assetGlbs.test.js pins (verified I433/I434): BUDGETS.ship 850 (:18),
    MAX_FILE_BYTES 100*1024 (:19; ship check :74), tri cap (:81), wingspan band
    2.5+/-0.25 (:94), length band 1.9+/-0.19 (:95), colorPrims==2 (:109-112,
    :134), facet mesh-name keys + SHIP_FACET (:135-142, tol 0.005, spread
    >= 0.35).
  - assetPerf.test.js pins (verified I434): BUDGET totalFilesKB 320 /
    totalGeoKB 280 / perFileKB 85 / totalTris 4000 / perFileMats 3 (:49-55);
    exactly 24 GLBs (:57-58); POSITION+NORMAL hard rule (:85-93); withColor list
    includes ship.glb (:94).
  - No test asserts the dist ceiling (2,460,000 as of I435) or headroom floor (102,400) -
    grep-verified (I429/I430 precedent); those are documentation-only.

## Next owner or decision
- Next: ST-405 (I435) - Blender ship remaster v2 per this spec (re-read
  cgs-dev-story + blender-asset-qa + blender-hardsurface-modeling + blender-export
  FIRST). Start from .evidence/I429/build_ship.py; export GLB; blender-asset-qa
  game profile; CG A/B SHIP gate (clay 3/4 + face-on + closeup + in-game tint x2,
  old 818-tri vs new; ROLL BACK to the b015642 ship.glb if not clearly more
  detailed + bigger); execute the explicit re-pins with measured values.
- After ST-405: ST-406 (CUTTABLE other-asset realism pass) at I436, then ST-407
  (fresh R1-R5 + G55.0 + close E55) at I437.
