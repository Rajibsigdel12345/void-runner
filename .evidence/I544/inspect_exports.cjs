const fs = require('fs');
const s = fs.readFileSync('src/core/strings.js', 'latin1');
s.split('\n').forEach((l, i) => { if (l.indexOf('export') === 0) console.log('STR L' + (i + 1) + ': ' + l); });
console.log('---');
const st = fs.readFileSync('src/core/storage.js', 'latin1');
const a = st.indexOf('getCampaignProgress');
console.log(JSON.stringify(st.slice(a - 200, a + 500)));