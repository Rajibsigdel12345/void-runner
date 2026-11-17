# Ship v5 "Real Airship" + Enemy Detail - Asset Spec (frozen I469 / ST-436)

Companion to design/ship-remaster-research-E61.md (the research + design
decisions). This is the FROZEN, executable part-level contract:
- ST-437 (I470): the ship v5 build, sums to <= 18,900 tris.
- ST-438 (I471): the enemy detail pass, section 7.
Carries forward the FROZEN v4 contract from design/ship-v4-spec.md (node
names, material names, COLOR_0 scope, scale, flame origin, A/B gate). The
live v4 tree is tree-verified this iteration (parsed from the GLBs):
  ship.glb 14,276 t (Cockpit 1,000 / Engine 2,128 / Fin 928 / Hull 7,800
  [COLOR_0] / Nozzle 284 / Wings 2,136 [COLOR_0]; node->mat Hull,Engine,
  Nozzle->1(Hull), Wings,Fin->2(Wing), Cockpit->0(Cockpit)).

## 1. FROZEN contract (inherited from ship-v4-spec.md - UNCHANGED)
- glTF 2.0 GLB, Y-up, 1 Blender unit = 1 world unit. No rig/anim/morph/UVs.
  POSITION + NORMAL on every mesh; componentType 5123 (UNSIGNED_SHORT).
- 6 node names EXACT: VR_Ship_Hull, VR_Ship_Wings, VR_Ship_Fin,
  VR_Ship_Engine, VR_Ship_Nozzle, VR_Ship_Cockpit.
- 3 material names EXACT: VR_Ship_Hull, VR_Ship_Wing, VR_Ship_Cockpit.
  The GLB node->material assignment stays IDENTICAL to v4: Hull->1, Engine->1,
  Nozzle->1, Wings->2, Fin->2, Cockpit->0. The code routes by NODE NAME
  (Cockpit->cockpitMat, Wings->wingMat, else->bodyMat) and is UNTOUCHED - so
  the rendered material routing is byte-identical to v4; only geometry +
  COLOR_0 change.
- COLOR_0 on EXACTLY 2 prims: VR_Ship_Hull + VR_Ship_Wings (colorPrims == 2).
  Per-facet grayscale value map; the other 4 prims stay colorless (code adds
  white identity via ensureWhiteColors).
- Native size authored in Blender, NO rescale in code: span 4.0u
  (x -2.00..+2.00), length 2.6u (z -0.80..+1.80), height 0.90u
  (y -0.28..+0.62). assetGlbs pins |len-2.6| <= 0.26, |span-4.0| <= 0.4.
- Flame origin: nacelle/exhaust mouth authored at z = -0.88, 0.08u clear of
  the in-code flame apex at z = -0.80 (v4 clearance 0.14u held).
- Palette + emissive (FROZEN, code-side, untouched): hull 0xab9374, wing
  0x54402e, cockpit 0x0b1830 + emissive 0x59d8ff @ 1.4.
- Presence (I455, CLOSED): ship silhouette 109x95 px @ 1280x720 - the
  "small looking" complaint is MODEL detail/volume, NOT scale. Do NOT touch
  scale or camera (camera = E62).

## 2. Ship v5 part-level tri budget (sums to <= 18,900)
The +4,624-tri headroom over v4 (14,276 -> 18,900) is spent WHERE IT CHANGES
THE READ (silhouette + hero presence), per the research (F1/F2: geometry at
the outline; surface detail baked into COLOR_0). Per-part AIMS sum to
18,450; per-part CAPS are internal ceilings. The test checks the SHIP TOTAL
against BUDGETS.ship = 19,000 (unchanged) - so the build must land <= 18,900
(target) and <= 19,000 (hard).

| node            | role (v5)                        | v4   | v5 aim | v5 cap |
|-----------------|----------------------------------|------|--------|--------|
| VR_Ship_Hull    | teardrop envelope + gondola + deck| 7,800| 9,800  | 10,000 |
| VR_Ship_Engine  | 2 nacelles + turbine/exhaust discs| 2,128| 3,200  | 3,400  |
| VR_Ship_Fin     | dorsal + ventral tail (cruciform)| 928  | 1,400  | 1,600  |
| VR_Ship_Wings   | lateral fins + envelope band/ribs | 2,136| 2,500  | 2,700  |
| VR_Ship_Cockpit | suspended gondola canopy/glass   | 1,000| 1,200  | 1,400  |
| VR_Ship_Nozzle  | bow anchor + keel fin + exhaust   | 284  | 350    | 400    |
| TOTAL           |                                  | 14,276| 18,450| 19,500 |

Per-part build detail (what the extra tris buy):
- VR_Ship_Hull (~9,800): the teardrop envelope at a denser grid than v4 (the
  dominant volume - smoothest curvature at 100 px is the biggest presence
  win). ~12 gore-rib hoops following the taper (v4 had 10); a keel ridge
  band along the lower centerline; the suspended capsule gondola (chamfered,
  ~8 window insets); an upper deck + small stack. Panel lines + rivets + rib
  shading + gondola seams are NOT modeled - they are BAKED into COLOR_0
  (F2). Target: 8,000-8,400 envelope + 900 gondola + 600 deck/stack.
- VR_Ship_Engine (~3,200): 2 nacelles (x +/-0.34) each with a LARGE turbine /
  exhaust disc (the dominant "airship rotor" read, F6) - a 12-spoke disc +
  hub + rear open mouth ring + front intake lip. ~1,400 per nacelle incl.
  disc. This is the single most "airship, not generic ship" cue.
- VR_Ship_Fin (~1,400): dorsal + ventral fins (with the lateral fins = the
  cruciform). Root on the envelope top/belly at the stern, swept LE, 3 spars
  each, rounded tips - the stern "X/+" reads at the rear-approach camera.
- VR_Ship_Wings (~2,500): the lateral tail fins + the lateral envelope band /
  ribs (the secondary-dark 0x54402e surface). Keep v4's span/sweep read, add
  aileron grooves + winglets.
- VR_Ship_Cockpit (~1,200): the suspended gondola canopy dome over the
  forward gondola, front-sloped, ~5 longitudinal frame ribs + 2 cross ribs
  (the cyan glass reads as the "crew cabin").
- VR_Ship_Nozzle (~350): bow anchor ring/cone (embedded in the nose) + a keel
  fin flat plate along the bottom + the rear exhaust cone mouth (z = -0.88).

Cut ladder (in order, if the build overshoots 18,900):
  C1 drop the upper deck + stack (-600 -> Hull aim 9,200, total 17,850)
  C2 turbine discs 12 -> 8 spokes (-500 -> Engine aim 2,700, total 17,350)
  C3 envelope gore ribs 12 -> 8 (-700 -> Hull aim 9,100)
  C4 scope-check rung 2: ship target 18,900 -> 16,000 (re-pin totalTris down)

## 3. COLOR_0 bake (Hull + Wings ONLY)
Same v4 per-facet formula: v = clamp(1.0 + k * dot(n, L), 0.30, 1.55),
L = normalize(-0.45, -0.55, 0.70). k_hull ~ 0.60 (was 0.55, slightly stronger
relief), k_wings ~ 0.80. Bake these BODY-COLORED bands as value variation
(F2 - they read as "detailed skin" but are invisible to the model):
- envelope gore ribs: a darker facet ring at each of the ~12 rib positions.
- keel band: darker facets along the lower centerline.
- panel lines: thin darker facet rows at ~1/6 of the envelope length.
- gondola seams: a darker facet row at the hull/gondola junction.
Invariants (tests assert): FLOAT(5126) VEC3, count == POSITION count,
grayscale channel delta <= 0.02, spread floors >= 0.35 (v4 floors: hull
0.61/0.94/1.39, wings 0.53/0.59/1.47 - the re-measured percentiles are
re-pinned in SHIP_FACET with a clause comment).

## 4. File budget (predicted - measured at ST-437, re-pinned WITH the number)
B/tri is pipeline-dependent (per-corner COLOR_0 on the enemy hulls makes
them ~96-106 B/tri; the ship is more efficient at ~24 B/tri). Predicted, at
the section-2 aims:
  ship.glb      347,184 B / 14,276 t -> ~438 KB / 18,450 t  (+~99 KB)
  enemy_hunter  139,752 B / 1,432 t  -> ~211 KB / 2,250 t   (+~75 KB)
  enemy_gunship 178,220 B / 1,688 t  -> ~236 KB / 2,300 t   (+~62 KB)
Predicted project totals (26 GLBs):
  totalFilesKB  1,016.33 -> ~1,250  (scope-check re-pin target was 1,240)
  totalGeoKB    976 (cap) -> ~1,120 (measured at execution)
  totalTris     28,779 -> ~34,400 (range 34,400-34,900 vs the 36,000 re-pin)
  ship file     438 KB > 384 KB -> MAX_FILE_BYTES re-pin 393,216 -> 524,288
FLAG: the refined totalFilesKB prediction (~1,250) is ~10-12 KB above the
scope-check's 1,240 re-pin target (the scope-check's ~1,190 estimate
under-counted the per-corner enemy B/tri). This is NOT a silent move: at
ST-437/ST-438 the totalFilesKB cap is re-pinned to the MEASURED value +
headroom (documented old->new), per the scope-check's own re-pin mechanism
("re-measured at execution, caps = measured + headroom"). The other re-pins
(totalTris 30,000->36,000, totalGeoKB 976->1,120, MAX_FILE_BYTES
393,216->524,288) hold as pre-registered.
dist (includes the GLBs): 2,882,938 B + ~237 KB GLB growth -> ~3,120,000 B,
inside the renegotiated 3,250,000 ceiling (headroom ~130 KB), floor 102,400
holds.

## 5. Blender export notes (carry from v4 - the I436 recipe)
- glTF exports COLOR_0 ONLY when the attribute is referenced in the material
  node tree: Color Attribute(COLOR_0) -> Mix RGBA (with base color) ->
  Principled BSDF. Only the Hull + Wing materials reference COLOR_0; the
  Cockpit material must NOT.
- Smooth shading = ALL polygons use_smooth = True. NO auto-smooth modifier
  (it splits verts - the 252->297 vertex crack, I436). recalc_face_normals
  before bevels. export_apply OFF for smoothing. EAR_CLIP -> BEAUTY
  triangulation.
- Deterministic build: .evidence/I470/build_ship_v5.py, Blender 5.2.3
  headless (D:/Blender/blender.exe -b). Backup the current ship.glb to
  .evidence/I470/backup/ before overwriting assets/ship.glb.

## 6. A/B gate (ab470 in .evidence/I470/, I436/I454 harness)
- CG clay pass: 6 PNGs (front/side/back/three-quarter/overview/behind-rear),
  isolated scene (ship + lights + stars, fx off), 1280x720 + a 256-px luma
  pass. Confirm the SOLID-DARK-SHAPE silhouette reads as an airship (F1).
- In-game tint pass: 3 PNGs (chase + overview + rear-approach), the real
  palette tint + cockpit cyan, freeze+settle+double-render, whitelist
  traversal from arenaFloor (ship-hide inside each shot's evaluate).
- Gates: console 0 errors; restore byte-identical after the swap; 256-px
  ship-window luma in [15, 235]; OVERVIEW presence re-check worstRim <= 0.85
  AND silhouette >= the current 109x95 px read. Kill dev server + close
  browser after (hygiene).

## 7. Enemy detail spec (ST-438)
Same silhouette-first + value-bake approach. Keep the EXACT node names +
3 materials + the per-hull grayscale COLOR_0 (fleet convention: the value map
multiplies over the runtime palette; a COLORED bake would corrupt it, so it
stays grayscale/neutral - enemy-visual-language.md rule 8). The caps are
BUDGETS.hunter/gunship = 2,400 (UNCHANGED - no test re-pin; the ST-437
totalTris re-pin already covers the ~+1,430 enemy tris).
HUNTER (1,432 -> aim 2,250, cap 2,400, headroom 150):
| node             | role (v5)                          | v4  | v5 aim |
| VR_Hunter_Hull   | denser manta + 2 weapon hardpoints | 992 | 1,400  |  (COLOR_0)
| VR_Hunter_Fin    | deployable rear fins (W-rear)      | 340 | 600    |
| VR_Hunter_Core   | telegraph core (threat-red)        | 100 | 250    |
| TOTAL            |                                    | 1,432| 2,250 |
GUNSHIP (1,688 -> aim 2,300, cap 2,400, headroom 100):
| node               | role (v5)                          | v4   | v5 aim |
| VR_Gunship_Hull    | bulkier hull + spine + hardpoints  | 1,450| 1,650  |  (COLOR_0)
| VR_Gunship_Nacelle | 2 exposed engine nacelles          | 174  | 450    |
| VR_Gunship_Bay     | open forward weapons bay           | 64   | 200    |
| TOTAL              |                                    | 1,688| 2,300  |
Detail rules: weapon hardpoints + engine nozzles are GEOMETRY (silhouette /
lighting); panel lines + rivets + hardpoint recesses are BAKED into the hull
COLOR_0. The accent parts (hunter core / gunship bay) keep <= 4% of the
silhouette + emissiveIntensity <= 1.0 (E59 rules 4/5). Same use_smooth
recipe as the ship.
Differentiation (E59 rule 2 - must read apart at busy-frame distance):
  HUNTER   = flat, low, wide-swept manta + W-rear + rust luma ~103 + threat-
             red core.
  GUNSHIP  = tall, bulky, wide + central bay + two nacelles + gunmetal luma
             ~65 + ember bay.
Separation = SILHOUETTE (aspect + mass) + LUMA + ACCENT, not color noise.
Confirmed by a busy-frame screenshot at ST-438 (measure, don't assume).

## 8. ST-437 / ST-438 re-pin set (each lands WITH the measurement)
tests/assetGlbs.test.js:
  - BUDGETS.ship = 19,000 UNCHANGED (v5 target 18,450 < 19,000 - no re-pin).
  - BUDGETS.hunter/gunship = 2,400 UNCHANGED (enemy aims < 2,400).
  - wingspan/length pins UNCHANGED (native size identical to v4).
  - SHIP_FACET hull/wings -> RE-MEASURED + re-pinned with a clause comment
    ("I470 (ST-437) EXPLICIT re-pin: I454 {0.6148/0.9402/1.3888,
    0.5346/0.5854/1.4654} -> measured on the 18,xxx-tri v5 bake").
  - MAX_FILE_BYTES 393,216 -> 524,288 EXPECTED (ship ~438 KB > 384 KB).
  - ROCK_FACET / enemy facet pins UNCHANGED (rock/enemy geometry re-measured
    at ST-438 only for the enemy hull bake, if the percentiles move).
tests/assetPerf.test.js (measured at ST-437 ship import; enemy deltas land
at ST-438):
  - totalTris 30,000 -> 36,000 (predicted measured ~34,400-34,900).
  - totalFilesKB 1,024 -> 1,240 (predicted ~1,250 - FLAGGED, re-pin to
    measured + headroom if it lands above 1,240; documented old->new).
  - totalGeoKB 976 -> 1,120 (measured at execution).
Causal seed 9876: NO re-pin (zero core behavior change).
Playframe A AND B: WILL MOVE - RE-PINNED WITH DECOMPOSITION (I437 pattern;
predicted A ~19,154 / B ~42,074 - measured, never assumed; a pin that does
not close is a stop, not a nudge).

## 9. Acceptance checklist (ship v5)
1. 6 node names EXACT + 3 material names EXACT in the exported GLB;
   node->material assignment identical to v4.
2. Bbox: |len-2.6| <= 0.26, |span-4.0| <= 0.4, y [-0.28, +0.62].
3. Total tris <= 19,000 (target <= 18,900); per-part within section-2 caps.
4. File < 524,288 B (target <= 500 KB); MAX_FILE_BYTES re-pin landed if > 384 KB.
5. COLOR_0 on EXACTLY Hull + Wings (colorPrims == 2), FLOAT(5126) VEC3,
   per-corner count == POSITION count, grayscale delta <= 0.02, spread
   floors >= 0.35; SHIP_FACET re-measured + re-pinned.
6. ab470 A/B PASS (clay 6 + tint 3 PNGs; console clean; restore byte-
   identical; luma bands; OVERVIEW worstRim <= 0.85 + silhouette >= 109x95 px).
7. npm test green (all re-pins landed with measured numbers + clause comments).
8. npm run build 0; dist <= 3,250,000 B (floor >= 102,400); vendor
   76DEA8151BC9352A unchanged.
9. Causal seed 9876 EXACT (zero core change).
10. Hygiene: dev server killed, 5173/5199 free, chrome 0, no stray terminals.

## 10. Non-goals (ST-437 / ST-438)
- No src changes (renderer, config, collision, camera all untouched).
- No ship scale / camera change (I455 closed; camera = E62).
- No new nodes / materials / textures / hexes; no normal maps; no per-frame
  deformation; no > 3 materials per craft.
- No rock / boss / comet work (v11 already satisfies the user's crater ask).
- WebGPU: NOT switched in E61 (decision output of ST-439; a switch is F2
  territory = a separate follow-up epic).

## Changed files (I469)
- design/asset-spec-ship-remaster-E61.md (NEW - this file)
- design/ship-remaster-research-E61.md (NEW - research + decisions, same iter)

## Next owner
ST-437 (I470) builds ship v5 per sections 1-6; ST-438 (I471) builds the
enemies per section 7. Both keep causal seed 9876 EXACT and land their
re-pins WITH the measurement.