const fs = require('fs');
const st = fs.readFileSync('src/core/storage.js', 'latin1');
let a = st.indexOf('_readVersioned(');
a = st.indexOf('_readVersioned(', a + 1); // skip the call site, find the definition
console.log('--- _readVersioned def:');
console.log(JSON.stringify(st.slice(a - 300, a + 700)));
const k = st.indexOf('campaignKey');
console.log('--- campaignKey:');
console.log(JSON.stringify(st.slice(k - 200, k + 120)));