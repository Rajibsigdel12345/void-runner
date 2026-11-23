// I581 / ST-548 (E82 open): fresh measurement over the authoritative sweep577 record
// (.evidence/I578/sweep577.json 103,926 B) - wave-5/6 band death detail:
// in-fight vs post-kill residual (bossDeaths tick delta), v-decode (aimed vs burst
// class, E81 extract573 lineage: v = base x recentMul, base 7 = burst, base 9 = aimed),
// resources, wave-5 start offset. Lineage of .evidence/I577/extract573.cjs.
// Docs-only; ZERO src; in-process; zero servers/tabs.
const fs = require("fs");
const d = JSON.parse(fs.readFileSync(".evidence/I578/sweep577.json", "utf8"));
const runs = d.runs;
const lines = [];
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
  band.push({
    seed: r.seed,
    wave: kb.wave,
    deathTick: kb.tick,
    source: kb.source,
    clsExact: kb.clsExact,
    clsPrimary: kb.clsPrimary,
    mp: kb.monolithProbable,
    monDeath: lastMon,
    inFight: inFight,
    delta: delta,
    offset: w5 ? kb.tick - w5.startTick : null,
    v: kb.attribDetail ? kb.attribDetail.v : null,
    base: base !== null ? Math.round(base * 1000) / 1000 : null,
    vcls: cls,
    lives: kb.resources.livesUsed,
    wlevel: kb.resources.weaponLevel,
    bombs: kb.resources.bombs,
    hwBoss: kb.heavyweight.boss
  });
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
const pkDeltas = band.filter(b => !b.inFight).map(b => b.delta).sort((a, b) => a - b);
lines.push("POST-KILL DELTAS (ticks after monolith death): [" + pkDeltas.join(", ") + "]");
const offsets = band.map(b => b.offset).sort((a, b) => a - b);
lines.push("OFFSET FROM W5 START (ticks): min=" + offsets[0] + " max=" + offsets[offsets.length - 1] + " (s = /60)");
fs.writeFileSync(".evidence/I581/extract581.txt", lines.join("\n") + "\n");
console.log(lines.join("\n"));
console.log("WROTE .evidence/I581/extract581.txt (" + (lines.join("\n") + "\n").length + " chars)");