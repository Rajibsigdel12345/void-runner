const fs = require('fs');
function read(p){ return fs.readFileSync(p,'utf8'); }
// 1. import map from index.html
const idx = read('E:/Game/index.html');
const m = idx.match(/<script type="importmap">[\s\S]*?<\/script>/);
console.log('=== IMPORT MAP ===\n' + (m ? m[0] : 'NOT FOUND'));
// 2. build.mjs VENDOR_FILES
const b = read('E:/Game/scripts/build.mjs');
const bm = b.match(/VENDOR_FILES[\s\S]{0,1200}/);
console.log('\n=== build.mjs VENDOR_FILES ===\n' + (bm ? bm[0] : 'NOT FOUND'));
// 3. vendor.mjs raw pin section
const v = read('E:/Game/scripts/vendor.mjs');
const vm = v.match(/meshopt[^\n]*(\n[^\n]*){0,10}/gi);
console.log('\n=== vendor.mjs meshopt mentions ===\n' + (vm ? vm.join('\n') : 'NONE'));
// raw pin: look for a list of raw (unminified) files
const rawm = v.match(/RAW[^\n]*(\n[^\n]*){0,20}/i);
console.log('\n=== vendor.mjs RAW block ===\n' + (rawm ? rawm[0] : 'NONE'));
// 4. decoder TRIANGLES support
const d = read('E:/Game/vendor/jsm/libs/meshopt_decoder.module.js');
const t = d.indexOf('TRIANGLES');
console.log('\n=== decoder TRIANGLES idx === ' + t);
if (t>=0) console.log(d.slice(Math.max(0,t-400), t+400));
const sz = fs.statSync('E:/Game/vendor/jsm/libs/meshopt_decoder.module.js').size;
console.log('\n=== decoder size === ' + sz);
const c = require('crypto');
console.log('=== decoder sha256-16 === ' + c.createHash('sha256').update(d).digest('hex').slice(0,16).toUpperCase());