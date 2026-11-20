# Scope Check - E73 Player-Ship v7 "Warship Airship" Remaster (ship.glb v6 -> v7) WITH MEASUREMENT (I539)

## 1. Measured current state (tree-verified, I539)

- HEAD 3fe1209 (I538, E72 CLOSED 7/7, pushed + deployed: Pages run #53
  success, site HTTP 200 - the free-runner minute block did NOT occur;
  public-repo Pages deploys don't consume Actions minutes).
- dist 5,383,468 B / 184 files; ceiling 6,100,000 B; CLOSE FLOOR E72 =
  716,532 B (measured at G72.0, I538).
- Ship v6 (probe, .evidence/I539/probe_shipv6.txt): 25,563 t / 581,440 B;
  span 4.013 / height 0.969 / length 2.599 / min-y -0.414; 6 nodes, 3
  materials, COLOR_0 on exactly 2 prims (hull + wings); facets hull
  0.5611/0.9108/1.3070 + wings 0.3869/0.9981/1.55 (pinned, tol 0.005).
- Fleet (measure_fleet.out): 31 GLBs; totalFiles 3,053,660 B (cap 3,072,000,
  headroom 18,340 B); totalGeo 2,991,786 B (cap 2,995,200, headroom 3,414
  B); totalTris 65,513 (cap 66,000, headroom 487 t); maxFile ship.glb
  581,440 B (perFile cap 614,400, headroom 32,960 B). -> the assetPerf
  re-pins at ST-507 are MANDATORY, not speculative.
- Pin set (5 harnesses): causal495 3-arm (webgl + default EXACT on the
  seed-9876 wave-2 pin set; webgpu report-only) / causal483 CAUSAL456 PASS /
  playframe483+491 PLAYFRAME456 PASS (A 22/25,781 + 11/180; B 52/55,400) /
  pwa491 SUMMARY 11/11.
- Vendor r187 UNCHANGED (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A
  / 7FF9ACF50F006017). Tests 1,187/1,187 green; build 0.
- BOM baselines CHANGELOG 7 / stories 5 / epics 3 / iterations 5 / timeline
  3 / active 0 / AGENTS 1 / e73-research 0 (this episode's docs are both 0).
- AUDIT (this iteration): the measured v6 probe found the 6 defects behind
  the "looks small" read (D1 flat slab - height 24% of span; D2 one-level
  shading; D3 buried cockpit; D4 single centerline engine; D5 no tail
  assembly; D6 unorganized greeble). Code contract tree-verified
  (shipMesh.js: min-y >= -0.400 rest pose, flame apex z = -0.8, material-name
  substring binding; config palette frozen).

## 2. Scope fit

E73 = rebuild assets/ship.glb into v7 "warship airship" (Blender 5.2.3
headless) with a proper airship anatomy read: taller ovoid hull (height
~45-55% of span), side engine nacelles + centerline stack (engine bay), a
raised command tower, a twin-fin tail assembly, and organized two-level deck
detail - grounded in the research doc (A1-A6: airship-anatomy read, vertical
volume, segmented rigid hull, two-level deck, rear read for chase cam,
budgeted detail). Bounded by design: span/length stay inside the PINNED
windows (vertical growth only), NO palette/config changes, NO node- or
material-name changes (renderer contracts), NO core/sim code, NO camera work
(cockpit/FPV rework stays deferred - v7 only needs to be cockpit-friendly),
NO other assets (enemy fleet / asteroids / boss = separate episodes),
WebGPU NOT switched (dual arm frozen, classic default renders the full
budget fine).

## 3. Stories (ST-505..ST-508; acceptance in production/stories.md)

- ST-505 (I539, this) - E73 open: measured v6 audit + research + scope
  (docs-only): design/e73-ship-v7-research.md + this scope check +
  epics/stories/iterations/timeline/CHANGELOG/active entries + .evidence/
  I539 force-added (probe script + probe out + fleet measurement).
- ST-506 (I540) - ship v7 Blender build: build_ship_v7.py (from the
  build_ship_v6.py helper set) -> TEMP GLB in .evidence/I540/ (no swap) ->
  build gates ALL_GATES_PASS -> EEVEE audit (4 views x clay + tint +
  front/rear sil96) viewed -> sil96 gate (reads as AIRSHIP at 96 px, rear
  included).
- ST-507 (I541) - swap + re-pins WITH MEASUREMENT: assets/ship.glb v6 ->
  v7; assetGlbs BUDGETS.ship + SHIP_FACET re-pins; assetPerf totalTris +
  totalGeoKB + totalFilesKB (+ perFileKB if v7 file > 614,400 B); playframe
  A/B re-pins (measured); runtime smoke; quality bar 6/6; dist WITH
  MEASUREMENT.
- ST-508 (I542) - G73.0 close gate: 5 fresh harness runs (causal495 +
  causal483 + playframe491 + playframe483 + pwa491; causal + pwa EXPECTED
  EXACT, playframe re-pin verified) + CLOSE FLOOR E73 re-derived WITH
  MEASUREMENT + AGENTS.md refresh + bookkeeping + commit + push delegate.

## 4. Pin expectations (re-pin table, ST-507)

- RE-PIN WITH MEASUREMENT: assetGlbs BUDGETS.ship (25,563 -> v7, hard cap
  36,000) + SHIP_FACET hull/wings p10/p50/p90 (tol 0.005); assetPerf
  totalTris (65,513 -> ~71,950 at the 32,000 t aim) + totalGeoKB +
  totalFilesKB (both mandatory - headrooms 3,414 B / 18,340 B are crossed)
  + perFileKB (if v7 file > 614,400 B - expected); playframe491/483 A
  22/25,781 + 11/180, B 52/55,400 (precedent v5->v6: A delta, B = 2x;
  expected v7 ~A 32,218 / B 68,274 at 32,000 t - measured governs).
- EXPECTED EXACT (no re-pin): causal483 + causal495 (seed-9876/30201 wave-2
  logic pins - geometry does not change the sim) + pwa491 (11/11; E69
  GLB-swap precedent) + vendor r187 4/4.
- Span/length test windows UNCHANGED (3.6..4.4 / 2.34..2.86) - the
  vertical-growth-only decision keeps them in force.
- Re-pin rule: only on shipped-geometry change, always WITH MEASUREMENT.

## 5. dist + asset policy (PRE-REGISTERED)

- Open: dist 5,383,468 B / 184; ceiling 6,100,000 B; CLOSE FLOOR E72 =
  716,532 B.
- Expected: ship file +120-220 KB (581,440 -> ~700-800 KB) -> worst-case
  dist ~5,610,000 B (>= 490,000 B under the ceiling). No renegotiation
  anticipated.
- Tripwires (pre-registered, in order): (a) v7 GLB > 850,000 B -> C1
  decimate before swap; (b) dist after the swap > 5,750,000 B -> cut ladder
  before close; (c) G73.0 headroom < 102,400 B -> cut ladder per the E70
  rule.
- CLOSE FLOOR E73 re-derived WITH MEASUREMENT at G73.0.

## 6. Cut ladder (in order)

C1 decimate v7 (ring-count / inset reduction) until <= 850,000 B /
<= 36,000 t. C2 drop the detail pass (keep the anatomy + two-level deck -
form before detail, A6). C3 lower the aims to 30,000 t (keep the silhouette).
C4 (last resort, requires re-scope) merge Nozzle into the Engine node.

## 7. Deferrals (NOT in E73)

Camera/cockpit rework + FPV + ship-in-cockpit HUD + separate cockpit
controls (NEXT episode - user-asked; v7 only needs to be cockpit-friendly) /
legacy-4 enemy + boss + asteroid "other assets" realism pass (standing
queue, user-asked) / PWA installable + mobile landscape D-pad + menu reorg
(Continue/New Game/Settings) (standing queue) / campaign level 5 / WebGPU
default switch (dual arm frozen by E66/I498). E73 touches ONLY assets/ship.
glb + tests (re-pins) + docs + bookkeeping.

## 8. Risks

K1 node/material name drift -> useGLB binding regression -> exact names in
the build script + ST-507 binding verify. K2 span/length drift outside the
pinned windows -> build gate asserts the windows pre-export; tune stations.
K3 tri blowout -> per-node aim/cap gates + total 36,000 exit gate + decimate
ladder (sec.6). K4 min-y < -0.400 -> rest-pose sink -> build gate. K5 mouth
band misses z = -0.8 -> flame float/bury -> build gate. K6 facet spread on
the new geometry -> re-bake v6 formula; k tuned + documented if spread
< 0.35; re-pin WITH MEASUREMENT. K7 fleet headroom tiny (geo 3,414 B / files
18,340 B / tris 487) -> mandatory pre-registered re-pins (sec.4) + tripwire
C1 at 850,000 B.

## 9. Verification bar (per iteration)

Docs-only (I539): npm test 1,187/1,187 + build 0 + dist byte-identical
5,383,468 B/184 + vendor diff empty + BOM delta 0 + hygiene (0 servers on
5173/4200/5199/4173, 0 browser tabs). Build (I540): ALL_GATES_PASS + EEVEE
audit viewed + sil96 gate (airship read incl. rear) - TEMP GLB only.
Swap (I541): re-pins WITH MEASUREMENT (log per pin: old -> new + source
measurement) + runtime smoke + quality bar 6/6 + dist WITH MEASUREMENT.
G73.0 (I542): 5 fresh harness runs (causal + pwa EXPECTED EXACT; playframe
re-pin verified) + CLOSE FLOOR E73 WITH MEASUREMENT + AGENTS.md refresh +
bookkeeping.

## 10. Changed files + next

I539 (this): + design/e73-ship-v7-research.md (NEW, LF no-BOM pure ASCII),
+ production/scope-check-E73.md (this file, LF no-BOM), ~ production/epics.md
(E73 block appended at EOF, no trailing NL), ~ production/stories.md
(ST-505..ST-508 map lines), ~ production/iterations.md (I539 section), ~
production/timeline.md (I539 line), ~ CHANGELOG.md (I539 line), ~
production/session-state/active.md (I539 note), + .evidence/I539/ (probe
script + probe out + fleet measurement script + out, force-added). Zero
src, zero asset changes yet.

Next: I540 = ST-506 (ship v7 Blender build - .evidence/I540/build_ship_v7.py
from the .evidence/I501/build_ship_v6.py helper set; build gates; TEMP GLB;
EEVEE audit + sil96 gate; NO swap).