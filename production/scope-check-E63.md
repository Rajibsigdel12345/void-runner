# Scope Check - E63 Enemy Expansion + Art Direction (I479)

Produced under cgs-scope-check (producer). Objective: the user asked for "enemies and stuff" in
the game content, with research (YouTube MCP, per user instruction) on how enemies in this kind
of game should look and read, so nothing is invented or overengineered. E62 closed I478; E64
(linear levels + end-of-level bosses) and E65 (WebGPU) remain queued.

## 1. Measured current state (tree-verified, I479)

- Enemy fleet: 10 roles + Warden mini-boss + 2 bosses (config.js; roster + gaps:
  design/enemy-art-direction-research-E63.md section 3). No mid-range shooter, no swarm unit,
  no non-boss state-change unit.
- Assets: 26 GLBs, ~1,051 KB / 33,050 tris (assetPerf measured I471); ship v5 384,756 B / 17,143
  t; hunter 144,460 B / 2,256 t; gunship 171,736 B / 2,268 t.
- dist: 2,922,693 B / 151 files; ceiling 3,250,000 (headroom 327,307 B); close floor 102,400 B
  (E61 rule).
- Vendor r160 sha256-16 76DEA8151BC9352A; WebGL2 (E65 = WebGPU territory, NOT in E63).
- Tests: 1032. Pinned: causal 9876 18-field EXACT (ends W2 / 36.15 s); playframe A 22/17,397 +
  11/180 / B 52/38,560; cam473 3x3 rest invariants; PWA 11/11.
- E62 CLOSED 5/5 (I478); E65 NOT STARTED.

## 2. Scope fit

FIT. Three new roles (SENTRY / WASP / POD) fill exactly the three identified roster gaps
(research doc section 3), each adding ONE new function (F1/F3) - the minimal set that answers
"enemies and stuff" without a roster rebuild:
- SENTRY (SQUAD): the missing mid-range aimed shooter (new GLB, Blender - user asset preference).
- WASP (SWARM): the missing popcorn pack unit (new GLB, Blender).
- POD (state change): the missing "shoot it or wait" splitter (PROCEDURAL - Vortex precedent;
  its children are WASPs, so no third GLB).
Zero camera work (E62 closed; frozen), zero WebGPU work (E65), no FX identity changes (bloom
0.6/0.35/0.72 + I334 grade frozen). Campaign stages 1-2 (W1-10) untouched; new roles gate at
W11/W12/W13 (never on boss waves) so pinned runs (W2/W3) cannot be affected - causal + playframe
pre-registered EXACT, no re-pins.

## 3. Stories (ST-446..ST-450; acceptance in production/stories.md)

- ST-446 (I479): OPEN E63 - research doc + this scope check + epics + stories. DOCS-only, zero
  src. DONE in this iteration.
- ST-447: design/enemy-roster-E63.md - full role specs: CONFIG field tables, telegraph timings
  with the F2 anticipation floors, FINAL palettes + I381/I383 rendered-luma audit, GLB contract
  for SENTRY/WASP (+ POD procedural spec), wave mix matrix (F8), i18n string table en/zh/ja,
  re-pin budgets finalized. DOCS-only.
- ST-448: CORE - 3 field modules (src/core/sentry.js, wasp.js, pod.js; POD death -> 2 WASPs),
  CONFIG blocks, spawn gates W11/W12/W13 in game.js, procedural fallback mesh modules
  (src/render/sentryMesh.js, waspMesh.js, podMesh.js - assetLoader policy, no boot gate), i18n
  en/zh/ja + kill-feed/banner names, 3 new test files + pool-audit check. causal + playframe
  EXACT (pre-registered, no re-pins - gates W11+ vs W2/W3 runs).
- ST-449: BLENDER - deterministic .evidence build scripts for SENTRY + WASP GLBs (CG clay 6
  views + tint A/B gate, silhouette + back-view checks, COLOR_0 neutral grayscale bake on the
  hull prim only), re-pins land WITH measurement (BUDGETS, assetPerf, dist), zero src beyond
  assets/ + test pins.
- ST-450: G63.0 CLOSE GATE - fresh causal 18/18 EXACT + playframe EXACT + new-enemy probe
  (headless via the __vr.world exposure at main.js:731: presence, palette, pool bounds,
  RM-safe telegraph pose) + hero views + PWA 11/11 + quality bar + AGENTS.md roster refresh +
  bookkeeping + commit.

## 4. Re-pin budgets (pre-registered; each lands WITH its measurement at ST-449)

| Pin | Current | Pre-registered |
|-----|---------|----------------|
| BUDGETS (assetGlbs.test.js) | ship 19000 ... hunter 2400 / gunship 2400 | + sentry 1800 / wasp 1200 |
| MAX_FILE_BYTES | 393,216 | UNCHANGED (largest new file ~137 KB) |
| assetPerf totalFilesKB | 1,240 (meas ~1,051) | HOLDS if measured <= 1,240 (expect ~1,233), else 1,440 |
| assetPerf totalGeoKB | 1,120 (meas ~1,010) | 1,280 (expect measured ~1,185) |
| assetPerf totalTris | 36,000 (meas 33,050) | HOLDS if SENTRY <= 1,600 AND WASP <= 1,000 (expect 35,650), else 39,000 |
| causal 9876 18-field | EXACT | EXACT (no re-pins; W11+ gates vs W2 run) |
| playframe A/B | 22/17,397 + 11/180 / 52/38,560 | EXACT (no re-pins) |
| dist ceiling | 3,250,000 | UNCHANGED (section 5) |

## 5. Dist policy

Ceiling 3,250,000 UNCHANGED. Expected dist at G63.0: ~3,100,000-3,155,000 B (GLB pair median
~182 KB + code delta ~25-35 KB) -> headroom ~95,000-150,000 B. Close floor: 102,400 B (E61
rule). Renegotiation branch (ST-407 precedent, documented at open): fires ONLY if cut ladder
C1+C2 are exhausted AND measured headroom at G63.0 < 102,400 B -> renegotiate to 3,350,000 WITH
the measurement; otherwise the ceiling stands and the branch is documented as unused.

## 6. Cut ladder (apply in order, only if measured dist headroom < 102,400 B at ST-449)

- C1: SENTRY 1,600 t -> 1,200 t (~-26 KB)
- C2: WASP 1,000 t -> 800 t (~-13 KB)
- C3: drop SENTRY COLOR_0 detail bake bands (~-8 KB)
- C4: WASP GLB -> procedural (frees ~70 KB; WASP keeps its full behavior spec) - last rung before
  the section-5 renegotiation branch.

## 7. Deferrals (documented, not silently dropped)

- Enemy outline/rim pass (E59 finding; 2x enemy draw calls + frozen-FX risk) -> E65 territory.
- POD GLB (procedural now; promote later if headroom allows).
- True SNIPER / LEADER roles -> E64 stage design (linear levels give them room to matter).
- Linear levels + level design + end-of-level boss = E64 (queued, user's step-by-step request).
- WebGPU = E65 (NOT STARTED, user decision to prioritize).

## 8. Risks

- R1 dist headroom < floor: cut ladder C1-C4 + renegotiation branch (sections 5/6) pre-registered.
- R2 causal drift (only if a W11+ gate fires inside a pinned run - pre-registered NOT to):
  re-pin WITH measurement (ST-440 precedent).
- R3 palette collision: POD vs drone is a tight dhue ~42 deg clear; the I381/I383 rendered-luma
  audit runs at ST-447 BEFORE any Blender work (research doc 4.4).
- R4 WASP dash dodgeability: anticipation >= 1.0 s + dash speed <= 16 u/s (F2 floor; stinger
  precedent) - acceptance-tested at ST-448.
- R5 pool overflow from POD -> WASP splits (wasp pool 6 + 4 split-children): pool sizing
  pre-registered at ST-448 (poolAudit test).

## 9. Verification bar (per iteration)

npm test green + build exit 0 + dist <= ceiling (>= floor at close) + vendor sha256-16
76DEA8151BC9352A PIN_OK + BOM audit 5/5/3/3/7/0 + hygiene (no stray servers/tabs) + git commit
with message file.

## 10. Changed files (I479) + next

NEW: design/enemy-art-direction-research-E63.md (13.7 KB, no-BOM LF, outside the tracked BOM
set), production/scope-check-E63.md (this file). Bookkeeping: epics.md (E63 OPEN section),
stories.md (ST-446..ST-450 + STATUS line), iterations.md (I479), timeline.md, active.md. Zero
src/assets/vendor. Next: I480 = ST-447 (role spec design doc).