const fs = require('fs');
const m = fs.readFileSync('src/main.js','utf8').split('\n');
m.forEach((t,i)=>{ const s=t.trim(); if(s && (s.includes('KeyW') || s.includes('KeyA') || s.includes('KeyS') || s.includes('KeyD'))) console.log('main', i+1, s.slice(0,170)); });
console.log('--- L760-790 ---');
for (let i=759;i<790;i++) console.log('main', i+1, m[i]);