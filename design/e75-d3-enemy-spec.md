# E75 D3 Frozen Spec - 2 New Enemy Ships (ST-518, I552)

ST-518 (I552) / E75 D3. Docs-only spec: freezes the full contract the I552 Blender
builds get checked against - per-ship shape languages, per-node triangle AIM/CAP
tables, palette / luma / rung placements with the I519 measured ladder as ground
truth, the GLB contract, gameplay state machines + tunables, the integration and
re-pin plan (all re-pins WITH MEASUREMENT), and the per-asset CG gate checklist.
Pattern: design/enemy-remaster-spec-E68.md. Changing any frozen value below
requires a scope-check pass (cgs-scope-check); builds do not self-negotiate.

## 1. Scope + invariants

- 2 NEW archetypes: (a) SWEEPER - low-HP wide-arc fan shooter; (b) BEACON -
  stationary reinforcement source. Both new to the endless roster AND the L5
  campaign mixes (D2 row, ST-517 I551).
- ~220 KB / ~2,900-3,400 t each (E72 fleet range 190-310 KB / 2,906-4,020 t;
  scope-check-E75 D3). FIRST E75 ASSET LANDING: dist ceiling switches
  6,100,000 B -> 7,400,000 B WITH MEASUREMENT (pre-registered,
  scope-check-E75 sec 5-7); tripwire 7,297,600 B (7,400,000 - 102,400 B floor);
  cut ladder C1..C4 (C1 drop L5 boss mesh / C2 D3 -> 1 ship / C3 D5 displacement
  -> canvas craters / C4 L5 -> 3 zones).
- Pre-state (I551): dist 5,560,918 B / 189 files; tests 1,201/1,201; assets 31 GLB
  / 3,212,232 B / 72,449 t (73,000 t cap at 99.2%). Expected post-I552: ~33 GLB,
  ~6.0 MB dist (well under 7,400,000 B), ~78,500-79,500 t.
- Endless bit-identity: new firstWaves 18/19 are ABOVE all existing; the causal
  pin seed-9876 run ends at wave 2 and the playframe pin windows cover waves
  <= ~13 -> causal495 + playframe491/483 pins EXPECTED EXACT (no re-pin);
  re-measure anyway, re-pin ONLY WITH MEASUREMENT if a shipped mesh moves them
  (the new meshes are outside both pin windows - expected not to).
- Runtime contract unchanged: assets/ GLB + GLTFLoader (src/render/assetLoader.js)
  with procedural fallback (E57 rule 10); node naming VR_<Asset>_<Node>; the
  mine stays procedural; no new renderer features.
- RNG rule (house): ALL randomness at spawn only; step() is RNG-free so
  deterministic tests can pin full event sequences (PhantomField pattern).

## 2. Per-ship shape languages (FROZEN)

Research: design/e75-expansion-research.md D3 + labeled references (K6 - extract,
don't overengineer): sci-fi ship design language (triangles = aggressive, flat
parsable surfaces, greeble = dressing only; youtu.be/77iy2QSN7w0) and the
reinforcement-spawn fairness lesson (escorts spawning next to the player with no
warning = UNFAIR anti-pattern - player agency = destroy the source or kite;
youtu.be/Jr8ogMFnl0c).

- SWEEPER = "arc triangle": a WIDE, FLAT, ANGULAR triangular hull that visually
  IS the arc it fires - the leading edge sweeps in the same ~120-degree arc as the
  bolt fan, so the shape pre-announces the attack. Flat parsable panels (no
  curves); a recessed EMITTER SLIT runs along the leading arc (R-GLOW compliant:
  glow is an inline emitter in the hull line, never a ball); small rear-deck
  greebles as dressing only. Reads as a wide, low, aggressive delta.
- BEACON = "signal island": a STALWART SQUARE base (squares = immovable) carrying
  a raised vertical tower "visual island" and a readable LAMP/energy core near the
  top (circles = energy; R-GLOW: the lamp IS the emitter - it brightens during
  the charge telegraph and is the only emissive element). Stationary by shape:
  no wings, no thrusters, no mobile read. The charge telegraph is LONG and bright
  (1.5 s) - the fairness contract from the research lesson.
- Fleet-wide rules apply: R-GLOW, R-VALUE (2-3 value bands + panel breaks on every
  COLOR_0 bake), R-SIL (silhouette readable FRONT AND BACK at 96 px).

## 3. Per-node triangle AIM/CAP tables (FROZEN)

AIM = build target; CAP = per-node hard ceiling; the ASSET CAP is binding even
where per-node caps sum above it. Per-node tris measured by the audit_glb.cjs-
style assert at landing; the contract assert rejects actuals above cap.

### 3.1 sweeper (asset aim 2,900 / cap 3,400 t)

| asset   | node                   | aim   | cap   |
|---------|------------------------|-------|-------|
| sweeper | VR_Sweeper_Hull (flat angular triangle + deck) | 2,200 | 2,600 |
| sweeper | VR_Sweeper_Arc (leading-edge emitter arc band) | 400   | 500   |
| sweeper | VR_Sweeper_Greeble (rear-deck dressing)        | 300   | 400   |
|         | ASSET                  | 2,900 | 3,400 |

### 3.2 beacon (asset aim 2,900 / cap 3,400 t)

| asset   | node                   | aim   | cap   |
|---------|------------------------|-------|-------|
| beacon  | VR_Beacon_Base (square pedestal + corner plating) | 1,400 | 1,600 |
| beacon  | VR_Beacon_Tower (vertical island + head housing)  | 1,200 | 1,400 |
| beacon  | VR_Beacon_Lamp (energy core, the emitter)         | 300   | 400   |
|         | ASSET                  | 2,900 | 3,400 |

### 3.3 Fleet totals

- D3 pair: aim 5,800 t / cap 6,800 t. Fleet post-landing: 72,449 + actuals
  (~78,500-79,500 t) vs the 73,000 t cap -> assetPerf totalTris re-pin WITH
  MEASUREMENT at the landing (scope-check K2: cap re-derived at G75.0 anyway).

## 4. Palette + luma + rung ladder (FROZEN targets; closing gate verifies in-render)

Ground truth: .evidence/I519/luma_i519.json (in-game sky p50 + mean hue). E75
pre-registered gate: the NEW ship's rendered mean hue must clear EVERY existing
rendered hue by dhue >= 15.23 deg (E69 dhue rule, E75 floor). Existing hues:
hunter 16.0, hauler 18.8, sentry 41.5, wasp 50.0, phantom 127.1, gunship 158.1,
warden 179.1, drone 189.5, stinger 221.0, boss 259.1, bulwark 330.4, flyer 335.8.
Open hue slots (>= 15.23 from both ends): [65.2, 111.9], [236.2, 243.9],
[274.3, 315.2] (plus a razor-thin 355 red slot rejected: only 0.77 deg slack vs
hunter 16.0 at hue 355).

### 4.1 Per-ship decisions (FROZEN)

- SWEEPER: cobalt-ice, rendered mean hue target 240 (slot [236.2, 243.9];
  min gap 19.0 vs stinger 221.0). Palette: body 0x2e4a72 (dark cobalt steel),
  emitter 0x8fd0ff (ice-cobalt glow). Target rendered sky p50 ~82 (between
  flyer 94.22 and gunship 68.16 - small/medium-fast = mid-ladder).
  E57 rule-1 AND test (collision iff dluma <= 10 AND dhue <= 40): vs stinger
  dluma 26.9/dhue 19.0 -> clear; vs boss 68.4 dluma 13.6/dhue 19.1 -> clear
  (borderline-ish, confirmed at the closing in-render audit).
  renderLumaGain pre-registered estimate 3.5; FINAL gain + measured p50/hue
  land at the closing gate (ST-477 pattern).
- BEACON: orchid-violet, rendered mean hue target 300 (slot [274.3, 315.2];
  min gap 30.4 vs bulwark 330.4). Palette: body 0x4a4452 (dark gunmetal-plum),
  lamp 0xd07aff (orchid signal). Target rendered sky p50 ~45 (big/slow =
  dark; between hauler 53.53 and bulwark 25.84; vs hauler dluma 8.53 but dhue
  218.8 -> the hue axis separates, no collision). renderLumaGain pre-registered
  estimate 2.5; FINAL at the closing gate.
- Pair check: sweeper 240 vs beacon 300 -> dhue 60 -> clear.

### 4.2 Juice rung placements (FROZEN; documented ladder orderings preserved)

- score rungs: drone 200 < SWEEPER 225 < stinger 250 ... bulwark 500 < gunship
  600 < BEACON 750 < monolith 1000 (new top non-boss rung - reward for removing
  the source; verified nothing else sits at 225 or 750, I552 probe).
- shakeTable deaths: mineExplode 0.4 < SWEEPER 0.45 < hunterDeath 0.55; gunshipDeath
  0.85 < BEACON 0.9 < bossDeath 1.0.
- flashTable: BEACON 0.4 (shared rung wardenDeath/gunshipDeath/podDeath);
  SWEEPER: no entry (sentry/wasp/phantom/hauler/bulwark precedent).
- killPunch: l 0.18 < SWEEPER 0.19 < stinger 0.2; BEACON 0.3 (shared max rung
  bulwark/gunship - allowed precedent).
- shockwave.classes: SWEEPER 2.2 (r 0.9 -> 2.4x; stinger pattern 2.5x); BEACON 3.6
  (r 1.4 -> 2.6x; gunship pattern 3.6).
- fx.palette (additive 3-hex): sweeper [0xe8f4ff, 0x8ec8ff, 0x4a7ac8];
  beacon [0xf0d8ff, 0xc07aff, 0x7a3ca8].
- enemyRim.roles (house rule strength x luma(color) <= 29): sweeper
  { color 0x4a86c8, strength 0.22 } -> ~27.7; beacon { color 0x9a5ac8, strength
  0.22 } -> ~24.5.

## 5. Gameplay state machines + tunables (FROZEN)

### 5.1 SWEEPER (src/core/sweeper.js, SweeperField - PhantomField pattern)

- Spawn: RIM spawn facing the ship (phantom-style: rim bearing RNG + 8 tries away
  from the ship; cap maxConcurrent 2 -> spawn returns null when full).
- States: SPAWN (0.6 s, fade/arrive) -> APPROACH (close to hoverDist 12 u) ->
  SWEEP (rotate the firing bearing across arcSpan 2.094 rad (~120 deg) at
  sweepSpeed 0.9 rad/s; every cadence 0.6 s emit a FAN of fanBolts 4 bolts at
  boltSpeed 8 evenly spread over a 0.4 rad sub-arc centered on the current
  sweep bearing) -> REAIM (0.7 s pause, re-acquire the ship) -> SWEEP ...
  Self-expiry: age >= maxAge 45 s -> dead + 'death' {self:true}.
- RNG ONLY at spawn: rim bearing, arcDir (+1/-1 sweep direction), cadencePhase,
  hoverJitter. step(dt, shipPos) has NO RNG - tests pin exact event sequences.
- Events: 'spawn' {pos}, 'fire' {pos, dir, self:false} (one per bolt in a fan),
  'hit' {pos, self:true}, 'death' {pos, self}. game.js maps 'fire' ->
  enemyBullets.fire + emit; 'death' -> award + emit + kill FX (resolveBullet
  pattern with size 'sweeper').
- enemy block (config.js): radius 0.9, hp 3, score 225, firstWave 18, perWave 1,
  maxConcurrent 2, boltSpeed 8, maxAge 45, speed 3.2, hoverDist 12, arcSpan
  2.094, sweepSpeed 0.9, cadence 0.6, fanBolts 4, fanSubArc 0.4, renderLumaGain
  (est 3.5; final at closing gate). firstWave 18: not a boss wave (everyWave 5;
  18 % 5 = 3) and above all existing firstWaves (max 17 = bulwark).

### 5.2 BEACON (src/core/beacon.js, BeaconField - PhantomField pattern)

- Spawn: MID-ARENA relative to the ship (sentry-style: NOT a rim spawn) -
  offset 6-10 u from the ship at a spawn-time RNG bearing; cap maxConcurrent 1
  -> spawn returns null when full.
- States: SPAWN (1.0 s, materialize + callout) -> IDLE (0.8 s) -> CHARGE (1.5 s
  brightening telegraph; 'charge' event at charge start - the lamp IS the
  telegraph, RM-safe intensity per the sentryCharge pattern) -> RELEASE (emit
  'release' {pos, bearing} - game.js spawns escortCount 2 drones via
  this.drones.spawn(shipPos) = RIM away from the player with the visible rim
  ping (particles.burst at the escort position); droneField self-caps at
  maxConcurrent 6, a full field drops the spawn silently - the beacon NEVER
  hard-blocks) -> IDLE ... after releaseCap 3 releases -> dead + 'death'
  {self:true}. Hard cap: maxAge 40 s -> same self-death.
- RNG ONLY at spawn: offset distance + bearing, initial idle phase. step(dt,
  shipPos) has NO RNG.
- Events: 'spawn' {pos}, 'charge' {pos, self:true}, 'release' {pos, bearing},
  'hit' {pos, self:true}, 'death' {pos, self}. game.js: 'release' -> drones.spawn
  per escort + 'beaconRelease' emit {beaconPos, escortPos} (main.js rim ping);
  'death' -> award 750 + emit.
- enemy block (config.js): radius 1.4, hp 8, score 750, firstWave 19 (19 % 5 = 4,
  not a boss wave; above all existing), perWave 1, maxConcurrent 1, releaseCap
  3, chargeTime 1.5, idleTime 0.8, escortCount 2, maxAge 40, speed 0,
  renderLumaGain (est 2.5; final at closing gate). No boltSpeed.

### 5.3 Campaign presence (pure data)

_zoneAllows is data-driven (game.js: enemyMix membership). L5 mixes (I551
committed) gain: 'sweeper' added to z2 (Halo Circuit) and z3 (Crown Ascent);
'beacon' added to z4 (Archon Threshold - the gauntlet zone's reinforcement
pressure). Waves are TIME-DRIVEN and PERSIST across levels, so firstWaves 18/19
are reachable in L5. Endless: both appear from wave 18/19 (above every existing
firstWave -> earlier waves bit-identical).

## 6. GLB contract (E68 sec 5 + E69/E72 practice)

Per asset (builds REJECTED if any fails):
1. Node names VR_<Asset>_<Node> with identity transforms (Sweeper:
   VR_Sweeper_Hull / VR_Sweeper_Arc / VR_Sweeper_Greeble; Beacon:
   VR_Beacon_Base / VR_Beacon_Tower / VR_Beacon_Lamp); per-asset merged export
   nodes; flat node set (no root nodes).
2. NEUTRAL COLOR_0 grayscale value bake on EVERY mesh prim (componentType 5126
   FLOAT VEC3, count == POSITION count, grayscale dev <= 0.02, value domain
   [0.25, 1.00] per the I509 remaster-4 domain; 2-3 value bands + panel breaks,
   R-VALUE). Per-prim p10/p50/p90 facet pins land WITH MEASUREMENT (I533-I535
   pattern, ENEMY451_FACET table).
3. Y-up glTF (Blender 5.2.3 headless -b --python, deterministic script).
4. Materials <= 3 per asset (3 here: one per node); no TEXCOORD_1; POSITION +
   NORMAL required on every prim.
5. Per-node tris: aim <= actual <= cap (section 3); ASSET CAP binding.
6. Build-at-scale bbox radius (assetLoader does NO scale normalization):
   sweeper [1.5, 2.0] (wasp 1.60 / flyer 1.69 class, forward +X); beacon
   [2.4, 3.2] (gunship 2.78 class; the tower may push the corner radius up -
   the gameplay radius 1.4 is config, not the bbox - warden precedent).
7. File size: each GLB <= 220 KB (phantom 214,568 B / bulwark 190,584 B
   precedent; MAX_FILE_BYTES 1,048,576 holds trivially).
8. Mesh-module useGLB node regex (frozen): sweeper /arc/i -> glow, /greeble/i
   -> greeble, else hull; beacon /lamp/i -> glow, /base/i -> base, else tower.
   Procedural fallback bakes in the SAME absolute part-space as the GLB (E72
   rule). standardMat (fxArm.js) + applyEnemyRim + vertexColors (GLB COLOR_0
   multiplies).
9. sil96 gate: 96 px silhouettes FRONT AND BACK must read the role (the sweeper
   reads as a wide flat delta with a glowing leading edge; the beacon reads as a
   tall signal mast on a square base).

## 7. Integration + re-pin plan (ALL re-pins WITH MEASUREMENT)

Core-first: src/core/{sweeper,beacon}.js + config blocks + game.js wiring +
tests/{sweeper,beacon}.test.js -> npm test green BEFORE art. Then render modules
src/render/{sweeperMesh,beaconMesh}.js + main.js wiring + assetLoader map.

- config.js: enemy.sweeper + enemy.beacon blocks (sec 5); fx.palette +2;
  enemyRim.roles +2; shakeTable +2; flashTable +1 (beacon); killPunch +2;
  shockwave.classes +2; L5 zone mixes (sec 5.3).
- game.js: import + instantiate both Fields; step in update (slow-mo scaled edt);
  event drain blocks; spawnSweeperForWave / spawnBeaconForWave (standard gate:
  wave < firstWave || wave % everyWave === 0 -> skip; _zoneAllows; hazardRate;
  first-of-run toast); resolveBulletSweeper / resolveShipSweeper /
  resolveBulletBeacon / resolveShipBeacon; 'release' -> drones.spawn x2 +
  'beaconRelease' emit; clears in reset + toast-flag resets.
- main.js: SFX_CUES (frozen, verified against the I552 read of the map):
  sweeperSpawn:'flyerSpawn', sweeperFire:'bossFire', sweeperHit:'shieldHit',
  sweeperDeath:'stingerDeath'; beaconSpawn:'bossSpawn', beaconCharge:
  'stingerTelegraph', beaconRelease:'bossFire', beaconHit:'shieldHit',
  beaconDeath:'wardenDeath'. SW_COLORS +2 (palette[0]). Toast handlers
  (sweeperSpawn -> toast.sweeper; beaconSpawn -> toast.beacon) + FX handlers
  (burst/shake/flash per sec 4.2 rungs) + shatter dispatch + sync calls.
- assetLoader.js: name->path map +enemy_sweeper.glb / +enemy_beacon.glb
  (procedural until the GLB lands - E72 two-phase).
- tests/sweeper.test.js + tests/beacon.test.js: seeded spawn/step sequences,
  event ORDER, no-RNG-in-step, caps (spawn null when full), fan geometry (4
  bolts over the sub-arc), self-expiry, release cap -> self-death, drone-field
  full-drop (beacon release with a full drone field drops silently, no hard
  block), determinism (two runs same seed -> identical event log).
- Re-pins (each: old -> new + measurement recorded in the re-pin note):
  (a) tests/assetGlbs.test.js BUDGETS +sweeper +beacon (tight to actual, E67
  pattern) + two new per-asset E72-style blocks (remaster4Bake; per-node tris
  exact; per-node extents 10% band via glb_probe-style measurements; sweeper
  Arc-node cz mirror guard ~0 tol 0.05; ENEMY451_FACET +sweeper +beacon per-prim
  p10/p50/p90); (b) tests/assetPerf.test.js BUDGET totalFilesKB 3300 -> ~3520,
  totalGeoKB 3080 -> ~3240, perFileKB 760 (holds; ship still max ~722 KB),
  totalTris 73000 -> ~79500; 'exactly 31 GLB assets' -> 33 (+history comment);
  COLOR_0 whitelist +enemy_sweeper.glb +enemy_beacon.glb; (c) tests/level.test.js
  ENEMIES Set +['sweeper','beacon'] (L5 mix change - WITH MEASUREMENT);
  (d) AGENTS.md ceiling 6,100,000 -> 7,400,000 (chain + new CLOSE FLOOR line)
  + asset inventory line 31 -> 33 GLB; (e) strings.js +2 keys x 3 locales (sec
  10) - strings.test.js needs NO change (en extraction auto-covers the new
  main.js t() calls).
- Pins: causal495 (seed 9876, wave 2) + causal483 + playframe491 (A 22/32,717
  + 11/180, B 52/69,272) + playframe483: EXPECT EXACT (new enemies outside pin
  windows) - run all, re-pin ONLY if a shipped mesh moves them (expected not to);
  pwa491 must stay SUMMARY 11/11.

## 8. Per-asset CG gate checklist (I552 builds, per asset)

1. Clay 7-view: f34 / side / top x clay / tint / silhouette - .evidence/I516/
   audit_clay516.py pattern (materials created BEFORE any clear_meshes() loop).
2. Defect-note A/B: the f34 tint must read the shape language (sec 2) - producer
   views every PNG.
3. Silhouette board: 96 px FRONT AND BACK (R-SIL).
4. Low-DPR accent survival: emitter/lamp accent reads at ~0.5 DPR (margin
   >= 25 luma over background).
5. Contract asserts (scripted, audit_glb.cjs-style): node names per sec 6.1,
   mat count <= 3, COLOR_0 on every prim + domain [0.25,1.00], per-node tris vs
   sec 3, bbox class per sec 6.6, file <= 220 KB.
6. In-render luma/hue (closing gate, ST-477 method): sweeper p50 82 +/- 8 with
   mean hue in [236.2, 243.9]; beacon p50 45 +/- 8 with mean hue in [274.3,
   315.2]; min new-vs-existing dhue >= 15.23; rim rule <= 29; E57 rule-1 AND
   test vs all 12 existing roles.

## 9. i18n (K5 byte pipeline, non-negotiable)

toast.sweeper / toast.beacon (en/zh/ja). Curated values (ASCII-safe; the CJK is
\uXXXX in the cjk552.cjs pipeline script - never console-derived or
console-read):
- toast.sweeper: en "ARC SWEEPER INBOUND" / zh \u5f27\u626b\u70ae\u6765\u88ad
  (5 chars) / ja \u30a2\u30fc\u30af\u30b9\u30a4\u30fc\u30d1\u30fc\u63a5\u8fd1
  (arc-sweeper + approach, katakana + kanji, 10 chars).
- toast.beacon: en "BEACON ON STATION" / zh \u589e\u63f4\u4fe1\u6807\u5c31\u4f4d
  (reinforcement beacon stationed, 6 chars) / ja \u589e\u5f31\u30d3\u30fc\u30b3\u30f3\u914d\u7f6e
  (reinforcement beacon deployed, 8 chars).
Pipeline: .evidence/I551/cjk551.cjs pattern (ASCII anchors, EOL-matched insert
after the I551 l5 key occurrences, read-back codepoint verification, best-effort
MT reference logged non-blocking). KillFeed: NO entries (E69 precedent -
phantom/hauler/bulwark have none; killFeed.js unchanged).

## 10. Closing gate (I552 quality bar 6/6)

1. npm test green (new sweeper/beacon tests + all re-pins).
2. npm run build succeeds; dist <= 7,400,000 B MEASURED (expected ~6.0 MB; tripwire
   7,297,600 B; cut ladder C1..C4 NOT expected to be invoked).
3. Headless Chrome smoke (C:/Users/rajib/AppData/Local/Google/Chrome/Application/
   chrome.exe --enable-unsafe-swiftshader, killed after): console clean, no NaN,
   both enemies render (GLB + procedural fallback path), toasts fire.
4. Vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A /
   7FF9ACF50F006017).
5. 5 fresh harnesses via the managed-runner pattern (.evidence/I551/
   run_closegate551.cjs template): causal495 (dist :4200) / causal483 (dev
   :5173) / playframe491 + playframe483 (dev :5173) / pwa491 (dist :5199,
   SUMMARY 11/11) - every server killed + port verified free after.
6. In-render luma/hue audit (sec 8.6) + rim rule + E57 rule-1 AND test.
Bookkeeping: iterations.md I552 block, stories.md ST-518 -> DONE, epics.md,
timeline.md, active.md (no BOM, LF), CHANGELOG.md (above '- I551:') -> commit
(style: "I552 (ST-518, E75): D3 ... WITH MEASUREMENT - ... - quality bar 6/6";
COMMITMSG.txt NEVER staged) -> push delegated to a fresh subagent (origin main +
Pages marker: 'sweeper' in
https://rajibsigdel12345.github.io/void-runner/src/core/config.js; ~45 s
deploy observed at I551).

## 11. Open items / risks (carried, not frozen)

- Sweeper x boss luma margin (13.6) is the thinnest in the fleet at targets -
  the closing in-render audit settles it WITH MEASUREMENT (ST-477 precedent: gain
  tuning over 2-4 passes).
- Beacon score 750 assumes the L5 boss (D4) keeps monolith-class 1000+; if D4
  lands the archon boss below 750 (it will not - it is the FINAL boss), the
  rung re-derives WITH MEASUREMENT at ST-519.
- Drone field is the shared resource the beacon feeds: 3 releases x 2 = 6 =
  exactly the drone maxConcurrent cap - by design (bounded pressure), and a full
  field drops spawns silently so the beacon can never soft-lock the wave.
- K2 tri headroom: totalTris re-pin ~79,500 vs 73,000 cap - the cap itself is
  re-derived WITH MEASUREMENT at G75.0 (ST-521); D4 (~3,000 t) and D5 (gated)
  still fit the 7,400,000 B dist policy.
