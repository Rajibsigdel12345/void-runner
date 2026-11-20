# Scope Check - E74 Mobile/PWA UX Pass (Menu Reorg + Landscape + Installability) WITH MEASUREMENT (I543)

## 1. Measured current state (tree-verified, I543)

- HEAD dfb6194 (I542, E73 CLOSED 4/4, pushed + deployed: origin main = dfb6194b2e8cfdd035030818de11861f7b9bace2, Pages site HTTP 200).
- dist 5,542,040 B / 184 files; ceiling 6,100,000 B; CLOSE FLOOR E73 = 557,960 B (measured at G73.0, I542).
- npm test 1,187/1,187; npm run build 0; vendor r187 4/4 (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- Menu audit (research sec.1.1): screens.js 35,468 B, FLAT layout, settings panel permanently visible (G1 = the verbatim ask).
- Touch audit (sec.1.2): floating thrust stick + LEFT/RIGHT zones shipped (ST-321/322/323); no safe-area insets, small-screen stick scaling unverified (G3).
- PWA audit (sec.1.3): manifest 452 B (standalone + landscape + 512-icon only), sw.js 1,755 B (vr-shell-v1), pwa491 baseline 11/11; install-affordance gaps (G4); zero orientation handling (G2).
- Continue support: storage.js getCampaignProgress() 0|1..4 (voidrunner.campaign) - the D1 Continue button needs no new persistence.
- BOM baselines: epics 3 / stories 5 / iterations 5 / timeline 3 / CHANGELOG 7 / active 0 / AGENTS 1; this episode docs: research 0 (LF no BOM), scope-check 1 (CRLF + BOM, house convention).

## 2. Scope fit

E74 = the next unaddressed verbatim user request: a standard-game menu hierarchy (Continue / New Game / Settings) + mobile landscape playability + PWA installability. The audit confirms the other standing-queue items were already shipped (E71 camera/cockpit, E72 enemy art, E73 ship v7), so E74 does NOT re-open them. All work is DOM/CSS/manifest/meta + input-layer tuning + one new pure core module (menuModel.js, DOM-free). No Blender, no new 3D assets.

## 3. Frozen scope bounds (E74)

- NO new GLB/3D assets; no Blender in this epic.
- NO core-sim code change: src/core/game.js and all sim/FSM modules untouched; menuModel.js is a NEW pure module consumed only at MENU.
- NO renderer / FX / camera change; vendor r187 UNCHANGED (4/4 pins hold).
- NO service worker change unless the ST-512 audit finds a concrete gap; CACHE vr-shell-v1 stays; pwa491 must stay 11/11.
- Manifest: orientation landscape + display standalone FROZEN (already correct); changes limited to icon/meta affordances.
- Campaign persistence FROZEN: voidrunner.campaign read-only via getCampaignProgress(); no new storage keys.
- i18n: 3 locales (en/zh/ja) for every new label (ST-375).
- Touch: the shipped floating stick is KEPT (user verbatim "or the one we have"); only scaling / safe-area / zone-gap fixes.

## 4. Stories (ST-509..ST-513)

- ST-509 (I543) open/research/scope - DONE I543 (docs-only zero src).
- ST-510 (I544) menu reorg (D1): menuModel.js + screens.js + settingsPanel collapse + i18n + tests.
- ST-511 (I545) mobile landscape pass (D2 + D3): rotate hint + safe-area + stick audit.
- ST-512 (I546) PWA install hardening (D4): meta gap-fill + optional 192 icon + install affordance.
- ST-513 (I547) G74.0 close gate: 5 fresh harnesses + CLOSE FLOOR E74 + AGENTS.md refresh + push delegate.

## 5. Cut ladder (pre-registered, smallest first)

- C1: settings expand/collapse -> simple always-visible toggle (drop the panel animation) if the collapse proves buggy.
- C2: drop the 192 px icon (keep 512 only) to save bytes.
- C3: drop safe-area insets (keep the notch-free layout) if the CSS proves finicky.
- C4: portrait hint overlay -> static text (drop the matchMedia auto-hide).

## 6. Tripwires (measured gates)

- dist: expected +5-15 KB vs 5,542,040 B; tripwire at 6,000,000 B -> invoke cut ladder C1..C4.
- pwa491: must stay 11/11 (K4); any regression BLOCKS the story.
- playframe A/B + causal pins: EXPECTED EXACT every story (DOM-only argument, research sec.6); re-pin only on measured drift WITH MEASUREMENT.
- i18n: any locale missing a new key BLOCKS the story (ST-375 locale targets).
- Browser smoke: console 0/0, no NaN, desktop menu pixel-stable (K3) on every render-touching story.

## 7. Definition of done (G74.0)

- E74 closes 5/5: menu reorg live (one primary Continue/New-Game, mode row, collapsible Settings, secondary Replays, bottom board/status/credit; 3 locales; Enter = primary) + landscape hint + safe-area touch pass + PWA install affordances (pwa491 11/11) + 5 fresh harness runs EXACT + CLOSE FLOOR E74 re-derived WITH MEASUREMENT + AGENTS.md refresh + quality bar 6/6 on every story.