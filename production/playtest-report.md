# Playtest Report - Void Runner (I41, ST-041)

Method: scripted self-play. Bots drive the game through `window.__vr.advance` with an explicit per-chunk intent (the QA-plan Suite-B recipe), so all numbers below are **measured evidence**, not impressions. Human-comprehension items are labeled **assumption** and need a human session to confirm. Two skill profiles bracket the expected human range:

- **Run A "casual"**: no lead-aim (aims at a rock's current position), no evasion, drifts toward arena center, chases power-up drops.
- **Run B "skilled"**: lead-aim (aims where the rock *will be*, flight-time corrected), evasive perpendicular thrust when a rock closes within 4.5u, opportunistic drop chase when safe.

## Run results

| Metric | A casual | B skilled |
|---|---|---|
| Survived | 180s (time-capped, still alive) | 209.2s (game over) |
| Wave reached | 1 (never cleared the field) | 15 |
| Score | 5,054 | 104,955 (NEW BEST, persisted) |
| Kills | 40 | 696 |
| Lives lost | 1 | 3 |
| Max combo | 10 (cap) | 10 (cap) |
| Drops spawned / picked | 3 / 3 | 59 / 58 |
| First kill | 3.3s | 3.4s |

Run B wave pacing (time each wave was reached): 1@2.4s, 2@19, 3@36.8, 4@55, 5@68.6, 6@90, 7@108.2, 8@117.8, 9@121.2, 10@134.2, 11@142.8. Early waves run ~17-21s each; intervals tighten as rocks speed up (waves 8-9 separated by only 3.4s) - the escalation is felt.

## Findings

**F1 - Wave 1 can be camped indefinitely (design gap, evidence).** Run A never cleared the wave-1 field, so the wave director never advanced (GDD rule: wave advances on full clear). The bot spent 180s farming 5 rocks + fragments, took 1 hit, and banked combo-10 kills at no meaningful risk. There is **no time pressure or refill** on a wave. A human "chill" player can do the same. *Suggestion (needs a design decision, GDD change): a wave timer that advances (carrying leftover rocks, optionally sped up) after ~45-60s, or a slow trickle refill during a wave. Deferred - candidate for I42 or E7 content design; not implemented this iteration.*

**F2 - Hit clustering in dense waves is lethal (evidence).** Run B's two early lives died **2.2s apart in wave 6** (t=92.4 and t=94.6): the 1.6s post-hit invulnerability expired, and the next rock in a dense (18-concurrent) field landed before the bot could reposition. A third hit at wave 15 ended the run. This is correct behavior, but it shows the death pattern in dense waves is "two bad patches", not a gradual bleed. *Suggestion: watch whether 1.6s invuln feels fair in a human playtest; a small bump (or a stronger knockback that creates separation) is a one-line config change if it doesn't.*

**F3 - Skill gap is very wide (evidence, by design for arcade).** 5,054 vs 104,955 in similar time (~20x). Lead-aim alone is the biggest lever: Run A's straight aim only reliably hits L rocks and close M rocks (40 kills in 180s), while Run B's flight-time-corrected aim sustains ~3.3 kills/s. Good for an arcade survival game - mastery has a score ceiling that is actually reachable.

**F4 - Combo cap is trivially reachable by a consistent killer (evidence + assumption).** Both bots pinned combo 10 (1.9x). For a bot with zero reaction time this is expected; **assumption**: a human will find combo 5-7 (1.4-1.6x) a more typical ceiling while dodging. No change recommended unless human playtest (I90) shows the cap is never meaningful.

**F5 - Drop economy is healthy (evidence).** 59 drops over 696 kills with maxActiveDrops=1 => a drop roughly every ~3.5s of skilled play; the skilled bot collected 58/59 (98%) because it chases them. A less greedy human will collect fewer - the 25% roll and single-active-drop cap are working as intended (no flood, no starvation).

**F6 - Onboarding timing is good (evidence).** First kill at ~3.3s in both runs: the 2.2s intermission plus the first rim spawns give an immediate target within the first second of play, before the tutorial hint even fades (6s).

**F7 - Game-over screen communicates the full session (evidence).** Screenshot `.evidence/i41-playtest-gameover-wave15.png`: score, best + NEW BEST flag, kills 696, wave 15, max combo x10, time 3:29 - all rendered and correct.

## Comprehension / friction (assumption - needs human confirmation)

- Controls are legible at a glance (menu lists them; hint line repeats them in-game). Assumption: fine.
- **Aim model**: ship nose eases toward the cursor (aimEase 9) while firing direction = aim direction. Assumption: mouse players will like it; the *lead* requirement (F3) is the hidden skill axis and nothing teaches it - a first-wave kill of a moving M rock may feel like a miss to a new player. *Suggestion: none for now; the I44 UI/UX pass can evaluate a subtle aim-reticle that shows the actual fire line.*
- **Power-up identification**: shape + color per type (colorblind-safe per GDD). Assumption: readable at game speed; confirm in human session.
- No text/flow was observed that could confuse: banners, hint, and HUD are short.

## Loop appeal (assumption, grounded in the metrics above)

The core loop (fly, shoot, split, chain, grab) sustains itself: wave pacing tightens, score feedback is constant (popups), and the power-up cadence (~3.5s) keeps a side-objective alive without interrupting the kill chain. The main appeal risk is F1's low floor - a player who never clears a field never feels the escalation.

## Recommendations (ordered)

1. (Design decision) Wave stall fix - F1. Owner: design. Where: I42 scope decision or E7.
2. (Watch) Invuln fairness at high density - F2. Owner: design/balance. Where: human playtest, then I92 balance pass 4 if needed.
3. (Optional) Fire-line reticle to teach lead-aim - F3/F7. Owner: UI/UX. Where: I44.
4. No action: combo cap (F4), drop economy (F5), onboarding timing (F6).

## Verification

- Both runs executed via Playwright on the live dev build (post-I39 config: speedCap 2.1 active; Run B's wave 15 speedMult was 1.9 - the new cap only bends the curve from wave 17).
- 0 console errors across both runs.
- Game-over stats cross-checked against world state (score/kills/wave/time all matched the screen).
- Screenshot: `.evidence/i41-playtest-gameover-wave15.png`.


---

## Playtest v2 (I90, ST-090)

**Method**: same scripted self-play as v1 (bots drive `w.step(dt, intent)` core-only, so every number below is measured, not impression). The build under test now includes systems absent in v1: the **Monolith boss** (wave 5), **wave modifiers** (fast/small/inward, first mod wave 3), **mines** (wave 5+), **vortex** (wave 8+) and **wave stall-advance** (F1 fix, I42). Two profiles bracket the human range: **Run A "casual"** (straight-aim spray, center-drift, no evasion) and **Run B "skilled"** (flight-time lead-aim, perpendicular evasion of rocks/bullets/boss, boss range-keeping, drop chase). Neither bot uses power-ups strategically (just picks them up) - so boss-cost figures are a *no-powerup* lower bound.

### Summary

Run B **beats the wave-5 Monolith** (hp 40, ~15.6s) but pays **2 lives** for it, then dies ~16s into the following **fast** wave 6. Run A is force-advanced to the boss by the stall timer and dies *inside* the boss fight. The v1 **F1 stall-advance fix is confirmed** (an un-cleared field now advances at 45s). The fix also **collapsed the casual/skilled score spread from ~20x (v1) to ~1.4x (v2)** and re-expressed the skill axis as **wave-depth + boss-clearance** rather than raw score. Wave 5 -> 6 is now the steepest difficulty cliff in the game.

### Run results

| Metric | A casual | B skilled | B v1 (I41) |
|---|---|---|---|
| Survived | 145.4s (game over) | 155.85s (game over) | 209.2s (game over) |
| Wave reached | 5 (boss) | 6 | 15 |
| Score | 16,295 | 23,080 (NEW BEST) | 104,955 |
| Kills | 124 | 159 | 696 |
| Lives lost | 3 (died in boss fight) | 3 (2 in boss, 1 in wave 6) | 3 |
| Max combo | 10 (cap) | 10 (cap) | 10 (cap) |
| Drops spawned / picked | 2 / 1 (50%) | 9 / 9 (100%) | 59 / 58 |
| First kill | 3.32s | 4.38s | 3.4s |
| Boss (wave 5) | not killed (died inside) | **killed in 15.6s**, 2 hits | n/a (no boss in v1) |
| Max concurrent rocks | 24 (cap) | 24 (cap) | - |

**Score spread A/B: ~1.4x in v2 vs ~20x in v1.** The casual bot now scores **3.2x more** than its v1 self (16,295 vs 5,054) because stall-advance forces it through the waves instead of camping wave 1.

### Loop Completion

- Full loop completes for both bots (menu -> play -> escalating waves -> boss -> game-over screen). No bot soft-locked.
- **Wave progression under stall-advance (A):** wave1@2.22 -> wave2@9.07 (cleared) -> wave3@47.55, wave4@92.55, wave5@137.57 (stall-advanced ~45s each). The casual bot clears the two opening waves, then the 45s stall timer carries it into the boss wave.

### Friction

- **Wave 5 -> 6 is the wall (evidence).** B clears the boss at t=114.3 but takes 2 hits during the fight (t=110.2 before the kill, t=116.32 after) and then dies ~16s into wave 6, which carries the **fast** modifier. Dense (24 concurrent, cap) + 1.4x speed -> hit clustering ends the run. A dies earlier, inside the boss fight.

- **Wave modifiers are invisible (friction, needs UI).** A run shows mods on waves 3/4/5/6 (small/small/inward/fast) but the game gives no on-screen reason a wave suddenly feels denser or faster. B died in a *fast* wave with no signal that speed had spiked. (Design input for I93 - see below.)

### Observation

- **F1 stall-advance - FIXED, CONFIRMED (evidence).** No-input test: wave 1 starts t=2.22, and with *no input at all* the field stall-advances to wave 2 at **t=47.22 (exactly the 45s stallTime)** with 5 rocks still present (not a clear) - leftover rocks carry over. Corroborated by Run A with input: the casual bot could not clear waves 3-4 in time and was force-advanced to wave 5. The v1 low floor ("camp wave 1 forever, bank combo-10 at no risk") is gone.

- **F8 (new) - the F1 fix re-expressed the skill gap (evidence).** v1 spread ~20x (5,054 / 104,955); v2 spread ~1.4x (16,295 / 23,080). Mastery is no longer readable in the score - it is readable in **how deep you get** (A: dies in the boss; B: clears the boss, dies next wave) and **whether you beat the boss**. For arcade survival this is a healthier axis, but the score board no longer separates casual from skilled well.

- **F9 (new) - the wave-5 boss is a hard difficulty spike (evidence).** Skilled play clears the 40-hp Monolith in ~15.6s but costs 2 of 3 lives; casual play dies inside it. Combined with the fast wave 6 immediately after, the boss wave is a compounding cliff (survive the rings, spend your lives, then face a denser-faster wave with no buffer).

- **F2 hit clustering - CONFIRMED, now also boss-driven (evidence).** v1: B lost 2 lives 2.2s apart in a dense wave 6. v2: A lost 2 lives **2.84s** apart (140.73, 143.57) and B lost 2 lives **6.12s** apart (110.2, 116.32) - both in the boss wave. The 1.6s invuln expiry + next-threat-lands pattern holds, and the boss ring cadence (every 2s) is now a second clustering driver alongside rock density.

- **F3 skill gap - still true, reframed (evidence).** The gap persists as survival depth (A wave 5 vs B wave 6 + boss clear), not score.

- **F4 combo cap - trivially reachable, CONFIRMED (evidence).** Both bots pin combo 10, including the casual spray bot. The cap is a near-universal ceiling, not a skill ceiling. (The human "is combo 5-7 more typical" question still needs a real human session - bots have zero reaction time.)

- **F5 drop economy - CONFIRMED healthy (evidence).** 25% roll + single-active cap holds (no flood). Skilled pickup 100% (9/9), casual 50% (1/2). Fewer absolute drops than v1 only because both v2 runs are shorter.

- **F6 onboarding - CONFIRMED (evidence).** First kill 3.3s/4.4s, matching v1.

- **F7 game-over screen - CONFIRMED, now richer (evidence).** `.evidence/i90-playtest-gameover.png`: SCORE 23080 / BEST 23080 / NEW BEST! / KILLS 159 WAVE 6 / MAX COMBO 10 / TIME 2:35 / **BOARD RANK #1** / PRESS ENTER TO RESTART. The high-score board-rank line is new and renders correctly.

- **New-system determinism (evidence).** Wave mods are seed-deterministic: both runs hit *small* on wave 3 (same seed -> same pick). I89 verified the modifiers are applied correctly (fast x1.4 speed, small S-bias, inward accel 2.0).

- **Concurrent-rock cap saturation (evidence).** Both runs pinned maxRocks at 24 (maxConcurrent). Late waves are always at max density; 24 rocks + a fast modifier is the actual terminal condition for the skilled bot.

### Design Implication

1. **(I92 balance) Soften the post-boss spike - F9.** The boss wave costs ~2 lives even for skilled play, then a *fast* wave follows with no buffer. Candidate levers (pick one, all one-line config): (a) guarantee a non-`fast` modifier on the wave immediately after a boss wave; (b) give a short post-boss intermission/grace; (c) trim ring bolt count 8 -> 6 or speed. Recommend (a) - it directly targets the observed B death.

2. **(I93 UI/UX) Make wave modifiers legible.** A wave that suddenly feels denser/faster should say so - a short tag on the wave banner (e.g. "WAVE 6 - FAST") would close the "why is this wave different" gap. Strong I93 candidate.

3. **(I92 balance, optional) Combo headroom - F4.** If the cap should reward skill, consider raising cap 10 -> 12-15; otherwise leave it as a participation bonus. Low priority.

4. **No action:** drop economy (F5), onboarding (F6), game-over screen (F7), F1 (already fixed).

### Risks

- **Boss difficulty may over-gate progression.** If wave 5 -> 6 feels like a wall to real humans, players may churn at the first boss. Mitigation: the I92 post-boss softening + a human playtest before E7 locks balance.

- **Score board loses discriminative power (F8).** With the spread at ~1.4x, the high-score board ranks casual and skilled close together. May be fine (board rewards depth now), but worth confirming the leaderboard reads as intended in a human session.

- **Assumption (needs human confirmation):** bots do not use shield/bomb to survive the spike; a human with a shield up or a bomb on the boss would likely survive wave 5 -> 6 better. The "boss costs 2 lives" figure is therefore a lower bound, not a human expectation.

### Changed / proposed files

- **Changed:** none (docs-only playtest).
- **Proposed:** `production/playtest-report.md` (this v2 section); I92 balance levers in `src/core/config.js` (post-boss modifier rule / ring params); I93 wave-modifier banner tag in `src/render/screens.js` + `src/core/waves.js`.

### Verification evidence

- Both runs executed on the live dev build (HEAD `edc8518`, post-I89) via a single synchronous core-only `w.step` loop per run (no double-stepping: the rAF loop is event-loop-blocked during the loop).
- F1 no-input stall test: wave 1 t=2.22 -> wave 2 t=47.22 (exactly 45s), 5 rocks present, not a clear.
- Run B game-over cross-checked against world state: score 23080 / kills 159 / wave 6 / combo 10 / time 2:35 all match the on-screen panel and `w.scoreKeeper`.
- 0 console errors across both runs; no NaN in any readout.
- Screenshot: `.evidence/i90-playtest-gameover.png`.

### Next owner / decision

- **I92 (balance-check):** take F9 (post-boss spike) + F4 (combo cap) as the two balance inputs; decide lever(s) for the wave after a boss.

- **I93 (UI-UX-review):** take the "invisible wave modifiers" friction as a candidate wave-banner tag.

- **Human playtest (when available):** confirm the boss-spike difficulty and the "combo is never meaningful" question - both are labeled assumption/bot-limited here.
