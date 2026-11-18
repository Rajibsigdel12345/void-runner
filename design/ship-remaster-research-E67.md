# Ship v6 "Real Airship" Remaster - Research (E67, I499 / ST-465)

Authored under cgs-research. Companion to production/scope-check-E67.md, the
frozen v5 contract (design/asset-spec-ship-remaster-E61.md) and the E61
research (design/ship-remaster-research-E61.md). ST-466 (the frozen v6 spec)
and ST-467 (the Blender v6 build) do not start until this doc lands.
Research items below are LABELED (source + locator) and are NOT
tree-verified; the live-tree numbers cited (bytes / tris / pins) ARE
tree-verified this iteration (file listing + GLB parse, I499).

## User request (verbatim, 2026-11-18)
"improving the main character currently its small looking airship, put in
more detailing, increase the polygon count and make it a real airship, go
through the guides and refrence samples to build them, like wise for the
other assets make them more realistic use the polygons and gpu resource as
much as needed you can switch is to the webgpu from webgl if you are on
webgl to make them possible".

## Current state (tree-verified I499)
- assets/ship.glb: 384,826 B (listed 375.7 KB), 17,143 tris (v5, E61 build),
  6 VR_Ship_* nodes, 3 materials, COLOR_0 on Hull+Wings only. B/tri ~ 22.4.
- MAX_FILE_BYTES = 524,288 (ship cap since E61).
- dist ceiling 3,650,000 B; current dist 3,561,659 B / 175 files
  (I498); headroom 88,341 B (close floor, renegotiated WITH MEASUREMENT).
- Render: dual arm - classic WebGL2 default + ?fx=webgpu experimental (I495
  C3); WebGPU explicitly permitted by the user for this pass.
- In-code flame cones at shipMesh.js L114/L126, apex z = -0.80; the GLB
  exhaust mouths sit z = -0.88 (0.08u clearance, v5 contract).

## Reference sources (labeled research; NOT tree-verified)

YouTube (MCP, I499 pass - frames @640 px):
- Sculpt Labs "Blender 3.5 - Steampunk Airship - 3D Modeling Tutorial"
  (ue6S6sa08U4, 2023-05-13, 7.2K views): frames 9:35/19:10/28:45/38:21/
  47:56/57:31/1:07:06. THE v6 gap list - (a) an EXTERNAL RIGID FRAME cage
  raised ON the envelope skin: longitudinal girders + gore ribs that catch
  the light (19:10); (b) panelled GONDOLA: vents, grille, hatch, cabin
  window (28:45-47:56); (c) circular SPOKED LANDING SKIDS/pods under the
  gondola (57:31); (d) 3-blade PROPELLER disc on the tail (9:35); (e)
  rivet BOSSES (small spheres) along the rudder/fin edges (1:07:06).
- Art MZ "Steampunk Airship 3D modeling Pt.1 (Maya)" (RfOPOri4JLI,
  2022-09-03, 12K views): frames 0:53-6:15. Envelope built from a clear
  PANEL GRID with structural bands (1:47/5:21), ribbed NOSE CONE with a
  nose ring (3:34/4:28), keel section with visible GIRDERS (2:40/5:21),
  deck structure forward (0:53). Confirms: the panel grid + keel girders
  are modeled, not painted.
- Sculpt Labs "Substance Painter - Steampunk Airship" (-hFiffcD768, 2023):
  surface sell = panel lines, rivet rows, wear, grime in the panel
  recesses -> in our COLOR_0 scheme these bake as VALUE bands (F2, E61).
- Shift4cube "Fix High-Poly AI Models in Blender with Remesh + Texture
  Bake" (CSSpQBd-mmI, 2025, 37K views): the remesh + bake pipeline is the
  escape hatch if a sculpted part over-shoots its tri budget - decimate
  toward the budget, keep the silhouette edges.

Carried from E61 (design/ship-remaster-research-E61.md, no re-search):
- MS FS2024 "Silhouette And Material Contrast": geometry at the outline +
  high-contrast parts; body-colored rivets/panel lines get BAKED.
- Pixelwolf "Geometry vs Texture": "geometry earns its keep at the
  silhouette"; spend detail where it changes the read.
- UNDERPOLY / CGTrader airships: 2-3 materials canonical (we have exactly
  3); rotors are a first-class multi-hundred-tri feature.
- E61 F1/F2: geometry at the outline; surface detail baked into COLOR_0.

## Findings (F6-x) - what v6 is

F6-1 THE v5 -> v6 GAP (the "small looking" complaint, second round).
I455 (E57) closed the SCALE question (silhouette 109x95 px @ 1280x720 -
adequate). v5 spent its tris on the envelope + cruciform tail + nacelles +
gondola + canopy. Against the references the missing reads are, in order
of silhouette impact:
  1. EXTERNAL RIGID FRAME - raised longitudinal girders (4 upper + 2
     lower) + raised gore ribs (~10) ON the envelope skin. This is THE
     "rigid airship / real zeppelin" cue; it breaks the smooth-v5-skin
     read and catches light all around the hull. (Sculpt Labs 19:10;
     Art MZ 5:21.)
  2. SPOKED LANDING SKIDS - 2 circular spoked pods on struts under the
     gondola; adds a strong lower-silhouette element + the "vehicle" read
     from behind-below. (Sculpt Labs 57:31.)
  3. GONDOLA INTERIOR DETAIL - cabin windows (3-4 insets), vent grille,
     roof hatch, hull panel lines modeled as shallow recesses. (Sculpt
     Labs 28:45-47:56; Art MZ 0:53.)
  4. TAIL/RUDDER DETAIL - rivet bosses along fin edges, spar ribs,
     propeller hub + 3-blade disc at the stern (the v5 turbine discs stay;
     the blade disc is added between the nacelles' rear and the fin roots).
     (Sculpt Labs 9:35, 1:07:06.)
  5. NOSE + KEEL - nose ring + ribbed nose cone; keel girders (2 raised
     channels) along the lower centerline. (Art MZ 3:34/2:40.)
  6. MAST + RIGGING - 1 short forward mast + 2-3 thin rigging lines
     (cylinder r 0.012u) from mast to envelope; cheap, reads at distance.

F6-2 TRi BUDGET. v5 = 17,143. v6 target = 35,000 (2.04x), hard cap 38,000.
References: full game airships run 16.7k-50k (UNDERPOLY full 16.7k; CGTrader
animated 12,283 with 6 props; Sculpt Labs steampunk = ~100k+ sculpt, we do
NOT go there). ONE 35k-tri ship is a negligible GPU cost (the scene today
draws ~35k tris TOTAL - the ship would become ~half the scene, which is
fine for WebGL2/WebGPU at this scale).

F6-3 SIZE BUDGET (the load-bearing constraint). At v5's 22.4 B/tri (COLOR_0
on 2 prims, no textures), 35,000 tris ~= 784 KB GLB. dist delta ~= +399 KB
-> dist ~= 3,961,000 B > 3,650,000 ceiling. PRE-REGISTERED (not a silent
move): the dist ceiling renegotiates WITH MEASUREMENT at ST-468 (precedent:
I495 C1 3,250,000 -> 3,650,000) to the measured dist + headroom, expected
~4,050,000 B. MAX_FILE_BYTES 524,288 -> 1,048,576 (measured at ST-467).
Alternative (C2 in the cut ladder): compress the GLB (meshopt) to hold the
ceiling - deferred, adds a runtime decoder dependency; not needed at
35k tris.

F6-4 FROZEN CONTRACT (unchanged, inherited from v4/v5): 6 node names
EXACT (VR_Ship_Hull/Wings/Fin/Engine/Nozzle/Cockpit), 3 material names
EXACT, node->material routing IDENTICAL, COLOR_0 on EXACTLY 2 prims
(Hull+Wings), no rig/anim/UVs, POSITION+NORMAL, componentType 5123, Y-up,
1u = 1 world unit, NO rescale in code (span 4.0u / length 2.6u / height
0.90u pins hold), exhaust mouths z = -0.88 with 0.08u clearance of the
in-code flame apex z = -0.80, palette + emissive code-side untouched.

F6-5 COLOR_0 BAKE SCOPE (Hull + Wings only, per-facet value, E61 formula
v = clamp(1.0 + k*dot(n,L), 0.30, 1.55), L = normalize(-0.45,-0.55,0.70)):
v5 bands (gore-rib rings, keel band, panel lines, gondola seams) + NEW:
frame-girder shading (darker facet rows under each raised girder), skid
shadow (darker facets on the envelope belly under the struts), nose-ring
line, mast shadow dot. The raised geometry carries the shape; the bake
carries the "recess is shaded" read.

F6-6 VERIFICATION PLAN: ship tris change -> playframe A pin (22/17,361)
RE-PINS WITH MEASUREMENT (per-child probe, I497 pattern: the GLB ship tris
grow, flame cones 20+16 unchanged, floorDisc/ArenaRing/sprite unchanged).
causal495 sim pins: NO core change -> must stay EXACT (the ship GLB swap
does not touch sim; glb-ready + rock pins unchanged - VERIFY, not assume).
BUDGETS.ship in assetLoader tests: 19,000 -> 38,500 (measured at ST-468).
CG gate (E57 rule): clay 6-view + tint A/B + 96-px silhouette + back view.

## Decisions locked here (ST-466 freezes them)
1. v6 adds, in order: rigid frame cage -> skids -> gondola detail ->
   tail/prop + rivet bosses -> nose/keel -> mast + rigging.
2. Tri target 35,000 / cap 38,000 (F6-2).
3. Ceiling renegotiation WITH MEASUREMENT pre-registered (F6-3);
   MAX_FILE_BYTES -> 1,048,576 measured.
4. Frozen contract unchanged (F6-4); bake scope per F6-5; verification per
F6-6. Cut ladder in the scope check.