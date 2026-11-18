# Scope Check - E68 Enemy Fleet Remaster + Visual Language Repair (I506)

Produced under cgs-scope-check (producer). Objective: the user rejected the E57/E63 enemy
art verbatim - "the new enemies type donot look like good assets you can model other
spacesheeps" - and authorized "use the polygons and gpu resource as much as needed".
E67 CLOSED 7/7 (I505). Standing queue: (1) enemy remaster = THIS epic; (2) more enemies +
campaign extension (LATER); (3) PWA installable + mobile landscape D-pad + menu reorg
(research lands in E68 doc section 6; implementation LATER); (4) WebGPU (E66 closed the
switch - see section 2); (5) model-quality research (E68 doc).

## 1. Measured current state (tree-verified, I506)

- Enemy fleet geometry: 8 non-boss GLB = 7,144 t / 547,012 B; + boss 398 t / 31,876 B =
  7,542 t / 578,888 B (audit_glb.cjs). MIXED GENERATIONS: 4 remaster-tier 792-2,268 t vs
  4 legacy 40-180 t (research doc 2.1).
- In-game rendered luma (luma_audit506): ONE TRUE E57 rule-1 collision (stinger x boss:
  dluma 2.7, dhue 21) + 3-way dark-end tie {stinger 65.7, flyer 65.8, boss 68.4} +
  gunship neutral (no hue) + hunter smallest footprint .053 (research doc 2.2).
- 63 Blender clay/tint/sil PNGs VIEWED; per-asset defect notes in research doc 2.3
  (glow-sphere disease on 3 of 4 remaster assets; zero surface detail on all 9).
- Assets total: 28 GLB / 1,452,292 B / 42,331 t (ship v6 567.8 KB / 25,563 t dominant).
- dist 3,747,372 B / 175; ceiling 3,850,000 (headroom 102,628 B = close floor).
- Tests 1145; pins: causal483 CAUSAL456 PASS; playframe A 22/25,781 + 11/180, B
  52/55,400 PLAYFRAME456 PASS; causal495 3-arm; pwa491 11/11; vendor 4-pin EXACT.
- Blender 5.2.3 LTS headless proven (E61/E63/E67 builds); .evidence/I506/audit_clay.py v2
  is the reusable per-asset clay/tint/sil CG-gate pattern for ST-474/475.

## 2. Scope fit

FIT - enemy-first, 8 stories. The user's rejection targets SHAPE (not palette alone) and
asset quality (not bytes): "model other spacesheeps". Both Blender remaster waves
(legacy-4 net-new + remaster-4 shape fixes) + the luma re-ladder + the fleet-coherence
gate answer it directly. Zero core-logic changes: enemy geometry + palette are
render-only, so causal stays EXACT by construction and playframe contribution is
MEASURED at ST-476 (enemies do not draw in the pin windows; expected 0). WebGPU NOT
NEEDED: E66 already delivered the dual-arm (?fx=webgpu); the classic WebGL2 default
handles ~52k total scene tris trivially - no vendor change. Documented here to close the
user's "switch to webgpu" suggestion.

## 3. Stories (ST-472..ST-479; acceptance in production/stories.md)

- ST-472 (I506): E68 OPEN - full-fleet audit (GLB tris/bytes + in-game rendered luma +
  9x7 Blender clay/tint/sil viewed) + research doc + this scope check + bookkeeping.
  DOCS-only, zero src. DONE this iteration.
- ST-473: design/enemy-remaster-spec-E68.md - FROZEN per-role specs: shape languages
  (research doc 4) + per-node AIM/CAP tri tables + final palettes / luma re-ladder
  (research doc 5) + GLB contract (E57 rule 8 with per-asset tri re-pins) + CG gate
  checklist (clay 7-view + tint A/B + 96px silhouette front/back + low-DPR accent).
  DOCS-only.
- ST-474: BLENDER - legacy-4 remaster (stinger / drone / warden / flyer -> real
  spaceships per the shape targets). Deterministic .evidence build scripts (audit_clay.py
  pattern for the CG gate), clay/tint/sil A/B vs research doc 2.3 defect notes, 96px
  silhouette check, assets/ swap.
- ST-475: BLENDER - remaster-4 v2 (hunter / gunship / sentry / wasp shape fixes: spine
  not dome, struts not notch, ring not lollipop, double-blade not paper; value-band
  COLOR_0 bakes per F7). Same gate chain, assets/ swap.
- ST-476: integration + re-pins WITH MEASUREMENT: BUDGETS x8 (assetPerf test caps),
  assetPerf measured values, ceiling renegotiation if fired (section 5), playframe A/B
  measured (expected 0 contribution; re-pin only WITH measurement).
- ST-477: in-game rendered-luma re-ladder audit (I381/I383 method) + CONFIG palette /
  renderLumaGain updates + tests. Closes research doc section 5 (the gunship-vs-boss
  borderline case is settled in-game, not on paper).
- ST-478: fleet-coherence gate - one-frame all-9 ladder check + 96px in-game silhouettes
  (front AND back, E57 rule 2) + low-DPR accent survival + reduced-motion telegraph
  poses + hero screenshots.
- ST-479: G68.0 close gate - causal495 3-arm + causal483 + playframe483/491 + pwa491 +
  quality bar + AGENTS.md refresh + E68 CLOSED 8/8.

## 4. Re-pin table (WITH MEASUREMENT at ST-476 unless noted)

- Tri targets (frozen in ST-473): legacy-4 aim 1,400 / cap 1,800 t each (total 5,600 /
  7,200); remaster-4 aim 2,800 / cap 3,200 t each (total 11,200 / 12,800). Fleet aim
  16,800 / cap 20,000 t (vs current 7,144: +9,656 t aim).
- Bytes @ ~64-76 B/t (E63 evidence model): fleet aim ~1.12 MB vs 547 KB -> +629 KB aim /
  +973 KB cap.
- assetPerf test caps -> new (measured at ST-476): totalFilesKB 1,440 -> ~2,040 -> cap
  2,100; totalGeoKB 1,400 -> ~2,000 -> cap 2,050; totalTris 45,000 -> ~52,000 -> cap
  54,000.
- MAX_FILE_BYTES 1,048,576 UNCHANGED (largest new enemy ~243 KB).
- playframe A/B: enemies do not draw in the pin windows (hv=0 / gv=0 at reseed 71201 f50
  / MENU A window) -> expected 0 contribution; MEASURE anyway, re-pin only WITH
  measurement.
- causal483 / causal495: EXACT (enemy geometry + palette are render-only; no core path
  touched).

## 5. dist policy (PRE-REGISTERED)

dist 3,747,372 + ~629 KB aim = ~4.38 MB > 3,850,000 ceiling -> PRE-REGISTERED ceiling
renegotiation WITH MEASUREMENT at ST-476: expected new ceiling ~4,400,000 B; close floor
re-derives from measured headroom at G68.0 (I498 / I501 precedent). The user authorized
"polygons and gpu resource as much as needed" - only dist bytes constrain, not GPU.
FALLBACK before renegotiation: the cut ladder (section 6) - last resort only.
RESOLVED I510/ST-476 WITH MEASUREMENT: actual chain 3,747,372 (I507) -> 4,190,132 (I508, +442,760) -> 4,623,044 B / 175 (I509, +432,912) = 773,044 B over the 3,850,000 ceiling and 223,044 B over the expected ~4,400,000 B (the expectation used the pre-legacy-4 baseline + aim-weighted delta; the remaster landed cap-side of aim/cap: fleet 19,490 t vs aim 16,690 / cap 19,850). NEW CEILING 4,700,000 B (headroom 76,956 B). Cut ladder NOT invoked. Close floor re-derives WITH MEASUREMENT at G68.0 (ST-479) from the 76,956 B headroom. CLOSE FLOOR I513/ST-479 WITH MEASUREMENT: measured dist 4,623,381 B / 175 (I511) -> headroom 76,619 B -> E68 close floor 76,619 B; ceiling stays 4,700,000 B; cut ladder NOT invoked.

## 6. Cut ladder (last resort, in order)

- C1: remaster-4 cap 3,200 -> 2,400 t each (~-300 KB fleet).
- C2: legacy-4 cap 1,800 -> 1,200 t each (~-100 KB).
- C3: drop value-band bakes on remaster-4 (~-150 KB) - NOT recommended, violates F7.
- C4: skip warden remaster (keep legacy 180 t, ~-110 KB) - NOT recommended (worst read).

## 7. Deferrals (NOT in E68)

- NEW enemy TYPES (additional roles) + CAMPAIGN extension (levels 4+): separate later
  epic - the user's "more enemies" request is explicitly queued AFTER the remaster.
- Boss art: UNCHANGED (I503 v2 ACCEPTED; out of scope by design).
- Enemy rim/outline pass (WebGPU follow-up quality step): deferred; classic bloom
  0.6/0.35/0.72 + I334 grade stay FROZEN.
- PWA installable + mobile landscape D-pad + menu reorg (research doc 6): LATER epic.
- Rocks: cratered/comet bumps only if GPU/compute-allowable (user constraint) - separate
  pass, not E68.

## 8. Risks

- R1 ceiling bust -> PRE-REGISTERED renegotiation WITH MEASUREMENT (section 5); cut
  ladder as fallback.
- R2 playframe drift on assets/ swap -> expected 0 (enemies absent from pin windows);
  MEASURE at ST-476; re-pin only WITH measurement (I503 precedent).
- R3 palette collision recurrence after remaster -> ST-477 fresh in-game audit is the
  closing gate; the gunship-vs-boss borderline case is settled in-game, not on paper.
- R4 GLB contract drift (naming / bake / scale) -> CG gate per asset in ST-474/475
  (clay 7-view + tint A/B + 96px sil + E57 rule 8 contract check).
- R5 user "real spaceship" expectation vs bytes -> only dist bytes constrain; GPU
  handles ~52k tris trivially (section 2). The bar is the shape-language spec (ST-473),
  not tri count.

## 9. Verification bar (per iteration)

1. npm test green. 2. npm run build 0. 3. Manual smoke where rendering changed (console
   clean, no NaN). 4. dist <= ceiling (pre-registered renegotiation at ST-476). 5. Vendor
   4-pin EXACT. 6. causal483 'CAUSAL456 PASS' + playframe483 'PLAYFRAME456 PASS' EXACT
   (re-pin WITH MEASUREMENT only if a shipped mesh/geometry in the pin windows changes -
   expected not). Plus per Blender story: CG gate chain + 96px silhouette + assets/ swap
   byte/tri measurement.

## 10. Changed files + next

- NEW design/enemy-remaster-research-E68.md; NEW production/scope-check-E68.md (this
  file); bookkeeping: epics.md (E68 section), stories.md (ST-472..479 + status),
  iterations.md (I506), timeline.md (I506), CHANGELOG.md (I506 line),
  session-state/active.md. Zero src.
- Next: I507 = ST-473 (frozen enemy remaster spec, docs-only) -> I508+ = ST-474 (Blender
  legacy-4 remaster, ENEMY-FIRST).