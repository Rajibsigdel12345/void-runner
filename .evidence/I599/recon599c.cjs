const fs = require('fs');
const m = fs.readFileSync('src/main.js','utf8').split('\n');
m.forEach((t,i)=>{ const s=t.trim(); if(s && (s.includes('KEYS') || s.includes('keys[') || s.includes('thrust.x =') || s.includes('thrust.y =') || s.includes('updateKeys') || s.includes('keydown'))) console.log('main', i+1, s.slice(0,170)); });