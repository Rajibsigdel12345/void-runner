# Performance Profile - Void Runner (ST-095 / I95, cgs-perf-profile)

Scope: desktop-web (three.js, no bundler), the full E7 feature set (boss, wave modifiers, mines, vortex, enemy bullets, adaptive quality). Measured in a Chromium browser (Playwright, 1280x720) against the live dev build at http://localhost:5173, driving the real render path (world.step + syncVisuals + bloom.render) with renderer.info sampled per frame. CPU frame times are measured on the test machine's GPU/CPU and are indicative of relative cost, not an absolute cross-machine guarantee.

## Summary

The game is comfortably inside the 60fps budget at every realistic load: steady-state CPU frame time is ~5-7ms mean (p95 ~11-14ms), draw calls stay in the 20-60 range, and triangle counts stay under ~2.3k. The one real finding is a **one-time first-gameplay-frame initialization cost of ~90-600ms** from lazy WebGL resource setup (shader compile + GPU buffer/texture upload). It is not a steady-state problem; it is a startup hitch. A boot-time renderer.compile() warm-up was implemented, measured, found insufficient, and reverted (see Verification + Optimization).

## Metric

| Scene | Draw calls | Triangles | Geoms | Textures | Programs | Frame ms (mean / p95 / p99) |
|-------|-----------:|----------:|------:|---------:|---------:|----------------------------|
| MENU (resting) | 22 | 266 | 9 | 14 | 14 | n/a (static) |
| Typical mid-game (6s, ~22 rocks, continuous fire) | 59 (peak) | 2256 (peak) | 20 | 16 | 20 | 5.3 / 11.1 / 15.3 |
| Worst realistic (boss wave 10 + 24 rocks + rapid+overdrive) | 54 (peak) | 1980 (peak) | 23 | 17 | 20 | 6.6 / 13.8 / 16.8 (steady) |
| Cold first gameplay frame (light: ship+rocks+bullets) | 28 | ~1050 | - | - | 19->22 | 95.7 (single frame) |
| Cold first gameplay frame (full feature: boss+vortex+mine+shield+powerups) | 33 | 1052 | - | - | 28->34 (post-compile experiment) | 115 (single frame) |

Frame-time rows are steady-state over 360-480 sampled frames (excluding the one-time first frame) unless labeled "single frame". Peak object counts observed: rocks 24 (cap 24), player bullets 11 (cap 64 - the cap is a safety ceiling, not reached in play), enemy bullets 2 (cap 24), mines 0 (spawner not triggered in the forced state; cap 10).

## Budget

Target: 60fps on desktop web = 16.67ms/frame (with headroom, aim <14ms steady-state).
- Frame time (steady-state): **PASS** - mean 5-7ms, p95 11-14ms across all measured scenes. The absolute worst forced case (boss + 24 rocks + stacked powerups) reaches p99 ~16.8ms, which touches the 60fps line but does not exceed it in the sampled distribution (p50/p95 remain ~7-14ms).
- Draw calls (AGENTS.md: "keep draw calls low"): **PASS** - 22 (menu) to ~59 (typical). Far under a ~100-call ceiling. Note: rocks/bullets/enemy-bullets/mines render per-mesh with shared geometry/material, so draw calls scale ~1:1 with live object count; the theoretical config-max ceiling (64 bullets + 24 rocks + 24 eb + 10 mines + ~30 base) is ~150 calls - a safety bound the game does not reach in realistic play (measured bullet peak was 11).
- Triangles: **PASS** - 266 (menu) to ~2256 (worst). Trivial for WebGL; low-poly shared geometry.
- GPU memory (geometries / textures / programs): **PASS** - 9-23 geometries, 14-17 textures, 14-20 programs. Small and bounded; generated canvas textures, no large image assets.

## Bottleneck

Steady state is not CPU-bound (mean 5-7ms) and not GPU-bound (tiny triangle counts, low draw calls). The single meaningful cost is **lazy WebGL initialization on the first render of each object type**:
- three.js defers GPU **buffer uploads** (geometry attributes/indices), **texture uploads** (the generated canvas textures: spiral, starfield, etc.), and **shader program compilation** to the first time a given geometry/material actually renders.
- Because the object pools (rocks/bullets/mines/enemy-bullets) are **empty at boot**, none of their geometry/shaders are initialized until the first gameplay frame, which then does all of it at once - producing the ~90-600ms first-frame stall. The magnitude scales with how many distinct effects are first-rendered on that frame (light scene ~90ms; full feature set ~115-593ms).
- It is strictly one-time per session: measured frames 1-3 after the first frame are 0.9-5.6ms.

### Evidence the naive warm-up is insufficient (non-obvious, worth keeping)
A boot-time `renderer.compile(scene, camera)` (with all hidden scene objects temporarily forced visible) was implemented and measured:
- It pre-compiles 28 shader programs at boot, but the light cold first gameplay frame was still **91.6ms** (programs 28 -> 33) versus **95.7ms** before the change - a ~4ms delta, i.e. **not fixed**.
- Root cause: `compile()` compiles shaders but does **not** upload GPU buffers/textures, and with empty pools at boot there are no rock/bullet/mesh meshes present to compile or upload in the first place. So the dominant first-frame cost (buffer/texture upload) is untouched.
- The change was therefore **reverted** (see Verification). Do not re-apply a bare `compile()` warm-up expecting it to remove the hitch.

## Optimization

### Primary (proposed, NOT implemented in this iteration) - offscreen warm-up render
Force the full WebGL resource set to upload + compile at boot, off-screen so there is no visible flash. Sketch (main.js, after all renderers are created and before the rAF loop boots):
1. Populate one of each pooled entity: 1 rock, 1 player bullet, 1 enemy bullet, 1 mine.
2. Activate each one-shot effect once so its material instantiates: boss, vortex, shield, each powerup type.
3. Render the scene once to a tiny offscreen `THREE.WebGLRenderTarget` (e.g. 2x2): `setRenderTarget(rt); render(scene, camera); setRenderTarget(null)`.
4. Tear down cleanly: clear the test entities, reset/hide the effects, `rt.dispose()`.
Expected result: first gameplay frame drops to ~5ms (all buffers/textures/programs already uploaded).
- Effort: ~30-40 lines plus a test asserting the post-warm-up boot state is clean (no leaked test rock, no armed effect). Medium.
- Risk: forcing a full scene with active effects at boot and tearing it down without leaking state. Must be verified with a smoke test that the first real frame starts from a clean world.

### Alternatives
- `renderer.compileAsync()` during the menu (non-blocking) covers only the shader portion and still leaves the buffer/texture upload on the first frame - a partial improvement, not a fix.
- **Defer (acceptable):** the cost is one-time per session and the game otherwise holds 60fps. Shipping with the documented startup hitch is defensible for the desktop-web target; treat the warm-up render as a polish item, not a release blocker.

## Blocking issues

None. No steady-state performance problem on the desktop-web target. The first-frame initialization cost is a one-time startup hitch (warning, not a blocker).

## Changed files or proposed files

- Added: production/perf-profile.md (this file).
- No code changes shipped. (The experimental `renderer.compile()` warm-up in src/main.js was implemented, measured, found insufficient, and reverted - main.js is byte-identical to HEAD.)

## Verification evidence

- All scene metrics and frame times above were measured live via Playwright against the dev build; each scene was driven with a deterministic fixed-timestep loop (world.step + syncVisuals + bloom.render) and renderer.info sampled per frame; frame-time percentiles computed over 360-480 sampled frames.
- First-frame stall reproduced on a cold page load: light scene 95.7ms (cold) -> frames 1-3 at 2.5-3.7ms; full-feature scene 115.3ms (post-compile experiment) -> 3.5-5.6ms. Confirms one-time cost.
- compile() experiment: light cold first frame 95.7ms (before) -> 91.6ms (after) = not fixed; reverted via `git checkout -- src/main.js`.
- node --test 233/233 green (unchanged); build exit 0 (unchanged). No rendering/gameplay code shipped, so no visual regression surface.

## Next owner or decision

- Next: I96 cgs-gate-check (advisory pre-wrap gate).
- Decision needed: implement the offscreen warm-up render (medium effort, removes the one-time game-start hitch) or defer it (documented, non-blocking). Owner: producer / technical_director. Recommendation: implement during the final wrap (I99/I100) if the budget allows; otherwise ship with the documented one-time startup hitch.

## I184 - E8E deep profile (ST-184, cgs-perf-profile)

Re-baseline of the E8E build (the full I170-I183 feel/audio/juice arc shipped on top of I95's E7 baseline) against the I95 profile above. Same method as I95/I128: live Chromium via Playwright (1280x720 logical, dpr 1.25) on the dev build, driving the fixed-step loop (advance(1/60) = tick + syncVisuals) and sampling renderer.info per frame (manual reset, autoReset off). Two render paths measured per frame: the direct path (advance + renderer.render, the I128/I182 gate method) and the real path (advance + bloom.render, the composer-with-UnrealBloomPass path the loop actually calls at high FX, matching I95). CPU times are on the test machine and are indicative of relative cost, not an absolute cross-machine guarantee. p95 is the meaningful steady-state metric (single-frame worst spikes are GC/compositor artifacts inside the evaluate, per I182).

### Summary
Comfortably inside the 60fps budget at every realistic load on both render paths: MENU idle ~0.6 ms, organic early play ~1-2 ms, and the forced worst case (24 M rocks + a live wave-5 Monolith + up to 14 enemy bullets + sustained player fire) at GPU peak 49 draw calls / 2542 triangles with p95 ~3 ms. No steady-state CPU or GPU bottleneck. The one standing finding is unchanged from I95: a one-time cold first-gameplay-frame initialization cost of ~129-586 ms (3 fresh loads this session; I95's range was 90-600 ms) from lazy WebGL resource setup plus transition-tick main-thread work. Memory is flat over a 6-second worst-case soak (no per-frame leak). Docs-only iteration - zero source changes.

### Metric
| Scene | Path | Draw calls (peak) | Triangles (peak) | Geoms | Textures | Frame ms (mean / p95 / worst) |
|-------|------|------------------:|-----------------:|------:|---------:|------------------------------|
| MENU (resting, 120 frames) | bloom/real | 22 | 268 | 9 | 14 | 0.58 / 1.9 / 2.4 |
| Organic early (wave 1, ~10 rocks, no fire) | direct | 18 | 1934 | 12 | 14 | 1.52 / 1.3 / 65.6 (GC) |
| Organic early (wave 1, ~10 rocks, no fire) | bloom/real | 31 | 1628 | 12 | 14 | 1.15 / 2.2 / 6.3 |
| Worst case (24 M rocks + live Monolith + <=14 eb + sustained fire, 3x120 soak) | bloom/real | 49 | 2542 | 19 | 16 | 1.6-1.8 / 2.9-3.5 / 3.3-6.3 (one GC window 4.6 / 11.6 / 19.4) |
| Cold first gameplay frame (3 fresh loads) | n/a | n/a | n/a | - | - | 129-586 (one-time; next frames 1-4 ms) |

Peak live-object counts in the worst case: rocks 24 (cap 24), player bullets 5-6 (cap 64), enemy bullets 14 (cap 24 - the Monolith's attack produced eb this session), Monolith alive (hp protected for the soak). Heap over the 360-frame soak: 15890 -> 15826 KB (-64 KB, flat).

### Budget
Target: 60fps on desktop web = 16.67 ms/frame (aim <14 ms steady-state).
- Frame time (steady-state, both paths): PASS - p95 1.3 ms (organic direct) to 3.5 ms (worst-case bloom); the lone 11.6 ms p95 window is a GC/compositor artifact (mean there 4.6 ms, worst 19.4 ms - the artifact class I182 documented). No scene approaches the 14 ms target or the 16.67 ms budget on any p95.
- Draw calls: PASS - 22 (menu) to 49 (worst case, composer path). The composer multiplies per-object calls across RenderPass + bloom mips + OutputPass, so the bloom-path call count is higher than the direct path (18-30) at the same load; both are far under a ~100-call ceiling. Per-object shared geometry/material keeps the scaling ~1:1 with live objects.
- Triangles: PASS - 268 (menu) to 2542 (worst case). Trivial for WebGL; low-poly shared geometry. The worst-case tris (2542) exceed I95's worst (1980) only because this session's scene carried 14 enemy bullets that I95's worst-case composition did not emphasize - still a fraction of any realistic WebGL budget.
- GPU memory (geometries / textures): PASS - 9-19 geometries, 14-16 textures, bounded. (Programs not reported: renderer.info.memory.programs is undefined in this three.js build.)
- JS heap: PASS (shallow) - flat over the worst-case soak (-64 KB). The deep entity-pooling audit is ST-185 / I185.

### Bottleneck
Not CPU-bound (p95 ~3 ms worst case) and not GPU-bound (2542 tris / 49 calls). The single meaningful cost is unchanged from I95: lazy WebGL initialization on the first render of each object type (shader program compilation + GPU buffer/texture upload, deferred until a geometry/material first renders) compounded by transition-tick main-thread work (the WebAudio graph build + 0.5 s noise-buffer generation on the Enter gesture, and wave-1 scene setup).
- This session the cost splits variably between a pre-render main-thread gap and an elevated first render call:
  - nocache=184c: 575.7 ms gap + 10.2 ms first render (~586 ms)
  - nocache=184d: 121.0 ms gap + 39.4 ms first render (~160 ms)
  - nocache=184e: 77.0 ms gap + 52.2 ms first render (~129 ms)
- The user-perceived cost is the sum (~129-586 ms), one-time per session; frames 1-3 after are 1-4 ms (verified per load). This is consistent with the I95 range (90-600 ms) and reconfirms the root cause is the one-time lazy init, not a steady-state problem.

### Optimization
- Standing decision (re-confirmed, not changed): the I95 offscreen warm-up render remains the proposed fix - populate one of each pooled entity (1 rock, 1 player bullet, 1 enemy bullet, 1 mine) + activate each one-shot effect once, render once to a tiny (2x2) offscreen WebGLRenderTarget, then tear down cleanly. Expected to drop the first gameplay frame toward ~5 ms. A bare renderer.compile() is already proven insufficient (I95: shader-only, no buffer/texture upload; reverted). Effort ~30-40 lines + a clean-boot test.
- No code changed this iteration (the profile is evidence, not code). Defer is acceptable: the cost is one-time per session and the game otherwise holds 60fps.

### Blocking issues
None. No steady-state performance problem on the desktop-web target. The first-frame initialization cost is a one-time startup hitch (warning, not a blocker).

### Changed files or proposed files
- production/perf-profile.md (this "## I184" section). No src/ or tests/ changes.

### Verification evidence
- npm test 575/575 green; node scripts/build.mjs exit 0 (baseline confirmed at iteration start).
- All metrics measured live via Playwright against the dev build; frame percentiles over 100-120 sampled frames per scene/path; renderer.info sampled with manual reset (autoReset off).
- First-frame hitch reproduced on 3 independent fresh cold loads (184c/d/e) with a timestamped + state-tagged render hook (4000-entry buffer); the one-time nature confirmed (subsequent frame-buckets 1-4 ms on each load).
- Worst-case soak: 3 windows x 120 frames of advance + bloom.render with the Monolith hp-protected (99999) so it stayed alive across all windows; per-window frame stats + GPU peak + heap at each boundary; NaN scan over ship/24 rocks/player bullets = 0; boss finite.
- Console 0 errors / 0 warnings across the full session (menu -> PLAYING -> forced scene -> soak -> screenshot, all=).
- Screenshot .evidence/I184/I184_1_worst_scene.png (WAVE 4, SMALL ROCKS modifier, ship firing, live green Monolith, M-rocks at rim, red enemy bullets, bloom glow).

### Next owner or decision
- Next: I185 ST-185 memory audit (new entity pooling) - the deep heap/leak audit this profile left to the shallow pass (cgs-perf-profile).
- Decision (carried from I95, unchanged): implement the offscreen warm-up render in the final wrap (E8F) if the budget allows, or ship with the documented one-time startup hitch. Owner: producer / technical_director.

## I214 - Asset perf + memory audit (ST-214, cgs-perf-profile)

### Summary
The 16 runtime assets (15 GLBs + the 1024x512 skybox PNG) are tiny: 111.3 KB on disk, 92.9 KB parsed geometry, 1021 unique triangles, 17 materials. The scene runs 280 pooled meshes over 26 unique geometries (116.3 KB unique - pools share geometry correctly). GPU texture memory is ~5.5 MB dominated by the I212 skybox (2.0 MB equirect + ~3 MB PMREM). All assets are fully fetched by ~540 ms after navigation start. No bottleneck found; budgets are now pinned by tests so a future asset pass can't silently regress the profile.

### Metric
| Asset | File | Parsed geo | Tris | Materials | Attributes |
|---|---:|---:|---:|---:|---|
| ship.glb | 4.9 KB | 2.1 KB | 40 | 3 | POS+NORMAL+idx |
| asteroid_L.glb | 36.8 KB | 35.6 KB | 320 | 1 | POS+NORMAL+COLOR_0+idx |
| asteroid_M.glb | 11.9 KB | 10.7 KB | 104 | 1 | POS+NORMAL+COLOR_0+idx |
| asteroid_S.glb | 10.1 KB | 8.9 KB | 80 | 1 | POS+NORMAL+COLOR_0+idx |
| boss.glb | 11.4 KB | 10.2 KB | 96 | 1 | POS+NORMAL+COLOR_0+idx |
| shield.glb | 7.2 KB | 6.1 KB | 80 | 1 | POS+NORMAL+idx |
| arena_ring.glb | 4.7 KB | 3.7 KB | 48 | 1 | POS+NORMAL+idx |
| drone.glb | 4.3 KB | 3.1 KB | 52 | 1 | POS+NORMAL+idx |
| powerup_bomb/shield/magnet/overdrive/rapid/slowmo/spread | 2.1-3.8 KB each | 1.0-2.7 KB | 13-48 | 1 each | POS+NORMAL+idx |
| skybox_equirect.png | 41.2 KB | - (2.0 MB decoded RGBA) | - | - | 1024x512 |
| **Totals** | **111.3 KB** | **92.9 KB** | **1021** | **17** | |

Runtime (live Playwright probe, mid-run paused frame): 280 meshes / 26 unique geometries / 116.3 KB unique geometry; textures in use 1024x512 (skybox bg), 768x1024 (PMREM env), 256x256, 128x128, 64x8 (~5.5 MB GPU total); 43 draw calls / 962 tris / 36 programs; 15 GLBs fetched, latest response end 537 ms after navigation start (sum of fetch durations 248 ms); skybox PNG fetched at 471 ms (+5 ms); DOM ready 727 ms.

### Budget
- Dist budget: <=2048 KB raw / <=550 KB gzip - assets occupy 152.5 KB of the 1939.2 KB raw dist (8%).
- New pinned budgets (tests/assetPerf.test.js, measured baselines in brackets): total GLB files <=160 KB [111.3], total parsed geometry <=130 KB [92.9], per-asset file <=60 KB [36.8], total tris <=1500 [1021], materials per GLB <=3 [3], zero TEXCOORD_1, COLOR_0 restricted to the four mottled assets, POSITION+NORMAL on every GLB.
- GPU: ~5.5 MB textures + 0.12 MB unique geometry - an order of magnitude under any realistic mobile/desktop ceiling.

### Bottleneck
None. Largest single items: asteroid_L.glb (36.8 KB - deliberate: it is the L rock and the budget's heaviest at 24% of the total), the skybox PNG (41.2 KB file / 2.0 MB decoded + ~3 MB PMREM - the largest GPU memory holder, accepted in I212 for the background), and 280 mesh objects (draw-call side, not memory). CPU/GPU steady state was already profiled clean in I184; this audit changes nothing there.

### Optimization
No code change warranted: geometry sharing is already maximal (26 unique geos across 280 meshes), no unused UV2 or stray attribute channels exist, and all assets are indexed with FLOAT32 (the natural export; 16-bit quantization would save ~30 KB total for zero visible benefit). The one candidate for a future art pass is asteroid_L's COLOR_0 (320 verts - fine) and a possible 512x256 skybox if GPU texture memory ever matters (would halve the 2.0 MB decode at some band detail cost) - deferred, not needed at this budget.

### Blocking issues
None.

### Changed files or proposed files
- production/perf-profile.md (this section).
- tests/assetPerf.test.js (NEW: 9 budget-pinning tests over all 15 GLBs).

### Verification evidence
- Node GLB audit script (per-asset file/geometry bytes, tris, materials, attribute sets, TEXCOORD_1 count) - numbers in the Metric table; totals 111.3 KB / 92.9 KB / 1021 tris / 17 materials / 0 TEXCOORD_1.
- Live browser probe (Playwright, ?nocache=213c session): per-asset three.js parsed bytes match the static audit (e.g. ship 2136 B / 40 tris, rockL 36480 B / 320 tris); 280 meshes / 26 unique geometries / 116.3 KB unique; texture list + dims; mid-run 43 calls / 962 tris / 36 programs; resource-timing: 15 GLBs latest end 537 ms, PNG 471 ms.
- 652/652 (was 643; +9 assetPerf budget tests, all green); build exit 0 (dist unchanged: 1939.2 KB raw / 501.3 KB gzip).

### Next owner or decision
- Next: I215 ST-215 (test batch E9: 15+ tests across under-covered core systems).
- Decision: the 512x256 skybox option is documented for a future pass but not scheduled; owner: producer if E9 art scope ever adds GPU-heavy assets (assetPerf budgets will trip first).

## I225 - E11 low-end device validation, bot-verifiable half (ST-222, cgs-perf-profile)

Method: live Chromium via Playwright on the dev build, fresh loads (?nocache=225a/b/c), 1046x714 logical, dpr 1.25. Display note: this session's display ran at 60 Hz (rAF quantum 16.65 ms, adaptive-measured fps 59.0-60.05) - the I184 machine was ~120 Hz, so frame deltas here are vsync-quantized and the CPU/GPU cost sits under the 16.67 ms floor; I184's CPU-side numbers (1.6-3.5 ms) remain the fine-grained reference. Dense worst case per tier (I182 reference scene): 24 M rocks staged via field.spawn (ring r 13-23.5) + live wave-5 Monolith (hp-protected per frame, 40 hp) + sustained player fire (input.state.firing, cleared after each soak) + ship.invuln 999 (keeps the scene staged; test rig, not a game state). 3.5 s real-rAF soaks per tier, 30 warm-up frames excluded; renderer.info sampled per frame (calls/triangles from info.render, geometries/textures from info.memory). The Monolith's first aimed bolt lands at enterTime 1.2 s + fireEvery 2.2 s = ~3.4 s, at the edge of the 3.5 s window - an 8 s follow-up soak (wave 4, FX low) measured 19 live enemy bolts at peak.

### Summary
No sustained bottleneck at either FX tier on the 60 Hz display: dense p95 16.8 ms at both tiers (at the vsync floor, not over it), sporadic single-frame drops only (HIGH 1/167, LOW 4/170) in the GC/compositor/evaluate-boundary artifact class per I182/I184. The bloom composer costs 12-14 draw calls (MENU 24->10, dense peak 53->41). The adaptive-quality ladder verified end-to-end headlessly: 20 fps synthetic x 2 windows fires the downgrade (tier low + autoLow + bloom off + toast + exact console line), 6 s of 120 fps holds low (hysteresis, no auto-upgrade), userSet('high') locks (2 bad windows under lock stay high), reset() returns to high/unlocked. The F hotkey path re-applies settings before userSet, so user changes restore bloom/fxCount correctly. DPR cap min(dpr, 2) code-verified (main.js L62) and runtime 1.25 -> 1.25 (cap not engaged below 2; a dpr 2-3 device is on the hardware checklist). The reduced-motion + FX-low combo is playable: 600-tick pilot, NaN 0, stable frames (16.66/17.0/17.1), and 2 kills under reduced motion produced zero kill punch (juiceTally kill channel unchanged, magnitude 0) - the I224 gate re-confirmed inside the combo. Three scope-vs-code flags: the FX 'off' tier does not exist (only high/low), load-reactive DPR 1.5 does not exist (single boot-time setPixelRatio), and auto-downgrade does not update the stored settings tier (panel shows the stored 'high' while rendering low - minor UX divergence, no perf impact). Evidence-only iteration: zero source changes.

### Metric
| Scene | FX tier | Path | Draw calls (peak) | Triangles (peak) | Geoms | Textures | Frame ms (mean / p95 / worst) | Drops >17.5 ms | Doubles >30 ms |
|-------|---------|------|------------------:|-----------------:|------:|---------:|------------------------------|---------------:|---------------:|
| MENU idle (1.6 s) | high | bloom/real | 24 | 162 | 10 | 17 | 16.65 / 16.8 / 19.2 | 1 | 0 |
| MENU idle (1.6 s) | low | direct | 10 | 148 | 10 | 17 | 16.65 / 16.9 / 17.1 | 0 | 0 |
| MENU idle | off | - | N/A: tier does not exist (flag 1) | - | - | - | - | - | - |
| Dense (24 M + Monolith + barrage, 3.5 s) | high | bloom/real | 53 | 1898 | 15 | 18 | 16.75 / 16.8 / 33.3 | 1 | 1 |
| Dense (same, 3.5 s) | low | direct | 41 | 2092 | 14 | 18 | 16.85 / 16.8 / 39.0 | 4 | 2 |
| Dense + 19 live eb (8 s, wave 4) | low | direct | 32 | 2100 | - | - | 16.65 / 16.8 / 17.3 | 0 | 0 |
| Dense, rm + fx-low combo (600-tick pilot + 2 s soak) | low + rm | direct | - | - | - | - | 16.66 / 17.0 / 17.1 | 0 | 0 |

Cross-reference vs I184 (120 Hz machine, CPU-side cost): I184 worst case GPU peak 49 calls / 2542 tris with <=14 eb and bloom p95 2.9-3.5 ms; I225 HIGH dense 53 calls / 1898 tris with ~0-1 eb in window. Same order; the call-count rise is the I184->I224 content arc (engine trail, pickup/magnet particles, kill feed) at eb-lighter scene composition. Cold first gameplay frame (warm-up max): 149.7 ms (high run) / 116.5 ms (low run) - inside the standing one-time lazy-WebGL-init range (I95 90-600 ms, I184 129-586 ms).

### Budget
- 16.67 ms (60 fps) at the measured display: dense p95 16.8 ms at both tiers = PASS (at the vsync floor; CPU-side headroom is I184's ~10 ms/frame on 120 Hz).
- 14 ms aim (I184): met on the 120 Hz machine (I184 p95 2.9-3.5 ms); not measurable as headroom at 60 Hz (vsync floor dominates) - PASS by inference, flagged.
- Drop rate: HIGH 0.6% (1/167), LOW 2.4% (4/170), follow-up 0% (0/451) - sporadic single frames, artifact class, no sustained degradation = PASS with note.
- Adaptive ladder: downgrade at 2 confirmed windows (design: 4 s of <45 fps), hysteresis honored, user lock honored, reset clean = PASS.
- DPR: cap 2 code-verified + runtime 1.25 -> 1.25 = PASS (engaged-cap case = hardware checklist); '1.5 under load' = N/A (flag 2, does not exist).
- rm + fx-low combo: NaN 0, frames stable, kill punch 0 under rm (2 kills) = PASS.

### Bottleneck
None sustained on this machine. The 60 Hz vsync quantum is the floor; real GPU/CPU cost (I184: 1.6-3.5 ms CPU-side, 49-53 draw calls, ~2k tris) leaves large headroom at 120 Hz and adequate at 60 Hz. The bloom composer is the single largest discretionary cost (12-14 draw calls, half-res per I217) and is already auto-disabled by the adaptive ladder. Sporadic 33-50 ms single frames = GC/compositor/evaluate-boundary artifacts (I182/I184 taxonomy), not a scene bottleneck.

### Optimization
No action required (evidence-only). If a HARDWARE device shows sustained >17 ms: (1) the adaptive ladder already drops bloom + particle count 48 -> 16; (2) DPR 1.5 under load (flag 2) is the largest untapped lever on dpr 2-3 phones; (3) the 512x256 skybox option documented at I214 for GPU texture memory; (4) the FX 'off' tier (flag 1) would extend the ladder's floor.

### Blocking issues
None for E11 closeout. The physical-device remainder is HARDWARE-pending below (non-blocking, labeled per the story).

### Scope-vs-code flags (3)
1. FX 'off' tier does not exist: settings expose only 'high'/'low' (particleHigh 48 / particleLow 16; F toggles high<->low). The story's 'off' row is N/A; a true off tier (0 particles + no bloom) would be a small E12 story candidate.
2. Load-reactive DPR 1.5 does not exist: the single renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) at boot (main.js L62); the adaptive ladder only touches fxCount + bloom. Row = cap-2 verified / load-reactive N/A.
3. Auto-downgrade does not persist to the stored settings tier: the onTier callback sets fxCount + bloom + toast + console only; liveSettings().fx stays 'high' during an auto-low period, so the settings panel shows HIGH while rendering low, and pressing F then toggles stored high -> low (the already-effective tier) and locks low. Minor UX divergence, no measured perf defect; the F path itself is correct (applySettings runs before adaptive.userSet, so user changes restore bloom/fxCount).

### HARDWARE-pending checklist (physical-device remainder, labeled)
- [ ] Real low-spec phone (2019-2021 mid-range, integrated GPU): frame p95 at FX high/low in the dense scene; verify the adaptive downgrade fires naturally on real <45 fps and stabilizes.
- [ ] dpr 2-3 device: verify the cap-2 path at runtime (renderer ratio 2, not 3), texture memory, and whether DPR 1.5 under load (flag 2) is worth a story.
- [ ] Sustained 10-minute dense play: thermal throttle and battery behavior under continuous worst case.
- [ ] Real 60 Hz cap compliance on a low-refresh display plus touch/coarse-pointer input under low-end conditions.
- [ ] 60 fps compliance on the reference scenes is currently inferred from frame cost vs vsync (this session 60 Hz; I184 ~120 Hz) - a slow device is the only place compliance can actually fail.

### Changed files or proposed files
- production/perf-profile.md (this section). No source changes.

### Verification evidence
- Live Chromium via Playwright (dev server http://localhost:5173, ?nocache=225a/225b/225c fresh loads; 1046x714 logical, dpr 1.25, 60 Hz display): per-tier staging per the Method above; 3.5 s real-rAF soaks (bodies 163-170 frames) + an 8 s follow-up (451 frames, wave 4, 19 live eb peak, 0 drops); MENU idle 1.6 s per tier.
- Adaptive ladder (synchronous synthetic noteFrame feed in PLAYING, no real-rAF interleave): 90 x 0.05 s (20 fps, 2 windows) -> tier low / autoLow / belowStreak 2 + bloom off + toast 'FX AUTO-SET TO LOW (LOW FPS)' + console line exact '[voidrunner] adaptive quality: FX high -> low (rolling 2s avg 20 fps < 45)'; 720 x (1/120) s (6 s) -> stays low (hysteresis); userSet('high') -> high + userLocked; 90 x 0.05 s under lock -> stays high (belowStreak 2 recorded, blocked); reset() -> high/unlocked/streak 0.
- rm + fx-low combo: applySettings({reducedMotion: true, fx: 'low'}) + proven 600-tick pilot (CPU 48 ms, PLAYING, sim t 77.22 s) + NaN sweep 0 (rocks/ship/score/boss) + 2 kills under rm with juiceTally kill channel unchanged (punch 1 -> 1, pre-combo baseline from the LOW-tier soak) and punch.magnitude() 0 (I224 gate) + 2 s real-frame soak 16.66/17.0/17.1 ms.
- DPR: window.devicePixelRatio 1.25 -> renderer.getPixelRatio() 1.25 (cap min(dpr,2) at main.js L62, not engaged below 2; code-verified).
- Console: 1 message total across the session (the adaptive info line), 0 errors / 0 warnings.
- 689/689 (unchanged - no source changes); build 0; dist 1958.4 KB raw / 507.8 KB gzip unchanged.

### Next owner or decision
- Next: I226 = ST-223 (E11 regression round + G11.0 gate + closeout; cgs-regression-suite + cgs-gate-check + cgs-milestone-review).
- Decision: the 3 flags are E12 story candidates (FX-off tier; load-reactive DPR 1.5; settings-tier sync on auto-downgrade). HARDWARE-pending checklist owner: human/QA when a physical device is available; does not block E11 close.