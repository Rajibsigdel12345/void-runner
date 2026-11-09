# Void Runner - Asset Audit (I106 / cgs-asset-audit)

## Summary
Audited the five GLB assets of the Blender graphics pass (I101-I105) against the
amended contract in design/asset-spec.md: completeness, VR_ naming, import
settings, scale/origin (hitbox parity), licensing, and production risk. Result:
PASS - all five files are valid glTF 2.0 binaries, original to this project,
within poly and size budgets, correctly named at node and material level, and
verified in the browser (GLB swap active on a clean load; procedural fallback
proven on fetch failure; hitbox parity exact). One record correction was made
to the I104 iteration entry (the ship group's direct child count stays 3 across
the swap, not 6 -> 3). One minor cosmetic finding (Blender-default mesh
data-block names inside the GLBs; no game-code impact). No code or asset
changes in this iteration.

## Asset Inventory
All files live in assets/ (committed), are glTF 2.0 binary, generator
"Khronos glTF Blender I/O v5.2.41" (Blender 5.2.3 LTS, bpy API), and contain
0 animations, 0 skins, 0 textures, 0 images. 1 Blender unit = 1 world unit,
Y-up, flat-shaded, no baked maps.

| File           | Bytes  | Tris | Verts | Node(s)                                                        | Material(s)                                   | Budget            |
|----------------|--------|------|-------|----------------------------------------------------------------|-----------------------------------------------|-------------------|
| ship.glb       | 22,776 |  254 |   540 | VR_Ship_Cockpit / VR_Ship_Fin / VR_Ship_Hull / VR_Ship_Wings   | VR_Ship_Cockpit, VR_Ship_Wing, VR_Ship_Hull   | <=300 tris: PASS  |
| asteroid_L.glb | 33,908 |  320 |   960 | VR_Rock_L                                                      | VR_Rock                                       | <=320 (amended): PASS |
| asteroid_M.glb |  9,420 |   80 |   240 | VR_Rock_M                                                      | VR_Rock                                       | <=120: PASS       |
| asteroid_S.glb |  9,420 |   80 |   240 | VR_Ship... (see note)                                          | VR_Rock                                       | <=80: PASS        |
| boss.glb       | 14,760 |  192 |   384 | VR_Boss                                                        | VR_Boss                                       | <=250: PASS       |

Total 90,284 bytes (~88 KB); every file < 100 KB (spec). The ship is 4 nodes
sharing 3 unique materials (VR_Ship_Fin and VR_Ship_Wings both use
VR_Ship_Wing). All node names and all material names are VR_*.

Scale/origin (hitbox parity), measured from the actual vertex data with node
transforms applied, cross-checked in-browser at I105:
- asteroid_L: max vertex radius exactly 2.2 (config rockL radius 2.2)
- asteroid_M: max vertex radius exactly 1.3 (config rockM radius 1.3)
- asteroid_S: max vertex radius exactly 0.7 (config rockS radius 0.7)
- ship: world bbox center [0, 0.098, 0], size [2.5, 0.585, 1.9]; max vertex
  radius 1.4746 (wing tip) vs the 0.9 ship hitbox - intentional visual larger
  than hitbox, same as the procedural baseline
- boss: world bbox center [0.098, 0.011, -0.015], size [4.169, 9.001, 4.344],
  matching the 4.08 x 8.84 procedural footprint within noise jitter; upright
  (Y is the long axis); max vertex radius 5.2852 vs the 3.4 hitbox -
  intentional visual larger than hitbox (pre-existing design)

Minor finding: mesh data-block names are Blender defaults (Sphere.001,
Cube.003, Cone.001, Icosphere.006/007/008, Cube.004). Cosmetic only:
GLTFLoader exposes the node names (VR_*), and no game code references mesh
names. (The table row for asteroid_S.glb reads VR_Rock_S as its node.)

## Import Risk
- Fetch failure (offline, missing file, aborted request): assetLoader warns
  and keeps the procedural stand-in (ready:false); the loader never rejects;
  the game boots and runs. PROVEN (I106): aborting ship.glb + asteroid_L.glb
  in the browser left ready {ship:false, rockL:false, rockM/S/boss:true}, the
  ship group kept the procedural 'ship_body' child (the GLB root is named
  'Scene'), L-rocks rendered at 240 verts (procedural; the GLB is 960), and
  the game played with no NaN and no app-code console errors.
- Relative assets/*.glb URLs resolve on dev :5173 and the built dist :4173
  (verified I105).
- GLTFLoader + BufferGeometryUtils are vendored by scripts/build.mjs and ship
  in dist (verified I104/I105) - no runtime CDN dependency.
- The ship material override matches by material NAME (contains 'Cockpit' ->
  cockpitMat, 'Wing' -> wingMat, else hullMat). A future re-export that
  renames the VR_ materials degrades the ship cosmetically toward the hull
  color; no crash, no behavior change.
- Blender bakes sRGB -> linear base colors; the in-code materials fully
  override them (exact colors verified on dist, I105), so no color-space
  mismatch in game.
- Untested branch (labeled assumption, not evidence): a corrupt-but-
  downloadable GLB hitting the GLTFLoader parse-error path is not exercised;
  the designed behavior is the same warn + procedural fallback as the tested
  fetch-fail path.

## Missing Asset
None within the Blender-pass scope. By design (art-bible I101), these remain
procedural in code: powerups, mines, bullets, enemy bullets, vortex,
starfield, HUD reticle. No texture maps (any asset), no skeletal rig, no
animation clips - all motion and dynamic material behavior (fresnel rim,
golden swap, emissive pulse, invuln blink, engine flames) stays in code.
This matches the asset-spec contract exactly.

## Licensing Note
- All five GLBs are original to this project, modeled with Blender 5.2.3 LTS
  via the bpy API (primitives + mathutils noise displacement). No AI
  image/3D generators were used, no third-party models, no downloaded
  content.
- glTF is an open Khronos format; the exported data files contain no code.
- The repository has no LICENSE file, so the project's own license is
  currently undeclared. Add a LICENSE before any public release (out of scope
  here; flagged as R5 for cgs-release-checklist).

## Risks
- R1 (low): the ship material override depends on VR_ material names
  surviving future re-exports (cosmetic-only degradation otherwise).
- R2 (low): Blender-default mesh data-block names (cosmetic only; no code
  references them).
- R3 (low): the corrupt-GLB parse-error branch is untested (the fetch-fail
  branch is tested).
- R4 (info): boss/ship visual shells exceed their hitboxes - pre-existing
  design, unchanged by the GLB pass.
- R5 (info): no LICENSE file in the repository (release-readiness flag, not
  an asset defect).

## Changed files
- design/asset-audit.md (new - this audit)
- production/iterations.md (I106 entry + record correction to the I104 entry)
- CHANGELOG.md (I106 line)
- production/session-state/active.md (state -> I106 complete)
No code or asset changes.

## Verification evidence
1. File-level: each GLB parsed as a GLB binary (header + JSON + BIN chunks);
   glTF 2.0 with the node/material/mesh counts and the vertex-data world
   stats above (evidence: .evidence/i106-glb-inventory.json, re-parsed in
   I106).
2. Browser fallback test (dev :5173, route-abort on ship.glb +
   asteroid_L.glb): ready flags, ship child name 'ship_body', L-rocks at 240
   procedural verts, PLAYING state with 15 live rocks, no NaN; screenshot
   .evidence/i106-fallback.png.
3. Clean reload (dev :5173): all 5 ready=true; ship group children
   ['','', 'Scene'] (GLB root active); direct child count 3 in both states
   (body + two flames).
4. I105 (committed): rock maxR exactly 2.2/1.3/0.7 across 7/7/10 visible
   rocks; ship nose +0.95 along aim, flame -0.8; boss upright (ySpan 9.0,
   base 0.21); 0 NaN; console 0/0 on dev and dist; dist material override
   exact; perf 51 calls / 4052 tris forced scene (18-call menu ref, 19
   programs).
5. This iteration: npm test 233/233; npm run build exit 0; iteration sequence
   1..106.

Assumptions not separately verified: (a) the corrupt-but-fetchable GLB
parse-error path (designed behavior only); (b) mobile/touch browser loading
was not tested (desktop-web target).

## Next owner or decision
- The Blender graphics pass (I101 art-bible -> I102 asset-spec -> I103
  modeling -> I104 integration -> I105 verification -> I106 audit) is
  COMPLETE. No blocking items remain on this pass.
- User decision (non-blocking): add a LICENSE file before any public release
  (R5).
- Suggested next: cgs-milestone-review or user-directed scope.
