# E77 "Beatability" Research - Endless High-Wave Beatability: Monolith Ring Lever + High-Wave Band Verification (I564, ST-530)

Authored under cgs-research. Companion to production/scope-check-E77.md.
ST-531..ST-532 do not start until this doc lands. Research items below are
LABELED (source + locator) and are NOT tree-verified; the live-tree numbers
cited in sec.1 ARE tree-verified this iteration (config reads, the I564 sweep
harnesses, wave-table audit, boss-cadence audit).

## User request (verbatim, standing queue)

- The deferred R7 residual from the E70 close (I527): "endless wave-13-20 beatability" - the I526 accept-with-documentation residual explicitly deferred to a future balance episode ("deferred to E70: phantom 2->3-hit HP or cloak/strike timing + endless wave-13-20 beatability"; R1 landed as E70, R7 is the remainder).
- Standing autonomous directive: proceed through the deferred residuals pass after pass without per-pass confirmation.

## 1. Measured current state (measured, I564)

- git: local main = origin main = a0de3aa (I563, wave-pacing fix; pushed and
  Pages-verified by the delegate; clean tree).
- dist 6,430,172 B / 203 files; ceiling 7,400,000 B (E75 renegotiation, in
  force); tripwire 7,297,600 B; CLOSE FLOOR E76 = 969,828 B (measured at
  I563).
- npm test 1,237/1,237; npm run build 0; vendor r187 4/4 EXACT
  (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- Fleet (unchanged by this epic - balance-only): 34 GLB / 4,009,384 B /
  90,977 t; caps 3,940 KB / 3,870 KB / 91,050 t.
- Wave table (tree-verified, config.js): mines 5, hunter 6, stinger 7,
  drone + gunship + belt-rocks 8, flyer 9, sentry 11, wasp 12, pod + phantom
  13, hauler 16, bulwark 17, sweeper 18, beacon 19. Boss cadence everyWave: 5
  (waves 5, 10, 15, ...); Monolith on 5/15/..., Splicer on 10/20/...;
  wave.stallTime 45 (I42 backstop, still the safety net after I563);
  belt rocks fromWave 8 (ST-138, persistent, exempt from the killable clear
  check since I563).
- Re-audit sweep564 (10 seeds 56400+i; full director; frozen I328 kiter;
  cap 36000 ticks; rules564.md): 10/10 died. Median death wave 5 (the I525
  pre-E69 audit on seeds 52700+i: median death wave 9). Tally (primary):
  MONOLITH 5 / bullet_unknown 1 / gunship 1 / rock_M 1 / SPLICER 1 / rock_S 1.
  H = 6/10 = 0.600. Per-wave: all 10 runs cleared waves 1-4 (median clear
  17.9-23.3 s); wave 5 started 10, cleared 4, median clear 25.8 s; the
  survivors' later waves show no run reached wave 11+.
- Robustness sweep564r30 (30 seeds 56400+i): 30/30 died. Median death wave 5.
  Tally (primary): MONOLITH 13 / SPLICER 5 / bullet_unknown 6 / gunship 3 /
  rock_S 2 / rock_M 1. H fraction 0.600 (18/30) EXACT. Death-wave
  distribution: wave5 x16, wave8 x4, wave9 x1, wave10 x8, wave15 x1.
  Exactly ONE run (seed 56414) reached the wave-13-20 new-fleet band: it
  cleared waves 13 and 14 and died at wave 15 to a Monolith bolt
  (285,274 pts / 817 kills - the best run of the 30).
- Known label staleness (registered, non-numeric - rules564.md sec.5):
  results564.txt header "52700+i" is a stale I525 template string (actual
  seeds 56400+i per the PER-RUN lines); results564r30.txt "H primary: 18/10"
  carries a stale denominator (the FRACTION line 0.600 (18/30) is valid).
  The JSON outputs are the authoritative records.

## 2. The C -> B branch shift (I525 vs I564, side by side)

- I525 (pre-E69 roster, seeds 52700+i, 10/10 died): median death wave 9;
  tally MONOLITH 3 / SPLICER 1 / gunship 2 / rock_S 1 / rock_L 1 / sentry 1 /
  bullet_unknown 1; H = 4/10 = 0.400, max single non-heavyweight gunship
  2/10 -> BRANCH C (diffuse wall; accept-with-documentation, no lever; the
  I526 disposition).
- I564 (current roster, seeds 56400+i): H fraction 0.600 in BOTH samples
  (6/10 and 18/30) -> BRANCH B (heavyweight wall), and within B the dominant
  source is MONOLITH (13 of 18 heavyweight kills in R30; the 6 bullet_unknown
  are all wave-5/10 speed-9 bolts - the only speed-9 shooter on those waves
  is the Monolith - so effectively Monolith ~17-19/30).
- Honest caveat: the call sits EXACTLY on the 0.600 threshold in both
  samples. It is not a seed knife-edge (30 seeds agree to the same fraction),
  but it is borderline by construction; the I565 re-measurement is the
  adjudicator (sec.4).
- Why the band changed: the E69/E75 ships (phantom 13+, hauler 16+, bulwark
  17+, sweeper 18+, beacon 19+) are inert below wave 13 - their fields are
  empty before firstWave, so they add no threat, no bolts, and no collisions
  to the wave-1..12 band. The only systematic low-band changes vs I525 are
  (a) the I563 earlier wave clears (waves end as soon as killables die, so
  later waves arrive earlier on the clock) and (b) seed variance. The median
  9 -> 5 move is therefore mostly (a)+(b); the ROBUST signal is the H
  fraction 0.400 -> 0.600 with Monolith dominance.
- Reframing of R7: "wave-13-20 beatability" is currently not the live wall -
  the kiter reached that band in 1/30 and died there to the Monolith again
  (wave 15). The live wall is the wave-5/15 Monolith ring-burst window. The
  I525 note still holds: "the wave-5 Monolith is a WINDOW problem not an HP
  wall (kiter killed it 7/10 but 4/10 died to its bolts while alive or just
  after)". E77 therefore: (a) loosen the window with the one pre-registered
  lever, (b) then re-measure whether the wave-13-20 band is itself
  beatably-reachable (pre-registered acceptance (b) in sec.4).

## 3. LABELED research (boss bolt-cadence design)

- BAL-1 (fair-difficulty convention, LABELED): a great boss fight is built
  on "presentation, gameplay, and fair difficulty" - difficulty that a
  skilled pilot can BEAT, not a sustained-damage wall (Seany Salami, "The 50
  Best Boss Fights I've Ever Played", 0:43:26 passage,
  youtu.be/q5HanXmq6Ic; 74K views, 2026-11-17). A sustained ring-burst
  cadence of 2.0 s with 8-rock bursts plus aimed bolts holds near-continuous
  arena coverage; at the kiter's 12 u standoff and its 90-tick (1.5 s) weave
  period, no safe strike lane exists - which is exactly what the 28/30
  wave-5/10/15 deaths show.
- BAL-2 (arena-survivor ramp convention, LABELED): wave-based arena games
  ramp density, but the difficulty spikes that stick in player memory are
  pattern windows (a new pattern you must learn), not raw bullet volume
  (GDQuest, "Your First 3D GAME From Zero in Godot 4 - Survivor Arena FPS",
  youtu.be/NJJNWGD25rg; 484K views; directional only). The Monolith ring IS
  the pattern window of this game's endless mode; easing its cadence makes
  the wave-13+ patterns (phantom cloak-strike, sweeper fan, beacon charge)
  the readable next lesson instead of an unreached wall.
- BAL-3 (lever analysis, tree-verified): the E70 frozen Branch-B lever [1]
  (design/e70-balance-followup-research.md sec.4, frozen I523/I525) is
  boss.ringEvery 2.0 -> 2.5 (config.js L273; ringCount 8 and the phase-2
  ringEveryMult 0.6 stay). It is the smallest pre-registered change that
  directly reduces the Monolith ring-coverage duty cycle: 1 - 2.0/2.5 = 20%
  more gap per cycle. Alternatives considered and REJECTED:
    (a) ringCount 8 -> fewer rocks: changes per-burst RNG consumption ->
        daily-salt churn beyond timing (rejected: determinism surface).
    (b) Monolith HP: I525 shows the kiter KILLS the Monolith 7/10 pre-E69 -
        HP is not the wall (rejected: wrong variable).
    (c) bolt speed: shared by the E57/visual speed contract across the fleet
        (rejected: cross-fleet regression surface, out of scope).
- BAL-4 (cross-mode effect, tree-verified): boss.ringEvery is SHARED config.
  The campaign L1 boss (monolith, waves 1-5) and L3 boss (monolith-prime,
  waves 11-15) use the same ring cadence, so the lever relaxes their ring
  phase by the same 20% too. Registered as a documented cross-mode effect of
  a shared lever (same house pattern as the I563 campaign note): the I565
  pins (causal495 seed-9876 wave-2 no boss; playframe menu-only) predate any
  boss, so the effect is invisible to the gates; the campaign consequence is
  L1/L3 bosses ~20% easier in their ring phase - a documented residual
  observation, NOT an E77 revert trigger (E77 acceptance is endless-only).
- BAL-5 (determinism note, tree-verified): the lever changes ring-burst
  TIMING, so the shared-RNG draw order shifts after the first boss wave
  (wave 5) -> post-wave-5 content in a seeded run (incl. DAILY) differs from
  pre-lever builds. This is a documented salt shift, not a regression: the
  daily is a fresh-run-by-design mode (no pinned daily sequence exists), and
  every regression pin predates wave 5 (sec.6). Zero pins to re-pin are
  EXPECTED; any drift is investigated and re-pinned WITH MEASUREMENT only.

## 4. Pre-registered lever + expected effect + acceptance

- LEVER (frozen, E70 Branch-B lever [1]): src/core/config.js
  boss.ringEvery: 2.0 -> 2.5. Applied at I565 (ST-531) WITH MEASUREMENT.
- Expected effect (hypothesis, to be measured): Monolith ring coverage duty
  cycle -20% per cycle; the kiter finds a strike lane in the widened gap;
  median death wave rises from 5; some runs reach the wave-13-20 band.
- ACCEPTANCE (pre-registered; all three must hold to close E77 green):
  (a) 30-seed sweep565 median death wave rises 5 -> >= 8;
  (b) >= 1/30 runs reaches wave >= 13 (the new-fleet band becomes reachable);
  (c) the 5-harness regression gate stays EXACT, verified WITH MEASUREMENT
      (re-pin only on measured drift, house rule).
- If (a) and (b) both fail: C1 - revert the lever (2.5 -> 2.0), E77 closes
  as accept-with-documentation on the re-characterized wall (the Monolith
  window survives the first lever; the follow-up episode considers the next
  E70-ladder lever). No second-fiddle pass within E77 (frozen E70 policy).
- If (b) holds but (a) fails: C2 - ship the lever (the wall demonstrably
  moved: the band is now reachable) + document the wave-13-20 density as the
  NEW live wall (residual for the follow-up episode).
- If all three hold: E77 closes green; the wave-13-20 density is re-audited
  in the follow-up episode ONLY IF the I565 sweep shows the kiter now dying
  there in >= 1/3 (registered observation, not an E77 scope item).

## 5. Story map

- ST-530 (I564, NOW): E77 open + measured re-audit. Docs-only, zero src.
  (This iteration: rules564.md + this doc + scope-check-E77.md + bookkeeping.)
- ST-531 (I565): apply the frozen lever WITH MEASUREMENT - config-only
  change + 30-seed sweep565 + acceptance (a)/(b) + quality bar 6/6.
- ST-532 (I566): G77.0 close gate - 5 fresh harnesses + CLOSE FLOOR E77
  re-derived WITH MEASUREMENT + AGENTS.md refresh. E77 closes.

## 6. Pin safety (all EXPECTED EXACT; verified WITH MEASUREMENT at I565)

- causal495 (dist :4200, seed 9876, wave 2, no boss): ringEvery is never
  read on the pinned path (no boss before wave 5) -> EXACT.
- causal483 (dev :5173, ~45 s demo window, waves 2-3, no boss) -> EXACT.
- playframe483 + playframe491 (dev :5173, MENU window) -> EXACT.
- pwa491 (dist :5199, offline boot, MENU) -> EXACT.
- Rationale: the lever's only behavioral surface is the Monolith ring-burst
  timer, which first fires at the first boss wave (wave 5 in endless; wave 3
  in campaign L1 - outside every pin window). Any drift = investigate,
  re-pin WITH MEASUREMENT with a registered reason (house rule).

## 7. dist policy

- I564 (docs-only): dist stays byte-identical 6,430,172 B / 203 (re-measured
  from disk before commit).
- I565 (one config float, 2.0 -> 2.5, same digit count): dist delta ~0-2 B.
- Ceiling 7,400,000 B HOLDS (no renegotiation this epic); tripwire 7,297,600
  B HOLDS; CLOSE FLOOR E77 = 7,400,000 - fresh I566 dist, re-derived WITH
  MEASUREMENT at the close gate.

## 8. Risks

- R-1 Borderline threshold call: H is EXACTLY 0.600 in both samples.
  Mitigation: 30-seed robustness (consistent fraction, not a knife-edge) +
  the I565 pre-registered re-measurement adjudicates by observed wall motion,
  not by the fraction alone.
- R-2 RNG stream shift post-wave-5 (daily salt shift, BAL-5): documented,
  non-regression; all pins predate wave 5; no daily pin exists.
- R-3 The lever fixes the window but exposes the wave-13-20 density as the
  next wall: pre-registered as acceptance (b) + the C2 documented-residual
  path (no second-fiddle pass within E77).
- R-4 Cross-mode effect on campaign L1/L3 bosses (BAL-4): registered,
  documented residual observation; not a revert trigger.
- R-5 Docs-only iteration drifts dist or BOM: disk re-measure + BOM-delta-0
  check before commit (quality bar).
