const fs = require('fs');
const s = fs.readFileSync('src/render/screens.js', 'latin1');
['replaysOpenFlag', 'menuStatus', 'function showPanel', 'onLocale('].forEach((n) => {
  let idx = -1, hits = [];
  while ((idx = s.indexOf(n, idx + 1)) >= 0) hits.push(idx);
  console.log('=== ' + n + ' at ' + hits.join(', '));
});
// where is showPanel vs menu block end (16141) vs replays section?
const sp = s.indexOf('  function showPanel(state) {');
console.log('showPanel idx:', sp, '(after menu block end 16141:', sp > 16141, ')');
const rof = s.indexOf('replaysOpenFlag');
console.log('first replaysOpenFlag:', rof, '(before showPanel:', rof < sp, ')');
// context around first replaysOpenFlag
console.log(JSON.stringify(s.slice(rof - 120, rof + 160)));
// menuStatus re-emit inside onLocale callback?
const ol = s.indexOf('onLocale(');
const tail = s.slice(ol, ol + 2600);
const ms = tail.indexOf('menuStatus');
console.log('menuStatus in onLocale callback:', ms >= 0, ms >= 0 ? JSON.stringify(tail.slice(ms - 100, ms + 220)) : '');