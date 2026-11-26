const fs = require('fs');
const m = fs.readFileSync('src/main.js','utf8').split('\n');
for (let i=870;i<880;i++) console.log('main', i+1, m[i]);
console.log('--- input.js onKeyDown/onMove ---');
const inp = fs.readFileSync('src/render/input.js','utf8').split('\n');
inp.forEach((t,i)=>{ const s=t.trim(); if(s.includes('function onKeyDown')||s.includes('function onKeyUp')||s.includes('function onMove')||s.includes('e.code')||s.includes('e.key')) console.log('input', i+1, s.slice(0,150)); });