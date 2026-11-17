# Void Runner - WebGPU Re-eval in the E61 Post-Remaster Context (I472 / cgs-reverse-document) - ST-439

## Summary
This document re-evaluates, in the NEW post-remaster context created by the E61
asset remasters (I470 ship v5 17,143 t; I471 enemy v5 hunter 2,256 t + gunship
2,268 t), the user's standing CONDITIONAL mandate ("you can switch it to WebGPU
from webgl if you are on webgl ... if ... needed to make them possible").
F1/F2/F3 are RE-DERIVED from the post-remaster measured numbers, never
re-quoted from docs/architecture/webgpu-re-eval-E56.md. VERDICT: KEEP WebGL2.
Do NOT switch. The pre-registered trigger's ABSOLUTE clause (busy-window median
> 8 ms) fired literally (8.5 ms on SwiftShader); the decomposition shows it is
a PRE-EXISTING SwiftShader exceedance, not a remaster exceedance (the same
harness measured 9.0 ms median in pre-E61 I460 on v3-era assets, and the v4
baseline in this run sits at 8.0 ms; the remaster-attributable delta is
+0.5 ms median with 0 draw-call delta). Per the pre-registered decision matrix
(production/scope-check-E61.md): no switch inside E61 (a switch IS F2 - a
separate follow-up epic); the trigger is documented here; follow-up epic E65
is opened (NOT STARTED); tri-cut ladder rung 2 is proposed as short-term
mitigation but NOT applied (no remaster-induced regression to mitigate).
DOCS + probe evidence only - zero source, asset, or test changes; the renderer
stays WebGL2; vendor r160 sha 76DEA8151BC9352A intact. Build-on target:
docs/architecture/webgpu-re-eval-E56.md - this doc is the E61 delta, not a
duplicate.

## Post-Remaster Measured Context (I472, 2026-11-17 - evidence, not assumption)
- 26 GLBs / ~1,051 KB / 33,050 tris total (assetPerf pins: caps 1,240 KB files /
  1,120 KB geo / 36,000 tris; headroom ~89 KB / ~2,950 tris).
- ship v5 384,756 B / 17,143 t (I470); enemy_hunter v5 144,460 B / 2,256 t +
  enemy_gunship v5 171,736 B / 2,268 t (I471).
- dist 2,918,734 B / 149 files (ceiling 3,250,000; floor 102,400).
- Renderer: THREE.WebGLRenderer (WebGL2 context) @ src/main.js - unchanged;
  no WebGPURenderer anywhere in src/. Vendor three r160,
  sha256 first-16 76DEA8151BC9352A (dist/vendor/three.module.js, PIN_OK).

## FLIP CRITERIA re-derivation (criteria text verbatim from webgpu-re-eval-E56.md;
every number below is post-remaster, measured this iteration)

### F1 - Geometry driver: UNMET
Bar (verbatim): "sustained per-frame draw need > ~200k tris (~6x the current
20,000 tri cap ...) - not a one-off asset spike".
Measured: total static asset geometry is 33,050 tris across 26 GLBs. The
worst-case busy window (dense deterministic "busiest moment": all six enemy
role pools + 29 rocks + bullets + trails + boss + warden + ship, fx HIGH, real
composer frame, manual renderer.info reset for a clean single frame) renders
314 draw calls / 44,740 tris / 1,318 points / 448 lines per frame -
deterministic across two back-to-back frames
(.evidence/I472/busy472_tris.json). That is a ONE-OFF spike, which F1
explicitly excludes, and it is 4.4x under the ~200k sustained bar; even 4x the
dense window (~179k) stays under it. UNMET.

### F2 - FX equivalents: UNMET
Bar (verbatim): "the vendor is explicitly upgraded to r171+ (a separate
frozen-sha ADR) AND stable TSL-era FX equivalents reproduce the frozen
identity ... AND the FX identity is consciously re-scoped".
Measured: the vendor is still r160 (sha 76DEA8151BC9352A intact at I472); no
r171+ ADR exists; no TSL-era reproduction of the frozen 0.6/0.35/0.72 bloom +
I334 grade has been attempted, let alone CG-A/B-gated. UNMET.

### F3 - Mandate (the user's conditional "if ... needed"): NOT MET for the
remaster; literal pre-registered trigger fires on the absolute clause only
Bar (verbatim): "an explicit user decision to switch, made with the reach
tradeoff on the table". The user's mandate is CONDITIONAL - the switch is
wanted only if WebGL2 needs it "to make them possible". The ST-439 probe
answers that condition with numbers (.evidence/I472/busy472.mjs, two
FRESH-browser phases with an asset byte-swap, identical dense scene, fx HIGH,
composer frame, SwiftShader headless - SwiftShader is SLOWER than a real GPU,
so a delta that fits here bounds the real-GPU delta; median is robust to
outliers; restore verified byte-identical):
  Phase B (v4 baseline = E60-era geometry: ship 14,276 t + hunter 1,432 t +
    gunship 1,688 t): median 8.0 ms / p90 9.5 ms / mean 8.158 ms / 300 calls
  Phase A (v5 current = post-remaster: 17,143 t + 2,256 t + 2,268 t):
    median 8.5 ms / p90 10.0 ms / mean 8.606 ms / 300 calls
  deltaMed +0.5 ms; draw-call delta 0; console 0/0 in both phases.
PRE-REGISTERED TRIGGER (production/scope-check-E61.md, verbatim): "busy-window
median > 8 ms OR draw deltaMed > 4 ms vs the E60 baseline => F3's 'needed'
condition met".
Literal reading: 8.5 ms > 8 ms => TRIGGERED (absolute clause).
DECOMPOSITION: the same dense harness in PRE-E61 I460 (E59 era, v3-era
assets) measured median 9.0 ms / p90 13.2 ms / mean 9.62 ms
(.evidence/I460/busy460.json, absFrame) - the absolute clause was ALREADY
exceeded before the E61 remaster; in this run the v4 baseline itself sits at
8.0 ms. The remaster-attributable cost is the DELTA clause territory:
+0.5 ms median (<< 4 ms) and 0 draw calls. Conclusion: the E61 remaster does
NOT make a WebGPU switch "needed" - the condition in the user's mandate is
not satisfied by the remaster's own cost; the 8 ms absolute bar on the
SwiftShader harness is a pre-existing exceedance independent of E61.

## Pre-registered trigger application (decision matrix, verbatim from
production/scope-check-E61.md)
"no trigger -> KEEP WebGL2, documented, vendor untouched; trigger -> do NOT
switch inside E61 (a switch IS F2: vendor r171+ ADR + frozen 0.72 bloom +
I334 grade re-reproduction + conscious FX re-scope = separate follow-up
epic); instead document the trigger, open the follow-up epic, and propose the
tri-cut ladder (cut ladder rung 2) as short-term mitigation."
Applied: the trigger fired literally (absolute clause), therefore -
1. The trigger is DOCUMENTED (this section + .evidence/I472/busy472.json).
2. The follow-up epic E65 (WebGPU / vendor r171+ feasibility, F2 territory)
   is OPENED in production/epics.md as NOT STARTED - it is a decision
   artifact, not a commitment to switch.
3. Tri-cut ladder rung 2 is PROPOSED as short-term mitigation and NOT
   applied: there is no remaster-induced regression to mitigate
   (deltaMed +0.5 ms, draw delta 0, causal EXACT 18/18, dist within ceiling).
4. The vendor sha 76DEA8151BC9352A is intact - the R5 failure mode ("someone
   starts a vendor upgrade mid-epic") did not occur; no vendor work was
   started inside E61.

## VERDICT
KEEP WebGL2. Do NOT switch. Same verdict as ST-401 (I431) and ST-412 (I442),
re-derived (not re-quoted) from post-E61 numbers: the higher-poly remaster
shipped with zero renderer change and a bounded 0.5 ms / 0-call worst-window
delta. The literal trigger firing is recorded for the record with its
decomposition; it does not change the verdict inside E61.

## Risks
- The 8 ms ABSOLUTE clause is not a realistic bar on the SwiftShader harness
  (9.0 ms measured pre-E61 in I460; 8.0 ms for the v4 baseline in I472) -
  future re-evals should weight the DELTA clause plus real-GPU field data
  over the absolute clause. Recorded here so the bar is not silently
  re-litigated inside E61.
- If the vendor IS ever upgraded past r160 (F2 territory, epic E65), the
  "keep WebGL2" rationale must be re-checked from scratch; do not treat this
  verdict as permanent across a vendor upgrade.
- Frozen identity risk: any partial WebGPU attempt that re-implements the
  0.72 bloom + I334 grade without a CG A/B gate risks corrupting the frozen
  look; the A/B gate is a precondition of any switch work in E65.

## Evidence
- .evidence/I472/busy472.mjs + busy472.json - two-phase A/B byte-swap probe
  (fresh browser per phase; v4 backups from .evidence/I470/backup +
  .evidence/I471/backup; restore SHAs byte-identical).
- .evidence/I472/busy472_tris.mjs + busy472_tris.json - clean single
  composer-frame draw stats (314 calls / 44,740 tris / 1,318 points / 448
  lines, deterministic x2).
- .evidence/I460/busy460.json - pre-E61 baseline for the same dense harness
  (median 9.0 ms, v3-era assets).
- .evidence/I472/causal472.mjs + causal472.json - seed-9876 causal EXACT 18/18
  (zero core drift across the whole E61 remaster).
- production/scope-check-E61.md - pre-registered trigger + decision matrix.