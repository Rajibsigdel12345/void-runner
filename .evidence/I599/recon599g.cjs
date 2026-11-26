const fs = require('fs'); const path = require('path');
function walk(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(p.endsWith('.js')){ const l=fs.readFileSync(p,'utf8').split('\n'); l.forEach((t,i)=>{ if(t.includes('cockpitAim')) console.log(p, i+1, t.trim().slice(0,160)); }); } } }
walk('src'); walk('tests');