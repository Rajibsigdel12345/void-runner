import fs from 'fs';
let s = fs.readFileSync('AGENTS.md', 'utf8');
const pairs = [
  ['(~1,238 KB (1,267,388 B) / 34,938 tris): ship v5 "high-poly real airship" 17,143 tris (E61 remaster, Blender 5.2.3 headless)', '(~1,430 KB (1,464,072 B) / 43,358 tris): ship v6 "real airship" 25,563 tris (I501/ST-467 remaster, Blender 5.2.3 headless; v5 17,143 tris superseded)'],
  ['4. `npm run build` dist/ total stays under 3,650,000 B (ceiling; I495 C1 renegotiation from 3,250,000; I498: 3,561,659 B / 175 files).', '4. `npm run build` dist/ total stays under 3,850,000 B (ceiling; I501 ST-467 renegotiation WITH MEASUREMENT from 3,650,000 per the spec section 5 pre-registration: 3,758,343 B / 175 files; close floor 88,341 -> 91,657 B).'],
  ['(A 22/17,361 + 11/180, B 52/38,560 - A re-pinned WITH MEASUREMENT at I497 for the I494 r187 ConeGeometry degenerate-tip-tri skip)', '(A 22/25,781 + 11/180, B 52/55,400 - re-pinned WITH MEASUREMENT at I501 for ship v6: A 17,361 -> 25,781 = +8,420 ship tris (fx=off single pass); B 38,560 -> 55,400 = +16,840 = 2x (fx=high 2-pass scene); A previously re-pinned at I497 for the I494 r187 ConeGeometry degenerate-tip-tri skip)'],
];
for (const [old, rep] of pairs) {
  const n = s.split(old).length - 1;
  if (n !== 1) { console.error('FAIL: got ' + n + ' for: ' + old.slice(0, 60)); process.exit(1); }
  s = s.replace(old, rep);
}
fs.writeFileSync('AGENTS.md', s);
console.log('OK AGENTS.md (3 edits)');
