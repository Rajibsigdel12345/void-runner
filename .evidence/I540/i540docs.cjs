// I540 (ST-506, E73): bookkeeping - latin1 byte-preserving, per-file line endings (template: .evidence/I539/i539docs.cjs).
// Preflight asserts the known end-state of each file; BOM count verified delta-0. All new content pure ASCII.
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
// preflight end-state
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

// --- 1. epics.md: E73 Stories line + Status line (CRLF, no trailing NL kept) ---
let ep = ep0;
ep = rep(ep, 'ST-506 (I540) ship v7 Blender build (TEMP GLB, no swap).', 'ST-506 (I540) ship v7 Blender build - DONE I540 (build 33,882 t / GLB 32,499 t / 740,012 B; all gates + P1 airship read PASSED incl. REAR34; TEMP .evidence/I540/ship_v7.glb, no swap).', 'epics-stories');
ep = rep(ep, 'do not consume Actions minutes).', 'do not consume Actions minutes). ST-506 DONE I540 (ship v7 "warship airship" built in Blender 5.2.3 headless: build 33,882 t in-Blender / GLB 32,499 t / 740,012 B; min-y -0.392 / span 4.021 / len 2.600 / bow +1.300; FACET hull 0.4603/0.8009/1.3020 wings 0.3891/0.9271/1.5464; EEVEE audit P1 airship read PASSED incl. rear34 chase cam; TEMP GLB, NO swap - ST-507 does the swap + re-pins WITH MEASUREMENT).', 'epics-status');
write('production/epics.md', ep);

// --- 2. stories.md: ST-506 line PENDING -> DONE (LF) ---
const stOld = '- ST-506 E73 BLENDER ship v7 build (I540) - PENDING/E73 (build_ship_v7.py from the build_ship_v6.py helper set; per-node aim/cap: Hull 15,000/17,500 + Wings 3,600/4,400 + Engine 5,800/6,800 + Nozzle 2,600/3,100 + Cockpit 2,600/3,300 + Fin 2,400/3,000 = aim 32,000 t / hard cap 36,000 t; gates: min-y >= -0.400, span 3.6..4.4, len 2.34..2.86, mouth band contains z=-0.8, 3 mats, 2 COLOR_0 prims, file <= 800,000 B; EEVEE audit 4 views x clay + tint + front/rear sil96 viewed; sil96 gate = reads as AIRSHIP at 96 px incl. rear; TEMP GLB only - no swap)';
const stNew = '- ST-506 E73 ship v7 Blender build (I540) - DONE I540 (Blender 5.2.3 headless; TEMP .evidence/I540/ship_v7.glb, no swap): build gates ALL PASS run 14 [33,882 t [hull 15,604 / wings 4,120 / cockpit 2,754 / fin 2,698 / engine 5,844 / nozzle 2,862] <= 36,000 hard cap [TOTAL_WARN > 32,000 aim ok] / min-y -0.392 >= -0.400 [belly-gate fix] / span 4.021 in 3.6..4.4 / len 2.600 in 2.34..2.86 / bow +1.300 / 6 nodes / 3 mats / 2 COLOR_0 prims / greebles 220]; GLB probe [test-verbatim, ST-507 re-pin values] 32,499 t / hull 14,351 / wings 3,995 / FACET hull 0.4603-0.8009-1.3020 + wings 0.3891-0.9271-1.5464 / 740,012 B [<= 800,000 B aim, <= 850,000 B tripwire]; EEVEE audit 10 renders P1 airship read PASSED incl. REAR34 chase cam ACCEPTED; density history [engine bevel 68 deg / cooling-fin 16 + 12 / aft subdiv band y > 1.15 / nozzle subdiv removed entirely [no displace - pure +1,776 t cost, zero visual] / belly rib offset 0.006]';
let st = st0;
st = rep(st, stOld, stNew, 'stories-st506');
write('production/stories.md', st);

// --- 3. iterations.md: append I540 section (CRLF, no trailing NL kept) ---
const iterBlock = [
'## I540 (ST-506, E73): ship v7 "warship airship" Blender build (Blender 5.2.3 headless; TEMP GLB, no swap) - ALL GATES PASS + P1 airship read PASSED',
'- Goal (ST-506): per the E73 brief (I539 research A1-A6 + per-node aim/cap), build ship v7 in Blender 5.2.3 headless: a taller ovoid riveted hull (fixes D1 flat slab: height 24% -> ~50% of span), an engine BAY (2 strut-mounted sponson nacelles + centerline engine stack with cooling-fin rings - D4), a raised command tower/cockpit above the hull top (D3), a twin-fin tail assembly (D5), and an organized two-level deck + 220 greebles (D2/D6). TEMP GLB in .evidence/I540/ only - NO swap (that is ST-507/I541).',
'- Build (.evidence/I540/build_ship_v7.py, from the .evidence/I501/build_ship_v6.py helper set; runs 1-14 logged in runN.log; density-tuning patches 6-14 via the latin1 .cjs patcher): riveted segmented hull (former ribs + 151 greebles), 2 sponson nacelles on struts + centerline engine stack with cooling-fin rings, raised command tower with canopy dome, twin fins, two-level deck. Density decisions (the history that got to the final numbers): engine bevel pass-1 45 -> 68 deg (45 deg selected 1,432 edges -> 11,338 t; saturated at ~90 deg edges - 60 vs 68 identical); cooling-fin ring sides 24 -> 16 central / 16 -> 12 sponson; engine aft subdiv band y > 1.00 -> y > 1.15; NOZZLE subdiv removed entirely (the nozzle has NO displace call - the subdiv was pure +1,776 t cost, zero visual effect); BELLY-GATE FIX (patch 14, the last blocker): hull former-rib belly cell (ci=9, th 270 deg) - the decagon chord normal there is (0.29, -0.958) not (0, -1), so the rib seat offset 0.012 pushed the bottom to z -0.4038 < gate -0.399 -> belly cells (nz < -0.8) use offset 0.006 / height 0.008 instead of 0.012 / 0.014; min-y now -0.3921.',
'- Build gates (in-Blender domain, run 14 ALL_DONE): per-node tris hull 15,604 / wings 4,120 / cockpit 2,754 / fin 2,698 / engine 5,844 / nozzle 2,862 = TOTAL 33,882 (hard cap <= 36,000 PASS; > 32,000 aim = TOTAL_WARN only, fine); min-y -0.392 >= -0.400 PASS (per-part ZMIN: hull -0.3921 / wings -0.0565 / cockpit 0.67 / fin -0.345 / engine -0.1539 / nozzle -0.085); span_x 4.021 in [3.60, 4.40] PASS; length 2.600 in [2.34, 2.86] PASS; bow +1.300 (nozzle mouth >= 1.299 PASS); 6 nodes / 3 materials / COLOR_0 on exactly 2 prims (Hull + Wings) PASS; greebles 220 (Hull 151 / Wings 8 / Cockpit 13 / Fin 8 / Engine 23 / Nozzle 17).',
'- GLB probe (test domain - mirrors the green tests verbatim; these are the ST-507 re-pin values): total 32,499 t; per-node hull 14,351 / wings 3,995 / cockpit 2,754 / fin 2,693 / engine 5,844 / nozzle 2,862 (the exporter drops 1,383 t on Hull/Wings/Fin with "Mesh is not valid" warnings - known + benign, v6 shipped on the same pipeline); FACET (GLB probe, for the SHIP_FACET re-pin): hull p10/50/90 = 0.4603 / 0.8009 / 1.3020 (spread 0.8417); wings = 0.3891 / 0.9271 / 1.5464 (spread 1.1572); GLB = 740,012 B (<= 800,000 B aim + <= 850,000 B tripwire PASS).',
'- EEVEE audit (.evidence/I540/audit540.py, Blender 5.2.3 headless, EEVEE 960x540): 10 renders - 4 views (front / rear34 / side / f34) x clay + tint + front/rear sil96. AUDIT line: meshes=6 tris=32499 (matches the GLB probe). P1 gate PASSED ON VIEWED RENDERS: front = riveted ovoid hull + raised command tower + wing roots; side = tall riveted airship profile, engine nacelle with cooling rings, dark canopy dome, fin; REAR34 (the chase cam) = riveted plating + 2 strut nacelles + centerline engine cluster + twin fins - reads as a WARSHIP AIRSHIP, not a blob/slab. ACCEPTED.',
'- Quality bar 6/6 MEASURED (Blender-build iter - zero src change -> dist MUST stay byte-identical): (1) npm test 1,187/1,187. (2) npm run build 0. (3) Browser smoke N/A (no rendering change). (4) dist byte-identical 5,383,468 B / 184 (under the 6,100,000 B ceiling; headroom 716,532 B). (5) vendor r187 pins EXACT 4/4 (three.module A65DE049A7F38B40 / core 7AB0784CD2532367 / webgpu F549248412C62B9A / tsl 7FF9ACF50F006017). (6) BOM delta 0 + hygiene (0 servers on 5173/4200/5199/4173, 0 browser tabs, 0 stray terminals - audit session 13866 confirmed done).',
'- Bookkeeping: iterations.md + stories.md (ST-506 -> DONE I540) + epics.md (E73 Stories + Status lines) + timeline.md + CHANGELOG.md [Unreleased] + active.md. .evidence/I540 force-added (build_ship_v7.py + patch scripts + run logs 1-14 + ship_v7.glb + audit540.py + 10 PNGs + probe).',
'- Next: I541 = ST-507 (swap assets/ship.glb v6 -> v7 + re-pins WITH MEASUREMENT: assetGlbs BUDGETS.ship 25,563 -> 32,499 + SHIP_FACET hull 0.4603/0.8009/1.3020 wings 0.3891/0.9271/1.5464; assetPerf totalTris 65,513 -> 72,449 + totalGeoKB + totalFilesKB + perFileKB [740,012 B > 614,400 B threshold]; playframe491/483 A + B re-pins WITH MEASUREMENT [expected A ~ 25,781 + 6,936 ship-tri delta - measured governs, B = 2x]; runtime smoke console clean no NaN) -> I542 = ST-508 (G73.0 close gate + AGENTS.md refresh).'
].join('\r\n');
write('production/iterations.md', it0 + '\r\n\r\n' + iterBlock);

// --- 4. timeline.md: append I540 line (LF) ---
const tlLine = 'I540 (ST-506, E73) - ship v7 "warship airship" Blender build [Blender 5.2.3 headless; TEMP GLB, no swap]: build_ship_v7.py [build_ship_v6.py helper set; density-tuning patches 6-14]: riveted segmented ovoid hull [former ribs + 151 greebles; height now ~50% of span, was 24% = D1 fixed] + engine bay [2 strut-mounted sponson nacelles + centerline engine stack with cooling-fin rings] + raised command tower [canopy dome] + twin-fin tail + two-level deck [greebles 220]; build gates ALL PASS run 14 [per-node 15604/4120/2754/2698/5844/2862 = 33,882 t <= 36,000 hard cap [TOTAL_WARN > 32,000 aim ok] / min-y -0.392 >= -0.400 [belly-gate fix: former-rib belly cell offset 0.012 -> 0.006 after the decagon-chord-normal push] / span 4.021 in 3.6..4.4 / len 2.600 in 2.34..2.86 / bow +1.300 / 6 nodes / 3 mats / COLOR_0 on exactly 2 prims]; density decisions [engine bevel 45 -> 68 deg [saturates at ~90 deg edges] / cooling-fin sides 24 -> 16 + 16 -> 12 / aft subdiv band y > 1.00 -> 1.15 / nozzle subdiv removed entirely [no displace call - pure +1,776 t cost, zero visual effect]]; GLB probe [test-verbatim; ST-507 re-pin values] 32,499 t [hull 14,351 / wings 3,995 / cockpit 2,754 / fin 2,693 / engine 5,844 / nozzle 2,862; exporter drops 1,383 t on Hull/Wings/Fin - known benign "Mesh is not valid" warnings, v6 same] + FACET hull 0.4603/0.8009/1.3020 [spread 0.8417] + wings 0.3891/0.9271/1.5464 [spread 1.1572] + 740,012 B [<= 800,000 B aim / <= 850,000 B tripwire]; EEVEE audit 10 renders [4 views x clay + tint + front/rear sil96; AUDIT meshes=6 tris=32499 matches probe] -> P1 gate PASSED ON VIEWED RENDERS [reads as a WARSHIP AIRSHIP at 96 px incl. REAR34 chase cam - riveted plating, strut nacelles, engine cluster, twin fins] ACCEPTED; quality bar 6/6 [1,187/1,187 + build 0 + dist byte-identical 5,383,468 B/184 + vendor 4/4 + BOM delta 0 + hygiene 0 servers/0 tabs/0 stray terminals]. NEXT I541 = ST-507 swap + re-pins WITH MEASUREMENT [assetGlbs BUDGETS.ship -> 32,499 + SHIP_FACET; assetPerf totalTris -> 72,449 + totalGeoKB + totalFilesKB + perFileKB; playframe A + B WITH MEASUREMENT; runtime smoke console clean]';
write('production/timeline.md', tl0 + tlLine + '\n');

// --- 5. CHANGELOG.md: insert I540 line after "## [Unreleased]" (CRLF, 7 BOMs preserved) ---
let cl = read('CHANGELOG.md');
const anchor = '## [Unreleased]\r\n';
const ai = cl.indexOf(anchor);
if (ai < 0) throw new Error('changelog: anchor not found');
const clLine = '- I540: Built the new ship. In Blender we modeled the full "warship airship": a tall riveted hull (no more flat slab), an engine bay with two side nacelles on struts and a centerline engine cluster with cooling fins, a raised command tower, a twin-fin tail, and an organized deck with 220 small surface details. It passed every engineering gate (overall size, height, engine placement, file size) and the visual audit - at small sizes, including the chase-cam angle, it clearly reads as an airship. The model is verified but not in the game yet: the next iteration swaps it in and updates the pinned measurements. No gameplay changes this round.';
cl = cl.slice(0, ai + anchor.length) + clLine + '\r\n' + cl.slice(ai + anchor.length);
write('CHANGELOG.md', cl);

// --- 6. active.md: append I540 line (LF) ---
const acLine = 'I540 (ST-506, E73) done: ship v7 "warship airship" Blender build (Blender 5.2.3 headless; TEMP GLB, no swap): build gates ALL PASS run 14 [in-Blender 33,882 t [hull 15,604 / wings 4,120 / cockpit 2,754 / fin 2,698 / engine 5,844 / nozzle 2,862] <= 36,000 hard cap [TOTAL_WARN > 32,000 aim ok] / min-y -0.392 >= -0.400 [belly-gate fix patch 14: rib seat offset 0.012 -> 0.006 on nz < -0.8 cells after the decagon-chord-normal diagnosis] / span 4.021 / len 2.600 / bow +1.300 / 6 nodes / 3 mats / 2 COLOR_0 prims / greebles 220]; GLB probe [ST-507 re-pin values] 32,499 t / hull 14,351 / wings 3,995 / FACET hull 0.4603/0.8009/1.3020 + wings 0.3891/0.9271/1.5464 / 740,012 B [<= 800,000 B aim / <= 850,000 B tripwire; exporter drops 1,383 t Hull/Wings/Fin - known benign]; density history [engine bevel 68 deg / cooling-fin 16 + 12 / aft band y > 1.15 / nozzle subdiv removed entirely [pure +1,776 t, zero visual]]; EEVEE audit 10 renders P1 airship read PASSED incl. REAR34 chase cam ACCEPTED; quality bar 6/6 [1,187/1,187 + build 0 + dist byte-identical 5,383,468 B/184 + vendor 4/4 + BOM delta 0 + hygiene 0 servers/0 tabs/0 stray terminals]. NEXT I541 = ST-507 swap + re-pins WITH MEASUREMENT';
write('production/session-state/active.md', ac0 + acLine + '\n');

// --- verify BOM delta 0 ---
let ok = true;
for (const f of FILES) { const after = bom(f); if (after !== before[f]) { ok = false; console.log('BOM DRIFT ' + f + ': ' + before[f] + ' -> ' + after); } else console.log('BOM ok ' + f + ' = ' + after); }
if (!ok) process.exit(1);
console.log('DOCS540 DONE');
