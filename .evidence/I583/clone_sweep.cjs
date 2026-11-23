// I583: clone .evidence/I582/sweep581.mjs -> .evidence/I583/sweep582.mjs
// Line-asserted replacements: header/seeds/labels/branch block -> the FROZEN E82
// acceptance (rules582.md sec.3). Kiter + bullet attribution + metric code VERBATIM
// (asserted, not rewritten). ASCII only; LF; no BOM.
const fs = require("fs");
const src = fs.readFileSync(".evidence/I582/sweep581.mjs", "utf8");
const L = src.split("\n");
if (L.length !== 327) throw new Error("unexpected line count " + L.length);
function assertLine(i, label, pred) { if (!pred(L[i])) throw new Error("ASSERT FAIL L" + (i + 1) + ": " + label); }
assertLine(0, "header I582", (x) => x.startsWith("// I582 E82 open:"));
assertLine(1, "seeds comment", (x) => x === "// 30 seeds 58100+i, FULL director from wave 1 (no isolation), kiter pilot");
assertLine(3, "rules pointer comment", (x) => x.startsWith("// at DT = 1/60. All rules frozen in .evidence/I582/rules581.md"));
assertLine(10, "SEEDS", (x) => x === "const SEEDS = Array.from({ length: 30 }, (_, i) => 58100 + i);");
assertLine(242, "tag", (x) => x === '  tag: "sweep581", dt: DT, cap: CAP, seeds: SEEDS,');
assertLine(243, "frozen pointer", (x) => x === '  frozen: ".evidence/I582/rules581.md",');
assertLine(252, "json out", (x) => x === 'writeFileSync(new URL("./sweep581.json", import.meta.url), JSON.stringify(out, null, 1));');
assertLine(271, "adjudication header", (x) => x.startsWith("// ---------- E82 adjudication (rules581.md sec.3"));
assertLine(272, "b56", (x) => x.startsWith("const b56 ="));
assertLine(273, "m56", (x) => x.startsWith("const m56 ="));
assertLine(274, "m56p open", (x) => x.startsWith("const m56p = runs.filter(r => {"));
assertLine(283, "m56p close", (x) => x.startsWith("}).length; // M56' FROZEN"));
assertLine(284, "let branch", (x) => x === "let branch;");
assertLine(286, "branch B", (x) => x.startsWith('  branch = "B (Monolith wave-5 wall)'));
assertLine(288, "branch A*", (x) => x.startsWith('  branch = "A* (pre-registered'));
assertLine(290, "branch G", (x) => x.startsWith('  branch = "G (C-equivalent accept)'));
assertLine(292, "branch C", (x) => x.startsWith('  branch = "C (accept-with-documentation)'));
assertLine(293, "branch block close", (x) => x === "}");
assertLine(295, "med", (x) => x.startsWith("const med = (a) =>"));
assertLine(296, "deathWaves", (x) => x.startsWith("const deathWaves = runs.filter"));
assertLine(297, "perRun", (x) => x.startsWith("const perRun = runs.map"));
assertLine(304, "header push", (x) => x.includes("pre-lever re-audit of the Monolith wave-5 wall"));
assertLine(305, "rules push", (x) => x.includes("rules: .evidence/I582/rules581.md"));
assertLine(315, "fraction line", (x) => x.includes('BRANCH DECISION: " + branch'));
assertLine(325, "results out", (x) => x.includes('"./results581.txt"'));
assertLine(326, "console log", (x) => x === 'console.log(lines.join("\\n"));');

L[0] = "// I583 E82 (ST-550 APPLY round): post-lever VALIDATION of the FROZEN E82 lever boss.burst.every 4.0 -> 4.8 (applied to src/core/config.js:300 this round - 1-char literal swap; Branch B fired at I582: B56 12/30 >= 12/30) through the SAME harness as sweep581.mjs (rules frozen in .evidence/I583/rules582.md) with fresh seeds 58200+i, 30 seeds, E82 FROZEN acceptance (a)-(d) (design/e82-monolith-wave5-wall-ii-research.md sec.6; (e) = the 5-harness gate EXACT, external). Pre-lever baselines: sweep577 B56 11/30, M56 7/30, M56' 11/30, median 9, reach>=13 6/30; sweep581 B56 12/30, M56 11/30, M56' 12/30, median 8, reach>=13 1/30. Deterministic. C1 on any (a)-(d) failure: git restore src/core/config.js + accept + P1/P2/P3 to E83+.";
L[1] = "// 30 seeds 58200+i, FULL director from wave 1 (no isolation), kiter pilot";
L[3] = "// at DT = 1/60. All rules frozen in .evidence/I583/rules582.md (lineage of rules581.md, E82 labels).";
L[10] = "const SEEDS = Array.from({ length: 30 }, (_, i) => 58200 + i);";
L[242] = '  tag: "sweep582", dt: DT, cap: CAP, seeds: SEEDS,';
L[243] = '  frozen: ".evidence/I583/rules582.md",';
L[252] = 'writeFileSync(new URL("./sweep582.json", import.meta.url), JSON.stringify(out, null, 1));';
L[271] = "// ---------- E82 acceptance (rules582.md sec.3, FROZEN - (a)-(d) in-sweep, (e) external; metric code VERBATIM from sweep581.mjs per rules582.md sec.5) ----------";
for (let i = 293; i >= 284; i--) L.splice(i, 1);
const acceptBlock = [
  "const medWave = med(deathWaves);",
  "const reach13 = runs.filter(r => {",
  "  const reached = r.died",
  "    ? r.killingBlow.wave",
  "    : (Object.keys(r.waveTable).length ? Math.max(...Object.keys(r.waveTable).map(Number)) : 0);",
  "  return reached >= 13;",
  "}).length;",
  "const accA = b56 <= 9;",
  "const accB = m56p <= 7;",
  "const accC = medWave !== null && medWave >= 9;",
  "const accD = reach13 >= 3;",
  'const acceptance = "(a) B56 <= 9/30: " + (accA ? "PASS" : "FAIL") + " [" + b56 + "/" + runs.length + ", baseline 11/30] | (b) M56\' <= 7/30: " + (accB ? "PASS" : "FAIL") + " [" + m56p + "/" + runs.length + ", baseline 11/30] | (c) median death wave >= 9: " + (accC ? "PASS" : "FAIL") + " [measured " + medWave + "] | (d) >= 3/30 reach wave >= 13: " + (accD ? "PASS" : "FAIL") + " [measured " + reach13 + "/" + runs.length + "; sweep577 6/30; sweep581 1/30] | (e) 5-harness gate EXACT no re-pin: EXTERNAL (run_gate583.cjs)";',
];
L.splice(287, 0, ...acceptBlock);
function repLine(oldSub, newLine, label) {
  const idx = L.findIndex((x) => x.includes(oldSub));
  if (idx === -1) throw new Error("LINE NOT FOUND: " + label);
  if (L.findIndex((x, i) => i > idx && x.includes(oldSub)) !== -1) throw new Error("LINE NOT UNIQUE: " + label);
  L[idx] = newLine;
}
repLine("pre-lever re-audit of the Monolith wave-5 wall", 'lines.push("I583 E82 (30 seeds 58200+i, full director, kiter, cap " + CAP + " ticks) - post-lever VALIDATION of the FROZEN E82 lever boss.burst.every 4.0 -> 4.8 (ST-550/I583; acceptance (a)-(d) per rules582.md sec.3; (e) = 5-harness gate EXACT, external)");', "header push");
repLine("rules: .evidence/I582/rules581.md", 'lines.push("rules: .evidence/I583/rules582.md   generated " + new Date().toISOString() + "   wall ms " + (Date.now() - t0));', "rules push");
repLine('BRANCH DECISION: " + branch', 'lines.push("FRACTION H primary: " + (hPrimary/runs.length).toFixed(3) + " (" + hPrimary + "/" + runs.length + ")   ACCEPTANCE (a)-(e): " + acceptance);', "fraction line");
repLine('"./results581.txt"', 'writeFileSync(new URL("./results582.txt", import.meta.url), lines.join("\\n") + "\\n");', "results out");
const outS = L.join("\n");
for (const b of ["58100", "sweep581.json", "results581.txt", 'tag: "sweep581"', "I582 E82"]) if (outS.includes(b)) throw new Error("LEFTOVER: " + b);
fs.writeFileSync(".evidence/I583/sweep582.mjs", outS, "utf8");
console.log("sweep582.mjs written, bytes " + fs.statSync(".evidence/I583/sweep582.mjs").size);
console.log("kiter verbatim: " + (outS.includes("const weave = Math.sin(t / 90) * 4;") ? "OK" : "FAIL"));