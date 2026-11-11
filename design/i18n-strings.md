# i18n-strings - Locales-ready string extraction (I166 / ST-166)

Status: **PLAN ONLY (CUTTABLE)**. No production diff, no i18n implementation. This document is a
string inventory + extraction plan so a future locale pass can be done without re-scanning the
render layer. Scope: player-facing text in the DOM render layer only (core/ is string-free by
design - no game rules talk, only presentation).

## Summary

- 8 render files carry player-facing strings: screens.js, hud.js, waveBanner.js, killFeed.js,
  tutorialOverlay.js, settingsPanel.js, bossHealth.js, main.js (toasts + context-loss overlay).
- ~95 distinct player-facing strings (dynamic templates included), of which ~35 are
  keycap/action labels (WASD, MOUSE, ENTER, DRAG, 2 FINGERS) that are NOT translated but
  localized via a keycap map (hardware labels differ per layout).
- No pluralization needed (all counts are number-suffixed, e.g. "KILLS 12").
- Main expansion risks: the settings footer hint line, the tutorial boss note, and the
  keycap grids (fixed two-column layout).
- Recommended path when (if) this becomes active: a DOM-free src/core/strings.js with an en
  default table + t(key, vars) lookup; render modules import it. Zero core-logic impact, so the
  491-test suite is untouched.
- Blocking issues: none. Single-locale arcade scope; deferral is acceptable and was the story's
  intent ([CUTTABLE]).

## String Context (inventory, verified against source at I165)

Line references are as of commit c042dc7 (I165). Values with a suffix are runtime templates.

### screens.js (menu / pause / game over)

| Line | String | Kind | Notes |
| --- | --- | --- | --- |
| 67 | VOID RUNNER | brand | Do NOT translate (title); keyless |
| 68 | survive the void, outlast the waves | tagline | menu subtitle |
| 72-73 | DRAG / fly the ship, TOUCH / auto-fire, 2 FINGERS / pause, thrust, MOUSE / fire, pause, mute | keycap + caption | two variants: coarse (touch) vs fine (desktop) pointer; keycaps go in the keycap map, captions translate |
| 89 | TOP 5 | heading | high-score board |
| 104 / 109 | TAP TO START / PRESS ENTER TO START | CTA | pointer-variant pair |
| 115 | DAILY RUN | button | daily seeded board |
| 117 | Start the daily seeded run | aria-label | |
| 121-122 | (dynamic) BEST n ; DAILY key - BEST n / NO BEST YET | dynamic | filled in update() |
| 124-129 | M - MUTE (OFF/ON)     F - FX (HIGH/LOW) | dynamic | I165 menu status row, per-frame from screenOpts |
| 131 | PAUSED | heading | |
| 139-141 | RESUME / RESTART / QUIT TO MENU | buttons | |
| - | M - MUTE (ON/OFF), F - FX (HIGH/LOW) | dynamic | pause label rows (same family as menu row) |
| 178 | GAME OVER | heading | |
| 179 / 263 | SCORE n | dynamic | |
| 264 | BEST n | dynamic | |
| 265 | NEW BEST! | dynamic | |
| 267 | BOARD RANK #n | dynamic | |
| 270 | KILLS n    WAVE n | dynamic | 4-space gap is decorative; use tab/colon in locales |
| 271 | MAX COMBO n    TIME m:ss | dynamic | time is m:ss, no locale formatting today |
| 272 | ACCURACY n%    SHOTS h/f | dynamic | fraction h/f, not a ratio string |
| 274 | DAILY RUN - key  (NEW DAILY BEST) | dynamic | badge; mid-dot separator |
| 193 / 198 | TAP TO RESTART / PRESS ENTER TO RESTART | CTA | pointer-variant pair |
| 208 | COPY RESULT | button | shareable result code |
| 207 | Copy result code | aria-label | |
| 222 | COPIED! / COPY FAILED | dynamic | clipboard feedback |
| 232 | copies a reproducible result code | caption | |
| - | - no scores yet - | empty state | TOP 5 board |

### hud.js

| Line | String | Kind |
| --- | --- | --- |
| 10-15 | RAPID, SPREAD, SHIELD, MAGNET, OVERDRIVE, SLOW-MO | power-up tags |
| 18 | FAST ROCKS, SMALL ROCKS, INWARD DRIFT, HEAVY ROCKS | wave-modifier tags |
| 117 | COMBO | label |
| dynamic | WAVE n, BEST n | HUD counters |

### waveBanner.js

| Line | String | Kind |
| --- | --- | --- |
| 31 / 35 | WAVE n | big line |
| 29 | ENDLESS | tag |
| 25 | FAST ROCKS, SMALL ROCKS, INWARD DRIFT, HEAVY ROCKS | MOD_LABELS (shared family with hud) |
| 34-35 | CLEARED | big line (gold) |
| 39-40 | THE SPLICER / THE MONOLITH | boss name |
| 77 | NEXT WAVE IN n | intermission countdown |
| 40 | WAVE n - maxHp HP | boss sub-line |

### killFeed.js

| Line | String | Kind |
| --- | --- | --- |
| 32 | THE SPLICER / THE MONOLITH | boss row |
| 33 | WARDEN | mini-boss row |
| 34 | MINE | mine row |
| 35 | SEEKER | drone row |
| 36 | GOLDEN ROCK | special rock |
| 38 | L/M/S ROCK | size-prefixed rock row |

### tutorialOverlay.js

| Line | String | Kind |
| --- | --- | --- |
| 53 | HOW TO PLAY | heading |
| 54 | fly, auto-fire, and outlast the waves (coarse) / fly, aim, fire - and outlast the waves (fine) | sub |
| 59-60 | keycap rows (same set as menu) | keycap + caption |
| 72 | survive the waves - bosses arrive on wave 5 and beyond | note (WIDEST string in the game) |
| 77 | TAP TO LAUNCH / LAUNCH | CTA pair |
| 81 | ENTER | keycap |
| 84 | Dismiss the tutorial and start playing | aria-label |

### settingsPanel.js

| Line | String | Kind |
| --- | --- | --- |
| 54-74 | AUDIO, VOLUME (aria Volume), SFX (aria Sound effects), MUSIC (aria Music) | audio card |
| 83-88 | VISUALS, FX QUALITY (aria FX quality), LOW / HIGH options | visual card |
| 92-95 | REDUCED MOTION (aria Reduced motion) | |
| 99-108 | FONT SCALE (aria Font scale), NORMAL / LARGE | |
| 112-115 | SHAPE CUES (aria Shape cues) | |
| 119-122 | COLORBLIND (aria Colorblind preview) | |
| 126-129 | SLOW-MO HINT (aria Slow-mo hint) | |
| 139 | TAB NAVIGATES - ARROWS MOVE - SPACE TOGGLES | footer hint (WIDEST settings string) |

### bossHealth.js

| Line | String | Kind |
| --- | --- | --- |
| 26 | SPLICER / MONOLITH | bar label (short forms of the banner names) |

### main.js (toasts + context-loss)

| Line | String | Kind |
| --- | --- | --- |
| 232 | FX AUTO-SET TO LOW (LOW FPS) | adaptive-quality toast |
| 356 | FX HIGH / FX LOW | fx toggle toast |
| 474 | THE SPLICER / THE MONOLITH (banner arg), SPLICER INBOUND | boss callout toast |
| 475 | WARDEN INBOUND | mini-boss callout toast |
| 478 | WEAPON LEVEL n | upgrade toast |
| 405 | The browser dropped the 3D rendering context. It usually comes back on its own - please wait. | context-loss overlay |
| 409 | RELOAD GAME | context-loss button |

### Not localized (intentionally excluded)

- audio.js: zero UI strings (WebAudio synth only).
- keycap hardware labels (WASD, ARROWS, MOUSE, CLICK, SPACE, P, ESC, M, F, ENTER, DRAG, TOUCH,
  2 FINGERS): these are physical control identifiers - localize via a keycap map per locale,
  never translate the glyphs themselves.
- debugOverlay, SFX cue names, storage keys, aria "live"/"polite" values: not player-facing.

## Proposed key naming convention

Pattern: `<area>.<item>[_<variant>]`, all lowercase snake_case, grouped prefix mirrors the
module. Dynamic parts become {vars} in ICU-ish placeholders (NOT sprintf %s).

- menu.* - title.tagline, menu.start_tap, menu.start_key, menu.daily, menu.daily_aria,
  menu.board, menu.best, menu.daily_line, menu.status_mute, menu.status_fx, menu.no_scores
- pause.* - pause.title, pause.resume, pause.restart, pause.quit, pause.label_mute, pause.label_fx
- over.* - over.title, over.score, over.best, over.new_best, over.rank, over.stats_kills,
  over.stats_combo_time, over.stats_accuracy, over.daily_badge, over.restart_tap, over.restart_key,
  over.copy, over.copy_aria, over.copied, over.copy_failed, over.copy_caption
- hud.* - hud.wave, hud.best, hud.combo, hud.pu.rapid|spread|shield|magnet|overdrive|slowmo,
  hud.mod.fast|small|inward
- banner.* - banner.wave, banner.cleared, banner.endless, banner.countdown, banner.boss_sub,
  banner.boss.splicer, banner.boss.monolith (killFeed reuses banner.boss.* + feed.* for the rest)
- feed.* - feed.warden, feed.mine, feed.seeker, feed.golden_rock, feed.rock_s|m|l
- tutorial.* - tutorial.title, tutorial.sub_coarse, tutorial.sub_fine, tutorial.boss_note,
  tutorial.go_tap, tutorial.go_key, tutorial.dismiss_aria
- settings.* - settings.audio, settings.volume(+_aria), settings.sfx(+_aria), settings.music(+_aria),
  settings.visuals, settings.fx(+_aria, .low, .high), settings.reduced_motion(+_aria),
  settings.font_scale(+_aria, .normal, .large), settings.shape_cues(+_aria),
  settings.colorblind(+_aria), settings.slowmo_hint(+_aria), settings.kbd_hint
- toast.* - toast.fx_auto_low, toast.fx_level, toast.splicer, toast.warden, toast.weapon
- ctxlost.* - ctxlost.message, ctxlost.reload
- keycaps.* - keycaps.wasd, keycaps.arrows, keycaps.mouse, keycaps.click, keycaps.space, keycaps.p,
  keycaps.esc, keycaps.m, keycaps.f, keycaps.enter, keycaps.drag, keycaps.touch, keycaps.two_fingers
  (+ captions: keycaps.drag_desc, .touch_desc, .two_fingers_desc, .mouse_desc, .click_desc, .p_desc, .m_desc)

## Extraction plan (when/if activated)

1. New module src/core/strings.js (DOM-free, core/ contract preserved):
   - export const STRINGS = { en: { 'menu.start_key': 'PRESS ENTER TO START', ... } };
   - export function t(key, vars) - looks up en table (single locale for now), substitutes
     {n} placeholders, throws in dev on unknown key (fail loud, like the config contract).
   - Keycap map: export function kc(key) - maps logical control names to hardware labels for
     the active locale (en default).
2. Render modules import { t, kc } from '../core/strings.js' and replace the ~95 literals.
   No changes to update() cadence, pooling, or DOM structure - textContent swaps only.
3. Locale source of truth: navigator.language detection at boot is OUT OF SCOPE for the first
   extraction pass (en only); the t() seam is the deliverable.
4. Tests: tests/strings.test.js - every key resolves, every template's placeholders match its
   call sites (static scan), and t() throws on unknown keys. Core stays DOM-free, so node --test
   covers it unchanged.
5. Ordering: extract screens.js first (most strings, most user-visible), then settingsPanel,
   then banner/killfeed/hud, then tutorial/toasts/ctxlost. One commit per file group to keep
   reviewable.

## Text Expansion

- WIDEST strings (watch in any wider locale):
  - settings.kbd_hint "TAB NAVIGATES - ARROWS MOVE - SPACE TOGGLES" (~44 chars, centered under
    two fixed cards; at German/Scandinavian length it will wrap to 2 lines - acceptable, no clip).
  - tutorial.boss_note "survive the waves - bosses arrive on wave 5 and beyond" (~58 chars,
    15px line under the control grid; wrap is fine, overflow:hidden is NOT set on that card).
  - over.copy_caption "copies a reproducible result code" (11px caption, wraps under the button).
- Fixed-width-ish containers (verify after extraction):
  - Menu keycap grid: 2-column table of keycap chips + captions; captions are short verbs
    (fire / pause / mute) - German "Schuessen" fits, but "Zwei Finger" (two fingers desc) may
    squeeze the touch column. Mitigation: captions may wrap; do not set white-space:nowrap.
  - HUD boxes: score/mult/combo are number-dominated; only "COMBO" label translates (short).
  - Wave banner: 40px/52px display text with letter-spacing 8px - boss names "THE SPLICER /
    THE MONOLITH" are proper nouns and stay English (design decision, see Locale Risk).
  - Kill feed rows: right-aligned, max ~18 chars today; "GOLDEN ROCK" and "THE MONOLITH" are
    the ceiling. Longer localized rock terms would clip on narrow viewports - keep rock terms
    short in every locale.
- Em-dash and mid-dot separators (status row "M - MUTE (OFF)     F - FX (HIGH)", daily badge
  mid-dot): move separators into the template strings, not into CSS, so locales can reorder.

## Pluralization

- No true plurals: every count is number-suffixed ("KILLS 12", "WAVE 3", "WEAPON LEVEL 2").
  Safe for locales where singular/plural is not distinguished in position.
- The ONLY latent plural: TOP 5 board entries are score+wave only (no "1st/2nd" rank words),
  so ordinal forms are not needed. If a locale wants ordinals, the rankLine is the only touch
  point (over.rank).

## Locale Risk

1. Boss names (THE SPLICER / THE MONOLITH / WARDEN / SEEKER) are proper nouns tied to the
   narrative identity. RECOMMENDATION: keep them English in all locales (same policy as the
   game title); translate only the surrounding grammar ("SPLICER INBOUND" toast becomes
   "<name> INBOUND" with the name token untranslatable). Flag for the creative-director lane
   if narrative localization is ever scoped.
2. Time format "TIME m:ss" is locale-neutral as written; if a locale prefers 0:05 vs 5:00,
   that is a formatting decision at extraction time (keep the raw m:ss pair in the template).
3. "ACCURACY n%" - percent-sign placement varies (German "n %"); the template must keep the
   number and % as separate tokens.
4. SHOTS h/f (hit/fired fraction) - some locales prefer f/h or a percent; template with
   {hit}/{fired} tokens and let the locale pick order.
5. Right-to-left: NOT a target (arcade single-locale scope). If ever needed, the keycap grids
   and the HUD are the two flex layouts that would need a logical-direction audit (they already
   use flex, so the damage would be limited).
6. Font: the stack is "Segoe UI", system-ui - wide-CJK/Japanese text would fall back to system
   fonts and look off-brand. Document as an accepted risk if CJK locales are ever added.
7. Daily badge date (YYYY-MM-DD from toISOString slice) is already locale-neutral (ISO). Good.

## Review

- Inventory is line-verified against c042dc7 (I165) - every entry above was read from source
  this iteration (regex scan + targeted grep), not recalled.
- Excluded noise (CSS fragments, JS identifiers, SFX cue names) was filtered out; the count
  ~95 is curated, not raw regex output (raw scan: 455 quoted fragments across 8 files).
- The plan preserves every project contract: core/ stays DOM-free and three-free, all tunables
  remain in config.js (strings are presentation, not tunables - they live in the new
  strings.js, documented here), determinism is untouched.
- CUTTABLE behavior confirmed: deleting this whole story costs nothing at runtime; the game is
  fully playable and tested without it.

## Blocking issues

None. Warnings (non-blocking):
- W1: boss-name translation policy (Locale Risk #1) needs a creative decision before any
  non-English table is written.
- W2: keycap localization is a separate workstream (hardware labels per layout) - this doc
  only defines the seam (keycaps.*), not the mappings.

## Changed files / proposed files

- Added: design/i18n-strings.md (this document).
- Proposed (NOT created - future pass): src/core/strings.js, tests/strings.test.js, plus
  string-replacement diffs in the 8 render files listed in String Context.

## Verification evidence

- String scan run this iteration (node regex over the 8 files, ~455 raw fragments) + targeted
  grep for the dynamic templates (SCORE/BEST/KILLS/ACCURACY/INBOUND/WEAPON/RELOAD) - all
  inventory lines above match source at c042dc7.
- Docs-only iteration: npm test and build re-run for the quality bar (see iterations.md I166).
- No rendering change, no browser smoke required.

## Next owner / decision

- Owner if activated: gameplay-programmer (render layer + strings.js) with a quick
  creative-director sign-off on the boss-name policy (W1).
- Decision for the producer: keep CUTTABLE and defer to a post-E9 "localization seam" epic,
  or promote now (estimated ~3-4 iterations: strings.js + tests, screens/settings extraction,
  banner/feed/hud extraction, tutorial/toasts/ctxlost + regression smoke).
