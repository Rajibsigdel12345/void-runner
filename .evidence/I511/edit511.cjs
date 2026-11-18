// I511/ST-477 (E68): in-game rendered-luma re-ladder splice. (v2: wasp marker
// context-anchored - the bare 'renderLumaGain: 2.0,' also occurs in the POD block,
// which stays untouched.)
// Scope: 11 edits in src/core/config.js + stingerMesh 4-line material block
//   + flyerMesh 4-line material block + wardenMesh 3 color lines
//   + 4 lines in design/enemy-visual-language.md.
// Strict splice: every marker must occur EXACTLY once (throw otherwise);
// BOM-safe: in-memory splice, files written back only after ALL markers matched.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = 'E:/Game';

function load(rel) {
  const p = path.join(ROOT, rel);
  const t = fs.readFileSync(p, 'utf8');
  const crlf = (t.match(/\r\n/g) || []).length;
  const lf = (t.match(/\n/g) || []).length;
  const eol = crlf > 0 && crlf >= (lf - crlf) ? '\r\n' : '\n';
  return { rel, p, t, eol, bom: (t.match(/\uFEFF/g) || []).length };
}
function occ(t, m) { return t.split(m).length - 1; }
function rep(f, marker, repl, label) {
  const n = occ(f.t, marker);
  if (n !== 1) throw new Error('MARKER[' + label + '] count=' + n + ' (want 1) in ' + f.rel);
  f.t = f.t.split(marker).join(repl);
  console.log('OK   ' + label + '  [' + f.rel + ']');
}
function ml(f, lines) { return lines.join(f.eol); }

const files = [];

// ---------------- src/core/config.js ----------------
const cfg = load('src/core/config.js');
files.push(cfg);

rep(cfg, '    stinger: "hazard (accent) + identity rust body",',
  '    stinger: "hazard (accent) + identity steel-blue body (I511/ST-477: 0x54688a - moved off the I506 violet x boss collision)",',
  'config paletteMap stinger comment');

rep(cfg, '    gunship: "hazardEmber (bay) + identity gunmetal body",',
  '    gunship: "hazardEmber (bay) + identity slate body (I511/ST-477: 0x344250 - definite hue h210)",',
  'config paletteMap gunship comment');

{
  const line = cfg.t.split(cfg.eol).find(l => l.includes('// kill reward (seeker 200, Monolith 1000)'));
  if (!line) throw new Error('warden score line not found');
  rep(cfg, line,
    line.replace('score: 400', 'score: 400,') + cfg.eol +
    '    renderLumaGain: 1.43, // I511/ST-477 in-game re-audit: the I508 v2 GLB bake renders p50 83.9 (was 123.8 legacy); gain restores the ~120 ladder rung (hue 176 teal unchanged)',
    'config warden gain insert');
}

rep(cfg, '    palette: { body: { color: 0x917fb9 } }, // I383/E43 G2: violet mid (sRGB luma 135.0; same hue as the I282/ST-267 deep violet 0x5a4f73 luma 83.9, VALUE-only lift - the I381 audit read it darkest-in-fleet at rendered p50 30.36 with negative sky sepB; GLB COLOR_0 bake multiplies on top)',
  '    palette: { body: { color: 0x54688a } }, // I511/ST-477: steel-blue class 0x54688a (sRGB luma 102.2, hue 215.8 - spec 4.3 FROZEN class; the I383 violet 0x917fb9 rendered 65.7/280.2, a true E57 rule-1 collision with boss 68.4/259.1; moved to the h 215-230 target band)' + cfg.eol +
  '    renderLumaGain: 2.7, // I511/ST-477 in-game re-audit: baseline sky p50 51.1 (violet); hex move projects ~40.8 rendered; gain 2.7 lands the ~110 steel-blue rung',
  'config stinger palette + gain');

rep(cfg, ml(cfg, [
  '    renderLumaGain: 3.0, // I451 (ST-421) rendered-luma audit (render451 Part E, I381/I383 method): ACES +',
  '                         // exposure 1.15 + grade gamma 1.18 renders the palette body at ~0.45x its sRGB luma',
  '                         // (hull p50 46 vs the 85-120 band); the render layer scales the hull material color by',
  '                         // this gain to land the ladder (rendered p50 ~102). Palette hex stays the design value.',
]),
  '    renderLumaGain: 5.1, // I451 gain pattern; I511/ST-477 re-ladder: the I509 v2 GLB bake renders p50 69.3 sky (was 118.3 legacy); 3.0 -> 5.1 (x1.703) restores the ~118 rust rung (hue 12.5 unchanged)',
  'config hunter gain 3.0->5.1');

rep(cfg, '    // Visuals: design/enemy-visual-language.md s3.2 - gunmetal 0x39424e body /',
  '    // Visuals: design/enemy-visual-language.md s3.2 - slate 0x344250 body (I511/ST-477; was gunmetal 0x39424e) /',
  'config gunship block comment');

rep(cfg, '      body: { color: 0x39424e },    // gunmetal (sRGB luma ~65; below every fleet band - rule 1)',
  '      body: { color: 0x344250 },    // slate (I511/ST-477: sRGB luma 64.0, hue 210.0, sat 35% - the I451 gunmetal 0x39424e rendered as an unstable neutral; definite hue per spec 4.2 target)',
  'config gunship body hex');

rep(cfg, ml(cfg, [
  '    renderLumaGain: 4.1, // I451 (ST-421) rendered-luma audit (render451 Part E, I381/I383 method): ACES +',
  '                         // exposure 1.15 + grade gamma 1.18 renders the palette body at ~0.31x its sRGB luma',
  '                         // (hull p50 20 vs the 45-85 band); the render layer scales the hull material color by',
  '                         // this gain to land the ladder (rendered p50 ~65). Palette hex stays the design value.',
]),
  '    renderLumaGain: 5.6, // I451 gain pattern; I511/ST-477 re-ladder: the I509 v2 GLB bake renders p50 47.6 sky (was 86.6 legacy); 4.1 -> 5.6 (x1.366) lands the ~65 slate rung; gunship x boss borderline settled in the I511 in-game audit WITH MEASUREMENT',
  'config gunship gain 4.1->5.6');

rep(cfg, '    renderLumaGain: 2.0, // I480 rendered-luma audit: POD 127 < SENTRY 137 < WASP 176 (distinct rungs)',
  '    renderLumaGain: 2.98, // I480 gain pattern; I511/ST-477 re-ladder: the I509 v2 GLB bake renders p50 93.9 sky (was 150.5 legacy - the spec bake-driven -10 assumption overshot, value bands went dark); 2.0 -> 2.98 (x1.491) lands the ~140 olive rung (hue 41 unchanged)',
  'config sentry gain 2.0->2.98');

rep(cfg, ml(cfg, [
  '      accent: 0xff4a2a,            // nose glow (threat-red dash cue)',
  '    },',
  '    renderLumaGain: 2.0,',
]), ml(cfg, [
  '      accent: 0xff4a2a,            // nose glow (threat-red dash cue)',
  '    },',
  '    renderLumaGain: 2.65, // I480 gain pattern; I511/ST-477 re-ladder: the I509 v2 GLB bake renders p50 132.3 sky (was 177.3 legacy); 2.0 -> 2.65 (x1.323) restores the ~175 chartreuse rung (hue 49 unchanged)',
]), 'config wasp gain 2.0->2.65 (context-anchored; pod bare 2.0 untouched)');

rep(cfg, '    palette: { body: { color: 0x7d6878 } }, // I282/ST-267: mauve mid (sRGB luma ~110, below the drone band; the magenta dome carries the hue; GLB COLOR_0 bake multiplies on top)',
  '    palette: { body: { color: 0x7d6878 } }, // I282/ST-267: mauve mid (sRGB luma ~110, below the drone band; the magenta dome carries the hue; GLB COLOR_0 bake multiplies on top)' + cfg.eol +
  '    renderLumaGain: 1.85, // I511/ST-477 in-game re-audit: the I508 v2 GLB bake renders p50 51.3 sky (was 65.8 legacy); x1.852 lands the ~95 magenta rung (+30 per spec 4.2; hue 327 unchanged)',
  'config flyer gain insert');

// ---------------- src/render/stingerMesh.js ----------------
const st = load('src/render/stingerMesh.js');
files.push(st);
rep(st, ml(st, [
  '  const bodyMat = standardMat({ // I497 (ST-463)',
  '    color: CONFIG.stinger.palette.body.color, roughness: 0.5, metalness: 0.5, flatShading: true, vertexColors: true, // I282/ST-267: deep-violet mid (was 0x2b2136 dark-on-dark) + the GLB COLOR_0 value bake',
  '    emissive: 0x3c1f5c, emissiveIntensity: 0.35,',
  '  });',
]), ml(st, [
  '  const bodyMat = standardMat({ // I497 (ST-463)',
  '    color: new THREE.Color(CONFIG.stinger.palette.body.color).multiplyScalar(CONFIG.stinger.renderLumaGain), // I511/ST-477: steel-blue 0x54688a x luma gain (GLB COLOR_0 bake multiplies on top)',
  '    emissive: 0x22344d, emissiveIntensity: 0.35, // I511/ST-477: steel-blue dark (was violet 0x3c1f5c - body hue moved off the boss violet band)',
  '  });',
]), 'stingerMesh body material block');

// ---------------- src/render/flyerMesh.js ----------------
const fl = load('src/render/flyerMesh.js');
files.push(fl);
rep(fl, ml(fl, [
  '  const hullMat = standardMat({ // I497 (ST-463)',
  '    color: CONFIG.flyer.palette.body.color, roughness: 0.55, metalness: 0.45, flatShading: true, vertexColors: true, // I282/ST-267: mauve mid (was 0x33202e dark-on-dark) + the GLB COLOR_0 value bake',
  '    emissive: 0x5c1f4a, emissiveIntensity: 0.3,',
  '  });',
]), ml(fl, [
  '  const hullMat = standardMat({ // I497 (ST-463)',
  '    color: new THREE.Color(CONFIG.flyer.palette.body.color).multiplyScalar(CONFIG.flyer.renderLumaGain), // I511/ST-477: x1.852 magenta rung gain (v2 bake rendered p50 51.3 sky; lands ~95 rung) + the GLB COLOR_0 value bake',
  '    emissive: 0x5c1f4a, emissiveIntensity: 0.3,',
  '  });',
]), 'flyerMesh hull material block');

// ---------------- src/render/wardenMesh.js ----------------
const wd = load('src/render/wardenMesh.js');
files.push(wd);
rep(wd, '    color: 0x2c3548, roughness: 0.4, metalness: 0.55, flatShading: true,',
  '    color: new THREE.Color(0x2c3548).multiplyScalar(CONFIG.warden.renderLumaGain), roughness: 0.4, metalness: 0.55, flatShading: true, // I511/ST-477: gain restores the ~120 rung (v2 bake rendered p50 83.9)',
  'wardenMesh hull color');
rep(wd, '    color: 0x8fa3c8, roughness: 0.3, metalness: 0.85, flatShading: true,',
  '    color: new THREE.Color(0x8fa3c8).multiplyScalar(CONFIG.warden.renderLumaGain), roughness: 0.3, metalness: 0.85, flatShading: true, // I511/ST-477: gain restores the ~120 rung (armor plate)',
  'wardenMesh armor color');
rep(wd, '  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x8fa3c8, roughness: 0.3, metalness: 0.85, flatShading: true, emissive: 0xff7a3c, emissiveIntensity: 0.5 });',
  '  const spikeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x8fa3c8).multiplyScalar(CONFIG.warden.renderLumaGain), roughness: 0.3, metalness: 0.85, flatShading: true, emissive: 0xff7a3c, emissiveIntensity: 0.5 }); // I511/ST-477: spike collar shares the armor gain (single CONFIG lever)',
  'wardenMesh spike color');

// ---------------- design/enemy-visual-language.md ----------------
const doc = load('design/enemy-visual-language.md');
files.push(doc);
rep(doc, '| Stinger | 7 | 0x917fb9 violet mid | 135.0 (I383 rendered audit) | slender dart | 2 (stingerMesh.js) | cyan->white lock telegraph, straight-line dash |',
  '| Stinger | 7 | 0x54688a steel-blue (I511/ST-477) | 102.2 (rendered p50 ~110 sky, I511; was 0x917fb9 violet 135.0 - I383) | slender dart | 2 (stingerMesh.js) | cyan->white lock telegraph, straight-line dash |',
  'doc stinger row');
rep(doc, '| Flyer | 9 | 0x7d6878 mauve mid | ~110 | broad-winged, magenta dome | 2 (flyerMesh.js) | sine-weave crosser; never attacks |',
  '| Flyer | 9 | 0x7d6878 mauve mid | ~110 (rendered p50 ~95 sky, I511/ST-477) | broad-winged, magenta dome | 2 (flyerMesh.js) | sine-weave crosser; never attacks |',
  'doc flyer row');
rep(doc, '- Fleet body luma ladder (top to bottom): stinger 135 > drone 131 > flyer ~110.',
  '- Fleet body luma ladder (top to bottom, rendered p50 sky re-audit I511/ST-477): drone ~180 > wasp ~175 > sentry ~140 > warden ~120 > hunter ~118 > stinger ~110 > flyer ~95 > boss ~68 ~= gunship ~65.',
  'doc ladder line');
rep(doc, '- Palette (proposed): body 0x39424e (gunmetal; sRGB luma ~65 - below every fleet band, distinct hue from all roles); nacelle dark 0x232a33; payload-bay glow 0xff9a3d family (payload semantics, brightens while a shot is armed, rule 4).',
  '- Palette (proposed): body 0x344250 (slate, I511/ST-477: sRGB luma 64.0, hue 210.0 sat 35% - definite hue, below every fleet band); nacelle dark 0x232a33; payload-bay glow 0xff9a3d family (payload semantics, brightens while a shot is armed, rule 4).',
  'doc gunship palette line');

// ---------------- write back (only reached if every marker matched) ----------------
console.log('--- all markers matched; writing ' + files.length + ' files');
for (const f of files) {
  const newBom = (f.t.match(/\uFEFF/g) || []).length;
  fs.writeFileSync(f.p, f.t, 'utf8');
  console.log('WROTE ' + f.rel + '  BOM ' + f.bom + '->' + newBom + (newBom === f.bom ? ' (stable)' : ' !! DRIFT'));
}
console.log('EDIT511 DONE');