const fs = require('fs');
const G = (p) => fs.readFileSync('E:/Game/' + p);
function head16(p) { return G(p).slice(0, 16).toString('hex'); }
function rep1(p, anchor, repl, label) {
  const b = G(p);
  const t = b.toString('latin1');
  const n = t.split(anchor).length - 1;
  if (n !== 1) throw new Error(label + ': anchor count ' + n + ' != 1: ' + anchor.slice(0, 70));
  const out = t.replace(anchor, repl);
  fs.writeFileSync(p, Buffer.from(out, 'latin1'));
  console.log(label + ' OK ' + b.length + ' -> ' + Buffer.byteLength(out, 'latin1'));
}
const heads = {};
for (const f of ['AGENTS.md','production/epics.md','production/stories.md','CHANGELOG.md']) heads[f] = head16(f);
// 0. AGENTS.md quality bar #4 (chain + CLOSE FLOOR E70)
rep1('AGENTS.md',
  '-> 5,254,934 (I518-I522, code-only growth); CLOSE FLOOR E69 = 845,066 B measured at G69.0 (I522: 6,100,000 - 5,254,934; headroom >= 102,400 B floor -> cut ladder C1..C5 NOT invoked)',
  '-> 5,254,934 (I518-I522, code-only growth) -> 5,255,258 (I525, +326 B payload telemetry tags); CLOSE FLOOR E70 = 844,742 B measured at G70.0 (I527: 6,100,000 - 5,255,258; headroom >= 102,400 B floor -> cut ladder C1..C3 NOT invoked); prior: CLOSE FLOOR E69 = 845,066 B measured at G69.0 (I522: 6,100,000 - 5,254,934; headroom >= 102,400 B floor -> cut ladder C1..C5 NOT invoked)',
  'agents.QBAR4');
// 1. epics.md (3 replaces: story line, status head, tail)
rep1('production/epics.md',
  'ST-493 G70.0 close gate (fresh 5-harness re-runs + CLOSE FLOOR re-derived WITH MEASUREMENT + quality bar + bookkeeping + commit/push).',
  'ST-493 (I527) G70.0 close gate - DONE I527 (5 fresh harness re-runs ALL GREEN, ALL EXPECTED EXACT, zero re-pins; CLOSE FLOOR E70 = 844,742 B re-derived WITH MEASUREMENT; vendor pins EXACT 8/8; AGENTS.md refreshed; E70 CLOSED 5/5).',
  'epics.STORIES');
rep1('production/epics.md',
  '- Status: OPEN (I523).',
  '- Status: CLOSED (I527; opened I523).',
  'epics.STATUS');
rep1('production/epics.md',
  'Next: I527 = ST-493 (G70.0 close gate - fresh 5-harness re-runs ALL EXPECTED EXACT + CLOSE FLOOR re-derived WITH MEASUREMENT + quality bar + bookkeeping + commit/push).',
  'ST-493 DONE I527 (G70.0 close gate WITH MEASUREMENT - 5 fresh harness re-runs ALL GREEN [causal495 CAUSAL495 PASS 3-arm / causal483 CAUSAL456 PASS / playframe483 + playframe491 PLAYFRAME456 PASS / pwa491 SUMMARY 11/11], ALL EXPECTED EXACT, zero re-pins: all E70 work is wave-5/10/13-gated or payload-only telemetry and the pin windows (MENU / wave 1-2 / frame 50) draw zero changed RNG; CLOSE FLOOR E70 = 844,742 B re-derived WITH MEASUREMENT [6,100,000 - 5,255,258; headroom >= 102,400 B floor, cut ladder C1..C3 NOT invoked]; vendor pins EXACT 8/8; AGENTS.md refreshed; R1 CLOSED I524, R7/R8 accept-with-documentation I526). E70 CLOSED 5/5 (ST-489 I523 / ST-490 I524 / ST-491 I525 / ST-492 I526 / ST-493 I527). Next: standing queue (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass).',
  'epics.TAIL');
for (const f of ['AGENTS.md','production/epics.md']) if (head16(f) !== heads[f]) throw new Error(f + ' head16 changed');
// 2. stories.md
rep1('production/stories.md',
  'STATUS (I526):',
  'STATUS (I527): ST-493 DONE (I527) - E70 CLOSED 5/5: G70.0 close gate WITH MEASUREMENT (probe-only, zero src): R1 5 fresh harness re-runs ALL GREEN (dev :5173 + dist :4200 + dist :5199 hidden; one headless tab per harness, all closed; servers killed + 5173/4200/5199 ECONNREFUSED) - causal495 CAUSAL495 PASS 3-arm (webgl + default 18/18 EXACT on the seed-9876 pin set; webgpu report-only err=0 warn=3 = I498 baseline), causal483 CAUSAL456 PASS EXACT, playframe483 + playframe491 PLAYFRAME456 PASS EXACT (A 22/25,781 + 11/180; B 52/55,400 hv=0/gv=0), pwa491 SUMMARY 11/11 - ALL EXPECTED EXACT, zero re-pins (all E70 work is wave-5/10/13-gated or payload-only telemetry; pin windows draw zero changed RNG); R2 dist ceiling re-derived WITH MEASUREMENT: 5,255,258 B/184 vs 6,100,000 B ceiling -> headroom 844,742 B >= 102,400 B floor -> cut ladder C1..C3 NOT INVOKED; CLOSE FLOOR E70 = 844,742 B; R3 E70 residuals adjudicated: R1 CLOSED I524 (Option B enterDur 1.2->2.0), R7/R8 ACCEPT-WITH-DOCUMENTATION I526 (Branch C; documented known limitations, future-episode inputs recorded); R4 vendor pins EXACT 8/8 (raw 104F561458997220/613E370F76638FDE/EAFEAD3154EC0609/D8F3CDB8B85B799A; dist-min A65DE049A7F38B40/7AB0784CD2532367/F549248412C62B9A/7FF9ACF50F006017; git diff vendor/ empty); R5 AGENTS.md refreshed (quality bar #4 chain -> 5,255,258 + CLOSE FLOOR E70 = 844,742 B); quality bar 6/6 measured: 1,187/1,187 + build 0 + 5-harness ALL GREEN + dist 5,255,258 B/184 + vendor EXACT 8/8 + BOM delta 0 + hygiene.\r\nSTATUS (I526):',
  'stories.STATUS');
if (head16('production/stories.md') !== heads['production/stories.md']) throw new Error('stories head16 changed');
// 3. iterations.md
{
  const p = 'production/iterations.md';
  const b = G(p);
  const t = b.toString('latin1');
  if (!t.endsWith('\n')) throw new Error('iterations: no trailing NL');
  const entry = '\n## I527 - ST-493: G70.0 close gate WITH MEASUREMENT - E70 CLOSED 5/5 (probe-only, zero src)\n- R1 5 fresh harness re-runs ALL GREEN (dev :5173 + dist :4200 + dist :5199 hidden; one headless Chromium tab per harness, all closed; servers 7404/18480/19948 killed + all 3 ports ECONNREFUSED; stdout captured in .evidence/I527/*.out):\n  - causal495 (dist :4200) -> CAUSAL495 PASS, 3 arms: webgl + default EXACT on the seed-9876 pin set (console 0/0 both pages); webgpu arm report-only: err=0 warn=3 (powerPreference x1 + AttributeNode uv x2 = the documented I498 baseline). NO re-pins - zero core drift: all E70 work is wave-5/10/13-gated (config levers) or payload-only telemetry (the 15 I525 source tags emit no RNG, no geometry) and the pin windows (MENU / waves 1-2 / reseed frame 50) draw zero changed RNG.\n  - causal483 (dev :5173) -> CAUSAL456 PASS EXACT (console 0/0).\n  - playframe483 + playframe491 (dev :5173) -> PLAYFRAME456 PASS EXACT (A MENU 22/25,781 + 11/180; B PLAYING reseed 71201 frame 50 52/55,400 hv=0/gv=0; console A 0/0 B 0/0). NO re-pins.\n  - pwa491 (dist :5199) -> SUMMARY 11/11 (SW active + root scope + controller on reload; manifest 200 manifest+json standalone 512 any+maskable start_url+scope; offline boot; no NaN; console 0/0).\n- R2 dist ceiling re-derived WITH MEASUREMENT (scope-check E70 pre-registration): measured dist 5,255,258 B / 184 files (.evidence/I527/dist527.cjs walk) vs the 6,100,000 B ceiling -> headroom 844,742 B >= 102,400 B floor -> CUT LADDER C1..C3 NOT INVOKED; the 6,100,000 B ceiling HOLDS as the G70.0 close state. CLOSE FLOOR E70 = 844,742 B (E69 precedent: close floor = the headroom measured at the gate; prior CLOSE FLOOR E69 = 845,066 B).\n- R3 E70 residuals ADJUDICATED (spec: design/e70-balance-followup-research.md sec.0 + sec.12; frozen branch rules sec.4.3): R1 CLOSED I524 (Option B phantom.enterDur 1.2 -> 2.0 SHIPPED WITH MEASUREMENT); R7 (0/10 wave-20) + R8 (null ratio) ACCEPT-WITH-DOCUMENTATION I526 (Branch C - H=4/10 < 6/10, max non-heavyweight gunship 2/10 < 4/10; documented known limitations; future-episode inputs recorded: gunship cluster / Monolith post-kill bolt window / pre-E69 density band; the 15 I525 payload tags remain permanent telemetry). Zero src in ST-493; no lever left unspent in the frozen set (both branches unmet by measurement).\n- R4 vendor pins EXACT 8/8 (raw: three.module 104F561458997220 / core 613E370F76638FDE / webgpu EAFEAD3154EC0609 / tsl D8F3CDB8B85B799A; dist-min: module A65DE049A7F38B40 / core 7AB0784CD2532367 / webgpu F549248412C62B9A / tsl 7FF9ACF50F006017; git diff vendor/ empty - zero src).\n- R5 AGENTS.md refreshed (docs-only): quality bar #4 chain -> 5,255,258 (I525, +326 B payload telemetry tags) + CLOSE FLOOR E70 = 844,742 B measured at G70.0 (cut ladder C1..C3 NOT invoked); prior CLOSE FLOOR E69 = 845,066 B retained. (No genre / art-asset line changes: E70 shipped no new levels or assets - fleet 31 GLBs unchanged, campaign 4 levels unchanged.)\n- R6 bookkeeping: epics.md E70 Status -> CLOSED (I527; opened I523) + ST-493 DONE I527 + E70 CLOSED 5/5 + Next standing queue; stories.md STATUS (I527) line (before the I526 line); timeline.md I527 line; CHANGELOG I527 line; active.md I527 note; .evidence/I527/ (harness stdout captures + pin/dist scripts, force-added).\n- Quality bar 6/6 (measured): npm test 1,187/1,187 + build exit 0 + 5-harness ALL GREEN console 0/0 (no NaN) + dist 5,255,258 B / 184 < 6,100,000 (headroom 844,742 B) + vendor pins EXACT 8/8 + BOM delta 0 (docs-only edits).\n- E70 CLOSED 5/5 (ST-489 I523 / ST-490 I524 / ST-491 I525 / ST-492 I526 / ST-493 I527). Next: standing queue (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass).\n';
  fs.writeFileSync(p, Buffer.concat([b, Buffer.from(entry, 'latin1')]));
  console.log('iterations.APPEND OK ' + b.length + ' -> ' + (b.length + Buffer.byteLength(entry, 'latin1')));
}
// 4. timeline.md
{
  const p = 'production/timeline.md';
  const b = G(p);
  const t = b.toString('latin1');
  if (!t.endsWith('\n')) throw new Error('timeline: no trailing NL');
  const line = '- 2026-11-20  I527 (ST-493: G70.0 close gate WITH MEASUREMENT - E70 CLOSED 5/5 (probe-only, zero src): 5 fresh harness re-runs ALL GREEN, ALL EXPECTED EXACT, zero re-pins (causal495 3-arm / causal483 / playframe483 / playframe491 / pwa491 11/11; servers killed, ports ECONNREFUSED); CLOSE FLOOR E70 = 844,742 B re-derived WITH MEASUREMENT (6,100,000 - 5,255,258; headroom >= 102,400 B floor, cut ladder C1..C3 NOT invoked); residuals adjudicated (R1 CLOSED I524; R7/R8 accept-with-documentation I526 - documented known limitations + future-episode inputs); vendor pins EXACT 8/8; AGENTS.md refreshed (quality bar #4); 1,187 tests; dist 5,255,258 B/184; BOM delta 0. Next: standing queue [camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass].)\n';
  fs.writeFileSync(p, Buffer.concat([b, Buffer.from(line, 'latin1')]));
  console.log('timeline.APPEND OK ' + b.length + ' -> ' + (b.length + Buffer.byteLength(line, 'latin1')));
}
// 5. CHANGELOG.md
rep1('CHANGELOG.md',
  '## [Unreleased]\r\n- I526:',
  '## [Unreleased]\r\n- I527: ST-493 E70 - G70.0 close gate WITH MEASUREMENT, E70 CLOSED 5/5 (probe-only, zero src) - 5 fresh harness re-runs ALL GREEN, ALL EXPECTED EXACT, zero re-pins (causal495 CAUSAL495 PASS 3-arm [webgl+default EXACT seed-9876 pin set; webgpu report-only err=0 warn=3 I498 baseline] / causal483 CAUSAL456 PASS / playframe483+491 PLAYFRAME456 PASS [A 22/25,781 + 11/180; B 52/55,400] / pwa491 SUMMARY 11/11); CLOSE FLOOR E70 = 844,742 B re-derived WITH MEASUREMENT (6,100,000 - 5,255,258; headroom >= 102,400 B floor, cut ladder C1..C3 NOT invoked; prior CLOSE FLOOR E69 = 845,066 B); residuals adjudicated: R1 CLOSED I524 (Option B phantom.enterDur 1.2->2.0), R7/R8 ACCEPT-WITH-DOCUMENTATION I526 (Branch C - documented known limitations, future-episode inputs recorded, 15 payload tags = permanent telemetry); vendor pins EXACT 8/8; AGENTS.md quality bar #4 refreshed (chain -> 5,255,258 + CLOSE FLOOR E70); 1,187/1,187 + build 0 + dist 5,255,258 B/184 + BOM delta 0 + hygiene (3 hidden servers killed ECONNREFUSED, all headless tabs closed)\r\n- I526:',
  'changelog.INSERT');
if (head16('CHANGELOG.md') !== heads['CHANGELOG.md']) throw new Error('changelog head16 changed');
// 6. active.md
rep1('production/session-state/active.md',
  'Committed (this story) + push pending.',
  'Committed c6e9442 + PUSHED-OK (093b7c3..c6e9442).',
  'active.FINALIZE-I526');
{
  const p = 'production/session-state/active.md';
  const b = G(p);
  const t = b.toString('latin1');
  const note = '- notes: I527 done (ST-493 E70 - G70.0 close gate WITH MEASUREMENT, probe-only zero src): 5 fresh harness re-runs ALL GREEN (causal495 3-arm CAUSAL495 PASS / causal483 CAUSAL456 PASS / playframe483+491 PLAYFRAME456 PASS / pwa491 SUMMARY 11/11; stdout in .evidence/I527/*.out; servers 7404/18480/19948 killed, 5173/4200/5199 ECONNREFUSED) - ALL EXPECTED EXACT, zero re-pins (E70 work = wave-gated config + payload-only telemetry; pin windows draw zero changed RNG); CLOSE FLOOR E70 = 844,742 B re-derived WITH MEASUREMENT (dist 5,255,258 B/184 vs 6,100,000 B ceiling; headroom >= 102,400 B floor, cut ladder C1..C3 NOT invoked); residuals adjudicated (R1 CLOSED I524; R7/R8 accept-with-documentation I526); vendor pins EXACT 8/8 (raw + dist-min; git diff vendor/ empty); AGENTS.md quality bar #4 refreshed (chain -> 5,255,258 + CLOSE FLOOR E70); quality bar 6/6: 1,187/1,187 + build 0 + dist 5,255,258 B/184 + BOM delta 0 + hygiene. E70 CLOSED 5/5. Committed (this story) + push pending. Next: standing queue (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass).\n';
  let base = t;
  if (!base.endsWith('\n')) base += '\n';
  fs.writeFileSync(p, Buffer.from(base + note, 'latin1'));
  console.log('active.APPEND-I527 OK ' + b.length + ' -> ' + Buffer.byteLength(base + note, 'latin1'));
}
console.log('BOOKKEEPING I527 DONE');