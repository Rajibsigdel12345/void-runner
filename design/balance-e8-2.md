# Balance Audit - E8-2 boss family (I144 / ST-144)

Scope: the E8-2 heavyweight systems - the Monolith (ST-055..ST-135, incl. enrage + radial
burst), the Warden (ST-136), and the new Splicer (ST-143) - audited together as one boss
family: HP curves, score ladder, bolt-pool pressure, and the Splicer's spiral
dodgeability. This pass lands one bounded fix: the Splicer's phase-1 spiral was an
effectively unthreadable wall.

## Boss family table (base values, before the endless-curve scale)

| Boss     | First wave | HP base/cap | HP curve (per 5-wave boss) | Score | Attack signature                        |
|----------|------------|-------------|----------------------------|-------|-----------------------------------------|
| Monolith | 5          | 40 / 88     | +12 from wave 10           | 1000  | slow homing, S-rock rings, radial burst, aimed bolts |
| Warden   | 5 (only while a Monolith is still alive) | 12 + 6 armor / - | flat | 400 | fast homing drone, no bolts |
| Splicer  | 10         | 30 / 72     | +8 from wave 15            | 600   | orbit + two-arm bolt spiral + aimed bolt |

- Alternation (ST-143): spawn 1/3/5... is the Monolith, spawn 2/4/6... the Splicer, so
  waves 5,15,25... are Monolith and 10,20,30... Splicer. The Warden is the fallback
  heavyweight on a 5th wave where a previous Monolith is still alive.
- Kill time vs weapon ramp (L1 5.5 / L2 11 / L3 ~19 bullets/s, ST-122): wave-5 Monolith
  (40 HP) at L2 = ~3.6s of clean fire; wave-10 Splicer (30 HP) at L3 = ~1.6s clean fire,
  ~4-8s in practice (the spiral interrupts DPS). Late game: wave-40 Monolith (88) ~4.6s
  clean vs wave-40 Splicer (70) ~3.7s clean - the Monolith stays the HP wall, the Splicer
  the dodge puzzle. Fight lengths track; no parity gap.
- Score ladder Warden 400 < Splicer 600 < Monolith 1000 matches the threat ladder (small
  drone < orbiting splicer < homing wall).

## Balance Lever (bounded change this pass)

The Splicer's phase-1 spiral was unthreadable. The linear gap between consecutive bolts
along an arm is boltSpeed x spiralEvery = 7 x 0.26 = 1.82u, while the ship's effective
obstacle width is ship diameter + 2 x bolt radius = 1.8 + 0.44 = 2.24u. A gap narrower
than the obstacle means the wall cannot be crossed at any fixed angle - the ship can only
hop between bolts in a zero-margin (actually negative-margin) precision pattern. That is
the wrong feel for a phase-1 boss: phase 1 should be learnable, enrage is where tightness
belongs. (Browser-confirmed: an idle ship standing at the arena center took 3 hits in
~10s of phase-1 spiral.)

Fix (two values, no new tunable):
- splicer.spiralEvery: 0.26 -> 0.6. Phase-1 gap = 7 x 0.6 = 4.2u = 1.88x the 2.24u
  obstacle - comfortably threadable. Shot rate 3.3/s (was 7.7/s).
- splicer.phase2.spiralEveryMult: 0.6 -> 0.65. Enrage gap = 7 x 0.39 = 2.73u = 1.22x the
  obstacle - tight, but fair. Shot rate 5.1/s.

The "spinning sun" read survives: the arm still turns 41 deg (p1) / 37 deg (p2) per shot,
so successive bolts form a visible spiral, not radial spokes. The contract is locked by
two invariant tests in tests/splicer.test.js (gap-vs-obstacle, worst-case pool occupancy)
so a later tune cannot silently re-close the wall.

## Pool pressure (enemyBullets: cap 24, life 4.0s, rim cull at 28u)

| Source / phase | Bolts/s (spiral + aimed) | Worst-case steady state (x 4.0s) | Measured live (rim-culled) |
|----------------|--------------------------|----------------------------------|----------------------------|
| Splicer p1     | 3.33 + 0.38              | 14.9                             | 9-12                       |
| Splicer p2     | 5.13 + 0.55              | 22.7                             | 15-20                      |
| Monolith p1    | 3.0 (12-bolt spike / 4.0s) + 0.45 | 13.8                    | (tuned I133/I134)          |
| Monolith p2    | 4.6 (12-bolt spike / 2.6s) + 0.70 | 19.8                    | (tuned I133/I134)          |
| Warden         | - (no bolts)             | 0                                | -                          |

Worst-case (full 4.0s life) Splicer p2 = 22.7 < 24 - under cap even before the rim cull
(bolts fired from holdRadius 11 die at the rim ~17u later, ~2.4s, so the real steady
state is ~11-20 as measured). Before the fix, phase-1 rate alone (7.7/s x 4s = 30.8)
exceeded the cap, so fire() silently dropped ~22% of the spiral - a broken pattern, not
a dense one.

## Exploit Risk

- No camping: the spiral covers all angles continuously, so neither the arena center nor
  the rim is a safe corner; the ship must stay mobile, which is the intended read.
- No bullet-spam exploit: Splicer bolts are undestroyable (as the Monolith's burst), so
  shooting the bolts is pointless; the Splicer itself still takes 1 damage/hit.
- Enrage is one-way (phase 1 -> 2 only), so a fight can never "de-enrage".
- The Warden remains the only bolt-free heavyweight: its 18 effective HP trades HP for
  speed + armor on the alternate waves - no exploit that makes it strictly better to face
  than the Splicer.

## Pacing

- Wave 5 (Monolith, 40 HP, L2): unchanged from the playtested I133/I134/I135 tuning.
- Wave 10 (first Splicer, 30 HP, L3): the fix makes phase 1 a learnable "weave the
  spiral" fight (~5-8s); enrage below 50% HP (15 HP) tightens to the 2.73u gap - the
  fight ends with the tension spike, as designed.
- Waves 15-40: the Splicer's +8/5-wave curve (cap 72 at wave 45) stays below the
  Monolith's (cap 88 at wave 30) because its pattern is more punishing - the intended
  inverse (more evasion demand, less HP wall).

## Telemetry Need

- (None added.) eventTally already counts bossFire/bossSpawn/bossDeath; a playtest watch
  item is the enemyBullets pool occupancy during a Splicer enrage (should stay < 24).

## Risks

- The phase-1 spiral now reads "open". If a later playtest finds it too easy, the lever
  is spiralEvery down (the invariant test floors it at 1.8x obstacle = 0.52s) or arms up
  - NOT boltSpeed up (speed changes the dodge window, not just the density).
- Unverified (labeled): no human playtest of the Splicer has happened yet (I143/I144
  smokes are structural). The numbers above are the design evidence; I145/I146 (test
  batch + browser verify) are the verification owners.

## Verification evidence

- 428/428 (was 426, +2 in tests/splicer.test.js: the gap-vs-obstacle invariant and the
  worst-case pool-occupancy invariant, both phases). npm run build exit 0.
- Browser smoke: dev :5173 ?nocache=144 - forced Splicer; phase-1 live bolt steady state
  9-12 (cap 24, no drops); forced enrage (hp 14, phase 2) - live bolts 15-20, still under
  cap; hit() verified to apply (30 -> 14) and to trigger phase 2; 0 NaN, console 0/0.
  Screenshot: .evidence/I144/I144_spiral_gap.png (threadable bolt spacing, SPLICER bar
  60%).

## Next owner / decision

- I145 (ST-145) test batch E8C (25+ new tests across the E8-2 systems) - the two new
  balance invariants are the template for the invariants the batch should add.
