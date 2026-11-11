# Scope check - E22: World Readability Arc III - Skybox Value + Rim Shaping + Rock Silhouette (I276)

## Summary
E21 closed at I275 (G21.0 PASS; 813/813; build 0; dist 116 files 2014.7 raw / headroom 33.3 KB, floor >= 8 HOLDS). E22 is the fourth art arc (after E15/E18/E19/E20/E21) under the user standing art directive (research -> task list -> implementation), scoped from three evidence-backed, NAMED deferrals carried since I272/E19: (1) skybox 15.2% warm/red-brown cast (E19 flag; I272: value spread 30.4 -> 85.4 is healthy but the cast has no in-code lever -> Blender re-bake of the 1024x512 node-bake-v5 equirect), (2) rim flooding faces flat-bright-purple at the frozen 0.45/0.30 strengths (I272 first true render: hull ~55 -> ~106-118; pow 5.0 hardcoded -> make the fresnel power data-driven in CONFIG and raise it so the rim hugs the silhouette), (3) the asteroidRenderer legacy rim (custom vRimViewPos varying + vertex injection, I272: deferred to the standard vViewPosition fragment-only pattern, A/B required). Grounded at I276 with three new YouTube studies (frames + details captured; transcripts skipped per the rate-limit guard): The Observatory "Fake Rim Lighting [In Blender]" (43K - Dot(view,normal) -> ColorRamp = the rim family; ramp position/scale = thickness/softness = our power lever), Lightning Boy Studio "Toon Shader Part 6 - Perfect Rim Lights" (103K - rim strength + power curve are the two levers; rim color = accent), Game Dev Guide "5 Skybox Methods Every Unity Dev Needs To Know" (51K - skybox must fit the visual style; equirect sits in the gradient/procedural family; a color re-bake, not a structure change, is the bounded fix for a cast).

## Evidence (verified at I276)
- Tree CLEAN at da56fc3 (I275 closeout); npm test 813/813; npm run build exit 0 (re-verified this session; docs-only keeps them).
- dist: 116 files / 2,063,040 B = 2014.7 KB raw (headroom 33.3 KB >= 8).
- Skybox: assets/skybox_equirect.jpg 50004 B, 1024x512, "Blender node-bake v5" (main.js L83 comment; I212/I230 origin), loaded via createSkybox(scene, "assets/skybox_equirect.jpg", ...) with flat-color fallback. I272 audit: spread 30.4 -> 85.4 healthy; 15.2% warm-cast (E19 flag) remains - "no in-code lever" -> stays DEFERRED (Blender re-bake is the bounded lever).
- Boss rim (src/render/bossMesh.js): fragment-only vViewPosition pattern (I272 fix, L155-171); L164 pow(1.0 - clamp(dot(normalize(-vViewPosition), normal), 0.0, 1.0), 5.0) - power HARDCODED in the shader string ("I257/I263: silhouette-hugging power"); strengths data-driven via CONFIG.boss.rim {hull 0.45, crown 0.30, color, splicerColor, phase2Lift 1.6} (I272: "frozen 0.45 strength"). I272 measured: rim floods faces flat-bright-purple - hull no-rim ~55 -> with-rim ~106-118; purple rim max 176.1 < 233 sRGB-eq (no bloom crossers).
- Rock rim (src/render/asteroidRenderer.js, I257 final, pre-refactor): custom varying vec3 vRimViewPos + vertex injection at #include <project_vertex> (L48-58) + L57 pow(..., 5.0) ("I257: 3 -> 5"); warm rim 0xd8a878 @ 0.12 (I257: cool rim 0x8fa8d8 @ 0.22 WAS the periwinkle root cause; warm rim lifts face luma ~57 -> ~96). I272: deliberately untouched - "optional vViewPosition refactor deferred - A/B required".
- Protected/frozen bands: bloom threshold 183.6 linear (~233 sRGB-eq); FLOOR 50 (ST-177, FX off) - I275: bullet max 215 sRGB vs floor 64.5 (star-speck excluded), delta 150.5; MENU fx=off 20/318 (post-I274 hero-slice budget); demo pin idx 2169/2220 = 11334/57/W2/maxCombo 15/0:36, shots 57/198 (29%), seed 1909 len 2220; GLB pins: ship 11980 B, boss 6600 B, asteroids L/M/S 8956/3764/3188 B.
- YouTube grounding (I276, YouTube MCP 2026-11-12; 3 videos; 18 frames + details captured; transcripts skipped per the rate-limit guard - the E21 precedent: frames + chapters carry the method):
  1. The Observatory, "Fake Rim Lighting [In Blender]" (43K views, 4:35; youtu.be/N1REz8rpABE). Frames 0:00/0:45/1:31/2:17/3:03/3:49: material-faked rim = Dot Product node (view dir . normal) -> separate/multiply -> Add Shader; 2:17 Bump-node normal option; 3:03/3:49 Dot -> ColorRamp (position/scale = rim thickness/softness) -> Fac. Takeaway: our pow(1-dot(N,V), power) is the same family; the power/Ramp-position is THE thickness/softness lever - power 5 -> 7/8 = a thinner, silhouette-hugging rim.
  2. Lightning Boy Studio, "Toon Shader Part 6 - Perfect Rim Lights" (103K views, 22:53; youtu.be/Qc1kQbF-9Gs). Frames 0:00/3:48/7:37/11:26/15:15/19:04: 3:48 strong orange rim reading on a dark toon character; 7:37/11:26 "Rim Light (2d)" node group (Lerp + power curve shaping); 15:15 normal-smoothing/capture for a stable rim (our flat-shaded low-poly faces = per-face normals = stable by construction); 19:04 viewport setup. Takeaway: rim strength + power curve are the two levers; keep the rim color as the accent (our frozen per-variant rim colors hold).
  3. Game Dev Guide, "5 Skybox Methods Every Unity Dev Needs To Know" (51K views, 21:45, 2025; youtu.be/Yd0xNTYNfss). Chapters 0:00/1:30/2:27/6:36/9:25/14:45/19:14/20:44; frames 0:00/3:37/7:15/10:52/14:30/18:07: flat color (Hue 0.73/Sat 0.40/Val 0.15 = #1C1324 dark violet - same family as our 0x04060f base) -> gradient -> cubemap export (10:52) -> procedural vertex-color sky (14:30/18:07). Takeaway: the skybox must fit the visual style; our equirect is in the gradient/procedural family - a COLOR RE-BAKE (not a structure change) is the bounded fix for the 15.2% warm cast.
  4. Logged, not fetched (rate limit + over-engineering guard): silhouette readability is already grounded at E21 (Thomas Brush "5 Steps To Gorgeous Game Art" 444K + Kyle Banks 229K) - no extra fetches.

## Scope Fit
FIT - 3 art stories + closeout = 4 iterations (I277..I280), docs-only open at I276. Art layer only (BY LAYER - render/assets + config; no core/sim/scoring/replay-data; no salt bump; demo pin structurally untouched, real-UI re-verify at ST-266). Bounded levers per story: skybox = Blender node-bake COLOR re-bake of the existing 1024x512 equirect (JPG pin <= ~64 KB raw, now 50004 B); rim = in-code fresnel power made data-driven in CONFIG + raised 5.0 -> 7/8 in bossMesh.js and asteroidRenderer.js (0 KB asset); rock = Blender COLOR_0 mottle re-bake on L/M/S (vertex-color only, geometry/radii net-zero - I253/I264 pattern, 8956/3764/3188 B unchanged). The proven E9 -> E21 pipeline (Blender MCP -> asset -> in-browser A/B -> bloom-band + FX-off floor audits) applies to every story. No new dependencies.

## Cut Option
ST-265 (rock silhouette/value pass) is the designated CUTTABLE slice - the arc still lands the skybox cast fix (ST-263) and the rim shaping including the deferred asteroidRenderer refactor (ST-264, the heart). ST-264 lands second but is the core deliverable; ST-263 (skybox) lands first.

## Deferral
- Touch-fallback arc (input device; own arc).
- HP #5 perception (needs a human play session).
- HP-bar id + HUD readability (watchlist item; no bounded lever found this arc).
- Skybox STRUCTURE change (procedural cubemap / vertex sky etc. from the Game Dev Guide 5 methods = over-engineering; the color re-bake covers the flagged defect).
- Further research fetching (rate-limit + over-engineering guard: E21 grounding + the 3 I276 studies are sufficient).

## Recommendation
APPROVED. E22 = World Readability Arc III (skybox value + rim shaping + rock silhouette), 3 stories (ST-263..265) + ST-266 closeout, gate G22.0. All three items are named, evidence-backed deferrals with a bounded lever each and a protected-band audit per story. The arc applies the I276 rim/skybox grounding in the same measure-first, fix-only-found-defects, freeze-protected-bands way as E18-E21.

## Risks
- R-E22-1 (med) skybox re-bake crosses bloom 183.6 or shifts the E18/E21 world contrast -> no-bloom audit table (no new > 233 sRGB-eq pixels) + value-graded before/after + envMap/lighting-unchanged check per the story.
- R-E22-2 (low) skybox JPG size bloat -> JPG pin <= ~64 KB raw + dist headroom re-verify (floor >= 8 holds with 33.3 KB at open).
- R-E22-3 (med) rim power change washes out or over-brightens -> silhouette-hugging A/B + protected bands intact (183.6, FLOOR 50, frozen accent list) + strengths stay data-driven in CONFIG (no shader-string magic numbers).
- R-E22-4 (low) the asteroidRenderer refactor changes the I257 frozen rock look -> source-invariant tests (tests/bossRim.test.js pattern, ~4 tests) + rock luma A/B rim-on/off (I257 precedent: rim-off R79/G55/B37) - preserved or deliberately re-tuned with evidence.
- R-E22-5 (low) demo pin drift -> BY LAYER (I217/I235/I240/I244/I248/I253/I254/I260/I272 precedent); real-UI re-verify at ST-266.

## Changed files or proposed files
Changed (I276, docs-only): production/scope-check-E22.md (new), design/art-direction-research.md (+I276 video grounding + E22 task list), production/epics.md (+E22 block), production/stories.md (+E22 ST-263..266), production/session-state/active.md (header -> I276/E22 opened), production/iterations.md (+I276), CHANGELOG.md (+I276).
Proposed (ST-263): assets/skybox_equirect.jpg (Blender node-bake v6 color re-bake, 1024x512, <= ~64 KB raw pin); .evidence/I277/ value-graded before/after + no-bloom table.
Proposed (ST-264): src/render/bossMesh.js (power from uniform/CONFIG, no hardcoded 5.0), src/render/asteroidRenderer.js (drop custom vRimViewPos varying + project_vertex injection -> standard vViewPosition fragment-only), src/core/config.js (rim power knobs: boss hull/crown + rock), tests (rim source-invariant tests, bossRim.test.js pattern); .evidence/I278/ silhouette A/B + luma tables.
Proposed (ST-265): assets/asteroid_l.glb / asteroid_m.glb / asteroid_s.glb (COLOR_0 mottle re-bake only, geometry/radii unchanged), possibly tests/assetGlbs.test.js mottle-range pins; .evidence/I279/ value-graded trio at 10u+.

## Gate G22.0
1. Skybox: value-graded before/after (warm-cast fraction 15.2% -> measured target), no-bloom audit (no new > 233 sRGB-eq pixels; frame max documented), JPG pin <= ~64 KB raw, PMREM/envMap + scene lighting unchanged (flat-color fallback path intact).
2. Rim shaping: silhouette-hugging A/B before/after (hull faces no longer flooded flat-bright-purple; rim concentrates at edges); protected bands intact (threshold 183.6, FLOOR 50 re-verified, frozen accent list unchanged); power data-driven in CONFIG (no hardcoded shader constants).
3. AsteroidRenderer refactor: source-invariant tests green; rock luma A/B rim-on/off (I257 look preserved, or deliberately re-tuned with evidence; rim-off reference R79/G55/B37).
4. Rock silhouette pass: value-graded read of L/M/S at 10u+ (class separation); GLB budgets 8956/3764/3188 B (vertex-color-only, net-zero geometry/radii); assetGlbs pins green.
5. Demo pin EXACT via real UI (2169/2220, 11334, 57, W2, combo 15, 0:36) + 10-probe regression per the I275 template + fresh tests + build + dist in budget (headroom >= 8 KB) + log audit sequential 1..280.

## Unverified assumptions (labeled separately from evidence)
- A Blender color re-bake can bring the skybox warm-cast fraction well under 15.2% while keeping structure and the JPG in budget (the node-bake v5 recipe is reproducible in the Blender MCP; if the re-bake cannot get it under the target, the story falls back to a documented partial improvement and re-defers with evidence).
- The asteroidRenderer vViewPosition refactor preserves the I257 rock look to within measurement noise (the luma A/B decides: preserved, or the rim is deliberately re-tuned with the new values documented - either outcome passes ST-264 with evidence).
- A rock COLOR_0 mottle re-bake stays inside the existing GLB budgets (the I267/I273 vertex-color-only net-zero pattern is demonstrated; if size crosses, the mottle is quantized down and re-exported).

## Verification evidence
- Docs-only open: 813/813 + build exit 0 re-run at I276 (unchanged by construction); dist 116 files / 2014.7 KB unchanged.
- All source facts (skybox size/origin, rim code locations, frozen constants) re-read from src/render/bossMesh.js, src/render/asteroidRenderer.js, src/core/config.js, main.js L83 + the I272/I275 probe records this session.
- YouTube grounding: 3 videos, 18 frames + details captured (this session); transcripts skipped per the rate-limit guard (E21 precedent: frames + chapters carry the method).

## Next owner or decision
I277 = ST-263 skybox 15.2% warm-cast re-bake (cgs-dev-story + Blender MCP). No human decision required; perception verdicts are in-browser A/B + luma tables at the stories.
