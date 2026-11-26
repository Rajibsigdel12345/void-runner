const fs = require('fs');
const p = 'tests/cameraModel.test.js';
let s = fs.readFileSync(p, 'utf8');
if (s.includes('ST-564')) throw new Error('already appended');
if (!s.endsWith('});\n')) throw new Error('unexpected tail: ' + JSON.stringify(s.slice(-10)));
const add = [
'',
"test('ST-564 (I599): cockpit thrust basis == view direction - screen-up is nose-forward at every aim angle (24-step sweep, tol 1e-9)', () => {",
'  const o = {};',
'  for (let k = 0; k < 24; k++) {',
'    const a = (k / 24) * Math.PI * 2;',
'    const ca = Math.cos(a), sa = Math.sin(a);',
'    // Screen basis (input.js convention): W = (0,-1), S = (0,1), A = (-1,0), D = (1,0).',
'    // basis a = the damped nose angle: the cockpit camera looks along ship.aim, so the',
'    // thrust basis MUST be the view direction at every instant (ST-564: the I559',
'    // undamped-pointer basis could flip 180deg behind the ship -> W read as back).',
'    cockpitThrust(0, -1, a, o); // W -> nose (cos a, sin a)',
'    assert.ok(Math.abs(o.x - ca) < 1e-9 && Math.abs(o.y - sa) < 1e-9, \'W@\' + a.toFixed(3) + \': \' + JSON.stringify(o));',
'    cockpitThrust(0, 1, a, o); // S -> -nose',
'    assert.ok(Math.abs(o.x + ca) < 1e-9 && Math.abs(o.y + sa) < 1e-9, \'S@\' + a.toFixed(3) + \': \' + JSON.stringify(o));',
'    cockpitThrust(1, 0, a, o); // D -> right of nose = (-sin a, cos a) [cross(view, up)]',
'    assert.ok(Math.abs(o.x + sa) < 1e-9 && Math.abs(o.y - ca) < 1e-9, \'D@\' + a.toFixed(3) + \': \' + JSON.stringify(o));',
'    cockpitThrust(-1, 0, a, o); // A -> left of nose = (sin a, -cos a)',
'    assert.ok(Math.abs(o.x - sa) < 1e-9 && Math.abs(o.y + ca) < 1e-9, \'A@\' + a.toFixed(3) + \': \' + JSON.stringify(o));',
'  }',
'});',
''
].join('\n');
fs.writeFileSync(p, s + add);
console.log('APPENDED ST-564 test, new bytes=' + fs.statSync(p).size);