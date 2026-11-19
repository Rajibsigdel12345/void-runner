# E70 Balance Follow-up - Research (I523)

I523 / ST-489 (E70 open). Scope: the two E69 residuals deferred at I522 (spec Appendix A.4,
quoted below) + the R8 re-measure they gate. Method per house culture: diagnose WITH
MEASUREMENT, pre-register levers + branch rules BEFORE any config move, smallest lever first,
at most one tuning pass per story (the named fallback lever is pre-registered here and is not a
second fiddle pass), residuals ship documented.

Authority: E69 CLOSED I522 with these residuals ACCEPT-WITH-DOCUMENTATION under the frozen
no-second-fiddle-pass policy (.evidence/I521/rules.md). E70 owns them.

CGS lens (cgs-balance-check output contract): Balance Levers = sec.3 (R1) + sec.4.3 (R7
pre-registered branches); Exploit Risk = sec.3 (per-option) + sec.7 (K1-K5); Pacing = sec.4.1 + F7/F8; Telemetry
Need = sec.4.2 + sec.9 (the ST-491 harness IS the telemetry). UNVERIFIED PREDICTIONS are labeled as
such and are confirmed-or-overturned by the harness in the code stories.

## 0. Deferred residuals (design/e69-enemy-spec.md Appendix A.4, verbatim)

    - R1: median TTK 1.4667 s, below the 2.0 s floor. Only the frozen phantom levers (orbitR/targetOpacity) can
      touch it; orbitR moved (smallest effective), targetOpacity explored with no better trade. Next-lever
      candidates for ST-488 (NOT frozen by ST-487): phantom 2-hit -> 3-hit HP, or cloak/strike timing.
    - R7: 0/10 reach wave 20. The kiter dies on waves 5-12, i.e. pre-E69 content (rocks/drones/stingers/flyers/
      hunters/gunships/sentries/wasps + mines). No frozen lever can reach this - all four are E69-only.
    - R8: null ratio - direct consequence of R7 (no wave 13-20 clears exist to measure).

Frozen criteria (.evidence/I521/rules.md, verbatim):
- R1: phantom1 (kiter, 100 seeds): median TTK in [2.0, 12.0] s AND expiry rate <= 15% AND hit rate (runs with
  >= 1 ship hit) <= 35%.
- R7: endless sweep (kiter, 10 seeds, full run from wave 1, cap 36000 ticks = 600 s): wave-20 reached in
  >= 6 of 10 runs.
- R8: same sweep: median non-boss wave-clear over waves 13-20 <= 2.5x the median over waves 1-12 (boss waves
  15/20 excluded from both medians, reported separately).

## 1. Measured state [TREE - config + I521 harness output, grep-verified I523]

### 1.1 The residuals (I521 AFTER, verbatim from spec A.1)
- R1: kiter median TTK **1.4667 s** (p90 2.8167, expiry 0, hit 0; seeds 62100+i x 100, wave-12 idle + L3
  weapon context). aggro 1.5333 s. cautious: 100% kill, median 23.825 s (orbitR 15).
- R7: **0/10** reach wave 20. Death waves **[5,10,5,5,12,8,10,11,10,6]**; medianDeaths 3; low-wave (1-12)
  median clear 21.1583 s.
  - RECOUNT (I523, against the recorded array): exactly **6/10** die on a heavyweight wave itself (wave 5 x 3,
    wave 10 x 3); **4/10** die on adjacent waves (6, 8, 11, 12 - x 1 each).
- R8: null (no wave 13-20 clears exist).
- Passing context (I521 AFTER): R2 {bothKilled 1, median 5.05 s} / R3 {4.6333, hit 0, kill 1} /
  R4 {8.2667, kill 1, stuns 100%} / R5 x4 PASS / R6 {250<400<500<600}.

### 1.2 Phantom (the R1 subject) - config facts (src/core/config.js)
| field | value |
|---|---|
| firstWave / perWave / maxConcurrent | 13 / 1 / 2 |
| hp / score | 2 / 250 (stinger rung - the INTENDED same-rung per R6 + spec 3, "fast + fragile-ish") |
| cycle | enter 1.2 s (invisible, 12 u/s) -> orbit 3.5 s (6.5 u/s, orbitR 15 u) -> cloak 1.2 s (opacity 0.12) -> drift 1.0 s -> strike 2.5 s = **8.2 s**, no RNG in step() |
| strike | uncloakDur 0.5 / chargeDur 0.35 / burst 3 bolts (gap 0.3 s) / boltSpeed 15 u/s / spread 0.16 rad |
| targetable | opacity > 0.5 only -> ~71% of the cycle (the frozen R1 rationale figure) |

The measured 1.4667 s INCLUDES the 1.2 s invisible enter: the kiter lands both killing bullets in the first
~0.27 s of the visible orbit phase. enterDur and hp are both plain config fields -> both R1 lever options
below are one-line config moves.

### 1.3 The heavyweight waves (the R7 window) - config facts
- Schedule: a heavyweight on every multiple of everyWave 5. The variant alternates by **bossSpawnCount**
  (game.js:592): spawn 0 = Monolith, 1 = Splicer, ...; a heavyweight wave where the previous boss is still
  alive spawns the **Warden** instead (no count increment). So in the sweep window: wave 5 = Monolith;
  wave 10 = Splicer (if the wave-5 Monolith died) or Warden (if it is still alive).
- **Monolith**: maxHp 64 (I325: was 40 - 40 gave a 7.7 s first-boss TTK < 12 s floor; 64 -> 12.7 s),
  hpFirstWave 10 / hpStep 12 / hpCap 88 -> wave 5 = 64, wave 10 = 64, wave 15 = 76, wave 20 = 88
  (boss.js:23-24). radius 3.4, speed 1.6 u/s, ringEvery 2.0 s, ringCount 8 S-rocks, death splits 4 M-rocks,
  score 1000.
- **Splicer**: maxHp 30 base, hpFirstWave 15 / hpStep 8 / hpCap 72 -> at waves 5/10 = **30**. radius 2.6,
  continuous two-arm spiral of UNDESTROYABLE bolts + one aimed bolt, score 600.
- **Warden**: armor 6 + hp 12 (18 total), radius 1.7, speed 2.4 u/s, score 400.
- Weapon progression (ST-122): L1 wave 1 (single) / L2 wave 5 (twin) / L3 wave 10 (triple, +15% rate) ->
  the wave-5 heavyweight is fought on L2, the wave-10 heavyweight on L3.
- CONSEQUENCE: the R7 wave-5/10 deaths are NOT necessarily "64-hp Monolith" deaths. Wave-10 deaths may be
  30-hp Splicer deaths (undestroyable spiral) or Warden deaths. ST-491 must attribute (sec.4.2) before any
  lever is chosen - this is the single most important diagnosis gap in the recorded data.

### 1.4 Pre-E69 roster (the R7 leak-regime candidates) - hp / score / firstWave / maxConcurrent
| type | hp | score | wave | maxConc | notes |
|---|---|---|---|---|---|
| rock L / M / S | 1 (splits) | 25 / 50 / 100 | 1+ | 24 global | L splits 2-3 M, M splits 2-3 S; shielded variant carries armor |
| mine (chaser) | 1 | 150 | 5 | 10 | 3.2 u/s homing; shoots inside 7 u every 3.0 s |
| hunter | 1 | 300 | 6 | 2 | rear-dash (orbitR 7.5) |
| stinger | 1 | 250 | 7 | 2 | charge-dart, 0.8 s telegraph, maxCharges 6 |
| gunship | 10 | 600 | 8 | 1 | slow bomber |
| drone ("seeker") | 1 | 200 | 8 | 6 | 4.4 u/s homing, wobble, maxAge 30 s |
| flyer | 1 | 400 | 9 | 2 | |
| sentry | 3 | 350 | 11 | 2 | |
| wasp | 1 (splits) | 100 | 12 | 6 | |
- E69 types (out of the R7 death window, context only): phantom 2 / 250 / W13 / 2; hauler 12 / 400 / W16 / 1;
  bulwark 18 / 500 / W17 / 1.

### 1.5 Build/budget + pin state (I522 close, unchanged since)
- dist 5,254,934 B / 184 files; ceiling 6,100,000 B (pre-registered, renegotiated at G69.0);
  CLOSE FLOOR E69 = 845,066 B (headroom rule: >= 102,400 B or cut ladder).
- Vendor pins r187 EXACT 8/8 (raw 104F561458997220 / 613E370F76638FDE / EAFEAD3154EC0609 /
  D8F3CDB8B85B799A; dist-min A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- Pin set (5 harnesses, all EXPECTED EXACT through E70): causal495 (dist :4200) 3-arm seed-9876 window =
  wave 2 / 36.15 s (score 11334 / kills 57 / combo 15 / shots 198 / acc 0.2878787878787879 /
  time 36.14999999999923 s / replay 2169-2220 / speed 4 / rocks L 2.2 M 1.3 S 0.7 / console 0/0; webgpu arm
  report-only err=0 warn=3 documented I498 dirt); causal483 (dev :5173) CAUSAL456 PASS; playframe483+491
  (dev :5173) PLAYFRAME456 PASS (A MENU 22/25,781 + 11/180; B reseed 71201 frame 50 52/55,400 hv=0/gv=0);
  pwa491 (dist :5199) SUMMARY 11/11.
- `npm test` 1,187/1,187 (fresh I522).

## 2. Web findings [WEB - YouTube chapter-level cites; transcripts rate-limited, the accepted house norm]

Sources (8 usable, 2 search passes: I523 pass + the E69-carry-over pass; house norm S1..Sn / F1..Fn):
- S1 GMTK "What's The Point Of Hard Games, Anyway?" (Ip5pYl-MuYs, 748K, 2025): 1:49 why hard / 5:24 Fair or BS / 7:27 adjustable difficulty.
- S2 "What Makes A Good Difficulty Option?" (Gpfgh02qJ4I, 617K): 2:03 Too Hard / 8:57 Adaptive Difficulty / 12:50 Don't Punish Players / 14:29 Use Objectives / 20:45 Hades / 23:00 RiskReward.
- S3 EU "Difficulty MATTERS / How Easy Mode Shifts Game Design" (ebIC0o2EXsc, 30K): 1:06 super-easy modes don't function as genre intros / 6:44 shmup = "genre of nuance... of precision" / 10:21 life-or-death runs expose design flaws.
- S4 EU "Japanese Vs. European Shoot Em' Up Design" (0sOzq0ikzMM, 39K): 5:05 basic patterns still hard via ship-movement management / 13:36 stretched low-density content = player-time waste.
- S5 EU "Why Classic Video Games are GONE" (qoVVB3Va5kw, 121K): 1:26 "The GOLDEN Arcade Difficulty Curve is Gone" / 6:28 density vs stretched content / 15:00 scoring / 18:40 timers.
- S6 GMTK "How Games Get Balanced" (WXQzdXPTb2A): 1:40 trade-offs / 3:37 counters / 7:16 testing / 10:47 nerf-buff / 12:56 across-skill-levels.
- S7 GMTK "How to Keep Players Engaged" (hbzGO_Qonu0): 1:07 pacing / 3:11 novelty / 3:44 anticipation / 8:18 compelling challenge.
- S8 EU "Arcade Level Design is NOT Linear, It's INFINITE" (_nAVbHYaEN8): 5:55 loop = endless structure / 6:08 loop lens / 6:51 teach-once-then-recur.

Findings:
- F1 [S1 5:24] The fairness axis: telegraphed + avoidable = fair; kills-before-readable = BS. R1's phantom
  (1.4667 s TTK: 2 hits in ~0.27 s of visible time after a 1.2 s invisible enter) sits on the BS edge for a
  human player - the threat is shorter than read + lock time. A lever that adds READABLE time / slows the
  approach beats a lever that adds damage-model time (sec.3 prefers Option B on this ground, Option A is
  the fallback).
- F2 [S2 12:50 + 14:29] Don't punish players; use objectives. Endless mode = pure endurance with NO
  objectives or checkpoints (campaign has Ikaruga-style checkpoints; endless has none). Wave-5/10 deaths
  (6/10 of the sweep) are therefore punishment-without-objective moments - the fix must make the heavyweights
  fair (readable, avoidable, clearable), not merely shorter.
- F3 [S2 8:57 + S6 12:56 + S3 10:21] Balance for the mid-skill band; 0/10 is a flaw, not difficulty.
  Adaptive + across-skill-levels balancing targets the middle player (the kiter is the frozen mid-skill proxy);
  life-or-death runs expose design flaws - 0/10 wave-20 = a flaw at waves 5-12, not "hard".
- F4 [S3 6:44] Shmup is a genre of nuance/precision: difficulty should shift nuance, not just numbers.
  Option B (a timing/pace lever) preserves the nuance of the phantom's rule; Option A (HP) changes the
  rule's cost. Both ship WITH MEASUREMENT; the preference ordering is documented, not dogma.
- F5 [S4 5:05] Classic patterns stay hard through ship-movement management. The kiter's 12 u standoff weave
  IS a movement constraint; if it dies on waves 5-12, the arena's pressure is exceeding the pilot's movement
  capacity - the R7 "leak regime" (sec.4.1 H2) is a real hypothesis, not a strawman.
- F6 [S4 13:36 + S5 6:28] Stretched low-density content wastes player time; density over length. The endless
  curve must keep waves 1-12 from being both sparse AND lethal; ST-491 records per-wave spawn density so the
  shape (ramp -> spike -> breather) can be checked, not assumed.
- F7 [S5 1:26] The golden arcade difficulty curve = ramp -> spike -> breather. Boss spikes are canonical, but
  a spike that the mid-skill proxy cannot survive is a broken spike, not a hard one. R7's 6/10 on the two
  spike waves (5, 10) = the spikes are too sharp relative to the ramp - or the ramp is leaking (H2).
- F8 [S7 1:07 + 3:44] Pacing + anticipation. The breather between heavyweights (waves 6-9, 11-14) must
  restore the player's resources; if the kiter arrives at wave 10 with depleted lives/weapon, the wave-10
  heavyweight is a death sentence regardless of its own tuning. ST-491 records resource state at death so this
  is measured, not guessed.
- F9 [S8 5:55 + 6:51] Endless = teach-once-then-recur loop. Waves 5-12 re-serve the rock/mine/drone/stinger/
  flyer patterns; deaths there are a teach-loop failure (pattern not mastered at the intensity served) -
  supporting the density/pressure reading of H2.

Noise discarded (no usable chapter-level highlights or thin relevance): Bog Hog SHMUP WORKSHOP, Lazy Devs
listicles, Matt Mora (64 views), Last Bacon (908 views), AKTANE design talk (prototype stage, low value).

## 3. R1 lever analysis (pre-registered for ST-490)

Both options are one-line config moves (phantom.enterDur / phantom.hp) and touch only wave-13+ behavior.

Option B (PRIMARY): phantom.enterDur 1.2 -> 2.0 s (the invisible flank-in phase).
- Measured prediction (UNVERIFIED until ST-490): TTK +0.8 s -> ~2.27 s, inside [2.0, 12.0]; expiry
  unchanged 0 <= 15%; hit rate unchanged 0 <= 35% (the pilot's visible-phase behavior is untouched - the
  kiter still sees the phantom on the same 15 u ring at the same relative phase).
- R2 (phantom2, 100 seeds) prediction: median 5.05 -> ~5.85 s (both phantoms' enters lengthen; no expiry
  change) <= 20 s; bothKilled 100% unchanged.
- R5 prediction: kiter ~2.27 / aggro ~2.33 -> aggro <= kiter + 1.0 holds.
- Cycle 8.2 -> 9.0 s; targetable fraction 71% -> ~64% (visible-phase time 7.0 s unchanged / 9.0 s cycle).
- Design rationale: pure pacing lever (the encounter simply starts 0.8 s later; the threat is otherwise
  identical); preserves the 2-hit "fast + fragile-ish" identity and the R6 same-rung rationale (the phantom
  stays 250-score / 2-hit, unlike the stinger's 1-hit); smallest damage-model change of the two options
  (exact additive time, no hit-interval uncertainty) - F1/F4.
Option A (FALLBACK): phantom.hp 2 -> 3.
- Measured prediction (UNVERIFIED): TTK + one hit interval -> ~2.0-2.4 s (the kiter's per-hit interval is NOT
  in the recorded data - this option's TTK is less predictable, and it risks landing under the 2.0 s floor).
- R2 prediction: 5.05 -> ~7.5-8 s (each phantom takes +1 hit) <= 20 s.
- Identity cost: the phantom becomes tougher than the stinger (1 hit, same 250 rung) - against the spec-3
  "fast + fragile-ish" same-rung intent (documented in R6). Score ladder R6 unaffected (score unchanged).
Decision rule (pre-registered, evaluated in ST-490):
1. Re-run phantom1 on 62100+i x 100 to confirm the 1.4667 s baseline still reproduces (harness
   .evidence/I521/balance521.mjs, wave-12 idle + L3 context, kiter).
2. Apply Option B (one-line config). Re-measure phantom1 + phantom2 (R1/R2/R5 criteria).
3. If R1 in band AND R2/R5 hold -> ship; spec Appendix B (E70) records BEFORE/AFTER; residual R1 CLOSED.
4. Else revert enterDur to 1.2, apply Option A (pre-registered fallback, not a second fiddle pass),
   re-measure the same criteria.
5. If both fail -> ACCEPT-WITH-DOCUMENTATION (E69 precedent); the residual moves to the E71+ backlog with
   the full measurement record.
Pin safety: enterDur/hp affect only wave-13+ phantom behavior (firstWave 13) -> the pin windows (causal495
wave 2 / 36.15 s; playframe A = MENU; B = frame 50 ~ wave 1) draw zero changed RNG -> EXPECTED EXACT;
re-pin ONLY with measurement on measured drift (I482 pattern).

## 4. R7 diagnosis + pre-registered branches (frozen; the lever is chosen from ST-491 data)

### 4.1 Measured pattern + hypotheses
Recorded (1.1): 6/10 die on a heavyweight wave itself (wave 5 x 3 - the Monolith at 64 hp,
fought on L2; wave 10 x 3 - the Splicer at 30 hp with its undestroyable spiral, OR the
Warden at 18, per the 1.3 alternation finding), 4/10 die on adjacent waves (6, 8, 11, 12);
medianDeaths 3; low-wave (1-12) median clear 21.1583 s.
- H1 HEAVYWEIGHT WALL: 6/10 exactly on the two spike waves (5, 10). F7: the spikes are too
  sharp relative to the ramp. The Monolith is a twice-proven balance flashpoint (40 -> 64
  at I325 after a 7.7 s first-boss TTK < 12 s floor). Caveat: wave-10 deaths count as
  heavyweight either way (Splicer or Warden); ST-491 attributes the class.
- H2 LEAK REGIME: the 4/10 adjacent deaths (6, 8, 11, 12) + cumulative resource drain from
  the pre-E69 pressure band (mines W5 maxConc 10 shooting inside 7 u; drones/hunters/
  stingers/gunships/flyers/sentries/wasps re-serving waves 5-12). F5 (movement capacity),
  F6 (density over length), F9 (teach-loop failure) support it; F8: the breather between
  heavyweights must restore resources - if the kiter arrives at wave 10 with depleted
  lives/weapon, wave 10 is a death sentence regardless of its own tuning.
- H3 PILOT WALL: the kiter's 12 u standoff weave is FROZEN (I328 pilot trio). If arena
  pressure exceeds the pilot's movement capacity, the honest outcome is
  accept-with-documentation - but F3 (0/10 = a flaw, not difficulty) makes H3 the last
  branch (C), never the default.

### 4.2 ST-491 protocol (frozen; diagnosis only, NO game change)
Same 10 seeds (52700+i), full director from wave 1, cap 36000 ticks (600 s), kiter.
Per-run records:
(a) KILLING-BLOW SOURCE CLASS: Monolith (body + ring S-rocks + death-split M) / Splicer
    (body + spiral/aimed bolts) / Warden / per-roster-key enemy / rock L/M/S / mine /
    other;
(b) wave at death;
(c) RESOURCE STATE AT DEATH (lives used, weapon level, shield, active powerups, bombs);
(d) HEAVYWEIGHT STATE AT DEATH (class alive + remaining hp + time since that boss wave);
(e) per-wave clear times 1-12 + per-wave spawn counts (density for the F6/F7 curve check);
(f) kills / score / combo at death.
Instrumentation: the ship-hit emit site(s) in game.js (currently emit('hit', { pos, knock,
lives }), game.js:520) gain a payload-only source tag. Payload only: no logic change, no
RNG change; all ship-hit sites enumerated in ST-491. Output: .evidence/I525/sweep525.json
+ report (killing-blow histogram, per-wave death table, resource distribution).

### 4.3 Branch rules (deterministic; evaluated on the ST-491 data)
- BRANCH B (heavyweight wall): {Monolith, Splicer, Warden}-attributed killing blows
  >= 6/10 -> ST-492 applies ONE lever from the frozen ordered list matching the DOMINANT
  heavyweight class (dominant = most killing blows; tie -> Monolith > Splicer > Warden):
  [1] Monolith boss.ringEvery 2.0 -> 2.5 s / [2] Splicer splicer.maxHp 30 -> 24 /
  [3] Warden warden.armor 6 -> 4 / [4] Monolith boss.ringCount 8 -> 6 /
  [5] Monolith boss.maxHp 64 -> 56.
  Monolith-dominant -> [1] first (same-class second levers pre-registered in order:
  [4], then [5]). Splicer/Warden-dominant -> single lever; on failure -> accept (no
  second lever).
- BRANCH A (leak): heavyweight-attributed < 6/10 AND one non-heavyweight source
  (a specific roster key / rock / mine) >= 4/10 killing blows -> ST-492 = the SMALLEST
  pressure lever for that source (frozen candidates: mine.maxConcurrent 10 -> 7 /
  mine.fireEvery 3.0 -> 4.0 / drone.maxConcurrent 6 -> 4 / wasp.maxConcurrent 6 -> 4 /
  stinger.maxCharges 6 -> 4).
- BRANCH C (pilot wall / diffuse): otherwise -> accept-with-documentation (F3; the
  pilot trio is frozen I328; a global difficulty knob = instrument change, out of E70
  scope).
- Success (ST-492): fresh 10-seed sweep (52700+i) wave-20 >= 6/10 + R8 recompute
  (median non-boss wave-clear over 13-20 <= 2.5x over 1-12; boss waves 15/20 excluded
  from both medians, reported separately).
- Pin safety: every lever gates wave >= 5 (roster firstWave / boss.everyWave 5) or
  >= 13 (phantom) -> the pin windows (causal495 wave 2 / 36.15 s; playframe A MENU;
  B frame 50 ~ wave 1) draw zero changed RNG -> EXPECTED EXACT; re-pin ONLY with
  measurement on measured drift (I482 pattern).

## 5. dist + asset policy (PRE-REGISTERED)
- Code/config-only; expected +2-8 KB per code story (one-line config + test re-pin +
  payload tag). Ceiling 6,100,000 B HOLDS (no renegotiation anticipated; headroom
  845,066 B at open).
- Zero new assets: fleet 31 GLBs / 2,925,988 B / 63,617 tris unchanged through E70.
- CLOSE FLOOR E70 re-derived WITH MEASUREMENT at G70.0 (headroom >= 102,400 B or cut
  ladder).

## 6. Cut ladder (in order)
- C1 (R7): after the allowed pass, if the fresh sweep is < 6/10 -> accept-with-
  documentation (E69 precedent; the epic still closes; the residual moves to the E71+
  backlog with the full measurement record).
- C2 (R1): Option B -> Option A -> accept-with-documentation (the frozen decision rule,
  sec.3).
- C3: drop the R8 re-measure if R7 is unreachable (R8 is derived - no 13-20 clears to
  measure).

## 7. Risks
- K1 pre-E69 core touched (branch A levers touch wave 5-12 roster) -> the wave-gate pin
  argument (pin windows are wave 1-2) + measurement + the one-pass cap.
- K2 pilot-change temptation (weave/standoff) = instrument change, not balance - last
  resort only (branch C), out of E70 scope.
- K3 TTK over-correction > 12 s ceiling -> the R1 band [2.0, 12.0] in the harness
  catches it.
- K4 dist growth negligible (< 10 KB total vs 845,066 B headroom).
- K5 10-seed artifact -> the 10-seed count is frozen (the R7 criterion); borderline
  5/10 outcomes are resolved by the deterministic branch rules above, not discretion.

## 8. Story map + estimates (cgs-estimate contract)
- ST-489 (I523, this): docs-only. Estimate 1 iter. Confidence HIGH. Dependency: none.
  Buffer: none.
- ST-490 (I524): R1 fix WITH MEASUREMENT. Estimate 1-2 iters. Confidence HIGH (one-line
  config + the existing balance521 harness). Dependency: ST-489. Buffer: the fallback
  lever (Option A) is pre-registered, not a second fiddle pass.
- ST-491 (I525): R7 diagnosis harness. Estimate 1 iter. Confidence MED-HIGH (new
  payload-only instrumentation + report). Dependency: ST-490 (kept linear; the harness
  reuses the I521 sweep scaffolding). Buffer: none.
- ST-492 (I526): R7 lever WITH MEASUREMENT. Estimate 1-2 iters. Confidence MED (data-
  dependent lever). Dependency: ST-491 data. Buffer: branch C (accept) is also a full
  stop - still 1 iter.
- ST-493 (I527): G70.0 close gate. Estimate 1 iter. Confidence HIGH (5-harness re-runs
  + floor re-derive + bookkeeping). Dependency: ST-489..ST-492. Buffer: none.
Total: 5-7 iters, strictly linear 489 -> 490 -> 491 -> 492 -> 493; no discipline
handoffs (no Blender / art / audio).

## 9. Telemetry Need (cgs-balance-check contract)
The ST-491 harness IS the telemetry: killing-blow attribution + resource state at death +
per-wave spawn density + per-wave clear times (sec.4.2). Node-only - no in-browser
telemetry, no new persistent telemetry surface (console 0/0 by the pin bar).

## 10. Changed files (this story, docs-only)
- + design/e70-balance-followup-research.md (this file; sec.4-11 appended I523)
- + production/scope-check-E70.md
- ~ production/epics.md (E69 header doc-fix OPEN -> CLOSED; + E70 block)
- ~ production/stories.md (STATUS I523 line)
- ~ production/iterations.md (I523 entry)
- ~ production/timeline.md (I523 line)
- ~ CHANGELOG.md (I523 line)
- ~ production/session-state/active.md (I523 note)
- + .evidence/I523/ (edit scripts + results, force-added)

## 11. Verification evidence + next owner
- Bar (docs-only, measured): npm test 1,187/1,187 + build exit 0 + dist byte-identical
  5,254,934 B / 184 + git diff vendor/ empty + BOM delta 0 + hygiene (no servers, no
  tabs).
- Next owner: I524 = ST-490 (R1 WITH MEASUREMENT; decision rule step 1 = re-confirm the
  1.4667 s baseline on 62100+i x 100 BEFORE any config move).

## 12. R7 resolution - Branch C: accept-with-documentation (I526, ST-492; recorded WITH MEASUREMENT)

### 12.1 Branch evaluation on the ST-491 data (I525 sweep, 52700+i x 10, deterministic)
Measured (I525, .evidence/I525/sweep525.json + results525.txt): 10/10 runs died, median
death wave 9, all runs hits=3. Killing-blow tally (primary attribution; strict ==
primary, 0 monolithProbable rocks): MONOLITH 3 (1 of the 3 is a residual bolt 12 ticks
after the boss death - recorded as bullet_unknown per the frozen boss-alive-at-hit
rule), SPLICER 1, gunship 2, rock_S 1, rock_L 1, sentry 1, bullet_unknown 1.
- H (heavyweight-attributed) = 4/10 < 6/10 -> Branch B NOT met.
- Max non-heavyweight source = gunship 2/10 < 4/10 -> Branch A NOT met.
- -> BRANCH C (pilot wall / diffuse): accept-with-documentation. NO lever applied.

### 12.2 What the data shows (recorded for the next episode)
- The kill distribution is diffuse: 10 kills across 7 source classes (4 heavyweight
  across 3 classes; 5 pre-E69 roster/rocks + 1 residual unknown). No single
  pre-registered lever target accounts for a majority of deaths; every frozen lever
  (Branch A/B candidates) is individually below its threshold.
- The wave-5 Monolith is a WINDOW problem, not an unbeatable HP wall: the kiter killed
  the wave-5 Monolith in 7 of 10 runs (bossDeaths 5805/6454/7977/7550/5242/7014/6270),
  yet 4/10 runs still died on wave 5 - from its bolts (body/aimed) while it was alive
  or in the ticks after death. No run cleared wave 8+; the pre-E69 pressure band
  (waves 5-12: rocks + drones/hunters/stingers/gunships/sentries/wasps + mines) is
  where the kiter runs out of resources (all runs hits=3 at death).
- Median non-boss clear w1-7: 22.4/23.8/21.8/20.5/22.7(7/10)/10.0(6/7)/14.4(6/6) s;
  plannedContent run0 w1-12: 5/6/6/8/10/6/8/10/11/12/9/10 spawns.

### 12.3 Acceptance + residual disposition
- R7 (0/10 reach wave 20): stays OPEN as a documented known limitation - the I525
  sweep reconfirms it (median death wave 9; no wave-8+ clear). Consistent with the E69
  close (I522): documented, not fixed. No frozen lever can reach it (all four are
  E69-only) and Branch C forbids a global difficulty knob (instrument change; the pilot
  trio is frozen I328; out of E70 scope).
- R8 (null ratio): stays OPEN as a direct consequence of R7 (no wave-13-20 clears
  exist to measure).
- No lever applied, no config change, no src change. The 15 payload-only hit-source
  tags (I525) remain as permanent telemetry for future episodes.
- Future-episode inputs (NOT E70 scope): if a future episode relaxes the pilot freeze,
  the largest non-heavyweight cluster is the gunship (2/10; unique 0.5 radius bolt);
  the Monolith post-kill bolt window (residual bolts after death) is a cleanup
  candidate; the pre-E69 density band (waves 5-12) is the pressure wall behind both.

### 12.4 Verification (I526, docs-only, measured)
npm test 1,187/1,187 + build exit 0 + dist byte-identical 5,255,258 B/184 (src
unchanged since I525) + git diff vendor/ empty + BOM delta 0 + hygiene (no servers,
no tabs). Next owner: I527 = ST-493 (G70.0 close gate).
