const fs = require('fs');
const p = 'public/manifest.webmanifest';
const raw = fs.readFileSync(p, 'utf8');
const hasBOM = raw.charCodeAt(0) === 0xFEFF;
const crlf = raw.includes('\r\n');
console.log('BOM=' + hasBOM + ' CRLF=' + crlf + ' bytes=' + Buffer.byteLength(raw, 'utf8'));
const nl = crlf ? '\r\n' : '\n';
const anchor = '"purpose": "any maskable"' + nl + '    }' + nl + '  ]';
if (!raw.includes(anchor)) { console.log('ANCHOR NOT FOUND'); process.exit(1); }
const add = '"purpose": "any maskable"' + nl + '    },' + nl + '    {' + nl + '      "src": "icon-192.png",' + nl + '      "sizes": "192x192",' + nl + '      "type": "image/png",' + nl + '      "purpose": "any"' + nl + '    }' + nl + '  ]';
const out = raw.replace(anchor, add);
fs.writeFileSync(p, out, 'utf8');
const after = fs.readFileSync(p, 'utf8');
console.log('ok, new bytes=' + Buffer.byteLength(after, 'utf8') + ', 192 present=' + after.includes('icon-192.png') + ', 512 kept=' + after.includes('icon-512.png'));
// validate JSON
JSON.parse(after.replace(/^\uFEFF/, ''));
console.log('JSON VALID');