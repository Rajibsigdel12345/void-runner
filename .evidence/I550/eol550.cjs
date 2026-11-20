const fs = require('fs');
for (const p of ['production/iterations.md', 'production/timeline.md', 'production/session-state/active.md', 'production/stories.md', 'production/epics.md', 'CHANGELOG.md']) {
  const s = fs.readFileSync(p, 'latin1');
  const crlf = (s.match(/\r\n/g) || []).length;
  const lf = (s.match(/(?<!\r)\n/g) || []).length;
  const cr = (s.match(/\r(?!\n)/g) || []).length;
  console.log(p, 'CRLF=' + crlf, 'LF-only=' + lf, 'CR-only=' + cr);
}
