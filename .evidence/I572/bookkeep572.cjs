// I572 bookkeeping - asserted-substring transforms, BOM-preserving (E79 close gate)
const fs = require('fs');
const P = 'E:/Game/';
const bom = (s) => (s.match(/\uFEFF/g) || []).length;
function spliceOnce(s, sub, rep, tag) {
  const i = s.indexOf(sub);
  if (i === -1) throw new Error('NOT FOUND: ' + tag);
  if (s.indexOf(sub, i + sub.length) !== -1) throw new Error('NOT UNIQUE: ' + tag);
  return s.slice(0, i) + rep + s.slice(i + sub.length);
}
const files = ['production/epics.md', 'production/stories.md', 'production/iterations.md', 'production/session-state/active.md', 'production/timeline.md', 'CHANGELOG.md', 'AGENTS.md'];
const before = {};
for (const f of files) before[f] = bom(fs.readFileSync(P + f, 'utf8'));

// 1) epics.md: E79 header + Status + Stories line (ST-539 DONE + stale PENDING dup cleanup)
let ep = fs.readFileSync(P + 'production/epics.md', 'utf8');
ep = spliceOnce(ep,
  '## E79 - Composite Wall Fairness (boss retirement) - OPEN (opened I569)',
  '## E79 - Composite Wall Fairness (boss retirement) - CLOSED I572 (opened I569)',
  'epics header');
ep = spliceOnce(ep,
  '- Status: IN PROGRESS I571 - C1 executed (accept round, E78 pattern): L-A full revert + accept-with-documentation + residual to the E80+ backlog WITH the full measurement record; ST-538 VOID I571 (L-B trigger not met). E79 closing as an accept round per the E78 pattern. Next: ST-539 (I572) G79.0 close gate.',
  "- Status: CLOSED I572 (G79.0 close gate; opened I569). Residual registration (for a future epic, NOT an E79 scope item): post-E79 live wall = the Splicer's OWN wave-10 fight (sweep571: 13/30, median 10) - the frozen E70 lever [2] (splicer.maxHp 30 -> 24) is the recorded E70-protocol candidate; the L-A boss-retirement mechanism is shown INERT on the current tree (bosses die in-window; registered, not to be re-attempted).",
  'epics status');
ep = spliceOnce(ep,
  ' / ST-539 PENDING I572 (G79.0 close gate: 5 fresh harnesses + dist re-measure + CLOSE FLOOR E79 WITH MEASUREMENT + AGENTS.md refresh + E79 CLOSED + push delegate) / ST-538 PENDING I572 (L-B gunship hp 10 -> 8 conditional: FROZEN TRIGGER on sweep571 wave-8/9 band (gunship+rock_L+rock_M) >= 4/30 AND median < 11 -> apply + sweep572 (seeds 57200+i) acceptance (a)/(c)/(d)/(e); else story VOID; no second pass) / ST-539 PENDING I573 (G79.0 close gate: 5 fresh harnesses + dist re-measure + CLOSE FLOOR E79 WITH MEASUREMENT + AGENTS.md refresh + E79 CLOSED + push delegate).',
  ' / ST-539 DONE I572 (G79.0 close gate: CLOSEGATE572 5 fresh harnesses ALL EXACT NO re-pin [causal495 + causal483 + playframe483/491 A 22/32,717 + 11/180, B 52/73,172 + pwa491 11/11] + dist re-measured 6,430,174 B / 203 + CLOSE FLOOR E79 = 969,826 B WITH MEASUREMENT + AGENTS.md item-4 refresh + E79 CLOSED I572 + push delegate).',
  'epics stories');
fs.writeFileSync(P + 'production/epics.md', ep);

// 2) stories.md: ST-539 line -> DONE I572 (LF region; regex per house rule)
let st = fs.readFileSync(P + 'production/stories.md', 'utf8');
const m = st.match(/- ST-539 E79 G79\.0 close gate[^\n]*/g);
if (!m || m.length !== 1) throw new Error('stories ST-539 match count ' + (m ? m.length : 0));
const newSt = "- ST-539 E79 G79.0 close gate (I572) - DONE I572: CLOSEGATE572 5/5 fresh harnesses ALL EXACT NO re-pin [causal495 3 arms (webgl frozen classic + default EXACT seed-9876; webgpu report-only) + causal483 score 11334 + playframe483/491 A 22/32,717 + 11/180, B 52/73,172 + pwa491 SUMMARY 11/11; runner self-kills servers, port-free verified per step] + dist re-measured 6,430,174 B / 203 + CLOSE FLOOR E79 = 969,826 B WITH MEASUREMENT (7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder NOT invoked) + AGENTS.md item-4 chain refresh (CLOSE FLOOR E79 line, E78 line demoted to prior; dist chain unchanged - byte-identical) + epics E79 CLOSED I572 (accept round, E78 pattern: C1 executed I571 + ST-538 VOID I571; stale ST-538/ST-539 PENDING duplicate entries on the E79 Stories line cleaned) + residual registration (post-E79 live wall = the Splicer's own wave-10 fight, 13/30 in sweep571; frozen lever [2] (splicer.maxHp 30 -> 24) the recorded E70-protocol candidate; L-A retirement shown inert on the current tree) + quality bar 6/6 + push delegate";
st = st.replace(/- ST-539 E79 G79\.0 close gate[^\n]*/, newSt);
fs.writeFileSync(P + 'production/stories.md', st);

// 3) iterations.md: append the I572 entry (CRLF, blank-line separated)
let it = fs.readFileSync(P + 'production/iterations.md', 'utf8');
if (!it.endsWith('push delegate].\r\n')) throw new Error('iterations tail anchor');
const entry = [
  '## I572 (ST-539, E79): G79.0 close gate - E79 CLOSED (accept round, E78 pattern: C1 executed I571 + ST-538 VOID I571)',
  '',
  '- Pre-state: local ad7d35d (I571, C1 executed; push pending); origin ce92b07 (I570); dist 6,430,174 B / 203; CLOSE FLOOR E78 = 969,826 B.',
  '- Change: ZERO src/assets/vendor/render/i18n (docs + .evidence only): .evidence/I572/ [clone572.cjs (runner-clone transform) + run_closegate572.cjs (clone of the I568 runner, label CLOSEGATE572) + 5 harness .out files + closegate572.console.txt] + AGENTS.md item-4 (CLOSE FLOOR E79 line, E78 demoted to prior) + bookkeeping (epics E79 CLOSED I572 + ST-539 DONE + stale ST-538/ST-539 PENDING duplicate cleanup on the E79 Stories line / stories ST-539 DONE / active / timeline / CHANGELOG).',
  '- Gate: CLOSEGATE572 5 fresh harnesses ALL EXACT NO re-pin [causal495 PASS 3 arms (webgl frozen classic + default EXACT seed-9876; webgpu report-only) + causal483 CAUSAL456 PASS (score 11334) + playframe483/491 A 22/32,717 + 11/180, B 52/73,172 + pwa491 SUMMARY 11/11; all ports free; the runner self-kills every server, port-free verified per step]; re-pin is impossible (net-zero src since I570 after the I571 C1 revert - the L-A boss-retirement implementation was fully reverted before the gate ran).',
  '- CLOSE FLOOR E79 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174 fresh dist re-measured EXACT, byte-identical to I571; headroom >= 102,400 B floor -> cut ladder NOT invoked; ceiling 7,400,000, tripwire 7,297,600 not hit).',
  "- E79 DoD 3/3: (1) five harnesses fresh + EXACT; (2) dist re-measured + CLOSE FLOOR E79 re-derived WITH MEASUREMENT; (3) AGENTS.md item-4 refreshed + E79 CLOSED -> E79 CLOSED I572. Residual registration carried forward (NOT E79 scope): post-E79 live wall = the Splicer's OWN wave-10 fight (sweep571: 13/30, median 10) - the frozen E70 lever [2] (splicer.maxHp 30 -> 24) is the recorded E70-protocol candidate; the L-A boss-retirement mechanism is shown INERT on the current tree (bosses die in-window; registered, not to be re-attempted).",
  '- Quality bar 6/6 (docs-only): npm test 1,237/1,237; npm run build 0; dist 6,430,174 B / 203 byte-identical; vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1 / CHANGELOG 7); hygiene (zero servers/tabs - the runner self-kills all servers; zero browser tabs).',
  "- Next: I573+ = next epic per the standing queue [candidates: main-character art remaster (Blender) / camera far-distance framing + cockpit first-person polish / new enemies / linear level design + bosses / the registered post-E79 live wall (the Splicer's own wave-10 fight - frozen lever [2] splicer.maxHp 30 -> 24 is the recorded E70-protocol candidate); pick by scope-check, not by overengineering].",
].join('\r\n');
it = it + '\r\n' + entry + '\r\n';
fs.writeFileSync(P + 'production/iterations.md', it);

// 4) active.md: append the [DONE at I572: ...] marker after the fulfilled NEXT-at-I572 statement
let ac = fs.readFileSync(P + 'production/session-state/active.md', 'utf8');
ac = spliceOnce(ac,
  'AGENTS.md item-4 refresh, E79 CLOSED, push delegate',
  'AGENTS.md item-4 refresh, E79 CLOSED, push delegate [DONE at I572: CLOSEGATE572 5/5 EXACT no re-pin [causal495 3 arms seed-9876 + causal483 score 11334 + playframe483/491 A 22/32,717 + 11/180, B 52/73,172 + pwa491 11/11; all ports free; run_closegate572.cjs self-kills servers]; CLOSE FLOOR E79 = 969,826 B WITH MEASUREMENT [7,400,000 - 6,430,174 byte-identical; headroom >= 102,400 B floor -> cut ladder NOT invoked]; AGENTS.md item-4 refreshed; E79 CLOSED I572; dist 6,430,174 B / 203 byte-identical; tests 1,237/1,237, vendor 4/4 EXACT, BOM delta 0; push pending]',
  'active done marker');
fs.writeFileSync(P + 'production/session-state/active.md', ac);

// 5) timeline.md: append user-facing I572 line (LF tail)
let tl = fs.readFileSync(P + 'production/timeline.md', 'utf8');
if (!tl.endsWith('under the 7.4 MB limit with 969,826 bytes of room to spare.\n')) throw new Error('timeline tail anchor');
tl += "I572 (ST-539, E79) done: the fairness round is officially closed. Every automated play-check was re-run fresh and matched its pinned numbers exactly (as expected - the boss fix we tested last round was reverted per our frozen rules, so no gameplay code changed), and the bundle was re-measured: unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare. The documented difficulty picture (the wave-10 boss's own fight as the live wall) stands as the closing record, with the candidate fix on file for a future round.\n";
fs.writeFileSync(P + 'production/timeline.md', tl);

// 6) CHANGELOG.md: insert I572 line after the I561 line (pre-existing order quirk; descending from there)
let cl = fs.readFileSync(P + 'CHANGELOG.md', 'utf8');
const i561 = '- I561: Three enemy ship types (the phantom interceptor, the sweeper and the mine-hauler) now have fully remodeled hulls with more plating and mechanical detail - same shapes, much nicer looks. Nothing else changed.\n';
cl = spliceOnce(cl, i561, i561 + '- I572: No visible change - the fairness round is officially closed: every automated play-check was re-run fresh and matched its pinned numbers exactly (expected - the boss fix tested last round was reverted per our frozen rules), and the bundle was re-measured at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n', 'changelog i561 anchor');
fs.writeFileSync(P + 'CHANGELOG.md', cl);

// 7) AGENTS.md item-4: CLOSE FLOOR E79 line, E78 demoted to prior
let ag = fs.readFileSync(P + 'AGENTS.md', 'utf8');
const agAnchor = '2.5->2.5], 203); CLOSE FLOOR E78 = 969,826 B measured at G78.0 (I568:';
ag = spliceOnce(ag, agAnchor, '2.5->2.5], 203); CLOSE FLOOR E79 = 969,826 B measured at G79.0 (I572: 7,400,000 - 6,430,174 fresh dist re-measured EXACT [byte-identical to I571 - E79 accept round, zero src change]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E79 CLOSED I572); prior CLOSE FLOOR E78 = 969,826 B measured at G78.0 (I568:', 'agents close floor');
fs.writeFileSync(P + 'AGENTS.md', ag);

// BOM verification
let ok = true;
for (const f of files) {
  const after = bom(fs.readFileSync(P + f, 'utf8'));
  const same = after === before[f];
  if (!same) ok = false;
  console.log(f, 'BOM', before[f], '->', after, same ? 'OK' : 'MISMATCH');
}
if (!ok) process.exit(1);
console.log('BOOKKEEP572 DONE');
