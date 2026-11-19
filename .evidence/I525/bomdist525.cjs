const fs = require('fs');
function bom(p) {
  let n = 0, i = 0;
  const b = fs.readFileSync(p);
  while (i + 2 < b.length) { if (b[i] === 0xEF && b[i+1] === 0xBB && b[i+2] === 0xBF) { n++; i += 3; } else i++; }
  return n;
}
const files = { 'CHANGELOG.md': 7, 'production/stories.md': 5, 'production/epics.md': 3, 'production/iterations.md': 5, 'production/timeline.md': 3, 'AGENTS.md': 1, '.evidence/I525/rules525.md': 0, '.evidence/I525/results525.txt': 0 };
let ok = true;
for (const [f, base] of Object.entries(files)) { const n = bom('E:/Game/' + f); const pass = n === base; ok = ok && pass; console.log(f, 'BOM', n, 'base', base, pass ? 'OK' : 'MISMATCH'); }
const dist = fs.readFileSync('E:/Game/dist/src/core/game.js').toString('latin1');
function count(h, ne) { let n = 0, i = 0; i = h.indexOf(ne); while (i >= 0) { n++; i = h.indexOf(ne, i + ne.length); } return n; }
// esbuild minify rewrites ' to " - check both quote styles per tag
const tags = ['bullet','bulwark','rock_','boss_','mine','warden','drone','stinger','hunter','gunship','sentry','wasp','pod','phantom','hauler'];
for (const t of tags) { const n = count(dist, "source:\""+t+"\"") + count(dist, "source:'"+t+"'"); const pass = n >= 1; ok = ok && pass; console.log('dist tag', t, 'count', n, pass ? 'OK' : 'MISSING'); }
console.log(ok ? 'I525 BOM+DIST CHECK PASS' : 'I525 BOM+DIST CHECK FAIL');