# I570 / ST-536 - E79 PRE-LEVER RE-AUDIT (frozen rules)

Frozen BEFORE running sweep569. Open story: ZERO src changes (harness +
docs only); re-audits the registered composite post-E77 wall (sweep567 at
I567: 30/30 died, median death wave 9, H = 0.400 EXACT -> Branch C; bands
wave-5 Monolith bolt cluster 10/30 + wave-10 mixed cluster 11/30 (incl.
residual wave-5 Monolith speed-9 bolts - the boss PERSISTS until killed) +
wave-8/9 gunship band 4/30) on fresh seeds, independently cross-checking
sweep567 BEFORE L-A (boss retirement, cfg.boss.retireAfterWaves 3, endless
only) is applied in ST-537/I571.

## 1. Protocol (restated from .evidence/I525/rules525.md, as extended by rules564)

- FULL director from wave 1 (NO isolation): `const w = new World(new RNG(seed)); w.begin();`
- Cap: 36000 ticks (600 s) at DT = 1/60.
- Pilot: the I328 frozen kiter, VERBATIM from .evidence/I524/balance524.mjs
  (12 u standoff, weave Math.sin(t/90)*4 - ABSOLUTE tick function, fire < 18 u,
  x2 repulsion, no-target -> center thrust + fire t%30).
- Run ends at w.gameOver (lives -> 0) or the cap. A capped run is recorded with
  died=false and contributes no killing blow.
- Killing-blow attribution: the 15 payload tags on the 'hit' events (I525,
  permanent telemetry) + clsPrimary resolution per the I525 rules (monolith
  probable rocks included in the primary tally, reported separately in strict).
- Threat list: the rules564 extended list (sweeper w18+ wgt 1.5; beacon w19+
  wgt 2 physical-only; speed-8 bolt attribution sweeper > mine). UNCHANGED.

## 2. Seed set (I570)

- sweep569: 30 seeds 56900+i, i = 0..29. FRESH seeds (not nested in
  56400/56500/56700) so the pre-lever re-audit is an independent
  confirmation of the sweep567 composite picture. 30-seed fraction
  thresholds (rules564 sec.2, verbatim):
  H fraction >= 0.600 -> Branch B (heavyweight wall);
  H fraction <= 0.400 -> Branch C (diffuse, accept-with-documentation);
  0.400 < H < 0.600 -> Branch A (mixed; adjudicate by the dominant single
  source).
  Heavyweights (H) = MONOLITH, SPLICER, WARDEN (the boss_splicer bolt source
  counts as SPLICER).

## 3. Expected outcome (pre-registered)

Reproduce the Branch C composite picture of sweep567 on the current tree
(same tree as at I567 - I568/I569 were docs-only): median death wave ~9,
H fraction at/below 0.400, the three bands (wave-5 Monolith bolts, wave-10
mixed cluster, wave-8/9 gunship band) persisting. The L-A acceptance
baseline STAYS the sweep567 values (median 9; wave-10 cluster 11/30) per the
frozen E79 scope-check - sweep569 is a cross-check, not the baseline. A
materially different picture (e.g. a single non-heavyweight source >= 0.400,
or H >= 0.600) is recorded and registered in I570 before L-A is applied; it
does NOT re-derive the frozen L-A spec (the lever is a fairness rule change
applied regardless of branch; acceptance is frozen against the sweep567
baseline).

## 4. Invariants (unchanged)

- Kiter verbatim; full director; cap 36000 ticks; DT 1/60.
- The 15 hit-event payload tags - no new tags.
- Branch rule source: design/e70-balance-followup-research.md sec.4 (frozen
  at I523; applied verbatim).
- Zero src changes in this story: .evidence-only harness, shipped bundle
  byte-identical (6,430,174 B / 203 expected).

## 5. Label hygiene

- Header line prints the real seeds (56900+i) and the real rules file.
- Denominators print runs.length, not a stale constant.
- JSON (sweep569.json) + per-run lines remain the authoritative records.