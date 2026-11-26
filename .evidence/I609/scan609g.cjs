const fs=require('fs');
const s=fs.readFileSync('E:/Game/node_modules/@gltf-transform/extensions/dist/index.cjs','utf8');
// find the EXTMeshoptCompression write method: locate 'Puts encoded data into glTF output'
let i=s.indexOf('Puts encoded data into glTF output');
i=s.indexOf('write(context) {', i);
console.log(s.slice(i, i+2600));