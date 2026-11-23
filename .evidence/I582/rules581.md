# I582 / ST-549 - E82 PRE-LEVER RE-AUDIT (frozen rules)

Frozen BEFORE running sweep581. Open story: ZERO src changes (harness +
docs only); re-audits the registered wave-5 Monolith wall (sweep577 at
I578: 30/30 died, median death wave 9, wave-5/6 band 11/30, MONOLITH-
primary 7/30 + post-kill residual 4/30 [deltas 4/54/72/77 ticks, all
within the frozen 180-tick window -> M56' = 11/30 vs the E81 M56 =
7/30]; same-tree wave-5 band span 7-12/30 across
sweep567/569/571/573/577 - the wall is STABLE, R-2 seed variance; I581
death-detail extraction: ALL 11 band deaths are BOLTS, inFight 7 +
postKillResidual 4, V-DECODE burst-class 10 / aimed-class 1 / ambiguous
0, ZERO rock/contact in the band) on fresh seeds, feeding the FROZEN
E82 adjudication for the E82 lever (boss.burst.every 4.0 -> 4.8,
src/core/config.js:300, one line - the UNAPPLIED E81 lever carried into
E82 per the house precedent: E80 picked up E79's unapplied registered
lever).

## 1. Protocol (lineage of .evidence/I578/rules577.md, verbatim)

- FULL director from wave 1 (NO isolation): const w = new World(new RNG(seed)); w.begin();
- Cap: 36000 ticks (600 s) at DT = 1/60.
- Pilot: the I328 frozen kiter, VERBATIM as carried in
  .evidence/I574/sweep573.mjs (12 u standoff, weave Math.sin(t/90)*4,
  fire < 18 u, x2 repulsion, no-target -> center thrust + fire t%30).
- Run ends at w.gameOver (lives -> 0) or the cap. A capped run is
  recorded with died=false and contributes no killing blow.
- Killing-blow attribution: the 15 payload tags on the hit events
  (I525, permanent telemetry) + clsPrimary resolution per the I525 rules
  (monolith probable rocks included in the primary tally, reported
  separately in strict).
- Threat list: the rules564 extended list (sweeper w18+ wgt 1.5; beacon
  w19+ wgt 2 physical-only; speed-8 bolt attribution sweeper > mine).
  UNCHANGED.

## 2. Seed set (I582)

- sweep581: 30 seeds 58100+i, i = 0..29. FRESH seeds (not nested in
  56400/56500/56700/56900/57100/57300/57700) so the pre-lever re-audit is
  an independent confirmation of the wave-5 Monolith wall.

## 3. Adjudication (FROZEN, verbatim from design/e82-monolith-wave5-wall-ii-research.md sec.6)

Metrics (frozen):
- B56 = deaths on wave in {5,6} (any attribution) - baseline 11/30
  (sweep577).
- M56' (REFINED, frozen pre-run) = deaths on wave in {5,6} AND
  (clsPrimary == MONOLITH OR (clsPrimary == bullet_unknown AND a
  monolithDeath tick exists within 180 ticks (3 s) BEFORE the player
  death)). The 180-tick window is sized by the MEASURED post-kill
  residuals (sweep573: 2-90 ticks; sweep577: 4/54/72/77 ticks) with
  margin. On sweep577: M56' = 11/30 (vs the E81 M56 = 7/30, which counted
  clsPrimary == MONOLITH only).
- COMPARABILITY NOTE (R-6): M56' is NOT the same metric as the E81 M56;
  both are reported wherever E82 numbers appear so the E81 record stays
  auditable.

Gap-free FROZEN adjudication (explicitly tiling the (B56, M56') space -
satisfies the E81 PROCESS FINDING (d)):
- (B) B56 >= 12/30 -> apply the lever.
- (A*) 10 <= B56 <= 11 AND M56' >= 8/30 -> apply the lever (the
  pre-registered single-boss extension, as at E81 - justified by the
  MEASURED single-boss premise: the same fight every time; a sub-12 band
  here is seed variance on a single-boss wall, not wall absence).
  Recorded WITH MEASUREMENT when used.
- (G) 10 <= B56 <= 11 AND M56' <= 7/30 -> ST-550 VOID + accept + document
  (C-equivalent; this is the cell that was UNCOVERED at E81 under the
  M56-only metric).
- (C) B56 <= 9/30 -> ST-550 VOID + accept (E78-lever pattern).
- The four cells are mutually exclusive and exhaustive over the
  (B56, M56') space (B56 in {>= 12} vs {10, 11} vs {<= 9}; within {10,
  11}, M56' >= 8 vs M56' <= 7). NO uncovered cell remains.
- Material divergence from design/e82-monolith-wave5-wall-ii-research.md
  -> RECORD + REGISTER before any code change (I570 pattern); nothing is
  re-derived.

## 4. Expected outcome (pre-registered)

Reproduce the wave-5 Monolith wall: B56 in the same-tree 7-12/30 band
(sweep567/569/571/573/577: 10/7/9/12/11), M56' tracking MONOLITH-primary
+ post-kill residual in the band (sweep577: 11/30) -> adjudication B or
A* most likely; G or C possible. If the picture is materially different
(e.g. the band is dominated by non-bolt deaths, or a non-MONOLITH
source dominates the band), it is recorded and registered in I582
before any code change; the frozen lever and acceptance are NOT
re-derived.

## 5. Invariants (unchanged)

- Kiter verbatim; full director; cap 36000 ticks; DT 1/60.
- The 15 hit-event payload tags - no new tags.
- Branch rule source: design/e82-monolith-wave5-wall-ii-research.md
  sec.6 (frozen at I581; applied verbatim) - supersedes the generic
  E70/E79 branch code in the cloned harness ONLY for the branch-decision
  block.
- Zero src changes in this story: .evidence-only harness, shipped bundle
  byte-identical (6,430,174 B / 203 expected).

## 6. Label hygiene

- Header line prints the real seeds (58100+i) and the real rules file.
- Denominators print runs.length, not a stale constant.
- The adjudication line prints ALL inputs (B56, M56, M56') so the branch
  is auditable from results581.txt alone.
- JSON (sweep581.json) + per-run lines remain the authoritative records.