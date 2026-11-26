const fs = require('fs');
const path = 'E:/Game/';
function bomCount(s){ let c=0; for (let i=0;i<s.length-2;i++){ if (s.charCodeAt(i)===0xEF && s.charCodeAt(i+1)===0xBB && s.charCodeAt(i+2)===0xBF) c++; } return c; }
function rd(p){ return fs.readFileSync(p,'latin1'); }
function wr(p,s){ fs.writeFileSync(p, Buffer.from(s,'latin1')); }
function count(h,needle){ let c=0,i=0; while((i=h.indexOf(needle,i))!==-1){c++;i++;} return c; }
const files = ['production/epics.md','production/stories.md','production/iterations.md','production/timeline.md','production/session-state/active.md','CHANGELOG.md'];
const pre = {};
for (const f of files) pre[f]=bomCount(rd(path+f));
// P1 epics: insert E86 block before the E85 header
let h = rd(path+'production/epics.md');
const a1 = '## E85 - Remastered-4 render-luma re-tune';
if (count(h,a1)!==1) throw new Error('epics anchor count != 1: '+count(h,a1));
const i1 = h.indexOf(a1);
const block = rd(path+'.evidence/I598/epics_block.txt');
wr(path+'production/epics.md', h.slice(0,i1) + block + '\r\n' + h.slice(i1));
// P2 stories: append 4 lines (file already ends LF)
let s = rd(path+'production/stories.md');
wr(path+'production/stories.md', s + rd(path+'.evidence/I598/stories_lines.txt'));
// P3 iterations: append CRLF + entry (file ends bare)
let it = rd(path+'production/iterations.md');
wr(path+'production/iterations.md', it + '\r\n' + rd(path+'.evidence/I598/iterations_entry.txt'));
// P4 timeline: append CRLF CRLF + para (file ends bare)
let tl = rd(path+'production/timeline.md');
wr(path+'production/timeline.md', tl + '\r\n\r\n' + rd(path+'.evidence/I598/timeline_para.txt'));
// P5 active: append CRLF + bullet (file ends bare)
let ac = rd(path+'production/session-state/active.md');
wr(path+'production/session-state/active.md', ac + '\r\n' + rd(path+'.evidence/I598/active_line.txt'));
// P6 CHANGELOG: insert I598 line above the I597 line (pure LF file)
let ch = rd(path+'CHANGELOG.md');
const a6 = '- I597: No visible change';
if (count(ch,a6)!==1) throw new Error('changelog anchor count != 1: '+count(ch,a6));
const i6 = ch.indexOf(a6);
wr(path+'CHANGELOG.md', ch.slice(0,i6) + rd(path+'.evidence/I598/changelog_line.txt') + '\n' + ch.slice(i6));
// BOM delta 0 check
let ok = true;
for (const f of files){ const post=bomCount(rd(path+f)); if (pre[f]!==post){ console.log('BOM DELTA', f, pre[f], '->', post); ok=false; } }
console.log(ok ? 'BOOKKEEP598 PASS (6 patches, all anchors count===1, BOM delta 0)' : 'BOOKKEEP598 FAIL');