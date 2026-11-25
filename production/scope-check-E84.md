# E84 scope check - Enemy Fleet Remaster Round 2 (legacy E68-4) (Blender 5.2.3 headless)

Opened I589 (ST-556). E83 closed (I588, G83.0) with ship v8 "Rigid Airship Warship" live in assets/ (1,402,896 B / 62,254 t), dist 7,093,058 B / 203, CLOSE FLOOR E83 = 306,942 B, and the P1/P2/P3 balance levers registered for E84+. DECISION: the I588 queue head ("cockpit first-person view + camera far-framing fix") is verified STALE - it is already fully shipped and audited twice (ST-415/I445 edge-aware uniform-scale chase dolly = view-angle invariant wherever the ship moves; ST-416/I446 overview + cockpit targets, V hotkey, persisted; ST-470/I504 cockpit camera-relative thrust; ST-525/I559 undamped cockpit aim; ST-526/I560 cockpit gauges; I529 cockpit crosshair DOM/CSS; ST-515/516/I549/I550 bow framing + 4-tick crosshair; scope-check-E75.md D1 audit already closed the same gap). E84 therefore RE-SCOPES to the user's standing #1 art complaint = "the new enemies type donot look like good assets you can model other spacesheeps": the legacy E68-4 first-wave enemy fleet (drone/stinger/warden/flyer, 482,704 B / 6,574 t, the weakest by tris and the highest B/t = flat COLOR_0 on coarse meshes) reads as cardboard next to the 62k-tri warship hero. The remaster is a pure-asset replacement: zero src/ changes until the ST-560 swap, and the swap itself is a node/material-generic GLB replacement (procedural fallbacks already exist in assetLoader).

## Scope Fit

- Queue-head staleness (tree-verified I589): src/core/cameraModel.js holds dollyFactor/chaseTargets (ST-415), overviewTargets/cockpitTargets (ST-416), cockpitThrust (I504), cockpitAim (ST-525), flightPathCam frameFrac 0.0; src/main.js wires ship-visible-in-cockpit (L1269), 3D fire-line hidden in cockpit (L1270), bearing strip (L1341), gauges (L1342), cockpitThrust + cockpitAim on the thrust path (L1020/L1035); config.js camera block = camHeight 9 / camBack 13 / lookAhead 2.6+2 / dolly {startFrac .55, rimScale 1.7, speed.boost 1.10} / cockpitHeight 1.02 / setback 0.15 / lookFar 60 / lookSpeed 40 / lookDrop 4.0 / fovSpeed 9 / overview 56/20; tests/cameraModel.test.js exists. scope-check-E75.md (I548) already ran this exact verify-then-polish and closed it at D1 (ST-515/516). Re-doing it would duplicate shipped + audited work.
- Research done I589 (YouTube MCP; transcripts mostly broken = metadata-only, recorded honestly): GMTK "The Challenge of Cameras" (bHdi5Ar8GXw: camera serves gameplay; intimacy vs vision) / Star Fox 64 in-cockpit mode (classic ship-frame-in-view + view-relative controls precedent) / Octodemy third-person cam (ZCb12AHKMfE) / Dylan Bennett FPS camera fix (zfIuaRzNti4) / Dota 2 cam settings (ArY4nOI0pi0). Directly relevant design-language refs for the remaster: Star Fox (distinct silhouette per role) + Elite Dangerous fighter families.
- Why enemies now: the hero is a 62,254-tri warship; the first enemies the player meets (waves 1-5) are 1,516-1,770-tri coarse meshes with flat COLOR_0 (B/t 78-79, the highest in the fleet). Different DESIGNS are requested, not just more detail.

## Remaster set (PRE-REGISTERED, auditable override)

- Default set = {drone, stinger, warden, flyer} (the legacy E68-4, the first enemies seen in waves 1-5). ST-557's audit (sil96 fill + tris + B/t composite over all 13 fleet ships) independently selects the bottom-4; tie-break priority = legacy-4. If the audit's bottom-4 DIVERGES from the default, RECORD the divergence + REGISTER the override in .evidence/I590/ (I570 pattern) before any build.
- Per-role design brief (DRAFT, finalize after ST-557 research): drone = angular boomerang / pronged swarm unit (fast, small, numerous) / stinger = needle / canard dart (fast, straight-line, aggressive) / warden = squat hex turret-hump (slow, tanky, turret aim) / flyer = crescent side-blades (mid, strafing). Each must read as a DISTINCT silhouette at 96 px (Star Fox rule: one role, one unmistakable shape).

## Frozen bounds

- IN: ST-557 fleet silhouette audit (sil96 fill + tris + B/t composite over all 13 fleet ships) + design/e84-enemy-remaster-research.md + per-role design brief in I590; build the 4 remastered ships in Blender 5.2.3 headless into .evidence/I591/ + .evidence/I592/ ONLY (never assets/ directly); EEVEE audit + sil96 continuity gate per ship; THE SWAP at ST-560 (assets/ drone/stinger/warden/flyer = v2; legacy-4 backups -> .evidence/I593/backup/); AGENTS.md asset-cap renegotiation WITH MEASUREMENT; playframe B probe -> re-pin WITH MEASUREMENT only if a remastered ship is in-frustum (A EXPECTED EXACT); 5-harness gate; G84.0 close at I594.
- OUT (deferral, NOT E84): the P1/P2/P3 balance levers (E85+, ONE by the frozen E70 protocol) / the WebGPU default-arm switch (E66 frozen dual arm; the ?fx=webgpu arm must load + render the 4 new ships - report-only by causal495's webgpu arm) / new enemy TYPES beyond the 4 remasters (no new roster entries) / level + boss design / Monolith wave-clearance pacing (already done I563) / PWA + mobile + menu (already done I544-546).

## Build brief + GLB contract (FROZEN)

- Silhouette: fleet-standard class - distinct role silhouette at 96 px (sil96 fill +30-50% vs current where tris allow); three-layer detail (far silhouette / mid paneling / near greebles) scaled to the 2,000-tri budget; tris where the camera sees (the chase cam sees the enemy's front 3/4 + flanks; the rear is cheap).
- Budget: per-ship TOTAL AIM 2,000 tris / HARD 2,500 (fleet-standard class; +29-38% vs current 1,516-1,770).
- GLB: per-ship target <= 150,000 B; HARD 200,000 B (over -> decimate pass, then re-gate; the HARD is a single-ship rebuild gate (C2), NOT a safe 4-ship landing - see Tripwires).
- FROZEN fleet contract (E68/E69/E76 D5 precedent) UNCHANGED: VR_ material naming; NEUTRAL COLOR_0 bake (grayscale, light L = (-0.45, -0.55, 0.70).normalized()); Y-up; flat node set; single root; no rig/UV/animation; export flags verbatim (GLB, use_selection, export_yup=True, export_apply=True, export_materials="EXPORT", export_vertex_color="MATERIAL", export_image_format="AUTO", export_skins=False, export_animations=False, export_normals=True, export_texcoords=False, export_tangents=False).
- Pipeline: build to .evidence/I591/ (drone v2 + warden v2) and .evidence/I592/ (stinger v2 + flyer v2) FIRST; EEVEE audit 960x540 dark world, 3 suns, 4 views x (clay + tint) + front/sil96 per ship; sil96 continuity gate = per-role fill within +/-15% of the ST-557 audit baseline; headless frame-budget probe (fx=off + fx=high) not regressed; procedural fallbacks already exist (assetLoader) so NO code change is needed; swap only at ST-560.

## Budget + pin expectations (PRE-REGISTERED)

- Code delta = 0 B (assetLoader is a generic GLTF loader; the node/material contracts are unchanged; no src/ file touched).
- Legacy-4 set: 482,704 B / 6,574 t. New-4 set target 600,000 B / 8,000 t (4 x 150,000 / 4 x 2,000).
- dist (current 7,093,058 B / 203, I588): target 7,093,058 - 482,704 + 600,000 = 7,210,354 B (delta +117,296); the 4-ship hard worst-case 4 x 200,000 = 800,000 -> 7,410,354 B is OVER the ceiling, so the cut ladder MUST engage before a full-4 hard landing; the practical 4-ship cap is the tripwire (avg ~171,800 B/ship).
- Ceiling 7,400,000 KEEP; tripwire 7,297,600 (margin at target = 87,246 B); CLOSE FLOOR E84 WITH MEASUREMENT at G84.0 (headroom floor >= 102,400 B; ~189,646 B at target -> cut ladder NOT expected).
- Asset cap renegotiation (E75/E69/E83 precedent, WITH MEASUREMENT at ST-560): tris 120,732 - 6,574 + 8,000 = 122,158 t target (hard 120,732 - 6,574 + 10,000 = 124,158 t; pre-register the hard); size 4,672,268 - 482,704 + 600,000 = 4,789,564 B target (pre-register cap 4,688 KiB = 4,800,512 B, ~11 KB margin).
- Pins: playframe A 22/62,472 + P 11/180 EXPECTED EXACT (MENU draws no enemies); playframe B 52/132,682 PROBE FIRST (.evidence/I593/playframe_probe593.cjs) -> re-pin WITH MEASUREMENT only if a remastered ship is in-frustum, else EXACT; causal495 / causal483 / pwa491 EXPECTED EXACT, NO re-pin (enemy-swap precedent I508/I509: only playframe re-pinned).
- Vendor pins r187 unchanged (no vendor change this epic): three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017.

## Stories

- ST-556 (I589) - DONE I589: open + this scope-check + queue-staleness verification + bookkeeping (docs-only).
- ST-557 (I590) - PENDING: fleet silhouette audit (sil96 fill + tris + B/t composite, all 13 fleet ships) + design/e84-enemy-remaster-research.md + per-role design brief (finalize the 4 silhouettes); if the audit's bottom-4 diverges from {drone, stinger, warden, flyer}, record + register the override.
- ST-558 (I591) - PENDING: build drone v2 + warden v2 in Blender headless to .evidence/I591/ only (build scripts; audit; sil96 continuity gate; NO game files touched).
- ST-559 (I592) - PENDING: build stinger v2 + flyer v2 in Blender headless to .evidence/I592/ only.
- ST-560 (I593) - PENDING: THE SWAP (assets/ drone/stinger/warden/flyer = v2; legacy-4 backups -> .evidence/I593/backup/) + AGENTS.md asset-cap renegotiation WITH MEASUREMENT + playframe B probe -> decision + 5-harness gate.
- ST-561 (I594) - PENDING: G84.0 close gate + CLOSE FLOOR E84 WITH MEASUREMENT + AGENTS.md item-4 refresh + push.

## Cut ladder

- C1 (set size pressure at the swap): defer the 4th ship (3-ship landing; the 4th stays legacy) if the floor would drop < 102,400 B.
- C2 (per-ship GLB > 200,000 B after ONE decimate pass): rebuild that ship at ~1,500 t (per-ship density trim), max 2 build iterations, re-gate.
- C3 (dist tripwire 7,297,600 B crossed at the swap): full revert from the .evidence/I593/backup/ legacy-4 (E84 accept round, no visible change; E85+ continues).

## Tripwires

- dist: pre-E84 7,093,058 B / 203 (I588). Target delta +117,296 B (set 600,000 B); the 4-ship practical cap = tripwire 7,297,600 B (set ~687,246 B, avg ~171,800 B/ship); the hard 4-ship 7,410,354 B is OVER the ceiling (cut ladder engages first). Ceiling 7,400,000 KEEP.
- 5-harness gate: playframe B probe -> re-pin WITH MEASUREMENT only if in-frustum (A EXPECTED EXACT); causal495 / causal483 / pwa491 EXPECTED EXACT.
- Asset cap: current 4,672,512 B (4,563 KiB) / 120,732 t (only 244 B headroom) -> renegotiated to 4,688 KiB (4,800,512 B) / 124,158 t (hard) at ST-560 WITH MEASUREMENT.
- Blender: D:/Blender/blender.exe 5.2.3 LTS (hash e13b728c6880, build 2026-10-22) - NOT on PATH; invoke the full path, -b --factory-startup -P <script>.

## Risks

- R1: 4 new meshes on low-end GPUs. Mitigation: fleet-standard 2,000-tri budget (only +29-38% vs current); draw calls UNCHANGED (same material/node contracts); the webgpu arm must load + render them (report-only).
- R2: GLB size overage. Mitigation: the cut ladder (C2 per-ship, C1 defer-4th, C3 full revert); the legacy-4 stays backed up until G84.0 passes.
- R3: silhouette subjectivity. Mitigation: the frozen 4-view x (clay + tint) + sil96 continuity gate (+/-15% of the audit baseline) per ship; ONE rework allowed per ship; verdicts logged before any swap.
- R4: the remaster must keep gameplay legibility (enemies stay readable in wave chaos). Mitigation: distinct role silhouettes + the existing per-role color/behavior contracts are unchanged.

## Recommendation + deferral

- PROCEED to ST-557 (I590). The enemy remaster is the user's explicit standing #1 art complaint; the queue head (cockpit FPV + camera far-framing) is verified STALE (already shipped + audited twice); the asset work is decoupled from the balance code until the pure-asset swap at ST-560.
- Deferred to later epics: P1/P2/P3 (E85+, ONE per the frozen E70 protocol) / WebGPU default-arm switch (E66 frozen dual arm) / new enemy TYPES / level + boss design.

## Changed-or-proposed files

- I589 (docs-only): production/scope-check-E84.md (new) + production/epics.md + production/stories.md + production/iterations.md + production/timeline.md + production/session-state/active.md + CHANGELOG.md + .evidence/I589/ (measure589.cjs/.txt).
- I590: design/e84-enemy-remaster-research.md + .evidence/I590/ (fleet audit outputs + design brief).
- I591: .evidence/I591/build_*.py + drone_v2.glb + warden_v2.glb + audit PNGs + run log (NO game files).
- I592: .evidence/I592/build_*.py + stinger_v2.glb + flyer_v2.glb + audit PNGs + run log (NO game files).
- I593: assets/ (drone/stinger/warden/flyer swap) + .evidence/I593/backup/ (legacy-4) + AGENTS.md (asset-cap renegotiation, WITH MEASUREMENT) + .evidence/I593/ harness outputs (playframe probe + re-pins).
- I594: .evidence/I594/ close-gate runner + outputs + bookkeeping + AGENTS.md item-4 refresh (CLOSE FLOOR E84).

## Verification evidence

- I589: npm test 1,237/1,237; npm run build exit 0; dist re-measured BYTE-IDENTICAL 7,093,058 B / 203; vendor 4/4 EXACT; BOM delta 0 (AGENTS 1 / epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7).
- I590: fleet audit table (13 ships: sil96 fill + tris + B/t) + bottom-4 selection + design brief.
- I591/I592: build log exit-1 gates (per-ship caps + GLB size); audit PNG set (4 views x clay/tint + sil96 per ship); sil96 continuity verdict.
- I593: 5-harness outputs (playframe B re-pinned WITH MEASUREMENT if in-frustum else EXACT; A / causal495 / causal483 / pwa491 EXACT); dist + asset cap re-measured; vendor 4/4 EXACT.
- I594: close gate 5/5; CLOSE FLOOR E84 WITH MEASUREMENT; bookkeeping BOM delta 0.

## DoD (G84.0, I594)

1. The 4 remastered ships (drone/stinger/warden/flyer v2) in assets/ (or C3: legacy-4 retained WITH the documented verdict) and render on all fx arms (webgl + default EXACT; webgpu loads + renders, report-only).
2. 5-harness gate: playframe B re-pinned WITH MEASUREMENT only if a remastered ship is in-frustum (else EXACT); playframe A / causal495 / causal483 / pwa491 EXACT.
3. dist re-measured + CLOSE FLOOR E84 = 7,400,000 - dist WITH MEASUREMENT; headroom >= 102,400 B floor (C1/C2/C3 only if tripped).
4. AGENTS.md asset cap + item-4 refreshed WITH MEASUREMENT; E84 CLOSED; P1/P2/P3 registration INTACT for E85+.
5. Hygiene: all 4 ports (5173/4173/4200/5199) free; zero browser tabs; zero terminals left running.
