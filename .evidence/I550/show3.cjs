const fs = require('fs');
function tail(f, n) { console.log('=== ' + f); console.log(fs.readFileSync(f, 'utf8').slice(-n)); console.log('---'); }
tail('production/timeline.md', 900);
tail('production/session-state/active.md', 1500);
const c = fs.readFileSync('CHANGELOG.md', 'utf8');
const i = c.indexOf('## [Unreleased]');
console.log('=== CHANGELOG [Unreleased]'); console.log(c.slice(i, i + 1600)); console.log('---');
