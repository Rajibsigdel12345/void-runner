# Scope check - E18: World Material & Contrast Arc (I256)

## Summary
E17 closed at I255 (G17.0 PASS; 771/771; build 0; dist 113 files 1991.1 raw / 533.5 gz6 KB; headroom 57.5 raw / 16.5 gzip, floor >= 8 HOLDS). E18 continues the user standing art directive from a LIVE in-game screenshot taken at I256 (.evidence/I256/02_ingame_w1.png, demo pilot t~12s): the E17 v3 asteroid family - rebuilt for silhouette + richer COLOR_0 at I253 - READS AS ICY PERIWINKLE / ICE CUBES, not warm rock: every frame of the base loop shows the most-seen geometry (rock pool 29, cap 24 concurrent) in the wrong material family. Root cause is two-lever: (a) the I253 COLOR_0 bake is too pale / low value-contrast, and (b) the scene lighting is a strong cool wash - AmbientLight(0x8899ff, 0.35) + HemisphereLight(0x33437a, 0x04060f, 0.55) - that dominates hue on the camera-facing faces under a single white DirectionalLight(1.1). Second lever: with the rock palette shifting warm, the NEON ACCENT LANGUAGE (player bullets, explosions, pickups) needs a harmony pass so the player-owned neon (cockpit cyan) reads against the warmer rocks instead of the current all-white bullets. E18 = 3 stories + closeout, gate G18.0: ST-247 rock material + lighting hero pass (Blender COLOR_0 rebake + light rebalance), ST-248 bullet/tracer + explosion palette harmony (neon accent language, genre-grounded), ST-249 pickup + golden/belt read audit post-palette (A/B, data-driven tweaks). ALL render/asset layer only: no core sim / scoring / replay-data changes - the demo pin is structurally untouched BY LAYER (I217/I235/I240/I244/I248/I253/I254 precedent); no daily salt bump (no core changes).

## Evidence (verified at I256)
- Live screenshot (.evidence/I256/02_ingame_w1.png, real demo pilot via REPLAYS -> DEMO PILOT): L and M rocks render as smooth icy periwinkle; the warm base material (0x8a7f72) is not visible on the dominant camera-facing faces. Ship (dark blue delta + cyan cockpit + warm exhaust), arena band, wave banner, nebula all read well - the rocks are the single weakest material in the frame.
- Material (src/render/asteroidRenderer.js): mat = MeshStandardMaterial({ color: 0x8a7f72, roughness: 0.95, metalness: 0.05, flatShading: true, vertexColors: true }) + onBeforeCompile fresnel rim (0x5f7fd8, strength 0.5); matBelt = 0x2a313d / emissive 0x2f6fd0 @0.6; golden override 0xffc94d / emissive 0xffa018. COLOR_0 (I253 v3 bake: mottle + crater-rim brightening) is consumed by ALL three states (I209 contract).
- Lighting (src/main.js:81,107-110): scene.fog = Fog(0x04060f, 60, 240); HemisphereLight(0x33437a, 0x04060f, 0.55); AmbientLight(0x8899ff, 0.35); DirectionalLight(0xffffff, 1.1) at (6,12,4). The cool ambient + hemisphere are the dominant hue sources; no warm key exists.
- Bloom bands that must survive any light change (0.72 threshold x 255 = 183.6 luma): arena tick 0xdfe9ff @ op 0.9 (luma ~210, intended accent, I254), band 0x4a6cff @ 0.55 (luma ~114, below), cockpit emissive (0.1,0.685,1.0) x1.4, boss core phase-2 emissive (I248), belt emissive 0x2f6fd0 @0.6, pickup emblems. A light rebalance must be audited against this table at ST-247.
- Kill feedback: rocks are ONE-SHOT (config asteroid.sizes: L->M->S splits, S terminal) - every hit is a kill. killPunch.js (ST-221) documents the deliberate rule: NO flash / hit-stop / fovKick on plain kills (bullet-hell readability rule, design/art-direction-research.md lever 4) - the class-scaled camera punch owns kill feedback. Therefore NO rock hit-flash story (a GMTK-style white flash on rocks would contradict the project's own grounded decision).
- ship.glb (GLB JSON parse at I256): 6 nodes / 76 tris / 3 materials - VR_Ship_Cockpit 16t (emissive cyan 0.1,0.685,1.0 x1.4), Engine 8t, Fin 8t, Hull 16t (0.3,0.55,0.85), Nozzle 12t, Wings 16t (0.08,0.16,0.42); wings x +/-1.25 (span 2.5 exact), hull z -0.85..0.85 (len 1.9 exact). The I207 "224-tri canopy sphere / 4 draw calls" flag is STALE (the I244 hero pass already restructured the ship) - no ship art debt.
- Bullets (src/render/bulletPool.js, enemyBulletMesh.js): neutral white dot + trail; no weapon-state color. Genre grounding (below) points at neon tracers carrying the player accent.
- Powerups: 7 GLBs (2124-3840 B each, I252 inventory), GDD shape + color, colorblind-safe; their reads must be re-audited after the rock palette shifts warm (ST-249).
- YouTube grounding (I256, 5 queries / 49 unique; highlights where transcripts existed): GMTK "Secrets of Game Feel and Juice" (1.1M views; damage-clarity principle - here it validates the EXISTING punch-only kill hierarchy, not a new flash), Riot Games "So You Wanna Make Games?? Ep 7: Game VFX" (221K views; VFX must communicate gameplay + thematic cohesion - the neon accent language), TIMBER "How To Make Your Game Feel Better" (59K; color/shape/particles as readability levers), StayAtHomeDev "Camera Juice & Effects" (26K; retro shooter camera kicks - already shipped as punch/shake tables), ZeroVector gameplay (vector-graphics neon bullet-hell reference for tracer language), Solaroids (3D parallax asteroids - our parallax camera already covers).

## Scope Fit
FIT - bounded, 3 stories / 3 iterations (I257..I259) + closeout I260 (docs-only open at I256). Every item uses the proven E9->E17 pipeline (Blender MCP -> GLB -> in-browser A/B -> bloom audit). No new dependencies, no core changes, no new pools, no salt bump. Directly serves the user standing art directive.

## Cut Option
If E18 slips: ST-247 (rock palette + lighting) is the heart of the arc and lands first; ST-249 (pickup audit) is a small A/B + data tweak and can be merged into ST-250's regression if a full iteration is unaffordable; ST-248 (bullet palette) is the most deferrable (bullets are readable today - white on dark is a safe read).

## Deferral
- Touch fallback (own arc - needs input-modeling design first).
- Music quality perception verdict (HUMAN-PENDING #5 - needs a human session).
- Hardware remainder (physical device validation - HARDWARE-pending).
- Rock hit-flash: REJECTED by design (killPunch.js rule - one-shot rocks, no per-kill flash; documented above, not deferred).
- Ship re-pass: STALE - I244 hero pass current (6 nodes / 76 tris verified at I256).
- Skybox v6: I230 v5 fresh, accepted art note, no active defect.
- Polar grid rework: readable today; not a defect.

## Recommendation
APPROVED. E18 = World Material & Contrast Arc, 3 stories (ST-247..249) + ST-250 closeout, gate G18.0. The rock material family is the most-seen geometry in the game and currently in the wrong material family (ice, not rock) - the highest art-per-hour available after E17. The neon accent harmony is its natural consequence. All render/asset layer only (demo pin BY LAYER; no salt bump).

## Risks
- R-E18-1 (med) light rebalance shifts a protected bloom band (ticks / cockpit / boss core / belt / pickups) -> ST-247 must ship the bloom-band audit table (before/after luma vs the 183.6 threshold, FX high + off A/B) and re-tune any band that moved; golden + belt rock states re-verified live (they consume the same COLOR_0).
- R-E18-2 (low) demo pin drift -> BY LAYER (render/asset only; I217/I235/I240/I244/I248/I253/I254 precedent); real-UI re-verify at ST-250; no daily salt bump.
- R-E18-3 (low) GLB size -> COLOR_0 rebake only (no geometry / tri / node change) => net-zero raw vs v3; headroom 57.5 raw / 16.5 gz at open, floor >= 8 after every story.
- R-E18-4 (low) bullet color change reduces bullet-vs-background contrast at FX off -> ST-248 keeps the FX-off readability floor principle (ST-177): bullets must clear a luma-delta floor against the arena floor + nebula with FX off, verified in-browser.

## Changed files or proposed files
Changed (I256, docs-only): production/scope-check-E18.md (new), production/epics.md (+E18 + risk register), production/stories.md (+E18), production/timeline.md (+E18 opened), CHANGELOG.md (+I256), production/iterations.md (+I256), production/session-state/active.md.
Proposed (ST-247): assets/asteroid_L.glb / asteroid_M.glb / asteroid_S.glb (COLOR_0 rebake only - same geometry / radii / node names / budgets), src/main.js (light rebalance, ~3 lines), tests/assetGlbs.test.js (rock pins expected UNCHANGED - geometry untouched; verify), .evidence/I257 A/B screenshots + bloom-band table.
Proposed (ST-248): src/render/bulletPool.js (accent + overdrive color), possibly src/core/config.js (palette constants, data-driven), src/render/enemyBulletMesh.js only if the A/B shows a player/enemy contrast need; tests: new palette-purity test if constants move to config.
Proposed (ST-249): A/B screenshots (7 pickups + golden + belt vs new palette), data-driven color/opacity tweaks in src/core/config.js or the powerup render where contrast regresses; GDD colorblind shape+color check.

## Gate G18.0
1. Rock palette A/B before/after (L/M/S side-by-side, in-browser): rocks read as warm rock, not ice; far-rock contrast vs the nebula improved; golden + belt states intact.
2. Bloom-band audit: protected accents cross 0.72 as designed (ticks ~210, cockpit, boss core, pickups); rock faces + band stay below; FX high / off A/B.
3. Bullet/tracer + explosion palette: player bullets carry the cockpit-cyan accent + overdrive heat; player vs enemy contrast preserved; FX-off readability floor (ST-177) verified.
4. Pickup + golden/belt read audit: 7 pickups + golden + belt A/B vs the new palette, colorblind-safe shape+color intact.
5. Demo pin EXACT via real UI (2169/2220, 11334, 57, 36.15, wave 2).
6. Fresh tests + build + dist in budget (headroom >= 8 KB gzip) + regression green + log audit sequential 1..260.

## Unverified assumptions (labeled separately from evidence)
- A deeper, higher-contrast warm COLOR_0 + a neutralized ambient will make the rocks read "rock" rather than "ice" (the screenshot is the defect evidence; the exact target palette is an art judgment verified by the ST-247 in-browser A/B, not by this scope check).
- A small light rebalance (not a full relight) is sufficient - if the ST-247 A/B shows the directional light alone cannot lift the camera-facing faces, the story extends to a warm key light (still render layer, still BY LAYER; the cut option covers it).
- Player bullets in cockpit-cyan + overdrive heat will read as "yours" without HUD changes (ZeroVector / Geometry Wars tracer-language grounding; final verdict = the ST-248 in-browser A/B at kill rate).

## Verification evidence
- No src/test changes at I256 (docs-only open): 771/771 and build 0 unchanged by construction (re-run recorded at I256 close).
- All code/asset facts above read from disk at I256: src/render/asteroidRenderer.js, src/main.js:81,107-110, src/core/config.js asteroid block, src/core/killPunch.js (kill-feedback rule), assets/ship.glb GLB JSON parse, .evidence/I256/01_menu_now.png + 02_ingame_w1.png (live screenshots this iteration).
- YouTube grounding recorded (5 queries / 49 unique).

## Next owner or decision
I257 = ST-247 rock material + lighting hero pass (cgs-dev-story + Blender MCP). No human decision required; perception verdicts (rock read, contrast) are in-browser A/B at the stories, with a HUMAN-PENDING note only if an A/B is ambiguous.
