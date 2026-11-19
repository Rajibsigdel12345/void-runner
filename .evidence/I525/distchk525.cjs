const fs = require('fs');
const dist = fs.readFileSync('E:/Game/dist/src/core/game.js').toString('latin1');
function count(h, ne) { let n = 0, i = 0; i = h.indexOf(ne); while (i >= 0) { n++; i = h.indexOf(ne, i + ne.length); } return n; }
for (const t of ["source:'bullet'","source:'bulwark'","source:'rock_'","source:'boss_'","source:'mine'","source:\"bullet\"","source:\"bulwark\"","source:\"rock_\"","source:\"boss_\"","source:\"mine\""]) {
  console.log(JSON.stringify(t), count(dist, t));
}
const i = dist.indexOf('bulwark');
if (i >= 0) console.log('CTX:', dist.slice(i - 120, i + 40));