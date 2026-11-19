const fs = require('fs'), path = require('path');
function walk(d) { let s = 0, n = 0; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { const r = walk(p); s += r.s; n += r.n; } else { s += fs.statSync(p).size; n++; } } return { s, n }; }
const { s, n } = walk('E:/Game/dist');
console.log('dist total', s, 'B /', n, 'files; headroom', 6100000 - s, 'B; floor check', (6100000 - s) >= 102400 ? 'PASS' : 'FAIL');