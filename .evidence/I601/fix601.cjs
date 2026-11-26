const fs = require('fs');
const p = 'E:/Game/.evidence/I601/farframe601.mjs';
let t = fs.readFileSync(p, 'utf8');
const a = 'import CONFIG from "../../src/core/config.js";';
const b = 'import { CONFIG } from "../../src/core/config.js";';
if (t.split(a).length !== 2) { console.error('ANCHOR A count != 1'); process.exit(1); }
t = t.slice(0, t.indexOf(a)) + b + t.slice(t.indexOf(a) + a.length);
const i0 = t.indexOf('fs.mkdirSync(path.dirname');
if (i0 < 0) { console.error('mkdir anchor missing'); process.exit(1); }
const i1 = t.indexOf('\n', i0);
if (i1 < 0) { console.error('mkdir line not terminated'); process.exit(1); }
t = t.slice(0, i0) + 'fs.mkdirSync(path.join(process.cwd(), ".evidence/I601"), { recursive: true });' + t.slice(i1);
fs.writeFileSync(p, t, 'utf8');
console.log('PATCH OK, bytes now', Buffer.byteLength(t));