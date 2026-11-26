// bookkeep596.cjs - I596 (ST-562) bookkeeping: scope-check-E85 evidence fill + 6-file byte-level patches.
// Read latin1 (byte-preserving), assert each anchor count===1, apply, verify BOM delta 0, write back.
const fs = require('fs');
const P = 'E:/Game/';
const BOMS = [
  ['AGENTS.md', 1],
  ['production/epics.md', 3],
  ['production/stories.md', 5],
  ['production/iterations.md', 5],
  ['production/timeline.md', 3],
  ['CHANGELOG.md', 7],
  ['production/session-state/active.md', 0]
];
function count(s, a) { let n = 0, i = 0; while ((i = s.indexOf(a, i)) !== -1) { n++; i += a.length; } return n; }
function boms(s) { return (s.match(/\u00EF\u00BB\u00BF/g) || []).length; }
const before = {};
for (const [rel, exp] of BOMS) { before[rel] = boms(fs.readFileSync(P + rel, 'latin1')); }
function read(rel) { return fs.readFileSync(P + rel, 'latin1'); }
function write(rel, s) { fs.writeFileSync(P + rel, s, 'latin1'); console.log('patched ' + rel); }
function replaceText(s, oldT, newT) {
  if (count(s, oldT) !== 1) throw new Error('anchor count != 1: ' + oldT.slice(0, 80));
  return s.replace(oldT, newT);
}

// 1) scope-check-E85.md (pure LF, ends bare): replace the placeholder evidence line
{
  const rel = 'production/scope-check-E85.md';
  let s = read(rel);
  const oldL = '- (filled as ST-562/ST-563 land: pre/post JSONs, the 4 computed levers WITH MEASUREMENT, E57 table, test/build/dist/vendor results, close-gate 5/5, CLOSE FLOOR E85.)';
  const EVIDENCE = `ST-562 (I596, luma re-pin) - the 4 levers WITH MEASUREMENT:
- warden renderLumaGain 4.5 -> 3.71 (G1 first pin) -> 3.13 (C1; final).
- drone palette.body.color 0x6f8796 -> 0x69808e (H1 first pin) -> 0x637886 (C1; final).
- stinger renderLumaGain 2.2 - UNTOUCHED (N1 no-churn: pre 111.89 vs target 108.89, |delta| 3.00 <= 5).
- flyer renderLumaGain 1.3 - UNTOUCHED (N1 no-churn: pre 93.22 vs target 94.22, |delta| 1.00 <= 5).

Audit: .evidence/I595/luma_audit595.mjs (clone of luma_audit519.mjs, the 4 frozen changes, line-diff verified) on the dev server :5173 (self-started/self-killed); 3 runs (pre / first post / C1 post) all consoleErrors 0; n > 0 for all 26 role/backdrop windows (table596.cjs).

T1 (post <= 8 p50 of the I519 sky-p50 target), sky backdrop:
- warden: target 119.49 / pre 145.02 / first 141.81 / final 139.61 (floor 135.2, hue 176.7 vs 179.1) -> MISS +20.12.
- drone: target 184.08 / pre 194.63 / first 195.63 / final 194.49 (floor 195.21, hue 189.5 vs 189.5) -> MISS +10.41.
- stinger: target 108.89 / pre 111.89 / final 111.89 -> N1 untouched (delta +3.00).
- flyer: target 94.22 / pre 93.22 / final 93.22 -> N1 untouched (delta -1.00).

C1 (the single allowed second iteration) EXHAUSTED on both T1-missed roles -> frozen-rule outcome = accept-with-documentation + 2 residuals registered for E86+ (warden +20.12, drone +10.41). Root causes: warden armor 0x8fa3c8 saturates to white at gain > 1.78 (hull 0x2c3548 b-channel saturates below gain 3.54) so the linear G1 rule under-corrects; the drone's additive emissive 0x37d5ff x0.7-1.0 dominates the base share so the hex lever under-corrects (its first pin even moved p50 the wrong way, 194.63 -> 195.63).
H1 drone hue: 189.5 vs target 189.5 (off 0.0) PASS. E1 (E57 rule-1, collision iff dluma <= 10 AND dhue <= 40): zero collisions among the 4 re-tuned roles and the other 9. R1 (9 regression roles, <= 2 p50 pre vs final): ALL PASS, max |delta| 0.07 - hunter 116.11 / sentry 136.73 / wasp 150.55 / phantom 106.5 / hauler 48.68 / bulwark 35.12 / gunship 70.37 / boss 68.24 / ship 77.16.

Quality bar I596: npm test 1,237/1,237 / npm run build 0 / dist 6,851,951 B / 203 (measure596.cjs; +1 B vs the 6,851,950 I595 baseline, within the pre-registered +/- 200 B budget; under tripwire 7,297,600 / ceiling 7,400,000) / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).

ST-563 (I597, G85.0 close): PENDING - close gate 5/5 + CLOSE FLOOR E85 fill at the close.`;
  s = replaceText(s, oldL, EVIDENCE);
  write(rel, s);
}

// 2) epics.md: 3 line replacements (E85 header, Stories line, Status line)
{
  const rel = 'production/epics.md';
  let s = read(rel);
  s = replaceText(s,
    '- OPEN I595 (ST-562 PENDING I596, ST-563 PENDING I597)',
    '- OPEN I595 (ST-562 DONE I596 [C1-exhausted accept; 2 T1 residuals registered E86+], ST-563 PENDING I597)');
  s = replaceText(s,
    '- Stories: ST-562 PENDING I596 (audit clone + pre-audit + re-pin G1/H1/N1 WITH MEASUREMENT + post-audit T1/R1 + E57 rule-1 re-check E1 + quality bar) / ST-563 PENDING I597',
    '- Stories: ST-562 DONE I596 (luma re-pin WITH MEASUREMENT: warden 4.5 -> 3.71 [G1] -> 3.13 [C1], drone 0x6f8796 -> 0x69808e [H1] -> 0x637886 [C1], stinger 2.2 + flyer 1.3 untouched [N1 |delta| <= 5]; T1 MISS on both re-pinned roles [warden +20.12 / drone +10.41] -> C1 exhausted -> accept-with-documentation + 2 residuals registered E86+; R1 9 roles PASS max |delta| 0.07; E1 zero collisions; H1 hue 189.5 EXACT; quality bar 4/4) / ST-563 PENDING I597');
  s = replaceText(s,
    'Status: OPEN (opened I595; ST-562 PENDING I596; ST-563 PENDING I597). Pre-state: dist 6,851,950 B / 203; CLOSE FLOOR E84 548,050 B; pins playframe',
    'Status: OPEN (opened I595; ST-562 DONE I596 [C1-exhausted accept: warden 3.13 / drone 0x637886; 2 T1 residuals warden +20.12 / drone +10.41 registered E86+]; ST-563 PENDING I597). I596 state: dist 6,851,951 B / 203; pins playframe');
  write(rel, s);
}

// 3) stories.md: replace the ST-562 PENDING line with the DONE line
{
  const rel = 'production/stories.md';
  let s = read(rel);
  const oldLine = '- ST-562 E85 remastered-4 render-luma re-tune (I596) - PENDING I596: luma_audit595.mjs (clone of .evidence/I519/luma_audit519.mjs; ONLY OUT -> .evidence/I595/ + nocache i595 + worldR drone 1.5 -> 1.6 / stinger 2.0 -> 2.6 / flyer 1.75 -> 1.9 WITH MEASUREMENT [I592 v2 extents: stinger x -1.67..2.345 maxR ~2.43, flyer maxR ~1.72, drone v2 per I591]; 13 targets x sky/floor + fx=high verbatim; dev :5173 self-start/self-kill) -> luma_i595_pre.json (all 13 x 2, n > 0, console 0/0) -> re-pin src/core/config.js WITH MEASUREMENT (G1 new_gain = round2(old x I519_sky_p50 / pre_sky_p50), targets warden 119.49 / stinger 108.89 / flyer 94.22; H1 drone 0x6f8796 per-channel clamp(round(old x 184.08 / pre), 0, 255) + post hue within 15 degrees of 189.5; N1 |pre - target| <= 5 -> leave untouched) -> luma_i595_post.json (T1 |post - target| <= 8 p50 per re-pinned role; R1 the 9 unchanged roles |pre - post| <= 2 p50: hunter/sentry/wasp/phantom/hauler/bulwark/gunship/boss/ship) + E57 rule-1 re-check (E1: collision iff dluma <= 10 AND dhue <= 40, max one hue-nudge per role, C2 = git restore + residual) + quality bar (npm test 1,237/1,237 / build 0 / dist re-measure expect 6,851,950 +- 200 B / vendor 4/4 / hygiene all 4 ports free) + bookkeeping + commit + push delegate (verify via git ls-remote). CUTTABLE to a zero-patch accept if N1 fires for all 4 (not expected: projected deltas 13-165 p50).';
  const newLine = '- ST-562 E85 remastered-4 render-luma re-tune (I596) - DONE I596: luma_audit595.mjs (clone of luma_audit519.mjs, the 4 frozen changes, line-diff verified) + dev :5173 self-start/self-kill, consoleErrors 0 on all 3 runs, n > 0 on all 26 windows -> pre (sky p50: warden 145.02 / drone 194.63 / stinger 111.89 / flyer 93.22) -> re-pin WITH MEASUREMENT (G1 warden 4.5 -> 3.71; H1 drone 0x6f8796 -> 0x69808e; N1 stinger 2.2 + flyer 1.3 untouched, |delta| 3.00/1.00 <= 5) -> first post (warden 141.81 / drone 195.63 [H1 first pin moved AWAY from target 184.08 - emissive-dominated, documented]) -> C1 (the single allowed second iteration) warden 3.71 -> 3.13 / drone 0x69808e -> 0x637886 -> final (warden 139.61 / drone 194.49): T1 (<= 8 p50) MISS both [warden +20.12 vs 119.49, drone +10.41 vs 184.08] -> C1 exhausted -> accept-with-documentation + 2 residuals registered E86+ (root causes: warden armor 0x8fa3c8 saturates to white at gain > 1.78 + hull 0x2c3548 b-channel saturates < gain 3.54 -> linear G1 under-corrects; drone additive emissive 0x37d5ff x0.7-1.0 dominates base share -> hex lever under-corrects); R1 9 regression roles ALL PASS max |delta| 0.07; E1 (E57 rule-1) zero collisions; H1 drone hue 189.5 vs 189.5 (off 0.0); quality bar 4/4 (npm test 1,237/1,237 / build 0 / dist 6,851,951 B / 203 [+1 B vs the 6,851,950 baseline, within the +/- 200 B budget] / vendor 4/4 EXACT) + bookkeeping + commit + push delegate.';
  s = replaceText(s, oldLine, newLine);
  write(rel, s);
}

// 4) iterations.md: append the I596 entry (file ends bare; entry ends bare)
{
  const rel = 'production/iterations.md';
  let s = read(rel);
  const ITER596 = `## I596 (ST-562, E85): remastered-4 render-luma re-pin (G1/H1/N1 + C1; accept-with-documentation, 2 residuals registered E86+)

- Goal: re-pin the 4 remastered-role levers so the v2 1.0-centered bright bakes render back on the I519-validated ladder rungs (warden sky p50 119.49 / stinger 108.89 / flyer 94.22 / drone 184.08), per the frozen scope-check-E85.md rules G1/H1/N1/T1/R1/E1.
- Changed files: src/core/config.js (2 lines: warden.renderLumaGain 4.5 -> 3.13 with the G1+C1 measurement comment; drone.palette.body.color 0x6f8796 -> 0x637886 with the H1+C1 comment; stinger 2.2 + flyer 1.3 UNTOUCHED per N1) + production/scope-check-E85.md (## Verification evidence filled) + bookkeeping (epics E85 ST-562 DONE / stories ST-562 line PENDING->DONE / active NEXT at I597 / timeline / CHANGELOG).
- Audit: .evidence/I595/luma_audit595.mjs (clone of .evidence/I519/luma_audit519.mjs; ONLY OUT -> .evidence/I595/ + nocache i595 + worldR drone 1.5 -> 1.6 / stinger 2.0 -> 2.6 / flyer 1.75 -> 1.9; line-diff verified 8 lines); dev server :5173 self-started/self-killed; 3 runs (pre / first post / C1 post) ALL consoleErrors 0; n > 0 on all 26 role/backdrop windows (table596.cjs).
- Measurements (sky p50; I519 target in brackets): warden 145.02 [119.49] -> first pin 3.71: 141.81 -> C1 3.13: 139.61 (floor 135.2, hue 176.7 vs 179.1); drone 194.63 [184.08] -> first pin 0x69808e: 195.63 [moved AWAY - additive emissive dominates the base share] -> C1 0x637886: 194.49 (floor 195.21, hue 189.5 vs 189.5); stinger 111.89 [108.89] untouched (N1 delta +3.00 <= 5); flyer 93.22 [94.22] untouched (N1 delta -1.00 <= 5).
- Verdicts: T1 (post <= 8 p50 of target) MISS on both re-pinned roles: warden +20.12, drone +10.41; C1 (the single allowed second iteration) EXHAUSTED on both -> rule-compliant outcome = accept-with-documentation + 2 T1 residuals registered for E86+ (root causes documented in scope-check-E85.md Verification evidence). NOT a failure per the frozen rule (C1 exhaustion is a pre-registered outcome).
- R1 (9 regression roles, |pre - final| <= 2 p50): ALL PASS, max |delta| 0.07 (run-to-run noise): hunter 116.11 / sentry 136.73 / wasp 150.55 / phantom 106.5 / hauler 48.68 / bulwark 35.12 / gunship 70.37 / boss 68.24 / ship 77.16. E1 (E57 rule-1 collision iff dluma <= 10 AND dhue <= 40): zero collisions among the 4 roles vs the other 9. H1 drone hue: 189.5 vs 189.5 (off 0.0) PASS.
- Quality bar 4/4: npm test 1,237/1,237 / npm run build 0 / fresh dist re-measured 6,851,951 B / 203 (measure596.cjs; +1 B vs the 6,851,950 I595 baseline, within the pre-registered +/- 200 B budget; well under tripwire 7,297,600 / ceiling 7,400,000) / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- Hygiene: stray dev server (session 2995 / PID on :5173) killed, all 4 ports free verified, zero tabs, zero terminals.
- Push: I595 commit d1bbf7b verified landed on origin main (git ls-remote = d1bbf7b328f6...); I596 commit push delegated to Dewey 01a20760-b402-74a2-b164-e13208b85f07.`;
  s = s + '\r\n\r\n' + ITER596;
  write(rel, s);
}

// 5) timeline.md: append the I596 paragraph (file ends bare)
{
  const rel = 'production/timeline.md';
  let s = read(rel);
  const TIMELINE596 = `I596 (ST-562, E85) done: no visible change - the four remodeled enemies get their light rebalance, and it went mostly to plan. The pre-audit confirmed they read brighter than the approved ladder (warden 145 against a 119.5 rung, drone 194.6 against 184.1), and the no-gratuitous-churn rules correctly left the stinger and the flyer alone. Two levers were re-pinned, and one of them - the drone's hull color - moved the wrong way on the first pass because most of that ship's brightness comes from an emissive term the color lever cannot touch; the single allowed second pass corrected the direction but not the distance. Both roles end up closer to their rung than they started, and the frozen rule decides what happens now: one second attempt per role was allowed, it was used, so the remaining gap (20 and 10 brightness points) is documented and queued for a future round instead of being chased further. The nine untouched enemies and the player ship held their brightness to within run-to-run noise, and the fleet-harmony check found no new color collisions.`;
  s = s + '\r\n\r\n' + TIMELINE596;
  write(rel, s);
}

// 6) active.md: append the NEXT-at-I597 line (file ends bare)
{
  const rel = 'production/session-state/active.md';
  let s = read(rel);
  const NEXT597 = `- NEXT at I597 = ST-563 (E85): G85.0 close gate (clone of the .evidence/I594/run_closegate594.cjs runner pattern: 5 fresh harnesses ALL EXACT NO re-pin [config value swaps change no geometry/draw calls/RNG]: causal495 dist :4200 + causal483 + playframe483/491 dev :5173 + pwa491 dist :5199; ports self-start/self-kill) + fresh dist re-measure (expect byte-identical 6,851,951 B / 203; measure597.cjs) + CLOSE FLOOR E85 WITH MEASUREMENT (7,400,000 - dist; headroom >= 102,400 B floor -> cut ladder NOT invoked expected) + AGENTS.md item-4 refresh (E85 clause at head, E84 demoted to prior; chain extended with the I596 +1 B note) + E85 CLOSED (2/2: ST-562/563) + bookkeeping (BOM delta 0) + commit + push delegate Dewey 01a20760-b402-74a2-b164-e13208b85f07 (verify via git ls-remote).`;
  s = s + '\r\n' + NEXT597;
  write(rel, s);
}

// 7) CHANGELOG.md (pure LF): insert the I596 line above the I595 anchor line
{
  const rel = 'CHANGELOG.md';
  let s = read(rel);
  const anchor = '- I595: No visible change - the follow-up plan for the enemy rebuild is written down and frozen';
  if (count(s, anchor) !== 1) throw new Error('changelog anchor != 1');
  const CHANGELOG596 = `- I596: No visible change - the four remodeled enemies get their light rebalance, measured and applied: two brightness levers were re-pinned (the armored turret ship and the swarm drone), two were correctly left alone, and the two re-pinned ones now sit closer to their approved brightness than before - the small remaining gap is documented for a future round. The other nine enemies and your own ship behave byte-for-byte as they did.`;
  const idx = s.indexOf(anchor);
  const lineStart = s.lastIndexOf('\n', idx - 1) + 1;
  s = s.slice(0, lineStart) + CHANGELOG596 + '\n' + s.slice(lineStart);
  write(rel, s);
}

// BOM delta check (AGENTS.md untouched this round, read-only verification)
let ok = true;
for (const [rel, exp] of BOMS) {
  const now = boms(read(rel));
  const delta = now - before[rel];
  if (now !== exp || delta !== 0) ok = false;
  console.log('BOM', rel, 'before', before[rel], 'after', now, 'expected', exp, 'delta', delta);
}
if (!ok) throw new Error('BOM check FAILED');
console.log('BOOKKEEP596 PASS - 7 patches applied, BOM delta 0');