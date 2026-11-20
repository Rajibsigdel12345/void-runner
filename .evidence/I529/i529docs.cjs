const fs = require('fs');
const base = 'E:/Game/';
function bom(s) { let n = 0; const b = Buffer.from(s, 'latin1'); for (let i = 0; i + 2 < b.length; i++) if (b[i] === 0xEF && b[i + 1] === 0xBB && b[i + 2] === 0xBF) n++; return n; }
function read(p) { return fs.readFileSync(base + p, 'latin1'); }
function rep1(s, anchor, repl, label) {
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error('anchor count ' + n + ' != 1: ' + label);
  return s.replace(anchor, repl);
}
const files = ['production/iterations.md', 'production/stories.md', 'production/epics.md', 'production/timeline.md', 'CHANGELOG.md', 'production/session-state/active.md'];
const before = {};
for (const f of files) before[f] = bom(read(f));

// 1. iterations.md - append section (LF, blank-line separated)
let s1 = read('production/iterations.md');
if (!s1.endsWith('\n')) s1 += '\n';
s1 += '\n' + read('tmp_iter529.txt');
fs.writeFileSync(base + 'production/iterations.md', s1, 'latin1');

// 2. stories.md - insert STATUS (I529) CRLF line after the STATUS (I527) line
let s2 = read('production/stories.md');
const anchor2 = 'TS.md refreshed (quality bar #4 chain -> 5,255,258 + CLOSE FLOOR E70 = 844,742 B); quality bar 6/6 measured: 1,187/1,187 + build 0 + 5-harness ALL GREEN + dist 5,255,258 B/184 + vendor EXACT 8/8 + BOM delta 0 + hygiene.\r\n';
s2 = rep1(s2, anchor2, anchor2 + read('tmp_st529.txt') + '\r\n', 'stories-status527-tail');
fs.writeFileSync(base + 'production/stories.md', s2, 'latin1');

// 3. epics.md - ST-495 status bump (in-line, no EOL change)
let s3 = read('production/epics.md');
s3 = rep1(s3, 'ST-495 (I529) R-CAM-1 crosshair (render-only bearingStrip.js dot -> dot+4 ticks, 0 core / 0 sim, probed).', read('tmp_ep529.txt'), 'epics-st495');
fs.writeFileSync(base + 'production/epics.md', s3, 'latin1');

// 4. timeline.md - append line (LF)
let s4 = read('production/timeline.md');
if (!s4.endsWith('\n')) s4 += '\n';
s4 += read('tmp_tl529.txt') + '\n';
fs.writeFileSync(base + 'production/timeline.md', s4, 'latin1');

// 5. CHANGELOG.md - insert after [Unreleased] (CRLF)
let s5 = read('CHANGELOG.md');
s5 = rep1(s5, '## [Unreleased]\r\n', '## [Unreleased]\r\n' + read('tmp_cl529.txt') + '\r\n', 'changelog-unreleased');
fs.writeFileSync(base + 'CHANGELOG.md', s5, 'latin1');

// 6. active.md - append note line (LF)
let s6 = read('production/session-state/active.md');
if (!s6.endsWith('\n')) s6 += '\n';
s6 += read('tmp_act529.txt') + '\n';
fs.writeFileSync(base + 'production/session-state/active.md', s6, 'latin1');

// BOM preservation check
let ok = true;
for (const f of files) {
  const now = bom(read(f));
  if (now !== before[f]) { ok = false; console.log('BOM DRIFT', f, before[f], '->', now); }
}
console.log(ok ? 'I529DOCS OK - BOM delta 0 (6/6)' : 'I529DOCS BOM FAIL');
for (const f of files) fs.unlinkSync(base + 'tmp_' + f.match(/^(.*?)(\.md)$/)[1].replace('production/', '').split('/').pop().replace('.md', '') + (f === 'CHANGELOG.md' ? 'cl529' : f.includes('stories') ? 'st529' : f.includes('epics') ? 'ep529' : f.includes('timeline') ? 'tl529' : f.includes('active') ? 'act529' : 'iter529') + '.txt');