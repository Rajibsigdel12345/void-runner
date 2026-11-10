# Memory Audit - Void Runner (cgs-perf-profile)

## I185 (ST-185) - new entity pooling

Date: 2026-11-10. Scope: every entity store in src/core (DOM-free), every render
pool in src/render, and the DOM HUD layers, audited for unbounded growth / leaks.
Method: (1) static audit of every push/drain site in core; (2) new node unit tests
pinning the invariants earlier soaks left open (tests/memoryBounds.test.js);
(3) a 600 s (10 min) organic browser soak on the REAL render path
(advance(1/60) + bloom.render() per frame, ?nocache=185a, real Enter gesture,
ship protected invuln 9999 / lives 999) sampling every 5 sim-seconds (121
samples): renderer.info.memory, performance.memory, every store count, every
transient queue, and the DOM.

### Summary

NO LEAKS FOUND. Every entity store is a bounded capped array with in-place
compaction (zero steady-state allocations); the render layer is fully pooled
(mesh pools sized from the same CONFIG keys, one THREE.Points ring for all
particles, fixed pre-created DOM pools). The 600 s soak drove all content
classes (15 waves, 3 bosses incl. a live wave-15 boss at end, belt, drones,
mines, vortices, 648 kills, 7157 fired shots, 22 power-up drops) and measured:
- GPU resources rise in discrete steps (each step = first render of a new
  resource class) then PLATEAU: 30 geometries / 22 textures from t=390 s to
  t=600 s with zero further steps. No leak signature.
- JS heap is a bounded GC sawtooth (12.9-25.3 MB band) with a STABLE floor:
  per-100 s window minima 12854/14940/15967/15119/14748/15777 KB - no upward
  drift. Peaks are content-driven (late waves hold more live entities + WebAudio
  SFX node churn), not accumulative.
- DOM is constant: 29 body children (identical to the MENU baseline), kill-feed
  rows at or under the 5-row cap, 12 pre-created score-popup divs that are never
  re-created.
- Zero cap violations across all 121 samples (stores, transients, DOM).
New: 6 unit tests (tests/memoryBounds.test.js) pin the invariants that ST-077's
10-min soak, ST-138's belt tests, I129's drone-battery tests and I144's Splicer
steady-state test left open: mine cap hammer, mines pendingFires drain
discipline, Splicer _pending per-tick bound + drain-to-empty, World event
double buffer fully clear after two drains, rocks+belt combined ceiling = the
asteroidRenderer pool size, and the powerup render-pool contract (powerupMesh.js
hardcodes pool = 4). 581/581 (+6). No production code changed - the audit
confirms the existing architecture is leak-free.

### Metric

Core stores (static audit - every push site checked):

| store | cap (CONFIG) | enforcement | compaction |
| --- | --- | --- | --- |
| AsteroidField.rocks | asteroid.maxConcurrent = 24 (ramp capped at maxConcurrentCap 24) | spawn() returns null at cap | in-place (compact) |
| belt rocks (layer in rocks) | belt.max = 5 | spawnBeltForWave counts existing, skips at cap | n/a (persistent) |
| Weapons.bullets | weapon.maxBullets = 64 | fire()/fireSpread() check cap | in-place (step) |
| EnemyBulletField.bullets | enemyBullets.maxConcurrent = 24 | fire() checks cap | in-place (step) |
| MineField.mines | mine.maxConcurrent = 10 | spawn() checks cap | in-place (step) |
| MineField.pendingFires | <= mines per tick | drained by World every tick (game.js takeFires) + clear() | swap |
| DroneField.drones | drone.maxConcurrent = 6 | spawn() checks cap | in-place (step) |
| DroneField.decayed | reset each step | game.js drains | reset |
| PowerUpField.drops | powerup.maxActiveDrops = 1 | maybeDrop() checks cap; I130 dropLife expiry | in-place (compactDrops) |
| Splicer._pending | <= splicer.arms per tick (one burst/step) | World drainBolts every tick | swap |
| VortexField pending | few per tick | World drains every tick (vt.events) + reset() on run reset | swap |
| World events | double buffer (2 frames max) | drainEvents swap; both buffers cleared across two cycles | swap (ST-074) |
| high scores | storage maxScores (top-N) | getHighScores slice(0, maxScores) | n/a |

Render pools (static audit): asteroidRenderer 24+5=29 meshes (shared
noise-baked geo); bulletPool 64 + 61 trails; enemyBulletMesh 24; mineMesh 10;
droneMesh 6; powerupMesh 4 (headroom over maxActiveDrops=1); particles one
THREE.Points, 512-slot CPU Float32Array ring, out-of-view parking; scorePopups
12 pre-created divs (recycles oldest when exhausted - never allocates at
runtime); killFeed <= 5 rows (MAX, shift+remove); bossMesh/wardenMesh are
singletons (one at a time by the wave director); shipMesh has a dispose path.

Browser soak (600 s, 121 samples, real bloom path):
- GPU live resources (renderer.info.memory - persistent live counts; this
  build's WebGLInfo.reset() zeros only the render stats, verified in
  vendor/three.module.js): geoms 14 (t=5 s) -> 16 (t=20) -> 17 (t=40) -> 18
  (t=45) -> 19 (t=65) -> 20 (t=85) -> 21 (t=125) -> 22 (t=150) -> 23 (t=175)
  -> 25 (t=180, wave-5 boss content) -> 26 (t=255) -> 27 (t=300) -> 29 (t=315)
  -> 30 (t=390), then FLAT at 30 for the remaining 210 s. tex 15 -> 16 (t=20)
  -> 17 (t=45) -> 18 (t=65) -> 19 (t=85) -> 20 (t=150) -> 21 (t=315) -> 22
  (t=390), FLAT for the remaining 210 s.
- JS heap (performance.memory, Chromium, no forced GC): min 12854 KB, max
  25344 KB; per-100 s window {heapMin, heapMax} KB: (5-100) 12854/17753,
  (105-200) 14940/22325, (205-300) 15967/22890, (305-400) 15119/20876,
  (405-500) 14748/23433, (505-600) 15777/25344. Head-10 mean 14372 KB vs
  tail-10 mean 22714 KB - the tail carries the heaviest live content (wave 15
  boss + full rock/belt/drone load), while the GC FLOOR is stable in a
  12.9-16.0 MB band (no leak drift).
- Store peaks: rocks 24 (cap 24), belt 5 (cap 5), combined 29 = render pool
  ceiling (cap 24 + 5); bullets 18 (cap 64); enemy bolts 19 (cap 24); mines 1
  (cap 10); drones 1 (cap 6); drops 1 (cap 1). pendingFires / decayed / events
  = 0 at every sample (drained per tick).
- DOM: body children 29 constant (MENU baseline 29); kill-feed rows peak 5
  (cap 5); popup divs fixed 12.
- Content exercised (not a degenerate soak): 648 kills, 7157 fire, 3 bossSpawn
  (waves 5/10/15), 2 bossDeath, 22 powerupDrop, 16 vortex cycles (15 ended),
  921 beltHit, 38 rockShieldHit, 2 weaponLevelUp, 10 mineExplode, 7
  droneExplode, 2 bossPhase2, 11 bossBurst.
- End state: PLAYING, wave 15, ship finite, all rocks finite, wave-15 boss
  alive + finite, particleLive 29 (512 ring healthy).

### Budget

- GPU live resources: no explicit project budget; reference baseline is I184's
  forced worst case (19 geoms / 16 tex). This soak's fully-organic 15-wave
  ceiling is 30 / 22 - every delta maps to a first-rendered content class, and
  the plateau proves no continued growth. In practical budget (dozens of GPU
  objects, far from any driver/webview stress level).
- JS heap: no explicit project budget; reference is I184's forced worst-case
  steady 15.8-15.9 MB. Soak GC floors 12.9-16.0 MB (at/below), peaks 17.7-25.3
  MB (content + GC-transient). No drift.
- DOM: kill feed <= 5 rows, popups 12 fixed, body children constant - all
  within their by-construction bounds.
- Entity counts: every store at or under its CONFIG cap at all 121 samples.

### Bottleneck

None. No unbounded growth in core, render, or DOM.
- Warning (non-blocking, carried from I184, unchanged): the GPU resource steps
  (14 -> 30 geoms across the first ~390 s of gameplay) are one-time lazy
  uploads paid when each content class first renders - the same artifact class
  as the documented cold first-frame hitch. The I95 offscreen warm-up render
  remains the standing proposed fix; owner decision, deferred.
- Informational: late-wave heap peaks (up to 25.3 MB) are live-content +
  WebAudio SFX node churn (7157 fire SFX in the soak), bounded with a stable
  floor. No action required.

### Optimization

No optimization required - this is the audit's outcome. The architecture to
preserve for any future pool: capped arrays + in-place compaction in core,
render pools sized from the same CONFIG keys, and the two cross-module
contracts now pinned in tests/memoryBounds.test.js (asteroidRenderer ceiling =
maxConcurrent + belt.max; powerupMesh pool 4 >= maxActiveDrops).

### Blocking issues

None.

### Changed files or proposed files

- Changed: tests/memoryBounds.test.js (new; 6 tests - mine cap hammer,
  pendingFires drain discipline, Splicer _pending per-tick bound +
  drain-to-empty, World event double buffer clear, rocks+belt render-pool
  ceiling, powerup render-pool contract).
- Not proposed: no production code changes (audit confirms the existing
  architecture is leak-free). Deferred (unchanged): I95 offscreen warm-up
  render (owner decision).

### Verification evidence

- npm test: 581/581 (+6 new in tests/memoryBounds.test.js; all prior suites
  green, including ST-077's 10-min bounded-pool soak).
- node scripts/build.mjs: exit 0.
- Browser (?nocache=185a, real Enter gesture, 600 sim-s in 10 chunks of 3600
  frames, advance(1/60)+bloom.render() per frame, sample every 300 frames):
  zero cap/transient/DOM violations across 121 samples; GPU plateau 30/22 for
  the final 210 s; heap floor stable 12.9-16.0 MB; console 0 errors / 0
  warnings (all messages); ship/rocks/boss finite at end; particleLive 29.
  Screenshot: .evidence/I185/I185_1_soak_end_wave15.png (wave 15, boss live).
- Method note: renderer.info.memory in this three.js build is a persistent
  live-resource count (WebGLInfo.reset() zeros only render stats - verified in
  vendor/three.module.js), so it was sampled WITHOUT resetting. Heap via
  performance.memory (Chromium-only, approximate, no forced GC).

### Next owner or decision

ST-186 (E8E docs + changelog). Deferred decision (unchanged): I95 offscreen
warm-up render - owner.
