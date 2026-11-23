# E81 scope check - Wave-5 Monolith Wall (frozen E81 lever: boss.burst.every 4.0 -> 4.8)

Opened I577 (ST-544). E80 closed (I576, G80.0 accept round) with the residual registration: "post-E80 live wall = the wave-5 Monolith fight (sweep573: wave-5 band 12/30, MONOLITH 10/30 = largest single source; R-3 realized) - a teach/pacing question, NOT a frozen lever". E81 is that wall, run as the minimal single-lever round of the frozen E70 protocol, with the lever value determined by this epic's own research (E80 registered the wave-5 wall as a teach/pacing question, NOT a frozen E70 lever) and frozen at open. Full research + code grounding: design/e81-monolith-wave5-wall-research.md (FROZEN at I577).

## Frozen bounds

- EXACTLY ONE lever, applied on ONE pass WITH MEASUREMENT on its own fresh 30-seed sweep; on-failure -> accept (C1). No second fiddle. No other levers exist in E81; anything else the sweeps surface is registered for E82+ (the R-1 pattern-lever registration, research sec. 9).
- The lever (ST-546/I579) = boss.burst.every 4.0 -> 4.8 - a difficulty KNOB (+20% radial-burst volley cadence = wiggle room), NOT a fairness rule:
  - One-line config change (src/core/config.js:300, every: 4.0 -> 4.8).
  - Blast radius (MEASURED): ALL endless Monolith fights (w5/w15/w20/w25/...) get the same +20% volley cadence; enrage preserved (everyMult 0.65: 4.0 -> 2.6 s becomes 4.8 -> 3.12 s); the aimed fireEvery 2.2 and the ring schedule are unchanged.
  - Campaign isolation (MEASURED): every level boss is a CampaignBoss (campaignBoss.js:29-30 reads cfg.campaignBoss.hp[level], default 96); the campaign spawnBossForWave early-returns at game.js:618 (the ST-419 prime path at L630 is dead code); the Splicer is separate -> cfg.boss.burst is NEVER read on the campaign path -> the lever is structurally endless-only, zero campaign change (stronger than the BAL-4 pattern; no campaign note needed).
  - The pattern geometry stays FROZEN (burst.count 12 / burst.speed 7.0 / offsetSpin 0.45 / fireEvery 2.2 - a geometry or count change would be a second lever - the R-1 registration, E82+ only).
- Rejected candidate levers recorded (research sec. 3, MEASURED): maxHp 64 -> 56 (would break I325's registered 12 s TTK floor, mid-skill kiter 12.7 s -> ~10.9 s; shifts w15/w20 HP 76 -> 68 / 88 -> 80) / ringCount / splitCount (zero rock deaths in the band) / fireEvery 2.2 -> 2.6 (the burst has the density dominance: 48 vs 8 bolts per fight, so cadence-on-burst is the matching fix).
- The L-A boss-retirement mechanism stays NOT re-attempted (E79 residual: shown INERT on the current tree; no-second-fiddle rule).

## Stories

- ST-544 (I577) - DONE I577: open + research + this scope-check + bookkeeping (docs-only).
- ST-545 (I578) - PENDING: sweep577 pre-lever re-audit - 30 FRESH seeds 57700+i, full director from wave 1, frozen I328 kiter VERBATIM (as carried in .evidence/I574/sweep573.mjs), cap 36000 ticks @ 1/60; rules577.md FROZEN PRE-RUN in .evidence/I578/ (clone of the .evidence/I574/rules573.md lineage, E81 labels); metrics B56 = deaths on wave in {5,6} (any attribution), M56 = deaths on wave in {5,6} AND clsPrimary == MONOLITH. Role: independent fresh confirmation of the post-E80 wall + the frozen adjudication B/A*/C (research sec. 6).
- ST-546 (I579) - PENDING: CONDITIONAL per the frozen adjudication: (B) B56 >= 12/30, OR (A*) 10 <= B56 <= 11 AND M56 >= 8/30 (pre-registered single-boss extension, recorded WITH MEASUREMENT) -> lever one line + sweep578 (30 fresh seeds 57800+i) + acceptance (a)-(e); (C) B56 <= 9/30 -> ST-546 VOID (E78-lever pattern). C1 on acceptance failure (one-line revert + accept + R-1 registration).
- ST-547 (I580) - PENDING: G81.0 close gate (clone of the .evidence/I576 runner pattern).

## Lever acceptance (frozen, evaluated on fresh sweep578)

- (a) B56 <= 9/30 (baseline 13/30 - sweep573);
- (b) M56 <= 7/30 (baseline 10/30);
- (c) median death wave >= 9 (baseline 9);
- (d) >= 3/30 reach wave >= 13 (sweep573 best: wave 11; historical best: sweep569 3/30 reached >= 13, best wave 14);
- (e) 5-harness gate EXACT (re-pin ONLY with measured drift, I482 pattern).

## Cut ladder

- C1 (on (a) or (b) failure, or (c) or (d) failure): git restore src/core/config.js (one line) + accept-with-documentation + the residual to the E82+ backlog WITH the full measurement record + the E81 pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 - ONE chosen by that epic's own frozen rules] + close G81.0 as an accept round (E78/E79/E80 pattern).
- Branch-C VOID path: no code change; the adjudication measurement is recorded (E78-lever pattern).
- The AGENTS.md item-4 dist cut ladder is separate and governed by the headroom floor (>= 102,400 B; NOT expected).

## Tripwires

- dist: pre-E81 6,430,174 B / 203 (I576). Lever est. 0 B (1-char literal swap; comments not shipped - EXPECTED byte-identical). Ceiling 7,400,000 B (KEEP, no renegotiation); tripwire 7,297,600 B. CLOSE FLOOR E81 re-derived WITH MEASUREMENT at G81.0 (I580); headroom floor >= 102,400 B.
- 5-harness gate (causal495 / causal483 / playframe483+491 / pwa491): EXACT on the src-touching story (I579 if the lever applies) + all five fresh at the I580 close gate; re-pin ONLY with measured drift (I482 pattern).
- Pin safety (pre-registered): all five harness pins live at wave <= 2 (causal495 wave 2 on seed-9876; causal483 ~45 s demo window; playframe A MENU / B ~wave 1; pwa491 menu-only); the endless Monolith first spawns at wave 5; the burst timer is time-driven (game.js:645 init, L408 reset) -> ZERO extra RNG on any pinned path -> EXPECTED EXACT, no re-pin.
- Vendor pins r187 unchanged (no vendor change this epic).

## DoD (G81.0, I580)

1. Five fresh harnesses EXACT (re-pin only with measured drift).
2. dist re-measured + CLOSE FLOOR E81 = 7,400,000 - dist WITH MEASUREMENT; headroom >= 102,400 B floor.
3. AGENTS.md item-4 refreshed (CLOSE FLOOR E81 line; the E80 line demoted to prior per house pattern) + E81 CLOSED + residual registration (post-lever wall state; if the C1 path fires, the E81 pattern-lever registration is the E82+ handoff) + quality bar 6/6 on every story.