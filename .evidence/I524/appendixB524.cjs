const fs = require('fs');
const p = 'E:/Game/design/e69-enemy-spec.md';
const t = 'E:/Game/.evidence/I524/appendixB524.txt';
const raw = fs.readFileSync(p);
const head16 = raw.slice(0, 16).toString('hex');
if (head16 !== '232045363920456e656d792053706563') throw new Error('HEAD16 MISMATCH: ' + head16);
const tb = fs.readFileSync(t);
for (const b of tb) { if (b > 127) throw new Error('NON-ASCII IN APPENDIX TXT'); if (b === 13) throw new Error('CR IN APPENDIX TXT'); }
const txt = tb.toString('latin1');
let base = raw.toString('latin1');
if (!base.endsWith('\n')) base += '\n';
if (base.includes('## Appendix B (E70, I524/ST-490)')) throw new Error('APPENDIX B ALREADY PRESENT');
fs.writeFileSync(p, Buffer.from(base + txt, 'latin1'));
const chk = fs.readFileSync(p);
console.log('APPENDIX-B OK', raw.length, '->', chk.length, 'head16', chk.slice(0, 16).toString('hex'));