const fs = require('fs');
const s = fs.readFileSync('production/stories.md', 'utf8');
const i = s.indexOf('- ST-516');
const e = s.indexOf('\n', i);
console.log('STORIES LINE:'); console.log(JSON.stringify(s.slice(i, e)));
const t = fs.readFileSync('production/epics.md', 'utf8');
const j = t.indexOf('ST-516 (I550)');
// print from the ST-516 segment to its end of sentence (next ' - ' + status or period)
const k = t.indexOf(' - ', j);
const m = t.indexOf('\n', j);
console.log('\nEPICS SEGMENT:'); console.log(JSON.stringify(t.slice(j - 60, m < 0 ? j + 1200 : m)));
