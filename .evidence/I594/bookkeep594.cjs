// bookkeep594.cjs - 8-patch byte-level bookkeeping (I594 G84.0 CLOSE). Read latin1 (byte-preserving),
// assert each anchor count===1, apply, verify BOM delta 0, write back.
const fs = require('fs');
const P = 'E:/Game/';
const C = require(P + '.evidence/I594/bookkeep594_content.json');
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
const CRLF = '\r\n';
function norm(s, eol) { return s.replace(/\r?\n/g, eol); }
const before = {};
for (const [rel, exp] of BOMS) { before[rel] = boms(fs.readFileSync(P + rel, 'latin1')); }
function patch(rel, anchor, repl) {
  let s = fs.readFileSync(P + rel, 'latin1');
  const n = count(s, anchor);
  if (n !== 1) throw new Error(rel + ' anchor count=' + n + ' (want 1): ' + anchor.slice(0, 80));
  s = s.replace(anchor, repl);
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('patched ' + rel);
}
// 1) AGENTS.md item-4: chain extend + E84 clause at CLOSE FLOOR head (E83 demoted)
patch('AGENTS.md', C.agents_anchor, C.agents_repl);
// 2-4) epics.md: header / stories tail / status line
patch('production/epics.md', C.epics_hdr_anchor, C.epics_hdr_repl);
patch('production/epics.md', C.epics_stories_anchor, C.epics_stories_repl);
patch('production/epics.md', C.epics_status_anchor, C.epics_status_repl);
// 5) stories.md: whole-line replacement (anchor line is LF-terminated; keep the \n)
{
  const rel = 'production/stories.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  if (count(s, C.stories_anchor) !== 1 || count(s, C.stories_anchor + '\n') !== 1) throw new Error('stories anchor != 1');
  s = s.replace(C.stories_anchor + '\n', C.stories_repl + '\n');
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('patched ' + rel);
}
// 6) CHANGELOG.md (pure LF): insert new line above the I593 line
patch('CHANGELOG.md', C.changelog_anchor, C.changelog + '\n' + C.changelog_anchor);
// 7) timeline.md: append paragraph after the I593 paragraph (last line, NO trailing newline)
{
  const rel = 'production/timeline.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  if (count(s, C.timeline_anchor) !== 1) throw new Error('timeline anchor != 1');
  s = s.replace(C.timeline_anchor, C.timeline_anchor + CRLF + norm(C.timeline, CRLF));
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('patched ' + rel);
}
// 8) active.md: append NEXT line after the I594 line (last line, NO trailing newline)
{
  const rel = 'production/session-state/active.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  if (count(s, C.active_anchor) !== 1) throw new Error('active anchor != 1');
  s = s.replace(C.active_anchor, C.active_anchor + CRLF + norm(C.active, CRLF));
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('patched ' + rel);
}
// 9) iterations.md: append new entry after the I593 entry (last line, NO trailing newline)
{
  const rel = 'production/iterations.md';
  let s = fs.readFileSync(P + rel, 'latin1');
  if (count(s, C.iterations_anchor) !== 1) throw new Error('iterations anchor != 1');
  const entry = [C.iterations_head, '', ...C.iterations_lines].join('\n');
  s = s.replace(C.iterations_anchor, C.iterations_anchor + CRLF + CRLF + norm(entry, CRLF));
  fs.writeFileSync(P + rel, s, 'latin1');
  console.log('patched ' + rel);
}
// BOM delta check
let ok = true;
for (const [rel, exp] of BOMS) {
  const now = boms(fs.readFileSync(P + rel, 'latin1'));
  const delta = now - before[rel];
  if (now !== exp || delta !== 0) ok = false;
  console.log('BOM', rel, 'before', before[rel], 'after', now, 'expected', exp, 'delta', delta);
}
if (!ok) throw new Error('BOM check FAILED');
console.log('BOOKKEEP594 PASS - all 9 patches applied, BOM delta 0');