// I542 (ST-508, E73): bookkeeping - latin1 byte-preserving, per-file line endings (template: .evidence/I541/i541docs.cjs).
const fs = require('fs');
const path = require('path');
const R = (p) => path.join(__dirname, '..', '..', p);
const read = (f) => fs.readFileSync(R(f), 'latin1');
const write = (f, s) => fs.writeFileSync(R(f), Buffer.from(s, 'latin1'));
const bom = (f) => { const b = fs.readFileSync(R(f)); let c = 0, i = 0; while (i + 2 < b.length && b[i] === 0xEF && b[i + 1] === 0xBB && b[i + 2] === 0xBF) { c++; i += 3; } return c; };
const rep = (s, oldStr, newStr, tag) => { const i = s.indexOf(oldStr); if (i < 0) throw new Error(tag + ': NOT FOUND'); if (s.indexOf(oldStr, i + 1) >= 0) throw new Error(tag + ': NOT UNIQUE'); return s.slice(0, i) + newStr + s.slice(i + oldStr.length); };
const before = {};
const FILES = ['production/epics.md', 'production/stories.md', 'production/iterations.md', 'production/timeline.md', 'CHANGELOG.md', 'production/session-state/active.md', 'AGENTS.md'];
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

// 1. epics.md: E73 Stories line + header + Status head + Status tail
let ep = ep0;
ep = rep(ep, `ST-508 (I542) G73.0 close gate.`, `ST-508 (I542) G73.0 close gate - DONE I542 (5 fresh harnesses ALL EXACT: causal495 + causal483 + playframe491 + playframe483 + pwa491; playframe483 inline pins re-pinned WITH MEASUREMENT at I542 [22/25781 -> 22/32717, 52/55400 -> 52/69272]; CLOSE FLOOR E73 = 557,960 B WITH MEASUREMENT; AGENTS.md refresh).`, 'epics-stories');
ep = rep(ep, `Remaster (WITH MEASUREMENT) - IN PROGRESS (opened I539)`, `Remaster (WITH MEASUREMENT) - CLOSED (I542; opened I539)`, 'epics-header');
ep = rep(ep, `- Status: IN PROGRESS (opened I539). ST-505 DONE I539`, `- Status: CLOSED (I542; opened I539). ST-505 DONE I539`, 'epics-statushead');
ep = rep(ep, `console 0/0; CLOSE FLOOR E73 = 557,960 B).`, `console 0/0; CLOSE FLOOR E73 = 557,960 B). ST-508 DONE I542 (G73.0 close gate: 5 fresh harnesses ALL EXACT - causal495 PASS [3 arms EXACT, webgpu report-only] + causal483 CAUSAL456 PASS + playframe491 PLAYFRAME456 PASS [A 22/32,717 + 11/180, B 52/69,272] + playframe483 PLAYFRAME456 PASS [pins re-pinned WITH MEASUREMENT at I542: 22/25781 -> 22/32717 + 52/55400 -> 52/69272] + pwa491 SUMMARY 11/11; CLOSE FLOOR E73 = 557,960 B WITH MEASUREMENT; AGENTS.md refresh). E73 CLOSED 4/4; dist 5,542,040 B / 184 WITH measurement.`, 'epics-statustail');
write('production/epics.md', ep);

// 2. stories.md: ST-508 line PENDING -> DONE
let st = st0;
st = rep(st, `- ST-508 E73 G73.0 close gate (I542) - PENDING/E73 (5 fresh harnesses: causal495 + causal483 + playframe491 + playframe483 + pwa491 - causal + pwa EXPECTED EXACT, playframe re-pin verified against measurement; CLOSE FLOOR E73 re-derived WITH MEASUREMENT, floor >= 102,400 B or cut ladder; AGENTS.md refresh; bookkeeping; commit + push delegate)`, `- ST-508 E73 G73.0 close gate (I542) - DONE I542: 5 fresh harness runs ALL EXACT - causal495 [dist :4200] CAUSAL495 PASS [webgl + default EXACT on the seed-9876 pin set, webgpu report-only] + causal483 [dev :5173] CAUSAL456 PASS [console 0/0, glb all-ready] + playframe491 [dev :5173] PLAYFRAME456 PASS [A 22/32,717 + 11/180, B 52/69,272 = the I541 re-pins] + playframe483 [dev :5173] first FAIL (2) [stale I503 inline pins 22/25781 + 52/55400 - the I541 ship v7 delta never propagated to the .mjs inline pins, caught by the gate] -> repins542pf.cjs re-pin WITH MEASUREMENT [A 22/25781 -> 22/32717 +6,936 ship GLB delta; B 52/55400 -> 52/69272 = 2 x 6,936; labels + header note updated; latin1 byte-preserving BOM delta 0] -> re-run PLAYFRAME456 PASS [console 0/0] + pwa491 [dist :5199] SUMMARY 11/11; CLOSE FLOOR E73 = 6,100,000 - 5,542,040 = 557,960 B WITH MEASUREMENT [headroom >= 102,400 B floor -> cut ladder NOT invoked]; AGENTS.md refresh [ship v7 32,499 t / 740,012 B + fleet 72,449 t / 3,150,354 B geo + dist chain + CLOSE FLOOR E73 + playframe item-6 pin text]; quality bar 6/6 [1,187/1,187 + build 0 + 5 harnesses EXACT + dist 5,542,040 B/184 + vendor 4/4 + BOM delta 0 + hygiene 0 servers/0 tabs/0 stray terminals]; E73 CLOSES 4/4`, 'stories-st508');
write('production/stories.md', st);

// 3. iterations.md: append I542 section (join CRLF, no trailing NL)
const iterBlock = [
`## I542 (ST-508, E73): G73.0 close gate - 5 fresh harness runs ALL EXACT + CLOSE FLOOR E73 = 557,960 B WITH MEASUREMENT + AGENTS.md refresh - E73 CLOSES 4/4`,
`- Goal (ST-508): G73.0 close gate after the I541 ship v7 swap: 5 fresh harness runs (causal495 dist :4200 / causal483 + playframe491 + playframe483 dev :5173 / pwa491 dist :5199) all EXACT, CLOSE FLOOR E73 re-derived WITH MEASUREMENT, AGENTS.md refresh, bookkeeping. E73 closes 4/4.`,
`- Pre-gate quality: npm test 1,187/1,187; npm run build 0 (dist 5,542,040 B / 184 re-confirmed; vendor 4/4 EXACT).`,
`- Gate run 1 (orch542.ps1): causal495 [dist :4200] CAUSAL495 PASS [3 arms: webgl + default EXACT on the seed-9876 pin set, webgpu report-only, console 0/0]. causal483 then FAILED under the dist server - root cause: .evidence/I483/causal483.mjs is hardwired to the DEV server :5173 (page.goto localhost:5173) so it can never run under dist :4200 - the same I538 pattern (orch538.ps1 section 1 failure -> orch538b.ps1 dev re-run). Orphaned :4200 server killed, verified refused.`,
`- Gate run 2 (orch542b.ps1, I538b port map): causal483 [dev :5173] CAUSAL456 PASS [console 0/0, glb all-ready, rock L/M/S 2.2/1.3/0.7]; playframe491 [dev :5173] PLAYFRAME456 PASS [A 22/32,717 + 11/180, B 52/69,272 = the I541 re-pins, console 0/0]; pwa491 [dist :5199] SUMMARY 11/11 [SW + manifest + offline boot, console 0/0]; playframe483 [dev :5173] FAILED (2): A L pin 22/25781 measured 22/32717 + B pin 52/55400 measured 52/69272 - the I541 ship v7 swap delta was never propagated to the playframe483.mjs inline pins (I541 re-pinned playframe491.mjs + the playframe483.json output file only; the .mjs carries its own inline pin constants from the I503 re-pin). The gate caught exactly this class of drift.`,
`- Re-pin WITH MEASUREMENT (.evidence/I542/repins542pf.cjs, latin1 byte-preserving, NOT FOUND/NOT UNIQUE guards, BOM delta 0): .evidence/I483/playframe483.mjs A pin RA.L.tris 25781 -> 32717 [+6,936 = ship GLB 25,563 -> 32,499, fx=off single pass, non-ship 218 unchanged, boss v2 contributes 0 to the MENU A window] + B pin RB.tris 55400 -> 69272 [+13,872 = 2 x 6,936, fx=high two-pass, single-pass scene 27,700 -> 34,636] + label A/B + header re-pin note (I542 provenance prepended, I503 history preserved). Re-run [dev :5173 -> playframe483_542b.out] -> PLAYFRAME456 PASS, console 0/0; server killed, 5173 refused.`,
`- G73.0 verdict: 5/5 fresh harness runs EXACT. CLOSE FLOOR E73 = 6,100,000 - 5,542,040 = 557,960 B WITH MEASUREMENT (headroom >= 102,400 B floor -> cut ladder NOT invoked).`,
`- AGENTS.md refresh (latin1 byte-preserving, CRLF + 1 BOM, quote-free match strings): art-assets line -> ship v7 32,499 t (I541/ST-507 swap; v6 25,563 superseded) + warship airship + fleet (~3,077 KB (3,150,354 B) / 72,449 tris (I541 measurement, cap 3,080 KB / 73,000 t)); dist chain append -> 5,542,040 (I541 ship v7 swap, +158,572) -> 5,542,040 (I542 G73.0 gate, code-only); CLOSE FLOOR E73 = 557,960 B clause prepended (E72 demoted to prior:); item-6 playframe pin text -> A 22/32,717 + B 52/69,272 (I541 ship v7; I501 ship v6 + I497 vendor history preserved). NO per-epic status line in AGENTS.md (E73 4/4 lives in epics.md).`,
`- Quality bar 6/6 MEASURED: (1) npm test 1,187/1,187. (2) build 0. (3) 5 fresh harness runs EXACT, consoles 0/0 (no NaN). (4) dist 5,542,040 B / 184 under the 6,100,000 B ceiling (CLOSE FLOOR E73 = 557,960 B). (5) vendor r187 pins EXACT 4/4. (6) BOM delta 0 on all patched files + hygiene (0 listeners on 4200/5173/5199/4173 at gate end, 0 browser tabs, 0 stray terminals).`,
`- Deployment: I541 push (6e1cb38..095b4ee) delegated to a fresh worker (Schrodinger): origin main verified at 095b4ee via git ls-remote, Pages site HTTP 200 (no free-runner block; gh CLI not installed - site 200 is the proof). I542 push to be delegated to a fresh worker after commit.`,
`- Bookkeeping: iterations.md + stories.md (ST-508 -> DONE I542) + epics.md (E73 header -> CLOSED (I542; opened I539), Stories + Status lines, E73 CLOSED 4/4) + timeline.md + CHANGELOG.md [Unreleased] + active.md + AGENTS.md. .evidence/I542 force-added (orch542.ps1 + orch542b.ps1 + logs + outputs + repins542pf.cjs + i542docs.cjs).`,
`- Next: E74 planning from the user-queued backlog (cockpit ship-in-view + crosshair + view-relative cockpit controls; mobile/PWA landscape D-pad + menu reorg; campaign L5; WebGPU default arm switch evaluation; art/character YouTube research pass; asteroid/comet bumps + craters if GPU budget allows). Pick per cgs-sprint-plan / cgs-gate-check after the I542 push lands.`
].join('\r\n');
write('production/iterations.md', it0 + '\r\n\r\n' + iterBlock);

// 4. timeline.md: append I542 line (file has trailing NL)
const tlLine = `I542 (ST-508, E73) - G73.0 close gate: 5 fresh harness runs ALL EXACT - causal495 [dist :4200] CAUSAL495 PASS + causal483 [dev :5173] CAUSAL456 PASS [causal483 is hardwired to dev :5173 - the same I538 pattern; orphaned :4200 server from run 1 killed] + playframe491 [dev :5173] PLAYFRAME456 PASS [A 22/32,717 + 11/180, B 52/69,272 = the I541 re-pins] + playframe483 [dev :5173] first FAIL (2) [stale I503 inline pins 22/25781 + 52/55400 - the I541 ship v7 delta never propagated to the .mjs inline pins; gate caught it] -> repins542pf.cjs re-pin WITH MEASUREMENT [A -> 22/32717 +6,936; B -> 52/69272 = 2 x 6,936; labels + header note; latin1 byte-preserving BOM delta 0] -> re-run PLAYFRAME456 PASS [console 0/0] + pwa491 [dist :5199] SUMMARY 11/11; CLOSE FLOOR E73 = 6,100,000 - 5,542,040 = 557,960 B WITH MEASUREMENT [headroom >= 102,400 B floor -> cut ladder NOT invoked]; AGENTS.md refresh [ship v7 32,499 t / 740,012 B + warship airship + fleet 72,449 t / 3,150,354 B geo [cap 3,080 KB / 73,000 t] + dist chain -> 5,542,040 (I541 ship v7 swap, +158,572) -> 5,542,040 (I542 G73.0 gate, code-only) + CLOSE FLOOR E73 clause + item-6 playframe pin text A 22/32,717 + B 52/69,272]; quality bar 6/6 [1,187/1,187 + build 0 + 5 harnesses EXACT consoles 0/0 + dist 5,542,040 B/184 + vendor 4/4 + BOM delta 0 + hygiene 0 servers/0 tabs/0 stray terminals]; I541 push verified [Schrodinger worker: 6e1cb38..095b4ee -> origin main, ls-remote 095b4ee, Pages HTTP 200, no free-runner block]. E73 CLOSES 4/4. NEXT E74 = user-queued backlog planning [cockpit ship-in-view + crosshair + view-relative controls / mobile PWA landscape D-pad + menu reorg / campaign L5 / WebGPU default switch evaluation / art YouTube research / asteroid craters if GPU budget allows]`;
write('production/timeline.md', tl0 + tlLine + '\n');

// 5. CHANGELOG.md: insert I542 line after the Unreleased anchor
let cl = read('CHANGELOG.md');
const anchor = '## [Unreleased]\r\n';
const ai = cl.indexOf(anchor);
if (ai < 0) throw new Error('changelog: anchor not found');
const clLine = `- I542: The measurement close gate for the new ship passed on every check. One legacy internal check still expected the old smaller ship and initially failed - the gate caught it, we updated that check with the measured numbers, and it passed on re-run. The game itself is unchanged this round: same gameplay, same look, with every internal check now reflecting the new ship. The downloadable bundle stays at 5,542,040 bytes, under the 6.1 MB limit.`;
cl = cl.slice(0, ai + anchor.length) + clLine + '\r\n' + cl.slice(ai + anchor.length);
write('CHANGELOG.md', cl);

// 6. active.md: append I542 line
const acLine = `I542 (ST-508, E73) done: G73.0 close gate - 5 fresh harness runs ALL EXACT [causal495 PASS + causal483 PASS [dev :5173 hardwire, I538 pattern] + playframe491 PASS + playframe483 PASS [after re-pin WITH MEASUREMENT: 22/25781 -> 22/32717 + 52/55400 -> 52/69272, repins542pf.cjs] + pwa491 11/11]; CLOSE FLOOR E73 = 557,960 B WITH MEASUREMENT; AGENTS.md refresh [ship v7 32,499 t / 740,012 B + fleet 72,449 t / 3,150,354 B + dist chain + CLOSE FLOOR E73 + item-6 pin text]; quality bar 6/6 [1,187/1,187 + build 0 + dist 5,542,040 B/184 + vendor 4/4 + BOM delta 0 + hygiene]; I541 push verified [Pages HTTP 200]. E73 CLOSED 4/4. NEXT E74 = user-queued backlog planning`;
write('production/session-state/active.md', ac0 + acLine + '\n');

// 7. AGENTS.md: refresh (CRLF + 1 BOM, all match strings verified unique and quote-free)
let ag = read('AGENTS.md');
ag = rep(ag, `(~2,922 KB (2,991,786 B) / 65,513 tris (I534-I536 remaster, cap 2,925 KB / 66,000 t))`, `(~3,077 KB (3,150,354 B) / 72,449 tris (I541 measurement, cap 3,080 KB / 73,000 t))`, 'agents-fleet');
ag = rep(ag, `: ship v6 `, `: ship v7 `, 'agents-shipv');
ag = rep(ag, `real airship`, `warship airship`, 'agents-airship');
ag = rep(ag, `25,563 tris (I501/ST-467 remaster; v5 17,143 tris superseded)`, `32,499 tris (I541/ST-507 swap; v6 25,563 tris superseded)`, 'agents-shipt');
ag = rep(ag, `-> 5,383,468 (I536 gunship v2, +16,272); CLOSE FLOOR E72 = 716,532 B`, `-> 5,383,468 (I536 gunship v2, +16,272) -> 5,542,040 (I541 ship v7 swap, +158,572) -> 5,542,040 (I542 G73.0 gate, code-only); CLOSE FLOOR E73 = 557,960 B measured at G73.0 (I542: 6,100,000 - 5,542,040; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked); prior: CLOSE FLOOR E72 = 716,532 B`, 'agents-dist');
ag = rep(ag, `(A 22/25,781 + 11/180, B 52/55,400 - re-pinned WITH MEASUREMENT at I501 for ship v6: A 17,361 -> 25,781 = +8,420 ship tris (fx=off single pass); B 38,560 -> 55,400 = +16,840 = 2x (fx=high 2-pass scene); A previously re-pinned at I497 for the I494 r187 ConeGeometry degenerate-tip-tri skip)`, `(A 22/32,717 + 11/180, B 52/69,272 - re-pinned WITH MEASUREMENT at I541 for ship v7: A 25,781 -> 32,717 = +6,936 ship tris (fx=off single pass); B 55,400 -> 69,272 = +13,872 = 2x (fx=high 2-pass scene); A previously re-pinned at I501 for ship v6 and at I497 for the I494 r187 ConeGeometry degenerate-tip-tri skip)`, 'agents-pf');
write('AGENTS.md', ag);

let ok = true;
for (const f of FILES) { const after = bom(f); if (after !== before[f]) { ok = false; console.log('BOM DRIFT ' + f + ': ' + before[f] + ' -> ' + after); } else console.log('BOM ok ' + f + ' = ' + after); }
if (!ok) process.exit(1);
console.log('DOCS542 DONE');
