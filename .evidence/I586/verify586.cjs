const fs = require('fs');
let total = 0, files = 0;
(function walk(d) { for (const e of fs.readdirSync(d, {withFileTypes:true})) { const p = d + '/' + e.name; if (e.isDirectory()) walk(p); else { files++; total += fs.statSync(p).size; } } })('dist');
console.log('dist:', files, 'files,', total, 'B (expect 203 / 6430174)');
function bom(p){ const s = fs.readFileSync(p, 'utf8'); let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++; return n; }
const expect = { 'AGENTS.md':1, 'production/epics.md':3, 'production/stories.md':5, 'production/iterations.md':5, 'production/timeline.md':3, 'production/session-state/active.md':0, 'CHANGELOG.md':7, 'production/scope-check-E83.md':1 };
let ok = true;
for (const [p, e] of Object.entries(expect)) { const n = bom(p); console.log(p, n, n === e ? 'OK' : 'MISMATCH expected ' + e); if (n !== e) ok = false; }
console.log(ok ? 'BOM DELTA 0 - ALL OK' : 'BOM PROBLEM');
