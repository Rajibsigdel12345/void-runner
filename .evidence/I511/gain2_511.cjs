const fs = require('fs');
const p = 'E:/Game/src/core/config.js';
let s = fs.readFileSync(p, 'utf8');
const moves = [
  ['1.43', '4.5', 'hue 176 teal'],
  ['2.7', '2.2', 'steel-blue rung'],
  ['5.1', '7.5', 'rust rung'],
  ['5.6', '7.2', 'slate rung'],
  ['2.98', '4.05', 'olive rung'],
  ['2.65', '6.0', 'chartreuse rung'],
  ['1.85', '1.6', 'magenta rung']
];
for (const mv of moves) {
  const oldV = mv[0], newV = mv[1], marker = mv[2];
  const needle = 'renderLumaGain: ' + oldV + ',';
  let count = 0, idx = -1;
  while ((idx = s.indexOf(needle, idx + 1)) !== -1) {
    const lineStart = s.lastIndexOf('\n', idx) + 1;
    let lineEnd = s.indexOf('\n', idx);
    if (lineEnd === -1) lineEnd = s.length;
    const line = s.slice(lineStart, lineEnd);
    if (line.includes(marker)) {
      count++;
      if (count === 1) s = s.slice(0, idx) + 'renderLumaGain: ' + newV + ',' + s.slice(idx + needle.length);
    }
  }
  if (count !== 1) throw new Error('marker ' + marker + ': ' + count + ' matches for ' + needle);
  console.log('ok: ' + marker + ' ' + oldV + ' -> ' + newV);
}
fs.writeFileSync(p, s, 'utf8');
console.log('gain2 applied');
