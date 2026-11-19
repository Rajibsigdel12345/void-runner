# I524 / ST-490 - PRE-REGISTERED BALANCE RULES (written BEFORE measurement)

Source story (epics.md): "ST-490 (I524) R1 fix WITH MEASUREMENT". Authority:
design/e70-balance-followup-research.md sec.3 (I523, FROZEN): Option B primary
(phantom.enterDur 1.2 -> 2.0 s), Option A fallback (phantom.hp 2 -> 3), 5-step
decision rule. This file freezes the measurement contract BEFORE the first run.

## Baseline re-confirm (decision rule step 1)

- Harness: .evidence/I524/balance524.mjs - mechanically spliced from
  .evidence/I521/seed62100.mjs (pilots + threat scan + runIsolated byte-identical;
  only the trailing runner block is replaced + one fs import inserted; verified by
  splice524.cjs). Node-only, 60 Hz fixed DT, no DOM, no three.
- Conditions + seeds (identical to I521's formula for these conditions):
  phantom1-kiter  62100+i x100   (the I521 baseline seeds)
  phantom1-aggro  62100+i x100   (R5)
  phantom2-kiter  72100+i x100   (= 52100 + 2*10000 + i, the I521 phantom2 formula)
- Expected baseline (I521 AFTER measurement): phantom1 kiter median TTK 1.4667 s,
  p90 2.8167 s, expired 0, hitRuns 0, killed 100; phantom2 kiter 100% bothKilled,
  median 5.05 s.
- INTEGRITY GATE: if the baseline run does not reproduce median 1.4667 s with
  expired 0 / hitRuns 0 / killed 100 -> STOP, do NOT move the lever; investigate
  harness drift first.

## Rules (evaluated EXACTLY as written, no post-hoc adjustment)

R1 phantom1 (kiter, 100 seeds, 62100+i): median TTK in [2.0, 12.0] s AND
   expiry rate <= 15% AND hit rate <= 35%.
R2 phantom2 (kiter, 100 seeds, 72100+i): bothKilled (2/2) rate == 100% AND
   median time-to-clear <= 20 s. (I521 baseline: 100% / 5.05 s - "R2 holds" =
   no regression vs baseline.)
R5 pilot validity (phantom1, 100 seeds, 62100+i): median TTK(aggro) <=
   median TTK(kiter) + 1.0 s.

## Lever sequence (frozen, research doc sec.3)

1. Re-confirm the baseline (above).
2. Option B: src/core/config.js phantom.enterDur 1.2 -> 2.0 (ONE line + ONE-line
   comment). Re-measure R1/R2/R5 with the same harness + seeds (tag optionB).
3. R1 in band AND R2 holds AND R5 holds -> SHIP: spec Appendix B (E70) in
   design/e69-enemy-spec.md records BEFORE/AFTER; residual R1 CLOSED.
4. Else: revert enterDur to 1.2; apply Option A phantom.hp 2 -> 3 (the
   pre-registered fallback, NOT a second fiddle pass); re-measure the same
   criteria (tag optionA); re-pin tests/phantom.test.js hp assertion 2 -> 3
   WITH measurement (it is a test-side pin, allowed by the re-pin-with-
   measurement norm).
5. If both fail -> ACCEPT-WITH-DOCUMENTATION (E69 precedent at I522); residual
   R1 moves to the E71+ backlog with the full measurement record.

## Test-pin pre-check (done BEFORE any config move, recorded)

- tests/phantom.test.js cycle pin = orbitDur+cloakDur+driftDur+strikeDur == 8.2
  (enterDur NOT in the sum) -> UNAFFECTED by Option B.
- tests/phantom.test.js assert.equal(s.hp, 2) -> UNAFFECTED by Option B;
  re-pinned with measurement only in the Option A branch.
- src grep: enterDur consumed only at src/core/phantom.js:80 (the phase
  transition); no render-layer usage; the other two config enterDur values
  (hauler 2.0 / bulwark 1.5) are distinct fields, untouched.

## Pin-safety expectation (frozen)

- enterDur/hp affect only wave-13+ phantom behavior (phantom.firstWave 13) ->
  the pin windows (causal495 wave 2 / 36.15 s; playframe A = MENU; B = frame 50
  ~ wave 1) draw zero changed RNG -> EXPECTED EXACT; re-pin ONLY with
  measurement on measured drift.
- End-of-story quality bar: npm test green; build exit 0; dist < 6,100,000 B
  (measured delta reported); vendor pins EXACT (no vendor change ->
  git diff vendor/ empty); BOM delta 0; pins re-run: causal495 3-arm + causal483
  + playframe483/491 + pwa491 (one headless tab per harness, all servers killed
  after, ECONNREFUSED verified).