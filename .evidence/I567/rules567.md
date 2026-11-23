# I567 / ST-533 - E78 PRE-LEVER RE-AUDIT (frozen rules)

Frozen BEFORE running sweep567. Open story: ZERO src changes (harness +
docs only); re-audits the registered post-E77 wall (wave-10 Splicer-dominant,
9/30 in sweep565) on fresh seeds, cross-checking sweep565 before the frozen
E70 Branch-B lever [2] (splicer.maxHp 30 -> 24) is applied in ST-534/I568.

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

## 2. Seed set (I567)

- sweep567: 30 seeds 56700+i, i = 0..29. FRESH seeds (not nested in 56400/56500)
  so the pre-lever re-audit is an independent confirmation of the sweep565 wall.
  30-seed fraction thresholds (rules564 sec.2, verbatim):
  H fraction >= 0.600 -> Branch B (heavyweight wall);
  H fraction <= 0.400 -> Branch C (diffuse, accept-with-documentation);
  0.400 < H < 0.600 -> Branch A (mixed; adjudicate by the dominant single
  source).
  Heavyweights (H) = MONOLITH, SPLICER, WARDEN (the boss_splicer bolt source
  counts as SPLICER).

## 3. Expected outcome (pre-registered)

Reproduce the SPLICER-dominant wave-10 cluster registered at I565:
median death wave ~9.5, SPLICER as the dominant single source in a mixed or
Branch-B adjudication. Any materially different picture (e.g. MONOLITH
re-dominant, or diffuse below 0.400) re-adjudicates the branch BEFORE the
ST-534 lever is chosen.

## 4. Invariants (unchanged)

- Kiter verbatim; full director; cap 36000 ticks; DT 1/60.
- The 15 hit-event payload tags - no new tags.
- Branch rule source: design/e70-balance-followup-research.md sec.4 (frozen
  at I523; applied verbatim).
- Zero src changes in this story: .evidence-only harness, shipped bundle
  byte-identical (6,430,174 B / 203 expected).

## 5. Label hygiene (fixed vs sweep565)

- Header line prints the real seeds (56700+i) and the real rules file.
- Denominators print runs.length, not the stale "/10" (I565 registered
  label staleness; this clone fixes the prints).
- JSON (sweep567.json) + per-run lines remain the authoritative records.
