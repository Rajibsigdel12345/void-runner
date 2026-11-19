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
// 1. epics.md (2 single-anchor replaces: story line + status/tail)
rep1('production/epics.md',
  'ST-491 R7 diagnosis harness (ship-hit source payload tag, no logic/RNG change; 10-seed sweep 52700+i full wave-1 director cap 36000 ticks; killing-blow histogram + per-wave deaths + resource state).',
  'ST-491 (I525) R7 diagnosis harness - DONE I525 (15 payload-only source tags shipped in src/core/game.js, CRLF preserved +381 B zero logic change; 10-seed sweep 52700+i WITH MEASUREMENT: 10/10 died median wave 9, H=4/10 heavyweight MONOLITH 3/SPLICER 1, gunship 2/10 max non-heavyweight; BRANCH C accept-with-documentation; R-wave20 residual documented as known limitation).',
  'epics.STORIES');
rep1('production/epics.md',
  'Next: I525 = ST-491 (R7 diagnosis harness - ship-hit source payload tag, payload-only no logic/RNG change; 10 seeds 52700+i, full wave-1 director, cap 36000 ticks; branches B/A/C).',
  'ST-491 DONE I525 (R7 diagnosed WITH MEASUREMENT - 10/10 died median wave 9; H=4/10 heavyweight [MONOLITH 3 incl 1 residual-bolt unknown, SPLICER 1, WARDEN 0]; gunship 2/10 max non-heavyweight; primary==strict, 0 monolithProbable rocks; BRANCH C accept-with-documentation; 15 source tags = permanent telemetry; R-wave20 residual OPEN as known limitation). Next: I526 = ST-492 (Branch C - accept-with-documentation, NO lever: record the documented acceptance + residual in the E70 research docs).',
  'epics.TAIL');
if (head16('production/epics.md') !== headE) throw new Error('epics head16 changed');
// 2. stories.md (insert STATUS (I525) before STATUS (I524), CRLF)
rep1('production/stories.md',
  'STATUS (I524):',
  'STATUS (I525): ST-491 DONE (I525) - E70 IN PROGRESS: R7 killing-blow diagnosis WITH MEASUREMENT (15 payload-only \'hit\' source tags in src/core/game.js - CRLF 1669/1669 preserved, 86,750->87,131 B +381 B, zero logic/RNG/config change; 10-seed full-director kiter sweep 52700+i cap 36000 ticks, deterministic node-only ~7 s): 10/10 died, median death wave 9, all hits=3; TALLY (primary == strict, ZERO monolithProbable rocks): MONOLITH 3 (incl. 1 residual-bolt bullet_unknown, correctly unknown per the frozen "boss alive at hit" rule - Monolith died 12 ticks earlier), SPLICER 1, gunship 2, rock_S 1, rock_L 1, sentry 1, bullet_unknown 1; H = 4/10 heavyweight -> BRANCH C accept-with-documentation (B threshold H>=6/10 unmet; A threshold max non-heavyweight>=4/10 unmet - gunship 2/10); findings: wave-5 Monolith = window problem (the kiter killed it in 7/10 runs, its bolts still kill), no run cleared wave 8+, E70 R-wave20 residual (wave-20 reach >=6/10) documented as known limitation - consistent with E69/I522; the 15 tags are permanent telemetry (payload-only); rules525.md frozen + sweep525.json + results525.txt (findings appended); pins ALL EXACT (causal495 3-arm / causal483 / playframe483 / playframe491 / pwa491 11/11); 1,187/1,187 + build 0 + dist 5,255,258 B/184 (+326 B) + vendor UNCHANGED + BOM delta 0.\r\nSTATUS (I524):',
  'stories.STATUS');
if (head16('production/stories.md') !== headS) throw new Error('stories head16 changed');
// 3. iterations.md (append at EOF; tail LF, ends NL)
{
  const p = 'production/iterations.md';
  const b = G(p);
  const t = b.toString('latin1');
  if (!t.endsWith('\n')) throw new Error('iterations: no trailing NL');
  const entry = '\n## I525 - ST-491: R7 killing-blow diagnosis WITH MEASUREMENT - 15 payload-only source tags + 10-seed kiter sweep; BRANCH C (accept-with-documentation)\n- R1 Instrument (payload only, zero logic/RNG/config change): all 15 ship-hit \'hit\' emit sites in src/core/game.js gained source (+ sourceSpeed/sourceRadius for bullet hits) - 519 rock (rock_<size>), 579 mine, 889 boss (boss_<kind>), 991 warden, 1009 bullet, 1075 drone, 1165 stinger, 1213 hunter, 1268 gunship, 1525 sentry, 1541 wasp, 1557 pod, 1574 phantom, 1590 hauler, 1606 bulwark. game.js is 100% CRLF (1669/1669) - tags applied via latin1 round-trip + full-line match per index, CRLF preserved (86,750 -> 87,131 B, +381 B; .evidence/I525/tags525.cjs).\n- R2 Frozen protocol (.evidence/I525/rules525.md 10,333 B LF no-BOM): 10 seeds 52700+i, full wave-1 director (no isolation), cap 36000 ticks, I328 kiter verbatim; killing-blow = FIRST \'hit\' with lives===0 (exactly one per run - break at game.js:1012 + guards); bullet attribution = nearest creator over per-tick pool snapshots with recentMul normalization window [t-240,t-1] over speedMul 0.85-1.15 (0.9 lull); monolithProbable = Monolith alive at hit OR monolith bossDeath within 90 ticks; deterministic branches B (H >= 6/10 heavyweight) / A (max non-heavyweight >= 4/10) / C (accept-with-documentation).\n- R3 Sweep WITH MEASUREMENT (.evidence/I525/sweep525.mjs 15,069 B, deterministic node-only ~7 s wall; 2 harness bugs found+fixed via patch525.cjs: bullet clsPrimary mapping boss_monolith->MONOLITH/boss_splicer->SPLICER + per-wave clearSecs NaN): 10/10 died, median death wave 9, all hits=3. Per-run: 52700 w5 bullet->MONOLITH (9.84375=9x1.09375) score 55941; 52701 w10 rock_S 99587; 52702 w5 bullet->MONOLITH (7.65625=7x1.09375) 54965; 52703 w5 bullet->bullet_unknown (9.84375; Monolith died 12 ticks earlier - RESIDUAL bolt, correctly unknown) 52464; 52704 w12 bullet->sentry (7.65=9x0.85) 183669; 52705 w8 rock_L 76669; 52706 w10 bullet->gunship (4.675=5.5x0.85, radius 0.5) 134125; 52707 w11 bullet->gunship (4.95=5.5x0.9) 162557; 52708 w10 bullet->SPLICER (5.95=7x0.85) 138728; 52709 w6 bullet->MONOLITH (8.1=9x0.9) 55447.\n- R4 TALLY (primary == strict - ZERO monolithProbable rocks): MONOLITH 3, SPLICER 1, gunship 2, rock_S 1, rock_L 1, sentry 1, bullet_unknown 1. H = 4/10 heavyweight. BRANCH DECISION: C (accept-with-documentation) - H < 6/10 AND max non-heavyweight gunship 2/10 < 4/10.\n- R5 FINDINGS (appended to results525.txt 5,740 B via findings525.cjs): wave-5 Monolith = biggest kill cluster (4/10 died on wave 5 incl. the residual-bolt run) and the kiter KILLED the wave-5 Monolith in 7/10 runs (bossDeaths 52701@5805, 52703@6454, 52704@7977, 52705@7550, 52706@5242, 52707@7014, 52708@6270) -> the heavyweight wall is a WINDOW problem (its bolts after the kill), not an unbeatable HP wall. No run cleared wave 8+ (w8-12 clear counts 0); median non-boss clears w1-7: 22.4/23.8/21.8/20.5/22.7(7/10)/10.0(6/7)/14.4(6/6) s; plannedContent run0 w1-12: 5/6/6/8/10/6/8/10/11/12/9/10. E70 R-wave20 (median death wave 9; wave-20 reach >= 6/10 NOT met) documented as a known limitation - consistent with E69/I522. R7 instrument delivered: the 15 payload tags are permanent telemetry (payload-only, zero logic change).\n- R6 Quality bar (measured): 1,187/1,187 + build 0 + dist 5,255,258 B/184 (+326 B minified) < 6,100,000 B ceiling + git diff vendor/ empty (0 B) + BOM delta 0 (CHANGELOG 7 / stories 5 / epics 3 / iterations 5 / timeline 3 / AGENTS 1; rules525.md / results525.txt 0/0) + all 15 tags byte-verified in dist (esbuild rewrites single to double quotes); pins ALL EXACT - causal495 CAUSAL495 PASS 3-arm (webgl/default EXACT; webgpu err=0 warn=3 = I498 documented baseline), causal483 CAUSAL456 PASS (console 0/0), playframe483/491 PLAYFRAME456 PASS (52/55,400 hv=0/gv=0; console 0/0), pwa491 SUMMARY 11/11; 3 hidden servers killed + 5173/4200/5199 ECONNREFUSED, all headless tabs closed.\n- Next: I526 = ST-492 (Branch C - accept-with-documentation, NO lever: record the documented acceptance + R-wave20 residual in the E70 research docs; likely docs-only) then I527 = ST-493 (G70.0 close gate).\n';
  fs.writeFileSync(p, Buffer.concat([b, Buffer.from(entry, 'latin1')]));
  console.log('iterations.APPEND OK ' + b.length + ' -> ' + (b.length + Buffer.byteLength(entry, 'latin1')));
}
// 4. timeline.md (append; tail LF, ends NL)
{
  const p = 'production/timeline.md';
  const b = G(p);
  const t = b.toString('latin1');
  if (!t.endsWith('\n')) throw new Error('timeline: no trailing NL');
  const line = '- 2026-11-20  I525 (ST-491: R7 killing-blow diagnosis WITH MEASUREMENT - 15 payload-only \'hit\' source tags in src/core/game.js (CRLF preserved, +381 B, zero logic/RNG/config change) + 10-seed full-director kiter sweep [52700+i, cap 36000 ticks] WITH MEASUREMENT: 10/10 died, median death wave 9, all hits=3; TALLY primary==strict (0 monolithProbable rocks): MONOLITH 3 (incl. 1 residual-bolt bullet_unknown), SPLICER 1, gunship 2, rock_S 1, rock_L 1, sentry 1, bullet_unknown 1; H = 4/10 heavyweight -> BRANCH C accept-with-documentation (frozen B>=6/10 and A non-heavyweight>=4/10 unmet); findings: wave-5 Monolith = window problem (kiter killed it 7/10 runs - its bolts still kill), no run cleared wave 8+, E70 R-wave20 residual documented as known limitation; pins ALL EXACT (causal495 3-arm / causal483 / playframe483 / playframe491 / pwa491 11/11); 1,187 tests; dist 5,255,258 B/184 (+326 B); vendor pins EXACT 8/8. Next: I526 = ST-492 (Branch C, no lever) / I527 = ST-493 (G70.0 close gate).)\n';
  fs.writeFileSync(p, Buffer.concat([b, Buffer.from(line, 'latin1')]));
  console.log('timeline.APPEND OK ' + b.length + ' -> ' + (b.length + Buffer.byteLength(line, 'latin1')));
}
// 5. CHANGELOG.md (insert - I525: before - I524: under ## [Unreleased], CRLF)
rep1('CHANGELOG.md',
  '## [Unreleased]\r\n- I524:',
  '## [Unreleased]\r\n- I525: ST-491 E70 - R7 killing-blow diagnosis WITH MEASUREMENT (15 payload-only \'hit\' source tags in src/core/game.js, CRLF preserved +381 B, zero logic/RNG/config change) - 10-seed full-director kiter sweep [52700+i, cap 36000 ticks] WITH MEASUREMENT: 10/10 died, median death wave 9, all hits=3; TALLY primary==strict (0 monolithProbable rocks): MONOLITH 3 (incl. 1 residual-bolt bullet_unknown, correctly unknown per the frozen boss-alive-at-hit rule), SPLICER 1, gunship 2, rock_S 1, rock_L 1, sentry 1, bullet_unknown 1; H = 4/10 heavyweight -> BRANCH C accept-with-documentation (frozen thresholds B>=6/10 and A non-heavyweight>=4/10 unmet); findings: wave-5 Monolith = window problem (the kiter killed it in 7/10 runs - its bolts still kill), no run cleared wave 8+, E70 R-wave20 residual documented as known limitation; rules525.md frozen + sweep525.mjs/json + results525.txt (findings appended); pins ALL EXACT (causal495 3-arm / causal483 / playframe483 / playframe491 / pwa491 SUMMARY 11/11); 1,187/1,187 + build 0 + dist 5,255,258 B/184 (+326 B) + vendor UNCHANGED + BOM delta 0\r\n- I524:',
  'changelog.INSERT');
if (head16('CHANGELOG.md') !== headC) throw new Error('changelog head16 changed');
// 6. active.md (finalize I524 note + append I525 note)
rep1('production/session-state/active.md',
  'Committed (this story) + push pending.',
  'Committed c194cd4 + PUSHED-OK (389f6c2..c194cd4).',
  'active.FINALIZE-I524');
{
  const p = 'production/session-state/active.md';
  const b = G(p);
  const t = b.toString('latin1');
  const note = '- notes: I525 done (ST-491 E70 - R7 killing-blow diagnosis WITH MEASUREMENT): 15 payload-only \'hit\' source tags in src/core/game.js [CRLF 1669/1669 preserved, 86,750->87,131 B +381 B, zero logic/RNG/config change, tags525.cjs] + rules525.md frozen (10 seeds 52700+i, full director, cap 36000, I328 kiter verbatim, killing-blow = first hit with lives===0, bullet attribution recentMul window, monolithProbable 90-tick rule, branches B/A/C) + sweep525.mjs (2 harness bugs fixed via patch525.cjs) -> 10/10 died, median wave 9, all hits=3; tally primary==strict (0 monolithProbable rocks): MONOLITH 3 (1 residual-bolt unknown), SPLICER 1, gunship 2, rock_S 1, rock_L 1, sentry 1, bullet_unknown 1; H=4/10 -> BRANCH C accept-with-documentation; findings: wave-5 Monolith = window problem (kiter killed 7/10), no run clears wave 8+, R-wave20 residual OPEN; pins ALL EXACT (causal495 3-arm / causal483 / playframe483/491 / pwa491 11/11) - quality bar: 1,187/1,187 + build 0 + dist 5,255,258 B/184 (+326 B) + vendor UNCHANGED + BOM delta 0 + hygiene (3 hidden servers killed ECONNREFUSED, all headless tabs closed). Committed (this story) + push pending. Next: I526 = ST-492 (Branch C accept-with-documentation, no lever - docs) / I527 = ST-493 (G70.0 close gate).\n';
  let base = t;
  if (!base.endsWith('\n')) base += '\n';
  fs.writeFileSync(p, Buffer.from(base + note, 'latin1'));
  console.log('active.APPEND-I525 OK ' + b.length + ' -> ' + Buffer.byteLength(base + note, 'latin1'));
}
console.log('BOOKKEEPING I525 DONE');