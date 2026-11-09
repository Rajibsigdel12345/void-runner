# Release Checklist - Void Runner (v1 slice build)

- Date: 2026-11-13
- Skill: cgs-release-checklist
- Target: dist/ built from main at I49

## Summary
First full release-checklist run on the vertical slice. Found and fixed one real packaging defect (dist shipped the entire ~21MB vendored three.js package when the app imports only the core module + 4 postprocessing passes). After the fix the build is a 1.4MB static site that boots, plays, and renders (incl. bloom) with a clean console from the preview server.

## Build Evidence
- npm run build exit 0 -> dist/ assembles as a static import-map bundle (no bundler by design).
- I49 build fix (scripts/build.mjs): vendor copy is now a whitelist - three.module.js + the postprocessing closure actually imported (EffectComposer, RenderPass, OutputPass, UnrealBloomPass, Pass, ShaderPass, MaskPass + CopyShader, OutputShader, LuminosityHighPassShader). Closure verified by reading each imported file's import statements against the import map in index.html.
- dist size: 22,895,455 B -> 1,405,436 B (~16x smaller). Inventory: vendor/three.module.js 1.27MB + app source ~135KB + addon closure ~95KB.
- npm test: 122/122 (re-run this iteration; the build change touches no core logic).
- Preview server (npm run preview -> http://localhost:4173, serves dist/ ONLY - no dev files):
  - Menu renders (title, controls table, PRESS ENTER TO START); DOMContentLoaded 507ms, full load 519ms (cold headless, local static server).
  - Enter -> PLAYING; wave 1 spawned (5 rocks); ship positions finite (no NaN) across 2s of live play.
  - Bloom composer path active (bloom.enabled true -> EffectComposer + UnrealBloomPass resolve from the trimmed vendor).
  - Console: 0 errors, 0 warnings on the page load.
  - Screenshot: .evidence/i49-preview-playing.png (arena, starfield, rocks, HUD, reticle all present).

## QA / Accessibility / Localization
- QA: regression suites A+B+C green (I46); slice gate PASS (I45); qa-plan.md known gaps (physical touch, physical GPU perf) carried as risks, not blockers.
- Accessibility: reduced-motion + FX-quality settings; HUD power-up chips use shape + color + label (never color alone, per GDD); full keyboard play (arrows + space).
- Localization: English-only by arcade scope; no i18n layer in M1 (E7B UI text pass is where this would land if it ever becomes a requirement).

## Rollback
Static site with no server, DB, or store pipeline: rollback = redeploy the previous dist/ (each build is a self-contained snapshot). localStorage schema is version-guarded in core/storage.js; unknown/corrupt keys fall back to defaults, so an old dist never breaks a newer save.

## Blocking Issues
None.

## Warnings (non-blocking)
- W1: perf baselines are dev-machine only; low-end mitigation = adaptive quality (E7C, ST-073+).
- W2: touch verified via synthetic PointerEvents only (qa-plan known gap).
- W3: no cache headers / service worker - fine for a static slice; revisit at a real deploy.
- W4: dist ships unminified source (~135KB) - no minify step (no-bundler by design); revisit at a real deploy.

## Ship Verdict
**SHIP** - build green, tests 122/122, regression clean (I46), docs complete (I47), dist trimmed 16x, console-clean cold preview load with bloom verified. W1-W4 carried as E7 work, not release blockers.

## Changed files or proposed files
- scripts/build.mjs (vendor whitelist)
- production/release-checklist.md (NEW: this artifact)

## Verification evidence
As listed under Build Evidence; iteration log + CHANGELOG updated at I49; 122/122 + build 0 this iteration.

## Next owner or decision
ST-050 (I50): final polish sweep + E6 closing commit; E7A content begins I51 (ST-051).

---

# Release Checklist - Void Runner (v2 / E7 build)

- Date: 2026-11-10
- Skill: cgs-release-checklist
- Target: dist/ built from main at I98 (E7: I49-I100)

## Summary
Second release-checklist run, now against the full E7 feature set (content, presentation, UI-UX, audio, robustness, balance, QA) rather than just the slice. The production dist/ boots, plays, and renders (incl. bloom + the wave-5 Monolith boss + power-ups + vortex) from a clean console. No new packaging defect this round (the v1 16x trim still holds at 1.44MB). Ship verdict is SHIP-READY for the code side; the only outstanding E7-gate items (the 100th iteration + a final closing regression re-run) complete at I100 by design, plus the user-requested Blender graphics pass and a human playtest are tracked, non-blocking follow-ups.

## Build Evidence
- npm run build exit 0 -> dist/ assembles as a self-contained static import-map bundle (no bundler by design).
- dist size 1.44MB total: index.html (~1.3KB) + src/ (~135KB) + public/ + vendor/three.module.js (1243.1KB, vendored, NO CDN) + vendor/jsm/ (postprocessing closure).
- Import map in dist/index.html uses relative paths ("three": "./vendor/three.module.js", "three/addons/": "./vendor/jsm/") - correct for any static host.
- Preview server (node scripts/serve.mjs 4173 dist) serves dist/ ONLY.
- dist boots clean: window.__vr ready, state=MENU, 22 draw calls / 266 tris.
- Console on the built artifact: 0 errors, 0 warnings (this iteration's browser check on :4173).
- Controlled fixed-step gameplay smoke on the dist (single synchronous evaluate so the rAF loop cannot double-step):
  - State machine: begin -> PLAYING, pause -> PAUSED, resume -> PLAYING (all reachable).
  - Wave-5 Monolith boss spawn (alive, HP bar shown), rapid/spread/shield power-ups applied.
  - 10-rock + vortex scene: all ship/boss/score/combo positions finite (no NaN); ship.aim finite (scalar).
  - Full frame render (incl. bloom post): 32 calls / 2346 tris / 16 programs.
  - Screenshot: .evidence/i98-dist-boss.png (WAVE 5 banner, MONOLITH HP bar, spiky Monolith, ship with engine glow, arena grid, starfield, HUD score/best/lives).

## QA / Accessibility / Localization
- QA: node 233/233 green; regression round C clean (I89), closing re-run scheduled I99/I100; playtested twice (I41 v1 + I90 v2); bug triage 0 code defects (I91); balance pass 4 (I92: post-boss breather, combo cap 15, invuln 1.8s).
- Accessibility (I70/I93): reduced motion, font scale, FX quality, aria-labels, power-up letter+color+label (never color alone), unified focus ring, tab/arrows/space settings nav; in-world colorblind audit deferred to the Blender/graphics pass.
- Localization: UI text pass done (I72, wording/typos/caps); all UI text English; no i18n layer (out of scope for this arcade build - future work, not a blocker).

## Rollback
- Git history (revert any commit) + static hosting rollback = re-deploy a prior dist/ (each build is a self-contained snapshot).
- localStorage schema version-guarded in core/storage.js; unknown/corrupt keys fall back to defaults, so an old dist never breaks a newer save.

## Blocking Issues
None on the code side. The two outstanding E7-gate items (the 100th iteration + a final closing regression re-run) complete at I100 by design; the user-requested Blender graphics pass is a scheduled post-I100 step; a human playtest is the outstanding perception evidence (not bot-verifiable). None block the code release.

## Warnings (non-blocking)
- W1: the 100th iteration + final closing regression re-run complete at I100 (E7 gate criterion in progress).
- W2: the Blender graphics pass (cgs-art-bible -> asset-spec -> asset-audit) is scheduled after I100.
- W3: a human playtest is the outstanding perception evidence (bot self-play v1+v2 done; human judgment not bot-verifiable).
- W4: deferred perf first-frame warm-up (I95 WARN, one-time ~90-600ms lazy WebGL init); offscreen warm-up render proposed for a follow-up.
- W5: no i18n layer (arcade scope, English-only).

## Ship Verdict
**SHIP-READY (code side) / CONDITIONAL-SHIP** - build green (233/233 + build 0), dist 1.44MB self-contained, console-clean production load, no NaN in boss/power-up/vortex scenes, state machine verified. The remaining E7-gate items complete at I100; the Blender pass + human playtest are tracked, non-blocking.

## Verification evidence
- node --test 233/233 green; node scripts/build.mjs exit 0 (fresh).
- dist preview (:4173) boots clean (window.__vr ready, MENU, 22 calls); 0 console errors + 0 warnings.
- Controlled dist gameplay smoke: state machine, Monolith spawn, power-ups, 10-rock + vortex scene all finite (no NaN); full bloom frame 32 calls / 2346 tris / 16 programs.
- Screenshot viewed: .evidence/i98-dist-boss.png.
- Iteration sequence PASS 1..98; CHANGELOG + iteration log updated this iteration.

## Next owner / decision
- I99 (ST-099): cgs-regression-suite - closing extended regression re-run on this build.
- I100 (ST-100): cgs-qa-plan closeout + final wrap + the 100th iteration.
- Then the Blender graphics pass: cgs-art-bible -> cgs-asset-spec -> cgs-asset-audit (update graphics/geometry/textures using Blender).
