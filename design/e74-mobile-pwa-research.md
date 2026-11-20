# E74 Mobile/PWA UX Pass (Menu Reorg + Landscape + Installability) - Research (I543)

## 0. User request (verbatim)

- "and also in the menu it can be better organized, by organized i mean not display everything in one place like in standard game there can be like continue, new game ,settings and under setting other , you get the point you cna certainly look that up as well as part of the research"
- "and one more thing can you make so that its pwa installable if github pages allows it and playable in the mobile phone as well in the landscape mode with the d pad or the one we have"

Interpretation (bounded): E74 = a UX pass on the non-3D surface: D1 menu reorg (standard game-menu hierarchy: Continue / New Game / Settings), D2 mobile landscape playability (orientation hint), D3 touch tuning (the shipped floating stick - verbatim "or the one we have"), D4 PWA installability hardening. The measured audit (sec.1) confirms the other standing-queue items were already shipped before this epic opened: the cockpit ship-in-view + crosshair + view-relative controls request is DONE (E71, I528-I531), the enemy art pass is DONE (E72, I532-I538), and the ship v7 remaster is DONE (E73, I539-I542). E74 therefore picks up the next unaddressed verbatim request. No new 3D assets (no Blender in this epic); all work is DOM/CSS/manifest/meta plus one new pure core module (menuModel.js).

## 1. Measured audit (I543, tree-verified)

### 1.1 Menu (src/render/screens.js, 35,468 B)
- FLAT single-screen layout - everything visible at once:
  - tagline (L90)
  - startBtn "TAP TO START" + startLine "PRESS ENTER TO START" (L127-140)
  - 2-col grid: controls help + top-5 board "menu.board" (L121-125)
  - status line M/F/N/V (L126)
  - dailyRow: DAILY ("menu.daily") + REPLAYS ("menu.replays") (L140-165)
  - modeRow: ENDLESS ("menu.mode_endless") + CAMPAIGN ("menu.mode_campaign") (L167-190)
  - bestRow (L193-196)
  - SETTINGS panel absolutely positioned left:16px bottom:54px, ALWAYS in the DOM (L202-207; CSS screen-menu .vr-settings L40-42)
- Buttons .vr-start / .vr-pause-btn; @media (pointer:coarse){.vr-start,.vr-pause-btn{min-height:44px}} (L44).
- Gap G1 (the verbatim ask): no primary/secondary hierarchy - "TAP TO START" is a generic start, there is no Continue button, no New Game grouping, and Settings is a permanent absolute panel instead of a menu entry.

### 1.2 Touch (shipped - KEPT per "or the one we have")
- touchStick.js: floating thrust-stick visual - ring 180 px = 2x MAX_PX, knob 48 px = 2x DEADZONE, fade 120/200 ms, coarse-gated (main.js:374/745).
- input.js: LEFT screen zone = thrust, RIGHT screen zone = aim + fire (hold); FIRE_TAIL 0.22 s tap guarantee (L10-14, L31-35).
- touchZones.js core pure zone math; haptics.js (ST-322); two-finger pause (main.js:727); touch pause button 44 px bottom-right (main.js:735-742); touch start button (I71: main.js:651, screens.js:128-134).
- Gap G3: stick scaling + 44 px target audit on small landscape screens not yet done; no safe-area (notch) insets anywhere (G5 = landscape touch layout, covered by D3).

### 1.3 PWA (baseline already green)
- public/manifest.webmanifest (452 B): name/short_name "Void Runner", id "/", start_url ".", scope ".", display standalone, orientation landscape, background/theme #04060f, single icon icon-512.png purpose "any maskable".
- public/sw.js (1,755 B): CACHE vr-shell-v1, PRECACHE ['./','./index.html'], cache-first runtime + network-first navigate; prod-gated registration via meta vr-build=prod (ST-319/I348).
- index.html: viewport meta (user-scalable=no) + apple-touch-icon (L5, L11).
- pwa491 baseline = SUMMARY 11/11 (SW + manifest + offline boot).
- Gap G4: no 192 px icon (512 only), no beforeinstallprompt handling (Android), no surfaced iOS Add-to-Home-Screen affordance (apple-touch-icon present, install hint not surfaced).
- Gap G2: NO orientation handling anywhere (grep of main.js/screens.js/hud.js/index.html finds only resize + pointer:coarse + reduce-motion matchMedia).

### 1.4 Continue support (already exists)
- storage.js getCampaignProgress() (L270-274): 0 or 1..levelCount(=4), key voidrunner.campaign; setCampaignProgress monotonic-raise clamped (L278-283). Directly supports the D1 Continue button (startCampaign from the saved level; Ikaruga-style checkpoint continue already shipped).

Gap summary: G1 flat menu (verbatim ask) / G2 no orientation hint / G3 small-screen touch audit + safe-area / G4 PWA install affordances / G5 landscape touch layout.

## 2. LABELED research (YouTube MCP, this session - chapter-level cites)

- UX-1 Kole Jain "One Screen, One Job" (Gfsd8NNuD9g) [3:30]: one menu screen, one dominant action. Grounds D1: exactly ONE primary button (Continue if available, else the default mode).
- UX-2 uxpeak mobile menu practice (wLJ40GV2XEc): thumb-friendly tap areas ~44 px [8:55]; menu label sizes 10-12 px [6:09]; keep primary tabs <= 5 [7:52]; short labels [13:08]. Grounds D1 target sizes, label budget, and the 44 px floor.
- UX-3 A Bit Of Game Dev (BNndkW4Oqno) [2:15]: the safe-area object pattern for notches (env(safe-area-inset-*)). Grounds D3 inset handling.
- UX-4 griffpatch virtual joystick practice (9TK8x2nSMPI): "Bigger Stick for Small Screens" [22:14]; activation area separate from the travel area [13:45]; constrained travel keeps aim stable [9:02]. Grounds the D3 stick-scaling audit.
- UX-5 griffpatch multi-touch layout (cI1mdVVvCWY): multi-touch dead zones between the two control hands [18:55]; auto-centring of the floating stick [14:16]. Grounds the D3 landscape zone-gap check.
- UX-6 Tech-AM menu systems (z_0Gc48YDlM) [0:04, 1:36]: a menu reads as one visual system with clear hierarchy levels, not a bag of buttons. Grounds D1 grouping (primary / New Game row / Settings / secondary).

## 3. Pre-registered design decisions (FROZEN at I543)

D1 MENU REORG (the core ask):
- PRIMARY (exactly one): "CONTINUE - LV N" shown when storage.getCampaignProgress() > 0; action = startCampaign from the saved level (checkpoint continue already shipped). When no progress, the primary role falls to the default mode (Enter = Endless, matching today).
- NEW GAME: the mode row ENDLESS / CAMPAIGN / DAILY - the three playable entries, one short label each (UX-2).
- SETTINGS: collapsible panel, COLLAPSED by default (today: permanently visible absolute at left:16px/bottom:54px); expands on click/tap, closes on outside tap or Esc.
- SECONDARY: REPLAYS stays a single secondary button.
- BOTTOM: top-5 board + status line + credit line stay at the bottom (UX-1: the job on top, the score below).
- Keyboard: Enter = primary (Continue if available, else Endless). Touch: every interactive element >= 44 px.
- i18n: every new label ships in all 3 locales (en/zh/ja) via the menu.* keys in src/core/strings.js (ST-375 locale targets).
- Testability: the menu-structure decision (which primary + its label + the mode-row labels, given campaignProgress + locale) lives in a NEW PURE core module src/core/menuModel.js (DOM-free, unit-testable); screens.js consumes it.

D2 ORIENTATION: portrait + coarse pointer -> a DOM-only, non-blocking "rotate to landscape" hint overlay that auto-hides in landscape (matchMedia on orientation + resize). No forced JS lock; the manifest already declares orientation landscape for PWA installs. Coarse-gated so desktop is untouched (K3).

D3 TOUCH TUNING: KEEP the shipped floating thrust stick (verbatim "or the one we have"). Landscape pass = audit + small fixes only: stick sizing on small screens (UX-4), 44 px touch targets, safe-area insets (env(safe-area-inset-*), UX-3) on the stick zones / pause button / menu, and a landscape zone-gap check (UX-5).

D4 PWA INSTALL: manifest + SW already pass pwa491 11/11 -> verify + small gap-fill ONLY: meta tag completeness, optional 192 px icon, install affordance (Android beforeinstallprompt capture -> one-time install button; iOS: note that Add-to-Home-Screen is the path, no forced prompt). NO SW changes unless the audit finds a gap; CACHE vr-shell-v1 stays unless a gap demands it (K4).

## 4. Story map + estimates

- ST-509 (I543) open/research/scope - this iteration (docs-only zero src).
- ST-510 (I544) menu reorg: menuModel.js (pure) + screens.js reorg per D1 + settingsPanel collapse + strings.js i18n en/zh/ja + unit tests. Est: 1 iteration, dist +5-15 KB.
- ST-511 (I545) mobile landscape pass: rotate hint overlay (D2) + safe-area insets + stick scaling audit on small landscape viewports (D3). Est: 1 iteration, dist +2-5 KB.
- ST-512 (I546) PWA install hardening: meta gap-fill + optional 192 px icon + install affordance (D4); pwa491 must stay 11/11. Est: 1 iteration, dist +2-10 KB (icon).
- ST-513 (I547) G74.0 close gate: 5 fresh harness runs EXPECTED EXACT + CLOSE FLOOR E74 re-derived WITH MEASUREMENT + AGENTS.md refresh + bookkeeping + commit + push delegate. Est: 1 iteration.
- E74 closes 5/5 at G74.0.

## 5. Risks

- K1 i18n re-emit: every new menu.* key must land in en/zh/ja (ST-375 locale targets test) - a missing locale key fails the test run.
- K2 Enter-behavior change: Enter now = primary (Continue-aware) -> menuModel.js unit tests pin the decision table.
- K3 desktop impact: the portrait hint overlay + safe-area CSS must be coarse/mobile-gated so the desktop menu stays pixel-stable (browser smoke verifies).
- K4 PWA regression: pwa491 must stay 11/11; manifest + SW are frozen unless the ST-512 audit finds a gap.
- K5 dist growth: expect +5-15 KB total vs 5,542,040 B; headroom 557,960 B (CLOSE FLOOR E73) - negligible; tripwires in the scope check.

## 6. Pin safety

- All E74 work is DOM/CSS/manifest/meta + input-layer tuning + one new pure core module (menuModel.js). Zero 3D surface: no mesh, no material, no camera, no FX, no sim code (game.js untouched; menuModel is consumed at MENU only).
- Therefore playframe A 22/32,717 + 11/180 and B 52/69,272 (I541/I542 pins) and the causal seed-9876 pin set are EXPECTED EXACT through the entire epic. The MENU playframe window (A) counts DRAWN TRIS of the same scene (same ship v7, same arena) - a menu DOM reorg changes zero tris; re-pin only on measured drift, always WITH MEASUREMENT.
- storage.js is read-only here (getCampaignProgress); the voidrunner.campaign key and its monotonic-raise write path are untouched.

## 7. Verification plan + dist policy

- Per-story quality bar 6/6: npm test green; npm run build 0; browser smoke (headless Playwright with mobile emulation for ST-511/512: 844x390 landscape + 390x844 portrait, coarse pointer) console 0/0, no NaN; dist under 6,100,000 B; vendor r187 4/4 EXACT; BOM delta 0 on patched files; hygiene (0 leftover servers / 0 tabs / 0 stray terminals).
- pwa491 re-run at ST-512 and at G74.0 (must be 11/11).
- G74.0: 5 fresh harness runs (causal495 / causal483 / playframe491 / playframe483 / pwa491) EXPECTED EXACT; CLOSE FLOOR E74 = 6,100,000 - dist WITH MEASUREMENT; headroom >= 102,400 B or cut ladder.
- dist policy: tripwire at 6,000,000 B -> cut ladder C1..C4; expected final <= 5,560,000 B.