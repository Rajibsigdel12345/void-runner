const fs=require('fs');
const d='E:/Game/node_modules/@gltf-transform/extensions';
function walk(x){for(const e of fs.readdirSync(x,{withFileTypes:true})){const f=x+'/'+e.name;if(e.isDirectory())walk(f);else if(f.endsWith('.cjs')){const s=fs.readFileSync(f,'utf8');if(s.includes('EXTMeshoptCompression')){console.log('FILE:',f,s.length);}}}}
walk(d);
const f='E:/Game/node_modules/@gltf-transform/extensions/dist/index.cjs';
const s=fs.readFileSync(f,'utf8');
let i=s.indexOf('class EXTMeshoptCompression');
if(i<0){i=s.indexOf('EXTMeshoptCompression =');}
console.log(s.slice(i, i+6000));