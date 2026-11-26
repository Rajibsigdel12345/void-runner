const fs = require('fs');
const ROOT = 'E:/Game/';
function patch(file, fn) {
  const p = ROOT + file;
  const before = fs.readFileSync(p, 'latin1');
  const bomsBefore = (before.match(/\u00EF\u00BB\u00BF/g) || []).length;
  const after = fn(before);
  if (after === before) { console.error('NO-OP ' + file); process.exit(1); }
  const bomsAfter = (after.match(/\u00EF\u00BB\u00BF/g) || []).length;
  if (bomsBefore !== bomsAfter) { console.error('BOM DELTA ' + file + ' ' + bomsBefore + '->' + bomsAfter); process.exit(1); }
  fs.writeFileSync(p, after, 'latin1');
  console.log('PATCHED ' + file + ' (+' + (after.length - before.length) + ' chars, boms ' + bomsBefore + ' delta 0)');
}
function assertCount(t, s, tag) {
  const n = t.split(s).length - 1;
  if (n !== 1) { console.error('ANCHOR ' + tag + ' count=' + n + ' :: ' + s.slice(0, 80)); process.exit(1); }
  return t.indexOf(s);
}

// 1. scope-check-E86.md: ST-566 fix-table row last cell (result + residuals)
patch('production/scope-check-E86.md', (sc) => {
  const tag = '| ST-566  |';
  const r0 = assertCount(sc, tag, 'sc-row');
  const r1 = sc.indexOf('\n', r0);
  const row = sc.slice(r0, r1);
  const lcStart = row.lastIndexOf('|');
  const cellStart = row.lastIndexOf('|', lcStart - 1);
  if (row.slice(cellStart + 1, lcStart).trim() !== '0 B') { console.error('sc last cell not 0 B'); process.exit(1); }
  const cell = ' 0 B (EXACT 6,853,589 B / 204 byte-identical to I600); FARFRAME601 PASS [(a) PASS: in 20.8 + rim 26 maxDx 0 / maxDy 0 vs tol 0.005, ship NDC (0,-0.1428) at all 3 positions + center ref; (b) 3/4 center in-frustum from rim [N (0,0.3788) in / E (-0.6706,0.1339) in / W (0.6706,0.1339) in / S (0,-3.463) OUT below]; (c) 1/4 opp rim from rim [N (0,0.5733) in; S depth -12.5975 BEHIND camera; E/W x-stretch 1.3002 OUT]]; root cause measured: fixed world +Z endless dolly (backDir null) sits outside the arena only for the N rim -> 3 residuals registered E87+ (S-rim center below / S-rim opp rim behind camera / E+W-rim opp rim x-stretch 1.30); NO code change per frozen scope (accept-with-documentation, I596 pattern) ';
  const newRow = row.slice(0, cellStart + 1) + cell + row.slice(lcStart);
  return sc.slice(0, r0) + newRow + sc.slice(r1);
});

// 2. epics.md: Stories line ST-566 + Status line
patch('production/epics.md', (ep) => {
  const a = 'ST-566 (I601) farframe601 verification probe + JSON';
  const i = assertCount(ep, a, 'ep-stories');
  const repl = a + ' - DONE I601: FARFRAME601 PASS [(a) PASS in+rim maxDx 0/maxDy 0 (tol 0.005, ship NDC (0,-0.1428) x3); (b) 3/4 center in-frustum from rim [N (0,0.3788)/E (-0.6706,0.1339)/W (0.6706,0.1339) in; S (0,-3.463) OUT below]; (c) 1/4 opp rim [N (0,0.5733) in; S behind depth -12.5975; E/W x-stretch 1.3002 OUT]] -> 3 residuals registered E87+ (S-rim center below / S-rim opp rim behind / E+W-rim opp stretch); NO code change (frozen scope)';
  let t = ep.slice(0, i) + repl + ep.slice(i + a.length);
  const b = '- Status: OPEN I598 (ST-564/565/566/567 PENDING).';
  const j = assertCount(t, b, 'ep-status');
  t = t.slice(0, j) + '- Status: OPEN I598 (ST-564 DONE I599 / ST-565 DONE I600 / ST-566 DONE I601 [FARFRAME601 PASS; 3 far-framing residuals registered E87+ per accept-with-documentation] / ST-567 PENDING).' + t.slice(j + b.length);
  return t;
});

// 3. stories.md: ST-566 PENDING -> DONE + acceptance
patch('production/stories.md', (st) => {
  const a = '- ST-566 E86 far-framing verification (I601) - PENDING: ';
  const i = assertCount(st, a, 'st-line');
  const eol = st.indexOf('\n', i);
  let line = st.slice(i, eol);
  line = line.replace('- PENDING: ', '- DONE I601: ');
  line += ' ACCEPTED: FARFRAME601 PASS exit 0 [(a) PASS in+rim maxDx 0/maxDy 0 (tol 0.005, ship NDC (0,-0.1428) at 3 positions x 2 dists + center ref) - the I445 position-invariance invariant, measured end-to-end for the first time; (b) 3/4 center in-frustum from rim [N (0,0.3788)/E (-0.6706,0.1339)/W (0.6706,0.1339); S (0,-3.463) OUT below, depth 7.06]; (c) 1/4 opp rim [N (0,0.5733); S behind depth -12.5975; E/W x-stretch 1.3002 OUT]] -> 3 residuals registered E87+ (accept-with-documentation, I596 pattern); root cause: fixed world +Z endless dolly (backDir null per main.js) sits outside the arena only for the N rim; NO code change (frozen scope honored - stop-and-reopen NOT needed); quality bar: npm test 1,238/1,238, build 0, vendor 4/4 EXACT, dist EXACT 6,853,589 B / 204 byte-identical to I600 (measure601); farframe601.mjs + farframe601.json committed -f.';
  return st.slice(0, i) + line + st.slice(eol);
});

// 4. iterations.md: append I601 entry + push line
patch('production/iterations.md', (it) => {
  const add = '\r\n- I601 (ST-566, E86): far-framing end-to-end verification probe (NO code change; probe-only, frozen scope honored). .evidence/I601/farframe601.mjs pure-node over the exported chaseTargets + projectNdc at the REAL endless call shape (backDir null = legacy world +Z dolly per main.js L~1353; fov 60 @ 16:9; arenaR 26; dolly s 1..1.7). (a) position invariance PASS at in 20.8 + rim 26: ship NDC (0,-0.1428) at all 3 positions, maxDx 0 / maxDy 0 vs tol 0.005 - the I445 invariant holds by construction (cam->ship and cam->look vectors are p-independent at fixed (dist, fwd)), now measured end-to-end for the first time. (b) arena center in-frustum from the rim (ship facing center): 3/4 - N (0,0.3788) / E (-0.6706,0.1339) / W (0.6706,0.1339) in; S (0,-3.463) OUT below (depth 7.06 - center is close and under the view). (c) opposite rim from the rim: 1/4 - N (0,0.5733) in; S depth -12.5975 BEHIND the camera (NaN by design); E/W x-stretch 1.3002 OUT past the horizontal edge. Root cause: the fixed world +Z camera sits outside the arena only for the N rim; at the S rim it is inside between ship and center; at E/W rims the far rim stretches wide. This IS the user "cannot see all the way back" complaint, now measured per direction. 3 residuals registered E87+ (S-rim center below / S-rim opposite rim behind camera / E+W-rim opposite rim x-stretch 1.30) per the I596 accept-with-documentation pattern; NO code change (config levers OUT of scope). JSON: farframe601.json (committed -f). Quality bar: npm test 1,238/1,238, build 0, vendor 4/4 EXACT (A65DE049A7F38B40/7AB0784CD2532367/F549248412C62B9A/7FF9ACF50F006017), dist EXACT 6,853,589 B / 204 byte-identical to I600 (measure601). Bookkeeping: 7 files patched (scope-check fix-table row + epics Stories/Status + stories DONE + timeline + active + CHANGELOG), BOM deltas 0. I600 push 8e839ad VERIFIED on origin main (git ls-remote) this turn.\r\n- Push: I601 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote).';
  if (!it.endsWith('confirmed on origin main this turn).')) { console.error('it tail anchor mismatch: ' + JSON.stringify(it.slice(-60))); process.exit(1); }
  return it + add;
});

// 5. timeline.md: append I601 paragraph
patch('production/timeline.md', (tl) => {
  if (!tl.endsWith('instruments or the crosshair.')) { console.error('tl tail anchor mismatch: ' + JSON.stringify(tl.slice(-60))); process.exit(1); }
  return tl + '\r\n\r\nI601 (ST-566, E86) done: no visible change - we measured exactly how much of the arena you can still see from the edge. The framing is the same wherever you fly; from most edges you can see the whole way back to the far side, and the few rim angles where you cannot are now measured and on the improvement list.';
});

// 6. session-state/active.md: append NEXT at I602
patch('production/session-state/active.md', (ac) => {
  const add = '\r\n- NEXT at I602 = ST-567 (E86): G86.0 close gate - close gate 5/5 re-run EXACT zero re-pins (clone .evidence/I597/run_closegate597.cjs -> .evidence/I602/run_closegate602.cjs, label CLOSEGATE602, ports 4200/5173/5199 self-start/self-kill: causal495 [3-arm seed-9876] + causal483 [score 11334] + playframe491 [A 22/62,472 + P 11/180, B 52/132,682] + pwa491 [11/11]) + fresh dist re-measure (expect EXACT 6,853,589 B / 204) + CLOSE FLOOR E86 WITH MEASUREMENT (7,400,000 - dist; floor >= 102,400 B) + scope-check "## Verification evidence" fill (anchor: "(to be filled at close: per-story evidence WITH MEASUREMENT + quality bar + the 5-harness gate + CLOSE FLOOR E86)") + AGENTS.md item-4 refresh (E86 clause at head, E85 demoted; chain: I599 6,851,917/203 -> I600 6,853,589/204 -> I601 unchanged) + E86 CLOSED I602 (G86.0; 4/4 stories; ST-566 accept-with-documentation w/ 3 measured residuals registered E87+) + epics E86 header/Status -> CLOSED + bookkeeping + commit + push delegate (Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be; I601 push lands together or first - verify via git ls-remote).';
  return ac + add;
});

// 7. CHANGELOG.md: insert I601 line above I600
patch('CHANGELOG.md', (cl) => {
  const a = '- I600:';
  const i = assertCount(cl, a, 'cl-i600');
  const line = '- I601: No visible change - we measured how far you can see from the edge of the arena, to make sure the camera keeps the whole fight in view wherever you fly, and logged the few rim angles where it does not, for a future fix.\n';
  return cl.slice(0, i) + line + cl.slice(i);
});
console.log('ALL 7 PATCHED');