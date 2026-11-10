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

## Post-gate playtest (I129)

A deterministic headless bot (scripts/playtest.mjs, DOM-free: World + RNG + math.js only; leads targets with bullet-flight-time prediction, flees any threat under 3.0 s time-to-impact, strafes the boss, chases drops with a 3 s timeout) ran against the G8.1-closed build: 8 forced-wave scenarios (w8-w16; boss waves 10/15 + cumulative drone pressure, 150 s cap) and 3 full 22-33 minute runs (seeds 11/22/33).

### Summary

- Finding 1 (fixed in I129): drone accumulation spikes onto boss waves. Drones spawn 1/wave from 8 (cap 6, no despawn), so by wave 15 up to 6 seekers stack on top of the Monolith. w15 (boss + 6 drones) was the only forced wave the bot died on (3 hits / 18 s); w10 (boss + 3) survived (2 hits). Fix: drone.maxAge = 30 s seeker battery; before/after arm data below.
- Finding 2 (verified, no change): shielded rocks price correctly. Armor absorbs per shielded kill ~2.0 (shH/shK in every run), i.e. 4 shots/kill x 400 pts = 100 pts/shot = 2x a plain M (50/shot). Intended risk-reward is working.
- Finding 3 (verified, no change): the L3 weapon ramp is healthy. Forced-wave clears drop from 18.9-32.2 s (L1/L2 waves 8-9) to 14-17.7 s at L3 (55-101 kills/wave, waves 11-16) while the speed ramp hits its 2.1 cap at wave 13 - progression is rewarded and pressure is maintained.
- Finding 4 (harness limitation, labeled not a balance finding): the bot dies at the wave-5 boss in 2/3 full runs (it cannot predict the bullet ring; a human can). Full runs rarely reach the drone phase, so the forced-wave scenarios are the valid probe.

### Balance Lever (I129)

drone.maxAge = 30 (game-time s; slow-mo scaled, consistent with drone motion). Before/after arms of scripts/playtest.mjs (pre-fix arm = cfg override maxAge=Infinity; cumulative drones pre-aged 18 s per prior wave):

| scenario | arm | w10 hits | outcome |
|---|---|---|---|
| forced w15 (boss + 6 cumulative) | pre-fix | - | 3 hits / 17.9 s, died on w15, 6 drone kills, 0 decays |
| forced w15 | post-fix | - | 3 hits / 15.8 s, 2 drone kills, 4 decays on wave entry |
| forced w10 (boss + 3) | pre-fix | 2 | died at w13 |
| forced w10 | post-fix | 1 | survived to w15 |

Post-fix worst-case boss wave = boss + 2 young drones = the survivable pre-fix w10 experience. The residual w15 hits are boss rings (Finding 4), not drone pressure.

### Exploit Risk

- None new. A decayed drone gives no score and no drop (same as its absence); the player cannot extend or reset the battery. The decay is a pure dt comparison - no RNG draws, determinism preserved (tests/droneMaxAge.test.js).

### Pacing

- No wave-pacing change: drones only leave, never arrive, and fresh-drone scenarios are unchanged (14-32 s wave window < 30 s battery). In full runs, drone pressure peaks at ~2-3 seekers during boss waves instead of 6.

### Telemetry Need

- droneDecays per run is now tallied by the playtest harness (and the browser eventTally). If a later playtest still shows boss-wave spikes, that metric is the one to watch.

### Risks

- A drone that self-destructs without a kill is a small loss for a player tracking it; the cyan fizzle + seeker-zap cue make it readable. If it reads as cheap, the lever is maxAge up (35-45 s), not removing the mechanic.
- GDD: the homing drone (E8B) still has no GDD section (I132 addendum); config comment + this doc carry authority until then.

### Verification evidence

- 330/330 (was 324; +6 in tests/droneMaxAge.test.js): decay exactly at maxAge and not before, slot freed on decay, no double-decay for bullet kills, battery ticks with the passed dt (slow-mo semantics), world-level droneDecay event at the pre-step position, deterministic decay step per seed.
- npm run build exit 0. Before/after arm data: .evidence/I129_s10_prefix.json, I129_s10_postfix.json, I129_s15_prefix.json, I129_s15_postfix.json.
- Browser smoke (render change - droneDecay FX): dev :5173 ?nocache=129, forced drones aged out via __vr.advance, cyan fizzle + seeker-zap cue on droneDecay, console 0/0, 0 NaN, screenshot .evidence/I129_drone_decay.png.

### Next owner / decision

- I130 (ST-130) power-up drop rebalance (7 types) | unit: drop table | node.
- I132: E8B GDD addendum (homing-drone section incl. maxAge).