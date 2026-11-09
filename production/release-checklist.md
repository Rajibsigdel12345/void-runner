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
