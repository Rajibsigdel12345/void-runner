# Void Runner - E61 Scope Check: High-poly "Real Airship" Protagonist + Enemy Realism Pass + WebGPU F1/F2/F3 Re-eval (I468 / cgs-scope-check + cgs-create-stories)

## Summary
E61 executes the user's explicit standing ask (verbatim, carried from the I468
request): "improving the main character currently its small looking airship,
put in more detailing, increase the polygon count and make it a real airship,
go through the guides and reference samples to build them, likewise for the
other assets make them more realistic use the polygons and gpu resource as
much as needed you can switch it to the webgpu from webgl if you are on webgl
to make them possible". E61 = (1) ship v5: a detailed high-poly REAL AIRSHIP
re-master in Blender (target <= 18,900 tris of the 19,000 cap, up from 14,276),
grounded FIRST in YouTube/web reference samples (hard research gate, ST-436);
(2) a grounded detail pass on the two enemy craft (hunter 1,432 / gunship
1,688 -> ~2,300 each, inside the existing 2,400 caps) using the same reference
pass; (3) an honest WebGPU F1/F2/F3 re-derivation against the new geometry and
measured frame cost, rendering an explicit renderer decision. Every story is
zero src, zero core, zero vendor: assets/ + test pins + docs only, and causal
seed 9876 stays EXACT at every story. The user's WebGPU mandate is CONDITIONAL
("if ... needed to make them possible"), so the switch is a decision output of
ST-439, not a premise - and an actual switch is pre-registered as OUT of E61
(F2 territory: vendor r171+ ADR + frozen-identity re-reproduction = separate
epic).

## Current State (measured this iteration, I468, 2026-11-17 - evidence, not assumption)
- 26 GLBs / 1,016.33 KB / 28,779 tris (caps 1,024 KB / 976 KB geo / 30,000 tris;
  headroom 7.67 KB files / 2.83 KB geo / 1,221 tris).
- ship.glb v4 "real airship" (I454/ST-424): 14,276 tris / 347,184 B
  (per-file caps: 19,000 tris / 393,216 B = MAX_FILE_BYTES); 6 VR_Ship_* nodes
  (Cockpit/Engine/Fin/Hull/Nozzle/Wings); 3 materials (VR_Ship_Cockpit/Hull/
  Wing); COLOR_0 value bake on hull (assetPerf COLOR_0 list includes ship.glb).
- enemy_hunter.glb: 1,432 tris / 139,752 B (cap 2,400; headroom 968).
  enemy_gunship.glb: 1,688 tris / 178,220 B (cap 2,400; headroom 712). Both
  3 materials, VR_Hunter_* / VR_Gunship_* node names.
- Rock L/M/S + B-variants + comet + boss already carry the E58 v11 density
  remaster (bumps + craters via static displacement: L 3,000/M 900/S 350,
  boss 1,425 of caps 3,200/950/380/1,500) - the user's "rocks like
  asteroids/comets with bumps and crater" constraint is ALREADY satisfied;
  no rock work is in E61 (headroom there is < 300 tris total and the GPU cost
  is not justified per the user's own "only if gpu and compute heavy" rule).
- dist: 2,882,938 B / 149 files / ceiling 3,000,000 (headroom 117,062 B).
  dist INCLUDES assets/*.glb (build copies them), so GLB growth is dist growth.
- Renderer: src/main.js:78 `new THREE.WebGLRenderer({ antialias: true,
  powerPreference: 'high-performance' })` - WebGL2 on r160; no WebGPURenderer
  anywhere in src/. Vendor three r160 sha256-16 76DEA8151BC9352A (frozen).
- WebGPU flip criteria (verbatim, docs/architecture/webgpu-re-eval-E56.md
  L143-154, re-confirmed at I442/I457/I461/I467 gates): F1 sustained per-frame
  draw need > ~200k tris (~6x the 30,000 cap) - not a one-off asset spike;
  F2 vendor explicitly upgraded to r171+ (separate frozen-sha ADR) AND TSL-era
  FX reproduce the frozen 0.6/0.35/0.72 bloom + I334 grade (CG A/B verified)
  AND FX identity consciously re-scoped; F3 explicit user decision to switch
  made WITH the reach tradeoff on the table (at r160 Firefox/Safari stay on
  the WebGL2 fallback - the switch buys nothing for them).
- Pins: playframe A 22/14,530 + 11/180 (MENU), B 52/32,826 (fx high,
  cumulative 2-render window = 2x ship + 4,274 non-ship); causal seed 9876
  18-field EXACT; camera OVERVIEW (0,56,20)->(0,0,0) worstRim 0.8362, RM drop
  8.981; PWA 11/11; tests 1027/1027; build 0; hygiene (5173/5199 free,
  chrome 0).
- Presence ground truth (I455): ship silhouette 109x95 px @ 1280x720
  (ndcW 0.1703 / ndcH 0.2639) - verdict "present, not small"; the scale
  decision is CLOSED. The user's "small looking" complaint is a MODEL
  problem (detail + volume + silhouette readability), not a scale problem -
  E61 does not touch ship scale or camera (camera is E62).

## Why E61 (and why now)
- Direct user mandate, most recent explicit "next portion" request; E60 is
  CLOSED 5/5 and its deferral list explicitly carried "GLB re-masters
  (1,221-tri headroom)" - E61 is that deferral, de-scoped from the old
  headroom constraint because the user explicitly authorized spending more
  polygons ("use the polygons and gpu resource as much as needed").
- The 1,221-tri total headroom is consumed by the SHIP ALONE (+4,624 to the
  18,900 target); explicit re-pins are the mechanism, with direct precedent:
  I456/ST-426 (totalTris 26,000 -> 30,000) and I440/ST-410
  (MAX_FILE_BYTES 262,144 -> 393,216). Precedent: 4 prior ship remasters
  (v1 818 -> v2 3,254 -> v3 12,400 -> v4 14,276), 3 rock density passes, 2
  enemy GLBs, 1 boss remaster - the Blender 5.2.3 headless pipeline is mature.
- The WebGPU question REQUIRES re-derivation now: F3's wording was an
  "explicit user decision ... with the reach tradeoff on the table" - the
  user has now put the (conditional) decision on the table, and F1's bar
  must be re-checked against the post-remaster numbers instead of re-quoted.

## Scope Fit
Five stories, zero src, zero core, zero vendor. The only numeric growth is
GLB bytes/tris (assets/) + their test pins + docs. Pre-registered budget:

- Ship v5: <= 18,900 tris (19,000 cap HOLDS, no re-pin), <= 512 KB file,
  same 6 VR_Ship_* node names, 3 materials, COLOR_0 bake retained.
- Enemies: hunter ~2,300 / gunship ~2,300 (2,400 caps HOLD, no re-pin).
- EXPLICIT re-pins (old -> new; re-measured at execution, caps = measured +
  headroom, documented old->new per I456/I440 precedent):
  totalTris 30,000 -> 36,000 (predicted measured ~34,900: +4,624 ship +
  ~1,480 enemies).
  totalFilesKB 1,024 -> 1,240 (predicted ~1,190: ship ~+110 KB + enemies
  ~+65 KB).
  totalGeoKB 976 -> 1,120 (predicted ~1,095).
  MAX_FILE_BYTES 393,216 -> 524,288 ONLY IF the measured ship file lands
  above 384 KB (predicted ~460 KB - so expected).
- DIST ceiling: RENEGOTIATED 3,000,000 -> 3,250,000 at this open, floor rule
  >= 102,400 B headroom at close (ST-407 precedent: "re-negotiated ceiling
  w/ >= 102,400 B floor"). Expected measured dist ~3,080,000 (GLB growth
  ~+195 KB is dist growth 1:1). If the measured dist ends up <= 2,897,600
  (i.e. the GLB growth never crossed the old ceiling - not expected), the
  old ceiling still stands and the renegotiation is documented as unused.
- Playframe: A WILL MOVE (ship visible in the MENU frame: 14,530 = 254
  non-ship + 14,276 ship-once -> predicted ~19,154) and B WILL MOVE
  (2x18,900 + 4,274 -> predicted ~42,074; + enemy deltas if enemies are in
  the B window). BOTH re-pins land WITH DECOMPOSITION, arithmetic closing
  exactly (I437 pattern) - never a silent pin move.
- Causal seed 9876: EXACT at every story (zero core behavior changes).
- Vendor: UNCHANGED (76DEA8151BC9352A) - no vendor change is in E61 under any
  cut-ladder branch.

## Stories
- ST-436 (I469, cgs-research; design/ docs only, zero src): ship + asset
  reference research BEFORE any modeling. YouTube MCP: airship/zeppelin
  design breakdowns, "how to model an airship" guides, reference samples of
  the "real airship" read (envelope/gondola volume balance, fin + propeller
  silhouette, panel/rivet detail level readable at ~100 px); web: low-poly
  game airship references; enemy craft detail references consistent with the
  E59 art direction (one-danger-color, rim-on-dark). Deliverables:
  design/ship-remaster-research-E61.md (labeled findings + design decisions:
  part list, node layout, <=3 material split, silhouette rules) +
  design/asset-spec-ship-remaster-E61.md (part-level tri budget summing to
  <= 18,900) + the hunter/gunship detail spec section. HARD GATE: ST-437
  does not start modeling before this doc lands.
- ST-437 (I470, cgs-dev-story + blender-modeling + blender-asset-qa +
  blender-export; assets/ship.glb + test pins, zero src): ship v5 build per
  the ST-436 spec, deterministic .evidence/I470/build_ship_v5.py (Blender
  5.2.3 headless, D:/Blender/blender.exe), <= 18,900 tris, 6 VR_Ship_* node
  names retained, 3 materials (hull/wing/cockpit), COLOR_0 hull value bake,
  all-polygons use_smooth=True with NO auto-smooth modifier (I436 vertex-
  crack pitfall), GLB export -> assets/ship.glb (old backup in
  .evidence/I470/backup/). EXPLICIT re-pins applied with measured old->new
  (see budget table). A/B gates: CG clay (6 PNGs) + in-game tint (3 PNGs)
  per the I436 harness (ship-hide inside each shot's evaluate, freeze+
  settle+double-render, whitelist traversal from arenaFloor); presence
  re-check at OVERVIEW (worstRim <= 0.85, silhouette >= current 109x95 px
  read). Gates: causal EXACT 18/18 + playframe A AND B RE-PINNED WITH
  DECOMPOSITION + 1027/1027 (with re-pins) + build 0 + dist <= 3,250,000 +
  vendor PIN_OK + hygiene. PRE-REGISTERED SPLIT RULE: if the build does not
  land in one iteration, the story splits (build+export this iteration;
  import gate + re-pins next) - a scheduling split, not a scope cut.
- ST-438 (I471, cgs-dev-story + blender-modeling; assets/enemy_hunter.glb +
  enemy_gunship.glb, zero src): grounded detail pass on both enemy craft per
  the ST-436 enemy spec (weapon hardpoints, engine nozzles, panel lines/
  rivets via COLOR_0 bake, silhouette differentiation: hunter vs gunship
  must read apart at busy-frame distance). ~2,300 tris each (2,400 caps
  HOLD - no test re-pin; the ST-437 totalTris re-pin already covers the
  ~+1,480). Same node names (VR_Hunter_*/VR_Gunship_*), <= 3 materials each,
  same use_smooth recipe. A/B gate (I436 pattern, enemy-visibility variant
  in the busy frame). Gates: causal EXACT + playframe (B decomposed only if
  enemies are in the B window - measure, don't assume) + 1027/1027 + build 0
  + dist <= 3,250,000 + vendor PIN_OK + hygiene.
- ST-439 (I472, cgs-reverse-document; docs/architecture/webgpu-re-eval-E61.md
  + one busy-frame probe, zero src): re-derive F1/F2/F3 from the POST-
  remaster numbers - never re-quote: F1 (measured new total ~34.9k vs the
  ~200k sustained bar - expect UNMET); F2 (vendor still r160 - UNMET); F3
  (the user's conditional mandate: evaluate whether WebGL2 actually needs the
  switch - busy-frame probe at fx high with the new ship + enemies,
  median frame cost + deltaMed vs the E60 32,826-tri baseline).
  PRE-REGISTERED TRIGGER: busy-window median > 8 ms OR draw deltaMed > 4 ms
  vs the E60 baseline => F3's "needed" condition met. DECISION MATRIX: no
  trigger -> KEEP WebGL2, documented, vendor untouched; trigger -> do NOT
  switch inside E61 (a switch IS F2: vendor r171+ ADR + frozen 0.72 bloom +
  I334 grade re-reproduction + conscious FX re-scope = separate follow-up
  epic); instead document the trigger, open the follow-up epic, and propose
  the tri-cut ladder (cut ladder rung 2) as short-term mitigation.
  Gates: docs + probe evidence in .evidence/I472/ + causal EXACT + dist
  byte-identical + vendor PIN_OK + hygiene.
- ST-440 (I473, cgs-regression-suite + cgs-gate-check + cgs-milestone-
  review; probe-only, zero src): fresh R1+R2 causal EXACT (zero core drift
  across the whole E61 asset pass) + R3 playframe at the new decomposed
  re-pins (A + B) + camera 3x3 (unchanged camera - pins must hold) + ship
  hero views (new silhouette, presence re-check) + enemy views (hunter vs
  gunship silhouette separation) + R4 PWA 11/11 + R5 1027/1027 + build 0 +
  dist vs 3,250,000 (floor >= 102,400 B) + vendor 76DEA8151BC9352A +
  hygiene + WebGPU decision line (F1/F2/F3) + AGENTS.md roster refresh
  (26 GLBs unchanged in count; new KB/tri totals; ship v5 note).

## Cut ladder (pre-registered order)
1. ST-438 (enemy detail pass) -> defer; ship v5 + WebGPU decision still ship.
2. Ship v5 target 18,900 -> 16,000 tris (dist growth shrinks ~-45 KB;
   totalTris re-pin 36,000 -> 33,500; MAX_FILE_BYTES re-pin may become
   unnecessary).
3. Enemy targets 2,300 -> 2,000 (if ST-438 is still in).
4. Dist renegotiation 3,250,000 -> hold at 3,000,000 only if the rungs above
   keep measured dist <= 2,897,600 (old ceiling - 102,400 floor).
5. ST-437 build/import split (scheduling, not scope).

## Deferrals (OUT of E61, queued explicitly)
- C3 fog + C4 nebula shells (E60 P2 leftovers).
- Camera far-distance feel ("same view angle wherever the ship moves") +
  first-person COCKPIT enhancement -> E62 (user request, research-first).
- New-enemy ladder slot + enemy art-direction research -> E63 (user request).
- Linear level design / campaign progression with end bosses -> E64
  (user request, "step by step").
- Boss detail pass (1,425/1,500 - nearly at cap; needs its own re-pin if
  pursued), rock v12 (no headroom justification), audio/music,
  Draco/meshopt GLB compression (only if dist pressure persists past E61),
  starfield density.

## Risks
- R1 Blender auto-smooth vertex crack on import (252 -> 297 verts, I436):
  mitigation = the known recipe (all-polygons use_smooth=True, NO auto-30
  modifier, export_apply off for smoothing).
- R2 Loader expectations: shipMesh/assetLoader read the 6 VR_Ship_* node
  names + 3 material slots. Mitigation: names + material count FROZEN by the
  spec; detail is added INSIDE existing node meshes (subdivided/displaced
  hull), not new nodes.
- R3 Dist ceiling breach: pre-registered renegotiation at open (3,250,000)
  with the 102,400 B floor rule; measured at close, never assumed.
- R4 Playframe silent drift: A and B both move; both re-pins REQUIRE
  decomposition with exact arithmetic (I437 pattern) - a pin that does not
  close is a stop, not a nudge.
- R5 WebGPU trigger mishandling: if ST-439's trigger fires, the failure
  mode is "someone starts a vendor upgrade mid-epic". Pre-registered:
  trigger => docs + follow-up epic + cut-ladder mitigation; the vendor sha
  76DEA8151BC9352A must be intact at G61.0 under every branch.
- R6 "Small looking" misdiagnosis: if the v5 clay gate shows the silhouette
  STILL reads small at 109x95 px, the fix is model volume (bigger envelope
  footprint in model space, same world scale), NOT ship scale or camera -
  re-spec within ST-437, do not silently move the I455 scale decision.

## Estimate (cgs-estimate fields)
- Estimate range: 5 iterations (I469-I473); range 5-7 (ST-437 split rule
  adds +1; Blender build variance adds +1 at the tail).
- Confidence: HIGH on ST-436/439/440 (docs/probes, established patterns);
  MEDIUM on ST-437/438 (Blender builds, but the 4th+ ship remaster on a
  mature pipeline).
- Dependencies: ST-436 -> ST-437 (hard: no modeling before research) ->
  ST-438 (sequential for pin hygiene) -> ST-439 (needs the post-remaster
  measured frame cost) -> ST-440.
- Buffer: the cut ladder absorbs two slippage events (enemy pass + ship
  target) without touching the dist floor or the vendor pin.

## Gate (G61.0 at ST-440)
Fresh R1-R5 + causal EXACT + playframe at decomposed re-pins + camera 3x3 +
ship/enemy hero views + PWA 11/11 + dist vs 3,250,000 (floor >= 102,400 B)
+ vendor 76DEA8151BC9352A + hygiene + WebGPU F1/F2/F3 decision line +
AGENTS.md roster refresh. Close E61 on G61.0 PASS.

## Next
I469 = ST-436 ship + asset reference research (YouTube MCP + web, docs only).