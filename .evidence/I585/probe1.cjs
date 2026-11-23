const fs = require('fs');
function load(p){ const b = fs.readFileSync(p, 'utf8'); const n = (b.match(/\uFEFF/g) || []).length; return {b, n}; }
const ep = load('production/epics.md').b;
const lines = ep.split('\r\n');
lines.forEach((l, i) => { if (l.startsWith('## E82') || l.startsWith('## E81')) console.log(i + 1, JSON.stringify(l.slice(0, 110))); });
const sc = load('production/scope-check-E82.md');
console.log('E82 scope BOMs:', sc.n);
