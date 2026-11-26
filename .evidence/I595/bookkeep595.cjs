// bookkeep595.cjs - 6-file byte-level bookkeeping (I595 E85 open). Read latin1 (byte-preserving),
// assert each anchor count===1, apply, verify BOM delta 0, write back.
const fs = require('fs');
const P = 'E:/Game/';
const C = require(P + '.evidence/I595/bookkeep595_content.json');
const BOMS = [
  ['AGENTS.md', 1],
  ['production/epics.md', 3],
  ['production/stories.md', 5],
  ['production/iterations.md', 5],
  ['production/timeline.md', 3],
  ['CHANGELOG.md', 7],
  ['production/session-state/active.md', 0]
];
function count(s, a) { let n = 0, i = 0; while ((i = s.indexOf(a, i)) !== -1) { n++; i += a.length; } return n; }
function boms(s) { return (s.match(/\u00EF\u00BB\u00BF/g) || []).length; }
const before = {};
for (const [rel, exp] of BOMS) { before[rel] = boms(fs.readFileSync(P + rel, 'latin1')); }
function read(rel) { return fs.readFileSync(P + rel, 'latin1'); }
function write(rel, s) { fs.writeFileSync(P + rel, s, 'latin1'); console.log('patched ' + rel); }
// 1) epics.md: insert the E85 block at the START of the E84 header line
{
  const rel = 'production/epics.md';
  let s = read(rel);
  if (count(s, C.E84_ANCHOR) !== 1) throw new Error('epics E84 anchor != 1');
  const idx = s.indexOf(C.E84_ANCHOR);
  const lineStart = s.lastIndexOf('\n', idx - 1) + 1;
  s = s.slice(0, lineStart) + C.E85_BLOCK + '\r\n\r\n' + s.slice(lineStart);
  write(rel, s);
}
// 2) stories.md: append ST-562 + ST-563 lines (file ends with LF)
{
  const rel = 'production/stories.md';
  let s = read(rel);
  if (s.slice(-1) !== '\n') throw new Error('stories does not end with LF');
  s = s + C.ST562_LINE + '\n' + C.ST563_LINE + '\n';
  write(rel, s);
}
// 3) iterations.md: append the I595 entry (file ends bare; entry ends bare)
{
  const rel = 'production/iterations.md';
  let s = read(rel);
  s = s + '\r\n\r\n' + C.ITER595_ENTRY;
  write(rel, s);
}
// 4) timeline.md: append the I595 paragraph (file ends bare; paragraph ends bare)
{
  const rel = 'production/timeline.md';
  let s = read(rel);
  s = s + '\r\n\r\n' + C.TIMELINE595;
  write(rel, s);
}
// 5) active.md: append the NEXT-at-I596 line (file ends bare; line ends bare)
{
  const rel = 'production/session-state/active.md';
  let s = read(rel);
  s = s + '\r\n' + C.NEXT596_LINE;
  write(rel, s);
}
// 6) CHANGELOG.md (pure LF): insert the I595 line above the I594 anchor line
{
  const rel = 'CHANGELOG.md';
  let s = read(rel);
  if (count(s, C.CHANGELOG_ANCHOR) !== 1) throw new Error('changelog anchor != 1');
  const idx = s.indexOf(C.CHANGELOG_ANCHOR);
  const lineStart = s.lastIndexOf('\n', idx - 1) + 1;
  s = s.slice(0, lineStart) + C.CHANGELOG595 + '\n' + s.slice(lineStart);
  write(rel, s);
}
// BOM delta check (AGENTS.md untouched this round, read-only verification)
let ok = true;
for (const [rel, exp] of BOMS) {
  const now = boms(read(rel));
  const delta = now - before[rel];
  if (now !== exp || delta !== 0) ok = false;
  console.log('BOM', rel, 'before', before[rel], 'after', now, 'expected', exp, 'delta', delta);
}
if (!ok) throw new Error('BOM check FAILED');
console.log('BOOKKEEP595 PASS - all 6 patches applied, BOM delta 0');