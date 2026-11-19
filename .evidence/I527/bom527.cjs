const fs = require('fs');
function bom(p) { let n = 0, i = 0; const b = fs.readFileSync(p); while (i + 2 < b.length) { if (b[i] === 0xEF && b[i+1] === 0xBB && b[i+2] === 0xBF) { n++; i += 3; } else i++; } return n; }
const files = { 'CHANGELOG.md': 7, 'production/stories.md': 5, 'production/epics.md': 3, 'production/iterations.md': 5, 'production/timeline.md': 3, 'AGENTS.md': 1, 'design/e70-balance-followup-research.md': 0 };
let ok = true;
for (const [f, base] of Object.entries(files)) { const n = bom('E:/Game/' + f); const pass = n === base; ok = ok && pass; console.log(f, 'BOM', n, 'base', base, pass ? 'OK' : 'MISMATCH'); }
console.log(ok ? 'I527 BOM AUDIT PASS' : 'I527 BOM AUDIT FAIL');