import fs from 'fs';
let s = fs.readFileSync('.evidence/I491/playframe491.mjs', 'utf8');
const pairs = [
  ['check("A: L exact 22/17361 (I497 re-pin WITH MEASUREMENT:', 'check("A: L exact 22/25781 (I501 (ST-467 ship v6) EXPLICIT re-pin WITH MEASUREMENT: 22/17361 -> 22/25781, delta +8,420 = ship GLB 17,143 -> 25,563 exactly (fx=off single scene pass: ship + flame + floorDisc 48 + ring + sprite unchanged at 218 non-ship tris). I497 note below still governs the vendor pin. I497 re-pin WITH MEASUREMENT:'],
  ['RA.L.calls === 22 && RA.L.tris === 17361, "L=" + RA.L.calls + "/" + RA.L.tris);', 'RA.L.calls === 22 && RA.L.tris === 25781, "L=" + RA.L.calls + "/" + RA.L.tris);'],
  ['check("B: 52/38560 (I471 EXPLICIT pin: I470 pin HOLDS - measured B window (reseed 71201 frame 50) has 0 visible hunters / 0 visible gunships (hv=0/gv=0), so the enemy v5 tri delta (hunter 2256-1432=+824 / gunship 2268-1688=+580 per visible mesh) does not materialize; same 52 calls, I443 decomposition unchanged)", RB.calls === 52 && RB.tris === 38560, "calls/tris=" + RB.calls + "/" + RB.tris + " hv=" + RB.hunterVis + " gv=" + RB.gunshipVis);', 'check("B: 52/55400 (I501 (ST-467 ship v6) EXPLICIT re-pin WITH MEASUREMENT: 52/38560 -> 52/55400, delta +16,840 = 2 x 8,420 - the fx=high B window renders the scene in two passes (main + fx scene pass), so every scene tri is drawn twice; single-pass scene 19,280 -> 27,700 (+8,420 ship only, non-ship 2,137 unchanged: rocks/ring/floor/flame identical at reseed 71201). I471 pin note: measured B window (reseed 71201 frame 50) has 0 visible hunters / 0 visible gunships (hv=0/gv=0); same 52 calls, I443 decomposition unchanged)", RB.calls === 52 && RB.tris === 55400, "calls/tris=" + RB.calls + "/" + RB.tris + " hv=" + RB.hunterVis + " gv=" + RB.gunshipVis);'],
];
for (const [old, rep] of pairs) {
  const n = s.split(old).length - 1;
  if (n !== 1) { console.error('FAIL: got ' + n + ' for ' + old.slice(0, 60)); process.exit(1); }
  s = s.replace(old, rep);
}
fs.writeFileSync('.evidence/I491/playframe491.mjs', s);
console.log('OK playframe re-pin (3 edits)');
