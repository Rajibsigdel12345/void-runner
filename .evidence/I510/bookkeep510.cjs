const fs = require('fs');
const root = 'E:/Game/';
function eolOf(s) {
  let crlf = 0, lf = 0;
  for (let i = 0; i < s.length; i++) if (s[i] === '\n') { lf++; if (i > 0 && s[i - 1] === '\r') crlf++; }
  return crlf >= lf ? '\r\n' : '\n';
}
function bomCount(s) { let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xfeff) n++; return n; }
function read(p) { return fs.readFileSync(root + p, 'utf8'); }
function write(p, t) { fs.writeFileSync(root + p, t, 'utf8'); }

// 1) CHANGELOG.md : I510 line above I509
{
  const p = 'CHANGELOG.md';
  let t = read(p); const eol = eolOf(t);
  const line = '- I510: ST-476 E68 - FINAL fleet re-pins WITH MEASUREMENT + dist ceiling RENEGOTIATED (integration close of the remaster; docs+tests-only, zero src/assets): assetPerf FINAL fleet pin (2400/2350/600/58,000/4 held at the I509 measurements - planned 2,100/2,050/54,000 superseded by measurement: the remaster landed cap-side of aim/cap, fleet 19,490 t vs aim 16,690 / cap 19,850; measured 2,327,964 B / 2,224.32 KB geo / max file ship.glb 567.81 KB / 55,075 t / max mats 4 = sentry) + dist ceiling RENEGOTIATED WITH MEASUREMENT per the I506 scope-check section 5 pre-registration: 3,850,000 -> 4,700,000 B (measured 4,623,044 B / 175 files; chain 3,747,372 (I507) -> 4,190,132 (I508) -> 4,623,044 (I509); the pre-registered ~4,400,000 B expectation exceeded by 223,044 B - root cause documented in scope-check-E68 section 5 RESOLVED; cut ladder C1-C4 NOT invoked; user-authorized "use the polygons and gpu resource as much as needed") + AGENTS.md refresh (quality bar item 4 ceiling 4,700,000 B + close floor re-derives at G68.0 from the 76,956 B headroom; art-assets line FINAL fleet 2,327,964 B / 55,075 t with the per-ship tri table). 1145/1145 + build 0 + dist 4,623,044 B/175 byte-unchanged (docs+tests-only) + vendor UNCHANGED vs HEAD (minified dist pins A65DE049A7F38B40/7AB0784CD2532367/F549248412C62B9A/7FF9ACF50F006017 = I507 line) + causal483 CAUSAL456 PASS EXACT + playframe483 PLAYFRAME456 PASS EXACT (A L 22/25,781 + P 11/180, B 52/55,400 - no mesh change, re-run as verification) + BOM stable (7/5/5/3/3/0) + hygiene (no servers, no tabs, blender exited). Pages: push delegated to a fresh agent (I509 push SUCCEEDED - the billing lock cleared, remote main = 3c56d1f; this push re-triggers deploy). Next: I511 = ST-477 (in-game rendered-luma re-ladder + CONFIG palette + the single in-browser luma audit) -> ST-478 (fleet-coherence gate) -> ST-479 (G68.0 close: close floor re-derive WITH MEASUREMENT).';
  const marker = '- I509: ST-475 E68 -';
  const i = t.indexOf(marker);
  if (i < 0) throw new Error('changelog I509 marker');
  t = t.slice(0, i) + line + eol + t.slice(i);
  write(p, t);
  console.log('OK CHANGELOG I510 line (BOM=' + bomCount(t) + ', eol=' + (eol === '\r\n' ? 'CRLF' : 'LF') + ')');
}
// 2) production/stories.md : STATUS (I510) + ST-476 story line
{
  const p = 'production/stories.md';
  let t = read(p); const eol = eolOf(t);
  const status = 'STATUS (I510): E68 IN PROGRESS (ST-476 DONE I510 - FINAL fleet re-pins WITH MEASUREMENT + dist ceiling RENEGOTIATED: assetPerf FINAL 2400/2350/600/58,000/4 (measured 2,327,964 B / 2,224.32 KB / max file ship 567.81 KB / 55,075 t [8 remastered ships 19,490 t inside the I507 cap 19,850] / max mats 4 = sentry) + dist ceiling 3,850,000 -> 4,700,000 B (measured 4,623,044 B / 175, headroom 76,956 B; pre-registered ~4,400,000 B exceeded by 223,044 B - documented; cut ladder NOT invoked) + AGENTS.md refresh (ceiling + FINAL fleet line); close floor re-derives WITH MEASUREMENT at G68.0 (ST-479); pins EXACT).';
  const m1 = 'STATUS (I509):';
  const i = t.indexOf(m1);
  if (i < 0) throw new Error('stories STATUS I509 marker');
  t = t.slice(0, i) + status + eol + t.slice(i);
  const m2 = '- ST-475 E68 BLENDER remaster-4 v2 (hunter/gunship/sentry/wasp shape fixes + value-band COLOR_0 bakes) (I509) - DONE I509';
  const j = t.indexOf(m2);
  if (j < 0) throw new Error('stories ST-475 marker');
  const e = t.indexOf('\n', j + m2.length);
  const story = '- ST-476 E68 FINAL fleet re-pins WITH MEASUREMENT + dist ceiling renegotiation (I510) - DONE I510 (integration close of the remaster, docs+tests-only zero src/assets: assetPerf FINAL fleet pin 2400/2350/600/58,000/4 held at the I509 measurements [planned 2,100/2,050/54,000 superseded by measurement - the remaster landed cap-side of aim/cap: fleet 19,490 t vs aim 16,690 / cap 19,850; measured 2,327,964 B / 2,224.32 KB geo / max file ship.glb 567.81 KB / 55,075 t / max mats 4 = sentry] + dist ceiling RENEGOTIATED WITH MEASUREMENT per the I506 pre-registration: 3,850,000 -> 4,700,000 B [measured 4,623,044 B / 175; chain 3,747,372 -> 4,190,132 -> 4,623,044; the ~4,400,000 B expectation exceeded by 223,044 B - documented in scope-check-E68 section 5 RESOLVED; cut ladder NOT invoked] + AGENTS.md refresh [quality bar item 4 ceiling 4,700,000 B + art-assets line FINAL fleet] + close floor re-derives WITH MEASUREMENT at G68.0 (ST-479) from the 76,956 B headroom. 1145/1145 + build 0 + dist 4,623,044 B/175 byte-unchanged + vendor UNCHANGED + pins EXACT (no mesh change; causal/playframe re-run as verification) + BOM stable + hygiene clean).';
  t = t.slice(0, e + 1) + story + eol + t.slice(e + 1);
  write(p, t);
  console.log('OK stories STATUS I510 + ST-476 line (BOM=' + bomCount(t) + ', eol=' + (eol === '\r\n' ? 'CRLF' : 'LF') + ')');
}
// 3) production/epics.md : ST-476 sentence -> DONE I510
{
  const p = 'production/epics.md';
  let t = read(p); const eol = eolOf(t);
  const oldS = 'ST-476 integration + re-pins WITH MEASUREMENT (BUDGETS x8, assetPerf 2,100/2,050/54,000 planned, ceiling renegotiation ~4,400,000 B pre-registered, playframe measured).';
  const newS = 'ST-476 integration + FINAL fleet re-pins WITH MEASUREMENT + dist ceiling renegotiation. - DONE I510 (assetPerf FINAL 2400/2350/600/58,000/4 held at the I509 measurements [planned 2,100/2,050/54,000 superseded by measurement - the remaster landed cap-side of aim/cap: fleet 19,490 t vs aim 16,690 / cap 19,850]; dist ceiling 3,850,000 -> 4,700,000 B WITH MEASUREMENT [measured 4,623,044 B / 175, headroom 76,956 B; the pre-registered ~4,400,000 B expectation exceeded by 223,044 B - documented in scope-check-E68 section 5 RESOLVED; cut ladder NOT invoked]; AGENTS.md refresh [ceiling + FINAL fleet line]; close floor re-derives WITH MEASUREMENT at G68.0 from the 76,956 B headroom).';
  const i = t.indexOf(oldS);
  if (i < 0) throw new Error('epics ST-476 sentence marker');
  t = t.slice(0, i) + newS + t.slice(i + oldS.length);
  write(p, t);
  console.log('OK epics ST-476 -> DONE I510 (BOM=' + bomCount(t) + ', eol=' + (eol === '\r\n' ? 'CRLF' : 'LF') + ')');
}
// 4) production/iterations.md : append I510 section
{
  const p = 'production/iterations.md';
  let t = read(p); const eol = eolOf(t);
  const section = [
    '## I510 - FINAL fleet re-pins WITH MEASUREMENT + dist ceiling RENEGOTIATED (ST-476, E68)',
    '- Story: ST-476 | Goal: close the remaster integration - FINAL fleet re-pins WITH MEASUREMENT (assetPerf caps) + the I506 pre-registered dist ceiling renegotiation + AGENTS.md refresh; docs+tests-only, zero src/assets.',
    '- Ground: design/enemy-remaster-spec-E68.md GLB contract item (BUDGETS re-pin WITH MEASUREMENT at ST-476) + production/scope-check-E68.md section 5 (PRE-REGISTERED ceiling renegotiation WITH MEASUREMENT at ST-476) + the I509 measurements (assets 2,327,964 B / 55,075 t / 2,224.32 KB geo / max file ship 567.81 KB / max mats 4; dist 4,623,044 B / 175).',
    '- Changed: tests/assetPerf.test.js (BUDGET block -> FINAL fleet pin: 2400/2350/600/58,000/4 held at the I509 measurements, comments rewritten as FINAL with measured values + headroom; the planned 2,100/2,050/54,000 (scope-check section 4) superseded by measurement - the remaster landed cap-side of aim/cap: fleet 19,490 t vs aim 16,690 / cap 19,850, cap governs) + AGENTS.md (quality bar item 4: ceiling 3,850,000 -> 4,700,000 B WITH MEASUREMENT [measured 4,623,044 B / 175; chain 3,747,372 -> 4,190,132 -> 4,623,044; headroom 76,956 B; close floor re-derives WITH MEASUREMENT at G68.0 (ST-479)] + art-assets line FINAL fleet 2,327,964 B / 55,075 t with the per-ship tri table) + production/scope-check-E68.md (section 5 RESOLVED: NEW CEILING 4,700,000 B; the pre-registered ~4,400,000 B expectation exceeded by 223,044 B - the expectation used the pre-legacy-4 baseline + aim-weighted delta; cut ladder NOT invoked) + 6 bookkeeping files (this section).',
    '- S4 bookkeeping: epics.md (E68 ST-476 line -> DONE I510) + stories.md (STATUS I510 line + ST-476 line) + iterations.md (this) + timeline.md (I510) + CHANGELOG.md (I510 line above I509) + session-state/active.md (I510 notes).',
    '- Quality bar: npm test 1145/1145 + build exit 0 + dist 4,623,044 B/175 BYTE-UNCHANGED (docs+tests-only iteration; the ceiling change is a governance number, not a build change) + vendor UNCHANGED vs HEAD (minified dist pins A65DE049A7F38B40/7AB0784CD2532367/F549248412C62B9A/7FF9ACF50F006017 = I507 line; vendor/three.module.js sha256-16 104F561458997220) + causal483 CAUSAL456 PASS EXACT + playframe483 PLAYFRAME456 PASS EXACT (A L 22/25,781 + P 11/180, B 52/55,400 - no mesh change; re-run as verification per the quality bar) + BOM stable (7/5/5/3/3/0) + hygiene clean (server killed, no tabs, blender exited).',
    '- Pages: push delegated to a fresh agent after the commit. Note: the I509 push SUCCEEDED (remote main eef86f7 -> 3c56d1f) - the account-level Actions billing lock cleared between I509 and I510; this push re-triggers deploy-pages.yml and the live site should pick up I509+I510.',
    '- Next: I511 = ST-477 (in-game rendered-luma re-ladder: stinger -> steel-blue class 0x54688a @ rendered ~110, gunship -> DEFINITE slate h ~215, flyer +30 to ~95, sentry -10, warden UNCHANGED; config.js line-35 stale comment fix; the single in-browser luma audit for the whole fleet) -> I512 = ST-478 (fleet-coherence gate) -> I513 = ST-479 (G68.0 close gate: close floor re-derive WITH MEASUREMENT from the 76,956 B headroom). After E68: standing queue (new enemy types + campaign extension; PWA + mobile landscape D-pad + menu reorg; camera-angle consistency + FP cockpit view).'
  ].join(eol);
  if (!t.endsWith('\n')) t += '\n';
  t = t + section + eol;
  write(p, t);
  console.log('OK iterations I510 section (BOM=' + bomCount(t) + ', eol=' + (eol === '\r\n' ? 'CRLF' : 'LF') + ')');
}
// 5) production/timeline.md : append I510 line
{
  const p = 'production/timeline.md';
  let t = read(p); const eol = eolOf(t);
  const line = '- 2026-11-19  I510 (ST-476, E68 - FINAL fleet re-pins WITH MEASUREMENT + dist ceiling RENEGOTIATED, docs+tests-only zero src/assets): assetPerf FINAL 2400/2350/600/58,000/4 (measured 2,327,964 B / 2,224.32 KB / 55,075 t [8 ships 19,490 t inside cap 19,850; aim 16,690 exceeded - cap governs] / max mats 4 = sentry) + dist ceiling 3,850,000 -> 4,700,000 B WITH MEASUREMENT (measured 4,623,044 B / 175, headroom 76,956 B; the pre-registered ~4,400,000 B expectation exceeded by 223,044 B - documented; cut ladder NOT invoked) + AGENTS.md refresh (item 4 ceiling + FINAL fleet line) + scope-check-E68 section 5 RESOLVED. 1145/1145 + build 0 + dist byte-unchanged + vendor UNCHANGED + pins EXACT + BOM stable + hygiene. Pages: the I509 push SUCCEEDED (billing lock cleared; remote main 3c56d1f) - the I510 push re-triggers deploy. Next: I511 = ST-477 (luma re-ladder).';
  if (!t.endsWith('\n')) t += '\n';
  t = t + line + eol;
  write(p, t);
  console.log('OK timeline I510 line (BOM=' + bomCount(t) + ', eol=' + (eol === '\r\n' ? 'CRLF' : 'LF') + ')');
}
// 6) production/session-state/active.md : append I510 note
{
  const p = 'production/session-state/active.md';
  let t = read(p); const eol = eolOf(t);
  const note = '- notes: I510 done (ST-476 E68 - FINAL fleet re-pins WITH MEASUREMENT + dist ceiling RENEGOTIATED, docs+tests-only zero src/assets): assetPerf FINAL 2400/2350/600/58,000/4 held at the I509 measurements (planned 2,100/2,050/54,000 superseded by measurement - the remaster landed cap-side of aim/cap: fleet 19,490 t vs aim 16,690 / cap 19,850) + dist ceiling 3,850,000 -> 4,700,000 B WITH MEASUREMENT (measured 4,623,044 B / 175, headroom 76,956 B; the pre-registered ~4,400,000 B expectation exceeded by 223,044 B - documented in scope-check-E68 section 5 RESOLVED; cut ladder NOT invoked) + AGENTS.md refresh (item 4 ceiling + FINAL fleet line) + scope-check section 5 RESOLVED. 1145/1145 + build 0 + dist 4,623,044 B/175 byte-unchanged + vendor UNCHANGED + causal483 EXACT + playframe483 EXACT (A 22/25,781 + 11/180, B 52/55,400) + BOM stable + hygiene clean. Pages: I509 push SUCCEEDED (remote main 3c56d1f; the billing lock cleared) - the I510 push re-triggers deploy. Next: I511 = ST-477 (in-game rendered-luma re-ladder + CONFIG palette + in-browser luma audit) -> I512 = ST-478 (fleet-coherence gate) -> I513 = ST-479 (G68.0 close: close floor re-derive WITH MEASUREMENT). Standing queue: (1) new enemy types + campaign extension; (2) PWA installable + mobile landscape D-pad + menu reorg; (3) camera-angle consistency + first-person/cockpit view.';
  if (!t.endsWith('\n')) t += '\n';
  t = t + note + eol;
  write(p, t);
  console.log('OK active I510 note (BOM=' + bomCount(t) + ', eol=' + (eol === '\r\n' ? 'CRLF' : 'LF') + ')');
}
console.log('bookkeep510 DONE');