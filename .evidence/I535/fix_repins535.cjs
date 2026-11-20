const fs = require('fs');
const f = 'E:/Game/.evidence/I535/repins535.cjs';
let t = fs.readFileSync(f, 'utf8');
const re = /  \['   bulwark: \{ VR_Shield: \{ p10: 0\.4600[\s\S]*?v2 remaster'\)\]\r?\n/;
if (!t.match(re)) { console.error('NO MATCH'); process.exit(1); }
const rep = "  ['p10: 0.4600, p50: 0.6190, p90: 0.7400', 'p10: 0.4600, p50: 0.5700, p90: 0.7100'],\n" +
            "  ['p10: 0.2800, p50: 0.3876, p90: 0.4103 } }, // I516 (ST-482) pins WITH measurement (measure_facets516.mjs)', 'p10: 0.2800, p50: 0.3498, p90: 0.3912 } }, // I535 (ST-501 E72) pins WITH measurement (probe535.mjs; hex-shield guardian v2 remaster)']\n";
t = t.replace(re, rep);
fs.writeFileSync(f, t);
console.log('PAIR REPLACED');
