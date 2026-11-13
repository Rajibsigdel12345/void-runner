# Scope Check E32 - Boss Balance Tuning Arc (Data-First)

- Iteration: I323 (arc open)
- Skills: cgs-scope-check + cgs-create-stories (docs-only)
- Inputs: AGENTS.md, production/session-state/active.md, production/scope-check-E31.md (deferrals), src/core/boss.js, src/core/config.js (boss: block), .evidence/I322/ (E31 closeout pins)

## Summary

E31 (HP#5 Human Perception Session) closed at I322 with G31.0 PASS R1..R5 and E31 4/4. E32 takes the gameplay deferral that has appeared in every arc's task list since E23: **boss balance tuning**, executed data-first - collect encounter telemetry before touching a single number, then tune against pre-registered audit rules. This is the first gameplay-tuning arc since the I183 juiceTally feel work, and the only structural balance debt left in the sim (rocks/waves/pickups were tuned in E13/E14/E29 arcs with the same method).

## Scope Fit

- FITS. The work is: one new pure core module (src/core/bossTally.js, DOM-free/three-free, ~2-4 KB min), thin World hooks (src/core/game.js, ~1 KB), tests (tests/bossTally.test.js - not shipped in dist), and config.js boss: lever tuning. No assets, no Blender (R-E32-5 arms only as a deferral trigger), no new vendor deps.
- dist headroom at open: 212 KB (119 files / 1879502 B of 2048 KB). Expected +8..15 KB total across the arc; closeout floor 100 KB (G32.0-R5) leaves 7+ KB of margin.
- Determinism: all runs through the seeded rng.js; telemetry is a pure function of the sim, so baselines are reproducible across machines (the 852-test suite already runs the sim headless in node - R-E32-2 verifies World importability in node at ST-300).
- Stage consistency: the game is feature-complete (all epics E1..E31 closed); E32 is polish/tuning-stage work, exactly what the cgs-balance-check skill exists for.

## YouTube Grounding (FRESH I323 sweep - standing order: no E31 video ID reuse)

Coverage: 1 round x 8 queries (EN) -> 70 raw -> 65 unique videos; 32 shown (metadata-reviewed); 4 deep transcript reads; 0 rate-limit skips (2 metadata-only: no captions / no matching passages). Zero overlap with the 11 E31 ids.

| id | video (channel, views) | lesson used |
|---|---|---|
| WXQzdXPTb2A | How Games Get Balanced (GMTK, 1.3M) | data-first: "this is when we start collecting data" [7:00]; balance = viability across skill levels [0:36]; player psychology on announced changes [12:35]; trade-offs over raw nerfs [14:03] |
| To5rOl6pn08 | Making a Bullet Hell Game with only Boss Battles (okay_cam, 67K) | windups must warn the player [9:08]; edge-bias pressure kills rim-camping [8:33]; anti-boring-player-behaviour as a design goal |
| Hul0n2phEHI | What Makes A Good Multiple Phase Boss Fight? (Design Doc, 234K) | escalation by layering elements [2:51]; progress-loss pain on long multi-phase bosses [9:23]; phases exist so difficulty can be tuned [19:27] |
| _ru5iSgiV84 | Video Game Difficulty is Hard (Extra Credits, 37K, 2026-01) | adaptive director pattern: threat removal + 30-45s calm then ramp [11:58] -> DEFERRED (system scope, own arc) |
| pcWzSCjocjg | The Art of The Boss Fight (bizlychannel, 1.1M) | "hard for the sake of hard is pointless"; challenging = pushes you to improve [7:16] |
| wUPugc51udc | Boss Battle Design (Design Doc, 356K) | three boss roles: skill test / narrative / change of pace [0:33] |
| sfdhrBS74rA | How To Fail At Boss Fights (Artindi, 141K) | anti-patterns: opaque damage, insta-kill, restart punishment [0:52] |

## Current State (evidence: src/core/config.js boss: block + src/core/boss.js, I323 read)

Levers that exist today: maxHp 40; hpFirstWave 10; hpStep 12; hpCap 88; radius 3.4; speed 1.6; turn 0.8; ringEvery 2.0; ringCount 8; splitCount 4; fireEvery 2.2; enterTime 1.2; phase2 { hpFrac 0.5, speedMult 1.45, turnMult 1.4, spin 1.6 }; burst table; variants (monolith / splicer / warden, kind tag ST-143); telegraphs (bossTelegraph.js, I311). What does NOT exist: any encounter telemetry (no TTK, no hits-taken-during-boss, no lethality distribution) - tuning to date was eyeball + single-run probes. That is the gap E32 fills.

## Stories

- ST-300 (I324) boss telemetry baseline + audit - cgs-balance-check, audit-first (details in production/stories.md E32)
- ST-301 (I325) boss tuning pass 1 - cgs-dev-story, CUTTABLE to a no-change audit pass (I315 precedent)
- ST-302 (I326) E32 regression + G32.0 gate + closeout - cgs-regression-suite + cgs-gate-check + cgs-milestone-review

## Cut Option

1. ST-300 100-run matrix -> 20 runs/condition if pure-node World proves impractical (pre-registered at ST-300).
2. ST-301 -> no-change audit pass if all 5 rules PASS (I315 precedent: a clean audit is a valid outcome and saves the arc's budget).

## Deferral

- touch-fallback arc (platform, top deferral - own arc)
- adaptive director / dynamic difficulty (NEW, from _ru5iSgiV84 [11:58] - system scope, not tuning; own arc)
- i18n (plan-only); PWA
- E31 HUD minors: menu footer 7px vertical cross; BEST 90 x WPN 320 px^2
- boss variant deep-dive (only if R-E32-4 surfaces a gap)

## Recommendation

APPROVE as scoped: 3 stories, audit-first, config-first tuning, one small new pure core module. The data-first method is the whole point (GMTK [7:00]); no number moves in ST-301 without a ST-300 measurement behind it.

## Risks

- R-E32-1 (med): tuning shifts the seeded demo pin p1 -> pre-registered re-baseline with causal proof (I317 worktree pattern).
- R-E32-2 (med): 100-run matrix cost -> target pure-node World (DOM-free); browser cut to 20 runs pre-registered.
- R-E32-3 (low): bossTally per-frame cost -> O(1), zero allocation after init (juiceTally pattern).
- R-E32-4 (low): variant coverage -> baseline covers monolith + 1 variant minimum.
- R-E32-5 (low, conditional): audit finds a telegraph/identity (not balance) gap -> do NOT expand the arc; record as E33 candidate.

## Gate G32.0 (pre-registered)

- R1: telemetry shipped (bossTally.js + tests green) + baseline matrix saved to .evidence (100 runs/condition, or 20 if the pre-registered cut armed).
- R2: all 5 audit rules verdicted (PASS or ACCEPTED with rationale) and any tuning applied + re-measured (A/B table).
- R3: in-code changes confined to bossTally.js / config.js / boss.js / game.js / tests; zero asset change (Blender conditional NOT armed - balance arc).
- R4: p1 demo pin EXACT (or re-baselined with causal proof) + all frozen invariants re-verified + dist canary + vendor sha.
- R5: npm test green + npm run build exit 0 + dist headroom >= 100 KB.

## Verification Evidence (I323 itself)

- docs-only: 0 KB delta (dist canary must stay 119 files / 1879502 B; vendor three.module.js sha 76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495 unchanged)
- npm test 852/852 (suite unchanged), npm run build exit 0 (re-run at closeout)
- sweep coverage line per the table above

## Next owner / decision

ST-300 at I324 (cgs-balance-check, audit-first). No user decision required - deferrals are recorded, not blocking.