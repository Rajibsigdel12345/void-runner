# I525 / ST-491 - R7 KILLING-BLOW DIAGNOSIS (frozen rules)

Frozen BEFORE running the sweep. Diagnosis-only story: the only src change is
payload tags on the existing 'hit' events (no logic, no RNG, no config).

## 1. Protocol (restated from design/e70-balance-followup-research.md sec.4)

- 10 seeds: 52700+i, i = 0..9.
- FULL director from wave 1 (NO isolation): `const w = new World(new RNG(seed)); w.begin();`
- Cap: 36000 ticks (600 s) at DT = 1/60.
- Pilot: the I328 frozen kiter, VERBATIM from .evidence/I524/balance524.mjs
  (12 u standoff, weave Math.sin(t/90)*4 - ABSOLUTE tick function, fire < 18 u,
  x2 repulsion, no-target -> center thrust + fire t%30).
- Run ends at w.gameOver (lives -> 0) or the cap. A capped run is recorded with
  died=false and contributes no killing blow.

## 2. Ship-hit payload tags (the only src change, src/core/game.js)

15 emit sites, 0-indexed line numbers (verified this session; all 15 lines
currently end in `lives: livesLeft });`). Each gets an added field before the
closing `}` of the payload object:

| 0-idx | resolver                    | added payload field(s) |
|-------|-----------------------------|------------------------|
| 519   | resolveShipRocks            | `source: 'rock_' + (hitRock ? hitRock.size : '?')` |
| 579   | resolveShipMines            | `source: 'mine'` |
| 889   | resolveShipBoss             | `source: 'boss_' + this.boss.kind` |
| 991   | resolveShipWarden           | `source: 'warden'` |
| 1009  | resolveShipEnemyBullets     | `source: 'bullet', sourceSpeed: Math.hypot(b.vel.x, b.vel.y), sourceRadius: b.radius` |
| 1075  | resolveShipDrones           | `source: 'drone'` |
| 1165  | resolveShipStingers         | `source: 'stinger'` |
| 1213  | resolveShipHunters          | `source: 'hunter'` |
| 1268  | resolveShipGunships         | `source: 'gunship'` |
| 1525  | resolveShipSentries         | `source: 'sentry'` |
| 1541  | resolveShipWasps            | `source: 'wasp'` |
| 1557  | resolveShipPods             | `source: 'pod'` |
| 1574  | resolveShipPhantoms         | `source: 'phantom'` |
| 1590  | resolveShipHaulers          | `source: 'hauler'` |
| 1606  | resolveShipBulwarks         | `source: 'bulwark'` |

Edit method: latin1 round-trip, split on '\n', FULL-LINE match assert at each
index before replace (the 14 non-rock lines are byte-identical to each other,
so index-anchored full-line match is the disambiguator), LF preserved, byte
sizes logged before/after. No other file touched.

## 3. Killing-blow definition

- Killing blow = the FIRST 'hit' event in the run with `data.lives === 0`.
  Exactly one exists per dead run: resolveShipEnemyBullets breaks after the
  first hit per tick (game.js:1012) and every resolver guards on
  `isInvulnerable || lives <= 0`, so no second hit can follow.
- Runs capped at 36000 ticks without gameOver: died=false, no killing blow.

## 4. Source-class mapping (direct)

| payload source       | class |
|----------------------|-------|
| boss_monolith        | MONOLITH |
| boss_splicer         | SPLICER |
| warden               | WARDEN |
| mine                 | MINE |
| rock_L / rock_M / rock_S | rock_L / rock_M / rock_S |
| drone/stinger/hunter/gunship/sentry/wasp/pod/phantom/hauler/bulwark | same roster key |
| bullet               | via sec.5 (bullet attribution) |

## 5. Bullet attribution (deterministic, harness-side)

Facts (measured this session):
- EnemyBulletField.fire applies `vel = dir * speed * speedMul`; speedMul =
  waves.activeAdj.b in [0.85, 1.15] (lerp) or 0.9 (lull) or 1 - CONTINUOUS
  per-wave value, changes at wave start (game.js:251). So the raw hit speed is
  speed * m_fire and CANNOT be normalized with the current speedMul (a bullet
  fired under one wave's m can hit under another's).
- Bullet radius is NOT scaled (gunship heavy bolt radius 0.5 vs default 0.22).
- Bolt base speeds: mine 8 (UNIQUE - only the mine fires at 8); boss burst 7
  (Monolith only) / splicer spiral 7 (same value, but at most ONE boss exists
  - spawnBossForWave no-ops while this.boss is alive, game.js:589); aimed bolts
  (both boss kinds) 9; sentry 9; phantom 15; bulwark 10.
- Bullet life 4 s = 240 ticks at DT=1/60.

Harness tracking (per run):
- After each w.step(tick), snapshot the live bullet pool:
  prev = Map(id -> {px, py, vx, vy, r}) from w.enemyBullets.bullets.
- Mul history: mulHist[tick] = w.enemyBullets.speedMul (read after step).

On a 'hit' with source 'bullet' at tick t (event pos = ship pos at hit):
1. Missing = ids in prev (tick t-1) not in the live pool at tick t.
2. Candidates = missing bullets with predicted pos (px+vx*DT, py+vy*DT) within
   (r + shipRadius + 0.25) of the event pos. If exactly 1 -> that bullet.
   If >1 -> the closest (deterministic). If 0 -> class 'bullet_unknown'.
3. v = hypot(vx, vy) (raw scaled speed), r = radius.
4. If |r - 0.22| > 1e-3 -> class 'gunship' (gunship is the only non-default
   radius shooter; cfg.gunship.boltRadius = 0.5).
5. Otherwise recentMul = set of distinct mulHist values over ticks
   [t-240, t-1]. matched = { s in {7,8,9,10,15} : exists m in recentMul with
   |v - s*m| <= 1e-3 }.
6. |matched| == 1 -> resolve by entity state at tick t:
   - 8  -> MINE
   - 7  -> MONOLITH or SPLICER if a boss is alive (its kind); else bullet_unknown
   - 9  -> boss kind if a boss is alive; else SENTRY if a sentry is alive;
           else bullet_unknown
   - 10 -> BULWARK if a bulwark is alive; else bullet_unknown
   - 15 -> PHANTOM if a phantom is alive; else bullet_unknown
7. |matched| > 1 (cross-speed ambiguity; rare - waves outlast the 4 s bullet
   life, so m_fire usually equals m_hit): deterministic priority by alive
   shooter at tick t: boss (its kind) > sentry (9) > bulwark (10) > phantom
   (15) > mine (8); else the smallest matched base speed. Flag ambiguity=true
   on the record.
8. |matched| == 0 -> 'bullet_unknown' (counted under 'other').

## 6. Monolith rock attribution (monolithProbable)

- Ring bursts (Monolith) and boss death splits (Monolith splitSize 'M') spawn
  untagged rocks. Warden death also splits S rocks (limitation: a warden S rock
  is only misattributed if the Monolith is alive or died <1.5 s earlier -
  requires co-existence; documented, accepted).
- For a rock_M or rock_S killing blow: monolithProbable = true iff at tick t a
  Monolith boss is alive, OR a Monolith (kind 'monolith') bossDeath event fired
  in ticks (t-90, t] (1.5 s at DT=1/60).
- PRIMARY Monolith bucket (used for branch decisions) = exact MONOLITH tags
  (body contact, sec.5 bullets) + monolithProbable rocks. STRICT variant
  (probable rocks excluded) is reported alongside. If branch outcome differs
  primary vs strict, evaluate on PRIMARY and document both.

## 7. Per-run records (a)-(f)

(a) killing-blow source class + (if rock) monolithProbable + (if bullet) the
    attribution detail (v, r, matched speeds, ambiguity flag).
(b) wave at death = w.waves.wave at tick t.
(c) resource state at death: hitsTaken (count of 'hit' events), livesUsed =
    cfg.ship.lives - w.lives, weaponLevel = w._wlevel, shield =
    { hits: w.powerups.shieldHits, timeLeft: w.powerups.timeLeft.shield },
    activePowerups = [t in TIMED with timeLeft[t] > 0], bombs: null (bomb is
    an instant-queue powerup, no held stock - documented).
(d) heavyweight state at death:
    boss: { kind, alive, hp, maxHp, phase, spawnWave, secondsSinceSpawnWaveStart }
    warden: { alive, armor, hp, maxHp } (nulls when absent).
(e) per-wave table waves 1-12: startTick (from 'wave' event), clearTick
    ('waveCleared' event; null if not cleared before death/cap),
    clearSecs = (clearTick-startTick)*DT or null, plannedContent =
    w.waves.toSpawn read on the 'wave' tick (post onDecide - includes the
    director d multiplier), adj = {d, b, mod, lull, reason} or null,
    fieldCountAtStart = w.field.count on the 'wave' tick.
    (Density for F6/F7 = plannedContent; method documented here.)
(f) at death: kills = w.scoreKeeper.kills, score, combo, maxCombo.

Also per run: seed, died, deathTick, ticks (final), totalHits.

## 8. Outputs

- .evidence/I525/sweep525.json - all per-run records (schema above).
- .evidence/I525/results525.txt - human report: per-run killing-blow table,
  source-class tallies (primary + strict), branch evaluation per sec.9,
  per-wave table aggregate (waves 1-12 clear times median across died runs,
  plannedContent per wave).

## 9. Branch rules (frozen, research sec.4.3)

Let H = number of the 10 runs whose killing blow is a heavyweight class
(MONOLITH primary / SPLICER / WARDEN).
- B: H >= 6 -> ST-492 applies ONE lever from the frozen ordered list matching
  the DOMINANT heavyweight (ties -> Monolith > Splicer > Warden):
  [1] boss.ringEvery 2.0 -> 2.5
  [2] splicer.maxHp 30 -> 24
  [3] warden.armor 6 -> 4
  [4] boss.ringCount 8 -> 6
  [5] boss.maxHp 64 -> 56
  Monolith-dominant: [1] first, then [4], then [5]. Splicer: [2]. Warden: [3].
  (Splicer/Warden: single lever; on failure -> accept.)
- A: H < 6 AND some single non-heavyweight source >= 4/10 -> the smallest
  pressure lever for the dominant source:
  mine: mine.maxConcurrent 10 -> 7, then mine.fireEvery 3.0 -> 4.0
  drone: drone.maxConcurrent 6 -> 4
  wasp: wasp.maxConcurrent 6 -> 4
  stinger: stinger.maxCharges 6 -> 4
- C: otherwise -> accept-with-documentation (pilot trio frozen I328; a global
  knob would be an instrument change, out of scope).

ST-492 success (for the follow-up iteration): fresh sweep wave-20 reach >= 6/10
+ R8 recompute (median non-boss wave-clear over waves 1-12 <= 2.5x, boss waves
15/20 excluded from both medians).

## 10. Quality bar (src-touching story)

1. npm test green (expect 1,187/1,187 - no test deep-equals the 'hit' payload;
   main.js reads only type + lives; Director reads lives only).
2. npm run build exit 0; dist size/files recorded (was 5,254,932 B/184;
   ceiling 6,100,000 B).
3. git diff vendor/ empty.
4. BOM audit delta 0.
5. Pins ALL EXPECTED EXACT (a payload tag must not move them): causal495
   3-arm PASS, causal483 CAUSAL456 PASS, playframe483+491 PLAYFRAME456 PASS,
   pwa491 SUMMARY 11/11.
6. Sweep outputs written; branch decision documented in results525.txt.

## 11. Hygiene

Headless/node-only. No browser tabs, no lingering servers (pin harnesses that
need a server start it, record pids, kill, verify ECONNREFUSED).