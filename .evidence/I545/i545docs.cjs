// I545 (ST-511, E74): bookkeeping - latin1 byte-preserving, per-file line endings (template: .evidence/I544/i544docs.cjs).
// Implementation iteration: 8 modified src/test files + 1 NEW src file + 6 production files + CHANGELOG.md (player-facing, newest-first).
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

// 1. epics.md: ST-511 -> DONE in the E74 Stories line + Status line append (file has no trailing NL)
let ep = ep0;
ep = rep(ep,
  'ST-511 (I545) mobile landscape pass (D2 rotate hint overlay coarse-gated + D3 safe-area insets + stick scaling audit).',
  'ST-511 (I545) mobile landscape pass (D2 rotate hint overlay coarse-gated + D3 safe-area insets + stick scaling audit) - DONE I545 (pure core stickGeomFor + responsive touch stick + NEW rotateHint.js rotate-to-landscape overlay [portrait+coarse, auto-hides, i18n en/zh/ja byte-verified] + safe-area insets; DOM-only zero tris; quality bar 6/6).',
  'epics E1');
ep = rep(ep,
  'ST-510 DONE I544 (menu reorg D1 shipped: CONTINUE - LV N primary + New Game row ENDLESS/CAMPAIGN/DAILY + collapsible SETTINGS + i18n en/zh/ja; DOM-only - dist 5,544,996 B / 185, vendor 4/4, playframe491 + causal495 EXACT).',
  'ST-510 DONE I544 (menu reorg D1 shipped: CONTINUE - LV N primary + New Game row ENDLESS/CAMPAIGN/DAILY + collapsible SETTINGS + i18n en/zh/ja; DOM-only - dist 5,544,996 B / 185, vendor 4/4, playframe491 + causal495 EXACT). ST-511 DONE I545 (mobile landscape D2+D3 shipped: pure core stickGeomFor + responsive stick + NEW rotateHint.js overlay [portrait+coarse] + safe-area insets on pause btn/menu + i18n en/zh/ja (ja re-fixed byte-exact vs the MT reference); DOM-only zero tris - dist 5,548,452 B / 186, vendor 4/4, playframe491 + causal495 EXACT).',
  'epics E2');
write('production/epics.md', ep);

// 2. stories.md: replace the ST-511 PENDING line with the DONE I545 line (file has trailing NL)
const stDone = `- ST-511 E74 mobile landscape pass (I545) - DONE I545: D2+D3 shipped - NEW pure core src/core/touchZones.js stickGeomFor(vh) (DOM-free: bit-identical {maxPx:90,deadzone:24} at vh>=360 or non-finite; shrinks to {maxPx:max(56,floor(vh/4)),deadzone:22} for 1<=vh<360 so the ring (2*maxPx) stays <=50% of the short side with a 44 px knob floor; unit-pinned) + src/render/input.js responsive shared stickGeom() live value (refreshed on create + window resize; thrustFromDrag now uses the responsive deadzone/maxPx) + src/render/touchStick.js reads the SAME stickGeom() so the on-screen ring/knob stays 1:1 under the finger at any size + NEW src/render/rotateHint.js (3,310 B, DOM-only rotate-to-landscape overlay: shown only when portrait + coarse pointer, auto-hides on rotate-to-landscape, non-blocking, i18n label re-emitted per locale) + src/core/strings.js +ui.rotate_hint (en/zh/ja; the ja value was re-fixed byte-exact against the MT reference .evidence/I545/i18n_ref/ja2.bin after smoke545 revealed the prior session's "verified" escapes had been back-derived from garbled console CJK and decoded to the wrong 5 trailing characters - CJK lesson: never hand-derive or console-read CJK, byte-level fetch/decode/compare pipeline only) + safe-area insets (index.html viewport meta viewport-fit=cover + screens.js pause-btn bottom/right + menu padding top/bottom via env(safe-area-inset-*) + @keyframes vrRotateHint) + src/main.js wiring (rotateHint create/resize + safe-area); 2 unit tests (tests/touchZones.test.js; suite 1,192 -> 1,194); quality bar 6/6 (tests 1,194/1,194, build 0, smoke545 22/22 both console 0/0, dist 5,548,452 B / 186, vendor 4/4, playframe491 + causal495 fresh EXACT, pwa491 11/11).`;
write('production/stories.md', rep(st0,
  `- ST-511 E74 mobile landscape pass (I545) - PENDING/E74 (D2 rotate hint overlay [portrait + coarse pointer, DOM-only non-blocking, auto-hides in landscape] + D3 safe-area insets env(safe-area-inset-*) + stick scaling / 44 px targets / zone-gap audit on small landscape viewports; quality bar 6/6).`,
  stDone, 'stories ST-511'));

// 3. iterations.md: append the I545 section (file has no trailing NL)
const iterBlock = [
`## I545 (ST-511, E74): mobile landscape pass D2+D3 - rotate hint (portrait+coarse, i18n en/zh/ja byte-verified) + safe-area insets + responsive touch stick`,
`- Goal (ST-511): ship the pre-registered D2+D3 mobile landscape pass (E74, I543): (D2) a DOM-only rotate-to-landscape hint that appears ONLY when the device is portrait AND has a coarse pointer (touch), is non-blocking, and auto-hides the moment the user rotates to landscape; (D3) safe-area insets (env(safe-area-inset-*) + viewport-fit=cover) so the pause button and the menu keep clear of notches / rounded corners; plus the stick-scaling audit - the on-screen floating thrust stick shrinks on very short landscape viewports while holding a 44 px touch-target floor, and the input math and the visual ring/knob move 1:1 from one shared pure-core source. All i18n en/zh/ja. Zero 3D surface (no mesh/geometry change).`,
`- Pre-state: local main 10d4a38 (I544); the I545 code was already applied on disk by the prior session (rotateHint.js NEW + 8 modified files) but UNTESTED and with one latent i18n defect. THIS session first re-verified the whole quality bar GREEN on that pre-fix tree, then smoke545 case E exposed the defect: the ja ui.rotate_hint value in strings.js was corrupted - the prior session's "verified" code-point list had been back-derived from garbled console CJK output and decoded (per the verified UTF-8 mappings) to the WRONG 5 trailing characters (not Japanese), while the long-vowel mark was also missing; zh rendered correctly in the same console output (proving the console was faithful and the file's escapes were wrong). Fixed byte-exact via a professional-MT reference: fetched authoritative raw-UTF-8 translations, saved to .evidence/I545/i18n_ref/{ja1,ja2,ja3,zh1}.{bin,esc.txt}, chose the concise variant ja2 (39 B), and wrote the ASCII \\uXXXX escapes with a latin1 single-anchor replace that asserts the decoded escapes are byte-equal to ja2.bin (MATCHES_JA2_BIN=true) with zh left untouched (ZH_INTACT=true). smoke545.mjs's own ja expectation was then corrected the same byte-level way (derived from ja2.bin, not hand-typed).`,
`- Changed: NEW src/render/rotateHint.js (3,310 B, DOM-only overlay: portrait+coarse gate, auto-hide on rotate, i18n re-emit per locale) + src/core/touchZones.js (2,615 B: NEW pure stickGeomFor(vh) - bit-identical {90,24} at vh>=360 or non-finite, shrinks for 1<=vh<360 with a 44 px floor) + src/render/input.js (10,901 B: responsive shared stickGeom() live value, create + window resize refresh, thrustFromDrag uses the responsive deadzone/maxPx, resize listener attach/detach) + src/render/touchStick.js (4,589 B: reads the SAME stickGeom() so ring/knob stay 1:1 with the input) + src/render/screens.js (39,931 B: @keyframes vrRotateHint + pause-btn safe-area bottom/right + menu padding safe-area top/bottom) + index.html (1,981 B: viewport-fit=cover) + src/core/strings.js (32,454 B: +ui.rotate_hint en/zh/ja; ja re-fixed byte-exact vs MT reference) + src/main.js (126,529 B: rotateHint create/resize wiring) + tests/touchZones.test.js (13,999 B: +2 stickGeomFor tests, suite 1,192 -> 1,194). Zero 3D surface.`,
`- Quality bar 6/6 MEASURED (re-run AFTER the ja fix, since strings.js changed): (1) npm test 1,194/1,194 (1,192 + 2 stickGeomFor). (2) npm run build 0. (3) smoke545 headless 22/22 - Case A desktop (coarse=false): no rotate hint in DOM, menu paddingTop 24px (safe-area 0), stickGeom 90/24, no touch stick, console 0/0; Case B coarse landscape: hint in DOM but HIDDEN, menu paddingTop 18px, stick ring 180px, console 0/0; Case C portrait+coarse: hint VISIBLE + label en, HIDDEN after rotate-to-landscape, console 0/0; Case D short landscape (vh 280 < 360): stickGeom 70/22, ring 140px, console 0/0; Case E locale re-emit en->zh->ja->en all correct (ja byte-exact), console 0/0. (4) dist 5,548,452 B / 186 files (down exactly 6 B from the 5,548,458 B pre-fix measurement = the ja fix removed one \\uXXXX escape, 14 -> 13 code points; under the 6,100,000 B ceiling; CLOSE FLOOR E74 = 551,548 B, above the 102,400 B floor -> cut ladder C1..C5 NOT invoked). (5) vendor r187 pins EXACT 4/4 (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017). (6) regressions fresh: playframe491 'PLAYFRAME456 PASS' (A 22/32,717 + 11/180, B 52/69,272 EXACT - DOM-only change, zero tris, NO re-pin; console 0/0) + causal495 'CAUSAL495 PASS' (webgl + default arms EXACT on the seed-9876 pin set, webgpu report-only) + pwa491 'SUMMARY 11/11' (SW + manifest + offline boot - the index.html viewport-fit=cover change is PWA-neutral). BOM delta 0 on all 6 patched doc files.`,
`- Bookkeeping: iterations.md + stories.md (ST-511 DONE I545) + epics.md (ST-511 DONE in Stories + Status) + timeline.md + active.md + CHANGELOG.md (player-facing I545 line after [Unreleased]). .evidence/I545 force-added (i18n_ref MT references + all fix/verify/smoke scripts + the byte-exact ja re-fix provenance).`,
`- CJK LESSON (permanent rule for this project): never hand-derive CJK code points, never trust CJK glyphs read from consoles/tool output, and never "verify" CJK by re-reading console text. Only byte-level pipelines: fetch trusted raw-UTF-8 bytes (API/web) -> node decode -> compare bytes/escapes in node -> write ASCII \\uXXXX escapes. Two prior "fixes" both failed exactly this way; the byte-exact reference pipeline is the only accepted method.`,
`- Next: I546 (ST-512) PWA install hardening (D4: meta gap-fill + optional 192 px icon + install affordance; pwa491 stays 11/11); then I547 (ST-513) G74.0 close gate (5 fresh harnesses EXPECTED EXACT + CLOSE FLOOR E74 re-derived WITH MEASUREMENT + AGENTS.md refresh). Batch push of I543..I545 (I543/I544 were never pushed) delegated to a fresh worker.`
].join('\r\n');
write('production/iterations.md', it0 + '\r\n\r\n' + iterBlock);

// 4. timeline.md: append the I545 line (file has trailing NL)
const tlLine = `I545 (ST-511, E74) - mobile landscape D2+D3 shipped: NEW src/render/rotateHint.js (DOM-only rotate-to-landscape overlay, portrait+coarse only, auto-hides, i18n) + pure core touchZones.stickGeomFor(vh) + input.js responsive shared stickGeom() (create+resize) + touchStick.js 1:1 ring/knob + safe-area insets (index.html viewport-fit=cover + screens.js pause-btn/menu via env(safe-area-inset-*) + @keyframes vrRotateHint) + strings.js +ui.rotate_hint en/zh/ja (ja re-fixed byte-exact vs MT reference after a garbled-console defect was caught by smoke545; CJK lesson recorded) + 2 unit tests (suite 1,192 -> 1,194); quality bar 6/6 (tests 1,194/1,194, build 0, smoke545 22/22, dist 5,548,452 B / 186 [floor 551,548 B], vendor 4/4, playframe491 + causal495 fresh EXACT, pwa491 11/11); NEXT I546 (ST-512) PWA install hardening`;
write('production/timeline.md', tl0 + tlLine + '\n');

// 5. active.md: append the I545 line (file has trailing NL)
const acLine = `I545 (ST-511, E74) done: mobile landscape pass - on phones/tablets the game now shows a small non-blocking "rotate to landscape" prompt only in portrait (it disappears as soon as the device is turned sideways), the pause button and menu keep clear of notches/rounded corners (safe-area insets), and the touch stick resizes automatically for very short landscape screens while the on-screen ring and the input math stay perfectly in sync. Menu text is in English, Chinese, and Japanese (the Japanese line was re-verified byte-for-byte against a machine-translation reference after an earlier defect was caught by the smoke test). DOM-only: dist 5,548,452 B / 186 (floor 551,548 B), vendor 4/4, playframe491 + causal495 fresh EXACT, pwa491 11/11, smoke545 22/22. NEXT I546 (ST-512) PWA install hardening (D4)`;
write('production/session-state/active.md', ac0 + acLine + '\n');

// 6. CHANGELOG.md: insert the player-facing I545 line after [Unreleased] (BOM x7, newest-first)
const cl0 = read('CHANGELOG.md');
const anchor = '## [Unreleased]\r\n';
const entry = '- I545: On phones and tablets the game now gently asks you to hold your device sideways (landscape) with a small rotating prompt. That prompt only shows up in portrait on touch devices and goes away the moment you turn the device, so it never blocks play. On screens with a notch or rounded corners, the pause button and the menu now keep clear of the edges. The touch controls resize automatically to fit very short landscape screens. The menu text is available in English, Chinese, and Japanese. No gameplay or ship changes this round. The downloadable bundle is 5,548,452 bytes - under the 6.1 MB limit.\r\n';
write('CHANGELOG.md', rep(cl0, anchor, anchor + entry, 'changelog Unreleased'));

let ok = true;
for (const f of FILES) { const after = bom(f); if (after !== before[f]) { ok = false; console.log('BOM DRIFT ' + f + ': ' + before[f] + ' -> ' + after); } else console.log('BOM ok ' + f + ' = ' + after); }
if (!ok) process.exit(1);
console.log('DOCS545 DONE');
