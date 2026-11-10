# Balance Audit - E8B new systems (I124 / ST-124)

Scope: the systems added during the E8B block (I117-I123) that touch score or fire-rate -
homing drone (ST-117), chain-split gen bonus (ST-120), shielded rock (ST-121), and the
permanent weapon levels 1-3 (ST-122/123). This pass audits their economy deltas for
inflation, exploit risk, and pacing, and lands one bounded parity fix.

## Scoring table (base size value, before combo/overdrive)

| Source          | Base | Bullets to kill | Value/bullet | Notes                              |
|-----------------|------|-----------------|--------------|------------------------------------|
| Rock L (gen0)   | 25   | 1               | 25           | splits to 2-3 M                     |
| Rock M (gen0)   | 50   | 1               | 50           | splits to 2-3 S                     |
| Rock S (gen0)   | 100  | 1               | 100          | smallest, no split                  |
| Rock S (gen2)   | 150  | 1               | 150          | +50% split gen bonus (gen1 +25%)    |
| Golden M        | 250  | 1               | 250          | 5x base, rim-only, never a fragment |
| Shielded M      | 400  | 3 (armor)       | ~133         | never splits, flat reward           |
| Mine            | 150  | 1               | 150          | chaser, wave 5+                     |
| Drone           | 200  | 1               | 200          | faster chaser, wave 8+              |
| Boss (Monolith) | 1000 | 40-88 (HP)      | ~11-25       | unique event, every 5 waves         |

- Near-miss graze: +15 flat per approach (does NOT feed the combo chain).
- Combo: 4s window, cap 15 -> multiplier 1.0x..2.4x. Overdrive: x2 score for 6s.
- Max single-kill (all stacked): shielded 400 x 2.4 x 2 = 1920; boss 1000 x 2.4 x 2 = 4800.
  Bounded by the combo cap + overdrive, so no unbounded per-kill inflation.

## Weapon DPS vs wave ramp (ST-122)

| Level | Wave  | Bullets/shot | Rate    | Bullets/s |
|-------|-------|--------------|---------|-----------|
| L1    | 1-4   | 1            | x1.0    | 5.5       |
| L2    | 5-9   | 2            | x1.0    | 11.0      |
| L3    | 10+   | 3            | x1.15   | ~19.0     |

Rock count is base(4) + growth(1)*n -> 14 at wave 10, 24 at wave 20, hard-capped at 36
(endless). Rock speed ramps 1 + 0.06n, capped 2.1x (about wave 18). L3's ~19 bullets/s
keeps pace with the wave-10+ content cap + rising S-bias: the power curve tracks the
difficulty curve rather than outrunning it.

## Balance Lever (bounded change this pass)

- Parity fix: the bullet-kill path applies the split per-gen bonus (gen1 +25% / gen2 +50%)
  but the BOMB path did not, so a gen-2 S cleared by bomb scored 100 instead of 150. This
  under-scored fragments on the bomb's clear sweep. Fixed: bombBlast now applies the same
  (1 + genBonus) multiplier (still a flat 400 for shielded, which never splits). One
  expression; no new tunable; locked by tests/bombGenBonus.test.js.

## Exploit Risk

- No score farm: kill value is fixed per rock; higher weapon DPS only raises throughput on
  harder waves (more rocks to clear) - the intended progression reward, gated by survival
  (L3 requires wave 10).
- Near-miss is per-approach (rearm x1.6 + spawn immunity 0.3s), so it cannot be spammed by
  firing; it rewards weaving, not bullets.
- golden and genBonus are mutually exclusive in practice (golden is rim-only and never a
  fragment, so a rock is never both) - no double-dip.
- Combo (cap 2.4x) + overdrive (x2) bound the multiplier; the per-kill ceiling is capped.

## Pacing

- Shielded rock (wave 4+) appears at L1: breaking its 3 armor at 5.5 bullets/s is ~0.55s of
  fire - readable, not a wall. At L3 it breaks in ~0.15s, but the screen is far busier then
  (36-rock cap + S-bias), so it reads as a high-value target, not free points.
- Drone (wave 8) + vortex (wave 8) coincide with L2 - seeker/vortex pressure lands once the
  gun is already a twin, keeping the challenge on evasion rather than raw firepower.

## Telemetry Need

- (None added.) The existing eventTally already counts kill/wave/nearmiss/hit/powerupDrop;
  a per-kill gen and shielded flag rides the kill event for future economy tuning.

## Risks

- The bomb now pays a small extra (+25% / +50%) on gen-1 / gen-2 fragments. Impact is
  bounded (the bomb is a panic tool and it only affects already-fragmented rocks). No pacing change.

## Verification evidence

- 279 existing tests + 4 new (tests/bombGenBonus.test.js): bomb gen-1 M = floor(50*1.25) = 62,
  bomb gen-2 S = floor(100*1.5) = 150, bomb/bullet parity for a gen-2 S, bomb on a gen-1
  shielded rock = flat 400 (no gen bonus). node --test green; npm run build exit 0.

## Next owner / decision

- I125 (ST-125) determinism re-verify: replay bit-identical with the new systems + this fix.
  No further E8-1 config change is warranted by this audit (DPS, values, and pacing are all
  within range); the balance stays as tuned.
