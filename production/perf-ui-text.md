# Performance Profile - UI Text Layer (ST-167 / I167, cgs-perf-profile)

Scope: the DOM/HUD text layer of Void Runner (three.js, no bundler), measured against the live dev build at http://localhost:5173 in Chromium (Playwright, 1280x720). This is the complementary profile to the WebGL layer profiled in I95 (production/perf-profile.md): I95 covers the GPU/CPU render path (steady CPU frame 5-7ms mean, p95 11-14ms, 22-59 draw calls); this doc covers what the DOM commits per frame on top of it (mutation volume on #hud, #wave-banner, #kill-feed, #score-popups and the intermission countdown).

## Method

Live Chromium (Playwright), dev build, cache-busted tabs (?nocache=167/167b/167c).

- MutationObserver on document.body with {subtree:true, childList:true, attributes:true, characterData:true}; childList mutations counted as added+removed nodes, all other mutation records counted as 1 each.
- Deterministic 60Hz drive: the tab's rAF was environmentally throttled to ~1Hz (1015.8ms median, persisting after bringToFront - hidden-tab throttle), so the main loop was frozen by stubbing window.requestAnimationFrame = () => 0, the real tick entrypoint was called directly N times at exactly dt = 1/60 (window.__vr.advance(1/60, {thrust:{x:0,y:0}, aimPoint:null, firing:false})), and a microtask yield (await Promise.resolve()) flushed MutationObserver deliveries per tick before the next tick. rAF was restored afterwards. This decouples measurement from tab-throttle noise and makes every scenario fully reproducible at 60Hz.
- Kills were triggered through the real pipeline: w.field.spawn('M', 0.02, {x, y}, true) for rocks plus w.weapons._spawn({x:r.pos.x, y:r.pos.y}, 0) for player bullets.
- Banner API used: __vr.banner.showWave(n, mod, endless), showCleared(n), showBoss(n, maxHp, name, kind), plus el for DOM access.
- Static audit: zero forced-reflow reads in all of src/render/*.js (grep for offsetWidth/offsetHeight/getBoundingClientRect/offsetTop/offsetLeft/scrollWidth/clientWidth - 0 hits). CSS posture: #wave-banner and #hud are position:fixed with will-change:auto (no layer promotion - correct, since they animate in 1.2-2.2s bursts, not continuously), user-select:none; body carries 30 children.

## Metric

Committed DOM mutations per scenario, deterministic 60Hz drive. "hold" = the flat phase of the animation where opacity/transform are at their settled value; steady = the phase after all transient writes stop.

| Scenario (60Hz) | BEFORE | AFTER |
|---|---|---|
| WAVE banner, 1.8s anim (132 ticks) | 402 total, max 6/tick, hold = 3/tick (first8 [4,5,5,5,5,5,5,5]; ticks 30-60 all 3; endReset [4,4,4,6,0..]) | 84 total, max 6/tick, first8 [6,2,2,2,2,2,2,2], hold = 0/tick, endReset 0 |
| BOSS banner, 2.2s anim | 479 total, max 9/tick (first6 [7,5,5,5,5,5,5,5]) | 204 total. Definitive 60-tick log: tick0 = text + sub childList + 3 style writes; ticks 1-14 = 2/tick (opacity fade-in + transform punch, by design); tick15 = 1; ticks 23-59 = 0. The ONLY mutation target across the whole animation is #wave-banner style. |
| CLEARED, 1.2s (84 ticks) | 294 total, max 8/tick, first [6,5,5,5,5,5] | covered by the same guard (shared sync() path) |
| Kill feed, 1 row, 200 ticks | kill at tick 13; steady ~0.5/tick (HUD heat bar, quantized 1/40 steps); fade = exactly 1/tick x 27 ticks (0.45s row opacity); tail 0 | unchanged (no fix needed - see Optimization) |
| Kill burst, 6 rocks, 300 ticks | tick0 = 54 (5 rows + text + HUD + score popups); ticks 1-~15 ~19/tick (transient popups transform/opacity + combo pop + heat quantization); fade window 5-6/tick (5 row opacities + heat); tail 0-1; 799 total across 110 nonzero ticks | unchanged |
| Natural no-kill, 300 ticks | 358 total, max 6/tick (intermission countdown at 3 mutations/0.1s, banner anim, tutorial-hint fade 1/tick during its 2s fade); steady-target probe at tick 29 = 0 mutations | - |
| MENU idle, 3s (real loop) | 0 mutations | - |

killFeed constants for reference: MAX = 5 rows, LIFE = 3.0s, FADE = 0.45s.

One residual measurement note: an earlier pre-fix run showed a mislabeled attributes@DIV. target at ~1.4/tick. The definitive full-log run (clean state, same technique) proved no attribute target other than #wave-banner exists during the boss animation; the anomaly was a label-expression artifact/stale state in the probe, not a real source. The definitive log is the evidence of record.

## Budget

Target: 60fps = 16.67ms/frame. The UI text layer is DOM commit work, so the budget is expressed in committed mutations/tick and layout-triggering reads:

- Steady-state UI text: budget <= 6 committed mutations/tick on any normal 20-60 node HUD tree. **PASS** - steady is 0 (banner hold, menu idle, kill-feed tail); the only recurring steady writer is the HUD heat bar at ~0.5/tick (quantized 1/40 steps) and the intermission countdown at 3 mutations per 0.1s (by design, time changes 10x/s).
- Burst spikes: one-off spikes are bounded. The worst observed single tick is 54 mutations on a kill burst of 6 rocks (~10 small nodes: 5 feed rows + popups + score + HUD). At ~1-3us per committed mutation this is well under 0.5ms of main-thread work - **PASS**, no layout pass involved.
- Forced reflow: budget 0 layout-triggering reads in the render layer per frame. **PASS** - static audit found zero (no offset*/getBoundingClientRect/scrollWidth/clientWidth reads anywhere in src/render/).
- Animation channel hygiene: all animated UI properties are opacity and transform (compositor-friendly); no width/height/top/left/margin animations. **PASS**.
- Node promotion: will-change:auto everywhere (no permanent layer promotion of the burst-animated banners) - correct choice for 1.2-2.2s bursts. **PASS**.

## Bottleneck

None in the UI text layer after the fix. The one real waste found and eliminated:

- waveBanner.js sync() wrote el.firstChild.nodeValue = big and sub.textContent = s on EVERY frame for the full animation duration (1.8-2.2s), even when the value was unchanged. Same-value writes still committed 3 DOM mutations per frame (characterData on the big line + 2 characterData/style records via the sub element path) during the hold phase. This was the only recurring non-essential writer in the entire HUD tree.

The WebGL-side costs (first-gameplay-frame init hitch ~90-600ms, steady CPU frame 5-7ms) are documented in production/perf-profile.md (I95) and are unaffected by this change.

## Optimization

Shipped (src/render/waveBanner.js):

- lastBig / lastSub caches around the two per-frame text writes in the animation branch of sync(); text is now written only on value change, matching the existing set() cache pattern already used by the HUD. The end-reset branch resets both caches to ''.
- Measured effect: banner committed mutations per animation - wave 402 -> 84 (-79%), boss 479 -> 204 (-57%); hold-phase writes 3/tick -> 0/tick (verified with attributeOldValue probes and the definitive 60-tick full mutation log: post-fix the only mutation target across a full boss animation is #wave-banner style, all inside the first 24 ticks = one-time text writes + opacity/transform entry punch).

Deliberately NOT changed (measured no-ops, kept for the record):

- Kill feed row opacity writes during the 2.55s hold: same-value style writes short-circuit in the browser (observer measured 0 committed mutations), so a cache would add code for zero committed work.
- HUD (hud.js): already fully change-guarded with the set() cache pattern and quantized bar steps; measured 0 steady mutations apart from the designed heat-bar quantization.
- style.display / classList toggles: same-value toggles are no-ops; no churn observed.

## Blocking issues

None.

## Changed files or proposed files

- src/render/waveBanner.js (shipped: lastBig/lastSub write-on-change guard + reset)
- production/perf-ui-text.md (this doc)

Proposed, not required (tracked for the future): score popups are the largest transient UI cost (the 54-mutation kill-burst tick is dominated by them); bounded, short-lived, and compositor-only, so leave as-is. The I166 i18n seam (design/i18n-strings.md) is compatible with this fix - the caches key on the string value, not the locale, so a locale swap changes the value and the text rewrites exactly once.

## Verification evidence

- npm test: 491/491 pass (unchanged - the fix is render-layer, no core diff; quality-bar rerun).
- node scripts/build.mjs: exit 0.
- Before/after tables above (deterministic 60Hz drive, same technique both sides; pre-fix file measured via temporary stash of the working-tree fix).
- Browser smoke post-fix (?nocache=167c): intermission countdown renders ("NEXT WAVE IN 1.3" -> "0.1"), WAVE 1 banner renders correctly (screenshot .evidence/I167/I167_1_wave_banner_smoke.png - WAVE 1 + HUD + rocks + ship visible), console 0 errors / 0 warnings, NaN scan over ship.pos / scoreKeeper / rock positions = 0 non-finite.