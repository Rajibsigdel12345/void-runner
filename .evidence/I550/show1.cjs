const fs = require('fs');
function show(f, pat, before, after) {
  const s = fs.readFileSync(f, 'utf8');
  const i = s.search(pat);
  if (i < 0) { console.log('=== ' + f + ': NOT FOUND'); return; }
  console.log('=== ' + f + ' (idx ' + i + ')');
  console.log(s.slice(Math.max(0, i - before), i + after));
  console.log('---');
}
show('production/stories.md', /ST-516/, 400, 900);
show('production/epics.md', /ST-515|ST-516/, 300, 700);
