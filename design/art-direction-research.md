# Art Direction Research - Void Runner (E9 prep, user suggestion 2026-11-10)

Goal: identify the highest-leverage, performance-safe art improvements for a
procedural three.js arcade space shooter, to feed the E9 Blender phase
(ST-207..216) and any post-E9 polish story. Sources: three.js tips lists,
production WebGL case studies (frame-time breakdowns), threejs-game-studio
technical-art references, shmup game-feel write-ups (2025-2026).

## Where Void Runner stands today
- Procedural geometry + canvas textures only; no post-processing pipeline; no imported models.
- Existing feel layer: screen shake/punch (trauma-decay style), FX tier (off/reduced/full), adaptive quality (measured frame time, not device sniffing), starfield parallax + twinkle, fresnel rim light on rocks (I60).
- Render budget discipline: pooled bullets/particles/rock meshes, shared per-type materials, low draw calls.

## Ranked improvement levers (impact / cost)
1. Half-resolution bloom (HIGH impact, LOW cost). Space games live or die on glow. Render bloom at half res, upscale on composite - ~60% of full-res bloom cost, no visible difference (it is blurry by nature). Biggest single "art" upgrade available; pairs perfectly with the additive particle glow below. Gate behind the FX tier (off under reduced tier) and measure frame time before/after.
2. Additive blending on particle trails (HIGH, ~zero cost). `AdditiveBlending` on explosion/shockwave particles gives free glow and dramatically improves "energy" reads; cost is overdraw only, so tune density against the DENSEST on-screen moment (boss ring + barrage), not the calmest (shmup readability rule: a bullet stream occluded for >0.5 s is a fairness bug).
3. Blender asset pass = the planned E9 (HIGH, MED). GLTF pipeline (ST-207) + ship/rock/boss models (ST-208..211) + skybox/arena ring (ST-212). Research guidance: low-poly (under ~2k tris per rock, KTX2/BasisU if textures grow), one material per family to keep the draw-call budget, bake lighting into vertex colors or a lightmap where static - no realtime point-light shadows (a point-light shadow costs 6 passes).
4. Screen flash + hit-stop hierarchy (MED, LOW). Two-frame white flash (low opacity) on boss kill / bomb nova; 30-50 ms hit-stop on boss Phase 2 entry. Juice must follow meaning: small pickup < rock kill < drone kill < boss phase < boss death. Current shake/punch covers impact; flash + hit-stop add the "something big happened" channel.
5. Lighting/materials (MED, LOW-MED). E9 ST-213 owns this: keep the existing fresnel rim language, add a single key + fill directional (NO shadows on the arena - it is a space void), sRGB output color space + a deliberate tone mapping (ACES or neutral) with exposure tuned for dark-space, emissive materials for power-up orbs and the boss core so bloom (lever 1) has something to grab.
6. Camera/feel (LOW-MED, LOW). Subtle camera lead toward the aim point (2-5%), boss-approach zoom-out of a few degrees, and a slow orbit drift on the menu. Keep the player view stable during normal play (the field must read as stable while dodging).
7. Quality tiers (maintain). Keep the measured-frame-time hysteresis tiers; wire bloom/post into them as the top-tier-only feature set. Cap DPR at 2 (1.5 under load). Never gate by device name.

## Readability rules (from the shmup-feel research)
- Particle density is tuned against the hardest pattern, not the showcase moment.
- Bloom/fog/darkness must never be the PRIMARY separator of threat vs background - shape, color, and motion must carry it (also the accessibility/colorblind rule).
- UI signal colors match world signal colors (already true: HUD cyan/orange = world colors).
- Every effect must clarify a state (phase 2, shield hit, low HP) - reject pure "noise" effects.

## Proposed new story (added to E9 list)
ST-217 | Post-processing polish pass: half-res bloom + additive particle trails + boss-kill flash / phase-2 hit-stop, all gated by the FX tier + adaptive quality; frame-time before/after evidence (browser: measure, screenshot) | browser.
Runs AFTER ST-216 (assets + perf audit) so bloom has real emissive materials to work with and the perf audit baseline is clean.


## I207 video grounding (ST-208+ prep, YouTube MCP 2026-11-10)
Metadata + frames + chapters (transcripts rate-limited at fetch time; queued
for re-fetch - do not extend the block). Sources:

1. Imphenzia, "Let's Model a SPACESHIP in 10 MINUTES in Blender 2.81"
   (335K views; youtu.be/IVXuPJuAMJ4). Frames 3:23 / 6:47 / 10:11. Method:
   box-model an angular delta - extrude the hull from a cube, cut the cockpit
   RECESSED into the hull (never a dome sitting on top), wide flat swept
   wings as separate plates, 2-material scheme (hull + accent stripes).
   Takeaway for ST-208: our current ship's 224-tri UV-sphere cockpit is the
   antithesis of this language - replace with a recessed faceted canopy;
   the 6-tri cone hull is too thin - a proper extruded delta reads at 2x the
   silhouette presence with fewer tris.
2. Imphenzia, "Low Poly Modular Spaceships in Blender 2.8" (125K views;
   youtu.be/vZe00W_WDq0). Frames 4:57 / 9:54 / 14:51. Method: build from
   flat plates + blocks (hull block, wing plates, engine modules), each part
   a simple extrusion; assemble for a readable game-ready ship. Supports the
   ST-208 merge target (hull+fin+wings as one delta mesh + canopy = 2 draw
   calls).
3. Sleep Fight Games, "How to model Low Poly Asteroids in Blender 2.8"
   (youtu.be/tdmcq2wLetQ). Frames 2:39 / 5:19. Method: icosphere -> subdivide
   -> seeded random vertex jitter -> flat shade; crater = select a face,
   inset, push in. Validates our icosphere-base rocks; the ST-209 upgrade
   lever is crater insets + more asymmetric jitter, not a new base shape.
   Thumbnail shows the target read: large faceted asymmetry, gray, a few
   dark facets.
4. Curious Archive, "The Greatest Creature Design Ever" (1.1M views;
   youtu.be/KotQ48nrteg). Chapters 9:29 Shape Language / 11:33 The Power of
   Silhouette. Principle for all E9 models: silhouette-first - every model
   must read at gameplay scale with color/emissive removed.
5. Ansimuz, "Visual Legibility through contrast" (youtu.be/erqhG8MdnMw).
   Supports the existing readability rule in this doc: shape + value +
   motion carry threat; emissive is an accent, never the separator.
6. Genre comps (closest similar games): Solaroids Prologue (classic
   asteroids-style, youtu.be/_EKkVkrn260), Rocket! (arcade asteroid-style,
   youtu.be/L7HqxlgskMg), Disasteroids 3D (OpenGL, youtu.be/Aq2dI5O6s3I),
   2177Studios VOID ECHO (2026 Godot shmup WIP, youtu.be/qElaABSE2x8).
   Common language: flat-shaded low-poly rocks, angular player craft,
   high-contrast emissive accents on dark space - exactly Void Runner's
   current art direction (confirms: refine, don't restyle).

Verdict: the E9 pass is a REFINEMENT of the shipped art direction (same
palette, same flat-shaded low-poly language), targeting: (a) ship silhouette
+ recessed canopy (ST-208), (b) rock crater/asymmetry variety (ST-209),
(c) no restyle of the world. Do not over-engineer: no textures, no rigs,
no morphs (asset-spec.md stands).
