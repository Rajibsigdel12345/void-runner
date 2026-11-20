// I548 (ST-514, E75): E75 open/research/scope bookkeeping - latin1 byte-preserving (template: .evidence/I547/i547docs.cjs).
// Docs-only open/scope iteration: append-only (E75 to epics, ST-514..521 to stories, I548 block to iterations, one line each to timeline/active). NO CHANGELOG (docs-only open/scope; I543 precedent).
const fs = require('fs');
const path = require('path');
const R = (p) => path.join(__dirname, '..', '..', p);
const read = (f) => fs.readFileSync(R(f), 'latin1');
const write = (f, s) => fs.writeFileSync(R(f), Buffer.from(s, 'latin1'));
const bom = (f) => { const b = fs.readFileSync(R(f)); let c = 0, i = 0; while (i + 2 < b.length && b[i] === 0xEF && b[i + 1] === 0xBB && b[i + 2] === 0xBF) { c++; i += 3; } return c; };
const FILES = ['production/epics.md', 'production/stories.md', 'production/iterations.md', 'production/timeline.md', 'production/session-state/active.md'];
const expectBom = { 'production/epics.md': 3, 'production/stories.md': 5, 'production/iterations.md': 5, 'production/timeline.md': 3, 'production/session-state/active.md': 0 };
const before = {};
for (const f of FILES) {
  before[f] = bom(f);
  if (before[f] !== expectBom[f]) throw new Error('BOM-before mismatch ' + f + ': got ' + before[f] + ' expected ' + expectBom[f]);
}
const ep0 = read('production/epics.md');
if (ep0.endsWith('\n')) throw new Error('epics: expected no trailing NL');
if (ep0.includes('## E75')) throw new Error('epics: E75 section already present');
if (!ep0.split('\n').pop().includes('CLOSED I547')) throw new Error('epics: last line is not the I547 close line');
const st0 = read('production/stories.md');
if (!st0.endsWith('\n')) throw new Error('stories: expected trailing NL');
if (st0.includes('ST-514')) throw new Error('stories: ST-514 already present');
const it0 = read('production/iterations.md');
if (it0.endsWith('\n')) throw new Error('iterations: expected no trailing NL');
if (it0.includes('## I548')) throw new Error('iterations: I548 already present');
const tl0 = read('production/timeline.md');
if (!tl0.endsWith('\n')) throw new Error('timeline: expected trailing NL');
if (tl0.includes('I548 (ST-514')) throw new Error('timeline: I548 line already present');
const ac0 = read('production/session-state/active.md');
if (!ac0.endsWith('\n')) throw new Error('active: expected trailing NL');

// 1. epics.md: append the E75 section (LF-joined, no trailing NL; ep0 has no trailing NL)
const E75 = [
'## E75 - Campaign Expansion + Camera/Cockpit Polish - IN PROGRESS (opened I548)',
'- Goal: the post-E74 verbatim queue - cockpit FPV polish (ship visible in-frame + crosshair + control labels/mapping) + consistent-at-distance camera framing + more enemies + a 5th linear level + a final boss + asteroid/comet bumps/craters (gated on GPU/compute budget). The I548 measured audit confirmed most of the camera/FPV/enemy-ART asks are ALREADY SHIPPED (E71 cockpit/crosshair/view-relative I528-I531, E72 enemy-art I532-I538, E73 ship v7 I539-I542, E74 menu/landscape/PWA I543-I547) - so E75 = D1 verify-then-polish camera/cockpit / D2 level-5 data / D3 2 NEW enemy ships / D4 L5 boss / D5 gated asteroid remaster. Blender 5.2.3 headless for the D3/D4/D5 assets.',
'- Research: design/e75-expansion-research.md (I548: measured audit sec.1 [camera/cockpit shipped-vs-residuals G-a/G-b/G-c; campaign level.js data-driven; per-asset enemy+boss 31 GLB / 3,212,232 B / 72,449 t; asteroid 227,300 B / 9,140 t; asset cap 99.2% tri; dist 5,559,215 B] + LABELED research CAM-1..8 / BOSS-1..3 / AST-1..3 sec.2 + pre-registered D1-D5 sec.3 + story map ST-514..ST-521 sec.4 + risks K1-K7 sec.5 + pin-safety sec.6 + verification + dist policy [7,400,000 B ceiling PRE-REGISTERED WITH MEASUREMENT, applied at first asset landing ST-518] sec.7) + production/scope-check-E75.md.',
'- Stories: ST-514 (I548) open/research/scope - DONE I548 (docs-only zero src - measured audit + LABELED research + D1-D5 + scope check + 7,400,000 B ceiling pre-registered). ST-515 (I549) D1a headless verification harness + screenshots + NDC probes (cockpit/chase/overview + V-switch snap-vs-damp) - PENDING. ST-516 (I550) D1b cockpit/camera polish for measured gaps (mode-specific labels + damped switch-if-snap + nose/crosshair tuning-if-gap + control-mapping fix-if-confirmed) - PENDING. ST-517 (I551) D2 Level 5 data (config row + 4 dhue-checked palettes + campaignBoss[5] + i18n en/zh/ja + tests) - PENDING. ST-518 (I552) D3 2 new enemy ships (Blender, sil96 + re-pin WITH MEASUREMENT) - PENDING [FIRST E75 asset landing -> 7,400,000 B ceiling applies]. ST-519 (I553) D4 L5 boss (new kind + Blender mesh + campaignBoss extension + re-pin) - PENDING. ST-520 (I554) D5 asteroid/comet remaster (gated: displacement only if probe holds budget, else canvas fallback / skip) - PENDING. ST-521 (I555) G75.0 close gate - PENDING.',
'- Constraints: D1 = NO sim change, verify-then-polish only (no speculative control-mapping inversion); D2/D4 = pure data + level.js + campaignBoss extension, endless bit-identical (E64); D3/D4/D5 = Blender 5.2.3 headless + E72 sil96/render-audit gate + re-pin WITH MEASUREMENT; D5 GATED on the ST-520 headless GPU/compute probe (verbatim user condition); NO webgpu-default change (I495 C3 stays WebGL2-default; D5 probes both arms); vendor r187 UNCHANGED (4/4); i18n 3 locales (ST-375, CJK byte pipeline).',
'- Cut ladder (scope-check): C1 drop L5 boss mesh (keep retinted monolith) ~-300 KB / C2 D3 -> 1 new enemy ~-220 KB / C3 D5 displacement -> canvas craters ~-150-400 KB / C4 L5 -> 3 zones ~-a few KB.',
'- Risks: K1 dist ceiling (E75 growth exceeds 6.1 MB by measurement -> 7,400,000 B PRE-REGISTERED WITH MEASUREMENT, applied at first asset landing) / K2 tri budget (fleet at 99.2% of 73,000 t; D5 gated; asset cap re-derived WITH MEASUREMENT at G75.0) / K3 pin safety (re-pin only on a real mesh change, WITH MEASUREMENT; endless bit-identical) / K4 control-mapping false positive (verify in-browser first) / K5 i18n CJK byte pipeline / K6 over-engineering (verify-then-polish, 2 ships not a re-remaster, D5 gated) / K7 webgpu (dual arm, no default change).',
'- Status: IN PROGRESS (opened I548).'
].join('\n');
write('production/epics.md', ep0 + '\n\n' + E75);

// 2. stories.md: append ST-514..ST-521 (st0 ends in a single NL)
const ST = [
'- ST-514 E75 open/research/scope (I548) - DONE I548: E75 opened RESEARCH-FIRST - measured audit (design/e75-expansion-research.md sec.1: camera/cockpit shipped-vs-residuals G-a mode-agnostic labels / G-b V-switch damp-vs-snap unverified / G-c cockpit nose+crosshair+WASD never NDC-pinned; campaign level.js data-driven isFinalLevel=level>=levelCount so a 5th row makes L5 final; per-asset table 31 GLB / 3,212,232 B / 72,449 t; asteroid 7 files 227,300 B / 9,140 t smooth rocks; asset tri cap 99.2% of 73,000 t; dist 5,559,215 B / 189) + LABELED research (CAM-1..8 [incl CAM-5 damped mode-switch 1-exp(-7dt) + CAM-4 named framing override], BOSS-1..3 [telegraph->danger->safety + posture read], AST-1..3 [displacement=tri-heavy vs AST-2 shader=0 tris]) + pre-registered D1 verify-then-polish / D2 level-5 data / D3 2 NEW enemies / D4 L5 boss / D5 gated asteroid + story map ST-514..ST-521 + risks K1-K7 + dist policy [7,400,000 B ceiling PRE-REGISTERED WITH MEASUREMENT, applied at first asset landing ST-518; code-only stays under 6.1 MB floor 540,785 B] + production/scope-check-E75.md; docs-only zero src - dist 5,559,215 B / 189 byte-identical, vendor 4/4, pins EXPECTED EXACT.',
'- ST-515 E75 D1a camera/cockpit headless verification harness (I549) - PENDING/E75 (screenshots + NDC probes: cockpit [crosshair visible? nose in frame? W=fwd S=back A/D screen-relative] / chase [center vs rim framing invariant] / overview + V-key mode switch snap-vs-damp measurement -> measured gap list; test-only zero dist change)',
'- ST-516 E75 D1b cockpit/camera polish fixes (I550) - PENDING/E75 (apply only measured gaps: mode-specific control labels [cockpit W=FWD MOUSE=TURN] + damped mode switch IF measured to snap + nose/crosshair tuning IF NDC gap + control-mapping fix ONLY IF probe confirms the w-moves-back report is a real bug; no sim change, no speculative inversion)',
'- ST-517 E75 D2 Level 5 data (I551) - PENDING/E75 (config 5th level row + 4 dhue-checked zone palettes + campaignBoss.hp/phases/score[5] + i18n level.name.l5 + level.zone.l5z1..z4 en/zh/ja byte-verified + tests; pure data + level.js, endless bit-identical)',
'- ST-518 E75 D3 2 new enemy ships (I552) - PENDING/E75 (Blender 5.2.3 headless, E72 per-ship brief + render-audit + sil96 gate, asset swap + re-pin playframe/casual WITH MEASUREMENT; FIRST E75 ASSET LANDING -> 7,400,000 B ceiling applies)',
'- ST-519 E75 D4 Level 5 boss (I553) - PENDING/E75 (NEW bossKind + detailed final-boss Blender mesh [upgrading the 398 t retinted monolith] + campaignBoss.js extension [new palette + move tier + 2-3 phase cycle per BOSS-1/2/3] + asset swap + re-pin WITH MEASUREMENT; L5 row from ST-517 references this kind)',
'- ST-520 E75 D5 asteroid/comet remaster GATED (I554) - PENDING/E75 (displacement bumps+craters AST-1 ONLY if headless GPU/compute probe [FPS + draw calls + tris before/after, fx=off + fx=high] holds budget AND a re-registered tri cap; else AST-2 canvas/shader craters [0 new tris] or skip; re-pin WITH MEASUREMENT if tris change; verbatim gate "only if its gpu and compute heavy")',
'- ST-521 E75 G75.0 close gate (I555) - PENDING/E75 (5 fresh harnesses EXPECTED EXACT [causal495 + causal483 + playframe491 + playframe483 + pwa491] + CLOSE FLOOR E75 re-derived WITH MEASUREMENT + AGENTS.md refresh + asset byte/tri budget re-derived WITH MEASUREMENT + bookkeeping + commit + push delegate)'
].join('\n') + '\n';
write('production/stories.md', st0 + ST);

// 3. iterations.md: append the I548 block (CRLF-joined, no trailing NL; it0 has no trailing NL)
const BLOCK = [
'## I548 (ST-514, E75): E75 open/research/scope WITH MEASUREMENT - measured audit + LABELED research + D1-D5 + 7,400,000 B ceiling PRE-REGISTERED',
'- Goal (ST-514): open the post-E74 epic E75 research-first (house rules): (a) measured audit of camera/cockpit, campaign, enemy/boss, asteroid/dist state; (b) LABELED research grounding the open verbatim queue; (c) pre-register D1-D5 + a story map + the dist/asset budget (new 7,400,000 B dist ceiling PRE-REGISTERED WITH MEASUREMENT because E75 asset growth provably exceeds the 6,100,000 B ceiling). Docs-only: zero src, zero 3D, zero Blender -> pins EXACT, no re-pin.',
'- Pre-state: local main = origin/main = e5949b9 (I547, E74 CLOSED 5/5, pushed + deployed; worker Beauvoir verified fast-forward 9fb345c..e5949b9 + Pages HTTP 200 with I546 marker apple-mobile-web-app-capable; tree clean except untracked COMMITMSG.txt, never staged).',
'- Changed: docs-only. NEW design/e75-expansion-research.md (22,063 B, LF no BOM) + NEW production/scope-check-E75.md (6,093 B, CRLF + BOM) + production/epics.md (+E75 IN PROGRESS, ST-514 DONE, ST-515..521 PENDING) + production/stories.md (+ST-514 DONE + ST-515..521 PENDING) + production/iterations.md (this block) + production/timeline.md + production/session-state/active.md. .evidence/I548 force-added (i548docs.cjs + glb_tris.cjs + run_closegate548.cjs + 5 harness .out).',
'- Measured audit (evidence .evidence/I548/): assets 31 GLB / 3,212,232 B / 72,449 t (glb_tris.cjs committed-tree parse, per-file in research sec.1.3); asset soft cap 3,080 KB / 73,000 t already soft-exceeded on bytes + 99.2% on tris; dist 5,559,215 B / 189 re-measured at the gate; E75 growth estimate (D3 ~+440 KB, D4 ~+300 KB, D5 ~+150-400 KB or 0 t fallback, code ~+30-80 KB) lands ~6.7-6.9 MB = ABOVE the 6.1 MB ceiling -> 7,400,000 B ceiling PRE-REGISTERED WITH MEASUREMENT (E69 precedent 4.7 -> 6.1), applied at first E75 asset landing (ST-518).',
'- Gate evidence (measured): (1) npm test 1,201/1,201. (2) npm run build 0; dist 5,559,215 B / 189 = BYTE-IDENTICAL to I547 (docs-only). (3) Browser smoke N/A (zero render surface; I542/I543/I547 precedent). (4) dist 5,559,215 B < 6,100,000 B + floor 540,785 B (code-only stays under current ceiling; 7,400,000 B takes effect at ST-518). (5) vendor r187 EXACT 4/4 (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017). (6) 5 fresh harness runs ALL EXACT (managed runner, each server started+verified+KILLed, ports free after): causal495 (dist :4200) CAUSAL495 PASS; causal483 (dev :5173) CAUSAL456 PASS; playframe483 + playframe491 (dev :5173) PLAYFRAME456 PASS (A 22/32,717 + 11/180, B 52/69,272 EXACT - NO re-pin); pwa491 (dist :5199) SUMMARY 11/11. Stdout: .evidence/I548/{causal495,causal483,playframe483,playframe491,pwa491}.out.',
'- Bookkeeping: iterations.md + stories.md (ST-514 DONE + ST-515..521 PENDING) + epics.md (+E75 IN PROGRESS) + timeline.md + active.md. NO CHANGELOG (docs-only open/scope; I543/I547 precedent).',
'- Next: I549 = ST-515 (D1a) - build the headless camera/cockpit verification harness (screenshots + NDC probes for cockpit/chase/overview + V-switch snap-vs-damp) -> the measured gap list that ST-516 (D1b) fixes.'
].join('\r\n');
write('production/iterations.md', it0 + '\r\n\r\n' + BLOCK);

// 4. timeline.md: one line
const TL_LINE = 'I548 (ST-514, E75) - E75 open/research/scope WITH MEASUREMENT: measured audit (camera/cockpit shipped-vs-residuals G-a/G-b/G-c; campaign level.js data-driven; assets 31 GLB / 3,212,232 B / 72,449 t per-file; asteroid 227,300 B / 9,140 t; asset tri cap 99.2%; dist 5,559,215 B / 189) + LABELED research (CAM-1..8 / BOSS-1..3 / AST-1..3) + pre-registered D1 verify-then-polish camera/cockpit / D2 level-5 data / D3 2 NEW enemy ships / D4 L5 boss / D5 gated asteroid remaster + story map ST-514..ST-521 + risks K1-K7 + dist policy [7,400,000 B ceiling PRE-REGISTERED WITH MEASUREMENT, applied at first E75 asset landing ST-518; code-only stays under 6.1 MB floor 540,785 B] + production/scope-check-E75.md; docs-only zero src - dist 5,559,215 B / 189 byte-identical, vendor 4/4; quality bar 6/6 (tests 1,201/1,201, build 0, smoke N/A zero render surface, 5 harnesses fresh EXACT [A 22/32,717 + 11/180, B 52/69,272 no re-pin]); NEXT I549 (ST-515 D1a headless camera/cockpit verification harness)';
write('production/timeline.md', tl0 + TL_LINE + '\n');

// 5. active.md: one line
const AC_LINE = 'I548 (ST-514, E75) done: E75 is now open. Research-first round - no game code changed, dist byte-identical (5,559,215 B / 189), tests 1,201/1,201, vendor 4/4, 5 regression harnesses all exact. I measured the current camera/cockpit (first-person view, the 4-tick crosshair, and the consistent-at-distance chase framing are ALREADY shipped in earlier episodes), the campaign (4 data-driven levels + a per-level boss, so a 5th level is a data append), the enemy fleet (11 real spaceships, 72,449 tris total), and the asteroids (7 smooth low-poly rocks). Five decisions are frozen: (D1) verify-then-polish the cockpit + camera - mode-specific control labels, a damped camera-mode switch, and confirm-or-fix the W/S control mapping the way it actually feels; (D2) add a 5th linear level; (D3) two brand-new enemy ships; (D4) a proper detailed final boss for level 5; (D5) asteroid/comet bumps + craters, but ONLY if a headless GPU/compute probe shows the budget allows (your explicit condition). The 7.4 MB build-size ceiling is pre-registered (with measurement) because the new art provably outgrows the current 6.1 MB limit; it takes effect when the first new model lands. NEXT I549: the headless camera/cockpit verification harness (screenshots + screen-coordinate probes) to pin down exactly what the cockpit needs before changing anything.';
write('production/session-state/active.md', ac0 + AC_LINE + '\n');

// BOM-after asserts: no new BOMs (latin1 round-trip is byte-preserving)
for (const f of FILES) {
  const after = bom(f);
  if (after !== before[f]) throw new Error('BOM delta on ' + f + ': ' + before[f] + ' -> ' + after);
}
console.log('I548DOCS OK');