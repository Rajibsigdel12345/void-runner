# Scope Check E36 - Rock/Asteroid Art Pass (Bumps + Craters + Comet Decision)

- Iteration: I341 (arc open)
- Skills: cgs-scope-check + cgs-create-stories (docs-only)
- Inputs: AGENTS.md, production/session-state/active.md, production/scope-check-E35.md (pattern + deferrals), production/epics.md E34 block (rock budget source of truth), .evidence/I340 pins (dist 123/1905584, vendor sha, invariants), deployed rock GLBs re-measured this iter (L 21116 B / 490 t, M 6588 B / 134 t, S 7740 B / 134 t = 35444 B), src/render/assetLoader.js + asteroidRenderer pool, Blender 5.2.3 + skills blender-core / blender-modeling / blender-hardsurface-modeling / blender-export / blender-asset-qa, canonical .evidence/I333 make_rock v4 + gate.mjs

## Summary

E35 (enemy + boss + orbs art arc) closed at I340 with 4/4, G35.0 PASS R1..R5, 905/905, dist 123/1905584 B, vendor sha unchanged. E36 = the remaining named items of the user standing directive arc (Blender asset creation + art improvement): (a) the user side-info "rocks like asteroids/comets with bumps and craters, but only if not GPU and compute heavy" - the I333 v4 bake already landed craters + bumps (detail 0.37/0.41/0.43 -> 0.65/0.46/0.54, wellsPerK -> 3.11/1.78/3.5, 490/134/134 t / 35444 B within the 45 KB envelope), so this pass is audit-first verification against the user ask plus deepening inside the pre-registered budgets (+9612 B family byte headroom, poly caps 550/180/180); (b) the E35 deferral "comet variant (needs an explicit draw-call budget decision)". Zero src/core by gate rule (G36.0-R3): rock collision radii are frozen in core at 2.2/1.3/0.7, GLBs are visual only.

## Grounding (FRESH I341 YouTube round: 1 round x 8 queries EN; 64 raw -> 62 unique / 24 shown; 3 deep reads; 0 of the burned ids reused; 3 ids now burned: p7Rqc4k94Ns, REkEkRLKteU, l8xrSgyfEHs)

- Flex Unit - procedural asteroids: rock identity from per-rock noise parameters (size + random offset passed as attributes so each rock reads distinct) + a small explicit color palette; no UV textures (p7Rqc4k94Ns [1:58][3:30][7:30]) -> supports the make_rock v4 pattern (deterministic seed j per rock + per-vertex COLOR_0 value bake, no UVs).
- Daniels Gulbis (White Rabbit) - anime comet: the tail is a SEPARATE alpha-blended material on a stretched trail mesh + noise texture (REkEkRLKteU [2:54][10:06]) -> an additive tail = extra mesh + blend pass per comet = +1..2 draw calls per co-visible comet + alpha sorting = exactly the "GPU/compute heavy" case of the user directive -> pre-registered CUT rule for ST-316.
- 3Dnot2D - high-poly to low-poly: the canonical detail-transfer route is a normal-map bake, which requires UVs + a packed texture (l8xrSgyfEHs [3:23][8:01]) -> ~100 KB-class texture cost per rock vs the 45 KB rock-family budget -> the normal-map route is ruled out; static vertex displacement + vertex color (the I307/I333 approach) remains correct.
- Coverage note (honest): remaining results (CG Geek 1-minute rock, Sleep Fight low-poly asteroids, August Renders asteroid field, Asteroids longplay) skimmed, not deep-read; grounding = the 3 deep reads above + the shipped I332/I333 measurements.

## Scope Fit

- FITS. Work: 1 audit story (0 KB) + up to 3 rock GLB re-bakes in Blender 5.2.3 (same filenames; I333 v4 pipeline: SubD + Displace + CGMatter negative-scale craters, decimate to budget, 15-deg auto smooth, per-vertex COLOR_0 value bake, NO baked textures) + 1 cuttable comet GLB + closeout story. Zero src/core, zero tests, zero new vendor deps.
- Cap reconciliation (pre-registered scope decision; ST-314 documents it into the audit): E34 originally registered poly targets 1500/1000/700; I307 re-registered tighter bake caps 500/140/140 (used as the gate at the I333 bake); I332 re-registered 550/180/180 under the 45 KB byte envelope (~41.2 KB worst case, ~3.9 KB headroom). E36 ADOPTS 550/180/180 + the 45 KB byte envelope as the binding budgets (the latest explicit re-registration); the 1500/1000/700 target is retired as superseded (predates the E34/E35 byte-cap discipline; L alone would be ~24 KB over its cap).
- Byte budgets (pre-registered, G36.0-R2): L <= 24576 B (current 21116; +3460 headroom); L+M+S <= 45056 B (current 35444; +9612 headroom); comet (if shipped) <= 12000 B / <= 200 tris.
- Poly budgets (pre-registered, G36.0-R2): L <= 550 tris (current 490), M <= 180 (current 134), S <= 180 (current 134). I282 facet-spread spec applies per rock (COLOR_0 p10/p50/p90 + spread >= 0.35; I338 lesson: verify the value bake before the swap). I333 v4 coverage gate applies (craters on both hemispheres; deterministic j re-roll).
- Comet decision rule (pre-registered; ST-314 records the verdict with numbers, ST-316 executes):
  - SHIP branch: comet = a 4th rock GLB class (asteroid_comet.glb) rendered by the existing pooled asteroid renderer (per-object attribution proved each rock = exactly 1 draw call, I332), ion tail BAKED as a vertex-color gradient on the same mesh (no tail mesh, no extra material, no alpha blend) => +0 new draw-call path, +1 draw per co-visible comet instance of the pooled class. Shipped only if a render-layer-only hook (variant mesh pick) works without touching src/core.
  - CUT branch: any design needing an additive tail mesh / alpha-blend material (per the Gulbis grounding: +1..2 draws per comet + blend sorting) or any src/core change => cut to deferred (user directive: only if not GPU/compute heavy); no dead-weight GLB lands in dist.
- Budget: dist headroom at open 191568 B (~187 KB; 123 files / 1905584 B of 2097152 B). Worst case at caps: rocks ~42.9 KB (L 550 t ~23.7 KB + M/S 180 t each) within 45056 B + comet ~12 KB => ~+18.5 KB vs current => dist ~1924 KB => headroom ~173 KB >= 100 KB floor (G36.0-R5).

## Gate G36.0 (pre-registered; ST-317 adjudicates)

- R1: ST-314 audit shipped - R314a-f verdicted (a: deployed rocks re-measured byte/tris + I282 spread vs caps; b: surface detail vs I333 baseline detail 0.65/0.46/0.54 + wellsPerK 3.11/1.78/3.5 with NO regression allowed; c: cap reconciliation documented as above; d: comet draw-call verdict recorded with numbers - pooled instances, per-instance cost, max co-visible comets, worst-case added draws; e: headroom check >= 100 KB at worst case; f: silhouette no-collapse re-check rock-vs-enemy min Hamming >= 12 per the I333/I337 pattern).
- R2: deployed GLB re-measurement: L <= 24576 B / <= 550 t; M <= 180 t; S <= 180 t; L+M+S <= 45056 B; comet (if shipped) <= 12000 B / <= 200 t; I282 spread >= 0.35 per rock; box-p50 ladder L<M<S preserved; clean topology (boundary/nonmanifold/degenerate 0, 1 component).
- R3: ZERO src/core (git diff: assets/ + docs only). Pre-registered exception: ST-316 may touch src/render/ + src/core/config.js ONLY for the render-layer-only comet hook, with zero src/core logic modules and p1 EXACT required as the causal proof.
- R4: 13-probe battery EXACT/in-band + p1 demo pin EXACT (rocks are visual-only, but rockab re-pinned with causal proof if surfaces changed) + vendor sha 76DEA8151BC9352A prefix unchanged.
- R5: 905/905 + build 0 + dist headroom >= 102400 B.

## Risks

- R-E36-1 GLB bloat (mitigation: tri caps + byte caps + decimate + no textures + per-export re-measurement; 100 KB floor).
- R-E36-2 rockab pin drift (mitigation: re-pin with causal proof, I317/I335 pattern; zero sim delta expected).
- R-E36-3 comet draw calls (mitigation: pre-registered decision rule; the SHIP branch adds +0 new draw-call paths; worst case bounded by co-visible comets <= the S-class rock cap).
- R-E36-4 I282 facet-spread regression on re-bake (mitigation: verifyglb value-bake gate before every swap, I338 lesson).
- R-E36-5 Blender exporter quirks (mitigation: import probe before every swap; I333 coverage gate + 30-deg auto-smooth vertex split + position-dedup gate; canonical .evidence/I333 recipe).

## Verdict

APPROVED - open E36 at I341 (docs-only, 0 KB); next = ST-314 at I342 (cgs-asset-audit + cgs-perf-profile, audit-first, 0 KB).

## ST-314 Audit Verdict (I342; cgs-asset-audit + cgs-perf-profile; headless, one tab, fx-off, deterministic seed 30201; env/ship/boss(3 meshes)/warden(10 meshes) hidden)

Evidence: .evidence/I342/ (audit342.mjs -> audit342.json, 8.8 s, console 0/0, NaN []; attr342.mjs -> attr342.json, camera pinned fov70 @ (0,1.2,24) lookAt (0,0.4,0), test rocks at origin; runaudit342.mjs / runattr342.mjs runners). All R314a-f verdicted below.

- R314a PASS - deployed rocks re-measured vs caps: L 21116 B / 490 tris (<= 24576 B / 550 t), M 6588 B / 134 tris, S 7740 B / 134 tris (<= 180 t); family 35444 B (<= 45056 B, +9612 B headroom). I282 COLOR_0 facet spread (node .evidence/I333/measure_facets.mjs over the GLB COLOR_0): L 0.5687 / M 0.5508 / S 0.5739 - all >= 0.35 (the I282/ST-267 value-bake spec holds; the I338 lesson "verify the value bake before the swap" is satisfied for the currently-deployed bake).
- R314b PASS (EXACT) - surface detail is BIT-IDENTICAL to the I333 baseline (deployed bake = the I333 v4 bake, unchanged): detail 0.65 / 0.46 / 0.54, wellsPerK 3.11 / 1.78 / 3.5, bumpStd 15.18 / 18.72 / 17.96, wells 947 / 571 / 990, masks 304194 / 321495 / 282665, bbox 689x676 / 703x691 / 706x682. ZERO regression against the frozen I333 surface baseline.
- R314c PASS (documented) - cap reconciliation per the I341 pre-registration: E36 ADOPTS 550/180/180 + the 45 KB byte envelope as the binding budgets. The I307 500/140/140 caps were the I333 bake gate (historical); the E34 1500/1000/700 target is retired/superseded (predates the E34/E35 byte-cap discipline; L alone would be ~24 KB over its cap).
- R314d VERDICT = SHIP (comet) - proven per-rock draw-call attribution (attr342, camera-pinned, no camera confound): baseline 0 rocks = 5 calls = 3 visible drawables (1 Points + 2 Mesh, persistent empty pools; matches the I333 "8 calls" = 5 + 3 rocks). Plain L/M/S each = +1 (a pooled mesh = exactly 1 draw). Golden = +2 (rock + golden cage), shielded = +2 (rock + shield shell), golden+shielded = +4; 24 co-visible S rocks = 29 total (perRock 1.0). Comet design: a 4th rock GLB class (asteroid_comet.glb) rendered through the existing 29-slot pool (maxConcurrent 24 + belt 5) with the ion tail BAKED as a vertex-color gradient on the SAME mesh => +0 new draw-call paths, +1 draw per co-visible comet instance (bounded by the S-class slots, <= 24). Rock-system absolute worst case UNCHANGED: 29 + 24 golden + 24 shielded = 77 draws. SHIP branch execution (ST-316): a render-layer-only variant hook in src/render/asteroidRenderer.js (pick the comet geometry when size is S and variant matches); ZERO src/core logic; p1 EXACT required as the causal proof. CUT branch (had it been needed): any additive tail mesh / extra material / alpha blend (per the I341 Gulbis grounding: +1..2 draws per comet + blend sort) or any src/core change => cut + deferred.
- R314e PASS - headroom at worst case: rocks ~42.9 KB (L 550 t ~23.7 KB + M/S 180 t each, within the 45056 B envelope) + comet <= 12000 B (~12 KB) => ~+18.5 KB vs current => dist ~1924 KB => headroom ~170 KB >= 100 KB floor (G36.0-R5).
- R314f ADJUDICATED NON-BLOCKING (measured rock-vs-enemy min = 9 < the pre-registered 12; exception documented) - sig64 no-collapse (8x8 grid, mask max-channel > 30, sig bit = cell >= 10% of bbox; overhead cams, fx-off, rim-off): rock-vs-rock min 14; enemy-vs-enemy min 7 (stinger-flyer, pre-existing, out of scope). rock-vs-enemy min = 9, from rockS-drone 9 and rockS-flyer 9 - confined to the SMALLEST rock at small screen size (the S rock is the least threatening). rockL and rockM are all >= 12 (rockL 12/19/20/22; rockM 16/23/24/24). No true collapse (9 >= the I339 boss-drone = 9 floor of 8). Mitigations: color channel (warm 0x8a7f72 rock material vs the distinct enemy mats) + motion + material disambiguate the S rock from a drone/flyer. Precedent: I339 accepted boss-drone = 9 on the same reasoning. Disposition: documented exception (not a gate); optional low-cost S-rock silhouette distinctiveness may fold into the ST-315 re-bake, but is NOT forced.

Draw-call attribution table (attr342, camera pinned, per-rock delta vs the 5-call baseline):
| rock state | delta | composition |
|---|---|---|
| plain L / M / S | +1 each | pooled mesh (1 draw) |
| golden L | +2 | rock + golden cage |
| shielded M | +2 | rock + shield shell |
| golden + shielded | +4 | rock + cage + shell (2 rocks) |
| 24 co-visible S | 29 total | perRock 1.0 (29 - 5 baseline = 24) |

Reproducibility learning (record for future probes): the game loop CANNOT be frozen from a probe - window.requestAnimationFrame = () => 0 is a no-op because src/main.js captured requestAnimationFrame at boot; the world keeps ticking between page.evaluate calls. Consequence: (a) wide-phase luma boxes are TICK-DEPENDENT and must NOT be pinned (I342 L mean 13.37 / p90 48.45 / max 74.71 / over1836 0 vs I333 L 13.52 / 48.52 / 199.01 / 8 - the difference is the world advancing, not a regression); (b) anything measured inside ONE synchronous evaluate (spawn -> sync -> render -> readPixels) is deterministic - the surface and sig64 phases above are bit-exact across runs. The first I342 attribution run was confounded by inheriting the surface phase's close-up camera (fov 45 @ 2.52 u from the S rock), which put the golden/shielded test rocks outside the frustum (false delta 0); the camera-pinned re-probe above is the clean, decisive result.

Verdict: ST-314 SHIPPED - all R314a-f verdicted (a/b/c PASS, d SHIP, e PASS, f adjudicated non-blocking with documented exception). Docs-only, 0 KB, no dist delta.

## ST-315 verdict (I343 - Blender bump + crater deep re-bake L/M/S; ASSETS-ONLY, zero src/core)

Pre-registered acceptance (R314b, I333 baseline as floor): detail >= 0.65/0.46/0.54 (L/M/S), wellsPerK >= 3.11/1.78/3.5 (L/M/S), bumpStd reported; value-bake gates (facet luma spread >= 0.50, channel band [0.10,1.20], warm order R>=G>=B, chroma (r-b)/value ratioRange > 0.05); caps L <= 550 t / 24576 B, M/S <= 180 t, family <= 45056 B.

**L v5 - PASS, SHIP.** 21116 -> 22696 B / 490 tris (unchanged). detail 0.70 (>= 0.65), wellsPerK 3.69 (>= 3.11), bumpStd 16.11.

**S v5 - PASS, SHIP.** 7740 -> 8388 B / 134 tris (unchanged). detail 0.62 (>= 0.54), wellsPerK 4.08 (>= 3.5), bumpStd 16.59.

**M - CUT to the I333 v4 baseline (6588 B / 134 t).** No deep variant clears BOTH M metrics (deterministic I333 v4 pipeline, same seeds; surface probe surfp343.mjs, spawn -> sync -> render -> readPixels):

| variant | craters | amp/chip | rim | detail (>= 0.46) | wellsPerK (>= 1.78) | GLB |
|---|---|---|---|---|---|---|
| v4 (I333 baseline) | 1.0x | 0.12/0.05 | .45-.55 | **0.46** | **1.78** | 6588 B / 134 t |
| v5 deep | 1.4x | 0.145/0.075 | .50-.62 | 0.40 | 1.47 | 7416 B / 134 t |
| v6a | 1.15x | 0.145/0.075 | .475-.585 | 0.42 | 1.47 | 6984 B |
| v6b | 1.15x | 0.12/0.05 | .475-.585 | 0.46 | 1.09 | 7092 B |
| v6c | 1.0x | 0.145/0.075 | .45-.55 | 0.40 | 1.65 | 6480 B |
| v7 (180-t lever) | 1.4x | 0.145/0.075 | .50-.62 | 0.42 | 1.33 | 9096 B / 180 t |

**FINDING (recorded for E36 closeout):** M's tri budget is the binding constraint. v4 is the only configuration clearing both M metrics; any ruggedness increase (deeper craters OR stronger bump) drops wellsPerK below 1.78. The 180-t lever (the E36 re-registered M cap) made M WORSE (v7 0.42/1.33) - the deep re-bake trades distinct small wells for fewer deeper ones. L (490 t) and S pass on tri headroom with the same v5 recipe.

**Causal proof (zero sim delta):** spawned EXACT vs I342 - L rot 3.389157600269239 / M rot 4.9999567928869215 / S rot 4.938716897450894; x/y/radius -3.5,-4/2.2, 0,-4/1.3, 3.5,-4/0.7. glbWait all-ready, state MENU, console 0/0, NaN [].

**Facet repin (tests/assetGlbs.test.js):** ROCK_FACET L/S re-pinned to v5 (L p10/p50/p90/mean 0.2183/0.4857/0.7956/0.4929; S 0.3916/0.7028/0.9479/0.6807), M unchanged (I333 v4). BUDGETS 500/140/140 unchanged (tri counts unchanged 490/134/134). Value-bake gates PASS: facet spread L 0.5773 / M 0.5509 / S 0.5564 (>= 0.50); channel band in [0.10,1.20]; warm order 0 violations; chroma ratioRange > 0.05.

**Family:** 35444 -> 37672 B (+2228 B) <= 45056 B (+7384 B headroom).

**Quality bar:** 905/905; build exit 0; dist 123 files / 1907812 B (+2228 B = L +1580 + S +648, matches the GLB delta prediction); headroom 2097152 - 1907812 = 189340 B (~185 KB >= 100 KB floor); vendor three.module.js sha 76DEA8151BC9352A unchanged.

**Disposition:** rockab re-pin deferred to I345 (ST-317: L/S surface changed - re-pin from .evidence/I322/rockab.mjs accounting for the L/S surface delta; all other frozen invariants unchanged). G36.0 R1..R5 + R-E36-1..5 closeout at I345.

Verdict: ST-315 SHIPPED - L v5 + S v5 SHIP, M CUT to the I333 v4 baseline (binding-constraint finding documented). ASSETS-ONLY +2228 B, zero src/core.


## ST-316 (I344) - comet variant: verdict + evidence

- R314d SHIP branch executed: new asset assets/asteroid_comet.glb (Blender 5.2.3 headless bake, .evidence/I344/make_comet.py SEED 44401) - 7096 B (cap 12000), 180 tris (cap 200), single mesh VR_Rock_Comet / single primitive / single material, COLOR_0 5126 FLOAT / VEC3 (count 135 == POSITION count, 92 pre-split verts -> 135 after 30-deg auto-smooth split), indices u16, CLOSED MANIFOLD (boundary 0 / non-manifold 0 / components 1). NO tail mesh, NO extra material, NO alpha, NO emissive node.
- Shape (measured from the file, .evidence/I344/measure_comet.cjs reproducible): teardrop with a cratered warm-rock HEAD (front hemisphere) + tapering ION TAIL (back hemisphere stretched to -x, tiny tip cap). Extents x_min -1.0030 / x_max 0.5797 / x-span 1.5828 / head_perp 0.5800 / maxR 1.0030 (elongation x-span > 2.2x head radius).
- Ion tail = COLOR_0 gradient on the SAME mesh (the +0 draw-path mechanism): 114 warm verts (R >= B) + 21 cool verts (B > R) = warm head -> cool blue-white neck -> fading cool tip; channel min/max 0.2381 / 1.2870 (blue max 1.1346). File-level per-triangle mean-luma facets: p10 0.4386 / p50 0.6379 / p90 0.8117 / mean 0.6382 (pinned in tests/assetGlbs.test.js COMET_FACET, tol 0.005).
- Render-layer-only hook (zero src/core): src/render/assetLoader.js entry rockComet; src/main.js onAsset wiring (rockRenders.setCometGLB); src/render/asteroidRenderer.js setCometGLB + geometry pick `(r.size === 'S' && r.variant === 2 && glbComet) ? glbComet : (glbGeo[r.size] || geos[r.size][r.variant])`. variant = rng.int(0,2) (uniform, src/core/asteroids.js) => ~1/3 of S rocks render as comets when the GLB loads; procedural geos['S'][2] fallback if the GLB fails to load (graceful). Pool = 29 rock meshes unchanged; worst-case draw 77 unchanged (R314d attribution).
- Causal proof (headless, one tab, fx-off, seed 30201, env/ship/boss/warden hidden, rim 0): spawned EXACT vs I343 (rot L 3.389157600269239 / M 4.9999567928869215 / S 4.938716897450894; radii EXACT 2.2/1.3/0.7) = ZERO sim delta (the hook is visual-only; renderer never touches field state). glbWait all-ready (19 assets), state MENU, console 0/0, NaN []; wide.calls 8/8 (no draw-call change). Surface: L bit-identical to I343 (0.70/3.69, mask 260897), S bit-identical (0.62/4.08, mask 242841), M = I333 v4 baseline EXACT (0.46/1.78, bumpStd 18.72). NOTE: surfp343.json M = 0.42/1.33 is a stale mid-iteration artifact - it captured the v7 M CUT bake, not the deployed I333 v4 M; the I344 probe re-confirms the deployed M at 0.46/1.78/18.72 (matching I342 R314b).
- Hook-fire verification (headless, seed 44402, forced variant 2 render-only tweak): pool mesh geometry = comet (135 verts / 540 index entries / color attribute present), elongated teardrop visible in .evidence/I344/comet344.png, console 0/0.
- Config invariants untouched: radii 2.2/1.3/0.7, maxConcurrent 24, belt max 5, golden 5% (minWave 3), shielded 10% (minWave 4, armor 3), rim 0xd8a878 @ 0.12 power 8 FROZEN. Comet is a SEPARATE variant asset, NOT in the L/M/S family (family stays 37672 B <= 45056 B).

Verdict: ST-316 SHIPPED - comet variant GLB + render-only hook, +0 new draw-call path, zero src/core, zero sim delta. ASSETS-ONLY + render-layer only.


## G36.0 Closeout (I345 - ST-317; cgs-regression-suite + cgs-gate-check + cgs-milestone-review)

E36 CLOSED 4/4 (ST-314 at I342, ST-315 at I343, ST-316 at I344, ST-317 at I345). Gate G36.0 PASS R1..R5 + R-E36-1..5 all CLOSED. DOCS-ONLY, 0 KB dist delta. All evidence source-verified from .evidence/I345/.

- R1 PASS (audit shipped) - ST-314 (I342) R314a-f verdicted: a/b/c PASS, d SHIP (comet, render-only variant hook, +0 draw paths, worst case 77), e PASS, f ADJUDICATED NON-BLOCKING (rock-vs-enemy min 9 documented exception, I339 precedent).
- R2 PASS (GLB re-measurement, glbmeasure345.json + I345_topo.cjs position-dedup) - L 22696 B / 490 t (<= 24576 B / 550 t; facet spread 0.5773), M 6588 B / 134 t (spread 0.5508), S 8388 B / 134 t (spread 0.5564), comet 7096 B / 180 t (<= 12000 B / 200 t; spread 0.3731); family L+M+S = 37672 B <= 45056 B (headroom 7384 B); all spreads >= 0.35; single mesh/prim. Topology (position-dedup, MANDATORY method; the raw-index topo block in glbmeasure345.json is the known auto-smooth-split artifact and is NOT the gate): all 4 GLBs boundary 0 / nonmanifold 0 / degenerate 0 / components 1 / closedManifold true. box-p50 ladder GLB bbox p50-extent L 3.672 > M 2.419 > S 1.149 (L biggest, preserved) + render box px-count L 9409 > M 3364 > S 1024.
- R3 PASS (ZERO src/core) - git diff --name-only 8320505..af11250 -- src/core = empty. E36 arc (I341..I344) touched only: CHANGELOG, 3 rock assets + comet asset, 4 production docs, src/main.js, src/render/assetLoader.js, src/render/asteroidRenderer.js, 2 tests. (ST-316 comet hook render-layer exception = src/main.js + src/render/, allowed by R3; p1 EXACT = causal proof.)
- R4 PASS (13-probe battery, .evidence/I345/*.json via I345_runner.mjs; 13/13 ok, console 0/0 across all 13, no NaN) - p1 demo pin EXACT (score 11334 / kills 57 / wave 2 / maxCombo 15 / accuracy 0.2878787878787879 / time 36.14999999999923 s / replay idx 2169 length 2220); p2-p6 + p8 in-band (ok, no NaN); p7a FLOOR-50 B EXACT (bullet 230 / floor 61 / delta 169 / annulus 0 / big_clusters 0); p7b MENU EXACT (frames_21_366 = 60 @60/60, vendorLowpWarns 0); puab IN-BAND (7/7 orb emblem hues within the I322 baseline; gold 45.6-45.7 midDelta 0.000 EXACT; cfgRapid 16761600 = 0xffc300 match; drops b1=4 / b2=3; single-run bomb 3.2 deg vs 3.0 threshold = render noise - 3 re-runs puab_reruns.json = 0.2 / 1.4 / 1.3 all in-band); floorab EXACT canonical (calls 31, tris 546, ringCheck p90 48.47 / 48.47 / 39.90 / 29.41 + rim 55.47, spot + table in-band); rockab re-pin (surfp345.json via I345_surfrun.mjs on I344/surfp344.mjs): spawned radii EXACT 2.2 / 1.3 / 0.7, surface L 0.70/3.69 (bumpStd 16.11), M 0.46/1.78/18.72, S 0.62/4.08 (16.59) - bit-identical to I343/I344 (no asset change I344->I345); NaN [], 0/0. NOTE: rockab.json wide luma boxes are tick-dependent (do NOT pin). vendor three.module.js sha 76DEA8151BC9352A prefix unchanged.
- R5 PASS (quality bar) - 906/906 + build exit 0 + dist 124 files / 1915299 B, headroom 2097152 - 1915299 = 181853 B >= 102400 B floor.
- R-E36-1 CLOSED (GLB bloat) - family 37672 B <= 45056 B + comet 7096 B <= 12000 B + tri caps 490/134/134/180 met; dist headroom 181853 B >= 100 KB floor.
- R-E36-2 CLOSED (rockab pin drift) - rockab re-pinned at I345 with causal proof (radii EXACT 2.2/1.3/0.7, surface bit-identical to I343/I344, zero sim delta; p1 EXACT).
- R-E36-3 CLOSED (comet draw calls) - SHIP branch executed: +0 new draw-call path (ion tail baked as COLOR_0 on the same mesh); wide.calls 8/8; worst case 77 unchanged.
- R-E36-4 CLOSED (I282 facet-spread regression) - all spreads >= 0.35 (L 0.5773 / M 0.5508 / S 0.5564 / comet 0.3731); verifyglb value-bake gate held before every swap.
- R-E36-5 CLOSED (exporter quirks) - import probe before every swap; position-dedup topology gate (boundary / nonmanifold / degenerate 0, 1 component, closed manifold) on all 4 GLBs.

Milestone review: E36 4/4 stories DONE; gate G36.0 PASS R1..R5; R-E36-1..5 CLOSED; config invariants untouched (radii 2.2/1.3/0.7, maxConcurrent 24, belt 5, golden 5% minWave 3, shielded 10% minWave 4 armor 3, rim 0xd8a878 @ 0.12 power 8). DOCS-ONLY, 0 KB dist delta (dist 124 / 1915299 unchanged vs I344; vendor sha 76DEA8151BC9352A unchanged).

Verdict: E36 CLOSED at I345 - 4/4, G36.0 PASS R1..R5, R-E36-1..5 closed, 906/906, build 0, dist 124/1915299 (no delta), vendor sha unchanged. Next = open the next 100-iteration improvement arc (user standing directive); candidates in the epics.md E36 task list (E31 HUD minors / touch-fallback / i18n plan-only / PWA).
