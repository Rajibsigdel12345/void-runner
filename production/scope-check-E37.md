# Scope Check E37 - Reach & Final Polish Arc (PWA + E31 HUD Minors)

- Iteration: I346 (arc open)
- Skills: cgs-scope-check + cgs-create-stories (docs-only)
- Inputs: AGENTS.md, production/session-state/active.md, production/scope-check-E36.md (pattern + G36.0 closeout), production/scope-check-E31.md (R3 noted-only minors source), production/epics.md E36 task list (next-arc candidates), src/render/hud.js (BEST/WPN chip layout), src/render/screens.js (menu footer), index.html + scripts/build.mjs (public/ copy + dist assembly), assets/ship.glb (PWA icon source), Blender 5.2.3 + skills blender-core / blender-modeling / blender-export / blender-asset-qa, .evidence/I345 pins (dist 124/1915299 B, vendor sha 76DEA8151BC9352A, headroom 181853 B)

## Summary

E36 (Rock/Asteroid Art Pass) closed at I345 with 4/4, G36.0 PASS R1..R5, 906/906, dist 124/1915299 B, vendor sha 76DEA8151BC9352A unchanged. E37 = the next slice of the user standing directive (keep improving the game; 100-iteration arc; use Blender for assets; ground on research, do NOT over-engineer). It picks up the two E31 NOTED-ONLY HUD minors (measured, non-blocking, carried as candidates since I319) and adds the single highest-leverage un-shipped platform capability: PWA (installable + offline) with a Blender-rendered PWA icon from the ship hero. Deliberately NOT crammed in: touch-fallback (kept as its own top-platform arc, E38) and i18n/PWA-adjacent scope beyond install/offline (plan-only stays plan-only).

## Grounding (research -> decision)

- YouTube sweep (I346; 4 queries / 48 raw; fresh - none reused): GMTK 'Secrets of Game Feel and Juice' (216_5nu4aVQ) + 'What Makes a Good Combat System' (8X4fx-YncqA 13:53 'Making an Impact': blurring on impact, big sparks, enemy flash/hurt, crunchy SFX) + '5 Hidden Tricks That Make Games Feel Amazing' (kDdoW2biq4A: jump buffering, screen shake, hit stop, delta time). Cross-check vs current build: screen shake, sparks/bursts, score popups, bullet trails, engine flame, rim light, SFX, combo, post-fx grade/bloom are ALL already present (E4/E11/E15/E32/E33). The game-feel surface is saturated - a new 'juice' pass would be rework, NOT improvement (violates the anti-over-engineer directive). Conclusion: feel is not the lever.
- Star Fox / on-rail (SBKbRlPix2U, tesYsJzew6I, 2EoDT4a5O78): cinematic on-rail genre - structurally different from our 3D arena; no portable mechanic without a genre change (out of scope).
- Measured HUD evidence (E31 R3, production/scope-check-E31.md line 6/13): (1) 'menu footer 7px cross' + (2) 'BEST/WPN 320 px^2' overlap = the two carried noted-only minors. Verified still present in src: hud.js scoreBox BEST at top:14px/left:18px (13px text) vs wpnBox at top:58px/left:18px - the score box has no min-height, so at the default --vr-fs the BEST line bottom can collide with the WPN label top (the measured 320 px^2); screens.js menu footer/credit line renders a 7px cross separator below the legibility floor.
- PWA (standard web platform capability, no invention): the game is a self-contained static dist (import-map, no server) - the ideal PWA candidate. Installable + offline = real reach for the 'playable on a phone/tablet' top-platform deferral without building the full touch-arc now. Grounded in web best practice (manifest + service worker + icon), not invented.

## Scope Fit

FIT. Three small, independent, gated slices: (ST-318) two render/DOM BY LAYER HUD micro-fixes, 0 KB, A/B measured; (ST-319) PWA (manifest + service worker + prod-gated registration + Blender icon), ~<=60 KB added, offline + install verified; (ST-320) E37 regression + G37.0 gate + closeout. No sim/scoring/replay change; no scene object add/remove; zero src/core (R3 holds). Every slice is within the 2 MB dist budget with the 100 KB headroom floor held.

## Cut Option

ST-318 (HUD minors) is the designated CUTTABLE slice (BY LAYER, 0 KB, lowest value) - if ST-319 PWA hits a hard budget or SW-scope wall, ST-318 ships alone and ST-319 defers to E38. ST-319 is the arc's headline and is NOT cuttable without dropping the whole arc to the E38 touch-arc.

## Deferral

- Touch-fallback arc (top platform) -> E38 (grounding already captured from E23: GDevelop ypu-huHz2P0, griffpatch 9TK8x2nSMPI / cI1mdVVvCWY). PWA is its natural precursor (install/offline first, then touch controls).
- i18n (plan-only) stays plan-only (design/i18n-strings.md exists); implementation deferred - not this arc.
- Variant-boss deep-dive (R-E32-4) and any new art-family pass: deferred (all art families shipped E34/E35/E36; no measured gap).

## Stories

- ST-318 (I347) E31 HUD minors: fix (a) menu footer 7px cross -> raise the footer/credit cross/separator to a legible size or remove the sub-floor glyph (render/DOM BY LAYER); (b) BEST x WPN 320 px^2 overlap -> give scoreBox a min-height / push wpnBox down so intersection area = 0 with a >= 20 px gap (matches the E31 I320/I322 fix bar). 0 KB. A/B measured (px^2 before -> 0 after; gap px). cgs-dev-story.
- ST-319 (I348) PWA: add public/manifest.webmanifest (name/short_name/theme/background/display standalone + icon), public/sw.js (versioned cache-first for static app shell + assets, network-fallback navigation, old-cache cleanup on activate), public/icon-512.png (Blender-rendered ship hero, <= ~45 KB compressed), index.html (manifest link + theme-color + apple-touch-icon + a <meta name=vr-build content=dev> stamp), scripts/build.mjs (dist root copy of sw.js + prod stamp dev->prod in dist/index.html), src/main.js (register SW ONLY when the prod stamp is set, so dev/probe are unaffected). Verify: dist serves manifest, SW registers at root scope, offline reload works, installable. cgs-dev-story + blender-export/asset-qa for the icon.
- ST-320 (I349) E37 regression + G37.0 gate + closeout: full probe battery (demo pin EXACT causal, FLOOR-50, MENU 60fps, NaN 0, console 0/0) + new PWA probe (manifest reachable + SW registered + offline navigation) + HUD A/B re-measure + G37.0 R1..R5 + R-E37-1..5 closeout. cgs-regression-suite + cgs-gate-check + cgs-milestone-review.

## Budget

- dist at open: 124 files / 1915299 B; headroom 2097152 - 1915299 = 181853 B (>= 102400 B floor). Max addable while holding the floor = 1994752 - 1915299 = 79453 B (~77.6 KB).
- ST-318: 0 KB. ST-319: manifest ~1.2 KB + sw.js ~3.5 KB (dist root copy; public copy also present = ~7 KB) + icon-512.png <= ~45 KB + index.html ~0.35 KB + main.js ~0.4 KB ~= 54 KB worst case. New dist ~= 1970 KB (<= 1994752 B); new headroom ~= ~124 KB (>= 100 KB floor, ~20 KB margin). Vendor sha 76DEA8151BC9352A UNCHANGED (no three bump).

## Risks

- R-E37-1 (SW scope on static host): a service worker must sit at the scope root to cache index.html/src/vendor/assets. Mitigation: build copies public/sw.js -> dist/sw.js (root scope) and registers './sw.js'; if root-scope registration is rejected by the static server, fall back to scope './public/' is NOT acceptable (cannot cache the shell) -> the CUT path (ST-318 alone) engages. Acceptance: SW active + controller set on the root page.
- R-E37-2 (dev/probe staleness): SW caching could serve stale modules to the dev server + headless probes. Mitigation: prod-gated registration (meta vr-build=prod, stamped only by the build) -> dev/probe never register the SW. Acceptance: probe env has no active SW; dist env does.
- R-E37-3 (icon bloat vs 100 KB floor): the 512 PNG could blow the headroom floor. Mitigation: target <= 45 KB (Blender 512 render + PNG compression); re-measure dist after the swap; if headroom < 100 KB, drop icon to 384 or compress harder. Acceptance: dist headroom >= 102400 B after ST-319.
- R-E37-4 (BEST/WPN fix regresses layout): pushing WPN down or min-heighting scoreBox could collide with the wave box or change the p1 demo pin. Mitigation: BY LAYER, 0 sim change, A/B measured; p1 demo pin must stay EXACT after the change (causal proof the fix is presentational-only).
- R-E37-5 (manifest/icon correctness for install): wrong display/sizes/icon path fails the installability audit. Mitigation: run a headless installability check (manifest reachable, parseable, display standalone, >=1 icon 192 or 512, theme-color) before close; keep icon 512 + purpose 'any maskable'.

## Gate G37.0

- R1 (fit): 3 slices, each owner-sized, independent, gated; no scope creep beyond PWA + 2 HUD minors.
- R2 (assets): icon-512.png from ship.glb via Blender, <= 45 KB, 512x512, closed/clean render; manifest icon entry valid.
- R3 (ZERO src/core): git diff of the arc shows no src/core changes (PWA reg lives in src/main.js = render/boot layer, allowed; HUD fixes in src/render/).
- R4 (regression): full probe battery + new PWA probe; demo pin EXACT; NaN 0; console 0/0; vendor sha 76DEA8151BC9352A unchanged.
- R5 (quality bar): npm test green (906/906 baseline + any new PWA manifest-parse test) + npm run build exit 0 + dist headroom >= 102400 B.

## Recommendation

APPROVED. Open E37 at I346 (this doc + stories, docs-only 0 KB). Execute ST-318 (I347), ST-319 (I348, + Blender icon), ST-320 (I349 closeout). Keep the 2 MB budget + 100 KB floor + vendor sha stable. Next after E37 = E38 touch-fallback arc (top platform).

## Changed files (open, docs-only)

- production/scope-check-E37.md (this file, new). production/epics.md (E37 block, new). production/stories.md (ST-318..320, new). production/iterations.md (I346 open entry). CHANGELOG.md (Unreleased line). production/session-state/active.md (I345 -> I346 arc open). (.evidence/I346/ gitignored.) 0 KB dist delta.

## Verification evidence

- dist 124/1915299 B + vendor sha 76DEA8151BC9352A + headroom 181853 B re-confirmed from .evidence/I345 at open (DOCS-ONLY). No code touched at open.

## Next owner / decision

producer: proceed to ST-318 at I347 (cgs-dev-story). Decision: ST-318 is the cuttable slice; ST-319 PWA is the headline.
## ST-318 result (I347)

- A/B (headless, one tab, fx-off, best seeded {version:1,value:9876}): BEFORE (a) credit {0,689,1280x15} x hint {36.31,681,339.98x15} = 2379.9 px^2 (339.98 x 7 - reproduces I319's noted "2380 px^2, 7px vertical cross" EXACT); (b) scoreBox {18,14,59.34x51} bottom 65 x wpnBox {18,58,40x28} = 280 px^2 (40 x 7 - the I319 note "320 px^2" measured exactly 280). AFTER (a) 0 px^2 + vgap 23 px; (b) 0 px^2 + gap 23 px. Both pairs clear the I320/I322 fix bar (0 px^2 intersection + >= 20 px gap). No new collisions: panel x topWrap 0, panel x centerWrap 0, panel x menu-grid 12027.8 UNCHANGED (pre-existing; I319 audited; out of scope).
- Changes: screens.js menu settings panel bottom 24px -> 54px; hud.js wpnBox top 58px -> 88px. One line each, raw px, ST-318 comments. BY LAYER, 0 KB, 0 sim.
- Causal proof: p1 demo pin EXACT (score 11334 / kills 57 / wave 2 / maxCombo 15 / shots 198/57 / acc 0.2878787878787879 / 36.14999999999923 s / replay 2169-2220 speed 4 / Q -> MENU / console 0/0) - .evidence/I347/p1_after.json.
- R-E37-4 CLOSED. Quality bar held: 906/906; build 0; dist 124/1915299 B (0 B delta); vendor sha 76DEA8151BC9352A unchanged; bar measured at default --vr-fs=1 (FONT_SCALES 1/1.25/1.5 scale-inflation crowding = pre-existing pattern, documented not fixed - anti-over-engineer).
- Next: ST-319 PWA at I348.
## ST-319 result (I348)

- PWA (cgs-dev-story + blender-core/export/asset-qa; REACH, ~<=60 KB budget, actual +9317 B dist). Installable + offline. The natural precursor to the deferred top-platform touch-arc E38.
- Files: public/manifest.webmanifest (452 B: name/short_name Void Runner, display standalone, orientation landscape, theme+background #04060f, start_url+scope ".", icon icon-512.png 512x512 png any maskable), public/sw.js (1755 B, root scope in dist: versioned cache vr-shell-v1, precache ./ + ./index.html, install addAll + skipWaiting, activate purge stale vr-shell-* + clients.claim, fetch same-origin GET only: navigate = network-first -> caches.match -> ./index.html offline fallback; other GET = cache-first + runtime cache.put warm), public/icon-512.png (4871 B, Blender 5.2 ship.glb hero render), index.html (theme-color #04060f + vr-build=dev meta + manifest link + apple-touch-icon), scripts/build.mjs (copy public/sw.js -> dist/sw.js + stamp dev->prod in dist/index.html only), src/main.js (register ./sw.js on window load ONLY when vr-build=prod AND serviceWorker in navigator; .catch no-op CUT path), tests/pwa.test.js (8 DOM-free tests).
- Verification (headless PWA probe .evidence/I348/pwa_probe.mjs + serve.mjs over dist on :5199; playwright-core chromium, one tab, fresh profile, viewport 1280x720, 11/11): (R-E37-1) SW active at root scope http://127.0.0.1:5199/ + controller set on the reloaded (claimed) client + online reload boots __vr; (R-E37-5) manifest GET 200 content-type application/manifest+json, display standalone, icon 512 png any maskable, start_url+scope "."; offline (context.setOffline + reload): page boots __vr from cache, no NaN in world/camera, console 0/0. Icon pipeline: .evidence/I348/make_icon.py (Blender 5.2 EEVEE 512^2, --eye -1.9,-1.0,1.9, world #04060f, key 750W cool + rim 4200W amber 0xd8a878 + fill 350W blue, cockpit emission 1.5, raw 236724 B) + compress.py (PIL corner bg-snap tol 10 + quantize 256 FASTOCTREE no-dither -> 4871 B, maskable-safe, no banding, visually verified).
- R-E37-1/2/3/5 CLOSED (R-E37-4 already closed at I347). R3 ZERO src/core (git diff 5a7c303 -- src/core empty; main.js is the boot/render layer, not core).
- Quality bar held: 914/914 (906 + 8 pwa.test.js); build 0; dist 128/1924616 B (+9317 B: icon 4871 + manifest 452 + sw 1755 x 2 + index/main minified ~484); headroom 172536 B >= 102400 B floor; vendor sha 76DEA8151BC9352A unchanged.
- Next: ST-320 closeout at I349 (E37 regression battery + PWA probe re-run + HUD A/B re-measure + G37.0 R1..R5 + R-E37-1..5 all closed -> E37 CLOSED 3/3).
