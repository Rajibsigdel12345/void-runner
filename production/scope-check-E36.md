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
