// probe_bk592.cjs - verify each bookkeeping anchor count in raw bytes (latin1)
const fs = require('fs');
const P = 'E:/Game/';
const targets = [
  ['production/epics.md', 'ST-559 PENDING I592 (stinger v2 + flyer v2 to .evidence/I592/ only)'],
  ['production/stories.md', '- ST-559 E84 stinger v2 + flyer v2 build (I592) - PENDING I592: same pipeline to .evidence/I592/ ONLY (NO game files touched).'],
  ['CHANGELOG.md', '- I591: No visible change - two of the four enemy rebuilds are finished and measured.'],
  ['production/timeline.md', 'Bundle unchanged at 7,093,058 bytes.'],
  ['production/session-state/active.md', '1 rework max; NO src/ or assets/ touched)'],
  ['production/iterations.md', '1 rework max; NO src/ or assets/ touched)']
];
for (const [rel, anchor] of targets) {
  const s = fs.readFileSync(P + rel, 'latin1');
  let count = 0, i = 0;
  while ((i = s.indexOf(anchor, i)) !== -1) { count++; i += anchor.length; }
  console.log(rel, '->', count, JSON.stringify(anchor.slice(0, 60)));
}
// context bytes: what line ending follows the stories anchor?
const st = fs.readFileSync(P + 'production/stories.md', 'latin1');
const aSt = '- ST-559 E84 stinger v2 + flyer v2 build (I592) - PENDING I592: same pipeline to .evidence/I592/ ONLY (NO game files touched).';
const j = st.indexOf(aSt);
console.log('stories anchor at', j, 'of', st.length, 'after-bytes:', JSON.stringify(st.slice(j + aSt.length, j + aSt.length + 3)));
// what is the last line of stories.md?
const k = st.lastIndexOf('\n');
console.log('stories last line:', JSON.stringify(st.slice(Math.max(0, k - 120))));
