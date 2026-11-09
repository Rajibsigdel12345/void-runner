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
