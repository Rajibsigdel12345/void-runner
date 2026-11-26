const fs = require('fs');
const v = fs.readFileSync('E:/Game/scripts/vendor.mjs','utf8');
// find the jsm copy section
const i = v.indexOf('jsm');
console.log(v.slice(Math.max(0,i-600), i+2500));