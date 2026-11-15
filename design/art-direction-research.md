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

## I271 video grounding (E21 art quality arc, YouTube MCP 2026-11-12)

Sources (2 candidates; 16 frames + chapters captured; transcripts: one bounded
retry extended the YouTube caption pause to 900 s, so per the over-engineering
guard they were not retried - the frames + chapters carry the method). These ADD
to the E9-era levers and the I207
grounding above; nothing here re-opens a closed arc's decisions.

1. Thomas Brush, "5 Steps To Gorgeous Game Art" (444K views;
   youtu.be/gTZT8GE5928). 8 frames @ 0:00/1:10/2:21/3:32/4:43/5:53/7:04/8:15.
   The 5-step pipeline as shown: paint/contrast study (Starry Night with a
   dark spire silhouette) -> grayscale value blockout BEFORE color (3:32,
   foggy FPS character - "get the values right first") -> strong color
   accents against desaturated masses (4:43, "FATHER": red sack + orange HUD
   reticle on a desaturated ground) -> low-poly bright scene stage (7:04) ->
   final exposure/tone (8:15, Unity Environment Lighting: Exposure 4.0,
   Physically Based, tone mapper).
Transcript: not fetched (caption pause extended to 900 s on the one bounded
   retry; guard says do not retry sooner - it extends the block). The 8 frames
   above + the step structure carry the method; grounding is sufficient.
   Takeaway for E21: value contrast is the FIRST pass, not the last - block
   the scene to grayscale and fix the value structure before touching any
   color. One strong accent family against desaturated masses beats a
   saturated-everywhere scene (our cyan/orange accent language already
   matches this; the open question is the grayscale structure underneath it).

2. Kyle Banks, "How to Create Beautiful Games in Unity" (229K views, 24:54;
   youtu.be/1agSNKuAfTM). 8 frames @ 0:00/3:06/9:20/12:27/15:33/18:40/21:47.
   Chapters: 0:50 Art Direction / 1:56 Base Shading / 3:22 Lighting /
   11:59 Post Processing / 17:18 Reflections / 18:10 Motion / 21:30
   Stylization. Key frames: 9:20 bold value-contrast stylized scene (black
   trees, white sky, saturated red/green canopies - the "visual hook");
   15:33 Volume Bloom panel (Threshold 0.56, Intensity 1.54, Scattering 0.7,
   Tint, Clamp, High Quality Filter, Downscale Half); 21:47 dark sci-fi
   hangar, single practicals + rim = mood via lighting.
Transcript: not fetched (same rate-limit state as above). The 8 frames +
   the chapter map carry the method; grounding is sufficient.
   Takeaway for E21: bloom is a CONTROLLED accent - the Banks panel is the
   same family as our frozen 0.72 threshold (183.6 linear) + half-res
   setup, which confirms the E9 choice; mood comes from one strong light +
   rim, not from adding lights (our key + fill + rim is already that shape
   - keep it, do not add more lights).

3. Logged, not fetched (rate limit + over-engineering guard): Garbaj "How
   To Make Low Poly Models (That Don't Suck)" (949K; youtu.be/7s7uSx18DUc -
   Blender low-poly rules), Juhani Jokinen "How I Design a Spaceship - Hard
   Surface Concept Art Process" (48K; youtu.be/SIf1VPKm-40 - ship form
   language, pairs with the I207 Imphenzia notes for the ST-260 pass),
   lacruzo "Stylized Low Poly Characters in Blender" (1.7M; youtu.be/-XYryP_GU8o),
   Summer 85 "PS1 Style Graphics in Blender" (youtu.be/5ycmDpYen-4).

Verdict (adds to, does not duplicate, the E9-era levers above): the game
has palette (E18), hero assets (E19), readability polish (E20); what has
never been an explicit pass is the WHOLE-SCENE value-contrast audit
(Brush step 1 / Banks 9:20) - every frozen accent was tuned individually,
but the grayscale distribution across skybox/arena/rocks/ship/boss is
unverified as a structure, and the MENU has no hero moment (G4, carried
from E20). E21 = value-contrast world pass (ST-259) + ship form / G5
hull-bottom (ST-260) + G4 menu hero (ST-261, cuttable). DO NOT change the
frozen 183.6 bloom threshold or the protected bands - the Banks parameters
are grounding for the existing setup, not a change.

## E21 improvement task list (from the I271 grounding)
1. Whole-scene value-contrast audit + bounded fixes (ST-259): grayscale the
   scene in-browser, measure per-region luma (skybox/nebula, arena floor +
   ring, rocks L/M/S, ship, boss), fix only found defects against the frozen
   bands.
2. Ship form + G5 hull-bottom fill (ST-260): Imphenzia/Jokinen hard-surface
   language (I207 + SIf1VPKm-40) - extruded delta volume, recessed faceted
   canopy, thick swept wing plates, no dark-flat bottom.
3. Menu hero moment (ST-261, G4, cuttable): MENU-camera hero framing + slow
   drift (reduced-motion static), in-code only, MENU frame budget intact.
4. NOT taskable (documented rejections): bloom threshold/parameter change
   (frozen readability contract; Banks 15:33 = grounding, not a change),
   new saturated "hook" accents (accent language already cyan/orange;
   readability rule: accents clarify states, never add noise), extra lights
   (single practical + rim is the Banks mood recipe we already follow).


## I276 video grounding (E22 world readability arc III, YouTube MCP 2026-11-12)

Sources (3 candidates; 18 frames + details captured; transcripts skipped per the
rate-limit guard - the E21 precedent holds: frames + chapters carry the method).
These ADD to the E21 grounding (Brush value-first / Banks bloom + mood) and the
E9-era levers; nothing here re-opens a closed arc's decisions.

1. The Observatory, "Fake Rim Lighting [In Blender]" (43K views, 4:35;
   youtu.be/N1REz8rpABE). Frames 0:00/0:45/1:31/2:17/3:03/3:49. The
   material-faked rim recipe: Dot Product node (view direction . normal) ->
   separate/multiply -> Add Shader onto the base material; 2:17 shows the
   Bump-node normal option (we stay on flat per-face normals - stable by
   construction); 3:03/3:49: Dot -> ColorRamp (position = rim threshold,
   scale = rim width) -> Fac.
   Takeaway for E22: our pow(1.0 - dot(N,V), power) in bossMesh.js /
   asteroidRenderer.js is the SAME family (pow = an exponential ColorRamp).
   The power (ramp position/scale) is THE thickness/softness lever: power 5 ->
   7/8 gives a thinner, silhouette-hugging rim instead of flooding faces
   flat-bright-purple (the I272 measured defect at the frozen 0.45 strength).
   The rim COLOR stays the accent (frozen per-variant colors unchanged).

2. Lightning Boy Studio, "Toon Shader Part 6 - Perfect Rim Lights"
   (103K views, 22:53; youtu.be/Qc1kQbF-9Gs). Frames 0:00/3:48/7:37/11:26/
   15:15/19:04. 3:48: strong orange rim reading on a dark toon character
   (rim = the silhouette read, not a face glow); 7:37/11:26: "Rim Light (2d)"
   node group = Lerp + power curve shaping (strength and curve are the two
   levers); 15:15: normal-smoothing/capture pass for a stable rim (flat-shaded
   low-poly faces already give stable per-face normals - no extra pass);
   19:04: viewport/lighting setup.
   Takeaway for E22: rim STRENGTH and rim POWER CURVE are the only two levers;
   both are already in our shader - strength is data-driven (CONFIG.boss.rim
   hull 0.45 / crown 0.30), power is hardcoded 5.0. E22 makes the power
   data-driven too and raises it; strengths are re-tuned only if the A/B
   shows the silhouette still floods.

3. Game Dev Guide, "5 Skybox Methods Every Unity Dev Needs To Know"
   (51K views, 21:45, 2025; youtu.be/Yd0xNTYNfss). Chapters 0:00/1:30/2:27/
   6:36/9:25/14:45/19:14/20:44; frames 0:00/3:37/7:15/10:52/14:30/18:07.
   Method ladder: flat color (frame 0:00 Hue 0.73/Sat 0.40/Val 0.15 = #1C1324
   dark violet - the SAME family as our 0x04060f base) -> gradient -> cubemap
   export (10:52) -> procedural vertex-color sky (14:30/18:07).
   Takeaway for E22: the skybox must fit the visual style. Our 1024x512
   equirect (Blender node-bake v5) sits in the gradient/procedural family and
   its STRUCTURE is healthy (I272: spread 30.4 -> 85.4); the defect is COLOR
   (15.2% warm-cast pixels, E19 flag). A color re-bake in the violet/teal/
   magenta nebula family (structure kept) is the bounded fix. DO NOT adopt a
   new skybox method (cubemap/vertex sky) = over-engineering.

4. Logged, not fetched (rate limit + over-engineering guard): silhouette
   readability is already grounded at E21 (Thomas Brush "5 Steps To Gorgeous
   Game Art" 444K + Kyle Banks "How to Create Beautiful Games in Unity"
   229K) - no extra fetches.

Verdict (adds to, does not duplicate, the E21 grounding): E22 = the three
named I272/E19 deferrals - skybox 15.2% warm-cast re-bake (ST-263, Blender),
rim flood shaping: fresnel power data-driven + raised 5.0 -> 7/8 in boss and
rock shaders (ST-264, in-code, includes the deferred asteroidRenderer
vViewPosition refactor), rock silhouette/value mottle re-bake (ST-265,
Blender COLOR_0, cuttable). DO NOT touch the frozen 183.6 bloom threshold,
the FLOOR 50, or the frozen accent list.

## E22 improvement task list (from the I276 grounding)
1. Skybox 15.2% warm-cast re-bake (ST-263): Blender node-bake v6 of the
   1024x512 equirect - remove the E19-flagged warm/red-brown cast, keep the
   violet/teal/magenta nebula family + existing structure; JPG <= ~64 KB raw;
   no-bloom audit + value-graded before/after.
2. Rim flood shaping (ST-264): fresnel power data-driven in CONFIG (boss
   hull/crown + rock) and raised 5.0 -> 7/8 so the rim hugs the silhouette;
   strengths re-tuned only per A/B (frozen 0.45/0.30/0.12 start); includes
   the deferred asteroidRenderer refactor (drop custom vRimViewPos varying +
   project_vertex injection -> standard vViewPosition fragment-only, the
   I272 boss pattern) + source-invariant tests + rock luma A/B (I257 look
   preserved or deliberately re-tuned).
3. Rock silhouette/value pass (ST-265, CUTTABLE): COLOR_0 mottle re-bake on
   asteroids L/M/S for distance silhouette read at 10u+ (vertex-color only,
   geometry/radii net-zero 8956/3764/3188 B) + in-code rock rim A/B after
   ST-264's shared shaping.
4. NOT taskable (documented rejections): skybox STRUCTURE change (cubemap /
   procedural vertex sky from the Game Dev Guide ladder = over-engineering;
   the color re-bake covers the defect), new rim lights / extra pass
   (strength + power curve are the only levers per Lightning Boy 3:48/7:37;
   flat per-face normals are already stable), further research fetching
   (E21 + I276 grounding is sufficient).


## I419 silhouette-variety grounding (E52 prep, cgs-art-bible slice, YouTube MCP 2026-11-15)

Purpose: ground the E52 lever (a distinct 2nd low-poly silhouette per rock size) and write the
per-size A/B modeling brief. ADDS to the I207/I271/I276 grounding; does not duplicate it (the I207
genre comps already established many-different-rocks-tumbling; this section nails the METHODOLOGY
for authoring distinct silhouettes cheaply + the GPU-cheap confirmation).

### Why this lever (grounded, not invented)
- The shipped GLB rock path renders ONE geometry per size (asteroidRenderer.setGLB ->
  glbGeo[size]), dropping the 3-variant silhouette variety the procedural fallback bakes.
  Every I207 genre comp (Solaroids, Rocket!, Disasteroids, classic Asteroids) reads via many
  DISTINCT rock silhouettes tumbling - silhouette diversity is the genre core art signal.
- The rocks already carry deep craters + bumps (E41 I370: L 5cr+4bump, M/S 4cr+3bump); a relief-
  DEPTH re-bake would duplicate a closed arc. The OPEN lever is silhouette COUNT/CHARACTER.

### Method (I418 YouTube pass; 3 queries, 2026-11-15)
1. August Renders, Make an Asteroid Field in Blender in One Minute! (youtu.be/9p4ZTUvBC9s, 37K).
   icosphere/cube -> subdivide with a FRACTAL value (each rock randomized) -> Array modifier ->
   separate by loose parts. Takeaway: a different subdivision/fractal seed per rock = a different
   silhouette; the base shape is the constant.
2. Blender Artifex, STYLIZED ROCKS In Blender 3D (youtu.be/ygjMX5mSi1Y, 226K). cube -> subdivide
   (5) -> displace (Voronoi) -> dissolve center verts -> cavity. Takeaway: the displace texture
   SEED + SIZE is the silhouette lever; dissolve keeps the mesh clean + low-poly.
3. Grant Abbitt, Low Poly Rocks - Quick and Easy - Detailed (youtu.be/1H2YaRPfpdM, 121K). edge-
   slide + merge + join to build a distinct character by hand. Takeaway: distinct CHARACTERS come
   from a non-uniform overall form (a lopsided mass, a bar-like rock, a chunky blob), not just noise.
4. Rod DeWeese, The Easiest Way to Make Asteroids in Blender (youtu.be/9mfSaP2WFfE, 2026). sphere
   -> Sub-D -> Displace (non-destructive) + a Lattice for overall distortion. Takeaway: a Lattice
   (or a non-uniform object scale) sets the rock overall proportion (elongated vs squat vs bar) so
   two rocks with the same base read clearly different.

### A/B silhouette brief (per size; the ST-390 modeling contract)
- BASE (shared by A and B): an icosphere at the size subdivision (so A and B have the SAME tri
  count -> the per-rock tri count is byte-identical to today, keeping the playframe tri pins
  stable), flat-shaded, origin at the geometric center.
- A = the existing primary (asteroid_L/M/S.glb, the I370 relief re-bake). UNCHANGED in E52.
- B = a NEW distinct silhouette per size, built from the same base with: (a) a DIFFERENT displace
  noise seed (Voronoi/Musgrave) + DIFFERENT noise size/scale (so the crater/ridge LAYOUT is not a
  copy of A); (b) a DIFFERENT non-uniform overall scale / Lattice distortion (L: lopsided chunky
  mass; M: squat bar; S: slightly elongated - a distinct character per size, per Abbitt #3 +
  DeWeese #4); (c) crater insets placed differently from A (inset + push-in, the I207 Sleep Fight
  method); (d) the SAME value-ladder COLOR_0 bake scheme (L darkest / M mid / S lightest, warm
  order R>=G>=B, per-vertex hue jitter, facet-mean brightness preserved) relit to the same I370
  bands, so A and B read as the same MATERIAL family, only different shape.
- Silhouette test (the acceptance gate): with color + emissive removed (grayscale flat clay), B
  must read as a clearly DIFFERENT outline from A at gameplay scale (the Curious Archive
  silhouette-first principle from I207). If it reads like A, re-roll the seed/scale (cut option).

### Palette
- No palette change. B uses the SAME rock material (0x8a7f72 flat + the I257 warm rim 0xd8a878 @
  0.12) and the SAME value-ladder COLOR_0 bands as A (art-bible palette is a contract). B is
  distinguished by SHAPE only (the colorblind/readability rule: shape + value + motion carry the
  read; emissive is an accent, never the separator).

### Asset Constraints (GPU-cheap confirmation)
- Tri budget: B tri count == A per size (L 490, M 134, S 134) -> within the existing BUDGETS
  (L<=500, M<=140, S<=140). The same icosphere subdivision guarantees it.
- Draw calls: +0 (the pool is shared; same rock count; the renderer just picks A or B per rock).
- Materials: +0 (the one shared rock material; B carries COLOR_0 like A).
- File size: each B GLB ~ the primary (L ~18 KB, M/S ~6-7 KB); 3 new GLBs total ~30 KB << the
  133,197 B dist headroom (survives with ~100 KB to spare).
- Textures: none (vertex-color COLOR_0 only; the asset-spec no-image-maps rule stands).
- Naming: VR_Rock (same as A; the B files are separate GLBs but the same VR_Rock material name).

### NOT taskable (documented rejections)
- A 3rd silhouette per size (a 2-variant A/B doubles variety from 1 -> 2 and already reads as
  varied; a 3rd is diminishing returns + more Blender/test surface for no new genre signal).
- Textured / normal-mapped rocks (the flat-shaded low-poly art-bible language; over-engineer).
- Relief-DEPTH re-bake (that is E41 I370, closed; duplicating it is not E52).
- New asset TYPES (comet is the only existing variant type; a crystal rock etc. is scope creep).
- A further displace research pull (the 4 sources above nail the method; E21/I276 precedent: frames
  + method carry the grounding, do not over-fetch).

### Verdict
E52 (ST-390) is a bounded, GPU-cheap, video-grounded Blender pass: author asteroid_L_B/_M_B/_S_B
(2nd distinct silhouette each, same tri count + radii + value-ladder bake + flat-shaded), wire
setGLB to pick A/B by r.variant, add B test entries, confirm the playframe stays EXACT. Not over-
engineered: no sim change, no palette change, no textures, 3 small GLBs + a ~5-line renderer
change. GPU-cheap: CONFIRMED (see Asset Constraints).

## I423 video grounding (E53 prep, cgs-scope-check slice, YouTube MCP 2026-11-15)

Purpose: ground the two E53 levers (a soft particle sprite for the particle cloud; a re-bake
of the 3 weak powerup emblems) and write the per-asset briefs. ADDS to the I207/I271/I276/I419
grounding; does not duplicate it. This is the last open art research slice after E52.

### Why this lever (grounded, not invented)
- I423 headless ground truth (not invented) proves the two gaps open + player-visible: a seeded
  particle burst renders as flat hard-edged SQUARE points (the no-map PointsMaterial default),
  and 3 of 7 powerup emblems (spread=eye, shield=coin, magnet=box) read weak at gameplay scale.
- These are the two remaining open art levers; the ship/floor/skybox/rock/comet/boss/enemy art is
  closed (E41/E52/E19-E20). Do not re-open it.

### Ground truth (I423 screenshots, 2026-11-15, .evidence/I423/)
- particles_square.png: a seeded burst (via __vr.particles.burst + 250 ms) renders as flat square
  points = the prime gap. The cloud IS additive already (a closed lever); the defect is the
  MISSING per-point sprite (a raw Points draw = square gl points).
- powerups_sheet.png (7 emblems): bomb/rapid/slowmo/overdrive read OK; spread = eye-like, shield
  = coin-like, magnet = box-like = the 3 WEAK. enemies_sheet.png: all enemy silhouettes distinct
  (do NOT touch). menu.png clean; the skybox warm Milky-Way band is I364-intentional (git log
  I230 -> I277 -> I293 -> I316 -> I364), NOT a defect.

### Method (I423 YouTube pass; 2 searches / 3 fetches, 2026-11-15; guard: do NOT retry)
1. tissue inu, "Particles with Spritesheet Textures in Godot" (PMZ7yBwleik, 63K, 1:50).
   "I tend to use single sprites as textures"; frame 1:22 = soft glowing white sprite particles.
   Takeaway: a SINGLE soft sprite map is the standard for a point cloud; our no-map Points = the
   defect.
2. Tvtig, "How To Create An Explosion Effect In Unity" (cvQiQglPI18, 99K, 3:39). recipe =
   Particle Standard Unlit + rendering mode FADE + color mode MULTIPLY + color-over-lifetime
   dark->bright/transparent ramp + burst count 3 + compact sphere r~0.35 + start size 2-3.
   Takeaway: soft map + fade + ramp = an "energy read"; keep bursts COMPACT.
3. Made by Doodle, "Game Powerups 3D Illustration - Blender" (hZiw2P3e_mk, 33:08, no captions).
   each pickup = ONE strong iconic shape (Diamond 0:26 / Star 1:25 / Coin 2:06 / Key 4:05 /
   Compass 8:10 / Clock 10:45 / Bomb 13:56 / Bolt 16:05 / Heart 18:26); frame 8:17 hex compass =
   extrude hex + inset + bevel; 24:51 full clay set -> bevel/inset carry the edge read.

### Particle-sprite brief (the ST-394 contract)
- ONE shared soft radial-gradient sprite: a procedural 64x64 CanvasTexture, white center fading to
  a transparent edge (no hard square). Set as the `map` on the EXISTING shared PointsMaterial
  (no new material, no new object = +0 draw calls). Re-tune `size` (size is NOT a frozen pin -
  free to tune in-story; the sprite core is smaller than the full point, so size likely goes UP
  from 0.32 to keep the same visual footprint). Keep the existing additive blending + per-particle
  color + size-attenuation (all closed levers - unchanged).
- A small commented CONFIG.fx particle-sprite sub-block (sprite enable/size) so it is data-driven +
  testable. The FX-off tier already = particleOff:0 (no gating needed).
- Acceptance gate: partshot.mjs A/B (square vs soft, same seeded burst) reads clearly softer; the
  bloom threshold 0.72 (183.6 linear, FROZEN) crosser check runs BOTH directions (the soft sprite
  lowers peak per-point luma -> confirm no NEW crossers appear or vanish).

### Powerup emblem brief (the ST-395 modeling contract)
- ONE strong iconic faceted shape per weak emblem (Made by Doodle method: extrude + inset +
  bevel): spread = a fan / trident (was eye-like); shield = a hex ring + core (was coin-like);
  magnet = a horseshoe (was box-like). Same flat-shaded low-poly language as the other 4 emblems.
- SAME grayscale COLOR_0 facet-value bake (corner-domain, vertex-split, exactly one primitive in
  [0.30,1.25]); SAME extents (max extent within 15% of the EMBLEM_TARGETS pin - the pickup radius
  is CODE-side in game.js, NOT the mesh extent, so verify the code side, not the GLB extent);
  within the existing per-asset byte/tri budgets (emblem <= 60 tris).
- Silhouette-match contract (I211): any re-baked emblem must ALSO update powerupMesh.js TYPES
  fallback geo (currently spread ConeGeometry(0.4,0.75,4) / shield TorusGeometry(0.38,0.12,8,20)
  / magnet SphereGeometry(0.42,16,12)) to match the new silhouette -> no load-pop before the GLB
  arrives.
- CG gate (acceptance): grayscale-clay silhouette A/B (old vs new outline at gameplay scale) must
  read clearly DIFFERENT + improved, + an in-game tinted A/B. If not clearly improved -> CUT that
  emblem (ship unchanged, docs-only); the epic still closes.

### NOT taskable (documented rejections)
- The 4 strong emblems (bomb/rapid/slowmo/overdrive read fine) - no re-bake.
- Per-particle texture variety / a flipbook (a single shared soft sprite is the grounded standard -
  tissue inu; variety is over-engineer for a 512-point pool).
- Ship re-bake (heavily pinned) / floor re-bake (I358 + FLOOR-50) / skybox change (I364
  intentional) / rock-comet-boss-enemy art (closed epics E41/E52/E19-E20).
- Extra lights / new bloom params (frozen 183.6) / a further YouTube pull (the 3 fetches nail both
  levers; I419/E21 precedent: frames + method carry the grounding, do not over-fetch).

### Verdict
E53 (ST-394/ST-395) is a bounded, GPU-cheap, video-grounded art pass: one soft shared particle
sprite (in-code, +0 draw calls) + a re-bake of the 3 weak powerup emblems in place (Blender,
silhouette-match fallback contract, CUTTABLE). Not over-engineered: no sim change, no palette
change, no new asset types, no per-particle variety, no re-open of closed art. GPU-cheap:
CONFIRMED (~+3-5 KB total vs 111,173 B headroom).
