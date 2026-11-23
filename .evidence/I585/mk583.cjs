const fs = require('fs');
let t = fs.readFileSync('.evidence/I585/sc583.txt', 'utf8');
// ASCII check
for (let i = 0; i < t.length; i++) { if (t.charCodeAt(i) > 126 || (t.charCodeAt(i) < 32 && t.charCodeAt(i) !== 10 && t.charCodeAt(i) !== 13)) { console.error('NON-ASCII or bad ctrl at', i, JSON.stringify(t.slice(i-10, i+10))); process.exit(1); } }
// normalize to CRLF, strip trailing whitespace/newlines
t = t.replace(/\r\n/g, '\n').replace(/\n+$/g, '');
const out = '\uFEFF' + t.replace(/\n/g, '\r\n');
fs.writeFileSync('production/scope-check-E83.md', out, 'utf8');
const b = fs.readFileSync('production/scope-check-E83.md');
console.log('WROTE production/scope-check-E83.md', b.length, 'B; BOMs:', (out.match(/\uFEFF/g)||[]).length, '; tail:', [...b.slice(-4)].map(x=>x).join(','));
