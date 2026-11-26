const fs = require('fs');
const b = fs.readFileSync('E:/Game/scripts/build.mjs','utf8');
// how VENDOR_FILES are processed
const i = b.indexOf('for (const f of VENDOR_FILES');
console.log('=== build.mjs VENDOR_FILES loop ===\n' + (i>=0 ? b.slice(i, i+1600) : 'loop not found; searching copy context...'));
const j = b.indexOf('VENDOR_FILES');
console.log('\n=== around first VENDOR_FILES ref (end of array) ===\n' + b.slice(b.indexOf(']', j), b.indexOf(']', j)+200));
// ADR structure
const a = fs.readFileSync('E:/Game/docs/architecture/vendor-r187-adr.md','utf8');
const k = a.lastIndexOf('|');
console.log('\n=== ADR tail ===\n' + a.slice(-1800));