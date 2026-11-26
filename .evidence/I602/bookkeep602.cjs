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

// 1. scope-check-E86.md: Verification evidence fill
patch('production/scope-check-E86.md', (sc) => {
  const a = '(to be filled at close: per-story evidence WITH MEASUREMENT + quality bar + the 5-harness gate + CLOSE FLOOR E86)';
  const i = assertCount(sc, a, 'sc-ev');
  const ev = '- ST-564 (I599): probe599 PASS n=11 (cockpit 8 angles settled, drift 0.012-0.019 deg, diffEnd 0.003-0.004 deg; chase 3 angles 0.000 deg from world +y; no 180-deg flip in the non-gate regression demo; consoleErrors 0) + the basis-identity unit test appended (npm test 1,238 at I599).\n- ST-565 (I600): smoke600 PASS [z 40, opacity 1<->0 with cockpit mode, 7 static gradient layers, HUD z 55 above frame, RM transition none, consoleErrors 0; 2 art-tune iterations, final struts 35/145deg edge-to-edge] + regression 2/2 EXACT + dist 6,853,589 B / 204 (+1,672 B vs I599 6,851,917).\n- ST-566 (I601): FARFRAME601 PASS exit 0 (pure node, farframe601.json committed -f): (a) position invariance PASS at in 20.8 + rim 26 (ship NDC (0,-0.1428) at all 3 positions, maxDx 0 / maxDy 0 vs tol 0.005) - the I445 invariant measured end-to-end for the first time; (b) 3/4 arena center in-frustum from rim [N (0,0.3788)/E (-0.6706,0.1339)/W (0.6706,0.1339) in; S (0,-3.463) OUT below, depth 7.06]; (c) 1/4 opposite rim [N (0,0.5733) in; S depth -12.5975 behind the camera; E/W x-stretch 1.3002 OUT] -> root cause: fixed world +Z endless dolly (backDir null) sits outside the arena only for the N rim; 3 residuals registered E87+ (S-rim center below / S-rim opposite rim behind camera / E+W-rim opposite rim x-stretch 1.30) per the I596 accept-with-documentation pattern; NO code change (frozen scope honored).\n- ST-567 (I602): CLOSEGATE602 HARNESS PASS 5/5 EXACT zero re-pins (run_closegate602.cjs cloned from the I597 runner; ports 4200/5173/5199 self-started + self-killed, port_free=true each): causal495 [3-arm seed-9876: webgl EXACT + default EXACT + webgpu report-only] / causal483 [score 11334 EXACT] / playframe483 + playframe491 [A L 22/62,472 + P 11/180 EXACT, B EXACT, cam finite, console 0/0] / pwa491 [SUMMARY 11/11: SW active + root scope + controller + offline boot + no NaN + console clean].\n- Quality bar across the epic: npm test 1,238/1,238 (I599..I601, zero src drift), build 0, vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017), fresh dist re-measure at close EXACT 6,853,589 B / 204 (byte-identical to I600/I601 - no src change since I600). CLOSE FLOOR E86 = 546,411 B (7,400,000 - 6,853,589; headroom >= 102,400 B floor -> cut ladder NOT invoked).';
  return sc.slice(0, i) + ev + sc.slice(i + a.length);
});

// 2. AGENTS.md item 4: CLOSE FLOOR E86 clause at head, E85 demoted
patch('AGENTS.md', (ag) => {
  const a = '; CLOSE FLOOR E85 = ';
  const i = assertCount(ag, a, 'ag-floor');
  const repl = '; CLOSE FLOOR E86 = 546,411 B measured at G86.0 (I602: 7,400,000 - 6,853,589 fresh dist re-measured EXACT [byte-identical to I600/I601 - no src change since I600; I601 probe/docs only]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E86 CLOSED I602); prior CLOSE FLOOR E85 = ';
  return ag.slice(0, i) + repl + ag.slice(i + a.length);
});

// 3. epics.md: E86 header + Status -> CLOSED
patch('production/epics.md', (ep) => {
  const a = ' - OPEN I598 (ST-564/565/566/567 PENDING)';
  const i = assertCount(ep, a, 'ep-header');
  let t = ep.slice(0, i) + ' - CLOSED I602 (G86.0; opened I598)' + ep.slice(i + a.length);
  const b = '- Status: OPEN I598 (ST-564 DONE I599 / ST-565 DONE I600 / ST-566 DONE I601 [FARFRAME601 PASS; 3 far-framing residuals registered E87+ per accept-with-documentation] / ST-567 PENDING).';
  const j = assertCount(t, b, 'ep-status');
  t = t.slice(0, j) + '- Status: CLOSED I602 (G86.0 close gate 5/5 EXACT zero re-pins [CLOSEGATE602]; 4/4 stories DONE; ST-566 accept-with-documentation w/ 3 far-framing residuals registered E87+; CLOSE FLOOR E86 = 546,411 B; AGENTS.md item-4 refreshed; dist 6,853,589 B / 204).' + t.slice(j + b.length);
  return t;
});

// 4. stories.md: ST-567 PENDING -> DONE + acceptance
patch('production/stories.md', (st) => {
  const a = '- ST-567 E86 G86.0 close (I602) - PENDING: ';
  const i = assertCount(st, a, 'st567');
  const eol = st.indexOf('\n', i);
  let line = st.slice(i, eol).replace('- PENDING: ', '- DONE I602: ');
  line += ' ACCEPTED: CLOSEGATE602 HARNESS PASS 5/5 EXACT zero re-pins [causal495 3-arm seed-9876 webgl+default EXACT webgpu report-only / causal483 score 11334 EXACT / playframe483 + playframe491 A 22/62,472 + P 11/180 EXACT + B EXACT + console clean / pwa491 SUMMARY 11/11; ports 4200/5173/5199 self-started + self-killed, port_free=true each] + fresh dist re-measure EXACT 6,853,589 B / 204 (byte-identical to I600/I601) + vendor 4/4 EXACT + CLOSE FLOOR E86 = 546,411 B (7,400,000 - 6,853,589; >= 102,400 B floor -> cut ladder NOT invoked) + scope-check Verification evidence filled + AGENTS.md item-4 refreshed (E86 clause at head, E85 demoted) + E86 CLOSED 4/4 + I601 push d610bb3 verified on origin main.';
  return st.slice(0, i) + line + st.slice(eol);
});

// 5. iterations.md: append I602 entry + push line
patch('production/iterations.md', (it) => {
  if (!it.endsWith('landing verified next turn via git ls-remote).')) { console.error('it tail anchor mismatch: ' + JSON.stringify(it.slice(-60))); process.exit(1); }
  const add = '\r\n- I602 (ST-567, E86): G86.0 close gate - CLOSEGATE602 HARNESS PASS 5/5 EXACT zero re-pins (run_closegate602.cjs cloned from the I597 runner; ports 4200/5173/5199 self-started/self-killed, port_free=true each): causal495 [3-arm seed-9876: webgl EXACT + default EXACT + webgpu report-only] / causal483 [score 11334 EXACT] / playframe483 + playframe491 [A L 22/62,472 + P 11/180 EXACT, B EXACT, cam finite, console 0/0] / pwa491 [SUMMARY 11/11]. Fresh dist re-measure EXACT 6,853,589 B / 204 (byte-identical to I600/I601 - no src change since I600; I601 was probe/docs only). Vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017). CLOSE FLOOR E86 = 546,411 B (7,400,000 - 6,853,589; headroom >= 102,400 B floor -> cut ladder NOT invoked). E86 CLOSED (4/4: ST-564 I599 / ST-565 I600 / ST-566 I601 accept-with-documentation w/ 3 far-framing residuals registered E87+ / ST-567 I602). AGENTS.md item-4 refreshed (CLOSE FLOOR E86 clause at head, E85 demoted to prior). Bookkeeping: 8 files (scope-check Verification evidence + AGENTS.md + epics CLOSED + stories DONE + iterations + timeline + active + CHANGELOG), BOM deltas 0. I601 push d610bb3 VERIFIED on origin main this turn (git ls-remote = HEAD).\r\n- Push: I602 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote).';
  return it + add;
});

// 6. timeline.md: append I602 paragraph
patch('production/timeline.md', (tl) => {
  if (!tl.endsWith('measured and on the improvement list.')) { console.error('tl tail anchor mismatch: ' + JSON.stringify(tl.slice(-60))); process.exit(1); }
  return tl + '\r\n\r\nI602 (ST-567, E86) done: no visible change - the cockpit work is closed out. The flight controls, the first-person view, and its frame all passed the full regression gauntlet, and the game was re-verified stable end to end. A few camera-visibility edge cases from the far-framing measurement were logged for a future improvement pass.';
});

// 7. session-state/active.md: NEXT at I603
patch('production/session-state/active.md', (ac) => {
  const add = '\r\n- NEXT at I603 (post-E86): open E87 - research + scope-check over the E87+ backlog per the user standing queue: (1) camera far-framing fix - the 3 I601 measured residuals (S-rim center below / S-rim opposite rim behind camera / E+W-rim opposite rim x-stretch 1.30; fix candidates: arena-relative dolly basis or per-azimuth backDir instead of fixed world +Z - config/cameraModel math, frozen OUT of E86); (2) richer ship/enemy art via Blender 5.2.3 headless (user most recent explicit art ask; NOTE asset cap 3,940 KB / 91,050 t is 99.4% used [3,915 KB / 90,977 t measured] - any growth needs cap renegotiation WITH MEASUREMENT in the scope-check, plus dist ceiling 7,400,000 B / CLOSE FLOOR floor 102,400 B); (3) WebGPU visuals pass; other registered residuals: Monolith wave-5 wall, late-wave pacing, 2 E85 luma (warden sky p50 +20.12 / drone +10.41). Pick scope per user priority (art is the most recent explicit ask) then E87 open + stories + budget pre-registration if assets grow.';
  return ac + add;
});

// 8. CHANGELOG.md: I602 line above I601
patch('CHANGELOG.md', (cl) => {
  const a = '- I601:';
  const i = assertCount(cl, a, 'cl-i601');
  const line = '- I602: No visible change - the cockpit updates passed the full regression gauntlet and are closed out, with the game re-verified stable end to end. The few camera-visibility edge cases we measured were logged for a future improvement pass.\n';
  return cl.slice(0, i) + line + cl.slice(i);
});
console.log('ALL 8 PATCHED');