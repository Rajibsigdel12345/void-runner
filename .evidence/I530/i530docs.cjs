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

let s1 = read('production/iterations.md');
if (!s1.endsWith('\n')) s1 += '\n';
s1 += '\n' + read('tmp_i530.txt');
fs.writeFileSync(base + 'production/iterations.md', s1, 'latin1');

let s2 = read('production/stories.md');
const anchor2 = 'server killed + ECONNREFUSED). Next: I530 = ST-496 (R-CAM-2 far-view cross-mode verify, default document-only).\r\n';
s2 = rep1(s2, anchor2, anchor2 + read('tmp_s530.txt') + '\r\n', 'stories-status529-tail');
fs.writeFileSync(base + 'production/stories.md', s2, 'latin1');

let s3 = read('production/epics.md');
s3 = rep1(s3, 'ST-496 (I530) R-CAM-2 far-view cross-mode verify (headless probe, document by default, one smallest-lever only on measured gap).', read('tmp_e530.txt'), 'epics-st496');
fs.writeFileSync(base + 'production/epics.md', s3, 'latin1');

let s4 = read('production/timeline.md');
if (!s4.endsWith('\n')) s4 += '\n';
s4 += read('tmp_t530.txt') + '\n';
fs.writeFileSync(base + 'production/timeline.md', s4, 'latin1');

let s5 = read('CHANGELOG.md');
s5 = rep1(s5, '## [Unreleased]\r\n', '## [Unreleased]\r\n' + read('tmp_c530.txt') + '\r\n', 'changelog-unreleased');
fs.writeFileSync(base + 'CHANGELOG.md', s5, 'latin1');

let s6 = read('production/session-state/active.md');
if (!s6.endsWith('\n')) s6 += '\n';
s6 += read('tmp_a530.txt') + '\n';
fs.writeFileSync(base + 'production/session-state/active.md', s6, 'latin1');

let ok = true;
for (const f of files) {
  const now = bom(read(f));
  if (now !== before[f]) { ok = false; console.log('BOM DRIFT', f, before[f], '->', now); }
}
console.log(ok ? 'I530DOCS OK - BOM delta 0 (6/6)' : 'I530DOCS BOM FAIL');
for (const t of ['tmp_i530.txt', 'tmp_s530.txt', 'tmp_e530.txt', 'tmp_t530.txt', 'tmp_c530.txt', 'tmp_a530.txt']) fs.unlinkSync(base + t);