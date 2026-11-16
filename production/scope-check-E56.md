# Scope Check - E56 Ship Remaster v3 "More Detail, More Polys" + Asset Realism III + WebGPU Re-eval (cgs-scope-check, I438)

## Summary
Bounded art epic answering the user's new directive (post-E55): "improving the main character -
currently its small looking airship, put in more detailing, increase the polygon count and make it
a real airship... like wise for the other assets make them more realistic use the polygons and gpu
resource as much as needed you can switch it to the webgpu from webgl if you are on webgl to make
them possible". Concretely: (1) MAIN deliverable - remaster assets/ship.glb from the I435 3,254-tri
"real airship" v2 to a substantially denser v3 (~10,000-13,000 tris, cap 14,000) using
displacement-driven hyper-detail + non-boolean panel/greeble passes (NOT a high-poly sculpt);
(2) CUTTABLE - make the largest remaining other assets more realistic in Blender: asteroid L + L_B
(490 tris -> ~2,000) + the comet (96 tris -> ~600); (3) DOCS-only honest re-evaluation of the
WebGPU question in the new higher-poly context (ST-401 frozen verdict KEEP WebGL2 is re-checked,
not silently kept). The renderer is untouched: 3 materials VR_Ship_Hull/Wing/Cockpit, 6 VR_Ship_*
nodes, COLOR_0 on EXACTLY hull+wings, extent inside the ship box, central nozzle mouth at
(0,0,-0.8), no 7th node, no rig/anim/morph/UV. Grounded in fresh YouTube hard-surface references
(UNVERIFIED-BY-PLAY): displacement hyper-detail (CPwTrMi4nRk) + non-boolean panels (xUDwvLeL7vM,
k2vTtHj0MME) + real-airship detail language (hSo1EE0pZnc) + detail-without-overwork guard
(DX36hit2g0s).

## Surface & Evidence
- Current ship (MEASURED, I435/I437 ground truth): assets/ship.glb 190,544 B / 3,254 tris / 4,905
  verts / 6 nodes (Hull 958t / Wings 672t / Cockpit 212t / Fin 432t / Engine 740t / Nozzle 240t) /
  3 mats / COLOR_0 exactly hull+wings / extent [2.5, 1.85, 0.70] / central nozzle mouth (0,0,-0.8)
  rim r0.190. The I437 in-game views (ship_34_front / ship_face / ship_close, .evidence/I437/)
  confirm the craft reads as a "small-ish" low-mid-poly airship: panel insets and twin nacelles
  exist but are coarse at play distance; the user wants MORE.
- Byte model (v2 measured): 4,905 verts -> 190,544 B = 38.85 B/vert avg (f32 POSITION+NORMAL,
  f32 COLOR_0 on the hull+wings corner-domain bake, u16 indices). v3 at ~11,800 tris /
  ~8,000-9,000 verts projects to ~310-380 KB.
- Other assets (current, from tests + I436 ground truth): asteroid L 490t / L_B (same topology,
  I420 recipe) / M 500t (I436 remaster - NOT touched by E56) / S 134t / comet 96t / warden 200t /
  boss 650t. L is the largest remaining rock by size-on-screen; the comet is a signature visual.
  Both are static-displacement candidates (E41: no per-frame deformation / no normal maps / no
  new draw calls).
- FACET LADDER CONSTRAINT (load-bearing test, I307 lineage): ROCK_FACET p50 must hold L < M < S
  (current A p50: L 0.4621 < M 0.6118 < S 0.7144; B: 0.4465 < 0.5984 < 0.7133). E56's L densify
  therefore caps per-vertex displacement AMPLITUDE so L p50 stays < 0.6118 (more craters/bumps
  = shape richness, NOT rougher-than-M). Pre-registered; measured at ST-411.
- Playframe pins (I437 re-pins): L 21/3508 / B 50/7872 / P 10/180. L+B WILL MOVE with the new
  ship + L rocks -> re-measure + decompose at ST-413 (same decomp pattern as I437). Predicted
  (to be measured, NOT assumed): L + (newShip-3254); B + 2x(newShip-3254) + 4x(newL-490).
- dist: 2,251,526 B / ceiling 2,460,000 B (DOC-ONLY) / headroom 208,474 B / floor 102,400 B.
  Predicted post-E56: +ship ~150-190 KB + L/L_B ~85 KB + comet ~13 KB ~= 2,500,000-2,550,000 B
  -> ceiling re-negotiated ONCE to 2,700,000 B (DOC-ONLY; floor 102,400 B kept; headroom
  >= ~150,000 B).
- WebGPU: the user re-raised the switch. Honest re-check (ST-412, DOCS-only): higher poly does
  NOT change the calculus - a ~12k-tri scene is a tiny fraction of WebGL2 capability (the frozen
  FX stack is the deciding factor, not geometry). Expected verdict KEEP WebGL2 with flip
  criteria documented. No silent switch.
- YouTube grounding (4 queries 32 raw this session, I438; all UNVERIFIED-BY-PLAY = watched
  highlights/key moments, method grounding, NOT yet implemented):
  - Skill La Noodle "Create Spaceships with TONS OF DETAIL | Blender Tutorial" (CPwTrMi4nRk) -
    displacement-based hyper-detail: subdivide + displace for density, shape with bold forms;
    the primary technique for "increase the polygon count" without hand-modeling every greeble.
  - ChuckCG "Create Sci-Fi Panels and Greebles in Blender (No Paid Addons)" (xUDwvLeL7vM) -
    random-select faces + bubble/solidify(-0.01) panel trick, no booleans (complements the
    I433 k2vTtHj0MME inset method).
  - Boylei "Custom Airship From Zeppelins and a River Boat" (hSo1EE0pZnc) - real airship detail
    LANGUAGE: catwalks between hulls, staying cables, antennas, filler pieces, weathering patches
    -> silhouette-level greeble vocabulary (cables as thin cylinders, budget-bounded).
  - Nico Linde "Quick & Easy Megastructures in Blender" (DX36hit2g0s) - "tons of detail does not
    have to be hard work": displacement + clever primitives; the anti-over-engineering guard.
  - Reused from I433 (still applicable): greebles-as-function zit7UmzcSgU; non-boolean panels
    k2vTtHj0MME.

## Scope Fit
- Fits the project stage (post-E55 art epic; user explicitly requested this pass; 100-iteration
  budget authorized). Bounded to: 1 main asset (ship v3) + 2 cuttable other assets (L/L_B, comet)
  + 1 docs-only re-eval + the closing regression. No src/ logic changes; no new draw calls; no
  rig/anim/UV; no WebGPU code change expected.
- Owner-sized stories: ST-408 (this scope+stories pass, I438) / ST-409 (asset spec v3, I439) /
  ST-410 (Blender ship v3, I440 - main) / ST-411 (Blender L+L_B+comet, I441 - CUTTABLE) /
  ST-412 (WebGPU re-eval docs, I442) / ST-413 (fresh R1-R5 + G56.0 + close, I443).
- Dependencies: ST-409 -> ST-410; ST-409 -> ST-411 (facet/ladder constraints); ST-412 independent
  (docs-only); ST-413 last (needs ST-410/ST-411/ST-412 done).

## Cut Option
- ST-411 is CUTTABLE end-to-end (docs-only note, keep current L/L_B/comet). Sub-cuts if needed:
  comet-only, or L-only.
- ST-410 is NOT cuttable but has a CG A/B SHIP gate (grayscale-clay 3/4 + face-on + closeup +
  in-game tint, old 3,254-tri v2 vs new v3) with ROLL BACK to the I435 ship.glb
  (.evidence/I435/ backups) if not clearly MORE detailed + denser. If byte/ceiling fights appear,
  land v3 at ~9,000 tris (still 2.7x v2) instead of ~11,800.
- ST-412 is cuttable (fold a 2-line verdict into the ST-413 notes) but cheap to keep.

## Deferral
- WebGPU MIGRATION itself (re-eval only in E56; migration would be a new epic with TSL FX
  re-author). Asteroid MATERIAL craters (needs UV pipeline - UV-free by contract). i18n tail +
  touch, per-hit impact SFX, AGENTS.md five-GLBs doc-drift (standing deferrals). S rock (134t)
  remaster deferred (S is tiny on screen; M done in E55, L done in E56).

## Recommendation
Proceed. DOCS-first: this scope doc + ST-409 asset spec (design/asset-spec-ship-remaster-3.md)
before any Blender work. Re-pins ALL pre-registered below (never silent):
- BUDGETS.ship 4500 -> 14000 (actual expected ~9,000-13,000, sweet ~11,800)
- BUDGETS.L 500 -> 2100 (actual expected ~1,800-2,000); BUDGETS.comet 200 -> 650 (actual ~500-600)
- MAX_FILE_BYTES 262,144 -> 393,216 (384 KB; ship v3 projected ~310-380 KB)
- SHIP_FACET hull+wings percentiles re-baked -> re-pin (tol 0.005, spread >= 0.35)
- ROCK_FACET.L + ROCK_FACET_B.L re-baked -> re-pin (L p50 MUST stay < M 0.6118/0.5984 ladder)
- assetPerf: totalTris 8000 -> 20000 / totalFilesKB 560 -> 768 / totalGeoKB 520 -> 700 /
  perFileKB 256 -> 400 / perFileMats 3 UNCHANGED / exactly-24-GLBs UNCHANGED
- dist ceiling 2,460,000 -> 2,700,000 B (DOC-ONLY, one-time; floor 102,400 B kept)
- playframe L 21/3508 + B 50/7872 WILL MOVE -> re-measure + decompose at ST-413 (P 10/180 expect
  unchanged; causal p1 seed 9876 / rockab 2.2/1.3/0.7 / PWA 11/11 expect ZERO)

## Risks
- GLB bloat vs dist ceiling (mitigation: single DOC-ONLY ceiling re-negotiation to 2,700,000;
  floor 102,400 B hard; measure every build).
- Facet ladder L<M<S broken by L densify (mitigation: displacement AMPLITUDE cap on L build;
  richness via crater/bump COUNT + shape, not amplitude).
- Nozzle/flame continuity: in-code single central flame column (shipMesh.js:122/134/142) needs the
  central bell to remain the dominant rear feature; decorative ports stay small.
- Blender 5.2.3 export pitfall (known since I436): all-polygons use_smooth=True, NO auto-30
  modifier (shade_auto_smooth + export_apply splits verts at 30-deg creases).
- Displacement density vs vertex welds (keep manifold + welded; recalc_face_normals before any
  bevel per the I435 lesson).
- PWA offline payload grows (~3 MB total) - still trivial; PWA 11/11 must hold at ST-413.

## Changed files or proposed files
- production/scope-check-E56.md (NEW - this file, source of truth)
- production/epics.md (E56 block), production/stories.md (ST-408..413 + STATUS),
  CHANGELOG.md, production/iterations.md, production/timeline.md,
  production/session-state/active.md (I438 bookkeeping)
- (later stories) design/asset-spec-ship-remaster-3.md, assets/ship.glb,
  assets/asteroid_L.glb + asteroid_L_B.glb + asteroid_comet.glb, tests/assetGlbs.test.js +
  tests/assetPerf.test.js (re-pins only), docs/architecture/ (WebGPU re-eval note at ST-412)

## Verification evidence
Opening (I438, DOCS-only): npm test 972/972 + npm run build 0 + dist 2,251,526 B byte-identical (headroom 208,474)
+ vendor sha256-16 76DEA8151BC9352A + hygiene (no servers, no chrome, node-only).

Closing (I443, ST-413; G56.0 gate - measured, never assumed; harnesses .evidence/I443/):
- ST-412 DONE I442: docs/architecture/webgpu-re-eval-E56.md - VERDICT KEEP WebGL2
  (re-derived, not re-quoted; flip criteria F1/F2/F3; no silent switch).
- ST-413 DONE I443 - G56.0 PASS 5/5:
  - R1 causal p1 EXACT (seed 9876): score 11334 / kills 57 / wave 2 / combo 15 / shots 198 /
    acc 0.2878787878787879 / time 36.14999999999923 / replay 2169/2220/speed 4 / afterQ MENU /
    console 0/0 / glb all-ready - render-invariant, ZERO drift vs pre-remaster pins.
  - R2 rockab EXACT: radii L 2.2 / M 1.3 / S 0.7 (18/18 with R1).
  - R3 playframe RE-MEASURED + airtight decomposed (decomp443.json): L 21/12,654
    (+9,146 = 1x ship delta 3,254->12,400; non-ship 254 byte-identical) / P 10/180
    UNCHANGED / B 50/27,654 (+19,782 = 2x(12,400-3,254) + (1,980-490)); the 32,124
    pre-measure prediction deviated -4,470 = 3x(1,980-490) because frustum culling puts
    exactly 1 of the 4 remastered L rocks in the plain probe frame (decomp: composer window
    31/12,594 = 1 ship frame 6/12,400 + non-ship 25/190 byte-identical; plain frame
    19/15,060 = ship 12,400 + 1 L 1,980 + arena 680; scene enumeration 4xL 1,980 + 1xM 500,
    ship 6 nodes 12,400, worldBoss=false). Pins re-pinned in .evidence/I443/playframe443.mjs
    (probe-only, NOT in tests/). Ship A/B view: SHIP_OK + SHIP_ERRS [] (3 PNGs).
  - R4 PWA 11/11 (prod :5199: sw active root scope + controller claimed / manifest 200
    standalone 512 icon any+maskable / offline boot no NaN / console 0/0).
  - R5: npm test 972/972 + build 0 + dist 2,407,614 B / 138 files byte-identical to I442
    (headroom 292,386 vs the 2,700,000 ceiling; floor 102,400 holds) + vendor 13/13 bad=0
    + three.module.js sha256-16 76DEA8151BC9352A + hygiene (chrome 0; ports free).
- G56.0 gate: PASS 5/5 -> E56 CLOSED 6/6 at I443. All re-pins pre-registered in this doc
  landed as measured: BUDGETS.ship 14000 [12,400] / MAX_FILE_BYTES 393,216 [270,556] /
  BUDGETS.L 2100 [1,980] + comet 650 [590] / SHIP_FACET + ROCK_FACET re-bakes /
  assetPerf 768/700/400/20000 [19,736 tris total; 264 headroom] / dist ceiling 2,700,000
  [2,407,614] / playframe L 21/12,654 + P 10/180 + B 50/27,654 (re-pinned, probe-only).

## Next owner or decision
CLOSED (I443): E56 is CLOSED 6/6 - ST-408 I438 / ST-409 I439 / ST-410 I440 / ST-411 I441 /
ST-412 I442 / ST-413 I443 all DONE; G56.0 gate PASS 5/5 (see Verification evidence).
Next epic awaits the user's next directive; standing deferrals unchanged (WebGPU migration
epic / S rock remaster / asteroid MATERIAL craters (UV pipeline) / i18n tail + touch /
per-hit impact SFX / AGENTS.md five-GLBs doc-drift).
