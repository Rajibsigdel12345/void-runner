# Scope Check - E67: Ship v6 real-airship remaster + asset realism + camera/view pass (opened I499)

User request (2026-11-18, verbatim in the research doc): the main character
is a "small looking airship" - put in more detailing, increase the polygon
count, make it a REAL AIRSHIP; likewise make the other assets more
realistic; "use the polygons and gpu resource as much as needed"; WebGPU
permitted. Plus the standing queue: camera far-distance view + first-person,
enemies/content enrichment, art direction. Step by step (user words).

## Epic shape
E67 = the improvement pass. Story order is the user's priority order:
ship first (the explicit ask), then secondary assets, then camera/views,
then the close gate. Enemies/content enrichment (beyond E63's
sentry/wasp/pod) and the E59 art-task-list backlog carry to E68 if E67
closes early; E67 is the ship-centric pass.

Stories (7):
- ST-465 (I499, THIS): E67 open - research (design/ship-remaster-research-
  E67.md, labeled YouTube + web) + this scope check. Docs-only, zero src.
- ST-466 (I500): ship v6 FROZEN asset spec
  (design/asset-spec-ship-remaster-E67.md): per-node tri budgets for
  F6-1's six additions, bake spec, file-size prediction, re-pin list.
  Docs-only.
- ST-467 (I501): ship v6 Blender build (D:\Blender\blender.exe 5.2.3
  headless, deterministic script per the E61/E63 precedent): clay -> CG
  gate (6-view + 96-px silhouette + tint A/B + back view) -> COLOR_0 bake
  (F6-5) -> GLB export -> assets/ship.glb REPLACED (v5 stays in git until
  the integration commit). Assets-only.
- ST-468 (I502): ship v6 integration: assetLoader BUDGETS re-pin WITH
  measurement (ship 19,000 -> 38,500; totals re-pinned measured),
  MAX_FILE_BYTES 524,288 -> 1,048,576 (measured), dist ceiling
  renegotiation WITH MEASUREMENT (expected ~4,050,000 B), playframe A
  re-pin WITH MEASUREMENT (per-child probe), causal495 must stay EXACT
  (verify), quality bar 6/6.
- ST-469 (I503): secondary-asset realism pass: ONE Blender remaster of the
  single weakest fleet asset by the rendered-luma/silhouette audit (I480
  probe pattern) - decision at execution between enemy_gunship (167.7 KB,
  2,268 t - the biggest but still a mid-poly read) and boss.glb (42.6 KB,
  the level-end hero). Same contract style (node names + COLOR_0 neutral
  hull bake per E57 rule 8). Re-pins WITH measurement.
- ST-470 (I504): camera + view improvements on the E62 base (NO reinvent -
  E62 CLOSED: uniform-scale dolly position-invariance ST-415 + COCKPIT FPV
  on V + bearing strip ST-444): (a) far-distance read check on the campaign
  flight path (the user's "goes very far cannot see all the way back" -
  measure chase-frame occlusion/distance along the race line; fix only if
  measured), (b) FPV (cockpit) polish per the E62 scope-check leftovers if
  any, (c) probe. Core-only + render, no mesh.
- ST-471 (I505): G67.0 close gate: causal495 3-arm fresh + playframe fresh
  + pwa491 + quality bar + AGENTS.md refresh (ship v6 tris/bytes, ceiling,
  pins) + E67 CLOSED 7/7. Probe-only.

## Re-pin expectations (pre-registered, all WITH MEASUREMENT at execution)
- playframe A: 22/17,361 -> ~22/(17,361 - 17,143 + ship_v6_tris) (ship GLB
  child only; flame cones 20+16, floorDisc 48, ArenaRing 120, sprite 2
  unchanged - verified by the per-child probe before the pin moves).
- assetLoader BUDGETS: ship 19,000 -> 38,500; totalTris 34,938 -> ~53,000
  (measured); totalGeoKB/totalFilesKB -> measured + headroom.
- MAX_FILE_BYTES: 524,288 -> 1,048,576 (ship only; the 28-asset audit
  proves no other file needs more).
- dist ceiling: 3,650,000 -> measured dist + headroom, expected ~4,050,000
  B (ST-468 executes WITH MEASUREMENT; precedent I495 C1).
- causal495 sim pins: EXACT (no core change; VERIFY at every src-asset
  iteration - the ship GLB swap is not a sim input, but the rule is
  verify-don't-assume).

## Cut ladder (in order, if the build overshoots)
- C1: mast + rigging (-~300 t; silhouette cost low at 100 px)
- C2: meshopt-compress the v6 GLB (hold the ceiling; add the runtime
  decoder - only if the ceiling renegotiation is refused)
- C3: skids spoked -> solid disc (-~800 t)
- C4: frame cage 10 gore ribs -> 6 (-~1,500 t; the #1 read, last to cut)
- C5: ship target 35,000 -> 28,000 (re-pin BUDGETS.ship down to 30,000)

## Constraints (unchanged)
- Core (endless) BIT-IDENTICAL: causal seed-9876 pin set EXACT at every
  story; the campaign path campaign-gated as always.
- Frozen FX identity (bloom 0.6/0.35/0.72 + I334 grade); ?fx=webgl frozen
  reference arm stays byte-identical; stable-webgl2-r160 @ 835381c NEVER
  touched.
- Quality bar 6/6 per AGENTS.md at every story (tests / build / smoke /
  dist ceiling / vendor pins / regression probes).
- 6 VR_Ship_* node names + 3 materials + COLOR_0-on-2-prims frozen
  contract (F6-4) - the swap is a geometry + value-bake pass, NOT a
  material-routing change.

## Risks
- R1 GLB size blows the predicted 784 KB (COLOR_0 on more prims or dense
  cage) -> cut ladder C1..C5 in order; the ceiling renegotiation is
  pre-registered, not a surprise.
- R2 playframe re-pin lands far from predicted (e.g. the frame captures a
  different ship state) -> per-child probe before the pin moves (I497
  pattern); a mismatch > 300 tris stops the iteration for diagnosis.
- R3 the raised frame cage z-fights/aliases at the 100-px in-game size
  (thin girders sub-pixel) -> the CG gate's 96-px silhouette + a
  render-smoke at the pin frame catches it; girders are 0.05u min width
  in the spec.
- R4 camera far-distance (ST-470) turns out to be a flight-path length
  issue, not a camera issue -> ST-470 becomes a measurement doc + a
  scoped follow-up story, not a silent sim change.
- R5 secondary-asset remaster (ST-469) overshoots its file cap -> same
  cut-ladder discipline; the pick is made at execution, not now.

## Definition of done (epic)
E67 CLOSED 7/5 (7 stories) at ST-471: ship v6 in the scene (the "real
airship" read per F6-1), one secondary asset remastered, camera/views
verified-or-fixed, all re-pins landed WITH MEASUREMENT, quality bar 6/6,
AGENTS.md current, hygiene clean (servers/chrome/worktrees), Pages deploy
re-triggered by the final push (Gibbs workflow).