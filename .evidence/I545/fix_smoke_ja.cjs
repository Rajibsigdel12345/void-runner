const fs=require('fs');
const p='.evidence/I545/smoke545.mjs';
const s=fs.readFileSync(p,'latin1');
const ja2=fs.readFileSync('.evidence/I545/i18n_ref/ja2.bin');
const jaEsc=[...ja2.toString('utf8')].map(c=>'\\u'+c.codePointAt(0).toString(16).padStart(4,'0')).join('');
console.log('NEW ja esc (from ja2.bin):',jaEsc);
const lines=s.split('\n');
let idx=lines.findIndex(l=>l.includes('setLocale(ja)') && l.includes('re-emits label'));
if(idx<0){console.error('ANCHOR MISSING');process.exit(1);}
const re=/(\(await label\(\)\) === ")((?:\\u[0-9a-f]{4})+)(")/;
const m=lines[idx].match(re);
if(!m){console.error('ESC RUN NOT FOUND: '+lines[idx]);process.exit(1);}
console.log('OLD ja esc (in file):',m[2]);
lines[idx]=lines[idx].replace(re,'$1'+jaEsc+'$3');
fs.writeFileSync(p,lines.join('\n'),'latin1');
const s2=fs.readFileSync(p,'latin1');
const l2=s2.split('\n').find(l=>l.includes('setLocale(ja)') && l.includes('re-emits label'));
const m2=l2.match(re);
const dec=eval('"'+m2[2]+'"');
console.log('VERIFIED dec==ja2.bin:', dec===ja2.toString('utf8'));
console.log('NEW line:',l2);
console.log('FIX_SMOKE_JA DONE');
