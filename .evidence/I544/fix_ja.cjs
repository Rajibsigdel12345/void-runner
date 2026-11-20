const fs = require('fs');
const p = 'src/core/strings.js';
let s = fs.readFileSync(p, 'latin1');
const anchor = "'\\u7d9a \\u2014 LV{level}'";
const n = s.split(anchor).length - 1;
if (n !== 1) throw new Error('anchor count ' + n);
s = s.replace(anchor, "'\\u7d96\\u7d9a \\u2014 LV{level}'");
fs.writeFileSync(p, s, 'latin1');
console.log('ja menu.continue fixed: ?(U+7D96)?(U+7D9A) = ??');