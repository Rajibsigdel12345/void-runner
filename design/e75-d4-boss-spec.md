# E75 D4 Frozen Spec - The Archon, Level 5 Boss (ST-519, I553)

ST-519 (I553) / E75 D4. Docs-only spec: freezes the full contract the I553 Blender
build + code wiring get checked against - throne shape language, per-node triangle
AIM/CAP tables, palette / luma / hue placements with the I519 + I552 measured ladder
as ground truth, the GLB contract, the 3-phase gameplay state machine + tunables,
the integration and re-pin plan (all re-pins WITH MEASUREMENT), and the per-asset CG
gate checklist. Pattern: design/e75-d3-enemy-spec.md (D3, I552). Changing any frozen
value below requires a scope-check pass (cgs-scope-check); builds do not self-negotiate.

## 1. Scope + invariants

- ONE new hero asset: assets/boss_archon.glb - the L5 "Zenith Spire" final boss
  "The Archon" (a regal, symmetric THRONE). New 3-node GLB; the D2 L5 row (ST-517)
  already has boss:'archon' (config.js L1281) and the campaignBoss[5] data
  (175 hp / 3 phase / 3400 score, ST-517 I551).
- Canonical kind stays 'monolith' (E69 abyssal precedent): the L5 row's kind string
  'archon' maps to TINT 'archon' in game.js _spawnLevelBoss; CampaignBoss gets
  this.archon = (tint === 'archon'). kind 'monolith' -> render/strings/fx paths
  untouched (monolith fx/shake/rim tables reused - NO flashTable/shakeTable re-pin).
- Runtime contract unchanged: assets/ GLB + GLTFLoader (src/render/assetLoader.js)
  with procedural fallback (E57 rule 10): if bossArchon GLB missing -> the
  MONOLITH geometry stays, tinted with the archon palette (graceful, bossMesh.js).
- ~3,000 t / ~300 KB aim (D4 candidate, scope-check-E75). Asset cap 3,400 t /
  310 KB (317,440 B).
- Pre-state (I552): 33 GLB / 3,625,648 B / 78,599 t; assetPerf caps totalFilesKB
  3560 / totalGeoKB 3490 / totalTris 79,000; dist 5,993,275 B / 195 files; ceiling
  7,400,000 B (E75); CLOSE FLOOR E75 1,406,725 B (I552).
- Expected post: 34 GLB; asset totals ~3,93x,xxx B / ~81,6xx t -> assetPerf caps
  re-pinned WITH MEASUREMENT (totalFilesKB 3560 -> measured, totalGeoKB 3490 ->
  measured, totalTris 79,000 -> measured); dist ~6.3 MB -> CLOSE FLOOR E75
  re-derived WITH MEASUREMENT (must stay >= 102,400 B floor or the cut ladder
  C1..C4 engages - C1 = drop the archon mesh to the monolith-geometry fallback).
- Endless bit-identity: the archon is campaign-L5-only; no new wave entries; the
  causal pin (seed-9876) and playframe pin windows never touch it. causal495 /
  causal483 / playframe491 / playframe483 / pwa491 EXPECTED EXACT (no re-pin);
  re-measure anyway, re-pin ONLY WITH MEASUREMENT.
- RNG rule (house): all randomness at spawn only; archon summons are
  config-driven + parity alternation (no RNG draw, ST-486 abyssal pattern).

## 2. Shape language (FROZEN)

Research: design/e75-expansion-research.md D4 (BOSS-1/2/3) + this session's
YouTube extractions (Cuphead breakdown youtu.be/L4mJBvgrq_w: final-boss scale and
telegraphed readability; Hilda phase-gated spawns; Godot boss tutorial
youtu.be/OpbE29qiaDI: predefined-behavior state machine). BOSS-3 read:
scale + symmetry = the "final boss" silhouette (contrast with the fleet's
aggressive ASYMMETRY). The body narrates the four L5 zones: Spire Approach (the
base platform), Halo Circuit (the ring), Crown Ascent (the spikes), Archon
Threshold (the front orb chamber = the weak-point doorway).

- VR_Archon_Hull "THRONE": wide OCTAGONAL base platform (stepped plinth, flat
  angular panels) + 4 CORNER SPIRE COLUMNS (mirror-symmetric) + a central rising
  SHAFt (the obelisk successor - angular, flat panels, panel breaks; the shaft
  front face carries a recessed channel leading to the core chamber). R-VALUE:
  2-3 value bands + panel breaks on the COLOR_0 bake.
- VR_Archon_Crown "HALO": a TORUS/HALO ring around the mid-upper shaft (the
  readable "circuit" - 8-segment faceted ring, flat) + 5 CROWN SPIKES on top
  (one center + 4 at the corners, mirror-symmetric). R-VALUE 2-3 bands.
- VR_Archon_Core "ORB": the RECESSED front orb chamber at the shaft front (+Z,
  player side, ST-252 orientation) - the Threshold doorway the weak-point orb
  orbits in front of. R-GLOW compliant: the core IS the emitter (glow is the
  chamber, never a floating ball).
- Monolith world scale (boss.glb contract, assetGlbs.test.js L405-436): base
  radius <= 2.3 (cross-section <= 4.6, own test band), height ~9.65 (+/-10%
  band), origin CENTERED (+/-0.5u all axes), front = +Z, crown = +Y
  (export_yup=True). Collision radius 3.4 (shared, config campaignBoss.radius -
  the throne's wide base justifies it; the monolith glb stays for fallback).
- Fleet-wide rules: R-GLOW, R-VALUE, R-SIL (silhouette readable FRONT AND BACK
  at 96 px; the halo ring is the back read).

## 3. Per-node triangle AIM/CAP tables (FROZEN)

AIM = build target; CAP = per-node hard ceiling; the ASSET cap (3,400 t) is
binding even where per-node caps sum above it. Per-node tris measured by the
build-script gate AND the audit_glb553.cjs contract assert at landing.

| asset | node                 | aim   | cap   |
|-------|----------------------|-------|-------|
| archon| VR_Archon_Hull (plinth + 4 corner spires + central shaft) | 1,900 | 2,300 |
| archon| VR_Archon_Crown (halo ring + 5 crown spikes)              | 700   | 900   |
| archon| VR_Archon_Core (recessed front orb chamber)               | 400   | 600   |
|       | ASSET                | 3,000 | 3,400 |

Fleet total post-landing: 78,599 + actuals (~81,4xx-81,9xx t) -> assetPerf
totalTris re-pin WITH MEASUREMENT (E69/E72 pattern; the 79,000 cap is known to
break - pre-registered here).

## 4. Palette + luma + hue (FROZEN targets; closing gate verifies in-render)

Ground truth: .evidence/I519/luma_i519.json + .evidence/I552/luma_i552.json
(in-game rendered sky p50 + mean hue per fleet member). E75 gate: the archon's
rendered mean hue must clear EVERY existing rendered hue by dhue >= 15.23 deg
(E69 dhue rule), and E57 rule-1 (collision iff dluma <= 10 AND dhue <= 40) must
hold against all. Existing fleet hues (rendered): hunter 16.0, hauler 18.8,
sentry 41.5, wasp 50.0, phantom 127.1, gunship 158.1, warden 179.1, drone 189.5,
stinger 221.0, sweeper 238.2, boss 259.1, beacon 303.6, bulwark 330.4, flyer 335.8.

- Target: rendered mean hue 280 (violet-indigo, the ZENITH identity - above the
  boss 259.1, below the beacon 303.6; open slot [274.3, 315.2] from D3). Min
  gaps at 280: boss 20.9 / beacon 23.6 / bulwark 50.4 / sweeper 41.8 / stinger
  59.0 - ALL >= 15.23.
- Luma target: rendered sky p50 88 +/- 8 (band [80, 96]) - the LADDER TOP for
  non-phantom fleet: above boss 68.4 (dluma 19.6 > 10, safe even at the
  borderline hue 20.9), above sweeper 80.59 (dluma 7.4 <= 10 but dhue 41.8 > 40
  -> clear), below phantom 98.67 (dluma 10.67 > 10 -> clear).
- Starting config values (pre-registered; FINAL FROZEN WITH MEASUREMENT at the
  closing luma audit, ST-477/I552 pattern, 1-3 tuning passes max):
  archon: { body: 0x483f7a, core: 0xa78bfa, rim: 0x2a2150 },
  renderLumaGain start 5.5 (tuning model: rendered p50 scales ~linearly with the
  gain at fixed body/bake; hue moves only via body-tint steps).
- HUD/banner identity (frozen with the palette): label color rgba(205,180,255,
  0.95); bar border rgba(150,120,255,0.6); fill gradient 90deg #7c5cff ->
  #c4b5fd; banner tint #c4b5fd.

## 5. GLB contract (FROZEN; audit_glb553.cjs = clone of audit_glb552.cjs)

- File: assets/boss_archon.glb, <= 310 KB (317,440 B).
- Flat node set, identity transforms, SET equality with
  [VR_Archon_Hull, VR_Archon_Crown, VR_Archon_Core] (order NOT contracted -
  fleet precedent, I552 resolution; runtime useArchonGLB is regex lookup).
- Per-node tris within the sec-3 [aim, cap] ranges (indices accessor / 3).
- Every prim: POSITION + NORMAL present; NO TEXCOORD_1; COLOR_0 present,
  componentType 5126 (FLOAT), count == POSITION count, grayscale dev <= 0.02,
  value domain [0.25, 1.00].
- Materials <= 3 (one per node, VR_Archon_*Mat, the I263 material-present
  export recipe - bossMesh.js ignores GLB materials, in-code palette drives).
- TRUE-AXIS per-node extents pinned WITH MEASUREMENT at landing (measure553.mjs
  pattern; 10% band in the assetGlbs.test.js archon test, I552 pattern).
- Mirror guards (assetGlbs.test.js archon test): Hull and Crown X-centered
  (|cx| <= 0.05 - the 4 corner spires / halo ring are left-right symmetric);
  Core X-centered (|cx| <= 0.05) AND front-biased (cz > 0 - the chamber sits on
  the +Z face).
- Node-level silhouette: sil96 front + back shots (R-SIL gate, E72 pattern).

## 6. Gameplay state machine + tunables (FROZEN)

Three phases over the shared hpFrac ladder (phaseAt [1.0, 0.66, 0.33], posture
[1.0, 1.14, 1.28], weak-point cycle {r 1.4, orbitR 4.0, arm 2.4, tele 0.8,
open 2.2} - all reused as-is; the phase COUNT comes from the existing
campaignBoss.phases[5] = 3 (ST-517)):

- P0 "CROWN" (phaseIndex 0, hpFrac >= 0.66): AIMED BOLTS ONLY. Safe, readable
  open (L1 phase-0 pattern; Cuphead LR "extremely telegraphed" lesson).
- P1 "HALO" (phaseIndex 1, 0.33 <= hpFrac < 0.66): aimed + ROCK RING + SUMMONS
  BEGIN (Cuphead Hilda pattern: the phase change is what spawns - introduces
  the tool at the transition). On the 0->1 phase transition _spawnTimer is
  armed to archon.spawnFirst (deterministic; no RNG draw).
- P2 "THRONE" (phaseIndex 2, hpFrac < 0.33): ENRAGE - existing 1.3x speed/turn
  applies; fastest cadence; all tools.

Config block (FROZEN shape; values are the starting pins - they are gameplay
tunables, re-pinnable only by explicit story, not by a build):

  archon: {  // ST-519 (E75): L5 "Zenith Spire" final boss (kind stays 'monolith').
    // body/core/rim = the zenith violet-indigo identity (distinct from monolith
    // purple 259.1 / abyssal magenta / prime gold / splicer teal).
    // Spawn move set: phase-gated reinforcement summons (phantom/bulwark
    // alternating parity), starting at the P1 "HALO" transition; field
    // maxConcurrent self-caps (phantom 2 / bulwark 1).
    body: 0x483f7a, core: 0xa78bfa, rim: 0x2a2150,
    moves: { aimEvery: [3.0, 2.2, 1.5], ringEvery: [99, 4.0, 2.8] },
    spawnEvery: 7.0, spawnFirst: 4.0
  }

Mechanics deltas in src/core/campaignBoss.js (FROZEN):
- constructor: this.archon = (tint === 'archon'); _spawnTimer = -1 for archon
  (armed at the P0->P1 transition, NOT at spawn - the throne opens quiet).
- _moveTier(): archon -> min(phaseIndex, archon.moves.aimEvery.length - 1)
  (the tier IS the phase; the shared move tables are bypassed).
- step(): archon reads cb.archon.moves (aimEvery/ringEvery by tier); the summon
  block generalizes: runs when (this.abyssal) OR (this.archon AND
  phaseIndex >= 1) AND _spawnTimer >= 0; cadence from the archon block;
  phantom/bulwark parity alternation (phantom first) - identical routing to
  abyssal (game.js _spawnAbyssalMinion handles both; its gate
  cfg.campaignBoss.abyssal stays valid because both blocks coexist).
- Death: shared splitCount 4 / splitSize 'M' (no delta).
- Determinism: full event sequence (aim/ring/phase/spawn) is a pure function of
  config + dt + ship path (new test pins it, ST-486 abyssal test pattern).

## 7. Integration + re-pin plan (ALL re-pins WITH MEASUREMENT)

Code (wiring):
1. src/core/config.js (DOUBLE BOM + mixed EOL - strip both \uFEFF, edit,
   restore both, NEVER normalize EOLs): campaignBoss.archon block (sec 6) after
   the abyssal block; update the L1281 row comment ("lands D4/ST-519" -> landed).
2. src/core/campaignBoss.js: archon flag + _moveTier branch + step() deltas
   (sec 6).
3. src/core/game.js L846: tint chain += (kind === 'archon') ? 'archon' before
   the 'monolith' fallback.
4. src/render/assetLoader.js: ASSETS += bossArchon: 'assets/boss_archon.glb'.
5. src/render/bossMesh.js: useArchonGLB(obj) (regex node lookup -> stash the
   3 geometries, COLOR_0-safe like useGLB); setBossGeometry(variant)
   ('archon' | 'monolith' - swaps hull/crown/core geometries; missing archon
   GLB -> keeps monolith geometry, archon tint still applies = E57 rule-10
   fallback); sync() += archon palette branch (body/core/rim from
   CONFIG.campaignBoss.archon, before the isPrime/isSplicer/isAbyssal chain).
6. src/main.js: asset branch += else if (name === 'bossArchon')
   bossMesh.useArchonGLB(entry.object); bossSpawn handler (L1039): call
   bossMesh.setBossGeometry(world.boss && world.boss.archon ? 'archon' :
   'monolith') (world.boss is set before the emit) + archon banner string +
   variant 'archon'.
7. src/render/waveBanner.js startBoss: archon tint branch (#c4b5fd, sec 4).
8. src/render/killFeed.js L33: archon branch -> t('banner.boss.archon').
9. src/render/bossHealth.js (VERTICAL bar only - the horizontal one
   early-returns for campaign bosses): discriminator extends to
   kind + (prime ? ':prime' : '') + (archon ? ':archon' : ''); archon style
   branch (sec 4 values). Abyssal keeps its current (monolith-labeled)
   behavior - no delta.
10. src/core/strings.js (DOUBLE BOM + mixed EOL; CJK via the cjk551.cjs
    pipeline - ASCII \uXXXX escapes, per-locale anchors, EOL-matched insert,
    codepoint read-back verify): per locale, after the boss.monolith line:
    'boss.archon': ARCHON / \u6267\u653f\u5b98 (???) /
    \u30a2\u30fc\u30b3\u30f3 (????); and after the banner.boss.monolith
    line: 'banner.boss.archon': THE ARCHON / \u6267\u653f\u5b98 (???) /
    \u30a2\u30fc\u30b3\u30f3 (????).

Tests (re-pins):
- tests/assetGlbs.test.js: BUDGETS += bossArchon: <measured total tris, pinned
  tight WITH MEASUREMENT>; NEW test block (I552 sweeper pattern): file size
  band, node SET + flat count, 3 materials, total tris exact, per-node tris
  exact, TRUE-AXIS extent bands (pinned after measure553.mjs), mirror guards,
  COLOR_0 all-prims via the remaster4Bake helper.
- tests/assetPerf.test.js: GLB count 33 -> 34; totalFilesKB 3560 -> measured;
  totalGeoKB 3490 -> measured; totalTris 79,000 -> measured (~81.6k; headroom
  >= 0.5%). perFileKB 760 holds (archon ~300 KB); perFileMats 4 holds.
- tests/campaignBoss.test.js: L93 boss(5,'monolith') -> boss(5,'archon')
  (phaseCount 3); L95 tints array -> ['monolith','splicer','prime','abyssal',
  'archon']; canonical-kind test L190+ -> boss(5,'archon'): kind 'monolith',
  archon true, prime false; + NEW archon tests (ST-486 abyssal pattern):
  (a) P0 fires aimed only (no ring, ringEvery 99); (b) summons: none before the
  P1 transition, then phantom/bulwark alternating at spawnEvery cadence,
  deterministic (two bosses, same frames); (c) full event-sequence determinism
  over a pinned ship path; (d) non-archon bosses never use archon.moves.
- Luma audit: clone .evidence/I552/luma_audit552.mjs -> add the archon TARGET
  (p50 band [80,96], hue 280 +/- 6, min dhue 15.23 vs the full fleet list);
  harness-only change: call vr.bossMesh.setBossGeometry('archon') before
  measuring the archon, reset to 'monolith' after.
- EXPECTED no re-pin (measure anyway): causal495, causal483, playframe491
  (A 22/32,717 + 11/180; B 52/69,272), playframe483, pwa491 (11/11).

Quality bar (6/6): npm test; npm run build (dist <= 7,400,000 B; CLOSE FLOOR
E75 re-derived WITH MEASUREMENT); dev smoke (campaign L5 boss spawn -
headless, KILL server after); vendor pins 4/4 (A65DE049A7F38B40 /
7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017); the 5 close harnesses
(causal495 + causal483 + playframe483 + playframe491 + pwa491) fresh EXACT;
luma audit FROZEN WITH MEASUREMENT.

## 8. Per-asset CG gate checklist (blender-asset-qa, I552 pattern)

- [ ] build_553.py gates: per-node tris in [aim, cap]; asset diag radius band;
      ALL_GATES_PASS (else SystemExit 1 - blsock CLOSED/zero-bytes means check
      the py gate first, not a Blender crash).
- [ ] audit_glb553.cjs -> CONTRACT_PASS (size, node set, per-node tris,
      POSITION/NORMAL, no TEXCOORD_1, COLOR_0 5126 grayscale 0.02 / domain
      [0.25,1.00], materials <= 3, flat identity nodes).
- [ ] sil96 front + back silhouette shots (R-SIL: throne readable at 96 px
      both sides; the halo ring carries the back).
- [ ] render-audit screenshots: clay + tint, 6 angles (front/back/side/top/
      f34 x2) - E72/I552 pattern.
- [ ] Blender 5.2.3 headless ONLY; leave Blender running (socket 127.0.0.1:
      9876, blsock.cjs), no duplicate instances.
- [ ] Export recipe: use_selection=True, export_yup=True, export_apply=True,
      export_materials="EXPORT", export_vertex_color="MATERIAL",
      export_texcoords=False, export_tangents=False, export_normals=True.

## 9. Iteration plan (I553)

1. spec (this file) - freeze.
2. Blender headless build (build_553.py via blsock) -> assets/boss_archon.glb.
3. measure553.mjs (TRUE-AXIS extents) + audit_glb553.cjs (CONTRACT_PASS) +
   sil96 + clay/tint renders.
4. Code wiring (sec 7 items 1-10, BOM-safe patches).
5. Tests + re-pins (sec 7).
6. Luma/hue audit + tuning (1-3 passes) -> FROZEN WITH MEASUREMENT.
7. Quality bar 6/6 (ports :5173/:4200/:5199 - KILL EACH AFTER, verify free).
8. Bookkeeping (BOM-safe: iterations.md append, stories.md ST-519 PENDING ->
   DONE, epics.md E75 line, timeline.md append, CHANGELOG.md insert before
   '- I551:', active.md append) + commit + delegate push (option C).
