# Scope Check - E69 New Enemy Fleet (Phantom / Hauler / Bulwark) + Campaign Level 4 (I514)

## 1. Measured current state (tree-verified, I514)

- dist 4,623,381 B / 175 files; ceiling 4,700,000 B; headroom 76,619 B
  (= the E68 close floor; G69.0 opens from this floor).
- Fleet: 28 Blender GLBs, 2,327,964 B / 55,075 tris (ship v6 25,563 t;
  hunter 2,256 / gunship 2,268 / sentry 1,096 / wasp 792 / warden / stinger /
  drone / flyer / boss; mine procedural; 7 powerups, shield, 2 debris chunks,
  arena ring).
- Pinned and EXACT at I513: causal483 CAUSAL456 PASS; playframe483/491
  PLAYFRAME456 PASS (A 22/25,781 + 11/180, B 52/55,400 hv=0/gv=0); causal495
  3-arm (webgpu dirt = powerPreference x1 + "AttributeNode uv" x2, err 0);
  pwa491 SUMMARY 11/11.
- Vendor r187 UNCHANGED (raw sha16 104f561458997220; minified
  A65DE049A7F38B40/7AB0784CD2532367/F549248412C62B9A/7FF9ACF50F006017).
- Tests 1145/1145 green; build 0; BOM baselines CHANGELOG 7 / stories 5 /
  epics 3 / iterations 5 / timeline 3 / AGENTS 1 / scope-check 0.
- Campaign: 3 levels x 4 zones (CONFIG.levels), flightPath trochoid,
  campaignBoss (boss.glb retint/posture variants), Ikaruga checkpoints,
  localStorage highest-level = 3 (key 'voidrunner.campaign').
- Endless roster: wasp firstWave 12 is the top gate; the pinned runs are
  LOW-WAVE endless (causal seed 9876 W2; playframe A/B).

## 2. Scope fit

User queue item (a) verbatim: "new enemy types with better real-spaceship
Blender models" + "campaign extension (levels 4+)". E69 = three new enemy
archetypes (PHANTOM cloaker / HAULER mine-dropping transport / BULWARK
shield enforcer) + campaign level 4 (4 zones, new identity, boss Option A).

Builds directly on shipped machinery - no new systems:
- E68 fleet methodology: Blender GLB pipeline (VR_ naming, NEUTRAL COLOR_0
  bake, Y-up, detail pass), in-game rendered-luma ladder audit WITH
  MEASUREMENT (E57 rule-1 AND test), assetLoader + procedural fallbacks.
- E64 campaign data-driven levels: CONFIG.levels zones/palettes/
  hazardProfiles/enemyMix, level.js pure model, flightPath, campaignBoss,
  checkpoints, storage highest-level.
- E65/E67 enemy AI patterns: pure core modules over seeded rng, firstWave
  gates, maxConcurrent caps, telegraph-first combat (F8).

Support/buff enemy: DEFERRED (highest balance-complexity; only readable
against groups - revisit after level 4 lands). Level 5: data-only follow-up
(deferred). All new-endless code gates behind firstWave >= 13 so the pinned
low-wave windows draw zero new RNG (see research doc 5).
## 3. Stories (ST-480..ST-488; acceptance in production/stories.md)

- ST-480 (I514, this) - E69 open: research + scope (docs-only). design/
  e69-enemy-archetypes-research.md (role-gap matrix, F1-F12 findings, 3
  archetypes, level 4 structure, budget, pin safety, S1-S12) + this scope
  check + epics/stories/iterations/timeline entries.
- ST-481 - E69 enemy spec (design/e69-enemy-spec.md): per-enemy FSMs,
  stats, telegraphs, shape languages, tri AIM/CAP (phantom 2,200/2,600;
  bulwark 2,400/2,900; hauler 3,200/3,800 -> fleet 31 GLBs ~63-65k tris),
  hue/luma candidate bands for the 3 new rungs.
- ST-482 - Blender: phantom + bulwark GLBs (E68 remaster tier; D:\Blender\
  blender.exe 5.2.3 headless).
- ST-483 - Blender: hauler GLB (largest new ship; watch the MAX_FILE_BYTES
  567.81 KB pin).
- ST-484 - Core AI: src/core/{phantom,hauler,bulwark}.js (pure, seeded
  rng) + config blocks + endless firstWave gates (13/15/17) + campaign
  enemyMix wiring + i18n en/zh/ja + unit tests.
- ST-485 - Render: meshes + assetLoader entries + procedural fallbacks +
  in-game ladder audit 9 -> 12 rungs WITH MEASUREMENT (E57 rule-1 AND test
  vs all 11 adjacent frozen pairs) + CONFIG hex/gain tune + assetPerf re-pin.
- ST-486 - Campaign level 4: zones + new palette family (rendered-luma
  audit decides reef vs necro-reef) + boss Option A (retint + new move set
  spawning phantom + bulwark) + HUD + persistence 3 -> 4.
- ST-487 - Balance + flow: deterministic-seed TTK/beatability per zone,
  endless tuning vs the 3 gates, reduced-motion telegraphs.
- ST-488 - G69.0 close gate: fresh 5-harness re-runs + re-pins only on
  measured drift + quality bar + AGENTS.md refresh + bookkeeping +
  commit/push.

## 4. Pin expectations (re-pin table)

- causal483 / playframe483 / playframe491 / causal495 / pwa491: EXPECTED
  EXACT through all E69 stories (new types gate at firstWave 13/15/17+;
  pins are low-wave endless). Verify each story; re-pin ONLY with
  measurement if drift (I482 pattern).
- assetPerf / fleet pins (9-role): re-pin WITH MEASUREMENT at ST-485 (fleet
  9 -> 12 roles = documented geometry change, not drift).
- MAX_FILE_BYTES (ship 567.81 KB): re-pin WITH MEASUREMENT only if hauler
  exceeds it (ST-483).
- Vendor r187: unchanged (no vendor work in E69).
## 5. dist + asset policy (PRE-REGISTERED)

- Open: 4,623,381 B / 175; ceiling 4,700,000 B (headroom 76,619 B).
- Expected: +3 GLBs ~1.0-1.4 MB + code/tests/i18n ~80-120 KB -> ~5.7-6.1 MB.
- PRE-REGISTERED RENEGOTIATION: ceiling 4,700,000 -> 6,100,000 B WITH
  MEASUREMENT at G69.0 (E68/I506 precedent: document actual vs expected).
- Fleet 28 -> 31 GLBs; VR_ naming + NEUTRAL COLOR_0 bake + Y-up; tri
  AIM/CAP: phantom 2,200/2,600, bulwark 2,400/2,900, hauler 3,200/3,800.

## 6. Cut ladder (in order, at G69.0 if over the renegotiated ceiling)

C1 drop Bulwark (rarest/most complex) / C2 boss retint-only (already the
default Option A) / C3 level 4 -> 3 zones (merge z3+z4) / C4 new-ship tri
caps -25% / C5 phantom procedural-only (no GLB).

## 7. Deferrals (NOT in E69)

Level 5 (data-only follow-up) / support-buff enemy / cockpit first-person
view + camera-angle consistency (queue b) / PWA installable + mobile
landscape D-pad + menu reorg (queue c) / boss GLB Option B (only if budget
allows after the 3 enemy GLBs land) / extra art passes.

## 8. Risks

R1 dist overflow -> cut ladder + pre-registered renegotiation (section 5).
R2 ladder collision (3 new rungs vs 9 frozen) -> ST-485 in-game audit gate
WITH MEASUREMENT before CONFIG hex/gain is declared done.
R3 cloak/shield "annoying" (F10) -> F6 teach-isolate zones + strict
telegraphs + bulwark maxConcurrent 1 + readable (non-invisible) cloak.
R4 pin drift -> gates >= 13 keep pinned windows RNG-free; verify EXACT every
story; re-pin only with measurement.
R5 GPU +8-10k tris trivial; user pre-approved polygon growth.

## 9. Verification bar (per iteration)

Docs-only stories: npm test 1145/0 + build 0 + dist byte-identical + vendor
diff empty + BOM audit (new docs 0) + hygiene. Code/asset stories add:
targeted unit tests green, fresh causal/playframe re-runs (EXACT expected),
manual/headless render smoke where rendering changed.

## 10. Changed files + next

I514 (this): + design/e69-enemy-archetypes-research.md (12,721 B), +
production/scope-check-E69.md (this file), ~ production/epics.md (E69
section), ~ production/stories.md (STATUS I514 line), ~ production/
iterations.md (I514 section), ~ production/timeline.md (I514 line).

Next: I515 = ST-481 (E69 enemy spec).
