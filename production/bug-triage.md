# Bug Triage - Void Runner

Skill: `cgs-bug-triage` - Date: 2026-11-10 - Iteration: I91 (ST-091)

## Summary

Pre-wrap triage of every open item that has accumulated across the E7 content/polish arc. Sources: the I41 + I90 playtests (findings F1-F9), the I89 regression round C, the `balance-notes.md` "Watch" items that were explicitly parked for the I90 playtest, and code-level notes from the I38 review / I75 resilience pass.

**Bottom line: there are NO code defects.** The I89 regression was clean (no bugs, no NaN, console 0, pools in caps). The I90 playtest surfaced **design/balance findings, not defects** (F2, F4, F8, F9). Several "Watch" items from the balance notes are perception questions that a bot cannot answer and are routed to a human playtest. The single item recommended for a fix before launch is **F9 (the wave 5 -> 6 difficulty spike)**, owned by the I92 balance pass. Tally: **0 critical, 0 high, 1 medium (F9), 5 low, several informational/accepted, and the v1 findings F1/F5/F6/F7 are closed.**

## Triage table

| ID | Item | Severity | Priority | Repro confidence | Owner | Risk | Release impact | Decision |
|---|---|---|---|---|---|---|---|---|
| F9 | Wave 5 -> 6 difficulty spike: boss costs ~2 lives, then a `fast` wave follows with no buffer | Medium | High | High (measured) | game-designer (I92) | Low (1-line config) | Fix before launch | **FIX in I92** |
| F4 | Combo cap (10) is trivially reachable by any consistent killer, not a skill ceiling | Low | Low | High (measured) | game-designer (I92) | Low | Optional | I92 decision (raise 10 -> 12-15 or accept) |
| F2 | Dense-wave / boss-ring hit clustering around the 1.6s invuln window | Low-Med | Medium | High (measured) | game-designer (I92) | Low | Optional | I92 decision (small invuln bump / knockback) |
| F8 | Score spread collapsed ~20x -> ~1.4x after the F1 fix; skill now reads as wave-depth + boss-clearance | Low (info) | Low | High (measured) | creative/senior-designer | n/a (design) | Accept | **ACCEPT + document**; confirm leaderboard reads well in a human session |
| W-golden | I52 "never see one" -> bump golden chance 0.05 -> 0.08 | Low | Low | Not bot-verifiable | game-designer | Low | Human playtest | **DEFER** to human playtest |
| W-fast18 | I64 fast-S can exceed ship speed at wave 18 (intentional risk beat) | Low | Low | Analysis only (not bot-reached) | game-designer | Low | Accept | **ACCEPT** (documented in balance-notes I64) |
| W-graze | I53 near-miss "noise" -> tighten radius 2.6 -> 2.2 | Low | Low | Not bot-verifiable (perception) | game-designer | Low | Human playtest | **DEFER** to human playtest |
| W-mine | I54 mines "just more rocks" -> perWave 2 from wave 12 | Low | Low | Not bot-verifiable (perception) | game-designer | Low | Human playtest | **DEFER** to human playtest |
| C-rim | I38 rim-bounce normal slightly non-unit (converges, no escape) | Info | - | High | - (accepted) | - | None | **ACCEPT** |
| C-hit | I38 shipHitRock picks first-overlapping rock, not nearest | Info (feel) | - | High | - (accepted) | - | None | **ACCEPT** |
| C-ctx | I75 webglcontextrestored on a never-lost context -> 2 benign INVALID_OPERATION warnings | Info | - | High (sim artifact) | - (accepted) | - | None | **ACCEPT** (not a code defect) |

## Severity / Priority rationale

- **F9 (Medium / High).** The first boss is the game headline content beat, and the I90 skilled bot cleared it at a cost of 2 of 3 lives, then died ~16s into the immediately-following `fast` wave. For a human who spends their mitigation (shield/bomb) on the boss, the wall right after it is the most likely churn point. High priority because it gates the core progression loop; medium severity because it is a pacing/tuning issue, not a broken or crash-inducing path.
- **F4 (Low / Low).** Both bot profiles pin combo 10 (as in v1). The cap is a near-universal ceiling rather than a skill differentiator. It does not break anything and does not threaten release; it is a score-design judgment call for I92.
- **F2 (Low-Med / Medium).** Hit clustering is confirmed and now has a second driver (the boss ring fires on a 2s cadence). It is a game-feel concern, not a defect; a small invuln or knockback tweak is cheap but should be confirmed against human perception.
- **F8 (Low / Low).** A design consequence of the (correct) F1 fix, not a bug. The skill axis moved from raw score to wave-depth / boss-clearance, which is arguably a healthier arcade framing. Accepted and documented; flagged only to confirm the high-score board still reads as intended.
- **Watch items (Low).** Golden visibility, late-game fast-S speed, near-miss noise, and mine feel are all perception questions. A scripted bot neither sees a golden at game speed, deliberately grazes, nor judges whether a mine "feels different" - so these are honestly labeled unverified and deferred to a human playtest. The golden system itself is code-verified (waves.js rolls `rng.chance(0.05)` per eligible rim spawn from wave 3, unit-tested); "0 seen in waves 1-6" in a short bot run is consistent with the expected ~0.3-0.6/wave, not a defect.

## Owner

- **game-designer (I92 balance-check):** F9 (fix), F4 (decide), F2 (decide), and the golden/fast/graze/mine watch items (retune only on human evidence).
- **creative/senior-game-designer:** F8 acceptance decision (design intent).
- **qa-playtester:** human playtest of the boss spike + the four perception watch items when a human session is available.
- No owner needed for the informational/accepted code notes (C-rim / C-hit / C-ctx).

## Release Impact

- **Must fix before launch:** F9 (post-boss difficulty spike).
- **Should decide in I92:** F4, F2 (both one-line, low-risk).
- **Accept / document:** F8, W-fast18, and the three accepted code notes.
- **Defer to human playtest:** W-golden, W-graze, W-mine (do NOT retune on bot evidence).

## Risks

- **Bot-evidence limit (assumption, labeled).** Every "measured" number here comes from scripted self-play with zero reaction time and no strategic power-up use. The boss-cost (2 lives) and the fast-wave wall are therefore *lower bounds* on difficulty - a human with a shield up or a bomb on the boss will likely do better. The F9 fix should be re-checked after the post-boss change, not assumed to fully resolve the spike.
- **Perception items are unverified.** W-golden / W-graze / W-mine are deferred, not resolved; if a human playtest later confirms a complaint, they reopen at Low priority.
- **No regression risk introduced this iteration** - triage is docs-only, no code changes.

## Changed files / proposed files

- **Changed:** none (triage is docs-only).
- **Added:** `production/bug-triage.md` (this file).
- **Proposed (for I92, not done here):** `src/core/config.js` - F9 lever (guarantee a non-`fast` modifier on the wave immediately after a boss wave, and/or ring bolt count 8 -> 6); F2 lever (`ship.invulnTime` 1.6 -> 1.8 or `ship.knockback` 7 -> 8); F4 lever (`combo.cap` 10 -> 12-15). Exact values to be chosen and logged in `balance-notes.md` by the I92 pass.

## Verification evidence

- **I89 regression (carried in):** REGRESSION CLEAN - 232/232 node, extended browser (boss lifecycle, wave mods, full state machine, all I81-I88 features), no NaN, console 0, pools in caps, no defects to carry in.
- **I90 playtest v2 (carried in):** F9 measured (Run B boss killed t=114.3, hits t=110.2 + t=116.32, died wave 6 @155.85 in a `fast` wave); F4 measured (both A and B pin combo 10); F2 measured (A hits 2.84s apart, B 6.12s apart, both in the boss wave); F8 measured (A 16,295 vs B 23,080); F1 fix re-confirmed (no-input stall-advance wave 1 -> 2 in exactly 45s).
- **Golden system (this iteration):** code-verified at `src/core/waves.js:120` (`this.wave >= g.minWave && this.rng.chance(g.chance)` per rim spawn, wave 3+), rock carries a `golden` flag (`src/core/asteroids.js`), and golden scoring (5x) is wired in `src/core/game.js`. A short invulnerable autopilot reached wave 4 and observed 0 goldens - consistent with the ~0.3-0.6/wave expectation, not a "never appears" defect; visibility routed to a human session.
- **Docs-only iteration:** 232/232 node (count unchanged), build exit 0 - no code touched.

## Next owner / decision

- **I92 (balance-check):** take **F9** as the primary fix (post-boss difficulty spike) and make the **F4** + **F2** decisions. Log any tunable change in `balance-notes.md` and re-run the node suite + a browser smoke. The four watch items stay closed-here unless I92 surfaces a concrete, measured reason.
- **Human playtest (when available):** the boss-spike difficulty and W-golden / W-graze / W-mine are the items that genuinely need a human. Until then they are deferred, not assumed resolved.
