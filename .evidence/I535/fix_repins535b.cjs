const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'repins535.cjs');
const raw = fs.readFileSync(f, 'utf8');
const isCRLF = raw.includes('\r\n');
const lines = raw.split(/\r\n|\n/);
const idx = lines.findIndex((l) => l.includes('{ VR_Shield: { p10: 0.4600, p50: 0.6190'));
if (idx === -1) { console.error('FAIL: old pair line not found'); process.exit(1); }
if (!lines[idx + 1].includes("hex-shield guardian v2 remaster)']")) { console.error('FAIL: next line mismatch: ' + lines[idx + 1].slice(0, 80)); process.exit(1); }
const repl = [
  "  ['p10: 0.4600, p50: 0.6190, p90: 0.7400',",
  "   'p10: 0.4600, p50: 0.5700, p90: 0.7100'],",
  "  ['p10: 0.2800, p50: 0.3876, p90: 0.4103 } }, // I516 (ST-482) pins WITH measurement (measure_facets516.mjs)',",
  "   'p10: 0.2800, p50: 0.3498, p90: 0.3912 } }, // I535 (ST-501 E72) pins WITH measurement (probe535.mjs; hex-shield guardian v2 remaster)']"
];
lines.splice(idx, 2, ...repl);
fs.writeFileSync(f, isCRLF ? lines.join('\r\n') : lines.join('\n'));
console.log('FIXED repins535.cjs (CRLF=' + isCRLF + '); old pair was at line ' + (idx + 1));
