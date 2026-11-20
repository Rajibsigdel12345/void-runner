// I547 (ST-513, E74): G74.0 close gate bookkeeping - latin1 byte-preserving (template: .evidence/I546/i546docs.cjs).
// Docs-only close gate: epics/stories/iterations/timeline/active. NO CHANGELOG (I531/I542 precedent).
const fs = require('fs');
const path = require('path');
const R = (p) => path.join(__dirname, '..', '..', p);
const read = (f) => fs.readFileSync(R(f), 'latin1');
const write = (f, s) => fs.writeFileSync(R(f), Buffer.from(s, 'latin1'));
const bom = (f) => { const b = fs.readFileSync(R(f)); let c = 0, i = 0; while (i + 2 < b.length && b[i] === 0xEF && b[i + 1] === 0xBB && b[i + 2] === 0xBF) { c++; i += 3; } return c; };
const before = {};
const FILES = ['production/epics.md', 'production/stories.md', 'production/iterations.md', 'production/timeline.md', 'production/session-state/active.md'];
for (const f of FILES) before[f] = bom(f);
const rep = (s, old, neu, tag) => { const n = s.split(old).length - 1; if (n !== 1) throw new Error(tag + ' anchor count ' + n); return s.split(old).join(neu); };
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

// 1. epics.md: ST-513 DONE in Stories line + E74 heading CLOSED + Status line CLOSED + ST-513 appended at EOF tail
let ep = ep0;
ep = rep(ep,
  'ST-513 (I547) G74.0 close gate (5 fresh harnesses EXPECTED EXACT + CLOSE FLOOR E74 re-derived WITH MEASUREMENT + AGENTS.md refresh + bookkeeping + commit/push).',
  'ST-513 (I547) G74.0 close gate - DONE I547 (5 fresh harness runs ALL EXACT [causal495 + causal483 + playframe491 + playframe483 + pwa491, stdout .evidence/I547/*.out] + CLOSE FLOOR E74 = 540,785 B WITH MEASUREMENT + AGENTS.md byte-true-up [asset line 3,150,354 -> 3,212,232 B committed-tree measured, tris 72,449 unchanged; dist chain tail + floor line] + bookkeeping; docs-only, dist 5,559,215 B / 189 byte-identical; E74 CLOSED 5/5).',
  'epics ST-513');
ep = rep(ep,
  '## E74 - Mobile/PWA UX Pass (Menu Reorg + Landscape + Installability) - IN PROGRESS (opened I543)',
  '## E74 - Mobile/PWA UX Pass (Menu Reorg + Landscape + Installability) - CLOSED (opened I543, closed I547 5/5)',
  'epics E74 heading');
ep = rep(ep,
  '- Status: IN PROGRESS (opened I543).',
  '- Status: CLOSED I547 (opened I543, closed I547 5/5; dist 5,559,215 B / 189 WITH measurement; CLOSE FLOOR E74 = 540,785 B).',
  'epics E74 status');
ep = rep(ep,
  'dist 5,559,215 B / 189, vendor 4/4, playframe491 + causal495 + pwa491 11/11 EXACT).',
  'dist 5,559,215 B / 189, vendor 4/4, playframe491 + causal495 + pwa491 11/11 EXACT). ST-513 DONE I547 (G74.0 close gate: 5 fresh harness runs ALL EXACT [causal495 CAUSAL495 PASS dist :4200 / causal483 CAUSAL456 PASS dev :5173 / playframe491 + playframe483 PLAYFRAME456 PASS A 22/32,717 + 11/180, B 52/69,272 / pwa491 SUMMARY 11/11 dist :5199; stdout .evidence/I547/*.out] + CLOSE FLOOR E74 = 540,785 B WITH MEASUREMENT [6,100,000 - 5,559,215, above the 102,400 B floor -> cut ladder C1..C4 NOT invoked] + AGENTS.md refresh [asset-line byte true-up 3,150,354 -> 3,212,232 B measured via .evidence/I547/glb_tris.cjs committed-tree parse, 72,449 tris unchanged; dist chain I544/I545/I546 tail + floor line; playframe pins already current on disk]; docs-only zero src, dist byte-identical; quality bar 6/6).',
  'epics E74 status tail');
write('production/epics.md', ep);

// 2. stories.md: ST-513 PENDING line -> DONE line
const stDone = '- ST-513 E74 G74.0 close gate (I547) - DONE I547: G74.0 close gate shipped - (A) 5 fresh harness runs ALL EXACT via the single managed runner .evidence/I547/run_closegate547.cjs (each server started, verified, KILLed; ports 4173/4200/5173/5199 verified free after): causal495 (dist server :4200) \'CAUSAL495 PASS\' [webgl + default arms EXACT on the seed-9876 pin set; webgpu report-only] + causal483 (dev server :5173) \'CAUSAL456 PASS\' + playframe483 (dev :5173) \'PLAYFRAME456 PASS\' + playframe491 (dev :5173) \'PLAYFRAME456 PASS\' (A 22/32,717 + 11/180, B 52/69,272 EXACT - docs-only, zero tris, NO re-pin) + pwa491 (dist server :5199) \'SUMMARY 11/11\' [SW + manifest + offline boot]; stdout saved .evidence/I547/{causal495,causal483,playframe483,playframe491,pwa491}.out; (B) CLOSE FLOOR E74 = 540,785 B WITH MEASUREMENT (6,100,000 - 5,559,215) >= 102,400 B floor -> cut ladder C1..C4 NOT invoked (prior floors: E73 = 557,960 B at G73.0, E72 = 716,532 B at G72.0); (C) AGENTS.md byte-safe refresh (7,673 -> 8,002 chars / 7,676 -> 8,005 B, BOM 1 preserved; .evidence/I547/agents_update.cjs single-anchor): asset-line true-up 3,150,354 B -> 3,212,232 B / ~3,077 KB -> ~3,137 KB (I547 G74.0 measurement via .evidence/I547/glb_tris.cjs [Node GLB parser summing primitive index/3 over assets/*.glb]: 31 GLB / 72,449 tris EXACT unchanged - the I541 figure was a mid-iteration pre-final-swap byte measurement, +61,878 B gap = ship v7 final-export delta; git status assets/ clean = working tree == HEAD) + quality bar #4 dist chain tail (-> 5,544,996 I544 +2,956 / -> 5,548,452 I545 +3,456 / -> 5,559,215 I546 +10,763 [I547 byte-identical, 189 files]) + CLOSE FLOOR E74 line (E73 floor demoted to prior); probe (.evidence/I547/agents_probe2/3.cjs) confirmed on-disk playframe pins already current (22/32,717 + 52/69,272, re-pinned I541; the on-file 55,400 hit is the legitimate I541 re-pin note B 55,400 -> 69,272) -> no playframe edit. dist 5,559,215 B / 189 byte-identical to I546 (docs-only). Closes E74 5/5 (ST-509 I543 / ST-510 I544 / ST-511 I545 / ST-512 I546 / ST-513 I547). quality bar 6/6 (tests 1,201/1,201, build 0, smoke N/A zero render surface [I542/I543 close-gate precedent], dist 5,559,215 B < 6,100,000 B ceiling + floor 540,785 B, vendor 4/4 EXACT, 5 harnesses fresh EXACT).';
write('production/stories.md', rep(st0,
  '- ST-513 E74 G74.0 close gate (I547) - PENDING/E74 (5 fresh harnesses EXPECTED EXACT [causal495 + causal483 + playframe491 + playframe483 + pwa491] + CLOSE FLOOR E74 re-derived WITH MEASUREMENT [floor >= 102,400 B or cut ladder C1..C4] + AGENTS.md refresh + bookkeeping + commit + push delegate)',
  stDone, 'stories ST-513'));

// 3. iterations.md: append the I547 block (no trailing NL)
const iterBlock = [
'## I547 (ST-513, E74): G74.0 close gate WITH MEASUREMENT - 5 fresh harnesses ALL EXACT + CLOSE FLOOR E74 = 540,785 B + AGENTS.md byte-true-up - E74 CLOSED 5/5',
'- Goal (ST-513): close E74 at G74.0: (a) 5 fresh regression harness runs EXPECTED EXACT (causal495 + causal483 + playframe491 + playframe483 + pwa491); (b) CLOSE FLOOR E74 re-derived WITH MEASUREMENT (6,100,000 - measured dist; floor >= 102,400 B else cut ladder C1..C4); (c) AGENTS.md refresh (stale byte/number true-ups); (d) bookkeeping + commit + push delegate. Docs-only iteration: zero src, zero 3D surface -> pins stay EXACT, no re-pin.',
'- Pre-state: local main = origin/main = 9fb345c (I546, pushed + deployed; worker Turing verified fast-forward 87c065d..9fb345c + Pages HTTP 200 with the I546 marker apple-mobile-web-app-capable; tree clean except untracked COMMITMSG.txt, never staged).',
'- Changed: docs-only. AGENTS.md (7,673 -> 8,002 chars / 7,676 -> 8,005 B, BOM 1 preserved; 2 single-anchor byte-safe edits via .evidence/I547/agents_update.cjs) + production/epics.md (ST-513 DONE in Stories line + E74 heading CLOSED + Status CLOSED 5/5 + ST-513 DONE appended) + production/stories.md (ST-513 PENDING -> DONE) + production/iterations.md (this block) + production/timeline.md + production/session-state/active.md. .evidence/I547 force-added (run_closegate547.cjs 5-step runner + 5 harness .out + glb_tris.cjs + agents_probe2/3.cjs + agents_update.cjs + prod_probe2-7.cjs + i547docs.cjs).',
'- Gate evidence (measured): (1) npm test 1,201/1,201. (2) npm run build 0; dist 5,559,215 B / 189 files = BYTE-IDENTICAL to I546 (docs-only). (3) Browser smoke N/A (zero render surface; I542/I543 close-gate precedent). (4) CLOSE FLOOR E74 = 540,785 B (6,100,000 - 5,559,215, WITH MEASUREMENT) >= 102,400 B floor -> cut ladder C1..C4 NOT invoked. (5) vendor r187 pins EXACT 4/4 (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017). (6) 5 fresh harness runs ALL EXACT (single managed runner; each server started + verified + KILLed; ports verified free after): causal495 (dist :4200) CAUSAL495 PASS; causal483 (dev :5173) CAUSAL456 PASS; playframe483 + playframe491 (dev :5173) PLAYFRAME456 PASS (A 22/32,717 + 11/180, B 52/69,272 EXACT - NO re-pin); pwa491 (dist :5199) SUMMARY 11/11. Stdout: .evidence/I547/{causal495,causal483,playframe483,playframe491,pwa491}.out.',
'- AGENTS.md findings (probed, not re-derived): the on-disk file (already refreshed at I541/I538) is FRESHER than the environment-context copy - playframe pins on disk already 22/32,717 + 52/69,272 (the stale 22/25,781 + 52/55,400 exists only in the environment copy) -> NO playframe edit; the 55,400 hit in the file is the legitimate I541 re-pin note (B 55,400 -> 69,272 = +13,872 = 2x). Asset line was stale on BYTES: measured committed-tree reality (glb_tris.cjs) = 31 GLB / 3,212,232 B / 72,449 t; tris EXACT match, bytes +61,878 vs the I541 figure = ship v7 final-export delta (I541 number measured pre-final-swap).',
'- Bookkeeping: iterations.md + stories.md (ST-513 DONE) + epics.md (ST-513 DONE + E74 CLOSED 5/5) + timeline.md + active.md. NO CHANGELOG (docs-only close gate; I531/I542 precedent).',
'- Next: I548 = open the post-E74 epic E75 (research + scope check first, per house rules). User verbatim queue: cockpit FPV critique (show a portion of the ship in cockpit view + crosshair instead of the bearing line + FPV control mapping fix - user reported W moves back / S moves forward / a key moves right; E71 shipped view-relative at I528-I531, verify in browser first before assuming a bug); camera framing (far away the player cannot see the way back; same view angle wherever the ship moves; research via YouTube MCP + web); content (more enemies, level 5, boss variety; linear levels step by step); asteroid/comet bumps + craters ONLY if the GPU/compute budget allows (user explicit condition - measure first); Blender 5.2.3 headless art pass grounded in research (user: watch content, extract only useful findings, do not over-engineer).'
].join('\r\n');
write('production/iterations.md', it0 + '\r\n\r\n' + iterBlock);

// 4. timeline.md: append the I547 line (trailing NL)
const tlLine = 'I547 (ST-513, E74) - G74.0 close gate WITH MEASUREMENT: 5 fresh harness runs ALL EXACT (causal495 CAUSAL495 PASS dist :4200 / causal483 CAUSAL456 PASS dev :5173 / playframe483 + playframe491 PLAYFRAME456 PASS A 22/32,717 + 11/180, B 52/69,272 [NO re-pin, docs-only] / pwa491 SUMMARY 11/11 dist :5199; stdout .evidence/I547/*.out) + CLOSE FLOOR E74 = 540,785 B WITH MEASUREMENT (6,100,000 - 5,559,215; floor OK -> cut ladder C1..C4 NOT invoked) + AGENTS.md byte-safe refresh (asset-line 3,150,354 -> 3,212,232 B committed-tree measured [72,449 tris unchanged], dist chain I544/I545/I546 tail + floor line); dist 5,559,215 B / 189 byte-identical (docs-only zero src); quality bar 6/6 (tests 1,201/1,201, build 0, smoke N/A zero render surface, vendor 4/4); E74 CLOSED 5/5; NEXT I548 (open E75: cockpit FPV critique + camera framing + content/art, scope check first)';
write('production/timeline.md', tl0 + tlLine + '\n');

// 5. active.md: append the I547 line (trailing NL)
const acLine = 'I547 (ST-513, E74) done: E74 is CLOSED 5/5 - all four mobile/PWA stories shipped (I543-I546: menu reorg, landscape pass, PWA install hardening) and the close gate (I547) passed with 5 fresh harness runs all exact and a measured CLOSE FLOOR E74 = 540,785 B of headroom under the 6.1 MB ceiling. Docs-only round: no game code changed, dist byte-identical (5,559,215 B / 189), tests 1,201/1,201, vendor pins 4/4. NEXT I548: opening the next epic (E75) with a research-first scope check - the cockpit first-person view polish (ship visible in the cockpit, crosshair, control mapping), camera framing so the view stays consistent at distance, more enemies + new levels/bosses, and a Blender art pass (asteroid bumps/craters only if the GPU budget allows).';
write('production/session-state/active.md', ac0 + acLine + '\n');

let ok = true;
for (const f of FILES) { const after = bom(f); if (after !== before[f]) { ok = false; console.log('BOM DRIFT ' + f + ': ' + before[f] + ' -> ' + after); } else console.log('BOM ok ' + f + ' = ' + after); }
if (!ok) process.exit(1);
console.log('DOCS547 DONE');