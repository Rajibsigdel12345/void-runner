const fs=require('fs');
const d='E:/Game/node_modules/@gltf-transform/functions';
function walk(x){for(const e of fs.readdirSync(x,{withFileTypes:true})){const f=x+'/'+e.name;if(e.isDirectory())walk(f);else if(f.endsWith('.js')||f.endsWith('.mjs')||f.endsWith('.cjs')){const s=fs.readFileSync(f,'utf8');if(/meshopt/i.test(s)){console.log(f.replace(d,''),'|',s.length,'B | EXT_meshopt_compression:',/EXT_meshopt_compression/.test(s));}}}}
walk(d);