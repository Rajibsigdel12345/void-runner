# Scope Check - E15: Visual Identity & Presentation Arc (I242)

## Summary
E14 closed at I241 (G14.0 PASS). E15 picks up the user standing suggestion from the carryover
list - improve the art (with research -> task list) - as a bounded visual-identity arc. Three
unowned presentation levers were verified in code at I242: (1) the renderer boots on three.js
DEFAULTS (src/main.js:64 - no tone mapping, no explicit output color space, no exposure),
the scene-wide look lever the genre three.js post-processing line points at, and the right
tool for the I230 skybox warm-brown-cast note ("revisit on playtest"); (2) ship.glb is the
oldest asset (E9, pre-IBL, 5040 B) and the most-seen mesh on screen - a silhouette-first hero
pass is owed; (3) the kill FX is a single pooled particle cloud - no shockwave/spark layering
(the genre VFX reference layers sparks + shockwave + debris). All three stories are render/
asset layer ONLY - the demo pin is structurally untouched (I217/I235/I240 precedent) and the
daily run needs no salt bump (no core changes; the daily, like the demo, is wave 1-2). 4
stories + gate G15.0 over 4 iterations (I243..I246): ST-236 renderer color/tone pipeline,
ST-237 ship hero pass (Blender), ST-238 explosion layering pass, ST-239 regression + G15.0 +
closeout. No new dependencies; every story bot-verifiable (A/B screenshots + spot checks, frame
probes, dist budget, asset audits, NaN checks, console 0/0).

## YouTube grounding (I242: 5 queries / 42 unique; metadata + chapters + descriptions; transcripts rate-limited - Coverage note at the end)
1. Wael Yasmina, "How To Create Realistic Scenes In Three.js - Tone Mapping, HDR, Gamma
   Correction, sRGB Color Space" (45K views, 2022-11; youtu.be/6XvqaokjuYU): tone mapping is
   the scene-wide look lever - it shapes how emissives, skybox and rock faces read TOGETHER;
   explicit sRGB output + exposure are part of the same pipeline. Takeaway: one config block,
   one A/B matrix, no per-asset re-tuning.
2. Wael Yasmina, "Unreal Bloom Pass - Three.js Post-Processing Tutorial" (19K, 2022-11;
   youtu.be/ZtK70Tb9uqg) + "Unreal Bloom Selective - Three.js" (14K, 2023-11; youtu.be/
   VTKi70bCVwQ): the project already runs the half-res bloom (I217); SELECTIVE bloom (layer
   masking) is explicitly OUT OF SCOPE - the masking cost is not justified in an arcade with a
   0.72 threshold already tuned to the emissive set.
3. Imphenzia, "Let's Model a SPACESHIP in 10 MINUTES in Blender 2.81 - ep. 1" (335K, 2020-11;
   youtu.be/IVXuPJuAMJ4) + "Low Poly Modular Spaceships in Blender 2.8" (125K, 2019-11;
   youtu.be/vZe00W_WDq0): silhouette-first low-poly modeling - the ship reads from a fixed
   top-down-ish camera, so the SILHOUETTE (not surface detail) is the lever; engine nozzles
   give the I213 trail a visible origin.
4. Brackeys, "How to make VFX in Godot" (288K views, 2026-02; youtu.be/htRjt505sPg; chapter
   map: Layers 2:30, Particle System 4:47, 3D Explosions 10:08, Smoke 13:26, Sparks /
   Shockwave / Debris 17:26, Blend Modes and Billboarding 23:09): the explosion layering
   recipe = sparks + shockwave + debris. The project already has the particle cloud (sparks)
   + debris chunks (ST-024); the missing layer is the SHOCKWAVE (short expanding ring).
5. Synty Studios, "POLYGON War Pack" (301K) + "POLYGON Town Pack" (77K) (2018; youtu.be/
   y3F8F4Bt7kQ / 6fd2c5ePT98): low-poly family consistency - every asset in the set should
   read as the same family (the ship rebuild must not break the 18-asset family).
6. Lost Relic Games, "5 GREAT Game Art Styles for BAD Artists" (331K, 2020-11) + Miziziziz,
   "Indie Game Art: Style By Necessity" (182K, 2023-11; youtu.be/IgJBLXBG1Yc): style by
   necessity - the budget (<=120 tris / <=3 mats per small asset) IS the style; consistency
   beats per-asset detail.

## Scope Fit
- All 3 implementation stories are render/asset layer ONLY. Zero core simulation changes ->
  the demo pin (seed 1909, idx 2169/2220, score 11334, 57 kills, wave 2, t 36.15) is
  structurally untouched - same argument as I217 (post-processing), I235 (stinger GLB +
  skybox re-encode), I240 (flyer GLB). Real-UI re-verify is the ST-239 headline (I246).
- Current-state gaps (verified in code at I242):
  (1) src/main.js:64 `new THREE.WebGLRenderer({ antialias: true, powerPreference:
      "high-performance" })` - no toneMapping / outputColorSpace / exposure anywhere in the
      render layer; three.js defaults (NoToneMapping). The I213 IBL + I217 bloom were tuned
      against that default - the tone pass must A/B against the tuned baseline, not against a
      "more realistic" target.
  (2) ship.glb (5040 B) is the oldest asset (E9 ST-208, pre-I213 IBL); the I213 engine trail
      emits from behind the hull with no nozzle geometry; the ship is the most-seen mesh in
      the frame (follow camera).
  (3) particles.js = one pooled THREE.Points cloud (burst() ring buffer); no shockwave layer;
      the I224 readability rule (no flash/hit-stop on plain kills) still binds.
- Bot-verifiable per story: A/B screenshots (MENU + in-flight, FX high/low/off), skybox
  readability spot check, frame probe (delta ~0 expected - tone mapping is a per-pixel shader
  term; ring = 1 draw call), asset audits (assetPerf), NaN checks, console 0/0, dist budget.
- Budget: ship GLB rebuild staged <= 8 KB gz (current 1.7 KB - large headroom); shockwave ring
  = procedural quad (zero asset cost); tone pass = zero assets. dist headroom at open:
  34.0 KB raw / 16.0 KB gzip (caps 2048/550); story floor >= 8 KB gzip after the arc.
- Player-experience caveat: art perception is ultimately HUMAN-judged (the 10 HUMAN-PENDING
  items are the evidence gap) - the arc is scoped to bot-verifiable levers (A/B matrices,
  readability floors, budgets) and parks final perception judgment as HUMAN-PENDING, not as a
  new blocker.

## Cut Option
- Cut ST-238 (shockwave layering) first if E15 must shrink - ST-236 (tone pipeline) + ST-237
  (ship hero pass) are the identity levers; ST-238 is the additive garnish.
- If still tight, ST-237 shrinks to silhouette-only (no nozzle/emissive node - the trail
  origin stays as-is).

## Deferral
- Music quality (HUMAN-PENDING #5) - perception-heavy, final call needs a human session.
- Hardware remainder (low-end physical device / GPU validation) - needs physical devices
  (checklist in perf-profile.md "## I225").
- Touch fallback (own arc per AGENTS.md "touch-friendly fallback later") - viable next after
  E15 if the user prioritizes it; ST-033 basic touch already exists.
- 10 HUMAN-PENDING perception items (production/bug-triage.md) - parked for a human session.

## Recommendation
APPROVED - E15 Visual Identity & Presentation Arc: 4 stories ST-236..239 over I243..I246,
gate G15.0. Demo-pin-compatible BY LAYER (render/asset only); no daily salt bump (no core
changes). Cut option: ST-238 first, then ST-237 to silhouette-only. Risks R-E15-1..4.

## Risks
- R-E15-1 (med) the tone-mapping shift changes the whole-scene look (skybox, rock faces,
  emissives; the 0.72 bloom threshold was tuned against NoToneMapping) -> A/B screenshot
  matrix (MENU + in-flight x FX high/low/off) + skybox readability spot check (the I230
  warm-cast note is the acceptance hook) + a single CONFIG.render.tone block (one-line
  revert to the current default).
- R-E15-2 (low) the ship rebuild breaks hitFlash / invuln-blink / trail parity -> in-code
  materials kept (the I240 GLB-swap pattern: render swap, material logic untouched), extent
  parity vs the UPDATED procedural fallback, assetPerf audit + extent band test (I240 pattern).
- R-E15-3 (low) the shockwave ring adds draw calls / allocations -> ONE pooled ring mesh
  (reused across kills, no per-frame allocations), additive quad, FX off = 0 rings (I224
  zero-leak rule), motion-gated, frame probe delta ~0.
- R-E15-4 (low) dist budget -> ship GLB staged <= 8 KB gz; headroom floor >= 8 KB gzip after
  the story (baseline at open: 16.0 KB gzip / 34.0 KB raw).

## Changed files or proposed files
- production/scope-check-E15.md (this file, new)
- production/epics.md (+E15 section + risk register R-E15-1..4)
- production/stories.md (+E15 section ST-236..239)
- production/timeline.md (+E15 opened line)
- CHANGELOG.md (+I242)
- production/iterations.md (+I242)
- production/session-state/active.md

## Verification evidence
- Current-state checks (I242): src/main.js:64 renderer boot read (no toneMapping/
  outputColorSpace in the render layer - grep-verified); assets/ listing (ship.glb 5040 B,
  18 GLBs); particles.js structure (single Points cloud, burst() ring buffer); dist at open:
  111 files / 2014.0 raw KB / 534.0 gzip KB (headroom 34.0/16.0).
- Docs-only iteration: npm test 731/731 (unchanged), node scripts/build.mjs exit 0, log audit
  1..242 sequential on disk.

## Coverage note (YouTube)
5 queries / 42 unique results. Transcripts were rate-limited for the whole pass (900 s pause;
no retry per the I207/I223/I227 discipline) - grounding uses metadata + chapter maps +
descriptions only. The chapter maps for the Brackys VFX video and the Imphenzia ship videos
carry the specific levers (3D Explosions 10:08, Sparks/Shockwave/Debris 17:26;
silhouette-first modeling).

## Next owner / decision
- I243: ST-236 (renderer color/tone pipeline; cgs-dev-story). E15 stories scheduled
  I243..I246; gate G15.0 at I246.
