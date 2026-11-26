const fs=require('fs');
const s=fs.readFileSync('E:/Game/node_modules/@gltf-transform/functions/dist/index.cjs','utf8');
// find the meshopt function area
let i=s.indexOf('EXT_meshopt_compression');
while(i>=0){
  const ctx=s.slice(Math.max(0,i-300), i+300);
  if(/encode|MeshoptEncoder|meshopt_encoder|require\(/.test(ctx)){ console.log('--- at',i,'---'); console.log(ctx); break; }
  i=s.indexOf('EXT_meshopt_compression', i+1);
}
// find all require calls in file
const reqs=[...s.matchAll(/require\(["']([^"']+)["']\)/g)].map(m=>m[1]);
console.log('ALL requires:', [...new Set(reqs)]);