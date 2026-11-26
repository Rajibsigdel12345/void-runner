// bookkeep592b.cjs - iterations patch only (corrected anchor: line ends "touched)." + CRLF)
const fs = require('fs');
const P = 'E:/Game/';
const C = require(P + '.evidence/I592/bookkeep592_content.json');
function count(s, a) { let n = 0, i = 0; while ((i = s.indexOf(a, i)) !== -1) { n++; i += a.length; } return n; }
const rel = 'production/iterations.md';
let s = fs.readFileSync(P + rel, 'latin1');
const a = '1 rework max; NO src/ or assets/ touched).' + '\r\n';
const n = count(s, a);
if (n !== 1) throw new Error('iterations anchor != 1: ' + n);
const entry = [C.iterations_head, '', ...C.iterations_lines].join('\n').replace(/\r?\n/g, '\r\n');
s = s.replace(a, a + '\r\n' + entry);
fs.writeFileSync(P + rel, s, 'latin1');
console.log('iterations patched (anchor count was 1)');