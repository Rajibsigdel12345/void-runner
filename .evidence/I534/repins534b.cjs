const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');

function patchFile(rel, pairs) {
  const abs = path.join(root, rel);
  const raw = fs.readFileSync(abs, 'utf8');
  const isCRLF = raw.includes('\r\n');
  let text = raw.replace(/\r\n/g, '\n');
  for (const p of pairs) {
    const oldStr = p[0];
    const newStr = p[1];
    const count = text.split(oldStr).length - 1;
    if (count !== 1) {
      console.error('FAIL ' + rel + ' occurrence=' + count + ' for: ' + oldStr.slice(0, 60));
      process.exit(1);
    }
    text = text.replace(oldStr, newStr);
    console.log('OK ' + rel + ' <- ' + oldStr.slice(0, 44).trim());
  }
  fs.writeFileSync(abs, isCRLF ? text.replace(/\n/g, '\r\n') : text);
  console.log('WROTE ' + rel + ' (CRLF=' + isCRLF + ')');
}

patchFile('tests/assetPerf.test.js', [
  [
    '  totalGeoKB: 2850,    // [I517 re-pin WITH MEASUREMENT 2650 -> 2850 (ST-483 +hauler); measured 2797.04 KB (2,864,166 B); headroom 52.96 KB]',
    '  totalGeoKB: 2920,    // [I534 re-pin WITH MEASUREMENT 2850 -> 2920 (ST-500 hauler v2 ridge remaster +640 hull tris); measured 2866.07 KB (2,934,858 B); headroom 53.93 KB; ST-501 bulwark + ST-502 gunship v2 re-measure/re-pin at landing + G72.0]'
  ]
]);

patchFile('tests/assetGlbs.test.js', [
  [
    'I534 304,384 B',
    'I534 304,272 B'
  ]
]);

console.log('ALL_REPINS_OK');