# E75 D5 - Asteroid/Comet Displacement Remaster (v12) Spec - PRE-REGISTERED (I554, ST-520)

Gated by the verbatim user condition: "make those rocks like asteroids or comets like shape
with bumps and crater, but only if its gpu and compute heavy" -> AST-1 displacement remaster
ships ONLY if the headless GPU/compute probe holds budget (this file) AND caps are re-registered
WITH MEASUREMENT. Else AST-2 (canvas/shader craters, 0 new tris) or skip.

## Probe (pattern: smoke553 + camprobe549)
- Harness `.evidence/I554/astprobe554.mjs`: headless Chrome + SwiftShader, 1280x720, dev
  server :5173 (killed after), endless run seed 55401, `__vrHalt` + deterministic
  `vr.advance(1/60)`, step to 22+ rocks (maxConcurrent 24) then measure the PRODUCTION frame
  path (`renderer.info.reset()` + `bloom.render()`) at fx=off and fx=high:
  40 warmup + 240 sampled frames (sim advances 1/60 per sample frame).
- Baseline (measured I554, 24 rocks, steps 11103):
  fx=off  msP50 2.20 msP90 3.20 calls 32 tris 51637 (max 56779)
  fx=high msP50 3.80 msP90 8.20 calls 61 tris 56845 (max 59031)

## Pre-registered gate (measured AFTER run vs baseline, same seed/steps/viewport)
- G1 fx=off:  after.msP50 <= 1.40 x before AND after.msP90 <= 1.40 x before
- G2 fx=high: after.msP50 <= 1.45 x before AND after.msP90 <= 1.45 x before
- G3 draw calls: after.callsP50 == before.callsP50 (static displacement only - no new draws)
- G4 determinism: AFTER rock list (size + pos*100 rounded) == BASELINE rock list (sim is
  asset-independent; any mismatch invalidates the comparison and re-runs)
- G5 budget: new dist (measured `npm run build`) <= 7,400,000 B; assetPerf caps re-pinned
  WITH MEASUREMENT (totalFilesKB/totalGeoKB/totalTris); BUDGETS L/M/S/comet re-pinned tight to
  measurement; CLOSE FLOOR E75 re-derived (headroom >= 102,400 B floor or cut ladder C1..C4).
G1..G4 all pass -> SHIP AST-1 with re-pins. G1/G2 fail -> AST-2 shader fallback (0 tris) or
SKIP D5 (decision documented in iterations.md); G3/G4 fail -> fix the build, re-probe.

## Remaster targets (v12 = v10/v11 pipeline at ~2.0x density; AST-1 Blender-Bones method:
subdivided base + displacement craters)
- L:  icosphere subdiv6 -> displace (fbm amp 0.19 + chip 0.06) + craters 20-28 (bowl 0.12-0.30,
      depth 0.08-0.20, raised rims) + micro-craters 8-12 (bowl 0.05-0.10, depth 0.02-0.05)
      + bumps 16-22 -> decimate to EXACT 6000 t -> maxR 2.2000 EXACT. BUDGETS.L 3200 -> 6000.
- L_B: I420 recipe on new L (lobe sstr 0.26 / aniso (1.08,0.88,1.05)), same 6000 t topology.
- M:  same pipeline at M scale (radius 1.3) -> EXACT 1800 t (cap 950 -> 1800).
- M_B: I420 recipe, same 1800 t topology.
- S:  same pipeline at S scale (radius 0.7) -> EXACT 700 t (cap 380 -> 700).
- S_B: I420 recipe, same 700 t topology.
- Comet v4: cratered icosphere head (subdiv5, x*1.35 elongation, fbm icy lumps + 5-7 craters +
  4-6 micro-craters + 4-6 bumps) decimated to 860 t + twisted ion-tail tube (20 segs x 8 rings
  = 320 t, open tip) joined = 1180 t (cap 650 -> 1200). RE-PIN: xspan (measured, keep
  elongation > 2.2*maxperp), COMET_FACET (measured), byte cap 20000 -> measured (~40 KB aim).
- Rock total: 9,090 t -> 18,180 t (2.0x). Byte est: 222,492 B -> ~430-470 KB (+~230 KB).
- Radii EXACT: L 2.2 / M 1.3 / S 0.7 (rescale_mesh_exact, 1e-4). Node VR_Rock_{L,M,S[,B]} /
  VR_Rock_Comet; mat VR_Rock / VR_Rock_Comet; COLOR_0 relief-tracking mottle, warm order
  R>=G>=B, band [0.095,1.195] (rocks) / [0.10,1.40] (comet); ladder L<M<S by facet p50
  (search windows: L [0.42,0.54] c0.46 / M [0.56,0.66] c0.61 / S [0.68,0.76] c0.72).
- Re-pins WITH MEASUREMENT on ship: BUDGETS (L/M/S/comet), ROCK_FACET / ROCK_FACET_B
  (file-level facet reader, 4-dp), COMET_FACET + xspan + comet byte cap, assetPerf
  (totalFilesKB/totalGeoKB/totalTris), assetGlbs per-file byte cap if exceeded (760 KB holds).
- SEEDS (new, distinct from v10 52417 / v9 47113 / comet 41108): L 66101, M 66203, S 66307,
  comet 66409. B variants inherit their A topology (I420 recipe, sseed offset per size).
- Visual gate: clay A/B render per size (rock_clay_ab pattern) - silhouette + crater read at
  arena distance; B silhouette distinct from A (I420 contract).
- Endless bit-identical requirement: geometry swap only - no sim/config change (radii/speeds/
  splits untouched) -> causal456/495 pins must stay EXACT; playframe A/B re-pin WITH MEASUREMENT
  only if measured ship/scene tris change (they will: rock tris in scene; A pin counts ship
  tris only at fx=off single pass - rock swap DOES change B 2-pass scene tris; measure first,
  re-pin only if changed, per the I497/I501 precedent).
- Fallback AST-2 (if G1/G2 fail): procedural crater normal/AO in the rock shader (0 new tris,
  no new draws) OR skip D5 with the gate result documented.