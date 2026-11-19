# I521 / ST-487 - PRE-REGISTERED BALANCE RULES (written BEFORE measurement)

Source story (epics.md verbatim): "ST-487 balance + flow (deterministic-seed TTK/beatability,
endless tuning, reduced-motion telegraphs)". Authority: the ONLY story allowed to move
e69-enemy-spec.md sections 3-5 stat values, WITH measurement + a spec appendix.
Open deviation to adjudicate (I518): hauler spec firstWave 15 = boss wave (boss.everyWave 5),
effective endless debut wave 16.

## Measurement protocol (frozen)

- Harness: .evidence/I521/balance521.mjs (node-only, no DOM, no three). 60 Hz fixed DT.
- Fresh World per run: new World(new RNG(seed)); w.begin(); then for isolated conditions
  w.waves.state = "idle" (director never spawns - verified: step() early-returns on idle)
  and w.waves.wave = 12 (weapon L3 context: all three types debut at wave >= 13 where every
  live pilot holds weapon level 3 (minWave 10) - debut-wave fairness).
- Pilots: the I328 frozen trio (kiter / aggro / cautious), adapted only by extending the
  threat scan to phantom/hauler/bulwark lists + mines (avoid-only). Pilots are stateless,
  RNG-free, deterministic.
- Seeds: 52100 + condition*10000 + i (i in 0..99) for isolated; 52700 + i (i in 0..9) for the sweep.
- Run termination: condition resolved (all spawned targets dead, killed or self-expired) OR
  w.gameOver OR tick cap 5400 (90 s). TTK = spawn tick -> last-target-dead tick (s).
- Self-expiry (maxAge) without kill = TTK failure for that run (recorded as expiry).
- Bulwark mechanics tallied from events: bulwarkNegate count, bulwarkStun count.

## Rules (evaluated EXACTLY as written, no post-hoc adjustment)

R1 phantom1 (kiter, 100 seeds): median TTK in [2.0, 12.0] s AND expiry rate <= 15%
   AND hit rate (runs with >= 1 ship hit) <= 35%.
   Rationale: 2-hit kill vs a 11-u flank orbiter targetable ~71% of its 8.2 s cycle
   (opacity > 0.5). Enemy-scale band; the I324 12-45 s precedent is boss-scale.
R2 phantom2 (kiter, 100 seeds): both-killed rate >= 80% AND median time-to-clear <= 20 s.
R3 hauler1 (kiter, 100 seeds): median TTK in [4.0, 20.0] s AND hit rate <= 25%
   AND kill rate >= 85%. Rationale: 12 hits on a 3.5 u/s mover + mine field every 4 s.
R4 bulwark1 (kiter, 100 seeds): median TTK in [6.0, 40.0] s (wide: flanking required,
   18 hits, stateless pilot) AND kill rate >= 60% AND bulwarkStun observed in >= 30%
   of killed runs (negation->stun loop must actually engage).
R5 pilot validity (all 4 conditions): median TTK(aggro) <= median TTK(kiter) + 1.0 s.
   If the dive pilot cannot kill at least as fast as the mid kiter, the pilot or the
   enemy is broken; investigate before any tuning.
R6 score ladder (static, from CONFIG): 250 (phantom) < 400 (hauler) < 500 (bulwark)
   < 600 (splicer); phantom 250 == stinger 250 is the INTENDED same-rung (documented in
   spec 3; both are "fast + fragile-ish" rungs). A ladder inversion FAILS the rule.
R7 endless sweep (kiter, 10 seeds, full run from wave 1, cap 36000 ticks = 600 s):
   wave-20 reached in >= 6 of 10 runs.
R8 no cliff (same sweep, same run): median non-boss wave-clear time over waves 13-20
   <= 2.5x the median non-boss wave-clear time over waves 1-12 (boss waves 15/20
   excluded from both medians, reported separately).

## Adjudication policy (frozen)

- ALL of R1-R8 pass on frozen stats -> NO tuning pass; spec Appendix A records
  "frozen values confirmed, no moves" + the measurement tables.
- Any rule fails -> at most ONE tuning pass, smallest lever first (priority order):
  (1) bulwark.shieldStunDur / shieldHitsToStun, (2) hauler.mineEvery / hp,
  (3) phantom.orbitR / targetOpacity, (4) firstWave gates (last resort).
  Every move ships WITH before/after measurement, frozen in spec Appendix A (ST-487).
- If the one allowed pass does not fix the failure: ship the measurement, document the
  residual as an open item for ST-488 (G69.0 close gate) - no second fiddle pass.
- Hauler wave-15 deviation (pre-registered decision): if R3 PASSES, move CONFIG
  hauler.firstWave 15 -> 16 (make the gate honest: wave 15 can never spawn a hauler
  because it is a boss wave; behavior is bit-identical since the effective debut was
  already 16) - WITH measurement note in Appendix A. If R3 FAILS, firstWave -> 16 as
  part of the tuning pass (same bit-identical effect, plus the other levers).
  Either way the gate comment in game.js spawnHaulerForWave is updated to record the
  adjudication (comment-only, no logic change).

## Reduced-motion telegraphs (R9, report-only)

Core telegraph TIMING is DOM-free (src/core is three-free/DOM-free by convention) and is
therefore identical under reduced-motion; RM only affects render presentation. ONE
headless-browser probe (single tab, closed after) verifies the three telegraphs remain
legible under RM (charge glow / hatch glow / core-charge emissive above a visibility
threshold during the snap period). Report-only: no rule, no tuning authority.

## Pin-safety expectation (frozen)

causal495 window (wave 2, 36.15 s) and playframe (wave 1) never reach the wave-13+
gates -> both must stay EXACT (no re-pins) regardless of the tuning outcome.
