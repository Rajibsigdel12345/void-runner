# Scope Check - E49 Localization & Language Selector (cgs-scope-check, I403)

## Summary
E49 = the standing deferred localization pass: extract the ~95 player-facing DOM strings out of the 8 render files into a DOM-free src/core/strings.js (t(key, vars) seam + kc(keycap) hardware-label map), add a 3-way language selector (EN / zh / ja) in the settings panel with localStorage persistence and live re-render without restart, and deliver the zh + ja locale tables. This is the I166/ST-166 plan-only story (design/i18n-strings.md), line-verified at c042dc7, whose recommended path is exactly this shape. Render + core-presentation layer only; zero sim, zero assets, 0 B asset delta (no Blender), +0 draw calls, no frozen-pin re-pins (render-only; p1/rockab/playframe must stay EXACT as the sim-inert proof).

## Surface & Evidence
- design/i18n-strings.md (15.6 KB, plan-only since I166): 8 render files carry player-facing strings (screens.js, hud.js, waveBanner.js, killFeed.js, tutorialOverlay.js, settingsPanel.js, bossHealth.js, src/main.js toasts + context-loss overlay); ~95 distinct strings + ~35 keycap/action labels (keycaps localized via a per-locale hardware map, never translated); no pluralization; 3 named expansion risks (settings.kbd_hint, tutorial.boss_note, the keycap grids) + the 7-item locale-risk list (boss names stay English, % and h/f token separation, CJK font fallback, no RTL).
- I403 inventory re-scan (FRESH, .evidence/I403/scan.cjs): 144 distinct upper-case-led candidates across the 8 files (screens 47 / hud 12 / waveBanner 10 / killFeed 9 / tutorialOverlay 12 / settingsPanel 27 / bossHealth 2 / main.js 25) - pre-filter (includes CSS fragments, JS identifiers, SFX cue names, template fragments). Consistent with the plan's curated ~95 + ~35. LABELLED APPROXIMATE/PRE-FILTER - the plan's line-verified table is the source of truth, not this count.
- Grounding (1 search, 4 queries, 8 raw results - GENERIC HTML5-game localization practice; unverified label for game-specific claims): consistent consensus = strings-in-table with stable keys + named placeholders (never concatenate); locale priority saved-pref -> default (navigator.language detection is explicitly OUT of scope for the first pass per the plan); fallback to en, never raw keys; size containers for the widest locale (de +30-40%, CJK usually shorter); store keys not translated text in saves; live switch via re-render without restart; pseudo-localization test; CJK glyph coverage.
- Conventions fit: src/core is DOM-free + three-free by the AGENTS contract -> strings.js fits cleanly (presentation strings are not tunables; config.js untouched); determinism untouched (no sim reads); node:test covers the new DOM-free module unchanged (929 -> more).

## Scope Fit
- One bounded surface (extraction + selector + 2 locale tables), 5-iteration budget (I403..I407), one pre-registered cut option, zero sim/asset/pixel change, no re-pins (p1/rockab/playframe must stay EXACT = the sim-inert proof).
- Dist headroom 177,499 B >= 102,400 B floor: expected growth ~15-30 KB of locale tables (vs ~95 en keys) - comfortably inside.
- FEEL untouched: textContent swaps only; no timing, pooling, or DOM-structure changes (the selector is an additive settings row - R-E49-4).
- Rejected/checked surfaces: audio polish (open-ended, no acceptance signal) - rejected; de/es/fr/ko locales - deferred (no measured demand); per-key overrides - deferred (separate feature).
- UNVERIFIED ASSUMPTIONS (separate from evidence): (1) the zh + ja locale choice - the user tz is Asia/Katmandu and the plan's font-risk note names CJK; there is no explicit user locale request; (2) the ~95 string count (144 pre-filter scan vs curated ~95 + ~35); (3) the web grounding is generic HTML5 localization practice, not a game-specific source.

## Stories (budget I403..I407, gate G49.0 at I407)
- ST-373 (I403): open E49 - scope-check + stories, DOCS-only. [this iteration]
- ST-374 (I404): string extraction (cgs-dev-story): new DOM-free src/core/strings.js - en table (~95 keys per the plan's key naming), t(key, vars) with named {placeholders} (never concatenation), missing-key -> en fallback (never raw keys), kc(keycap) hardware-label map; rewire the 8 render files in the plan's order (screens, settingsPanel, banner/killfeed/hud, tutorial/toasts/ctxlost); textContent swaps only; en default byte-identical to the current strings (extract = move, not reword); tests/strings.test.js (table completeness, placeholder substitution, missing-key fallback, keycap map, locale round-trip).
- ST-375 (I405): 3-way language selector (cgs-dev-story): EN/zh/ja in settingsPanel + localStorage persistence (key, not text) + apply-on-boot + live re-render of all surfaces without restart (pub-sub re-render); a11y + the settings TAB/ARROWS/SPACE keyboard model preserved (R-E49-4); unit tests; headless smoke.
- ST-376 (I406): zh + ja locale tables + keycap localization maps (cgs-dev-story): per the plan's locale-risk rules (boss names stay English in all locales; % and h/f as separate tokens; rock terms short; em-dash/mid-dot separators inside the templates); CJK expansion handling in the 3 named fixed layouts; headless layout probe (bounding boxes, no overflow) + viewed screenshots (labelled font-limited if SwiftShader lacks CJK - R-E49-2); optional pseudo-locale expansion check; cut-option check.
- ST-377 (I407): regression + G49.0 + close (cgs-regression-suite + cgs-gate-check + cgs-milestone-review): locale sweep en+zh+ja x MENU/PLAYING/GAME_OVER/REPLAY/settings (console 0/0, no NaN, no overflow per the layout probe, en default byte-identical) + R1-R5 standard.

## Pre-registered Cut Option
- ST-374/ST-375 prove extraction + selector with en-only; if zh/ja quality or layout cannot be verified headless (SwiftShader CJK font coverage - R-E49-2), ship the infra + selector (en default, selector present + persisted) and defer the locale content - docs-only close at the cut gate. A clean no-change CUT is an acceptable outcome (anti-over-engineer).

## Deferrals
- de/es/fr/ko locales (no measured demand).
- Per-key overrides (user-level key remapping - a separate feature).
- Audio localization (SFX/music are WebAudio-synthesized; no voice).
- Vibration toggle, 3-finger / gamepad bindings (E38 precedent: "no measured demand").
- Pseudo-localization as a permanent test (optional at ST-376, not a story).

## Verification Plan
- Per iteration: npm test (929/929 at I403; grows from ST-374) + npm run build 0 + dist 131 files / 1,919,653 B (or documented delta) + vendor sha256-16 76DEA8151BC9352A + hygiene (chrome 0, ports free, node 13).
- G49.0 at I407: R1 p1 EXACT causal / R2 rockab EXACT 2.2/1.3/0.7 fresh / R3 playframe probe fresh (21/366 + 50/1222 EXACT under the full locale code = sim-inert proof) / R4 PWA 11/11 fresh / R5 quality bar + hygiene + locale sweep (all locales x MENU/PLAYING/GAME_OVER/REPLAY/settings: console 0/0, no NaN, no overflow, en byte-identical).

## Risks
- R-E49-1 CJK expansion in fixed layouts (settings.kbd_hint, tutorial.boss_note, keycap grids - the plan's named risks): mitigate widest-locale sizing + headless layout probe + viewed screenshots; document any spec deltas (R-E38-1 precedent).
- R-E49-2 headless SwiftShader may lack CJK fonts -> tofu in screenshots: DOM-text assertions are the PRIMARY evidence; label screenshots font-limited if so; the cut option covers unprovable locale content.
- R-E49-3 extraction is render-only but touches all 8 render files: p1/rockab/playframe pins must stay EXACT (sim-inert proof); the en default must be byte-identical to the current strings (extract = move, not reword) - a reword would show in smoke screenshots.
- R-E49-4 the selector is a new DOM surface inside the settings panel: aria-labels + focus order must preserve the existing TAB/ARROWS/SPACE keyboard model.

## Recommendation
PROCEED - the deferred plan is fully pre-designed (line-verified inventory, key naming, expansion risks, CUTTABLE history), bounded to a 5-iteration budget with a pre-registered cut option, zero sim/asset cost, and grounding consensus.

## Changed files or proposed files
- Changed (I403, DOCS-only): production/scope-check-E49.md (new), CHANGELOG.md, production/epics.md, production/stories.md, production/timeline.md, production/session-state/active.md, production/iterations.md.
- Proposed (ST-374..377): src/core/strings.js (new, DOM-free), tests/strings.test.js (new), string rewires in the 8 render files (screens.js, hud.js, waveBanner.js, killFeed.js, tutorialOverlay.js, settingsPanel.js, bossHealth.js, src/main.js), zh + ja locale tables inside strings.js.

## Verification evidence
- I403 (DOCS-only): fresh inventory scan (.evidence/I403/scan.cjs: 144 pre-filter distinct across the 8 files) + full re-read of design/i18n-strings.md (key table, expansion risks, locale risks, extraction order) + quality bar npm test + build (expected 929/929 + build 0 + dist unchanged 1,919,653 B + vendor sha + hygiene).

## Next owner or decision
- Owner: gameplay-programmer (render layer + strings.js). Creative-director lane: the plan's W1 (boss-name policy) is pre-resolved by the plan's own recommendation (names stay English in all locales) - no decision needed unless narrative localization is scoped.
- NEXT I404 = ST-374 string extraction (cgs-dev-story).