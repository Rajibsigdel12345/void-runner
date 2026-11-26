const fs = require('fs');
const R = (f) => fs.readFileSync('E:/Game/' + f, 'latin1');
const ep = R('production/epics.md');
const iS = ep.indexOf('Stories:', ep.indexOf('E86') > -1 ? ep.lastIndexOf('##', ep.indexOf('ST-566')) : 0);
// simpler: find all lines containing ST-566
let i = -1; const hits = [];
while ((i = ep.indexOf('ST-566', i + 1)) >= 0) hits.push(i);
console.log('ep ST-566 hits:', hits.length);
for (const h of hits) {
  const s = ep.lastIndexOf('\n', h) + 1; const e = ep.indexOf('\n', h);
  const ln = ep.slice(s, e);
  console.log('HIT@' + h + ' len' + ln.length + ':', JSON.stringify(ln.slice(0, 300)));
}
const ac = R('production/session-state/active.md');
console.log('AC LAST300:', JSON.stringify(ac.slice(-300)));