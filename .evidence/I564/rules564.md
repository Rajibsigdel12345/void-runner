# I564 / ST-530 - R7 KILLING-BLOW RE-AUDIT (frozen rules)

Frozen BEFORE running the sweeps. Re-audit story: ZERO src changes (harness +
docs only); the frozen I328 kiter and the I525 protocol are re-run against the
current post-E69/E75/E76 roster to re-adjudicate the E70 frozen branch rules.

## 1. Protocol (restated from .evidence/I525/rules525.md)

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

## 2. Seed sets (I564)

- sweep564: 10 seeds 56400+i, i = 0..9 (the primary re-audit; mirrors the I525
  10-seed shape so the two audits are directly comparable).
- sweep564r30: 30 seeds 56400+i, i = 0..29 (the robustness companion; the
  10-seed set is its first 10, so the two runs are nested, not independent).
  The 30-seed fraction thresholds de-noise borderline 10-seed calls:
  H fraction >= 0.600 -> Branch B (heavyweight wall);
  H fraction <= 0.400 -> Branch C (diffuse, accept-with-documentation);
  0.400 < H < 0.600 -> Branch A (mixed; adjudicate by the dominant single
  source).
  Heavyweights (H) = MONOLITH, SPLICER, WARDEN (the boss_splicer bolt source
  counts as SPLICER).

## 3. Deltas vs the I525 rules (the only rule changes)

(a) Threat list extended with the E75 high-wave ships:
    - sweeper (wave 18+; fan bolts, bolt speed 8 pre-speedMul, weight 1.5)
    - beacon (wave 19+; weight 2; PHYSICAL-only threat - it never fires a
      direct bolt, its escort drones do; the drone bolts are attributed to
      their drone class, not 'beacon')
    Both fields are EMPTY before their firstWave, so the wave-1..17 band is
    bit-identical to the I525 protocol (no new threat exists below wave 18).
(b) Speed-8 bolt attribution: a speed-8 bolt is attributed to 'sweeper' if a
    live sweeper is in the field at hit time, else to 'mine' (documented
    mine/sweeper bolt-speed collision - both are 8 pre-speedMul; the bias is
    toward the newer source; any affected row is flagged in the tally notes).
(c) waveTable output widened to waves <= 24; the per-wave report covers
    waves 1-20 (startedRuns / clearedRuns / medianClearSecs / plannedContent).
(d) R30 adds the FRACTION H line + the explicit branch decision from the
    fraction thresholds in sec.2.

## 4. Invariants (unchanged from I525)

- Kiter verbatim; full director; cap 36000 ticks; DT 1/60.
- The 15 hit-event payload tags (I525 permanent telemetry) - no new tags.
- Branch rule source: design/e70-balance-followup-research.md sec.4 (frozen
  at I523; applied verbatim here).
- Zero src changes in this story: the sweeps are .evidence-only harnesses
  (sweep564.mjs / sweep564r30.mjs), so the shipped bundle is byte-identical.

## 5. Known label staleness (registered, non-numeric)

- results564.txt header still prints "(10 seeds 52700+i, ...)" - a stale
  I525 template string; the actual seeds are 56400+i per the PER-RUN lines.
- results564r30.txt prints "H primary: 18/10" with a stale denominator; the
  valid number is the FRACTION line: 0.600 (18/30).
These are harness print-label artifacts, not measurement defects; the per-run
lines and the JSON outputs (sweep564.json / sweep564r30.json) are the
authoritative records.
