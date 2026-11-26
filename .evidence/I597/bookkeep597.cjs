// bookkeep597.cjs - I597 (ST-563, G85.0 CLOSE) bookkeeping: AGENTS item-4 splice + scope-check ST-563 fill + 6-file patches.
const fs = require('fs');
const P = 'E:/Game/';
const BOMS = [
  ['AGENTS.md', 1],
  ['production/epics.md', 3],
  ['production/stories.md', 5],
  ['production/iterations.md', 5],
  ['production/timeline.md', 3],
  ['CHANGELOG.md', 7],
  ['production/session-state/active.md', 0]
];
function count(s, a) { let n = 0, i = 0; while ((i = s.indexOf(a, i)) !== -1) { n++; i += a.length; } return n; }
function boms(s) { return (s.match(/\u00EF\u00BB\u00BF/g) || []).length; }
const before = {};
for (const [rel, exp] of BOMS) { before[rel] = boms(fs.readFileSync(P + rel, 'latin1')); }
function read(rel) { return fs.readFileSync(P + rel, 'latin1'); }
function write(rel, s) { fs.writeFileSync(P + rel, s, 'latin1'); console.log('patched ' + rel); }
function replaceText(s, oldT, newT) {
  if (count(s, oldT) !== 1) throw new Error('anchor count != 1: ' + oldT.slice(0, 80));
  return s.replace(oldT, newT);
}

// 1) AGENTS.md item-4: chain extend (I595/I596/I597) + CLOSE FLOOR E85 clause at head, E84 demoted to prior
{
  const rel = 'AGENTS.md';
  let s = read(rel);
  s = replaceText(s,
    '; I594 docs-only = unchanged 6,851,950 / 203); CLOSE FLOOR E84 = 548,050 B measured at G84.0',
    '; I594/I595 docs-only = unchanged 6,851,950 / 203) -> 6,851,951 (I596, +1 B: remastered-4 luma re-pin config swap, 203 files; I597 close re-measure = unchanged 6,851,951 / 203); CLOSE FLOOR E85 = 548,049 B measured at G85.0 (I597: 7,400,000 - 6,851,951 fresh dist re-measured EXACT [byte-identical to I596 - config value swaps change no geometry/draw calls/RNG]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E85 CLOSED I597); prior CLOSE FLOOR E84 = 548,050 B measured at G84.0');
  write(rel, s);
}

// 2) scope-check-E85.md: fill the ST-563 evidence line
{
  const rel = 'production/scope-check-E85.md';
  let s = read(rel);
  s = replaceText(s,
    'ST-563 (I597, G85.0 close): PENDING - close gate 5/5 + CLOSE FLOOR E85 fill at the close.',
    'ST-563 (I597, G85.0 close) DONE I597: close gate 5/5 EXACT zero re-pins (.evidence/I597/run_closegate597.cjs: causal495 CAUSAL495 PASS [webgl+default EXACT seed-9876; webgpu report-only] / causal483 CAUSAL456 PASS score 11334 / playframe483+491 PLAYFRAME456 PASS [A 22/62,472 + P 11/180, B 52/132,682, console 0/0] / pwa491 SUMMARY 11/11; ports self-started/self-killed, all 4 free after) + fresh dist re-measured byte-identical 6,851,951 B / 203 (measure597.cjs) + CLOSE FLOOR E85 = 548,049 B WITH MEASUREMENT (7,400,000 - 6,851,951; headroom >= 102,400 B floor -> cut ladder NOT invoked) + AGENTS.md item-4 refresh (chain extended; E85 clause at head, E84 demoted to prior) + E85 CLOSED (2/2: ST-562/563).');
  write(rel, s);
}

// 3) epics.md: E85 header -> CLOSED + ST-563 DONE + Status CLOSED
{
  const rel = 'production/epics.md';
  let s = read(rel);
  s = replaceText(s,
    '- OPEN I595 (ST-562 DONE I596 [C1-exhausted accept; 2 T1 residuals registered E86+], ST-563 PENDING I597)',
    '- CLOSED I597 (G85.0) (ST-562 DONE I596 [C1-exhausted accept; 2 T1 residuals registered E86+], ST-563 DONE I597)');
  s = replaceText(s,
    'ST-563 PENDING I597 (G85.0 close: close gate 5/5 + dist re-measure + CLOSE FLOOR E85 + AGENTS refresh + push).',
    'ST-563 DONE I597 (G85.0 close: close gate 5/5 EXACT zero re-pin [causal495/483 + playframe483/491 + pwa491 11/11]; dist re-measured byte-identical 6,851,951 B / 203; CLOSE FLOOR E85 = 548,049 B WITH MEASUREMENT; AGENTS item-4 refreshed; E85 CLOSED 2/2; push delegated).');
  s = replaceText(s,
    'Status: OPEN (opened I595; ST-562 DONE I596 [C1-exhausted accept: warden 3.13 / drone 0x637886; 2 T1 residuals warden +20.12 / drone +10.41 registered E86+]; ST-563 PENDING I597). I596 state: dist 6,851,951 B / 203;',
    'Status: CLOSED (opened I595; ST-562 DONE I596 [C1-exhausted accept: warden 3.13 / drone 0x637886; 2 T1 residuals warden +20.12 / drone +10.41 registered E86+]; ST-563 DONE I597 [G85.0 close gate 5/5 EXACT zero re-pin; CLOSE FLOOR E85 = 548,049 B WITH MEASUREMENT]). I597 state: dist 6,851,951 B / 203;');
  write(rel, s);
}

// 4) stories.md: ST-563 PENDING line -> DONE line
{
  const rel = 'production/stories.md';
  let s = read(rel);
  const oldLine = '- ST-563 E85 G85.0 close (I597) - PENDING I597: close gate 5/5 re-run (clone of the .evidence/I594 runner: causal495 dist :4200 + causal483 + playframe483/491 dev :5173 + pwa491 dist :5199; ports self-start/self-kill; pins EXPECTED EXACT zero re-pins [config value swaps change no geometry/draw calls/RNG]) + fresh dist re-measure (expect 6,851,950 +- 200 B / 203) + CLOSE FLOOR E85 WITH MEASUREMENT (7,400,000 - dist; headroom >= 102,400 B floor -> cut ladder NOT invoked expected) + AGENTS.md item-4 refresh (E85 clause at head, E84 demoted to prior; chain extended) + E85 CLOSED (2/2: ST-562/563) + bookkeeping (BOM delta 0) + commit + push delegate.';
  const newLine = '- ST-563 E85 G85.0 close (I597) - DONE I597: close gate 5/5 re-run EXACT 5/5 zero re-pins (.evidence/I597/run_closegate597.cjs: causal495 CAUSAL495 PASS [webgl+default EXACT seed-9876; webgpu report-only] / causal483 CAUSAL456 PASS score 11334 / playframe483+491 PLAYFRAME456 PASS [A 22/62,472 + P 11/180, B 52/132,682, console 0/0] / pwa491 SUMMARY 11/11; ports self-started/self-killed, all 4 free after) + fresh dist re-measured byte-identical 6,851,951 B / 203 (.evidence/I597/measure597.cjs; byte-identical to I596 - config value swaps change no geometry/draw calls/RNG) + CLOSE FLOOR E85 = 548,049 B WITH MEASUREMENT (7,400,000 - 6,851,951; headroom >= 102,400 B floor -> cut ladder NOT invoked) + AGENTS.md item-4 refresh (chain extended to I596/I597 + E85 clause at head, E84 demoted to prior; BOM 1 preserved) + E85 CLOSED 2/2 (ST-562/563) + legacy-4 backup .evidence/I593/backup/ retired as the revert source (remains on disk, gitignored) + push delegate.';
  s = replaceText(s, oldLine, newLine);
  write(rel, s);
}

// 5) iterations.md: append the I597 entry (file ends bare)
{
  const rel = 'production/iterations.md';
  let s = read(rel);
  const ITER597 = `## I597 (ST-563, E85): G85.0 CLOSE - E85 complete (2/2: ST-562/563), net code delta = 2 config lines

- Goal: close E85 (remastered-4 render-luma re-tune) with the G85.0 close gate: 5-harness regression EXACT, fresh dist re-measure, CLOSE FLOOR E85 WITH MEASUREMENT, AGENTS item-4 refresh.
- Changed files: AGENTS.md (item-4 refresh) + production/scope-check-E85.md (ST-563 evidence line filled) + bookkeeping (epics E85 header->CLOSED I597 (G85.0) + ST-563 DONE + Status CLOSED / stories ST-563 line PENDING->DONE / active NEXT at I598 / timeline / CHANGELOG).
- Close gate 5/5 EXACT zero re-pins (.evidence/I597/run_closegate597.cjs, clone of the I594 runner; ports self-started/self-killed, all 4 free after): causal495 CAUSAL495 PASS (3 arms seed-9876: webgl frozen classic reference + default EXACT; webgpu report-only) / causal483 CAUSAL456 PASS score 11334 / playframe483 PLAYFRAME456 PASS (A 22/62,472 + P 11/180, B 52/132,682, console 0/0) / playframe491 PLAYFRAME456 PASS (same pins) / pwa491 SUMMARY 11/11.
- Quality bar: npm test 1,237/1,237 + npm run build 0 (re-verified I596, no src change since) / fresh dist re-measured BYTE-IDENTICAL 6,851,951 B / 203 (measure597.cjs; byte-identical to I596 - config value swaps change no geometry/draw calls) / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- CLOSE FLOOR E85 = 548,049 B WITH MEASUREMENT (7,400,000 - 6,851,951 fresh dist re-measured EXACT; headroom >= 102,400 B floor -> cut ladder NOT invoked).
- AGENTS.md item-4 refresh: chain extended (I594/I595 docs-only = unchanged 6,851,950 / 203 -> 6,851,951 (I596, +1 B: remastered-4 luma re-pin config swap) / I597 = unchanged 6,851,951 / 203) + CLOSE FLOOR E85 clause at head, E84 demoted to prior (byte-safe splice; BOM 1 preserved, BOM delta 0).
- E85 CLOSED (2/2: ST-562 DONE I596 [accept-with-documentation; 2 T1 residuals warden +20.12 / drone +10.41 registered E86+], ST-563 DONE I597). Legacy-4 backup .evidence/I593/backup/ retired as the revert source (remains on disk, gitignored).
- Hygiene: all 4 ports free, zero tabs, zero terminals.
- Push: I596 commit d0831f0 push delegated to Dewey (landing verified next turn via git ls-remote); I597 commit push delegated to Dewey 01a20760-b402-74a2-b164-e13208b85f07.`;
  s = s + '\r\n\r\n' + ITER597;
  write(rel, s);
}

// 6) timeline.md: append the I597 paragraph (file ends bare)
{
  const rel = 'production/timeline.md';
  let s = read(rel);
  const TIMELINE597 = `I597 (ST-563, E85) done: no visible change - the light-rebalance round is officially closed. The full regression battery was re-run end to end and all five automated probes matched their pre-registered values exactly, which confirms the two re-pinned brightness values changed nothing about how the game runs: geometry, draw calls, and the deterministic test score are all untouched. The remaining room under the 7.4 MB download limit was measured: 548,049 bytes of headroom. The enemy-remaster follow-up epic is closed with two small documented residuals (the armored warden and the swarm drone still run a touch brighter than their approved rung, queued for a future round with a non-linear lever), and the standing queue for the next epic is clear - cockpit-view ship-in-frame with cockpit-relative controls, the camera far-framing fix, the wave-5 Monolith wall, the late-wave pacing transition, and the WebGPU visuals pass.`;
  s = s + '\r\n\r\n' + TIMELINE597;
  write(rel, s);
}

// 7) active.md: append the NEXT-at-I598 line (file ends bare)
{
  const rel = 'production/session-state/active.md';
  let s = read(rel);
  const NEXT598 = `- NEXT at I598 = open the next epic per the standing user queue (cgs-scope-check FIRST - frozen protocol: fresh research + scope-check before any freeze; DOCS-ONLY open commit). Candidates, in user-ask order: (1) cockpit view ship-in-frame + cockpit-relative controls [user standing ask: show part of the ship in the cockpit cam so it reads as sitting in the cockpit, replace the crosshair LINE with the ship's own nose/dashboard frame, and cockpit controls relative to ship facing instead of chase WASD] + camera far-framing fix [at long range the player cannot see all the way back]; (2) Monolith wave-5 wall (P1/P2/P3 pattern levers registered since E81-E83 + the gap-case record); (3) late-wave pacing [user: after wave 8/9 blue unbreakable rocks appear, wave clearance feels like waiting forever - shorten/fill the transition]; (4) the 2 registered E85 T1 residuals (warden +20.12 / drone +10.41 - need a non-linear lever beyond the G1/H1 rule family: per-mesh material or emissive split); (5) WebGPU visuals pass (?fx=webgpu experimental arm exists since I498). Scope-check decides which item the next epic takes; no src change before the scope-check is frozen.`;
  s = s + '\r\n' + NEXT598;
  write(rel, s);
}

// 8) CHANGELOG.md (pure LF): insert the I597 line above the I596 anchor line
{
  const rel = 'CHANGELOG.md';
  let s = read(rel);
  const anchor = '- I596: No visible change - the four remodeled enemies get their light rebalance, measured and applied';
  if (count(s, anchor) !== 1) throw new Error('changelog anchor != 1');
  const CHANGELOG597 = `- I597: No visible change - the light-rebalance round for the four remodeled enemies is officially closed: the full automated regression battery was re-run end to end and matched every pre-registered value exactly (nothing about how the game runs changed), and the remaining room under the 7.4 MB download limit was measured at 548,049 bytes. Two small documented brightness residuals were registered for a future round.`;
  const idx = s.indexOf(anchor);
  const lineStart = s.lastIndexOf('\n', idx - 1) + 1;
  s = s.slice(0, lineStart) + CHANGELOG597 + '\n' + s.slice(lineStart);
  write(rel, s);
}

// BOM delta check
let ok = true;
for (const [rel, exp] of BOMS) {
  const now = boms(read(rel));
  const delta = now - before[rel];
  if (now !== exp || delta !== 0) ok = false;
  console.log('BOM', rel, 'before', before[rel], 'after', now, 'expected', exp, 'delta', delta);
}
if (!ok) throw new Error('BOM check FAILED');
console.log('BOOKKEEP597 PASS - 8 patches applied, BOM delta 0');