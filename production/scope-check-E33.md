# Scope Check E33 - Adaptive Director Arc (Skill-Model-First)

- Iteration: I327 (arc open)
- Skills: cgs-scope-check + cgs-create-stories (docs-only)
- Inputs: AGENTS.md, production/session-state/active.md, production/scope-check-E32.md (deferrals + R-E32-4), .evidence/I322+I325+I326 pins, src/core/{waves.js, config.js, game.js, bossTally.js, juiceTally.js} patterns, I324 pilot harness (.evidence/I324/baseline324.json, ab325 pilot v2)

## Summary

E32 (Boss Balance Tuning, Data-First) closed at I326 with 3/3, G32.0 PASS R1..R5, 862/862, dist 120/1882283 B, vendor sha unchanged. E33 takes the most-repeated deferral across every arc task list since E23: the adaptive director (dynamic difficulty) system - deferred at I323 from _ru5iSgiV84 [11:58] as "system scope, own arc". Method: skill-model-first - measure player performance and threat load as dual 0-1 proxies in pure core (ST-303), then adapt wave parameters (spawn density, enemy bullet speed, pickup generosity, wave-mod weighting) inside a bounded monotone envelope (ST-304): wave-start-only changes, lull waves after 2+ deaths or sustained high load, ramp-back >= 1 wave, no same-wave retroactivity (the RE consistency lesson), director OFF in demo/replay (determinism + score integrity), director never touches score, per-decision log (L4D director-debug precedent). Pure core, seeded, deterministic.

## Scope Fit

- FITS. The work is: two new pure core modules (src/core/skillModel.js ~2-4 KB, src/core/director.js ~3-6 KB), thin integration (src/core/waves.js ~1 KB, src/core/game.js ~0.5 KB), config.js levers (0 KB expected), tests (not shipped in dist). No assets, no Blender (G33.0-R3 hard rule), no new vendor deps.
- dist headroom at open: 214869 B (~210 KB; 120 files / 1882283 B of 2097152 B). Expected +10..18 KB total across the arc; closeout floor 100 KB (G33.0-R5) leaves 90+ KB of margin.
- Determinism: all randomness through seeded rng.js; director decisions are a pure function of skill-model state + seeded rng; demo/replay pin the director OFF so the p1 pin is structurally safe (R-E33-1).
- Stage consistency: the game is feature-complete (E1..E32 closed); E33 is a system-level polish arc - exactly what cgs-balance-check / cgs-dev-story cover (data-first, audit-first, cuttable).

## YouTube Grounding (FRESH I327 sweep - standing order: no E31/E32 video ID reuse)

Coverage: 1 round x 8 queries (EN) -> 96 raw -> 95 unique; 40 shown (metadata-reviewed); 4 deep reads (3 transcript + 1 structure-only); 0 rate-limit skips. Zero overlap with the 11 E31 ids and the 7 E32 ids.

| id | video (channel, views) | lesson used |
|---|---|---|
| 0th5ecqe_4A | How Left 4 Dead's AI Director Works (Fezezen, 55K, 13:08) | per-survivor stress 0-1 [2:41]; raised by damage/incap/proximity-weighted nearby kills [3:14]; states build-up -> sustained peak -> peak fade (min threat, no spawns, wait for avg-stress decay) [8:49]; relaxed 30-45 s lull "like the pacing in a movie" [9:37]; panic events end -> lull [12:22] |
| WbHMxo11HcU | AI and Games #07 (96K) | flow = peaks/troughs, high intensity needs respite [2:58]; escalate -> peak -> ramp down -> "watching you play, waiting for the right moment" [5:28]; perceived stress = count x proximity, per-player, targets low-stress players [6:03]; post-panic refrain + item swaps by player performance [8:39] |
| pR00u3ltyuY | Maxylobes RE dynamic difficulty (138K) | DDA = hidden value shifts, rank 5->7 = 25->35 dmg [0:51][1:50]; death-lowers-DA breaks resource consistency; hiddenness = "no consistency whatsoever" - consistency/legibility > hidden manipulation [12:09][12:44][16:10] |
| Mnt5zxb8W0Y | AI and Games AI101 (73K) | structure-only (ar auto-captions, no transcript passages matched - recorded honestly); L4D ships a director debug console (description/metadata) -> decisions must be logged/inspectable |

Alternates reviewed, not used: s5cHC3l_XgE (low authority), 5aKr8h7yUQ4 (contested), vYAyCHvhYOQ (anti-pattern only), _nAVbHYaEN8 / qoVVB3Va5kw (arcade pacing - already covered by E13/E29). Deferral grounding captured, not consumed: touch (ypu-huHz2P0 GDevelop, 9TK8x2nSMPI + cI1mdVVvCWY griffpatch); art/Blender arc -> E34 candidate (pHcLe2T_2wI Imphenzia, cn7n1mF6Ejw BiteMe tierlist, wpKR-WIPmts Kridaran low-poly).

## Current State (evidence: I323..I326 reads of src/core/{waves.js, config.js, game.js, bossTally.js, juiceTally.js}; .evidence/I324 + I325)

What exists today: waves.js wave generation + wave-mods table (seeded), config.js data-driven levers, the bossTally/juiceTally external-event-subscriber pattern (zero World hooks, O(1) no-alloc), the I324/I325 100-run A/B matrix harness (pure-node, JSON to .evidence), the full probe battery + p1 demo pin + dist canary + vendor sha. What does NOT exist: any performance model, any dynamic adaptation, any pacing state machine - difficulty is a fixed wave-mod progression. That is the gap E33 fills.

## Stories

- ST-303 (I328) skill telemetry + director baseline - cgs-balance-check, audit-first (details in production/stories.md E33)
- ST-304 (I329) director rules + integration - cgs-dev-story, CUTTABLE to a no-change audit pass (I315 precedent)
- ST-305 (I330) E33 regression + G33.0 gate + closeout - cgs-regression-suite + cgs-gate-check + cgs-milestone-review

## Cut Option

1. ST-304 -> no-change audit pass if ST-303 all rules PASS and the director adds nothing measurable (I315 precedent; same designation as E32's ST-301).
2. 100-run matrix -> 20 runs/condition if pure-node World proves impractical (pre-registered at ST-303; E32 precedent: pure-node worked in 1.4 s, the cut was not armed).
3. 3rd pilot personality (cautious kiter) deferrable as a documented NOTE if the other two do not discriminate (R-E33-4).

## Deferral

- touch-fallback arc (platform; grounding captured: GDevelop ypu-huHz2P0, griffpatch 9TK8x2nSMPI / cI1mdVVvCWY)
- variant boss deep-dive (R-E32-4; rule re-verdict after ST-303 pilot expansion)
- ART/Blender visual polish arc (user standing suggestion; grounding captured: Imphenzia pHcLe2T_2wI, BiteMe cn7n1mF6Ejw, Kridaran wpKR-WIPmts) -> E34 candidate with Blender trigger
- i18n (plan-only); PWA
- E31 HUD minors (menu footer 7px cross; BEST/WPN 320 px^2)

## Recommendation

APPROVE as scoped: 3 stories, audit-first, skill-model-first, zero-asset. This is the highest-leverage system remaining (named in every task list since E23) and partially closes the E32 R1d-w5 stronger-pilot finding via the adaptive-pilot re-test. No number moves in ST-304 without a ST-303 measurement behind it.

## Risks

- R-E33-1 (med): director shifts the seeded demo pin p1 -> pre-registered: demo/replay runs pin director OFF (fixed baseline; replay never writes scoreboards), live play only; if the pin still shifts, re-baseline with causal proof (I317 worktree pattern).
- R-E33-2 (med): 100-run x 3-pilot matrix cost -> pure-node World target, pre-registered cut to 20 runs/condition if browser required.
- R-E33-3 (low): per-frame cost -> O(1) accumulators, zero allocation after init (juiceTally/bossTally pattern).
- R-E33-4 (low): pilot personality coverage -> 3 personalities minimum; if 2 do not discriminate, defer the 3rd as a documented NOTE.
- R-E33-5 (low, conditional): audit finds the director cannot be tested deterministically without World hooks (event-stream gap) -> do NOT expand the arc; record as E34 candidate.

## Gate G33.0 (pre-registered)

- R1: telemetry shipped (skillModel.js + tests green) + baseline matrix saved to .evidence (100 runs/condition x 3 pilots, or 20 if the pre-registered cut armed).
- R2: all rules R2a-e verdicted (PASS or ACCEPTED with rationale) and any tuning applied + re-measured (A/B table, director ON vs fixed difficulty).
- R3: in-code changes confined to skillModel.js / director.js / config.js / waves.js / game.js / tests; zero asset change (Blender NOT armed - system arc).
- R4: p1 demo pin EXACT (or re-baselined with causal proof) + all frozen invariants re-verified + dist canary + vendor sha.
- R5: npm test green + npm run build exit 0 + dist headroom >= 100 KB.
- Result (I330): R1 PASS / R2 PASS / R3 PASS (core-system + zero-asset; documented scope note: the change also touched enemyBullets.js + powerups.js for the director speed/drop levers - both src/core pure-logic; render + assets diff EMPTY; Blender NOT armed) / R4 PASS (p1 EXACT + invariants re-verified + dist 122/1888318 re-pinned [causal +2 vs open-time 120/1882283] + vendor sha unchanged) / R5 PASS (905/905, build exit 0, headroom 208834 B >= 100 KB). G33.0 = PASS; E33 CLOSABLE 3/3.

## Verification Evidence (I327 itself)

- docs-only: 0 KB delta (dist canary must stay 120 files / 1882283 B; vendor three.module.js sha 76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495 unchanged)
- npm test 862/862 (suite unchanged), npm run build exit 0
- sweep coverage line per the table above

## Next owner / decision

ST-303 at I328 (cgs-balance-check, audit-first). No user decision required - deferrals are recorded, not blocking.
