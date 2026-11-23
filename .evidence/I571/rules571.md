# I571 / ST-537 - E79 L-A POST-LEVER ACCEPTANCE SWEEP (frozen rules)

Frozen BEFORE running sweep571. Open story: L-A boss retirement is
IMPLEMENTED in src (config.js cfg.boss.retireAfterWaves 3 endless-only;
game.js wave-start hook BEFORE spawnBossForWave + bossRetire() emit + null,
NO split/NO score/NO RNG; main.js bossRetire FX = modest boss-palette
fizzle + one expanding ring, reuses the existing SFX cue droneDecay; 6 new
unit tests in tests/bossRetire.test.js). This sweep is the acceptance
measurement on FRESH seeds.

## 1. Protocol (restated from .evidence/I525/rules525.md as extended by rules564/569)

- FULL director from wave 1 (NO isolation): `const w = new World(new RNG(seed)); w.begin();`
- Cap: 36000 ticks (600 s) at DT = 1/60.
- Pilot: the I328 frozen kiter, VERBATIM (12 u standoff, weave
  Math.sin(t/90)*4 - ABSOLUTE tick function, fire < 18 u, x2 repulsion,
  no-target -> center thrust + fire t%30). UNCHANGED from sweep569.mjs.
- Run ends at w.gameOver (lives -> 0) or the cap. A capped run is recorded
  with died=false and contributes no killing blow.
- Killing-blow attribution: the 15 payload tags on the 'hit' events (I525,
  permanent telemetry) + clsPrimary resolution per the I525 rules.
  UNCHANGED - including the in-flight-bolt attribution after a retirement
  (a speed-9 bolt that outlives its retired boss resolves to sentry or
  bullet_unknown per the frozen resolve() ladder - no new rule).
- Threat list: the rules564 extended list. UNCHANGED.
- Harness extension (REGISTERED, measurement-only): each run records a
  `retires` array {tick, kind, wave} from the new 'bossRetire' core event.
  This is telemetry capture on an existing event - it draws no RNG, does
  not alter the sim, and does not change attribution.

## 2. Seed set (I571)

- sweep571: 30 seeds 57100+i, i = 0..29. FRESH seeds (not nested in
  56900). Independent of the pre-lever sweep569 picture (median 10,
  wave-10 cluster 16/30, SPLICER 14/30, H = 0.667).

## 3. L-A acceptance (FROZEN at I569 - evaluated verbatim on sweep571)

- (a) median death wave >= 10
- (b) wave-10 cluster (deaths on wave 10) <= 7/30
- (c) max single killing-blow source (primary tally) < 0.300 -
      >= 0.400 -> epic FAILURE -> C1 (full L-A revert + accept-with-
      documentation + residual to the E80+ backlog WITH the full
      measurement record + close G79.0 as an accept round);
      [0.300, 0.400) = borderline, registered, PASSES.
- (d) >= 2/30 reach wave >= 13
- (e) 5-harness gate EXACT (causal495 3 arms + causal483 + playframe483/491
      + pwa491; re-pin ONLY with measured drift, I482 pattern). Run in the
      same iteration as this sweep (I565 pattern), labeled CLOSEGATE571.

Pre-L-A baseline for context: sweep569 median 10, wave-10 cluster 16/30,
max single source SPLICER 14/30 = 0.467, 3/30 at wave >= 13.
Pin safety (pre-registered I569): all five harness pins live at wave <= 2;
retirement first fires at wave 8 start and draws ZERO RNG -> EXPECTED
EXACT, no re-pin.

## 4. L-B trigger read (FROZEN at I569 - decided at I572 from sweep571 data)

- wave-8/9 band = deaths on waves 8 or 9 with clsPrimary in
  {gunship, rock_L, rock_M}; TRIGGER if band >= 4/30 AND median < 11.
  results571.txt prints the band count + the verdict line so the ST-538
  decision is a direct read (apply L-B + sweep572 / story VOID).

## 5. Invariants (unchanged)

- Kiter verbatim; full director; cap 36000 ticks; DT 1/60.
- The 15 hit-event payload tags - no new tags.
- The E70 branch-adjudication block is RETAINED in sweep571.mjs verbatim
  (informational for the E80+ residual registration); L-A acceptance is
  the (a)-(e) set above, NOT the branch block.

## 6. Label hygiene

- Header line prints the real seeds (57100+i) and the real rules file
  (.evidence/I571/rules571.md).
- Denominators print runs.length, not a stale constant.
- JSON (sweep571.json) + per-run lines remain the authoritative records.
