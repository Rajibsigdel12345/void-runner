﻿# Scope Check - E54 Ship Remaster & Asset Realism (cgs-scope-check, I427)

## Summary
Bounded art epic answering the user's I427 directive: remaster the player ship from the
current 112-tri low-poly airship into a detailed "real" space fighter (more detail, more
polygons, "use polygons and gpu resource as much as needed"), make 1-2 other assets more
realistic in Blender (CUTTABLE), and resolve the WebGL->WebGPU switch question with a
documented feasibility verdict (means-not-end: NOT shipped, documented). The MAIN
deliverable is the Blender ship remaster. "Airship" is read loosely = a proper detailed
space fighter (this is an asteroids game; the ship is a small fighter - the YouTube zeppelin
refs confirm the term is used loosely). No sim / palette / feel / identity changes: the
in-code palette tint, the cockpit cyan emissive, the collision box, and the engine-nozzle/
flame alignment all stay. The ship keeps its 3 materials (VR_Ship_Hull/Wing/Cockpit), its
VR_Ship_* node names, and COLOR_0 on EXACTLY hull+wings, so the renderer (useGLB
material-name routing + ensureWhiteColors) is untouched. Grounded in YouTube ship
hard-surface references (silhouette-first + facet value-bake, NOT high-poly sculpting).

## Surface & Evidence
- Player ship: assets/ship.glb (14,472 B / 112 tris / 6 nodes VR_Ship_Cockpit/Engine/Fin/
  Hull/Nozzle/Wings / 3 mats VR_Ship_Hull/Wing/Cockpit / 6 prims, 2 COLOR_0 prims hull+wings
  / extent x=2.44 y=0.70 z=1.722 / grayDev=0 / facet cLo 0.712 cHi 1.55).
  GROUND-TRUTH-CONFIRMED (scanned; .evidence/I425/scan_emblems.cjs).
- Why "small": the 112-tri ship is a DELIBERATE low-poly art choice, NOT a WebGL limit.
  WebGL2 renders thousands of tris trivially (the game already renders 2,784 tris of assets).
  VERIFIED: three.js r160, WebGL2 renderer.
- Renderer name-routing (load-bearing, do NOT break): shipMesh.js useGLB(obj) swaps the
  procedural body for the GLB and overrides materials BY MATERIAL NAME (Cockpit->cockpitMat,
  Wing->wingMat, else->bodyMat) + ensureWhiteColors on any geo lacking COLOR_0. assetGlbs
  facet keys off MESH/PRIM names ('VR_Ship_Hull.001'/'VR_Ship_Hull',
  'VR_Ship_Wings.001'/'VR_Ship_Wings'). Keep these names + COLOR_0 on exactly hull+wings.
- YouTube grounding (4 queries 32 raw; guard: do NOT retry PMZ7yBwleik/cvQiQglPI18/
  hZiw2P3e_mk - those are the E53 emblems set): k2vTtHj0MME Aaron Van de Weijenberg "Easy
  hard surface sci-fi panels in Blender" (panel insets WITHOUT booleans: loop tools ->
  inset/outset; rounded corners; final subdiv); YD9u-5h9_3Q Blender Secrets "Easy
  Non-Destructive Panel Cuts"; L0752ooFmU0 "complex panel lines"; -3Hk2SinqC0 Alexander
  House "Spaceship Design Part 1: Research" (design-first: considerations -> references ->
  layout); -nVxal4WVZk Meto Petkov "Cargo Hauler Blockout" ("block the big parts to get a
  silhouette before committing"). Airship/zeppelin (confirms loose term): 9siC1ngnJVg,
  MDSTyRTXryQ. UNVERIFIED-BY-PLAY (watched/read, not implemented) - method grounding.
  Takeaway: detail that reads at gameplay scale = strong SILHOUETTE (distinct nose/wings/
  tail/nacelles) + a few hard-surface panel insets + facet value bake. NOT high-subdiv
  sculpting and NOT texture-dependent detail (conflicts with the UV-free value-bake pipeline
  + low-poly game aesthetic).
- Other assets (for the CUTTABLE realism pass): rocks A+B + comet CLOSED (E52), boss CLOSED,
  enemies all distinct (E19/E20, do NOT touch), floor/skybox/menu hero CLOSED (E53). The only
  candidates still open for realism are the BOSS (large, hero-scale, currently low-poly)
  and/or the ARENA ring - scope ST-400 to pick ONE at bake time.

## Scope Fit
- Fits the directive exactly: (1) the ship remaster is the named main deliverable, (2)
  other-asset realism is the named secondary (bounded to 1 asset, CUTTABLE), (3) WebGPU is a
  feasibility probe (means-not-end), not a shipping goal.
- Does NOT expand: no new asset TYPES, no palette/identity change, no sim/feel/balance
  change, no re-open of closed art (rock/comet/enemy/floor/skybox/menu hero).
- "As much as needed" (user) is honored as a bounded DETAILED-LOW-POLY target (~800-1400
  tris, sweet spot ~900-1200) - a real fighter, NOT a high-poly sculpt (the grounding says
  high-subdiv would not read better at gameplay scale and would break the UV-free pipeline).

## Budget decision (the crux; pre-registered)
Current ship 112 tris / 14,472 B. Target ~1000 tris. Byte estimate (indexed; POSITION f32
12B/vert + NORMAL int8 3B/vert [I420 precedent, render-inert under flatShading] + COLOR_0
FLOAT 12B/vert on hull+wings + u16 indices) + GLB/JSON overhead ~= ~30-45 KB for the new ship
file. This crosses several self-imposed caps, so ALL are re-pinned EXPLICITLY old->new at the
ST-399 bake (never silent):
- BUDGETS.ship (assetGlbs.test.js): 300 -> ~1200 (explicit).
- assetPerf BUDGET.totalTris: 3000 -> ~4000 (explicit; 2784 - 112 + ~1000 = ~3672).
- assetPerf BUDGET.perFileKB: 60 -> re-pin ONLY if ship file > 60 KB (else 60 stays).
- assetPerf BUDGET.totalFilesKB: 205 -> re-pin ONLY if total grows past (else 205 stays).
- assetPerf BUDGET.totalGeoKB: 165 -> re-pin ONLY if total grows past (else 165 stays).
- SHIP_FACET (assetGlbs.test.js:134): old hull {0.88/1.0599/1.55} + wings {0.7702/1.0/
  1.1902} -> new values measured at bake (explicit).
- dist ceiling: 2,097,152 B. The +~15-30 KB ship EATS the current 106,606 B headroom and
  drops it BELOW the 102,400 B floor. VERIFIED: NEITHER 2,097,152 NOR 102,400 IS a hard test
  cap (no test asserts them - the binding hard caps are assetPerf BUDGET). RE-NEGOTIATE
  EXPLICITLY at ST-399: PREFERRED = raise the dist ceiling 2,097,152 B -> ~2,200,000 B
  (one-time ship-remaster asset investment; still trivial for a web game - I49 trimmed
  22.9 MB -> 1.4 MB, so 2.1 MB is nothing), KEEPING the 102,400 B headroom floor intact. If
  the final file is smaller than estimated and headroom stays >= 102,400 B, keep the ceiling
  unchanged and just record the (larger) headroom. Either way: explicit old->new, recorded in
  CHANGELOG + this file + the ST-399 entry.
- Playframe L 21/366 + P 10/180 + B 50/1222 WILL MOVE (the ship is always rendered -> B ~=
  1222 - 112 + newShipTris; L/P move only if the ship is in MENU). Pre-register conditional
  re-pin; RE-MEASURE EXACT at ST-402 (I432) and record. causal p1 (DEMO PILOT seed 9876) is
  RENDER-INVARIANT to ship tris -> stays EXACT. rockab 2.2/1.3/0.7 (reseed 30201) render-
  invariant -> EXACT. PWA 11/11 render-invariant -> EXACT.

## WebGPU feasibility (ST-401 - research DONE, verdict: do NOT switch)
VERDICT: KEEP WebGL2. Do NOT switch to WebGPU. Rationale (confirmed, not assumed):
- three.js = r160 (vendor/three.module.js revision:160). WebGPURenderer is an addon, not
  core; the vendored tree (vendor/jsm/) has the full node stack + renderers/webgpu/, BUT
  vendor/jsm/postprocessing/ is 100% WebGL-only (EffectComposer, UnrealBloomPass, RenderPass,
  OutputPass) and there is NO vendored WebGPU post-processing equivalent.
- The game's FX stack (grep-confirmed): render/bloom.js = EffectComposer + RenderPass +
  UnrealBloomPass + GradePass; render/gradePass.js = class extends OutputPass (I334 bit-
  identical grade); render/starfield.js:139 = THREE.ShaderMaterial (skybox);
  render/asteroidRenderer.js:52 + render/bossMesh.js:180 = mat.onBeforeCompile (rim).
- Web research (threejs.org manual + forum + migration guides) confirmed WebGPURenderer does
  NOT support (a) ShaderMaterial/RawShaderMaterial/onBeforeCompile (must port to
  NodeMaterial+TSL) and (b) EffectComposer passes (must rebuild as a TSL node graph on
  RenderPipeline/PostProcessing via pass()+bloom()). The "three/webgpu" + "three/tsl"
  just-works entry points landed in r171 (Nov 2024) - r160 predates them (still-experimental
  manual node wiring). r160-era WebGPU browser support = Chrome/Edge 113+ only.
  WebGPURenderer auto-falls-back to WebGL2.
- Dispositive for us: switching would (1) regress the FROZEN 0.72 bloom identity + the bit-
  identical I334 GradePass, (2) require porting the starfield ShaderMaterial + 2
  onBeforeCompile rims to TSL, (3) ride the immature r160 node/effects stack, (4) cut
  Firefox/Safari to the WebGL2 fallback anyway. And it buys NOTHING for the stated goal - a
  few thousand tris is trivially within WebGL2. ST-401 is therefore a lightweight DOCS
  iteration (this section IS the writeup); a SwiftShader WebGPU probe is NOT informative
  (SwiftShader has no WebGPU; the EffectComposer/ShaderMaterial incompat is already
  dispositive).

## Pre-registered Cut Option
- ST-399 (ship remaster) is the MAIN deliverable - NOT cuttable. But it has a pre-registered
  quality gate (CG A/B, grayscale-clay 3/4 + face-on + closeup + in-game tint, old vs new):
  if the new ship does NOT read as a clearly MORE detailed + better-proportioned fighter at
  gameplay scale (or breaks extent/naming so the renderer must change), ROLL BACK to the
  112-tri ship (restore the exact b819fc1 ship.glb) and re-scope at milestone review (no
  silent keep, no silent re-pin).
- ST-400 (other-asset realism) is DESIGNATED CUTTABLE: scope to 1 asset (boss or arena), and
  cut it (docs-only) if the A/B is not clearly improved OR it would push the dist past the
  re-negotiated ceiling with no quality payoff.
- ST-401 (WebGPU) is CUTTABLE-as-scope: expected outcome = document "do not switch" + keep
  WebGL2 (that IS the deliverable). Only "ship" a switch if zero feature regression + zero
  perf regression (not expected).

## Deferrals (carried, not in E54)
- Per-hit impact SFX (audio epic).
- E49 i18n tail + touch fallback.
- Flyer decay unification (flyer.js:74).
- AGENTS.md five-GLBs doc-drift note (AGENTS.md still says five Blender-made GLBs but there
  are now 24 - fix in a bookkeeping pass, not here).
- Any WebGPU migration (explicitly deferred by the ST-401 verdict).

## Stories (budget I427..I432, gate G54.0 at I432)
- ST-397 (I427) - OPEN E54: scope-check + grounding (YouTube ship refs + WebGPU verdict) +
  stories + 6 bookkeeping docs. DOCS-only.
- ST-398 (I428) - cgs-asset-spec: design/asset-spec-ship-remaster.md (silhouette,
  proportions, parts list hull/canopy/twin-nacelles/wing-struts/tail-fin/panel-insets, poly
  budget, facet bake plan, states, acceptance). Reference-grounded.
- ST-399 (I429) - cgs-dev-story + blender-asset-qa: Blender remaster of ship.glb -> detailed
  low-poly fighter (~800-1400 tris). Keep 3 mats + VR_Ship_* names + COLOR_0 exactly hull+
  wings + extent within the ship box. CG A/B SHIP gate. EXPLICIT re-pins (old->new).
- ST-400 (I430) - (CUTTABLE) 1 other asset realism pass (boss or arena; scope picks at
  bake). EXPLICIT re-pins.
- ST-401 (I431) - DONE at I431 (cgs-reverse-document): formalized into design/webgpu-feasibility.md (NEW). Verdict KEEP WebGL2, do NOT switch (research above stands; verdict unchanged).
  Expected: document + keep WebGL2.
- ST-402 (I432) - cgs-regression-suite + cgs-gate-check + cgs-milestone-review: fresh R1-R5
  + G54.0 gate + close E54.

## Re-pin plan (pre-registered; NEVER silent)
- Expect ZERO movement: causal p1 (seed 9876 11334/57/W2/combo15/shots198/acc
  0.2878787878787879/36.14999999999923s/replay 2169-2220/speed4/MENU), rockab (2.2/1.3/0.7
  reseed 30201), PWA 11/11 - all render-invariant to ship tris.
- WILL MOVE (re-measure EXACT at ST-402, record): playframe B (50/1222 -> re-measure, ship
  always rendered), playframe L/P (only if ship in MENU), SHIP_FACET (bake), BUDGETS.ship,
  assetPerf totalTris, and (if file grows) perFileKB/totalFilesKB/totalGeoKB + dist ceiling.
- The ONLY pins that may re-pin are the ones above; each written EXPLICITLY old -> new at the
  iteration that changes it. No other test pin moves.

## Verification Plan
- ST-397 (this, DOCS-only): npm test 972/972 unchanged (no src/assets touched); npm run
  build 0 + dist byte-identical 138/1,990,546 B; vendor sha 76DEA8151BC9352A; hygiene.
- ST-398: design/asset-spec-ship-remaster.md present + internally consistent (silhouette,
  parts, budget, acceptance).
- ST-399: blender-asset-qa RUN (game profile) + accept documented; CG A/B (grayscale-clay 3/4
  + face-on + closeup + in-game tint, old vs new) reads clearly more detailed + better; extent
  within the ship box; 3 mats + node names + COLOR_0 exactly hull+wings; all re-pins
  explicit; assetGlbs + assetPerf green.
- ST-400: A/B old vs new (grayscale-clay + in-game tint) reads clearly improved; re-pins
  explicit; else CUT (docs-only).
- ST-401: DONE at I431 - this WebGPU section is the research; the formal writeup is design/webgpu-feasibility.md; keep WebGL2 (FROZEN).
- ST-402: fresh R1-R5 (R1 p1 EXACT causal / R2 rockab EXACT / R3 playframe RE-MEASURED
  EXACT + expected draw calls + ship A/B view / R4 PWA 11/11 / R5 tests + build 0 + dist
  within re-negotiated ceiling w/ >= 102,400 B floor + vendor sha + hygiene); G54.0 gate;
  milestone review; close E54.

## Risks
- The remaster could exceed the byte budget more than estimated -> re-pin the caps
  explicitly (pre-registered) OR roll back to 112 tris (CG gate). Never a silent re-pin.
- A rename of a node/material name could break useGLB routing -> keep VR_Ship_* names + mat
  names; the facet test keys off the mesh names.
- Panel-inset detail could fragment the mesh into many tiny tris that do not read at gameplay
  scale -> favor bold silhouette + a FEW large insets (the grounding), verify in the in-game
  tint A/B.
- Dist ceiling re-negotiation could be seen as scope creep -> it is a one-time asset
  investment the user explicitly requested ("use gpu resource as much as needed"); recorded
  old->new, not silent; still ~2.1 MB total (trivial).

## Recommendation
SHIP the epic as bounded: (1) Blender ship remaster to a detailed low-poly fighter (~1000
tris) = main deliverable; (2) one CUTTABLE other-asset realism pass; (3) WebGPU = document
"keep WebGL2". Bounded, GPU-trivial, reference-grounded, directly answers the user directive.
No sim/palette/feel/identity risk; renderer untouched (names/colors/extent preserved).

## Changed files or proposed files
- I427 (ST-397, DOCS-only): production/scope-check-E54.md (new), production/epics.md (append
  E54 block), production/stories.md (append ST-397..402), CHANGELOG.md,
  production/iterations.md (I427 entry), production/timeline.md,
  production/session-state/active.md. Zero src, zero assets.
- I428 (ST-398): design/asset-spec-ship-remaster.md (new).
- I429 (ST-399, Blender): assets/ship.glb (in place), src/render/shipMesh.js (silhouette-
  match fallback geos + header if needed), tests/assetGlbs.test.js (SHIP_FACET + BUDGETS.ship
  explicit re-pins), tests/assetPerf.test.js (totalTris + perFileKB/totalFilesKB/totalGeoKB
  if changed).
- I430 (ST-400, CUTTABLE): assets/(boss or arena).glb (in place) + matching test re-pins.
- I431 (ST-401, docs): this WebGPU section / a docs/architecture note.
- I432 (ST-402, DOCS-only): production/regression-report.md (Round G54.0), 6 bookkeeping docs.

## Verification evidence
- I427 (this iteration, DOCS-only): pending - 972/972 tests (npm test), build 0, dist
  byte-identical 138/1,990,546 B, vendor sha 76DEA8151BC9352A, hygiene (0 listeners
  5173/4173/5199, 0 chrome, 0 orphan serve.mjs). No src/assets touched.

## Next owner or decision
- I428 = ST-398 (cgs-asset-spec: ship-remaster design spec). Re-read cgs-asset-spec FIRST
  (standing order).

## Executed at I429 (ST-399 ship remaster) - re-pin actuals + verdicts
- BUDGETS.ship: 300 -> 850 (actual 818 tris; tighter than pre-registered ~1200).
- assetPerf totalTris: 3000 -> 3500 (actual 3442 = 2736 pre-remaster [I420 2784 + I425 emblem re-bake -48] - 112 old ship + 818 new; pre-registered ~4000).
- SHIP_FACET: hull {0.88/1.0599/1.55} -> {0.5477/0.9802/1.4414}; wings {0.7702/1.0/1.1902} -> {0.4329/0.9696/1.55} (spread 0.8937/1.1171, both >= 0.35).
- assetPerf perFileKB 60 -> 65 (max 62.41 = ship) / totalFilesKB 205 -> 235 (232.26) / totalGeoKB 165 -> 200 (196.08); perFileMats 3 + exactly-24-GLBs unchanged.
- dist ceiling: 2,097,152 B -> 2,200,000 B (new dist 138 files / 2,039,982 B; headroom 160,018 B >= 102,400 B floor; the old ceiling would leave 57,170 B < floor -> the pre-registered raise was REQUIRED). Doc-only (no test asserts either value).
- Playframe L 21/366 + P 10/180 + B 50/1222: NOT re-measured this iter (deferred to ST-402/I432 per the pre-registration; B will move ~1222 - 112 + 818 ballpark); causal p1 (seed 9876) + rockab (2.2/1.3/0.7) + PWA 11/11 render-invariant -> untouched.
- CG A/B SHIP gate: PASS, no rollback (clay old vs new + in-game tint x3 + fresh smoke, all VIEWED; the tint_2 "black fin" = tail fin in shadow = lighting artifact, documented, out of scope).
- Quality bar: 972/972 + build 0 + vendor sha256-16 76DEA8151BC9352A unchanged + hygiene.

## Executed at I430 (ST-400 boss remaster) - re-pin actuals + verdicts
- Chosen asset: BOSS (not arena).
- BUDGETS.boss: 250 -> 750 (actual 650 tris) + boss.glb file cap 14 -> 84 KB (actual 77,068 B).
- assetPerf: totalTris 3500 -> 4000 (actual 3948 = 3442 + 650 new - 144 old) / perFileKB 65 -> 85 (max 75.26 = boss) / totalFilesKB 235 -> 320 (300.67) / totalGeoKB 200 -> 280 (264.43); perFileMats 3 + exactly-24-GLBs unchanged.
- dist ceiling: 2,200,000 B -> 2,260,000 B (new dist 138/2,110,034 B; headroom 149,966 B >= 102,400 B floor; the old 2,200,000 B ceiling would leave 89,966 B < floor -> raise REQUIRED). Doc-only (no test asserts either value).
- Playframe L 21/366 + P 10/180 + B 50/1222: NOT re-measured this iter (boss appears only in later waves, NOT in any playframe; B re-measure stays deferred to ST-402/I432 per the pre-registration); causal p1 (seed 9876) + rockab (2.2/1.3/0.7) + PWA 11/11 render-invariant -> untouched.
- CG A/B SHIP gate: PASS, no rollback (clay old-vs-new + in-game tint x2 angles [34 + front], all VIEWED; new = multi-spike crystal crown + full-height emissive core column + per-facet value + rim). The earlier phantom invisible-boss reading = test-harness artifact (real render = bloom.render() EffectComposer, not vr.render(); a pending frame() overwrote the harness-cam shot with the chase cam, and multi-shot same-canvas made every shot identical) - fixed harness .evidence/I430/boss_tint2.mjs; NOT a real bug.
- Quality bar: 972/972 + build 0 + dist 138/2,110,034 B (boss byte-identical 77,068 B) + vendor sha256-16 76DEA8151BC9352A (subset 13/13 bad=0) + hygiene (server 5173 killed).

## Executed at I431 (ST-401 WebGPU writeup) - formalized, verdict unchanged
- Deliverable: design/webgpu-feasibility.md (NEW; cgs-reverse-document contract: Summary / Observed Behavior / Evidence Path / Unknowns / feasibility analysis / Risks / Changed files / Verification / Next owner). The WebGPU-feasibility section above is the research; the formal writeup is now the standalone design doc.
- Verdict: KEEP WebGL2, do NOT switch (unchanged). DOCS-only; zero src/asset/test.
- Tree re-verified this session: three r160 (vendor/three.module.js:6); frozen FX = bloom.js EffectComposer+RenderPass+UnrealBloomPass+GradePass / gradePass.js:41 extends OutputPass (I334 bit-identical) / starfield.js:139 ShaderMaterial / asteroidRenderer.js:52 + bossMesh.js:180 onBeforeCompile / 0.72 bloom threshold; vendor/jsm/postprocessing 29 WebGL-only files (no WebGPU equiv); vendor/jsm/renderers/webgpu 4 files present; 24 GLBs = 3,948 tris (WebGL2 trivial).
- Gates (DOCS-only, code unchanged): 972/972 + build 0 + dist unchanged 138/2,110,034 B + vendor sha256-16 76DEA8151BC9352A unchanged.
- playframe re-measure stays at ST-402/I432; causal p1 (seed 9876) / rockab (2.2/1.3/0.7) / PWA 11/11 render-invariant EXACT.

## Executed at I432 (ST-402 fresh R1-R5 + G54.0 gate + close E54) - re-pin actuals + verdicts
- G54.0 gate: PASS -> E54 CLOSED 5/5 at I432 (ST-397 opener + ST-398..402 all DONE; ST-399 ship remaster + ST-400 boss remaster both CG A/B gate PASS, no rollback).
- R1 causal: EXACT (seed 9876: 11334/57/W2/combo 15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed 4/afterQ MENU; console 0/0).
- R2 rockab: EXACT 2.2/1.3/0.7 (all GLB incl. rockComet ready; console 0/0).
- R3 playframe RE-MEASURED: P 10/180 (unchanged; overhead frame has no ship) + L 21/366 -> 21/1072 (menu-loop single-reset frame; ship 112 -> 818 = +706 once) + B 50/1222 -> 50/2634 (debris 0 live; console 0/0 x2). The B +1412 is DECOMPOSED + DOCUMENTED (NOT a bug): renderer.info.autoReset=false makes renderer.info CUMULATIVE; part B does not reset, so it reads a cumulative 2-render window (last loop composer PLAYING frame + the probe plain render) BOTH containing the 818-tri ship -> the +706 ship delta appears twice = +1412; draw calls stay 50 (ship 6 calls x 2 renders = 12, unchanged); non-ship tris byte-identical old->new. decomp probe .evidence/I432/decomp.mjs (sOn/sOff toggle: ship = exactly 6 draw calls/818 tris per render; boss mesh present but worldBoss=false so boss is not in wave-1).
- R4 PWA: 11/11 fresh on :5199 over dist (probe copied verbatim from I426).
- R5 quality bar: 972/972 + build 0 + dist 138/2,110,034 B (byte-identical to I431; headroom 149,966 B >= 102,400 B floor) + vendor sha256-16 76DEA8151BC9352A (subset 13/13 bad=0) + hygiene (5173 then 5199 killed; ports free; chrome 0; node MCP-only).
- Re-pins this round: playframe L 21/366 -> 21/1072 + B 50/1222 -> 50/2634 (documented-cause; NEVER silent). Headroom arc: 160,018 B (I429) -> 149,966 B (I430/I431/I432).
- Next: I433 open E55 (cgs-scope-check + cgs-create-stories) - remaster the player ship into a more detailed realistic real-airship (more detail + polygon count; the current 818-tri fighter still reads small), make other assets more realistic in Blender; DO NOT switch to WebGPU (ST-401 frozen verdict KEEP WebGL2); asteroid/comet bumps+craters only if not GPU/compute-heavy; ground in internet + YouTube refs (do not overengineer).