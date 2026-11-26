const fs = require('fs');
const m = fs.readFileSync('src/main.js','utf8').split('\n');
m.forEach((t,i)=>{ const s=t.trim(); if(s.includes('camMode') && !s.startsWith('//')) console.log('main', i+1, s.slice(0,170)); });
console.log('--- input.js listeners ---');
const inp = fs.readFileSync('src/render/input.js','utf8').split('\n');
inp.forEach((t,i)=>{ const s=t.trim(); if(s.includes('addEventListener') || s.includes('pointermove') || s.includes('keydown')) console.log('input', i+1, s.slice(0,150)); });