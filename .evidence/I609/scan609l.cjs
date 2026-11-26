const fs=require('fs');
const s=fs.readFileSync('E:/Game/vendor/jsm/loaders/GLTFLoader.js','utf8');
let i=s.indexOf('loadBufferView');
console.log(s.slice(i-100, i+1400));