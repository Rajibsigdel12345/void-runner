# Scope Check - E72 Enemy Art-Direction Pass (E69 trio + gunship GLB remaster) WITH MEASUREMENT (I532)

## 1. Measured current state (tree-verified, I532)

- HEAD a04bb4f (I531, E71 CLOSED 4/4, pushed). dist 5,255,796 B / 184 files;
  ceiling 6,100,000 B; CLOSE FLOOR E71 = 844,204 B (headroom rule: >=
  102,400 B or cut ladder).
- Fleet: 31 Blender GLBs, 2,925,988 B / 63,617 tris. The four rebuild
  targets (measured): phantom 183,724 B / 2,336 tris / r 0.843; hauler
  264,416 B / 3,506 / r 1.189; bulwark 149,884 B / 2,700 / r 1.600; gunship
  198,760 B / 2,596 / r 1.643 (subtotal 796,784 B).
- Pin set (5 harnesses), ALL EXPECTED EXACT through E71: causal495 3-arm
  (webgl + default EXACT on the seed-9876 window wave 2; webgpu report-only
  err=0 warn=3) / causal483 CAUSAL456 PASS / playframe483+491 PLAYFRAME456
  PASS (A MENU 22/25,781 + 11/180; B reseed 71201 frame 50 52/55,400) /
  pwa491 SUMMARY 11/11.
- Vendor r187 UNCHANGED (dist-min A65DE049A7F38B40 / 7AB0784CD2532367 /
  F549248412C62B9A / 7FF9ACF50F006017). Tests 1,187/1,187 green; build 0.
- BOM baselines CHANGELOG 7 / stories 5 / epics 3 / iterations 5 / timeline
  3 / AGENTS 1 / e71-research 0 / scope-check-E71 0 / e72-research 0 (this
  episode's docs are both 0).
- AUDIT (this iteration): headless Blender render audit of all 10 fleet
  ships (.evidence/I532/: audit532.py + audit532.out + 72 PNGs) found the
  four defect ships named by the user (blob/LEGO/disc/coin reads at 96 px)
  and confirmed hunter/sentry/wasp are acceptable. Node-name contracts
  tree-verified from src/render/{phantom,hauler,bulwark,gunship}Mesh.js
  (regex slot binding) + the I516/I517/I509 build scripts.

## 2. Scope fit

E72 = rebuild the four weakest enemy GLBs (the "new" ships the user reacted
to: phantom / hauler / bulwark + the objectively weak gunship) with a proper
art pass, grounded in the research doc (P1-P7 principles:
silhouette-first, minimum viable elements, welded unity, volume over
flatness, role-in-shape, inset panel detail, rear readability). Bounded by
design: NO palette/config changes (E57 rule 1 ladder stays frozen), NO node-
name changes (renderer contracts), NO core/sim code, NO new assets beyond
the four GLB replacements, NO camera/ship work. Smallest-lever culture:
accept what already reads (hunter/sentry/wasp), defer the legacy-4 pass.

## 3. Stories (ST-498..ST-504; acceptance in production/stories.md)

- ST-498 (I532, this) - E72 open: measured fleet audit + research + scope
  (docs-only): design/e72-enemy-artpass-research.md + this scope check +
  epics/stories/iterations/timeline/CHANGELOG/active entries + .evidence/
  I532 force-added (audit script + .out + key downscaled PNGs).
- ST-499 (I533) - PHANTOM v2 remaster (Blender headless build -> temp GLB ->
  audit re-render + sil96 gate -> swap -> dist WITH MEASUREMENT -> quality
  bar 6/6 -> bookkeeping).
- ST-500 (I534) - HAULER v2 remaster (same pipeline).
- ST-501 (I535) - BULWARK v2 remaster (same pipeline).
- ST-502 (I536) - GUNSHIP v2 remaster (same pipeline).
- ST-503 (I537) - fleet integration verify (headless: GLB load, useGLB node
  binding, glow slots, pool bounds - newenemy483 pattern) + fleet sil96
  re-audit of the four rebuilt ships in-context.
- ST-504 (I538) - G72.0 close gate: fresh 5-harness re-runs (EXPECTED
  EXACT) + CLOSE FLOOR E72 re-derived WITH MEASUREMENT + quality bar +
  AGENTS.md refresh + bookkeeping + commit/push.

## 4. Pin expectations (re-pin table)

- causal483 / causal495 / playframe483 / playframe491 / pwa491: EXPECTED
  EXACT through all E72 stories. The causal pins run at WAVE 2 (seed 30201 /
  9876) and playframe B at frame 50 (~wave 1, reseed 71201); the four rebuilt
  ships first spawn at waves 8/13/15/17 - absent from every pinned window
  (E69 I516/I517 precedent: zero re-pins when those GLBs landed). GLB byte
  changes add zero draw calls/tris until a ship spawns.
- Vendor r187: unchanged (no vendor work in E72).
- Re-pin rule: only on a measured drift, with measurement.

## 5. dist + asset policy (PRE-REGISTERED)

- Open: 5,255,796 B / 184; ceiling 6,100,000 B; headroom 844,204 B.
- Expected: four GLB replacements, tri growth ~+20-60% per ship -> worst-case
  delta ~+450 KB -> worst-case dist ~5,705,000 B (>= 395,000 B under the
  ceiling). No renegotiation anticipated.
- Tripwires (pre-registered, in order): any single GLB > 2x current size ->
  decimate before swap (C1); dist after a swap > 5,750,000 B -> cut ladder
  for the next ship (C1/C2) before it lands; G72.0 headroom < 102,400 B ->
  cut ladder per the E70 rule.
- CLOSE FLOOR E72 re-derived WITH MEASUREMENT at G72.0.

## 6. Cut ladder (in order)

C1 decimate the offending ship (ring-count / inset reduction) until it lands
<= 2x current size. C2 reduce panel detail (drop inset bands, keep the
signature cues - P2: form before detail). C3 lower tri aims to the current
ship's count while keeping the silhouette (the silhouette IS the fix;
detail is the garnish). C4 (last resort, requires re-scope) split the ship
into fewer nodes by merging secondary parts into the hull node.

## 7. Deferrals (NOT in E72)

P2 legacy-4 enemy art pass (stinger/drone/flyer/warden - stinger front-96
dot is a scale/readability issue) / player ship + cockpit art improvements
(broadly user-asked; separate episode) / PWA installable + mobile landscape
D-pad + menu reorg (standing queue; Pages deploy stays blocked - option C
stable) / campaign level 5 / support-buff enemy. E72 touches ONLY the four
enemy GLB files + docs + bookkeeping.

## 8. Risks

K1 node-name drift -> slot-binding regression (glow/nacelle/pod) -> exact
names in the build scripts + ST-503 headless binding verify. K2 RAD gate
failure -> build gate exits 1 pre-export; tune stations. K3 tri blowout ->
per-node aim/cap gates + decimate ladder (sec.6). K4 inset z-fighting /
see-through (I501 lesson) -> inset depth >= 0.02 u, non-coplanar recess
walls, 3/4 audit view. K5 dist growth -> tripwires (sec.5). K6 pinned drift
-> G72.0 harness re-runs, re-pin only on measured drift. K7 rendered-luma
ladder shift -> grayscale 0.22..0.96 clamped bakes, CONFIG palettes +
renderLumaGain frozen.

## 9. Verification bar (per iteration)

Docs-only (I532): npm test 1,187/1,187 + build 0 + dist byte-identical
5,255,796 B/184 + vendor diff empty + BOM delta 0 + hygiene. Per-ship
(I533-I536): ALL_GATES_PASS + audit re-render viewed + sil96 gate + swap +
dist WITH MEASUREMENT + quality bar 6/6. Integration (I537): headless
binding/glow/pool-bounds verify + fleet sil96 re-audit. G72.0 (I538): 5
fresh harness re-runs ALL EXPECTED EXACT + CLOSE FLOOR WITH MEASUREMENT +
bookkeeping.

## 10. Changed files + next

I532 (this): + design/e72-enemy-artpass-research.md (NEW, 16,683 B, LF
no-BOM pure ASCII), + production/scope-check-E72.md (this file, LF no-BOM),
~ production/epics.md (E72 block appended at EOF, no trailing NL),
~ production/stories.md (ST-498..ST-504 map lines), ~
production/iterations.md (I532 section), ~ production/timeline.md (I532
line), ~ CHANGELOG.md (I532 line), ~ production/session-state/active.md
(I532 note), + .evidence/I532/ (audit532.py + audit532.out + key PNGs
downscaled to 480x270, force-added). Zero src, zero asset changes yet.

Next: I533 = ST-499 (PHANTOM v2 remaster - .evidence/I533/build_phantom_v2.py
from the build_e69b.py pattern; temp GLB; audit + sil96 gate; swap;
measurement).
