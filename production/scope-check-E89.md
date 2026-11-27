# E89 scope check - Blender art pass on the E88-freed headroom

Opened I611 (ST-576..ST-580 pre-registered). E88 CLOSED at I610 (b091895, remote-verified this turn: git ls-remote origin main == b091895 == local HEAD). The user standing art ask - richer ship/enemy art via Blender 5.2.3 headless, "use polygons and GPU resources as much as needed" - is now FEASIBLE: the E88 MESHopt pipeline shrank the 34-GLB fleet 4,431,160 -> 2,731,884 B (measured ratio 1.622, bit-identical decode) and freed 2,215,516 B of permanent headroom under the 7,400,000 B dist ceiling. E89 spends it on the three art gaps, each as a separate landing (one asset per iteration): ship v9 "Mk.II" (~100-120k t rigid airship warship, replacing v8 at 62,254 t), boss.glb remaster (398 t -> ~2-3k t, the L1-4 campaign boss art gap - the current boss is the simplest model in the game), enemy v3 x5 (phantom / hauler / bulwark / sweeper / beacon).

## Scope Fit

Measured at I611 (on disk, post-I610):
- dist: 5,184,484 B / 205 files (I610 fresh measure). E89 close target: 7,297,600 B (7,400,000 ceiling - 102,400 B close-floor floor) -> envelope 2,113,116 B.
- Assets: 34 GLB / 2,731,884 B / 123,188 t (fleet encode ratio 1.622 vs raw 4,431,160 B).
- The three art gaps (measured, current pins in parentheses):
  - ship.glb v8: 1,130,488 B (MAX_FILE_BYTES 1,300,000 - ship-binding) / 62,254 t (assetGlbs ship pin; ship-specific encode ratio 1.241 vs fleet 1.622; raw 1,402,896 B = 22.5 B/t; COLOR_0 domain [0.30,1.55], k_hull 0.60 / k_wings 0.80, L = (-0.45,-0.55,0.70).normalized(), I587 percentile pins). The player ship is the hero asset and is still the v8 "warship airship" of I541.
  - boss.glb: 17,008 B / 398 t (file cap 18 KB; BUDGETS.boss 1500) - the L1-4 campaign boss, the simplest model in the fleet; a real art gap.
  - enemy v3 targets (I561/I552 remasters): phantom 163,884 B / 4,544 t (file cap 164 KB) / hauler 139,040 / 3,724 (139 KB; at the perFileMats cap 5) / bulwark 84,860 / 3,160 (85 KB) / sweeper 54,220 / 1,946 (55 KB) / beacon 88,204 / 3,144 (89 KB). Combined 530,208 B / 16,518 t. COLOR_0 domain [0.25,1.00] (I509).
- Feasibility: the envelope (2,113,116 B) covers the three gaps with margin (worst case below). Per-asset post-encode ceilings are FROZEN in the Budget section; the binding risk is the SHIP ratio variance (below).
- The mine stays procedural; the rocks / boss_archon / powerups / debris / arena-ring stay untouched (deferral queue below) - E89 is exactly 7 asset landings (1 ship + 1 boss + 5 enemies), nothing else.

## Fix set (PRE-REGISTERED)

- ST-576 (I611) - E89 open: this check FROZEN + 6-file bookkeeping. NO src. dist byte-identical 5,184,484 B / 205.
- ST-577 (I612) - ship v9 Mk.II, ONE atomic commit: (1) Blender 5.2.3 headless build (D:\Blender\blender.exe), extending the .evidence/I587/ ship v8 build scripts (bk587a/b/c.cjs): rigid airship warship ~100-120k t - inset/outset panel greebles WITHOUT booleans, gondola / fins / nacelles / prop pods; COLOR_0 same formula family v = clamp(1.0 + k*dot(n,L), 0.30, 1.55), L = (-0.45,-0.55,0.70).normalized(), per-part k re-tuned; audit set aud_ship_{front,side,back}_{clay,sil96,tint}.png; (2) GLB contract: single GLB, flat named node set (VR_Ship_*), perFileMats <= 5, no rig/morph, BIN 4-align; (3) I609 encode pattern (.evidence/I609/encode609.cjs: INDICES mode for index views, byteStride on all views, logical main bufferView fields, double-encode byte-compare determinism, ABORT on diff, orig/ backup + hash manifest); (4) swap assets/ship.glb + re-pins WITH MEASUREMENT (assetGlbs ship tri pin + MAX_FILE_BYTES + assetPerf totalFilesKB / totalGeoKB / perFileKB / totalTris); (5) harness: playframe491/483 A+B re-pin WITH MEASUREMENT (ship tris change in-frustum), causal495/483 EXPECTED EXACT, pwa491 EXPECTED 11/11. Expected dist delta: +~0.4-0.5 MB (measured).
- ST-578 (I613) - boss.glb remaster, ONE atomic commit: 398 -> ~2-3k t (ceiling 120,000 B post-encode vs 17,008 B today; the 18 KB file cap + BUDGETS.boss 1500 grow WITH MEASUREMENT); same protocol; playframe B-window tris only (52 calls unchanged), causal EXPECTED EXACT. Expected dist delta: +~30-60 KB.
- ST-579 (I614-I618) - enemy v3 x5, FIVE separate landings, one asset per iteration (order: phantom / hauler / bulwark / sweeper / beacon): same protocol per asset (Blender build -> contract -> encode -> swap -> re-pins WITH MEASUREMENT: per-asset tri pin + file-KB cap + I509 domain [0.25,1.00] + fleet pins); combined ceiling 1,100,000 B post-encode vs 530,208 B today; playframe B-window tris only, causal EXPECTED EXACT. Expected dist delta: +~400-570 KB total.
- ST-580 (I619) - G89.0 close gate: 5/5 harness (clone the I610 runner, labels CLOSEGATE) + GLB fleet smoke (34/34, fleet tris WITH MEASUREMENT, console 0/0) + fresh dist re-measure vs 7,297,600 B + CLOSE FLOOR E89 WITH MEASUREMENT + AGENTS.md refresh (asset line + item-4 chain + project one-liner) + scope-check AMENDMENT if any + E89 CLOSED. Expected dist delta: ~0 B (docs-only).

## Frozen bounds

IN (per landing, nothing else): assets/<file>.glb replacement + its .evidence/I6xx/ build+audit+encode evidence (build scripts, backups, hash manifest, audit screenshots, encode determinism check), tests/assetPerf.test.js + tests/assetGlbs.test.js cap re-pins WITH MEASUREMENT, bookkeeping (6-file pattern), the close-gate runner clone + evidence.

OUT (frozen): any src/core or gameplay change; camera / render / lighting / post-FX changes; the 5 harness runner SOURCES (clones only, labels changed); the vendor set (4 pins + decoder raw pin stay EXACT); the PWA surface (sw.js / manifest / icons untouched - the runtime cache covers the replaced GLBs); audio; the WebGPU default switch (E90, gated: causal495 EXACT parity + real-device WebGPU smoke, separate epic); boss_archon.glb refresh (deferred); rock bump-craters (deferred - only if cheap); cockpit ship-portions + cockpit-relative controls (deferred); the 27 non-E89 GLBs (untouched); the GLB contract shape (single GLB / COLOR_0 on every prim / flat named node set / perFileMats <= 5 / no rig / no morph / BIN 4-align).

## Measurement protocol (FROZEN)

1. Build: Blender 5.2.3 headless (D:\Blender\blender.exe --background --python ...). Ship v9 starts from the .evidence/I587/ v8 build source; enemy/boss builds follow the .evidence/I509/ + I561/ + I552/ build+audit patterns (aud_<name>_{front,side,back}_{clay,sil96,tint}.png + audit_glb*.cjs + audit_clay*.py).
2. GLB contract per landing: single GLB; COLOR_0 (grayscale value bake) on every prim; flat named node set; perFileMats <= 5; no rig/morph/skin; BIN bufferView tail 4-aligned.
3. Encode per the I609 pattern (.evidence/I609/encode609.cjs): INDICES mode only for index views, byteStride on ALL views, logical main bufferView fields, double-encode determinism (byte-compare, ABORT on diff), originals backed up to .evidence/I6xx/orig/ + sha256 manifest.
4. Fleet re-run: .evidence/I608/glbtris608.cjs must report the new per-asset pins EXACT + the new fleet total; the house .evidence/I547/glb_tris.cjs agrees.
5. Re-pins WITH MEASUREMENT at each landing (E88 rule: size caps = measured + 15%; tri pins tight-to-measured per the I593 convention where the house tests assert equality): assetPerf totalFilesKB / totalGeoKB / perFileKB / totalTris (+ perFileMats only if forced, with a documented reason) + assetGlbs MAX_FILE_BYTES (+ ship / boss / per-enemy tri pins + per-enemy file-KB caps + domain pins where the bake changes).
6. Quality bar 4/4 per landing: npm test green / npm run build clean / dist measured and compared against the 7,297,600 B close target + the per-asset ceiling / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + decoder raw D428E73A000057C6.
7. Gate harness per landing: causal495 (3-arm seed-9876; webgpu report-only) + causal483 EXPECTED EXACT; playframe491/483 re-pin WITH MEASUREMENT ONLY where in-frustum geometry changed (the ship landing WILL re-pin A+B; boss + enemy landings expect B-window tris growth only, 52 calls unchanged); pwa491 EXPECTED 11/11.
8. ONE atomic commit per landing (asset + encode evidence + test re-pins + bookkeeping together); push delegated to Wegener, landing verified via git ls-remote.

## Budget (pre-registered)

- Start (I610 measured): dist 5,184,484 B / 205; assets 34 GLB / 2,731,884 B / 123,188 t.
- E89 close target: dist <= 7,297,600 B (7,400,000 ceiling - 102,400 B close-floor floor); envelope = 2,113,116 B.
- Per-asset post-encode ceilings (FROZEN):
  - ship v9 <= 1,650,000 B (vs v8 1,130,488 B: delta <= +519,512 B)
  - boss.glb <= 120,000 B (vs 17,008 B: delta <= +102,992 B)
  - enemy v3 x5 COMBINED <= 1,100,000 B (vs 530,208 B: delta <= +569,792 B)
  - code + docs across the epic <= 50,704 B
  - Worst case: 5,184,484 + 519,512 + 102,992 + 569,792 + 50,704 = 6,427,484 B -> margin 870,116 B to the close target.
- RATIO-VARIANCE DECISION RULE (ship, pre-registered, I581 pattern): the ship measured v8 encode ratio is 1.241 (1,402,896 -> 1,130,488) vs the fleet 1.622. At the measured 22.5 B/t raw, 100-120k t -> 2.25-2.70 MB raw -> ~1.8-2.2 MB post-encode, which may EXCEED the 1,650,000 B ceiling. If the measured ship v9 post-encode EXCEEDS 1,650,000 B: cut ladder C1 (80-90k t) + re-encode + re-measure; if still over: 70-80k t; if still over: re-open the ship ceiling WITH MEASUREMENT as a scope-check AMENDMENT (documented +15% rule deviation) - never silently. The tri-count target and the ceiling are independent levers: the ship lands at the highest detail that encodes under the ceiling.
- MAX_FILE_BYTES (currently 1,300,000 B, ship-binding at 1,130,488 B): expected to need growth at the ship landing IF the post-encode file exceeds 1,300,000 B (likely, given the 1.241 ship ratio) -> renegotiate to measured + 15% WITH MEASUREMENT.
- Triangle growth: fleet 123,188 t -> expected ~166-190k t after all landings (ship +38-58k t net, boss +~2.6k t net, enemy v3 +~8-12k t net); totalTris grows WITH MEASUREMENT at each landing.
- perFileMats 5 (hauler at cap): every v3 asset must stay <= 5 materials or the pin grows with a documented reason.

## Cut ladder (pre-registered)

C1: ship v9 100-120k t -> 80-90k t. C2: enemy v3 x5 -> x3 (phantom / hauler / bulwark only; sweeper + beacon v3 deferred to a future round). C3: boss 2-3k t -> 1.5-2k t. Invoke ONLY if dist at the G89.0 close gate would exceed 7,297,600 B, or a quality-bar failure forces a size cut. The ratio-variance rule (Budget) is the FIRST ship response and runs before the C1 cut-ladder entry - it IS the first step of C1.

## Deferrals (out of E89, queue intact)

E90 WebGPU default switch (gated: causal495 EXACT parity + real-device WebGPU smoke) / Monolith wave-5 wall / late-wave pacing (user: wave 8/9 blue unbreakable-rock clearance felt long; I563 killableCount clear check landed, may need more) / 2 E85 luma residuals (warden +20.12 / drone +10.41) / cockpit ship-portions + cockpit-relative controls (src/render/cockpitFrame.js since I600; user critique: show part of the ship in the cockpit view, replace the crosshair line, remap controls since the cockpit only sees forward) / boss_archon (L5) refresh / rock bump-craters (only if cheap).

## Risks

1. Ship ratio variance (1.241 vs 1.622) may push the post-encode past 1,650,000 B -> pre-registered ratio-variance rule + C1 (Budget).
2. MAX_FILE_BYTES 1,300,000 B binding -> expected growth WITH MEASUREMENT at the ship landing (Budget).
3. perFileMats 5 at cap (hauler) -> any v3 asset must stay <= 5 materials or documented pin growth.
4. COLOR_0 contracts: I509 domain [0.25,1.00] (5 enemies) + ship domain [0.30,1.55] with the I587 per-part percentile pins (hull spread 0.7693 / wings spread 1.1494; k_hull 0.60 / k_wings 0.80) - v9/v3 bakes must stay in the same formula family; percentile pins re-pinned WITH MEASUREMENT.
5. Enemy v3 tris growth pushes totalTris 123,188 -> ~166-190k t -> pin grows WITH MEASUREMENT at each landing; the GLB fleet smoke at the close gate re-proves the full contract.
6. Blender 5.2.3 headless determinism: the build+audit pattern is proven (I587/I509/I561/I552); any non-deterministic export jitter is caught by the double-encode byte-compare + the audit screenshot set.

## Verification evidence

At open (I611): I610 close gate 6/6 EXACT (CLOSEGATE610) + push b091895 verified on origin main this turn (git ls-remote == local HEAD); the measured basis above is on disk. Per landing: protocol steps 1-8 produce the evidence trail (.evidence/I6xx/ + harness outputs + dist measure). At close: the G89.0 gate set (5/5 harness + GLB fleet smoke + fresh dist + CLOSE FLOOR E89 WITH MEASUREMENT + AGENTS.md refresh).

## DoD

- ST-576..ST-580 all DONE; E89 header CLOSED at the G89.0 gate.
- 34-GLB contract intact: glbtris608.cjs per-asset pins EXACT + fleet total WITH MEASUREMENT; the house glb_tris.cjs agrees.
- dist measured <= 7,297,600 B at the close gate; CLOSE FLOOR E89 WITH MEASUREMENT recorded.
- Vendor 4/4 EXACT + decoder raw pin intact.
- 5/5 harness + GLB fleet smoke at the close gate; causal arms EXACT (webgpu report-only).
- AGENTS.md asset line + item-4 chain + project one-liner refreshed WITH MEASUREMENT.
- ONE atomic commit per landing + the close-gate commit; every commit pushed (delegate) + verified via git ls-remote.
- Hygiene: 0 tabs, all 4 ports free, no terminals left.

## Next owner

I612 = ST-577 ship v9 Mk.II D1 in Blender (the .evidence/I587/ v8 build source is the starting point).

## Verification evidence (G89.0, I619)

- CLOSEGATE619 HARNESS PASS (6/6) EXACT, zero re-pins: causal495 CAUSAL495 PASS (3-arm seed-9876: webgl + default EXACT, webgpu report-only) score 11334 / causal483 score 11334 EXACT / playframe483 + playframe491 A 22/82,369 + P 11/180, B 52/172,476 EXACT UNCHANGED, console 0/0 / pwa491 SUMMARY 11/11 / fleet619 34/34 GLB 159,141 t EXACT, 69 unique meshes, 0 console err/warn, no NaN.
- Fresh dist re-measure 6,011,544 B / 205 files EXACT (byte-identical to I618; docs-only close); close target <= 7,297,600 B held with 1,286,056 B margin.
- CLOSE FLOOR E89 = 7,400,000 - 6,011,544 = 1,388,456 B WITH MEASUREMENT (headroom >= 102,400 B floor -> cut ladder C1..C3 NOT invoked at close; C1 was pre-registered at open and landed at I612, no deviation -> no AMENDMENT needed).
- E89 consumed 827,060 B (6,011,544 - 5,184,484) of the 2,113,116 B close-target envelope across 7 remaster landings (ship v9 + boss v3 + enemy v3 x5).
- AGENTS.md refreshed WITH MEASUREMENT (asset line + item-4 chain + close floor).
- DoD met: ST-576..ST-580 all DONE; E89 header CLOSED at G89.0; 34-GLB contract intact; dist measured <= 7,297,600 B; vendor 4/4 EXACT + decoder raw pin intact; hygiene clean (0 tabs, all 4 ports free, no terminals left).
- E89 CLOSED I619.
