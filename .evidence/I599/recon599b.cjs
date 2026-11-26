const fs = require('fs');
const m = fs.readFileSync('src/main.js','utf8').split('\n');
m.forEach((t,i)=>{ const s=t.trim(); if(s && (s.includes('KeyW') || s.includes('KeyS') || s.includes('"w"') || s.includes('"s"') || s.includes('thrust.y') || s.includes('thrust.x'))) console.log('main', i+1, s.slice(0,160)); });
console.log('--- cameraModel cockpitTargets ---');
const c = fs.readFileSync('src/core/cameraModel.js','utf8').split('\n');
let start = c.findIndex(t => t.includes('export function cockpitTargets'));
for (let i = Math.max(0,start-14); i < c.length && i < start+40; i++) console.log('cm', i+1, c[i]);