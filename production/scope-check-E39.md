# Scope Check E39 - Arena Floor & Hub Art Pass (Blender floor texture + grid/material refinement)

- Iteration: I356 (arc open)
- Skills: cgs-scope-check + cgs-create-stories (docs-only)
- Inputs: AGENTS.md, production/session-state/active.md, production/scope-check-E38.md (pattern + G38.0 closeout), production/iterations.md (ST-177 FLOOR-50 luma ceiling origin; I322 floorab pin), .evidence/I356/{menu,play_early,play_mid}.png (fresh headless screenshots this session, fx=high, all 19 GLBs ready, console 0/0), src/render/floorDisc.js + src/render/arenaFloor.js + src/core/floorGrid.js + src/core/config.js (floor rendering path read in full), assets/ inventory (19 GLB + skybox_equirect.jpg)

## Summary

E38 (Touch-Fallback) closed at I355 with 5/5, G38.0 PASS R1..R5, 925/925, dist 130/1928606 B, vendor sha 76DEA8151BC9352A unchanged. E39 = the next arc of the user standing 100-iteration directive. The evidence points to ONE dominant unpolished surface: the ARENA FLOOR.

- Screenshots (this session, headless, fx=high): gameplay shows an orange nebula skybox (good), stars, a glowing blue/purple arena rim (good), and the E36 bumpy/cratered asteroids (good). But the arena floor occupies ~60% of the gameplay frame and reads as a NEAR-BLACK FLAT DISC with a barely-visible grid = empty void. The MENU backdrop is similarly a dark sparse band.
- The floor is dark BY DESIGN (ST-177 FLOOR-50: displayed floor luma stays under a ceiling so rocks/bullets pop). So the fix is to add STRUCTURE inside the dark budget (defined center hub, refined ring/spoke grid, richer rim, subtle surface texture) - NOT to brighten it. Zero sim change.
- The standing Blender directive is satisfied inside the arc: ST-326 authors the floor surface texture in Blender (512x512 PNG, ~20 KB or less).

## Evidence (this session, verified)

- Assets (assets/): 19 GLB + skybox_equirect.jpg (65.7 KB). ship 14.1 KB, asteroid L 22.2 / M 6.4 / S 8.2 / comet 6.9, boss 6.9, drone 7.1, flyer 6.5, stinger 6.1, warden 19.3, 7 powerups 3.3-6.5, arena_ring 5.4, shield 7.2. All hero assets Blender-made.
- Render layer (40 files): bloom + grade post, starfield, skybox, arenaFloor, floorDisc, particles, shockwave, vortexFx, all meshes, HUD/screens.
- Core (50 files): adaptiveQuality, dprTier, boss + Tally + Telegraph, musicIntensity, killPunch, juiceTally, daily, recording/replay/splicer, director/waves, flame/engineTrail/shockwave/vortex.
- Screenshots .evidence/I356/{menu,play_early,play_mid}.png (artshot.mjs, one headless launch, all 19 GLBs ready, fx=high, console 0/0): MENU polished (title/settings/controls/TOP5/DAILY+REPLAYS/footer) but dark sparse backdrop; gameplay CLEAR WEAKNESS = the floor.
- Floor code (floorDisc.js + arenaFloor.js + core/floorGrid.js + config.js): floorDisc = CircleGeometry + procedural 256x256 canvas radial gradient, unlit MeshBasic, toneMapped false, y = -0.02. arenaFloor = static LineSegments warm grid (gridBright 0x463529 luma 55.7, gridDim 0x201812 luma 25.3). Conclusion: add structure, not brightness.
- Floor probes (floor-luma dependent, RE-PIN required): FLOOR-50 (p7a) frozen 230/61/169/0/0; floorab (floorab_i322b) rings 48.47/48.47/39.90/29.41/25.27 + hub/rest/rim spots + rim 55.47 (calls 31, tris 546).
- YouTube grounding (bounded: 1 search / 3 queries / 11 raw) = NOISE (manwha/GameMaker/Godot/anime; no arcade-playfield reference). Stopped per anti-over-engineer; grounded in local evidence + genre principle instead. The 11 ids are burned (active.md burn list).

## Scope Fit

FIT - bounded, 5 iterations (I356 docs + I357..I361):
- Layer: render + ONE new asset. Zero src/core sim/scoring/replay (p1 demo pin causally re-verified at ST-330).
- No new systems, no new enemies, no settings-UI growth, no salt bump, no vendor bump.
- Asset budget: dist 1,928,606 B of 2,097,152 B (130 files), headroom 168,546 B, floor 102,400 B -> max addable ~66,146 B (~64.6 KB). New floor texture ~20-28 KB (512x512 dark PNG) + code ~1-3 KB -> fits; expected new headroom ~140 KB.
- Blender requirement met inside the arc (ST-326), not as a separate arc.

## Cut Options

- ST-329 (MENU backdrop polish) is CUTTABLE: render-only camera/glow tweak; cut it if it risks the HUD A/B baseline while ST-326..328 still pass the gate.
- ST-328 (grid refinement) is trimmable to a constants-only change (no new geometry) if luma margin is tight.
- Minimum viable E39 = ST-326 (Blender texture) + ST-327 (apply it) + ST-330 (regression/closeout).

## Deferrals

- i18n (plan-only, design/i18n-strings.md) - unchanged.
- 3-finger gestures / gamepad - no measured demand.
- Skybox change - v8 frozen (not part of this arc).
- Rock/asteroid rework - E36 done (bumpy/cratered verified in the I356 screenshots).
- Dynamic floor FX / animated floor - out of scope (per-frame cost; FX-tier rule).

## Recommendation

OPEN E39 (5 stories, ST-326..330):
- ST-326 (Blender): author assets/floor_surface.png - 512x512 PNG ~20 KB or less, displayed luma under 50: warm-neutral base (R>G>B), fine concentric ring texture, defined center-hub glow, rim accent, subtle speckle.
- ST-327 (code): apply via assetLoader (new key floorSurface) with the existing procedural canvas as fallback; keep unlit MeshBasic toneMapped false; FX-tier-aware static (no per-frame cost); re-pin floorab (documented delta). Zero sim.
- ST-328 (code): refine arena grid (arenaFloor.js) - stronger but tasteful bright/dim contrast, defined center-hub ring, richer rim; stay within FLOOR-50; re-pin floorab. Zero sim.
- ST-329 (code, CUTTABLE): MENU backdrop polish - reposition MENU camera to frame the nebula band (match gameplay sky richness) or a subtle MENU glow. Bounded, render-only. Zero sim.
- ST-330: E39 regression + G39.0 gate + closeout.

## Risks

- R-E39-1: floor luma creep above the FLOOR-50 ceiling (the ceiling is a HARD cap; re-pins are values-only, never the ceiling; p7a re-run at ST-330).
- R-E39-2: floorab + p7a re-pin scope (both floor-luma dependent; deltas documented in iterations + this file).
- R-E39-3: texture byte bloat (more than ~28 KB breaks the 102,400 B headroom floor - capped in the ST-326 acceptance).
- R-E39-4: FX-tier regression (texture must stay static, no per-frame cost; FX low/off still clean; A/B high/low/off probe at ST-330).
- R-E39-5: MENU camera shift (ST-329) could move the HUD A/B baseline - kept CUTTABLE; re-measure to the I347 baseline.

## Gate G39.0 (at ST-330)

- R1: p1 demo pin EXACT (11334/57/W2/combo15/shots198/57/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220 speed 4/Q -> MENU/console 0-0) = causal proof of zero sim delta.
- R2: rockab radii EXACT 2.2/1.3/0.7 (rock GLBs untouched).
- R3: floor-art probe (floor_surface.png loads + ready; floor luma in-band under the FLOOR-50 ceiling; FX A/B high/low/off clean; no NaN; console 0/0) + floorab and FLOOR-50 re-pinned with documented delta.
- R4: PWA 11/11 re-run (I348 baseline server).
- R5: 925+ tests + build 0 + headroom >= 102,400 B + vendor sha 76DEA8151BC9352A unchanged + servers killed + ports free.

## Files

Changed (I356, docs-only): production/epics.md (E39 block), production/stories.md (ST-326..330), CHANGELOG.md (I356 line), production/session-state/active.md, production/iterations.md (I356 entry), production/scope-check-E39.md (this file, new).
Proposed (I357..I361): assets/floor_surface.png (new, ST-326); src/render/floorDisc.js + src/render/assetLoader.js + src/core/config.js (ST-327); src/render/arenaFloor.js + src/core/floorGrid.js (ST-328); src/render/screens.js or src/main.js MENU camera (ST-329, cuttable).

## Verification

- npm test 925/925 (docs-only, no code change).
- npm run build 0 (130 files / 1,928,606 B / headroom 168,546 B unchanged).
- Evidence: 3 screenshots + floor code audit + probe pin inventory + YouTube noise note (all captured I356).

## Next

I357 = ST-326 Blender floor surface texture (cgs-dev-story + blender-core / blender-modeling / blender-export / blender-asset-qa; ASSETS-ONLY, zero src/core).
