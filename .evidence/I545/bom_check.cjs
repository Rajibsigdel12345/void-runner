const fs = require('fs');
const { execSync } = require('child_process');
const files = ['index.html','src/core/strings.js','src/core/touchZones.js','src/render/input.js','src/render/screens.js','src/render/touchStick.js','tests/touchZones.test.js','src/main.js'];
function bomOf(buf){ return buf.length>=3 && buf[0]===0xEF && buf[1]===0xBB && buf[2]===0xBF; }
let allOk = true;
for (const f of files) {
  const cur = bomOf(fs.readFileSync(f));
  let hb = null;
  try { const head = execSync('git show HEAD:' + f, {maxBuffer: 1024*1024*10}); hb = bomOf(head); }
  catch(e) { hb = 'MISSING-IN-HEAD'; }
  const ok = hb === cur;
  if (!ok) allOk = false;
  console.log(f.padEnd(28) + '  HEAD=' + (hb===true?'BOM':hb===false?'---':String(hb)) + '  WORK=' + (cur?'BOM':'---') + (ok?'  OK':'  *** MISMATCH ***'));
}
console.log(allOk ? 'BOM DELTA 0' : 'BOM DELTA != 0');
