# Scope check - E25: Ship Hero Readability + Skybox/World Value Arc (Blender) (I291)

## Summary
E24 closed at I290 (G24.0 PASS; 835/835; build 0; dist 117 files 1799.8 KB / headroom 248.2 KB). E25 is the next art arc under the user standing art directive, scoped from three evidence-backed inputs: (1) Probe A shows the ship HERO value sits INSIDE the background mid-band (ship maxC/mean nose34 93/70, top 103/87, side 103/79 vs bg-corner 96/85 / 92/81 / 97/89) - the Dota-2 ladder's bg-vs-character + rest-area failure, and the GLB parse proves the wings carry NO COLOR_0 (flat in-code 0x2f5aa8 tint = near-black); (2) Probe B shows the world has no depth: the sky is 96.8% in luma 32-95 (mean 63.15 / max 104.2), there is NO dark floor below the horizon (the skybox lower hemisphere shows through the grid-only arenaFloor) and NO radial floor depth ramp (the rim is as bright or brighter than the center); (3) YouTube grounding at I291 (details + chapters captured; transcripts skipped per the rate-limit guard) supplies the two recipes: Arghanion "BREATHTAKING Nebula" (skybox v7) and "Design Principles Through Dota 2" (hero value ladder + the arena depth cut). PROBE LESSON (new, standing): vr.camera is STANDALONE (parent null, NOT in the scene graph) - the scene root is vr.stars.parent; vr.skybox is a state object {ready,url} (the sky is the scene.background equirect texture); vr.arenaFloor is the 'arenaFloorGrid' LineSegments (no solid plane).

## Evidence (verified at I291)
- Tree CLEAN at 95f3587 (I290 closeout); npm test 835/835; npm run build exit 0; dist 117 files / 1799.8 KB raw (headroom 248.2 KB = 31x the 8 KB floor).
- Probe A (.evidence/I291/01-04; fx off; 2000x1125 PR 1.25; MENU; 12 calls / 198 tris): ship maxC/mean nose34 93/70, top 103/87, side 103/79 vs bg-corner maxC/mean 96/85, 92/81, 97/89 -> hero value INSIDE the bg mid-band (top-down = a dark arrow over a purple nebula; wings near-black). The 04 top-down-black variant failed as intended (hiding lights via traverse hid the scene lights) - the 01-03 shots are the valid A/B baseline.
- GLB parse (.evidence/I291/glbparse.cjs; ship.glb 11980 B, Blender 5.2.41): 6 nodes - Cockpit 33v/16t, Engine 9v/8t, Fin 24v/12t, Hull 81v/40t (the ONLY COLOR_0 carrier, componentType 5126 FLOAT), Nozzle 24v/12t, Wings 48v/24t (NO COLOR_0 - flat in-code 0x2f5aa8 tint = near-black). Forward +Z (hull z -0.70..+0.82), X +-1.22, fin Y 0.44. In-code tints authoritative: hull 0x8fd8ff, wing 0x2f5aa8, cockpit emissive 0x59d8ff, flame 0xff9a3d. (componentType 5126 is the FLOAT convention - GLTFLoader maps 5126 -> float32; NOT a value count.)
- Probe B (.evidence/I291/05-06 + probes.json; fx off; fov 60 / PR 1.0 / 1280x720; kept lights + arenaFloorGrid only; scene root = vr.stars.parent). Shot 1 horizon (0,1.2,6)->(0,0.5,-40): 2 calls / 12 tris; analytic horizon row 349; sky rows 0..348: mean 63.15 / max 104.2 / hist8 [28028,172619,244751,1322,0,0,0,0] (96.8% in luma 32-95) / warm-cast (R-B>4) 11.8%; below-horizon: mean 63.73 / max 103.6 = NO dark floor (skybox lower hemisphere shows through; arenaFloor is grid LINES only). Shot 2 floor overhead (0,20,0.01)->(0,0,0): 7 calls / 86 tris; px/wu 31.2; radial band means 52.92 / 48.52 / 61.15 / 73.19 / 73.69 (0-2 / 2-4 / 4-6 / 6-8 / 8-11.5 wu) = NO radial depth ramp (rim as bright or brighter than center - the rest-area failure); overall mean 66.77 / max 255 (grid-line peaks only; 5 px in the top hist band).
- PROBE LESSON (new, standing - caused 2 failed attempts this session): vr.camera is STANDALONE (parent null, NOT in the scene graph) -> climbing from it finds no scene (attempt v1 returned the untouched MENU baseline 20 calls / 318 tris = the did-nothing canary). vr.skybox is a STATE object {ready,url} - the sky is the scene.background equirect texture (hasBg true, cannot hide per-object). vr.arenaFloor = 'arenaFloorGrid' LineSegments (NO solid plane). vr.arenaRing = wrapper {useGLB,mesh,tickMesh,group,geo}. Scene root = vr.stars.parent (stars = Group 'starfield').
- YouTube grounding (I291 prior session; details + chapters captured; transcripts skipped per the rate-limit guard - E21/I276 precedent): (1) Arghanion "BREATHTAKING Nebula" Blender 45:37 (19K): 7:17 material / 9:25 colors / 11:44 noise density / 15:00 structure / 29:20 density+color iteration / 37:43 SEPARATE BACKGROUND-STAR LAYER / 40:30 equirect render / 41:00 skybox use -> ST-276 recipe. (2) "Design Principles Through Dota 2" 15:06 (5.6K): 0:35 silhouette / 1:21 value gradient / 2:33 value pattern / 3:50 color+sat / 7:50 color key / 8:39 rest areas / 9:49 bg-vs-character / 10:21 directionality / 13:55 in-game readability / 14:26 hero traits -> ST-275 ladder + ST-277 cut. (3) BurgZerg "Asteroids - Unity 3D" W3 (16K, 2016): genre confirm only.

## Scope Fit
- The arc is pure presentation (value bakes + palette + one in-code depth ramp) - no sim, no state machine, no persistence, no new systems. Every story re-verifies the frozen probes (FLOOR-50 variant B, MENU 20/318, bloom band 183.6, demo pin) so the art changes cannot leak into gameplay.
- Blender is the asset tool (user standing directive) and is already proven in this codebase: the I282 enemy / I288 emblem / I289 warden bakes are the exact recipe (v = clamp(1.0 + 0.42*nZ, 0.30, 1.25), corner-domain FLOAT_COLOR, ShaderNodeAttribute -> Base Color so the glTF exporter emits COLOR_0; glTF re-parse verify after every export).
- Budget: worst case ~+10 KB (wings COLOR_0 48v x 12 B ~0.6 KB + hull re-bake delta + skybox v7 delta vs v6 55855 B) against 248.2 KB headroom (31x the 8 KB floor).
- 4 stories / 4 iterations (I292-I295); ST-277 is designated CUTTABLE so the arc can close at 3 if the arena depth pass proves risky against the FLOOR-50 frozen annulus.

## Cut Option
ST-277 (arena/world depth pass) is DESIGNATED CUTTABLE: if the radial floor ramp cannot ship without moving the FLOOR-50 frozen annulus (rIn 44 / rOut 160 px = 0.85-3.08 wu at 51.96 px/wu; floor maxC 102 @ (612,214); delta 128) or the MENU 20/318 draw baseline without a documented spec delta, the arc closes at ST-275 + ST-276 + ST-278 (3/4) and the depth pass returns to the task list.

## Deferral
- HP #5 human perception session (task-list carryover) stays deferred - it needs a human in the loop; not an E25 blocker.
- Touch-friendly fallback input (platform note) unchanged; not an E25 blocker.

## Recommendation
APPROVED - open E25 at I291 docs-only (the E24-at-I286 pattern). Stories:
- ST-275 (I292): ship hero readability pass - Blender 5.2: Wings COLOR_0 NEW bake (48v/24t) + Hull re-bake with wider range (recipe v = clamp(1.0 + 0.42*nZ, 0.30, 1.25) or a documented wider variant, corner-domain FLOAT_COLOR, ShaderNodeAttribute -> Base Color); in-code palette tweaks in src/core/config.js only if the A/B demands (wing tint family kept); vertexColors wiring in shipMesh.js if absent; SHIP_FACET p10/p50/p90 pins (spread >= 0.35); MATCHED A/B vs .evidence/I291/01-03 (target: ship peak >= ~120 or mean >= ~95 vs bg-corner mean 81-89 / max 92-97); no new >233 sRGB-eq no-bloom px; FLOOR-50 variant B + MENU 20/318 re-verify; demo pin EXACT.
- ST-276 (I293): skybox v7 re-bake - Arghanion recipe (structure noise before color, density+color iteration, separate background-star layer, equirect render); 1024x512 JPG <= ~64 KB (v6 = 55855 B); warm-cast raw < ~2% (v6 = 1.78%); violet/teal/magenta family; env canary vs Probe B (sky mean 63.15 / max 104.2 / hist8) with documented delta; FLOOR-50 + MENU re-verify.
- ST-277 (I294, CUTTABLE): arena/world depth pass - radial floor ramp brighter center -> darker rim (rest areas per the Dota-2 ladder), in-code 0 KB; HARD CONSTRAINT: must not move the FLOOR-50 frozen annulus or the MENU 20/318 baseline without a documented spec delta.
- ST-278 (I295): E25 regression + G25.0 gate + closeout - full 10-probe suite (I275/I280/I285 template) + FLOOR-50 FROZEN re-verify + bloom band 183.6 A/B vs wt-i278 @:5174 + dist headroom canary + log audit 1..295.

## Risks
- R-E25-1 (med): the ship bake crosses the no-bloom band ~233 sRGB-eq -> wing tint 0x2f5aa8 x 1.25 = maxC ~210 < 233 by estimate; A/B fx-off at ST-275 + bloom-band re-check at ST-278 (documented spec delta if it crosses).
- R-E25-2 (low): first COLOR_0 bake on the Wings node -> recipe proven x3 (I282 / I288 / I289); glTF re-parse verify after every export (componentType 5126 convention; NEVER export_materials NONE for color-bearing GLBs).
- R-E25-3 (med): the skybox re-bake shifts the world value band and breaks the rest area the ship now sits against -> env canary vs the Probe B numbers + FLOOR-50 + MENU re-verify at ST-276.
- R-E25-4 (med): the radial ramp moves the FLOOR-50 frozen annulus -> hard constraint; ST-277 is the designated cut if it cannot ship clean.
- R-E25-5 (low): GLB byte bloat -> worst case ~+10 KB against 248.2 KB headroom (31x the floor); per-GLB byte pins updated with evidence.

## Changed files or proposed files
- I291 (docs-only): this file (new), production/epics.md (+E25), production/stories.md (+E25 section ST-275..278), production/iterations.md (+I291), CHANGELOG.md (+I291), production/session-state/active.md (header).
- I292 ST-275: assets/ship.glb (Wings COLOR_0 NEW + Hull re-bake), src/render/shipMesh.js (vertexColors on wings if absent), src/core/config.js (palette tweaks if needed), tests/assetGlbs.test.js (SHIP_FACET pins), docs. (assetPerf COLOR_0 whitelist already includes ship.glb - no whitelist change.)
- I293 ST-276: assets/skybox v7 JPG (replaces v6 55855 B, same filename convention), docs.
- I294 ST-277: src/render (arena floor ramp, in-code), docs.
- I295 ST-278: docs only + .evidence/I295/.

## Gate G25.0
- Full 10-probe suite (I275/I280/I285 template) ALL PASS on the closeout tree: demo pin EXACT real-UI (11334/57/W2/combo 15/0:36/57-198/29% / replayView idx 2169/2220; localStorage scoreboard keys EMPTY per ST-190); 11/11 legal state edges + illegal PLAYING->MENU rejected; persistence bytes EXACT; FX-off zero-leak via the real F-hotkey; pool caps EXACT; 0-NaN pilots x2; FLOOR-50 FROZEN method variant B 230/102/128 (or the documented ST-277 spec delta); MENU fx-off 20/318 (or documented spec delta); build exit 0 with headroom >= 8 KB; dist/vendor byte-identical to source vendor/; log audit 1..295.
- Bloom band 183.6 A/B (wt-i278 @:5174 vs dev :5173, fx HIGH): DIFF invariant - no new crosser (or documented spec delta).
- Browser smoke: console 0/0, no NaN on every probe.

## Unverified assumptions (labeled separately from evidence)
- A1: the wing tint 0x2f5aa8 x 1.25 top-facet stays under the ~233 no-bloom band (maxC ~210 estimate) - verify at the ST-275 A/B (fx off) + ST-278 bloom band.
- A2: the 1024x512 skybox re-bake can hold warm-cast raw < ~2% at <= ~64 KB JPG - v6 proves 1.78% / 55855 B is achievable; the Arghanion recipe (structure noise first, separate star layer, density+color iteration) is the path.
- A3: the floor depth ramp can be built rim-darken-only (>= 4 wu, band means 73.2/73.7) OUTSIDE the frozen annulus (0.85-3.08 wu) without brightening the annulus bands (52.9/48.5) - if the ladder demands a brighter center too, the ramp overlaps the annulus and ST-277 is cut (designated cuttable).
- A4: the Dota-2 bg-vs-character fix (ship value key above the bg mid-band) is reachable with value bakes + palette alone (no new lighting rig) - verify at the ST-275 A/B (target ship peak >= ~120 or mean >= ~95 vs bg-corner mean 81-89 / max 92-97).

## Verification evidence
- .evidence/I291/: 01-04 ship probe PNGs, 05-06 sky/floor probe PNGs, probes.json (Probe B numbers), glbparse.cjs (GLB parser), write_probesB.cjs (probe script).
- GLB parse: ship.glb 11980 B; 6 nodes; Hull-only COLOR_0 (componentType 5126); Wings NO COLOR_0; tris 16/8/12/40/12/24; hull z -0.70..+0.82; X +-1.22; fin Y 0.44.
- All numbers measured at I291 on the CLEAN tree 95f3587; servers :5173 dev / :5174 wt-i278 / :4173 preview all 200.

## Next owner or decision
I292 = ST-275 ship hero readability pass (cgs-dev-story; Blender 5.2 MCP - re-read the blender-core skill first; bake recipe per R-E25-2; glTF re-parse verify after every export; MATCHED browser A/B vs .evidence/I291/01-03). No human decision required.
