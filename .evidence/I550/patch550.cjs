const fs = require('fs');
let s = fs.readFileSync('.evidence/I550/bowprobe550.mjs', 'utf8');
const old = [
  '      c2.position.set(seat.x, h, seat.z);',
  '      c2.up.set(0, 1, 0);',
  '      c2.lookAt(s.pos.x + fwd.x * LOOKFAR, h - drop, s.pos.y + fwd.y * LOOKFAR);',
  '      c2.fov = FOV; c2.updateProjectionMatrix();',
  '      c2.updateMatrixWorld(true);',
  '      c2.matrixWorldInverse.copy(c2.matrixWorld).invert();'
].join('\n');
const neu = [
  '      c2.position.set(seat.x, h, seat.z);',
  '      c2.updateMatrixWorld(true); // lookAt reads the world position - sync it first',
  '      c2.up.set(0, 1, 0);',
  '      c2.lookAt(s.pos.x + fwd.x * LOOKFAR, h - drop, s.pos.y + fwd.y * LOOKFAR);',
  '      c2.fov = FOV; c2.updateProjectionMatrix();',
  '      c2.updateMatrixWorld(true);',
  '      c2.matrixWorldInverse.copy(c2.matrixWorld).invert();',
  '      if (h === heights[0] && drop === drops[0]) dbg = { camWorld: [c2.position.x, c2.position.y, c2.position.z], parent: c2.parent ? (c2.parent.name || "(parent)") : null, bowView: (function () { const vv = new V(0, 0.45, -0.85).applyMatrix4(c2.matrixWorldInverse); return [vv.x, vv.y, vv.z]; })(), horizonClip: (function () { const vv = new V(0, 0, -300).applyMatrix4(c2.matrixWorldInverse); const qq = vv.clone().applyMatrix4(c2.projectionMatrix); return [qq.x, qq.y, qq.w]; })() };'
].join('\n');
if (!s.includes(old)) { console.error('ANCHOR NOT FOUND'); process.exit(1); }
s = s.replace(old, neu);
const old2 = '    const results = [];';
const neu2 = '    let dbg = null;\n    const results = [];';
if (!s.includes(old2)) { console.error('ANCHOR2 NOT FOUND'); process.exit(1); }
s = s.replace(old2, neu2);
const old3 = 'return { nPts: pts.length, meshes: [...new Set(meshNames)], shipGroupPos: [g.position.x, g.position.y, g.position.z], shipGroupRotZ: +g.rotation.z.toFixed(3), shipWorldY: g.position.y, results: results };';
const neu3 = 'return { dbg: dbg, nPts: pts.length, meshes: [...new Set(meshNames)], shipGroupPos: [g.position.x, g.position.y, g.position.z], shipGroupRotZ: +g.rotation.z.toFixed(3), shipWorldY: g.position.y, results: results };';
if (!s.includes(old3)) { console.error('ANCHOR3 NOT FOUND'); process.exit(1); }
s = s.replace(old3, neu3);
fs.writeFileSync('.evidence/I550/bowprobe550.mjs', s);
console.log('patched ok');
