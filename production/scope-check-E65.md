# Void Runner - Scope Check: E65 (WebGPU / Vendor r171+ feasibility) - I492

## Summary
E65 is a DECISION ARTIFACT epic: evaluate whether the vendored three r160 +
WebGL2 stack should move toward r171+ (WebGPU). I492 performs the
research-first open of E65: ST-459 produces
docs/architecture/webgpu-feasibility-E65.md (the concrete r171+
reproduction path + reach tradeoff + r160->r187 migration cost + decision
matrix) and this scope check. NO switch happens in I492: zero src, asset,
test, or vendor changes; the renderer stays WebGL2; the frozen identity
(0.6/0.35/0.72 bloom + I334 grade) is untouched.
VERDICT (docs): technically FEASIBLE at r187 (bloom() TSL node +
RenderPipeline + custom TSL grade all exist and are documented); NOT worth
it yet - RECOMMENDATION KEEP WebGL2 (Option A); the actual switch stays
GATED on an explicit user decision (F3) as a SEPARATE follow-up epic.

## Measured state (I492, tree-verified)
- Assets: 28 GLBs / 1,267,388 B / 34,938 tris (ship v5 17,143 t; hunter
  2,256 / gunship 2,268; sentry 1,096 / wasp 792; + 22 more).
- dist 3,173,343 B / 166 files (ceiling 3,250,000).
- Vendor: three r160, sha256 first-16 76DEA8151BC9352A.
- Renderer: WebGL2 (src/main.js:88); frozen FX stack bloom.js:3-6 /
  gradePass.js:41 / starfield.js:202 / asteroidRenderer.js:52 /
  bossMesh.js:257 (line refs re-verified I492; I431's :139/:180 stale).
- F1 UNMET (34,938 tris static; dense one-off 44,740 measured I472) /
  F2 UNMET as a state but the reproduction path is now CONCRETE / F3 OPEN
  (user decision).
- Removed-API scan ([TREE]): no r186/r187-removed three.js API is used in
  src/ (0 uses; 1 comment mention at src/core/floorGrid.js:13).

## E65 scope (I492)
In: ST-459 (this iteration) - research + feasibility doc + scope check +
epic/stories/STATUS update. Out: ANY vendor change, ANY src change, the
switch itself (a separate follow-up epic, GATED on user decision + fresh
frozen-sha vendor ADR + CG A/B gate).

## DECISION MATRIX (the user's choice, on the table per F3)
Option A - KEEP r160 + WebGL2 (status quo; RECOMMENDED).
Option B - Vendor upgrade r160 -> r187, KEEP WebGL2Renderer (fresh
frozen-sha ADR + CG A/B re-verify of the frozen FX on the new vendor).
Option C - Full WebGPU switch r171+ (everything in B + TSL re-author of
starfield / 2 rims / FX chain + CG A/B gate on the reproduced identity).
Full costs, benefits, and the reach tradeoff:
docs/architecture/webgpu-feasibility-E65.md (decision matrix section).
GATING for B or C: explicit user decision (F3) + fresh frozen-sha vendor
ADR + CG A/B gate BEFORE any look ships.

## Cut option
None to cut in I492 (docs-only). For any follow-up switch epic: the
natural cut is Option C -> Option B (upgrade the vendor WITHOUT WebGPU),
which keeps the frozen FX stack (all WebGL2-side) and drops the TSL
re-author; reach is unchanged either way (auto WebGL2 fallback).

## Deferrals
- The actual vendor upgrade / WebGPU switch (separate epic, GATED).
- The CG A/B reproduction gate (precondition of the switch epic).
- WebGPU-exclusive feature work (SSGI / SSS / compute / 3DGS) - not
  requested.

## Recommendation
Option A now. Feasibility is documented so the decision is informed; the
switch stays a separate, gated epic. Revisit triggers: a measured WebGL2
perf ceiling on real hardware; a WebGPU-exclusive feature request; a
vendor-level need (bug / security) - at which point Option B is the
lower-risk first step.

## Risks
R1 Research staleness ([WEB] findings are r187 point-in-time; three.js
cadence 7-11 weeks) - re-verify at decision time, again at switch time.
R2 Frozen-identity corruption by a partial / gate-less switch attempt -
the CG A/B gate is a hard precondition, not a QA afterthought.
R3 "Feasible" misread as "should switch" - the recommendation section
carries the cost/benefit verdict, separate from the feasibility verdict.
R4 Strategic drift on a frozen r160 (maintenance-only WebGL renderer) -
acceptable while shipping; upgrade cost grows slowly with each revision.
R5 A vendor-only upgrade (Option B) is NOT zero-risk: pass
implementations drift between revisions, so the frozen 0.72 bloom + I334
grade must be CG A/B re-verified on r187 before any look ships.

## Changed files
- docs/architecture/webgpu-feasibility-E65.md (NEW, LF no-BOM).
- production/scope-check-E65.md (NEW, this file, CRLF BOM).
- production/stories.md (ST-459 + STATUS line), production/epics.md (E65
  block: Status + Stories + notes), production/iterations.md +
  timeline.md + session-state/active.md (I492 entries), CHANGELOG.md
  (E65 open entry).
- Zero src / asset / test / vendor changes.

## Verification
- npm test 1141/1141 (expected - zero src).
- npm run build 0; dist 3,173,343 B / 166 BYTE-IDENTICAL (no src).
- Vendor sha256-16 76DEA8151BC9352A PIN_OK (unchanged).
- BOM audit 5/5/3/3/7/0.
- causal483 / playframe483: cited UNCHANGED (zero src, no sim change).

## Next owner
USER DECISION (F3): A (recommended) / B / C. On B or C: open a follow-up
epic (frozen-sha vendor ADR + CG A/B gate preconditions). E65 stays IN
PROGRESS (decision artifact) until the decision lands.