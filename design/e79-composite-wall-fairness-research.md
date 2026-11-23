# E79 - Composite Wall Fairness (boss retirement) - research

Status: research + scope DECIDED (opened I569). Levers L-A/L-B, the sweep569
protocol, the L-A acceptance, and the cut path are FROZEN in this doc; the
story map ST-535..ST-539 runs I569..I573. Next owner: I570 (ST-536) sweep569
pre-lever re-audit.

## Standing context (E78 residual, carried)

The E78 close (I568) registered the composite post-E77 beatability wall as a
residual for a future epic (R-2: "composite wall, no single lever - a future
balance epic may need multi-step scope"):

- sweep567 (30 seeds 56700+i, frozen I328 kiter verbatim, full director from
  wave 1, cap 36000 ticks @ 1/60; rules frozen pre-run in
  .evidence/I567/rules567.md): 30/30 died, median death wave 9; death-band
  structure:
  (a) wave-5 Monolith bolt cluster 10/30,
  (b) wave-10 mixed cluster 11/30 (incl. residual wave-5 Monolith speed-9
      bolts - the boss PERSISTS until killed and is still firing at wave 10),
  (c) wave-8/9 gunship band 4/30;
- H = 0.400 EXACT (12/30) -> Branch C (the frozen single-lever protocol cannot
  reach a composite wall: B requires H >= 0.600, A requires one non-heavyweight
  source >= 0.400 - max = gunship 5/30 = 0.167) -> accept-with-documentation.
- The frozen E70 lever [2] (splicer.maxHp 30 -> 24) was NOT applied (lever
  story VOID at I567) and remains registered: it is a difficulty knob for the
  Splicer specifically, not a fairness rule for the wall.

## 1. Measured current state (carried from I565/I567; no new measurement in I569)

- sweep565 (post-E77 ring lever, 30 seeds 56500+i): median death wave 9.5;
  tally SPLICER 9 / MONOLITH 7 / bullet_unknown 6 / rock_M 4 / gunship 2 /
  rock_S 1 / wasp 1; H fraction 0.533 (16/30); 1/30 reached wave 13.
- sweep567 (independent fresh-seed confirmation, 30 seeds 56700+i): median
  death wave 9; tally MONOLITH 7 / SPLICER 5 / gunship 5 / bullet_unknown 5 /
  rock_M 4 / rock_S 2 / rock_L 1 / phantom 1; H = 0.400 EXACT (12/30); death
  wave distribution wave5 x10 / wave8 x4 / wave9 x3 / wave10 x11 / wave12 x1 /
  wave14 x1; best run seed 56701 reached wave 14 (257,924 pts / 726 kills).
- Interpretation: three distinct pressure points share the wall (composite,
  Branch C). The component with a FAIRNESS DEFECT - not just a difficulty
  level - is (b): a wave-5 Monolith the player could not kill in its window
  (64 hp, speed-9 aimed bolts, ringEvery 2.5) remains a live aimed-bolt source
  for every subsequent wave. E70 F1: kills that are not readable in time are
  bad; a boss that lingers past its wave is a stale state, not a challenge.

## 2. Web findings (labeled sources; chapter-level cites per house norm)

- S1: ShmupWords, "A Visual Glossary of Shoot 'em Ups" (Lazy Devs,
  https://youtu.be/QwQaXsXnce8, 21K views, 43:26).
  [28:17-28:48] bullet ceiling / sealing: background threats stop firing when
  point-blank; sealed "to make the game smoother"; source caveat: "boss
  enemies won't get sealed". Our case is the INVERSE shape: the boss IS the
  persistent background threat after its own wave, and nothing seals it.
  [28:50-29:20] bullet canceling: killing an enemy deletes its fired bullets -
  a standard fairness/density enabler (supports the registered
  bolt-cancellation polish candidate; OUT of E79 scope, see sec.5 L-A).
- S2: The Electric Underground, "10 Modern Game Design Trends that Hurt
  Longevity" (https://youtu.be/5i166-dEGmY, 72K views). [32:34-33:48]
  entropy / consequence-for-idling (classic timers, Majora's Mask) - the
  COUNTER-argument source. Rebuttal registered: entropy works as readable,
  proportionate BACKGROUND pressure (timers), not as an unbounded active
  lethal combatant firing speed-9 aimed bolts for 100+ seconds after its
  window. Retirement BOUNDS the tail; the 3-wave window still punishes
  avoidance (fairness per E70 F1: kills-before-readable = BS).
- Discarded: Fantasy Forge boss-fight video (D&D TTRPG, different genre); Bog
  Hog SHMUP WORKSHOP (E70 house precedent: thin); low-view NEON HORDE gameplay
  clips.

## 3. Code grounding (MEASURED from the tree at I569)

- src/core/game.js:616-619 spawnBossForWave: `const b = this.cfg.boss;` then
  `if (this.mode === 'campaign') return;` (campaign bosses come from level
  ends only) then `if (wave % b.everyWave !== 0 || this.boss) return;`:
  boss waves 5/10/15/20 (everyWave 5); variant alternates by bossSpawnCount
  (0 = Monolith, 1 = Splicer); a live boss suppresses the next boss wave (the
  `this.boss` guard) - this is WHY a wave-5 Monolith still fires at wave 10.
  The campaign final boss is a Monolith instance with `prime = true` (kind
  stays 'monolith'; NO isCampaignBoss flag - verified).
- src/core/game.js:648 - `this.boss.spawnWave = wave` (ST-419 tag; the anchor
  L-A needs).
- src/core/game.js:255-276 - wave-start block: `const wv = this.waves.step(...)`
  then `if (wv.startedWave) { ... }` with L258 spawnMinesForWave, L259
  spawnBossForWave, L260 spawnWardenForWave, L261 spawnBeltForWave, L262-274
  the fleet spawners, L275 scoreKeeper.setCap. L-A hook site = immediately
  BEFORE L259 (first thing the started-wave branch does with the boss).
- src/core/game.js:969-973 spawnWardenForWave: `if (wave % b.everyWave !== 0
  || this.boss || this.warden) return;` - the Warden (separate entity
  `this.warden`, NOT `this.boss`; endless-only per L971) spawns only on 5th
  waves where NO boss is alive. A wave-5 Monolith alive at wave 10 therefore
  suppresses the Splicer AND spawns a Warden instead (bossSpawnCount not
  incremented). Consequence of L-A (registered, sec.9 R-4): no boss can be
  alive on any later 5th wave -> the Warden becomes effectively unreachable
  in endless; wave 10 is always the Splicer -> roster determinism restored.
- Boss death today: bossDeath() = split M rocks + score + emit + `this.boss =
  null`. No retire path exists; L-A adds one (no split, no score, no RNG).
- src/core/enemyBullets.js:37-38 - every bolt has a finite `life` (decays with
  dt) and is culled at life <= 0 or past the rim: retired-boss bolts expire
  naturally. Cancellation on retirement is OUT of L-A scope (the shared pool
  has no source tag); registered with the I526 "post-death bolt window"
  cleanup candidate as future polish (the S1 bullet-canceling finding
  supports it).
- src/core/config.js:261 boss block (maxHp 64 at L266; everyWave 5; ringEvery
  2.5 shipped I565); config.js:467 gunship block (hp 10 per the L470 comment
  "10 hits"; firstWave 8 at L473; maxConcurrent 1 at L475) - the L-B target.
- Render/FX dispatch (src/main.js): SFX_CUES table at L436; event handlers -
  bossSpawn FX L1104, bossDeath FX L1107 (burst + shake + flash + hit-stop +
  punch + fovKick), wardenDeath L1110, boss shatter L1154; shockwave pool
  created at L684. L-A FX = a 'bossRetire' handler reusing the existing
  shockwave pool + particle system + an existing SFX cue from the table:
  NO new assets, NO new i18n strings, NO new SFX synthesis.

## 4. Scope decision (the E79 scope, frozen)

E78's R-2 registration anticipated exactly this: "a future balance epic may
need multi-step scope". The decision, frozen here:

- E79 EXTENDS the frozen E70 single-lever protocol with a PRE-REGISTERED
  ORDERED plan of at most 2 levers, each applied WITH MEASUREMENT on its own
  fresh 30-seed sweep, each on-failure -> accept (C1 revert for L-A; void for
  L-B). This is the minimal multi-step extension R-2 allows - not an
  open-ended tuning arc.
- Distinction that bounds the epic: L-A is a FAIRNESS RULE change (remove a
  stale-state lethal source that outlives its wave window), NOT a difficulty
  knob. L-B is a small, pre-registered difficulty knob, applied ONLY if the
  post-L-A measurement shows the gunship band still qualifies (frozen
  trigger). No other levers exist in E79; anything else the sweeps surface is
  registered for E80+, never applied here (no second fiddle; the frozen E70
  protocol governs a future dominant wall).
- Mode effects: L-A is gated on `this.mode === 'endless'` in code (zero
  campaign bleed; unit-tested). L-B is a shared-config value (campaign
  gunships get -2 hp identically) - documented per the BAL-4 pattern
  (documented observation, NOT a revert trigger).

## 5. Frozen levers

### L-A (primary, ST-537/I571) - boss retirement (fairness rule change)

- Config: `cfg.boss.retireAfterWaves = 3` (endless only, gated in code).
- Code (src/core/game.js): in the wave-start block at L255, BEFORE
  spawnBossForWave (L259):
  `if (this.mode === 'endless' && this.boss && wv.startedWave - this.boss.spawnWave >= this.cfg.boss.retireAfterWaves) this.bossRetire();`
  `bossRetire()`: emit('bossRetire', { pos, kind }); this.boss = null.
  NO split, NO score, NO RNG draws.
- Mode gate is `this.mode === 'endless'`, NOT isCampaignBoss (the Monolith
  Prime is a Monolith instance WITHOUT the flag - sec.3; campaign bosses come
  from level ends and spawnBossForWave early-returns for campaign at
  game.js:618).
- Effect: a wave-5 Monolith retires at wave 8 start; a wave-10 Splicer at
  wave 13 start. The boss is fully killable inside its 3-wave window (the
  kiter killed the wave-5 Monolith in 7/10 sweeps at I525) - retirement
  bounds the tail; it does not remove the challenge.
- Bolts: natural expiry via the finite per-bolt life (enemyBullets.js:37-38).
  Cancellation on retirement is OUT of L-A scope (shared pool, no source
  tag) - registered as future polish (S1 [28:50-29:20]).
- FX (render): 'bossRetire' event handler in main.js - reuses the existing
  shockwave pool + particle burst + an existing SFX cue; NO new assets, NO
  new i18n strings, NO new SFX synthesis.
- Warden interaction (sec.3): wave 10 is always the Splicer after L-A; the
  Warden is effectively unreachable in endless (R-4, registered design
  consequence, not a failure).

### L-B (conditional, ST-538/I572) - gunship hp 10 -> 8

- One-line config change (src/core/config.js, gunship block L467+): the slow
  big-aimed-bolt bomber of wave 8+, maxConcurrent 1.
- FROZEN TRIGGER, evaluated on the post-L-A sweep571: the wave-8/9 band
  (deaths on waves 8-9 attributed to gunship + rock_L + rock_M) >= 4/30 AND
  median death wave < 11 -> apply L-B + re-measure on a fresh sweep572
  (30 seeds 57200+i) with the same acceptance shape as L-A minus the
  L-A-specific (b): (a) median >= 10, (c) max single source < 0.300,
  (d) >= 2/30 wave >= 13, (e) gate EXACT.
- If the trigger does NOT hold: ST-538 is VOID (the lever stays frozen/
  registered for the future, E78-lever pattern). No second pass either way.

## 6. Sweeps + acceptance (frozen)

### sweep569 (ST-536/I570) - pre-lever re-audit

- 30 FRESH seeds 56900+i; full director from wave 1; frozen I328 kiter
  VERBATIM (from .evidence/I524/balance524.mjs, as carried in
  .evidence/I567/sweep567.mjs); cap 36000 ticks @ 1/60. Rules frozen PRE-RUN
  in .evidence/I570/rules569.md (clone of .evidence/I567/rules567.md with
  label hygiene; threshold source rules564: H >= 0.600 Branch B /
  <= 0.400 Branch C / else Branch A by dominant source; heavyweights =
  MONOLITH + SPLICER + WARDEN).
- Role: independent cross-check that the sweep567 composite picture holds on
  the current tree (same role as sweep567 vs sweep565 at I567). Baseline for
  L-A acceptance = the sweep567 values (median 9; wave-10 cluster 11/30).

### L-A acceptance (frozen, evaluated on fresh sweep571 = 30 seeds 57100+i)

(a) median death wave >= 10 (baseline 9);
(b) wave-10 cluster (deaths on wave 10) <= 7/30 (baseline 11/30);
(c) max single killing-blow source < 0.300 (>= 0.400 -> epic FAILURE -> C1
    revert; [0.300, 0.400) -> borderline registered, epic passes);
(d) >= 2/30 reach wave >= 13 (the E69 fleet band);
(e) 5-harness gate EXACT (re-pin ONLY with measured drift, I482 pattern).

### C1 (on (a) or (b) failure)

Revert L-A fully (config + code + FX + tests), accept-with-documentation,
residual to the E80+ backlog WITH the full measurement record. The epic then
closes at G79.0 as an accept-with-documentation round (E78 pattern).

## 7. Pin safety (pre-registered)

All five harness pins live at wave <= 2 (causal495 wave 2 / 36.15 s on
seed-9876; causal483 ~45 s demo window; playframe B frame 50 ~ wave 1;
playframe A MENU; pwa491 menu-only). The retirement path first fires at wave
8 start and draws ZERO RNG (no split, no score, no spawn) -> the pinned paths
are bit-identical -> EXPECTED EXACT, no re-pin.

## 8. dist policy (pre-registered)

- Current: 6,430,174 B / 203 (I568). Ceiling 7,400,000 B (KEEP, no
  renegotiation); tripwire 7,297,600 B.
- L-A estimate: +2-6 KB (one config key + ~10 lines core + ~6 lines FX; unit
  tests are not shipped). L-B: ~0-1 B (one number).
- CLOSE FLOOR E79 re-derived WITH MEASUREMENT at G79.0 (I573); floor
  >= 102,400 B; the AGENTS.md item-4 cut ladder applies per its own rule only
  if headroom drops below the floor (NOT expected).

## 9. Risks (registered)

- R-1 wall displacement: the next wall becomes the E69 fleet band (waves
  13-17 phantom/sweeper/beacon/hauler/bulwark density). Mitigated by
  acceptance (c) (no new dominant single source: < 0.300 pass,
  [0.300, 0.400) borderline-pass, >= 0.400 epic failure) and (d) (reach of
  wave >= 13 must INCREASE to >= 2/30, not merely exist). If a new
  >= 0.400 single-source wall appears, the frozen E70 protocol governs the
  NEXT epic (registered handoff, never a second fiddle in E79).
- R-2 retirement read as a difficulty buff: bounded by the 3-wave window -
  the boss is still fully killable in-window (kiter evidence: 7/10 at I525);
  what changes is only the stale tail.
- R-3 campaign bleed: L-A is mode-gated + unit-tested; no campaign pin exists
  in the 5-harness set (BAL-4 precedent: shared-config effects are
  documented, not reverted).
- R-4 Warden unreachability in endless (sec.3): a registered design
  consequence of the retirement rule (the 5th-wave Warden requires no live
  boss, which can no longer happen), not a failure mode.
- R-5 attribution: post-L-A, wave-10 bullet_unknown deaths from residual
  Monolith bolts should drop ~0; the attribution rules are frozen since
  I525/I564 and UNCHANGED by L-A.

## 10. Story map (frozen)

- ST-535 (I569) open + research + scope-check (this doc +
  production/scope-check-E79.md) - THIS STORY.
- ST-536 (I570) sweep569 pre-lever re-audit (rules569 frozen pre-run; expect
  the Branch C composite picture to reproduce).
- ST-537 (I571) L-A boss retirement WITH MEASUREMENT (config + game.js +
  render FX + unit tests + sweep571 + acceptance a-e + C1 path).
- ST-538 (I572) L-B conditional gunship hp 10 -> 8 (frozen trigger on
  sweep571; apply + sweep572, or VOID).
- ST-539 (I573) G79.0 close gate (5 fresh harnesses + dist re-measurement +
  CLOSE FLOOR E79 WITH MEASUREMENT + AGENTS.md refresh + E79 CLOSED + push
  delegate).

## 11. Changed files (I569, this story)

docs only: design/e79-composite-wall-fairness-research.md (NEW, this file) +
production/scope-check-E79.md (NEW) + epics.md + stories.md + iterations.md +
timeline.md + active.md + CHANGELOG.md. Zero src/assets/vendor/render/i18n.
No .evidence yet (the sweep569 evidence lands at I570).

## 12. Verification bar + next owner

Quality bar 6/6 (docs-only): npm test 1,237/1,237; npm run build 0; dist
byte-identical 6,430,174 B / 203; vendor 4/4 EXACT (A65DE049A7F38B40 /
7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017); BOM delta 0;
hygiene (zero servers/tabs). Next owner: I570 (ST-536) sweep569.