const fs = require('fs');
const g = fs.readFileSync('E:/Game/vendor/jsm/loaders/GLTFLoader.js','utf8');
const lines = g.split('\n');
console.log(lines.slice(1679, 1715).map((l,j)=>(j+1680)+': '+l).join('\n'));