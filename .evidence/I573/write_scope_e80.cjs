const fs = require('fs');
const p = 'E:/Game/production/scope-check-E80.md';
if (fs.existsSync(p)) { console.error('ABORT: target exists'); process.exit(1); }
const doc = `# E80 scope check - Splicer Wave-10 Wall (frozen E70 lever [2]: splicer.maxHp 30 -> 24)

Opened I573 (ST-540). E79 closed (I572, G79.0 accept round) with the residual registration: "post-E79 live wall = the Splicer's OWN wave-10 fight (sweep571: wave-10 cluster 13/30, SPLICER 8/30, median death wave 10); the frozen E70 lever [2] (splicer.maxHp 30 -> 24) is the recorded E70-protocol candidate". E80 is that candidate, run as the minimal single-lever round of the frozen E70 protocol with the pre-registered single-boss adjudication extension (A*). Full research + code grounding: design/e80-splicer-wave10-wall-research.md (FROZEN at I573).

## Frozen bounds

- EXACTLY ONE lever, applied on ONE pass WITH MEASUREMENT on its own fresh 30-seed sweep; on-failure -> accept (C1). No second fiddle. No other levers exist in E80; anything else the sweeps surface is registered for E81+ (the R-1 pattern-lever registration, research sec. 9).
- Lever [2] (ST-542/I575) = splicer.maxHp 30 -> 24 - a difficulty KNOB (bounded wall HP, -20% TTK), NOT a fairness rule:
  - One-line config change (src/core/config.js:322, maxHp: 30 -> 24).
  - Blast radius (MEASURED derivation, boss.everyWave 5, hpStep 8, hpCap 72): w10 30 -> 24 / w20 38 -> 32 / w25 46 -> 40 / w30 54 -> 48 / w35 62 -> 56 / w40 70 -> 64 / w45+ capped at 72 both (unchanged). phase2 fraction-based (hpFrac 0.5) -> auto-scales.
  - Campaign isolation (MEASURED): every level boss is a CampaignBoss reading cfg.campaignBoss.hp[level] (campaignBoss.js:30); cfg.splicer is NEVER read on the campaign path -> the lever is structurally endless-only, zero campaign change (stronger than the BAL-4 pattern; no campaign note needed).
  - The pattern geometry stays FROZEN (spiralEvery 0.6 / boltSpeed 7.0 / armSpin 1.2 - measured-fair per I144; a pattern change would be a second lever - R-1 registration for E81+ only).
- The L-A boss-retirement mechanism stays NOT re-attempted (E79 residual: shown INERT on the current tree - RETIRES NONE 21/21, 0/23 Monoliths alive at wave-8 start; no-second-fiddle rule).

## Stories

- ST-540 (I573) - DONE I573: open + research + this scope-check + bookkeeping (docs-only).
- ST-541 (I574) - PENDING: sweep573 pre-lever re-audit - 30 FRESH seeds 57300+i, full director from wave 1, frozen I328 kiter VERBATIM (as carried in .evidence/I570/sweep569.mjs), cap 36000 ticks @ 1/60; rules573.md FROZEN PRE-RUN in .evidence/I574/ (clone of the .evidence/I570/rules569.md lineage, E80 labels); thresholds verbatim from rules564: H = MONOLITH + SPLICER + WARDEN share, W10/W5 = wave-10/wave-5 cluster /30. Role: independent fresh confirmation of the post-E79 wall + the frozen adjudication B/A*/C (research sec. 6).
- ST-542 (I575) - PENDING: CONDITIONAL per the frozen adjudication: (B) H >= 0.600 AND SPLICER largest, OR (A*) 0.400 < H < 0.600 AND SPLICER largest AND W10 >= W5 -> lever [2] one line + sweep574 (30 fresh seeds 57400+i) + acceptance (a)-(e); (C) otherwise -> ST-542 VOID (E78-lever pattern). C1 on acceptance failure (one-line revert + accept + R-1 registration).
- ST-543 (I576) - PENDING: G80.0 close gate (CLOSEGATE576, clone of the .evidence/I572/run_closegate572.cjs pattern).

## Lever acceptance (frozen, evaluated on fresh sweep574)

- (a) median death wave >= 11 (baselines 9-10);
- (b) wave-10 cluster (deaths on wave 10) <= 9/30 (baselines 16/13/11 - sweep569/571/567);
- (c) SPLICER share < 0.250 (baselines 0.467/0.300/0.267/0.167) - [0.250, 0.300) borderline pass (registered), >= 0.300 FAIL (pattern-driven wall, R-1) -> C1;
- (d) >= 3/30 reach wave >= 13 (best historical: sweep569 3/30);
- (e) 5-harness gate EXACT (re-pin ONLY with measured drift, I482 pattern).

## Cut ladder

- C1 (on (a) or (b) failure, or (c) >= 0.300): git restore src/core/config.js (one line) + accept-with-documentation + the residual to the E81+ backlog WITH the full measurement record + the R-1 pattern-lever registration [P1 spiralEvery 0.6 -> 0.65 / P2 boltSpeed 7.0 -> 6.0 / P3 armSpin 1.2 -> 1.0 - ONE chosen by that epic's own frozen rules] + close G80.0 as an accept round (E78/E79 pattern).
- Branch-C VOID path: no code change; the adjudication measurement is recorded (E78-lever pattern).
- (c) in [0.250, 0.300): borderline registered, epic passes.
- The AGENTS.md item-4 dist cut ladder is separate and governed by the headroom floor (>= 102,400 B; NOT expected).

## Tripwires

- dist: pre-E80 6,430,174 B / 203 (I572). Lever est. 0 B (2-char literal swap; comments not shipped - EXPECTED byte-identical). Ceiling 7,400,000 B (KEEP, no renegotiation); tripwire 7,297,600 B. CLOSE FLOOR E80 re-derived WITH MEASUREMENT at G80.0 (I576); headroom floor >= 102,400 B.
- 5-harness gate (causal495 / causal483 / playframe483+491 / pwa491): EXACT on the src-touching story (I575 if the lever applies) + all five fresh at the I576 close gate; re-pin ONLY with measured drift (I482 pattern).
- Pin safety (pre-registered): all five harness pins live at wave <= 2 (causal495 wave 2 on seed-9876; causal483 ~45 s demo window; playframe A MENU / B ~wave 1; pwa491 menu-only); the endless Splicer first spawns at wave 10; HP is a constructor argument (splicer.js:23) and the bolt schedule is time-driven -> ZERO extra RNG on any pinned path -> EXPECTED EXACT, no re-pin.
- Vendor pins r187 unchanged (no vendor change this epic).

## DoD (G80.0, I576)

1. Five fresh harnesses EXACT (re-pin only with measured drift).
2. dist re-measured + CLOSE FLOOR E80 = 7,400,000 - dist WITH MEASUREMENT; headroom >= 102,400 B floor.
3. AGENTS.md item-4 refreshed (dist chain segment for I575 as applicable + CLOSE FLOOR E80 line; E79 line demoted to prior per house pattern) + E80 CLOSED + residual registration (post-lever wall state; if the C1 path fires, the R-1 pattern-lever registration is the E81+ handoff) + quality bar 6/6 on every story.
`;
let text = doc.split(/\r?\n/).join('\r\n').replace(/^\r?\n/, '').replace(/\s+$/, '') + '\r\n';
if (/[^\x00-\x7F]/.test(text)) { console.error('ABORT: non-ASCII char found'); process.exit(1); }
const body = Buffer.from(text, 'ascii');
const buf = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), body]);
fs.writeFileSync(p, buf);
console.log('WROTE', p, buf.length, 'bytes,', text.split('\r\n').length - 1, 'lines, CRLF, BOM=1');
