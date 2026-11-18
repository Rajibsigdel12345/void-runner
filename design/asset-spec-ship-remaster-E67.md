# Ship v6 "Real Airship" - Frozen Asset Spec (E67, I500 / ST-466)

Companion to design/ship-remaster-research-E67.md (the research + gap list).
This is the FROZEN, executable part-level contract for the Blender build
(ST-467 / I501, D:\Blender\blender.exe 5.2.3 headless, deterministic
script) and the integration (ST-468 / I502). Carries forward the FROZEN
v4/v5 contract (node names, material names, COLOR_0 scope, scale, flame
origin) UNCHANGED. Live v5 baseline parsed from assets/ship.glb THIS
iteration (I500 parse, .evidence/I500_parse_ship.cjs):

  node            v5 tris    node            v5 tris
  VR_Ship_Hull    8,423      VR_Ship_Fin     1,672
  VR_Ship_Engine  3,332      VR_Ship_Cockpit   856
  VR_Ship_Wings   2,260      VR_Ship_Nozzle    600
  TOTAL 17,143 t | 384,756 B | 22.44 B/tri | 3 materials
  (VR_Ship_Cockpit / VR_Ship_Wing / VR_Ship_Hull) | COLOR_0 on exactly
  2 prims (Hull, Wings)

## 1. FROZEN contract (inherited v4/v5 - UNCHANGED)
- glTF 2.0 GLB, Y-up, 1 Blender unit = 1 world unit. No rig/anim/morph/
  UVs. POSITION + NORMAL on every mesh; componentType 5123 (UNSIGNED
  SHORT) - 35k tris needs 65k+ vertices per prim max; if any prim
  overflows 65,535 vertices the exporter must use 5125 for THAT prim
  only (assert in the CG gate; predicted: none does).
- 6 node names EXACT: VR_Ship_Hull, VR_Ship_Wings, VR_Ship_Fin,
  VR_Ship_Engine, VR_Ship_Nozzle, VR_Ship_Cockpit.
- 3 material names EXACT: VR_Ship_Hull, VR_Ship_Wing, VR_Ship_Cockpit.
  Node->material assignment IDENTICAL: Hull->VR_Ship_Hull, Engine->
  VR_Ship_Hull, Nozzle->VR_Ship_Hull, Wings->VR_Ship_Wing, Fin->
  VR_Ship_Wing, Cockpit->VR_Ship_Cockpit. The code routes by NODE NAME
  and is UNTOUCHED.
- COLOR_0 on EXACTLY 2 prims: VR_Ship_Hull + VR_Ship_Wings
  (colorPrims == 2, assert in CG gate). Per-facet grayscale value map,
  the other 4 prims stay colorless (code adds white identity).
- Native size, NO rescale in code: span 4.0u (x -2.00..+2.00), length
  2.6u (z -0.80..+1.80) - assetGlbs pins |len-2.6| <= 0.26, |span-4.0|
  <= 0.4 (HARD). Height: v5 was 0.90u (y -0.28..+0.62); v6 MAY extend
  the belly to y >= -0.42 ONLY via the skids (section 2, item H3) - the
  top stays y <= +0.62, the nose/stern z bounds stay EXACT. No height
  test pin exists (len/span only); the extension is documented here.
- Flame origin: in-code flame apex z = -0.80, x = y = 0, expanding to
  radius 1.0 at z = -1.80 (ConeGeometry(1,1,10/8,1,true), shipMesh.js
  L114/L126). The v5 center exhaust mouth at z = -0.88 (0.08u clearance)
  STAYS. New stern geometry must respect the flame envelope (section 4).
- Palette + emissive (FROZEN, code-side, untouched): hull 0xab9374,
  wing 0x54402e, cockpit 0x0b1830 + emissive 0x59d8ff @ 1.4.

## 2. v6 part list (research F6-1 order; per-node budget)

Per-node v6 AIMs / CAPS (the test checks the SHIP TOTAL against
BUDGETS.ship, re-pinned at ST-468; per-node values are build targets
verified by the CG gate's per-node count):

| node            | v5    | v6 aim | v6 cap |
|-----------------|-------|--------|--------|
| VR_Ship_Hull    | 8,423 | 20,500 | 21,500 |
| VR_Ship_Engine  | 3,332 | 5,300  | 5,800  |
| VR_Ship_Fin     | 1,672 | 2,600  | 2,800  |
| VR_Ship_Wings   | 2,260 | 2,800  | 3,000  |
| VR_Ship_Cockpit |   856 | 1,300  | 1,600  |
| VR_Ship_Nozzle  |   600 | 2,200  | 2,400  |
| TOTAL           | 17,143| 34,700 | 37,100 |

Ship hard cap 38,000 t (research F6-2); the build must land <= 37,100
(per-node caps) and the TOTAL aim is 34,700. BUDGETS.ship re-pins to
38,500 at ST-468 (measured).

VR_Ship_Hull (aim 20,500) - keeps the v5 envelope + gondola + deck as
the base (~8,423, may re-density the envelope +1,500 to seat the cage
cleanly), then adds, in research order:
  H1 EXTERNAL RIGID FRAME CAGE (the #1 read, research F6-1.1):
     - 6 raised longitudinal GIRDERS on the envelope skin: 4 upper
       (theta ~25/65/115/155 deg from +Y) + 2 lower (theta ~235/295
       deg), each a raised beam (0.05u wide x 0.05u proud of the skin,
       MINIMUM width 0.05u - sub-pixel guard R3) running z +1.55..-0.60
       following the taper, ~500 t each (beveled profile box, 12
       length segments) = 3,000 t.
     - 10 raised GORE RIBS: rings proud of the skin (0.05u) at z =
       +1.50, +1.20, +0.90, +0.60, +0.30, +0.00, -0.30, -0.55, -0.70,
       -0.78, following the envelope cross-section (torus-like band
       0.05u wide), ~480 t each = 4,800 t.
     - Cage total ~7,800 t. Girders/ribs intersect the skin: MERGE the
       cage into the Hull mesh (boolean union or joined manifold); no
       coplanar faces (z-fight guard): ribs/girders sit 0.01u proud of
       the skin at minimum.
  H2 GONDOLA DETAIL (F6-1.3): 4 window insets (0.16u x 0.10u, 0.02u
     deep, 90 t each = 360), 1 vent grille (0.12u x 0.12u, 4 bars, 160
     t), 1 roof hatch (0.20u x 0.28u slab + lip, 140 t) = 660 t.
  H3 SPOKED LANDING SKIDS (F6-1.2): 2 pods at (x +/-0.55, z -0.15):
     each pod = spoked disc r 0.30u (8 spokes x 24 t + rim 240 t + hub
     60 t = ~420 t) on 2 struts (0.035u r cylinders from gondola belly
     y -0.28 to pod plane y -0.36, 140 t each). Pod PLANE at y -0.36,
     disc thickness 0.04u -> SKID BOTTOM y = -0.40 (>= -0.42 floor
     allowed by section 1; ST-468 probe verifies no arena-floor clip at
     the ship's render altitude). = 2 x (420 + 280) = 1,400 t.
  H4 MAST + RIGGING (F6-1.6): 1 forward mast (0.025u r, y +0.30..+0.58,
     z +1.10, 160 t) + 3 rigging lines (0.012u r cylinders: mast top ->
     envelope at z +1.60/+1.80 nose ring + z +0.70, 45 t each = 135 t)
     = 295 t.
  Hull sum: 8,423 (base, re-densified +1,500 = 9,923) + 7,800 + 660 +
  1,400 + 295 = 20,078 ~ aim 20,500.

VR_Ship_Engine (aim 5,300) - keeps the v5 2 nacelles + turbine discs
(~3,332), adds:
  E1 PER-NACELLE 3-BLADE PROPELLERS (F6-1.4, real-airship propulsion
     read - props on the nacelles, NOT a center pusher which the flame
     plume forbids): at (x +/-0.34, y 0, z -0.94) - the nacelle rear
     mouth plane. Each: hub (r 0.06u, 180 t) + spinner cone (120 t) +
     3 blades (0.22u long x 0.05u chord x 0.015u thick, twisted 25 deg,
     300 t each = 900 t). Blade POSE FROZEN (static model, no anim):
     90 deg (up), 210 deg, 330 deg in the XY plane. FLAME CLEARANCE
     INVARIANT (asserted in CG gate): every blade tip must be >= 0.16u
     from the Z axis at its z (flame cone radius at z -0.94 = 0.14u;
     the Y-pose gives min tip distance sqrt(0.34^2 offset... computed
     per tip, min 0.186u -> 0.046u clearance). Hub center distance 0.34
     >> 0.14. = 2 x 1,200 = 2,400 t.
  E2 NACELLE PANELING (F6-1.3 spillover): intake lip ring + 3 panel
     seam insets per nacelle (~350 t each) = 700 t.
  Engine sum: 3,332 + 2,400 + 700 = 6,432 -> OVER aim; the v5 nacelle
  base absorbs -1,100 (decimate the v5 turbine discs 12->8 spokes,
  cut-ladder C2 equivalent internal to the node, silhouette-identical)
  -> 5,332 ~ aim 5,300.

VR_Ship_Fin (aim 2,600) - keeps the v5 cruciform (dorsal + ventral +
lateral roots; the lateral fins are the Wings node's tail read in v5 -
UNCHANGED split), adds:
  F1 RUDDER RIVET BOSSES: 14 small spheres (r 0.015u, 45 t each) along
     the dorsal + ventral fin LE edges = 630 t.
  F2 SPAR RIBS: 2 internal spar ribs per fin visible as 0.02u proud
     bands (300 t) = 600 t... budget: 1,672 + 630 + 300 (one spar pair
     on the dorsal) = 2,602 ~ aim 2,600.
VR_Ship_Wings (aim 2,800) - keeps the v5 lateral tail fins + lateral
envelope band/ribs (2,260), adds panel banding (+400) + winglet tips
(+150) = 2,810 ~ aim 2,800.
VR_Ship_Cockpit (aim 1,300) - keeps the v5 canopy (856), adds 5
longitudinal + 3 cross frame ribs (0.02u proud, 60/50 t) + a front
windshield band (80 t) = 856 + 460 = 1,316 ~ aim 1,300.
VR_Ship_Nozzle (aim 2,200) - keeps the v5 bow anchor + exhaust mouth
(600), adds:
  N1 KEEL GIRDERS (F6-1.5): 2 raised channels (0.05u x 0.05u, 0.02u
     proud of the belly) at x +/-0.08, running z +1.70..-0.85 (END AT
     -0.85: 0.03u ahead of the exhaust mouth plane, so they NEVER enter
     the flame region - the flame occupies z < -0.80 at the centerline)
     = 2 x 700 = 1,400 t.
  N2 NOSE RING (F6-1.5): raised ring at z +1.62 (r 0.05u band around
     the nose cross-section, 350 t) + 3 nose ribs (150 t each... 300 t
     total for 2 ribs + the third is the ring) = 450 t.
  Nozzle sum: 600 + 1,400 + 450 = 2,450 -> decimate keel channels 700
  -> 650 t each -> 2,350, then the v5 exhaust mouth -150 -> 2,200 ~ aim.

Cut ladder (per-node, in order - mirrors the scope check C1-C5):
  H4 mast+rigging (-295) / H2 gondola hatch (-140) / H3 pods spoked ->
  solid disc (-560) / H1 gore ribs 10 -> 6 (-1,920) / H1 girders 6 -> 4
  (-1,000) / E1 props 3 -> 2 blades (-600) / N1 keel 2 -> 1 channel
  (-650). Total cuttable ~5,165 t before the C5 target drop (34,700 ->
  28,000).

## 3. COLOR_0 bake (Hull + Wings ONLY - frozen scope)
Per-facet formula UNCHANGED (E61): v = clamp(1.0 + k*dot(n, L), 0.30,
1.55), L = normalize(-0.45, -0.55, 0.70); k_hull 0.60, k_wings 0.80.
v5 bands carried (gore-rib rings, keel band, panel lines, gondola
seams) + NEW v6 bands (research F6-5):
  - frame girder shadow: darker facet row (v x 0.82) on the skin facet
    directly under each raised girder (the recess read).
  - gore rib shadow: v x 0.85 under each raised rib.
  - skid strut shadow: v x 0.80 on the envelope belly facets under each
    strut line (x +/-0.55, y ~-0.25, z -0.45..+0.15).
  - nose ring line: v x 0.85 at the ring z.
  - mast shadow dot: v x 0.8 at the mast root.
  - keel girder shadow: v x 0.82 under each keel channel (on the Hull
    belly facets - the Nozzle girders themselves are colorless).
Invariants (CG gate asserts, as v5): FLOAT(5126) VEC3, count ==
POSITION count, grayscale channel delta <= 0.02, spread percentiles
re-measured + re-pinned in the test WITH the number (v5 floors
hull 0.61/0.94/1.39, wings 0.53/0.59/1.47 - the v6 bake adds darker
bands, the p10 floor MAY drop ~0.05-0.10; the re-pin is expected and
pre-registered here, executed WITH the measured number at ST-468).

## 4. Flame/clearance invariants (assert in CG gate)
  - Center exhaust mouth z = -0.88 kept (0.08u clearance of apex -0.80).
  - No Hull/Nozzle surface within the flame cone (x^2 + y^2 <=
    ((z_apex - z)/1.0)^2 for z in [-1.80, -0.80]) except the mouth ring
    itself: keel girders end z -0.85 (their y offset 0.25 also keeps
    them outside: at z -0.85 the cone radius = 0.05 < 0.25... the keel
    check is z-bound only, per section 2 N1).
  - Prop tip clearance per section 2 E1 (min 0.186u from Z axis at
    z -0.94 vs flame radius 0.14u there).
  - No vertex below y -0.42 (skid floor); no vertex past z -0.80
    except the prop discs/hubs (z -0.94..-1.06 allowed, x |.| >= 0.28)
    and the v5 exhaust mouth ring (z -0.88, r <= 0.12).
    STERN BOUND RE-READ: the frozen length pin is z -0.80..+1.80 with
    |len-2.6| <= 0.26 -> the props at z -1.06 make len 2.86 -> |2.86-
    2.6| = 0.26 = AT the pin limit (<=). FROZEN DECISION: prop discs
    sit at z -0.94 with hub depth to -1.02 (max stern z = -1.02 -> len
    2.82, |delta| = 0.22 <= 0.26 PASS with 0.04u margin). Spinner
    cones point +Z (forward), no geometry past -1.02.

## 5. File size prediction (measured at ST-467, re-pinned WITH the number)
22.44 B/tri (v5 measured; the cage/skid geometry is box-like = similar
efficiency; COLOR_0 on the same 2 prims):
  34,700 t -> ~778,668 B (aim)   37,100 t -> ~832,524 B (cap)
  MAX_FILE_BYTES 524,288 -> 1,048,576 (re-pin at ST-468; the cap 832 KB
  fits under 1 MB with 216 KB margin).
  dist delta ~ +393,912 B -> dist ~ 3,955,571 B > 3,650,000 ceiling ->
  the pre-registered ceiling renegotiation executes at ST-468 WITH
  MEASUREMENT (expected new ceiling = measured dist + ~94 KB headroom,
  ~4,050,000 B; the 88,341 B close floor re-derives from the new
  ceiling - floor = measured headroom, per the I498 mechanism).

## 6. Export + CG gate (ST-467 acceptance)
- Blender 5.2.3 headless (D:\Blender\blender.exe --background),
  deterministic script in .evidence/I501/ (seeded random where any),
  glTF 2.0 binary (.glb), apply all transforms, +Y up (Blender native),
  no materials beyond the 3 named (VR_Ship_Hull 0xab9374 / VR_Ship_Wing
  0x54402e / VR_Ship_Cockpit 0x0b1830 - the code overrides color
  anyway; the GLB material colors are the identity values), COLOR_0 as
  a float vertex color attribute on Hull+Wings.
- CG gate (E57 rule 8 pattern, as v5/E63): clay 6-view render (front/
  back/left/right/top/three-quarter) + tint A/B (clay vs tinted) +
  96-px silhouette check (the "solid dark shape" test at the in-game
  read size) + back-view (the stern approach camera) + per-node tri
  count table + the section 3/4 invariants + GLB byte size + the
  6-node/3-mat/2-colorPrims contract asserts.
- The v5 GLB stays in git; assets/ship.glb is REPLACED at the ST-467
  commit (single commit = build + gate evidence; rollback = revert).