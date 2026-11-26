const fs=require('fs');
const s=fs.readFileSync('E:/Game/vendor/jsm/loaders/GLTFLoader.js','utf8');
let i=s.indexOf('MeshoptDecoder');
while(i>=0){
  console.log('\n=== at',i,'===');
  console.log(s.slice(i-400, i+1200));
  i=s.indexOf('MeshoptDecoder', i+1);
  if(i>60000) break;
}