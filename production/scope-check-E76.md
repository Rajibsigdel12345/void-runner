# Scope Check - E76 "Afterburner" WebGPU Visual Pass + Enemy Remaster + Camera/Cockpit Feel WITH MEASUREMENT (I556)

## 1. Measured current state (tree-verified, I556)

- HEAD 7ec0f26 (I555, E75 CLOSED 5/5, pushed + verified: origin main = 7ec0f260b52eb5efac353ab0a49d88d74804dcfa; Pages deploy run success but site 404 - Pages still disabled on the repo, option C in force: local main = stable).
- dist 6,341,033 B / 196 files; ceiling 7,400,000 B; CLOSE FLOOR E75 = 1,058,967 B (G75.0).
- npm test 1,228/1,228; npm run build 0; vendor r187 4/4 (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- Fleet re-measured I556 (I555 algorithm): 34 GLB / 3,970,784 B (3,877.72 KB) / 90,737 t / maxFile ship.glb 740,012 B; caps 3,900 KB / 90,800 t PASS, headroom 20,896 B / 63 t.
- Residual audit (research sec.1.1, code-verified): C-1 cockpit thrust follows the DAMPED nose (aimEase lag vs the look direction) - the user-reported W/S inversion itself is REFUTED (I549 measured + I556 code read); C-2 no speed-responsive dolly/FOV beyond fovSpeed 4 + framing constancy across the 5 levels NOT yet measured; C-3 no cockpit gauges (bow-in-frame + crosshair + bearing strip already shipped I529/I549/I550).
- WebGPU audit (research sec.1.2, measured): ALL needed TSL display nodes already vendored + pinned (BloomNode 17,230 B / GodraysNode 16,210 B / DepthOfFieldNode 15,329 B / LensflareNode 8,225 B / ChromaticAberrationNode 4,688 B / FilmNode 2,318 B / radialBlur 2,950 B / GaussianBlurNode 11,001 B in three.tsl.js 1,065,544 B + three.webgpu.js 1,350,894 B) -> zero vendor growth; in-tree webgpu arm = webgpuFx.js 7,543 B + fxArm.js 1,596 B + tslMaterials.js 1,720 B (minimal, D1/D2 extend it).
- Enemy art: 13 ships / 34,182 t (research sec.1.3); user complaint targets the newer batches (E69 phantom/hauler/bulwark + E75 sweeper/beacon).
- BOM baselines: epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1; this episode docs: research 0 (LF no BOM), scope-check 1 (CRLF + BOM, house convention).

## 2. Scope fit

E76 = the standing verbatim queue after E75: the WebGPU visual upgrade ("if having the webgpu allows for the better visuals support then please do that also") + the enemy-ship art remaster ("the new enemies type donot look like good assets you can model other spacesheeps") + camera feel ("same view angle wherever the ship moves" - measure-then-fix per CAM-x) + cockpit depth ("really feel the person is sitting in the cockpit"). The I556 research confirms: (a) every TSL node needed is already vendored -> the visual pass is code-only on an OPT-IN arm; (b) the default arm stays FROZEN WebGL2 (I495 C3) - all FX arm-gated to ?fx=webgpu; (c) the enemy remaster is Blender 5.2.3 headless (E72 pattern) with per-ship gates; (d) the cockpit W/S inversion is already fixed (refuted twice) - only the damping-lag residual C-1 is a genuine fix. NO new levels/bosses in E76 (content waits for the next epic, "step by step").

## 3. Frozen scope bounds (E76)

- D1/D2: webgpu arm ONLY (fxArm gate). The default + ?fx=webgl arms stay bit-identical every story (causal495 webgl + default arms EXACT).
- D3: verify-then-fix ONLY (K4, E75 D1 pattern) - D3a measures, D3b fixes measured gaps only; C-1 = pure function + unit tests; the scripted-intent path (harnesses) is untouched -> causal EXACT.
- D4: DOM/canvas only (0 new scene draw calls, ST-444 pattern); periphery placement; symbol-only (no new i18n strings); pwa491 must stay 11/11.
- D5: Blender 5.2.3 headless only; per-ship gates <= 5,500 t AND <= 420,000 B; sil96 continuity +/-15% per ship; E72 render-audit gate; fleet caps renegotiated WITH MEASUREMENT at landing; ONE repin WITH MEASUREMENT (the only repin story of the epic).
- D5 selection: the 3 weakest (lowest sil96 fill) among the 5 newest ships (phantom/hauler/bulwark/sweeper/beacon) per the render audit; audit output registered in the iteration block.
- i18n: no new strings expected (D4 symbol-only); any new string = 3 locales (en/zh/ja) + CJK byte pipeline (K5).
- vendor r187 UNCHANGED (4/4 pins hold) - no engine change this epic.

## 4. Stories (ST-522..ST-528)

- ST-522 (I556) open/research/scope - this iteration: measured audit (C-1/C-2/C-3 residuals code-verified + vendor TSL inventory + 13-ship fleet) + LABELED research (ART-1..6 / WEBGPU-1..6 / CAM-1..2 / HUD-1..3 / CONTENT-1) + D1-D6 + story map + risks K1-K6 + pin safety + dist policy. Docs-only zero src.
- ST-523 (I557) D1 - TSL material pass (ship + enemies, webgpu arm only) + single-tab ?fx=webgpu smoke + 5 harnesses fresh.
- ST-524 (I558) D2 - cinematic post pipeline (soft-knee bloom + CA + vignette + film; godrays/lens-flare; cockpit DOF; DPR cap 1.25) + single-tab FPS before/after registered.
- ST-525 (I559) D3 - camera feel: all-level NDC framing audit (I549 harness extended) + speed-responsive dolly/FOV tuned to the audit + C-1 cockpit thrust fix (pure function + unit tests).
- ST-526 (I560) D4 - cockpit gauges (speed/hull/shield arcs, DOM canvas, periphery, symbol-only) + HUD-2 composition check.
- ST-527 (I561) D5 - enemy remaster (3 ships, Blender headless, shared greeble parts-tree) + per-ship gates + caps renegotiated WITH MEASUREMENT + repin WITH MEASUREMENT.
- ST-528 (I562) D6 - G76.0 close gate: 5 fresh harnesses + CLOSE FLOOR E76 re-derived WITH MEASUREMENT + asset budget re-derived WITH MEASUREMENT + AGENTS.md refresh + push delegate.

## 5. Cut ladder (pre-registered, smallest first)

C1 drop cockpit DOF + godrays/lens-flare (keep soft bloom + CA + vignette + film) / C2 D5 -> 2 ships (drop the largest of the 3 selected) ~-250-400 KB / C3 drop D4 gauges (keep crosshair/bow/bearing-strip as-is) ~-10 KB / C4 D1 -> emissive-only (drop clearcoat/physical node material) / C5 D3 -> C-1 fix only (drop the speed dolly/FOV) ~-a few KB.

## 6. Tripwires (measured gates)

- dist: <= 7,400,000 B every story; tripwire at 7,297,600 B (floor 102,400 B) -> cut ladder C1..C5.
- playframe: EXACT every story EXCEPT ST-527 (measured re-pin on the shipped-mesh change).
- causal495/causal483: EXACT every story (arm-gating + scripted-intent bypass, K3/K6).
- pwa491: SUMMARY 11/11 every story; any regression BLOCKS the story.
- D5 per-ship: <= 5,500 t AND <= 420,000 B per GLB; sil96 within +/-15% of the original per ship; headless frame-budget probe not regressed before/after (fx=off + fx=high, E72 pattern).
- FPS (D2, report-only): no new hard floor - the measured before/after (median, 30 s window, ?fx=webgpu, endless L1) is registered in the iteration block; a regression > 20% vs the pre-D2 webgpu baseline invokes C1.

## 7. Definition of done (G76.0)

E76 closes 6/6: D1 TSL materials live on the webgpu arm (ship + 13 enemies emissive, palette-gain respected) + D2 post pipeline (soft-knee bloom + CA + vignette + film, +godrays/DOF unless cut) with registered FPS measurement + D3 camera feel (all-level measured NDC audit + speed dolly/FOV tuned to it + C-1 fix with unit tests) + D4 cockpit gauges (0 draw calls, pwa491 11/11) + D5 3 enemy remasters (per-ship gates + sil96 +/-15% + ONE measured repin + caps re-derived WITH MEASUREMENT) + 5 fresh harness runs EXACT (ST-527 repins WITH MEASUREMENT) + CLOSE FLOOR E76 re-derived WITH MEASUREMENT + AGENTS.md refresh (13-ship fleet + E76 deliverables + arm status) + asset byte/tri budget re-derived WITH MEASUREMENT + quality bar 6/6 on every story.