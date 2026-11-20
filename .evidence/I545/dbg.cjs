const fs=require('fs');
const s=fs.readFileSync('.evidence/I545/smoke545.mjs','latin1');
const line=s.split('\n').find(l=>l.includes('setLocale(ja)') && l.includes('re-emits label'));
console.log('LINE:',JSON.stringify(line));
const re=/(\(await label\(\) === ")((?:\\u[0-9a-f]{4})+)(")/;
console.log('MATCH:', line.match(re)? 'YES':'NO');
// try a looser probe
console.log('has === " :', line.includes('=== "'));
console.log('after-===-char-codes:', JSON.stringify([...line.slice(line.indexOf('=== "'),line.indexOf('=== "')+12)].map(c=>c.charCodeAt(0))));
