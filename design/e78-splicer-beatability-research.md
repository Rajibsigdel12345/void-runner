# E78 "Splicer Beatability" Research - Post-E77 Wave-10 Wall Re-Audit and Branch Re-Adjudication (I567, ST-533)

Status: I567 (ST-533) open + measured re-audit. VERDICT: BRANCH C (accept-with-documentation).
Lever story voided. E78 = docs-only epic; closes at G78.0 (I568, ST-534).

## Standing context (user queue)

Autonomous standing queue: the registered post-E77 wall (I565/I566) - wave-10
SPLICER-dominant (9/30 in sweep565) - is the natural next balance target. E78 was
pre-registered as "Splicer beatability" with the frozen E70 branch lever [2]
(splicer.maxHp 30 -> 24, single lever, on-failure -> accept, no second lever,
per design/e70-balance-followup-research.md sec.4). This story re-audits the wall
on FRESH seeds before any lever choice, per the frozen rules567 protocol
(.evidence/I567/rules567.md).

## 1. Measured current state (MEASURED, I567 - sweep567: 30 seeds 56700+i, full
director from wave 1, frozen I328 kiter verbatim, cap 36000 ticks @ 1/60)

- 30/30 died. Median death wave 9 (sweep565: 9.5).
- Death-wave distribution: wave5 x10 / wave8 x4 / wave9 x3 / wave10 x11 / wave12 x1 / wave14 x1.
- Killing-blow tally (primary): MONOLITH 7 / SPLICER 5 / gunship 5 / bullet_unknown 5 /
  rock_M 4 / rock_S 2 / rock_L 1 / phantom 1. (Strict tally identical - no
  monolithProbable rock rows in this sample.)
- H (heavyweight = MONOLITH + SPLICER + WARDEN): 12/30 = 0.400 EXACT.
- Best run: seed 56701 reached wave 14 (score 257,924 / 726 kills), died to phantom.
- Per-wave: waves 1-4 cleared 30/30 (median clear 19.44-22.17 s); wave 5 cleared 20/30
  (26.68 s); wave 10 cleared 2/13 (26.38 s); wave 14 cleared 0/1.

## 2. Cross-check vs sweep565 (pre-registered expectation, rules567 sec.3)

Expectation: reproduce the SPLICER-dominant wave-10 cluster.
- Wave-10 cluster: REPRODUCED EXACTLY - 11/30 died on wave 10 in BOTH sweeps
  (sweep567: startedRuns 13, clearedRuns 2).
- SPLICER: still the largest single heavyweight source (5/30, ALL on wave 10),
  down from 9/30 in sweep565.
- Deltas sweep565 -> sweep567: MONOLITH 7 -> 7 (stable); gunship 2 -> 5;
  bullet_unknown 6 -> 5; rock_M 4 -> 4; rock_S 1 -> 2; wasp 1 -> 0; phantom 0 -> 1;
  H 0.533 -> 0.400.
- Reading: the wave-10 wall is REAL and STABLE across independent seed sets, but it
  is not SPLICER-alone - it is a composite wave-10 cluster sitting on top of the
  still-present wave-5 Monolith bolt cluster.

## 3. Wall characterization (composite wall, post-E77)

Boss cycle (cfg.boss.everyWave 5; variant alternates by spawn count, ST-143):
wave 5 = Monolith, wave 10 = Splicer, wave 15 = Monolith, wave 20 = Splicer.
A boss persists until killed (spawnBossForWave is a no-op while a boss is alive),
so a surviving wave-5 Monolith is still firing at wave 10 alongside the fresh
Splicer (both fire speed-9 aimed bolts - the I564-documented attribution ambiguity).

Three interlocking death bands:
(a) WAVE-5 MONOLITH BOLT CLUSTER: 10/30 (MONOLITH 7 + bullet_unknown 3, all wave 5).
    The E77 lever (boss.ringEvery 2.0 -> 2.5) relaxed but did not eliminate the
    window; the kiter still arrives at wave 5 mid-transition from wave-4 pressure.
(b) WAVE-10 MIXED CLUSTER: 11/30 (SPLICER 5 + bullet_unknown 2 + rock_M 2 + rock_S 1
    + gunship 1). The wave-10 bullet_unknown rows are Monolith speed-9 bolts from
    the persistent wave-5 Monolith - part of the "Splicer wave" is actually residual
    Monolith pressure.
(c) WAVE-8/9 GUNSHIP BAND: 4/30 (gunship 3 + rock_L 1).

Run-level ceiling vs median: the best seed reaches wave 14 (died to phantom, the
E69 fleet debut wave), so good seeds now pass the wave-10 wall; but the median
death wave (9) and the 11/30 wave-10 cluster show the wall still dominates typical
runs.

## 4. Branch adjudication (frozen rules; rules567 sec.2 = rules564 thresholds verbatim)

- Branch B requires H fraction >= 0.600: 0.400 -> NO.
- Branch A requires one non-heavyweight source >= 0.400: max non-heavyweight =
  gunship 5/30 = 0.167 -> NO.
- Branch C (otherwise): YES.
- VERDICT: BRANCH C = accept-with-documentation. NO lever is applied in E78.
- Borderline caveat (registered, as at I564): 0.400 is EXACTLY on the C boundary,
  and the paired post-E77 sample (sweep565, seeds 56500+i) sits in the A band
  (0.533, SPLICER-dominant mixed). The two samples straddle the A/C border; the
  frozen deterministic rule on the fresh independent sample governs: C. The true H
  is in the 0.40-0.55 diffuse-mixed zone - the wall is composite, so no single
  frozen lever (Splicer [2], a roster/leak lever, or Monolith [1]/[4]/[5]) is
  indicated by the frozen protocol.
- Consequence for the pre-registration: frozen E70 lever [2] (splicer.maxHp 30 -> 24)
  is NOT applied. It remains registered (frozen, unmodified) as the candidate for a
  future epic if a later re-audit re-adjudicates the wall as SPLICER-dominant (e.g.
  after an upstream change shifts the survival distribution past wave 5 and the
  wave-10 cluster re-concentrates on the Splicer).

## 5. Story map (re-adjudicated by the measured Branch C)

Pre-registration (conditional on branch B/A confirmation): ST-533 open + re-audit /
ST-534 lever WITH MEASUREMENT / ST-535 G78.0 close gate.
Re-adjudicated:
- ST-533 (I567) open + measured re-audit + branch adjudication + this research +
  scope-check - DONE I567.
- The lever story is VOID (no lever per the frozen rule).
- ST-534 (I568) G78.0 close gate: 5-harness gate EXACT (no re-pin possible: zero
  src change) + dist re-measurement + CLOSE FLOOR E78 re-derived WITH MEASUREMENT
  + AGENTS.md refresh + E78 CLOSED.

## 6. Pin safety

No lever -> zero src change -> no re-pin possible. All five harness pins remain
EXACT at their I566 values (re-verified fresh at the ST-534 gate).

## 7. dist policy

Docs + .evidence only: dist must stay byte-identical 6,430,174 B / 203 files.
Ceiling 7,400,000 B; tripwire 7,297,600 B; CLOSE FLOOR E77 = 969,826 B carries
until re-derived WITH MEASUREMENT at the G78.0 gate (I568).

## 8. Risks

- R-1 (borderline verdict): 0.400 EXACT on the C boundary + sweep565 in the A band.
  Mitigation: the frozen rule is deterministic on the fresh sample; the borderline
  is registered here; any future Splicer-lever attempt must start with a re-audit.
- R-2 (composite wall, no single lever): the accepted residual wall is composite
  (wave-5 Monolith + wave-10 mixed + wave-8/9 gunship). A future balance epic may
  need a multi-step (multi-epic) plan instead of one frozen lever - a scope decision
  for that future epic, out of E78.
- R-3 (attribution ambiguity): wave-10 bullet_unknown rows depend on the documented
  Monolith/Splicer speed-9 bolt collision (persistent old Monolith). Non-regression:
  attribution rules frozen since I525/I564.
- R-4 (label hygiene): the sweep567 clone fixed the stale "/10" denominators and
  header labels registered at I565; sweep567.json + the per-run lines remain the
  authoritative record.
