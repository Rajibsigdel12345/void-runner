const fs=require('fs');
const d='E:/Game/node_modules/meshoptimizer';
const t=fs.readFileSync(d+'/meshopt_encoder.d.ts','utf8');
console.log(t.length,'B');
console.log(t.split('\n').filter(l=>/export|declare/.test(l)).join('\n').slice(0,3000));