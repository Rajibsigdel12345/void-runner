const fs = require('fs');
const R = (f) => fs.readFileSync('E:/Game/' + f, 'latin1');
const lineOf = (t, from) => { const s = t.lastIndexOf('\n', from) + 1; const e = t.indexOf('\n', from); return t.slice(s, e); };
const ep = R('production/epics.md');
const iEp = ep.indexOf('ST-566');
// find the Stories: line that contains ST-566 (the line listing stories)
const epLine = lineOf(ep, iEp);
console.log('EP LINE:', JSON.stringify(epLine.slice(0, 400)));
const st = R('production/stories.md');
const iSt = st.indexOf('ST-566 E86 far-framing');
console.log('ST LINE:', JSON.stringify(lineOf(st, iSt)));
for (const f of ['production/iterations.md','production/timeline.md','production/session-state/active.md']) {
  const t = R(f);
  console.log(f, 'TAIL5:', JSON.stringify(t.slice(-5)), 'len', t.length);
}
const ac = R('production/session-state/active.md');
const iAc = ac.lastIndexOf('NEXT at I601');
console.log('AC NEXT LINE:', JSON.stringify(lineOf(ac, iAc).slice(-160)));