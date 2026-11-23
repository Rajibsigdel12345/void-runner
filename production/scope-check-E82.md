# E82 scope check - Wave-5 Monolith Wall II (frozen E82 lever: boss.burst.every 4.0 -> 4.8, carried from E81)

Opened I581 (ST-548). E81 closed (I580, G81.0 accept round - gap case) with the residual registration: the wave-5 Monolith wall remains THE live wall (band span 7-12/30 across five samples: 567 10 / 569 7 / 571 9 / 573 12 / 577 11) WITH the full measurement record (the gap-case record: sweep577 B56 11/30, M56 7/30 -> uncovered cell -> RECORD + REGISTER; ST-546 VOID + accept); the frozen E81 lever (boss.burst.every 4.0 -> 4.8) stayed UNAPPLIED/registered; the E81 pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6, preference order, ONE chosen by that epic's own frozen rules] carries to E82+; PROCESS FINDING (d): future frozen adjudications must explicitly tile the metric space. E82 is that wall, run as the minimal single-lever round of the frozen E70 protocol: the lever = P0 = the unapplied E81 lever, re-adjudicated on a fresh sweep (house precedent: E80 picked up E79's unapplied registered lever and re-adjudicated it on a fresh sweep). Full research + code grounding: design/e82-monolith-wave5-wall-ii-research.md (FROZEN at I581).

## Frozen bounds

- EXACTLY ONE lever (P0: boss.burst.every 4.0 -> 4.8 - src/core/config.js:300, one line), applied on ONE pass WITH MEASUREMENT on its own fresh 30-seed sweep (sweep582); on-failure -> accept (C1). No second fiddle. No other levers exist in E82; anything else the sweeps surface is registered for E83+ (the P1/P2/P3 pattern-lever registration, research sec. 9 R-1).
- The lever = a difficulty KNOB (+20% radial-burst volley cadence = temporal density = wiggle room), NOT a fairness rule:
  - Blast radius (MEASURED): ALL endless Monolith fights (w5/w15/w20/w25/...) get the same +20% volley cadence; enrage preserved (everyMult 0.65: 4.8 -> 3.12 s); the aimed fireEvery 2.2 and the ring schedule are unchanged.
  - Campaign isolation (MEASURED): cfg.boss.burst is NEVER read on the campaign path (game.js:618 early-return; campaignBoss.js:29-30 own HP/moves) -> structurally endless-only, zero campaign change (stronger than the BAL-4 pattern; no campaign note needed).
  - The pattern geometry stays FROZEN (burst.count 12 / burst.speed 7.0 / offsetSpin 0.45 / fireEvery 2.2 / ringCount / splitCount / maxHp - any of those is a second lever - the P1/P2/P3 registration, E83+ only).
- Frozen lever-selection rule (research sec. 4): P3 rejected (aimed = 1/11 band deaths, measured: run 57701 v=8.1 base=9) / P1 rejected (count = pattern geometry = second-lever class per the E81 scope-check's frozen-geometry clause) / P2 rejected (slower bolts = longer field-of-view residency = HIGHER on-screen spacial density per S3 Sparen A4 3b; shifts the reaction character only) / P0 = the temporal-density (volley cadence) knob (S1 wiggle room + S2 single-cadence-knob + S4 one-change-at-a-time + S6 density-as-cadence + S7 residual-bolt clearing + S8 interval knob) AND the unapplied frozen E81 lever (house precedent E80-on-E79).
- Rejected candidate levers recorded (research sec. 3, MEASURED): maxHp 64 -> 56 (would break I325's registered 12 s TTK floor, mid-skill kiter 12.7 s -> ~10.9 s; shifts w15/w20 HP 76 -> 68 / 88 -> 80) / ringCount / splitCount (zero rock deaths in the band).
- The L-A boss-retirement mechanism stays NOT re-attempted (E79 residual: shown INERT on the current tree; no-second-fiddle rule).

## Stories

- ST-548 (I581) - DONE I581: open + research + this scope-check + bookkeeping (docs-only).
- ST-549 (I582) - PENDING: sweep581 pre-lever re-audit - 30 FRESH seeds 58100+i, full director from wave 1, frozen I328 kiter VERBATIM (as carried in .evidence/I574/sweep573.mjs), cap 36000 ticks @ 1/60; rules581.md FROZEN PRE-RUN in .evidence/I582/ (clone of the .evidence/I578/rules577.md lineage: E82 labels, the M56' metric definition, the 4-branch adjudication verbatim from research sec. 6); metrics B56 = deaths on wave in {5,6} (any attribution) [baseline 11/30, sweep577], M56' = deaths on wave in {5,6} AND (clsPrimary == MONOLITH OR (clsPrimary == bullet_unknown AND a monolithDeath tick within 180 ticks (3 s) before the player death)) [baseline 11/30, sweep577; refined from the E81 M56 to cover the MEASURED post-kill residuals - sweep573 2-90 ticks, sweep577 4/54/72/77 ticks]. Role: independent fresh confirmation of the wave-5 Monolith wall + the frozen gap-free adjudication B/A*/G/C.
- ST-550 (I583) - PENDING: CONDITIONAL per the frozen adjudication: (B) B56 >= 12/30, OR (A*) 10 <= B56 <= 11 AND M56' >= 8/30 (recorded WITH MEASUREMENT when used) -> lever one line + sweep582 (30 fresh seeds 58200+i) + acceptance (a)-(e); (G) 10 <= B56 <= 11 AND M56' <= 7/30 -> ST-550 VOID + accept + document (C-equivalent - the cell that was uncovered at E81); (C) B56 <= 9/30 -> ST-550 VOID + accept (E78-lever pattern). C1 on acceptance failure (one-line revert + accept + the P1/P2/P3 registration to E83+).
- ST-551 (I584) - PENDING: G82.0 close gate (clone of the .evidence/I580 runner pattern).

## Lever acceptance (frozen, evaluated on fresh sweep582)

- (a) B56 <= 9/30 (baseline 11/30 - sweep577);
- (b) M56' <= 7/30 (baseline 11/30 - sweep577);
- (c) median death wave >= 9 (baseline 9);
- (d) >= 3/30 reach wave >= 13 (sweep577: 6/30, best wave 15 - non-regression floor);
- (e) 5-harness gate EXACT (re-pin ONLY with measured drift, I482 pattern).

## Cut ladder

- C1 (on (a) or (b) failure, or (c) or (d) failure): git restore src/core/config.js (one line) + accept-with-documentation + the residual to the E83+ backlog WITH the full measurement record + the E81 pattern-lever registration [P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 - ONE chosen by that epic's own frozen rules] + close G82.0 as an accept round (E78/E79/E80/E81 pattern).
- Branch-G VOID path: no code change; the adjudication measurement is recorded (C-equivalent; the explicit tiling of the E81 gap cell, PROCESS FINDING (d) satisfied).
- Branch-C VOID path: no code change; the adjudication measurement is recorded (E78-lever pattern).
- The AGENTS.md item-4 dist cut ladder is separate and governed by the headroom floor (>= 102,400 B; NOT expected).

## Tripwires

- dist: pre-E82 6,430,174 B / 203 (I576/I580). Lever est. 0 B (1-char literal swap; comments not shipped - EXPECTED byte-identical). Ceiling 7,400,000 B (KEEP, no renegotiation); tripwire 7,297,600 B. CLOSE FLOOR E82 re-derived WITH MEASUREMENT at G82.0 (I584); headroom floor >= 102,400 B.
- 5-harness gate (causal495 / causal483 / playframe483+491 / pwa491): EXACT on the src-touching story (I583 if the lever applies) + all five fresh at the I584 close gate; re-pin ONLY with measured drift (I482 pattern).
- Pin safety (pre-registered): all five harness pins live at wave <= 2 (causal495 wave 2 on seed-9876; causal483 ~45 s demo window; playframe A MENU / B ~wave 1; pwa491 menu-only); the endless Monolith first spawns at wave 5; the burst timer is time-driven (game.js:645 init, L408 reset) -> ZERO extra RNG on any pinned path -> EXPECTED EXACT, no re-pin.
- Vendor pins r187 unchanged (no vendor change this epic).

## DoD (G82.0, I584)

1. Five fresh harnesses EXACT (re-pin only with measured drift).
2. dist re-measured + CLOSE FLOOR E82 = 7,400,000 - dist WITH MEASUREMENT; headroom >= 102,400 B floor.
3. AGENTS.md item-4 refreshed (CLOSE FLOOR E82 line; the E81 line demoted to prior per house pattern) + E82 CLOSED + residual registration (post-lever wall state; if the C1 path fires, the P1/P2/P3 registration is the E83+ handoff) + quality bar 6/6 on every story.