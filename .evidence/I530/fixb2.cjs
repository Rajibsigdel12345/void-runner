const fs = require('fs');
const p = 'E:/Game/.evidence/I530/probe_farview530.mjs';
let s = fs.readFileSync(p, 'latin1');
const bad = `for (const [label, dTest] of [['d=0', 0], ['d=maxExc(' + maxExcD.toFixed(1) + ')', maxExcD]]) {
  pathPoint(dTest, CONFIG.flightPath, A);
  const p = { x: A.x, y: A.y }, fwd = { x: A.tx, y: A.ty };
  chaseTargets(p, fwd, 0, Math.hypot(p.x, p.y), arenaR, CONFIG.camera, chase);
  const c = { x: chase.camX, y: chase.camY, z: chase.camZ }, l = { x: chase.lookX, y: chase.lookY, z: chase.lookZ };`;
const good = `for (const [label, dTest] of [['d=0', 0], ['d=maxExc(' + maxExcD.toFixed(1) + ')', maxExcD]]) {
  pathPoint(dTest, CONFIG.flightPath, A);
  pathPoint(dTest + frameDist, CONFIG.flightPath, B);
  const p = { x: A.x, y: A.y }, fwd = { x: A.tx, y: A.ty };
  chaseTargets(p, fwd, 0, Math.hypot(p.x, p.y), arenaR, CONFIG.camera, chase);
  const fr = flightPathCam(chase, A, B, CONFIG.flightPath, cam, look);
  const c = { x: fr.cam.x, y: fr.cam.y, z: fr.cam.z }, l = { x: fr.look.x, y: fr.look.y, z: fr.look.z };`;
if (s.split(bad).length - 1 !== 1) throw new Error('B2 anchor not found exactly once');
s = s.replace(bad, good);
s = s.replace('// B2: invariance at two campaign positions (d=0 vs d=maxExcursion), same method as I504', '// B2: invariance at two campaign positions (d=0 vs d=maxExcursion), with the flightPathCam lift (the actual campaign rig)');
fs.writeFileSync(p, s, 'latin1');
console.log('B2 FIXED');