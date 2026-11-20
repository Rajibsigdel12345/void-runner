// I544 (ST-510, E74): bookkeeping - latin1 byte-preserving, per-file line endings (template: .evidence/I543/i543docs.cjs).
// Implementation iteration: 6 src/test files + 5 production files + CHANGELOG.md (player-facing, newest-first).
const fs = require('fs');
const path = require('path');
const R = (p) => path.join(__dirname, '..', '..', p);
const read = (f) => fs.readFileSync(R(f), 'latin1');
const write = (f, s) => fs.writeFileSync(R(f), Buffer.from(s, 'latin1'));
const bom = (f) => { const b = fs.readFileSync(R(f)); let c = 0, i = 0; while (i + 2 < b.length && b[i] === 0xEF && b[i + 1] === 0xBB && b[i + 2] === 0xBF) { c++; i += 3; } return c; };
const before = {};
const FILES = ['production/epics.md', 'production/stories.md', 'production/iterations.md', 'production/timeline.md', 'production/session-state/active.md', 'CHANGELOG.md'];
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

// 1. epics.md: ST-510 -> DONE in the E74 Stories line + Status line append (file has no trailing NL)
let ep = ep0;
ep = rep(ep,
  'ST-510 (I544) menu reorg (pure core src/core/menuModel.js + screens.js reorg + settingsPanel collapse + i18n en/zh/ja + unit tests).',
  'ST-510 (I544) menu reorg (pure core src/core/menuModel.js + screens.js reorg + settingsPanel collapse + i18n en/zh/ja + unit tests) - DONE I544 (menuModel.js 1,047 B pure core + 5 unit tests; screens.js D1 reorg 35,468 -> 39,562 B; strings.js +15 keys en/zh/ja; main.js Enter seam; quality bar 6/6).',
  'epics E1');
ep = rep(ep,
  '- Status: IN PROGRESS (opened I543). ST-509 DONE I543 (measured audit + LABELED research UX-1..UX-6 + pre-registered D1-D4 + scope check; docs-only zero src - dist 5,542,040 B / 184 byte-identical, vendor UNCHANGED, pins EXPECTED EXACT through the epic).',
  '- Status: IN PROGRESS (opened I543). ST-509 DONE I543 (measured audit + LABELED research UX-1..UX-6 + pre-registered D1-D4 + scope check; docs-only zero src - dist 5,542,040 B / 184 byte-identical, vendor UNCHANGED, pins EXPECTED EXACT through the epic). ST-510 DONE I544 (menu reorg D1 shipped: CONTINUE - LV N primary + New Game row ENDLESS/CAMPAIGN/DAILY + collapsible SETTINGS + i18n en/zh/ja; DOM-only - dist 5,544,996 B / 185, vendor 4/4, playframe491 + causal495 EXACT).',
  'epics E2');
write('production/epics.md', ep);

// 2. stories.md: replace the ST-510 PENDING line with the DONE I544 line (file has trailing NL)
const stDone = `- ST-510 E74 menu reorg (I544) - DONE I544: D1 shipped - NEW pure core src/core/menuModel.js (1,047 B, DOM-free: primary CONTINUE - LV N / start prompt decision + labels + aria + enterAction from campaignProgress 0|1..4; garbage/out-of-domain coerced to 0 = bit-identical pre-E74 endless Enter; unit-pinned) + screens.js reorg 35,468 -> 39,562 B (center: CONTINUE primary hidden until progress + start prompt hidden while CONTINUE owns the menu; bottom: NEW GAME head + modeRow ENDLESS/CAMPAIGN/DAILY + dailyRow SETTINGS/REPLAYS + top-5/status/best/credit; settings panel collapsed by default, Esc capture-close, controls card moved inside; continue label guarded to hasContinue) + strings.js +15 keys (5 x en/zh/ja: menu.continue / menu.continue_aria / menu.new_game / menu.settings / menu.settings_aria) + main.js (menuProgress seam + Enter = menuModel().enterAction) + tests/menuModel.test.js (5 tests; suite 1,187 -> 1,192); quality bar 6/6 (tests 1,192/1,192, build 0, smoke544 14/14 both console 0/0, dist 5,544,996 B / 185, vendor 4/4, playframe491 + causal495 fresh EXACT).`;
write('production/stories.md', rep(st0,
  `- ST-510 E74 menu reorg (I544) - PENDING/E74 (D1: pure core src/core/menuModel.js [primary-button decision + labels from campaignProgress + locale, DOM-free, unit-testable] + screens.js reorg per D1 + settingsPanel collapse [collapsed by default, Esc/outside closes] + i18n keys en/zh/ja in src/core/strings.js + unit tests; quality bar 6/6).`,
  stDone, 'stories ST-510'));

// 3. iterations.md: append the I544 section (file has no trailing NL)
const iterBlock = [
`## I544 (ST-510, E74): menu reorg D1 - pure core menuModel + CONTINUE primary + New Game row + collapsible Settings + i18n en/zh/ja`,
`- Goal (ST-510): ship the pre-registered D1 menu reorg (E74, I543): a standard-game menu hierarchy per the verbatim user ask - one primary action (CONTINUE - LV N when campaign progress exists, else the classic start prompt), a NEW GAME row (ENDLESS / CAMPAIGN / DAILY), SETTINGS tucked into a collapsible panel, and the decision logic in a NEW pure DOM-free core module so screens.js (DOM) and main.js (Enter hotkey) can never disagree.`,
`- Pre-state: local main 24e496d (I543); implementation patches from the prior session applied on disk (patch-src.cjs + patch-screens.cjs) but UNTESTED, with two defects this session found and fixed: (a) refreshMenu hid the keyboard start prompt unconditionally (desktop users without progress lost the "PRESS ENTER TO START" line) - now guarded to mm.hasContinue; (b) menuModel accepted any positive integer as progress - the domain is 1..4 (levelCount), garbage/out-of-domain now coerces to 0 per the test spec; (c) smoke-14 exposed a semantic slip: refreshMenu stamped the hidden CONTINUE button with the start label - now the label + aria are set only when the button actually takes the CONTINUE role.`,
`- Changed: NEW src/core/menuModel.js (1,047 B) + tests/menuModel.test.js (2,442 B, 5 tests: no-progress start primary / levels 1..4 continue primary / garbage coercion incl. 7|1.5|"3"|{}|true|false / locale following / K1 key coverage en/zh/ja) + src/core/strings.js (+15 keys, 5 x en/zh/ja; ja menu.continue fixed to the valid code points) + src/render/screens.js (35,468 -> 39,562 B: B1 menuModel import, B2 CSS scope to .vr-settings-groups > div, B3 88-line D1 block swap [I66 two-column grid gone], B4 refreshMenu + Esc capture-close + showPanel MENU rework, B5 onLocale re-emit) + src/main.js (menuProgress seam + Enter = menuModel().enterAction). Zero 3D surface.`,
`- Quality bar 6/6 MEASURED: (1) npm test 1,192/1,192 (1,187 + 5 menuModel). (2) npm run build 0. (3) smoke544 headless 14/14 - Case A fresh profile: start prompt visible / CONTINUE hidden / settings collapsed -> click opens (aria-expanded true, display flex) -> Esc closes / NEW GAME head present / no NaN / console 0/0; Case B localStorage level 3: "CONTINUE - LV 3" visible + aria set / start prompt hidden / Enter -> PLAYING mode=campaign (checkpoint continue) / console 0/0. (4) dist 5,544,996 B / 185 files (under the 6,100,000 B ceiling; CLOSE FLOOR E74 = 555,004 B, above the 102,400 B floor -> cut ladder C1..C4 NOT invoked). (5) vendor r187 pins EXACT 4/4 (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017). (6) regressions fresh: playframe491 'PLAYFRAME456 PASS' (A 22/32,717 + 11/180, B 52/69,272 EXACT, console 0/0) + causal495 'CAUSAL495 PASS' (webgl + default arms EXACT on the seed-9876 pin set, webgpu report-only) - BOM delta 0 on all 6 patched files (main.js 4 = 4 pre-existing, handoff's "1" was a miscount).`,
`- Bookkeeping: iterations.md + stories.md (ST-510 DONE I544) + epics.md (ST-510 DONE in Stories + Status) + timeline.md + active.md + CHANGELOG.md (player-facing I544 line after [Unreleased]). .evidence/I544 force-added (all inspect/patch/fix/verify/smoke scripts + outputs).`,
`- Next: I545 (ST-511) mobile landscape pass (D2 portrait+coarse DOM-only rotate hint + D3 safe-area insets + stick scaling / 44 px / zone-gap audit on small landscape); then I546 (ST-512) PWA verify + gap-fill (pwa491 stays 11/11); then I547 (ST-513) G74.0 close gate. Batch push dfb6194..I544 (I543 was never pushed) delegated to a fresh worker.`
].join('\r\n');
write('production/iterations.md', it0 + '\r\n\r\n' + iterBlock);

// 4. timeline.md: append the I544 line (file has trailing NL)
const tlLine = `I544 (ST-510, E74) - menu reorg D1 shipped: NEW pure core src/core/menuModel.js (primary CONTINUE - LV N / start prompt decision + labels + enterAction; garbage coerced to 0 = bit-identical pre-E74 Enter) + screens.js D1 reorg 35,468 -> 39,562 B (CONTINUE primary + NEW GAME row ENDLESS/CAMPAIGN/DAILY + SETTINGS collapsible collapsed-by-default Esc-close + controls card inside + i18n re-emit) + strings.js +15 keys en/zh/ja + main.js (menuProgress seam + Enter = enterAction) + 5 unit tests (suite 1,187 -> 1,192); quality bar 6/6 (tests 1,192/1,192, build 0, smoke544 14/14, dist 5,544,996 B / 185 [floor 555,004 B], vendor 4/4, playframe491 + causal495 fresh EXACT); NEXT I545 (ST-511) mobile landscape pass`;
write('production/timeline.md', tl0 + tlLine + '\n');

// 5. active.md: append the I544 line (file has trailing NL)
const acLine = `I544 (ST-510, E74) done: menu reorg D1 - CONTINUE - LV N primary (checkpoint continue) when campaign progress exists, classic start prompt otherwise; NEW GAME row ENDLESS/CAMPAIGN/DAILY; SETTINGS + controls help in a collapsible panel (Esc closes); menu text en/zh/ja. Decision logic lives in the new pure core src/core/menuModel.js (5 unit tests; suite 1,192/1,192). DOM-only: dist 5,544,996 B / 185 (floor 555,004 B), vendor 4/4, playframe491 + causal495 fresh EXACT, smoke544 14/14. NEXT I545 (ST-511) mobile landscape pass (rotate hint + safe-area + stick audit)`;
write('production/session-state/active.md', ac0 + acLine + '\n');

// 6. CHANGELOG.md: insert the player-facing I544 line after [Unreleased] (BOM x7, newest-first)
const cl0 = read('CHANGELOG.md');
const anchor = '## [Unreleased]\r\n';
const entry = '- I544: The main menu now works like a standard game menu. If you have a campaign in progress, a "Continue" button takes you straight back to the level you left off (pressing Enter does the same); otherwise the familiar start prompt is shown. The choices sit under a "New Game" row (Endless / Campaign / Daily), and the settings plus the controls help are tucked into a Settings panel that opens when you click or tap it (Escape closes it). The menu text is in English, Chinese, and Japanese. No gameplay or visual changes this round. The downloadable bundle is 5,544,996 bytes - under the 6.1 MB limit.\r\n';
write('CHANGELOG.md', rep(cl0, anchor, anchor + entry, 'changelog Unreleased'));

let ok = true;
for (const f of FILES) { const after = bom(f); if (after !== before[f]) { ok = false; console.log('BOM DRIFT ' + f + ': ' + before[f] + ' -> ' + after); } else console.log('BOM ok ' + f + ' = ' + after); }
if (!ok) process.exit(1);
console.log('DOCS544 DONE');