// I504 (ST-470) S2: cockpit rework patch - anchored replacements, EOL-preserving.
const fs = require('fs');
function patch(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  const bom = s.charCodeAt(0) === 0xFEFF;
  if (bom) s = s.slice(1);
  for (const pr of pairs) {
    const a = pr[0], b = pr[1], label = pr[2], want = pr[3] || 1;
    let count = 0, last = -1, idx = -1;
    while ((idx = s.indexOf(a, idx + 1)) !== -1) { count++; last = idx; }
    if (count !== want) { console.error('ANCHOR FAIL [' + label + '] in ' + file + ': count=' + count + ' want=' + want + ' :: ' + a.slice(0, 90)); process.exit(1); }
    if (want === 1) {
      const eol = s.charAt(last + a.length) === '\r' ? '\r\n' : '\n';
      s = s.slice(0, last) + b.split('\u0000').join(eol) + s.slice(last + a.length);
    } else {
      s = s.split(a).join(b);
    }
    console.log('  ok [' + label + ']');
  }
  fs.writeFileSync(file, (bom ? '\uFEFF' : '') + s);
  console.log('patched ' + file);
}

// ---------- src/core/config.js (mixed EOL, BOM) ----------
patch('src/core/config.js', [
  ['cockpitHeight: 1.15,   // ST-416 (I446): COCKPIT eye height above the arena plane',
   'cockpitHeight: 1.02,   // ST-416 (I446); I504 (ST-470): COCKPIT eye height above the arena plane (SHIP_HOVER 0.4 + 0.62 above the ship center plane; v6 canopy top 0.13 u below the eye = in-frame bottom)',
   'cfg.cockpitHeight'],
  ['cockpitSetback: 0.55,  // ST-416 (I446): COCKPIT seat setback behind the ship center (along facing)',
   'cockpitSetback: 0.15,  // ST-416 (I446); I504 (ST-470): COCKPIT seat setback behind the ship center (along facing; 0.55 -> 0.15 moves the seat forward so the nose + canopy frame the view)',
   'cfg.cockpitSetback'],
  ['cockpitFovSpeed: 9,    // ST-416 (I446): extra COCKPIT FOV at full speed (motion-gated seat kick)',
   'cockpitLookDrop: 1.2,   // I504 (ST-470): COCKPIT look point drops this far below the eye (gentle ~1.1 deg down-pitch at lookFar 60; frames the nose/canopy at the bottom)\u0000cockpitFovSpeed: 9,    // ST-416 (I446): extra COCKPIT FOV at full speed (motion-gated seat kick)',
   'cfg.cockpitLookDrop']
]);

// ---------- src/core/cameraModel.js (LF) ----------
patch('src/core/cameraModel.js', [
  ['// setback behind the ship center along the facing, looking lookFar ahead on the arena plane.',
   '// setback behind the ship center along the facing, looking lookFar ahead on the arena plane.\n// I504 (ST-470): the look point drops cockpitLookDrop below the eye - a gentle down-pitch so the\n// ship nose/canopy frame the bottom of the first-person view (the ship is visible in cockpit now).',
   'cm.cockpit doc'],
  ['  out.lookY = 0; // arena plane horizon',
   '  out.lookY = out.camY - (cfg.cockpitLookDrop || 0); // I504 (ST-470): gentle down-pitch (legacy 0 when the key is absent)',
   'cm.cockpit lookY'],
  ['// ST-454 (E64, I487): flight-path camera adjustment (E62-preserving). ',
   '// I504 (ST-470): COCKPIT camera-relative thrust rotation. In the first-person seat the player\n// only sees what is in front, so the on-screen thrust basis is the camera basis (screen-up =\n// along the seat axis, screen-right = camera right), not the fixed chase basis (screen-up = sim -y).\n// (tx, ty) = thrust in the screen basis; aim = ship aim angle (fwd = (cos aim, sin aim)).\n// screen-up -> fwd = (cos a, sin a); screen-right -> (-sin a, cos a). Identity at the default\n// aim -PI/2 (nose-up), so the legacy screen-basis convention is preserved where it already worked.\nexport function cockpitThrust(tx, ty, aim, out) {\n  const sa = Math.sin(aim), ca = Math.cos(aim);\n  out.x = -tx * sa - ty * ca;\n  out.y = tx * ca - ty * sa;\n  return out;\n}\n\n// ST-454 (E64, I487): flight-path camera adjustment (E62-preserving). ',
   'cm.cockpitThrust']
]);

// ---------- src/main.js (mixed EOL, BOM) ----------
patch('src/main.js', [
  ["import { chaseTargets, overviewTargets, cockpitTargets, flightPathCam } from './core/cameraModel.js';",
   "import { chaseTargets, overviewTargets, cockpitTargets, flightPathCam, cockpitThrust } from './core/cameraModel.js';",
   'main.import'],
  ['const shipFwd = { x: 0, y: 0 }; // ST-074: scratch for ship.forward()',
   'const shipFwd = { x: 0, y: 0 }; // ST-074: scratch for ship.forward()\u0000const cockpitThrustOut = { x: 0, y: 0 }; const cockpitDragOut = { x: 0, y: 0 }; // I504 (ST-470): scratch for cockpit camera-relative thrust/aim rotation (no per-frame alloc)',
   'main.scratch'],
  ['    return { x: sp.x + input.touchDrag.x * 10, y: sp.y + input.touchDrag.y * 10 };',
   "    const drag = camMode === 'cockpit' ? cockpitThrust(input.touchDrag.x, input.touchDrag.y, world.ship.aim, cockpitDragOut) : input.touchDrag; // I504 (ST-470): camera-relative in cockpit (chase keeps the screen-basis identity)\u0000    return { x: sp.x + drag.x * 10, y: sp.y + drag.y * 10 };",
   'main.touchDrag'],
  ['  const it = intent || { thrust: input.state.thrust, aimPoint: resolveAimPoint(), firing: input.state.firing };',
   "  const it = intent || { thrust: camMode === 'cockpit' ? cockpitThrust(input.state.thrust.x, input.state.thrust.y, world.ship.aim, cockpitThrustOut) : input.state.thrust, aimPoint: resolveAimPoint(), firing: input.state.firing }; // I504 (ST-470): cockpit = camera-relative WASD (screen-up = along the seat axis); chase keeps the screen-basis thrust (bit-identical; the scripted-intent path bypasses this line so the causal harness is untouched)",
   'main.intent'],
  ['  shipMesh.group.visible = !(inRun && camMode === \'cockpit\'); // ST-416 (I446): hide the ship in cockpit first-person',
   '  shipMesh.group.visible = true; // I504 (ST-470): ship visible in cockpit too (nose + canopy frame the seat, per user request); chase framing unchanged (pin EXACT)',
   'main.shipvisible'],
  ['  reticle.sync(world.ship, st === STATE.PLAYING, inRun && camMode === \'cockpit\'); // I44: only while playing; ST-416: emphasize the fire-line in cockpit',
   "  reticle.sync(world.ship, st === STATE.PLAYING && !(inRun && camMode === 'cockpit'), false); // I44: only while playing; I504 (ST-470): 3D fire-line hidden in cockpit (replaced by the small screen-center dot on the bearing-strip HUD)",
   'main.reticle'],
  ['    if (onPath) { camTY += fpA.elev; lookTY = fpA.elev; } // ST-454 (I487): cockpit rides path altitude',
   '    if (onPath) { camTY += fpA.elev; lookTY += fpA.elev; } // ST-454 (I487); I504 (ST-470): cockpit rides path altitude (additive: the lookDrop pitch survives on the campaign path)',
   'main.cockpitpath']
]);

// ---------- src/render/bearingStrip.js (LF) ----------
patch('src/render/bearingStrip.js', [
  ['  document.body.appendChild(canvas);',
   "  document.body.appendChild(canvas);\n  const dot = document.createElement('div'); // I504 (ST-470): small screen-center aiming dot (replaces the 3D fire-line in cockpit)\n  dot.id = 'vr-cockpit-dot';\n  dot.setAttribute('aria-hidden', 'true');\n  dot.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:55;width:4px;height:4px;border-radius:50%;background:rgba(235,245,255,0.85);box-shadow:0 0 4px rgba(127,212,255,0.6);opacity:0;transition:opacity .3s;pointer-events:none;';\n  document.body.appendChild(dot);",
   'bs.dot-create'],
  ["      canvas.style.opacity = on ? '1' : '0';",
   "      canvas.style.opacity = on ? '1' : '0';\n      dot.style.opacity = on ? '1' : '0'; // I504 (ST-470): the center dot fades with the cockpit",
   'bs.dot-opacity'],
  ["      canvas.style.transition = opts.reducedMotion ? 'none' : 'opacity .3s';",
   "      canvas.style.transition = opts.reducedMotion ? 'none' : 'opacity .3s';\n      dot.style.transition = opts.reducedMotion ? 'none' : 'opacity .3s';",
   'bs.dot-rm'],
  ['  return { update, el: canvas };',
   '  return { update, el: canvas, elDot: dot };',
   'bs.return']
]);

// ---------- tests/cameraModel.test.js (LF) ----------
patch('tests/cameraModel.test.js', [
  ["import { clamp01, smoothstep01, dollyFactor, chaseTargets, projectNdc, overviewTargets, cockpitTargets } from '../src/core/cameraModel.js';",
   "import { clamp01, smoothstep01, dollyFactor, chaseTargets, projectNdc, overviewTargets, cockpitTargets, cockpitThrust } from '../src/core/cameraModel.js';",
   'test.import'],
  ['    assert.ok(Math.abs(o.lookY) < 1e-12);',
   '    assert.ok(Math.abs(o.lookY - (CFG.cockpitHeight - CFG.cockpitLookDrop)) < 1e-12); // I504: gentle down-pitch',
   'test.lookY', 2],
  ['EOF_APPEND_MARKER', '', 'noop', 0]
]);

// append the new test block to the test file (LF, no placeholder needed)
{
  const f = 'tests/cameraModel.test.js';
  let s = fs.readFileSync(f, 'utf8');
  const bom = s.charCodeAt(0) === 0xFEFF;
  if (bom) s = s.slice(1);
  const block = [
'',
'// I504 (ST-470): cockpit camera-relative thrust rotation',
'const thr = { x: 99, y: 99 };',
'',
"test('cockpitThrust: identity at the default aim (-PI/2, nose-up) - the legacy screen basis', () => {",
'  const a = -Math.PI / 2;',
'  for (const v of [[0, -1], [0, 1], [1, 0], [-1, 0], [SQ, -SQ]]) {',
'    cockpitThrust(v[0], v[1], a, thr);',
'    assert.equal(thr.x, v[0]); assert.equal(thr.y, v[1]);',
'  }',
'});',
'',
"test('cockpitThrust: a=0 (nose-east) maps screen-up to +x and screen-right to +y', () => {",
'  cockpitThrust(0, -1, 0, thr); assert.equal(thr.x, 1); assert.equal(thr.y, 0); // W = along the nose',
'  cockpitThrust(1, 0, 0, thr); assert.equal(thr.x, 0); assert.equal(thr.y, 1); // D = screen-right',
'  cockpitThrust(0, 1, 0, thr); assert.equal(thr.x, -1); assert.equal(thr.y, 0); // S = astern',
'  cockpitThrust(-1, 0, 0, thr); assert.equal(thr.x, 0); assert.equal(thr.y, -1); // A = screen-left',
'});',
'',
"test('cockpitThrust: rotation preserves magnitude, zero stays zero, basis stays orthonormal (any aim)', () => {",
'  for (const a of [0, 0.7, -2.1, Math.PI]) {',
'    cockpitThrust(0.6, -0.8, a, thr);',
'    assert.ok(Math.abs(Math.hypot(thr.x, thr.y) - 1) < 1e-12);',
'    cockpitThrust(0, 0, a, thr);',
'    assert.equal(thr.x, 0); assert.equal(thr.y, 0);',
'    cockpitThrust(0, -1, a, thr); const ux = thr.x, uy = thr.y; // screen-up -> fwd',
'    cockpitThrust(1, 0, a, thr); // screen-right -> camera right',
"    assert.ok(Math.abs(ux * Math.cos(a) + uy * Math.sin(a) - 1) < 1e-12, 'screen-up maps to fwd');",
"    assert.ok(Math.abs(ux * thr.x + uy * thr.y) < 1e-12, 'screen-right is perpendicular to screen-up');",
"    assert.ok(Math.abs(thr.x + Math.sin(a)) < 1e-12 && Math.abs(thr.y - Math.cos(a)) < 1e-12, 'right = (-sin a, cos a)');",
'  }',
'});',
'',
"test('cockpitTargets: I504 seat - look drops cockpitLookDrop below the eye (down-pitch frames the nose)', () => {",
'  const p = { x: 0, y: 0 };',
'  const f = { x: 0, y: -1 };',
'  const o = { camX: 99, camY: 99, camZ: 99, lookX: 99, lookY: 99, lookZ: 99 };',
'  cockpitTargets(p, f, CFG, o);',
'  assert.equal(o.camY, CFG.cockpitHeight);',
'  assert.ok(Math.abs(o.lookY - (CFG.cockpitHeight - CFG.cockpitLookDrop)) < 1e-12);',
"  assert.ok(o.lookY < o.camY, 'look point is below the eye (nose in frame)');",
'});',
''
  ].join('\n');
  if (!s.endsWith('\n')) s += '\n';
  s += block;
  fs.writeFileSync(f, (bom ? '\uFEFF' : '') + s);
  console.log('appended I504 tests to ' + f);
}
console.log('ALL PATCHES APPLIED');
