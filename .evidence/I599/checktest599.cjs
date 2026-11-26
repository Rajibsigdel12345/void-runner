const fs = require('fs');
const p = 'tests/cameraModel.test.js';
const b = fs.readFileSync(p);
let lf = 0, cr = 0; for (let i = 0; i < b.length; i++) { if (b[i] === 10) lf++; if (b[i] === 13) cr++; }
console.log('test file: bytes=' + b.length, 'LF=' + lf, 'CR=' + cr, 'tail=' + JSON.stringify(b.slice(-6).toString('latin1')));