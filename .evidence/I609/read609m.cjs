const fs = require('fs');
const g = fs.readFileSync('E:/Game/vendor/jsm/loaders/GLTFLoader.js','utf8');
const lines = g.split('\n');
const hits = [];
lines.forEach((l, i) => { if (/meshopt|Meshopt/i.test(l)) hits.push(i); });
console.log('meshopt line numbers: ' + hits.map(h => h+1).join(', '));
for (const h of hits.slice(0, 30)) {
  console.log('\n--- ctx @' + (h+1) + ' ---');
  console.log(lines.slice(Math.max(0,h-6), h+18).map((l,j)=>l).join('\n'));
}