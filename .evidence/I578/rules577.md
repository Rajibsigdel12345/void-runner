# I578 / ST-545 - E81 PRE-LEVER RE-AUDIT (frozen rules)

Frozen BEFORE running sweep577. Open story: ZERO src changes (harness +
docs only); re-audits the registered wave-5 Monolith wall (sweep573 at
I574: 30/30 died, median death wave 9, wave-5/6 band 13/30 = largest
wave band, MONOLITH 10/30 = largest single source, H = 0.567 (17/30);
same-tree wave-5 band span 7-12/30 across sweep567/569/571/573 - the
wall is STABLE, R-2 seed variance; I577 death-detail extraction: ALL 13
band deaths are BOLTS, 10 MONOLITH-primary + 3 post-kill residual,
ZERO rock/contact in the band) on fresh seeds, feeding the FROZEN E81
adjudication for the E81 lever (boss.burst.every 4.0 -> 4.8,
src/core/config.js:300, one line).

## 1. Protocol (lineage of .evidence/I574/rules573.md, verbatim)

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

## 2. Seed set (I578)

- sweep577: 30 seeds 57700+i, i = 0..29. FRESH seeds (not nested in
  56400/56500/56700/56900/57100/57300) so the pre-lever re-audit is an
  independent confirmation of the wave-5 Monolith wall.

## 3. Adjudication (FROZEN, verbatim from design/e81-monolith-wave5-wall-research.md sec.6)

Metrics (frozen): B56 = deaths on wave in {5,6} (any attribution) -
baseline 13/30 (sweep573); M56 = deaths on wave in {5,6} AND
clsPrimary == MONOLITH - baseline 10/30.
- (B) B56 >= 12/30 -> apply the lever (boss.burst.every 4.0 -> 4.8).
- (A*) 10 <= B56 <= 11 AND M56 >= 8/30 -> apply the lever (the
  pre-registered single-boss extension - justified by the MEASURED
  single-boss premise: the same fight every time; a sub-12 band here is
  seed variance on a single-boss wall, not wall absence). Recorded WITH
  MEASUREMENT when used.
- (C) B56 <= 9/30 -> ST-546 VOID + accept (E78-lever pattern, docs-only
  close).
- Material divergence from design/e81-monolith-wave5-wall-research.md
  -> RECORD + REGISTER before any code change (I570 pattern); the
  extension re-derives nothing.

## 4. Expected outcome (pre-registered)

Reproduce the wave-5 Monolith wall: B56 in the same-tree 7-12/30 band
(sweep567/569/571/573: 10/7/9/12), M56 tracking MONOLITH-primary in the
band (sweep573: 10/30) -> adjudication B or A* most likely; C possible
if the band lands <= 9/30. If the picture is materially different
(e.g. the band is dominated by non-bolt deaths, or a non-MONOLITH
source dominates MONOLITH-primary in the band), it is recorded and
registered in I578 before any code change; the frozen lever and
acceptance are NOT re-derived.

## 5. Invariants (unchanged)

- Kiter verbatim; full director; cap 36000 ticks; DT 1/60.
- The 15 hit-event payload tags - no new tags.
- Branch rule source: design/e81-monolith-wave5-wall-research.md sec.6
  (frozen at I577; applied verbatim) - supersedes the generic E70/E79
  branch code in the cloned harness ONLY for the branch-decision block.
- Zero src changes in this story: .evidence-only harness, shipped bundle
  byte-identical (6,430,174 B / 203 expected).

## 6. Label hygiene

- Header line prints the real seeds (57700+i) and the real rules file.
- Denominators print runs.length, not a stale constant.
- The adjudication line prints ALL inputs (B56, M56) so the branch is
  auditable from results577.txt alone.
- JSON (sweep577.json) + per-run lines remain the authoritative records.
