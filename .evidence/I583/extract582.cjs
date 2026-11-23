// I583 / ST-550 (E82 APPLY round): FROZEN E82 acceptance (a)-(d) + wave-5/6 band
// death detail over the authoritative post-lever sweep582 record
// (.evidence/I583/sweep582.json). Acceptance metric code = the same predicates
// as sweep582.mjs (rules582.md sec.3/sec.5). Band detail: lineage of
// .evidence/I581/extract581.cjs. Docs-only; in-process; zero servers/tabs.
const fs = require("fs");
const d = JSON.parse(fs.readFileSync(".evidence/I583/sweep582.json", "utf8"));
const runs = d.runs;
const lines = [];
const med = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[s.length >> 1] : (s[(s.length >> 1) - 1] + s[s.length >> 1]) / 2; };
const b56 = runs.filter(r => r.died && r.killingBlow && (r.killingBlow.wave === 5 || r.killingBlow.wave === 6)).length;
const m56 = runs.filter(r => r.died && r.killingBlow && (r.killingBlow.wave === 5 || r.killingBlow.wave === 6) && r.killingBlow.clsPrimary === "MONOLITH").length;
const m56p = runs.filter(r => {
  if (!r.died || !r.killingBlow) return false;
  const kb = r.killingBlow;
  if (kb.wave !== 5 && kb.wave !== 6) return false;
  if (kb.clsPrimary === "MONOLITH") return true;
  if (kb.clsPrimary === "bullet_unknown") {
    return (r.bossDeaths || []).some(b => b.kind === "monolith" && b.tick <= kb.tick && kb.tick - b.tick <= 180);
  }
  return false;
}).length;
const diedN = runs.filter(r => r.died).length;
const deathWaves = runs.filter(r => r.died).map(r => r.killingBlow.wave);
const medWave = med(deathWaves);
const reach13 = runs.filter(r => {
  const reached = r.died
    ? r.killingBlow.wave
    : (Object.keys(r.waveTable).length ? Math.max(...Object.keys(r.waveTable).map(Number)) : 0);
  return reached >= 13;
}).length;
const accA = b56 <= 9, accB = m56p <= 7, accC = medWave !== null && medWave >= 9, accD = reach13 >= 3;
lines.push("ACCEPTANCE (rules582.md sec.3, FROZEN) on sweep582 (post-lever: boss.burst.every 4.0 -> 4.8):");
lines.push("(a) B56 <= 9/30 [baseline 11/30]: " + (accA ? "PASS" : "FAIL") + " - measured " + b56 + "/" + runs.length);
lines.push("(b) M56' <= 7/30 [baseline 11/30]: " + (accB ? "PASS" : "FAIL") + " - measured " + m56p + "/" + runs.length + " (M56 E81 def: " + m56 + "/" + runs.length + "; R-6 comparability only)");
lines.push("(c) median death wave >= 9: " + (accC ? "PASS" : "FAIL") + " - measured " + medWave + " (died " + diedN + "/" + runs.length + ")");
lines.push("(d) >= 3/30 reach wave >= 13 [sweep577 6/30; sweep581 1/30]: " + (accD ? "PASS" : "FAIL") + " - measured " + reach13 + "/" + runs.length);
lines.push("(e) 5-harness gate EXACT no re-pin: EXTERNAL (run_gate583.cjs)");
lines.push("VERDICT: " + (accA && accB && accC && accD ? "ALL (a)-(d) PASS -> keep the lever (then the (e) gate)" : "C1 -> git restore src/core/config.js + accept-with-documentation + P1/P2/P3 to E83+"));
const best = runs.filter(r => r.died).map(r => ({ seed: r.seed, wave: r.killingBlow.wave, score: r.killingBlow.score.score })).sort((a, b) => b.score - a.score).slice(0, 3);
lines.push("BEST RUNS: " + best.map(x => x.seed + " wave " + x.wave + " (" + x.score + " pts)").join(" / "));
const dist = {};
for (const r of runs) if (r.died && r.killingBlow) { const w = r.killingBlow.wave; dist[w] = (dist[w] || 0) + 1; }
lines.push("DEATH-WAVE DIST: " + JSON.stringify(Object.keys(dist).map(Number).sort((a, b) => a - b).map(w => "wave" + w + " x" + dist[w]).join(" / ")));
const tally = {};
for (const r of runs) if (r.died && r.killingBlow) { const c = r.killingBlow.clsPrimary; tally[c] = (tally[c] || 0) + 1; }
lines.push("KILLING-BLOW TALLY (primary): " + JSON.stringify(tally));
lines.push("");
const band = [];
for (const r of runs) {
  const kb = r.killingBlow;
  if (!kb) continue;
  if (kb.wave !== 5 && kb.wave !== 6) continue;
  const mon = (r.bossDeaths || []).filter(b => b.kind === "monolith");
  const lastMon = mon.length ? mon[mon.length - 1].tick : null;
  const inFight = lastMon === null || kb.tick < lastMon;
  const delta = lastMon === null ? null : kb.tick - lastMon;
  const w5 = (r.waveTable || {})["5"];
  let cls = null, base = null;
  if (kb.source === "bullet" && kb.attribDetail) {
    const ad = kb.attribDetail;
    const mul = (ad.recentMul && ad.recentMul.length) ? ad.recentMul[0] : 1;
    base = mul ? ad.v / mul : ad.v;
    const b = Math.round(base * 1000) / 1000;
    if (b === 7) cls = "burst-class";
    else if (b === 9) cls = "aimed-class";
    else cls = "ambiguous";
  }
  band.push({ seed: r.seed, wave: kb.wave, deathTick: kb.tick, source: kb.source, clsExact: kb.clsExact, clsPrimary: kb.clsPrimary, mp: kb.monolithProbable, monDeath: lastMon, inFight: inFight, delta: delta, offset: w5 ? kb.tick - w5.startTick : null, v: kb.attribDetail ? kb.attribDetail.v : null, base: base !== null ? Math.round(base * 1000) / 1000 : null, vcls: cls, lives: kb.resources.livesUsed, wlevel: kb.resources.weaponLevel, bombs: kb.resources.bombs, hwBoss: kb.heavyweight.boss });
}
lines.push("BAND DEATHS (wave in {5,6}): " + band.length + " of " + runs.length);
for (const b of band) {
  lines.push(
    "seed " + b.seed + ": wave " + b.wave + " tick " + b.deathTick +
    " source=" + b.source + " clsExact=" + b.clsExact + " clsPrimary=" + b.clsPrimary +
    (b.mp ? " [MP]" : "") +
    " monDeath=" + b.monDeath +
    " inFight=" + b.inFight +
    (b.delta !== null ? " postKillDelta=" + b.delta : "") +
    " offsetFromW5=" + b.offset +
    (b.v !== null ? " v=" + b.v + " base=" + b.base + " " + b.vcls : "") +
    " lives=" + b.lives + " wlevel=" + b.wlevel + " bombs=" + b.bombs +
    " hwBoss=" + JSON.stringify(b.hwBoss)
  );
}
const inF = band.filter(b => b.inFight).length;
const pk = band.filter(b => !b.inFight).length;
const monPrim = band.filter(b => b.clsPrimary === "MONOLITH").length;
const bolt = band.filter(b => b.source === "bullet").length;
const burst = band.filter(b => b.vcls === "burst-class").length;
const aimed = band.filter(b => b.vcls === "aimed-class").length;
const amb = band.filter(b => b.vcls === "ambiguous").length;
lines.push("SUMMARY: inFight=" + inF + " postKillResidual=" + pk + " MONOLITHprimary=" + monPrim + " boltSource=" + bolt + " of " + band.length);
lines.push("V-DECODE: burst-class=" + burst + " aimed-class=" + aimed + " ambiguous=" + amb + " (of " + band.length + " bolt-source deaths)");
fs.writeFileSync(".evidence/I583/extract582.txt", lines.join("\n") + "\n");
console.log(lines.join("\n"));
console.log("WROTE .evidence/I583/extract582.txt (" + (lines.join("\n") + "\n").length + " chars)");