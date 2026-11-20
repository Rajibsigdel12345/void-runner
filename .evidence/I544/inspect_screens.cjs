const fs = require('fs');
const s = fs.readFileSync('src/render/screens.js', 'latin1');
const START = "  const menuGrid = document.createElement('div'); // I66: two-column menu";
const END = "    bottomWrap.appendChild(settings.menu.el);\r\n  }";
const a = s.indexOf(START);
const b = s.indexOf(END);
console.log('START idx:', a, 'END idx:', b);
if (a < 0 || b < 0 || b < a) { console.log('ANCHOR PROBLEM'); process.exit(1); }
console.log('START unique:', s.indexOf(START, a + 1) === -1);
console.log('END unique:', s.indexOf(END, b + 1) === -1);
console.log('--- context BEFORE start (2 lines):');
console.log(JSON.stringify(s.slice(Math.max(0, a - 120), a)));
console.log('--- context AFTER end (120 chars):');
console.log(JSON.stringify(s.slice(b + END.length, b + END.length + 120)));
const block = s.slice(a, b + END.length);
const lines = block.split('\r\n');
console.log('--- BLOCK lines:', lines.length);
lines.forEach((l, i) => console.log(String(i + 1).padStart(3) + ': ' + l));