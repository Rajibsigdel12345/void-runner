const fs = require('fs');
const OUT = 'E:/Game/.evidence/I590/';
const data = JSON.parse(fs.readFileSync(OUT + 'audit_i590.json', 'utf8'));
const n = data.length;
function pct(key) {
  const sorted = data.slice().sort((a, b) => a[key] - b[key]);
  const out = {};
  sorted.forEach((d, i) => { out[d.name] = i / (n - 1) * 100; });
  return out;
}
const pTri = pct('tris');
const pBpt = pct('b_per_tri');
const pFill = pct('sil96');
const rows = data.map(d => {
  const sTri = pTri[d.name];
  const sBpt = 100 - pBpt[d.name];
  const sFill = pFill[d.name];
  const comp = (sTri + sBpt + sFill) / 3;
  return { name: d.name, tris: d.tris, bytes: d.bytes, bpt: d.b_per_tri, sil96: d.sil96, sTri: sTri.toFixed(1), sBpt: sBpt.toFixed(1), sFill: sFill.toFixed(1), comp: comp.toFixed(2) };
});
rows.sort((a, b) => parseFloat(a.comp) - parseFloat(b.comp));
console.log('rank ship            tris   bytes   b/t  sil96  sTri sBpt sFill comp');
rows.forEach((r, i) => {
  console.log(String(i + 1).padStart(2) + '  ' + r.name.padEnd(16) + String(r.tris).padStart(6) + String(r.bytes).padStart(9) + String(r.bpt).padStart(7) + String(r.sil96).padStart(7) + '  ' + r.sTri.padStart(4) + ' ' + r.sBpt.padStart(4) + ' ' + r.sFill.padStart(5) + ' ' + r.comp.padStart(6));
});
const bottom4 = rows.slice(0, 4).map(r => r.name).sort();
console.log('BOTTOM4 (audit)   : ' + JSON.stringify(bottom4));
const defaultSet = ['drone', 'flyer', 'stinger', 'warden'];
const diverge = JSON.stringify(bottom4) !== JSON.stringify(defaultSet.slice().sort());
console.log('DEFAULT SET       : ' + JSON.stringify(defaultSet.slice().sort()));
console.log('DIVERGENCE        : ' + (diverge ? 'YES - register override' : 'NO - default set confirmed'));
fs.writeFileSync(OUT + 'ranking_i590.json', JSON.stringify({ method: 'composite = (pctAsc(tris) + (100-pctAsc(b/t)) + pctAsc(sil96))/3; bottom-4 = lowest composite; tie-break legacy-4', rows, bottom4, divergence: diverge }, null, 1));
console.log('WROTE ranking_i590.json');
