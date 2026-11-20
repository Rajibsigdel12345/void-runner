const fs = require('fs');
const b = fs.readFileSync('public/icon-192.png');
const sig = b.slice(0,8).toString('hex') === '89504e470d0a1a0a';
const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
console.log('sig_ok=' + sig + ' w=' + w + ' h=' + h + ' bytes=' + b.length);
if (!sig || w !== 192 || h !== 192) process.exit(1);
console.log('ICON192 VALID');