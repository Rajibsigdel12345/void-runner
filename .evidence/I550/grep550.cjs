const fs = require('fs');
for (const f of ['src/main.js', 'src/core/cameraModel.js']) {
  const s = fs.readFileSync(f, 'utf8').split('\n');
  s.forEach((l, i) => {
    if (/camMode|viewMode|cockpitTargets|\bv\b/.test(l) && /camMode|viewMode|cockpit|switchView|setView/.test(l)) console.log(f + (i + 1) + ': ' + l.trim().slice(0, 160));
  });
}
