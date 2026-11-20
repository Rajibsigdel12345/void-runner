const fs = require('fs');
const st = fs.readFileSync('src/core/storage.js', 'latin1');
const a = st.indexOf('function migratePayload');
console.log(JSON.stringify(st.slice(a, a + 420)));
const r = st.indexOf('  _read(key)');
console.log('--- _read:', JSON.stringify(st.slice(r, r + 220)));