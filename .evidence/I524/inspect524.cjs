const fs = require('fs');
const R = (p) => fs.readFileSync('E:/Game/' + p, 'latin1');
const W = (p) => p;
function head(label, t, n) { console.log('=== ' + label + ' (' + t.length + 'B, CRLF=' + t.includes('\r') + ')'); }
// epics.md: E70 block
let ep = R('production/epics.md');
let i = ep.indexOf('E70');
head('epics E70 block start@' + i, ep, 0);
console.log(ep.slice(Math.max(0, i - 200), i + 2200));
// stories.md: STATUS (I523) context
let st = R('production/stories.md');
let j = st.indexOf('STATUS (I523)');
head('stories STATUS(I523)@' + j, st, 0);
console.log(st.slice(Math.max(0, j - 700), j + 500));
// iterations.md tail
let it = R('production/iterations.md');
head('iterations tail', it, 0);
console.log(it.slice(-2600));
// timeline.md tail
let tl = R('production/timeline.md');
head('timeline tail', tl, 0);
console.log(tl.slice(-700));
// CHANGELOG head
let cl = R('CHANGELOG.md');
head('CHANGELOG head', cl, 0);
console.log(cl.slice(0, 900));
// active.md tail
let ac = R('production/active.md');
head('active tail', ac, 0);
console.log(ac.slice(-2200));