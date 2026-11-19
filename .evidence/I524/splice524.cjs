// I524 / ST-490 - mechanical splice: .evidence/I521/seed62100.mjs -> .evidence/I524/balance524.mjs
// Guarantees the pilots + threat scan + runIsolated are BYTE-IDENTICAL to the I521
// frozen probe; only the trailing runner block is replaced and one fs import is
// inserted after the RNG import. Re-runnable; verifies its own output.
const fs = require("fs");
const path = require("path");
const here = __dirname;
const srcPath = path.join(here, "..", "I521", "seed62100.mjs");
const outPath = path.join(here, "balance524.mjs");
const src = fs.readFileSync(srcPath, "utf8");
const marker = "const rows = [];";
const mi = src.indexOf(marker);
if (mi <= 0) throw new Error("trailing-block marker not found");
const prefix = src.slice(0, mi);
for (const need of ["I328 frozen kiter", "I328 frozen aggro", "I328 frozen cautious", "function runIsolated", 'cond === "phantom1" ? 1 : 2']) {
  if (!prefix.includes(need)) throw new Error("missing expected region: " + need);
}
const importLine = 'import { RNG } from "../../src/core/rng.js";';
const ii = prefix.indexOf(importLine);
if (ii < 0) throw new Error("rng import not found");
const insertAt = ii + importLine.length;
const fsImport = '\nimport { writeFileSync } from "node:fs";';
const prefixNew = prefix.slice(0, insertAt) + fsImport + prefix.slice(insertAt);
const runner = `
// ---------------- I524 / ST-490 runner ----------------
// tag: process.argv[2] (default "run"). Conditions + seeds EXACT per
// .evidence/I524/rules.md: phantom1-kiter 62100+i x100, phantom1-aggro
// 62100+i x100, phantom2-kiter 72100+i x100.
const tag = process.argv[2] || "run";
const t0 = Date.now();
const out = { tag, dt: DT, isolCap: ISOL_CAP, runs: {} };
for (const key of ["phantom1-kiter", "phantom1-aggro", "phantom2-kiter"]) {
  const dash = key.indexOf("-");
  const cond = key.slice(0, dash);
  const pilotName = key.slice(dash + 1);
  const base = cond === "phantom1" ? 62100 : 72100;
  const rows = [];
  for (let i = 0; i < 100; i++) rows.push(runIsolated(cond, pilotName, base + i));
  const ttks = rows.filter(r => r.ttk !== null).map(r => r.ttk).sort((a, b) => a - b);
  const med = a => !a.length ? null : (a.length % 2 ? a[a.length >> 1] : (a[(a.length >> 1) - 1] + a[a.length >> 1]) / 2);
  const st = {
    n: rows.length,
    killed: ttks.length,
    expiredRuns: rows.filter(r => r.expired > 0).length,
    hitRuns: rows.filter(r => r.hits > 0).length,
    medianTTK: med(ttks),
    p90TTK: ttks.length ? ttks[Math.min(ttks.length - 1, Math.ceil(0.9 * ttks.length) - 1)] : null,
    deaths: rows.reduce((a, r) => a + r.hits, 0),
    deadRuns: rows.filter(r => r.dead).length,
    perSeed: rows.map(r => r.ttk === null ? "x" : (r.ttk * 60).toFixed(0)).join(" "),
  };
  out.runs[key] = st;
  console.log(key, JSON.stringify({ n: st.n, killed: st.killed, expiredRuns: st.expiredRuns, hitRuns: st.hitRuns, medianTTK: st.medianTTK, p90TTK: st.p90TTK, deaths: st.deaths, deadRuns: st.deadRuns }));
}
writeFileSync(new URL("./results524-" + tag + ".json", import.meta.url), JSON.stringify(out, null, 1));
console.log("tag " + tag + " written results524-" + tag + ".json total ms:", Date.now() - t0);
`;
const out2 = prefixNew + runner;
if (out2.includes("\r")) throw new Error("CR introduced");
fs.writeFileSync(outPath, out2, "utf8");
// self-verify: strip the inserted import and the runner -> must equal the original prefix
const v = fs.readFileSync(outPath, "utf8");
const v1 = v.replace(fsImport, "");
// NOTE: the output prefix is followed by the runner (which itself
  // contains 'const rows = [];'), so verify against the ORIGINAL marker index,
  // not a re-search.
  const v2 = v1.slice(0, mi);
if (v2 !== prefix) throw new Error("PREFIX VERIFICATION FAILED");
console.log("SPLICE OK balance524.mjs", v.length, "chars; prefix byte-identical (" + prefix.length + " chars)");