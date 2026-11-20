# Scope Check - E75 Campaign Expansion + Camera/Cockpit Polish WITH MEASUREMENT (I548)

## 1. Measured current state (tree-verified, I548)

- HEAD e5949b9 (I547, E74 CLOSED 5/5, pushed + deployed: origin main = e5949b9afd2325d5f658739c64dedcc0ee7c7d8a, Pages site HTTP 200).
- dist 5,559,215 B / 189 files; ceiling 6,100,000 B; CLOSE FLOOR E74 = 540,785 B (measured at G74.0, I547).
- npm test 1,201/1,201; npm run build 0; vendor r187 4/4 (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- Assets: 31 GLB / 3,212,232 B / 72,449 t (I548 glb_tris.cjs). Soft asset cap 3,080 KB / 73,000 t already soft-exceeded on bytes + at 99.2% on tris (ship v7 32,499 t + E72 remaster fleet).
- Camera/cockpit audit (research sec.1.1): FPV + 4-tick crosshair + uniform-scale chase framing already SHIPPED (E71 + ST-415/416). Residuals G-a (mode-agnostic control labels), G-b (V-switch damp-vs-snap unverified), G-c (cockpit nose/crosshair/WASD-mapping never NDC-pinned) = the D1 verify-then-polish scope.
- Campaign audit (research sec.1.2): 4 levels x 4 zones, fully data-driven (level.js; isFinalLevel = level >= levelCount -> appending a row makes L5 final); campaignBoss.{hp,phases,score} keyed 1-4; i18n keys level.name.l<n> / level.zone.l<n>z<m>.
- BOM baselines: epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1; this episode docs: research 0 (LF no BOM), scope-check 1 (CRLF + BOM, house convention).

## 2. Scope fit

E75 = the accumulated post-E74 verbatim queue: cockpit FPV polish + consistent-at-distance camera framing + more enemies + a 5th linear level + a final boss + asteroid/comet bumps/craters (gated). The audit (research sec.1) confirms most of the camera/FPV/enemy-ART asks are ALREADY SHIPPED (E71/E72/E73/E74), so E75 = D1 verify-then-polish camera/cockpit / D2 level-5 data / D3 2 NEW enemy ships / D4 L5 boss / D5 gated asteroid remaster. Blender 5.2.3 headless for the D3/D4/D5 assets.

## 3. Frozen scope bounds (E75)

- D1 (camera/cockpit): NO sim change; verify-then-polish only (ST-515 measures, ST-516 fixes only measured gaps). NO speculative control-mapping inversion (verify first - K4).
- D2/D4 (campaign): pure data + level.js + campaignBoss.js extension; endless path bit-identical (campaign-gated, E64 pattern).
- D3/D4/D5 (assets): Blender 5.2.3 headless only; every asset passes the E72 render-audit + sil96 gate; re-pin WITH MEASUREMENT on every swap.
- D5 GATED: the displacement asteroid remaster ships ONLY if the ST-520 headless GPU/compute probe holds the frame budget + a re-registered tri cap; else canvas/shader fallback (0 tris) or skip. The verbatim user condition ("only if its gpu and compute heavy") IS the gate.
- NO webgpu-default change: the dual arm stays WebGL2-default (I495 C3); D5 probes both arms, registers a webgpu-only win without changing the default arm.
- i18n: 3 locales (en/zh/ja) for every new string; CJK byte pipeline (never hand-derive or console-read CJK - K5).
- vendor r187 UNCHANGED (4/4 pins hold) - no engine change this epic.

## 4. Stories (ST-514..ST-521)

- ST-514 (I548) open/research/scope - this iteration: measured audit + LABELED research (CAM-1..8 / BOSS-1..3 / AST-1..3) + D1-D5 + story map + risks K1-K7 + pin safety + dist policy (7,400,000 B PRE-REGISTERED) + this scope check. Docs-only zero src.
- ST-515 (I549) D1a - headless verification harness + screenshots + NDC probes (cockpit/chase/overview + V-switch snap-vs-damp) -> measured gap list. Test-only.
- ST-516 (I550) D1b - cockpit/camera polish for the measured gaps (mode-specific labels + damped switch-if-snap + nose/crosshair tuning-if-gap + control-mapping fix-if-confirmed).
- ST-517 (I551) D2 - Level 5 data (config row + 4 palettes dhue-checked + campaignBoss[5] + i18n en/zh/ja + tests).
- ST-518 (I552) D3 - 2 new enemy ships (Blender, sil96 + re-pin WITH MEASUREMENT). FIRST E75 ASSET LANDING -> 7,400,000 B ceiling applies.
- ST-519 (I553) D4 - L5 boss (new kind + Blender mesh + campaignBoss extension + re-pin WITH MEASUREMENT).
- ST-520 (I554) D5 - asteroid/comet remaster (gated: displacement only if probe holds budget, else canvas fallback / skip + re-pin WITH MEASUREMENT if tris change).
- ST-521 (I555) G75.0 close gate - 5 fresh harnesses + CLOSE FLOOR E75 re-derived WITH MEASUREMENT + AGENTS.md + asset budget re-derived WITH MEASUREMENT + push delegate.

## 5. Cut ladder (pre-registered, smallest first)

C1 drop the L5 boss mesh (keep the 398 t retinted monolith for L5) ~-300 KB / C2 D3 -> 1 new enemy (drop one ship) ~-220 KB / C3 D5 displacement -> canvas/shader craters ~-150-400 KB / C4 L5 -> 3 zones instead of 4 (config + i18n) ~-a few KB.

## 6. Tripwires (measured gates)

- dist: code-only stories (ST-515/516/517) stay under 6,100,000 B (floor 540,785 B); the PRE-REGISTERED 7,400,000 B ceiling applies from the first asset landing (ST-518); tripwire at 7,297,600 B (7,400,000 - 102,400 B floor) -> cut ladder C1..C4.
- pwa491: must stay SUMMARY 11/11 (K4); any regression BLOCKS the story.
- playframe/casual: EXPECTED EXACT every story except asset swaps (re-pin WITH MEASUREMENT only on a real shipped-mesh change - K3).
- i18n: any missing locale key BLOCKS the story (ST-375, K5).
- frame budget (D5): the displacement remaster must NOT regress the headless FPS probe vs the current 7 rock files (before/after, fx=off and fx=high).

## 7. Definition of done (G75.0)

E75 closes 8/8: D1 camera/cockpit verify-then-polish live (mode-specific labels + damped switch-if-snap + nose/crosshair tuning-if-gap + control-mapping fix-if-confirmed) + L5 data (config row + 4 dhue-checked palettes + campaignBoss[5] + i18n en/zh/ja) + 2 new enemy ships (Blender, sil96 + re-pin WITH MEASUREMENT) + L5 boss (new kind + Blender mesh + campaignBoss extension + re-pin) + asteroid/comet remaster (gated: displacement OR documented canvas fallback) + 5 fresh harness runs EXACT + CLOSE FLOOR E75 re-derived WITH MEASUREMENT + AGENTS.md + asset byte/tri budget re-derived WITH MEASUREMENT + quality bar 6/6 on every story.
