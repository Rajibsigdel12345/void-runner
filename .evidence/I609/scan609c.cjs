const fs=require('fs');
const s=fs.readFileSync('E:/Game/node_modules/@gltf-transform/functions/dist/index.cjs','utf8');
for(const pat of ['encodeVertexBuffer','encodeIndexBuffer','decodeVertexBuffer','MeshoptEncoder','encodeData','compressMeshopt','function meshopt','meshopt(','encodeRLE','encodeSequentialRLE','encodeChunk']){
  const idx=[...s.matchAll(new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))].length;
  console.log(pat, idx);
}
// show the meshopt() entry point
let i=s.indexOf('function meshopt(');
if(i<0) i=s.indexOf('meshopt =');
if(i>=0) console.log('\n--- meshopt entry ---\n', s.slice(i, i+1500));