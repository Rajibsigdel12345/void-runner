const fs = require('fs');
function lines(p) { const t = fs.readFileSync(p, 'utf8'); return t.split(/(?<=\n)/); } // keep line endings
function dump(p, pred, label) {
  const L = lines(p);
  console.log('===== ' + label + ' (' + p + ', ' + L.length + ' lines) =====');
  L.forEach((ln, i) => { if (pred(i, ln)) console.log(String(i+1) + ': ' + JSON.stringify(ln)); });
}
const A = 'tests/assetGlbs.test.js';
dump(A, (i, ln) => i < 14 || /MAX_FILE_BYTES|1024\b|5700|28308|12000|buf\.length|fileSize|parseGlb|remaster4Bake|return \{ buf/.test(ln), A);
fs.copyFileSync = fs.copyFileSync;
// full dumps of small files
for (const p of ['tests/assetPerf.test.js', 'src/render/assetLoader.js', 'scripts/vendor.mjs']) {
  const L = lines(p);
  console.log('===== ' + p + ' (' + L.length + ' lines) =====');
  L.forEach((ln, i) => console.log(String(i+1) + ': ' + JSON.stringify(ln)));
}
dump('scripts/build.mjs', (i, ln) => /VENDOR_FILES|jsm\/loaders|jsm\/libs|minify|three\.|GLTFLoader/.test(ln), 'scripts/build.mjs');

