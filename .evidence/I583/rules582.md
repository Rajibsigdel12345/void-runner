# I583 / ST-550 - E82 POST-LEVER VALIDATION (frozen rules)

Frozen BEFORE running sweep582. This story applies the FROZEN E82 lever
(boss.burst.every 4.0 -> 4.8, src/core/config.js:300, one line - a 1-char
literal swap 4.0 -> 4.8; dist size EXPECTED byte-identical 6,430,174 B / 203)
confirmed applicable by Branch B at I582 (sweep581: B56 12/30 >= 12/30),
then validates it on fresh seeds with the FROZEN E82 acceptance (a)-(e).
Everything else in this story is .evidence-only (harness + docs).

## 1. Protocol (lineage of .evidence/I582/rules581.md, VERBATIM)

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

## 2. Seed set (I583)

- sweep582: 30 seeds 58200+i, i = 0..29. FRESH seeds (not nested in
  56400/56500/56700/56900/57100/57300/57700/58100) so the post-lever
  validation is an independent measurement of the lever's effect.

## 3. Acceptance (FROZEN, verbatim from design/e82-monolith-wave5-wall-ii-research.md sec.6)

Metrics (frozen; code VERBATIM from sweep581.mjs per sec.5):
- B56 = deaths on wave in {5,6} (any attribution).
- M56 = deaths on wave in {5,6} AND clsPrimary == MONOLITH (E81 def -
  R-6 comparability only, NOT adjudicated on).
- M56' (REFINED, frozen pre-run at I581) = deaths on wave in {5,6} AND
  (clsPrimary == MONOLITH OR (clsPrimary == bullet_unknown AND a
  monolithDeath tick exists within 180 ticks (3 s) BEFORE the player
  death)).
- COMPARABILITY NOTE (R-6): M56' is NOT the same metric as the E81 M56;
  both are reported wherever E82 numbers appear so the E81 record stays
  auditable.

Baselines (pre-lever): sweep577 (I578): B56 11/30, M56 7/30, M56' 11/30,
median death wave 9, reach wave >= 13: 6/30 (best wave 15). sweep581
(I582 re-audit): B56 12/30, M56 11/30, M56' 12/30, median death wave 8,
reach wave >= 13: 1/30 (best wave 14).

FROZEN acceptance on sweep582 (30 fresh seeds 58200+i):
- (a) B56 <= 9/30 (baseline 11/30).
- (b) M56' <= 7/30 (baseline 11/30).
- (c) median death wave >= 9.
- (d) >= 3/30 reach wave >= 13 (sweep577: 6/30, best wave 15 -
  non-regression floor).
- (e) 5-harness gate EXACT no re-pin (causal495 dist :4200 / causal483 /
  playframe483 / playframe491 dev :5173 / pwa491 dist :5199; runner
  self-kills servers; EXPECTED EXACT - the burst timer is time-driven,
  ZERO extra RNG; all 5 harness pins wave <= 2; Monolith first spawns
  wave 5).

C1 (frozen): if ANY of (a)-(d) fails -> git restore src/core/config.js
(revert the one line) + accept-with-documentation + the E81
pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed
7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6, preference order, ONE chosen by
that epic's own frozen rules] to E83+ + G82.0 closes as accept round.

## 4. Expected outcome (pre-registered)

The lever slows the radial-burst cadence 4.0 s -> 4.8 s (-16.7% temporal
density; phase-2 cadence via everyMult 0.65: 2.6 s -> 3.12 s), lowering
the on-screen bolt density in the Monolith fight window (the measured
defect per I581: burst-class 10/11 band deaths, NOT TTK, NOT the rock
ring). Expect (a) B56 <= 9/30 PASS, (b) M56' <= 7/30 PASS, (c) median
death wave >= 9 PASS, (d) >= 3/30 reach wave >= 13 PASS (sweep577 was
6/30; sweep581 was 1/30 at the bottom of its pre-lever band). If C1
fires, the wave-5 wall is documented as a teach/pacing question with the
burst-cadence lever exhausted for E82.

## 5. Invariants (unchanged)

- Kiter verbatim; bullet attribution code verbatim; full director;
  cap 36000 ticks; DT 1/60.
- The 15 hit-event payload tags - no new tags.
- Metric code B56/M56/M56' VERBATIM from sweep581.mjs (same filter
  predicates, same 180-tick window, same bossDeaths source).
- Branch block source: this file's acceptance (a)-(e) - supersedes the
  cloned harness's branch-decision block ONLY for the branch block
  (house pattern, rules581.md sec.5 lineage).
- Single src change in this story: the lever line (config.js:300).
  Nothing else in src/assets/vendor/render/i18n.

## 6. Label hygiene

- Header line prints the real seeds (58200+i) and the real rules file.
- Denominators print runs.length, not a stale constant.
- The acceptance line prints ALL inputs (B56, M56, M56', median death
  wave, reach >= 13) so the decision is auditable from results582.txt
  alone.
- JSON (sweep582.json) + per-run lines remain the authoritative records.