# E73 Player-Ship v7 "Warship Airship" Remaster - Research (I539)

## 0. User request (verbatim)

- "for the next portion of the 100 iteration i would like you to think about
  improving the main character currently its small looking airship, put in more
  detailing, increase the polygon count and make it a real airship, go through
  the guides and refrence samples to build them, like wise for the other assets
  make them more realistic use the polygons and gpu resource as much as needed
  you can switch is to the webgpu from webgl if you are on webgl to make them
  possible"
- "donot forget to use blender to create assets required for the game and
  improve it"
- "you can ofcourse do the research through the youtube and other mediums,
  watch as much content as you can and extract only the useful ones in the
  refrence and your knowledge base so that you can improve the game"

Interpretation (bounded): E73 = rebuild assets/ship.glb v6 (25,563 t /
581,440 B) into v7 "warship airship" in Blender 5.2.3 headless, with more
detailing, more polygons, and a proper airship anatomy read. KEY DECISION:
keep the PINNED span/length window (span x 3.6..4.4, length z 2.34..2.86 per
tests/assetGlbs.test.js L94-95) and grow ONLY y (height - unpinned): 0.969 ->
~1.5. The "looks small" complaint is a vertical-volume problem, not a
scale problem. WebGPU is NOT the lever: the dual renderer arm is frozen
(E66/I498), default stays classic WebGL, and the classic arm already renders
the v6 ship at the full budget; v7 needs better geometry and silhouette, not
a different backend. Enemy fleet, asteroids, boss, cockpit camera = NOT in
E73 (standing queue).

## 1. Measured audit (I539, tree-verified, .evidence/I539/)

Method: probe_ship_v6.cjs (deterministic GLB chunk-walker; measurement code
mirrors the green tests verbatim - tests/assetGlbs.test.js
parseGlb/meshStats/facet + tests/assetPerf.test.js parseGlb geoBytes) ->
probe_shipv6.txt. measure_fleet.cjs (assetPerf algorithm verbatim) ->
measure_fleet.out.

ship.glb (v6): file 581,440 B / bin 576,428 B / 6 nodes / 6 meshes /
3 materials [VR_Ship_Hull, VR_Ship_Wing, VR_Ship_Cockpit] / 25,563 tris.
glTF space: +X span, +Y up, +Z nose.

Per-node table (measured):

| node             | tris  | x range          | y range          | z range          | material        | COLOR_0 |
|------------------|-------|------------------|------------------|------------------|-----------------|---------|
| VR_Ship_Hull     | 12,207| [-0.614, 0.671]  | [-0.414, 0.538]  | [-0.955, 1.307]  | VR_Ship_Hull    | yes     |
| VR_Ship_Wings    | 2,644 | [-2.006, 2.006]  | [-0.128, 0.271]  | [-0.932, 0.723]  | VR_Ship_Wing    | yes     |
| VR_Ship_Engine   | 4,880 | [-0.902, 0.902]  | [-0.294, 0.294]  | [-1.179, -0.520] | VR_Ship_Hull    | no      |
| VR_Ship_Fin      | 2,312 | [-0.368, 0.368]  | [-0.013, 0.554]  | [-0.786, -0.283] | VR_Ship_Wing    | no      |
| VR_Ship_Cockpit  | 1,592 | [-0.260, 0.260]  | [0.057, 0.491]   | [0.112, 0.801]   | VR_Ship_Cockpit | no      |
| VR_Ship_Nozzle   | 1,928 | [-0.662, 0.662]  | [-0.326, 0.214]  | [-1.293, 1.183]  | VR_Ship_Hull    | no      |

Overall: span 4.013 / height 0.969 / length 2.599 / min-y -0.414 /
max-y 0.554 / bow z +1.307 / tail z -1.293.
Facet bakes (pinned, tol 0.005): hull p10/p50/p90 = 0.5611/0.9108/1.3070
(spread 0.7459) / wings 0.3869/0.9981/1.5500 (spread 1.1631).

Code contract (tree-verified, src/render/shipMesh.js):
- L166 group.position.y = 0.4 -> the GLB min-y MUST stay >= -0.400 or the
  ship sinks through its own rest pose (build gate).
- Flame apex is code-fixed at z = -0.8 (L122/134; glow sprite z -0.88, L142)
  -> the engine mouth band must VISUALLY CONTAIN z = -0.8 (build gate).
- useGLB() binds by MATERIAL-NAME substring (L180-182): 'Cockpit' ->
  cockpitMat / 'Wing' -> wingMat / else -> bodyMat (bodyMat reads COLOR_0).
  Material names are contracts - keep exactly
  VR_Ship_Hull / VR_Ship_Wing / VR_Ship_Cockpit.
- config.js palette frozen: bodyPrimary 0xab9374 / bodyDark 0x54402e /
  cockpitSignal 0x59d8ff (the EEVEE tint audit uses these).

Test contract (tree-verified, tests/assetGlbs.test.js):
- L18 BUDGETS.ship: 25563 (re-pin WITH MEASUREMENT at ST-507).
- L74 buf.length < MAX_FILE_BYTES (1,048,576 B; the "under 100 KB" label is
  stale prose - the value is the 1 MB I501 re-pin).
- L76-77 requires nodes VR_Ship_Hull + VR_Ship_Cockpit.
- L78-80 materials exactly VR_Ship_Hull / VR_Ship_Wing / VR_Ship_Cockpit.
- L94 |span - 4.0| <= 0.4 (window 3.6..4.4) / L95 |len - 2.6| <= 0.26
  (window 2.34..2.86) - UNCHANGED in v7 (the vertical-growth-only decision).
- L134 exactly 2 COLOR_0 prims; L121-122 grayscale (|r-g|, |g-b| <= 0.02)
  + value domain [0.30, 1.55]; L138 SHIP_FACET hull {0.5611, 0.9108, 1.3070}
  + wings {0.3869, 0.9981, 1.55} tol 0.005; L139-140 spread p90-p10 >= 0.35
  on both (facet lookup accepts the .001 mesh-name suffix, L135-136).
- assetPerf.test.js: BUDGET totalFilesKB 3000 / totalGeoKB 2925 / perFileKB
  600 / totalTris 66000 / perFileMats 4; L58 exactly 31 GLBs.
- Hitbox = circle r 0.9 (config) - independent of the GLB, unchanged.

Fleet baseline (measure_fleet.out, measured I539 - CORRECTS the handoff
"2,996,688 B" totalFiles typo; the measurement governs):
31 GLBs; totalFiles 3,053,660 B (2,982.09 KB) vs cap 3,072,000 B -> headroom
18,340 B; totalGeo 2,991,786 B (2,921.67 KB) vs 2,995,200 B -> headroom
3,414 B; totalTris 65,513 vs 66,000 -> headroom 487 t; maxFile = ship.glb
581,440 B vs perFile cap 614,400 B -> headroom 32,960 B.
Consequence: ST-507 re-pins of assetPerf totalTris + totalGeoKB +
totalFilesKB are MANDATORY (v7 grows past all three), plus perFileKB if the
v7 file lands above 614,400 B (expected: v7 target ~700-800 KB).

Defect findings (D1-D6) - why v6 "looks small":
- D1 FLAT SLAB: height 0.969 is 24% of span 4.013. Reference airships read
  with envelope height ~45-55% of span. This is THE main defect and the main
  fix of v7 (vertical volume, A2).
- D2 ONE-LEVEL SHADING: a single flat k=0.60 bake over the whole hull (facet
  p50 0.9108); no two-level deck (light top band / dark lower trench) - the
  surface reads as one tone at chase-cam distance.
- D3 BURIED COCKPIT: a 1,592-tri blob peaking at y 0.491, BELOW the hull top
  (0.538) - the command structure is buried; there is no top-tower read.
- D4 SINGLE CENTERLINE ENGINE: one z -0.52..-1.179 stack; no engine BAY - no
  side nacelles, so the rear (chase cam) reads as one hole, not a powerplant.
- D5 NO TAIL ASSEMBLY: one centerline fin (y up to 0.554, z -0.786..-0.283);
  no twin dorsal/ventral + rudder read.
- D6 UNORGANIZED GREEBLE: port-side greeble cluster (I501 audit note) -
  detail exists but is not organized into decks/functional groups; reads as
  stuck-on parts rather than structure.

## 2. LABELED grounding (YouTube, chapter-level cites only; house norm)

All sources: research viewing, 2026-11-20. No transcripts pulled.

- SOLARGROUP, "How does an airship fly?" (4uceCasVUEc, 2:35): 0:04 an
  airship = hull + engines + cabin + tail + payload (5 readable groups);
  0:37 multiple gas cells (segmented hull); 1:14 the rigid hull bears the
  loads; 1:29 the tail stabilizes course (tail = first-class read).
- ArtOfSoulburn, "Designing An Epic Starship Part 1" (E8h_NGZbrvY, 26:25):
  0:17 "tons of detail, little tiny lights, big areas of [no detail]"; 7:48
  two-level silhouette - flat light top + dark lower trench with pipes;
  9:09 asymmetry (used sparingly, A6); 18:56 "as a silhouette you're really
  just looking for the large shapes".
- Spacedock, "How To Build the Structure of a Spaceship" (nyHbH3Bg1Fs,
  119K): 0:36 chunky full-length thrust spine; 2:27 semi-monocoque formers
  define the hull shape (raised ribs, A3); 3:14 iso-grid stringers.
- Concerning Reality, "How do Blimps Work?" (IrBVyIiXveM, 143K): envelope +
  fins + gondola - the classic 3-part airship read.
- The Art of Storytelling, "The Horror Of Dune's Spaceships" (XP5k0bHmhqc,
  7.5M): the Heighliner read = vertical volume + stacked silhouette =
  presence (the direct answer to D1).
- E72 carry-over (no re-pull): Daniel Scholes, "Spaceship Rear Silhouettes"
  (yXPeUNi0h5s) - the rear view is first-class (A5); Robert Laszlo Kiss
  (HQyXZrbbNY8) 0:33 "minimum viable elements" (A6).

## 3. Extracted principles (A1-A6)

- A1 AIRSHIP-ANATOMY READ: the ship must read as 5 groups - hull / engines /
  cabin / tail / (payload = engine bay load). Each group gets its own mass
  and its own read; groups never merge into one blob.
- A2 VERTICAL VOLUME: height ~45-55% of span (v6 = 24% - THE main fix). The
  envelope grows up, not out: span and length stay inside the pinned
  windows; y goes 0.969 -> ~1.5 (y -0.40..+1.10).
- A3 SEGMENTED RIGID HULL: raised former ribs (~0.25 u pitch - ridge
  geometry, not inset lines) + 4 subtle gas-cell rings define the ovoid; the
  structure IS the silhouette (Spacedock 2:27).
- A4 TWO-LEVEL DECK: light dorsal spine band + dark lower trench carrying 3-4
  panel insets + 2-3 pipe runs; greebles organized into decks, never floating
  (ArtOfSoulburn 7:48; fixes D2/D6).
- A5 REAR READ FOR CHASE CAM: the camera lives behind the ship - the engine
  BAY (two sponson nacelles + centerline stack, mouths in z -0.8..-1.3) and
  the twin-fin tail must read at the back (Scholes; flame emerges from the
  bay, not from one hole).
- A6 BUDGETED DETAIL: form first, inset/bevel last; asymmetry only in small
  props (antennas, pipes); every tri budgeted per node (Kiss 0:33).

## 4. v7 build brief + GLB contract (pre-registered for ST-506)

Target: AIM 32,000 tris / HARD CAP 36,000 tris (total, exit-1 gate).
Axis convention: build space +X span, +Y up, +Z nose (matches v6 glTF
space); identity node transforms; mesh data in ABSOLUTE part-space (the
renderer group sits at the origin and applies position.y = 0.4).

Per-node aim/cap (6 node names EXACT, unchanged - contracts):
- VR_Ship_HULL (15,000 / 17,500): ovoid envelope, span x ~1.3, length z ~2.5
  (bow +Z ~1.30, tail -Z ~-0.95), height y ~1.5 (y -0.40..+1.10); raised
  former ribs ~0.25 u pitch; dorsal spine light band; dark lower trench with
  3-4 panel insets + 2-3 pipe runs; 4 subtle cell rings.
- VR_Ship_WINGS (3,600 / 4,400): 2 slim sponson spars at y ~0.0, tips at
  x +/-2.0 (CARRY the span pin); welded to the hull flanks (no gaps).
- VR_Ship_ENGINE (5,800 / 6,800): an engine BAY - 2 sponson nacelles at
  x +/-1.3, y ~0.1 + 1 centerline aft stack; ALL mouths on -Z inside
  z -0.8..-1.3 (must contain the code flame apex z = -0.8); cooling-fin
  rings.
- VR_Ship_NOZZLE (2,600 / 3,100): exhaust rings / inner cones, bodyMat.
- VR_Ship_COCKPIT (2,600 / 3,300): a COMMAND TOWER at z ~0.4-0.8, y ~0.8-1.1
  (top of the ship - fixes D3); forward canopy slot (the frozen cyan
  emissive is applied in code); bridge wing; 2 antenna stubs; cockpit-cam
  friendly for the NEXT episode (the cockpit/FPV rework stays deferred -
  v7 only needs to be cockpit-friendly).
- VR_Ship_FIN (2,400 / 3,000): TWIN dorsal/ventral fins + rudder (a real
  tail assembly - fixes D5), up to y ~1.2, rear-readable (A5).
Sum of aims = 32,000; sum of per-node caps 38,100 but the TOTAL gate is
36,000 (exit 1).

Build gates (all exit-1 in the build script, before export):
- per-node tris within aim..cap; total <= 36,000.
- min-y >= -0.400 (code rest pose); span 3.6..4.4; length 2.34..2.86 (the
  PINNED windows - unchanged); engine mouth band contains z = -0.8.
- exactly 3 materials (VR_Ship_Hull / VR_Ship_Wing / VR_Ship_Cockpit);
  COLOR_0 on exactly 2 prims (Hull + Wings) with the bake asserts;
  every prim has POSITION + NORMAL; no TEXCOORD_1.
- file target <= 800,000 B (tripwire 850,000 B -> decimate pass).

GLB contract (pipeline = E72 sec.5 / E67 spec, tree-verified):
- Single root; Y-up; no rig; no UVs/texture coords; no animations.
- Vertex colors: FLOAT point attribute "Color" - GRAYSCALE value bake,
  domain [0.30, 1.55] (the ship domain, NOT the enemy 0.22..0.96):
  v = clamp(1.0 + k*dot(n, L), 0.30, 1.55), L = (-0.45, -0.55, 0.70)
  .normalized(), k_hull 0.60 / k_wings 0.80 (v6 formula unchanged; if the
  new geometry's spread drops below the 0.35 floor, k is tuned and
  documented).
- Materials: one Principled per family, Base Color linked from
  ShaderNodeVertexColor; export_materials="EXPORT".
- Export: export_scene.gltf(filepath, export_format="GLB",
  use_selection=True, export_yup=True, export_apply=True,
  export_materials="EXPORT", export_vertex_color="MATERIAL",
  export_image_format="AUTO", export_skins=False, export_animations=False,
  export_normals=True, export_texcoords=False, export_tangents=False).
- Blender: D:/Blender/blender.exe -b --factory-startup -P <script>
  (5.2.3 headless). Pipeline: build to a TEMP path in .evidence/I540/ FIRST
  (never assets/ directly); EEVEE audit (960x540, dark world, 3 suns, 4 views
  x clay + tint with the CONFIG body hex, front/rear sil96); P1 gate: must
  read as an AIRSHIP at 96 px, especially the rear (chase cam); then swap at
  ST-507.

## 5. Pin expectations - re-pin table (ST-507, ALL WITH MEASUREMENT)

- tests/assetGlbs.test.js: BUDGETS.ship 25,563 -> v7 total (hard cap 36,000);
  SHIP_FACET hull + wings p10/p50/p90 (re-baked on the new geometry, tol
  0.005). Span/length windows UNCHANGED (3.6..4.4 / 2.34..2.86) - no re-pin.
  MAX_FILE_BYTES 1,048,576 unchanged (v7 target <= 800,000 B).
- tests/assetPerf.test.js: totalTris 65,513 -> 65,513 - 25,563 + v7
  (MANDATORY; cap 66,000 is crossed - at the 32,000 t aim the fleet lands
  ~71,950 t); totalGeoKB (MANDATORY; headroom is 3.33 KB); totalFilesKB
  (MANDATORY; headroom 142.59 KB is crossed by the +~150-220 KB file delta);
  perFileKB 600 (MANDATORY if v7 file > 614,400 B - expected).
- playframe491 / playframe483: A 22/25,781 + 11/180, B 52/55,400 -> re-pin
  WITH MEASUREMENT (the ship geometry changes scene tris). Precedent v5 -> v6
  (I501): A grows by the tri delta, B grows by exactly 2x (fx=high 2-pass
  scene). Expected at the 32,000 t aim: A ~32,218 / B ~68,274 - measured
  governs.
- House rule: re-pin ONLY on shipped-geometry change, ALWAYS WITH
  MEASUREMENT. All of the above re-pins ride ST-507 (the swap story), with
  the I537/I536 repin-script pattern (probe .mjs + CRLF-safe patcher).

## 6. Pins EXPECTED EXACT (no re-pin)

- causal495 (3 arms) + causal483: seed-9876/30201 WAVE-2 logic pins (score
  11334, kills 57, combo 15, shots 198, acc 0.2878787878787879, time
  36.14999999999923, replay 2169/2220, speed 4) - the sim is geometry-blind;
  GLB bytes change the scene, not the wave-2 outcomes.
- pwa491 (SUMMARY 11/11): checks SW + manifest + offline boot, not asset
  content (E69 GLB-swap precedent: zero re-pins).
- vendor r187 4/4: A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A /
  7FF9ACF50F006017 (no vendor work in E73).

## 7. dist + asset policy (PRE-REGISTERED)

- Open: dist 5,383,468 B / 184; ceiling 6,100,000 B; CLOSE FLOOR E72 =
  716,532 B (measured at G72.0, I538).
- Expected: ship +120-220 KB (581,440 -> ~700-800 KB) -> worst-case dist
  ~5,610,000 B (>= 490,000 B under the ceiling). No renegotiation
  anticipated.
- Tripwires (pre-registered, in order): (a) v7 GLB > 850,000 B -> C1
  decimate before swap; (b) dist after the swap > 5,750,000 B -> cut ladder
  before close; (c) G73.0 headroom < 102,400 B -> cut ladder per the E70
  rule.
- Cut ladder: C1 decimate (<= 850,000 B / <= 36,000 t); C2 drop the detail
  pass (keep anatomy + two-level deck - form before detail, A6); C3 lower
  the aims to 30,000 t; C4 (re-scope) merge Nozzle into the Engine node.
- CLOSE FLOOR E73 re-derived WITH MEASUREMENT at G73.0.

## 8. Risks

K1 Node-name / material-name drift breaks the useGLB binding (Cockpit/Wing/
body slots fall back or the COLOR_0 tint never applies) -> exact names in
the build script + ST-507 binding verify (the FLEET537 probe pattern).
K2 Span/length drift outside the pinned windows -> assetGlbs L94-95 fails
-> build gate asserts the windows pre-export; tune stations, not the gate.
K3 Tri budget blowout -> per-node aim/cap gates + total 36,000 exit gate +
decimate ladder (sec.7).
K4 min-y < -0.400 -> the ship sinks through its rest pose / the flame
offsets go wrong -> build gate asserts min-y >= -0.400.
K5 Engine mouth band misses z = -0.8 -> the flame floats or buries ->
build gate: every nozzle/mouth vertex inside z -0.8..-1.3 (or the mouth ring
circle containing -0.8 on -Z).
K6 Facet spread / pins on the new geometry -> re-bake with the v6 formula;
if spread < 0.35 the k values are tuned and documented; SHIP_FACET re-pins
WITH MEASUREMENT at ST-507.
K7 Fleet budget headroom is TINY (geo 3,414 B / files 18,340 B / tris 487)
-> the assetPerf re-pins are mandatory and pre-registered (sec.5); if v7
file > 850,000 B tripwire C1 fires before the swap.

## 9. Verification (per story)

- ST-505 (I539, this): docs-only - quality bar 6/6 (npm test 1,187/1,187 +
  build 0 + dist byte-identical 5,383,468 B/184 + vendor diff empty + BOM
  delta 0 + hygiene 0 servers / 0 tabs).
- ST-506 (I540): build script gates ALL_GATES_PASS (per-node + total tris,
  min-y, span/len windows, mouth band, 3 mats, 2 COLOR_0 prims, POSITION +
  NORMAL, no TEXCOORD_1, file <= 800,000 B) + EEVEE audit (4 views x clay +
  tint + front/rear sil96) viewed + sil96 gate (reads as AIRSHIP at 96 px,
  rear included) -> TEMP GLB only, no swap.
- ST-507 (I541): swap + re-pins WITH MEASUREMENT (assetGlbs BUDGETS.ship +
  SHIP_FACET; assetPerf totalTris/totalGeoKB/totalFilesKB (+ perFileKB if
  v7 > 614,400 B); playframe A/B) + runtime smoke (console clean, no NaN,
  ship reads correctly chase + cockpit) + quality bar 6/6 + dist WITH
  MEASUREMENT.
- ST-508 (I542): G73.0 close gate - 5 fresh harness runs (causal495 +
  causal483 + playframe491 + playframe483 + pwa491; causal + pwa EXPECTED
  EXACT, playframe re-pin verified against measurement) + CLOSE FLOOR E73
  WITH MEASUREMENT + AGENTS.md refresh + bookkeeping + commit + push
  delegate.