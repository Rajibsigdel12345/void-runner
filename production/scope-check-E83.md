# E83 scope check - Ship v8 "Rigid Airship Warship" remaster (Blender 5.2.3 headless)

Opened I585 (ST-552). E82 closed (I584, G82.0 accept round) with the residual registration P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 for E83+. DECISION: E83 PIVOTS to the user's #1 queue item = the Blender airship remaster. Justification: five consecutive single-lever balance rounds (E78-E82) gave diminishing returns (B56 12/30 -> 9/30; median death wave 8 -> 9; the residual wall is a MEASURED mix of burst-class + aimed-class deaths), while the user explicitly and repeatedly ranked the real-airship hero model #1 ("more detailing, increase polygon count, make it a real airship, go through the guides and reference samples"). The P1/P2/P3 registration stays INTACT for E84+ (ONE lever by that epic's own frozen rules, scope-check FIRST per the frozen E70 protocol). The v8 asset work is decoupled from balance code: zero src/ changes in this epic until the ST-554 swap, and the swap itself is a pure asset replacement (the loader contracts are node/material-generic).

## Frozen bounds

- IN: build ship v8 in Blender 5.2.3 headless into .evidence/I586/ ONLY (never assets/ directly); EEVEE audit + P1 gate (must read as a RIGID AIRSHIP at 96 px, esp. rear/chase + side); THE SWAP at ST-554 (assets/ship.glb = v8; v7 backup -> .evidence/I587/ship_v7_backup.glb); AGENTS.md asset-cap renegotiation WITH MEASUREMENT; playframe A/B re-pin WITH MEASUREMENT; 5-harness gate; G83.0 close at I588.
- OUT (deferral, NOT E83): the P1/P2/P3 balance levers (E84+, ONE by that epic's own frozen rules) / the WebGPU default-arm switch (the dual arm stays frozen per E66/I495; the ?fx=webgpu arm must load + render v8 - covered report-only by causal495's webgpu arm) / camera far-framing + cockpit FPV (v8 only needs to be cockpit-FRIENDLY, same bar as v7) / new enemy art / level + boss design / Monolith wave-clearance pacing.

## v8 build brief + GLB contract (FROZEN)

- Silhouette: R8.1 silhouette-first - rear 3/4 + side read as a RIGID AIRSHIP (zeppelin warship), not blimp-with-wings. R8.2 three-layer detail (far silhouette / mid paneling-gothic-portholes / near greebles). R8.3 tris where the camera sees (chase cam = rear 3/4, flanks, deck top; underside cheap). R8.4 functional greebles (pipes follow panel lines, brackets at joins). R8.5 scale cues (porthole rows 16/side, antenna mast, radar dish, turret humps). R8.6 rigid-airship anatomy: long envelope with 18-20 transverse ribs + 6 longitudinal gothic ribs; cruciform tail (fin + rudder + elevators); elongated belly gondola carrying the bridge; 4 wing nacelles with fairing struts + 1 centerline stack; ALL engine mouths on -Z inside z -0.8..-1.3 containing the flame apex z = -0.8.
- Budget: TOTAL AIM 60,000 tris / HARD 65,000 (exit-1 gate). Per-node AIM/CAP (6 node names EXACT, same as v7): HULL 28,000/33,000 / WINGS 5,500/7,000 / ENGINE 11,500/13,500 / NOZZLE 4,500/5,500 / COCKPIT 6,500/8,000 / FIN 4,000/5,500 (cap sum 72,500; the total gate 65,000 dominates - v7 pattern).
- GLB: target <= 1,400,000 B / HARD 1,500,000 B (over -> decimate pass, then re-gate). v7 density 22.77 B/tri -> 60,000 tris ~ 1,366,218 B; 65,000 tris ~ 1,480,070 B.
- FROZEN v7 contract UNCHANGED: 3 materials (VR_Ship_Hull / VR_Ship_Wing / VR_Ship_Cockpit); COLOR_0 on exactly 2 prims (Hull + Wings); grayscale bake domain [0.30, 1.55], light L = (-0.45, -0.55, 0.70).normalized(), k_hull 0.60 / k_wings 0.80 (tune + document if the measured spread < 0.35); export flags verbatim (GLB, use_selection, export_yup=True, export_apply=True, export_materials="EXPORT", export_vertex_color="MATERIAL", export_image_format="AUTO", export_skins=False, export_animations=False, export_normals=True, export_texcoords=False, export_tangents=False); single root; no rig/UV/animation; axis convention = v7 build-space verbatim (shipped glTF: +X span, +Y up, +Z nose; identity node transforms; the renderer applies position.y = 0.4).
- Pinned windows UNCHANGED (game contracts): min-y >= -0.400; span 3.6..4.4; length 2.34..2.86 (bow +Z to ~1.43, tail -Z to ~-1.43); the engine mouth band contains z = -0.8; the command tower stays z ~0.5-0.9 / y ~0.8-1.1 (frozen cyan emissive slot + future cockpit cam).
- Pipeline: build to .evidence/I586/ FIRST (build script .evidence/I586/build_ship_v8.py cloned from the .evidence/I540/build_ship_v7.py pattern, V8_* density knobs + per-node AIM/CAP + TOTAL gate + exit-1); EEVEE audit 960x540, dark world, 3 suns, 4 views x (clay + tint) + front/rear sil96; P1 gate verdict logged in .evidence/I586/; swap only at ST-554.

## Budget + pin expectations (PRE-REGISTERED)

- Code delta = 0 B (assetLoader is a generic GLTF loader; the node/material contracts are unchanged; no src/ file touched in I586/I587).
- dist (current 6,430,174 B / 203, I584): target 6,430,174 - 740,012 (v7) + 1,400,000 (v8) = 7,090,162 B; hard 6,430,174 - 740,012 + 1,500,000 = 7,190,162 B. Ceiling 7,400,000 KEEP; tripwire 7,297,600 (margin >= 107,438 B at hard); CLOSE FLOOR E83 WITH MEASUREMENT at G83.0 (headroom floor >= 102,400 B; ~209,838 B at hard -> cut ladder C3 NOT expected).
- Asset cap renegotiation (E75/E69 precedent, WITH MEASUREMENT at ST-554): tris 91,050 - 32,499 + 65,000 = 123,551 -> pre-register 123,550 t; size 4,009,384 - 740,012 + 1,500,000 = 4,769,372 B -> pre-register 4,660 KiB (4,771,840 B).
- Pins: playframe A 22/32,717 (ship 32,499 + 218 non-ship) -> 22/(v8 tris + 218) WITH MEASUREMENT (expected ~60,218 if v8 lands at 60,000); playframe B 52/73,172 -> re-pin WITH MEASUREMENT; causal495 / causal483 / pwa491 EXPECTED EXACT, NO re-pin (I541 ship-swap precedent: only playframe re-pinned; .evidence/I541/repins541pf.cjs, .evidence/I542/repins542pf.cjs).
- Vendor pins r187 unchanged (no vendor change this epic): three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017.

## Stories

- ST-552 (I585) - DONE I585: open + this scope-check + bookkeeping (docs-only).
- ST-553 (I586) - PENDING: the v8 Blender build + QA + export to .evidence/I586/ only (build script .evidence/I586/build_ship_v8.py; audit; P1 gate; NO game files touched).
- ST-554 (I587) - PENDING: THE SWAP (assets/ship.glb = v8; v7 backup -> .evidence/I587/ship_v7_backup.glb) + AGENTS.md asset-cap renegotiation WITH MEASUREMENT + playframe A/B re-pin WITH MEASUREMENT + 5-harness gate.
- ST-555 (I588) - PENDING: G83.0 close gate (clone of the .evidence/I584 runner pattern).

## Cut ladder

- C1 (build overage after ONE decimate pass): tune the V8_* density knobs down, max 2 build iterations, re-gate.
- C2 (P1 gate fail after ONE rework): accept WITHOUT the swap - v7 stays, E83 accept round, the v8 residual + audit evidence logged in .evidence/I586/ (the user sees no change; E84+ continues P1/P2/P3).
- C3 (dist tripwire 7,297,600 B at the swap): decimate v8 toward 1.4 MB and re-gate, or revert the swap (v7 restored from the .evidence/I587 backup).

## Tripwires

- dist: pre-E83 6,430,174 B / 203 (I584). v8 swap delta +659,988 B target / +759,988 B hard. Ceiling 7,400,000 KEEP; tripwire 7,297,600 (margin >= 107,438 B at hard).
- 5-harness gate: playframe A/B re-pin WITH MEASUREMENT (the ship mesh changes); causal495 / causal483 / pwa491 EXPECTED EXACT (no re-pin; I541 precedent).
- Asset cap: current 3,940 KiB (4,034,560 B) / 91,050 t (AGENTS.md I561/ST-527) -> renegotiated to 4,660 KiB (4,771,840 B) / 123,550 t at ST-554 WITH MEASUREMENT.
- Blender: D:/Blender/blender.exe 5.2.3 LTS (hash e13b728c6880, build 2026-10-22) - NOT on PATH; invoke the full path, -b --factory-startup -P <script>.

## Risks

- R1: a 65k-tri hero mesh on low-end GPUs. Mitigation: R8.3 tri placement (the chase cam sees rear 3/4, flanks, deck top; the underside is cheap); draw calls UNCHANGED (same 3 materials, same 6-node structure); the webgpu arm must load + render it (report-only).
- R2: GLB size overage. Mitigation: decimate pass before the swap (C3); v7 stays backed up until G83.0 passes.
- R3: P1 gate subjectivity. Mitigation: the frozen 4-view x (clay + tint) + 96 px silhouette evidence set; ONE rework allowed (C2); the verdict is logged before any swap.
- R4: the future cockpit cam needs cockpit-friendly geometry. Mitigation: the command tower window frozen at z 0.5-0.9 / y 0.8-1.1 with the cyan emissive slot.

## Recommendation + deferral

- PROCEED to ST-553 (I586). The airship is the user's explicit #1 queue item; the balance levers show diminishing returns across E78-E82 and stay registered; the asset investment is decoupled from the balance code path until the pure-asset swap at ST-554.
- Deferred to later epics: P1/P2/P3 (E84+, ONE per the frozen E70 protocol) / WebGPU default-arm switch (E66 frozen dual arm) / camera far-framing + cockpit FPV / new enemy art / level + boss design / Monolith wave-clearance pacing.

## Changed-or-proposed files

- I585 (docs-only): production/scope-check-E83.md (new) + production/epics.md + production/stories.md + production/iterations.md + production/timeline.md + production/session-state/active.md + CHANGELOG.md + .evidence/I585/ (measure585.cjs/.txt).
- I586: .evidence/I586/build_ship_v8.py + ship_v8.glb/.blend + audit PNGs + run log (NO game files).
- I587: assets/ship.glb (the swap) + .evidence/I587/ship_v7_backup.glb + AGENTS.md (asset-cap renegotiation, WITH MEASUREMENT) + .evidence/I587/ harness outputs (playframe re-pins).
- I588: .evidence/I588/ close-gate runner + outputs + bookkeeping + AGENTS.md item-4 refresh (CLOSE FLOOR E83).

## Verification evidence

- I585: npm test 1,237/1,237; npm run build exit 0; dist re-measured BYTE-IDENTICAL 6,430,174 B / 203; vendor 4/4 EXACT; BOM delta 0 (AGENTS 1 / epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7).
- I586: build log exit-1 gates (per-node caps + total + GLB size); audit PNG set (4 views x clay/tint + sil96 front/rear); P1 gate verdict file.
- I587: 5-harness outputs (playframe A/B re-pinned WITH MEASUREMENT; causal495 / causal483 / pwa491 EXACT); dist + asset cap re-measured; vendor 4/4 EXACT.
- I588: close gate 5/5 EXACT; CLOSE FLOOR E83 WITH MEASUREMENT; bookkeeping BOM delta 0.

## DoD (G83.0, I588)

1. Ship v8 in assets/ (or C2: v7 retained WITH the documented verdict) and renders on all fx arms (webgl + default EXACT; webgpu loads + renders, report-only).
2. 5-harness gate: playframe A/B re-pinned WITH MEASUREMENT; causal495 / causal483 / pwa491 EXACT.
3. dist re-measured + CLOSE FLOOR E83 = 7,400,000 - dist WITH MEASUREMENT; headroom >= 102,400 B floor (C3 only if tripped).
4. AGENTS.md asset cap + item-4 refreshed WITH MEASUREMENT; E83 CLOSED; P1/P2/P3 registration INTACT for E84+.
5. Hygiene: all 4 ports (5173/4173/4200/5199) free; zero browser tabs; zero terminals left running.