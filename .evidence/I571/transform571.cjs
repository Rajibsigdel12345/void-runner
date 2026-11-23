// I571: transform sweep569.mjs -> sweep571.mjs (asserted-unique-substring; house pattern).
const fs = require("fs");
const path = require("path");
let src = fs.readFileSync(path.join(__dirname, "../I570/sweep569.mjs"), "utf8");
function repOnce(old, next) {
  const n = src.split(old).length - 1;
  if (n !== 1) { console.error("ANCHOR x" + n + " (expected 1): " + JSON.stringify(old.slice(0, 80))); process.exit(1); }
  src = src.replace(old, next);
}
repOnce(
"// I570 E79 open: pre-lever re-audit of the registered composite post-E77 wall (Branch C at I567: wave-5 Monolith bolt cluster 10/30 + wave-10 mixed cluster 11/30 + wave-8/9 gunship band 4/30; median 9; H = 0.400 EXACT) through the SAME harness as sweep567.mjs (rules re-frozen in .evidence/I570/rules569.md) with fresh seeds 56900+i, 30 seeds, FRACTION branch thresholds (0.6 / 0.4). Deterministic. Expected: reproduce the Branch C composite picture (independent cross-check of sweep567 before L-A boss retirement in ST-537/I571).",
"// I571/ST-537 (E79 L-A): POST-LEVER ACCEPTANCE sweep of the implemented boss retirement (cfg.boss.retireAfterWaves 3, endless-only; wave-5 Monolith leaves at wave 8 start, wave-10 Splicer at wave 13 start) - 30 FRESH seeds 57100+i, the SAME harness as sweep569.mjs (frozen I328 kiter VERBATIM, full director, cap 36000 ticks @ 1/60, attribution rules525/564 unchanged). Rules frozen PRE-RUN in .evidence/I571/rules571.md. Acceptance (a)-(e) frozen at I569; L-B trigger read per rules571.md sec.4. Deterministic.");
repOnce("// 30 seeds 56900+i, FULL director from wave 1 (no isolation), kiter pilot",
        "// 30 seeds 57100+i, FULL director from wave 1 (no isolation), kiter pilot");
repOnce("// at DT = 1/60. All rules frozen in .evidence/I570/rules569.md (restates rules564; extends I525).",
        "// at DT = 1/60. All rules frozen in .evidence/I571/rules571.md (restates rules564; extends I525).");
repOnce("(_, i) => 56900 + i", "(_, i) => 57100 + i");
repOnce('tag: "sweep569"', 'tag: "sweep571"');
repOnce('frozen: ".evidence/I570/rules569.md"', 'frozen: ".evidence/I571/rules571.md"');
repOnce('"./sweep569.json"', '"./sweep571.json"');
repOnce('"./results569.txt"', '"./results571.txt"');
repOnce('lines.push("I570 E79 open (30 seeds 56900+i, full director, kiter, cap " + CAP + " ticks) - pre-lever re-audit of the composite post-E77 wall (Branch C cross-check of sweep567)");',
        'lines.push("I571 E79 L-A post-lever acceptance (30 seeds 57100+i, full director, kiter, cap " + CAP + " ticks) - boss retirement (retireAfterWaves 3, endless-only)");');
repOnce('lines.push("rules: .evidence/I570/rules569.md   generated ', 'lines.push("rules: .evidence/I571/rules571.md   generated ');
repOnce("waveTable: {}, bossDeaths: [], killingBlow: null, hitLog: [],",
        "waveTable: {}, bossDeaths: [], retires: [], killingBlow: null, hitLog: [],");
repOnce('} else if (ev.type === "bossDeath") {\n        r.bossDeaths.push({ kind: ev.data.kind, tick });',
        '} else if (ev.type === "bossDeath") {\n        r.bossDeaths.push({ kind: ev.data.kind, tick });\n      } else if (ev.type === "bossRetire") {\n        r.retires.push({ tick, kind: ev.data.kind, wave: w.waves.wave }); // rules571.md sec.1: telemetry capture (no RNG, no sim change)');
repOnce("    bossDeaths: r.bossDeaths,", "    bossDeaths: r.bossDeaths,\n    retires: r.retires,");
repOnce('writeFileSync(new URL("./results571.txt", import.meta.url), lines.join("\\n") + "\\n");',
`// ---------- L-A acceptance (rules571.md sec.3, frozen at I569) ----------
const accMed = med(deathWaves);
const wave10Cluster = runs.filter(r => r.died && r.killingBlow && r.killingBlow.wave === 10).length;
const reach13 = runs.filter(r => r.died && r.killingBlow && r.killingBlow.wave >= 13).length;
const maxSrc = Object.entries(tPrimary).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || ["none", 0];
const maxFrac = maxSrc[1] / runs.length;
lines.push("");
lines.push("L-A ACCEPTANCE (rules571.md sec.3, frozen at I569):");
lines.push("(a) median death wave >= 10: " + accMed + " -> " + (accMed !== null && accMed >= 10 ? "PASS" : "FAIL"));
lines.push("(b) wave-10 cluster <= 7/30: " + wave10Cluster + "/" + runs.length + " -> " + (wave10Cluster <= 7 ? "PASS" : "FAIL"));
lines.push("(c) max single source < 0.300 (" + maxSrc[0] + " " + maxSrc[1] + "/" + runs.length + " = " + maxFrac.toFixed(3) + "): " + (maxFrac < 0.3 ? "PASS" : (maxFrac >= 0.4 ? "FAIL (>= 0.400 -> C1)" : "BORDERLINE [0.300, 0.400) - registered, PASS")));
lines.push("(d) >= 2/30 reach wave >= 13: " + reach13 + "/" + runs.length + " -> " + (reach13 >= 2 ? "PASS" : "FAIL"));
lines.push("(e) 5-harness gate EXACT: verified separately this iteration (CLOSEGATE571, I565 pattern)");
const band89 = runs.filter(r => r.died && r.killingBlow && (r.killingBlow.wave === 8 || r.killingBlow.wave === 9) && ["gunship", "rock_L", "rock_M"].includes(r.killingBlow.clsPrimary)).length;
lines.push("");
lines.push("L-B TRIGGER READ (rules571.md sec.4, frozen I569): wave-8/9 band (gunship+rock_L+rock_M) = " + band89 + "/" + runs.length + ", median = " + accMed + " -> " + (band89 >= 4 && accMed !== null && accMed < 11 ? "TRIGGER (apply L-B at I572 + sweep572, seeds 57200+i)" : "NO TRIGGER (ST-538 VOID)"));
const retireTally = runs.reduce((acc, r) => { for (const x of r.retires) acc[x.kind] = (acc[x.kind] || 0) + 1; return acc; }, {});
lines.push("");
lines.push("RETIRES (telemetry): " + (Object.keys(retireTally).length ? JSON.stringify(retireTally) : "none") + "  (expected ~1-2 per run: Monolith w5->w8, Splicer w10->w13 while still alive)");
writeFileSync(new URL("./results571.txt", import.meta.url), lines.join("\\n") + "\\n");`);
fs.writeFileSync(path.join(__dirname, "sweep571.mjs"), src);
const stale = (src.match(/569/g) || []).length;
console.log("sweep571.mjs written:", src.length, "B; remaining '569' refs:", stale);
