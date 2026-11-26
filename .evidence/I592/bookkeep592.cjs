// bookkeep592.cjs - 6-patch byte-level bookkeeping (I592). Read latin1 (byte-preserving),
// assert each anchor count===1, apply, verify BOM delta 0, write back.
const fs = require('fs');
const P = 'E:/Game/';
const C = require(P + '.evidence/I592/bookkeep592_content.json');
const BOMS = [
  ['production/epics.md', 3],
  ['production/stories.md', 5],
  ['production/iterations.md', 5],
  ['production/timeline.md', 3],
  ['CHANGELOG.md', 7],
  ['production/session-state/active.md', 0]
];
function count(s, a) { let n = 0, i = 0; while ((i = s.indexOf(a, i)) !== -1) { n++; i += a.length; } return n; }
function boms(s) { return count(s, '\uFEFF\uFEFF') * 0 + (s.match(/\u00EF\u00BB\u00BF/g) || []).length; }
const CRLF = '\r\n';
function norm(s, eol) { return s.replace(/\r?\n/g, eol); }
const before = {};
for (const [rel, exp] of BOMS) { before[rel] = boms(fs.readFileSync(P + rel, 'latin1')); }

// 1) epics.md (CRLF): mid-line replacement
{
  const rel = 'production/epics.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = 'ST-559 PENDING I592 (stinger v2 + flyer v2 to .evidence/I592/ only)';
  if (count(s, a) !== 1) throw new Error('epics anchor != 1: ' + count(s, a));
  s = s.replace(a, C.epics);
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('epics patched');
}
// 2) stories.md: whole-line replacement (anchor line is LF-terminated; keep the \n)
{
  const rel = 'production/stories.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = '- ST-559 E84 stinger v2 + flyer v2 build (I592) - PENDING I592: same pipeline to .evidence/I592/ ONLY (NO game files touched).';
  if (count(s, a) !== 1) throw new Error('stories anchor != 1: ' + count(s, a));
  if (count(s, a + '\n') !== 1) throw new Error('stories anchor+LF != 1');
  s = s.replace(a + '\n', C.stories + '\n');
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('stories patched');
}
// 3) CHANGELOG.md (pure LF): insert new line above the I591 line
{
  const rel = 'CHANGELOG.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = '- I591: No visible change - two of the four enemy rebuilds are finished and measured.';
  if (count(s, a) !== 1) throw new Error('changelog anchor != 1: ' + count(s, a));
  s = s.replace(a, C.changelog + '\n' + a);
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('changelog patched');
}
// 4) timeline.md: append paragraph after the I591 paragraph (last line, CRLF-terminated)
{
  const rel = 'production/timeline.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = 'Bundle unchanged at 7,093,058 bytes.' + CRLF;
  if (count(s, a) !== 1) throw new Error('timeline anchor != 1: ' + count(s, a));
  s = s.replace(a, a + norm(C.timeline, CRLF));
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('timeline patched');
}
// 5) active.md (CRLF): append NEXT line after the I592 line (last line)
{
  const rel = 'production/session-state/active.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = '1 rework max; NO src/ or assets/ touched)' + CRLF;
  if (count(s, a) !== 1) throw new Error('active anchor != 1: ' + count(s, a));
  s = s.replace(a, a + norm(C.active, CRLF));
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('active patched');
}
// 6) iterations.md (CRLF): append new entry after the I591 entry (last line)
{
  const rel = 'production/iterations.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = '1 rework max; NO src/ or assets/ touched)' + CRLF;
  if (count(s, a) !== 1) throw new Error('iterations anchor != 1: ' + count(s, a));
  const entry = [C.iterations_head, '', ...C.iterations_lines].join('\n');
  s = s.replace(a, a + CRLF + norm(entry, CRLF));
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('iterations patched');
}
// BOM delta check
let ok = true;
for (const [rel, exp] of BOMS) {
  const now = boms(fs.readFileSync(P + rel, 'latin1'));
  const delta = now - before[rel];
  if (now !== exp || delta !== 0) { ok = false; }
  console.log('BOM', rel, 'before', before[rel], 'after', now, 'expected', exp, 'delta', delta);
}
if (!ok) throw new Error('BOM check FAILED');
console.log('BOOKKEEP592 PASS - all 6 patches applied, BOM delta 0');