// bookkeep593.cjs - 6-patch byte-level bookkeeping (I593). Read latin1 (byte-preserving),
// assert each anchor count===1, apply, verify BOM delta 0, write back.
const fs = require('fs');
const P = 'E:/Game/';
const C = require(P + '.evidence/I593/bookkeep593_content.json');
const BOMS = [
  ['production/epics.md', 3],
  ['production/stories.md', 5],
  ['production/iterations.md', 5],
  ['production/timeline.md', 3],
  ['CHANGELOG.md', 7],
  ['production/session-state/active.md', 0]
];
function count(s, a) { let n = 0, i = 0; while ((i = s.indexOf(a, i)) !== -1) { n++; i += a.length; } return n; }
function boms(s) { return (s.match(/\u00EF\u00BB\u00BF/g) || []).length; }
const CRLF = '\r\n';
function norm(s, eol) { return s.replace(/\r?\n/g, eol); }
const before = {};
for (const [rel, exp] of BOMS) { before[rel] = boms(fs.readFileSync(P + rel, 'latin1')); }

// 1) epics.md (CRLF): mid-line replacement
{
  const rel = 'production/epics.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = 'ST-560 PENDING I593 (THE SWAP + asset-cap renegotiation WITH MEASUREMENT + playframe B probe + 5-harness gate)';
  if (count(s, a) !== 1) throw new Error('epics anchor != 1: ' + count(s, a));
  s = s.replace(a, C.epics);
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('epics patched');
}
// 2) stories.md: whole-line replacement (anchor line is LF-terminated; keep the \n)
{
  const rel = 'production/stories.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = '- ST-560 E84 THE SWAP (I593) - PENDING I593: assets/ drone/stinger/warden/flyer <- v2 (legacy-4 backups -> .evidence/I593/backup/ FIRST) + AGENTS.md asset-cap renegotiation WITH MEASUREMENT + playframe B probe (.evidence/I593/playframe_probe593.cjs; re-pin WITH MEASUREMENT only if a remastered ship is in-frustum, else EXACT) + 5-harness gate.';
  if (count(s, a) !== 1) throw new Error('stories anchor != 1: ' + count(s, a));
  if (count(s, a + '\n') !== 1) throw new Error('stories anchor+LF != 1');
  s = s.replace(a + '\n', C.stories + '\n');
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('stories patched');
}
// 3) CHANGELOG.md (pure LF): insert new line above the I592 line
{
  const rel = 'CHANGELOG.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = '- I592: No visible change - the last two enemy rebuilds';
  if (count(s, a) !== 1) throw new Error('changelog anchor != 1: ' + count(s, a));
  s = s.replace(a, C.changelog + '\n' + a);
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('changelog patched');
}
// 4) timeline.md: append paragraph after the I592 paragraph (last line, NO trailing newline)
{
  const rel = 'production/timeline.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = 'the swap that puts them into the game comes next. Bundle unchanged at 7,093,058 bytes.';
  if (count(s, a) !== 1) throw new Error('timeline anchor != 1: ' + count(s, a));
  s = s.replace(a, a + CRLF + norm(C.timeline, CRLF));
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('timeline patched');
}
// 5) active.md: append NEXT line after the I593 line (last line, NO trailing newline)
{
  const rel = 'production/session-state/active.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = 'Push delegate for I593 per rotation (I592 Dewey -> I593 Arendt).';
  if (count(s, a) !== 1) throw new Error('active anchor != 1: ' + count(s, a));
  s = s.replace(a, a + CRLF + norm(C.active, CRLF));
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('active patched');
}
// 6) iterations.md: append new entry after the I592 entry (last line, NO trailing newline)
{
  const rel = 'production/iterations.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  const a = 'Push delegate for I593 per rotation (I592 Dewey -> I593 Arendt).';
  if (count(s, a) !== 1) throw new Error('iterations anchor != 1: ' + count(s, a));
  const entry = [C.iterations_head, '', ...C.iterations_lines].join('\n');
  s = s.replace(a, a + CRLF + CRLF + norm(entry, CRLF));
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
console.log('BOOKKEEP593 PASS - all 6 patches applied, BOM delta 0');