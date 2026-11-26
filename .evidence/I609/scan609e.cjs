const fs=require('fs');
const s=fs.readFileSync('E:/Game/node_modules/@gltf-transform/extensions/dist/index.cjs','utf8');
let i=s.indexOf('_prewriteAccessors(context) {');
console.log(s.slice(i, i+5500));