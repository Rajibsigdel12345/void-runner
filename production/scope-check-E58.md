# Scope Check - E58: Hero Ship v4 "Real Airship" Density + Presence Pass (I453)

- Epic: E58 (opened I453, after E57 closed at I452)
- Objective (user directive, verbatim): "think about improving the main character currently its small looking airship, put in more detailing, increase the polygon count and make it a real airship, go through the guides and reference samples to build them, like wise for the other assets make them more realistic use the polygons and gpu resource as much as needed you can switch is to the webgpu from webgl if you are on webgl to make them possible"
- Skills: cgs-scope-check (primary), cgs-create-stories (next), youtube-research (grounding); Blender 5.2 headless for the build (ST-424/ST-426).

## Grounding (measured this iteration, 2026-11-16 - evidence, not assumption)

Ship v3 (assets/ship.glb, I440 remaster) measured from the GLB itself:
- File 270,556 B / 12,400 tris total (~21.8 B/tri with the current corner layout).
- Parts: VR_Ship_Hull 4,208 t (span 0.71 x 0.55 x 1.60 u) | VR_Ship_Wings 2,100 t (2.51 u span) | VR_Ship_Engine 3,012 t (0.94 u) | VR_Ship_Fin 1,480 t | VR_Ship_Nozzle 744 t | VR_Ship_Cockpit 856 t.
- Overall silhouette: ~2.5 u wingspan x 1.6 u hull length x ~0.6 u tall.

World context (measured):
- CONFIG.ship.radius = 0.9 (collision); maxSpeed 14; accel 26 (src/core/config.js).
- Arena radius r = 26. Rock L span ~4.1 u (1,980 t / 48,740 B). Boss ~4.2-7.7 u. Hunter enemy 3.04 u (1,432 t).
- FINDING (root cause of "small-looking"): the player ship (2.5 u wingspan) is SMALLER than a single large rock and smaller than the hunter enemy. The hero is out-scaled by the scenery - this is the primary perception problem, before density.

Budget state (tests/assetPerf.test.js, measured at I451):
- totalFilesKB 1024 [901.79] -> 122 KB headroom
- totalGeoKB 896 [859.11] -> 37 KB headroom
- perFileKB 400 [max 264.21 = ship.glb]
- totalTris 26,000 [22,856] -> 3,144 tri headroom
- perFileMats 3 [max 3 = ship body/wing/cockpit]
- dist ceiling 3,000,000 B [2,756,054 B / 147 files] -> 243,946 B headroom
- Causal pin (seed 9876): 11334/57/W2/combo 15/198 shots/acc 0.2878787878787879/36.14999999999923 s (I452 fresh).
- Playframe pins: A 21/12,654 + 10/180; B 50/27,654 (both include ship tris - WILL change when ship tris change).
- Palette FROZEN (tests/paletteHarmony.test.js): body 0xab9374 (met 0.15 / rough 0.4 / emissive 0xffb347@0.12), wing 0x54402e (met 0.3 / rough 0.55), cockpit 0x0b1830 emissive 0x59d8ff@1.4.

Renderer constraints (src/render/shipMesh.js useGLB, I104):
- The GLB is added at native size (Blender meters = world units). NO rescale in code - size is authored in Blender.
- Materials are assigned by MATERIAL NAME: 'Cockpit' -> cockpitMat, 'Wing' -> wingMat (wing + fin), everything else -> bodyMat (reads COLOR_0). v4 MUST keep the same 6 mesh/material name families (VR_Ship_Hull/Wings/Fin/Engine/Nozzle/Cockpit) for zero src change.
- WebGL2 frozen decision holds: ~33k total tris is trivial for any GPU; the documented flip criteria (design/webgpu-feasibility.md F1/F2/F3: 100k+ live objects, compute needs, HDR pipeline needs) are NOT met. RECOMMENDATION: do NOT switch to WebGPU; document the re-confirmation at E58 close.

## Research grounding (YouTube; labels UNVERIFIED-BY-PLAY = not yet validated in-engine)

Sources (youtube_search 2026-11-16, "blender airship 3d model tutorial" / "steampunk airship zeppelin details" / "airship game ship design"):
- ThibaultBlender "MODELING A BLIMP IN BLENDER" (2025-08, youtu.be/Eb7IXZuwim8): deck + barrier + chimney + railings as the read-at-distance details; explicit note "I won't detail small things like windows - I take pictures from far away where you can't see small details. The BIG details are what matter" -> detail budget goes to silhouette-scale features, not micro rivets.
- Art MZ "Steampunk Airship 3D modeling Pt.1" (12K views): low-poly airship part decomposition workflow (envelope-first).
- Lili Design "How to make a steampunk airship from scratch" (10K views): zeppelin anatomy reference (envelope, gondola, fins, struts, deck superstructure).
- Spacedock "Design Principles in Sci-Fi Spaceships" (117K views): silhouette-first ship design principles (readable at distance, mass centering).
Derived part ladder (what makes an airship read as a "real airship" at 2.5-4 u on screen) - UNVERIFIED-BY-PLAY until the in-engine A/B:
1. Envelope (cigar body) with longitudinal gore ribs - the #1 zeppelin identifier.
2. Gondola under the envelope center - the #2 identifier (currently the ship has a cockpit pod but no gondola car).
3. Tail fin cluster (vertical + horizontal stabilizers on the stern of the ENVELOPE, not the gondola).
4. Struts/wires connecting gondola to envelope - the #3 identifier (cheap tris, huge realism payoff).
5. Engine nacelles with visible propellers.
6. Bow anchor cone + keel fin (under-envelope).
7. Deck superstructure (small upper deck / chimney block) - only if tris remain.

## Scope fit

- Fits the project stage (post-E57; art is the user's explicit top-priority next pass). The pass is asset-heavy + one small core knob (ship radius), NOT a new system: no new state, no new render system, no new input. useGLB is unchanged.
- Budget: the current headroom is NOT enough for a density pass (ship alone +7.6k tris vs 3,144 headroom). Re-pins required, with the measured-at-build justification clause (I451 precedent: re-pins land with measured numbers, floor kept >= 102,400 B dist headroom).
- Estimated v4 ship: <= 19,000 tris, <= 430 KB file (~22.6 B/tri at the current layout). Rocks/boss pass: +~2,450 tris total. Projected totals: tris ~32,900 (cap -> 34,000), files ~1,067 KB (cap -> 1,152), geo ~1,028 KB (cap -> 1,088), dist ~2.92 MB (ceiling 3,000,000 HOLDS if ship <= 430 KB; re-pin to 3,100,000 only if measured over).
- RE-PIN CLAUSES (only if measured values land as estimated; each lands with the measurement in the iteration entry):
  1. assetPerf perFileKB 400 -> 512
  2. assetPerf totalFilesKB 1024 -> 1152
  3. assetPerf totalGeoKB 896 -> 1,088
  4. assetPerf totalTris 26,000 -> 34,000
  5. dist ceiling 3,000,000 -> hold (expected 2.92 MB); re-pin to 3,100,000 only if measured > 3,000,000 B (floor 102,400 B headroom must hold either way)
- Causal impact: IF the ship collision radius changes, the causal pin (11334/57/...) changes and must be re-pinned with a measured re-run (precedent: every radius/geometry change re-pins). IF the radius stays 0.9, causality is bit-identical.

## Stories (owner-sized, dependent order)

- ST-423 (I453): THIS scope-check + design/ship-v4-spec.md (parts list, per-part tri budgets, scale spec, material/name contract, palette reuse, A/B plan). Docs only. [THIS ITERATION]
- ST-424 (I454): Blender ship v4 (cgs-dev-story + blender-hardsurface-modeling + blender-asset-qa + blender-export). Replace assets/ship.glb: envelope + gores + gondola + struts + fin cluster + nacelles/props + bow anchor + keel + upper deck; ~1.55x authored scale (envelope ~2.6 u long, wingspan ~4.0 u); <= 19,000 tris; <= 430 KB; same 6 VR_Ship_* name families; vertex-color body/wing bakes within the frozen palette luminance bands; cockpit stays the emissive identity. A/B render probe (v3 vs v4, chase framing) + asset-qa gate. Zero src.
- ST-425 (I455): Presence pass (small src). Ship radius decision from {0.9 (no change), 1.0, 1.05}: threadability gate - spiral gap 4.2 u must stay >= 1.8x the effective obstacle (config.js spiralEvery comment: currently 1.9x at 2.24 u); spawnMinPlayerDist re-check; causal re-pin if radius moved; playframe A/B pins RE-MEASURED + re-pinned (ship tris changed in ST-424 - these pins are stale after ST-424 by definition); optional CHASE camera tighten (camBack 13 -> 11, camHeight 9 -> 8) ONLY if the 1.55x scale alone still reads small at the measured NDC; cameraModel test re-pin if touched.
- ST-426 (I456): "other assets more realistic" pass (Blender, geometry-only, ZERO gpu cost): asteroid L/M/S + B-variants with baked bumps + craters (low-frequency displacement IN THE MESH - the user's "asteroids or comets with bumps and craters" ask; per the user's own constraint "only if its gpu and compute heavy" - mesh displacement is the non-heavy route), rock L 1,980 -> ~3,000 t, M 500 -> ~900 t, S 134 -> ~350 t; boss Monolith 650 -> ~1,200 t (facet detail). Same file names, COLOR_0 bakes preserved. Zero src (renderer reads the GLBs).
- ST-427 (I457): E58 regression + G58.0 gate + close (cgs-regression-suite + cgs-gate-check + cgs-milestone-review): fresh R1-R5 (R1+R2 causal at the ST-425 re-pin or ZERO drift if radius untouched; R3 playframe at re-pins + camera 3x3 + ship A/B views; R4 PWA 11/11; R5 1027/1027 + build 0 + dist vs (re-)pins + vendor sha + hygiene). WebGPU re-confirmation line in the gate (F1/F2/F3 still unmet -> KEEP WebGL2 documented). AGENTS.md roster line unchanged (still 7 GLBs; files only replaced in place).
- ST-427 (I457): DONE - fresh R1-R5 + G58.0 gate, probe-only, zero src: causal457 EXACT 18/18 (zero core drift), playframe457 (A 21/14,530 + 10/180 EXACT, B 50/32,826), camera 3x3 + RM gate PASS (maxConv 3.61e-5, OVERVIEW worstRim 0.8362 x3), ship views SHIP_OK (S1 16 calls/22,136 tris), PWA 11/11, 1027/1027 + build 0 + dist byte-identical 2,873,338 B / 147 + vendor PIN_OK + hygiene. WebGPU re-confirmation: F1 (sustained >~200k tris - measured 28,779 total / 32,826 worst window), F2 (vendor r171+ - frozen r160), F3 (user mandate - none) all UNMET -> KEEP WebGL2 documented. G58.0 PASS; E58 CLOSED at I457 (5/5).

## Cut options (if the build overruns)

- Cut 1: drop the upper deck / chimney block (saves ~600-900 tris) - lowest realism payoff of the ladder.
- Cut 2: propellers as static 2-blade discs instead of 3-blade (saves ~400 tris).
- Cut 3: boss detail pass deferred to E59 (keep rocks only in ST-426).
- Cut 4 (last resort): ship v4 at ~15,000 tris (drop gores to 4 bands of 8 instead of 10) - the envelope still reads.

## Deferrals (explicit, to E59+ queue)

- Enemy fleet density pass (hunter/gunship +25% detail) - fresh assets from I451, not user-named.
- Camera feel refinement + 3-mode documentation (E57 queue item a) - orthogonal, do after presence lands.
- New-enemy ladder slot (luma/hue budget has room) - E59+.
- Campaign polish/UX - E59+.
- Art-research task list expansion (YouTube-grounded) - E59+ if the user wants a standing research cadence.

## Risks

- R1 (high): GLB file growth lands above the 430 KB estimate (per-face corner bakes de-indexed the I451 enemy hulls hard - the ship v3 layout is denser at ~21.8 B/tri, but a v4 with more COLOR_0 corner data could regress toward ~28 B/tri). Mitigation: measure after each export; Cut 1/4 ready; re-pin clauses pre-agreed above.
- R2 (high): ship radius change invalidates the causal pin + the spiral threadability margin (1.9x -> as low as 1.72x at radius 1.1). Mitigation: radius chosen ONLY from {0.9, 1.0, 1.05} with the >= 1.8x threadability gate; re-pin with a measured causal run (house flow).
- R3 (medium): silhouette identity break - v4 must keep the hull + wing + fin family (the player's muscle memory of the current ship) while ADDING the airship identifiers; A/B render gate at ST-424 (v3 vs v4 side by side in chase framing) catches identity drift.
- R4 (medium): playframe A/B pins go stale after ST-424 by construction (ship tris change) - ST-425 re-measures + re-pins them; any iteration between ST-424 and ST-425 must NOT cite the old pins as fresh.
- R5 (low): palette freeze vs new parts - all v4 parts must map into the 3 frozen materials by name; new detail comes from geometry + vertex-color bakes, never new hexes (paletteHarmony.test.js stays untouched).
- R6 (low): WebGL2 vs WebGPU - re-confirmed NOT needed at ~33k tris; switching adds a second render path to maintain for zero measured gain (F1/F2/F3 unmet).

## Recommendation

Proceed. E58 as scoped: 5 stories, ~4 build iterations + 1 gate. The "small-looking" complaint is primarily a SCALE problem (measured: ship < one large rock) that ST-424's 1.55x authored scale fixes before any density is even visible; the density pass then makes the bigger ship look like a real airship instead of a bigger airship. Budget re-pins are pre-agreed with the measured-justification clause.

## Verification evidence (this iteration)

- All grounding numbers measured directly (GLB parse of ship.glb/asteroid_L.glb/boss.glb/enemy_hunter.glb; config.js lines 84-96; tests/assetPerf.test.js BUDGET block; shipMesh.js useGLB lines 148-165; I452 fresh R1-R5 in git ab9433d).
- YouTube grounding: 4 queries / 30 results, transcripts of 3 modeling videos (labels above: UNVERIFIED-BY-PLAY).

## Next owner / decision

I454 = ST-424 (Blender ship v4) via cgs-dev-story + blender-hardsurface-modeling + blender-asset-qa + blender-export. Decision needed at ST-424: none - the spec is frozen in design/ship-v4-spec.md; any deviation goes back to this doc.
- ST-423 (I453): DONE at I453 - scope-check landed (this doc) + design/ship-v4-spec.md (frozen ST-424 contract: 1.55x scale, 6 VR_Ship_* names + 3 materials, part budgets, COLOR_0 exactly Hull+Wings, nacelle mouth z=-0.88, ab454 A/B plan, re-pin clauses). 1027/1027 + build 0 + dist byte-identical + vendor PIN_OK + hygiene. (details: iterations.md I453 + epics.md E58)

- ST-424 (I454): DONE at I454 - ship v4 SHIPPED (14,276 tris, 347,184 B, 1.55x authored scale: span 4.0u / height 0.9u / len 2.74u; 6 VR_Ship_* + 3 material names EXACT; COLOR_0 exactly Hull+Wings per-vertex re-bake, count == POSITION count, luma 0.30..1.55; nacelle mouth z=-0.94 vs the in-code flame apex z=-0.80 - 0.14u clearance; ab454 A/B PASS coverage ratio 50.9 UNVERIFIED-BY-PLAY; causal454 EXACT zero core drift; playframe re-measured A 21/14,530 + 10/180, B 50/31,406 - re-pin ST-425; 9 spec deviations logged in design/ship-v4-spec.md I454 notes). (details: iterations.md I454 + epics.md E58)
- ST-425 (I455): DONE at I455 - presence pass, zero src: radius KEEP 0.9 (gate re-computed at current config: 1.875x >= 1.8; 1.0 -> 1.795x + 1.05 -> 1.757x fail), spawnMin KEEP 8, CHASE tighten SKIPPED (probe455 measured ndcW 0.1703 / ndcH 0.2639 - 1.55x reads present; reversible 2-line fallback documented), playframe re-pinned 21/14,530 + 10/180 / 50/31,406, causal455 EXACT (no re-pin needed). (details: iterations.md I455 + epics.md E58)
- ST-426 (I456): DONE at I456 - other-assets realism pass (assets + tests, zero src): v11 rocks L 3,000t / M 900 / S 350 + B-variants (same topology + radii; MESH-displacement bumps + craters, headless Blender 5.2; COLOR_0 band [0.097..1.185], warm R>=G>=B, count == POSITION) + boss remaster 1,425t / 43,656 B (target ~1,200 / cap 1,500 MINOR DEVIATION; h 9.60 EXACT, w 4.2202; corner-domain COLOR_0 bloat fixed by the per-vertex POINT-domain bake, was 77,068 B). RE-PIN CLAUSES actuals: clause 1 (perFileKB 512) NOT NEEDED - holds at 400 (max file 339.05 KB = ship); clause 2 (totalFilesKB 1,152) NOT NEEDED - holds at 1,024 (1,016.33 KB); clause 3 (totalGeoKB 1,088) NOT NEEDED - holds at 976 (973.17 KB); clause 4 (totalTris 34,000) PARTIAL - lands at 30,000 (measured 28,779: rock delta +4,047 vs the +2,450 estimate, but the ship landed 14,276 vs up to 19,000, total under the ~32,900 projection; headroom 1,221); clause 5 (dist 3,000,000) HOLDS (2,873,338 B; headroom 126,662 B >= 102,400 floor). Causal: radius stays 0.9 -> bit-identical (causal456 EXACT 18/18). Playframe: A UNCHANGED (MENU draws no rocks), B 50/31,406 -> 50/32,826 (visible-rock tri delta, deterministic, re-pinned probe-only). (details: iterations.md I456 + epics.md E58)
