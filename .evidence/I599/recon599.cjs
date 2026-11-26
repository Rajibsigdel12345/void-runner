const fs = require('fs');
const l = fs.readFileSync('src/core/ship.js','utf8').split('\n');
l.forEach((t,i)=>{ const s=t.trim(); if(s && (s.includes('thrust')||s.includes('vel')||s.includes('step(')||s.includes('aim'))) console.log('ship', i+1, s.slice(0,150)); });
console.log('--- main.js keymap ---');
const m = fs.readFileSync('src/main.js','utf8').split('\n');
m.forEach((t,i)=>{ const s=t.trim(); if(s && (s.includes('KeyW')||s.includes('KeyS')||s.includes('KeyA')||s.includes('KeyD'))) console.log('main', i+1, s.slice(0,150)); });