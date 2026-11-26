const fs=require('fs');
const s=fs.readFileSync('E:/Game/node_modules/@gltf-transform/extensions/dist/index.cjs','utf8');
let i=s.indexOf('write(context) {');
i=s.indexOf('write(context) {', i+10); // second occurrence (the extension's)
console.log(s.slice(i, i+3000));
// also isFallbackBuffer + getMeshoptMode + prepareAccessor
let j=s.indexOf('function isFallbackBuffer');
console.log('\n--- isFallbackBuffer ---\n', s.slice(j, j+300));
j=s.indexOf('function getMeshoptMode');
console.log('\n--- getMeshoptMode ---\n', s.slice(j, j+800));
j=s.indexOf('function prepareAccessor');
console.log('\n--- prepareAccessor ---\n', s.slice(j, j+2200));