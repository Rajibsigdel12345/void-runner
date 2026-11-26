const fs = require('fs');
const p = 'E:/Game/.evidence/I601/bookkeep601.cjs';
let t = fs.readFileSync(p, 'utf8');
const a = "fill (anchor: '(to be filled at close: per-story evidence WITH MEASUREMENT + quality bar + the 5-harness gate + CLOSE FLOOR E86)') + AGENTS.md";
const b = 'fill (anchor: "(to be filled at close: per-story evidence WITH MEASUREMENT + quality bar + the 5-harness gate + CLOSE FLOOR E86)") + AGENTS.md';
if (t.split(a).length !== 2) { console.error('anchor count != 1'); process.exit(1); }
t = t.slice(0, t.indexOf(a)) + b + t.slice(t.indexOf(a) + a.length);
fs.writeFileSync(p, t, 'utf8');
console.log('FIXED, bytes', Buffer.byteLength(t));