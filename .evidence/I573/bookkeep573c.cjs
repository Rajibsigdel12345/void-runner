const fs = require('fs');
function bomCount(buf) { let c = 0; for (let i = 0; i + 2 < buf.length; i++) { if (buf[i] === 0xEF && buf[i+1] === 0xBB && buf[i+2] === 0xBF) { c++; i += 2; } } return c; }
function must(cond, msg) { if (!cond) { console.error('ASSERT FAIL:', msg); process.exit(1); } }
const p = 'E:/Game/CHANGELOG.md';
const before = fs.readFileSync(p);
const bb = bomCount(before);
must(bb === 7, 'pre-BOM ' + bb + ' != 7');
must(!before.includes(Buffer.from('- I573:', 'ascii')), 'I573 entry already present');
const anchorB = Buffer.from('- I561: Three enemy ship types (the phantom interceptor, the sweeper and the mine-hauler) now have fully remodeled hulls with more plating and mechanical detail - same shapes, much nicer looks. Nothing else changed.', 'ascii');
const idx = before.indexOf(anchorB);
must(idx !== -1, 'anchor line not found');
must(before.indexOf(anchorB, idx + 1) === -1, 'anchor line not unique');
let end = idx + anchorB.length, termLen = 0;
if (before[end] === 0x0D && before[end+1] === 0x0A) termLen = 2; else if (before[end] === 0x0A) termLen = 1;
must(termLen > 0, 'anchor line not EOL-terminated');
must(before.slice(end + termLen, end + termLen + 7).equals(Buffer.from('- I572:', 'ascii')), 'line after anchor is not the I572 entry');
const line = '- I573: No visible change - the next balance round is officially open: we froze the plan to trim the wave-10 boss\'s health by 20% (the wall our last round documented), with the decision rules and pass/fail bars written down before any test run; no gameplay code changed this round.\n';
fs.writeFileSync(p, Buffer.concat([before.slice(0, end + termLen), Buffer.from(line, 'ascii'), before.slice(end + termLen)]));
const after = fs.readFileSync(p);
const ab = bomCount(after);
must(ab === bb, 'BOM delta != 0');
console.log('OK CHANGELOG.md', before.length, '->', after.length, 'B, BOM 7->7, I573 inserted after I561 / before I572');
