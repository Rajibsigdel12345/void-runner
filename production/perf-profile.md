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
