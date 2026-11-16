# Void Runner - Hero Ship v4 "Real Airship" Asset Spec (frozen I453 / ST-424 contract)

## Summary
This spec is the frozen ST-424 (I454) contract for the Blender rebuild of
assets/ship.glb: the player ship grows from the 12,400-tri v3 (I429 remaster)
into a REAL AIRSHIP - 1.55x authored scale + a density pass - so the hero
reads as a proper winged airship with envelope, gondola, nacelles and canopy.
The measured root cause of the "small-looking ship" complaint (I453): v3
wingspan 2.5u < one large rock 4.1u < hunter 3.04u - the hero was out-scaled
by the scenery. Scale first, density second.

The rebuild is GEOMETRY + a re-baked per-facet grayscale value map only.
Everything else stays: the in-code palette tint (CONFIG.ship.palette), the
FROZEN cockpit cyan emissive, the collision model (ST-425 decides the
radius), the 3 material names, the 6 VR_Ship_* node names, and COLOR_0 on
EXACTLY the hull + wings prims. The renderer (src/render/shipMesh.js useGLB
name-based material routing + ensureWhiteColors, perFileMats cap 3) is
untouched. Zero src in ST-424.

Core principle (unchanged from design/asset-spec.md and
design/asset-spec-ship-remaster.md): the GLB supplies GEOMETRY + the
grayscale per-facet COLOR_0 value map; all dynamic material behavior
(palette tint, cockpit emissive, invuln blink, additive engine flame) stays
in code.

## Contract (verified against the LIVE v3 GLB at I453)
- glTF 2.0 GLB, Y-up, 1 Blender unit = 1 world unit. No rig, no animation,
  no morph targets, no UVs. POSITION + NORMAL on every mesh. No TEXCOORD_1.
- 6 node names EXACT: VR_Ship_Hull, VR_Ship_Wings, VR_Ship_Fin,
  VR_Ship_Engine, VR_Ship_Nozzle, VR_Ship_Cockpit (tests assert nodeNames
  include VR_Ship_Hull + VR_Ship_Cockpit).
- 3 material names EXACT: VR_Ship_Hull, VR_Ship_Wing, VR_Ship_Cockpit.
  Mesh -> material: Hull -> VR_Ship_Hull; Wings -> VR_Ship_Wing; Fin ->
  VR_Ship_Wing (wingMat route); Engine -> VR_Ship_Hull; Nozzle ->
  VR_Ship_Hull; Cockpit -> VR_Ship_Cockpit. Routing in shipMesh.js useGLB:
  name contains 'Cockpit' -> cockpitMat, 'Wing' -> wingMat +
  ensureWhiteColors, else -> bodyMat + ensureWhiteColors. perFileMats cap
  = 3.
- COLOR_0 on EXACTLY 2 prims: Hull + Wings (this supersedes the
  scope-check draft that listed Hull/Engine/Nozzle - the live v3 GLB and
  the assetGlbs.test.js colorPrims == 2 pin were re-verified at I453).
  Engine / Fin / Nozzle / Cockpit prims stay colorless (code adds white
  identity via ensureWhiteColors).
  Bake (same formula as v3, per-corner):
    v = clamp(1.0 + k * dot(n, L), 0.30, 1.55)
    L = normalize(-0.45, -0.55, 0.70)
    hull k = 0.55; wings k = 0.80
  FLOAT(5126) VEC3, count == POSITION count, grayscale (channel delta
  <= 0.02). v3 pins (superseded by the I454 re-measure): hull {p10 0.5963,
  p50 0.9979, p90 1.3994}, wings {p10 0.3911, p50 1.0368, p90 1.55}.
  Spread floors >= 0.35 each.
- Flame-origin constraint: the code flame apex is at z = -0.80 relative to
  the group origin (shipMesh.js: flameMid.position z = -0.8, glow -0.88).
  Author the nacelle rear mouth plane at z = -0.88 so the flame emerges
  0.08u inside the mouth (v3 clearance 0.12u).
- The GLB is added at native size - NO rescale in code; size is authored in
  Blender.

## Scale + placement (the load-bearing spec)
- Envelope 2.6u long: z from -0.80 (stern) to +1.80 (bow). Overall z span
  -0.88 (nacelle mouth) to +1.80 (bow) = 2.68u -> assetGlbs length pin
  Math.abs(len - 2.6) <= 0.26.
- Wingspan x from -2.00 to +2.00 = 4.0u -> assetGlbs wingspan pin
  Math.abs(span - 4.0) <= 0.4.
- y range -0.28 to +0.62 (height 0.90u). At the in-code hover y = 0.4 the
  floor clearance is 0.12u = v3 parity (v3 bottom: 0.4 - 0.274 = 0.126u).
- Root cause (measured I453): v3 wingspan 2.5u < one large rock 4.1u <
  hunter 3.04u - hero out-scaled by scenery. The 1.55x authored scale fixes
  presence; the density pass below fixes detail.
- Collision note: the code collision model stays a radius-0.9 sphere at
  origin while the visual is ~2.68u long. ST-425 makes the radius decision
  (pre-computed: under the I144 slope-1 model effective(r) = r + 1.34, the
  >= 1.8x threadability gate on the 4.2u spiral gap admits only r = 0.9
  cleanly: 1.0 -> 1.795x marginal, 1.05 -> 1.757x fails. Expect KEEP 0.9).

## Per-part budgets (cap / aim)
- VR_Ship_Hull (cap 7,800, aim ~7,100): envelope 36x18 grid, elliptical
  cross-section rx 0.42 / ry 0.24, centerline y +0.14, z -0.80..+1.80, bow
  rounded (front 35%), stern taper (rear 25%), smooth shade ~2,200t. 10
  gore-rib hoops (32-gon, z -0.62..+1.54 step 0.24, 0.025 thick x 0.035
  proud, following the taper) ~2,560t. Gondola 0.66w x 0.20h x 1.10l, z
  +0.25..+1.35, y -0.28..-0.08, chamfered, 8 window insets + step ~700t. 4
  struts r 0.018 (6-gon; gondola top z +0.35/+1.25, x +/-0.28, y -0.08, to
  envelope belly) + 2 cross-wires r 0.008 ~150t. Upper deck 0.30x0.12x0.50
  (z +0.55..+1.05) + chimney r 0.05 h 0.14 ~800t (CUT 1). 2 side panel
  insets x +/-0.42, z +0.1..+1.4 ~600t. Bow anchor ring r 0.16 at z +1.70
  ~200t.
- VR_Ship_Wings (cap 2,600, aim ~2,500): root x +/-0.30, y +0.02; root
  chord z +0.30..+0.95; tip chord 0.32; span +/-2.00; 8% sweep; 5 deg
  dihedral (tip +0.12 y); thickness 0.05; winglets 0.12 tall; aileron
  grooves.
- VR_Ship_Fin (cap 2,200, aim ~1,800): vertical fin: root z -0.80..-0.35 on
  envelope top (y +0.34), tip y +0.62, tip chord 0.18, LE sweep 0.25,
  thickness 0.02, 3 spars ~1,000t. 2 horizontal stab plates: span 0.28,
  chord z -0.75..-0.35, thickness 0.015, y +0.12, ~350t each.
- VR_Ship_Engine (cap 2,800, aim ~2,600): 2 nacelles x +/-0.34, y -0.04,
  z -0.88..-0.18 (0.70 long), ellipsoid 0.26w x 0.24h tapering aft. Rear
  open mouth ring (outer r 0.115, 12-gon) + inner baffle (8-gon, 0.10
  deep). Front intake lip. 2-blade pusher prop at each mouth (hub r 0.03,
  blade 0.16, ~100t). 2 pylons r 0.015 per nacelle to the belly.
- VR_Ship_Nozzle (cap 900, aim ~500): bow anchor cone z +1.55..+1.80, base
  r 0.13 (embedded in the envelope nose) to tip r 0.015, 16-gon ~280t;
  keel fin flat plate z -0.78..-0.42, y -0.28..-0.05, LE sweep, thickness
  0.02 ~220t.
- VR_Ship_Cockpit (cap 1,000, aim ~700): canopy dome over the gondola
  0.36w x 0.20h x 0.42l, z +0.40..+0.82, y -0.08..+0.12 (0.20 proud of the
  gondola top), front slope, 5 longitudinal frame ribs r 0.012 + 2 cross
  ribs.

## Totals + file budget
- Total: design target <= 17,000 tris (sum of aims ~15,300), HARD cap
  19,000 (v3 = 12,400 -> +~23% density at 1.55x linear scale).
- File: HARD cap = the EXISTING assetGlbs.test.js MAX_FILE_BYTES =
  393,216 B. There is NO re-pin clause for it, so the scope-check's
  "<= 430 KB" estimate is SUPERSEDED by this tighter existing cap. Design
  target <= 375 KB. Estimate at ~15,500 tris (v3 rate ~21.8 B/tri):
  ~340-380 KB.
- Cut ladder if over (in order): Cut 1 drop upper deck + chimney (-800t);
  Cut 2 props 3 -> 2-blade discs (-400t); Cut 4 gores 10 -> 4 bands
  (-1,700t, lands the floor at ~15,000t).

## Palette (FROZEN - tests/paletteHarmony.test.js untouched)
- body (VR_Ship_Hull): 0xab9374, metalness 0.15, roughness 0.4, emissive
  0xffb347 @ 0.12
- wing (VR_Ship_Wing): 0x54402e, metalness 0.3, roughness 0.55
- cockpit (VR_Ship_Cockpit): 0x0b1830, emissive 0x59d8ff @ 1.4
- New detail is GEOMETRY + value bakes only. No new hexes, no textures, no
  node-tree changes beyond what the COLOR_0 export requires (below).

## Blender export notes (for ST-424)
- glTF exports vertex colors ONLY when the COLOR_0 attribute is referenced
  in the material node tree: Color Attribute (COLOR_0) -> Mix RGBA (with
  the base color) -> Principled BSDF. The Hull and Wing materials need that
  node chain; the other 3 material slots must NOT reference COLOR_0.
- Smooth shading = all-polygons use_smooth = True (no auto-smooth
  modifier - it splits verts). recalc_face_normals before bevels. EAR_CLIP
  -> BEAUTY triangulation.
- componentType 5123 = UNSIGNED_SHORT for POSITION/NORMAL (fine at this
  size).

## A/B gate (ab454.mjs in .evidence/I454/)
- Before the build, copy assets/ship.glb -> .evidence/I454/ship_v3.glb.
- Dev server :5173 (npm run dev); playwright-core +
  C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe
  headless, args ["--no-sandbox", "--enable-unsafe-swiftshader",
  "--force-color-profile=srgb"].
- Wait for vr.assetLoader ready on all keys; FX off (press f <= 6x until
  liveSettings().fx === 'off').
- Isolate: scene root = vr.arenaFloor.parent; hide every root child except
  vr.shipGroup + the lights; stars on.
- Camera (0, 9.4, 13) lookAt (0, 0.4, 2.6) (chase framing: camHeight 9
  above hover 0.4 + lookAhead 2.6), fov = vr.camera.fov read at load.
- Freeze rAF in-eval + vr.render() + r.domElement.toDataURL (NEVER
  page.screenshot - stale).
- 1280x720 PNG + a 256x256 luma pass.
- Capture v4 -> rename-swap v3 in place -> page reload -> capture v3 ->
  restore v4.
- Gates: console 0 errors; sha256 restore byte-identical; 256-px ship-
  window mean luma in [15, 235] for both; ship pixel-coverage ratio v4/v3
  >= 1.3 (loose, UNVERIFIED-BY-PLAY); side-by-side composite PNG via pngjs
  (createRequire).
- Kill the dev server + close the browser after.

## ST-424 re-pin set (conditional - each lands WITH the measurement)
- tests/assetGlbs.test.js:
  - BUDGETS.ship 14,000 -> 19,000 (EXPECTED by construction)
  - wingspan pin 2.5 +/- 0.25 -> 4.0 +/- 0.4 (EXPECTED)
  - length pin 1.9 +/- 0.19 -> 2.6 +/- 0.26 (EXPECTED)
  - SHIP_FACET hull/wings -> measured (EXPECTED; pin comment pattern:
    "I454 (ST-424) EXPLICIT re-pin: I440 {...}/{...} -> measured on the
    <N>-tri v4 bake")
  - MAX_FILE_BYTES UNCHANGED (393,216)
- tests/assetPerf.test.js BUDGET (only if measured): totalTris 26,000 ->
  34,000 (projected 25,900-26,400 = MARGINAL); totalGeoKB 896 -> 1,088
  (projected over); totalFilesKB 1,024 + perFileKB 400 projected to HOLD.
  dist ceiling 3,000,000 HOLDS.
- Causal: NO re-pin (zero core change; expect EXACT).
- Playframe A/B: stale after ST-424 by construction -> re-measure + record
  at I454, re-pin at I455.

## Acceptance checklist (10)
1. 6 node names EXACT + 3 material names EXACT in the exported GLB.
2. Bbox: z span 2.6 +/- 0.26 (2.68 actual), x span 4.0 +/- 0.4, y
   [-0.28, +0.62] (height 0.90u).
3. Total tris <= 19,000 (target <= 17,000); per-part within caps.
4. File size < 393,216 B (target <= 375 KB).
5. COLOR_0 on EXACTLY Hull + Wings (colorPrims == 2), FLOAT(5126) VEC3,
   per-corner count == POSITION count, grayscale delta <= 0.02, spread
   floors >= 0.35; pins re-measured + re-pinned.
6. A/B gate ab454 PASS (console clean, byte-identical restore, luma bands,
   coverage ratio >= 1.3 UNVERIFIED-BY-PLAY).
7. npm test green (all re-pins landed with measured numbers + clause
   comments).
8. npm run build 0 errors; dist <= 3,000,000 B ceiling; vendor sha
   76DEA8151BC9352A unchanged.
9. Causal probe EXACT (zero core change).
10. Hygiene: dev server killed, 5173/5199 free, chrome 0, no stray
    background terminals.

## Non-goals (ST-424)
- No src changes (renderer, config, collision, camera all untouched).
- No new materials / textures / hexes.
- No rig, animation, or morph targets.
- No rescale in code (native size authored in Blender).
- WebGPU: NOT needed at ~33k tris total (F1/F2/F3 unmet - documented at
  ST-427); stays WebGL2.
