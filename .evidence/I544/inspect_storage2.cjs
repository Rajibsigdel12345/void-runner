const fs = require('fs');
const st = fs.readFileSync('src/core/storage.js', 'latin1');
const a = st.indexOf('_readVersioned(key)');
console.log(JSON.stringify(st.slice(a - 100, a + 520)));
const v = st.indexOf('STORE_VERSION =');
console.log('--- STORE_VERSION:', JSON.stringify(st.slice(v, v + 60)));
const w = st.indexOf('_write(key, data)');
console.log('--- _write:', JSON.stringify(st.slice(w, w + 260)));