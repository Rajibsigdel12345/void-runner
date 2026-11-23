# E81 - Wave-5 Monolith Wall (frozen E81 lever: boss.burst.every 4.0 -> 4.8) - research

Status: FROZEN (opened I577, ST-544). The lever, the sweep577/sweep578
protocol, the B/A*/C adjudication, the acceptance (a)-(e), and the C1 cut
path are FROZEN in this doc; the story map ST-544..ST-547 runs I577..I580.
Next owner: I578 (ST-545) sweep577 pre-lever re-audit.

## Standing context (E80 residual, carried)

The E80 close (I576, G80.0 accept round) registered the post-E80 wall:

- "post-E80 live wall = the wave-5 Monolith fight (sweep573: wave-5 band
  12/30, MONOLITH 10/30 = largest single source; R-3 realized) - a
  teach/pacing question, NOT a frozen lever."
- The frozen E70 lever [2] (splicer.maxHp 30 -> 24) stayed UNAPPLIED /
  registered for a future epic whose own fresh re-audit adjudicates
  SPLICER-dominant (Branch C at I574: H 17/30 = 0.567, SPLICER 7/30 not
  largest, W10 9/30 < W5 12/30).
- The L-A boss-retirement mechanism stays NOT re-attempted (shown inert in
  E79; no-second-fiddle rule).
- Seed-variance span 0.400-0.667 across five same-tree H samples
  (565 0.533 / 567 0.400 / 569 0.667 / 571 0.467 / 573 0.567).
- E81 is the frozen E70 protocol (fresh research + fresh scope-check +
  fresh 30-seed pre-lever sweep) run on the registered wave-5 Monolith
  wall. One difference from E78/E79/E80: E80 registered this wall as a
  teach/pacing question, NOT a frozen E70 lever - so the lever value is
  determined by THIS epic's own research (sec. 3 + sec. 5) and frozen here
  at open, then applied only per the frozen adjudication on the fresh
  sweep577.

## 1. Measured current state (pre-lever, sweep573 + I577 death detail)

- sweep573 (I574; authoritative record .evidence/I574/sweep573.json 95,597
  B): 30/30 died, median death wave 9, death-wave dist wave5 x12 / wave6
  x1 / wave8 x1 / wave9 x5 / wave10 x9 / wave11 x2; tally (primary ==
  strict) MONOLITH 10 / SPLICER 7 / bullet_unknown 5 / gunship 3 / rock_S 3
  / rock_M 2; H = 17/30 = 0.567; the wave-5/6 band = 13/30 (largest wave
  band); MONOLITH = largest single source 10/30.
- Death-detail extraction (NEW .evidence/I577/extract573.cjs +
  extract573b.cjs, run I577 over sweep573.json): ALL 13 wave-5/6 band
  deaths are BOLTS (src=bullet): 10 MONOLITH-primary (9 in wave 5 + 1 in
  wave 6 - run 57317: the Monolith outlived wave 5 and was killed in wave
  6) + 3 bullet_unknown (ALL post-kill residual bolts: the Monolith died
  2-90 ticks (0.03-1.5 s) BEFORE the player - 57309: boss 6220 / death
  6310; 57321: 6545 / 6547; 57322: 5565 / 5590). ZERO rock deaths, ZERO
  body-contact deaths in the band.
- All 13 band deaths: livesUsed 3, weaponLevel 2, bombs 0 (no emergency
  valve); deaths 8.8-19.7 s after the wave-5 start (Monolith TTK ~12.7 s).
- Kiter speed decode (sweep573.mjs L85-150): BASE_SPEEDS [7,8,9,10,15];
  v = base x recent speedMul; r = 0.22 = bolt radius; s === 7 or s === 9
  with bossAlive -> boss_monolith. The radial burst = 48 bolts per fight
  vs 8 aimed bolts -> the BURST dominates the bullet density of the fight
  window. v-decode of the 10 in-fight deaths: >= 5 burst-class (7.65625
  x3, 6.3), >= 3 aimed-class (8.1, 9.3375), 2 ambiguous (9.84375 x6 could
  be either at x1.09375).
- So the measured defect is BULLET DENSITY in the fight window (the radial
  wall), NOT duration (the TTK is already at the registered 12 s floor of
  I325) and NOT the rock ring (zero rock deaths in the band).

## 2. Web findings (chapter-level cites, house norm)

- S1: Bog Hog, "Bullet Pattern Design [SHMUP WORKSHOP 03]"
  (https://youtu.be/ArZRZSYICLo, 17K views, 7:19, 2023-01-13):
  [3:38-4:09] "slowly escalate difficulty... start with easier versions of
  patterns... lets players get into its flow before fully blasting them";
  [2:04-2:34] "think of them as a collection of lanes... if the player is
  getting blasted with aimed patterns while stuck in the lane some extra
  wiggle room can be vital for survival"; [3:06-3:38] pattern roles +
  "direct challenge when sufficiently wide, dense, fast". Extraction: the
  Monolith overlays an aimed pressure pattern on a dense radial wall (the
  measured 13/13-bolt interaction); the enrage lands with the player only
  ~half "in the flow" (50% of the 12.7 s TTK); the fix is wiggle room
  (volley cadence), NOT a pattern change. NOTE: E80 discarded WORKSHOP 04
  (house precedent) - 03 is a different, relevant episode.
- S2: GMTK, "How Games Get Balanced" (https://youtu.be/WXQzdXPTb2A, 1.3M
  views, 15:34): [2:43-3:16] Halo 3 sniper "the best knob to tweak was the
  time between shots, bumped from 0.5 to 0.7 seconds" (Jaime Griesemer's
  GDC 2010 talk is literally titled this) - single-cadence-knob precedent;
  our lever is the same shape, more conservative (+20% vs +40%). [1:10-
  1:42] Jeff Kaplan "the perception of balance is more powerful than
  balance itself"; [3:16-3:49] Rob Pardo "balance into mediocrity... is it
  fun?"
- Discarded: Bog Hog SHMUP WORKSHOP 04 (E70/E80 house precedent -
  discarded there), Weeb Nerd (score-attack axis, not beatability), Steve
  Lee level-layout (layout, not beatability), zombie-survival listicles
  (wrong genre), Design Doc gimmick-boss videos (wrong scope).

## 3. Code grounding (MEASURED from the tree at I577)

- config.js boss block L261-316: everyWave 5 (L265) / maxHp 64 (L266;
  I325: was 40 - the 12 s TTK floor is registered) / hpFirstWave 10 (L267)
  / hpStep 12 / hpCap 88 / radius 3.4 / speed 1.6 / turn 0.8 / ringEvery
  2.5 (L273; the E77 lever, I565) / ringCount 8 / splitCount 4 /
  fireEvery 2.2 (L277) / enterTime 0.8 (L278) / phase2 { hpFrac 0.5,
  speedMult 1.3, turnMult 1.4, spin 1.6, ringEveryMult 0.6 (L297) } /
  burst { every 4.0 (L300 - THE LEVER LINE), count 12, speed 7.0,
  offsetSpin 0.45, everyMult 0.65 } / score 1000 / telegraph render-only.
- boss.js:19-25 bossHpForWave (wave 5 < hpFirstWave 10 -> base 64 EXACT);
  boss.js:30 hp fallback.
- game.js:616-645 spawnBossForWave: endless-only (campaign early-returns
  at L618); L645 burst timer init (time-driven, no RNG); L386/401 aimed
  bolts fire at cfg.enemyBullets.speed (=9); L408 burst reset adds bb.every
  x (phase2 ? bb.everyMult : 1); L397-401 entrance gate + bossAimEvery().
- campaignBoss.js:29-30 own HP path (cfg.campaignBoss.hp[level], default
  96) + own moves (config L1388 aimEvery [2.4, 1.8, 1.3]); the splicer
  block (config L317-347) is separate. Campaign isolation (MEASURED):
  every level boss is a CampaignBoss; the campaign spawnBossForWave
  early-returns at game.js:618 (the ST-419 prime path at L630 is dead
  code) -> cfg.boss.burst is NEVER read on the campaign path -> the lever
  is structurally endless-only (stronger than the BAL-4 shared-config
  pattern; no campaign note needed).
- Lever blast radius (MEASURED): the burst cadence 4.0 -> 4.8 (+20%)
  applies to ALL endless Monolith fights (w5/w15/w20/w25/...): the same
  +20% volley gap at every Monolith wave. Enrage preserved (everyMult 0.65
  still applies: 4.0 -> 2.6 s becomes 4.8 -> 3.12 s). The aimed fireEvery
  2.2 and the ring schedule are unchanged.
- Rejected candidate levers (MEASURED, recorded): maxHp 64 -> 56 rejected
  - would break I325's registered 12 s TTK floor (mid-skill kiter TTK
  12.7 s -> ~10.9 s) and shift the w15/w20 HP (76 -> 68, 88 -> 80).
  ringCount / splitCount rejected - zero rock deaths in the band.
  fireEvery 2.2 -> 2.6 rejected - the near-even aimed/burst death split
  (5 aimed-class vs 5 burst-class in-fight, sec. 1) but the burst has the
  density dominance (48 vs 8 bolts per fight), so cadence-on-burst is the
  matching fix.
- TTK: config.js:149 player fireInterval 1/5.5 -> theoretical min TTK
  64/5.5 = 11.6 s; mid-skill kiter 12.7 s (I325 registration).
- dist: a 1-char literal swap ("4.0" -> "4.8") in shipped config;
  comments do not ship -> EXPECTED byte-identical 6,430,174 B / 203.

## 4. Scope decision

- Minimal single-lever round (the frozen E70 protocol): ONE lever (the
  frozen E81 lever - this epic's own, per sec. 5), ONE pass WITH
  MEASUREMENT (sweep578), on-failure -> accept (C1), no second fiddle.
  E79 demonstrated the multi-step scope costs a full C1 revert when the
  premise is dead; E81's premise is single-boss and MEASURED (sec. 1), so
  the minimal round is the correct shape.
- Lever class: a difficulty KNOB (volley cadence = wiggle room), not a
  fairness RULE (pattern geometry unchanged - the radial wall is the
  intended challenge per S1 [3:06-3:38]; the measured defect is density,
  not geometry).
- The pre-registered single-boss adjudication extension (A*, sec. 6) is a
  rule about WHEN the frozen lever may fire under seed variance - it
  re-derives nothing; the lever value is frozen from this doc.

## 5. Frozen lever

- boss.burst.every 4.0 -> 4.8 (src/core/config.js:300, one line, +20%
  radial-burst volley cadence). Effect in the wave-5 fight: removes ~1
  volley (12 bolts) from the TTK window (volleys at ~4.0/8.0/10.6/13.2 s
  become ~4.8/9.6/12.72 s = 3 volleys); +0.8 s repositioning gap per
  volley in phase 1, +0.52 s in phase 2.
- One pass. No companion changes (the single-boss single-lever rule of the
  frozen E70 protocol).

## 6. Sweeps + adjudication + acceptance (FROZEN)

- Metrics (frozen): B56 = deaths on wave in {5,6} (any attribution) -
  baseline 13/30 (sweep573); M56 = deaths on wave in {5,6} AND
  clsPrimary == MONOLITH - baseline 10/30.
- sweep577 (ST-545, I578): 30 FRESH seeds 57700+i; rules577.md FROZEN
  PRE-RUN in .evidence/I578/ (clone of the .evidence/I574/rules573.md
  lineage, E81 labels); full director from wave 1; frozen I328 kiter
  verbatim (as carried in .evidence/I574/sweep573.mjs); cap 36000 ticks
  @ 1/60; in-process, zero servers/tabs.
- Adjudication (frozen, evaluated on sweep577):
  - (B) B56 >= 12/30 -> apply the lever.
  - (A*) 10 <= B56 <= 11 AND M56 >= 8/30 -> apply the lever (the
    pre-registered single-boss extension - justified by the MEASURED
    single-boss premise: the same fight every time; a sub-12 band here is
    seed variance on a single-boss wall, not wall absence). Recorded WITH
    MEASUREMENT when used.
  - (C) B56 <= 9/30 -> ST-546 VOID + accept (E78-lever pattern, docs-only
    close).
  - Material divergence from this doc -> RECORD + REGISTER before any
    code change (I570 pattern); the extension re-derives nothing.
- sweep578 (ST-546, I579): 30 fresh seeds 57800+i. Acceptance (frozen):
  - (a) B56 <= 9/30 (baseline 13/30);
  - (b) M56 <= 7/30 (baseline 10/30);
  - (c) median death wave >= 9 (baseline 9);
  - (d) >= 3/30 reach wave >= 13 (sweep573 best: wave 11; historical
    best: sweep569 3/30 reached >= 13, best wave 14);
  - (e) 5-harness gate EXACT, no re-pin.
- C1 (on (a) or (b) failure, or (c) or (d) failure): git restore
  src/core/config.js (one line) + accept-with-documentation + the
  residual to the E82+ backlog WITH the full measurement record + the
  E81 pattern-lever registration (candidates, preference order, ONE
  chosen by that epic's own frozen rules):
  - P1 burst.count 12 -> 9 (wall density at the same cadence);
  - P2 burst.speed 7.0 -> 6.0 (dodge-window widening, pattern unchanged);
  - P3 fireEvery 2.2 -> 2.6 (aimed pressure down, radial wall unchanged).
  E81 closes at G81.0 as an accept round (E78/E79/E80 pattern).

## 7. Pin safety (pre-registered)

All five harness pins live at wave <= 2 (causal495 wave 2 on seed-9876;
causal483 ~45 s demo window; playframe A MENU / B ~wave 1; pwa491
menu-only). The endless Monolith first spawns at wave 5; the burst timer
is time-driven (game.js:645 init, L408 reset) -> the lever draws ZERO
extra RNG on any pinned path -> EXPECTED EXACT, no re-pin.

## 8. dist policy

The lever is a 1-char literal swap in shipped config; comments do not
ship -> EXPECTED byte-identical 6,430,174 B / 203. Ceiling 7,400,000 B
(KEEP); tripwire 7,297,600 B; CLOSE FLOOR E81 re-derived WITH
MEASUREMENT at G81.0 (I580), headroom floor >= 102,400 B (cut ladder
NOT expected). Vendor pins r187 unchanged (no vendor change this epic).

## 9. Risks

- R-1 pattern-density wall: if the lever fails (a)/(b), the wall is
  radial-wall DENSITY (count/geometry), not cadence; C1 executes and the
  E81 pattern-lever registration (P1/P2/P3, sec. 6) is the E82+ handoff -
  never a second fiddle inside E81.
- R-2 seed variance: same-tree H spans 0.400-0.667 across
  sweep565/567/569/571/573 and the wave-5 band spans 7-12/30 across those
  samples (567 10 / 569 7 / 571 9 / 573 12); the adjudication is FROZEN
  PRE-RUN with the exact story consequence of all three branches
  pre-registered (B/A* -> ST-546 lever + measurement; C -> ST-546 VOID).
- R-3 late-wave side effect: the wave-15/20/25/... Monoliths move to the
  same +20% burst cadence at their higher HP (76/88/88) - the intended
  same-lever direction (the same fight shape gets the same wiggle room at
  every Monolith wave).
- R-4 enrage phase: the phase-2 cadence 2.6 s -> 3.12 s (everyMult 0.65
  unchanged) - the enrage mechanic is preserved; it still lands inside
  the mid-skill kiter's TTK window (the lever removes ~1 volley from the
  pre-enrage window, sec. 5).
- R-5 attribution: frozen since I525/I564 (primary == strict
  killing-blow attribution); the 3 post-kill residual-bolt deaths in the
  band are counted by B56 (band metric, any attribution) but NOT by M56
  (MONOLITH-primary only) - both metrics frozen pre-run, so the residual
  ambiguity cannot flip the adjudication.

## 10. Story map

- ST-544 (I577) - open + research + scope-check (docs-only) - this doc.
- ST-545 (I578) - sweep577 pre-lever re-audit + the frozen
  adjudication B/A*/C.
- ST-546 (I579) - CONDITIONAL: lever one line + sweep578 (30 fresh seeds
  57800+i) + acceptance (a)-(e); OR VOID on Branch C; C1 on acceptance
  failure.
- ST-547 (I580) - G81.0 close gate (clone of the .evidence/I576 runner
  pattern).

## 11. Changed files (I577, docs-only)

design/e81-monolith-wave5-wall-research.md (NEW, this doc, FROZEN) +
production/scope-check-E81.md (NEW) + production/epics.md (E81 OPEN) +
production/stories.md (ST-544 DONE) + production/iterations.md (I577) +
production/timeline.md (I577) + production/session-state/active.md (I577
NEXT) + CHANGELOG.md (I577) + .evidence/I577/ (extract573.cjs +
extract573b.cjs - the I577 measurement artifacts, git add -f). ZERO
src/assets/vendor/render/i18n.

## 12. Verification bar (quality 6/6, docs-only) + next owner

- npm test 1,237/1,237 / npm run build 0 / dist byte-identical
  6,430,174 B / 203 / vendor 4/4 EXACT (three.module
  A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu
  F549248412C62B9A / three.tsl 7FF9ACF50F006017) / BOM delta 0 (epics
  3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1 /
  CHANGELOG 7) / hygiene (zero servers/tabs).
- Next owner: I578 (ST-545) sweep577 pre-lever re-audit (rules577 FROZEN
  PRE-RUN in .evidence/I578/).