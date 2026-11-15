# Scope Check - E53 Glow & Read (cgs-scope-check, I423)

## Summary
Bounded, GPU-cheap, video-grounded art/VFX polish epic (the user-suggested art-improvement
carryover from E52 close). Two levers only: (1) a single SHARED soft radial-gradient sprite
for the particle burst pool (in-code, procedural 64x64 CanvasTexture, +0 draw calls) so the
particle cloud reads as glowing points instead of flat hard-edged SQUARE points; (2) a
re-bake of the 3 weak powerup emblems in place (Blender) so every pickup silhouette reads as
a strong iconic faceted shape. No sim / palette / feel / new-asset-type changes. The 4 strong
emblems, the ship, the floor, the skybox, and all rock/comet/boss/enemy art stay exactly as
they are.

## Surface & Evidence
- Particle points: src/render (shared PointsMaterial). Ground truth (I423 headless 1280x720
  SwiftShader, .evidence/I423/particles_square.png): a seeded burst renders as flat hard-edged
  SQUARE points - the no-map PointsMaterial default. This is the prime glow gap.
  GROUND-TRUTH-CONFIRMED (rendered + inspected).
- Powerup emblems: src/render/powerupMesh.js + assets/pu_spread.glb / pu_shield.glb /
  pu_magnet.glb. Ground truth (.evidence/I423/powerups_sheet.png): 3/7 weak (spread=eye-like,
  shield=coin-like, magnet=box-like), 4 strong (bomb/rapid/slowmo/overdrive).
  GROUND-TRUTH-CONFIRMED.
- Enemy art all distinct; rocks/comets/boss CLOSED (E19/E20/E41/E52) - do NOT touch.
  GROUND-TRUTH-CONFIRMED (.evidence/I423/enemies_sheet.png).
- Skybox warm Milky-Way band = I364-INTENTIONAL (git log I230 -> I277 -> I293 -> I316 -> I364),
  NOT a defect. Do NOT fix. VERIFIED via git log.
- YouTube grounding (2 searches 36 raw / 3 fetches; guard: do NOT retry these 3 ids): tissue
  inu PMZ7yBwleik (a single soft sprite is the standard); Tvtig cvQiQglPI18 (Fade+Multiply+
  color-ramp+compact-burst recipe); Made by Doodle hZiw2P3e_mk (one strong iconic faceted
  shape per pickup). UNVERIFIED-BY-PLAY (watched/read, not implemented) - method grounding.

## Scope Fit
- Fits the art-improvement carryover exactly: 2 bounded levers, both video-grounded, both
  cheap. Does NOT expand: no new asset types, no palette change, no per-particle variety, no
  new bloom params, no re-open of closed art (ship/floor/skybox/rock/comet/boss/enemy).
- GPU-cheap: CONFIRMED (in-code sprite +0 draw calls; 3 in-place GLB re-bakes within existing
  byte/tri budgets).

## Pre-registered Cut Option
- ST-395 is DESIGNATED CUTTABLE: if a re-baked emblem grayscale-clay silhouette A/B does NOT
  clearly read DIFFERENT + improved at gameplay scale, CUT that emblem (ship unchanged,
  docs-only). The epic still closes. Pre-registered now so it is never a silent scope slip.
- ST-394 is NOT cuttable (in-code, +0 draw calls, trivially cheap) - but if the A/B does not
  read softer, we revert the size/enable to the pre-E53 value and re-open the question at
  milestone review (no silent keep).

## Deferrals (carried, not in E53)
- Per-hit impact SFX (audio epic).
- E49 i18n tail + touch fallback.
- Flyer decay unification (flyer.js:74).
- AGENTS.md five-GLBs doc-drift note (AGENTS.md still says five Blender-made GLBs but there
  are now 24 - fix in a bookkeeping pass, not here).

## Stories (budget I423..I426, gate G53.0 at I426)
- ST-393 (I423) - OPEN E53: ground truth + YouTube grounding + scope-check + stories.
  DOCS-only.
- ST-394 (I424) - Soft particle sprite (in-code, cgs-dev-story). Budget ~+1-2 KB, +0 draw
  calls.
- ST-395 (I425) - Re-bake 3 weak emblems in place (Blender, cgs-dev-story + cgs-asset-spec +
  blender-asset-qa). Budget ~+3-5 KB total (3 GLBs in place, within existing emblem budgets).
- ST-396 (I426) - Fresh R1-R5 + G53.0 gate + milestone review + close (cgs-regression-suite +
  cgs-gate-check + cgs-milestone-review). DOCS-only.

## Re-pin plan (pre-registered; NEVER silent)
- Expect ZERO movement of: playframe (L 21/366 + P 10/180 + B 50/1222), causal p1 (seed 9876
  11334/57/W2/combo15/shots198/acc 0.2878787878787879/36.14999999999923s/replay 2169-2220/
  speed4/MENU), rockab (2.2/1.3/0.7 reseed 30201), PWA 11/11. ST-394 is +0 draw calls and the
  sprite does not change sim, so playframe/p1/rockab must stay EXACT.
- The ONLY pins that may re-pin are the assetGlbs per-file byte/tri/facet pins for
  pu_spread / pu_shield / pu_magnet, and ONLY if the re-bake changes them - each written
  EXPLICITLY old -> new (never silent). BUDGETS.emblem = 60 tris stays; max extent stays
  within 15% of EMBLEM_TARGETS; the exactly-one-primitive grayscale COLOR_0 guard stays.
- Total headroom: 111,173 B >= 102,400 B floor. E53 total cost ~+3-5 KB << headroom. If any
  re-pin pushes dist under the floor, STOP and re-scope (pre-registered, not silent).

## Verification Plan
- ST-394: partshot.mjs A/B (square vs soft, same seeded burst) reads clearly softer; the bloom
  threshold 0.72 (183.6 linear, FROZEN) crosser check runs BOTH directions (the soft sprite
  lowers peak per-point luma -> confirm no new crossers appear or vanish). +0 draw calls
  asserted via renderer.info.
- ST-395: grayscale-clay silhouette A/B (old vs new, gameplay scale) reads clearly DIFFERENT +
  improved; in-game tinted A/B; assetGlbs.test.js byte/tri/facet/extent guards all green (any
  re-pin explicit).
- ST-396: fresh R1-R5 + G53.0 + milestone review.

## Risks
- Soft sprite size retune could change the perceived particle footprint -> keep the A/B gate,
  tune size to match the pre-E53 footprint, document the final size value.
- A re-baked emblem silhouette could be weaker than the current one -> pre-registered CUT
  (ship unchanged).
- A re-bake could silently change a facet pin -> assetGlbs guards catch it; re-pin only
  explicit.

## Recommendation
SHIP - E53 is bounded, GPU-cheap, video-grounded, and directly answers the user-suggested
art carryover with exactly the two levers the ground truth shows as weak (flat square
particles + 3 weak pickup emblems). No sim/palette/feel risk.

## Changed files or proposed files
- I423 (DOCS-only): design/art-direction-research.md, production/scope-check-E53.md (new),
  CHANGELOG.md, production/iterations.md, production/stories.md, production/epics.md,
  production/timeline.md, production/session-state/active.md. Zero src, zero assets.
- I424 (ST-394, in-code): src/render (particle material), src/core/config.js (fx sub-block),
  tests (sprite pin). Zero assets.
- I425 (ST-395, Blender): assets/pu_spread.glb, assets/pu_shield.glb, assets/pu_magnet.glb
  (in place), src/render/powerupMesh.js (silhouette-match fallback geos),
  tests/assetGlbs.test.js (explicit re-pins only if changed).

## Verification evidence
- I423 (this iteration, DOCS-only): 971/971 tests green (npm test -> scripts/run-tests.mjs);
  build 0 (npm run build); dist byte-identical 138 files / 1,985,979 B (zero src/assets
  touched); vendor sha256-16 76DEA8151BC9352A; hygiene (0 listeners 5173/4173/5199, 0
  chrome, 0 orphan serve.mjs). Ground-truth screenshots + 3 fetches on file in .evidence/
  I423/.

## Next owner or decision
- I424 = ST-394 (soft particle sprite), cgs-dev-story (re-read the skill FIRST - standing
  order).
## Verification evidence (appended I426 at close)
- I423 (ST-393): ground truth (I423 headless: particles_square.png = prime gap; powerups 3/7 weak emblems spread/shield/magnet; 4 strong; enemies distinct; skybox warm band I364-intentional) + YouTube grounding (2 searches 36 raw / 3 fetches: tissue inu single-soft-sprite + Tvtig Fade/Multiply/compact-burst + Made by Doodle one-iconic-shape-per-pickup) + scope-check + stories. 971/971 + dist byte-identical 138/1,985,979 B.
- I424 (ST-394): 64x64 soft radial CanvasTexture on the existing PointsMaterial via map + size 0.52; CONFIG.fx.particleSprite sub-block; scope = whole shared particle pool, one material, +0 draw calls, no sim change. A/B (soft round dots vs flat square) + crosser vs frozen 0.72 bloom threshold both directions (samePeak 255, noNewCrossers); +0 draw calls PROVEN (focused interleaved-render probe: per-frame delta EXACTLY +8 calls/+180 tris/+512 pts in BOTH states). 971->972 EXPLICIT +1 test. 972/972 + dist 138/1,986,536 B (+557 B, headroom 110,616 B).
- I425 (ST-395): powerup_spread.glb 6628B/48t trident prism (was eye), powerup_shield.glb 3396->7536B/56t hex ring + core r=0.245 (was coin), powerup_magnet.glb 5256->5116B/36t horseshoe U-prism (was box); same VR_PU_* node+mat names, 1 primitive each, UV-free by design. Explicit re-pin (pre-registered, never silent): PU_FACET spread 0.712/0.828/1.161 -> 0.3271/0.6364/1.1556, shield 0.615/1.250/1.250 -> 0.3374/0.3911/1.1793, magnet 0.580/1.000/1.250 -> 0.3271/0.7265/1.250. powerupMesh.js fallback geos silhouette-matched (I211 contract); identity colors FROZEN. blender-asset-qa RUN + PASS; CG A/B SHIP x3 (no CUT). 972/972 + dist 138/1,990,546 B (+4,010 B, headroom 106,606 B >= 102,400 B floor).
- I426 (ST-396): fresh R1-R5 all EXACT/green (regression-report.md Round G53.0) -> G53.0 PASS -> E53 CLOSED 4/4. Zero silent re-pins; playframe/p1/rockab/PWA all EXACT; headroom 106,606 B >= 102,400 B floor.
