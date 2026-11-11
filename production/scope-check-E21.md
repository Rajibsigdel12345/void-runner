# Scope check - E21: Art Quality Arc II - Value Contrast + Hero Moments (I271)

## Summary
E20 closed at I270 (G20.0 PASS; 809/809; build 0; dist 116 files 2009.9 raw / headroom 38.1 KB, floor >= 8 HOLDS). E21 is the third art arc after E15/E18/E19/E20, continuing the user standing art directive (research -> task list -> implementation), and absorbs the two named carryovers from the E20 task list: G4 menu hero moment (own MENU-camera slice; cuttable) and G5 hull-bottom fill (minor; fold into a pass if needed). Grounded at I271 with two new YouTube studies (frames + chapters captured; transcripts pending the rate-limit window): Thomas Brush "5 Steps To Gorgeous Game Art" (444K - value-first pipeline: grayscale value blockout before color, one strong accent against desaturated masses) and Kyle Banks "How to Create Beautiful Games in Unity" (229K - bold value-contrast visual hook, Volume Bloom Threshold 0.56 / Intensity 1.54 / Scattering 0.7 / Downscale Half, single practical + rim = mood). The E20 closeout left per-asset accents frozen (cockpit 0x59d8ff, ticks 0xdfe9ff, band 0x4059e0, flame core 195.8, threshold 183.6); what has never been an explicit pass is the whole-scene grayscale value structure and the MENU hero moment.

## Evidence (verified at I271)
- Frozen constants (re-read from src/core/config.js + I270 probe record; unchanged): bloom threshold 183.6 linear (~233 sRGB-equiv); FX-off FLOOR 50 (ST-177); demo pin idx 2169/2220 = 11334/57/W2/maxCombo 15/0:36, shots 57/198 (29%), seed 1909 len 2220; ship hull 0x9a8468 / dark 0x54402e / cockpit 0x59d8ff FROZEN; arena ring band 0x4059e0@0.42 / ticks 0xdfe9ff@0.9; flame coreZone 195.8 / midTail 164.3 linEq; floor grid 0x463529/0x201812; nearMiss {2.6,15,1.6,0.3}; pools 512/8/64(+64)/24/29(24+5 belt)/10/6/4/4.
- dist: 116 files / 2009.9 KB raw (headroom 38.1 KB >= 8).
- Tests 809/809; build exit 0 (re-verified this session; docs-only keeps them).
- YouTube grounding (I271, YouTube MCP 2026-11-12; 2 candidate videos; 16 frames + chapters captured; transcripts: the one bounded retry extended the caption pause to 900 s - guard applied, not retried; frames + chapters carry the method):
  1. Thomas Brush, "5 Steps To Gorgeous Game Art" (444K views; youtu.be/gTZT8GE5928). 8 frames @ 0:00/1:10/2:21/3:32/4:43/5:53/7:04/8:15: paint/contrast study (Starry Night with dark spire silhouette) -> grayscale value blockout (3:32, foggy FPS character - "value first") -> strong color accents against desaturated ground (4:43, "FATHER": red sack + orange HUD reticle) -> low-poly bright scene stage (7:04) -> final exposure/tone (8:15, Unity Environment Lighting: Exposure 4.0, Physically Based, tone mapper).
  2. Kyle Banks, "How to Create Beautiful Games in Unity" (229K views, 24:54; youtu.be/1agSNKuAfTM). 8 frames @ 0:00/3:06/9:20/12:27/15:33/18:40/21:47: 9:20 bold value-contrast stylized scene (black trees, white sky, saturated red/green canopies = the visual hook); 15:33 Volume Bloom panel (Threshold 0.56, Intensity 1.54, Scattering 0.7, Tint, Clamp, High Quality Filter, Downscale Half - same family as our frozen 183.6 / 0.72 half-res bloom); 21:47 dark sci-fi hangar, single practicals + rim = mood via lighting. Chapters: 0:50 Art Direction / 1:56 Base Shading / 3:22 Lighting / 11:59 Post Processing / 17:18 Reflections / 18:10 Motion / 21:30 Stylization.
  3. Logged, not fetched (rate limit + over-engineering guard): Garbaj "How To Make Low Poly Models (That Don't Suck)" (949K; youtu.be/7s7uSx18DUc), Juhani Jokinen "How I Design a Spaceship - Hard Surface Concept Art Process" (48K; youtu.be/SIf1VPKm-40 - ship form language, pairs with the I207 Imphenzia notes), lacruzo "Stylized Low Poly Characters in Blender" (1.7M; youtu.be/-XYryP_GU8o), Summer 85 "PS1 Style Graphics in Blender" (youtu.be/5ycmDpYen-4).
- Menu state (carried from I266 02_menu + I270 P7): MENU is fx=off, 15 calls / 244 tris; ship small + centered behind PRESS ENTER (hero-moment candidate G4).
- E20 epic task list (epics.md): "after E20 - G4 menu hero moment (own MENU-camera slice; cuttable), G5 hull-bottom fill (minor; fold into a pass if needed), touch-fallback arc (input device), HP #5 perception (human session)."

## Scope Fit
FIT - 3 art stories + closeout = 4 iterations (I272..I275), docs-only open at I271. All work is art layer only (BY LAYER - render/assets + config tweaks; no core/sim/scoring/replay-data; no salt bump; demo pin structurally untouched, real-UI re-verify at ST-262). Every story uses the proven E9->E20 pipeline (Blender MCP -> GLB -> in-browser A/B -> bloom-band + FX-off floor audits). No new dependencies.

## Cut Option
If E21 slips: ST-261 (menu hero moment, G4) is the designated cuttable slice (named cuttable in the E20 task list) - the arc still lands the value-contrast pass (ST-259, the heart) + ship form / G5 (ST-260). ST-259 lands first and is the core deliverable.

## Deferral
- Touch-fallback arc (input device; own arc).
- HP #5 perception (needs a human play session).
- Further research fetching beyond the 2 grounded videos (rate-limit + over-engineering guard: frames + chapters + the E20-era grounding are sufficient).
- Bloom threshold / parameter change: REJECTED as a change (183.6 threshold + 0.72 are the frozen readability contract; the Banks 15:33 panel is grounding for the existing half-res setup, not a change - documented in the research doc).

## Recommendation
APPROVED. E21 = Art Quality Arc II (value contrast + hero moments), 3 stories (ST-259..261) + ST-262 closeout, gate G21.0. The per-asset accents were tuned in E18-E20; the whole-scene value structure (what reads near-black vs mid vs near-white across skybox/arena/rocks/ship/boss) has never been an explicit pass (Brush step 1 / Banks 9:20), and the MENU has no hero moment (G4). The arc applies the value-first method in a bounded, audit-driven way: measure first, fix only found defects, freeze the protected bands.

## Risks
- R-E21-1 (med) value-contrast rebalance shifts a protected bloom band or the ST-177 FX-off FLOOR 50 -> every story ships the bloom-band + FX-off floor audit table (I263/I268/I269 pattern); the frozen accent list (cockpit 0x59d8ff, ticks 0xdfe9ff@0.9, band 0x4059e0@0.42, flame core 195.8 linEq, threshold 183.6) is unchanged unless a story's A/B shows a defect.
- R-E21-2 (low) ship GLB bloat -> 12 KB budget pin in tests (I253/I257 assetGlbs precedent) + net-zero/small geometry target (I267 vertex-color-only pattern where possible).
- R-E21-3 (low) MENU camera slice changes the MENU frame probe (fx=off 15 calls / 244 tris) -> slice is in-code only (0 KB); probe re-verifies calls/tris at ST-262.
- R-E21-4 (low) demo pin drift -> BY LAYER (I217/I235/I240/I244/I248/I253/I254/I260 precedent); real-UI re-verify at ST-262.

## Changed files or proposed files
Changed (I271, docs-only): production/scope-check-E21.md (new), design/art-direction-research.md (+I271 video grounding + E21 task list), production/epics.md (E20 Result -> CLOSED + E21 block), production/stories.md (+E21 ST-259..262), production/session-state/active.md (header -> I271/E21 opened), production/iterations.md (+I271), CHANGELOG.md (+I271).
Proposed (ST-259): in-code only - skybox canvas stops / arena config tweaks / rock COLOR_0 audit-only; value-graded audit screenshots in .evidence/I272/.
Proposed (ST-260): assets/ship.glb (form + hull-bottom pass, <= 12 KB pin), possibly src/render ship material tweaks; tests/assetGlbs.test.js ship pins.
Proposed (ST-261): src/main.js MENU camera/pose (in-code only, MENU state).

## Gate G21.0
1. Value-contrast pass: per-region luma table before/after (skybox/arena/rocks/ship/boss); every fix audit-justified; protected bands intact (threshold 183.6, FLOOR 50, frozen accents) - bloom-band audit table, FX high/off A/B.
2. Ship form + G5: silhouette reads at 10u value-graded; no dark-flat hull bottom from the follow cam; cockpit 0x59d8ff + bullet accents frozen (invariants); GLB <= 12 KB raw.
3. Menu hero: A/B before/after; MENU frame probe (fx=off calls/tris budget) re-verified; reduced-motion static.
4. Demo pin EXACT via real UI (2169/2220, 11334, 57, 36.15, wave 2).
5. Fresh tests + build + dist in budget (headroom >= 8 KB) + regression green + log audit sequential 1..275.

## Unverified assumptions (labeled separately from evidence)
- The whole-scene value audit will surface at least one concrete, bounded fix (if the audit finds the value structure already healthy, ST-259 shrinks to audit-only + the task-list note - the arc still lands ST-260/ST-261).
- A Blender ship form pass within the 12 KB pin + node-name contract is achievable (I267 net-zero pattern for color-only parts; if form changes blow the budget, the story falls back to the vertex-color hull-bottom fill only and the form upgrade is deferred with evidence).
- A MENU camera drift (in-code) will produce the hero read without new draw calls (verified at ST-261/ST-262 by the MENU frame probe).

## Verification evidence
- Docs-only open: 809/809 + build exit 0 re-run at I271 (unchanged by construction).
- All frozen-constant facts re-read from src/core/config.js + the I270 probe record this session.
- YouTube grounding: 2 videos, 16 frames + chapters captured (this session); transcripts: one bounded retry extended the caption pause to 900 s (guard applied - not retried; grounding = frames + chapters + the E20-era notes).

## Next owner or decision
I272 = ST-259 value-contrast world pass (cgs-dev-story; in-code, audit-first). No human decision required; perception verdicts are in-browser A/B + luma tables at the stories.
