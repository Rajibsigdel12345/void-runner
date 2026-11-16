# Void Runner - E60 Scope Check: Art Execution Pass 2 (P1 palette + presentation + FX) + P2 hue decisions (I462 / cgs-scope-check + cgs-create-stories)

## Summary
E60 executes the ready P1 rows of design/art-task-list.md (B1 role-named
palette, B2 boss warning pre-card, B3 starflares, B4 afterburner ribbon)
plus the two zero-cost P2 decision rows (C1 bomb-hue keep/swap decision,
C2 value-band audit), then runs a fresh regression + gate + close. Every
story is presentation-only or a zero-value config refactor: zero core
behavior, zero GLB tri changes, and causal seed 9876 must stay EXACT at
every story. P0 (A1+A2+A3) was shipped at I460 within the E59 envelope;
this is the second art pass, executing rows already budgeted at ST-428
(I459). Scope-of-truth for E60: this doc + design/art-task-list.md (P1/P2
rows) + design/art-direction-research-E59.md (findings).

## Current State (measured this iteration, I462, 2026-11-17 - evidence, not assumption)
- 26 GLBs / 1,016.33 KB / 28,779 tris (cap 30,000; headroom 1,221 - GLB
  re-masters stay OUT of E60 by construction).
- dist: 2,875,336 B / 148 files / ceiling 3,000,000 (headroom 124,664 B >=
  102,400 floor).
- Frozen identity: bloom 0.6/0.35/0.72, I334 bit-identical grade, E59 A2
  enemy fresnel rim (enemyRim.js, 7 roles) + A3 ship damage-flash shell,
  E57 3-mode camera + RM gate, WebGL2 + vendor r160 sha 76DEA8151BC9352A.
- Pins: playframe A 21/14,530 + 10/180 (MENU), B 50/32,826 (fx high);
  causal seed 9876 18-field EXACT (score 11334 / kills 57 / wave 2 /
  maxCombo 15 / shots 198 / acc 0.2878787878787879 / time
  36.14999999999923 / replay 2169-2220@4 / after-Q MENU / radii
  2.2-1.3-0.7 / console 0-0); camera OVERVIEW (0,56,20)->(0,0,0)
  worstRim 0.8362, RM drop 8.981.
- Tests 1027/1027; build 0; PWA 11/11; hygiene (5173/5199 free, chrome 0).

## Why E60 (and why now)
- The P1 rows were budgeted at ST-428 (I459) with numeric envelopes and
  acceptance lines; the E59 research ranks them as the next-highest
  player-visible art wins after P0: palette traceability, boss dread beat,
  starfield depth, ship motion channel.
- C1 (bomb hue) could only be decided "after A1 lands" - A1 landed at
  I460, so the decision is unblocked and costs 0 KB on a keep.
- C2 (value-band audit) is docs-only and explicitly feeds B1, so it
  belongs in this arc.

## Scope Fit
E60 is bounded to five stories with a combined dist envelope <= 19 KB
(B1 2 + B2 3 + B3 6 + B4 8; C1 0 on keep / C2 0 docs), zero GLB tris, and
zero core behavior change. Headroom check: 19 KB of the 124,664 B headroom
leaves >= 105,664 B even if every budget is spent in full (>= the 102,400
floor). Any row that fails its acceptance or perf gate cuts per the ladder
below rather than pushing the ceiling.

## Stories
- ST-431 (I463, config + docs, zero core behavior): B1 role-named palette
  refactor + C2 value-band audit. Extract every world/UI color into one
  role-named section (bodyPrimary/hazard/reward/shield/emissiveSignal per
  the threejs-game-studio material kit), VALUES UNCHANGED; comments
  document the 8-12 role values; the C2 grayscale value-band audit (floor
  vs actors at 3:1) lands as a design/ note feeding B1 role names. Gate:
  causal EXACT + dist delta measured (<= 2 KB comments) + every color
  traceable to one named role.
- ST-432 (I464, config or docs, zero core): C1 bomb-hue decision from a
  busy-moment A/B screenshot (keep 0xff5252 vs swap to 0xffa84a). Decision
  rule: if the box + "B" glyph already separates the bomb from the threat
  family at the busiest moment, KEEP (0 KB); otherwise a config-only swap.
  Gate: causal EXACT either way (colors do not drive the sim) + A/B
  evidence in .evidence/I464/.
- ST-433 (I465, src/render, zero core): B2 boss warning pre-card - extend
  waveBanner with a warning state (dimmed red sub-line + 1.0 s pre-delay)
  driven from the existing boss events. <= 3 KB; warning->intro sequence
  <= 3.2 s; <= 1 new DOM node; RM-safe (static dim, no pulse). Gate:
  causal EXACT + playframe EXACT (MENU frame) + RM gate re-run.
- ST-434 (I466, src/render, zero core): B3 starflares + B4 afterburner
  ribbon as a combined FX pair (E59 A1+A2+A3 same-iteration pattern). B3:
  flare layer for the top ~2% of stars, NEAR shell only, +1 draw call per
  shell, <= 6 KB, RM-gated. B4: ring-buffer Points trail at sustained
  thrust, <= 8 KB, zero per-frame allocs over a 10 s probe, clears on
  death, RM-gated. Gate: causal EXACT + ONE combined busy-moment perf
  probe (E59 pattern: frame fn vr.bloom.render(), on/off recompile,
  draw-call parity, median over 90/30 w/ 25/6 warmup) + playframe A
  RE-PIN WITH DECOMPOSITION if the +1 call/shell moves it (expected);
  draw-call parity reported.
- ST-435 (I467): fresh R1-R5 + G60.0 gate + E60 close (cgs-regression-suite
  + cgs-gate-check + cgs-milestone-review; harnesses retagged from
  .evidence/I461/): R1+R2 causal EXACT + R3 playframe at pins (A
  decomposition re-pin if moved) + camera 3x3 + hero views + R4 PWA 11/11
  + R5 quality bar + dist vs 3,000,000 + vendor sha + hygiene; WebGPU
  re-confirmation line (F1/F2/F3) + AGENTS.md roster check (expected
  unchanged - zero new GLBs).

## Cut Options (pre-agreed)
- Cut 1 (primary): B4 defers to E61 (largest KB budget + the only
  GC-risk row - ring buffer over a 10 s probe).
- Cut 2: B3 defers to E61 (+1 draw call/shell is the pin-risk row).
- Cut 3: B3 lands as a STATIC flare (no aPhase rotation) to drop shader
  cost; label the deviation on the row.
- Cut 4: C1 resolves to KEEP (docs-only decision line; 0 KB).

## Deferral (explicitly out of E60)
- C3 dynamic background fade/fog (perf risk; measure before building).
- C4 nebula shells (stage themes already re-tint; measure need first).
- Camera-feel micro-tune (E57's 3-mode + RM system already fulfills the
  user's camera-angle + first-person request; micro-tune is E61+).
- Campaign polish (E61+ candidate).
- New-enemy ladder slot (E61+ candidate - separate scope).
- GLB re-masters (tri headroom 1,221 nearly consumed; assets/ untouched).
- Audio/music (separate arc).

## Risks
- R1: dist headroom 124,664 B is finite - every row carries a KB budget;
  total <= 19 KB keeps >= 105,664 B margin; dist measured at every story.
- R2: B3/B4 may move the playframe A pin (+1 draw call/shell, +1 trail) -
  EXPECTED; re-pin WITH DECOMPOSITION (I456 precedent), causal stays EXACT
  (art never touches core); a causal drift is a stop-the-line failure.
- R3: B4 ring-buffer GC risk - the 10 s performance.measure probe is a
  hard acceptance; Cut 1 covers it.
- R4: reduced-motion regression - B3/B4 are RM-gated by construction; the
  RM gate re-runs at ST-433 and ST-435.
- R5: frozen-identity regression (bloom 0.6/0.35/0.72, I334 grade, E59
  A2 rim / A3 flash) - E60 work may ADD presentation but must not re-tune
  any frozen constant; any constant change is a scope violation.

## Changed files or proposed files
- I462 (this open, DOCS-only, zero src): production/scope-check-E60.md
  (NEW - this file), production/epics.md (E60 section),
  production/stories.md (E60 block + STATUS), production/timeline.md
  (I462 line), production/iterations.md (I462 entry), CHANGELOG.md
  (I462 line), production/session-state/active.md (I462 note). Zero
  src/asset/test.
- ST-431 (I463): src/core/config.js (role-named palette section; zero
  value change) + design/ value-band audit note.
- ST-432 (I464): src/core/config.js (if swap) or a docs-only decision
  line; .evidence/I464/ A/B screenshots.
- ST-433 (I465): src/render/waveBanner.js (warning state) + possibly
  src/main.js wiring.
- ST-434 (I466): src/render (starfield flare layer + afterburner ribbon
  module) + main.js wiring.
- ST-435 (I467): .evidence/I467/ retagged probes; AGENTS.md roster check
  (expected unchanged - zero new GLBs).

## Verification evidence (I462, docs-only gate)
- npm test 1027/1027 + npm run build 0 + dist byte-identical
  2,875,336 B / 148 + vendor sha256-16 76DEA8151BC9352A unchanged +
  hygiene (no servers, no chrome, node-only).

## Next owner or decision
I463 = ST-431 (B1 role-named palette + C2 value-band audit). Owner:
creative-director (palette role names) + gameplay-programmer (config
refactor). No decision needed from the user - this arc executes the
already-budgeted P1 rows.
