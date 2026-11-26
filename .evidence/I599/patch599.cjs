const fs = require('fs');
const p = 'src/main.js';
const l = fs.readFileSync(p, 'utf8').split('\n');
const i = 1034; // L1035 (0-based 1034)
if (!l[i].includes('cockpitAim(world.ship.pos, ap559, world.ship.aim)')) throw new Error('L1035 mismatch: ' + l[i].slice(0, 200));
const oldLine = l[i];
const newLine = "  const it = intent || { thrust: camMode === 'cockpit' ? cockpitThrust(input.state.thrust.x, input.state.thrust.y, world.ship.aim, cockpitThrustOut) : input.state.thrust, aimPoint: ap559, firing: input.state.firing }; // I504 (ST-470) + ST-564 (I599): cockpit thrust basis = the DAMPED nose = the cockpit camera view direction (the seat looks along ship.aim, so screen-up is always nose-forward; the I559 undamped-pointer basis could flip 180deg when the pointer raycast landed behind the ship, making W read as back / S as forward). ap559 STAYS the aimPoint (firing/aiming intent); touch path already used ship.aim; chase screen-basis unchanged; scripted-intent path bypasses this line (causal harness untouched)";
l[i] = newLine;
fs.writeFileSync(p, l.join('\n'));
console.log('PATCHED L1035');
console.log('old len', oldLine.length, 'new len', newLine.length);