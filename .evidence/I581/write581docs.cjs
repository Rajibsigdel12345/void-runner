// I581 doc writer: design/e82-monolith-wave5-wall-ii-research.md (FROZEN, LF, no BOM, no trailing NL)
// + production/scope-check-E82.md (FROZEN, CRLF, head BOM, no trailing NL). ASCII-only content.
const fs = require("fs");

const research = `# E82 - Wave-5 Monolith Wall II (frozen E82 lever: boss.burst.every 4.0 -> 4.8, carried from E81) - research

Status: FROZEN (opened I581, ST-548). The lever, the frozen lever-selection rule, the sweep581/sweep582 protocol, the B/A*/G/C adjudication (gap-free tiling of the (B56, M56') space), the acceptance (a)-(e), and the C1 cut path are FROZEN in this doc; the story map ST-548..ST-551 runs I581..I584. Next owner: I582 (ST-549) sweep581 pre-lever re-audit.

## Standing context (E81 residual, carried)

The E81 close (I580, G81.0 accept round - gap case) registered:

- The wave-5 Monolith wall remains THE live wall (band span 7-12/30 across
  five same-tree samples: 567 10 / 569 7 / 571 9 / 573 12 / 577 11) - a
  teach/pacing question that E80 registered and E81 ran as a minimal
  single-lever round.
- The frozen E81 lever (boss.burst.every 4.0 -> 4.8, config.js:300) stayed
  UNAPPLIED/registered: the sweep577 pre-lever re-audit (I578) landed in an
  uncovered cell of the frozen adjudication (B56 11/30, M56 7/30: (B) 11 < 12
  / (A*) in range but M56 7 < 8 / (C) 11 > 9 - all three literal branches
  false, drafting gap) -> RECORD + REGISTER (I570 pattern), ST-546 VOID +
  accept (C-equivalent, E78 pattern).
- The E81 pattern-lever registration [P1 burst.count 12 -> 9 / P2
  burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6, preference order, ONE
  chosen by that epic's own frozen rules] carries to E82+.
- PROCESS FINDING (d): future frozen adjudications must explicitly tile the
  metric space the branches are defined over.
- E82 is the frozen E70 protocol (fresh research + fresh scope-check + fresh
  30-seed pre-lever sweep) run on the registered wave-5 Monolith wall WITH
  the full gap-case record. House precedent: E80 picked up E79's unapplied
  registered lever and re-adjudicated it on a fresh sweep - E82 does the
  same with the unapplied E81 lever (P0, sec. 5).

## 1. Measured current state (pre-lever, sweep577 + I581 band decode)

- sweep577 (I578; authoritative record .evidence/I578/sweep577.json
  103,926 B): 30/30 died, median death wave 9, death-wave dist wave5 x11 /
  wave7 x1 / wave8 x2 / wave9 x2 / wave10 x7 / wave11 x1 / wave13 x3 / wave15
  x3; tally (primary) MONOLITH 9 / SPLICER 6 / bullet_unknown 4 / rock_M 2 /
  rock_S 2 / phantom 2 / gunship 2 / sentry 2 / rock_L 1; H = 15/30 = 0.500
  (same-tree span 0.400-0.667).
- Band decode (NEW .evidence/I581/extract581.cjs + extract581.txt, run I581
  over sweep577.json): the 11 band deaths (wave in {5,6}) are ALL wave 5,
  ZERO wave 6, ALL source=bullet:
  - inFight = 7 (clsPrimary MONOLITH, boss alive at death, HP 3-49 of 64,
    phases 1+2);
  - postKillResidual = 4 (clsPrimary bullet_unknown; the Monolith died
    4/54/72/77 ticks (0.07-1.28 s) BEFORE the player - same shape as
    sweep573's 2-90 ticks);
  - V-DECODE (base = v/recentMul[0]; base 7 = burst, base 9 = aimed):
    burst-class 10, aimed-class 1, ambiguous 0;
  - ALL 11: livesUsed 3, weaponLevel 2, bombs 0 (no emergency valve);
    offsets 566-1266 ticks (9.4-21.1 s) from the wave-5 start.
- So the effective Monolith-fight-window band deaths = 11/11 (100% of the
  band is the fight window, in-fight or its immediate post-kill residual),
  and the burst-class dominance is 10/11 - the measured defect is the same
  as at E81 open: BULLET DENSITY in the fight window, dominated by the
  radial burst cadence; the single aimed-class death (run 57701, v=8.1
  base=9) is the only aimed-pressure contribution in the band.

## 2. Web findings (chapter/section-level cites, house norm)

- S1 (FROZEN, carried verbatim from the E81 doc): Bog Hog, 'Bullet Pattern
  Design [SHMUP WORKSHOP 03]' (https://youtu.be/ArZRZSYICLo, 17K views,
  7:19, 2023-01-13): [3:38-4:09] 'slowly escalate difficulty... lets players
  get into its flow before fully blasting them'; [2:04-2:34] 'if the player
  is getting blasted with aimed patterns while stuck in the lane some extra
  wiggle room can be vital for survival'; [3:06-3:38] pattern roles +
  'direct challenge when sufficiently wide, dense, fast'.
- S2 (FROZEN, carried): GMTK, 'How Games Get Balanced'
  (https://youtu.be/WXQzdXPTb2A, 1.3M views, 15:34): [2:43-3:16] Halo 3
  sniper 'the best knob to tweak was the time between shots, bumped from
  0.5 to 0.7 seconds' (Jaime Griesemer's GDC 2010 talk is literally titled
  this) - single-cadence-knob precedent; our lever is the same shape, more
  conservative (+20% vs +40%). [1:10-1:42] Jeff Kaplan 'the perception of
  balance is more powerful than balance itself'.
- S3: Sparen, 'Danmaku Design Studio, Guide A4'
  (sparen.github.io/ph3tutorials/ddsga4.html), 'Part 3: Spacial and Temporal
  Density' + 'Part 3b: Bullet Speed and Spacial Density': faster bullets
  lower overall spacial density (patterns lose form, bursts catch up/
  overlap); slower bullets stay in the field of view LONGER; spawn timing
  (temporal density) is what creates/disperses density. Extraction: slowing
  the bolts (P2) would INCREASE on-screen spacial density - the wrong
  direction; the temporal knob (cadence) is the density lever.
- S4: Flukz, 'Bullet Pattern Design in Shmups'
  (flukz.org/devlog/bullet-pattern-design-shmup): 'Speed, bullet count,
  spread angle, rotation rate, burst delay... are the core knobs'; 'when
  difficulty scaling needs the pattern 15% faster... The pattern geometry
  stays identical; only the parameters change'; 'Stacking multiple scaling
  axes simultaneously... compresses difficulty too rapidly. Players can
  adapt to one change at a time'. Extraction: single-knob,
  geometry-identical parameter change = exactly the frozen E70 lever class.
- S5: Flukz, 'Bullet-Hell Patterns Explained: Rings, Fans, Spirals'
  (flukz.org/devlog/bullet-hell-patterns-explained): 'Speed as the tuning
  dial: Slow bullets are readable and dodgeable with room to spare; fast
  bullets require immediate, correct reaction... slow, dense waves for
  visual spectacle... fast, sparse streams for reaction-based challenges';
  'A pattern with no safe path is not hard - it is broken... at least one
  safe path should exist at all times'. Extraction: the measured band
  (the radial wall with no safe path for a mid-skill kiter) is the 'broken,
  not hard' case; wiggle room restores the safe path.
- S6: Giest118, 'Guide to Making Good Bullet Hell Bosses'
  (shmups.system11.org/viewtopic.php?t=44816): keep bullet density
  consistent; the pattern keeps the same general 'shape' each time; Touhou =
  slow bullets/reflex dodging vs CAVE = sustained attacks that 'never stick
  around long enough to become monotonous'. Extraction: cadence is a
  first-class boss-tuning axis; shape frozen, cadence free.
- S7: RPS, 'Enter the Gungeon' (2016): stagger attacks so bullets have a
  chance to EXIT the screen - avoids 'the perfect fuck-you moment where you
  dodge the first one but as you come out of it you get clipped in the
  back'. Extraction: the 4 measured post-kill residual-bolt deaths are
  exactly this shape; a cadence change moves the residual bolts' timing and
  gives them a better chance to clear the screen before the fight ends.
- S8: Koshin Studio, 'How to make bullet hell patterns'
  (koshinstudio.com/en/notes/danmaku-patterns/): the emitter is 4 numbers
  (interval i, bullets/shot c, speed v, angle r); 'More bullets mean
  narrower gaps'. Extraction: the interval i is the density knob orthogonal
  to c and v - the lever moves i alone.
- NOTE (honest record): the YouTube MCP transcript fetch was BROKEN this
  session ('unavailable to anonymous clients' - verified on 4 videos incl.
  the Bog Hog Gunvein interview + Electric Underground); S1/S2 quotes remain
  valid from the FROZEN E81 doc (extracted there with working transcripts);
  S3-S8 are written sources fetched via Parallel web_search (search_id
  search_e9e986c42a824e3fc66eaec954d07393), section-level cites per house
  norm. Bog Hog WORKSHOP 04 stays discarded per E70/E80 house precedent.

## 3. Code grounding (RE-MEASURED from the tree at I581; matches E81 sec. 3)

- config.js boss block L261-316: everyWave 5 (L265) / maxHp 64 (L266; I325's
  registered 12 s TTK floor) / hpFirstWave 10 (L267; wave-5 HP 64 EXACT per
  boss.js:19-25) / hpStep 12 / hpCap 88 / radius 3.4 / speed 1.6 / turn 0.8
  / ringEvery 2.5 (L273; the E77 lever) / ringCount 8 / splitCount 4 /
  fireEvery 2.2 (L277) / enterTime 0.8 / phase2 { hpFrac 0.5, speedMult 1.3,
  turnMult 1.4, spin 1.6, ringEveryMult 0.6 (L297) } / burst { every 4.0
  (L300 - THE LEVER LINE), count 12 (L301), speed 7.0 (L302), offsetSpin
  0.45, everyMult 0.65 (L304) } / score 1000 / telegraph render-only. The
  splicer block starts L317.
- game.js:616-645 spawnBossForWave: endless-only (campaign early-returns at
  L618); L645 burst timer init (time-driven, no RNG); L408 burst reset adds
  bb.every x (phase2 ? bb.everyMult : 1); L386/401 aimed bolts fire at
  cfg.enemyBullets.speed (=9); L397-401 entrance gate + bossAimEvery().
- Campaign isolation (RE-MEASURED): campaignBoss.js:29-30 own HP path
  (cfg.campaignBoss.hp[level], default 96) + own moves (config L1388
  aimEvery [2.4, 1.8, 1.3]); the splicer block (config L317-347) is
  separate; the campaign spawnBossForWave early-returns at game.js:618 ->
  cfg.boss.burst is NEVER read on the campaign path -> the lever is
  structurally endless-only (stronger than the BAL-4 shared-config pattern;
  no campaign note needed).
- E81 rejections (re-verified, still hold): maxHp 64 -> 56 breaks I325's
  registered 12 s TTK floor (mid-skill kiter 12.7 s -> ~10.9 s) and shifts
  w15/w20 HP (76 -> 68, 88 -> 80); ringCount / splitCount - zero rock deaths
  in the band; P1 burst.count and P2 burst.speed are pattern
  geometry/character knobs (second-lever class per the E81 scope-check's
  frozen-geometry clause).
- dist: a 1-char literal swap ("4.0" -> "4.8") in shipped config; comments
  do not ship -> EXPECTED byte-identical 6,430,174 B / 203.

## 4. Scope decision

- Minimal single-lever round (the frozen E70 protocol): ONE lever (P0 -
  sec. 5), ONE pass WITH MEASUREMENT (sweep582), on-failure -> accept (C1),
  no second fiddle. E79 demonstrated the multi-step scope costs a full C1
  revert when the premise is dead; E82's premise is single-boss and
  MEASURED (sec. 1), so the minimal round is the correct shape.
- Lever class: a difficulty KNOB (volley cadence = temporal density = wiggle
  room), not a fairness RULE (pattern geometry FROZEN - the radial wall is
  the intended challenge per S1 [3:06-3:38]; the measured defect is density,
  not geometry).
- Frozen lever-selection rule (why P0, against the E81 pattern-lever
  registration P1/P2/P3):
  - P3 (fireEvery 2.2 -> 2.6, aimed pressure) REJECTED: the only
    aimed-class death in the band is 1/11 (measured, sec. 1: run 57701,
    v=8.1 base=9) - the aimed cadence is not the wall.
  - P1 (burst.count 12 -> 9) REJECTED: count is pattern GEOMETRY (the wall's
    shape) - a second-lever class per the E81 scope-check's frozen-geometry
    clause; it also removes bolts from the intended challenge itself.
  - P2 (burst.speed 7.0 -> 6.0) REJECTED: slower bolts stay in the field of
    view LONGER -> HIGHER on-screen spacial density (S3 Sparen A4 3b); it
    shifts the reaction character (reflex -> positioning) without reducing
    the density the player has to cross.
  - P0 (burst.every 4.0 -> 4.8) = the temporal-density (volley cadence)
    knob: S1 wiggle room + S2 single-cadence-knob precedent + S4 'one
    change at a time, geometry identical' + S6 density-as-cadence + S7
    residual-bolt clearing + S8 interval-as-the-density-knob. It is ALSO
    the unapplied frozen E81 lever - re-adjudicated on a fresh sweep per
    house precedent (E80 on E79's unapplied registered lever).

## 5. Frozen lever

- boss.burst.every 4.0 -> 4.8 (src/core/config.js:300, one line, +20%
  radial-burst volley cadence). Effect in the wave-5 fight: volleys at
  ~4.0/8.0/10.6/13.2 s become ~4.8/9.6/12.72 s (removes ~1 volley [12 bolts]
  from the TTK window); +0.8 s repositioning gap per volley in phase 1,
  +0.52 s in phase 2. Blast radius (MEASURED): ALL endless Monolith fights
  (w5/w15/w20/w25/...); enrage preserved (everyMult 0.65: 4.8 -> 3.12 s);
  aimed fireEvery 2.2 + the ring schedule unchanged.
- One pass. No companion changes (the single-boss single-lever rule of the
  frozen E70 protocol).

## 6. Sweeps + adjudication + acceptance (FROZEN)

- Metrics (frozen):
  - B56 = deaths on wave in {5,6} (any attribution) - baseline 11/30
    (sweep577).
  - M56' (REFINED, frozen pre-run) = deaths on wave in {5,6} AND
    (clsPrimary == MONOLITH OR (clsPrimary == bullet_unknown AND a
    monolithDeath tick exists within 180 ticks (3 s) BEFORE the player
    death)). The 180-tick window is sized by the MEASURED post-kill
    residuals (sweep573: 2-90 ticks; sweep577: 4/54/72/77 ticks) with
    margin. On sweep577: M56' = 11/30 (vs the E81 M56 = 7/30, which counted
    clsPrimary == MONOLITH only).
  - COMPARABILITY NOTE (R-6): M56' is NOT the same metric as the E81 M56;
    both are reported wherever E82 numbers appear so the E81 record stays
    auditable.
- Gap-free FROZEN adjudication (explicitly tiling the (B56, M56') space -
  satisfies the E81 PROCESS FINDING (d)):
  - (B) B56 >= 12/30 -> apply the lever.
  - (A*) 10 <= B56 <= 11 AND M56' >= 8/30 -> apply the lever (the
    pre-registered single-boss extension, as at E81 - justified by the
    MEASURED single-boss premise: the same fight every time; a sub-12 band
    here is seed variance on a single-boss wall, not wall absence).
    Recorded WITH MEASUREMENT when used.
  - (G) 10 <= B56 <= 11 AND M56' <= 7/30 -> ST-550 VOID + accept + document
    (C-equivalent; this is the cell that was UNCOVERED at E81 under the
    M56-only metric).
  - (C) B56 <= 9/30 -> ST-550 VOID + accept (E78-lever pattern).
  - The four cells are mutually exclusive and exhaustive over the
    (B56, M56') space (B56 in {>= 12} vs {10, 11} vs {<= 9}; within {10,
    11}, M56' >= 8 vs M56' <= 7). NO uncovered cell remains.
  - Material divergence from this doc -> RECORD + REGISTER before any code
    change (I570 pattern); nothing is re-derived.
- sweep581 (ST-549, I582): 30 FRESH seeds 58100+i; rules581.md FROZEN
  PRE-RUN in .evidence/I582/ (clone of the .evidence/I578/rules577.md
  lineage: E82 labels, the M56' metric definition, the 4-branch block above
  verbatim); full director from wave 1; frozen I328 kiter verbatim (as
  carried in .evidence/I574/sweep573.mjs); cap 36000 ticks @ 1/60;
  in-process, zero servers/tabs.
- sweep582 (ST-550, I583, only if the lever applies): 30 fresh seeds
  58200+i. Acceptance (frozen):
  - (a) B56 <= 9/30 (baseline 11/30, sweep577);
  - (b) M56' <= 7/30 (baseline 11/30, sweep577);
  - (c) median death wave >= 9 (baseline 9);
  - (d) >= 3/30 reach wave >= 13 (sweep577: 6/30, best wave 15 -
    non-regression floor);
  - (e) 5-harness gate EXACT, no re-pin.
- C1 (on (a) or (b) failure, or (c) or (d) failure): git restore
  src/core/config.js (one line) + accept-with-documentation + the residual
  to the E83+ backlog WITH the full measurement record + the P1/P2/P3
  pattern-lever registration carries to E83+ + E82 closes at G82.0 as an
  accept round (E78/E79/E80/E81 pattern).

## 7. Pin safety (pre-registered)

All five harness pins live at wave <= 2 (causal495 wave 2 on seed-9876;
causal483 ~45 s demo window; playframe A MENU / B ~wave 1; pwa491
menu-only). The endless Monolith first spawns at wave 5; the burst timer is
time-driven (game.js:645 init, L408 reset) -> the lever draws ZERO extra
RNG on any pinned path -> EXPECTED EXACT, no re-pin.

## 8. dist policy

The lever is a 1-char literal swap in shipped config; comments do not ship
-> EXPECTED byte-identical 6,430,174 B / 203. Ceiling 7,400,000 B (KEEP);
tripwire 7,297,600 B; CLOSE FLOOR E82 re-derived WITH MEASUREMENT at G82.0
(I584), headroom floor >= 102,400 B (cut ladder NOT expected). Vendor pins
r187 unchanged (no vendor change this epic).

## 9. Risks

- R-1 pattern-density wall: if the lever fails (a)/(b), the wall is
  radial-wall DENSITY (count/geometry), not cadence; C1 executes and the
  P1/P2/P3 registration is the E83+ handoff - never a second fiddle inside
  E82.
- R-2 seed variance: same-tree H spans 0.400-0.667 across
  sweep565/567/569/571/573/577 and the wave-5 band spans 7-12/30 across the
  five same-tree samples (567 10 / 569 7 / 571 9 / 573 12 / 577 11); the
  adjudication is FROZEN PRE-RUN with the exact story consequence of all
  four branches pre-registered (B/A* -> ST-550 lever + measurement; G/C ->
  ST-550 VOID).
- R-3 late-wave side effect: the wave-15/20/25/... Monoliths move to the
  same +20% burst cadence at their higher HP (76/88/88) - the intended
  same-lever direction (the same fight shape gets the same wiggle room at
  every Monolith wave).
- R-4 enrage phase: the phase-2 cadence 2.6 s -> 3.12 s (everyMult 0.65
  unchanged) - the enrage mechanic is preserved; it still lands inside the
  mid-skill kiter's TTK window.
- R-5 attribution: frozen since I525/I564 (primary == strict killing-blow
  attribution); B56 + M56' are both frozen pre-run here, so the residual
  ambiguity (the 4 post-kill bullet_unknown deaths) is decided by the
  frozen 180-tick window, not by post-hoc judgement.
- R-6 (NEW) metric comparability: M56' (with the 180-tick post-kill
  residual window) is a refinement of the E81 M56, not the same metric;
  both are reported wherever E82 numbers appear so the E81 record stays
  auditable.

## 10. Story map

- ST-548 (I581) - open + research + scope-check (docs-only) - this doc.
- ST-549 (I582) - sweep581 pre-lever re-audit + the frozen gap-free
  adjudication B/A*/G/C.
- ST-550 (I583) - CONDITIONAL: lever one line + sweep582 (30 fresh seeds
  58200+i) + acceptance (a)-(e); OR VOID on Branch G or C; C1 on acceptance
  failure.
- ST-551 (I584) - G82.0 close gate (clone of the .evidence/I580 runner
  pattern).

## 11. Changed files (I581, docs-only)

design/e82-monolith-wave5-wall-ii-research.md (NEW, this doc, FROZEN) +
production/scope-check-E82.md (NEW, FROZEN) + production/epics.md (E82
OPEN) + production/stories.md (ST-548 DONE) + production/iterations.md
(I581) + production/timeline.md (I581) + production/session-state/active.md
(I581 NEXT) + CHANGELOG.md (I581) + .evidence/I581/ (extract581.cjs +
extract581.txt + write581docs.cjs + bookkeep581.cjs - git add -f). ZERO
src/assets/vendor/render/i18n.

## 12. Verification bar (quality 6/6, docs-only) + next owner

- npm test 1,237/1,237 / npm run build 0 / dist byte-identical
  6,430,174 B / 203 / vendor 4/4 EXACT (three.module
  A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu
  F549248412C62B9A / three.tsl 7FF9ACF50F006017) / BOM delta 0 (AGENTS 1 /
  epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG
  7) / hygiene (zero servers/tabs/terminals).
- Next owner: I582 (ST-549) sweep581 pre-lever re-audit (rules581.md FROZEN
  PRE-RUN in .evidence/I582/; sweep581.mjs cloned from
  .evidence/I578/sweep577.mjs: E82 labels + the M56' metric + the 4-branch
  decision block verbatim from this doc sec. 6).`;

const scope = `# E82 scope check - Wave-5 Monolith Wall II (frozen E82 lever: boss.burst.every 4.0 -> 4.8, carried from E81)

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
3. AGENTS.md item-4 refreshed (CLOSE FLOOR E82 line; the E81 line demoted to prior per house pattern) + E82 CLOSED + residual registration (post-lever wall state; if the C1 path fires, the P1/P2/P3 registration is the E83+ handoff) + quality bar 6/6 on every story.`;

// design doc: LF, no BOM, no trailing NL (matches E81 research doc)
let r = research.replace(/\r\n/g, "\n");
if (r.endsWith("\n")) r = r.slice(0, -1);
if (/\r/.test(r)) throw new Error("research: stray CR");
for (const ch of r) if (ch.charCodeAt(0) > 127) throw new Error("research: non-ASCII");
fs.writeFileSync("design/e82-monolith-wave5-wall-ii-research.md", r, "utf8");
console.log("research OK, bytes " + fs.statSync("design/e82-monolith-wave5-wall-ii-research.md").size);

// scope-check: CRLF, head BOM, no trailing NL (matches E81 scope-check)
let sc = scope.replace(/\n/g, "\r\n");
if (sc.endsWith("\r\n")) sc = sc.slice(0, -2);
sc = "\uFEFF" + sc;
for (const ch of sc) if (ch.charCodeAt(0) > 127 && ch !== "\uFEFF") throw new Error("scope: non-ASCII");
fs.writeFileSync("production/scope-check-E82.md", sc, "utf8");
console.log("scope OK, bytes " + fs.statSync("production/scope-check-E82.md").size);
console.log("WRITE581DOCS DONE");