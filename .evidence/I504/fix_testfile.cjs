const fs = require('fs');
const f = 'tests/cameraModel.test.js';
let s = fs.readFileSync(f, 'utf8');
function rep(a, b, label, want) {
  let count = 0, idx = -1;
  while ((idx = s.indexOf(a, idx + 1)) !== -1) count++;
  if (count !== want) { console.error('FAIL [' + label + '] count=' + count + ' want=' + want); process.exit(1); }
  s = s.split(a).join(b);
  console.log('ok [' + label + ']');
}
rep("import { clamp01, smoothstep01, dollyFactor, chaseTargets, projectNdc, overviewTargets, cockpitTargets } from '../src/core/cameraModel.js';",
    "import { clamp01, smoothstep01, dollyFactor, chaseTargets, projectNdc, overviewTargets, cockpitTargets, cockpitThrust } from '../src/core/cameraModel.js';",
    'test.import', 1);
rep('    assert.ok(Math.abs(o.lookY) < 1e-12);',
    '    assert.ok(Math.abs(o.lookY - (CFG.cockpitHeight - CFG.cockpitLookDrop)) < 1e-12); // I504: gentle down-pitch',
    'test.lookY', 2);
fs.writeFileSync(f, s);
console.log('written ' + f);
