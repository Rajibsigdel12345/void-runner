const { execSync } = require('child_process');
for (const p of [5173,4173,4200,5199]) {
  let r = 'free';
  try {
    const o = execSync('netstat -ano').toString();
    const lines = o.split(/\r?\n/).filter(l => l.indexOf('LISTENING') >= 0 && l.indexOf(':' + p + ' ') >= 0);
    if (lines.length) r = 'BUSY';
  } catch (e) {}
  console.log('port ' + p + ' ' + r);
}
