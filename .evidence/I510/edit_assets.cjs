const fs = require('fs');
const root = 'E:/Game/';
function eolOf(s) {
  let crlf = 0, lf = 0;
  for (let i = 0; i < s.length; i++) if (s[i] === '\n') { lf++; if (i > 0 && s[i - 1] === '\r') crlf++; }
  return crlf >= lf ? '\r\n' : '\n';
}
function replaceLine(text, marker, newLine, label) {
  const i = text.indexOf(marker);
  if (i < 0) throw new Error('marker not found: ' + label);
  const e = text.indexOf('\n', i);
  const lineEnd = e < 0 ? text.length : e;
  return text.slice(0, i) + newLine + text.slice(lineEnd);
}
// 1) tests/assetPerf.test.js : FINAL BUDGET block
{
  const p = root + 'tests/assetPerf.test.js';
  let t = fs.readFileSync(p, 'utf8');
  const m1 = '// I214 budgets (measured baselines in brackets; caps leave headroom for E9 art growth)';
  const m2 = '  perFileMats: 4,';
  const i = t.indexOf(m1);
  const j = t.indexOf(m2);
  if (i < 0 || j < 0 || j < i) throw new Error('assetPerf markers not found');
  const k = t.indexOf('\n', j + m2.length);
  const block = [
    '// FINAL fleet budgets (I510/ST-476 E68 close - the fleet is frozen until the next art epic',
    '// re-registers growth WITH MEASUREMENT; caps held at the I509 measured values, headroom for the next epic):',
    'const BUDGET = {',
    'totalFilesKB: 2400,  // [I510 FINAL holds 2400 (I509 re-pin 2300 -> 2400); measured 2273.40 KB (2,327,964 B; remaster-4 final 939,980 B); headroom 126.60 KB]',
    '  totalGeoKB: 2350,    // [I510 FINAL holds 2350 (I509 re-pin 2250 -> 2350); measured 2224.32 KB; headroom 125.68 KB]',
    '  perFileKB: 600,      // [I510 FINAL holds 600; max = ship.glb 567.81 KB (581,440 B); max enemy = wasp 302.77 KB (310,036 B)]',
    '  totalTris: 58000,    // [I510 FINAL holds 58000 (I509 re-pin 56,000 -> 58,000); measured 55,075 (8 remastered ships 19,490 t inside the I507 cap 19,850; aim 16,690 exceeded - cap governs); headroom 2,925 t]',
    '  perFileMats: 4,      // [I510 FINAL holds 4 (I509 re-pin 3 -> 4); max = enemy_sentry.glb 4 part bakes (R-VALUE 2-3 band rule); ship stays 3]'
  ].join('\n');
  t = t.slice(0, i) + block + t.slice(k);
  fs.writeFileSync(p, t, 'utf8');
  console.log('OK assetPerf BUDGET block -> FINAL (I510)');
}
// 2) AGENTS.md : item 4 ceiling + art-assets line
{
  const p = root + 'AGENTS.md';
  let t = fs.readFileSync(p, 'utf8');
  const eol = eolOf(t);
  const newItem4 = '4. `npm run build` dist/ total stays under 4,700,000 B (ceiling; I510/ST-476 E68 renegotiation WITH MEASUREMENT from 3,850,000 per the I506 scope-check section 5 pre-registration: measured 4,623,044 B / 175 files (I509); chain 3,747,372 (I507) -> 4,190,132 (I508 legacy-4) -> 4,623,044 (I509 remaster-4); headroom 76,956 B; close floor re-derives WITH MEASUREMENT at G68.0 (ST-479); prior: I501 ST-467 from 3,650,000 = 3,747,372 B / 175 [close floor 88,341 -> 91,657 -> 103,437 -> 102,628 B]).';
  t = replaceLine(t, '4. `npm run build` dist/ total stays under 3,850,000 B', newItem4, 'AGENTS item4');
  const newArt = '- Art assets: 28 Blender-made GLBs in assets/ (~2,273 KB (2,327,964 B) / 55,075 tris): ship v6 "real airship" 25,563 tris (I501/ST-467 remaster; v5 17,143 tris superseded), asteroid L/M/S + B-variants + comet, boss v2 398 t (I503/ST-469 remaster; v1 1,425 t superseded), enemy fleet E68 real-spaceship remaster (I508 legacy-4: stinger 1,732 / drone 1,516 / warden 1,556 / flyer 1,770 t; I509 remaster-4: hunter 3,366 / gunship 2,596 / sentry 2,934 / wasp 4,020 t; 8 ships 19,490 t, all Blender 5.2.3 headless) - the mine stays procedural, 7 powerups, shield, 2 debris chunks, arena ring - loaded at runtime via GLTFLoader (src/render/assetLoader.js) with procedural fallback; everything else stays procedural: canvas textures, WebAudio-synthesized SFX';
  t = replaceLine(t, '- Art assets: 28 Blender-made GLBs in assets/ (~1,418 KB (1,452,292 B) / 42,331 tris):', newArt, 'AGENTS art line');
  fs.writeFileSync(p, t, 'utf8');
  console.log('OK AGENTS.md item4 + art line (eol=' + (eol === '\r\n' ? 'CRLF' : 'LF') + ')');
}
// 3) production/scope-check-E68.md : section 5 RESOLVED
{
  const p = root + 'production/scope-check-E68.md';
  let t = fs.readFileSync(p, 'utf8');
  const eol = eolOf(t);
  const marker = 'FALLBACK before renegotiation: the cut ladder (section 6) - last resort only.';
  const i = t.indexOf(marker);
  if (i < 0) throw new Error('scope-check marker not found');
  const j = t.indexOf('\n', i + marker.length);
  const ins = eol + 'RESOLVED I510/ST-476 WITH MEASUREMENT: actual chain 3,747,372 (I507) -> 4,190,132 (I508, +442,760) -> 4,623,044 B / 175 (I509, +432,912) = 773,044 B over the 3,850,000 ceiling and 223,044 B over the expected ~4,400,000 B (the expectation used the pre-legacy-4 baseline + aim-weighted delta; the remaster landed cap-side of aim/cap: fleet 19,490 t vs aim 16,690 / cap 19,850). NEW CEILING 4,700,000 B (headroom 76,956 B). Cut ladder NOT invoked. Close floor re-derives WITH MEASUREMENT at G68.0 (ST-479) from the 76,956 B headroom.';
  t = t.slice(0, j) + ins + t.slice(j);
  fs.writeFileSync(p, t, 'utf8');
  console.log('OK scope-check-E68 section 5 RESOLVED appended (eol=' + (eol === '\r\n' ? 'CRLF' : 'LF') + ')');
}
console.log('edit_assets DONE');