const fs=require('fs');
const p='E:/Game/node_modules/meshoptimizer/package.json';
const j=JSON.parse(fs.readFileSync(p));
console.log('version:',j.version,'| main:',j.main,'| exports:',JSON.stringify(j.exports||{}));
const files=fs.readdirSync('E:/Game/node_modules/meshoptimizer');
console.log('files:',files.join(', '));