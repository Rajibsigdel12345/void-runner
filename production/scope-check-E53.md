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