# Scope check - E17: Asteroid Family & World Polish Arc (I252)

## Summary
E16 closed at I251 (G16.0 PASS 7/7; 765/765; build 0; dist 113 files 2033.0 raw / 539.1 gzip KB; headroom 15.0 raw / 10.9 gzip, floor >= 8 HOLDS). E17 opens the next art arc from the user standing suggestion (improve the art; Blender for new/improved assets). A full 18-GLB inventory audit (GLB JSON chunks parsed at I252) identifies the ASTEROID FAMILY as the oldest remaining hero-asset family (I103 v1 / I209 v2 - every other hero mesh has since gained a pass: ship I244, boss I248) AND the most-seen geometry in the game (rock pool 29, cap 24 concurrent; rocks are the base loop). Second lever: the arena ring (I212) is a single 48-tri flat band - the world's boundary anchor, and the genre's vector-grid signature (Geometry Wars / Neon Wars / Starfighter Neon line) is currently underplayed. E17 = 3 stories, gate G17.0: ST-244 asteroid hero pass (Blender v3 rebuild of asteroid L/M/S with class-differentiated silhouettes + richer COLOR_0 mottle), ST-245 arena ring v2 + world presentation (two-node GLB: outer band + inner tick accent), ST-246 regression + G17.0 + closeout. ALL render/asset layer only: no core sim / scoring / replay-data changes - the demo pin is structurally untouched BY LAYER (I217/I235/I240/I244/I248 precedent); no daily salt bump (no core changes).

## Evidence (verified at I252)
- Asset inventory (GLB JSON parse, 18 GLBs): asteroid_L 37660 B / 1 node / 320 tris / 1 mat (VR_Rock) - 4x the boss size and the single largest asset; asteroid_M 12164 B / 104 tris; asteroid_S 10292 B / 80 tris. ship 9152 B (I244 done), boss 8976 B (I248 done), warden 11772 B (I220), flyer 4940 B (I240), stinger 3256 B (I235), shield 7372 B, arena_ring 4784 B (48 tris, unit radius 1.0, inner 0.94, flat XZ, +Y normals, no vertex colors), drone 4352 B, 7 powerups 2124-3840 B.
- Radii (src/core/config.js:59-61): L 2.2 / M 1.3 / S 0.7. tests/assetGlbs.test.js pins: node VR_Rock_{L,M,S}, material VR_Rock, COLOR_0 on every primitive (I209 contract), budgets L<=320 / M<=120 / S<=80, max vertex radius within 5% of CONFIG, <100 KB per GLB.
- Render (src/render/asteroidRenderer.js, 7776 B): setGLB() takes the FIRST mesh geometry only (1 geometry per size BY DESIGN per design/asset-spec.md; per-rock rotation = variety). In-code materials authoritative (0x8a7f72 flat + fresnel rim 0x5f7fd8; golden override 0xffc94d / emissive 0xffa018; belt 0x2a313d) - all three vertexColors:true (I209), so COLOR_0 mottle is consumed by the golden AND belt states. Fallback = IcosahedronGeometry(radius, 1) + seeded per-vertex jitter 1+(-0.22..0.30) (3 variants per size) = the GLB extent envelope. Pool children [0]=shield shell / [1]=golden cage are in-code meshes (untouched by this epic).
- Render (src/render/arenaRing.js, 1030 B): one mesh, one material (translucent MeshBasic 0x4a6cff opacity 0.55, DoubleSide, depthWrite false), scaled by CONFIG.arena.radius 26 at y 0.03 above the polar grid; static (reduced-motion safe); +1 draw call.
- YouTube grounding (I252, 5 queries / 41 unique; transcripts rate-limited 900 s -> metadata + chapters + descriptions per I242/I247 discipline): Rod DeWeese "The Easiest Way to Make Asteroids in Blender" (2026-03; non-destructive Sub-D + Displace + Lattice - the lattice is the class-shaping lever); Sleep Fight Games "How to model Low Poly Asteroids in Blender 2.8" (displace + harden-normals low-poly recipe); Blender Bones "Rock Sculpting Tutorial" (2025-11; crater depth + variation as the hero detail); Starfighter Neon (GEOMETRY WARS x ASTEROIDS) + Neon Wars + the Geometry Wars clone line = the neon-vector boundary language that makes the arena ring the world's signature. Skybox/nebula queries: E12 v5 (I230) is fresh with a known ACCEPTED art note (readability intact) - no active defect, no re-open.
- Budget facts: dist headroom at open 15.0 KB raw / 10.9 KB gzip (caps 2048/550, floor >= 8). The asteroid rebuild targets NET NEGATIVE raw: the I209 v2 exports are non-indexed with normals (L = 960 verts x 36 B = 34.5 KB + JSON = 37.66 KB observed); a lean v3 export at equal or lower tri counts is structurally smaller (size evidence recorded at ST-244). Ring v2 GLB <= 4 KB raw.

## Scope Fit
FIT - bounded, 3 stories / 3 iterations (I253..I255; docs-only open at I252). Every item uses the proven E9->E16 GLB pipeline (Blender MCP -> GLB -> GLTFLoader swap -> assetGlbs/assetPerf audit -> browser A/B). No new dependencies, no core changes, no new pools. The user standing art/Blender directive is the epic's origin (E15/I242 precedent).

## Cut Option
If E17 slips or the budget tightens: ST-245 (ring v2; tiny GLB, ~1 iteration) is the cheapest win and can land first. ST-244 stays the heart of the arc; if cut entirely, E17 shrinks to the ring arc and re-gates on the G17.0 criteria minus the asteroid row (documented here, not expected).

## Deferral
- Touch fallback (own arc - needs input-modeling design first).
- Music quality perception verdict (HUMAN-PENDING #5 - needs a human session; the objective half shipped at I249).
- Hardware remainder (physical device validation - HARDWARE-pending).
- Polar grid rework: deferred UNLESS the ST-245 ring A/B surfaces a contrast need (the grid is procedural and readable today; not a defect).
- Skybox v6: E12 v5 (I230) is fresh, accepted art note, no active defect - not re-opened.
- Ship / boss / warden re-passes: I244 / I248 / I220 are fresh - no hero pass owed.

## Recommendation
APPROVED. E17 = Asteroid Family & World Polish Arc, 3 stories (ST-244..246), gate G17.0. The asteroid family is both the oldest un-updated hero asset family and the most-seen geometry in the game - the highest art-per-hour available. The ring v2 is the world's boundary anchor and cheap. Both are render/asset layer only (demo pin BY LAYER; no salt bump).

## Risks
- R-E17-1 (med) asteroid v3 breaks the golden/shielded/belt reads (COLOR_0 is consumed by matGold/matBelt - the I209 contract) -> keep vertexColors:true, bake mottle in the same I209 clamp band (0.45..1.2, identity-safe), extent parity vs the jittered-ico fallback envelope, live A/B of golden + shielded + belt rocks at ST-244.
- R-E17-2 (low) demo pin drift -> BY LAYER (render/asset only; no core sim / scoring / replay-data; I217/I235/I240/I244/I248 precedent); real-UI re-verify at ST-246; no daily salt bump.
- R-E17-3 (low) gzip budget (10.9 KB at open) -> asteroid rebuild NET NEGATIVE raw (L 37.66 KB is the outlier; lean export + class decimate), ring v2 <= 4 KB raw; floor >= 8 KB after every story.
- R-E17-4 (low) ring v2 test pin change (exactly 48 tris -> two-node counts) + +1 draw call -> pin updates intentional with evidence in the iteration log; frame probe delta ~0; bloom-safe bands verified (tick accents crossing 0.72 are the intended accent; the band luma stays below threshold).

## Changed files or proposed files
Changed (I252, docs-only): production/scope-check-E17.md (new), production/epics.md (+E17 + risk register), production/stories.md (+E17), production/timeline.md (+E17 opened), CHANGELOG.md (+I252), production/iterations.md (+I252), production/session-state/active.md.
Proposed (ST-244): assets/asteroid_L.glb, assets/asteroid_M.glb, assets/asteroid_S.glb (rebuilt); tests/assetGlbs.test.js rock pins expected UNCHANGED (radii / budgets / COLOR_0 / names all preserved - verify at ST-244); src/render/asteroidRenderer.js expected unchanged (in-code materials + setGLB contract preserved) unless the v3 shapes fall outside the current jitter band (fallback envelope note only).
Proposed (ST-245): assets/arena_ring.glb (two-node v2), src/render/arenaRing.js (two-mesh render), tests/assetGlbs.test.js (arena_ring pin update - documented); in-code colors only, no CONFIG change expected.

## Gate G17.0
1. Asteroid GLB 18/18 + extent parity + class A/B (L/M/S side-by-side screenshot) + golden/shielded/belt live checks + NET NEGATIVE raw size vs I251 baseline (L 37.66 KB).
2. Ring v2 GLB (2 nodes) + two-mesh render + +1 bounded draw call + frame probe delta ~0 + bloom band A/B (FX high: ticks bloom / FX low+off: no bloom; band luma below threshold).
3. Demo pin EXACT via real UI (2169/2220, 11334, 57, 36.15, wave 2).
4. Fresh tests + build + dist in budget (headroom >= 8 KB gzip after the story).
5. Regression green + log audit sequential 1..255.

## Unverified assumptions (labeled separately from evidence)
- Lattice-warp class shaping will read better in-game than per-size decimate alone (grounded by the DeWeese 2026 workflow + the Imphenzia silhouette-first precedent from I244; final verdict = the ST-244 in-browser class A/B, not this scope check).
- The tick accent crossing the bloom threshold will read as "arena signature" rather than noise (grounded by the Geometry Wars / Neon Wars boundary language; final verdict = the ST-245 bloom A/B screenshots).
- Lean v3 exports will be net-negative raw vs the I209 non-indexed exports (structural argument from the observed byte layout; size evidence recorded at ST-244).

## Verification evidence
- No src/test changes at I252 (docs-only open): 765/765 and build 0 unchanged by construction; re-run at I252 close (recorded in the iteration entry).
- All code/asset facts above read from disk at I252: config.js:56-82, assetLoader.js ASSETS map (18 slots), tests/assetGlbs.test.js (rock + arena pins), design/asset-spec.md (I102 + I209 + I212 sections), src/render/asteroidRenderer.js, src/render/arenaRing.js, and GLB JSON parses of all 18 assets.
- YouTube grounding recorded (5 queries / 41 unique; rate-limit note in Evidence).

## Next owner or decision
I253 = ST-244 asteroid hero pass (cgs-dev-story + Blender MCP). No human decision required; perception verdicts (class readability, ring accent) are in-browser A/B at the stories, with a HUMAN-PENDING note only if an A/B is ambiguous.
