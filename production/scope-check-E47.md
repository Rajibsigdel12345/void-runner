# Scope Check - E47 Overdrive Pickup Emissive Readability Lift (ST-365..368)

Source of truth for E47. Opened at I396 (cgs-scope-check + cgs-create-stories; docs-only).

## Summary
E46 (I395) proved the one remaining own-side minor - overdrive pickup dimness (fx-off floor acc90
36.70, weakest of the 7; +4.5 over local bg p90) - is NOT in the GLB COLOR_0 bake (overdrive bake
p50 0.987 ~= bomb 0.993 and brighter than spread 0.825; a re-bake is a no-op and would collide with
the frozen PU_FACET bake-percentile pin). The real lever is in-code: `overdrive.emissive 0x6d0f52`
in src/render/powerupMesh.js TYPES - a free un-pinned knob (not in config.js, not in any test; the
shared emissiveIntensity 0.9 / roughness 0.35 / metalness 0.15 are identical across all 7). E47 lifts
that one hex toward the mid-family emissive-luma band, A/B-verifies with the I395 ownside probe, and
keeps every other pin frozen. One-line change; 0 B asset delta; ~0 B dist delta (same-length hex
substitution); +0 draw calls; +0 tris; zero sim.

## Scope Fit
- Evidence (I395 fresh BEFORE, .evidence/I395/ownside_audit_i387.json): fx-off floor acc90 = rapid
  105.07 / spread 68.32 / shield 164.80 / bomb 59.21 / magnet 139.90 / overdrive 36.70 / slowmo
  165.52. Overdrive is the single outlier; the other 6 are in-ladder or dim-but-hue-distinct
  (accepted at I393/I395).
- Family emissive luma (computed I396 from powerupMesh.js:35-41, luma = 0.2126R+0.7152G+0.0722B):
  rapid 90.3 / spread 78.8 / slowmo 78.7 / shield 75.8 / magnet 73.0 / bomb 40.6 / overdrive 39.8.
  Overdrive + bomb are the bottom pair; bomb reads 59.21 (large cube facets), overdrive reads 36.70
  (thin hex prism 0.42 r x 0.3 h) - so overdrive's gap = lowest family emissive luma + smallest
  projected facet area. The emissive is the only free lever; a geometry/size change is a
  silhouette/extent change (EMBLEM_TARGETS extent pins + silhouette) and is out of scope.
- Fit: one line in one render file; bounded A/B via the existing probe tooling; zero sim; zero
  asset; fits the current polish stage and the anti-over-engineer rule (the one remaining measured
  own-side minor; a free knob; pre-registered cut gates).

## Cut Option
- Cut gate #1 (ST-366, I397): if the grounded direction (cgs-dev-story + bounded YouTube grounding)
  shows the lift is low-ROI or hue-risky (any hue-preserving candidate drifts overdrive's rendered
  hue from the puab ~322 deg band, or blows out at fx-high), close E47 as no-change at I397
  (docs-only).
- Cut gate #2 (ST-367, I398): if the A/B misses the acceptance bands (overdrive fx-off floor acc90
  not in [55,85]) or the other 6 emblems drift beyond +/-8 acc90 (documented noise floor) or any
  frozen pin moves, revert the line and close E47 as no-change (honest: overdrive stays
  accepted-minor).
- Anti-over-engineer note: a clean CUT is an acceptable, expected outcome of this epic - it exists
  to test the one free lever with evidence, not to force a change.

## Deferral
- Bomb's low emissive luma (40.6, reads 59.21) - accepted (cube facets read; I393/I395).
- Overdrive geometry/size increase (thin hex prism) - silhouette/extent change = EMBLEM_TARGETS +
  PU_FACET + silhouette re-pin cascade; not this epic.
- Tint lever (overdrive 0xff4dd8 -> higher-green magenta) - coupled with the config.js:590 pickup
  sparkle + the puab tint pin + colorblind distinctness; strictly riskier; only if the emissive lift
  CUTs and a future epic re-justifies it with fresh evidence.
- All-7 emblem material re-tune - E47 is overdrive-only.
- Animated emissive pulse / emblem FX - the scale pulse already exists (powerupMesh.js).
- Normal maps / PBR upgrade - ruled out by the art-bible (flat faceted, no normal maps).

## Recommendation
PROCEED (bounded). One-line emissive lift of `overdrive` in powerupMesh.js TYPES, target chosen at
ST-366 from a candidate ladder (keep the hue family R > B > low-G; lift value to the mid-family
luma ~65-80). Acceptance (measured at ST-367 via the .evidence/I395/ownside_probe.mjs re-run, fresh
nocache tag, TWO runs - both must pass):
- A1 overdrive fx-off floor acc90 in [55, 85] (baseline 36.70; the family dim-accepted band is
  bomb 59.21 / spread 68.32).
- A2 overdrive fx-off sky acc90 in [55, 120] (baseline 67.37 - the floor is the binding tier).
- A3 the other 6 emblems within +/-8 acc90 of the I395 baselines on both backdrops/tiers (noise
  floor: the documented magnet-sky 7-pt re-measure drift).
- A4 frozen pins held: puab 7-hue tint pins (overdrive tint 0xff4dd8 unchanged; hue ~322 deg),
  PU_FACET bake pins (assets untouched), draw calls 21/366 (fx-off) + 50/1222 (fx-high), FLOOR-50
  230/72/158, floor p50 32.2 / p90 72.07, skybox 70.14, rocks 112.43 / 54.26 / 52.76, ring p90
  49.04 / 48.32 / 38.54 / 24.41 + rim 52.76, enemy hierarchy (drone 200.98 / stinger_charge 254 /
  flyer 197.74 / warden_exposed 147.01 / mine 127.0 / boss 182.49), bullets (player 219.99 / enemy
  152.18), cockpit cyan 0x59d8ff @ 1.4, p1 demo pin EXACT.
- A5 no NaN, console 0/0, 30 closeups VIEWED (overdrive must NOT blow out white at fx-high: no
  RGB channel > 245 at emblem-body p90).
- A6 929/929 tests (no test changes expected - the emissive is un-pinned), build 0, dist 131 files
  / ~1,918,997 B (+/-0 B expected), vendor sha 76DEA8151BC9352A, headroom >= 102400 B.

## Risks
- R-E47-1 the lift collides with the rock ember band (54.26-112.43) or erases family separation ->
  the A1/A2 bands cap the target; A3 guards the other 6; cut to no-change on collision.
- R-E47-2 overdrive rendered hue drift (puab ~322 deg) -> the emissive stays the same hue family
  (R > B > low-G, only the value rises); the gate re-verifies the hue; the tint is untouched.
- R-E47-3 fx-high blowout (overdrive fx-high floor baseline 93.92) -> the A5 white-channel check on
  closeups; step the candidate ladder down one rung if it blows.
- R-E47-4 dist byte drift -> same-length 6-digit hex substitution; the gate verifies dist file
  count + total bytes.
- R-E47-5 over-scope to bomb or an all-7 re-tune -> E47 is overdrive-only; bomb and the rest stay
  accepted as-is.
- R-E47-6 probe re-measure noise masks a real miss -> the A/B probe runs twice; both runs must be
  in-band (I395's magnet-sky 7-pt drift is the documented noise floor).

## Changed files or proposed files
Changed (I396, docs-only): production/scope-check-E47.md (NEW), production/epics.md (E47 section),
production/stories.md (ST-365..368), CHANGELOG.md (I396 line), production/iterations.md (I396 entry),
production/session-state/active.md (notes line).
Proposed (later stories): ST-366 appends "## ST-366 Grounded Direction (I397)" to this file
(candidate ladder + final target). ST-367 edits src/render/powerupMesh.js ONLY (one line: the
overdrive emissive hex). ST-368 docs-only.

## Verification evidence
I396 (this iteration): docs-only. npm test 929/929 + npm run build exit 0; dist 131 files /
1,918,997 B byte-identical; vendor three.module.js sha256[:16] = 76dea8151bc9352a; vendor tree
13/13 byte-identical source->dist. Carried evidence: .evidence/I395/ownside_audit_i387.json (the
BEFORE baseline, 877,160 B, 30 closeups) + .evidence/I395/measure_emblems.mjs bake measurement.

## Next owner or decision
ST-366 (I397) = grounded direction (cgs-dev-story): bounded YouTube grounding (max 1 search, 2-3
queries, <= 3 new burned ids) on pickup/upgrade readability via emissive/glow in space-arcade and
roguelite games + finalize the candidate emissive ladder + confirm the A1-A6 bands. Then ST-367
implement + A/B (I398), ST-368 G47.0 gate + close (I399).

## Epic structure
- Stories: ST-365 scope-check + open (I396) / ST-366 grounded direction (I397, cut gate #1) /
  ST-367 one-line emissive lift + A/B (I398, cut gate #2) / ST-368 G47.0 gate + close (I399).
- Budget: I396-I399 (4 iterations); 0 B asset delta (emblem family 37,912 B unchanged, cap <=
  45,912 B); ~0 B dist delta; +0 draw calls; +0 tris; zero sim.
- Gate G47.0 (at ST-368): R1 p1 EXACT causal (zero sim src) / R2 rockab EXACT 2.2/1.3/0.7 fresh /
  R3 own-side probe fresh (A1-A6, two-run stability) / R4 PWA 11/11 fresh / R5 vendor sha
  76DEA8151BC9352A + dist 131 / headroom >= 102400 B + 929/929 + build 0 + hygiene (chrome 0,
  ports 5173/4173/5199 free, node 13).
- Blender: NOT used in E47 (proven no-op by the I395 bake measurement; the lever is in-code).
- production/scope-check-E47.md = source of truth.

## ST-366 Grounded Direction (I397) - candidate ladder + bands confirmed (cut gate #1: NOT cut)

Verdict: PROCEED to ST-367. Not cut: the lift remains a bounded one-line free-knob change, hue
risk is low (same hue family R > B > low-G, tint 0xff4dd8 untouched), and no counter-evidence
surfaced.

### Grounding (bounded YouTube: 1 search / 3 queries / 8 raw; 0 extra transcript pulls)
Queries: "Faster Than Light item icons UI design analysis" / "game pickup item readability glow
emissive art direction" / "roguelite game UI item icon contrast readability". Results were
GENERIC UI/UX (no game-specific pickup-glow content): EcbgbKtOELY (UI/UX concepts; color
theory + dark mode moments, no extracted passage), psyw2_j_5jk (2026 UI trends), LAGn9pITWjw
(7 UI tips), Apple icon composer, career/trend videos. Two usable supporting highlights:
(a) LAGn9pITWjw 10:43 - consistency/repetition as a core design principle (the lift keeps
overdrive INSIDE the family luma distribution, not a unique value); (b) psyw2_j_5jk 4:05 -
readability rides on RELATIVE contrast inside a coherent frame ("accessibility issues... non
issues if the entire rest of the interface has proper contrast, proper hierarchy") - a
single in-family lift is legitimate. UNVERIFIED-ASSUMPTION LABEL: no game-specific external
evidence for this micro-decision; the local I395 probe measurement is the primary evidence
base.

### Lever (re-verified in code, I397)
powerupMesh.js:50-60 creates a PER-TYPE MeshStandardMaterial (mats[t]) with {color:
def.color, emissive: def.emissive, emissiveIntensity 0.9, roughness 0.35, metalness 0.15,
vertexColors true}; the GLB COLOR_0 facet bake multiplies on top (I288/ST-272). Line 40:
overdrive { color 0xff4dd8, emissive 0x6d0f52, CylinderGeometry(0.42, 0.42, 0.3, 6) }. The
emissive hex is per-type and un-pinned (not in config.js, not in any test). ONE line changes.

### Family emissive luma (I396 audit)
rapid 0x7a5a00 90.3 / spread 0x7a4a00 78.8 / slowmo 0x1a5a7a 78.7 / shield 0x0e5a75 75.8 /
magnet 0x0f5c37 73.0 / bomb 0x751414 40.6 / overdrive 0x6d0f52 39.8.

### Candidate ladder (ST-367 A/B; start at C2)
- C1 0x802468 (R128 G36 B104, luma 60.4) - step-down
- C2 0x8a2e74 (R138 G46 B116, luma 70.6) - PRIMARY (mid)
- C3 0x963880 (R150 G56 B128, luma 81.2) - step-up (still below family max 90.3)
Selection rule (pre-registered): apply C2; run the A/B probe twice; if A1 floor acc90 < 55 ->
C3; if A1 > 85 or A2 sky > 120 or A5 fx-high white blowout -> C1; if C3 still misses A1 ->
CUT to no-change (overdrive stays accepted-minor).
Model caveat (UNVERIFIED): rough linear fit acc90 ~= 0.5*emissiveLuma + 17 (fit on the
overdrive baseline only; bomb shows a +22 pt geometry bonus at equal luma) suggests A1 may
need luma ~86 (C3 territory); the empirical ladder is the decider, not the model.

### Bands A1-A6: CONFIRMED unchanged (as pre-registered at I396). Cut gate #1: NOT triggered.

## ST-367 One-line emissive lift + A/B (I398) - LADDER MEASURED, CUT at cut gate #2 (no-change)

Verdict: CUT (no-change). The pre-registered ladder was measured in full; no rung reaches
A1, so overdrive stays at baseline 0x6d0f52 and remains an accepted-minor.

### A/B evidence (headless probe .evidence/I398/ownside_probe.mjs, seed 71382, nocache
i398v1, both backdrops, fx-off O + fx-high H; C2 run x2 for stability, C3 run x1)
Ladder (fx-off floor acc90, A1 band [55,85]; I395 baseline = 36.70):
- C2 0x8a2e74 (luma 70.6): 39.83 (run1) / 39.83 (run2 - identical; O tier deterministic
  within-session) -> MISS (band floor 55)
- C3 0x963880 (luma 81.2, top rung, below family max 90.3): 39.66 -> MISS
Empirical slope ~= 0.10 acc90 per emissive-luma unit (+30.8 luma -> +3.13 floor acc90),
~5x flatter than the I397 UNVERIFIED model (0.5/luma) - the floor crop p90 is
coverage/geometry-dominated for the thin hex disc, not emissive-dominated (same pattern
as the I395 bomb +22 pt facet bonus). The pre-registered selection rule was followed rung
by rung: C2 miss-low -> C3 -> C3 miss -> CUT.

### Other acceptance bands at C2 (the primary candidate; both runs)
- A2 sky acc90 67.71 (band [55,120]) PASS
- A3 other 6 emblems vs I395 baseline: run2 all within +/-8; run1 only bomb-floor +8.76
  (0.76 over the noise floor - cross-SESSION drift: the within-session run1->run2 delta on
  that same cell is -0.68, and the edit cannot touch the other 6 per-type materials)
- A4: probe state=MENU, console 0/0 on all 4 pages, fx tiers + bloom flags correct; the
  frozen pins (puab tint 0xff4dd8, PU_FACET, 21/366 + 50/1222 playframe, p1 EXACT) are
  verified at the I399 G47.0 gate R3/R1 - the working tree is byte-identical to bc591d2
  after the revert (git status clean), so no pin can have moved
- A5: no fx-high white blowout - overdrive H-floor accent rgb90 max channel 47.51 (C2) /
  65.85 (C3 H-sky, the max over all C3 cells) << 245; overdrive closeups VIEWED at C2
  (sky+floor: clean magenta disc + O badge ring, no blowout) and at C3 (floor: clean)
- A6: 929/929 + build 0 + dist 131/1,918,997 B byte-identical + vendor sha 76DEA8151BC9352A

### Decision (cut gate #2: CUT)
The one-line emissive lift cannot move the overdrive floor acc90 into [55,85] at any rung
below the family max - the metric is geometry/coverage-dominated for this emblem shape,
and the only remaining in-code levers (tint 0xff4dd8 = coupled config.js:590 sparkle +
7-hue pin cascade; geometry = extent/silhouette pin cascade) are out of scope for a
one-line change. Overdrive stays an accepted-minor: hue-unmistakable magenta, reads fine
at the default fx-high (floor acc90 93.92 baseline / 100.14-100.41 C2 runs, sepA +64.5+).
No-change is the pre-registered, expected outcome (anti-over-engineer). E47 closes at
I399 (G47.0).

## Final (I399, G47.0 CUT-branch close)
DECISION: E47 CLOSED at I399 via the pre-registered CUT branch (cut gate #2 fired at ST-367/I398: the one-line emissive lift is a no-go - the full ladder measured, C2 x2 39.83/39.83, C3 39.66, A1 [55,85] missed at every rung, empirical slope ~0.10 acc90 per luma = the floor crop p90 is coverage/geometry-dominated for the thin hex disc). Overdrive = accepted-minor, permanently closed (hue-unmistakable magenta; reads fine at the default fx-high). The remaining in-code levers (tint 0xff4dd8 = coupled config.js:590 sparkle + 7-hue pin cascade; geometry = extent/silhouette pin cascade) are out of scope for a one-line change; any future overdrive work = a new epic.

Re-confirmed unchanged (docs-only close per the E46 precedent):
- R1 p1 EXACT causal fresh: git log bc591d2..HEAD -- src/ EMPTY (I397/I398 docs-only net).
- R3 playframe probe fresh (.evidence/I399/playframe_probe.mjs = I375 probe verbatim, OUT redirected): Part A overhead fx-off 21/366 EXACT (ring p90 49.04/48.32/38.54/24.41 <50 FLOOR-50 held; rim 52.76; spot t0.95 112.43 / t0.985 54.26; bands b4-8 42.04/38.54/30.55/25.27/21.84); Part B PLAYING fx-high 50/1222 EXACT (floor p50 32.2 EXACT / p90 72.22 vs pin 72.07 = ~0.15 documented render noise, consistent with I391/I394; sky 70.14; hrow 57; camFinite; 5 rocks at t=2.5 s).
- R5 fresh: 929/929 + build 0 + dist 131/1,918,997 B (delta 0) + vendor sha 76DEA8151BC9352A + hygiene (dev server killed + 5173 free + chrome 0 + node 13).
- R2 rockab + R4 PWA re-confirmed unchanged (cited from the I394 G45.0 fresh run; zero src/asset changes since - causal).

Sweep addendum (I399 full regression sweep, .evidence/I399/full_sweep.mjs): the s2 "drift" 35/380 vs 50/1222 = a probe mis-spec in the new sweep (S2 pinned the MENU fx-high live-loop staging to the I375 Part B PLAYING staging pin; no frozen MENU fx-high pin exists - verified gates.md + iterations.md + all scope-checks). Resolved by the verbatim playframe re-run above (both frozen pins HOLD EXACT). MENU fx-high live-loop 35/380 is recorded as a new informational baseline (NOT frozen). Console 0/0 + NaN 0 across all 7 scenarios (s1 21/366 HOLD 60/60; s3 one 71.5 ms transition spike frame 4 post-Enter = the E48 target signal; s5 GAME_OVER best null->null; s6 REPLAY ST-190 best invariant HOLDS).