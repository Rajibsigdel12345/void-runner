const fs = require('fs');
function bomCount(buf) { let c = 0; for (let i = 0; i + 2 < buf.length; i++) { if (buf[i] === 0xEF && buf[i+1] === 0xBB && buf[i+2] === 0xBF) { c++; i += 2; } } return c; }
function must(cond, msg) { if (!cond) { console.error('ASSERT FAIL:', msg); process.exit(1); } }
const p = 'E:/Game/production/session-state/active.md';
const before = fs.readFileSync(p);
const bb = bomCount(before);
must(bb === 0, 'pre-BOM ' + bb + ' != 0');
must(!before.includes(Buffer.from('NEXT at I573', 'ascii')), 'I573 NEXT line already present');
const anchor = Buffer.from('vendor 4/4 EXACT, BOM delta 0; push pending]\r\n', 'ascii');
must(before.slice(before.length - anchor.length).equals(anchor), 'tail anchor mismatch');
const line = '\r\n- NEXT at I573 = ST-541 sweep573 pre-lever re-audit (E80): rules573.md FROZEN PRE-RUN in .evidence/I574/ (clone of the .evidence/I570/rules569.md lineage with E80 labels: 30 FRESH seeds 57300+i, full director from wave 1, frozen I328 kiter verbatim, cap 36000 ticks @ 1/60, in-process zero servers/tabs; thresholds rules564 verbatim: H >= 0.600 Branch B / <= 0.400 Branch C / else dominant-source; heavyweights = MONOLITH + SPLICER + WARDEN) + the FROZEN E80 adjudication (research sec.6): (B) H >= 0.600 AND SPLICER = largest single source -> lever [2]; (A*) 0.400 < H < 0.600 AND SPLICER largest AND wave-10 cluster >= wave-5 cluster -> lever [2] (single-boss extension, recorded with the measurement); (C) otherwise -> ST-542 VOID + accept (E78 pattern); material divergence -> RECORD + REGISTER before any code change (I570 pattern) - .evidence/I574/ [rules573.md + sweep573.mjs + sweep573.json + results573.txt] + bookkeeping (epics E80 ST-541 / stories ST-541 / active / timeline / CHANGELOG)\r\n';
fs.writeFileSync(p, Buffer.concat([before, Buffer.from(line, 'ascii')]));
const after = fs.readFileSync(p);
const ab = bomCount(after);
must(ab === bb, 'BOM delta != 0');
console.log('OK active.md', before.length, '->', after.length, 'B, BOM 0->0');
console.log('BOOKKEEP573 COMPLETE: 6/6 files spliced with asserted anchors + BOM counts');
