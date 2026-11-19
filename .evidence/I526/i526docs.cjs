const fs = require('fs');
const G = (p) => fs.readFileSync('E:/Game/' + p);
function head16(p) { return G(p).slice(0, 16).toString('hex'); }
function rep1(p, anchor, repl, label) {
  const b = G(p);
  const t = b.toString('latin1');
  const n = t.split(anchor).length - 1;
  if (n !== 1) throw new Error(label + ': anchor count ' + n + ' != 1: ' + anchor.slice(0, 70));
  const out = t.replace(anchor, repl);
  fs.writeFileSync(p, Buffer.from(out, 'latin1'));
  console.log(label + ' OK ' + b.length + ' -> ' + Buffer.byteLength(out, 'latin1'));
}
const headE = head16('production/epics.md'), headS = head16('production/stories.md'), headC = head16('CHANGELOG.md');
// 1. epics.md
rep1('production/epics.md',
  'ST-492 R7 lever WITH MEASUREMENT (branch from ST-491 data: B dominant-heavyweight lever from the frozen ordered list / A smallest pressure lever from the frozen candidates / C accept-with-documentation; fresh sweep -> R7 >= 6/10 + R8 recompute).',
  'ST-492 (I526) R7 lever WITH MEASUREMENT - DONE I526 (BRANCH C evaluated on the I525 data: H=4/10 < 6/10 AND max non-heavyweight gunship 2/10 < 4/10 -> accept-with-documentation, NO lever; R7/R8 residuals stay OPEN as documented known limitations; future-episode inputs recorded - research doc sec.12, docs-only).',
  'epics.STORIES');
rep1('production/epics.md',
  'Next: I526 = ST-492 (Branch C - accept-with-documentation, NO lever: record the documented acceptance + residual in the E70 research docs).',
  'ST-492 DONE I526 (Branch C accept-with-documentation - NO lever; documented acceptance + R7/R8 residual disposition + future-episode inputs in the E70 research doc sec.12; docs-only zero src). Next: I527 = ST-493 (G70.0 close gate - fresh 5-harness re-runs ALL EXPECTED EXACT + CLOSE FLOOR re-derived WITH MEASUREMENT + quality bar + bookkeeping + commit/push).',
  'epics.TAIL');
if (head16('production/epics.md') !== headE) throw new Error('epics head16 changed');
// 2. stories.md
rep1('production/stories.md',
  'STATUS (I525):',
  'STATUS (I526): ST-492 DONE (I526) - E70 IN PROGRESS: Branch C evaluated on the I525 ST-491 data (deterministic frozen branch rules): H = 4/10 heavyweight (MONOLITH 3 incl. 1 residual-bolt unknown / SPLICER 1 / WARDEN 0) < 6/10 AND max non-heavyweight = gunship 2/10 < 4/10 -> BRANCH C accept-with-documentation, NO lever applied (no config/src change); documented in design/e70-balance-followup-research.md sec.12 (22,930 -> 26,051 B, pure ASCII LF): 12.1 branch evaluation WITH MEASUREMENT (10/10 died median wave 9, all hits=3; tally primary==strict, 0 monolithProbable rocks); 12.2 what the data shows (diffuse 7-class kill distribution; wave-5 Monolith = window problem - kiter killed it 7/10, 4/10 still died on wave 5 from its bolts; no run clears wave 8+; pre-E69 band waves 5-12 = the resource wall); 12.3 residual disposition - R7 (0/10 wave-20) stays OPEN as documented known limitation (median death wave 9; no frozen lever reaches it, all four E69-only; global difficulty knob = instrument change, pilot trio frozen I328), R8 stays OPEN as consequence of R7; the 15 I525 payload tags remain permanent telemetry; future-episode inputs recorded (gunship 2/10 largest non-heavyweight cluster; Monolith post-kill bolt window; pre-E69 density band); quality bar docs-only measured: 1,187/1,187 + build 0 + dist byte-identical 5,255,258 B/184 + vendor UNCHANGED + BOM delta 0 + hygiene (no servers, no tabs).\r\nSTATUS (I525):',
  'stories.STATUS');
if (head16('production/stories.md') !== headS) throw new Error('stories head16 changed');
// 3. iterations.md
{
  const p = 'production/iterations.md';
  const b = G(p);
  const t = b.toString('latin1');
  if (!t.endsWith('\n')) throw new Error('iterations: no trailing NL');
  const entry = '\n## I526 - ST-492: R7 lever WITH MEASUREMENT - BRANCH C (accept-with-documentation, NO lever)\n- R1 Branch evaluation (deterministic, on the frozen I525 ST-491 data, .evidence/I525/sweep525.json): H = 4/10 heavyweight (MONOLITH 3 incl. 1 residual-bolt bullet_unknown / SPLICER 1 / WARDEN 0) < 6/10 -> Branch B NOT met; max non-heavyweight = gunship 2/10 < 4/10 -> Branch A NOT met; -> BRANCH C accept-with-documentation. No lever applied, no config change, no src change.\n- R2 Documented acceptance (design/e70-balance-followup-research.md sec.12, 22,930 -> 26,051 B, pure ASCII LF no-BOM, single append with head asserts, .evidence/I526/append12.cjs): 12.1 branch evaluation WITH MEASUREMENT (10/10 died, median death wave 9, all runs hits=3; killing-blow tally primary==strict, 0 monolithProbable rocks: MONOLITH 3, SPLICER 1, gunship 2, rock_S 1, rock_L 1, sentry 1, bullet_unknown 1); 12.2 what the data shows (diffuse 7-class kill distribution - no single lever target in the majority; wave-5 Monolith = window problem, kiter killed it 7/10 runs yet 4/10 still died on wave 5 from its bolts; no run cleared wave 8+; the pre-E69 pressure band waves 5-12 is where resources run out); 12.3 residual disposition - R7 (0/10 wave-20) stays OPEN as a documented known limitation (I525 reconfirms median death wave 9; no frozen lever can reach it - all four E69-only; a global difficulty knob = instrument change, the pilot trio is frozen I328, out of E70 scope), R8 stays OPEN as a direct consequence of R7; the 15 I525 payload tags remain permanent telemetry; future-episode inputs recorded (gunship 2/10 largest non-heavyweight cluster - unique 0.5 radius bolt; Monolith post-kill bolt window; pre-E69 density band); 12.4 verification (docs-only, measured).\n- R3 Quality bar (docs-only, measured): 1,187/1,187 + build exit 0 + dist byte-identical 5,255,258 B/184 (src unchanged since I525) + dist-min vendor pins EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + git diff vendor/ empty (0 B) + BOM delta 0 + hygiene (no servers, no tabs).\n- Next: I527 = ST-493 (G70.0 close gate - fresh 5-harness re-runs ALL EXPECTED EXACT + CLOSE FLOOR re-derived WITH MEASUREMENT + quality bar + bookkeeping + commit/push; E70 closes 5/5).\n';
  fs.writeFileSync(p, Buffer.concat([b, Buffer.from(entry, 'latin1')]));
  console.log('iterations.APPEND OK ' + b.length + ' -> ' + (b.length + Buffer.byteLength(entry, 'latin1')));
}
// 4. timeline.md
{
  const p = 'production/timeline.md';
  const b = G(p);
  const t = b.toString('latin1');
  if (!t.endsWith('\n')) throw new Error('timeline: no trailing NL');
  const line = '- 2026-11-20  I526 (ST-492: R7 lever WITH MEASUREMENT - BRANCH C accept-with-documentation, NO lever: H=4/10 < 6/10 AND max non-heavyweight gunship 2/10 < 4/10 on the frozen I525 data -> accept; documented in design/e70-balance-followup-research.md sec.12 (22,930->26,051 B) - branch evaluation WITH MEASUREMENT + diffuse 7-class distribution + wave-5 Monolith = window problem (kiter killed it 7/10) + R7/R8 stay OPEN as documented known limitations + future-episode inputs (gunship cluster / Monolith post-kill bolt window / pre-E69 density band); docs-only: 1,187 tests + build 0 + dist byte-identical 5,255,258 B/184 + vendor UNCHANGED + BOM delta 0. Next: I527 = ST-493 (G70.0 close gate).)\n';
  fs.writeFileSync(p, Buffer.concat([b, Buffer.from(line, 'latin1')]));
  console.log('timeline.APPEND OK ' + b.length + ' -> ' + (b.length + Buffer.byteLength(line, 'latin1')));
}
// 5. CHANGELOG.md
rep1('CHANGELOG.md',
  '## [Unreleased]\r\n- I525:',
  '## [Unreleased]\r\n- I526: ST-492 E70 - R7 lever WITH MEASUREMENT resolved as BRANCH C (accept-with-documentation, NO lever) - deterministic branch rules on the I525 ST-491 data: H = 4/10 heavyweight (MONOLITH 3 incl. 1 residual-bolt unknown, SPLICER 1, WARDEN 0) < 6/10 AND max non-heavyweight = gunship 2/10 < 4/10; documented acceptance in design/e70-balance-followup-research.md sec.12 (22,930 -> 26,051 B, pure ASCII LF): branch evaluation WITH MEASUREMENT + what the data shows (diffuse 7-class kill distribution; wave-5 Monolith = window problem - the kiter killed it 7/10 runs yet 4/10 still died on wave 5 from its bolts; no run cleared wave 8+; pre-E69 band waves 5-12 = the resource wall) + residual disposition (R7 0/10 wave-20 stays OPEN as documented known limitation - median death wave 9, no frozen lever reaches it, global knob = instrument change out of scope; R8 stays OPEN as consequence of R7) + future-episode inputs (gunship 2/10 largest non-heavyweight cluster; Monolith post-kill bolt window; pre-E69 density band); the 15 I525 payload tags remain permanent telemetry; docs-only quality bar measured: 1,187/1,187 + build 0 + dist byte-identical 5,255,258 B/184 + vendor UNCHANGED + BOM delta 0\r\n- I525:',
  'changelog.INSERT');
if (head16('CHANGELOG.md') !== headC) throw new Error('changelog head16 changed');
// 6. active.md
rep1('production/session-state/active.md',
  'Committed (this story) + push pending.',
  'Committed 093b7c3 + PUSHED-OK (c194cd4..093b7c3).',
  'active.FINALIZE-I525');
{
  const p = 'production/session-state/active.md';
  const b = G(p);
  const t = b.toString('latin1');
  const note = '- notes: I526 done (ST-492 E70 - R7 lever WITH MEASUREMENT, BRANCH C): deterministic branch evaluation on the frozen I525 data - H=4/10 < 6/10 (B unmet) AND max non-heavyweight gunship 2/10 < 4/10 (A unmet) -> accept-with-documentation, NO lever (no config/src change); design/e70-balance-followup-research.md sec.12 appended (22,930->26,051 B, pure ASCII LF, .evidence/I526/append12.cjs): 12.1 evaluation WITH MEASUREMENT, 12.2 what the data shows (diffuse 7-class distribution; wave-5 Monolith window problem - kiter killed 7/10; no run clears wave 8+; pre-E69 band = resource wall), 12.3 residual disposition (R7/R8 stay OPEN as documented known limitations; 15 payload tags = permanent telemetry; future-episode inputs: gunship cluster / Monolith post-kill bolt window / pre-E69 density band), 12.4 verification; quality bar docs-only measured: 1,187/1,187 + build 0 + dist byte-identical 5,255,258 B/184 + vendor UNCHANGED + BOM delta 0 + hygiene (no servers, no tabs). Committed (this story) + push pending. Next: I527 = ST-493 (G70.0 close gate - fresh 5-harness re-runs ALL EXPECTED EXACT + CLOSE FLOOR re-derived WITH MEASUREMENT; E70 closes 5/5).\n';
  let base = t;
  if (!base.endsWith('\n')) base += '\n';
  fs.writeFileSync(p, Buffer.from(base + note, 'latin1'));
  console.log('active.APPEND-I526 OK ' + b.length + ' -> ' + Buffer.byteLength(base + note, 'latin1'));
}
console.log('BOOKKEEPING I526 DONE');