// I541 (ST-507, E73): bookkeeping - latin1 byte-preserving, per-file line endings (template: .evidence/I540/i540docs.cjs).
const fs = require('fs');
const path = require('path');
const R = (p) => path.join(__dirname, '..', '..', p);
const read = (f) => fs.readFileSync(R(f), 'latin1');
const write = (f, s) => fs.writeFileSync(R(f), Buffer.from(s, 'latin1'));
const bom = (f) => { const b = fs.readFileSync(R(f)); let c = 0, i = 0; while (i + 2 < b.length && b[i] === 0xEF && b[i + 1] === 0xBB && b[i + 2] === 0xBF) { c++; i += 3; } return c; };
const rep = (s, oldStr, newStr, tag) => { const i = s.indexOf(oldStr); if (i < 0) throw new Error(tag + ': NOT FOUND'); if (s.indexOf(oldStr, i + 1) >= 0) throw new Error(tag + ': NOT UNIQUE'); return s.slice(0, i) + newStr + s.slice(i + oldStr.length); };
const before = {};
const FILES = ['production/epics.md', 'production/stories.md', 'production/iterations.md', 'production/timeline.md', 'CHANGELOG.md', 'production/session-state/active.md'];
for (const f of FILES) before[f] = bom(f);
const ep0 = read('production/epics.md');
if (ep0.endsWith('\n')) throw new Error('epics: expected no trailing NL');
const st0 = read('production/stories.md');
if (!st0.endsWith('\n')) throw new Error('stories: expected trailing NL');
const it0 = read('production/iterations.md');
if (it0.endsWith('\n')) throw new Error('iterations: expected no trailing NL');
const tl0 = read('production/timeline.md');
if (!tl0.endsWith('\n')) throw new Error('timeline: expected trailing NL');
const ac0 = read('production/session-state/active.md');
if (!ac0.endsWith('\n')) throw new Error('active: expected trailing NL');

// 1. epics.md: E73 Stories line + Status line
let ep = ep0;
ep = rep(ep, 'ST-507 (I541) swap + re-pins WITH MEASUREMENT. ST-508 (I542) G73.0 close gate.',
  'ST-507 (I541) swap + re-pins WITH MEASUREMENT - DONE I541 (assets/ship.glb v6 -> v7 32,499 t / 740,012 B; assetGlbs BUDGETS.ship + SHIP_FACET; assetPerf totalTris 72,449 / totalGeoKB 3,076.52 / totalFilesKB 3,136.95 / perFileKB 760; playframe A 22/32,717 + B 52/69,272 WITH MEASUREMENT; dist 5,542,040 B / 184; console 0/0). ST-508 (I542) G73.0 close gate.', 'epics-stories');
ep = rep(ep, 'TEMP GLB, NO swap - ST-507 does the swap + re-pins WITH MEASUREMENT).',
  'TEMP GLB, NO swap - ST-507 does the swap + re-pins WITH MEASUREMENT). ST-507 DONE I541 (assets/ship.glb v6 25,563 t / 581,440 B -> v7 32,499 t / 740,012 B, +6,936 t / +158,572 B; 7 asset-test re-pins + playframe A:L 25,781 -> 32,717 + B 55,400 -> 69,272 WITH MEASUREMENT; npm test 1,187/1,187; build 0; dist 5,542,040 B / 184 under 6,100,000 ceiling [headroom 557,960 B]; vendor 4/4; console 0/0; CLOSE FLOOR E73 = 557,960 B).', 'epics-status');
write('production/epics.md', ep);

// 2. stories.md: ST-507 line PENDING -> DONE
const stOld = '- ST-507 E73 SWAP + re-pins WITH MEASUREMENT (I541) - PENDING/E73 (assets/ship.glb v6 -> v7; assetGlbs BUDGETS.ship + SHIP_FACET hull/wings; assetPerf totalTris + totalGeoKB + totalFilesKB (+ perFileKB if v7 > 614,400 B); playframe491/483 A + B (precedent v5->v6: A delta, B = 2x; expected ~A 32,218 / B 68,274 at 32,000 t - measured governs); runtime smoke console clean no NaN; quality bar 6/6; dist WITH MEASUREMENT, tripwire 5,750,000 B)';
const stNew = '- ST-507 E73 SWAP + re-pins WITH MEASUREMENT (I541) - DONE I541: assets/ship.glb v6 25,563 t / 581,440 B -> v7 32,499 t / 740,012 B [+6,936 t / +158,572 B]; measure541.cjs [verbatim assetPerf + assetGlbs] fleet file 3,212,232 B / geo 3,150,354 B / tris 72,449 / max ship 740,012 B + ship 32,499 t [round=floor clean] / 3 mats / COLOR_0 on 2 prims / FACET hull 0.4603-0.8009-1.3020 + wings 0.3891-0.9271-1.5464 [matches I540 probe]; repins541.cjs [latin1 byte-preserving, BOM+CRLF] assetGlbs BUDGETS.ship 25,563 -> 32,499 + SHIP_FACET hull {0.4603/0.8009/1.3020} wings {0.3891/0.9271/1.5464} [MAX_FILE_BYTES 1,048,576 holds; span 4.021 / len 2.600 unchanged] + assetPerf totalFilesKB 3000 -> 3300 / totalGeoKB 2925 -> 3080 / perFileKB 600 -> 760 / totalTris 66000 -> 73000 [all caps ABOVE measured WITH headroom]; repins541pf.cjs playframe491 A:L 22/25,781 -> 22/32,717 [+6,936 ship delta, fx=off single pass, non-ship 218 unchanged] + B 52/55,400 -> 52/69,272 [+13,872 = 2x, fx=high] [A:P 11/180 unchanged] -> re-run PLAYFRAME456 PASS console 0/0; server killed 0 listeners; quality bar 6/6 [1,187/1,187 + build 0 + playframe PASS + dist 5,542,040 B/184 [headroom 557,960 B, cut ladder NOT invoked] + vendor 4/4 + BOM delta 0 + hygiene]';
let st = st0;
st = rep(st, stOld, stNew, 'stories-st507');
write('production/stories.md', st);

// 3. iterations.md: append I541 section
const iterBlock = [
'## I541 (ST-507, E73): ship v7 swap + re-pins WITH MEASUREMENT (assetGlbs + assetPerf + playframe A/B) - dist 5,542,040 B - quality bar 6/6',
'- Goal (ST-507): swap assets/ship.glb v6 (25,563 t / 581,440 B) -> v7 (32,499 t / 740,012 B) and re-pin every shipped-geometry measurement WITH MEASUREMENT (standing rule: re-pin ONLY on a shipped-geometry change, ALWAYS WITH MEASUREMENT). Zero core/sim/logic code change - only the asset + its pins.',
'- Swap: assets/ship.glb <- .evidence/I540/ship_v7.glb (740,012 B). shipMesh.js name routing already matches (VR_Ship_Hull -> bodyMat / VR_Ship_Wings -> wingMat / VR_Ship_Cockpit -> cockpitMat / Fin -> wingMat-routed white / Engine+Nozzle -> bodyMat) - verified I539, no code change.',
'- Measurement (.evidence/I541/measure541.cjs, verbatim assetPerf + assetGlbs algorithms): fleet 31 GLB total file 3,212,232 B (3,136.95 KB) / geo 3,150,354 B (3,076.52 KB) / tris 72,449 / max file ship.glb 740,012 B (722.67 KB). Ship 32,499 t (round=floor, clean); nodes [Cockpit/Engine/Fin/Hull/Nozzle/Wings]; 3 mats; COLOR_0 on exactly 2 prims. FACET hull 0.4603/0.8009/1.3020 (spread 0.8417) / wings 0.3891/0.9271/1.5464 (spread 1.1572). Both match the I540 probe exactly.',
'- Re-pins WITH MEASUREMENT (.evidence/I541/repins541.cjs, latin1 byte-preserving, NOT FOUND/NOT UNIQUE guards; BOM+CRLF preserved): (a) tests/assetGlbs.test.js BUDGETS.ship 25,563 -> 32,499 + SHIP_FACET hull {0.4603/0.8009/1.3020} wings {0.3891/0.9271/1.5464} (MAX_FILE_BYTES 1,048,576 holds 740,012; span 4.021 / len 2.600 unchanged, pins not touched). (b) tests/assetPerf.test.js BUDGET totalFilesKB 3000 -> 3300 (measured 3,136.95 KB) / totalGeoKB 2925 -> 3080 (measured 3,076.52 KB) / perFileKB 600 -> 760 (measured max 722.67 KB) / totalTris 66000 -> 73000 (measured 72,449). All caps pinned ABOVE measured WITH headroom.',
'- Playframe re-pin WITH MEASUREMENT (.evidence/I541/repins541pf.cjs): dev server :5173, node .evidence/I491/playframe491.mjs -> MEASURED A:L 22/25,781 -> 22/32,717 (+6,936 = ship GLB 25,563 -> 32,499, fx=off single scene pass, non-ship 218 tris unchanged) / A:P 11/180 UNCHANGED (ship not in that pass) / B 52/55,400 -> 52/69,272 (+13,872 = 2 x 6,936, fx=high two-pass, single-pass 27,700 -> 34,636). Re-pinned the 3 condition constants + 2 labels in playframe491.mjs; re-run -> PLAYFRAME456 PASS, console A 0/0 B 0/0. Killed server, verified 0 listeners on 5173 (ECONNREFUSED).',
'- Quality bar 6/6 MEASURED: (1) npm test 1,187/1,187. (2) npm run build 0. (3) Runtime smoke: playframe491 PASS, console 0/0 (no NaN). (4) dist 5,542,040 B / 184 (under the 6,100,000 B ceiling; headroom 557,960 B >= 102,400 B floor -> cut ladder NOT invoked; under ST-507 tripwire 5,750,000 B). (5) vendor r187 pins EXACT 4/4 (three.module A65DE049A7F38B40 / core 7AB0784CD2532367 / webgpu F549248412C62B9A / tsl 7FF9ACF50F006017). (6) BOM delta 0 + hygiene (dev server killed, 0 listeners on 5173, 0 browser tabs, 0 stray terminals).',
'- Deployment (I540 push, recorded here post-hoc): Faraday worker pushed d8258f4..6e1cb38 to origin main (git push, GCM cached creds, no token printed); GitHub Pages workflow run #55 (head 6e1cb38) completed success; https://Rajibsigdel12345.github.io/void-runner/ HTTP 200; NO free-runner minute block (public-repo Pages). Tree clean after.',
'- Bookkeeping: iterations.md + stories.md (ST-507 -> DONE I541) + epics.md (E73 Stories + Status) + timeline.md + CHANGELOG.md [Unreleased] + active.md. .evidence/I541 force-added (measure541.cjs + repins541.cjs + repins541pf.cjs).',
'- Next: I542 = ST-508 (G73.0 close gate: 5 fresh harnesses causal495@4200 / causal483@5173 / playframe491@5173 / playframe483@5173 / pwa491@5199 -> all EXACT; CLOSE FLOOR E73 = 6,100,000 - dist WITH MEASUREMENT; AGENTS.md refresh: ship v7 32,499 t / 740,012 B + fleet 72,449 t / 3,150,354 B geo + dist 5,542,040 B / 184 + CLOSE FLOOR E73 clause) -> E73 CLOSES 4/4 -> delegate push to a fresh worker.'
].join('\r\n');
write('production/iterations.md', it0 + '\r\n\r\n' + iterBlock);

// 4. timeline.md: append I541 line
const tlLine = 'I541 (ST-507, E73) - ship v7 swap + re-pins WITH MEASUREMENT: assets/ship.glb v6 25,563 t / 581,440 B -> v7 32,499 t / 740,012 B [+6,936 t / +158,572 B]; measure541.cjs [verbatim assetPerf + assetGlbs] fleet file 3,212,232 B / geo 3,150,354 B / tris 72,449 / max ship 740,012 B + ship 32,499 t [round=floor clean] / 3 mats / COLOR_0 on 2 prims / FACET hull 0.4603-0.8009-1.3020 [spread 0.8417] + wings 0.3891-0.9271-1.5464 [spread 1.1572] [matches I540 probe exactly]; repins541.cjs [latin1 byte-preserving, BOM+CRLF] assetGlbs BUDGETS.ship 25,563 -> 32,499 + SHIP_FACET hull {0.4603/0.8009/1.3020} wings {0.3891/0.9271/1.5464} [MAX_FILE_BYTES 1,048,576 holds; span/len unchanged] + assetPerf BUDGET totalFilesKB 3000 -> 3300 / totalGeoKB 2925 -> 3080 / perFileKB 600 -> 760 / totalTris 66000 -> 73000 [all caps ABOVE measured WITH headroom]; playframe491.mjs re-pin WITH MEASUREMENT [dev server :5173] A:L 22/25,781 -> 22/32,717 [+6,936 ship GLB delta, fx=off single pass, non-ship 218 unchanged] / A:P 11/180 UNCHANGED / B 52/55,400 -> 52/69,272 [+13,872 = 2 x 6,936, fx=high two-pass] -> re-run PLAYFRAME456 PASS console 0/0; server killed 0 listeners; quality bar 6/6 [1,187/1,187 + build 0 + playframe PASS 0/0 + dist 5,542,040 B/184 under 6,100,000 ceiling [headroom 557,960 B >= 102,400 floor, cut ladder NOT invoked] + vendor 4/4 + BOM delta 0 + hygiene 0 servers/0 tabs/0 stray terminals]; I540 push recorded [Faraday d8258f4..6e1cb38 -> origin main, Pages run #55 success, HTTP 200, no free-runner block]. NEXT I542 = ST-508 G73.0 close gate [5 fresh harnesses all EXACT + CLOSE FLOOR E73 WITH MEASUREMENT + AGENTS.md refresh]';
write('production/timeline.md', tl0 + tlLine + '\n');

// 5. CHANGELOG.md: insert I541 line after "## [Unreleased]"
let cl = read('CHANGELOG.md');
const anchor = '## [Unreleased]\r\n';
const ai = cl.indexOf(anchor);
if (ai < 0) throw new Error('changelog: anchor not found');
const clLine = '- I541: The new ship is now in the game. We swapped in the re-built "warship airship" (the tall riveted hull with the engine bay, side nacelles, command tower, and twin-fin tail) and updated every pinned measurement to match it, so the game\'s internal checks now reflect the bigger, more detailed ship. The downloadable bundle grew to 5,542,040 bytes - still comfortably under the 6.1 MB limit. No gameplay changes this round: the ship flies and plays exactly the same.';
cl = cl.slice(0, ai + anchor.length) + clLine + '\r\n' + cl.slice(ai + anchor.length);
write('CHANGELOG.md', cl);

// 6. active.md: append I541 line
const acLine = 'I541 (ST-507, E73) done: ship v7 swap + re-pins WITH MEASUREMENT: assets/ship.glb v6 25,563 t / 581,440 B -> v7 32,499 t / 740,012 B [+6,936 t / +158,572 B]; measure541.cjs fleet file 3,212,232 B / geo 3,150,354 B / tris 72,449 / max ship 740,012 B + ship 32,499 t [round=floor] / FACET hull 0.4603-0.8009-1.3020 + wings 0.3891-0.9271-1.5464; repins541.cjs assetGlbs BUDGETS.ship -> 32,499 + SHIP_FACET + assetPerf totalFilesKB -> 3300 / totalGeoKB -> 3080 / perFileKB -> 760 / totalTris -> 73000 [all above measured WITH headroom]; playframe491 A:L 22/32,717 + A:P 11/180 + B 52/69,272 WITH MEASUREMENT -> PLAYFRAME456 PASS 0/0; quality bar 6/6 [1,187/1,187 + build 0 + dist 5,542,040 B/184 [headroom 557,960 B] + vendor 4/4 + BOM delta 0 + hygiene]; I540 push recorded [Pages run #55 success HTTP 200]. NEXT I542 = ST-508 G73.0 close gate';
write('production/session-state/active.md', ac0 + acLine + '\n');

let ok = true;
for (const f of FILES) { const after = bom(f); if (after !== before[f]) { ok = false; console.log('BOM DRIFT ' + f + ': ' + before[f] + ' -> ' + after); } else console.log('BOM ok ' + f + ' = ' + after); }
if (!ok) process.exit(1);
console.log('DOCS541 DONE');
