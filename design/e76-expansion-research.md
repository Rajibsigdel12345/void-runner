# E76 "Afterburner" Expansion Research - WebGPU Visual Pass + Enemy Art Remaster + Camera/Cockpit Feel (I556, ST-522)

Authored under cgs-research. Companion to production/scope-check-E76.md.
ST-523..ST-528 do not start until this doc lands. Research items below are
LABELED (source + locator) and are NOT tree-verified; the live-tree numbers
cited in sec.1 ARE tree-verified this iteration (git log, config audit, vendor
listing, code reads, fleet re-measure via the I555 algorithm, I556).

## User request (verbatim, standing queue)

- "if having the webgpu allows for the better visuals support then please do that also ok there are alot of visual improvement."
- "improve the art element of the game ... do the research ... look up the reference images and the videos on how the characters can be modeled. not only the character modeling skill but also the choices of the character model."
- "the new enemies type donot look like good assets you can model other spacesheeps"
- "improvement on the camera angles when the player goes to the very far it cannot see all the way back can it not be like same view angle wherever the ship moves" (E75/I549 measured: see-behind RESOLVED - dolly/FOV consistency across distance = the residual, MEASURE before claiming)
- "in the cockpit view, you could show like some portion of the ship to the player to really feel the person is sitting in the cockpit and replace that line with the crosshair" (bow-in-frame I550 + crosshair I529 SHIPPED - residual = dashboard depth + view-relative control feel)
- "watch as much content as you can and extract only the useful ones in the reference and your knowledge base so that you donot have to invent or search for things to improve so hard to overengineer the game."

## 1. Measured current state (tree-verified, I556)

- git: local main = origin main = 7ec0f26 (I555, E75 CLOSED 5/5; pushed by
  delegate, ls-remote verified). Pages deploy run for 7ec0f26 completed
  success BUT the site 404s (Pages disabled on the repo - Settings -> Pages
  must be switched to GitHub Actions source; option C in force: local main =
  stable).
- dist 6,341,033 B / 196 files; ceiling 7,400,000 B (E75 renegotiation, in
  force); CLOSE FLOOR E75 = 1,058,967 B (measured at G75.0).
- npm test 1,228/1,228; npm run build 0; vendor r187 4/4
  (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- Fleet re-measured I556 (I555 algorithm): 34 GLB / 3,970,784 B (3,877.72 KB)
  / geo 3,899,694 B / 90,737 t / maxFile ship.glb 740,012 B. Caps 3,900 KB /
  90,800 t -> PASS with headroom 20,896 B / 63 t (tight - D5 must renegotiate
  WITH MEASUREMENT before adding any tris).
- Campaign: 5 levels (L5 'Zenith Spire' 440 u, 4 checkpoints, final boss 'the
  Archon' 175 hp / 3 phases / 3400). Ship v7 "warship airship" 32,499 t /
  740,012 B. Rocks v12 displacement 443,656 B.
- Pins (all EXACT at G75.0, I555): causal495 (3 arms, seed-9876) + causal483
  + playframe A 22/32,717 + 11/180, B 52/73,172 + pwa491 SUMMARY 11/11.

### 1.1 Camera/cockpit audit (code-verified, I556)

- Chase (config.js + main.js L1377): fov = fovBase 60 + fovSpeed(4) * spdFrac
  + fovKick + bossZoomFov(2.5) + warp(2.5) [+ cockpitFovSpeed(9) * spdFrac,
  RM-gated, cockpit only]; camHeight 9 / camBack 13 CONSTANT; edge-aware dolly
  (startFrac 0.55, I445); camRoll 0.22.
- Cockpit (config.js): height 1.02 / setback 0.15 / lookFar 60 / lookSpeed 40
  (speed look-ahead, I477) / lookDrop 4.0 (I550 G-c, bow in frame) / fovSpeed
  9 (RM-gated seat kick).
- Control mapping (input.js L80-86 + ship.js L54-57 + cameraModel.js L143-148,
  read this iteration): W -> thrust (0,-1); cockpitThrust maps it to
  (cos aim, sin aim) = EXACTLY ship.forward(); S -> -forward; A/D -> +/-90 deg
  about forward. CONCLUSION: the user-reported "W moves back / S moves forward"
  inversion is NOT present in the current tree (I504/ST-470 shipped
  camera-relative WASD; I549 measured "W moves back" REFUTED). Verified by
  code read + prior measurement, not assumed.
- RESIDUAL C-1 (measurable, genuine): in cockpit, ship.aim EASES toward
  aimPoint (ship.aimEase damping, ship.js L46-48) and W/S/A/D follow the DAMPED
  nose, not the look target. While the pilot swings the view (mouse/aim),
  motion lags the view by the aimEase constant -> "controls don't match" feel.
  Fix candidate: in cockpit mode, map thrust to the aimPoint direction
  (undamped look direction) instead of the damped nose. Pure function,
  unit-testable; the scripted-intent path (harnesses) bypasses this mapping
  (main.js L1028 comment) -> causal pins stay EXACT.
- RESIDUAL C-2 (measurable): no speed-responsive dolly/FOV beyond fovSpeed 4
  (CAM-1 reference: zoom IN on brake, zoom OUT on boost) and no measured
  proof that the chase framing offset is constant in rail-local space across
  all 5 levels (the "same view angle wherever the ship moves" ask - MEASURE,
  don't assume; I549's ship-NDC harness is the pattern, extended to all levels).
- RESIDUAL C-3: cockpit dashboard depth - cockpit currently has the bearing
  strip (ST-444, DOM canvas, 0 scene draw calls) + center-dot crosshair (I529/
  I504) + bow in frame (I550). NO speed/hull/shield gauges -> the "really feel
  the person is sitting in the cockpit" ask is the residual (HUD-1).

### 1.2 WebGPU arm audit (measured, vendor/ listing I556)

- Vendored r187 ALREADY ships the TSL display nodes needed for D1/D2
  (vendor/jsm/tsl/display/, sizes measured): BloomNode 17,230 B, GodraysNode
  16,210 B, DepthOfFieldNode 15,329 B, LensflareNode 8,225 B,
  ChromaticAberrationNode 4,688 B, FilmNode 2,318 B, radialBlur 2,950 B,
  GaussianBlurNode 11,001 B, FXAANode 9,283 B, TAAUNode 22,564 B, SSAO/GTAO/
  Outline/SSR/SMAA also present. All inside the ALREADY-VENDORED + PINNED
  three.tsl.js (1,065,544 B) / three.webgpu.js (1,350,894 B) -> ZERO vendor
  growth, ZERO dist vendor growth.
- In-tree webgpu arm (measured): src/render/webgpuFx.js 7,543 B + fxArm.js
  1,596 B + tslMaterials.js 1,720 B (minimal: arm plumbing + first TSL
  materials) + bloom.js 2,635 B / gradePass.js 3,230 B on the WebGL arm.
- Arm policy (FROZEN): default = classic WebGLRenderer (I495 C3 measured
  decision); ?fx=webgl frozen classic reference; ?fx=webgpu experimental
  opt-in. causal495's webgpu arm is REPORT-ONLY (not pinned) -> webgpu-arm-
  only FX are pin-safe by construction (sec.5).

### 1.3 Enemy art audit (measured fleet, I556)

13 enemy ships, 34,182 t total:
- E68 legacy-4 (I508): stinger 1,732 / drone 1,516 / warden 1,556 / flyer 1,770
- E68 remaster-4 (I509): hunter 3,366 / gunship 2,596 / sentry 2,934 / wasp 4,020
- E69 (I516/I517): phantom 2,336 / hauler 3,506 / bulwark 2,700
- E75 (I552): sweeper 3,006 / beacon 3,144
User complaint ("the new enemies type donot look like good assets") points at
the NEWER batches (E69 + E75, the last two remaster rounds). D5 pre-registered
selection rule: ST-527 runs the E72 render-audit + sil96 on all 13 ships and
picks the 3 weakest among the 5 newest (phantom/hauler/bulwark/sweeper/beacon),
with a tie-break toward the lowest sil96 fill.

## 2. Labeled research (NOT tree-verified)

### ART-x (enemy greebling / silhouette)
- ART-1 (YouTube i5ECRTukJOw, NIIMA "The Secret to Cool Sci-Fi Detail?
  Greebles", 3:21, transcript 0:00/1:04/2:08): greebles = "random details or
  models, props that are added to otherwise plain geometries to add visual
  interest and sense of realism ... can suggest the presence of complex
  machinery, wiring". THREE greeble families: (a) paneling (flat, simple),
  (b) mechanical components (units ON panels), (c) cabling/wiring.
- ART-2 (YouTube dncRHH9f6MI, Adam Savage's Tested "The Universal Greeblie",
  384K, 0:43/1:47): parts-tree doctrine - a SMALL set of reusable detail
  meshes placed in clusters; ILM scanned kit parts for Star Wars ships;
  "it kicks a little bit of light ... it adds a little bit of scale" - detail
  density is a SCALE cue.
- ART-3 (YouTube 5MxWt1Sea8Q, Chipp Walters "Creating a Spaceship in Blender:
  A Mini-Course", 124K, chapters 3:00-11:30): hull PLATING (plate generators)
  + microdisplacement + bump materials - plating reads as structure before
  greebles read as detail.
- ART-4 (YouTube PmuqVrzj7bY, Jack Keddy "Sci Fi Space Battleship Episode 2:
  Hull Plating and Greebling", 34:15): plating + greebling pass on a hero
  battleship (workflow confirmation).
- ART-5 (YouTube YwshYBmHlN0, wizawhat "I Played EVERY Star Fox Game", 154K,
  1:51:01; passages 11:24 + 1:33:33): "the visuals got the job done ... any
  more detail is often lost between the fast pace of play and the myriad of
  enemies displayed on screen" -> at enemy scale, SILHOUETTE CLARITY +
  readable banding OUTRANK surface detail; boss design confirmed: "carefully
  orient the [ship] into a position that can safely target its weak point"
  (validates the Archon posture/weak-point cycle shipped in E75).
- ART-6 (synthesis, house): the D5 remaster = stronger BASE SILHOUETTE first
  (ART-3 plating), then the THREE-family greebling (ART-1) from a SHARED
  greeble parts-tree reused across the 3 ships (ART-2) - one Blender script,
  3 exports. sil96 continuity within +/-15% of the original (spawn/fairness
  continuity; measured per ship at ST-527).

### WEBGPU-x (TSL / WebGPU visual pass)
- WEBGPU-1 (YouTube 73quCt_NQMA, arya3d "TSL :: An Overview Of Three.js
  Shading Language", 9.1K, 16:18, transcript 2:38-7:55): TSL = node-based JS
  transpiled to WGSL (WebGPU) or GLSL (WebGL) by the same source;
  MeshPhysicalNodeMaterial accepts TSL nodes for color/position; compute
  shaders + storage buffers do GPU-driven instancing. CAVEAT: the functional
  syntax gets dense fast -> keep each TSL material SMALL and isolated
  (one node graph per concern, memoized once, never per-frame).
- WEBGPU-2 (YouTube 7oLgEV9ih1M, Yoa 3D "How to Fix the Bloom in Three.js
  Using TSL and R3F", 8:08, transcript 0:07/2:50/6:14): three.js' built-in
  bloom add-on (TSL BloomNode; "post-processing" before r183) has a HARD
  luminance cutoff -> soft knee = luminance = dot(rgb, [0.2126, 0.7152,
  0.0722]), mask = smoothstep(kneeStart, kneeEnd, luminance), multiply the
  pre-bloom texture by the mask. SELECTIVE bloom without a second camera:
  setMRT on the scene pass (MRT node + second output channel). The
  emissive-intensity HDR trick fails when two same-colored objects need
  different bloom treatment.
- WEBGPU-3 (YouTube GVBO8i7oR9A, goodTSL "TSL Volumetric Clouds using
  Raymarching", 12:40, transcript 1:12/3:17/9:06): TSL FN +
  MeshBasicNodeMaterial for volume passes; MUTABLE shader variables MUST be
  wrapped in var() (bare let = constant, a rookie death trap); frontFacing()
  to switch behavior outside/inside a volume; DITHERING: randomize the march
  start by screen-UV hash within one step size -> kills banding at low sample
  counts ("the ultimate graphic trick for trading low cost for high quality");
  HARD-CAP DPR (1-1.5) for expensive effects.
- WEBGPU-4 (YouTube iO-P2gEuOUc, Cortiz "Making 60,000 Particles Feel Alive
  (TSL + WebGPU)", 3K, 20:39-ish, transcript 0:49-7:24): GLB surface
  sampling (samples per triangle proportional to area + per-sample NORMAL) ->
  instanced low-poly spheres; WRAPPED DIFFUSE computed in the shader (no
  scene lights): the wrap parameter pushes light into the shadow side = soft
  holographic falloff; noise displacement ALONG THE SURFACE NORMAL keeps the
  silhouette readable; two-layer glow (proximity halo + velocity-driven
  trail) + bloom on top.
- WEBGPU-5 (measured, vendor/ I556 - see 1.2): every node D1/D2 needs is
  already vendored + pinned. Zero vendor growth.
- WEBGPU-6 (house risk note): TSL material swaps change shader PROGRAM count
  but not scene draw calls or triangles -> playframe pin (draw calls + tris)
  unaffected; the webgpu arm is report-only on causal495 -> no pin moves;
  the WebGL/default arms stay bit-identical (fxArm gating, E66/I495 pattern).

### CAM-x (camera feel)
- CAM-1 (YouTube JVbr7osMYTo, Mix and Jam "Recreating Star Fox's Rail
  Movement", 105K, 5:26, transcript 0:32-3:40): the rail PARENT holds camera
  + player with a FIXED offset -> identical view geometry at every point of
  the rail; the player is CLAMPED in parent-local screen space; the ship Z-
  rolls with horizontal input; camera = damped follow + clamp; SPEED ->
  CAMERA: "zoom in on the brake and zoom out on the boost"; FX grammar: engine
  exhaust, boost trail + one-shot burst, wing trails, barrel-roll burst;
  post: bloom + DOF.
- CAM-2 (synthesis): our flightPath.js rail IS CAM-1's rail parent (ship rides
  the path; chase camera keeps a fixed local offset - the E62 invariants).
  Residuals = (a) no speed-responsive dolly/FOV (C-2), (b) no MEASURED proof
  the framing offset is constant in rail-local space across all 5 levels ->
  D3a extends the I549 ship-NDC harness to all levels; fix ONLY measured gaps
  (E75 D1 pattern, K4).

### HUD-x (cockpit depth)
- HUD-1 (YouTube lUplHNimH1M, KSP cockpits walkthrough, 87K, round 1):
  depth-cued instrument panels - multiple gauge planes + panel material +
  edge vignette read as "you are inside a machine".
- HUD-2 (YouTube sp0HTypBDSw, Malogos "Star Citizen HUD" rant, round 1):
  readability > decoration - HUD elements that compete with the fire line
  hurt. Keep gauges in the frame PERIPHERY (bottom corners + bottom center),
  never center-frame.
- HUD-3 (house, I529/I449/I550): cockpit already ships the center-dot
  crosshair (bearing-strip DOM), 4-tick crosshair, bow-in-frame, bearing
  strip. D4 adds speed/hull/shield arc gauges as DOM canvas (the ST-444
  pattern: 0 new scene draw calls), periphery placement (HUD-2), symbol-only
  (no new i18n strings).

### CONTENT-x (enemy placement - OUT of E76 core, recorded for the next epic)
- CONTENT-1 (YouTube YwshYBmHlN0 1:33:33, wizawhat): "this placement of
  enemies ensures that the player only ever has to make micro adjustments to
  their aim" -> campaign spawn lanes should CROSS the flight corridor so the
  player micro-aims instead of repositioning. Candidate for the next content
  epic ("step by step" - the user's own phrasing); NOT in E76 scope.

## 3. Pre-registered deliverables (D1..D6)

- D1 (ST-523): WebGPU-arm TSL material pass - ship: MeshPhysicalNodeMaterial
  (clearcoat + time-pulsed engine EMISSIVE from the existing frozen palette);
  enemies: emissive engine/weapon nodes per ship (palette-gain respected,
  E57 clear); fxArm === 'webgpu' ONLY. Gate: ?fx=webgpu render smoke (single
  tab), playframe EXACT, WebGL/default arms EXACT (causal495 3-arm pin),
  pwa491 11/11.
- D2 (ST-524): WebGPU-arm cinematic post pipeline - soft-knee bloom
  (WEBGPU-2), chromatic aberration + vignette + film grain, engine godrays /
  lens flare (WEBGPU-3 dithering; DPR hard-cap 1.25 for the heavy passes),
  cockpit-only DOF (CUTTABLE, cut ladder C1). Gate: single-tab FPS measured
  before/after (report-only, registered in the iteration block), playframe
  EXACT, pwa491 11/11.
- D3 (ST-525): Camera feel (CAM-x) - (a) NDC framing audit across ALL 5
  levels (I549 harness extended) -> measured constancy report; (b) speed-
  responsive dolly/FOV (brake zoom-in / boost zoom-out, CAM-1) tuned against
  (a); (c) C-1 fix: cockpit thrust follows the UNDAMPED look direction
  (pure function + unit tests; scripted-intent path untouched). Pin-safe
  (no scene geometry change).
- D4 (ST-526): Cockpit depth (HUD-x) - speed/hull/shield arc gauges (DOM
  canvas, 0 scene draw calls, periphery, symbol-only = i18n-free) + verify
  crosshair/bow composition against HUD-2. Pin-safe.
- D5 (ST-527): Enemy remaster round (ART-x) - Blender 5.2.3 HEADLESS: the 3
  ships selected by the 1.3 rule get a stronger base silhouette (ART-3
  plating) + three-family greebling (ART-1) from a shared parts-tree (ART-2).
  Per-ship hard gates: <= 5,500 t AND <= 420,000 B; sil96 continuity +/-15%;
  E72 render-audit gate; fleet caps renegotiated WITH MEASUREMENT at landing
  (pre-registered: tris 90,800 -> 97,000 t; bytes 3,900 KB -> 4,450 KB);
  repin assetGlbs/assetPerf/playframe WITH MEASUREMENT.
- D6 (ST-528): G76.0 close gate - 5 fresh harnesses (ST-527 repins WITH
  MEASUREMENT; all others EXACT no re-pin) + CLOSE FLOOR E76 re-derived WITH
  MEASUREMENT + asset budget re-derived WITH MEASUREMENT + AGENTS.md refresh
  (13-ship fleet + E76 deliverables) + push delegate.

## 4. Story map

- ST-522 (I556) open/research/scope - this doc + production/scope-check-E76.md.
  Docs-only, zero src.
- ST-523 (I557) D1 / ST-524 (I558) D2 / ST-525 (I559) D3 / ST-526 (I560) D4 /
  ST-527 (I561) D5 / ST-528 (I562) D6.

## 5. Pin safety

- causal495/causal483 (seed-9876 pins): D1/D2 = arm-gated render changes
  (webgl + default arms bit-identical); D3c = live-input cockpit mapping only
  (the scripted-intent path bypasses it - main.js L1028 comment + I213 mirror)
  -> EXACT expected every story; D5 asset swap does not touch sim -> EXACT
  (re-pin only the draw/tri pins if in-frustum counts move, WITH MEASUREMENT).
- playframe491 (default arm, draw calls + tris): D1/D2 webgpu-arm-only ->
  EXACT; D3 camera -> EXACT (no scene geometry); D4 DOM -> EXACT; D5 -> re-pin
  WITH MEASUREMENT (the only repin story).
- pwa491: DOM/CSS additions (D4) must not disturb SW/manifest/offline boot ->
  SUMMARY 11/11 every story; any regression BLOCKS.

## 6. dist policy

- Ceiling: KEEP 7,400,000 B (E75 renegotiation, in force). Current 6,341,033
  B. E76 growth: D1-D4 code ~+20-60 KB (the TSL runtime is already in dist);
  D5 assets worst case 3 x 420,000 B - current 3-ship bytes (~524 KB) =
  ~+735 KB; projected dist <= ~7.14 MB -> projected CLOSE FLOOR E76 >= ~540 KB
  >= 102,400 B floor -> NO ceiling renegotiation needed.
- Tripwire: 7,297,600 B (ceiling - 102,400 B floor) -> cut ladder C1..C5.
- Fleet soft caps (measured): renegotiated WITH MEASUREMENT at the D5 landing
  (E69 pattern - pre-registered numbers in 1.3/D5, re-derived from the
  measured landing, not assumed).

## 7. Risks

- K1 TSL API drift vs r187 (mitigation: read the VENDORED node sources
  (vendor/jsm/tsl/display/*.js) before writing any TSL code; fallback = plain
  MeshPhysicalMaterial emissive tweaks, still arm-gated).
- K2 WebGPU perf regression (mitigation: DPR cap 1.25 on heavy passes,
  WEBGPU-3; single-tab FPS measured before/after; report-only, no pin; the
  arm is opt-in).
- K3 D5 repin churn (mitigation: exactly ONE measured repin at the D5
  landing; all other stories EXACT by construction).
- K4 camera "fix" that feels wrong (mitigation: D3a measures first, fix ONLY
  measured gaps - E75 D1 pattern; tuning values registered in the iteration
  block WITH MEASUREMENT).
- K5 dist floor erosion (mitigation: per-ship D5 gates 5,500 t / 420,000 B +
  tripwire + cut ladder C1..C5).
- K6 cockpit thrust change breaks a pin (mitigation: scripted-intent bypass
  verified at main.js L1028; new pure function gets unit tests; causal495
  must stay EXACT).