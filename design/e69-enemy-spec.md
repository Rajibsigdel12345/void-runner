# E69 Enemy Spec Frozen - Void Runner (E69, I515)

FROZEN spec for the E69 new-enemy-archetype wave: PHANTOM (cloaker), HAULER (mine-dropping transport), BULWARK (shield enforcer) + campaign level 4 ("Necro Reef" candidate, 4 zones) + fleet 9 -> 12 rendered-luma ladder. Frozen here; only ST-487 (balance) may move stats, and only WITH measured TTK + an appendix to this spec.

## 1. Scope + invariants

In scope (E69, ST-481..ST-488):
- 3 new enemy archetypes with pure core AI (src/core/phantom.js, src/core/hauler.js, src/core/bulwark.js), config blocks, endless-wave gates, campaign enemyMix wiring, i18n (en/zh/ja).
- 3 new Blender GLBs (phantom, hauler, bulwark) + assetLoader entries + procedural fallbacks.
- Rendered-luma ladder re-audit 9 -> 12 WITH MEASUREMENT (ST-485).
- Campaign level 4: 4 zones, per-zone palettes, candidate boss "abyssal" (Option A: retint/posture variant of boss.glb, 0 new tris, new move set spawning phantom + bulwark), persistence highest-level 3 -> 4.
- Balance pass (ST-487) + G69.0 close gate (ST-488, WITH MEASUREMENT).

Out of scope (deferred, recorded in production/scope-check-E69.md):
- Support/buff archetype (role-gap matrix slot) - deferred to E70 candidate.
- New mine type: HAULER drops EXISTING mines.js entities; no new mine class.
- WebGPU work; PWA/mobile; camera/cockpit FPV (separate standing-queue items).

Invariants (must hold through E69):
- I1: Endless path bit-identical under pinned low-wave seeds - new types gate at firstWave 13/15/17, so causal483/playframe483/491/causal495/pwa491 pins are EXPECTED EXACT; any drift = stop + re-pin WITH MEASUREMENT only.
- I2: Fleet E57 rule-1 AND test - every new palette must FAIL |dluma|<=10 AND dhue<=40 against every frozen pair (11 adjacent pairs after 9 -> 12).
- I3: Render pool = maxConcurrent + headroom; bullets/particles pooled; no per-frame allocations in hot paths.
- I4: Determinism - all new RNG flows through src/core/rng.js (seeded); unit tests pin seeds.
- I5: Kill readability (F8) - no enemy dies without a visible burst; cloak/opacity states always snap visible on death.
- I6: F2 bullet-speed cap - no new bolt faster than 1.15x ship speed (14 u/s -> <= 16 u/s).
- I7: dist ceiling 6,100,000 B pre-registered WITH MEASUREMENT at G69.0; cut ladder C1..C5 in scope-check-E69 section 5.

## 2. Roster placement (gates, concurrency, F4 triangle)

Roster grows 9 -> 12. New placements (frozen):

| type | firstWave | perWave | maxConcurrent | render pool | role | score |
|---|---|---|---|---|---|---|
| phantom | 13 | 1 | 2 | 4 | flank-ambush cloaker | 250 |
| hauler | 15 | 1 | 1 | 2 | slow tank / mine truck | 400 |
| bulwark | 17 | 1 | 1 | 2 | shield enforcer | 500 |

- F4 "one new threat per wave" triangle: 13 (phantom), 15 (hauler), 17 (bulwark) - each new type arrives singly on its introduction wave, never stacked on that wave.
- Wave composition: after introduction, new types may join later waves alongside existing types via the enemyMix vocabulary (endless stage mixes and campaign zone mixes share the same strings).
- Concurrency: per-type caps (same convention as wasp 6 / pod split pattern). Hauler and bulwark capped at 1: both are slow, high-hp, area-shaping - two at once would stack denial zones.
- Score ladder: phantom 250 (ties the stinger rung - low hp, high skill reward); hauler 400 and bulwark 500 open a new "heavy" rung above sentry 350.

## 3. PHANTOM (cloaker) - "fades, then ambushes from your flank."

Role: flank-ambush cloaker. Fills the "cloak/stealth" empty slot of the E68 role-gap matrix.

FSM (frozen):
- enter (1.2 s): rim -> ring ~10-12 u. Opacity 0, untargetable, no RNG steering (deterministic ring placement from seed).
- orbit (3.5 s): visible, flank-bias orbit around the player, targetable.
- cloak (1.2 s): opacity 1.0 -> 0.12 linear.
- drift (1.0 s): holds 0.12, still flank-orbiting.
- strike (2.5 s): uncloak 0.5 s (opacity 0.12 -> 1.0), then 3-bolt aimed spread. Bolt pre-telegraph = 0.35 s nose-charge glow before the first bolt.
- orbit (3.5 s) -> repeat. Cycle total 8.2 s.
- death: de-cloak flash (opacity snaps to 1.0) + standard burst - kills always readable (I5).

Targetability rule (frozen): targetable = (opacity > 0.5). Continuous rule, no discrete boundary. Untargetable total ~= 2.35 s of the 8.2 s cycle (~29%). Bullets pass through with no spark/clang while untargetable (no hit feedback at all - the miss IS the feedback).

Stats (frozen candidates; only ST-487 may move them, WITH measured TTK + a spec appendix):
- hp 2 / radius 0.5 / score 250
- orbitSpeed ~6-7 u/s (ship 14 u/s)
- boltSpeed <= 16 u/s (F2 1.15x cap; candidate 15)
- firstWave 13 / perWave 1 / maxConcurrent 2 (render pool 4)
- rimDist 15 / maxAge 45

Shape language: slim arrow hull + two swept canopy pods; cloak = opacity + faint edge glow, never invisible-vanishing (readability F8).
Tri AIM/CAP: 2,200 / 2,600.
Procedural fallback: arrow cone + 2 pod spheres + accent nose glow (the opacity-driven cloak suits the fallback too).
GLB named nodes: VR_Hull, VR_PodL, VR_PodR, VR_Nose (charge-glow accent).
## 4. HAULER (mine-dropping transport) - "slow truck keeps dropping mines."

Role: slow tank / bomber. Defender-style transport. Fills the "slow tank" + "bomber" slots.

FSM (frozen):
- enter (2.0 s): rim -> ahead of the ship, lateral offset 4-8 u.
- plod (main): 3.5 u/s forward along flight-path direction, sine wobble +/-0.5 u; drops ONE mine every 4.0 s. Mine = EXISTING mines.js entity via the same mines system (no new mine class). Drop telegraph = 0.4 s hatch glow + "thunk" SFX before release. Mine drifts back/behind into a denial corridor.
- death: big debris burst + pending drops cancelled; already-dropped mines persist. NO direct fire (pure area denial + tank).

Stats (frozen candidates; only ST-487 may move them, WITH measurement):
- hp 12 / radius 1.1 / score 400 / speed 3.5 u/s / mineEvery 4.0 s
- firstWave 15 / perWave 1 / maxConcurrent 1 (render pool 2)
- rimDist 15 / maxAge 60

Shape language: squat armored transport - wide flat hull, belly sponsons, VISIBLE MINE BAY (hatch glows on drop), heavy dorsal stack; reads as "truck" at 60 px.
Tri AIM/CAP: 3,200 / 3,800.
Procedural fallback: box hull + 2 sponson boxes + dome; hatch = small glowing belly box.
GLB named nodes: VR_Hull, VR_SponsonL, VR_SponsonR, VR_Hatch (renderer drives drop glow), VR_Stack.

## 5. BULWARK (shield enforcer) - "front is invulnerable; go around."

Role: shield enforcer / frontal negation. Fills the "enforcer" slot.

FSM (frozen):
- enter (1.5 s): rim -> hold point 8-10 u.
- hover (main): hovers near the ship plane, slowly yawing toward the player at 0.5 rad/s (slow enough to flank). Frontal ~100 deg arc (+/-50 deg of heading) NEGATES player bullets: spark + clang, no damage. Absorbs N=6 negated hits -> stunned 1.5 s (flash, shield inactive, takes normal damage, N resets). Sides/rear = normal damage. Also fires ONE slow aimed bolt every 6.0 s (speed 10 u/s, 0.6 s core-charge telegraph) to punish rear-camping.
- death: standard heavy burst.

Stats (frozen candidates; only ST-487 may move them, WITH measurement):
- hp 18 (fleet max) / radius 1.2 / score 500
- yawRate 0.5 rad/s / shieldArc +/-50 deg / shieldHitsToStun 6 / shieldStunDur 1.5 s
- boltEvery 6.0 s / boltSpeed 10 u/s (well under the F2 cap)
- firstWave 17 / perWave 1 / maxConcurrent 1 (render pool 2)
- rimDist 15 / maxAge 60

Shape language: broad hexagonal shield plate on a narrow armored spine; the shield IS the silhouette.
Tri AIM/CAP: 2,400 / 2,900.
Procedural fallback: hex-cylinder plate + box spine + glow core.
GLB named nodes: VR_Shield (hex plate - renderer drives hit-flash), VR_Core (spine core - charge telegraph), VR_Spine.

## 6. Palette + luma candidate bands (ST-485 finalizes WITH MEASUREMENT)

Frozen ladder (rendered luma / hue), 9 entries:
drone 184.08/189.5 > wasp 150.55/47.3 > sentry 136.73/40.7 > warden 119.49/181.4 > hunter 116.11/13.5 > stinger 108.89/222.6 > flyer 94.22/329.4 > boss 68.40/257.4 > gunship 68.16/160.3.

E57 rule-1 AND test: every new color must FAIL |dluma|<=10 AND dhue<=40 against every frozen pair (11 adjacent pairs after 9 -> 12).

Candidate bands:
- PHANTOM: green-cyan, hue ~95-140. Separates from stinger 222.6 / warden 181.4 by hue AND luma.
- HAULER: orange-red, hue ~20-30. Rendered luma must land outside 106-126 vs hunter 116.11/13.5 (dhue 11.5 < 40 -> dluma must be > 10). Prefer ~95-105 per "big/slow = dark".
- BULWARK: magenta, hue ~300. dhue vs flyer 329.4 = 29.4 < 40 -> MUST have |dluma| > 10 vs 94.22 -> target rendered luma ~110-125. Vs boss 257.4: dhue 42.6 > 40, OK.

Bake pattern: NEUTRAL COLOR_0 bake + CONFIG hex x renderLumaGain at runtime (E68 gain pattern - sub-linear response k 0.23-1.28 per role; the 10 s full-fleet in-game audit is the loop; ST-485 freezes final hex + gain WITH MEASUREMENT and appends the audit to this spec as a 4.4-style appendix).
## 7. GLB contract (E57 rule 8 + E69 re-pins)

All 3 GLBs follow E57 rule 8:
- VR_ node naming (nodes listed per type in sections 3-5).
- NEUTRAL COLOR_0 material bake (tint via CONFIG hex x renderLumaGain at runtime).
- Y-up, glTF 2.0 binary (.glb), transforms applied.
- 5123 (total tris) + per-prim 5125 overflow asserts at load.
- Export via D:\Blender\blender.exe 5.2.3 headless (ST-482: phantom + bulwark; ST-483: hauler).

Re-pins WITH MEASUREMENT only if:
- Per-node tri pins change (re-pin in assetPerf evidence at ST-485).
- Hauler file exceeds 567.81 KB (ship's measured MAX_FILE_BYTES pin) -> re-pin MAX_FILE_BYTES WITH MEASUREMENT; hard limit 1,048,576 B per file.

## 8. Per-asset CG gate checklist (ST-482/ST-483)

Per asset (E68 pattern), before merge:
1. Clay 6-view renders (front / back / left / right / top / three-quarter).
2. Tint A/B (final CONFIG hex vs clay).
3. 96-px silhouette (areaFrac >= 0.03, reads at game scale).
4. Back view (no missing geometry, no Z-fighting).
5. Per-node tri table (aim/cap per sections 3-5).
6. Invariants: no negative scale, no NaN, single origin.
7. Node/material/count asserts in assetPerf (E57 rule 8).

## 9. Level 4 zone table (data-driven; ST-486 finalizes WITH rendered-luma audit + visible check)

Candidate data (names/hexes subject to ST-486):
- Level 4 name: "Necro Reef" (candidate; "Bioluminal Reef" alt). Boss: "abyssal" (candidate name; Option A = retint/posture variant of boss.glb, 0 new tris, new move set spawning phantom + bulwark).
- Zones (teach-isolate-combine: z1 introduces phantom alone, z2 introduces hauler with existing rocks/mines, z3 introduces bulwark with a dodge lesson, z4 combines all three into the boss approach):

| zone | name | length | paletteId | hazardProfile | enemyMix | optionalTargets | checkpointAt |
|---|---|---|---|---|---|---|---|
| z1 | Reef Approach | 100 | reef-1 | calm | phantom, rock | golden | 0 |
| z2 | Minefield Drift | 110 | reef-2 | moderate | hauler, mine, drone | shielded | 0 |
| z3 | Bulwark Wall | 120 | reef-3 | dense | bulwark, stinger, wasp | pod | 0 |
| z4 | Necro Gauntlet | 90 | reef-4 | gauntlet | phantom, hauler, bulwark, mine | rapid, shielded | 0 |

Identity: (a) deep teal-green bioluminescent "reef" vs (b) magenta/violet "necro-reef" - NOTE: debris-1..4 is already teal 0x2dd4bf family; collision risk flagged for the ST-486 audit.
i18n keys at ST-486: 'level.name.l4' / 'level.zone.l4z1'..'level.zone.l4z4' (en/zh/ja, pinned equal by tests/level.test.js).
Persistence: highest-level 3 -> 4 (storage key 'voidrunner.campaign').

## 10. Story map + re-pin schedule

- ST-481 (I515, this): this spec, docs-only.
- ST-482 (I516): Blender phantom + bulwark GLBs (D:\Blender\blender.exe 5.2.3 headless; per-node tri pins re-pinned WITH MEASUREMENT).
- ST-483 (I517): Blender hauler GLB (MAX_FILE_BYTES per-file pin 567.81 KB ship measured pin re-pinned WITH MEASUREMENT only if hauler exceeds; hard MAX_FILE_BYTES = 1,048,576).
- ST-484 (I518): core AI src/core/{phantom,hauler,bulwark}.js (pure, seeded rng, wasp/pod FSM pattern, events array) + config blocks + endless gates + campaign enemyMix wiring + i18n + unit tests (causal/playframe EXACT expected - gates >= 13).
- ST-485 (I519): render meshes + assetLoader entries + procedural fallbacks + ladder audit 9 -> 12 WITH MEASUREMENT + CONFIG hex/gain frozen + assetPerf re-pin (fleet 9 -> 12 roles).
- ST-486 (I520): level 4 data + palette audit + boss Option A + HUD + persistence 3 -> 4 + i18n.
- ST-487 (I521): balance (deterministic-seed TTK/beatability per zone; endless waves 13-20; ONLY story allowed to move sections 3-5 stats, WITH measurement + spec appendix).
- ST-488 (I522): G69.0 close gate (WITH MEASUREMENT: ceiling expectation re-derived from measured dist; cut ladder NOT expected to be invoked).

## 11. Open items / risks

- R1: PHANTOM untargetable window (29% of cycle) may feel "unfair" at low skill - mitigation: 0.35 s nose-charge telegraph + kills always readable; ST-487 may tune cycle timings WITH TTK measurement.
- R2: HAULER mine spam could stack with existing mine density in campaign z2 "Minefield Drift" - hazardProfile moderate; ST-487 audits with seeded runs.
- R3: BULWARK frontal negation interacts with spread fire - negation is per-bullet; N=6 reset keeps it beatable.
- R4: Level 4 palette collision with debris-1..4 teal family (flagged in section 9) - ST-486 audit decides (a) vs (b).
- R5: Boss Option A (retint/posture variant) may read as "same boss" - mitigation: new move set (phantom + bulwark spawns) + different posture; if readability fails at ST-486, escalate to scope-check (no silent new asset).
