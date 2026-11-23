# E79 scope check - Composite Wall Fairness (boss retirement + conditional gunship lever)

Opened I569 (ST-535). E78 closed (I568) with R-2 registration: "composite wall, no single lever - a future balance epic may need multi-step scope." E79 is that minimal multi-step extension of the frozen E70 protocol. Full research + code grounding: design/e79-composite-wall-fairness-research.md (FROZEN at I569).

## Frozen bounds

- AT MOST 2 levers, ordered, each applied on ONE pass WITH MEASUREMENT on its own fresh 30-seed sweep; each on-failure -> accept. No second fiddle. No other levers exist in E79; anything else the sweeps surface is registered for E80+ (the frozen E70 protocol governs a future dominant wall).
- L-A (primary, ST-537/I571) = boss retirement - a FAIRNESS RULE change (remove a stale-state lethal source that outlives its wave window), NOT a difficulty knob:
  - Config: cfg.boss.retireAfterWaves = 3 (endless only, gated in code).
  - Code (src/core/game.js): in the wave-start block at L255, BEFORE spawnBossForWave (L259): if (this.mode === 'endless' && this.boss && wv.startedWave - this.boss.spawnWave >= this.cfg.boss.retireAfterWaves) this.bossRetire();
  - bossRetire(): emit('bossRetire', { pos, kind }); this.boss = null. NO split, NO score, NO RNG draws.
  - Mode gate is this.mode === 'endless', NOT isCampaignBoss (Monolith Prime has no such flag; campaign bosses come from level ends; spawnBossForWave early-returns for campaign at game.js:618). Campaign bit-identical (BAL-4 precedent; unit-tested).
  - Effect: wave-5 Monolith retires at wave 8 start; wave-10 Splicer at wave 13 start. The boss stays fully killable inside its 3-wave window (kiter evidence: 7/10 at I525) - retirement bounds the tail; it does not remove the challenge.
  - Bolts: natural expiry via the finite per-bolt life (enemyBullets.js:37-38). Cancellation is OUT of scope (shared pool, no source tag) - registered as future polish (S1 [28:50-29:20]).
  - FX (render): a 'bossRetire' handler in main.js reusing the existing shockwave pool (L684) + particle burst + an existing SFX_CUES cue (L436). NO new assets, NO new i18n strings, NO new SFX synthesis.
  - Consequence R-4 (registered, not a failure): Warden effectively unreachable in endless post-L-A (its spawn requires no live boss); wave 10 is always the Splicer -> roster determinism restored.
- L-B (conditional, ST-538/I572) = gunship hp 10 -> 8 - a small, pre-registered difficulty knob, applied ONLY if the post-L-A measurement shows the gunship band still qualifies:
  - One-line config change (src/core/config.js, gunship block L467+; verify the actual hp: line at I572 - the L470 comment says "10 hits").
  - FROZEN TRIGGER on post-L-A sweep571: wave-8/9 band deaths (waves 8-9 attributed to gunship + rock_L + rock_M) >= 4/30 AND median death wave < 11 -> apply + re-measure sweep572 (30 seeds 57200+i), acceptance shape (a)/(c)/(d)/(e). If the trigger does NOT hold: ST-538 VOID (lever stays frozen/registered, E78-lever pattern). No second pass either way.
  - Campaign note: shared-config value (campaign gunships get -2 hp identically) - documented per BAL-4, NOT a revert trigger.
- The frozen E70 lever [2] (splicer.maxHp 30 -> 24) stays UNAPPLIED/registered (E78 guard carried forward).

## Stories

- ST-535 (I569) - DONE I569: open + research + this scope-check + bookkeeping (docs-only).
- ST-536 (I570) - PENDING: sweep569 pre-lever re-audit - 30 FRESH seeds 56900+i, full director from wave 1, frozen I328 kiter VERBATIM (as carried in .evidence/I567/sweep567.mjs), cap 36000 ticks @ 1/60; rules569.md FROZEN PRE-RUN in .evidence/I570/ (clone of rules567 + label hygiene; thresholds source rules564: H >= 0.600 Branch B / <= 0.400 Branch C / else Branch A; heavyweights = MONOLITH + SPLICER + WARDEN). Role = independent cross-check of the sweep567 composite picture (expect Branch C). L-A acceptance baseline STAYS sweep567 (median 9; wave-10 cluster 11/30).
- ST-537 (I571) - PENDING: L-A implement + unit tests + sweep571 (30 seeds 57100+i) + acceptance (a)-(e).
- ST-538 (I572) - PENDING: L-B conditional (frozen trigger on sweep571) -> apply + sweep572 (seeds 57200+i) + acceptance (a)/(c)/(d)/(e), OR story VOID.
- ST-539 (I573) - PENDING: G79.0 close gate.

## L-A acceptance (frozen, evaluated on fresh sweep571)

- (a) median death wave >= 10 (baseline 9);
- (b) wave-10 cluster (deaths on wave 10) <= 7/30 (baseline 11/30);
- (c) max single killing-blow source < 0.300 (>= 0.400 -> epic FAILURE -> C1; [0.300, 0.400) -> borderline registered, epic passes);
- (d) >= 2/30 reach wave >= 13 (the E69 fleet band);
- (e) 5-harness gate EXACT (re-pin ONLY with measured drift, I482 pattern).

## Cut ladder

- C1 (on (a) or (b) failure, or (c) >= 0.400): revert L-A fully (config + code + FX + tests), accept-with-documentation, residual to the E80+ backlog WITH the full measurement record; the epic closes at G79.0 as an accept-with-documentation round (E78 pattern).
- L-B void path: no code change; the trigger measurement is recorded (E78-lever pattern).
- (c) in [0.300, 0.400): borderline registered, epic passes.
- The AGENTS.md item-4 dist cut ladder is separate and governed by the headroom floor (NOT expected to be needed).

## Tripwires

- dist: pre-E79 6,430,174 B / 203 (I568). L-A est. +2-6 KB (one config key + ~10 lines core + ~6 lines FX; unit tests are not shipped). L-B ~0-1 B. Ceiling 7,400,000 B (KEEP, no renegotiation); tripwire 7,297,600 B. CLOSE FLOOR E79 re-derived WITH MEASUREMENT at G79.0 (I573); headroom floor >= 102,400 B.
- 5-harness gate (causal495 / causal483 / playframe483+491 / pwa491): EXACT on every src-touching story (I571; I572 if not void); re-pin ONLY with measured drift (I482 pattern).
- Pin safety (pre-registered): all five harness pins live at wave <= 2 (causal495 wave 2 / 36.15 s on seed-9876; causal483 ~45 s demo window; playframe B frame 50 ~ wave 1; playframe A MENU; pwa491 menu-only). The retirement path first fires at wave 8 start and draws ZERO RNG (no split, no score, no spawn) -> the pinned paths are bit-identical -> EXPECTED EXACT, no re-pin.
- Vendor pins r187 unchanged (no vendor change this epic).

## DoD (G79.0, I573)

1. Five fresh harnesses EXACT (re-pin only with measured drift).
2. dist re-measured + CLOSE FLOOR E79 = 7,400,000 - dist WITH MEASUREMENT; headroom >= 102,400 B floor.
3. AGENTS.md item-4 refreshed (dist chain segment(s) for I571/I572 as applicable + CLOSE FLOOR E79 line; E78 line demoted to prior per house pattern) + E79 CLOSED + residual registration (post-lever wall state; if a new >= 0.400 dominant wall surfaced, the E70 protocol governs the NEXT epic) + quality bar 6/6 on every story.