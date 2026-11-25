const fs = require("fs");
let total = 0, files = 0;
(function walk(d) { for (const e of fs.readdirSync(d, {withFileTypes:true})) { const p = d + '/' + e.name; if (e.isDirectory()) walk(p); else { files++; total += fs.statSync(p).size; } } })('dist');
const a = fs.readdirSync('assets').filter(f => f.endsWith('.glb'));
let at = 0; for (const f of a) at += fs.statSync('assets/' + f).size;
console.log('dist:', files, 'files,', total, 'B (expect ~7,093,058 / tripwire 7,297,600 / ceiling 7,400,000)');
console.log('assets:', a.length, 'glb, total', at, 'B (I586 4,009,384 B; delta', at - 4009384, ')');
