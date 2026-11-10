const fs = require('fs');
const path = require('path');
const pngjs = require('pngjs');

// --- color math ---
function s2l(c){ c/=255; return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
function l2s(c){ c=Math.max(0,Math.min(1,c)); return 255*(c<=0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055); }
// matrices in LINEAR light (simplified Brettel/Vienot), applied [R G B]
const SIMS = {
  normal: [[1,0,0],[0,1,0],[0,0,1]],
  deuteranopia: [[0.4942,0.5058,0],[0.2464,0.7536,0],[0,0.0040,0.9960]], // Machado 2009
  protanopia: [[0.1522,0.8478,0],[0.1142,0.8858,0],[0,0.0038,0.9962]], // Machado 2009
  tritanopia: [[0.95,0.05,0],[0,0.433,0.567],[0,0.475,0.525]]
};
function hexToLin(hex){ const h=hex.replace('#',''); const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16); return [s2l(r),s2l(g),s2l(b)]; }
function simColor(lin, M){
  const R = M[0][0]*lin[0]+M[0][1]*lin[1]+M[0][2]*lin[2];
  const G = M[1][0]*lin[0]+M[1][1]*lin[1]+M[1][2]*lin[2];
  const B = M[2][0]*lin[0]+M[2][1]*lin[1]+M[2][2]*lin[2];
  return [Math.round(l2s(R)), Math.round(l2s(G)), Math.round(l2s(B))];
}
// sRGB -> Lab (D65) for deltaE76
function rgb2lab(r,g,b){
  let R=s2l(r),G=s2l(g),B=s2l(b);
  let X=(R*0.4124564+G*0.3575761+B*0.1804375)/0.95047;
  let Y=(R*0.2126729+G*0.7151522+B*0.0721750);
  let Z=(R*0.0193339+G*0.1191920+B*0.9503041)/1.08883;
  const f=t=> t>0.008856 ? Math.cbrt(t) : (7.787*t+16/116);
  const fx=f(X),fy=f(Y),fz=f(Z);
  return [116*fy-16, 500*(fx-fy), 200*(fy-fz)];
}
function dE76(a,b){ const A=rgb2lab(a[0],a[1],a[2]), B=rgb2lab(b[0],b[1],b[2]); return Math.sqrt((A[0]-B[0])**2+(A[1]-B[1])**2+(A[2]-B[2])**2); }

// --- palette from code ---
const ENTITIES = [
  ['golden_rock','#ffc94d'], ['golden_cage','#ffd24d'], ['normal_rock','#8a7f72'], ['belt_rock','#2a313d'],
  ['warden_armored','#19d3c5'], ['warden_exposed','#ff7a3c'], ['ship_body','#8fd8ff'], ['ship_cockpit','#59d8ff'],
  ['player_bullet','#bff4ff'], ['enemy_bolt','#ff4a2a'], ['mine','#ff2a2a'], ['drone','#37d5ff'],
  ['boss_monolith','#7a4dff'], ['boss_splicer','#2dd4bf'],
  ['pu_rapid','#ffe066'], ['pu_spread','#ff9f43'], ['pu_shield','#53d8ff'], ['pu_bomb','#ff5252'], ['pu_magnet','#69f0ae'], ['pu_overdrive','#ff4dd8'], ['pu_slowmo','#9fe8ff']
];
const PAIRS = [
  ['golden_rock','normal_rock','high-value target vs background rock (cue: cage)'],
  ['golden_rock','warden_exposed','gold vs orange - worst hue pair (cue: cage vs spikes)'],
  ['warden_armored','warden_exposed','warden state change (cue: spikes + armor retract)'],
  ['warden_armored','ship_cockpit','teal warden vs cyan ship (cue: size/shape)'],
  ['warden_armored','drone','teal warden vs cyan drone (cue: size/shape)'],
  ['enemy_bolt','mine','red-orange bolt vs red mine (cue: shape/motion)'],
  ['enemy_bolt','player_bullet','enemy vs own fire (cue: color + motion)'],
  ['enemy_bolt','warden_exposed','bolt vs exposed warden (both orange-red)'],
  ['pu_rapid','pu_spread','yellow vs orange pickups (cue: octa vs cone)'],
  ['pu_magnet','pu_rapid','green vs yellow pickups (cue: sphere vs octa)'],
  ['pu_magnet','pu_bomb','green vs red pickups (cue: shape)'],
  ['pu_shield','ship_cockpit','cyan pickup vs ship (cue: torus shape)'],
  ['boss_splicer','drone','teal splicer vs cyan drone (cue: size/shape)'],
  ['golden_cage','ship_body','cage gold vs ship blue (should stay distinct)'],
  ['mine','pu_bomb','mine vs bomb pickup (both red; cue: shape/pulse)']
];
const byName = {};
for (const [n,h] of ENTITIES) byName[n] = hexToLin(h);

// --- palette table ---
console.log('=== PALETTE CHECK (deltaE76 after simulation; <15 confusable, 15-30 borderline, >30 distinct) ===');
for (const sim of Object.keys(SIMS)) {
  const M = SIMS[sim];
  const srgb = {};
  for (const [n,lin] of Object.entries(byName)) srgb[n] = simColor(lin, M);
  const rows = [];
  for (const [a,b,why] of PAIRS) {
    const d = dE76(srgb[a], srgb[b]);
    const flag = d < 15 ? 'CONFUSABLE' : (d < 30 ? 'borderline' : 'distinct');
    rows.push([d, a, b, flag, why]);
  }
  rows.sort((x,y)=>x[0]-y[0]);
  console.log('\n-- ' + sim + ' --');
  for (const [d,a,b,flag,why] of rows) console.log('  dE=' + d.toFixed(1).padStart(6) + '  ' + a + ' vs ' + b + '  [' + flag + ']  // ' + why);
  // also emit simulated hex for the key warden/gold colors for the record
  if (sim !== 'normal') console.log('  simColors: warden_armored=' + rgb2hex(srgb['warden_armored']) + ' warden_exposed=' + rgb2hex(srgb['warden_exposed']) + ' golden_rock=' + rgb2hex(srgb['golden_rock']) + ' ship_cockpit=' + rgb2hex(srgb['ship_cockpit']));
}
function rgb2hex(c){ return '#' + c.map(v=>v.toString(16).padStart(2,'0')).join(''); }

// --- image simulation ---
const SRC = 'evidence/I156';
const JOBS = [
  ['I156_baseline_armored.png', 'I156_sim_armored_'],
  ['I156_warden_exposed.png', 'I156_sim_exposed_'],
  ['I156_cues_off.png', 'I156_sim_cuesoff_']
];
for (const [src, prefix] of JOBS) {
  const file = path.join(SRC, src);
  if (!fs.existsSync(file)) { console.log('MISSING ' + file); continue; }
  const data = fs.readFileSync(file);
  const png = pngjs.PNG.sync.read(data);
  for (const sim of ['deuteranopia','protanopia','tritanopia']) {
    const M = SIMS[sim];
    const LUT = new Float64Array(256*3);
    for (let i=0;i<256;i++){ LUT[i*3]=s2l(i); LUT[i*3+1]=s2l(i); LUT[i*3+2]=s2l(i); }
    // precompute per-input-channel contribution is not separable (matrix mixes), so per-pixel:
    const out = pngjs.PNG.sync.read(data);
    const id = out.data;
    for (let p=0; p<id.length; p+=4) {
      const r = LUT[id[p]], g = LUT[id[p+1]], b = LUT[id[p+2]];
      id[p]   = Math.round(l2s(M[0][0]*r + M[0][1]*g + M[0][2]*b));
      id[p+1] = Math.round(l2s(M[1][0]*r + M[1][1]*g + M[1][2]*b));
      id[p+2] = Math.round(l2s(M[2][0]*r + M[2][1]*g + M[2][2]*b));
    }
    const buf = pngjs.PNG.sync.write(out);
    fs.writeFileSync(path.join(SRC, prefix + sim + '.png'), buf);
    console.log('wrote ' + prefix + sim + '.png');
  }
}
console.log('DONE');
