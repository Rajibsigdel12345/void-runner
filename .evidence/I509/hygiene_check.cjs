const fs = require('fs');
for (const p of ['tests/assetGlbs.test.js','tests/assetPerf.test.js']) {
  const s = fs.readFileSync(p, 'utf8');
  const bom = (s.match(/\uFEFF/g) || []).length;
  const crlf = (s.match(/\r\n/g) || []).length;
  const lf = (s.match(/\n/g) || []).length;
  console.log(p, 'bytes', Buffer.byteLength(s), 'BOM', bom, 'CRLF', crlf, 'LFtotal', lf, 'crlfPct', lf ? (100*crlf/lf).toFixed(1) : 'n/a');
}