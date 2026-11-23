const fs = require('fs');
const p = 'E:/Game/design/e80-splicer-wave10-wall-research.md';
if (fs.existsSync(p)) { console.error('ABORT: target exists'); process.exit(1); }
const doc = `# E80 - Splicer Wave-10 Wall (frozen E70 lever [2]: splicer.maxHp 30 -> 24) - research

Status: FROZEN (opened I573, ST-540). The lever, the sweep573/sweep574
protocol, the B/A*/C adjudication, the acceptance (a)-(e), and the C1 cut
path are FROZEN in this doc; the story map ST-540..ST-543 runs I573..I576.
Next owner: I574 (ST-541) sweep573 pre-lever re-audit.

## Standing context (E79 residual, carried)

The E79 close (I572, G79.0 accept round) registered the post-E79 wall:

- "post-E79 live wall = the Splicer's OWN wave-10 fight (sweep571:
  wave-10 cluster 13/30, SPLICER 8/30, median death wave 10); the frozen
  E70 lever [2] (splicer.maxHp 30 -> 24) is the recorded E70-protocol
  candidate."
- The L-A boss-retirement mechanism (implemented + measured at I571) was
  shown INERT on the current tree - the kiter kills the wave-5 Monolith
  in-window (RETIRES NONE 21/21; sweep569 cross-check: 0/23 Monoliths
  alive at wave-8 start) - the C1 revert was executed and the mechanism
  is registered not to be re-attempted (no-second-fiddle rule).
- The composite premise is MEASURED DEAD: with no stale boss persisting
  past its wave, the wall is not a multi-source composite - it is the
  Splicer's own wave-10 fight, single-boss, single-source.
- E79 reserved: "the frozen E70 protocol governs a future dominant
  wall." E80 is exactly that: the frozen E70 protocol run on its
  recorded candidate.

## 1. Measured current state (pre-lever, carried sweeps)

- sweep565 (post-E77, 30 seeds 56500+i): median death wave 9.5;
  H = 0.533 (16/30); SPLICER 9/30.
- sweep567 (30 seeds 56700+i): median death wave 9; H = 0.400 EXACT
  (12/30); SPLICER 5/30 (all on wave 10); MONOLITH 7/30; death-wave dist
  wave5 x10 / wave8 x4 / wave9 x3 / wave10 x11 / wave12 x1 / wave14 x1.
- sweep569 (30 seeds 56900+i): median death wave 10; H = 0.667 (20/30);
  SPLICER 14/30 - 14 of the wave-10 cluster 16/30; wave-5 cluster 7/30;
  best run 56913 reached wave 14 (233,042 pts); 3/30 reached wave >= 13.
- sweep571 (T2, L-A INERT, 30 seeds 57100+i): median death wave 10;
  H = 0.467 (14/30); SPLICER 8/30; wave-10 cluster 13/30 (SPLICER 8 /
  rock_S 2 / gunship 2 / bullet_unknown 1).
- Structure: on every same-tree sweep the wave-10 cluster is 11-16/30 and
  the SPLICER is the largest single source in 3 of 4 sweeps; the H
  composite spans 0.400-0.667 (seed variance, R-2). The wall is STABLE
  (the same fight every time), unlike a diffuse multi-band wall.
- TTK grounding (the measured defect): the wave-10 Splicer has exactly
  30 hp (wave 10 < hpFirstWave 15 -> base maxHp, no scaling). The
  player's fireInterval is 1/5.5 s/shot (config.js:149) -> theoretical
  minimum TTK 30/5.5 = 5.45 s of perfect fire while simultaneously
  weaving the spiral; post-lever 24/5.5 = 4.36 s. The pattern itself is
  readable and measured-fair: I144 tuned spiralEvery 0.6 to a 4.2u gap
  ~ 1.9x the ship's 2.24u effective obstacle ("threadable"); the
  phase-2 enrage gap is 2.73u ~ 1.22x ("tight but fair"). So the defect
  is DURATION (30 hits of sustained spiral weaving), not READABILITY.

## 2. Web findings (chapter-level cites, house norm)

- S1: Omertosa, "Sekiro Solved Game Design. Everyone Else Is Catching
  Up." (https://youtu.be/fBC_wth1Ub0, 99K views, 26:06): [6:35-7:06]
  "the most fair Soulslike" + "You can't change your damage or your
  health beyond a certain point"; [7:37-8:09] Miyazaki: "We don't want
  to include a difficulty selection because we want to bring everyone to
  the same level of discussion and the same level of enjoyment... face
  that challenge and overcome it in some way that suits them as a
  player"; [8:40-9:11] "You can't outlevel challenges. You simply have
  to overcome them... It's the purest skill expression."
  Extraction: a boss fight must be decidable by pattern mastery inside a
  bounded window. The player's kit cannot outlevel the wall; the fix
  goes on the wall side (bounded HP) - never as a difficulty option,
  never as player-power growth.
- S2: The Electric Underground, "R-Type Final 2 In-Depth Review"
  (https://youtu.be/C3G6w3kbnoQ, 15K views, 30:32): [14:33-16:00]
  "there's not a lot of logical sense behind what the enemies are going
  to do... how the bosses are going to act"; "it throws novel things at
  you that you've never seen before."
  Counter-argument source: if the Splicer defect were unpredictability,
  the matching fix would be pattern readability, not HP. Rebuttal: the
  spiral IS readable and measured-fair (I144) - the measured defect is
  TTK duration, so the HP lever is the matching fix (not a pattern
  change).
- Discarded: Bog Hog SHMUP WORKSHOP 04 (thin - E70 house precedent);
  Weeb Nerd VKL CC (score-attack axis, not beatability); Metal Wings /
  G-TYPE retro clips (pre-date the pattern language in use).

## 3. Code grounding (MEASURED from the tree at I573)

- config.js:317-347 splicer block: maxHp 30 (L322) - THE LEVER LINE /
  hpFirstWave 15 (L323) / hpStep 8 (L324) / hpCap 72 (L325) / radius
  2.6 / score 600 / splitCount 2 M / holdRadius 11 / orbitSpeed 0.5 /
  arms 2 / armSpin 1.2 / spiralEvery 0.6 (L336; I144: gap 4.2u ~ 1.9x
  the ship's 2.24u obstacle - "threadable") / boltSpeed 7.0 / aimEvery
  2.6 / phase2 { hpFrac 0.5, orbitSpeedMult 1.4, armSpinMult 1.5,
  spiralEveryMult 0.65 (L343; gap 2.73u ~ 1.22x - "tight but fair"),
  aimEveryMult 0.7, spin 1.2 }.
- splicer.js:10-15 splicerHpForWave: wave < 15 -> base maxHp EXACT
  (wave-10 = 30 hits, no scaling); wave >= 15 -> min(72, maxHp +
  floor((wave - 15) / boss.everyWave) * 8) with boss.everyWave = 5
  (config.js:265).
- Blast radius of maxHp 30 -> 24 (MEASURED derivation, everyWave 5 /
  hpStep 8 / hpCap 72): w10 30 -> 24 / w20 38 -> 32 / w25 46 -> 40 /
  w30 54 -> 48 / w35 62 -> 56 / w40 70 -> 64 / w45+ capped at 72 both
  pre and post (unchanged). phase2 is fraction-based (hpFrac 0.5) ->
  auto-scales (15 -> 12 hits).
- game.js:616-641 spawnBossForWave: endless-only (campaign
  early-returns at L618); wave % boss.everyWave == 0; variant alternates
  by bossSpawnCount % 2 (L621): w5 Monolith / w10 Splicer / w15
  Monolith / w20 Splicer; L638 constructs the Splicer with
  splicerHpForWave(cfg, wave).
- Campaign isolation (MEASURED): every level boss is a CampaignBoss
  (game.js:847; the level-2 "splicer" reference is TINT only,
  game.js:846); its HP comes from cfg.campaignBoss.hp[level]
  (campaignBoss.js:30, default 96) - cfg.splicer is NEVER read on the
  campaign path -> the lever is structurally endless-only (stronger
  than the BAL-4 shared-config pattern; no campaign note needed).
- Pin safety: HP is a constructor argument (splicer.js:23); the
  spiral/aimed bolt schedule is time-driven (spiralTimer / aim timer) ->
  the lever draws ZERO extra RNG -> every pinned path (all wave <= 2)
  is bit-invisible -> EXPECTED EXACT, no re-pin.
- TTK: config.js:149 player fireInterval 1/5.5 -> theoretical min TTK
  5.45 s -> 4.36 s post-lever.
- dist: a 2-char literal swap (30 -> 24) in shipped config; comments do
  not ship -> EXPECTED byte-identical 6,430,174 B / 203.

## 4. Scope decision

- Minimal single-lever round (the frozen E70 protocol): ONE lever (E70
  [2]), ONE pass WITH MEASUREMENT (sweep574), on-failure -> accept
  (C1), no second fiddle. E79 demonstrated the multi-step scope costs a
  full C1 revert when the premise is dead; E80's premise is single-boss
  and MEASURED (sec. 1), so the minimal round is the correct shape.
- Lever class: a difficulty KNOB (bounded wall HP), not a fairness RULE
  (pattern geometry unchanged - measured-fair per I144). A pattern
  change (spiralEvery / boltSpeed / armSpin) would be a SECOND lever;
  it is registered for E81+ only (the R-1 pattern-lever registration)
  and is never a second fiddle inside E80.
- The pre-registered single-boss adjudication extension (A*, sec. 6) is
  a rule about WHEN the frozen lever may fire under seed variance - it
  re-derives nothing; the lever value stays frozen from E70.

## 5. Frozen lever

- E70 lever [2] (design/e70-balance-followup-research.md sec. 4,
  carried through the E78/E79 guard "lever [2] stays UNAPPLIED/
  registered"): splicer.maxHp 30 -> 24 (src/core/config.js:322, one
  line, -20% TTK).
- One pass. No companion changes (the single-boss single-lever rule of
  the frozen E70 protocol).

## 6. Sweeps + adjudication + acceptance (FROZEN)

- sweep573 (ST-541, I574): 30 FRESH seeds 57300+i; rules573.md FROZEN
  PRE-RUN in .evidence/I574/ (clone of the .evidence/I570/rules569.md
  lineage, E80 labels); full director from wave 1; frozen I328 kiter
  verbatim (as carried in .evidence/I570/sweep569.mjs); cap 36000 ticks
  @ 1/60; in-process, zero servers/tabs. Thresholds verbatim from
  rules564: H = MONOLITH + SPLICER + WARDEN share; W10 = wave-10
  cluster /30; W5 = wave-5 cluster /30.
- Adjudication (frozen, evaluated on sweep573):
  - (B) H >= 0.600 AND SPLICER = largest single source -> lever [2].
  - (A*) 0.400 < H < 0.600 AND SPLICER = largest single source AND
    W10 >= W5 -> lever [2] (the pre-registered single-boss extension -
    justified by the MEASURED-dead composite premise: RETIRES NONE
    21/21, 0/23 Monoliths alive at wave-8 start, so a sub-0.600 H here
    is seed variance on a single-boss wall, not a composite). Recorded
    WITH MEASUREMENT when used.
  - (C) otherwise (H <= 0.400, or SPLICER not the largest single
    source, or W10 < W5) -> ST-542 VOID + accept (E78-lever pattern,
    docs-only close).
  - Material divergence from this doc -> RECORD + REGISTER before any
    code change (I570 pattern); the extension re-derives nothing.
- sweep574 (ST-542, I575): 30 fresh seeds 57400+i. Acceptance
  (frozen):
  - (a) median death wave >= 11 (baselines 9-10);
  - (b) wave-10 cluster <= 9/30 (baselines 16/13/11 across
    sweep569/571/567);
  - (c) SPLICER share < 0.250 (baselines 0.467/0.300/0.267/0.167) -
    [0.250, 0.300) borderline pass (registered), >= 0.300 FAIL
    (pattern-driven wall, R-1) -> C1;
  - (d) >= 3/30 reach wave >= 13 (best historical: sweep569 3/30);
  - (e) 5-harness gate EXACT, no re-pin.
- C1 (on (a) or (b) failure, or (c) >= 0.300): git restore
  src/core/config.js (one line) + accept-with-documentation + the
  residual to the E81+ backlog WITH the full measurement record + the
  R-1 pattern-lever registration (candidates, preference order, ONE
  chosen by that epic's own frozen rules):
  - P1 spiralEvery 0.6 -> 0.65 (gap 4.2u -> 4.55u, ~2.0x obstacle);
  - P2 boltSpeed 7.0 -> 6.0 (dodge-window widening, pattern unchanged);
  - P3 armSpin 1.2 -> 1.0 (spiral opening at the same shot cadence).
  E80 closes at G80.0 as an accept round (E78/E79 pattern).

## 7. Pin safety (pre-registered)

All five harness pins live at wave <= 2 (causal495 wave 2 on
seed-9876; causal483 ~45 s demo window; playframe A MENU / B ~wave 1;
pwa491 menu-only). The endless Splicer first spawns at wave 10; its HP
is a constructor argument and the bolt schedule is time-driven -> the
lever draws ZERO extra RNG on any pinned path -> EXPECTED EXACT, no
re-pin.

## 8. dist policy

The lever is a 2-char literal swap in shipped config; comments do not
ship -> EXPECTED byte-identical 6,430,174 B / 203. Ceiling 7,400,000 B
(KEEP); tripwire 7,297,600 B; CLOSE FLOOR E80 re-derived WITH
MEASUREMENT at G80.0 (I576), headroom floor >= 102,400 B (cut ladder
NOT expected). Vendor pins r187 unchanged (no vendor change this epic).

## 9. Risks

- R-1 pattern-driven wall: if (c) >= 0.300 after the lever, the wall is
  pattern-driven, not duration-driven; C1 executes and the R-1
  pattern-lever registration (P1/P2/P3, sec. 6) is the E81+ handoff -
  never a second fiddle in E80.
- R-2 seed variance: same-tree H spans 0.400-0.667 across
  sweep565/567/569/571; the adjudication is FROZEN PRE-RUN with the
  exact story consequence of all three branches pre-registered (B/A* ->
  ST-542 lever + measurement; C -> ST-542 VOID).
- R-3 wave-5 band resurrection: if W10 < W5 on sweep573 -> Branch C ->
  VOID; that is a wave-5 teach/pacing question for a future epic, NOT a
  frozen lever.
- R-4 late-wave side effect: the wave-20..40 Splicers move 38 -> 32 ...
  70 -> 64 until the hpCap 72 absorbs at wave 45+ (both capped) - the
  intended same-lever direction (later waves get the same -20% TTK).
- R-5 attribution: frozen since I525/I564 (primary == strict
  killing-blow attribution); the wave-10 Monolith-residual ambiguity is
  MEASURED dead (RETIRES NONE, 0/23 alive at wave-8 start) - no
  stale-boss misattribution in E80's sweeps.

## 10. Story map

- ST-540 (I573) - open + research + scope-check (docs-only) - this doc.
- ST-541 (I574) - sweep573 pre-lever re-audit + the frozen
  adjudication B/A*/C.
- ST-542 (I575) - CONDITIONAL: lever [2] one line + sweep574 (30 fresh
  seeds 57400+i) + acceptance (a)-(e); OR VOID on Branch C; C1 on
  acceptance failure.
- ST-543 (I576) - G80.0 close gate (CLOSEGATE576, clone of the
  .evidence/I572/run_closegate572.cjs pattern).

## 11. Changed files (I573, docs-only)

design/e80-splicer-wave10-wall-research.md (NEW, this doc, FROZEN) +
production/scope-check-E80.md (NEW) + production/epics.md (E80 OPEN) +
production/stories.md (ST-540 DONE) + production/iterations.md (I573) +
production/timeline.md (I573) + production/session-state/active.md
(I573 NEXT) + CHANGELOG.md (I573). ZERO src/assets/vendor/render/i18n.

## 12. Verification bar (quality 6/6, docs-only) + next owner

- npm test 1,237/1,237 / npm run build 0 / dist byte-identical
  6,430,174 B / 203 / vendor 4/4 EXACT (three.module
  A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu
  F549248412C62B9A / three.tsl 7FF9ACF50F006017) / BOM delta 0 (epics
  3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1 /
  CHANGELOG 7) / hygiene (zero servers/tabs).
- Next owner: I574 (ST-541) sweep573 pre-lever re-audit (rules573
  FROZEN PRE-RUN in .evidence/I574/).
`;
let text = doc.split(/\r?\n/).join('\n').replace(/^\n/, '').replace(/\s+$/, '') + '\n';
if (/[^\x00-\x7F]/.test(text)) { console.error('ABORT: non-ASCII char found'); process.exit(1); }
fs.writeFileSync(p, Buffer.from(text, 'ascii'));
console.log('WROTE', p, Buffer.byteLength(text), 'bytes,', text.split('\n').length - 1, 'lines, LF, no BOM');
