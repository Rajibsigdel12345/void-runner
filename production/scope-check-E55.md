# Scope Check - E55 Ship "Real Airship" Remaster & Asset Realism II (cgs-scope-check, I433)

## Summary
Bounded art epic answering the user's continued directive: remaster the player SHIP - the main
character, currently the 818-tri detailed low-poly fighter from E54 (I429) - into a substantially
MORE detailed, higher-polygon, substantial "real airship": a big, believable, feature-rich craft
(bulkier/rounder fuselage, TWIN engine nacelles flanking the rear, larger swept wings with strakes
+ winglets + panel lines, a proper multi-pane canopy, TWIN tail fins, and surface GREEBLES: vents,
struts, antenna, plate insets) - MORE polys + MORE detail, using polygons/GPU as needed. The user
says the current 818-tri fighter "still reads small". The MAIN deliverable is the Blender ship
remaster v2. Secondary (CUTTABLE): make 1 other asset more realistic in Blender (asteroid/other).
The renderer is untouched (3 materials VR_Ship_Hull/Wing/Cockpit, 6 VR_Ship_* nodes, COLOR_0 on
EXACTLY hull+wings, extent within the ship box). DO NOT switch to WebGPU (ST-401/I431 FROZEN verdict
KEEP WebGL2 - a few thousand tris is trivially within WebGL2; switching would regress the frozen 0.72
bloom + I334 GradePass and buy nothing). Grounded in YouTube ship hard-surface + greeble references
(silhouette-first + panel insets + greebles, NOT high-poly sculpt).

## Surface & Evidence
- Player ship: assets/ship.glb (63,908 B / 818 tris / 1549 verts / 6 nodes VR_Ship_Cockpit/Engine/
  Fin/Hull/Nozzle/Wings / 3 mats / 2 COLOR_0 prims hull+wings / extent x -1.252..1.252 span 2.504,
  y -0.250..0.440, z -0.920..0.850 len 1.770). GROUND-TRUTH-CONFIRMED (scanned this session,
  .evidence/I433/probe_ship.mjs + probe_ship2.mjs).
- Why "still small": the 818-tri fighter, while more detailed than the 112-tri airship, is still a
  relatively SLIM single-fuselage craft with one modest engine block. To read as a "real airship"
  (a substantial, believable craft) it needs: a BULKIER/Rounder fuselage, TWIN engine nacelles
  flanking the rear, LARGER swept wings with strakes + winglets + more panel detail, a proper
  multi-pane CANOPY FRAME, TWIN tail fins, and surface GREEBLES (vents, struts, antenna, plate
  insets) - i.e. MORE structure + MORE polys.
- File-cost math (this session, .evidence/I433/probe_ship2.mjs): 1549 verts -> 63,908 B. POSITION
  f32 12 B/vert + NORMAL f32 12 B/vert + COLOR_0 f32 12 B/vert (hull 1050 + wings 359 = 1409
  colored verts) + u16 indices 4,908 B. So ~24 B/uncolored vert, ~36 B/colored vert. A ~3x-detail
  "airship" (~2500-4000 tris, ~3000-4500 verts) projects to ~150-220 KB. This EXCEEDS the current
  per-file caps (assetPerf perFileKB 85, assetGlbs MAX_FILE_BYTES 100) and the total caps
  (assetPerf totalFilesKB 320 / totalGeoKB 280) and the dist headroom floor.
- Renderer name-routing (load-bearing, do NOT break) - unchanged from E54: shipMesh.js useGLB routes
  by MATERIAL name (Cockpit->cockpitMat, Wing->wingMat+ensureWhiteColors, else->bodyMat+
  ensureWhiteColors); the facet test keys off MESH names (VR_Ship_Hull.001/VR_Ship_Hull,
  VR_Ship_Wings.001/VR_Ship_Wings). Keep 6 node names + 3 mat names + COLOR_0 on exactly hull+wings.
- YouTube grounding (3 queries 24 raw this session, I433; UNVERIFIED-BY-PLAY = watched/highlight,
  method grounding, not implemented): Skill La Noodle "A better way to create Spaceships in Blender"
  (zit7UmzcSgU) - GREEBLES: small functional details, think their function/contribution to the
  overall form, COPY+MOVE+RESCALE to save time, booleans for detail; Aaron Van de Weijenberg "Easy
  hard surface sci-fi panels" (k2vTtHj0MME) - panel insets WITHOUT booleans (loop tools ->
  inset/outset, rounded corners, final subdiv); Markom3D "Scifi Panels under one minute"
  (QWgKsOF3pB4) + Tucker Roche hard-surface speed-modeling (woNKCTvQzXY); Spacedock "How To Build
  the Structure of a Spaceship" (nyHbH3Bg1Fs, 118K views) - structure/silhouette; Special Karl
  "Spaceship Concept Art Anthology - Starfighters" (GucZrV9PSfw) - silhouette references. Takeaway:
  the "more detail" that reads at gameplay scale = GREEBLES (cheap boxes/ribs/nacelles/vents/struts,
  copy+move+rescale) + a FEW BOLD panel insets (loop inset, no boolean) + a stronger BULKIER
  silhouette (twin nacelles, bigger wings/tail). NOT high-subdiv sculpt, NOT texture-dependent
  (conflicts with the UV-free value-bake pipeline + low-poly game aesthetic).
- Asteroid/other (for the CUTTABLE realism pass): asteroids ALREADY have bump+crater relief (I307:
  L/M/S 500/140/140) + B-variant distinct silhouettes (I420) + warm value-ladder bakes; comet already
  refreshed (I421); boss already remastered (I430). So the realistic "other asset" candidate is a
  MODERNIZED asteroid refinement (subtler/secondary crater geometry, or a distinct rock) OR the arena
  ring - scope ST-406 to pick ONE at bake time (CUTTABLE). Ryan King Art "Procedural Asteroid with
  Craters" (467DrmlmsRE) = MATERIAL-based craters (NOT applicable to our UV-free GEOMETRY pipeline -
  noted, do NOT adopt the material approach; keep geometry bakes).

## Scope Fit
- Fits the directive exactly: (1) the ship "real airship" remaster = named MAIN deliverable, (2)
  other-asset realism = named secondary (bounded to 1 asset, CUTTABLE).
- Does NOT expand: no new asset TYPES, no palette/identity change, no sim/feel/balance change, no
  re-open of closed art except the CUTTABLE asteroid/other pick.
- "Use polygons and gpu resource as much as needed" (user) is honored as a bounded HIGHER-POLY
  target (~2500-4000 tris, the "real airship") - GPU-trivial for WebGL2 (the game already renders
  ~3,948 tris of assets). The cost is the GLB FILE SIZE, handled by explicit cap re-pins
  (pre-registered below).

## Budget decision (the crux; pre-registered - NEVER silent)
Current ship 818 tris / 63,908 B / 1549 verts. Target ~2500-4000 tris. Byte estimate ~150-220 KB.
This crosses SEVERAL self-imposed caps, so ALL are re-pinned EXPLICITLY old->new at the ST-405 bake:
- BUDGETS.ship (assetGlbs.test.js:18): 850 -> ~4500 (explicit; measured).
- MAX_FILE_BYTES (assetGlbs.test.js:20): 100 KB -> ~256 KB (explicit; a single constant for ALL
  assets, all others remain far below it).
- assetPerf BUDGET.totalTris: 4000 -> ~8000 (explicit; ~3948 - 818 + newShip).
- assetPerf BUDGET.perFileKB: 85 -> ~256 (re-pin to match the new ship; measured).
- assetPerf BUDGET.totalFilesKB: 320 -> ~560 (re-pin; measured).
- assetPerf BUDGET.totalGeoKB: 280 -> ~520 (re-pin; measured).
- SHIP_FACET (assetGlbs.test.js:138): hull {0.5477/0.9802/1.4414} + wings {0.4329/0.9696/1.55} ->
  new values measured at bake (explicit).
- dist ceiling (DOC-ONLY, currently 2,260,000 B): the +~100-150 KB ship EATS the current 149,966 B
  headroom and drops it BELOW the 102,400 B floor. RAISE EXPLICITLY 2,260,000 -> ~2,460,000 B (or
  measured dist + 102,400 B floor margin), KEEPING the 102,400 B headroom floor intact. Both are doc
  budgets, NOT hard test caps (the binding hard caps are assetPerf BUDGET + assetGlbs MAX_FILE_BYTES).
- Playframe L 21/1072 + P 10/180 + B 50/2634 WILL MOVE (the ship is always rendered -> L + B grow by
  the ship tri delta; the I432 autoReset=false cumulative window means B picks up ~2x the ship delta).
  Pre-register conditional re-pin; RE-MEASURE EXACT at ST-407 (I437) and record. causal p1 (DEMO PILOT
  seed 9876) is RENDER-INVARIANT to ship tris -> stays EXACT. rockab 2.2/1.3/0.7 render-invariant ->
  EXACT. PWA 11/11 render-invariant -> EXACT.
- File-size OPTIMIZATION lever (if the file is too big to fit a sane cap): reduce vertex count
  (well-indexed geometry, share verts on flat panels), and if still over budget, NORMAL int8
  quantization (I420 precedent, render-inert under flatShading) - applied ONLY if measured size
  forces it. POSITION + COLOR_0 stay f32 (COLOR_0 MUST be f32 VEC3 per assetGlbs.test.js:115).

## Pre-registered Cut Option
- ST-405 (ship remaster v2) is the MAIN deliverable - NOT cuttable. But it has a pre-registered
  quality gate (CG A/B, grayscale-clay 3/4 + face-on + closeup + in-game tint, old 818-tri vs new):
  if the new ship does NOT read as a clearly MORE detailed + BIGGER + more substantial "airship" at
  gameplay scale (or breaks extent/naming so the renderer must change), ROLL BACK to the 818-tri
  ship (restore the exact b015642 ship.glb) and re-scope (no silent keep, no silent re-pin).
- ST-406 (other-asset realism) is DESIGNATED CUTTABLE: scope to 1 asset (asteroid/other), and cut it
  (docs-only) if the A/B is not clearly improved OR it would push the dist past the re-negotiated
  ceiling with no quality payoff.

## Deferrals (carried, not in E55)
- Per-hit impact SFX (audio epic).
- E49 i18n tail + touch fallback.
- Flyer decay unification (flyer.js:74).
- AGENTS.md five-GLBs doc-drift note (AGENTS.md still says five Blender-made GLBs but there are 24 -
  fix in a bookkeeping pass).
- Any WebGPU migration (explicitly deferred by the ST-401 verdict - KEEP WebGL2 FROZEN).

## Stories (budget I433..I437, gate G55.0 at I437)
- ST-403 (I433) - OPEN E55: scope-check + grounding (YouTube ship/greeble refs) + stories + 6
  bookkeeping docs. DOCS-only.
- ST-404 (I434) - cgs-asset-spec: design/asset-spec-ship-remaster-2.md (the E55 contract: "real
  airship" silhouette, proportions, parts list [bulkier fuselage / twin nacelles / swept wings +
  strakes + winglets / multi-pane canopy / twin tail fins / greebles / antenna], poly budget
  ~2500-4000 tris, facet bake plan, file-size budget + ALL re-pins pre-registered). Reference-grounded.
- ST-405 (I435) - cgs-dev-story + blender-asset-qa: Blender remaster of ship.glb -> the "real
  airship" (~2500-4000 tris). Keep 3 mats + 6 nodes + COLOR_0 exactly hull+wings + extent within the
  ship box. CG A/B SHIP gate (rollback to b015642 818-tri ship). EXPLICIT re-pins (old->new, measured).
- ST-406 (I436) - (CUTTABLE) 1 other-asset realism pass (asteroid/other; scope picks at bake).
  EXPLICIT re-pins.
- ST-407 (I437) - cgs-regression-suite + cgs-gate-check + cgs-milestone-review: fresh R1-R5 + G55.0
  gate + close E55.

## Re-pin plan (pre-registered; NEVER silent)
- Expect ZERO movement: causal p1 (seed 9876 11334/57/W2/combo15/shots198/acc
  0.2878787878787879/36.14999999999923s/replay 2169-2220/speed4/MENU), rockab (2.2/1.3/0.7 reseed
  30201), PWA 11/11 - all render-invariant to ship tris.
- WILL MOVE (re-measure EXACT at ST-407, record): playframe L+B (ship always rendered; the cumulative
  window means B ~2x the delta), SHIP_FACET (bake), BUDGETS.ship, MAX_FILE_BYTES, assetPerf
  totalTris/perFileKB/totalFilesKB/totalGeoKB, and dist ceiling (if headroom < 102,400 B floor).
- The ONLY pins that may re-pin are the ones above; each written EXPLICITLY old -> new at the
  iteration that changes it. No other test pin moves.

## Verification Plan
- ST-403 (this, DOCS-only): npm test 972/972 unchanged; npm run build 0 + dist byte-identical
  138/2,110,034 B; vendor sha 76DEA8151BC9352A; hygiene.
- ST-404: design/asset-spec-ship-remaster-2.md present + internally consistent (silhouette, parts,
  budget, file-size, acceptance).
- ST-405: blender-asset-qa RUN (game profile) + accept documented; CG A/B (grayscale-clay 3/4 +
  face-on + closeup + in-game tint, old vs new) reads clearly MORE detailed + bigger + "airship-like";
  extent within the ship box (span ~2.5, len ~1.9); 3 mats + node names + COLOR_0 exactly hull+wings;
  all re-pins explicit; assetGlbs + assetPerf green.
- ST-406: A/B old vs new reads clearly improved; re-pins explicit; else CUT (docs-only).
- ST-407: fresh R1-R5 (R1 p1 EXACT causal / R2 rockab EXACT / R3 playframe RE-MEASURED EXACT + ship
  A/B view / R4 PWA 11/11 / R5 tests + build 0 + dist within re-negotiated ceiling w/ >= 102,400 B
  floor + vendor sha + hygiene); G55.0 gate; milestone review; close E55.

## Risks
- The remaster could exceed the byte budget more than estimated -> re-pin the caps explicitly
  (pre-registered) OR roll back to 818 tris (CG gate). Never a silent re-pin.
- A rename of a node/material name could break useGLB routing -> keep VR_Ship_* names + mat names;
  the facet test keys off the mesh names.
- Greeble detail could fragment the mesh into many tiny verts that balloon the file -> favor a FEW
  bold structural greebles (nacelles, strakes, winglets, canopy frame) + flat panel insets (cheap
  verts), verify in the in-game tint A/B; if the file balloons, use the vertex-count / int8-normal
  levers (pre-registered).
- Extent drift: a bulkier airship must stay within the ship box (span ~2.5 +/-0.25, len ~1.9
  +/-0.19) so the collision model (radius 0.9) + nozzle/flame alignment stay correct.
- Dist ceiling re-negotiation could be seen as scope creep -> it is a one-time asset investment the
  user explicitly requested; recorded old->new, not silent; still ~2.3-2.5 MB total (trivial for a
  web game).

## Recommendation
SHIP the epic as bounded: (1) Blender ship remaster v2 to a substantial "real airship"
(~2500-4000 tris) = main deliverable; (2) one CUTTABLE other-asset realism pass. Bounded, GPU-trivial
(WebGL2), reference-grounded (greebles + panel insets + silhouette), directly answers the user
directive. No sim/palette/feel/identity risk; renderer untouched (names/colors/extent preserved);
WebGPU NOT switched (frozen).

## Changed files or proposed files
- I433 (ST-403, DOCS-only): production/scope-check-E55.md (new), production/epics.md (append E55
  block), production/stories.md (append ST-403..407), CHANGELOG.md, production/iterations.md (I433
  entry), production/timeline.md, production/session-state/active.md. Zero src, zero assets.
- I434 (ST-404): design/asset-spec-ship-remaster-2.md (new).
