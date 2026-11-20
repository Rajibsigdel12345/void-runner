// I542 (ST-508, E73): re-pin playframe483.mjs WITH MEASUREMENT - the I541 ship v7 swap delta (A 22/25781 -> 22/32717, B 52/55400 -> 52/69272) was measured in the G73.0 gate fresh run (deterministic; identical to the I541 playframe491 re-pin). latin1 byte-preserving, NOT FOUND/NOT UNIQUE guards.
const fs = require(`fs`);
const path = require(`path`);
const R = (p) => path.join(__dirname, `..`, `..`, p);
const read = (f) => fs.readFileSync(R(f), `latin1`);
const write = (f, s) => fs.writeFileSync(R(f), Buffer.from(s, `latin1`));
const bom = (f) => { const b = fs.readFileSync(R(f)); let c = 0, i = 0; while (i + 2 < b.length && b[i] === 0xEF && b[i + 1] === 0xBB && b[i + 2] === 0xBF) { c++; i += 3; } return c; };
const rep = (s, oldStr, newStr, tag) => { const i = s.indexOf(oldStr); if (i < 0) throw new Error(tag + `: NOT FOUND`); if (s.indexOf(oldStr, i + 1) >= 0) throw new Error(tag + `: NOT UNIQUE`); return s.slice(0, i) + newStr + s.slice(i + oldStr.length); };
const F = `.evidence/I483/playframe483.mjs`;
const before = bom(F);
let s = read(F);
s = rep(s,
`// I503 (ST-469 boss v2): re-pin WITH MEASUREMENT (A 22/17397 -> 22/25781, B 52/38560 -> 52/55400 = the ST-467 ship v6 delta propagated from the I501 I491 re-pin; boss swap contributes 0 to both windows) + ship-ready gate in readyFn below.`,
`// I542 (ST-508 G73.0 gate): re-pin WITH MEASUREMENT (A 22/25781 -> 22/32717, B 52/55400 -> 52/69272 = the I541 ship v7 swap delta propagated from the I541 I491 re-pin; boss swap contributes 0 to both windows). // I503 (ST-469 boss v2): re-pin WITH MEASUREMENT (A 22/17397 -> 22/25781, B 52/38560 -> 52/55400 = the ST-467 ship v6 delta propagated from the I501 I491 re-pin; boss swap contributes 0 to both windows) + ship-ready gate in readyFn below.`,
`pf483-header`);
s = rep(s,
`RA.L.calls === 22 && RA.L.tris === 25781`,
`RA.L.calls === 22 && RA.L.tris === 32717`,
`pf483-pinA`);
s = rep(s,
`A: L exact 22/25781 (I503 (ST-469 boss v2) re-pin WITH MEASUREMENT of the ST-467 ship v6 delta never propagated here: 22/17397 -> 22/25781, delta +8,420 = ship GLB 17,143 -> 25,563 (fx=off single scene pass; non-ship 218 unchanged). Boss v2 is NOT drawn in the MENU A window, so the boss swap contributes 0 - measured 25,781 in 3 deterministic I503 runs; identical to the I501 I491 re-pin. I471 note: MENU frame draws no enemies; same 22 calls, ship once)`,
`A: L exact 22/32717 (I542 (ST-508 G73.0 gate) re-pin WITH MEASUREMENT of the I541 ship v7 swap: 22/25781 -> 22/32717, delta +6,936 = ship GLB 25,563 -> 32,499 exactly (fx=off single scene pass; non-ship 218 unchanged; boss v2 NOT drawn in the MENU A window - contributes 0; identical to the I541 I491 re-pin). I503 (ST-469 boss v2) history: re-pin WITH MEASUREMENT of the ST-467 ship v6 delta 22/17397 -> 22/25781, delta +8,420 = ship GLB 17,143 -> 25,563 (fx=off single scene pass; non-ship 218 unchanged; measured 25,781 in 3 deterministic I503 runs). I471 note: MENU frame draws no enemies; same 22 calls, ship once)`,
`pf483-labelA`);
s = rep(s,
`RB.calls === 52 && RB.tris === 55400`,
`RB.calls === 52 && RB.tris === 69272`,
`pf483-pinB`);
s = rep(s,
`B: 52/55400 (I503 (ST-469 boss v2) re-pin WITH MEASUREMENT of the ST-467 ship v6 delta never propagated here: 52/38560 -> 52/55400, delta +16,840 = 2 x 8,420 (fx=high B window draws every scene tri twice: main + fx scene pass; single-pass scene 19,280 -> 27,700). Boss v2 is NOT drawn at reseed 71201 frame 50, so the boss swap contributes 0 - measured 55,400 in 3 deterministic I503 runs; identical to the I501 I491 re-pin. I471 note: B window has 0 visible hunters / gunships (hv=0/gv=0); same 52 calls, I443 decomposition unchanged)`,
`B: 52/69272 (I542 (ST-508 G73.0 gate) re-pin WITH MEASUREMENT of the I541 ship v7 swap: 52/55400 -> 52/69272, delta +13,872 = 2 x 6,936 (fx=high B window draws every scene tri twice: single-pass scene 27,700 -> 34,636; boss v2 NOT drawn at reseed 71201 frame 50 - contributes 0; identical to the I541 I491 re-pin). I503 (ST-469 boss v2) history: re-pin WITH MEASUREMENT of the ST-467 ship v6 delta 52/38560 -> 52/55400, delta +16,840 = 2 x 8,420 (fx=high B window draws every scene tri twice; single-pass scene 19,280 -> 27,700; measured 55,400 in 3 deterministic I503 runs). I471 note: B window has 0 visible hunters / gunships (hv=0/gv=0); same 52 calls, I443 decomposition unchanged)`,
`pf483-labelB`);
const after = bom(F);
if (after !== before) throw new Error(`BOM DRIFT ` + before + ` -> ` + after);
write(F, s);
console.log(`PINS542PF DONE`);
