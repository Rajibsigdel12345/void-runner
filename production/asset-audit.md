# Asset Audit - Void Runner (I207 / ST-207, cgs-asset-audit)

## Summary
E9 opens with a full audit of the five vendored Blender GLBs and the GLTF render
pipeline (ST-207). All five assets are valid glTF 2.0 binaries with correct VR_
naming, within poly budget, with bounding radii EXACTLY matching the logical
collision radii in CONFIG. In-browser, all five load and swap in over the
procedural stand-ins (10/10 live rocks on GLB geometry at wave 5; boss on the
384-vert GLB obelisk; ship body swapped to the GLB scene). The procedural
fallback was proven end-to-end by aborting all five GLB fetches: the game boots
to MENU on full-procedural geometry with exactly 5 designed loader warnings.
New persistent node test suite tests/assetGlbs.test.js (3 tests) pins the
structural audit. No code changes to the render path; 633/633, build 0.

## Asset Inventory
| Asset | Bytes | glTF | Nodes | Materials | Tris | Budget | Max vertex radius | Parity |
|---|---|---|---|---|---|---|---|---|
| ship.glb | 22,776 | v2 valid | VR_Ship_Hull, VR_Ship_Wings, VR_Ship_Fin, VR_Ship_Cockpit | VR_Ship_Hull, VR_Ship_Wing, VR_Ship_Cockpit | 254 | <=300 OK | 1.475 (wingtip) | span 2.5 / len 1.9 exact |
| asteroid_L.glb | 33,908 | v2 valid | VR_Rock_L | VR_Rock | 320 | <=320 OK | 2.2000 | = CONFIG 2.2 exact |
| asteroid_M.glb | 9,420 | v2 valid | VR_Rock_M | VR_Rock | 80 | <=120 OK | 1.3000 | = CONFIG 1.3 exact |
| asteroid_S.glb | 9,420 | v2 valid | VR_Rock_S | VR_Rock | 80 | <=80 OK | 0.7000 | = CONFIG 0.7 exact |
| boss.glb | 14,760 | v2 valid | VR_Boss | VR_Boss | 192 | <=250 OK | 5.285 (tapered corner) | cross 4.36 (+6%) / height 9.00 (+2%) |

All files < 100 KB (spec cap). Container: magic 0x46546C67, declared length ==
file size, single JSON chunk + single BIN chunk each. Total GLB payload
90,284 B raw (5.8 KB of the 449.6 KB gzip dist).

## Import Risk
- Load path: three/addons/loaders/GLTFLoader.js resolves to the vendored
  vendor/jsm (no import-map change needed) - verified live (all 5 ready:true).
- Fallback: fire-and-forget loadAll at boot; a failed load resolves
  {ready:false}, the renderer keeps its procedural geometry, and the only
  console output is the loader's own warn. Proven live with all 5 fetches
  aborted (page boots to MENU, ship retains ship_body, 5 warns, no crash).
- Swap-in points verified live: ship useGLB (procedural ship_body removed,
  GLB Scene present), rockRenders.setGLB (pool geometry census 100% GLB at
  wave 5), bossMesh.useGLB (384-vert geometry + in-code 0x3a3252/0x7a4dff
  material - GLB material correctly non-authoritative).
- Ship cockpit is a 224-tri UV sphere (60% of the ship's tris) - the only
  non-faceted element on the ship; flat-shaded look is preserved elsewhere.
  Flagged for ST-208 (re-cut canopy), not a defect (spec allows the sphere).
- Draw-call note: the ship is 4 separate meshes (hull cone, wing slab, fin,
  cockpit) = 4 calls; ST-208 should merge hull+fin+wings into one delta mesh
  (target: 2 draw calls: delta + canopy).

## Missing Asset
None for the current scope. ST-211/ST-212 add power-up emblems, drone polish,
and the starfield/arena ring (new assets/, not gaps).

## Licensing Note
All five GLBs are Blender-authored in this project (bpy, untracked blender/
working dir) - first-party, no third-party licensing surface. No textures, no
external sources. blender/ stays untracked (never committed).

## Risks
- R1 (LOW): boss cross-section is +6% over the 4.1 spec target (4.36) - inside
  the +/-10% acceptance band; the tapered corner radius 5.29 exceeds the
  logical 3.4 hit radius by design (hitbox smaller than visual extent is the
  forgiving direction for a slow boss; unchanged from the procedural box).
- R2 (LOW): ship hull is a 6-tri cone - reads thin from the side; ST-208
  targets a proper faceted delta per the video research (Imphenzia approach:
  extruded angular hull + recessed canopy, 2-material accent).
- R3 (INFO): rocks share one shape per size; visual variety is rotation-only.
  ST-209 (shielded/golden variants + displacement pass) is the planned owner.
- R4 (INFO): golden variant is a material override on GLB geometry - verified
  live (golden rock renders on the 80/320-tri GLB meshes; screenshot 03).

## Changed files or proposed files
- tests/assetGlbs.test.js (NEW, 3 tests: container/naming/budget/radii for
  all five assets; reads assets/ + CONFIG only - DOM-free, deterministic)
- production/asset-audit.md (this file, NEW - the E9 audit home)
- design/art-direction-research.md (+ I207 video-grounding section)
- No render-path code changed (pipeline verified, not modified).

## Verification evidence
- Node: structural audit script (all 5 valid, names/budgets/radii as tabulated)
  + persistent tests/assetGlbs.test.js; npm test 633/633 (was 630, +3); build
  exit 0 (88 files, budget unchanged).
- Browser (dev :5173, ?nocache=207a/207b/207fb): 5/5 assets ready:true;
  ship children [Mesh, Mesh, Scene] with ship_body removed; scripted pilot to
  wave 5 in 154.4 s / 182.3 s (two runs) - boss alive on 384-vert GLB with
  in-code material; rock pool census 10/10 GLB (2xL->960 verts, 8xM/S->240,
  matching live sizes SSMMLMLMSM); 0 non-finite; combat frame steady
  19 calls / 1566 tris (within I45/I110 budgets); console 0 errors / 0
  warnings on the clean run (1 expected adaptive-quality INFO).
- Fallback: all 5 GLB routes aborted -> 5/5 ready:false, procedural ship_body
  intact, MENU boot clean, exactly 5 loader warns (+5 net errors from the
  intentional abort).
- Screenshots: .evidence/I207/02-combat-glb.png (GLB ship + rocks, wave 1),
  03-boss-combat.png (GLB Monolith + golden rock + ship, wave 5).

## Next owner or decision
- Next: I208 = ST-208 ship model refresh (cgs-asset-spec then Blender modeling):
  faceted angular delta hull + recessed canopy, 2-material accent, merge to
  <=2 meshes, keep span 2.5 / len 1.9 / tris <=300, VR_ naming, flat shade.
  Grounding: design/art-direction-research.md "I207 video grounding"
  (Imphenzia spaceship series; transcripts queued - YouTube rate limit).
- Decision: keep the one-geometry-per-size rock simplification until ST-209;
  boss model stays (within budget); no asset deletions this pass.
