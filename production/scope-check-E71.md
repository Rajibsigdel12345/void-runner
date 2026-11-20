# Scope Check - E71 Camera Framing + Cockpit FPV (crosshair polish + far-view cross-mode verify) WITH MEASUREMENT (I528)

## 1. Measured current state (tree-verified, I528)

- HEAD bf6df5f (I527, E70 CLOSED 5/5). dist 5,255,258 B / 184 files; ceiling
  6,100,000 B; CLOSE FLOOR E70 = 844,742 B (headroom rule: >= 102,400 B or
  cut ladder).
- Fleet: 31 Blender GLBs, 2,925,988 B / 63,617 tris (unchanged; zero new
  assets in E71 - the crosshair is a DOM/CSS shape, not a 3D asset).
- Pin set (5 harnesses), ALL EXPECTED EXACT through E70: causal495 3-arm
  (webgl + default EXACT on the seed-9876 window wave 2 / 36.15 s; webgpu
  report-only err=0 warn=3 documented I498) / causal483 CAUSAL456 PASS /
  playframe483+491 PLAYFRAME456 PASS (A MENU 22/25,781 + 11/180; B reseed
  71201 frame 50 52/55,400 hv=0/gv=0) / pwa491 SUMMARY 11/11.
- Vendor r187 UNCHANGED (raw sha16 104F561458997220 / 613E370F76638FDE /
  EAFEAD3154EC0609 / D8F3CDB8B85B799A; dist-min A65DE049A7F38B40 /
  7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- Tests 1,187/1,187 green (fresh I527); build 0.
- BOM baselines CHANGELOG 7 / stories 5 / epics 3 / iterations 5 /
  timeline 3 / AGENTS 1 / scope-check 0 (this file 0) / e71-research 0.
- KEY AUDIT FINDING: the user's three verbatim E71 camera/FPV requests were
  ALREADY SHIPPED in earlier episodes. A measured audit of HEAD (research
  sec.0-1) confirmed: (A) chase stable framing / position-invariant view
  angle DONE (ST-415 I445, cameraModel.js chaseTargets + dollyFactor;
  far-view measured 8.6% at rest I504); (B1) cockpit shows a portion of the
  ship DONE (I504 cockpitHeight 1.02 / setback 0.15 / lookDrop 1.2 +
  main.js:1232 ship visible in cockpit); (C) view-relative cockpit controls
  DONE (I504 cockpitThrust, applied main.js:995 touch + :1009 WASD). The
  ONE genuine ship residual is (B2) "replace that line with the crosshair"
  - shipped as a plain center DOT (#vr-cockpit-dot), not a crosshair.

## 2. Scope fit

E71 = finish the camera/FPV standing-queue item the way it was actually
requested, WITHOUT re-doing shipped work (no over-engineering; smallest
lever first; residuals ship documented). Two residuals, both scoped to the
cockpit/verify surface - NOT a camera rebuild:
- R-CAM-1 (ship): cockpit aiming indicator dot -> crosshair (center dot +
  four short symmetric ticks). Render-only (src/render/bearingStrip.js):
  static CSS shapes, 0 core, 0 sim, 0 new 3D draw calls, RM-safe. Keeps the
  existing #vr-cockpit-dot el + id so the smoke504 probe stays 18/18.
  Grounded (research sec.2) on the canonical minimal crosshair form
  (center dot + 4 ticks) and the "keep it subtle" Dead Space principle
  (thin ticks, moderate opacity, no clutter, no image asset).
- R-CAM-2 (verify, DEFAULT document-only): confirm the position-invariant
  chase framing (same view angle wherever the ship moves) AND the far-view
  band hold in BOTH endless (arena rim, t->1) AND campaign (max flight-path
  excursion) WITH MEASUREMENT. If both hold (expected, from the I445
  invariant + I504 8.6% read) -> document, 0 src. If a measured gap -> ONE
  smallest config lever WITH MEASUREMENT, re-pinning playframe B only on
  measured drift.
Supporting research: design/e71-camera-fpv-research.md (measured audit
sec.0-1, LABELED YouTube grounding sec.2, pre-registered residuals/levers/
branches sec.3-4, risks sec.5, pin-safety sec.6, story map sec.7,
verification sec.8) + this scope check.

## 3. Stories (ST-494..ST-497; acceptance in production/stories.md)

- ST-494 (I528, this) - E71 open: measured audit + scope (docs-only):
  design/e71-camera-fpv-research.md + this scope check + epics/stories/
  iterations/timeline/CHANGELOG/active entries + E70 header doc-fix
  (IN PROGRESS -> CLOSED, opened I523 closed I527 - the block's Status line
  already read CLOSED; the header line was left stale).
- ST-495 (I529) - R-CAM-1 crosshair (render-only: bearingStrip.js dot ->
  dot + 4 ticks; 0 core, 0 sim; headless probe: cockpit present /
  chase + overview hidden; smoke504 stays 18/18; quality bar 6/6).
- ST-496 (I530) - R-CAM-2 far-view cross-mode verification (headless probe:
  endless rim + campaign path-excursion; angle invariance + far-view % WITH
  MEASUREMENT; document by default, ONE smallest-lever WITH MEASUREMENT only
  on a measured gap; quality bar 6/6).
- ST-497 (I531) - G71.0 close gate: fresh 5-harness re-runs (EXPECTED EXACT)
  + CLOSE FLOOR E71 re-derived WITH MEASUREMENT + quality bar + AGENTS.md
  refresh if needed + bookkeeping + commit/push.

## 4. Pin expectations (re-pin table)

- causal483 / playframe483 / playframe491 / causal495 / pwa491: EXPECTED
  EXACT through all E71 stories. R-CAM-1 is cockpit-only and cockpit is NOT
  active in any pin window (MENU / reseed-71201 frame 50 chase / causal
  seed-9876 chase / pwa491) -> it draws ZERO pin surface; 1,187 tests
  unchanged (no core). R-CAM-2 is probe-only by default; a chase/cockpit
  lever would re-pin playframe B ONLY on measured drift (I482/I501 pattern).
- Vendor r187: unchanged (no vendor work in E71).

## 5. dist + asset policy (PRE-REGISTERED)

- Open: 5,255,258 B / 184; ceiling 6,100,000 B (headroom 844,742 B).
- Expected: R-CAM-1 adds a few KB of CSS/JS (static crosshair shapes) ->
  negligible vs the 844,742 B headroom; no renegotiation anticipated.
  R-CAM-2 default is document-only (0 src). Zero new assets; fleet 31 GLBs /
  2,925,988 B / 63,617 tris unchanged.
- CLOSE FLOOR E71 re-derived WITH MEASUREMENT at G71.0 (headroom
  >= 102,400 B or cut ladder C1-C2).

## 6. Cut ladder (in order)

C1 R-CAM-1: four ticks -> two ticks (top + bottom only) if a quick A/B read
shows the 4-tick is too busy at the rest FOV (Dead Space subtlety). Not
expected; the grounded design is 4-tick. C2 R-CAM-2: document-only (the
default) if both the angle invariance and the far-view band hold - no
lever, no src.

## 7. Deferrals (NOT in E71)

Standing queue (2) PWA installable + mobile landscape D-pad + menu reorg (the
Pages deploy is blocked - option C stable, the local build IS the
deliverable) / queue (3) enemy art-direction pass (Blender) / campaign
level 5 / support-buff enemy. E71 touches ONLY the cockpit aiming indicator
and the far-view verification.

## 8. Risks

K1 R-CAM-1 adds a DOM element - NOT a 3D draw call (CSS shapes), so the
draw-call pins are untouched; keep the existing #vr-cockpit-dot el + id
(probe compatibility). K2 R-CAM-1 is cockpit-only -> zero pin surface; all 5
harness pins EXPECTED EXACT. K3 R-CAM-2 probe-only by default; a chase/
cockpit lever re-pins playframe B only on measured drift. K4 reduced motion -
the crosshair is a static shape; the only motion is the opacity fade,
disabled under RM (transition: none) - RM-safe. K5 dist growth negligible
(< a few KB vs 844,742 B headroom).

## 9. Verification bar (per iteration)

Docs-only (I528): npm test 1,187/1,187 + build 0 + dist byte-identical
5,255,258 B/184 + vendor diff empty + BOM delta 0 + hygiene (no servers, no
tabs). Render story (I529): smoke504 18/18 + crosshair headless probe
(cockpit present / chase + overview hidden) + pins EXPECTED EXACT + quality
bar 6/6. Verify story (I530): far-view headless probe WITH MEASUREMENT
(endless rim + campaign excursion) + pins EXPECTED EXACT + quality bar 6/6.
G71.0 (I531): 5 fresh harness re-runs ALL EXPECTED EXACT + CLOSE FLOOR WITH
MEASUREMENT + bookkeeping.

## 10. Changed files + next

I528 (this): + design/e71-camera-fpv-research.md (NEW, 12,537 B, LF no-BOM,
already present), + production/scope-check-E71.md (this file, LF no-BOM),
~ production/epics.md (E70 header doc-fix IN PROGRESS -> CLOSED + E71 block
appended at EOF, no trailing NL), ~ production/stories.md (STATUS I528
line), ~ production/iterations.md (I528 section), ~ production/timeline.md
(I528 line), ~ CHANGELOG.md (I528 line), ~ production/session-state/active.md
(I528 note; finalize the one I527 "Committed (this story) + push pending" to
the pushed state). Zero src, zero assets.

Next: I529 = ST-495 (R-CAM-1: cockpit crosshair in src/render/bearingStrip.js,
render-only, probed; keep #vr-cockpit-dot el + id).
