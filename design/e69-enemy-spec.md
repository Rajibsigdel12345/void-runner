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

## Appendix A - ST-487 (I521): balance adjudication, measured, and the "harness vs probe" mystery (resolved)

ST-487, I521. Authority: the only story allowed to move sections 3-5 stat values, WITH measurement + this
appendix. Frozen protocol: .evidence/I521/rules.md (written BEFORE measurement). Harness:
.evidence/I521/balance521.mjs (node-only, 60 Hz, fresh World per run; isolated conditions = idle waves +
wave-12 weapon-L3 context, 100 seeds x 3 pilots [kiter/aggro/cautious, the I328 frozen trio]; sweep = full
director from wave 1 on seeds 52700+i x 10, cap 600 s).

### A.1 Result: one tuning pass (the only allowed), shipped WITH measurement
Moves:
- phantom.orbitR 11 -> 15 (u; flank ring radius around the ship). Smallest lever per the frozen priority
  order that can touch R1 (a phantom rule: levers 1-2 are bulwark stun / hauler mine+hp, which cannot move
  a phantom TTK). targetOpacity was also explored in scan521; orbitR is the move shipped.
- hauler.firstWave 15 -> 16: the pre-registered "make the gate honest" move (rules.md) - R3 PASSES, and the
  move is bit-identical (see A.5).
Verdicts (harness stdout, verbatim):
- BEFORE (results521-before.json / instr-out.txt, orbitR 11):
  R1 FAIL {medianTTK 1.4, expiryRate 0, hitRate 0}
  R2 PASS {bothKilledRate 1, medianTTK 4}
  R3 PASS {medianTTK 4.6333, hitRate 0, killRate 1}
  R4 PASS {medianTTK 8.2667, killRate 1, stunsInKilledPct 1}
  R5 PASS x4 {phantom1 kiter 1.4 / aggro 1.5, phantom2 kiter 4 / aggro 2.8667, hauler1 kiter 4.6333 / aggro
  2.4833, bulwark1 kiter 8.2667 / aggro null - aggro dies in 100% of bulwark runs, verdict vacuous}
  R6 PASS {250 < 400 < 500 < 600}
  R7 FAIL {wave20Reached 0/10; per-run death waves [5,10,5,5,12,8,10,11,10,6]; medianDeaths 3}
  R8 FAIL {ratioHighLow null, low median 21.1583, high null} (consequence of R7)
- AFTER (results521.json / after-rerun-out.txt, orbitR 15):
  R1 FAIL {medianTTK 1.4667, p90 2.8167, expiryRate 0, hitRate 0} - residual, see A.4
  R2 PASS {bothKilledRate 1, medianTTK 5.05}
  R3 PASS {medianTTK 4.6333, hitRate 0, killRate 1} (unchanged - orbitR is a phantom lever)
  R4 PASS {medianTTK 8.2667, killRate 1, stunsInKilledPct 1} (unchanged)
  R5 PASS x4 {phantom1 kiter 1.4667 / aggro 1.5333, phantom2 kiter 5.05 / aggro 3.3833, hauler1 kiter
  4.6333 / aggro 2.4833, bulwark1 kiter 8.2667 / aggro null}
  R6 PASS (unchanged); R7 FAIL (unchanged: 0/10, same death waves); R8 FAIL (unchanged, consequence of R7)
Frozen policy: at most ONE tuning pass - spent. No second fiddle pass; residuals ship documented (A.4).

### A.2 The "harness vs probe" mystery - resolved: seed-set mismatch
Symptom: the harness reported phantom1 kiter median TTK 1.4 s while the previous session's standalone
"verbatim" probes reported 1.6 s on what they believed to be the same protocol. A long probe chain hunted a
harness bug: probe328 (I328 verbatim protocol), probebisect (V0 control / V1 -SkillModel / V2 +I521 loop
order / V3 +extended scan), probetrace/probetrace2 (RNG-draw traces), probediff (per-tick intent diff V0 vs
V3), probe2x2 (loop-order x seed-family; Arm A = the recorded I521 sweep, I521 order + 52700 seeds, 10/10
dead waves 1-2), probes100/probesameproc/probev100/probeverbatim, bis1..bis10 (file bisection; bis6 = full
harness copy, bis7 = file-context test), diag521 (single-process warm-up bisection), pattern521 (per-seed
pattern compare), regiondiff521 (harness vs probe function diff).
Hypotheses rejected with evidence:
- Process-context / warm-up: diag521.mjs FRESH == AFTER == AGAIN in one process; src/core is grep-clean of
  Math.random / Date.now / performance.now (only hit: the declarative comment at engineTrail.js:3).
- File-context: bis7.mjs (harness top-level + probe loop) reproduces the probe pattern.
- Code divergence: regiondiff521.txt shows makeWorld/runIsolated functionally identical (2 cosmetic blank
  lines); the kiter pilot nearest() (key = d - t.r) is byte-identical in balance521.mjs, scan521.mjs,
  probev100.mjs and seed62100.mjs.
- The previous session's "process-context" and "byte-identity mystery" hypotheses are explicitly RETRACTED.
Resolution (verified byte-for-byte):
- The harness seed formula (balance521.mjs, verbatim):
  52100 + (CONDS.indexOf(cond) + 1) * 10000 + i, with CONDS = [phantom1, phantom2, hauler1, bulwark1]
  -> phantom1 runs on seeds 62100+i (phantom2 72100+i, hauler1 82100+i, bulwark1 92100+i).
  (rules.md's shorthand "52100 + condition*10000 + i" omits the +1 offset; the harness code is
  authoritative.)
- Every previous-session probe/scan used seed family 53100+i instead (the "scan family", per scan521.mjs's
  header). Different seeds = different RNG streams = different per-seed outcomes and slightly different
  medians.
- seed62100.mjs = the probe protocol + the harness's actual family (62100+i, kiter, phantom1, orbitR 11):
  its per-seed tick pattern matches the harness's own stdout (instr-out.txt "H i ticks" lines) with 0/100
  flips - the standalone probe reproduces the harness byte-for-byte (median 84 ticks = 1.4 s in both).
- probev100 (53100+i): median 96 ticks = 1.6 s, pattern 57-59/100 flips from the 62100 pattern. The 1.4 vs
  1.6 s discrepancy is the seed family, not a bug.
- pattern521.txt (the "59-60 flips" file) compares the "probe (standalone)" line - verified 0/100 equal to
  probev100's output, i.e. the 53100 family - against a historical harness-variant pattern; its "flips" are
  two different seed families at the same index, not divergence.
- Honest correction: scan521.mjs's header claims its 53100..53199 numbers are "directly comparable to
  results521.json". That claim is FALSE (the harness phantom1 family is 62100..62199).

### A.3 What the lever actually does (measured)
- On the R1-pinned kiter (harness seeds 62100+i), orbitR 11 -> 15 moved the median 84 -> 88 ticks
  (1.4 -> 1.4667 s; p90 1.6 -> 2.8167 s). Near-inert on these seeds.
- The previous session's scan (scan521.mjs) reported 2.82 s at orbitR 15 - on its own 53100 seed set, where
  the kiter behaves differently (see A.2).
- The lever is pilot-dependent (BEFORE -> AFTER, kiter unless noted):
  phantom1 cautious: 100% expiry -> 100% kill, median 23.825 s; phantom2 cautious: expiry 0.97 -> 0.62
  (killed 1 -> 4); phantom2 kiter: hitRuns 7 -> 2, median 4.0 -> 5.05 s (R2 stays PASS).
- Reading: a larger flank ring keeps the phantom off the ship's immediate flank, so the slow-approaching
  cautious pilot finally catches and kills instead of expiring, while the kiter's 12 u standoff weave is
  barely affected on the harness seeds.

### A.4 Residuals for ST-488 (frozen levers exhausted; out of ST-487 scope)
- R1: median TTK 1.4667 s, below the 2.0 s floor. Only the frozen phantom levers (orbitR/targetOpacity) can
  touch it; orbitR moved (smallest effective), targetOpacity explored with no better trade. Next-lever
  candidates for ST-488 (NOT frozen by ST-487): phantom 2-hit -> 3-hit HP, or cloak/strike timing.
- R7: 0/10 reach wave 20. The kiter dies on waves 5-12, i.e. pre-E69 content (rocks/drones/stingers/flyers/
  hunters/gunships/sentries/wasps + mines). No frozen lever can reach this - all four are E69-only.
- R8: null ratio - direct consequence of R7 (no wave 13-20 clears exist to measure).

### A.5 Hauler firstWave 15 -> 16 (pre-registered move, bit-identical)
rules.md pre-registered: if R3 PASSES, move CONFIG hauler.firstWave 15 -> 16 ("make the gate honest": wave 15
is a boss wave and can never spawn a hauler). R3 PASSES (4.6333 s / hit 0 / kill 1) both before and after -
bit-identical, because game.js spawnHaulerForWave's boss-wave gate already blocked 15 (the effective endless
debut was always 16; the I518 OPEN DEVIATION is hereby closed). The game.js gate comment records the
adjudication (comment-only, no logic change).

### A.6 R9 - reduced-motion telegraph audit (report-only)
Method: dev server :5173, one headless-browser tab (closed after the probe). RM ON via localStorage
(voidrunner.settings reducedMotion:true) + OS-level media emulation, ENDLESS -> PLAYING, one
phantom/hauler/bulwark spawned at fixed offsets, ship pushed away + invuln 30 s, 17 s simulated in 0.1 s
chunks, reading the pool slot materials directly (phantom nose, hauler hatch, bulwark core).
Measured (idle base -> peak during the telegraph window):
- phantom nose emissive 0.60 -> 1.80 (strike/uncloak ramp); cloak slot opacity floor 0.12 (targetOpacity 0.5)
- hauler hatch emissive 0.35 -> 1.725 (mine-drop telegraph)
- bulwark core emissive 0.50 -> 1.861 (bolt charge)
Visibility threshold chosen as >= 1.0 absolute = >= 2x the idle base: on the dark space backdrop the
telegraphs are unmissable (all three peaks clear it). RM-safe by construction (the render syncs contain no
motionOff branches; RM only scales motion, not presentation state) - confirmed live under RM.
Phantom state histogram across the window (170 chunks): enter 11, orbit 71, cloak 24, drift 20, strike 44.
Probe hygiene note: the uncontrolled test ship took 2 ambient wave-rock hits outside the invuln window
(lives 2 -> 1) - probe artifact, not a game bug. End state PLAYING, console 0 errors / 0 warnings, no NaN.
## Appendix B (E70, I524/ST-490) - R1 phantom TTK residual - Option B WITH MEASUREMENT

### B.1 Residual and pre-registered levers
- E69 residual R1 (I522, Appendix A.4): kiter median TTK 1.4667 s < the 2.0 s floor
  (a 2-hit kill in ~0.27 s of visible orbit after a 1.2 s invisible enter); the E69
  frozen levers were exhausted (orbitR 11 -> 15 applied at I521; targetOpacity gave no
  better trade) -> ACCEPT-WITH-DOCUMENTATION, deferred to E70.
- E70 pre-registration (design/e70-balance-followup-research.md sec.3, I523):
  Option B (PRIMARY) phantom.enterDur 1.2 -> 2.0 - a pacing lever that adds readable
  time (F1/F4); Option A (FALLBACK) phantom.hp 2 -> 3. Decision rule: re-confirm the
  baseline -> Option B -> criteria -> ship / Option A / accept-with-documentation.
  Criteria: R1 median TTK in [2.0, 12.0] AND expiry <= 15% AND hit <= 35%;
  R2 phantom2 bothKilled 100% AND median <= 20 s; R5 aggro <= kiter + 1.0 s.

### B.2 Measurement
Harness .evidence/I524/balance524.mjs (mechanically spliced from the I521
seed62100.mjs probe - pilots + threat scan + runIsolated byte-identical, verified by
splice524.cjs; node-only, 60 Hz; seeds identical to I521: phantom1 62100+i,
phantom2 72100+i, x100 each).

BEFORE (baseline re-confirm - integrity gate PASS):
- phantom1 kiter: median 1.4667 s (p90 2.8167), killed 100/100, expiry 0, hitRuns 0;
  per-seed histogram {88 ticks: 57, 169 ticks: 43}
- phantom1 aggro: median 1.5333 s
- phantom2 kiter: bothKilled 100/100, median 5.05 s (p90 15.4833), hitRuns 2

AFTER (Option B, phantom.enterDur = 2.0):
- phantom1 kiter: median 4.05 s (p90 6.0667), killed 100/100, expiry 0, hitRuns 0;
  per-seed histogram {243 ticks: 57, 364 ticks: 43}
- phantom1 aggro: median 2.15 s
- phantom2 kiter: bothKilled 100/100, median 6.075 s (p90 24.5667), hitRuns 7

### B.3 Verdict (frozen criteria, evaluated exactly)
- R1 PASS: median 4.05 s in [2.0, 12.0]; expiry 0 <= 15%; hit 0 <= 35%.
- R2 HOLDS: bothKilled 100% (unchanged); median 6.075 <= 20 s (5.05 -> 6.075, +1.025).
- R5 HOLDS: aggro 2.15 <= kiter 4.05 + 1.0.
- Decision rule step 3: SHIP Option B. Residual R1 CLOSED. Option A not needed.

### B.4 Deviation from the pre-registered prediction (documented)
- Predicted median TTK ~2.27 s (+0.8 s); measured 4.05 s (+2.58 s). Mechanism: the
  in-orbit kill offset is NOT preserved across the enter extension because
  (a) the pilot weave is a function of absolute tick (sin(t/90)*4), so the pilot's
  weave/relative phase at orbit start differs by 48 ticks, and (b) the phantom
  finishes homing to the ring in ~1.25 s (15 u at 12 u/s), i.e. BEFORE the 2.0 s
  gate, and sits stationary-invisible for the remaining 0.75 s, changing the
  pilot's closing geometry. Structure IS preserved: the per-seed cluster
  assignment is identical (the same 57/43 seeds in the same clusters, offsets
  +155/+195 ticks) - deterministic, no seed re-classification.
- R2 deaths (phantom2 hitRuns) 2 -> 7: the longer invisible enter gives the second
  phantom more time to strike before the pilot clears the first. The frozen R2
  constrains only bothKilled + median (both pass); recorded for transparency.
- The 8.2 s cycle is unchanged (enter is outside the cycle; the
  tests/phantom.test.js 8.2 s pin still passes); targetable fraction
  ~71% -> ~64% (7.0 s visible / 9.0 s), matching the pre-registered design intent
  (F1: readable time beats damage-model time).

### B.5 Pins and tests (measured, I524)
- enterDur affects only wave-13+ behavior (firstWave 13) -> the pin windows
  (causal495 wave 2 / 36.15 s; playframe A = MENU; B = frame 50 ~ wave 1) draw
  zero changed RNG: ALL EXACT - causal495 3-arm PASS (webgl/default EXACT; webgpu
  err=0 warn=3 documented I498 baseline), causal483 CAUSAL456 PASS,
  playframe483/491 PLAYFRAME456 PASS (B 52/55,400 hv=0/gv=0; console 0/0),
  pwa491 SUMMARY 11/11.
- No test re-pins required (the cycle pin excludes enterDur; the first strike now
  lands at 7.7 s = 462 ticks < the 600-tick budget).
- dist 5,254,934 -> 5,254,932 B / 184 (-2 B, measured); git diff vendor/ empty;
  BOM delta 0.
