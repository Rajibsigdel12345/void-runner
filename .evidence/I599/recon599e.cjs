const fs = require('fs'); const path = require('path');
function walk(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(p.endsWith('.js')){ const l=fs.readFileSync(p,'utf8').split('\n'); l.forEach((t,i)=>{ const s=t.trim(); if(s.includes('KeyW')) console.log(p, i+1, s.slice(0,170)); }); } } }
walk('src');