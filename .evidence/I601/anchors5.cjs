const fs = require('fs');
const R = (f) => fs.readFileSync('E:/Game/' + f, 'latin1');
const ep = R('production/epics.md');
let i = -1; const hits = [];
while ((i = ep.toLowerCase().indexOf('residual', i + 1)) >= 0) hits.push(i);
console.log('ep residual hits:', hits.length);
for (const h of hits.slice(0, 12)) {
  const s = ep.lastIndexOf('\n', h) + 1; const e = ep.indexOf('\n', h);
  console.log('@' + h + ':', JSON.stringify(ep.slice(s, Math.min(e, s + 220))));
}
const iB = ep.lastIndexOf('backlog');
if (iB >= 0) { const s = ep.lastIndexOf('\n', iB) + 1; const e = ep.indexOf('\n', iB); console.log('BACKLOG LINE:', JSON.stringify(ep.slice(s, e).slice(0, 300))); }