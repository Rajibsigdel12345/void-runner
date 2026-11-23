# I574 / ST-541 - E80 PRE-LEVER RE-AUDIT (frozen rules)

Frozen BEFORE running sweep573. Open story: ZERO src changes (harness +
docs only); re-audits the registered Splicer wave-10 wall (sweep571 at
I571: 30/30 died, median death wave 10, H = 0.467 (14/30), SPLICER 8/30,
wave-10 cluster 13/30; same-tree composite H span 0.400-0.667 across
sweep565/567/569/571 - the wall is STABLE, R-2 seed variance) on fresh
seeds, feeding the FROZEN E80 adjudication for lever [2]
(splicer.maxHp 30 -> 24, src/core/config.js:322, one line).

## 1. Protocol (lineage of .evidence/I570/rules569.md, verbatim)

- FULL director from wave 1 (NO isolation): const w = new World(new RNG(seed)); w.begin();
- Cap: 36000 ticks (600 s) at DT = 1/60.
- Pilot: the I328 frozen kiter, VERBATIM as carried in
  .evidence/I570/sweep569.mjs (12 u standoff, weave Math.sin(t/90)*4,
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

## 2. Seed set (I574)

- sweep573: 30 seeds 57300+i, i = 0..29. FRESH seeds (not nested in
  56400/56500/56700/56900/57100) so the pre-lever re-audit is an
  independent confirmation of the Splicer wave-10 wall.

## 3. Adjudication (FROZEN, verbatim from design/e80-splicer-wave10-wall-research.md sec.6)

Thresholds verbatim from rules564: H = (MONOLITH + SPLICER + WARDEN)
share of killing blows; W10 = wave-10 killing-blow cluster /30; W5 =
wave-5 cluster /30.
- (B) H >= 0.600 AND SPLICER = largest single source -> lever [2].
- (A*) 0.400 < H < 0.600 AND SPLICER = largest single source AND
  W10 >= W5 -> lever [2] (the pre-registered single-boss extension -
  the composite premise is MEASURED dead: RETIRES NONE 21/21, 0/23
  Monoliths alive at wave-8 start, so a sub-0.600 H here is seed
  variance on a single-boss wall, not a composite). Recorded WITH
  MEASUREMENT when used.
- (C) otherwise (H <= 0.400, or SPLICER not the largest single source,
  or W10 < W5) -> ST-542 VOID + accept (E78-lever pattern, docs-only
  close).
- "Largest single source" is decided on the PRIMARY killing-blow tally:
  SPLICER must strictly exceed every other single-source class count
  (a tie is NOT "the largest" -> falls through to C). Deterministic.
- Material divergence from design/e80-splicer-wave10-wall-research.md
  -> RECORD + REGISTER before any code change (I570 pattern); the
  extension re-derives nothing.

## 4. Expected outcome (pre-registered)

Reproduce the single-boss Splicer wall: SPLICER the largest single
source, W10 in the 11-16/30 band (sweep569/571/567: 16/13/11), H in the
same-tree 0.400-0.667 span (sweep565/567/569/571) -> adjudication B or
A* most likely; C possible. If the picture is materially different
(e.g. a non-SPLICER source is strictly largest), it is recorded and
registered in I574 before any code change; the frozen lever and
acceptance are NOT re-derived.

## 5. Invariants (unchanged)

- Kiter verbatim; full director; cap 36000 ticks; DT 1/60.
- The 15 hit-event payload tags - no new tags.
- Branch rule source: design/e80-splicer-wave10-wall-research.md sec.6
  (frozen at I573; applied verbatim) - supersedes the generic E70/E79
  branch code in the cloned harness ONLY for the branch-decision block.
- Zero src changes in this story: .evidence-only harness, shipped bundle
  byte-identical (6,430,174 B / 203 expected).

## 6. Label hygiene

- Header line prints the real seeds (57300+i) and the real rules file.
- Denominators print runs.length, not a stale constant.
- The adjudication line prints ALL inputs (H, SPLICER count, W10, W5,
  largest source) so the branch is auditable from results573.txt alone.
- JSON (sweep573.json) + per-run lines remain the authoritative records.
