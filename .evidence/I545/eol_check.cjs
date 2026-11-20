const fs=require('fs');
const files=['production/epics.md','production/stories.md','production/iterations.md','production/timeline.md','production/session-state/active.md','CHANGELOG.md'];
for(const f of files){const b=fs.readFileSync(f);let crlf=0,lf=0,cr=0;for(let i=0;i<b.length;i++){if(b[i]===10){lf++;if(i>0&&b[i-1]===13)crlf++;}else if(b[i]===13){cr++;}}console.log(f,'CRLF='+crlf,'loneLF='+(lf-crlf),'loneCR='+(cr-crlf),'endNL='+(b[b.length-1]===10));}
