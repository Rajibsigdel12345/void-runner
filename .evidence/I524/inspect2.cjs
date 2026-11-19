const fs = require('fs');
function ends(p) {
  const b = fs.readFileSync(p);
  let crlf = 0, lf = 0;
  for (let k = 1; k < b.length; k++) { if (b[k] === 10) { if (b[k-1] === 13) crlf++; else lf++; } }
  console.log(p.split('/').pop(), 'bytes', b.length, 'crlf', crlf, 'loneLF', lf, 'endsNL', b[b.length-1] === 10);
}
['production/iterations.md', 'production/timeline.md', 'CHANGELOG.md', 'production/epics.md', 'production/stories.md'].forEach(ends);
const it = fs.readFileSync('E:/Game/production/iterations.md');
console.log('iter last 120 hex:', it.slice(-120).toString('hex'));
const cl = fs.readFileSync('E:/Game/CHANGELOG.md', 'latin1');
const k = cl.indexOf('## [Unreleased]');
console.log('CHANGELOG unreleased@', k, JSON.stringify(cl.slice(k, k + 60)));