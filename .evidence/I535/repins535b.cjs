// repins535b.cjs - I535 (ST-501 E72) assetPerf.test.js comment re-measure (cap HOLDS; CRLF-safe; pattern = repins534b.cjs)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
function patchFile(rel, pairs) {
  const abs = path.join(root, rel);
  const raw = fs.readFileSync(abs, 'utf8');
  const isCRLF = raw.includes('\r\n');
  let text = raw.replace(/\r\n/g, '\n');
  for (const p of pairs) {
    const oldStr = p[0], newStr = p[1];
    const count = text.split(oldStr).length - 1;
    if (count !== 1) { console.error('FAIL ' + rel + ' occurrence=' + count + ' for: ' + oldStr.slice(0, 60)); process.exit(1); }
    text = text.replace(oldStr, newStr);
    console.log('OK ' + rel + ' <- ' + oldStr.slice(0, 44).trim());
  }
  fs.writeFileSync(abs, isCRLF ? text.replace(/\n/g, '\r\n') : text);
  console.log('WROTE ' + rel + ' (CRLF=' + isCRLF + ')');
}
patchFile('tests/assetPerf.test.js', [
  ['  totalGeoKB: 2920,    // [I534 re-pin WITH MEASUREMENT 2850 -> 2920 (ST-500 hauler v2 ridge remaster +640 hull tris); measured 2866.07 KB (2,934,858 B); headroom 53.93 KB; ST-501 bulwark + ST-502 gunship v2 re-measure/re-pin at landing + G72.0]',
   '  totalGeoKB: 2920,    // [I535 re-measure WITH MEASUREMENT (ST-501 bulwark v2 landing; cap HOLDS): measured 2905.82 KB (2,975,562 B); headroom 14.18 KB; ST-502 gunship v2 must land within ~14 KB geo or re-pin cap WITH MEASUREMENT + G72.0]'],
  ['  totalTris: 66000,    // [I517 re-pin WITH MEASUREMENT 62,000 -> 66,000 (ST-483 +hauler 3,506 t); measured 63,617 t; headroom 2,383 t]',
   '  totalTris: 66000,    // [I517 re-pin WITH MEASUREMENT 62,000 -> 66,000 (ST-483 +hauler 3,506 t); I535 re-measure WITH MEASUREMENT: measured 65,203 t; headroom 797 t]']
]);
console.log('ALL_REPINS535B_OK');
