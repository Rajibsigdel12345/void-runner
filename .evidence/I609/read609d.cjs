const fs = require('fs');
const a = fs.readFileSync('E:/Game/docs/architecture/vendor-r187-adr.md','utf8');
const lines = a.split('\n');
console.log('total lines: ' + lines.length);
lines.forEach((l, i) => {
  if (/sha256|pin|29,?256|meshopt|A65DE049|7AB0784C|F5492484|7FF9ACF5/i.test(l)) console.log((i+1) + ': ' + l.slice(0, 220));
});